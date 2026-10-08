import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { db, peopleTable, branchesTable, auditLogTable } from "@workspace/db";

type Person = typeof peopleTable.$inferSelect;
type PersonInput = typeof peopleTable.$inferInsert;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ChurchIdentityError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export function normalizeEmail(email?: string | null): string | null {
  return email?.trim().toLowerCase() || null;
}

export function normalizePhone(phone?: string | null): string | null {
  return phone?.replace(/[^0-9]/g, "").replace(/^00/, "") || null;
}

export function isCommittedPerson(person: Pick<Person, "personType" | "membershipStatus">): boolean {
  return person.personType === "member" || person.membershipStatus !== "not_member";
}

export function churchId(kind: "V" | "M", id: string): string {
  return `RH-${kind}-${id.toUpperCase()}`;
}

// These expressions match the database unique indexes, including legacy records.
const emailIdentity = sql<string>`nullif(lower(btrim(${peopleTable.email})), '')`;
const phoneIdentity = sql<string>`nullif(regexp_replace(regexp_replace(coalesce(${peopleTable.phone}, ''), '[^0-9]', '', 'g'), '^00', '', ''), '')`;

function contactValues(input: Pick<PersonInput, "email" | "phone">) {
  const email = normalizeEmail(input.email);
  const phoneKey = normalizePhone(input.phone);
  if (!email && !phoneKey) {
    throw new ChurchIdentityError("Enter an email or international phone number so duplicate records can be prevented.", 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ChurchIdentityError("Enter a valid email address.", 400);
  }
  if (phoneKey && (!/^(?:\+|00)[\d\s().-]+$/.test(input.phone!.trim()) || phoneKey.length < 8 || phoneKey.length > 15)) {
    throw new ChurchIdentityError("Use an international phone number, including + and the country code.", 400);
  }
  return { email, phone: phoneKey ? `+${phoneKey}` : null };
}

export async function lockChurchIdentity(tx: Transaction): Promise<void> {
  // Serializes application writers across processes; unique indexes also protect
  // against concurrent external writers. It never merges by name or by phone.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('royalhouse-people-identity'))`);
}

async function assertContactsAvailable(tx: Transaction, email: string | null, phone: string | null, exceptId?: string) {
  const conditions = [];
  if (email) conditions.push(eq(emailIdentity, email));
  const phoneKey = normalizePhone(phone);
  if (phoneKey) conditions.push(eq(phoneIdentity, phoneKey));
  if (!conditions.length) return;
  const [duplicate] = await tx.select({ id: peopleTable.id }).from(peopleTable)
    .where(and(or(...conditions), exceptId ? ne(peopleTable.id, exceptId) : undefined)).limit(1);
  if (duplicate) throw new ChurchIdentityError("This contact is already registered. Use the existing record or ask the church team to review it.", 409);
}

async function validateBranch(tx: Transaction, branchId?: string | null) {
  if (!branchId) return;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(branchId)) throw new ChurchIdentityError("Choose a valid church branch.", 400);
  const [branch] = await tx.select({ id: branchesTable.id }).from(branchesTable)
    .where(and(eq(branchesTable.id, branchId), eq(branchesTable.archived, false))).limit(1);
  if (!branch) throw new ChurchIdentityError("Choose an active church branch.", 400);
}

async function insertPerson(tx: Transaction, input: PersonInput) {
  const contacts = contactValues(input);
  const fullName = input.fullName.trim();
  if (!fullName || fullName.length > 140) throw new ChurchIdentityError("Enter a name of up to 140 characters.", 400);
  await validateBranch(tx, input.branchId);
  await assertContactsAvailable(tx, contacts.email, contacts.phone);
  const id = randomUUID();
  const member = input.personType === "member";
  const [person] = await tx.insert(peopleTable).values({
    ...input,
    ...contacts,
    id,
    fullName,
    personType: member ? "member" : "visitor",
    membershipStatus: member ? "active" : "not_member",
    visitorId: churchId("V", id),
    memberId: member ? churchId("M", id) : null,
    membershipApprovedAt: member ? new Date() : null,
  }).returning();
  return person;
}

