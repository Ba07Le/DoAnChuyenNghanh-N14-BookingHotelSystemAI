import mongoose from "mongoose";

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    icon: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: ["BASIC", "ROOM", "HOTEL", "FOOD", "WELLNESS", "OTHER"],
      default: "BASIC",
    },
  },
  {
    timestamps: true,
    collection: "amenities",
  },
);

const Amenity = mongoose.model("Amenity", amenitySchema);

export default Amenity;
