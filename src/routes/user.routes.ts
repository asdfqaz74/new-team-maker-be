import { Router } from "express";
import * as userController from "@/controllers/user.controller";

const router: Router = Router();

// POST /api/users/register
router.post("/register", userController.register);

// POST /api/users/login
router.post("/login", userController.login);

// PUT /api/users/:userId
router.put("/:userId", userController.updateUser);

export default router;
