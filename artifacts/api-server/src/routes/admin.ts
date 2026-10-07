import { clerkClient, type User } from "@clerk/express";
import { Router, type IRouter, type NextFunction, type Response } from "express";
import { and, count, eq, ne, sql } from "drizzle-orm";
import {
  GetAdminProfileResponse,
  ListAdminUsersResponse,
  GrantAdminAccessBody,
  GrantAdminAccessResponse,
  UpdateAdminUserParams,
  UpdateAdminUserBody,
  UpdateAdminUserResponse,
  CreateBranchBody,
  CreateBranchResponse,
  UpdateBranchBody,
  UpdateBranchResponse,
  ArchiveBranchResponse,
} from "@workspace/api-zod";
import {
  adminAssignmentsTable,
  auditLogTable,
  branchesTable,
  db,
} from "@workspace/db";
import {
  adminModulePermissions,
  requireAdmin,
  requireModule,
  type AdminRequest,
} from "../middlewares/adminAuth";

const router: IRouter = Router();
router.use(requireAdmin);

function requireSuperAdmin(req: AdminRequest, res: Response, next: NextFunction): void {
  if (req.actualAdmin?.role !== "Super Admin" || req.admin?.role !== "Super Admin") {
    res.status(403).json({ error: "Super Admin access required" });
    return;
  }
  next();
}

function clerkUserToAdminUser(user: User | null, assignment: typeof adminAssignmentsTable.$inferSelect) {
  const primaryEmail =
    user?.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses.find((address) => address.verification?.status === "verified")?.emailAddress ??
    null;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  return {
    clerkUserId: assignment.clerkUserId,
    email: primaryEmail,
    fullName,
    role: assignment.role,
    active: assignment.active,
  };
}

