import {
  adminDepartmentsTable,
  adminRolesTable,
  branchesTable,
  db,
  workflowOptionsTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

const seedBranches = [
  ["International Headquarters (Ahenfie)", "Ghana", "Greater Accra Region", "Accra", "Oil Dome · Ring Road West · Accra, Ghana", "Apostle General Sam Korankye Ankrah", 5.56, -0.2, true],
  ["Royalhouse Chapel Connecticut", "United States", "Connecticut", "Connecticut", "Official branch address managed by Headquarters", "Branch leadership profile coming soon", 41.6, -72.7, false],
  ["Royalhouse Chapel Maryland", "United States", "Maryland", "Maryland", "Grace2Grace Center", "Branch leadership profile coming soon", 39.05, -76.64, false],
  ["Royalhouse Chapel Massachusetts", "United States", "Massachusetts", "Massachusetts", "Mt. Zion Center", "Branch leadership profile coming soon", 42.36, -71.06, false],
  ["Royalhouse Chapel Georgia", "United States", "Georgia", "Georgia", "Miracle Life Center", "Branch leadership profile coming soon", 33.75, -84.39, false],
  ["Royalhouse Chapel Toronto", "Canada", "Ontario", "Toronto", "Official branch address managed by Headquarters", "Branch leadership profile coming soon", 43.65, -79.38, false],
] as const;

export async function seedRoyalhouseBranches(): Promise<void> {
  await db.insert(branchesTable).values(seedBranches.map(([name, country, region, city, address, pastor, latitude, longitude, featured]) => ({
    name, country, region, city, address, pastor, latitude, longitude, featured,
  }))).onConflictDoNothing({ target: branchesTable.name });
  // Correct only the original placeholder; preserve any administrator-edited pastor.
  // Leadership source: https://royalhousechapel.org/
  await db.update(branchesTable).set({
    pastor: seedBranches[0][5],
    updatedAt: new Date(),
  }).where(and(
    eq(branchesTable.name, seedBranches[0][0]),
    eq(branchesTable.pastor, "Headquarters leadership"),
  ));
}

const seedWorkflowOptions = [
  ["no_answer", "No answer", "call_outcome", {}],
  ["left_message", "Left message", "call_outcome", {}],
  ["spoke_with_person", "Spoke with person", "call_outcome", {}],
  ["plans_to_return", "Person plans to return", "call_outcome", { followUpType: "return_visit" }],
  ["interested", "Person is interested", "call_outcome", { followUpType: "general" }],
  ["not_interested", "Person is not interested", "call_outcome", {}],
  ["attends_another_church", "Person attends another church", "call_outcome", {}],
  ["became_member", "Became a member", "call_outcome", { membershipStatus: "member" }],
  ["wrong_number", "Wrong number", "call_outcome", {}],
  ["other", "Other", "call_outcome", {}],
  ["needs_prayer", "Needs prayer", "situation", { followUpType: "prayer", notifyRole: "Pastoral Leadership" }],
  ["sick", "Sick", "situation", { followUpType: "welfare", notifyRole: "Pastoral Leadership", pastoralFollowUp: true }],
  ["visitation_requested", "Visitation requested", "situation", { followUpType: "visitation", notifyRole: "Pastoral Leadership" }],
  ["pastoral_follow_up", "Pastoral follow-up needed", "situation", { followUpType: "pastoral", notifyRole: "Pastoral Leadership", pastoralFollowUp: true }],
  ["foundation_school_interest", "Interested in Foundation School", "situation", { followUpType: "foundation_school" }],
  ["foundation_school_follow_up", "Foundation School follow-up", "situation", { followUpType: "foundation_school" }],
  ["requested_another_call", "Requested another call", "situation", { followUpType: "call_back" }],
] as const;

export async function seedRoyalhouseWorkflowOptions(): Promise<void> {
  await db.insert(workflowOptionsTable).values(seedWorkflowOptions.map(([code, label, category, triggerConfig]) => ({
    code,
    label,
    category,
    triggerConfig: JSON.stringify(triggerConfig),
  }))).onConflictDoNothing({ target: workflowOptionsTable.code });
}

const seedDepartments = [
  "Leadership",
  "Administration",
  "Connect Team",
  "Finance",
  "Foundation School",
  "Ministries",
  "Worship",
  "Children's Ministry",
  "Men Makers",
  "Royal Ladies",
  "WMG",
  "SHEvolve",
  "Media",
  "Events",
  "Communications",
  "Membership",
  "Branch Administration",
  "Member",
  "Visitor",
] as const;

type SeedRole = {
  department: (typeof seedDepartments)[number];
  name: string;
  modules: string[];
  capabilities?: string[];
  grantable?: boolean;
  system?: boolean;
};

const leadershipCapabilities = [
  "members.create",
  "members.update",
  "connect.view_all",
  "connect.create_people",
  "connect.assign",
  "connect.log_interactions",
  "connect.complete_follow_ups",
  "branches.manage",
  "tasks.manage",
  "tasks.view_all_departments",
  "audit.view",
];

const connectLeaderCapabilities = [
  "members.create",
  "members.update",
  "connect.view_all",
  "connect.create_people",
  "connect.assign",
  "connect.log_interactions",
  "connect.complete_follow_ups",
  "tasks.manage",
];

const seedRoles: SeedRole[] = [
  { department: "Leadership", name: "Super Admin", modules: ["Members", "Connect Team", "Branches", "Department Tasks", "Users & Roles", "Settings", "Audit Logs"], capabilities: leadershipCapabilities, grantable: true, system: true },
  { department: "Leadership", name: "Headquarters Admin", modules: ["Members", "Connect Team", "Branches", "Department Tasks", "Audit Logs"], capabilities: leadershipCapabilities, grantable: true },
  { department: "Leadership", name: "Regional Admin", modules: ["Members", "Connect Team", "Branches", "Department Tasks", "Audit Logs"], capabilities: leadershipCapabilities, grantable: true },
  { department: "Leadership", name: "Branch Admin", modules: ["Members", "Connect Team", "Branches", "Department Tasks"], capabilities: connectLeaderCapabilities.filter((capability) => capability !== "tasks.view_all_departments"), grantable: true },
  { department: "Leadership", name: "Pastor", modules: ["Members", "Connect Team", "Department Tasks"], capabilities: connectLeaderCapabilities, grantable: true },
  { department: "Leadership", name: "Pastoral Leadership", modules: ["Members", "Connect Team", "Department Tasks", "Audit Logs"], capabilities: leadershipCapabilities.filter((capability) => capability !== "branches.manage" && capability !== "tasks.view_all_departments"), grantable: true },
  { department: "Leadership", name: "Church Administrator", modules: ["Members", "Connect Team", "Branches", "Department Tasks"], capabilities: connectLeaderCapabilities.filter((capability) => capability !== "tasks.view_all_departments"), grantable: true },
  { department: "Connect Team", name: "Connect Team Leader", modules: ["Members", "Connect Team", "Department Tasks"], capabilities: connectLeaderCapabilities, grantable: true },
  { department: "Connect Team", name: "Connect Team Member", modules: ["Connect Team", "Department Tasks"], capabilities: ["connect.log_interactions", "connect.complete_follow_ups", "tasks.manage"], grantable: true },
  { department: "Finance", name: "Finance Team", modules: ["Department Tasks", "Audit Logs"], capabilities: ["tasks.manage", "audit.view"], grantable: true },
  { department: "Finance", name: "Finance Administrator", modules: ["Department Tasks", "Audit Logs"], capabilities: ["tasks.manage", "audit.view"], grantable: true },
  { department: "Finance", name: "Finance Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Media", name: "Media Team", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Media", name: "Media Administrator", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Media", name: "Media Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Events", name: "Store Manager", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Foundation School", name: "Foundation School Administrator", modules: ["Members", "Department Tasks"], capabilities: ["members.create", "members.update", "tasks.manage"], grantable: true },
  { department: "Foundation School", name: "Foundation School Team Member", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Ministries", name: "Ministry Leader", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Ministries", name: "Ministries Administrator", modules: ["Members", "Department Tasks"], capabilities: ["members.create", "members.update", "tasks.manage"], grantable: true },
  { department: "Ministries", name: "Ministry Administrator", modules: ["Members", "Department Tasks"], capabilities: ["members.create", "members.update", "tasks.manage"], grantable: true },
  { department: "Administration", name: "Administration Team Member", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Worship", name: "Worship Leader", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Worship", name: "Worship Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Children's Ministry", name: "Children's Ministry Leader", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Children's Ministry", name: "Children's Ministry Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Men Makers", name: "Men Makers Leader", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Men Makers", name: "Men Makers Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Royal Ladies", name: "Royal Ladies Leader", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Royal Ladies", name: "Royal Ladies Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "WMG", name: "WMG Leader", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "WMG", name: "WMG Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "SHEvolve", name: "SHEvolve Leader", modules: ["Members", "Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "SHEvolve", name: "SHEvolve Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Events", name: "Events Administrator", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Events", name: "Events Team Member", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Communications", name: "Communications Administrator", modules: ["Department Tasks"], capabilities: ["tasks.manage"], grantable: true },
  { department: "Membership", name: "Membership Administrator", modules: ["Members", "Department Tasks"], capabilities: ["members.create", "members.update", "tasks.manage"], grantable: true },
  { department: "Branch Administration", name: "Branch Administrator", modules: ["Branches", "Members", "Department Tasks"], capabilities: ["branches.manage", "members.create", "members.update", "tasks.manage"], grantable: true },
  { department: "Member", name: "Regular Member", modules: [] },
  { department: "Visitor", name: "Visitor", modules: [] },
];

export async function seedRoyalhouseRoleConfig(): Promise<void> {
  await db.insert(adminDepartmentsTable)
    .values(seedDepartments.map((name) => ({ name })))
    .onConflictDoNothing({ target: adminDepartmentsTable.name });
  const departments = await db.select().from(adminDepartmentsTable);
  const departmentIds = new Map(departments.map((department) => [department.name, department.id]));
  await db.insert(adminRolesTable)
    .values(seedRoles.map((role) => ({
      departmentId: departmentIds.get(role.department)!,
      name: role.name,
      modules: role.modules,
      capabilities: role.capabilities ?? [],
      grantable: role.grantable ?? false,
      system: role.system ?? false,
    })))
    .onConflictDoNothing({ target: adminRolesTable.name });
}