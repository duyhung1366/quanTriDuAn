export default async function authHeader() {
  const store = (await import("../redux/store")).default;
  if (!store) return {};
  const accessToken = store.getState().authReducer.accessToken;
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` }
}