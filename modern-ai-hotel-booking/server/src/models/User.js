import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "HOTEL_OWNER", "ADMIN"],
      default: "CUSTOMER",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: "",
    },

    preferences: {
      language: {
        type: String,
        default: "vi",
      },

      currency: {
        type: String,
        default: "VND",
      },

      favoriteDestinations: {
        type: [String],
        default: [],
      },

      preferredRoomTypes: {
        type: [String],
        default: [],
      },

      budgetRange: {
        min: {
          type: Number,
          default: 0,
        },

        max: {
          type: Number,
          default: 0,
        },
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
