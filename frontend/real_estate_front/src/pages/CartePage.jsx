import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import API_URL, { fmtDevise, convertPrice, fmtPriceApprox } from '../config';
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, ChevronLeft, ChevronRight, Bed, Bath, Maximize,
  MapPin, Heart, X, SlidersHorizontal, Star, School, Moon,
  ChevronDown, Loader2, LayoutList, Map as MapIcon, Save,
  Waves, Mountain, TreePine, Fence, Sun, Flower2, Droplets, ParkingCircle,
  ArrowUpDown, Car, Package, Sofa, Users, ShieldCheck,
  UtensilsCrossed, Wind, Thermometer, Flame, DoorClosed, LockKeyhole,
  Fingerprint, Wifi, Monitor, RefreshCw, KeyRound, PhoneCall, Check
} from "lucide-react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import useLocalisation from "../hooks/useLocalisation";
import { getDelegations } from "../api/localisation.api";
import AnnonceModal from "../components/AnnonceModal";
import "leaflet/dist/leaflet.css";

/* -------------------------------------------------------------
   POINT-IN-POLYGON – ray casting algorithm
------------------------------------------------------------- */
function pointInPolygon(point, polygon) {
  const { lat: y, lng: x } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/* -------------------------------------------------------------
   POI ICON HELPER – circular divIcon markers
------------------------------------------------------------- */
const makePOIIcon = (L, color, svgPath) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px; height:28px; border-radius:50%;
    background:${color}; border:2px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.3);
    display:flex; align-items:center; justify-content:center;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      ${svgPath}
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/* SVG paths – partag�s entre les marqueurs de carte ET les boutons filtres */
/* Écoles : livre ouvert */
const SCHOOL_SVG   = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
const MOSQUE_SVG   = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
/* Faculté : chapeau acad�mique (mortier) */
const FACULTY_SVG  = '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>';
/* Grande surface : chariot de supermarch� (ancien, restaur�) */
const SURFACE_SVG  = '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>';

/* Petit SVG React pour les boutons (même chemin que les marqueurs de carte) */
const PoiSvg = ({ path, size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: path }}
  />
);

/* POIs � Écoles & Mosquées (d�mo) */
const SCHOOLS = [
  { id:"sc1", nom:"Lycée Pilote de Tunis",        lat:36.821, lng:10.159, gov:"Tunis"   },
  { id:"sc2", nom:"Collège Ibn Khaldoun",          lat:36.833, lng:10.171, gov:"Tunis"   },
  { id:"sc3", nom:"École El Menzah VI",            lat:36.846, lng:10.206, gov:"Tunis"   },
  { id:"sc4", nom:"Lycée Technique Ariana",        lat:36.866, lng:10.197, gov:"Ariana"  },
  { id:"sc5", nom:"Collège La Soukra",             lat:36.882, lng:10.213, gov:"Ariana"  },
  { id:"sc6", nom:"Lycée Habib Bourguiba Sousse",  lat:35.830, lng:10.638, gov:"Sousse"  },
  { id:"sc7", nom:"École Primaire Port Kantaoui",  lat:35.892, lng:10.612, gov:"Sousse"  },
  { id:"sc8", nom:"Lycée Farhat Hached Sfax",      lat:34.744, lng:10.762, gov:"Sfax"    },
  { id:"sc9", nom:"Collège Ibn Sina Sfax",         lat:34.737, lng:10.756, gov:"Sfax"    },
  { id:"sc10",nom:"École Tahar Haddad Hammamet",   lat:36.403, lng:10.617, gov:"Nabeul"  },
  { id:"sc11",nom:"Lycée Pilote Nabeul",           lat:36.458, lng:10.732, gov:"Nabeul"  },
  { id:"sc12",nom:"École Erriadh Monastir",        lat:35.785, lng:10.815, gov:"Monastir"},
  { id:"sc13",nom:"Collège Djerba Midoun",         lat:33.825, lng:10.885, gov:"Médenine"},
  { id:"sc14",nom:"Lycée Teboulba Ben Arous",      lat:36.720, lng:10.240, gov:"Ben Arous"},
];

const MOSQUES = [
  { id:"mo1", nom:"Mosquée Zitouna",               lat:36.798, lng:10.174, gov:"Tunis"   },
  { id:"mo2", nom:"Mosquée El Fath Lac",           lat:36.840, lng:10.234, gov:"Tunis"   },
  { id:"mo3", nom:"Mosquée Ennasr",                lat:36.858, lng:10.193, gov:"Ariana"  },
  { id:"mo4", nom:"Mosquée Raoued",                lat:36.890, lng:10.177, gov:"Ariana"  },
  { id:"mo5", nom:"Mosquée Boujemaa Sousse",       lat:35.826, lng:10.636, gov:"Sousse"  },
  { id:"mo6", nom:"Mosquée Sidi Bouali Sousse",    lat:35.818, lng:10.644, gov:"Sousse"  },
  { id:"mo7", nom:"Mosquée Trois Portes Sfax",     lat:34.739, lng:10.759, gov:"Sfax"    },
  { id:"mo8", nom:"Mosquée Sidi Lakhmi Sfax",      lat:34.746, lng:10.767, gov:"Sfax"    },
  { id:"mo9", nom:"Mosquée El Kebir Hammamet",     lat:36.397, lng:10.621, gov:"Nabeul"  },
  { id:"mo10",nom:"Mosquée Nabeul Ville",          lat:36.452, lng:10.739, gov:"Nabeul"  },
  { id:"mo11",nom:"Mosquée Monastir Médina",       lat:35.776, lng:10.827, gov:"Monastir"},
  { id:"mo12",nom:"Mosquée Erriadh Djerba",        lat:33.833, lng:10.862, gov:"Médenine"},
  { id:"mo13",nom:"Mosquée Ben Arous",             lat:36.753, lng:10.229, gov:"Ben Arous"},
  { id:"mo14",nom:"Mosquée Kairouan Okba",         lat:35.681, lng:10.098, gov:"Kairouan"},
];

/* POIs statiques – Facultés & Grandes surfaces (fallback si Overpass indisponible) */
const FACULTIES = [
  { id:"fac1", nom:"Université Tunis El Manar",        lat:36.838, lng:10.168, gov:"Tunis"    },
  { id:"fac2", nom:"Faculté des Sciences de Tunis",    lat:36.835, lng:10.172, gov:"Tunis"    },
  { id:"fac3", nom:"INSAT Tunis",                      lat:36.855, lng:10.197, gov:"Tunis"    },
  { id:"fac4", nom:"Université Carthage",              lat:36.870, lng:10.184, gov:"Tunis"    },
  { id:"fac5", nom:"ISSAT Sousse",                     lat:35.822, lng:10.631, gov:"Sousse"   },
  { id:"fac6", nom:"Faculté de Médecine Sousse",       lat:35.840, lng:10.647, gov:"Sousse"   },
  { id:"fac7", nom:"Université de Sfax",               lat:34.749, lng:10.758, gov:"Sfax"     },
  { id:"fac8", nom:"FSEG Sfax",                        lat:34.740, lng:10.752, gov:"Sfax"     },
  { id:"fac9", nom:"IPEIM Monastir",                   lat:35.778, lng:10.826, gov:"Monastir" },
  { id:"fac10",nom:"Université Manouba",               lat:36.828, lng:10.093, gov:"Manouba"  },
  { id:"fac11",nom:"ISG Tunis",                        lat:36.812, lng:10.147, gov:"Tunis"    },
  { id:"fac12",nom:"Faculté Droit Sciences Politiques",lat:36.795, lng:10.181, gov:"Tunis"    },
];

const GRAND_SURFACES = [
  { id:"gs1", nom:"Carrefour Lac Tunis",               lat:36.841, lng:10.237, gov:"Tunis"    },
  { id:"gs2", nom:"Géant Casino Ennasr",               lat:36.859, lng:10.192, gov:"Ariana"   },
  { id:"gs3", nom:"Monoprix Menzah",                   lat:36.848, lng:10.207, gov:"Tunis"    },
  { id:"gs4", nom:"Carrefour Market Ariana",           lat:36.866, lng:10.199, gov:"Ariana"   },
  { id:"gs5", nom:"Azur Sousse",                       lat:35.834, lng:10.641, gov:"Sousse"   },
  { id:"gs6", nom:"Carrefour Market Sfax",             lat:34.741, lng:10.763, gov:"Sfax"     },
  { id:"gs7", nom:"Géant Hammamet",                    lat:36.405, lng:10.624, gov:"Nabeul"   },
  { id:"gs8", nom:"Monoprix Centre-ville Tunis",       lat:36.803, lng:10.180, gov:"Tunis"    },
  { id:"gs9", nom:"Carrefour Ben Arous",               lat:36.741, lng:10.226, gov:"Ben Arous" },
  { id:"gs10",nom:"MG Monastir",                       lat:35.781, lng:10.831, gov:"Monastir" },
];

const TYPES    = ["appartement","villa_maison","immeuble","terrain","local_commercial","bureau","ferme_agricole","garage_parking","depot_stockage","immobiliers_divers"];
const TYPE_LBL = {
  appartement:       "Appartement",
  villa_maison:      "Villa/Maison",
  immeuble:          "Immeuble",
  terrain:           "Terrain",
  local_commercial:  "Local commercial",
  bureau:            "Bureau",
  ferme_agricole:    "Ferme agricole",
  garage_parking:    "Garage / Parking",
  depot_stockage:    "Dépôt de stockage",
  immobiliers_divers:"Immobiliers divers",
};
const ETATS    = ["nouveau","bon_etat","a_renover","cours_construction"];
const ETAT_LBL = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"à rénover", cours_construction:"En construction" };
const CAT_LBL    = { vente:"Achat", location:"Location", vacances:"Vacances" };
const CAT_COLORS = { vente:"#166534", location:"#1e40af", vacances:"#d97706" }; // vert / bleu / ambre

function fmtPin(p)  { return p >= 1e6 ? `${(p/1e6).toFixed(1)}M` : p >= 1000 ? `${Math.round(p/1000)}k` : `${p}`; }
function fmtFull(p) { const n = Number(p); return (!p || isNaN(n)) ? "Prix sur demande" : n.toLocaleString("fr-TN"); }
function ucFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g," ") : ""; }

/* --- Carrousel --- */
function Carousel({ images, h = 190 }) {
  const [idx, setIdx]       = useState(0);
  const [prev2, setPrev2]   = useState(null); // index de l'image sortante
  const [dir, setDir]       = useState(1);    // 1 = gauche→droite, -1 = droite→gauche
  const [animating, setAnim]= useState(false);

  const go = (e, delta) => {
    e.stopPropagation();
    if (animating || images.length < 2) return;
    const next = (idx + delta + images.length) % images.length;
    setDir(delta);
    setPrev2(idx);
    setIdx(next);
    setAnim(true);
    setTimeout(() => { setPrev2(null); setAnim(false); }, 420);
  };

  const goTo = (e, i) => {
    e.stopPropagation();
    if (animating || i === idx) return;
    const delta = i > idx ? 1 : -1;
    setDir(delta);
    setPrev2(idx);
    setIdx(i);
    setAnim(true);
    setTimeout(() => { setPrev2(null); setAnim(false); }, 420);
  };

  return (
    <div style={{ position:"relative", height:h, background:"#f3f4f6", overflow:"hidden", flexShrink:0, isolation:"isolate" }}>
      {/* Image sortante */}
      {prev2 !== null && (
        <img src={images[prev2]} alt="" style={{
          position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
          animation:`carouselOut${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards`,
          zIndex:1,
        }}/>
      )}
      {/* Image entrante */}
      <img key={idx} src={images[idx]} alt="" style={{
        position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
        animation: prev2 !== null
          ? `carouselIn${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards`
          : "none",
        zIndex:2,
      }} loading="lazy"/>
      {images.length > 1 && <>
        <button onClick={e=>go(e,-1)} style={{...arrowBtn("left"),zIndex:3}}><ChevronLeft size={14}/></button>
        <button onClick={e=>go(e,+1)} style={{...arrowBtn("right"),zIndex:3}}><ChevronRight size={14}/></button>
        <div style={{ position:"absolute", bottom:7, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4, zIndex:3 }}>
          {images.map((_,i) => (
            <span key={i} onClick={(e)=>goTo(e,i)}
              style={{ width:6, height:6, borderRadius:"50%", cursor:"pointer",
                background: i===idx?"#fff":"rgba(255,255,255,.45)", transition:"background .2s" }}
            />
          ))}
        </div>
      </>}
    </div>
  );
}
const arrowBtn = (s) => ({
  position:"absolute", top:"50%", transform:"translateY(-50%)", [s]:8,
  width:27, height:27, borderRadius:"50%", background:"rgba(255,255,255,.45)",
  backdropFilter:"blur(4px)",
  border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 1px 4px rgba(0,0,0,.15)", color:"#fff", zIndex:2,
});

/* -------------------------------------------------------------
   ÉVALUATION DU PRIX � barre de 5 segments colorés
------------------------------------------------------------- */
const EVAL_LEVELS = [
  { key:"none",  label:"Aucune évaluation", segs:0, color:"#d1d5db" },
  { key:"high3", label:"Prix très élevé",   segs:1, color:"#dc2626" },
  { key:"high2", label:"Prix élevé",        segs:2, color:"#f59e0b" },
  { key:"fair",  label:"Prix équitable",    segs:3, color:"#3b82f6" },
  { key:"good",  label:"Bon prix",          segs:4, color:"#16a34a" },
  { key:"great", label:"Très bon prix",     segs:5, color:"#15803d" },
];
const EVAL_TOTAL = 5;

function getEvalLevel(prixM2, govAvg, count) {
  if (!count || !govAvg || !prixM2 || govAvg <= 0) return EVAL_LEVELS[0];
  const r = prixM2 / govAvg;
  if (r >= 1.30) return EVAL_LEVELS[1];
  if (r >= 1.10) return EVAL_LEVELS[2];
  if (r >= 0.90) return EVAL_LEVELS[3];
  if (r >= 0.70) return EVAL_LEVELS[4];
  return EVAL_LEVELS[5];
}

function PriceEvalBar({ prixM2, govStats }) {
  const gs  = govStats || { sum: 0, count: 0 };
  const avg = gs.count > 0 ? gs.sum / gs.count : 0;
  const ev  = getEvalLevel(prixM2, avg, gs.count);
  const isNone = ev.key === "none";
  return (
    <div className="peb">
      <span className="peb__label" style={{ color: isNone ? "#9ca3af" : ev.color }}>
        {ev.label}
      </span>
      <div className="peb__bar">
        {Array.from({ length: EVAL_TOTAL }, (_, i) => (
          <span key={i} className="peb__seg"
            style={{ background: i < ev.segs ? ev.color : "#e2e8f0" }}
          />
        ))}
      </div>
    </div>
  );
}

/* --- Comparateur helpers --- */
function getCompare() { try { return JSON.parse(localStorage.getItem("localizi_compare")||"[]"); } catch { return []; } }
function setCompare(arr) { localStorage.setItem("localizi_compare", JSON.stringify(arr)); window.dispatchEvent(new Event("compare-updated")); }

/* --- Carte de bien --- */
function PropCard({ p, active, onHover, onClick, govMarketStats, compact }) {
  const prixM2   = (p.prix > 0 && p.area > 0) ? p.prix / p.area : null;
  const govStats = govMarketStats?.[p.gouvernorat] || null;
  const realId   = p._realId || p.id?.toString().replace("api_","");

  /* -- Comparateur -- */
  const [inCompare, setInCompare] = React.useState(() => getCompare().includes(realId));
  React.useEffect(() => {
    const handler = () => setInCompare(getCompare().includes(realId));
    window.addEventListener("compare-updated", handler);
    return () => window.removeEventListener("compare-updated", handler);
  }, [realId]);
  const toggleCompare = (e) => {
    e.stopPropagation();
    const cur = getCompare();
    if (inCompare) {
      setCompare(cur.filter(id => id !== realId));
      try {
        const cd = JSON.parse(localStorage.getItem("localizi_cdata")||"{}");
        delete cd[String(realId)];
        localStorage.setItem("localizi_cdata", JSON.stringify(cd));
      } catch {}
    } else if (cur.length >= 4) {
      alert("Maximum 4 annonces dans le comparateur.");
    } else {
      try {
        const cd = JSON.parse(localStorage.getItem("localizi_cdata")||"{}");
        cd[String(realId)] = {
          titre: p.titre,
          prix: p.prix,
          devise: p.devise,
          image: (p.images||[])[0]||"",
          location: p.delegation || p.gouvernorat || "",
          categorie: p.categorie,
        };
        localStorage.setItem("localizi_cdata", JSON.stringify(cd));
      } catch {}
      setCompare([...cur, realId]);
    }
  };

  /* -- Favoris -- */
  const [isFav, setIsFav] = React.useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
      return favs.some(id => String(id) === String(realId));
    } catch { return false; }
  });

  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = `/login?redirect=/carte`;
      return;
    }
    /* Snapshot de l'�tat AVANT l'action */
    const wasOn = isFav;
    const method = wasOn ? "DELETE" : "POST";
    const url    = `${API_URL}/users/me/favoris/${realId}`;

    /* Mise à jour visuelle imm�diate */
    setIsFav(!wasOn);

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        /* Persister en localStorage */
        try {
          const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
          const updated = !wasOn
            ? [...new Set([...favs, realId])]
            : favs.filter(id => String(id) !== String(realId));
          localStorage.setItem("localizi_favs", JSON.stringify(updated));
        } catch {}
      } else {
        /* Rollback propre */
        setIsFav(wasOn);
      }
    } catch {
      setIsFav(wasOn);
    }
  };

  return (
    <div className={`pc${active?" pc--active":""}`}
      onMouseEnter={()=>onHover(p.id)} onMouseLeave={()=>onHover(null)}
      onClick={()=>onClick(p.id)}
    >
      <div style={{ position:"relative" }}>
        <Carousel images={p.images} h={compact ? 130 : 190} />
        {(p.categorie === "location" || p.categorie === "vacances") && (
          <span className={`pc__cat-badge pc__cat-badge--${p.categorie}`}>
            {p.categorie === "location" ? "Location" : "Vacances"}
          </span>
        )}
        {p.colocation && (
          <span style={{position:"absolute",top:8,left:8,zIndex:10,background:"rgba(99,102,241,.92)",color:"#fff",borderRadius:8,padding:"3px 8px",fontSize:10.5,fontWeight:700,display:"flex",alignItems:"center",gap:4,backdropFilter:"blur(4px)"}}>
            <Users size={11}/> Colocation
          </span>
        )}
      </div>
      <div className="pc__body">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{minWidth:0, flex:1}}>
            <p className="pc__price">
              {fmtFull(p.prix)}
              <span className="pc__devise">
                {fmtDevise(p.devise)}
                {p.categorie === "location" ? (p.colocation ? " /mois" : " /mois")
                  : p.categorie === "vacances" ? (
                    p.duree_type === "nuit"   ? " /nuitée"
                    : p.duree_type === "semaine" ? " /sem."
                    : p.duree_type === "mois"    ? " /mois"
                    : p.duree_type === "annee"   ? " /an"
                    : ""
                  ) : ""}
              </span>
            </p>
            {p.prix && (() => {
              const approx = fmtPriceApprox(p.prix, p.devise);
              return approx ? <p style={{fontSize:11,color:"#94a3b8",margin:"-4px 0 2px",fontWeight:500,lineHeight:1.3}}>{approx}</p> : null;
            })()}
            <p className="pc__title" style={{
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"
            }}>{p.titre}</p>
          </div>
          <button
            className={`pc__fav${isFav ? " pc__fav--on" : ""}`}
            onClick={toggleFav}
            title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart size={14} fill={isFav ? "#ef4444" : "none"}/>
          </button>
        </div>
        {/* Barre d'évaluation prix � toujours affichée */}
        <PriceEvalBar prixM2={prixM2} govStats={govStats} />
        <p className="pc__loc"><MapPin size={10}/> {p.delegation} · {p.localite}</p>
        <div className="pc__specs">
          {p.pieces != null && <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> {p.pieces} p.</span>}
          {p.beds   != null && <span><Bed      size={11}/> {p.beds} ch.</span>}
          {p.baths  != null && <span><Bath     size={11}/> {p.baths} sdb</span>}
          {p.area           && <span><Maximize size={11}/> {p.area} m²</span>}
          {p.garage         && <span><Car      size={11}/> Garage</span>}
          {p.categorie === "vacances" && <span><Users size={11}/> {p.capacite_accueil ? `${p.capacite_accueil} pers.` : "—"}</span>}
          {p.categorie === "vacances" && p.duree_valeur && p.duree_type && <span><Moon size={11}/> {p.duree_valeur} {p.duree_type === "nuit" ? "nuit(s) min" : p.duree_type === "semaine" ? "sem. min" : p.duree_type === "mois" ? "mois min" : "an min"}</span>}
        </div>
        <button
          onClick={toggleCompare}
          title={inCompare ? "Retirer du comparateur" : "Ajouter au comparateur"}
          style={{
            marginTop:8, width:"100%", padding:"5px 0",
            borderRadius:7, border:`1.5px solid ${inCompare?"#6366f1":"#e5e7eb"}`,
            background: inCompare ? "#eef2ff" : "#f8fafc",
            color: inCompare ? "#4f46e5" : "#64748b",
            fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            transition:"all .15s",
          }}
        >
          {inCompare ? "✓ Ajouté au comparateur" : "+ Comparer"}
        </button>
      </div>
    </div>
  );
}

