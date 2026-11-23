import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Search, Compass, Building2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getDestinations } from '../api/destinationApi';
const regions = ['Tất cả','Miền Bắc','Miền Trung','Miền Nam','Tây Nguyên'];
export default function Destinations(){
  const [items,setItems] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [search,setSearch] = useState('');
  const [region,setRegion] = useState('Tất cả');
  useEffect(()=>{let active=true;getDestinations().then(data=>{if(active)setItems(data||[])}).catch(err=>{if(active)setError(err.response?.data?.message||'Không thể tải điểm đến.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  const filtered = useMemo(()=>items.filter(x=>(region==='Tất cả'||x.region===region)&&x.name?.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))),[items,region,search]);
  return <div className="min-h-screen bg-slate-50"><Navbar/>
    <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 px-6 py-20 text-white"><div className="mx-auto max-w-7xl">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[.2em] text-blue-200">Khám phá Việt Nam</p>
      <h1 className="max-w-3xl text-4xl font-bold md:text-5xl">Mỗi điểm đến, một câu chuyện riêng</h1>
      <p className="mt-4 max-w-xl text-blue-100">Khám phá phong cảnh, văn hóa, trải nghiệm và tìm khách sạn phù hợp cho hành trình của bạn.</p>
      <label className="mt-8 flex max-w-xl items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-700"><Search size={19}/><input aria-label="Tìm điểm đến" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Bạn muốn khám phá nơi nào?" className="w-full bg-transparent outline-none"/></label>
    </div></section>
    <main className="mx-auto max-w-7xl px-6 py-14"><h2 className="text-3xl font-bold text-slate-900">Điểm đến nổi bật</h2><p className="mt-2 text-slate-500">Thông tin điểm đến được quản lý và cập nhật từ hệ thống.</p>
      <div className="my-7 flex flex-wrap gap-2">{regions.map(r=><button key={r} onClick={()=>setRegion(r)} className={`rounded-xl px-4 py-2.5 text-sm font-medium ${region===r?'bg-blue-600 text-white':'border bg-white text-slate-600 hover:bg-blue-50'}`}>{r}</button>)}</div>
      {loading?<p className="py-16 text-center text-slate-500">Đang tải điểm đến...</p>:error?<p role="alert" className="rounded-xl bg-red-50 p-6 text-red-700">{error}</p>:filtered.length===0?<p className="rounded-xl border bg-white p-12 text-center text-slate-500">Chưa có điểm đến phù hợp. Vui lòng chọn khu vực khác.</p>:
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((d,i)=><motion.article key={d._id} initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:Math.min(i*.04,.25)}} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
        <Link to={`/destinations/${encodeURIComponent(d.slug)}`} aria-label={`Khám phá ${d.name}`} className="relative block h-56 overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-950">
          {d.image?.url&&<img src={d.image.url} alt={d.name} className="h-full w-full object-cover transition duration-500 hover:scale-105"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700">{d.region||'Việt Nam'}</span>
          <h3 className="absolute bottom-4 left-4 flex items-center gap-2 text-xl font-bold text-white"><MapPin size={19}/>{d.name}</h3>
        </Link><div className="p-5"><p className="line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">{d.shortDescription||'Khám phá thông tin và lựa chọn lưu trú tại điểm đến này.'}</p>
        <div className="mt-4 flex items-center justify-between border-t pt-4"><span className="flex items-center gap-1 text-xs text-slate-500"><Building2 size={15}/>{d.hotelCount||0} khách sạn</span><Link className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800" to={`/destinations/${encodeURIComponent(d.slug)}`}>Khám phá <ArrowRight size={16}/></Link></div></div>
      </motion.article>)}</div>}
      <div className="mt-16 rounded-3xl bg-blue-50 p-8 md:p-12"><div className="flex items-center gap-3 text-blue-700"><Compass/><span className="font-semibold">Hành trình của bạn</span></div><h2 className="mt-3 text-2xl font-bold text-slate-900">Chọn điểm đến, tìm nơi ở lý tưởng</h2><p className="mt-3 text-slate-600">Khám phá phong cảnh và hoạt động địa phương, sau đó tìm khách sạn và đặt phòng phù hợp.</p><Link to="/hotels" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Tìm khách sạn <ArrowRight size={18}/></Link></div>
    </main><Footer/></div>;
}
