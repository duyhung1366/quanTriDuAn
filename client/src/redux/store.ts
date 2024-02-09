import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/auth.slice";
import projectMembersSlice from "./slices/project-members.slice";
import projectSlice from "./slices/project.slice";
import sprintSlice from "./slices/sprint.slice";
import taskSlice from "./slices/task.slice";
import userSlice from "./slices/user.slice";
import taskAssignmentSlice from "./slices/taskAssignment.slice";
import projectCheckListSlice from "./slices/projectCheckList.slice";




const store = configureStore({
  reducer: {
    authReducer: authSlice,
    projectReducer: projectSlice,
    projectMemberReducer: projectMembersSlice,
    sprintReducer: sprintSlice,
    taskReducer: taskSlice,
    userReducer: userSlice,
    taskAssignmentReducer: taskAssignmentSlice,
    projectCheckListReducer :projectCheckListSlice
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false
  }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;