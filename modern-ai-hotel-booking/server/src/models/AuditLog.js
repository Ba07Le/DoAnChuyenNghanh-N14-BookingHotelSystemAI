import mongoose from "mongoose";
const auditLogSchema = new mongoose.Schema({ actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, action: { type: String, required: true }, entity: { type: String, required: true }, entityId: String, metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, ip: String }, { timestamps: true, collection: "audit_logs" });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
export default mongoose.model("AuditLog", auditLogSchema);
