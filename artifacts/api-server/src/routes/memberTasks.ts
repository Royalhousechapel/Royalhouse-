import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, ne, or } from "drizzle-orm";
import {
  CompleteDepartmentTaskParams,
  CompleteDepartmentTaskResponse,
  CreateAdminMemberBody,
  CreateAdminMemberResponse,
  CreateDepartmentTaskBody,
  CreateDepartmentTaskResponse,
  ListAdminMembersQueryParams,
  ListAdminMembersResponse,
  ListAdminAuditLogsResponse,
  ListDepartmentTasksResponse,
  UpdateAdminMemberBody,
  UpdateAdminMemberParams,
  UpdateAdminMemberResponse,
} from "@workspace/api-zod";
import {
  auditLogTable,
  branchesTable,
  db,
  departmentTasksTable,
  peopleTable,
} from "@workspace/db";
import { requireAdmin, requireCapability, requireModule, type AdminRequest } from "../middlewares/adminAuth";

const router: IRouter = Router();
router.use(requireAdmin);

function paramId(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function isMemberRecord(person: typeof peopleTable.$inferSelect): boolean {
  return person.personType === "member" || person.membershipStatus !== "not_member";
}

function memberResponse(person: typeof peopleTable.$inferSelect) {
  return {
    ...person,
    notes: null,
    prayerNeeds: null,
    pastoralFollowUp: false,
    tags: [],
  };
}

async function audit(req: AdminRequest, action: string, entityType: string, entityId: string, details: unknown): Promise<void> {
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action,
    entityType,
    entityId,
    details: JSON.stringify(details),
  });
}

router.get("/admin/members", requireModule("Members"), async (req: AdminRequest, res): Promise<void> => {
  const query = ListAdminMembersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid member search." });
    return;
  }
  const conditions = [or(eq(peopleTable.personType, "member"), ne(peopleTable.membershipStatus, "not_member"))!];
  if (req.admin?.branchId) conditions.push(eq(peopleTable.branchId, req.admin.branchId));
  if (query.data.search?.trim()) {
    const term = `%${query.data.search.trim()}%`;
    conditions.push(or(
      ilike(peopleTable.fullName, term),
      ilike(peopleTable.email, term),
      ilike(peopleTable.phone, term),
      ilike(peopleTable.memberId, term),
    )!);
  }
  const people = await db.select().from(peopleTable).where(and(...conditions)).orderBy(desc(peopleTable.updatedAt));
  res.json(ListAdminMembersResponse.parse(people.map(memberResponse)));
});

router.post("/admin/members", requireModule("Members"), requireCapability("members.create"), async (req: AdminRequest, res): Promise<void> => {
  const parsed = CreateAdminMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid member name and profile." });
    return;
  }
  const branchId = req.admin?.branchId ?? parsed.data.branchId ?? null;
  if (req.admin?.branchId && parsed.data.branchId && parsed.data.branchId !== req.admin.branchId) {
    res.status(403).json({ error: "You can only add members to your assigned branch." });
    return;
  }
  if (branchId) {
    const [branch] = await db.select({ id: branchesTable.id }).from(branchesTable)
      .where(and(eq(branchesTable.id, branchId), eq(branchesTable.archived, false))).limit(1);
    if (!branch) {
      res.status(400).json({ error: "Choose an active branch." });
      return;
    }
  }
  const [person] = await db.insert(peopleTable).values({
    branchId,
    personType: "member",
    fullName: parsed.data.fullName.trim(),
    phone: parsed.data.phone?.trim() || null,
    email: parsed.data.email?.trim().toLowerCase() || null,
    membershipStatus: "active",
    notes: parsed.data.notes?.trim() || null,
  }).returning();
  await audit(req, "member.created", "person", person.id, { fullName: person.fullName });
  res.status(201).json(CreateAdminMemberResponse.parse(memberResponse(person)));
});

