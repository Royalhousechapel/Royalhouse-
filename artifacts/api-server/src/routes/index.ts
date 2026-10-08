import { Router, type IRouter } from "express";
import healthRouter from "./health";
import branchesRouter from "./branches";
import adminRouter from "./admin";
import connectRouter from "./connect";
import roleConfigRouter from "./roleConfig";
import memberTasksRouter from "./memberTasks";
import visitorsRouter from "./visitors";

const router: IRouter = Router();

router.use(healthRouter);
router.use(branchesRouter);
// Visitor endpoints must precede routers with a global admin-only middleware.
router.use(visitorsRouter);
router.use(adminRouter);
router.use(roleConfigRouter);
router.use(memberTasksRouter);
router.use(connectRouter);

export default router;
