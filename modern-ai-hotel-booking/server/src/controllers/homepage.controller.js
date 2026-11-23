import "../models/Amenity.js";
import Hotel from "../models/Hotel.js";
import Destination from "../models/Destination.js";
import HotelType from "../models/HotelType.js";
import Coupon from "../models/Coupon.js";
import RoomType from "../models/RoomType.js";

const FEATURED_HOTEL_LIMIT = 6;

export const getHomepageData = async (req, res) => {
  try {
    const now = new Date();

    const [destinations, randomHotels, hotelTypes, deals] = await Promise.all([
      Destination.find({ status: "ACTIVE", featured: true })
        .sort({ sortOrder: 1 })
        .limit(8)
        .lean(),

      // Lấy ngẫu nhiên tối đa 6 khách sạn đã được duyệt, trên toàn bộ dữ liệu.
      // Không giới hạn isFeatured để cả khách sạn vừa seed có cơ hội hiển thị.
      Hotel.aggregate([
        { $match: { status: "APPROVED" } },
        { $sample: { size: FEATURED_HOTEL_LIMIT } },
      ]),

      HotelType.find({ status: "ACTIVE" }).sort({ sortOrder: 1 }).lean(),

      Coupon.find({
        status: "ACTIVE",
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .sort({ featured: -1, discountValue: -1 })
        .limit(6)
        .lean(),
    ]);

    // Aggregate không tự populate, nên thực hiện sau khi chọn ngẫu nhiên.
    const featuredHotels = await Hotel.populate(randomHotels, [
      { path: "hotelTypeId", select: "name slug" },
      { path: "destinationId", select: "name slug" },
      { path: "amenities", select: "name slug icon" },
    ]);

    const featuredIds = featuredHotels.map((hotel) => hotel._id);
    const featuredRooms = await RoomType.find({
      hotelId: { $in: featuredIds },
      status: "ACTIVE",
    })
      .sort({ basePrice: 1 })
      .lean();

    const priceMap = new Map();
    for (const room of featuredRooms) {
      const hotelId = String(room.hotelId);
      if (!priceMap.has(hotelId)) {
        priceMap.set(hotelId, room.basePrice);
      }
    }

    const typeCounts = await Hotel.aggregate([
      { $match: { status: "APPROVED" } },
      { $group: { _id: "$hotelType", hotelCount: { $sum: 1 } } },
    ]);
    const typeCountMap = Object.fromEntries(
      typeCounts.map((entry) => [entry._id, entry.hotelCount]),
    );

    const formattedTypes = hotelTypes.map((type) => ({
      ...type,
      type: type.slug.toUpperCase(),
      hotelCount: typeCountMap[type.slug.toUpperCase()] || 0,
    }));

    const formattedHotels = featuredHotels.map((hotel) => ({
      ...hotel,
      priceFrom: priceMap.get(String(hotel._id)) || 0,
    }));

    // Tránh cache cũ giữ nguyên cùng sáu khách sạn khi F5.
    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: {
        destinations: destinations.map((destination) => ({
          ...destination,
          city: destination.name,
          image: destination.image?.url || "",
        })),
        featuredHotels: formattedHotels,
        hotelTypes: formattedTypes,
        deals,
      },
    });
  } catch (error) {
    console.error("Homepage API error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải dữ liệu trang chủ.",
    });
  }
};
