import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MapPin, Search, Compass, Building2, X, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getDestinations } from '../api/destinationApi';

const regions = ['Tất cả','Miền Bắc','Miền Trung','Miền Nam','Tây Nguyên'];
const normalize = value => String(value ?? '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
export default function Destinations(){
  const [items,setItems] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [search,setSearch] = useState('');
  const [region,setRegion] = useState('Tất cả');
  const [retry,setRetry] = useState(0);
  useEffect(()=>{let active=true;setLoading(true);setError('');getDestinations().then(data=>{if(active)setItems(data||[])}).catch(err=>{if(active)setError(err.response?.data?.message||'Không thể tải điểm đến.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[retry]);
  const filtered = useMemo(()=>items.filter(x=>(region==='Tất cả'||x.region===region)&&normalize(x.name).includes(normalize(search.trim()))),[items,region,search]);
  const heroImage=items.find(d=>d.image?.url)?.image?.url;
  const reset=()=>{setSearch('');setRegion('Tất cả')};
  return <div className="sy-dest-page min-h-screen"><Navbar/>
    <header className="sy-dest-hero">
      {heroImage&&<img src={heroImage} alt="" className="sy-dest-hero-photo" onError={e=>{e.currentTarget.hidden=true}}/>}
      <div className="sy-dest-width sy-dest-hero-copy">
        <div className="sy-dest-crumb"><Link to="/">Trang chủ</Link><span>/</span><span>Điểm đến</span></div>
        <p className="sy-dest-kicker">DISCOVER VIETNAM · THE ART OF TRAVEL</p>
        <h1>Mỗi vùng đất,<br/><em>một câu chuyện riêng.</em></h1>
        <p>Khám phá phong cảnh, văn hóa và những trải nghiệm đáng nhớ. Tìm nơi lưu trú cho hành trình của riêng bạn.</p>
        <div className="sy-dest-hero-tag"><Compass size={19}/><span>Việt Nam · Hành trình bất tận</span></div>
      </div>
    </header>
    <main className="sy-dest-width sy-dest-main">
      <div className="sy-dest-search"><Search size={23}/><label className="sy-dest-search-field"><span>Tìm điểm đến</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Bạn muốn khám phá nơi nào?" /></label>{search&&<button type="button" aria-label="Xóa tìm kiếm" onClick={()=>setSearch('')}><X size={19}/></button>}<button type="button" className="sy-dest-primary" onClick={()=>document.getElementById('sy-dest-results')?.scrollIntoView({block:'start'})}>Khám phá <ArrowRight size={18}/></button></div>
      <section id="sy-dest-results" className="sy-dest-results">
        <div className="sy-dest-heading"><div><p className="sy-dest-kicker">01 — PLACES TO GO</p><h2>Việt Nam, đẹp theo từng miền.</h2><p>Chọn điểm đến cho kỳ nghỉ tiếp theo của bạn.</p></div><span role="status" className="sy-dest-count">{loading?'Đang tải...':error?'':`${filtered.length} điểm đến`}</span></div>
        <div className="sy-dest-filters" role="group" aria-label="Lọc theo khu vực">{regions.map(r=><button type="button" key={r} aria-pressed={region===r} onClick={()=>setRegion(r)}>{r}<span>{items.filter(d=>r==='Tất cả'||d.region===r).length}</span></button>)}</div>
        {loading?<div className="sy-dest-grid" aria-busy="true">{Array.from({length:6},(_,i)=><div key={i} className="sy-dest-skeleton"/>)}</div>:error?<div className="sy-dest-empty" role="alert"><Compass size={34}/><h3>Không thể tải điểm đến</h3><p>{error}</p><button className="sy-dest-primary" onClick={()=>setRetry(n=>n+1)}><RefreshCw size={16}/> Thử lại</button></div>:filtered.length===0?<div className="sy-dest-empty"><Search size={34}/><h3>Chưa tìm thấy điểm đến</h3><p>Hãy thử tên địa danh khác hoặc thay đổi khu vực.</p><button className="sy-dest-primary" onClick={reset}>Xóa bộ lọc</button></div>:
        <div className={`sy-dest-grid ${filtered.length>=4?'sy-dest-editorial':''}`}>{filtered.map((d,i)=><article key={d._id||d.slug} className="sy-dest-card" style={{animationDelay:`${Math.min(i*35,210)}ms`}}>
          <Link to={`/destinations/${encodeURIComponent(d.slug)}`} aria-label={`Khám phá ${d.name}`} className="sy-dest-media">
            {d.image?.url&&<img src={d.image.url} alt={d.name} loading={i<3?'eager':'lazy'} onError={e=>{e.currentTarget.hidden=true}}/>}
            <span className="sy-dest-region"><MapPin size={13}/>{d.region||'Việt Nam'}</span><span className="sy-dest-media-title"><span>KHÁM PHÁ</span><h3>{d.name}</h3></span><span className="sy-dest-arrow"><ArrowUpRight size={20}/></span>
          </Link><div className="sy-dest-card-copy"><p>{d.shortDescription||'Khám phá thông tin và lựa chọn lưu trú tại điểm đến này.'}</p><div><span><Building2 size={16}/>{d.hotelCount||0} khách sạn</span><Link to={`/destinations/${encodeURIComponent(d.slug)}`}>Khám phá <ArrowRight size={16}/></Link></div></div>
        </article>)}</div>}
      </section>
      <section className="sy-dest-cta"><div><p className="sy-dest-kicker">02 — YOUR NEXT ESCAPE</p><h2>Điểm đến đã chọn.<br/><em>Kỳ nghỉ đang chờ.</em></h2><p>Khám phá nơi lưu trú phù hợp với hành trình của bạn.</p><Link to="/hotels" className="sy-dest-primary">Tìm khách sạn <ArrowUpRight size={18}/></Link></div><div className="sy-dest-cta-art" aria-hidden="true">{heroImage&&<img src={heroImage} alt="" loading="lazy" onError={e=>{e.currentTarget.hidden=true}}/>}<Compass size={90}/></div></section>
    </main><Footer/></div>;
}
