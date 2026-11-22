import api from "./apiClient";

export const getMyReviews = async () => (await api.get("/reviews/mine")).data;

export const getHotelReviews = async (hotelId, params) =>
  (await api.get(`/reviews/hotel/${hotelId}`, { params })).data;

export const createReview = async (payload) => (await api.post("/reviews", payload)).data;

export const uploadReviewImages = async (images) =>
  (await api.post("/reviews/upload", { images })).data;

export const updateReview = async (id, payload) => (await api.patch(`/reviews/${id}`, payload)).data;

export const deleteReview = async (id) => (await api.delete(`/reviews/${id}`)).data;
