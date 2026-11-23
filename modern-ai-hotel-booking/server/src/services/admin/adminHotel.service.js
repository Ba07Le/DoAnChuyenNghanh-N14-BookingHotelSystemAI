import Hotel from "../../models/Hotel.js";
import RoomType from "../../models/RoomType.js";
import Booking from "../../models/Booking.js";
import Notification from "../../models/Notification.js";
import { httpError } from "../../utils/httpError.js";
import { logAudit } from "../audit.service.js";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listHotels = async ({ page, limit, status, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(esc(search), "i");
    filter.$or = [{ name: rx }, { "address.city": rx }];
  }
  const [items, total, counts] = await Promise.all([
    Hotel.find(filter)
      .select("name slug status images address starRating hotelType ownerId destinationId rejectReason averageRating reviewCount createdAt")
      .populate("ownerId", "fullName email").populate("destinationId", "name")
      // Tab "chờ duyệt": hồ sơ nộp trước hiện trước
      .sort({ createdAt: status === "PENDING_APPROVAL" ? 1 : -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Hotel.countDocuments(filter),
    Hotel.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  return { items, total, statusCounts: Object.fromEntries(counts.map((c) => [c._id, c.n])) };
};

export const getHotel = async (id) => {
  const hotel = await Hotel.findById(id)
    .populate("ownerId", "fullName email phone").populate("destinationId", "name").populate("hotelTypeId", "name").populate("amenities", "name").lean();
  if (!hotel) throw httpError(404, "Không tìm thấy khách sạn.");
  const [roomTypes, bookingStats] = await Promise.all([
    RoomType.find({ hotelId: id }).select("name basePrice capacity totalRooms status").lean(),
    Booking.aggregate([{ $match: { hotelId: hotel._id } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  return { ...hotel, roomTypes, bookingStats: Object.fromEntries(bookingStats.map((b) => [b._id, b.n])) };
};

// Chuyển trạng thái có điều kiện "từ trạng thái nào" trong 1 câu update -> không thể duyệt 2 lần
const transition = async (ctx, id, from, patch) => {
  const hotel = await Hotel.findOneAndUpdate(
    { _id: id, status: from },
    { ...patch, reviewedBy: ctx.actorId, reviewedAt: new Date() },
    { new: true },
  ).lean();
  if (hotel) return hotel;
  const exists = await Hotel.exists({ _id: id });
  if (!exists) throw httpError(404, "Không tìm thấy khách sạn.");
  throw httpError(409, "Trạng thái hiện tại của khách sạn không cho phép thao tác này.");
};

const notifyOwner = (hotel, title, message) =>
  Notification.create({ userId: hotel.ownerId, type: "SYSTEM", title, message, data: { hotelId: hotel._id } }).catch((e) => console.error("Notify failed:", e.message));

export const approveHotel = async (ctx, id) => {
  const hotel = await transition(ctx, id, "PENDING_APPROVAL", { status: "APPROVED", rejectReason: "" });
  await Promise.all([
    logAudit(ctx, { action: "HOTEL_APPROVED", entity: "Hotel", entityId: id, metadata: { name: hotel.name } }),
    notifyOwner(hotel, "Khách sạn đã được duyệt", `"${hotel.name}" đã được duyệt và hiển thị với khách hàng.`),
  ]);
  return hotel;
};

export const rejectHotel = async (ctx, id, { reason }) => {
  const hotel = await transition(ctx, id, "PENDING_APPROVAL", { status: "REJECTED", rejectReason: reason });
  await Promise.all([
    logAudit(ctx, { action: "HOTEL_REJECTED", entity: "Hotel", entityId: id, metadata: { name: hotel.name, reason } }),
    notifyOwner(hotel, "Khách sạn bị từ chối", `"${hotel.name}" chưa được duyệt. Lý do: ${reason}`),
  ]);
  return hotel;
};

// APPROVED <-> SUSPENDED
export const setHotelVisibility = async (ctx, id, { status }) => {
  const from = status === "SUSPENDED" ? "APPROVED" : "SUSPENDED";
  const hotel = await transition(ctx, id, from, { status });
  const upcomingBookings = status === "SUSPENDED"
    ? await Booking.countDocuments({ hotelId: id, status: { $in: ["PENDING", "CONFIRMED"] }, checkOut: { $gt: new Date() } })
    : 0;
  await logAudit(ctx, { action: status === "SUSPENDED" ? "HOTEL_SUSPENDED" : "HOTEL_RESTORED", entity: "Hotel", entityId: id, metadata: { name: hotel.name, upcomingBookings } });
  return { ...hotel, upcomingBookings };
};
