import { CookieOptions } from "express";

const cookieOptionSameSiteValues = ["lax", "none", "strict"] as const;
export type CookieOptionSameSite = typeof cookieOptionSameSiteValues[number];

export function getCookieOptions(args: {
  maxAge?: number;
  httpOnly?: boolean;
}) {
  const {
    maxAge = 31536000000,
    httpOnly = true
  } = args;
  const cookieOptions: CookieOptions = { httpOnly, maxAge };
  if (process.env.COOKIE_OPTION_SECURE === "true") cookieOptions.secure = true;
  if (cookieOptionSameSiteValues.includes((process.env.COOKIE_OPTION_SAMESITE as CookieOptionSameSite) || "lax")) {
    cookieOptions.sameSite = process.env.COOKIE_OPTION_SAMESITE as CookieOptionSameSite;
  }
  if (process.env.COOKIE_OPTION_DOMAIN) cookieOptions.domain = process.env.COOKIE_OPTION_DOMAIN;
  return cookieOptions;
}