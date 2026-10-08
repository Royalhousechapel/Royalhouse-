export const adminModuleCatalog = [
  "Members",
  "Connect Team",
  "Branches",
  "Department Tasks",
  "Users & Roles",
  "Settings",
  "Audit Logs",
] as const;

export const adminCapabilityCatalog = [
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
] as const;

const capabilityModule: Record<(typeof adminCapabilityCatalog)[number], string> = {
  "members.create": "Members",
  "members.update": "Members",
  "connect.view_all": "Connect Team",
  "connect.create_people": "Connect Team",
  "connect.assign": "Connect Team",
  "connect.log_interactions": "Connect Team",
  "connect.complete_follow_ups": "Connect Team",
  "branches.manage": "Branches",
  "tasks.manage": "Department Tasks",
  "tasks.view_all_departments": "Department Tasks",
  "audit.view": "Audit Logs",
};

const superAdminOnlyModules = new Set(["Users & Roles", "Settings"]);

export function validateRolePermissions(input: {
  name: string;
  modules: string[];
  capabilities: string[];
  grantable: boolean;
  system?: boolean;
}): string | null {
  const moduleSet = new Set(input.modules);
  const capabilitySet = new Set(input.capabilities);
  if (input.modules.length !== moduleSet.size || input.modules.some((item) => !adminModuleCatalog.includes(item as never))) {
    return "Choose each supported module no more than once.";
  }
  if (input.capabilities.length !== capabilitySet.size || input.capabilities.some((item) => !adminCapabilityCatalog.includes(item as never))) {
    return "Choose each supported capability no more than once.";
  }
  if (input.capabilities.some((capability) => !moduleSet.has(capabilityModule[capability as keyof typeof capabilityModule]))) {
    return "Every capability requires its matching module.";
  }
  if (!input.system && [...superAdminOnlyModules].some((module) => moduleSet.has(module))) {
    return "Users & Roles and Settings are reserved for the Super Admin.";
  }
  if (input.grantable && input.modules.length === 0) {
    return "A role needs at least one working module before it can be granted as administrator access.";
  }
  if (input.system && input.name !== "Super Admin") {
    return "The protected system role must remain named Super Admin.";
  }
  return null;
}
