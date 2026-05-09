import React, { useState, useEffect, useRef, useCallback } from "react";
import API_URL from '../config';
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Home, Building2, MapPin, Camera, ChevronRight, ChevronLeft,
  Check, X, Upload, Trash2, Eye, Bed, Bath, Maximize2,
  CheckCircle2, XCircle, Loader, Sparkles, Wand2,
  Minus, Plus, Navigation, ArrowLeft, Save
} from "lucide-react";
import Layout from "../components/Layout";
import useLocalisation from "../hooks/useLocalisation";
import { useToast } from "../components/Toast";
import "leaflet/dist/leaflet.css";


/* ── Controlled map ── */
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
      L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
        { attribution: "© Contributeurs OpenStreetMap", maxZoom: 19 }).addTo(map);
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

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([position.lat, position.lng]);
    mapRef.current.setView([position.lat, position.lng], Math.max(mapRef.current.getZoom(), 12));
  }, [position.lat, position.lng]);

  return <div ref={containerRef} style={{ width: "100%", height: 300, borderRadius: 10, overflow: "hidden" }} />;
}

const STEPS = [
  { id: 1, label: "Type de bien",     icon: Building2 },
  { id: 2, label: "Caractéristiques", icon: CheckCircle2 },
  { id: 3, label: "Localisation",     icon: MapPin },
  { id: 4, label: "Présentation",     icon: Sparkles },
  { id: 5, label: "Photos",           icon: Camera },
  { id: 6, label: "Prévisualiser",    icon: Eye },
];

const TYPE_CARDS = [
  { value: "appartement", label: "Appartement", icon: "🏢" },
  { value: "villa",       label: "Villa",        icon: "🏡" },
  { value: "terrain",     label: "Terrain",      icon: "🌿" },
  { value: "commercial",  label: "Local commercial", icon: "🏪" },
];
const ETAT_CARDS = [
  { value: "nouveau",            label: "Neuf",           icon: "✨" },
  { value: "bon_etat",           label: "Bon état",        icon: "👍" },
  { value: "a_renover",          label: "À rénover",       icon: "🔧" },
  { value: "cours_construction", label: "En construction", icon: "🏗️" },
];
const VUE_ITEMS = [
  { key: "vue_mer",      icon: "🌊", label: "Vue sur mer" },
  { key: "vue_montagne", icon: "⛰️", label: "Vue montagne" },
  { key: "vue_foret",    icon: "🌲", label: "Vue forêt" },
];
const EXT_ITEMS = [
  { key: "jardin",   icon: "🏡", label: "Jardin" },
  { key: "terrasse", icon: "☀️", label: "Terrasse" },
  { key: "balcon",   icon: "🪴", label: "Balcon" },
];
const COM_ITEMS = [
  { key: "ascenseur",      icon: "🛗", label: "Ascenseur" },
  { key: "garage",         icon: "🚗", label: "Garage" },
  { key: "parking",        icon: "🅿️", label: "Parking" },
  { key: "cellier",        icon: "📦", label: "Cellier" },
  { key: "meuble",         icon: "🛋️", label: "Meublé" },
  { key: "cuisine_equipee",icon: "🍳", label: "Cuisine équipée" },
  { key: "climatisation",  icon: "❄️", label: "Climatisation" },
];

