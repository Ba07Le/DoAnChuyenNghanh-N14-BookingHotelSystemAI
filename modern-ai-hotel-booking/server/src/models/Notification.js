import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, type: { type: String, default: "SYSTEM" }, title: { type: String, required: true }, message: { type: String, required: true }, isRead: { type: Boolean, default: false }, data: { type: mongoose.Schema.Types.Mixed, default: {} } }, { timestamps: true, collection: "notifications" });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
export default mongoose.model("Notification", notificationSchema);
