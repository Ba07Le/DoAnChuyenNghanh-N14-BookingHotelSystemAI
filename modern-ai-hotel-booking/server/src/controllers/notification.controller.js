import * as notificationService from "../services/notification.service.js";

// Controller chỉ nhận request và trả response; nghiệp vụ nằm trong services/notification.service.js

export const getNotifications = async (req, res) => {
  const { items, pagination, unreadCount } = await notificationService.listNotifications(req.user._id, req.query);

  res.json({ success: true, data: items, pagination, unreadCount });
};

export const getUnreadCount = async (req, res) => {
  const unreadCount = await notificationService.countUnread(req.user._id);

  res.json({ success: true, unreadCount });
};

export const readNotification = async (req, res) => {
  const unreadCount = await notificationService.markAsRead(req.user._id, req.params.id);

  res.json({ success: true, unreadCount });
};

export const readAllNotifications = async (req, res) => {
  const unreadCount = await notificationService.markAllAsRead(req.user._id);

  res.json({ success: true, unreadCount });
};

export const removeNotification = async (req, res) => {
  const unreadCount = await notificationService.deleteNotification(req.user._id, req.params.id);

  res.json({ success: true, unreadCount });
};
