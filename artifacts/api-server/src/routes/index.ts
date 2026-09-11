import { Router, type IRouter } from "express";
import healthRouter from "./health";
import branchesRouter from "./branches";
import adminRouter from "./admin";
import connectRouter from "./connect";

const router: IRouter = Router();

router.use(healthRouter);
router.use(branchesRouter);
router.use(adminRouter);
router.use(connectRouter);

export default router;
