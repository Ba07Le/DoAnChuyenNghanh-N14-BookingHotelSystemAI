import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "../src/models/Hotel.js";
import RoomType from "../src/models/RoomType.js";
import Room from "../src/models/Room.js";
import Destination from "../src/models/Destination.js";
import HotelType from "../src/models/HotelType.js";
import Amenity from "../src/models/Amenity.js";
import User from "../src/models/User.js";

// Safe to run more than once: everything is upserted by slug / room number.
// NOTE: averageRating and reviewCount below are DEMO values (there are no real reviews behind them).

const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=82",
];

const DEST = {
  sapa: { name: "Sa Pa", slug: "sa-pa", match: /sa\s?pa/i, region: "Miền Bắc", short: "Thị trấn trong mây với ruộng bậc thang và núi Fansipan." },
  hue: { name: "Huế", slug: "hue", match: /huế|\bhue\b/i, region: "Miền Trung", short: "Cố đô với Đại Nội, sông Hương và ẩm thực cung đình." },
  quynhon: { name: "Quy Nhơn", slug: "quy-nhon", match: /quy\s?nh[ơo]n/i, region: "Miền Trung", short: "Thành phố biển yên tĩnh với bãi biển hoang sơ." },
  muine: { name: "Mũi Né", slug: "mui-ne", match: /mũi\s?né|mui\s?ne/i, region: "Miền Nam", short: "Biển, đồi cát và lướt ván diều." },
  vungtau: { name: "Vũng Tàu", slug: "vung-tau", match: /vũng\s?tàu|vung\s?tau/i, region: "Miền Nam", short: "Biển gần TP.HCM, hợp nghỉ cuối tuần." },
  cantho: { name: "Cần Thơ", slug: "can-tho", match: /cần\s?thơ|can\s?tho/i, region: "Miền Nam", short: "Thủ phủ miền Tây với chợ nổi và sông nước." },
  dalat: { name: "Đà Lạt", slug: "da-lat", match: /đà\s?lạt|da\s?lat/i, region: "Tây Nguyên", short: "Thành phố mát mẻ với hồ, đồi thông và quán cà phê." },
  hoian: { name: "Hội An", slug: "hoi-an", match: /hội\s?an|hoi\s?an/i, region: "Miền Trung", short: "Phố cổ đèn lồng bên sông Hoài." },
  hanoi: { name: "Hà Nội", slug: "ha-noi", match: /hà\s?nội|ha\s?noi/i, region: "Miền Bắc", short: "Thủ đô nghìn năm văn hiến." },
  hcm: { name: "TP. Hồ Chí Minh", slug: "ho-chi-minh", match: /hồ\s?chí\s?minh|ho\s?chi\s?minh|sài\s?gòn|saigon/i, region: "Miền Nam", short: "Thành phố năng động nhất cả nước." },
  danang: { name: "Đà Nẵng", slug: "da-nang", match: /đà\s?nẵng|da\s?nang/i, region: "Miền Trung", short: "Thành phố biển với cầu Rồng và bãi Mỹ Khê." },
  phuquoc: { name: "Phú Quốc", slug: "phu-quoc", match: /phú\s?quốc|phu\s?quoc/i, region: "Miền Nam", short: "Đảo ngọc với bãi biển cát trắng." },
};

const FEATURES = {
  wifi: { label: "Wi-Fi miễn phí", match: /wi-?fi/i, category: "BASIC" },
  pool: { label: "Hồ bơi", match: /pool|hồ bơi/i, category: "HOTEL" },
  spa: { label: "Spa", match: /spa/i, category: "WELLNESS" },
  gym: { label: "Phòng gym", match: /gym|fitness|thể dục/i, category: "WELLNESS" },
  breakfast: { label: "Bữa sáng", match: /breakfast|ăn sáng|bữa sáng/i, category: "FOOD" },
  restaurant: { label: "Nhà hàng", match: /restaurant|nhà hàng/i, category: "FOOD" },
  bar: { label: "Quầy bar", match: /\bbar\b|quầy bar/i, category: "FOOD" },
  parking: { label: "Bãi đỗ xe", match: /parking|đỗ xe|bãi xe/i, category: "BASIC" },
  shuttle: { label: "Đưa đón sân bay", match: /shuttle|đưa đón|sân bay/i, category: "HOTEL" },
  kids: { label: "Khu vui chơi trẻ em", match: /kids|trẻ em|vui chơi/i, category: "HOTEL" },
  ac: { label: "Điều hòa", match: /air.?con|điều hòa/i, category: "ROOM" },
  kitchen: { label: "Bếp riêng", match: /kitchen|bếp/i, category: "ROOM" },
  bike: { label: "Xe đạp miễn phí", match: /bike|xe đạp/i, category: "OTHER" },
  heating: { label: "Máy sưởi", match: /heat|sưởi/i, category: "ROOM" },
};

