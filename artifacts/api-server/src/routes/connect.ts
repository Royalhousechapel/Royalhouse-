import { Router, type IRouter } from "express";
import { and, count, desc, eq, gte, ilike, inArray, lt, or } from "drizzle-orm";
import {
  connectAssignmentsTable,
  connectFollowUpsTable,
  connectInteractionsTable,
  db,
  auditLogTable,
  notificationsTable,
  peopleTable,
  workflowOptionsTable,
} from "@workspace/db";
import {
  AssignConnectPersonBody,
  AssignConnectPersonResponse,
  CompleteConnectFollowUpResponse,
  GetConnectPersonProfileResponse,
  GetConnectSummaryResponse,
  CreateConnectPersonBody,
  CreateConnectPersonResponse,
  ListConnectNotificationsResponse,
  MarkConnectNotificationReadParams,
  MarkConnectNotificationReadResponse,
  ListConnectWorkflowOptionsResponse,
  ListConnectPeopleResponse,
  LogConnectInteractionBody,
  LogConnectInteractionResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireCapability, requireModule, type AdminRequest } from "../middlewares/adminAuth";
import { createChurchPerson, sendChurchIdentityError, churchId } from "../lib/churchIdentity";

const router: IRouter = Router();
router.use(requireAdmin, requireModule("Connect Team"));

function paramId(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function dateOrUndefined(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function scopedPersonIds(req: AdminRequest): Promise<string[] | null> {
  if (req.adminCapabilities?.includes("connect.view_all")) return null;
  const assignments = await db
    .select({ personId: connectAssignmentsTable.personId })
    .from(connectAssignmentsTable)
    .where(and(
      eq(connectAssignmentsTable.assignedClerkUserId, req.userId!),
      eq(connectAssignmentsTable.status, "active"),
    ));
  return assignments.map((item) => item.personId);
}

async function assertPersonAccess(req: AdminRequest, personId: string): Promise<boolean> {
  const ids = await scopedPersonIds(req);
  return ids === null || ids.includes(personId);
}

router.get("/admin/connect/options", async (_req, res): Promise<void> => {
  const options = await db
    .select()
    .from(workflowOptionsTable)
    .where(eq(workflowOptionsTable.active, true))
    .orderBy(workflowOptionsTable.category, workflowOptionsTable.label);
  res.json(ListConnectWorkflowOptionsResponse.parse(options.map((option) => ({
    ...option,
    triggerConfig: JSON.parse(option.triggerConfig),
  }))));
});

router.get("/admin/connect/people", async (req: AdminRequest, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const personIds = await scopedPersonIds(req);
  if (personIds && personIds.length === 0) {
    res.json([]);
    return;
  }
  const conditions = [];
  if (personIds) conditions.push(inArray(peopleTable.id, personIds));
  if (req.admin?.branchId) conditions.push(eq(peopleTable.branchId, req.admin.branchId));
  if (search) {
    conditions.push(or(
      ilike(peopleTable.fullName, `%${search}%`),
      ilike(peopleTable.phone, `%${search}%`),
      ilike(peopleTable.email, `%${search}%`),
      ilike(peopleTable.memberId, `%${search}%`),
      ilike(peopleTable.visitorId, `%${search}%`),
    ));
  }
  const people = await db
    .select()
    .from(peopleTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(peopleTable.updatedAt));
  res.json(ListConnectPeopleResponse.parse(people.map((person) => ({
    ...person,
    tags: parseJsonArray(person.tags),
  }))));
});

router.get("/admin/connect/summary", async (req: AdminRequest, res): Promise<void> => {
  const personIds = await scopedPersonIds(req);
  if (personIds && personIds.length === 0) {
      res.json(GetConnectSummaryResponse.parse({
      peopleCount: 0, assignedCount: 0, unassignedCount: 0, callsToday: 0,
      pendingFollowUps: 0, overdueFollowUps: 0, pastoralAttentionCount: 0,
    }));
    return;
  }
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);
  const personFilter = personIds ? inArray(peopleTable.id, personIds) : undefined;
  const [peopleCount, assignedCount, pendingFollowUps, overdueFollowUps, pastoralAttentionCount, callsToday] = await Promise.all([
    db.select({ value: count() }).from(peopleTable).where(personFilter),
    db.select({ value: count() }).from(connectAssignmentsTable).where(and(
      eq(connectAssignmentsTable.status, "active"),
      personIds ? inArray(connectAssignmentsTable.personId, personIds) : undefined,
    )),
    db.select({ value: count() }).from(connectFollowUpsTable).where(and(
      eq(connectFollowUpsTable.status, "pending"),
      personIds ? inArray(connectFollowUpsTable.personId, personIds) : undefined,
    )),
    db.select({ value: count() }).from(connectFollowUpsTable).where(and(
      eq(connectFollowUpsTable.status, "pending"),
      lt(connectFollowUpsTable.dueAt, startToday),
      personIds ? inArray(connectFollowUpsTable.personId, personIds) : undefined,
    )),
    db.select({ value: count() }).from(peopleTable).where(and(
      eq(peopleTable.pastoralFollowUp, true),
      personFilter,
    )),
    db.select({ value: count() }).from(connectInteractionsTable).where(and(
      personIds ? inArray(connectInteractionsTable.personId, personIds) : undefined,
      gte(connectInteractionsTable.createdAt, startToday),
      lt(connectInteractionsTable.createdAt, startTomorrow),
    )),
  ]);
  const totalPeople = Number(peopleCount[0]?.value ?? 0);
  const totalAssigned = Number(assignedCount[0]?.value ?? 0);
  res.json(GetConnectSummaryResponse.parse({
    peopleCount: totalPeople,
    assignedCount: totalAssigned,
    unassignedCount: Math.max(0, totalPeople - totalAssigned),
    callsToday: Number(callsToday[0]?.value ?? 0),
    pendingFollowUps: Number(pendingFollowUps[0]?.value ?? 0),
    overdueFollowUps: Number(overdueFollowUps[0]?.value ?? 0),
    pastoralAttentionCount: Number(pastoralAttentionCount[0]?.value ?? 0),
  }));
});

router.get("/admin/connect/notifications", async (req: AdminRequest, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.recipientClerkUserId, req.userId!))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(ListConnectNotificationsResponse.parse(notifications));
});

