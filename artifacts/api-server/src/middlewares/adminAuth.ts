import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { adminAssignmentsTable, db, type AdminAssignment } from "@workspace/db";

export type AdminRequest = Request & {
  admin?: AdminAssignment;
  userId?: string;
};

export const adminModulePermissions: Record<string, string[]> = {
  "Super Admin": ["Members", "Branches", "Ministries", "Sermons & Media", "Events", "Finance & Giving", "Communication", "Digital Store", "Users & Roles", "Settings", "Audit Logs"],
  "Headquarters Admin": ["Members", "Branches", "Ministries", "Sermons & Media", "Events", "Finance & Giving", "Communication", "Digital Store", "Audit Logs"],
  "Regional Admin": ["Members", "Branches", "Ministries", "Events", "Communication", "Audit Logs"],
  "Branch Admin": ["Members", "Branches", "Ministries", "Events", "Communication"],
  Pastor: ["Members", "Branches", "Ministries", "Sermons & Media", "Events", "Communication"],
  "Ministry Leader": ["Members", "Ministries", "Events", "Communication", "Sermons & Media"],
  "Finance Team": ["Finance & Giving", "Members", "Audit Logs"],
  "Media Team": ["Sermons & Media", "Communication", "Events"],
  "Store Manager": ["Digital Store", "Events", "Audit Logs"],
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
  req.admin = admin;
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