const TYPE_INFO = {
  HOTEL: { label: "Khách sạn", match: /hotel|khách sạn/i },
  RESORT: { label: "Resort", match: /resort/i },
  VILLA: { label: "Biệt thự", match: /villa|biệt thự/i },
  APARTMENT: { label: "Căn hộ", match: /apartment|căn hộ/i },
  HOMESTAY: { label: "Homestay", match: /homestay/i },
  BOUTIQUE: { label: "Boutique", match: /boutique/i },
};

const HOTELS = [
  {
    slug: "sapa-mist-valley-lodge", name: "Sapa Mist Valley Lodge", dest: "sapa",
    city: "Sa Pa", district: "Sa Pa", addressLine: "Đường Mường Hoa", type: "BOUTIQUE", stars: 4,
    featured: true, rating: 4.6, reviews: 38, coords: [103.844, 22.3364],
    description: "Nhà nghỉ boutique nằm trên sườn đồi nhìn xuống thung lũng Mường Hoa, thường được sương mù bao phủ vào buổi sáng. Phòng ấm áp với máy sưởi và cửa sổ lớn nhìn ruộng bậc thang, phù hợp cho cặp đôi và nhóm bạn thích trekking. Cách trung tâm thị trấn Sa Pa khoảng 10 phút đi xe, không gian yên tĩnh, bữa sáng có đặc sản địa phương.",
    features: ["wifi", "breakfast", "restaurant", "parking"],
    rooms: [
      { name: "Phòng Deluxe hướng thung lũng", bed: "1 giường đôi", size: 28, adults: 2, children: 1, price: 1100000, count: 8 },
      { name: "Phòng Gia đình có gác lửng", bed: "2 giường đôi", size: 42, adults: 4, children: 2, price: 1900000, count: 4 },
    ],
  },
  {
    slug: "hue-imperial-garden-hotel", name: "Hue Imperial Garden Hotel", dest: "hue",
    city: "Huế", district: "Phú Hội", addressLine: "Đường Lê Lợi", type: "HOTEL", stars: 4,
    featured: false, rating: 4.4, reviews: 54, coords: [107.5909, 16.4637],
    description: "Khách sạn mang phong cách cung đình Huế, cách Đại Nội và sông Hương chỉ vài phút đi bộ. Có sân vườn xanh mát và nhà hàng phục vụ ẩm thực Huế như bún bò và bánh bèo, phù hợp du khách muốn tìm hiểu văn hóa và lịch sử. Lễ tân hỗ trợ đặt tour thuyền rồng trên sông Hương.",
    features: ["wifi", "breakfast", "restaurant", "parking", "ac"],
    rooms: [
      { name: "Phòng Superior", bed: "1 giường đôi", size: 26, adults: 2, children: 1, price: 950000, count: 12 },
      { name: "Phòng Deluxe có ban công", bed: "2 giường đơn", size: 32, adults: 2, children: 2, price: 1300000, count: 10 },
      { name: "Phòng Suite Hoàng Gia", bed: "1 giường king + sofa", size: 55, adults: 3, children: 1, price: 2400000, count: 3 },
    ],
  },
  {
    slug: "quy-nhon-seaside-resort", name: "Quy Nhon Seaside Resort", dest: "quynhon",
    city: "Quy Nhơn", district: "Nhơn Lý", addressLine: "Đường ven biển Nhơn Lý", type: "RESORT", stars: 5,
    featured: true, rating: 4.7, reviews: 61, coords: [109.2196, 13.7765],
    description: "Khu nghỉ dưỡng 5 sao bên bãi biển riêng yên tĩnh, ít đông đúc, nước biển trong và cát trắng. Hồ bơi vô cực nhìn ra biển, spa thư giãn và nhà hàng hải sản tươi sống mỗi ngày. Hợp với cặp đôi và gia đình muốn nghỉ dưỡng tránh ồn ào, cách sân bay Phù Cát khoảng 40 phút.",
    features: ["wifi", "pool", "spa", "restaurant", "breakfast", "shuttle", "ac"],
    rooms: [
      { name: "Phòng Deluxe hướng biển", bed: "1 giường king", size: 38, adults: 2, children: 1, price: 2600000, count: 14 },
      { name: "Bungalow hồ bơi riêng", bed: "1 giường king", size: 60, adults: 2, children: 2, price: 4800000, count: 6 },
      { name: "Villa 2 phòng ngủ", bed: "2 giường king", size: 120, adults: 4, children: 2, price: 7500000, count: 3 },
    ],
  },
  {
    slug: "mui-ne-dune-resort", name: "Mui Ne Dune Resort", dest: "muine",
    city: "Phan Thiết", district: "Mũi Né", addressLine: "Đường Nguyễn Đình Chiểu", type: "RESORT", stars: 4,
    featured: false, rating: 4.3, reviews: 47, coords: [108.287, 10.94],
    description: "Resort ven biển Mũi Né, gần đồi cát đỏ và bãi lướt ván diều, có gió biển quanh năm. Có hồ bơi lớn, quầy bar bãi biển và trung tâm thuê thiết bị kitesurf. Thích hợp cho nhóm bạn trẻ và người thích thể thao biển.",
    features: ["wifi", "pool", "bar", "restaurant", "breakfast", "parking", "ac"],
    rooms: [
      { name: "Phòng Garden", bed: "1 giường đôi", size: 30, adults: 2, children: 1, price: 1450000, count: 16 },
      { name: "Phòng Ocean View", bed: "1 giường đôi + 1 giường đơn", size: 36, adults: 2, children: 2, price: 1950000, count: 12 },
      { name: "Bungalow gia đình", bed: "2 giường đôi", size: 55, adults: 4, children: 2, price: 2900000, count: 6 },
    ],
  },
  {
    slug: "vung-tau-sunset-villa", name: "Vung Tau Sunset Villa", dest: "vungtau",
    city: "Vũng Tàu", district: "Bãi Sau", addressLine: "Đường Thùy Vân", type: "VILLA", stars: 4,
    featured: true, rating: 4.5, reviews: 33, coords: [107.0843, 10.346],
    description: "Cụm biệt thự riêng biệt gần Bãi Sau, mỗi căn có hồ bơi riêng, khu nướng BBQ và sân vườn, rất hợp nhóm bạn hoặc gia đình đi cuối tuần từ TP.HCM. Hoàng hôn nhìn rõ từ sân thượng, có thể đặt hải sản tươi trước. Cách trung tâm TP.HCM khoảng 2 giờ lái xe.",
    features: ["wifi", "pool", "parking", "kitchen", "ac"],
    rooms: [
      { name: "Villa 3 phòng ngủ", bed: "3 giường đôi", size: 160, adults: 6, children: 2, price: 4500000, count: 5 },
      { name: "Villa 5 phòng ngủ", bed: "5 giường đôi", size: 280, adults: 10, children: 4, price: 7800000, count: 3 },
    ],
  },
  {
    slug: "can-tho-mekong-river-hotel", name: "Can Tho Mekong River Hotel", dest: "cantho",
    city: "Cần Thơ", district: "Ninh Kiều", addressLine: "Đường Hai Bà Trưng", type: "HOTEL", stars: 4,
    featured: false, rating: 4.2, reviews: 29, coords: [105.7875, 10.0341],
    description: "Khách sạn ven sông Hậu, cách bến Ninh Kiều vài bước chân, nhìn ra cầu Cần Thơ về đêm. Phù hợp du khách muốn đi chợ nổi Cái Răng vào sáng sớm, có nhà hàng đặc sản miền Tây và hỗ trợ đặt tour thuyền. Phòng sạch sẽ, giá hợp lý cho cả công tác lẫn du lịch.",
    features: ["wifi", "breakfast", "restaurant", "parking", "ac"],
    rooms: [
      { name: "Phòng Superior", bed: "1 giường đôi", size: 24, adults: 2, children: 1, price: 780000, count: 14 },
      { name: "Phòng Deluxe view sông", bed: "2 giường đơn", size: 30, adults: 2, children: 2, price: 1100000, count: 10 },
      { name: "Phòng Gia đình", bed: "2 giường đôi", size: 40, adults: 4, children: 2, price: 1700000, count: 5 },
    ],
  },
  {
    slug: "da-lat-flower-garden-hotel", name: "Da Lat Flower Garden Hotel", dest: "dalat",
    city: "Đà Lạt", district: "Phường 1", addressLine: "Đường Nguyễn Chí Thanh", type: "HOTEL", stars: 3,
    featured: false, rating: 4.1, reviews: 72, coords: [108.4419, 11.9404],
    description: "Khách sạn tầm trung gần hồ Xuân Hương và chợ đêm Đà Lạt, đi bộ được tới nhiều quán cà phê và điểm chụp ảnh. Xung quanh có vườn hoa nhỏ, khí hậu mát mẻ quanh năm, giá phải chăng cho sinh viên và gia đình. Bữa sáng nhẹ kiểu Việt.",
    features: ["wifi", "breakfast", "parking", "heating"],
    rooms: [
      { name: "Phòng Standard", bed: "1 giường đôi", size: 20, adults: 2, children: 1, price: 520000, count: 12 },
      { name: "Phòng Gia đình", bed: "2 giường đôi", size: 32, adults: 4, children: 2, price: 980000, count: 6 },
    ],
  },
  {
    slug: "hoi-an-rice-field-retreat", name: "Hoi An Rice Field Retreat", dest: "hoian",
    city: "Hội An", district: "Cẩm Châu", addressLine: "Đường Cẩm Châu", type: "BOUTIQUE", stars: 4,
    featured: true, rating: 4.8, reviews: 66, coords: [108.338, 15.8801],
    description: "Khu nghỉ dưỡng nhỏ giữa cánh đồng lúa, cách phố cổ Hội An khoảng 10 phút đạp xe, khách được mượn xe đạp miễn phí. Không gian yên tĩnh, nhà gỗ phong cách làng quê, có lớp nấu ăn và hồ bơi nhìn ra ruộng. Hợp cặp đôi và người thích nghỉ chậm.",
    features: ["wifi", "pool", "breakfast", "bike", "spa", "ac"],
    rooms: [
      { name: "Phòng Garden", bed: "1 giường king", size: 30, adults: 2, children: 1, price: 1350000, count: 10 },
      { name: "Bungalow nhìn ruộng lúa", bed: "1 giường king", size: 42, adults: 2, children: 2, price: 2100000, count: 8 },
    ],
  },
  {
    slug: "hanoi-west-lake-business-hotel", name: "Hanoi West Lake Business Hotel", dest: "hanoi",
    city: "Hà Nội", district: "Tây Hồ", addressLine: "Đường Xuân Diệu", type: "HOTEL", stars: 5,
    featured: true, rating: 4.6, reviews: 88, coords: [105.8225, 21.0652],
    description: "Khách sạn 5 sao ở khu Tây Hồ, nhìn ra Hồ Tây, gần các khu văn phòng và đại sứ quán. Có phòng họp, phòng gym, spa và nhà hàng quốc tế, phù hợp chuyến công tác dài ngày. Đi xe khoảng 25 phút tới sân bay Nội Bài.",
    features: ["wifi", "gym", "spa", "restaurant", "breakfast", "parking", "shuttle", "ac"],
    rooms: [
      { name: "Phòng Deluxe", bed: "1 giường king", size: 34, adults: 2, children: 1, price: 2200000, count: 20 },
      { name: "Phòng Executive", bed: "1 giường king", size: 45, adults: 2, children: 1, price: 3100000, count: 10 },
      { name: "Phòng Suite", bed: "1 giường king + sofa", size: 70, adults: 3, children: 1, price: 5200000, count: 4 },
    ],
  },
  {
    slug: "saigon-landmark-sky-hotel", name: "Saigon Landmark Sky Hotel", dest: "hcm",
    city: "TP. Hồ Chí Minh", district: "Quận 1", addressLine: "Đường Nguyễn Huệ", type: "HOTEL", stars: 5,
    featured: true, rating: 4.7, reviews: 120, coords: [106.704, 10.7745],
    description: "Khách sạn cao tầng giữa Quận 1, có quầy bar sân thượng nhìn toàn cảnh sông Sài Gòn. Đi bộ tới Nhà hát Thành phố, chợ Bến Thành và phố đi bộ Nguyễn Huệ. Phù hợp du khách thích mua sắm, ẩm thực và đi công tác trong thành phố.",
    features: ["wifi", "pool", "gym", "spa", "bar", "restaurant", "parking", "shuttle", "ac"],
    rooms: [
      { name: "Phòng Deluxe City", bed: "1 giường king", size: 32, adults: 2, children: 1, price: 2000000, count: 24 },
      { name: "Phòng Premier view sông", bed: "1 giường king", size: 40, adults: 2, children: 2, price: 2900000, count: 12 },
      { name: "Phòng Suite", bed: "1 giường king + sofa", size: 75, adults: 3, children: 2, price: 5500000, count: 4 },
    ],
  },
  {
    slug: "da-nang-my-khe-family-resort", name: "Da Nang My Khe Family Resort", dest: "danang",
    city: "Đà Nẵng", district: "Sơn Trà", addressLine: "Đường Võ Nguyên Giáp", type: "RESORT", stars: 4,
    featured: false, rating: 4.4, reviews: 59, coords: [108.248, 16.0544],
    description: "Resort dành cho gia đình trên bãi biển Mỹ Khê, có khu vui chơi trẻ em, hồ bơi nông an toàn và câu lạc bộ cho trẻ. Phòng rộng, có phòng liên thông cho gia đình đông người. Cách cầu Rồng và trung tâm Đà Nẵng khoảng 10 phút.",
    features: ["wifi", "pool", "kids", "restaurant", "breakfast", "parking", "ac"],
    rooms: [
      { name: "Phòng Deluxe Garden", bed: "1 giường king", size: 36, adults: 2, children: 2, price: 1800000, count: 20 },
      { name: "Phòng Gia đình liên thông", bed: "2 giường đôi", size: 64, adults: 4, children: 2, price: 3200000, count: 12 },
    ],
  },
  {
    slug: "phu-quoc-sao-beach-boutique", name: "Phu Quoc Sao Beach Boutique", dest: "phuquoc",
    city: "Phú Quốc", district: "Bãi Sao", addressLine: "Bãi Sao, An Thới", type: "BOUTIQUE", stars: 4,
    featured: true, rating: 4.8, reviews: 41, coords: [104.036, 10.055],
    description: "Khách sạn boutique nhỏ trên Bãi Sao, nước trong, cát trắng mịn và ít người, thích hợp cho cặp đôi và tuần trăng mật. Mỗi phòng có ban công nhìn biển, có bữa tối nến trên bãi biển và xe đạp miễn phí. Cách chợ đêm Dương Đông khoảng 30 phút.",
    features: ["wifi", "pool", "restaurant", "breakfast", "bike", "ac"],
    rooms: [
      { name: "Phòng Ocean Balcony", bed: "1 giường king", size: 30, adults: 2, children: 0, price: 2400000, count: 10 },
      { name: "Phòng Honeymoon", bed: "1 giường king", size: 40, adults: 2, children: 0, price: 3600000, count: 5 },
    ],
  },
];

