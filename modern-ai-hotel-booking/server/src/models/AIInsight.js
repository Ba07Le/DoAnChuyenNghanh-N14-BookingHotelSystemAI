import mongoose from "mongoose";
const schema = new mongoose.Schema({ hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", index: true }, period: { type: String, required: true }, occupancyRate: { type: Number, default: 0 }, revenue: { type: Number, default: 0 }, averageBookingValue: { type: Number, default: 0 }, insight: String, recommendations: [String] }, { timestamps: true, collection: "ai_insights" });
export default mongoose.model("AIInsight", schema);
