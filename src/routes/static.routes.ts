import { Router } from "express";
import * as staticController from "@/controllers/static.controller";

const router: Router = Router();

// 가장 많이 픽된 챔피언 통계 조회
router.get("/most-picked", staticController.getMainStaticData);

// 나머지 메인 페이지 통계 데이터 조회
router.get("/other", staticController.getOtherStaticData);

export default router;
