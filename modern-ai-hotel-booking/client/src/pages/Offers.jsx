import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Percent,
  Clock3,
  Copy,
  Check,
  TicketPercent,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { getOffers } from "../api/offerApi";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const fallbackOffers = [
  {
    _id: "demo-1",
    code: "WELCOME10",
    description: "Giảm 10% cho khách hàng mới khi đặt phòng tại HOTELAI.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    _id: "demo-2",
    code: "SUMMER20",
    description: "Ưu đãi đặc biệt cho những chuyến du lịch và nghỉ dưỡng.",
    discountType: "PERCENTAGE",
    discountValue: 20,
    startDate: "2026-06-01",
    endDate: "2026-10-31",
  },
];

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await getOffers();

        setOffers(Array.isArray(data) ? data : data?.offers || []);
      } catch (error) {
        console.error("Không thể tải ưu đãi:", error);

        // Tạm dùng dữ liệu mẫu nếu API chưa hoàn thiện
        setOffers(fallbackOffers);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);

      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode("");
      }, 2000);
    } catch (error) {
      console.error("Không thể sao chép mã:", error);
    }
  };

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
              src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2000&q=80"
              alt="Hotel offers"
              className="h-full w-full object-cover opacity-30"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-blue-900/50" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                <Sparkles size={16} />
                Ưu đãi dành cho bạn
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Ưu đãi đặc biệt
                <br />
                cho chuyến đi của bạn
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/75 md:text-lg">
                Khám phá những mã giảm giá và chương trình ưu đãi hấp dẫn từ
                HOTELAI.
              </p>
            </motion.div>
          </div>
        </section>

        {/* OFFERS */}
        <section className="mx-auto max-w-7xl px-6 py-14 md:py-16">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Tiết kiệm nhiều hơn
            </p>

            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Mã ưu đãi đang có
            </h2>

            <p className="mt-2 text-slate-500">
              Sử dụng mã ưu đãi khi đặt phòng để nhận mức giá tốt hơn.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : offers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer._id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                  }}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* TOP */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                    <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-white/10" />

                    <div className="relative flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                        <TicketPercent size={24} />
                      </div>

                      <div className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-blue-600">
                        {offer.discountType === "PERCENTAGE"
                          ? `-${offer.discountValue}%`
                          : `-${Number(offer.discountValue || 0).toLocaleString(
                              "vi-VN",
                            )}₫`}
                      </div>
                    </div>

                    <div className="relative mt-6">
                      <p className="text-xs uppercase tracking-wider text-white/70">
                        Mã ưu đãi
                      </p>

                      <h3 className="mt-1 text-2xl font-bold tracking-wide">
                        {offer.code}
                      </h3>
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-6">
                    <p className="min-h-[48px] text-sm leading-6 text-slate-500">
                      {offer.description ||
                        "Ưu đãi đặc biệt dành cho khách hàng HOTELAI."}
                    </p>

                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <CalendarDays size={17} className="text-blue-600" />

                        <span>
                          {formatDate(offer.startDate)} →{" "}
                          {formatDate(offer.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Clock3 size={17} className="text-blue-600" />

                        <span>Có thời hạn sử dụng</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(offer.code)}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98]"
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <Check size={17} />
                          Đã sao chép mã
                        </>
                      ) : (
                        <>
                          <Copy size={17} />
                          Sao chép mã ưu đãi
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <Percent size={40} className="mx-auto text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                Chưa có ưu đãi
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Hiện tại chưa có chương trình ưu đãi nào.
              </p>
            </div>
          )}
        </section>

        {/* BOTTOM INFO */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-blue-50 p-7 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Đừng bỏ lỡ ưu đãi mới
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Các chương trình mới sẽ được cập nhật thường xuyên trên
                  HOTELAI.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Percent size={22} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <Footer />
    </div>
  );
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("vi-VN");
}
