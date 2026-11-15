import * as svc from "../../services/admin/adminBooking.service.js";
import { auditCtx } from "../../services/audit.service.js";

export const list = async (req, res) => {
  const q = req.valid.query;
  const { items, total } = await svc.listBookings(q);
  res.json({ success: true, data: items, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) } });
};
export const detail = async (req, res) => res.json({ success: true, data: await svc.getBooking(req.valid.params.id) });
export const cancel = async (req, res) => res.json({ success: true, message: "Đã huỷ đặt phòng.", data: await svc.cancelBooking(auditCtx(req), req.valid.params.id, req.valid.body) });
