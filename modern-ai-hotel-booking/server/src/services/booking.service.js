import mongoose from "mongoose";
import { createHash, randomBytes } from "node:crypto";
import Booking from "../models/Booking.js";
import Coupon from "../models/Coupon.js";
import Hotel from "../models/Hotel.js";
import Inventory from "../models/Inventory.js";
import Payment from "../models/Payment.js";
import RoomType from "../models/RoomType.js";
import { bookingCode, dateOnly, nightsBetween } from "../utils/booking.js";
import { contactSchema } from "../utils/bookingValidators.js";
import { httpError } from "../utils/httpError.js";
import { sendBookingConfirmation } from "./mail.service.js";
import { createNotification } from "./notification.service.js";
import { completePastBookings } from "./bookingLifecycle.service.js";

const MAX_NIGHTS = 30;

// Phương thức thanh toán được lưu trực tiếp trên bản ghi Payment.
const PAYMENT_METHODS = { CASH: "CASH", SEPAY: "SEPAY", ZALOPAY: "ZALOPAY" };

const formatMoney = (value) => new Intl.NumberFormat("vi-VN").format(value);

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
};

// Các đêm ở lại: từ ngày nhận đến trước ngày trả
const listNights = (start, end) => {
  const nights = [];

  for (const day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
    nights.push(new Date(day));
  }

  return nights;
};

// Các hàm đọc dữ liệu chạy tuần tự vì một transaction không chạy song song nhiều thao tác
const loadBookable = async (hotelId, roomTypeId, session) => {
  const hotel = await Hotel.findOne({ _id: hotelId, status: "APPROVED" })
    .select("name slug images address.city policies")
    .session(session ?? null)
    .lean();

  const roomType = await RoomType.findOne({ _id: roomTypeId, hotelId, status: "ACTIVE" })
    .session(session ?? null)
    .lean();

  if (!hotel || !roomType) throw httpError(404, "Không tìm thấy khách sạn hoặc loại phòng.");

  return { hotel, roomType };
};

const parseStay = (checkIn, checkOut) => {
  const start = dateOnly(checkIn);
  const end = dateOnly(checkOut);

  if (!start || !end || end <= start) throw httpError(400, "Ngày nhận/trả phòng không hợp lệ.");
  if (start < startOfToday()) throw httpError(400, "Ngày nhận phòng không được ở trong quá khứ.");

  const nights = nightsBetween(start, end);
  if (nights > MAX_NIGHTS) throw httpError(400, `Mỗi đơn đặt phòng tối đa ${MAX_NIGHTS} đêm.`);

  return { start, end, nights, dates: listNights(start, end) };
};

const checkCapacity = (roomType, { rooms, adults, children }) => {
  const maxGuests = roomType.capacity.total * rooms;

  if (adults + children <= maxGuests) return { ok: true, maxGuests };

  return {
    ok: false,
    maxGuests,
    message: `${rooms} phòng chứa tối đa ${maxGuests} khách. Vui lòng tăng số phòng hoặc giảm số khách.`,
  };
};

const checkAvailability = (inventories, dates, rooms) => {
  if (inventories.length !== dates.length) {
    return { ok: false, message: "Khách sạn chưa mở bán loại phòng này trong khoảng ngày đã chọn." };
  }

  const maxRooms = Math.min(...inventories.map((item) => item.availableRooms));

  if (maxRooms < rooms) {
    return {
      ok: false,
      maxRooms,
      message: maxRooms > 0 ? `Chỉ còn ${maxRooms} phòng trống trong khoảng ngày đã chọn.` : "Phòng đã hết trong khoảng ngày đã chọn.",
    };
  }

  return { ok: true, maxRooms };
};

// Giá theo từng đêm trong kho phòng (giá có thể khác nhau theo ngày)
const calculateSubtotal = (inventories, nights, rooms) => {
  const pricePerRoom = inventories.reduce((sum, item) => sum + item.price, 0);

  return { subtotal: pricePerRoom * rooms, pricePerNight: Math.round(pricePerRoom / nights) };
};

const evaluateCoupon = async (code, { hotelId, roomTypeId, subtotal }, session) => {
  const now = new Date();

  const coupon = await Coupon.findOne({
    code,
    status: "ACTIVE",
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .session(session ?? null)
    .lean();

  if (!coupon) return { applied: false, message: "Mã ưu đãi không hợp lệ hoặc đã hết hạn." };

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { applied: false, message: "Mã ưu đãi đã hết lượt sử dụng." };
  }

  // Danh sách trống nghĩa là áp dụng cho tất cả
  const matches = (list, id) => !list?.length || list.some((item) => String(item) === String(id));

  if (!matches(coupon.applicableHotels, hotelId) || !matches(coupon.applicableRoomTypes, roomTypeId)) {
    return { applied: false, message: "Mã ưu đãi không áp dụng cho phòng này." };
  }

  if (subtotal < coupon.minBookingAmount) {
    return { applied: false, message: `Mã ưu đãi áp dụng cho đơn từ ${formatMoney(coupon.minBookingAmount)}đ.` };
  }

  const discount =
    coupon.discountType === "PERCENTAGE"
      ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount > 0 ? coupon.maxDiscount : Infinity)
      : Math.min(coupon.discountValue, subtotal);

  return { applied: true, message: "Đã áp dụng mã ưu đãi.", discount: Math.round(discount), coupon };
};

