import api from "./apiClient";

export const getNotifications = async (params) => (await api.get("/notifications", { params })).data;

export const getUnreadCount = async () => (await api.get("/notifications/unread-count")).data;

export const markNotificationRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data;

export const markAllNotificationsRead = async () => (await api.patch("/notifications/read-all")).data;

export const deleteNotification = async (id) => (await api.delete(`/notifications/${id}`)).data;
