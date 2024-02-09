import { unwrapResult } from "@reduxjs/toolkit";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import LoadingPage from "./pages/loading";
import LoginPage from "./pages/login";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { fetchSession } from "./redux/slices/auth.slice";
import { SocketIOProvider } from "./socketio/SocketIOProvider";

interface IProps {
  children?: React.ReactChild | never[];
}
const AuthRouter = (props: IProps) => {
  const [ready, setReady] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authReducer.user);
  const authLoading = useAppSelector((state) => state.authReducer.loading);
  const accessToken = useAppSelector((state) => state.authReducer.accessToken);
  const mapUserData = useAppSelector((state) => state.userReducer.mapUserData);

  useEffect(() => {
    dispatch(fetchSession())
      .then(unwrapResult)
      .then(() => {
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      })
  }, []);

  return <>
    {(!ready || authLoading)
      ? <LoadingPage />
      : (user
        ? <BrowserRouter basename={process.env.PUBLIC_URL}>
          {<SocketIOProvider token={accessToken}>
            {props?.children ?? <></>}
          </SocketIOProvider>}
        </BrowserRouter>
        : <LoginPage />)
    }
  </>
}

export default AuthRouter;