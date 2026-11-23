/**
 * HotelAI: nạp THÊM 30 khách sạn DEMO, không xóa/chỉnh sửa khách sạn hiện có.
 * Chạy: node scripts/seed30Hotels.js
 * Tuỳ chọn: SEED_DAYS=180 (mặc định 180 ngày tồn phòng kể từ hôm nay).
 * Dữ liệu khách sạn, địa chỉ, giá và hình ảnh đều là MINH HỌA, không phải cơ sở kinh doanh đã xác minh.
 * URL ảnh lấy từ Unsplash và phụ thuộc nguồn ngoài; dùng ảnh có giấy phép phù hợp khi công bố sản phẩm.
 * Cần tồn tại ít nhất một User ACTIVE có role HOTEL_OWNER.
 */
import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "../src/models/Hotel.js";
import HotelType from "../src/models/HotelType.js";
import Destination from "../src/models/Destination.js";
import Amenity from "../src/models/Amenity.js";
import RoomType from "../src/models/RoomType.js";
import Room from "../src/models/Room.js";
import Inventory from "../src/models/Inventory.js";
import User from "../src/models/User.js";

const slugify = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const photo = (id, width = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const IMAGE = {
  luxury: ["photo-1566073771259-6a8506099945", "photo-1582719508461-905c673771fd", "photo-1571896349842-33c89424de2d", "photo-1564501049412-61c2a3083791"],
  beach: ["photo-1542314831-068cd1dbfeeb", "photo-1571896349842-33c89424de2d", "photo-1551882547-ff40c63fe5fa", "photo-1584132967334-10e028bd69f7"],
  city: ["photo-1551882547-ff40c63fe5fa", "photo-1566073771259-6a8506099945", "photo-1564501049412-61c2a3083791", "photo-1578683010236-d716f9a3f461"],
  nature: ["photo-1542314831-068cd1dbfeeb", "photo-1584132967334-10e028bd69f7", "photo-1571896349842-33c89424de2d", "photo-1564013799919-ab600027ffc6"],
  home: ["photo-1564013799919-ab600027ffc6", "photo-1522708323590-d24dbb6b0267", "photo-1584132967334-10e028bd69f7", "photo-1560448204-e02f11c3d0e2"],
};
const ROOM_PHOTOS = ["photo-1611892440504-42a792e24d32", "photo-1590490360182-c33d57733427", "photo-1616594039964-ae9021a400a0", "photo-1591088398332-8a7791972843", "photo-1566665797739-1674de7a421a", "photo-1586023492125-27b2c045efd7"];
const DESTINATIONS = {
  "ha-noi": ["Hà Nội", "Miền Bắc", [105.8342, 21.0278]],
  "da-nang": ["Đà Nẵng", "Miền Trung", [108.2022, 16.0544]],
  "da-lat": ["Đà Lạt", "Tây Nguyên", [108.4419, 11.9404]],
  "nha-trang": ["Nha Trang", "Miền Trung", [109.1967, 12.2388]],
  "phu-quoc": ["Phú Quốc", "Miền Nam", [103.984, 10.227]],
  "ho-chi-minh": ["TP. Hồ Chí Minh", "Miền Nam", [106.7009, 10.7769]],
  "hoi-an": ["Hội An", "Miền Trung", [108.327, 15.8801]],
  "ha-long": ["Hạ Long", "Miền Bắc", [107.077, 20.951]],
  "sa-pa": ["Sa Pa", "Miền Bắc", [103.8438, 22.3364]],
  "hue": ["Huế", "Miền Trung", [107.5909, 16.4637]],
  "quy-nhon": ["Quy Nhơn", "Miền Trung", [109.2196, 13.7765]],
  "mui-ne": ["Mũi Né", "Miền Nam", [108.278, 10.934]],
  "vung-tau": ["Vũng Tàu", "Miền Nam", [107.0843, 10.346]],
  "can-tho": ["Cần Thơ", "Miền Nam", [105.784, 10.034]],
};
const TYPES = {
  HOTEL: ["hotel", "Khách sạn"], RESORT: ["resort", "Resort"],
  VILLA: ["villa", "Villa"], APARTMENT: ["apartment", "Căn hộ"],
  HOMESTAY: ["homestay", "Homestay"], BOUTIQUE: ["boutique", "Boutique Hotel"],
};
const AMENITIES = {
  wifi: ["Wi-Fi miễn phí", "BASIC"], ac: ["Điều hòa", "ROOM"], parking: ["Bãi đỗ xe", "BASIC"],
  pool: ["Hồ bơi", "HOTEL"], spa: ["Spa", "WELLNESS"], gym: ["Phòng gym", "WELLNESS"],
  breakfast: ["Bữa sáng", "FOOD"], restaurant: ["Nhà hàng", "FOOD"], bar: ["Quầy bar", "FOOD"],
  kitchen: ["Bếp riêng", "ROOM"], family: ["Phòng gia đình", "ROOM"],
  shuttle: ["Đưa đón sân bay", "HOTEL"], balcony: ["Ban công", "ROOM"],
  view: ["Tầm nhìn đẹp", "HOTEL"], bike: ["Xe đạp miễn phí", "OTHER"],
  kids: ["Khu vui chơi trẻ em", "HOTEL"], bathtub: ["Bồn tắm", "ROOM"],
};
// 30 cơ sở lưu trú HƯ CẤU phục vụ demo, không dùng tên/địa chỉ để nhận là khách sạn thật.
// Mỗi dòng: [tên, điểm đến, loại, sao, giá phòng cơ bản VND, số phòng mỗi loại,
//            nhóm ảnh, tiện nghi, mô tả đặc trưng]
const DATA = [
  ["Hanoi Lantern Heritage Stay", "ha-noi", "BOUTIQUE", 3, 790000, 6, "city", ["wifi","ac","breakfast","bike"], "Không gian boutique mang hơi thở phố cổ, thích hợp đi bộ khám phá Hà Nội và trải nghiệm ẩm thực địa phương."],
  ["West Lake Skyline Suites", "ha-noi", "HOTEL", 5, 2450000, 10, "luxury", ["wifi","ac","pool","gym","spa","restaurant","parking","bathtub"], "Lưu trú cao cấp với thiết kế hiện đại, khu thư giãn và không gian làm việc gần Hồ Tây."],
  ["Hanoi Family Apartment House", "ha-noi", "APARTMENT", 3, 1150000, 5, "home", ["wifi","ac","kitchen","family","parking"], "Căn hộ có bếp và khu sinh hoạt chung phù hợp gia đình ở dài ngày."],
  ["Da Nang Azure Beach Resort", "da-nang", "RESORT", 5, 2750000, 9, "beach", ["wifi","ac","pool","spa","breakfast","restaurant","kids","view"], "Resort mô phỏng nghỉ dưỡng bên biển với hồ bơi ngoài trời, bữa sáng và khu vui chơi trẻ em."],
  ["Han River Urban Boutique", "da-nang", "BOUTIQUE", 4, 1250000, 7, "city", ["wifi","ac","bar","breakfast","balcony","parking"], "Khách sạn boutique phong cách tối giản cho chuyến du lịch khám phá cầu Rồng và sông Hàn."],
  ["Son Tra Nature Homestay", "da-nang", "HOMESTAY", 2, 490000, 5, "nature", ["wifi","ac","bike","view"], "Homestay bình dân với nhiều cây xanh, hợp nhóm bạn yêu thích thiên nhiên và chuyến đi tiết kiệm."],
  ["Da Lat Pinewood Retreat", "da-lat", "RESORT", 4, 1650000, 7, "nature", ["wifi","spa","breakfast","parking","view","bathtub"], "Khu nghỉ dưỡng mô phỏng giữa rừng thông, không khí mát và không gian yên tĩnh."],
  ["Dalat Flower House Homestay", "da-lat", "HOMESTAY", 2, 420000, 5, "home", ["wifi","kitchen","bike","balcony"], "Ngôi nhà nhỏ nhiều hoa và góc cà phê dành cho khách thích trải nghiệm địa phương."],
  ["Dalat Hilltop Family Villa", "da-lat", "VILLA", 4, 3200000, 4, "nature", ["wifi","kitchen","family","parking","view","bathtub"], "Villa riêng tư trên đồi, phù hợp nhóm gia đình đông người và kỳ nghỉ cuối tuần."],
  ["Nha Trang Coral Sands Hotel", "nha-trang", "HOTEL", 4, 1320000, 8, "beach", ["wifi","ac","pool","breakfast","restaurant","view"], "Khách sạn phong cách biển với hồ bơi và khu ăn sáng tiện lợi cho hành trình khám phá vịnh."],
  ["Nha Trang Ocean Pearl Resort", "nha-trang", "RESORT", 5, 3300000, 8, "luxury", ["wifi","ac","pool","spa","gym","restaurant","kids","shuttle"], "Nghỉ dưỡng biển cao cấp với nhiều khu tiện ích phù hợp cặp đôi và gia đình."],
  ["Nha Trang Backpacker Nest", "nha-trang", "HOMESTAY", 2, 390000, 6, "home", ["wifi","ac","bike","kitchen"], "Lưu trú tiết kiệm cho người đi phượt, gần các hoạt động trung tâm ven biển."],
  ["Phu Quoc Sunset Garden Villa", "phu-quoc", "VILLA", 5, 3950000, 4, "beach", ["wifi","ac","pool","kitchen","parking","view","bathtub"], "Villa mô phỏng nghỉ dưỡng nhiệt đới có hồ bơi riêng và không gian sân vườn."],
  ["Phu Quoc Palm Breeze Resort", "phu-quoc", "RESORT", 4, 1980000, 9, "beach", ["wifi","ac","pool","breakfast","restaurant","bike","shuttle"], "Khu nghỉ dưỡng thư giãn gần biển, phù hợp kỳ nghỉ gia đình và khám phá đảo."],
  ["Phu Quoc Island Budget Inn", "phu-quoc", "HOTEL", 2, 550000, 6, "city", ["wifi","ac","parking"], "Lựa chọn tiết kiệm cho khách cần phòng gọn gàng khi khám phá Phú Quốc."],
  ["Saigon Riverside Executive Hotel", "ho-chi-minh", "HOTEL", 5, 2700000, 10, "luxury", ["wifi","ac","pool","gym","spa","bar","restaurant","shuttle"], "Khách sạn phong cách thương mại ở khu trung tâm, có không gian họp và dịch vụ tiện nghi."],
  ["Saigon Creative Loft Apartment", "ho-chi-minh", "APARTMENT", 3, 990000, 5, "home", ["wifi","ac","kitchen","balcony","parking"], "Căn hộ thiết kế sáng tạo, có bếp và chỗ làm việc cho lưu trú dài ngày."],
  ["Saigon Garden Boutique Hotel", "ho-chi-minh", "BOUTIQUE", 4, 1520000, 6, "city", ["wifi","ac","breakfast","restaurant","parking"], "Không gian boutique gần các tuyến tham quan trung tâm với sân vườn và khu ăn sáng."],
  ["Hoi An Lantern Riverside Homestay", "hoi-an", "HOMESTAY", 3, 710000, 5, "home", ["wifi","ac","breakfast","bike","balcony"], "Homestay gợi cảm hứng đèn lồng và sông Hoài, thích hợp khám phá phố cổ."],
  ["Hoi An Rice Field Boutique", "hoi-an", "BOUTIQUE", 4, 1480000, 7, "nature", ["wifi","ac","pool","breakfast","bike","view"], "Lưu trú boutique yên bình nhìn ra đồng lúa, có hồ bơi và xe đạp trải nghiệm."],
  ["Ha Long Bayview Panorama Hotel", "ha-long", "HOTEL", 4, 1850000, 8, "city", ["wifi","ac","gym","breakfast","restaurant","view"], "Khách sạn demo nhìn ra khu vực vịnh, thuận tiện chuẩn bị hành trình tham quan đảo."],
  ["Ha Long Marina Family Resort", "ha-long", "RESORT", 5, 2880000, 9, "beach", ["wifi","ac","pool","spa","kids","restaurant","parking","view"], "Khu nghỉ dưỡng mô phỏng có tiện ích gia đình, nhà hàng và khu thư giãn."],
  ["Sapa Cloud Forest Lodge", "sa-pa", "BOUTIQUE", 4, 1350000, 6, "nature", ["wifi","breakfast","restaurant","parking","view","balcony"], "Lodge theo cảm hứng núi rừng, hướng đến trải nghiệm thung lũng và ruộng bậc thang."],
  ["Sapa Terraced Fields Homestay", "sa-pa", "HOMESTAY", 2, 460000, 5, "nature", ["wifi","breakfast","bike","view"], "Homestay phong cách vùng cao, giá vừa phải cho người thích khám phá bản làng."],
  ["Hue Royal Courtyard Boutique", "hue", "BOUTIQUE", 4, 1230000, 7, "city", ["wifi","ac","breakfast","restaurant","bike","parking"], "Thiết kế lấy cảm hứng kiến trúc Huế, phù hợp khách tham quan di sản và thưởng thức ẩm thực."],
  ["Hue Perfume River Budget Hotel", "hue", "HOTEL", 2, 520000, 6, "city", ["wifi","ac","parking"], "Khách sạn cơ bản, chi phí hợp lý cho hành trình khám phá cố đô."],
  ["Quy Nhon Blue Coast Resort", "quy-nhon", "RESORT", 4, 2150000, 8, "beach", ["wifi","ac","pool","spa","restaurant","breakfast","view"], "Khu nghỉ dưỡng biển phong cách hiện đại, hướng đến khách thích không gian yên tĩnh."],
  ["Mui Ne Sand Dune Villas", "mui-ne", "VILLA", 4, 2650000, 4, "beach", ["wifi","ac","pool","kitchen","family","parking","view"], "Biệt thự demo gần cảnh quan đồi cát, hợp nhóm bạn hoặc gia đình."],
  ["Vung Tau Weekend Seaview Hotel", "vung-tau", "HOTEL", 3, 920000, 8, "beach", ["wifi","ac","breakfast","parking","balcony","view"], "Khách sạn nghỉ cuối tuần với phòng ban công và không gian ven biển."],
  ["Can Tho Mekong Garden Stay", "can-tho", "HOMESTAY", 3, 680000, 6, "nature", ["wifi","ac","breakfast","bike","kitchen"], "Homestay phong cách miệt vườn, thích hợp trải nghiệm du lịch sông nước miền Tây."],
];
if (DATA.length !== 30) throw new Error(`Dự kiến 30 khách sạn, thực tế ${DATA.length}`);
const DAYS = Number(process.env.SEED_DAYS || 180);
if (!Number.isInteger(DAYS) || DAYS < 1 || DAYS > 365) throw new Error("SEED_DAYS phải từ 1 đến 365");
if (!process.env.MONGODB_URI) throw new Error("Thiếu MONGODB_URI trong server/.env");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const owner = await User.findOne({ role: "HOTEL_OWNER", status: "ACTIVE" }).select("_id").lean();
    if (!owner) throw new Error("Chưa có HOTEL_OWNER ACTIVE trong database; hãy tạo tài khoản Owner trước.");
    const amIds = {};
    for (const [code, [name, category]] of Object.entries(AMENITIES)) {
      const slug = slugify(name);
      const doc = await Amenity.findOneAndUpdate({ slug }, { $setOnInsert: { slug, name, category } }, { upsert: true, new: true });
      amIds[code] = doc._id;
    }
    const typeIds = {};
    for (const [code, [slug, name]] of Object.entries(TYPES)) {
      const doc = await HotelType.findOneAndUpdate({ slug }, { $setOnInsert: { slug, name, status: "ACTIVE" } }, { upsert: true, new: true });
      typeIds[code] = doc._id;
    }
    const destIds = {};
    for (const [slug, [name, region]] of Object.entries(DESTINATIONS)) {
      let doc = await Destination.findOne({ slug });
      if (!doc) doc = await Destination.findOne({ name }); // tránh bản ghi trùng vì slug cũ khác
      if (!doc) doc = await Destination.findOneAndUpdate({ slug }, { $setOnInsert: { slug, name, region, country: "Vietnam", status: "ACTIVE" } }, { upsert: true, new: true });
      destIds[slug] = doc._id;
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let hotelNew = 0, roomTypeNew = 0, roomNew = 0, inventoryNew = 0;
    for (const [index, [name, destSlug, type, stars, basePrice, count, theme, featureCodes, description]] of DATA.entries()) {
      const slug = `hotelai-demo-${slugify(name)}`;
      const city = DESTINATIONS[destSlug][0];
      const center = DESTINATIONS[destSlug][2];
      const ids = IMAGE[theme];
      const pictureIds = [ids[index % ids.length], ids[(index + 1) % ids.length], ids[(index + 2) % ids.length]];
      let hotel = await Hotel.findOne({ slug });
      if (!hotel) {
        const result = await Hotel.updateOne({ slug }, { $setOnInsert: {
          ownerId: owner._id, hotelTypeId: typeIds[type], destinationId: destIds[destSlug],
          name, slug, description: `[KHÁCH SẠN DEMO] ${description} Hình ảnh, địa chỉ và thông tin phục vụ mô phỏng cho đồ án HotelAI.`,
          starRating: stars, address: { addressLine: "Địa chỉ minh họa – không dùng để đến trực tiếp", district: "Khu vực trung tâm", city, country: "Vietnam" },
          location: { type: "Point", coordinates: center },
          images: pictureIds.map((id, i) => ({ url: photo(id), isPrimary: i === 0, publicId: "" })),
          amenities: featureCodes.map((code) => amIds[code]),
          policies: { checkInTime: "14:00", checkOutTime: "12:00", cancellationPolicy: "Chính sách mô phỏng: miễn phí hủy trước 48 giờ.", childPolicy: "Trẻ em được chào đón.", petPolicy: "Liên hệ cơ sở lưu trú." },
          status: "APPROVED", isFeatured: index % 4 === 0, hotelType: type,
          averageRating: 0, reviewCount: 0, // KHÔNG bịa đánh giá khách hàng
        } }, { upsert: true });
        if (result.upsertedCount) hotelNew++;
        hotel = await Hotel.findOne({ slug });
      }
      const templates = [
        { label: "Standard", multiplier: 1, adults: 2, children: 0, bed: "1 giường đôi", area: 25 },
        { label: "Deluxe", multiplier: 1.45, adults: 2, children: 1, bed: "1 giường king", area: 34 },
        { label: "Family", multiplier: 1.95, adults: 4, children: 2, bed: "2 giường đôi", area: 50 },
      ];
      // Villa/căn hộ có room type riêng cho các nhóm đông người
      if (["VILLA", "APARTMENT"].includes(type)) templates[0] = { label: "Entire Unit", multiplier: 1, adults: 4, children: 2, bed: "2 giường queen", area: 65 };
      for (const [rIndex, t] of templates.entries()) {
        const rtSlug = `demo-${slugify(t.label)}`;
        const price = Math.round((basePrice * t.multiplier) / 10000) * 10000;
        const roomPhoto = photo(ROOM_PHOTOS[(index * 3 + rIndex) % ROOM_PHOTOS.length]);
        let roomType = await RoomType.findOne({ hotelId: hotel._id, slug: rtSlug });
        if (!roomType) {
          const result = await RoomType.updateOne({ hotelId: hotel._id, slug: rtSlug }, { $setOnInsert: {
            hotelId: hotel._id, name: `${t.label} - ${name}`, slug: rtSlug,
            description: `Loại phòng demo ${t.label}, ${t.area} m², ${t.bed}, ${city}.`,
            capacity: { adults: t.adults, children: t.children, total: t.adults + t.children },
            bedType: t.bed, size: t.area, basePrice: price,
            images: [{ url: roomPhoto, publicId: "" }, { url: photo(ROOM_PHOTOS[(index + rIndex + 1) % ROOM_PHOTOS.length]), publicId: "" }],
            amenities: [amIds.wifi, amIds.ac, ...(type === "APARTMENT" || type === "VILLA" ? [amIds.kitchen] : [])],
            totalRooms: count, status: "ACTIVE",
          } }, { upsert: true });
          if (result.upsertedCount) roomTypeNew++;
          roomType = await RoomType.findOne({ hotelId: hotel._id, slug: rtSlug });
        }
        const roomOps = Array.from({ length: count }, (_, n) => ({
          updateOne: { filter: { hotelId: hotel._id, roomNumber: `${rIndex + 1}${String(n + 1).padStart(2, "0")}` },
            update: { $setOnInsert: { hotelId: hotel._id, roomTypeId: roomType._id,
              roomNumber: `${rIndex + 1}${String(n + 1).padStart(2, "0")}`, floor: rIndex + 1, status: "AVAILABLE" } }, upsert: true },
        }));
        if (roomOps.length) { const x = await Room.bulkWrite(roomOps, { ordered: false }); roomNew += x.upsertedCount; }
        const days = Array.from({ length: DAYS }, (_, offset) => {
          const date = new Date(today); date.setDate(today.getDate() + offset);
          return { updateOne: { filter: { roomTypeId: roomType._id, date },
            update: { $setOnInsert: { hotelId: hotel._id, roomTypeId: roomType._id, date,
              totalRooms: count, availableRooms: count, blockedRooms: 0, price } }, upsert: true } };
        });
        const x = await Inventory.bulkWrite(days, { ordered: false });
        inventoryNew += x.upsertedCount;
      }
      console.log(`[${index + 1}/30] ${name} → ${city} | ${type} | từ ${basePrice.toLocaleString("vi-VN")}đ`);
    }
    for (const destId of Object.values(destIds)) {
      const hotelCount = await Hotel.countDocuments({ destinationId: destId, status: "APPROVED" });
      await Destination.updateOne({ _id: destId }, { $set: { hotelCount } });
    }
    console.log(`\nXONG: tạo thêm ${hotelNew} khách sạn, ${roomTypeNew} loại phòng, ${roomNew} phòng, ${inventoryNew} ngày tồn phòng.`);
    console.log("Script idempotent: chạy lại không thêm trùng và không ghi đè dữ liệu/giá/tồn phòng đã có.");
    console.log("Dữ liệu demo dùng ảnh minh họa, không phải ảnh xác thực của cơ sở lưu trú thực tế.");
  } finally { await mongoose.disconnect(); }
}
main().catch((err) => { console.error("Lỗi seed:", err.message); process.exitCode = 1; });