/**
 * Tính toàn bộ thông tin một lượt đặt phòng: phòng, tồn phòng theo ngày, giá, mã ưu đãi.
 * Lỗi dữ liệu (ngày không hợp lệ) ném ra 4xx; vượt sức chứa, hết phòng hoặc mã sai thì trả về
 * trong kết quả để trang đặt phòng hiển thị mà không bị coi là lỗi.
 */
const prepareStay = async (input, session) => {
  const { hotel, roomType } = await loadBookable(input.hotelId, input.roomTypeId, session);

  const result = {
    hotel,
    roomType,
    capacity: checkCapacity(roomType, input),
    stay: null,
    availability: null,
    pricing: null,
    coupon: null,
  };
  if (!input.checkIn) return result;

  const stay = parseStay(input.checkIn, input.checkOut);
  const inventories = await Inventory.find({ roomTypeId: roomType._id, date: { $in: stay.dates } })
    .session(session ?? null)
    .lean();

  result.stay = stay;
  result.availability = checkAvailability(inventories, stay.dates, input.rooms);

  // Chưa đủ dữ liệu giá cho mọi đêm thì chưa tính tiền
  if (inventories.length !== stay.dates.length) return result;

  const { subtotal, pricePerNight } = calculateSubtotal(inventories, stay.nights, input.rooms);

  result.coupon = input.couponCode
    ? await evaluateCoupon(input.couponCode, { hotelId: hotel._id, roomTypeId: roomType._id, subtotal }, session)
    : null;

  const discount = result.coupon?.applied ? result.coupon.discount : 0;

  result.pricing = {
    nights: stay.nights,
    rooms: input.rooms,
    pricePerNight,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    couponCode: result.coupon?.applied ? input.couponCode : "",
  };

  return result;
};

/** Thông tin phòng, tồn phòng và giá để trang đặt phòng hiển thị (công khai, không ghi dữ liệu). */
export const getQuote = async (query) => {
  const { hotel, roomType, capacity, stay, availability, pricing, coupon } = await prepareStay(query);

  return {
    hotel: {
      _id: hotel._id,
      name: hotel.name,
      slug: hotel.slug,
      image: hotel.images?.[0]?.url ?? "",
      city: hotel.address?.city ?? "",
      checkInTime: hotel.policies?.checkInTime,
      checkOutTime: hotel.policies?.checkOutTime,
      cancellationPolicy: hotel.policies?.cancellationPolicy,
    },
    roomType: { _id: roomType._id, name: roomType.name, basePrice: roomType.basePrice, capacity: roomType.capacity },
    nights: stay?.nights ?? null,
    capacity,
    availability,
    pricing,
    coupon: coupon && { code: query.couponCode, applied: coupon.applied, message: coupon.message },
  };
};

// Khách đã đăng nhập: lấy thông tin còn thiếu từ hồ sơ. Khách vãng lai: phải tự nhập đủ.
const resolveContact = (user, guestInfo = {}) => {
  const result = contactSchema.safeParse({
    // Chuỗi rỗng coi như chưa nhập để báo đúng lỗi "Vui lòng nhập ..."
    fullName: guestInfo.fullName || user?.fullName || undefined,
    email: guestInfo.email || user?.email || undefined,
    phone: guestInfo.phone || user?.phone || undefined,
  });

  if (!result.success) throw httpError(400, result.error.issues[0].message);

  return result.data;
};

/**
 * Tạo đơn đặt phòng cho khách đã đăng nhập (user) hoặc khách vãng lai (user = null).
 * Giá luôn do server tính; trừ phòng, dùng mã ưu đãi và tạo đơn nằm trong một transaction.
 */
