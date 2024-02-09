import { createTheme, ThemeProvider } from "@mui/material";
import { SnackbarProvider } from 'notistack';
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import AuthRouter from "./AuthRouter";
import KSAppbar from "./pages/KSAppbar";
import SprintPage from "./pages/sprint";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { loadUsers } from "./redux/slices/user.slice";
import TaskPage from "./pages/task";
import { ROUTER_PROJECT, ROUTER_SPRINT, ROUTER_TASK } from "./utils/router";
import { getUserProjects } from "./redux/slices/project-members.slice";
import { unwrapResult } from "@reduxjs/toolkit";
import { setCurrentUser } from "./redux/slices/auth.slice";
import { setShowArchivedSprint } from "./redux/slices/sprint.slice";
import { SHOW_ARCHIVE_SPRINT } from "../../common/constants";
import Dashboard from "./components/Dashboard/Dashboard";

const theme = createTheme({
  typography: {
    fontFamily: "inherit",
    button: {
      fontFamily: "inherit"
    }
  }
})

const App = () => {
  const dispatch = useAppDispatch();
  const authLoading = useAppSelector((state) => state.authReducer.loading);
  const user = useAppSelector((state) => state.authReducer.user);
  const showArchivedSprint = JSON.parse(localStorage.getItem(SHOW_ARCHIVE_SPRINT))

  useEffect(() => {
    if (!authLoading && !!user) {
      dispatch(loadUsers())
        .then(unwrapResult)
        .then(({ data: users }) => {
          const currentUser = users.find((u) => u._id === user._id);
          if (currentUser) dispatch(setCurrentUser(currentUser));
        });
      dispatch(getUserProjects());
    }
    dispatch(setShowArchivedSprint(showArchivedSprint))
  }, [authLoading, !!user]);

  return (<ThemeProvider theme={theme}>
    <SnackbarProvider maxSnack={1}>
      <AuthRouter>
        <KSAppbar>
          <Routes>
            <Route index path="/" element={<Dashboard />} />
            <Route path={`${ROUTER_PROJECT}/:projectId`} element={<SprintPage />} />
            <Route path={`${ROUTER_PROJECT}/:projectId${ROUTER_SPRINT}/:sprintId`} element={<SprintPage />} />
            <Route path={`${ROUTER_TASK}/:taskId`} element={<TaskPage />} />
            <Route path="*" element={<>Not Found</>} />
          </Routes>
        </KSAppbar>
      </AuthRouter>
    </SnackbarProvider>
  </ThemeProvider>)
}

export default App;