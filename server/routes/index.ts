import { Router } from "express";
import { authRouter } from "./user/auth";
import { userRouter } from "./user/user";
import { projectRouter } from "./work/project";
import { sprintRouter } from "./work/sprint";
import { taskRouter } from "./work/task";
import { projectCheckListRouter } from "./work/project_check_list";
import { imageRouter } from "./work/images";

const router = Router();

// TODO: sso or external auth server
// router.use(authRouter);
router.use(userRouter);
router.use(projectRouter);
router.use(sprintRouter);
router.use(taskRouter);
router.use(projectCheckListRouter);
router.use(imageRouter);

export { router };