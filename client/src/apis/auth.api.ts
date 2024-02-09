import { LoginCode } from "../../../common/constants";
import User from "../../../common/models/user";
import { get, post } from "../utils/request"

export const apiLogin = async (args: { account: string; password: string }): Promise<{ loginCode: LoginCode } | ({ loginCode: LoginCode, accessToken: string } & User)> => {
  const { data, error } = await post({ endpoint: "/auth/login", body: args, withCredentials: true });
  return error ? null : data;
}

export const apiGetSession = async (): Promise<{ id: string; }> => {
  const { data, error } = await get({ endpoint: "/auth/session", withCredentials: true });
  return error ? null : data;
}

export const apiLogout = async (): Promise<{ loginCode: LoginCode } | ({ loginCode: LoginCode, accessToken: string } & User)> => {
  const { data, error } = await post({ endpoint: "/auth/logout", withCredentials: true });
  return error ? null : data;
}