import { Router } from "express";
import * as initController from "@/controllers/init.controller";

const router: Router = Router();

// 초기 상태로드
router.get("/", initController.getInitData);

export default router;
