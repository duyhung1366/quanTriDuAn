import { Router } from "express";
import NotificationService from "../../services/notification";
import asyncHandler from "../../utils/asyncHandler";

const router = Router();

router.get("/:id/readNotification", asyncHandler(async (req, res) => {
  await NotificationService.readNotification(req.params.id);
  return res.status(200);
}));

router.get("/", asyncHandler(async (req, res) => {
  const notis = await NotificationService.listNotification();
  return res.json(notis);
}));

export { router as notificationRouter };