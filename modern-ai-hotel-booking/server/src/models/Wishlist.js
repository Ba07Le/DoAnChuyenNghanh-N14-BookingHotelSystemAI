import mongoose from "mongoose";
const wishlistSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true } }, { timestamps: true, collection: "wishlists" });
wishlistSchema.index({ userId: 1, hotelId: 1 }, { unique: true });
export default mongoose.model("Wishlist", wishlistSchema);
