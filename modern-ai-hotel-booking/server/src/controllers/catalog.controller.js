import Amenity from "../models/Amenity.js";
import RoomType from "../models/RoomType.js";
import HotelType from "../models/HotelType.js"; import Destination from "../models/Destination.js"; import Coupon from "../models/Coupon.js";
export const getHotelTypes=async(req,res)=>{const data=await HotelType.find({status:"ACTIVE"}).sort({sortOrder:1,name:1}).lean(); res.json({success:true,data});};
export const getDestinations=async(req,res)=>{const data=await Destination.find({status:"ACTIVE"}).sort({featured:-1,sortOrder:1,name:1}).lean(); res.json({success:true,data:data.map(d=>({...d,city:d.name,image:d.image?.url||""}))});};
export const getOffers=async(req,res)=>{const now=new Date(); const data=await Coupon.find({status:"ACTIVE",startDate:{$lte:now},endDate:{$gte:now}}).sort({featured:-1,discountValue:-1}).lean(); res.json({success:true,data});};
export const adminUpsertHotelType=async(req,res)=>{const {id}=req.params; const data=await HotelType.findOneAndUpdate(id?{_id:id}:{slug:req.body.slug},{...req.body},{new:true,upsert:!id,runValidators:true,setDefaultsOnInsert:true}); res.json({success:true,data});};
export const adminUpsertDestination=async(req,res)=>{const {id}=req.params; const data=await Destination.findOneAndUpdate(id?{_id:id}:{slug:req.body.slug},{...req.body},{new:true,upsert:!id,runValidators:true,setDefaultsOnInsert:true}); res.json({success:true,data});};


// Nguồn dữ liệu duy nhất cho các lựa chọn FilterDrawer.
// Không cache phía server để dữ liệu mới từ Admin/Owner xuất hiện khi mở bộ lọc.
export const getFilterOptions = async (_req, res, next) => {
  try {
    const [destinations, hotelTypes, amenities, bedTypes] = await Promise.all([
      Destination.find({ status: "ACTIVE" }).select("name slug region").sort({ sortOrder: 1, name: 1 }).lean(),
      HotelType.find({ status: "ACTIVE" }).select("name slug").sort({ sortOrder: 1, name: 1 }).lean(),
      Amenity.find({}).select("name slug icon category").sort({ category: 1, name: 1 }).lean(),
      RoomType.distinct("bedType", { status: "ACTIVE" }),
    ]);
    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: {
        destinations: destinations.map((d) => ({ value: String(d._id), label: d.name, id: String(d._id), slug: d.slug })),
        hotelTypes: hotelTypes.map((t) => ({ value: String(t._id), label: t.name, slug: t.slug })),
        amenities: amenities.map((a) => ({ value: a.slug, label: a.name, category: a.category, icon: a.icon })),
        bedTypes: bedTypes.filter((x) => typeof x === "string" && x.trim()).sort((a, b) => a.localeCompare(b, "vi")).map((x) => ({ value: x, label: x })),
      },
    });
  } catch (error) { next(error); }
};
