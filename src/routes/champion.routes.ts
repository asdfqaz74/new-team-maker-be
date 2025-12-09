import { Router } from "express";
import * as championController from "@/controllers/champion.controller";

const router: Router = Router();
// 챔피언 관련 라우팅
router.get("/simple", championController.getChampionsSimpleList);

export default router;
