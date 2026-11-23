import mongoose from 'mongoose';
import Destination from '../models/Destination.js';
import Hotel from '../models/Hotel.js';

const slugify = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fields = ['name','slug','region','country','shortDescription','description','highlights','activities','cuisine','travelTips','bestTime','featured','status','sortOrder','image','gallery'];
const cleanText = (v, max = 10000) => String(v ?? '').trim().slice(0, max);
const cleanUrls = (values) => Array.isArray(values) ? values.filter(x => typeof x === 'string' && /^https?:\/\//i.test(x)).slice(0, 12) : [];
function payload(body = {}) {
  const out = {};
  for (const key of fields) if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  for (const key of ['name','slug','region','country','shortDescription','description','highlights','activities','cuisine','travelTips','bestTime']) if (key in out) out[key] = cleanText(out[key], key === 'description' ? 10000 : 2000);
  if ('slug' in out) out.slug = slugify(out.slug);
  if ('gallery' in out) out.gallery = cleanUrls(out.gallery);
  if ('image' in out) out.image = { url: /^https?:\/\//i.test(out.image?.url || '') ? out.image.url : '', publicId: '' };
  if ('featured' in out) out.featured = out.featured === true;
  if ('sortOrder' in out) out.sortOrder = Number.isFinite(Number(out.sortOrder)) ? Number(out.sortOrder) : 0;
  return out;
}
const message = (res, code, msg) => res.status(code).json({success:false,message:msg});
const wrap = fn => async (req,res,next) => { try { await fn(req,res); } catch(err) { if(err?.code === 11000) return message(res,409,'Slug điểm đến đã tồn tại.'); if(err?.name === 'ValidationError' || err?.name === 'CastError') return message(res,400,err.message); next(err); }};
async function withCounts(items) {
  const ids = items.map(d => d._id);
  if (!ids.length) return [];
  const counts = await Hotel.aggregate([{$match:{destinationId:{$in:ids},status:'APPROVED'}},{$group:{_id:'$destinationId',count:{$sum:1}}}]);
  const map = new Map(counts.map(c=>[String(c._id),c.count]));
  return items.map(d=>({...d,hotelCount:map.get(String(d._id)) || 0}));
}
export const list = wrap(async(req,res)=>{
  const filter = {status:'ACTIVE'};
  if(req.query.region) filter.region = req.query.region;
  const items = await Destination.find(filter).sort({featured:-1,sortOrder:1,name:1}).lean();
  res.json({success:true,data:await withCounts(items)});
});
export const detail = wrap(async(req,res)=>{
  const item = await Destination.findOne({slug:req.params.slug,status:'ACTIVE'}).lean();
  if(!item) return message(res,404,'Điểm đến không tồn tại hoặc đang ẩn.');
  res.json({success:true,data:(await withCounts([item]))[0]});
});
export const adminList = wrap(async(req,res)=>{
  const items = await Destination.find({}).sort({sortOrder:1,name:1}).lean();
  res.json({success:true,data:await withCounts(items)});
});
export const create = wrap(async(req,res)=>{
  const data = payload(req.body);
  if(!data.name) return message(res,400,'Vui lòng nhập tên điểm đến.');
  data.slug = slugify(data.slug || data.name);
  if(!data.slug) return message(res,400,'Slug không hợp lệ.');
  const item = await Destination.create(data);
  res.status(201).json({success:true,data:item});
});
export const update = wrap(async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id)) return message(res,400,'ID không hợp lệ.');
  const data = payload(req.body);
  if('name' in data && !data.name) return message(res,400,'Tên không được trống.');
  if('slug' in data && !data.slug) return message(res,400,'Slug không hợp lệ.');
  const item = await Destination.findByIdAndUpdate(req.params.id,{$set:data},{new:true,runValidators:true});
  if(!item) return message(res,404,'Không tìm thấy điểm đến.');
  res.json({success:true,data:item});
});
export const remove = wrap(async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id)) return message(res,400,'ID không hợp lệ.');
  const item = await Destination.findById(req.params.id);
  if(!item) return message(res,404,'Không tìm thấy điểm đến.');
  const linked = await Hotel.countDocuments({destinationId:item._id});
  if(linked) return message(res,409,`Điểm đến có ${linked} khách sạn liên kết. Hãy chuyển sang INACTIVE thay vì xóa.`);
  await item.deleteOne();
  res.json({success:true,message:'Đã xóa điểm đến.'});
});
