
import { useCallback, useEffect, useState } from "react";

import {
  getManagedHotels,
  createHotel,
  updateHotel,
  deleteHotel
} from "../api/hotelApi";

import {
  getHotelTypes,
  getDestinations
} from "../api/catalogApi";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  hotelTypeId: "",
  destinationId: "",
  starRating: 3,
  city: "",
  longitude: "",
  latitude: ""
};

export default function useOwnerHotels(user) {
  // Dữ liệu khách sạn
  const [hotels, setHotels] = useState([]);
  const [hotelTypes, setHotelTypes] = useState([]);
  const [destinations, setDestinations] = useState([]);

  // Biểu mẫu thêm khách sạn
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

  // Biểu mẫu chỉnh sửa khách sạn
  const [editingHotel, setEditingHotel] = useState(null);

  // Trạng thái xử lý
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Thông báo
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Lấy danh sách khách sạn
  const loadHotels = useCallback(async () => {
    const result = await getManagedHotels();
    setHotels(result.data || []);
  }, []);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    if (user?.role !== "HOTEL_OWNER") {
      setLoading(false);
      return;
    }

    let active = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const [
          hotelsResult,
          typesResult,
          destinationsResult
        ] = await Promise.all([
          getManagedHotels(),
          getHotelTypes(),
          getDestinations()
        ]);

        if (!active) return;

        setHotels(hotelsResult.data || []);
        setHotelTypes(typesResult.data || []);
        setDestinations(destinationsResult.data || []);
        setError("");
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Không thể tải dữ liệu Hotel Owner."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [user?._id, user?.role]);

  // Cập nhật dữ liệu biểu mẫu thêm
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Thêm khách sạn mới
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const longitude = Number(form.longitude);
    const latitude = Number(form.latitude);

    if (
      !form.name.trim() ||
      !form.slug.trim() ||
      !form.hotelTypeId ||
      !form.destinationId ||
      !form.city.trim() ||
      form.longitude.trim() === "" ||
      form.latitude.trim() === "" ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      setError("Vui lòng nhập đầy đủ và đúng thông tin.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description,
      hotelTypeId: form.hotelTypeId,
      destinationId: form.destinationId,
      starRating: Number(form.starRating),
      address: {
        city: form.city.trim(),
        country: "Vietnam"
      },
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    };

    try {
      setSaving(true);

      await createHotel(payload);
      await loadHotels();

      setMessage(
        "Đã tạo khách sạn, đang chờ phê duyệt."
      );

      setForm({ ...initialForm });
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Không thể thêm khách sạn."
      );
    } finally {
      setSaving(false);
    }
  };

  // Mở biểu mẫu chỉnh sửa
  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    setShowForm(false);
    setError("");
    setMessage("");
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    if (saving) return;
    setEditingHotel(null);
  };

  // Lưu thông tin khách sạn đã chỉnh sửa
  const handleSaveEdit = async (hotelId, data) => {
    if (saving) return;

    setError("");
    setMessage("");

    try {
      setSaving(true);

      await updateHotel(hotelId, data);
      await loadHotels();

      setEditingHotel(null);
      setMessage("Đã cập nhật khách sạn thành công.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Không thể cập nhật khách sạn."
      );
    } finally {
      setSaving(false);
    }
  };

  // Xóa khách sạn
  const handleDelete = async (hotel) => {
    if (deletingId || saving) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khách sạn "${hotel.name}" không? Hành động này không thể hoàn tác.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(hotel._id);

    try {
      await deleteHotel(hotel._id);
      await loadHotels();

      if (editingHotel?._id === hotel._id) {
        setEditingHotel(null);
      }

      setMessage("Đã xóa khách sạn thành công.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Không thể xóa khách sạn."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Trả dữ liệu và hàm xử lý cho trang chính
  return {
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
  };
}
