import Notification from "../models/Notification.js";
import { httpError } from "../utils/httpError.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const toPositiveInt = (value, fallback) => {
  const number = Number.parseInt(value, 10);

  return Number.isNaN(number) || number < 1 ? fallback : number;
};

export const countUnread = (userId) => Notification.countDocuments({ userId, isRead: false });

/** Danh sách thông báo của một người (mới nhất trước), có phân trang và lọc chưa đọc. */
export const listNotifications = async (userId, query = {}) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const filter = query.unread === "true" ? { userId, isRead: false } : { userId };

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "data.hotelId", select: "slug" })
      .lean(),
    Notification.countDocuments(filter),
    countUnread(userId),
  ]);

  return {
    items,
    pagination: { page, limit, total, hasMore: page * limit < total },
    unreadCount,
  };
};

/** Đánh dấu một thông báo đã đọc. Trả về số thông báo chưa đọc còn lại. */
export const markAsRead = async (userId, notificationId) => {
  const result = await Notification.updateOne({ _id: notificationId, userId }, { isRead: true });
  if (result.matchedCount === 0) throw httpError(404, "Không tìm thấy thông báo.");

  return countUnread(userId);
};

/** Đánh dấu tất cả thông báo đã đọc. Trả về số thông báo chưa đọc còn lại. */
export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });

  return countUnread(userId);
};

/** Xoá một thông báo. Trả về số thông báo chưa đọc còn lại. */
export const deleteNotification = async (userId, notificationId) => {
  const result = await Notification.deleteOne({ _id: notificationId, userId });
  if (result.deletedCount === 0) throw httpError(404, "Không tìm thấy thông báo.");

  return countUnread(userId);
};

export const createNotification = async ({ userId, type = "SYSTEM", title, message, data = {} }, { session } = {}) => {
  const [notification] = await Notification.create([{ userId, type, title, message, data }], { session });

  return notification;
};
