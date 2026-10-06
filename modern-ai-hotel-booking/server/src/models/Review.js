import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: "" },
  comment: { type: String, default: "" },
  status: { type: String, enum: ["PUBLISHED", "HIDDEN", "PENDING"], default: "PUBLISHED" }
}, { timestamps: true, collection: "reviews" });
reviewSchema.index({ bookingId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
export default mongoose.model("Review", reviewSchema);
