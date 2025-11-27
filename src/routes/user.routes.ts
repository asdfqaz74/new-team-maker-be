import { Router } from "express";
import * as userController from "@/controllers/user.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router: Router = Router();

// POST /api/users/register
router.post("/register", userController.register);

// POST /api/users/login
router.post("/login", userController.login);

// POST /api/users/logout
router.post("/logout", userController.logout);

// POST /api/users/refresh - Access Token 재발급
router.post("/refresh", userController.refresh);

// GET /api/users/me - 현재 로그인 유저 정보 (인증 필요)
router.get("/me", authMiddleware, userController.getMe);

// PUT /api/users/:userId
router.put("/:userId", userController.updateUser);

export default router;
