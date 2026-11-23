import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "../src/models/Hotel.js";
import { embed } from "../src/services/embedding.js";

await mongoose.connect(process.env.MONGODB_URI);
console.log("host:", mongoose.connection.host, "| database:", mongoose.connection.name);

const total = await Hotel.countDocuments();
const approved = await Hotel.countDocuments({ status: "APPROVED" });
const withVector = await Hotel.countDocuments({ status: "APPROVED", embedding: { $type: "array" } });
const correctSize = await Hotel.countDocuments({ status: "APPROVED", embedding: { $size: 1536 } });
console.log({ total, approved, withVector, correctSize });

try {
  const indexes = await Hotel.aggregate([{ $listSearchIndexes: {} }]);
  if (!indexes.length) console.log("NO search indexes on this collection");
  for (const i of indexes) {
    console.log("index:", i.name, "| type:", i.type, "| status:", i.status, "| queryable:", i.queryable);
  }
} catch (e) {
  console.log("could not list indexes:", e.message);
}

try {
  const found = await Hotel.aggregate([
    {
      $vectorSearch: {
        index: "hotel_vector_index",
        path: "embedding",
        queryVector: await embed("khách sạn gần biển"),
        numCandidates: 100,
        limit: 30,
      },
    },
    { $project: { name: 1, _id: 0 } },
  ]);
  console.log("vector search returns", found.length, "hotels:", found.map((h) => h.name).join(", "));
} catch (e) {
  console.log("vector search failed:", e.message);
}

await mongoose.disconnect();
