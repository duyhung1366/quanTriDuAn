import { LockOutlined } from "@mui/icons-material";
import { Avatar, Button, Grid, Paper, TextField, Typography } from "@mui/material";
import { unwrapResult } from "@reduxjs/toolkit";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import { LoginCode } from "../../../../common/constants";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { requestLogin } from "../../redux/slices/auth.slice";
import "./style.scss";

interface LoginForm {
  account: string;
  password: string;
}

const LoginPage = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginForm>();
  const dispatch = useAppDispatch();
  const authLoading = useAppSelector((state) => state.authReducer.loading);
  const { enqueueSnackbar } = useSnackbar();

  const handleLogin = (values: LoginForm) => {
    dispatch(requestLogin(values))
      .then((result) => unwrapResult(result))
      .then(({ loginCode, ...user }) => {
        let errorMsg = "";
        switch (loginCode) {
          case LoginCode.FAILED:
            errorMsg = "Không thể đăng nhập!";
            break;
          case LoginCode.ACCOUNT_NOT_EXISTS:
            errorMsg = "Tài khoản không tồn tại!"
            break;
          case LoginCode.WRONG_PWD:
            errorMsg = "Sai mật khẩu!"
            break;
          case LoginCode.SUCCESS:
            break;
        }
        if (errorMsg) {
          enqueueSnackbar(errorMsg, { variant: "error" });
        }
      })
      .catch((err) => {
        console.error(err);
      })
  }
  
  return <Grid container component="main" id="login-grid">
    <Grid item xs={false} sm={4} md={7} className="login-splash" />
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <div className="login-form-container">
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">Đăng nhập</Typography>
        <form className="login-form" noValidate onSubmit={handleSubmit(handleLogin)}>
          <TextField
            margin="normal" fullWidth
            required id="account" label="Account"
            autoComplete="username"
            autoFocus
            {...register("account", { required: true })}
          />

          <TextField
            margin="normal" fullWidth
            required id="password" label="Password"
            type="password"
            autoComplete="current-password"
            {...register("password", { required: true })}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Đăng nhập
          </Button>
        </form>
      </div>
    </Grid>
  </Grid>
}

export default LoginPage;