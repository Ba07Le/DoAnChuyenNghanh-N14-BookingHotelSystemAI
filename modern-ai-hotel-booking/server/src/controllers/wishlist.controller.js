import * as wishlistService from "../services/wishlist.service.js";

// Controller chỉ nhận request và trả response; nghiệp vụ nằm trong services/wishlist.service.js

export const getWishlist = async (req, res) => {
  const data = await wishlistService.listWishlist(req.user._id);

  res.json({ success: true, data });
};

export const getWishlistIds = async (req, res) => {
  const ids = await wishlistService.listWishlistIds(req.user._id);

  res.json({ success: true, ids });
};

export const addHotel = async (req, res) => {
  await wishlistService.addToWishlist(req.user._id, req.params.hotelId);

  res.json({ success: true, liked: true });
};

export const removeHotel = async (req, res) => {
  await wishlistService.removeFromWishlist(req.user._id, req.params.hotelId);

  res.json({ success: true, liked: false });
};
