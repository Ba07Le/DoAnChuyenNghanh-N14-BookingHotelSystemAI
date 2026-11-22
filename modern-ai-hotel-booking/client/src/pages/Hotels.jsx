import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Search, SlidersHorizontal, ChevronDown, CalendarDays, Users, Minus, Plus } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HotelCard from "../components/hotels/HotelCard";
import FilterDrawer from "../components/filters/FilterDrawer";
import { searchHotels } from "../api/hotelApi";
const fallback = [];
function Hotels() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("destination") || "");
  const [checkIn, setCheckIn] = useState(params.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || "");
  const [adults, setAdults] = useState(Math.max(1, Number(params.get("adults")) || 2));
  const [children, setChildren] = useState(Math.max(0, Number(params.get("children")) || 0));
  const [rooms, setRooms] = useState(Math.max(1, Number(params.get("rooms")) || 1));
  const [openGuests, setOpenGuests] = useState(false);
  const [dateError, setDateError] = useState("");
  const [sort, setSort] = useState("recommended");
  const [hotels, setHotels] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const fetch = async (extra = {}) => {
    try {
      setLoading(true);
      setError("");
      const r = await searchHotels({
        destination: search,
        ...extra,
        ...filters,
      });
      if (r.success) setHotels(r.data || []);
    } catch (e) {
      setError(
        e.response?.data?.message || "Không thể tải danh sách khách sạn.",
      );
    } finally {
      setLoading(false);
    }
  };
  // URL là nguồn dữ liệu đã xác nhận; khi Back/Forward cũng khôi phục lại form.
  const queryString = params.toString();
  useEffect(() => {
    const p = new URLSearchParams(queryString);
    const destination = p.get("destination") || "";
    setSearch(destination);
    setCheckIn(p.get("checkIn") || "");
    setCheckOut(p.get("checkOut") || "");
    setAdults(Math.max(1, Number(p.get("adults")) || 2));
    setChildren(Math.max(0, Number(p.get("children")) || 0));
    setRooms(Math.max(1, Number(p.get("rooms")) || 1));
    setDateError("");
    // Chỉ dùng điểm đến cho API hiện tại; ngày/khách được dùng tại Booking Quote.
    fetch({ destination });
  }, [queryString]);

  const handleSearch = () => {
    if (checkIn && checkOut && checkOut <= checkIn) {
      setDateError("Ngày trả phòng phải sau ngày nhận phòng.");
      return;
    }
    setDateError("");
    setOpenGuests(false);
    const next = new URLSearchParams();
    if (search.trim()) next.set("destination", search.trim());
    if (checkIn) next.set("checkIn", checkIn);
    if (checkOut) next.set("checkOut", checkOut);
    // Khi chưa tìm từ Hero, không tự lưu mặc định khách/phòng vào URL.
    if (params.has("adults") || adults !== 2) next.set("adults", String(adults));
    if (params.has("children") || children !== 0) next.set("children", String(children));
    if (params.has("rooms") || rooms !== 1) next.set("rooms", String(rooms));
    if (next.toString() === queryString) {
      fetch({ destination: search.trim() });
    } else {
      setParams(next);
    }
  };
  const visible = useMemo(() => {
    const x = [...hotels];
    if (sort === "priceLow") x.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === "priceHigh") x.sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === "rating") x.sort((a, b) => b.averageRating - a.averageRating);
    return x;
  }, [hotels, sort]);
  const handleApplyFilters = (f) => {
    setFilters({
      hotelType: f.hotelTypes?.join(",") || undefined,
      stars: f.stars?.length ? Math.min(...f.stars) : undefined,
      rating: f.rating || undefined,
      minPrice: f.minPrice || undefined,
      maxPrice: f.maxPrice || undefined,
    });
    setIsFilterOpen(false);
    setTimeout(
      () =>
        fetch({
          hotelType: f.hotelTypes?.join(",") || undefined,
          stars: f.stars?.length ? Math.min(...f.stars) : undefined,
          rating: f.rating || undefined,
          minPrice: f.minPrice || undefined,
          maxPrice: f.maxPrice || undefined,
        }),
      0,
    );
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <MapPin size={19} className="text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-400">Điểm đến</p>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Bạn muốn đi đâu?"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <CalendarDays size={19} className="shrink-0 text-blue-600" />
              <label className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-slate-400">Nhận phòng</span>
                <input type="date" value={checkIn}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCheckIn(value);
                    if (checkOut && value && checkOut <= value) setCheckOut("");
                    setDateError("");
                  }}
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
              </label>
              <div className="h-8 w-px bg-slate-200" />
              <label className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-slate-400">Trả phòng</span>
                <input type="date" value={checkOut} min={checkIn || undefined}
                  onChange={(e) => { setCheckOut(e.target.value); setDateError(""); }}
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
              </label>
            </div>
            <div className="relative shrink-0">
              <button type="button" onClick={() => setOpenGuests((v) => !v)}
                className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left hover:bg-slate-100">
                <Users size={19} className="text-blue-600" />
                <span>
                  <span className="block text-xs font-medium text-slate-400">Khách & phòng</span>
                  <span className="block text-sm font-semibold text-slate-800">{adults + children} người · {rooms} phòng</span>
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {openGuests && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  {[
                    { label: "Người lớn", value: adults, set: setAdults, min: 1 },
                    { label: "Trẻ em", value: children, set: setChildren, min: 0 },
                    { label: "Phòng", value: rooms, set: setRooms, min: 1 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label={`Giảm ${item.label}`} disabled={item.value <= item.min}
                          onClick={() => item.set((n) => Math.max(item.min, n - 1))}
                          className="rounded-full border border-slate-200 p-2 disabled:opacity-30"><Minus size={14} /></button>
                        <span className="w-5 text-center text-sm font-semibold">{item.value}</span>
                        <button type="button" aria-label={`Tăng ${item.label}`}
                          onClick={() => item.set((n) => n + 1)}
                          className="rounded-full border border-slate-200 p-2"><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setOpenGuests(false)}
                    className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Xong</button>
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg"
            >
              <Search size={18} />
              Tìm kiếm
            </button>
          </div>
        </div>
        {dateError && <p className="mx-auto max-w-7xl px-6 pb-3 text-sm text-red-600">{dateError}</p>}
      </section>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-5 text-sm text-slate-400">
          Trang chủ <span className="mx-2">/</span>
          <span className="font-medium text-slate-600">Khách sạn</span>
        </div>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Khám phá khách sạn
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {loading
                ? "Đang tìm kiếm..."
                : `${visible.length} nơi lưu trú phù hợp`}
            </p>
          </div>
          <div className="relative flex items-center gap-2">
            <span className="text-sm text-slate-500">Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-9 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="recommended">Đề xuất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="priceLow">Giá thấp</option>
              <option value="priceHigh">Giá cao</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 text-slate-400"
            />
          </div>
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
          >
            <SlidersHorizontal size={15} />
            Bộ lọc
          </button>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
            Tất cả khách sạn
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
            Có Wi-Fi
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
            Đánh giá 4+
          </span>
        </div>
        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : visible.length ? (
          <div className="space-y-5">
            {visible.map((h) => (
              <HotelCard
                key={h._id}
                searchParams={queryString}
                hotel={{
                  ...h,
                  id: h._id,
                  image:
                    h.images?.find((x) => x.isPrimary)?.url ||
                    h.images?.[0]?.url,
                  stars: h.starRating,
                  rating: h.averageRating,
                  reviews: h.reviewCount,
                  price: h.priceFrom,
                  featured: h.isFeatured,
                  roomType: h.roomType?.name,
                  amenities: h.amenities || [],
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center text-slate-500">
            Không có khách sạn phù hợp.
          </div>
        )}
      </main>
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />
      <Footer />
    </div>
  );
}
export default Hotels;
