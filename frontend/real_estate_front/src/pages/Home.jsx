import React, { useState, useEffect, useRef, useCallback } from "react";
import useLocalisation from "../hooks/useLocalisation";
import heroImg from "../assets/hero-localizi.png";
import statsIllustration from "../assets/localizi-stats-img.png";
import API_URL, { fmtDevise } from "../config";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, MapPin, Home, TrendingUp, Shield, Clock, Star,
  ArrowRight, Bed, Bath, Maximize, Zap, CheckCircle,
  Building2, Trees, ChevronRight, ChevronLeft, Play, Car, Users, Moon, Heart, X, Download, Smartphone, Wifi
} from "lucide-react";
import ReactDOM from "react-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnnonceModal from "../components/AnnonceModal";

/* ── Static demo data (remplace par API calls) ── */
const RECENT_PROPS = [
  {
    id: 1, titre: "Villa Moderne Prestige", prix: "850 000", devise: "TND",
    location: "La Marsa, Tunis", beds: 4, baths: 3, area: 320,
    type: "villa", categorie: "Vente", boost: 3,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    lat: 36.879, lng: 10.325,
  },
  {
    id: 2, titre: "Appartement S+3 Neuf", prix: "320 000", devise: "TND",
    location: "Les Berges du Lac, Tunis", beds: 3, baths: 2, area: 145,
    type: "appartement", categorie: "Vente", boost: 2,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    lat: 36.838, lng: 10.235,
  },
  {
    id: 3, titre: "Terrain Résidentiel Viabilisé", prix: "180 000", devise: "TND",
    location: "Sousse Nord", beds: null, baths: null, area: 500,
    type: "terrain", categorie: "Vente", boost: 0,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    lat: 35.870, lng: 10.590,
  },
  {
    id: 4, titre: "Appartement Meublé Vue Mer", prix: "1 800", devise: "TND/mois",
    location: "Hammamet", beds: 2, baths: 1, area: 85,
    type: "appartement", categorie: "Location", boost: 2,
    image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80",
    lat: 36.400, lng: 10.620,
  },
  {
    id: 5, titre: "Villa avec Piscine", prix: "3 500", devise: "TND/sem.",
    location: "Djerba", beds: 5, baths: 3, area: 280,
    type: "villa", categorie: "Vacances", boost: 3,
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80",
    lat: 33.830, lng: 10.870,
  },
  {
    id: 6, titre: "Bureau Open Space Moderne", prix: "2 500", devise: "TND/mois",
    location: "Centre Urbain Nord, Tunis", beds: null, baths: 2, area: 220,
    type: "bureau", categorie: "Location", boost: 1,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    lat: 36.855, lng: 10.194,
  },
];

