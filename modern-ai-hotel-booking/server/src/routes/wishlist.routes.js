import express from "express";
import { addHotel, getWishlist, getWishlistIds, removeHotel } from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getWishlist);
router.get("/ids", getWishlistIds);
router.put("/:hotelId", validateObjectId("hotelId"), addHotel);
router.delete("/:hotelId", validateObjectId("hotelId"), removeHotel);

export default router;
