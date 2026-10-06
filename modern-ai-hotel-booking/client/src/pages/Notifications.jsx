import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getNotifications } from "../api/profileApi";
export default function Notifications(){const [items,setItems]=useState([]);useEffect(()=>{getNotifications().then(r=>setItems(r.data||[]))},[]);return <div className="min-h-screen bg-slate-50"><Navbar/><main className="mx-auto max-w-4xl px-6 py-10"><h1 className="text-3xl font-bold">Thông báo</h1><div className="mt-7 space-y-3">{items.map(n=><article key={n._id} className={`rounded-2xl border bg-white p-5 ${n.isRead?"border-slate-200":"border-blue-100 bg-blue-50/40"}`}><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Bell size={18}/></div><div><h2 className="font-semibold">{n.title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{n.message}</p></div></div></article>)}{!items.length&&<div className="rounded-2xl bg-white p-12 text-center text-slate-500">Chưa có thông báo.</div>}</div></main><Footer/></div>}
