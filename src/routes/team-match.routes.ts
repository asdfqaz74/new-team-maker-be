import { Router } from "express";
import * as teamMatchController from "@/controllers/team-match.controller";

const router: Router = Router();

// 플레이어 매칭 데이터 조회 (10명)
router.post("/players", teamMatchController.getPlayersData);

// AI 팀 매칭 생성
router.post("/generate", teamMatchController.generateMatching);

export default router;
