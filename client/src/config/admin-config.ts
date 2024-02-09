import User from "../../../common/models/user";

const adminAccountsEnv = (process.env.ADMIN_ACCOUNTS ?? "").split(",");
export const adminAccounts = adminAccountsEnv.includes("admin") ? adminAccountsEnv : [...adminAccountsEnv, "admin"]

export const isAdmin = (user?: User) => {
  return !!user && adminAccounts.includes(user.account);
}