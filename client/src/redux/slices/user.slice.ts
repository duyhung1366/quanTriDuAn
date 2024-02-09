import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import User from "../../../../common/models/user";
import { BaseAsyncThunk } from "./base.slice";

export interface UserState {
  users: Array<User>;
  loading: boolean;
  mapUserData: Record<string, User>;
}
const initialState: UserState = {
  users: [],
  loading: true,
  mapUserData: {}
}

class UserAsyncThunk extends BaseAsyncThunk<User> {
  constructor() {
    super("users");
  }
  loadUsers = createAsyncThunk(`${this.name}/getAll`, async () => {
    const users = await this.CRUDBase.getAll();
    return users;
  });
}
const userAsyncThunk = new UserAsyncThunk();
export const loadUsers = userAsyncThunk.loadUsers;
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadUsers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadUsers.fulfilled, (state, action) => {
      state.loading = false;
      const users = action.payload.data;
      state.users = users;
      users.forEach((user) => {
        state.mapUserData[user._id] = user;
      });
    })
  },
});

export default userSlice.reducer;