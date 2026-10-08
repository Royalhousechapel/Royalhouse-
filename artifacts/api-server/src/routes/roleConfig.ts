import { Router, type IRouter, type Response } from "express";
import { and, asc, count, eq } from "drizzle-orm";
import {
  CreateAdminDepartmentBody,
  CreateAdminDepartmentResponse,
  CreateAdminRoleBody,
  CreateAdminRoleResponse,
  GetAdminRoleConfigResponse,
  UpdateAdminDepartmentBody,
  UpdateAdminDepartmentParams,
  UpdateAdminDepartmentResponse,
  UpdateAdminRoleBody,
  UpdateAdminRoleParams,
  UpdateAdminRoleResponse,
} from "@workspace/api-zod";
import {
  adminAssignmentsTable,
  adminDepartmentsTable,
  adminRolesTable,
  auditLogTable,
  db,
} from "@workspace/db";
import { requireAdmin, requireSuperAdmin, type AdminRequest } from "../middlewares/adminAuth";
import { adminCapabilityCatalog, adminModuleCatalog, validateRolePermissions } from "../lib/adminRoleCatalog";

const router: IRouter = Router();
router.use(requireAdmin, requireSuperAdmin);

function paramId(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function publicRole(role: typeof adminRolesTable.$inferSelect) {
  return {
    id: role.id,
    departmentId: role.departmentId,
    name: role.name,
    modules: role.modules,
    capabilities: role.capabilities,
    grantable: role.grantable,
    active: role.active,
    system: role.system,
  };
}

async function writeConfigAudit(req: AdminRequest, action: string, entityType: string, entityId: string, details: unknown) {
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action,
    entityType,
    entityId,
    details: JSON.stringify(details),
  });
}

function sendValidationError(res: Response, error: { message: string }) {
  res.status(400).json({ error: error.message });
}

router.get("/admin/role-config", async (_req, res): Promise<void> => {
  const [departments, roles] = await Promise.all([
    db.select().from(adminDepartmentsTable).orderBy(asc(adminDepartmentsTable.name)),
    db.select().from(adminRolesTable).orderBy(asc(adminRolesTable.name)),
  ]);
  res.json(GetAdminRoleConfigResponse.parse({
    departments: departments.map((department) => ({
      id: department.id,
      name: department.name,
      active: department.active,
      roles: roles.filter((role) => role.departmentId === department.id).map(publicRole),
    })),
    availableModules: adminModuleCatalog,
    availableCapabilities: adminCapabilityCatalog,
  }));
});

router.post("/admin/departments", async (req: AdminRequest, res): Promise<void> => {
  const parsed = CreateAdminDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const name = parsed.data.name.trim();
  if (!name) {
    res.status(400).json({ error: "Enter a department name." });
    return;
  }
  const [existing] = await db.select({ id: adminDepartmentsTable.id })
    .from(adminDepartmentsTable)
    .where(eq(adminDepartmentsTable.name, name))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "A department with that name already exists." });
    return;
  }
  const [department] = await db.insert(adminDepartmentsTable).values({ name }).returning();
  await writeConfigAudit(req, "admin.department.created", "admin_department", department.id, { name });
  res.status(201).json(CreateAdminDepartmentResponse.parse({
    id: department.id,
    name: department.name,
    active: department.active,
    roles: [],
  }));
});

router.patch("/admin/departments/:id", async (req: AdminRequest, res): Promise<void> => {
  const parsedParams = UpdateAdminDepartmentParams.safeParse(req.params);
  const parsed = UpdateAdminDepartmentBody.safeParse(req.body);
  if (!parsedParams.success || !parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: "Provide a valid department ID and at least one change." });
    return;
  }
  const id = parsedParams.data.id;
  if (parsed.data.active === false) {
    const [activeAssignments] = await db.select({ total: count() })
      .from(adminAssignmentsTable)
      .innerJoin(adminRolesTable, eq(adminAssignmentsTable.role, adminRolesTable.name))
      .where(and(eq(adminRolesTable.departmentId, id), eq(adminAssignmentsTable.active, true)));
    if (Number(activeAssignments?.total ?? 0) > 0) {
      res.status(409).json({ error: "Move or remove active admin assignments before deactivating this department." });
      return;
    }
  }
  const [department] = await db.update(adminDepartmentsTable)
    .set({ ...parsed.data, name: parsed.data.name?.trim(), updatedAt: new Date() })
    .where(eq(adminDepartmentsTable.id, id))
    .returning();
  if (!department) {
    res.status(404).json({ error: "Department not found." });
    return;
  }
  await writeConfigAudit(req, "admin.department.updated", "admin_department", id, parsed.data);
  const roles = await db.select().from(adminRolesTable).where(eq(adminRolesTable.departmentId, id)).orderBy(asc(adminRolesTable.name));
  res.json(UpdateAdminDepartmentResponse.parse({
    id: department.id,
    name: department.name,
    active: department.active,
    roles: roles.map(publicRole),
  }));
});