/* ── Mini-carte Leaflet centrée sur la Tunisie ── */
function HomeTunisiaMap({ props: annonces }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      /* Cadrage automatique sur la Tunisie */
      map.fitBounds([[30.2, 7.5], [37.5, 11.6]], { padding: [18, 18] });

      annonces.forEach(p => {
        if (!p.lat || !p.lng) return;

        /* Couleur selon niveau de boost */
        const color =
          p.boost >= 3 ? "#ea580c" :
          p.boost >= 2 ? "#f59e0b" :
          p.boost >= 1 ? "#6366f1" : "#64748b";

        const prefix = p.boost >= 3 ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z"/></svg>` : "";

        const html = `
          <div style="
            background:${color}; color:#fff;
            font-size:11px; font-weight:800; letter-spacing:-.2px;
            padding:5px 11px; border-radius:20px;
            box-shadow:0 3px 10px rgba(0,0,0,.28);
            white-space:nowrap; display:inline-flex; align-items:center; gap:4px;
            font-family:'Plus Jakarta Sans',system-ui,sans-serif;
            border:2px solid rgba(255,255,255,.35);
          ">${prefix}${p.prix}<span style="font-size:9px;opacity:.8;margin-left:1px">${p.devise.replace("/mois","").replace("/sem.","")}</span></div>`;

        const icon = L.divIcon({ className: "", html, iconSize: null, iconAnchor: [0, 0] });
        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${p.titre}</b><br>${p.location}`, { closeButton: false });
      });
    })();
    return () => { live = false; };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Badge pays */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 1000,
        background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
        padding: "5px 12px", borderRadius: 20,
        fontSize: 12, fontWeight: 700, color: "#0f172a",
        boxShadow: "0 2px 10px rgba(0,0,0,.12)",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        📍 Tunisie
      </div>
      <div ref={containerRef} style={{
        height: 310, width: "100%",
        borderRadius: 16, overflow: "hidden",
      }}/>
    </div>
  );
}

const STATS = [
  { value: "12 500+", label: "Annonces actives",   icon: <Home size={28} /> },
  { value: "8 200+",  label: "Clients satisfaits",  icon: <Star size={28} /> },
  { value: "98%",     label: "Taux de satisfaction", icon: <TrendingUp size={28} /> },
  { value: "24/7",    label: "Support disponible",   icon: <Clock size={28} /> },
];

const TYPES = [
  { label: "Appartement",         icon: <Building2 size={32}/>, href: "/carte?type=appartement",      color: "#6366f1" },
  { label: "Villa / Maison",      icon: <Home size={32}/>,      href: "/carte?type=villa",             color: "#00B47D" },
  { label: "Terrain",             icon: <Trees size={32}/>,     href: "/carte?type=terrain",           color: "#F5A623" },
  { label: "Bureau",              icon: <Building2 size={32}/>, href: "/carte?type=bureau",            color: "#FF6B35" },
  { label: "Local commercial",    icon: <Building2 size={32}/>, href: "/carte?type=local_commercial",  color: "#8b5cf6" },
  { label: "Immeuble",            icon: <Building2 size={32}/>, href: "/carte?type=immeuble",          color: "#0ea5e9" },
  { label: "Ferme agricole",      icon: <Trees size={32}/>,     href: "/carte?type=ferme_agricole",    color: "#16a34a" },
  { label: "Garage / Parking",    icon: <Car size={32}/>,       href: "/carte?type=garage_parking",    color: "#64748b" },
  { label: "Dépôt / Stockage",    icon: <Building2 size={32}/>, href: "/carte?type=depot_stockage",    color: "#92400e" },
  { label: "Immobiliers divers",  icon: <ChevronRight size={32}/>, href: "/carte",                     color: "#475569" },
];

const FEATURES = [
  { icon: <MapPin size={20} />,    title: "Carte interactive",        desc: "Visualisez tous les biens sur une carte en temps réel avec zoom et sélection de zones." },
  { icon: <Zap size={20} />,       title: "Publication rapide",       desc: "Créez et publiez votre annonce en quelques minutes et touchez des milliers d'acheteurs." },
  { icon: <Shield size={20} />,    title: "Sécurisé & vérifié",       desc: "Chaque annonce est vérifiée par notre équipe pour garantir la fiabilité des offres." },
  { icon: <TrendingUp size={20} />,title: "Statistiques en temps réel",desc: "Suivez vos vues, contacts et performances d'annonces depuis votre tableau de bord." },
];

/* ── Gouvernorat cards data — triés par ordre alphabétique ── */
const GOV_CARDS = [
  { nom:"ARIANA",      display:"Ariana",      img:"https://kapitalis.com/tunisie/wp-content/uploads/2021/05/08-2-1024x768-1.jpg",                                      color:"#0e7490" },
  { nom:"BEJA",        display:"Béja",        img:"https://www.shutterstock.com/image-photo/beja-tunisia-april-07-2023-260nw-2272834149.jpg",                                      color:"#166534" },
  { nom:"BEN AROUS",   display:"Ben Arous",   img:"https://www.nessma.tv/uploads/news/48/2026-04/412691d186bdc8d0128ff2d4d1421eda.jpg",                                         color:"#4338ca" },
  { nom:"BIZERTE",     display:"Bizerte",     img:"https://media.istockphoto.com/id/1367865863/fr/photo/bizerte-tunisie-afrique-du-nord-bateaux-de-p%C3%AAche-accostent-au-bord-de-leau-ville-portuaire.jpg?s=612x612&w=0&k=20&c=GMbVO13CE35Jv8Mc_2PlCUHKC3ikTetXRWPC0V3PWM8=", color:"#0369a1" },
  { nom:"GABES",       display:"Gabès",       img:"https://www.leconomistemaghrebin.com/wp-content/uploads/2023/02/Gabes-tourisme.jpg",             color:"#14532d" },
  { nom:"GAFSA",       display:"Gafsa",       img:"https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/80/a6/06/piscinas-romanas-de-gafsa.jpg?w=600&h=-1&s=1",             color:"#9a3412" },
  { nom:"JENDOUBA",    display:"Jendouba",    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Barrage_beni_mtir_7.jpg/1920px-Barrage_beni_mtir_7.jpg", color:"#92400e" },
  { nom:"KAIROUAN",    display:"Kairouan",    img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAUYc78FbsLdPCPI50CRDdRj_-liiGYo6i0Q&s", color:"#9a3412" },
  { nom:"KASSERINE",   display:"Kasserine",   img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFX7EUI8bhARYGpJ4yVp6NIX7tOyfbxuDcAw&s",      color:"#78350f" },
  { nom:"KEBILI",      display:"Kébili",      img:"https://cdn.nawaat.org/wp-content/uploads/2012/01/rond-point_kebili.jpg",                                         color:"#92400e" },
  { nom:"KEF",         display:"Le Kef",      img:"https://www.tunisie.co/uploads/images/content/kasbakef-041019-4.jpg",    color:"#7c3aed" },
  { nom:"MAHDIA",      display:"Mahdia",      img:"https://i.pinimg.com/736x/6e/34/cc/6e34cc427cfedfdc5d649b17100c9f3c.jpg",                  color:"#0e7490" },
  { nom:"MANOUBA",     display:"Manouba",     img:"https://www.tunisie-tribune.com/wp-content/uploads/2017/06/agriculture-eau.jpg",                                         color:"#166534" },
  { nom:"MEDENINE",    display:"Médenine",    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Centre_ville_de_Medenine.JPG/1280px-Centre_ville_de_Medenine.JPG",           color:"#92400e" },
  { nom:"MONASTIR",    display:"Monastir",    img:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=75",                                         color:"#1e40af" },
  { nom:"NABEUL",      display:"Nabeul",      img:"https://www.climamed.eu/wp-content/uploads/2021/02/nabeul-1024x688.jpg",                                       color:"#0369a1" },
  { nom:"SFAX",        display:"Sfax",        img:"https://tunisie.co/uploads/images/content/sfax-060219-v.jpg",             color:"#92400e" },
  { nom:"SIDI BOUZID", display:"Sidi Bouzid", img:"https://www.opinion-internationale.com/wp-content/uploads/2014/07/sidi.jpg",                                      color:"#166534" },
  { nom:"SILIANA",     display:"Siliana",     img:"https://i.ytimg.com/vi/RNed3a-f1b8/maxresdefault.jpg",                                      color:"#14532d" },
  { nom:"SOUSSE",      display:"Sousse",      img:"https://www.ccicentre.org.tn/wp-content/uploads/2019/07/14216.jpg",                                      color:"#0c4a6e" },
  { nom:"TATAOUINE",   display:"Tataouine",   img:"https://www.les-covoyageurs.com/ressources/images-lieux/photo-lieu-1540-3.jpg", color:"#78350f" },
  { nom:"TOZEUR",      display:"Tozeur",      img:"https://media.routard.com/image/95/3/pt82944.1291953.w1000.jpg",           color:"#b45309" },
  { nom:"TUNIS",       display:"Tunis",       img:"https://upload.wikimedia.org/wikipedia/commons/9/98/Tour_de_l%27Horloge_du_centre-ville_de_Tunis_03.jpg",           color:"#1e40af" },
  { nom:"ZAGHOUAN",    display:"Zaghouan",    img:"https://www.tunisieindustrie.nat.tn/fr/images/mono/zaghouan1.jpg",                                              color:"#4d7c0f" },
];

/* ── Lightbox portal ── */
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx || 0);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") setIdx(i=>(i-1+images.length)%images.length); if (e.key === "ArrowRight") setIdx(i=>(i+1)%images.length); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:40,height:40,cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <X size={20}/>
      </button>
      <button onClick={e=>{e.stopPropagation();setIdx(i=>(i-1+images.length)%images.length);}}
        style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:44,height:44,cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",opacity:images.length>1?1:0}}>
        <ChevronLeft size={22}/>
      </button>
      <img onClick={e=>e.stopPropagation()} src={images[idx]} alt="" style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:8,boxShadow:"0 8px 40px rgba(0,0,0,.6)"}}/>
      <button onClick={e=>{e.stopPropagation();setIdx(i=>(i+1)%images.length);}}
        style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:44,height:44,cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",opacity:images.length>1?1:0}}>
        <ChevronRight size={22}/>
      </button>
      {images.length > 1 && (
        <div style={{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>
          {images.map((_,i) => <span key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{width:8,height:8,borderRadius:"50%",cursor:"pointer",background:i===idx?"#fff":"rgba(255,255,255,.35)",transition:"background .15s"}}/>)}
        </div>
      )}
      {images.length > 1 && <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",color:"rgba(255,255,255,.7)",fontSize:13,fontWeight:600}}>{idx+1} / {images.length}</div>}
    </div>,
    document.body
  );
}

/* ── Property card ── */
function PropCard({ p, delay = 0, onOpen }) {
  const isNew = p.date_creation && (Date.now() - new Date(p.date_creation).getTime()) < 7 * 24 * 3600 * 1000;
  const realId = String(p.id).replace("api_", "");
  const images = p.images && p.images.length > 0 ? p.images : [p.image];
  /* p.prix peut être un nombre OU une chaîne déjà formatée ("850 000") → on extrait l'entier */
  const prixNum = typeof p.prix === "number" ? p.prix : Number(String(p.prix ?? "").replace(/[^0-9]/g, ""));
  const [imgIdx,    setImgIdx]  = useState(0);
  const [prevImg,   setPrevImg] = useState(null);
  const [slideDir,  setSlideDir]= useState(1);
  const [sliding,   setSliding] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const goSlide = (delta) => {
    if (sliding || images.length < 2) return;
    const next = (imgIdx + delta + images.length) % images.length;
    setSlideDir(delta);
    setPrevImg(imgIdx);
    setImgIdx(next);
    setSliding(true);
    setTimeout(() => { setPrevImg(null); setSliding(false); }, 420);
  };
  const goToSlide = (i) => {
    if (sliding || i === imgIdx) return;
    setSlideDir(i > imgIdx ? 1 : -1);
    setPrevImg(imgIdx);
    setImgIdx(i);
    setSliding(true);
    setTimeout(() => { setPrevImg(null); setSliding(false); }, 420);
  };
  const [isFav, setIsFav] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_favs")||"[]").includes(Number(realId)||realId); } catch { return false; }
  });
  const prixM2 = (p.area > 0 && prixNum > 0) ? (() => {
    const v = Math.ceil((prixNum / p.area) * 10) / 10;
    return v > 0 ? v.toLocaleString("fr-TN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null;
  })() : null;

  const toggleFav = (e) => {
    e.stopPropagation();
    const next = !isFav;
    setIsFav(next);
    try {
      const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
      const updated = next ? [...new Set([...favs, Number(realId)||realId])] : favs.filter(x => String(x) !== String(realId));
      localStorage.setItem("localizi_favs", JSON.stringify(updated));
    } catch {}
  };

  return (
    <>
    {lightbox !== null && <Lightbox images={images} startIdx={lightbox} onClose={()=>setLightbox(null)}/>}
    <div className="hp-card" style={{ animationDelay: `${delay}ms`, cursor:"pointer" }} onClick={() => onOpen(realId)}>
      <div className="hp-card__img-wrap">
        {/* Image sortante */}
        {prevImg !== null && (
          <img src={images[prevImg]} alt="" style={{
            position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            animation:`carouselOut${slideDir>0?"L":"R"} .42s cubic-bezier(.4,0,.2,1) forwards`,
            zIndex:1,
          }}/>
        )}
        {/* Image entrante */}
        <img key={imgIdx} src={images[imgIdx]} alt={p.titre} loading="lazy" style={{
          position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
          animation: prevImg !== null
            ? `carouselIn${slideDir>0?"L":"R"} .42s cubic-bezier(.4,0,.2,1) forwards`
            : "none",
          zIndex:2,
        }}/>
        {isNew && <span className="hp-card__new" style={{zIndex:5}}>NOUVEAU</span>}
        {p.spotlight && (
          <span style={{position:"absolute",bottom:8,left:8,background:"rgba(234,88,12,.92)",color:"#fff",borderRadius:7,padding:"3px 8px",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",gap:3,backdropFilter:"blur(4px)",zIndex:5,letterSpacing:".03em"}}>
            ⭐ À ne pas manquer
          </span>
        )}

        {/* Label Colocation — haut gauche */}
        {p.colocation && (
          <span style={{position:"absolute",top:8,left:8,background:"rgba(99,102,241,.9)",color:"#fff",borderRadius:7,padding:"3px 7px",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:3,backdropFilter:"blur(4px)",zIndex:5}}>
            <Users size={10}/> Colocation
          </span>
        )}

        {/* Label catégorie + cœur — haut droite, en colonne */}
        <div style={{position:"absolute",top:8,right:8,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,zIndex:5}}>
          {p.categorie && (
            <span className={`hp-card__cat hp-card__cat--${p.categorie}`}>
              {p.categorie === "location" ? "Location" : p.categorie === "vacances" ? "Vacances" : "Vente"}
            </span>
          )}
          <button className="hp-card__fav" onClick={toggleFav} title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}>
            <Heart size={14} fill={isFav ? "#ef4444" : "none"} color={isFav ? "#ef4444" : "#64748b"}/>
          </button>
        </div>

        {/* Carousel arrows */}
        {images.length > 1 && <>
          <button onClick={e=>{e.stopPropagation();goSlide(-1);}}
            style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,.42)",backdropFilter:"blur(4px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.15)",zIndex:4}}>
            <ChevronLeft size={13}/>
          </button>
          <button onClick={e=>{e.stopPropagation();goSlide(+1);}}
            style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,.42)",backdropFilter:"blur(4px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.15)",zIndex:4}}>
            <ChevronRight size={13}/>
          </button>
          <div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:4}}>
            {images.map((_,i)=><span key={i} onClick={e=>{e.stopPropagation();goToSlide(i);}} style={{width:5,height:5,borderRadius:"50%",cursor:"pointer",background:i===imgIdx?"#fff":"rgba(255,255,255,.45)",transition:"background .2s"}}/>)}
          </div>
        </>}
        {/* Clic sur l'image → lightbox */}
        <div onClick={e=>{e.stopPropagation();setLightbox(imgIdx);}}
          style={{position:"absolute",inset:0,zIndex:3,cursor:"zoom-in"}}/>
        <button className="hp-card__fav" onClick={toggleFav} title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"} style={{zIndex:4}}>
          <Heart size={14} fill={isFav ? "#ef4444" : "none"} color={isFav ? "#ef4444" : "#64748b"}/>
        </button>
      </div>
      <div className="hp-card__body">
        <div style={{flex:1}}>
          <p className="hp-card__title">{p.titre}</p>
          <p className="hp-card__location"><MapPin size={12}/> {p.location}</p>
          {(p.beds != null || p.pieces != null || p.baths != null || p.area || p.garage || (p.categorie === "vacances" && (p.capacite_accueil || p.duree_valeur))) && (
            <div className="hp-card__specs">
              {p.pieces != null && <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> {p.pieces} p.</span>}
              {p.beds   != null && <span><Bed size={12}/> {p.beds} ch.</span>}
              {p.baths  != null && <span><Bath size={12}/> {p.baths} sdb</span>}
              {p.area            && <span><Maximize size={12}/> {p.area} m²</span>}
              {p.garage          && <span><Car size={12}/> Garage</span>}
              {p.categorie === "vacances" && p.capacite_accueil && <span><Users size={12}/> {p.capacite_accueil} pers.</span>}
              {p.categorie === "vacances" && p.duree_valeur && p.duree_type && <span><Moon size={12}/> {p.duree_valeur} {p.duree_type === "nuit" ? "nuit(s) min" : p.duree_type === "semaine" ? "sem. min" : p.duree_type === "mois" ? "mois min" : "an min"}</span>}
            </div>
          )}
        </div>
        <div className="hp-card__footer">
          <div>
            <div className="hp-card__price">{!prixNum ? "Prix sur demande" : prixNum.toLocaleString("fr-TN")} {prixNum ? <span className="hp-card__devise">{p.devise}</span> : null}</div>
            {prixM2 && <div className="hp-card__price-m2">{prixM2} {p.devise}/m²</div>}
          </div>
          <span className="hp-card__cta">Voir <ArrowRight size={13} /></span>
        </div>
      </div>
    </div>
    </>
  );
}

/* ── Gouvernorat Card ── */
function GovCard({ gov }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);

  return (
    <div
      className="hp-gov-card"
      style={{ "--gov-color": gov.color }}
      onClick={() => navigate(`/carte?gouvernorat=${encodeURIComponent(gov.nom)}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && navigate(`/carte?gouvernorat=${encodeURIComponent(gov.nom)}`)}
    >
      {!err ? (
        <img
          src={gov.img}
          alt={gov.nom}
          loading="lazy"
          onError={() => setErr(true)}
          className="hp-gov-card__img"
        />
      ) : (
        <div className="hp-gov-card__fallback" style={{ background: gov.color }} />
      )}
      <div className="hp-gov-card__overlay" />
      <div className="hp-gov-card__content">
        <span className="hp-gov-card__name">{gov.display || gov.nom}</span>
        <span className="hp-gov-card__cta">Explorer <ArrowRight size={12}/></span>
      </div>
    </div>
  );
}

