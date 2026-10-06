import Hotel from "../models/Hotel.js";
import RoomType from "../models/RoomType.js";
import AIConversation from "../models/AIConversation.js";
import AIRecommendation from "../models/AIRecommendation.js";

export const recommendHotels = async (req, res) => {
  try {
    const { destination = "", maxPrice, minRating = 4 } = req.query;
    const filter = { status: "APPROVED", averageRating: { $gte: Number(minRating) || 0 } };
    if (destination.trim()) filter["address.city"] = { $regex: destination.trim(), $options: "i" };
    const hotels = await Hotel.find(filter).populate("destinationId", "name slug").sort({ isFeatured: -1, averageRating: -1, reviewCount: -1 }).limit(12).lean();
    const ids = hotels.map((h) => h._id);
    const rooms = await RoomType.find({ hotelId: { $in: ids }, status: "ACTIVE", ...(maxPrice ? { basePrice: { $lte: Number(maxPrice) } } : {}) }).sort({ basePrice: 1 }).lean();
    const priceMap = new Map();
    rooms.forEach((r) => { const key = String(r.hotelId); if (!priceMap.has(key)) priceMap.set(key, r.basePrice); });
    const ranked = hotels.map((hotel) => ({ ...hotel, priceFrom: priceMap.get(String(hotel._id)) || 0, aiScore: Number(((hotel.averageRating / 5) * 0.65 + Math.min(hotel.reviewCount / 200, 1) * 0.2 + (hotel.isFeatured ? 0.15 : 0)).toFixed(3)) })).sort((a, b) => b.aiScore - a.aiScore).slice(0, 6);
    if (req.user) await AIRecommendation.create({ userId: req.user._id, hotelIds: ranked.map((h) => h._id), reason: "Xếp hạng theo điểm đánh giá, số lượt đánh giá, nổi bật và tiêu chí tìm kiếm.", source: "RULE_BASED", score: ranked[0]?.aiScore || 0 });
    res.json({ success: true, data: ranked });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: "Không thể tạo gợi ý AI." }); }
};

export const chat = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ success: false, message: "Vui lòng nhập câu hỏi." });
    const lower = message.toLowerCase();
    let answer = "Mình có thể hỗ trợ tìm khách sạn, điểm đến, mức giá và quy trình đặt phòng. Hãy nói điểm đến hoặc ngân sách của bạn.";
    if (lower.includes("đà nẵng")) answer = "Đà Nẵng có nhiều lựa chọn gần biển Mỹ Khê. Bạn có thể lọc theo Resort, khách sạn 4–5 sao hoặc ngân sách mỗi đêm.";
    else if (lower.includes("giá") || lower.includes("ngân sách")) answer = "Bạn có thể nhập mức giá tối đa trong bộ lọc Khách sạn. Hệ thống sẽ ưu tiên loại phòng có giá từ thấp đến cao.";
    else if (lower.includes("đặt phòng")) answer = "Bạn chọn khách sạn → loại phòng → ngày nhận/trả → số khách → xác nhận. Hệ thống kiểm tra tồn phòng theo từng ngày trước khi tạo booking.";
    let conversation = req.user ? await AIConversation.findOne({ userId: req.user._id }).sort({ updatedAt: -1 }) : null;
    if (req.user) {
      if (!conversation) conversation = await AIConversation.create({ userId: req.user._id, title: "AI Travel Assistant", messages: [] });
      conversation.messages.push({ role: "user", content: message }, { role: "assistant", content: answer });
      await conversation.save();
    }
    res.json({ success: true, data: { answer, source: "RULE_BASED" } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: "AI assistant hiện không khả dụng." }); }
};
