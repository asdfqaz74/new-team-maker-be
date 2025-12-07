import { Router } from "express";
import * as playerController from "@/controllers/player.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router: Router = Router();

/* -------------------------------------------- */
/*                    플레이어 등록                   */
/* -------------------------------------------- */

// GET /api/players/verify
// 플레이어 PUUID 조회
router.get("/verify", playerController.verify);

// POST /api/players/register
// 플레이어 등록
router.post("/register", authMiddleware, playerController.register);

/* -------------------------------------------- */
/*                    플레이어 수정                   */
/* -------------------------------------------- */
// PUT /api/players/:playerId
// 플레이어 정보 수정
router.put("/:playerId", authMiddleware, playerController.update);

/* -------------------------------------------- */
/*                      기타                      */
/* -------------------------------------------- */

// GET /api/players/lines
// 라인 옵션 조회
router.get("/lines", playerController.getLine);

// GET /api/players/list
// 로그인 시 해당 유저의 플레이어 목록 조회
router.get("/list", authMiddleware, playerController.getPlayersList);

// GET /api/players/list/detail
// 플레이어들 상세 목록 조회
router.get(
  "/list/detail",
  authMiddleware,
  playerController.getPlayersListDetail
);

export default router;
