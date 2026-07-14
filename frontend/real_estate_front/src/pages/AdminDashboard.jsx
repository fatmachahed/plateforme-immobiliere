import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL, { fmtDevise } from "../config";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import { useToast } from "../components/Toast";
import { setFeatureFlagsCache } from "../hooks/useFeatureFlags";
import AnnonceDetailModal from "./AnnonceDetailModal";
import {
  LayoutDashboard, FileText, Users, CheckCircle, XCircle, Clock,
  Eye, Trash2, RefreshCw, Home, BarChart3, X, Check, Building, Plus,
  CreditCard, ShieldCheck, ShieldOff, Mail, Phone,
  DollarSign, Activity, Filter, Calendar, Edit3, Pencil, Search,
  TrendingUp, MapPin, Sparkles, Handshake, Lock, Unlock,
  Settings, Save, AlertTriangle, ShieldAlert, Layers,
} from "lucide-react";


function StatusBadge({ status }) {
  const map = {
    approuvee:  { label:"Approuvée",  cls:"adm-badge--ok"   },
    en_attente: { label:"En attente", cls:"adm-badge--warn" },
    refusee:    { label:"Refusée",    cls:"adm-badge--err"  },
  };
  const m = map[status] || { label: status, cls:"" };
  return <span className={`adm-badge ${m.cls}`}>{m.label}</span>;
}

function TypeBienFr(t) {
  const m = { appartement:"Appartement", villa:"Villa/Maison", villa_maison:"Villa/Maison", maison:"Villa/Maison",
    terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole",
    immeuble:"Immeuble", garage_parking:"Garage/Parking", immobiliers_divers:"Immobiliers divers" };
  return m[t] || t;
}

function CatFr(c) {
  return { vente:"Achat", location:"Location", vacances:"Vacances" }[c] || c;
}


