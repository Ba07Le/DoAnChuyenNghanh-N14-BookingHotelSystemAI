import AuditLog from "../models/AuditLog.js";
import { vnStart, vnEnd } from "../utils/dateRange.js";

export const auditCtx = (req) => ({ actorId: req.user._id, ip: req.ip });

// Ghi log không được làm hỏng thao tác chính đã thành công
export const logAudit = async (ctx, { action, entity, entityId, metadata = {} }) => {
  try {
    await AuditLog.create({ actorId: ctx.actorId, ip: ctx.ip, action, entity, entityId: String(entityId), metadata });
  } catch (e) {
    console.error("AuditLog failed:", e.message);
  }
};

export const listAuditLogs = async ({ page, limit, entity, action, actorId, from, to }) => {
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;
  if (actorId) filter.actorId = actorId;
  if (from || to) filter.createdAt = { ...(from && { $gte: vnStart(from) }), ...(to && { $lte: vnEnd(to) }) };
  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate("actorId", "fullName email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { items, total };
};