await mongoose.connect(process.env.MONGODB_URI);

const owner = await User.findOne({ role: "HOTEL_OWNER", status: "ACTIVE" }).select("_id").lean();
if (!owner) throw new Error("No active HOTEL_OWNER user found. Create one first, then run the script again.");

// reuse image URLs already in the database so no link can be broken
const existing = await Hotel.find({ "images.0": { $exists: true } }).select("images").limit(30).lean();
const imagePool = [...new Set(existing.flatMap((h) => h.images.map((i) => i.url)).filter(Boolean))];
const images = imagePool.length ? imagePool : FALLBACK_IMAGES;

const amenities = await Amenity.find().lean();
async function amenityId(key) {
  const f = FEATURES[key];
  let a = amenities.find((x) => f.match.test(x.name || "") || f.match.test(x.slug || ""));
  if (!a) {
    const slug = slugify(f.label);
    a = await Amenity.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name: f.label, slug, category: f.category } },
      { upsert: true, new: true },
    ).lean();
    amenities.push(a);
  }
  return a._id;
}

const hotelTypes = await HotelType.find().lean();
async function hotelTypeFor(type) {
  const info = TYPE_INFO[type];
  let t = hotelTypes.find((x) => info.match.test(x.name || "") || info.match.test(x.slug || ""));
  if (!t) {
    const slug = slugify(info.label);
    t = await HotelType.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name: info.label, slug } },
      { upsert: true, new: true },
    ).lean();
    hotelTypes.push(t);
  }
  return t;
}

