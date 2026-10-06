import crypto from "node:crypto";
export const dateOnly = (value) => { const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? null : d; };
export const nightsBetween = (a,b) => Math.ceil((b-a)/86400000);
export const bookingCode = () => `HTL-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
