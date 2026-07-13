import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";
import { Eye, Phone, MessageCircle, Mail, TrendingUp, Home, ChevronLeft, MapPin } from "lucide-react";
import API_URL from "../config";

const TYPE_FR = {
  appartement:"Appartement", villa:"Villa", maison:"Maison", villa_maison:"Villa/Maison",
  terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial",
  ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", immeuble:"Immeuble",
  garage_parking:"Garage / Parking", depot_stockage:"Dépôt de stockage",
  batiment_industriel:"Bâtiment industriel", immobiliers_divers:"Immobiliers divers",
};
const CAT_COLOR = { vente:"#6366f1", location:"#10b981", vacances:"#f59e0b" };
const CAT_LABEL = { vente:"Vente", location:"Location", vacances:"Vacances" };

function authFetch(path, token) {
  return fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

function todayISO(d = new Date()) { return d.toISOString().slice(0, 10); }
function startOfPeriod(period) {
  const now = new Date();
  if (period === "jour") return todayISO(now);
  if (period === "mois") return todayISO(new Date(now.getFullYear(), now.getMonth(), 1));
  if (period === "annee") return todayISO(new Date(now.getFullYear(), 0, 1));
  return null; // "tout" ou "personnalise"
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:"16px 18px",
      display:"flex", alignItems:"center", gap:12, minWidth:0,
    }}>
      <div style={{
        width:42, height:42, borderRadius:11, background:`${color}18`, color,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      }}>
        {icon}
      </div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:20, fontWeight:800, color:"#0f172a", lineHeight:1.1}}>{value}</div>
        <div style={{fontSize:12, color:"#64748b", fontWeight:600, marginTop:2, whiteSpace:"nowrap"}}>{label}</div>
      </div>
    </div>
  );
}

const PERIOD_OPTS = [
  { v:"jour", l:"Aujourd'hui" },
  { v:"mois", l:"Ce mois-ci" },
  { v:"annee", l:"Cette année" },
  { v:"tout", l:"Tout" },
  { v:"personnalise", l:"Période personnalisée" },
];

