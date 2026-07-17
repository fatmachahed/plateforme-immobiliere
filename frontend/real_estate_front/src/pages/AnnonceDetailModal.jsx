import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import API_URL, { fmtDevise, fmtPriceApprox } from '../config';
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import {
  useIsInCompare, toggleCompare as toggleCompareStore,
} from "../utils/compareStore";

/* Trace un clic "voir le numéro"/WhatsApp/e-mail — alimente le tableau de
   bord statistiques de l'agence. Best-effort : sendBeacon survit à la
   navigation immédiate (tel:/wa.me/mailto:), ne bloque jamais le clic. */
function trackContactClick(annonceId, canal) {
  try {
    const payload = JSON.stringify({ canal });
    const url = `${API_URL}/annonces/${annonceId}/contact-click`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* silencieux */ }
}

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.549 4.112 1.51 5.845L.057 23.617a.5.5 0 00.611.65l5.975-1.566A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.893 9.893 0 01-5.048-1.38l-.361-.215-3.745.982.999-3.648-.235-.374A9.861 9.861 0 012.106 12C2.106 6.527 6.527 2.106 12 2.106S21.894 6.527 21.894 12 17.473 21.894 12 21.894z"/>
    </svg>
  );
}

/* Format prix/m² : arrondi supérieur à 1 décimale, jamais 0 */
function fmtM2(prix, area) {
  if (!area || area <= 0 || !prix || prix <= 0) return null;
  const v = Math.ceil((Number(prix) / Number(area)) * 10) / 10;
  if (v <= 0) return null;
  return v.toLocaleString("fr-TN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ArrowLeft, MapPin,
  Bed, Bath, Maximize, Phone, Mail, Heart, Share2,
  CheckCircle, Calendar, Tag, Home, Loader,
  Languages, Navigation, Eye, GitCompare, BadgeCheck, Building2,
  Waves, Mountain, TreePine, Fence, Sun, Flower2, Droplets, ParkingCircle,
  ArrowUpDown, Car, Package, Sofa, Users, ShieldCheck,
  UtensilsCrossed, Wind, Thermometer, Flame, DoorClosed, LockKeyhole,
  Fingerprint, Wifi, Monitor, RefreshCw, KeyRound, PhoneCall,
  Layers, Star, Ruler, ChevronsUp, Compass,
  MessageCircle, Info, Send, X, Flag, XCircle, Edit
} from "lucide-react";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import { useToast } from "../components/Toast";
import { useLanguage } from "../contexts/LanguageContext";

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
    + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const DEMO = [
  { id:1, titre:"Villa 4 chambres — La Marsa", prix:850000, devise:"TND", location:"La Marsa, Tunis", beds:4, baths:3, area:320, type:"Villa", categorie:"Vente", etat:"Bon état", annee:2018, description:"Magnifique villa moderne de 320 m² avec jardins aménagés, piscine et double garage.", features:["Jardin","Piscine","Garage","Terrasse","Cuisine équipée","Climatisation","Sécurité"], lat:36.879, lng:10.325, images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"], contact:{nom:"Ahmed Ben Salem",tel:"+216 55 123 456",email:"ahmed@immo.tn"} },
  { id:2, titre:"Appartement S+3 — Lac 2", prix:320000, devise:"TND", location:"Berges du Lac, Tunis", beds:3, baths:2, area:145, type:"Appartement", categorie:"Vente", etat:"Neuf", annee:2023, description:"Appartement neuf S+3 dans résidence sécurisée avec ascenseur et parking.", features:["Ascenseur","Parking","Gardien","Double vitrage"], lat:36.838, lng:10.235, images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80"], contact:{nom:"Sonia Trabelsi",tel:"+216 22 987 654",email:"sonia@immo.tn"} },
];

const TYPE_FR  = { appartement:"Appartement", villa:"Villa", maison:"Maison", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", garage_parking:"Garage / Parking", depot_stockage:"Dépôt de stockage", batiment_industriel:"Bâtiment industriel", immobiliers_divers:"Immobiliers divers" };
const CAT_FR   = { vente:"Achat", location:"Location", vacances:"Vacances" };
const ETAT_FR  = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"À rénover", cours_construction:"En construction" };

function normalizeApi(a) {
  const loc = [a.localite, a.delegation, a.gouvernorat].filter(Boolean).join(", ");
  return {
    id: a.id, titre: a.titre, prix: a.prix, prix_ancien: a.prix_ancien || null, devise: a.devise,
    location: loc || "Tunisie",
    address: a.address || null, gouvernorat: a.gouvernorat || null,
    delegation: a.delegation || null, localite: a.localite || null,
    beds: a.nb_chambres, baths: a.nb_salles_bain, area: a.superficie,
    type: TYPE_FR[a.type_bien] || a.type_bien,
    categorie: CAT_FR[a.categorie] || a.categorie,
    etat: ETAT_FR[a.etat_bien] || a.etat_bien || null,
    annee: a.annee_construction,
    description: a.description || "Aucune description disponible.",
    features: a.features || [],
    lat: a.latitude || 36.8065, lng: a.longitude || 10.1815,
    anonyme: a.anonyme || false,
    contact: { nom: a.user?.username || "Propriétaire", tel: a.user?.phone_number || "", tels: [...new Set([a.user?.phone_number, ...(a.user?.phone_numbers || [])].filter(Boolean))], email: a.user?.email || "" },
    publisher_role: a.user?.role || null,
    publisher_picture: a.user?.profile_picture || null,
    fromApi: true, utilisateur_id: a.utilisateur_id || a.user?.id,
    views_count: a.views_count || 0,
    type_bien_raw: a.type_bien, gouvernorat_raw: a.gouvernorat, categorie_raw: a.categorie,
    date_creation: a.date_creation || null,
    date_mise_a_jour: a.date_mise_a_jour || null,
    delegation_raw: a.delegation,
    type_appartement: a.type_appartement || null, type_villa: a.type_villa || null,
    type_terrain: a.type_terrain || null, type_option_villa: a.type_option_villa || null,
    etage: a.etage != null ? a.etage : null,
    titre_foncier: a.titre_foncier || null, terrain_viabilise: a.terrain_viabilise || false,
    exclusivite: a.exclusivite || false,
    hauteur_immeuble: a.hauteur_immeuble || null, nb_appartements: a.nb_appartements || null,
    orientation_immeuble: a.orientation_immeuble || null,
    emplacement_garage: a.emplacement_garage || null, reference: a.reference || null,
    nb_pieces: a.nb_pieces != null ? a.nb_pieces : null,
    annee_construction: a.annee_construction || null,
    duree_type: a.duree_type || null, duree_valeur: a.duree_valeur || null,
    colocation: a.colocation || false,
    places_totales: a.places_totales || null, places_occupees: a.places_occupees || null,
    profil_coloc: a.profil_coloc || null,
    genre_coloc: Array.isArray(a.genre_coloc) ? a.genre_coloc : (a.genre_coloc ? a.genre_coloc.split(",").filter(Boolean) : []),
    chambres_colocation: a.chambres_colocation || [],
    images: (a.images || []).length > 0
      ? (a.images || []).map(img => img.startsWith("http") ? img : `${API_URL}${img}`)
      : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"],
  };
}

/* ─── Carousel pour les cartes nearby (identique à CartePage / AgentProfile) ─── */
const _mncArrow = (s) => ({
  position:"absolute", top:"50%", transform:"translateY(-50%)", [s]:8,
  width:27, height:27, borderRadius:"50%", background:"rgba(255,255,255,.45)",
  backdropFilter:"blur(4px)", border:"none", cursor:"pointer",
  display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 1px 4px rgba(0,0,0,.15)", color:"#fff", zIndex:4,
});
function MncCarousel({ images, h = 190 }) {
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
        <img src={images[prev2]} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", animation:`mncOut${dir>0?"L":"R"} .42s cubic-bezier(.4,0,.2,1) forwards`, zIndex:1 }}/>
      )}
      <img key={idx} src={images[idx]} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", animation: prev2!==null?`mncIn${dir>0?"L":"R"} .42s cubic-bezier(.4,0,.2,1) forwards`:"none", zIndex:2 }} loading="lazy"/>
      <div style={{ position:"absolute", inset:0, zIndex:3, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
        <span style={{ fontSize:18, fontWeight:900, letterSpacing:"-0.5px", fontFamily:"Arial,sans-serif", color:"rgba(255,255,255,0.22)", textShadow:"0 1px 3px rgba(0,0,0,0.18)", userSelect:"none", transform:"rotate(-15deg)" }}>
          LOCAL<span style={{color:"rgba(99,102,241,0.30)"}}>IZI</span>.TN
        </span>
      </div>
      {images.length > 1 && <>
        <button onClick={e=>go(e,-1)} style={_mncArrow("left")}><ChevronLeft size={14}/></button>
        <button onClick={e=>go(e,+1)} style={_mncArrow("right")}><ChevronRight size={14}/></button>
        <div style={{ position:"absolute", bottom:7, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4, zIndex:3 }}>
          {images.map((_,i) => (
            <span key={i} onClick={e=>goTo(e,i)} style={{ width:6, height:6, borderRadius:"50%", cursor:"pointer", background: i===idx?"#fff":"rgba(255,255,255,.45)", transition:"background .2s" }}/>
          ))}
        </div>
      </>}
    </div>
  );
}

/* ─── Carte nearby — même design exact que PropCard de CartePage / AgentProfile ─── */
function ModalNearbyCard({ a }) {
  const realId = String(a.id);
  const img = a.image_principale
    ? (a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`)
    : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=75";
  const cat = a.categorie || "vente";
  const joursEcoules = a.date_creation ? Math.floor((Date.now() - new Date(a.date_creation)) / 86_400_000) : null;
  const ageLabel = joursEcoules === 0 ? "Aujourd'hui" : joursEcoules === 1 ? "il y a 1 j." : joursEcoules != null ? `il y a ${joursEcoules} j.` : null;

  const [isFav, setIsFav] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_favs")||"[]").some(id => String(id) === realId); } catch { return false; }
  });
  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    const wasOn = isFav; setIsFav(!wasOn);
    try {
      const res = await fetch(`${API_URL}/users/me/favoris/${realId}`, {
        method: wasOn ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
        localStorage.setItem("localizi_favs", JSON.stringify(!wasOn ? [...new Set([...favs,realId])] : favs.filter(id=>String(id)!==realId)));
      } else { setIsFav(wasOn); }
    } catch { setIsFav(wasOn); }
  };

  const openCard = () => { window.__openAnnonceModal && window.__openAnnonceModal(realId); };

  return (
    <div className="pc" onClick={openCard}>
      <div style={{ position:"relative" }}>
        <MncCarousel images={[img]} h={190}/>
        <span className={`pc__cat-badge pc__cat-badge--${cat}`}>
          {cat === "vente" ? "Vente" : cat === "location" ? "Location" : "Vacances"}
        </span>
        {ageLabel && (
          <span style={{ position:"absolute", bottom:8, right:10, zIndex:10, background:"rgba(0,0,0,.52)", color:"#fff", fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:999 }}>
            {ageLabel}
          </span>
        )}
      </div>
      <div className="pc__body">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ minWidth:0, flex:1 }}>
            <p className="pc__price">
              {Number(a.prix).toLocaleString("fr-TN")}
              <span className="pc__devise"> {fmtDevise(a.devise)}{cat==="location"?" /mois":""}</span>
            </p>
            <p className="pc__title">{a.titre}</p>
          </div>
          <button className={`pc__fav${isFav?" pc__fav--on":""}`} onClick={toggleFav} title={isFav?"Retirer des favoris":"Ajouter aux favoris"}>
            <Heart size={14} fill={isFav?"#ef4444":"none"}/>
          </button>
        </div>
        <p className="pc__loc"><MapPin size={10}/> {[a.delegation, a.gouvernorat].filter(Boolean).join(" · ")}</p>
        <div className="pc__specs">
          {a.nb_pieces   != null && <span><Building2 size={11}/> {a.nb_pieces} p.</span>}
          {a.nb_chambres != null && <span><Bed size={11}/> {a.nb_chambres} ch.</span>}
          {a.superficie  != null && <span><Maximize size={11}/> {a.superficie} m²</span>}
        </div>
      </div>
    </div>
  );
}

export default function AnnonceDetailModal({ annonceId, onClose, adminActions }) {
  const [activeId,  setActiveId]  = useState(String(annonceId));
  const id       = activeId;
  const navigate = useNavigate();
  const toast    = useToast();

  /* Le parent (ex: CartePage) réutilise la même instance de la modale et se
     contente de changer la prop annonceId (ex: clic sur "Annonces similaires").
     Sans ce useEffect, activeId reste bloqué sur l'annonce initiale car
     useState() n'est initialisé qu'au tout premier montage — les clics sur
     les annonces similaires/proches semblaient alors ne rien faire. */
  React.useEffect(() => { setActiveId(String(annonceId)); }, [annonceId]);

  const [prop,           setProp]           = useState(null);
  const [rawData,        setRawData]        = useState(null);
  const [samePointList,  setSamePointList]  = useState([]);
  const samePointKeyRef = React.useRef([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [contactForm,    setContactForm]    = useState({ nom:"", email:"", telephone:"", message:"" });
  const [contactSent,    setContactSent]    = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError,   setContactError]   = useState("");
  const [loading,        setLoading]        = useState(true);
  const [imgIdx,         setImgIdx]         = useState(0);
  const [isFavori,       setIsFavori]       = useState(false);
  const [favLoading,     setFavLoading]     = useState(false);
  const [nearby,         setNearby]         = useState([]);
  const [translated,     setTranslated]     = useState("");
  const [translating,    setTranslating]    = useState(false);
  const [descExpanded,   setDescExpanded]   = useState(false);
  const [featsExpanded,  setFeatsExpanded]  = useState(false);
  const [wasViewed,      setWasViewed]      = useState(false);
  const [satisfaction,   setSatisfaction]   = useState(null);
  const [ratingAvg,      setRatingAvg]      = useState(null);
  const [lightboxIdx,    setLightboxIdx]    = useState(null);
  const [ratingCount,    setRatingCount]    = useState(0);
  const [alertOpen,      setAlertOpen]      = useState(false);
  const [alertEmail,     setAlertEmail]     = useState("");
  const [alertStatus,    setAlertStatus]    = useState(null); // null | "loading" | "ok" | "err"

  const token    = localStorage.getItem("token");
  const userData = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const { lang, t } = useLanguage();

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Escape key */
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Fetch annonce */
  useEffect(() => {
    setLoading(true); setImgIdx(0); setProp(null); setRawData(null);
    fetch(`${API_URL}/annonces/${id}/detail`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setRawData(data); setProp(normalizeApi(data));
          try {
            const viewed = JSON.parse(localStorage.getItem("localizi_viewed")||"[]");
            setWasViewed(viewed.includes(String(id)));
            if (!viewed.includes(String(id))) {
              localStorage.setItem("localizi_viewed", JSON.stringify([...viewed.slice(-199), String(id)]));
            }
          } catch {}
          const sat = localStorage.getItem(`localizi_sat_${id}`);
          if (sat) setSatisfaction(Number(sat));
          if (data.rating_avg) setRatingAvg(data.rating_avg);
          if (data.rating_count) setRatingCount(data.rating_count || 0);
          /* Fetch toutes les annonces au même point.
             Si l'annonce chargée est déjà dans la liste existante, on ne re-fetch pas —
             ça évite les décalages GPS minimes entre biens du même bâtiment. */
          if (data.latitude && data.longitude) {
            const inCurrentList = samePointKeyRef.current?.some(a => String(a.id) === String(id));
            if (!inCurrentList) {
              fetch(`${API_URL}/annonces/at-point?lat=${data.latitude}&lng=${data.longitude}`)
                .then(r => r.ok ? r.json() : [])
                .then(list => {
                  samePointKeyRef.current = list || [];
                  setSamePointList(list || []);
                })
                .catch(() => {});
            }
          }
        } else {
          const demo = DEMO.find(p => p.id === Number(id));
          setProp(demo || null);
        }
      })
      .catch(() => { const demo = DEMO.find(p => p.id === Number(id)); setProp(demo || null); })
      .finally(() => setLoading(false));
  }, [id]);

  /* Lightbox keyboard */
  useEffect(() => {
    if (lightboxIdx === null || !prop) return;
    const handler = e => {
      if (e.key === "ArrowRight") setLightboxIdx(i => (i+1) % prop.images.length);
      if (e.key === "ArrowLeft")  setLightboxIdx(i => (i-1+prop.images.length) % prop.images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, prop]);

  /* Nearby — même type_bien + même gouvernorat */
  useEffect(() => {
    if (!prop) return; setNearby([]);
    fetch(`${API_URL}/annonces/public?limit=200`)
      .then(r => r.json())
      .then(data => {
        const annonces = Array.isArray(data) ? data : [];
        const filtered = annonces
          .filter(a =>
            String(a.id) !== String(id) &&
            a.type_bien   === prop.type_bien_raw &&
            a.gouvernorat === prop.gouvernorat_raw &&
            a.categorie   === prop.categorie_raw
          )
          .slice(0, 6);
        setNearby(filtered);
      }).catch(() => {});
  }, [prop, id]);

  /* Comparateur : état centralisé (utils/compareStore.js), partagé avec toutes les interfaces */
  const isInCompare  = useIsInCompare(id);

  /* Favoris check */
  useEffect(() => {
    if (!token || !prop?.fromApi) return;
    fetch(`${API_URL}/users/me/favoris`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setIsFavori(data.some(f => f.id === Number(id))); })
      .catch(() => {});
  }, [token, id, prop?.fromApi]);

  const handleToggleFavori = async () => {
    if (!token) { toast("Connectez-vous pour sauvegarder cette annonce.", "error"); return; }
    if (!prop?.fromApi) { toast("Les annonces de démonstration ne peuvent pas être sauvegardées.", "error"); return; }
    setFavLoading(true);
    try {
      if (isFavori) {
        await fetch(`${API_URL}/users/me/favoris/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
        setIsFavori(false); toast("Retiré des favoris.");
      } else {
        await fetch(`${API_URL}/users/me/favoris/${id}`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
        setIsFavori(true); toast("Annonce sauvegardée dans vos favoris !");
      }
    } catch { toast("Erreur lors de la sauvegarde.", "error"); }
    finally { setFavLoading(false); }
  };

  const handleTranslate = async () => {
    if (translating) return;
    if (translated) { setTranslated(""); return; }
    setTranslating(true);
    try {
      const text = prop.description || "";
      const pair = lang === "fr" ? "fr|en" : "en|fr";
      const MAX  = 490;
      /* Découper en phrases pour rester sous la limite de l'API */
      const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
      const chunks = [];
      let current = "";
      for (const s of sentences) {
        if ((current + s).length > MAX) {
          if (current) chunks.push(current.trim());
          current = s;
        } else {
          current += s;
        }
      }
      if (current.trim()) chunks.push(current.trim());
      const parts = await Promise.all(chunks.map(async chunk => {
        const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${pair}`);
        const data = await res.json();
        return data?.responseData?.translatedText || chunk;
      }));
      setTranslated(parts.join(" "));
    } catch { toast(lang === "fr" ? "Traduction impossible pour l'instant." : "Translation unavailable right now.", "error"); }
    finally { setTranslating(false); }
  };

  /* ── RENDER ── */
  const images  = prop ? (prop.images?.length > 0 ? prop.images : ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=900&q=80"]) : [];
  const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx(i => (i + 1) % images.length);
  const isOwner = !!(userData && prop?.utilisateur_id && userData.id === prop.utilisateur_id);

  const modalContent = loading ? (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16,color:"#94a3b8",fontSize:15}}>
      <Loader size={32} style={{animation:"spin 1s linear infinite"}}/>
      <p>Chargement…</p>
    </div>
  ) : !prop ? (
    <div style={{textAlign:"center",padding:"80px 24px",color:"#6b7280",fontSize:15,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
      <Home size={48} strokeWidth={1}/>
      <p>Annonce introuvable.</p>
    </div>
  ) : (
      <>
        {/* Le comparateur (aperçu + tableau complet) est désormais une popup
            globale unique, montée dans App.jsx — se déclenche automatiquement
            dès 2 biens ajoutés, quelle que soit la page. */}

        {/* Top bar */}
        <div className="adm-topbar">
          <button className="det-back" onClick={onClose} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#6b7280",fontFamily:"inherit",background:"none",border:"none",cursor:"pointer"}}>
            <ArrowLeft size={15}/> Retour
          </button>
          <div className="ad-topbar__actions">
            {adminActions && (
              <>
                {adminActions.status !== "approuvee" && (
                  <button onClick={adminActions.onApprove}
                    style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,border:"none",background:"#16a34a",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    <CheckCircle size={14}/> Approuver
                  </button>
                )}
                {adminActions.status !== "refusee" && (
                  <button onClick={adminActions.onReject}
                    style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,border:"1.5px solid #fca5a5",background:"#fef2f2",color:"#dc2626",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    <XCircle size={14}/> Refuser
                  </button>
                )}
              </>
            )}
            {isOwner && (
              <Link to={`/modifier_annonce/${prop.id}`} className="det-action" style={{textDecoration:"none"}}>
                <Edit size={15}/><span className="det-action-txt"> Modifier</span>
              </Link>
            )}
            <button className={`det-action${isFavori?" det-action--liked":""}`} onClick={handleToggleFavori} disabled={favLoading}>
              <Heart size={15} fill={isFavori?"currentColor":"none"}/><span className="det-action-txt"> {isFavori?"Sauvegardé":"Sauvegarder"}</span>
            </button>
            <button className={`det-action${isInCompare?" det-action--liked":""}`} onClick={()=>{
              const result = toggleCompareStore({
                id: prop.id, titre: prop.titre, prix: prop.prix, devise: prop.devise,
                image: prop.images?.[0]||null, gouvernorat: prop.gouvernorat, delegation: prop.delegation,
              });
              if (result.maxReached) { toast("Maximum 4 annonces. Retirez-en une pour ajouter celle-ci.","error"); return; }
              toast(result.added ? "Ajouté au comparateur !" : "Retiré du comparateur.");
            }}>
              <GitCompare size={15}/><span className="det-action-txt"> {isInCompare?"Dans le comparateur":"Comparer"}</span>
            </button>
            <button className="det-action" onClick={()=>{
              const url=`${window.location.origin}/annonce/${prop.id}`;
              try { if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>toast("Lien copié !")).catch(()=>{const el=document.createElement("textarea");el.value=url;el.style.cssText="position:fixed;opacity:0";document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);toast("Lien copié !");});}else{const el=document.createElement("textarea");el.value=url;el.style.cssText="position:fixed;opacity:0";document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);toast("Lien copié !");} }catch{toast("Lien : "+url);}
            }}>
              <Share2 size={15}/><span className="det-action-txt"> Partager</span>
            </button>
          </div>
        </div>

        {/* ── Galerie pleine largeur 60/40 ── */}
        {/* ── Galerie fixe 60/40 — 3 cadres invariants ── */}
        <div className="adm-gallery-grid" style={{width:"100%",height:460,minHeight:460,maxHeight:460,flexShrink:0,overflow:"hidden",background:"#0f172a",display:"grid",gridTemplateColumns:"60% 40%",gap:3}}>

          {/* ── Cadre principal (gauche) ── */}
          <div className="adm-gallery-main" style={{position:"relative",width:"100%",height:"100%",overflow:"hidden"}}>
            <img src={images[imgIdx]} alt={prop.titre}
              style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            {/* Filigrane */}
            <div style={{position:"absolute",inset:0,zIndex:3,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
              <span style={{fontSize:26,fontWeight:900,letterSpacing:"-0.5px",fontFamily:"Arial,sans-serif",color:"rgba(255,255,255,0.20)",textShadow:"0 1px 4px rgba(0,0,0,0.15)",userSelect:"none",transform:"rotate(-15deg)"}}>
                LOCAL<span style={{color:"rgba(99,102,241,0.28)"}}>IZI</span>.TN
              </span>
            </div>
            {wasViewed && (
              <span style={{position:"absolute",top:14,left:14,zIndex:5,background:"rgba(15,23,42,.75)",backdropFilter:"blur(6px)",color:"#fff",fontSize:11,fontWeight:800,padding:"4px 11px",borderRadius:20,display:"flex",alignItems:"center",gap:5,letterSpacing:".08em",textTransform:"uppercase",pointerEvents:"none"}}>
                <Eye size={12}/> Consulté
              </span>
            )}
            {/* Flèche gauche — discrète */}
            <button style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",zIndex:6,width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.55)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.85)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.55)"}
              onClick={e=>{e.stopPropagation();prevImg();}}>
              <ChevronLeft size={17} color="#fff" strokeWidth={2.5}/>
            </button>
            {/* Flèche droite — discrète */}
            <button style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",zIndex:6,width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.55)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.85)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.55)"}
              onClick={e=>{e.stopPropagation();nextImg();}}>
              <ChevronRight size={17} color="#fff" strokeWidth={2.5}/>
            </button>
            {/* Compteur — bas droite */}
            <span style={{position:"absolute",bottom:12,right:12,zIndex:6,background:"rgba(15,23,42,.58)",backdropFilter:"blur(4px)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,pointerEvents:"none"}}>
              {imgIdx+1} / {images.length}
            </span>
            {/* Zone lightbox */}
            <div style={{position:"absolute",inset:0,zIndex:4,cursor:"zoom-in"}} onClick={()=>setLightboxIdx(imgIdx)}/>
            {/* Bouton "Voir X images" — mobile only */}
            <button className="adm-see-all-btn" onClick={e=>{e.stopPropagation();setLightboxIdx(imgIdx);}}>
              <Eye size={13}/> Voir {images.length} image{images.length>1?"s":""}
            </button>
          </div>

          {/* ── Colonne droite : 2 cadres empilés ── */}
          <div className="adm-gallery-right" style={{display:"grid",gridTemplateRows:"50% 50%",gap:3,height:"100%"}}>
            <div style={{position:"relative",width:"100%",height:"100%",overflow:"hidden",cursor:"zoom-in"}}
              onClick={()=>setLightboxIdx((imgIdx+1)%images.length)}>
              <img src={images[(imgIdx+1)%images.length]} alt=""
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
              <div style={{position:"absolute",inset:0,zIndex:2,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                <span style={{fontSize:16,fontWeight:900,letterSpacing:"-0.5px",fontFamily:"Arial,sans-serif",color:"rgba(255,255,255,0.20)",textShadow:"0 1px 3px rgba(0,0,0,0.15)",userSelect:"none",transform:"rotate(-15deg)"}}>
                  LOCAL<span style={{color:"rgba(99,102,241,0.28)"}}>IZI</span>.TN
                </span>
              </div>
            </div>
            <div style={{position:"relative",width:"100%",height:"100%",overflow:"hidden",cursor:"zoom-in"}}
              onClick={()=>setLightboxIdx((imgIdx+2)%images.length)}>
              <img src={images[(imgIdx+2)%images.length]} alt=""
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
              <div style={{position:"absolute",inset:0,zIndex:2,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                <span style={{fontSize:16,fontWeight:900,letterSpacing:"-0.5px",fontFamily:"Arial,sans-serif",color:"rgba(255,255,255,0.20)",textShadow:"0 1px 3px rgba(0,0,0,0.15)",userSelect:"none",transform:"rotate(-15deg)"}}>
                  LOCAL<span style={{color:"rgba(99,102,241,0.28)"}}>IZI</span>.TN
                </span>
              </div>
              {images.length > 1 && (
                <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.42)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3}}>
                  <span style={{background:"rgba(255,255,255,.18)",backdropFilter:"blur(6px)",border:"1.5px solid rgba(255,255,255,.5)",color:"#fff",fontSize:13,fontWeight:700,padding:"8px 18px",borderRadius:99,letterSpacing:".02em",display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap"}}>
                    <Eye size={14}/> Voir {images.length} photo{images.length>1?"s":""}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="det-body" style={{display:"grid",gap:"24px",maxWidth:1200,margin:"24px auto",padding:"0 24px 48px",boxSizing:"border-box",width:"100%"}}>
          {/* Left column */}
          <div className="det-left" style={{minWidth:0,width:"100%",display:"block"}}>

            {/* Prix */}
            <div style={{display:"flex",alignItems:"baseline",gap:20,flexWrap:"wrap",padding:"18px 0 16px",borderBottom:"1.5px solid #f1f5f9",marginBottom:20}}>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {prop.prix_ancien && (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:20,fontWeight:600,color:"#94a3b8",textDecoration:"line-through"}}>
                      {Number(prop.prix_ancien).toLocaleString("fr-TN")} {fmtDevise(prop.devise)}
                    </span>
                    <span style={{fontSize:12,fontWeight:700,color:"#ef4444",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"2px 7px"}}>
                      ▼ {Math.round((1 - prop.prix / prop.prix_ancien) * 100)}%
                    </span>
                  </div>
                )}
                <div style={{fontSize:38,fontWeight:900,color:"#0f172a",letterSpacing:"-.02em",lineHeight:1}}>
                  {Number(prop.prix).toLocaleString("fr-TN")}
                  <span style={{fontSize:20,fontWeight:600,color:"#64748b",marginLeft:8}}>{fmtDevise(prop.devise)}</span>
                  {prop.categorie==="location"&&<span style={{fontSize:16,fontWeight:500,color:"#94a3b8",marginLeft:4}}>/mois</span>}
                  {prop.categorie==="vacances"&&prop.duree_type&&<span style={{fontSize:16,fontWeight:500,color:"#94a3b8",marginLeft:4}}>/{prop.duree_type==="nuit"?"nuitée":prop.duree_type==="semaine"?"sem.":prop.duree_type==="mois"?"mois":"an"}</span>}
                </div>
              </div>
              {prop.area>0&&(
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  <span style={{fontSize:18,fontWeight:700,color:"#475569"}}>{fmtM2(prop.prix,prop.area)} <span style={{fontSize:14,color:"#94a3b8"}}>{fmtDevise(prop.devise)}/m²</span></span>
                  <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Prix au m²</span>
                </div>
              )}
              {prop.prix&&(()=>{const approx=fmtPriceApprox(prop.prix,prop.devise);return approx?<span style={{fontSize:13,color:"#94a3b8",fontWeight:500,alignSelf:"flex-end"}}>{approx}</span>:null;})()}
            </div>

            {/* Dates + alerte prix */}
            {(() => {
              const fmtAge = (iso) => {
                if (!iso) return null;
                const j = Math.floor((Date.now() - new Date(iso)) / 86_400_000);
                if (j === 0) return "aujourd'hui";
                if (j === 1) return "il y a 1 jour";
                if (j < 30)  return `il y a ${j} jours`;
                if (j < 365) { const m = Math.floor(j/30); return `il y a ${m} mois`; }
                const a = Math.floor(j/365); return `il y a ${a} an${a>1?"s":""}`;
              };
              const fmtDate = (iso) => {
                if (!iso) return null;
                return new Date(iso).toLocaleDateString("fr-TN", { day:"2-digit", month:"long", year:"numeric" });
              };
              const age     = fmtAge(prop.date_creation);
              const modifie = fmtDate(prop.date_mise_a_jour);
              const submitAlert = async () => {
                if (!alertEmail || !alertEmail.includes("@")) return;
                setAlertStatus("loading");
                try {
                  const res = await fetch(`${API_URL}/annonces/${prop.id}/prix-alert`, {
                    method:"POST", headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ email: alertEmail }),
                  });
                  const data = await res.json();
                  setAlertStatus(res.ok ? "ok" : "err");
                } catch { setAlertStatus("err"); }
              };
              return (
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,padding:"10px 0 14px",borderBottom:"1.5px solid #f1f5f9",marginBottom:20}}>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {age && (
                      <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#64748b",fontWeight:500}}>
                        <Calendar size={13} style={{color:"#94a3b8"}}/>
                        Publié {age}
                      </span>
                    )}
                    {modifie && (
                      <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#64748b",fontWeight:500}}>
                        <RefreshCw size={12} style={{color:"#94a3b8"}}/>
                        Modifié le {modifie}
                      </span>
                    )}
                  </div>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>{setAlertOpen(o=>!o);setAlertStatus(null);setAlertEmail(userData?.email||"");}}
                      style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:999,border:"1.5px solid #f97316",background:alertOpen?"#fff7ed":"#fff",color:"#ea580c",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>
                      🔔 M'avertir d'une baisse de prix
                    </button>
                    {alertOpen && (
                      <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:"#fff",border:"1.5px solid #fed7aa",borderRadius:14,padding:"18px 20px",boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:50,minWidth:290}}>
                        {alertStatus === "ok" ? (
                          <div style={{textAlign:"center",padding:"8px 0"}}>
                            <div style={{fontSize:28,marginBottom:8}}>✅</div>
                            <p style={{fontWeight:700,color:"#15803d",margin:"0 0 4px"}}>Alerte activée !</p>
                            <p style={{fontSize:12,color:"#64748b",margin:0}}>Vous recevrez un email en cas de baisse.</p>
                          </div>
                        ) : (
                          <>
                            <p style={{fontWeight:700,color:"#0f172a",margin:"0 0 6px",fontSize:14}}>Alerte baisse de prix</p>
                            <p style={{fontSize:12,color:"#64748b",margin:"0 0 12px"}}>Entrez votre email pour être notifié si ce bien baisse de prix.</p>
                            <input
                              type="email" placeholder="votre@email.com"
                              value={alertEmail} onChange={e=>setAlertEmail(e.target.value)}
                              style={{width:"100%",boxSizing:"border-box",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:13,marginBottom:10,outline:"none",fontFamily:"inherit"}}
                              onKeyDown={e=>e.key==="Enter"&&submitAlert()}
                            />
                            <button onClick={submitAlert} disabled={alertStatus==="loading"}
                              style={{width:"100%",padding:"10px 0",borderRadius:8,border:"none",background:"#f97316",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                              {alertStatus==="loading" ? "Envoi…" : "Activer l'alerte"}
                            </button>
                            {alertStatus==="err" && <p style={{fontSize:12,color:"#dc2626",margin:"6px 0 0",textAlign:"center"}}>Une erreur s'est produite, réessayez.</p>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Colocation */}
            {prop.colocation&&prop.places_totales!=null&&(
              <div style={{background:"linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%)",border:"1.5px solid #c7d2fe",borderRadius:16,padding:"20px 24px",marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center"}}><Users size={18} color="#fff" strokeWidth={2}/></div>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,color:"#3730a3"}}>Colocation disponible</div>
                      {prop.profil_coloc&&prop.profil_coloc!=="tous"&&<div style={{fontSize:12,color:"#6366f1",fontWeight:600,marginTop:1}}>Profil : {prop.profil_coloc==="etudiant"?"Étudiant(e)s":prop.profil_coloc==="professionnel"?"Professionnels":prop.profil_coloc==="famille"?"Familles":"Peu importe"}</div>}
                    </div>
                  </div>
                  {(()=>{const g=prop.genre_coloc||[];const both=g.includes("homme")&&g.includes("femme");const menOnly=g.includes("homme")&&!g.includes("femme");const femOnly=g.includes("femme")&&!g.includes("homme");if(!g.length)return null;return(<span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20,background:both?"#f0fdf4":menOnly?"#eff6ff":"#fdf2f8",color:both?"#15803d":menOnly?"#1d4ed8":"#9d174d",border:`1.5px solid ${both?"#bbf7d0":menOnly?"#bfdbfe":"#fbcfe8"}`}}>{both?<>♂ ♀ Mixte</>:menOnly?<>♂ Hommes</>:<>♀ Femmes</>}</span>);})()}
                </div>
                {prop.chambres_colocation&&prop.chambres_colocation.length>0?(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead><tr style={{background:"#e0e7ff"}}>{["Chambre","Capacité","Occupées","Disponibles",`Prix/place (${prop.devise||"TND"})`].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color:"#3730a3",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                      <tbody>{prop.chambres_colocation.map((ch,i)=>{const dispo=Math.max(0,(ch.capacite||1)-(ch.places_occupees||0));return(<tr key={i} style={{background:i%2===0?"#f5f3ff":"#fff",borderBottom:"1px solid #e0e7ff"}}><td style={{padding:"7px 10px",textAlign:"center",fontWeight:600,color:"#4338ca"}}>Ch. {ch.numero_chambre||i+1}</td><td style={{padding:"7px 10px",textAlign:"center"}}>{ch.capacite||1}</td><td style={{padding:"7px 10px",textAlign:"center",color:(ch.places_occupees||0)>0?"#dc2626":"#64748b"}}>{ch.places_occupees||0}</td><td style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color:dispo>0?"#16a34a":"#dc2626"}}>{dispo}</td><td style={{padding:"7px 10px",textAlign:"center",fontWeight:600,color:"#6366f1"}}>{ch.prix_par_place>0?`${Number(ch.prix_par_place).toLocaleString("fr-TN")} ${prop.devise||"TND"}`:"—"}</td></tr>);})}</tbody>
                      <tfoot>{(()=>{const totCap=prop.chambres_colocation.reduce((s,c)=>s+(c.capacite||1),0);const totOcc=prop.chambres_colocation.reduce((s,c)=>s+(c.places_occupees||0),0);const totDispo=Math.max(0,totCap-totOcc);const totPrix=prop.chambres_colocation.reduce((s,c)=>s+((c.capacite||1)*(c.prix_par_place||0)),0);return(<tr style={{background:"#e0e7ff",fontWeight:800,color:"#3730a3"}}><td style={{padding:"7px 10px",textAlign:"center"}}>Total</td><td style={{padding:"7px 10px",textAlign:"center"}}>{totCap}</td><td style={{padding:"7px 10px",textAlign:"center",color:"#dc2626"}}>{totOcc}</td><td style={{padding:"7px 10px",textAlign:"center",color:totDispo>0?"#16a34a":"#dc2626"}}>{totDispo}</td><td style={{padding:"7px 10px",textAlign:"center",color:"#4338ca"}}>{totPrix>0?`${Number(totPrix).toLocaleString("fr-TN")} ${prop.devise||"TND"}`:"—"}</td></tr>);})()}</tfoot>
                    </table>
                  </div>
                ):(()=>{const tot=prop.places_totales||1;const occ=prop.places_occupees||0;const dispo=Math.max(0,tot-occ);const pct=Math.round((occ/tot)*100);return(<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:13,color:"#4338ca",fontWeight:600}}>{dispo} place{dispo!==1?"s":""} disponible{dispo!==1?"s":""}</span><span style={{fontSize:12,color:"#6366f1"}}>{occ}/{tot} occupée{occ!==1?"s":""}</span></div><div style={{height:8,borderRadius:99,background:"#c7d2fe",overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:"#6366f1",borderRadius:99,transition:"width .4s"}}/></div></>);})()}
              </div>
            )}

            {/* Description */}
            <div className="det-section">
              <div className="det-section__header">
                <h2 className="det-section__title">{t("ad_description")}</h2>
                <button className="ad-translate-btn" onClick={handleTranslate} disabled={translating}>
                  {translating?<Loader size={13} style={{animation:"spin 1s linear infinite"}}/>:<Languages size={13}/>}
                  {translated?t("ad_original"):t("ad_translate")}
                </button>
              </div>
              {(()=>{const DESC_LIMIT=420;const descText=translated||prop.description;const longDesc=descText.length>DESC_LIMIT;return(<><p className="det-desc" style={{fontSize:16,lineHeight:1.85,margin:0}}>{descExpanded||!longDesc?descText:descText.slice(0,DESC_LIMIT)+"…"}</p>{longDesc&&<button onClick={()=>setDescExpanded(p=>!p)} style={{marginTop:10,background:"none",border:"none",cursor:"pointer",color:"#4f46e5",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:4,padding:0}}>{descExpanded?<><ChevronLeft size={15} style={{transform:"rotate(90deg)"}}/> Voir moins</>:<>Voir plus <ChevronRight size={15}/></>}</button>}</>);})()}
              {translated&&<p className="ad-translated-note">🌐 Traduit automatiquement · <button onClick={()=>setTranslated("")} className="ad-translated-reset">Voir l'original</button></p>}
            </div>

            {/* Features */}
            {prop.features?.length>0&&(()=>{
              const FEAT_ICONS={"Vue sur mer":Waves,"Vue sur montagne":Mountain,"Vue sur forêt":TreePine,"Jardin":Fence,"Terrasse":Sun,"Balcon":Flower2,"Piscine":Droplets,"Parking":ParkingCircle,"Ascenseur":ArrowUpDown,"Garage":Car,"Cellier":Package,"Meublé":Sofa,"Concierge":Users,"Gardien":ShieldCheck,"Animaux admis":Heart,"Cuisine équipée":UtensilsCrossed,"Climatisation":Wind,"Chauffage central":Thermometer,"Cheminée":Flame,"Double vitrage":DoorClosed,"Porte blindée":LockKeyhole,"Sécurité":Fingerprint,"Internet":Wifi,"TV":Monitor,"Machine à laver":RefreshCw,"Digicode":KeyRound,"Interphone":PhoneCall,"Relié ONAS":Droplets,"Salon américain":Monitor,"Fibre optique":Wifi};
              const FEAT_LIMIT=9;const longFeats=prop.features.length>FEAT_LIMIT;const shownFeats=featsExpanded||!longFeats?prop.features:prop.features.slice(0,FEAT_LIMIT);
              return(<div className="det-section" style={{marginTop:32}}><h2 className="det-section__title">Caractéristiques du bien</h2><div className="adm-feats-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>{shownFeats.map(f=>{const Ico=FEAT_ICONS[f]||CheckCircle;return(<div key={f} className="adm-feat-item" style={{display:"flex",alignItems:"center",gap:12,padding:"15px 18px",borderRadius:12,background:"#f8fafc",border:"1.5px solid #e5e7eb",fontSize:15,fontWeight:600,color:"#1e293b"}}><Ico size={22} strokeWidth={1.6} style={{color:"#4f46e5",flexShrink:0}}/>{f}</div>);})}</div>{longFeats&&<button onClick={()=>setFeatsExpanded(p=>!p)} style={{marginTop:14,background:"none",border:"none",cursor:"pointer",color:"#4f46e5",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:4,padding:0}}>{featsExpanded?<><ChevronLeft size={15} style={{transform:"rotate(90deg)"}}/> Voir moins</>:<>Voir les {prop.features.length-FEAT_LIMIT} autres caractéristiques <ChevronRight size={15}/></>}</button>}</div>);
            })()}
          </div>

          {/* Right column */}
          <div className="det-right" style={{width:"100%",minWidth:0,display:"block"}}>
            <div className="det-card">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
                <span className={`det-card__cat det-card__cat--${prop.categorie?.toLowerCase()}`}>{prop.categorie}</span>
                {prop.reference&&<span style={{fontSize:11.5,fontWeight:700,color:"#64748b",background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"3px 10px",borderRadius:999,letterSpacing:".04em"}}>Réf : {prop.reference}</span>}
              </div>
              <h1 className="det-card__titre">{prop.titre}</h1>
              <div className="det-addr">
                {prop.address&&<p className="det-addr__street"><MapPin size={13} className="det-addr__ico"/>{prop.address}</p>}
                <div className="det-addr__hier">
                  {prop.localite&&<span className="det-addr__chip det-addr__chip--loc">{prop.localite}</span>}
                  {prop.localite&&prop.delegation&&<span className="det-addr__sep">›</span>}
                  {prop.delegation&&<span className="det-addr__chip det-addr__chip--del">{prop.delegation}</span>}
                  {(prop.delegation||prop.localite)&&prop.gouvernorat&&<span className="det-addr__sep">›</span>}
                  {prop.gouvernorat&&<span className="det-addr__chip det-addr__chip--gov">{prop.gouvernorat}</span>}
                  {!prop.gouvernorat&&!prop.delegation&&!prop.localite&&!prop.address&&<span style={{color:"#9ca3af",fontSize:13}}><MapPin size={12}/> {prop.location}</span>}
                </div>
              </div>
              <div className="det-specs">
                {prop.beds!=null&&<div className="det-spec"><Bed size={16}/><p className="det-spec__val">{prop.beds}</p><p className="det-spec__lbl">Chambres</p></div>}
                {prop.baths!=null&&<div className="det-spec"><Bath size={16}/><p className="det-spec__val">{prop.baths}</p><p className="det-spec__lbl">Sdb</p></div>}
                {prop.area&&<div className="det-spec"><Maximize size={16}/><p className="det-spec__val">{prop.area}</p><p className="det-spec__lbl">m²</p></div>}
              </div>
              <div className="det-meta">
                <div className="det-meta__item"><Tag size={13}/> <span>Type :</span> {prop.type}</div>
                {prop.etat&&<div className="det-meta__item"><CheckCircle size={13}/><span>État :</span> {prop.etat}</div>}
                {prop.annee&&<div className="det-meta__item"><Calendar size={13}/><span>Année :</span> {prop.annee}</div>}
                {prop.type_appartement&&<div className="det-meta__item"><Layers size={13}/><span>Logement :</span> {prop.type_appartement.toUpperCase()}</div>}
                {prop.etage!=null&&<div className="det-meta__item"><ChevronsUp size={13}/><span>Étage :</span> {prop.etage===0?"RDC":`${prop.etage}e étage`}</div>}
                {prop.type_villa&&<div className="det-meta__item"><Home size={13}/><span>Villa :</span> {prop.type_villa.toUpperCase()}</div>}
                {prop.type_option_villa&&<div className="det-meta__item"><Star size={13}/><span>Options :</span> {prop.type_option_villa.replace(/,/g,", ")}</div>}
                {prop.type_terrain&&<div className="det-meta__item"><Ruler size={13}/><span>Terrain :</span> {prop.type_terrain.replace(/_/g," ")}</div>}
                {prop.terrain_viabilise&&<div className="det-meta__item"><CheckCircle size={13}/><span>Viabilisé</span></div>}
                {prop.titre_foncier&&prop.titre_foncier!=="aucun"&&<div className="det-meta__item"><Tag size={13}/><span>Titre foncier :</span> {prop.titre_foncier}</div>}
                {prop.hauteur_immeuble&&<div className="det-meta__item"><Building2 size={13}/><span>Hauteur :</span> {prop.hauteur_immeuble}</div>}
                {prop.nb_appartements&&<div className="det-meta__item"><Building2 size={13}/><span>Appartements :</span> {prop.nb_appartements}</div>}
                {prop.orientation_immeuble&&<div className="det-meta__item"><Compass size={13}/><span>Orientation :</span> {prop.orientation_immeuble.replace(/_/g," ")}</div>}
                {prop.emplacement_garage&&<div className="det-meta__item"><Car size={13}/><span>Emplacement :</span> {prop.emplacement_garage.replace(/_/g," ")}</div>}
                {prop.nb_pieces!=null&&prop.nb_pieces>0&&<div className="det-meta__item"><Package size={13}/><span>Pièces :</span> {prop.nb_pieces}</div>}
                {prop.exclusivite&&<div className="det-meta__item" style={{color:"#7c3aed"}}><Star size={13}/><span>Exclusivité</span></div>}
                {!prop.anonyme&&prop.publisher_role&&(()=>{const roleMap={particulier:{label:"Particulier",color:"#6366f1",bg:"#eef2ff",Ico:Home},agence:{label:"Agence / Agent",color:"#0369a1",bg:"#e0f2fe",Ico:Building2},promoteur:{label:"Promoteur",color:"#7c3aed",bg:"#ede9fe",Ico:BadgeCheck},professionnel:{label:"Professionnel",color:"#15803d",bg:"#dcfce7",Ico:BadgeCheck}};const r=roleMap[prop.publisher_role]||{label:prop.publisher_role,color:"#64748b",bg:"#f1f5f9",Ico:Home};const{label,color,bg,Ico}=r;return(<div className="det-meta__item"><Ico size={13} style={{color}}/><span>Publié par :</span><span style={{display:"inline-flex",alignItems:"center",gap:4,background:bg,color,padding:"2px 10px",borderRadius:999,fontSize:12,fontWeight:700}}>{label}</span></div>);})()}
              </div>
              <div className="det-divider"/>

              {/* Contact box */}
              <div className="det-contact-box">
                {(()=>{
                  const storedUser=(() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                  const rawUrl=prop.publisher_picture||(isOwner?storedUser?.profile_picture:null);
                  const resolveUrl=url=>!url?null:(url.startsWith("data:")||url.startsWith("http"))?url:`${API_URL}${url}`;
                  const photoUrl=resolveUrl(rawUrl);
                  const initiale=(prop.contact.nom||"?")[0].toUpperCase();
                  const role=prop.publisher_role;
                  const roleLabels={particulier:"Particulier",agence:"Agence / Agent",promoteur:"Promoteur",professionnel:"Professionnel",partenaire:"Partenaire",admin:"Administrateur"};
                  if(prop.anonyme)return(<div className="det-contact-box__header"><div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#94a3b8,#64748b)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid #e2e8f0"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div><div className="det-contact-box__name">Membre anonyme</div><div className="det-contact-box__role">Identité masquée · Publication anonyme</div></div></div>);
                  if(role==="agence"||role==="promoteur"){const isAgence=role==="agence";const clr=isAgence?"#0369a1":"#7c3aed";const bg=isAgence?"#e0f2fe":"#ede9fe";const bgGrad=isAgence?"linear-gradient(135deg,#0369a1,#0ea5e9)":"linear-gradient(135deg,#7c3aed,#a855f7)";return(<div style={{background:"#f8fafc",borderRadius:14,padding:"16px 18px",marginBottom:4,border:`1.5px solid ${bg}`}}><div className="det-contact-box__name" style={{marginBottom:3}}>{prop.contact.nom}</div><div className="det-contact-box__role">Professionnel de l'immobilier</div><div style={{marginTop:18,textAlign:"center"}}>{photoUrl?<img src={photoUrl} alt="Logo" style={{width:"100%",maxHeight:150,objectFit:"contain",borderRadius:12,border:`1.5px solid ${bg}`,background:"#fff",padding:10}}/>:<div style={{width:"100%",height:110,borderRadius:12,background:bgGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,fontWeight:900,color:"#fff"}}>{initiale}</div>}</div></div>);}
                  return(<div className="det-contact-box__header">{photoUrl?<img src={photoUrl} alt="avatar" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e2e8f0"}}/>:<div className="det-contact-box__avatar">{initiale}</div>}<div><div className="det-contact-box__name">{prop.contact.nom}</div><div className="det-contact-box__role">{roleLabels[role]||"Propriétaire"}</div></div></div>);
                })()}
                {isOwner&&prop.views_count>0&&<div className="ad-views-row"><Eye size={14}/> <span>{prop.views_count} vue{prop.views_count>1?"s":""}</span></div>}
                {prop.anonyme?(
                  <div style={{marginTop:16}}>
                    {isOwner&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:9,padding:"9px 13px",fontSize:12.5,color:"#92400e",marginBottom:12,lineHeight:1.5}}>👁️ Votre annonce est publiée <strong>anonymement</strong>.<br/>Les visiteurs ne voient pas vos coordonnées.</div>}
                    {!isOwner&&<><button className="adm-contact-cta" onClick={()=>{const u=(() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();if(u)setContactForm(f=>({...f,nom:f.nom||u.username||"",telephone:f.telephone||u.phone_number||"",email:f.email||u.email||""}));setShowContactModal(true);}} style={{width:"100%",padding:"13px 16px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#6366f1,#818cf8)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><MessageCircle size={16} strokeWidth={2.5}/> Contacter le propriétaire</button><p className="adm-contact-sub" style={{fontSize:11.5,color:"#94a3b8",textAlign:"center",marginTop:8}}>Laissez vos coordonnées — le propriétaire vous contactera s'il est intéressé.</p></>}
                  </div>
                ):token?(
                  <div className="det-contact-box__btns">
                    {prop.contact.tel&&<><button onClick={()=>{trackContactClick(prop.id,"telephone");setShowCallModal(true);}} className="ad-cbtn ad-cbtn--call"><Phone size={15}/> Appeler</button><button onClick={()=>{trackContactClick(prop.id,"whatsapp");setShowWhatsappModal(true);}} className="ad-cbtn ad-cbtn--whatsapp"><WhatsAppIcon size={16}/> WhatsApp</button></>}
                    {prop.contact.email&&<a href={`mailto:${prop.contact.email}?subject=${encodeURIComponent(`Annonce "${prop.titre}" — Localizi.tn`)}&body=${encodeURIComponent(`Bonjour,\n\nJe suis intéressé(e) par votre annonce "${prop.titre}".\n\nCordialement`)}`} onClick={()=>trackContactClick(prop.id,"email")} className="ad-cbtn ad-cbtn--mail"><Mail size={15}/> Envoyer un e-mail</a>}
                  </div>
                ):(
                  <div className="det-contact-box__locked">
                    <button className="det-contact-box__blur-btn" onClick={()=>window.location.href=`/login?redirect=/annonce/${prop.id}`}><Phone size={14}/><span className="det-contact-box__blur-num">+216 XX XXX XXX</span><span className="det-contact-box__blur-lock">📞 Voir le numéro</span></button>
                    <p className="det-contact-box__lock-msg">Connectez-vous pour accéder aux coordonnées du propriétaire</p>
                    <div className="det-contact-box__auth-btns">
                      <a href={`/login?redirect=/annonce/${prop.id}`} className="ad-cbtn ad-cbtn--login">Se connecter</a>
                      <a href="/register" className="ad-cbtn ad-cbtn--register">Créer un compte</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Map */}
        <div className="adm-map-section" style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"}}>
            <div className="adm-map-header" style={{padding:"18px 28px 14px",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",gap:10}}>
              <MapPin size={16} strokeWidth={2} style={{color:"#6366f1"}}/>
              <span className="adm-map-title-full" style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Position / Emplacement du bien</span>
              <span className="adm-map-title-short" style={{display:"none",fontSize:14,fontWeight:800,color:"#0f172a"}}>Position du bien</span>
            </div>
            <div style={{height:440}}><BigMap lat={prop.lat} lng={prop.lng}/></div>
          </div>
        </div>

        {/* Rapport qualité/prix */}
        {prop.area>0&&nearby.length>=2&&(()=>{
          const thisPPM=prop.prix/prop.area;
          const nearPPMs=nearby.filter(n=>n.superficie>0&&n.prix>0).map(n=>n.prix/n.superficie);
          if(nearPPMs.length<1)return null;
          const avgPPM=nearPPMs.reduce((a,b)=>a+b,0)/nearPPMs.length;
          const r=thisPPM/avgPPM;
          const score=r>=1.30?1:r>=1.10?2:r>=0.90?3:r>=0.70?4:5;
          const labels=["","Prix très élevé","Prix élevé","Prix dans la moyenne","Bon prix","Très bon prix"];
          const colors=["","#ef4444","#f97316","#3b82f6","#22c55e","#15803d"];
          const bgs=["","#fef2f2","#fff7ed","#eff6ff","#f0fdf4","#dcfce7"];
          return(<div style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}><div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"}}><div style={{padding:"18px 28px 14px",borderBottom:"1px solid #e5e7eb"}}><span style={{fontSize:15,fontWeight:800,color:"#0f172a",letterSpacing:"-.01em"}}>Rapport qualité / prix</span></div><div style={{padding:"24px 28px"}}><div style={{display:"flex",gap:8,marginBottom:20}}>{[1,2,3,4,5].map(i=><div key={i} style={{height:12,flex:1,borderRadius:8,background:i<=score?colors[score]:"#e5e7eb",transition:"all .4s"}}/>)}</div><div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}><div style={{fontSize:20,fontWeight:800,color:colors[score],background:bgs[score],padding:"7px 22px",borderRadius:20}}>{labels[score]}</div><div style={{fontSize:13,color:"#6b7280",fontWeight:500}}>Basé sur {nearPPMs.length} bien{nearPPMs.length>1?"s":""} à proximité</div></div><p style={{margin:"14px 0 0",fontSize:13,color:"#374151",lineHeight:1.6}}>Le prix au m² de cette annonce est comparé aux biens similaires dans le même secteur géographique.</p></div></div></div>);
        })()}

        {/* ── Biens au même emplacement ── */}
        {samePointList.length > 1 && (
          <div className="adm-samepoint-wrap" style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"16px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:9,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Layers size={16} color="#6366f1"/>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>
                    {samePointList.length} biens à cet emplacement
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>Même adresse / même bâtiment — cliquez pour naviguer</div>
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{background:"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
                      <th style={{padding:"9px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}></th>
                      <th style={{padding:"9px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>Titre</th>
                      <th className="adm-sp-col-hide" style={{padding:"9px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>Type</th>
                      <th className="adm-sp-col-hide" style={{padding:"9px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>Catégorie</th>
                      <th className="adm-sp-col-hide" style={{padding:"9px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>Superficie</th>
                      <th style={{padding:"9px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>Prix</th>
                      <th style={{padding:"9px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {samePointList.map(a => {
                      const isActive = String(a.id) === String(activeId);
                      const typeFr = { appartement:"Appt.", villa:"Villa", villa_maison:"Villa", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local com.", ferme:"Ferme", immeuble:"Immeuble", garage_parking:"Garage" };
                      const catFr  = { vente:"Achat", location:"Location", vacances:"Vacances" };
                      const imgSrc = a.image_principale ? (a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`) : null;
                      return (
                        <tr key={a.id}
                          onClick={() => { if (!isActive) setActiveId(String(a.id)); }}
                          style={{borderBottom:"1px solid #f8fafc",cursor:isActive?"default":"pointer",background:isActive?"#f0f4ff":"",transition:"background .12s",borderLeft:isActive?"3px solid #6366f1":"3px solid transparent"}}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background="#f8faff"; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background=""; }}>
                          <td className="adm-sp-img-cell" style={{padding:"4px 10px 4px 14px",width:80,flexShrink:0}}>
                            {imgSrc
                              ? <img src={imgSrc} alt="" style={{width:72,height:52,objectFit:"cover",borderRadius:8,display:"block"}}/>
                              : <div style={{width:72,height:52,background:"#f1f5f9",borderRadius:8}}/>
                            }
                          </td>
                          <td style={{padding:"10px 14px",maxWidth:240}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                              <span style={{fontWeight:isActive?800:600,color:isActive?"#4f46e5":"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0}}>{a.titre}</span>
                            </div>
                          </td>
                          <td className="adm-sp-col-hide" style={{padding:"10px 14px",color:"#475569",whiteSpace:"nowrap"}}>{typeFr[a.type_bien] || a.type_bien}</td>
                          <td className="adm-sp-col-hide" style={{padding:"10px 14px"}}>
                            <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:a.categorie==="vente"?"#eef2ff":a.categorie==="location"?"#f0fdf4":"#fffbeb",color:a.categorie==="vente"?"#4f46e5":a.categorie==="location"?"#16a34a":"#d97706"}}>
                              {catFr[a.categorie] || a.categorie}
                            </span>
                          </td>
                          <td className="adm-sp-col-hide" style={{padding:"10px 14px",color:"#64748b",whiteSpace:"nowrap"}}>{a.superficie ? `${a.superficie} m²` : "—"}</td>
                          <td style={{padding:"10px 14px",fontWeight:700,color:"#0f172a",whiteSpace:"nowrap",fontSize:12}}>
                            {a.prix ? `${Number(a.prix).toLocaleString("fr-TN")} ${a.devise || "TND"}` : "—"}
                          </td>
                          <td className="adm-sp-view-cell" style={{padding:"10px 10px",whiteSpace:"nowrap"}}>
                            {!isActive && (
                              <span style={{display:"inline-flex",alignItems:"center",flexWrap:"nowrap",whiteSpace:"nowrap",gap:4,fontSize:12,fontWeight:700,color:"#6366f1",background:"#eef2ff",padding:"4px 10px",borderRadius:20}}>
                                Voir <ChevronRight size={12}/>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Satisfaction */}
        <div className="adm-full-section" style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
          <div className="adm-sat-wrap" style={{background:"linear-gradient(135deg,#f8faff,#eef2ff)",borderRadius:16,padding:"32px 40px",border:"1.5px solid #e0e7ff"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div className="adm-sat-title" style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:6}}>À quel point êtes-vous satisfait de cette annonce ?</div>
              <div className="adm-sat-sub" style={{fontSize:13,color:"#94a3b8"}}>Votre avis nous aide à améliorer l'expérience</div>
            </div>
            {ratingCount>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}><div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:16,opacity:s<=Math.round(ratingAvg||0)?1:0.25}}>⭐</span>)}</div><span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{(ratingAvg||0).toFixed(1)}</span><span style={{fontSize:12,color:"#94a3b8"}}>({ratingCount} avis)</span></div>}
            <div className="adm-sat-btns" style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
              {[{emoji:"😞",label:"Très insatisfait",val:1},{emoji:"😕",label:"Insatisfait",val:2},{emoji:"😐",label:"Neutre",val:3},{emoji:"😊",label:"Satisfait",val:4},{emoji:"😄",label:"Très satisfait",val:5}].map(({emoji,label,val})=>(
                <button key={val} className={`adm-sat-btn${satisfaction===val?" adm-sat-btn--active":""}`} onClick={()=>{setSatisfaction(val);localStorage.setItem(`localizi_sat_${id}`,String(val));let sk=localStorage.getItem("localizi_sk");if(!sk){sk=Math.random().toString(36).slice(2)+Date.now();localStorage.setItem("localizi_sk",sk);}fetch(`${API_URL}/annonces/${id}/reaction`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({session_key:sk,note:val})}).then(r=>r.ok?r.json():null).then(d=>{if(d){setRatingAvg(d.rating_avg);setRatingCount(d.rating_count);}}).catch(()=>{});}} title={label} style={{background:satisfaction===val?"#eef2ff":"#fff",border:satisfaction===val?"2px solid #6366f1":"2px solid #e5e7eb",borderRadius:14,padding:"14px 18px",cursor:"pointer",transform:satisfaction===val?"scale(1.12)":"scale(1)",transition:"all .22s cubic-bezier(.34,1.56,.64,1)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:80,boxShadow:satisfaction===val?"0 4px 14px rgba(99,102,241,.2)":"none"}}>
                  <span className="adm-sat-emoji" style={{fontSize:32}}>{emoji}</span>
                  <span className="adm-sat-label" style={{fontSize:11,color:satisfaction===val?"#6366f1":"#94a3b8",fontWeight:700,lineHeight:1.2,textAlign:"center"}}>{label}</span>
                </button>
              ))}
            </div>
            {satisfaction&&<p style={{fontSize:13,color:"#6366f1",fontWeight:700,textAlign:"center",marginTop:16,marginBottom:0}}>Merci pour votre retour ! 🎉</p>}
          </div>
        </div>

        {/* -- Signaler annonce — pleine largeur -- */}
        <div className="adm-full-section" style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
          <div style={{background:"#fff",border:"1px solid #fecaca",borderRadius:16,overflow:"hidden"}}>
            <div className="adm-report-head" style={{padding:"18px 28px 14px",borderBottom:"1px solid #fecaca",display:"flex",alignItems:"center",gap:10}}>
              <Flag size={15} color="#ef4444"/>
              <span className="adm-report-title" style={{fontSize:15,fontWeight:800,color:"#dc2626",letterSpacing:"-.01em"}}>Signaler cette annonce</span>
            </div>
            <div className="adm-report-body" style={{padding:"18px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <p className="adm-report-text adm-report-para" style={{margin:0,fontSize:13,color:"#374151",lineHeight:1.6}}>Vous pensez que cette annonce est frauduleuse, trompeuse ou ne respecte pas nos conditions d'utilisation ?<br/>Signalez-la et notre équipe l'examinera dans les plus brefs délais.</p>
                <div className="adm-report-ids" style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                  {prop.id&&<div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>Identifiant :</span><span style={{fontWeight:700,color:"#111827",fontFamily:"monospace",fontSize:12,background:"#f3f4f6",padding:"2px 8px",borderRadius:6}}>#{prop.id}</span></div>}
                  {prop.reference&&<div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>Référence :</span><span style={{fontWeight:700,color:"#111827",fontFamily:"monospace",fontSize:12,background:"#f3f4f6",padding:"2px 8px",borderRadius:6}}>{prop.reference}</span></div>}
                </div>
              </div>
              <button className="adm-report-btn" onClick={()=>{const storedUser=(() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();navigate("/signaler-probleme",{state:{lienAnnonce:`${window.location.origin}/annonce/${prop.id}`,reference:prop.reference||null,type:"Annonce frauduleuse ou trompeuse",nom:storedUser?.username||storedUser?.nom||"",email:storedUser?.email||""}});}}
                style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,background:"#ef4444",color:"#fff",border:"none",cursor:"pointer",padding:"11px 24px",borderRadius:10,fontSize:13.5,fontWeight:700,fontFamily:"inherit",transition:"background .15s",whiteSpace:"nowrap"}}
                onMouseEnter={e=>e.currentTarget.style.background="#dc2626"}
                onMouseLeave={e=>e.currentTarget.style.background="#ef4444"}>
                <Flag size={15} color="#fff"/> Signaler l'annonce
              </button>
            </div>
          </div>
        </div>

        {/* Nearby */}
        {nearby.length>0&&(
          <div className="det-nearby">
            <div className="det-nearby__head"><Navigation size={18} className="det-nearby__ico"/><h2 className="det-nearby__title">{t("ad_nearby")}</h2></div>
            <div className="det-nearby__scroll">
              {nearby.map(a => <ModalNearbyCard key={a.id} a={a}/>)}
            </div>
          </div>
        )}


        {/* ── Besoin d'un accompagnement ── */}
        <div className="lz-prest-wrap" style={{maxWidth:1200,margin:"0 auto 16px",padding:"0 24px"}}>
          <div style={{
            background:"linear-gradient(135deg, #0f2a1a 0%, #134d2e 50%, #166534 100%)",
            borderRadius:20,overflow:"hidden",position:"relative",
          }}>
            {/* Cercles décoratifs */}
            <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(34,197,94,.15)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-30,left:-20,width:120,height:120,borderRadius:"50%",background:"rgba(74,222,128,.12)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:"50%",right:160,transform:"translateY(-50%)",width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,.06)",pointerEvents:"none"}}/>

            <div className="lz-prest-inner" style={{position:"relative",padding:"28px 32px",display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
              {/* Icône */}
              <div className="lz-prest-icon" style={{
                flexShrink:0,width:60,height:60,borderRadius:18,
                background:"rgba(255,255,255,.12)",
                backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,.2)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>

              {/* Texte */}
              <div className="lz-prest-text" style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-.02em",lineHeight:1.2}}>
                    Besoin d'un accompagnement ?
                  </span>
                </div>
                <p style={{
                  margin:0,fontSize:13,color:"rgba(255,255,255,.72)",lineHeight:1.6,
                  maxWidth:520,
                }}>
                  Agents indépendants ou agences immobilières — faites-vous accompagner par un professionnel de confiance pour votre projet.
                </p>

                {/* Badges */}
                <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                  {[
                    {icon:"🧑‍💼", label:"Agents immobiliers"},
                    {icon:"🏢", label:"Agences immobilières"},
                    {icon:"🤝", label:"Mise en relation"},
                    {icon:"📋", label:"Conseil personnalisé"},
                  ].map(b => (
                    <span key={b.label} style={{
                      display:"flex",alignItems:"center",gap:4,
                      background:"rgba(255,255,255,.1)",
                      border:"1px solid rgba(255,255,255,.15)",
                      borderRadius:20,padding:"3px 10px",
                      fontSize:11,fontWeight:600,color:"rgba(255,255,255,.85)",
                    }}>
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bouton CTA */}
              <a
                href="/trouver-un-agent"
                onClick={e=>{e.preventDefault();window.location.href="/trouver-un-agent";}}
                style={{
                  flexShrink:0,display:"inline-flex",alignItems:"center",gap:9,
                  background:"#fff",color:"#0f172a",
                  padding:"13px 20px",borderRadius:14,
                  fontSize:13,fontWeight:800,textDecoration:"none",
                  boxShadow:"0 4px 20px rgba(0,0,0,.25)",
                  whiteSpace:"nowrap",
                  transition:"transform .15s, box-shadow .15s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,.3)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.25)";}}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Trouver un agent / une agence
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── Trouver un prestataire ── */}
        <div className="lz-prest-wrap" style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
          <div style={{
            background:"linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
            borderRadius:20,overflow:"hidden",position:"relative",
          }}>
            {/* Cercles décoratifs */}
            <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(99,102,241,.18)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-30,left:-20,width:120,height:120,borderRadius:"50%",background:"rgba(59,130,246,.15)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:"50%",right:160,transform:"translateY(-50%)",width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,.06)",pointerEvents:"none"}}/>

            <div className="lz-prest-inner" style={{position:"relative",padding:"28px 32px",display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
              {/* Icône */}
              <div className="lz-prest-icon" style={{
                flexShrink:0,width:60,height:60,borderRadius:18,
                background:"rgba(255,255,255,.12)",
                backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,.2)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>

              {/* Texte */}
              <div className="lz-prest-text" style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-.02em",lineHeight:1.2}}>
                    Besoin d'un professionnel ?
                  </span>
                  <span style={{
                    background:"rgba(99,102,241,.35)",border:"1px solid rgba(165,180,252,.4)",
                    borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,color:"#a5b4fc",
                    whiteSpace:"nowrap",
                  }}>
                    Nouveau
                  </span>
                </div>
                <p style={{
                  margin:0,fontSize:13,color:"rgba(255,255,255,.72)",lineHeight:1.6,
                  maxWidth:520,
                }}>
                  Architectes, décorateurs, plombiers, électriciens… Trouvez le prestataire idéal pour vos travaux, rénovations ou aménagements.
                </p>

                {/* Badges prestataires */}
                <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                  {[
                    {icon:"🏗️", label:"Travaux"},
                    {icon:"🎨", label:"Décoration"},
                    {icon:"⚡", label:"Électricité"},
                    {icon:"🔧", label:"Plomberie"},
                    {icon:"🏡", label:"Architecture"},
                  ].map(b => (
                    <span key={b.label} style={{
                      display:"flex",alignItems:"center",gap:4,
                      background:"rgba(255,255,255,.1)",
                      border:"1px solid rgba(255,255,255,.15)",
                      borderRadius:20,padding:"3px 10px",
                      fontSize:11,fontWeight:600,color:"rgba(255,255,255,.85)",
                    }}>
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bouton CTA */}
              <a
                className="lz-prest-cta"
                href="/trouver-un-prestataire"
                onClick={e=>{ e.preventDefault(); window.location.href="/trouver-un-prestataire"; }}
                style={{
                  flexShrink:0,display:"inline-flex",alignItems:"center",gap:9,
                  background:"#fff",color:"#0f172a",
                  padding:"13px 24px",borderRadius:14,
                  fontSize:14,fontWeight:800,textDecoration:"none",
                  boxShadow:"0 4px 20px rgba(0,0,0,.25)",
                  whiteSpace:"nowrap",
                  transition:"transform .15s, box-shadow .15s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,.3)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.25)";}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Trouver un prestataire
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer/>

        {/* Modal "Appeler" : liste des numéros du propriétaire */}
        {showCallModal && (() => {
          const tels = prop?.contact?.tels?.length ? prop.contact.tels : [prop?.contact?.tel].filter(Boolean);
          return ReactDOM.createPortal(
            <div style={{position:"fixed",inset:0,zIndex:10020,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',system-ui,sans-serif"}} onClick={e=>{if(e.target===e.currentTarget)setShowCallModal(false);}}>
              <div style={{background:"#fff",borderRadius:20,padding:"28px 28px 24px",maxWidth:420,width:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Logo variant="color" height={28} to={null}/>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>Appeler le propriétaire</div>
                      <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{tels.length} numéro{tels.length>1?"s":""} disponible{tels.length>1?"s":""}</div>
                    </div>
                  </div>
                  <button onClick={()=>setShowCallModal(false)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",flexShrink:0}}>
                    <X size={18} strokeWidth={2.5}/>
                  </button>
                </div>
                <p style={{fontSize:12.5,color:"#78716c",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 13px",display:"flex",gap:8,alignItems:"flex-start",marginBottom:16}}>
                  <Info size={14} strokeWidth={2} style={{flexShrink:0,marginTop:1,color:"#d97706"}}/>
                  En appelant le propriétaire, merci de préciser que vous le contactez depuis Localizi.tn.
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {tels.map(t => (
                    <a key={t} href={`tel:${t.replace(/\s/g,"")}`} onClick={()=>trackContactClick(prop.id,"telephone")} className="ad-cbtn ad-cbtn--call" style={{justifyContent:"space-between"}}>
                      <span style={{display:"flex",alignItems:"center",gap:9}}><Phone size={15}/> {t}</span>
                      <span style={{fontSize:12.5,fontWeight:700,opacity:.85}}>Appeler →</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Modal WhatsApp : choisir le numéro à contacter */}
        {showWhatsappModal && (() => {
          const tels = prop?.contact?.tels?.length ? prop.contact.tels : [prop?.contact?.tel].filter(Boolean);
          return ReactDOM.createPortal(
            <div style={{position:"fixed",inset:0,zIndex:10020,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',system-ui,sans-serif"}} onClick={e=>{if(e.target===e.currentTarget)setShowWhatsappModal(false);}}>
              <div style={{background:"#fff",borderRadius:20,padding:"28px 28px 24px",maxWidth:420,width:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Logo variant="color" height={28} to={null}/>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>Contacter sur WhatsApp</div>
                      <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{tels.length} numéro{tels.length>1?"s":""} disponible{tels.length>1?"s":""}</div>
                    </div>
                  </div>
                  <button onClick={()=>setShowWhatsappModal(false)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",flexShrink:0}}>
                    <X size={18} strokeWidth={2.5}/>
                  </button>
                </div>
                <p style={{fontSize:12.5,color:"#78716c",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 13px",display:"flex",gap:8,alignItems:"flex-start",marginBottom:16}}>
                  <Info size={14} strokeWidth={2} style={{flexShrink:0,marginTop:1,color:"#d97706"}}/>
                  En contactant le propriétaire, merci de préciser que vous le contactez depuis Localizi.tn.
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {tels.map(t => (
                    <a key={t} href={`https://wa.me/${t.replace(/[\s+]/g,"").replace(/^00/,"")}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce "${prop.titre}" sur Localizi.tn.`)}`}
                      target="_blank" rel="noopener noreferrer" className="ad-cbtn ad-cbtn--whatsapp" style={{justifyContent:"space-between"}}>
                      <span style={{display:"flex",alignItems:"center",gap:9}}><WhatsAppIcon size={15}/> {t}</span>
                      <span style={{fontSize:12.5,fontWeight:700,opacity:.85}}>Contacter →</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Contact anonyme modal */}
        {showContactModal&&ReactDOM.createPortal(
          <div style={{position:"fixed",inset:0,zIndex:10020,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',system-ui,sans-serif"}} onClick={e=>{if(e.target===e.currentTarget)setShowContactModal(false);}}>
            <div style={{background:"#fff",borderRadius:20,padding:"28px 28px 0",maxWidth:500,width:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Logo variant="color" height={28} to={null}/>
                  <div><div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>Contacter le propriétaire</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Le propriétaire vous recontactera directement</div></div>
                </div>
                <button onClick={()=>setShowContactModal(false)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",flexShrink:0}}><X size={18} strokeWidth={2.5}/></button>
              </div>
              <div style={{flex:1,overflowY:"auto",paddingBottom:28}}>
                {contactSent?(
                  <div style={{textAlign:"center",padding:"24px 0 16px"}}>
                    <div style={{width:60,height:60,borderRadius:"50%",background:"#f0fdf4",border:"2px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><CheckCircle size={30} color="#16a34a" strokeWidth={2}/></div>
                    <div style={{fontSize:19,fontWeight:800,color:"#0f172a",marginBottom:8}}>Demande envoyée !</div>
                    <p style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:24}}>Le propriétaire de <strong>"{prop?.titre}"</strong> dispose de vos coordonnées et vous contactera prochainement.</p>
                    <button onClick={()=>{setShowContactModal(false);setContactSent(false);}} style={{padding:"11px 32px",borderRadius:10,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>Fermer</button>
                  </div>
                ):(<>
                  {contactError&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,padding:"10px 14px",fontSize:13,color:"#dc2626",marginBottom:14}}>{contactError}</div>}
                  {[{key:"nom",label:"Votre nom *",type:"text",placeholder:"Prénom Nom"},{key:"telephone",label:"Votre téléphone",type:"tel",placeholder:"+216 XX XXX XXX"},{key:"email",label:"Votre email",type:"email",placeholder:"vous@email.com"},{key:"message",label:"Message (optionnel)",type:"textarea",placeholder:"Décrivez votre intérêt..."}].map(({key,label,type,placeholder})=>(
                    <div key={key} style={{marginBottom:13}}>
                      <label style={{fontSize:12.5,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>{label}</label>
                      {type==="textarea"?<textarea placeholder={placeholder} value={contactForm[key]} rows={3} onChange={e=>setContactForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",padding:"10px 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",background:"#f8fafc",boxSizing:"border-box"}}/>:<input type={type} placeholder={placeholder} value={contactForm[key]} onChange={e=>setContactForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",padding:"11px 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>}
                    </div>
                  ))}
                  <p style={{fontSize:12,color:"#94a3b8",marginBottom:16,display:"flex",alignItems:"center",gap:5}}><Info size={13} strokeWidth={2} style={{flexShrink:0}}/>Renseignez au moins votre téléphone ou votre email pour être contacté.</p>
                  <button disabled={contactLoading||!contactForm.nom.trim()||(!contactForm.telephone&&!contactForm.email)} onClick={async()=>{setContactLoading(true);setContactError("");try{const res=await fetch(`${API_URL}/annonces/${prop.id}/contact-request`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom:contactForm.nom.trim(),telephone:contactForm.telephone.trim()||null,email:contactForm.email.trim()||null,message:contactForm.message.trim()||null})});const data=await res.json();if(!res.ok)throw new Error(data.detail||"Erreur");setContactSent(true);}catch(err){setContactError(err.message||"Erreur lors de l'envoi");}finally{setContactLoading(false);}}} style={{width:"100%",padding:"13px",borderRadius:11,border:"none",background:contactLoading||!contactForm.nom.trim()||(!contactForm.telephone&&!contactForm.email)?"#cbd5e1":"#0f172a",color:"#fff",fontSize:14,fontWeight:700,cursor:contactLoading||!contactForm.nom.trim()||(!contactForm.telephone&&!contactForm.email)?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {contactLoading?"Envoi en cours…":<><Send size={15} strokeWidth={2.5}/> Envoyer ma demande</>}
                  </button>
                </>)}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Lightbox */}
        {lightboxIdx!==null&&ReactDOM.createPortal(
          <div style={{position:"fixed",inset:0,zIndex:10030,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setLightboxIdx(null)}>
            <button onClick={()=>setLightboxIdx(null)} style={{position:"absolute",top:18,right:22,background:"rgba(255,255,255,.12)",border:"none",borderRadius:99,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",zIndex:2}}><X size={22}/></button>
            <span style={{position:"absolute",top:22,left:"50%",transform:"translateX(-50%)",color:"rgba(255,255,255,.8)",fontSize:13,fontWeight:600,letterSpacing:".06em",pointerEvents:"none"}}>{lightboxIdx+1} / {images.length}</span>
            <div style={{position:"relative",display:"inline-block"}} onClick={e=>e.stopPropagation()}>
              <img src={images[lightboxIdx]} alt="" style={{maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:8,boxShadow:"0 8px 48px rgba(0,0,0,.5)",userSelect:"none",display:"block"}}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                <span style={{fontSize:36,fontWeight:900,letterSpacing:"-1px",fontFamily:"Arial,sans-serif",color:"rgba(255,255,255,0.18)",textShadow:"0 2px 8px rgba(0,0,0,0.2)",userSelect:"none",transform:"rotate(-15deg)"}}>
                  LOCAL<span style={{color:"rgba(99,102,241,0.25)"}}>IZI</span>.TN
                </span>
              </div>
            </div>
            {images.length>1&&<><button onClick={e=>{e.stopPropagation();setLightboxIdx(i=>(i-1+images.length)%images.length);}} style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.12)",border:"none",borderRadius:99,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}><ChevronLeft size={26}/></button><button onClick={e=>{e.stopPropagation();setLightboxIdx(i=>(i+1)%images.length);}} style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.12)",border:"none",borderRadius:99,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}><ChevronRight size={26}/></button></>}
          </div>,
          document.body
        )}
      </>
  );

  return ReactDOM.createPortal(
    <div
      style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
      onClick={onClose}
    >
      {/* Close button outside */}
      <button
        className="adm-close-btn"
        onClick={onClose}
        style={{position:"fixed",top:20,right:20,zIndex:10001,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",border:"1.5px solid rgba(255,255,255,.3)",borderRadius:"50%",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",transition:"background .15s"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.25)"}
        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}
        title="Fermer"
      >
        <X size={22} strokeWidth={2.5}/>
      </button>

      <div
        className="adm-modal-card"
        style={{background:"#f9fafb",width:"100%",maxWidth:1200,maxHeight:"calc(100vh - 32px)",overflowY:"auto",overflowX:"hidden",borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,.35)",fontFamily:"'Poppins',system-ui,sans-serif",fontSize:"11.5px"}}
        onClick={e=>e.stopPropagation()}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
          @keyframes spin { to { transform:rotate(360deg); } }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          .adm-topbar {
            display:flex; align-items:center; justify-content:space-between;
            padding:10px 24px; background:#fff; border-bottom:1px solid #e5e7eb;
            position:sticky; top:0; z-index:30;
          }
          .det-back { display:flex; align-items:center; gap:6px; font-size:13px; color:#6b7280; font-family:inherit; transition:color .15s; background:none; border:none; cursor:pointer; }
          .det-back:hover { color:#111; }
          .ad-topbar__actions { display:flex; gap:8px; }
          .det-action { display:flex; align-items:center; gap:6px; padding:7px 14px; border:1px solid #e5e7eb; border-radius:6px; font-size:13px; color:#6b7280; background:#fff; font-family:inherit; cursor:pointer; transition:all .15s; text-decoration:none; }
          .det-action:hover { border-color:#9ca3af; color:#111; }
          .det-action--liked { color:#6366f1; border-color:#6366f1; background:#eef2ff; }
          .det-body { display:grid; grid-template-columns:1fr 360px; gap:24px; max-width:1200px; margin:24px auto; padding:0 24px 48px; }
          .ad-gallery { margin-bottom:24px; }
          .ad-gallery__main { position:relative; border-radius:10px; overflow:hidden; background:#e5e7eb; }
          .ad-gallery__img { width:100%; height:440px; object-fit:cover; display:block; animation:fadeIn .2s ease; }
          .ad-gallery__btn { position:absolute; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.9); color:#374151; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,.12); transition:background .15s; border:none; cursor:pointer; }
          .ad-gallery__btn:hover { background:#fff; }
          .ad-gallery__btn--l { left:12px; }
          .ad-gallery__btn--r { right:12px; }
          .ad-gallery__counter { position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,.45); color:#fff; padding:3px 10px; border-radius:20px; font-size:12px; }
          .ad-gallery__thumbs { display:flex; gap:8px; margin-top:8px; overflow-x:auto; padding-bottom:4px; }
          .ad-gallery__thumb { width:80px; height:60px; object-fit:cover; border-radius:6px; border:2px solid transparent; cursor:pointer; flex-shrink:0; opacity:.65; transition:all .15s; }
          .ad-gallery__thumb--on { border-color:#6366f1; opacity:1; }
          .ad-gallery__thumb:hover { opacity:1; }
          .det-section { margin-bottom:24px; }
          .det-section__title { font-size:20px; font-weight:800; color:#0f172a; margin-bottom:14px; }
          .det-desc { font-family:'Poppins',system-ui,sans-serif; font-size:12px; color:#4b5563; line-height:1.8; text-align:justify; }
          .det-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:24px; margin-bottom:16px; }
          .det-card__cat { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:12px; color:#fff; }
          .det-card__cat--achat { background:#166534; }
          .det-card__cat--location { background:#1e40af; }
          .det-card__cat--vacances { background:#854d0e; }
          .det-card__titre { font-size:22px; font-weight:800; color:#111; line-height:1.3; margin-bottom:8px; }
          .det-addr { margin-bottom:14px; display:flex; flex-direction:column; gap:6px; }
          .det-addr__street { display:flex; align-items:flex-start; gap:5px; font-size:13px; color:#374151; font-weight:500; line-height:1.4; }
          .det-addr__ico { color:#6366f1; flex-shrink:0; margin-top:1px; }
          .det-addr__hier { display:flex; align-items:center; flex-wrap:wrap; gap:4px; }
          .det-addr__chip { display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; line-height:1; }
          .det-addr__chip--loc,.det-addr__chip--del,.det-addr__chip--gov { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
          .det-addr__sep { font-size:13px; color:#d1d5db; font-weight:400; }
          .det-specs { display:flex; gap:0; margin-bottom:20px; }
          .det-spec { flex:1; text-align:center; padding:16px 10px; border:1px solid #e5e7eb; border-radius:10px; margin-right:8px; }
          .det-spec:last-child { margin-right:0; }
          .det-spec svg { color:#6366f1; margin:0 auto 6px; display:block; }
          .det-spec__val { font-size:22px; font-weight:800; color:#111; }
          .det-spec__lbl { font-size:12.5px; color:#9ca3af; margin-top:2px; font-weight:500; }
          .det-meta { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }
          .det-meta__item { display:flex; align-items:center; gap:9px; font-size:14px; color:#374151; }
          .det-meta__item svg { color:#6366f1; flex-shrink:0; }
          .det-meta__item span { font-weight:600; color:#6b7280; }
          .det-divider { height:1px; background:#f3f4f6; margin:16px 0; }
          .det-contact-box { border:1.5px solid #e5e7eb; border-radius:14px; overflow:hidden; background:#fff; }
          .det-contact-box__header { display:flex; align-items:center; gap:14px; padding:18px 18px; background:#f8fafc; border-bottom:1px solid #e5e7eb; }
          .det-contact-box__avatar { width:42px; height:42px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; }
          .det-contact-box__name { font-size:16px; font-weight:700; color:#0f172a; }
          .det-contact-box__role { font-size:13px; color:#94a3b8; margin-top:3px; }
          .det-contact-box__btns { display:flex; flex-direction:column; gap:10px; padding:18px 18px; }
          .ad-cbtn { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; padding:14px 16px; border-radius:11px; font-size:15px; font-weight:700; font-family:inherit; cursor:pointer; transition:all .15s; text-decoration:none; border:none; text-align:center; }
          .ad-cbtn--call { background:#6366f1; color:#fff; }
          .ad-cbtn--call:hover { background:#4f46e5; }
          .ad-cbtn--whatsapp { background:#25d366; color:#fff; }
          .ad-cbtn--whatsapp:hover { background:#1ebe5d; }
          .ad-cbtn--mail { background:#fff; color:#374151; border:1.5px solid #d1d5db; }
          .ad-cbtn--mail:hover { border-color:#6b7280; background:#f9fafb; }
          .ad-views-row { display:flex; align-items:center; gap:6px; font-size:13.5px; color:#64748b; font-weight:600; padding:10px 18px 0; }
          .det-contact-box__locked { padding:14px 16px; }
          .det-contact-box__blur-btn { display:flex; align-items:center; gap:10px; width:100%; padding:11px 14px; margin-bottom:6px; background:#f1f5f9; border:1.5px dashed #cbd5e1; border-radius:10px; cursor:pointer; text-align:left; transition:background .15s,border-color .15s; font-family:inherit; }
          .det-contact-box__blur-btn:hover { background:#e2e8f0; border-color:#94a3b8; }
          .det-contact-box__blur-num { flex:1; filter:blur(4px); user-select:none; pointer-events:none; font-weight:700; color:#374151; font-size:14px; letter-spacing:.5px; }
          .det-contact-box__blur-lock { font-size:12px; font-weight:700; color:#6366f1; white-space:nowrap; filter:none; }
          .det-contact-box__lock-msg { text-align:center; font-size:12.5px; color:#64748b; font-weight:500; margin:8px 0 12px; line-height:1.5; }
          .det-contact-box__auth-btns { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
          .ad-cbtn--login { background:#0f172a; color:#fff; text-decoration:none; }
          .ad-cbtn--login:hover { background:#1e293b; }
          .ad-cbtn--register { background:#fff; color:#6366f1; border:1.5px solid #c7d2fe; }
          .ad-cbtn--register:hover { background:#eef2ff; }
          .det-section__header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
          .det-section__header .det-section__title { margin-bottom:0; }
          .ad-translate-btn { display:flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:600; border:1.5px solid #e0e7ff; background:#eef2ff; color:#4f46e5; cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap; }
          .ad-translate-btn:hover:not(:disabled) { background:#e0e7ff; }
          .ad-translate-btn:disabled { opacity:.6; cursor:not-allowed; }
          .ad-translated-note { font-size:11.5px; color:#9ca3af; margin-top:8px; }
          .ad-translated-reset { font-size:11.5px; color:#6366f1; text-decoration:underline; cursor:pointer; background:none; border:none; font-family:inherit; padding:0; }
          .det-nearby { max-width:1200px; margin:0 auto 48px; padding:0 24px; }
          .det-nearby__head { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
          .det-nearby__ico { color:#6366f1; flex-shrink:0; }
          .det-nearby__title { font-size:18px; font-weight:800; color:#0f172a; letter-spacing:-.02em; }
          .det-nearby__scroll { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
          @keyframes mncInL  { from{transform:translateX(100%)}  to{transform:translateX(0)} }
          @keyframes mncOutL { from{transform:translateX(0)}     to{transform:translateX(-100%)} }
          @keyframes mncInR  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
          @keyframes mncOutR { from{transform:translateX(0)}     to{transform:translateX(100%)} }
          .pc { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; cursor:pointer; transition:box-shadow .18s,border-color .18s,transform .12s; }
          .pc:hover { box-shadow:0 6px 20px rgba(0,0,0,.12); border-color:#94a3b8; transform:translateY(-1px); }
          .pc__cat-badge { position:absolute; top:8px; right:8px; z-index:10; padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; }
          .pc__cat-badge--vente    { background:#166534; color:#fff; }
          .pc__cat-badge--location { background:#1e40af; color:#fff; }
          .pc__cat-badge--vacances { background:#854d0e; color:#fff; }
          .pc__body   { padding:12px 14px 13px; }
          .pc__price  { font-size:22px; font-weight:900; color:#0a0a0a; margin-bottom:2px; }
          .pc__devise { font-size:13px; font-weight:500; color:#475569; margin-left:2px; }
          .pc__title  { font-size:15px; color:#0a0a0a; font-weight:700; margin-bottom:5px; line-height:1.35; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
          .pc__fav    { width:28px; height:28px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#cbd5e1; background:#f1f5f9; border:none; cursor:pointer; transition:all .15s; }
          .pc__fav:hover { color:#ef4444; background:#fee2e2; }
          .pc__fav--on { color:#ef4444 !important; background:#fee2e2 !important; }
          .pc__loc    { display:flex; align-items:center; gap:3px; font-size:12px; color:#374151; font-weight:500; margin-bottom:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
          .pc__specs  { display:flex; gap:10px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9; }
          .pc__specs span { display:flex; align-items:center; gap:3px; font-size:13px; color:#1e293b; font-weight:500; }
          @media (max-width:900px) { .det-body { grid-template-columns:1fr; } .det-right { order:-1; } .ad-gallery__img { height:280px; } }
          @media (max-width:560px) { .det-body { padding:0 12px 32px; margin-top:12px; } .adm-topbar { padding:8px 12px; } .ad-topbar__actions { gap:4px; } .det-action { padding:6px 10px; font-size:12px; } }

          /* ── MOBILE : galerie 1 seule image + bouton voir toutes ── */
          .adm-see-all-btn { display:none; }
          @media (max-width:860px) {
            /* Modal : plein écran, pas de débordement */
            .adm-modal-card {
              border-radius:12px !important;
              max-height:calc(100dvh - 24px) !important;
              overflow-x:hidden !important;
              max-width:100vw !important;
            }
            .adm-modal-card * {
              max-width:100% !important;
              word-break:break-word !important;
              box-sizing:border-box !important;
            }
            img, video { max-width:100% !important; }
            /* Galerie : 1 seule colonne, hauteur réduite */
            .adm-gallery-grid {
              grid-template-columns:1fr !important;
              height:240px !important; min-height:240px !important; max-height:240px !important;
            }
            .adm-gallery-main { grid-column:1; }
            /* Masquer la colonne droite (2 petites images) */
            .adm-gallery-right { display:none !important; }
            /* Bouton "Voir X images" — affiché en haut de l'image */
            .adm-see-all-btn {
              display:flex; align-items:center; gap:5px;
              position:absolute; top:10px; right:10px; z-index:7;
              background:rgba(15,23,42,.65); backdrop-filter:blur(6px);
              color:#fff; border:1px solid rgba(255,255,255,.35);
              border-radius:20px; padding:5px 12px;
              font-size:12px; font-weight:700; cursor:pointer;
              font-family:inherit;
            }
            /* Corps du modal : padding latéral augmenté pour éviter le débordement */
            .det-body { padding:0 16px 24px !important; margin-top:10px !important; box-sizing:border-box !important; }
            /* Carte d'info (titre, adresse, specs) : supprimer le cadre, fond transparent, juste un trait séparateur */
            .det-card { background:transparent !important; border:none !important; border-radius:0 !important; padding:0 0 16px !important; margin-bottom:0 !important; box-shadow:none !important; border-bottom:1px solid #f0f0f0 !important; }
            /* Section carte position : élargir, moins de padding latéral */
            .adm-map-section { padding:0 6px !important; }
            .adm-topbar { padding:8px 14px !important; }
            /* Sections pleine largeur (satisfaction, signaler) */
            .adm-full-section { padding:0 12px !important; }
            /* Titres et description */
            .det-title { font-size:17px !important; line-height:1.3 !important; }
            .det-section__title { font-size:14px !important; margin-bottom:10px !important; }
            .det-desc { font-size:12px !important; line-height:1.7 !important; text-align:justify !important; }
            .det-price { font-size:22px !important; }
            /* Caractéristiques : 2 par ligne, texte compact */
            .adm-feats-grid { grid-template-columns:repeat(2,1fr) !important; gap:7px !important; }
            .adm-feat-item { padding:9px 10px !important; font-size:11px !important; border-radius:8px !important; gap:7px !important; }
            .adm-feat-item svg { width:16px !important; height:16px !important; }
            /* Section satisfaction : texte plus petit, emoji plus petit, 1 seule ligne */
            .adm-sat-title { font-size:13px !important; }
            .adm-sat-sub   { font-size:11px !important; }
            .adm-sat-btns  { gap:5px !important; flex-wrap:nowrap !important; overflow-x:auto !important; justify-content:flex-start !important; padding-bottom:4px !important; }
            .adm-sat-btn   { padding:8px 6px !important; min-width:54px !important; border-radius:10px !important; gap:3px !important; }
            .adm-sat-emoji { font-size:20px !important; }
            .adm-sat-label { font-size:9px !important; }
            .adm-sat-wrap  { padding:16px 14px !important; }
            /* Signaler : bouton compact */
            .adm-report-btn { padding:8px 14px !important; font-size:11.5px !important; border-radius:8px !important; gap:5px !important; }
            .adm-report-btn svg { width:13px !important; height:13px !important; }
            .adm-report-title { font-size:13px !important; }
            .adm-report-text  { font-size:11px !important; }
            .adm-report-head  { padding:12px 14px 10px !important; }
            .adm-report-body  { padding:12px 14px !important; }
            /* Titre de l'annonce */
            .det-title { font-size:15px !important; }
            /* Badge catégorie (Location / Vente / Vacances) */
            .det-card__cat { font-size:10px !important; padding:2px 8px !important; border-radius:6px !important; }
            /* Boîte contact : plus compact, bouton plus petit, marge augmentée */
            .det-contact-box { padding:12px !important; }
            .det-contact-box__name { font-size:13px !important; }
            .det-contact-box__role { font-size:11px !important; }
            .ad-cbtn { padding:8px 10px !important; font-size:11.5px !important; }
            /* Bouton contacter le propriétaire */
            .adm-contact-cta { padding:10px 12px !important; font-size:12px !important; margin-top:20px !important; border-radius:9px !important; }
            .adm-contact-sub { font-size:10.5px !important; }
            /* Section carte : header mobile */
            .adm-map-title-full  { display:none !important; }
            .adm-map-title-short { display:block !important; }
            .adm-map-header { padding:10px 14px !important; }
            /* Carte : dropdown POI mobile */
            .bm-poi-desktop { display:none !important; }
            .bm-poi-mobile  { display:flex !important; }
            .bm-nav-desktop { display:none !important; }
            /* Boutons topbar : icône seulement */
            .det-action-txt { display:none !important; }
            .det-action { padding:7px 10px !important; }
            /* Bouton X de fermeture : caché (le Retour suffit) */
            .adm-close-btn { display:none !important; }
            /* Signaler : texte court + cacher paragraphe + bouton inline avec IDs */
            .adm-report-btn-full  { display:none !important; }
            .adm-report-btn-short { display:inline !important; }
            .adm-report-para { display:none !important; }
            /* Biens au même emplacement : pleine largeur, image visible fixe */
            .adm-samepoint-wrap { padding:0 6px !important; }
            .adm-sp-img-cell { padding:4px 8px 4px 10px !important; }
            .adm-sp-img-cell img { width:68px !important; height:52px !important; min-width:68px !important; object-fit:cover !important; border-radius:8px !important; display:block !important; }
            .adm-sp-img-cell > div { width:68px !important; height:52px !important; min-width:68px !important; border-radius:8px !important; }
            .adm-sp-view-cell { min-width:64px !important; white-space:nowrap !important; }
            .adm-sp-view-cell span { white-space:nowrap !important; flex-shrink:0 !important; }
            /* Specs (Chambres / Sdb / m²) : format carré, texte réduit */
            .det-specs { gap:6px !important; }
            .det-spec { padding:8px 6px !important; border-radius:8px !important; margin-right:0 !important; aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center; }
            .det-spec svg { width:14px !important; height:14px !important; margin-bottom:3px !important; }
            .det-spec__val { font-size:15px !important; margin:0 !important; line-height:1.1 !important; }
            .det-spec__lbl { font-size:9px !important; margin:0 !important; line-height:1.2 !important; }
            /* Émojis satisfaction : carré, sans bordure grise, plus larges, overflow visible pour la bordure active */
            .adm-sat-btns  { gap:5px !important; justify-content:space-between !important; overflow:visible !important; padding:4px 2px !important; }
            .adm-sat-btn { padding:8px 6px !important; min-width:52px !important; max-width:none !important; aspect-ratio:1 !important; border-radius:10px !important; gap:2px !important; flex:1 !important; border:2px solid transparent !important; box-sizing:border-box !important; }
            .adm-sat-btn.adm-sat-btn--active { border:2px solid #6366f1 !important; transform:none !important; }
            .adm-sat-emoji { font-size:20px !important; }
            .adm-sat-label { font-size:8px !important; }
            /* Sections satisfaction + signaler : moins de padding latéral pour être plus larges */
            .adm-full-section { padding:0 6px !important; }
            .adm-sat-wrap  { padding:14px 12px !important; overflow:visible !important; }
            .adm-report-head { padding:10px 12px !important; }
            .adm-report-body { padding:10px 12px !important; align-items:center !important; }
            /* Signaler : cacher le texte long, montrer "Signaler", cacher le paragraphe */
            .adm-report-btn-short { display:none !important; }
            .adm-report-btn-full  { display:inline !important; }
            .adm-report-para { display:block !important; }
            /* Specs (Chambres/Sdb/m²) : toujours 3 colonnes égales, taille fixe */
            .det-specs { display:grid !important; grid-template-columns:repeat(3,1fr) !important; gap:6px !important; }
            .det-spec { margin-right:0 !important; flex:unset !important; width:auto !important; aspect-ratio:1 !important; }
            /* Section prestataire : layout mobile */
            .lz-prest-wrap { padding:0 8px !important; margin-bottom:20px !important; }
            .lz-prest-inner { padding:18px 16px !important; flex-direction:column !important; align-items:flex-start !important; gap:12px !important; }
            .lz-prest-icon { width:44px !important; height:44px !important; border-radius:12px !important; }
            .lz-prest-text { width:100% !important; flex:unset !important; }
            .lz-prest-cta { width:100% !important; justify-content:center !important; padding:12px 16px !important; box-sizing:border-box !important; }
          }
        `}</style>
        {modalContent}
      </div>
    </div>,
    document.body
  );
}

/* ── BigMap ── */
const PIN_SVG_HTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48"><path d="M18 0C8.059 0 0 8.059 0 18c0 11.25 16.2 28.35 16.931 29.147a1.5 1.5 0 0 0 2.138 0C19.8 46.35 36 29.25 36 18 36 8.059 27.941 0 18 0z" fill="#6366f1"/><circle cx="18" cy="18" r="8" fill="white"/></svg>`;
const BM_SCHOOL_SVG  = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
const BM_MOSQUE_SVG  = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
const BM_FACULTY_SVG = '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>';
const BM_SURFACE_SVG  = '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>';
const BM_HOSPITAL_SVG = '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>';
const BM_SCHOOLS = [{id:"sc1",nom:"Lycée Pilote de Tunis",lat:36.821,lng:10.159},{id:"sc2",nom:"Collège Ibn Khaldoun",lat:36.833,lng:10.171},{id:"sc3",nom:"École El Menzah VI",lat:36.846,lng:10.206},{id:"sc4",nom:"Lycée Technique Ariana",lat:36.866,lng:10.197},{id:"sc5",nom:"Collège La Soukra",lat:36.882,lng:10.213},{id:"sc6",nom:"Lycée Habib Bourguiba Sousse",lat:35.830,lng:10.638},{id:"sc7",nom:"École Primaire Port Kantaoui",lat:35.892,lng:10.612},{id:"sc8",nom:"Lycée Farhat Hached Sfax",lat:34.744,lng:10.762},{id:"sc9",nom:"Collège Ibn Sina Sfax",lat:34.737,lng:10.756},{id:"sc10",nom:"École Tahar Haddad Hammamet",lat:36.403,lng:10.617},{id:"sc11",nom:"Lycée Pilote Nabeul",lat:36.458,lng:10.732},{id:"sc12",nom:"École Erriadh Monastir",lat:35.785,lng:10.815},{id:"sc13",nom:"Collège Djerba Midoun",lat:33.825,lng:10.885},{id:"sc14",nom:"Lycée Teboulba Ben Arous",lat:36.720,lng:10.240}];
const BM_MOSQUES = [{id:"mo1",nom:"Mosquée Zitouna",lat:36.798,lng:10.174},{id:"mo2",nom:"Mosquée El Fath Lac",lat:36.840,lng:10.234},{id:"mo3",nom:"Mosquée Ennasr",lat:36.858,lng:10.193},{id:"mo4",nom:"Mosquée Raoued",lat:36.890,lng:10.177},{id:"mo5",nom:"Mosquée Boujemaa Sousse",lat:35.826,lng:10.636},{id:"mo6",nom:"Mosquée Sidi Bouali Sousse",lat:35.818,lng:10.644},{id:"mo7",nom:"Mosquée Trois Portes Sfax",lat:34.739,lng:10.759},{id:"mo8",nom:"Mosquée Sidi Lakhmi Sfax",lat:34.746,lng:10.767},{id:"mo9",nom:"Mosquée El Kebir Hammamet",lat:36.397,lng:10.621},{id:"mo10",nom:"Mosquée Nabeul Ville",lat:36.452,lng:10.739},{id:"mo11",nom:"Mosquée Monastir Médina",lat:35.776,lng:10.827},{id:"mo12",nom:"Mosquée Erriadh Djerba",lat:33.833,lng:10.862},{id:"mo13",nom:"Mosquée Ben Arous",lat:36.753,lng:10.229},{id:"mo14",nom:"Mosquée Kairouan Okba",lat:35.681,lng:10.098}];
const BM_FACULTIES = [{id:"fac1",nom:"Université Tunis El Manar",lat:36.838,lng:10.168},{id:"fac2",nom:"Faculté des Sciences de Tunis",lat:36.835,lng:10.172},{id:"fac3",nom:"INSAT Tunis",lat:36.855,lng:10.197},{id:"fac4",nom:"Université Carthage",lat:36.870,lng:10.184},{id:"fac5",nom:"ISSAT Sousse",lat:35.822,lng:10.631},{id:"fac6",nom:"Faculté de Médecine Sousse",lat:35.840,lng:10.647},{id:"fac7",nom:"Université de Sfax",lat:34.749,lng:10.758},{id:"fac8",nom:"FSEG Sfax",lat:34.740,lng:10.752},{id:"fac9",nom:"IPEIM Monastir",lat:35.778,lng:10.826},{id:"fac10",nom:"Université Manouba",lat:36.828,lng:10.093},{id:"fac11",nom:"ISG Tunis",lat:36.812,lng:10.147},{id:"fac12",nom:"Faculté Droit Sc. Politiques",lat:36.795,lng:10.181}];
const BM_SURFACES = [{id:"gs1",nom:"Carrefour Lac Tunis",lat:36.841,lng:10.237},{id:"gs2",nom:"Géant Casino Ennasr",lat:36.859,lng:10.192},{id:"gs3",nom:"Monoprix Menzah",lat:36.848,lng:10.207},{id:"gs4",nom:"Carrefour Market Ariana",lat:36.866,lng:10.199},{id:"gs5",nom:"Azur Sousse",lat:35.834,lng:10.641},{id:"gs6",nom:"Carrefour Market Sfax",lat:34.741,lng:10.763},{id:"gs7",nom:"Géant Hammamet",lat:36.405,lng:10.624},{id:"gs8",nom:"Monoprix Centre-ville Tunis",lat:36.803,lng:10.180},{id:"gs9",nom:"Carrefour Ben Arous",lat:36.741,lng:10.226},{id:"gs10",nom:"MG Monastir",lat:35.781,lng:10.831}];

function bmPoiIcon(L,color,svgPath){return L.divIcon({className:"",html:`<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg></div>`,iconSize:[28,28],iconAnchor:[14,14]});}
function BmPoiSvg({path}){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:path}}/>);}

function BigMap({lat,lng}){
  const { poi_enabled: poiEnabled } = useFeatureFlags();
  const ref=React.useRef(null);const mapRef=React.useRef(null);const leafletRef=React.useRef(null);
  const poiRef=React.useRef({schools:[],mosques:[],faculties:[],surfaces:[],hospitals:[]});
  const[showSchools,setShowSchools]=React.useState(false);
  const[showMosques,setShowMosques]=React.useState(false);
  const[showFaculties,setShowFaculties]=React.useState(false);
  const[showSurfaces,setShowSurfaces]=React.useState(false);
  const[showHospitals,setShowHospitals]=React.useState(false);
  const[livePOIs,setLivePOIs]=React.useState({schools:[],mosques:[],faculties:[],surfaces:[],hospitals:[],loading:false,fetched:false});
  const[showPoiMenu,setShowPoiMenu]=React.useState(false);

  const fetchPOIs=React.useCallback(async(customBbox)=>{
    if(!lat||!lng)return;
    setLivePOIs(p=>({...p,loading:true}));
    const bbox=customBbox||`${lat-0.025},${lng-0.04},${lat+0.025},${lng+0.04}`;
    const query=`[out:json][timeout:18];\n(\n  node["amenity"="school"](${bbox});\n  way["amenity"="school"](${bbox});\n  node["amenity"="place_of_worship"]["religion"="muslim"](${bbox});\n  way["amenity"="place_of_worship"]["religion"="muslim"](${bbox});\n  node["amenity"="university"](${bbox});\n  way["amenity"="university"](${bbox});\n  node["amenity"="college"](${bbox});\n  way["amenity"="college"](${bbox});\n  node["shop"~"supermarket|mall|department_store"](${bbox});\n  way["shop"~"supermarket|mall|department_store"](${bbox});\n  node["amenity"~"hospital|clinic"](${bbox});\n  way["amenity"~"hospital|clinic"](${bbox});\n);\nout center;`;
    try{
      const res=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:query});
      const data=await res.json();
      const els=data.elements||[];
      const pt=e=>({lat:e.type==="way"?e.center?.lat:e.lat,lng:e.type==="way"?e.center?.lon:e.lon});
      setLivePOIs({
        loading:false,fetched:true,
        schools:   els.filter(e=>e.tags?.amenity==="school").map(e=>({id:`sc_${e.id}`,nom:e.tags?.name||"École",...pt(e)})).filter(e=>e.lat&&e.lng),
        mosques:   els.filter(e=>e.tags?.amenity==="place_of_worship"&&e.tags?.religion==="muslim").map(e=>({id:`mo_${e.id}`,nom:e.tags?.name||"Mosquée",...pt(e)})).filter(e=>e.lat&&e.lng),
        faculties: els.filter(e=>e.tags?.amenity==="university"||e.tags?.amenity==="college").map(e=>({id:`fac_${e.id}`,nom:e.tags?.name||"Faculté",...pt(e)})).filter(e=>e.lat&&e.lng),
        surfaces:  els.filter(e=>e.tags?.shop&&/supermarket|mall|department_store/.test(e.tags.shop)).map(e=>({id:`gs_${e.id}`,nom:e.tags?.name||"Grande surface",...pt(e)})).filter(e=>e.lat&&e.lng),
        hospitals: els.filter(e=>e.tags?.amenity==="hospital"||e.tags?.amenity==="clinic").map(e=>({id:`ho_${e.id}`,nom:e.tags?.name||"Hôpital",...pt(e)})).filter(e=>e.lat&&e.lng),
      });
    }catch{setLivePOIs(p=>({...p,loading:false,fetched:true}));}
  },[lat,lng]);

  React.useEffect(()=>{
    if(!ref.current||mapRef.current)return;
    let live=true;
    (async()=>{
      const L=(await import("leaflet")).default;
      if(!live||!ref.current)return;
      /* Carte figée : le bien reste toujours exactement au centre du cadre.
         Aucune interaction (glisser, zoom, molette, double-clic, pincement)
         ne doit pouvoir déplacer la vue — sinon sur mobile un simple geste de
         défilement de la page fait glisser la carte et le point disparaît. */
      const map=L.map(ref.current,{
        zoomControl:false, dragging:false, scrollWheelZoom:false,
        doubleClickZoom:false, boxZoom:false, keyboard:false, touchZoom:false,
        tap:false,
      }).setView([lat,lng],15);
      mapRef.current=map;leafletRef.current=L;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{attribution:"© OpenStreetMap © CARTO",maxZoom:19}).addTo(map);

      /* Pin en forme de goutte (style Google Maps) dessiné en vecteur natif
         Leaflet (polygone + cercle via le moteur SVG interne) — les divIcon/HTML
         personnalisés ne s'affichent pas de façon fiable dans ce contexte précis,
         alors que les calques vectoriels fonctionnent toujours. Une seule tête
         ronde + une seule pointe, pas de calque dupliqué en dessous. */
      let pinLayers=[];
      function drawPin(){
        pinLayers.forEach(l=>{try{l.remove();}catch{}});
        pinLayers=[];
        try{
          const tip=map.latLngToContainerPoint([lat,lng]);
          const px2ll=(dx,dy)=>map.containerPointToLatLng([tip.x+dx,tip.y+dy]);
          const R=12, C={x:0,y:-28}; // centre de la tête, à 28px au-dessus de la pointe
          const phi=Math.acos(R/28)*180/Math.PI; // ~64.6° — tangentes pointe → cercle
          const rad1=(90-phi)*Math.PI/180, rad2=(90+phi)*Math.PI/180;
          const tan1=[C.x+R*Math.cos(rad1), C.y+R*Math.sin(rad1)];
          const tan2=[C.x+R*Math.cos(rad2), C.y+R*Math.sin(rad2)];
          const latlngs=[[0,0],tan1,tan2].map(([dx,dy])=>px2ll(dx,dy));
          // Pointe : triangle plein, sans bordure, dessiné d'abord (sous la tête).
          pinLayers.push(L.polygon(latlngs,{stroke:false,fillColor:"#6366f1",fillOpacity:1,interactive:false}).addTo(map));
          // Tête : un seul vrai cercle SVG (toujours parfaitement rond), sans bordure.
          pinLayers.push(L.circleMarker(px2ll(C.x,C.y),{radius:R,stroke:false,fillColor:"#6366f1",fillOpacity:1,interactive:false}).addTo(map));
          pinLayers.push(L.circleMarker(px2ll(C.x,C.y),{radius:5,weight:0,fillColor:"#fff",fillOpacity:1,interactive:false}).addTo(map));
        }catch{
          // Filet de sécurité : uniquement si la forme goutte ci-dessus échoue.
          pinLayers.push(L.circleMarker([lat,lng],{radius:9,color:"#fff",weight:3,fillColor:"#6366f1",fillOpacity:1,interactive:false}).addTo(map));
        }
      }
      drawPin();
      setTimeout(()=>{
        map.invalidateSize();
        map.setView([lat,lng],15); // re-centre après le vrai calcul de taille du conteneur
        drawPin(); // redessine avec la position pixel définitive
        const b=map.getBounds();
        fetchPOIs(`${b.getSouth().toFixed(6)},${b.getWest().toFixed(6)},${b.getNorth().toFixed(6)},${b.getEast().toFixed(6)}`);
      },150);
    })();
    return()=>{live=false;if(mapRef.current){mapRef.current.remove();mapRef.current=null;}};
  },[lat,lng,fetchPOIs]);

  function applyPOI(key,show,data,label,color,svgPath){
    const L=leafletRef.current;const map=mapRef.current;
    if(!L||!map)return;
    poiRef.current[key].forEach(m=>{try{m.remove();}catch{}});
    poiRef.current[key]=[];
    if(!show)return;
    const icon=bmPoiIcon(L,color,svgPath);
    data.forEach(s=>{try{const m=L.marker([s.lat,s.lng],{icon}).addTo(map).bindPopup(`<b>${label}</b><br>${s.nom||""}`);poiRef.current[key].push(m);}catch{}});
  }

  React.useEffect(()=>{applyPOI("schools",   showSchools,   livePOIs.schools,   "École",            "#2563eb",BM_SCHOOL_SVG);  },[showSchools,   livePOIs.schools]);
  React.useEffect(()=>{applyPOI("mosques",   showMosques,   livePOIs.mosques,   "Mosquée",          "#16a34a",BM_MOSQUE_SVG);  },[showMosques,   livePOIs.mosques]);
  React.useEffect(()=>{applyPOI("faculties", showFaculties, livePOIs.faculties, "Faculté",          "#7c3aed",BM_FACULTY_SVG); },[showFaculties, livePOIs.faculties]);
  React.useEffect(()=>{applyPOI("surfaces",  showSurfaces,  livePOIs.surfaces,  "Grande surface",   "#ea580c",BM_SURFACE_SVG); },[showSurfaces,  livePOIs.surfaces]);
  React.useEffect(()=>{applyPOI("hospitals", showHospitals, livePOIs.hospitals||[], "Hôpital / Clinique","#dc2626",BM_HOSPITAL_SVG);},[showHospitals, livePOIs.hospitals]);

  const btnStyle=(active,color)=>({display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,transition:"all .15s",background:active?color:"#f1f5f9",color:active?"#fff":"#64748b",boxShadow:active?`0 2px 8px ${color}55`:"none",opacity:livePOIs.loading?0.6:1});

  const POI_ITEMS=[
    {key:"schools",  show:showSchools,  set:setShowSchools,  color:"#2563eb", svg:BM_SCHOOL_SVG,  label:"Écoles",         data:livePOIs.schools},
    {key:"mosques",  show:showMosques,  set:setShowMosques,  color:"#16a34a", svg:BM_MOSQUE_SVG,  label:"Mosquées",       data:livePOIs.mosques},
    {key:"faculties",show:showFaculties,set:setShowFaculties,color:"#7c3aed", svg:BM_FACULTY_SVG, label:"Facultés",       data:livePOIs.faculties},
    {key:"surfaces", show:showSurfaces, set:setShowSurfaces, color:"#ea580c", svg:BM_SURFACE_SVG, label:"Grandes surfaces",data:livePOIs.surfaces},
    {key:"hospitals",show:showHospitals,set:setShowHospitals,color:"#dc2626", svg:BM_HOSPITAL_SVG,label:"Hôpitaux",       data:livePOIs.hospitals||[]},
  ];

  const navLink=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* ── Header bar ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,padding:"10px 16px",borderBottom:"1px solid #f1f5f9",background:"#fafafa",position:"relative",zIndex:1001}}>

        {/* Desktop: boutons POI inline */}
        {poiEnabled && <div className="bm-poi-desktop" style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {livePOIs.loading&&<span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Chargement…</span>}
          {POI_ITEMS.map(({key,show,set,color,svg,label,data})=>(
            <button key={key} style={btnStyle(show,color)} onClick={()=>set(v=>!v)} disabled={livePOIs.loading}>
              <BmPoiSvg path={svg}/> {label} {livePOIs.fetched?`(${data.length})`:""}</button>
          ))}
        </div>}

        {/* Mobile: bouton dropdown Lieux (uniquement si POI activés) */}
        <div className="bm-poi-mobile" style={{display:"none",position:"relative",alignItems:"center",gap:6,flex:1}}>
          {poiEnabled && <>
            <button onClick={()=>setShowPoiMenu(v=>!v)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,color:"#374151"}}>
              Lieux {showPoiMenu?"▲":"▼"}
            </button>
            {showPoiMenu&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:1500,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,boxShadow:"0 4px 16px rgba(0,0,0,.18)",overflow:"hidden",minWidth:200}}>
                {POI_ITEMS.map(({key,show,set,color,svg,label,data})=>(
                  <button key={key} onClick={()=>{set(v=>!v);}} disabled={livePOIs.loading}
                    style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",border:"none",borderBottom:"1px solid #f1f5f9",background:show?`${color}12`:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:show?color:"#374151",textAlign:"left"}}>
                    <span style={{width:22,height:22,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <BmPoiSvg path={svg}/>
                    </span>
                    {label}
                    {livePOIs.fetched&&<span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8",fontWeight:600}}>{data.length}</span>}
                  </button>
                ))}
              </div>
            )}
          </>}
          {/* M'y rendre : toujours visible sur mobile, indépendant des POI */}
          <a href={navLink} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,textDecoration:"none",background:"#6366f1",color:"#fff",fontSize:11,fontWeight:700,whiteSpace:"nowrap",marginLeft:"auto"}}>
            <Navigation size={11} strokeWidth={2.5}/> M'y rendre
          </a>
        </div>

        {/* Desktop: M'y rendre dans le header */}
        <a className="bm-nav-desktop" href={navLink} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 18px",borderRadius:20,textDecoration:"none",background:"#6366f1",color:"#fff",fontSize:13,fontWeight:700,boxShadow:"0 2px 8px rgba(99,102,241,.3)",whiteSpace:"nowrap"}}>
          <Navigation size={14} strokeWidth={2.5}/> M'y rendre
        </a>
      </div>

      {/* Map container */}
      <div ref={ref} style={{flex:1,minHeight:0,position:"relative"}}/>
    </div>
  );
}
