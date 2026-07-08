import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL, { fmtDevise } from "../config";
import { useIsInCompare, toggleCompare as toggleCompareStore } from "../utils/compareStore";
import {
  MapPin, Phone, Mail, Building2, Bed, Bath, Maximize,
  ArrowLeft, Heart, ChevronLeft, ChevronRight, Users, Car, Moon, Star,
} from "lucide-react";

/* ─── helpers ─── */
function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}
function fmtFull(n) {
  if (!n) return "—";
  return Number(n).toLocaleString("fr-TN");
}

/* ─── Carousel identique à CartePage ─── */
const arrowBtn = (s) => ({
  position:"absolute", top:"50%", transform:"translateY(-50%)", [s]:8,
  width:27, height:27, borderRadius:"50%", background:"rgba(255,255,255,.45)",
  backdropFilter:"blur(4px)", border:"none", cursor:"pointer",
  display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 1px 4px rgba(0,0,0,.15)", color:"#fff", zIndex:4,
});

function Carousel({ images, h = 190 }) {
  const [idx, setIdx]     = useState(0);
  const [prev2, setPrev2] = useState(null);
  const [dir, setDir]     = useState(1);
  const [anim, setAnim]   = useState(false);

  const go = (e, delta) => {
    e.stopPropagation();
    if (anim || images.length < 2) return;
    const next = (idx + delta + images.length) % images.length;
    setDir(delta); setPrev2(idx); setIdx(next); setAnim(true);
    setTimeout(() => { setPrev2(null); setAnim(false); }, 420);
  };
  const goTo = (e, i) => {
    e.stopPropagation();
    if (anim || i === idx) return;
    setDir(i > idx ? 1 : -1); setPrev2(idx); setIdx(i); setAnim(true);
    setTimeout(() => { setPrev2(null); setAnim(false); }, 420);
  };

  return (
    <div style={{ position:"relative", height:h, background:"#f3f4f6", overflow:"hidden", flexShrink:0, isolation:"isolate" }}>
      {prev2 !== null && (
        <img src={images[prev2]} alt="" style={{
          position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
          animation:`carouselOut${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards`, zIndex:1,
        }}/>
      )}
      <img key={idx} src={images[idx]} alt="" style={{
        position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
        animation: prev2 !== null ? `carouselIn${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards` : "none",
        zIndex:2,
      }} loading="lazy"/>
      <div style={{ position:"absolute", inset:0, zIndex:3, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
        <span style={{ fontSize:18, fontWeight:900, letterSpacing:"-0.5px", fontFamily:"Arial,sans-serif",
          color:"rgba(255,255,255,0.22)", textShadow:"0 1px 3px rgba(0,0,0,0.18)", userSelect:"none", transform:"rotate(-15deg)" }}>
          LOCAL<span style={{color:"rgba(99,102,241,0.30)"}}>IZI</span>.TN
        </span>
      </div>
      {images.length > 1 && <>
        <button onClick={e=>go(e,-1)} style={arrowBtn("left")}><ChevronLeft size={14}/></button>
        <button onClick={e=>go(e,+1)} style={arrowBtn("right")}><ChevronRight size={14}/></button>
        <div style={{ position:"absolute", bottom:7, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4, zIndex:3 }}>
          {images.map((_,i) => (
            <span key={i} onClick={e=>goTo(e,i)} style={{
              width:6, height:6, borderRadius:"50%", cursor:"pointer",
              background: i===idx ? "#fff" : "rgba(255,255,255,.45)", transition:"background .2s",
            }}/>
          ))}
        </div>
      </>}
    </div>
  );
}

/* ─── Carte annonce — même style que PropCard de CartePage ─── */
function PropCard({ a }) {
  const realId = String(a.id);
  const images = a.image ? [resolveUrl(a.image)] : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=75"];
  const cat    = a.categorie || "vente";
  const joursEcoules = a.date_creation ? Math.floor((Date.now() - new Date(a.date_creation)) / 86_400_000) : null;
  const ageLabel = joursEcoules === 0 ? "Aujourd'hui" : joursEcoules === 1 ? "il y a 1 j." : joursEcoules != null ? `il y a ${joursEcoules} j.` : null;

  /* Favoris */
  const [isFav, setIsFav] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_favs")||"[]").some(id => String(id) === realId); } catch { return false; }
  });
  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login?redirect=/carte"; return; }
    const wasOn = isFav;
    setIsFav(!wasOn);
    try {
      const res = await fetch(`${API_URL}/users/me/favoris/${realId}`, {
        method: wasOn ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
        const updated = !wasOn ? [...new Set([...favs, realId])] : favs.filter(id => String(id) !== realId);
        localStorage.setItem("localizi_favs", JSON.stringify(updated));
      } else { setIsFav(wasOn); }
    } catch { setIsFav(wasOn); }
  };

  /* Comparateur (état centralisé, partagé avec toutes les interfaces) */
  const inCompare = useIsInCompare(realId);
  const toggleCompare = (e) => {
    e.stopPropagation();
    const result = toggleCompareStore({
      id: realId, titre: a.titre, prix: a.prix, devise: a.devise,
      image: images?.[0] || null, gouvernorat: a.gouvernorat, delegation: a.delegation,
      categorie: a.categorie,
    });
    if (result.maxReached) alert("Maximum 4 annonces dans le comparateur.");
  };

  return (
    <div className="pc" onClick={() => window.open(`/annonce/${realId}`, "_blank")}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.12)";e.currentTarget.style.borderColor="#94a3b8";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="";}}
    >
      <div style={{ position:"relative" }}>
        <Carousel images={images} h={190}/>
        <span className={`pc__cat-badge pc__cat-badge--${cat}`}>
          {cat === "vente" ? "Vente" : cat === "location" ? "Location" : "Vacances"}
        </span>
        {ageLabel && (
          <span style={{
            position:"absolute", bottom:8, right:10, zIndex:10,
            background:"rgba(0,0,0,.52)", color:"#fff",
            fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:999,
          }}>{ageLabel}</span>
        )}
      </div>
      <div className="pc__body">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ minWidth:0, flex:1 }}>
            <p className="pc__price">
              {fmtFull(a.prix)}
              <span className="pc__devise">
                {" "}{fmtDevise(a.devise)}
                {cat === "location" ? " /mois" : ""}
              </span>
            </p>
            <p className="pc__title">{a.titre}</p>
          </div>
          <button className={`pc__fav${isFav ? " pc__fav--on" : ""}`} onClick={toggleFav} title={isFav ? "Retirer" : "Favori"}>
            <Heart size={14} fill={isFav ? "#ef4444" : "none"}/>
          </button>
        </div>
        {/* Évaluation prix — "Aucune évaluation" si pas de données */}
        <div className="peb">
          <span className="peb__label" style={{ color:"#9ca3af" }}>Aucune évaluation</span>
          <div className="peb__bar">
            {Array.from({length:5}).map((_,i) => <span key={i} className="peb__seg" style={{background:"#e2e8f0"}}/>)}
          </div>
        </div>
        <p className="pc__loc"><MapPin size={10}/> {[a.delegation, a.gouvernorat].filter(Boolean).join(" · ")}</p>
        <div className="pc__specs">
          {a.nb_pieces   != null && <span><Building2 size={11}/> {a.nb_pieces} p.</span>}
          {a.nb_chambres != null && <span><Bed        size={11}/> {a.nb_chambres} ch.</span>}
          {a.superficie  != null && <span><Maximize   size={11}/> {a.superficie} m²</span>}
        </div>
        <button onClick={toggleCompare} style={{
          marginTop:8, width:"100%", padding:"5px 0", borderRadius:7,
          border:`1.5px solid ${inCompare?"#6366f1":"#e5e7eb"}`,
          background: inCompare ? "#eef2ff" : "#f8fafc",
          color: inCompare ? "#4f46e5" : "#64748b",
          fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all .15s",
        }}>
          {inCompare ? "✓ Ajouté au comparateur" : "+ Comparer"}
        </button>
      </div>
    </div>
  );
}