router.patch("/admin/members/:id", requireModule("Members"), requireCapability("members.update"), async (req: AdminRequest, res): Promise<void> => {
  const parsedParams = UpdateAdminMemberParams.safeParse(req.params);
  const parsed = UpdateAdminMemberBody.safeParse(req.body);
  if (!parsedParams.success || !parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: "Provide a valid member ID and at least one change." });
    return;
  }
  const [existing] = await db.select().from(peopleTable).where(eq(peopleTable.id, parsedParams.data.id)).limit(1);
  if (!existing || !isMemberRecord(existing)) {
    res.status(404).json({ error: "Member not found." });
    return;
  }
  if (req.admin?.branchId && existing.branchId !== req.admin.branchId) {
    res.status(403).json({ error: "This member is outside your assigned branch." });
    return;
  }
  if (req.admin?.branchId && parsed.data.branchId && parsed.data.branchId !== req.admin.branchId) {
    res.status(403).json({ error: "You can only assign members to your assigned branch." });
    return;
  }
  if (parsed.data.branchId) {
    const [branch] = await db.select({ id: branchesTable.id }).from(branchesTable)
      .where(and(eq(branchesTable.id, parsed.data.branchId), eq(branchesTable.archived, false))).limit(1);
    if (!branch) {
      res.status(400).json({ error: "Choose an active branch." });
      return;
    }
  }
  const [person] = await db.update(peopleTable).set({
    ...parsed.data,
    fullName: parsed.data.fullName?.trim(),
    email: parsed.data.email?.trim().toLowerCase(),
    phone: parsed.data.phone?.trim(),
    notes: parsed.data.notes?.trim(),
    updatedAt: new Date(),
  }).where(eq(peopleTable.id, existing.id)).returning();
  await audit(req, "member.updated", "person", person.id, parsed.data);
  res.json(UpdateAdminMemberResponse.parse(memberResponse(person)));
});

router.get("/admin/department-tasks", requireModule("Department Tasks"), async (req: AdminRequest, res): Promise<void> => {
  if (!req.effectiveRole) {
    res.status(403).json({ error: "An active department role is required." });
    return;
  }
  const tasks = req.adminCapabilities?.includes("tasks.view_all_departments")
    ? await db.select().from(departmentTasksTable).orderBy(desc(departmentTasksTable.updatedAt))
    : await db.select().from(departmentTasksTable)
      .where(eq(departmentTasksTable.departmentId, req.effectiveRole.departmentId))
      .orderBy(desc(departmentTasksTable.updatedAt));
  res.json(ListDepartmentTasksResponse.parse(tasks));
});

router.post("/admin/department-tasks", requireModule("Department Tasks"), requireCapability("tasks.manage"), async (req: AdminRequest, res): Promise<void> => {
  const parsed = CreateDepartmentTaskBody.safeParse(req.body);
  if (!parsed.success || !req.effectiveRole) {
    res.status(400).json({ error: "Enter a valid task title and due date." });
    return;
  }
  const [task] = await db.insert(departmentTasksTable).values({
    departmentId: req.effectiveRole.departmentId,
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() || null,
    dueAt: parsed.data.dueAt,
    createdByClerkUserId: req.userId!,
  }).returning();
  await audit(req, "department_task.created", "department_task", task.id, { departmentId: task.departmentId, title: task.title });
  res.status(201).json(CreateDepartmentTaskResponse.parse(task));
});

router.post("/admin/department-tasks/:id/complete", requireModule("Department Tasks"), requireCapability("tasks.manage"), async (req: AdminRequest, res): Promise<void> => {
  const parsedParams = CompleteDepartmentTaskParams.safeParse(req.params);
  if (!parsedParams.success || !req.effectiveRole) {
    res.status(400).json({ error: "Provide a valid task ID." });
    return;
  }
  const [existing] = await db.select().from(departmentTasksTable)
    .where(eq(departmentTasksTable.id, parsedParams.data.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Task not found." });
    return;
  }
  if (!req.adminCapabilities?.includes("tasks.view_all_departments") &&
      existing.departmentId !== req.effectiveRole.departmentId) {
    res.status(403).json({ error: "This task is outside your department." });
    return;
  }
  const [task] = await db.update(departmentTasksTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(departmentTasksTable.id, existing.id))
    .returning();
  await audit(req, "department_task.completed", "department_task", task.id, { title: task.title });
  res.json(CompleteDepartmentTaskResponse.parse(task));
});

router.get("/admin/audit-logs", requireModule("Audit Logs"), requireCapability("audit.view"), async (_req, res): Promise<void> => {
  const logs = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(100);
  res.json(ListAdminAuditLogsResponse.parse(logs));
});

export default router;
