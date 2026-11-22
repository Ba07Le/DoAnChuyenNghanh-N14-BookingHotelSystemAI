import mongoose from "mongoose";

// Mỗi bản ghi tương ứng một khách sạn
// được một người dùng thêm vào danh sách yêu thích.
const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "wishlists",
  },
);

// Không cho phép một người lưu trùng một khách sạn
wishlistSchema.index({ userId: 1, hotelId: 1 }, { unique: true });

// Hỗ trợ truy vấn wishlist của người dùng,
// sắp xếp theo thời gian lưu mới nhất
wishlistSchema.index({
  userId: 1,
  createdAt: -1,
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
