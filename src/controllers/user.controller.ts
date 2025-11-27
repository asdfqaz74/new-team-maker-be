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
    const { user, accessToken, refreshToken } = await userService.loginUser(
      userId,
      password
    );

    // Access Token 쿠키 설정 (15분)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15분
    });

    // Refresh Token 쿠키 설정 (7일)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
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
    // 두 토큰 모두 삭제
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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

/* -------------------------------------------- */
/*            Refresh Token으로 재발급             */
/* -------------------------------------------- */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "리프레시 토큰이 없습니다.",
        },
      });
      return;
    }

    const { accessToken } = await userService.refreshAccessToken(refreshToken);

    // 새 Access Token 쿠키 설정
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.status(200).json({
      success: true,
      message: "토큰이 갱신되었습니다.",
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

/* -------------------------------------------- */
/*               현재 로그인 유저 정보               */
/* -------------------------------------------- */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // 인증 미들웨어에서 설정한 req.user 사용
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "인증이 필요합니다.",
        },
      });
      return;
    }

    const user = await userService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: { user },
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
