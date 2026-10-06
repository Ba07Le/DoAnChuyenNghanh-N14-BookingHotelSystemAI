import mongoose from "mongoose";
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, title: { type: String, default: "AI Travel Assistant" }, messages: [{ role: { type: String, enum: ["user", "assistant", "system"] }, content: String, createdAt: { type: Date, default: Date.now } }] }, { timestamps: true, collection: "ai_conversations" });
export default mongoose.model("AIConversation", schema);
