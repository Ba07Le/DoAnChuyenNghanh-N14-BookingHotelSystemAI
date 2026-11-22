import Booking from "../../models/Booking.js";
import User from "../../models/User.js";
import Hotel from "../../models/Hotel.js";
import AIInsight from "../../models/AIInsight.js";
import { TZ, buckets } from "../../utils/dateRange.js";

/**
 * ĐỊNH NGHĨA DOANH THU (cả nhóm cần thống nhất):
 * booking đã thanh toán (paymentStatus = PAID) và chưa bị huỷ/hoàn tiền,
 * tính theo ngày tạo booking (createdAt) theo giờ Việt Nam.
 */
export const PAID_MATCH = { paymentStatus: "PAID", status: { $in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] } };
const STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"];

const inRange = ({ start, end }) => ({ $gte: start, $lte: end });
const dateKey = (groupBy, field = "$createdAt") => ({ $dateToString: { format: groupBy === "month" ? "%Y-%m" : "%Y-%m-%d", date: field, timezone: TZ } });
const pct = (cur, prev) => (prev === 0 ? (cur === 0 ? 0 : null) : Math.round(((cur - prev) / prev) * 1000) / 10); // null = kỳ trước bằng 0
const round1 = (n) => Math.round(n * 10) / 10;

const periodMetrics = async (range) => {
  const [rev, agg, newCustomers] = await Promise.all([
    Booking.aggregate([{ $match: { ...PAID_MATCH, createdAt: inRange(range) } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }]),
    Booking.aggregate([
      { $match: { createdAt: inRange(range) } },
      { $group: { _id: null, total: { $sum: 1 }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } } } },
    ]),
    User.countDocuments({ role: "CUSTOMER", createdAt: inRange(range) }),
  ]);
  const total = agg[0]?.total || 0;
  const cancelled = agg[0]?.cancelled || 0;
  return { revenue: rev[0]?.revenue || 0, bookings: total, cancellationRate: total ? round1((cancelled / total) * 100) : 0, newCustomers };
};

export const getOverview = async ({ start, end }) => {
  const span = end.getTime() - start.getTime() + 1;
  const prevRange = { start: new Date(start.getTime() - span), end: new Date(start.getTime() - 1) };
  const [cur, old, totalCustomers, totalOwners, approvedHotels, pendingHotels] = await Promise.all([
    periodMetrics({ start, end }),
    periodMetrics(prevRange),
    User.countDocuments({ role: "CUSTOMER" }),
    User.countDocuments({ role: "HOTEL_OWNER" }),
    Hotel.countDocuments({ status: "APPROVED" }),
    Hotel.countDocuments({ status: "PENDING_APPROVAL" }),
  ]);
  const m = (k) => ({ value: cur[k], previous: old[k], change: pct(cur[k], old[k]) });
  return {
    period: { from: start, to: end },
    totals: { totalCustomers, totalOwners, approvedHotels, pendingHotels },
    metrics: {
      revenue: m("revenue"), bookings: m("bookings"), newCustomers: m("newCustomers"),
      // Tỷ lệ huỷ: change là chênh lệch theo điểm phần trăm, không phải %
      cancellationRate: { value: cur.cancellationRate, previous: old.cancellationRate, change: round1(cur.cancellationRate - old.cancellationRate) },
    },
  };
};

export const getRevenueSeries = async (range, groupBy) => {
  const rows = await Booking.aggregate([
    { $match: { ...PAID_MATCH, createdAt: inRange(range) } },
    { $group: { _id: dateKey(groupBy), revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
  ]);
  const map = new Map(rows.map((r) => [r._id, r]));
  return buckets(range.start, range.end, groupBy).map((k) => ({ date: k, revenue: map.get(k)?.revenue || 0, bookings: map.get(k)?.bookings || 0 }));
};

export const getBookingsByStatus = async (range) => {
  const rows = await Booking.aggregate([{ $match: { createdAt: inRange(range) } }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return STATUSES.map((status) => ({ status, count: map.get(status) || 0 }));
};

export const getTopHotels = (range, limit) =>
  Booking.aggregate([
    { $match: { ...PAID_MATCH, createdAt: inRange(range) } },
    { $group: { _id: "$hotelId", revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
    { $sort: { revenue: -1 } }, { $limit: limit },
    { $lookup: { from: "hotels", localField: "_id", foreignField: "_id", as: "hotel" } },
    { $unwind: { path: "$hotel", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, hotelId: "$_id", name: { $ifNull: ["$hotel.name", "(đã xoá)"] }, city: "$hotel.address.city", revenue: 1, bookings: 1 } },
  ]);

export const getCustomerStats = async (range, groupBy, limit) => {
  const [rows, topCustomers] = await Promise.all([
    User.aggregate([
      { $match: { role: "CUSTOMER", createdAt: inRange(range) } },
      { $group: { _id: dateKey(groupBy), count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { ...PAID_MATCH, createdAt: inRange(range) } },
      { $group: { _id: "$userId", spent: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
      { $sort: { spent: -1 } }, { $limit: limit },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, userId: "$_id", fullName: "$user.fullName", email: "$user.email", spent: 1, bookings: 1 } },
    ]),
  ]);
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return { newCustomers: buckets(range.start, range.end, groupBy).map((k) => ({ date: k, count: map.get(k) || 0 })), topCustomers };
};

export const getCancellation = async (range, groupBy) => {
  const rows = await Booking.aggregate([
    { $match: { createdAt: inRange(range) } },
    { $group: { _id: dateKey(groupBy), total: { $sum: 1 }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } } } },
  ]);
  const map = new Map(rows.map((r) => [r._id, r]));
  const series = buckets(range.start, range.end, groupBy).map((k) => {
    const r = map.get(k);
    return { date: k, total: r?.total || 0, cancelled: r?.cancelled || 0, rate: r?.total ? round1((r.cancelled / r.total) * 100) : 0 };
  });
  const total = series.reduce((s, x) => s + x.total, 0);
  const cancelled = series.reduce((s, x) => s + x.cancelled, 0);
  return { overallRate: total ? round1((cancelled / total) * 100) : 0, total, cancelled, series };
};

// Dữ liệu do module AI (Quân) ghi vào collection ai_insights; admin chỉ đọc
export const getAiInsights = () => AIInsight.find().sort({ createdAt: -1 }).limit(5).populate("hotelId", "name").lean();
