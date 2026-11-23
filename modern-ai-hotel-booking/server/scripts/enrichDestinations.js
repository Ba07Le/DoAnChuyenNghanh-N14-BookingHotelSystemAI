/**
 * HOTELAI - ENRICH DESTINATIONS
 *
 * Chạy:
 * node scripts/enrichDestinations.js
 *
 * Chỉ cập nhật 6 điểm đến:
 * Sa Pa, Huế, Quy Nhơn, Mũi Né, Vũng Tàu, Cần Thơ.
 *
 * - Không thay đổi 8 điểm đến ban đầu.
 * - Không ghi đè ảnh Admin đã cập nhật.
 * - Không ghi đè nội dung đã có.
 * - Không tạo dữ liệu điểm đến mới.
 * - Có thể chạy lại nhiều lần.
 */

import "dotenv/config";
import mongoose from "mongoose";
import Destination from "../src/models/Destination.js";

// =====================================
// 1. NỘI DUNG CHI TIẾT CÁC ĐIỂM ĐẾN
// =====================================

const content = {
  "da-nang": [
    "Đà Nẵng nằm ở dải duyên hải miền Trung, nổi bật với bờ biển dài, nhịp sống hiện đại và sự kết nối thuận tiện đến nhiều di sản văn hóa. Những buổi bình minh bên biển cùng các cây cầu bắc qua sông Hàn tạo nên diện mạo đặc trưng của thành phố.",
    "Biển Mỹ Khê, bán đảo Sơn Trà, Ngũ Hành Sơn và các cây cầu bên sông Hàn.",
    "Dạo biển, ngắm thành phố về đêm, khám phá thiên nhiên Sơn Trà và tham quan những địa điểm lân cận.",
    "Mì Quảng, bún chả cá, bánh tráng cuốn thịt heo.",
    "Thời tiết thường thuận lợi cho hoạt động biển vào mùa khô; nên theo dõi dự báo thời tiết trước chuyến đi.",
    "Nên lên kế hoạch di chuyển theo từng khu vực; chú ý quy định bảo vệ môi trường tại bán đảo Sơn Trà.",
  ],

  "da-lat": [
    "Đà Lạt nằm trên cao nguyên Lâm Viên, mang đến không khí dịu mát, những con đường quanh co, rừng thông và hồ nước yên bình. Thành phố phù hợp cho kỳ nghỉ thư giãn, trải nghiệm quán cà phê và dạo chơi giữa thiên nhiên.",
    "Hồ Xuân Hương, thung lũng và đồi thông, các vườn hoa cùng vùng ngoại ô cao nguyên.",
    "Tản bộ quanh hồ, khám phá nông trại, thưởng thức cà phê và ngắm bình minh.",
    "Bánh căn, bánh mì xíu mại, lẩu gà lá é.",
    "Khí hậu mát quanh năm; buổi tối có thể lạnh, đặc biệt vào các tháng cuối năm.",
    "Mang áo khoác và giày thoải mái; nên đặt phòng sớm dịp cuối tuần hoặc lễ.",
  ],

  "nha-trang": [
    "Nha Trang là thành phố ven biển với vịnh nước xanh, các đảo và đường bờ biển sôi động. Du khách có thể kết hợp nghỉ dưỡng, tham quan văn hóa và trải nghiệm những chuyến đi biển.",
    "Bãi biển trung tâm, vịnh Nha Trang, các đảo và tháp Bà Ponagar.",
    "Tắm biển, tham quan vịnh, thưởng thức ẩm thực và dạo phố ven biển.",
    "Bún cá, nem nướng, hải sản.",
    "Kiểm tra thời tiết biển và lịch vận hành tàu trước khi đặt tour.",
    "Chọn hoạt động biển phù hợp với điều kiện thời tiết, ưu tiên nhà cung cấp có bảo hộ an toàn.",
  ],

  "phu-quoc": [
    "Phú Quốc là đảo lớn nổi tiếng với những bãi cát dài, làn nước xanh và cảnh sắc nhiệt đới. Không gian biển đảo phù hợp với kỳ nghỉ gia đình, đôi bạn hoặc chuyến khám phá thiên nhiên.",
    "Bãi Sao, khu vực bờ biển phía tây, làng chài và các khu bảo tồn thiên nhiên.",
    "Ngắm hoàng hôn, trải nghiệm ẩm thực biển, khám phá đảo và nghỉ dưỡng.",
    "Gỏi cá trích, bún quậy, hải sản.",
    "Mùa khô thường thuận lợi hơn cho một số hoạt động biển; thời tiết có thể thay đổi.",
    "Kiểm tra điều kiện sóng gió trước các chuyến đi đảo; bảo vệ san hô và môi trường biển.",
  ],

  "ha-noi": [
    "Hà Nội kết hợp nhịp sống thủ đô với chiều sâu lịch sử qua những con phố nhỏ, hồ nước và công trình kiến trúc cổ. Một chuyến đi có thể bắt đầu bằng cà phê sáng, tham quan di tích và kết thúc với ẩm thực phố cổ.",
    "Hồ Hoàn Kiếm, khu phố cổ, Văn Miếu và các bảo tàng.",
    "Dạo phố cổ, tham quan di tích, khám phá quán cà phê và ẩm thực đường phố.",
    "Phở, bún chả, bánh cuốn, cà phê trứng.",
    "Mùa thu và những ngày đầu đông thường được yêu thích để dạo phố.",
    "Kiểm tra thời gian mở cửa điểm tham quan; cân nhắc đi bộ hoặc phương tiện công cộng tại khu trung tâm.",
  ],

  "ho-chi-minh": [
    "TP. Hồ Chí Minh là đô thị sôi động, nơi các tòa nhà hiện đại đan xen cùng kiến trúc lịch sử, chợ truyền thống và khu phố ẩm thực. Thành phố là điểm khởi đầu thuận tiện cho nhiều hành trình tại miền Nam.",
    "Bưu điện Trung tâm, chợ Bến Thành, khu vực đường Nguyễn Huệ và các bảo tàng.",
    "Khám phá phố đi bộ, tham quan di tích, trải nghiệm ẩm thực và không gian đô thị.",
    "Cơm tấm, bánh mì, hủ tiếu và cà phê.",
    "Có thể tham quan quanh năm; nên chuẩn bị cho thời tiết nóng và mưa theo mùa.",
    "Để dư thời gian di chuyển vào giờ cao điểm và bảo quản tư trang ở nơi đông người.",
  ],

  "hoi-an": [
    "Hội An cuốn hút bằng những ngôi nhà cổ, con phố nhỏ và ánh đèn lồng ven sông. Không gian phố cổ đặc biệt phù hợp với hành trình tìm hiểu kiến trúc, nghề thủ công và những món ăn địa phương.",
    "Khu phố cổ, Chùa Cầu, những hội quán và bờ sông Hoài.",
    "Đi bộ trong phố cổ, tìm hiểu làng nghề, tham quan các ngôi nhà cổ.",
    "Cao lầu, mì Quảng, cơm gà.",
    "Kiểm tra dự báo mưa lũ trước khi đi, đặc biệt các tháng cuối năm.",
    "Tôn trọng quy định bảo tồn di sản và chọn giờ tham quan phù hợp để tránh quá đông.",
  ],

  "ha-long": [
    "Hạ Long nổi bật với cảnh quan đảo đá vôi và mặt nước rộng mở. Các hành trình trên vịnh mang đến góc nhìn đặc biệt về thiên nhiên vùng Đông Bắc.",
    "Vịnh Hạ Long, các đảo đá vôi, hang động và khu vực ven bờ.",
    "Đi du thuyền, ngắm vịnh, tham quan hang động theo tuyến được phép.",
    "Chả mực và hải sản địa phương.",
    "Lịch tàu phụ thuộc điều kiện thời tiết, đặc biệt trong mùa bão.",
    "Đặt dịch vụ tàu được cấp phép và tuân thủ hướng dẫn an toàn trên vịnh.",
  ],

  "sa-pa": [
    "Sa Pa nổi bật với địa hình núi, ruộng bậc thang và sắc màu văn hóa vùng cao. Không gian sương mây mang lại trải nghiệm khác biệt so với đô thị.",
    "Thung lũng Mường Hoa, ruộng bậc thang và khu vực Fansipan.",
    "Đi bộ khám phá thiên nhiên, tham quan bản làng và ngắm cảnh núi.",
    "Các món ăn vùng cao và rau củ theo mùa.",
    "Thời tiết thay đổi nhanh, cần dự báo trước khi lên núi.",
    "Mang giày chống trượt và áo ấm; tôn trọng văn hóa cộng đồng địa phương.",
  ],

  hue: [
    "Huế lưu giữ dấu ấn của cố đô với quần thể di tích, sông Hương và nhịp sống chậm. Du khách có thể trải nghiệm văn hóa, kiến trúc và ẩm thực đặc sắc.",
    "Đại Nội, hệ thống lăng tẩm, chùa Thiên Mụ và sông Hương.",
    "Tham quan di tích, nghe ca Huế và khám phá văn hóa truyền thống.",
    "Bún bò Huế, bánh bèo, bánh nậm.",
    "Nên theo dõi mưa lớn vào mùa mưa.",
    "Chuẩn bị trang phục phù hợp khi ghé di tích và địa điểm tín ngưỡng.",
  ],

  "quy-nhon": [
    "Quy Nhơn là thành phố biển với đường bờ biển dễ chịu, những bãi cát và cảnh quan ven núi. Nơi đây phù hợp với chuyến nghỉ ngắn kết hợp khám phá ẩm thực.",
    "Các bãi biển ven thành phố, Eo Gió và cảnh quan bán đảo.",
    "Dạo biển, ngắm bình minh, trải nghiệm ẩm thực ven bờ.",
    "Bánh xèo tôm nhảy và hải sản.",
    "Cân nhắc lịch trình theo điều kiện nắng mưa và biển.",
    "Lưu ý an toàn khi tham quan ghềnh đá ven biển.",
  ],

  "mui-ne": [
    "Mũi Né nổi bật với bãi biển, những triền cát và phong cảnh làng chài. Đây là điểm đến phù hợp cho hoạt động ngoài trời và nghỉ dưỡng.",
    "Đồi cát, bãi biển và khu vực làng chài.",
    "Ngắm bình minh, khám phá đồi cát và trải nghiệm hoạt động biển khi điều kiện phù hợp.",
    "Hải sản và các món ăn địa phương.",
    "Thời tiết và gió ảnh hưởng nhiều đến hoạt động ngoài trời.",
    "Mang nước uống, chống nắng và tuân thủ chỉ dẫn an toàn khi đi trên cát.",
  ],

  "vung-tau": [
    "Vũng Tàu là điểm nghỉ biển gần TP. Hồ Chí Minh, được nhiều du khách lựa chọn cho chuyến đi cuối tuần. Đường ven biển và các góc nhìn từ đồi tạo nên nét riêng.",
    "Bãi Sau, Bãi Trước và các điểm ngắm cảnh trên cao.",
    "Dạo biển, ngắm hoàng hôn, khám phá ẩm thực địa phương.",
    "Bánh khọt và hải sản.",
    "Nên kiểm tra dự báo thời tiết cho ngày đi biển.",
    "Dịp cuối tuần thường đông khách, nên đặt chỗ trước.",
  ],

  "can-tho": [
    "Cần Thơ gợi nhớ nhịp sống sông nước miền Tây qua những dòng kênh, vườn cây và hoạt động giao thương trên sông. Chuyến đi thích hợp để trải nghiệm văn hóa địa phương.",
    "Chợ nổi Cái Răng, bến Ninh Kiều và các vườn trái cây theo mùa.",
    "Tham quan chợ nổi buổi sớm, đi thuyền và thưởng thức sản vật vùng sông nước.",
    "Bánh cống, lẩu mắm và các món cá.",
    "Buổi sáng sớm phù hợp để trải nghiệm chợ nổi.",
    "Đi thuyền có áo phao và tham khảo tình hình nước trước chuyến đi.",
  ],
};

