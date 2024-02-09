import CryptoJs from "crypto-js";
import jwt from "jsonwebtoken";
import { LoginCode, PWD_DECRYPT_KEY } from "../../../common/constants";
import User from "../../../common/models/user";
import { UserModel } from "../../database/mongo/user.model";
import { generateAccessToken, generateRefreshToken } from "../../middlewares/auth";
import logger from "../../utils/logger";

export type SuccessLoginResponse = User & {
  loginCode: LoginCode,
  accessToken: string,
  refreshToken: string;
}

type LoginResponse = SuccessLoginResponse | { loginCode: LoginCode }

export default class AuthService {

  static decryptPassword(encryptedPassword: string) {
    const { 1: plainPassword } = CryptoJs.AES.decrypt(encryptedPassword, PWD_DECRYPT_KEY).toString(CryptoJs.enc.Utf8).split("_");
    return plainPassword;
  }

  static getHashPassword(args: {
    account: string; password: string; decrypted?: boolean;
  }) {
    const { account, password: _password, decrypted = false } = args;
    let password = _password;
    if (!decrypted) {
      password = AuthService.decryptPassword(_password);
    }
    return CryptoJs.SHA256(`${password}_${account}_${password}`).toString();
  }

  static async login(args: { account: string; password: string }): Promise<LoginResponse> {
    const { account, password } = args;
    const hashPassword = AuthService.getHashPassword({ account, password, decrypted: false });
    if (!hashPassword) return { loginCode: LoginCode.WRONG_PWD }

    const user = await UserModel.findOne({ account });
    if (!user) return { loginCode: LoginCode.ACCOUNT_NOT_EXISTS }
    if (user.password !== hashPassword) return { loginCode: LoginCode.WRONG_PWD }

    const credentials = { id: user._id };

    const accessToken = generateAccessToken(credentials);
    const refreshToken = generateRefreshToken(credentials);

    return {
      loginCode: LoginCode.SUCCESS,
      accessToken,
      refreshToken,
      ...(new User(user)),
    }
  }

  static async refreshToken(token: string) {
    try {
      const _credentials = jwt.verify(token, process.env.SECRET_REFRESH_TOKEN || "null");
      if (typeof _credentials === "string") return null;
      const credentials = { id: _credentials.id };
      const accessToken = generateAccessToken(credentials);
      const refreshToken = generateRefreshToken(credentials);
      return {
        accessToken,
        refreshToken
      }
    } catch (error) {
      logger.error(error);
      return null;
    }
  }
}