
import { useAuth } from "../context/AuthContext";

// Hook xử lý dữ liệu Hotel Owner
import useOwnerHotels from "../hooks/useOwnerHotels";

// Các component giao diện Hotel Owner
import OwnerHotelList from "../components/hotelOwner/OwnerHotelList";
import OwnerHotelForm from "../components/hotelOwner/OwnerHotelForm";
import OwnerHotelEditForm from "../components/hotelOwner/OwnerHotelEditForm";

export default function HotelOwner() {
  const { user } = useAuth();

  // Lấy dữ liệu và hàm xử lý từ hook
  const {
    hotels,
    hotelTypes,
    destinations,
    form,
    showForm,
    setShowForm,
    editingHotel,
    loading,
    saving,
    deletingId,
    error,
    setError,
    message,
    setMessage,
    handleChange,
    handleSubmit,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDelete
  } = useOwnerHotels(user);

  // Kiểm tra quyền truy cập
  if (user?.role !== "HOTEL_OWNER") {
    return (
      <div className="p-10 text-center">
        Bạn không có quyền truy cập Hotel Owner.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Tiêu đề trang */}
        <h1 className="text-3xl font-bold">
          Hotel Owner Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Xin chào, {user.fullName}
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">

          {/* Thanh điều khiển */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold">
              Khách sạn của tôi
            </h2>

            <button
              type="button"
              onClick={() => {
                setShowForm((previous) => !previous);
                handleCancelEdit();
                setError("");
                setMessage("");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              {showForm ? "Đóng" : "+ Thêm khách sạn"}
            </button>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <p className="mt-4 text-red-600">
              {error}
            </p>
          )}

          {/* Thông báo thành công */}
          {message && (
            <p className="mt-4 text-green-600">
              {message}
            </p>
          )}

          {/* Biểu mẫu thêm khách sạn */}
          {showForm && (
            <OwnerHotelForm
              form={form}
              hotelTypes={hotelTypes}
              destinations={destinations}
              saving={saving}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          )}

          {/* Biểu mẫu chỉnh sửa khách sạn */}
          {editingHotel && (
            <OwnerHotelEditForm
              key={editingHotel._id}
              hotel={editingHotel}
              saving={saving}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          )}

          {/* Danh sách khách sạn */}
          <OwnerHotelList
            hotels={hotels}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Trạng thái xóa */}
          {deletingId && (
            <p className="mt-3 text-sm text-slate-500">
              Đang xử lý yêu cầu xóa...
            </p>
          )}

        </div>
      </div>
    </main>
  );
}
