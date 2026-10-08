import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db, peopleTable, auditLogTable } from "@workspace/db";
import {
  GetVisitorProfileResponse, RegisterVisitorBody, RegisterVisitorResponse,
  RequestVisitorMembershipResponse, ListAdminVisitorsResponse, ApproveVisitorMembershipResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireModule, requireCapability, type AdminRequest } from "../middlewares/adminAuth";
import {
  ChurchIdentityError, churchId, isCommittedPerson, lockChurchIdentity,
  registerChurchVisitor, sendChurchIdentityError, visitorIdentity,
} from "../lib/churchIdentity";

const router: IRouter = Router();
interface VisitorRequest extends Request { visitorUserId?: string; verifiedEmail?: string }

async function requireVerifiedVisitor(req: VisitorRequest, res: Response, next: NextFunction): Promise<void> {
  const userId = getAuth(req).userId;
  if (!userId) { res.status(401).json({ error: "Sign in before registering your visit." }); return; }
  try {
    const user = await clerkClient.users.getUser(userId);
    const primary = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId && email.verification?.status === "verified");
    if (!primary) { res.status(403).json({ error: "Verify your primary account email before continuing." }); return; }
    req.visitorUserId = userId;
    req.verifiedEmail = primary.emailAddress;
    next();
  } catch {
    res.status(503).json({ error: "Account verification could not be checked. Please try again." });
  }
}

router.get("/visitor/profile", requireVerifiedVisitor, async (req: VisitorRequest, res): Promise<void> => {
  const [person] = await db.select().from(peopleTable).where(eq(peopleTable.clerkUserId, req.visitorUserId!)).limit(1);
  res.json(GetVisitorProfileResponse.parse({ profile: person ? visitorIdentity(person) : null }));
});

router.post("/visitor/profile", requireVerifiedVisitor, async (req: VisitorRequest, res): Promise<void> => {
  const parsed = RegisterVisitorBody.safeParse(req.body);
  if (!parsed.success || parsed.data.fullName.trim().length < 2) {
    res.status(400).json({ error: "Enter your full name and a valid optional contact number." }); return;
  }
  try {
    const person = await registerChurchVisitor(
      { clerkUserId: req.visitorUserId!, verifiedEmail: req.verifiedEmail! }, parsed.data,
    );
    res.json(RegisterVisitorResponse.parse(visitorIdentity(person)));
  } catch (error) { if (!sendChurchIdentityError(error, res)) throw error; }
});

router.post("/visitor/membership-request", requireVerifiedVisitor, async (req: VisitorRequest, res): Promise<void> => {
  const person = await db.transaction(async (tx) => {
    await lockChurchIdentity(tx);
    const [existing] = await tx.select().from(peopleTable).where(eq(peopleTable.clerkUserId, req.visitorUserId!)).limit(1);
    if (!existing || isCommittedPerson(existing) || existing.membershipRequestedAt) return existing;
    const [requested] = await tx.update(peopleTable).set({
      membershipRequestedAt: new Date(), updatedAt: new Date(),
    }).where(eq(peopleTable.id, existing.id)).returning();
    await tx.insert(auditLogTable).values({
      clerkUserId: req.visitorUserId!, action: "visitor.membership_requested",
      entityType: "person", entityId: existing.id,
    });
    return requested;
  });
  if (!person) { res.status(404).json({ error: "Complete your visitor registration first." }); return; }
  res.json(RequestVisitorMembershipResponse.parse(visitorIdentity(person)));
});

router.get("/admin/visitors", requireAdmin, requireModule("Members"), async (req: AdminRequest, res): Promise<void> => {
  if (req.query.pendingOnly !== undefined && !["true", "false"].includes(String(req.query.pendingOnly))) {
    res.status(400).json({ error: "Invalid visitor filter." }); return;
  }
  const conditions = [eq(peopleTable.personType, "visitor"), eq(peopleTable.membershipStatus, "not_member")];
  if (req.admin?.branchId) conditions.push(eq(peopleTable.branchId, req.admin.branchId));
  if (req.query.pendingOnly === "true") conditions.push(isNotNull(peopleTable.membershipRequestedAt));
  const people = await db.select().from(peopleTable).where(and(...conditions)).orderBy(desc(peopleTable.createdAt));
  res.json(ListAdminVisitorsResponse.parse(people.map(visitorIdentity)));
});

router.post("/admin/visitors/:id/approve-membership", requireAdmin, requireModule("Members"), requireCapability("members.create"), async (req: AdminRequest, res): Promise<void> => {
  const id = String(req.params.id);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(400).json({ error: "Provide a valid visitor ID." }); return;
  }
  try {
    const person = await db.transaction(async (tx) => {
      await lockChurchIdentity(tx);
      const [existing] = await tx.select().from(peopleTable).where(eq(peopleTable.id, id)).limit(1);
      if (!existing) throw new ChurchIdentityError("Visitor not found.", 404);
      if (req.admin?.branchId && existing.branchId !== req.admin.branchId) throw new ChurchIdentityError("This visitor is outside your assigned branch.", 403);
      if (isCommittedPerson(existing) && existing.memberId) return existing;
      if (!existing.membershipRequestedAt) throw new ChurchIdentityError("The visitor must request membership before approval.", 409);
      const [member] = await tx.update(peopleTable).set({
        personType: "member", membershipStatus: "active",
        visitorId: existing.visitorId || churchId("V", id),
        memberId: existing.memberId || churchId("M", id),
        membershipApprovedAt: new Date(), updatedAt: new Date(),
      }).where(eq(peopleTable.id, id)).returning();
      await tx.insert(auditLogTable).values({
        clerkUserId: req.userId!, action: "visitor.membership_approved",
        entityType: "person", entityId: id,
      });
      return member;
    });
    res.json(ApproveVisitorMembershipResponse.parse(visitorIdentity(person)));
  } catch (error) { if (!sendChurchIdentityError(error, res)) throw error; }
});

export default router;
