import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

interface TokenPayload {
  id: string;
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