async function getClerkUserOrNull(userId: string): Promise<User | null> {
  try {
    return await clerkClient.users.getUser(userId);
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function writeAssignmentAudit(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  actorId: string,
  assignmentId: string,
  targetUserId: string,
  role: string,
  active: boolean,
): Promise<void> {
  await tx.insert(auditLogTable).values({
    clerkUserId: actorId,
    action: active ? "admin.assignment.saved" : "admin.assignment.revoked",
    entityType: "admin_assignment",
    entityId: assignmentId,
    details: JSON.stringify({ targetClerkUserId: targetUserId, role, active }),
  });
}

router.get("/admin/me", (req: AdminRequest, res): void => {
  const admin = req.admin;
  if (!admin) {
    res.status(403).json({ error: "No active administrator assignment" });
    return;
  }
  res.json(GetAdminProfileResponse.parse({
    clerkUserId: admin.clerkUserId,
    role: req.actualAdmin?.role ?? admin.role,
    branchId: admin.branchId,
    modules: adminModulePermissions[req.admin?.role ?? admin.role],
  }));
});

router.get("/admin/users", requireModule("Users & Roles"), requireSuperAdmin, async (_req, res): Promise<void> => {
  try {
    const assignments = await db.select().from(adminAssignmentsTable);
    const users = await Promise.all(assignments.map(async (assignment) =>
      clerkUserToAdminUser(await getClerkUserOrNull(assignment.clerkUserId), assignment),
    ));
    res.json(ListAdminUsersResponse.parse(users));
  } catch (error) {
    res.status(502).json({ error: "Could not load administrator accounts from Clerk" });
  }
});

router.post("/admin/users", requireModule("Users & Roles"), requireSuperAdmin, async (req: AdminRequest, res): Promise<void> => {
  const parsed = GrantAdminAccessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  let matchingUsers: User[];
  try {
    const result = await clerkClient.users.getUserList({ emailAddress: [email], limit: 10 });
    matchingUsers = result.data.filter((user) =>
      user.emailAddresses.some((address) => address.emailAddress.toLowerCase() === email),
    );
  } catch {
    res.status(502).json({ error: "Could not verify this email with Clerk" });
    return;
  }

  if (matchingUsers.length !== 1) {
    res.status(404).json({ error: "No verified Clerk account found for this email. The person must sign up and verify this email first." });
    return;
  }
  const clerkUser = matchingUsers[0];
  const verifiedEmail = clerkUser.emailAddresses.some((address) =>
    address.emailAddress.toLowerCase() === email && address.verification?.status === "verified",
  );
  if (!verifiedEmail) {
    res.status(404).json({ error: "This Clerk account has not verified the requested email address." });
    return;
  }

  const assignment = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(539214701)`);
    const [existing] = await tx.select().from(adminAssignmentsTable)
      .where(eq(adminAssignmentsTable.clerkUserId, clerkUser.id))
      .limit(1);
    if (existing?.active && existing.role === "Super Admin" && parsed.data.role !== "Super Admin") {
      const [remaining] = await tx.select({ total: count() }).from(adminAssignmentsTable)
        .where(and(
          eq(adminAssignmentsTable.role, "Super Admin"),
          eq(adminAssignmentsTable.active, true),
          ne(adminAssignmentsTable.clerkUserId, clerkUser.id),
        ));
      if (remaining.total === 0) return null;
    }

    const [saved] = existing
      ? await tx.update(adminAssignmentsTable)
          .set({ role: parsed.data.role, active: true, updatedAt: new Date() })
          .where(eq(adminAssignmentsTable.clerkUserId, clerkUser.id))
          .returning()
      : await tx.insert(adminAssignmentsTable)
          .values({ clerkUserId: clerkUser.id, role: parsed.data.role, active: true })
          .returning();
    await writeAssignmentAudit(tx, req.userId!, saved.id, clerkUser.id, saved.role, saved.active);
    return saved;
  });

  if (!assignment) {
    res.status(409).json({ error: "Cannot demote the last active Super Admin" });
    return;
  }
  res.status(201).json(GrantAdminAccessResponse.parse(clerkUserToAdminUser(clerkUser, assignment)));
});

router.patch("/admin/users/:clerkUserId", requireModule("Users & Roles"), requireSuperAdmin, async (req: AdminRequest, res): Promise<void> => {
  const parsedParams = UpdateAdminUserParams.safeParse(req.params);
  const parsedBody = UpdateAdminUserBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success || Object.keys(parsedBody.data ?? {}).length === 0) {
    res.status(400).json({ error: "Provide a valid Clerk user ID and at least one change." });
    return;
  }

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(539214701)`);
    const [current] = await tx.select().from(adminAssignmentsTable)
      .where(eq(adminAssignmentsTable.clerkUserId, parsedParams.data.clerkUserId))
      .limit(1);
    if (!current) return { kind: "not_found" as const };

    const role = parsedBody.data.role ?? current.role;
    const active = parsedBody.data.active ?? current.active;
    if (current.active && current.role === "Super Admin" && (!active || role !== "Super Admin")) {
      const [remaining] = await tx.select({ total: count() }).from(adminAssignmentsTable)
        .where(and(
          eq(adminAssignmentsTable.role, "Super Admin"),
          eq(adminAssignmentsTable.active, true),
          ne(adminAssignmentsTable.clerkUserId, current.clerkUserId),
        ));
      if (remaining.total === 0) return { kind: "last_super_admin" as const };
    }

    const [updated] = await tx.update(adminAssignmentsTable)
      .set({ role, active, updatedAt: new Date() })
      .where(eq(adminAssignmentsTable.clerkUserId, current.clerkUserId))
      .returning();
    await writeAssignmentAudit(tx, req.userId!, updated.id, updated.clerkUserId, updated.role, updated.active);
    return { kind: "updated" as const, assignment: updated };
  });

  if (result.kind === "not_found") {
    res.status(404).json({ error: "Administrator assignment not found" });
    return;
  }
  if (result.kind === "last_super_admin") {
    res.status(409).json({ error: "Cannot remove or demote the last active Super Admin" });
    return;
  }

  try {
    const user = await getClerkUserOrNull(result.assignment.clerkUserId);
    res.json(UpdateAdminUserResponse.parse(clerkUserToAdminUser(user, result.assignment)));
  } catch {
    res.status(502).json({ error: "Access was updated, but Clerk account details could not be loaded" });
  }
});

router.post("/admin/branches", requireModule("Branches"), async (req: AdminRequest, res): Promise<void> => {
  const parsed = CreateBranchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [branch] = await db.insert(branchesTable).values({
    ...parsed.data,
    featured: parsed.data.featured ?? false,
  }).returning();
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action: "branch.created",
    entityType: "branch",
    entityId: branch.id,
    details: JSON.stringify({ name: branch.name }),
  });
  res.status(201).json(CreateBranchResponse.parse(branch));
});

router.patch("/admin/branches/:id", requireModule("Branches"), async (req: AdminRequest, res): Promise<void> => {
  const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBranchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [branch] = await db.update(branchesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(branchesTable.id, branchId))
    .returning();
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action: "branch.updated",
    entityType: "branch",
    entityId: branch.id,
    details: JSON.stringify(parsed.data),
  });
  res.json(UpdateBranchResponse.parse(branch));
});

router.post("/admin/branches/:id/archive", requireModule("Branches"), async (req: AdminRequest, res): Promise<void> => {
  const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [branch] = await db.update(branchesTable)
    .set({ archived: true, updatedAt: new Date() })
    .where(and(eq(branchesTable.id, branchId), eq(branchesTable.archived, false)))
    .returning();
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action: "branch.archived",
    entityType: "branch",
    entityId: branch.id,
  });
  res.json(ArchiveBranchResponse.parse(branch));
});

export default router;