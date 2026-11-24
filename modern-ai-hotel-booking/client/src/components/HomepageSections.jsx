import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Heart,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  Headphones,
  TicketPercent,
  Copy,
  Check,
  Star,
  MapPin,
} from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { getImageUrl } from "../utils/imageUrl";

const photo = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`;
const fallback = photo("photo-1566073771259-6a8506099945");
const typePhotos = {
  HOTEL: "photo-1566073771259-6a8506099945",
  RESORT: "photo-1571896349842-33c89424de2d",
  VILLA: "photo-1613490493576-7fde63acd811",
  APARTMENT: "photo-1600210492486-724fe5c67fb0",
  HOMESTAY: "photo-1510798831971-661eb04b3739",
  BOUTIQUE: "photo-1564501049412-61c2a3083791",
};
const typeNames = {
  HOTEL: "Khách sạn",
  RESORT: "Resort",
  VILLA: "Villa",
  APARTMENT: "Căn hộ",
  HOMESTAY: "Homestay",
  BOUTIQUE: "Boutique",
};
const money = (value) => Number(value || 0).toLocaleString("vi-VN") + "₫";
const date = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "";
function Picture({ src, alt, ...props }) {
  return (
    <img
      {...props}
      src={getImageUrl(src) || fallback}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
      }}
    />
  );
}
function Section({ children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("sy-home-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={ref} className={`sy-home-section ${className}`}>
      <div className="sy-home-container">{children}</div>
    </section>
  );
}
function Heading({ eyebrow, title, description, to }) {
  return (
    <div className="sy-home-heading">
      <div>
        <p className="sy-home-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="sy-home-description">{description}</p>
      </div>
      {to && (
        <Link className="sy-home-more" to={to}>
          Xem tất cả <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
function State({ loading, text }) {
  return loading ? (
    <div className="sy-home-skeletons" aria-label="Đang tải dữ liệu">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse" />
      ))}
    </div>
  ) : (
    <p className="sy-home-empty">{text}</p>
  );
}
export function TrustStrip() {
  return (
    <div className="sy-home-trust sy-home-container">
      {[
        [Sparkles, "Tìm kiếm thông minh"],
        [ShieldCheck, "Đặt phòng an tâm"],
        [BadgeCheck, "Thông tin minh bạch"],
        [Headphones, "Hỗ trợ tận tâm"],
      ].map(([Icon, label]) => (
        <div key={label}>
          <Icon size={21} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
export function PopularDestinations({ destinations = [], isLoading = false }) {
  return (
    <Section>
      <Heading
        eyebrow="01 — DISCOVER VIETNAM"
        title="Bạn muốn đi đâu?"
        description="Mỗi vùng đất, một trải nghiệm riêng."
        to="/destinations"
      />
      {isLoading || !destinations.length ? (
        <State loading={isLoading} text="Chưa có dữ liệu điểm đến." />
      ) : (
        <div className="sy-home-bento">
          {destinations.map((d, i) => (
            <Link
              key={d.city}
              to={"/hotels?city=" + encodeURIComponent(d.city)}
              className={`sy-home-destination ${i % 8 === 0 || i % 8 === 7 ? "sy-home-destination-wide" : ""}`}
            >
              <Picture
                src={d.image || photo("photo-1528127269322-539801943592")}
                alt={d.city}
              />
              <div className="sy-home-image-shade" />
              <div className="sy-home-destination-copy">
                <div>
                  <h3>{d.city}</h3>
                  <p>{d.hotelCount || 0} khách sạn</p>
                </div>
                <span>
                  <ArrowUpRight size={21} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
function Rail({ children, label }) {
  const ref = useRef(null);
  const move = (dir) => {
    const el = ref.current;
    if (el)
      el.scrollBy({
        left: dir * el.clientWidth * 0.85,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  };
  return (
    <div className="sy-home-rail-wrap">
      <div className="sy-home-rail-actions">
        <button
          type="button"
          aria-label={`Trước: ${label}`}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={19} />
        </button>
        <button
          type="button"
          aria-label={`Tiếp: ${label}`}
          onClick={() => move(1)}
        >
          <ArrowRight size={19} />
        </button>
      </div>
      <div className="sy-home-rail" ref={ref} tabIndex={0} aria-label={label}>
        {children}
      </div>
    </div>
  );
}
export function HotelTypes({ types = [], isLoading = false }) {
  return (
    <Section className="sy-home-types">
      <Heading
        eyebrow="02 — STAY IN STYLE"
        title="Nghỉ dưỡng theo cách của bạn."
        description="Tìm không gian phù hợp với từng hành trình."
      />
      {isLoading || !types.length ? (
        <State
          loading={isLoading}
          text="Chưa có dữ liệu loại hình khách sạn."
        />
      ) : (
        <div className="sy-home-type-grid">
          {types.map((t) => (
            <Link
              key={t.type}
              to={"/hotels?type=" + encodeURIComponent(t.type)}
              className="sy-home-type"
            >
              <Picture
                src={photo(typePhotos[t.type] || typePhotos.HOTEL)}
                alt={typeNames[t.type] || t.type}
              />
              <div>
                <h3>{typeNames[t.type] || t.type}</h3>
                <p>{t.hotelCount || 0} nơi lưu trú</p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
function Hotel({ hotel }) {
  const { isLiked, toggleLike } = useWishlist();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const liked = isLiked(hotel._id);
  const image =
    hotel.images?.find((i) => i.isPrimary)?.url || hotel.images?.[0]?.url;
  const toggle = async () => {
    setBusy(true);
    setError(false);
    try {
      const ok = await toggleLike(hotel._id);
      if (!ok) setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="sy-home-hotel">
      <div className="sy-home-hotel-image">
        <Link to={"/hotels/" + hotel.slug}>
          <Picture src={image} alt={hotel.name} />
        </Link>
        <span className="sy-home-stars">
          <Star size={13} fill="currentColor" />
          {hotel.starRating || 0} sao
        </span>
        <button
          type="button"
          className="sy-home-heart"
          aria-label={liked ? "Bỏ yêu thích" : "Thêm yêu thích"}
          aria-pressed={liked}
          disabled={busy}
          onClick={toggle}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="sy-home-hotel-body">
        <p className="sy-home-location">
          <MapPin size={14} />
          {hotel.address?.city || "Việt Nam"}
        </p>
        <Link to={"/hotels/" + hotel.slug}>
          <h3>{hotel.name}</h3>
        </Link>
        <p className="sy-home-rating">
          {hotel.reviewCount > 0 ? (
            <>
              <Star size={14} fill="currentColor" /> {hotel.averageRating || 0}{" "}
              · {hotel.reviewCount} đánh giá
            </>
          ) : (
            "Chưa có đánh giá"
          )}
        </p>
        {error && (
          <p role="status" className="text-xs text-red-600">
            Không thể cập nhật yêu thích. Vui lòng thử lại.
          </p>
        )}
        <div className="sy-home-hotel-bottom">
          <div>
            <small>Giá từ</small>
            <strong>{money(hotel.priceFrom)}</strong>
          </div>
          <Link to={"/hotels/" + hotel.slug} className="sy-home-room-link">
            Xem phòng <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function FeaturedHotels({ hotels = [], isLoading = false }) {
  return (
    <Section className="sy-home-collection">
      <Heading
        eyebrow="03 — THE SEEYAHH! COLLECTION"
        title="Những nơi lưu trú đáng nhớ."
        description="Khám phá các lựa chọn nổi bật dành cho chuyến đi của bạn."
        to="/hotels"
      />
      {isLoading || !hotels.length ? (
        <State loading={isLoading} text="Chưa có khách sạn nổi bật." />
      ) : (
        <Rail label="Khách sạn nổi bật">
          {hotels.map((h) => (
            <Hotel key={h._id} hotel={h} />
          ))}
        </Rail>
      )}
    </Section>
  );
}
function Voucher({ deal }) {
  const [status, setStatus] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(deal.code);
      setStatus("Đã sao chép");
    } catch {
      setStatus("Hãy sao chép mã thủ công");
    }
  };
  return (
    <article className="sy-home-voucher">
      <div className="sy-home-voucher-top">
        <TicketPercent size={25} />
        <span>SEEYAHH! EXCLUSIVE</span>
      </div>
      <small>Tiết kiệm</small>
      <strong>
        {deal.discountType === "PERCENTAGE"
          ? `${deal.discountValue}%`
          : money(deal.discountValue)}
      </strong>
      <p>{deal.description || "Ưu đãi đặc biệt dành cho khách hàng."}</p>
      <div className="sy-home-voucher-code">
        <span>{deal.code}</span>
        <button
          type="button"
          aria-label={`Sao chép ${deal.code}`}
          onClick={copy}
        >
          {status === "Đã sao chép" ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
      <small>
        Áp dụng từ {date(deal.startDate)} đến {date(deal.endDate)}
      </small>
      {status && <small role="status">{status}</small>}
    </article>
  );
}
export function FeaturedDeals({ deals = [], isLoading = false }) {
  return (
    <Section>
      <Heading
        eyebrow="04 — EXCLUSIVE OFFERS"
        title="Trải nghiệm nhiều hơn. Tiết kiệm hơn."
        description="Những ưu đãi dành cho hành trình tiếp theo."
        to="/offers"
      />
      {isLoading || !deals.length ? (
        <State loading={isLoading} text="Chưa có ưu đãi nổi bật." />
      ) : (
        <div className="sy-home-vouchers">
          {deals.map((d) => (
            <Voucher key={d._id} deal={d} />
          ))}
        </div>
      )}
    </Section>
  );
}
export function WhyChooseUs() {
  const reasons = [
    [
      Sparkles,
      "Tìm kiếm thông minh",
      "Khám phá lựa chọn phù hợp với nhu cầu và ngân sách.",
    ],
    [
      BadgeCheck,
      "Thông tin rõ ràng",
      "Thông tin khách sạn, phòng và tiện nghi minh bạch.",
    ],
    [
      ShieldCheck,
      "Đặt phòng an tâm",
      "Quy trình đặt phòng rõ ràng và thuận tiện.",
    ],
    [Headphones, "Luôn bên bạn", "Hỗ trợ trong suốt hành trình đặt phòng."],
  ];
  return (
    <Section className="sy-home-why">
      <div className="sy-home-why-grid">
        <Picture
          src={photo("photo-1571896349842-33c89424de2d")}
          alt="Không gian nghỉ dưỡng bên hồ bơi"
        />
        <div>
          <Heading
            eyebrow="05 — THE SEEYAHH! DIFFERENCE"
            title="Không chỉ là một nơi để ở."
            description="Một hành trình đáng nhớ bắt đầu từ nơi bạn chọn dừng chân."
          />
          <div className="sy-home-reasons">
            {reasons.map(([Icon, title, description]) => (
              <div key={title}>
                <Icon size={25} />
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <Link to="/hotels" className="sy-home-room-link">
            Khám phá khách sạn <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </Section>
  );
}
