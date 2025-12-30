import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as userRepository from "@/repositories/user.repository";
import { getCookieOptions } from "@/config/cookie";

// 사용자 역할 타입
export type UserRole = "owner" | "viewer";

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

interface TokenPayload {
  id: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * 인증 미들웨어
 * - 쿠키에서 accessToken을 추출하여 검증
 * - 검증 성공 시 req.user에 사용자 정보 저장
 * - 검증 실패(만료) 시 refreshToken으로 갱신 시도
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new Error("No access token");
    }

    // 토큰 검증
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET || "secret"
    ) as TokenPayload;

    // req.user에 사용자 정보 저장
    req.user = {
      id: decoded.id,
      role: decoded.role || "owner",
    };

    next();
  } catch (error) {
    // 토큰 만료 또는 없음 -> 리프레시 시도
    if (
      error instanceof jwt.TokenExpiredError ||
      (error instanceof Error && error.message === "No access token")
    ) {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "인증이 필요합니다. 로그인해주세요.",
          },
        });
        return;
      }

      try {
        // 리프레시 토큰 검증
        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || "refresh-secret"
        ) as TokenPayload;

        // 유저 존재 확인 (선택 사항이지만 권장)
        const user = await userRepository.findById(decodedRefresh.id);
        if (!user) {
          throw new Error("User not found");
        }

        // 새 액세스 토큰 발급
        const newAccessToken = jwt.sign(
          { id: user._id, role: decodedRefresh.role || "owner" },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "15m" }
        );

        // 쿠키 갱신
        res.cookie("accessToken", newAccessToken, getCookieOptions());

        // req.user 설정
        req.user = {
          id: user._id.toString(),
          role: decodedRefresh.role || "owner",
        };

        next();
        return;
      } catch (refreshError) {
        // 리프레시 실패 (만료되거나 유효하지 않음)
        res.status(401).json({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          },
        });
        return;
      }
    }

    // 그 외 유효하지 않은 토큰
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "유효하지 않은 토큰입니다.",
      },
    });
  }
};

/**
 * 옵셔널 인증 미들웨어
 * - 토큰이 있으면 검증하고 req.user 설정
 * - 토큰이 없거나 유효하지 않아도 에러 없이 통과 (req.user = undefined)
 * - 비로그인/로그인 모두 접근 가능한 API에 사용
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      // 토큰 없으면 그냥 통과 (비로그인 상태)
      next();
      return;
    }

    // 토큰 검증
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET || "secret"
    ) as TokenPayload;

    // req.user에 사용자 정보 저장
    req.user = {
      id: decoded.id,
      role: decoded.role || "owner",
    };

    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 그냥 통과 (비로그인 취급)
    next();
  }
};

/**
 * Owner 전용 미들웨어
 * - role이 "owner"인 경우에만 접근 허용
 * - 서브 계정(viewer)은 접근 불가
 * - 설정, 수정, 삭제 등의 API에 사용
 */
export const ownerOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "인증이 필요합니다.",
      },
    });
    return;
  }

  if (req.user.role !== "owner") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "권한이 없습니다. 메인 계정으로 로그인해주세요.",
      },
    });
    return;
  }

  next();
};