/* ── Stat Card with animated counter ── */
function StatCard({ value, suffix, label, sub, svgPath, visible, delay }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const duration = 1800;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    const timer = setTimeout(() => requestAnimationFrame(step), delay);
    return () => clearTimeout(timer);
  }, [visible, value, delay]);

  return (
    <div className="hp-stat-card">
      <div className="hp-stat-card__number">
        <span className="hp-stat-card__count">{visible ? count : 0}</span>
        <span className="hp-stat-card__suffix">{suffix}</span>
      </div>
      <div className="hp-stat-card__label">{label}</div>
      <div className="hp-stat-card__sub">{sub}</div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function HomePage() {
  const [activeTab,  setActiveTab]  = useState("vente");
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const [query, setQuery] = useState("");
  const [selectedGov, setSelectedGov] = useState("");
  const { gouvernorats: apiGouvernorats } = useLocalisation({ gouvernorat:"", delegation:"", localite:"" });
  const [recentAnnonces, setRecentAnnonces] = useState([]);
  const [modalId, setModalId] = useState(null);

  /* Capture PWA install prompt */
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); window._lzInstallPrompt = e; };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  /* Scroll reveal animations */
  useEffect(() => {
    const els = document.querySelectorAll('.hp-reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('hp-reveal--on'); obs.unobserve(e.target); }
      }),
      { threshold: 0.10 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Observer stats section — re-animate chaque fois que la section entre dans le viewport */
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { setStatsVisible(entry.isIntersecting); },
      { threshold: 0.2 }
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  /* Charger les annonces réelles les plus récentes */
  useEffect(() => {
    fetch(`${API_URL}/annonces/public?limit=6`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRecentAnnonces(data.map(a => ({
            id:       `api_${a.id}`,
            _realId:  a.id,
            titre:    a.titre,
            prix:     Number(a.prix).toLocaleString("fr-TN"),
            devise:   fmtDevise(a.devise),
            location: [a.localite, a.delegation, a.gouvernorat].filter(Boolean).join(", ") || "Tunisie",
            beds:             a.nb_chambres,
            pieces:           a.nb_pieces,
            baths:            a.nb_salles_bain,
            garage:           a.garage || a.parking,
            area:             a.superficie,
            type:             a.type_bien || "",
            categorie:        a.categorie || "vente",
            boost:            a.boost_level || 0,
            spotlight:        a.spotlight_active || false,
            date_creation:    a.date_creation || null,
            duree_type:       a.duree_type   || null,
            duree_valeur:     a.duree_valeur || null,
            capacite_accueil: a.capacite_accueil || null,
            image:    a.image_principale
              ? (a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`)
              : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
            images:   (a.images && a.images.length > 0)
              ? a.images.map(ph => ph.startsWith("http") ? ph : `${API_URL}${ph}`)
              : (a.image_principale ? [a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`] : []),
            colocation: a.colocation || false,
            lat: a.latitude, lng: a.longitude,
          })));
        }
      })
      .catch(() => {});
  }, []);

  /* (stats observer already set above — this duplicate removed) */

  /* Détection hiérarchique partagée : gouvernorat → délégation → localité */
  const buildLocParams = async (text, categorie) => {
    const params = new URLSearchParams();
    params.set("categorie", categorie || activeTab);
    try {
      const res = await fetch(`${API_URL}/localisation/search?q=${encodeURIComponent(text.trim())}`);
      if (res.ok) {
        const loc = await res.json();
        if (loc?.gouvernorat)    params.set("gouvernorat", loc.gouvernorat);
        if (loc?.delegation)     params.set("delegation",  loc.delegation);
        if (loc?.localite)       params.set("localite",    loc.localite);
        if (loc?.gouvernorat_id) params.set("govId",       String(loc.gouvernorat_id));
        if (loc?.delegation_id)  params.set("delId",       String(loc.delegation_id));
        if (loc?.localite_id)    params.set("locId",       String(loc.localite_id));
      }
    } catch {}
    return params;
  };

  const handleTagClick = async (tag) => {
    const params = await buildLocParams(tag, activeTab);
    window.location.href = `/carte?${params.toString()}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (selectedGov) {
      // Select gouvernorat explicite → pas besoin de détection
      const params = new URLSearchParams();
      params.set("categorie", activeTab);
      params.set("gouvernorat", selectedGov);
      // pas de q : on ne remplit que le select gouvernorat
      window.location.href = `/carte?${params.toString()}`;
    } else if (query.trim()) {
      const params = await buildLocParams(query.trim(), activeTab);
      window.location.href = `/carte?${params.toString()}`;
    } else {
      window.location.href = `/carte?categorie=${activeTab}`;
    }
  };

  return (
    <div className="hp">
      <Navbar />

      {/* ── HERO ── */}
      <section className="hp-hero">
        <div className="hp-hero__bg" />
        <div className="hp-hero__overlay" />
        <div className="hp-hero__content animate-fadeInUp">
          <h1 className="hp-hero__title">
            Trouvez votre<br />
            <span className="hp-hero__highlight">propriété idéale</span>
          </h1>
          <p className="hp-hero__sub">
            Appartements · Villas · Terrains · Bureaux à travers toute la Tunisie
          </p>

          {/* Search box */}
          <div className="hp-search">
            <div className="hp-search__tabs">
              {[
                { val:"vente",    lbl:"Achat"    },
                { val:"location", lbl:"Location" },
                { val:"vacances", lbl:"Vacances" },
              ].map(({ val, lbl }) => (
                <button
                  key={val}
                  onClick={() => setActiveTab(val)}
                  className={`hp-search__tab${activeTab === val ? " hp-search__tab--active" : ""}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <form className="hp-search__box" onSubmit={handleSearch}>
              <div className="hp-search__field">
                <MapPin size={18} className="hp-search__pin" />
                <input
                  type="text"
                  placeholder="Ville, quartier…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="hp-search__input"
                />
              </div>
              <select
                value={selectedGov}
                onChange={e => setSelectedGov(e.target.value)}
                className="hp-search__gov-select"
              >
                <option value="">Tous les gouvernorats</option>
                {apiGouvernorats.map(g => (
                  <option key={g.value} value={g.label}>{g.label}</option>
                ))}
              </select>
              <button type="submit" className="hp-search__btn">
                <Search size={18} /> Rechercher
              </button>
            </form>
            <div className="hp-search__hint">
              <span>Populaire :</span>
              {["Tunis", "Sousse", "Sfax", "La Marsa", "Nabeul"].map((c) => (
                <button key={c} type="button" onClick={() => handleTagClick(c)} className="hp-search__tag">{c}</button>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ── TYPES ── */}
      <section className="hp-types section-sm" style={{background:"#fff"}}>
        <div className="container">
          <div className="section-header hp-reveal">
            <span className="section-eyebrow">Catégories</span>
            <h2>Explorer par type de bien</h2>
          </div>
          <div className="hp-types__grid hp-reveal" style={{transitionDelay:".12s"}}>
            {TYPES.map((t, i) => (
              <Link to={t.href} key={t.label} className="hp-type-card" style={{ "--acc": t.color, animationDelay: `${i * 80}ms` }}>
                <div className="hp-type-card__icon">{t.icon}</div>
                <h3 className="hp-type-card__label">{t.label}</h3>
                <span className="hp-type-card__link">Explorer <ChevronRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ANIMÉES ── */}
      <section ref={statsRef} className="hp-stats-section">
        <div className="hp-stats-section__bg-pattern" aria-hidden="true" />
        <div className="container" style={{position:"relative",zIndex:1}}>
          <div className="hp-stats-headline hp-reveal">
            <span className="hp-stats-eyebrow">Localizi.tn en chiffres</span>
            <h2 className="hp-stats-title">La plateforme qui couvre<br/><em>toute la Tunisie</em></h2>
            <p className="hp-stats-desc">Des milliers de biens, des dizaines de critères, une couverture nationale — tout ça, gratuitement.</p>
          </div>
          <div className="hp-stats-grid" style={{marginLeft:"-40px"}}>
            {[
              { value: 24,  suffix: "",  label: "Gouvernorats couverts",      sub: "Couverture nationale",  svgPath: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" },
              { value: 30,  suffix: "+", label: "Critères de recherche",       sub: "Superficie, étage…",    svgPath: "M3 6h18M7 12h10M11 18h2" },
              { value: 10,  suffix: "",  label: "Types de bien",               sub: "Villa, terrain, bureau…",svgPath: "M8 2v4 M16 2v4 M3 10h18 M3 6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H3z" },
              { value: 100, suffix: "%", label: "Gratuit pour acheteurs",      sub: "0 commission",          svgPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
              { value: 48,  suffix: "h", label: "Délai de réponse moyen",      sub: "Annonces vérifiées",    svgPath: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2" },
              { value: 100, suffix: "%", label: "Tunisienne(s)",               sub: "Équipe · Compétences",        svgPath: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" },
            ].map((s, i) => (
              <StatCard key={s.label} {...s} visible={statsVisible} delay={i * 130} />
            ))}
          </div>
        </div>
        {/* Illustration flottante – bord droit de la section, ne touche pas la grille */}
        <img
          src={statsIllustration}
          alt=""
          aria-hidden="true"
          className="hp-stats-illustration"
          style={{
            position:"absolute", right:"-160px", bottom:"0px",
            zIndex:2,
            height:"58%", width:"auto",
            filter:"drop-shadow(0 16px 48px rgba(99,102,241,.35))",
            pointerEvents:"none", userSelect:"none",
          }}
        />
      </section>

      {/* ── RECENT PROPERTIES ── */}
      <section className="hp-recent section" style={{background:"#f4f6fa"}}>
        <div className="container">
          <div className="section-header hp-reveal">
            <span className="section-eyebrow">En vedette</span>
            <h2>Annonces récentes</h2>
            <p>Découvrez les dernières annonces publiées</p>
          </div>

          <div className="hp-recent__grid hp-reveal" style={{transitionDelay:".1s"}}>
            {(recentAnnonces.length > 0 ? recentAnnonces : RECENT_PROPS).map((p, i) => <PropCard key={p.id} p={p} delay={i * 60} onOpen={setModalId} />)}
          </div>

          <div className="text-center mt-24">
            <Link to="/carte" className="btn btn-outline btn-lg btn-round">
              Voir toutes les annonces <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── GOUVERNORATS ── */}
      <section className="hp-gov section" style={{background:"#fff"}}>
        <div className="container">
          <div className="section-header hp-reveal">
            <span className="section-eyebrow">🇹🇳 Explorer la Tunisie</span>
            <h2>Cherchez par gouvernorat</h2>
            <p>Cliquez sur un gouvernorat pour voir toutes ses annonces immobilières</p>
          </div>
          <div className="hp-gov__grid hp-reveal" style={{transitionDelay:".1s"}}>
            {GOV_CARDS.map(gov => <GovCard key={gov.nom} gov={gov} />)}
          </div>
        </div>
      </section>

      {/* ── MAP CTA ── */}
      <section className="hp-map-cta section" style={{background:"#0f172a"}}>
        <div className="container">
          <div className="hp-map-cta__inner">
            <div className="hp-map-cta__text">
              <span className="section-eyebrow" style={{display:"inline-block",background:"rgba(99,102,241,.18)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,.35)",borderRadius:20,padding:"6px 16px"}}>Carte interactive</span>
              <h2 style={{color:"#fff",fontSize:"clamp(30px,3.5vw,46px)",marginTop:16,marginBottom:18,fontWeight:800,lineHeight:1.1}}>
                Explorez tous les biens<br/>directement sur la carte
              </h2>
              <p style={{color:"#cbd5e1",fontSize:"18px",lineHeight:1.7,marginBottom:24,fontWeight:500}}>
                Visualisez toutes les annonces géolocalisées, zoomez sur votre quartier,
                dessinez une zone de recherche et consultez les offres en temps réel.
              </p>
              <ul className="hp-map-cta__checks">
                {[
                  "Prix visibles directement sur chaque punaise",
                  "Filtres : type de bien, prix, superficie",
                  "Dessinez une zone libre sur la carte",
                  "Navigation par gouvernorat avec contours",
                ].map((c) => (
                  <li key={c} style={{color:"#fff",fontWeight:600}}>
                    <CheckCircle size={20} style={{color:"#fff",flexShrink:0}} />{c}
                  </li>
                ))}
              </ul>
              <div className="flex gap-12 mt-24">
                <Link to="/carte" style={{
                  display:"inline-flex",alignItems:"center",gap:10,
                  background:"#6366f1",color:"#fff",
                  padding:"16px 36px",borderRadius:50,
                  fontSize:17,fontWeight:800,
                  border:"2px solid #818cf8",
                  boxShadow:"0 4px 24px rgba(99,102,241,.5)",
                  transition:"all .2s",textDecoration:"none",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(99,102,241,.7)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 24px rgba(99,102,241,.5)";}}
                >
                  <MapPin size={19}/> Ouvrir la carte
                </Link>
                <Link to="/carte?vue=liste" style={{
                  display:"inline-flex",alignItems:"center",gap:10,
                  background:"transparent",color:"#e2e8f0",
                  padding:"16px 36px",borderRadius:50,
                  fontSize:17,fontWeight:700,
                  border:"2px solid #475569",
                  transition:"all .2s",textDecoration:"none",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#94a3b8";e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#475569";e.currentTarget.style.color="#e2e8f0";}}
                >
                  Vue liste <ChevronRight size={18}/>
                </Link>
              </div>
            </div>
            <div className="hp-map-cta__visual">
              <Link to="/carte" style={{display:"block",width:"100%",height:"100%",position:"absolute",inset:0,zIndex:10}} aria-label="Ouvrir la carte interactive" />
              <HomeTunisiaMap props={RECENT_PROPS} />
              {/* Légende flottante */}
              <div className="hp-map-cta__legend">
                <span className="hp-map-cta__leg-item hp-map-cta__leg-item--std">Vente</span>
                <span className="hp-map-cta__leg-item hp-map-cta__leg-item--loc">Location</span>
                <span className="hp-map-cta__leg-item hp-map-cta__leg-item--vac">Vacances</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="hp-features section" style={{background:"#fff"}}>
        <div className="container">
          <div className="section-header hp-reveal">
            <span className="section-eyebrow">Pourquoi Localizi.tn ?</span>
            <h2>La plateforme immobilière la plus avancée</h2>
          </div>
          <div className="hp-features__grid hp-reveal" style={{transitionDelay:".1s"}}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="hp-feature" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="hp-feature__icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modal annonce ── */}
      {modalId && <AnnonceModal annonceId={modalId} onClose={() => setModalId(null)} />}

      {/* ── Bouton flottant Aide & FAQ ── */}
      <Link to="/faq" className="hp-faq-fab" style={{
        position:"fixed", bottom:28, right:28, zIndex:9999,
        display:"flex", alignItems:"center", gap:10,
        background:"#fff", color:"#0a0a0a",
        border:"2.5px solid #0a0a0a",
        borderRadius:50, padding:"13px 22px",
        fontWeight:800, fontSize:15,
        boxShadow:"0 4px 20px rgba(0,0,0,.18)",
        textDecoration:"none",
        transition:"all .18s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.background="#0a0a0a";e.currentTarget.style.color="#fff";}}
        onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="#0a0a0a";}}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
        Aide &amp; FAQ
      </Link>

      {/* ── AGENT / AGENCE SECTION ── */}
      <section className="hp-agents-section">
        <div className="hp-agents-section__img-col hp-reveal">
          <img
            src="/images/agent-reunion.png"
            alt="Agents immobiliers Localizi.tn"
            className="hp-agents-section__photo"
            onError={e => { e.currentTarget.style.display="none"; }}
          />
          <div className="hp-agents-section__img-scrim" />
        </div>
        <div className="hp-agents-section__content hp-reveal" style={{transitionDelay:".18s"}}>
          <span style={{
            display:"inline-block", fontSize:12, fontWeight:700, letterSpacing:"1.5px",
            textTransform:"uppercase", color:"#a5b4fc",
            background:"rgba(99,102,241,.18)", border:"1px solid rgba(99,102,241,.35)",
            borderRadius:20, padding:"6px 16px", marginBottom:16,
          }}>Accompagnement professionnel</span>
          <h2 style={{color:"#fff",fontSize:"clamp(28px,3vw,46px)",fontWeight:900,lineHeight:1.1,marginBottom:20}}>
            Achetez ou vendez avec<br/>un agent de confiance
          </h2>
          <p style={{fontSize:18,color:"#cbd5e1",lineHeight:1.8,marginBottom:28,fontWeight:500}}>
            Nos agents et agences partenaires vous guident à chaque étape : évaluation du bien,
            négociation, paperasse administrative et signature chez le notaire.
          </p>
          <ul className="hp-agents-section__list">
            {[
              "Évaluation gratuite de votre bien",
              "Réseau d'agences certifiées partout en Tunisie",
              "Accompagnement juridique et notarial",
              "Visibilité maximale pour votre annonce",
            ].map(item => (
              <li key={item}>
                <CheckCircle size={20} style={{color:"#60a5fa",flexShrink:0}} />
                <span style={{color:"#e2e8f0",fontSize:17,fontWeight:600}}>{item}</span>
              </li>
            ))}
          </ul>
          <div style={{display:"flex",gap:16,marginTop:36,flexWrap:"wrap"}}>
            <Link to="/trouver-un-agent" style={{
              display:"inline-flex",alignItems:"center",gap:10,
              background:"#6366f1",color:"#fff",
              padding:"16px 36px",borderRadius:50,
              fontSize:17,fontWeight:800,
              border:"2px solid #818cf8",
              boxShadow:"0 4px 24px rgba(99,102,241,.5)",
              transition:"all .2s",textDecoration:"none",
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(99,102,241,.7)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 24px rgba(99,102,241,.5)";}}
            >
              <MapPin size={19}/> Trouver un agent
            </Link>
            <Link to="/carte" style={{
              display:"inline-flex",alignItems:"center",gap:10,
              background:"transparent",color:"#e2e8f0",
              padding:"16px 36px",borderRadius:50,
              fontSize:17,fontWeight:700,
              border:"2px solid #475569",
              transition:"all .2s",textDecoration:"none",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#94a3b8";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#475569";e.currentTarget.style.color="#e2e8f0";}}
            >
              En savoir plus <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── AIDE & CONTACT ── */}
      <section className="hp-help section" style={{background:"#f4f6fa"}}>
        <div className="container">
          <div className="hp-help__inner">
            {/* Colonne gauche : image + titre */}
            <div className="hp-help__img-col hp-reveal">
              <img
                src="https://www.mehat.gov.tn/wp-content/uploads/2023/05/contact_us_main.jpg"
                alt="Contactez-nous"
                className="hp-help__img"
                onError={e => { e.currentTarget.style.display="none"; }}
              />
              <div className="hp-help__img-caption">
                <span className="section-eyebrow" style={{color:"#a5b4fc"}}>On est là pour vous</span>
                <h2 style={{color:"#fff",marginTop:10,fontSize:"clamp(24px,2.5vw,36px)"}}>Besoin d'aide ?</h2>
                <p style={{color:"rgba(255,255,255,.8)",fontSize:15,marginTop:8}}>
                  FAQ, contact ou signalement — nous répondons rapidement.
                </p>
              </div>
            </div>
            {/* Colonne droite : 3 cartes */}
            <div className="hp-help__cards hp-reveal" style={{transitionDelay:".18s"}}>
              <Link to="/faq" className="hp-help-card hp-help-card--faq">
                <div className="hp-help-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
                  </svg>
                </div>
                <div className="hp-help-card__body">
                  <h3>FAQ</h3>
                  <p>Trouvez rapidement les réponses aux questions les plus fréquentes sur Localizi.tn.</p>
                </div>
                <span className="hp-help-card__cta">Consulter la FAQ <ArrowRight size={16}/></span>
              </Link>

              <Link to="/contact" className="hp-help-card hp-help-card--contact">
                <div className="hp-help-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="hp-help-card__body">
                  <h3>Nous contacter</h3>
                  <p>Une question, un partenariat ou une suggestion ? Notre équipe vous répond rapidement.</p>
                </div>
                <span className="hp-help-card__cta">Envoyer un message <ArrowRight size={16}/></span>
              </Link>

              <Link to="/signaler-probleme" className="hp-help-card hp-help-card--report">
                <div className="hp-help-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="hp-help-card__body">
                  <h3>Signaler un problème</h3>
                  <p>Annonce frauduleuse, bug ou contenu inapproprié ? Aidez-nous à maintenir la qualité.</p>
                </div>
                <span className="hp-help-card__cta">Signaler <ArrowRight size={16}/></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Télécharger l'application ── */}
      <section className="hp-install-section">
        <div className="hp-install-inner">
          {/* Gauche : texte */}
          <div className="hp-install-content">
            {/* Logo + nom */}
            <div className="hp-install-brand">
              <div className="hp-install-logo">
                <svg width="32" height="32" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="pin-g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#4338ca"/>
                    </linearGradient>
                  </defs>
                  <path d="M16 2C9.92 2 5 6.92 5 13C5 21.5 16 38 16 38C16 38 27 21.5 27 13C27 6.92 22.08 2 16 2Z" fill="url(#pin-g2)" stroke="white" strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke"/>
                  <circle cx="16" cy="13" r="6" fill="white"/>
                  <path d="M13 16V12.8L16 10.5L19 12.8V16H17.2V14.2H14.8V16H13Z" fill="#4f46e5"/>
                </svg>
              </div>
              <span className="hp-install-appname">Localizi.tn</span>
              <span className="hp-install-badge">Application</span>
            </div>

            <h2 className="hp-install-title">
              Emportez Localizi<br/>partout avec vous
            </h2>
            <p className="hp-install-desc">
              Installez l'application directement sur votre téléphone — sans passer par un store. Accédez à toutes vos annonces, la carte interactive et vos favoris même en déplacement.
            </p>

            {/* Avantages */}
            <ul className="hp-install-perks">
              <li><CheckCircle size={15} color="#6366f1"/><span>Accès rapide depuis l'écran d'accueil</span></li>
              <li><Wifi size={15} color="#6366f1"/><span>Expérience fluide, comme une app native</span></li>
              <li><Smartphone size={15} color="#6366f1"/><span>Compatible iOS et Android</span></li>
            </ul>

            {/* CTA */}
            <div className="hp-install-ctas">
              <button
                className="hp-install-btn hp-install-btn--primary"
                onClick={() => {
                  if (window._lzInstallPrompt) {
                    window._lzInstallPrompt.prompt();
                  } else {
                    // Guide manuel si pas de prompt natif
                    alert("Pour installer : appuyez sur le menu de votre navigateur, puis 'Ajouter à l\'écran d\'accueil' ou 'Installer l\'application'.");
                  }
                }}
              >
                <Download size={16}/>
                Installer l'application
              </button>
              <div className="hp-install-hint">
                <span>📱 iOS : Menu → Partager → Sur l'écran d'accueil</span>
                <span>🤖 Android : Menu ⋮ → Installer l'application</span>
              </div>
            </div>
          </div>

          {/* Droite : illustration mockup téléphone */}
          <div className="hp-install-visual">
            <div className="hp-install-phone">
              <div className="hp-install-phone__notch"/>
              <div className="hp-install-phone__screen">
                {/* Mini aperçu de l'app */}
                <div style={{background:"#6366f1",padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 44 44" fill="none">
                    <path d="M16 2C9.92 2 5 6.92 5 13C5 21.5 16 38 16 38C16 38 27 21.5 27 13C27 6.92 22.08 2 16 2Z" fill="white"/>
                    <circle cx="16" cy="13" r="5" fill="#4f46e5"/>
                  </svg>
                  <span style={{color:"#fff",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>LOCALIZI.TN</span>
                </div>
                <div style={{background:"#f8fafc",flex:1,padding:"10px 10px",display:"flex",flexDirection:"column",gap:8}}>
                  {[1,2,3].map(i=>(
                    <div key={i} style={{background:"#fff",borderRadius:10,padding:"10px 10px",display:"flex",gap:8,alignItems:"center",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                      <div style={{width:44,height:44,borderRadius:8,background:`hsl(${220+i*30},70%,92%)`,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{height:8,background:"#e2e8f0",borderRadius:4,marginBottom:5,width:"80%"}}/>
                        <div style={{height:7,background:"#e2e8f0",borderRadius:4,width:"55%"}}/>
                        <div style={{height:6,background:"#6366f1",borderRadius:4,width:"40%",marginTop:6}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Cercles déco */}
            <div className="hp-install-deco hp-install-deco--1"/>
            <div className="hp-install-deco hp-install-deco--2"/>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .hp { background: var(--bg); }

        /* ── HERO ── */
        .hp-hero {
          position: relative; min-height: 92vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .hp-hero__bg {
          position: absolute; inset: 0;
          background: url("${heroImg}") center/cover no-repeat;
        }
        .hp-hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10, 22, 40, 0.65) 0%,
            rgba(10, 22, 40, 0.45) 40%,
            rgba(10, 22, 40, 0.75) 100%
          );
        }
        .hp-hero__content {
          position: relative; z-index: 2;
          text-align: center; padding: 40px 24px 80px;
          max-width: 840px; margin: 0 auto;
        }
        .hp-hero__title {
          color: white; font-size: clamp(36px, 5.5vw, 68px); font-weight: 900;
          line-height: 1.1; margin: 10px 0 18px;
        }
        .hp-hero__highlight {
          background: linear-gradient(90deg, #a5b4fc, #c7d2fe);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hp-hero__sub { color: rgba(255,255,255,.7); font-size: 18px; margin-bottom: 36px; }

        /* Search box */
        .hp-search { max-width: 820px; margin: 0 auto; }
        .hp-search__tabs { display: flex; gap: 4px; margin-bottom: 0; }
        .hp-search__tab {
          padding: 11px 24px; border-radius: 10px 10px 0 0;
          font-size: 15px; font-weight: 700;
          background: rgba(255,255,255,.12); color: rgba(255,255,255,.7);
          transition: all .15s;
        }
        .hp-search__tab--active,
        .hp-search__tab:hover { background: white; color: var(--primary); }
        .hp-search__box {
          display: flex; align-items: center;
          background: white; border-radius: 0 14px 14px 14px;
          padding: 10px 10px 10px 22px;
          box-shadow: 0 20px 60px rgba(0,0,0,.4);
        }
        .hp-search__field { display: flex; align-items: center; flex: 1; min-width: 0; }
        .hp-search__pin { color: var(--primary); margin-right: 14px; flex-shrink: 0; }
        .hp-search__input {
          flex: 1; border: none; outline: none;
          font-size: 17px; font-family: inherit; color: var(--text-primary);
        }
        .hp-search__input::placeholder { color: var(--text-muted); }
        .hp-search__gov-select {
          border: none; outline: none; border-left: 1.5px solid #e5e7eb;
          padding: 8px 16px; font-size: 15px; font-family: inherit;
          color: var(--text-primary); background: transparent; cursor: pointer;
          min-width: 210px; max-width: 240px;
        }
        .hp-search__btn {
          display: flex; align-items: center; gap: 8px;
          background: var(--primary); color: white;
          padding: 14px 32px; border-radius: 10px;
          font-size: 16px; font-weight: 700;
          transition: all .15s;
        }
        .hp-search__btn:hover { background: var(--primary-dark); }
        .hp-search__hint {
          display: flex; align-items: center; gap: 10px;
          margin-top: 18px; flex-wrap: wrap;
        }
        .hp-search__hint span { color: rgba(255,255,255,.5); font-size: 14px; }
        .hp-search__tag {
          padding: 6px 16px; background: rgba(255,255,255,.12);
          color: rgba(255,255,255,.85); border-radius: var(--r-full);
          font-size: 14px; transition: all .15s;
          border: none; cursor: pointer; font-family: inherit; text-decoration: none;
        }
        .hp-search__tag:hover { background: rgba(255,255,255,.25); color: white; }

        /* Floating cards */
        .hp-hero__floats { position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 840px; pointer-events: none; }
        .hp-hero__float {
          position: absolute; display: flex; align-items: center; gap: 10px;
          background: white; border-radius: var(--r-md); padding: 12px 18px;
          box-shadow: var(--shadow-md);
        }
        .hp-hero__float--1 { left: 0; bottom: 0; }
        .hp-hero__float--2 { right: 0; bottom: 20px; }
        .hp-hero__float-num   { font-weight: 800; font-size: 16px; color: var(--text-primary); }
        .hp-hero__float-label { font-size: 12px; color: var(--text-muted); }

        /* ── TYPES ── */
        .hp-types__grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }
        .hp-type-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); padding: 24px 16px;
          text-align: center; transition: all .2s;
          border-top: 3px solid var(--acc);
          animation: fadeInUp .5s ease both;
          text-decoration: none; display: block;
        }
        .hp-type-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); }
        .hp-type-card__icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--primary-light); color: var(--acc);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .hp-type-card__label { font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 10px 0 12px; }
        .hp-type-card__link {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 15px; font-weight: 700; color: var(--acc);
        }

        /* ── PROPERTY CARDS ── */
        .hp-recent__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 8px;
        }
        .hp-legend { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
        .hp-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: var(--r-full);
          font-size: 11px; font-weight: 700; letter-spacing: .5px;
        }
        .hp-badge--boost    { background: var(--boost-light);   color: var(--boost); }
        .hp-badge--premium  { background: var(--gold-light);    color: #9a6700; }
        .hp-badge--standard { background: var(--primary-light); color: var(--primary); }

        .hp-card {
          background: var(--surface); border-radius: var(--r-lg);
          border: 1px solid var(--border); overflow: hidden;
          transition: all .22s; animation: fadeInUp .5s ease both;
          display: flex; flex-direction: column;
        }
        .hp-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
        .hp-card--boost   { border-color: var(--boost);  box-shadow: 0 0 0 1px var(--boost); }
        .hp-card--premium { border-color: var(--gold);   box-shadow: 0 0 0 1px var(--gold); }
        .hp-card__img-wrap { position: relative; height: 210px; overflow: hidden; isolation: isolate; }
        .hp-card__img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .hp-card:hover .hp-card__img-wrap img { transform: scale(1.05); }
        @keyframes carouselInL  { from { transform:translateX(100%);  opacity:.7 } to { transform:translateX(0); opacity:1 } }
        @keyframes carouselOutL { from { transform:translateX(0);     opacity:1  } to { transform:translateX(-100%); opacity:.7 } }
        @keyframes carouselInR  { from { transform:translateX(-100%); opacity:.7 } to { transform:translateX(0); opacity:1 } }
        @keyframes carouselOutR { from { transform:translateX(0);     opacity:1  } to { transform:translateX(100%);  opacity:.7 } }
        .hp-card__cat {
          padding: 4px 11px; border-radius: var(--r-full);
          font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .hp-card__cat--vente    { background: #166534; color: #fff; }
        .hp-card__cat--location { background: #1e40af; color: #fff; }
        .hp-card__cat--vacances { background: #854d0e; color: #fff; }
        .hp-card .hp-badge { position: absolute; top: 12px; right: 12px; }
        .hp-card__fav {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,.92); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,.15); transition: all .15s;
          flex-shrink: 0;
        }
        .hp-card__fav:hover { background: #fff; transform: scale(1.1); }
        .hp-card__body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; }
        .hp-card__title { font-weight: 700; font-size: 15px; color: var(--text-primary); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hp-card__location { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .hp-card__specs { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap:wrap; }
        .hp-card__specs span { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary); }
        .hp-card__footer { display: flex; align-items: flex-end; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-light); margin-top: auto; }
        .hp-card__price { font-size: 22px; font-weight: 900; color: var(--text-primary); line-height: 1.1; }
        .hp-card__price-m2 { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 2px; }
        .hp-card__devise { font-size: 12px; font-weight: 500; color: var(--text-muted); }
        .hp-card__cta { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--primary); }

        /* ── STATS ── */
        .hp-stats {
          padding: 80px 0;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: white;
        }
        .hp-stats__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        .hp-stat { text-align: center; opacity: 0; transform: translateY(20px); transition: opacity .5s, transform .5s; }
        .hp-stat--visible { opacity: 1; transform: translateY(0); }
        .hp-stat__icon { margin-bottom: 14px; opacity: .7; color: white; }
        .hp-stat__val   { font-size: 52px; font-weight: 900; color: white; }
        .hp-stat__label { font-size: 17px; opacity: .85; margin-top: 6px; color: white; font-weight: 600; }

        /* ── MAP CTA ── */
        .hp-map-cta__inner {
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
        }
        .hp-map-cta__text h2 { margin-bottom: 16px; }
        .hp-map-cta__text p  { margin-bottom: 12px; }
        .hp-map-cta__checks  { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; list-style: none; padding: 0; }
        .hp-map-cta__checks li { display: flex; align-items: center; gap: 12px; font-size: 16px; }
        .hp-map-cta__visual {
          position: relative;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 8px 36px rgba(0,0,0,.13);
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        /* Légende flottante sur la carte */
        .hp-map-cta__legend {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px; z-index: 1000;
          background: rgba(255,255,255,.92); backdrop-filter: blur(8px);
          padding: 6px 12px; border-radius: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,.12);
        }
        .hp-map-cta__leg-item {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; padding: 3px 9px;
          border-radius: 12px; white-space: nowrap;
        }
        .hp-map-cta__leg-item--std     { background: #4f46e5; color: #fff; }
        .hp-map-cta__leg-item--loc     { background: #16a34a; color: #fff; }
        .hp-map-cta__leg-item--vac     { background: #f59e0b; color: #fff; }

        /* ── FEATURES ── */
        .hp-features__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .hp-feature {
          background: var(--surface); border-radius: var(--r-lg);
          padding: 28px 24px; border: 1px solid var(--border);
          transition: all .2s; animation: fadeInUp .5s ease both;
        }
        .hp-feature:hover { transform: translateY(-4px); box-shadow: var(--shadow-sm); }
        .hp-feature__icon {
          width: 48px; height: 48px; border-radius: var(--r-md);
          background: var(--primary-light); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .hp-feature h4 { margin-bottom: 10px; font-size: 20px; }
        .hp-feature p  { font-size: 16px; line-height: 1.65; }

        /* ── BOOST CTA ── */
        .hp-boost-cta {
          background: linear-gradient(135deg, #0f172a, #1e293b);
        }
        .hp-boost-cta h2 { font-size: clamp(24px, 3vw, 38px); }

        /* ── GOUVERNORATS ── */
        .hp-gov { background: var(--bg); }
        .hp-gov__grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .hp-gov-card {
          position: relative; border-radius: 14px; overflow: hidden;
          aspect-ratio: 3/4; cursor: pointer;
          background: var(--gov-color, #334155);
          transition: transform .25s, box-shadow .25s;
          outline: none;
        }
        .hp-gov-card:hover,
        .hp-gov-card:focus-visible { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(0,0,0,.25); }
        .hp-gov-card__img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform .4s;
        }
        .hp-gov-card:hover .hp-gov-card__img { transform: scale(1.08); }
        .hp-gov-card__fallback { width: 100%; height: 100%; }
        .hp-gov-card__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 50%, transparent 100%);
          transition: background .3s;
        }
        .hp-gov-card:hover .hp-gov-card__overlay {
          background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 60%, rgba(0,0,0,.1) 100%);
        }
        .hp-gov-card__content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 14px 12px 12px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .hp-gov-card__name {
          font-size: 22px; font-weight: 900; color: white;
          line-height: 1.2; letter-spacing: -.01em;
          text-shadow: 0 2px 8px rgba(0,0,0,.7);
        }
        .hp-gov-card__cta {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; color: rgba(255,255,255,.7);
          opacity: 0; transform: translateY(4px);
          transition: opacity .2s, transform .2s;
        }
        .hp-gov-card:hover .hp-gov-card__cta { opacity: 1; transform: translateY(0); }

        /* ── Responsive ── */
        @media (max-width: 1200px) {
          .hp-recent__grid  { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1100px) {
          .hp-types__grid   { grid-template-columns: repeat(3, 1fr); }
          .hp-recent__grid  { grid-template-columns: repeat(2, 1fr); }
          .hp-features__grid{ grid-template-columns: repeat(2, 1fr); }
          .hp-stats__grid   { grid-template-columns: repeat(2, 1fr); }
          .hp-map-cta__inner{ grid-template-columns: 1fr; gap: 36px; }
          .hp-gov__grid     { grid-template-columns: repeat(4, 1fr); }
        }
        /* Masquer l'illustration (dame) dès la tablette/mobile */
        @media (max-width: 1100px) {
          .hp-stats-illustration { display: none !important; }
        }
        @media (max-width: 700px) {
          /* Hero height réduite */
          .hp-hero { min-height: 78vh; }
          /* Titre centré et plus grand */
          .hp-hero__title { font-size: 30px !important; line-height: 1.2 !important; margin-bottom: 10px !important; text-align: center !important; }
          .hp-hero__highlight { font-size: inherit !important; }
          .hp-hero__sub { font-size: 13px !important; margin-bottom: 20px !important; text-align: center !important; }
          /* Champ recherche : centré */
          .hp-hero__content { text-align: center !important; padding: 28px 16px 60px !important; }
          .hp-search__box { flex-direction: column; padding: 10px 12px; gap: 8px; border-radius: 0 12px 12px 12px; }
          .hp-search__field { align-items: center !important; }
          .hp-search__pin { width: 15px !important; height: 15px !important; margin-right: 10px !important; flex-shrink: 0 !important; }
          .hp-search__input { font-size: 14px !important; }
          .hp-search__input::placeholder { }
          .hp-search__btn { width: 100%; justify-content: center; }
          .hp-search__gov-select { border-left: none; border-top: 1px solid #e5e7eb; max-width: 100%; width: 100%; padding: 8px 12px; }
          .hp-hero__floats { display: none; }
          /* "Populaire" et tags plus petits */
          .hp-search__hint { margin-top: 12px !important; gap: 6px !important; }
          .hp-search__hint span { font-size: 11px !important; }
          .hp-search__tag { font-size: 11px !important; padding: 4px 10px !important; }
          /* Tabs de recherche */
          .hp-search__tab { font-size: 12px !important; padding: 8px 14px !important; }
          /* Régions populaires : nom plus petit */
          .hp-gov-card__name { font-size: 11.5px !important; line-height: 1.1 !important; }
          .hp-gov-card__cta { font-size: 10px !important; }
          /* Annonces récentes : 1 par ligne, écriture réduite, bouton compact & centré */
          .hp-recent__grid { grid-template-columns: 1fr; }
          .hp-recent .section-header p { font-size: 13px !important; }
          .hp-recent .hp-card__title    { font-size: 14.5px; }
          .hp-recent .hp-card__location { font-size: 12.5px; }
          .hp-recent .hp-card__specs span { font-size: 12px; }
          .hp-recent .hp-card__price    { font-size: 17px; }
          .hp-recent .hp-card__cta      { font-size: 12.5px; }
          .hp-recent .btn-lg { padding: 10px 22px !important; font-size: 13.5px !important; }
          /* Types : 2 par ligne, écriture plus compacte */
          .hp-types__grid  { grid-template-columns: 1fr 1fr; gap: 10px; }
          .hp-type-card        { padding: 16px 10px; }
          .hp-type-card__icon  { width: 48px; height: 48px; margin-bottom: 10px; }
          .hp-type-card__icon svg { width: 26px; height: 26px; }
          .hp-type-card__label { font-size: 13px; margin: 6px 0 8px; }
          .hp-type-card__link  { font-size: 12.5px; }
          .hp-features__grid { grid-template-columns: 1fr; }
          .hp-stats__grid { grid-template-columns: 1fr 1fr; gap: 20px; }
          .hp-stat__val { font-size: 32px; }
          /* Gouvernorats : 3 par ligne, cartes plus petites/basses, texte plus petit */
          .hp-gov__grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .hp-gov-card { aspect-ratio: 1 / 1; border-radius: 10px; }
          .hp-gov-card__content { padding: 8px 8px 7px; }
          .hp-gov-card__name { font-size: 13.5px; line-height: 1.15; }
          /* Bouton FAQ flottant : à droite, plus petit */
          .hp-faq-fab {
            bottom: 16px !important; right: 16px !important; left: auto !important;
            padding: 9px 14px !important; font-size: 12.5px !important;
            border-width: 2px !important;
          }
          .hp-faq-fab svg { width: 15px !important; height: 15px !important; }

          /* Sections "Carte interactive" + "Accompagnement pro" : texte & boutons plus petits */
          .hp-map-cta__text h2,
          .hp-agents-section__content h2 { font-size: 24px !important; }
          .hp-map-cta__text p,
          .hp-agents-section__content p { font-size: 15px !important; }
          .hp-map-cta__checks li,
          .hp-agents-section__list span { font-size: 14px !important; }
          .hp-map-cta__text a,
          .hp-agents-section__content a {
            padding: 11px 20px !important; font-size: 14px !important;
          }
          .hp-map-cta__text a svg,
          .hp-agents-section__content a svg { width: 16px !important; height: 16px !important; }

          /* "Pourquoi Localizi.tn" : icône + titre sur une ligne, description dessous */
          .hp-feature {
            display: grid; grid-template-columns: auto 1fr;
            align-items: center; column-gap: 12px; row-gap: 8px;
            padding: 18px 16px;
          }
          .hp-feature__icon { margin-bottom: 0; width: 42px; height: 42px; }
          .hp-feature h4 { margin-bottom: 0; font-size: 16px; }
          .hp-feature p  { grid-column: 1 / -1; font-size: 14px; }

          /* Accompagnement pro : padding réduit → puces décalées à gauche, une seule ligne chacune */
          .hp-agents-section__content { padding: 44px 16px !important; }
          .hp-agents-section__list li { gap: 8px; }
          .hp-agents-section__list li svg { width: 16px !important; height: 16px !important; }
          .hp-agents-section__list span { font-size: 12.5px !important; line-height: 1.3; white-space: nowrap; }

          /* Les deux boutons (Trouver un agent / En savoir plus) sur la même ligne */
          .hp-agents-section__content > div:last-child { flex-wrap: nowrap !important; gap: 10px !important; }
          .hp-agents-section__content > div:last-child a {
            flex: 1; justify-content: center; white-space: nowrap;
            padding: 11px 10px !important; font-size: 13px !important;
          }

          /* Section "Besoin d'aide ?" : icône + titre sur une ligne, contenu dessous */
          .hp-help-card {
            display: grid !important;
            grid-template-columns: auto 1fr;
            align-items: center; column-gap: 12px; row-gap: 6px;
            padding: 16px 16px;
          }
          .hp-help-card__icon { grid-column: 1; grid-row: 1; width: 30px !important; height: 30px !important; border-radius: 8px !important; align-self: center; }
          .hp-help-card__icon svg { width: 17px !important; height: 17px !important; }
          .hp-help-card__body { display: contents; }
          .hp-help-card__body h3 { grid-column: 2; grid-row: 1; font-size: 16px !important; margin-bottom: 0 !important; align-self: center; }
          .hp-help-card__body p  { grid-column: 1 / -1; grid-row: 2; font-size: 13px !important; }
          .hp-help-card__cta { grid-column: 1 / -1; grid-row: 3; margin-left: 0; font-size: 13.5px; }
        }
        @media (max-width: 420px) {
          /* Types : on garde 2 par ligne même sur petit écran */
          .hp-types__grid { grid-template-columns: 1fr 1fr; }
          .hp-stats__grid { grid-template-columns: 1fr; }
          /* Gouvernorats : on garde 3 par ligne même sur petit écran */
          .hp-gov__grid   { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .hp-gov-card__name { font-size: 12.5px; }
        }

        /* ── Badge NOUVEAU ── */
        .hp-card__new {
          position: absolute; bottom: 10px; right: 10px;
          background: #dc2626; color: #fff;
          font-size: 10px; font-weight: 800; letter-spacing: .06em;
          padding: 3px 9px; border-radius: 20px;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(220,38,38,.4);
        }

        /* ── Texte cartes plus lisible ── */
        .hp-card__title    { font-size: 16px; color: #0a0a0a; font-weight: 800; margin-bottom: 5px; }
        .hp-card__location { font-size: 14px; color: #374151; font-weight: 500; margin-bottom: 10px; }
        .hp-card__specs    { gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
        .hp-card__specs span { font-size: 14px; color: #1e293b; font-weight: 600; }
        .hp-card__price    { font-size: 20px; font-weight: 900; }
        .hp-card__body     { padding: 14px 16px; }
        .hp-card__footer   { padding-top: 10px; margin-top: 2px; }
        .hp-card__cta      { font-size: 14px; font-weight: 700; }

        /* ── Scroll reveal ── */
        .hp-reveal {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity .72s cubic-bezier(.22,.68,0,1.2), transform .72s cubic-bezier(.22,.68,0,1.2);
        }
        .hp-reveal.hp-reveal--on {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Section Agents / Agences ── */
        .hp-agents-section {
          display: grid; grid-template-columns: 1fr 1fr;
          min-height: 620px;
        }
        .hp-agents-section__img-col {
          position: relative; overflow: hidden;
        }
        .hp-agents-section__photo {
          width: 100%; height: 100%; object-fit: cover;
          object-position: 5% center;
          display: block;
          transition: transform .6s ease;
        }
        .hp-agents-section:hover .hp-agents-section__photo { transform: scale(1.04); }
        .hp-agents-section__img-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(to right, transparent 70%, #0f172a 100%);
        }
        .hp-agents-section__content {
          display: flex; flex-direction: column; justify-content: center;
          padding: 80px 80px 80px 64px;
          background: #0f172a;
        }
        .hp-agents-section__list {
          display: flex; flex-direction: column; gap: 16px;
          list-style: none; padding: 0;
        }
        .hp-agents-section__list li {
          display: flex; align-items: center; gap: 14px;
        }

        /* ── Section Aide & Contact ── */
        .hp-help__inner {
          display: grid; grid-template-columns: 420px 1fr; gap: 56px; align-items: start;
        }
        .hp-help__img-col {
          position: relative; border-radius: 22px; overflow: hidden;
          min-height: 500px;
        }
        .hp-help__img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          position: absolute; inset: 0;
          transition: transform .5s ease;
        }
        .hp-help__img-col:hover .hp-help__img { transform: scale(1.04); }
        .hp-help__img-caption {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 40px 36px;
          background: linear-gradient(to top, rgba(15,23,42,.94) 0%, rgba(15,23,42,.55) 65%, transparent 100%);
        }
        .hp-help__cards {
          display: flex; flex-direction: column; gap: 18px; padding: 4px 0;
        }
        .hp-help-card {
          display: flex; flex-direction: row; align-items: center; gap: 20px;
          background: #fff; border-radius: 18px;
          padding: 28px 28px; border: 2px solid #e2e8f0;
          transition: all .25s cubic-bezier(.22,.68,0,1.2); text-decoration: none;
        }
        .hp-help-card:hover {
          transform: translateX(8px);
          box-shadow: 0 12px 40px rgba(0,0,0,.11);
          border-color: currentColor;
        }
        .hp-help-card__icon {
          width: 60px; height: 60px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .hp-help-card--faq     { color: #1e40af; }
        .hp-help-card--faq     .hp-help-card__icon { background: #dbeafe; }
        .hp-help-card--contact { color: #166534; }
        .hp-help-card--contact .hp-help-card__icon { background: #dcfce7; }
        .hp-help-card--report  { color: #b91c1c; }
        .hp-help-card--report  .hp-help-card__icon { background: #fee2e2; }
        .hp-help-card__body { flex: 1; }
        .hp-help-card__body h3 { font-size: 20px; font-weight: 800; color: #0a0a0a; margin-bottom: 6px; }
        .hp-help-card__body p  { font-size: 15px; color: #374151; line-height: 1.6; }
        .hp-help-card__cta {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 15px; font-weight: 700; flex-shrink: 0; margin-left: auto;
        }
        @media (max-width: 1100px) {
          .hp-agents-section { grid-template-columns: 1fr; }
          .hp-agents-section__img-col { min-height: 340px; }
          .hp-agents-section__img-scrim { background: linear-gradient(to bottom, transparent 60%, #0f172a 100%); }
          .hp-agents-section__content { padding: 56px 40px; }
          .hp-help__inner { grid-template-columns: 1fr; }
          .hp-help__img-col { min-height: 300px; }
          .hp-help__img { position: static; height: 300px; }
        }
        @media (max-width: 900px) {
          .hp-help__cards { gap: 12px; }
          .hp-help-card { flex-direction: column; align-items: flex-start; }
          .hp-help-card__cta { margin-left: 0; }
        }

        /* ── STATS SECTION ── */
        .hp-stats-section {
          background: #0b0f1e;
          padding: 100px 0 108px;
          position: relative;
          overflow: visible;
        }
        .hp-stats-section__bg-pattern {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(99,102,241,.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 60%, rgba(139,92,246,.14) 0%, transparent 55%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .hp-stats-headline {
          text-align: center;
          margin-bottom: 72px;
          position: relative; z-index: 1;
        }
        .hp-stats-eyebrow {
          display: inline-block;
          font-size: 11px; font-weight: 800; letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #818cf8;
          background: rgba(99,102,241,.12);
          border: 1px solid rgba(99,102,241,.25);
          border-radius: 100px;
          padding: 6px 18px;
          margin-bottom: 22px;
        }
        .hp-stats-title {
          font-size: clamp(34px, 4vw, 54px);
          font-weight: 900;
          color: #fff;
          line-height: 1.12;
          letter-spacing: -.03em;
          margin: 0 0 20px;
        }
        .hp-stats-title em {
          font-style: normal;
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hp-stats-desc {
          font-size: 17px; color: rgba(255,255,255,.55);
          max-width: 520px; margin: 0 auto;
          line-height: 1.65; font-weight: 400;
        }
        .hp-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 2px;
          position: relative; z-index: 1;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.07);
        }
        .hp-stat-card {
          background: rgba(255,255,255,.03);
          padding: 44px 24px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: background .2s;
          border-right: 1px solid rgba(255,255,255,.07);
          cursor: default;
        }
        .hp-stat-card:last-child { border-right: none; }
        .hp-stat-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,.12) 0%, transparent 60%);
          opacity: 0;
          transition: opacity .3s;
        }
        .hp-stat-card:hover { background: rgba(99,102,241,.1); }
        .hp-stat-card:hover::before { opacity: 1; }
        .hp-stat-card__icon-wrap {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(99,102,241,.18);
          border: 1px solid rgba(99,102,241,.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          color: #818cf8;
          position: relative; z-index: 1;
          transition: background .2s, transform .2s;
        }
        .hp-stat-card:hover .hp-stat-card__icon-wrap {
          background: #6366f1;
          color: #fff;
          transform: scale(1.08);
        }
        .hp-stat-card__number {
          font-size: clamp(44px, 4vw, 68px);
          font-weight: 900;
          line-height: 1;
          color: #fff;
          margin-bottom: 12px;
          letter-spacing: -.04em;
          position: relative; z-index: 1;
          color: #fff;
        }
        .hp-stat-card__count { }
        .hp-stat-card__suffix {
          font-size: .75em;
          color: #a5b4fc;
          font-weight: 900;
        }
        .hp-stat-card__label {
          font-size: 13px;
          font-weight: 800;
          color: rgba(255,255,255,.9);
          margin-bottom: 6px;
          line-height: 1.3;
          position: relative; z-index: 1;
          letter-spacing: .01em;
        }
        .hp-stat-card__sub {
          font-size: 11.5px;
          color: rgba(255,255,255,.35);
          font-weight: 500;
          line-height: 1.4;
          position: relative; z-index: 1;
        }
        @media (max-width: 1100px) {
          /* plus d'illustration → on annule le décalage prévu pour elle */
          .hp-stats-grid { grid-template-columns: repeat(3, 1fr); border-radius: 20px; margin-left: 0 !important; }
          .hp-stat-card:nth-child(3) { border-right: none; }
          .hp-stat-card:nth-child(4),
          .hp-stat-card:nth-child(5),
          .hp-stat-card:nth-child(6) { border-top: 1px solid rgba(255,255,255,.07); }
        }
        @media (max-width: 640px) {
          .hp-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .hp-stat-card:nth-child(2n) { border-right: none; }
          .hp-stat-card:nth-child(n+3) { border-top: 1px solid rgba(255,255,255,.07); }
          .hp-stat-card { padding: 36px 18px 32px; }
        }
        /* Mobile : section chiffres plus compacte (moins d'espace vide) */
        @media (max-width: 700px) {
          .hp-stats-section { padding: 44px 0 48px; }
          .hp-stats-headline { margin-bottom: 24px; }
          .hp-stats-title { font-size: 21px; line-height: 1.2; }
          .hp-stats-desc { font-size: 13.5px; max-width: 320px; }
          .hp-stat-card { padding: 26px 16px 24px; }
        }

        /* ── PWA INSTALL SECTION ── */
        .hp-install-section {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
          padding: 80px 0; overflow: hidden; position: relative;
        }
        .hp-install-inner {
          max-width: 1160px; margin: 0 auto; padding: 0 32px;
          display: flex; align-items: center; gap: 64px;
        }
        .hp-install-content { flex: 1; min-width: 0; }
        .hp-install-brand {
          display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        }
        .hp-install-logo {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
          display: flex; align-items: center; justify-content: center;
        }
        .hp-install-appname {
          font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -.01em;
        }
        .hp-install-badge {
          background: rgba(99,102,241,.4); border: 1px solid rgba(165,180,252,.35);
          border-radius: 20px; padding: 2px 10px;
          font-size: 11px; font-weight: 700; color: #a5b4fc;
        }
        .hp-install-title {
          font-size: 38px; font-weight: 900; color: #fff;
          line-height: 1.15; margin: 0 0 16px; letter-spacing: -.02em;
        }
        .hp-install-desc {
          font-size: 15px; color: rgba(255,255,255,.68); line-height: 1.7;
          margin: 0 0 24px; max-width: 480px;
        }
        .hp-install-perks {
          list-style: none; margin: 0 0 28px; padding: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .hp-install-perks li {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; color: rgba(255,255,255,.8); font-weight: 500;
        }
        .hp-install-ctas { display: flex; flex-direction: column; gap: 14px; }
        .hp-install-btn {
          display: inline-flex; align-items: center; gap: 10px;
          border: none; cursor: pointer; font-family: inherit;
          font-weight: 800; font-size: 15px; border-radius: 14px;
          padding: 14px 28px; transition: transform .15s, box-shadow .15s;
          width: fit-content;
        }
        .hp-install-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.35); }
        .hp-install-btn--primary { background: #fff; color: #0f172a; }
        .hp-install-hint {
          display: flex; flex-direction: column; gap: 4px;
        }
        .hp-install-hint span {
          font-size: 12px; color: rgba(255,255,255,.45); font-weight: 500;
        }
        /* Mockup téléphone */
        .hp-install-visual {
          flex-shrink: 0; position: relative; width: 220px; height: 420px;
        }
        .hp-install-phone {
          width: 200px; height: 400px; border-radius: 36px;
          background: #1e293b; border: 6px solid rgba(255,255,255,.15);
          overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06);
          position: relative; z-index: 1;
        }
        .hp-install-phone__notch {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 60px; height: 20px; background: #0f172a; border-radius: 0 0 14px 14px;
          z-index: 2;
        }
        .hp-install-phone__screen {
          flex: 1; display: flex; flex-direction: column; margin-top: 20px;
          overflow: hidden; font-family: 'Inter', system-ui, sans-serif;
        }
        .hp-install-deco {
          position: absolute; border-radius: 50%;
          background: rgba(99,102,241,.2); pointer-events: none;
        }
        .hp-install-deco--1 { width: 160px; height: 160px; top: -40px; right: -40px; }
        .hp-install-deco--2 { width: 100px; height: 100px; bottom: -20px; left: -20px; background: rgba(59,130,246,.15); }

        @media (max-width: 860px) {
          .hp-install-section { padding: 52px 0; }
          .hp-install-inner { flex-direction: column; gap: 36px; padding: 0 20px; }
          .hp-install-title { font-size: 26px; }
          .hp-install-desc { font-size: 13.5px; max-width: 100%; }
          .hp-install-visual { width: 170px; height: 340px; }
          .hp-install-phone { width: 158px; height: 316px; border-radius: 28px; }
          .hp-install-btn { font-size: 14px; padding: 12px 22px; }
        }
      `}</style>
    </div>
  );
}
