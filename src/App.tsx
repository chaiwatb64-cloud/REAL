import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ========= CONFIG & HELPERS ========= */
const STORAGE_KEY   = "inventory.thai.lab.v10";
const COVER_KEY     = "inventory.coverUrl.v1";
const CHECKERS_KEY  = "inventory.checkers.v1";
const DEFAULT_CHECKERS = ["Nice","Fah","Anont","Air","Ploy","Aum","Film","Aun","Ning","New","Tong"];

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const nowISO = () => new Date().toISOString();
const clamp0 = (n) => Math.max(0, n|0);
const safeNum = (v, def=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const computeStatus = (qty, low) => (qty <= 0 ? "หมด" : qty <= low ? "ใกล้หมด" : "ปกติ");
const formatDateThai = (iso) =>
  !iso ? "—" : new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
const nextId = (items) => (items.length ? Math.max(...items.map(i => i.id)) + 1 : 1);

/* ========= COLORS ========= */
const chipStyle = (s) => {
  if (s === "หมด")     return { background:"#fee2e2", color:"#991b1b", border:"1px solid #f87171" };
  if (s === "ใกล้หมด") return { background:"#fef9c3", color:"#92400e", border:"1px solid #facc15" };
  return { background:"#d1fae5", color:"#065f46", border:"1px solid #10b981" };
};
const rowBg = (s) => (s==="หมด" ? "#fef2f2" : s==="ใกล้หมด" ? "#fffbeb" : "transparent");

/* ========= SAFE MAP FROM DB ROW ========= */
const rowToItem = (r) => ({
  id: r.id,
  category: r.category ?? "",
  name: r.name ?? "",
  qty: safeNum(r.qty, 0),
  unit: r.unit ?? "ชิ้น",
  status: r.status ?? "ปกติ",
  location: r.location ?? "",
  checkedBy: Array.isArray(r.checked_by) ? r.checked_by : [],
  lastUpdated: r.last_updated ?? undefined
});

  /* ========= SEED (สำหรับ Local) ========= */
const SEED = [
  { id: 1, category: "หมวดของใช้จิปาถะ", name: "ทิชชู่", qty: 0, unit: "ม้วน", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 2, category: "หมวดของใช้จิปาถะ", name: "น้ำยาล้างมิอ", qty: 2, unit: "ถุง/ขวด", status: "ปกติ", location: "อ่างล้างจาน" },
  { id: 3, category: "หมวดของใช้จิปาถะ", name: "น้ำยาล้างจาน", qty: 1, unit: "ถุง/ขวด", status: "ใกล้หมด", location: "อ่างล้างจาน" },
  { id: 4, category: "หมวดของใช้จิปาถะ", name: "Dettol", qty: 1, unit: "ถุง/ขวด", status: "ใกล้หมด", location: "อ่างล้างจาน" },
  { id: 5, category: "หมวดของใช้จิปาถะ", name: "ถุง 7", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 6, category: "หมวดของใช้จิปาถะ", name: "ถุง 8", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 7, category: "หมวดของใช้จิปาถะ", name: "ถุง 9", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 8, category: "หมวดของใช้จิปาถะ", name: "ถุง 10", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 9, category: "หมวดของใช้จิปาถะ", name: "ถุง 12", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 10, category: "หมวดของใช้จิปาถะ", name: "ถุง 24", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 11, category: "หมวดของใช้จิปาถะ", name: "หนังยาง", qty: 0, unit: "แพ็ค", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 12, category: "หมวดของใช้จิปาถะ", name: "ฟรอยด์", qty: 0, unit: "กล่อง", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 13, category: "หมวดของใช้จิปาถะ", name: "สำลี", qty: 1, unit: "ถุง", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 14, category: "หมวดของใช้ทั่วไป", name: "ถุงมือ size S", qty: 6, unit: "กล่อง", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 15, category: "หมวดของใช้ทั่วไป", name: "ถุงมือ size M", qty: 6, unit: "กล่อง", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 16, category: "หมวดของใช้ทั่วไป", name: "ถุงมือ size L", qty: 2, unit: "กล่อง", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 17, category: "หมวดของใช้ทั่วไป", name: "กล่องทิป", qty: 36, unit: "กล่อง", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 18, category: "หมวดของใช้ทั่วไป", name: "Tips 10 ul", qty: 8, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 19, category: "หมวดของใช้ทั่วไป", name: "Tips 200 ul", qty: 4, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 20, category: "หมวดของใช้ทั่วไป", name: "Tips 1000 ul", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 21, category: "หมวดของใช้ทั่วไป", name: "Microcentrifuge (1.5ml)", qty: 13, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 22, category: "หมวดของใช้ทั่วไป", name: "ฟิลเตอร์ 0.22 um (เล็ก)", qty: 32, unit: "อัน", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 23, category: "หมวดของใช้ทั่วไป", name: "Tube 15 ml", qty: 6, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 24, category: "หมวดของใช้ทั่วไป", name: "Tube 50 ml", qty: 17, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 25, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 250 ml", qty: 0, unit: "ขวด", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 26, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 500 ml", qty: 6, unit: "ขวด", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 27, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 1000 ml", qty: 4, unit: "ขวด", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 28, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 2000 ml", qty: 0, unit: "ขวด", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 29, category: "หมวดของใช้ทั่วไป", name: "ไซริ้งค์ 10 ml", qty: 4, unit: "อัน", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 30, category: "หมวดของใช้ทั่วไป", name: "ไซริ้งค์ 50 ml", qty: 16, unit: "อัน", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 31, category: "หมวดของใช้ทั่วไป", name: "กล่องตัวอย่าง", qty: 39, unit: "กล่อง", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 32, category: "หมวดเลี้ยงเซลล์", name: "อาหารสูตร MEM", qty: 0, unit: "แพ็ค", status: "หมด", location: "ตู้เย็น" },
  { id: 33, category: "หมวดเลี้ยงเซลล์", name: "อาหารสูตร DMEM", qty: 16, unit: "ซอง", status: "ปกติ", location: "ตู้เย็น" },
  { id: 34, category: "หมวดเลี้ยงเซลล์", name: "อาหารสูตร RPMI", qty: 11, unit: "ซอง", status: "ปกติ", location: "ตู้เย็น" },
  { id: 35, category: "หมวดเลี้ยงเซลล์", name: "FBS stock", qty: 1, unit: "ขวด", status: "ใกล้หมด", location: "ตู้เย็น" },
  { id: 36, category: "หมวดเลี้ยงเซลล์", name: "FBS ขวดแบ่ง", qty: 12, unit: "หลอด", status: "ปกติ", location: "ตู้เย็น" },
  { id: 37, category: "หมวดเลี้ยงเซลล์", name: "Cryotube", qty: 0, unit: "แพ็ค", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 38, category: "หมวดเลี้ยงเซลล์", name: "Pipette พลาสติก 10 ml", qty: 1, unit: "กล่อง", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 39, category: "หมวดเลี้ยงเซลล์", name: "ชุดกรอง media", qty: 30, unit: "ชุด", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 40, category: "หมวดเลี้ยงเซลล์", name: "Dish 35*10 mm", qty: 45, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 41, category: "หมวดเลี้ยงเซลล์", name: "Dish 90*20 mm", qty: 17, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 42, category: "หมวดเลี้ยงเซลล์", name: "Flask T25", qty: 17, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 43, category: "หมวดเลี้ยงเซลล์", name: "Flask T75", qty: 8, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 44, category: "หมวดเลี้ยงเซลล์", name: "Scraper", qty: 73, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 45, category: "หมวดเลี้ยงเซลล์", name: "6well plate", qty: 30, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 46, category: "หมวดเลี้ยงเซลล์", name: "12well plate", qty: 44, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 47, category: "หมวดเลี้ยงเซลล์", name: "96well plate", qty: 50, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 48, category: "หมวดเลี้ยงเซลล์", name: "Sheath fluid", qty: 2, unit: "ขวด", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 49, category: "หมวดเลี้ยงเซลล์", name: "Paraflim", qty: 0, unit: "กล่อง", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 50, category: "หมวดเลี้ยงเซลล์", name: "Trypsin stock", qty: 0, unit: "ขวด", status: "หมด", location: "ตู้เย็น" },
  { id: 51, category: "หมวดเลี้ยงเซลล์", name: "Trypsin-EDTA", qty: 1, unit: "หลอด", status: "ใกล้หมด", location: "ตู้เย็น" },
  { id: 52, category: "หมวดเลี้ยงเซลล์", name: "Pan/step", qty: 2, unit: "หลอด", status: "ใกล้หมด", location: "ตู้เย็น" },
  { id: 53, category: "หมวดเลี้ยงเซลล์", name: "Trypan blue", qty: 1, unit: "หลอด", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 54, category: "หมวดเลี้ยงเซลล์", name: "HCl", qty: 40, unit: "ml", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 55, category: "หมวดเลี้ยงเซลล์", name: "DMSO", qty: 2500, unit: "ml", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
];


/* ========= MAIN ========= */
export default function App() {
  /* ------- items & load ------- */
  const [items, setItems] = useState(() => {
    if (!hasSupabase) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : SEED;
      } catch (e) { console.error(e); return SEED; }
    }
    return [];
  });
  useEffect(() => {
    if (!hasSupabase) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
    }
  }, [items]);

  /* ------- filters ------- */
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ทั้งหมด");
  const [stat, setStat] = useState("ทั้งหมด");
  const [loc, setLoc] = useState("ทั้งหมด");
  const [onlyLow, setOnlyLow] = useState(false);

  /* ------- status rule ------- */
  const [autoStatus, setAutoStatus] = useState(true);
  const [lowThreshold, setLowThreshold] = useState(3); // ≤3 = ใกล้หมด (ค่าเริ่มต้น)

  /* ------- cover ------- */
  const [coverUrl, setCoverUrl] = useState(() => {
    try { return localStorage.getItem(COVER_KEY) ?? "/BioMINTech.png"; } catch { return "/BioMINTech.png"; }
  });
  const coverInputRef = useRef(null);
  const onPickCover = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setCoverUrl(String(r.result));
    r.readAsDataURL(f);
  };
  useEffect(() => { try { localStorage.setItem(COVER_KEY, coverUrl ?? ""); } catch {} }, [coverUrl]);

  /* ------- checkers (local list) ------- */
  const [checkers, setCheckers] = useState(() => {
    try {
      const raw = localStorage.getItem(CHECKERS_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_CHECKERS;
    } catch { return DEFAULT_CHECKERS; }
  });
  useEffect(() => { try { localStorage.setItem(CHECKERS_KEY, JSON.stringify(checkers)); } catch {} }, [checkers]);

  /* ------- derived ------- */
  const categories = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(items.map(i=>i.category)))], [items]);
  const locations  = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(items.map(i=>i.location)))], [items]);
  const statuses   = ["ทั้งหมด","ปกติ","ใกล้หมด","หมด"];
  const filtered   = useMemo(() => filterAndSort(items, { q, category: cat, status: stat, location: loc, onlyLow }), [items, q, cat, stat, loc, onlyLow]);
  const summary    = useMemo(() => ({
    total: items.length,
    low: items.filter(i=>i.status==="ใกล้หมด").length,
    empty: items.filter(i=>i.status==="หมด").length,
    normal: items.filter(i=>i.status==="ปกติ").length,
  }), [items]);

  /* ------- recalc status on rule change ------- */
  useEffect(() => {
    if (!autoStatus) return;
    setItems(prev => prev.map(i => {
      const s = computeStatus(safeNum(i.qty,0), safeNum(lowThreshold,3));
      if (s !== i.status) {
        if (supabase) { supabase.from("items").update({ status: s, last_updated: nowISO() }).eq("id", i.id).then(()=>{}).catch(console.error); }
        return { ...i, status: s };
      }
      return i;
    }));
  }, [lowThreshold, autoStatus]);

  /* ------- quick-check modal ------- */
  const [checkOpen, setCheckOpen] = useState(false);
  const [checkTarget, setCheckTarget] = useState(null);
  const [checkSelected, setCheckSelected] = useState(new Set());
  const openQuickCheck = (it) => { setCheckTarget(it); setCheckSelected(new Set(it.checkedBy ?? [])); setCheckOpen(true); };
  const toggleChecker = (name) => setCheckSelected(prev => { const s=new Set(prev); s.has(name)?s.delete(name):s.add(name); return s; });
  const confirmQuickCheck = async () => {
    try {
      if (!checkTarget) return;
      const list = Array.from(checkSelected);
      if (supabase) {
        const { error } = await supabase.from("items").update({ checked_by: list, last_updated: nowISO() }).eq("id", checkTarget.id);
        if (error) throw error;
      }
      setItems(prev => prev.map(i => i.id === checkTarget.id ? { ...i, checkedBy: list, lastUpdated: nowISO() } : i));
      setCheckOpen(false); setCheckTarget(null);
    } catch (e) {
      console.error("confirmQuickCheck", e); alert("บันทึกผู้ตรวจไม่สำเร็จ");
    }
  };

  /* ------- add item modal ------- */
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ category: "", name: "", qty: 1, unit: "ชิ้น", storageLocation: "ชั้นเก็บของ" });
  const resetForm = () => setForm({ category: "", name: "", qty: 1, unit: "ชิ้น", storageLocation: "ชั้นเก็บของ" });

  /* ------- manage members modal ------- */
  const [membersOpen, setMembersOpen] = useState(false);
  const [newMember, setNewMember] = useState("");
  const addMember = () => {
    const name = (newMember ?? "").trim();
    if (!name) return;
    if (checkers.some(c => (c ?? "").toLowerCase() === name.toLowerCase())) { alert("มีชื่อนี้แล้ว"); return; }
    setCheckers(prev => [...prev, name]); setNewMember("");
  };
  const removeMember = (name) => {
    if (!confirm(`ลบผู้ตรวจ "${name}" ?`)) return;
    setCheckers(prev => prev.filter(n => n !== name));
  };

  /* ------- Supabase initial load ------- */
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("items")
          .select("id, category, name, qty, unit, status, location, checked_by, last_updated")
          .order("id", { ascending: true });
        if (!mounted) return;
        if (error) throw error;
        setItems((data ?? []).map(rowToItem));
      } catch (e) {
        console.error("supabase load error", e);
        // fallback local
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          setItems(raw ? JSON.parse(raw) : SEED);
        } catch { setItems(SEED); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* ------- actions ------- */
  const remove = async (id) => {
    try {
      if (!confirm("ลบรายการนี้ใช่ไหม?")) return;
      if (supabase) {
        const { error } = await supabase.from("items").delete().eq("id", id);
        if (error) throw error;
      }
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error("remove", e); alert("ลบไม่สำเร็จ");
    }
  };

  const adjustQty = (id, delta) => {
    try {
      setItems(prev => prev.map(i => {
        if (i.id !== id) return i;
        const newQty = Math.max(0, safeNum(i.qty,0) + safeNum(delta,0));
        const newStatus = autoStatus ? computeStatus(newQty, lowThreshold) : i.status;
        const updated = { ...i, qty: newQty, status: newStatus, lastUpdated: nowISO() };
        if (supabase) {
          supabase.from("items").update({
            qty: updated.qty, status: updated.status, last_updated: updated.lastUpdated
          }).eq("id", id).then(()=>{}).catch(console.error);
        }
        return updated;
      }));
    } catch (e) {
      console.error("adjustQty", e); alert("ปรับจำนวนไม่สำเร็จ");
    }
  };

  const setQtyDirect = (id, value) => {
    try {
      const parsed = Number(value);
      const newQty = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      setItems(prev => prev.map(i => {
        if (i.id !== id) return i;
        const newStatus = autoStatus ? computeStatus(newQty, lowThreshold) : i.status;
        const updated = { ...i, qty: newQty, status: newStatus, lastUpdated: nowISO() };
        if (supabase) {
          supabase.from("items").update({
            qty: updated.qty, status: updated.status, last_updated: updated.lastUpdated
          }).eq("id", id).then(()=>{}).catch(console.error);
        }
        return updated;
      }));
    } catch (e) {
      console.error("setQtyDirect", e); alert("แก้จำนวนไม่สำเร็จ");
    }
  };

  const handleAddItem = async () => {
    try {
      const { category, name, unit, storageLocation } = form;
      const qty = Math.max(0, safeNum(form.qty, 0));
      if (!name?.trim() || !category?.trim() || !unit?.trim() || !storageLocation?.trim()) {
        alert("กรอกข้อมูลให้ครบ"); return;
      }
      const status = autoStatus ? computeStatus(qty, lowThreshold) : "ปกติ";

      if (supabase) {
        const { data, error } = await supabase.from("items").insert({
          category, name, qty, unit, status, location: storageLocation, checked_by: [], last_updated: nowISO()
        }).select().single();
        if (error) throw error;
        setItems(prev => [...prev, rowToItem(data)]);
      } else {
        const id = nextId(items);
        setItems(prev => [...prev, {
          id, category, name, qty, unit, status, location: storageLocation, checkedBy: [], lastUpdated: nowISO()
        }]);
      }
      setAddOpen(false); resetForm();
    } catch (e) {
      console.error("handleAddItem", e); alert("เพิ่มรายการไม่สำเร็จ");
    }
  };

  /* ------- tiny styles ------- */
  const box       = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:12 };
  const inputCss  = { width:"100%", padding:10, borderRadius:10, border:"1px solid #cbd5e1", background:"#fff" };
  const btnPri    = { padding:"8px 12px", borderRadius:10, border:"1px solid #0f172a", background:"#0f172a", color:"#fff" };
  const btnGhost  = { padding:"8px 12px", borderRadius:10, border:"1px solid #cbd5e1", background:"#fff" };
  const btnTiny   = { padding:"4px 8px", borderRadius:8, border:"1px solid #cbd5e1", background:"#fff", fontSize:12 };
  const td        = { padding:"8px 10px", whiteSpace:"nowrap" };

  /* ========= RENDER ========= */
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", color:"#0f172a", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:10, backdropFilter:"blur(6px)", background:"rgba(255,255,255,.8)", borderBottom:"1px solid #e5e7eb" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"12px 16px", display:"flex", gap:12, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
          <div style={{ fontSize:22, fontWeight:700 }}>ระบบติดตามสต๊อก (BioMINTech){hasSupabase ? " • Online" : " • Local"}</div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={()=>setAddOpen(true)} style={btnPri}>+ เพิ่มรายการ</button>
            <button onClick={()=>setOnlyLow(v=>!v)} style={{ ...btnGhost, background: onlyLow ? "#fffbeb" : "#fff" }}>เฉพาะใกล้หมด/หมด</button>
            <label style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:14 }}>
              ปรับสถานะอัตโนมัติ <input type="checkbox" checked={autoStatus} onChange={(e)=>setAutoStatus(e.target.checked)} />
            </label>
            <label style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:14 }}>
              เกณฑ์ ≤ <input type="number" min={1} value={lowThreshold}
                onChange={(e)=>setLowThreshold(Math.max(1, safeNum(e.target.value, 3)))}
                style={{ width:60, padding:6, borderRadius:8, border:"1px solid #cbd5e1" }} />
            </label>
            <button onClick={()=>setMembersOpen(true)} style={btnGhost}>จัดการผู้ตรวจ</button>
            <input ref={coverInputRef} onChange={onPickCover} type="file" accept="image/*" style={{ display:"none" }} />
            <button onClick={()=>coverInputRef.current?.click()} style={btnGhost}>ตั้งค่า Cover</button>
          </div>
        </div>
      </div>

      {/* Cover */}
      <section>
        {coverUrl ? (
          <div style={{ position:"relative" }}>
            <img src={coverUrl} alt="BioMINTech Cover" style={{ width:"100%", maxHeight:260, objectFit:"cover" }} />
          </div>
        ) : (
          <div style={{ height:120, display:"grid", placeItems:"center", color:"#475569" }}>เพิ่มรูปปกโดยกด “ตั้งค่า Cover”</div>
        )}
      </section>

      {/* Summary pastel */}
      <div style={{ maxWidth:1200, margin:"12px auto", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:12 }}>
        <SummaryCard title="ปกติ"   value={summary.normal}  sub="รายการ" bg="#ecfdf5" border="#34d399" fg="#065f46" />
        <SummaryCard title="ใกล้หมด" value={summary.low}     sub="รายการ" bg="#fffbeb" border="#facc15" fg="#92400e" />
        <SummaryCard title="หมด"     value={summary.empty}   sub="รายการ" bg="#fef2f2" border="#f87171" fg="#991b1b" />
      </div>

      {/* Filters */}
      <div style={{ maxWidth:1200, margin:"0 auto 12px", padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, alignItems:"end" }}>
        <div style={{ gridColumn:"span 2" }}>
          <div style={{ fontSize:12 }}>ค้นหา</div>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="ชื่อสิ่งของ / หมวดหมู่ / สถานที่" style={inputCss} />
        </div>
        <FieldSelect label="หมวดหมู่" value={cat} setValue={setCat} options={categories} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <FieldSelect label="สถานะ" value={stat} setValue={setStat} options={statuses} />
          <FieldSelect label="ที่จัดเก็บ" value={loc} setValue={setLoc} options={locations} />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...box, maxWidth:1200, margin:"0 auto 20px", overflowX:"auto" }}>
        <table style={{ width:"100%", fontSize:14, borderCollapse:"collapse" }}>
          <thead style={{ background:"#f1f5f9", color:"#475569" }}>
            <tr>
              {["ลำดับ","หมวดหมู่","ชื่อสิ่งของ","จำนวนคงเหลือ","หน่วย","สถานะ","สถานที่จัดเก็บ","อัปเดตล่าสุด","ตรวจโดย","การทำงาน"].map((h, i) => (
                <th key={i} style={{ textAlign: i===9 ? "right" : "left", padding:"8px 10px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(it => (
              <tr key={it.id} style={{ borderTop:"1px solid #e2e8f0", background: rowBg(it.status) }}>
                <td style={td}>{it.id}</td>
                <td style={td}>{it.category}</td>
                <td style={{ ...td, fontWeight:600 }}>{it.name}</td>

                {/* จำนวนคงเหลือ: พิมพ์ได้ + กัน NaN */}
                <td style={{ ...td, textAlign:"center" }}>
                  <input
                    type="number"
                    value={safeNum(it.qty, 0)}
                    min={0}
                    onChange={(e)=>setQtyDirect(it.id, e.target.value)}
                    style={{
                      width: 72, textAlign: "center",
                      fontSize: 16, fontWeight: 800,
                      borderRadius: 8, border: "1px solid #cbd5e1",
                      padding: 4, background: "#fff"
                    }}
                  />
                </td>

                <td style={td}>{it.unit}</td>
                <td style={td}>
                  <span style={{ ...chipStyle(it.status), padding:"4px 10px", borderRadius:999, fontSize:12, fontWeight:700 }}>
                    {it.status}
                  </span>
                </td>
                <td style={td}>{it.location}</td>
                <td style={td}>{formatDateThai(it.lastUpdated)}</td>
                <td style={td}>{(it.checkedBy ?? []).join(", ") || "—"}</td>
                <td style={{ ...td }}>
                  <div style={{ display:"flex", gap:6, justifyContent:"end" }}>
                    <button onClick={()=>adjustQty(it.id,-1)} style={btnTiny}>−1</button>
                    <button onClick={()=>adjustQty(it.id, 1)} style={btnTiny}>+1</button>
                    <button onClick={()=>openQuickCheck(it)} style={btnTiny}>ตรวจแล้ว</button>
                    <button onClick={()=>remove(it.id)} style={{ ...btnTiny, color:"#be123c" }}>ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="10" style={{ padding:24, textAlign:"center", color:"#64748b" }}>ไม่พบรายการ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick-Check Modal */}
      {checkOpen && checkTarget && (
        <Modal onClose={()=>setCheckOpen(false)} title={`ตรวจแล้ว: ${checkTarget.name}`}>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {checkers.map(name => {
              const active = checkSelected.has(name);
              return (
                <button key={name} onClick={()=>toggleChecker(name)} style={{
                  padding:"6px 10px", borderRadius:999, border:"1px solid #cbd5e1",
                  background: active ? "#0f172a" : "#fff", color: active ? "#fff" : "#0f172a"
                }}>{name}</button>
              );
            })}
          </div>
          <div style={{ marginTop:16, display:"flex", justifyContent:"end", gap:8 }}>
            <button onClick={()=>setCheckOpen(false)} style={btnGhost}>ยกเลิก</button>
            <button onClick={confirmQuickCheck} style={btnPri}>บันทึก</button>
          </div>
        </Modal>
      )}

      {/* Add Item Modal */}
      {addOpen && (
        <Modal onClose={()=>setAddOpen(false)} title="เพิ่มรายการใหม่">
          <div style={{ display:"grid", gap:10 }}>
            <FieldText   label="หมวดหมู่"  value={form.category}  onChange={(v)=>setForm(s=>({...s, category:v}))}  placeholder="เช่น หมวดของใช้ทั่วไป" />
            <FieldText   label="ชื่อสิ่งของ" value={form.name}      onChange={(v)=>setForm(s=>({...s, name:v}))}      placeholder="เช่น ถุงมือ size M" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              <FieldNumber label="จำนวน" value={form.qty} min={0} onChange={(v)=>setForm(s=>({...s, qty: safeNum(v,0)}))} />
              <FieldText   label="หน่วย"  value={form.unit}        onChange={(v)=>setForm(s=>({...s, unit:v}))}       placeholder="เช่น กล่อง / แพ็ค / ขวด" />
              <FieldText   label="ที่จัดเก็บ" value={form.storageLocation} onChange={(v)=>setForm(s=>({...s, storageLocation:v}))} placeholder="เช่น ชั้นเก็บของ" />
            </div>
          </div>
          <div style={{ marginTop:16, display:"flex", justifyContent:"end", gap:8 }}>
            <button onClick={()=>{ setAddOpen(false); resetForm(); }} style={btnGhost}>ยกเลิก</button>
            <button onClick={handleAddItem} style={btnPri}>บันทึก</button>
          </div>
        </Modal>
      )}

      {/* Manage Members Modal */}
      {membersOpen && (
        <Modal onClose={()=>setMembersOpen(false)} title="จัดการผู้ตรวจ">
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
            {checkers.map(name => (
              <div key={name} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 10px",
                borderRadius:999, border:"1px solid #cbd5e1", background:"#fff" }}>
                <span>{name}</span>
                <button onClick={()=>removeMember(name)} style={{ color:"#be123c" }} title="ลบ">✕</button>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={newMember} onChange={(e)=>setNewMember(e.target.value)} placeholder="เพิ่มชื่อ" style={inputCss} />
            <button onClick={addMember} style={btnPri}>เพิ่ม</button>
          </div>
          <div style={{ marginTop:16, display:"flex", justifyContent:"end" }}>
            <button onClick={()=>setMembersOpen(false)} style={btnGhost}>เสร็จสิ้น</button>
          </div>
        </Modal>
      )}

      {/* Footer กลางล่าง */}
      <footer style={{ textAlign:"center", padding:"12px", fontSize:"12px", color:"#64748b", marginTop:"auto" }}>
        © 2025 BioMINTech Inventory
      </footer>
    </div>
  );
}

/* ========= SMALL COMPONENTS ========= */
function SummaryCard({ title, value, sub, bg, border, fg }) {
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, color:fg, borderRadius:16, padding:16 }}>
      <div style={{ fontSize:13, opacity:.9 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:800 }}>{value}</div>
      <div style={{ fontSize:12, opacity:.9 }}>{sub}</div>
    </div>
  );
}

