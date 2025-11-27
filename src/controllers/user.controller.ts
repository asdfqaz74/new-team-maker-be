import type { NextFunction, Request, Response } from "express";
import * as userService from "@/services/user.service";
import { ServiceError } from "@/errors";
import { RegisterUserDTO } from "@/dto/register-user.dto";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = new RegisterUserDTO(req.body);
    dto.sanitize();
    dto.validate();

    const newUser = await userService.registerUser(dto.toServiceData());

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json(error.toJSON());
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      },
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, password } = req.body;
    const { user, token } = await userService.loginUser(userId, password);

    // HttpOnly 쿠키에 토큰 저장
    res.cookie("accessToken", token, {
      httpOnly: true, // JS에서 접근 불가 (XSS 방지)
      secure: process.env.NODE_ENV === "production", // HTTPS에서만 전송 (프로덕션)
      sameSite: "strict", // CSRF 방지
      maxAge: 24 * 60 * 60 * 1000, // 1일 (밀리초)
    });

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json(error.toJSON());
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      },
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({
      success: true,
      message: "성공적으로 로그아웃 되었습니다.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      },
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(userId, updateData);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json(error.toJSON());
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      },
    });
  }
};
