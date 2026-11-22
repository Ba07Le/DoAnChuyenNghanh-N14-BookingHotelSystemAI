import { useState } from "react";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { Wallet, CalendarCheck, XCircle, UserPlus, Users, Building2, Hourglass, Sparkles } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useOverview, useRevenue, useBookingsByStatus, useTopHotels, useCustomerStats, useCancellation, useAiInsights } from "../../hooks/useAdmin";
import { StatCard, QueryBoundary, money, LABELS, STATUS_COLORS } from "../../components/admin/ui";

const RANGES = [{ days: 7, label: "7 ngày" }, { days: 30, label: "30 ngày" }, { days: 90, label: "90 ngày" }, { days: 365, label: "12 tháng" }];
const shortMoney = (v) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)} tỷ` : v >= 1e6 ? `${(v / 1e6).toFixed(1)} tr` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v);

const tickDate = (d) => (d.length === 7 ? d : d.slice(5));
const Card = ({ title, children, className = "" }) => (
  <section className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}><h2 className="mb-4 font-bold text-slate-900">{title}</h2>{children}</section>
);

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const params = { from: format(subDays(new Date(), days - 1), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd"), groupBy: days > 90 ? "month" : "day" };

  const overview = useOverview(params);
  const revenue = useRevenue(params);
  const byStatus = useBookingsByStatus(params);
  const topHotels = useTopHotels({ ...params, limit: 5 });
  const customers = useCustomerStats({ ...params, limit: 5 });
  const cancel = useCancellation(params);
  const insights = useAiInsights();
  const m = overview.data?.data?.metrics;
  const t = overview.data?.data?.totals;
  const load = overview.isLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1><p className="text-sm text-slate-500">So sánh với kỳ liền trước có cùng độ dài.</p></div>
        <div className="flex rounded-xl bg-white p-1 shadow-sm">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setDays(r.days)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${days === r.days ? "bg-blue-600 text-white" : "text-slate-600"}`}>{r.label}</button>
          ))}
        </div>
      </div>

      {overview.isError && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">Không tải được số liệu tổng quan.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={load} icon={Wallet} label="Doanh thu" value={money(m?.revenue.value)} change={m?.revenue.change} accent="text-emerald-600" />
        <StatCard loading={load} icon={CalendarCheck} label="Đặt phòng" value={m?.bookings.value} change={m?.bookings.change} />
        <StatCard loading={load} icon={XCircle} label="Tỷ lệ huỷ" value={`${m?.cancellationRate.value ?? 0}%`} change={m?.cancellationRate.change} unit="pt" badWhenUp accent="text-red-500" />
        <StatCard loading={load} icon={UserPlus} label="Khách mới" value={m?.newCustomers.value} change={m?.newCustomers.change} accent="text-violet-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard loading={load} icon={Users} label="Tổng khách hàng" value={t?.totalCustomers} accent="text-slate-600" />
        <StatCard loading={load} icon={Building2} label="Khách sạn đang hoạt động" value={t?.approvedHotels} accent="text-slate-600" />
        <Link to="/admin/hotels?status=PENDING_APPROVAL" className="block"><StatCard loading={load} icon={Hourglass} label="Khách sạn chờ duyệt (bấm để xử lý)" value={t?.pendingHotels} accent="text-amber-500" /></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Doanh thu theo thời gian" className="lg:col-span-2">
          <QueryBoundary query={revenue} height="h-72" isEmpty={!revenue.data?.data?.some((d) => d.revenue > 0)} emptyText="Chưa có doanh thu trong kỳ này.">
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={revenue.data?.data}>
                  <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => (d.length === 7 ? d : d.slice(5))} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={shortMoney} width={50} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="rounded-lg border bg-white p-2 text-xs shadow">
                      <p className="font-semibold text-slate-900">{label}</p>
                      <p className="text-blue-600">Doanh thu: {money(payload[0].payload.revenue)}</p>
                      <p className="text-slate-500">{payload[0].payload.bookings} booking đã thanh toán</p>
                    </div>
                  ) : null} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </QueryBoundary>
        </Card>

        <Card title="Trạng thái đặt phòng">
          <QueryBoundary query={byStatus} height="h-72" isEmpty={!byStatus.data?.data?.some((d) => d.count > 0)}>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStatus.data?.data?.filter((d) => d.count > 0)} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {byStatus.data?.data?.filter((d) => d.count > 0).map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, LABELS[n]]} />
                  <Legend formatter={(v) => LABELS[v]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </QueryBoundary>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Tỷ lệ huỷ đặt phòng">
          <QueryBoundary query={cancel} height="h-60" isEmpty={!cancel.data?.data?.series?.some((d) => d.total > 0)} emptyText="Chưa có đặt phòng trong kỳ này.">
            <p className="-mt-2 mb-3 text-xs text-slate-500">Cả kỳ: <b className="text-red-500">{cancel.data?.data?.overallRate}%</b> ({cancel.data?.data?.cancelled}/{cancel.data?.data?.total} đơn bị huỷ)</p>
            <div className="h-52">
              <ResponsiveContainer>
                <LineChart data={cancel.data?.data?.series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={tickDate} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" width={40} domain={[0, 100]} />
                  <Tooltip formatter={(v, _n, item) => [`${v}% (${item.payload.cancelled}/${item.payload.total} đơn)`, "Tỷ lệ huỷ"]} />
                  <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </QueryBoundary>
        </Card>

        <Card title="Khách hàng mới">
          <QueryBoundary query={customers} height="h-60" isEmpty={!customers.data?.data?.newCustomers?.some((d) => d.count > 0)} emptyText="Chưa có khách đăng ký mới trong kỳ này.">
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={customers.data?.data?.newCustomers}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={tickDate} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                  <Tooltip formatter={(v) => [v, "Khách mới"]} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </QueryBoundary>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top khách sạn theo doanh thu">
          <QueryBoundary query={topHotels} isEmpty={!topHotels.data?.data?.length}>
            <ol className="divide-y">
              {topHotels.data?.data?.map((h, i) => (
                <li key={h.hotelId} className="flex items-center gap-3 py-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{h.name}</p><p className="text-xs text-slate-400">{h.city} · {h.bookings} booking</p></div>
                  <b>{money(h.revenue)}</b>
                </li>
              ))}
            </ol>
          </QueryBoundary>
        </Card>

        <Card title="Khách hàng chi tiêu nhiều nhất">
          <QueryBoundary query={customers} isEmpty={!customers.data?.data?.topCustomers?.length}>
            <ol className="divide-y">
              {customers.data?.data?.topCustomers?.map((c, i) => (
                <li key={c.userId} className="flex items-center gap-3 py-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 font-bold text-violet-600">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.fullName}</p><p className="truncate text-xs text-slate-400">{c.email} · {c.bookings} booking</p></div>
                  <b>{money(c.spent)}</b>
                </li>
              ))}
            </ol>
          </QueryBoundary>
        </Card>
      </div>

      {/* Khối AI tải độc lập: lỗi hoặc chưa có dữ liệu thì không ảnh hưởng phần còn lại */}
      <Card title="Phân tích AI (do module AI cung cấp)">
        <QueryBoundary query={insights} isEmpty={!insights.data?.data?.length} emptyText="Chưa có phân tích AI nào.">
          <ul className="space-y-3">
            {insights.data?.data?.map((x) => (
              <li key={x._id} className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold"><Sparkles size={15} className="text-violet-500" />{x.hotelId?.name || "Toàn hệ thống"} <span className="text-xs font-normal text-slate-400">· {x.period}</span></p>
                <p className="mt-1 text-slate-600">{x.insight}</p>
                {!!x.recommendations?.length && <ul className="mt-2 list-inside list-disc text-slate-500">{x.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>}
              </li>
            ))}
          </ul>
        </QueryBoundary>
      </Card>
    </div>
  );
}
