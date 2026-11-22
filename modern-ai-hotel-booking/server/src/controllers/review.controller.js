import * as reviewService from "../services/review.service.js";

// Controller chỉ nhận request và trả response; nghiệp vụ nằm trong services/review.service.js

export const getHotelReviews = async (req, res) => {
  const { items, summary, pagination } = await reviewService.listHotelReviews(req.params.hotelId, req.query);

  res.json({ success: true, data: items, summary, pagination });
};

export const getMyReviews = async (req, res) => {
  const data = await reviewService.listMyReviews(req.user._id);

  res.json({ success: true, data });
};

export const createReview = async (req, res) => {
  const data = await reviewService.createReview(req.user._id, req.body);

  res.status(201).json({ success: true, message: "Cảm ơn bạn đã đánh giá!", data });
};

export const uploadReviewImages = async (req, res) => {
  const rawImages = Array.isArray(req.body.images) ? req.body.images : req.body.image ? [req.body.image] : [];
  if (!rawImages.length) {
    return res.status(400).json({ success: false, message: "Không có ảnh nào được gửi lên." });
  }

  const urls = await reviewService.saveBase64Images(rawImages);
  res.json({ success: true, urls });
};

export const updateReview = async (req, res) => {
  const data = await reviewService.updateReview(req.user._id, req.params.id, req.body);

  res.json({ success: true, message: "Đã cập nhật đánh giá.", data });
};

export const deleteReview = async (req, res) => {
  await reviewService.deleteReview(req.user._id, req.params.id);

  res.json({ success: true, message: "Đã xoá đánh giá." });
};
