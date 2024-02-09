import { NextFunction, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AuthRequest } from "../types/Request";
import dotenv from "../utils/dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "koolsoft123";
const EXPIRES_TOKEN = +(process.env.EXPIRES_TOKEN || 86400);
const SECRET_REFRESH_TOKEN = process.env.SECRET_REFRESH_TOKEN || "null";
const REFRESH_TOKEN_EXPIRES = +(process.env.REFRESH_TOKEN_EXPIRES || 2592000);

export const generateAccessToken = (data: any) => {
  return jwt.sign(data, SECRET_KEY, { expiresIn: EXPIRES_TOKEN })
}

export const generateRefreshToken = (data: any) => {
  return jwt.sign(data, SECRET_REFRESH_TOKEN!, { expiresIn: REFRESH_TOKEN_EXPIRES })
}


export const verifyAccessToken = (token: string) => {
  try {
    const decode = jwt.verify(token, SECRET_KEY);
    if (!decode) {
      return null;
    }
    return decode;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      if (error instanceof TokenExpiredError) {
        return 1;
      }
    }
    return null;
  }
}

export const verifyAccessTokenWithDecodeData = (token: string) => {
  try {
    const decode = jwt.verify(token, SECRET_KEY);
    if (!decode) {
      return null;
    }
    return decode;
  } catch (error) {
    return null;
  }

}

export const verifierJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ data: 0, message: "Unauthorized" });
  const [authType, token] = authHeader.split(' ');
  if (authType.toLowerCase() !== "bearer" || !token) return res.status(401).json({ message: "Unauthorized" });
  const verifierJWTResult = verifyAccessToken(token);
  if (!verifierJWTResult || typeof verifierJWTResult === "string" || (verifierJWTResult !== 1 && !verifierJWTResult?.id)) {
    return res.status(401).json({ message: "Invalid Token" });
  } else if (verifierJWTResult === 1) {
    return res.status(403).json({ data: 1 });
  }
  if (typeof verifierJWTResult !== "string") {
    // @ts-ignore
    req.credentials = verifierJWTResult;
  }
  return next();
}