export async function createChurchPerson(input: PersonInput): Promise<Person> {
  return db.transaction(async (tx) => {
    await lockChurchIdentity(tx);
    return insertPerson(tx, input);
  });
}

export async function updateChurchPerson(id: string, changes: Partial<PersonInput>): Promise<Person> {
  return db.transaction(async (tx) => {
    await lockChurchIdentity(tx);
    const [existing] = await tx.select().from(peopleTable).where(eq(peopleTable.id, id)).limit(1);
    if (!existing) throw new ChurchIdentityError("Person not found.", 404);
    const contacts = contactValues({
      email: changes.email === undefined ? existing.email : changes.email,
      phone: changes.phone === undefined ? existing.phone : changes.phone,
    });
    await assertContactsAvailable(tx, contacts.email, contacts.phone, id);
    await validateBranch(tx, changes.branchId);
    const fullName = changes.fullName === undefined ? existing.fullName : changes.fullName.trim();
    if (!fullName || fullName.length > 140) throw new ChurchIdentityError("Enter a valid name.", 400);
    const [person] = await tx.update(peopleTable).set({
      ...changes, ...contacts, fullName, updatedAt: new Date(),
    }).where(eq(peopleTable.id, id)).returning();
    return person;
  });
}

export async function registerChurchVisitor(identity: { clerkUserId: string; verifiedEmail: string }, input: { fullName: string; phone?: string }): Promise<Person> {
  return db.transaction(async (tx) => {
    await lockChurchIdentity(tx);
    const [owned] = await tx.select().from(peopleTable).where(eq(peopleTable.clerkUserId, identity.clerkUserId)).limit(1);
    if (owned) return owned;
    const email = normalizeEmail(identity.verifiedEmail)!;
    const [existing] = await tx.select().from(peopleTable).where(eq(emailIdentity, email)).limit(1);
    if (existing?.clerkUserId && existing.clerkUserId !== identity.clerkUserId) {
      throw new ChurchIdentityError("This registration needs church staff review. Do not create another record.", 409);
    }
    let person: Person;
    if (existing) {
      // Proof is verified email ownership, NOT matching a name or an unverified phone.
      const [claimed] = await tx.update(peopleTable).set({
        clerkUserId: identity.clerkUserId,
        visitorId: existing.visitorId || churchId("V", existing.id),
        memberId: isCommittedPerson(existing) ? existing.memberId || churchId("M", existing.id) : existing.memberId,
        updatedAt: new Date(),
      }).where(eq(peopleTable.id, existing.id)).returning();
      person = claimed;
    } else {
      person = await insertPerson(tx, {
        fullName: input.fullName, email, phone: input.phone,
        clerkUserId: identity.clerkUserId, personType: "visitor", firstVisitAt: new Date(),
      });
    }
    await tx.insert(auditLogTable).values({
      clerkUserId: identity.clerkUserId,
      action: existing ? "visitor.claimed_existing_record" : "visitor.registered",
      entityType: "person", entityId: person.id,
    });
    return person;
  });
}

export function visitorIdentity(person: Person) {
  return {
    id: person.id, fullName: person.fullName, email: person.email, phone: person.phone,
    branchId: person.branchId, visitorId: person.visitorId, memberId: person.memberId,
    personType: person.personType, membershipStatus: person.membershipStatus,
    registrationState: isCommittedPerson(person) ? "member" as const : person.membershipRequestedAt ? "requested" as const : "visitor" as const,
    membershipRequestedAt: person.membershipRequestedAt, membershipApprovedAt: person.membershipApprovedAt,
  };
}

export function sendChurchIdentityError(error: unknown, res: Response): boolean {
  if (error instanceof ChurchIdentityError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  const candidate = error as { code?: string; cause?: { code?: string } };
  if (candidate?.code === "23505" || candidate?.cause?.code === "23505") {
    res.status(409).json({ error: "This contact or identity is already registered. Use the existing record." });
    return true;
  }
  return false;
}
