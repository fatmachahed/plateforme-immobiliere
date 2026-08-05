import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import API_URL, { fmtDevise, fmtPriceApprox } from '../config';
import {
  useIsInCompare, toggleCompare as toggleCompareStore,
} from "../utils/compareStore";

function fmtM2(prix, surfaceTotale) {
  if (!surfaceTotale || surfaceTotale <= 0 || !prix || prix <= 0) return null;
  const v = Math.ceil((Number(prix) / Number(surfaceTotale)) * 10) / 10;
  if (v <= 0) return null;
  return v.toLocaleString("fr-TN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
import { useParams, useNavigate, Link } from "react-router-dom";
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
  MessageCircle, Info, Send, X, Flag
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import Seo from "../components/Seo";
import { useToast } from "../components/Toast";
import { useLanguage } from "../contexts/LanguageContext";
import { getEvalLevel, statsKey, getPrixM2, getSurfaceTotale } from "../utils/priceEval";


/* -- Haversine distance in km -- */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
    + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/* DEMO fallback for non-API annonces */
const DEMO = [
  { id:1, titre:"Villa 4 chambres — La Marsa", prix:850000, devise:"TND", location:"La Marsa, Tunis", beds:4, baths:3, area:320, type:"Villa", categorie:"Vente", etat:"Bon état", annee:2018, description:"Magnifique villa moderne de 320 m² avec jardins aménagés, piscine et double garage. Finitions haut de gamme, cuisine équipée, salon américain et vue dégagée.", features:["Jardin","Piscine","Garage","Terrasse","Cuisine équipée","Climatisation","Sécurité"], lat:36.879, lng:10.325, images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6d338c45?w=900&q=80"], contact:{nom:"Ahmed Ben Salem",tel:"+216 55 123 456",email:"ahmed@immo.tn"} },
  { id:2, titre:"Appartement S+3 — Lac 2", prix:320000, devise:"TND", location:"Berges du Lac, Tunis", beds:3, baths:2, area:145, type:"Appartement", categorie:"Vente", etat:"Neuf", annee:2023, description:"Appartement neuf S+3 dans résidence sécurisée avec ascenseur et parking. Lumineux, vue sur le lac.", features:["Ascenseur","Parking","Gardien","Double vitrage"], lat:36.838, lng:10.235, images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80"], contact:{nom:"Sonia Trabelsi",tel:"+216 22 987 654",email:"sonia@immo.tn"} },
  { id:3, titre:"Terrain résidentiel — Sousse", prix:180000, devise:"TND", location:"Sousse Nord", beds:null, baths:null, area:500, type:"Terrain", categorie:"Vente", etat:"Viabilisé", annee:null, description:"Terrain résidentiel de 500 m² dans lotissement autorisé. Toutes viabilisations réalisées.", features:["Titre foncier","Viabilisé","Raccordé ONAS"], lat:35.828, lng:10.636, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80"], contact:{nom:"Mohamed Gharbi",tel:"+216 98 456 789",email:"m.gharbi@terrain.tn"} },
  { id:4, titre:"Appartement meublé — Hammamet", prix:1800, devise:"TND/mois", location:"Hammamet Centre", beds:2, baths:1, area:85, type:"Appartement", categorie:"Location", etat:"Meublé", annee:2015, description:"Appartement S+2 entièrement meublé à 5 min de la plage. Tout équipé.", features:["Meublé","Climatisation","Wifi","Balcon"], lat:36.400, lng:10.620, images:["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=900&q=80"], contact:{nom:"Karim Chaabane",tel:"+216 71 234 567",email:"karim@immo.tn"} },
  { id:5, titre:"Villa avec piscine — Gammarth", prix:1200000, devise:"TND", location:"Gammarth", beds:5, baths:4, area:420, type:"Villa", categorie:"Vente", etat:"Excellent état", annee:2020, description:"Villa de luxe R+1 avec piscine chauffée, jardin 800 m², 5 chambres.", features:["Piscine chauffée","Jardin 800m²","Gardien 24h"], lat:36.903, lng:10.299, images:["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&q=80"], contact:{nom:"Agence Prestige Immo",tel:"+216 71 800 900",email:"contact@prestige.tn"} },
  { id:6, titre:"Duplex — Ennasr", prix:290000, devise:"TND", location:"Ennasr, Ariana", beds:3, baths:2, area:165, type:"Appartement", categorie:"Vente", etat:"Bon état", annee:2016, description:"Beau duplex S+3 de 165 m² avec terrasse 40 m².", features:["Terrasse 40m²","Ascenseur","Cuisine équipée"], lat:36.860, lng:10.195, images:["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80"], contact:{nom:"Nadia Hajri",tel:"+216 29 111 222",email:"nadia@immo.tn"} },
];

const TYPE_FR  = { appartement:"Appartement", duplex:"Duplex", penthouse:"Penthouse", villa:"Villa", maison:"Maison", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", garage_parking:"Garage / Parking", depot_stockage:"Dépôt de stockage", batiment_industriel:"Bâtiment industriel", immobiliers_divers:"Immobiliers divers" };
const CAT_FR   = { vente:"Achat", location:"Location", vacances:"Vacances" };
const ETAT_FR  = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"À rénover", cours_construction:"En construction" };

/* "2027-06" -> "Juin 2027" */
function fmtMoisAnnee(ym) {
  if (!ym) return null;
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function normalizeApi(a) {
  const loc = [a.localite, a.delegation, a.gouvernorat].filter(Boolean).join(", ");
  return {
    id:          a.id,
    titre:       a.titre,
    prix:        a.prix,
    devise:      a.devise,
    location:    loc || "Tunisie",
    /* adresse détaillée */
    address:     a.address     || null,
    gouvernorat: a.gouvernorat || null,
    delegation:  a.delegation  || null,
    localite:    a.localite    || null,
    beds:        a.nb_chambres,
    baths:       a.nb_salles_bain,
    area:        a.superficie,
    type:        TYPE_FR[a.type_bien] || a.type_bien,
    categorie:   CAT_FR[a.categorie] || a.categorie,
    etat:        ETAT_FR[a.etat_bien] || a.etat_bien || null,
    annee:       a.annee_construction,
    description: a.description || "Aucune description disponible.",
    features:    a.features || [],
    lat:         a.latitude  || 36.8065,
    lng:         a.longitude || 10.1815,
    images:      (a.images || []).length > 0
      ? (a.images || []).map(img => img.startsWith("http") ? img : `${API_URL}${img}`)
      : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"],
    surface_jardin: a.surface_jardin || 0,
    etat_bien_raw: a.etat_bien || null,
    livraison_prevue: a.livraison_prevue || null,
    anonyme: a.anonyme || false,
    contact: {
      nom:   a.user?.username     || "Propriétaire",
      tel:   a.user?.phone_number || "",
      tels:  [...new Set([a.user?.phone_number, ...(a.user?.phone_numbers || [])].filter(Boolean))],
      email: a.user?.email        || "",
    },
    publisher_role:    a.user?.role            || null,
    publisher_picture: a.user?.profile_picture || null,
    fromApi: true,
    utilisateur_id: a.user?.id,
    views_count: a.views_count || 0,
    type_bien_raw:       a.type_bien,
    gouvernorat_raw:     a.gouvernorat,
    categorie_raw:       a.categorie,
    delegation_raw:      a.delegation,
    /* -- Champs sub-type -- */
    type_appartement:    a.type_appartement    || null,
    type_villa:          a.type_villa          || null,
    type_terrain:        a.type_terrain        || null,
    type_option_villa:   a.type_option_villa   || null,
    etage:               a.etage               != null ? a.etage : null,
    titre_foncier:       a.titre_foncier       || null,
    terrain_viabilise:   a.terrain_viabilise   || false,
    exclusivite:         a.exclusivite         || false,
    hauteur_immeuble:     a.hauteur_immeuble     || null,
    nb_appartements:      a.nb_appartements      || null,
    orientation_immeuble: a.orientation_immeuble || null,
    emplacement_garage:   a.emplacement_garage   || null,
    reference:            a.reference            || null,
    nb_pieces:           a.nb_pieces           != null ? a.nb_pieces : null,
    annee_construction:  a.annee_construction  || null,
    duree_type:          a.duree_type          || null,
    duree_valeur:        a.duree_valeur        || null,
    colocation:          a.colocation          || false,
    places_totales:      a.places_totales      || null,
    places_occupees:     a.places_occupees     || null,
    profil_coloc:        a.profil_coloc        || null,
    genre_coloc:         Array.isArray(a.genre_coloc) ? a.genre_coloc : (a.genre_coloc ? a.genre_coloc.split(",").filter(Boolean) : []),
    chambres_colocation: a.chambres_colocation || [],
  };
}

/* ─── Carousel (identique à CartePage / AgentProfile) ─── */
const _arrowBtnStyle = (s) => ({
  position:"absolute", top:"50%", transform:"translateY(-50%)", [s]:8,
  width:27, height:27, borderRadius:"50%", background:"rgba(255,255,255,.45)",
  backdropFilter:"blur(4px)", border:"none", cursor:"pointer",
  display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 1px 4px rgba(0,0,0,.15)", color:"#fff", zIndex:4,
});
function NearbyCarousel({ images, h = 190 }) {
  const [idx, setIdx]     = React.useState(0);
  const [prev2, setPrev2] = React.useState(null);
  const [dir, setDir]     = React.useState(1);
  const [anim, setAnim]   = React.useState(false);
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
          animation:`ncCarouselOut${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards`, zIndex:1,
        }}/>
      )}
      <img key={idx} src={images[idx]} alt="" style={{
        position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
        animation: prev2 !== null ? `ncCarouselIn${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards` : "none",
        zIndex:2,
      }} loading="lazy"/>
      <div style={{ position:"absolute", inset:0, zIndex:3, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
        <span style={{ fontSize:18, fontWeight:900, letterSpacing:"-0.5px", fontFamily:"Arial,sans-serif",
          color:"rgba(255,255,255,0.22)", textShadow:"0 1px 3px rgba(0,0,0,0.18)", userSelect:"none", transform:"rotate(-15deg)" }}>
          LOCAL<span style={{color:"rgba(99,102,241,0.30)"}}>IZI</span>.TN
        </span>
      </div>
      {images.length > 1 && <>
        <button onClick={e=>go(e,-1)} style={_arrowBtnStyle("left")}><ChevronLeft size={14}/></button>
        <button onClick={e=>go(e,+1)} style={_arrowBtnStyle("right")}><ChevronRight size={14}/></button>
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

/* ─── NearbyCard — même style exact que PropCard de AgentProfile/CartePage ─── */
function NearbyCard({ a, navigate }) {
  const realId = String(a.id);
  const img = a.image_principale
    ? (a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`)
    : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=75";
  const images = [img];
  const cat = a.categorie || "vente";
  const joursEcoules = a.date_creation ? Math.floor((Date.now() - new Date(a.date_creation)) / 86_400_000) : null;
  const ageLabel = joursEcoules === 0 ? "Aujourd'hui" : joursEcoules === 1 ? "il y a 1 j." : joursEcoules != null ? `il y a ${joursEcoules} j.` : null;

  const [isFav, setIsFav] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_favs")||"[]").some(id => String(id) === realId); } catch { return false; }
  });
  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    const wasOn = isFav; setIsFav(!wasOn);
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

  return (
    <div className="pc" onClick={() => { navigate(`/annonce/${realId}`); window.scrollTo(0,0); }}>
      <div style={{ position:"relative" }}>
        <NearbyCarousel images={images} h={190}/>
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
              <span className="pc__devise"> {fmtDevise(a.devise)}{cat === "location" ? " /mois" : ""}</span>
            </p>
            <p className="pc__title">{a.titre}</p>
          </div>
          <button className={`pc__fav${isFav ? " pc__fav--on" : ""}`} onClick={toggleFav} title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}>
            <Heart size={14} fill={isFav ? "#ef4444" : "none"}/>
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

export default function AnnonceDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [prop,      setProp]      = useState(null);
  const [rawData,   setRawData]   = useState(null);
  const [govMarketStats, setGovMarketStats] = useState({});
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [contactForm,  setContactForm]  = useState({ nom:"", email:"", telephone:"", message:"" });
  const [contactSent,  setContactSent]  = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [imgIdx,    setImgIdx]    = useState(0);
  const [showPhone,    setShowPhone]    = useState(false);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [isFavori,   setIsFavori]   = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [nearby,    setNearby]    = useState([]);
  const [translated, setTranslated] = useState("");
  const [translating, setTranslating] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [featsExpanded, setFeatsExpanded] = useState(false);
  const [wasViewed, setWasViewed] = useState(false);
  const [satisfaction, setSatisfaction] = useState(null);
  const [ratingAvg, setRatingAvg] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);

  const token    = localStorage.getItem("token");
  const userData = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const { lang, t } = useLanguage();

  /* Stats marché prix/m² — même source que la carte/le profil agent, pour
     garantir la même évaluation partout (voir utils/priceEval.js). */
  useEffect(() => {
    fetch(`${API_URL}/annonces/market-stats`)
      .then(r => r.ok ? r.json() : {})
      .then(setGovMarketStats)
      .catch(() => {});
  }, []);

  /* Fetch annonce from API, fall back to DEMO */
  useEffect(() => {
    setLoading(true);
    setImgIdx(0);
    fetch(`${API_URL}/annonces/${id}/detail`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setRawData(data);
          setProp(normalizeApi(data));
          // Track "Consulté"
          try {
            const viewed = JSON.parse(localStorage.getItem("localizi_viewed")||"[]");
            setWasViewed(viewed.includes(String(id)));
            if (!viewed.includes(String(id))) {
              localStorage.setItem("localizi_viewed", JSON.stringify([...viewed.slice(-199), String(id)]));
            }
          } catch {}
          // Load saved satisfaction rating
          const sat = localStorage.getItem(`localizi_sat_${id}`);
          if (sat) setSatisfaction(Number(sat));
          // Load global rating from API data
          if (data.rating_avg) setRatingAvg(data.rating_avg);
          if (data.rating_count) setRatingCount(data.rating_count || 0);
        } else {
          const demo = DEMO.find(p => p.id === Number(id));
          setProp(demo || null);
        }
      })
      .catch(() => {
        const demo = DEMO.find(p => p.id === Number(id));
        setProp(demo || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* Lightbox keyboard navigation */
  useEffect(() => {
    if (lightboxIdx === null || !prop) return;
    const handler = e => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx(i => (i+1) % prop.images.length);
      if (e.key === "ArrowLeft")  setLightboxIdx(i => (i-1+prop.images.length) % prop.images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, prop]);

  /* Fetch nearby annonces — même type_bien + même gouvernorat */
  useEffect(() => {
    if (!prop) return;
    setNearby([]);
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
      })
      .catch(() => {});
  }, [prop, id]);

  /* Comparateur : état centralisé (utils/compareStore.js), partagé avec toutes les interfaces */
  const isInCompare  = useIsInCompare(id);

  /* Check if already saved */
  useEffect(() => {
    if (!token || !prop?.fromApi) return;
    fetch(`${API_URL}/users/me/favoris`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setIsFavori(data.some(f => f.id === Number(id)));
      })
      .catch(() => {});
  }, [token, id, prop?.fromApi]);

  const handleToggleFavori = async () => {
    if (!token) {
      toast("Connectez-vous pour sauvegarder cette annonce.", "error");
      return;
    }
    if (!prop?.fromApi) {
      toast("Les annonces de démonstration ne peuvent pas être sauvegardées.", "error");
      return;
    }
    setFavLoading(true);
    try {
      if (isFavori) {
        await fetch(`${API_URL}/users/me/favoris/${id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavori(false);
        toast("Retiré des favoris.");
      } else {
        await fetch(`${API_URL}/users/me/favoris/${id}`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavori(true);
        toast("Annonce sauvegardée dans vos favoris !");
      }
    } catch {
      toast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setFavLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (translating) return;
    if (translated) { setTranslated(""); return; } // toggle off
    setTranslating(true);
    try {
      const text = prop.description || "";
      /* Translate in the direction opposite to current site language */
      const pair = lang === "fr" ? "fr|en" : "en|fr";
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`
      );
      const data = await res.json();
      setTranslated(data?.responseData?.translatedText || "");
    } catch {
      toast(lang === "fr" ? "Traduction impossible pour l'instant." : "Translation unavailable right now.", "error");
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-root">
        <Navbar />
        <div className="ad-loading"><Loader size={32} className="ad-spin" /><p>Chargement…</p></div>
      </div>
    );
  }

  if (!prop) {
    return (
      <div className="ad-root">
        <Navbar />
        <div className="ad-not-found">
          <Home size={48} strokeWidth={1} />
          <p>Annonce introuvable.</p>
          <button className="ad-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Retour
          </button>
        </div>
      </div>
    );
  }

  const images = prop.images?.length > 0 ? prop.images : ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=900&q=80"];
  const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx(i => (i + 1) % images.length);

  const isOwner = userData && prop.utilisateur_id && userData.id === prop.utilisateur_id;

  const seoTitle = `${prop.titre} – ${prop.location}${prop.prix ? ` – ${Number(prop.prix).toLocaleString("fr-TN")} ${prop.devise||"TND"}` : ""}`;
  const seoDesc = (prop.description || "").slice(0, 155) ||
    `${prop.type||"Bien"} ${prop.categorie? prop.categorie.toLowerCase():""} à ${prop.location}, ${prop.area?`${prop.area} m²`:""} sur Localizi.tn.`;

  return (
    <div className="ad-root">
      <Seo
        title={seoTitle}
        description={seoDesc}
        path={`/annonce/${prop.id}`}
        image={images[0]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: prop.titre,
          description: seoDesc,
          image: images,
          offers: {
            "@type": "Offer",
            price: prop.prix || undefined,
            priceCurrency: prop.devise || "TND",
            availability: "https://schema.org/InStock",
          },
          address: { "@type": "PostalAddress", addressLocality: prop.location, addressCountry: "TN" },
        }}
      />
      <Navbar />

      {/* Le comparateur (aperçu + tableau complet) est désormais une popup
          globale unique, montée dans App.jsx — se déclenche automatiquement
          dès 2 biens ajoutés, quelle que soit la page. */}

      {/* Top bar */}
      <div className="ad-topbar">
        <button className="ad-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Retour
        </button>
        <div className="ad-topbar__actions">
          {isOwner && (
            <Link to={`/modifier_annonce/${prop.id}`} className="ad-action">
              <CheckCircle size={15} /> Modifier
            </Link>
          )}
          <button
            className={`ad-action${isFavori ? " ad-action--liked" : ""}`}
            onClick={handleToggleFavori}
            disabled={favLoading}
          >
            <Heart size={15} fill={isFavori ? "currentColor" : "none"} />
            {isFavori ? "Sauvegardé" : "Sauvegarder"}
          </button>
          <button className={`ad-action${isInCompare ? " ad-action--liked" : ""}`} onClick={() => {
            const result = toggleCompareStore({
              id: prop.id, titre: prop.titre, prix: prop.prix, devise: prop.devise,
              image: prop.images?.[0] || null, gouvernorat: prop.gouvernorat, delegation: prop.delegation,
            });
            if (result.maxReached) { toast("Maximum 4 annonces. Retirez-en une pour ajouter celle-ci.", "error"); return; }
            toast(result.added ? "Ajouté au comparateur !" : "Retiré du comparateur.");
          }}>
            <GitCompare size={15}/> {isInCompare ? "Dans le comparateur" : "Comparer"}
          </button>
          <button className="ad-action" onClick={() => {
            const url = window.location.href;
            try {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => toast("Lien copié !")).catch(() => {
                  const el = document.createElement("textarea");
                  el.value = url; el.style.cssText = "position:fixed;opacity:0";
                  document.body.appendChild(el); el.select();
                  document.execCommand("copy"); document.body.removeChild(el);
                  toast("Lien copié !");
                });
              } else {
                const el = document.createElement("textarea");
                el.value = url; el.style.cssText = "position:fixed;opacity:0";
                document.body.appendChild(el); el.select();
                document.execCommand("copy"); document.body.removeChild(el);
                toast("Lien copié !");
              }
            } catch { toast("Lien : " + url); }
          }}>
            <Share2 size={15} /> Partager
          </button>
        </div>
      </div>

      {/* ── Galerie fixe 60/40 — 3 cadres invariants ── */}
      <div style={{width:"100%",height:500,minHeight:500,maxHeight:500,flexShrink:0,overflow:"hidden",background:"#0f172a",display:"grid",gridTemplateColumns:"60% 40%",gap:3}}>

        {/* ── Cadre principal (gauche) ── */}
        <div style={{position:"relative",width:"100%",height:"100%",overflow:"hidden"}}>
          <img src={images[imgIdx]} alt={prop.titre}
            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
          {/* Badge consulté */}
          {wasViewed && (
            <span style={{position:"absolute",top:14,left:14,zIndex:5,background:"rgba(15,23,42,.75)",backdropFilter:"blur(6px)",color:"#fff",fontSize:11,fontWeight:800,padding:"4px 11px",borderRadius:20,display:"flex",alignItems:"center",gap:5,letterSpacing:".08em",textTransform:"uppercase",pointerEvents:"none"}}>
              <Eye size={12}/> Consulté
            </span>
          )}
          {/* Flèche gauche — discrète */}
          <button
            style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",zIndex:6,width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.55)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.85)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.55)"}
            onClick={e=>{e.stopPropagation();prevImg();}}>
            <ChevronLeft size={17} color="#fff" strokeWidth={2.5}/>
          </button>
          {/* Flèche droite — discrète */}
          <button
            style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",zIndex:6,width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.55)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.85)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.55)"}
            onClick={e=>{e.stopPropagation();nextImg();}}>
            <ChevronRight size={17} color="#fff" strokeWidth={2.5}/>
          </button>
          {/* Compteur — bas droite */}
          <span style={{position:"absolute",bottom:12,right:12,zIndex:6,background:"rgba(15,23,42,.58)",backdropFilter:"blur(4px)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,pointerEvents:"none"}}>
            {imgIdx+1} / {images.length}
          </span>
          {/* Zone cliquable pour le lightbox */}
          <div style={{position:"absolute",inset:0,zIndex:4,cursor:"zoom-in"}} onClick={() => setLightboxIdx(imgIdx)}/>
        </div>

        {/* ── Colonne droite : 2 cadres empilés (40%) ── */}
        <div style={{display:"grid",gridTemplateRows:"50% 50%",gap:3,height:"100%"}}>
          {/* Cadre haut */}
          <div style={{position:"relative",width:"100%",height:"100%",overflow:"hidden",cursor:"zoom-in"}}
            onClick={() => setLightboxIdx((imgIdx+1) % images.length)}>
            <img src={images[(imgIdx+1) % images.length]} alt=""
              style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          </div>
          {/* Cadre bas — avec bouton "voir toutes les photos" */}
          <div style={{position:"relative",width:"100%",height:"100%",overflow:"hidden",cursor:"zoom-in"}}
            onClick={() => setLightboxIdx((imgIdx+2) % images.length)}>
            <img src={images[(imgIdx+2) % images.length]} alt=""
              style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
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

      <div className="ad-body">
        {/* Left column */}
        <div className="ad-left">

          {/* Prix grand sous les photos */}
          <div style={{
            display:"flex", alignItems:"baseline", gap:20, flexWrap:"wrap",
            padding:"18px 0 16px", borderBottom:"1.5px solid #f1f5f9", marginBottom:20,
          }}>
            <div style={{fontSize:38,fontWeight:900,color:"#0f172a",letterSpacing:"-.02em",lineHeight:1}}>
              {Number(prop.prix).toLocaleString("fr-TN")}
              <span style={{fontSize:20,fontWeight:600,color:"#64748b",marginLeft:8}}>{fmtDevise(prop.devise)}</span>
              {prop.categorie === "location" && <span style={{fontSize:16,fontWeight:500,color:"#94a3b8",marginLeft:4}}>/mois</span>}
              {prop.categorie === "vacances" && prop.duree_type && <span style={{fontSize:16,fontWeight:500,color:"#94a3b8",marginLeft:4}}>/{prop.duree_type === "nuit" ? "nuitée" : prop.duree_type === "semaine" ? "sem." : prop.duree_type === "mois" ? "mois" : "an"}</span>}
            </div>
            {prop.area > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                <span style={{fontSize:18,fontWeight:700,color:"#475569"}}>
                  {fmtM2(prop.prix, getSurfaceTotale(prop))} <span style={{fontSize:14,color:"#94a3b8"}}>{fmtDevise(prop.devise)}/m²</span>
                </span>
                <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Prix au m²</span>
              </div>
            )}
            {prop.prix && (() => {
              const approx = fmtPriceApprox(prop.prix, prop.devise);
              return approx ? (
                <span style={{fontSize:13,color:"#94a3b8",fontWeight:500,alignSelf:"flex-end"}}>{approx}</span>
              ) : null;
            })()}
          </div>

          {/* Colocation widget */}
          {prop.colocation && prop.places_totales != null && (
            <div style={{
              background:"linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%)",
              border:"1.5px solid #c7d2fe", borderRadius:16, padding:"20px 24px", marginBottom:24,
            }}>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Users size={18} color="#fff" strokeWidth={2}/>
                  </div>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:"#3730a3"}}>Colocation disponible</div>
                    {prop.profil_coloc && prop.profil_coloc !== "tous" && (
                      <div style={{fontSize:12,color:"#6366f1",fontWeight:600,marginTop:1}}>
                        Profil : {prop.profil_coloc === "etudiant" ? "Étudiant(e)s" : prop.profil_coloc === "professionnel" ? "Professionnels" : prop.profil_coloc === "famille" ? "Familles" : "Peu importe"}
                      </div>
                    )}
                  </div>
                </div>
                {/* Genre badge */}
                {(() => {
                  const g = prop.genre_coloc || [];
                  const both = g.includes("homme") && g.includes("femme");
                  const menOnly = g.includes("homme") && !g.includes("femme");
                  const femOnly = g.includes("femme") && !g.includes("homme");
                  if (!g.length) return null;
                  return (
                    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,
                      padding:"5px 12px",borderRadius:20,
                      background: both ? "#f0fdf4" : menOnly ? "#eff6ff" : "#fdf2f8",
                      color: both ? "#15803d" : menOnly ? "#1d4ed8" : "#9d174d",
                      border: `1.5px solid ${both ? "#bbf7d0" : menOnly ? "#bfdbfe" : "#fbcfe8"}`,
                    }}>
                      {both ? <>♂ ♀ Mixte</> : menOnly ? <>♂ Hommes</> : <>♀ Femmes</>}
                    </span>
                  );
                })()}
              </div>

              {/* Table chambres */}
              {prop.chambres_colocation && prop.chambres_colocation.length > 0 ? (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{background:"#e0e7ff"}}>
                        {["Chambre","Capacité","Occupées","Disponibles","Prix/place"].map(h => (
                          <th key={h} style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color:"#3730a3",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prop.chambres_colocation.map((ch, i) => {
                        const dispo = Math.max(0, (ch.capacite||1) - (ch.places_occupees||0));
                        return (
                          <tr key={i} style={{background: i%2===0 ? "#f5f3ff" : "#fff", borderBottom:"1px solid #e0e7ff"}}>
                            <td style={{padding:"7px 10px",textAlign:"center",fontWeight:600,color:"#4338ca"}}>Ch. {ch.numero_chambre || i+1}</td>
                            <td style={{padding:"7px 10px",textAlign:"center"}}>{ch.capacite || 1}</td>
                            <td style={{padding:"7px 10px",textAlign:"center",color: (ch.places_occupees||0)>0 ? "#dc2626" : "#64748b"}}>{ch.places_occupees || 0}</td>
                            <td style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color: dispo>0 ? "#16a34a" : "#dc2626"}}>{dispo}</td>
                            <td style={{padding:"7px 10px",textAlign:"center",fontWeight:600,color:"#6366f1"}}>
                              {ch.prix_par_place > 0 ? `${Number(ch.prix_par_place).toLocaleString("fr-TN")} TND` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const totCap = prop.chambres_colocation.reduce((s,c)=>s+(c.capacite||1),0);
                        const totOcc = prop.chambres_colocation.reduce((s,c)=>s+(c.places_occupees||0),0);
                        const totDispo = Math.max(0, totCap - totOcc);
                        return (
                          <tr style={{background:"#e0e7ff",fontWeight:800,color:"#3730a3"}}>
                            <td style={{padding:"7px 10px",textAlign:"center"}}>Total</td>
                            <td style={{padding:"7px 10px",textAlign:"center"}}>{totCap}</td>
                            <td style={{padding:"7px 10px",textAlign:"center",color:"#dc2626"}}>{totOcc}</td>
                            <td style={{padding:"7px 10px",textAlign:"center",color: totDispo>0?"#16a34a":"#dc2626"}}>{totDispo}</td>
                            <td style={{padding:"7px 10px",textAlign:"center"}}>—</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              ) : (
                /* Fallback: progress bar si pas de détail chambre */
                (() => {
                  const tot = prop.places_totales || 1;
                  const occ = prop.places_occupees || 0;
                  const dispo = Math.max(0, tot - occ);
                  const pct = Math.round((occ / tot) * 100);
                  return (
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:13,color:"#4338ca",fontWeight:600}}>{dispo} place{dispo!==1?"s":""} disponible{dispo!==1?"s":""}</span>
                        <span style={{fontSize:12,color:"#6366f1"}}>{occ}/{tot} occupée{occ!==1?"s":""}</span>
                      </div>
                      <div style={{height:8,borderRadius:99,background:"#c7d2fe",overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:"#6366f1",borderRadius:99,transition:"width .4s"}}/>
                      </div>
                    </>
                  );
                })()
              )}
            </div>
          )}

          {/* Description */}
          <div className="ad-section">
            <div className="ad-section__header">
              <h2 className="ad-section__title">{t("ad_description")}</h2>
              <button className="ad-translate-btn" onClick={handleTranslate} disabled={translating}>
                {translating
                  ? <Loader size={13} className="ad-spin"/>
                  : <Languages size={13}/>
                }
                {translated ? t("ad_original") : t("ad_translate")}
              </button>
            </div>
            {(() => {
              const DESC_LIMIT = 420;
              const descText = translated || prop.description;
              const longDesc = descText.length > DESC_LIMIT;
              return (
                <>
                  <p className="ad-desc" style={{fontSize:16,lineHeight:1.85,margin:0}}>
                    {descExpanded || !longDesc ? descText : descText.slice(0, DESC_LIMIT) + "…"}
                  </p>
                  {longDesc && (
                    <button onClick={() => setDescExpanded(p => !p)} style={{
                      marginTop:10, background:"none", border:"none", cursor:"pointer",
                      color:"#4f46e5", fontWeight:700, fontSize:14,
                      display:"flex", alignItems:"center", gap:4, padding:0,
                    }}>
                      {descExpanded
                        ? <><ChevronLeft size={15} style={{transform:"rotate(90deg)"}}/> Voir moins</>
                        : <>Voir plus <ChevronRight size={15}/></>}
                    </button>
                  )}
                </>
              );
            })()}
            {translated && (
              <p className="ad-translated-note">🌐 Traduit automatiquement · <button onClick={()=>setTranslated("")} className="ad-translated-reset">Voir l'original</button></p>
            )}
          </div>

          {/* Features */}
          {prop.features?.length > 0 && (() => {
            /* Mapping label ? icône (même icônes que dans CreerAnnonce) */
            const FEAT_ICONS = {
              "Vue sur mer":       Waves,        "Vue sur montagne":      Mountain,
              "Vue sur forêt":         TreePine,     "Jardin":            Fence,
              "Terrasse":          Sun,          "Balcon":            Flower2,
              "Piscine":           Droplets,     "Parking":           ParkingCircle,
              "Ascenseur":         ArrowUpDown,  "Garage":            Car,
              "Cellier": Package,      "Meublé":            Sofa,
              "Concierge":         Users,        "Gardien":           ShieldCheck,
              "Animaux admis":     Heart,        "Cuisine équipée":   UtensilsCrossed,
              "Climatisation":     Wind,         "Chauffage central": Thermometer,
              "Cheminée":          Flame,        "Double vitrage":    DoorClosed,
              "Porte blindée":     LockKeyhole,  "Sécurité":          Fingerprint,
              "Internet":          Wifi,         "TV":                Monitor,
              "Machine à laver":   RefreshCw,    "Digicode":          KeyRound,
              "Interphone":        PhoneCall,    "Relié ONAS":        Droplets,
              "Salon américain":   Monitor,      "Fibre optique":     Wifi,
            };
            const FEAT_LIMIT = 9;
            const longFeats = prop.features.length > FEAT_LIMIT;
            const shownFeats = featsExpanded || !longFeats ? prop.features : prop.features.slice(0, FEAT_LIMIT);
            return (
              <div className="ad-section" style={{marginTop:32}}>
                <h2 className="ad-section__title">Caractéristiques du bien</h2>
                <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px"}}>
                  {shownFeats.map(f => {
                    const Ico = FEAT_ICONS[f] || CheckCircle;
                    return (
                      <div key={f} style={{
                        display:"flex", alignItems:"center", gap:12,
                        padding:"15px 18px", borderRadius:12,
                        background:"#f8fafc", border:"1.5px solid #e5e7eb",
                        fontSize:15, fontWeight:600, color:"#1e293b",
                      }}>
                        <Ico size={22} strokeWidth={1.6} style={{color:"#4f46e5",flexShrink:0}}/>
                        {f}
                      </div>
                    );
                  })}
                </div>
                {longFeats && (
                  <button onClick={() => setFeatsExpanded(p => !p)} style={{
                    marginTop:14, background:"none", border:"none", cursor:"pointer",
                    color:"#4f46e5", fontWeight:700, fontSize:14,
                    display:"flex", alignItems:"center", gap:4, padding:0,
                  }}>
                    {featsExpanded
                      ? <><ChevronLeft size={15} style={{transform:"rotate(90deg)"}}/> Voir moins</>
                      : <>Voir les {prop.features.length - FEAT_LIMIT} autres caractéristiques <ChevronRight size={15}/></>}
                  </button>
                )}
              </div>
            );
          })()}

        </div>

        {/* Right column */}
        <div className="ad-right">
          <div className="ad-card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
              <span className={`ad-card__cat ad-card__cat--${prop.categorie?.toLowerCase()}`}>{prop.categorie}</span>
              {prop.reference && (
                <span style={{fontSize:11.5,fontWeight:700,color:"#64748b",background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"3px 10px",borderRadius:999,letterSpacing:".04em"}}>
                  Réf : {prop.reference}
                </span>
              )}
            </div>
            <h1 className="ad-card__titre">{prop.titre}</h1>
            {/* -- Adresse complète -- */}
            <div className="ad-addr">
              {prop.address && (
                <p className="ad-addr__street">
                  <MapPin size={13} className="ad-addr__ico"/>
                  {prop.address}
                </p>
              )}
              <div className="ad-addr__hier">
                {prop.localite    && <span className="ad-addr__chip ad-addr__chip--loc">{prop.localite}</span>}
                {prop.localite    && prop.delegation && <span className="ad-addr__sep">›</span>}
                {prop.delegation  && <span className="ad-addr__chip ad-addr__chip--del">{prop.delegation}</span>}
                {(prop.delegation || prop.localite) && prop.gouvernorat && <span className="ad-addr__sep">›</span>}
                {prop.gouvernorat && <span className="ad-addr__chip ad-addr__chip--gov">{prop.gouvernorat}</span>}
                {!prop.gouvernorat && !prop.delegation && !prop.localite && !prop.address && (
                  <span style={{color:"#9ca3af",fontSize:13}}><MapPin size={12}/> {prop.location}</span>
                )}
              </div>
            </div>


            <div className="ad-specs">
              {prop.beds  != null && <div className="ad-spec"><Bed size={16}/><p className="ad-spec__val">{prop.beds}</p><p className="ad-spec__lbl">Chambres</p></div>}
              {prop.baths != null && <div className="ad-spec"><Bath size={16}/><p className="ad-spec__val">{prop.baths}</p><p className="ad-spec__lbl">Sdb</p></div>}
              {prop.area  &&         <div className="ad-spec"><Maximize size={16}/><p className="ad-spec__val">{prop.area}</p><p className="ad-spec__lbl">m²</p></div>}
            </div>

            <div className="ad-meta">
              <div className="ad-meta__item"><Tag size={13}/> <span>Type :</span> {prop.type}</div>
              {prop.etat  && <div className="ad-meta__item"><CheckCircle size={13}/><span>État :</span> {prop.etat}</div>}
              {prop.etat_bien_raw === "cours_construction" && prop.livraison_prevue && (
                <div className="ad-meta__item"><Calendar size={13}/><span>Livraison prévue :</span> {fmtMoisAnnee(prop.livraison_prevue)}</div>
              )}
              {prop.annee && <div className="ad-meta__item"><Calendar size={13}/><span>Année :</span> {prop.annee}</div>}

              {/* -- Appartement -- */}
              {prop.type_appartement && <div className="ad-meta__item"><Layers size={13}/><span>Logement :</span> {prop.type_appartement.toUpperCase()}</div>}
              {prop.etage != null && <div className="ad-meta__item"><ChevronsUp size={13}/><span>Étage :</span> {prop.etage === 0 ? "RDC" : `${prop.etage}e étage`}</div>}

              {/* -- Villa -- */}
              {prop.type_villa && <div className="ad-meta__item"><Home size={13}/><span>Villa :</span> {prop.type_villa.toUpperCase()}</div>}
              {prop.type_option_villa && <div className="ad-meta__item"><Star size={13}/><span>Options :</span> {prop.type_option_villa.replace(/,/g,", ")}</div>}

              {/* -- Terrain -- */}
              {prop.type_terrain && <div className="ad-meta__item"><Ruler size={13}/><span>Terrain :</span> {prop.type_terrain.replace(/_/g," ")}</div>}
              {prop.terrain_viabilise && <div className="ad-meta__item"><CheckCircle size={13}/><span>Viabilisé</span></div>}
              {prop.titre_foncier && prop.titre_foncier !== "aucun" && <div className="ad-meta__item"><Tag size={13}/><span>Titre foncier :</span> {prop.titre_foncier}</div>}

              {/* -- Immeuble -- */}
              {prop.hauteur_immeuble    && <div className="ad-meta__item"><Building2 size={13}/><span>Hauteur :</span> {prop.hauteur_immeuble}</div>}
              {prop.nb_appartements     && <div className="ad-meta__item"><Building2 size={13}/><span>Appartements :</span> {prop.nb_appartements}</div>}
              {prop.orientation_immeuble && <div className="ad-meta__item"><Compass size={13}/><span>Orientation :</span> {prop.orientation_immeuble.replace(/_/g," ")}</div>}

              {/* -- Garage/Parking -- */}
              {prop.emplacement_garage && <div className="ad-meta__item"><Car size={13}/><span>Emplacement :</span> {prop.emplacement_garage.replace(/_/g," ")}</div>}

              {/* -- Pièces -- */}
              {prop.nb_pieces != null && prop.nb_pieces > 0 && <div className="ad-meta__item"><Package size={13}/><span>Pièces :</span> {prop.nb_pieces}</div>}

              {/* -- Exclusivité -- */}
              {prop.exclusivite && <div className="ad-meta__item" style={{color:"#7c3aed"}}><Star size={13}/><span>Exclusivité</span></div>}
              {/* -- Badge publieur -- */}
              {!prop.anonyme && prop.publisher_role && (() => {
                const roleMap = {
                  particulier: { label:"Particulier", color:"#6366f1", bg:"#eef2ff", Ico: Home },
                  agence:      { label:"Agence / Agent", color:"#0369a1", bg:"#e0f2fe", Ico: Building2 },
                  promoteur:   { label:"Promoteur",   color:"#7c3aed", bg:"#ede9fe", Ico: BadgeCheck },
                  professionnel:{ label:"Professionnel", color:"#15803d", bg:"#dcfce7", Ico: BadgeCheck },
                };
                const r = roleMap[prop.publisher_role] || { label: prop.publisher_role, color:"#64748b", bg:"#f1f5f9", Ico: Home };
                const { label, color, bg, Ico } = r;
                return (
                  <div className="ad-meta__item">
                    <Ico size={13} style={{color}}/>
                    <span>Publié par :</span>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:4,
                      background:bg, color, padding:"2px 10px", borderRadius:999,
                      fontSize:12, fontWeight:700,
                    }}>{label}</span>
                  </div>
                );
              })()}
            </div>

            <div className="ad-divider" />

            {/* -- Bloc contact Phase 1 -- */}
            <div className="ad-contact-box">
              {/* -- Helper : résout n'importe quelle URL de photo -- */}
              {(() => {
                const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                /* Priorité : photo retournée par l'API > photo du compte si owner */
                const rawUrl  = prop.publisher_picture || (isOwner ? storedUser?.profile_picture : null);
                /* data: et http/https ? usage direct ; chemin relatif ? préfixer API_URL */
                const resolveUrl = url =>
                  !url ? null
                  : (url.startsWith("data:") || url.startsWith("http")) ? url
                  : `${API_URL}${url}`;
                const photoUrl  = resolveUrl(rawUrl);
                const initiale  = (prop.contact.nom||"?")[0].toUpperCase();
                const role      = prop.publisher_role;

                const roleLabels = {
                  particulier:   "Particulier",
                  agence:        "Agence / Agent",
                  promoteur:     "Promoteur",
                  professionnel: "Professionnel",
                  partenaire:    "Partenaire",
                  admin:         "Administrateur",
                };

                /* -- Anonyme -- */
                if (prop.anonyme) return (
                  <div className="ad-contact-box__header">
                    <div style={{
                      width:44, height:44, borderRadius:"50%",
                      background:"linear-gradient(135deg,#94a3b8,#64748b)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      flexShrink:0, border:"2px solid #e2e8f0",
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="ad-contact-box__name">Membre anonyme</div>
                      <div className="ad-contact-box__role">Identité masquée · Publication anonyme</div>
                    </div>
                  </div>
                );

                /* -- Agence / Promoteur : logo en grand -- */
                if (role === "agence" || role === "promoteur") {
                  const isAgence  = role === "agence";
                  const clr       = isAgence ? "#0369a1" : "#7c3aed";
                  const bg        = isAgence ? "#e0f2fe"  : "#ede9fe";
                  const bgGrad    = isAgence
                    ? "linear-gradient(135deg,#0369a1,#0ea5e9)"
                    : "linear-gradient(135deg,#7c3aed,#a855f7)";
                  return (
                    <div style={{
                      background:"#f8fafc", borderRadius:14,
                      padding:"16px 18px", marginBottom:4,
                      border:`1.5px solid ${bg}`,
                    }}>
                      <div className="ad-contact-box__name" style={{marginBottom:3}}>{prop.contact.nom}</div>
                      <div className="ad-contact-box__role">Professionnel de l'immobilier</div>
                      {/* Logo en grand */}
                      <div style={{marginTop:18, textAlign:"center"}}>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="Logo"
                            style={{
                              width:"100%", maxHeight:150, objectFit:"contain",
                              borderRadius:12, border:`1.5px solid ${bg}`,
                              background:"#fff", padding:10,
                            }}
                          />
                        ) : (
                          <div style={{
                            width:"100%", height:110, borderRadius:12,
                            background:bgGrad,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:52, fontWeight:900, color:"#fff",
                          }}>{initiale}</div>
                        )}
                      </div>
                    </div>
                  );
                }

                /* -- Particulier (et autres rôles) : avatar rond -- */
                return (
                  <div className="ad-contact-box__header">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="avatar"
                        style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e2e8f0"}}
                      />
                    ) : (
                      <div className="ad-contact-box__avatar">{initiale}</div>
                    )}
                    <div>
                      <div className="ad-contact-box__name">{prop.contact.nom}</div>
                      <div className="ad-contact-box__role">
                        {roleLabels[role] || "Propriétaire"}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* -- Vues (visible au propriétaire seulement) -- */}
              {isOwner && prop.views_count > 0 && (
                <div className="ad-views-row">
                  <Eye size={14}/> <span>{prop.views_count} vue{prop.views_count > 1 ? "s" : ""}</span>
                </div>
              )}

              {/* -- Contact : logique anonyme stricte -- */}
              {prop.anonyme ? (
                /* ANONYME — tout le monde voit ce bloc, y compris l'owner (pour preview) */
                <div style={{marginTop:16}}>
                  {isOwner && (
                    <div style={{
                      background:"#fffbeb", border:"1px solid #fde68a", borderRadius:9,
                      padding:"9px 13px", fontSize:12.5, color:"#92400e", marginBottom:12,
                      lineHeight:1.5
                    }}>
                      👁️ Votre annonce est publiée <strong>anonymement</strong>.<br/>Les visiteurs ne voient pas vos coordonnées.
                    </div>
                  )}
                  {!isOwner && (
                    <>
                      <button
                        onClick={() => {
                          /* Pré-remplir avec les infos du compte connecté */
                          const u = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                          if (u) setContactForm(f => ({
                            ...f,
                            nom:       f.nom       || u.username     || "",
                            telephone: f.telephone || u.phone_number || "",
                            email:     f.email     || u.email        || "",
                          }));
                          setShowContactModal(true);
                        }}
                        style={{
                          width:"100%", padding:"13px 16px", borderRadius:11, border:"none",
                          background:"linear-gradient(135deg,#6366f1,#818cf8)", color:"#fff",
                          fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:8
                        }}
                      >
                        <MessageCircle size={16} strokeWidth={2.5}/> Contacter le propriétaire
                      </button>
                      <p style={{fontSize:11.5, color:"#94a3b8", textAlign:"center", marginTop:8}}>
                        Laissez vos coordonnées — le propriétaire vous contactera s'il est intéressé.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                /* -- NON-ANONYME : coordonnées toujours visibles, connecté ou non -- */
                <div className="ad-contact-box__btns">
                  {prop.contact.tel && (
                    <>
                      <button onClick={()=>setShowCallModal(true)} className="ad-cbtn ad-cbtn--call">
                        <Phone size={15}/> Appeler
                      </button>
                      <a
                        href={`https://wa.me/${prop.contact.tel.replace(/[\s+]/g,"").replace(/^00/,"")}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce "${prop.titre}" sur Localizi.tn.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="ad-cbtn ad-cbtn--whatsapp"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.549 4.112 1.51 5.845L.057 23.617a.5.5 0 00.611.65l5.975-1.566A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.893 9.893 0 01-5.048-1.38l-.361-.215-3.745.982.999-3.648-.235-.374A9.861 9.861 0 012.106 12C2.106 6.527 6.527 2.106 12 2.106S21.894 6.527 21.894 12 17.473 21.894 12 21.894z"/></svg>
                        WhatsApp
                      </a>
                    </>
                  )}
                  {prop.contact.email && (
                    <a href={`mailto:${prop.contact.email}?subject=${encodeURIComponent(`Annonce "${prop.titre}" — Localizi.tn`)}&body=${encodeURIComponent(`Bonjour,\n\nJe suis intéressé(e) par votre annonce "${prop.titre}".\n\nCordialement`)}`}
                      className="ad-cbtn ad-cbtn--mail">
                      <Mail size={15}/> Envoyer un e-mail
                    </a>
                  )}
                </div>
              ) /* fin ternaire anonyme/non-anonyme */ }
            </div>
          </div>

        </div>
      </div>

      {/* -- Position / Emplacement du bien — pleine largeur -- */}
      <div style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"18px 28px 14px",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",gap:10}}>
            <MapPin size={16} strokeWidth={2} style={{color:"#6366f1"}}/>
            <span style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Position / Emplacement du bien</span>
          </div>
          <div style={{height:440}}>
            <BigMap lat={prop.lat} lng={prop.lng} />
          </div>
        </div>
      </div>

      {/* -- Rapport qualité / prix — pleine largeur --
          Même moteur d'évaluation que la carte / le profil agent
          (utils/priceEval.js, médiane par gouvernorat+délégation+
          catégorie+état, jardin inclus dans la surface) — pour ne plus
          afficher une évaluation différente d'une page à l'autre. */}
      {(() => {
        const prixM2 = getPrixM2(prop);
        if (!prixM2) return null;
        const gs = govMarketStats?.[statsKey({
          gouvernorat: prop.gouvernorat, delegation: prop.delegation,
          type_bien: prop.type_bien_raw,
          categorie: prop.categorie_raw, etat_bien: prop.etat_bien_raw,
          duree_type: prop.duree_type,
        })] || null;
        const ev = getEvalLevel(prixM2, gs?.median_prix_m2, gs?.count);
        if (ev.key === "none") return null;
        return (
          <div style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"18px 28px 14px",borderBottom:"1px solid #e5e7eb"}}>
                <span style={{fontSize:15,fontWeight:800,color:"#0f172a",letterSpacing:"-.01em"}}>Rapport qualité / prix</span>
              </div>
              <div style={{padding:"24px 28px"}}>
                <div style={{display:"flex",gap:8,marginBottom:20}}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{height:12,flex:1,borderRadius:8,background:i<=ev.segs?ev.color:"#e5e7eb",transition:"all .4s"}}/>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                  <div style={{fontSize:20,fontWeight:800,color:ev.color,background:`${ev.color}1a`,padding:"7px 22px",borderRadius:20}}>
                    {ev.label}
                  </div>
                  <div style={{fontSize:13,color:"#6b7280",fontWeight:500}}>Basé sur {gs.count} bien{gs.count>1?"s":""} dans le même secteur</div>
                </div>
                <p style={{margin:"14px 0 0",fontSize:13,color:"#374151",lineHeight:1.6}}>
                  Le prix au m² de cette annonce est comparé aux biens similaires dans le même secteur géographique.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* -- Satisfaction widget — pleine largeur -- */}
      <div style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
        <div style={{background:"linear-gradient(135deg,#f8faff,#eef2ff)",borderRadius:16,padding:"32px 40px",border:"1.5px solid #e0e7ff"}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:6}}>
              À quel point êtes-vous satisfait de cette annonce ?
            </div>
            <div style={{fontSize:13,color:"#94a3b8"}}>Votre avis nous aide à améliorer l'expérience</div>
          </div>
          {/* Note globale */}
          {ratingCount > 0 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}>
              <div style={{display:"flex",gap:2}}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{fontSize:16,opacity: s <= Math.round(ratingAvg||0) ? 1 : 0.25}}>⭐</span>
                ))}
              </div>
              <span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{(ratingAvg||0).toFixed(1)}</span>
              <span style={{fontSize:12,color:"#94a3b8"}}>({ratingCount} avis)</span>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
            {[
              {emoji:"😞",label:"Très insatisfait",val:1},
              {emoji:"😕",label:"Insatisfait",val:2},
              {emoji:"😐",label:"Neutre",val:3},
              {emoji:"😊",label:"Satisfait",val:4},
              {emoji:"😄",label:"Très satisfait",val:5},
            ].map(({emoji,label,val}) => (
              <button key={val} onClick={() => {
                setSatisfaction(val);
                localStorage.setItem(`localizi_sat_${id}`, String(val));
                // Générer une session_key anonyme stable par navigateur
                let sk = localStorage.getItem("localizi_sk");
                if (!sk) { sk = Math.random().toString(36).slice(2)+Date.now(); localStorage.setItem("localizi_sk", sk); }
                fetch(`${API_URL}/annonces/${id}/reaction`, {
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  body: JSON.stringify({ session_key: sk, note: val })
                }).then(r => r.ok ? r.json() : null).then(d => {
                  if (d) { setRatingAvg(d.rating_avg); setRatingCount(d.rating_count); }
                }).catch(()=>{});
              }} title={label} style={{
                background:satisfaction===val?"#eef2ff":"#fff",
                border:satisfaction===val?"2px solid #6366f1":"2px solid #e5e7eb",
                borderRadius:14, padding:"14px 18px", cursor:"pointer",
                transform:satisfaction===val?"scale(1.12)":"scale(1)",
                transition:"all .22s cubic-bezier(.34,1.56,.64,1)",
                display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                minWidth:80, boxShadow:satisfaction===val?"0 4px 14px rgba(99,102,241,.2)":"none",
              }}>
                <span style={{fontSize:32}}>{emoji}</span>
                <span style={{fontSize:11,color:satisfaction===val?"#6366f1":"#94a3b8",fontWeight:700,lineHeight:1.2,textAlign:"center"}}>{label}</span>
              </button>
            ))}
          </div>
          {satisfaction && (
            <p style={{fontSize:13,color:"#6366f1",fontWeight:700,textAlign:"center",marginTop:16,marginBottom:0}}>
              Merci pour votre retour ! 🎉
            </p>
          )}
        </div>
      </div>

      {/* -- Signaler annonce — pleine largeur -- */}
      <div style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 24px"}}>
        <div style={{background:"#fff",border:"1px solid #fecaca",borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"18px 28px 14px",borderBottom:"1px solid #fecaca",display:"flex",alignItems:"center",gap:10}}>
            <Flag size={15} color="#ef4444"/>
            <span style={{fontSize:15,fontWeight:800,color:"#dc2626",letterSpacing:"-.01em"}}>Signaler cette annonce</span>
          </div>
          <div style={{padding:"18px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <p style={{margin:0,fontSize:13,color:"#374151",lineHeight:1.6}}>
                Vous pensez que cette annonce est frauduleuse, trompeuse ou ne respecte pas nos conditions d'utilisation ?<br/>
                Signalez-la et notre équipe l'examinera dans les plus brefs délais.
              </p>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {prop.id && <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>Identifiant :</span><span style={{fontWeight:700,color:"#111827",fontFamily:"monospace",fontSize:12,background:"#f3f4f6",padding:"2px 8px",borderRadius:6}}>#{prop.id}</span></div>}
                {prop.reference && <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>Référence :</span><span style={{fontWeight:700,color:"#111827",fontFamily:"monospace",fontSize:12,background:"#f3f4f6",padding:"2px 8px",borderRadius:6}}>{prop.reference}</span></div>}
              </div>
            </div>
            <button
              onClick={() => {
                const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                navigate("/signaler-probleme", { state: { lienAnnonce: window.location.href, reference: prop.reference||null, type:"Annonce frauduleuse ou trompeuse", nom: storedUser?.username||storedUser?.nom||"", email: storedUser?.email||"" }});
              }}
              style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,background:"#ef4444",color:"#fff",border:"none",cursor:"pointer",padding:"11px 24px",borderRadius:10,fontSize:13.5,fontWeight:700,fontFamily:"inherit",transition:"background .15s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.background="#dc2626"}
              onMouseLeave={e=>e.currentTarget.style.background="#ef4444"}
            >
              <Flag size={15} color="#fff"/> Signaler l'annonce
            </button>
          </div>
        </div>
      </div>

      {/* -- Nearby recommendations -- */}
      {nearby.length > 0 && (
        <div className="ad-nearby">
          <div className="ad-nearby__head">
            <Navigation size={18} className="ad-nearby__ico"/>
            <h2 className="ad-nearby__title">{t("ad_nearby")}</h2>
          </div>
          <div className="ad-nearby__scroll">
            {nearby.map(a => <NearbyCard key={a.id} a={a} navigate={navigate}/>)}
          </div>
        </div>
      )}

      {/* -- Breadcrumb navigation -- */}
      {(() => {
        const TYPE_PLURAL = {
          appartement:"Appartements", duplex:"Duplex", penthouse:"Penthouses", villa:"Villas", villa_maison:"Villas / Maisons",
          bureau:"Bureaux", local_commercial:"Locaux commerciaux", terrain:"Terrains",
          ferme_agricole:"Fermes agricoles", ferme:"Fermes agricoles",
          immeuble:"Immeubles", garage_parking:"Garages / Parkings",
          depot_stockage:"Dépôts / Stockages", batiment_industriel:"Bâtiments industriels", immobiliers_divers:"Biens divers",
        };
        const CAT_ACTION = { vente:"à vendre", location:"à louer", vacances:"en vacances" };
        const typeFr  = TYPE_PLURAL[prop.type_bien] || "Biens";
        const catFr   = CAT_ACTION[prop.categorie]  || "";
        const crumbs  = [
          { label:"Immobilier",                           href:"/" },
          { label:`${typeFr} ${catFr} en Tunisie`,        href:`/carte?categorie=${prop.categorie}` },
          prop.gouvernorat && { label: prop.gouvernorat,  href:`/carte?gouvernorat=${encodeURIComponent(prop.gouvernorat)}&categorie=${prop.categorie}` },
          prop.delegation  && { label: prop.delegation,   href:`/carte?delegation=${encodeURIComponent(prop.delegation)}&categorie=${prop.categorie}` },
          { label: prop.titre || "Annonce" },
        ].filter(Boolean);
        return (
          <nav style={{maxWidth:1200,margin:"8px auto 32px",padding:"0 24px"}} aria-label="fil d'Ariane">
            <ol style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"4px 0",listStyle:"none",padding:0,margin:0}}>
              {crumbs.map((c, i) => (
                <li key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                  {i > 0 && <span style={{color:"#94a3b8",fontSize:13,margin:"0 4px"}}>›</span>}
                  {c.href ? (
                    <Link to={c.href} style={{
                      fontSize:13, color:"#6366f1", fontWeight:600,
                      textDecoration:"none", transition:"color .15s",
                    }}
                    onMouseEnter={e=>e.target.style.textDecoration="underline"}
                    onMouseLeave={e=>e.target.style.textDecoration="none"}
                    >{c.label}</Link>
                  ) : (
                    <span style={{fontSize:13,color:"#64748b",fontWeight:500}}>{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        );
      })()}


      <Footer />

      {/* Lightbox */}
      {lightboxIdx !== null && prop && ReactDOM.createPortal(
        <div
          style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button onClick={() => setLightboxIdx(null)}
            style={{position:"absolute",top:18,right:22,background:"rgba(255,255,255,.12)",border:"none",borderRadius:99,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",zIndex:2}}>
            <X size={22}/>
          </button>
          {/* Counter */}
          <span style={{position:"absolute",top:22,left:"50%",transform:"translateX(-50%)",color:"rgba(255,255,255,.8)",fontSize:13,fontWeight:600,letterSpacing:".06em",pointerEvents:"none"}}>
            {lightboxIdx+1} / {prop.images.length}
          </span>
          {/* Image */}
          <img
            src={prop.images[lightboxIdx]}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:8,boxShadow:"0 8px 48px rgba(0,0,0,.5)",userSelect:"none"}}
          />
          {/* Arrows */}
          {prop.images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i-1+prop.images.length)%prop.images.length); }}
                style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.12)",border:"none",borderRadius:99,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                <ChevronLeft size={26}/>
              </button>
              <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i+1)%prop.images.length); }}
                style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.12)",border:"none",borderRadius:99,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                <ChevronRight size={26}/>
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        .ad-root { min-height:100vh; background:#f9fafb; font-family:'Poppins',system-ui,sans-serif; font-size:11.5px; display:flex; flex-direction:column; }
        .ad-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; gap:16px; color:#94a3b8; font-size:15px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .ad-spin { animation: spin 1s linear infinite; }
        .ad-topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 24px; background:#fff; border-bottom:1px solid #e5e7eb;
          position:sticky; top:64px; z-index:30;
        }
        .ad-back { display:flex; align-items:center; gap:6px; font-size:13px; color:#6b7280; font-family:inherit; transition:color .15s; }
        .ad-back:hover { color:#111; }
        .ad-topbar__actions { display:flex; gap:8px; }
        .ad-action {
          display:flex; align-items:center; gap:6px;
          padding:7px 14px; border:1px solid #e5e7eb;
          border-radius:6px; font-size:13px; color:#6b7280;
          background:#fff; font-family:inherit; cursor:pointer; transition:all .15s; text-decoration:none;
        }
        .ad-action:hover { border-color:#9ca3af; color:#111; }
        .ad-action--liked { color:#6366f1; border-color:#6366f1; background:#eef2ff; }
        .ad-body {
          display:grid; grid-template-columns:1fr 360px; gap:24px;
          max-width:1200px; margin:24px auto; padding:0 24px 48px;
        }
        .ad-gallery { margin-bottom:24px; }
        .ad-gallery__main { position:relative; border-radius:10px; overflow:hidden; background:#e5e7eb; }
        .ad-gallery__img { width:100%; height:440px; object-fit:cover; display:block; animation:fadeIn .2s ease; }
        .ad-gallery__btn {
          position:absolute; top:50%; transform:translateY(-50%);
          width:36px; height:36px; border-radius:50%;
          background:rgba(255,255,255,.9); color:#374151;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.12); transition:background .15s;
        }
        .ad-gallery__btn:hover { background:#fff; }
        .ad-gallery__btn--l { left:12px; }
        .ad-gallery__btn--r { right:12px; }
        .ad-gallery__counter { position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,.45); color:#fff; padding:3px 10px; border-radius:20px; font-size:12px; }
        .ad-gallery__thumbs { display:flex; gap:8px; margin-top:8px; overflow-x:auto; padding-bottom:4px; }
        .ad-gallery__thumb { width:80px; height:60px; object-fit:cover; border-radius:6px; border:2px solid transparent; cursor:pointer; flex-shrink:0; opacity:.65; transition:all .15s; }
        .ad-gallery__thumb--on { border-color:#6366f1; opacity:1; }
        .ad-gallery__thumb:hover { opacity:1; }
        .ad-section { margin-bottom:24px; }
        .ad-section__title { font-size:20px; font-weight:800; color:#0f172a; margin-bottom:14px; }
        .ad-desc { font-family:'Poppins',system-ui,sans-serif; font-size:12px; color:#4b5563; line-height:1.8; text-align:justify; }
        .ad-features { display:flex; flex-wrap:wrap; gap:8px; }
        .ad-feature { display:flex; align-items:center; gap:6px; padding:6px 12px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:6px; font-size:13px; color:#374151; }
        .ad-feature svg { color:#6366f1; }
        .ad-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:24px; margin-bottom:16px; }
        .ad-card__cat { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:12px; color:#fff; }
        .ad-card__cat--achat    { background:#166534; }
        .ad-card__cat--location { background:#1e40af; }
        .ad-card__cat--vacances { background:#854d0e; }
        .ad-card__titre { font-size:22px; font-weight:800; color:#111; line-height:1.3; margin-bottom:8px; }
        /* --- Bloc adresse hiérarchique --- */
        .ad-addr { margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; }
        .ad-addr__street {
          display: flex; align-items: flex-start; gap: 5px;
          font-size: 13px; color: #374151; font-weight: 500; line-height: 1.4;
        }
        .ad-addr__ico { color: #6366f1; flex-shrink: 0; margin-top: 1px; }
        .ad-addr__hier {
          display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
        }
        .ad-addr__chip {
          display: inline-flex; align-items: center;
          padding: 3px 9px; border-radius: 20px;
          font-size: 11.5px; font-weight: 600; line-height: 1;
        }
        /* Hiérarchie : couleur unique grise/neutre pour homogénéité */
        .ad-addr__chip--loc { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .ad-addr__chip--del { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .ad-addr__chip--gov { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .ad-addr__sep { font-size: 13px; color: #d1d5db; font-weight: 400; }
        .ad-card__price { font-size:28px; font-weight:900; color:#111; margin-bottom:16px; }
        .ad-card__price span { font-size:14px; font-weight:400; color:#9ca3af; }
        .ad-specs { display:flex; gap:0; margin-bottom:20px; }
        .ad-spec { flex:1; text-align:center; padding:16px 10px; border:1px solid #e5e7eb; border-radius:10px; margin-right:8px; }
        .ad-spec:last-child { margin-right:0; }
        .ad-spec svg { color:#6366f1; margin:0 auto 6px; }
        .ad-spec__val { font-size:22px; font-weight:800; color:#111; }
        .ad-spec__lbl { font-size:12.5px; color:#9ca3af; margin-top:2px; font-weight:500; }
        .ad-meta { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }
        .ad-meta__item { display:flex; align-items:center; gap:9px; font-size:14px; color:#374151; }
        .ad-meta__item svg { color:#6366f1; flex-shrink:0; }
        .ad-meta__item span { font-weight:600; color:#6b7280; }
        .ad-divider { height:1px; background:#f3f4f6; margin:16px 0; }
        /* -- Bloc contact Phase 1 -- */
        .ad-contact-box {
          border: 1.5px solid #e5e7eb; border-radius: 14px;
          overflow: hidden; background: #fff;
        }
        .ad-contact-box__header {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 18px; background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }
        .ad-contact-box__avatar {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff; font-size: 18px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .ad-contact-box__name { font-size: 16px; font-weight: 700; color: #0f172a; }
        .ad-contact-box__role { font-size: 13px; color: #94a3b8; margin-top: 3px; }

        /* Buttons */
        .ad-contact-box__btns {
          display: flex; flex-direction: column; gap: 10px; padding: 18px 18px;
        }
        .ad-cbtn {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          width: 100%; padding: 14px 16px; border-radius: 11px;
          font-size: 15px; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: all .15s; text-decoration: none;
          border: none; text-align: center;
        }
        .ad-cbtn--call {
          background: #6366f1; color: #fff;
        }
        .ad-cbtn--call:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,.3); }
        .ad-cbtn__tel {
          color: #fff; text-decoration: none; font-weight: 800; font-size: 15px;
        }
        .ad-cbtn--whatsapp {
          background: #25d366; color: #fff;
        }
        .ad-cbtn--whatsapp:hover { background: #1ebe5d; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,211,102,.3); }
        .ad-cbtn--mail {
          background: #fff; color: #374151;
          border: 1.5px solid #d1d5db;
        }
        .ad-cbtn--mail:hover { border-color: #6b7280; background: #f9fafb; }

        /* Views row (owner only) */
        .ad-views-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 13.5px; color: #64748b; font-weight: 600;
          padding: 10px 18px 0;
        }

        /* Locked state */
        .ad-contact-box__locked { padding: 14px 16px; }
        .ad-contact-box__blur-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 11px 14px; margin-bottom: 6px;
          background: #f1f5f9; border: 1.5px dashed #cbd5e1;
          border-radius: 10px; cursor: pointer; text-align: left;
          transition: background .15s, border-color .15s;
          font-family: inherit;
        }
        .ad-contact-box__blur-btn:hover {
          background: #e2e8f0; border-color: #94a3b8;
        }
        .ad-contact-box__blur-num {
          flex: 1; filter: blur(4px); user-select: none; pointer-events: none;
          font-weight: 700; color: #374151; font-size: 14px; letter-spacing: .5px;
        }
        .ad-contact-box__blur-lock {
          font-size: 12px; font-weight: 700; color: #6366f1;
          white-space: nowrap; filter: none;
        }
        .ad-contact-box__lock-msg {
          text-align: center; font-size: 12.5px; color: #64748b;
          font-weight: 500; margin: 8px 0 12px; line-height: 1.5;
        }
        .ad-contact-box__auth-btns {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }
        .ad-cbtn--login {
          background: #0f172a; color: #fff; text-decoration: none;
        }
        .ad-cbtn--login:hover { background: #1e293b; }
        .ad-cbtn--register {
          background: #fff; color: #6366f1;
          border: 1.5px solid #c7d2fe;
        }
        .ad-cbtn--register:hover { background: #eef2ff; }
        .ad-map-mini { display:none; }
        .ad-not-found { text-align:center; padding:80px 24px; color:#6b7280; font-size:15px; display:flex; flex-direction:column; align-items:center; gap:16px; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @media (max-width:900px) {
          .ad-body { grid-template-columns:1fr; }
          .ad-right { order:-1; }
          .ad-gallery__img { height:280px; }
        }
        @media (max-width:560px) {
          .ad-body { padding:0 12px 32px; margin-top:12px; }
          .ad-topbar { padding:8px 12px; }
          .ad-topbar__actions { gap:4px; }
          .ad-action { padding:6px 10px; font-size:12px; }
        }

        /* --- Description header + translate --- */
        .ad-section__header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .ad-section__header .ad-section__title { margin-bottom:0; }
        .ad-translate-btn {
          display:flex; align-items:center; gap:5px;
          padding:6px 12px; border-radius:8px; font-size:12px; font-weight:600;
          border:1.5px solid #e0e7ff; background:#eef2ff; color:#4f46e5;
          cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap;
        }
        .ad-translate-btn:hover:not(:disabled) { background:#e0e7ff; }
        .ad-translate-btn:disabled { opacity:.6; cursor:not-allowed; }
        .ad-translated-note { font-size:11.5px; color:#9ca3af; margin-top:8px; }
        .ad-translated-reset { font-size:11.5px; color:#6366f1; text-decoration:underline; cursor:pointer; background:none; border:none; font-family:inherit; padding:0; }

        /* --- Nearby recommendations --- */
        .ad-nearby {
          max-width:1200px; margin:0 auto 48px; padding:0 24px;
        }
        .ad-nearby__head {
          display:flex; align-items:center; gap:10px; margin-bottom:18px;
        }
        .ad-nearby__ico { color:#6366f1; flex-shrink:0; }
        .ad-nearby__title { font-size:18px; font-weight:800; color:#0f172a; letter-spacing:-.02em; }
        .ad-nearby__scroll {
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap:16px;
        }
        /* ── Carousel animations ── */
        @keyframes ncCarouselInL  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes ncCarouselOutL { from{transform:translateX(0)} to{transform:translateX(-100%)} }
        @keyframes ncCarouselInR  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes ncCarouselOutR { from{transform:translateX(0)} to{transform:translateX(100%)} }
        /* ── PropCard classes — identiques à CartePage ── */
        .pc { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; cursor:pointer; transition:box-shadow .18s,border-color .18s,transform .12s; }
        .pc:hover { box-shadow:0 6px 20px rgba(0,0,0,.12); border-color:#94a3b8; transform:translateY(-1px); }
        .pc__cat-badge { position:absolute; top:8px; right:8px; z-index:10; padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; }
        .pc__cat-badge--vente    { background:#166534; color:#fff; }
        .pc__cat-badge--location { background:#1e40af; color:#fff; }
        .pc__cat-badge--vacances { background:#854d0e; color:#fff; }
        .pc__body  { padding:12px 14px 13px; }
        .pc__price { font-size:22px; font-weight:900; color:#0a0a0a; margin-bottom:2px; }
        .pc__devise{ font-size:13px; font-weight:500; color:#475569; margin-left:2px; }
        .pc__title { font-size:15px; color:#0a0a0a; font-weight:700; margin-bottom:5px; line-height:1.35; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .pc__loc  { display:flex; align-items:center; gap:3px; font-size:12px; color:#374151; font-weight:500; margin-bottom:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .pc__specs{ display:flex; gap:10px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9; }
        .pc__specs span { display:flex; align-items:center; gap:3px; font-size:13px; color:#1e293b; font-weight:500; }
        .pc__fav { width:28px; height:28px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#cbd5e1; background:#f1f5f9; border:none; cursor:pointer; transition:all .15s; }
        .pc__fav:hover { color:#ef4444; background:#fee2e2; }
        .pc__fav--on { color:#ef4444 !important; background:#fee2e2 !important; }

        @media (max-width:900px) {
          .ad-nearby { padding:0 16px; }
          .ad-nearby__scroll { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
        @media (max-width:600px) {
          .ad-nearby__scroll { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width:420px) {
          .ad-nearby__scroll { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* -- Modal "Appeler" : liste des numéros du propriétaire -- */}
      {showCallModal && (() => {
        const tels = prop?.contact?.tels?.length ? prop.contact.tels : [prop?.contact?.tel].filter(Boolean);
        return ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,zIndex:99999,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',system-ui,sans-serif"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowCallModal(false);}}>
          <div style={{background:"#fff",borderRadius:20,padding:"28px 28px 24px",maxWidth:420,width:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header — même style que les autres popups du site */}
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
                <a key={t} href={`tel:${t.replace(/\s/g,"")}`} className="ad-cbtn ad-cbtn--call" style={{justifyContent:"space-between"}}>
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

      {/* -- Modal contact anonyme -- */}
      {showContactModal && ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,zIndex:99999,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',system-ui,sans-serif"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowContactModal(false);}}>
          <div style={{background:"#fff",borderRadius:20,padding:"28px 28px 0",maxWidth:500,width:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header — même style que comparateur */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Logo variant="color" height={28} to={null}/>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>Contacter le propriétaire</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Le propriétaire vous recontactera directement</div>
                </div>
              </div>
              <button onClick={()=>setShowContactModal(false)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",flexShrink:0}}>
                <X size={18} strokeWidth={2.5}/>
              </button>
            </div>

            {/* Body scrollable */}
            <div style={{flex:1,overflowY:"auto",paddingBottom:28}}>
              {contactSent ? (
                <div style={{textAlign:"center",padding:"24px 0 16px"}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:"#f0fdf4",border:"2px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                    <CheckCircle size={30} color="#16a34a" strokeWidth={2}/>
                  </div>
                  <div style={{fontSize:19,fontWeight:800,color:"#0f172a",marginBottom:8}}>Demande envoyée !</div>
                  <p style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:24}}>
                    Le propriétaire de <strong>"{prop?.titre}"</strong> dispose de vos coordonnées et vous contactera prochainement.
                  </p>
                  <button onClick={()=>{setShowContactModal(false);setContactSent(false);}}
                    style={{padding:"11px 32px",borderRadius:10,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
                    Fermer
                  </button>
                </div>
              ) : (<>
                {contactError && (
                  <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,padding:"10px 14px",fontSize:13,color:"#dc2626",marginBottom:14}}>{contactError}</div>
                )}
                {[
                  {key:"nom",       label:"Votre nom *",         type:"text",     placeholder:"Prénom Nom"},
                  {key:"telephone", label:"Votre téléphone",     type:"tel",      placeholder:"+216 XX XXX XXX"},
                  {key:"email",     label:"Votre email",         type:"email",    placeholder:"vous@email.com"},
                  {key:"message",   label:"Message (optionnel)", type:"textarea", placeholder:"Décrivez votre intérêt..."},
                ].map(({key,label,type,placeholder}) => (
                  <div key={key} style={{marginBottom:13}}>
                    <label style={{fontSize:12.5,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>{label}</label>
                    {type==="textarea" ? (
                      <textarea placeholder={placeholder} value={contactForm[key]} rows={3}
                        onChange={e=>setContactForm(f=>({...f,[key]:e.target.value}))}
                        style={{width:"100%",padding:"10px 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",background:"#f8fafc",boxSizing:"border-box"}}/>
                    ) : (
                      <input type={type} placeholder={placeholder} value={contactForm[key]}
                        onChange={e=>setContactForm(f=>({...f,[key]:e.target.value}))}
                        style={{width:"100%",padding:"11px 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                    )}
                  </div>
                ))}
                <p style={{fontSize:12,color:"#94a3b8",marginBottom:16,display:"flex",alignItems:"center",gap:5}}>
                  <Info size={13} strokeWidth={2} style={{flexShrink:0}}/>
                  Renseignez au moins votre téléphone ou votre email pour être contacté.
                </p>
                <button
                  disabled={contactLoading||!contactForm.nom.trim()||(!contactForm.telephone&&!contactForm.email)}
                  onClick={async()=>{
                    setContactLoading(true); setContactError("");
                    try {
                      const res = await fetch(`${API_URL}/annonces/${prop.id}/contact-request`,{
                        method:"POST",headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({nom:contactForm.nom.trim(),telephone:contactForm.telephone.trim()||null,email:contactForm.email.trim()||null,message:contactForm.message.trim()||null}),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.detail||"Erreur");
                      setContactSent(true);
                    } catch(err){ setContactError(err.message||"Erreur lors de l'envoi"); }
                    finally{ setContactLoading(false); }
                  }}
                  style={{width:"100%",padding:"13px",borderRadius:11,border:"none",
                    background:contactLoading||!contactForm.nom.trim()||(!contactForm.telephone&&!contactForm.email)?"#cbd5e1":"#0f172a",
                    color:"#fff",fontSize:14,fontWeight:700,
                    cursor:contactLoading||!contactForm.nom.trim()||(!contactForm.telephone&&!contactForm.email)?"not-allowed":"pointer",
                    fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {contactLoading ? "Envoi en cours…" : <><Send size={15} strokeWidth={2.5}/> Envoyer ma demande</>}
                </button>
              </>)}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ── BigMap POI helpers ── */
const PIN_SVG_HTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48"><path d="M18 0C8.059 0 0 8.059 0 18c0 11.25 16.2 28.35 16.931 29.147a1.5 1.5 0 0 0 2.138 0C19.8 46.35 36 29.25 36 18 36 8.059 27.941 0 18 0z" fill="#6366f1"/><circle cx="18" cy="18" r="8" fill="white"/></svg>`;

const BM_SCHOOL_SVG  = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
const BM_MOSQUE_SVG  = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
const BM_FACULTY_SVG = '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>';
const BM_SURFACE_SVG = '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>';

const BM_SCHOOLS = [
  { id:"sc1",  nom:"Lycée Pilote de Tunis",        lat:36.821, lng:10.159 },
  { id:"sc2",  nom:"Collège Ibn Khaldoun",          lat:36.833, lng:10.171 },
  { id:"sc3",  nom:"École El Menzah VI",            lat:36.846, lng:10.206 },
  { id:"sc4",  nom:"Lycée Technique Ariana",        lat:36.866, lng:10.197 },
  { id:"sc5",  nom:"Collège La Soukra",             lat:36.882, lng:10.213 },
  { id:"sc6",  nom:"Lycée Habib Bourguiba Sousse",  lat:35.830, lng:10.638 },
  { id:"sc7",  nom:"École Primaire Port Kantaoui",  lat:35.892, lng:10.612 },
  { id:"sc8",  nom:"Lycée Farhat Hached Sfax",      lat:34.744, lng:10.762 },
  { id:"sc9",  nom:"Collège Ibn Sina Sfax",         lat:34.737, lng:10.756 },
  { id:"sc10", nom:"École Tahar Haddad Hammamet",   lat:36.403, lng:10.617 },
  { id:"sc11", nom:"Lycée Pilote Nabeul",           lat:36.458, lng:10.732 },
  { id:"sc12", nom:"École Erriadh Monastir",        lat:35.785, lng:10.815 },
  { id:"sc13", nom:"Collège Djerba Midoun",         lat:33.825, lng:10.885 },
  { id:"sc14", nom:"Lycée Teboulba Ben Arous",      lat:36.720, lng:10.240 },
];
const BM_MOSQUES = [
  { id:"mo1",  nom:"Mosquée Zitouna",               lat:36.798, lng:10.174 },
  { id:"mo2",  nom:"Mosquée El Fath Lac",           lat:36.840, lng:10.234 },
  { id:"mo3",  nom:"Mosquée Ennasr",                lat:36.858, lng:10.193 },
  { id:"mo4",  nom:"Mosquée Raoued",                lat:36.890, lng:10.177 },
  { id:"mo5",  nom:"Mosquée Boujemaa Sousse",       lat:35.826, lng:10.636 },
  { id:"mo6",  nom:"Mosquée Sidi Bouali Sousse",    lat:35.818, lng:10.644 },
  { id:"mo7",  nom:"Mosquée Trois Portes Sfax",     lat:34.739, lng:10.759 },
  { id:"mo8",  nom:"Mosquée Sidi Lakhmi Sfax",      lat:34.746, lng:10.767 },
  { id:"mo9",  nom:"Mosquée El Kebir Hammamet",     lat:36.397, lng:10.621 },
  { id:"mo10", nom:"Mosquée Nabeul Ville",          lat:36.452, lng:10.739 },
  { id:"mo11", nom:"Mosquée Monastir Médina",       lat:35.776, lng:10.827 },
  { id:"mo12", nom:"Mosquée Erriadh Djerba",        lat:33.833, lng:10.862 },
  { id:"mo13", nom:"Mosquée Ben Arous",             lat:36.753, lng:10.229 },
  { id:"mo14", nom:"Mosquée Kairouan Okba",         lat:35.681, lng:10.098 },
];
const BM_FACULTIES = [
  { id:"fac1",  nom:"Université Tunis El Manar",        lat:36.838, lng:10.168 },
  { id:"fac2",  nom:"Faculté des Sciences de Tunis",    lat:36.835, lng:10.172 },
  { id:"fac3",  nom:"INSAT Tunis",                      lat:36.855, lng:10.197 },
  { id:"fac4",  nom:"Université Carthage",              lat:36.870, lng:10.184 },
  { id:"fac5",  nom:"ISSAT Sousse",                     lat:35.822, lng:10.631 },
  { id:"fac6",  nom:"Faculté de Médecine Sousse",       lat:35.840, lng:10.647 },
  { id:"fac7",  nom:"Université de Sfax",               lat:34.749, lng:10.758 },
  { id:"fac8",  nom:"FSEG Sfax",                        lat:34.740, lng:10.752 },
  { id:"fac9",  nom:"IPEIM Monastir",                   lat:35.778, lng:10.826 },
  { id:"fac10", nom:"Université Manouba",               lat:36.828, lng:10.093 },
  { id:"fac11", nom:"ISG Tunis",                        lat:36.812, lng:10.147 },
  { id:"fac12", nom:"Faculté Droit Sc. Politiques",     lat:36.795, lng:10.181 },
];
const BM_SURFACES = [
  { id:"gs1",  nom:"Carrefour Lac Tunis",               lat:36.841, lng:10.237 },
  { id:"gs2",  nom:"Géant Casino Ennasr",               lat:36.859, lng:10.192 },
  { id:"gs3",  nom:"Monoprix Menzah",                   lat:36.848, lng:10.207 },
  { id:"gs4",  nom:"Carrefour Market Ariana",           lat:36.866, lng:10.199 },
  { id:"gs5",  nom:"Azur Sousse",                       lat:35.834, lng:10.641 },
  { id:"gs6",  nom:"Carrefour Market Sfax",             lat:34.741, lng:10.763 },
  { id:"gs7",  nom:"Géant Hammamet",                    lat:36.405, lng:10.624 },
  { id:"gs8",  nom:"Monoprix Centre-ville Tunis",       lat:36.803, lng:10.180 },
  { id:"gs9",  nom:"Carrefour Ben Arous",               lat:36.741, lng:10.226 },
  { id:"gs10", nom:"MG Monastir",                       lat:35.781, lng:10.831 },
];

function bmPoiIcon(L, color, svgPath) {
  return L.divIcon({
    className:"",
    html:`<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg></div>`,
    iconSize:[28,28], iconAnchor:[14,14],
  });
}

function BmPoiSvg({ path }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

function BigMap({ lat, lng }) {
  const ref        = React.useRef(null);
  const mapRef     = React.useRef(null);
  const leafletRef = React.useRef(null);
  const poiRef     = React.useRef({ schools:[], mosques:[], faculties:[], surfaces:[] });

  const [showSchools,   setShowSchools]   = React.useState(false);
  const [showMosques,   setShowMosques]   = React.useState(false);
  const [showFaculties, setShowFaculties] = React.useState(false);
  const [showSurfaces,  setShowSurfaces]  = React.useState(false);
  const [livePOIs, setLivePOIs] = React.useState({ schools:[], mosques:[], faculties:[], surfaces:[], loading:false, fetched:false });

  /* Fetch POIs from Overpass around the annonce */
  const fetchPOIs = React.useCallback(async () => {
    if (!lat || !lng) return;
    setLivePOIs(p => ({ ...p, loading:true }));
    const R = 0.12; // ~13 km radius in degrees
    const bbox = `${lat-R},${lng-R},${lat+R},${lng+R}`;
    const query =
      `[out:json][timeout:18];\n(\n` +
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
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", { method:"POST", body:query });
      const data = await res.json();
      const els = data.elements || [];
      const pt = e => ({ lat: e.type==="way"?e.center?.lat:e.lat, lng: e.type==="way"?e.center?.lon:e.lon });
      setLivePOIs({
        loading: false, fetched: true,
        schools:   els.filter(e=>e.tags?.amenity==="school").map(e=>({id:`sc_${e.id}`,nom:e.tags?.name||"École",...pt(e)})).filter(e=>e.lat&&e.lng),
        mosques:   els.filter(e=>e.tags?.amenity==="place_of_worship"&&e.tags?.religion==="muslim").map(e=>({id:`mo_${e.id}`,nom:e.tags?.name||"Mosquée",...pt(e)})).filter(e=>e.lat&&e.lng),
        faculties: els.filter(e=>e.tags?.amenity==="university"||e.tags?.amenity==="college").map(e=>({id:`fac_${e.id}`,nom:e.tags?.name||"Faculté",...pt(e)})).filter(e=>e.lat&&e.lng),
        surfaces:  els.filter(e=>e.tags?.shop&&/supermarket|mall|department_store/.test(e.tags.shop)).map(e=>({id:`gs_${e.id}`,nom:e.tags?.name||"Grande surface",...pt(e)})).filter(e=>e.lat&&e.lng),
      });
    } catch {
      setLivePOIs(p => ({ ...p, loading:false, fetched:true }));
    }
  }, [lat, lng]);

  /* Init map + fetch POIs */
  React.useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !ref.current) return;
      const map = L.map(ref.current, { zoomControl:true, dragging:true, scrollWheelZoom:false }).setView([lat,lng],15);
      mapRef.current  = map;
      leafletRef.current = L;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{attribution:"© OpenStreetMap © CARTO",maxZoom:19}).addTo(map);
      const icon = L.divIcon({ className:"", html:PIN_SVG_HTML, iconSize:[36,48], iconAnchor:[18,48] });
      L.marker([lat,lng],{icon}).addTo(map);
      setTimeout(()=>map.invalidateSize(),80);
      fetchPOIs(); // charge les POIs au démarrage
    })();
    return () => { live=false; if(mapRef.current){mapRef.current.remove();mapRef.current=null;} };
  }, [lat, lng, fetchPOIs]);

  /* Apply/remove POI markers */
  function applyPOI(key, show, data, label, color, svgPath) {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    poiRef.current[key].forEach(m => { try { m.remove(); } catch {} });
    poiRef.current[key] = [];
    if (!show) return;
    const icon = bmPoiIcon(L, color, svgPath);
    data.forEach(s => {
      try {
        const m = L.marker([s.lat, s.lng], {icon}).addTo(map).bindPopup(`<b>${label}</b><br>${s.nom||""}`);
        poiRef.current[key].push(m);
      } catch {}
    });
  }

  React.useEffect(() => { applyPOI("schools",   showSchools,   livePOIs.schools,   "École",          "#2563eb", BM_SCHOOL_SVG);  }, [showSchools,   livePOIs.schools]);
  React.useEffect(() => { applyPOI("mosques",   showMosques,   livePOIs.mosques,   "Mosquée",        "#16a34a", BM_MOSQUE_SVG);  }, [showMosques,   livePOIs.mosques]);
  React.useEffect(() => { applyPOI("faculties", showFaculties, livePOIs.faculties, "Faculté",        "#7c3aed", BM_FACULTY_SVG); }, [showFaculties, livePOIs.faculties]);
  React.useEffect(() => { applyPOI("surfaces",  showSurfaces,  livePOIs.surfaces,  "Grande surface", "#ea580c", BM_SURFACE_SVG); }, [showSurfaces,  livePOIs.surfaces]);

  const btnStyle = (active, color) => ({
    display:"flex", alignItems:"center", gap:5,
    padding:"6px 12px", borderRadius:20, border:"none", cursor:"pointer",
    fontFamily:"inherit", fontSize:12, fontWeight:700, transition:"all .15s",
    background: active ? color : "#f1f5f9",
    color: active ? "#fff" : "#64748b",
    boxShadow: active ? `0 2px 8px ${color}55` : "none",
    opacity: livePOIs.loading ? 0.6 : 1,
  });

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%"}}>
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,padding:"10px 16px",borderBottom:"1px solid #f1f5f9",background:"#fafafa"}}>
        <div style={{display:"flex", gap:6, flexWrap:"wrap", alignItems:"center"}}>
          {livePOIs.loading && <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Chargement…</span>}
          <button style={btnStyle(showSchools,   "#2563eb")} onClick={()=>setShowSchools(v=>!v)} disabled={livePOIs.loading}>
            <BmPoiSvg path={BM_SCHOOL_SVG}/> Écoles {livePOIs.fetched?`(${livePOIs.schools.length})`:""}
          </button>
          <button style={btnStyle(showMosques,   "#16a34a")} onClick={()=>setShowMosques(v=>!v)} disabled={livePOIs.loading}>
            <BmPoiSvg path={BM_MOSQUE_SVG}/> Mosquées {livePOIs.fetched?`(${livePOIs.mosques.length})`:""}
          </button>
          <button style={btnStyle(showFaculties, "#7c3aed")} onClick={()=>setShowFaculties(v=>!v)} disabled={livePOIs.loading}>
            <BmPoiSvg path={BM_FACULTY_SVG}/> Facultés {livePOIs.fetched?`(${livePOIs.faculties.length})`:""}
          </button>
          <button style={btnStyle(showSurfaces,  "#ea580c")} onClick={()=>setShowSurfaces(v=>!v)} disabled={livePOIs.loading}>
            <BmPoiSvg path={BM_SURFACE_SVG}/> Grandes surfaces {livePOIs.fetched?`(${livePOIs.surfaces.length})`:""}
          </button>
        </div>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank" rel="noopener noreferrer"
          style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 18px",borderRadius:20,textDecoration:"none",background:"#6366f1",color:"#fff",fontSize:13,fontWeight:700,boxShadow:"0 2px 8px rgba(99,102,241,.3)",whiteSpace:"nowrap"}}>
          <Navigation size={14} strokeWidth={2.5}/> M'y rendre
        </a>
      </div>
      <div ref={ref} style={{flex:1, minHeight:0}} />
    </div>
  );
}
