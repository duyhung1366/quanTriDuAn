import { Router } from "express";
import UserService from "../../services/user/user";
import asyncHandler from "../../utils/asyncHandler";

const router = Router();

router.get("/users", asyncHandler(async (req, res) => {
  const data = await UserService.listUsers();
  return res.json(data);
}));

export { router as userRouter };