/* ─── Métadonnées secteur partenaire ─── */
const SECTEUR_META = {
  banques:          { label:"Banque",                 color:"#0369a1", bg:"#eff6ff" },
  assurances:       { label:"Assurance",              color:"#7c3aed", bg:"#f5f3ff" },
  notaires_avocats: { label:"Notaire / Avocat",       color:"#0f172a", bg:"#f8fafc" },
  architectes:      { label:"Architecte",             color:"#b45309", bg:"#fffbeb" },
  artisans:         { label:"Artisan / Bâtiment",     color:"#15803d", bg:"#f0fdf4" },
};

export default function AgentProfile() {
  const { id }      = useParams();
  const location    = useLocation();
  const navigate    = useNavigate();
  const isPromoteur = location.pathname.startsWith("/promoteur/");
  const [agent, setAgent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [cSending, setCSending] = useState(false);
  const [cSent, setCSent]       = useState(false);
  const [cForm, setCForm] = useState(() => {
    let u = null; try { u = JSON.parse(localStorage.getItem("user")); } catch {}
    return { nom: u?.username || "", email: u?.email || "", telephone: u?.phone_number || "", message: "" };
  });

  const submitContact = async () => {
    if (!cForm.nom.trim() || (!cForm.telephone.trim() && !cForm.email.trim())) return;
    setCSending(true);
    let u = null; try { u = JSON.parse(localStorage.getItem("user")); } catch {}
    try {
      const res = await fetch(`${API_URL}/users/interventions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestataire_id: Number(id), client_user_id: u?.id || null,
          client_nom: cForm.nom.trim(), client_email: cForm.email.trim(),
          client_telephone: cForm.telephone.trim(), message: cForm.message.trim(),
        }),
      });
      if (res.ok) setCSent(true);
    } catch { /* silencieux */ } finally { setCSending(false); }
  };

  useEffect(() => {
    fetch(`${API_URL}/users/${id}/public-profile`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setAgent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Poppins',system-ui,sans-serif" }}>
      <p style={{ color:"#94a3b8" }}>Chargement…</p>
    </div>
  );
  if (!agent) return (
    <div style={{ minHeight:"100vh", fontFamily:"'Poppins',system-ui,sans-serif" }}>
      <Navbar/>
      <div style={{ maxWidth:800, margin:"80px auto", textAlign:"center", color:"#94a3b8" }}>
        <p style={{ fontSize:18, fontWeight:700 }}>Profil introuvable</p>
        <Link to="/trouver-un-prestataire" style={{ color:"#6366f1" }}>← Retour</Link>
      </div>
    </div>
  );

  const photoUrl     = resolveUrl(agent.profile_picture);
  const initiale     = (agent.nom||"?")[0].toUpperCase();
  const isPartenaire = agent.role === "partenaire";
  const secteurMeta  = SECTEUR_META[agent.secteur_partenaire] || null;
  const accentColor  = isPartenaire ? (secteurMeta?.color || "#6366f1") : "#6366f1";
  const roleLabel    = isPartenaire ? (secteurMeta?.label || "Partenaire")
                     : isPromoteur  ? "Promoteur" : "Agence / Agent";
  const backHref  = isPartenaire ? "/trouver-un-prestataire" : isPromoteur ? "/trouver-un-promoteur" : "/trouver-un-agent";
  const backLabel = isPartenaire ? "Retour aux prestataires" : isPromoteur ? "Retour aux promoteurs" : "Retour aux agents";

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Poppins',system-ui,sans-serif" }}>
      <style>{`
        /* ── Carousel animations ── */
        @keyframes carouselInL  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes carouselOutL { from{transform:translateX(0)} to{transform:translateX(-100%)} }
        @keyframes carouselInR  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes carouselOutR { from{transform:translateX(0)} to{transform:translateX(100%)} }
        /* ── PropCard classes — identiques à CartePage ── */
        .pc { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; cursor:pointer; transition:box-shadow .18s,border-color .18s,transform .12s; }
        .pc__cat-badge { position:absolute; top:8px; right:8px; z-index:10; padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; }
        .pc__cat-badge--vente    { background:#166534; color:#fff; }
        .pc__cat-badge--location { background:#1e40af; color:#fff; }
        .pc__cat-badge--vacances { background:#854d0e; color:#fff; }
        .pc__body  { padding:12px 14px 13px; }
        .pc__price { font-size:22px; font-weight:900; color:#0a0a0a; margin-bottom:2px; }
        .pc__devise{ font-size:13px; font-weight:500; color:#475569; margin-left:2px; }
        .pc__title { font-size:15px; color:#0a0a0a; font-weight:700; margin-bottom:5px; line-height:1.35; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .pc__fav   { width:28px; height:28px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#cbd5e1; background:#f1f5f9; border:none; cursor:pointer; transition:all .15s; }
        .pc__fav:hover { color:#ef4444; background:#fee2e2; }
        .pc__fav--on   { color:#ef4444 !important; background:#fee2e2 !important; }
        .pc__loc  { display:flex; align-items:center; gap:3px; font-size:12px; color:#374151; font-weight:500; margin-bottom:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .pc__specs{ display:flex; gap:10px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9; max-height:28px; overflow:hidden; }
        .pc__specs span { display:flex; align-items:center; gap:3px; font-size:13px; color:#1e293b; font-weight:500; }
        .peb { display:flex; flex-direction:column; gap:4px; margin:5px 0 7px; padding-top:7px; border-top:1px solid #f1f5f9; }
        .peb__label { font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.07em; line-height:1; }
        .peb__bar   { display:flex; gap:2px; }
        .peb__seg   { flex:1; height:5px; border-radius:2px; transition:background .2s; }
        /* ── Responsive mobile ── */
        .ap-hero-stats > div > div:last-child { text-align:center; }
        @media(max-width:700px){
          .ap-hero-inner { flex-direction:column !important; align-items:center !important; text-align:center !important; gap:14px !important; }
          .ap-hero-avatar{ margin:0 auto -8px !important; }
          .ap-hero-info  { width:100% !important; display:flex; flex-direction:column; align-items:center; }
          .ap-hero-badges{ justify-content:center !important; margin-top:6px !important; }
          .ap-hero-loc   { justify-content:center !important; }
          .ap-hero-btns  { justify-content:center !important; }
          .ap-hero-stats { width:100% !important; gap:8px !important; }
          .ap-hero-stats > div { padding:14px 8px !important; min-width:0 !important; }
        }
      `}</style>

      <Navbar/>

      {/* ── Modal : contacter le prestataire (envoi d'une demande d'intervention) ── */}
      {showContact && (
        <div onClick={()=>setShowContact(false)}
          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:440, padding:"26px 26px 24px", boxShadow:"0 20px 60px rgba(0,0,0,.3)", maxHeight:"90vh", overflowY:"auto" }}>
            {cSent ? (
              <div style={{ textAlign:"center", padding:"14px 0" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <Star size={30} fill="#16a34a" color="#16a34a"/>
                </div>
                <h3 style={{ fontSize:19, fontWeight:800, color:"#0f172a", margin:"0 0 8px" }}>Demande envoyée !</h3>
                <p style={{ fontSize:14, color:"#64748b", lineHeight:1.6, margin:"0 0 20px" }}>
                  {agent.nom} a reçu votre demande avec vos coordonnées et vous recontactera prochainement.
                </p>
                <button onClick={()=>setShowContact(false)}
                  style={{ width:"100%", padding:"12px", borderRadius:11, border:"none", background:accentColor, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize:19, fontWeight:800, color:"#0f172a", margin:"0 0 4px" }}>Contacter {agent.nom}</h3>
                <p style={{ fontSize:13, color:"#64748b", margin:"0 0 18px", lineHeight:1.5 }}>
                  Laissez vos coordonnées : le prestataire les recevra et vous recontactera pour votre intervention.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div>
                    <label style={{ fontSize:12.5, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Votre nom *</label>
                    <input value={cForm.nom} onChange={e=>setCForm(f=>({...f,nom:e.target.value}))} placeholder="Nom et prénom"
                      style={{ width:"100%", padding:"11px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={{ fontSize:12.5, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Téléphone *</label>
                      <input value={cForm.telephone} onChange={e=>setCForm(f=>({...f,telephone:e.target.value}))} placeholder="22 345 678"
                        style={{ width:"100%", padding:"11px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:12.5, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Email</label>
                      <input value={cForm.email} onChange={e=>setCForm(f=>({...f,email:e.target.value}))} placeholder="vous@exemple.com"
                        style={{ width:"100%", padding:"11px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12.5, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Votre besoin</label>
                    <textarea value={cForm.message} onChange={e=>setCForm(f=>({...f,message:e.target.value}))} rows={3} placeholder="Décrivez brièvement l'intervention souhaitée…"
                      style={{ width:"100%", padding:"11px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical" }}/>
                  </div>
                  <button onClick={submitContact} disabled={cSending || !cForm.nom.trim() || (!cForm.telephone.trim() && !cForm.email.trim())}
                    style={{ width:"100%", padding:"13px", borderRadius:11, border:"none", background:accentColor, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"inherit", opacity:(cSending||!cForm.nom.trim()||(!cForm.telephone.trim()&&!cForm.email.trim()))?.5:1 }}>
                    {cSending ? "Envoi…" : "Envoyer ma demande"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── HERO BANNER ── */}
      <div style={{ position:"relative", height:300, overflow:"hidden" }}>
        <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0f172a 100%)" }}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(10,15,30,.35) 0%,rgba(10,15,30,.72) 100%)" }}/>
        <div style={{ position:"absolute", top:24, left:28, zIndex:10 }}>
          <Link to={backHref} style={{
            display:"inline-flex", alignItems:"center", gap:6,
            color:"rgba(255,255,255,.9)", fontWeight:600, fontSize:13,
            textDecoration:"none", background:"rgba(255,255,255,.12)",
            backdropFilter:"blur(6px)", padding:"7px 14px", borderRadius:8,
            border:"1px solid rgba(255,255,255,.2)",
          }}>
            <ArrowLeft size={14}/> {backLabel}
          </Link>
        </div>
      </div>

      {/* ── CARTE PROFIL flottante ── */}
      <div style={{ maxWidth:1100, margin:"-80px auto 0", padding:"0 20px", position:"relative", zIndex:10 }}>
        <div style={{ background:"#fff", borderRadius:20, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.13)", marginBottom:36 }}>
          <div style={{ height:5, background:`linear-gradient(90deg,${accentColor},${accentColor}66)` }}/>

          <div className="ap-hero-inner" style={{ display:"flex", alignItems:"flex-start", gap:28, padding:"28px 36px 26px" }}>
            {/* Avatar */}
            <div className="ap-hero-avatar" style={{ flexShrink:0, marginTop:-56 }}>
              {photoUrl ? (
                <img src={photoUrl} alt={agent.nom} style={{ width:110, height:110, objectFit:"cover", borderRadius:16, border:"4px solid #fff", boxShadow:"0 4px 18px rgba(0,0,0,.18)" }}/>
              ) : (
                <div style={{ width:110, height:110, borderRadius:16, background:accentColor, border:"4px solid #fff", boxShadow:"0 4px 18px rgba(0,0,0,.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, fontWeight:900, color:"#fff" }}>{initiale}</div>
              )}
            </div>

            {/* Infos */}
            <div className="ap-hero-info" style={{ flex:1, minWidth:0, paddingTop:4 }}>
              <h1 style={{ fontSize:22, fontWeight:900, color:"#0f172a", margin:0, letterSpacing:"-.02em" }}>{agent.nom}</h1>
              {isPartenaire && (agent.nom_civil || agent.prenom) && (
                <div style={{ fontSize:14.5, fontWeight:600, color:"#475569", marginTop:4 }}>
                  {[agent.nom_civil, agent.prenom].filter(Boolean).join(" ")}
                </div>
              )}
              <div className="ap-hero-badges" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginTop:8, marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:6, background: secteurMeta?.bg || "#eef2ff", color:accentColor, border:`1px solid ${accentColor}33` }}>
                  {roleLabel}
                </span>
                {isPartenaire && agent.metier_artisan && (
                  <span style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:6, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0" }}>
                    {agent.metier_artisan}
                  </span>
                )}
              </div>
              {(agent.gouvernorat || agent.localite) && (
                <div className="ap-hero-loc" style={{ display:"flex", alignItems:"center", gap:6, fontSize:13.5, color:"#64748b", marginBottom:14 }}>
                  <MapPin size={14} style={{ color:accentColor }}/>{[agent.localite, agent.gouvernorat].filter(Boolean).join(" · ")}
                </div>
              )}
              <div className="ap-hero-btns" style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {isPartenaire && (
                  <button type="button" onClick={()=>{
                      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                      if (!token) { navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`); return; }
                      setCSent(false); setShowContact(true);
                    }}
                    style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:10, fontSize:13.5, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit", background:accentColor, color:"#fff" }}>
                    <Mail size={15}/> Contacter {secteurMeta?.label || "le prestataire"}
                  </button>
                )}
                {agent.telephone && (
                  <a href={`tel:${agent.telephone}`} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 16px", borderRadius:10, fontSize:13.5, fontWeight:700, textDecoration:"none", background: isPartenaire ? "#f1f5f9" : accentColor, color: isPartenaire ? "#0f172a" : "#fff", border: isPartenaire ? "1px solid #e2e8f0" : "none" }}>
                    <Phone size={15}/> {agent.telephone}
                  </a>
                )}
                {agent.email && (
                  <a href={`mailto:${agent.email}`} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 16px", borderRadius:10, fontSize:13.5, fontWeight:700, textDecoration:"none", background:"#f1f5f9", color:"#0f172a", border:"1px solid #e2e8f0" }}>
                    <Mail size={15}/> {agent.email}
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="ap-hero-stats" style={{ flexShrink:0, display:"flex", gap:10 }}>
              {/* Annonces — toujours affiché */}
              <div style={{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:14, padding:"18px 10px", textAlign:"center", minWidth:96 }}>
                <div style={{ fontSize:30, fontWeight:900, color:accentColor, lineHeight:1 }}>{agent.nb_annonces}</div>
                <div style={{ fontSize:11.5, color:"#94a3b8", marginTop:5, fontWeight:600 }}>annonce{agent.nb_annonces !== 1 ? "s" : ""}</div>
              </div>

              {/* Note + missions — uniquement pour les prestataires/partenaires */}
              {isPartenaire && (
                <>
                  <div style={{ flex:1, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:14, padding:"18px 10px", textAlign:"center", minWidth:96 }}>
                    <div style={{ fontSize:30, fontWeight:900, color:"#f59e0b", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
                      <Star size={20} fill="#f59e0b" color="#f59e0b" />{agent.note != null ? Number(agent.note).toFixed(1) : "—"}
                    </div>
                    <div style={{ fontSize:11.5, color:"#b45309", marginTop:5, fontWeight:600 }}>note /5</div>
                  </div>
                  <div style={{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:14, padding:"18px 10px", textAlign:"center", minWidth:96 }}>
                    <div style={{ fontSize:30, fontWeight:900, color:accentColor, lineHeight:1 }}>{agent.nombre_interventions || 0}</div>
                    <div style={{ fontSize:11.5, color:"#94a3b8", marginTop:5, fontWeight:600 }}>intervention{(agent.nombre_interventions || 0) !== 1 ? "s" : ""}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {agent.adresse && (
            <div style={{ borderTop:"1px solid #f1f5f9", padding:"12px 36px", display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#64748b" }}>
              <Building2 size={13} style={{ color:"#94a3b8" }}/>{agent.adresse}
            </div>
          )}
        </div>

        {/* ── Annonces ── */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
          <div style={{ width:4, height:22, borderRadius:2, background:accentColor }}/>
          <h2 style={{ fontSize:18, fontWeight:800, color:"#0f172a", margin:0 }}>
            Annonces publiées
            <span style={{ fontSize:14, fontWeight:500, color:"#94a3b8", marginLeft:8 }}>({agent.nb_annonces})</span>
          </h2>
        </div>

        {agent.annonces.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, border:"1.5px dashed #e2e8f0", padding:"64px 24px", textAlign:"center", marginBottom:60 }}>
            <div style={{ width:64, height:64, borderRadius:16, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <Building2 size={28} style={{ color:"#cbd5e1" }}/>
            </div>
            <p style={{ fontWeight:700, color:"#374151", fontSize:15, margin:"0 0 6px" }}>Aucune annonce publiée</p>
            <p style={{ color:"#94a3b8", fontSize:13, margin:0 }}>Ce professionnel n'a pas encore publié d'annonces.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20, marginBottom:60 }}>
            {agent.annonces.map(a => <PropCard key={a.id} a={a}/>)}
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}
