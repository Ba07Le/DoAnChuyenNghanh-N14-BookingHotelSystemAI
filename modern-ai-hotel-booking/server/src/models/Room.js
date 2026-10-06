import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomType", required: true, index: true },
  roomNumber: { type: String, required: true, trim: true },
  floor: { type: Number, default: 1 },
  status: { type: String, enum: ["AVAILABLE", "MAINTENANCE", "INACTIVE"], default: "AVAILABLE", index: true }
}, { timestamps: true, collection: "rooms" });
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ roomTypeId: 1, status: 1 });
export default mongoose.model("Room", roomSchema);
