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

export const peopleTable = pgTable("royalhouse_people", {
  id: uuid("id").defaultRandom().primaryKey(),
  branchId: uuid("branch_id").references(() => branchesTable.id, { onDelete: "set null" }),
  personType: text("person_type").notNull().default("visitor"),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  visitorId: text("visitor_id").unique(),
  memberId: text("member_id").unique(),
  visitorStatus: text("visitor_status").notNull().default("new"),
  membershipStatus: text("membership_status").notNull().default("not_member"),
  firstVisitAt: timestamp("first_visit_at", { withTimezone: true }),
  lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
  foundationSchoolStatus: text("foundation_school_status").notNull().default("not_started"),
  notes: text("notes"),
  prayerNeeds: text("prayer_needs"),
  pastoralFollowUp: boolean("pastoral_follow_up").notNull().default(false),
  tags: text("tags").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const connectAssignmentsTable = pgTable("royalhouse_connect_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => peopleTable.id, { onDelete: "cascade" }),
  assignedClerkUserId: text("assigned_clerk_user_id").notNull(),
  assignedByClerkUserId: text("assigned_by_clerk_user_id").notNull(),
  status: text("status").notNull().default("active"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const connectInteractionsTable = pgTable("royalhouse_connect_interactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => peopleTable.id, { onDelete: "cascade" }),
  actorClerkUserId: text("actor_clerk_user_id").notNull(),
  interactionType: text("interaction_type").notNull().default("call"),
  outcomeCode: text("outcome_code").notNull(),
  situationCodes: text("situation_codes").notNull().default("[]"),
  prayerNeeded: boolean("prayer_needed").notNull().default(false),
  pastoralAttention: boolean("pastoral_attention").notNull().default(false),
  visitationRequested: boolean("visitation_requested").notNull().default(false),
  foundationSchoolInterest: boolean("foundation_school_interest").notNull().default(false),
  notes: text("notes"),
  nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const connectFollowUpsTable = pgTable("royalhouse_connect_follow_ups", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => peopleTable.id, { onDelete: "cascade" }),
  interactionId: uuid("interaction_id").references(() => connectInteractionsTable.id, { onDelete: "set null" }),
  assignedClerkUserId: text("assigned_clerk_user_id"),
  followUpType: text("follow_up_type").notNull().default("general"),
  status: text("status").notNull().default("pending"),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workflowOptionsTable = pgTable("royalhouse_workflow_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  active: boolean("active").notNull().default(true),
  triggerConfig: text("trigger_config").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("royalhouse_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientClerkUserId: text("recipient_clerk_user_id").notNull(),
  notificationType: text("notification_type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BranchRecord = typeof branchesTable.$inferSelect;
export type AdminAssignment = typeof adminAssignmentsTable.$inferSelect;
export type PersonRecord = typeof peopleTable.$inferSelect;
export type ConnectAssignment = typeof connectAssignmentsTable.$inferSelect;
export type ConnectInteraction = typeof connectInteractionsTable.$inferSelect;
export type ConnectFollowUp = typeof connectFollowUpsTable.$inferSelect;
export type WorkflowOption = typeof workflowOptionsTable.$inferSelect;