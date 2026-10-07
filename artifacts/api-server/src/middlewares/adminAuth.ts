import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { adminAssignmentsTable, db, type AdminAssignment } from "@workspace/db";

export type AdminRequest = Request & {
  admin?: AdminAssignment;
  actualAdmin?: AdminAssignment;
  userId?: string;
};

export const adminModulePermissions: Record<string, string[]> = {
  "Super Admin": ["Members", "Connect Team", "Branches", "Ministries", "Sermons & Media", "Events", "Finance & Giving", "Communication", "Digital Store", "Users & Roles", "Settings", "Audit Logs"],
  "Headquarters Admin": ["Members", "Connect Team", "Branches", "Ministries", "Sermons & Media", "Events", "Finance & Giving", "Communication", "Digital Store", "Audit Logs"],
  "Regional Admin": ["Members", "Connect Team", "Branches", "Ministries", "Events", "Communication", "Audit Logs"],
  "Branch Admin": ["Members", "Connect Team", "Branches", "Ministries", "Events", "Communication"],
  Pastor: ["Members", "Connect Team", "Branches", "Ministries", "Sermons & Media", "Events", "Communication"],
  "Pastoral Leadership": ["Members", "Connect Team", "Ministries", "Events", "Communication"],
  "Church Administrator": ["Members", "Connect Team", "Branches", "Ministries", "Events", "Communication", "Audit Logs"],
  "Connect Team Leader": ["Connect Team", "Members", "Communication"],
  "Connect Team Member": ["Connect Team"],
  "Ministry Leader": ["Members", "Ministries", "Events", "Communication", "Sermons & Media"],
  "Finance Team": ["Finance & Giving", "Members", "Audit Logs"],
  "Media Team": ["Sermons & Media", "Communication", "Events"],
  "Store Manager": ["Digital Store", "Events", "Audit Logs"],
  "Finance Administrator": ["Finance & Giving", "Members", "Audit Logs"],
  "Finance Team Member": ["Finance & Giving"],
  "Foundation School Administrator": ["Members", "Ministries", "Events", "Communication"],
  "Foundation School Team Member": ["Members", "Events"],
  "Ministries Administrator": ["Members", "Ministries", "Events", "Communication"],
  "Media Administrator": ["Sermons & Media", "Communication", "Events"],
  "Media Team Member": ["Sermons & Media"],
  "Events Administrator": ["Events", "Communication"],
  "Events Team Member": ["Events"],
  "Communications Administrator": ["Communication", "Events"],
  "Membership Administrator": ["Members", "Communication"],
  "Branch Administrator": ["Branches", "Members", "Events"],
  "Regular Member": [],
  Visitor: [],
};

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = auth.userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminAssignmentsTable)
    .where(eq(adminAssignmentsTable.clerkUserId, userId))
    .limit(1);
  if (!admin?.active || !adminModulePermissions[admin.role]) {
    res.status(403).json({ error: "No active Royalhouse administrator assignment" });
    return;
  }

  req.userId = userId;
  req.actualAdmin = admin;
  const previewRole = req.header("x-royalhouse-preview-role");
  req.admin =
    admin.role === "Super Admin" && previewRole && adminModulePermissions[previewRole]
      ? { ...admin, role: previewRole }
      : admin;
  next();
}

export function requireModule(module: string) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin || !adminModulePermissions[req.admin.role]?.includes(module)) {
      res.status(403).json({ error: `Your role cannot access ${module}` });
      return;
    }
    next();
  };
}