/* --- GeoJSON gouvernorats + délégations : fichiers statiques, chargés 1x par session --- */
let GOV_GEOJSON_CACHE = null;
let DEL_GEOJSON_CACHE = null;
async function loadGovGeoJSON() {
  if (GOV_GEOJSON_CACHE) return GOV_GEOJSON_CACHE;
  try { const r = await fetch("/tunisia-gov.geojson"); GOV_GEOJSON_CACHE = await r.json(); return GOV_GEOJSON_CACHE; } catch { return null; }
}
async function loadDelGeoJSON() {
  if (DEL_GEOJSON_CACHE) return DEL_GEOJSON_CACHE;
  try { const r = await fetch("/tunisia-del.geojson"); DEL_GEOJSON_CACHE = await r.json(); return DEL_GEOJSON_CACHE; } catch { return null; }
}

/* --------------------------------------------------------------------------
   Table de correspondance GADM delNom → nom API officiel
   Utilisée dans les deux sens : sélection carte→API et highlight API→carte.
   Clé = norm(GADM name), valeur = norm(API name).
   -------------------------------------------------------------------------- */
/* Normalisation agressive : accents NFD, minuscules, tirets/apostrophes→espace, espaces multiples */
const _n = s => (s||"").normalize("NFD")
  .replace(/[̀-ͯ]/g,"")
  .toLowerCase()
  .replace(/[\u0027\u002D\u02BC\u2010-\u2015\u2018-\u2019]+/g," ")
  .replace(/\s+/g," ")
  .trim();

/* Table GADM delNom (normalisé) → API délégation (normalisé).
   Les clés sont calculées avec _n() pour rester cohérentes après les changements de _n. */
const GADM_DEL_ALIASES = Object.fromEntries([
  /* Ariana */
  ["Ariana Médina",          "Ariana Ville"],
  ["Kalaat El Andalous",     "Kalaat Landlous"],
  ["Soukra",                 "La Soukra"],
  /* Ben Arous */
  ["Boumhel",                "Bou Mhel El Bassatine"],
  ["Hammam Chott",           "Hammam Chatt"],
  ["M’Hamdia",               "Mohamadia"],
  /* Bizerte */
  ["Ghazala",                "Ghezala"],
  /* Gabès */
  ["Hamma",                  "El Hamma"],
  ["Metouia",                "El Metouia"],
  ["Ghannouch",              "Ghannouche"],
  ["Matmata Nouvelle",       "Nouvelle Matmata"],
  /* Gafsa */
  ["Guetar",                 "El Guettar"],
  ["Ksar",                   "El Ksar"],
  ["Mdhilla",                "El Mdhilla"],
  ["Sened",                  "Sned"],
  /* Jendouba */
  ["Balta Bou Aouane",       "Balta Bou Aouene"],
  ["Bousalem",               "Bou Salem"],
  ["Jendouba Nord",          "Jendouba"],
  ["Jendouba Sud",           "Jendouba"],
  /* Kairouan */
  ["Bouhajla",               "Bou Hajla"],
  ["Chrarda",                "Cherarda"],
  ["Alaa",                   "El Ala"],
  /* Kasserine */
  ["Ayoun",                  "El Ayoun"],
  ["Hidra",                  "Haidra"],
  ["Hassi El Ferid",         "Hassi El Frid"],
  ["Jedeliane",              "Jediliane"],
  ["Majel Belabbes",         "Mejel Bel Abbes"],
  /* Kébili */
  ["Faouar",                 "El Faouar"],
  ["Souk El Ahed",           "Souk El Ahad"],
  /* Kef */
  ["Ksour",                  "El Ksour"],
  ["Kalaa Khesba",           "Kalaa El Khasba"],
  ["Kalaat Senan",           "Kalaat Sinane"],
  ["Kef Est",                "Le Kef Est"],
  ["Kef Ouest",              "Le Kef Ouest"],
  ["Es Sers",                "Le Sers"],
  ["Tajerouine",             "Touiref"],
  ["Nebeur",                 "Touiref"],
  /* Mahdia */
  ["Boumerdès",              "Bou Merdes"],
  ["Boumerdes",              "Bou Merdes"],
  ["Chebba",                 "La Chebba"],
  ["Ksour Essef",            "Ksour Essaf"],
  ["Ouled Chamekh",          "Ouled Chamakh"],
  ["Sidi Alouane",           "Sidi Alouene"],
  /* Manouba */
  ["Manouba",                "Mannouba"],
  /* Médenine */
  ["Djerba Ajim",            "Ajim"],
  ["Houmt Souk",             "Houmet Essouk"],
  ["Djerba Midoun",          "Midoun"],
  /* Monastir */
  ["Jammel",                 "Jemmal"],
  ["Ksar Hellal",            "Ksar Helal"],
  ["Sayada-Lamta-Bou Hjar",  "Sayada Lamta Bou Hajar"],
  /* Nabeul */
  ["Dar Chaabane El Fehri",  "Dar Chaabane Elfehri"],
  ["Haouaria",               "El Haouaria"],
  ["Hammam Ghezaz",          "Hammam El Ghezaz"],
  /* Sfax */
  ["Hencha",                 "El Hencha"],
  ["Skhira",                 "Esskhira"],
  ["El Ghraiba",             "Ghraiba"],
  ["Kerkennah",              "Kerkenah"],
  ["Mahres",                 "Mahras"],
  ["Sfax Médina",            "Sfax Ville"],
  ["Sfax Medina",            "Sfax Ville"],
  /* Sidi Bouzid */
  ["Bir El Hfay",            "Bir El Haffey"],
  ["Jelma",                  "Jilma"],
  ["Sabalat Ouled Asker",    "Cebbala"],
  ["Meknassi",               "Maknassy"],
  ["Mazzouna",               "Mezzouna"],
  ["Sidi Ali Ben Aoun",      "Ben Oun"],
  /* Siliana */
  ["Bouarada",               "Bou Arada"],
  ["Laroussa",               "El Aroussa"],
  ["El Krib",                "Le Krib"],
  ["Bourouis",               "Sidi Bou Rouis"],
  ["Rouhia",                 "Rohia"],
  /* Zaghouan */
  ["Zriba",                  "Hammam Zriba"],
].map(([k,v]) => [_n(k), _n(v)]));

/* Reverse map : API normalized → GADM normalized */
const GADM_DEL_ALIASES_REV = Object.fromEntries(
  Object.entries(GADM_DEL_ALIASES).map(([k,v]) => [v, k])
);
/* normDel : _n + suppression des préfixes El/La/Le/Es/Bou en début */
const normDel = s => _n(s).replace(/^(el |la |le |les |es |bou )/,"");

/* matchDel : compare un nom GADM et un nom API avec les 4 stratégies
   (égalité normalisée, normDel, alias avant, alias inverse).
   Utilisé dans les handlers mouseover/mouseout/eachLayer pour éviter
   que le mouseout réinitialise le style d'une délégation sélectionnée
   quand le nom API ≠ nom GADM (ex: "La Soukra" vs "Soukra"). */
const matchDel = (gadmName, apiName) => {
  if (!apiName) return false;
  const ng = _n(gadmName), na = _n(apiName);
  return ng === na ||
         normDel(ng) === normDel(na) ||
         GADM_DEL_ALIASES[ng] === na ||
         GADM_DEL_ALIASES_REV[na] === ng;
};

