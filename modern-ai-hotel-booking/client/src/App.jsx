import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [searchData, setSearchData] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: "2 khách",
  });

  useEffect(() => {
    api
      .get("/health")
      .then((response) => {
        setServerStatus(response.data.message);
      })
      .catch(() => {
        setServerStatus("Server unavailable");
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    alert(
      `Đang tìm kiếm khách sạn thông minh tại: ${searchData.location || "Tất cả địa điểm"}`,
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white shadow-lg shadow-blue-500/30">
              AI
            </span>
            <span className="text-xl font-bold tracking-tight">
              Stay<span className="text-blue-500">AI</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="transition hover:text-blue-400">
              Tính năng AI
            </a>
            <a href="#hotels" className="transition hover:text-blue-400">
              Khách sạn gợi ý
            </a>
            <a href="#about" className="transition hover:text-blue-400">
              Về chúng tôi
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {/* Server Status Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${serverStatus.includes("unavailable") ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}
              ></span>
              <span className="text-slate-400">
                API: <strong className="text-slate-200">{serverStatus}</strong>
              </span>
            </div>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 shadow-lg shadow-blue-600/20">
              Đăng nhập
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] items-center justify-center pt-28 pb-16 px-6">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-blue-600/15 blur-[120px]"></div>
          <div className="absolute top-1/3 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-600/10 blur-[100px]"></div>
        </div>

        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-6 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            Nền tảng Đặt phòng Khách sạn Thông minh bằng AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Trải nghiệm kỳ nghỉ hoàn hảo với{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Trợ lý AI
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Hệ thống tự động đề xuất không gian lưu trú phù hợp nhất dựa trên sở
            thích, nhu cầu và phong cách cá nhân của bạn.
          </p>

          {/* Search Box Card */}
          <form
            onSubmit={handleSearch}
            className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md"
          >
            <div className="flex flex-col text-left px-3 py-2">
              <label className="text-xs font-semibold text-slate-400 mb-1">
                Địa điểm
              </label>
              <input
                type="text"
                placeholder="Bạn muốn đi đâu?"
                value={searchData.location}
                onChange={(e) =>
                  setSearchData({ ...searchData, location: e.target.value })
                }
                className="bg-transparent text-sm focus:outline-none text-slate-100 placeholder-slate-600"
              />
            </div>
            <div className="flex flex-col text-left px-3 py-2 border-t md:border-t-0 md:border-l border-slate-800">
              <label className="text-xs font-semibold text-slate-400 mb-1">
                Nhận phòng
              </label>
              <input
                type="date"
                value={searchData.checkIn}
                onChange={(e) =>
                  setSearchData({ ...searchData, checkIn: e.target.value })
                }
                className="bg-transparent text-sm focus:outline-none text-slate-100"
              />
            </div>
            <div className="flex flex-col text-left px-3 py-2 border-t md:border-t-0 md:border-l border-slate-800">
              <label className="text-xs font-semibold text-slate-400 mb-1">
                Trả phòng
              </label>
              <input
                type="date"
                value={searchData.checkOut}
                onChange={(e) =>
                  setSearchData({ ...searchData, checkOut: e.target.value })
                }
                className="bg-transparent text-sm focus:outline-none text-slate-100"
              />
            </div>
            <div className="flex items-center">
              <button
                type="submit"
                className="w-full h-full min-h-[48px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25"
              >
                Khám phá ngay
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Hotels Preview */}
      <section className="py-20 px-6 border-t border-slate-900 bg-slate-950/50">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Khách sạn nổi bật được AI đề xuất
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Được chọn lọc dựa trên hàng triệu đánh giá thực tế.
              </p>
            </div>
            <button className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition">
              Xem tất cả &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition hover:border-slate-700 hover:shadow-xl"
              >
                <div className="h-48 bg-slate-800 relative overflow-hidden flex items-center justify-center text-slate-600 font-medium">
                  Ảnh Khách Sạn {item}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-blue-400 transition">
                      Luxury AI Resort & Spa
                    </h3>
                    <span className="text-xs bg-blue-500/10 text-blue-400 font-semibold px-2.5 py-1 rounded-full border border-blue-500/20">
                      4.9 ⭐
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Quận 1, Thành phố Hồ Chí Minh
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-xs text-slate-500">Chỉ từ</span>
                      <p className="text-base font-bold text-blue-400">
                        1.200.000đ{" "}
                        <span className="text-xs font-normal text-slate-400">
                          / đêm
                        </span>
                      </p>
                    </div>
                    <button className="rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-semibold transition hover:bg-blue-600 hover:text-white">
                      Đặt phòng
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 BookingHotelSystemAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
