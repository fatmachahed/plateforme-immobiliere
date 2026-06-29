import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import AlerteFiltersModal, { EMPTY_FORM } from "../components/AlerteFiltersModal";
import PublierAnnonceBtn from "../components/PublierAnnonceBtn";
import { useToast } from "../components/Toast";
import API_URL, { fmtDevise } from "../config";
import {
  Home, Plus, Eye, Edit2, Trash2, MapPin, TrendingUp,
  Clock, CheckCircle, XCircle, AlertCircle, X, Search, Zap,
  Bell, Phone, Mail, MessageSquare, Sparkles, RefreshCw
} from "lucide-react";

/* ── Tracking switch pour l'onglet Accompagnements ── */
const TrackSwitch = ({ val, onChange }) => (
  <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:11,fontWeight:700,color:val?"#16a34a":"#94a3b8",minWidth:22}}>{val?"Oui":"Non"}</span>
    <label style={{position:"relative",display:"inline-block",width:36,height:20,flexShrink:0}}>
      <input type="checkbox" checked={val} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0}}/>
      <span style={{position:"absolute",inset:0,background:val?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s",cursor:"pointer"}}/>
      <span style={{position:"absolute",width:14,height:14,background:"#fff",borderRadius:"50%",top:3,left:val?19:3,transition:".2s"}}/>
    </label>
  </div>
);

function statusBadge(s) {
  if (s === "approuvee")    return { label: "Approuvée",     cls: "db-badge--ok",   icon: <CheckCircle size={12}/> };
  if (s === "refusee")      return { label: "Refusée",       cls: "db-badge--err",  icon: <XCircle size={12}/> };
  return                           { label: "En attente",    cls: "db-badge--warn", icon: <Clock size={12}/> };
}

function typeBienLabel(t) {
  const map = { appartement:"Appartement", villa:"Villa", maison:"Maison",
    terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole",
    garage_parking:"Garage / Parking", depot_stockage:"Dépôt de stockage", immobiliers_divers:"Immobiliers divers" };
  return map[t] || t;
}
function categorieLabel(c) {
  const map = { vente:"Vente", location:"Location", vacances:"Vacances" };
  return map[c] || c;
}

const TH = { padding:"9px 12px", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", textAlign:"left", whiteSpace:"nowrap", borderBottom:"2px solid #f1f5f9" };
const TD = { padding:"10px 12px", verticalAlign:"middle", fontSize:12.5 };

export default function Dashboard() {
  const [annonces, setAnnonces]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [delItem,  setDelItem]      = useState(null);
  const [soldConfirm, setSoldConfirm] = useState(null);
  const [search,   setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter,   setDateFilter]   = useState("");
  const [dateStart,    setDateStart]    = useState("");
  const [dateEnd,      setDateEnd]      = useState("");
  const [prixMin,      setPrixMin]      = useState("");
  const [prixMax,      setPrixMax]      = useState("");
  const [gouvernoratFilter, setGouvernoratFilter] = useState("");
  /* ── Onglet actif ── */
  const [searchParams]              = useSearchParams();
  const [activeTab, setActiveTab]   = useState(
    searchParams.get("tab") === "contacts"       ? "contacts"
    : searchParams.get("tab") === "accompagnements" ? "accompagnements"
    : searchParams.get("tab") === "alertes"      ? "alertes"
    : "annonces"
  );
  /* ── Mes alertes (saved searches) ── */
  const [savedSearches, setSavedSearches] = useState([]);
  const [loadingAlertes, setLoadingAlertes] = useState(false);
  const [alerteModal, setAlerteModal] = useState(null); // null | "new" | {…savedSearch}
  const [alerteMatchCounts, setAlerteMatchCounts] = useState({}); // { [id]: count }
  const [alerteForm, setAlerteForm] = useState({ ...EMPTY_FORM });
  const [alerteSaving, setAlerteSaving] = useState(false);
  /* ── Suivi accompagnements (localStorage) ── */
  const [accomTracking, setAccomTracking] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_accom_tracking") || "{}"); } catch { return {}; }
  });
  const updateAccomTracking = (annonceId, field, value) => {
    setAccomTracking(prev => {
      const next = { ...prev, [annonceId]: { ...(prev[annonceId] || {}), [field]: value } };
      try { localStorage.setItem("localizi_accom_tracking", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  /* ── Demandes de contact reçues ── */
  const [contactRequests, setContactRequests] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  /* ── Liste agences/agents pour dropdown accompagnement ── */
  const [agencesList, setAgencesList] = useState([]);
  /* ── Alerte : agence choisie par alerte (localStorage) ── */
  const [alerteAgence, setAlerteAgence] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_alerte_agence") || "{}"); } catch { return {}; }
  });

  const navigate = useNavigate();
  const toast    = useToast();

  const token = localStorage.getItem("token");
  const user  = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchAnnonces();
    fetchContactRequests();
    fetchSavedSearches();
    // Charger la liste des agences/agents
    fetch(`${API_URL}/users/agencies/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAgencesList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function fetchSavedSearches() {
    setLoadingAlertes(true);
    try {
      const res = await fetch(`${API_URL}/users/me/saved-searches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedSearches(data);
        // Charger les comptages pour chaque alerte
        data.forEach(s => fetchAlerteCount(s));
      }
    } catch {}
    finally { setLoadingAlertes(false); }
  }

  async function fetchAlerteCount(s) {
    try {
      const c = s.criteres || {};
      const params = new URLSearchParams();
      // Paramètres backend
      if (c.categories?.length === 1) params.set("categorie", c.categories[0]);
      if (c.type)    params.set("type_bien", c.type);
      if (c.govId)   params.set("gouvernorat_id", c.govId);
      if (c.prixMin) params.set("prix_min", c.prixMin);
      if (c.prixMax) params.set("prix_max", c.prixMax);
      params.set("limit", "500");
      const res = await fetch(`${API_URL}/annonces/public?${params}`);
      if (!res.ok) return;
      let filtered = await res.json();

      // Filtres client-side supplémentaires
      if (c.categories?.length > 1)
        filtered = filtered.filter(a => c.categories.includes(a.categorie));
      if (c.govNom && !c.govId)
        filtered = filtered.filter(a => (a.gouvernorat||"").toLowerCase() === c.govNom.toLowerCase());
      if (c.delNom)
        filtered = filtered.filter(a => (a.delegation||"").toLowerCase() === c.delNom.toLowerCase());
      if (c.locNom)
        filtered = filtered.filter(a => (a.localite||"").toLowerCase() === c.locNom.toLowerCase());
      if (c.superficieMin)
        filtered = filtered.filter(a => a.superficie >= Number(c.superficieMin));
      if (c.superficieMax)
        filtered = filtered.filter(a => a.superficie <= Number(c.superficieMax));
      if (c.bedsMin)
        filtered = filtered.filter(a => (a.nb_pieces||0) >= Number(c.bedsMin));
      if (c.chambresMin)
        filtered = filtered.filter(a => (a.nb_chambres||0) >= Number(c.chambresMin));
      if (c.features?.length > 0) {
        const FEAT_LABELS = {
          vue_mer:"Vue sur mer", vue_montagne:"Vue sur montagne", vue_foret:"Vue sur forêt",
          jardin:"Jardin", terrasse:"Terrasse", balcon:"Balcon", piscine:"Piscine",
          parking:"Parking", ascenseur:"Ascenseur", garage:"Garage",
          cellier:"Cellier", meuble:"Meublé", concierge:"Concierge",
          gardien:"Gardien", animaux_admis:"Animaux admis", cuisine_equipee:"Cuisine équipée",
          climatisation:"Climatisation", chauffage_centrale:"Chauffage central",
          cheminee:"Cheminée", double_vitrage:"Double vitrage", porte_blindee:"Porte blindée",
          securite:"Sécurité", internet:"Internet", tv:"TV", machine_laver:"Machine à laver",
          digicode:"Digicode", interphone:"Interphone",
        };
        filtered = filtered.filter(a =>
          c.features.every(k => (a.features||[]).includes(FEAT_LABELS[k] || k))
        );
      }
      setAlerteMatchCounts(prev => ({ ...prev, [s.id]: filtered.length }));
    } catch {}
  }

  async function saveAlerte() {
    if (!alerteForm.nom?.trim()) { toast("Donnez un nom à cette alerte.", "error"); return; }
    setAlerteSaving(true);
    const { nom, email_alert, ...criteres } = alerteForm;
    try {
      const isEditMode = alerteModal && alerteModal !== "new";
      const url = isEditMode
        ? `${API_URL}/users/me/saved-searches/${alerteModal.id}`
        : `${API_URL}/users/me/saved-searches`;
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ nom, criteres, email_alert: !!email_alert }),
      });
      if (res.ok) {
        toast(isEditMode ? "Alerte mise à jour !" : "Alerte enregistrée !");
        setAlerteModal(null);
        fetchSavedSearches();
      } else toast("Erreur lors de l'enregistrement.", "error");
    } catch { toast("Serveur inaccessible.", "error"); }
    setAlerteSaving(false);
  }

  async function toggleAlerteEmail(id) {
    try {
      const res = await fetch(`${API_URL}/users/me/saved-searches/${id}/toggle`, {
        method: "PATCH", headers: { Authorization:`Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedSearches(prev => prev.map(s => s.id === id ? { ...s, email_alert: data.email_alert } : s));
      }
    } catch {}
  }

  async function updateAnnonceAccompagnement(id, accompagnement, agence_id = undefined) {
    try {
      const body = { accompagnement };
      if (agence_id !== undefined) body.agence_id = agence_id || null;
      const res = await fetch(`${API_URL}/annonces/${id}/accompagnement`, {
        method: "PATCH",
        headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setAnnonces(prev => prev.map(a => a.id === id ? {
          ...a,
          accompagnement: data.accompagnement,
          accompagnement_agence_id: data.accompagnement_agence_id,
          accompagnement_agence_nom: data.accompagnement_agence_nom,
        } : a));
      }
    } catch {}
  }

  // Accompagnement alerte : stocké localement (pas de colonne DB)
  const [alerteAccom, setAlerteAccom] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_alerte_accom") || "{}"); } catch { return {}; }
  });
  function toggleAlerteAccom(id) {
    setAlerteAccom(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem("localizi_alerte_accom", JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function setAlerteAgenceVal(alerteId, agenceId) {
    setAlerteAgence(prev => {
      const next = { ...prev, [alerteId]: agenceId };
      try { localStorage.setItem("localizi_alerte_agence", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function buildCarteUrl(criteres) {
    const c = criteres || {};
    const p = new URLSearchParams();
    if (c.categories?.length > 0) p.set("categories",  c.categories.join(","));
    if (c.type)             p.set("type",        c.type);
    if (c.govNom)           p.set("gouvernorat", c.govNom);
    if (c.govId)            p.set("govId",       c.govId);
    if (c.delNom)           p.set("delegation",  c.delNom);
    if (c.delId)            p.set("delId",       c.delId);
    if (c.locNom)           p.set("localite",    c.locNom);
    if (c.locId)            p.set("locId",       c.locId);
    if (c.prixMin)          p.set("prixMin",     c.prixMin);
    if (c.prixMax)          p.set("prixMax",     c.prixMax);
    if (c.superficieMin)    p.set("sMin",        c.superficieMin);
    if (c.superficieMax)    p.set("sMax",        c.superficieMax);
    if (c.bedsMin)          p.set("beds",        c.bedsMin);
    if (c.piecesMin)        p.set("pMin",        c.piecesMin);
    if (c.chambresMin)      p.set("cMin",        c.chambresMin);
    if (c.etat)             p.set("etat",        c.etat);
    if (c.titre_foncier)    p.set("tf",          c.titre_foncier);
    if (c.type_terrain)     p.set("tterrain",    c.type_terrain);
    if (c.vocation_terrain) p.set("vterrain",    c.vocation_terrain);
    if (c.features?.length > 0) p.set("feat",   c.features.join(","));
    return `/carte?${p.toString()}`;
  }

  async function deleteAlert(id) {
    try {
      await fetch(`${API_URL}/users/me/saved-searches/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedSearches(prev => prev.filter(s => s.id !== id));
      toast("Alerte supprimée.");
    } catch { toast("Erreur lors de la suppression.", "error"); }
  }

  async function fetchContactRequests() {
    setLoadingContacts(true);
    try {
      const res = await fetch(`${API_URL}/users/me/contact-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContactRequests(Array.isArray(data) ? data : []);
      }
    } catch {}
    finally { setLoadingContacts(false); }
  }

  async function markAsRead(id) {
    try {
      await fetch(`${API_URL}/users/me/contact-requests/${id}/lu`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setContactRequests(prev => prev.map(r => r.id === id ? {...r, lu:true} : r));
    } catch {}
  }

  async function markAsUnread(id) {
    try {
      await fetch(`${API_URL}/users/me/contact-requests/${id}/lu?lu=false`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setContactRequests(prev => prev.map(r => r.id === id ? {...r, lu:false} : r));
    } catch {}
  }

  const [expandedMsg, setExpandedMsg] = useState(null);

  async function fetchAnnonces() {
    setLoading(true);
    try {
      // fetch annonces
      const res = await fetch(`${API_URL}/annonces/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) { navigate("/login?session=expired"); return; }
      const data = await res.json();
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b.date_mise_a_jour || b.date_creation) - new Date(a.date_mise_a_jour || a.date_creation))
        : [];
      setAnnonces(sorted);
      // Charger les stats (vues + favoris + note) pour chaque annonce
      Promise.all(
        sorted.map(a =>
          fetch(`${API_URL}/annonces/${a.id}/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(s => s ? [a.id, s] : null)
            .catch(() => null)
        )
      ).then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, s]) => { map[id] = s; });
        setAnnonceStats(map);
      });
    } catch {
      toast("Impossible de charger les annonces.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      // fetch delete
      const res = await fetch(`${API_URL}/annonces/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      setAnnonces(prev => prev.filter(a => a.id !== id));
      setDelItem(null);
      toast("Annonce supprimée avec succès.");
    } catch {
      toast("Erreur lors de la suppression.", "error");
    }
  }

  const [refreshingId, setRefreshingId] = useState(null);
  const [spotlightingId, setSpotlightingId] = useState(null);
  const [annonceStats, setAnnonceStats] = useState({}); // { [id]: {views_count, favoris_count, rating_avg, rating_count} }

  async function handleRefresh(id) {
    setRefreshingId(id);
    try {
      const res = await fetch(`${API_URL}/annonces/${id}/refresh`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      setAnnonces(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, date_mise_a_jour: new Date().toISOString() } : a);
        return [...updated].sort((a, b) => new Date(b.date_mise_a_jour || b.date_creation) - new Date(a.date_mise_a_jour || a.date_creation));
      });
      toast("Annonce remontée en tête de liste !");
    } catch {
      toast("Erreur lors du rafraîchissement.", "error");
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleSpotlight(id) {
    setSpotlightingId(id);
    try {
      const res = await fetch(`${API_URL}/annonces/${id}/spotlight`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      setAnnonces(prev => prev.map(a => a.id === id ? { ...a, spotlight_active: true, spotlight_expires_at: expires } : a));
      toast("Spotlight activé pour 7 jours !");
    } catch {
      toast("Erreur lors de l'activation du Spotlight.", "error");
    } finally {
      setSpotlightingId(null);
    }
  }

  const stats = {
    total:    annonces.length,
    publiees: annonces.filter(a => a.status === "approuvee").length,
    attente:  annonces.filter(a => a.status === "en_attente").length,
    vues:     annonces.reduce((s, a) => s + (a.views_count || 0), 0),
  };

  const TYPE_LABEL_MAP = {
    appartement: "Appartement",
    villa: "Villa/Maison", villa_maison: "Villa/Maison", maison: "Villa/Maison",
    immeuble: "Immeuble",
    terrain: "Terrain", bureau: "Bureau",
    ferme: "Ferme agricole", ferme_agricole: "Ferme agricole", local_commercial: "Local commercial",
    garage_parking: "Garage / Parking",
    depot_stockage: "Dépôt de stockage",
    immobiliers_divers: "Immobiliers divers",
  };
  const STATUS_LABEL_MAP = {
    approuvee: "Approuvée", en_attente: "En attente", refusee: "Refusée",
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const customStart  = dateStart ? new Date(dateStart) : null;
    const customEnd    = dateEnd   ? new Date(dateEnd + "T23:59:59") : null;

    return annonces.filter(a => {
      const prop = a.properties?.[0];
      // Text search
      if (q) {
        const matches =
          (a.titre         || "").toLowerCase().includes(q) ||
          (a.type_bien     || "").toLowerCase().includes(q) ||
          (a.categorie     || "").toLowerCase().includes(q) ||
          (a.status        || "").toLowerCase().includes(q) ||
          (prop?.address   || "").toLowerCase().includes(q) ||
          typeBienLabel(a.type_bien).toLowerCase().includes(q) ||
          categorieLabel(a.categorie).toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Type filter — villa et villa_maison sont équivalents
      if (typeFilter) {
        const t = a.type_bien === "villa" || a.type_bien === "maison" ? "villa_maison" : a.type_bien;
        if (t !== typeFilter) return false;
      }
      // Status filter
      if (statusFilter) {
        const mappedStatus = STATUS_LABEL_MAP[a.status] || a.status;
        if (mappedStatus !== statusFilter) return false;
      }
      // Date filter
      if (dateFilter) {
        const created = new Date(a.date_creation);
        if (dateFilter === "Aujourd'hui"  && created < startOfDay)   return false;
        if (dateFilter === "Cette semaine" && created < startOfWeek)  return false;
        if (dateFilter === "Ce mois"       && created < startOfMonth) return false;
      }
      // Custom date range
      if (customStart || customEnd) {
        const created = new Date(a.date_creation);
        if (customStart && created < customStart) return false;
        if (customEnd   && created > customEnd)   return false;
      }
      // Gouvernorat
      if (gouvernoratFilter && a.gouvernorat !== gouvernoratFilter) return false;
      // Prix
      if (prixMin && Number(a.prix) < Number(prixMin)) return false;
      if (prixMax && Number(a.prix) > Number(prixMax)) return false;
      return true;
    });
  }, [annonces, search, typeFilter, statusFilter, dateFilter, dateStart, dateEnd, gouvernoratFilter, prixMin, prixMax]);

  return (
    <>
      <Navbar />
      <div className="db-page">
        {/* Header */}
        <div className="db-header">
          <div className="db-header__inner">
            <div>
              <h1 className="db-header__title">
                {activeTab === "contacts" ? "Demandes de contact"
                  : activeTab === "accompagnements" ? "Accompagnements"
                  : "Mes annonces"}
              </h1>
              <p className="db-header__sub">
                {activeTab === "contacts"
                  ? "Visiteurs qui souhaitent vous contacter via vos annonces anonymes"
                  : activeTab === "accompagnements"
                  ? "Suivi des annonces avec accompagnement activé"
                  : "Gérez toutes vos publications immobilières"}
              </p>
            </div>
            <div style={{display:"flex",gap:10}}>
              {activeTab === "annonces" && (
                <PublierAnnonceBtn className="db-btn-primary">
                  <Plus size={17}/> Nouvelle annonce
                </PublierAnnonceBtn>
              )}
            </div>
          </div>

          {/* ── Onglets ── */}
          <div style={{display:"flex", gap:4, padding:"0 0 0 0", borderBottom:"2px solid #f1f5f9", marginTop:8}}>
            {[
              { key:"annonces", label:"Mes annonces",   icon:<Home size={15}/> },
              { key:"contacts", label:"Demandes reçues", icon:<Bell size={15}/>,
                badge: contactRequests.filter(r=>!r.lu).length },
              { key:"alertes",  label:"Mes Alertes",    icon:<Bell size={15}/>,
                badge: savedSearches.length > 0 ? savedSearches.length : 0 },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"10px 18px", border:"none", background:"none",
                  fontSize:13.5, fontWeight:600, cursor:"pointer",
                  fontFamily:"inherit", position:"relative",
                  color: activeTab===tab.key ? "#4f46e5" : "#64748b",
                  borderBottom: activeTab===tab.key ? "2.5px solid #4f46e5" : "2.5px solid transparent",
                  marginBottom:-2, transition:"color .15s",
                }}
              >
                {tab.icon} {tab.label}
                {tab.badge > 0 && (
                  <span style={{
                    background:"#ef4444", color:"#fff", borderRadius:10,
                    fontSize:10, fontWeight:800, padding:"1px 6px", minWidth:16, textAlign:"center"
                  }}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={activeTab === "contacts" ? "db-inner db-inner--wide" : "db-inner"}>
          {/* Stats (seulement sur l'onglet annonces) */}
          {activeTab === "accompagnements" ? (
            /* ── ONGLET ACCOMPAGNEMENTS ── */
            <div style={{marginTop:8}}>
              {(() => {
                const accomAnnonces = annonces.filter(a => a.accompagnement);
                if (loading) return (
                  <div style={{textAlign:"center", padding:"60px 20px", color:"#94a3b8", fontSize:14}}>
                    Chargement…
                  </div>
                );
                if (accomAnnonces.length === 0) return (
                  <div style={{
                    textAlign:"center", padding:"60px 20px",
                    background:"#f8fafc", borderRadius:14, margin:"16px 0",
                    border:"1.5px dashed #e2e8f0"
                  }}>
                    <Sparkles size={40} style={{color:"#d1d5db", marginBottom:12}}/>
                    <p style={{fontSize:15, fontWeight:700, color:"#374151", marginBottom:6}}>Aucune annonce avec accompagnement</p>
                    <p style={{fontSize:13, color:"#94a3b8"}}>
                      Activez l'accompagnement lors de la création d'une annonce pour la voir apparaître ici.
                    </p>
                  </div>
                );
                return (
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%", borderCollapse:"collapse", fontFamily:"'Inter',system-ui,sans-serif", fontSize:13}}>
                      <thead>
                        <tr style={{borderBottom:"2px solid #e5e7eb", background:"#f8fafc"}}>
                          <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Annonce</th>
                          <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Type</th>
                          <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Agence</th>
                          <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Réponse</th>
                          <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Contact</th>
                          <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em"}}>Remarque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accomAnnonces.map(a => {
                          const t = accomTracking[a.id] || {};
                          return (
                            <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9", transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                              <td style={{padding:"12px 14px", verticalAlign:"middle", maxWidth:200}}>
                                <div style={{fontWeight:700, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{a.titre}</div>
                                <div style={{fontSize:11, color:"#94a3b8", marginTop:2}}>
                                  {new Date(a.date_creation).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"})}
                                </div>
                              </td>
                              <td style={{padding:"12px 14px", verticalAlign:"middle", whiteSpace:"nowrap"}}>
                                <span style={{fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em", color:"#6366f1", background:"#eef2ff", padding:"3px 7px", borderRadius:6}}>
                                  {typeBienLabel(a.type_bien)}
                                </span>
                                <span style={{marginLeft:6, fontSize:11, color:"#64748b", background:"#f1f5f9", padding:"3px 7px", borderRadius:6}}>
                                  {categorieLabel(a.categorie)}
                                </span>
                              </td>
                              <td style={{padding:"12px 14px", verticalAlign:"middle"}}>
                                <TrackSwitch val={!!t.agence} onChange={v => updateAccomTracking(a.id, "agence", v)}/>
                              </td>
                              <td style={{padding:"12px 14px", verticalAlign:"middle"}}>
                                <TrackSwitch val={!!t.reponse} onChange={v => updateAccomTracking(a.id, "reponse", v)}/>
                              </td>
                              <td style={{padding:"12px 14px", verticalAlign:"middle"}}>
                                <TrackSwitch val={!!t.contact} onChange={v => updateAccomTracking(a.id, "contact", v)}/>
                              </td>
                              <td style={{padding:"12px 14px", verticalAlign:"middle", minWidth:180}}>
                                <input
                                  type="text"
                                  value={t.remarque || ""}
                                  onChange={e => updateAccomTracking(a.id, "remarque", e.target.value)}
                                  placeholder="Ajouter une remarque…"
                                  style={{
                                    width:"100%", padding:"6px 10px",
                                    border:"1.5px solid #e2e8f0", borderRadius:8,
                                    fontSize:12.5, fontFamily:"inherit", outline:"none",
                                    color:"#0f172a", background:"#f8fafc",
                                    transition:"border-color .15s",
                                    boxSizing:"border-box"
                                  }}
                                  onFocus={e=>e.target.style.borderColor="#6366f1"}
                                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          ) : activeTab === "contacts" ? (
            /* ── ONGLET DEMANDES DE CONTACT ── */
            <div style={{marginTop:8}}>
              {loadingContacts ? (
                <div style={{textAlign:"center", padding:"60px 20px", color:"#94a3b8", fontSize:14}}>
                  Chargement des demandes…
                </div>
              ) : contactRequests.length === 0 ? (
                <div style={{
                  textAlign:"center", padding:"60px 20px",
                  background:"#f8fafc", borderRadius:14, margin:"16px 0",
                  border:"1.5px dashed #e2e8f0"
                }}>
                  <Bell size={40} style={{color:"#d1d5db", marginBottom:12}}/>
                  <p style={{fontSize:15, fontWeight:700, color:"#374151", marginBottom:6}}>Aucune demande de contact</p>
                  <p style={{fontSize:13, color:"#94a3b8"}}>
                    Les personnes intéressées par vos annonces anonymes apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div style={{marginTop:8, overflowX:"auto"}}>
                  <table style={{width:"100%", borderCollapse:"collapse", fontFamily:"'Inter',system-ui,sans-serif", fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:"2px solid #e5e7eb", background:"#f8fafc"}}>
                        <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Contact</th>
                        <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Annonce</th>
                        <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Téléphone</th>
                        <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Email</th>
                        <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Message</th>
                        <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap"}}>Date</th>
                        <th style={{padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11.5, textTransform:"uppercase", letterSpacing:".05em"}}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                  {contactRequests.map(req => (
                    <tr key={req.id} style={{
                      background: req.lu ? "#fff" : "#f0f9ff",
                      borderBottom:"1px solid #f1f5f9",
                      transition:"background .15s"
                    }}>
                      {/* Contact */}
                      <td style={{padding:"12px 14px", verticalAlign:"middle"}}>
                        <div style={{display:"flex", alignItems:"center", gap:8}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>
                            {req.nom[0]?.toUpperCase()}
                          </div>
                          <span style={{fontWeight:600, color:"#0f172a"}}>{req.nom}</span>
                        </div>
                      </td>
                      {/* Annonce */}
                      <td style={{padding:"12px 14px", verticalAlign:"middle", color:"#6366f1", fontWeight:600, maxWidth:160}}>
                        <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>
                          {req.annonce_titre || `Annonce #${req.annonce_id}`}
                        </span>
                      </td>
                      {/* Téléphone */}
                      <td style={{padding:"12px 14px", verticalAlign:"middle", whiteSpace:"nowrap"}}>
                        {req.telephone ? (
                          <div style={{display:"flex",gap:6}}>
                            <a href={`tel:${req.telephone.replace(/\s/g,"")}`} style={{color:"#15803d",fontWeight:600,textDecoration:"none"}}><Phone size={12}/> {req.telephone}</a>
                            <a href={`https://wa.me/${req.telephone.replace(/[\s+]/g,"").replace(/^00/,"")}?text=${encodeURIComponent(`Bonjour ${req.nom}, j'ai bien reçu votre demande.`)}`} target="_blank" rel="noopener noreferrer" style={{color:"#15803d",fontWeight:600,textDecoration:"none"}}>WhatsApp</a>
                          </div>
                        ) : <span style={{color:"#cbd5e1"}}>—</span>}
                      </td>
                      {/* Email */}
                      <td style={{padding:"12px 14px", verticalAlign:"middle"}}>
                        {req.email ? (
                          <a href={`mailto:${req.email}?subject=Réponse demande&body=Bonjour ${req.nom},`} style={{color:"#1d4ed8",fontWeight:600,textDecoration:"none"}}><Mail size={12}/> {req.email}</a>
                        ) : <span style={{color:"#cbd5e1"}}>—</span>}
                      </td>
                      {/* Message — cliquable pour voir la suite */}
                      <td style={{padding:"12px 14px", verticalAlign:"top", minWidth:300, maxWidth:480, color:"#374151"}}>
                        {/* Message affiché en entier — clic pour réduire si long */}
                        <span style={{
                          display:"block", lineHeight:1.6, fontSize:13,
                          whiteSpace: expandedMsg !== req.id && req.message?.length > 120 ? "nowrap" : "normal",
                          overflow: expandedMsg !== req.id && req.message?.length > 120 ? "hidden" : "visible",
                          textOverflow: expandedMsg !== req.id && req.message?.length > 120 ? "ellipsis" : "unset",
                          cursor: req.message?.length > 120 ? "pointer" : "default",
                        }}
                          onClick={() => req.message?.length > 120 && setExpandedMsg(expandedMsg === req.id ? null : req.id)}>
                          {req.message || <span style={{color:"#cbd5e1"}}>—</span>}
                        </span>
                        {req.message && req.message.length > 120 && (
                          <span style={{fontSize:10.5, color:"#6366f1", fontWeight:600, cursor:"pointer", marginTop:2, display:"block"}}
                            onClick={() => setExpandedMsg(expandedMsg === req.id ? null : req.id)}>
                            {expandedMsg === req.id ? "▲ Réduire" : "▼ Voir tout"}
                          </span>
                        )}
                      </td>
                      {/* Date */}
                      <td style={{padding:"12px 14px", verticalAlign:"middle", color:"#94a3b8", whiteSpace:"nowrap", fontSize:12}}>
                        {new Date(req.created_at).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"})}
                      </td>
                      {/* Statut + actions */}
                      <td style={{padding:"12px 14px", verticalAlign:"middle"}}>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {!req.lu ? (
                            <button onClick={() => markAsRead(req.id)}
                              style={{padding:"4px 9px",borderRadius:6,border:"none",background:"#0ea5e9",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                              ✓ Marquer lu
                            </button>
                          ) : (
                            <>
                              <span style={{fontSize:11,color:"#16a34a",fontWeight:600,padding:"4px 0"}}>✓ Lu</span>
                              <button onClick={() => markAsUnread(req.id)}
                                style={{padding:"3px 8px",borderRadius:6,border:"1px solid #e5e7eb",background:"#f8fafc",color:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                                Non lu
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === "alertes" ? (
            /* ── ONGLET MES ALERTES ── */
            <div style={{marginTop:8}}>
              {/* Header + bouton créer */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:0}}>Mes alertes immobilières</h2>
                  <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Recevez des notifications quand de nouvelles annonces correspondent à vos critères.</p>
                </div>
                <button
                  onClick={() => { setAlerteForm({...EMPTY_FORM}); setAlerteModal("new"); }}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:13.5,cursor:"pointer",fontFamily:"inherit"}}>
                  <Plus size={16}/> Créer une alerte
                </button>
              </div>

              {loadingAlertes ? (
                <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8",fontSize:14}}>Chargement…</div>
              ) : savedSearches.length === 0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,margin:"16px 0",border:"1.5px dashed #e2e8f0"}}>
                  <Bell size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                  <p style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:6}}>Aucune alerte enregistrée</p>
                  <p style={{fontSize:13,color:"#94a3b8"}}>Cliquez sur "+ Créer une alerte" pour définir vos critères et être notifié.</p>
                </div>
              ) : (
                <div style={{overflowX:"auto", margin:"0 -24px", padding:"0 24px"}}>
                  <table style={{width:"100%",minWidth:900,borderCollapse:"collapse",fontFamily:"'Inter',system-ui,sans-serif",fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                        {["Nom","Critères","Annonces","Accompagnement","Alerte email","Actions"].map(h => (
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {savedSearches.map(s => {
                        const c = s.criteres || {};
                        const CAT_FR = { vente:"Achat", location:"Location", vacances:"Vacances" };
                        const TYPE_FR = { appartement:"Appartement", villa:"Villa/Maison", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", immeuble:"Immeuble", garage_parking:"Garage / Parking", depot_stockage:"Dépôt de stockage", immobiliers_divers:"Immobiliers divers" };
                        const ETAT_FR = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"À rénover", cours_construction:"En construction" };
                        const tags = [
                          c.categories?.length > 0 && c.categories.map(v => CAT_FR[v]||v).join(" / "),
                          c.type && (TYPE_FR[c.type] || c.type.replace(/_/g," ")),
                          c.locNom || c.delNom || c.govNom,
                          c.prixMin && `≥ ${Number(c.prixMin).toLocaleString("fr-TN")} DT`,
                          c.prixMax && `≤ ${Number(c.prixMax).toLocaleString("fr-TN")} DT`,
                          c.superficieMin && c.superficieMax ? `${c.superficieMin}–${c.superficieMax} m²`
                            : c.superficieMin ? `≥ ${c.superficieMin} m²`
                            : c.superficieMax ? `≤ ${c.superficieMax} m²` : null,
                          c.bedsMin && `${c.bedsMin}+ pièces`,
                          c.chambresMin && `${c.chambresMin}+ ch.`,
                          c.etat && (ETAT_FR[c.etat] || c.etat.replace(/_/g," ")),
                          ...(c.features?.length > 0 ? (() => {
                            const FEAT_LABELS = { vue_mer:"Vue sur mer", vue_montagne:"Vue sur montagne", vue_foret:"Vue sur forêt", jardin:"Jardin", terrasse:"Terrasse", balcon:"Balcon", piscine:"Piscine", parking:"Parking", ascenseur:"Ascenseur", garage:"Garage", cellier:"Ch. rangement", meuble:"Meublé", concierge:"Concierge", gardien:"Gardien", animaux_admis:"Animaux admis", cuisine_equipee:"Cuisine équipée", climatisation:"Clim.", chauffage_centrale:"Chauffage", cheminee:"Cheminée", double_vitrage:"Double vitrage", porte_blindee:"Porte blindée", securite:"Sécurité", internet:"Internet", tv:"TV", machine_laver:"Machine laver", digicode:"Digicode", interphone:"Interphone" };
                            return c.features.map(k => FEAT_LABELS[k] || k);
                          })() : []),
                        ].filter(Boolean);
                        const count = alerteMatchCounts[s.id];
                        return (
                          <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9",cursor:"pointer",transition:"background .12s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>

                            {/* Nom + date */}
                            <td style={{padding:"14px 14px",verticalAlign:"middle",minWidth:140}}>
                              <div style={{fontWeight:700,color:"#0f172a",fontSize:15}}>{s.nom||"Ma recherche"}</div>
                              <div style={{fontSize:12.5,color:"#94a3b8",marginTop:3}}>
                                {new Date(s.created_at).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"})}
                              </div>
                            </td>

                            {/* Critères */}
                            <td style={{padding:"14px 14px",verticalAlign:"middle",maxWidth:280}}>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {tags.length>0 ? tags.map((t,i)=>(
                                  <span key={i} style={{background:"#eef2ff",color:"#4f46e5",fontSize:12.5,fontWeight:600,padding:"3px 10px",borderRadius:12}}>{t}</span>
                                )) : <span style={{color:"#94a3b8",fontSize:13}}>Tous les biens</span>}
                              </div>
                            </td>

                            {/* Nb annonces + Consulter */}
                            <td style={{padding:"14px 14px",verticalAlign:"middle",whiteSpace:"nowrap"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <span style={{fontSize:20,fontWeight:800,color:count>0?"#6366f1":"#94a3b8"}}>
                                  {count!=null?count:"…"}
                                </span>
                                <Link to={buildCarteUrl(c)}
                                  style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,background:"#eef2ff",color:"#4f46e5",fontSize:12,fontWeight:700,textDecoration:"none"}}>
                                  <Search size={11}/> Consulter
                                </Link>
                              </div>
                            </td>

                            {/* Toggle accompagnement alerte + dropdown agence */}
                            <td style={{padding:"14px 14px",verticalAlign:"middle",minWidth:200}}>
                              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <label style={{position:"relative",display:"inline-block",width:40,height:22,cursor:"pointer",flexShrink:0}}>
                                    <input type="checkbox" checked={!!alerteAccom[s.id]}
                                      onChange={()=>toggleAlerteAccom(s.id)}
                                      style={{opacity:0,width:0,height:0}}/>
                                    <span style={{position:"absolute",inset:0,background:alerteAccom[s.id]?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/>
                                    <span style={{position:"absolute",width:16,height:16,background:"#fff",borderRadius:"50%",top:3,left:alerteAccom[s.id]?21:3,transition:".2s"}}/>
                                  </label>
                                  <span style={{fontSize:13,color:alerteAccom[s.id]?"#6366f1":"#94a3b8",fontWeight:600}}>
                                    {alerteAccom[s.id]?"Activé":"Désactivé"}
                                  </span>
                                </div>
                                {alerteAccom[s.id] && (
                                  <select
                                    value={alerteAgence[s.id] || ""}
                                    onChange={e => setAlerteAgenceVal(s.id, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    style={{fontSize:12,padding:"5px 8px",borderRadius:7,border:"1px solid #c7d2fe",background:"#f5f3ff",color:"#4338ca",fontFamily:"inherit",outline:"none",width:"100%"}}
                                  >
                                    <option value="">— Choisir un agent —</option>
                                    {agencesList.map(ag => (
                                      <option key={ag.id} value={ag.id}>{ag.nom || ag.email}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </td>

                            {/* Toggle email_alert */}
                            <td style={{padding:"14px 14px",verticalAlign:"middle"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <label style={{position:"relative",display:"inline-block",width:40,height:22,cursor:"pointer"}}>
                                  <input type="checkbox" checked={!!s.email_alert}
                                    onChange={()=>toggleAlerteEmail(s.id)}
                                    style={{opacity:0,width:0,height:0}}/>
                                  <span style={{position:"absolute",inset:0,background:s.email_alert?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/>
                                  <span style={{position:"absolute",width:16,height:16,background:"#fff",borderRadius:"50%",top:3,left:s.email_alert?21:3,transition:".2s"}}/>
                                </label>
                                <span style={{fontSize:13,color:s.email_alert?"#6366f1":"#94a3b8",fontWeight:600}}>
                                  {s.email_alert?"Activée":"Désactivée"}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{padding:"14px 14px",verticalAlign:"middle",whiteSpace:"nowrap"}}>
                              <div style={{display:"flex",gap:8}}>
                                <button onClick={()=>{
                                  setAlerteForm({...EMPTY_FORM,...(s.criteres||{}),nom:s.nom,email_alert:s.email_alert});
                                  setAlerteModal(s);
                                }}
                                  style={{padding:"6px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                                  Modifier
                                </button>
                                <button onClick={()=>deleteAlert(s.id)}
                                  style={{padding:"6px 12px",borderRadius:8,border:"1.5px solid #fee2e2",background:"#fff",color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
          /* ── ONGLET MES ANNONCES ── */
          <>{/* Stats */}
          <div className="db-stats">
            {[
              { icon: <Home size={20}/>,      label: "Total",       val: stats.total,    cls: "" },
              { icon: <CheckCircle size={20}/>,label: "Publiées",    val: stats.publiees, cls: "db-stat--green" },
              { icon: <Clock size={20}/>,      label: "En attente",  val: stats.attente,  cls: "db-stat--amber" },
              { icon: <TrendingUp size={20}/>, label: "Vues totales",val: stats.vues,     cls: "db-stat--blue" },
            ].map(s => (
              <div key={s.label} className={`db-stat ${s.cls}`}>
                <span className="db-stat__ico">{s.icon}</span>
                <div>
                  <p className="db-stat__val">{s.val}</p>
                  <p className="db-stat__lbl">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search bar + filtres */}
          {!loading && annonces.length > 0 && (() => {
            const govs = [...new Set(annonces.map(a => a.gouvernorat).filter(Boolean))].sort();
            const hasFilter = search || typeFilter || statusFilter || dateFilter || dateStart || dateEnd || gouvernoratFilter || prixMin || prixMax;
            const inputSt = {border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"};
            return (
              <div style={{display:"flex",flexDirection:"column",gap:10,margin:"12px 0 4px"}}>
                {/* Ligne 1 : recherche + type + statut */}
                <div className="db-toolbar">
                  <div className="db-search">
                    <Search size={15} className="db-search__ico"/>
                    <input
                      className="db-search__input"
                      type="text"
                      placeholder="Rechercher par titre, type, ville…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                      <button className="db-search__clear" onClick={() => setSearch("")} type="button">
                        <X size={13}/>
                      </button>
                    )}
                  </div>
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputSt}>
                    <option value="">Tous types</option>
                    {[
                      ["appartement",       "Appartement"],
                      ["villa_maison",      "Villa/Maison"],
                      ["immeuble",          "Immeuble"],
                      ["terrain",           "Terrain"],
                      ["local_commercial",  "Local commercial"],
                      ["bureau",            "Bureau"],
                      ["ferme_agricole",    "Ferme agricole"],
                      ["garage_parking",    "Garage / Parking"],
                      ["depot_stockage",    "Dépôt de stockage"],
                      ["immobiliers_divers","Immobiliers divers"],
                    ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputSt}>
                    <option value="">Tous statuts</option>
                    <option value="En attente">En attente</option>
                    <option value="Approuvée">Approuvée</option>
                    <option value="Refusée">Refusée</option>
                  </select>
                </div>
                {/* Ligne 2 : lieu + prix + date */}
                <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:10}}>
                  <select value={gouvernoratFilter} onChange={e => setGouvernoratFilter(e.target.value)} style={inputSt}>
                    <option value="">Tous les lieux</option>
                    {govs.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" placeholder="Prix min" value={prixMin} onChange={e => setPrixMin(e.target.value)}
                      style={{...inputSt, width:110}} title="Prix minimum"/>
                    <span style={{color:"#94a3b8",fontSize:13}}>—</span>
                    <input type="number" placeholder="Prix max" value={prixMax} onChange={e => setPrixMax(e.target.value)}
                      style={{...inputSt, width:110}} title="Prix maximum"/>
                  </div>
                  <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setDateStart(""); setDateEnd(""); }} style={inputSt}>
                    <option value="">Toutes dates</option>
                    <option value="Aujourd'hui">Aujourd'hui</option>
                    <option value="Cette semaine">Cette semaine</option>
                    <option value="Ce mois">Ce mois</option>
                  </select>
                  <input type="date" value={dateStart} onChange={e => { setDateStart(e.target.value); setDateFilter(""); }}
                    title="Date de début" style={inputSt}/>
                  <input type="date" value={dateEnd} onChange={e => { setDateEnd(e.target.value); setDateFilter(""); }}
                    title="Date de fin" style={inputSt}/>
                  {hasFilter && (
                    <button onClick={() => { setSearch(""); setTypeFilter(""); setStatusFilter(""); setDateFilter(""); setDateStart(""); setDateEnd(""); setGouvernoratFilter(""); setPrixMin(""); setPrixMax(""); }}
                      style={{border:"none",background:"#fee2e2",color:"#dc2626",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      ✕ Réinitialiser
                    </button>
                  )}
                  <span className="db-toolbar__count" style={{marginLeft:"auto"}}>
                    {filtered.length} annonce{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* List */}
          {loading ? (
            <div className="db-empty"><div className="db-spinner"/><p>Chargement…</p></div>
          ) : annonces.length === 0 ? (
            <div className="db-empty">
              <Home size={48} strokeWidth={1.2}/>
              <p>Aucune annonce publiée pour l'instant.</p>
              <PublierAnnonceBtn className="db-btn-primary"><Plus size={16}/> Créer ma première annonce</PublierAnnonceBtn>
            </div>
          ) : filtered.length === 0 ? (
            <div className="db-empty">
              <Search size={40} strokeWidth={1.2}/>
              <p>Aucune annonce ne correspond à « <strong>{search}</strong> »</p>
              <button className="db-btn-secondary" onClick={() => setSearch("")}>Effacer la recherche</button>
            </div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 6px",minWidth:900}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    <th style={TH}>Annonce</th>
                    <th style={TH}>Type / Offre</th>
                    <th style={TH}>Statut</th>
                    <th style={TH}>Prix / Superficie</th>
                    <th style={TH}>Stats</th>
                    <th style={TH}>Note</th>
                    <th style={TH}>Colocation</th>
                    <th style={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const badge = statusBadge(a.status);
                    const prop  = a.properties?.[0];
                    const rawImg = a.image_principale || prop?.image_principale || null;
                    const imgSrc = rawImg ? (rawImg.startsWith("http") ? rawImg : `${API_URL}${rawImg}`) : null;
                    const st = annonceStats[a.id] || {};
                    const dateStr = new Date(a.date_mise_a_jour || a.date_creation).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
                    return (
                      <tr key={a.id} style={{background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.06)",borderRadius:12}}>

                        {/* Annonce = image + titre + adresse + date */}
                        <td style={{...TD, minWidth:220}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:56,height:56,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#f1f5f9"}}>
                              {imgSrc
                                ? <img src={imgSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
                                : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Home size={22} style={{color:"#cbd5e1"}}/></div>
                              }
                            </div>
                            <div style={{minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:13,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:160}}>{a.titre}</div>
                              {prop?.address && <div style={{fontSize:11,color:"#94a3b8",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:160}}><MapPin size={10}/> {prop.address}</div>}
                              <div style={{fontSize:10.5,color:"#cbd5e1",marginTop:3,display:"flex",alignItems:"center",gap:3}}><Clock size={10}/> {dateStr}</div>
                            </div>
                          </div>
                        </td>

                        {/* Type + Offre côte à côte */}
                        <td style={TD}>
                          <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-start"}}>
                            <span style={{fontSize:11.5,fontWeight:700,color:"#6366f1",background:"#eef2ff",padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap"}}>{typeBienLabel(a.type_bien)}</span>
                            <span style={{fontSize:11,fontWeight:600,color:"#0369a1",background:"#e0f2fe",padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap"}}>{categorieLabel(a.categorie)}</span>
                          </div>
                        </td>

                        {/* Statut seul dans sa colonne */}
                        <td style={{...TD,textAlign:"center"}}>
                          <span className={`db-badge ${badge.cls}`} style={{display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>{badge.icon} {badge.label}</span>
                        </td>

                        {/* Prix + superficie */}
                        <td style={TD}>
                          <div style={{fontWeight:700,fontSize:13,color:"#0f172a",whiteSpace:"nowrap"}}>{a.prix ? `${Number(a.prix).toLocaleString()} ${fmtDevise(a.devise)}` : "—"}</div>
                          {a.superficie && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{a.superficie} m²</div>}
                        </td>

                        {/* Stats : vues + favoris */}
                        <td style={{...TD,textAlign:"center"}}>
                          <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
                            <span style={{fontSize:12,fontWeight:600,color:"#374151",display:"flex",alignItems:"center",gap:4}}>
                              <Eye size={12} style={{color:"#6366f1"}}/> {st.views_count ?? a.views_count ?? 0} vue{(st.views_count ?? a.views_count ?? 0)!==1?"s":""}
                            </span>
                            <span style={{fontSize:12,fontWeight:600,color:"#374151",display:"flex",alignItems:"center",gap:4}}>
                              <span style={{fontSize:12}}>♥</span> {st.favoris_count ?? 0} favori{(st.favoris_count??0)!==1?"s":""}
                            </span>
                          </div>
                        </td>

                        {/* Note globale */}
                        <td style={{...TD,textAlign:"center"}}>
                          {(st.rating_count ?? 0) > 0 ? (
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                              <div style={{display:"flex",gap:1}}>
                                {[1,2,3,4,5].map(s=><span key={s} style={{fontSize:11,opacity:s<=Math.round(st.rating_avg||0)?1:0.2}}>⭐</span>)}
                              </div>
                              <span style={{fontSize:11,color:"#6366f1",fontWeight:700}}>{(st.rating_avg||0).toFixed(1)}</span>
                              <span style={{fontSize:10,color:"#94a3b8"}}>{st.rating_count} avis</span>
                            </div>
                          ) : (
                            <span style={{fontSize:11,color:"#cbd5e1"}}>—</span>
                          )}
                        </td>

                        {/* Colocation */}
                        <td style={{...TD,textAlign:"center"}}>
                          {a.colocation && a.places_totales != null ? (
                            <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
                              <span style={{fontSize:10.5,fontWeight:700,color:"#4338ca"}}>Places occupées</span>
                              <div style={{display:"flex",alignItems:"center",gap:4}}>
                                <button onClick={async()=>{
                                  const val=Math.max(0,(a.places_occupees||0)-1);
                                  const res=await fetch(`${API_URL}/annonces/${a.id}/colocation`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({places_occupees:val})});
                                  if(res.ok)setAnnonces(prev=>prev.map(x=>x.id===a.id?{...x,places_occupees:val}:x));
                                }} style={{width:20,height:20,borderRadius:5,border:"1px solid #a5b4fc",background:"#fff",cursor:"pointer",fontWeight:800,fontSize:13,color:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                                <span style={{fontSize:12,fontWeight:700,color:"#0f172a",minWidth:32,textAlign:"center"}}>{a.places_occupees||0}/{a.places_totales}</span>
                                <button onClick={async()=>{
                                  const val=Math.min(a.places_totales,(a.places_occupees||0)+1);
                                  const res=await fetch(`${API_URL}/annonces/${a.id}/colocation`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({places_occupees:val})});
                                  if(res.ok)setAnnonces(prev=>prev.map(x=>x.id===a.id?{...x,places_occupees:val}:x));
                                }} style={{width:20,height:20,borderRadius:5,border:"1px solid #a5b4fc",background:"#fff",cursor:"pointer",fontWeight:800,fontSize:13,color:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                              </div>
                              <div style={{height:4,width:60,background:"#e2e8f0",borderRadius:99,overflow:"hidden"}}>
                                <div style={{height:"100%",background:"#6366f1",width:`${Math.round(((a.places_occupees||0)/a.places_totales)*100)}%`}}/>
                              </div>
                            </div>
                          ) : <span style={{fontSize:11,color:"#cbd5e1"}}>—</span>}
                        </td>

                        {/* Actions */}
                        <td style={{...TD,whiteSpace:"nowrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                            <Link to={`/annonce/${a.id}`} className="db-action db-action--view" title="Voir"><Eye size={14}/></Link>
                            <Link to={`/modifier_annonce/${a.id}`} className="db-action db-action--edit" title="Modifier"><Edit2 size={14}/></Link>
                            <button
                              onClick={() => handleRefresh(a.id)}
                              disabled={refreshingId === a.id}
                              title="Remonter en tête de liste"
                              style={{padding:"5px 9px",borderRadius:7,border:"1.5px solid #a5b4fc",background:"#eef2ff",color:"#4338ca",fontSize:11,fontWeight:700,cursor:refreshingId===a.id?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:4,opacity:refreshingId===a.id?0.6:1,fontFamily:"inherit"}}
                            >
                              <RefreshCw size={11} style={{animation:refreshingId===a.id?"spin 1s linear infinite":"none"}}/> Refresh
                            </button>
                            {a.spotlight_active ? (
                              <span title={`Spotlight actif jusqu'au ${a.spotlight_expires_at ? new Date(a.spotlight_expires_at).toLocaleDateString("fr-FR") : "?"}`}
                                style={{padding:"5px 9px",borderRadius:7,border:"1.5px solid #fb923c",background:"#fff7ed",color:"#ea580c",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                                ⭐ Spotlight
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSpotlight(a.id)}
                                disabled={spotlightingId === a.id}
                                title="Activer le Spotlight (badge ⭐ sur la carte et les résultats, 7 jours)"
                                style={{padding:"5px 9px",borderRadius:7,border:"1.5px solid #fdba74",background:"#fff7ed",color:"#c2410c",fontSize:11,fontWeight:700,cursor:spotlightingId===a.id?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:4,opacity:spotlightingId===a.id?0.6:1,fontFamily:"inherit"}}
                              >
                                ⭐ Spotlight
                              </button>
                            )}
                            {/* Accompagnement switch compact */}
                            <div style={{display:"flex",flexDirection:"column",gap:3}}>
                              <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:10.5,fontWeight:600,color:a.accompagnement?"#6366f1":"#94a3b8"}}>
                                <label style={{position:"relative",display:"inline-block",width:28,height:16,flexShrink:0}}>
                                  <input type="checkbox" checked={!!a.accompagnement} onChange={()=>updateAnnonceAccompagnement(a.id,!a.accompagnement)} style={{opacity:0,width:0,height:0}}/>
                                  <span style={{position:"absolute",inset:0,background:a.accompagnement?"#6366f1":"#e5e7eb",borderRadius:16,transition:".2s"}}/>
                                  <span style={{position:"absolute",width:11,height:11,background:"#fff",borderRadius:"50%",top:2.5,left:a.accompagnement?15:2.5,transition:".2s"}}/>
                                </label>
                                Accomp.
                              </label>
                              {a.accompagnement && (
                                <select disabled={!a.accompagnement} value={a.accompagnement_agence_id||""} onChange={e=>updateAnnonceAccompagnement(a.id,true,e.target.value?parseInt(e.target.value):null)}
                                  style={{fontSize:10.5,padding:"2px 5px",borderRadius:5,border:"1px solid #c7d2fe",background:"#f5f3ff",color:"#4338ca",fontFamily:"inherit",outline:"none",maxWidth:110}}>
                                  <option value="">— Agent —</option>
                                  {agencesList.map(ag=><option key={ag.id} value={ag.id}>{ag.nom||ag.email}</option>)}
                                </select>
                              )}
                            </div>
                            <button
                              onClick={()=>{const label=a.categorie==="vente"?"vendu":"loué";setSoldConfirm({id:a.id,label,titre:a.titre});}}
                              style={{padding:"5px 9px",borderRadius:7,border:"1.5px solid #fbbf24",background:"#fffbeb",color:"#92400e",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}
                            >{a.categorie==="vente"?"Vendu ?":"Loué ?"}</button>
                            <button className="db-action db-action--del" title="Supprimer" onClick={()=>setDelItem(a)}><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </> /* fin fragment onglet annonces */
          )} {/* fin ternaire activeTab */}
        </div>{/* /db-inner */}
      </div>

      {/* Delete confirm */}
      {delItem && (
        <div className="db-modal-bg" onClick={() => setDelItem(null)}>
          <div className="db-modal db-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="db-modal__head">
              <h2>Supprimer cette annonce ?</h2>
              <button onClick={() => setDelItem(null)}><X size={20}/></button>
            </div>
            <div className="db-modal__body">
              <p style={{color:"#4b5563"}}>
                « <strong>{delItem.titre}</strong> » sera définitivement supprimée. Cette action est irréversible.
              </p>
            </div>
            <div className="db-modal__foot">
              <button className="db-modal__cancel" onClick={() => setDelItem(null)}>Annuler</button>
              <button className="db-modal__del" onClick={() => handleDelete(delItem.id)}>
                <Trash2 size={15}/> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {soldConfirm && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:9999,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}>
          <div style={{
            background:"#fff", borderRadius:16, padding:"32px 28px", maxWidth:400,
            width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,.25)", fontFamily:"'Inter',system-ui,sans-serif"
          }}>
            <div style={{fontSize:32, textAlign:"center", marginBottom:12}}>
              {soldConfirm.label === "vendu" ? "🏡" : "🔑"}
            </div>
            <h3 style={{fontSize:18, fontWeight:800, color:"#0f172a", textAlign:"center", marginBottom:8}}>
              Bien {soldConfirm.label} !
            </h3>
            <p style={{fontSize:14, color:"#64748b", textAlign:"center", marginBottom:24, lineHeight:1.6}}>
              <strong>"{soldConfirm.titre}"</strong><br/>
              En confirmant, cette annonce sera <strong>supprimée définitivement</strong>.<br/>
              Êtes-vous sûr(e) ?
            </p>
            <div style={{display:"flex", gap:12, justifyContent:"center"}}>
              <button
                onClick={() => setSoldConfirm(null)}
                style={{padding:"10px 22px", borderRadius:9, border:"1.5px solid #e5e7eb", background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer", fontSize:14, fontFamily:"inherit"}}
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const tok = localStorage.getItem("token");
                  try {
                    const res = await fetch(`${API_URL}/annonces/${soldConfirm.id}`, {
                      method:"DELETE",
                      headers: { Authorization: `Bearer ${tok}` }
                    });
                    if (!res.ok) throw new Error();
                    setAnnonces(prev => prev.filter(a => a.id !== soldConfirm.id));
                    setSoldConfirm(null);
                    toast("Annonce supprimée avec succès.");
                  } catch {
                    toast("Erreur lors de la suppression.", "error");
                    setSoldConfirm(null);
                  }
                }}
                style={{padding:"10px 22px", borderRadius:9, border:"none", background:"#dc2626", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"inherit"}}
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .db-page { min-height: 100vh; background: #f8fafc; font-family: 'Inter', system-ui, sans-serif; }

        .db-header { background: #fff; border-bottom: 1px solid #e5e7eb; }
        .db-header__inner {
          max-width: 1100px; margin: 0 auto; padding: 28px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .db-header__title { font-size: 24px; font-weight: 800; color: #0f172a; }
        .db-header__sub { font-size: 14px; color: #94a3b8; margin-top: 3px; }
        .db-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 20px; background: #0f172a; color: #fff;
          border-radius: 10px; font-size: 14px; font-weight: 700;
          border: none; cursor: pointer; text-decoration: none; transition: background .15s;
        }
        .db-btn-primary:hover { background: #1e293b; }
        .db-btn-boost {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 20px; background: #eef2ff; color: #6366f1;
          border-radius: 10px; font-size: 14px; font-weight: 700;
          border: 1.5px solid #c7d2fe; cursor: pointer; text-decoration: none;
          transition: all .15s;
        }
        .db-btn-boost:hover { background: #6366f1; color: #fff; border-color: #6366f1; }

        .db-inner { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
        .db-inner--wide { max-width: 100% !important; padding: 24px 32px; }

        .db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .db-stat {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
          padding: 18px 20px; display: flex; align-items: center; gap: 14px;
        }
        .db-stat__ico {
          width: 44px; height: 44px; border-radius: 10px; background: #f1f5f9;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #64748b;
        }
        .db-stat--green .db-stat__ico { background: #f0fdf4; color: #16a34a; }
        .db-stat--amber .db-stat__ico { background: #fffbeb; color: #d97706; }
        .db-stat--blue  .db-stat__ico { background: #eff6ff; color: #2563eb; }
        .db-stat__val { font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1; }
        .db-stat__lbl { font-size: 12px; color: #94a3b8; margin-top: 3px; }

        /* Toolbar */
        .db-toolbar {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .db-search {
          flex: 1; min-width: 220px;
          display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px;
          padding: 0 14px; transition: border-color .15s;
        }
        .db-search:focus-within { border-color: #6366f1; }
        .db-search__ico { color: #94a3b8; flex-shrink: 0; }
        .db-search__input {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: 13.5px; color: #0f172a; font-family: inherit;
          padding: 11px 0;
        }
        .db-search__input::placeholder { color: #b0bac5; }
        .db-search__clear {
          background: none; border: none; cursor: pointer; color: #94a3b8;
          display: flex; align-items: center; padding: 2px; border-radius: 4px;
          transition: color .15s;
        }
        .db-search__clear:hover { color: #ef4444; }
        .db-toolbar__count {
          font-size: 12.5px; font-weight: 600; color: #94a3b8;
          white-space: nowrap;
        }
        .db-btn-secondary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; background: #f1f5f9; color: #374151;
          border-radius: 9px; font-size: 13px; font-weight: 600;
          border: 1px solid #e2e8f0; cursor: pointer; transition: background .15s;
        }
        .db-btn-secondary:hover { background: #e2e8f0; }

        .db-empty {
          text-align: center; padding: 80px 20px; color: #94a3b8;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .db-spinner {
          width: 36px; height: 36px; border: 3px solid #e5e7eb;
          border-top-color: #6366f1; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .db-list { display: flex; flex-direction: column; gap: 12px; }
        .db-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
          padding: 20px 22px; display: flex; align-items: center; gap: 20px;
          transition: box-shadow .15s;
        }
        .db-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.07); }
        .db-card__left { flex: 1; min-width: 0; }
        .db-card__type-badge {
          display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .05em; color: #6366f1; background: #eef2ff;
          padding: 3px 8px; border-radius: 6px; margin-bottom: 6px;
        }
        .db-card__title { font-size: 16px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
        .db-card__meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 6px; }
        .db-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px;
        }
        .db-badge--ok   { background: #f0fdf4; color: #15803d; }
        .db-badge--warn { background: #fffbeb; color: #b45309; }
        .db-badge--err  { background: #fef2f2; color: #b91c1c; }
        .db-card__cat { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; }
        .db-card__loc { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 3px; }

        .db-card__center { min-width: 140px; text-align: right; }
        .db-card__prix { font-size: 17px; font-weight: 800; color: #0f172a; }
        .db-card__sup { font-size: 13px; color: #64748b; margin-top: 2px; }
        .db-card__date { font-size: 12px; color: #94a3b8; margin-top: 6px; display: flex; align-items: center; justify-content: flex-end; gap: 4px; }

        .db-card__actions { display: flex; gap: 8px; flex-shrink: 0; }
        .db-action {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; background: #fff; text-decoration: none; color: #64748b;
          transition: all .15s;
        }
        .db-action--view:hover  { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
        .db-action--edit:hover  { border-color: #f59e0b; color: #d97706; background: #fffbeb; }
        .db-action--del:hover   { border-color: #ef4444; color: #dc2626; background: #fef2f2; }

        /* Modal */
        .db-modal-bg {
          position: fixed; inset: 0; background: rgba(0,0,0,.4);
          z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .db-modal {
          background: #fff; border-radius: 16px; width: 100%; max-width: 520px;
          box-shadow: 0 20px 60px rgba(0,0,0,.2); overflow: hidden;
        }
        .db-modal--sm { max-width: 400px; }
        .db-modal__head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #e5e7eb;
        }
        .db-modal__head h2 { font-size: 17px; font-weight: 700; color: #0f172a; }
        .db-modal__head button { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; }
        .db-modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .db-modal__body label { font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px; }
        .db-modal__input, .db-modal__textarea {
          width: 100%; padding: 10px 13px; border: 1.5px solid #e2e8f0;
          border-radius: 9px; font-size: 14px; font-family: inherit;
          outline: none; color: #0f172a; box-sizing: border-box;
          transition: border-color .15s;
        }
        .db-modal__input:focus, .db-modal__textarea:focus { border-color: #6366f1; }
        .db-modal__textarea { resize: vertical; }
        .db-modal__row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .db-modal__foot {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #f8fafc;
        }
        .db-modal__cancel {
          padding: 9px 18px; border-radius: 9px; border: 1px solid #e5e7eb;
          background: #fff; color: #374151; font-size: 14px; cursor: pointer;
        }
        .db-modal__save {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 9px; border: none;
          background: #0f172a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
        }
        .db-modal__save:disabled { opacity: .6; cursor: not-allowed; }
        .db-modal__del {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 9px; border: none;
          background: #dc2626; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
        }

        @media (max-width: 768px) {
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-card { flex-direction: column; align-items: flex-start; }
          .db-card__center { text-align: left; width: 100%; }
          .db-card__date { justify-content: flex-start; }
          .db-card__actions { width: 100%; justify-content: flex-end; }
        }
        @media (max-width: 480px) {
          .db-stats { grid-template-columns: 1fr 1fr; }
          .db-header__inner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── MODAL ALERTE ── */}
      {alerteModal && (
        <AlerteFiltersModal
          form={alerteForm}
          setForm={setAlerteForm}
          onClose={()=>setAlerteModal(null)}
          onSave={saveAlerte}
          saving={alerteSaving}
          isEdit={alerteModal !== "new"}
        />
      )}
      {false && alerteModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setAlerteModal(null)}>
          <div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.25)"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid #f1f5f9"}}>
              <div>
                <h3 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:0}}>
                  {alerteModal==="new" ? "Créer une alerte" : "Modifier l'alerte"}
                </h3>
                <p style={{fontSize:12.5,color:"#94a3b8",margin:"3px 0 0"}}>Définissez vos critères de recherche</p>
              </div>
              <button onClick={()=>setAlerteModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b"}}><X size={20}/></button>
            </div>

            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:18}}>
              {/* Nom */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Nom de l'alerte *</label>
                <input type="text" value={alerteForm.nom}
                  onChange={e=>setAlerteForm(f=>({...f,nom:e.target.value}))}
                  placeholder="Ex: Appartement Tunis centre"
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
              </div>

              {/* Catégorie */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Catégorie</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[{v:"vente",l:"🏠 Achat"},{v:"location",l:"🔑 Location"},{v:"vacances",l:"☀️ Vacances"}].map(o=>(
                    <button key={o.v} type="button"
                      onClick={()=>setAlerteForm(f=>{
                        const cats=f.categories||[];
                        return {...f,categories:cats.includes(o.v)?cats.filter(c=>c!==o.v):[...cats,o.v]};
                      })}
                      style={{padding:"7px 16px",borderRadius:20,border:"1.5px solid",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                        borderColor:(alerteForm.categories||[]).includes(o.v)?"#6366f1":"#e2e8f0",
                        background:(alerteForm.categories||[]).includes(o.v)?"#eef2ff":"#f8fafc",
                        color:(alerteForm.categories||[]).includes(o.v)?"#4f46e5":"#64748b"}}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type de bien */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Type de bien</label>
                <select value={alerteForm.type||""} onChange={e=>setAlerteForm(f=>({...f,type:e.target.value}))}
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13.5,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}>
                  <option value="">Tous les types</option>
                  {[["appartement","Appartement"],["villa","Villa/Maison"],["terrain","Terrain"],["local_commercial","Local commercial"],["bureau","Bureau"],["ferme_agricole","Ferme agricole"],["immeuble","Immeuble"],["garage_parking","Garage/Parking"],["depot_stockage","Dépôt de stockage"]].map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Localisation */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Localisation</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <select value={alerteForm.govNom||""} onChange={e=>setAlerteForm(f=>({...f,govNom:e.target.value,delNom:"",locNom:""}))}
                    style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}>
                    <option value="">Tous les gouvernorats</option>
                    {gouvernorats.map(g=><option key={g.id||g.nom} value={g.nom}>{g.nom}</option>)}
                  </select>
                  <input type="text" value={alerteForm.delNom||""} onChange={e=>setAlerteForm(f=>({...f,delNom:e.target.value}))}
                    placeholder="Délégation (optionnel)"
                    style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                </div>
              </div>

              {/* Prix */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Prix (DT)</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <input type="number" value={alerteForm.prixMin||""} onChange={e=>setAlerteForm(f=>({...f,prixMin:e.target.value}))}
                    placeholder="Prix min" style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                  <input type="number" value={alerteForm.prixMax||""} onChange={e=>setAlerteForm(f=>({...f,prixMax:e.target.value}))}
                    placeholder="Prix max" style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                </div>
              </div>

              {/* Superficie */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Superficie (m²)</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <input type="number" value={alerteForm.superficieMin||""} onChange={e=>setAlerteForm(f=>({...f,superficieMin:e.target.value}))}
                    placeholder="Min m²" style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                  <input type="number" value={alerteForm.superficieMax||""} onChange={e=>setAlerteForm(f=>({...f,superficieMax:e.target.value}))}
                    placeholder="Max m²" style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                </div>
              </div>

              {/* Pièces */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Pièces min</label>
                  <select value={alerteForm.bedsMin||""} onChange={e=>setAlerteForm(f=>({...f,bedsMin:e.target.value}))}
                    style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}>
                    <option value="">Indifférent</option>
                    {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Chambres min</label>
                  <select value={alerteForm.chambresMin||""} onChange={e=>setAlerteForm(f=>({...f,chambresMin:e.target.value}))}
                    style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}>
                    <option value="">Indifférent</option>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
              </div>

              {/* État du bien */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>État du bien</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[{v:"nouveau",l:"✨ Neuf"},{v:"bon_etat",l:"👍 Bon état"},{v:"a_renover",l:"🔧 À rénover"},{v:"cours_construction",l:"🏗️ En construction"}].map(o=>(
                    <button key={o.v} type="button"
                      onClick={()=>setAlerteForm(f=>({...f,etat:f.etat===o.v?"":o.v}))}
                      style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                        borderColor:alerteForm.etat===o.v?"#6366f1":"#e2e8f0",
                        background:alerteForm.etat===o.v?"#eef2ff":"#f8fafc",
                        color:alerteForm.etat===o.v?"#4f46e5":"#64748b"}}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caractéristiques */}
              <div>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>Caractéristiques</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[
                    {k:"jardin",l:"🌿 Jardin"},{k:"terrasse",l:"🏠 Terrasse"},{k:"balcon",l:"🌅 Balcon"},
                    {k:"parking",l:"🚗 Parking"},{k:"garage",l:"🏎 Garage"},{k:"ascenseur",l:"🛗 Ascenseur"},
                    {k:"piscine",l:"🏊 Piscine"},{k:"vue_mer",l:"🌊 Vue mer"},{k:"meuble",l:"🛋 Meublé"},
                    {k:"climatisation",l:"❄️ Clim"},{k:"fibre_optique",l:"📡 Fibre"},{k:"gardien",l:"💂 Gardien"},
                  ].map(feat=>{
                    const feats = alerteForm.features||[];
                    const on = feats.includes(feat.k);
                    return (
                      <button key={feat.k} type="button"
                        onClick={()=>setAlerteForm(f=>({...f,features:on?feats.filter(x=>x!==feat.k):[...feats,feat.k]}))}
                        style={{padding:"7px 10px",borderRadius:9,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .15s",
                          borderColor:on?"#6366f1":"#e2e8f0",background:on?"#eef2ff":"#f8fafc",color:on?"#4f46e5":"#64748b"}}>
                        {feat.l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alerte email */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:12,background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                <div>
                  <p style={{fontWeight:700,color:"#0f172a",fontSize:14,margin:0}}>Notifications email</p>
                  <p style={{fontSize:12,color:"#64748b",margin:"2px 0 0"}}>Recevoir un email dès qu'une annonce correspond</p>
                </div>
                <label style={{position:"relative",display:"inline-block",width:44,height:24,cursor:"pointer",flexShrink:0}}>
                  <input type="checkbox" checked={!!alerteForm.email_alert}
                    onChange={e=>setAlerteForm(f=>({...f,email_alert:e.target.checked}))}
                    style={{opacity:0,width:0,height:0}}/>
                  <span style={{position:"absolute",inset:0,background:alerteForm.email_alert?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/>
                  <span style={{position:"absolute",width:18,height:18,background:"#fff",borderRadius:"50%",top:3,left:alerteForm.email_alert?23:3,transition:".2s"}}/>
                </label>
              </div>

              {/* Boutons */}
              <div style={{display:"flex",gap:10,paddingTop:4}}>
                <button onClick={()=>setAlerteModal(null)}
                  style={{flex:1,padding:"11px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#374151",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  Annuler
                </button>
                <button onClick={saveAlerte} disabled={alerteSaving||!alerteForm.nom.trim()}
                  style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:(alerteSaving||!alerteForm.nom.trim())?0.6:1}}>
                  {alerteSaving?"Enregistrement…":"💾 Enregistrer l'alerte"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}{/* end false block */}

    </>
  );
}
