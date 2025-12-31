import { Router } from "express";
import * as mypageController from "@/controllers/mypage.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router: Router = Router();

// GET /api/mypage/players - 마이페이지 플레이어 목록 조회
router.get("/list", authMiddleware, mypageController.getRegisteredPlayers);

// GET /api/mypage/stats - 마이페이지 최근 매치 조회
router.get("/stats", authMiddleware, mypageController.getRecentMatches);

export default router;
