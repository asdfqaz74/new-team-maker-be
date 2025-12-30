import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 15 * 60 * 1000, // 15분
  ...(isProd && { domain: ".team-maker.xyz" }),
};

export const refreshCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
};

// 쿠키 삭제용 옵션 (maxAge 제외)
export const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  ...(isProd && { domain: ".team-maker.xyz" }),
};
