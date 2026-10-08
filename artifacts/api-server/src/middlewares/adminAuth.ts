import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  adminAssignmentsTable,
  adminDepartmentsTable,
  adminRolesTable,
  db,
  type AdminAssignment,
  type AdminRoleConfigRecord,
} from "@workspace/db";

export type AdminRequest = Request & {
  admin?: AdminAssignment;
  actualAdmin?: AdminAssignment;
  effectiveRole?: AdminRoleConfigRecord;
  adminModules?: string[];
  adminCapabilities?: string[];
  userId?: string;
};

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminAssignmentsTable)
      .where(eq(adminAssignmentsTable.clerkUserId, userId))
      .limit(1);
    if (!admin?.active) {
      res.status(403).json({ error: "No active Royalhouse administrator assignment" });
      return;
    }

    const [assignedRole] = await db.select({ role: adminRolesTable, departmentActive: adminDepartmentsTable.active })
      .from(adminRolesTable)
      .innerJoin(adminDepartmentsTable, eq(adminRolesTable.departmentId, adminDepartmentsTable.id))
      .where(and(eq(adminRolesTable.name, admin.role), eq(adminRolesTable.active, true), eq(adminDepartmentsTable.active, true)))
      .limit(1);
    if (!assignedRole?.role.grantable) {
      res.status(403).json({ error: "Your administrator role is no longer active or assignable" });
      return;
    }

    let effectiveRole = assignedRole.role;
    const previewRoleName = req.header("x-royalhouse-preview-role");
    if (admin.role === "Super Admin" && previewRoleName) {
      const [previewRole] = await db.select({ role: adminRolesTable, departmentActive: adminDepartmentsTable.active })
        .from(adminRolesTable)
        .innerJoin(adminDepartmentsTable, eq(adminRolesTable.departmentId, adminDepartmentsTable.id))
        .where(and(
          eq(adminRolesTable.name, previewRoleName),
          eq(adminRolesTable.active, true),
          eq(adminDepartmentsTable.active, true),
        ))
        .limit(1);
      if (!previewRole) {
        res.status(403).json({ error: "That department role is not available for preview" });
        return;
      }
      effectiveRole = previewRole.role;
    }

    req.userId = userId;
    req.actualAdmin = admin;
    req.admin = { ...admin, role: effectiveRole.name };
    req.effectiveRole = effectiveRole;
    req.adminModules = effectiveRole.modules;
    req.adminCapabilities = effectiveRole.capabilities;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireModule(module: string) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin || !req.adminModules?.includes(module)) {
      res.status(403).json({ error: `Your role cannot access ${module}` });
      return;
    }
    next();
  };
}

export function requireCapability(capability: string) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin || !req.adminCapabilities?.includes(capability)) {
      res.status(403).json({ error: `Your role cannot perform this action (${capability})` });
      return;
    }
    next();
  };
}

export function requireSuperAdmin(req: AdminRequest, res: Response, next: NextFunction): void {
  if (req.actualAdmin?.role !== "Super Admin" || req.admin?.role !== "Super Admin") {
    res.status(403).json({ error: "Super Admin access required" });
    return;
  }
  next();
}