// =====================================
// 2. THÔNG TIN CƠ BẢN
// =====================================

const base = {
  "da-nang": ["Đà Nẵng", "Miền Trung"],
  "da-lat": ["Đà Lạt", "Tây Nguyên"],
  "nha-trang": ["Nha Trang", "Miền Trung"],
  "phu-quoc": ["Phú Quốc", "Miền Nam"],
  "ha-noi": ["Hà Nội", "Miền Bắc"],
  "ho-chi-minh": ["TP. Hồ Chí Minh", "Miền Nam"],
  "hoi-an": ["Hội An", "Miền Trung"],
  "ha-long": ["Hạ Long", "Miền Bắc"],
  "sa-pa": ["Sa Pa", "Miền Bắc"],
  hue: ["Huế", "Miền Trung"],
  "quy-nhon": ["Quy Nhơn", "Miền Trung"],
  "mui-ne": ["Mũi Né", "Miền Nam"],
  "vung-tau": ["Vũng Tàu", "Miền Nam"],
  "can-tho": ["Cần Thơ", "Miền Nam"],
};

// =====================================
// 3. DANH SÁCH CHỈ ĐƯỢC PHÉP CẬP NHẬT
// =====================================

const TARGET_SLUGS = [
  "sa-pa",
  "hue",
  "quy-nhon",
  "mui-ne",
  "vung-tau",
  "can-tho",
];

