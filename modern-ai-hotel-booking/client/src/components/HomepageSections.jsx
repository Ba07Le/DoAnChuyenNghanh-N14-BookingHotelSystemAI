import { Link } from "react-router-dom";

import {
  MapPin,
  Star,
  Building2,
  Percent,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
  Headphones,
  ArrowRight,
} from "lucide-react";

/* =========================================================
   1. POPULAR DESTINATIONS
========================================================= */

export function PopularDestinations({ destinations = [], isLoading = false }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Khám phá Việt Nam
          </p>

          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Điểm đến phổ biến
          </h2>

          <p className="mt-2 text-slate-500">
            Những điểm đến được nhiều du khách lựa chọn
          </p>
        </div>

        <Link
          to="/destinations"
          className="hidden items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 md:flex"
        >
          Xem tất cả
          <ArrowRight size={17} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : destinations.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {destinations.map((destination) => (
            <div
              key={destination.city}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={
                    destination.image ||
                    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80"
                  }
                  alt={destination.city}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} />
                    <h3 className="font-semibold">{destination.city}</h3>
                  </div>

                  <p className="mt-1 text-sm text-white/80">
                    {destination.hotelCount || 0} khách sạn
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Chưa có dữ liệu điểm đến." />
      )}
    </section>
  );
}

/* =========================================================
   2. FEATURED HOTELS
========================================================= */

export function FeaturedHotels({ hotels = [], isLoading = false }) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Lựa chọn nổi bật
            </p>

            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Khách sạn nổi bật
            </h2>

            <p className="mt-2 text-slate-500">
              Những nơi lưu trú được đánh giá cao
            </p>
          </div>

          <Link
            to="/hotels"
            className="hidden items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 md:flex"
          >
            Xem tất cả
            <ArrowRight size={17} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : hotels.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => {
              const primaryImage =
                hotel.images?.find((image) => image.isPrimary)?.url ||
                hotel.images?.[0]?.url ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

              return (
                <div
                  key={hotel._id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={primaryImage}
                      alt={hotel.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute left-4 top-4 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow">
                      {hotel.starRating || 0} ★
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="mb-1 text-sm text-blue-600">
                      {hotel.address?.city || "Việt Nam"}
                    </p>

                    <h3 className="line-clamp-1 text-lg font-bold text-slate-900">
                      {hotel.name}
                    </h3>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star
                          size={16}
                          className="fill-yellow-400 text-yellow-400"
                        />

                        <span className="font-semibold text-slate-900">
                          {hotel.averageRating || 0}
                        </span>
                      </div>

                      <span className="text-sm text-slate-400">
                        ({hotel.reviewCount || 0} đánh giá)
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Giá từ</p>

                        <p className="text-xl font-bold text-blue-600">
                          {Number(hotel.priceFrom || 0).toLocaleString("vi-VN")}
                          ₫
                        </p>
                      </div>

                      <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600">
                        Xem phòng
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Chưa có khách sạn nổi bật." />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   3. HOTEL TYPES
========================================================= */

export function HotelTypes({ types = [], isLoading = false }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Chọn phong cách
        </p>

        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Khám phá theo loại hình
        </h2>

        <p className="mt-2 text-slate-500">
          Tìm nơi lưu trú phù hợp với phong cách chuyến đi của bạn
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : types.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {types.map((type) => (
            <div
              key={type.type}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Building2 size={23} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                {formatHotelType(type.type)}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {type.hotelCount || 0} nơi lưu trú
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Chưa có dữ liệu loại hình khách sạn." />
      )}
    </section>
  );
}

/* =========================================================
   4. FEATURED DEALS
========================================================= */

export function FeaturedDeals({ deals = [], isLoading = false }) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Ưu đãi dành cho bạn
          </p>

          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Ưu đãi nổi bật
          </h2>

          <p className="mt-2 text-slate-500">
            Tiết kiệm hơn cho chuyến đi tiếp theo
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : deals.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <div
                key={deal._id}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Percent size={23} />
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {deal.discountType === "PERCENTAGE"
                      ? `-${deal.discountValue}%`
                      : `-${Number(deal.discountValue || 0).toLocaleString(
                          "vi-VN",
                        )}₫`}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {deal.code}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  {deal.description || "Ưu đãi đặc biệt dành cho khách hàng."}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    Áp dụng từ {formatDate(deal.startDate)} đến{" "}
                    {formatDate(deal.endDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Chưa có ưu đãi nổi bật." />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   5. WHY CHOOSE US
========================================================= */

export function WhyChooseUs() {
  const reasons = [
    {
      icon: Sparkles,
      title: "Tìm kiếm thông minh",
      description:
        "Dễ dàng tìm kiếm nơi lưu trú phù hợp với nhu cầu và ngân sách.",
    },
    {
      icon: BadgeCheck,
      title: "Thông tin rõ ràng",
      description:
        "Thông tin khách sạn, phòng và tiện nghi được hiển thị minh bạch.",
    },
    {
      icon: ShieldCheck,
      title: "Đặt phòng an tâm",
      description: "Quy trình đặt phòng rõ ràng và an toàn cho mọi khách hàng.",
    },
    {
      icon: Headphones,
      title: "Luôn sẵn sàng hỗ trợ",
      description:
        "Hỗ trợ khách hàng trong suốt hành trình đặt và sử dụng dịch vụ.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          HOTELAI
        </p>

        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Tại sao nên lựa chọn HOTELAI?
        </h2>

        <p className="mx-auto mt-2 max-w-2xl text-slate-500">
          Một nền tảng đặt phòng hiện đại giúp chuyến đi của bạn trở nên đơn
          giản và thuận tiện hơn.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason) => {
          const Icon = reason.icon;

          return (
            <div
              key={reason.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon size={26} />
              </div>

              <h3 className="mt-5 font-bold text-slate-900">{reason.title}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {reason.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
      <Building2 className="mx-auto text-slate-300" size={36} />

      <p className="mt-3 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function formatHotelType(type) {
  const types = {
    HOTEL: "Khách sạn",
    RESORT: "Resort",
    VILLA: "Villa",
    APARTMENT: "Căn hộ",
    HOMESTAY: "Homestay",
    BOUTIQUE: "Boutique",
  };

  return types[type] || type;
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("vi-VN");
}
