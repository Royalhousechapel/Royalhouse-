import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { GetBranchDirectoryResponse, ListBranchesResponse } from "@workspace/api-zod";
import { officialBranchDirectory } from "../data/official-branch-directory";
import { branchesTable, db } from "@workspace/db";

const router: IRouter = Router();

// Keep existing IDs and admin records intact. The original untouched overseas
// examples are superseded in the public listing by the published mission rows.
const legacySampleNames = new Set([
  "Royalhouse Chapel Connecticut",
  "Royalhouse Chapel Maryland",
  "Royalhouse Chapel Massachusetts",
  "Royalhouse Chapel Georgia",
  "Royalhouse Chapel Toronto",
]);

router.get("/branches/directory", async (_req, res): Promise<void> => {
  const managedBranches = await db.select().from(branchesTable)
    .where(eq(branchesTable.archived, false))
    .orderBy(asc(branchesTable.country), asc(branchesTable.name));
  const managedEntries = managedBranches
    .filter((branch) => !(
      legacySampleNames.has(branch.name)
      && branch.pastor === "Branch leadership profile coming soon"
      && branch.createdAt.getTime() === branch.updatedAt.getTime()
    ))
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      locationGroup: branch.country,
      country: branch.country,
      region: branch.region,
      area: branch.city,
      temple: null,
      pastor: branch.pastor,
      address: branch.address,
      latitude: branch.latitude,
      longitude: branch.longitude,
      sourceUrl: null,
      official: false,
      featured: branch.featured,
    }));
  res.json(GetBranchDirectoryResponse.parse({
    ...officialBranchDirectory,
    officialEntryCount: officialBranchDirectory.entries.length,
    entries: [...managedEntries, ...officialBranchDirectory.entries],
  }));
});

router.get("/branches", async (_req, res): Promise<void> => {
  const branches = await db
    .select()
    .from(branchesTable)
    .where(eq(branchesTable.archived, false))
    .orderBy(asc(branchesTable.country), asc(branchesTable.name));
  res.json(ListBranchesResponse.parse(branches));
});

export default router;