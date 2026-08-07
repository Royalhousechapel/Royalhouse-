import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { ListBranchesResponse } from "@workspace/api-zod";
import { branchesTable, db } from "@workspace/db";

const router: IRouter = Router();

router.get("/branches", async (_req, res): Promise<void> => {
  const branches = await db
    .select()
    .from(branchesTable)
    .where(eq(branchesTable.archived, false))
    .orderBy(asc(branchesTable.country), asc(branchesTable.name));
  res.json(ListBranchesResponse.parse(branches));
});

export default router;