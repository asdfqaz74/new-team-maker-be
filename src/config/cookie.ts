import type { CookieOptions } from "express";

// 런타임에 환경변수 체크하도록 함수로 변경
export const getCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15분
    ...(isProd && { domain: ".team-maker.xyz" }),
  };
};

export const getRefreshCookieOptions = (): CookieOptions => {
  return {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
  };
};

// 쿠키 삭제용 옵션 (maxAge 제외)
export const getClearCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    ...(isProd && { domain: ".team-maker.xyz" }),
  };
};
