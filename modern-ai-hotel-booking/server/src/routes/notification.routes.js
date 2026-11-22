import express from "express";
import {
  getNotifications,
  getUnreadCount,
  readAllNotifications,
  readNotification,
  removeNotification,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", readAllNotifications);
router.patch("/:id/read", validateObjectId("id"), readNotification);
router.delete("/:id", validateObjectId("id"), removeNotification);

export default router;
