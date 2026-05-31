import React, { useState, useEffect, useRef, useCallback, useContext, createContext } from "react";
import API_URL from '../config';
import { useNavigate } from "react-router-dom";
import {
  Home, Building2, MapPin, Camera, ChevronRight, ChevronLeft, Save,
  Check, X, Upload, Trash2, Eye, Bed, Bath, Maximize2, DollarSign,
  CheckCircle2, XCircle, Loader, Sparkles, Wand2,
  Minus, Plus, Navigation,
  Leaf, Store, Waves, Mountain, TreePine, Sun, Flower2,
  ArrowUpDown, Car, ParkingCircle, Package, Sofa,
  UtensilsCrossed, Wind, Thermometer, Compass, Wrench,
  HardHat, ThumbsUp, Hammer,
  Wifi, Flame, DoorClosed, ShieldCheck, Tv, PhoneCall, Users, KeyRound, Droplets, Signal, Heart, RefreshCw, Monitor, LockKeyhole, Fence, Fingerprint, Briefcase
} from "lucide-react";
import Layout from "../components/Layout";
import AIDescriptionModal from '../components/AIDescriptionModal';
import useLocalisation from "../hooks/useLocalisation";
import { useToast } from "../components/Toast";
import "leaflet/dist/leaflet.css";

/* ── Bannière accompagnement ── */
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

