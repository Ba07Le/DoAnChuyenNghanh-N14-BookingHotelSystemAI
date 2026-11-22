import User from "../../models/User.js";
import Booking from "../../models/Booking.js";
import Hotel from "../../models/Hotel.js";

import { httpError } from "../../utils/httpError.js";
import { logAudit } from "../audit.service.js";

// =====================================
// HELPERS
// =====================================

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SAFE_FIELDS = "-passwordHash -tokenVersion";

// =====================================
// LIST USERS
// =====================================

export const listUsers = async ({ page, limit, search, role, status }) => {
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;

  if (search) {
    const rx = new RegExp(esc(search), "i");

    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(SAFE_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  const counts = await Booking.aggregate([
    {
      $match: {
        userId: {
          $in: items.map((u) => u._id),
        },
      },
    },
    {
      $group: {
        _id: "$userId",
        n: { $sum: 1 },
      },
    },
  ]);

  const map = new Map(counts.map((c) => [String(c._id), c.n]));

  return {
    items: items.map((u) => ({
      ...u,
      bookingCount: map.get(String(u._id)) || 0,
    })),
    total,
  };
};

// =====================================
// USER DETAIL
// =====================================

export const getUser = async (id) => {
  const user = await User.findById(id).select(SAFE_FIELDS).lean();

  if (!user) {
    throw httpError(404, "Không tìm thấy người dùng.");
  }

  const [agg, recentBookings, hotelCount] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          userId: user._id,
        },
      },
      {
        $group: {
          _id: null,
          bookingCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$paymentStatus", "PAID"],
                    },
                    {
                      $ne: ["$status", "CANCELLED"],
                    },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
    ]),

    Booking.find({
      userId: user._id,
    })
      .populate("hotelId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("bookingCode hotelId status paymentStatus totalAmount createdAt")
      .lean(),

    user.role === "HOTEL_OWNER"
      ? Hotel.countDocuments({
          ownerId: user._id,
        })
      : Promise.resolve(0),
  ]);

  return {
    ...user,
    stats: {
      bookingCount: agg[0]?.bookingCount || 0,
      totalSpent: agg[0]?.totalSpent || 0,
      hotelCount,
    },
    recentBookings,
  };
};

// =====================================
// LOAD TARGET USER
// =====================================

const loadTarget = async (ctx, id) => {
  const user = await User.findById(id).select(SAFE_FIELDS).lean();

  if (!user) {
    throw httpError(404, "Không tìm thấy người dùng.");
  }

  if (String(user._id) === String(ctx.actorId)) {
    throw httpError(400, "Bạn không thể thay đổi tài khoản của chính mình.");
  }

  if (user.role === "ADMIN") {
    throw httpError(403, "Không thể thay đổi tài khoản admin khác.");
  }

  return user;
};

// =====================================
// UPDATE USER STATUS
// =====================================

export const setUserStatus = async (ctx, id, { status, reason }) => {
  const user = await loadTarget(ctx, id);

  if (user.status === status) {
    throw httpError(400, "Tài khoản đã ở trạng thái này.");
  }

  const updated = await User.findOneAndUpdate(
    {
      _id: id,
      role: user.role,
      status: user.status,
      role: { $ne: "ADMIN" },
    },
    {
      $set: { status },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select(SAFE_FIELDS)
    .lean();

  if (!updated) {
    throw httpError(409, "Tài khoản đã thay đổi. Vui lòng tải lại dữ liệu.");
  }

  await logAudit(ctx, {
    action:
      status === "BLOCKED"
        ? "USER_BLOCKED"
        : status === "ACTIVE"
          ? "USER_ACTIVATED"
          : "USER_DEACTIVATED",

    entity: "User",
    entityId: id,

    metadata: {
      before: user.status,
      after: status,
      reason: reason || "",
      email: user.email,
    },
  });

  return updated;
};

// =====================================
// UPDATE USER ROLE
// =====================================

export const setUserRole = async (ctx, id, { role }) => {
  const user = await loadTarget(ctx, id);

  if (user.role === role) {
    throw httpError(400, "Người dùng đã có vai trò này.");
  }

  const updated = await User.findOneAndUpdate(
    {
      _id: id,
      role: user.role,
      status: user.status,
      role: { $ne: "ADMIN" },
    },
    {
      $set: { role },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select(SAFE_FIELDS)
    .lean();

  if (!updated) {
    throw httpError(409, "Tài khoản đã thay đổi. Vui lòng tải lại dữ liệu.");
  }

  await logAudit(ctx, {
    action: "USER_ROLE_CHANGED",
    entity: "User",
    entityId: id,

    metadata: {
      before: user.role,
      after: role,
      email: user.email,
    },
  });

  return updated;
};
