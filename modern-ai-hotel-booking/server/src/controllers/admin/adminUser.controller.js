import * as svc from "../../services/admin/adminUser.service.js";
import { auditCtx } from "../../services/audit.service.js";

export const list = async (req, res) => {
  const q = req.valid.query;
  const { items, total } = await svc.listUsers(q);
  res.json({ success: true, data: items, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) } });
};
export const detail = async (req, res) => res.json({ success: true, data: await svc.getUser(req.valid.params.id) });
export const setStatus = async (req, res) =>
  res.json({ success: true, message: "Đã cập nhật trạng thái tài khoản.", data: await svc.setUserStatus(auditCtx(req), req.valid.params.id, req.valid.body) });
export const setRole = async (req, res) =>
  res.json({ success: true, message: "Đã đổi vai trò.", data: await svc.setUserRole(auditCtx(req), req.valid.params.id, req.valid.body) });