/* --- Carte Leaflet --- */
function PropertyMap({ properties, activeId, selectedGov, onGovSelect, selectedDel, onDelSelect, onPinClick, onBoundsChange, showSchools, showMosques, showFaculties, showGrandSurfaces, liveSchools = [], liveMosques = [], liveFaculties = [], liveGrandSurfaces = [], onPinHover, sharedHoverTimer, centerTarget, initialView, drawMode, drawnZones, onZoneDrawn, eraseMode, eraseSelectedIdx, onEraseSelect }) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const leafletRef      = useRef(null);   /* ? Leaflet stock� ici d�s son chargement */
  const markersRef      = useRef({});
  const geoLayerRef     = useRef(null); /* legacy – plus utilisé mais conservé pour éviter les erreurs */
  const govInteractiveRef = useRef(null); /* couche interactive gouvernorats */
  const delInteractiveRef = useRef(null); /* couche interactive délégations */
  const [delLayerReady, setDelLayerReady] = useState(false); /* true dès que le layer del est chargé → force sync useEffect */
  const onGovSelectRef  = useRef(onGovSelect);
  const onDelSelectRef  = useRef(onDelSelect);
  const selectedDelRef  = useRef(selectedDel);
  const poiLayersRef    = useRef({ schools: [], mosques: [], faculties: [], grandSurfaces: [] });
  const prevGov         = useRef(null);
  const hoverTimerRef   = useRef(null);
  const selectedGovRef  = useRef(selectedGov);
  /* Ref vers onPinHover � toujours à jour, évite les closures stales dans drawPins */
  const onPinHoverRef   = useRef(onPinHover);
  /* Ref vers centerTarget � accessible dans le useEffect d'init (deps:[]) */
  const centerTargetRef = useRef(centerTarget);
  useEffect(() => { selectedGovRef.current  = selectedGov;   }, [selectedGov]);
  useEffect(() => { onPinHoverRef.current   = onPinHover;    }, [onPinHover]);
  useEffect(() => { centerTargetRef.current = centerTarget;  }, [centerTarget]);
  useEffect(() => { onGovSelectRef.current  = onGovSelect;   }, [onGovSelect]);
  useEffect(() => { onDelSelectRef.current  = onDelSelect;   }, [onDelSelect]);
  useEffect(() => { selectedDelRef.current  = selectedDel;   }, [selectedDel]);

  /* -- Zoom automatique quand un filtre de localisation est sélectionné -- */
  const lastCenterQuery = useRef(null);
  useEffect(() => {
    if (!centerTarget || !mapRef.current) return;
    if (centerTarget.query === lastCenterQuery.current) return; // déjà centr� ici
    lastCenterQuery.current = centerTarget.query;
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(centerTarget.query)}&format=json&countrycodes=tn&limit=1`,
      { headers: { "Accept-Language": "fr", "User-Agent": "Localizi/1.0" } }
    )
      .then(r => r.json())
      .then(data => {
        if (!data.length || !data[0].lat) return;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current?.flyTo([lat, lng], centerTarget.zoom, { duration: 1.0 });
      })
      .catch(() => {});
  }, [centerTarget]);


  const drawPins = useCallback((L, map, props, active) => {
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Helper: add a single pin with hover popup
    const addSinglePin = (p) => {
      const isA    = active === p.id;
      const catCls = p.categorie ? `pin-dot--${p.categorie}` : "pin-dot--std";
      const cls    = `pin-dot ${catCls}${isA ? " pin-dot--active" : ""}`;
      const icon = L.divIcon({
        className: "",
        html: `<div class="${cls}"></div>`,
        iconSize: [null, null], iconAnchor: [10, 10],
      });
      const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
      /* Clic sur pin simple → ouvre la HoverCard (pas le modal directement) */
      m.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        const px = e.containerPoint.x;
        const py = e.containerPoint.y;
        onPinHoverRef.current?.({ ...p, _px: px, _py: py });
      });

      markersRef.current[p.id] = m;
    };

    // Group pins by exact lat/lng for clustering
    const grouped = {};
    props.forEach(p => {
      if (!p.lat || !p.lng) return;
      const key = `${p.lat}_${p.lng}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    Object.values(grouped).forEach(group => {
      if (group.length === 1) {
        addSinglePin(group[0]);
      } else {
        // Cluster pin � couleur selon catégorie dominante
        const cluster = group[0];
        const count = group.length;
        // Catégorie dominante (plus fr�quente dans le groupe)
        const catCount = {};
        group.forEach(p => { catCount[p.categorie||"std"] = (catCount[p.categorie||"std"]||0)+1; });
        const dominantCat = Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0][0];
        const clusterColor = dominantCat === "vente" ? "#166534"
          : dominantCat === "location" ? "#1e40af"
          : dominantCat === "vacances" ? "#d97706"
          : "#9b1c2e";
        const clusterHtml = `
          <div style="
            display:inline-flex; align-items:center; gap:6px;
            background:${clusterColor}; color:#fff;
            border-radius:20px; padding:7px 14px 7px 10px;
            border:2.5px solid #fff;
            box-shadow:0 4px 14px rgba(0,0,0,.35);
            white-space:nowrap; cursor:pointer;
            font-family:system-ui,sans-serif;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="22" rx="1" fill="rgba(255,255,255,0.2)"/>
              <line x1="2" y1="8" x2="22" y2="8"/>
              <line x1="9" y1="22" x2="9" y2="8"/>
              <rect x="5" y="4" width="2" height="2" fill="white" stroke="none"/>
              <rect x="12" y="4" width="2" height="2" fill="white" stroke="none"/>
              <rect x="5" y="11" width="2" height="2" fill="white" stroke="none"/>
              <rect x="12" y="11" width="2" height="2" fill="white" stroke="none"/>
              <rect x="5" y="15" width="2" height="2" fill="white" stroke="none"/>
              <rect x="12" y="15" width="2" height="2" fill="white" stroke="none"/>
            </svg>
            <span style="font-size:13px;font-weight:800;line-height:1;">${count}</span>
          </div>
        `;
        const clusterIcon = L.divIcon({
          className: '',
          html: clusterHtml,
          iconSize: null,
          iconAnchor: [0, 0],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon }).addTo(map);

        /* -- Popup cluster : image GAUCHE, texte DROITE, navigation stable -- */
        let currentIdx = 0;
        /* Même palette que les badges des cartes à droite */
        const catBgMap = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
        const catFgMap = { vente:"#fff", location:"#fff", vacances:"#fff" };
        const catColor = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
        const catLabel = { vente:"ACHAT", location:"LOCATION", vacances:"VACANCES" };

        const buildPopup = () => {
          const pin = group[currentIdx];
          const img = (pin.images && pin.images[0]) || "";
          const cc  = catFgMap[pin.categorie] || "#475569";
          const bg2 = catBgMap[pin.categorie] || "#f1f5f9";
          const cl  = catLabel[pin.categorie] ?? null;
          const dev = fmtDevise(pin.devise);
          return `
            <div style="
              width:480px; font-family:'Inter',system-ui,sans-serif;
              overflow:hidden; border-radius:2px; cursor:pointer;
            " onclick="window.location.href='/annonce/${pin._realId || pin.id.toString().replace('api_','')}'">
              <!-- Image pleine largeur en haut -->
              <div style="position:relative;height:200px;overflow:hidden;background:#f1f5f9;">
                ${img
                  ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;display:block;"
                       onerror="this.src='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=70'"/>`
                  : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:56px;color:#cbd5e1;">??</div>`
                }
                <!-- badge catégorie supprim� -->
                <!-- Compteur biens supprim� � affich� en bas dans la navigation -->
              </div>

              <!-- Corps texte -->
              <div style="padding:16px 18px 14px;border-top:2px solid ${bg2};">
                <!-- Titre -->
                <div style="
                    font-size:15px;font-weight:800;color:#0f172a;
                    margin-bottom:6px;line-height:1.3;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                  ">${pin.titre || "Bien immobilier"}</div>

                <!-- Prix -->
                <div style="font-size:20px;font-weight:900;color:#0f172a;margin-bottom:10px;letter-spacing:-.02em;">
                  ${(pin.prix||0).toLocaleString("fr-TN")}
                  <span style="font-size:13px;font-weight:600;color:#64748b;margin-left:5px;">${dev}</span>
                </div>

                <!-- Specs -->
                <div style="display:flex;gap:14px;font-size:12.5px;color:#475569;margin-bottom:8px;flex-wrap:wrap;">
                  ${pin.area  ? `<span style="display:flex;align-items:center;gap:4px;">&#x25A6; ${pin.area} m&sup2;</span>` : ""}
                  ${pin.beds  != null ? `<span>&#x1F6CF; ${pin.beds} ch.</span>` : ""}
                  ${pin.baths != null ? `<span>&#x1F6BF; ${pin.baths}</span>` : ""}
                </div>

                <!-- Localisation -->
                ${pin.delegation ? `
                  <div style="font-size:11.5px;color:#94a3b8;display:flex;align-items:center;gap:4px;margin-bottom:6px;">
                    &#x1F4CD; ${pin.delegation}${pin.gouvernorat ? ` &middot; ${pin.gouvernorat}` : ""}
                  </div>
                ` : ""}
                <!-- Lien voir le détail � texte color� fond blanc -->
                <div style="
                    display:flex;align-items:center;justify-content:center;gap:4px;
                    margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9;
                    font-size:13px;font-weight:800;color:${bg2};
                    letter-spacing:.01em;">Voir d&eacute;tails <span style="font-size:15px;">&#x2192;</span></div>

                <!-- Navigation entre biens -->
                ${count > 1 ? `
                  <div style="
                    display:flex;align-items:center;justify-content:space-between;
                    margin-top:14px;padding-top:12px;border-top:1px solid #f1f5f9;
                  ">
                    <button onclick="event.stopPropagation();window._clPrev_${cluster.lat.toFixed(5).replace('.','_')}()"
                      style="
                        display:flex;align-items:center;gap:5px;
                        padding:7px 16px;border:1.5px solid #e5e7eb;border-radius:4px;
                        background:#f8fafc;cursor:pointer;
                        font-size:13px;font-weight:700;color:#374151;
                        font-family:inherit;
                      ">&#8592; Précédent</button>
                    <span style="font-size:12px;color:#94a3b8;font-weight:600;">
                      Bien ${currentIdx+1} sur ${count}
                    </span>
                    <button onclick="event.stopPropagation();window._clNext_${cluster.lat.toFixed(5).replace('.','_')}()"
                      style="
                        display:flex;align-items:center;gap:5px;
                        padding:7px 16px;border:none;border-radius:4px;
                        background:${bg2};cursor:pointer;
                        font-size:13px;font-weight:700;color:${cc};
                        font-family:inherit;
                      ">Suivant &#8594;</button>
                  </div>
                ` : ""}
              </div>
            </div>
          `;
        };

        const clKey = cluster.lat.toFixed(5).replace('.','_');
        window[`_clPrev_${clKey}`] = () => { currentIdx=(currentIdx-1+count)%count; marker.setPopupContent(buildPopup()); };
        window[`_clNext_${clKey}`] = () => { currentIdx=(currentIdx+1)%count;       marker.setPopupContent(buildPopup()); };

        marker.bindPopup(buildPopup(), {
          maxWidth:500, closeButton:true, className:"cluster-popup",
          offset:L.point(0,-8), autoPan:true, autoPanPadding:[20,20],
        });
        /* Cluster : ouvre le grand popup au hover (pas au clic) ------------------
           Le popup reste ouvert quand le curseur se d&eacute;place vers les boutons Prev/Next.
           Il se ferme seulement quand le curseur quitte &agrave; la fois le marker ET le popup. */
        /* Clic sur cluster → ouvre le popup (pas le modal) */
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onPinHoverRef.current?.(null);
        });

        // Store under a cluster key
        markersRef.current[`cluster_${cluster.lat}_${cluster.lng}`] = marker;
      }
    });
  }, [onPinClick]);

  /* init */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !containerRef.current) return;
      leafletRef.current = L;   /* ? stocker pour usage synchrone dans les effets POI */
      const iv = initialView;
      const initCenter = iv ? [iv.center.lat, iv.center.lng] : [34.5, 9.5];
      const initZoom   = iv ? iv.zoom : 6;
      const map = L.map(containerRef.current, { zoomControl:false })
        .setView(initCenter, initZoom);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution:"� OpenStreetMap � CARTO", maxZoom:19 }).addTo(map);
      L.control.zoom({ position:"bottomright" }).addTo(map);
      setTimeout(()=>map.invalidateSize(), 80);
      /* Clic sur le fond de la carte → ferme la HoverCard */
      map.on("click", () => onPinHoverRef.current?.(null));
      drawPins(L, map, properties, activeId);

      /* Couche interactive gouvernorats : fichier statique, chargement instantané */
      (async () => {
        const geoData = await loadGovGeoJSON();
        if (!live || !mapRef.current || !geoData) return;

        const styleDefault  = { color:"#94a3b8", weight:1.5, fillColor:"transparent", fillOpacity:0, opacity:0.8 };
        const styleHover    = { color:"#475569", weight:2, fillColor:"#64748b", fillOpacity:0.18, opacity:1 };
        const styleSelected = { color:"#1e40af", weight:2.5, fillColor:"#3b82f6", fillOpacity:0.13, opacity:1 };

        const govLayer = L.geoJSON(geoData, {
          style: () => ({ ...styleDefault }),
          onEachFeature: (feature, layer) => {
            const govNom = feature.properties?.govNom || "";
            const normStr = _n;
            layer.on({
              mouseover: () => {
                /* Toujours actif — ne pas hover le gov déjà sélectionné */
                if (normStr(selectedGovRef.current) === normStr(govNom)) return;
                layer.setStyle(styleHover);
              },
              mouseout: () => {
                if (normStr(selectedGovRef.current) === normStr(govNom)) return;
                layer.setStyle(styleDefault);
              },
              click: () => {
                govLayer.eachLayer(l => {
                  const n = l.feature?.properties?.govNom || "";
                  l.setStyle(normStr(n) === normStr(govNom) ? styleSelected : styleDefault);
                });
                onGovSelectRef.current?.(govNom);
              },
            });
          },
        }).addTo(map);
        govInteractiveRef.current = govLayer;

        /* Colorier + zoomer si un gouvernorat est déjà sélectionné au montage */
        if (selectedGovRef.current) {
          const normStr = _n;
          let mountBounds = null;
          govLayer.eachLayer(l => {
            const n = l.feature?.properties?.govNom || "";
            if (normStr(n) === normStr(selectedGovRef.current)) {
              l.setStyle(styleSelected);
              try { mountBounds = l.getBounds(); } catch {}
            }
          });
          if (!iv && mountBounds?.isValid()) map.fitBounds(mountBounds, { padding:[40,40], maxZoom:12 });
        }
      })();

      /* Couche interactive délégations : même approche, fichier statique */
      (async () => {
        const delData = await loadDelGeoJSON();
        if (!live || !mapRef.current || !delData) return;

        const sdDef = { color:"#6366f1", weight:1, fillColor:"transparent", fillOpacity:0, opacity:0, dashArray:"4,3" };
        const sdHov = { color:"#4338ca", weight:1.5, fillColor:"#6366f1", fillOpacity:0.15, opacity:1 };
        const sdSel = { color:"#1e40af", weight:2, fillColor:"#3b82f6", fillOpacity:0.2, opacity:1 };

        const delLayer = L.geoJSON(delData, {
          style: () => ({ ...sdDef }),
          onEachFeature: (feature, layer) => {
            const { govNom, delNom } = feature.properties || {};
            const normStr = _n;
            /* Vérifie si le gouvernorat de ce polygon = gouvernorat sélectionné
               (comparaison souple : normDel gère "Le Kef" vs "Kef", etc.) */
            const sameGov = () => {
              if (!selectedGovRef.current) return false;
              const g1 = normStr(govNom), g2 = normStr(selectedGovRef.current);
              return g1 === g2 || normDel(g1) === normDel(g2);
            };
            layer.on({
              mouseover: () => {
                /* Phase 1 : pas de gov sélectionné → délégations inactives */
                if (!sameGov()) return;
                /* Utilise matchDel pour comparer nom GADM et nom API (alias inclus) */
                if (matchDel(delNom, selectedDelRef.current)) return;
                layer.setStyle(sdHov);
              },
              mouseout: () => {
                if (!sameGov()) return;
                /* Utilise matchDel pour comparer nom GADM et nom API (alias inclus) */
                if (matchDel(delNom, selectedDelRef.current)) return;
                layer.setStyle(sdDef);
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                /* Phase 1 ou mauvais gouvernorat : ignorer */
                if (!sameGov()) return;
                delLayer.eachLayer(l => {
                  const dn = l.feature?.properties?.delNom || "";
                  const gn = l.feature?.properties?.govNom || "";
                  const _g1 = normStr(gn), _g2 = normStr(selectedGovRef.current||"");
                  const inGov = _g1 === _g2 || normDel(_g1) === normDel(_g2);
                  l.setStyle(normStr(dn) === normStr(delNom) ? sdSel : inGov ? sdDef : { ...sdDef, opacity:0 });
                });
                onDelSelectRef.current?.(delNom, govNom);
              },
            });
          },
        }).addTo(map);
        delInteractiveRef.current = delLayer;

        /* Après chargement : appliquer les styles corrects en utilisant la table
           d'alias complète (même logique que le sync useEffect) afin d'éviter la
           race condition où le useEffect s'est exécuté avant que delLayer soit prêt. */
        const sdVisible = { color:"#6366f1", weight:1, fillColor:"transparent", fillOpacity:0, opacity:0.85, dashArray:"4,3" };
        const sdHid2   = { opacity:0, fillOpacity:0 };
        const _ns = _n;
        delLayer.eachLayer(l => {
          const { govNom, delNom } = l.feature?.properties || {};
          const _g1 = _ns(govNom), _g2 = _ns(selectedGovRef.current||"");
          const inGov = selectedGovRef.current && (_g1 === _g2 || normDel(_g1) === normDel(_g2));
          const el = l.getElement?.();
          if (el) el.style.pointerEvents = inGov ? 'auto' : 'none';
          if (!inGov) { l.setStyle(sdHid2); return; }
          /* Identifier la délégation sélectionnée avec alias + normDel */
          const ng = _ns(delNom), na = _ns(selectedDelRef.current || "");
          const isSel = na && (
            ng === na ||
            normDel(ng) === normDel(na) ||
            GADM_DEL_ALIASES[ng] === na ||
            GADM_DEL_ALIASES_REV[na] === ng
          );
          l.setStyle(isSel ? sdSel : sdVisible);
        });
        setDelLayerReady(true);
      })();


      /* Quand initialView est restaur�, pr�-remplir lastCenterQuery pour que
         l'effet centerTarget ne déclenche PAS de flyTo au premier rendu. */
      if (iv && centerTargetRef.current) {
        lastCenterQuery.current = centerTargetRef.current.query;
      }

      /* -- Mise à jour de la liste au zoom/déplacement -- */
      const emitBounds = () => {
        if (onBoundsChange) onBoundsChange(map.getBounds());
        /* Persist map view for state restoration on navigate-back */
        const c = map.getCenter();
        sessionStorage.setItem("localizi_carte_view", JSON.stringify({ center: { lat: c.lat, lng: c.lng }, zoom: map.getZoom() }));
      };
      map.on("zoomend moveend", emitBounds);
      /* Sauvegarder la vue initiale imm�diatement (avant tout zoom/déplacement) */
      emitBounds();
    })();
    return ()=>{ live=false; if(mapRef.current){mapRef.current.remove();mapRef.current=null;} };
  }, []); // eslint-disable-line

  /* redessiner pins */
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then(({default:L}) => drawPins(L, mapRef.current, properties, activeId));
  }, [properties, activeId, drawPins]);

  /* Sync couches interactives quand selectedGov ou selectedDel change
     Phase 1 (pas de gov) : seuls les gouvernorats sont hoverable/cliquables
     Phase 2 (gov sélectionné) : gouvernorat figé bleu, délégations hoverable/cliquables */
  useEffect(() => {
    const govLayer = govInteractiveRef.current;
    const delLayer = delInteractiveRef.current;
    const gSel = { color:"#1e40af", weight:2.5, fillColor:"#3b82f6", fillOpacity:0.12, opacity:1 };
    const gDef = { fillColor:"transparent", fillOpacity:0, color:"#94a3b8", weight:1.5, opacity:0.8 };
    const dDef = { color:"#6366f1", weight:1, fillColor:"transparent", fillOpacity:0, opacity:0.85, dashArray:"4,3" };
    const dSel = { color:"#1e40af", weight:2, fillColor:"#3b82f6", fillOpacity:0.2, opacity:1, dashArray:null };
    const dHid = { opacity:0, fillOpacity:0 };

    const norm = _n;

    if (govLayer) {
      govLayer.eachLayer(l => {
        const n = l.feature?.properties?.govNom || "";
        l.setStyle(selectedGov && norm(n) === norm(selectedGov) ? gSel : gDef);
      });
    }

    if (delLayer) {
      delLayer.eachLayer(l => {
        const { govNom, delNom } = l.feature?.properties || {};
        const _ng = norm(govNom), _ns2 = norm(selectedGov||"");
        const inGov = selectedGov && (_ng === _ns2 || normDel(_ng) === normDel(_ns2));
        const isSel = selectedDel && matchDel(delNom, selectedDel);
        l.setStyle(inGov ? (isSel ? dSel : dDef) : dHid);
        /* pointer-events : seules les délégations du gov actif captent la souris.
           Les autres laissent passer les events au gov layer en dessous. */
        const el = l.getElement?.();
        if (el) el.style.pointerEvents = inGov ? 'auto' : 'none';
      });
    }

    /* Zoom : délégation en priorité, sinon gouvernorat, sinon vue Tunisie */
    if (selectedDel && delLayer && mapRef.current) {
      let bounds = null;
      delLayer.eachLayer(l => {
        const { govNom, delNom } = l.feature?.properties || {};
        if (selectedGov) { const _g1=norm(govNom),_g2=norm(selectedGov); if(_g1!==_g2 && normDel(_g1)!==normDel(_g2)) return; }
        if (matchDel(delNom, selectedDel)) {
          try { bounds = l.getBounds(); } catch {}
        }
      });
      if (bounds?.isValid()) mapRef.current.fitBounds(bounds, { padding:[30,30], maxZoom:14 });
    } else if (selectedGov && govLayer && mapRef.current) {
      let bounds = null;
      govLayer.eachLayer(l => {
        const _g1=norm(l.feature?.properties?.govNom||""),_g2=norm(selectedGov);
        if (_g1===_g2 || normDel(_g1)===normDel(_g2)) { try { bounds = l.getBounds(); } catch {} }
      });
      if (bounds?.isValid()) mapRef.current.fitBounds(bounds, { padding:[40,40], maxZoom:12 });
    } else if (!selectedGov && mapRef.current) {
      mapRef.current.setView([34.5, 9.5], 6);
    }
  }, [selectedGov, selectedDel, delLayerReady]);

  /* zoom r�gion + GeoJSON polygon – fires on mount and whenever selectedGov changes */

  /* -- Helper pour dessiner une couche POI � synchrone via leafletRef -- */
  const makePOIEffect = (layerKey, show, liveData, staticFallback, label, svgPath) => {
    const L   = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    /* Supprimer les marqueurs existants de cette couche */
    poiLayersRef.current[layerKey].forEach(m => { try { m.remove(); } catch {} });
    poiLayersRef.current[layerKey] = [];

    if (!show) return;

    const src  = liveData.length > 0 ? liveData : staticFallback;
    const icon = makePOIIcon(L, "#475569", svgPath);
    src.forEach(s => {
      if (!s.lat || !s.lng) return;
      try {
        const marker = L.marker([s.lat, s.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${label}</b><br>${s.nom || ""}`);
        poiLayersRef.current[layerKey].push(marker);
      } catch {}
    });
  };

  /* POIs Écoles */
  useEffect(() => makePOIEffect(
    "schools", showSchools, liveSchools,
    selectedGov ? SCHOOLS.filter(s=>s.gov===selectedGov) : SCHOOLS,
    "École", SCHOOL_SVG
  ), [showSchools, liveSchools, selectedGov]);

  /* POIs mosqu�es */
  useEffect(() => makePOIEffect(
    "mosques", showMosques, liveMosques,
    selectedGov ? MOSQUES.filter(m=>m.gov===selectedGov) : MOSQUES,
    "Mosquée", MOSQUE_SVG
  ), [showMosques, liveMosques, selectedGov]);

  /* POIs facult�s */
  useEffect(() => makePOIEffect(
    "faculties", showFaculties, liveFaculties,
    selectedGov ? FACULTIES.filter(f=>f.gov===selectedGov) : FACULTIES,
    "Faculté / Université", FACULTY_SVG
  ), [showFaculties, liveFaculties, selectedGov]);

  /* POIs grandes surfaces */
  useEffect(() => makePOIEffect(
    "grandSurfaces", showGrandSurfaces, liveGrandSurfaces,
    selectedGov ? GRAND_SURFACES.filter(g=>g.gov===selectedGov) : GRAND_SURFACES,
    "Grande surface", SURFACE_SVG
  ), [showGrandSurfaces, liveGrandSurfaces, selectedGov]);

  /* -- Mode dessin de zone -- */
  useEffect(() => {
    const map = mapRef.current;
    const L   = leafletRef.current;
    if (!map || !L) return;

    if (!drawMode) {
      map.getContainer().style.cursor = '';
      map.dragging.enable();
      return;
    }

    map.getContainer().style.cursor = 'crosshair';
    let vertices = [];
    let polyline  = null;
    let preview   = null;
    let dots      = [];
    let pending   = null;

    const redraw = () => {
      if (polyline) { polyline.remove(); polyline = null; }
      if (vertices.length >= 2)
        polyline = L.polyline(vertices, { color:'#1e40af', weight:2.5, dashArray:'7,4' }).addTo(map);
    };

    const onClick = (e) => {
      if (pending) { clearTimeout(pending); pending = null; return; }
      pending = setTimeout(() => {
        pending = null;
        vertices.push({ lat: e.latlng.lat, lng: e.latlng.lng });
        const dot = L.circleMarker(e.latlng, { radius:5, color:'#1e40af', fillColor:'#fff', fillOpacity:1, weight:2.5 }).addTo(map);
        dots.push(dot);
        redraw();
      }, 220);
    };

    const onDblClick = (e) => {
      if (pending) { clearTimeout(pending); pending = null; }
      L.DomEvent.stopPropagation(e);
      if (vertices.length < 3) return;
      cleanup();
      onZoneDrawn && onZoneDrawn(vertices);
    };

    const onMouseMove = (e) => {
      if (!vertices.length) return;
      if (preview) { preview.remove(); preview = null; }
      preview = L.polyline(
        [vertices[vertices.length - 1], { lat: e.latlng.lat, lng: e.latlng.lng }],
        { color:'#1e40af', weight:1.8, dashArray:'4,4', opacity:.6 }
      ).addTo(map);
    };

    const cleanup = () => {
      clearTimeout(pending);
      if (polyline) polyline.remove();
      if (preview)  preview.remove();
      dots.forEach(d => d.remove());
      map.off('click', onClick);
      map.off('dblclick', onDblClick);
      map.off('mousemove', onMouseMove);
      map.getContainer().style.cursor = '';
    };

    map.on('click', onClick);
    map.on('dblclick', onDblClick);
    map.on('mousemove', onMouseMove);
    return cleanup;
  }, [drawMode, onZoneDrawn]); // eslint-disable-line

  /* -- Rendu du polygone dessin� -- */
  const drawnLayersRef = useRef([]);
  useEffect(() => {
    const map = mapRef.current;
    const L   = leafletRef.current;
    if (!map || !L) return;
    drawnLayersRef.current.forEach(l => l.remove());
    drawnLayersRef.current = [];
    (drawnZones || []).forEach((zone, i) => {
      if (!zone || zone.length < 3) return;
      const isSelected = eraseMode && eraseSelectedIdx === i;
      const poly = L.polygon(
        zone.map(v => [v.lat, v.lng]),
        { color: isSelected ? '#dc2626' : '#1e40af', weight:2.5, dashArray:'7,4',
          fillColor: isSelected ? '#ef4444' : '#3b82f6', fillOpacity: isSelected ? 0.25 : 0.10 }
      ).addTo(map);
      if (eraseMode) {
        poly.on('click', (e) => { L.DomEvent.stopPropagation(e); onEraseSelect && onEraseSelect(i); });
      }
      drawnLayersRef.current.push(poly);
    });
  }, [drawnZones, eraseMode, eraseSelectedIdx]); // eslint-disable-line

  return <div ref={containerRef} style={{ width:"100%", height:"100%" }} />;
}

/* --- Tag filtre actif --- */
function Tag({ label, color, onRemove }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 9px 3px 10px",
      background: color||"#eef2ff",
      border:`1px solid ${color?"transparent":"#c7d2fe"}`,
      borderRadius:20, fontSize:11, fontWeight:600, color: color?"#fff":"#4338ca",
    }}>
      {label}
      <button onClick={onRemove} style={{ display:"flex", border:"none", background:"rgba(0,0,0,.15)", cursor:"pointer",
        padding:0, borderRadius:"50%", width:14, height:14, alignItems:"center", justifyContent:"center", color:"inherit" }}>
        <X size={9}/>
      </button>
    </span>
  );
}

