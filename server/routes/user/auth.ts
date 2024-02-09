import { Router } from "express";
import { LoginCode } from "../../../common/constants";
import AuthService, { SuccessLoginResponse } from "../../services/user/auth";
import asyncHandler from "../../utils/asyncHandler";
import { getCookieOptions } from "../../utils/cookie";
import { BadRequestError } from "../../utils/errors";
import { verifierJWT } from "../../middlewares/auth";
import { AuthRequest } from "../../types/Request";

const router = Router();

router.post("/login", asyncHandler(async (req, res) => {
  const reqBody = <{ account: string; password: string }>req.body;
  if (!reqBody.account || !reqBody.password) throw new BadRequestError();
  const data = await AuthService.login(reqBody);
  let expiresIn = 0;
  if (data.loginCode === LoginCode.SUCCESS) {
    const { refreshToken } = data as SuccessLoginResponse;
    expiresIn = 1000 * (+(process.env.REFRESH_TOKEN_EXPIRES || 2592000));
    res.cookie("x-refresh-token", refreshToken, {
      ...getCookieOptions({
        httpOnly: true, maxAge: expiresIn
      })
    });
  }
  return res.json({ ...data, expiresIn });
}));

router.post("/logout", asyncHandler(async (req, res) => {
  // TODO: JWT or SSO Logout
  res.clearCookie('x-refresh-token', {
    ...getCookieOptions({ httpOnly: true })
  });
  return res.json('ok');
}));

router.get("/refresh-token", asyncHandler(async (req, res) => {
  const refreshToken = req.cookies["x-refresh-token"];
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });
  const data = await AuthService.refreshToken(refreshToken);
  if (!data) return res.status(401).json({ message: "Unauthorized" });
  const { refreshToken: newRefreshToken } = data;
  const expiresIn = 1000 * (+(process.env.REFRESH_TOKEN_EXPIRES || 2592000));
  res.cookie("x-refresh-token", newRefreshToken, {
    ...getCookieOptions({
      httpOnly: true, maxAge: expiresIn
    })
  });
  return res.json({ ...data, expiresIn });
}));

router.get("/session", verifierJWT, asyncHandler(async (req: AuthRequest, res) => {
  return res.json(req.credentials);
}));

export { router as authRouter }