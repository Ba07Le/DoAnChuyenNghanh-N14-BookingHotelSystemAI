import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomType", required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { adults: { type: Number, min: 1, default: 1 }, children: { type: Number, min: 0, default: 0 } },
  rooms: { type: Number, min: 1, default: 1 },
  guestInfo: { fullName: String, email: String, phone: String, note: String },
  pricePerNight: { type: Number, required: true, min: 0 },
  nights: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  couponCode: { type: String, default: "" },
  status: { type: String, enum: ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"], default: "PENDING", index: true },
  paymentStatus: { type: String, enum: ["UNPAID", "PAID", "REFUNDED"], default: "UNPAID", index: true }
}, { timestamps: true, collection: "bookings" });
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });
export default mongoose.model("Booking", bookingSchema);