export default function AgencyStatsDashboard() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const [period, setPeriod] = useState("mois");
  const [customFrom, setCustomFrom] = useState(todayISO(new Date(Date.now() - 30*24*3600*1000)));
  const [customTo, setCustomTo] = useState(todayISO());

  const { dateFrom, dateTo } = useMemo(() => {
    if (period === "personnalise") return { dateFrom: customFrom, dateTo: customTo };
    if (period === "tout") return { dateFrom: null, dateTo: null };
    return { dateFrom: startOfPeriod(period), dateTo: todayISO() };
  }, [period, customFrom, customTo]);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [geoLevel, setGeoLevel] = useState("gouvernorat"); // gouvernorat | delegation | localite
  const [geoPath, setGeoPath] = useState([]); // [{id,nom}] breadcrumb
  const [geoData, setGeoData] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState(true);

  const [selectedType, setSelectedType] = useState(null);

  const qs = useCallback(() => {
    const p = new URLSearchParams();
    if (dateFrom) p.set("date_from", dateFrom);
    if (dateTo)   p.set("date_to", dateTo);
    return p.toString();
  }, [dateFrom, dateTo]);

  const loadStats = useCallback(() => {
    setLoadingStats(true);
    authFetch(`/users/me/agency-stats?${qs()}`, token)
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [qs, token]);

  const loadGeo = useCallback((level, parentId) => {
    setLoadingGeo(true);
    const p = new URLSearchParams(qs());
    p.set("level", level);
    if (parentId) p.set("parent_id", parentId);
    authFetch(`/users/me/agency-stats/geo?${p.toString()}`, token)
      .then(r => r.ok ? r.json() : [])
      .then(d => setGeoData(Array.isArray(d) ? d : []))
      .catch(() => setGeoData([]))
      .finally(() => setLoadingGeo(false));
  }, [qs, token]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    setGeoLevel("gouvernorat"); setGeoPath([]);
    loadGeo("gouvernorat", null);
  }, [dateFrom, dateTo]); // eslint-disable-line

  function handleGeoBarClick(entry) {
    if (geoLevel === "gouvernorat") {
      setGeoPath([{ id: entry.id, nom: entry.nom }]);
      setGeoLevel("delegation");
      loadGeo("delegation", entry.id);
    } else if (geoLevel === "delegation") {
      setGeoPath(p => [...p, { id: entry.id, nom: entry.nom }]);
      setGeoLevel("localite");
      loadGeo("localite", entry.id);
    }
    /* Au niveau localité, un clic n'ouvre plus rien de plus fin — c'est le dernier niveau. */
  }

  function handleGeoBack(toIndex) {
    if (toIndex < 0) {
      setGeoPath([]); setGeoLevel("gouvernorat"); loadGeo("gouvernorat", null);
      return;
    }
    const newPath = geoPath.slice(0, toIndex + 1);
    const parentId = newPath[newPath.length - 1].id;
    const nextLevel = toIndex === 0 ? "delegation" : "localite";
    setGeoPath(newPath);
    setGeoLevel(nextLevel);
    loadGeo(nextLevel, parentId);
  }

  const typeChartData = (stats?.contacts_par_type || []).map(t => ({
    ...t,
    label: TYPE_FR[t.type_bien] || t.type_bien,
  }));

  return (
    <div>
      {/* Filtres période */}
      <div style={{display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", marginBottom:18}}>
        {PERIOD_OPTS.map(o => (
          <button key={o.v} onClick={() => setPeriod(o.v)}
            style={{
              padding:"7px 14px", borderRadius:20, fontSize:12.5, fontWeight:700, cursor:"pointer",
              border: period===o.v ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
              background: period===o.v ? "#eef2ff" : "#fff",
              color: period===o.v ? "#4f46e5" : "#475569", fontFamily:"inherit",
            }}>
            {o.l}
          </button>
        ))}
        {period === "personnalise" && (
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}
              style={{border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 8px", fontSize:12.5, fontFamily:"inherit"}}/>
            <span style={{color:"#94a3b8", fontSize:12}}>→</span>
            <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)}
              style={{border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 8px", fontSize:12.5, fontFamily:"inherit"}}/>
          </div>
        )}
      </div>

      {/* Cartes stats */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:24}}>
        <StatCard icon={<Home size={20}/>} label="Annonces publiées" color="#6366f1" value={loadingStats ? "…" : (stats?.nb_annonces ?? 0)}/>
        <StatCard icon={<Eye size={20}/>} label="Vues totales" color="#0ea5e9" value={loadingStats ? "…" : (stats?.nb_vues ?? 0)}/>
        <StatCard icon={<TrendingUp size={20}/>} label="Taux de conversion" color="#16a34a" value={loadingStats ? "…" : `${stats?.taux_conversion ?? 0}%`}/>
        <StatCard icon={<Phone size={20}/>} label="Contacts téléphone" color="#f59e0b" value={loadingStats ? "…" : (stats?.contacts_par_canal?.telephone ?? 0)}/>
        <StatCard icon={<MessageCircle size={20}/>} label="Contacts WhatsApp" color="#22c55e" value={loadingStats ? "…" : (stats?.contacts_par_canal?.whatsapp ?? 0)}/>
        <StatCard icon={<Mail size={20}/>} label="Contacts e-mail" color="#ef4444" value={loadingStats ? "…" : (stats?.contacts_par_canal?.email ?? 0)}/>
      </div>

      {/* Graphe géographique avec exploration */}
      <div style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:"18px 20px", marginBottom:20}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap"}}>
          <MapPin size={16} color="#6366f1"/>
          <h3 style={{fontSize:14.5, fontWeight:800, color:"#0f172a", margin:0}}>Contacts par zone géographique</h3>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b", marginBottom:10, flexWrap:"wrap"}}>
          <button onClick={() => handleGeoBack(-1)} disabled={geoPath.length===0}
            style={{background:"none", border:"none", cursor: geoPath.length? "pointer":"default", color: geoPath.length ? "#6366f1":"#94a3b8", fontWeight:700, padding:0, fontFamily:"inherit", display:"flex", alignItems:"center", gap:3}}>
            {geoPath.length>0 && <ChevronLeft size={13}/>} Gouvernorats
          </button>
          {geoPath.map((p, i) => (
            <React.Fragment key={p.id}>
              <span>/</span>
              <button onClick={() => handleGeoBack(i)}
                style={{background:"none", border:"none", cursor:"pointer", color: i===geoPath.length-1 ? "#0f172a" : "#6366f1", fontWeight:700, padding:0, fontFamily:"inherit"}}>
                {p.nom}
              </button>
            </React.Fragment>
          ))}
        </div>
        {loadingGeo ? (
          <div style={{padding:30, textAlign:"center", color:"#94a3b8", fontSize:13}}>Chargement…</div>
        ) : geoData.length === 0 ? (
          <div style={{padding:30, textAlign:"center", color:"#94a3b8", fontSize:13}}>Aucun contact sur cette zone pour la période sélectionnée.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={geoData} margin={{top:4, right:8, left:-16, bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="nom" tick={{fontSize:11}} interval={0} angle={-25} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:11}} allowDecimals={false}/>
              <Tooltip cursor={{fill:"#f8fafc"}}/>
              <Bar dataKey="count" name="Contacts" radius={[6,6,0,0]}
                onClick={(entry) => geoLevel !== "localite" && handleGeoBarClick(entry)}
                style={{cursor: geoLevel !== "localite" ? "pointer" : "default"}}>
                {geoData.map((_, i) => <Cell key={i} fill="#6366f1"/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {geoLevel !== "localite" && geoData.length > 0 && (
          <p style={{fontSize:11.5, color:"#94a3b8", marginTop:8, marginBottom:0}}>
            Cliquez sur une barre pour voir le détail par {geoLevel === "gouvernorat" ? "délégation" : "localité"}.
          </p>
        )}
      </div>

      {/* Graphe par type de bien (empilé vente/location/vacances) */}
      <div style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:"18px 20px"}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap"}}>
          <Home size={16} color="#6366f1"/>
          <h3 style={{fontSize:14.5, fontWeight:800, color:"#0f172a", margin:0}}>Contacts par type de bien</h3>
        </div>
        {typeChartData.length === 0 ? (
          <div style={{padding:30, textAlign:"center", color:"#94a3b8", fontSize:13}}>Aucun contact sur cette période.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={typeChartData} margin={{top:4, right:8, left:-16, bottom:4}}
                onClick={(e) => e?.activeLabel && setSelectedType(prev => prev === e.activeLabel ? null : e.activeLabel)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="label" tick={{fontSize:11}} interval={0} angle={-25} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                <Tooltip cursor={{fill:"#f8fafc"}}/>
                <Legend formatter={(v) => CAT_LABEL[v] || v} wrapperStyle={{fontSize:12}}/>
                <Bar dataKey="vente" stackId="a" name="vente" fill={CAT_COLOR.vente} style={{cursor:"pointer"}}/>
                <Bar dataKey="location" stackId="a" name="location" fill={CAT_COLOR.location} style={{cursor:"pointer"}}/>
                <Bar dataKey="vacances" stackId="a" name="vacances" fill={CAT_COLOR.vacances} radius={[6,6,0,0]} style={{cursor:"pointer"}}/>
              </BarChart>
            </ResponsiveContainer>
            <p style={{fontSize:11.5, color:"#94a3b8", marginTop:8, marginBottom:0}}>
              Cliquez sur une barre pour voir le détail vente / location / vacances de ce type de bien.
            </p>
            {selectedType && (() => {
              const row = typeChartData.find(t => t.label === selectedType);
              if (!row) return null;
              return (
                <div style={{marginTop:12, padding:"12px 14px", background:"#f8fafc", borderRadius:10, display:"flex", gap:18, flexWrap:"wrap"}}>
                  <strong style={{color:"#0f172a", fontSize:13}}>{selectedType} :</strong>
                  {["vente","location","vacances"].map(c => (
                    <span key={c} style={{fontSize:12.5, color:CAT_COLOR[c], fontWeight:700, display:"flex", alignItems:"center", gap:5}}>
                      <span style={{width:9, height:9, borderRadius:3, background:CAT_COLOR[c], display:"inline-block"}}/>
                      {CAT_LABEL[c]} : {row[c] || 0}
                    </span>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
