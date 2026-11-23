import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "../src/models/Hotel.js";
import RoomType from "../src/models/RoomType.js";
import Room from "../src/models/Room.js";
import Destination from "../src/models/Destination.js";
import HotelType from "../src/models/HotelType.js";

// usage: node scripts/checkHotels.js [slug]
const API = process.env.API_URL || "http://localhost:5001";
const SLUG = process.argv[2] || "hoi-an-rice-field-retreat";

await mongoose.connect(process.env.MONGODB_URI);
console.log("database:", mongoose.connection.name);
console.log("approved hotels:", await Hotel.countDocuments({ status: "APPROVED" }));

const h = await Hotel.findOne({ slug: SLUG }).lean();
if (!h) {
  console.log(`"${SLUG}" is NOT in this database -> the seed did not run against this database`);
} else {
  console.log("hotel:", h.name, "| status:", h.status);
  console.log("destination exists:", !!(await Destination.exists({ _id: h.destinationId })));
  console.log("hotelType exists:", !!(await HotelType.exists({ _id: h.hotelTypeId })));
  console.log(
    "room types:", await RoomType.countDocuments({ hotelId: h._id }),
    "| rooms:", await Room.countDocuments({ hotelId: h._id }),
  );
}

for (const path of [`/api/hotels/slug/${SLUG}`, "/api/hotels", "/api/hotels/search"]) {
  try {
    const res = await fetch(API + path);
    const body = await res.json().catch(() => null);
    const list = Array.isArray(body) ? body : body?.data;
    console.log(path, "->", res.status, Array.isArray(list) ? `${list.length} items` : JSON.stringify(body)?.slice(0, 200));
  } catch (e) {
    console.log(path, "-> request failed:", e.message);
  }
}

await mongoose.disconnect();
