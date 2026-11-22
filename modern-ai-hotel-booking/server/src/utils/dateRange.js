// Tiện ích ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
// File gốc trong bản dump bị đánh dấu "Binary file" nên được viết lại theo cách các service đang gọi:
//   TZ, vnStart(day), vnEnd(day), resolveRange({from,to}), buckets(start,end,groupBy)
export const TZ = "Asia/Ho_Chi_Minh";
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// "YYYY-MM-DD" của một thời điểm, tính theo giờ VN
const vnDay = (date) => new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

export const vnStart = (day) => new Date(`${day}T00:00:00.000+07:00`);
export const vnEnd = (day) => new Date(`${day}T23:59:59.999+07:00`);

// Mặc định 30 ngày gần nhất (tính cả hôm nay). Nếu from > to thì đổi chỗ cho khỏi ra khoảng rỗng.
export const resolveRange = ({ from, to } = {}) => {
  const today = vnDay(new Date());
  let end = vnEnd(to || today);
  let start = from ? vnStart(from) : vnStart(vnDay(new Date(end.getTime() - 29 * DAY_MS)));
  if (start > end) [start, end] = [vnStart(vnDay(end)), vnEnd(vnDay(start))];
  return { start, end };
};

// Danh sách khoá thời gian liên tục ("YYYY-MM-DD" hoặc "YYYY-MM") để biểu đồ không bị hụt ngày/tháng không có dữ liệu.
export const buckets = (start, end, groupBy = "day") => {
  const keys = [];
  const last = vnDay(end);
  if (groupBy === "month") {
    let [y, m] = vnDay(start).slice(0, 7).split("-").map(Number);
    const [ly, lm] = last.slice(0, 7).split("-").map(Number);
    while (y < ly || (y === ly && m <= lm)) {
      keys.push(`${y}-${String(m).padStart(2, "0")}`);
      m += 1; if (m > 12) { m = 1; y += 1; }
    }
    return keys;
  }
  for (let t = vnStart(vnDay(start)).getTime(); vnDay(new Date(t)) <= last; t += DAY_MS) keys.push(vnDay(new Date(t)));
  return keys;
};
