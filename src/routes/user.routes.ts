import { Router } from "express";
import * as userController from "@/controllers/user.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router: Router = Router();

// POST /api/users/register
// 사용자 등록
router.post("/register", userController.register);

// POST /api/users/login
// 사용자 로그인
router.post("/login", userController.login);

// POST /api/users/logout
// 사용자 로그아웃
router.post("/logout", userController.logout);

// POST /api/users/refresh - Access Token 재발급
router.post("/refresh", userController.refresh);

// GET /api/users/me - 현재 로그인 사용자 정보 (인증 필요)
router.get("/me", authMiddleware, userController.getMe);

// PUT /api/users/:userId
// 사용자 정보 수정 (인증 필요)
router.put("/:userId", userController.updateUser);

export default router;
