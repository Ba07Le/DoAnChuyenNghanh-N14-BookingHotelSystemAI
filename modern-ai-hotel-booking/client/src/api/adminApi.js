import api from "./apiClient";

// Bỏ các tham số rỗng để không gửi ?search=&status=
const clean = (p = {}) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== "" && v !== undefined && v !== null));
const get = async (url, params) => (await api.get(`/admin${url}`, { params: clean(params) })).data;
const patch = async (url, body = {}) => (await api.patch(`/admin${url}`, body)).data;
const post = async (url, body = {}) => (await api.post(`/admin${url}`, body)).data;
const del = async (url) => (await api.delete(`/admin${url}`)).data;

export const adminApi = {
  overview: (p) => get("/dashboard/overview", p),
  aiInsights: () => get("/dashboard/ai-insights"),
  revenue: (p) => get("/analytics/revenue", p),
  bookingsByStatus: (p) => get("/analytics/bookings-by-status", p),
  topHotels: (p) => get("/analytics/top-hotels", p),
  customers: (p) => get("/analytics/customers", p),

  users: (p) => get("/users", p),
  user: (id) => get(`/users/${id}`),
  setUserStatus: ({ id, ...body }) => patch(`/users/${id}/status`, body),

  hotels: (p) => get("/hotels", p),
  hotel: (id) => get(`/hotels/${id}`),
  approveHotel: (id) => patch(`/hotels/${id}/approve`),
  rejectHotel: ({ id, reason }) => patch(`/hotels/${id}/reject`, { reason }),
  setHotelStatus: ({ id, status }) => patch(`/hotels/${id}/status`, { status }),

  bookings: (p) => get("/bookings", p),
  booking: (id) => get(`/bookings/${id}`),
  cancelBooking: ({ id, reason }) => patch(`/bookings/${id}/cancel`, { reason }),

  cancellation: (p) => get("/analytics/cancellation-rate", p),

  coupons: (p) => get("/coupons", p),
  createCoupon: (body) => post("/coupons", body),
  updateCoupon: ({ id, ...body }) => patch(`/coupons/${id}`, body),
  setCouponStatus: ({ id, status }) => patch(`/coupons/${id}/status`, { status }),
  deleteCoupon: (id) => del(`/coupons/${id}`),

  auditLogs: (p) => get("/audit-logs", p),
};