/* ── Carte Leaflet contrôlée (position synced via prop) ── */
function ControlledMap({ position, onLocationChange }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

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

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        { attribution: "© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team", maxZoom: 19 }).addTo(map);

      const marker = L.marker([position.lat, position.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", async () => {
        const { lat, lng } = marker.getLatLng();
        const address = await getAddress(lat, lng);
        onLocationChange({ lat, lng, address });
      });

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        const address = await getAddress(lat, lng);
        onLocationChange({ lat, lng, address });
      });

      setTimeout(() => map.invalidateSize(), 80);
    })();
    return () => { live = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []); // eslint-disable-line

  /* Update marker & pan when position prop changes */
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([position.lat, position.lng]);
    mapRef.current.setView([position.lat, position.lng], Math.max(mapRef.current.getZoom(), 12));
  }, [position.lat, position.lng]);

  return (
    <div style={{position:"relative", width:"100%", height:"100%", minHeight:420}}>
      <div ref={containerRef} style={{width:"100%", height:"100%", minHeight:420, borderRadius:12, overflow:"hidden"}}/>
      <div style={{
        position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
        background:"rgba(255,255,255,0.96)", backdropFilter:"blur(6px)",
        border:"2px solid #e2e8f0", borderRadius:10,
        padding:"9px 20px", fontSize:14, fontWeight:700, color:"#0f172a",
        pointerEvents:"none", zIndex:999, whiteSpace:"nowrap",
        boxShadow:"0 4px 16px rgba(0,0,0,.18)",
        display:"flex", alignItems:"center", gap:8,
        letterSpacing:".01em"
      }}>
        <span style={{fontSize:16}}>📍</span> Déplacez l'emplacement
      </div>
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

/* ── Barre évaluation prix ─────────────────────────────────── */
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

/* ── Helper: build prefill formData from detail API response ── */
function buildPrefill(a) {
  const feat = a.features || [];
  return {
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
    accompagnement:    false,
    jardin:            feat.includes("Jardin"),
    terrasse:          feat.includes("Terrasse"),
    balcon:            feat.includes("Balcon"),
    parking:           feat.includes("Parking"),
    garage:            feat.includes("Garage"),
    ascenseur:         feat.includes("Ascenseur"),
    vue_mer:           feat.includes("Vue sur mer"),
    vue_montagne:      feat.includes("Vue montagne"),
    vue_foret:         feat.includes("Vue forêt"),
    piscine:           feat.includes("Piscine"),
    concierge:         feat.includes("Concierge"),
    cellier:           feat.includes("Chambre rangement"),
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

  /* ── Guard : doit être connecté pour publier ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login?redirect=/creer_annonce", { replace: true });
  }, []);

  /* ── Restore step + non-file form data from localStorage ── */
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
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
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
    nb_pieces: 0, nb_chambres: 0, nb_salles_bain: 0,
    vue_mer: false, vue_montagne: false, vue_foret: false, jardin: false,
    terrasse: false, balcon: false, ascenseur: false, garage: false, parking: false,
    cellier: false, meuble: false, cuisine_equipee: false, climatisation: false,
    chauffage_centrale: false, orientation: "",
    piscine: false, concierge: false, digicode: false, interphone: false, gardien: false,
    relie_onas: false, salon_americain: false, fibre_optique: false, cheminee: false,
    double_vitrage: false, porte_blindee: false, securite: false, internet: false,
    machine_laver: false, tv: false, animaux_admis: false,
    age_bien: "", surface_jardin: "", surface_terrasse: "", nb_places_garage: 1,
    gouvernorat: "", delegation: "", localite: "",
    address: "Tunis, Tunisie", latitude: "36.8065", longitude: "10.1815",
    titre: "", superficie: "", prix: "", devise: "TND", description: "",
    duree_type: "", duree_valeur: "", accompagnement: false,
    allImages: [], mainImageIndex: 0
  };

  const [formData, setFormData] = useState(() => {
    if (editId) return defaultFormData; // Will be overwritten by edit useEffect
    try {
      const saved = localStorage.getItem("ca_formdata");
      if (!saved) return defaultFormData;
      const parsed = JSON.parse(saved);
      return { ...defaultFormData, ...parsed, allImages: [], mainImageIndex: 0 };
    } catch { return defaultFormData; }
  });

  const [imageValidation, setImageValidation] = useState({});
  /* ── Edit mode state ── */
  const [loadingEdit,        setLoadingEdit]        = useState(false);
  const [loadingEditError,   setLoadingEditError]   = useState(false);
  const [editPropertyIdState,setEditPropertyIdState]= useState(null);
  /* Images existantes (edit mode) — URLs chargées depuis le backend */
  const [existingImageUrls,  setExistingImageUrls]  = useState([]);
  /* ── Stats de marché (prix moyen/m² par gouvernorat) ── */
  const [marketStats, setMarketStats] = useState({});

  const totalSteps = 5;

  const [addressFilter, setAddressFilter] = useState("");

  /* ── Persist form state to localStorage (non-file fields only) — skip in edit mode ── */
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

  /* ── Reset categorie if type_bien changes to terrain/local_commercial and categorie is vacances ── */
  useEffect(() => {
    if ((formData.type_bien === "terrain" || formData.type_bien === "local_commercial") && formData.categorie === "vacances") {
      setFormData(prev => ({ ...prev, categorie: "" }));
    }
  }, [formData.type_bien]);

  /* ── Reset etat_bien if categorie changes to location/vacances and etat is cours_construction ── */
  useEffect(() => {
    if ((formData.categorie === "location" || formData.categorie === "vacances") && formData.etat_bien === "cours_construction") {
      setFormData(prev => ({ ...prev, etat_bien: "" }));
    }
  }, [formData.categorie]);

  /* ── Fetch stats prix/m² depuis les annonces publiques ── */
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

  /* ── Load existing annonce data when in edit mode ── */
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
          setExistingImageUrls(a.images.map(img =>
            img.startsWith("http") ? img : `${API_URL}${img}`
          ));
        }
        setLoadingEdit(false);
      })
      .catch(() => {
        setLoadingEditError(true);
        setLoadingEdit(false);
      });
  }, [editId]); // eslint-disable-line

  /* ── Incompatibilités terrain type ↔ vocation (calcul inline, sans toast) ── */
  const TERRAIN_INCOMPATIBILITIES = {
    agricole:    ["commerciale","industrielle","touristique"],
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

  const clearFormStorage = () => {
    if (editId) return; // Don't clear storage in edit mode
    ["ca_step", "ca_formdata", "ca_hierarchy", "ca_maploc"].forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
  };

  const handleHierarchyChange = (level, value) => {
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

    /* Geocode → pan map (tous les niveaux) */
    const govLabel = gouvernorats.find(g => g.value === newHierarchy.gouvernorat)?.label || "";
    const delLabel = delegations.find(d => d.id === newHierarchy.delegation)?.nom || "";
    const locLabel = localites.find(l => l.id === newHierarchy.localite)?.nom || "";

    /* Adresse progressive : dès qu'un niveau est choisi */
    let builtAddress = "";
    if (locLabel && delLabel && govLabel) {
      builtAddress = [locLabel, delLabel, govLabel, "Tunisie"].join(", ");
    } else if (delLabel && govLabel) {
      builtAddress = [delLabel, govLabel, "Tunisie"].join(", ");
    } else if (govLabel) {
      builtAddress = govLabel + ", Tunisie";
    }

    /* Mettre à jour l'adresse immédiatement (avant même le geocode) */
    if (builtAddress) {
      setFormData(prev => ({ ...prev, address: builtAddress }));
    }

    const searchLabel = locLabel || delLabel || govLabel;
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


  /* ── Champs invalides (bordure rouge) ── */
  const [validationErrors, setValidationErrors] = useState({});

  const nextStep = () => {
    const errors = {};

    if (currentStep === 1) {
      if (!formData.type_bien)  errors.type_bien  = true;
      if (!formData.categorie)  errors.categorie  = true;
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast("Champs requis ✦ Veuillez compléter les champs en rouge.", "error");
        return;
      }
    }
    if (currentStep === 2) {
      if (!hierarchy.gouvernorat) errors.gouvernorat = true;
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast("Champ requis ✦ Sélectionnez un gouvernorat.", "error");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.titre.trim())                          errors.titre     = true;
      const sup = parseFloat(formData.superficie);
      if (!formData.superficie || isNaN(sup) || sup <= 0)  errors.superficie = true;
      const px = parseFloat(formData.prix);
      if (!formData.prix || isNaN(px) || px <= 0)          errors.prix       = true;
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast("Champs requis ✦ Veuillez compléter les champs en rouge.", "error");
        return;
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

    const prixVal = parseFloat(formData.prix);
    if (!formData.prix || isNaN(prixVal) || prixVal <= 0) {
      toast("Veuillez saisir un prix valide (étape 3).", "error"); return;
    }
    if (prixVal > 9_999_999_999) {
      toast("Le prix saisi est trop élevé (maximum 9 999 999 999).", "error"); return;
    }

    const supVal = parseFloat(formData.superficie);
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
      /* ── Build shared payload ── */
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
        etat_bien:         formData.etat_bien         || null,
        etage:             formData.etage ? parseInt(formData.etage) : null,
        /* type_option_villa est une sélection multiple (ex: "sous-sol,rez-de-jardin").
           Le backend attend une seule valeur enum → on envoie null pour éviter l'erreur DB.
           Les options villa sont sauvegardées dans le formulaire mais pas soumises à la DB. */
        type_option_villa: null,
        nb_pieces:         formData.nb_pieces    || null,
        nb_chambres:       formData.nb_chambres  || null,
        nb_salles_bain:    formData.nb_salles_bain || null,
      };

      /* ── EDIT MODE branch ── */
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

        /* Upload new images if any were added */
        if (formData.allImages.length > 0) {
          const orderedImages = [
            formData.allImages[formData.mainImageIndex] || formData.allImages[0],
            ...formData.allImages.filter((_, i) => i !== formData.mainImageIndex)
          ];
          for (let i = 0; i < orderedImages.length; i++) {
            try {
              const imgForm = new FormData();
              imgForm.append("file", orderedImages[i]);
              await fetch(`${API_URL}/upload/image`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: imgForm,
              });
            } catch { /* non-bloquant */ }
          }
        }

        /* Update property */
        if (editPropertyIdState) {
          await fetch(`${API_URL}/properties/${editPropertyIdState}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              address:   formData.address   || "",
              latitude:  parseFloat(formData.latitude)  || 0,
              longitude: parseFloat(formData.longitude) || 0,
            }),
          });
        }

        toast("Annonce mise à jour !");
        setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
        return;
      }

      /* ── CREATE MODE branch ── */
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

      /* ── 2. Upload ALL images (main first, then extras) ── */
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

      /* ── 3. Créer la propriété (localisation + image principale) ── */
      const propRes = await handleRes(await fetch(`${API_URL}/properties/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          annonce_id:        annonce.id,
          address:           formData.address    || "",
          latitude:          parseFloat(formData.latitude)  || 0,
          longitude:         parseFloat(formData.longitude) || 0,
          image_principale:  imageUrl,
        }),
      }));
      const propData = await propRes.json();

      /* ── 3b. Ajouter les images supplémentaires ── */
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
      toast("Annonce créée et publiée sur la carte !");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
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
        bureau:"bureau", ferme:"ferme", local_commercial:"local commercial", maison:"maison"
      };
      const typeFr = typeLabels[formData.type_bien] || formData.type_bien;
      const offreFr = formData.categorie === "location"  ? "à louer"
                    : formData.categorie === "vacances"  ? "en location saisonnière"
                    : "à vendre";

      // ── Paragraphe 1 : accroche ──
      let desc = "";
      const locStr = delLabel ? `${delLabel}${govLabel?`, ${govLabel}`:""}` : govLabel || "";
      desc += `Nous vous proposons ${typeFr === "appartement" ? "cet" : "ce"} ${typeFr} ${offreFr}`;
      if (locStr) desc += `, idéalement situé à ${locStr}`;
      if (formData.address && formData.address !== "Tunis, Tunisie") desc += ` (${formData.address})`;
      desc += ".\n\n";

      // ── Paragraphe 2 : composition ──
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

      // ── Paragraphe 3 : état ──
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

      // ── Paragraphe 4 : équipements ──
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

      // ── Paragraphe 5 : terrain spécifique ──
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

      // ── Phrase de clôture ──
      if (formData.prix) {
        desc += `Affiché au prix de ${Number(formData.prix).toLocaleString("fr-TN")} ${formData.devise}, `;
      }
      desc += "ce bien constitue une opportunité à saisir. N'hésitez pas à nous contacter pour obtenir plus d'informations ou convenir d'une visite.";

      setFormData(prev => ({ ...prev, description: desc.trim() }));
      setIsAILoading(false);
    }, 900);
  };

  // Summary for sidebar
  const summary = [
    formData.type_bien && { label: "Type", value: formData.type_bien.charAt(0).toUpperCase() + formData.type_bien.slice(1) },
    formData.categorie && { label: "Offre", value: formData.categorie.charAt(0).toUpperCase() + formData.categorie.slice(1) },
    hierarchy.gouvernorat && { label: "Gouvernorat", value: gouvernorats.find(g => g.value === hierarchy.gouvernorat)?.label || hierarchy.gouvernorat },
    formData.superficie && { label: "Superficie", value: `${formData.superficie} m²` },
    formData.prix && { label: "Prix", value: `${Number(formData.prix).toLocaleString('fr-TN')} ${formData.devise}` },
  ].filter(Boolean);

  const TYPE_CARDS = [
    { value: "appartement",     label: "Appartement",     Ico: Building2,  color: "#3b82f6" },
    { value: "villa",           label: "Villa/Maison",    Ico: Home,       color: "#10b981" },
    { value: "terrain",         label: "Terrain",         Ico: Leaf,       color: "#f59e0b" },
    { value: "local_commercial",label: "Local commercial",Ico: Store,      color: "#f97316" },
    { value: "bureau",          label: "Bureau",          Ico: Briefcase,  color: "#6366f1" },
  ];

  const ETAT_CARDS = [
    { value: "nouveau",            label: "Neuf",           Ico: Sparkles, color: "#6366f1" },
    { value: "bon_etat",           label: "Bon état",       Ico: ThumbsUp, color: "#16a34a" },
    { value: "a_renover",          label: "À rénover",      Ico: Wrench,   color: "#f59e0b" },
    { value: "cours_construction", label: "En construction",Ico: HardHat,  color: "#64748b" },
  ];

  /* ── Icônes personnalisées (SVG inline) ── */
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
    { key:"vue_montagne",  Ico:Mountain,    label:"Vue montagne",      color:"#8b5cf6" },
    { key:"vue_foret",     Ico:TreePine,    label:"Vue forêt",         color:"#16a34a" },
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
    { key:"cellier",         Ico:Package,       label:"Chambre rangement", color:"#92400e" },
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
        {/* ── Left sidebar ── */}
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
                    {(done || (editId && !active)) && <span className="ca-step__back-ico">↩</span>}
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

        {/* ── Main area ── */}
        <main className="ca-main">

          {/* Mobile progress bar (sidebar hidden on mobile) */}
          <div className="ca-mobile-progress">
            <div className="ca-mobile-progress__top">
              <span className="ca-mobile-progress__label">
                {STEPS[currentStep - 1]?.label}
              </span>
              <span className="ca-mobile-progress__steps">
                Étape {currentStep} / {totalSteps}
              </span>
            </div>
            <div className="ca-mobile-progress__bar">
              <div
                className="ca-mobile-progress__fill"
                style={{ width: `${Math.round((currentStep / totalSteps) * 100)}%` }}
              />
            </div>
          </div>

          <form onSubmit={e => e.preventDefault()}>
            <div className="ca-card">

              {/* ─── STEP 1 ─── */}
              {currentStep === 1 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Building2 size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Type & Caractéristiques</h2>
                    <span className="ca-req-hint"><span className="ca-req">*</span> champs requis</span>
                  </div>

                  {/* ── Grille gauche / droite ── */}
                  <div className="ca-s1-lr">

                    {/* ── GAUCHE : sous-champs spécifiques, pièces, orientation ── */}
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
                              <option value="0">Rez-de-chaussée</option>
                              <option value="1">1er étage</option>
                              <option value="2">2ème étage</option>
                              <option value="3">3ème étage</option>
                              <option value="4">4ème+</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Local commercial & Bureau sub-fields */}
                      {(formData.type_bien === "local_commercial" || formData.type_bien === "bureau") && (
                        <div className="ca-field">
                          <label className="ca-label">Étage du bien</label>
                          <select className="ca-select" value={formData.etage}
                            onChange={e => handleInputChange("etage", e.target.value)}>
                            <option value="">Sélectionner…</option>
                            <option value="0">Rez-de-chaussée (R)</option>
                            <option value="1">R+1</option>
                            <option value="2">R+2</option>
                            <option value="3">R+3</option>
                            <option value="4">R+4</option>
                          </select>
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
                          <div className="ca-tf-row">
                            <span className="ca-tf-label">Titre foncier</span>
                            <div className="ca-tf-btns">
                              <button type="button"
                                className={`ca-tf-btn${formData.titre_foncier==="1"?" ca-tf-btn--on":""}`}
                                onClick={() => handleInputChange("titre_foncier","1")}>Oui</button>
                              <button type="button"
                                className={`ca-tf-btn${formData.titre_foncier==="0"?" ca-tf-btn--on ca-tf-btn--no":""}`}
                                onClick={() => handleInputChange("titre_foncier","0")}>Non</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pièces & espaces */}
                      {formData.type_bien !== "terrain" && (<>
                        <div className="ca-section-label" style={{marginTop:20}}>Pièces & espaces</div>
                        <div className="ca-counters">
                          {[
                            { field:"nb_pieces",     label:"Pièce(s)" },
                            { field:"nb_chambres",   label:"Chambre(s)" },
                            { field:"nb_salles_bain",label:"Salle(s) d'eau / Salle(s) de bain" },
                          ].map(c => (
                            <div key={c.field} className="ca-counter">
                              <span className="ca-counter__label">{c.label}</span>
                              <div className="ca-counter__ctrl">
                                <button type="button" className="ca-counter__btn" onClick={() => decrementValue(c.field)}><Minus size={14}/></button>
                                <span className="ca-counter__val">{formData[c.field]}</span>
                                <button type="button" className="ca-counter__btn" onClick={() => incrementValue(c.field)}><Plus size={14}/></button>
                              </div>
                            </div>
                          ))}
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

                    </div>{/* /ca-s1-lr__left */}

                    {/* ── DROITE : type, offre, état, ancienneté ── */}
                    <div className="ca-s1-lr__right">

                      <div className="ca-section-label">Sélectionnez le type <span className="ca-req">*</span></div>
                      <div className={`ca-etat-row ca-val-group${validationErrors.type_bien?" ca-val-group--err":""}`} style={{flexWrap:"wrap"}}>
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

                      <div className="ca-section-label" style={{marginTop:20}}>Type d'offre <span className="ca-req">*</span></div>
                      <div className={`ca-pill-row ca-val-group${validationErrors.categorie?" ca-val-group--err":""}`}>
                        {[{v:"vente",l:"Vente"},{v:"location",l:"Location"},{v:"vacances",l:"Vacances"}]
                          .filter(o => !(o.v==="vacances"&&(formData.type_bien==="terrain"||formData.type_bien==="local_commercial")))
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
                            <select className="ca-select" value={formData.duree_type||""}
                              onChange={e => handleInputChange("duree_type", e.target.value)}>
                              <option value="">Sélectionner…</option>
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
                        <div className="ca-section-label" style={{marginTop:20}}>État du bien</div>
                        <div className="ca-etat-row" style={{flexWrap:"wrap"}}>
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

                        {formData.etat_bien && formData.etat_bien !== "nouveau" && (
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

                    </div>{/* /ca-s1-lr__right */}
                  </div>{/* /ca-s1-lr */}

                  {/* ── Caractéristiques — directement dans la page, sans wrapper ── */}

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

                  {formData.type_bien !== "terrain" && (
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

                  {formData.type_bien !== "terrain" && (<>
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

                </div>
              )}

              {/* ─── STEP 2 ─── */}
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
                        <label className="ca-label">Délégation</label>
                        <select className="ca-select" value={hierarchy.delegation}
                          disabled={!hierarchy.gouvernorat}
                          onChange={e => handleHierarchyChange("delegation", e.target.value)}>
                          <option value="">{hierarchy.gouvernorat ? "Toutes les délégations" : "Sélectionnez un gouvernorat"}</option>
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

                      <div className="ca-section-label" style={{marginTop:18}}>Adresse exacte</div>
                      <div className="ca-addr-row">
                        <input
                          type="text"
                          className="ca-input"
                          placeholder="Ex: 15 Avenue Habib Bourguiba, Tunis"
                          value={formData.address}
                          onChange={e => handleInputChange("address", e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); geocodeAddress(); } }}
                        />
                        <button type="button" className="ca-geo-btn ca-geo-btn--search" onClick={geocodeAddress} title="Chercher sur la carte">
                          <MapPin size={15}/>
                        </button>
                        <button type="button" className="ca-geo-btn" onClick={handleGeolocate} disabled={isGeolocating} title="Position actuelle">
                          {isGeolocating ? <Loader size={15} className="ca-spin"/> : <Navigation size={15}/>}
                        </button>
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
                      />
                    </div>

                  </div>

                </div>
              )}

              {/* ─── STEP 3 ─── */}
              {currentStep === 3 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Sparkles size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Présentation <span className="ca-card__ai-tag">IA Assistée</span></h2>
                    <span className="ca-req-hint"><span className="ca-req">*</span> champs requis</span>
                  </div>

                  {/* ─── Split 2 colonnes ─── */}
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
                            title="Suggérer un titre avec l'IA"
                            onClick={() => {
                              if (formData.type_bien) {
                                const titles = [
                                  `Superbe ${formData.type_bien} ${hierarchy.gouvernorat ? `à ${gouvernorats.find(g=>g.value===hierarchy.gouvernorat)?.label || ""}` : ""}`,
                                  `${formData.type_bien.charAt(0).toUpperCase() + formData.type_bien.slice(1)} exceptionnel`,
                                  `Magnifique ${formData.type_bien} moderne`
                                ];
                                handleInputChange("titre", titles[Math.floor(Math.random() * titles.length)]);
                              }
                            }}
                          >
                            <Wand2 size={15}/>
                          </button>
                        </div>
                      </div>

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
                        <div className="ca-input-unit">
                          <input type="number"
                            className={`ca-input${validationErrors.prix ? " ca-input--err" : ""}`}
                            placeholder="250000" min="1" max="9999999999"
                            value={formData.prix}
                            onChange={e => { handleInputChange("prix", e.target.value); setValidationErrors(v=>({...v,prix:false})); }}/>
                          <select className="ca-currency" value={formData.devise}
                            onChange={e => handleInputChange("devise", e.target.value)}>
                            <option value="TND">DT</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>

                      {/* ── Aperçu en direct ── */}
                      {(() => {
                        const prixNum = parseFloat(formData.prix);
                        const surfNum = parseFloat(formData.superficie);
                        const prixM2  = (prixNum > 0 && surfNum > 0)
                          ? Math.round(prixNum / surfNum).toLocaleString("fr-TN")
                          : null;
                        const devise  = formData.devise === "TND" ? "DT" : formData.devise;
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

                      {/* ── Évaluation de marché ── */}
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

                        {/* IA actions — minimal strip */}
                        <div className="ca-ai-strip">
                          <span className="ca-ai-strip__label">Générer avec l'IA :</span>
                          <button type="button" className="ca-ai-pill"
                            onClick={generateQuickAIDescription} disabled={isAILoading}>
                            {isAILoading ? "Génération…" : "Rédaction rapide"}
                          </button>
                          {/* Assistant guidé — à activer plus tard
                          <button type="button" className="ca-ai-pill ca-ai-pill--ghost"
                            onClick={() => setIsAIModalOpen(true)}>
                            Assistant guidé
                          </button>
                          */}
                        </div>

                        <div className="ca-desc-wrap ca-desc-wrap--full">
                          <textarea className="ca-textarea ca-textarea--tall"
                            placeholder="Décrivez votre bien : luminosité, équipements, quartier, points forts…"
                            value={formData.description}
                            onChange={e => handleInputChange("description", e.target.value)}
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

              {/* ─── STEP 4 ─── */}
              {currentStep === 4 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Camera size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Photos du bien</h2>
                    <span className="ca-req-hint">{formData.allImages.length}/10 photos</span>
                  </div>

                  <p className="ca-tip" style={{marginBottom:12}}>
                    Glissez-déposez vos photos ou cliquez pour sélectionner. Cœur ❤️ pour définir l'image principale.
                  </p>
                  {/* ── Images existantes (edit mode) ── */}
                  {editId && existingImageUrls.length > 0 && (
                    <div style={{marginBottom:20}}>
                      <div className="ca-section-label" style={{marginBottom:10}}>
                        Photos actuelles de l'annonce
                        <span className="ca-count-badge">{existingImageUrls.length}</span>
                      </div>
                      <div className="ca-img-unified-grid">
                        {existingImageUrls.map((url, idx) => (
                          <div key={url} className="ca-img-uni-card" style={{border:"2px solid #e5e7eb"}}>
                            <img src={url} alt={`Photo ${idx+1}`}
                              style={{width:"100%",height:"100%",objectFit:"cover"}}
                              onError={e => { e.currentTarget.style.display="none"; }}/>
                            <div className="ca-img-overlay">
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
                                      /* Extraire l'URL relative pour l'API */
                                      const relUrl = url.startsWith(API_URL)
                                        ? url.slice(API_URL.length) : url;
                                      await fetch(`${API_URL}/properties/${editPropertyIdState}/images`, {
                                        method: "DELETE",
                                        headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
                                        body: JSON.stringify({ image: relUrl }),
                                      });
                                    } catch { /* silencieux */ }
                                  }
                                  setExistingImageUrls(prev => prev.filter(u => u !== url));
                                }}>
                                <Trash2 size={15}/>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zone drag-and-drop globale */}
                  {formData.allImages.length < 10 && (
                    <div
                      className="ca-img-dnd-zone"
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("ca-img-dnd-zone--over"); }}
                      onDragLeave={e => e.currentTarget.classList.remove("ca-img-dnd-zone--over")}
                      onDrop={e => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("ca-img-dnd-zone--over");
                        const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
                        const remaining = 10 - formData.allImages.length;
                        const toAdd = files.slice(0, remaining).filter(f => f.size <= 10 * 1024 * 1024);
                        if (files.some(f => f.size > 10 * 1024 * 1024)) toast("Certaines images dépassent 10 MB.", "error");
                        if (toAdd.length > 0) setFormData(prev => ({ ...prev, allImages: [...prev.allImages, ...toAdd] }));
                      }}
                      onClick={() => document.getElementById("ca-dnd-input").click()}
                    >
                      <input id="ca-dnd-input" type="file" accept="image/*" multiple style={{display:"none"}}
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          const remaining = 10 - formData.allImages.length;
                          const toAdd = files.slice(0, remaining).filter(f => f.size <= 10 * 1024 * 1024);
                          if (files.some(f => f.size > 10 * 1024 * 1024)) toast("Certaines images dépassent 10 MB.", "error");
                          if (toAdd.length > 0) setFormData(prev => ({ ...prev, allImages: [...prev.allImages, ...toAdd] }));
                          e.target.value = "";
                        }}
                      />
                      <Upload size={32} style={{color:"#9ca3af"}}/>
                      <span style={{fontSize:14,fontWeight:600,color:"#374151",marginTop:8}}>Glissez vos photos ici</span>
                      <span style={{fontSize:12,color:"#9ca3af"}}>ou cliquez pour parcourir — JPG, PNG, max 10 MB</span>
                      <span style={{fontSize:11,color:"#c7d2fe",marginTop:4}}>{formData.allImages.length}/10 photos ajoutées</span>
                    </div>
                  )}

                  <div className="ca-img-unified-grid" style={{marginTop: formData.allImages.length > 0 ? 16 : 0}}>
                    {formData.allImages.map((file, index) => {
                      const isMain = index === formData.mainImageIndex;
                      return (
                        <div key={index} className={`ca-img-uni-card${isMain ? " ca-img-uni-card--main" : ""}`}>
                          <img src={URL.createObjectURL(file)} alt={`Image ${index + 1}`}/>
                          {isMain && (
                            <div className="ca-img-main-badge">⭐ Principale</div>
                          )}
                          <div className="ca-img-overlay">
                            <button type="button" className="ca-img-btn ca-img-btn--eye"
                              onClick={() => window.open(URL.createObjectURL(file), "_blank")}>
                              <Eye size={15}/>
                            </button>
                            <button type="button"
                              className={`ca-img-btn ca-img-btn--heart${isMain ? " ca-img-btn--heart-on" : ""}`}
                              title={isMain ? "Image principale" : "Définir comme principale"}
                              onClick={() => handleInputChange("mainImageIndex", index)}>
                              <Heart size={15} fill={isMain ? "#fff" : "none"}/>
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
                    {formData.allImages.length > 0 && formData.allImages.length < 10 && (
                      <label className="ca-img-add-slot">
                        <input type="file" accept="image/*" multiple style={{display:"none"}}
                          onChange={e => {
                            const files = Array.from(e.target.files || []);
                            const remaining = 10 - formData.allImages.length;
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

                  <p className="ca-tip" style={{marginTop:14}}>
                    Ajoutez jusqu'à 10 photos. La photo avec ⭐ sera l'image principale visible sur les annonces.
                  </p>

                  {/* ── Accompagnement checkbox ── */}
                  <div className="ca-accom-check" style={{marginTop:28}}>
                    <label className="ca-accom-check__label">
                      <input type="checkbox" className="ca-accom-check__input"
                        checked={formData.accompagnement || false}
                        onChange={e => handleInputChange("accompagnement", e.target.checked)}/>
                      <Sparkles size={14} className="ca-accom-check__ico"/>
                      <span>Je souhaite être accompagné(e) par un professionnel de l'immobilier dans la transaction du bien immobilier (achat / vente / location)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ─── STEP 5 — Prévisualisation ─── */}
              {currentStep === 5 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Eye size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Prévisualisation</h2>
                  </div>
                  <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>
                    Vérifiez toutes les informations avant de publier.
                  </p>

                  {/* Badges */}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                    {formData.type_bien && (
                      <span className="ca-prev-badge ca-prev-badge--type">
                        {formData.type_bien.charAt(0).toUpperCase()+formData.type_bien.slice(1)}
                      </span>
                    )}
                    {formData.categorie && (
                      <span className="ca-prev-badge ca-prev-badge--cat">
                        {formData.categorie.charAt(0).toUpperCase()+formData.categorie.slice(1)}
                      </span>
                    )}
                    {formData.etat_bien && (
                      <span className="ca-prev-badge ca-prev-badge--etat">
                        {formData.etat_bien==="nouveau"?"Neuf":formData.etat_bien==="bon_etat"?"Bon état":formData.etat_bien==="a_renover"?"À rénover":"En construction"}
                      </span>
                    )}
                  </div>

                  {/* Title + price */}
                  <h3 className="ca-prev-title">{formData.titre || <em style={{color:"#94a3b8"}}>Titre non défini</em>}</h3>
                  {formData.prix && (
                    <div className="ca-prev-price">{Number(formData.prix).toLocaleString("fr-TN")} <span>{formData.devise}</span></div>
                  )}

                  {/* Key details row */}
                  <div className="ca-prev-details">
                    {formData.superficie && <span>📐 {formData.superficie} m²</span>}
                    {formData.nb_pieces > 0 && <span>🚪 {formData.nb_pieces} pièce{formData.nb_pieces>1?"s":""}</span>}
                    {formData.nb_chambres > 0 && <span>🛏 {formData.nb_chambres} chambre{formData.nb_chambres>1?"s":""}</span>}
                    {formData.nb_salles_bain > 0 && <span>🚿 {formData.nb_salles_bain} sdb</span>}
                  </div>

                  {/* Location */}
                  <div className="ca-prev-loc">
                    <MapPin size={13}/>
                    {[
                      gouvernorats.find(g=>g.value===hierarchy.gouvernorat)?.label,
                      delegations.find(d=>String(d.id)===String(hierarchy.delegation))?.nom,
                      localites.find(l=>String(l.id)===String(hierarchy.localite))?.nom,
                    ].filter(Boolean).join(", ") || <em style={{color:"#94a3b8"}}>Localisation non définie</em>}
                    {formData.address && formData.address !== "Tunis, Tunisie" && ` — ${formData.address}`}
                  </div>

                  {/* Features */}
                  {[
                    {k:"vue_mer",l:"🌊 Vue mer"},{k:"vue_montagne",l:"⛰️ Vue montagne"},{k:"vue_foret",l:"🌲 Vue forêt"},
                    {k:"jardin",l:"🏡 Jardin"},{k:"terrasse",l:"☀️ Terrasse"},{k:"balcon",l:"🪴 Balcon"},
                    {k:"ascenseur",l:"🛗 Ascenseur"},{k:"garage",l:"🚗 Garage"},{k:"parking",l:"🅿️ Parking"},
                    {k:"cellier",l:"📦 Cellier"},{k:"meuble",l:"🛋️ Meublé"},{k:"cuisine_equipee",l:"🍳 Cuisine équipée"},
                    {k:"climatisation",l:"❄️ Climatisation"},
                  ].filter(f=>formData[f.k]).length > 0 && (
                    <div className="ca-prev-features">
                      {[
                        {k:"vue_mer",l:"🌊 Vue mer"},{k:"vue_montagne",l:"⛰️ Vue montagne"},{k:"vue_foret",l:"🌲 Vue forêt"},
                        {k:"jardin",l:"🏡 Jardin"},{k:"terrasse",l:"☀️ Terrasse"},{k:"balcon",l:"🪴 Balcon"},
                        {k:"ascenseur",l:"🛗 Ascenseur"},{k:"garage",l:"🚗 Garage"},{k:"parking",l:"🅿️ Parking"},
                        {k:"cellier",l:"📦 Cellier"},{k:"meuble",l:"🛋️ Meublé"},{k:"cuisine_equipee",l:"🍳 Cuisine équipée"},
                        {k:"climatisation",l:"❄️ Climatisation"},
                      ].filter(f=>formData[f.k]).map(f=>(
                        <span key={f.k} className="ca-prev-feat">{f.l}</span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {formData.description && (
                    <div className="ca-prev-desc">
                      <div className="ca-prev-section-lbl">Description</div>
                      <p>{formData.description}</p>
                    </div>
                  )}

                  {/* Main image */}
                  {formData.allImages.length > 0 && (
                    <div style={{marginTop:20}}>
                      <div className="ca-prev-section-lbl">Image principale</div>
                      <img
                        src={URL.createObjectURL(formData.allImages[formData.mainImageIndex] || formData.allImages[0])}
                        alt="Principale"
                        style={{width:"100%",maxWidth:480,borderRadius:12,objectFit:"cover",maxHeight:280,display:"block"}}
                      />
                    </div>
                  )}

                  {/* Additional images */}
                  {formData.allImages.length > 1 && (
                    <div style={{marginTop:16}}>
                      <div className="ca-prev-section-lbl">Photos ({formData.allImages.length} au total)</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {formData.allImages.slice(0,6).map((img,i)=>(
                          <img key={i} src={URL.createObjectURL(img)} alt={`img ${i}`}
                            style={{width:80,height:80,objectFit:"cover",borderRadius:8}}/>
                        ))}
                        {formData.allImages.length > 6 && (
                          <div style={{width:80,height:80,borderRadius:8,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#64748b",fontWeight:700}}>
                            +{formData.allImages.length-6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

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
                  : <button type="button" className="ca-nav-btn ca-nav-btn--publish" onClick={handleSubmit}>
                      <Check size={17}/> {editId ? "Mettre à jour l'annonce" : "Créer l'annonce"}
                    </button>
              }
            </div>
          </form>
        </main>

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
          /* ── Root layout ── */
          .ca-root {
            display: flex;
            min-height: calc(100vh - 64px);
            background: #f8fafc;
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          }

          /* ── Sidebar ── */
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

          /* ── Main area ── */
          .ca-main {
            flex: 1; min-width: 0;
            padding: 28px 32px 100px;
            overflow-y: auto;
          }

          /* ── Card ── */
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
          .ca-pill-row { display: flex; gap: 8px; }
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
          .ca-etat-row { display: flex; gap: 8px; flex-wrap: wrap; }
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
          /* ── Validation errors ── */
          .ca-input--err  { border-color: #ef4444 !important; background: #fff5f5 !important; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
          .ca-select--err { border-color: #ef4444 !important; background: #fff5f5 !important; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
          .ca-val-group--err { outline: 2.5px solid #ef4444; outline-offset: 4px; border-radius: 10px; }
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

          /* ── Évaluation prix (barre de marché) ── */
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

          /* ── Navigation ── */
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

          /* Mobile progress bar */
          .ca-mobile-progress {
            display: none;
            padding: 14px 16px 0;
          }
          .ca-mobile-progress__top {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 8px;
          }
          .ca-mobile-progress__label {
            font-size: 13px; font-weight: 700; color: #1e293b;
          }
          .ca-mobile-progress__steps {
            font-size: 12px; color: #94a3b8; font-weight: 600;
          }
          .ca-mobile-progress__bar {
            height: 5px; background: #e5e7eb; border-radius: 999px; overflow: hidden;
          }
          .ca-mobile-progress__fill {
            height: 100%; background: linear-gradient(90deg,#4f46e5,#818cf8);
            border-radius: 999px; transition: width .35s ease;
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
            .ca-mobile-progress { display: block; }
            .ca-main > form { padding: 12px 16px 0; }
            .ca-card { padding: 20px 18px; }
            .ca-step1-cols { grid-template-columns: 1fr; gap: 24px; }
          }
          @media (max-width: 860px) {
            .ca-loc-layout { grid-template-columns: 1fr; }
            .ca-loc-map { min-height: 320px; }
          }
          @media (max-width: 600px) {
            .ca-cascade { flex-direction: column; }
            .ca-cascade__arrow { display: none; }
            .ca-nav { flex-direction: column-reverse; gap: 10px; }
            .ca-nav-btn { width: 100%; justify-content: center; }
          }

          /* ── New big-icon feature cards — monochromatic, no borders ── */
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

          /* ── Step 1 compact 2-col (kept for other uses) ── */
          .ca-s1-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          @media (max-width: 700px) { .ca-s1-2col { grid-template-columns: 1fr; } }

          /* ── Step 1 gauche/droite (droite = type/offre/état, gauche = sous-champs) ── */
          .ca-s1-lr { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: start; }
          .ca-s1-lr__left  { display: flex; flex-direction: column; gap: 0; order: 2; }
          .ca-s1-lr__right { display: flex; flex-direction: column; gap: 0; order: 1; }
          @media (max-width: 820px) {
            .ca-s1-lr { grid-template-columns: 1fr; }
            .ca-s1-lr__left  { order: 2; }
            .ca-s1-lr__right { order: 1; }
          }

          /* ── Prix/m² inline pill ── */
          .ca-prixm2-pill {
            display: inline-flex; align-items: center; gap: 7px;
            background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 8px; padding: 6px 12px; margin-top: 6px;
            font-size: 13px; color: #15803d;
          }
          .ca-prixm2-pill strong { font-weight: 700; font-size: 13.5px; }
          .ca-prixm2-pill__lbl { font-size: 11px; color: #86efac; font-weight: 600; }

          /* ── New unified image grid ── */
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
          .ca-img-btn--heart { background: rgba(255,255,255,.85); color: #374151; }
          .ca-img-btn--heart:hover { background: #f43f5e; color: #fff; }
          .ca-img-btn--heart-on { background: #f43f5e !important; color: #fff !important; }
          /* ── Drag & Drop zone ── */
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
