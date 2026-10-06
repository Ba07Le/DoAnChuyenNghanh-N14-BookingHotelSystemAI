import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Search,
  ArrowRight,
  Building2,
  Waves,
  Mountain,
  Landmark,
  Palmtree,
  Sparkles,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const destinations = [
  {
    id: 1,
    city: "Đà Nẵng",
    region: "Miền Trung",
    description:
      "Thành phố biển hiện đại với những bãi biển tuyệt đẹp, ẩm thực hấp dẫn và nhiều khu nghỉ dưỡng.",
    hotels: 128,
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
    icon: Waves,
  },
  {
    id: 2,
    city: "Đà Lạt",
    region: "Tây Nguyên",
    description:
      "Thành phố ngàn hoa với khí hậu mát mẻ, thiên nhiên lãng mạn và những homestay độc đáo.",
    hotels: 96,
    image:
      "https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1200&q=80",
    icon: Mountain,
  },
  {
    id: 3,
    city: "Nha Trang",
    region: "Miền Trung",
    description:
      "Điểm đến biển nổi tiếng với những bãi cát dài, làn nước trong xanh và các khu nghỉ dưỡng.",
    hotels: 114,
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
    icon: Waves,
  },
  {
    id: 4,
    city: "Phú Quốc",
    region: "Miền Nam",
    description:
      "Đảo ngọc với biển xanh, thiên nhiên tuyệt đẹp và những khu nghỉ dưỡng cao cấp.",
    hotels: 87,
    image:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80",
    icon: Palmtree,
  },
  {
    id: 5,
    city: "Hà Nội",
    region: "Miền Bắc",
    description:
      "Thủ đô nghìn năm văn hiến với phố cổ, ẩm thực đặc sắc và những giá trị văn hóa lâu đời.",
    hotels: 142,
    image:
      "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
    icon: Landmark,
  },
  {
    id: 6,
    city: "TP. Hồ Chí Minh",
    region: "Miền Nam",
    description:
      "Đô thị năng động với nhịp sống sôi động, ẩm thực phong phú và nhiều trải nghiệm thành phố.",
    hotels: 186,
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
    icon: Building2,
  },
  {
    id: 7,
    city: "Hội An",
    region: "Miền Trung",
    description:
      "Phố cổ quyến rũ với kiến trúc lịch sử, đèn lồng đầy màu sắc và không gian văn hóa đặc trưng.",
    hotels: 73,
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
    icon: Landmark,
  },
  {
    id: 8,
    city: "Hạ Long",
    region: "Miền Bắc",
    description:
      "Nổi bật với vịnh biển tuyệt đẹp, những đảo đá vôi và các hành trình nghỉ dưỡng trên biển.",
    hotels: 69,
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
    icon: Mountain,
  },
];

const regions = ["Tất cả", "Miền Bắc", "Miền Trung", "Miền Nam", "Tây Nguyên"];

export default function Destinations() {
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState("Tất cả");

  const filteredDestinations = destinations.filter((destination) => {
    const matchSearch = destination.city
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchRegion =
      activeRegion === "Tất cả" || destination.region === activeRegion;

    return matchSearch && matchRegion;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================= NAVBAR ================= */}
      <Navbar />

      {/* ================= MAIN ================= */}
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2200&q=85"
              alt="Vietnam destinations"
              className="h-full w-full object-cover opacity-35"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/75 to-blue-900/40" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                <Sparkles size={16} />
                Khám phá Việt Nam
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Khám phá những
                <br />
                điểm đến tuyệt vời
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 md:text-lg">
                Tìm cảm hứng cho chuyến đi tiếp theo và khám phá những nơi lưu
                trú tuyệt vời cùng HOTELAI.
              </p>

              {/* SEARCH */}
              <div className="mt-8 flex max-w-xl items-center rounded-2xl border border-white/20 bg-white/95 p-2 shadow-xl backdrop-blur-md">
                <Search size={20} className="ml-3 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Bạn muốn đi đâu?"
                  className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* DESTINATIONS */}
        <section className="mx-auto max-w-7xl px-6 py-14 md:py-16">
          {/* HEADER */}
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Đi đâu hôm nay?
            </p>

            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Điểm đến nổi bật
            </h2>

            <p className="mt-2 text-slate-500">
              Khám phá những điểm đến được nhiều du khách lựa chọn
            </p>
          </div>

          {/* REGION FILTER */}
          <div className="mb-8 flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setActiveRegion(region)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeRegion === region
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* CARDS */}
          {filteredDestinations.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDestinations.map((destination, index) => {
                const Icon = destination.icon;

                return (
                  <motion.div
                    key={destination.id}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.06,
                    }}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* IMAGE */}
                    <div className="relative h-60 overflow-hidden">
                      <img
                        src={destination.image}
                        alt={destination.city}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* REGION */}
                      <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
                        {destination.region}
                      </div>

                      {/* CITY */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center gap-2">
                          <MapPin size={17} />

                          <h3 className="text-xl font-bold">
                            {destination.city}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-5">
                      <p className="line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-500">
                        {destination.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Icon size={18} />
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">Lưu trú</p>

                            <p className="text-sm font-semibold text-slate-700">
                              {destination.hotels} khách sạn
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                        >
                          Khám phá
                          <ArrowRight
                            size={16}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <MapPin size={40} className="mx-auto text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                Không tìm thấy điểm đến
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Hãy thử tìm kiếm với tên thành phố khác.
              </p>
            </div>
          )}
        </section>

        {/* INSPIRATION */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Hành trình của bạn
                </p>

                <h2 className="text-3xl font-bold text-slate-900">
                  Mỗi điểm đến,
                  <br />
                  một trải nghiệm riêng
                </h2>

                <p className="mt-4 max-w-xl leading-7 text-slate-500">
                  Từ những thành phố biển đầy nắng đến những vùng núi yên bình,
                  HOTELAI giúp bạn dễ dàng tìm nơi lưu trú phù hợp cho từng hành
                  trình.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-2xl font-bold text-blue-600">50+</p>

                    <p className="mt-1 text-sm text-slate-500">Điểm đến</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-2xl font-bold text-blue-600">1000+</p>

                    <p className="mt-1 text-sm text-slate-500">Nơi lưu trú</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=85"
                  alt="Vietnam travel"
                  className="h-[360px] w-full object-cover transition duration-700 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-sm text-white/75">Khám phá Việt Nam</p>

                  <p className="mt-1 text-2xl font-bold">
                    Bắt đầu hành trình của bạn
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <Footer />
    </div>
  );
}
