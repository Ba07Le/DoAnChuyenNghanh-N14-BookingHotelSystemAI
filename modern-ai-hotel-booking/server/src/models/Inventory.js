import mongoose from "mongoose";
const inventorySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomType", required: true, index: true },
  date: { type: Date, required: true },
  totalRooms: { type: Number, required: true, min: 0 },
  availableRooms: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  blockedRooms: { type: Number, default: 0, min: 0 }
}, { timestamps: true, collection: "inventories" });
inventorySchema.index({ roomTypeId: 1, date: 1 }, { unique: true });
inventorySchema.index({ hotelId: 1, date: 1 });
export default mongoose.model("Inventory", inventorySchema);
