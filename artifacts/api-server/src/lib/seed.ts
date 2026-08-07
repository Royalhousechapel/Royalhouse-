import { db, branchesTable } from "@workspace/db";

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