router.post("/admin/connect/notifications/:id/read", async (req: AdminRequest, res): Promise<void> => {
  const parsedParams = MarkConnectNotificationReadParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: "Provide a valid notification ID." });
    return;
  }
  const [notification] = await db.update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(notificationsTable.id, parsedParams.data.id),
      eq(notificationsTable.recipientClerkUserId, req.userId!),
    ))
    .returning();
  if (!notification) {
    const [exists] = await db.select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(eq(notificationsTable.id, parsedParams.data.id))
      .limit(1);
    res.status(exists ? 403 : 404).json({ error: exists ? "This notification belongs to another account." : "Notification not found." });
    return;
  }
  res.json(MarkConnectNotificationReadResponse.parse(notification));
});

router.post("/admin/connect/people", requireCapability("connect.create_people"), async (req: AdminRequest, res): Promise<void> => {
  const parsed = CreateConnectPersonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (req.admin?.branchId && parsed.data.branchId && parsed.data.branchId !== req.admin.branchId) {
    res.status(403).json({ error: "You can only register people in your assigned branch." }); return;
  }
  const member = parsed.data.personType === "member" || (parsed.data.membershipStatus && parsed.data.membershipStatus !== "not_member");
  if (member && !req.adminCapabilities?.includes("members.create")) {
    res.status(403).json({ error: "Member creation permission is required to grant permanent membership." }); return;
  }
  if (parsed.data.personType && !["visitor", "member"].includes(parsed.data.personType)) {
    res.status(400).json({ error: "Choose visitor or member." }); return;
  }
  try {
  const person = await createChurchPerson({
    ...parsed.data,
    personType: member ? "member" : "visitor",
    branchId: req.admin?.branchId ?? parsed.data.branchId ?? null,
    firstVisitAt: dateOrUndefined(parsed.data.firstVisitAt),
    lastVisitAt: dateOrUndefined(parsed.data.lastVisitAt),
    tags: JSON.stringify(parsed.data.tags ?? []),
  });
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action: "person.created",
    entityType: "person",
    entityId: person.id,
    details: JSON.stringify({ personType: person.personType }),
  });
  res.status(201).json(CreateConnectPersonResponse.parse({ ...person, tags: parseJsonArray(person.tags) }));
  } catch (error) { if (!sendChurchIdentityError(error, res)) throw error; }
});