export const createBooking = async (user, input) => {
  const contact = resolveContact(user, input.guestInfo);
  const isGuestOnlinePayment = !user?._id && input.paymentMethod !== "CASH";
  // Token bí mật chỉ trả một lần cho trình duyệt khách vãng lai; database chỉ lưu SHA-256.
  const guestPaymentToken = isGuestOnlinePayment ? randomBytes(32).toString("hex") : null;
  const guestPaymentTokenHash = guestPaymentToken
    ? createHash("sha256").update(guestPaymentToken, "utf8").digest("hex")
    : undefined;
  const session = await mongoose.startSession();

  let booking;
  let details;

  try {
    await session.withTransaction(async () => {
      const { hotel, roomType, capacity, stay, availability, pricing, coupon } = await prepareStay(input, session);

      if (!capacity.ok) throw httpError(400, capacity.message);
      if (!availability.ok) throw httpError(409, availability.message);
      if (input.couponCode && !coupon.applied) throw httpError(400, coupon.message);

      // Trừ phòng cho tất cả các đêm trong một lệnh; thiếu phòng ở đêm nào thì huỷ cả đơn
      const reserved = await Inventory.updateMany(
        { roomTypeId: roomType._id, date: { $in: stay.dates }, availableRooms: { $gte: input.rooms } },
        { $inc: { availableRooms: -input.rooms } },
        { session },
      );
      if (reserved.modifiedCount !== stay.dates.length) {
        throw httpError(409, "Phòng vừa được đặt hết. Vui lòng chọn ngày khác.");
      }

      if (coupon?.applied) {
        const limit = coupon.coupon.usageLimit;
        const used = await Coupon.updateOne(
          { _id: coupon.coupon._id, ...(limit > 0 && { usedCount: { $lt: limit } }) },
          { $inc: { usedCount: 1 } },
          { session },
        );
        if (used.modifiedCount !== 1) throw httpError(409, "Mã ưu đãi vừa hết lượt sử dụng.");
      }

      [booking] = await Booking.create(
        [
          {
            bookingCode: bookingCode(),
            userId: user?._id ?? null,
            hotelId: hotel._id,
            roomTypeId: roomType._id,
            checkIn: stay.start,
            checkOut: stay.end,
            guests: { adults: input.adults, children: input.children },
            rooms: input.rooms,
            guestInfo: { ...contact, note: input.guestInfo.note },
            pricePerNight: pricing.pricePerNight,
            nights: pricing.nights,
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            totalAmount: pricing.total,
            couponCode: pricing.couponCode,
            status: input.paymentMethod === "CASH" ? "CONFIRMED" : "PENDING_PAYMENT",
            paymentStatus: "UNPAID",
          },
        ],
        { session },
      );

      await Payment.create(
        [
          {
            bookingId: booking._id,
            userId: user?._id ?? null,
            amount: pricing.total,
            method: PAYMENT_METHODS[input.paymentMethod],
            status: "PENDING",
            ...(guestPaymentTokenHash ? { guestPaymentTokenHash } : {}),
          },
        ],
        { session },
      );

      // Khách vãng lai không có tài khoản nên không có thông báo trong ứng dụng
      if (user) {
        await createNotification(
          {
            userId: user._id,
            type: input.paymentMethod === "CASH" ? "BOOKING_CONFIRMED" : "SYSTEM",
            title: input.paymentMethod === "CASH" ? "Đặt phòng thành công" : "Đơn đặt phòng đang chờ thanh toán",
            message: input.paymentMethod === "CASH"
              ? `Mã đặt phòng ${booking.bookingCode} đã được tạo.`
              : `Mã đặt phòng ${booking.bookingCode} đã được giữ chỗ. Vui lòng hoàn tất thanh toán để xác nhận đơn.` ,
            data: { bookingId: booking._id, hotelId: hotel._id },
          },
          { session },
        );
      }

      details = { hotel, roomType, pricing };
    });
  } finally {
    await session.endSession();
  }

  // Với CASH, đơn đã xác nhận nên gửi email ngay. Đơn online chỉ nên báo xác nhận sau IPN/callback hợp lệ.
  if (input.paymentMethod === "CASH") {
    sendBookingConfirmation(contact.email, {
      bookingCode: booking.bookingCode,
      guestName: contact.fullName,
      hotelName: details.hotel.name,
      roomName: details.roomType.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: details.pricing.nights,
      rooms: input.rooms,
      guests: input.adults + input.children,
      total: details.pricing.total,
      paymentMethod: input.paymentMethod,
    }).catch(console.error);
  }

  const created = await Booking.findById(booking._id)
    .populate("hotelId", "name slug images address")
    .populate("roomTypeId", "name basePrice")
    .lean();

  return {
    ...created,
    paymentMethod: input.paymentMethod,
    // Frontend dùng token này để tạo giao dịch và kiểm tra trạng thái, không cần tài khoản.
    ...(guestPaymentToken ? { guestPaymentToken } : {}),
  };
};

/** Khách vãng lai xem lại đơn bằng mã đặt phòng và email đã dùng khi đặt. */
export const lookupBooking = async ({ code, email }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const match = await Booking.findOne({ bookingCode: code, "guestInfo.email": normalizedEmail }).select("_id").lean();
  if (match) await completePastBookings(null, match._id);
  const booking = await Booking.findOne({ bookingCode: code, "guestInfo.email": normalizedEmail })
    .populate("hotelId", "name slug images address policies")
    .populate("roomTypeId", "name")
    .lean();

  if (!booking) throw httpError(404, "Không tìm thấy đơn đặt phòng với mã và email này.");

  const payment = await Payment.findOne({ bookingId: booking._id }).select("method status").lean();

  return {
    bookingCode: booking.bookingCode,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    rooms: booking.rooms,
    guests: booking.guests,
    pricePerNight: booking.pricePerNight,
    subtotal: booking.subtotal,
    discount: booking.discount,
    totalAmount: booking.totalAmount,
    couponCode: booking.couponCode,
    guestName: booking.guestInfo?.fullName,
    hotel: booking.hotelId,
    roomType: booking.roomTypeId,
    payment: payment && { method: payment.method, status: payment.status },
  };
};
