import mongoose from "mongoose";
const schema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, trim: true, lowercase: true }, description: String,
  capacity: { adults: { type: Number, required: true, min: 1 }, children: { type: Number, default: 0 }, total: { type: Number, required: true, min: 1 } },
  bedType: { type: String, required: true }, size: { type: Number, default: 0 }, basePrice: { type: Number, required: true, min: 0 },
  images: [{ url: String, publicId: String }], amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }], totalRooms: { type: Number, required: true, min: 1 }, status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true, collection: "room_types" });
schema.index({ hotelId: 1, slug: 1 }, { unique: true }); schema.index({ hotelId: 1, status: 1, basePrice: 1 });
export default mongoose.model("RoomType", schema);