export default function AdminDashboard() {
  const [tab,          setTab]         = useState("annonces");

  /* ── Quotas annonces par rôle (stockés en localStorage) ── */
  const DEFAULT_QUOTAS = { particulier: 3, agence: 50, promoteur: 30, partenaire: 50, admin: 999 };
  const [quotas, setQuotas] = useState(() => {
    try { return { ...DEFAULT_QUOTAS, ...JSON.parse(localStorage.getItem("lz_quotas") || "{}") }; }
    catch { return DEFAULT_QUOTAS; }
  });
  const [quotasSaved, setQuotasSaved] = useState(false);
  /* Feature flags "Boost" et "Lieux" — stockés côté backend (table settings), pas
     en localStorage, pour que la valeur soit identique sur tous les appareils
     connectés avec le même compte admin. */
  const [boostEnabled, setBoostEnabled] = useState(true);
  const [poiEnabled,   setPoiEnabled]   = useState(true);
  const [regionRequiredForPins, setRegionRequiredForPins] = useState(false);
  useEffect(() => {
    fetch(`${API_URL}/admin/feature-flags`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (typeof data.boost_enabled === "boolean") setBoostEnabled(data.boost_enabled);
        if (typeof data.poi_enabled   === "boolean") setPoiEnabled(data.poi_enabled);
        if (typeof data.require_region_to_show_map_pins === "boolean") setRegionRequiredForPins(data.require_region_to_show_map_pins);
      })
      .catch(() => {});
  }, []);

  async function toggleFeatureFlag(key, next, setter) {
    setter(next); // optimiste
    try {
      const res = await authFetch("/admin/feature-flags", {
        method: "PUT",
        body: JSON.stringify({ [key]: next }),
      });
      if (!res.ok) throw new Error();
      setFeatureFlagsCache({ [key]: next });
    } catch {
      setter(!next); // rollback si échec
      toast("Erreur lors de la mise à jour.", "error");
    }
  }

  /* ── Plans config ── */
  const _DEFAULT_PLANS_CONFIG = {
    particulier: { gratuit: true, essentiel: true, investisseur: true },
    agent:       { gratuit: true, starter: true, pro: true, expert: true },
    agence:      { gratuit: true, start: true, pro: true, power: true },
    promoteur:   { "gratuit-promo": true, basic: true, standard: true, premium: true },
    partenaire:  { smart: true, bronze: true, silver: true, gold: true },
  };
  const _PLANS_META = {
    particulier: { label:"Particuliers",             color:"#6366f1", plans:[
      {id:"gratuit",      name:"Gratuit"},
      {id:"essentiel",    name:"Essentiel"},
      {id:"investisseur", name:"Investisseur"},
    ]},
    agent: { label:"Agents indépendants", color:"#0ea5e9", plans:[
      {id:"gratuit",  name:"Gratuit"},
      {id:"starter",  name:"Starter"},
      {id:"pro",      name:"Pro"},
      {id:"expert",   name:"Expert"},
    ]},
    agence: { label:"Agences", color:"#10b981", plans:[
      {id:"gratuit", name:"Gratuit"},
      {id:"start",   name:"Agency Start"},
      {id:"pro",     name:"Agency Pro"},
      {id:"power",   name:"Agency Power"},
    ]},
    promoteur: { label:"Promoteurs", color:"#f59e0b", plans:[
      {id:"gratuit-promo", name:"Gratuit"},
      {id:"basic",         name:"Basic"},
      {id:"standard",      name:"Standard"},
      {id:"premium",       name:"Premium"},
    ]},
    partenaire: { label:"Partenaires/Prestataires", color:"#8b5cf6", plans:[
      {id:"smart",  name:"Smart Partner"},
      {id:"bronze", name:"Bronze Partner"},
      {id:"silver", name:"Silver Partner"},
      {id:"gold",   name:"Gold Partner"},
    ]},
  };
  const [plansConfig, setPlansConfig] = useState(_DEFAULT_PLANS_CONFIG);
  const [plansSaved, setPlansSaved] = useState(false);
  const [plansLoaded, setPlansLoaded] = useState(false);

  const saveQuotas = (next) => {
    setQuotas(next);
    localStorage.setItem("lz_quotas", JSON.stringify(next));
    setQuotasSaved(true);
    setTimeout(() => setQuotasSaved(false), 2000);
  };
  const [stats,        setStats]       = useState(null);
  const [annonces,     setAnnonces]    = useState([]);
  const [allAnnonces,  setAllAnnonces] = useState([]);
  const [users,        setUsers]       = useState([]);
  const [userEditModal,setUserEditModal]= useState(null);
  const [userEditForm, setUserEditForm] = useState({username:"",email:"",phone_number:"",role:""});
  const [userSearchNom,  setUserSearchNom]  = useState("");
  const [userSearchEmail,setUserSearchEmail]= useState("");
  const [userSearchPhone,setUserSearchPhone]= useState("");
  const [userFilterRole, setUserFilterRole] = useState("");
  const [userSortAnnonces,setUserSortAnnonces]= useState(""); // "" | "asc" | "desc"
  const [filter,       setFilter]      = useState("en_attente");
  const [loading,      setLoading]     = useState(true);
  /* filtres annonces */
  const [aSearch,      setASearch]     = useState("");
  const [aFiltreType,  setAFiltreType] = useState("");
  const [aFiltreGov,   setAFiltreGov]  = useState("");
  const [aPrixMin,     setAPrixMin]    = useState("");
  const [aPrixMax,     setAPrixMax]    = useState("");
  const [aDateFrom,    setADateFrom]   = useState("");
  const [aDateTo,      setADateTo]     = useState("");
  /* filtres accompagnements */
  const [accomSearchTitre, setAccomSearchTitre] = useState("");
  const [accomSearchUser,  setAccomSearchUser]  = useState("");
  const [accomFilterType,  setAccomFilterType]  = useState("");
  /* filtres mandats */
  const [mandatSearchTitre, setMandatSearchTitre] = useState("");
  const [mandatSearchUser,  setMandatSearchUser]  = useState("");
  /* filtres conventions (convFilterName + convFilterType déjà existants) */

  const [modal,        setModal]       = useState(null);
  const [rejectMsg,    setRejectMsg]   = useState("");
  const [rejectRaisons,       setRejectRaisons]       = useState([]);
  const [rejectCausesCustom,  setRejectCausesCustom]  = useState([]); // [{id, text}]
  const [previewAnnonce, setPreviewAnnonce] = useState(null);

  /* Agences state */
  const [agencies,      setAgencies]       = useState([]);
  const [agencySearch,  setAgencySearch]   = useState("");
  const [agencyRefEditId, setAgencyRefEditId] = useState(null);
  const [agencyRefText,   setAgencyRefText]   = useState("");
  const [annonceRefEditId, setAnnonceRefEditId] = useState(null);
  const [annonceRefText,   setAnnonceRefText]   = useState("");
  const [agencyModal,   setAgencyModal]    = useState(false);
  /* Liste unifiée des professionnels (agences + inscrits) pour accompagnements */
  const [professionals, setProfessionals]  = useState([]);

  /* Accompagnements tracking (stocké en localStorage) */
  const [accomTracking, setAccomTracking] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adm_accom_tracking")||"{}"); } catch { return {}; }
  });
  const updateAccomTracking = (id, key, val) => {
    const next = {...accomTracking, [id]: {...(accomTracking[id]||{}), [key]: val}};
    setAccomTracking(next);
    localStorage.setItem("adm_accom_tracking", JSON.stringify(next));
  };
  const TrackSwitch = ({ val, onChange }) => (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:11,fontWeight:700,color:val?"#16a34a":"#94a3b8",minWidth:22}}>{val?"Oui":"Non"}</span>
      <label style={{position:"relative",display:"inline-block",width:36,height:20,flexShrink:0,cursor:"pointer"}}>
        <input type="checkbox" checked={val} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0}}/>
        <span style={{position:"absolute",inset:0,background:val?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/>
        <span style={{position:"absolute",width:14,height:14,background:"#fff",borderRadius:"50%",top:3,left:val?19:3,transition:".2s",pointerEvents:"none"}}/>
      </label>
    </div>
  );
  const [agencyForm,    setAgencyForm]   = useState({
    nom:"", email:"", telephone:"", adresse:"",
    matricule:"", frais_mensuel:"50", username:"", password:"",
  });
  const [agencySaving,  setAgencySaving] = useState(false);
  const [agencyViewId,  setAgencyViewId] = useState(null);
  const [agencyNoteId,  setAgencyNoteId] = useState(null);
  const [agencyNoteText,setAgencyNoteText] = useState("");

  /* Conventions */
  const [conventions,      setConventions]      = useState([]);
  const [convLoading,      setConvLoading]      = useState(false);
  const [convFilterName,   setConvFilterName]   = useState("");
  const [convFilterType,   setConvFilterType]   = useState(""); // "" | "agence" | "promoteur"
  const [convDetail,       setConvDetail]       = useState(null); // convention sélectionnée pour le modal

  /* Stats / filter state */
  const [freqPeriod, setFreqPeriod] = useState("month");
  const [freqFrom,   setFreqFrom]   = useState("");
  const [freqTo,     setFreqTo]     = useState("");
  const [zoneFilter, setZoneFilter] = useState({ gouvernorat:"", delegation:"", localite:"" });

  const navigate = useNavigate();
  const toast    = useToast();
  const token    = localStorage.getItem("token");
  const user     = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    if (!token || user?.role !== "admin") { navigate("/login"); return; }
    loadAll();
  }, []);

  useEffect(() => {
    if (tab === "annonces") loadAnnonces();
    if (tab === "users")    loadUsers();
    if (tab === "stats")    { if (allAnnonces.length === 0) loadAllAnnonces(); }
    if (tab === "agences")        { loadAgencies(); if (allAnnonces.length === 0) loadAllAnnonces(); }
    if (tab === "accompagnements"){ loadAllAnnonces(); if (users.length === 0) loadUsers(); if (agencies.length === 0) loadAgencies(); loadProfessionals(); }
    if (tab === "conventions") loadConventions();
    if (tab === "parametres" && !plansLoaded) loadPlansConfig();
  }, [tab, filter]);

  async function loadPlansConfig() {
    try {
      const r = await authFetch("/admin/plans-config");
      const d = await r.json();
      setPlansConfig(d);
      setPlansLoaded(true);
    } catch {}
  }

  async function savePlansConfig() {
    try {
      await authFetch("/admin/plans-config", { method:"PUT", body: JSON.stringify(plansConfig) });
      setPlansSaved(true);
      setTimeout(() => setPlansSaved(false), 2500);
    } catch {}
  }

  function togglePlan(segment, planId) {
    setPlansConfig(prev => ({
      ...prev,
      [segment]: { ...prev[segment], [planId]: !prev[segment][planId] },
    }));
  }

  async function authFetch(url, opts = {}) {
    const res = await fetch(`${API_URL}${url}`, {
      ...opts,
      headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json", ...(opts.headers||{}) },
    });
    if (res.status === 401) { navigate("/login?session=expired"); throw new Error("401"); }
    return res;
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadStats(), loadAnnonces()]);
    setLoading(false);
  }

  async function loadStats() {
    try {
      const res = await authFetch("/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function loadAnnonces() {
    try {
      const url = filter ? `/admin/annonces?status=${filter}&limit=100` : "/admin/annonces?limit=100";
      const res = await authFetch(url);
      if (res.ok) setAnnonces(await res.json());
    } catch {}
  }

  async function loadAllAnnonces() {
    try {
      const res = await authFetch("/admin/annonces?limit=2000");
      if (res.ok) setAllAnnonces(await res.json());
    } catch {}
  }

  async function loadUsers() {
    try {
      const res = await authFetch("/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch {}
  }

  async function blockUser(id) {
    try {
      const res = await authFetch(`/admin/users/${id}/block`, { method:"PUT" });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id===id ? {...u, is_blocked: data.is_blocked} : u));
        toast(data.is_blocked ? "Compte bloqué." : "Compte débloqué.");
      }
    } catch {}
  }

  async function deleteUser(id, username) {
    if (!window.confirm(`Supprimer définitivement le compte « ${username} » et toutes ses annonces ?`)) return;
    try {
      const res = await authFetch(`/admin/users/${id}`, { method:"DELETE" });
      if (res.ok) { setUsers(prev => prev.filter(u => u.id!==id)); toast("Compte supprimé."); }
    } catch {}
  }

  async function saveUserEdit() {
    if (!userEditModal) return;
    try {
      const payload = {
        username: userEditForm.username,
        email:    userEditForm.email,
        phone_number: userEditForm.phone_number,
        role:     userEditForm.role,
      };
      if (userEditModal.role === "partenaire") {
        payload.note_prestataire     = userEditForm.note_prestataire === "" ? null : Number(userEditForm.note_prestataire);
        payload.nombre_interventions = userEditForm.nombre_interventions === "" ? null : parseInt(userEditForm.nombre_interventions, 10);
      }
      const res = await authFetch(`/admin/users/${userEditModal.id}`, {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id===data.id ? {...u, ...data} : u));
        toast("Compte modifié."); setUserEditModal(null);
      } else { toast("Erreur lors de la modification.","error"); }
    } catch {}
  }

  async function loadAgencies() {
    try {
      const res = await authFetch("/admin/agencies");
      if (res.ok) setAgencies(await res.json());
      else setAgencies([]);
    } catch { setAgencies([]); }
  }

  async function loadProfessionals() {
    try {
      const res = await fetch(`${API_URL}/users/agencies/public`);
      if (res.ok) setProfessionals(await res.json());
    } catch {}
  }

  async function loadConventions() {
    setConvLoading(true);
    try {
      const res = await authFetch("/admin/conventions");
      if (res.ok) setConventions(await res.json());
    } catch {}
    finally { setConvLoading(false); }
  }

  async function updateConventionStatus(id, status) {
    try {
      const res = await authFetch(`/admin/conventions/${id}/status`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setConventions(prev => prev.map(c => c.id === id ? { ...c, status } : c));
        toast(`Statut mis à jour : ${status}`);
      }
    } catch {}
  }

  async function createAgency() {
    if (!agencyForm.nom || !agencyForm.email || !agencyForm.username || !agencyForm.password) {
      toast("Remplissez les champs obligatoires.", "error"); return;
    }
    setAgencySaving(true);
    try {
      const res = await authFetch("/admin/agencies", {
        method: "POST",
        body: JSON.stringify({ ...agencyForm, role:"agence" }),
      });
      if (res.ok) {
        toast("Compte agence créé avec succès !");
        setAgencyModal(false);
        setAgencyForm({ nom:"", email:"", telephone:"", adresse:"", matricule:"", frais_mensuel:"50", username:"", password:"" });
        loadAgencies();
      } else {
        const err = await res.json();
        toast(err.detail || "Erreur lors de la création.", "error");
      }
    } catch { toast("Erreur réseau.", "error"); }
    finally { setAgencySaving(false); }
  }

  async function toggleAgencyStatus(id, active) {
    try {
      const res = await authFetch(`/admin/agencies/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ abonnement_actif: !active }),
      });
      if (res.ok) {
        setAgencies(prev => prev.map(a => a.id === id ? { ...a, abonnement_actif: !active } : a));
        toast(!active ? "Abonnement activé." : "Abonnement suspendu.");
      }
    } catch {}
  }

  async function saveAgencyReference(id, ref) {
    try {
      const res = await authFetch(`/admin/agencies/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ reference: ref }),
      });
      if (res.ok) {
        const data = await res.json();
        setAgencies(prev => prev.map(a => a.id === id ? { ...a, reference: data.reference } : a));
        setAgencyRefEditId(null);
        toast("Référence mise à jour.");
      } else {
        const err = await res.json().catch(()=>({}));
        toast(err.detail || "Erreur lors de la mise à jour.", "error");
      }
    } catch { toast("Erreur réseau.", "error"); }
  }

  async function saveAnnonceReference(id, ref) {
    try {
      const res = await authFetch(`/admin/annonces/${id}/reference`, {
        method: "PATCH",
        body: JSON.stringify({ reference: ref }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnonces(prev => prev.map(a => a.id === id ? { ...a, reference: data.reference } : a));
        setAnnonceRefEditId(null);
        toast("Référence mise à jour.");
      } else {
        const err = await res.json().catch(()=>({}));
        toast(err.detail || "Erreur lors de la mise à jour.", "error");
      }
    } catch { toast("Erreur réseau.", "error"); }
  }

  async function saveAgencyNote(id) {
    try {
      const res = await authFetch(`/admin/agencies/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_admin: agencyNoteText }),
      });
      if (res.ok) {
        setAgencies(prev => prev.map(a => a.id === id ? { ...a, note_admin: agencyNoteText } : a));
        setAgencyNoteId(null);
        toast("Note enregistrée.");
      }
    } catch { toast("Erreur.", "error"); }
  }

  async function updateStatus(id, status, message = null, raisons = []) {
    try {
      const res = await authFetch(`/admin/annonces/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, message, raisons }),
      });
      if (!res.ok) throw new Error();
      setAnnonces(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (previewAnnonce?.id === id) setPreviewAnnonce(p => p ? { ...p, status } : p);
      toast(status === "approuvee" ? "Annonce approuvée !" : "Annonce refusée.");
      setModal(null); setRejectMsg(""); setRejectRaisons([]); setRejectCausesCustom([]);
      loadStats();
    } catch { toast("Erreur lors de la mise à jour.", "error"); }
  }

  function openPreview(a) {
    setPreviewAnnonce(a);
  }

  async function deleteAnnonce(id) {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    try {
      await authFetch(`/admin/annonces/${id}`, { method: "DELETE" });
      setAnnonces(prev => prev.filter(a => a.id !== id));
      toast("Annonce supprimée.");
      loadStats();
    } catch { toast("Erreur.", "error"); }
  }

  /* ── Computed data for stats tab ── */
  const zoneOptions = useMemo(() => {
    const gouvernorats = [...new Set(allAnnonces.map(a => a.gouvernorat).filter(Boolean))].sort();
    const delegations  = [...new Set(
      allAnnonces
        .filter(a => !zoneFilter.gouvernorat || a.gouvernorat === zoneFilter.gouvernorat)
        .map(a => a.delegation).filter(Boolean)
    )].sort();
    const localites = [...new Set(
      allAnnonces
        .filter(a => !zoneFilter.gouvernorat || a.gouvernorat === zoneFilter.gouvernorat)
        .filter(a => !zoneFilter.delegation  || a.delegation  === zoneFilter.delegation)
        .map(a => a.localite).filter(Boolean)
    )].sort();
    return { gouvernorats, delegations, localites };
  }, [allAnnonces, zoneFilter.gouvernorat, zoneFilter.delegation]);

  const filteredForStats = useMemo(() => {
    const from = freqFrom ? new Date(freqFrom) : null;
    const to   = freqTo   ? new Date(freqTo + "T23:59:59") : null;
    return allAnnonces.filter(a => {
      if (zoneFilter.gouvernorat && a.gouvernorat !== zoneFilter.gouvernorat) return false;
      if (zoneFilter.delegation  && a.delegation  !== zoneFilter.delegation)  return false;
      if (zoneFilter.localite    && a.localite    !== zoneFilter.localite)    return false;
      const d = new Date(a.date_creation);
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  }, [allAnnonces, zoneFilter, freqFrom, freqTo]);

  const freqData = useMemo(() => {
    const buckets = {};
    filteredForStats.forEach(a => {
      const d = new Date(a.date_creation);
      let key;
      if (freqPeriod === "day")        key = d.toLocaleDateString("fr-FR");
      else if (freqPeriod === "year")  key = `${d.getFullYear()}`;
      else key = d.toLocaleDateString("fr-FR", { month:"short", year:"numeric" });
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets).map(([label, count]) => ({ label, count })).slice(-20);
  }, [filteredForStats, freqPeriod]);

  const statsComputed = useMemo(() => {
    const venteAnnonces = filteredForStats.filter(a => a.categorie === "vente" && Number(a.prix) > 0);
    const venteWithSurf = venteAnnonces.filter(a => Number(a.superficie) > 0);

    const avgPrice  = venteAnnonces.length > 0
      ? venteAnnonces.reduce((s, a) => s + Number(a.prix), 0) / venteAnnonces.length : 0;
    const avgPrixM2 = venteWithSurf.length > 0
      ? venteWithSurf.reduce((s, a) => s + Number(a.prix) / Number(a.superficie), 0) / venteWithSurf.length : 0;

    const byStatus = {};
    filteredForStats.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

    const byType = {};
    filteredForStats.forEach(a => { if (a.type_bien) byType[a.type_bien] = (byType[a.type_bien] || 0) + 1; });

    const byCat = {};
    filteredForStats.forEach(a => { if (a.categorie) byCat[a.categorie] = (byCat[a.categorie] || 0) + 1; });

    const byGovRaw = {};
    filteredForStats.forEach(a => {
      const g = a.gouvernorat || "Inconnu";
      if (!byGovRaw[g]) byGovRaw[g] = { count:0, prixSum:0, prixCount:0, m2Sum:0, m2Count:0 };
      byGovRaw[g].count++;
      if (a.categorie === "vente" && Number(a.prix) > 0) {
        byGovRaw[g].prixSum  += Number(a.prix);
        byGovRaw[g].prixCount++;
        if (Number(a.superficie) > 0) {
          byGovRaw[g].m2Sum   += Number(a.prix) / Number(a.superficie);
          byGovRaw[g].m2Count++;
        }
      }
    });

    const govTable = Object.entries(byGovRaw)
      .map(([nom, d]) => ({
        nom,
        count:   d.count,
        avgPrix: d.prixCount > 0 ? d.prixSum / d.prixCount : null,
        avgM2:   d.m2Count   > 0 ? d.m2Sum   / d.m2Count   : null,
      }))
      .sort((a, b) => b.count - a.count);

    const activeZones = new Set(filteredForStats.map(a => a.gouvernorat).filter(Boolean)).size;

    return {
      total: filteredForStats.length, byStatus, byType, byCat,
      govTable, avgPrice, avgPrixM2, activeZones,
      venteCount: venteAnnonces.length,
    };
  }, [filteredForStats]);

  const agencyViewData = useMemo(() => {
    if (!agencyViewId) return null;
    const ag = agencies.find(a => a.id === agencyViewId);
    if (!ag) return null;
    const agAnnonces = allAnnonces.filter(a => a.utilisateur_id === ag.user_id);
    const approved   = agAnnonces.filter(a => a.status === "approuvee").length;
    const pending    = agAnnonces.filter(a => a.status === "en_attente").length;
    const vente      = agAnnonces.filter(a => a.categorie === "vente" && Number(a.prix) > 0);
    const avgPrix    = vente.length > 0 ? vente.reduce((s, a) => s + Number(a.prix), 0) / vente.length : 0;
    return { ag, agAnnonces, approved, pending, avgPrix };
  }, [agencyViewId, agencies, allAnnonces]);

  const filteredAgencies = useMemo(() => {
    const q = agencySearch.trim().toLowerCase();
    if (!q) return agencies;
    return agencies.filter(ag =>
      (ag.reference||"").toLowerCase().includes(q) ||
      (ag.nom||"").toLowerCase().includes(q) ||
      (ag.email||"").toLowerCase().includes(q)
    );
  }, [agencies, agencySearch]);

  const hasAnyFilter = zoneFilter.gouvernorat || zoneFilter.delegation || zoneFilter.localite || freqFrom || freqTo;

  const STAT_CARDS = stats ? [
    { icon:<FileText size={22}/>,    label:"Total annonces", val:stats.total_annonces, cls:"",               onClick:()=>{ setTab("annonces"); setFilter(""); } },
    { icon:<CheckCircle size={22}/>, label:"Approuvées",     val:stats.approuvees,     cls:"adm-stat--green",onClick:()=>{ setTab("annonces"); setFilter("approuvee"); } },
    { icon:<Clock size={22}/>,       label:"En attente",     val:stats.en_attente,     cls:"adm-stat--amber",onClick:()=>{ setTab("annonces"); setFilter("en_attente"); } },
    { icon:<XCircle size={22}/>,     label:"Refusées",       val:stats.refusees,       cls:"adm-stat--red",  onClick:()=>{ setTab("annonces"); setFilter("refusee"); } },
    { icon:<Users size={22}/>,       label:"Utilisateurs",   val:stats.total_users,    cls:"adm-stat--blue", onClick:()=>{ setTab("users"); } },
  ] : [];

  /* ─── Filtrage local des annonces ─── */
  const filteredAnnonces = useMemo(() => {
    return annonces.filter(a => {
      if (aSearch) {
        const q = aSearch.toLowerCase();
        if (
          !a.titre?.toLowerCase().includes(q) &&
          !a.user_name?.toLowerCase().includes(q) &&
          !a.user_email?.toLowerCase().includes(q) &&
          !a.reference?.toLowerCase().includes(q)
        ) return false;
      }
      if (aFiltreType && a.type_bien !== aFiltreType) return false;
      if (aFiltreGov  && a.gouvernorat !== aFiltreGov) return false;
      if (aPrixMin && Number(a.prix) < Number(aPrixMin)) return false;
      if (aPrixMax && Number(a.prix) > Number(aPrixMax)) return false;
      if (aDateFrom && new Date(a.date_creation) < new Date(aDateFrom)) return false;
      if (aDateTo   && new Date(a.date_creation) > new Date(aDateTo + "T23:59:59")) return false;
      return true;
    });
  }, [annonces, aSearch, aFiltreType, aFiltreGov, aPrixMin, aPrixMax, aDateFrom, aDateTo]);

  const aTypes = useMemo(() => [...new Set(annonces.map(a => a.type_bien).filter(Boolean))].sort(), [annonces]);
  const aGovs  = useMemo(() => [...new Set(annonces.map(a => a.gouvernorat).filter(Boolean))].sort(), [annonces]);

  return (
    <>
      <Navbar />
      <div className="adm-page">

        {/* Sidebar */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar__logo">
            <LayoutDashboard size={18}/> Admin
          </div>
          {[
            { id:"annonces",       icon:<FileText size={16}/>,  label:"Annonces" },
            { id:"stats",          icon:<BarChart3 size={16}/>, label:"Statistiques" },
            { id:"users",          icon:<Users size={16}/>,     label:"Utilisateurs" },
            { id:"agences",        icon:<Building size={16}/>,  label:"Agences" },
            { id:"accompagnements",icon:<Sparkles size={16}/>,  label:"Accompagnements" },
            { id:"mandats",        icon:<Handshake size={16}/>, label:"Partage des mandats" },
            { id:"conventions",    icon:<FileText  size={16}/>, label:"Conventions" },
            { id:"parametres",     icon:<Settings  size={16}/>, label:"Paramètres" },
          ].map(item => (
            <button key={item.id}
              className={`adm-nav${tab === item.id ? " adm-nav--active" : ""}`}
              onClick={() => setTab(item.id)}>
              {item.icon} {item.label}
              {item.id === "annonces" && stats?.en_attente > 0 && (
                <span className="adm-nav__badge">{stats.en_attente}</span>
              )}
            </button>
          ))}
          <div style={{flex:1}}/>
          <Link to="/" className="adm-nav" style={{marginTop:"auto"}}>
            <Home size={16}/> Retour au site
          </Link>
        </aside>

        {/* Main */}
        <main className="adm-main">
          <div className="adm-topbar">
            <h1 className="adm-topbar__title">
              {tab === "annonces" && "Gestion des annonces"}
              {tab === "stats"    && "Statistiques & Tendances"}
              {tab === "users"    && "Utilisateurs"}
              {tab === "agences"          && "Comptes Agences"}
              {tab === "accompagnements" && "Accompagnements"}
              {tab === "mandats"         && "Partage des mandats"}
              {tab === "conventions"     && "Demandes de conventions"}
              {tab === "parametres"     && "Paramètres de la plateforme"}
            </h1>
            <button className="adm-refresh" onClick={loadAll}><RefreshCw size={15}/></button>
          </div>

          {/* Global stats row — masqué sur l'onglet paramètres */}
          {stats && tab !== "parametres" && (
            <div className="adm-stats">
              {STAT_CARDS.map(s => (
                <div key={s.label} className={`adm-stat ${s.cls}`}
                  onClick={s.onClick}
                  style={{cursor:"pointer",transition:"transform .15s,box-shadow .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.1)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                  <span className="adm-stat__ico">{s.icon}</span>
                  <div>
                    <p className="adm-stat__val">{s.val}</p>
                    <p className="adm-stat__lbl">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB: Annonces ─── */}
          {tab === "annonces" && (
            <>
              <div className="adm-filters">
                {[
                  {v:"en_attente", l:"En attente"},
                  {v:"approuvee",  l:"Approuvées"},
                  {v:"refusee",    l:"Refusées"},
                  {v:"",           l:"Toutes"},
                ].map(f => (
                  <button key={f.v}
                    className={`adm-filter-btn${filter === f.v ? " adm-filter-btn--on" : ""}`}
                    onClick={() => setFilter(f.v)}>
                    {f.l}
                    {f.v === "en_attente" && stats?.en_attente > 0 && (
                      <span className="adm-filter-count">{stats.en_attente}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ─── Filtres avancés ─── */}
              <div style={{display:"flex",flexWrap:"wrap",gap:10,margin:"12px 0 4px",alignItems:"center"}}>
                <input
                  type="text" placeholder="🔍 Propriétaire / titre / référence…"
                  value={aSearch} onChange={e=>setASearch(e.target.value)}
                  style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",minWidth:200,outline:"none"}}
                />
                <select value={aFiltreType} onChange={e=>setAFiltreType(e.target.value)}
                  style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",background:"#fff",outline:"none"}}>
                  <option value="">Tous les types</option>
                  {aTypes.map(t=><option key={t} value={t}>{TypeBienFr(t)}</option>)}
                </select>
                <select value={aFiltreGov} onChange={e=>setAFiltreGov(e.target.value)}
                  style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",background:"#fff",outline:"none"}}>
                  <option value="">Tous les lieux</option>
                  {aGovs.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="number" placeholder="Prix min" value={aPrixMin} onChange={e=>setAPrixMin(e.target.value)}
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",width:110,outline:"none"}}/>
                  <span style={{color:"#94a3b8",fontSize:13}}>—</span>
                  <input type="number" placeholder="Prix max" value={aPrixMax} onChange={e=>setAPrixMax(e.target.value)}
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",width:110,outline:"none"}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="date" value={aDateFrom} onChange={e=>setADateFrom(e.target.value)}
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                  <span style={{color:"#94a3b8",fontSize:13}}>→</span>
                  <input type="date" value={aDateTo} onChange={e=>setADateTo(e.target.value)}
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                </div>
                {(aSearch||aFiltreType||aFiltreGov||aPrixMin||aPrixMax||aDateFrom||aDateTo) && (
                  <button onClick={()=>{setASearch("");setAFiltreType("");setAFiltreGov("");setAPrixMin("");setAPrixMax("");setADateFrom("");setADateTo("");}}
                    style={{border:"none",background:"#fee2e2",color:"#dc2626",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                    ✕ Réinitialiser
                  </button>
                )}
                <span style={{marginLeft:"auto",fontSize:12.5,color:"#64748b",fontWeight:500}}>
                  {filteredAnnonces.length} résultat{filteredAnnonces.length!==1?"s":""}
                </span>
              </div>
              {loading ? (
                <div className="adm-empty"><div className="adm-spinner"/></div>
              ) : filteredAnnonces.length === 0 ? (
                <div className="adm-empty"><FileText size={40}/><p>Aucune annonce dans ce filtre.</p></div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th style={{width:64}}></th>
                        <th>Annonce</th><th>Propriétaire</th><th>Type / Cat.</th>
                        <th>Lieu</th><th>Prix</th><th>Statut</th><th>Date</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnnonces.map(a => (
                        <tr key={a.id} className="adm-table__row--clickable" onClick={() => openPreview(a)}>
                          <td style={{padding:"8px 8px 8px 12px",width:64,verticalAlign:"middle"}}>
                            <img
                              src={a.image_principale ? (a.image_principale.startsWith("http") ? a.image_principale : `${import.meta.env.VITE_API_URL||""}${a.image_principale}`) : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&q=60"}
                              alt=""
                              style={{width:52,height:40,objectFit:"cover",borderRadius:6,display:"block",flexShrink:0,border:"1px solid #e5e7eb"}}
                              onError={e=>{e.target.src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&q=60";}}
                            />
                          </td>
                          <td>
                            <p className="adm-table__title">{a.titre}</p>
                            <span className="adm-table__id">#{a.id}</span>
                            {annonceRefEditId === a.id ? (
                              <span style={{marginLeft:6,display:"inline-flex",alignItems:"center",gap:4}} onClick={e=>e.stopPropagation()}>
                                <input autoFocus value={annonceRefText}
                                  onChange={e=>setAnnonceRefText(e.target.value.toUpperCase().slice(0,12))}
                                  style={{width:84,fontSize:11,fontWeight:700,fontFamily:"monospace",border:"1.5px solid #6366f1",borderRadius:4,padding:"1px 5px",outline:"none"}}/>
                                <button onClick={()=>saveAnnonceReference(a.id, annonceRefText)}
                                  style={{background:"#6366f1",border:"none",borderRadius:4,color:"#fff",cursor:"pointer",padding:"2px 5px"}}><Check size={10}/></button>
                                <button onClick={()=>setAnnonceRefEditId(null)}
                                  style={{background:"#f1f5f9",border:"none",borderRadius:4,color:"#64748b",cursor:"pointer",padding:"2px 5px"}}><X size={10}/></button>
                              </span>
                            ) : (
                              <span style={{marginLeft:6,fontSize:11,fontWeight:700,color:"#6366f1",background:"#eef2ff",borderRadius:4,padding:"1px 6px",fontFamily:"monospace",cursor:"pointer"}}
                                title="Modifier la référence"
                                onClick={e=>{e.stopPropagation();setAnnonceRefEditId(a.id);setAnnonceRefText(a.reference||"");}}>
                                {a.reference || "—"} <Edit3 size={9} style={{marginLeft:2,verticalAlign:"-1px"}}/>
                              </span>
                            )}
                          </td>
                          <td>
                            <p className="adm-table__user">{a.user_name}</p>
                            <span className="adm-table__email">{a.user_email}</span>
                          </td>
                          <td>
                            <span className="adm-pill">{TypeBienFr(a.type_bien)}</span>
                            <span className="adm-pill adm-pill--cat">{CatFr(a.categorie)}</span>
                          </td>
                          <td className="adm-table__gov">{a.gouvernorat || "—"}</td>
                          <td className="adm-table__prix">
                            {a.prix ? `${Number(a.prix).toLocaleString("fr-TN")} ${fmtDevise(a.devise)}` : "—"}
                          </td>
                          <td><StatusBadge status={a.status}/></td>
                          <td className="adm-table__date">
                            {new Date(a.date_creation).toLocaleDateString("fr-FR")}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <div className="adm-actions">
                              <button className="adm-action adm-action--view" title="Voir" onClick={e => { e.stopPropagation(); openPreview(a); }}>
                                <Eye size={14}/>
                              </button>
                              {a.status !== "approuvee" && (
                                <button className="adm-action adm-action--ok" title="Approuver"
                                  onClick={e => { e.stopPropagation(); updateStatus(a.id, "approuvee"); }}>
                                  <Check size={14}/>
                                </button>
                              )}
                              {a.status !== "refusee" && (
                                <button className="adm-action adm-action--reject" title="Refuser"
                                  onClick={e => { e.stopPropagation(); setModal({ annonce:a, action:"reject" }); }}>
                                  <X size={14}/>
                                </button>
                              )}
                              <button className="adm-action adm-action--del" title="Supprimer"
                                onClick={e => { e.stopPropagation(); deleteAnnonce(a.id); }}>
                                <Trash2 size={14}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ─── TAB: Stats ─── */}
          {tab === "stats" && (
            <div className="adm-stats-page">

              {/* Zone + Date Filters Bar */}
              <div className="adm-zone-bar">
                <div className="adm-zone-bar__icon"><Filter size={14}/></div>
                <select className="adm-zone-sel"
                  value={zoneFilter.gouvernorat}
                  onChange={e => setZoneFilter({ gouvernorat:e.target.value, delegation:"", localite:"" })}>
                  <option value="">Tous les gouvernorats</option>
                  {zoneOptions.gouvernorats.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className="adm-zone-sel"
                  value={zoneFilter.delegation}
                  disabled={!zoneFilter.gouvernorat}
                  onChange={e => setZoneFilter(p => ({ ...p, delegation:e.target.value, localite:"" }))}>
                  <option value="">Toutes les délégations</option>
                  {zoneOptions.delegations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="adm-zone-sel"
                  value={zoneFilter.localite}
                  disabled={!zoneFilter.delegation}
                  onChange={e => setZoneFilter(p => ({ ...p, localite:e.target.value }))}>
                  <option value="">Toutes les localités</option>
                  {zoneOptions.localites.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="adm-zone-bar__sep"/>
                <div className="adm-freq-range">
                  <label>Du</label>
                  <input type="date" className="adm-freq-date" value={freqFrom} onChange={e => setFreqFrom(e.target.value)}/>
                  <label>Au</label>
                  <input type="date" className="adm-freq-date" value={freqTo}   onChange={e => setFreqTo(e.target.value)}/>
                </div>
                {hasAnyFilter && (
                  <button className="adm-zone-clear"
                    onClick={() => { setZoneFilter({ gouvernorat:"", delegation:"", localite:"" }); setFreqFrom(""); setFreqTo(""); }}>
                    <X size={11}/> Réinitialiser
                  </button>
                )}
              </div>

              {/* KPI Cards Row */}
              <div className="adm-kpi-row">
                <div className="adm-kpi adm-kpi--indigo">
                  <div className="adm-kpi__ico"><BarChart3 size={20}/></div>
                  <div>
                    <div className="adm-kpi__val">{statsComputed.total.toLocaleString("fr-FR")}</div>
                    <div className="adm-kpi__lbl">Annonces (filtre actif)</div>
                  </div>
                </div>
                <div className="adm-kpi adm-kpi--green">
                  <div className="adm-kpi__ico"><CheckCircle size={20}/></div>
                  <div>
                    <div className="adm-kpi__val">{(statsComputed.byStatus?.approuvee || 0).toLocaleString("fr-FR")}</div>
                    <div className="adm-kpi__lbl">Approuvées</div>
                  </div>
                </div>
                <div className="adm-kpi adm-kpi--amber">
                  <div className="adm-kpi__ico"><Clock size={20}/></div>
                  <div>
                    <div className="adm-kpi__val">{(statsComputed.byStatus?.en_attente || 0).toLocaleString("fr-FR")}</div>
                    <div className="adm-kpi__lbl">En attente</div>
                  </div>
                </div>
                <div className="adm-kpi adm-kpi--blue">
                  <div className="adm-kpi__ico"><DollarSign size={20}/></div>
                  <div>
                    <div className="adm-kpi__val">
                      {statsComputed.avgPrice > 0
                        ? Math.round(statsComputed.avgPrice).toLocaleString("fr-TN") + " TND"
                        : "—"}
                    </div>
                    <div className="adm-kpi__lbl">Prix moyen (vente)</div>
                  </div>
                </div>
                <div className="adm-kpi adm-kpi--teal">
                  <div className="adm-kpi__ico"><Activity size={20}/></div>
                  <div>
                    <div className="adm-kpi__val">
                      {statsComputed.avgPrixM2 > 0
                        ? Math.round(statsComputed.avgPrixM2).toLocaleString("fr-TN") + " TND"
                        : "—"}
                    </div>
                    <div className="adm-kpi__lbl">Prix/m² moyen</div>
                  </div>
                </div>
                <div className="adm-kpi adm-kpi--slate">
                  <div className="adm-kpi__ico"><MapPin size={20}/></div>
                  <div>
                    <div className="adm-kpi__val">{statsComputed.activeZones}</div>
                    <div className="adm-kpi__lbl">Gouvernorats actifs</div>
                  </div>
                </div>
              </div>

              {/* Tendance chart */}
              <div className="adm-chart-card adm-freq-card">
                <div className="adm-freq-header">
                  <div>
                    <h3>Tendance de publication</h3>
                    {hasAnyFilter && (
                      <span style={{fontSize:11,color:"#6366f1",fontWeight:600}}>
                        {statsComputed.total} annonces filtrées
                      </span>
                    )}
                  </div>
                  <div className="adm-freq-controls">
                    {[{v:"day",l:"Par jour"},{v:"month",l:"Par mois"},{v:"year",l:"Par année"}].map(p => (
                      <button key={p.v}
                        className={`adm-freq-btn${freqPeriod === p.v ? " adm-freq-btn--on" : ""}`}
                        onClick={() => setFreqPeriod(p.v)}>
                        {p.l}
                      </button>
                    ))}
                  </div>
                </div>
                {freqData.length === 0 ? (
                  <p style={{color:"#94a3b8",textAlign:"center",padding:"30px 0",fontSize:13}}>
                    Aucune donnée pour cette période
                  </p>
                ) : (
                  <div className="adm-freq-chart">
                    {(() => {
                      const maxVal = Math.max(...freqData.map(d => d.count), 1);
                      return freqData.map(d => (
                        <div key={d.label} className="adm-freq-col">
                          <span className="adm-freq-val">{d.count}</span>
                          <div className="adm-freq-bar-wrap">
                            <div className="adm-freq-bar" style={{height:`${Math.round((d.count/maxVal)*100)}%`}}/>
                          </div>
                          <span className="adm-freq-lbl">{d.label}</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Distribution charts row */}
              <div className="adm-charts-row" style={{marginTop:16}}>
                <div className="adm-chart-card">
                  <h3>Par type de bien</h3>
                  {Object.entries(statsComputed.byType).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
                    const maxC = Math.max(...Object.values(statsComputed.byType), 1);
                    return (
                      <div key={type} className="adm-bar-row">
                        <span className="adm-bar-label">{TypeBienFr(type)}</span>
                        <div className="adm-bar-wrap">
                          <div className="adm-bar" style={{width:`${Math.min(100,(count/maxC)*100)}%`}}/>
                        </div>
                        <span className="adm-bar-val">{count}</span>
                      </div>
                    );
                  })}
                  {Object.keys(statsComputed.byType).length === 0 && <p className="adm-no-data">Aucune donnée</p>}
                </div>

                <div className="adm-chart-card">
                  <h3>Par catégorie</h3>
                  {[
                    {k:"vente",    c:"#4f46e5"},
                    {k:"location", c:"#16a34a"},
                    {k:"vacances", c:"#f59e0b"},
                  ].map(({k,c}) => {
                    const count = statsComputed.byCat[k] || 0;
                    const maxC  = Math.max(...Object.values(statsComputed.byCat), 1);
                    return (
                      <div key={k} className="adm-bar-row">
                        <span className="adm-bar-label" style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}/>
                          {CatFr(k)}
                        </span>
                        <div className="adm-bar-wrap">
                          <div className="adm-bar" style={{width:`${Math.min(100,(count/maxC)*100)}%`,background:c}}/>
                        </div>
                        <span className="adm-bar-val">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="adm-chart-card">
                  <h3>Par statut</h3>
                  {[
                    {k:"approuvee",  l:"Approuvées", c:"#16a34a"},
                    {k:"en_attente", l:"En attente",  c:"#d97706"},
                    {k:"refusee",    l:"Refusées",    c:"#dc2626"},
                  ].map(({k,l,c}) => {
                    const count = statsComputed.byStatus[k] || 0;
                    const maxC  = Math.max(...Object.values(statsComputed.byStatus || {approuvee:1}), 1);
                    return (
                      <div key={k} className="adm-bar-row">
                        <span className="adm-bar-label">{l}</span>
                        <div className="adm-bar-wrap">
                          <div className="adm-bar" style={{width:`${Math.min(100,(count/maxC)*100)}%`,background:c}}/>
                        </div>
                        <span className="adm-bar-val">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Zone price table */}
              {statsComputed.govTable.length > 0 && (
                <div className="adm-chart-card" style={{marginTop:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div>
                      <h3 style={{marginBottom:2}}>Analyse par gouvernorat</h3>
                      <p style={{fontSize:11,color:"#94a3b8",margin:0}}>
                        Basé sur {statsComputed.total} annonce{statsComputed.total > 1 ? "s" : ""} — prix/m² calculé sur les ventes uniquement
                      </p>
                    </div>
                    {hasAnyFilter && (
                      <span className="adm-filter-active-badge">Filtre actif</span>
                    )}
                  </div>
                  <div className="adm-zone-table-wrap">
                    <table className="adm-zone-table">
                      <thead>
                        <tr>
                          <th style={{width:36}}>#</th>
                          <th>Gouvernorat</th>
                          <th style={{textAlign:"right"}}>Annonces</th>
                          <th>Part</th>
                          <th style={{textAlign:"right"}}>Prix moyen (vente)</th>
                          <th style={{textAlign:"right"}}>Prix/m² moyen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsComputed.govTable.map((row, i) => {
                          const pct = statsComputed.total > 0
                            ? Math.round((row.count / statsComputed.total) * 100) : 0;
                          return (
                            <tr key={row.nom} className={i === 0 ? "adm-zone-tr--top" : ""}>
                              <td className="adm-zone-rank">
                                {i < 3
                                  ? <span className={`adm-zone-medal adm-zone-medal--${i+1}`}>{i+1}</span>
                                  : <span style={{color:"#cbd5e1",fontSize:11}}>#{i+1}</span>
                                }
                              </td>
                              <td className="adm-zone-nom">
                                <MapPin size={11} style={{color:"#6366f1",flexShrink:0}}/>
                                {row.nom}
                              </td>
                              <td style={{textAlign:"right",fontWeight:700,color:"#0f172a"}}>{row.count}</td>
                              <td style={{width:160}}>
                                <div className="adm-zone-pct-wrap">
                                  <div className="adm-zone-pct-bar" style={{width:`${pct}%`}}/>
                                  <span className="adm-zone-pct-lbl">{pct}%</span>
                                </div>
                              </td>
                              <td style={{textAlign:"right"}} className="adm-zone-prix">
                                {row.avgPrix
                                  ? <strong>{Math.round(row.avgPrix).toLocaleString("fr-TN")} TND</strong>
                                  : <span style={{color:"#e2e8f0"}}>—</span>}
                              </td>
                              <td style={{textAlign:"right"}} className="adm-zone-m2">
                                {row.avgM2
                                  ? <span className="adm-zone-m2-badge">
                                      {Math.round(row.avgM2).toLocaleString("fr-TN")} DT/m²
                                    </span>
                                  : <span style={{color:"#e2e8f0"}}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {allAnnonces.length === 0 && (
                <div className="adm-empty" style={{marginTop:32}}>
                  <div className="adm-spinner"/>
                  <p>Chargement des données…</p>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: Users ─── */}
          {tab === "users" && (
            <div className="adm-table-wrap">
              {(() => {
                let filtered = users
                  .filter(u => !userSearchNom  || (u.username||"").toLowerCase().includes(userSearchNom.toLowerCase()))
                  .filter(u => !userSearchEmail|| (u.email||"").toLowerCase().includes(userSearchEmail.toLowerCase()))
                  .filter(u => !userSearchPhone|| (u.phone_number||"").toLowerCase().includes(userSearchPhone.toLowerCase()))
                  .filter(u => !userFilterRole || u.role === userFilterRole);
                if (userSortAnnonces === "desc") filtered = [...filtered].sort((a,b)=>b.nb_annonces-a.nb_annonces);
                if (userSortAnnonces === "asc")  filtered = [...filtered].sort((a,b)=>a.nb_annonces-b.nb_annonces);

                const filterRow = (
                  <tr style={{background:"#f8fafc"}}>
                    <th></th>
                    <th style={{padding:"6px 8px"}}>
                      <div style={{position:"relative"}}>
                        <Search size={11} style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",pointerEvents:"none"}}/>
                        <input value={userSearchNom} onChange={e=>setUserSearchNom(e.target.value)}
                          placeholder="Nom…"
                          style={{width:"100%",padding:"5px 8px 5px 24px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
                      </div>
                    </th>
                    <th style={{padding:"6px 8px"}}>
                      <div style={{position:"relative"}}>
                        <Search size={11} style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",pointerEvents:"none"}}/>
                        <input value={userSearchEmail} onChange={e=>setUserSearchEmail(e.target.value)}
                          placeholder="Email…"
                          style={{width:"100%",padding:"5px 8px 5px 24px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
                      </div>
                    </th>
                    <th style={{padding:"6px 8px"}}>
                      <div style={{position:"relative"}}>
                        <Search size={11} style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",pointerEvents:"none"}}/>
                        <input value={userSearchPhone} onChange={e=>setUserSearchPhone(e.target.value)}
                          placeholder="Téléphone…"
                          style={{width:"100%",padding:"5px 8px 5px 24px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
                      </div>
                    </th>
                    <th style={{padding:"6px 8px"}}>
                      <select value={userFilterRole} onChange={e=>setUserFilterRole(e.target.value)}
                        style={{width:"100%",padding:"5px 6px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",background:"#fff"}}>
                        <option value="">Tous</option>
                        <option value="particulier">Particulier</option>
                        <option value="agence">Agence</option>
                        <option value="promoteur">Promoteur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </th>
                    <th style={{padding:"6px 8px"}}>
                      <select value={userSortAnnonces} onChange={e=>setUserSortAnnonces(e.target.value)}
                        style={{width:"100%",padding:"5px 6px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",background:"#fff"}}>
                        <option value="">↕</option>
                        <option value="desc">↓ Plus</option>
                        <option value="asc">↑ Moins</option>
                      </select>
                    </th>
                    <th style={{padding:"6px 8px",textAlign:"center"}}>
                      {(userSearchNom||userSearchEmail||userSearchPhone||userFilterRole||userSortAnnonces) && (
                        <button onClick={()=>{setUserSearchNom("");setUserSearchEmail("");setUserSearchPhone("");setUserFilterRole("");setUserSortAnnonces("");}}
                          title="Réinitialiser filtres"
                          style={{padding:"4px 8px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",fontSize:11,cursor:"pointer",color:"#6b7280"}}>
                          ✕
                        </button>
                      )}
                    </th>
                  </tr>
                );

                if (filtered.length === 0) return (
                  <>
                    <table className="adm-table">
                      <thead>
                        <tr><th>#</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th>
                          <th style={{cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"}} onClick={()=>setUserSortAnnonces(s=>s==="desc"?"asc":s==="asc"?"":"desc")}>
                            Annonces {userSortAnnonces==="desc"?"↓":userSortAnnonces==="asc"?"↑":"↕"}
                          </th>
                          <th>Actions</th>
                        </tr>
                        {filterRow}
                      </thead>
                    </table>
                    <div className="adm-empty"><Users size={40}/><p>Aucun utilisateur trouvé.</p></div>
                  </>
                );
                return (
                <table className="adm-table">
                  <thead>
                    <tr><th>#</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th>
                      <th style={{cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"}} onClick={()=>setUserSortAnnonces(s=>s==="desc"?"asc":s==="asc"?"":"desc")}>
                        Annonces {userSortAnnonces==="desc"?"↓":userSortAnnonces==="asc"?"↑":"↕"}
                      </th>
                      <th>Créé le</th>
                      <th>Mis à jour</th>
                      <th>Actions</th>
                    </tr>
                    {filterRow}
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} style={{opacity: u.is_blocked ? .55 : 1}}>
                        <td className="adm-table__id">#{u.id}</td>
                        <td style={{fontWeight:600,color:"#0f172a"}}>
                          {u.username}
                          {u.is_blocked && <span style={{marginLeft:6,fontSize:10,color:"#ef4444",fontWeight:700,background:"#fee2e2",padding:"1px 6px",borderRadius:4}}>Bloqué</span>}
                          {u.is_verified===false && <span style={{marginLeft:6,fontSize:10,color:"#d97706",fontWeight:700,background:"#fef3c7",padding:"1px 6px",borderRadius:4}}>Non vérifié</span>}
                        </td>
                        <td className="adm-table__email">{u.email}</td>
                        <td style={{fontSize:12.5,color:"#374151",whiteSpace:"nowrap"}}>{u.phone_number || "—"}</td>
                        <td>
                          <span className={`adm-pill ${
                            u.role==="admin"     ? "adm-pill--admin"  :
                            u.role==="agence"    ? "adm-pill--agency" :
                            u.role==="promoteur" ? "adm-pill--agency" : ""
                          }`}>{
                            u.role==="agence"    ? "Agence/Agent" :
                            u.role==="promoteur" ? "Promoteur" :
                            u.role==="particulier"? "Particulier" :
                            u.role==="admin"     ? "Admin" :
                            u.role
                          }</span>
                        </td>
                        <td style={{fontWeight:600}}>{u.nb_annonces}</td>
                        <td style={{fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>
                          {u.created_at ? (
                            <>
                              <div>{new Date(u.created_at).toLocaleDateString("fr-FR")}</div>
                              <div style={{color:"#94a3b8"}}>{new Date(u.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                            </>
                          ) : "—"}
                        </td>
                        <td style={{fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>
                          {u.updated_at ? (
                            <>
                              <div>{new Date(u.updated_at).toLocaleDateString("fr-FR")}</div>
                              <div style={{color:"#94a3b8"}}>{new Date(u.updated_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                            </>
                          ) : "—"}
                        </td>
                        <td>
                          <div style={{display:"flex",gap:5,alignItems:"center"}}>
                            {/* Modifier */}
                            <button title="Modifier" onClick={() => { setUserEditForm({username:u.username,email:u.email,phone_number:u.phone_number||"",role:u.role,note_prestataire:u.note_prestataire ?? "",nombre_interventions:u.nombre_interventions ?? ""}); setUserEditModal(u); }}
                              style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#374151"}}>
                              <Pencil size={13}/>
                            </button>
                            {/* Bloquer / Débloquer */}
                            {u.role !== "admin" && (
                              <button title={u.is_blocked ? "Débloquer" : "Bloquer"} onClick={() => blockUser(u.id)}
                                style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,borderRadius:6,border:`1px solid ${u.is_blocked?"#d1fae5":"#fee2e2"}`,background:u.is_blocked?"#f0fdf4":"#fff5f5",cursor:"pointer",color:u.is_blocked?"#16a34a":"#ef4444"}}>
                                {u.is_blocked ? <Unlock size={13}/> : <Lock size={13}/>}
                              </button>
                            )}
                            {/* Supprimer */}
                            {u.role !== "admin" && (
                              <button title="Supprimer" onClick={() => deleteUser(u.id, u.username)}
                                style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,borderRadius:6,border:"1px solid #fee2e2",background:"#fff5f5",cursor:"pointer",color:"#ef4444"}}>
                                <Trash2 size={13}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                );
              })()}
            </div>
          )}

          {/* ── Modal édition utilisateur ── */}
          {userEditModal && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
              <div style={{background:"#fff",borderRadius:14,padding:28,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Modifier l'utilisateur #{userEditModal.id}</h3>
                  <button onClick={()=>setUserEditModal(null)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18}/></button>
                </div>
                {[
                  {label:"Nom d'utilisateur", key:"username"},
                  {label:"Email", key:"email"},
                  {label:"Téléphone", key:"phone_number"},
                ].map(({label,key}) => (
                  <div key={key} style={{marginBottom:14}}>
                    <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{label}</label>
                    <input value={userEditForm[key]} onChange={e=>setUserEditForm(f=>({...f,[key]:e.target.value}))}
                      style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                  </div>
                ))}
                <div style={{marginBottom:20}}>
                  <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Rôle</label>
                  <select value={userEditForm.role} onChange={e=>setUserEditForm(f=>({...f,role:e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>
                    <option value="particulier">Particulier</option>
                    <option value="agent">Agent</option>
                    <option value="agence">Agence / Agent</option>
                    <option value="promoteur">Promoteur</option>
                    <option value="partenaire">Partenaire / Prestataire</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {userEditModal.role === "partenaire" && (
                  <div style={{marginBottom:20,padding:"14px",background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:10}}>
                    <p style={{fontSize:12,fontWeight:700,color:"#7c3aed",margin:"0 0 12px"}}>Qualification prestataire</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div>
                        <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Note /5</label>
                        <input type="number" step="0.1" min="0" max="5" value={userEditForm.note_prestataire}
                          onChange={e=>setUserEditForm(f=>({...f,note_prestataire:e.target.value}))} placeholder="ex : 4.5"
                          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Interventions</label>
                        <input type="number" min="0" value={userEditForm.nombre_interventions}
                          onChange={e=>setUserEditForm(f=>({...f,nombre_interventions:e.target.value}))} placeholder="ex : 12"
                          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                    </div>
                    <p style={{fontSize:11,color:"#a78bfa",margin:"8px 0 0",lineHeight:1.4}}>Par défaut, le nombre d'interventions est incrémenté automatiquement quand le prestataire marque une demande « réalisée ». Vous pouvez le corriger ici.</p>
                  </div>
                )}
                <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                  <button onClick={()=>setUserEditModal(null)} style={{padding:"9px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>Annuler</button>
                  <button onClick={saveUserEdit} style={{padding:"9px 18px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700}}>Enregistrer</button>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Agences ─── */}
          {tab === "agences" && (
            <div className="adm-agences">
              <div className="adm-agences__head">
                <div>
                  <h2 className="adm-agences__title">Comptes agences immobilières</h2>
                  <p className="adm-agences__sub">Créez et gérez les comptes agences avec suivi d'abonnement et notes internes</p>
                </div>
                <button className="adm-agences__create-btn" onClick={() => setAgencyModal(true)}>
                  <Plus size={15}/> Créer un compte agence
                </button>
              </div>

              <div style={{margin:"12px 0"}}>
                <input
                  type="text" placeholder="🔍 Rechercher par référence, nom ou email…"
                  value={agencySearch} onChange={e=>setAgencySearch(e.target.value)}
                  style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",minWidth:280,outline:"none"}}
                />
              </div>

              <div className="adm-agency-plan">
                <div className="adm-agency-plan__ico"><Building size={22}/></div>
                <div>
                  <div className="adm-agency-plan__name">Formule Agence Pro</div>
                  <div className="adm-agency-plan__desc">Dashboard analytics · Suivi multi-annonces · Export · Support prioritaire</div>
                </div>
                <div className="adm-agency-plan__price">50 TND<span>/mois</span></div>
                <div className="adm-agency-plan__warning">
                  <ShieldOff size={13}/> Suspension automatique en cas d'impayé
                </div>
              </div>

              {agencies.length === 0 ? (
                <div className="adm-empty"><Building size={40}/><p>Aucun compte agence créé.</p></div>
              ) : filteredAgencies.length === 0 ? (
                <div className="adm-empty"><Building size={40}/><p>Aucune agence ne correspond à cette recherche.</p></div>
              ) : (
                <div className="adm-agency-list">
                  {filteredAgencies.map(ag => (
                    <div key={ag.id} className={`adm-agency-card${ag.abonnement_actif ? "" : " adm-agency-card--suspended"}`}>
                      <div className="adm-agency-card__main">
                        <div className="adm-agency-card__left">
                          <div className="adm-agency-card__avatar">
                            {ag.nom?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{minWidth:0}}>
                            <div className="adm-agency-card__name">{ag.nom}</div>
                            <div className="adm-agency-card__meta">
                              <span><Mail size={11}/> {ag.email}</span>
                              {ag.telephone && <span><Phone size={11}/> {ag.telephone}</span>}
                              {ag.matricule && <span>Mat. {ag.matricule}</span>}
                              {agencyRefEditId === ag.id ? (
                                <span style={{display:"inline-flex",alignItems:"center",gap:4}} onClick={e=>e.stopPropagation()}>
                                  <input autoFocus value={agencyRefText}
                                    onChange={e=>setAgencyRefText(e.target.value.toUpperCase().slice(0,6))}
                                    style={{width:64,fontSize:12,fontWeight:700,fontFamily:"monospace",border:"1.5px solid #6366f1",borderRadius:4,padding:"1px 5px",outline:"none"}}/>
                                  <button onClick={()=>saveAgencyReference(ag.id, agencyRefText)}
                                    style={{background:"#6366f1",border:"none",borderRadius:4,color:"#fff",cursor:"pointer",padding:"2px 5px"}}><Check size={11}/></button>
                                  <button onClick={()=>setAgencyRefEditId(null)}
                                    style={{background:"#f1f5f9",border:"none",borderRadius:4,color:"#64748b",cursor:"pointer",padding:"2px 5px"}}><X size={11}/></button>
                                </span>
                              ) : (
                                <span style={{fontWeight:600,color:"#6366f1",background:"#eef2ff",borderRadius:4,padding:"1px 6px",fontFamily:"monospace",cursor:"pointer"}}
                                  title="Modifier la référence"
                                  onClick={e=>{e.stopPropagation();setAgencyRefEditId(ag.id);setAgencyRefText(ag.reference||"");}}>
                                  #{ag.reference || "—"} <Edit3 size={10} style={{marginLeft:2,verticalAlign:"-1px"}}/>
                                </span>
                              )}
                              {ag.created_at && (
                                <span><Calendar size={11}/> {new Date(ag.created_at).toLocaleDateString("fr-FR")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="adm-agency-card__right">
                          <div className="adm-agency-card__stats">
                            <span><Eye size={12}/> {ag.nb_annonces || 0} annonces</span>
                            <span><CreditCard size={12}/> {ag.frais_mensuel || 50} DT/mois</span>
                          </div>
                          <span className={`adm-agency-badge${ag.abonnement_actif ? " adm-agency-badge--active" : " adm-agency-badge--off"}`}>
                            {ag.abonnement_actif ? <><ShieldCheck size={12}/> Actif</> : <><ShieldOff size={12}/> Suspendu</>}
                          </span>
                          <button className="adm-agency-view-btn"
                            onClick={() => setAgencyViewId(ag.id)}>
                            <Eye size={13}/> Tableau de bord
                          </button>
                          <button
                            className={`adm-agency-toggle${ag.abonnement_actif ? " adm-agency-toggle--off" : " adm-agency-toggle--on"}`}
                            onClick={() => toggleAgencyStatus(ag.id, ag.abonnement_actif)}>
                            {ag.abonnement_actif ? <><ShieldOff size={13}/> Suspendre</> : <><ShieldCheck size={13}/> Activer</>}
                          </button>
                        </div>
                      </div>

                      {/* Admin note */}
                      <div className="adm-agency-note-row">
                        {agencyNoteId === ag.id ? (
                          <div className="adm-agency-note-edit">
                            <Edit3 size={12} style={{color:"#6366f1",flexShrink:0,marginTop:2}}/>
                            <textarea
                              className="adm-agency-note-input"
                              rows={2}
                              value={agencyNoteText}
                              onChange={e => setAgencyNoteText(e.target.value)}
                              placeholder="Note interne sur cette agence…"
                              autoFocus
                            />
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              <button className="adm-agency-note-save" onClick={() => saveAgencyNote(ag.id)}>
                                <Check size={11}/>
                              </button>
                              <button className="adm-agency-note-cancel" onClick={() => setAgencyNoteId(null)}>
                                <X size={11}/>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="adm-agency-note-btn"
                            onClick={() => { setAgencyNoteId(ag.id); setAgencyNoteText(ag.note_admin || ""); }}>
                            <Edit3 size={11} style={{flexShrink:0}}/>
                            {ag.note_admin
                              ? <span className="adm-agency-note-text">{ag.note_admin}</span>
                              : <span style={{color:"#cbd5e1",fontStyle:"italic"}}>Ajouter une note interne…</span>}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Onglet Accompagnements ── */}
          {tab === "accompagnements" && (
            <div style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
              <div style={{marginBottom:20, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap"}}>
                <div>
                  <h2 style={{fontSize:18, fontWeight:800, color:"#0f172a", margin:0}}>Suivi des demandes d'accompagnement</h2>
                  <p style={{fontSize:13, color:"#64748b", margin:"4px 0 0"}}>
                    Annonces dont les propriétaires souhaitent être accompagnés par un professionnel.
                  </p>
                </div>
                <button
                  onClick={() => toast("Modifications sauvegardées !")}
                  style={{
                    padding:"9px 18px", borderRadius:9, border:"none",
                    background:"#16a34a", color:"#fff", fontSize:13,
                    fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", gap:6, flexShrink:0
                  }}
                >
                  <Check size={14}/> Enregistrer
                </button>
              </div>
              {allAnnonces.filter(a => a.accompagnement).length > 0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14,alignItems:"center"}}>
                  <input value={accomSearchTitre} onChange={e=>setAccomSearchTitre(e.target.value)}
                    placeholder="🔍 Titre de l'annonce…"
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",outline:"none",minWidth:200}}/>
                  <input value={accomSearchUser} onChange={e=>setAccomSearchUser(e.target.value)}
                    placeholder="👤 Propriétaire…"
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",outline:"none",minWidth:180}}/>
                  <select value={accomFilterType} onChange={e=>setAccomFilterType(e.target.value)}
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",background:"#fff",outline:"none"}}>
                    <option value="">Tous types</option>
                    {[...new Set(allAnnonces.filter(a=>a.accompagnement).map(a=>a.type_bien).filter(Boolean))].sort().map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {(accomSearchTitre||accomSearchUser||accomFilterType) && (
                    <button onClick={()=>{setAccomSearchTitre("");setAccomSearchUser("");setAccomFilterType("");}}
                      style={{border:"none",background:"#fee2e2",color:"#dc2626",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      ✕ Réinitialiser
                    </button>
                  )}
                </div>
              )}
              {allAnnonces.filter(a => a.accompagnement).length === 0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
                  <Sparkles size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                  <p style={{fontWeight:700,color:"#374151",marginBottom:6,fontSize:15}}>Aucune demande d'accompagnement</p>
                  <p style={{fontSize:13,color:"#94a3b8"}}>Les annonces avec "Je souhaite être accompagné" cochée apparaîtront ici.</p>
                </div>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                        <th style={{padding:"10px 14px",width:64}}></th>
                        {["Annonce","Propriétaire","Type","Agence A","Agence B","Agence contactée","Réponse reçue","Accompagné","Remarques"].map(h => (
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allAnnonces.filter(a => a.accompagnement).filter(a => {
                        if (accomSearchTitre && !a.titre?.toLowerCase().includes(accomSearchTitre.toLowerCase())) return false;
                        if (accomSearchUser  && !(a.user_name||"").toLowerCase().includes(accomSearchUser.toLowerCase())) return false;
                        if (accomFilterType  && a.type_bien !== accomFilterType) return false;
                        return true;
                      }).map(a => {
                        const t = accomTracking[a.id] || {};
                        const u = users?.find(u => u.id === a.utilisateur_id);
                        /* Valeur affichée : tracking admin en priorité, sinon ce que l'utilisateur a choisi */
                        const agenceVal = t.agence_name !== undefined
                          ? t.agence_name
                          : (a.accompagnement_agence_nom || "");
                        return (
                          <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                            <td style={{padding:"8px 8px 8px 12px",width:64,verticalAlign:"middle"}}>
                              <img
                                src={a.image_principale ? (a.image_principale.startsWith("http") ? a.image_principale : `${import.meta.env.VITE_API_URL||""}${a.image_principale}`) : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&q=60"}
                                alt=""
                                style={{width:52,height:40,objectFit:"cover",borderRadius:6,display:"block",border:"1px solid #e5e7eb"}}
                                onError={e=>{e.target.src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&q=60";}}
                              />
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle",maxWidth:220}}>
                              <a href={`/annonce/${a.id}`} target="_blank" rel="noopener noreferrer"
                                style={{fontWeight:700,color:"#4f46e5",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block",textDecoration:"none"}}
                                title="Voir l'annonce">
                                {a.titre}
                              </a>
                              <div style={{fontSize:11,color:"#94a3b8"}}>{a.date_creation ? new Date(a.date_creation).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"}) : ""}</div>
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle",whiteSpace:"nowrap",fontSize:12,color:"#374151"}}>
                              {u?.username || a.user_name || `ID ${a.utilisateur_id}`}
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle",whiteSpace:"nowrap"}}>
                              <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#6366f1",background:"#eef2ff",padding:"3px 7px",borderRadius:6}}>
                                {(a.type_bien||"").replace(/_/g," ")}
                              </span>
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle",minWidth:200}}>
                              {/* Badge "choix utilisateur" si défini */}
                              {a.accompagnement_agence_nom && !t.agence_name && (
                                <div style={{fontSize:10,color:"#6366f1",fontWeight:700,marginBottom:4,background:"#eef2ff",padding:"2px 6px",borderRadius:4,display:"inline-block"}}>
                                  Choix client : {a.accompagnement_agence_nom}
                                </div>
                              )}
                              <select
                                value={agenceVal}
                                onChange={e => updateAccomTracking(a.id, "agence_name", e.target.value)}
                                style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:12.5,fontFamily:"inherit",background:"#f8fafc",color:"#0f172a",outline:"none",width:"100%",boxSizing:"border-box",marginTop: a.accompagnement_agence_nom && !t.agence_name ? 4 : 0}}
                              >
                                <option value="">— Peu importe —</option>
                                {professionals.length > 0
                                  ? professionals.map(p => (
                                      <option key={p.id} value={p.nom}>{p.nom} · {p.type}</option>
                                    ))
                                  : agencies.map(ag => (
                                      <option key={ag.id} value={ag.nom}>{ag.nom}</option>
                                    ))
                                }
                              </select>
                            </td>
                            {/* Agence B */}
                            <td style={{padding:"12px 14px",verticalAlign:"middle",minWidth:200}}>
                              <select
                                value={t.agence_b_name||""}
                                onChange={e => updateAccomTracking(a.id, "agence_b_name", e.target.value)}
                                style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:12.5,fontFamily:"inherit",background:"#f8fafc",color:"#0f172a",outline:"none",width:"100%",boxSizing:"border-box"}}
                              >
                                <option value="">— Aucune —</option>
                                {professionals.length > 0
                                  ? professionals.map(p => <option key={p.id} value={p.nom}>{p.nom} · {p.type}</option>)
                                  : agencies.map(ag => <option key={ag.id} value={ag.nom}>{ag.nom}</option>)
                                }
                              </select>
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                              <TrackSwitch val={!!t.agence} onChange={v=>updateAccomTracking(a.id,"agence",v)}/>
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                              <TrackSwitch val={!!t.reponse} onChange={v=>updateAccomTracking(a.id,"reponse",v)}/>
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                              <TrackSwitch val={!!t.contact} onChange={v=>updateAccomTracking(a.id,"contact",v)}/>
                            </td>
                            <td style={{padding:"12px 14px",verticalAlign:"middle",minWidth:200}}>
                              <input type="text" value={t.remarque||""} onChange={e=>updateAccomTracking(a.id,"remarque",e.target.value)}
                                placeholder="Ajouter une remarque…"
                                style={{width:"100%",padding:"6px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:12.5,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* ── Onglet Partage de mandat ── */}
          {tab === "mandats" && (
            <div style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Suivi du partage des mandats</h2>
                <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>
                  Suivi du partage des mandats entre deux agences suite à un accompagnement validé.
                </p>
              </div>
              {(() => {
                const mandats = allAnnonces.filter(a => a.accompagnement && (accomTracking[a.id]||{}).contact);
                const mandatsFiltres = mandats.filter(a => {
                  if (mandatSearchTitre && !a.titre?.toLowerCase().includes(mandatSearchTitre.toLowerCase())) return false;
                  if (mandatSearchUser  && !(a.user_name||"").toLowerCase().includes(mandatSearchUser.toLowerCase())) return false;
                  return true;
                });
                if (mandats.length === 0) return (
                  <div style={{textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
                    <Handshake size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                    <p style={{fontWeight:700,color:"#374151",marginBottom:6,fontSize:15}}>Aucun mandat partagé</p>
                    <p style={{fontSize:13,color:"#94a3b8"}}>Les mandats apparaissent ici lorsqu'un accompagnement est marqué "Accompagné".</p>
                  </div>
                );
                return (
                  <>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14,alignItems:"center"}}>
                    <input value={mandatSearchTitre} onChange={e=>setMandatSearchTitre(e.target.value)}
                      placeholder="🔍 Titre de l'annonce…"
                      style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",outline:"none",minWidth:200}}/>
                    <input value={mandatSearchUser} onChange={e=>setMandatSearchUser(e.target.value)}
                      placeholder="👤 Propriétaire…"
                      style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",outline:"none",minWidth:180}}/>
                    {(mandatSearchTitre||mandatSearchUser) && (
                      <button onClick={()=>{setMandatSearchTitre("");setMandatSearchUser("");}}
                        style={{border:"none",background:"#fee2e2",color:"#dc2626",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                        ✕ Réinitialiser
                      </button>
                    )}
                    <span style={{marginLeft:"auto",fontSize:12.5,color:"#64748b",fontWeight:500}}>
                      {mandatsFiltres.length} résultat{mandatsFiltres.length!==1?"s":""}
                    </span>
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                          {["Annonce","Propriétaire","Agence A","Agence B","Commission (%)","Statut"].map(h=>(
                            <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mandatsFiltres.map(a => {
                          const t = accomTracking[a.id] || {};
                          const u = users?.find(u => u.id === a.utilisateur_id);
                          return (
                            <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9"}}
                              onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                              <td style={{padding:"12px 14px",verticalAlign:"middle",maxWidth:200}}>
                                <a href={`/annonce/${a.id}`} target="_blank" rel="noopener noreferrer"
                                  style={{fontWeight:700,color:"#4f46e5",textDecoration:"none",fontSize:13,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                  {a.titre}
                                </a>
                                <div style={{fontSize:11,color:"#94a3b8"}}>{a.date_creation ? new Date(a.date_creation).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"}) : ""}</div>
                              </td>
                              <td style={{padding:"12px 14px",verticalAlign:"middle",fontSize:12,color:"#374151"}}>
                                {u?.username || `ID ${a.utilisateur_id}`}
                              </td>
                              <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                <span style={{fontWeight:600,color:"#0f172a",fontSize:13}}>{t.agence_name || "—"}</span>
                              </td>
                              <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                <span style={{fontWeight:600,color:"#0f172a",fontSize:13}}>{t.agence_b_name || "—"}</span>
                              </td>
                              <td style={{padding:"12px 14px",verticalAlign:"middle",minWidth:160}}>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  <input type="number" min={0} max={100} step={0.5}
                                    value={t.commission||""}
                                    onChange={e => updateAccomTracking(a.id,"commission",e.target.value)}
                                    placeholder="ex: 2.5"
                                    style={{width:80,padding:"6px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:12.5,fontFamily:"inherit",outline:"none",background:"#f8fafc"}}/>
                                  <span style={{fontSize:12,color:"#64748b"}}>%</span>
                                </div>
                              </td>
                              <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                <span style={{fontSize:11,fontWeight:700,background:"#dcfce7",color:"#16a34a",padding:"3px 9px",borderRadius:999}}>
                                  Accompagné ✓
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ── Onglet Conventions ── */}
          {tab === "conventions" && (()=>{
            const CONV_STATUS = {
              soumis:  { label:"Soumis",  color:"#f59e0b", bg:"#fef3c7" },
              accepte: { label:"Accepté", color:"#16a34a", bg:"#dcfce7" },
              refuse:  { label:"Refusé",  color:"#dc2626", bg:"#fee2e2" },
            };
            const filtered = conventions.filter(c => {
              const nameMatch = !convFilterName || [c.user.username, c.user.email, c.user.nom, c.user.prenom, c.user.nom_entreprise].some(v => v && v.toLowerCase().includes(convFilterName.toLowerCase()));
              const typeMatch = !convFilterType || c.type === convFilterType;
              return nameMatch && typeMatch;
            });
            return (
              <div style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
                <div style={{marginBottom:20,display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Suivi des demandes de conventions</h2>
                    <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Toutes les conventions agence et promoteur soumises sur la plateforme.</p>
                  </div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <div style={{position:"relative"}}>
                      <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
                      <input value={convFilterName} onChange={e=>setConvFilterName(e.target.value)}
                        placeholder="Rechercher par nom, email…"
                        style={{paddingLeft:32,paddingRight:12,height:36,border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13,fontFamily:"inherit",outline:"none",minWidth:220}}/>
                    </div>
                    <select value={convFilterType} onChange={e=>setConvFilterType(e.target.value)}
                      style={{height:36,border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13,fontFamily:"inherit",padding:"0 12px",background:"#fff",outline:"none"}}>
                      <option value="">Tous les types</option>
                      <option value="agence">Agence</option>
                      <option value="promoteur">Promoteur</option>
                    </select>
                    <button onClick={loadConventions} style={{height:36,padding:"0 14px",border:"1.5px solid #e2e8f0",borderRadius:9,background:"#fff",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13}}><RefreshCw size={14}/>Actualiser</button>
                  </div>
                </div>
                {convLoading
                  ? <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>Chargement…</div>
                  : filtered.length === 0
                    ? <div style={{textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
                        <FileText size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                        <p style={{fontWeight:700,color:"#374151",marginBottom:6,fontSize:15}}>Aucune convention trouvée</p>
                        <p style={{fontSize:13,color:"#94a3b8"}}>Les demandes soumises par les agences et promoteurs apparaissent ici.</p>
                      </div>
                    : <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                          <thead>
                            <tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                              {["Type","Utilisateur","Entreprise","Responsable","Plan","Date soumission","Statut","Dossier"].map(h=>(
                                <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map(c=>{
                              const st = CONV_STATUS[c.status] || CONV_STATUS.soumis;
                              const fd = c.form_data || {};
                              return (
                                <tr key={c.id} style={{borderBottom:"1px solid #f1f5f9"}}
                                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                                  onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:999,fontSize:11.5,fontWeight:700,
                                      background:c.type==="agence"?"#eff6ff":"#faf5ff",color:c.type==="agence"?"#2563eb":"#7c3aed"}}>
                                      {c.type==="agence"?"🏢 Agence":"🏗 Promoteur"}
                                    </span>
                                  </td>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                    <div style={{fontWeight:700,color:"#0f172a",fontSize:13}}>@{c.user.username}</div>
                                    <div style={{fontSize:11.5,color:"#64748b"}}>{c.user.email}</div>
                                  </td>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle",color:"#374151"}}>{c.user.nom_entreprise||fd.nom_entreprise||"—"}</td>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle",color:"#374151"}}>{fd.responsable||[c.user.prenom,c.user.nom].filter(Boolean).join(" ")||"—"}</td>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                    {fd.plan ? <span style={{padding:"2px 10px",borderRadius:999,fontSize:11.5,fontWeight:700,background:"#f1f5f9",color:"#475569"}}>{fd.plan}</span> : "—"}
                                  </td>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle",color:"#64748b",whiteSpace:"nowrap"}}>
                                    {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                                  </td>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                    <span style={{display:"inline-block",padding:"3px 10px",borderRadius:999,fontSize:11.5,fontWeight:700,background:st.bg,color:st.color}}>{st.label}</span>
                                  </td>
                                  <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                                    <button onClick={()=>setConvDetail(c)}
                                      style={{padding:"5px 13px",borderRadius:8,border:"1.5px solid #e0e7ff",background:"#f5f3ff",color:"#6366f1",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
                                      <Eye size={13}/>Voir le dossier
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                }
              </div>
            );
          })()}

          {/* ─── TAB: Paramètres ─── */}
          {tab === "parametres" && (
            <div style={{maxWidth:760,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif"}}>
              {/* Bloc limites annonces */}
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"28px 32px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <ShieldAlert size={20} color="#6366f1"/>
                  </div>
                  <div>
                    <h2 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>Limites d'annonces actives par profil</h2>
                    <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>
                      Nombre maximum d'annonces <strong>en cours</strong> (approuvées + en attente) par utilisateur selon son profil.
                    </p>
                  </div>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {[
                    { role:"particulier", label:"Particulier",          desc:"Compte standard sans abonnement",        color:"#475569", bg:"#f1f5f9" },
                    { role:"agence",      label:"Agence / Agent",        desc:"Compte agence ou agent immobilier",      color:"#6366f1", bg:"#eef2ff" },
                    { role:"promoteur",   label:"Promoteur immobilier",  desc:"Compte promoteur immobilier",           color:"#7c3aed", bg:"#ede9fe" },
                    { role:"partenaire",  label:"Partenaire",            desc:"Partenaire commercial certifié",        color:"#0284c7", bg:"#e0f2fe" },
                    { role:"admin",       label:"Administrateur",        desc:"Aucune limite effective (>999)",        color:"#dc2626", bg:"#fee2e2" },
                  ].map(({ role, label, desc, color, bg }) => (
                    <div key={role} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 18px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0"}}>
                      <div style={{flexShrink:0,width:32,height:32,borderRadius:8,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:14,fontWeight:900,color}}>{label.charAt(0)}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a"}}>{label}</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{desc}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",whiteSpace:"nowrap"}}>Max annonces</label>
                        <input
                          type="number" min={0} max={9999}
                          value={quotas[role] ?? DEFAULT_QUOTAS[role]}
                          onChange={e => setQuotas(prev => ({ ...prev, [role]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          style={{width:72,padding:"6px 10px",borderRadius:8,border:"1.5px solid #c7d2fe",fontFamily:"inherit",fontSize:14,fontWeight:700,color:"#374151",textAlign:"center",outline:"none"}}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <p style={{fontSize:11.5,color:"#94a3b8",margin:0,display:"flex",alignItems:"center",gap:6}}>
                    <AlertTriangle size={13} color="#f59e0b"/>
                    Ces limites sont appliquées côté client. Pour une sécurité maximale, configurez aussi côté serveur.
                  </p>
                  <button
                    onClick={() => saveQuotas({...quotas})}
                    style={{
                      display:"flex",alignItems:"center",gap:8,
                      padding:"10px 22px",borderRadius:10,border:"none",
                      background: quotasSaved ? "#22c55e" : "#6366f1",
                      color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
                      transition:"background .3s",
                    }}>
                    {quotasSaved ? <><Check size={15}/> Sauvegardé !</> : <><Save size={15}/> Enregistrer</>}
                  </button>
                </div>
              </div>

              {/* Bloc Boost */}
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"24px 32px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"#fefce8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:20}}>⚡</span>
                  </div>
                  <div>
                    <h2 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>Bouton Booster mes annonces</h2>
                    <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>Afficher ou masquer l'option "Booster mes annonces" dans le menu utilisateur.</p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"#374151",marginBottom:4}}>
                      Statut actuel : <span style={{color: boostEnabled?"#16a34a":"#dc2626",fontWeight:800}}>{boostEnabled ? "Activé ✓" : "Désactivé ✕"}</span>
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8"}}>
                      {boostEnabled ? "Le bouton est visible dans le menu de chaque utilisateur connecté." : "Le bouton est masqué sur toute la plateforme."}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeatureFlag("boost_enabled", !boostEnabled, setBoostEnabled)}
                    style={{
                      padding:"10px 22px",borderRadius:10,border:"none",cursor:"pointer",
                      fontWeight:700,fontSize:14,transition:"all .2s",
                      background: boostEnabled ? "#fee2e2" : "#dcfce7",
                      color: boostEnabled ? "#dc2626" : "#16a34a",
                      flexShrink:0,
                    }}>
                    {boostEnabled ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>

              {/* Bloc POI / Lieux */}
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"24px 32px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <MapPin size={20} color="#3b82f6"/>
                  </div>
                  <div>
                    <h2 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>Bouton Lieux (couche POI)</h2>
                    <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>Afficher ou masquer les boutons Écoles, Mosquées, Facultés, Grandes surfaces, Hôpitaux sur la carte et dans les détails d'annonce.</p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"#374151",marginBottom:4}}>
                      Statut actuel : <span style={{color: poiEnabled?"#16a34a":"#dc2626",fontWeight:800}}>{poiEnabled ? "Activé ✓" : "Désactivé ✕"}</span>
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8"}}>
                      {poiEnabled ? "Les boutons de lieux sont visibles sur la carte et dans les popups d'annonces." : "Les boutons de lieux sont masqués sur toute la plateforme."}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeatureFlag("poi_enabled", !poiEnabled, setPoiEnabled)}
                    style={{
                      padding:"10px 22px",borderRadius:10,border:"none",cursor:"pointer",
                      fontWeight:700,fontSize:14,transition:"all .2s",
                      background: poiEnabled ? "#fee2e2" : "#dcfce7",
                      color: poiEnabled ? "#dc2626" : "#16a34a",
                      flexShrink:0,
                    }}>
                    {poiEnabled ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>

              {/* Bloc Carte : tous les points vs. gouvernorat requis */}
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"24px 32px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Layers size={20} color="#16a34a"/>
                  </div>
                  <div>
                    <h2 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>Points affichés sur la carte</h2>
                    <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>
                      Contrôle l'optimisation qui limite l'affichage des annonces sur la carte de recherche.
                      À désactiver au lancement (peu d'annonces, tout doit être visible) ; à activer quand le volume
                      d'annonces devient important, pour n'afficher les points qu'après sélection d'un gouvernorat.
                    </p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"#374151",marginBottom:4}}>
                      Sélection d'un gouvernorat requise :{" "}
                      <span style={{color: regionRequiredForPins?"#dc2626":"#16a34a",fontWeight:800}}>
                        {regionRequiredForPins ? "Activée ✓" : "Désactivée ✕"}
                      </span>
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8"}}>
                      {regionRequiredForPins
                        ? "La carte n'affiche des points qu'une fois qu'un gouvernorat est sélectionné (optimisation active)."
                        : "Tous les biens sont affichés sur la carte, sans sélection préalable d'un gouvernorat."}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeatureFlag("require_region_to_show_map_pins", !regionRequiredForPins, setRegionRequiredForPins)}
                    style={{
                      padding:"10px 22px",borderRadius:10,border:"none",cursor:"pointer",
                      fontWeight:700,fontSize:14,transition:"all .2s",
                      background: regionRequiredForPins ? "#fee2e2" : "#dcfce7",
                      color: regionRequiredForPins ? "#dc2626" : "#16a34a",
                      flexShrink:0,
                    }}>
                    {regionRequiredForPins ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>

              {/* ─── Bloc : Gestion des offres d'abonnement ─── */}
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"28px 32px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <CreditCard size={20} color="#7c3aed"/>
                  </div>
                  <div style={{flex:1}}>
                    <h2 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>Offres d'abonnement visibles</h2>
                    <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>Activez ou désactivez les offres affichées aux utilisateurs dans "Mon abonnement". Les offres désactivées sont masquées immédiatement.</p>
                  </div>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:20}}>
                  {Object.entries(_PLANS_META).map(([seg, meta]) => (
                    <div key={seg} style={{border:"1.5px solid #f1f5f9",borderRadius:14,overflow:"hidden"}}>
                      {/* Header segment */}
                      <div style={{background:`${meta.color}10`,padding:"12px 18px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #f1f5f9"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:meta.color,flexShrink:0}}/>
                        <span style={{fontSize:13.5,fontWeight:800,color:meta.color}}>{meta.label}</span>
                      </div>
                      {/* Plans rows */}
                      <div style={{padding:"8px 18px 12px",display:"flex",flexDirection:"column",gap:6}}>
                        {meta.plans.map(plan => {
                          const active = plansConfig?.[seg]?.[plan.id] !== false;
                          return (
                            <div key={plan.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background: active?"#f8fafc":"#fef2f2",border:`1px solid ${active?"#e2e8f0":"#fecaca"}`,transition:"background .2s"}}>
                              <div>
                                <span style={{fontSize:14,fontWeight:700,color: active?"#0f172a":"#94a3b8"}}>{plan.name}</span>
                                {!active && <span style={{marginLeft:10,fontSize:11,color:"#ef4444",fontWeight:700,background:"#fee2e2",padding:"2px 8px",borderRadius:20}}>Masquée</span>}
                              </div>
                              {/* Toggle switch */}
                              <div
                                onClick={() => togglePlan(seg, plan.id)}
                                style={{
                                  width:44, height:24,
                                  background: active ? meta.color : "#d1d5db",
                                  borderRadius:999, padding:3, cursor:"pointer",
                                  transition:"background .2s", flexShrink:0,
                                  display:"flex", alignItems:"center",
                                }}>
                                <div style={{
                                  width:18, height:18, background:"#fff", borderRadius:"50%",
                                  transition:"transform .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)",
                                  transform: active ? "translateX(20px)" : "translateX(0)",
                                }}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
                  <button
                    onClick={savePlansConfig}
                    style={{
                      display:"flex",alignItems:"center",gap:8,
                      padding:"10px 24px",borderRadius:10,border:"none",
                      background: plansSaved ? "#22c55e" : "#7c3aed",
                      color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
                      transition:"background .3s",
                    }}>
                    {plansSaved ? <><Check size={15}/> Sauvegardé !</> : <><Save size={15}/> Enregistrer les offres</>}
                  </button>
                </div>
              </div>

              {/* Résumé des quotas actuels */}
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"14px 18px"}}>
                <p style={{fontSize:12,fontWeight:700,color:"#15803d",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}>
                  <CheckCircle size={14}/> Configuration active
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {Object.entries(quotas).map(([role,val]) => (
                    <span key={role} style={{padding:"4px 12px",borderRadius:20,background:"#fff",border:"1px solid #bbf7d0",fontSize:12,fontWeight:600,color:"#374151"}}>
                      {role} : <strong style={{color:"#16a34a"}}>{val}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Modal : détail dossier convention ── */}
      {convDetail&&(()=>{
        const c = convDetail;
        const fd = c.form_data || {};
        const docs = fd.docs || {};
        const CONV_STATUS = {
          soumis:  { label:"Soumis",  color:"#f59e0b", bg:"#fef3c7" },
          accepte: { label:"Accepté", color:"#16a34a", bg:"#dcfce7" },
          refuse:  { label:"Refusé",  color:"#dc2626", bg:"#fee2e2" },
        };
        const st = CONV_STATUS[c.status] || CONV_STATUS.soumis;
        const BACKEND = "http://localhost:8000";

        const DOC_LABELS = {
          patente: "Patente commerciale",
          rc:      "Registre de commerce",
          cin:     "CIN du gérant",
          logo:    "Logo",
        };

        const isAgence = c.type === "agence";
        const FIELD_LABELS = isAgence ? {
          nom_agence:           "Raison sociale",
          responsable:          "Responsable / Gérant",
          email:                "Email professionnel",
          telephone:            "Téléphone",
          matricule_fiscal:     "Matricule fiscal",
          registre_commerce:    "N° Registre de commerce",
          adresse:              "Adresse du siège",
          gouvernorat:          "Gouvernorat",
          delegation:           "Délégation",
          conventionAccepted:   "Convention signée",
          signedAt:             "Date de signature",
          plan:                 "Plan choisi",
        } : {
          nom_entreprise:       "Raison sociale",
          responsable:          "Responsable / Dirigeant",
          email:                "Email professionnel",
          telephone:            "Téléphone",
          matricule_fiscal:     "Matricule fiscal",
          registre_commerce:    "N° Registre de commerce",
          adresse:              "Adresse du siège",
          gouvernorat:          "Gouvernorat",
          delegation:           "Délégation",
          conventionAccepted:   "Convention signée",
          signedAt:             "Date de signature",
          plan:                 "Plan choisi",
        };

        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setConvDetail(null)}>
            <div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,.25)",fontFamily:"'Inter',system-ui,sans-serif"}} onClick={e=>e.stopPropagation()}>

              {/* Header */}
              <div style={{padding:"22px 28px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa",borderRadius:"18px 18px 0 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:c.type==="agence"?"#eff6ff":"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:22}}>{c.type==="agence"?"🏢":"🏗"}</span>
                  </div>
                  <div>
                    <h2 style={{margin:0,fontSize:17,fontWeight:800,color:"#0f172a"}}>
                      Dossier {c.type==="agence"?"Agence":"Promoteur"} — @{c.user.username}
                    </h2>
                    <p style={{margin:"3px 0 0",fontSize:12.5,color:"#64748b"}}>
                      Soumis le {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString("fr-TN",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                    </p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{padding:"4px 14px",borderRadius:999,fontSize:12.5,fontWeight:700,background:st.bg,color:st.color}}>{st.label}</span>
                  <button onClick={()=>setConvDetail(null)} style={{width:34,height:34,borderRadius:9,border:"none",background:"#f1f5f9",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={16}/></button>
                </div>
              </div>

              <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:24}}>

                {/* Infos utilisateur */}
                <section>
                  <p style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".07em",margin:"0 0 12px"}}>Compte utilisateur</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 20px"}}>
                    {[
                      ["Nom d'utilisateur", `@${c.user.username}`],
                      ["Email",             c.user.email||"—"],
                      ["Nom",               c.user.nom||"—"],
                      ["Prénom",            c.user.prenom||"—"],
                      ["Entreprise",        c.user.nom_entreprise||"—"],
                      ["Téléphone",         c.user.phone_number||"—"],
                    ].map(([label,val])=>(
                      <div key={label} style={{padding:"10px 14px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{label}</div>
                        <div style={{fontSize:13.5,fontWeight:600,color:"#0f172a"}}>{val}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Champs du formulaire */}
                <section>
                  <p style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".07em",margin:"0 0 12px"}}>Informations du dossier</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 20px"}}>
                    {Object.entries(FIELD_LABELS).map(([key,label])=>{
                      const raw = fd[key];
                      let display = "—";
                      let color = "#94a3b8";
                      if(raw!==undefined && raw!==null && raw!=="") {
                        if(key==="conventionAccepted") { display = raw ? "✓ Oui" : "✗ Non"; color = raw ? "#16a34a" : "#ef4444"; }
                        else if(key==="signedAt") { try { display = new Date(raw).toLocaleString("fr-TN",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}); color="#0f172a"; } catch { display=raw; color="#0f172a"; } }
                        else { display = String(raw); color="#0f172a"; }
                      }
                      return (
                        <div key={key} style={{padding:"10px 14px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{label}</div>
                          <div style={{fontSize:13.5,fontWeight:600,color}}>{display}</div>
                        </div>
                      );
                    })}
                  </div>
                  {Object.keys(FIELD_LABELS).every(k=>fd[k]===undefined||fd[k]===null||fd[k]==="") && (
                    <p style={{fontSize:13,color:"#94a3b8",fontStyle:"italic"}}>Aucun champ de formulaire enregistré.</p>
                  )}
                </section>

                {/* Pièces jointes */}
                <section>
                  <p style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".07em",margin:"0 0 12px"}}>Pièces jointes</p>
                  {Object.keys(docs).length === 0
                    ? <div style={{padding:"20px",background:"#fef9c3",borderRadius:10,border:"1px solid #fde68a",fontSize:13,color:"#92400e",fontWeight:600}}>
                        ⚠ Aucune pièce jointe reçue — le dossier a peut-être été soumis avant l'activation de l'upload.
                      </div>
                    : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        {Object.entries(docs).map(([key,url])=>{
                          const isPdf = url.endsWith(".pdf");
                          const fullUrl = url.startsWith("http") ? url : `${BACKEND}${url}`;
                          return (
                            <a key={key} href={fullUrl} target="_blank" rel="noopener noreferrer"
                              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#f8fafc",borderRadius:10,border:"1.5px solid #e2e8f0",textDecoration:"none",transition:"border-color .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.borderColor="#6366f1"}
                              onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
                              <div style={{width:38,height:38,borderRadius:9,background:isPdf?"#fee2e2":"#e0e7ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <span style={{fontSize:20}}>{isPdf?"📄":"🖼"}</span>
                              </div>
                              <div>
                                <div style={{fontSize:12.5,fontWeight:700,color:"#0f172a"}}>{DOC_LABELS[key]||key}</div>
                                <div style={{fontSize:11,color:"#6366f1",fontWeight:600,marginTop:2}}>{isPdf?"Ouvrir le PDF":"Voir l'image"} →</div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                  }
                </section>

                {/* Actions */}
                <section style={{borderTop:"1px solid #f1f5f9",paddingTop:20,display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
                  {c.status!=="accepte"&&(
                    <button onClick={()=>{updateConventionStatus(c.id,"accepte");setConvDetail(d=>({...d,status:"accepte"}));}}
                      style={{padding:"9px 20px",borderRadius:10,border:"none",background:"#22c55e",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                      <CheckCircle size={14}/>Accepter le dossier
                    </button>
                  )}
                  {c.status!=="refuse"&&(
                    <button onClick={()=>{updateConventionStatus(c.id,"refuse");setConvDetail(d=>({...d,status:"refuse"}));}}
                      style={{padding:"9px 20px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                      <XCircle size={14}/>Refuser le dossier
                    </button>
                  )}
                  {c.status!=="soumis"&&(
                    <button onClick={()=>{updateConventionStatus(c.id,"soumis");setConvDetail(d=>({...d,status:"soumis"}));}}
                      style={{padding:"9px 20px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#475569",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                      Remettre en attente
                    </button>
                  )}
                  <button onClick={()=>setConvDetail(null)}
                    style={{padding:"9px 20px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#475569",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    Fermer
                  </button>
                </section>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── (ancien bloc paramètres supprimé — maintenant dans adm-main) ─── */}
      {false && (
        <div style={{maxWidth:760,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif"}}>
          {/* Bloc limites annonces */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"28px 32px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{width:40,height:40,borderRadius:12,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <ShieldAlert size={20} color="#6366f1"/>
              </div>
              <div>
                <h2 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>Limites d'annonces actives par profil</h2>
                <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>
                  Nombre maximum d'annonces <strong>en cours</strong> (approuvées + en attente) par utilisateur selon son profil.
                </p>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                { role:"particulier", label:"Particulier",          desc:"Compte standard sans abonnement",        color:"#475569", bg:"#f1f5f9" },
                { role:"agence",      label:"Agence / Agent",        desc:"Compte agence ou agent immobilier",      color:"#6366f1", bg:"#eef2ff" },
                { role:"promoteur",   label:"Promoteur immobilier",  desc:"Compte promoteur immobilier",           color:"#7c3aed", bg:"#ede9fe" },
                { role:"partenaire",  label:"Partenaire",            desc:"Partenaire commercial certifié",        color:"#0284c7", bg:"#e0f2fe" },
                { role:"admin",       label:"Administrateur",        desc:"Aucune limite effective (>999)",        color:"#dc2626", bg:"#fee2e2" },
              ].map(({ role, label, desc, color, bg }) => (
                <div key={role} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 18px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0"}}>
                  <div style={{flexShrink:0,width:32,height:32,borderRadius:8,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:14,fontWeight:900,color}}>{label.charAt(0)}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a"}}>{label}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{desc}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                    <label style={{fontSize:11,fontWeight:700,color:"#64748b",whiteSpace:"nowrap"}}>Max annonces</label>
                    <input
                      type="number" min={0} max={9999}
                      value={quotas[role] ?? DEFAULT_QUOTAS[role]}
                      onChange={e => setQuotas(prev => ({ ...prev, [role]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      style={{width:72,padding:"6px 10px",borderRadius:8,border:"1.5px solid #c7d2fe",fontFamily:"inherit",fontSize:14,fontWeight:700,color:"#374151",textAlign:"center",outline:"none"}}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <p style={{fontSize:11.5,color:"#94a3b8",margin:0,display:"flex",alignItems:"center",gap:6}}>
                <AlertTriangle size={13} color="#f59e0b"/>
                Ces limites sont appliquées côté client. Pour une sécurité maximale, configurez aussi côté serveur.
              </p>
              <button
                onClick={() => saveQuotas({...quotas})}
                style={{
                  display:"flex",alignItems:"center",gap:8,
                  padding:"10px 22px",borderRadius:10,border:"none",
                  background: quotasSaved ? "#22c55e" : "#6366f1",
                  color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
                  transition:"background .3s",
                }}>
                {quotasSaved ? <><Check size={15}/> Sauvegardé !</> : <><Save size={15}/> Enregistrer</>}
              </button>
            </div>
          </div>

          {/* Bloc Boost */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"24px 32px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{width:40,height:40,borderRadius:12,background:"#fefce8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:20}}>⚡</span>
              </div>
              <div>
                <h2 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>Bouton Booster mes annonces</h2>
                <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>Afficher ou masquer l'option "Booster mes annonces" dans le menu utilisateur.</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:"#374151",marginBottom:4}}>
                  Statut actuel : <span style={{color: boostEnabled?"#16a34a":"#dc2626",fontWeight:800}}>{boostEnabled ? "Activé ✓" : "Désactivé ✕"}</span>
                </div>
                <div style={{fontSize:12,color:"#94a3b8"}}>
                  {boostEnabled ? "Le bouton est visible dans le menu de chaque utilisateur connecté." : "Le bouton est masqué sur toute la plateforme."}
                </div>
              </div>
              <button
                onClick={() => toggleFeatureFlag("boost_enabled", !boostEnabled, setBoostEnabled)}
                style={{
                  padding:"10px 22px",borderRadius:10,border:"none",cursor:"pointer",
                  fontWeight:700,fontSize:14,transition:"all .2s",
                  background: boostEnabled ? "#fee2e2" : "#dcfce7",
                  color: boostEnabled ? "#dc2626" : "#16a34a",
                  flexShrink:0,
                }}>
                {boostEnabled ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>

          {/* Résumé des quotas actuels */}
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"14px 18px"}}>
            <p style={{fontSize:12,fontWeight:700,color:"#15803d",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}>
              <CheckCircle size={14}/> Configuration active
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {Object.entries(quotas).map(([role,val]) => (
                <span key={role} style={{padding:"4px 12px",borderRadius:20,background:"#fff",border:"1px solid #bbf7d0",fontSize:12,fontWeight:600,color:"#374151"}}>
                  {role} : <strong style={{color:"#16a34a"}}>{val}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Agency View Modal ── */}
      {agencyViewId && agencyViewData && (
        <div className="adm-modal-bg" onClick={() => setAgencyViewId(null)}>
          <div className="adm-modal adm-modal--agency-view" onClick={e => e.stopPropagation()}>
            <div className="adm-modal__head">
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{
                  width:40,height:40,borderRadius:12,
                  background:agencyViewData.ag.abonnement_actif?"linear-gradient(135deg,#6366f1,#4f46e5)":"#fef2f2",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:agencyViewData.ag.abonnement_actif?"#fff":"#dc2626",
                  fontSize:17,fontWeight:800,flexShrink:0,
                }}>
                  {agencyViewData.ag.nom?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:0}}>{agencyViewData.ag.nom}</h2>
                  <p style={{fontSize:12,color:"#94a3b8",margin:0,marginTop:2}}>
                    {agencyViewData.ag.email}
                    {agencyViewData.ag.telephone && ` · ${agencyViewData.ag.telephone}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setAgencyViewId(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b"}}>
                <X size={18}/>
              </button>
            </div>
            <div className="adm-modal__body" style={{padding:"18px 22px",maxHeight:"65vh",overflowY:"auto"}}>
              {/* KPI mini */}
              <div className="adm-av-kpi-row">
                <div className="adm-av-kpi">
                  <div className="adm-av-kpi__val">{agencyViewData.agAnnonces.length}</div>
                  <div className="adm-av-kpi__lbl">Total</div>
                </div>
                <div className="adm-av-kpi adm-av-kpi--green">
                  <div className="adm-av-kpi__val">{agencyViewData.approved}</div>
                  <div className="adm-av-kpi__lbl">Approuvées</div>
                </div>
                <div className="adm-av-kpi adm-av-kpi--amber">
                  <div className="adm-av-kpi__val">{agencyViewData.pending}</div>
                  <div className="adm-av-kpi__lbl">En attente</div>
                </div>
                <div className="adm-av-kpi adm-av-kpi--blue">
                  <div className="adm-av-kpi__val">
                    {agencyViewData.avgPrix > 0
                      ? Math.round(agencyViewData.avgPrix / 1000) + "k"
                      : "—"}
                  </div>
                  <div className="adm-av-kpi__lbl">Moy. prix</div>
                </div>
              </div>

              {/* Annonces list */}
              {agencyViewData.agAnnonces.length === 0 ? (
                <div style={{textAlign:"center",padding:"24px",color:"#94a3b8",fontSize:13}}>
                  Aucune annonce publiée pour cette agence.
                </div>
              ) : (
                <div style={{marginTop:16}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:"#94a3b8",marginBottom:10}}>
                    Annonces ({agencyViewData.agAnnonces.length})
                  </div>
                  {agencyViewData.agAnnonces.slice(0, 12).map(a => (
                    <div key={a.id} className="adm-av-annonce">
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {a.titre}
                        </div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>
                          {a.gouvernorat || "—"} · {TypeBienFr(a.type_bien)}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <StatusBadge status={a.status}/>
                        <span style={{fontSize:12,fontWeight:700,color:"#0f172a",whiteSpace:"nowrap"}}>
                          {a.prix ? Number(a.prix).toLocaleString("fr-TN") + " " + fmtDevise(a.devise) : "—"}
                        </span>
                        <Link to={`/annonce/${a.id}`} target="_blank" style={{color:"#6366f1",display:"flex",alignItems:"center"}}>
                          <Eye size={13}/>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {agencyViewData.agAnnonces.length > 12 && (
                    <p style={{fontSize:12,color:"#94a3b8",textAlign:"center",marginTop:10}}>
                      +{agencyViewData.agAnnonces.length - 12} annonces supplémentaires
                    </p>
                  )}
                </div>
              )}

              {/* Agency info */}
              {agencyViewData.ag.adresse && (
                <div style={{marginTop:16,padding:"10px 14px",background:"#f8fafc",borderRadius:10,fontSize:12,color:"#64748b"}}>
                  <strong style={{color:"#374151"}}>Adresse :</strong> {agencyViewData.ag.adresse}
                  {agencyViewData.ag.matricule && <> · <strong style={{color:"#374151"}}>Matricule :</strong> {agencyViewData.ag.matricule}</>}
                </div>
              )}
              {agencyViewData.ag.note_admin && (
                <div style={{marginTop:10,padding:"10px 14px",background:"#fefce8",border:"1px solid #fde68a",borderRadius:10,fontSize:12,color:"#92400e"}}>
                  <Edit3 size={11} style={{marginRight:6}}/><strong>Note admin :</strong> {agencyViewData.ag.note_admin}
                </div>
              )}
            </div>
            <div className="adm-modal__foot">
              <button className="adm-modal__cancel" onClick={() => setAgencyViewId(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Agency Create Modal ── */}
      {agencyModal && (
        <div className="adm-modal-bg" onClick={() => setAgencyModal(false)}>
          <div className="adm-modal adm-modal--agency" onClick={e => e.stopPropagation()}>
            <div className="adm-modal__head">
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:9,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",color:"#6366f1"}}>
                  <Building size={17}/>
                </div>
                <h2>Créer un compte agence</h2>
              </div>
              <button onClick={() => setAgencyModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b"}}>
                <X size={18}/>
              </button>
            </div>
            <div className="adm-modal__body">
              <div className="adm-modal__section-lbl">Informations de l'agence</div>
              <div className="adm-modal__row">
                <div>
                  <label>Nom de l'agence <span style={{color:"#ef4444"}}>*</span></label>
                  <input className="adm-modal__input" placeholder="Ex: Agence Immobilière El Amal"
                    value={agencyForm.nom} onChange={e => setAgencyForm(p=>({...p,nom:e.target.value}))}/>
                </div>
                <div>
                  <label>Matricule fiscal</label>
                  <input className="adm-modal__input" placeholder="Ex: 1234567A"
                    value={agencyForm.matricule} onChange={e => setAgencyForm(p=>({...p,matricule:e.target.value}))}/>
                </div>
              </div>
              <div className="adm-modal__row">
                <div>
                  <label>Email <span style={{color:"#ef4444"}}>*</span></label>
                  <input className="adm-modal__input" type="email" placeholder="agence@email.com"
                    value={agencyForm.email} onChange={e => setAgencyForm(p=>({...p,email:e.target.value}))}/>
                </div>
                <div>
                  <label>Téléphone</label>
                  <input className="adm-modal__input" placeholder="+216 XX XXX XXX"
                    value={agencyForm.telephone} onChange={e => setAgencyForm(p=>({...p,telephone:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label>Adresse</label>
                <input className="adm-modal__input" placeholder="Adresse complète de l'agence"
                  value={agencyForm.adresse} onChange={e => setAgencyForm(p=>({...p,adresse:e.target.value}))}/>
              </div>
              <div className="adm-modal__section-lbl" style={{marginTop:18}}>Accès & Abonnement</div>
              <div className="adm-modal__row">
                <div>
                  <label>Nom d'utilisateur <span style={{color:"#ef4444"}}>*</span></label>
                  <input className="adm-modal__input" placeholder="agence_nom"
                    value={agencyForm.username} onChange={e => setAgencyForm(p=>({...p,username:e.target.value}))}/>
                </div>
                <div>
                  <label>Mot de passe <span style={{color:"#ef4444"}}>*</span></label>
                  <input className="adm-modal__input" type="password" placeholder="••••••••"
                    value={agencyForm.password} onChange={e => setAgencyForm(p=>({...p,password:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label>Frais mensuel (DT)</label>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input className="adm-modal__input" type="number" min="10" style={{width:120}}
                    value={agencyForm.frais_mensuel} onChange={e => setAgencyForm(p=>({...p,frais_mensuel:e.target.value}))}/>
                  <span style={{fontSize:12,color:"#64748b"}}>DT / mois pour le tableau de bord avancé</span>
                </div>
              </div>
              <div className="adm-agency-warn">
                <ShieldOff size={14}/>
                <span>Si l'agence cesse de payer, son accès au tableau de bord sera automatiquement suspendu.</span>
              </div>
            </div>
            <div className="adm-modal__foot">
              <button className="adm-modal__cancel" onClick={() => setAgencyModal(false)}>Annuler</button>
              <button className="adm-modal__save" onClick={createAgency} disabled={agencySaving}
                style={{background:"#6366f1"}}>
                {agencySaving ? "Création…" : <><Plus size={14}/> Créer le compte</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {modal?.action === "reject" && (() => {
        const RAISONS_PRESET = [
          "Mauvaise qualité des photos",
          "Photos insuffisantes ou manquantes",
          "Titre non descriptif ou incomplet",
          "Prix incorrect ou manquant",
          "Description insuffisante",
          "Informations de localisation incorrectes",
          "Annonce en doublon",
          "Contenu inapproprié ou trompeur",
        ];
        const toggleRaison = (r) => setRejectRaisons(prev =>
          prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
        );
        const addCustomCause = () =>
          setRejectCausesCustom(prev => [...prev, { id: Date.now(), text: "" }]);
        const updateCustomCause = (id, text) =>
          setRejectCausesCustom(prev => prev.map(c => c.id === id ? { ...c, text } : c));
        const removeCustomCause = (id) =>
          setRejectCausesCustom(prev => prev.filter(c => c.id !== id));
        const closeModal = () => { setModal(null); setRejectRaisons([]); setRejectMsg(""); setRejectCausesCustom([]); };
        const allRaisons = [
          ...rejectRaisons,
          ...rejectCausesCustom.map(c => c.text).filter(t => t.trim()),
        ];
        return (
          <div className="adm-modal-bg" onClick={closeModal}>
            <div style={{background:"#fff",borderRadius:20,padding:"28px 32px",maxWidth:520,width:"95%",boxShadow:"0 24px 64px rgba(0,0,0,.18)",maxHeight:"90vh",overflowY:"auto"}} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Logo variant="color" height={28} to={null}/>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>Refuser cette annonce</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Indiquez la raison du refus au propriétaire</div>
                  </div>
                </div>
                <button onClick={closeModal} style={{background:"#f1f5f9",border:"none",cursor:"pointer",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>
                  <X size={18} strokeWidth={2.5}/>
                </button>
              </div>

              <p style={{marginBottom:16,color:"#64748b",fontSize:13}}>
                Annonce : <strong style={{color:"#0f172a"}}>«{modal.annonce.titre}»</strong>
              </p>

              {/* Causes fréquentes */}
              <p style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:10}}>Causes fréquentes :</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {RAISONS_PRESET.map(r => (
                  <label key={r} style={{
                    display:"flex",alignItems:"center",gap:6,cursor:"pointer",
                    padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:500,
                    border:`1.5px solid ${rejectRaisons.includes(r) ? "#dc2626" : "#e2e8f0"}`,
                    background: rejectRaisons.includes(r) ? "#fee2e2" : "#f8fafc",
                    color: rejectRaisons.includes(r) ? "#dc2626" : "#374151",
                    transition:"all .15s",userSelect:"none",
                  }}>
                    <input type="checkbox" checked={rejectRaisons.includes(r)}
                      onChange={() => toggleRaison(r)}
                      style={{accentColor:"#dc2626",width:13,height:13}}/>
                    {r}
                  </label>
                ))}
              </div>

              {/* Causes personnalisées */}
              {rejectCausesCustom.length > 0 && (
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:8}}>Causes personnalisées :</p>
                  {rejectCausesCustom.map(c => (
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <input
                        type="text"
                        value={c.text}
                        onChange={e => updateCustomCause(c.id, e.target.value)}
                        placeholder="Saisir une cause…"
                        style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none"}}
                      />
                      <button onClick={() => removeCustomCause(c.id)} style={{
                        background:"#fee2e2",border:"none",cursor:"pointer",borderRadius:8,
                        width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#dc2626",flexShrink:0,
                      }}>
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton ajouter une cause */}
              <button onClick={addCustomCause} style={{
                display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                borderRadius:8,border:"1.5px dashed #6366f1",background:"#f5f3ff",
                color:"#6366f1",fontWeight:600,fontSize:13,cursor:"pointer",marginBottom:16,
              }}>
                <Plus size={14}/> Ajouter une cause
              </button>

              {/* Message libre */}
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>
                Message libre (optionnel)
              </label>
              <textarea className="adm-modal__textarea" rows={3}
                placeholder="Précisez si nécessaire…"
                value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}/>

              {/* Footer */}
              <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
                <button onClick={closeModal} style={{
                  padding:"10px 20px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",
                  color:"#374151",fontWeight:600,cursor:"pointer",fontSize:14,
                }}>Annuler</button>
                <button onClick={() => updateStatus(modal.annonce.id, "refusee", rejectMsg, allRaisons)} style={{
                  padding:"10px 20px",borderRadius:10,border:"none",background:"#dc2626",
                  color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",gap:6,
                }}>
                  <X size={14}/> Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Preview Annonce Modal (using full AnnonceDetailModal) ── */}
      {previewAnnonce && (
        <AnnonceDetailModal
          annonceId={previewAnnonce.id}
          onClose={() => setPreviewAnnonce(null)}
          adminActions={{
            status:    previewAnnonce.status,
            onApprove: () => updateStatus(previewAnnonce.id, "approuvee"),
            onReject:  () => setModal({ annonce: previewAnnonce, action:"reject" }),
          }}
        />
      )}

      {/* ── Onglet Accompagnements (déplacé dans <main>) ── */}
      {false && (() => {
        return (
          <div>
            <div style={{padding:"20px 0 14px"}}>
              <h2 style={{fontSize:18, fontWeight:800, color:"#0f172a", margin:0}}>Suivi des demandes d'accompagnement</h2>
              <p style={{fontSize:13, color:"#64748b", margin:"4px 0 0"}}>
                Annonces dont les propriétaires souhaitent être accompagnés par un professionnel.
              </p>
            </div>
            {accomAnnonces.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
                <Sparkles size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                <p style={{fontWeight:700,color:"#374151",marginBottom:6}}>Aucune demande d'accompagnement</p>
              </div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                      {["Annonce","Propriétaire","Type","Agence contactée","Réponse reçue","Contact effectué","Remarques"].map(h => (
                        <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accomAnnonces.map(a => {
                      const t = accomTracking[a.id] || {};
                      const user = users?.find(u => u.id === a.utilisateur_id);
                      return (
                        <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                          onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                          <td style={{padding:"12px 14px",verticalAlign:"middle",maxWidth:200}}>
                            <div style={{fontWeight:700,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.titre}</div>
                            <div style={{fontSize:11,color:"#94a3b8"}}>{new Date(a.date_creation).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"})}</div>
                          </td>
                          <td style={{padding:"12px 14px",verticalAlign:"middle",whiteSpace:"nowrap",fontSize:12,color:"#374151"}}>
                            {user?.username || `ID ${a.utilisateur_id}`}
                          </td>
                          <td style={{padding:"12px 14px",verticalAlign:"middle",whiteSpace:"nowrap"}}>
                            <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#6366f1",background:"#eef2ff",padding:"3px 7px",borderRadius:6}}>
                              {a.type_bien?.replace("_"," ")}
                            </span>
                          </td>
                          <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                            <TrackSwitch val={!!t.agence} onChange={v=>updateAccomTracking(a.id,"agence",v)}/>
                          </td>
                          <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                            <TrackSwitch val={!!t.reponse} onChange={v=>updateAccomTracking(a.id,"reponse",v)}/>
                          </td>
                          <td style={{padding:"12px 14px",verticalAlign:"middle"}}>
                            <TrackSwitch val={!!t.contact} onChange={v=>updateAccomTracking(a.id,"contact",v)}/>
                          </td>
                          <td style={{padding:"12px 14px",verticalAlign:"middle",minWidth:200}}>
                            <input type="text" value={t.remarque||""} onChange={e=>updateAccomTracking(a.id,"remarque",e.target.value)}
                              placeholder="Ajouter une remarque…"
                              style={{width:"100%",padding:"6px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:12.5,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      <style>{`
        /* ── Layout ── */
        .adm-page { display:flex; min-height:calc(100vh - 64px); font-family:'Inter',system-ui,sans-serif; background:#f8fafc; }

        /* Sidebar */
        .adm-sidebar {
          width:220px; flex-shrink:0; background:#0f172a; padding:20px 12px;
          display:flex; flex-direction:column; gap:4px; min-height:calc(100vh - 64px);
        }
        .adm-sidebar__logo {
          display:flex; align-items:center; gap:8px; padding:12px;
          font-size:16px; font-weight:800; color:#fff; margin-bottom:16px;
        }
        .adm-nav {
          display:flex; align-items:center; gap:9px; padding:10px 12px;
          border-radius:8px; border:none; background:transparent;
          font-size:14px; font-weight:500; color:rgba(255,255,255,.6);
          cursor:pointer; text-decoration:none; transition:all .15s;
          text-align:left; width:100%; font-family:inherit; position:relative;
        }
        .adm-nav:hover { background:rgba(255,255,255,.08); color:#fff; }
        .adm-nav--active { background:rgba(99,102,241,.25); color:#a5b4fc; }
        .adm-nav__badge {
          margin-left:auto; background:#ef4444; color:#fff;
          font-size:10px; font-weight:800; padding:2px 6px; border-radius:20px;
        }

        /* Main */
        .adm-main { flex:1; padding:28px; overflow:auto; }
        .adm-topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
        .adm-topbar__title { font-size:22px; font-weight:800; color:#0f172a; }
        .adm-refresh {
          padding:8px; border-radius:8px; border:1px solid #e5e7eb;
          background:#fff; cursor:pointer; color:#64748b; transition:all .15s;
        }
        .adm-refresh:hover { border-color:#6366f1; color:#6366f1; }

        /* Global stats cards */
        .adm-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:24px; }
        .adm-stat {
          background:#fff; border:1px solid #e5e7eb; border-radius:12px;
          padding:16px; display:flex; align-items:center; gap:12px;
        }
        .adm-stat__ico {
          width:42px; height:42px; border-radius:10px; background:#f1f5f9;
          display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#64748b;
        }
        .adm-stat--green .adm-stat__ico { background:#f0fdf4; color:#16a34a; }
        .adm-stat--amber .adm-stat__ico { background:#fffbeb; color:#d97706; }
        .adm-stat--red   .adm-stat__ico { background:#fef2f2; color:#dc2626; }
        .adm-stat--blue  .adm-stat__ico { background:#eff6ff; color:#2563eb; }
        .adm-stat__val { font-size:22px; font-weight:800; color:#0f172a; line-height:1; }
        .adm-stat__lbl { font-size:11px; color:#94a3b8; margin-top:3px; }

        /* Filters row */
        .adm-filters { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
        .adm-filter-btn {
          padding:7px 16px; border-radius:8px; border:1.5px solid #e5e7eb;
          background:#fff; font-size:13px; font-weight:600; color:#64748b;
          cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:6px;
          font-family:inherit;
        }
        .adm-filter-btn:hover { border-color:#6366f1; color:#6366f1; }
        .adm-filter-btn--on { border-color:#6366f1; background:#eef2ff; color:#4f46e5; }
        .adm-filter-count {
          background:#ef4444; color:#fff; font-size:10px;
          padding:1px 6px; border-radius:20px; font-weight:800;
        }

        /* Table */
        .adm-table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:auto; }
        .adm-table { width:100%; border-collapse:collapse; font-size:13px; }
        .adm-table thead tr { background:#f8fafc; border-bottom:2px solid #e5e7eb; }
        .adm-table th {
          padding:11px 14px; text-align:left; font-size:11px; font-weight:700;
          color:#64748b; text-transform:uppercase; letter-spacing:.04em; white-space:nowrap;
        }
        .adm-table td { padding:12px 14px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
        .adm-table tbody tr:hover { background:#f8fafc; }
        .adm-table tbody tr:last-child td { border-bottom:none; }
        .adm-table__title { font-weight:600; color:#0f172a; font-size:13px; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .adm-table__id    { font-size:11px; color:#94a3b8; }
        .adm-table__user  { font-weight:600; color:#374151; }
        .adm-table__email { font-size:11px; color:#94a3b8; }
        .adm-table__gov   { font-size:12px; color:#64748b; }
        .adm-table__prix  { font-weight:700; color:#0f172a; font-size:13px; white-space:nowrap; }
        .adm-table__date  { font-size:12px; color:#64748b; white-space:nowrap; }

        /* Badges */
        .adm-badge { display:inline-block; font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; }
        .adm-badge--ok   { background:#f0fdf4; color:#15803d; }
        .adm-badge--warn { background:#fffbeb; color:#b45309; }
        .adm-badge--err  { background:#fef2f2; color:#b91c1c; }
        .adm-pill {
          display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase;
          letter-spacing:.04em; padding:2px 7px; border-radius:5px;
          background:#f1f5f9; color:#475569; margin-right:4px;
        }
        .adm-pill--cat    { background:#eef2ff; color:#4f46e5; }
        .adm-pill--admin  { background:#0f172a; color:#fff; }
        .adm-pill--agency { background:#f0fdf4; color:#15803d; }

        /* Actions */
        .adm-actions { display:flex; gap:6px; }
        .adm-action {
          width:30px; height:30px; border-radius:7px; border:1px solid #e5e7eb;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; background:#fff; text-decoration:none; color:#64748b;
          transition:all .15s;
        }
        .adm-action--view:hover   { border-color:#6366f1; color:#6366f1; background:#eef2ff; }
        .adm-action--ok:hover     { border-color:#16a34a; color:#16a34a; background:#f0fdf4; }
        .adm-action--reject:hover { border-color:#d97706; color:#d97706; background:#fffbeb; }
        .adm-action--del:hover    { border-color:#dc2626; color:#dc2626; background:#fef2f2; }

        /* ── Stats page ── */
        .adm-stats-page {}
        .adm-no-data { font-size:12px; color:#94a3b8; text-align:center; padding:12px 0; margin:0; }

        /* Zone filter bar */
        .adm-zone-bar {
          display:flex; align-items:center; gap:8px; flex-wrap:wrap;
          background:#fff; border:1px solid #e5e7eb; border-radius:12px;
          padding:12px 16px; margin-bottom:16px;
        }
        .adm-zone-bar__icon { color:#6366f1; display:flex; align-items:center; flex-shrink:0; }
        .adm-zone-bar__sep { width:1px; height:24px; background:#e5e7eb; margin:0 4px; flex-shrink:0; }
        .adm-zone-sel {
          padding:6px 10px; border:1.5px solid #e5e7eb; border-radius:8px;
          font-size:12.5px; font-family:inherit; color:#374151; background:#f9fafb;
          outline:none; cursor:pointer; transition:border-color .15s;
        }
        .adm-zone-sel:focus { border-color:#6366f1; background:#fff; }
        .adm-zone-sel:disabled { opacity:.45; cursor:not-allowed; }
        .adm-zone-clear {
          display:flex; align-items:center; gap:4px;
          padding:6px 12px; border-radius:7px; border:1px solid #fca5a5;
          background:#fef2f2; color:#dc2626; font-size:12px; font-weight:600;
          cursor:pointer; font-family:inherit; transition:all .15s;
        }
        .adm-zone-clear:hover { background:#fee2e2; }
        .adm-filter-active-badge {
          padding:4px 10px; border-radius:20px;
          background:#eef2ff; color:#4f46e5; font-size:11px; font-weight:700;
        }

        /* Date range */
        .adm-freq-range { display:flex; align-items:center; gap:6px; }
        .adm-freq-range label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; }
        .adm-freq-date {
          padding:5px 8px; border:1.5px solid #e5e7eb; border-radius:7px;
          font-size:12px; font-family:inherit; color:#374151; outline:none; transition:border-color .15s;
        }
        .adm-freq-date:focus { border-color:#6366f1; }

        /* KPI cards */
        .adm-kpi-row { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:16px; }
        .adm-kpi {
          background:#fff; border:1px solid #e5e7eb; border-radius:14px;
          padding:16px 14px; display:flex; align-items:center; gap:12px;
          transition:box-shadow .15s;
        }
        .adm-kpi:hover { box-shadow:0 4px 14px rgba(0,0,0,.06); }
        .adm-kpi__ico {
          width:40px; height:40px; border-radius:10px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
        }
        .adm-kpi--indigo .adm-kpi__ico { background:#eef2ff; color:#6366f1; }
        .adm-kpi--green  .adm-kpi__ico { background:#f0fdf4; color:#16a34a; }
        .adm-kpi--amber  .adm-kpi__ico { background:#fffbeb; color:#d97706; }
        .adm-kpi--blue   .adm-kpi__ico { background:#eff6ff; color:#2563eb; }
        .adm-kpi--teal   .adm-kpi__ico { background:#f0fdfa; color:#0d9488; }
        .adm-kpi--slate  .adm-kpi__ico { background:#f8fafc; color:#475569; }
        .adm-kpi__val { font-size:18px; font-weight:800; color:#0f172a; line-height:1.1; }
        .adm-kpi__lbl { font-size:10.5px; color:#94a3b8; margin-top:3px; white-space:nowrap; }

        /* Charts */
        .adm-chart-card {
          background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:20px;
        }
        .adm-chart-card h3 { font-size:14px; font-weight:700; color:#0f172a; margin:0 0 16px; }
        .adm-charts-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .adm-bar-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .adm-bar-label { font-size:12px; color:#64748b; width:110px; flex-shrink:0; display:flex; align-items:center; gap:5px; }
        .adm-bar-wrap { flex:1; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
        .adm-bar        { height:100%; background:#6366f1; border-radius:4px; transition:width .4s; }
        .adm-bar-val { font-size:12px; font-weight:700; color:#0f172a; width:24px; text-align:right; }

        /* Frequency chart */
        .adm-freq-card { margin-bottom:0; }
        .adm-freq-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; }
        .adm-freq-header h3 { margin-bottom:0; }
        .adm-freq-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .adm-freq-btn {
          padding:5px 13px; border-radius:7px; border:1.5px solid #e5e7eb;
          background:#f9fafb; font-size:12px; font-weight:600; color:#64748b;
          cursor:pointer; font-family:inherit; transition:all .15s;
        }
        .adm-freq-btn:hover { border-color:#6366f1; color:#4f46e5; }
        .adm-freq-btn--on { border-color:#6366f1; background:#eef2ff; color:#4f46e5; }
        .adm-freq-chart {
          display:flex; align-items:flex-end; gap:6px;
          height:180px; padding:0 4px; overflow-x:auto;
        }
        .adm-freq-col {
          display:flex; flex-direction:column; align-items:center; gap:4px;
          flex:1; min-width:36px; max-width:60px; height:100%;
        }
        .adm-freq-val { font-size:10px; font-weight:700; color:#4f46e5; white-space:nowrap; }
        .adm-freq-bar-wrap {
          flex:1; width:100%; display:flex; align-items:flex-end;
          background:#f1f5f9; border-radius:6px 6px 0 0; overflow:hidden;
        }
        .adm-freq-bar {
          width:100%; background:linear-gradient(180deg,#818cf8,#6366f1);
          border-radius:6px 6px 0 0; transition:height .4s ease; min-height:2px;
        }
        .adm-freq-lbl {
          font-size:9.5px; color:#94a3b8; text-align:center;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;
        }

        /* Zone price table */
        .adm-zone-table-wrap { overflow-x:auto; }
        .adm-zone-table { width:100%; border-collapse:collapse; font-size:13px; }
        .adm-zone-table thead tr { border-bottom:2px solid #f1f5f9; }
        .adm-zone-table th {
          padding:8px 12px; text-align:left; font-size:10.5px; font-weight:700;
          color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap;
        }
        .adm-zone-table td { padding:10px 12px; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .adm-zone-table tbody tr:hover { background:#fafafa; }
        .adm-zone-table tbody tr:last-child td { border-bottom:none; }
        .adm-zone-tr--top td { background:#fafafa; }
        .adm-zone-rank { font-size:12px; width:40px; }
        .adm-zone-medal {
          display:inline-flex; align-items:center; justify-content:center;
          width:22px; height:22px; border-radius:50%;
          font-size:11px; font-weight:800; color:#fff;
        }
        .adm-zone-medal--1 { background:linear-gradient(135deg,#f59e0b,#d97706); }
        .adm-zone-medal--2 { background:linear-gradient(135deg,#94a3b8,#64748b); }
        .adm-zone-medal--3 { background:linear-gradient(135deg,#d97706,#b45309); }
        .adm-zone-nom {
          display:flex; align-items:center; gap:6px;
          font-weight:600; color:#0f172a; font-size:13px;
        }
        .adm-zone-pct-wrap {
          display:flex; align-items:center; gap:8px; min-width:100px;
        }
        .adm-zone-pct-bar {
          height:6px; border-radius:3px; background:linear-gradient(90deg,#6366f1,#818cf8);
          transition:width .4s; min-width:2px;
        }
        .adm-zone-pct-lbl { font-size:11px; font-weight:600; color:#64748b; white-space:nowrap; }
        .adm-zone-prix { font-size:13px; color:#0f172a; }
        .adm-zone-m2-badge {
          display:inline-block; padding:2px 8px; border-radius:6px;
          background:#f0fdfa; color:#0d9488; font-size:11px; font-weight:700;
        }

        /* Empty / spinner */
        .adm-empty {
          text-align:center; padding:60px 20px; color:#94a3b8;
          display:flex; flex-direction:column; align-items:center; gap:12px;
        }
        .adm-spinner {
          width:32px; height:32px; border:3px solid #e5e7eb;
          border-top-color:#6366f1; border-radius:50%;
          animation:admSpin .7s linear infinite;
        }
        @keyframes admSpin { to { transform:rotate(360deg); } }

        /* ── Modals ── */
        .adm-modal-bg {
          position:fixed; inset:0; background:rgba(0,0,0,.4);
          z-index:9000; display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .adm-modal {
          background:#fff; border-radius:14px; width:100%; max-width:460px;
          box-shadow:0 20px 60px rgba(0,0,0,.2); overflow:hidden;
        }
        .adm-modal--agency      { max-width:600px; }
        .adm-modal--agency-view { max-width:640px; }
        .adm-modal__head {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 22px; border-bottom:1px solid #e5e7eb;
        }
        .adm-modal__head h2 { font-size:16px; font-weight:700; color:#0f172a; margin:0; }
        .adm-modal__body { padding:18px 22px; }
        .adm-modal__section-lbl {
          font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
          color:#94a3b8; margin-bottom:10px; margin-top:4px;
        }
        .adm-modal__body label { font-size:12px; font-weight:700; color:#374151; display:block; }
        .adm-modal__row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:12px; }
        .adm-modal__row > div { display:flex; flex-direction:column; }
        .adm-modal__body > div:not(.adm-modal__row) { margin-bottom:12px; }
        .adm-modal__input {
          width:100%; padding:9px 12px; border:1.5px solid #e2e8f0;
          border-radius:9px; font-size:13.5px; font-family:inherit; outline:none;
          color:#0f172a; box-sizing:border-box; margin-top:4px; background:#f9fafb;
          transition:border-color .15s;
        }
        .adm-modal__input:focus { border-color:#6366f1; background:#fff; }
        .adm-modal__textarea {
          width:100%; padding:10px 13px; border:1.5px solid #e2e8f0;
          border-radius:9px; font-size:14px; font-family:inherit; outline:none;
          resize:vertical; box-sizing:border-box;
        }
        .adm-modal__textarea:focus { border-color:#6366f1; }
        .adm-modal__foot {
          display:flex; justify-content:flex-end; gap:10px;
          padding:14px 22px; border-top:1px solid #e5e7eb; background:#f8fafc;
        }
        .adm-modal__cancel {
          padding:8px 16px; border-radius:8px; border:1px solid #e5e7eb;
          background:#fff; color:#374151; font-size:13px; cursor:pointer; font-family:inherit;
          transition:all .15s;
        }
        .adm-modal__cancel:hover { border-color:#6366f1; color:#4f46e5; }
        .adm-modal__save {
          display:flex; align-items:center; gap:7px;
          padding:9px 18px; border-radius:9px; border:none;
          color:#fff; font-size:13.5px; font-weight:700; cursor:pointer;
          font-family:inherit; transition:opacity .15s;
        }
        .adm-modal__save:disabled { opacity:.6; cursor:not-allowed; }
        .adm-modal__reject-btn {
          display:flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:8px; border:none;
          background:#dc2626; color:#fff; font-size:13px; font-weight:700;
          cursor:pointer; font-family:inherit;
        }

        /* Agency view modal KPIs */
        .adm-av-kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .adm-av-kpi {
          background:#f8fafc; border:1px solid #f1f5f9; border-radius:10px;
          padding:12px; text-align:center;
        }
        .adm-av-kpi--green { background:#f0fdf4; border-color:#dcfce7; }
        .adm-av-kpi--amber { background:#fffbeb; border-color:#fef3c7; }
        .adm-av-kpi--blue  { background:#eff6ff; border-color:#dbeafe; }
        .adm-av-kpi__val { font-size:22px; font-weight:800; color:#0f172a; line-height:1; }
        .adm-av-kpi__lbl { font-size:10px; color:#94a3b8; margin-top:4px; text-transform:uppercase; letter-spacing:.04em; }
        .adm-av-annonce {
          display:flex; align-items:center; gap:12px;
          padding:9px 12px; border:1px solid #f1f5f9; border-radius:9px;
          margin-bottom:6px; transition:background .1s;
        }
        .adm-av-annonce:hover { background:#f8fafc; }

        /* ── Agences tab ── */
        .adm-agences { padding:0; }
        .adm-agences__head {
          display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
          margin-bottom:20px; flex-wrap:wrap;
        }
        .adm-agences__title { font-size:18px; font-weight:800; color:#0f172a; margin:0; }
        .adm-agences__sub { font-size:13px; color:#94a3b8; margin-top:3px; }
        .adm-agences__create-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 18px; border-radius:10px; border:none;
          background:#6366f1; color:#fff; font-size:13px; font-weight:700;
          cursor:pointer; font-family:inherit; white-space:nowrap; transition:background .15s;
        }
        .adm-agences__create-btn:hover { background:#4f46e5; }

        .adm-agency-plan {
          display:flex; align-items:center; gap:14px;
          padding:16px 20px; background:#0f172a; border-radius:14px;
          margin-bottom:24px; flex-wrap:wrap;
        }
        .adm-agency-plan__ico {
          width:44px; height:44px; border-radius:11px;
          background:rgba(99,102,241,.25); color:#a5b4fc;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .adm-agency-plan__name  { font-size:14px; font-weight:800; color:#fff; }
        .adm-agency-plan__desc  { font-size:12px; color:#64748b; margin-top:2px; }
        .adm-agency-plan__price { margin-left:auto; font-size:24px; font-weight:900; color:#6366f1; }
        .adm-agency-plan__price span { font-size:12px; color:#64748b; font-weight:600; }
        .adm-agency-plan__warning {
          display:flex; align-items:center; gap:5px;
          font-size:11.5px; color:#f59e0b; font-weight:600;
          padding:5px 10px; background:rgba(245,158,11,.1); border-radius:8px;
        }

        .adm-agency-list { display:flex; flex-direction:column; gap:12px; }
        .adm-agency-card {
          background:#fff; border:1px solid #e5e7eb; border-radius:14px;
          padding:16px 18px; transition:box-shadow .15s;
        }
        .adm-agency-card:hover { box-shadow:0 3px 14px rgba(0,0,0,.06); }
        .adm-agency-card--suspended { opacity:.7; background:#fafafa; }
        .adm-agency-card__main { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .adm-agency-card__left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
        .adm-agency-card__avatar {
          width:44px; height:44px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#6366f1,#4f46e5);
          display:flex; align-items:center; justify-content:center;
          color:#fff; font-size:18px; font-weight:800;
        }
        .adm-agency-card--suspended .adm-agency-card__avatar { background:#94a3b8; }
        .adm-agency-card__name { font-size:15px; font-weight:700; color:#0f172a; }
        .adm-agency-card__meta { display:flex; gap:12px; flex-wrap:wrap; margin-top:4px; }
        .adm-agency-card__meta span { display:flex; align-items:center; gap:4px; font-size:12px; color:#64748b; }
        .adm-agency-card__right { display:flex; align-items:center; gap:10px; flex-shrink:0; flex-wrap:wrap; }
        .adm-agency-card__stats { display:flex; gap:10px; }
        .adm-agency-card__stats span { display:flex; align-items:center; gap:4px; font-size:12px; color:#94a3b8; font-weight:600; }
        .adm-agency-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700;
        }
        .adm-agency-badge--active { background:#f0fdf4; color:#15803d; }
        .adm-agency-badge--off    { background:#fef2f2; color:#b91c1c; }
        .adm-agency-view-btn {
          display:flex; align-items:center; gap:5px;
          padding:6px 12px; border-radius:8px; border:1.5px solid #e0e7ff;
          background:#eef2ff; color:#4f46e5; font-size:12px; font-weight:700;
          cursor:pointer; font-family:inherit; transition:all .15s;
        }
        .adm-agency-view-btn:hover { background:#e0e7ff; border-color:#6366f1; }
        .adm-agency-toggle {
          display:flex; align-items:center; gap:5px;
          padding:6px 12px; border-radius:8px; border:none;
          font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s;
        }
        .adm-agency-toggle--off { background:#fef2f2; color:#b91c1c; }
        .adm-agency-toggle--off:hover { background:#fee2e2; }
        .adm-agency-toggle--on  { background:#f0fdf4; color:#15803d; }
        .adm-agency-toggle--on:hover  { background:#dcfce7; }

        /* Agency note */
        .adm-agency-note-row { margin-top:10px; padding-top:10px; border-top:1px solid #f1f5f9; }
        .adm-agency-note-btn {
          display:flex; align-items:flex-start; gap:7px;
          background:none; border:none; cursor:pointer; font-family:inherit;
          font-size:12.5px; color:#64748b; padding:0; width:100%; text-align:left;
          transition:color .15s;
        }
        .adm-agency-note-btn:hover { color:#374151; }
        .adm-agency-note-text { font-size:12.5px; color:#374151; line-height:1.5; }
        .adm-agency-note-edit { display:flex; align-items:flex-start; gap:8px; }
        .adm-agency-note-input {
          flex:1; padding:8px 10px; border:1.5px solid #6366f1;
          border-radius:8px; font-size:12.5px; font-family:inherit; resize:vertical; outline:none;
          background:#fafcff;
        }
        .adm-agency-note-save {
          width:26px; height:26px; border-radius:6px; border:none;
          background:#dcfce7; color:#15803d; cursor:pointer;
          display:flex; align-items:center; justify-content:center; transition:background .15s;
        }
        .adm-agency-note-save:hover { background:#bbf7d0; }
        .adm-agency-note-cancel {
          width:26px; height:26px; border-radius:6px; border:none;
          background:#fef2f2; color:#b91c1c; cursor:pointer;
          display:flex; align-items:center; justify-content:center; transition:background .15s;
        }
        .adm-agency-note-cancel:hover { background:#fee2e2; }

        /* Agency creation warning */
        .adm-agency-warn {
          display:flex; align-items:flex-start; gap:8px;
          padding:10px 14px; background:#fef9c3; border:1px solid #fde68a;
          border-radius:10px; font-size:12px; color:#92400e; font-weight:500; margin-top:4px;
        }

        /* ── Table row clickable ── */
        .adm-table__row--clickable { cursor:pointer; }
        .adm-table__row--clickable:hover { background:#f0f4ff !important; }

        /* ── Responsive ── */
        @media (max-width:1400px) { .adm-kpi-row { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:1200px) { .adm-stats { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:1024px) { .adm-charts-row { grid-template-columns:1fr 1fr; } }
        @media (max-width:900px)  {
          .adm-page { flex-direction:column; }
          .adm-sidebar { width:100%; min-height:auto; flex-direction:row; flex-wrap:wrap; padding:10px; }
          .adm-charts-row { grid-template-columns:1fr; }
          .adm-kpi-row { grid-template-columns:repeat(2,1fr); }
          .adm-stats { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:600px) {
          .adm-kpi-row { grid-template-columns:1fr 1fr; }
          .adm-av-kpi-row { grid-template-columns:1fr 1fr; }
        }
      `}</style>
    </>
  );
}
