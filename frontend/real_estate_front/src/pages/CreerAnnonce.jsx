import React, { useState, useEffect, useRef, useCallback, useContext, createContext } from "react";
import ReactDOM from "react-dom";
import API_URL, { fmtPriceApprox } from '../config';
import { useNavigate } from "react-router-dom";
import {
  Home, Building2, MapPin, Camera, ChevronRight, ChevronLeft, Save, Layers, Crown,
  Check, X, Upload, Trash2, Eye, Bed, Bath, Maximize2, DollarSign,
  CheckCircle2, XCircle, Loader, Sparkles, Wand2,
  Minus, Plus, Navigation,
  Leaf, Store, Waves, Mountain, TreePine, Sun, Flower2,
  ArrowUpDown, Car, ParkingCircle, Package, Sofa,
  UtensilsCrossed, Wind, Thermometer, Compass, Wrench,
  HardHat, ThumbsUp, Hammer,
  Wifi, Flame, DoorClosed, ShieldCheck, Tv, PhoneCall, Users, KeyRound, Droplets, Signal, Heart, RefreshCw, Monitor, LockKeyhole, Fence, Fingerprint, Briefcase,
  Tractor, LayoutGrid, Star, Tag, Phone, Mail, Warehouse, AlertTriangle
} from "lucide-react";
import Layout from "../components/Layout";
import Logo from "../components/Logo";
import AIDescriptionModal from '../components/AIDescriptionModal';
import useLocalisation from "../hooks/useLocalisation";
import { useToast } from "../components/Toast";
import "leaflet/dist/leaflet.css";

/* ── Normalisation légère (correspondance GADM ↔ API) ── */
const _nCA = s => (s||"").normalize("NFD")
  .replace(/[̀-ͯ]/g,"")
  .toLowerCase()
  .replace(/[\u0027\u002D\u02BC\u2010-\u2015\u2018-\u2019]+/g," ")
  .replace(/\s+/g," ").trim();
const normDelCA = s => _nCA(s).replace(/^(el |la |le |les |es |bou )/,"");

/* ── Table aliases GADM → API (identique à CartePage) ── */
const GADM_DEL_ALIASES_CA = Object.fromEntries([
  ["Ariana Médina","Ariana Ville"],["Kalaat El Andalous","Kalaat Landlous"],["Soukra","La Soukra"],
  ["Boumhel","Bou Mhel El Bassatine"],["Hammam Chott","Hammam Chatt"],["M'Hamdia","Mohamadia"],
  ["Ghazala","Ghezala"],
  ["Hamma","El Hamma"],["Metouia","El Metouia"],["Ghannouch","Ghannouche"],["Matmata Nouvelle","Nouvelle Matmata"],
  ["Guetar","El Guettar"],["Ksar","El Ksar"],["Mdhilla","El Mdhilla"],["Sened","Sned"],
  ["Balta Bou Aouane","Balta Bou Aouene"],["Bousalem","Bou Salem"],["Jendouba Nord","Jendouba"],["Jendouba Sud","Jendouba"],
  ["Bouhajla","Bou Hajla"],["Chrarda","Cherarda"],["Alaa","El Ala"],
  ["Ayoun","El Ayoun"],["Hidra","Haidra"],["Hassi El Ferid","Hassi El Frid"],["Jedeliane","Jediliane"],["Majel Belabbes","Mejel Bel Abbes"],
  ["Faouar","El Faouar"],["Souk El Ahed","Souk El Ahad"],
  ["Ksour","El Ksour"],["Kalaa Khesba","Kalaa El Khasba"],["Kalaat Senan","Kalaat Sinane"],["Kef Est","Le Kef Est"],["Kef Ouest","Le Kef Ouest"],["Es Sers","Le Sers"],["Tajerouine","Touiref"],["Nebeur","Touiref"],
  ["Boumerdès","Bou Merdes"],["Boumerdes","Bou Merdes"],["Chebba","La Chebba"],["Ksour Essef","Ksour Essaf"],["Ouled Chamekh","Ouled Chamakh"],["Sidi Alouane","Sidi Alouene"],
  ["Manouba","Mannouba"],
  ["Djerba Ajim","Ajim"],["Houmt Souk","Houmet Essouk"],["Djerba Midoun","Midoun"],
  ["Jammel","Jemmal"],["Ksar Hellal","Ksar Helal"],["Sayada-Lamta-Bou Hjar","Sayada Lamta Bou Hajar"],
  ["Dar Chaabane El Fehri","Dar Chaabane Elfehri"],["Haouaria","El Haouaria"],["Hammam Ghezaz","Hammam El Ghezaz"],
  ["Hencha","El Hencha"],["Skhira","Esskhira"],["El Ghraiba","Ghraiba"],["Kerkennah","Kerkenah"],["Mahres","Mahras"],["Sfax Médina","Sfax Ville"],["Sfax Medina","Sfax Ville"],
  ["Bir El Hfay","Bir El Haffey"],["Jelma","Jilma"],["Sabalat Ouled Asker","Cebbala"],["Meknassi","Maknassy"],["Mazzouna","Mezzouna"],["Sidi Ali Ben Aoun","Ben Oun"],
  ["Bouarada","Bou Arada"],["Laroussa","El Aroussa"],["El Krib","Le Krib"],["Bourouis","Sidi Bou Rouis"],["Rouhia","Rohia"],
  ["Zriba","Hammam Zriba"],
].map(([k,v]) => [_nCA(k), _nCA(v)]));
const GADM_DEL_ALIASES_CA_REV = Object.fromEntries(Object.entries(GADM_DEL_ALIASES_CA).map(([k,v])=>[v,k]));
const matchDelCA = (gadmName, apiName) => {
  if (!apiName) return false;
  const ng = _nCA(gadmName), na = _nCA(apiName);
  return ng === na || normDelCA(ng) === normDelCA(na) ||
         GADM_DEL_ALIASES_CA[ng] === na || GADM_DEL_ALIASES_CA_REV[na] === ng;
};

/* ── Cache GeoJSON (gouvernorats + délégations) ── */
const CA_GOV_CACHE = { data: null };
const CA_DEL_CACHE = { data: null };
async function loadCaGeo(path, cache) {
  if (cache.data) return cache.data;
  const r = await fetch(path);
  cache.data = await r.json();
  return cache.data;
}

/* ── Point-in-polygon (ray casting, coords GeoJSON [lng,lat]) ── */
function _pip(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
}
function pointInFeatureCA(lat, lng, feature) {
  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") return _pip(lat, lng, coordinates[0]);
  if (type === "MultiPolygon") return coordinates.some(p => _pip(lat, lng, p[0]));
  return false;
}

/* ── Distance point → segment (en degrés, approximation plane) ── */
function _distToSeg(lat, lng, lat1, lng1, lat2, lng2) {
  const dx = lat2 - lat1, dy = lng2 - lng1;
  if (dx === 0 && dy === 0) return Math.hypot(lat - lat1, lng - lng1);
  const t = Math.max(0, Math.min(1, ((lat - lat1) * dx + (lng - lng1) * dy) / (dx*dx + dy*dy)));
  return Math.hypot(lat - lat1 - t * dx, lng - lng1 - t * dy);
}
function _distToRing(lat, lng, ring) {
  let d = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const s = _distToSeg(lat, lng, ring[j][1], ring[j][0], ring[i][1], ring[i][0]);
    if (s < d) d = s;
  }
  return d;
}
/* Retourne 'inside' | 'tolerance' | 'blocked'
   TOLERANCE_DEG ≈ 0.07° ≈ 7 km — zone grise permissive */
const TOLERANCE_DEG = 0.07;
function zoneStatus(lat, lng, features) {
  if (!features.length) return null;
  const inside = features.some(f => pointInFeatureCA(lat, lng, f));
  if (inside) return 'inside';
  /* Distance minimale au bord de toutes les features */
  let minDist = Infinity;
  for (const f of features) {
    const { type, coordinates } = f.geometry;
    const rings = type === "Polygon" ? [coordinates[0]] : coordinates.map(p => p[0]);
    for (const ring of rings) {
      const d = _distToRing(lat, lng, ring);
      if (d < minDist) minDist = d;
    }
  }
  return minDist <= TOLERANCE_DEG ? 'tolerance' : 'blocked';
}

/* -- Bannière accompagnement -- */
function AccompagnementBanner() {
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem("ca_accom_dismissed") !== "1"; } catch { return true; }
  });
  const [answered, setAnswered] = useState(false);

  if (!visible || answered) return null;

  return (
    <div className="ca-accom">
      <div className="ca-accom__icon"><Sparkles size={18}/></div>
      <div className="ca-accom__body">
        <p className="ca-accom__q">Avez-vous besoin d'un accompagnement ?</p>
        <p className="ca-accom__sub">Notre équipe peut vous aider à rédiger, valoriser et accélérer la publication de votre annonce.</p>
        <div className="ca-accom__btns">
          <a href="mailto:contact@localizi.tn?subject=Demande d'accompagnement publication annonce"
            className="ca-accom__yes" onClick={() => setAnswered(true)}>
            Oui, je veux être accompagné(e)
          </a>
          <button type="button" className="ca-accom__no"
            onClick={() => {
              setVisible(false);
              try { localStorage.setItem("ca_accom_dismissed", "1"); } catch {}
            }}>
            Non merci
          </button>
        </div>
      </div>
      <button type="button" className="ca-accom__close"
        onClick={() => { setVisible(false); try { localStorage.setItem("ca_accom_dismissed","1"); } catch {} }}>
        <X size={14}/>
      </button>
    </div>
  );
}

/* Styles polygone selon l'état de zone */
const ZONE_POLY_STYLE = {
  inside:    { color:"#3b82f6", weight:2.5, fillColor:"#3b82f6", fillOpacity:0.09, opacity:1,   dashArray:null },
  tolerance: { color:"#93c5fd", weight:2,   fillColor:"#bfdbfe", fillOpacity:0.13, opacity:0.8, dashArray:"6,4" },
  blocked:   { color:"#ef4444", weight:2.5, fillColor:"#ef4444", fillOpacity:0.10, opacity:1,   dashArray:null },
};

