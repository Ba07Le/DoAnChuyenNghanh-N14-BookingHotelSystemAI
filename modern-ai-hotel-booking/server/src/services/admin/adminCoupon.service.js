import Coupon from "../../models/Coupon.js";
import { httpError } from "../../utils/httpError.js";
import { vnStart, vnEnd } from "../../utils/dateRange.js";
import { logAudit } from "../audit.service.js";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Trạng thái hiển thị: tính từ status + ngày hiệu lực (không phụ thuộc cron đổi status sang EXPIRED)
const stateOf = (c, now = new Date()) => {
  if (c.status === "EXPIRED" || c.endDate < now) return "EXPIRED";
  if (c.status === "INACTIVE") return "INACTIVE";
  return "ACTIVE";
};
const present = (c) => ({ ...c, state: stateOf(c), scheduled: c.status === "ACTIVE" && c.startDate > new Date() });

const stateFilter = (state, now) => ({
  ACTIVE: { status: "ACTIVE", endDate: { $gte: now } },
  INACTIVE: { status: "INACTIVE", endDate: { $gte: now } },
  EXPIRED: { $or: [{ status: "EXPIRED" }, { endDate: { $lt: now } }] },
}[state]);

export const listCoupons = async ({ page, limit, search, state }) => {
  const now = new Date();
  const and = [];
  if (state) and.push(stateFilter(state, now));
  if (search) { const rx = new RegExp(esc(search), "i"); and.push({ $or: [{ code: rx }, { title: rx }] }); }
  const filter = and.length ? { $and: and } : {};
  const [items, total, ...counts] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Coupon.countDocuments(filter),
    ...["ACTIVE", "INACTIVE", "EXPIRED"].map((s) => Coupon.countDocuments(stateFilter(s, now))),
  ]);
  return { items: items.map(present), total, stateCounts: { ACTIVE: counts[0], INACTIVE: counts[1], EXPIRED: counts[2] } };
};

const toDoc = ({ startDate, endDate, ...rest }) => ({
  ...rest,
  ...(startDate && { startDate: vnStart(startDate) }),
  ...(endDate && { endDate: vnEnd(endDate) }),
});

export const createCoupon = async (ctx, body) => {
  try {
    const coupon = await Coupon.create(toDoc(body));
    await logAudit(ctx, { action: "COUPON_CREATED", entity: "Coupon", entityId: coupon._id, metadata: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue } });
    return present(coupon.toObject());
  } catch (e) {
    if (e.code === 11000) throw httpError(409, "Mã giảm giá này đã tồn tại.");
    throw e;
  }
};

export const updateCoupon = async (ctx, id, body) => {
  const current = await Coupon.findById(id).lean();
  if (!current) throw httpError(404, "Không tìm thấy mã giảm giá.");
  const patch = toDoc(body);
  // Kiểm tra chéo ngày khi chỉ gửi một trong hai
  const start = patch.startDate || current.startDate, end = patch.endDate || current.endDate;
  if (start > end) throw httpError(400, "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
  if (patch.usageLimit && patch.usageLimit < current.usedCount) throw httpError(400, `Giới hạn lượt dùng không được nhỏ hơn số lượt đã dùng (${current.usedCount}).`);
  const type = patch.discountType || current.discountType, value = patch.discountValue ?? current.discountValue;
  if (type === "PERCENTAGE" && value > 100) throw httpError(400, "Giảm theo % không được vượt quá 100.");
  const updated = await Coupon.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
  await logAudit(ctx, { action: "COUPON_UPDATED", entity: "Coupon", entityId: id, metadata: { code: current.code, fields: Object.keys(body) } });
  return present(updated);
};

export const setCouponStatus = async (ctx, id, { status }) => {
  const updated = await Coupon.findOneAndUpdate({ _id: id, status: { $ne: status } }, { status }, { new: true }).lean();
  if (!updated) {
    if (!(await Coupon.exists({ _id: id }))) throw httpError(404, "Không tìm thấy mã giảm giá.");
    throw httpError(409, "Mã giảm giá đã ở trạng thái này.");
  }
  await logAudit(ctx, { action: status === "ACTIVE" ? "COUPON_ACTIVATED" : "COUPON_DEACTIVATED", entity: "Coupon", entityId: id, metadata: { code: updated.code } });
  return present(updated);
};

// Mã đã có người dùng thì chỉ được tắt, không xoá, để lịch sử booking còn đối chiếu được
export const deleteCoupon = async (ctx, id) => {
  const coupon = await Coupon.findById(id).lean();
  if (!coupon) throw httpError(404, "Không tìm thấy mã giảm giá.");
  if (coupon.usedCount > 0) throw httpError(409, "Mã đã được sử dụng nên không thể xoá. Hãy tắt mã thay vì xoá.");
  await Coupon.deleteOne({ _id: id, usedCount: 0 });
  await logAudit(ctx, { action: "COUPON_DELETED", entity: "Coupon", entityId: id, metadata: { code: coupon.code } });
  return { _id: id };
};
