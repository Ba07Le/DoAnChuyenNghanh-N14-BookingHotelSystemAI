import * as svc from "../../services/admin/adminHotel.service.js";
import { auditCtx } from "../../services/audit.service.js";

// File gốc trong bản dump bị đánh dấu "Binary file" nên được viết lại theo mẫu các controller admin khác
// và theo hàm export của adminHotel.service.js (listHotels trả về statusCounts cho các tab).
export const list = async (req, res) => {
  const q = req.valid.query;
  const { items, total, statusCounts } = await svc.listHotels(q);
  res.json({ success: true, data: items, statusCounts, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) } });
};
export const detail = async (req, res) => res.json({ success: true, data: await svc.getHotel(req.valid.params.id) });
export const approve = async (req, res) =>
  res.json({ success: true, message: "Đã duyệt khách sạn.", data: await svc.approveHotel(auditCtx(req), req.valid.params.id) });
export const reject = async (req, res) =>
  res.json({ success: true, message: "Đã từ chối khách sạn.", data: await svc.rejectHotel(auditCtx(req), req.valid.params.id, req.valid.body) });
export const setStatus = async (req, res) =>
  res.json({ success: true, message: "Đã cập nhật trạng thái khách sạn.", data: await svc.setHotelVisibility(auditCtx(req), req.valid.params.id, req.valid.body) });