/* --- S�lecteur hiérarchique localisation --- */
function LocationCascade({ govId, delId, locId, govNom, delNom, locNom, onChange }) {
  const { gouvernorats, delegations, localites, loading } = useLocalisation({
    gouvernorat: govId,
    delegation:  delId,
    localite:    locId,
  });

  /* -- R�solution automatique des IDs à partir des noms ---------------
     Quand la détection intelligente (saisie texte) remplit govNom/delNom/locNom
     sans les IDs correspondants, ces effets les retrouvent d�s que les
     listes de référence sont disponibles, et mettent à jour la cascade. */

  // 1 � govId depuis govNom
  useEffect(() => {
    if (!govId && govNom && gouvernorats.length > 0) {
      const found = gouvernorats.find(g => g.label.toLowerCase() === govNom.toLowerCase());
      if (found) {
        onChange({ govId: String(found.value), govNom, delId: "", delNom, locId: "", locNom });
      }
    }
  }, [govNom, gouvernorats]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2 � delId depuis delNom (requiert govId)
  useEffect(() => {
    if (govId && !delId && delNom && delegations.length > 0) {
      const found = delegations.find(d => d.nom.toLowerCase() === delNom.toLowerCase());
      if (found) {
        onChange({ govId, govNom, delId: String(found.id), delNom, locId: "", locNom });
      }
    }
  }, [delNom, delegations, govId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3 à locId depuis locNom (requiert delId)
  useEffect(() => {
    if (delId && !locId && locNom && localites.length > 0) {
      const found = localites.find(l => l.nom.toLowerCase() === locNom.toLowerCase());
      if (found) {
        onChange({ govId, govNom, delId, delNom, locId: String(found.id), locNom });
      }
    }
  }, [locNom, localites, delId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="loc-cascade">
      {/* Gouvernorat */}
      <div className="loc-cascade__field">
        <MapPin size={13} className="lc__ico lc__ico--gov"/>
        <select className="lc__sel"
          value={govId}
          onChange={(e) => {
            const opt = gouvernorats.find(g=>g.value===e.target.value);
            onChange({ govId:e.target.value, govNom:opt?.label||"", delId:"", delNom:"", locId:"", locNom:"" });
          }}
        >
          <option value="">{govNom || "Gouvernorat"}</option>
          {gouvernorats.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        {loading && (govId || govNom) && <Loader2 size={12} className="lc__spin"/>}
      </div>

      <ChevronRight size={14} className="loc-cascade__arrow" />

      {/* Délégation */}
      <div className={`loc-cascade__field${!govId?" loc-cascade__field--disabled":""}`}>
        <MapPin size={13} className="lc__ico lc__ico--del"/>
        <select className="lc__sel" disabled={!govId}
          value={delId}
          onChange={(e) => {
            const opt = delegations.find(d=>d.id===e.target.value);
            onChange({ govId, govNom, delId:e.target.value, delNom:opt?.nom||"", locId:"", locNom:"" });
          }}
        >
          <option value="">{delNom || "Délégation"}</option>
          {delegations.map(d=><option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
      </div>

      <ChevronRight size={14} className="loc-cascade__arrow" />

      {/* Localité */}
      <div className={`loc-cascade__field${!delId?" loc-cascade__field--disabled":""}`}>
        <MapPin size={11} className="lc__ico lc__ico--loc"/>
        <select className="lc__sel" disabled={!delId}
          value={locId}
          onChange={(e) => {
            const opt = localites.find(l=>l.id===e.target.value);
            onChange({ govId, govNom, delId, delNom, locId:e.target.value, locNom:opt?.nom||"" });
          }}
        >
          <option value="">Localité</option>
          {localites.map(l=><option key={l.id} value={l.id}>{l.nom}</option>)}
        </select>
      </div>
    </div>
  );
}

/* --- PANNEAU FILTRES --- */
const INIT_F = {
  query:"", govId:"", govNom:"", delId:"", delNom:"", locId:"", locNom:"",
  categories:[], type:"",
  prixMin:"", prixMax:"", filterDevise:"TND", superficieMin:"", superficieMax:"", bedsMin:"", piecesMin:"", chambresMin:"", etat:"", titre_foncier:"",
  features:[],
  type_terrain:"", vocation_terrain:"",
  type_appartement:"", etage_min:"",
  type_villa:"",
  nb_appartements_min:"", hauteur_immeuble:"",
  emplacement_garage:"",
  type_bureau:"",
  anciennete:"",
  colocation: false,
  datePubliMin:"",
};

function countActiveFilters(f) {
  let n = 0;
  if (f.query)                   n++;
  if (f.govId)                   n++;
  if (f.delId)                   n++;
  if (f.locId)                   n++;
  if ((f.categories||[]).length) n++;
  if (f.type)                    n++;
  if (f.prixMin)                 n++;
  if (f.prixMax)                 n++;
  if (f.superficieMin)           n++;
  if (f.superficieMax)           n++;
  if (f.bedsMin)                 n++;
  if (f.piecesMin)               n++;
  if (f.chambresMin)             n++;
  if (f.etat)                    n++;
  if (f.titre_foncier)           n++;
  if (f.vocation_terrain)        n++;
  if (f.type_terrain)            n++;
  if (f.anciennete)              n++;
  if (f.colocation)              n++;
  n += (f.features||[]).length;
  return n;
}

function FilterPanel({ filters, onChange, showSchools, showMosques, showFaculties, showGrandSurfaces,
                       onToggleSchools, onToggleMosques, onToggleFaculties, onToggleGrandSurfaces, poiLoading, poiFetched,
                       liveSchoolCount, liveMosqueCount, liveFacultyCount, liveGrandSurfaceCount }) {
  const [local,         setLocal]         = useState(filters);
  const [advanced,      setAdvanced]      = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);

  /* Resync si les filtres changent depuis l'ext�rieur (ex : navigation via la navbar) */
  useEffect(() => { setLocal(filters); }, [filters]);

  const set    = (k, v) => setLocal(f => ({ ...f, [k]:v }));
  const apply  = ()     => onChange(local);
  const reset  = ()     => { setLocal(INIT_F); onChange(INIT_F); };

  return (
    <div className="fp">
      {/* -- Ligne 1 -- */}
      <div className="fp__row1">

        {/* Recherche textuelle */}
        <div className="fp__search">
          <Search size={14} className="fp__search-ico"/>
          <input
            type="text" placeholder="Titre, quartier, adresse…"
            value={local.query}
            onChange={(e)=>set("query",e.target.value)}
            onKeyDown={(e)=>e.key==="Enter"&&apply()}
            className="fp__search-inp"
          />
          {local.query && <button onClick={()=>set("query","")} className="fp__clear"><X size={11}/></button>}
        </div>

        {/* Catégorie � multi-sélection avec bouton Tous */}
        <div className="fp__pill-group">
          {/* Tous � actif quand aucune catégorie sélectionnée */}
          <button
            className={`fp__pill fp__pill--tous${(local.categories||[]).length === 0 ? " fp__pill--on" : ""}`}
            onClick={() => set("categories", [])}
          >
            Tous
          </button>
          {["vente", "location", "vacances"].map(v => {
            const active = (local.categories || []).includes(v);
            return (
              <button key={v}
                className={`fp__pill fp__pill--${v}${active ? " fp__pill--on" : ""}`}
                onClick={() => {
                  const cats = local.categories || [];
                  set("categories", active ? cats.filter(c => c !== v) : [...cats, v]);
                }}
              >
                {CAT_LBL[v]}
              </button>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:8, marginLeft:"auto", alignItems:"center" }}>
          {/* Filtres avancés */}
          <button className={`fp__adv-btn${advanced?" fp__adv-btn--on":""}`} onClick={()=>setAdvanced(!advanced)}>
            <SlidersHorizontal size={13}/>
            <span>Filtres</span>
            <ChevronDown size={11} style={{ transform:advanced?"rotate(180deg)":"none", transition:"transform .2s" }}/>
          </button>

          {/* Bouton rechercher */}
          <button className="fp__submit" onClick={apply}>
            <Search size={14}/> Rechercher
          </button>
        </div>
      </div>

      {/* -- Localisation hiérarchique -- */}
      <div className="fp__loc-row">
        <LocationCascade
          govId={local.govId} govNom={local.govNom}
          delId={local.delId} delNom={local.delNom}
          locId={local.locId} locNom={local.locNom}
          onChange={(v) => {
            // Sélection cascade ? efface la recherche texte préc�dente
            const updated = { ...local, ...v, query: "" };
            setLocal(updated);
            onChange(updated);   // applique imm�diatement sans cliquer "Rechercher"
          }}
        />

        {/* Overlays POI */}
        <div className="fp__poi-group">
          <button
            className={`fp__poi-btn fp__poi-btn--school${showSchools?" fp__poi-btn--on":""}`}
            onClick={onToggleSchools}
          >
            {poiLoading && showSchools
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={SCHOOL_SVG}/>
            }
            Écoles
            {showSchools && !poiLoading && poiFetched && (
              <span className="fp__poi-count">{liveSchoolCount}</span>
            )}
          </button>
          <button
            className={`fp__poi-btn fp__poi-btn--mosque${showMosques?" fp__poi-btn--on":""}`}
            onClick={onToggleMosques}
          >
            {poiLoading && showMosques
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={MOSQUE_SVG}/>
            }
            Mosquées
            {showMosques && !poiLoading && poiFetched && (
              <span className="fp__poi-count">{liveMosqueCount}</span>
            )}
          </button>
          <button
            className={`fp__poi-btn fp__poi-btn--faculty${showFaculties?" fp__poi-btn--on":""}`}
            onClick={onToggleFaculties}
          >
            {poiLoading && showFaculties
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={FACULTY_SVG}/>
            }
            Facultés
            {showFaculties && !poiLoading && poiFetched && (
              <span className="fp__poi-count">{liveFacultyCount}</span>
            )}
          </button>
          <button
            className={`fp__poi-btn fp__poi-btn--surface${showGrandSurfaces?" fp__poi-btn--on":""}`}
            onClick={onToggleGrandSurfaces}
          >
            {poiLoading && showGrandSurfaces
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={SURFACE_SVG}/>
            }
            Grandes surfaces
            {showGrandSurfaces && !poiLoading && poiFetched && (
              <span className="fp__poi-count">{liveGrandSurfaceCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* -- Filtres avancés -- */}
      {advanced && (
        <div className="fp__advanced">
          {/* Type de bien — filtré si vacances seulement */}
          <div className="fp__adv-group">
            <label className="fp__adv-label">Type de bien</label>
            <select className="fp__adv-sel" value={local.type} onChange={(e) => {
              const newType = e.target.value;
              setLocal(f => ({
                ...INIT_F,
                query: f.query,
                govId: f.govId,   govNom: f.govNom,
                delId: f.delId,   delNom: f.delNom,
                locId: f.locId,   locNom: f.locNom,
                categories:   f.categories,
                filterDevise: f.filterDevise,
                type: newType,
              }));
            }}>
              <option value="">Tous</option>
              {(local.categories?.length === 1 && local.categories[0] === "vacances"
                ? ["appartement","villa_maison","immobiliers_divers"]
                : TYPES
              ).map(t=><option key={t} value={t}>{TYPE_LBL[t] || ucFirst(t)}</option>)}
            </select>
          </div>
          {/* Prix min / max avec devise inline */}
          <div className="fp__adv-group">
            <label className="fp__adv-label">Prix min</label>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <input type="number" placeholder="0" value={local.prixMin}
                onChange={(e)=>set("prixMin",e.target.value)} className="fp__adv-inp" style={{flex:1,minWidth:0}}/>
              <select className="fp__adv-sel" style={{minWidth:"unset",width:"56px",padding:"7px 6px",flexShrink:0,cursor:"pointer"}}
                value={local.filterDevise||"TND"} onChange={e=>set("filterDevise",e.target.value)}>
                <option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Prix max</label>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <input type="number" placeholder="" value={local.prixMax}
                onChange={(e)=>set("prixMax",e.target.value)} className="fp__adv-inp" style={{flex:1,minWidth:0}}/>
              <select className="fp__adv-sel" style={{minWidth:"unset",width:"56px",padding:"7px 6px",flexShrink:0,cursor:"pointer"}}
                value={local.filterDevise||"TND"} onChange={e=>set("filterDevise",e.target.value)}>
                <option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Superficie min (m²)</label>
            <input type="number" placeholder="0" value={local.superficieMin}
              onChange={(e)=>set("superficieMin",e.target.value)} className="fp__adv-inp"/>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Superficie max (m²)</label>
            <input className="fp__adv-inp" type="number" placeholder="8" min="0"
              value={local.superficieMax || ""}
              onChange={e => set("superficieMax", e.target.value)}/>
          </div>
          {/* Nbr pièces min */}
          {!["terrain","garage_parking","depot_stockage","immeuble"].includes(local.type) && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Nbr pièces min</label>
              <select className="fp__adv-sel" value={local.piecesMin||""} onChange={e=>set("piecesMin",e.target.value)}>
                <option value="">Peu importe</option>
                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          )}
          {/* Nbr chambre min */}
          {!["terrain","garage_parking","depot_stockage","immeuble","bureau","local_commercial"].includes(local.type) && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Nbr chambre min</label>
              <select className="fp__adv-sel" value={local.chambresMin||""} onChange={e=>set("chambresMin",e.target.value)}>
                <option value="">Peu importe</option>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          )}
                    {/* ── APPARTEMENT ── */}
          {local.type === "appartement" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de logement</label>
              <select className="fp__adv-sel" value={local.type_appartement||""} onChange={e=>set("type_appartement",e.target.value)}>
                <option value="">Tous</option>
                <option value="studio">Studio</option>
                <option value="s0">S0</option>
                <option value="s+1">S+1</option>
                <option value="s+2">S+2</option>
                <option value="s+3">S+3</option>
                <option value="s+4">S+4</option>
                <option value="duplex">Duplex</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Étage du bien</label>
              <select className="fp__adv-sel" value={local.etage_min||""} onChange={e=>set("etage_min",e.target.value)}>
                <option value="">Tous</option>
                <option value="0">RDC (Rez-de-chaussée)</option>
                <option value="1">1er étage</option>
                <option value="2">2ème étage</option>
                <option value="3">3ème étage</option>
                <option value="4">4ème+</option>
              </select>
            </div>
          </>)}

          {/* ── VILLA/MAISON ── */}
          {local.type === "villa_maison" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de villa</label>
              <select className="fp__adv-sel" value={local.type_villa||""} onChange={e=>set("type_villa",e.target.value)}>
                <option value="">Tous</option>
                <option value="r">RDC (Rez-de-chaussée)</option>
                <option value="r+1">R+1</option>
                <option value="r+2">R+2</option>
                <option value="r+3">R+3</option>
                <option value="r+4">R+4</option>
              </select>
            </div>
          )}

          {/* ── IMMEUBLE ── */}
          {local.type === "immeuble" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Nbre d'appartements min</label>
              <select className="fp__adv-sel" value={local.nb_appartements_min||""} onChange={e=>set("nb_appartements_min",e.target.value)}>
                <option value="">Peu importe</option>
                {[2,4,6,8,10,15,20].map(n=><option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Hauteur de l'immeuble</label>
              <select className="fp__adv-sel" value={local.hauteur_immeuble||""} onChange={e=>set("hauteur_immeuble",e.target.value)}>
                <option value="">Toutes</option>
                {["R+1","R+2","R+3","R+4","R+5","R+6","R+7","R+8","R+9","R+10"].map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </>)}

          {/* ── TERRAIN ── */}
          {local.type === "terrain" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de terrain</label>
              <select className="fp__adv-sel" value={local.type_terrain||""} onChange={e=>{ set("type_terrain",e.target.value); set("vocation_terrain",""); }}>
                <option value="">Tous</option>
                <option value="agricole">Agricole</option>
                <option value="nu">Nu</option>
                <option value="zone_verte">Zone verte</option>
                <option value="lotissement">Lotissement</option>
                <option value="commercial">Commercial</option>
                <option value="industriel">Industriel</option>
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Vocation</label>
              <select className="fp__adv-sel" value={local.vocation_terrain||""} onChange={e=>set("vocation_terrain",e.target.value)}>
                <option value="">Toutes</option>
                {(local.type_terrain === "agricole"   ? [["agricole","Agricole"],["touristique","Touristique"],["mixte","Mixte"]]
                : local.type_terrain === "zone_verte" ? [["residentielle","Résidentielle"],["mixte","Mixte"],["touristique","Touristique"]]
                : local.type_terrain === "lotissement"? [["residentielle","Résidentielle"],["commerciale","Commerciale"],["mixte","Mixte"]]
                : local.type_terrain === "commercial" ? [["commerciale","Commerciale"],["mixte","Mixte"]]
                : local.type_terrain === "industriel" ? [["industrielle","Industrielle"],["mixte","Mixte"]]
                : [["residentielle","Résidentielle"],["commerciale","Commerciale"],["industrielle","Industrielle"],["agricole","Agricole"],["touristique","Touristique"],["mixte","Mixte"]]
                ).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </>)}

          {/* ── LOCAL COMMERCIAL ── */}
          {local.type === "local_commercial" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Étage du bien</label>
              <select className="fp__adv-sel" value={local.etage_min||""} onChange={e=>set("etage_min",e.target.value)}>
                <option value="">Tous</option>
                <option value="-1">Sous-sol</option>
                <option value="0">RDC (Rez-de-chaussée)</option>
                <option value="1">R+1</option>
                <option value="2">R+2</option>
                <option value="3">R+3</option>
                <option value="4">R+4</option>
              </select>
            </div>
          )}

          {/* ── BUREAU ── */}
          {local.type === "bureau" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de bureau</label>
              <select className="fp__adv-sel" value={local.type_bureau||""} onChange={e=>set("type_bureau",e.target.value)}>
                <option value="">Tous</option>
                {["H0","H+1","H+2","H+3","H+4","H+5","Open Space"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Étage du bien</label>
              <select className="fp__adv-sel" value={local.etage_min||""} onChange={e=>set("etage_min",e.target.value)}>
                <option value="">Tous</option>
                <option value="-1">Sous-sol</option>
                <option value="0">RDC (Rez-de-chaussée)</option>
                <option value="1">R+1</option>
                <option value="2">R+2</option>
                <option value="3">R+3</option>
                <option value="4">R+4</option>
              </select>
            </div>
          </>)}

          {/* ── GARAGE ── */}
          {local.type === "garage_parking" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Emplacement</label>
              <select className="fp__adv-sel" value={local.emplacement_garage||""} onChange={e=>set("emplacement_garage",e.target.value)}>
                <option value="">Tous</option>
                <option value="en_exterieur">En extérieur</option>
                <option value="en_sous_sol">En sous-sol</option>
              </select>
            </div>
          )}

          {/* Titre foncier — terrain seulement */}
          {local.type === "terrain" && (
            <div className="fp__adv-group" style={{alignSelf:"flex-end"}}>
              <label className="fp__adv-label">Titre foncier</label>
              <label style={{
                display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8,
                background: local.titre_foncier==="1" ? "#f0fdf4" : "#fff",
                borderColor: local.titre_foncier==="1" ? "#bbf7d0" : "#e5e7eb",
                fontSize:13, fontFamily:"inherit", color:"#374151", whiteSpace:"nowrap",
              }}>
                <input type="checkbox" checked={local.titre_foncier==="1"}
                  onChange={(e)=>set("titre_foncier",e.target.checked?"1":"")}
                  style={{accentColor:"#16a34a", width:14, height:14}}/>
                Titre foncier uniquement
              </label>
            </div>
          )}
          {/* Ancienneté de publication */}
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <span style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em"}}>Date publication</span>
          <select
            className="fp__adv-sel"
            value={local.anciennete||""}
            onChange={e => set("anciennete", e.target.value)}
            title="Date de publication"
            style={{minWidth:160}}
          >
            <option value="">Toutes dates</option>
            <option value="1">Aujourd'hui</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="60">60 derniers jours</option>
            <option value="90">3 derniers mois</option>
            <option value="180">6 derniers mois</option>
          </select>
          </div>

          {/* Niveau de standing � pour types résidentiels/commerciaux */}
          {["appartement","villa","villa_maison","immeuble","local_commercial","bureau"].includes(local.type) && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Standing</label>
              <select className="fp__adv-sel" value={local.standing||""} onChange={e=>set("standing",e.target.value)}>
                <option value="">Tous</option>
                <option value="economique">Économique</option>
                <option value="moyen_standing">Moyen standing</option>
                <option value="haut_standing">Haut standing</option>
              </select>
            </div>
          )}

          {/* Colocation */}
          {(local.type === "" || local.type === "appartement" || local.type === "villa" || local.type === "villa_maison") && (
            <div className="fp__adv-group" style={{alignSelf:"flex-end"}}>
              <label className="fp__adv-label">Colocation</label>
              <label style={{
                display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8,
                background: local.colocation ? "#eef2ff" : "#fff",
                borderColor: local.colocation ? "#a5b4fc" : "#e5e7eb",
                fontSize:13, fontFamily:"inherit", color:"#374151", whiteSpace:"nowrap",
              }}>
                <input type="checkbox" checked={!!local.colocation}
                  onChange={e => set("colocation", e.target.checked)}
                  style={{accentColor:"#6366f1", width:14, height:14}}/>
                Colocation uniquement
              </label>
            </div>
          )}

          {/* Autres critères� masqu� pour terrain (non pertinent) */}
          {!["terrain","garage_parking","depot_stockage"].includes(local.type) && (
          <button
            className={`fp__adv-btn${(local.features||[]).length > 0 ? " fp__adv-btn--on" : ""}`}
            type="button"
            onClick={() => setShowFeatModal(true)}
            style={{ alignSelf:"flex-end" }}
          >
            Autres critères{(local.features||[]).length > 0 ? ` (${local.features.length})` : " +"}
          </button>
          )}
          <button className="fp__reset" onClick={reset}><X size={11}/> Réinitialiser</button>
        </div>
      )}

      {/* -- Modal "Autres critères" � ic�nes comme dans la création d'annonce -- */}
      {showFeatModal && ReactDOM.createPortal(
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.60)", zIndex:999999,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"16px"
        }} onClick={e=>{ if(e.target===e.currentTarget) setShowFeatModal(false); }}>
          <div style={{
            background:"#fff", borderRadius:20, width:"100%", maxWidth:760,
            maxHeight:"88vh", overflow:"hidden", display:"flex", flexDirection:"column",
            boxShadow:"0 24px 80px rgba(0,0,0,.30)",
            fontFamily:"'Inter',system-ui,sans-serif"
          }}>
            {/* Header */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"22px 28px 18px", borderBottom:"1px solid #f1f5f9", flexShrink:0
            }}>
              <div>
                <h3 style={{fontSize:19,fontWeight:800,color:"#0f172a",margin:0}}>Caractéristiques</h3>
                <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Sélectionnez les équipements souhaités</p>
              </div>
              <button onClick={()=>setShowFeatModal(false)}
                style={{width:34,height:34,borderRadius:"50%",background:"#f1f5f9",border:"none",
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>
                <X size={16}/>
              </button>
            </div>

            {/* Body scrollable */}
            <div style={{flex:1,overflowY:"auto",padding:"20px 28px"}}>
              {[
                { section:"Vue", items:[
                  {k:"vue_mer",     l:"Vue sur mer",    Ico:Waves       },
                  {k:"vue_montagne",l:"Vue sur montagne",   Ico:Mountain    },
                  {k:"vue_foret",   l:"Vue sur forêt",      Ico:TreePine    },
                ]},
                { section:"Espaces extérieurs", items:[
                  {k:"jardin",   l:"Jardin",   Ico:Fence        },
                  {k:"terrasse", l:"Terrasse", Ico:Sun          },
                  {k:"balcon",   l:"Balcon",   Ico:Flower2      },
                  {k:"piscine",  l:"Piscine",  Ico:Droplets     },
                  {k:"parking",  l:"Parking",  Ico:ParkingCircle},
                ]},
                { section:"Commodités", items:[
                  {k:"ascenseur",    l:"Ascenseur",       Ico:ArrowUpDown},
                  {k:"garage",       l:"Garage",          Ico:Car        },
                  {k:"cellier",      l:"Cellier",Ico:Package   },
                  {k:"meuble",       l:"Meublé",          Ico:Sofa       },
                  {k:"concierge",    l:"Concierge",       Ico:Users      },
                  {k:"gardien",      l:"Gardien",         Ico:ShieldCheck},
                  {k:"animaux_admis",l:"Animaux admis",   Ico:Heart      },
                ]},
                { section:"Intérieur & équipements", items:[
                  {k:"cuisine_equipee",  l:"Cuisine équipée",  Ico:UtensilsCrossed},
                  {k:"climatisation",    l:"Climatisation",    Ico:Wind           },
                  {k:"chauffage_centrale",l:"Chauffage central",Ico:Thermometer  },
                  {k:"cheminee",         l:"Cheminée",         Ico:Flame          },
                  {k:"double_vitrage",   l:"Double vitrage",   Ico:DoorClosed     },
                  {k:"porte_blindee",    l:"Porte blindée",    Ico:LockKeyhole    },
                  {k:"securite",         l:"Sécurité",         Ico:Fingerprint    },
                  {k:"internet",         l:"Internet",         Ico:Wifi           },
                  {k:"tv",               l:"TV",               Ico:Monitor        },
                  {k:"machine_laver",    l:"Machine à laver",  Ico:RefreshCw      },
                  {k:"digicode",         l:"Digicode",         Ico:KeyRound       },
                  {k:"interphone",       l:"Interphone",       Ico:PhoneCall      },
                ]},
              ].map(({section, items}) => (
                <div key={section} style={{marginBottom:28}}>
                  <div style={{
                    fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",
                    letterSpacing:".6px",marginBottom:14,display:"flex",alignItems:"center",gap:8
                  }}>{section}</div>
                  <div style={{
                    display:"grid",
                    gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",
                    gap:10
                  }}>
                    {items.map(({k, l, Ico}) => {
                      const isOn = (local.features||[]).includes(k);
                      return (
                        <button key={k} type="button"
                          onClick={() => {
                            const cur = local.features||[];
                            set("features", isOn ? cur.filter(f=>f!==k) : [...cur,k]);
                          }}
                          style={{
                            position:"relative",
                            display:"flex",flexDirection:"column",alignItems:"center",
                            gap:7,padding:"18px 8px 14px",
                            borderRadius:14,border:"none",
                            background: isOn ? "#eef2ff" : "transparent",
                            cursor:"pointer",fontFamily:"inherit",
                            transition:"background .15s,transform .15s",
                            minHeight:90,
                          }}
                          onMouseEnter={e=>{ if(!isOn) e.currentTarget.style.background="#f8faff"; }}
                          onMouseLeave={e=>{ if(!isOn) e.currentTarget.style.background="transparent"; }}
                        >
                          <Ico size={36} strokeWidth={1.4}
                            style={{color: isOn?"#4f46e5":"#94a3b8",transition:"color .15s"}}/>
                          <span style={{
                            fontSize:11.5,fontWeight:600,textAlign:"center",lineHeight:1.3,
                            color:isOn?"#4f46e5":"#6b7280"
                          }}>{l}</span>
                          {isOn && (
                            <div style={{
                              position:"absolute",top:7,right:7,
                              width:16,height:16,borderRadius:"50%",
                              background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center"
                            }}>
                              <Check size={10} color="#fff" strokeWidth={3}/>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              display:"flex",gap:12,justifyContent:"space-between",alignItems:"center",
              padding:"16px 28px 20px",borderTop:"1px solid #f1f5f9",flexShrink:0,
              background:"#fafafa"
            }}>
              <span style={{fontSize:13,color:"#64748b"}}>
                {(local.features||[]).length > 0
                  ? `${local.features.length} critère${local.features.length>1?"s":""} sélectionné${local.features.length>1?"s":""}`
                  : "Aucun critère sélectionné"}
              </span>
              <div style={{display:"flex",gap:10}}>
                <button type="button"
                  onClick={() => set("features",[])}
                  style={{padding:"10px 18px",borderRadius:10,border:"1.5px solid #e5e7eb",
                    background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer",
                    fontSize:13,fontFamily:"inherit"}}
                >Tout effacer</button>
                <button type="button"
                  onClick={() => { onChange({...local}); setShowFeatModal(false); }}
                  style={{padding:"10px 22px",borderRadius:10,border:"none",
                    background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",
                    fontSize:13,fontFamily:"inherit",
                    boxShadow:"0 4px 14px rgba(15,23,42,.25)"}}
                >Voir les résultats</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* -------------------------------------------------------------
   PAGE PRINCIPALE
------------------------------------------------------------- */
/* --------------------------------------------------------------
   SCORE COMPOSITE � tie-breaking entre annonces de même boost
   --------------------------------------------------------------
   Critère            Poids max   Logique
   -------------------------------------------------------------
   boost_level        4 000 pts   priorité absolue (1000 � niveau)
   photos             200 pts     =5 photos = score plein
   description        100 pts     =200 car. = score plein, =50 = moitié
   titre_foncier      150 pts     confiance juridique
   fraîcheur          500 pts     500 - jours depuis publication (min 0)
   --------------------------------------------------------------
   Total max          ~4 950 pts
   Les annonces du même niveau boost sont donc d�partag�es par
   la qualité et la fraîcheur, pas aléatoirement.
-------------------------------------------------------------- */
function computeScore(p) {
  const boost     = (p.boost || 0) * 1000;
  const photos    = Math.min((p.images?.length || 0), 5) * 40;            // 40pts � nb photos (max 200)
  const desc      = (p.description?.length || 0) >= 200 ? 100
                  : (p.description?.length || 0) >= 50  ? 50 : 0;
  const tf        = p.titre_foncier ? 150 : 0;
  const freshness = p.date_creation
    ? Math.max(0, 500 - Math.floor((Date.now() - new Date(p.date_creation)) / 86_400_000))
    : 0;
  return boost + photos + desc + tf + freshness;
}

function transformApiAnnonce(a) {
  return {
    id:            `api_${a.id}`,
    _realId:       a.id,
    titre:         a.titre,
    prix:          a.prix,
    devise:        a.devise,
    gouvernorat:   a.gouvernorat   || "",
    delegation:    a.delegation    || "",
    localite:      a.localite      || "",
    address:       a.address       || "",
    beds:          a.nb_chambres    || null,
    pieces:        a.nb_pieces      || null,
    baths:         a.nb_salles_bain || null,
    garage:        !!(a.features?.includes("garage") || a.features?.includes("parking")),
    area:          a.superficie     || 0,
    type:          a.type_bien === "maison" ? "villa_maison" : (a.type_bien || ""),
    categorie:     a.categorie,
    duree_type:       a.duree_type       || null,
    duree_valeur:     a.duree_valeur     || null,
    capacite_accueil: a.capacite_accueil || null,
    etat:             a.etat_bien          || null,
    titre_foncier:    a.titre_foncier      || false,
    type_appartement: a.type_appartement   || null,
    type_villa:       a.type_villa         || null,
    type_bureau:      a.type_bureau        || null,
    etage:            a.etage              ?? null,
    nb_appartements:  a.nb_appartements    || null,
    hauteur_immeuble: a.hauteur_immeuble   || null,
    emplacement_garage: a.emplacement_garage || null,
    boost:         a.boost_level   || 0,
    description:   a.description   || "",
    date_creation: a.date_creation || null,
    lat:           a.latitude,
    lng:           a.longitude,
    images:        (a.images || []).length > 0
      ? (a.images || []).map(img => img.startsWith("http") ? img : `${API_URL}${img}`)
      : a.image_principale
        ? [a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`]
        : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"],
    features:      a.features || [],
    colocation:    a.colocation || false,
    places_totales:  a.places_totales  || null,
    places_occupees: a.places_occupees || null,
    profil_coloc:    a.profil_coloc    || null,
    isReal: true,
  };
}

/* Mapping clé filtre ? label feature (pour le filtre "Autres critères") */
const FEAT_KEY_TO_LABEL = {
  jardin:"Jardin", terrasse:"Terrasse", balcon:"Balcon", parking:"Parking",
  garage:"Garage", ascenseur:"Ascenseur", vue_mer:"Vue sur mer",
  vue_montagne:"Vue sur montagne", vue_foret:"Vue sur forêt", piscine:"Piscine",
  concierge:"Concierge", cellier:"Cellier", meuble:"Meublé",
  gardien:"Gardien", animaux_admis:"Animaux admis",
  cuisine_equipee:"Cuisine équipée", climatisation:"Climatisation",
  chauffage_centrale:"Chauffage central", cheminee:"Cheminée",
  double_vitrage:"Double vitrage", porte_blindee:"Porte blindée",
  securite:"Sécurité", internet:"Internet", tv:"TV",
  machine_laver:"Machine à laver", digicode:"Digicode", interphone:"Interphone",
  salon_americain:"Salon am�ricain", relie_onas:"Reli� ONAS",
  fibre_optique:"Fibre optique",
};

/* --- Popup comparateur (s'affiche quand on ajoute un bien) --- */
function ComparePopup({ onClose }) {
  const navigate = useNavigate();
  const [ids, setIds] = React.useState(getCompare);
  const getCdata = () => { try { return JSON.parse(localStorage.getItem("localizi_cdata")||"{}"); } catch { return {}; } };
  const [cdata, setCdata] = React.useState(getCdata);

  React.useEffect(() => {
    const h = () => { setIds(getCompare()); setCdata(getCdata()); };
    window.addEventListener("compare-updated", h);
    return () => window.removeEventListener("compare-updated", h);
  }, []);

  const catColors = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
  const catLabels = { vente:"Achat", location:"Location", vacances:"Vacances" };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"rgba(15,23,42,0.6)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"20px", animation:"fadeIn .2s ease",
    }} onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:20, maxWidth:560, width:"100%",
        padding:"32px 28px", boxShadow:"0 30px 80px rgba(0,0,0,.25)",
        position:"relative", fontFamily:"'Inter',system-ui,sans-serif",
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position:"absolute", top:14, right:14,
          background:"#f1f5f9", border:"none", borderRadius:"50%",
          width:32, height:32, cursor:"pointer", color:"#64748b",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, fontWeight:400, lineHeight:1,
        }}>×</button>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <Logo variant="color" height={32} to={null} />
          <div>
            <div style={{fontSize:17,fontWeight:800,color:"#0f172a"}}>Sélection pour comparaison</div>
            <div style={{fontSize:12.5,color:"#94a3b8"}}>{ids.length} bien{ids.length>1?"s":""} sélectionné{ids.length>1?"s":""} � max 4</div>
          </div>
        </div>

        <div style={{height:1,background:"#f1f5f9",margin:"20px 0"}}/>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24,maxHeight:320,overflowY:"auto"}}>
          {ids.map((id, idx) => {
            const d = cdata[String(id)] || {};
            const catColor = catColors[d.categorie] || "#4f46e5";
            return (
              <div key={id} style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"13px 14px", borderRadius:12,
                background:"#f8fafc", border:"1.5px solid #e5e7eb",
                position:"relative",
              }}>
                <div style={{
                  width:10, height:10, borderRadius:"50%", flexShrink:0,
                  background:catColor, boxShadow:`0 0 0 3px ${catColor}22`,
                }}/>
                {d.image ? (
                  <img src={d.image} style={{
                    width:60, height:46, objectFit:"cover",
                    borderRadius:8, flexShrink:0, background:"#e5e7eb",
                  }} onError={e => { e.target.style.display="none"; }} />
                ) : (
                  <div style={{width:60,height:46,borderRadius:8,background:"#e5e7eb",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>??</div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {d.titre || `Annonce #${id}`}
                  </div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                    {d.location && <span style={{display:"inline-flex",alignItems:"center",gap:3}}><MapPin size={11} strokeWidth={2} style={{color:"#94a3b8",flexShrink:0}}/>{d.location}</span>}
                    {d.prix && (
                      <span style={{fontWeight:700,color:catColor}}>
                        {Number(d.prix).toLocaleString("fr-TN")} {fmtDevise(d.devise)}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => {
                  setCompare(getCompare().filter(i => i !== id));
                  try {
                    const cd = JSON.parse(localStorage.getItem("localizi_cdata")||"{}");
                    delete cd[String(id)];
                    localStorage.setItem("localizi_cdata", JSON.stringify(cd));
                  } catch {}
                }} style={{
                  background:"none", border:"1.5px solid #e5e7eb", borderRadius:"50%",
                  width:28, height:28, cursor:"pointer", color:"#94a3b8",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16, flexShrink:0, transition:"all .15s",
                }}>×</button>
              </div>
            );
          })}
        </div>

        {ids.length === 0 ? (
          <div style={{textAlign:"center",color:"#94a3b8",fontSize:14,paddingBottom:8}}>
            Sélectionnez des biens depuis la carte pour les comparer.
          </div>
        ) : (
          <div style={{display:"flex",gap:12}}>
            <button onClick={onClose} style={{
              flex:1, padding:"12px", borderRadius:10,
              border:"1.5px solid #e5e7eb", background:"#f8fafc",
              color:"#374151", fontWeight:700, cursor:"pointer",
              fontSize:14, fontFamily:"inherit",
            }}>
              Annuler
            </button>
            <button onClick={() => { onClose(); navigate(`/comparateur?ids=${ids.join(",")}`); }} style={{
              flex:2, padding:"12px", borderRadius:10,
              border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
              color:"#fff", fontWeight:700, cursor:"pointer",
              fontSize:14, fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              Aller au comparateur ?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Hover card avec carousel (pin simple au clic) --- */
function HoverCard({ pin, sharedHoverTimer, onOpen, onLeave }) {
  const images = (pin.images && pin.images.length > 0) ? pin.images : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"];
  const [idx,     setIdx]    = useState(0);
  const [prevIdx, setPrevIdx]= useState(null);
  const [dir,     setDir]    = useState(1);
  const [sliding, setSliding]= useState(false);

  const realId = pin._realId || pin.id?.toString().replace("api_","");
  const [isFav, setIsFav] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_favs")||"[]").some(id => String(id) === String(realId)); }
    catch { return false; }
  });
  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = `/login?redirect=/carte`; return; }
    const wasOn = isFav;
    setIsFav(!wasOn);
    try {
      const res = await fetch(`${API_URL}/users/me/favoris/${realId}`, {
        method: wasOn ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
        const updated = wasOn ? favs.filter(id => String(id) !== String(realId)) : [...favs, realId];
        localStorage.setItem("localizi_favs", JSON.stringify(updated));
      } else { setIsFav(wasOn); }
    } catch { setIsFav(wasOn); }
  };

  /* Auto-fermeture après 10 s d'inactivité */
  const autoCloseTimer = React.useRef(null);
  const resetTimer = React.useCallback(() => {
    clearTimeout(autoCloseTimer.current);
    autoCloseTimer.current = setTimeout(() => onLeave(), 10000);
  }, [onLeave]);
  React.useEffect(() => {
    resetTimer();
    return () => clearTimeout(autoCloseTimer.current);
  }, [resetTimer]);

  const go = (e, delta) => {
    e.stopPropagation();
    resetTimer();
    if (sliding || images.length < 2) return;
    const next = (idx + delta + images.length) % images.length;
    setDir(delta); setPrevIdx(idx); setIdx(next); setSliding(true);
    setTimeout(() => { setPrevIdx(null); setSliding(false); }, 380);
  };

  const mapEl = document.querySelector(".leaflet-container");
  const mapW  = mapEl?.clientWidth  || 800;
  const mapH  = mapEl?.clientHeight || 600;
  const cardW = 320;
  const cardH = 280;
  const px = pin._px || 20;
  const py = pin._py || 100;
  const left = (px + 18 + cardW > mapW - 8) ? Math.max(px - cardW - 14, 8) : px + 18;
  const top  = Math.min(Math.max(py - 80, 8), mapH - cardH - 8);

  const catBg = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
  const bg    = catBg[pin.categorie] || "#6366f1";

  return (
    <div
      style={{
        position:"absolute", left, top, width:cardW, zIndex:9100,
        pointerEvents:"auto", cursor:"pointer",
        background:"#fff", borderRadius:12, overflow:"hidden",
        boxShadow:"0 8px 32px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.12)",
        animation:"hoverFadeIn .12s ease", border:"1.5px solid #e2e8f0",
      }}
      onClick={() => onOpen(pin.id.toString().replace("api_",""))}
      onMouseEnter={resetTimer}
      onMouseLeave={() => onLeave()}
    >
      {/* Carousel image */}
      <div style={{position:"relative", height:160, overflow:"hidden", isolation:"isolate"}}>
        {prevIdx !== null && (
          <img src={images[prevIdx]} alt="" style={{
            position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            animation:`carouselOut${dir>0?"L":"R"} .38s cubic-bezier(.4,0,.2,1) forwards`, zIndex:1,
          }}/>
        )}
        <img key={idx} src={images[idx]} alt="" style={{
          position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
          animation: prevIdx !== null ? `carouselIn${dir>0?"L":"R"} .38s cubic-bezier(.4,0,.2,1) forwards` : "none",
          zIndex:2,
        }} onError={e=>{ e.currentTarget.src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"; }}/>
        {/* Cœur favoris */}
        <button
          onClick={toggleFav}
          style={{position:"absolute",top:7,right:7,zIndex:6,width:28,height:28,borderRadius:"50%",
            background:"rgba(255,255,255,.85)",backdropFilter:"blur(4px)",
            border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}
        >
          <Heart size={13} fill={isFav?"#ef4444":"none"} color={isFav?"#ef4444":"#374151"}/>
        </button>
        {/* Badge catégorie */}
        {(pin.categorie === "location" || pin.categorie === "vacances") && (
          <span style={{position:"absolute",top:8,left:8,zIndex:5,background:bg,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>
            {pin.categorie === "location" ? "Location" : "Vacances"}
          </span>
        )}
        {pin.colocation && (
          <span style={{position:"absolute",top:36,left:8,zIndex:5,background:"rgba(99,102,241,.9)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,display:"flex",alignItems:"center",gap:3}}>
            <Users size={9}/> Colocation
          </span>
        )}
        {/* Flèches */}
        {images.length > 1 && <>
          <button onClick={e=>go(e,-1)} style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,.42)",backdropFilter:"blur(4px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",zIndex:4}}>
            <ChevronLeft size={12}/>
          </button>
          <button onClick={e=>go(e,+1)} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,.42)",backdropFilter:"blur(4px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",zIndex:4}}>
            <ChevronRight size={12}/>
          </button>
          <div style={{position:"absolute",bottom:5,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:4}}>
            {images.map((_,i)=><span key={i} onClick={e=>{e.stopPropagation();if(!sliding&&i!==idx){setDir(i>idx?1:-1);setPrevIdx(idx);setIdx(i);setSliding(true);setTimeout(()=>{setPrevIdx(null);setSliding(false);},380);}}} style={{width:5,height:5,borderRadius:"50%",cursor:"pointer",background:i===idx?"#fff":"rgba(255,255,255,.45)"}}/>)}
          </div>
        </>}
      </div>
      {/* Corps */}
      <div style={{padding:"11px 14px 12px"}}>
        <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 4px",lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pin.titre}</p>
        <p style={{fontSize:19,fontWeight:900,color:"#0f172a",margin:"0 0 7px",letterSpacing:"-.01em"}}>
          {(pin.prix||0).toLocaleString("fr-TN")}
          <span style={{fontSize:12,fontWeight:400,color:"#94a3b8",marginLeft:4}}>{fmtDevise(pin.devise)}</span>
        </p>
        <div style={{display:"flex",gap:10,fontSize:11.5,color:"#64748b",flexWrap:"wrap",marginBottom:2}}>
          {pin.area  && <span style={{display:"flex",alignItems:"center",gap:3}}><Maximize size={10}/> {pin.area} m²</span>}
          {pin.beds  != null && <span style={{display:"flex",alignItems:"center",gap:3}}><Bed size={10}/> {pin.beds} ch.</span>}
          {pin.baths != null && <span style={{display:"flex",alignItems:"center",gap:3}}><Bath size={10}/> {pin.baths} sdb</span>}
        </div>
        {pin.delegation && (
          <p style={{fontSize:10.5,color:"#94a3b8",margin:"5px 0 0",display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            <MapPin size={9} style={{flexShrink:0}}/> {pin.delegation}{pin.gouvernorat ? ` · ${pin.gouvernorat}` : ""}
          </p>
        )}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:8,paddingTop:7,borderTop:"1px solid #f1f5f9",fontSize:12,fontWeight:800,color:bg}}>
          Voir détails <ChevronRight size={13}/>
        </div>
      </div>
    </div>
  );
}

/* --- Bandeau comparateur flottant --- */
function CompareBar() {
  const navigate = useNavigate();
  const [ids, setIds] = React.useState(getCompare);
  React.useEffect(() => {
    const handler = () => setIds(getCompare());
    window.addEventListener("compare-updated", handler);
    return () => window.removeEventListener("compare-updated", handler);
  }, []);
  if (ids.length === 0) return null;
  return (
    <div style={{
      background:"#0f172a", color:"#fff",
      display:"inline-flex", alignItems:"center", gap:12,
      padding:"6px 16px", borderRadius:12,
      boxShadow:"0 2px 12px rgba(0,0,0,.3)",
      fontFamily:"'Inter',system-ui,sans-serif", fontSize:13,
      whiteSpace:"nowrap", flexShrink:0,
    }}>
      <span style={{fontWeight:700}}>{ids.length} bien{ids.length>1?"s":""} sélectionné{ids.length>1?"s":""}</span>
      <button onClick={() => navigate(`/comparateur?ids=${ids.join(",")}`)}
        style={{
          padding:"5px 14px", borderRadius:8, border:"none",
          background:"#6366f1", color:"#fff", fontWeight:700, cursor:"pointer",
          fontSize:12, fontFamily:"inherit",
        }}>
        Comparer ?
      </button>
      <button onClick={() => {
          setCompare([]);
          try { localStorage.removeItem("localizi_compare_meta"); } catch {}
          try { localStorage.removeItem("localizi_cdata"); } catch {}
        }}
        style={{
          padding:"5px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,.2)",
          background:"transparent", color:"rgba(255,255,255,.7)", fontWeight:600,
          cursor:"pointer", fontSize:11, fontFamily:"inherit",
        }}>
        Vider
      </button>
    </div>
  );
}

export default function CartePage() {
  const navigate                   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive]         = useState(null);
  const [apiProperties, setApiProps] = useState([]);
  const [mapBounds, setMapBounds]   = useState(null);
  /* Ref toujours synchronis� avec allProperties (utilisé dans applyFilters) */
  const allPropertiesRef = useRef([]);
  /* Liste complète des gouvernorats — pour la détection même sans annonces chargées */
  const { gouvernorats: _allGovs } = useLocalisation({ gouvernorat:"", delegation:"", localite:"" });
  const govListRef = useRef([]);
  govListRef.current = _allGovs;

  /* -- Lecture URL ? objet filtre (source de v�rit� unique) -- */
  const readFiltersFromUrl = useCallback((sp) => ({
    categories:    (sp.get("categories") || sp.get("categorie") || "")
                     .split(",").map(s => s.trim()).filter(Boolean),
    query:         sp.get("q")           || "",
    type:          sp.get("type")        || "",
    govNom:        sp.get("gouvernorat") || "",
    delNom:        sp.get("delegation")  || "",
    locNom:        sp.get("localite")    || "",
    govId:         sp.get("govId")       || "",
    delId:         sp.get("delId")       || "",
    locId:         sp.get("locId")       || "",
    filterDevise:  sp.get("devise") || "TND",
    prixMin:       sp.get("prixMin")     || "",
    prixMax:       sp.get("prixMax")     || "",
    superficieMin: sp.get("sMin")        || "",
    superficieMax: sp.get("sMax")        || "",
    bedsMin:       sp.get("beds")        || "",
    piecesMin:     sp.get("pMin")        || "",
    chambresMin:   sp.get("cMin")        || "",
    etat:          sp.get("etat")        || "",
    titre_foncier: sp.get("tf")          || "",
    features:      (sp.get("feat") || "").split(",").map(s=>s.trim()).filter(Boolean),
    type_terrain:    sp.get("tterrain") || "",
    vocation_terrain:sp.get("vterrain") || "",
    colocation:      sp.get("colocation") === "1",
  }), []);

  /* -- �tat initial : URL d'abord, sessionStorage en fallback -- */
  const [filters, setFilters] = useState(() => {
    const fromUrl = readFiltersFromUrl(searchParams);
    const hasUrlFilters = Object.values(fromUrl).some(v =>
      Array.isArray(v) ? v.length > 0 : v !== ""
    );
    if (hasUrlFilters) return { ...INIT_F, ...fromUrl };
    /* Pas de params URL ? restaurer depuis sessionStorage (retour depuis détail) */
    try {
      const saved = JSON.parse(sessionStorage.getItem("localizi_carte_filters"));
      if (saved) return { ...INIT_F, ...saved };
    } catch {}
    return { ...INIT_F };
  });

  /* Liste des délégations du gouvernorat actif — mise à jour dès que govId change */
  const delListRef = useRef([]);
  useEffect(() => {
    if (!filters.govId) { delListRef.current = []; return; }
    getDelegations(filters.govId)
      .then(r => { if (Array.isArray(r.data)) delListRef.current = r.data.map(d => ({ id: String(d.id||d.value||""), nom: d.nom||d.name||"" })); })
      .catch(() => {});
  }, [filters.govId]);

  /* -- Sync URL params ? filters (navigation externe / retour navigateur) -- */
  useEffect(() => {
    setFilters({ ...INIT_F, ...readFiltersFromUrl(searchParams) });
    setListPage(1); // reset pagination on filter change
  }, [searchParams, readFiltersFromUrl]);

  /* -- Sauvegarde sessionStorage (restauration au retour depuis le détail) -- */
  useEffect(() => {
    sessionStorage.setItem("localizi_carte_filters", JSON.stringify(filters));
  }, [filters]);

  /* -- écriture URL ? ALL filtres sérialis�s --
     D�tection de localisation dans le texte saisi (synchrone, sur les données charg�es). */
  const handleSaveSearch = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaveModalLoading(true);
    try {
      const nom = (saveModalName || "").trim() || "Ma recherche";
      const res = await fetch(`${API_URL}/users/me/saved-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nom, criteres: filters, email_alert: true }),
      });
      if (res.ok) { setSaveModalSuccess(true); }
      else { setSaveModalSuccess(false); setShowSaveModal(false); }
    } catch { setShowSaveModal(false); }
    finally { setSaveModalLoading(false); }
  };

  const applyFilters = useCallback((newFilters) => {
    let f = { ...newFilters };
    const q = (f.query || "").trim();

    if (q) {
      /* Dans CartePage, la recherche texte = filtre libre sur titre + adresse uniquement.
         La détection de hiérarchie est faite en amont (page d'accueil via /localisation/search). */
      f = { ...f, query: q };
    }

    setFilters(f);
    const sp = new URLSearchParams();
    const cats = f.categories || [];
    if (cats.length > 0)    sp.set("categories",  cats.join(","));
    if (f.query)            sp.set("q",           f.query);
    if (f.type)             sp.set("type",        f.type);
    if (f.govNom)           sp.set("gouvernorat", f.govNom);
    if (f.delNom)           sp.set("delegation",  f.delNom);
    if (f.locNom)           sp.set("localite",    f.locNom);
    if (f.govId)            sp.set("govId",       f.govId);
    if (f.delId)            sp.set("delId",       f.delId);
    if (f.locId)            sp.set("locId",       f.locId);
    if (f.filterDevise && f.filterDevise !== "TND") sp.set("devise", f.filterDevise);
    if (f.prixMin)          sp.set("prixMin",     f.prixMin);
    if (f.prixMax)          sp.set("prixMax",     f.prixMax);
    if (f.superficieMin)    sp.set("sMin",        f.superficieMin);
    if (f.superficieMax)    sp.set("sMax",        f.superficieMax);
    if (f.bedsMin)          sp.set("beds",        f.bedsMin);
    if (f.piecesMin)        sp.set("pMin",        f.piecesMin);
    if (f.chambresMin)      sp.set("cMin",        f.chambresMin);
    if (f.etat)             sp.set("etat",        f.etat);
    if (f.titre_foncier)    sp.set("tf",          f.titre_foncier);
    if (f.type_terrain)     sp.set("tterrain", f.type_terrain);
    if (f.vocation_terrain) sp.set("vterrain", f.vocation_terrain);
    if (f.features && f.features.length > 0) sp.set("feat", f.features.join(","));
    if (f.standing)          sp.set("standing",    f.standing);
    if (f.colocation)        sp.set("colocation",  "1");
    /* setSearchParams déclenche le useEffect ci-dessus qui met à jour filters */
    setSearchParams(sp, { replace: true });
  }, [setSearchParams]);

  const _savedPOI     = (() => { try { return JSON.parse(sessionStorage.getItem("localizi_carte_poi")  || "null"); } catch { return null; } })();
  const [savedMapView] = useState(() => { try { return JSON.parse(sessionStorage.getItem("localizi_carte_view") || "null"); } catch { return null; } });
  const [drawMode,         setDrawMode]         = useState(false);
  const [drawnZones,       setDrawnZones]       = useState([]); /* [{lat,lng}][] */
  const [eraseMode,        setEraseMode]        = useState(false);
  const [eraseSelectedIdx, setEraseSelectedIdx] = useState(null);
  const [modalId,          setModalId]          = useState(null);
  const [showSaveModal,    setShowSaveModal]    = useState(false);
  const [saveModalName,    setSaveModalName]    = useState("Ma recherche");
  const [saveModalLoading, setSaveModalLoading] = useState(false);
  const [saveModalSuccess, setSaveModalSuccess] = useState(false);
  const [saveFilterAlert,  setSaveFilterAlert]  = useState(false);
  const [showMinFiltersModal, setShowMinFiltersModal] = useState(false);
  const [showSchools,      setShowSchools]      = useState(_savedPOI?.showSchools      ?? false);
  const [showMosques,      setShowMosques]      = useState(_savedPOI?.showMosques      ?? false);
  const [showFaculties,    setShowFaculties]    = useState(_savedPOI?.showFaculties    ?? false);
  const [showGrandSurfaces,setShowGrandSurfaces]= useState(_savedPOI?.showGrandSurfaces ?? false);
  const [listMode,         setListMode]         = useState(searchParams.get("vue") === "liste");
  const [listPage,         setListPage]         = useState(1);
  const [listLoading,      setListLoading]      = useState(false);
  const PAGE_SIZE = 30;
  const [livePOIs,         setLivePOIs]         = useState({ schools: [], mosques: [], faculties: [], grandSurfaces: [], loading: false, fetched: false });
  const [hoveredPin,       setHoveredPin]       = useState(null);
  /* Timer partag� : PropertyMap (mouseleave pin) ET hover card (onMouseEnter) l'utilisent */
  const sharedHoverTimer = useRef(null);
  /* Basculer vers vue carte via événement custom (bouton Map de la Navbar) */
  React.useEffect(() => {
    const h = () => setListMode(false);
    window.addEventListener("localizi-switch-to-carte", h);
    return () => window.removeEventListener("localizi-switch-to-carte", h);
  }, []);

  /* -- Fetch POIs depuis Overpass (bbox visible de la carte) -- */
  const fetchPOIs = useCallback(async (bbox) => {
    if (!bbox) return;
    setLivePOIs(prev => ({ ...prev, loading: true }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s max

    try {
      const query =
        `[out:json][timeout:18];\n` +
        `(\n` +
        `  node["amenity"="school"](${bbox});\n` +
        `  way["amenity"="school"](${bbox});\n` +
        `  node["amenity"="place_of_worship"]["religion"="muslim"](${bbox});\n` +
        `  way["amenity"="place_of_worship"]["religion"="muslim"](${bbox});\n` +
        `  node["amenity"="university"](${bbox});\n` +
        `  way["amenity"="university"](${bbox});\n` +
        `  node["amenity"="college"](${bbox});\n` +
        `  way["amenity"="college"](${bbox});\n` +
        `  node["shop"~"supermarket|mall|department_store"](${bbox});\n` +
        `  way["shop"~"supermarket|mall|department_store"](${bbox});\n` +
        `);\nout center;`;

      const ovRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: query, signal: controller.signal,
      });
      const ovData = await ovRes.json();
      const elements = ovData.elements || [];

      const toPoint = e => ({
        lat: e.type === "way" ? e.center?.lat : e.lat,
        lng: e.type === "way" ? e.center?.lon : e.lon,
      });

      const schools = elements
        .filter(e => e.tags?.amenity === "school")
        .map(e => ({ id:`ov_sc_${e.id}`, nom: e.tags?.name || "École", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      const mosques = elements
        .filter(e => e.tags?.amenity === "place_of_worship" && e.tags?.religion === "muslim")
        .map(e => ({ id:`ov_mo_${e.id}`, nom: e.tags?.name || "Mosquée", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      const faculties = elements
        .filter(e => e.tags?.amenity === "university" || e.tags?.amenity === "college")
        .map(e => ({ id:`ov_fac_${e.id}`, nom: e.tags?.name || "Faculté", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      const grandSurfaces = elements
        .filter(e => e.tags?.shop && /supermarket|mall|department_store/.test(e.tags.shop))
        .map(e => ({ id:`ov_gs_${e.id}`, nom: e.tags?.name || "Grande surface", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      setLivePOIs({ schools, mosques, faculties, grandSurfaces, loading: false, fetched: true });
    } catch {
      setLivePOIs(prev => ({ ...prev, loading: false, fetched: true }));
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  /* Ref vers la bbox courante de la carte (mis à jour à chaque zoom/pan) */
  const mapBboxRef = useRef(null);

  /* Conversion Leaflet bounds ? string bbox Overpass */
  const boundsToOverpassBbox = useCallback((bounds) => {
    if (!bounds || !bounds.getSouth) return null;
    return `${bounds.getSouth().toFixed(6)},${bounds.getWest().toFixed(6)},${bounds.getNorth().toFixed(6)},${bounds.getEast().toFixed(6)}`;
  }, []);

  /* -- Re-fetch quand la bbox change ET qu'au moins un bouton est actif -- */
  useEffect(() => {
    if (!mapBounds) return;
    const newBbox = boundsToOverpassBbox(mapBounds);
    mapBboxRef.current = newBbox;
    const anyActive = showSchools || showMosques || showFaculties || showGrandSurfaces;
    if (!anyActive) return;
    /* Réinitialise fetched pour forcer un nouveau fetch sur la nouvelle zone */
    setLivePOIs(prev => ({ ...prev, fetched: false }));
    const timer = setTimeout(() => {
      if (mapBboxRef.current) fetchPOIs(mapBboxRef.current);
    }, 600);
    return () => clearTimeout(timer);
  }, [mapBounds]); // eslint-disable-line

  const livePOIsRef = useRef({ schools:[], mosques:[], faculties:[], grandSurfaces:[] });
  livePOIsRef.current = livePOIs;

  const handleTogglePOI = useCallback((type, currentState) => {
    const next = !currentState;

    /* -- D�sactiver : juste masquer les marqueurs, PAS de re-fetch -- */
    if (!next) {
      if (type === "schools")       setShowSchools(false);
      if (type === "mosques")       setShowMosques(false);
      if (type === "faculties")     setShowFaculties(false);
      if (type === "grandSurfaces") setShowGrandSurfaces(false);
      return;
    }

    /* -- Activer : afficher + fetch seulement si pas encore de données -- */
    if (type === "schools")       setShowSchools(true);
    if (type === "mosques")       setShowMosques(true);
    if (type === "faculties")     setShowFaculties(true);
    if (type === "grandSurfaces") setShowGrandSurfaces(true);

    const current = livePOIsRef.current;
    /* Fetch uniquement si pas encore charg� ET pas en cours de chargement */
    if (!current.fetched && !current.loading) {
      if (mapBboxRef.current) {
        fetchPOIs(mapBboxRef.current);
      } else {
        /* Attendre que la carte émette ses bounds (max 1.5s) */
        const waitForBbox = setInterval(() => {
          if (mapBboxRef.current) {
            clearInterval(waitForBbox);
            fetchPOIs(mapBboxRef.current);
          }
        }, 200);
        setTimeout(() => clearInterval(waitForBbox), 1500);
      }
    }
    /* Si déjà fetch� ? les effets de dessin affichent les données (même vides = compteur 0) */
  }, [fetchPOIs]);

  /* Persist POI state to sessionStorage */
  useEffect(() => {
    sessionStorage.setItem("localizi_carte_poi", JSON.stringify({ showSchools, showMosques, showFaculties, showGrandSurfaces }));
  }, [showSchools, showMosques, showFaculties, showGrandSurfaces]);

  /* If any POI was restored from sessionStorage, trigger fetch once the map bbox is ready */
  useEffect(() => {
    if (!(showSchools || showMosques || showFaculties || showGrandSurfaces)) return;
    const waitId = setInterval(() => {
      if (mapBboxRef.current && !livePOIsRef.current.fetched && !livePOIsRef.current.loading) {
        clearInterval(waitId);
        fetchPOIs(mapBboxRef.current);
      } else if (mapBboxRef.current) {
        clearInterval(waitId); // bbox ready but already fetching/fetched
      }
    }, 200);
    setTimeout(() => clearInterval(waitId), 3000);
    return () => clearInterval(waitId);
  }, []); // eslint-disable-line

  useEffect(() => {
    setListLoading(true);
    fetch(`${API_URL}/annonces/public?limit=300`)
      .then(r => r.json())
      .then(data => {
        const transformed = (Array.isArray(data) ? data : []).map(transformApiAnnonce);
        setApiProps(transformed.filter(a => a.lat && a.lng));
      })
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  /* Sync favoris API ? localStorage au montage (si connect�) */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/users/me/favoris`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!Array.isArray(data)) return;
        const ids = data.map(f => f.annonce_id || f.id).filter(Boolean);
        localStorage.setItem("localizi_favs", JSON.stringify(ids));
      })
      .catch(() => {});
  }, []);

  /* Annonces réelles uniquement */
  const allProperties = [...apiProperties];
  allPropertiesRef.current = allProperties; // toujours à jour pour applyFilters

  /* -- Cible de zoom carte selon la hiérarchie sélectionnée --
     Plus on précise (gov ? del ? loc), plus le zoom est �lev�. */
  const centerTarget = React.useMemo(() => {
    const { locNom, delNom, govNom } = filters;
    if (!govNom && !delNom && !locNom) return null;
    const parts = [locNom, delNom, govNom].filter(Boolean);
    const zoom  = locNom ? 14 : delNom ? 12 : 10;
    return { query: parts.join(", ") + ", Tunisie", zoom };
  }, [filters.govNom, filters.delNom, filters.locNom]);

  /* Stats march� : prix moyen/m� par gouvernorat (vente uniquement) */
  const govMarketStats = React.useMemo(() => {
    const stats = {};
    allProperties.forEach(p => {
      if (p.categorie !== "vente" || !p.gouvernorat || !p.prix || !p.area || p.area <= 0) return;
      if (!stats[p.gouvernorat]) stats[p.gouvernorat] = { sum: 0, count: 0 };
      stats[p.gouvernorat].sum   += p.prix / p.area;
      stats[p.gouvernorat].count += 1;
    });
    return stats;
  }, [allProperties]);

  /* Filtrage complet (carte + liste) */
  const results = allProperties
    .filter((p) => {
      /* -- Filtre localisation + adresse (UNION) --
         Si une localisation est détect�e, une annonce passe si :
           (elle correspond à la hiérarchie)  OU  (son adresse/titre contient la requ�te)
         Sinon (texte libre) : filtre sur titre + tous champs géo + adresse */
      const hasLocationFilter = filters.govNom || filters.delNom || filters.locNom;
      if (hasLocationFilter) {
        const norm = _n;
        const locationMatch =
          (!filters.govNom || norm(p.gouvernorat) === norm(filters.govNom)) &&
          (!filters.delNom || norm(p.delegation)  === norm(filters.delNom)) &&
          (!filters.locNom || norm(p.localite)    === norm(filters.locNom));
        const addressMatch = filters.query &&
          `${p.titre} ${p.address||""}`.toLowerCase().includes(filters.query.toLowerCase());
        if (!locationMatch && !addressMatch) return false;
      } else if (filters.query) {
        if (!`${p.titre} ${p.delegation} ${p.gouvernorat} ${p.localite} ${p.address||""}`
            .toLowerCase().includes(filters.query.toLowerCase())) return false;
      }
      const cats = filters.categories || [];
      if (cats.length > 0 && !cats.includes(p.categorie))       return false;
      if (filters.type) {
        if (filters.type === "villa_maison") {
          if (!["villa","maison","villa_maison"].includes(p.type)) return false;
        } else {
          if (p.type !== filters.type) return false;
        }
      }
      if (filters.prixMin || filters.prixMax) {
        const fd = filters.filterDevise || "TND";
        // Convertir le prix de l'annonce vers la devise du filtre pour comparaison
        const prixConverti = convertPrice(p.prix, p.devise || "TND", fd) ?? p.prix;
        if (filters.prixMin && prixConverti < +filters.prixMin) return false;
        if (filters.prixMax && prixConverti > +filters.prixMax) return false;
      }
      if (filters.superficieMin && p.area < +filters.superficieMin) return false;
      if (filters.superficieMax && p.area > +filters.superficieMax) return false;
      if (filters.bedsMin && (p.beds==null||p.beds < +filters.bedsMin)) return false;
      if (filters.piecesMin   && (p.pieces==null || p.pieces  < +filters.piecesMin))   return false;
      if (filters.chambresMin && (p.beds==null   || p.beds    < +filters.chambresMin)) return false;
      if (filters.datePubliMin && p.date_creation) {
        if (new Date(p.date_creation) < new Date(filters.datePubliMin)) return false;
      }
      if (filters.etat && p.etat !== filters.etat)               return false;
      if (filters.titre_foncier==="1" && !p.titre_foncier)       return false;
      if (filters.type_terrain        && p.type_terrain        !== filters.type_terrain)        return false;
      if (filters.vocation_terrain    && p.vocation_terrain    !== filters.vocation_terrain)    return false;
      if (filters.type_appartement    && p.type_appartement    !== filters.type_appartement)    return false;
      if (filters.type_villa          && p.type_villa          !== filters.type_villa)          return false;
      if (filters.type_bureau         && p.type_bureau         !== filters.type_bureau)         return false;
      if (filters.etage_min           && (p.etage == null || p.etage < +filters.etage_min))     return false;
      if (filters.nb_appartements_min && (p.nb_appartements == null || p.nb_appartements < +filters.nb_appartements_min)) return false;
      if (filters.hauteur_immeuble    && p.hauteur_immeuble    !== filters.hauteur_immeuble)    return false;
      if (filters.emplacement_garage  && p.emplacement_garage  !== filters.emplacement_garage)  return false;
      /* -- Filtre ancienneté -- */
      if (filters.anciennete && p.date_creation) {
        const joursMax = parseInt(filters.anciennete);
        const joursEcoules = Math.floor((Date.now() - new Date(p.date_creation)) / 86_400_000);
        if (joursEcoules > joursMax) return false;
      }
      if (filters.features && filters.features.length > 0) {
        const hasAll = filters.features.every(feat => {
          /* Convertir la clé filtre en label (ex: "jardin" ? "Jardin") */
          const label = FEAT_KEY_TO_LABEL[feat] || feat;
          if (Array.isArray(p.features) && p.features.length > 0) {
            return p.features.includes(label);
          }
          /* Fallback : vérifier le bool�en direct (données d�mo) */
          return p[feat] === true;
        });
        if (!hasAll) return false;
      }
      if (filters.colocation && !p.colocation) return false;
      return true;
    })
    .sort((a, b) => computeScore(b) - computeScore(a));

  /* Sous-ensemble visible : zone dessin�e > bounds carte > tout
     En mode liste pure on ignore les bounds (la carte est masqu�e) */
  const visibleResults = drawnZones.length > 0
    ? results.filter(p => p.lat && p.lng && drawnZones.some(z => pointInPolygon({ lat: p.lat, lng: p.lng }, z)))
    : mapBounds
      ? results.filter(p => p.lat && p.lng && mapBounds.contains && mapBounds.contains([p.lat, p.lng]))
      : results;

  /* Pagination liste */
  const listTotalPages = Math.ceil(visibleResults.length / PAGE_SIZE);
  const listPageResults = visibleResults.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  /* Tags filtres actifs (toujours visibles même si 0 résultats) */
  const activeTags = [
    /* query = filtre texte libre silencieux � pas de chip, seules les localisations vérifi�es en ont un */
    filters.govNom     && { label:filters.govNom,          key:"govNom",  color:"#4f46e5" },
    filters.delNom     && { label:filters.delNom,         key:"delNom",  color:"#7c3aed" },
    filters.locNom     && { label:filters.locNom,         key:"locNom",  color:"#9333ea" },
    ...(filters.categories||[]).map(c=>({ label:CAT_LBL[c], key:`cat_${c}`, color:"#0369a1" })),
    filters.type       && { label:ucFirst(filters.type),  key:"type",    color:"#0f766e" },
    filters.etat       && { label:ETAT_LBL[filters.etat], key:"etat",    color:"#92400e" },
    filters.prixMin    && { label:`>= ${fmtFull(+filters.prixMin)} ${filters.filterDevise||"TND"}`, key:"prixMin", color:"#1d4ed8" },
    filters.prixMax    && { label:`<= ${fmtFull(+filters.prixMax)} ${filters.filterDevise||"TND"}`, key:"prixMax", color:"#1d4ed8" },
    filters.superficieMin && { label:`>= ${filters.superficieMin} m²`, key:"superficieMin", color:"#0369a1" },
    filters.superficieMax && { label:`<= ${filters.superficieMax} m²`, key:"superficieMax", color:"#0369a1" },
    filters.piecesMin  && { label:`${filters.piecesMin}+ pièces`, key:"piecesMin", color:"#be185d" },
    filters.chambresMin && { label:`${filters.chambresMin}+ chambres`, key:"chambresMin", color:"#be185d" },
    filters.bedsMin    && { label:`${filters.bedsMin}+ ch.`, key:"bedsMin", color:"#be185d" },
    filters.datePubliMin && { label:`Depuis ${filters.datePubliMin}`, key:"datePubliMin", color:"#0f766e" },
    filters.titre_foncier && { label:"Titre foncier",     key:"titre_foncier", color:"#15803d" },
    filters.colocation    && { label:"Colocation",         key:"colocation",    color:"#6366f1" },
    ...(filters.features||[]).map(k => ({ label: k.replace(/_/g," "), key:`feat_${k}`, color:"#7c3aed" })),
  ].filter(Boolean);

  /* Click pin ? scroll vers la carte */
  const handlePin = (id) => {
    setActive(id);
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"nearest" });
  };

  /* removeTag passe par applyFilters pour synchroniser URL + sessionStorage */
  const removeTag = (key) => {
    let newF;
    if (key === "govNom")      newF = { ...filters, govId:"", govNom:"", delId:"", delNom:"", locId:"", locNom:"" };
    else if (key === "delNom") newF = { ...filters, delId:"", delNom:"", locId:"", locNom:"" };
    else if (key === "locNom") newF = { ...filters, locId:"", locNom:"" };
    else if (key.startsWith("cat_")) {
      const cat = key.replace("cat_","");
      newF = { ...filters, categories: (filters.categories||[]).filter(c => c !== cat) };
    }
    else if (key.startsWith("feat_")) {
      const feat = key.replace("feat_","");
      newF = { ...filters, features: (filters.features||[]).filter(f => f !== feat) };
    }
    else newF = { ...filters, [key]: "" };
    applyFilters(newF);
  };

  return (
    <div className={`cp-root${listMode ? "" : " cp-root--carte"}`}>
      <Navbar />

      <div style={{position:"sticky",top:64,zIndex:200,background:"#fff",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
      <FilterPanel
        filters={filters} onChange={applyFilters}
        showSchools={showSchools} showMosques={showMosques} showFaculties={showFaculties} showGrandSurfaces={showGrandSurfaces}
        onToggleSchools={()=>handleTogglePOI("schools",      showSchools)}
        onToggleMosques={()=>handleTogglePOI("mosques",      showMosques)}
        onToggleFaculties={()=>handleTogglePOI("faculties",  showFaculties)}
        onToggleGrandSurfaces={()=>handleTogglePOI("grandSurfaces", showGrandSurfaces)}
        poiLoading={livePOIs.loading}
        poiFetched={livePOIs.fetched}
        liveSchoolCount={livePOIs.schools.length}
        liveMosqueCount={livePOIs.mosques.length}
        liveFacultyCount={livePOIs.faculties.length}
        liveGrandSurfaceCount={(livePOIs.grandSurfaces||[]).length}
      />

      {/* Barre compteur + tags */}
      <div className="cp-bar">
        <span className="cp-bar__count">
          <strong>{visibleResults.length}</strong> annonce{visibleResults.length!==1?"s":""} trouvée{visibleResults.length!==1?"s":""}
        </span>
        {(activeTags.length > 0 || drawnZones.length > 0) && (
          <div className="cp-bar__tags">
            {activeTags.map(t=>(
              <Tag key={t.key} label={t.label} color={t.color} onRemove={()=>removeTag(t.key)} />
            ))}
            {drawnZones.map((_, i) => (
              <span key={i} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                background:"#dbeafe", color:"#1e40af",
                borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600,
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                Zone {i+1}
                <button onClick={() => setDrawnZones(z => z.filter((_,j)=>j!==i))} style={{
                  background:"none", border:"none", cursor:"pointer", padding:0,
                  color:"#1e40af", display:"flex", alignItems:"center", marginLeft:2,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </span>
            ))}
            <button className="cp-bar__clear-all" onClick={()=>{ applyFilters(INIT_F); setDrawnZones([]); setEraseMode(false); setEraseSelectedIdx(null); }}>
              Tout effacer
            </button>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
          <CompareBar />
          <button className="fp__save-search cp-save-search-bar" onClick={() => {
            const token = localStorage.getItem("token");
            if (!token) { window.location.href = "/login?redirect=/carte"; return; }
            if (countActiveFilters(filters) < 3) {
              setShowMinFiltersModal(true);
              return;
            }
            setSaveModalName("Ma recherche");
            setSaveModalSuccess(false);
            setShowSaveModal(true);
          }}><Save size={13} strokeWidth={2}/> Enregistrer la recherche</button>
        </div>
        <button className="cp-toggle-btn" onClick={()=>setListMode(v=>!v)}>
          {listMode
            ? <><MapIcon size={14}/> Vue carte</>
            : <><LayoutList size={14}/> Vue liste</>}
        </button>
      </div>
      </div>{/* end sticky wrapper */}

      {/* Layout carte + liste / mode liste seule
          Les deux blocs sont TOUJOURS mont�s – on alterne uniquement display:none
          pour éviter de démonter PropertyMap (ce qui réinitialise le zoom/position). */}

      {/* -- Vue liste seule -- */}
      <div className="cp-listonly" style={{display: listMode ? undefined : "none"}}>
        {listLoading ? (
          <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 24px",gap:16}}>
            <div style={{
              width:44,height:44,borderRadius:"50%",
              border:"3px solid #e2e8f0",borderTopColor:"#6366f1",
              animation:"cp-spin 0.8s linear infinite",
            }}/>
            <p style={{fontWeight:600,color:"#374151",fontSize:15}}>Chargement des annonces…</p>
            <style>{`@keyframes cp-spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="cp-empty" style={{gridColumn:"1/-1"}}>
            <MapPin size={36} style={{color:"#d1d5db",margin:"0 auto 14px"}}/>
            <p style={{fontWeight:600,color:"#374151",marginBottom:6}}>Aucun résultat</p>
            <p style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>Essayez d'élargir vos filtres</p>
            <button className="fp__reset" onClick={()=>applyFilters(INIT_F)}>
              <X size={12}/> Effacer les filtres
            </button>
          </div>
        ) : (
          <>
            {/* pagination seulement */}
            {listTotalPages > 1 && (
              <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"4px 2px 8px"}}>
                <p style={{fontSize:13,color:"#6b7280",margin:0}}>Page {listPage} / {listTotalPages}</p>
              </div>
            )}

            {listPageResults.map((p) => (
              <div key={p.id}>
                <PropCard p={p} active={false} govMarketStats={govMarketStats}
                  onHover={()=>{}}
                  onClick={(id)=>{
                    const realId = String(id).startsWith("api_") ? String(id).replace("api_","") : id;
                    setModalId(realId);
                  }}
                />
              </div>
            ))}

            {/* Pagination */}
            {listTotalPages > 1 && (
              <div style={{
                gridColumn:"1/-1",
                display:"flex",alignItems:"center",justifyContent:"center",
                gap:8,padding:"24px 0 8px",flexWrap:"wrap",
              }}>
                <button
                  onClick={()=>{ setListPage(p=>Math.max(1,p-1)); window.scrollTo({top:0,behavior:"smooth"}); }}
                  disabled={listPage===1}
                  style={{
                    display:"flex",alignItems:"center",gap:6,
                    padding:"10px 18px",borderRadius:8,
                    border:"1.5px solid #e2e8f0",background:listPage===1?"#f8fafc":"#fff",
                    color:listPage===1?"#9ca3af":"#374151",
                    fontWeight:700,fontSize:14,cursor:listPage===1?"not-allowed":"pointer",
                    transition:"all .15s",
                  }}
                >
                  <ChevronLeft size={15}/> Précédent
                </button>

                {Array.from({length:listTotalPages},(_,i)=>i+1)
                  .filter(n => n===1 || n===listTotalPages || Math.abs(n-listPage)<=2)
                  .reduce((acc,n,idx,arr)=>{
                    if(idx>0 && n-arr[idx-1]>1) acc.push("�");
                    acc.push(n);
                    return acc;
                  },[])
                  .map((item,idx)=> item==="�"
                    ? <span key={`ell${idx}`} style={{padding:"0 4px",color:"#9ca3af",fontWeight:700}}>�</span>
                    : <button key={item}
                        onClick={()=>{ setListPage(item); window.scrollTo({top:0,behavior:"smooth"}); }}
                        style={{
                          width:40,height:40,borderRadius:8,
                          border:`1.5px solid ${listPage===item?"#6366f1":"#e2e8f0"}`,
                          background:listPage===item?"#6366f1":"#fff",
                          color:listPage===item?"#fff":"#374151",
                          fontWeight:700,fontSize:14,cursor:"pointer",
                          transition:"all .15s",
                        }}
                      >{item}</button>
                  )
                }

                <button
                  onClick={()=>{ setListPage(p=>Math.min(listTotalPages,p+1)); window.scrollTo({top:0,behavior:"smooth"}); }}
                  disabled={listPage===listTotalPages}
                  style={{
                    display:"flex",alignItems:"center",gap:6,
                    padding:"10px 18px",borderRadius:8,
                    border:"1.5px solid #e2e8f0",background:listPage===listTotalPages?"#f8fafc":"#fff",
                    color:listPage===listTotalPages?"#9ca3af":"#374151",
                    fontWeight:700,fontSize:14,cursor:listPage===listTotalPages?"not-allowed":"pointer",
                    transition:"all .15s",
                  }}
                >
                  Suivant <ChevronRight size={15}/>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* -- Vue carte + liste droite -- */}
      <div className="cp-layout" style={{display: listMode ? "none" : undefined}}>
          {/* Carte � occupe tout l'espace restant */}
          <div className="cp-map" style={{ position:"relative" }}
            onMouseLeave={() => setHoveredPin(null)}
          >
            <PropertyMap
              properties={allProperties}
              activeId={active}
              selectedGov={filters.govNom}
              selectedDel={filters.delNom}
              onGovSelect={(gadmGovNom) => {
                const norm = _n;
                const list = govListRef.current;
                const ng = norm(gadmGovNom);
                /* 1) Exact normalisé */
                let found = list.find(g => norm(g.label) === ng);
                /* 2) Contenance */
                if (!found) found = list.find(g => { const nl=norm(g.label); return nl.includes(ng)||ng.includes(nl); });
                /* 3) Score caractères (Levenshtein simplifié) */
                if (!found && list.length) {
                  const lev = (a,b) => { const m=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i||j)); for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) m[i][j]=a[i-1]===b[j-1]?m[i-1][j-1]:1+Math.min(m[i-1][j],m[i][j-1],m[i-1][j-1]); return m[a.length][b.length]; };
                  found = list.reduce((best,g)=>{ const d=lev(norm(g.label),ng); return (!best||d<best._d)?{...g,_d:d}:best; },null);
                }
                if (found) applyFilters({ ...filters, govNom: found.label, govId: String(found.value), delId:"", delNom:"", locId:"", locNom:"", query:"" });
              }}
              onDelSelect={(gadmDelNom, gadmGovNom) => {
                const norm = _n;
                const lev = (a,b) => { const m=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i||j)); for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) m[i][j]=a[i-1]===b[j-1]?m[i-1][j-1]:1+Math.min(m[i-1][j],m[i][j-1],m[i-1][j-1]); return m[a.length][b.length]; };

                /* 1. Résoudre le gouvernorat depuis la liste API */
                const govList = govListRef.current;
                const ng = norm(gadmGovNom);
                let foundGov = govList.find(g => norm(g.label) === ng);
                if (!foundGov) foundGov = govList.find(g => { const nl=norm(g.label); return nl.includes(ng)||ng.includes(nl); });
                if (!foundGov && govList.length) foundGov = govList.reduce((b,g)=>{ const d=lev(norm(g.label),ng); return (!b||d<b._d)?{...g,_d:d}:b; },null);
                const resolvedGovNom = foundGov?.label || gadmGovNom;
                const resolvedGovId  = foundGov ? String(foundGov.value) : filters.govId || "";

                /* 2. Résoudre la délégation depuis la liste API */
                const delList = delListRef.current;
                const nd = norm(gadmDelNom);
                let foundDel = null;

                /* 2a. Table d'alias statique (GADM → API) */
                const aliasTarget = GADM_DEL_ALIASES[nd];
                if (aliasTarget) {
                  foundDel = delList.find(d => norm(d.nom) === aliasTarget);
                  if (!foundDel) foundDel = delList.find(d => norm(d.nom).includes(aliasTarget) || aliasTarget.includes(norm(d.nom)));
                }

                /* 2b. Correspondance exacte normalisée */
                if (!foundDel) foundDel = delList.find(d => norm(d.nom) === nd);

                /* 2c. normDel : supprime préfixes El/La/Le/Es/Bou */
                if (!foundDel) foundDel = delList.find(d => normDel(d.nom) === normDel(gadmDelNom));

                /* 2d. Contains */
                if (!foundDel) foundDel = delList.find(d => { const nl=normDel(d.nom); const nq=normDel(gadmDelNom); return nl.includes(nq)||nq.includes(nl); });

                /* 2e. Levenshtein sur normDel */
                if (!foundDel && delList.length) foundDel = delList.reduce((b,d)=>{ const dist=lev(normDel(d.nom),normDel(gadmDelNom)); return (!b||dist<b._d)?{...d,_d:dist}:b; },null);

                const resolvedDelNom = foundDel?.nom || gadmDelNom;
                const resolvedDelId  = foundDel ? String(foundDel.id) : "";

                applyFilters({ ...filters, govNom: resolvedGovNom, govId: resolvedGovId, delNom: resolvedDelNom, delId: resolvedDelId, locId:"", locNom:"", query:"" });
              }}
              onPinClick={handlePin}
              onBoundsChange={setMapBounds}
              showSchools={showSchools}
              showMosques={showMosques}
              showFaculties={showFaculties}
              showGrandSurfaces={showGrandSurfaces}
              liveSchools={livePOIs.schools}
              liveMosques={livePOIs.mosques}
              liveFaculties={livePOIs.faculties}
              liveGrandSurfaces={livePOIs.grandSurfaces||[]}
              onPinHover={setHoveredPin}
              sharedHoverTimer={sharedHoverTimer}
              centerTarget={centerTarget}
              initialView={savedMapView}
              drawMode={drawMode}
              drawnZones={drawnZones}
              onZoneDrawn={(zone) => { setDrawnZones(z => [...z, zone]); setDrawMode(false); }}
              eraseMode={eraseMode}
              eraseSelectedIdx={eraseSelectedIdx}
              onEraseSelect={(i) => setEraseSelectedIdx(i === eraseSelectedIdx ? null : i)}
            />
            {/* -- Boutons dessin / effacement zone -- */}
            <div style={{
              position:"absolute", bottom:12, left:12, zIndex:9200,
              display:"flex", flexDirection:"column", gap:6,
            }}>
              <button
                onClick={() => { setDrawMode(v => !v); setEraseMode(false); setEraseSelectedIdx(null); }}
                title={drawMode ? "Annuler le dessin" : "Dessiner une zone"}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"14px 24px", borderRadius:12, border:"2px solid",
                  borderColor: drawMode ? "#1e40af" : "#d1d5db",
                  background: drawMode ? "#dbeafe" : "#fff",
                  color: drawMode ? "#1e40af" : "#374151",
                  fontWeight:700, fontSize:16, cursor:"pointer",
                  boxShadow:"0 4px 16px rgba(0,0,0,.18)", whiteSpace:"nowrap",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                {drawMode ? "Annuler" : "Dessiner une zone"}
              </button>
              {drawnZones.length > 0 && !drawMode && (
                eraseMode ? (
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{
                      background:"rgba(220,38,38,.9)", color:"#fff", borderRadius:8,
                      padding:"6px 12px", fontSize:12, fontWeight:600, textAlign:"center",
                    }}>
                      {eraseSelectedIdx !== null ? `Zone ${eraseSelectedIdx+1} sélectionnée` : "Cliquez sur une zone"}
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      <button
                        disabled={eraseSelectedIdx === null}
                        onClick={() => {
                          setDrawnZones(z => z.filter((_,j)=>j!==eraseSelectedIdx));
                          setEraseSelectedIdx(null); setEraseMode(false);
                        }}
                        style={{
                          flex:1, padding:"7px 10px", borderRadius:8, border:"1.5px solid #dc2626",
                          background: eraseSelectedIdx!==null ? "#dc2626" : "#fca5a5",
                          color:"#fff", fontWeight:700, fontSize:12,
                          cursor: eraseSelectedIdx!==null ? "pointer" : "not-allowed",
                        }}
                      >Confirmer</button>
                      <button
                        onClick={() => { setEraseMode(false); setEraseSelectedIdx(null); }}
                        style={{
                          padding:"7px 10px", borderRadius:8, border:"1.5px solid #d1d5db",
                          background:"#fff", color:"#374151", fontWeight:600, fontSize:12, cursor:"pointer",
                        }}
                      >Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEraseMode(true); setEraseSelectedIdx(null); setDrawMode(false); }}
                    style={{
                      display:"flex", alignItems:"center", gap:6,
                      padding:"7px 12px", borderRadius:8, border:"1.5px solid #fca5a5",
                      background:"#fef2f2", color:"#dc2626",
                      fontWeight:600, fontSize:12, cursor:"pointer",
                      boxShadow:"0 2px 8px rgba(0,0,0,.15)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                    </svg>
                    Effacer une zone
                  </button>
                )
              )}
            </div>
            {/* -- Bandeau instruction -- */}
            {(drawMode || eraseMode) && (
              <div style={{
                position:"absolute", top:10, left:"50%", transform:"translateX(-50%)",
                zIndex:9200, background: eraseMode ? "rgba(220,38,38,.92)" : "rgba(30,64,175,.92)", color:"#fff",
                borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:600,
                pointerEvents:"none", whiteSpace:"nowrap",
                boxShadow:"0 2px 10px rgba(109,40,217,.35)",
              }}>
                {eraseMode
                  ? (eraseSelectedIdx !== null ? `Zone ${eraseSelectedIdx+1} sélectionnée — confirmez` : "Cliquez sur une zone pour la sélectionner")
                  : "Cliquez pour ajouter des points — Double-clic pour terminer"}
              </div>
            )}
            {/* -- Tooltip hover avec carousel -- */}
            {hoveredPin && <HoverCard
              pin={hoveredPin}
              sharedHoverTimer={sharedHoverTimer}
              onOpen={(id) => setModalId(id)}
              onLeave={() => setHoveredPin(null)}
            />}
      
          </div>

          {/* Liste à droite – filtrée par zone visible sur la carte */}
          <div className="cp-list">
            {/* Header fixe avec compteur */}
            <div className="cp-list__header">
              <span style={{
                background:"#6366f1", color:"#fff", fontWeight:800, fontSize:12,
                padding:"2px 8px", borderRadius:20, lineHeight:1.5,
              }}>{visibleResults.length}</span>
              annonce{visibleResults.length !== 1 ? "s" : ""} trouvée{visibleResults.length !== 1 ? "s" : ""}
              {results.length > visibleResults.length && (
                <span style={{color:"#94a3b8", fontWeight:400, fontSize:12}}>
                  &nbsp;(sur {results.length} au total)
                </span>
              )}
            </div>
            {/* Grid scrollable */}
            <div className="cp-list__body">
              {visibleResults.length === 0
                ? <div className="cp-empty" style={{gridColumn:"1/-1"}}>
                    <MapPin size={36} style={{color:"#d1d5db",margin:"0 auto 14px"}}/>
                    <p style={{fontWeight:600,color:"#374151",marginBottom:6}}>
                      {mapBounds && results.length > 0 ? "Aucun bien dans cette zone" : "Aucun résultat"}
                    </p>
                    <p style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>
                      {mapBounds && results.length > 0 ? "Dézoomez pour voir plus d'annonces" : "Essayez d'élargir vos filtres"}
                    </p>
                    {(!mapBounds || results.length === 0) && (
                      <button className="fp__reset" onClick={()=>applyFilters(INIT_F)}>
                        <X size={12}/> Effacer les filtres
                      </button>
                    )}
                  </div>
                : visibleResults.map((p) => (
                    <div id={`card-${p.id}`} key={p.id}>
                      <PropCard p={p} active={active===p.id} govMarketStats={govMarketStats}
                        compact
                        onHover={setActive}
                        onClick={(id)=>{
                          const realId = String(id).startsWith("api_") ? String(id).replace("api_","") : id;
                          setModalId(realId);
                        }}
                      />
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

      {/* -- Modal annonce -- */}
      {modalId && <AnnonceModal annonceId={modalId} onClose={() => setModalId(null)} />}

      {/* -- Popup : minimum 3 critères -- */}
      {showMinFiltersModal && ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99999,padding:16}}
          onClick={()=>setShowMinFiltersModal(false)}>
          <div style={{background:"#fff",borderRadius:20,width:440,maxWidth:"100%",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header violet avec logo */}
            <div style={{background:"linear-gradient(135deg,#6366f1 0%,#818cf8 100%)",padding:"18px 24px",display:"flex",alignItems:"center",gap:12}}>
              <Logo variant="white" height={28} to={null}/>
              <span style={{color:"#fff",fontSize:14,fontWeight:700,opacity:.9,marginLeft:4}}>Enregistrer la recherche</span>
            </div>
            {/* Contenu */}
            <div style={{padding:"32px 28px 28px",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"#fffbeb",border:"2px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 18px"}}>🔍</div>
              <p style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:"0 0 10px"}}>Pas assez de critères</p>
              <p style={{fontSize:14,color:"#64748b",lineHeight:1.7,margin:"0 0 8px"}}>
                Sélectionnez <strong>au moins 3 critères</strong> avant d'enregistrer votre recherche.
              </p>
              <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.6,margin:"0 0 24px"}}>
                Exemples : gouvernorat, type de bien, catégorie, prix, superficie, nombre de chambres, état du bien, équipements…
              </p>
              {/* Compteur de critères actifs */}
              <div style={{background:"#f8fafc",borderRadius:12,padding:"12px 20px",marginBottom:24,display:"inline-flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,color:"#64748b",fontWeight:600}}>Critères sélectionnés :</span>
                <span style={{fontSize:16,fontWeight:800,color:countActiveFilters(filters)>=3?"#16a34a":"#ef4444"}}>
                  {countActiveFilters(filters)} / 3
                </span>
              </div>
              <br/>
              <button onClick={()=>setShowMinFiltersModal(false)}
                style={{padding:"11px 36px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                Ajouter des filtres
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* -- Modal enregistrer recherche -- */}
      {showSaveModal && ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99999,padding:"16px"}}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div style={{background:"#fff",borderRadius:20,width:480,maxWidth:"100%",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.28)"}}>
            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#6366f1 0%,#818cf8 100%)",padding:"18px 24px",display:"flex",alignItems:"center",gap:12}}>
              <Logo variant="white" height={28} to={null}/>
              <span style={{color:"#fff",fontSize:14,fontWeight:700,opacity:.9,marginLeft:4}}>Enregistrer la recherche</span>
            </div>
            {!saveModalSuccess ? (
              <div style={{padding:"24px 28px 28px"}}>
                <p style={{fontSize:14,color:"#374151",marginBottom:20,lineHeight:1.6}}>
                  Donnez un nom à cette alerte pour la retrouver facilement dans <strong>Mon compte &gt; Mes Alertes</strong>.
                </p>
                <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:8}}>Nom de l'alerte <span style={{color:"#94a3b8",fontWeight:400}}>(facultatif)</span></label>
                <input type="text" value={saveModalName} onChange={e=>setSaveModalName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleSaveSearch()} autoFocus
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,fontSize:14,border:"1.5px solid #e2e8f0",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"#0f172a"}}/>
                <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
                  <button onClick={()=>setShowSaveModal(false)} style={{padding:"10px 20px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:14,fontWeight:600,color:"#374151",cursor:"pointer"}}>Annuler</button>
                  <button onClick={handleSaveSearch} disabled={saveModalLoading} style={{padding:"10px 26px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",opacity:saveModalLoading?.6:1}}>
                    {saveModalLoading ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{padding:"36px 28px 32px",textAlign:"center"}}>
                <div style={{width:60,height:60,borderRadius:"50%",background:"#f0fdf4",border:"2px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>✅</div>
                <p style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:"0 0 8px"}}>Recherche enregistrée !</p>
                <p style={{fontSize:14,color:"#374151",lineHeight:1.6,margin:"0 0 24px"}}>Vous recevrez des alertes email dès qu'une annonce correspond.<br/>Consultez-les dans <strong>Mon compte &gt; Mes Alertes</strong>.</p>
                <button onClick={()=>setShowSaveModal(false)} style={{padding:"11px 32px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>OK</button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}


      {/* -- CSS -- */}
      <style>{`
        @keyframes carouselInL  { from { transform:translateX(100%); opacity:.6 } to { transform:translateX(0); opacity:1 } }
        @keyframes carouselOutL { from { transform:translateX(0);    opacity:1   } to { transform:translateX(-100%); opacity:.6 } }
        @keyframes carouselInR  { from { transform:translateX(-100%); opacity:.6 } to { transform:translateX(0); opacity:1 } }
        @keyframes carouselOutR { from { transform:translateX(0);     opacity:1   } to { transform:translateX(100%); opacity:.6 } }
        @keyframes fadeIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }

        .cp-root {
          display: flex; flex-direction: column;
          min-height: 100vh; overflow-x: clip;
          background: #fff;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .cp-root--carte { height: 100vh; overflow: hidden; }

        /* --------------------------------------
           PANNEAU FILTRES à light theme
        -------------------------------------- */
        .fp {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 2px 12px rgba(0,0,0,.06);
          padding: 12px 20px 10px;
          position: relative; z-index: 50;
        }

        .fp__row1 {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }

        .fp__search {
          position: relative; display: flex; align-items: center;
          background: #f9fafb; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 0 12px; flex: 1; min-width: 180px;
          transition: border-color .15s, background .15s;
        }
        .fp__search:focus-within {
          background: #fff; border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }
        .fp__search-ico { color: #9ca3af; flex-shrink:0; }
        .fp__search-inp {
          border: none; outline: none; background: transparent;
          color: #111; font-size: 14.5px; font-family: 'Poppins', sans-serif;
          padding: 9px 8px; width: 100%; min-width: 0;
        }
        .fp__search-inp::placeholder { color: #9ca3af; font-family: 'Poppins', sans-serif; }
        .fp__clear {
          display: flex; color: #9ca3af; cursor: pointer;
          padding: 3px; border-radius: 50%; border: none; background: none; flex-shrink:0;
        }
        .fp__clear:hover { color: #374151; background: #f3f4f6; }

        .fp__pill-group { display: flex; gap: 4px; flex-shrink: 0; }
        .fp__pill {
          padding: 7px 14px; border-radius: 20px; font-size: 13.5px;
          font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280;
          transition: all .15s;
        }
        .fp__pill:hover { background: #f3f4f6; border-color: #d1d5db; color: #374151; }

        /* -- Tous -- */
        .fp__pill--tous.fp__pill--on { background: #475569; border-color: #475569; color: #fff; box-shadow: 0 2px 8px rgba(71,85,105,.35); }
        .fp__pill--tous:not(.fp__pill--on):hover { background: #f1f5f9; color: #475569; border-color: #94a3b8; }

        /* -- Achat (vente) � vert (comme le badge carte) -- */
        .fp__pill--vente.fp__pill--on { background: #166534; border-color: #166534; color: #fff; box-shadow: 0 2px 8px rgba(22,101,52,.40); }
        .fp__pill--vente:not(.fp__pill--on):hover { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

        /* -- Location � bleu (comme le badge carte) -- */
        .fp__pill--location.fp__pill--on { background: #1e40af; border-color: #1e40af; color: #fff; box-shadow: 0 2px 8px rgba(30,64,175,.40); }
        .fp__pill--location:not(.fp__pill--on):hover { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }

        /* -- Vacances � ambre -- */
        .fp__pill--vacances.fp__pill--on { background: #f59e0b; border-color: #f59e0b; color: #fff; box-shadow: 0 2px 8px rgba(245,158,11,.40); }
        .fp__pill--vacances:not(.fp__pill--on):hover { background: #fffbeb; color: #d97706; border-color: #fcd34d; }

        .fp__adv-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px; font-size: 13.5px;
          font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280;
          transition: all .15s; white-space: nowrap;
        }
        .fp__adv-btn:hover { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
        .fp__adv-btn--on { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }

        .fp__submit {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 26px; border-radius: 10px; font-size: 14.5px;
          font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          color: #fff; border: none;
          box-shadow: 0 4px 14px rgba(234,88,12,.35);
          transition: transform .12s, box-shadow .12s; white-space: nowrap;
        }
        .fp__submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(234,88,12,.45); }
        .fp__submit:active { transform: scale(.97); }

        .fp__loc-row {
          display: flex; align-items: center; gap: 10px;
          margin-top: 10px; flex-wrap: wrap;
        }

        .loc-cascade {
          display: flex; align-items: center; gap: 4px; flex: 1; flex-wrap: wrap;
        }
        .loc-cascade__field {
          display: flex; align-items: center; gap: 6px;
          background: #f9fafb; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 7px 10px;
          transition: all .15s; position: relative;
          flex: 1; min-width: 120px;
        }
        .loc-cascade__field:focus-within {
          background: #fff; border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }
        .loc-cascade__field--disabled { opacity: .4; pointer-events: none; }
        .loc-cascade__arrow { color: #d1d5db; flex-shrink: 0; }

        .lc__ico { font-size: 14px; flex-shrink: 0; }
        .lc__ico--gov { color: #f59e0b; }
        .lc__ico--del { color: #8b5cf6; }
        .lc__ico--loc { color: #06b6d4; }
        .lc__spin { animation: spin .7s linear infinite; color: #9ca3af; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes hoverFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .lc__sel {
          border: none; outline: none; background: transparent;
          color: #374151; font-size: 14px; font-family: 'Poppins', sans-serif; cursor: pointer;
          width: 100%; min-width: 0;
        }
        .lc__sel option { color: #111; background: #fff; font-family: 'Poppins', sans-serif; }

        .fp__poi-group { display: flex; gap: 6px; flex-shrink: 0; }
        .fp__poi-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 8px 13px; border-radius: 20px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid transparent; transition: all .15s;
        }
        /* POI buttons � UNE seule couleur slate, ic�nes différentes, clair/fonc� */
        .fp__poi-btn--school,
        .fp__poi-btn--mosque,
        .fp__poi-btn--faculty,
        .fp__poi-btn--surface {
          background: #f8fafc; color: #475569; border-color: #cbd5e1;
        }
        .fp__poi-btn--school.fp__poi-btn--on,
        .fp__poi-btn--mosque.fp__poi-btn--on,
        .fp__poi-btn--faculty.fp__poi-btn--on,
        .fp__poi-btn--surface.fp__poi-btn--on {
          background: #334155; color: #fff; border-color: #334155;
          box-shadow: 0 2px 8px rgba(51,65,85,.4);
        }
        .fp__poi-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 5px;
          border-radius: 9px; font-size: 10px; font-weight: 700;
          background: rgba(255,255,255,.3); color: inherit;
          margin-left: 2px;
        }

        .fp__advanced {
          display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap;
          margin-top: 10px; padding: 14px 16px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .fp__adv-group { display: flex; flex-direction: column; gap: 4px; }
        .fp__adv-label {
          font-size: 10.5px; font-weight: 700;
          color: #9ca3af; text-transform: uppercase; letter-spacing: .5px;
        }
        .fp__adv-label--check {
          display: flex; align-items: center; gap: 7px;
          font-size: 12.5px; font-weight: 600; text-transform: none;
          color: #374151; cursor: pointer; letter-spacing: 0; margin-top: 14px;
        }
        .fp__adv-sel, .fp__adv-inp {
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          padding: 7px 10px; font-size: 13px; font-family: inherit;
          background: #fff; color: #374151; outline: none;
          transition: border-color .15s; min-width: 110px;
        }
        .fp__adv-sel:focus, .fp__adv-inp:focus {
          border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.08);
        }
        .fp__adv-inp::placeholder { color: #9ca3af; }
        .fp__adv-group--check { justify-content: flex-end; }
        .fp__save-search {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 8px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          border: 1.5px solid #bbf7d0; background: #f0fdf4; color: #16a34a;
          transition: all .15s; align-self: flex-end;
        }
        .fp__save-search:hover { background: #dcfce7; border-color: #86efac; }
        .fp__reset {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 8px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280;
          transition: all .15s; align-self: flex-end;
        }
        .fp__reset:hover { border-color: #d1d5db; color: #374151; background: #f9fafb; }

        /* --------------------------------------
           BARRE COMPTEUR / TAGS
        -------------------------------------- */
        .cp-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 16px; background: #f8fafc;
          border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; min-height: 38px;
        }
        .cp-bar__count { font-size: 13px; color: #64748b; white-space: nowrap; font-family: 'Poppins', sans-serif; }
        .cp-bar__count strong { color: #1e293b; }
        .cp-bar__tags  { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex: 1; }
        .cp-bar__clear-all {
          font-size: 12px; color: #94a3b8; cursor: pointer; border: none;
          background: none; font-family: 'Poppins', sans-serif; text-decoration: underline;
          padding: 2px 4px;
        }
        .cp-bar__clear-all:hover { color: #475569; }
        .cp-save-search-bar {
          margin-left: auto; flex-shrink: 0; align-self: center;
        }
        .cp-toggle-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 9px; font-size: 13.5px;
          font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid #6366f1; background: #eef2ff; color: #4338ca;
          transition: all .15s; white-space: nowrap; flex-shrink: 0; margin-left: 8px;
        }
        .cp-toggle-btn:hover { background: #6366f1; color: #fff; }

        /* --------------------------------------
           LAYOUT CARTE + LISTE
        -------------------------------------- */
        .cp-layout { flex: 1; display: flex; overflow: hidden; }
        .cp-map    { flex: 1; min-width: 0; }

        /* Liste desktop – visible uniquement sur grand écran */
        .cp-list {
          width: 580px; min-width: 380px;
          display: flex; flex-direction: column;
          background: #f8fafc;
          border-left: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .cp-list__header {
          flex-shrink: 0;
          padding: 10px 12px 8px;
          border-bottom: 1px solid #e2e8f0;
          background: #fff;
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: #374151;
        }
        .cp-list__body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          align-content: start;
        }
        .cp-list__body > div { min-width: 0; }
        .cp-list__body .pc   { width: 100%; min-width: 0; }

        /* --------------------------------------
           MODE LISTE SEULE
        -------------------------------------- */
        .cp-listonly {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
          padding: 20px 24px;
          background: #f8fafc;
        }

        .cp-empty {
          text-align: center; padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center;
        }

        /* Cartes compactes dans le panneau liste (2 colonnes) */
        .cp-list__body .pc__body     { padding: 8px 10px 9px; }
        .cp-list__body .pc__price    { font-size: 14px; }
        .cp-list__body .pc__devise   { font-size: 11px; }
        .cp-list__body .pc__title    { font-size: 12px; margin-bottom: 3px; }
        .cp-list__body .pc__loc      { font-size: 11px; margin-bottom: 5px; }
        .cp-list__body .pc__specs    { gap: 5px; padding-top: 5px; }
        .cp-list__body .pc__specs span { font-size: 11px; }
        .cp-list__body .pc__fav      { width: 22px; height: 22px; }

        /* --------------------------------------
           CARTE DE BIEN
        -------------------------------------- */
        .pc {
          background: #fff; border: 1.5px solid #e2e8f0;
          border-radius: 12px; overflow: hidden;
          cursor: pointer; transition: box-shadow .18s, border-color .18s, transform .12s;
        }
        .pc:hover, .pc--active {
          box-shadow: 0 6px 20px rgba(0,0,0,.12);
          border-color: #94a3b8; transform: translateY(-1px);
        }
        .pc__boost-badge {
          position: absolute; top: 8px; left: 8px;
          display: inline-flex; align-items: center; gap: 3px;
          padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;
          background: linear-gradient(135deg,#f59e0b,#f97316); color: #fff;
          box-shadow: 0 2px 6px rgba(249,115,22,.4);
        }
        .pc__cat-badge {
          position: absolute; top: 8px; right: 8px; z-index: 10;
          padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700;
        }
        .pc__cat-badge--vente    { background: #166534; color: #fff; }
        .pc__cat-badge--location { background: #1e40af; color: #fff; }
        .pc__cat-badge--vacances { background: #854d0e; color: #fff; }
        .pc__body  { padding: 12px 14px 13px; }
        .pc__price { font-size: 22px; font-weight: 900; color: #0a0a0a; margin-bottom: 2px; }
        .pc__devise{ font-size: 13px; font-weight: 500; color: #475569; margin-left: 2px; }
        .pc__title {
          font-size: 15px; color: #0a0a0a; font-weight: 700; margin-bottom: 5px; line-height: 1.35;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
        }
        .pc__fav {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #cbd5e1; background: #f1f5f9; border: none; cursor: pointer;
          transition: all .15s;
        }
        .pc__fav:hover { color: #ef4444; background: #fee2e2; }
        .pc__fav--on   { color: #ef4444 !important; background: #fee2e2 !important; }
        .pc__loc {
          display: flex; align-items: center; gap: 3px;
          font-size: 12px; color: #374151; font-weight: 500; margin-bottom: 9px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        }
        .pc__specs {
          display: flex; gap: 10px; flex-wrap: wrap;
          padding-top: 8px; border-top: 1px solid #f1f5f9;
        }
        .pc__specs span {
          display: flex; align-items: center; gap: 3px;
          font-size: 13px; color: #1e293b; font-weight: 500;
        }

        /* -- Barre évaluation prix -- */
        /* Cluster popup � supprimer le padding interne de Leaflet */
        /* Cluster popup � rectangle rigide, grande taille */
        .cluster-popup .leaflet-popup-content-wrapper {
          padding: 0; border-radius: 3px; overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.14);
          border: 1.5px solid #e2e8f0;
        }
        .cluster-popup .leaflet-popup-content { margin: 0; width: auto !important; line-height: 1; }
        .cluster-popup .leaflet-popup-tip-container { display: none; } /* pas de fl�che pointue */
        .cluster-popup .leaflet-popup-close-button {
          top: 8px !important; right: 8px !important;
          background: rgba(0,0,0,.45) !important; color: #fff !important;
          width: 22px !important; height: 22px !important;
          border-radius: 50% !important; font-size: 16px !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          line-height: 1 !important;
        }

        .peb {
          display: flex; flex-direction: column; gap: 4px;
          margin: 5px 0 7px; padding-top: 7px;
          border-top: 1px solid #f1f5f9;
        }
        .peb__label {
          font-size: 9px; font-weight: 800;
          text-transform: uppercase; letter-spacing: .07em;
          line-height: 1;
        }
        .peb__bar { display: flex; gap: 2px; }
        .peb__seg { flex: 1; height: 5px; border-radius: 2px; transition: background .2s; }

        /* --------------------------------------
           PINS CARTE
        -------------------------------------- */
        /* Non-boosted pin � small */
        /* -- Punaises � base -- */
        .pin-dot {
          border-radius: 50%; border: 2.5px solid #fff;
          cursor: pointer; transition: transform .13s, box-shadow .13s;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .pin-dot:hover, .pin-dot--active { transform: scale(1.4); z-index: 999 !important; }

        /* -- Achat / vente � vert (comme badge carte) -- */
        .pin-dot--vente {
          width: 20px; height: 20px;
          background: #166534;
          box-shadow: 0 2px 8px rgba(22,101,52,.50);
        }
        .pin-dot--vente:hover, .pin-dot--vente.pin-dot--active {
          background: #14532d;
          box-shadow: 0 3px 14px rgba(22,101,52,.70);
        }
        /* -- Location � bleu indigo (comme badge carte) -- */
        .pin-dot--location {
          width: 20px; height: 20px;
          background: #1e40af;
          box-shadow: 0 2px 8px rgba(30,64,175,.50);
        }
        .pin-dot--location:hover, .pin-dot--location.pin-dot--active {
          background: #1e3a8a;
          box-shadow: 0 3px 14px rgba(30,64,175,.70);
        }
        /* -- Vacances � ambre -- */
        .pin-dot--vacances {
          width: 20px; height: 20px;
          background: #d97706;
          box-shadow: 0 2px 8px rgba(217,119,6,.50);
        }
        .pin-dot--vacances:hover, .pin-dot--vacances.pin-dot--active {
          background: #b45309;
          box-shadow: 0 3px 14px rgba(217,119,6,.70);
        }
        /* -- Fallback bordeaux -- */
        .pin-dot--std {
          width: 20px; height: 20px;
          background: #9b1c2e;
          box-shadow: 0 2px 8px rgba(155,28,46,.45);
        }
        .pin-dot--std:hover, .pin-dot--std.pin-dot--active {
          background: #7c1022;
          box-shadow: 0 3px 14px rgba(155,28,46,.65);
        }

        /* Ic�nes internes */
        .pin-star {
          font-size: 13px; color: #fff; line-height: 1;
          pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,.4);
        }
        .pin-icon {
          font-size: 14px; line-height: 1;
          pointer-events: none; filter: drop-shadow(0 1px 1px rgba(0,0,0,.3));
        }

        /* POI markers */
        /* -- POI markers � carr� arrondi pour se distinguer visuellement
              des punaises rondes des annonces -- */
        .poi-icon {
          width: 30px; height: 30px;
          border-radius: 8px;          /* ? CARR� ARRONDI ? cercle des pins */
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,.28);
          cursor: pointer; transition: transform .12s;
        }
        .poi-icon:hover { transform: scale(1.15); }

        /* Couleurs distinctes de tous les niveaux de pins :
           pins = orange / dor� / indigo / gris
           POI  = cyan / vert �meraude / violet fonc�               */
        .poi-icon--school  { background: #0ea5e9; }   /* cyan  � ? indigo pins */
        .poi-icon--mosque  { background: #059669; }   /* �meraude � aucun pin n'est vert */
        .poi-icon--faculty { background: #7c3aed; }   /* violet fonc� � aucun pin n'est violet */

        /* --------------------------------------
           RESPONSIVE
        -------------------------------------- */

        @media (max-width: 860px) {
          .cp-layout   { flex-direction: column; }
          .cp-map      { flex: 1; }
          .cp-list     { display: none !important; }
          .cp-listonly { grid-template-columns: 1fr 1fr; padding: 12px; }
          .cp-bar      { padding: 4px 10px; min-height: 32px; }

          /* -- Panneau filtres : tout empil� verticalement -- */
          .fp          { padding: 10px 12px 12px; }

          /* Ligne 1 : barre de recherche + boutons Filtres/Rechercher */
          .fp__row1    { flex-direction: column; gap: 8px; align-items: stretch; }
          .fp__search  { min-width: 0; }
          .fp__pill-group { display: none; }          /* cach�es sur mobile */
          .fp__row1 > div:last-child { flex-direction: row; justify-content: flex-end; gap: 8px; margin-left: 0; }

          /* Ligne 2 : localisation à chaque select sur sa propre ligne */
          .fp__loc-row        { flex-direction: column; align-items: stretch; gap: 6px; margin-top: 8px; }
          .loc-cascade        { flex-direction: column; gap: 6px; width: 100%; }
          .loc-cascade__arrow { display: none; }
          .loc-cascade__field { width: 100%; flex: none; min-width: 0; }

          /* Boutons POI (Écoles / Mosquées / Facultés) � même ligne */
          .fp__poi-group      { display: flex; flex-direction: row; gap: 6px; flex-wrap: nowrap; width: 100%; }
          .fp__poi-btn        { flex: 1; justify-content: center; }
        }

        @media (max-width: 640px) {
          .cp-listonly { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
