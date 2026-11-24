import {
  Bell,
  BellOff,
  Search,
  X,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
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
import { useNavigate } from "react-router-dom";
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");

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
    setQuery("");
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
    if (working) return;
    if (!notification.isRead) {
      setWorking(true);
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
      } finally {
        setWorking(false);
      }
    }

    const link = getLink(notification);

    if (filter === "unread")
      setItems((prev) => prev.filter((item) => item._id !== notification._id));
    if (link) navigate(link);
  };

  const handleMarkAllRead = async () => {
    if (working) return;
    try {
      setWorking(true);
      const data = await markAllNotificationsRead();

      if (typeof data.unreadCount === "number")
        setUnreadCount(data.unreadCount);
      if (filter === "unread") setHasMore(false);
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

  const normalize = (value) =>
    String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const visible = items.filter((item) =>
    normalize(`${item.title} ${item.message}`).includes(
      normalize(query.trim()),
    ),
  );
  const labels = {
    BOOKING_CONFIRMED: "Đặt phòng",
    BOOKING_CANCELLED: "Đặt phòng",
    PAYMENT_SUCCESS: "Thanh toán",
    PAYMENT_FAILED: "Thanh toán",
    CHECK_IN_REMINDER: "Lịch trình",
    REVIEW_REMINDER: "Đánh giá",
    PROMOTION: "Ưu đãi",
    SYSTEM: "Hệ thống",
  };
  const groups = visible.reduce((acc, item) => {
    const date = new Date(item.createdAt);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const key = Number.isNaN(date.getTime())
      ? "Thông báo"
      : date.toDateString() === now.toDateString()
        ? "Hôm nay"
        : date.toDateString() === yesterday.toDateString()
          ? "Hôm qua"
          : date.toLocaleDateString("vi-VN");
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());

  return (
    <section className="sy-inbox" aria-labelledby="sy-inbox-title">
      <header className="sy-inbox-heading">
        <div>
          <p className="sy-inbox-kicker">YOUR TRAVEL UPDATES</p>
          <h2 id="sy-inbox-title">Thông báo</h2>
          <p>Cập nhật những thông tin quan trọng cho hành trình của bạn.</p>
        </div>
        <button
          type="button"
          className="sy-inbox-secondary"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || working || loading || loadingMore}
        >
          <CheckCheck size={18} /> Đánh dấu tất cả đã đọc
        </button>
      </header>
      <div className="sy-inbox-summary">
        <div className="sy-inbox-emblem">
          <Bell size={29} />
        </div>
        <div>
          <p>TRUNG TÂM THÔNG BÁO</p>
          <strong>
            {loading ? "Đang cập nhật…" : `${unreadCount} thông báo chưa đọc`}
          </strong>
          <span>
            {unreadCount
              ? "Bạn có cập nhật mới cần xem."
              : "Theo dõi các cập nhật về chuyến đi của bạn."}
          </span>
        </div>
        <Bell className="sy-inbox-decoration" size={140} aria-hidden="true" />
      </div>
      <div className="sy-inbox-toolbar">
        <div className="sy-inbox-tabs" aria-label="Lọc thông báo">
          {FILTERS.map((option) => (
            <button
              type="button"
              key={option.value}
              aria-pressed={filter === option.value}
              disabled={loading || loadingMore || working}
              onClick={() => handleFilterChange(option.value)}
            >
              {option.label}
              {option.value === "unread" && <span>{unreadCount}</span>}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="sy-inbox-refresh"
          aria-label="Tải lại thông báo"
          title="Tải lại thông báo"
          disabled={loading || loadingMore || working}
          onClick={() => {
            setLoading(true);
            loadFirstPage(filter === "unread");
          }}
        >
          <RefreshCw size={17} />
        </button>
      </div>
      <div className="sy-inbox-search">
        <Search size={19} />
        <input
          aria-label="Tìm trong thông báo đã tải"
          placeholder="Tìm nội dung, mã đặt phòng..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            aria-label="Xóa từ khóa"
            onClick={() => setQuery("")}
          >
            <X size={17} />
          </button>
        )}
      </div>
      {query && (
        <p className="sy-inbox-hint">
          {visible.length} kết quả trong {items.length} thông báo đã tải.
        </p>
      )}
      {error && (
        <div className="sy-inbox-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            disabled={working || loading}
            onClick={() => {
              setLoading(true);
              loadFirstPage(filter === "unread");
            }}
          >
            Thử lại
          </button>
        </div>
      )}
      {loading ? (
        <div
          className="sy-inbox-list"
          aria-busy="true"
          aria-label="Đang tải thông báo"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="sy-inbox-skeleton" />
          ))}
        </div>
      ) : (
        <div className="sy-inbox-list">
          {Array.from(groups, ([date, entries]) => (
            <section key={date} className="sy-inbox-group">
              <h3>{date}</h3>
              {entries.map((notification) => {
                const { icon: Icon } =
                  TYPE_STYLES[notification.type] || TYPE_STYLES.SYSTEM;
                const tone = ["BOOKING_CANCELLED", "PAYMENT_FAILED"].includes(
                  notification.type,
                )
                  ? "danger"
                  : ["CHECK_IN_REMINDER", "REVIEW_REMINDER"].includes(
                        notification.type,
                      )
                    ? "gold"
                    : "teal";
                return (
                  <article
                    key={notification._id}
                    className={`sy-inbox-item ${notification.isRead ? "" : "sy-inbox-unread"}`}
                  >
                    <button
                      type="button"
                      className="sy-inbox-open"
                      disabled={working || loadingMore}
                      onClick={() => handleOpen(notification)}
                    >
                      <span className={`sy-inbox-icon sy-inbox-${tone}`}>
                        <Icon size={21} />
                      </span>
                      <span className="sy-inbox-body">
                        <span className="sy-inbox-meta">
                          <span>{labels[notification.type] || "Hệ thống"}</span>
                          {!notification.isRead && (
                            <span className="sy-inbox-new">Chưa đọc</span>
                          )}
                        </span>
                        <strong>{notification.title}</strong>
                        <span className="sy-inbox-message">
                          {notification.message}
                        </span>
                        <span className="sy-inbox-time">
                          <Clock3 size={13} />
                          {formatTimeAgo(notification.createdAt)}
                          {getLink(notification) && (
                            <span className="sy-inbox-link">
                              Xem chi tiết <ArrowUpRight size={13} />
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="sy-inbox-delete"
                      title="Xóa thông báo"
                      aria-label={`Xóa thông báo: ${notification.title}`}
                      disabled={working || loadingMore}
                      onClick={() => handleDelete(notification._id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                );
              })}
            </section>
          ))}
          {!visible.length && !error && (
            <div className="sy-inbox-empty">
              <span>
                {query ? <Search size={32} /> : <BellOff size={32} />}
              </span>
              <h3>
                {query
                  ? "Không tìm thấy thông báo phù hợp"
                  : filter === "unread"
                    ? "Bạn đã đọc hết thông báo"
                    : "Chưa có thông báo"}
              </h3>
              <p>
                {query
                  ? "Thử từ khóa khác hoặc tải thêm thông báo."
                  : "Các cập nhật mới về hành trình sẽ xuất hiện tại đây."}
              </p>
              {query ? (
                <button
                  className="sy-inbox-secondary"
                  onClick={() => setQuery("")}
                >
                  Xóa từ khóa
                </button>
              ) : (
                filter === "unread" && (
                  <button
                    className="sy-inbox-secondary"
                    onClick={() => handleFilterChange("all")}
                  >
                    Xem tất cả thông báo
                  </button>
                )
              )}
            </div>
          )}
          {hasMore && (
            <div className="sy-inbox-more">
              <button
                className="sy-inbox-secondary"
                onClick={handleLoadMore}
                disabled={loadingMore || working}
              >
                {loadingMore ? "Đang tải..." : "Xem thêm thông báo"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Notifications;
