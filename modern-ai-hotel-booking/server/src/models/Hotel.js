import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    // ===============================
    // CHỦ SỞ HỮU VÀ PHÂN LOẠI
    // ===============================
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    hotelTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HotelType",
      required: true,
    },

    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: true,
    },

    // ===============================
    // THÔNG TIN KHÁCH SẠN
    // ===============================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    starRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // ===============================
    // ĐỊA CHỈ
    // ===============================
    address: {
      addressLine: String,
      ward: String,
      district: String,

      city: {
        type: String,
        required: true,
      },

      country: {
        type: String,
        default: "Vietnam",
      },

      postalCode: String,
    },

    // ===============================
    // VỊ TRÍ ĐỊA LÝ
    // ===============================
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    // ===============================
    // HÌNH ẢNH
    // ===============================
    images: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          default: "",
        },

        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ===============================
    // TIỆN NGHI
    // ===============================
    amenities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Amenity",
      },
    ],

    // ===============================
    // CHÍNH SÁCH KHÁCH SẠN
    // ===============================
    policies: {
      checkInTime: {
        type: String,
        default: "14:00",
      },

      checkOutTime: {
        type: String,
        default: "12:00",
      },

      cancellationPolicy: String,
      childPolicy: String,
      petPolicy: String,
    },

    // ===============================
    // THÔNG TIN LIÊN HỆ
    // ===============================
    contact: {
      phone: String,
      email: String,
      website: String,
    },

    // ===============================
    // TRẠNG THÁI KHÁCH SẠN
    // ===============================
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "DRAFT",
      index: true,
    },

    // ===============================
    // ADMIN - TUẤN ANH
    // THÔNG TIN XÉT DUYỆT
    // ===============================
    rejectReason: {
      type: String,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,

    // ===============================
    // HIỂN THỊ VÀ PHÂN LOẠI
    // ===============================
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    hotelType: {
      type: String,
      enum: ["HOTEL", "RESORT", "VILLA", "APARTMENT", "HOMESTAY", "BOUTIQUE"],
      default: "HOTEL",
      index: true,
    },

    // ===============================
    // ĐÁNH GIÁ KHÁCH SẠN
    // ===============================
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    // ===============================
    // AI EMBEDDING
    // ===============================
    embedding: {
      type: [Number],
      select: false,
    },
  },
  {
    timestamps: true,
    collection: "hotels",
  },
);

// ===============================
// MONGODB INDEXES
// ===============================
hotelSchema.index({ location: "2dsphere" });

hotelSchema.index({
  "address.city": 1,
  status: 1,
});

hotelSchema.index({
  destinationId: 1,
  status: 1,
  isFeatured: 1,
});

hotelSchema.index({
  status: 1,
  isFeatured: 1,
  averageRating: -1,
});

export default mongoose.model("Hotel", hotelSchema);