router.get("/admin/connect/people/:id", async (req: AdminRequest, res): Promise<void> => {
  const personId = paramId(req.params.id);
  if (!(await assertPersonAccess(req, personId))) {
    res.status(403).json({ error: "This person is outside your Connect Team assignment scope" });
    return;
  }
  const [person] = await db.select().from(peopleTable).where(eq(peopleTable.id, personId)).limit(1);
  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  const [assignments, interactions, followUps] = await Promise.all([
    db.select().from(connectAssignmentsTable).where(eq(connectAssignmentsTable.personId, personId)).orderBy(desc(connectAssignmentsTable.createdAt)),
    db.select().from(connectInteractionsTable).where(eq(connectInteractionsTable.personId, personId)).orderBy(desc(connectInteractionsTable.createdAt)),
    db.select().from(connectFollowUpsTable).where(eq(connectFollowUpsTable.personId, personId)).orderBy(desc(connectFollowUpsTable.dueAt)),
  ]);
  res.json(GetConnectPersonProfileResponse.parse({
    person: { ...person, tags: parseJsonArray(person.tags) },
    assignments,
    interactions: interactions.map((interaction) => ({ ...interaction, situationCodes: parseJsonArray(interaction.situationCodes) })),
    followUps,
  }));
});

router.post("/admin/connect/people/:id/assign", requireCapability("connect.assign"), async (req: AdminRequest, res): Promise<void> => {
  const personId = paramId(req.params.id);
  const parsed = AssignConnectPersonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [person] = await db.select({ id: peopleTable.id }).from(peopleTable).where(eq(peopleTable.id, personId)).limit(1);
  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  if (!(await assertPersonAccess(req, personId))) {
    res.status(403).json({ error: "This person is outside your Connect Team assignment scope" });
    return;
  }
  await db.update(connectAssignmentsTable)
    .set({ status: "reassigned", updatedAt: new Date() })
    .where(and(eq(connectAssignmentsTable.personId, personId), eq(connectAssignmentsTable.status, "active")));
  const [assignment] = await db.insert(connectAssignmentsTable).values({
    personId,
    assignedClerkUserId: parsed.data.assignedClerkUserId,
    assignedByClerkUserId: req.userId!,
    dueAt: dateOrUndefined(parsed.data.dueAt),
  }).returning();
  await db.insert(notificationsTable).values({
    recipientClerkUserId: parsed.data.assignedClerkUserId,
    notificationType: "connect_assignment",
    title: "New Connect Team assignment",
    body: "A person has been assigned to your Connect Team workload.",
    entityType: "person",
    entityId: personId,
  });
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action: "connect.assignment.created",
    entityType: "person",
    entityId: personId,
    details: JSON.stringify({ assignedClerkUserId: parsed.data.assignedClerkUserId }),
  });
  res.status(201).json(AssignConnectPersonResponse.parse(assignment));
});

