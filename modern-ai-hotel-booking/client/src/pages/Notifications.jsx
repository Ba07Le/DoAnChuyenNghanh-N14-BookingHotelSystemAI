import {
  Bell,
  CalendarDays,
  CheckCheck,
  Clock3,
  CreditCard,
  Star,
  TicketPercent,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";

const PAGE_SIZE = 20;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Biểu tượng và màu cho từng loại thông báo
const TYPE_STYLES = {
  BOOKING_CONFIRMED: {
    icon: CalendarDays,
    className: "bg-emerald-50 text-emerald-600",
  },
  BOOKING_CANCELLED: { icon: XCircle, className: "bg-red-50 text-red-600" },
  PAYMENT_SUCCESS: {
    icon: CreditCard,
    className: "bg-emerald-50 text-emerald-600",
  },
  PAYMENT_FAILED: { icon: CreditCard, className: "bg-red-50 text-red-600" },
  CHECK_IN_REMINDER: { icon: Clock3, className: "bg-amber-50 text-amber-600" },
  REVIEW_REMINDER: { icon: Star, className: "bg-amber-50 text-amber-600" },
  PROMOTION: { icon: TicketPercent, className: "bg-blue-50 text-blue-600" },
  SYSTEM: { icon: Bell, className: "bg-blue-50 text-blue-600" },
};

const FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
];

const formatTimeAgo = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());

  if (diff < MINUTE) return "Vừa xong";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút trước`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ trước`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} ngày trước`;

  return new Date(value).toLocaleDateString("vi-VN");
};

// Trang liên quan khi bấm vào thông báo (không có thì chỉ đánh dấu đã đọc)
const getLink = (notification) => {
  if (notification.data?.bookingId) return "/bookings";
  if (notification.data?.hotelId?.slug)
    return `/hotels/${notification.data.hotelId.slug}`;

  return null;
};

const setRead = (items, id, isRead) =>
  items.map((item) => (item._id === id ? { ...item, isRead } : item));

function Notifications() {
  const navigate = useNavigate();
  const outlet = useOutletContext() || {};
  const unreadCount = outlet.unreadCount ?? 0;
  const setUnreadCount = outlet.setUnreadCount || (() => {});

  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const fetchPage = useCallback(
    async (pageNumber, unreadOnly) => {
      const data = await getNotifications({
        page: pageNumber,
        limit: PAGE_SIZE,
        ...(unreadOnly && { unread: true }),
      });

      if (typeof data.unreadCount === "number")
        setUnreadCount(data.unreadCount);

      return data;
    },
    [setUnreadCount],
  );

  const loadFirstPage = useCallback(
    async (unreadOnly) => {
      try {
        setError("");
        const data = await fetchPage(1, unreadOnly);

        setItems(Array.isArray(data.data) ? data.data : []);
        setPage(1);
        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Không tải được thông báo. Vui lòng thử lại.",
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    loadFirstPage(false);
  }, [loadFirstPage]);

  const handleFilterChange = (value) => {
    if (value === filter) return;

    setFilter(value);
    setLoading(true);
    setError("");
    loadFirstPage(value === "unread");
  };

  const handleLoadMore = async () => {
    try {
      setError("");
      setLoadingMore(true);

      const data = await fetchPage(page + 1, filter === "unread");

      // Bỏ thông báo trùng nếu có thông báo mới xuất hiện trong lúc đang xem
      setItems((prev) => {
        const existing = new Set(prev.map((item) => item._id));

        return [
          ...prev,
          ...(Array.isArray(data.data) ? data.data : []).filter(
            (item) => !existing.has(item._id),
          ),
        ];
      });
      setPage(page + 1);
      setHasMore(Boolean(data.pagination?.hasMore));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không tải thêm được thông báo. Vui lòng thử lại.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpen = async (notification) => {
    if (!notification.isRead) {
      setItems((prev) => setRead(prev, notification._id, true));

      try {
        const data = await markNotificationRead(notification._id);
        if (typeof data.unreadCount === "number")
          setUnreadCount(data.unreadCount);
      } catch (err) {
        setItems((prev) => setRead(prev, notification._id, false));
        setError(
          err.response?.data?.message || "Không thể đánh dấu thông báo đã đọc.",
        );
        return;
      }
    }

    const link = getLink(notification);

    if (link) navigate(link);
  };

  const handleMarkAllRead = async () => {
    if (working) return;
    try {
      setWorking(true);
      const data = await markAllNotificationsRead();

      if (typeof data.unreadCount === "number")
        setUnreadCount(data.unreadCount);
      setItems((prev) =>
        filter === "unread"
          ? []
          : prev.map((item) => ({ ...item, isRead: true })),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể đánh dấu đã đọc. Vui lòng thử lại.",
      );
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async (id) => {
    if (working) return;
    try {
      setWorking(true);
      const data = await deleteNotification(id);

      if (typeof data.unreadCount === "number")
        setUnreadCount(data.unreadCount);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể xoá thông báo. Vui lòng thử lại.",
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Thông báo</h1>

        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || working}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={16} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="mt-6 flex gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterChange(option.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === option.value
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.label}
            {option.value === "unread" &&
              unreadCount > 0 &&
              ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((notification) => {
            const { icon: Icon, className } =
              TYPE_STYLES[notification.type] || TYPE_STYLES.SYSTEM;

            return (
              <article
                key={notification._id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                  notification.isRead
                    ? "border-slate-200 bg-white"
                    : "border-blue-100 bg-blue-50/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleOpen(notification)}
                  className="flex min-w-0 flex-1 items-start gap-4 text-left"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2
                        className={`text-slate-900 ${notification.isRead ? "font-medium" : "font-semibold"}`}
                      >
                        {notification.title}
                      </h2>

                      {!notification.isRead && (
                        <span
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                          aria-label="Chưa đọc"
                        />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(notification._id)}
                  aria-label="Xoá thông báo"
                  disabled={working}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}

          {!items.length && !error && (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-500">
              {filter === "unread"
                ? "Bạn đã đọc hết thông báo."
                : "Chưa có thông báo."}
            </div>
          )}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
