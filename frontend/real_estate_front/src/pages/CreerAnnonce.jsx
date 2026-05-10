import React, { useState, useEffect, useRef, useCallback } from "react";
import API_URL from '../config';
import { useNavigate } from "react-router-dom";
import {
  Home, Building2, MapPin, Camera, ChevronRight, ChevronLeft,
  Check, X, Upload, Trash2, Eye, Bed, Bath, Maximize2, DollarSign,
  CheckCircle2, XCircle, Loader, Sparkles, Wand2,
  Minus, Plus, Navigation
} from "lucide-react";
import Layout from "../components/Layout";
import AIDescriptionModal from '../components/AIDescriptionModal';
import useLocalisation from "../hooks/useLocalisation";
import { useToast } from "../components/Toast";
import "leaflet/dist/leaflet.css";

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

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", maxZoom: 19 }).addTo(map);

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

  return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 420, borderRadius: 12, overflow: "hidden" }} />;
}

const STEPS = [
  { id: 1, label: "Type de bien",       icon: Building2 },
  { id: 2, label: "Caractéristiques",   icon: CheckCircle2 },
  { id: 3, label: "Localisation",       icon: MapPin },
  { id: 4, label: "Présentation",       icon: Sparkles },
  { id: 5, label: "Photos",             icon: Camera },
  { id: 6, label: "Prévisualisation",   icon: Eye },
];