const destCache = {};
async function destinationFor(key) {
  if (destCache[key]) return destCache[key];
  const d = DEST[key];
  let doc = await Destination.findOne({ $or: [{ slug: d.slug }, { name: d.match }] });
  if (!doc) {
    doc = await Destination.create({ name: d.name, slug: d.slug, region: d.region, shortDescription: d.short, status: "ACTIVE" });
  }
  destCache[key] = doc;
  return doc;
}

const roomAmenityIds = await Promise.all(["wifi", "ac"].map(amenityId));
const usedDestinations = new Set();

for (const [i, h] of HOTELS.entries()) {
  const dest = await destinationFor(h.dest);
  const ht = await hotelTypeFor(h.type);
  const amenityIds = await Promise.all(h.features.map(amenityId));
  const img = images[i % images.length];
  usedDestinations.add(String(dest._id));

  const hotel = await Hotel.findOneAndUpdate(
    { slug: h.slug },
    {
      $set: {
        ownerId: owner._id,
        hotelTypeId: ht._id,
        destinationId: dest._id,
        name: h.name,
        description: h.description,
        starRating: h.stars,
        address: { addressLine: h.addressLine, district: h.district, city: h.city, country: "Vietnam" },
        location: { type: "Point", coordinates: h.coords },
        images: [{ url: img, publicId: "", isPrimary: true }],
        amenities: amenityIds,
        policies: {
          checkInTime: "14:00",
          checkOutTime: "12:00",
          cancellationPolicy: "Miễn phí hủy trước 48 giờ.",
          childPolicy: "Trẻ em được chào đón.",
          petPolicy: "Vui lòng liên hệ trước.",
        },
        contact: { phone: "028-1111-2222", email: `booking@${h.slug}.demo` },
        status: "APPROVED",
        isFeatured: h.featured,
        hotelType: h.type,
        averageRating: h.rating,
        reviewCount: h.reviews,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  let seq = 0; // room numbers are unique per hotel: 101..108, 201..208, ...
  for (const r of h.rooms) {
    const rt = await RoomType.findOneAndUpdate(
      { hotelId: hotel._id, slug: slugify(r.name) },
      {
        $set: {
          name: r.name,
          description: `${r.name} tại ${h.name}, diện tích ${r.size} m², ${r.bed}.`,
          capacity: { adults: r.adults, children: r.children, total: r.adults + r.children },
          bedType: r.bed,
          size: r.size,
          basePrice: r.price,
          images: [{ url: img, publicId: "" }],
          amenities: roomAmenityIds,
          totalRooms: r.count,
          status: "ACTIVE",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    for (let n = 0; n < r.count; n++) {
      seq += 1;
      const floor = Math.ceil(seq / 8);
      const roomNumber = `${floor}${String(seq - (floor - 1) * 8).padStart(2, "0")}`;
      await Room.updateOne(
        { hotelId: hotel._id, roomNumber },
        { $set: { roomTypeId: rt._id, floor, status: "AVAILABLE" } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }
  }
  console.log("done:", h.name, `(${h.rooms.reduce((s, r) => s + r.count, 0)} rooms)`);
}

for (const id of usedDestinations) {
  await Destination.updateOne({ _id: id }, { hotelCount: await Hotel.countDocuments({ destinationId: id, status: "APPROVED" }) });
}

await mongoose.disconnect();
console.log("Seed finished. Now run: node scripts/embedHotels.js");