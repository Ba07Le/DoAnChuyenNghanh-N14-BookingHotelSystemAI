import { httpError } from "./httpError.js";

export const TZ = "Asia/Ho_Chi_Minh";
export const vnStart = (d) => new Date(`${d}T00:00:00.000+07:00`);
export const vnEnd = (d) => new Date(`${d}T23:59:59.999+07:00`);
// Date -> "YYYY-MM-DD" theo giờ Việt Nam
export const ymd = (date) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(date);

// Mặc định 30 ngày gần nhất, tối đa 366 ngày để không quét cả collection
export const resolveRange = ({ from, to }, maxDays = 366) => {
  const end = to ? vnEnd(to) : new Date();
  const start = from ? vnStart(from) : vnStart(ymd(new Date(end.getTime() - 29 * 86400000)));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw httpError(400, "Ngày không hợp lệ.");
  if (start > end) throw httpError(400, "'from' phải nhỏ hơn hoặc bằng 'to'.");
  if ((end - start) / 86400000 > maxDays) throw httpError(400, `Khoảng thời gian tối đa là ${maxDays} ngày.`);
  return { start, end };
};

// Danh sách mốc thời gian liên tục (để điền 0 cho ngày/tháng không có booking)
export const buckets = (start, end, groupBy) => {
  const keys = [];
  const seen = new Set();
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const k = groupBy === "month" ? ymd(new Date(t)).slice(0, 7) : ymd(new Date(t));
    if (!seen.has(k)) { seen.add(k); keys.push(k); }
  }
  return keys;
};