// =====================================
// 4. ẢNH CHO SÁU ĐIỂM ĐẾN CÒN THIẾU
// =====================================

// Sử dụng Wikimedia Commons Special:FilePath.
// URL ảnh được lưu trực tiếp vào MongoDB.
// Tên file đã được đối chiếu trên Wikimedia Commons.
//
// Cần ghi công tác giả/giấy phép theo trang ảnh
// khi sử dụng công khai trên website.

const commonsImage = (fileName) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1600`;

const photos = {
  "sa-pa": [commonsImage("Sa Pa Rice Terrace I.jpg")],

  hue: [commonsImage("Vietnam, Hue, Imperial City of Hue, Gate.jpg")],

  "quy-nhon": [
    commonsImage("Ky Co beach, Quy Nhon city, Binh Dinh province, Vietnam.jpg"),
  ],

  "mui-ne": [commonsImage("Vietnam, Mui Ne sand dunes.jpg")],

  "vung-tau": [commonsImage("Sau Beach in Vungtau.jpg")],

  "can-tho": [commonsImage("Cai Rang Floating Market 1.jpg")],
};

// Chỉ dùng cho các điểm đến được phép cập nhật.
// Giữ nguyên gallery đã có của Admin.
const galleryExtras = {};

// =====================================
// 5. HÀM KIỂM TRA DỮ LIỆU CÒN TRỐNG
// =====================================

const isEmpty = (value) => {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
};

// =====================================
// 6. KẾT NỐI VÀ CẬP NHẬT MONGODB
// =====================================

async function enrichDestinations() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Chưa cấu hình MONGODB_URI trong server/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  let updated = 0;
  let imagesAdded = 0;
  let skipped = 0;
  let notFound = 0;

  try {
    console.log("==================================");
    console.log("HOTELAI - ENRICH DESTINATION IMAGES");
    console.log("==================================");

    for (const slug of TARGET_SLUGS) {
      const values = content[slug];

      if (!values) {
        console.warn(`Không có nội dung cho ${slug}`);
        skipped++;
        continue;
      }

      const [
        description,
        highlights,
        activities,
        cuisine,
        bestTime,
        travelTips,
      ] = values;

      const destinationName = base[slug]?.[0] || slug;

      // Chỉ tìm theo slug đã tồn tại.
      // Không tự tạo document mới.
      const doc = await Destination.findOne({ slug });

      if (!doc) {
        console.warn(`Không tìm thấy ${destinationName} (${slug}).`);
        notFound++;
        continue;
      }

      const changes = {};

      // Bổ sung nội dung khi trường còn trống.
      // Không ghi đè dữ liệu Admin đã chỉnh sửa.
      const detailFields = {
        description,
        highlights,
        activities,
        cuisine,
        bestTime,
        travelTips,
      };

      for (const [key, value] of Object.entries(detailFields)) {
        if (isEmpty(doc[key])) {
          changes[key] = value;
        }
      }

      // Lấy ảnh đại diện đúng điểm đến.
      const photoList = photos[slug] || [];
      const cover = photoList[0];

      // Chỉ bổ sung nếu chưa có ảnh.
      if (cover && isEmpty(doc.image?.url)) {
        changes["image.url"] = cover;
      }

      // Chỉ bổ sung gallery nếu có dữ liệu riêng.
      if (
        isEmpty(doc.gallery) &&
        Array.isArray(galleryExtras[slug]) &&
        galleryExtras[slug].length > 0
      ) {
        changes.gallery = galleryExtras[slug];
      }

      if (Object.keys(changes).length === 0) {
        console.log(`[GIỮ NGUYÊN] ${destinationName}`);
        skipped++;
        continue;
      }

      // Cập nhật đúng document.
      // Điều kiện ảnh trống được kiểm tra lại
      // để tránh ghi đè ảnh Admin vừa cập nhật.
      if (changes["image.url"]) {
        const imageUrl = changes["image.url"];
        delete changes["image.url"];

        const imageFilter = {
          _id: doc._id,
          $or: [
            { "image.url": { $exists: false } },
            { "image.url": null },
            { "image.url": "" },
          ],
        };

        const imageResult = await Destination.updateOne(imageFilter, {
          $set: {
            "image.url": imageUrl,
          },
        });

        if (imageResult.modifiedCount > 0) {
          imagesAdded++;

          console.log(`[THÊM ẢNH] ${destinationName}`);
        }
      }

      // Cập nhật các trường nội dung còn trống.
      if (Object.keys(changes).length > 0) {
        const setIfEmpty = {};

        for (const [key, value] of Object.entries(changes)) {
          setIfEmpty[key] = value;
        }

        // Giữ nguyên dữ liệu mới nếu Admin đã cập nhật
        // sau khi script đọc document.
        const freshDoc = await Destination.findById(doc._id);

        if (freshDoc) {
          const safeChanges = {};

          for (const [key, value] of Object.entries(setIfEmpty)) {
            if (isEmpty(freshDoc[key])) {
              safeChanges[key] = value;
            }
          }

          if (Object.keys(safeChanges).length > 0) {
            await Destination.updateOne(
              { _id: doc._id },
              { $set: safeChanges },
            );
          }
        }
      }

      updated++;

      console.log(`[CẬP NHẬT] ${destinationName}`);
    }

    console.log("\n==================================");
    console.log("HOÀN THÀNH CẬP NHẬT DESTINATIONS");
    console.log("==================================");

    console.log(`Đã xử lý: ${TARGET_SLUGS.length}`);
    console.log(`Đã cập nhật: ${updated}`);
    console.log(`Đã thêm ảnh: ${imagesAdded}`);
    console.log(`Bỏ qua: ${skipped}`);
    console.log(`Không tìm thấy: ${notFound}`);

    console.log("Đã giữ nguyên 8 điểm đến ban đầu.");
  } finally {
    await mongoose.disconnect();
    console.log("Đã ngắt kết nối MongoDB.");
  }
}

// =====================================
// 7. CHẠY SCRIPT
// =====================================

enrichDestinations().catch((error) => {
  console.error("Lỗi cập nhật điểm đến:", error.message);

  process.exitCode = 1;
});
