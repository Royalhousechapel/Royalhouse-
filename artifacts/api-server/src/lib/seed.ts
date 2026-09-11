import { db, branchesTable, workflowOptionsTable } from "@workspace/db";

const seedBranches = [
  ["International Headquarters (Ahenfie)", "Ghana", "Greater Accra Region", "Accra", "Oil Dome · Ring Road West · Accra, Ghana", "Headquarters leadership", 5.56, -0.2, true],
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