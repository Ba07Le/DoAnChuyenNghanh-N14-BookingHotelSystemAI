import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Users,
  Search,
  ChevronDown,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Ảnh nền theo chủ đề du lịch Việt Nam. Có thể thay URL bằng ảnh trong /public/hero/.
const HERO_SLIDES = [
  { name: "Đà Nẵng", description: "Biển xanh và nhịp sống miền Trung", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=2200&q=85" },
  { name: "Vịnh Hạ Long", description: "Kỳ quan giữa biển trời", image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2200&q=85" },
  { name: "Đà Lạt", description: "Sương mờ trên cao nguyên", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=85" },
  { name: "Phú Quốc", description: "Thiên đường biển đảo", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=85" },
  { name: "Hội An", description: "Sắc màu phố cổ", image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2200&q=85" },
  { name: "Sa Pa", description: "Núi rừng Tây Bắc", image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=85" },
  { name: "Nha Trang", description: "Nắng vàng và biển biếc", image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2200&q=85" },
  { name: "Ninh Bình", description: "Non nước hữu tình", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2200&q=85" },
];

const SLIDE_INTERVAL_MS = 5500;

function HeroSearch() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [pauseSlides, setPauseSlides] = useState(false);

  useEffect(() => {
    if (pauseSlides) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [pauseSlides]);

  const changeSlide = (direction) => {
    setActiveSlide((current) =>
      (current + direction + HERO_SLIDES.length) % HERO_SLIDES.length
    );
  };

  const [form, setForm] = useState({
    destination: "",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    rooms: 1,
  });

  const [openGuests, setOpenGuests] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateGuests = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: Math.max(field === "adults" || field === "rooms" ? 1 : 0, value),
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      window.alert("Ngày trả phòng phải sau ngày nhận phòng.");
      return;
    }

    setLoading(true);

    const params = new URLSearchParams();

    if (form.destination.trim()) {
      params.set("destination", form.destination.trim());
    }

    if (form.checkIn) {
      params.set("checkIn", form.checkIn);
    }

    if (form.checkOut) {
      params.set("checkOut", form.checkOut);
    }

    params.set("adults", form.adults);
    params.set("children", form.children);
    params.set("rooms", form.rooms);

    setTimeout(() => {
      setLoading(false);
      navigate(`/hotels?${params.toString()}`);
    }, 300);
  };

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="Khám phá du lịch Việt Nam"
      onMouseEnter={() => setPauseSlides(true)}
      onMouseLeave={() => setPauseSlides(false)}
      onFocusCapture={() => setPauseSlides(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPauseSlides(false);
      }}
    >
      {/* Các lớp ảnh chuyển mờ; không tác động đến form tìm kiếm */}
      <div className="absolute inset-0 -z-20 bg-slate-200" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.name}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url("${slide.image}")` }}
          />
        ))}
      </div>

      {/* Giữ độ tương phản cho tiêu đề và các trường tìm kiếm */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/80 to-white/15" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Tìm nơi lưu trú hoàn hảo
            <br />
            cho chuyến đi của bạn
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
            Khám phá khách sạn, resort và những trải nghiệm tuyệt vời trên khắp
            Việt Nam.
          </p>
        </div>

        {/* Search box */}
        <form
          onSubmit={handleSearch}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr_auto]">
            {/* Destination */}
            <div className="group flex min-h-[62px] items-center gap-3 rounded-xl border border-slate-200 px-4 transition-all duration-200 hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <MapPin
                size={21}
                className="shrink-0 text-slate-500 group-focus-within:text-blue-600"
              />

              <div className="min-w-0 flex-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Điểm đến
                </label>

                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      destination: e.target.value,
                    })
                  }
                  placeholder="Bạn muốn đi đâu?"
                  className="mt-1 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Check in */}
            <div className="flex min-h-[62px] items-center gap-3 rounded-xl border border-slate-200 px-4 transition-all duration-200 hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <CalendarDays size={21} className="shrink-0 text-slate-500" />

              <div className="min-w-0 flex-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày nhận phòng
                </label>

                <input
                  type="date"
                  value={form.checkIn}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      checkIn: e.target.value,
                      checkOut: form.checkOut && form.checkOut <= e.target.value ? "" : form.checkOut,
                    })
                  }
                  className="mt-1 w-full bg-transparent text-sm text-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Check out */}
            <div className="flex min-h-[62px] items-center gap-3 rounded-xl border border-slate-200 px-4 transition-all duration-200 hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <CalendarDays size={21} className="shrink-0 text-slate-500" />

              <div className="min-w-0 flex-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày trả phòng
                </label>

                <input
                  type="date"
                  value={form.checkOut}
                  min={form.checkIn || undefined}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      checkOut: e.target.value,
                    })
                  }
                  className="mt-1 w-full bg-transparent text-sm text-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenGuests(!openGuests)}
                className="flex min-h-[62px] w-full items-center gap-3 rounded-xl border border-slate-200 px-4 text-left transition-all duration-200 hover:border-blue-300"
              >
                <Users size={21} className="shrink-0 text-slate-500" />

                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-slate-700">
                    Số khách
                  </span>

                  <span className="mt-1 block truncate text-sm text-slate-600">
                    {form.adults + form.children} người, {form.rooms} phòng
                  </span>
                </div>

                <ChevronDown
                  size={17}
                  className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                    openGuests ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Guests dropdown */}
              {openGuests && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                  {/* Header */}
                  <div className="mb-2 border-b border-slate-100 pb-3">
                    <p className="text-sm font-bold text-slate-900">
                      Số khách & phòng
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Chọn số lượng khách và phòng
                    </p>
                  </div>

                  {/* Adults */}
                  <GuestCounter
                    label="Người lớn"
                    description="Từ 13 tuổi trở lên"
                    value={form.adults}
                    onMinus={() => updateGuests("adults", form.adults - 1)}
                    onPlus={() => updateGuests("adults", form.adults + 1)}
                    min={1}
                  />

                  {/* Children */}
                  <GuestCounter
                    label="Trẻ em"
                    description="Từ 0 - 12 tuổi"
                    value={form.children}
                    onMinus={() => updateGuests("children", form.children - 1)}
                    onPlus={() => updateGuests("children", form.children + 1)}
                    min={0}
                  />

                  {/* Rooms */}
                  <GuestCounter
                    label="Phòng"
                    description="Số phòng cần đặt"
                    value={form.rooms}
                    onMinus={() => updateGuests("rooms", form.rooms - 1)}
                    onPlus={() => updateGuests("rooms", form.rooms + 1)}
                    min={1}
                  />

                  {/* Done */}
                  <button
                    type="button"
                    onClick={() => setOpenGuests(false)}
                    className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                  >
                    Xong
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Search size={20} />

              {loading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
        </form>

        {/* Điều khiển slideshow đặt ngoài form, không thay đổi handleSearch */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-xl bg-white/80 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur-sm" aria-live="off">
            <span className="font-bold">{HERO_SLIDES[activeSlide].name}</span>
            <span className="ml-2 hidden text-slate-600 sm:inline">{HERO_SLIDES[activeSlide].description}</span>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-white/85 px-3 py-2 shadow-sm backdrop-blur-sm" aria-label="Điều khiển ảnh nền">
            <button type="button" onClick={() => changeSlide(-1)} aria-label="Ảnh trước" className="rounded-full p-1.5 text-slate-700 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.name}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Xem ảnh ${index + 1}: ${slide.name}`}
                  aria-current={activeSlide === index ? "true" : undefined}
                  className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${
                    activeSlide === index ? "w-6 bg-blue-600" : "w-2.5 bg-slate-400 hover:bg-slate-600"
                  }`}
                />
              ))}
            </div>
            <button type="button" onClick={() => changeSlide(1)} aria-label="Ảnh tiếp theo" className="rounded-full p-1.5 text-slate-700 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuestCounter({ label, description, value, onMinus, onPlus, min }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-b-0">
      {/* Left */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>

        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>

      {/* Counter */}
      <div className="ml-4 flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onMinus}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={14} />
        </button>

        <span className="w-5 text-center text-sm font-bold text-slate-800">
          {value}
        </span>

        <button
          type="button"
          onClick={onPlus}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default HeroSearch;
