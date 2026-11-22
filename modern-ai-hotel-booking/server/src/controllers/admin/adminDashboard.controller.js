import * as stats from "../../services/admin/adminStats.service.js";
import { listAuditLogs } from "../../services/audit.service.js";
import { resolveRange } from "../../utils/dateRange.js";

const ok = (res, data) => res.json({ success: true, data });
const range = (req) => resolveRange(req.valid.query);

export const overview = async (req, res) => ok(res, await stats.getOverview(range(req)));
export const revenue = async (req, res) => ok(res, await stats.getRevenueSeries(range(req), req.valid.query.groupBy));
export const bookingsByStatus = async (req, res) => ok(res, await stats.getBookingsByStatus(range(req)));
export const topHotels = async (req, res) => ok(res, await stats.getTopHotels(range(req), req.valid.query.limit));
export const customers = async (req, res) => ok(res, await stats.getCustomerStats(range(req), req.valid.query.groupBy, req.valid.query.limit));
export const cancellation = async (req, res) => ok(res, await stats.getCancellation(range(req), req.valid.query.groupBy));
export const aiInsights = async (req, res) => ok(res, await stats.getAiInsights());

export const auditLogs = async (req, res) => {
  const q = req.valid.query;
  const { items, total } = await listAuditLogs(q);
  res.json({ success: true, data: items, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) } });
};