const CreateListingForm = () => {
  const toast    = useToast();
  const navigate = useNavigate();

  /* ── Guard : doit être connecté pour publier ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login?redirect=/creer_annonce", { replace: true });
  }, []);
  const [currentStep, setCurrentStep] = useState(1);
  const [mapLocation, setMapLocation] = useState({
    lat: 36.8065,
    lng: 10.1815,
    address: 'Tunis, Tunisie'
  });
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [hierarchy, setHierarchy] = useState({
    gouvernorat: "",
    delegation: "",
    localite: ""
  });

  const { gouvernorats, delegations, localites } = useLocalisation(hierarchy);

  const [formData, setFormData] = useState({
    // Step 1
    type_bien: "",
    categorie: "",
    etat_bien: "",
    type_terrain: "",
    titre_foncier: "",
    type_appartement: "",
    etage: "",
    type_villa: "",
    type_option_villa: "",
    nb_pieces: 0,
    nb_chambres: 0,
    nb_salles_bain: 0,
    // Step 2
    vue_mer: false,
    vue_montagne: false,
    vue_foret: false,
    jardin: false,
    terrasse: false,
    balcon: false,
    ascenseur: false,
    garage: false,
    parking: false,
    cellier: false,
    meuble: false,
    cuisine_equipee: false,
    climatisation: false,
    // Step 3
    gouvernorat: "",
    delegation: "",
    localite: "",
    address: "Tunis, Tunisie",
    latitude: "36.8065",
    longitude: "10.1815",
    // Step 4
    titre: "",
    superficie: "",
    prix: "",
    devise: "TND",
    description: "",
    // Step 5
    image_principale: null,
    images: []
  });

  const [imageValidation, setImageValidation] = useState({});

  const totalSteps = 6;

  const [addressFilter, setAddressFilter] = useState("");

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

            /* Adresse par défaut seulement quand les 3 niveaux sont remplis */
            if (newHierarchy.gouvernorat && newHierarchy.delegation && newHierarchy.localite) {
              const builtAddress = [locLabel, delLabel, govLabel, "Tunisie"].filter(Boolean).join(", ");
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
    if (formData[field] < 15) handleInputChange(field, formData[field] + 1);
  };

  const decrementValue = (field) => {
    if (formData[field] > 0) handleInputChange(field, formData[field] - 1);
  };

  const handleImageUpload = (e, isMain = false) => {
    const files = Array.from(e.target.files);
    if (isMain) {
      const file = files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setImageValidation(prev => ({ ...prev, main: { valid: false, message: "Fichier trop volumineux (>5MB)" } }));
          return;
        }
        setTimeout(() => {
          setImageValidation(prev => ({ ...prev, main: { valid: true, message: "Image valide" } }));
        }, 1000);
        handleInputChange('image_principale', file);
      }
    } else {
      const currentImages = formData.images.length;
      const remainingSlots = 10 - currentImages;
      const newImages = files.slice(0, remainingSlots);
      newImages.forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) {
          setImageValidation(prev => ({
            ...prev,
            [currentImages + index]: { valid: false, message: "Fichier >5MB" }
          }));
          return;
        }
        setTimeout(() => {
          setImageValidation(prev => ({
            ...prev,
            [currentImages + index]: { valid: true, message: "Image valide" }
          }));
        }, 1000 + index * 500);
      });
      handleInputChange('images', [...formData.images, ...newImages]);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    handleInputChange('images', newImages);
    const newValidation = { ...imageValidation };
    delete newValidation[index];
    setImageValidation(newValidation);
  };

  const nextStep = () => {
    /* ── Validation par étape ── */
    if (currentStep === 1) {
      if (!formData.type_bien) {
        toast("Champ requis ✦ Sélectionnez un type de bien.", "error"); return;
      }
      if (!formData.categorie) {
        toast("Champ requis ✦ Sélectionnez un type d'offre.", "error"); return;
      }
    }
    if (currentStep === 3) {
      if (!hierarchy.gouvernorat) {
        toast("Champ requis ✦ Sélectionnez un gouvernorat.", "error"); return;
      }
    }
    if (currentStep === 4) {
      if (!formData.titre.trim()) {
        toast("Champ requis ✦ Saisissez un titre pour l'annonce.", "error"); return;
      }
      const sup = parseFloat(formData.superficie);
      if (!formData.superficie || isNaN(sup) || sup <= 0) {
        toast("Champ requis ✦ Saisissez une superficie valide.", "error"); return;
      }
      const px = parseFloat(formData.prix);
      if (!formData.prix || isNaN(px) || px <= 0) {
        toast("Champ requis ✦ Saisissez un prix valide.", "error"); return;
      }
    }
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    /* Validation */
    if (!formData.type_bien)    { toast("Veuillez sélectionner un type de bien (étape 1).", "error"); return; }
    if (!formData.categorie)    { toast("Veuillez sélectionner le type d'offre (étape 1).", "error"); return; }
    if (!formData.titre.trim()) { toast("Veuillez saisir un titre pour l'annonce (étape 4).", "error"); return; }
    if (!hierarchy.gouvernorat) { toast("Veuillez sélectionner un gouvernorat (étape 3).", "error"); return; }

    const prixVal = parseFloat(formData.prix);
    if (!formData.prix || isNaN(prixVal) || prixVal <= 0) {
      toast("Veuillez saisir un prix valide (étape 4).", "error"); return;
    }
    if (prixVal > 9_999_999_999) {
      toast("Le prix saisi est trop élevé (maximum 9 999 999 999).", "error"); return;
    }

    const supVal = parseFloat(formData.superficie);
    if (!formData.superficie || isNaN(supVal) || supVal <= 0) {
      toast("Veuillez saisir une superficie valide (étape 4).", "error"); return;
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
      /* ── 1. Créer l'annonce (JSON) ── */
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
        type_option_villa: formData.type_option_villa || null,
        nb_pieces:         formData.nb_pieces    || null,
        nb_chambres:       formData.nb_chambres  || null,
        nb_salles_bain:    formData.nb_salles_bain || null,
      };

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

      /* ── 2. Upload images ── */
      let imageUrl = null;
      const allImages = [
        ...(formData.image_principale ? [formData.image_principale] : []),
        ...formData.images,
      ];
      if (allImages.length > 0) {
        try {
          const imgForm = new FormData();
          imgForm.append("file", allImages[0]);
          const imgRes = await fetch(`${API_URL}/upload/image`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: imgForm,
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            imageUrl = `${API_URL}${imgData.url}`;
          }
        } catch { /* ignore upload errors */ }
      }

      /* ── 3. Créer la propriété (localisation + image) ── */
      await handleRes(await fetch(`${API_URL}/properties/`, {
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

      toast("Annonce créée et publiée sur la carte !");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
    } catch (err) {
      if (err.message !== "session_expired") {
        toast("Erreur réseau — vérifiez que le serveur est démarré.", "error");
      }
    }
  };

  const handleAIConfirm = (aiDescription) => {
    setFormData(prev => ({ ...prev, description: aiDescription }));
    setIsAIModalOpen(false);
  };

  const generateQuickAIDescription = () => {
    if (!formData.type_bien) {
      toast("Veuillez d'abord sélectionner un type de bien (étape 1).", "error");
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
    { value: "appartement", label: "Appartement",     icon: "🏢" },
    { value: "villa",       label: "Villa",            icon: "🏡" },
    { value: "terrain",     label: "Terrain",          icon: "🌿" },
    { value: "commercial",  label: "Local commercial", icon: "🏪" },
    { value: "bord_eau",    label: "Bord d'eau",       icon: "🌊" },
  ];

  const ETAT_CARDS = [
    { value: "nouveau",             label: "Neuf",            icon: "✨" },
    { value: "bon_etat",            label: "Bon état",         icon: "👍" },
    { value: "a_renover",           label: "À rénover",        icon: "🔧" },
    { value: "cours_construction",  label: "En construction",  icon: "🏗️" },
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
    { key: "ascenseur",     icon: "🛗",  label: "Ascenseur" },
    { key: "garage",        icon: "🚗",  label: "Garage" },
    { key: "parking",       icon: "🅿️",  label: "Parking" },
    { key: "cellier",       icon: "📦",  label: "Cellier" },
    { key: "meuble",        icon: "🛋️",  label: "Meublé" },
    { key: "cuisine_equipee",icon: "🍳", label: "Cuisine équipée" },
    { key: "climatisation", icon: "❄️",  label: "Climatisation" },
  ];

  return (
    <Layout>
      <div className="ca-root">
        {/* ── Left sidebar ── */}
        <aside className="ca-sidebar">
          <div className="ca-sidebar__inner">
            <div className="ca-sidebar__title">Créer une annonce</div>

            {/* Step list */}
            <nav className="ca-steps">
              {STEPS.map((s) => {
                const done   = currentStep > s.id;
                const active = currentStep === s.id;
                return (
                  <div
                    key={s.id}
                    className={`ca-step${active ? " ca-step--active" : done ? " ca-step--done" : " ca-step--future"}`}
                    onClick={done ? () => setCurrentStep(s.id) : undefined}
                    title={done ? `Revenir à : ${s.label}` : undefined}
                  >
                    <div className="ca-step__circle">
                      {done ? <Check size={13} strokeWidth={3}/> : <span>{s.id}</span>}
                    </div>
                    <span className="ca-step__label">{s.label}</span>
                    {done && <span className="ca-step__back-ico">↩</span>}
                  </div>
                );
              })}
            </nav>

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
                    <h2 className="ca-card__title">Type de bien</h2>
                    <span className="ca-req-hint"><span className="ca-req">*</span> champs requis</span>
                  </div>

                  {/* Type de bien — compact inline (style état du bien) */}
                  <div className="ca-section-label">Sélectionnez le type <span className="ca-req">*</span></div>
                  <div className="ca-etat-row">
                    {TYPE_CARDS.map(tc => (
                      <button
                        key={tc.value}
                        type="button"
                        className={`ca-etat-card${formData.type_bien === tc.value ? " ca-etat-card--on" : ""}`}
                        onClick={() => handleInputChange("type_bien", tc.value)}
                      >
                        <span>{tc.icon}</span>
                        <span>{tc.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Catégorie pills */}
                  <div className="ca-section-label" style={{marginTop:24}}>Type d'offre <span className="ca-req">*</span></div>
                  <div className="ca-pill-row">
                    {[{ v:"vente", l:"Vente" }, { v:"location", l:"Location" }, { v:"vacances", l:"Vacances" }].map(o => (
                      <button
                        key={o.v}
                        type="button"
                        className={`ca-pill${formData.categorie === o.v ? " ca-pill--on" : ""}`}
                        onClick={() => handleInputChange("categorie", o.v)}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>

                  {/* Appartement sub-fields */}
                  {formData.type_bien === "appartement" && (
                    <div className="ca-row-2" style={{marginTop:20}}>
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

                  {/* Villa sub-fields */}
                  {formData.type_bien === "villa" && (
                    <div className="ca-row-2" style={{marginTop:20}}>
                      <div className="ca-field">
                        <label className="ca-label">Type de villa</label>
                        <select className="ca-select" value={formData.type_villa}
                          onChange={e => handleInputChange("type_villa", e.target.value)}>
                          <option value="">Sélectionner…</option>
                          <option value="r">Plain-pied (R)</option>
                          <option value="r+1">R+1</option>
                          <option value="r+2">R+2</option>
                          <option value="r+3">R+3</option>
                          <option value="r+4">R+4</option>
                        </select>
                      </div>
                      <div className="ca-field">
                        <label className="ca-label">Option villa</label>
                        <select className="ca-select" value={formData.type_option_villa}
                          onChange={e => handleInputChange("type_option_villa", e.target.value)}>
                          <option value="">Sélectionner…</option>
                          <option value="aucun">Aucune option</option>
                          <option value="sous-sol">Sous-sol</option>
                          <option value="rez-de-jardin">Rez-de-jardin</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Terrain sub-fields */}
                  {formData.type_bien === "terrain" && (
                    <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:16}}>
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
                      {/* Titre foncier — terrain only */}
                      <div className="ca-tf-row">
                        <span className="ca-tf-label">Titre foncier</span>
                        <div className="ca-tf-btns">
                          <button type="button"
                            className={`ca-tf-btn${formData.titre_foncier === "1" ? " ca-tf-btn--on" : ""}`}
                            onClick={() => handleInputChange("titre_foncier", "1")}>
                            Oui
                          </button>
                          <button type="button"
                            className={`ca-tf-btn${formData.titre_foncier === "0" ? " ca-tf-btn--on ca-tf-btn--no" : ""}`}
                            onClick={() => handleInputChange("titre_foncier", "0")}>
                            Non
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* État du bien */}
                  <div className="ca-section-label" style={{marginTop:24}}>État du bien</div>
                  <div className="ca-etat-row">
                    {ETAT_CARDS.map(ec => (
                      <button
                        key={ec.value}
                        type="button"
                        className={`ca-etat-card${formData.etat_bien === ec.value ? " ca-etat-card--on" : ""}`}
                        onClick={() => handleInputChange("etat_bien", ec.value)}
                      >
                        <span>{ec.icon}</span>
                        <span>{ec.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Counters — masqués pour terrain */}
                  {formData.type_bien !== "terrain" && (<>
                  <div className="ca-section-label" style={{marginTop:24}}>Pièces & espaces</div>
                  <div className="ca-counters">
                    {[
                      { field: "nb_pieces",     label: "Pièces" },
                      { field: "nb_chambres",   label: "Chambres" },
                      { field: "nb_salles_bain", label: "Salles de bain" },
                    ].map(c => (
                      <div key={c.field} className="ca-counter">
                        <span className="ca-counter__label">{c.label}</span>
                        <div className="ca-counter__ctrl">
                          <button type="button" className="ca-counter__btn"
                            onClick={() => decrementValue(c.field)}>
                            <Minus size={14}/>
                          </button>
                          <span className="ca-counter__val">{formData[c.field]}</span>
                          <button type="button" className="ca-counter__btn"
                            onClick={() => incrementValue(c.field)}>
                            <Plus size={14}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  </>)}
                </div>
              )}

              {/* ─── STEP 2 ─── */}
              {currentStep === 2 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <CheckCircle2 size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Caractéristiques</h2>
                  </div>

                  {[
                    { title: "Vue",                  items: VUE_ITEMS },
                    { title: "Espaces extérieurs",   items: EXT_ITEMS },
                    { title: "Commodités",            items: COM_ITEMS },
                  ].map(section => (
                    <div key={section.title} className="ca-feat-section">
                      <div className="ca-section-label">{section.title}</div>
                      <div className="ca-feat-grid">
                        {section.items.map(item => (
                          <button
                            key={item.key}
                            type="button"
                            className={`ca-feat-card${formData[item.key] ? " ca-feat-card--on" : ""}`}
                            onClick={() => handleCheckboxChange(item.key)}
                          >
                            <span className="ca-feat-card__ico">{item.icon}</span>
                            <span className="ca-feat-card__label">{item.label}</span>
                            {formData[item.key] && <Check size={12} className="ca-feat-card__check"/>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── STEP 3 ─── */}
              {currentStep === 3 && (
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
                        <select className="ca-select" value={hierarchy.gouvernorat}
                          onChange={e => handleHierarchyChange("gouvernorat", e.target.value)}>
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
                        <button type="button" className="ca-geo-btn" onClick={handleGeolocate} disabled={isGeolocating}>
                          {isGeolocating ? <Loader size={15} className="ca-spin"/> : <Navigation size={15}/>}
                        </button>
                      </div>
                      <p className="ca-map-hint">Entrée ou 📍 pour centrer la carte.</p>

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
                      <p className="ca-map-hint">Cliquez sur la carte ou déplacez le marqueur pour préciser l'emplacement.</p>
                    </div>

                  </div>

                </div>
              )}

              {/* ─── STEP 4 ─── */}
              {currentStep === 4 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Sparkles size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Présentation <span className="ca-card__ai-tag">IA Assistée</span></h2>
                    <span className="ca-req-hint"><span className="ca-req">*</span> champs requis</span>
                  </div>

                  {/* Titre */}
                  <div className="ca-field" style={{marginBottom:20}}>
                    <label className="ca-label">Titre de l'annonce <span className="ca-req">*</span></label>
                    <div className="ca-input-wand">
                      <input type="text" className="ca-input"
                        placeholder="Ex: Magnifique villa moderne avec piscine"
                        value={formData.titre}
                        onChange={e => handleInputChange("titre", e.target.value)}
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

                  {/* Superficie + Prix */}
                  <div className="ca-row-2" style={{marginBottom:20}}>
                    <div className="ca-field">
                      <label className="ca-label">Superficie <span className="ca-req">*</span></label>
                      <div className="ca-input-unit">
                        <input type="number" className="ca-input" placeholder="150"
                          min="1" max="9999999"
                          value={formData.superficie}
                          onChange={e => handleInputChange("superficie", e.target.value)}/>
                        <span className="ca-unit">m²</span>
                      </div>
                    </div>
                    <div className="ca-field">
                      <label className="ca-label">Prix <span className="ca-req">*</span></label>
                      <div className="ca-input-unit">
                        <input type="number" className="ca-input" placeholder="250000"
                          min="1" max="9999999999"
                          value={formData.prix}
                          onChange={e => handleInputChange("prix", e.target.value)}/>
                        <select className="ca-currency" value={formData.devise}
                          onChange={e => handleInputChange("devise", e.target.value)}>
                          <option value="TND">TND</option>
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="ca-field">
                    <label className="ca-label">Description <span className="ca-req">*</span></label>

                    {/* IA actions — minimal strip */}
                    <div className="ca-ai-strip">
                      <span className="ca-ai-strip__label">Générer avec l'IA :</span>
                      <button type="button" className="ca-ai-pill"
                        onClick={generateQuickAIDescription} disabled={isAILoading}>
                        {isAILoading ? "Génération…" : "Rédaction rapide"}
                      </button>
                      <button type="button" className="ca-ai-pill ca-ai-pill--ghost"
                        onClick={() => setIsAIModalOpen(true)}>
                        Assistant guidé
                      </button>
                    </div>

                    <div className="ca-desc-wrap">
                      <textarea className="ca-textarea" rows={6}
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
                </div>
              )}

              {/* ─── STEP 5 ─── */}
              {currentStep === 5 && (
                <div className="ca-step-content">
                  <div className="ca-card__head">
                    <Camera size={20} className="ca-card__head-ico"/>
                    <h2 className="ca-card__title">Photos du bien</h2>
                  </div>

                  {/* Main image */}
                  <div className="ca-section-label">Image principale <span className="ca-req">*</span></div>
                  {!formData.image_principale ? (
                    <label className="ca-dropzone ca-dropzone--main">
                      <input type="file" accept="image/*"
                        onChange={e => handleImageUpload(e, true)}
                        style={{display:"none"}}/>
                      <Upload size={36} className="ca-dropzone__ico"/>
                      <span className="ca-dropzone__text">Cliquez pour ajouter l'image principale</span>
                      <span className="ca-dropzone__hint">JPG, PNG — max 5 MB</span>
                    </label>
                  ) : (
                    <div className="ca-img-preview ca-img-preview--main">
                      <img src={URL.createObjectURL(formData.image_principale)} alt="Principale"/>
                      <div className="ca-img-overlay">
                        <button type="button" className="ca-img-btn ca-img-btn--eye"
                          onClick={() => window.open(URL.createObjectURL(formData.image_principale), "_blank")}>
                          <Eye size={16}/>
                        </button>
                        <button type="button" className="ca-img-btn ca-img-btn--del"
                          onClick={() => handleInputChange("image_principale", null)}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                      {imageValidation.main && (
                        <div className={`ca-badge${imageValidation.main.valid ? " ca-badge--ok" : " ca-badge--err"}`}>
                          {imageValidation.main.valid ? <><CheckCircle2 size={13}/> Valide</> : <><XCircle size={13}/> {imageValidation.main.message}</>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional images */}
                  <div className="ca-section-label" style={{marginTop:24}}>
                    Images supplémentaires
                    <span className="ca-count-badge">{formData.images.length}/10</span>
                  </div>
                  <div className="ca-img-grid">
                    {formData.images.map((file, index) => (
                      <div key={index} className="ca-img-preview">
                        <img src={URL.createObjectURL(file)} alt={`Image ${index + 1}`}/>
                        <div className="ca-img-overlay">
                          <button type="button" className="ca-img-btn ca-img-btn--eye"
                            onClick={() => window.open(URL.createObjectURL(file), "_blank")}>
                            <Eye size={14}/>
                          </button>
                          <button type="button" className="ca-img-btn ca-img-btn--del"
                            onClick={() => removeImage(index)}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                        {imageValidation[index] === undefined ? (
                          <div className="ca-badge ca-badge--load"><Loader size={12} className="ca-spin"/> Analyse…</div>
                        ) : (
                          <div className={`ca-badge${imageValidation[index]?.valid ? " ca-badge--ok" : " ca-badge--err"}`}>
                            {imageValidation[index]?.valid ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                          </div>
                        )}
                      </div>
                    ))}
                    {formData.images.length < 10 && (
                      <label className="ca-dropzone ca-dropzone--sm">
                        <input type="file" accept="image/*" multiple
                          onChange={e => handleImageUpload(e, false)}
                          style={{display:"none"}}/>
                        <Upload size={22} className="ca-dropzone__ico"/>
                        <span className="ca-dropzone__text">Ajouter</span>
                      </label>
                    )}
                  </div>
                  <p className="ca-tip" style={{marginTop:14}}>
                    Ajoutez des photos sous différents angles, des pièces principales, et des caractéristiques uniques.
                  </p>
                </div>
              )}

              {/* ─── STEP 6 — Prévisualisation ─── */}
              {currentStep === 6 && (
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
                  {formData.image_principale && (
                    <div style={{marginTop:20}}>
                      <div className="ca-prev-section-lbl">Image principale</div>
                      <img
                        src={URL.createObjectURL(formData.image_principale)}
                        alt="Principale"
                        style={{width:"100%",maxWidth:480,borderRadius:12,objectFit:"cover",maxHeight:280,display:"block"}}
                      />
                    </div>
                  )}

                  {/* Additional images */}
                  {formData.images.length > 0 && (
                    <div style={{marginTop:16}}>
                      <div className="ca-prev-section-lbl">Photos ({formData.images.length+1} au total)</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {formData.images.slice(0,6).map((img,i)=>(
                          <img key={i} src={URL.createObjectURL(img)} alt={`img ${i}`}
                            style={{width:80,height:80,objectFit:"cover",borderRadius:8}}/>
                        ))}
                        {formData.images.length > 6 && (
                          <div style={{width:80,height:80,borderRadius:8,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#64748b",fontWeight:700}}>
                            +{formData.images.length-6}
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
                      <Check size={17}/> Créer l'annonce
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
          .ca-pill:hover { border-color: #c7d2fe; color: #4f46e5; background: #f0f4ff; }
          .ca-pill--on { background: #0f172a; color: #fff; border-color: #0f172a; box-shadow: 0 2px 8px rgba(15,23,42,.2); }

          /* Etat cards */
          .ca-etat-row { display: flex; gap: 8px; flex-wrap: wrap; }
          .ca-etat-card {
            display: flex; align-items: center; gap: 6px;
            padding: 9px 16px; border-radius: 10px;
            border: 2px solid #e5e7eb; background: #f9fafb;
            font-size: 13px; font-weight: 600; color: #6b7280;
            cursor: pointer; font-family: inherit; transition: all .15s;
          }
          .ca-etat-card:hover { border-color: #c7d2fe; background: #f0f4ff; }
          .ca-etat-card--on { border-color: #0f172a; background: #0f172a; color: #fff; }

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
          .ca-feat-card:hover { border-color: #c7d2fe; background: #f0f4ff; }
          .ca-feat-card--on { border-color: #0f172a; background: #0f172a; color: #fff; }
          .ca-feat-card__ico { font-size: 16px; }
          .ca-feat-card__label { font-size: 13px; }
          .ca-feat-card__check { margin-left: 2px; color: #a3e635; }

          /* Step 3 — two-column layout */
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
          .ca-row-2 { display: flex; gap: 14px; flex-wrap: wrap; }

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
          .ca-tf-btn--on { background: #0f172a; color: #fff; border-color: #0f172a; }
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

          /* Responsive */
          @media (max-width: 900px) {
            .ca-sidebar { display: none; }
            .ca-main { padding: 0 0 100px; }
            .ca-mobile-progress { display: block; }
            .ca-main > form { padding: 12px 16px 0; }
            .ca-card { padding: 20px 18px; }
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
        `}</style>
      </div>
    </Layout>
  );
};

export default CreateListingForm;
