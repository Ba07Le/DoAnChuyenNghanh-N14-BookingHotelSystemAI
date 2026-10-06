import mongoose from "mongoose";
const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, default: "Ưu đãi đặc biệt" }, shortDescription: { type: String, default: "" }, badge: { type: String, default: "Ưu đãi" }, image: { type: String, default: "" }, terms: { type: [String], default: [] }, featured: { type: Boolean, default: false },
  description: { type: String, default: "" }, discountType: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true }, discountValue: { type: Number, required: true, min: 0 }, minBookingAmount: { type: Number, default: 0 }, maxDiscount: { type: Number, default: 0 }, usageLimit: { type: Number, default: 0 }, usedCount: { type: Number, default: 0 }, startDate: { type: Date, required: true }, endDate: { type: Date, required: true }, applicableHotels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }], applicableRoomTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: "RoomType" }], status: { type: String, enum: ["ACTIVE", "INACTIVE", "EXPIRED"], default: "ACTIVE", index: true }
}, { timestamps: true, collection: "coupons" });
schema.index({ status: 1, startDate: 1, endDate: 1 }); schema.index({ featured: 1, status: 1 });
export default mongoose.model("Coupon", schema);