function filterAndSort(items, { q, category, status, location, onlyLow }) {
  const query=(q??"").toLowerCase();
  let out=items.filter(i =>
    (i.name??"").toLowerCase().includes(query) ||
    (i.category??"").toLowerCase().includes(query) ||
    (i.location??"").toLowerCase().includes(query)
  );
  if ((category??"ทั้งหมด")!=="ทั้งหมด") out=out.filter(i=>i.category===category);
  if ((status??"ทั้งหมด")!=="ทั้งหมด")   out=out.filter(i=>i.status===status);
  if ((location??"ทั้งหมด")!=="ทั้งหมด") out=out.filter(i=>i.location===location);
  if (onlyLow) out=out.filter(i=>i.status!=="ปกติ");
  return out;
}

function FieldSelect({ label, value, setValue, options }) {
  return (
    <div>
      <div style={{ fontSize:12 }}>{label}</div>
      <select value={value} onChange={(e)=>setValue(e.target.value)} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #cbd5e1", background:"#fff" }}>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}
function FieldText({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize:12 }}>{label}</div>
      <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
             style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #cbd5e1", background:"#fff" }} />
    </div>
  );
}
function FieldNumber({ label, value, onChange, min=0 }) {
  return (
    <div>
      <div style={{ fontSize:12 }}>{label}</div>
      <input type="number" value={value ?? min} min={min} onChange={(e)=>onChange(Number(e.target.value))}
             style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #cbd5e1", background:"#fff" }} />
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50 }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.3)" }} />
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ width:"100%", maxWidth:560, background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:16 }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>{title}</div>
          {children}
        </div>
      </div>
    </div>
  );
}
