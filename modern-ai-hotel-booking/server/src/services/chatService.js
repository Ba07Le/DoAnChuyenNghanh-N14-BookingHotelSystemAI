import { openai, embed } from "./embedding.js";
import Hotel from "../models/Hotel.js";
import RoomType from "../models/RoomType.js";
import Destination from "../models/Destination.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import "../models/Amenity.js";
import Booking from "../models/Booking.js";

const VN_OFFSET = 7 * 3600 * 1000;
const DAY = 864e5;
const dayKey = (d) => new Date(new Date(d).getTime() + VN_OFFSET).toISOString().slice(0, 10);

function nightsBetween(ci, co) {
  const out = [];
  for (let t = Date.parse(ci); t < Date.parse(co); t += DAY) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

async function approvedHotelIdsByCity(city) {
  const rx = new RegExp(esc(city), "i");
  const dests = await Destination.find({ status: "ACTIVE", $or: [{ name: rx }, { slug: rx }] }).select("_id").lean();
  return Hotel.distinct("_id", {
    status: "APPROVED",
    $or: [{ destinationId: { $in: dests.map((d) => d._id) } }, { "address.city": rx }],
  });
}

const systemPrompt = (loggedIn) => `Bạn là trợ lý đặt phòng khách sạn. Trả lời bằng ngôn ngữ của người dùng (Việt hoặc Anh).
Hôm nay là ${dayKey(new Date())} (giờ Việt Nam).
- Luôn dùng công cụ để lấy dữ liệu thật. Không bịa khách sạn, giá, phòng hay mã giảm giá.
- Với yêu cầu mơ hồ (yên tĩnh, lãng mạn, gần biển...) dùng semantic_search_hotels. Với bộ lọc rõ ràng (thành phố, giá, số khách) dùng search_hotels / find_rooms.
- Khi khách hỏi phòng theo ngày, dùng check_availability với ngày dạng YYYY-MM-DD. Thiếu ngày nhận/trả phòng thì hỏi lại. Khách không nói năm thì dùng năm gần nhất trong tương lai.
- Giá là VND/đêm (giá cơ bản). Tổng tiền = giá × số đêm × số phòng, chưa áp mã giảm giá.
- Tên thành phố nên viết tiếng Việt có dấu (vd: Đà Nẵng).
- Gợi ý 2-4 lựa chọn, mỗi lựa chọn kèm lý do ngắn.
${loggedIn
  ? "- Người dùng ĐÃ đăng nhập: khi gợi ý khách sạn, gọi get_user_profile để dùng ngân sách, điểm đến yêu thích, loại phòng ưa thích và wishlist (ngân sách 0 nghĩa là chưa đặt). Khi họ hỏi về đơn đặt phòng của mình, dùng get_my_bookings."
  : "- Người dùng CHƯA đăng nhập: không có dữ liệu cá nhân. Nếu họ hỏi về đơn đặt phòng hoặc wishlist, nhắc họ đăng nhập."}
- Nếu thiếu thông tin quan trọng, hỏi một câu ngắn.`;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function fromPrices(ids) {
  const rows = await RoomType.aggregate([
    { $match: { hotelId: { $in: ids }, status: "ACTIVE" } },
    { $group: { _id: "$hotelId", fromPrice: { $min: "$basePrice" } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.fromPrice]));
}

const shape = (h, prices) => ({
  id: String(h._id),
  name: h.name,
  stars: h.starRating,
  type: h.hotelType,
  rating: h.averageRating,
  city: h.address?.city,
  district: h.address?.district,
  fromPrice: prices[String(h._id)] ?? null,
  summary: (h.description || "").slice(0, 200),
  ...(h.score !== undefined && { score: Number(h.score.toFixed(3)) }),
});

const handlers = {
  async semantic_search_hotels({ query, minStars, hotelType, limit = 4 }) {
    const filter = { status: "APPROVED" };
    if (minStars) filter.starRating = { $gte: minStars };
    if (hotelType) filter.hotelType = hotelType;

    const hotels = await Hotel.aggregate([
      {
        $vectorSearch: {
          index: "hotel_vector_index",
          path: "embedding",
          queryVector: await embed(query),
          numCandidates: 50,
          limit: Math.min(limit, 8),
          filter,
        },
      },
      {
        $project: {
          name: 1, starRating: 1, hotelType: 1, averageRating: 1, description: 1,
          "address.city": 1, "address.district": 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
    const good = hotels.filter((h) => h.score > 0.5);
    const prices = await fromPrices(good.map((h) => h._id));
    return good.map((h) => shape(h, prices));
  },

  async search_hotels({ city, minStars, hotelType, minPrice, maxPrice, guests, limit = 5 }) {
    const q = { status: "APPROVED" };
    if (city) {
      const rx = new RegExp(esc(city), "i");
      const dests = await Destination.find({ status: "ACTIVE", $or: [{ name: rx }, { slug: rx }] })
        .select("_id").lean();
      q.$or = [
        { destinationId: { $in: dests.map((d) => d._id) } },
        { "address.city": rx },
        { name: rx },
      ];
    }
    if (minStars) q.starRating = { $gte: minStars };
    if (hotelType) q.hotelType = hotelType;

    if (minPrice || maxPrice || guests) {
      const rq = { status: "ACTIVE" };
      if (minPrice || maxPrice) {
        rq.basePrice = {};
        if (minPrice) rq.basePrice.$gte = minPrice;
        if (maxPrice) rq.basePrice.$lte = maxPrice;
      }
      if (guests) rq["capacity.total"] = { $gte: guests };
      q._id = { $in: await RoomType.distinct("hotelId", rq) };
    }

    const hotels = await Hotel.find(q)
      .sort({ averageRating: -1, isFeatured: -1 })
      .limit(Math.min(limit, 10))
      .select("name starRating hotelType averageRating description address.city address.district")
      .lean();
    const prices = await fromPrices(hotels.map((h) => h._id));
    return hotels.map((h) => shape(h, prices));
  },

  async find_rooms({ hotelId, maxPrice, adults, children = 0, limit = 8 }) {
    const q = { status: "ACTIVE" };
    if (hotelId) q.hotelId = hotelId;
    if (maxPrice) q.basePrice = { $lte: maxPrice };
    if (adults) {
      q["capacity.adults"] = { $gte: adults };
      q["capacity.total"] = { $gte: adults + children };
    }
    const rooms = await RoomType.find(q)
      .sort({ basePrice: 1 })
      .limit(Math.min(limit, 15))
      .populate("hotelId", "name starRating status address.city")
      .select("name bedType size basePrice capacity hotelId")
      .lean();

    return rooms
      .filter((r) => r.hotelId?.status === "APPROVED")
      .map((r) => ({
        roomTypeId: String(r._id),
        room: r.name,
        bed: r.bedType,
        sizeM2: r.size,
        pricePerNight: r.basePrice,
        capacity: r.capacity,
        hotel: { id: String(r.hotelId._id), name: r.hotelId.name, stars: r.hotelId.starRating, city: r.hotelId.address?.city },
      }));
  },
    async check_availability({ checkIn, checkOut, adults = 1, children = 0, rooms = 1, hotelId, city, maxPrice, limit = 6 }) {
    const dateOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
    if (!dateOk(checkIn) || !dateOk(checkOut)) return { error: "Ngày không hợp lệ, cần dạng YYYY-MM-DD" };
    const nights = nightsBetween(checkIn, checkOut);
    if (!nights.length) return { error: "Ngày trả phòng phải sau ngày nhận phòng" };
    if (nights.length > 30) return { error: "Chỉ hỗ trợ tối đa 30 đêm" };
    if (checkIn < dayKey(new Date())) return { error: "Ngày nhận phòng đã qua" };

    const rq = { status: "ACTIVE", "capacity.total": { $gte: Math.ceil((adults + children) / rooms) } };
    if (hotelId) rq.hotelId = hotelId;
    else if (city) rq.hotelId = { $in: await approvedHotelIdsByCity(city) };
    if (maxPrice) rq.basePrice = { $lte: maxPrice };

    const types = await RoomType.find(rq)
      .sort({ basePrice: 1 })
      .limit(30)
      .populate("hotelId", "name starRating status address.city")
      .select("name bedType size basePrice capacity totalRooms hotelId")
      .lean();
    const ok = types.filter((t) => t.hotelId?.status === "APPROVED");

    const bookings = await Booking.find({
      roomTypeId: { $in: ok.map((t) => t._id) },
      status: { $in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      checkIn: { $lt: new Date(Date.parse(checkOut) + DAY) },
      checkOut: { $gt: new Date(Date.parse(checkIn) - DAY) },
    }).select("roomTypeId rooms checkIn checkOut").lean();

    // rooms already booked per room type per night
    const booked = {};
    for (const b of bookings) {
      const ci = dayKey(b.checkIn), co = dayKey(b.checkOut), key = String(b.roomTypeId);
      booked[key] ??= {};
      for (const n of nights) if (ci <= n && n < co) booked[key][n] = (booked[key][n] || 0) + (b.rooms || 1);
    }

    const results = ok
      .map((t) => {
        const peak = Math.max(0, ...Object.values(booked[String(t._id)] || {}));
        return {
          roomTypeId: String(t._id),
          room: t.name,
          bed: t.bedType,
          sizeM2: t.size,
          capacity: t.capacity,
          pricePerNight: t.basePrice,
          totalPrice: t.basePrice * nights.length * rooms,
          roomsLeft: t.totalRooms - peak,
          hotel: { id: String(t.hotelId._id), name: t.hotelId.name, stars: t.hotelId.starRating, city: t.hotelId.address?.city },
        };
      })
      .filter((r) => r.roomsLeft >= rooms)
      .slice(0, limit);

    return { checkIn, checkOut, nights: nights.length, rooms, results };
  },
    async get_my_bookings({ upcomingOnly = true, limit = 5 }, { userId }) {
    if (!userId) return { error: "User not logged in" };
    const q = { userId };
    if (upcomingOnly) {
      q.status = { $in: ["PENDING", "CONFIRMED", "CHECKED_IN"] };
      q.checkOut = { $gte: new Date() };
    }
    const rows = await Booking.find(q)
      .sort({ checkIn: upcomingOnly ? 1 : -1 })
      .limit(Math.min(limit, 10))
      .populate("hotelId", "name address.city")
      .populate("roomTypeId", "name")
      .select("bookingCode hotelId roomTypeId checkIn checkOut nights rooms totalAmount status paymentStatus")
      .lean();
    return rows.map((b) => ({
      code: b.bookingCode,
      hotel: b.hotelId?.name,
      city: b.hotelId?.address?.city,
      room: b.roomTypeId?.name,
      checkIn: dayKey(b.checkIn),
      checkOut: dayKey(b.checkOut),
      nights: b.nights,
      rooms: b.rooms,
      total: b.totalAmount,
      status: b.status,
      payment: b.paymentStatus,
    }));
  },

  async get_coupons() {
    const now = new Date();
    const coupons = await Coupon.find({ status: "ACTIVE", startDate: { $lte: now }, endDate: { $gte: now } })
      .select("code title shortDescription discountType discountValue minBookingAmount maxDiscount usageLimit usedCount endDate")
      .lean();
    return coupons.filter((c) => !c.usageLimit || c.usedCount < c.usageLimit);
  },

  // userId comes from your auth middleware, never from the model
  async get_user_profile(_args, { userId }) {
    if (!userId) return { error: "User not logged in" };
    const [user, wishlist] = await Promise.all([
      User.findById(userId).select("fullName preferences").lean(),
      Wishlist.find({ userId }).populate("hotelId", "name address.city").limit(10).lean(),
    ]);
    return {
      name: user?.fullName,
      preferences: user?.preferences,
      wishlist: wishlist.filter((w) => w.hotelId).map((w) => ({ id: String(w.hotelId._id), name: w.hotelId.name, city: w.hotelId.address?.city })),
    };
  },
};

const fn = (name, description, properties = {}, required = []) => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const HOTEL_TYPES = ["HOTEL", "RESORT", "VILLA", "APARTMENT", "HOMESTAY", "BOUTIQUE"];

const tools = [
  fn("semantic_search_hotels", "Tìm khách sạn theo ý nghĩa/phong cách (yên tĩnh, lãng mạn, gần biển, gia đình...).", {
    query: { type: "string", description: "Mô tả nhu cầu của khách" },
    minStars: { type: "number" },
    hotelType: { type: "string", enum: HOTEL_TYPES },
    limit: { type: "number" },
  }, ["query"]),
  fn("search_hotels", "Lọc khách sạn theo thành phố, sao, loại, khoảng giá/đêm, số khách.", {
    city: { type: "string" },
    minStars: { type: "number" },
    hotelType: { type: "string", enum: HOTEL_TYPES },
    minPrice: { type: "number" },
    maxPrice: { type: "number" },
    guests: { type: "number" },
    limit: { type: "number" },
  }),
  fn("find_rooms", "Tìm loại phòng theo giá và sức chứa, rẻ nhất trước.", {
    hotelId: { type: "string" },
    maxPrice: { type: "number" },
    adults: { type: "number" },
    children: { type: "number" },
    limit: { type: "number" },
  }),
  fn("get_coupons", "Danh sách mã giảm giá đang có hiệu lực."),
  fn("get_user_profile", "Sở thích và wishlist của người dùng đang đăng nhập."),
  fn("get_my_bookings", "Đơn đặt phòng của người dùng đang đăng nhập (mặc định: các đơn sắp tới).", {
    upcomingOnly: { type: "boolean", description: "false để xem cả đơn đã qua" },
    limit: { type: "number" },
  }),
  fn("check_availability", "Kiểm tra phòng còn trống theo ngày nhận/trả phòng; trả về giá tổng và số phòng còn lại.", {
    checkIn: { type: "string", description: "YYYY-MM-DD" },
    checkOut: { type: "string", description: "YYYY-MM-DD" },
    adults: { type: "number" },
    children: { type: "number" },
    rooms: { type: "number", description: "Số phòng cần đặt" },
    hotelId: { type: "string" },
    city: { type: "string" },
    maxPrice: { type: "number", description: "Giá tối đa mỗi đêm" },
    limit: { type: "number" },
  }, ["checkIn", "checkOut"]),
];

export async function chat(history, userId) {
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
  const messages = [{ role: "system", content: systemPrompt(!!userId) }, ...history];

  for (let i = 0; i < 5; i++) {
    const res = await openai.chat.completions.create({ model, messages, tools, temperature: 0.3 });
    const msg = res.choices[0].message;
    messages.push(msg);
    if (!msg.tool_calls?.length) return msg.content;

    for (const call of msg.tool_calls) {
      let out;
      try {
        out = await handlers[call.function.name](JSON.parse(call.function.arguments || "{}"), { userId });
      } catch (e) {
        out = { error: e.message };
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out) });
    }
  }
  return "Xin lỗi, mình chưa xử lý được yêu cầu này. Bạn thử hỏi lại nhé.";
}