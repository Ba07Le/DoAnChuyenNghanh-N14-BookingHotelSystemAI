import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Compass,
  MapPin,
  Utensils,
  Lightbulb,
  Building2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getDestination } from "../api/destinationApi";
const Section = ({ title, icon: Icon, content }) =>
  content?.trim() ? (
    <section className="sy-dest-detail-section rounded-2xl border bg-white p-6">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-slate-900">
        <Icon size={21} className="text-blue-600" />
        {title}
      </h2>
      <p className="whitespace-pre-line leading-8 text-slate-600">{content}</p>
    </section>
  ) : null;
export default function DestinationDetails() {
  const { slug } = useParams();
  const [destination, setDestination] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getDestination(slug)
      .then((d) => {
        if (active) setDestination(d);
      })
      .catch((err) => {
        if (active)
          setError(
            err.response?.data?.message || "Không thể tải nội dung điểm đến.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  const d = destination;
  return (
    <div className="sy-dest-page sy-dest-detail min-h-screen">
      <Navbar />
      {loading ? (
        <main className="mx-auto max-w-6xl px-6 py-24 text-center text-slate-500">
          Đang tải thông tin...
        </main>
      ) : error ? (
        <main className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-red-600">{error}</p>
          <Link to="/destinations" className="mt-4 inline-block text-blue-600">
            Quay lại điểm đến
          </Link>
        </main>
      ) : (
        d && (
          <>
            <header className="sy-dest-detail-hero relative flex items-end overflow-hidden text-white">
              {d.image?.url && (
                <img
                  className="absolute inset-0 h-full w-full object-cover"
                  src={d.image.url}
                  alt={d.name}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20" />
              <div className="relative sy-dest-width sy-dest-detail-copy">
                <Link
                  to="/destinations"
                  className="mb-5 inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
                >
                  <ArrowLeft size={16} />
                  Tất cả điểm đến
                </Link>
                <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-blue-100">
                  <MapPin size={17} />
                  {d.region || "Việt Nam"} · {d.country || "Việt Nam"}
                </p>
                <h1 className="mt-3 text-4xl font-bold md:text-6xl">
                  {d.name}
                </h1>
                <p className="mt-4 max-w-3xl text-lg text-slate-100">
                  {d.shortDescription}
                </p>
              </div>
            </header>
            <main className="sy-dest-width sy-dest-detail-grid">
              <div className="space-y-6">
                <p className="sy-dest-kicker">
                  TRAVEL GUIDE · CẨM NANG DU LỊCH
                </p>
                <section className="sy-dest-detail-section rounded-2xl border bg-white p-7">
                  <h2 className="mb-4 text-2xl font-bold text-slate-900">
                    Khám phá {d.name}
                  </h2>
                  <p className="whitespace-pre-line leading-8 text-slate-600">
                    {d.description ||
                      d.shortDescription ||
                      "Nội dung giới thiệu đang được cập nhật."}
                  </p>
                </section>
                <Section
                  title="Cảnh đẹp & địa danh nổi bật"
                  icon={MapPin}
                  content={d.highlights}
                />
                <Section
                  title="Hoạt động & trải nghiệm"
                  icon={Compass}
                  content={d.activities}
                />
                <Section
                  title="Ẩm thực địa phương"
                  icon={Utensils}
                  content={d.cuisine}
                />
                <Section
                  title="Thời điểm nên ghé thăm"
                  icon={CalendarDays}
                  content={d.bestTime}
                />
                <Section
                  title="Mẹo du lịch"
                  icon={Lightbulb}
                  content={d.travelTips}
                />
                {d.gallery?.length > 0 && (
                  <section className="sy-dest-detail-section rounded-2xl border bg-white p-6">
                    <h2 className="mb-4 text-xl font-bold">
                      Hình ảnh điểm đến
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {d.gallery.map((url, i) => (
                        <img
                          key={`${url}-${i}`}
                          src={url}
                          alt={`${d.name} - ${i + 1}`}
                          className="sy-dest-gallery-image h-56 w-full rounded-xl object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <aside className="sy-dest-detail-aside">
                <div className="sy-dest-detail-section rounded-2xl border bg-white p-6">
                  <p className="text-sm font-medium text-blue-600">
                    Lưu trú tại {d.name}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
                    <Building2 size={22} />
                    {d.hotelCount || 0} khách sạn
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Tìm các khách sạn được duyệt và lựa chọn phòng, ngày nhận
                    phòng, số khách trước khi đặt.
                  </p>
                  <Link
                    className="sy-dest-primary mt-5 w-full"
                    to={`/hotels?destinationId=${encodeURIComponent(d._id)}&destination=${encodeURIComponent(d.name)}`}
                  >
                    Tìm khách sạn <ArrowRight size={17} />
                  </Link>
                  <p className="mt-3 text-xs text-slate-500">
                    Đặt phòng tại trang khách sạn sau khi chọn nơi lưu trú và
                    loại phòng.
                  </p>
                </div>
              </aside>
            </main>
          </>
        )
      )}
      <Footer />
    </div>
  );
}
