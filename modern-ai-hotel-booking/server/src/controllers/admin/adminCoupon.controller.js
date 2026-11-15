import * as svc from "../../services/admin/adminCoupon.service.js";
import { auditCtx } from "../../services/audit.service.js";

export const list = async (req, res) => {
  const q = req.valid.query;
  const { items, total, stateCounts } = await svc.listCoupons(q);
  res.json({ success: true, data: items, stateCounts, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) } });
};
export const create = async (req, res) => res.status(201).json({ success: true, message: "Đã tạo mã giảm giá.", data: await svc.createCoupon(auditCtx(req), req.valid.body) });
export const update = async (req, res) => res.json({ success: true, message: "Đã cập nhật mã giảm giá.", data: await svc.updateCoupon(auditCtx(req), req.valid.params.id, req.valid.body) });
export const setStatus = async (req, res) => res.json({ success: true, message: "Đã cập nhật trạng thái mã.", data: await svc.setCouponStatus(auditCtx(req), req.valid.params.id, req.valid.body) });
export const remove = async (req, res) => res.json({ success: true, message: "Đã xoá mã giảm giá.", data: await svc.deleteCoupon(auditCtx(req), req.valid.params.id) });