export default function EditAnnonce() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const toast      = useToast();

  const [currentStep,   setCurrentStep]   = useState(1);
  const [loadingData,   setLoadingData]   = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [propertyId,    setPropertyId]    = useState(null);
  const [isGeolocating, setIsGeolocating] = useState(false);

  /* images */
  const [existingMainImage, setExistingMainImage] = useState(null);
  const [mainImageFile,     setMainImageFile]     = useState(null);
  const [existingImages,    setExistingImages]    = useState([]);

  const [mapLocation, setMapLocation] = useState({ lat: 36.8065, lng: 10.1815, address: "Tunis, Tunisie" });
  const [hierarchy,   setHierarchy]   = useState({ gouvernorat: "", delegation: "", localite: "" });
  const { gouvernorats, delegations, localites } = useLocalisation(hierarchy);

  const [formData, setFormData] = useState({
    type_bien: "", categorie: "", etat_bien: "",
    type_terrain: "", titre_foncier: "", type_appartement: "", etage: "",
    type_villa: "", type_option_villa: "",
    nb_pieces: 0, nb_chambres: 0, nb_salles_bain: 0,
    vue_mer: false, vue_montagne: false, vue_foret: false,
    jardin: false, terrasse: false, balcon: false,
    ascenseur: false, garage: false, parking: false,
    cellier: false, meuble: false, cuisine_equipee: false, climatisation: false,
    gouvernorat: "", delegation: "", localite: "",
    address: "", latitude: "", longitude: "",
    titre: "", superficie: "", prix: "", devise: "TND", description: "",
  });

  const token = localStorage.getItem("token");

  /* Load existing annonce */
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    loadAnnonce();
  }, [id]); // eslint-disable-line

  async function loadAnnonce() {
    setLoadingData(true);
    try {
      const res  = await fetch(`\/annonces/${id}/detail`);
      if (!res.ok) throw new Error("not_found");
      const a = await res.json();

      setPropertyId(a.property_id || null);
      setExistingMainImage(a.latitude ? null : null); // will be set below
      const mainImg = a.images?.[0] || null;
      const extras  = a.images?.slice(1) || [];

      /* Prefix relative URLs */
      const toAbs = (u) => (!u ? null : u.startsWith("http") ? u : `\${u}`);
      setExistingMainImage(toAbs(mainImg));
      setExistingImages(extras.map(toAbs).filter(Boolean));

      /* Localisation hierarchy — gov/del/loc are ID refs stored in a.gouvernorat_id etc. */
      const newHierarchy = {
        gouvernorat: a.gouvernorat_id ? String(a.gouvernorat_id) : "",
        delegation:  a.delegation_id  ? String(a.delegation_id)  : "",
        localite:    a.localite_id    ? String(a.localite_id)    : "",
      };
      setHierarchy(newHierarchy);

      if (a.latitude && a.longitude) {
        setMapLocation({ lat: a.latitude, lng: a.longitude, address: a.address || "" });
      }

      setFormData({
        type_bien:         a.type_bien         || "",
        categorie:         a.categorie         || "",
        etat_bien:         a.etat_bien         || "",
        type_terrain:      a.type_terrain      || "",
        titre_foncier:     a.titre_foncier != null ? String(a.titre_foncier) : "",
        type_appartement:  a.type_appartement  || "",
        etage:             a.etage != null ? String(a.etage) : "",
        type_villa:        a.type_villa        || "",
        type_option_villa: a.type_option_villa || "",
        nb_pieces:         a.nb_pieces         || 0,
        nb_chambres:       a.nb_chambres       || 0,
        nb_salles_bain:    a.nb_salles_bain    || 0,
        /* characteristics derived from features array */
        vue_mer:        a.features?.includes("Vue sur mer")     || false,
        vue_montagne:   a.features?.includes("Vue montagne")    || false,
        vue_foret:      a.features?.includes("Vue forêt")       || false,
        jardin:         a.features?.includes("Jardin")          || false,
        terrasse:       a.features?.includes("Terrasse")        || false,
        balcon:         a.features?.includes("Balcon")          || false,
        ascenseur:      a.features?.includes("Ascenseur")       || false,
        garage:         a.features?.includes("Garage")          || false,
        parking:        a.features?.includes("Parking")         || false,
        cellier:        a.features?.includes("Cellier")         || false,
        meuble:         a.features?.includes("Meublé")          || false,
        cuisine_equipee:a.features?.includes("Cuisine équipée") || false,
        climatisation:  a.features?.includes("Climatisation")   || false,
        address:    a.address    || "",
        latitude:   a.latitude   ? String(a.latitude)  : "",
        longitude:  a.longitude  ? String(a.longitude) : "",
        titre:       a.titre       || "",
        superficie:  a.superficie  ? String(a.superficie)  : "",
        prix:        a.prix        ? String(a.prix)        : "",
        devise:      a.devise      || "TND",
        description: a.description || "",
      });
    } catch {
      toast("Impossible de charger l'annonce.", "error");
      navigate("/dashboard");
    } finally {
      setLoadingData(false);
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "latitude" && !isNaN(parseFloat(value)))
      setMapLocation(prev => ({ ...prev, lat: parseFloat(value) }));
    if (field === "longitude" && !isNaN(parseFloat(value)))
      setMapLocation(prev => ({ ...prev, lng: parseFloat(value) }));
    if (field === "address")
      setMapLocation(prev => ({ ...prev, address: value }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const increment = (f) => { if (formData[f] < 15) handleInputChange(f, formData[f]+1); };
  const decrement = (f) => { if (formData[f] > 0)  handleInputChange(f, formData[f]-1); };

  const handleHierarchyChange = (level, value) => {
    const h = { ...hierarchy };
    if (level === "gouvernorat") { h.gouvernorat = value; h.delegation = ""; h.localite = ""; }
    else if (level === "delegation") { h.delegation = value; h.localite = ""; }
    else { h[level] = value; }
    setHierarchy(h);

    const label = level === "gouvernorat"
      ? gouvernorats.find(g => g.value === value)?.label
      : level === "delegation"
        ? delegations.find(d => d.id === value)?.nom
        : localites.find(l => l.id === value)?.nom;
    if (label) {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(label+" Tunisie")}&format=json&limit=1`,
        { headers: { "Accept-Language": "fr" } })
        .then(r => r.json())
        .then(data => {
          if (data[0]) {
            const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
            setMapLocation(prev => ({ ...prev, lat, lng }));
            handleInputChange("latitude", String(lat));
            handleInputChange("longitude", String(lng));
          }
        }).catch(() => {});
    }
  };

  const handleMapLocationChange = (loc) => {
    setMapLocation(loc);
    setFormData(prev => ({
      ...prev,
      latitude:  String(loc.lat),
      longitude: String(loc.lng),
      address:   loc.address,
    }));
  };

  const geocodeAddress = async () => {
    const q = formData.address?.trim();
    if (!q) return;
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { "Accept-Language": "fr" } }).catch(() => null);
    if (!res) return;
    const data = await res.json();
    if (data[0]) {
      const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
      setMapLocation(prev => ({ ...prev, lat, lng, address: q }));
      handleInputChange("latitude", String(lat));
      handleInputChange("longitude", String(lng));
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`);
          const d = await r.json();
          const parts = [d.address?.road, d.address?.city || d.address?.town, d.address?.country].filter(Boolean);
          handleMapLocationChange({ lat: latitude, lng: longitude, address: parts.join(", ") });
        } catch {
          handleMapLocationChange({ lat: latitude, lng: longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        }
        setIsGeolocating(false);
      },
      () => { toast("Géolocalisation refusée.", "error"); setIsGeolocating(false); }
    );
  };

  const handleMainImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("Image trop volumineuse (max 5 MB).", "error"); return; }
    setMainImageFile(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) { toast("Le titre est obligatoire.", "error"); return; }
    if (!hierarchy.gouvernorat)  { toast("Veuillez sélectionner un gouvernorat.", "error"); return; }

    const prixVal = parseFloat(formData.prix);
    if (formData.prix && (!isNaN(prixVal) && prixVal > 9_999_999_999)) {
      toast("Le prix saisi est trop élevé (maximum 9 999 999 999).", "error"); return;
    }
    const supVal = parseFloat(formData.superficie);
    if (formData.superficie && (!isNaN(supVal) && supVal > 9_999_999)) {
      toast("La superficie saisie est trop grande (maximum 9 999 999 m²).", "error"); return;
    }
    setSaving(true);

    try {
      /* 1. Update annonce fields */
      const payload = {
        gouvernorat_id:    parseInt(hierarchy.gouvernorat) || undefined,
        delegation_id:     parseInt(hierarchy.delegation)  || undefined,
        localite_id:       parseInt(hierarchy.localite)    || undefined,
        categorie:         formData.categorie      || undefined,
        type_bien:         formData.type_bien      || undefined,
        titre:             formData.titre,
        description:       formData.description   || null,
        superficie:        parseFloat(formData.superficie) || undefined,
        prix:              parseFloat(formData.prix)       || undefined,
        devise:            formData.devise || "TND",
        type_appartement:  formData.type_bien === "appartement" ? (formData.type_appartement || null) : null,
        type_villa:        formData.type_bien === "villa"       ? (formData.type_villa       || null) : null,
        type_terrain:      formData.type_bien === "terrain"     ? (formData.type_terrain     || null) : null,
        titre_foncier:     formData.type_bien === "terrain" && formData.titre_foncier !== "" ? parseInt(formData.titre_foncier) : null,
        etat_bien:         formData.etat_bien         || null,
        etage:             formData.etage ? parseInt(formData.etage) : null,
        type_option_villa: formData.type_option_villa || null,
        nb_pieces:         formData.nb_pieces    || null,
        nb_chambres:       formData.nb_chambres  || null,
        nb_salles_bain:    formData.nb_salles_bain || null,
      };

      const annRes = await fetch(`\/annonces/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (annRes.status === 401) {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        navigate("/login?session=expired"); return;
      }
      if (!annRes.ok) {
        const err = await annRes.json();
        toast(Array.isArray(err.detail) ? err.detail.map(d => d.msg).join(", ") : String(err.detail || "Erreur"), "error");
        return;
      }

      /* 2. Update property if we have a property_id */
      if (propertyId) {
        let newMainImageUrl = existingMainImage;

        /* Upload new main image if user chose one */
        if (mainImageFile) {
          const imgForm = new FormData();
          imgForm.append("file", mainImageFile);
          const imgRes = await fetch(`\/upload/image`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: imgForm,
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            newMainImageUrl = `\${imgData.url}`;
          }
        }

        await fetch(`\/properties/${propertyId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            address:          formData.address    || "",
            latitude:         parseFloat(formData.latitude)  || 0,
            longitude:        parseFloat(formData.longitude) || 0,
            image_principale: newMainImageUrl,
          }),
        });
      }

      toast("Annonce mise à jour avec succès !");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch {
      toast("Erreur réseau — vérifiez que le serveur est démarré.", "error");
    } finally {
      setSaving(false);
    }
  };

  const mainImageSrc = mainImageFile
    ? URL.createObjectURL(mainImageFile)
    : existingMainImage || null;

  if (loadingData) return (
    <Layout>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}>
        <div style={{width:40,height:40,border:"3px solid #e5e7eb",borderTopColor:"#6366f1",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
        <p style={{color:"#94a3b8",fontSize:14}}>Chargement de l'annonce…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="ea-root">
        {/* Sidebar */}
        <aside className="ea-sidebar">
          <div className="ea-sidebar__inner">
            <Link to="/dashboard" className="ea-back">
              <ArrowLeft size={15}/> Mes annonces
            </Link>
            <div className="ea-sidebar__title">Modifier l'annonce</div>

            <nav className="ea-steps">
              {STEPS.map(s => {
                const active = currentStep === s.id;
                const done   = currentStep > s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`ea-step${active?" ea-step--active":done?" ea-step--done":""}`}
                    onClick={() => setCurrentStep(s.id)}
                  >
                    <div className="ea-step__circle">
                      {done ? <Check size={13} strokeWidth={3}/> : <span>{s.id}</span>}
                    </div>
                    <span className="ea-step__label">{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              className="ea-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader size={16} className="ea-spin"/> : <Save size={16}/>}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ea-main">
          <form onSubmit={handleSave}>

            {/* ─── Step 1 ─── */}
            {currentStep === 1 && (
              <div className="ea-card ea-step-content">
                <div className="ea-card__head">
                  <Building2 size={20} className="ea-ico"/>
                  <h2>Type de bien</h2>
                </div>

                <div className="ea-section-lbl">Type</div>
                <div className="ea-type-grid">
                  {TYPE_CARDS.map(tc => (
                    <button key={tc.value} type="button"
                      className={`ea-type-card${formData.type_bien===tc.value?" ea-type-card--on":""}`}
                      onClick={() => handleInputChange("type_bien", tc.value)}>
                      <span className="ea-type-card__ico">{tc.icon}</span>
                      <span>{tc.label}</span>
                    </button>
                  ))}
                </div>

                <div className="ea-section-lbl" style={{marginTop:22}}>Type d'offre</div>
                <div className="ea-pill-row">
                  {[{v:"vente",l:"Vente"},{v:"location",l:"Location"},{v:"vacances",l:"Vacances"}].map(o => (
                    <button key={o.v} type="button"
                      className={`ea-pill${formData.categorie===o.v?" ea-pill--on":""}`}
                      onClick={() => handleInputChange("categorie", o.v)}>
                      {o.l}
                    </button>
                  ))}
                </div>

                {formData.type_bien === "appartement" && (
                  <div className="ea-row-2" style={{marginTop:18}}>
                    <div className="ea-field">
                      <label className="ea-label">Type de logement</label>
                      <select className="ea-select" value={formData.type_appartement}
                        onChange={e => handleInputChange("type_appartement", e.target.value)}>
                        <option value="">Sélectionner…</option>
                        {[{v:"studio",l:"Studio"},{v:"s0",l:"S0"},{v:"s+1",l:"S+1"},{v:"s+2",l:"S+2"},{v:"s+3",l:"S+3"},{v:"s+4",l:"S+4"},{v:"duplex",l:"Duplex"},{v:"penthouse",l:"Penthouse"}].map(o => (
                          <option key={o.v} value={o.v}>{o.l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="ea-field">
                      <label className="ea-label">Étage</label>
                      <select className="ea-select" value={formData.etage}
                        onChange={e => handleInputChange("etage", e.target.value)}>
                        <option value="">Sélectionner…</option>
                        <option value="0">Rez-de-chaussée</option>
                        <option value="1">1er</option>
                        <option value="2">2ème</option>
                        <option value="3">3ème</option>
                        <option value="4">4ème+</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.type_bien === "villa" && (
                  <div className="ea-row-2" style={{marginTop:18}}>
                    <div className="ea-field">
                      <label className="ea-label">Type de villa</label>
                      <select className="ea-select" value={formData.type_villa}
                        onChange={e => handleInputChange("type_villa", e.target.value)}>
                        <option value="">Sélectionner…</option>
                        {[{v:"r",l:"Plain-pied (R)"},{v:"r+1",l:"R+1"},{v:"r+2",l:"R+2"},{v:"r+3",l:"R+3"},{v:"r+4",l:"R+4"}].map(o => (
                          <option key={o.v} value={o.v}>{o.l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="ea-field">
                      <label className="ea-label">Option villa</label>
                      <select className="ea-select" value={formData.type_option_villa}
                        onChange={e => handleInputChange("type_option_villa", e.target.value)}>
                        <option value="">Sélectionner…</option>
                        <option value="aucun">Aucune</option>
                        <option value="sous-sol">Sous-sol</option>
                        <option value="rez-de-jardin">Rez-de-jardin</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.type_bien === "terrain" && (
                  <div style={{marginTop:18, display:"flex", flexDirection:"column", gap:16}}>
                    <div className="ea-field">
                      <label className="ea-label">Type de terrain</label>
                      <select className="ea-select" value={formData.type_terrain}
                        onChange={e => handleInputChange("type_terrain", e.target.value)}>
                        <option value="">Sélectionner…</option>
                        {[{v:"agricole",l:"Agricole"},{v:"nu",l:"Nu"},{v:"zone_verte",l:"Zone verte"},{v:"lotissement",l:"Lotissement"},{v:"commercial",l:"Commercial"},{v:"industriel",l:"Industriel"}].map(o => (
                          <option key={o.v} value={o.v}>{o.l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="ea-tf-row">
                      <span className="ea-tf-label">Titre foncier</span>
                      <div className="ea-tf-btns">
                        <button type="button"
                          className={`ea-tf-btn${formData.titre_foncier === "1" ? " ea-tf-btn--on" : ""}`}
                          onClick={() => handleInputChange("titre_foncier", "1")}>
                          Oui
                        </button>
                        <button type="button"
                          className={`ea-tf-btn${formData.titre_foncier === "0" ? " ea-tf-btn--on ea-tf-btn--no" : ""}`}
                          onClick={() => handleInputChange("titre_foncier", "0")}>
                          Non
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ea-section-lbl" style={{marginTop:22}}>État du bien</div>
                <div className="ea-etat-row">
                  {ETAT_CARDS.map(ec => (
                    <button key={ec.value} type="button"
                      className={`ea-etat-card${formData.etat_bien===ec.value?" ea-etat-card--on":""}`}
                      onClick={() => handleInputChange("etat_bien", ec.value)}>
                      <span>{ec.icon}</span><span>{ec.label}</span>
                    </button>
                  ))}
                </div>

                {formData.type_bien !== "terrain" && (<>
                  <div className="ea-section-lbl" style={{marginTop:22}}>Pièces &amp; espaces</div>
                  <div className="ea-counters">
                    {[
                      {field:"nb_pieces",     label:"Pièces"},
                      {field:"nb_chambres",   label:"Chambres"},
                      {field:"nb_salles_bain",label:"Salles de bain"},
                    ].map(c => (
                      <div key={c.field} className="ea-counter">
                        <span className="ea-counter__label">{c.label}</span>
                        <div className="ea-counter__ctrl">
                          <button type="button" className="ea-counter__btn" onClick={() => decrement(c.field)}><Minus size={14}/></button>
                          <span className="ea-counter__val">{formData[c.field]}</span>
                          <button type="button" className="ea-counter__btn" onClick={() => increment(c.field)}><Plus size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>)}
              </div>
            )}

            {/* ─── Step 2 ─── */}
            {currentStep === 2 && (
              <div className="ea-card ea-step-content">
                <div className="ea-card__head">
                  <CheckCircle2 size={20} className="ea-ico"/>
                  <h2>Caractéristiques</h2>
                </div>
                {[
                  { title: "Vue",                items: VUE_ITEMS },
                  { title: "Espaces extérieurs", items: EXT_ITEMS },
                  { title: "Commodités",         items: COM_ITEMS },
                ].map(sec => (
                  <div key={sec.title} className="ea-feat-section">
                    <div className="ea-section-lbl">{sec.title}</div>
                    <div className="ea-feat-grid">
                      {sec.items.map(item => (
                        <button key={item.key} type="button"
                          className={`ea-feat-card${formData[item.key]?" ea-feat-card--on":""}`}
                          onClick={() => handleCheckboxChange(item.key)}>
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                          {formData[item.key] && <Check size={12} style={{marginLeft:2,color:"#a3e635"}}/>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Step 3 ─── */}
            {currentStep === 3 && (
              <div className="ea-card ea-step-content">
                <div className="ea-card__head">
                  <MapPin size={20} className="ea-ico"/>
                  <h2>Localisation</h2>
                </div>

                <div className="ea-section-lbl">Zone géographique</div>
                <div className="ea-cascade">
                  <div className="ea-field">
                    <label className="ea-label">Gouvernorat *</label>
                    <select className="ea-select" value={hierarchy.gouvernorat}
                      onChange={e => handleHierarchyChange("gouvernorat", e.target.value)}>
                      <option value="">Sélectionner…</option>
                      {gouvernorats.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <ChevronRight size={16} style={{color:"#d1d5db",marginBottom:12,flexShrink:0}}/>
                  <div className="ea-field">
                    <label className="ea-label">Délégation</label>
                    <select className="ea-select" value={hierarchy.delegation}
                      disabled={!hierarchy.gouvernorat}
                      onChange={e => handleHierarchyChange("delegation", e.target.value)}>
                      <option value="">{hierarchy.gouvernorat ? "Toutes" : "— gouvernorat d'abord —"}</option>
                      {delegations.map(d => (
                        <option key={d.id} value={d.id}>{d.nom}</option>
                      ))}
                    </select>
                  </div>
                  <ChevronRight size={16} style={{color:"#d1d5db",marginBottom:12,flexShrink:0}}/>
                  <div className="ea-field">
                    <label className="ea-label">Localité</label>
                    <select className="ea-select" value={hierarchy.localite}
                      disabled={!hierarchy.delegation}
                      onChange={e => handleHierarchyChange("localite", e.target.value)}>
                      <option value="">{hierarchy.delegation ? "Toutes" : "— délégation d'abord —"}</option>
                      {localites.map(l => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ea-section-lbl" style={{marginTop:18}}>Adresse exacte</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                  <input type="text" className="ea-input" style={{flex:1,minWidth:200}}
                    placeholder="Ex: 15 Avenue Habib Bourguiba, Tunis"
                    value={formData.address}
                    onChange={e => handleInputChange("address", e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); geocodeAddress(); } }}
                  />
                  <button type="button" className="ea-geo-btn ea-geo-btn--sm" onClick={geocodeAddress}>
                    <MapPin size={14}/>
                  </button>
                  <button type="button" className="ea-geo-btn" onClick={handleGeolocate} disabled={isGeolocating}>
                    {isGeolocating ? <Loader size={14} className="ea-spin"/> : <Navigation size={14}/>}
                  </button>
                </div>

                <div style={{borderRadius:10,overflow:"hidden"}}>
                  <ControlledMap position={{lat:mapLocation.lat,lng:mapLocation.lng}} onLocationChange={handleMapLocationChange}/>
                </div>
                <p style={{fontSize:12,color:"#94a3b8",marginTop:8,fontStyle:"italic"}}>
                  Cliquez sur la carte ou déplacez le marqueur pour affiner la position.
                </p>

                <div className="ea-row-2" style={{marginTop:12}}>
                  <div className="ea-field">
                    <label className="ea-label" style={{color:"#94a3b8"}}>Latitude</label>
                    <input type="text" className="ea-input" value={formData.latitude}
                      onChange={e => handleInputChange("latitude", e.target.value)}/>
                  </div>
                  <div className="ea-field">
                    <label className="ea-label" style={{color:"#94a3b8"}}>Longitude</label>
                    <input type="text" className="ea-input" value={formData.longitude}
                      onChange={e => handleInputChange("longitude", e.target.value)}/>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 4 ─── */}
            {currentStep === 4 && (
              <div className="ea-card ea-step-content">
                <div className="ea-card__head">
                  <Sparkles size={20} className="ea-ico"/>
                  <h2>Présentation</h2>
                </div>

                <div className="ea-field" style={{marginBottom:18}}>
                  <label className="ea-label">Titre *</label>
                  <input type="text" className="ea-input"
                    placeholder="Ex: Magnifique villa moderne avec piscine"
                    value={formData.titre}
                    onChange={e => handleInputChange("titre", e.target.value)}
                  />
                </div>

                <div className="ea-row-2" style={{marginBottom:18}}>
                  <div className="ea-field">
                    <label className="ea-label">Superficie *</label>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <input type="number" className="ea-input" style={{flex:1}}
                        placeholder="150" value={formData.superficie}
                        onChange={e => handleInputChange("superficie", e.target.value)}/>
                      <span style={{padding:"10px 14px",background:"#f1f5f9",borderRadius:8,fontSize:13,fontWeight:600,color:"#64748b",whiteSpace:"nowrap"}}>m²</span>
                    </div>
                  </div>
                  <div className="ea-field">
                    <label className="ea-label">Prix *</label>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <input type="number" className="ea-input" style={{flex:1}}
                        placeholder="250000" value={formData.prix}
                        onChange={e => handleInputChange("prix", e.target.value)}/>
                      <select className="ea-select" style={{width:"auto",padding:"10px 8px"}}
                        value={formData.devise} onChange={e => handleInputChange("devise", e.target.value)}>
                        <option value="TND">TND</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="ea-field">
                  <label className="ea-label">Description</label>
                  <div style={{position:"relative"}}>
                    <textarea className="ea-textarea" rows={7}
                      placeholder="Décrivez votre bien : luminosité, équipements, quartier…"
                      value={formData.description}
                      onChange={e => handleInputChange("description", e.target.value)}
                    />
                    {formData.description && (
                      <div style={{position:"absolute",bottom:10,right:10,background:"rgba(255,255,255,.9)",padding:"4px 10px",borderRadius:6,fontSize:11,color:"#94a3b8",display:"flex",gap:10}}>
                        <span>{formData.description.length} car.</span>
                        <span>{formData.description.split(" ").filter(Boolean).length} mots</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 5 ─── */}
            {currentStep === 5 && (
              <div className="ea-card ea-step-content">
                <div className="ea-card__head">
                  <Camera size={20} className="ea-ico"/>
                  <h2>Photos du bien</h2>
                </div>

                {/* Main image */}
                <div className="ea-section-lbl">Image principale</div>
                {mainImageSrc ? (
                  <div className="ea-img-main">
                    <img src={mainImageSrc} alt="Principale"/>
                    <div className="ea-img-overlay">
                      <label className="ea-img-btn ea-img-btn--change" title="Remplacer">
                        <input type="file" accept="image/*" style={{display:"none"}}
                          onChange={handleMainImageUpload}/>
                        <Upload size={16}/>
                      </label>
                      <button type="button" className="ea-img-btn ea-img-btn--del"
                        onClick={() => { setMainImageFile(null); setExistingMainImage(null); }}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    {mainImageFile && (
                      <span style={{position:"absolute",top:8,left:8,background:"#10b981",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>
                        Nouvelle image
                      </span>
                    )}
                  </div>
                ) : (
                  <label className="ea-dropzone ea-dropzone--main">
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={handleMainImageUpload}/>
                    <Upload size={36} style={{color:"#9ca3af"}}/>
                    <span style={{fontSize:13.5,fontWeight:600,color:"#374151"}}>Cliquez pour ajouter l'image principale</span>
                    <span style={{fontSize:12,color:"#9ca3af"}}>JPG, PNG — max 5 MB</span>
                  </label>
                )}

                {/* Additional images (existing — read only display) */}
                {existingImages.length > 0 && (
                  <div style={{marginTop:24}}>
                    <div className="ea-section-lbl">
                      Images supplémentaires existantes
                      <span style={{marginLeft:8,padding:"2px 8px",background:"#e5e7eb",borderRadius:20,fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"none"}}>
                        {existingImages.length}
                      </span>
                    </div>
                    <div className="ea-img-grid">
                      {existingImages.map((url, i) => (
                        <div key={i} className="ea-img-thumb">
                          <img src={url} alt={`img ${i+1}`}/>
                          <button type="button" className="ea-img-thumb__del"
                            onClick={() => setExistingImages(prev => prev.filter((_,j)=>j!==i))}>
                            <X size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{marginTop:14,fontSize:12.5,color:"#94a3b8",fontStyle:"italic"}}>
                  Seule l'image principale peut être remplacée pour l'instant. Les images supplémentaires sont affichées à titre indicatif.
                </p>
              </div>
            )}

            {/* ─── Step 6 — Prévisualisation ─── */}
            {currentStep === 6 && (
              <div className="ea-card ea-step-content">
                <div className="ea-card__head">
                  <Eye size={20} className="ea-ico"/>
                  <h2>Prévisualisation</h2>
                </div>
                <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>
                  Vérifiez toutes les informations avant d'enregistrer vos modifications.
                </p>

                {/* Badges type / catégorie / état */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                  {formData.type_bien && (
                    <span className="ea-prev-badge ea-prev-badge--type">
                      {formData.type_bien.charAt(0).toUpperCase()+formData.type_bien.slice(1)}
                    </span>
                  )}
                  {formData.categorie && (
                    <span className="ea-prev-badge ea-prev-badge--cat">
                      {formData.categorie.charAt(0).toUpperCase()+formData.categorie.slice(1)}
                    </span>
                  )}
                  {formData.etat_bien && (
                    <span className="ea-prev-badge ea-prev-badge--etat">
                      {formData.etat_bien==="nouveau"?"Neuf":formData.etat_bien==="bon_etat"?"Bon état":formData.etat_bien==="a_renover"?"À rénover":"En construction"}
                    </span>
                  )}
                </div>

                {/* Title + price */}
                <h3 className="ea-prev-title">{formData.titre || <em style={{color:"#94a3b8"}}>Titre non défini</em>}</h3>
                {formData.prix && (
                  <div className="ea-prev-price">
                    {Number(formData.prix).toLocaleString("fr-TN")} <span>{formData.devise}</span>
                  </div>
                )}

                {/* Key details */}
                <div className="ea-prev-details">
                  {formData.superficie && <span>📐 {formData.superficie} m²</span>}
                  {formData.type_bien !== "terrain" && formData.nb_pieces > 0 && <span>🚪 {formData.nb_pieces} pièce{formData.nb_pieces>1?"s":""}</span>}
                  {formData.type_bien !== "terrain" && formData.nb_chambres > 0 && <span>🛏 {formData.nb_chambres} chambre{formData.nb_chambres>1?"s":""}</span>}
                  {formData.type_bien !== "terrain" && formData.nb_salles_bain > 0 && <span>🚿 {formData.nb_salles_bain} sdb</span>}
                  {formData.type_bien === "terrain" && formData.titre_foncier === "1" && <span>📋 Titre foncier</span>}
                </div>

                {/* Location */}
                <div className="ea-prev-loc">
                  <MapPin size={13}/>
                  {[
                    gouvernorats.find(g=>g.value===hierarchy.gouvernorat)?.label,
                    delegations.find(d=>String(d.id)===String(hierarchy.delegation))?.nom,
                    localites.find(l=>String(l.id)===String(hierarchy.localite))?.nom,
                  ].filter(Boolean).join(", ") || <em style={{color:"#94a3b8"}}>Localisation non définie</em>}
                  {formData.address && ` — ${formData.address}`}
                </div>

                {/* Features */}
                {[
                  {k:"vue_mer",l:"🌊 Vue mer"},{k:"vue_montagne",l:"⛰️ Vue montagne"},{k:"vue_foret",l:"🌲 Vue forêt"},
                  {k:"jardin",l:"🏡 Jardin"},{k:"terrasse",l:"☀️ Terrasse"},{k:"balcon",l:"🪴 Balcon"},
                  {k:"ascenseur",l:"🛗 Ascenseur"},{k:"garage",l:"🚗 Garage"},{k:"parking",l:"🅿️ Parking"},
                  {k:"cellier",l:"📦 Cellier"},{k:"meuble",l:"🛋️ Meublé"},{k:"cuisine_equipee",l:"🍳 Cuisine équipée"},
                  {k:"climatisation",l:"❄️ Climatisation"},
                ].filter(f=>formData[f.k]).length > 0 && (
                  <div className="ea-prev-features">
                    {[
                      {k:"vue_mer",l:"🌊 Vue mer"},{k:"vue_montagne",l:"⛰️ Vue montagne"},{k:"vue_foret",l:"🌲 Vue forêt"},
                      {k:"jardin",l:"🏡 Jardin"},{k:"terrasse",l:"☀️ Terrasse"},{k:"balcon",l:"🪴 Balcon"},
                      {k:"ascenseur",l:"🛗 Ascenseur"},{k:"garage",l:"🚗 Garage"},{k:"parking",l:"🅿️ Parking"},
                      {k:"cellier",l:"📦 Cellier"},{k:"meuble",l:"🛋️ Meublé"},{k:"cuisine_equipee",l:"🍳 Cuisine équipée"},
                      {k:"climatisation",l:"❄️ Climatisation"},
                    ].filter(f=>formData[f.k]).map(f=>(
                      <span key={f.k} className="ea-prev-feat">{f.l}</span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {formData.description && (
                  <div className="ea-prev-desc">
                    <div className="ea-prev-section-lbl">Description</div>
                    <p>{formData.description}</p>
                  </div>
                )}

                {/* Main image preview */}
                {mainImageSrc && (
                  <div style={{marginTop:20}}>
                    <div className="ea-prev-section-lbl">Image principale</div>
                    <img src={mainImageSrc} alt="Principale"
                      style={{width:"100%",maxHeight:280,objectFit:"cover",borderRadius:12,marginTop:8,border:"1px solid #e5e7eb"}}/>
                  </div>
                )}

                <div className="ea-prev-ready">
                  <Check size={15}/> Tout est prêt — cliquez sur « Enregistrer les modifications » pour sauvegarder.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="ea-nav">
              {currentStep > 1
                ? <button type="button" className="ea-nav-btn ea-nav-btn--ghost" onClick={() => setCurrentStep(s=>s-1)}>
                    <ChevronLeft size={17}/> Précédent
                  </button>
                : <div/>
              }
              {currentStep < STEPS.length - 1
                ? <button type="button" className="ea-nav-btn ea-nav-btn--solid" onClick={() => setCurrentStep(s=>s+1)}>
                    Suivant <ChevronRight size={17}/>
                  </button>
                : currentStep === STEPS.length - 1
                  ? <button type="button" className="ea-nav-btn ea-nav-btn--preview" onClick={() => setCurrentStep(STEPS.length)}>
                      <Eye size={17}/> Prévisualiser
                    </button>
                  : <button type="submit" className="ea-nav-btn ea-nav-btn--save" disabled={saving}>
                      {saving ? <><Loader size={17} className="ea-spin"/> Enregistrement…</> : <><Save size={17}/> Enregistrer les modifications</>}
                    </button>
              }
            </div>

          </form>
        </main>

        <style>{`
          .ea-root { display:flex; min-height:calc(100vh - 64px); background:#f8fafc; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }

          /* Sidebar */
          .ea-sidebar {
            width:240px; min-width:240px; background:#fff; border-right:1px solid #e5e7eb;
            position:sticky; top:0; height:calc(100vh - 64px); overflow-y:auto; flex-shrink:0;
          }
          .ea-sidebar__inner { padding:24px 18px; }
          .ea-back {
            display:inline-flex; align-items:center; gap:6px; font-size:13px; color:#64748b;
            text-decoration:none; margin-bottom:20px; transition:color .15s;
          }
          .ea-back:hover { color:#0f172a; }
          .ea-sidebar__title { font-size:14px; font-weight:700; color:#0f172a; margin-bottom:20px; }

          .ea-steps { display:flex; flex-direction:column; gap:3px; margin-bottom:24px; }
          .ea-step {
            display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:10px;
            background:none; border:none; cursor:pointer; font-family:inherit; text-align:left;
            transition:background .15s;
          }
          .ea-step:hover { background:#f8fafc; }
          .ea-step--active { background:#f0f4ff; }
          .ea-step__circle {
            width:26px; height:26px; border-radius:50%; flex-shrink:0;
            display:flex; align-items:center; justify-content:center;
            font-size:12px; font-weight:700;
            background:#f1f5f9; color:#94a3b8; border:2px solid #e2e8f0;
            transition:all .15s;
          }
          .ea-step--active .ea-step__circle { background:#fff; color:#4f46e5; border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.12); }
          .ea-step--done  .ea-step__circle  { background:#0f172a; color:#fff; border-color:#0f172a; }
          .ea-step__label { font-size:13px; font-weight:500; color:#94a3b8; }
          .ea-step--active .ea-step__label { color:#1e293b; font-weight:600; }
          .ea-step--done  .ea-step__label  { color:#475569; }

          .ea-save-btn {
            width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
            padding:11px 16px; background:#6366f1; color:#fff;
            border:none; border-radius:10px; font-size:13.5px; font-weight:700;
            cursor:pointer; font-family:inherit; transition:background .15s;
          }
          .ea-save-btn:hover:not(:disabled) { background:#4f46e5; }
          .ea-save-btn:disabled { opacity:.6; cursor:not-allowed; }

          /* Main */
          .ea-main { flex:1; min-width:0; padding:28px 32px 100px; overflow-y:auto; }

          /* Card */
          .ea-card {
            background:#fff; border:1px solid #e5e7eb; border-radius:16px;
            padding:28px 32px; box-shadow:0 1px 6px rgba(0,0,0,.04); margin-bottom:0;
          }
          .ea-step-content { animation:eaFade .25s ease; }
          @keyframes eaFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
          .ea-card__head {
            display:flex; align-items:center; gap:10px;
            margin-bottom:22px; padding-bottom:14px; border-bottom:1px solid #f1f5f9;
          }
          .ea-card__head h2 { font-size:20px; font-weight:700; color:#0f172a; }
          .ea-ico { color:#4f46e5; flex-shrink:0; }

          /* Form elements */
          .ea-section-lbl {
            font-size:11px; font-weight:700; color:#9ca3af;
            text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px;
            display:flex; align-items:center; gap:8px;
          }
          .ea-field { display:flex; flex-direction:column; gap:6px; flex:1; min-width:120px; }
          .ea-label { font-size:12.5px; font-weight:600; color:#374151; }
          .ea-select,.ea-input {
            border:1.5px solid #e5e7eb; border-radius:10px; padding:10px 12px;
            font-size:13.5px; font-family:inherit; background:#f9fafb; color:#1e293b;
            outline:none; width:100%; transition:border-color .15s,box-shadow .15s;
          }
          .ea-select:focus,.ea-input:focus { background:#fff; border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
          .ea-select:disabled { opacity:.45; cursor:not-allowed; }
          .ea-textarea {
            width:100%; padding:12px 14px; border:1.5px solid #e5e7eb; border-radius:10px;
            font-size:13.5px; font-family:inherit; resize:vertical;
            outline:none; background:#f9fafb; color:#374151; min-height:150px;
            transition:border-color .15s;
          }
          .ea-textarea:focus { background:#fff; border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
          .ea-row-2 { display:flex; gap:14px; flex-wrap:wrap; }

          /* Type grid */
          .ea-type-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
          .ea-type-card {
            display:flex; flex-direction:column; align-items:center; gap:8px;
            padding:18px 10px; border-radius:12px; border:2px solid #e5e7eb;
            background:#f9fafb; cursor:pointer; font-family:inherit;
            font-size:12.5px; font-weight:600; color:#374151; transition:all .15s;
          }
          .ea-type-card:hover { border-color:#c7d2fe; background:#f0f4ff; }
          .ea-type-card--on { border-color:#0f172a; background:#0f172a; color:#fff; }
          .ea-type-card__ico { font-size:28px; }

          /* Pills */
          .ea-pill-row { display:flex; gap:8px; }
          .ea-pill {
            padding:8px 22px; border-radius:24px; border:2px solid #e5e7eb;
            background:#f9fafb; font-size:13px; font-weight:600; color:#6b7280;
            cursor:pointer; font-family:inherit; transition:all .15s;
          }
          .ea-pill:hover { border-color:#c7d2fe; color:#4f46e5; background:#f0f4ff; }
          .ea-pill--on { background:#0f172a; color:#fff; border-color:#0f172a; }

          /* Etat */
          .ea-etat-row { display:flex; gap:8px; flex-wrap:wrap; }
          .ea-etat-card {
            display:flex; align-items:center; gap:6px; padding:9px 16px;
            border-radius:10px; border:2px solid #e5e7eb; background:#f9fafb;
            font-size:13px; font-weight:600; color:#6b7280; cursor:pointer;
            font-family:inherit; transition:all .15s;
          }
          .ea-etat-card:hover { border-color:#c7d2fe; background:#f0f4ff; }
          .ea-etat-card--on { border-color:#0f172a; background:#0f172a; color:#fff; }

          /* Titre foncier toggle */
          .ea-tf-row { display:flex; align-items:center; gap:14px; }
          .ea-tf-label { font-size:13px; font-weight:600; color:#374151; }
          .ea-tf-btns { display:flex; gap:6px; }
          .ea-tf-btn {
            padding:7px 20px; border-radius:20px; border:2px solid #e5e7eb;
            background:#f9fafb; font-size:13px; font-weight:600; color:#6b7280;
            cursor:pointer; font-family:inherit; transition:all .15s;
          }
          .ea-tf-btn:hover { border-color:#c7d2fe; color:#4f46e5; }
          .ea-tf-btn--on { background:#0f172a; color:#fff; border-color:#0f172a; }
          .ea-tf-btn--no.ea-tf-btn--on { background:#ef4444; border-color:#ef4444; }

          /* Counters */
          .ea-counters { display:flex; gap:12px; flex-wrap:wrap; }
          .ea-counter {
            flex:1; min-width:130px; background:#f8fafc; border:1px solid #e5e7eb;
            border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:10px;
          }
          .ea-counter__label { font-size:12.5px; font-weight:600; color:#374151; }
          .ea-counter__ctrl  { display:flex; align-items:center; gap:12px; }
          .ea-counter__btn {
            width:32px; height:32px; border-radius:8px; border:1.5px solid #e5e7eb;
            background:#fff; display:flex; align-items:center; justify-content:center;
            cursor:pointer; color:#374151; transition:all .15s;
          }
          .ea-counter__btn:hover { background:#0f172a; color:#fff; border-color:#0f172a; }
          .ea-counter__val { font-size:20px; font-weight:700; color:#0f172a; min-width:28px; text-align:center; }

          /* Features */
          .ea-feat-section { margin-bottom:20px; }
          .ea-feat-grid { display:flex; flex-wrap:wrap; gap:8px; }
          .ea-feat-card {
            display:flex; align-items:center; gap:7px; padding:9px 14px;
            border-radius:10px; border:1.5px solid #e5e7eb; background:#f9fafb;
            font-size:13px; font-weight:500; color:#374151; cursor:pointer;
            font-family:inherit; transition:all .15s;
          }
          .ea-feat-card:hover { border-color:#c7d2fe; background:#f0f4ff; }
          .ea-feat-card--on { border-color:#0f172a; background:#0f172a; color:#fff; }

          /* Cascade */
          .ea-cascade { display:flex; align-items:flex-end; gap:8px; flex-wrap:wrap; }

          /* Geo buttons */
          .ea-geo-btn {
            display:flex; align-items:center; gap:6px; padding:10px 16px;
            border-radius:10px; background:#0f172a; color:#fff;
            border:none; font-size:13px; font-weight:600; cursor:pointer;
            font-family:inherit; transition:all .15s; white-space:nowrap;
          }
          .ea-geo-btn:hover { background:#1e293b; }
          .ea-geo-btn:disabled { opacity:.6; cursor:not-allowed; }
          .ea-geo-btn--sm { padding:10px 12px; }

          /* Images */
          .ea-img-main {
            position:relative; max-width:520px; border-radius:12px;
            overflow:hidden; aspect-ratio:16/9;
            box-shadow:0 2px 12px rgba(0,0,0,.1);
          }
          .ea-img-main img { width:100%; height:100%; object-fit:cover; }
          .ea-img-overlay {
            position:absolute; inset:0; background:rgba(0,0,0,.5);
            display:flex; align-items:center; justify-content:center; gap:10px;
            opacity:0; transition:opacity .2s;
          }
          .ea-img-main:hover .ea-img-overlay { opacity:1; }
          .ea-img-btn {
            width:40px; height:40px; border-radius:50%; border:none; cursor:pointer;
            display:flex; align-items:center; justify-content:center; transition:all .15s;
          }
          .ea-img-btn--change { background:rgba(255,255,255,.9); color:#374151; }
          .ea-img-btn--change:hover { background:#6366f1; color:#fff; }
          .ea-img-btn--del { background:#ef4444; color:#fff; }
          .ea-img-btn--del:hover { background:#dc2626; }

          .ea-dropzone--main {
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
            border:2px dashed #d1d5db; border-radius:12px; padding:56px 20px;
            cursor:pointer; background:#f9fafb; max-width:520px; transition:all .15s;
          }
          .ea-dropzone--main:hover { border-color:#6366f1; background:#f0f4ff; }

          .ea-img-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:8px; }
          .ea-img-thumb {
            position:relative; aspect-ratio:1; border-radius:10px; overflow:hidden;
            box-shadow:0 2px 6px rgba(0,0,0,.1);
          }
          .ea-img-thumb img { width:100%; height:100%; object-fit:cover; }
          .ea-img-thumb__del {
            position:absolute; top:5px; right:5px; width:22px; height:22px;
            background:rgba(0,0,0,.6); color:#fff; border:none; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; transition:background .15s; opacity:0;
          }
          .ea-img-thumb:hover .ea-img-thumb__del { opacity:1; }
          .ea-img-thumb__del:hover { background:#ef4444; }

          /* Navigation */
          .ea-nav { display:flex; justify-content:space-between; align-items:center; margin-top:20px; }
          .ea-nav-btn {
            display:flex; align-items:center; gap:8px; padding:12px 26px;
            border-radius:12px; font-size:14px; font-weight:600; cursor:pointer;
            font-family:inherit; transition:all .15s;
          }
          .ea-nav-btn--ghost {
            background:#fff; color:#374151; border:1.5px solid #e5e7eb;
          }
          .ea-nav-btn--ghost:hover { background:#f1f5f9; border-color:#d1d5db; }
          .ea-nav-btn--solid {
            background:#0f172a; color:#fff; border:none;
            box-shadow:0 4px 14px rgba(15,23,42,.25);
          }
          .ea-nav-btn--solid:hover { background:#1e293b; transform:translateY(-1px); }
          .ea-nav-btn--preview {
            background: linear-gradient(135deg,#6366f1,#818cf8); color:#fff; border:none;
            box-shadow:0 4px 14px rgba(99,102,241,.3);
          }
          .ea-nav-btn--preview:hover { opacity:.9; transform:translateY(-1px); }
          .ea-nav-btn--save {
            background:#6366f1; color:#fff; border:none;
            box-shadow:0 4px 14px rgba(99,102,241,.3);
          }
          .ea-nav-btn--save:hover:not(:disabled) { background:#4f46e5; transform:translateY(-1px); }
          .ea-nav-btn--save:disabled { opacity:.6; cursor:not-allowed; }

          /* Preview step styles */
          .ea-prev-title { font-size:20px; font-weight:800; color:#0f172a; margin-bottom:6px; }
          .ea-prev-price { font-size:22px; font-weight:800; color:#0f172a; margin-bottom:14px; }
          .ea-prev-price span { font-size:14px; font-weight:600; color:#64748b; }
          .ea-prev-details { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
          .ea-prev-details span {
            font-size:13px; font-weight:600; color:#374151;
            background:#f1f5f9; border:1px solid #e2e8f0;
            padding:5px 12px; border-radius:20px;
          }
          .ea-prev-loc {
            display:flex; align-items:center; gap:6px;
            font-size:13px; color:#64748b; margin-bottom:16px;
          }
          .ea-prev-features { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
          .ea-prev-feat {
            font-size:12.5px; font-weight:600; background:#f8fafc;
            border:1px solid #e5e7eb; border-radius:8px; padding:5px 11px;
          }
          .ea-prev-desc { background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:16px 18px; margin-bottom:16px; }
          .ea-prev-section-lbl {
            font-size:10.5px; font-weight:700; letter-spacing:.6px; text-transform:uppercase;
            color:#94a3b8; margin-bottom:8px;
          }
          .ea-prev-desc p { font-size:14px; color:#374151; line-height:1.7; white-space:pre-wrap; }
          .ea-prev-badge {
            display:inline-flex; padding:4px 12px; border-radius:20px;
            font-size:12px; font-weight:700;
          }
          .ea-prev-badge--type { background:#eef2ff; color:#4f46e5; }
          .ea-prev-badge--cat  { background:#f0fdf4; color:#16a34a; }
          .ea-prev-badge--etat { background:#fef9c3; color:#854d0e; }
          .ea-prev-ready {
            display:flex; align-items:center; gap:8px;
            background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;
            padding:12px 16px; font-size:13px; font-weight:600; color:#15803d;
            margin-top:20px;
          }

          .ea-spin { animation:eaSpin .8s linear infinite; }
          @keyframes eaSpin { to{transform:rotate(360deg)} }

          @media (max-width:900px) {
            .ea-root { flex-direction:column; }
            .ea-sidebar {
              width:100%; min-width:unset; height:auto; position:static;
              border-right:none; border-bottom:1px solid #e5e7eb;
            }
            .ea-sidebar__inner { padding:16px; }
            .ea-step-nav { flex-direction:row; overflow-x:auto; gap:6px; padding-bottom:4px; }
            .ea-step { flex-direction:column; align-items:center; gap:4px; min-width:70px; }
            .ea-step__label { font-size:11px; }
            .ea-save-btn { display:none; }
            .ea-main { padding:20px 16px 100px; }
            .ea-card { padding:20px 18px; }
          }
          @media (max-width:600px) {
            .ea-type-grid { grid-template-columns:repeat(2,1fr); }
            .ea-cascade { flex-direction:column; }
            .ea-row-2 { flex-direction:column; gap:12px; }
            .ea-nav { flex-direction:column-reverse; gap:10px; }
            .ea-nav-btn { width:100%; justify-content:center; }
            .ea-feat-grid { grid-template-columns:repeat(2,1fr); }
            .ea-etat-row { grid-template-columns:repeat(2,1fr); }
            .ea-counters { grid-template-columns:repeat(2,1fr); }
            .ea-img-grid { grid-template-columns:repeat(2,1fr); }
          }
        `}</style>
      </div>
    </Layout>
  );
}
