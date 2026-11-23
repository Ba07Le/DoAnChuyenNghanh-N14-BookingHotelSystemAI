import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import RoomType from "../models/RoomType.js";
import Inventory from "../models/Inventory.js";
const safeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Lọc trực tiếp trên dữ liệu MongoDB; mọi lựa chọn trong FilterDrawer đều được hỗ trợ.
const splitValues = (value) =>
  String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const cityMatches = (actual, selected) => {
  const a = normalize(actual),
    b = normalize(selected);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const hcm = [
    "tp ho chi minh",
    "thanh pho ho chi minh",
    "ho chi minh",
    "hcm",
    "sai gon",
  ];
  return hcm.some((x) => a === x) && hcm.some((x) => b === x);
};
const amenityMatches = (actual, requested) => {
  const a = normalize(actual),
    r = normalize(requested);
  const aliases = {
    wifi: ["wifi", "wi fi", "internet"],
    "air-conditioning": [
      "air conditioning",
      "dieu hoa",
      "may lanh",
      "air conditioner",
    ],
    "smart-tv": ["smart tv", "smart television", "tivi thong minh"],
    bathtub: ["bathtub", "bon tam"],
  };
  return (aliases[requested] || [r]).some((x) => a === x || a.includes(x));
};
export const searchHotels = async (req, res) => {
  try {
    const {
      destination = "",
      checkIn,
      checkOut,
      adults = 1,
      children = 0,
      rooms: roomCount = 1,
      roomTypeId,
      hotelType,
      stars,
      rating,
      minPrice,
      maxPrice,
      cities,
      bedTypes,
      amenities,
    } = req.query;
    const totalGuests = Number(adults) + Number(children);
    const roomQuantity = Number(roomCount);
    if (
      !Number.isFinite(totalGuests) ||
      totalGuests < 1 ||
      !Number.isInteger(roomQuantity) ||
      roomQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Số khách và số phòng không hợp lệ.",
      });
    }
    const min =
      minPrice === undefined || minPrice === "" ? null : Number(minPrice);
    const max =
      maxPrice === undefined || maxPrice === "" ? null : Number(maxPrice);
    if (
      [min, max].some((v) => v !== null && (!Number.isFinite(v) || v < 0)) ||
      (min !== null && max !== null && min > max)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Khoảng giá không hợp lệ." });
    }
    let start = null,
      end = null;
    if (checkIn || checkOut) {
      if (!checkIn || !checkOut)
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng chọn đầy đủ ngày." });
      start = new Date(`${checkIn}T00:00:00`);
      end = new Date(`${checkOut}T00:00:00`);
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Khoảng ngày không hợp lệ." });
      }
    }
    const filter = { status: "APPROVED" };
    if (String(destination).trim()) {
      const d = safeRegex(String(destination).trim());
      filter.$or = [
        { name: { $regex: d, $options: "i" } },
        { "address.city": { $regex: d, $options: "i" } },
        { "address.district": { $regex: d, $options: "i" } },
      ];
    }
    const types = splitValues(hotelType);
    if (types.length) filter.hotelType = { $in: types };
    const selectedStars = splitValues(stars)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
    if (selectedStars.length) filter.starRating = { $in: selectedStars };
    if (rating !== undefined && rating !== "")
      filter.averageRating = { $gte: Number(rating) };
    const selectedCities = splitValues(cities);
    const selectedAmenities = splitValues(amenities);
    const selectedBeds = splitValues(bedTypes);
    let hotels = await Hotel.find(filter)
      .populate("hotelTypeId", "name slug")
      .populate("destinationId", "name slug")
      .populate("amenities", "name slug icon")
      .sort({ isFeatured: -1, averageRating: -1, reviewCount: -1 })
      .lean();
    if (selectedCities.length) {
      hotels = hotels.filter((h) =>
        selectedCities.some(
          (city) =>
            cityMatches(h.address?.city, city) ||
            cityMatches(h.address?.district, city) ||
            cityMatches(h.destinationId?.name, city),
        ),
      );
    }
    if (selectedAmenities.length) {
      hotels = hotels.filter((h) =>
        selectedAmenities.every((requested) =>
          (h.amenities || []).some(
            (a) =>
              amenityMatches(a.name, requested) ||
              amenityMatches(a.slug, requested),
          ),
        ),
      );
    }
    const ids = hotels.map((h) => h._id);
    const roomFilter = {
      hotelId: { $in: ids },
      ...(roomTypeId ? { _id: roomTypeId } : {}),
      status: "ACTIVE",
      "capacity.total": { $gte: totalGuests },
      ...(min !== null || max !== null
        ? {
            basePrice: {
              ...(min !== null ? { $gte: min } : {}),
              ...(max !== null ? { $lte: max } : {}),
            },
          }
        : {}),
      ...(selectedBeds.length ? { bedType: { $in: selectedBeds } } : {}),
    };
    const roomList = await RoomType.find(roomFilter)
      .sort({ basePrice: 1 })
      .lean();
    const byHotel = new Map();
    roomList.forEach((room) => {
      const key = String(room.hotelId);
      if (!byHotel.has(key)) byHotel.set(key, []);
      byHotel.get(key).push(room);
    });
    let inventoryMap = null,
      dates = [];
    if (start && end) {
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1))
        dates.push(new Date(d));
      const inventory = await Inventory.find({
        roomTypeId: { $in: roomList.map((r) => r._id) },
        date: { $in: dates },
      }).lean();
      inventoryMap = new Map(
        inventory.map((x) => [
          `${x.roomTypeId}-${x.date.toISOString().slice(0, 10)}`,
          x,
        ]),
      );
    }
    const data = hotels
      .map((hotel) => {
        const candidates = byHotel.get(String(hotel._id)) || [];
        const room = candidates.find(
          (candidate) =>
            !inventoryMap ||
            dates.every((d) => {
              const entry = inventoryMap.get(
                `${candidate._id}-${d.toISOString().slice(0, 10)}`,
              );
              return entry && entry.availableRooms >= roomQuantity;
            }),
        );
        if (!room) return null;
        return {
          _id: hotel._id,
          name: hotel.name,
          slug: hotel.slug,
          description: hotel.description,
          starRating: hotel.starRating,
          stars: hotel.starRating,
          averageRating: hotel.averageRating,
          rating: hotel.averageRating,
          reviewCount: hotel.reviewCount,
          reviews: hotel.reviewCount,
          address: hotel.address,
          images: hotel.images,
          hotelType: hotel.hotelType,
          hotelTypeInfo: hotel.hotelTypeId,
          destination: hotel.destinationId,
          isFeatured: hotel.isFeatured,
          featured: hotel.isFeatured,
          amenities: (hotel.amenities || []).map((a) => a.name),
          priceFrom: room.basePrice,
          price: room.basePrice,
          roomType: {
            _id: room._id,
            name: room.name,
            description: room.description,
            basePrice: room.basePrice,
            capacity: room.capacity,
            bedType: room.bedType,
            size: room.size,
            images: room.images,
          },
        };
      })
      .filter(Boolean);
    res.json({
      success: true,
      message: data.length
        ? "Tìm kiếm thành công."
        : "Không tìm thấy kết quả phù hợp.",
      data,
      filters: {
        destination,
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
        rooms: roomQuantity,
      },
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: "Không thể tìm kiếm khách sạn." });
  }
};
export const getHotelBySlug = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({
      slug: req.params.slug,
      status: "APPROVED",
    })
      .populate("ownerId", "fullName email phone")
      .populate("hotelTypeId", "name slug description image")
      .populate("destinationId", "name slug description image region")
      .populate("amenities", "name slug icon category")
      .lean();
    if (!hotel)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khách sạn." });
    const roomTypes = await RoomType.find({
      hotelId: hotel._id,
      status: "ACTIVE",
    })
      .populate("amenities", "name slug icon")
      .lean();
    const reviews = await (await import("../models/Review.js")).default
      .find({ hotelId: hotel._id, status: "PUBLISHED" })
      .populate("userId", "fullName avatar")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, data: { hotel, roomTypes, reviews } });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: "Không thể tải khách sạn." });
  }
};
export const ownerHotels = async (req, res) => {
  const filter = req.user.role === "ADMIN" ? {} : { ownerId: req.user._id };
  const data = await Hotel.find(filter)
    .populate("hotelTypeId", "name")
    .populate("destinationId", "name")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data });
};

