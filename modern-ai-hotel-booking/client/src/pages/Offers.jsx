import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Copy,
  TicketPercent,
  Sparkles,
  Search,
  X,
  Wallet,
  Clock3,
  ChevronDown,
  BedDouble,
} from "lucide-react";
import { getOffers } from "../api/offerApi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const money = (value) => Number(value || 0).toLocaleString("vi-VN") + "₫";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "";
const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
const filters = [
  { value: "all", label: "Tất cả" },
  { value: "PERCENTAGE", label: "Giảm theo %" },
  { value: "FIXED", label: "Giảm theo số tiền" },
];

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [copiedCode, setCopiedCode] = useState("");
  const [copyError, setCopyError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("all");
  const timer = useRef(null);
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");
    getOffers()
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.data;
        if (!Array.isArray(items))
          throw new Error("Dữ liệu ưu đãi không đúng định dạng.");
        if (active) setOffers(items);
      })
      .catch((error) => {
        console.error("Không thể tải ưu đãi:", error);
        if (active) {
          setOffers([]);
          setLoadError(
            "Không tải được mã ưu đãi. Vui lòng kiểm tra kết nối và thử lại.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function handleCopy(code) {
    clearTimeout(timer.current);
    setCopiedCode("");
    setCopyError("");
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      timer.current = setTimeout(() => setCopiedCode(""), 2200);
    } catch {
      setCopyError(
        "Không thể sao chép tự động. Bạn có thể chọn và sao chép mã trực tiếp trên voucher.",
      );
    }
  }
  const visible = offers.filter(
    (o) =>
      (type === "all" || o.discountType === type) &&
      normalize(
        [o.code, o.title, o.description, o.shortDescription].join(" "),
      ).includes(normalize(keyword.trim())),
  );
  return (
    <div className="sy-offers-page">
      <Navbar />
      <main>
        <section className="sy-offers-banner sy-offers-width">
          <div className="sy-offers-cover">
            <div className="sy-offers-intro">
              <div className="sy-offers-crumb">
                <Link to="/">Trang chủ</Link>
                <span>/</span> Ưu đãi
              </div>
              <p className="sy-offers-kicker">
                <Sparkles size={16} /> EXCLUSIVE ESCAPES
              </p>
              <h1>
                Đi nhiều hơn.
                <br />
                <em>Tận hưởng nhiều hơn.</em>
              </h1>
              <p>
                Những đặc quyền dành cho hành trình của bạn. Khám phá mã ưu đãi
                và lựa chọn kỳ nghỉ thật xứng đáng.
              </p>
              <a href="#sy-offers-collection" className="sy-offers-gold">
                Khám phá ưu đãi <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="sy-offers-stamp">
              <TicketPercent size={30} />
              <span>SEEYAHH!</span>
              <small>TRAVEL PRIVILEGES</small>
            </div>
          </div>
          <div className="sy-offers-steps">
            {[
              {
                icon: TicketPercent,
                title: "Chọn ưu đãi",
                desc: "Tìm mã phù hợp chuyến đi",
              },
              {
                icon: Copy,
                title: "Sao chép mã",
                desc: "Lưu mã trước khi đặt phòng",
              },
              {
                icon: BedDouble,
                title: "Tận hưởng kỳ nghỉ",
                desc: "Nhập mã tại bước đặt phòng",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title}>
                <span className="sy-offers-step-icon">
                  <Icon size={22} />
                </span>
                <div>
                  <small>0{i + 1}</small>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section
          id="sy-offers-collection"
          className="sy-offers-width sy-offers-collection"
        >
          <div className="sy-offers-heading">
            <div>
              <p className="sy-offers-kicker">THE SEEYAHH! PRIVILEGES</p>
              <h2>Ưu đãi dành riêng cho hành trình.</h2>
              <p>Kiểm tra điều kiện và thời hạn trước khi sử dụng mã.</p>
            </div>
            <Link to="/hotels" className="sy-offers-link">
              Khám phá khách sạn <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="sy-offers-toolbar">
            <div
              className="sy-offers-tabs"
              role="group"
              aria-label="Loại ưu đãi"
            >
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={type === f.value}
                  onClick={() => setType(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="sy-offers-search">
              <Search size={18} />
              <input
                aria-label="Tìm mã ưu đãi"
                placeholder="Tìm mã ưu đãi..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              {keyword && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa"
                  onClick={() => setKeyword("")}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>
          {!isLoading && !loadError && (
            <p className="sy-offers-count" aria-live="polite">
              {visible.length} ưu đãi phù hợp
            </p>
          )}
          <div aria-live="polite" className="sy-offers-feedback">
            {copyError}
          </div>
          {isLoading ? (
            <div className="sy-offers-grid" aria-label="Đang tải ưu đãi">
              {[1, 2, 3].map((n) => (
                <div key={n} className="sy-offers-skeleton animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="sy-offers-empty" role="alert">
              <TicketPercent size={36} />
              <h3>Không thể tải ưu đãi</h3>
              <p>{loadError}</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)}>
                Thử lại
              </button>
            </div>
          ) : visible.length ? (
            <div className="sy-offers-grid">
              {visible.map((offer, index) => (
                <article
                  className="sy-offers-ticket"
                  key={offer._id || offer.code}
                  style={{ "--offer-delay": `${Math.min(index, 5) * 55}ms` }}
                >
                  <div className="sy-offers-ticket-top">
                    <div className="sy-offers-ticket-label">
                      <TicketPercent size={20} />
                      <span>{offer.badge || "SEEYAHH! EXCLUSIVE"}</span>
                      {offer.featured && <small>Nổi bật</small>}
                    </div>
                    <p>Tiết kiệm</p>
                    <strong>
                      {offer.discountType === "PERCENTAGE"
                        ? `${offer.discountValue}%`
                        : money(offer.discountValue)}
                    </strong>
                    <span className="sy-offers-ticket-brand">
                      SEEYAHH! · TRAVEL COLLECTION
                    </span>
                  </div>
                  <div className="sy-offers-ticket-body">
                    <h3>{offer.title || "Ưu đãi đặc biệt"}</h3>
                    <p className="sy-offers-description">
                      {offer.description ||
                        offer.shortDescription ||
                        "Ưu đãi đặc biệt dành cho khách hàng SeeYAHH!."}
                    </p>
                    <div className="sy-offers-meta">
                      <p>
                        <CalendarDays size={17} /> {formatDate(offer.startDate)}{" "}
                        – {formatDate(offer.endDate)}
                      </p>
                      {Number(offer.minBookingAmount) > 0 && (
                        <p>
                          <Wallet size={17} /> Đơn từ{" "}
                          {money(offer.minBookingAmount)}
                        </p>
                      )}
                      {Number(offer.maxDiscount) > 0 && (
                        <p>
                          <TicketPercent size={17} /> Giảm tối đa{" "}
                          {money(offer.maxDiscount)}
                        </p>
                      )}
                      {Number(offer.usageLimit) > 0 && (
                        <p>
                          <Clock3 size={17} /> Còn{" "}
                          {Math.max(
                            0,
                            offer.usageLimit - (offer.usedCount || 0),
                          )}{" "}
                          lượt sử dụng
                        </p>
                      )}
                    </div>
                    {Array.isArray(offer.terms) && offer.terms.length > 0 && (
                      <details className="sy-offers-terms">
                        <summary>
                          Điều kiện áp dụng <ChevronDown size={16} />
                        </summary>
                        <ul>
                          {offer.terms.map((term, i) => (
                            <li key={i}>{term}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    <div className="sy-offers-code">
                      <div>
                        <small>MÃ ƯU ĐÃI</small>
                        <strong>{offer.code}</strong>
                      </div>
                      <button
                        type="button"
                        aria-label={`Sao chép mã ${offer.code}`}
                        onClick={() => handleCopy(offer.code)}
                      >
                        {copiedCode === offer.code ? (
                          <Check size={18} />
                        ) : (
                          <Copy size={18} />
                        )}{" "}
                        {copiedCode === offer.code ? "Đã sao chép" : "Sao chép"}
                      </button>
                    </div>
                    <Link to="/hotels" className="sy-offers-ticket-link">
                      Tìm khách sạn <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="sy-offers-empty">
              <TicketPercent size={36} />
              <h3>
                {offers.length
                  ? "Không tìm thấy ưu đãi phù hợp"
                  : "Chưa có ưu đãi"}
              </h3>
              <p>
                {offers.length
                  ? "Thử từ khóa hoặc loại ưu đãi khác."
                  : "Các chương trình mới sẽ được cập nhật trên SeeYAHH!."}
              </p>
              {offers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setType("all");
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
          <span className="sr-only" role="status">
            {copiedCode ? `Đã sao chép ${copiedCode}` : ""}
          </span>
        </section>
        <section className="sy-offers-width sy-offers-bottom">
          <div>
            <p className="sy-offers-kicker">YOUR NEXT ESCAPE</p>
            <h2>
              Kỳ nghỉ đáng nhớ
              <br />
              <em>bắt đầu từ đây.</em>
            </h2>
            <p>
              Đừng bỏ lỡ ưu đãi mới. Các chương trình được cập nhật thường xuyên
              trên SeeYAHH!.
            </p>
            <Link to="/hotels" className="sy-offers-gold">
              Tìm nơi lưu trú <ArrowUpRight size={18} />
            </Link>
          </div>
          <div
            className="sy-offers-bottom-photo"
            role="img"
            aria-label="Không gian nghỉ dưỡng bên biển"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
