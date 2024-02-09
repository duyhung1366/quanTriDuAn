import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import CryptoJs from "crypto-js";
import { LoginCode, PWD_DECRYPT_KEY } from "../../../../common/constants";
import User from "../../../../common/models/user";
import { apiGetSession, apiLogin, apiLogout } from "../../apis/auth.api";

export interface AuthState {
  user: User & { expiredAt?: number };
  loading: boolean;
  accessToken: string;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  accessToken: "",
};

const encryptPassword = (account: string, password: string) => {
  return CryptoJs.AES.encrypt(
    `${account}_${password}`,
    PWD_DECRYPT_KEY
  ).toString();
};

export const requestLogin = createAsyncThunk(
  "auth/login",
  async (args: { account: string; password: string }) => {
    const { account, password: _password } = args;
    const password = encryptPassword(account, _password);
    const result = await apiLogin({ account, password });
    return result;
  }
);

export const fetchSession = createAsyncThunk("auth/fetchSession", async () => {
  const data = await apiGetSession();
  return data;
});

export const requestLogout = createAsyncThunk("auth/logout", async () => {
  const data = await apiLogout();
  return data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loadUser: (
      state,
      action: PayloadAction<User & { accessToken: string }>
    ) => {
      state.user = action.payload;
      state.accessToken = action.payload.accessToken;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setAcccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(requestLogin.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(requestLogin.fulfilled, (state, action) => {
      state.loading = false;
      const user =
        action.payload.loginCode === LoginCode.SUCCESS
          ? (action.payload as User)
          : null;
      if (action.payload.loginCode === LoginCode.SUCCESS) {
        // @ts-ignore
        state.accessToken = action.payload.accessToken;
      }
      state.user = user;
    });
    builder.addCase(fetchSession.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSession.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        // @ts-ignore
        state.user = {
          ...(state.user || {}),
          _id: action.payload.id,
        };
      }
    });
    builder.addCase(fetchSession.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const { loadUser, setCurrentUser, setAcccessToken } = authSlice.actions;

export default authSlice.reducer;
