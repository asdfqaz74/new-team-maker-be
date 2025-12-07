import { uploadRofl } from "@/middlewares/upload.middleware";
import { Router } from "express";
import * as matchController from "@/controllers/match.controller";

const router: Router = Router();

// ROFL 파일 업로드 → 프리뷰
router.post("/preview", uploadRofl, matchController.upload);

// 매치 저장 (유저 매핑 포함)
router.post("/save", matchController.save);

// 매치 삭제
router.delete("/delete/:matchId", matchController.remove);

export default router;
