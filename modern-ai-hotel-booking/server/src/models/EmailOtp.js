import mongoose from "mongoose";

// Mỗi email chỉ có tối đa 1 mã đang hiệu lực. Mã không lưu dạng gốc, chỉ lưu HMAC-SHA256.
const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    codeHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "email_otps",
  },
);

// MongoDB tự xoá bản ghi khi tới expiresAt
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);

export default EmailOtp;
