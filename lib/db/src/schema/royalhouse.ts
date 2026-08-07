import {
  boolean,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const branchesTable = pgTable("royalhouse_branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  pastor: text("pastor").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  featured: boolean("featured").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAssignmentsTable = pgTable("royalhouse_admin_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  role: text("role").notNull(),
  branchId: uuid("branch_id").references(() => branchesTable.id, { onDelete: "set null" }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogTable = pgTable("royalhouse_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BranchRecord = typeof branchesTable.$inferSelect;
export type AdminAssignment = typeof adminAssignmentsTable.$inferSelect;