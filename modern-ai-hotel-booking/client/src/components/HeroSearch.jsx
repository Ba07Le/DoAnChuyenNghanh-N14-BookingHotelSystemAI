import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Users,
  Search,
  ChevronDown,
  Minus,
  Plus,
} from "lucide-react";

function HeroSearch() {
  const navigate = useNavigate();

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
    <section className="relative">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1623048192713-ad4c69866d91?auto=format&fit=crop&w=2200&q=85')",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/10" />

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