router.post("/admin/roles", async (req: AdminRequest, res): Promise<void> => {
  const parsed = CreateAdminRoleBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const value = {
    ...parsed.data,
    name: parsed.data.name.trim(),
    grantable: parsed.data.grantable ?? false,
  };
  const issue = validateRolePermissions(value);
  if (issue) {
    res.status(400).json({ error: issue });
    return;
  }
  const [department] = await db.select().from(adminDepartmentsTable)
    .where(and(eq(adminDepartmentsTable.id, value.departmentId), eq(adminDepartmentsTable.active, true)))
    .limit(1);
  if (!department) {
    res.status(400).json({ error: "Choose an active department." });
    return;
  }
  const [duplicate] = await db.select({ id: adminRolesTable.id })
    .from(adminRolesTable)
    .where(eq(adminRolesTable.name, value.name))
    .limit(1);
  if (duplicate) {
    res.status(409).json({ error: "A role with that name already exists." });
    return;
  }
  const [role] = await db.insert(adminRolesTable).values({
    departmentId: value.departmentId,
    name: value.name,
    modules: value.modules,
    capabilities: value.capabilities,
    grantable: value.grantable,
  }).returning();
  await writeConfigAudit(req, "admin.role.created", "admin_role", role.id, {
    departmentId: role.departmentId,
    name: role.name,
    modules: role.modules,
    capabilities: role.capabilities,
    grantable: role.grantable,
  });
  res.status(201).json(CreateAdminRoleResponse.parse(publicRole(role)));
});

router.patch("/admin/roles/:id", async (req: AdminRequest, res): Promise<void> => {
  const parsedParams = UpdateAdminRoleParams.safeParse(req.params);
  const parsed = UpdateAdminRoleBody.safeParse(req.body);
  if (!parsedParams.success || !parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: "Provide a valid role ID and at least one change." });
    return;
  }
  const [current] = await db.select().from(adminRolesTable)
    .where(eq(adminRolesTable.id, parsedParams.data.id))
    .limit(1);
  if (!current) {
    res.status(404).json({ error: "Role not found." });
    return;
  }
  if (current.system) {
    res.status(409).json({ error: "The Super Admin system role is protected and cannot be edited." });
    return;
  }
  const next = {
    name: parsed.data.name?.trim() ?? current.name,
    modules: parsed.data.modules ?? current.modules,
    capabilities: parsed.data.capabilities ?? current.capabilities,
    grantable: parsed.data.grantable ?? current.grantable,
    system: current.system,
  };
  const issue = validateRolePermissions(next);
  if (issue) {
    res.status(400).json({ error: issue });
    return;
  }
  const departmentId = parsed.data.departmentId ?? current.departmentId;
  const [department] = await db.select({ id: adminDepartmentsTable.id })
    .from(adminDepartmentsTable)
    .where(and(eq(adminDepartmentsTable.id, departmentId), eq(adminDepartmentsTable.active, true)))
    .limit(1);
  if (!department) {
    res.status(400).json({ error: "Choose an active department." });
    return;
  }
  const [activeAssignments] = await db.select({ total: count() })
    .from(adminAssignmentsTable)
    .where(and(eq(adminAssignmentsTable.role, current.name), eq(adminAssignmentsTable.active, true)));
  const [allAssignments] = await db.select({ total: count() })
    .from(adminAssignmentsTable)
    .where(eq(adminAssignmentsTable.role, current.name));
  if (Number(activeAssignments?.total ?? 0) > 0 &&
      (parsed.data.active === false || parsed.data.grantable === false)) {
    res.status(409).json({ error: "Move active admin assignments before deactivating or making this role non-grantable." });
    return;
  }
  if (Number(allAssignments?.total ?? 0) > 0 && next.name !== current.name) {
    res.status(409).json({ error: "Move all existing admin assignments before renaming this role." });
    return;
  }
  const [duplicate] = await db.select({ id: adminRolesTable.id })
    .from(adminRolesTable)
    .where(and(eq(adminRolesTable.name, next.name), eq(adminRolesTable.id, parsedParams.data.id)))
    .limit(1);
  if (!duplicate && next.name !== current.name) {
    const [sameName] = await db.select({ id: adminRolesTable.id })
      .from(adminRolesTable)
      .where(eq(adminRolesTable.name, next.name))
      .limit(1);
    if (sameName) {
      res.status(409).json({ error: "A role with that name already exists." });
      return;
    }
  }
  const [role] = await db.update(adminRolesTable)
    .set({ ...next, departmentId, active: parsed.data.active ?? current.active, updatedAt: new Date() })
    .where(eq(adminRolesTable.id, current.id))
    .returning();
  await writeConfigAudit(req, "admin.role.updated", "admin_role", role.id, parsed.data);
  res.json(UpdateAdminRoleResponse.parse(publicRole(role)));
});

export default router;
