import { Router } from "express";
import * as playerController from "@/controllers/player.controller";

const router: Router = Router();

// GET /api/players/verify
router.get("/verify", playerController.verify);

/* -------------------------------------------- */
/*                      기타                      */
/* -------------------------------------------- */

// GET /api/players/lines
router.get("/lines", playerController.getLine);

export default router;
