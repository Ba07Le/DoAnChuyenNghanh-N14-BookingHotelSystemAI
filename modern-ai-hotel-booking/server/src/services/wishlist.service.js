import Hotel from "../models/Hotel.js";
import Wishlist from "../models/Wishlist.js";
import { httpError } from "../utils/httpError.js";

const MAX_ITEMS = 200;
const HOTEL_FIELDS = "name slug images address.city starRating averageRating reviewCount";

/** Danh sách khách sạn đã lưu (mới nhất trước), chỉ lấy các trường trang Wishlist cần. */
export const listWishlist = async (userId) => {
  const items = await Wishlist.find({ userId })
    .sort({ createdAt: -1 })
    .limit(MAX_ITEMS)
    .populate({ path: "hotelId", match: { status: "APPROVED" }, select: HOTEL_FIELDS })
    .lean();

  // Bỏ khách sạn đã bị xoá hoặc không còn hiển thị công khai
  return items
    .filter((item) => item.hotelId)
    .map((item) => ({ id: item._id, savedAt: item.createdAt, hotel: item.hotelId }));
};

/** Chỉ trả về id để client tô tim ở các thẻ khách sạn, chỉ cần một request. */
export const listWishlistIds = async (userId) => {
  const ids = await Wishlist.distinct("hotelId", { userId });

  return ids.map(String);
};

/** Thêm khách sạn vào wishlist. Gọi lặp lại vẫn an toàn (không tạo bản ghi trùng). */
export const addToWishlist = async (userId, hotelId) => {
  const exists = await Hotel.exists({ _id: hotelId, status: "APPROVED" });
  if (!exists) throw httpError(404, "Không tìm thấy khách sạn.");

  try {
    await Wishlist.updateOne({ userId, hotelId }, { $setOnInsert: { userId, hotelId } }, { upsert: true });
  } catch (error) {
    // Hai yêu cầu thêm cùng lúc: bản ghi đã có rồi thì coi như thành công
    if (error.code !== 11000) throw error;
  }
};

/** Bỏ khách sạn khỏi wishlist. Gọi lặp lại vẫn an toàn. */
export const removeFromWishlist = async (userId, hotelId) => {
  await Wishlist.deleteOne({ userId, hotelId });
};
