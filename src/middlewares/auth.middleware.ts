import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
 * - 검증 실패 시 401 에러 반환
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "인증이 필요합니다. 로그인해주세요.",
        },
      });
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
    // 토큰 만료
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "토큰이 만료되었습니다. 토큰을 갱신해주세요.",
        },
      });
      return;
    }

    // 유효하지 않은 토큰
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
