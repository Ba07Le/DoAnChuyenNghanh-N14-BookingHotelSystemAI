import express from "express";
import {
  createReview,
  deleteReview,
  getHotelReviews,
  getMyReviews,
  updateReview,
  uploadReviewImages,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";
import { reviewLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { createReviewSchema, updateReviewSchema } from "../utils/reviewValidators.js";

const router = express.Router();

// Công khai: ai cũng xem được đánh giá của một khách sạn
router.get("/hotel/:hotelId", validateObjectId("hotelId"), getHotelReviews);

// Các thao tác còn lại cần đăng nhập
router.use(authenticate);

router.get("/mine", getMyReviews);
router.post("/upload", uploadReviewImages);
router.post("/", reviewLimiter, validate(createReviewSchema), createReview);
router.patch("/:id", validateObjectId("id"), validate(updateReviewSchema), updateReview);
router.delete("/:id", validateObjectId("id"), deleteReview);

export default router;
