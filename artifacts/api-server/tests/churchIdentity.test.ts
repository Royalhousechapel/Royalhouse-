import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { eq, inArray } from "drizzle-orm";
import { db, pool, peopleTable, auditLogTable } from "@workspace/db";
import {
  ChurchIdentityError, createChurchPerson, updateChurchPerson,
  registerChurchVisitor, normalizeEmail, normalizePhone,
} from "../src/lib/churchIdentity";

test("church identities are idempotent, claimable only by verified email, and unique across staff entry and edits", async () => {
  const suffix = randomUUID().replaceAll("-", "");
  const email = `identity-${suffix}@example.invalid`;
  const otherEmail = `identity-other-${suffix}@example.invalid`;
  const clerkId = `test-identity-${suffix}`;
  const phone = `+1999${Date.now().toString().slice(-10)}`;
  const ids: string[] = [];
  const conflict = (error: unknown) => error instanceof ChurchIdentityError && error.status === 409;
  try {
    assert.equal(normalizeEmail(" Person@Example.COM "), "person@example.com");
    assert.equal(normalizePhone("00 233 (24) 123-4567"), normalizePhone("+233241234567"));
    const concurrent = await Promise.allSettled([
      createChurchPerson({ fullName: "Identity regression fixture", email, phone }),
      createChurchPerson({ fullName: "Identity regression fixture", email: email.toUpperCase(), phone }),
    ]);
    const successes = concurrent.filter((r) => r.status === "fulfilled");
    for (const result of successes) if (result.status === "fulfilled") ids.push(result.value.id);
    assert.equal(successes.length, 1, "concurrent duplicate submission must create one record");
    const existing = successes[0];
    assert.equal(existing.status, "fulfilled");
    if (existing.status !== "fulfilled") throw Error("Fixture missing");
    const original = existing.value;

    const claimed = await registerChurchVisitor({ clerkUserId: clerkId, verifiedEmail: email }, { fullName: "Do not overwrite staff name" });
    assert.equal(claimed.id, original.id);
    assert.equal(claimed.visitorId, original.visitorId);
    assert.equal(claimed.fullName, original.fullName);
    const repeated = await registerChurchVisitor({ clerkUserId: clerkId, verifiedEmail: email }, { fullName: "Repeated registration" });
    assert.equal(repeated.id, original.id);
    await assert.rejects(
      registerChurchVisitor({ clerkUserId: `${clerkId}-other`, verifiedEmail: email }, { fullName: "Different account" }), conflict,
    );
    await assert.rejects(
      registerChurchVisitor({ clerkUserId: `${clerkId}-phone-only`, verifiedEmail: otherEmail }, { fullName: "Unverified phone claim", phone }), conflict,
    );
    // Direct database writes are protected too, not just this service.
    await assert.rejects(db.insert(peopleTable).values({
      fullName: "Constraint regression fixture", email: ` ${email.toUpperCase()} `,
    }), (error: unknown) => {
      const e = error as { code?: string; cause?: { code?: string } };
      return e.code === "23505" || e.cause?.code === "23505";
    });

    // Names alone are not identities: two distinct people can have the same name.
    const other = await createChurchPerson({ fullName: original.fullName, email: otherEmail });
    ids.push(other.id);
    assert.notEqual(other.id, original.id);
    await assert.rejects(updateChurchPerson(other.id, { email }), conflict);
    await assert.rejects(updateChurchPerson(other.id, { phone }), conflict);
    await assert.rejects(updateChurchPerson(other.id, { email: null, phone: null }),
      (e: unknown) => e instanceof ChurchIdentityError && e.status === 400);
    const updated = await updateChurchPerson(other.id, { email: otherEmail.toUpperCase() });
    assert.equal(updated.email, otherEmail);

    const member = await createChurchPerson({ fullName: "Member regression fixture", email: `identity-member-${suffix}@example.invalid`, personType: "member" });
    ids.push(member.id);
    assert.ok(member.memberId?.startsWith("RH-M-"));
    assert.ok(member.visitorId?.startsWith("RH-V-"));
    const [counted] = await db.select({ id: peopleTable.id }).from(peopleTable).where(eq(peopleTable.email, email));
    assert.equal(counted.id, original.id);
  } finally {
    if (ids.length) {
      await db.delete(auditLogTable).where(inArray(auditLogTable.entityId, ids));
      await db.delete(peopleTable).where(inArray(peopleTable.id, ids));
    }
    await pool.end();
  }
});
