import api from "./apiClient";

export const getWishlist = async () => (await api.get("/wishlist")).data;

export const getWishlistIds = async () => (await api.get("/wishlist/ids")).data;

export const addToWishlist = async (hotelId) => (await api.put(`/wishlist/${hotelId}`)).data;

export const removeFromWishlist = async (hotelId) => (await api.delete(`/wishlist/${hotelId}`)).data;