/* -- Carte Leaflet contrôlée (position synced via prop) -- */
function ControlledMap({ position, onLocationChange, govLabel, delLabel, onZoneStatus }) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const markerRef       = useRef(null);
  const zoneLayerRef    = useRef(null);
  const zoneFeaturesRef = useRef([]);
  const lastValidPosRef = useRef(null); // dernière position autorisée (inside|tolerance)
  const onZoneStatusRef = useRef(onZoneStatus);
  const [zoneState, setZoneState] = useState(null); // null|'inside'|'tolerance'|'blocked'

  useEffect(() => { onZoneStatusRef.current = onZoneStatus; }, [onZoneStatus]);

  const getAddress = useCallback(async (lat, lng) => {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr&zoom=18`
      );
      const data = await res.json();
      const a    = data.address || {};
      const parts = [a.house_number, a.road, a.neighbourhood,
        a.city || a.town || a.village, a.country].filter(Boolean);
      return parts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
  }, []);

  /* Évalue l'état de zone et met à jour le style du polygone.
     Retourne l'état calculé pour que les handlers puissent agir. */
  const checkZone = useCallback((lat, lng) => {
    const feats = zoneFeaturesRef.current;
    if (!feats.length) {
      setZoneState(null);
      onZoneStatusRef.current?.(null);
      return null;
    }
    const st = zoneStatus(lat, lng, feats);
    setZoneState(st);
    onZoneStatusRef.current?.(st);
    if (zoneLayerRef.current) zoneLayerRef.current.setStyle(ZONE_POLY_STYLE[st] || ZONE_POLY_STYLE.inside);
    return st;
  }, []); // eslint-disable-line

  /* Init map once */
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !containerRef.current) return;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current).setView([position.lat, position.lng], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", maxZoom: 19 }).addTo(map);

      const marker = L.marker([position.lat, position.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", async () => {
        const { lat, lng } = marker.getLatLng();
        const st = checkZone(lat, lng);
        if (st === 'blocked') {
          /* Remettre le marqueur à la dernière position valide */
          const prev = lastValidPosRef.current;
          if (prev) { marker.setLatLng([prev.lat, prev.lng]); return; }
          /* Pas de position valide : remettre au centre du polygon */
          if (zoneLayerRef.current) {
            try { const c = zoneLayerRef.current.getBounds().getCenter(); marker.setLatLng(c); } catch {}
          }
          return;
        }
        lastValidPosRef.current = { lat, lng };
        const address = await getAddress(lat, lng);
        onLocationChange({ lat, lng, address });
      });

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        const st = checkZone(lat, lng);
        if (st === 'blocked') return; // ignorer le clic
        marker.setLatLng([lat, lng]);
        lastValidPosRef.current = { lat, lng };
        const address = await getAddress(lat, lng);
        onLocationChange({ lat, lng, address });
      });

      setTimeout(() => map.invalidateSize(), 80);
    })();
    return () => { live = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []); // eslint-disable-line

  /* Charger et afficher le polygone de la zone sélectionnée */
  useEffect(() => {
    let live = true;
    (async () => {
      const map = mapRef.current;
      if (zoneLayerRef.current && map) { map.removeLayer(zoneLayerRef.current); zoneLayerRef.current = null; }
      zoneFeaturesRef.current = [];
      lastValidPosRef.current = null;
      setZoneState(null);
      onZoneStatusRef.current?.(null);

      if (!govLabel || !map) return;

      const L = (await import("leaflet")).default;
      if (!live) return;

      const useDelLevel = !!delLabel;
      const geo = await loadCaGeo(
        useDelLevel ? "/tunisia-del.geojson" : "/tunisia-gov.geojson",
        useDelLevel ? CA_DEL_CACHE : CA_GOV_CACHE
      );
      if (!live) return;

      let features;
      if (useDelLevel) {
        features = geo.features.filter(f => {
          const fg = _nCA(f.properties.govNom), fg2 = _nCA(govLabel);
          if (fg !== fg2 && normDelCA(fg) !== normDelCA(fg2)) return false;
          return matchDelCA(f.properties.delNom, delLabel);
        });
      } else {
        features = geo.features.filter(f => {
          const fg = _nCA(f.properties.govNom), fg2 = _nCA(govLabel);
          return fg === fg2 || normDelCA(fg) === normDelCA(fg2);
        });
      }

      if (!features.length || !live) return;
      zoneFeaturesRef.current = features;

      const layer = L.geoJSON({ type:"FeatureCollection", features }, {
        style: ZONE_POLY_STYLE.inside,
        interactive: false,
      });
      if (!live) return;
      layer.addTo(map);
      zoneLayerRef.current = layer;

      try { map.fitBounds(layer.getBounds(), { padding:[30,30], maxZoom:14 }); } catch {}

      if (markerRef.current) {
        const { lat, lng } = markerRef.current.getLatLng();
        const st = checkZone(lat, lng);
        if (st !== 'blocked') lastValidPosRef.current = { lat, lng };
      }
    })();
    return () => { live = false; };
  }, [govLabel, delLabel, checkZone]); // eslint-disable-line

  /* Sync marqueur quand la position change via géocode/saisie manuelle */
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([position.lat, position.lng]);
    mapRef.current.setView([position.lat, position.lng], Math.max(mapRef.current.getZoom(), 12));
    const st = checkZone(position.lat, position.lng);
    if (st !== 'blocked') lastValidPosRef.current = { lat: position.lat, lng: position.lng };
  }, [position.lat, position.lng, checkZone]);

  /* Badge du bas selon l'état */
  const badge = zoneState === 'tolerance'
    ? { bg:"rgba(59,130,246,0.82)", text:"Légèrement hors zone — position tolérée" }
    : zoneState === 'blocked'
    ? { bg:"rgba(239,68,68,0.95)",  text:"Zone trop éloignée — placement non autorisé" }
    : null;

  return (
    <div style={{position:"relative", width:"100%", height:"100%", minHeight:420}}>
      <div ref={containerRef} style={{width:"100%", height:"100%", minHeight:420, borderRadius:12, overflow:"hidden"}}/>
      {/* Hint déplacement */}
      <div style={{
        position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
        background:"rgba(255,255,255,0.96)", backdropFilter:"blur(6px)",
        border:"2px solid #e2e8f0", borderRadius:10,
        padding:"9px 20px", fontSize:14, fontWeight:700, color:"#0f172a",
        pointerEvents:"none", zIndex:999, whiteSpace:"nowrap",
        boxShadow:"0 4px 16px rgba(0,0,0,.18)",
        display:"flex", alignItems:"center", gap:8, letterSpacing:".01em"
      }}>
        <span style={{fontSize:16}}>↔</span> Déplacez l'emplacement
      </div>
      {/* Badge état zone */}
      {badge && (
        <div style={{
          position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)",
          background:badge.bg, color:"#fff",
          borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:700,
          zIndex:999, pointerEvents:"none", whiteSpace:"nowrap",
          boxShadow:"0 4px 14px rgba(0,0,0,.2)",
          display:"flex", alignItems:"center", gap:7,
        }}>
          <AlertTriangle size={14} style={{flexShrink:0}}/>{badge.text}
        </div>
      )}
    </div>
  );
}

const STEPS = [
  { id: 1, label: "Type & Caractéristiques", icon: Building2 },
  { id: 2, label: "Localisation",            icon: MapPin },
  { id: 3, label: "Présentation",            icon: Sparkles },
  { id: 4, label: "Photos",                  icon: Camera },
  { id: 5, label: "Prévisualisation",        icon: Eye },
];

/* -- Barre évaluation prix ----------------------------------- */
const CA_EVAL_LEVELS = [
  { key:"none",  label:"Aucune évaluation", segs:0, color:"#d1d5db" },
  { key:"high3", label:"Prix très élevé",   segs:1, color:"#dc2626" },
  { key:"high2", label:"Prix élevé",        segs:2, color:"#f59e0b" },
  { key:"fair",  label:"Prix équitable",    segs:3, color:"#3b82f6" },
  { key:"good",  label:"Bon prix",          segs:4, color:"#16a34a" },
  { key:"great", label:"Très bon prix",     segs:5, color:"#15803d" },
];
const CA_EVAL_TOTAL = 5;

function getCaEvalLevel(prixM2, govAvg, count) {
  if (!count || !govAvg || !prixM2 || govAvg <= 0) return CA_EVAL_LEVELS[0];
  const r = prixM2 / govAvg;
  if (r >= 1.30) return CA_EVAL_LEVELS[1];
  if (r >= 1.10) return CA_EVAL_LEVELS[2];
  if (r >= 0.90) return CA_EVAL_LEVELS[3];
  if (r >= 0.70) return CA_EVAL_LEVELS[4];
  return CA_EVAL_LEVELS[5];
}

function CaPriceEvalBar({ prixM2, govStats, devise }) {
  const gs  = govStats || { sum: 0, count: 0 };
  const avg = gs.count > 0 ? gs.sum / gs.count : 0;
  const ev  = getCaEvalLevel(prixM2, avg, gs.count);
  const isNone = ev.key === "none";

  return (
    <div className="ca-peb">
      <div className="ca-peb__top">
        <span className="ca-peb__label" style={{ color: isNone ? "#9ca3af" : ev.color }}>
          {ev.label}
        </span>
        {!isNone && avg > 0 && (
          <span className="ca-peb__avg">
            Moy. zone : {Math.round(avg).toLocaleString("fr-TN")} {devise}/m²
          </span>
        )}
      </div>
      <div className="ca-peb__bar">
        {Array.from({ length: CA_EVAL_TOTAL }, (_, i) => (
          <span key={i} className="ca-peb__seg"
            style={{ background: i < ev.segs ? ev.color : "#e2e8f0" }}
          />
        ))}
      </div>
      {!isNone && gs.count > 0 && (
        <span className="ca-peb__ref">{gs.count} annonce{gs.count > 1 ? "s" : ""} de référence</span>
      )}
    </div>
  );
}

/* -- Helper: build prefill formData from detail API response -- */
function buildPrefill(a) {
  const feat = a.features || [];
  return {
    colocation:        a.colocation || false,
    profil_coloc:      a.profil_coloc || "tous",
    genre_coloc:       Array.isArray(a.genre_coloc) ? a.genre_coloc : (a.genre_coloc ? a.genre_coloc.split(",").filter(Boolean) : []),
    chambres_coloc:    (a.chambres_colocation || []).map(c => ({
      capacite:        c.capacite || 1,
      places_occupees: c.places_occupees || 0,
      prix_par_place:  c.prix_par_place || 0,
    })),
    type_bien:         a.type_bien || "",
    categorie:         a.categorie || "",
    etat_bien:         a.etat_bien || "",
    type_terrain:      a.type_terrain || "",
    vocation_terrain:  "",
    titre_foncier:     "",
    type_appartement:  a.type_appartement || "",
    etage:             a.etage !== null && a.etage !== undefined ? String(a.etage) : "",
    type_villa:        a.type_villa || "",
    type_option_villa: "",
    nb_pieces:         a.nb_pieces || 0,
    nb_chambres:       a.nb_chambres || 0,
    nb_salles_bain:    a.nb_salles_bain || 0,
    capacite_accueil:  a.capacite_accueil || 0,
    titre:             a.titre || "",
    superficie:        a.superficie ? String(a.superficie) : "",
    prix:              a.prix ? String(a.prix) : "",
    devise:            a.devise || "TND",
    description:       a.description || "",
    address:           a.address || "Tunis, Tunisie",
    latitude:          a.latitude ? String(a.latitude) : "36.8065",
    longitude:         a.longitude ? String(a.longitude) : "10.1815",
    allImages:         [],
    mainImageIndex:    0,
    age_bien:          "",
    orientation:       "",
    surface_jardin:    "",
    surface_terrasse:  "",
    nb_places_garage:  1,
    duree_type:        "",
    duree_valeur:      "",
    standing:          a.standing || "",
    accompagnement:    a.accompagnement || false,
    anonyme:           a.anonyme || false,
    jardin:            feat.includes("Jardin"),
    terrasse:          feat.includes("Terrasse"),
    balcon:            feat.includes("Balcon"),
    parking:           feat.includes("Parking"),
    garage:            feat.includes("Garage"),
    ascenseur:         feat.includes("Ascenseur"),
    vue_mer:           feat.includes("Vue sur mer"),
    vue_montagne:      feat.includes("Vue sur montagne"),
    vue_foret:         feat.includes("Vue sur forêt"),
    piscine:           feat.includes("Piscine"),
    concierge:         feat.includes("Concierge"),
    cellier:           feat.includes("Cellier"),
    meuble:            feat.includes("Meublé"),
    cuisine_equipee:   feat.includes("Cuisine équipée"),
    climatisation:     feat.includes("Climatisation"),
    chauffage_centrale:feat.includes("Chauffage central"),
    cheminee:          feat.includes("Cheminée"),
    double_vitrage:    feat.includes("Double vitrage"),
    porte_blindee:     feat.includes("Porte blindée"),
    securite:          feat.includes("Sécurité"),
    internet:          feat.includes("Internet"),
    tv:                feat.includes("TV"),
    machine_laver:     feat.includes("Machine à laver"),
    digicode:          feat.includes("Digicode"),
    interphone:        feat.includes("Interphone"),
    gardien:           feat.includes("Gardien"),
    animaux_admis:     feat.includes("Animaux admis"),
    salon_americain:   feat.includes("Salon américain"),
    relie_onas:        feat.includes("Relié ONAS"),
    fibre_optique:     feat.includes("Fibre optique"),
  };
}

function buildPrefillHierarchy(a) {
  return {
    gouvernorat: a.gouvernorat_id ? String(a.gouvernorat_id) : "",
    delegation:  a.delegation_id  ? String(a.delegation_id)  : "",
    localite:    a.localite_id    ? String(a.localite_id)    : "",
  };
}

export const CreateListingForm = ({ editId = null }) => {
  const toast    = useToast();
  const navigate = useNavigate();

  /* -- Guard : doit être connecté pour publier -- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login?redirect=/creer_annonce", { replace: true });
  }, []);

  /* -- Historique adresses utilisateur -- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/annonces/my-addresses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        console.log("[AddressHistory]", data);
        setAddressHistory(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("[AddressHistory error]", err));
  }, []);

  const [typeDropOpen, setTypeDropOpen] = useState(false);
  const isMobWidth = typeof window !== "undefined" && window.innerWidth <= 860;

  /* -- Restore step + non-file form data from localStorage -- */
  const [currentStep, setCurrentStep] = useState(() => {
    if (editId) return 1; // Always start at step 1 in edit mode
    try {
      const saved = localStorage.getItem("ca_step");
      const n = saved ? parseInt(saved, 10) : 1;
      return (n >= 1 && n <= 5) ? n : 1;
    } catch { return 1; }
  });
  const [mapLocation, setMapLocation] = useState(() => {
    if (editId) return { lat: 36.8065, lng: 10.1815, address: "Tunis, Tunisie" };
    try {
      const saved = localStorage.getItem("ca_maploc");
      return saved ? JSON.parse(saved) : { lat: 36.8065, lng: 10.1815, address: "Tunis, Tunisie" };
    } catch { return { lat: 36.8065, lng: 10.1815, address: "Tunis, Tunisie" }; }
  });
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [addressHistory, setAddressHistory] = useState([]); // [{address, count}]
  const [addressWarning, setAddressWarning] = useState("");
  const [addrDropdownOpen, setAddrDropdownOpen] = useState(false);
  const [zoneStatus, setZoneStatus] = useState(null); // null=pas de zone | true=dedans | false=dehors
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading,     setIsAILoading]     = useState(false);
  const [titleSuggestions,setTitleSuggestions]= useState([]);
  const [descVariants,    setDescVariants]    = useState([]);
  const [hierarchy, setHierarchy] = useState(() => {
    if (editId) return { gouvernorat: "", delegation: "", localite: "" };
    try {
      const saved = localStorage.getItem("ca_hierarchy");
      return saved ? JSON.parse(saved) : { gouvernorat: "", delegation: "", localite: "" };
    } catch { return { gouvernorat: "", delegation: "", localite: "" }; }
  });

  const { gouvernorats, delegations, localites } = useLocalisation(hierarchy);

  const defaultFormData = {
    type_bien: "", categorie: "", etat_bien: "", type_terrain: "", vocation_terrain: "", titre_foncier: "",
    type_appartement: "", etage: "", type_villa: "", type_option_villa: "",
    hauteur_immeuble: "", emplacement_garage: "", standing: "", livraison_prevue: "",
    nb_appartements: "", orientation_immeuble: "",
    nb_pieces: 0, nb_chambres: 0, nb_salles_bain: 0, capacite_accueil: 0,
    vue_mer: false, vue_montagne: false, vue_foret: false, jardin: false,
    terrasse: false, balcon: false, ascenseur: false, garage: false, parking: false,
    cellier: false, meuble: false, cuisine_equipee: false, climatisation: false,
    chauffage_centrale: false, orientation: "",
    fonds_de_commerce: "", pas_de_porte: "",
    piscine: false, concierge: false, digicode: false, interphone: false, gardien: false,
    relie_onas: false, salon_americain: false, fibre_optique: false, cheminee: false,
    double_vitrage: false, porte_blindee: false, securite: false, internet: false,
    machine_laver: false, tv: false, animaux_admis: false,
    age_bien: "", surface_jardin: "", surface_terrasse: "", nb_places_garage: 1,
    gouvernorat: "", delegation: "", localite: "",
    address: "Tunis, Tunisie", latitude: "36.8065", longitude: "10.1815",
    titre: "", superficie: "", prix: "", devise: "TND", description: "",
    duree_type: "", duree_valeur: "", accompagnement: false, anonyme: false,
    colocation: false, profil_coloc: "tous", genre_coloc: [], chambres_coloc: [],
    allImages: [], mainImageIndex: 0
  };

  const [formData, setFormData] = useState(() => {
    if (editId) return defaultFormData; // Will be overwritten by edit useEffect
    try {
      const saved = localStorage.getItem("ca_formdata");
      if (!saved) return defaultFormData;
      const parsed = JSON.parse(saved);
      if (parsed.devise === "DT") parsed.devise = "TND";
      return { ...defaultFormData, ...parsed, allImages: [], mainImageIndex: 0 };
    } catch { return defaultFormData; }
  });

  const [imageValidation, setImageValidation] = useState({});
  /* -- Edit mode state -- */
  const [showPublishModal,   setShowPublishModal]   = useState(false);
  const [loadingEdit,        setLoadingEdit]        = useState(false);
  const [loadingEditError,   setLoadingEditError]   = useState(false);
  const [editPropertyIdState,setEditPropertyIdState]= useState(null);
  /* Images existantes (edit mode) — URLs chargées depuis le backend */
  const [existingImageUrls,  setExistingImageUrls]  = useState([]);
  /* Image principale parmi les existantes (index, -1 = aucune) */
  const [mainExistingIdx,    setMainExistingIdx]    = useState(0);
  /* -- Agences pour dropdown accompagnement -- */
  const [agences, setAgences] = useState([]);
  const [agenceChoisie, setAgenceChoisie] = useState("");
  /* -- Stats de marché (prix moyen/m² par gouvernorat) -- */
  const [marketStats, setMarketStats] = useState({});
  /* -- Index image sélectionnée dans la prévisualisation (step 5) -- */
  const [previewImg, setPreviewImg] = useState(0);
  /* -- Blob URLs stables pour les photos uploadées (évite la recréation à chaque render) -- */
  const [imgUrls, setImgUrls] = useState([]);
  useEffect(() => {
    if (!formData.allImages || formData.allImages.length === 0) { setImgUrls([]); return; }
    const urls = formData.allImages.map(f => URL.createObjectURL(f));
    setImgUrls(urls);
    return () => { urls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} }); };
  }, [formData.allImages]); // eslint-disable-line

  const totalSteps = 5;

  const [addressFilter, setAddressFilter] = useState("");

  /* -- Persist form state to localStorage (non-file fields only) — skip in edit mode -- */
  useEffect(() => {
    fetch(`${API_URL}/users/agencies/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAgences(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (editId) return;
    try { localStorage.setItem("ca_step", String(currentStep)); } catch { /* ignore */ }
  }, [currentStep, editId]);

  useEffect(() => {
    if (editId) return;
    try {
      const { allImages, ...serializableData } = formData;
      localStorage.setItem("ca_formdata", JSON.stringify(serializableData));
    } catch { /* ignore */ }
  }, [formData, editId]);

  useEffect(() => {
    if (editId) return;
    try { localStorage.setItem("ca_hierarchy", JSON.stringify(hierarchy)); } catch { /* ignore */ }
  }, [hierarchy, editId]);

  useEffect(() => {
    if (editId) return;
    try { localStorage.setItem("ca_maploc", JSON.stringify(mapLocation)); } catch { /* ignore */ }
  }, [mapLocation, editId]);

  /* -- À l'étape 5, toujours démarrer sur l'index 0 (la principale est placée en tête) -- */
  useEffect(() => {
    if (currentStep === 5) setPreviewImg(0);
  }, [currentStep]); // eslint-disable-line

  /* -- Reset categorie if type_bien changes to terrain/local_commercial and categorie is vacances -- */
  useEffect(() => {
    if (["terrain","local_commercial","immeuble","garage_parking","depot_stockage","bureau"].includes(formData.type_bien) && formData.categorie === "vacances") {
      setFormData(prev => ({ ...prev, categorie: "" }));
    }
    /* Effacer toutes les erreurs de validation quand le type change */
    setValidationErrors({});
  }, [formData.type_bien]);

  /* -- Reset etat_bien if categorie changes and current value is no longer a valid option -- */
  useEffect(() => {
    const cat = formData.categorie;
    const etat = formData.etat_bien;
    if (!etat) return;
    if ((cat === "location" || cat === "vacances") && etat === "cours_construction") {
      setFormData(prev => ({ ...prev, etat_bien: "" }));
    }
    if (cat === "vacances" && etat === "a_renover") {
      setFormData(prev => ({ ...prev, etat_bien: "" }));
    }
  }, [formData.categorie]);

  /* -- Fetch stats prix/m² depuis les annonces publiques -- */
  useEffect(() => {
    fetch(`${API_URL}/annonces/public?limit=500`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const stats = {};
        data.forEach(a => {
          if (!a.prix || !a.superficie || a.superficie <= 0 || !a.gouvernorat) return;
          const k = a.gouvernorat;
          if (!stats[k]) stats[k] = { sum: 0, count: 0 };
          stats[k].sum   += a.prix / a.superficie;
          stats[k].count += 1;
        });
        setMarketStats(stats);
      })
      .catch(() => {});
  }, []);

  /* -- Load existing annonce data when in edit mode -- */
  useEffect(() => {
    if (!editId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingEdit(true);
    fetch(`${API_URL}/annonces/${editId}/detail`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject("Erreur chargement"))
      .then(a => {
        setFormData(prev => ({ ...prev, ...buildPrefill(a) }));
        setHierarchy(buildPrefillHierarchy(a));
        if (a.latitude && a.longitude) {
          setMapLocation({ lat: a.latitude, lng: a.longitude, address: a.address || "" });
        }
        setEditPropertyIdState(a.property_id || null);
        /* Stocker les URLs des images existantes pour l'affichage en step 4 */
        if (Array.isArray(a.images) && a.images.length > 0) {
          const urls = a.images.map(img => img.startsWith("http") ? img : `${API_URL}${img}`);
          setExistingImageUrls(urls);
          /* Positionner l'index de l'image principale parmi les existantes */
          if (a.image_principale) {
            const principaleUrl = a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`;
            const idx = urls.findIndex(u => u === principaleUrl || u.endsWith(a.image_principale));
            setMainExistingIdx(idx >= 0 ? idx : 0);
          }
        }
        setLoadingEdit(false);
      })
      .catch(() => {
        setLoadingEditError(true);
        setLoadingEdit(false);
      });
  }, [editId]); // eslint-disable-line

  /* -- Incompatibilités terrain type ? vocation (calcul inline, sans toast) -- */
  const TERRAIN_INCOMPATIBILITIES = {
    /* agricole ? seulement agricole/mixte/non_définie autorisées */
    agricole:    ["commerciale","industrielle","touristique","residentielle"],
    zone_verte:  ["commerciale","industrielle","residentielle"],
    industriel:  ["agricole","touristique","residentielle"],
    commercial:  ["agricole"],
    lotissement: ["agricole","industrielle"],
    nu:          [],
  };
  const VOCATION_LABELS = { residentielle:"Résidentielle", commerciale:"Commerciale",
    industrielle:"Industrielle", agricole:"Agricole", touristique:"Touristique/Hôtelière", mixte:"Mixte" };
  const TYPE_TERRAIN_LABELS = { agricole:"Agricole", zone_verte:"Zone verte", industriel:"Industriel",
    commercial:"Commercial", lotissement:"Lotissement", nu:"Nu" };
  const vocIncompat = formData.type_bien === "terrain" && formData.type_terrain && formData.vocation_terrain
    && (TERRAIN_INCOMPATIBILITIES[formData.type_terrain] || []).includes(formData.vocation_terrain);

  /* Réinitialiser vocation si incompatible avec type de terrain */
  useEffect(() => {
    if (formData.type_terrain === "agricole" &&
        formData.vocation_terrain &&
        !["agricole","mixte","non_definie",""].includes(formData.vocation_terrain)) {
      handleInputChange("vocation_terrain", "");
    }
  }, [formData.type_terrain]); // eslint-disable-line

  /* -- Réinitialisation des champs spécifiques quand le type de bien change -- */
  const prevTypeBienRef = useRef(formData.type_bien);
  useEffect(() => {
    const prev = prevTypeBienRef.current;
    const curr = formData.type_bien;
    if (prev === curr || !prev) { prevTypeBienRef.current = curr; return; }
    prevTypeBienRef.current = curr;

    /* Réinitialiser TOUS les champs spécifiques au type précédent */
    setFormData(f => ({
      ...f,
      /* Appartement */
      type_appartement:  "",
      etage:             "",
      /* Villa */
      type_villa:        "",
      type_option_villa: "",
      /* Terrain */
      type_terrain:      "",
      titre_foncier:     "",
      vocation_terrain:  "",
      /* Communs (remis à 0) */
      etat_bien:         "",
      age_bien:          "",
      nb_pieces:         0,
      nb_chambres:       0,
      nb_salles_bain:    0,
      capacite_accueil:  0,
      orientation:       "",
    }));
    /* Effacer aussi les erreurs de validation */
    setValidationErrors({});
  }, [formData.type_bien]); // eslint-disable-line

  /* Réinitialiser aussi la catégorie si elle devient incompatible */
  useEffect(() => {
    const t = formData.type_bien;
    if (["terrain","local_commercial","depot_stockage","bureau"].includes(t) && formData.categorie === "vacances") {
      setFormData(f => ({ ...f, categorie: "" }));
    }
  }, [formData.type_bien]); // eslint-disable-line

  const clearFormStorage = () => {
    if (editId) return; // Don't clear storage in edit mode
    ["ca_step", "ca_formdata", "ca_hierarchy", "ca_maploc"].forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
  };

  const handleHierarchyChange = (level, value) => {
    // Réinitialiser le message d'avertissement adresse quand on change de localisation
    if (level === "gouvernorat") { setAddressWarning(""); setZoneStatus(null); }
    const newHierarchy = { ...hierarchy };
    if (level === "gouvernorat") {
      newHierarchy.gouvernorat = value;
      newHierarchy.delegation = "";
      newHierarchy.localite = "";
    } else if (level === "delegation") {
      newHierarchy.delegation = value;
      newHierarchy.localite = "";
    } else {
      newHierarchy[level] = value;
    }
    setHierarchy(newHierarchy);

    /* Mettre à jour l'adresse textuelle pour tous les niveaux */
    const govLabel = gouvernorats.find(g => g.value === newHierarchy.gouvernorat)?.label || "";
    const delLabel = delegations.find(d => d.id === newHierarchy.delegation)?.nom || "";
    const locLabel = localites.find(l => l.id === newHierarchy.localite)?.nom || "";

    let builtAddress = "";
    if (locLabel && delLabel && govLabel) {
      builtAddress = [locLabel, delLabel, govLabel, "Tunisie"].join(", ");
    } else if (delLabel && govLabel) {
      builtAddress = [delLabel, govLabel, "Tunisie"].join(", ");
    } else if (govLabel) {
      builtAddress = govLabel + ", Tunisie";
    }
    if (builtAddress) {
      setFormData(prev => ({ ...prev, address: builtAddress }));
    }

    /* Déplacer le point sur la carte SEULEMENT pour gouvernorat et délégation (pas localité) */
    if (level === "localite") return;

    const searchLabel = delLabel || govLabel;
    if (searchLabel) {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLabel + ", Tunisie")}&format=json&limit=1&countrycodes=tn`,
        { headers: { "Accept-Language": "fr" } }
      )
        .then(r => r.json())
        .then(data => {
          if (data[0]) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (builtAddress) {
              setMapLocation({ lat, lng, address: builtAddress });
              setFormData(prev => ({
                ...prev,
                latitude:  lat.toString(),
                longitude: lng.toString(),
                address:   builtAddress,
              }));
            } else {
              setMapLocation(prev => ({ ...prev, lat, lng }));
              setFormData(prev => ({
                ...prev,
                latitude:  lat.toString(),
                longitude: lng.toString(),
              }));
            }
          }
        })
        .catch(() => {});
    }
  };

  const handleMapLocationChange = async (newLocation) => {
    setMapLocation(newLocation);
    setFormData(prev => ({
      ...prev,
      latitude: newLocation.lat.toString(),
      longitude: newLocation.lng.toString(),
      address: newLocation.address,
      fullAddress: newLocation.address
    }));
  };

  const geocodeAddress = async () => {
    const q = formData.address?.trim();
    if (!q) return;
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMapLocation(prev => ({ ...prev, lat, lng, address: q }));
        setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
      }
    } catch { /* silencieux */ }
  };

  const handleGeolocate = async () => {
    if (navigator.geolocation) {
      setIsGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
            );
            if (response.ok) {
              const data = await response.json();
              let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              if (data && data.address) {
                const addressParts = [];
                if (data.address.road) addressParts.push(data.address.road);
                if (data.address.house_number) addressParts.push(data.address.house_number);
                if (data.address.city || data.address.town || data.address.village) {
                  addressParts.push(data.address.city || data.address.town || data.address.village);
                }
                if (data.address.country) addressParts.push(data.address.country);
                address = addressParts.join(', ');
              }
              handleMapLocationChange({ lat: latitude, lng: longitude, address });
            }
          } catch (error) {
            handleMapLocationChange({
              lat: latitude, lng: longitude,
              address: `Position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
          }
          setIsGeolocating(false);
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          alert('Impossible de vous géolocaliser. Vérifiez vos permissions.');
          setIsGeolocating(false);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  const handleInputChange = (field, value) => {
    /* Quand nb_chambres change, redimensionner chambres_coloc si colocation activée */
    if (field === "nb_chambres") {
      const n = parseInt(value) || 0;
      setFormData(prev => {
        const cur = prev.chambres_coloc || [];
        const newArr = prev.colocation
          ? Array.from({length: n}, (_, i) => cur[i] || { capacite: 1, places_occupees: 0, prix_par_place: 0 })
          : cur;
        return { ...prev, nb_chambres: value, chambres_coloc: newArr };
      });
      return;
    }
    /* Quand colocation activée, initialiser chambres_coloc depuis nb_chambres */
    if (field === "colocation" && value === true) {
      setFormData(prev => {
        const n = parseInt(prev.nb_chambres) || 0;
        const cur = prev.chambres_coloc || [];
        const newArr = Array.from({length: n}, (_, i) => cur[i] || { capacite: 1, places_occupees: 0, prix_par_place: 0 });
        return { ...prev, colocation: true, chambres_coloc: newArr };
      });
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'latitude' && !isNaN(parseFloat(value))) {
      setMapLocation(prev => ({ ...prev, lat: parseFloat(value) }));
    }
    if (field === 'longitude' && !isNaN(parseFloat(value))) {
      setMapLocation(prev => ({ ...prev, lng: parseFloat(value) }));
    }
    if (field === 'address') {
      setMapLocation(prev => ({ ...prev, address: value }));
    }
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const incrementValue = (field) => {
    if (formData[field] < 15) {
      const newVal = formData[field] + 1;
      handleInputChange(field, newVal);
      /* Règle : nb_pieces >= nb_chambres — si on augmente les chambres, ajuster les pièces */
      if (field === "nb_chambres" && newVal > formData.nb_pieces) {
        handleInputChange("nb_pieces", newVal);
      }
    }
  };

  const decrementValue = (field) => {
    if (formData[field] > 0) {
      const newVal = formData[field] - 1;
      handleInputChange(field, newVal);
      /* Règle : nb_chambres <= nb_pieces — si on réduit les pièces, ajuster les chambres */
      if (field === "nb_pieces" && newVal < formData.nb_chambres) {
        handleInputChange("nb_chambres", newVal);
      }
    }
  };


  /* -- Champs invalides (bordure rouge) -- */
  const [validationErrors, setValidationErrors] = useState({});

  const nextStep = () => {
    const errors = {};

    if (currentStep === 1) {
      if (!formData.type_bien)  errors.type_bien  = true;
      if (!formData.categorie)  errors.categorie  = true;
      /* Titre foncier obligatoire pour terrain */
      if (formData.type_bien === "terrain" && !formData.titre_foncier) {
        errors.titre_foncier = true;
      }
      /* Durée de location obligatoire pour vacances */
      if (formData.categorie === "vacances" && !formData.duree_type) {
        errors.duree_type = true;
      }
      /* Capacité d'accueil ≥ 1 pour vacances */
      if (formData.categorie === "vacances" && (!formData.capacite_accueil || formData.capacite_accueil < 1)) {
        errors.capacite_accueil = true;
      }
      /* État du bien obligatoire sauf terrain */
      if (formData.type_bien && formData.type_bien !== "terrain" && !formData.etat_bien) {
        errors.etat_bien = true;
      }
      /* Pièces / chambres / SDB obligatoires pour les types qui affichent ces compteurs */
      if (formData.type_bien && !["terrain","garage_parking","immeuble","depot_stockage"].includes(formData.type_bien)) {
        if (!formData.nb_pieces    || formData.nb_pieces    < 1) errors.nb_pieces    = true;
        if (!formData.nb_chambres  || formData.nb_chambres  < 1) errors.nb_chambres  = true;
        if (!formData.nb_salles_bain || formData.nb_salles_bain < 1) errors.nb_salles_bain = true;
      }
      /* Colocation : au moins 1 place disponible */
      if (["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) && formData.colocation) {
        const rows = formData.chambres_coloc || [];
        const totalDispo = rows.reduce((s,c) => s + Math.max(0,(c.capacite||1)-(c.places_occupees||0)), 0);
        if (totalDispo < 1) {
          toast("Colocation : au moins 1 place doit être disponible avant de continuer.", "error");
          return;
        }
      }
      /* Incompatibilité type ? vocation bloque le passage */
      if (vocIncompat) {
        errors.vocation_terrain = true;
        setValidationErrors(errors);
        toast("Incompatibilité ? Corrigez le type et la vocation du terrain avant de continuer.", "error");
        return;
      }
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast("Champs requis ? Veuillez compléter les champs en rouge.", "error");
        return;
      }
    }
    if (currentStep === 2) {
      if (!hierarchy.gouvernorat) errors.gouvernorat = true;
      if (!hierarchy.delegation)  errors.delegation  = true;
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast("Champs requis — Sélectionnez le gouvernorat et la délégation.", "error");
        return;
      }
      if (zoneStatus === 'blocked') {
        toast("Le point est trop éloigné de la zone. Déplacez le marqueur dans la délégation sélectionnée.", "error");
        return;
      }
    }
    if (currentStep === 4) {
      /* Au moins une photo requise (nouvelle ou existante) */
      const totalPhotos = formData.allImages.length + existingImageUrls.length;
      if (totalPhotos === 0) {
        toast("Photo requise ? Ajoutez au moins une photo de votre bien.", "error");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.titre.trim())                                errors.titre       = true;
      const sup = parseFloat(formData.superficie);
      if (!formData.superficie || isNaN(sup) || sup <= 0)        errors.superficie  = true;
      /* Prix : si colocation active, utiliser le total des chambres */
      const isColoc = ["location","vacances"].includes(formData.categorie) && formData.colocation;
      const totalPrixColoc = isColoc
        ? (formData.chambres_coloc||[]).reduce((s,c)=>s+((c.capacite||1)*(c.prix_par_place||0)),0)
        : 0;
      const prixEffectif = isColoc ? totalPrixColoc : parseFloat(formData.prix);
      if (!prixEffectif || isNaN(prixEffectif) || prixEffectif <= 0)  errors.prix = true;
      if (!formData.description?.trim())                         errors.description = true;
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast("Champs requis ? Veuillez compléter les champs en rouge.", "error");
        return;
      }
      /* Synchroniser formData.prix avec le total colocation pour la soumission finale */
      if (isColoc && totalPrixColoc > 0) {
        setFormData(prev => ({ ...prev, prix: String(totalPrixColoc) }));
      }
    }

    setValidationErrors({});
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    /* Validation */
    if (!formData.type_bien)    { toast("Veuillez sélectionner un type de bien (étape 1).", "error"); return; }
    if (!formData.categorie)    { toast("Veuillez sélectionner le type d'offre (étape 1).", "error"); return; }
    if (!formData.titre.trim()) { toast("Veuillez saisir un titre pour l'annonce (étape 3).", "error"); return; }
    if (!hierarchy.gouvernorat) { toast("Veuillez sélectionner un gouvernorat (étape 2).", "error"); return; }
    if (!hierarchy.delegation)  { toast("Veuillez sélectionner une délégation (étape 2).", "error"); return; }
    if (formData.type_bien === "terrain" && !formData.titre_foncier) {
      toast("Champ requis ? Le titre foncier est obligatoire pour un terrain (étape 1).", "error"); return;
    }

    const prixVal = parseFloat(formData.prix);
    if (!formData.prix || isNaN(prixVal) || prixVal <= 0) {
      toast("Veuillez saisir un prix valide (étape 3).", "error"); return;
    }
    if (prixVal > 9_999_999_999) {
      toast("Le prix saisi est trop élevé (maximum 9 999 999 999).", "error"); return;
    }

    const supVal = parseFloat(formData.superficie);
    if (supVal > 0 && prixVal / supVal <= 0) {
      toast("Le prix au m² doit être supérieur à 0.", "error"); return;
    }
    if (!formData.superficie || isNaN(supVal) || supVal <= 0) {
      toast("Veuillez saisir une superficie valide (étape 3).", "error"); return;
    }
    if (supVal > 9_999_999) {
      toast("La superficie saisie est trop grande (maximum 9 999 999 m²).", "error"); return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?session=expired";
      return;
    }

    /* Helper: lisible pour les erreurs Pydantic (tableau) ou string */
    const readError = (detail) => {
      if (!detail) return "Impossible de créer l'annonce.";
      if (Array.isArray(detail))
        return detail.map(d => `${d.loc?.slice(-1)[0] ?? "champ"} : ${d.msg}`).join("\n");
      return String(detail);
    };

    /* Helper: détecter token expiré */
    const handleRes = async (res) => {
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login?session=expired";
        throw new Error("session_expired");
      }
      return res;
    };

    try {
      /* -- Build shared payload -- */
      const payload = {
        gouvernorat_id: parseInt(hierarchy.gouvernorat) || undefined,
        delegation_id:  parseInt(hierarchy.delegation)  || undefined,
        localite_id:    parseInt(hierarchy.localite)    || undefined,
        categorie:      formData.categorie  || null,
        type_bien:      formData.type_bien  || null,
        titre:          formData.titre,
        description:    formData.description || null,
        superficie:     parseFloat(formData.superficie) || 0,
        prix:           parseFloat(formData.prix)       || 0,
        devise:         formData.devise || "TND",
        status:         "en_attente",
        type_appartement:  formData.type_bien === "appartement" ? (formData.type_appartement || null) : null,
        type_villa:        formData.type_bien === "villa"       ? (formData.type_villa       || null) : null,
        type_terrain:      formData.type_bien === "terrain"     ? (formData.type_terrain     || null) : null,
        type_bureau:       formData.type_bien === "bureau"      ? (formData.type_logement_bureau || null) : null,
        etat_bien:         formData.etat_bien         || null,
        etage:             formData.etage ? parseInt(formData.etage) : null,
        /* type_option_villa est une sélection multiple (ex: "sous-sol,rez-de-jardin").
           Le backend attend une seule valeur enum ? on envoie null pour éviter l'erreur DB.
           Les options villa sont sauvegardées dans le formulaire mais pas soumises à la DB. */
        type_option_villa: null,
        nb_pieces:         formData.nb_pieces    || null,
        nb_chambres:       formData.nb_chambres  || null,
        nb_salles_bain:    formData.nb_salles_bain || null,
        capacite_accueil:  formData.capacite_accueil || null,
        duree_type:        formData.duree_type  || null,
        duree_valeur:      formData.duree_valeur || null,
        anonyme:                   formData.anonyme || false,
        accompagnement:            formData.accompagnement || false,
        accompagnement_agence_id:  agenceChoisie ? parseInt(agenceChoisie) : null,
        hauteur_immeuble:          formData.type_bien === "immeuble"       ? (formData.hauteur_immeuble  || null) : null,
        nb_appartements:           formData.type_bien === "immeuble"       ? (formData.nb_appartements   ? Number(formData.nb_appartements) : null) : null,
        orientation_immeuble:      formData.type_bien === "immeuble"       ? (formData.orientation_immeuble || null) : null,
        emplacement_garage:        formData.type_bien === "garage_parking"  ? (formData.emplacement_garage|| null) : null,
        standing:                  ["appartement","villa","villa_maison","immeuble","local_commercial","bureau"].includes(formData.type_bien) ? (formData.standing || null) : null,
        colocation:      ["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) ? (formData.colocation || false) : false,
        places_totales:  ["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) && formData.colocation ? (formData.chambres_coloc||[]).reduce((s,c)=>s+(c.capacite||1),0) : null,
        places_occupees: ["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) && formData.colocation ? (formData.chambres_coloc||[]).reduce((s,c)=>s+(c.places_occupees||0),0) : null,
        profil_coloc:    ["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) && formData.colocation ? (formData.profil_coloc || "tous") : null,
        genre_coloc:     ["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) && formData.colocation ? (formData.genre_coloc || []) : [],
        chambres_coloc:  ["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) && formData.colocation ? (formData.chambres_coloc||[]).map((c,i)=>({numero_chambre:i+1,capacite:c.capacite||1,places_occupees:c.places_occupees||0,prix_par_place:c.prix_par_place||0})) : [],
        fonds_de_commerce:         formData.type_bien === "local_commercial" ? (formData.fonds_de_commerce || null) : null,
        pas_de_porte:              formData.type_bien === "local_commercial" ? (formData.pas_de_porte || null) : null,
        /* -- Caractéristiques générales -- */
        jardin:            formData.jardin      || false,
        terrasse:          formData.terrasse    || false,
        balcon:            formData.balcon      || false,
        parking:           formData.parking     || false,
        garage:            formData.garage      || false,
        ascenseur:         formData.ascenseur   || false,
        vue_mer:           formData.vue_mer     || false,
        vue_montagne:      formData.vue_montagne|| false,
        vue_foret:         formData.vue_foret   || false,
        piscine:           formData.piscine     || false,
        concierge:         formData.concierge   || false,
        cellier:           formData.cellier     || false,
        meuble:            formData.meuble      || false,
        digicode:          formData.digicode    || false,
        interphone:        formData.interphone  || false,
        gardien:           formData.gardien     || false,
        relie_onas:        formData.relie_onas  || false,
        animaux_admis:     formData.animaux_admis|| false,
        /* -- Caractéristiques intérieures -- */
        salon_americain:   formData.salon_americain  || false,
        fibre_optique:     formData.fibre_optique    || false,
        cheminee:          formData.cheminee          || false,
        climatisation:     formData.climatisation     || false,
        chauffage_centrale:formData.chauffage_centrale|| false,
        securite:          formData.securite          || false,
        double_vitrage:    formData.double_vitrage    || false,
        porte_blindee:     formData.porte_blindee     || false,
        internet:          formData.internet          || false,
        tv:                formData.tv                || false,
        machine_laver:     formData.machine_laver     || false,
        /* -- Cuisine -- */
        cuisine_equipee:   formData.cuisine_equipee   || false,
      };

      /* -- EDIT MODE branch -- */
      if (editId) {
        const updateRes = await handleRes(await fetch(`${API_URL}/annonces/${editId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }));
        if (!updateRes.ok) {
          const err = await updateRes.json();
          toast(readError(err.detail), "error");
          return;
        }

        /* Upload new images and link them to the property */
        if (formData.allImages.length > 0) {
          if (!editPropertyIdState) {
            toast("Avertissement : impossible de lier les images (propriété introuvable).", "error");
          } else {
            let mainImageUrl = null;
            for (let i = 0; i < formData.allImages.length; i++) {
              try {
                const imgForm = new FormData();
                imgForm.append("file", formData.allImages[i]);
                const imgRes = await fetch(`${API_URL}/upload/image`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: imgForm,
                });
                if (imgRes.ok) {
                  const imgData = await imgRes.json();
                  if (i === formData.mainImageIndex) mainImageUrl = imgData.url;
                  await fetch(`${API_URL}/properties/${editPropertyIdState}/images`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ image: imgData.url }),
                  });
                }
              } catch { /* non-bloquant */ }
            }
            /* Update image_principale if the selected main image was uploaded */
            if (mainImageUrl) {
              try {
                await fetch(`${API_URL}/properties/${editPropertyIdState}`, {
                  method: "PUT",
                  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ image_principale: mainImageUrl }),
                });
              } catch { /* non-bloquant */ }
            }
          }
        }

        /* Update property location + image_principale si changée parmi les existantes */
        if (editPropertyIdState) {
          const propPayload = {
            address:   mapLocation.address || formData.address || "",
            latitude:  mapLocation.lat || parseFloat(formData.latitude) || 36.8065,
            longitude: mapLocation.lng || parseFloat(formData.longitude) || 10.1815,
          };
          /* Si aucune nouvelle image ajoutée, l'image principale est celle sélectionnée parmi les existantes */
          if (formData.allImages.length === 0 && existingImageUrls.length > 0) {
            const selectedMainUrl = existingImageUrls[mainExistingIdx] || existingImageUrls[0];
            const relUrl = selectedMainUrl.startsWith(API_URL) ? selectedMainUrl.slice(API_URL.length) : selectedMainUrl;
            propPayload.image_principale = relUrl;
          }
          await fetch(`${API_URL}/properties/${editPropertyIdState}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(propPayload),
          });
        }

        toast("Annonce mise à jour !");
        setTimeout(() => { window.location.href = "/compte?tab=annonces&statut=en_attente"; }, 1200);
        return;
      }

      /* -- CREATE MODE branch -- */
      const annonceRes = await handleRes(await fetch(`${API_URL}/annonces/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));

      if (!annonceRes.ok) {
        const err = await annonceRes.json();
        toast(readError(err.detail), "error");
        return;
      }

      const annonce = await annonceRes.json();

      /* -- 2. Upload ALL images (main first, then extras) -- */
      const orderedImages = formData.allImages.length > 0
        ? [
            formData.allImages[formData.mainImageIndex] || formData.allImages[0],
            ...formData.allImages.filter((_, i) => i !== formData.mainImageIndex)
          ]
        : [];

      let imageUrl = null;
      const uploadedExtraUrls = [];

      for (let i = 0; i < orderedImages.length; i++) {
        try {
          const imgForm = new FormData();
          imgForm.append("file", orderedImages[i]);
          const imgRes = await fetch(`${API_URL}/upload/image`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: imgForm,
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const relUrl = imgData.url;
            if (i === 0) imageUrl = relUrl;
            else uploadedExtraUrls.push(relUrl);
          } else {
            toast(`Image ${i + 1} : échec de l'upload`, "error");
          }
        } catch {
          toast(`Image ${i + 1} : erreur lors de l'upload`, "error");
        }
      }

      /* -- 3. Créer la propriété (localisation + image principale) -- */
      // Use mapLocation state directly — it's always initialized with valid Tunis defaults
      const finalLat = mapLocation.lat || 36.8065;
      const finalLng = mapLocation.lng || 10.1815;
      const propRes = await handleRes(await fetch(`${API_URL}/properties/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          annonce_id:        annonce.id,
          address:           mapLocation.address || formData.address || "Tunis, Tunisie",
          latitude:          finalLat,
          longitude:         finalLng,
          image_principale:  imageUrl,
        }),
      }));
      if (!propRes.ok) {
        const propErr = await propRes.json().catch(()=>({}));
        console.error("[CreerAnnonce] Property creation failed:", propErr);
        toast("Annonce créée, mais la localisation n'a pas pu être enregistrée. Modifiez l'annonce pour corriger.", "warning");
      }
      const propData = propRes.ok ? await propRes.json().catch(()=>({})) : {};

      /* -- 3b. Ajouter les images supplémentaires -- */
      for (const extraUrl of uploadedExtraUrls) {
        try {
          await fetch(`${API_URL}/properties/${propData.id}/images`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ image: extraUrl }),
          });
        } catch { /* silencieux — images extra non bloquantes */ }
      }

      clearFormStorage();
      toast("Annonce enregistrée — approuvée dans les délais de 24h !");
      setTimeout(() => { window.location.href = "/compte?tab=annonces&statut=en_attente"; }, 1200);
    } catch (err) {
      if (err.message !== "session_expired") {
        console.error("[CreerAnnonce] Erreur soumission:", err);
        toast(`Erreur : ${err?.message || "Vérifiez votre connexion et réessayez."}`, "error");
      }
    }
  };

  const handleAIConfirm = (aiDescription) => {
    setFormData(prev => ({ ...prev, description: aiDescription }));
    setIsAIModalOpen(false);
  };

  const generateQuickAIDescription = () => {
    if (!formData.type_bien) {
      toast("Veuillez d'abord sélectionner un type de bien.", "error");
      return;
    }
    setIsAILoading(true);
    setTimeout(() => {
      const govLabel = gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label;
      const delLabel = delegations.find(d => String(d.id) === String(hierarchy.delegation))?.nom;

      const typeLabels = {
        appartement:"appartement", villa:"villa", terrain:"terrain",
        bureau:"bureau", ferme_agricole:"ferme agricole", ferme:"ferme agricole", local_commercial:"local commercial", maison:"maison",
        depot_stockage:"dépôt de stockage"
      };
      const typeFr = typeLabels[formData.type_bien] || formData.type_bien;
      const offreFr = formData.categorie === "location"  ? "à louer"
                    : formData.categorie === "vacances"  ? "en location saisonnière"
                    : "à vendre";

      // -- Paragraphe 1 : accroche --
      let desc = "";
      const locStr = delLabel ? `${delLabel}${govLabel?`, ${govLabel}`:""}` : govLabel || "";
      desc += `Nous vous proposons ${typeFr === "appartement" ? "cet" : "ce"} ${typeFr} ${offreFr}`;
      if (locStr) desc += `, idéalement situé à ${locStr}`;
      if (formData.address && formData.address !== "Tunis, Tunisie") desc += ` (${formData.address})`;
      desc += ".\n\n";

      // -- Paragraphe 2 : composition --
      const compo = [];
      if (formData.superficie) compo.push(`une superficie de ${formData.superficie} m²`);
      if (formData.type_bien !== "terrain") {
        if (formData.nb_pieces  > 0) compo.push(`${formData.nb_pieces} pièce${formData.nb_pieces>1?"s":""}`);
        if (formData.nb_chambres > 0) compo.push(`${formData.nb_chambres} chambre${formData.nb_chambres>1?"s":""}`);
        if (formData.nb_salles_bain > 0) compo.push(`${formData.nb_salles_bain} salle${formData.nb_salles_bain>1?"s":""} de bain`);
      }
      if (formData.type_appartement) compo.push(`type ${formData.type_appartement.toUpperCase()}`);
      if (formData.etage && formData.type_bien !== "terrain") {
        compo.push(formData.etage === "0" ? "rez-de-chaussée" : `${formData.etage}e étage`);
      }
      if (compo.length > 0) {
        desc += `Ce bien se distingue par ${compo.join(", ")}.`;
      }

      // -- Paragraphe 3 : état --
      if (formData.etat_bien) {
        const etatPhrase = {
          nouveau:            "Livré en état neuf, il est disponible immédiatement.",
          bon_etat:           "En excellent état général, il est prêt à l'emménagement sans travaux.",
          a_renover:          "Nécessitant des travaux de rénovation, il offre un fort potentiel de valorisation.",
          cours_construction: "Actuellement en cours de construction, la livraison est prévue prochainement."
        }[formData.etat_bien];
        if (etatPhrase) desc += (compo.length > 0 ? " " : "") + etatPhrase;
      }
      if (compo.length > 0 || formData.etat_bien) desc += "\n\n";

      // -- Paragraphe 4 : équipements --
      const equip = [];
      if (formData.vue_mer)       equip.push("vue sur mer");
      if (formData.vue_montagne)  equip.push("vue sur montagne");
      if (formData.vue_foret)     equip.push("vue sur la forêt");
      if (formData.jardin)        equip.push("jardin privatif");
      if (formData.terrasse)      equip.push("terrasse");
      if (formData.balcon)        equip.push("balcon");
      if (formData.ascenseur)     equip.push("ascenseur");
      if (formData.garage)        equip.push("garage");
      if (formData.parking)       equip.push("place de parking");
      if (formData.meuble)        equip.push("mobilier inclus");
      if (formData.cuisine_equipee) equip.push("cuisine entièrement équipée");
      if (formData.climatisation) equip.push("climatisation");
      if (formData.cellier)       equip.push("cellier");
      if (equip.length > 0) {
        desc += `Parmi ses atouts, ce bien bénéficie de : ${equip.join(", ")}.\n\n`;
      }

      // -- Paragraphe 5 : terrain spécifique --
      if (formData.type_bien === "terrain" && formData.type_terrain) {
        const terrainLabels = {
          agricole:"agricole", nu:"nu", zone_verte:"en zone verte",
          lotissement:"en lotissement", commercial:"à vocation commerciale", industriel:"à vocation industrielle"
        };
        desc += `Il s'agit d'un terrain ${terrainLabels[formData.type_terrain] || formData.type_terrain}`;
        if (formData.titre_foncier === "1") desc += ", avec titre foncier";
        else if (formData.titre_foncier === "0") desc += ", sans titre foncier";
        desc += ".\n\n";
      }

      // -- Phrase de clôture --
      if (formData.prix) {
        desc += `Affiché au prix de ${Number(formData.prix).toLocaleString("fr-TN")} ${formData.devise || "TND"}, `;
      }
      desc += "ce bien constitue une opportunité à saisir. N'hésitez pas à nous contacter pour obtenir plus d'informations ou convenir d'une visite.";

      setFormData(prev => ({ ...prev, description: desc.trim() }));
      setIsAILoading(false);
    }, 900);
  };

  /* Génère une description à partir d'un "style" */
  const buildDesc = (style) => {
    const govLabel = gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label;
    const delLabel = delegations.find(d => String(d.id) === String(hierarchy.delegation))?.nom;
    const typeLabels = {
      appartement:"appartement", villa:"villa", villa_maison:"villa", terrain:"terrain",
      bureau:"bureau", ferme_agricole:"ferme agricole", local_commercial:"local commercial",
      maison:"maison", depot_stockage:"dépôt de stockage", immeuble:"immeuble",
      garage_parking:"garage", immobiliers_divers:"bien immobilier",
    };
    const typeFr = typeLabels[formData.type_bien] || formData.type_bien;
    const offreFr = formData.categorie === "location" ? "à louer"
                  : formData.categorie === "vacances" ? "en location saisonnière"
                  : "à vendre";
    const locStr = delLabel ? `${delLabel}${govLabel ? `, ${govLabel}` : ""}` : govLabel || "";
    const compo = [];
    if (formData.superficie) compo.push(`${formData.superficie} m²`);
    if (formData.nb_pieces > 0)    compo.push(`${formData.nb_pieces} pièce${formData.nb_pieces>1?"s":""}`);
    if (formData.nb_chambres > 0)  compo.push(`${formData.nb_chambres} chambre${formData.nb_chambres>1?"s":""}`);
    if (formData.nb_salles_bain>0) compo.push(`${formData.nb_salles_bain} sdb`);
    const equip = [
      formData.vue_mer && "vue mer", formData.jardin && "jardin", formData.terrasse && "terrasse",
      formData.piscine && "piscine", formData.ascenseur && "ascenseur", formData.garage && "garage",
      formData.meuble && "meublé", formData.cuisine_equipee && "cuisine équipée",
      formData.climatisation && "climatisation", formData.parking && "parking",
    ].filter(Boolean);
    const prixStr = formData.prix ? `${Number(formData.prix).toLocaleString("fr-TN")} ${formData.devise || "TND"}` : "";
    const etatMap = { nouveau:"neuf", bon_etat:"en bon état", a_renover:"à rénover", cours_construction:"en construction" };
    const etatFr = etatMap[formData.etat_bien] || "";

    if (style === "pro") {
      let d = `Nous vous proposons ${typeFr === "appartement" || typeFr === "immeuble" ? "cet" : "ce"} ${typeFr} ${offreFr}`;
      if (locStr) d += `, situé à ${locStr}`;
      d += ".\n\n";
      if (compo.length) d += `Caractéristiques : ${compo.join(" · ")}${etatFr ? ` · ${etatFr}` : ""}.\n\n`;
      if (equip.length) d += `Atouts : ${equip.join(", ")}.\n\n`;
      if (prixStr) d += `Prix : ${prixStr}. `;
      d += "Contactez-nous pour une visite.";
      return d.trim();
    }
    if (style === "warm") {
      let d = `🏠 Coup de cœur assuré pour ce${typeFr==="appartement"||typeFr==="immeuble"?"t":""} ${typeFr}`;
      if (locStr) d += ` niché au cœur de ${locStr}`;
      d += " !\n\n";
      if (compo.length) d += `Avec ses ${compo.join(", ")}, `;
      d += `ce bien ${etatFr ? etatFr+" " : ""}saura vous séduire dès la première visite`;
      if (equip.length) d += ` grâce à ses nombreux atouts : ${equip.join(", ")}`;
      d += ".\n\n";
      if (prixStr) d += `💰 Affiché à ${prixStr}. `;
      d += "N'attendez plus, contactez-nous !";
      return d.trim();
    }
    if (style === "concis") {
      const parts = [];
      if (typeFr) parts.push(`${typeFr.charAt(0).toUpperCase()+typeFr.slice(1)} ${offreFr}`);
      if (locStr) parts.push(locStr);
      if (compo.length) parts.push(compo.join(" | "));
      if (etatFr) parts.push(etatFr.charAt(0).toUpperCase()+etatFr.slice(1));
      if (equip.length) parts.push(equip.slice(0,4).join(", ")+(equip.length>4?"…":""));
      if (prixStr) parts.push(prixStr);
      return parts.join("\n") + "\n\nContactez-nous pour plus d'infos.";
    }
    return "";
  };

  const generateDescVariants = () => {
    if (!formData.type_bien) { toast("Sélectionnez d'abord un type de bien.", "error"); return; }
    setDescVariants([
      { style:"pro",    label:"Professionnel",  desc: buildDesc("pro") },
      { style:"warm",   label:"Chaleureux",     desc: buildDesc("warm") },
      { style:"concis", label:"Concis & direct",desc: buildDesc("concis") },
    ]);
  };

  // Summary for sidebar
  const summary = [
    formData.type_bien && { label: "Type", value: formData.type_bien.charAt(0).toUpperCase() + formData.type_bien.slice(1) },
    formData.categorie && { label: "Offre", value: formData.categorie.charAt(0).toUpperCase() + formData.categorie.slice(1) },
    hierarchy.gouvernorat && { label: "Gouvernorat", value: gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label || hierarchy.gouvernorat },
    formData.superficie && { label: "Superficie", value: `${formData.superficie} m²` },
    formData.prix && { label: "Prix", value: `${Number(formData.prix).toLocaleString('fr-TN')} ${formData.devise || "TND"}` },
  ].filter(Boolean);

  const TYPE_CARDS = [
    { value: "appartement",      label: "Appartement",      Ico: Building2,  color: "#3b82f6" },
    { value: "villa",            label: "Villa/Maison",     Ico: Home,       color: "#10b981" },
    { value: "immeuble",         label: "Immeuble",         Ico: Building2,  color: "#0369a1" },
    { value: "terrain",          label: "Terrain",          Ico: Leaf,       color: "#f59e0b" },
    { value: "local_commercial", label: "Local commercial", Ico: Store,      color: "#f97316" },
    { value: "bureau",           label: "Bureau",           Ico: Briefcase,  color: "#6366f1" },
    { value: "ferme_agricole",   label: "Ferme agricole",   Ico: Tractor,    color: "#16a34a" },
    { value: "garage_parking",   label: "Garage / Parking",    Ico: Car,       color: "#64748b" },
    { value: "depot_stockage",   label: "Dépôt de stockage",   Ico: Warehouse, color: "#78716c" },
    { value: "immobiliers_divers",label:"Immobiliers divers",   Ico: LayoutGrid,color: "#94a3b8" },
  ];

  const ETAT_CARDS = [
    { value: "nouveau",            label: "Neuf",           Ico: Sparkles, color: "#6366f1" },
    { value: "bon_etat",           label: "Bon état",       Ico: ThumbsUp, color: "#16a34a" },
    { value: "a_renover",          label: "À rénover",      Ico: Wrench,   color: "#f59e0b" },
    { value: "cours_construction", label: "En construction",Ico: HardHat,  color: "#64748b" },
  ];

  /* -- Icônes personnalisées (SVG inline) -- */
  const WashingMachineIco = ({ size = 24, strokeWidth = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2"/>
      <circle cx="12" cy="13" r="5"/>
      <circle cx="12" cy="13" r="2.5"/>
      <circle cx="8" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      <circle cx="11" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      <path d="M15 6h2"/>
    </svg>
  );

  const CctvIco = ({ size = 24, strokeWidth = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9h13l2.5-4"/>
      <path d="M7 9v7"/>
      <circle cx="7" cy="18" r="2"/>
      <path d="M15 9l2 6"/>
      <circle cx="18.5" cy="15.5" r="1.5"/>
      <path d="M11 9l1-3"/>
    </svg>
  );

  const FEAT_VUE = [
    { key:"vue_mer",       Ico:Waves,       label:"Vue sur mer",       color:"#0ea5e9" },
    { key:"vue_montagne",  Ico:Mountain,    label:"Vue sur montagne",      color:"#8b5cf6" },
    { key:"vue_foret",     Ico:TreePine,    label:"Vue sur forêt",         color:"#16a34a" },
  ];

  const FEAT_EXT = [
    { key:"jardin",        Ico:Fence,       label:"Jardin",            color:"#22c55e", extra:"surface_jardin" },
    { key:"terrasse",      Ico:Sun,         label:"Terrasse",          color:"#f59e0b", extra:"surface_terrasse" },
    { key:"balcon",        Ico:Flower2,     label:"Balcon",            color:"#f43f5e" },
    { key:"piscine",       Ico:Droplets,    label:"Piscine",           color:"#06b6d4" },
    { key:"parking",       Ico:ParkingCircle,label:"Parking",          color:"#0284c7" },
  ];

  const FEAT_COM = [
    { key:"ascenseur",       Ico:ArrowUpDown,   label:"Ascenseur",         color:"#6366f1" },
    { key:"garage",          Ico:Car,           label:"Garage",            color:"#475569", extra:"nb_places_garage" },
    { key:"cellier",         Ico:Package,       label:"Cellier", color:"#92400e" },
    { key:"meuble",          Ico:Sofa,          label:"Meublé",            color:"#7c3aed" },
    { key:"concierge",       Ico:Users,         label:"Concierge",         color:"#0369a1" },
    { key:"gardien",         Ico:ShieldCheck,   label:"Gardien",           color:"#15803d" },
    { key:"animaux_admis",   Ico:Heart,         label:"Animaux admis",     color:"#ec4899" },
  ];

  const FEAT_INT = [
    { key:"cuisine_equipee",  Ico:UtensilsCrossed, label:"Cuisine équipée",   color:"#ea580c" },
    { key:"climatisation",    Ico:Wind,            label:"Climatisation",     color:"#0891b2" },
    { key:"chauffage_centrale",Ico:Thermometer,    label:"Chauffage central", color:"#dc2626" },
    { key:"cheminee",         Ico:Flame,           label:"Cheminée",          color:"#f97316" },
    { key:"salon_americain",  Ico:Tv,              label:"Salon américain",   color:"#6366f1" },
    { key:"double_vitrage",   Ico:DoorClosed,      label:"Double vitrage",    color:"#64748b" },
    { key:"porte_blindee",    Ico:LockKeyhole,     label:"Porte blindée",     color:"#374151" },
    { key:"securite",         Ico:Fingerprint,     label:"Sécurité",          color:"#ef4444" },
    { key:"internet",         Ico:Wifi,            label:"Internet",          color:"#10b981" },
    { key:"tv",               Ico:Monitor,         label:"TV",                color:"#8b5cf6" },
    { key:"machine_laver",    Ico:WashingMachineIco,label:"Machine à laver",  color:"#0284c7" },
    { key:"digicode",         Ico:KeyRound,        label:"Digicode",          color:"#7c3aed" },
    { key:"interphone",       Ico:PhoneCall,       label:"Interphone",        color:"#0369a1" },
    { key:"relie_onas",       Ico:Droplets,        label:"Relié ONAS",        color:"#0891b2" },
  ];

  if (loadingEdit) return (
    <Layout>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}>
        <div style={{width:40,height:40,border:"3px solid #e5e7eb",borderTopColor:"#6366f1",borderRadius:"50%",animation:"caSpin .7s linear infinite"}}/>
        <p style={{color:"#94a3b8",fontSize:14}}>Chargement de l'annonce…</p>
        <style>{`@keyframes caSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Layout>
  );

  if (loadingEditError) return (
    <Layout>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}>
        <p style={{color:"#ef4444",fontSize:15,fontWeight:600}}>Impossible de charger l'annonce.</p>
        <button type="button" onClick={() => window.history.back()}
          style={{padding:"10px 22px",borderRadius:10,background:"#0f172a",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:"pointer"}}>
          Retour
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="ca-root">
        {/* -- Left sidebar -- */}
        <aside className="ca-sidebar">
          <div className="ca-sidebar__inner">
            <div className="ca-sidebar__title">{editId ? "Modifier l'annonce" : "Créer une annonce"}</div>

            {/* Step list */}
            <nav className="ca-steps">
              {STEPS.map((s) => {
                const done    = currentStep > s.id;
                const active  = currentStep === s.id;
                /* En mode édition : toutes les étapes sont accessibles directement */
                const canClick = done || !!editId;
                return (
                  <div
                    key={s.id}
                    className={`ca-step${active ? " ca-step--active" : done ? " ca-step--done" : editId ? " ca-step--edit-nav" : " ca-step--future"}`}
                    onClick={canClick ? () => setCurrentStep(s.id) : undefined}
                    style={canClick && !active ? {cursor:"pointer"} : undefined}
                    title={canClick && !active ? s.label : undefined}
                  >
                    <div className="ca-step__circle">
                      {done ? <Check size={13} strokeWidth={3}/> : <span>{s.id}</span>}
                    </div>
                    <span className="ca-step__label">{s.label}</span>
                    {(done || (editId && !active)) && <span className="ca-step__back-ico">?</span>}
                  </div>
                );
              })}
            </nav>

            {/* Bouton Enregistrer — toujours visible en mode édition */}
            {editId && (
              <button
                type="button"
                className="ca-sidebar-save-btn"
                onClick={handleSubmit}
              >
                <Save size={15}/> Enregistrer
              </button>
            )}

            {/* Summary card */}
            {summary.length > 0 && (
              <div className="ca-summary">
                <div className="ca-summary__title">Récapitulatif</div>
                {summary.map((item, i) => (
                  <div key={i} className="ca-summary__row">
                    <span className="ca-summary__key">{item.label}</span>
                    <span className="ca-summary__val">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* -- Main area -- */}
        <main className="ca-main">

          {/* Mobile stepper (sidebar hidden on mobile) */}
          <div className="ca-mob-stepper">
            <div className="ca-mob-stepper__track">
              <div className="ca-mob-stepper__line"/>
              <div
                className="ca-mob-stepper__line-fill"
                style={{ width: `${Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)}%` }}
              />
              {STEPS.map((s) => {
                const done   = currentStep > s.id;
                const active = currentStep === s.id;
                const canClick = done || !!editId;
                return (
                  <button
                    key={s.id}
                    className={`ca-mob-step-dot${active?" ca-mob-step-dot--active":done?" ca-mob-step-dot--done":""}`}
                    style={{ left: `${((s.id - 1) / (totalSteps - 1)) * 100}%` }}
                    onClick={canClick ? () => setCurrentStep(s.id) : undefined}
                    title={s.label}
                    disabled={!canClick && !active}
                  >
                    {done ? <Check size={10} strokeWidth={3}/> : s.id}
                  </button>
                );
              })}
            </div>
            <div className="ca-mob-stepper__label">{STEPS[currentStep - 1]?.label}</div>
          </div>

          <form onSubmit={e => e.preventDefault()}>
            <div className="ca-card">

              {/* --- STEP 1 --- */}
              {currentStep === 1 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Building2 size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Type & Caractéristiques</h2>
                    <span className="ca-req-hint"><span className="ca-req">*</span> champs requis</span>
                  </div>

                  {/* -- Grille gauche / droite -- */}
                  <div className="ca-s1-lr">

                    {/* -- GAUCHE : sous-champs spécifiques, pièces, orientation -- */}
                    <div className="ca-s1-lr__left">

                      {/* Appartement sub-fields */}
                      {formData.type_bien === "appartement" && (
                        <div className="ca-row-2">
                          <div className="ca-field">
                            <label className="ca-label">Type de logement</label>
                            <select className="ca-select" value={formData.type_appartement}
                              onChange={e => handleInputChange("type_appartement", e.target.value)}>
                              <option value="">Sélectionner…</option>
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
                          <div className="ca-field">
                            <label className="ca-label">Étage du bien</label>
                            <select className="ca-select" value={formData.etage}
                              onChange={e => handleInputChange("etage", e.target.value)}>
                              <option value="">Sélectionner…</option>
                              <option value="0">RDC (Rez-de-chaussée)</option>
                              <option value="1">1er étage</option>
                              <option value="2">2ème étage</option>
                              <option value="3">3ème étage</option>
                              <option value="4">4ème+</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Local commercial : étage seul */}
                      {formData.type_bien === "local_commercial" && (
                        <div className="ca-field">
                          <label className="ca-label">Étage du bien</label>
                          <select className="ca-select" value={formData.etage}
                            onChange={e => handleInputChange("etage", e.target.value)}>
                            <option value="">Sélectionner…</option>
                            <option value="-1">Sous-sol</option>
                            <option value="0">RDC (Rez-de-chaussée)</option>
                            <option value="1">R+1</option>
                            <option value="2">R+2</option>
                            <option value="3">R+3</option>
                            <option value="4">R+4</option>
                          </select>
                        </div>
                      )}

                      {/* Bureau: étage + type de logement sur la même ligne */}
                      {formData.type_bien === "bureau" && (
                        <div className="ca-row-2">
                          <div className="ca-field">
                            <label className="ca-label">Étage du bien</label>
                            <select className="ca-select" value={formData.etage}
                              onChange={e => handleInputChange("etage", e.target.value)}>
                              <option value="">Sélectionner…</option>
                              <option value="-1">Sous-sol</option>
                              <option value="0">RDC (Rez-de-chaussée)</option>
                              <option value="1">R+1</option>
                              <option value="2">R+2</option>
                              <option value="3">R+3</option>
                              <option value="4">R+4</option>
                            </select>
                          </div>
                          <div className="ca-field">
                            <label className="ca-label">Type de bureau</label>
                            <select className="ca-select" value={formData.type_logement_bureau || ""}
                              onChange={e => handleInputChange("type_logement_bureau", e.target.value)}>
                              <option value="">Sélectionner…</option>
                              {["H0","H+1","H+2","H+3","H+4","H+5","Open Space"].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Villa sub-fields */}
                      {formData.type_bien === "villa" && (
                        <div className="ca-row-2">
                          <div className="ca-field">
                            <label className="ca-label">Type de villa</label>
                            <select className="ca-select" value={formData.type_villa}
                              onChange={e => handleInputChange("type_villa", e.target.value)}>
                              <option value="">Sélectionner…</option>
                              <option value="r">RDC (Rez-de-chaussée)</option>
                              <option value="r+1">R+1</option>
                              <option value="r+2">R+2</option>
                              <option value="r+3">R+3</option>
                              <option value="r+4">R+4</option>
                            </select>
                          </div>
                          <div className="ca-field">
                            <label className="ca-label">Options villa</label>
                            <div className="ca-toggle-group">
                              {[{v:"sous-sol",l:"Sous-sol"},{v:"rez-de-jardin",l:"Rez-de-jardin"},{v:"avec-garage",l:"Avec garage"}]
                                .map(opt => {
                                  const vals = (formData.type_option_villa||"").split(",").filter(Boolean);
                                  const on   = vals.includes(opt.v);
                                  return (
                                    <button key={opt.v} type="button"
                                      className={`ca-toggle-btn${on?" ca-toggle-btn--on":""}`}
                                      onClick={() => {
                                        const next = on ? vals.filter(x=>x!==opt.v) : [...vals,opt.v];
                                        handleInputChange("type_option_villa", next.join(","));
                                      }}>
                                      {on?<Check size={11}/>:null} {opt.l}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Terrain sub-fields */}
                      {formData.type_bien === "terrain" && (
                        <div style={{display:"flex",flexDirection:"column",gap:16}}>
                          <div className="ca-field">
                            <label className="ca-label">Type de terrain</label>
                            <select className="ca-select" value={formData.type_terrain}
                              onChange={e => handleInputChange("type_terrain", e.target.value)}>
                              <option value="">Sélectionner…</option>
                              <option value="agricole">Agricole</option>
                              <option value="nu">Nu</option>
                              <option value="zone_verte">Zone verte</option>
                              <option value="lotissement">Lotissement</option>
                              <option value="commercial">Commercial</option>
                              <option value="industriel">Industriel</option>
                            </select>
                          </div>
                          <div className="ca-field">
                            <label className="ca-label">Vocation du terrain</label>
                            <select
                              className="ca-select"
                              value={formData.vocation_terrain}
                              onChange={e => handleInputChange("vocation_terrain", e.target.value)}
                              style={vocIncompat ? {borderColor:"#ef4444", background:"#fff5f5"} : {}}>
                              <option value="">Sélectionner…</option>
                              <option value="residentielle">Résidentielle</option>
                              <option value="commerciale">Commerciale</option>
                              <option value="industrielle">Industrielle</option>
                              <option value="agricole">Agricole</option>
                              <option value="touristique">Touristique / Hôtelière</option>
                              <option value="mixte">Mixte</option>
                              <option value="non_definie">Non définie</option>
                            </select>
                            {vocIncompat && (
                              <p style={{
                                margin:"6px 0 0", fontSize:12, color:"#dc2626",
                                display:"flex", alignItems:"center", gap:5,
                                background:"#fef2f2", border:"1px solid #fecaca",
                                borderRadius:7, padding:"5px 10px", lineHeight:1.4
                              }}>
                                ⚠️ Incompatibilité : un terrain <strong>{TYPE_TERRAIN_LABELS[formData.type_terrain]}</strong> ne peut pas avoir la vocation <strong>{VOCATION_LABELS[formData.vocation_terrain]}</strong>.
                              </p>
                            )}
                          </div>
                          <div className={`ca-tf-row${validationErrors.titre_foncier?" ca-val-group--err":""}`}>
                            <span className="ca-tf-label">Titre foncier</span>
                            <div className="ca-tf-btns">
                              <button type="button"
                                className={`ca-tf-btn${formData.titre_foncier==="1"?" ca-tf-btn--on":""}`}
                                onClick={() => { handleInputChange("titre_foncier","1"); setValidationErrors(v=>({...v,titre_foncier:false})); }}>Oui</button>
                              <button type="button"
                                className={`ca-tf-btn${formData.titre_foncier==="0"?" ca-tf-btn--on ca-tf-btn--no":""}`}
                                onClick={() => { handleInputChange("titre_foncier","0"); setValidationErrors(v=>({...v,titre_foncier:false})); }}>Non</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Immeuble sub-fields */}
                      {formData.type_bien === "immeuble" && (
                        <div style={{display:"flex",flexDirection:"column",gap:14}}>
                          <div className="ca-field">
                            <label className="ca-label">Hauteur de l'immeuble</label>
                            <select className="ca-select" value={formData.hauteur_immeuble}
                              onChange={e => handleInputChange("hauteur_immeuble", e.target.value)}>
                              <option value="">Sélectionner…</option>
                              <option value="R">R (Rez-de-chaussée seul)</option>
                              {Array.from({length:15},(_,i)=>i+1).map(n => (
                                <option key={n} value={`R+${n}`}>R+{n}</option>
                              ))}
                            </select>
                          </div>
                          <div className="ca-field">
                            <label className="ca-label">Nombre d'appartements</label>
                            <input type="number" className="ca-input" min={1} max={500}
                              placeholder="Ex : 12"
                              value={formData.nb_appartements}
                              onChange={e => handleInputChange("nb_appartements", e.target.value)}/>
                          </div>
                          <div className="ca-field">
                            <label className="ca-label">Orientation principale</label>
                            <div className="ca-toggle-group" style={{flexWrap:"wrap"}}>
                              {[
                                {v:"nord",l:"Nord"},{v:"nord_est",l:"Nord-Est"},{v:"est",l:"Est"},
                                {v:"sud_est",l:"Sud-Est"},{v:"sud",l:"Sud"},{v:"sud_ouest",l:"Sud-Ouest"},
                                {v:"ouest",l:"Ouest"},{v:"nord_ouest",l:"Nord-Ouest"},
                              ].map(opt => (
                                <button key={opt.v} type="button"
                                  className={`ca-toggle-btn${formData.orientation_immeuble===opt.v?" ca-toggle-btn--on":""}`}
                                  onClick={() => handleInputChange("orientation_immeuble",
                                    formData.orientation_immeuble===opt.v ? "" : opt.v)}>
                                  {formData.orientation_immeuble===opt.v && <Check size={11}/>} {opt.l}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Garage/Parking sub-fields */}
                      {formData.type_bien === "garage_parking" && (
                        <div className="ca-field">
                          <label className="ca-label">Emplacement</label>
                          <div className="ca-toggle-group">
                            {[
                              {v:"en_exterieur", l:"En extérieur"},
                              {v:"en_sous_sol",  l:"En sous-sol"},
                            ].map(opt => (
                              <button key={opt.v} type="button"
                                className={`ca-toggle-btn${formData.emplacement_garage===opt.v?" ca-toggle-btn--on":""}`}
                                onClick={() => handleInputChange("emplacement_garage", opt.v)}>
                                {formData.emplacement_garage===opt.v ? <Check size={11}/> : null} {opt.l}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pièces & espaces */}
                      {!["terrain","garage_parking","immeuble","depot_stockage"].includes(formData.type_bien) && (<>
                        <div className="ca-section-label" style={{marginTop:20}}>Pièces & espaces</div>
                        <div className="ca-counters">
                          {[
                            { field:"nb_pieces",     label:"Pièce(s)" },
                            { field:"nb_chambres",   label:"Chambre(s)" },
                            { field:"nb_salles_bain",label:"Salle(s) de bain" },
                          ].map(c => (
                            <div key={c.field} className={`ca-counter${validationErrors[c.field] ? " ca-counter--err" : ""}`}>
                              <span className="ca-counter__label" style={validationErrors[c.field] ? {color:"#ef4444"} : {}}>
                                {c.label} <span style={{color:"#ef4444",fontWeight:700}}>*</span>
                              </span>
                              <div className="ca-counter__ctrl">
                                <button type="button" className="ca-counter__btn" onClick={() => decrementValue(c.field)}><Minus size={14}/></button>
                                <span className="ca-counter__val">{formData[c.field]}</span>
                                <button type="button" className="ca-counter__btn" onClick={() => incrementValue(c.field)}><Plus size={14}/></button>
                              </div>
                            </div>
                          ))}
                          {formData.categorie === "vacances" && (
                            <div className={`ca-counter${validationErrors.capacite_accueil ? " ca-counter--err" : ""}`}>
                              <span className="ca-counter__label" style={validationErrors.capacite_accueil ? {color:"#ef4444"} : {}}>
                                Capacité d'accueil <span style={{color:"#ef4444",fontWeight:700}}>*</span>{" "}
                                <span style={{color:"#9ca3af",fontWeight:400,fontSize:"10px"}}>(pers.)</span>
                              </span>
                              <div className="ca-counter__ctrl">
                                <button type="button" className="ca-counter__btn" onClick={() => setFormData(f => ({...f, capacite_accueil: Math.max(1, (f.capacite_accueil||1) - 1)}))}><Minus size={14}/></button>
                                <span className="ca-counter__val">{formData.capacite_accueil || 0}</span>
                                <button type="button" className="ca-counter__btn" onClick={() => setFormData(f => ({...f, capacite_accueil: Math.min(50, (f.capacite_accueil||0) + 1)}))}><Plus size={14}/></button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>)}

                      {/* Orientation */}
                      {(formData.type_bien==="appartement"||formData.type_bien==="villa"||formData.type_bien==="local_commercial"||formData.type_bien==="bureau") && (
                        <div style={{marginTop:16}}>
                          <div className="ca-section-label">Orientation <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none",fontSize:"10px"}}>(optionnel)</span></div>
                          <div className="ca-toggle-group">
                            {["Nord","Sud","Est","Ouest","Nord-Est","Nord-Ouest","Sud-Est","Sud-Ouest"].map(o => {
                              const on = formData.orientation===o;
                              return (
                                <button key={o} type="button"
                                  className={`ca-toggle-btn${on?" ca-toggle-btn--on":""}`}
                                  onClick={() => handleInputChange("orientation", on?"":o)}>
                                  {on&&<Check size={11}/>} {o}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Section Colocation ── pour location et vacances appart/villa */}
                      {["location","vacances"].includes(formData.categorie) && ["appartement","villa"].includes(formData.type_bien) && (
                        <div style={{marginTop:20,padding:"18px 20px",background:"#f8fafc",borderRadius:16,border:"1.5px solid #e2e8f0"}}>
                          {/* Toggle header */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: formData.colocation ? 16 : 0}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:34,height:34,borderRadius:10,background: formData.colocation ? "#eef2ff" : "#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <Users size={17} color={formData.colocation ? "#6366f1" : "#94a3b8"} strokeWidth={2}/>
                              </div>
                              <div>
                                <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a"}}>Colocation</div>
                                <div style={{fontSize:11,color:"#94a3b8"}}>Proposer des chambres à partager</div>
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              {formData.colocation && (
                                <select
                                  value={formData.devise || "TND"}
                                  onChange={e => handleInputChange("devise", e.target.value)}
                                  style={{padding:"4px 8px",borderRadius:8,border:"1.5px solid #c7d2fe",background:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:700,color:"#4338ca",cursor:"pointer",outline:"none"}}
                                >
                                  <option value="TND">TND</option>
                                  <option value="EUR">EUR</option>
                                  <option value="USD">USD</option>
                                </select>
                              )}
                              <label style={{position:"relative",display:"inline-block",width:44,height:24,flexShrink:0,cursor:"pointer"}}>
                                <input type="checkbox" checked={!!formData.colocation}
                                  onChange={e => handleInputChange("colocation", e.target.checked)}
                                  style={{opacity:0,width:0,height:0}}/>
                                <span style={{position:"absolute",inset:0,background: formData.colocation ? "#6366f1" : "#e2e8f0",borderRadius:24,transition:".2s"}}/>
                                <span style={{position:"absolute",width:18,height:18,background:"#fff",borderRadius:"50%",top:3,left: formData.colocation ? 23 : 3,transition:".2s",boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}/>
                              </label>
                            </div>
                          </div>

                          {formData.colocation && (<>
                            {/* Profil recherché */}
                            <div style={{marginBottom:16}}>
                              <label style={{fontSize:11.5,fontWeight:700,color:"#374151",display:"block",marginBottom:7}}>Profil recherché</label>
                              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                {[
                                  {value:"etudiant",      label:"Étudiant(e)s"},
                                  {value:"professionnel", label:"Professionnels"},
                                  {value:"famille",       label:"Familles"},
                                  {value:"tous",          label:"Peu importe"},
                                ].map(p => (
                                  <button key={p.value} type="button"
                                    onClick={() => handleInputChange("profil_coloc", p.value)}
                                    style={{padding:"6px 12px",borderRadius:20,border: formData.profil_coloc===p.value ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
                                      background: formData.profil_coloc===p.value ? "#eef2ff" : "#fff",
                                      color: formData.profil_coloc===p.value ? "#6366f1" : "#64748b",
                                      fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Genre accepté */}
                            <div style={{marginBottom:16}}>
                              <label style={{fontSize:11.5,fontWeight:700,color:"#374151",display:"block",marginBottom:7}}>Genre accepté</label>
                              <div style={{display:"flex",gap:10}}>
                                {[
                                  { value:"homme", label:"Homme", icon:(
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/>
                                    </svg>
                                  )},
                                  { value:"femme", label:"Femme", icon:(
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="8" r="4"/><path d="M12 12v9m-3-3h6"/><path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20"/>
                                    </svg>
                                  )},
                                ].map(g => {
                                  const selected = (formData.genre_coloc||[]).includes(g.value);
                                  const toggle = () => {
                                    const cur = formData.genre_coloc || [];
                                    handleInputChange("genre_coloc", selected ? cur.filter(x=>x!==g.value) : [...cur, g.value]);
                                  };
                                  return (
                                    <button key={g.value} type="button" onClick={toggle}
                                      style={{
                                        display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                                        padding:"10px 22px",borderRadius:14,cursor:"pointer",fontFamily:"inherit",
                                        border: selected ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
                                        background: selected ? "#eef2ff" : "#fff",
                                        color: selected ? "#6366f1" : "#94a3b8",
                                        fontWeight:700,fontSize:12,transition:"all .15s",
                                        boxShadow: selected ? "0 0 0 3px rgba(99,102,241,.12)" : "none",
                                      }}>
                                      <span style={{color: selected ? "#6366f1" : "#94a3b8"}}>{g.icon}</span>
                                      {g.label}
                                    </button>
                                  );
                                })}
                                {/* Indicateur "les deux" */}
                                {(formData.genre_coloc||[]).length === 2 && (
                                  <div style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,background:"#f0fdf4",border:"1.5px solid #bbf7d0",color:"#16a34a",fontSize:11.5,fontWeight:700,alignSelf:"center"}}>
                                    ✓ Mixte accepté
                                  </div>
                                )}
                                {(formData.genre_coloc||[]).length === 0 && (
                                  <div style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,background:"#fefce8",border:"1.5px solid #fde68a",color:"#92400e",fontSize:11.5,fontWeight:600,alignSelf:"center"}}>
                                    Sélectionnez au moins un
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tableau par chambre */}
                            {(() => {
                              const nb = parseInt(formData.nb_chambres) || 0;
                              const rows = formData.chambres_coloc || [];
                              if (nb === 0) return (
                                <div style={{fontSize:11.5,color:"#94a3b8",padding:"8px 0",textAlign:"center",background:"#f1f5f9",borderRadius:8,padding:"10px"}}>
                                  Renseignez le nombre de chambres ci-dessus pour configurer les places.
                                </div>
                              );
                              const totalCap  = rows.reduce((s,c)=>s+(c.capacite||1),0);
                              const totalOcc  = rows.reduce((s,c)=>s+(c.places_occupees||0),0);
                              const totalDispo = totalCap - totalOcc;
                              return (
                                <>
                                  <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #e2e8f0"}}>
                                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                                      <thead>
                                        <tr style={{background:"#eef2ff"}}>
                                          <th style={{padding:"7px 10px",fontWeight:700,color:"#4338ca",textAlign:"left"}}>Chambre</th>
                                          <th style={{padding:"7px 10px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Capacité personnes</th>
                                          <th style={{padding:"7px 10px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Places déjà occupées</th>
                                          <th style={{padding:"7px 10px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Disponibles</th>
                                          <th style={{padding:"7px 10px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Prix/place ({formData.devise || "TND"})</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Array.from({length: nb}, (_, i) => {
                                          const row = rows[i] || { capacite: 1, places_occupees: 0, prix_par_place: 0 };
                                          const dispo = Math.max(0, (row.capacite||1) - (row.places_occupees||0));
                                          return (
                                            <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background: i%2===0?"#fff":"#f8fafc"}}>
                                              <td style={{padding:"7px 10px",fontWeight:700,color:"#374151"}}>Ch. {i+1}</td>
                                              <td style={{padding:"5px 10px",textAlign:"center"}}>
                                                <select value={row.capacite||1}
                                                  onChange={e => {
                                                    const cap = parseInt(e.target.value)||1;
                                                    setFormData(prev => {
                                                      const arr = [...(prev.chambres_coloc||[])];
                                                      arr[i] = {...(arr[i]||{}), capacite: cap, places_occupees: Math.min(arr[i]?.places_occupees||0, cap)};
                                                      return {...prev, chambres_coloc: arr};
                                                    });
                                                  }}
                                                  style={{padding:"3px 5px",borderRadius:6,border:"1.5px solid #c7d2fe",background:"#fff",fontFamily:"inherit",fontSize:11.5,color:"#374151",cursor:"pointer",outline:"none"}}
                                                >
                                                  {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} pers.</option>)}
                                                </select>
                                              </td>
                                              <td style={{padding:"5px 10px",textAlign:"center"}}>
                                                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                                                  <button type="button"
                                                    onClick={() => setFormData(prev => {
                                                      const arr = [...(prev.chambres_coloc||[])];
                                                      arr[i] = {...(arr[i]||{}), places_occupees: Math.max(0,(arr[i]?.places_occupees||0)-1)};
                                                      return {...prev, chambres_coloc: arr};
                                                    })}
                                                    style={{width:18,height:18,borderRadius:4,border:"1px solid #c7d2fe",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#6366f1",fontSize:12,lineHeight:1}}>−</button>
                                                  <span style={{minWidth:16,textAlign:"center",fontWeight:700,color:"#0f172a",fontSize:12}}>{row.places_occupees||0}</span>
                                                  <button type="button"
                                                    onClick={() => setFormData(prev => {
                                                      const arr = [...(prev.chambres_coloc||[])];
                                                      const cap = arr[i]?.capacite||1;
                                                      arr[i] = {...(arr[i]||{}), places_occupees: Math.min(cap,(arr[i]?.places_occupees||0)+1)};
                                                      return {...prev, chambres_coloc: arr};
                                                    })}
                                                    style={{width:18,height:18,borderRadius:4,border:"1px solid #c7d2fe",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#6366f1",fontSize:12,lineHeight:1}}>+</button>
                                                </div>
                                              </td>
                                              <td style={{padding:"7px 10px",textAlign:"center"}}>
                                                <span style={{fontWeight:800,fontSize:13,color: dispo>0?"#059669":"#dc2626"}}>{dispo}</span>
                                              </td>
                                              <td style={{padding:"5px 8px",textAlign:"center"}}>
                                                <input type="text" inputMode="numeric"
                                                  value={row.prix_par_place === 0 ? "" : row.prix_par_place}
                                                  placeholder="0"
                                                  onFocus={e => e.target.select()}
                                                  onChange={e => {
                                                    const val = parseInt(e.target.value.replace(/\D/g,""))||0;
                                                    setFormData(prev => {
                                                      const arr = [...(prev.chambres_coloc||[])];
                                                      arr[i] = {...(arr[i]||{}), prix_par_place: val};
                                                      return {...prev, chambres_coloc: arr};
                                                    });
                                                  }}
                                                  style={{width:72,padding:"3px 5px",borderRadius:6,border:"1.5px solid #c7d2fe",background:"#fff",fontFamily:"inherit",fontSize:11.5,color:"#374151",outline:"none",textAlign:"center"}}
                                                />
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                      <tfoot>
                                        {(() => {
                                          const totalPrix = rows.reduce((s,c)=>s+((c.capacite||1)*(c.prix_par_place||0)),0);
                                          return (
                                            <tr style={{background:"#eef2ff",borderTop:"2px solid #c7d2fe"}}>
                                              <td style={{padding:"7px 10px",fontWeight:800,color:"#4338ca",fontSize:12}}>Total</td>
                                              <td style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color:"#4338ca",fontSize:12}}>{totalCap}</td>
                                              <td style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color:"#4338ca",fontSize:12}}>{totalOcc}</td>
                                              <td style={{padding:"7px 10px",textAlign:"center",fontWeight:800,fontSize:13,color: totalDispo>0?"#059669":"#dc2626"}}>{totalDispo}</td>
                                              <td style={{padding:"7px 10px",textAlign:"center",fontWeight:800,fontSize:12,color:"#4338ca"}}>{totalPrix.toLocaleString()} {formData.devise || "TND"}</td>
                                            </tr>
                                          );
                                        })()}
                                      </tfoot>
                                    </table>
                                  </div>
                                  {totalDispo < 1 && (
                                    <div style={{marginTop:8,padding:"7px 12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,fontSize:11.5,color:"#dc2626",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                                      <span>⚠</span> Au moins 1 place doit être disponible pour activer la colocation.
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </>)}
                        </div>
                      )}

                      {/* Spécificités commerciales — local_commercial uniquement */}
                      {formData.type_bien === "local_commercial" && (
                        <div style={{marginTop:16}}>
                          <div className="ca-section-label">Spécificités commerciales <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none",fontSize:"10px"}}>(optionnel)</span></div>

                          {/* Fonds de commerce */}
                          <div style={{marginBottom:8}}>
                            <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Fonds de commerce</div>
                            <div className="ca-toggle-group">
                              {[{v:"avec",l:"Avec fonds de commerce"},{v:"sans",l:"Sans fonds de commerce"}].map(opt => {
                                const on = formData.fonds_de_commerce === opt.v;
                                return (
                                  <button key={opt.v} type="button"
                                    className={`ca-toggle-btn${on?" ca-toggle-btn--on":""}`}
                                    onClick={() => handleInputChange("fonds_de_commerce", on ? "" : opt.v)}>
                                    {on && <Check size={11}/>} {opt.l}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Pas de porte */}
                          <div>
                            <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Pas de porte</div>
                            <div className="ca-toggle-group">
                              {[{v:"avec",l:"Avec pas de porte"},{v:"sans",l:"Sans pas de porte"}].map(opt => {
                                const on = formData.pas_de_porte === opt.v;
                                return (
                                  <button key={opt.v} type="button"
                                    className={`ca-toggle-btn${on?" ca-toggle-btn--on":""}`}
                                    onClick={() => handleInputChange("pas_de_porte", on ? "" : opt.v)}>
                                    {on && <Check size={11}/>} {opt.l}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>{/* /ca-s1-lr__left */}

                    {/* -- DROITE : type, offre, état, ancienneté -- */}
                    <div className="ca-s1-lr__right">

                      <div className="ca-section-label">Sélectionnez le type <span className="ca-req">*</span></div>

                      {/* Desktop : boutons */}
                      <div className={`ca-etat-row ca-type-btn-grid${validationErrors.type_bien?" ca-etat-row--err":""}`} style={{flexWrap:"wrap"}}>
                        {TYPE_CARDS.map(tc => {
                          const isOn = formData.type_bien === tc.value;
                          return (
                            <button key={tc.value} type="button"
                              className={`ca-etat-card${isOn ? " ca-etat-card--on" : ""}`}
                              onClick={() => { handleInputChange("type_bien", tc.value); setValidationErrors(v=>({...v,type_bien:false})); }}>
                              <span style={{display:"flex",alignItems:"center"}}><tc.Ico size={22}/></span>
                              <span>{tc.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Mobile : dropdown personnalisé avec icônes */}
                      <div className="ca-type-drop-mob" style={{position:"relative"}}>
                        <button
                          type="button"
                          className={validationErrors.type_bien ? "ca-type-drop-mob__btn ca-type-drop-mob__btn--err" : "ca-type-drop-mob__btn"}
                          onClick={() => setTypeDropOpen(v => !v)}
                        >
                          {(() => {
                            const sel = TYPE_CARDS.find(t => t.value === formData.type_bien);
                            return sel
                              ? <><span className="ca-type-drop-mob__ico"><sel.Ico size={18}/></span><span>{sel.label}</span></>
                              : <span style={{color:"#94a3b8"}}>— Sélectionner le type —</span>;
                          })()}
                          <span className="ca-type-drop-mob__arrow">{typeDropOpen ? "▲" : "▼"}</span>
                        </button>
                        {typeDropOpen && (
                          <div className="ca-type-drop-mob__list">
                            {TYPE_CARDS.map(tc => (
                              <button
                                key={tc.value}
                                type="button"
                                className={`ca-type-drop-mob__opt${formData.type_bien===tc.value?" ca-type-drop-mob__opt--on":""}`}
                                onClick={() => {
                                  handleInputChange("type_bien", tc.value);
                                  setValidationErrors(v=>({...v,type_bien:false}));
                                  setTypeDropOpen(false);
                                }}
                              >
                                <span className="ca-type-drop-mob__ico"><tc.Ico size={16}/></span>
                                {tc.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="ca-section-label" style={{marginTop:20}}>Type d'offre <span className="ca-req">*</span></div>
                      <div className={`ca-pill-row${validationErrors.categorie?" ca-pill-row--err":""}`}>
                        {[{v:"vente",l:"Vente"},{v:"location",l:"Location"},{v:"vacances",l:"Vacances"}]
                          .filter(o => !(o.v==="vacances"&&(["terrain","local_commercial","immeuble","garage_parking","depot_stockage","bureau"].includes(formData.type_bien))))
                          .map(o => (
                            <button key={o.v} type="button"
                              className={`ca-pill${formData.categorie===o.v?" ca-pill--on":""}`}
                              onClick={() => { handleInputChange("categorie", o.v); setValidationErrors(v=>({...v,categorie:false})); }}>
                              {o.l}
                            </button>
                        ))}
                      </div>

                      {/* Durée vacances */}
                      {formData.categorie === "vacances" && (
                        <div className="ca-row-2" style={{marginTop:12}}>
                          <div className="ca-field">
                            <label className="ca-label">Durée</label>
                            <select
                              className={`ca-select${validationErrors.duree_type ? " ca-select--err" : ""}`}
                              value={formData.duree_type||""}
                              onChange={e => { handleInputChange("duree_type", e.target.value); setValidationErrors(v=>({...v,duree_type:false})); }}>
                              <option value="">Sélectionner… *</option>
                              <option value="nuit">Par nuitée</option>
                              <option value="semaine">Par semaine</option>
                              <option value="mois">Par mois</option>
                              <option value="annee">Par an</option>
                            </select>
                          </div>
                          <div className="ca-field">
                            <label className="ca-label">Minimum</label>
                            <div className="ca-input-unit">
                              <input type="number" className="ca-input" placeholder="1" min="1" max="365"
                                value={formData.duree_valeur||""}
                                onChange={e => handleInputChange("duree_valeur", e.target.value)}/>
                              <span className="ca-unit">
                                {formData.duree_type==="nuit"?"nuitée(s)":formData.duree_type==="semaine"?"sem.":formData.duree_type==="mois"?"mois":formData.duree_type==="annee"?"an(s)":"—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* État du bien — masqué pour terrain */}
                      {formData.type_bien !== "terrain" && (<>
                        <div className="ca-section-label" style={{marginTop:20, color: validationErrors.etat_bien ? "#ef4444" : undefined}}>
                          État du bien <span style={{color:"#ef4444",fontWeight:700}}>*</span>
                        </div>
                        <div className={`ca-etat-row${validationErrors.etat_bien ? " ca-etat-row--err" : ""}`}>
                          {ETAT_CARDS
                            .filter(ec => {
                              if (ec.value==="cours_construction" && (formData.categorie==="location"||formData.categorie==="vacances")) return false;
                              if (ec.value==="a_renover" && formData.categorie==="vacances") return false;
                              return true;
                            })
                            .map(ec => {
                              const isOn = formData.etat_bien===ec.value;
                              return (
                                <button key={ec.value} type="button"
                                  className={`ca-etat-card${isOn?" ca-etat-card--on":""}`}
                                  onClick={() => handleInputChange("etat_bien", ec.value)}>
                                  <span style={{display:"flex",alignItems:"center"}}><ec.Ico size={20}/></span>
                                  <span>{ec.label}</span>
                                </button>
                              );
                          })}
                        </div>

                        {/* Livraison prévue — si en cours de construction */}
                        {formData.etat_bien === "cours_construction" && (
                          <div style={{marginTop:12}}>
                            <div className="ca-section-label">
                              Date de livraison prévue
                              <span style={{color:"#9ca3af",fontWeight:400,textTransform:"none",fontSize:"10px",marginLeft:6}}>(estimation)</span>
                            </div>
                            <input
                              type="month"
                              className="ca-input"
                              value={formData.livraison_prevue||""}
                              onChange={e => handleInputChange("livraison_prevue", e.target.value)}
                              min={new Date().toISOString().slice(0,7)}
                              style={{width:"100%", padding:"10px 12px", borderRadius:9, border:"1.5px solid #e5e7eb", fontFamily:"inherit", fontSize:13.5, outline:"none", background:"#f8fafc"}}
                            />
                          </div>
                        )}
                        {formData.etat_bien && formData.etat_bien !== "nouveau" && formData.etat_bien !== "cours_construction" && (
                          <div style={{marginTop:12}}>
                            <div className="ca-section-label">Ancienneté du bien</div>
                            <select className="ca-select" value={formData.age_bien}
                              onChange={e => handleInputChange("age_bien", e.target.value)}>
                              <option value="">Sélectionnez…</option>
                              <option value="moins_1an">Moins d'un an</option>
                              <option value="1_5ans">D'un an à 5 ans</option>
                              <option value="5_10ans">De 5 ans à 10 ans</option>
                              <option value="10_20ans">De 10 ans à 20 ans</option>
                              <option value="20_30ans">De 20 ans à 30 ans</option>
                              <option value="30_50ans">De 30 ans à 50 ans</option>
                              <option value="50_70ans">De 50 ans à 70 ans</option>
                              <option value="70_100ans">De 70 ans à 100 ans</option>
                              <option value="plus_100ans">Plus de 100 ans</option>
                            </select>
                          </div>
                        )}
                      </>)}

                      {/* Niveau de standing */}
                      {["appartement","villa","villa_maison","immeuble","local_commercial","bureau"].includes(formData.type_bien) && (
                        <div style={{marginTop:20}}>
                          <div className="ca-section-label">Niveau de standing</div>
                          <div className="ca-etat-row" style={{flexWrap:"wrap"}}>
                            {[
                              { value:"economique",     label:"Économique",     Ico: Layers   },
                              { value:"moyen_standing", label:"Moyen standing", Ico: Building2 },
                              { value:"haut_standing",  label:"Haut standing",  Ico: Crown     },
                            ].map(s => {
                              const isOn = formData.standing === s.value;
                              return (
                                <button key={s.value} type="button"
                                  className={`ca-etat-card${isOn?" ca-etat-card--on":""}`}
                                  onClick={() => handleInputChange("standing", isOn ? "" : s.value)}>
                                  <span style={{display:"flex",alignItems:"center"}}><s.Ico size={20}/></span>
                                  <span>{s.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}


                    </div>{/* /ca-s1-lr__right */}
                  </div>{/* /ca-s1-lr */}

                  {/* -- Caractéristiques — directement dans la page, sans wrapper -- */}

                  {!["garage_parking","depot_stockage"].includes(formData.type_bien) && <>
                  <div className="ca-feats-section-title" style={{marginTop:40, paddingTop:28, borderTop:"1.5px solid #f1f5f9"}}>Vue</div>
                  <div className="ca-feat-big-grid">
                    {FEAT_VUE.map(item => {
                      const isOn = !!formData[item.key];
                      return (
                        <button key={item.key} type="button"
                          className={`ca-feat-big${isOn ? " ca-feat-big--on" : ""}`}
                          onClick={() => handleCheckboxChange(item.key)}>
                          <span className="ca-feat-big__ico"><item.Ico size={52} strokeWidth={1.3}/></span>
                          <span className="ca-feat-big__label">{item.label}</span>
                          {isOn && <Check size={13} className="ca-feat-big__check"/>}
                        </button>
                      );
                    })}
                  </div>

                  {!["terrain","garage_parking","depot_stockage"].includes(formData.type_bien) && (
                    <>
                      <div className="ca-feats-section-title" style={{marginTop:36}}>Espaces extérieurs</div>
                      <div className="ca-feat-big-grid">
                        {FEAT_EXT.map(item => {
                          const isOn = !!formData[item.key];
                          return (
                            <div key={item.key} className="ca-feat-big-wrap">
                              <button type="button"
                                className={`ca-feat-big${isOn ? " ca-feat-big--on" : ""}`}
                                onClick={() => handleCheckboxChange(item.key)}>
                                <span className="ca-feat-big__ico"><item.Ico size={52} strokeWidth={1.3}/></span>
                                <span className="ca-feat-big__label">{item.label}</span>
                                {isOn && <Check size={13} className="ca-feat-big__check"/>}
                              </button>
                              {isOn && item.extra && item.extra !== "nb_places_garage" && (
                                <div className="ca-feat-big-extra">
                                  <div className="ca-feat-big-extra__label">Surface (m²)</div>
                                  <input type="number" className="ca-input ca-input--sm" placeholder="m²" min="1"
                                    value={formData[item.extra] || ""}
                                    onChange={e => handleInputChange(item.extra, e.target.value)}/>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {!["terrain","garage_parking","depot_stockage"].includes(formData.type_bien) && (<>
                    <div className="ca-feats-section-title" style={{marginTop:36}}>Commodités</div>
                    <div className="ca-feat-big-grid">
                      {FEAT_COM.map(item => {
                        const isOn = !!formData[item.key];
                        return (
                          <div key={item.key} className="ca-feat-big-wrap">
                            <button type="button"
                              className={`ca-feat-big${isOn ? " ca-feat-big--on" : ""}`}
                              onClick={() => handleCheckboxChange(item.key)}>
                              <span className="ca-feat-big__ico"><item.Ico size={52} strokeWidth={1.3}/></span>
                              <span className="ca-feat-big__label">{item.label}</span>
                              {isOn && <Check size={13} className="ca-feat-big__check"/>}
                            </button>
                            {isOn && item.extra === "nb_places_garage" && (
                              <div className="ca-feat-big-extra">
                                <div className="ca-feat-big-extra__label">Places</div>
                                <div className="ca-counter__ctrl">
                                  <button type="button" className="ca-counter__btn"
                                    onClick={() => formData.nb_places_garage > 1 && handleInputChange("nb_places_garage", formData.nb_places_garage - 1)}>
                                    <Minus size={13}/>
                                  </button>
                                  <span className="ca-counter__val" style={{fontSize:16}}>{formData.nb_places_garage || 1}</span>
                                  <button type="button" className="ca-counter__btn"
                                    onClick={() => (formData.nb_places_garage || 1) < 10 && handleInputChange("nb_places_garage", (formData.nb_places_garage || 1) + 1)}>
                                    <Plus size={13}/>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="ca-feats-section-title" style={{marginTop:36}}>Intérieur &amp; équipements</div>
                    <div className="ca-feat-big-grid">
                      {FEAT_INT.map(item => {
                        const isOn = !!formData[item.key];
                        return (
                          <button key={item.key} type="button"
                            className={`ca-feat-big${isOn ? " ca-feat-big--on" : ""}`}
                            onClick={() => handleCheckboxChange(item.key)}>
                            <span className="ca-feat-big__ico"><item.Ico size={52} strokeWidth={1.3}/></span>
                            <span className="ca-feat-big__label">{item.label}</span>
                            {isOn && <Check size={13} className="ca-feat-big__check"/>}
                          </button>
                        );
                      })}
                    </div>
                  </>)}
                  </>}

                </div>
              )}

              {/* --- STEP 2 --- */}
              {currentStep === 2 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <MapPin size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Localisation</h2>
                    <span className="ca-req-hint"><span className="ca-req">*</span> champs requis</span>
                  </div>

                  {/* Two-column layout */}
                  <div className="ca-loc-layout">

                    {/* Left — champs */}
                    <div className="ca-loc-fields">
                      <div className="ca-section-label">Zone géographique <span className="ca-req">*</span></div>
                      <div className="ca-field">
                        <label className="ca-label">Gouvernorat <span className="ca-req">*</span></label>
                        <select
                          className={`ca-select${validationErrors.gouvernorat?" ca-select--err":""}`}
                          value={hierarchy.gouvernorat}
                          onChange={e => { handleHierarchyChange("gouvernorat", e.target.value); setValidationErrors(v=>({...v,gouvernorat:false})); }}>
                          <option value="">Gouvernorat</option>
                          {(gouvernorats || []).map(gov => (
                            <option key={gov.value} value={gov.value}>{gov.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="ca-field">
                        <label className="ca-label">Délégation <span className="ca-req">*</span></label>
                        <select
                          className={`ca-select${validationErrors.delegation?" ca-select--err":""}`}
                          value={hierarchy.delegation}
                          disabled={!hierarchy.gouvernorat}
                          onChange={e => { handleHierarchyChange("delegation", e.target.value); setZoneStatus(null); setValidationErrors(v=>({...v,delegation:false})); }}>
                          <option value="">{hierarchy.gouvernorat ? "Sélectionnez une délégation" : "Sélectionnez un gouvernorat d'abord"}</option>
                          {(delegations || []).map(d => (
                            <option key={d.id} value={d.id}>{d.nom || ""}</option>
                          ))}
                        </select>
                      </div>
                      <div className="ca-field">
                        <label className="ca-label">Localité</label>
                        <select className="ca-select" value={hierarchy.localite}
                          disabled={!hierarchy.delegation}
                          onChange={e => handleHierarchyChange("localite", e.target.value)}>
                          <option value="">{hierarchy.delegation ? "Toutes les localités" : "Sélectionnez une délégation"}</option>
                          {(localites || []).map(l => (
                            <option key={l.id} value={l.id}>{l.nom || ""}</option>
                          ))}
                        </select>
                      </div>

                      {/* Ligne : label + boutons côte à côte */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:18,marginBottom:6}}>
                        <span className="ca-section-label" style={{margin:0}}>Adresse exacte</span>
                        <div style={{display:"flex",gap:6}}>
                          <button type="button" className="ca-geo-btn ca-geo-btn--search" onClick={geocodeAddress} title="Chercher sur la carte">
                            <MapPin size={15}/>
                          </button>
                          <button type="button" className="ca-geo-btn" onClick={handleGeolocate} disabled={isGeolocating} title="Position actuelle">
                            {isGeolocating ? <Loader size={15} className="ca-spin"/> : <Navigation size={15}/>}
                          </button>
                        </div>
                      </div>
                      {addressWarning && (
                        <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:8,padding:"7px 12px",fontSize:12,color:"#92400e",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                          <AlertTriangle size={13} style={{flexShrink:0}}/>{addressWarning}
                        </div>
                      )}
                      {/* Input pleine largeur avec dropdown historique */}
                      <div style={{position:"relative",width:"100%"}}>
                        <input
                          type="text"
                          className="ca-input"
                          style={{width:"100%",boxSizing:"border-box"}}
                          placeholder="Ex: 15 Avenue Habib Bourguiba, Tunis"
                          value={formData.address}
                          onFocus={() => setAddrDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setAddrDropdownOpen(false), 150)}
                          onChange={e => {
                            handleInputChange("address", e.target.value);
                            setAddrDropdownOpen(true);
                            const exact = addressHistory.find(h => h.address === e.target.value);
                            setAddressWarning(exact ? `Vous avez déjà ${exact.count} bien${exact.count>1?"s":""} à cette adresse.` : "");
                          }}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setAddrDropdownOpen(false); geocodeAddress(); } }}
                        />
                        {/* Dropdown historique */}
                        {addrDropdownOpen && (() => {
                          const q = (formData.address || "").trim().toLowerCase();
                          const suggestions = q.length >= 1
                            ? addressHistory.filter(h => h.address.toLowerCase().includes(q))
                            : addressHistory;
                          if (!suggestions.length) return null;
                          return (
                            <div style={{
                              position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
                              zIndex:999, background:"#fff",
                              border:"1px solid #c7d2fe", borderRadius:10,
                              boxShadow:"0 10px 30px rgba(99,102,241,.12)",
                              overflow:"hidden", maxHeight:220, overflowY:"auto"
                            }}>
                              <div style={{padding:"6px 12px 4px",fontSize:11,color:"#6366f1",fontWeight:600,background:"#f5f3ff",borderBottom:"1px solid #e0e7ff",position:"sticky",top:0}}>
                                Vos adresses précédentes
                              </div>
                              {suggestions.map((h, i) => (
                                <button key={i} type="button"
                                  onMouseDown={e => {
                                    e.preventDefault();
                                    // Remplir adresse + lat/lng directement (pas de geocode)
                                    handleInputChange("address", h.address);
                                    if (h.latitude && h.longitude) {
                                      setFormData(prev => ({
                                        ...prev,
                                        address: h.address,
                                        latitude: String(h.latitude),
                                        longitude: String(h.longitude),
                                      }));
                                      setMapLocation({ lat: h.latitude, lng: h.longitude, address: h.address });
                                    } else {
                                      setTimeout(() => geocodeAddress(), 80);
                                    }
                                    setAddressWarning(`⚠️ Vous avez déjà ${h.count} bien${h.count>1?"s":""} à cette adresse.`);
                                    setAddrDropdownOpen(false);
                                  }}
                                  style={{
                                    display:"flex", alignItems:"center", justifyContent:"space-between",
                                    width:"100%", padding:"9px 14px", background:"none", border:"none",
                                    borderBottom: i < suggestions.length-1 ? "1px solid #f1f5f9" : "none",
                                    cursor:"pointer", textAlign:"left", gap:8
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background="#f5f3ff"}
                                  onMouseLeave={e => e.currentTarget.style.background="none"}
                                >
                                  <span style={{display:"flex",alignItems:"center",gap:7,overflow:"hidden",flex:1}}>
                                    <MapPin size={12} style={{color:"#6366f1",flexShrink:0}}/>
                                    <span style={{fontSize:13,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.address}</span>
                                  </span>
                                  <span style={{flexShrink:0,background:"#eef2ff",color:"#4338ca",borderRadius:10,padding:"2px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                                    {h.count} bien{h.count>1?"s":""}
                                  </span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      <p className="ca-map-hint">Entrez une adresse + Entrée ou cliquez sur 📍 pour centrer la carte.</p>

                      <div className="ca-row-2" style={{marginTop:14}}>
                        <div className="ca-field">
                          <label className="ca-label ca-label--sec">Latitude</label>
                          <input type="text" className="ca-input ca-input--sm"
                            placeholder="36.8065" value={formData.latitude}
                            onChange={e => handleInputChange("latitude", e.target.value)}/>
                        </div>
                        <div className="ca-field">
                          <label className="ca-label ca-label--sec">Longitude</label>
                          <input type="text" className="ca-input ca-input--sm"
                            placeholder="10.1815" value={formData.longitude}
                            onChange={e => handleInputChange("longitude", e.target.value)}/>
                        </div>
                      </div>
                    </div>

                    {/* Right — carte */}
                    <div className="ca-loc-map">
                      <ControlledMap
                        position={{ lat: mapLocation.lat, lng: mapLocation.lng }}
                        onLocationChange={handleMapLocationChange}
                        govLabel={gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label || ""}
                        delLabel={delegations.find(d => d.id === hierarchy.delegation)?.nom || ""}
                        onZoneStatus={setZoneStatus}
                      />
                    </div>

                  </div>

                </div>
              )}

              {/* --- STEP 3 --- */}
              {currentStep === 3 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Sparkles size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Présentation <span className="ca-card__ai-tag">IA Assistée</span></h2>
                    <span className="ca-req-hint"><span className="ca-req">*</span> champs requis</span>
                  </div>

                  {/* --- Split 2 colonnes --- */}
                  <div className="ca-split-2col">

                    {/* Colonne gauche : Titre · Superficie · Prix */}
                    <div className="ca-split-left">

                      {/* Titre */}
                      <div className="ca-field">
                        <label className="ca-label">Titre de l'annonce <span className="ca-req">*</span></label>
                        <div className="ca-input-wand">
                          <input type="text"
                            className={`ca-input${validationErrors.titre ? " ca-input--err" : ""}`}
                            placeholder="Ex: Magnifique villa moderne avec piscine"
                            value={formData.titre}
                            onChange={e => { handleInputChange("titre", e.target.value); setValidationErrors(v=>({...v,titre:false})); }}
                          />
                          <button type="button" className="ca-wand-btn"
                            title="Générer des propositions de titres"
                            onClick={() => {
                              if (!formData.type_bien) return;
                              const TYPE_FR = {
                                appartement:"appartement", villa_maison:"villa", villa:"villa", maison:"maison",
                                terrain:"terrain", bureau:"bureau", local_commercial:"local commercial",
                                immeuble:"immeuble", ferme_agricole:"ferme agricole",
                                garage_parking:"garage", depot_stockage:"dépôt", immobiliers_divers:"bien immobilier",
                              };
                              const t = TYPE_FR[formData.type_bien] || formData.type_bien;
                              const sup = formData.superficie ? ` ${formData.superficie} m²` : "";
                              const ch = formData.nb_chambres > 0 ? ` ${formData.nb_chambres} ch.` : "";
                              const gov = gouvernorats.find(g=>g.value===hierarchy.gouvernorat)?.label || "";
                              const del = delegations.find(d=>String(d.id)===String(hierarchy.delegation))?.nom || "";
                              const loc = del || gov;
                              const locStr = loc ? ` à ${loc}` : "";
                              const offreFr = formData.categorie === "location" ? "à louer" : formData.categorie === "vacances" ? "vacances" : "à vendre";
                              const etat = { nouveau:"neuf", bon_etat:"", a_renover:"à rénover", cours_construction:"en construction" }[formData.etat_bien] || "";
                              const adj = ["Magnifique","Superbe","Élégant","Lumineux","Exceptionnel","Charmant","Spacieux","Moderne","Idéal","Exclusif"];
                              const shuffle = () => adj[Math.floor(Math.random()*adj.length)];
                              const proposals = [
                                `${shuffle()} ${t}${sup}${ch}${locStr}`,
                                `${t.charAt(0).toUpperCase()+t.slice(1)} ${etat ? etat+" " : ""}${offreFr}${locStr}${sup ? " — "+sup : ""}`,
                                `À ${offreFr === "vacances" ? "louer pour les vacances" : offreFr} : ${shuffle().toLowerCase()} ${t}${locStr}`,
                              ].map(s => s.replace(/\s{2,}/g," ").trim());
                              setTitleSuggestions(proposals);
                            }}
                          >
                            <Wand2 size={15}/>
                          </button>
                        </div>
                      </div>

                      {/* Propositions de titres IA */}
                      {titleSuggestions.length > 0 && (
                        <div style={{marginTop:6,marginBottom:4,display:"flex",flexDirection:"column",gap:4}}>
                          <span style={{fontSize:11,fontWeight:600,color:"#6366f1",letterSpacing:".03em"}}>✨ Choisissez un titre :</span>
                          {titleSuggestions.map((s,i) => (
                            <button key={i} type="button"
                              onClick={() => { handleInputChange("titre", s); setTitleSuggestions([]); }}
                              style={{
                                textAlign:"left",padding:"6px 10px",borderRadius:8,
                                border:"1.5px solid #e0e7ff",background:"#f5f3ff",
                                color:"#3730a3",fontSize:12,fontWeight:500,cursor:"pointer",
                                transition:"all .12s",lineHeight:1.4,
                              }}
                              onMouseEnter={e=>{ e.currentTarget.style.background="#ede9fe"; e.currentTarget.style.borderColor="#818cf8"; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background="#f5f3ff"; e.currentTarget.style.borderColor="#e0e7ff"; }}
                            >{s}</button>
                          ))}
                          <button type="button"
                            onClick={() => {
                              const btn = document.querySelector('.ca-wand-btn');
                              if (btn) btn.click();
                            }}
                            style={{fontSize:11,color:"#6366f1",background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:"2px 0",fontWeight:600}}
                          >↻ Nouvelles propositions</button>
                        </div>
                      )}

                      {/* Superficie */}
                      <div className="ca-field">
                        <label className="ca-label">Superficie <span className="ca-req">*</span></label>
                        <div className="ca-input-unit">
                          <input type="number"
                            className={`ca-input${validationErrors.superficie ? " ca-input--err" : ""}`}
                            placeholder="150" min="1" max="9999999"
                            value={formData.superficie}
                            onChange={e => { handleInputChange("superficie", e.target.value); setValidationErrors(v=>({...v,superficie:false})); }}/>
                          <span className="ca-unit">m²</span>
                        </div>
                      </div>

                      {/* Prix */}
                      <div className="ca-field">
                        <label className="ca-label">Prix <span className="ca-req">*</span></label>
                        {/* Cas colocation : prix verrouillé calculé depuis étape 1 */}
                        {["location","vacances"].includes(formData.categorie) && formData.colocation
                          ? (() => {
                              const totalPrix = (formData.chambres_coloc||[]).reduce((s,c)=>s+((c.capacite||1)*(c.prix_par_place||0)),0);
                              return (
                                <>
                                  <div style={{
                                    background:"#f1f5f9", border:"1.5px solid #e2e8f0", borderRadius:10,
                                    padding:"10px 14px", marginBottom:8,
                                    display:"flex", alignItems:"center", justifyContent:"space-between",
                                  }}>
                                    <span style={{fontSize:13, fontWeight:700, color:"#374151"}}>
                                      Utiliser le prix total colocation :
                                    </span>
                                    <span style={{fontSize:15, fontWeight:800, color:"#4338ca"}}>
                                      {totalPrix > 0 ? totalPrix.toLocaleString() : "—"} {formData.devise || "TND"}
                                    </span>
                                  </div>
                                  <p style={{fontSize:11.5, color:"#94a3b8", lineHeight:1.5, marginBottom:8, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"7px 11px"}}>
                                    Le prix a été calculé automatiquement à l'étape 1 « Type et caractéristiques » en fonction du prix par place de chaque chambre. Pour modifier le prix total, veuillez revenir à cette étape et mettre à jour le prix par place des chambres.
                                  </p>
                                  <div className="ca-input-unit" style={{opacity:.55, pointerEvents:"none"}}>
                                    <input type="number" className="ca-input"
                                      value={totalPrix > 0 ? totalPrix : ""}
                                      readOnly tabIndex={-1}
                                      placeholder="Calculé depuis l'étape 1"/>
                                    <span style={{padding:"0 12px",fontWeight:700,color:"#64748b",fontSize:13}}>{formData.devise || "TND"}</span>
                                  </div>
                                </>
                              );
                            })()
                          : <>
                              <div className="ca-input-unit">
                                <input type="number"
                                  className={`ca-input${validationErrors.prix ? " ca-input--err" : ""}`}
                                  placeholder="250000" min="1" max="9999999999"
                                  value={formData.prix}
                                  onChange={e => { handleInputChange("prix", e.target.value); setValidationErrors(v=>({...v,prix:false})); }}/>
                                <select className="ca-currency" value={formData.devise}
                                  onChange={e => handleInputChange("devise", e.target.value)}>
                                  <option value="TND">TND</option>
                                  <option value="EUR">EUR</option>
                                  <option value="USD">USD</option>
                                </select>
                              </div>
                            </>
                        }
                      </div>

                      {/* -- Aperçu en direct -- */}
                      {(() => {
                        const prixNum = parseFloat(formData.prix);
                        const surfNum = parseFloat(formData.superficie);
                        const _rawM2  = (prixNum > 0 && surfNum > 0) ? prixNum / surfNum : null;
                        const prixM2  = (_rawM2 && _rawM2 > 0)
                          ? (Number.isInteger(_rawM2) ? _rawM2.toLocaleString("fr-TN") : _rawM2.toLocaleString("fr-TN", {minimumFractionDigits:1, maximumFractionDigits:1}))
                          : null;
                        const devise  = formData.devise || "TND";
                        return (
                          <div className="ca-live-preview">
                            <div className="ca-live-preview__header">
                              <span className="ca-live-preview__label">Aperçu en direct</span>
                              <span className="ca-live-preview__dot"/>
                            </div>
                            <div className="ca-live-preview__card">
                              {formData.type_bien && (
                                <span className="ca-live-preview__badge">
                                  {formData.type_bien.charAt(0).toUpperCase() + formData.type_bien.slice(1)}
                                  {formData.categorie ? ` · ${formData.categorie}` : ""}
                                </span>
                              )}
                              <p className="ca-live-preview__titre">
                                {formData.titre.trim() || <span className="ca-live-preview__ph">Titre de l'annonce…</span>}
                              </p>
                              <div className="ca-live-preview__stats">
                                {surfNum > 0 && (
                                  <span className="ca-live-preview__stat">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                                    {surfNum.toLocaleString("fr-TN")} m²
                                  </span>
                                )}
                                {prixNum > 0 && (
                                  <span className="ca-live-preview__stat ca-live-preview__stat--prix">
                                    {prixNum.toLocaleString("fr-TN")} {devise}
                                  </span>
                                )}
                              </div>
                              {prixM2 && (
                                <div className="ca-live-preview__prixm2">
                                  <span className="ca-live-preview__prixm2-val">{prixM2} {devise}/m²</span>
                                  <span className="ca-live-preview__prixm2-lbl">Prix au m²</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* -- Évaluation de marché -- */}
                      {(() => {
                        const prixNum  = parseFloat(formData.prix);
                        const surfNum  = parseFloat(formData.superficie);
                        const prixM2n  = (prixNum > 0 && surfNum > 0) ? prixNum / surfNum : null;
                        const govLabel = gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label || "";
                        if (!govLabel || !prixM2n) return null;
                        const govStats = marketStats[govLabel] || { sum: 0, count: 0 };
                        return (
                          <CaPriceEvalBar
                            prixM2={prixM2n}
                            govStats={govStats}
                            devise={formData.devise}
                          />
                        );
                      })()}

                    </div>{/* /ca-split-left */}

                    {/* Colonne droite : Description */}
                    <div className="ca-split-right">
                      <div className="ca-field ca-field--full">
                        <label className="ca-label">Description <span className="ca-req">*</span></label>

                        {/* IA actions */}
                        <div className="ca-ai-strip">
                          <span className="ca-ai-strip__label">✨ Générer avec l'IA :</span>
                          <button type="button" className="ca-ai-pill"
                            onClick={generateQuickAIDescription} disabled={isAILoading}>
                            {isAILoading
                              ? <span style={{display:"flex",alignItems:"center",gap:6}}>
                                  <span style={{width:13,height:13,border:"2px solid rgba(255,255,255,.35)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"caSpin .7s linear infinite"}}/>
                                  Génération…
                                </span>
                              : "Rédaction rapide"}
                          </button>
                        </div>

                        <div className="ca-desc-wrap ca-desc-wrap--full">
                          <textarea
                            className={`ca-textarea ca-textarea--tall${validationErrors.description ? " ca-input--err" : ""}`}
                            placeholder="Décrivez votre bien : luminosité, équipements, quartier, points forts… (obligatoire)"
                            value={formData.description}
                            onChange={e => { handleInputChange("description", e.target.value); setValidationErrors(v=>({...v,description:false})); }}
                          />
                          {formData.description && (
                            <div className="ca-desc-stats">
                              <span>{formData.description.length} car.</span>
                              <span>{formData.description.split(" ").filter(Boolean).length} mots</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>{/* /ca-split-right */}

                  </div>{/* /ca-split-2col */}
                </div>
              )}

              {/* --- STEP 4 --- */}
              {currentStep === 4 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Camera size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Photos du bien</h2>
                    <span className="ca-req-hint">{existingImageUrls.length + formData.allImages.length}/10 photos</span>
                  </div>

                  <p className="ca-tip" style={{marginBottom:12}}>
                    Glissez-déposez vos photos ou cliquez pour les ajouter. Cliquez sur ★ pour définir l'image principale.
                  </p>
                  {/* -- Images existantes (edit mode) -- */}
                  {editId && existingImageUrls.length > 0 && (
                    <div style={{marginBottom:20}}>
                      <div className="ca-section-label" style={{marginBottom:10}}>
                        Photos actuelles de l'annonce
                        <span className="ca-count-badge">{existingImageUrls.length}</span>
                      </div>
                      <div className="ca-img-unified-grid">
                        {existingImageUrls.map((url, idx) => {
                          const isMain = idx === mainExistingIdx && formData.allImages.length === 0;
                          return (
                            <div key={url} className={`ca-img-uni-card${isMain ? " ca-img-uni-card--main" : ""}`}
                              style={{border: isMain ? "2px solid #6366f1" : "2px solid #e5e7eb"}}>
                              <img src={url} alt={`Photo ${idx+1}`}
                                style={{width:"100%",height:"100%",objectFit:"cover"}}
                                onError={e => { e.currentTarget.style.display="none"; }}/>
                              {isMain && (
                                <div className="ca-img-main-badge"><Star size={11} fill="#fff" style={{marginRight:3}}/> Principale</div>
                              )}
                              <div className="ca-img-overlay">
                                <button type="button"
                                  className={`ca-img-btn ca-img-btn--heart${isMain ? " ca-img-btn--heart-on" : ""}`}
                                  title={isMain ? "Image principale ★" : "Définir comme principale"}
                                  onClick={() => { setMainExistingIdx(idx); handleInputChange("mainImageIndex", 0); }}>
                                  <Star size={15} fill={isMain ? "#fff" : "none"}/>
                                </button>
                                <button type="button" className="ca-img-btn ca-img-btn--eye"
                                  onClick={() => window.open(url, "_blank")}>
                                  <Eye size={15}/>
                                </button>
                                <button type="button" className="ca-img-btn ca-img-btn--del"
                                  title="Supprimer cette photo"
                                  onClick={async () => {
                                    const token = localStorage.getItem("token");
                                    if (editPropertyIdState) {
                                      try {
                                        const relUrl = url.startsWith(API_URL) ? url.slice(API_URL.length) : url;
                                        await fetch(`${API_URL}/properties/${editPropertyIdState}/images`, {
                                          method: "DELETE",
                                          headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
                                          body: JSON.stringify({ image: relUrl }),
                                        });
                                      } catch { /* silencieux */ }
                                    }
                                    const newUrls = existingImageUrls.filter(u => u !== url);
                                    setExistingImageUrls(newUrls);
                                    if (mainExistingIdx >= newUrls.length) setMainExistingIdx(0);
                                  }}>
                                  <Trash2 size={15}/>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Zone drag-and-drop globale */}
                  {(existingImageUrls.length + formData.allImages.length) < 10 && (
                    <div
                      className="ca-img-dnd-zone"
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("ca-img-dnd-zone--over"); }}
                      onDragLeave={e => e.currentTarget.classList.remove("ca-img-dnd-zone--over")}
                      onDrop={e => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("ca-img-dnd-zone--over");
                        const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
                        const remaining = 10 - existingImageUrls.length - formData.allImages.length;
                        const toAdd = files.slice(0, remaining).filter(f => f.size <= 10 * 1024 * 1024);
                        if (files.some(f => f.size > 10 * 1024 * 1024)) toast("Certaines images dépassent 10 MB.", "error");
                        if (toAdd.length > 0) setFormData(prev => ({ ...prev, allImages: [...prev.allImages, ...toAdd] }));
                      }}
                      onClick={() => document.getElementById("ca-dnd-input").click()}
                    >
                      <input id="ca-dnd-input" type="file" accept="image/*" multiple style={{display:"none"}}
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          const remaining = 10 - existingImageUrls.length - formData.allImages.length;
                          const toAdd = files.slice(0, remaining).filter(f => f.size <= 10 * 1024 * 1024);
                          if (files.some(f => f.size > 10 * 1024 * 1024)) toast("Certaines images dépassent 10 MB.", "error");
                          if (toAdd.length > 0) setFormData(prev => ({ ...prev, allImages: [...prev.allImages, ...toAdd] }));
                          e.target.value = "";
                        }}
                      />
                      <Upload size={32} style={{color:"#9ca3af"}}/>
                      <span style={{fontSize:14,fontWeight:600,color:"#374151",marginTop:8}}>Glissez vos photos ici</span>
                      <span style={{fontSize:12,color:"#9ca3af"}}>ou cliquez pour parcourir — JPG, PNG, max 10 MB</span>
                      <span style={{fontSize:11,color:"#c7d2fe",marginTop:4}}>{existingImageUrls.length + formData.allImages.length}/10 photos</span>
                    </div>
                  )}

                  <div className="ca-img-unified-grid" style={{marginTop: formData.allImages.length > 0 ? 16 : 0}}>
                    {formData.allImages.map((file, index) => {
                      const isMain = index === formData.mainImageIndex;
                      return (
                        <div key={index} className={`ca-img-uni-card${isMain ? " ca-img-uni-card--main" : ""}`}>
                          <img src={URL.createObjectURL(file)} alt={`Image ${index + 1}`}/>
                          {isMain && (
                            <div className="ca-img-main-badge">? Principale</div>
                          )}
                          <div className="ca-img-overlay">
                            <button type="button" className="ca-img-btn ca-img-btn--eye"
                              onClick={() => window.open(URL.createObjectURL(file), "_blank")}>
                              <Eye size={15}/>
                            </button>
                            <button type="button"
                              className={`ca-img-btn ca-img-btn--heart${isMain ? " ca-img-btn--heart-on" : ""}`}
                              title={isMain ? "Image principale ★" : "Définir comme principale"}
                              onClick={() => handleInputChange("mainImageIndex", index)}>
                              <Star size={15} fill={isMain ? "#fff" : "none"}/>
                            </button>
                            <button type="button" className="ca-img-btn ca-img-btn--del"
                              onClick={() => {
                                const newImages = formData.allImages.filter((_, i) => i !== index);
                                const newMain = formData.mainImageIndex >= newImages.length
                                  ? Math.max(0, newImages.length - 1)
                                  : formData.mainImageIndex === index
                                    ? 0
                                    : formData.mainImageIndex > index
                                      ? formData.mainImageIndex - 1
                                      : formData.mainImageIndex;
                                setFormData(prev => ({ ...prev, allImages: newImages, mainImageIndex: newMain }));
                              }}>
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Slot d'ajout supplémentaire si la grille est déjà partiellement remplie */}
                    {formData.allImages.length > 0 && (existingImageUrls.length + formData.allImages.length) < 10 && (
                      <label className="ca-img-add-slot">
                        <input type="file" accept="image/*" multiple style={{display:"none"}}
                          onChange={e => {
                            const files = Array.from(e.target.files || []);
                            const remaining = 10 - existingImageUrls.length - formData.allImages.length;
                            const toAdd = files.slice(0, remaining).filter(f => f.size <= 10 * 1024 * 1024);
                            if (toAdd.length > 0) setFormData(prev => ({ ...prev, allImages: [...prev.allImages, ...toAdd] }));
                            e.target.value = "";
                          }}
                        />
                        <Upload size={22} style={{color:"#9ca3af"}}/>
                        <span style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Ajouter</span>
                      </label>
                    )}
                  </div>


                  {/* -- Publication anonyme / identité visible -- */}
                  {(() => {
                    const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                    const avatar     = storedUser?.profile_picture;
                    const pseudo     = storedUser?.username || "Utilisateur";
                    return (
                      <div className="ca-anon-toggle" style={{marginTop:20}}>
                        <div className="ca-anon-toggle__inner">
                          {/* Aperçu identité — change au switch */}
                          <div style={{display:"flex", alignItems:"center", gap:12, flex:1}}>
                            {formData.anonyme ? (
                              /* Avatar anonyme */
                              <div style={{
                                width:42,height:42,borderRadius:"50%",flexShrink:0,
                                background:"linear-gradient(135deg,#94a3b8,#64748b)",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                border:"2px solid #e2e8f0"
                              }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                            ) : avatar ? (
                              <img src={avatar.startsWith("data:")||avatar.startsWith("http") ? avatar : `${API_URL}${avatar}`}
                                alt="" style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e2e8f0"}}/>
                            ) : (
                              <div style={{
                                width:42,height:42,borderRadius:"50%",flexShrink:0,
                                background:"linear-gradient(135deg,#6366f1,#818cf8)",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                border:"2px solid #e2e8f0",
                                fontSize:18,fontWeight:800,color:"#fff"
                              }}>{pseudo[0].toUpperCase()}</div>
                            )}
                            <div className="ca-anon-toggle__text">
                              <span className="ca-anon-toggle__title">
                                {formData.anonyme ? "Membre anonyme" : pseudo}
                              </span>
                              <span className="ca-anon-toggle__sub">
                                {formData.anonyme
                                  ? "Identité masquée — les visiteurs pourront vous envoyer une notification"
                                  : "Votre nom et coordonnées seront visibles dans l'annonce"}
                              </span>
                            </div>
                          </div>
                          <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
                            <span style={{
                              fontSize:12.5, fontWeight:700,
                              color: formData.anonyme ? "#16a34a" : "#94a3b8",
                              transition:"color .2s", minWidth:24
                            }}>
                              {formData.anonyme ? "Oui" : "Non"}
                            </span>
                            <label className="ca-anon-sw">
                              <input type="checkbox" checked={formData.anonyme||false}
                                onChange={e => handleInputChange("anonyme", e.target.checked)}/>
                              <span className="ca-anon-sw__track"/>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* -- Accompagnement checkbox -- */}
                  {/* -- Accompagnement — switch identique à anonyme -- */}
                  <div className="ca-anon-toggle" style={{marginTop:16}}>
                    <div className="ca-anon-toggle__inner">
                      <div className="ca-anon-toggle__text">
                        <span className="ca-anon-toggle__title">Je souhaite être accompagné(e)</span>
                        <span className="ca-anon-toggle__sub">
                          par un professionnel de l'immobilier dans la transaction du bien immobilier (achat / vente / location)
                        </span>
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
                        <span style={{
                          fontSize:12.5, fontWeight:700,
                          color: formData.accompagnement ? "#16a34a" : "#94a3b8",
                          transition:"color .2s", minWidth:24
                        }}>
                          {formData.accompagnement ? "Oui" : "Non"}
                        </span>
                        <label className="ca-anon-sw">
                          <input type="checkbox" checked={formData.accompagnement || false}
                            onChange={e => handleInputChange("accompagnement", e.target.checked)}/>
                          <span className="ca-anon-sw__track"/>
                        </label>
                      </div>
                    </div>
                    {formData.accompagnement && (
                      <div style={{marginTop:10,padding:"9px 13px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,fontSize:12,color:"#1e40af",display:"flex",alignItems:"flex-start",gap:7}}>
                        <span style={{fontSize:15,flexShrink:0}}>ℹ️</span>
                        <span>Vous pouvez toujours modifier ce choix depuis la page <strong>Mes annonces</strong> après publication.</span>
                      </div>
                    )}
                    {formData.accompagnement && (
                      <div style={{marginTop:14}}>
                        <label className="ca-label" style={{marginBottom:6, display:"block"}}>
                          Choisir une agence
                        </label>
                        <select
                          className="ca-select"
                          value={agenceChoisie}
                          onChange={e => { setAgenceChoisie(e.target.value); handleInputChange("agence_choisie", e.target.value); }}
                        >
                          <option value="">— Peu importe (affecter plus tard) —</option>
                          {agences.map(a => (
                            <option key={a.id} value={a.id}>{a.nom}{a.type ? ` · ${a.type}` : ""}</option>
                          ))}
                        </select>
                        {agences.length === 0 && (
                          <p style={{fontSize:12,color:"#94a3b8",marginTop:6}}>
                            Aucun professionnel inscrit pour le moment. Un professionnel sera affecté par notre équipe.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- STEP 5 — Prévisualisation (design identique à AnnonceDetail) --- */}
              {currentStep === 5 && (() => {
                /* -- Données calculées pour le preview -- */
                /* Combiner images existantes + nouvelles ; l'image principale en tête */
                const newImgs = imgUrls; // blob URLs des nouvelles photos
                let imgs;
                if (newImgs.length > 0) {
                  /* Nouvelles images ajoutées : la principale est celle sélectionnée parmi les nouvelles */
                  imgs = [
                    newImgs[formData.mainImageIndex] || newImgs[0],
                    ...newImgs.filter((_, i) => i !== (formData.mainImageIndex || 0)),
                    ...existingImageUrls,
                  ];
                } else if (existingImageUrls.length > 0) {
                  /* Pas de nouvelles images : utiliser les existantes, principale en premier */
                  imgs = [
                    existingImageUrls[mainExistingIdx] || existingImageUrls[0],
                    ...existingImageUrls.filter((_, i) => i !== mainExistingIdx),
                  ];
                } else {
                  imgs = [];
                }
                const mainImg = imgs[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80";
                const govLabel = gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label || "";
                const delLabel = delegations.find(d => String(d.id) === String(hierarchy.delegation))?.nom || "";
                const locLabel = localites.find(l => String(l.id) === String(hierarchy.localite))?.nom || "";
                const TYPE_FR = { appartement:"Appartement", villa:"Villa/Maison", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", immeuble:"Immeuble", garage_parking:"Garage / Parking", immobiliers_divers:"Immobiliers divers" };
                const CAT_FR  = { vente:"Vente", location:"Location", vacances:"Vacances" };
                const ETAT_FR = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"À rénover", cours_construction:"En construction" };
                const CAT_BG  = { vente:"#dcfce7", location:"#dbeafe", vacances:"#fef9c3" };
                const CAT_CLR = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
                const cat = formData.categorie || "vente";
                const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")); } catch { return null; } })();
                const userRole = storedUser?.role || "particulier";
                const isAnonymous = !!formData.anonyme;
                const initiale = (storedUser?.username || "?")[0].toUpperCase();
                const rawUrl = storedUser?.profile_picture || null;
                const resolveUrl = url => !url ? null : (url.startsWith("data:") || url.startsWith("http")) ? url : `${API_URL}${url}`;
                const photoUrl = resolveUrl(rawUrl);
                const roleLabels = { particulier:"Particulier", agence:"Agence / Agent", promoteur:"Promoteur", professionnel:"Professionnel", partenaire:"Partenaire", admin:"Administrateur" };

                /* Icônes des caractéristiques — identiques à AnnonceDetail */
                const FEAT_ICONS = {
                  "Vue sur mer": Waves,       "Vue sur montagne": Mountain,    "Vue sur forêt": TreePine,
                  "Jardin": Fence,            "Terrasse": Sun,             "Balcon": Flower2,
                  "Piscine": Droplets,        "Parking": ParkingCircle,    "Ascenseur": ArrowUpDown,
                  "Garage": Car,              "Cellier": Package,"Meublé": Sofa,
                  "Concierge": Users,         "Gardien": ShieldCheck,      "Animaux admis": Heart,
                  "Cuisine équipée": UtensilsCrossed, "Climatisation": Wind, "Chauffage central": Thermometer,
                  "Cheminée": Flame,          "Double vitrage": DoorClosed,"Porte blindée": LockKeyhole,
                  "Sécurité": Fingerprint,    "Internet": Wifi,            "TV": Monitor,
                  "Machine à laver": RefreshCw,"Digicode": KeyRound,       "Interphone": PhoneCall,
                  "Relié ONAS": Droplets,     "Salon américain": Monitor,  "Fibre optique": Wifi,
                };

                const allFeats = [
                  {k:"vue_mer",l:"Vue sur mer"},{k:"vue_montagne",l:"Vue sur montagne"},{k:"vue_foret",l:"Vue sur forêt"},
                  {k:"jardin",l:"Jardin"},{k:"terrasse",l:"Terrasse"},{k:"balcon",l:"Balcon"},
                  {k:"piscine",l:"Piscine"},{k:"parking",l:"Parking"},{k:"ascenseur",l:"Ascenseur"},
                  {k:"garage",l:"Garage"},{k:"cellier",l:"Cellier"},{k:"meuble",l:"Meublé"},
                  {k:"concierge",l:"Concierge"},{k:"gardien",l:"Gardien"},{k:"animaux_admis",l:"Animaux admis"},
                  {k:"cuisine_equipee",l:"Cuisine équipée"},{k:"climatisation",l:"Climatisation"},
                  {k:"chauffage_centrale",l:"Chauffage central"},{k:"cheminee",l:"Cheminée"},
                  {k:"double_vitrage",l:"Double vitrage"},{k:"porte_blindee",l:"Porte blindée"},
                  {k:"securite",l:"Sécurité"},{k:"internet",l:"Internet"},{k:"tv",l:"TV"},
                  {k:"machine_laver",l:"Machine à laver"},{k:"digicode",l:"Digicode"},
                  {k:"interphone",l:"Interphone"},{k:"salon_americain",l:"Salon américain"},
                  {k:"relie_onas",l:"Relié ONAS"},{k:"fibre_optique",l:"Fibre optique"},
                ].filter(f => formData[f.k]);

                const approx = formData.prix ? fmtPriceApprox(Number(formData.prix), formData.devise || "TND") : "";

                return (
                  <div className="ca-step-content">
                    <div className="ca-card__head">
                      <Eye size={20} className="ca-card__head-ico"/>
                      <h2 className="ca-card__title">Prévisualisation</h2>
                      <span style={{marginLeft:"auto",fontSize:12,color:"#64748b",background:"#f1f5f9",padding:"4px 10px",borderRadius:20,fontWeight:600}}>
                        ✓ Exactement comme sur la page annonce
                      </span>
                    </div>

                    {/* -- Layout 2 colonnes identique à AnnonceDetail -- */}
                    <div className="ca-prev-detail-grid" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:28,fontFamily:"'Poppins',system-ui,sans-serif",alignItems:"start"}}>

                      {/* -- COLONNE GAUCHE -- */}
                      <div>
                        {/* Galerie — même style que .ad-gallery */}
                        <div style={{marginBottom:20,borderRadius:10,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
                          <div style={{position:"relative",background:"#e5e7eb",borderRadius:10,overflow:"hidden"}}>
                            <img src={imgs[previewImg] || mainImg} alt="Photo principale"
                              style={{width:"100%",height:400,objectFit:"cover",display:"block"}}/>
                            {imgs.length > 1 && (
                              <>
                                <button type="button" onClick={()=>setPreviewImg(i=>(i-1+imgs.length)%imgs.length)}
                                  style={{position:"absolute",top:"50%",left:12,transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
                                  <ChevronLeft size={18}/>
                                </button>
                                <button type="button" onClick={()=>setPreviewImg(i=>(i+1)%imgs.length)}
                                  style={{position:"absolute",top:"50%",right:12,transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
                                  <ChevronRight size={18}/>
                                </button>
                                <span style={{position:"absolute",bottom:12,right:12,background:"rgba(0,0,0,.5)",color:"#fff",padding:"3px 10px",borderRadius:20,fontSize:12.5,fontWeight:600}}>
                                  {previewImg+1} / {imgs.length}
                                </span>
                              </>
                            )}
                          </div>
                          {imgs.length > 1 && (
                            <div style={{display:"flex",gap:8,marginTop:8,overflowX:"auto",paddingBottom:4,paddingTop:2}}>
                              {imgs.map((src, i) => (
                                <img key={i} src={src} alt="" loading="lazy" onClick={()=>setPreviewImg(i)}
                                  style={{width:80,height:60,objectFit:"cover",borderRadius:6,flexShrink:0,cursor:"pointer",
                                    border:"2px solid",borderColor:i===previewImg?"#6366f1":"transparent",
                                    opacity:i===previewImg?1:.65,transition:"all .15s"}}/>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Description — même style que .ad-section */}
                        {formData.description && (
                          <div style={{marginBottom:24,padding:"18px 20px",background:"#fff",borderRadius:10,border:"1px solid #e5e7eb"}}>
                            <h2 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:"0 0 12px"}}>Description</h2>
                            <p style={{fontSize:13.5,color:"#4b5563",lineHeight:1.8,whiteSpace:"pre-wrap",margin:0}}>{formData.description}</p>
                          </div>
                        )}

                        {/* Caractéristiques — avec icônes, identiques à AnnonceDetail */}
                        {allFeats.length > 0 && (
                          <div style={{padding:"18px 20px",background:"#fff",borderRadius:10,border:"1px solid #e5e7eb"}}>
                            <h2 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>Caractéristiques du bien</h2>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"10px 8px"}}>
                              {allFeats.map(f => {
                                const Ico = FEAT_ICONS[f.l] || CheckCircle2;
                                return (
                                  <div key={f.k} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",borderRadius:8,background:"#f8fafc",border:"1px solid #e5e7eb",fontSize:12.5,fontWeight:600,color:"#374151"}}>
                                    <Ico size={16} strokeWidth={1.6} style={{color:"#4f46e5",flexShrink:0}}/>{f.l}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* -- COLONNE DROITE -- */}
                      <div>
                        {/* Carte principale — identique à .ad-card */}
                        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"20px 22px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>

                          {/* Badge catégorie */}
                          {formData.categorie && (
                            <span style={{display:"inline-block",padding:"3px 12px",borderRadius:999,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".6px",marginBottom:10,background:CAT_BG[cat],color:CAT_CLR[cat]}}>
                              {CAT_FR[formData.categorie]}
                            </span>
                          )}

                          {/* Titre */}
                          <h2 style={{fontSize:19,fontWeight:800,color:"#0f172a",lineHeight:1.3,margin:"0 0 10px"}}>
                            {formData.titre || <em style={{color:"#94a3b8",fontWeight:400,fontSize:15}}>Titre non défini</em>}
                          </h2>

                          {/* Adresse / Localisation chips */}
                          <div style={{marginBottom:14,display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
                            {locLabel && <span style={{padding:"3px 9px",borderRadius:999,fontSize:11.5,fontWeight:600,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0"}}>{locLabel}</span>}
                            {locLabel && delLabel && <span style={{fontSize:12,color:"#d1d5db"}}>›</span>}
                            {delLabel && <span style={{padding:"3px 9px",borderRadius:999,fontSize:11.5,fontWeight:600,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0"}}>{delLabel}</span>}
                            {(locLabel||delLabel) && govLabel && <span style={{fontSize:12,color:"#d1d5db"}}>›</span>}
                            {govLabel && <span style={{padding:"3px 9px",borderRadius:999,fontSize:11.5,fontWeight:600,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0"}}>{govLabel}</span>}
                            {!locLabel && !delLabel && !govLabel && (
                              <span style={{color:"#9ca3af",fontSize:12.5,display:"flex",alignItems:"center",gap:4}}><MapPin size={11}/> Tunisie</span>
                            )}
                          </div>

                          {/* Prix */}
                          <p style={{fontSize:30,fontWeight:900,color:"#0f172a",margin:"0 0 2px",lineHeight:1.1}}>
                            {formData.prix ? Number(formData.prix).toLocaleString("fr-TN") : "—"}
                            <span style={{fontSize:14,fontWeight:400,color:"#9ca3af"}}> {formData.devise || "TND"}</span>
                          </p>
                          {approx && <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 14px",fontWeight:500}}>{approx}</p>}

                          {/* Specs (chambres / sdb / surface) */}
                          {(formData.nb_chambres > 0 || formData.nb_salles_bain > 0 || formData.superficie) && (
                            <div style={{display:"flex",gap:6,marginBottom:16}}>
                              {formData.nb_chambres > 0 && (
                                <div style={{flex:1,textAlign:"center",padding:"10px 6px",border:"1px solid #e5e7eb",borderRadius:8}}>
                                  <div style={{fontSize:17,fontWeight:800,color:"#0f172a",lineHeight:1}}>{formData.nb_chambres}</div>
                                  <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>Chambres</div>
                                </div>
                              )}
                              {formData.nb_salles_bain > 0 && (
                                <div style={{flex:1,textAlign:"center",padding:"10px 6px",border:"1px solid #e5e7eb",borderRadius:8}}>
                                  <div style={{fontSize:17,fontWeight:800,color:"#0f172a",lineHeight:1}}>{formData.nb_salles_bain}</div>
                                  <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>Sdb</div>
                                </div>
                              )}
                              {formData.superficie && (
                                <div style={{flex:1,textAlign:"center",padding:"10px 6px",border:"1px solid #e5e7eb",borderRadius:8}}>
                                  <div style={{fontSize:17,fontWeight:800,color:"#0f172a",lineHeight:1}}>{formData.superficie}</div>
                                  <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>m²</div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Méta — identique à .ad-meta */}
                          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14,fontSize:13,color:"#4b5563"}}>
                            {formData.type_bien && <div style={{display:"flex",alignItems:"center",gap:7}}><Tag size={13} style={{color:"#9ca3af",flexShrink:0}}/><span style={{fontWeight:600,color:"#6b7280"}}>Type :</span>{TYPE_FR[formData.type_bien]||formData.type_bien}</div>}
                            {formData.etat_bien  && <div style={{display:"flex",alignItems:"center",gap:7}}><CheckCircle2 size={13} style={{color:"#9ca3af",flexShrink:0}}/><span style={{fontWeight:600,color:"#6b7280"}}>État :</span>{ETAT_FR[formData.etat_bien]||formData.etat_bien}</div>}
                            {formData.nb_pieces > 0 && <div style={{display:"flex",alignItems:"center",gap:7}}><Building2 size={13} style={{color:"#9ca3af",flexShrink:0}}/><span style={{fontWeight:600,color:"#6b7280"}}>Pièces :</span>{formData.nb_pieces}</div>}
                            {formData.etage != null && formData.etage !== "" && <div style={{display:"flex",alignItems:"center",gap:7}}><ArrowUpDown size={13} style={{color:"#9ca3af",flexShrink:0}}/><span style={{fontWeight:600,color:"#6b7280"}}>Étage :</span>{formData.etage === 0 ? "RDC" : `${formData.etage}e`}</div>}
                            {formData.annee_construction && <div style={{display:"flex",alignItems:"center",gap:7}}><CheckCircle2 size={13} style={{color:"#9ca3af",flexShrink:0}}/><span style={{fontWeight:600,color:"#6b7280"}}>Année :</span>{formData.annee_construction}</div>}
                            {formData.hauteur_immeuble && <div style={{display:"flex",alignItems:"center",gap:7}}><Building2 size={13} style={{color:"#9ca3af",flexShrink:0}}/><span style={{fontWeight:600,color:"#6b7280"}}>Hauteur :</span>{formData.hauteur_immeuble}</div>}
                            {/* Badge rôle publieur */}
                            {!isAnonymous && (() => {
                              const roleMap = {
                                particulier:    {label:"Particulier",       color:"#6366f1",bg:"#eef2ff"},
                                agence:         {label:"Agence / Agent",    color:"#0369a1",bg:"#e0f2fe"},
                                promoteur:      {label:"Promoteur",         color:"#7c3aed",bg:"#ede9fe"},
                                professionnel:  {label:"Professionnel",     color:"#15803d",bg:"#dcfce7"},
                              };
                              const r = roleMap[userRole] || {label:userRole, color:"#64748b", bg:"#f1f5f9"};
                              return (
                                <div style={{display:"flex",alignItems:"center",gap:7}}>
                                  <Home size={13} style={{color:r.color,flexShrink:0}}/>
                                  <span style={{fontWeight:600,color:"#6b7280"}}>Publié par :</span>
                                  <span style={{display:"inline-flex",alignItems:"center",gap:4,background:r.bg,color:r.color,padding:"2px 10px",borderRadius:999,fontSize:12,fontWeight:700}}>{r.label}</span>
                                </div>
                              );
                            })()}
                          </div>

                          <div style={{height:1,background:"#f1f5f9",margin:"14px 0"}}/>

                          {/* -- Bloc contact conditionnel — IDENTIQUE à AnnonceDetail -- */}
                          {isAnonymous ? (
                            /* ANONYME */
                            <div>
                              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                                <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#94a3b8,#64748b)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid #e2e8f0"}}>
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                <div>
                                  <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a"}}>Membre anonyme</div>
                                  <div style={{fontSize:12,color:"#94a3b8"}}>Identité masquée · Publication anonyme</div>
                                </div>
                              </div>
                              <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:9,padding:"9px 13px",fontSize:12.5,color:"#92400e",lineHeight:1.5}}>
                                👁️ Votre annonce sera publiée <strong>anonymement</strong>. Les visiteurs ne verront pas vos coordonnées.
                              </div>
                            </div>
                          ) : (userRole === "agence" || userRole === "promoteur") ? (
                            /* AGENCE / PROMOTEUR — logo en grand comme AnnonceDetail */
                            <div style={{background:"#f8fafc",borderRadius:14,padding:"16px 18px",border:`1.5px solid ${userRole==="agence"?"#bae6fd":"#ddd6fe"}`}}>
                              <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a",marginBottom:3}}>{storedUser?.username || "—"}</div>
                              <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>Professionnel de l'immobilier</div>
                              {photoUrl ? (
                                <img src={photoUrl} alt="Logo"
                                  style={{width:"100%",maxHeight:140,objectFit:"contain",borderRadius:10,border:`1.5px solid ${userRole==="agence"?"#bae6fd":"#ddd6fe"}`,background:"#fff",padding:8}}/>
                              ) : (
                                <div style={{width:"100%",height:100,borderRadius:10,background:userRole==="agence"?"linear-gradient(135deg,#0369a1,#0ea5e9)":"linear-gradient(135deg,#7c3aed,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,fontWeight:900,color:"#fff"}}>
                                  {initiale}
                                </div>
                              )}
                              <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
                                <div style={{padding:"11px 14px",borderRadius:10,background:"linear-gradient(135deg,#6366f1,#818cf8)",color:"#fff",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,justifyContent:"center"}}>
                                  <Phone size={14}/> {storedUser?.phone_number || "+216 XX XXX XXX"}
                                </div>
                                <div style={{padding:"11px 14px",borderRadius:10,background:"#f1f5f9",color:"#374151",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,justifyContent:"center",border:"1px solid #e2e8f0"}}>
                                  <Mail size={14}/> {storedUser?.email || ""}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* PARTICULIER & autres */
                            <div>
                              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                                {photoUrl ? (
                                  <img src={photoUrl} alt="avatar" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e2e8f0"}}/>
                                ) : (
                                  <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",fontSize:18,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                    {initiale}
                                  </div>
                                )}
                                <div>
                                  <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a"}}>{storedUser?.username || "—"}</div>
                                  <div style={{fontSize:12,color:"#94a3b8"}}>{roleLabels[userRole] || "Propriétaire"}</div>
                                </div>
                              </div>
                              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                                <div style={{padding:"11px 14px",borderRadius:10,background:"linear-gradient(135deg,#6366f1,#818cf8)",color:"#fff",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,justifyContent:"center"}}>
                                  <Phone size={14}/> {storedUser?.phone_number || "+216 XX XXX XXX"}
                                </div>
                                <div style={{padding:"11px 14px",borderRadius:10,background:"#f1f5f9",color:"#374151",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,justifyContent:"center",border:"1px solid #e2e8f0"}}>
                                  <Mail size={14}/> {storedUser?.email || ""}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Note de bas */}
                    <div style={{marginTop:20,padding:"12px 16px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,fontSize:12.5,color:"#92400e",lineHeight:1.5}}>
                      ⚠️ Votre annonce sera soumise à une approbation avant d'être publiée sur la carte (délai : 24h). Vous pouvez encore modifier les étapes précédentes.
                    </div>
                  </div>
                );
              })()}

            </div>{/* end ca-card */}

            {/* Navigation */}
            <div className="ca-nav">
              {currentStep > 1
                ? <button type="button" className="ca-nav-btn ca-nav-btn--ghost" onClick={prevStep}>
                    <ChevronLeft size={17}/> Précédent
                  </button>
                : <div/>
              }
              {currentStep < totalSteps - 1
                ? <button type="button" className="ca-nav-btn ca-nav-btn--solid" onClick={nextStep}>
                    Suivant <ChevronRight size={17}/>
                  </button>
                : currentStep === totalSteps - 1
                  ? <button type="button" className="ca-nav-btn ca-nav-btn--preview" onClick={nextStep}>
                      <Eye size={17}/> Prévisualiser
                    </button>
                  : <button type="button" className="ca-nav-btn ca-nav-btn--publish" onClick={() => handleSubmit()}>
                      <Check size={17}/> {editId ? "Mettre à jour l'annonce" : "Créer l'annonce"}
                    </button>
              }
            </div>
          </form>
        </main>

        {/* Modal confirmation publication */}
        {showPublishModal && ReactDOM.createPortal(
          <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99999,padding:"16px"}}
            onClick={e=>{if(e.target===e.currentTarget)setShowPublishModal(false);}}>
            <div style={{background:"#fff",borderRadius:20,padding:"28px 32px 0",width:620,maxWidth:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}}
              onClick={e=>e.stopPropagation()}>

              {/* Header — style comparateur */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Logo variant="color" height={28} to={null}/>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>Publier votre annonce</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Confirmez avant de soumettre</div>
                  </div>
                </div>
                <button onClick={()=>setShowPublishModal(false)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",flexShrink:0}}>
                  <X size={18} strokeWidth={2.5}/>
                </button>
              </div>

              {/* Corps scrollable */}
              <div style={{flex:1,overflowY:"auto",paddingBottom:32}}>
                {/* Icône avertissement monochrome centrée */}
                <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
                  <div style={{width:72,height:72,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <AlertTriangle size={36} color="#475569" strokeWidth={1.8}/>
                  </div>
                </div>

                <h2 style={{fontSize:26,fontWeight:900,color:"#0f172a",margin:"0 0 14px",lineHeight:1.2,textAlign:"center"}}>
                  Prêt à publier ?
                </h2>
                <p style={{fontSize:16,color:"#374151",lineHeight:1.75,margin:"0 0 10px",textAlign:"center"}}>
                  Votre annonce sera soumise à une <strong>validation</strong> avant d'être visible sur la carte.
                </p>
                <p style={{fontSize:14,color:"#64748b",lineHeight:1.65,margin:"0 0 32px",textAlign:"center"}}>
                  Délai d'approbation estimé : <strong>24h</strong>. Vous pourrez la modifier à tout moment après publication.
                </p>

                <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                  <button onClick={()=>setShowPublishModal(false)}
                    style={{padding:"14px 32px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:15,fontWeight:600,color:"#374151",cursor:"pointer",minWidth:140}}>
                    Annuler
                  </button>
                  <button onClick={()=>{setShowPublishModal(false);handleSubmit();}}
                    style={{padding:"14px 40px",borderRadius:12,border:"none",background:"#0f172a",color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",minWidth:160,letterSpacing:".01em"}}>
                    Je publie
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Modal IA */}
        <AIDescriptionModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onConfirm={handleAIConfirm}
          initialData={{
            ...formData,
            gouvernorat: gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label || "",
            delegation:  delegations.find(d => String(d.id) === String(hierarchy.delegation))?.nom || "",
          }}
          currentDescription={formData.description}
        />

        <style>{`
          /* -- Root layout -- */
          .ca-root {
            display: flex;
            min-height: calc(100vh - 64px);
            background: #f8fafc;
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          }

          /* -- Sidebar -- */
          .ca-sidebar {
            width: 260px;
            min-width: 260px;
            background: #fff;
            border-right: 1px solid #e5e7eb;
          }
          .ca-sidebar__hero {
            background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
            padding: 20px 20px 14px;
            display: flex;
            align-items: flex-end;
            gap: 12px;
            min-height: 110px;
            position: relative;
            overflow: hidden;
          }
          .ca-sidebar__hero-img {
            width: 90px;
            height: 90px;
            object-fit: contain;
            flex-shrink: 0;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,.4));
          }
          .ca-sidebar__hero-text {
            display: flex;
            flex-direction: column;
            gap: 1px;
            padding-bottom: 6px;
          }
          .ca-sidebar__hero-title {
            font-size: 20px;
            font-weight: 900;
            color: #fff;
            line-height: 1.1;
            letter-spacing: -.02em;
          }
          .ca-sidebar__hero-sub {
            font-size: 13px;
            font-weight: 500;
            color: #94a3b8;
          }
          /* override: sidebar border/scroll applies to full aside */
          .ca-sidebar {
            width: 260px;
            min-width: 260px;
            background: #fff;
            border-right: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            height: calc(100vh - 64px);
            overflow-y: auto;
            flex-shrink: 0;
          }
          .ca-sidebar__inner {
            padding: 28px 20px;
          }
          .ca-sidebar__title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 24px;
          }

          /* Steps */
          .ca-steps { display: flex; flex-direction: column; gap: 2px; }
          .ca-step {
            display: flex; align-items: center; gap: 12px;
            padding: 9px 10px; border-radius: 10px;
            transition: background .15s;
            position: relative;
          }

          /* Future (not yet reached) */
          .ca-step--future { opacity: .45; }

          /* Edit mode — toutes les étapes non-actives sont navigables */
          .ca-step--edit-nav { opacity: .75; cursor: pointer; }
          .ca-step--edit-nav:hover { background: #f0fdf4; }
          .ca-step--edit-nav:hover .ca-step__label { color: #15803d; }

          /* Bouton Enregistrer dans la sidebar (edit mode) */
          .ca-sidebar-save-btn {
            width: 100%; margin-top: 18px; padding: 11px 16px;
            display: flex; align-items: center; justify-content: center; gap: 7px;
            background: linear-gradient(135deg, #6366f1, #818cf8);
            color: #fff; border: none; border-radius: 11px;
            font-size: 13.5px; font-weight: 700; cursor: pointer;
            font-family: inherit; transition: all .15s;
            box-shadow: 0 4px 12px rgba(99,102,241,.35);
          }
          .ca-sidebar-save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,.45); }

          /* Active */
          .ca-step--active { background: #eef2ff; }

          /* Done — clickable */
          .ca-step--done {
            cursor: pointer;
          }
          .ca-step--done:hover {
            background: #f0fdf4;
          }
          .ca-step--done:hover .ca-step__circle {
            background: #16a34a; border-color: #16a34a;
          }
          .ca-step--done:hover .ca-step__label {
            color: #15803d;
          }

          .ca-step__circle {
            width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700;
            background: #f1f5f9; color: #94a3b8;
            border: 2px solid #e2e8f0;
            transition: all .15s;
          }
          .ca-step--active .ca-step__circle {
            background: #fff; color: #4f46e5;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(99,102,241,.15);
          }
          .ca-step--done .ca-step__circle {
            background: #0f172a; color: #fff; border-color: #0f172a;
          }
          .ca-step__label {
            font-size: 13px; font-weight: 500; color: #94a3b8;
            flex: 1; transition: color .15s;
          }
          .ca-step--active .ca-step__label { color: #1e293b; font-weight: 700; }
          .ca-step--done  .ca-step__label  { color: #374151; font-weight: 600; }

          /* Back arrow icon (shown on done steps) */
          .ca-step__back-ico {
            font-size: 12px; color: #94a3b8;
            opacity: 0; transition: opacity .15s;
            flex-shrink: 0;
          }
          .ca-step--done:hover .ca-step__back-ico { opacity: 1; color: #16a34a; }

          /* Summary */
          .ca-summary {
            margin-top: 28px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 14px;
          }
          .ca-summary__title {
            font-size: 10.5px; font-weight: 700;
            color: #94a3b8; text-transform: uppercase;
            letter-spacing: .5px; margin-bottom: 10px;
          }
          .ca-summary__row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 5px 0; border-bottom: 1px solid #f1f5f9;
          }
          .ca-summary__row:last-child { border-bottom: none; }
          .ca-summary__key { font-size: 12px; color: #94a3b8; }
          .ca-summary__val { font-size: 12px; font-weight: 600; color: #1e293b; }

          /* -- Main area -- */
          .ca-main {
            flex: 1; min-width: 0;
            padding: 28px 32px 100px;
            overflow-y: auto;
          }

          /* -- Card -- */
          .ca-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 28px 32px;
            box-shadow: 0 1px 6px rgba(0,0,0,.04);
          }
          .ca-step-content { animation: caFade .25s ease; }
          @keyframes caFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

          .ca-card__head {
            display: flex; align-items: center; gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 24px; padding-bottom: 16px;
            border-bottom: 1px solid #f1f5f9;
          }
          .ca-card__head-ico { color: #4f46e5; flex-shrink: 0; }
          .ca-card__title {
            font-size: 20px; font-weight: 700; color: #0f172a;
            display: flex; align-items: center; gap: 10px;
          }
          .ca-card__ai-tag {
            font-size: 11px; font-weight: 600;
            background: linear-gradient(135deg,#667eea,#764ba2);
            color: #fff; padding: 3px 9px; border-radius: 20px;
          }

          /* Section label */
          .ca-section-label {
            font-size: 11px; font-weight: 700;
            color: #9ca3af; text-transform: uppercase;
            letter-spacing: .5px; margin-bottom: 10px;
            display: flex; align-items: center; gap: 8px;
          }

          /* Type dropdown mobile */
          .ca-type-drop-mob { display: none; }
          .ca-type-btn-grid { display: flex; }
          .ca-type-drop-mob__btn {
            width: 100%; display: flex; align-items: center; gap: 10px;
            padding: 11px 14px; border-radius: 10px;
            border: 1.5px solid #e2e8f0; background: #f8fafc;
            font-family: inherit; font-size: 14px; color: #0f172a;
            cursor: pointer; text-align: left;
          }
          .ca-type-drop-mob__btn--err { border-color: #ef4444 !important; background: #fff5f5; }
          .ca-type-drop-mob__arrow { margin-left: auto; font-size: 10px; color: #94a3b8; }
          .ca-type-drop-mob__ico { display: flex; align-items: center; color: #6366f1; }
          .ca-type-drop-mob__list {
            position: absolute; top: calc(100% + 4px); left: 0; right: 0;
            background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,.12); z-index: 200;
            max-height: 260px; overflow-y: auto;
          }
          .ca-type-drop-mob__opt {
            width: 100%; display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; border: none; background: none;
            font-family: inherit; font-size: 13.5px; color: #374151;
            cursor: pointer; text-align: left;
          }
          .ca-type-drop-mob__opt:hover { background: #f8fafc; }
          .ca-type-drop-mob__opt--on { background: #eef2ff; color: #4f46e5; font-weight: 700; }
          .ca-type-drop-mob__opt--on .ca-type-drop-mob__ico { color: #4f46e5; }

          /* Type grid */
          .ca-type-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .ca-type-card {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            padding: 18px 10px; border-radius: 12px;
            border: 2px solid #e5e7eb; background: #f9fafb;
            cursor: pointer; font-family: inherit;
            transition: all .15s;
          }
          .ca-type-card:hover { border-color: #c7d2fe; background: #f0f4ff; }
          .ca-type-card--on {
            border-color: #0f172a; background: #0f172a;
            box-shadow: 0 4px 14px rgba(15,23,42,.2);
          }
          .ca-type-card--on .ca-type-card__label { color: #fff; }
          .ca-type-card__ico { font-size: 28px; }
          .ca-type-card__label { font-size: 12.5px; font-weight: 600; color: #374151; }

          /* Pills */
          .ca-pill-row { display: flex; gap: 8px; padding: 4px; border-radius: 12px; border: 1.5px solid transparent; transition: border-color .15s; }
          .ca-pill-row--err { border-color: #ef4444 !important; background: #fff5f5; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
          .ca-pill {
            padding: 8px 22px; border-radius: 24px;
            border: 2px solid #e5e7eb; background: #f9fafb;
            font-size: 13px; font-weight: 600; color: #6b7280;
            cursor: pointer; font-family: inherit;
            transition: all .15s;
          }
          .ca-pill:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
          .ca-pill--on { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,.35); }

          /* Etat cards */
          .ca-etat-row { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px; border-radius: 12px; border: 1.5px solid transparent; transition: border-color .15s; }
          .ca-etat-row--err { border-color: #ef4444 !important; background: #fff5f5; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
          .ca-etat-card {
            display: flex; align-items: center; gap: 6px;
            padding: 9px 16px; border-radius: 10px;
            border: 2px solid #e5e7eb; background: #f9fafb;
            font-size: 13px; font-weight: 600; color: #6b7280;
            cursor: pointer; font-family: inherit; transition: all .15s;
          }
          .ca-etat-card:hover { border-color: #6366f1; background: #eef2ff; color: #4f46e5; }
          .ca-etat-card--on { border-color: #6366f1; background: #6366f1; color: #fff; }

          /* Counters */
          .ca-counters {
            display: flex; gap: 12px; flex-wrap: wrap;
          }
          .ca-counter {
            flex: 1; min-width: 130px;
            background: #f8fafc; border: 1px solid #e5e7eb;
            border-radius: 12px; padding: 14px 16px;
            display: flex; flex-direction: column; gap: 10px;
          }
          .ca-counter__label { font-size: 12.5px; font-weight: 600; color: #374151; }
          .ca-counter__ctrl { display: flex; align-items: center; gap: 12px; }
          .ca-counter__btn {
            width: 32px; height: 32px; border-radius: 8px;
            border: 1.5px solid #e5e7eb; background: #fff;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: #374151; transition: all .15s;
          }
          .ca-counter__btn:hover { background: #0f172a; color: #fff; border-color: #0f172a; }
          .ca-counter__val { font-size: 20px; font-weight: 700; color: #0f172a; min-width: 28px; text-align: center; }

          /* Feature cards (step 2) */
          .ca-feat-section { margin-bottom: 20px; }
          .ca-feat-grid { display: flex; flex-wrap: wrap; gap: 8px; }
          .ca-feat-card {
            position: relative;
            display: flex; align-items: center; gap: 7px;
            padding: 9px 14px; border-radius: 10px;
            border: 1.5px solid #e5e7eb; background: #f9fafb;
            font-size: 13px; font-weight: 500; color: #374151;
            cursor: pointer; font-family: inherit; transition: all .15s;
          }
          .ca-feat-card:hover { border-color: #6366f1; background: #eef2ff; color: #4f46e5; }
          .ca-feat-card--on { border-color: #6366f1; background: #6366f1; color: #fff; }
          .ca-feat-card__ico { font-size: 18px; display:flex; align-items:center; }
          .ca-feat-card__label { font-size: 13px; }
          .ca-feat-card__check { margin-left: 2px; color: #a3e635; }

          /* Toggle boutons (options villa) */
          .ca-toggle-group { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
          .ca-toggle-btn {
            display: flex; align-items: center; gap: 5px;
            padding: 7px 14px; border-radius: 20px;
            border: 1.5px solid #e5e7eb; background: #f9fafb;
            font-size: 12.5px; font-weight: 600; color: #374151;
            cursor: pointer; font-family: inherit; transition: all .15s;
          }
          .ca-toggle-btn:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
          .ca-toggle-btn--on { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,.3); }

          /* Orientation grid */
          /* orientation removed */
          .ca-orient-btn-UNUSED {
            padding: 6px 14px; border-radius: 20px;
            border: 1.5px solid #e5e7eb; background: #f9fafb;
            font-size: 12px; font-weight: 600; color: #374151;
            cursor: pointer; font-family: inherit; transition: all .15s;
          }
          .ca-orient-btn:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
          .ca-orient-btn--on { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,.3); }

          /* Accompagnement checkbox */
          /* -- Toggle anonyme -- */
          .ca-anon-toggle { border:1.5px solid #e0e7ff; border-radius:12px; background:#f8f9ff; }
          .ca-anon-toggle__inner { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 16px; }
          .ca-anon-toggle__text { display:flex; flex-direction:column; gap:3px; flex:1; }
          .ca-anon-toggle__title { font-size:14px; font-weight:700; color:#0f172a; }
          .ca-anon-toggle__sub   { font-size:12.5px; color:#64748b; line-height:1.4; }
          .ca-anon-sw { position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; cursor:pointer; }
          .ca-anon-sw input { opacity:0; width:0; height:0; }
          .ca-anon-sw__track {
            position:absolute; inset:0; border-radius:24px;
            background:#d1d5db; transition:background .2s;
          }
          .ca-anon-sw__track::before {
            content:""; position:absolute; width:18px; height:18px;
            left:3px; bottom:3px; border-radius:50%;
            background:#fff; transition:transform .2s;
            box-shadow:0 1px 4px rgba(0,0,0,.2);
          }
          .ca-anon-sw input:checked + .ca-anon-sw__track { background:#6366f1; }
          .ca-anon-sw input:checked + .ca-anon-sw__track::before { transform:translateX(20px); }

          .ca-accom-check {
            padding: 14px 16px;
            background: linear-gradient(135deg, #eef2ff, #f5f3ff);
            border: 1.5px solid #c7d2fe; border-radius: 12px;
          }
          .ca-accom-check__label {
            display: flex; align-items: flex-start; gap: 10px;
            cursor: pointer; font-size: 13.5px; color: #374151; line-height: 1.5;
          }
          .ca-accom-check__input {
            width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer;
            margin-top: 2px; flex-shrink: 0;
          }
          .ca-accom-check__ico { color: #6366f1; flex-shrink: 0; margin-top: 2px; }

          /* Step 2 — two-column layout */
          .ca-loc-layout {
            display: grid;
            grid-template-columns: 360px 1fr;
            gap: 28px;
            align-items: stretch;
          }
          .ca-loc-fields {
            display: flex; flex-direction: column; gap: 12px;
          }
          .ca-loc-map {
            display: flex; flex-direction: column; gap: 8px;
            min-height: 440px;
          }
          .ca-loc-map > div:first-child { flex: 1; }

          /* Step 3 — cascade (kept for possible reuse) */
          .ca-cascade { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }
          .ca-cascade__arrow { color: #d1d5db; flex-shrink: 0; margin-bottom: 12px; }

          /* Common fields */
          .ca-field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 120px; }
          .ca-label { font-size: 12.5px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 4px; }
          .ca-label--sec { color: #94a3b8; }
          .ca-req { color: #ef4444; }
          .ca-select, .ca-input {
            border: 1.5px solid #e5e7eb; border-radius: 10px;
            padding: 10px 12px; font-size: 13.5px; font-family: inherit;
            background: #f9fafb; color: #1e293b; outline: none;
            transition: border-color .15s, box-shadow .15s;
            width: 100%;
          }
          .ca-select:focus, .ca-input:focus {
            background: #fff; border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99,102,241,.1);
          }
          .ca-select:disabled { opacity: .45; cursor: not-allowed; }
          .ca-input--sm { font-size: 12.5px; padding: 8px 10px; }
          /* -- Validation errors -- */
          .ca-input--err  { border-color: #ef4444 !important; background: #fff5f5 !important; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
          .ca-select--err { border-color: #ef4444 !important; background: #fff5f5 !important; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
          .ca-val-group--err { outline: 2.5px solid #ef4444; outline-offset: 4px; border-radius: 10px; }
          .ca-counter--err { border-color: #ef4444 !important; background: #fff5f5 !important; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
          .ca-counter--err .ca-counter__label { color: #ef4444; }
          .ca-row-2 { display: flex; gap: 14px; flex-wrap: wrap; }

          /* Step 4 — split layout */
          .ca-split-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            align-items: stretch;
            min-height: 420px;
          }
          .ca-split-left {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .ca-split-right {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .ca-field--full { flex: 1; display: flex; flex-direction: column; gap: 6px; }
          .ca-desc-wrap--full { display: flex; flex-direction: column; flex: 1; }
          .ca-textarea--tall {
            flex: 1;
            min-height: 340px;
            resize: vertical;
          }
          /* Live preview card */
          .ca-live-preview {
            margin-top: 4px;
          }
          .ca-live-preview__header {
            display: flex; align-items: center; gap: 7px;
            margin-bottom: 8px;
          }
          .ca-live-preview__label {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .06em; color: #94a3b8;
          }
          .ca-live-preview__dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 0 3px rgba(34,197,94,.18);
            animation: ca-pulse 1.8s ease-in-out infinite;
          }
          @keyframes ca-pulse {
            0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,.18); }
            50%      { box-shadow: 0 0 0 6px rgba(34,197,94,.06); }
          }
          .ca-live-preview__card {
            background: #f8faff;
            border: 1.5px solid #e0e7ff;
            border-radius: 14px;
            padding: 16px 18px;
            display: flex; flex-direction: column; gap: 10px;
          }
          .ca-live-preview__badge {
            display: inline-block;
            background: #eef2ff; color: #4f46e5;
            font-size: 11px; font-weight: 700;
            padding: 3px 10px; border-radius: 20px;
            text-transform: capitalize; width: fit-content;
          }
          .ca-live-preview__titre {
            font-size: 14.5px; font-weight: 700; color: #1e293b;
            line-height: 1.4; margin: 0;
          }
          .ca-live-preview__ph { color: #cbd5e1; font-weight: 400; font-style: italic; }
          .ca-live-preview__stats {
            display: flex; flex-wrap: wrap; gap: 8px;
          }
          .ca-live-preview__stat {
            display: flex; align-items: center; gap: 4px;
            font-size: 12.5px; color: #475569; font-weight: 500;
            background: #fff; border: 1px solid #e2e8f0;
            border-radius: 8px; padding: 4px 10px;
          }
          .ca-live-preview__stat--prix {
            color: #059669; border-color: #d1fae5; background: #f0fdf4;
            font-weight: 700;
          }
          .ca-live-preview__prixm2 {
            display: flex; align-items: center; justify-content: space-between;
            background: #6366f1; border-radius: 10px;
            padding: 8px 14px;
          }
          .ca-live-preview__prixm2-val {
            font-size: 13px; font-weight: 800; color: #fff;
          }
          .ca-live-preview__prixm2-lbl {
            font-size: 10.5px; color: rgba(255,255,255,.75);
            text-transform: uppercase; letter-spacing: .05em;
          }

          /* -- Évaluation prix (barre de marché) -- */
          .ca-peb {
            margin-top: 12px;
            border: 1.5px solid #e5e7eb; border-radius: 12px;
            padding: 10px 14px 10px;
            background: #fff;
            display: flex; flex-direction: column; gap: 5px;
          }
          .ca-peb__top {
            display: flex; align-items: center; justify-content: space-between;
          }
          .ca-peb__label {
            font-size: 9.5px; font-weight: 800;
            text-transform: uppercase; letter-spacing: .07em;
          }
          .ca-peb__avg {
            font-size: 10.5px; color: #94a3b8; font-weight: 500;
          }
          .ca-peb__bar { display: flex; gap: 3px; }
          .ca-peb__seg { flex: 1; height: 6px; border-radius: 3px; transition: background .2s; }
          .ca-peb__ref {
            font-size: 10px; color: #cbd5e1; text-align: right; line-height: 1;
          }

          @media (max-width: 720px) {
            .ca-split-2col { grid-template-columns: 1fr; min-height: unset; }
            .ca-textarea--tall { min-height: 200px; }
          }

          /* Address row */
          .ca-addr-row { display: flex; gap: 10px; flex-wrap: wrap; }
          .ca-addr-row .ca-input { flex: 1; min-width: 200px; }
          .ca-geo-btn--search {
            padding: 10px 13px; background: #f1f5f9; color: #374151;
            border: 1.5px solid #e2e8f0;
          }
          .ca-geo-btn--search:hover { background: #e2e8f0; }

          .ca-geo-btn {
            display: flex; align-items: center; gap: 7px;
            padding: 10px 18px; border-radius: 10px;
            background: #0f172a; color: #fff;
            border: none; font-size: 13px; font-weight: 600;
            cursor: pointer; font-family: inherit;
            transition: all .15s; white-space: nowrap;
          }
          .ca-geo-btn:hover { background: #1e293b; }
          .ca-geo-btn:disabled { opacity: .6; cursor: not-allowed; }

          /* Map */
          .ca-map-wrap { margin-top: 16px; }
          .ca-map-hint { font-size: 12px; color: #94a3b8; margin-top: 8px; font-style: italic; }

          /* Checkbox row */
          .ca-checkbox-row {
            display: flex; align-items: center; gap: 9px;
            cursor: pointer; padding: 10px 14px;
            background: #f9fafb; border: 1.5px solid #e5e7eb;
            border-radius: 10px; width: fit-content;
          }
          .ca-checkbox-row input[type="checkbox"] { accent-color: #0f172a; width: 15px; height: 15px; }
          .ca-checkbox-label { font-size: 13px; font-weight: 500; color: #374151; }

          /* Titre foncier yes/no */
          .ca-tf-row { display: flex; align-items: center; gap: 14px; }
          .ca-tf-label { font-size: 13px; font-weight: 700; color: #374151; }
          .ca-tf-btns { display: flex; gap: 8px; }
          .ca-tf-btn {
            padding: 8px 22px; border-radius: 9px; border: 1.5px solid #e5e7eb;
            background: #f9fafb; color: #6b7280; font-size: 13px; font-weight: 600;
            cursor: pointer; font-family: inherit; transition: all .15s;
          }
          .ca-tf-btn--on { background: #6366f1; color: #fff; border-color: #6366f1; }
          .ca-tf-btn--no.ca-tf-btn--on { background: #ef4444; border-color: #ef4444; }

          /* Step 4 */
          .ca-input-wand { display: flex; gap: 8px; align-items: center; }
          .ca-input-wand .ca-input { flex: 1; }
          .ca-wand-btn {
            width: 40px; height: 40px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            border-radius: 10px; border: none;
            background: linear-gradient(135deg,#667eea,#764ba2);
            color: #fff; cursor: pointer; transition: all .15s;
          }
          .ca-wand-btn:hover { transform: scale(1.08); box-shadow: 0 4px 14px rgba(102,126,234,.35); }

          .ca-input-unit { display: flex; align-items: center; gap: 8px; }
          .ca-input-unit .ca-input { flex: 1; }
          .ca-unit {
            padding: 10px 14px; background: #f1f5f9; border-radius: 8px;
            font-size: 13px; font-weight: 600; color: #64748b; white-space: nowrap;
          }
          .ca-currency {
            padding: 10px 10px; border: 1.5px solid #e5e7eb; border-radius: 8px;
            font-size: 13px; font-family: inherit; background: #f9fafb;
            color: #374151; outline: none; cursor: pointer;
          }

          .ca-desc-head { margin-bottom: 8px; }
          /* IA strip — minimal */
          .ca-ai-strip {
            display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
            margin-bottom: 10px;
          }
          .ca-ai-strip__label {
            font-size: 12px; color: #9ca3af; white-space: nowrap;
          }
          .ca-ai-pill {
            padding: 6px 14px; border-radius: 20px; font-size: 12.5px;
            font-weight: 600; cursor: pointer; font-family: inherit;
            background: #0f172a; color: #fff; border: none;
            transition: background .15s; white-space: nowrap;
          }
          .ca-ai-pill:hover:not(:disabled) { background: #1e293b; }
          .ca-ai-pill:disabled { opacity: .55; cursor: not-allowed; }
          .ca-ai-pill--ghost {
            background: transparent; color: #374151;
            border: 1.5px solid #e2e8f0;
          }
          .ca-ai-pill--ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

          .ca-desc-wrap { position: relative; }
          .ca-textarea {
            width: 100%; padding: 12px 14px;
            border: 1.5px solid #e5e7eb; border-radius: 10px;
            font-size: 13.5px; font-family: inherit; resize: vertical;
            outline: none; background: #f9fafb; color: #374151;
            min-height: 140px; transition: border-color .15s;
          }
          .ca-textarea:focus { background: #fff; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
          .ca-textarea::placeholder { color: #9ca3af; }
          .ca-desc-stats {
            position: absolute; bottom: 10px; right: 10px;
            background: rgba(255,255,255,.9); padding: 4px 10px;
            border-radius: 6px; font-size: 11px; color: #94a3b8;
            display: flex; gap: 10px;
          }
          .ca-tip {
            margin-top: 10px; font-size: 12.5px; color: #94a3b8; font-style: italic;
          }

          /* Preview (step 5) responsive */
          @media (max-width: 860px) {
            .ca-prev-detail-grid { grid-template-columns: 1fr !important; }
            .ca-prev-detail-grid > div:first-child { order: 2; }
            .ca-prev-detail-grid > div:last-child  { order: 1; }
          }

          /* Step 5 */
          .ca-dropzone {
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
            border: 2px dashed #d1d5db; border-radius: 12px;
            padding: 40px 20px; cursor: pointer; background: #f9fafb;
            transition: all .15s;
          }
          .ca-dropzone:hover { border-color: #6366f1; background: #f0f4ff; }
          .ca-dropzone--main { padding: 56px 20px; }
          .ca-dropzone--sm {
            padding: 20px 10px; min-height: 110px;
            aspect-ratio: 1;
          }
          .ca-dropzone__ico { color: #9ca3af; }
          .ca-dropzone__text { font-size: 13.5px; font-weight: 600; color: #374151; }
          .ca-dropzone__hint { font-size: 12px; color: #9ca3af; }

          .ca-img-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 10px;
          }
          .ca-img-preview {
            position: relative; aspect-ratio: 1;
            border-radius: 12px; overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,.1);
          }
          .ca-img-preview--main { aspect-ratio: 16/9; max-width: 480px; }
          .ca-img-preview img { width: 100%; height: 100%; object-fit: cover; }
          .ca-img-overlay {
            position: absolute; inset: 0;
            background: rgba(0,0,0,.55);
            display: flex; align-items: center; justify-content: center; gap: 8px;
            opacity: 0; transition: opacity .2s;
          }
          .ca-img-preview:hover .ca-img-overlay { opacity: 1; }
          .ca-img-btn {
            width: 36px; height: 36px; border-radius: 50%;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all .15s;
          }
          .ca-img-btn--eye { background: rgba(255,255,255,.9); color: #374151; }
          .ca-img-btn--eye:hover { background: #6366f1; color: #fff; }
          .ca-img-btn--del { background: #ef4444; color: #fff; }
          .ca-img-btn--del:hover { background: #dc2626; }
          .ca-badge {
            position: absolute; bottom: 7px; left: 7px;
            display: flex; align-items: center; gap: 4px;
            padding: 4px 8px; border-radius: 20px;
            font-size: 11px; font-weight: 600;
            backdrop-filter: blur(4px);
          }
          .ca-badge--ok   { background: rgba(22,163,74,.9);  color: #fff; }
          .ca-badge--err  { background: rgba(239,68,68,.9);  color: #fff; }
          .ca-badge--load { background: rgba(234,179,8,.9);  color: #fff; }
          .ca-count-badge {
            margin-left: 8px; padding: 2px 8px;
            background: #e5e7eb; border-radius: 20px;
            font-size: 11px; font-weight: 600; color: #6b7280;
            text-transform: none; letter-spacing: 0;
          }

          /* -- Navigation -- */
          .ca-nav {
            display: flex; justify-content: space-between; align-items: center;
            margin-top: 20px;
          }
          .ca-nav-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 26px; border-radius: 12px;
            font-size: 14px; font-weight: 600; cursor: pointer;
            font-family: inherit; transition: all .15s;
          }
          .ca-nav-btn--ghost {
            background: #fff; color: #374151;
            border: 1.5px solid #e5e7eb;
          }
          .ca-nav-btn--ghost:hover { background: #f1f5f9; border-color: #d1d5db; }
          .ca-nav-btn--solid {
            background: #0f172a; color: #fff; border: none;
            box-shadow: 0 4px 14px rgba(15,23,42,.25);
          }
          .ca-nav-btn--solid:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,23,42,.3); }
          .ca-nav-btn--publish {
            background: linear-gradient(135deg,#10b981,#059669); color: #fff; border: none;
            box-shadow: 0 4px 14px rgba(5,150,105,.3);
          }
          .ca-nav-btn--publish:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,.4); }

          /* Spin */
          .ca-spin { animation: caSpin .8s linear infinite; }
          @keyframes caSpin { to { transform: rotate(360deg); } }

          /* Preview nav button */
          .ca-nav-btn--preview {
            background: #6366f1; color: #fff; border: none;
            box-shadow: 0 4px 14px rgba(99,102,241,.3);
          }
          .ca-nav-btn--preview:hover { background: #4f46e5; transform: translateY(-1px); }

          /* Step 6 preview styles */
          .ca-prev-badge {
            display: inline-block; font-size: 12px; font-weight: 700;
            padding: 4px 12px; border-radius: 20px;
          }
          .ca-prev-badge--type { background: #0f172a; color: #fff; }
          .ca-prev-badge--cat  { background: #eef2ff; color: #4f46e5; }
          .ca-prev-badge--etat { background: #f0fdf4; color: #16a34a; }
          .ca-prev-title {
            font-size: 22px; font-weight: 800; color: #0f172a;
            margin: 0 0 8px;
          }
          .ca-prev-price {
            font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 14px;
          }
          .ca-prev-price span { font-size: 16px; font-weight: 600; color: #64748b; }
          .ca-prev-details {
            display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px;
          }
          .ca-prev-details span {
            background: #f8fafc; border: 1px solid #e5e7eb;
            padding: 6px 12px; border-radius: 8px;
            font-size: 13px; font-weight: 600; color: #374151;
          }
          .ca-prev-loc {
            display: flex; align-items: center; gap: 6px;
            font-size: 14px; color: #64748b; margin-bottom: 16px;
          }
          .ca-prev-features {
            display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;
          }
          .ca-prev-feat {
            background: #f1f5f9; border: 1px solid #e2e8f0;
            padding: 5px 12px; border-radius: 20px;
            font-size: 12.5px; color: #374151;
          }
          .ca-prev-desc {
            background: #f8fafc; border: 1px solid #e5e7eb;
            border-radius: 12px; padding: 16px 18px; margin-bottom: 4px;
          }
          .ca-prev-desc p {
            font-size: 13.5px; color: #374151; line-height: 1.6;
            white-space: pre-wrap; margin: 0;
          }
          .ca-prev-section-lbl {
            font-size: 11px; font-weight: 700; color: #9ca3af;
            text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px;
          }

          /* Card header with required hint */
          .ca-req-hint {
            margin-left: auto;
            font-size: 11.5px; color: #9ca3af; font-weight: 500;
            white-space: nowrap;
          }
          .ca-req-hint .ca-req { color: #ef4444; font-weight: 700; margin-right: 2px; }

          /* Mobile stepper */
          .ca-mob-stepper {
            display: none;
            padding: 18px 28px 8px;
          }
          .ca-mob-stepper__track {
            position: relative; height: 32px; display: flex; align-items: center;
            margin-bottom: 10px;
          }
          .ca-mob-stepper__line {
            position: absolute; top: 50%; left: 0; right: 0;
            height: 3px; background: #e2e8f0; transform: translateY(-50%);
            border-radius: 999px;
          }
          .ca-mob-stepper__line-fill {
            position: absolute; top: 50%; left: 0;
            height: 3px; background: linear-gradient(90deg,#4f46e5,#818cf8);
            transform: translateY(-50%); border-radius: 999px;
            transition: width .35s ease;
          }
          .ca-mob-step-dot {
            position: absolute; transform: translateX(-50%);
            width: 26px; height: 26px; border-radius: 50%;
            border: 2px solid #e2e8f0; background: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700; color: #94a3b8;
            cursor: default; font-family: inherit; padding: 0;
            transition: all .2s;
          }
          .ca-mob-step-dot--done {
            border-color: #4f46e5; background: #4f46e5; color: #fff; cursor: pointer;
          }
          .ca-mob-step-dot--active {
            border-color: #4f46e5; background: #fff; color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(99,102,241,.18);
          }
          .ca-mob-step-dot--done:hover {
            background: #3730a3; border-color: #3730a3;
          }
          .ca-mob-stepper__label {
            font-size: 12px; font-weight: 700; color: #4f46e5;
            text-align: center; letter-spacing: .01em;
          }

          /* Step 1 — two-column layout */
          .ca-step1-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 36px;
            align-items: start;
          }
          .ca-step1-left {
            display: flex;
            flex-direction: column;
          }
          .ca-step1-right {
            display: flex;
            flex-direction: column;
            gap: 0;
            position: sticky;
            top: 20px;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .ca-sidebar { display: none; }
            .ca-main { padding: 0 0 100px; }
            .ca-mob-stepper { display: block; }
            .ca-main > form { padding: 12px 16px 0; }
            .ca-card { padding: 20px 18px; }
            .ca-step1-cols { grid-template-columns: 1fr; gap: 24px; }
            .ca-type-drop-mob { display: block; }
            .ca-type-btn-grid { display: none !important; }
          }
          @media (max-width: 860px) {
            .ca-loc-layout { grid-template-columns: 1fr; }
            .ca-loc-map { min-height: 320px; }
            .ca-feat-big-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 6px !important; }
            .ca-feat-big { aspect-ratio: 1 !important; padding: 6px !important; gap: 8px !important; min-height: 0 !important; justify-content: center !important; border-radius: 10px !important; }
            .ca-feat-big__ico svg { width: 26px !important; height: 26px !important; }
            .ca-feat-big__label { font-size: 10.5px !important; line-height: 1.2 !important; }
            .ca-feat-big-wrap { gap: 4px !important; }
            .ca-feats-section-title { font-size: 10px !important; margin-top: 12px !important; margin-bottom: 6px !important; padding-top: 10px !important; letter-spacing: .4px !important; }
            .ca-feats-section-title:first-child { margin-top: 4px !important; }
          }
          @media (max-width: 600px) {
            .ca-cascade { flex-direction: column; }
            .ca-cascade__arrow { display: none; }
            .ca-nav { flex-direction: column-reverse; gap: 10px; }
            .ca-nav-btn { width: 100%; justify-content: center; }
          }

          /* -- New big-icon feature cards — monochromatic, no borders -- */
          .ca-feats-section { margin-top: 36px; padding-top: 28px; border-top: 1.5px solid #f1f5f9; }
          .ca-feats-section-title {
            font-size: 11.5px; font-weight: 700; color: #64748b;
            text-transform: uppercase; letter-spacing: .6px;
            margin-bottom: 18px; margin-top: 32px;
            display: flex; align-items: center; gap: 8px;
            line-height: 1.5;  /* allows wrapping on 2 lines */
          }
          .ca-feats-section-title:first-child { margin-top: 0; }
          .ca-feat-big-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 28px; }
          .ca-feat-big-wrap { display: flex; flex-direction: column; gap: 10px; }
          .ca-feat-big {
            position: relative; display: flex; flex-direction: column; align-items: center;
            gap: 10px; padding: 24px 12px 18px;
            border-radius: 16px; border: none; background: transparent;
            cursor: pointer; font-family: inherit; transition: background .15s, transform .15s;
            min-height: 116px; width: 100%;
          }
          .ca-feat-big:hover { background: #f1f5f9; }
          .ca-feat-big--on { background: #eef2ff; }
          .ca-feat-big__ico {
            display: flex; align-items: center; justify-content: center;
            transition: transform .15s, color .15s; color: #94a3b8;
          }
          .ca-feat-big:hover .ca-feat-big__ico { transform: scale(1.1); color: #4f46e5; }
          .ca-feat-big--on .ca-feat-big__ico { color: #4f46e5; transform: scale(1.05); }
          .ca-feat-big__label { font-size: 13px; font-weight: 600; text-align: center; line-height: 1.35; color: #6b7280; }
          .ca-feat-big--on .ca-feat-big__label { color: #4f46e5; font-weight: 700; font-size: 13px; }
          .ca-feat-big__check { position: absolute; top: 6px; right: 6px; color: #4f46e5; }
          .ca-feat-big-extra { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 9px; padding: 8px 10px; }
          .ca-feat-big-extra__label { font-size: 10.5px; font-weight: 600; color: #64748b; margin-bottom: 5px; display: flex; align-items: center; gap: 4px; }

          /* -- Step 1 compact 2-col (kept for other uses) -- */
          .ca-s1-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          @media (max-width: 700px) { .ca-s1-2col { grid-template-columns: 1fr; } }

          /* -- Step 1 gauche/droite (droite = type/offre/état, gauche = sous-champs) -- */
          .ca-s1-lr { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: start; }
          .ca-s1-lr__left  { display: flex; flex-direction: column; gap: 0; order: 2; }
          .ca-s1-lr__right { display: flex; flex-direction: column; gap: 0; order: 1; }
          @media (max-width: 820px) {
            .ca-s1-lr { grid-template-columns: 1fr; }
            .ca-s1-lr__left  { order: 2; }
            .ca-s1-lr__right { order: 1; }
          }

          /* -- Prix/m² inline pill -- */
          .ca-prixm2-pill {
            display: inline-flex; align-items: center; gap: 7px;
            background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 8px; padding: 6px 12px; margin-top: 6px;
            font-size: 13px; color: #15803d;
          }
          .ca-prixm2-pill strong { font-weight: 700; font-size: 13.5px; }
          .ca-prixm2-pill__lbl { font-size: 11px; color: #86efac; font-weight: 600; }

          /* -- New unified image grid -- */
          .ca-img-unified-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
          }
          .ca-img-uni-card {
            position: relative; aspect-ratio: 1;
            border-radius: 12px; overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,.1);
            border: 2.5px solid transparent;
            transition: border-color .15s;
          }
          .ca-img-uni-card--main { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.25), 0 4px 12px rgba(0,0,0,.12); }
          .ca-img-uni-card img { width:100%; height:100%; object-fit:cover; }
          .ca-img-main-badge {
            position: absolute; top: 7px; left: 7px;
            background: #f59e0b; color: #fff;
            font-size: 10.5px; font-weight: 700;
            padding: 3px 8px; border-radius: 20px;
            pointer-events: none;
          }
          .ca-img-uni-card .ca-img-overlay { opacity: 0; }
          .ca-img-uni-card:hover .ca-img-overlay { opacity: 1; }
          .ca-img-btn--heart { background: rgba(255,255,255,.85); color: #92400e; }
          .ca-img-btn--heart:hover { background: #f59e0b; color: #fff; }
          .ca-img-btn--heart-on { background: #f59e0b !important; color: #fff !important; }
          /* -- Drag & Drop zone -- */
          .ca-img-dnd-zone {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 4px; padding: 32px 20px;
            border: 2.5px dashed #c7d2fe; border-radius: 16px;
            background: #f8faff; cursor: pointer; transition: all .2s;
            text-align: center;
          }
          .ca-img-dnd-zone:hover, .ca-img-dnd-zone--over {
            border-color: #6366f1; background: #eef2ff;
            box-shadow: 0 0 0 4px rgba(99,102,241,.1);
          }
          .ca-img-dnd-zone--over { transform: scale(1.01); }

          .ca-img-add-slot {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            aspect-ratio: 1; border-radius: 12px;
            border: 2px dashed #d1d5db; background: #f9fafb;
            cursor: pointer; gap: 4px; transition: all .15s;
          }
          .ca-img-add-slot:hover { border-color: #6366f1; background: #f0f4ff; }
        `}</style>
      </div>
    </Layout>
  );
};

export default function CreerAnnonce() {
  return <CreateListingForm />;
}