export const createHotel = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "slug",
      "description",
      "hotelTypeId",
      "destinationId",
      "starRating",
      "address",
      "location",
      "images",
      "amenities",
      "policies",
      "contact",
      "hotelType",
    ];

    const body = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        body[field] = req.body[field];
      }
    }

    // Gán chủ sở hữu từ tài khoản đăng nhập
    // Gán chủ sở hữu theo tài khoản đăng nhập
    body.ownerId = req.user._id;

    // Admin được phê duyệt ngay, Hotel Owner phải chờ duyệt
    body.status = req.user.role === "ADMIN" ? "APPROVED" : "PENDING_APPROVAL";

    const data = await Hotel.create(body);

    return res.status(201).json({
      success: true,
      message: "Thêm khách sạn thành công. Đang chờ phê duyệt.",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      ...(req.user.role === "ADMIN" ? {} : { ownerId: req.user._id }),
    };

    // Chỉ cho phép cập nhật thông tin quản lý khách sạn
    const allowedFields = [
      "name",
      "description",
      "hotelTypeId",
      "destinationId",
      "starRating",
      "address",
      "location",
      "images",
      "amenities",
      "policies",
      "contact",
      "hotelType",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có thông tin hợp lệ để cập nhật.",
      });
    }

    const data = await Hotel.findOneAndUpdate(
      filter,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách sạn hoặc không có quyền.",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật khách sạn thành công.",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * XÓA KHÁCH SẠN
 * - Hotel Owner chỉ xóa khách sạn của mình.
 * - Không xóa nếu đã có đơn đặt phòng.
 * - Không xóa nếu đã có loại phòng.
 */
export const deleteHotel = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      ...(req.user.role === "ADMIN" ? {} : { ownerId: req.user._id }),
    };

    // Kiểm tra khách sạn và quyền sở hữu
    const hotel = await Hotel.findOne(filter);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách sạn hoặc bạn không có quyền xóa.",
      });
    }

    // Kiểm tra đơn đặt phòng liên quan
    const hasBooking = await Booking.exists({
      hotelId: hotel._id,
    });

    if (hasBooking) {
      return res.status(409).json({
        success: false,
        message: "Không thể xóa khách sạn đã có đơn đặt phòng.",
      });
    }

    // Kiểm tra loại phòng liên quan
    const hasRoomType = await RoomType.exists({
      hotelId: hotel._id,
    });

    if (hasRoomType) {
      return res.status(409).json({
        success: false,
        message:
          "Không thể xóa khách sạn đang có loại phòng. Vui lòng xử lý dữ liệu phòng trước.",
      });
    }

    // Chỉ xóa khi không có dữ liệu liên quan đã kiểm tra
    await Hotel.deleteOne({
      _id: hotel._id,
      ...(req.user.role === "ADMIN" ? {} : { ownerId: req.user._id }),
    });

    return res.json({
      success: true,
      message: "Xóa khách sạn thành công.",
    });
  } catch (error) {
    console.error("Delete hotel error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa khách sạn.",
    });
  }
};
