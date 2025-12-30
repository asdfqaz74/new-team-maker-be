import type { NextFunction, Request, Response } from "express";
import * as userService from "@/services/user.service";
import { ServiceError } from "@/errors";
import { RegisterUserDTO } from "@/dto/register-user.dto";
import {
  getCookieOptions,
  getRefreshCookieOptions,
  getClearCookieOptions,
} from "@/config/cookie";

/* -------------------------------------------- */
/*                     회원가입                     */
/* -------------------------------------------- */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = new RegisterUserDTO(req.body);
    dto.sanitize();
    dto.validate();

    await userService.registerUser(dto.toServiceData());

    res.status(201).json({
      success: true,
      message: "회원가입에 성공했습니다.",
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
/*                      로그인                     */
/* -------------------------------------------- */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, password } = req.body;
    const { user, accessToken, refreshToken } = await userService.loginUser(
      userId,
      password
    );

    // Access Token 쿠키 설정 (15분)
    res.cookie("accessToken", accessToken, getCookieOptions());

    // Refresh Token 쿠키 설정 (7일)
    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    res.status(200).json({
      success: true,
      message: "로그인에 성공했습니다.",
      data: user,
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
    res.clearCookie("accessToken", getClearCookieOptions());
    res.clearCookie("refreshToken", getClearCookieOptions());
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
    res.cookie("accessToken", accessToken, getCookieOptions());

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
      res.status(403).json({
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
      message: "현재 로그인한 유저 정보입니다.",
      data: user,
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
/*                서브 계정 생성                     */
/* -------------------------------------------- */
export const createSubAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const { subId, password } = req.body;

    if (!subId || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "서브 계정 아이디와 비밀번호를 입력해주세요.",
        },
      });
      return;
    }

    const user = await userService.createSubAccount(userId, subId, password);

    res.status(201).json({
      success: true,
      message: "서브 계정이 생성되었습니다.",
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

/* -------------------------------------------- */
/*                서브 계정 삭제                     */
/* -------------------------------------------- */
export const deleteSubAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const user = await userService.deleteSubAccount(userId);

    res.status(200).json({
      success: true,
      message: "서브 계정이 삭제되었습니다.",
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

/* -------------------------------------------- */
/*                  유저 대기명단 추가                  */
/* -------------------------------------------- */
export const addWaitPlayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
    const { playerId, playerName } = req.body;
    if (!playerId || !playerName) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "플레이어 ID와 이름을 입력해주세요.",
        },
      });
      return;
    }
    const user = await userService.addUserWaitPlayer(
      userId,
      playerId,
      playerName
    );

    res.status(200).json({
      success: true,
      message: "대기명단에 플레이어가 추가되었습니다.",
      data: user,
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
/*                 유저 대기명단 불러오기                 */
/* -------------------------------------------- */
export const getWaitPlayers = async (req: Request, res: Response) => {
  try {
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

    const waitPlayers = await userService.getUserWaitPlayers(userId);

    res.status(200).json({
      success: true,
      message: "대기명단이 조회되었습니다.",
      data: waitPlayers,
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
/*                  유저 대기명단 삭제                  */
/* -------------------------------------------- */
export const removeWaitPlayer = async (req: Request, res: Response) => {
  try {
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
    const { playerId } = req.params;
    if (!playerId) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "플레이어 ID가 필요합니다.",
        },
      });
      return;
    }
    const user = await userService.removeUserWaitPlayer(userId, playerId);

    res.status(200).json({
      success: true,
      message: "대기명단에서 플레이어가 삭제되었습니다.",
      data: user,
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
