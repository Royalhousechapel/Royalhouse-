import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  GetAdminProfileResponse,
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

router.get("/admin/me", (req: AdminRequest, res): void => {
  const admin = req.admin;
  if (!admin) {
    res.status(403).json({ error: "No active administrator assignment" });
    return;
  }
  res.json(GetAdminProfileResponse.parse({
    clerkUserId: admin.clerkUserId,
    role: admin.role,
    branchId: admin.branchId,
    modules: adminModulePermissions[admin.role],
  }));
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