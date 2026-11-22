import mongoose from "mongoose";

const MAX_IMAGES = 5;

const reviewSchema = new mongoose.Schema(
  {
    // Booking được khách hàng đánh giá
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    // Người viết đánh giá
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Khách sạn được đánh giá
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    // Số sao đánh giá từ 1 đến 5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Số sao phải là số nguyên.",
      },
    },

    // Tiêu đề đánh giá
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    // Nội dung đánh giá
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    // Danh sách hình ảnh đánh giá
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length <= MAX_IMAGES,
        message: `Tối đa ${MAX_IMAGES} ảnh.`,
      },
    },

    // Trạng thái hiển thị đánh giá
    status: {
      type: String,
      enum: ["PUBLISHED", "HIDDEN", "PENDING"],
      default: "PUBLISHED",
    },

    // Phản hồi của chủ khách sạn
    hotelResponse: {
      content: {
        type: String,
        trim: true,
        maxlength: 2000,
      },

      respondedAt: {
        type: Date,
      },

      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // Kết quả phân tích đánh giá bằng AI
    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: "reviews",
  },
);

// Một người dùng chỉ đánh giá một booking một lần
reviewSchema.index({ bookingId: 1, userId: 1 }, { unique: true });

// Lấy đánh giá theo khách sạn và trạng thái
reviewSchema.index({
  hotelId: 1,
  status: 1,
  createdAt: -1,
});

// Lấy đánh giá của một người dùng
reviewSchema.index({
  userId: 1,
  createdAt: -1,
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