router.post("/admin/connect/people/:id/interactions", requireCapability("connect.log_interactions"), async (req: AdminRequest, res): Promise<void> => {
  const personId = paramId(req.params.id);
  if (!(await assertPersonAccess(req, personId))) {
    res.status(403).json({ error: "This person is outside your Connect Team assignment scope" });
    return;
  }
  const parsed = LogConnectInteractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const selectedCodes = [
    parsed.data.outcomeCode,
    ...(parsed.data.situationCodes ?? []),
    ...(parsed.data.prayerNeeded ? ["needs_prayer"] : []),
    ...(parsed.data.pastoralAttention ? ["pastoral_follow_up"] : []),
    ...(parsed.data.visitationRequested ? ["visitation_requested"] : []),
    ...(parsed.data.foundationSchoolInterest ? ["foundation_school_interest"] : []),
  ];
  const options = await db.select().from(workflowOptionsTable).where(and(
    eq(workflowOptionsTable.active, true),
    inArray(workflowOptionsTable.code, selectedCodes),
  ));
  const triggers = options.map((option) => {
    try { return JSON.parse(option.triggerConfig) as Record<string, unknown>; } catch { return {}; }
  });
  const followUpTriggers = triggers.filter((trigger) => typeof trigger.followUpType === "string");
  const personUpdates: Record<string, unknown> = { updatedAt: new Date() };
  if (triggers.some((trigger) => trigger.pastoralFollowUp === true)) personUpdates.pastoralFollowUp = true;
  if (triggers.some((trigger) => trigger.membershipStatus === "member")) {
    if (!req.adminCapabilities?.includes("members.create")) {
      res.status(403).json({ error: "Member approval permission is required for this outcome." }); return;
    }
    const [existing] = await db.select().from(peopleTable).where(eq(peopleTable.id, personId)).limit(1);
    if (!existing || (req.admin?.branchId && existing.branchId !== req.admin.branchId)) {
      res.status(403).json({ error: "This person is outside your assigned branch." }); return;
    }
    personUpdates.membershipStatus = "active";
    personUpdates.personType = "member";
    personUpdates.memberId = existing.memberId || churchId("M", personId);
    personUpdates.visitorId = existing.visitorId || churchId("V", personId);
    personUpdates.membershipApprovedAt = existing.membershipApprovedAt || new Date();
  }
  if (parsed.data.foundationSchoolInterest || triggers.some((trigger) => trigger.followUpType === "foundation_school")) {
    personUpdates.foundationSchoolStatus = "interested";
  }
  const [interaction] = await db.insert(connectInteractionsTable).values({
    personId,
    actorClerkUserId: req.userId!,
    interactionType: parsed.data.interactionType ?? "call",
    outcomeCode: parsed.data.outcomeCode,
    situationCodes: JSON.stringify(parsed.data.situationCodes ?? []),
    prayerNeeded: parsed.data.prayerNeeded ?? false,
    pastoralAttention: parsed.data.pastoralAttention ?? false,
    visitationRequested: parsed.data.visitationRequested ?? false,
    foundationSchoolInterest: parsed.data.foundationSchoolInterest ?? false,
    notes: parsed.data.notes,
    nextFollowUpAt: dateOrUndefined(parsed.data.nextFollowUpAt),
  }).returning();
  await db.update(peopleTable).set(personUpdates).where(eq(peopleTable.id, personId));
  const activeAssignment = await db.select({ clerkUserId: connectAssignmentsTable.assignedClerkUserId })
    .from(connectAssignmentsTable)
    .where(and(eq(connectAssignmentsTable.personId, personId), eq(connectAssignmentsTable.status, "active")))
    .limit(1);
  const assignedClerkUserId = activeAssignment[0]?.clerkUserId ?? req.userId;
  const followUps = [];
  const followUpTypes = [...new Set([
    ...followUpTriggers.map((trigger) => String(trigger.followUpType)),
    ...(parsed.data.nextFollowUpAt ? ["general"] : []),
  ])];
  for (const followUpType of followUpTypes) {
    const triggerDate = followUpType === "general"
      ? dateOrUndefined(parsed.data.nextFollowUpAt) ?? new Date(Date.now() + 3 * 86400000)
      : dateOrUndefined(parsed.data.nextFollowUpAt) ?? new Date(Date.now() + 3 * 86400000);
    const [followUp] = await db.insert(connectFollowUpsTable).values({
      personId,
      interactionId: interaction.id,
      assignedClerkUserId,
      followUpType,
      dueAt: triggerDate,
      notes: parsed.data.notes,
    }).returning();
    followUps.push(followUp);
  }
  for (const trigger of triggers) {
    if (typeof trigger.notifyRole === "string" && assignedClerkUserId) {
      await db.insert(notificationsTable).values({
        recipientClerkUserId: assignedClerkUserId,
        notificationType: "connect_trigger",
        title: `${String(trigger.notifyRole)} attention requested`,
        body: "A Connect Team interaction created a follow-up requiring attention.",
        entityType: "person",
        entityId: personId,
      });
    }
  }
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action: "connect.interaction.logged",
    entityType: "person",
    entityId: personId,
    details: JSON.stringify({ outcomeCode: parsed.data.outcomeCode, situationCodes: parsed.data.situationCodes }),
  });
  res.status(201).json(LogConnectInteractionResponse.parse({
    interaction: { ...interaction, situationCodes: parseJsonArray(interaction.situationCodes) },
    followUps,
  }));
});

router.post("/admin/connect/follow-ups/:id/complete", requireCapability("connect.complete_follow_ups"), async (req: AdminRequest, res): Promise<void> => {
  const followUpId = paramId(req.params.id);
  const [followUp] = await db.select().from(connectFollowUpsTable).where(eq(connectFollowUpsTable.id, followUpId)).limit(1);
  if (!followUp) {
    res.status(404).json({ error: "Follow-up not found" });
    return;
  }
  if (!(await assertPersonAccess(req, followUp.personId))) {
    res.status(403).json({ error: "This follow-up is outside your Connect Team assignment scope" });
    return;
  }
  const [updated] = await db.update(connectFollowUpsTable)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(connectFollowUpsTable.id, followUpId))
    .returning();
  await db.insert(auditLogTable).values({
    clerkUserId: req.userId!,
    action: "connect.follow_up.completed",
    entityType: "follow_up",
    entityId: followUpId,
  });
  res.json(CompleteConnectFollowUpResponse.parse(updated));
});

export default router;