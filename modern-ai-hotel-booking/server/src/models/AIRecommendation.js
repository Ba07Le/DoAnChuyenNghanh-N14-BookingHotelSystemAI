import mongoose from "mongoose";
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, hotelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }], reason: String, source: { type: String, default: "RULE_BASED" }, score: { type: Number, default: 0 } }, { timestamps: true, collection: "ai_recommendations" });
export default mongoose.model("AIRecommendation", schema);
