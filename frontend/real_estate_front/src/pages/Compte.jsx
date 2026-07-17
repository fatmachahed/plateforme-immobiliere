import React, { useState, useRef, useEffect, useMemo } from "react";
import API_URL, { fmtDevise, fmtPriceApprox, imgUrl } from "../config";
import heroBannerImg from "../assets/hero-compte.png";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import AlerteFiltersModal, { EMPTY_FORM } from "../components/AlerteFiltersModal";
import {
  User, Home, Heart, LogOut, Edit, Camera, Phone, Mail,
  Save, X, Building2, MapPin, FileText, Briefcase, Users,
  Eye, EyeOff, Edit2, Trash2, CheckCircle, Clock, XCircle, ArrowRight,
  Upload, Plus, Search, TrendingUp, Bell, Sparkles, Zap, Maximize, Bed, Bath,
  Copy, RefreshCw, Pencil, Star
} from "lucide-react";
import { useToast } from "../components/Toast";
import {
  useCompareMeta, toggleCompare as toggleCompareStore,
} from "../utils/compareStore";
import AnnonceDetailModal from "./AnnonceDetailModal";
import AgenceOnboarding from "./AgenceOnboarding";
import PromoteurOnboarding from "./PromoteurOnboarding";
import PublierAnnonceBtn from "../components/PublierAnnonceBtn";
import AgencyStatsDashboard from "../components/AgencyStatsDashboard";

/* ── helpers ── */
const TYPE_FR = {
  appartement:"Appartement", villa:"Villa", maison:"Maison",
  terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial",
  ferme:"Ferme agricole", ferme_agricole:"Ferme agricole",
  garage_parking:"Garage / Parking", depot_stockage:"Dépôt de stockage", batiment_industriel:"Bâtiment industriel",
  immobiliers_divers:"Immobiliers divers",
};
const CAT_FR_LABEL = { vente:"Vente", location:"Location", vacances:"Vacances" };
const CAT_FR2 = { vente:"Achat", location:"Location", vacances:"Vacances" };
const CAT_COLOR = { vente:"#6366f1", location:"#10b981", vacances:"#f59e0b" };
const TYPE_LABEL_MAP = {
  appartement:"Appartement", villa:"Villa/Maison", villa_maison:"Villa/Maison", maison:"Villa/Maison",
  immeuble:"Immeuble", terrain:"Terrain", bureau:"Bureau",
  ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", local_commercial:"Local commercial",
  garage_parking:"Garage / Parking", depot_stockage:"Dépôt de stockage", batiment_industriel:"Bâtiment industriel", immobiliers_divers:"Immobiliers divers",
};
const STATUS_LABEL_MAP = { approuvee:"En cours", en_attente:"En attente", refusee:"Refusée", vendue:"Vendu", louee:"Loué" };

function typeBienLabel(t) { return TYPE_LABEL_MAP[t] || t; }
function categorieLabel(c) { return CAT_FR_LABEL[c] || c; }

function statusBadge(s) {
  if (s === "approuvee") return { label:"Approuvée",  cls:"db-badge--ok",   icon:<CheckCircle size={12}/> };
  if (s === "refusee")   return { label:"Refusée",    cls:"db-badge--err",  icon:<XCircle size={12}/> };
  return                        { label:"En attente", cls:"db-badge--warn", icon:<Clock size={12}/> };
}

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

export default function Compte() {
  const toast    = useToast();
  const navigate = useNavigate();

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const token = localStorage.getItem("token");

  /* ── Active tab — URL-based so refresh keeps the tab ── */
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "profil";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: false });

  /* ── Interventions (partenaire only) ── */
  const [interventions,       setInterventions]       = useState([]);
  const [interventionsLoaded, setInterventionsLoaded] = useState(false);
  const [interventionsLoading,setInterventionsLoading]= useState(false);
  const [updatingIntervId,    setUpdatingIntervId]    = useState(null);

  /* ── Noter les services reçus (tout utilisateur ayant contacté un prestataire) ── */
  const [toRate,        setToRate]        = useState([]);
  const [toRateLoaded,  setToRateLoaded]  = useState(false);
  const [toRateLoading, setToRateLoading] = useState(false);
  const [ratingId,      setRatingId]      = useState(null); // id de la demande en cours de notation (envoi)

  /* ── Équipe (agence only) ── */
  const [agents,      setAgents]      = useState([]);
  const [agentLoading,setAgentLoading]= useState(false);
  const [agentLoaded, setAgentLoaded] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [deletingAgent,  setDeletingAgent]  = useState(null);
  const [agentForm, setAgentForm] = useState({ username:"", email:"", nom:"", prenom:"", password:"" });
  const [agentFormErr, setAgentFormErr] = useState("");
  const [agentSaving,  setAgentSaving]  = useState(false);
  const [agentViewMode,setAgentViewMode]= useState(false); // false=création, true=vue/édition
  const [agentEditMode,setAgentEditMode]= useState(false); // true=édition active (dans le mode vue)
  const [agentBeingEdited,setAgentBeingEdited]= useState(null); // id de l'agent en cours d'édition
  const [showAgentPwd, setShowAgentPwd] = useState(false);
  const [agentPwdCopied, setAgentPwdCopied] = useState(false);

  const genAgentPwd = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let p = "Loc@";
    for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
  };

  /* ──────── PROFIL ──────── */
  // Sépare un numéro complet (ex "+21622300992") en {code:"+216", local:"22300992"}
  function splitStoredPhone(full) {
    if (!full) return { code: "+216", local: "" };
    const codes = ["+216","+212","+213","+218","+966","+971","+974","+44","+33","+49","+32","+41","+90","+34","+39","+1"];
    codes.sort((a,b) => b.length - a.length); // codes longs en premier pour éviter les faux positifs
    for (const c of codes) {
      if (full.startsWith(c)) return { code: c, local: full.slice(c.length) };
    }
    return { code: "+216", local: full };
  }
  const _storedPhoneSplit = splitStoredPhone(storedUser?.phone_number || "");

  const [editing,         setEditing]         = useState(false);
  const [editing2,        setEditing2]        = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [usernameStatus,  setUsernameStatus]  = useState(null); // null|"checking"|"available"|"taken"|"too-short"
  const [phoneOtpModal, _setPhoneOtpModal] = useState(() => sessionStorage.getItem("phone_otp_pending") === "1");
  const setPhoneOtpModal = (v) => { _setPhoneOtpModal(v); if (v) sessionStorage.setItem("phone_otp_pending","1"); else sessionStorage.removeItem("phone_otp_pending"); };
  const [phoneOtpCode,  setPhoneOtpCode]  = useState("");
  const [phoneOtpErr,   setPhoneOtpErr]   = useState("");
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);

  /* Numéros de téléphone supplémentaires (en plus du numéro principal
     ci-dessus) — affichés dans la popup "Appeler" du détail d'annonce. */
  const [extraPhones,    setExtraPhones]    = useState([]);
  const [addingPhone,    setAddingPhone]    = useState(false);
  const [newPhoneValue,  setNewPhoneValue]  = useState("");
  const [phoneAddLoading,setPhoneAddLoading]= useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/users/me/phone-numbers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setExtraPhones(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []); // eslint-disable-line

  const handleAddPhone = async () => {
    const numero = newPhoneValue.trim();
    if (!numero) return;
    setPhoneAddLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/me/phone-numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ numero }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setExtraPhones(p => [...p, created]);
      setNewPhoneValue("");
      setAddingPhone(false);
      toast("Numéro ajouté !");
    } catch {
      toast("Impossible d'ajouter ce numéro. Réessayez.", "error");
    } finally {
      setPhoneAddLoading(false);
    }
  };

  const handleRemovePhone = async (id) => {
    const prev = extraPhones;
    setExtraPhones(p => p.filter(ph => ph.id !== id));
    try {
      const res = await fetch(`${API_URL}/users/me/phone-numbers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setExtraPhones(prev);
      toast("Impossible de supprimer ce numéro. Réessayez.", "error");
    }
  };

  const [profile, setProfile] = useState({
    username:           storedUser?.username           || "",
    email:              storedUser?.email              || "",
    phone_number:       _storedPhoneSplit.local,
    phone_code:         _storedPhoneSplit.code,
    profile_picture:    storedUser?.profile_picture    || "",
    nom:                storedUser?.nom                || "",
    prenom:             storedUser?.prenom             || "",
    nom_entreprise:     storedUser?.nom_entreprise     || "",
    profil_particulier: storedUser?.profil_particulier || "",
    sexe:               storedUser?.sexe               || "",
    objectif:           storedUser?.objectif           || "",
  });
  const [avatarPreview, setAvatarPreview]     = useState(storedUser?.profile_picture || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dragOver, setDragOver]               = useState(false);
  const fileInputRef = useRef(null);

  const isAgent = storedUser?.role === "agent";
  const isPro   = ["agence","promoteur","partenaire"].includes(storedUser?.role);
  const [proEditing, setProEditing] = useState(false);
  const [proSaving,  setProSaving]  = useState(false);
  const [proFields, setProFields] = useState({
    matricule_fiscal:  storedUser?.matricule_fiscal  || "",
    registre_commerce: storedUser?.registre_commerce || "",
    adresse:           storedUser?.adresse           || "",
    gouvernorat:       storedUser?.gouvernorat        || "",
    gouvernorat_id:    "",
    delegation:        storedUser?.localite           || "",
    delegation_id:     "",
    reference:         storedUser?.agency?.reference  || "",
    promoteur_reference: storedUser?.promoteur_reference || "",
    metier_artisan:    storedUser?.metier_artisan     || "",
  });
  const [gouvernorats, setGouvernorats] = useState([]);
  const [delegations,  setDelegations]  = useState([]);
  const [refStatus, setRefStatus] = useState("idle"); // idle | checking | available | taken | invalid
  const [proRefStatus, setProRefStatus] = useState("idle");
  const refDebounceRef = useRef(null);
  const proRefDebounceRef = useRef(null);

  /* ──────── ANNONCES (dashboard) ──────── */
  const [annonces, setAnnonces]         = useState([]);
  const [annLoading, setAnnLoading]     = useState(false);
  const [annLoaded,  setAnnLoaded]      = useState(false);
  const [annonceStats,  setAnnonceStats]  = useState({});
  const [refreshingId,  setRefreshingId]  = useState(null);
  const [delItem,    setDelItem]        = useState(null);
  const [previewAnnonceId, setPreviewAnnonceId] = useState(null);
  const [soldConfirm, setSoldConfirm]   = useState(null); // { id, label:'vendu'|'loue', titre }
  const [remettreCarte, setRemettreCarte] = useState(null); // { id, titre, categorie }
  const [search,     setSearch]         = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const _statutParam = searchParams.get("statut");
  const _statusInit = _statutParam === "en_attente" ? "En attente" : _statutParam === "approuvee" ? "En cours" : "";
  const [statusFilter, setStatusFilter] = useState(_statusInit);
  const [dateFilter, setDateFilter]     = useState("");
  const [dateStart,  setDateStart]      = useState("");
  const [dateEnd,    setDateEnd]        = useState("");
  const [agencesList, setAgencesList]   = useState([]);
  const [accomTracking, setAccomTracking] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_accom_tracking")||"{}"); } catch { return {}; }
  });

  /* ──────── CONTACTS ──────── */
  const [contactRequests, setContactRequests] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsLoaded,  setContactsLoaded]  = useState(false);
  const [expandedMsg, setExpandedMsg]         = useState(null);
  const [expandedAlertCrit, setExpandedAlertCrit] = useState({});

  /* ──────── ALERTES ──────── */
  const [savedSearches,     setSavedSearches]     = useState([]);
  const [loadingAlertes,    setLoadingAlertes]    = useState(false);
  const [alertesLoaded,     setAlertesLoaded]     = useState(false);
  const [alerteModal,       setAlerteModal]       = useState(null);
  const [alerteMatchCounts, setAlerteMatchCounts] = useState({});
  const [alerteForm,        setAlerteForm]        = useState({...EMPTY_FORM});
  const [alerteSaving,      setAlerteSaving]      = useState(false);
  const [alerteAccom, setAlerteAccom] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_alerte_accom")||"{}"); } catch { return {}; }
  });
  const [alerteAgence, setAlerteAgence] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_alerte_agence")||"{}"); } catch { return {}; }
  });

  /* ──────── FAVORIS ──────── */
  const [favoris,    setFavoris]    = useState([]);
  const compareMeta = useCompareMeta();
  const compareIds  = compareMeta.map(m => String(m.id));
  const [favLoading, setFavLoading] = useState(false);
  const [favLoaded,  setFavLoaded]  = useState(false);

  /* ── Load full profile from API and sync localStorage + local states ── */
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/users/me`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const merged = { ...JSON.parse(localStorage.getItem("user") || "{}"), ...data };
        localStorage.setItem("user", JSON.stringify(merged));
        setProfile(p => ({
          ...p,
          username:           data.username           || p.username,
          email:              data.email              || p.email,
          nom:                data.nom                ?? p.nom,
          prenom:             data.prenom             ?? p.prenom,
          nom_entreprise:     data.nom_entreprise     ?? p.nom_entreprise,
          profil_particulier: data.profil_particulier ?? p.profil_particulier,
          sexe:               data.sexe               ?? p.sexe,
          objectif:           data.objectif           ?? p.objectif,
        }));
        setProFields(p => ({
          ...p,
          matricule_fiscal:  data.matricule_fiscal  ?? p.matricule_fiscal,
          registre_commerce: data.registre_commerce ?? p.registre_commerce,
          adresse:           data.adresse           ?? p.adresse,
          gouvernorat:       data.gouvernorat        ?? p.gouvernorat,
          delegation:        data.localite           ?? p.delegation,
          metier_artisan:    data.metier_artisan     ?? p.metier_artisan,
        }));
      })
      .catch(() => {});
  }, [token]);

  /* ── Load pro ── */
  useEffect(() => {
    if (!isPro) return;
    fetch(`${API_URL}/localisation/gouvernorats`).then(r=>r.ok?r.json():[]).then(d=>setGouvernorats(Array.isArray(d)?d:[])).catch(()=>{});
  }, [isPro]);

  /* ── Load agences ── */
  useEffect(() => {
    fetch(`${API_URL}/users/agencies/public`).then(r=>r.ok?r.json():[]).then(d=>setAgencesList(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  /* ── Eager load contacts count for badge ── */
  useEffect(() => {
    if (!token || contactsLoaded) return;
    fetch(`${API_URL}/users/me/contact-requests`, { headers:{Authorization:`Bearer ${token}`} })
      .then(r=>r.ok?r.json():[]).then(d=>{ setContactRequests(Array.isArray(d)?d:[]); setContactsLoaded(true); })
      .catch(()=>setContactsLoaded(true));
  }, []);

  /* ── Eager load interventions count for badge (partenaire) ── */
  useEffect(() => {
    if (!token || interventionsLoaded || storedUser?.role !== "partenaire") return;
    fetch(`${API_URL}/users/interventions/mine`, { headers:{Authorization:`Bearer ${token}`} })
      .then(r=>r.ok?r.json():[]).then(d=>{ setInterventions(Array.isArray(d)?d:[]); setInterventionsLoaded(true); })
      .catch(()=>setInterventionsLoaded(true));
  }, []);

  /* ── Eager load "à noter" count for badge (tous les utilisateurs) ── */
  useEffect(() => {
    if (!token || toRateLoaded) return;
    fetch(`${API_URL}/users/interventions/to-rate`, { headers:{Authorization:`Bearer ${token}`} })
      .then(r=>r.ok?r.json():[]).then(d=>{ setToRate(Array.isArray(d)?d:[]); setToRateLoaded(true); })
      .catch(()=>setToRateLoaded(true));
  }, []);

  async function submitRating(demandeId, note) {
    setRatingId(demandeId);
    try {
      const r = await fetch(`${API_URL}/users/interventions/${demandeId}/rate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!r.ok) throw new Error();
      setToRate(prev => prev.filter(x => x.id !== demandeId));
      toast("Merci pour votre avis !");
    } catch { toast("Erreur lors de l'envoi de votre note.", "error"); }
    finally { setRatingId(null); }
  }

  /* ── Load tab data on demand ── */
  useEffect(() => {
    if (!token) return;
    if (tab === "annonces" && !annLoaded) {
      setAnnLoading(true);
      fetch(`${API_URL}/annonces/`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r => { if (r.status===401) navigate("/login?session=expired"); return r.ok?r.json():[]; })
        .then(data => {
          const s = Array.isArray(data)?[...data].sort((a,b)=>new Date(b.date_creation)-new Date(a.date_creation)):[];
          setAnnonces(s); setAnnLoaded(true);
          Promise.all(s.map(a =>
            fetch(`${API_URL}/annonces/${a.id}/stats`, { headers:{Authorization:`Bearer ${token}`} })
              .then(r=>r.ok?r.json():null).then(st=>st?[a.id,st]:null).catch(()=>null)
          )).then(results => {
            const map = {};
            results.filter(Boolean).forEach(([id,st])=>{ map[id]=st; });
            setAnnonceStats(map);
          });
        })
        .catch(()=>setAnnLoaded(true)).finally(()=>setAnnLoading(false));
    }
    if (tab === "contacts" && !contactsLoaded) {
      setLoadingContacts(true);
      fetch(`${API_URL}/users/me/contact-requests`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r=>r.ok?r.json():[]).then(d=>{ setContactRequests(Array.isArray(d)?d:[]); setContactsLoaded(true); })
        .catch(()=>setContactsLoaded(true)).finally(()=>{ setLoadingContacts(false); });
    }
    if (tab === "alertes" && !alertesLoaded) {
      setLoadingAlertes(true);
      fetch(`${API_URL}/users/me/saved-searches`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r=>r.ok?r.json():[]).then(data=>{ setSavedSearches(Array.isArray(data)?data:[]); setAlertesLoaded(true); data.forEach(s=>fetchAlerteCount(s)); })
        .catch(()=>setAlertesLoaded(true)).finally(()=>setLoadingAlertes(false));
    }
    if (tab === "favoris" && !favLoaded) {
      setFavLoading(true);
      fetch(`${API_URL}/users/me/favoris`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r=>r.ok?r.json():[]).then(d=>{ setFavoris(Array.isArray(d)?d:[]); setFavLoaded(true); })
        .catch(()=>setFavLoaded(true)).finally(()=>setFavLoading(false));
    }
    if (tab === "noter" && !toRateLoaded) {
      setToRateLoading(true);
      fetch(`${API_URL}/users/interventions/to-rate`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r=>r.ok?r.json():[]).then(d=>{ setToRate(Array.isArray(d)?d:[]); setToRateLoaded(true); })
        .catch(()=>setToRateLoaded(true)).finally(()=>setToRateLoading(false));
    }
  }, [tab, alertesLoaded]);

  if (!storedUser || !token) {
    return <div style={{minHeight:"100vh"}}><Navbar/><div style={{textAlign:"center",padding:80}}><p style={{color:"#64748b",marginBottom:16}}>Vous n'êtes pas connecté.</p><Link to="/login" style={{color:"#4f46e5",fontWeight:700}}>Se connecter</Link></div></div>;
  }

  /* ── Annonces filtered ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const sod = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const sow = new Date(sod); sow.setDate(sod.getDate()-sod.getDay());
    const som = new Date(now.getFullYear(),now.getMonth(),1);
    const cs = dateStart ? new Date(dateStart) : null;
    const ce = dateEnd   ? new Date(dateEnd+"T23:59:59") : null;
    return annonces.filter(a => {
      if (q) {
        const ok = (a.titre||"").toLowerCase().includes(q)||(a.type_bien||"").toLowerCase().includes(q)||(a.categorie||"").toLowerCase().includes(q)||(a.status||"").toLowerCase().includes(q)||typeBienLabel(a.type_bien).toLowerCase().includes(q)||categorieLabel(a.categorie).toLowerCase().includes(q);
        if (!ok) return false;
      }
      if (typeFilter) { const t = a.type_bien==="villa"||a.type_bien==="maison"?"villa_maison":a.type_bien; if(t!==typeFilter) return false; }
      if (statusFilter) { const ms = STATUS_LABEL_MAP[a.status]||a.status; if(ms!==statusFilter) return false; }
      if (dateFilter) {
        const c = new Date(a.date_creation);
        if(dateFilter==="Aujourd'hui" && c<sod) return false;
        if(dateFilter==="Cette semaine" && c<sow) return false;
        if(dateFilter==="Ce mois" && c<som) return false;
      }
      if ((cs||ce)) { const c=new Date(a.date_creation); if(cs&&c<cs) return false; if(ce&&c>ce) return false; }
      return true;
    });
  }, [annonces, search, typeFilter, statusFilter, dateFilter, dateStart, dateEnd]);

  const stats = { total:annonces.length, publiees:annonces.filter(a=>a.status==="approuvee").length, attente:annonces.filter(a=>a.status==="en_attente").length, vues:annonces.reduce((s,a)=>s+(a.views_count||0),0) };

  /* ── Handlers ── */
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); toast("Déconnexion réussie."); setTimeout(()=>{ window.location.href="/"; },800); };

  const handleRefresh = async (id) => {
    setRefreshingId(id);
    try {
      const res = await fetch(`${API_URL}/annonces/${id}/refresh`, { method:"PATCH", headers:{Authorization:`Bearer ${token}`} });
      if (res.ok) {
        setAnnonces(prev => {
          const updated = prev.map(a => a.id===id ? {...a, date_mise_a_jour: new Date().toISOString()} : a);
          return [...updated].sort((a,b)=>new Date(b.date_mise_a_jour||b.date_creation)-new Date(a.date_mise_a_jour||a.date_creation));
        });
        toast("Annonce remontée en tête de liste !");
      }
    } catch { toast("Erreur lors du refresh.","error"); }
    finally { setRefreshingId(null); }
  };

  const uploadFile = async (file) => {
    if (!file||!file.type.startsWith("image/")) { toast("Fichier non supporté.","error"); return; }
    if (file.size>5*1024*1024) { toast("Image trop lourde (max 5 MB).","error"); return; }
    setAvatarPreview(URL.createObjectURL(file)); setUploadingAvatar(true);
    try {
      const form = new FormData(); form.append("file",file);
      const res = await fetch(`${API_URL}/users/me/avatar`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
      if(!res.ok) throw new Error();
      const data = await res.json();
      setAvatarPreview(data.profile_picture); setProfile(p=>({...p,profile_picture:data.profile_picture}));
      localStorage.setItem("user",JSON.stringify({...storedUser,profile_picture:data.profile_picture}));
      toast("Photo mise à jour !");
    } catch { toast("Erreur upload.","error"); setAvatarPreview(profile.profile_picture); }
    finally { setUploadingAvatar(false); }
  };
  const handleAvatarChange = e => uploadFile(e.target.files?.[0]);
  const handleDrop = e => { e.preventDefault(); setDragOver(false); uploadFile(e.dataTransfer.files?.[0]); };

  const handleSaveProfile = async () => {
    if (usernameStatus === "taken" || usernameStatus === "too-short") {
      toast("Nom d'utilisateur invalide ou déjà pris.", "error");
      return;
    }
    setSaving(true);
    try {
      // phone_number contient maintenant seulement la partie locale (ex: "22300992")
      const localPart = (profile.phone_number || "").trim();
      const newPhone  = localPart ? `${profile.phone_code||"+216"}${localPart}` : null;
      const currentPhone = storedUser?.phone_number || "";
      // Si le numéro a changé → déclencher OTP avant de sauvegarder
      if (newPhone && newPhone !== currentPhone) {
        const otpRes = await fetch(`${API_URL}/users/me/request-phone-change`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ new_phone: newPhone }),
        });
        if (!otpRes.ok) {
          toast("Impossible d'envoyer le code de vérification. Vérifiez votre connexion.", "error");
          setSaving(false);
          return;
        }
        setPhoneOtpModal(true); setPhoneOtpCode(""); setPhoneOtpErr(""); setSaving(false); return;
      }
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ username: profile.username||undefined, phone_number: newPhone||undefined, nom: profile.nom||null, prenom: profile.prenom||null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      localStorage.setItem("user", JSON.stringify({...storedUser,...updated}));
      setEditing(false);
      toast("Profil mis à jour !");
    } catch { toast("Erreur lors de la sauvegarde.", "error"); } finally { setSaving(false); }
  };

  const handleSaveProfile2 = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me`,{method:"PUT",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({nom:profile.nom||null,prenom:profile.prenom||null,profil_particulier:profile.profil_particulier||null,sexe:profile.sexe||null,objectif:profile.objectif||null})});
      if(!res.ok) throw new Error();
      const updated = await res.json(); localStorage.setItem("user",JSON.stringify({...storedUser,...updated})); setEditing2(false); toast("Profil mis à jour !");
    } catch { toast("Erreur.","error"); } finally { setSaving(false); }
  };

  const checkReference = (val) => {
    if (!val.trim()) { setRefStatus("idle"); return; }
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]{3}$/.test(val)) { setRefStatus("invalid"); return; }
    setRefStatus("checking");
    clearTimeout(refDebounceRef.current);
    refDebounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/users/agency/check-reference?ref=${encodeURIComponent(val)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) { setRefStatus("idle"); return; }
        const data = await r.json();
        setRefStatus(data.available ? "available" : "taken");
      } catch { setRefStatus("idle"); }
    }, 500);
  };

  const checkPromoteurReference = (val) => {
    if (!val.trim()) { setProRefStatus("idle"); return; }
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]{3}$/.test(val)) { setProRefStatus("invalid"); return; }
    setProRefStatus("checking");
    clearTimeout(proRefDebounceRef.current);
    proRefDebounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/users/promoteur/check-reference?ref=${encodeURIComponent(val)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) { setProRefStatus("idle"); return; }
        const data = await r.json();
        setProRefStatus(data.available ? "available" : "taken");
      } catch { setProRefStatus("idle"); }
    }, 500);
  };

  const handleSavePro = async () => {
    if (storedUser?.role === "agence" && (refStatus === "taken" || refStatus === "invalid")) {
      toast("Référence invalide ou déjà utilisée.", "error"); return;
    }
    if (storedUser?.role === "promoteur" && (proRefStatus === "taken" || proRefStatus === "invalid")) {
      toast("Référence promoteur invalide ou déjà utilisée.", "error"); return;
    }
    setProSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me`,{method:"PUT",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({nom:profile.nom||null,prenom:profile.prenom||null,matricule_fiscal:proFields.matricule_fiscal||null,registre_commerce:proFields.registre_commerce||null,adresse:proFields.adresse||null,gouvernorat:proFields.gouvernorat||null,localite:proFields.delegation||null,metier_artisan:proFields.metier_artisan||null})});
      if(!res.ok) throw new Error();
      const updated = await res.json();
      // Save agency reference if agence role
      if (storedUser?.role === "agence" && proFields.reference) {
        const rr = await fetch(`${API_URL}/users/agency/reference`, { method:"PUT", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body: JSON.stringify({ reference: proFields.reference }) });
        if (!rr.ok) {
          const err = await rr.json().catch(()=>({}));
          throw new Error(err.detail || "Erreur référence");
        }
        const refData = await rr.json();
        const newUser = { ...storedUser, ...updated, agency: { ...(storedUser?.agency||{}), reference: refData.reference } };
        localStorage.setItem("user", JSON.stringify(newUser));
        setProEditing(false); toast("Infos pro mises à jour !");
        return;
      }
      // Save promoteur reference if promoteur role
      if (storedUser?.role === "promoteur" && proFields.promoteur_reference) {
        const rr = await fetch(`${API_URL}/users/promoteur/reference`, { method:"PUT", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body: JSON.stringify({ reference: proFields.promoteur_reference }) });
        if (!rr.ok) {
          const err = await rr.json().catch(()=>({}));
          throw new Error(err.detail || "Erreur référence promoteur");
        }
        const refData = await rr.json();
        const newUser = { ...storedUser, ...updated, promoteur_reference: refData.reference };
        localStorage.setItem("user", JSON.stringify(newUser));
        setProEditing(false); toast("Infos pro mises à jour !");
        return;
      }
      localStorage.setItem("user",JSON.stringify({...storedUser,...updated})); setProEditing(false); toast("Infos pro mises à jour !");
    } catch(e) { toast(e.message||"Erreur.","error"); } finally { setProSaving(false); }
  };

  const handleProGovChange = (govId, govNom) => {
    setProFields(p=>({...p,gouvernorat_id:govId,gouvernorat:govNom,delegation_id:"",delegation:""}));
    if(!govId){setDelegations([]);return;}
    fetch(`${API_URL}/localisation/delegations?gouvernorat_id=${govId}`).then(r=>r.ok?r.json():[]).then(d=>setDelegations(Array.isArray(d)?d:[])).catch(()=>{});
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/annonces/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
      if(!res.ok) throw new Error();
      setAnnonces(prev=>prev.filter(a=>a.id!==id)); setDelItem(null); toast("Annonce supprimée.");
    } catch { toast("Erreur suppression.","error"); }
  };

  const handleStatutPublication = async (id, statut) => {
    try {
      const res = await fetch(`${API_URL}/annonces/${id}/statut-publication`, {
        method:"PATCH", headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error();
      setAnnonces(prev => prev.map(a => a.id===id ? {...a, status: statut} : a));
      setSoldConfirm(null);
      toast(statut==="vendue" ? "Annonce marquée comme vendue." : "Annonce marquée comme louée.");
    } catch { toast("Erreur.","error"); }
  };

  const handleRemettreSurCarte = async (id) => {
    try {
      const res = await fetch(`${API_URL}/annonces/${id}/statut-publication`, {
        method:"PATCH", headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body: JSON.stringify({ statut: "en_attente" }),
      });
      if (!res.ok) throw new Error();
      setAnnonces(prev => prev.map(a => a.id===id ? {...a, status:"en_attente"} : a));
      setRemettreCarte(null);
      toast("Annonce soumise — en attente de validation.");
    } catch { toast("Erreur.","error"); }
  };

  const updateAnnonceAccompagnement = async (id, accompagnement, agence_id=undefined) => {
    try {
      const body={accompagnement}; if(agence_id!==undefined) body.agence_id=agence_id||null;
      const res=await fetch(`${API_URL}/annonces/${id}/accompagnement`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(res.ok){const data=await res.json(); setAnnonces(prev=>prev.map(a=>a.id===id?{...a,accompagnement:data.accompagnement,accompagnement_agence_id:data.accompagnement_agence_id,accompagnement_agence_nom:data.accompagnement_agence_nom}:a));}
    } catch {}
  };

  const updateAccomTracking = (annonceId, field, value) => {
    setAccomTracking(prev=>{const next={...prev,[annonceId]:{...(prev[annonceId]||{}),[field]:value}};try{localStorage.setItem("localizi_accom_tracking",JSON.stringify(next));}catch{}return next;});
  };

  const markAsRead = async (id) => {
    try{await fetch(`${API_URL}/users/me/contact-requests/${id}/lu`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});setContactRequests(prev=>prev.map(r=>r.id===id?{...r,lu:true}:r));}catch{}
  };
  const markAsUnread = async (id) => {
    try{await fetch(`${API_URL}/users/me/contact-requests/${id}/lu?lu=false`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});setContactRequests(prev=>prev.map(r=>r.id===id?{...r,lu:false}:r));}catch{}
  };

  async function fetchAlerteCount(s) {
    try {
      const c=s.criteres||{}; const params=new URLSearchParams();
      if(c.categories?.length===1) params.set("categorie",c.categories[0]);
      if(c.type) params.set("type_bien",c.type); if(c.govId) params.set("gouvernorat_id",c.govId);
      if(c.prixMin) params.set("prix_min",c.prixMin); if(c.prixMax) params.set("prix_max",c.prixMax);
      params.set("limit","500");
      const res=await fetch(`${API_URL}/annonces/public?${params}`); if(!res.ok) return;
      let filtered=(await res.json()).filter(a=>a.latitude&&a.longitude); // comme la carte : uniquement avec GPS
      // Le backend renvoie uniquement les annonces approuvées — filtres supplémentaires côté client :
      if(c.categories?.length>1) filtered=filtered.filter(a=>c.categories.includes(a.categorie));
      if(c.govNom&&!c.govId) filtered=filtered.filter(a=>(a.gouvernorat||"").toLowerCase()===c.govNom.toLowerCase());
      if(c.delNom) filtered=filtered.filter(a=>(a.delegation||"").toLowerCase()===c.delNom.toLowerCase());
      if(c.superficieMin) filtered=filtered.filter(a=>a.superficie>=Number(c.superficieMin));
      if(c.superficieMax) filtered=filtered.filter(a=>a.superficie<=Number(c.superficieMax));
      if(c.bedsMin) filtered=filtered.filter(a=>(a.nb_pieces||0)>=Number(c.bedsMin));
      // Filtrer par équipements/features
      if(c.features?.length>0){
        const FEAT_KEY_TO_LABEL={"vue_mer":"Vue sur mer","vue_montagne":"Vue sur montagne","vue_foret":"Vue sur forêt","jardin":"Jardin","terrasse":"Terrasse","balcon":"Balcon","piscine":"Piscine","parking":"Parking","ascenseur":"Ascenseur","garage":"Garage","cellier":"Chambre rangement","meuble":"Meublé","concierge":"Concierge","gardien":"Gardien","animaux_admis":"Animaux admis","digicode":"Digicode","interphone":"Interphone","salon_americain":"Salon américain","fibre_optique":"Fibre optique","cheminee":"Cheminée","climatisation":"Climatisation","chauffage_central":"Chauffage central","internet":"Internet","tv":"TV"};
        const requiredLabels=c.features.map(k=>FEAT_KEY_TO_LABEL[k]||k);
        filtered=filtered.filter(a=>{
          const aFeats=a.features||[];
          return requiredLabels.every(lbl=>aFeats.includes(lbl));
        });
      }
      setAlerteMatchCounts(prev=>({...prev,[s.id]:filtered.length}));
    } catch {}
  }

  async function saveAlerte() {
    if(!alerteForm.nom?.trim()){toast("Donnez un nom à cette alerte.","error");return;}
    setAlerteSaving(true);
    const{nom,email_alert,...criteres}=alerteForm;
    try {
      const isEdit=alerteModal&&alerteModal!=="new";
      const url=isEdit?`${API_URL}/users/me/saved-searches/${alerteModal.id}`:`${API_URL}/users/me/saved-searches`;
      const res=await fetch(url,{method:isEdit?"PUT":"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({nom,criteres,email_alert:!!email_alert})});
      if(res.ok){toast(isEdit?"Alerte mise à jour !":"Alerte enregistrée !"); setAlerteModal(null); setAlertesLoaded(false); setSearchParams({tab:"alertes"})}
      else toast("Erreur enregistrement.","error");
    } catch{toast("Serveur inaccessible.","error");}
    setAlerteSaving(false);
  }

  async function toggleAlerteEmail(id) {
    try {
      const res=await fetch(`${API_URL}/users/me/saved-searches/${id}/toggle`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});
      if(res.ok){const data=await res.json(); setSavedSearches(prev=>prev.map(s=>s.id===id?{...s,email_alert:data.email_alert}:s));}
    } catch {}
  }

  async function deleteAlert(id) {
    try{await fetch(`${API_URL}/users/me/saved-searches/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}); setSavedSearches(prev=>prev.filter(s=>s.id!==id)); toast("Alerte supprimée.");}catch{toast("Erreur.","error");}
  }

  function toggleAlerteAccom(id) {
    setAlerteAccom(prev=>{const next={...prev,[id]:!prev[id]};try{localStorage.setItem("localizi_alerte_accom",JSON.stringify(next));}catch{}return next;});
  }
  function setAlerteAgenceVal(alerteId, agenceId) {
    setAlerteAgence(prev=>{const next={...prev,[alerteId]:agenceId};try{localStorage.setItem("localizi_alerte_agence",JSON.stringify(next));}catch{}return next;});
  }

  const handleRemoveFav = async (id) => {
    try{await fetch(`${API_URL}/users/me/favoris/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}); setFavoris(prev=>prev.filter(f=>f.id!==id)); toast("Retiré des favoris.");}catch{toast("Erreur.","error");}
  };

  /* ── Load interventions (lazy, partenaire only) ── */
  useEffect(() => {
    if (tab !== "interventions" || interventionsLoaded || storedUser?.role !== "partenaire") return;
    setInterventionsLoading(true);
    fetch(`${API_URL}/users/interventions/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setInterventions(Array.isArray(d) ? d : []); setInterventionsLoaded(true); })
      .catch(() => {})
      .finally(() => setInterventionsLoading(false));
  }, [tab]); // eslint-disable-line

  async function setInterventionStatus(id, status) {
    setUpdatingIntervId(id);
    try {
      const r = await fetch(`${API_URL}/users/interventions/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error();
      setInterventions(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      toast(status === "realisee" ? "Intervention marquée comme réalisée ! Le client va être invité à noter votre service." : "Intervention remise en attente.");
    } catch { toast("Erreur lors de la mise à jour.", "error"); }
    finally { setUpdatingIntervId(null); }
  }

  async function deleteIntervention(id) {
    setUpdatingIntervId(id);
    try {
      const r = await fetch(`${API_URL}/users/interventions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      setInterventions(prev => prev.filter(i => i.id !== id));
      toast("Demande supprimée.");
    } catch { toast("Erreur lors de la suppression.", "error"); }
    finally { setUpdatingIntervId(null); }
  }

  /* ── Popup de confirmation "Marquer réalisée" / "Annuler" (interventions) ── */
  const [intervConfirm, setIntervConfirm] = useState(null); // { id, action: "realisee" | "annuler" }

  /* ── Load agents (lazy, agence only) ── */
  useEffect(() => {
    if (tab !== "equipe" || agentLoaded || storedUser?.role !== "agence") return;
    setAgentLoading(true);
    fetch(`${API_URL}/users/me/agents`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setAgents(Array.isArray(d) ? d : []); setAgentLoaded(true); })
      .catch(() => {})
      .finally(() => setAgentLoading(false));
  }, [tab]); // eslint-disable-line

  async function handleDeleteAgent(agentId, username) {
    if (!confirm(`Supprimer le compte de ${username} ? Cette action est irréversible.`)) return;
    setDeletingAgent(agentId);
    try {
      const r = await fetch(`${API_URL}/users/me/agents/${agentId}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
      if (!r.ok) throw new Error();
      toast(`Compte de ${username} supprimé.`);
      setAgents(prev => prev.filter(a => a.id !== agentId));
    } catch { toast("Erreur lors de la suppression.", "error"); }
    finally { setDeletingAgent(null); }
  }

  async function handleUpdateAgent(e) {
    e.preventDefault();
    setAgentFormErr("");
    if (!agentForm.email.trim()) { setAgentFormErr("L'email est obligatoire."); return; }
    setAgentSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me/agents/${agentBeingEdited}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: agentForm.email.trim(), nom: agentForm.nom.trim()||null, prenom: agentForm.prenom.trim()||null }),
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); setAgentFormErr(err.detail||"Erreur lors de la mise à jour."); return; }
      const data = await res.json();
      toast(`Agent @${data.username} mis à jour !`);
      setAgents(prev => prev.map(a => a.id === data.id ? { ...a, ...data } : a));
      setAgentEditMode(false);
      setAgentViewMode(true);
    } catch { setAgentFormErr("Erreur réseau."); }
    finally { setAgentSaving(false); }
  }

  async function handleCreateAgent(e) {
    e.preventDefault();
    setAgentFormErr("");
    if (!agentForm.username.trim() || !agentForm.email.trim()) { setAgentFormErr("Nom d'utilisateur et email sont obligatoires."); return; }
    setAgentSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me/agents`, {
        method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ username:agentForm.username.trim(), email:agentForm.email.trim(), password:agentForm.password, nom:agentForm.nom.trim()||undefined, prenom:agentForm.prenom.trim()||undefined }),
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); setAgentFormErr(err.detail||"Erreur lors de la création."); return; }
      const data = await res.json();
      toast(`Compte agent @${data.username} créé !`);
      // Sauvegarde locale du mot de passe provisoire
      try {
        const stored = JSON.parse(localStorage.getItem("localizi_agent_pwds")||"{}");
        stored[data.username] = agentForm.password;
        localStorage.setItem("localizi_agent_pwds", JSON.stringify(stored));
      } catch {}
      setAgents(prev => [...prev, data]);
      setShowAgentModal(false);
      setAgentForm({ username:"", email:"", nom:"", prenom:"", password:genAgentPwd() });
    } catch { setAgentFormErr("Erreur réseau."); }
    finally { setAgentSaving(false); }
  }

  function buildCarteUrl(criteres) {
    const c=criteres||{}; const p=new URLSearchParams();
    if(c.categories?.length>0) p.set("categories",c.categories.join(","));
    if(c.type)          p.set("type",       c.type);
    if(c.govNom)        p.set("gouvernorat",c.govNom);
    if(c.govId)         p.set("govId",      c.govId);
    if(c.delNom)        p.set("delegation", c.delNom);
    if(c.delId)         p.set("delId",      c.delId);
    if(c.locNom)        p.set("localite",   c.locNom);
    if(c.locId)         p.set("locId",      c.locId);
    if(c.prixMin)       p.set("prixMin",    c.prixMin);
    if(c.prixMax)       p.set("prixMax",    c.prixMax);
    if(c.superficieMin) p.set("sMin",       c.superficieMin);
    if(c.superficieMax) p.set("sMax",       c.superficieMax);
    if(c.bedsMin)       p.set("beds",       c.bedsMin);
    if(c.piecesMin)     p.set("pMin",       c.piecesMin);
    if(c.chambresMin)   p.set("cMin",       c.chambresMin);
    if(c.etat)          p.set("etat",       c.etat);
    if(c.titre_foncier) p.set("tf",         c.titre_foncier);
    if(c.type_terrain)  p.set("tterrain",   c.type_terrain);
    if(c.standing)      p.set("standing",   c.standing);
    if(c.anciennete)    p.set("anciennete", c.anciennete);
    if(c.etage_min)     p.set("etage_min",  c.etage_min);
    if(c.type_appartement) p.set("type_appt", c.type_appartement);
    if(c.colocation)    p.set("colocation", "1");
    if(c.features?.length>0) p.set("feat", c.features.join(","));
    return `/carte?${p.toString()}`;
  }

  const initials = (profile.username || "?")[0].toUpperCase();
  const roleLabel = { particulier:"Particulier", agent:"Agent", agence:"Agence", promoteur:"Promoteur", partenaire:"Partenaire", admin:"Admin" };
  const unreadCount = contactRequests.filter(r=>!r.lu).length;
  const pendingInterventions = interventions.filter(i=>i.status==="en_attente").length;
  const alertesCount = savedSearches.length;

  const [_onbVersion, _setOnbVersion] = useState(0);
  const _refreshOnb = () => _setOnbVersion(v => v + 1);

  const _onbKeyAgence = `localizi_onboarding_agence_${storedUser?.id||storedUser?.username||"anon"}`;
  const _onbKeyProm   = `localizi_onboarding_promoteur_${storedUser?.id||storedUser?.username||"anon"}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _onbAgence = (() => { try { return JSON.parse(localStorage.getItem(_onbKeyAgence)||"{}"); } catch { return {}; } })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _onbProm   = (() => { try { return JSON.parse(localStorage.getItem(_onbKeyProm)||"{}"); } catch { return {}; } })();

  function _onbInfo(data) {
    const step = data.step ?? null;
    const total = data.total || 5;
    const status = data.status || null;
    if (step === null) return null;
    const pct = (status === "soumis" || status === "accepte" || status === "refuse") ? 100 : Math.round(((step + 1) / total) * 100);
    const statusLabel = { soumis:"Soumis", accepte:"Accepté", refuse:"Refusé", en_cours:"En cours" }[status] || "En cours";
    const statusColor = { soumis:"#f59e0b", accepte:"#22c55e", refuse:"#ef4444", en_cours:"#6366f1" }[status] || "#6366f1";
    return { pct, statusLabel, statusColor };
  }

  const NAV_ITEMS = [
    { key:"profil",    icon:<User size={19}/>,   label:"Mon profil" },
    { key:"annonces",  icon:<Home size={19}/>,   label:"Mes annonces" },
    { key:"contacts",  icon:<Bell size={19}/>,   label:"Demandes reçues", badge: contactsLoaded ? unreadCount : 0 },
    { key:"alertes",   icon:<Bell size={19}/>,   label:"Mes alertes", badge: alertesLoaded ? alertesCount : 0 },
    { key:"favoris",   icon:<Heart size={19}/>,  label:"Mes favoris" },
    { key:"noter",     icon:<Star size={19}/>,   label:"Noter les services", badge: toRateLoaded ? toRate.length : 0 },
    ...(storedUser?.role==="partenaire"?[{key:"interventions",icon:<Briefcase size={19}/>,label:"Mes interventions", badge: interventionsLoaded ? pendingInterventions : 0}]:[]),
    { key:"statistiques", icon:<TrendingUp size={19}/>, label:"Statistiques" },
    ...(storedUser?.role==="agence"?[{key:"equipe",icon:<Users size={19}/>,label:"Mon équipe"}]:[]),
    ...(storedUser?.role==="agence"?[{key:"onboarding_agence",icon:<FileText size={19}/>,label:"Convention agence",onbInfo:_onbInfo(_onbAgence)}]:[]),
    ...(storedUser?.role==="promoteur"?[{key:"onboarding_promoteur",icon:<FileText size={19}/>,label:"Convention promoteur",onbInfo:_onbInfo(_onbProm)}]:[]),
  ];

  return (
    <div style={{minHeight:"100vh",background:"#f4f6fa",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <Navbar/>

      {/* ── Hero banner ── */}
      <div style={{
        position:"relative", height:260, overflow:"hidden",
        background:"#1e293b",
      }}>
        <img src={heroBannerImg} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 40%",opacity:.55}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:"0 40px",background:"linear-gradient(90deg,rgba(15,23,42,.7) 0%,rgba(15,23,42,.15) 100%)"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
              <div style={{width:56,height:56,borderRadius:"50%",overflow:"hidden",border:"3px solid rgba(255,255,255,.3)",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",flexShrink:0}}>
                {avatarPreview?<img src={imgUrl(avatarPreview)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
              </div>
              <div>
                <h1 style={{color:"#fff",fontSize:22,fontWeight:800,margin:0,lineHeight:1.2}}>{profile.username}</h1>
                <p style={{color:"rgba(255,255,255,.65)",fontSize:13,margin:"4px 0 0"}}>{profile.email}</p>
              </div>
            </div>
            {storedUser?.role&&<span style={{display:"inline-block",background:"rgba(99,102,241,.85)",color:"#fff",fontSize:11.5,fontWeight:700,padding:"3px 14px",borderRadius:999,backdropFilter:"blur(4px)"}}>{roleLabel[storedUser.role]||storedUser.role}</span>}
          </div>
        </div>
      </div>

      <div className="cpt-grid" style={{display:"grid",gridTemplateColumns:"290px 1fr",gap:24,maxWidth:"100%",margin:"0 auto",padding:"28px 24px",alignItems:"start"}}>

        {/* ══ SIDEBAR ══ */}
        <aside className="cpt-aside" style={{
          background:"#fff", borderRadius:18, border:"1px solid #e5e7eb",
          padding:"28px 16px 20px", position:"sticky", top:20,
          display:"flex", flexDirection:"column", gap:4,
          boxShadow:"0 4px 20px rgba(0,0,0,.07)",
        }}>
          {/* User mini */}
          <div style={{textAlign:"center",padding:"0 8px 22px",borderBottom:"1px solid #f1f5f9",marginBottom:8}}>
            <div style={{width:84,height:84,borderRadius:"50%",overflow:"hidden",margin:"0 auto 14px",border:"3px solid #e5e7eb",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:800,color:"#4f46e5"}}>
              {avatarPreview?<img src={imgUrl(avatarPreview)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
            </div>
            <div style={{fontWeight:800,fontSize:16,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.username}</div>
            <div style={{fontSize:12.5,color:"#94a3b8",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.email}</div>
            {storedUser?.role && <span style={{display:"inline-block",marginTop:8,fontSize:11.5,fontWeight:700,background:"#eef2ff",color:"#4f46e5",padding:"3px 12px",borderRadius:999}}>{roleLabel[storedUser.role]||storedUser.role}</span>}
          </div>

          {NAV_ITEMS.map(item => (
            <Link key={item.key} to={`/compte?tab=${item.key}`} style={{...sideNavStyle(tab===item.key),flexDirection:"column",alignItems:"stretch",gap:0,padding:"10px 14px"}} onClick={e=>{ e.preventDefault(); setTab(item.key); }}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                {item.icon}
                <span style={{flex:1}}>{item.label}</span>
                {item.badge>0&&<span style={{marginLeft:"auto",background:"#ef4444",color:"#fff",borderRadius:10,fontSize:11,fontWeight:800,padding:"2px 8px",minWidth:20,textAlign:"center"}}>{item.badge}</span>}
              </div>
              {item.onbInfo && (
                <div style={{marginTop:6,paddingLeft:28}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:10.5,fontWeight:700,color:item.onbInfo.statusColor}}>{item.onbInfo.statusLabel}</span>
                    <span style={{fontSize:10.5,color:"#94a3b8",fontWeight:600}}>{item.onbInfo.pct}%</span>
                  </div>
                  <div style={{height:4,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${item.onbInfo.pct}%`,background:item.onbInfo.statusColor,borderRadius:4,transition:"width .4s"}}/>
                  </div>
                </div>
              )}
            </Link>
          ))}

          <div style={{height:1,background:"#f1f5f9",margin:"10px 4px"}}/>
          <button onClick={handleLogout} style={{...sideNavStyle(false),color:"#dc2626"}}>
            <LogOut size={18}/> Déconnexion
          </button>
        </aside>

        {/* ══ MAIN CONTENT ══ */}
        <main style={{minWidth:0}}>

          {/* ═══ Bannière bienvenue première connexion ═══ */}
          {searchParams.get("welcome") === "1" && (
            <div style={{
              background:"linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)",
              border:"1.5px solid #a5b4fc",
              borderRadius:14,
              padding:"18px 22px",
              marginBottom:20,
              display:"flex",
              alignItems:"flex-start",
              gap:16,
            }}>
              <div style={{
                width:42,height:42,borderRadius:"50%",
                background:"#6366f1",
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0,fontSize:20,
              }}>🎉</div>
              <div style={{flex:1}}>
                <p style={{margin:"0 0 4px",fontSize:15,fontWeight:700,color:"#3730a3"}}>
                  Bienvenue sur Localizi ! Votre compte est actif.
                </p>
                <p style={{margin:"0 0 12px",fontSize:13,color:"#4338ca",lineHeight:1.6}}>
                  Pour profiter pleinement de la plateforme, veuillez compléter les informations de votre profil : nom, prénom, téléphone et objectif principal. Ces informations permettent aux autres utilisateurs de vous identifier et d'améliorer votre expérience.
                </p>
                <button
                  onClick={()=>setSearchParams({tab:"profil"},{replace:true})}
                  style={{padding:"7px 18px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                  Compléter mon profil →
                </button>
              </div>
              <button
                onClick={()=>setSearchParams(p=>{p.delete("welcome");return p},{replace:true})}
                style={{background:"none",border:"none",cursor:"pointer",color:"#6366f1",fontSize:18,lineHeight:1,flexShrink:0,padding:4}}>
                ✕
              </button>
            </div>
          )}

          {/* ═══════ PROFIL ═══════ */}
          {tab==="profil" && (
            <div className="cpt-profil-layout" style={{display:"flex",gap:20,alignItems:"flex-start"}}>

              {/* ── Colonne gauche 50% : infos + infos complémentaires ── */}
              <div className="cpt-profil-left" style={{flex:"0 0 calc(50% - 10px)",minWidth:0,display:"flex",flexDirection:"column",gap:16}}>

                {/* Section Mon profil */}
                <div className="cpt-profil-card" style={{...card,padding:"26px 28px 24px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                    <div>
                      <h2 style={cardTitle}>Mon profil</h2>
                      <p style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Informations de connexion</p>
                    </div>
                    {!editing
                      ?<button onClick={()=>setEditing(true)} style={btnSec}><Edit size={13}/> Modifier</button>
                      :<button onClick={()=>{setEditing(false);setUsernameStatus(null);}} style={btnSec}><X size={13}/> Annuler</button>
                    }
                  </div>
                  <div className="cpt-profil-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
                    <F label="Nom d'utilisateur">
                      <input
                        style={{
                          ...inp(editing),
                          ...(editing && usernameStatus==="taken"    ? {borderColor:"#ef4444",boxShadow:"0 0 0 3px rgba(239,68,68,.15)"}   : {}),
                          ...(editing && usernameStatus==="too-short"? {borderColor:"#ef4444",boxShadow:"0 0 0 3px rgba(239,68,68,.15)"}   : {}),
                          ...(editing && usernameStatus==="available" ? {borderColor:"#10b981",boxShadow:"0 0 0 3px rgba(16,185,129,.15)"} : {}),
                        }}
                        value={profile.username}
                        readOnly={!editing}
                        onChange={e => { setProfile(p=>({...p,username:e.target.value})); setUsernameStatus(null); }}
                        onBlur={async e => {
                          if (!editing) return;
                          const v = e.target.value.trim();
                          if (!v) return;
                          if (v === storedUser?.username) { setUsernameStatus(null); return; }
                          if (v.length < 4) { setUsernameStatus("too-short"); return; }
                          setUsernameStatus("checking");
                          try {
                            const r = await fetch(`${API_URL}/users/check-username?username=${encodeURIComponent(v)}`);
                            const d = await r.json();
                            setUsernameStatus(d.available ? "available" : "taken");
                          } catch { setUsernameStatus(null); }
                        }}
                      />
                      {editing && usernameStatus === "checking"  && <div style={{marginTop:5,fontSize:12,color:"#94a3b8",fontWeight:500}}>Vérification…</div>}
                      {editing && usernameStatus === "too-short" && <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,fontSize:12,color:"#ef4444",fontWeight:500}}><span>✗</span> Au moins 4 caractères requis</div>}
                      {editing && usernameStatus === "available" && <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,fontSize:12,color:"#10b981",fontWeight:600}}><span>✓</span> Nom d'utilisateur disponible</div>}
                      {editing && usernameStatus === "taken"     && <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,fontSize:12,color:"#ef4444",fontWeight:500}}><span>✗</span> Ce nom d'utilisateur est déjà pris</div>}
                    </F>
                    <F label="E-mail"><input style={inp(false)} value={profile.email} readOnly/></F>
                    <F label="Rôle">
                      <input
                        style={{...inp(false),background:"#f1f5f9",color:"#64748b",cursor:"not-allowed"}}
                        value={({particulier:"Particulier",agent:"Agent",agence:"Agence",promoteur:"Promoteur",partenaire:"Partenaire",admin:"Administrateur"})[storedUser?.role] || storedUser?.role || "—"}
                        readOnly
                      />
                    </F>
                    <F label="Téléphone">
                      <div style={{display:"flex",gap:5}}>
                        <select style={{...inp(editing),width:80,cursor:editing?"pointer":"default",fontSize:12,flexShrink:0}} value={profile.phone_code||"+216"} disabled={!editing} onChange={e=>setProfile(p=>({...p,phone_code:e.target.value}))}>
                          {[
                            {code:"+216",flag:"🇹🇳",name:"Tunisie"},
                            {code:"+33", flag:"🇫🇷",name:"France"},
                            {code:"+1",  flag:"🇺🇸",name:"USA/Canada"},
                            {code:"+44", flag:"🇬🇧",name:"Royaume-Uni"},
                            {code:"+49", flag:"🇩🇪",name:"Allemagne"},
                            {code:"+32", flag:"🇧🇪",name:"Belgique"},
                            {code:"+41", flag:"🇨🇭",name:"Suisse"},
                            {code:"+212",flag:"🇲🇦",name:"Maroc"},
                            {code:"+213",flag:"🇩🇿",name:"Algérie"},
                            {code:"+218",flag:"🇱🇾",name:"Libye"},
                            {code:"+966",flag:"🇸🇦",name:"Arabie Saoudite"},
                            {code:"+971",flag:"🇦🇪",name:"Émirats Arabes Unis"},
                            {code:"+974",flag:"🇶🇦",name:"Qatar"},
                            {code:"+90", flag:"🇹🇷",name:"Turquie"},
                            {code:"+34", flag:"🇪🇸",name:"Espagne"},
                            {code:"+39", flag:"🇮🇹",name:"Italie"},
                          ].map(({code,flag,name})=><option key={code} value={code}>{flag} {code}</option>)}
                        </select>
                        <input style={{...inp(editing),flex:1,minWidth:0}} value={profile.phone_number||""} readOnly={!editing} placeholder="12 345 678" onChange={e=>setProfile(p=>({...p,phone_number:e.target.value}))}/>
                      </div>

                      {/* Numéros supplémentaires — visibles par les acheteurs via "Appeler" */}
                      <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
                        {extraPhones.map(ph => (
                          <div key={ph.id} style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"7px 10px"}}>
                            <span style={{flex:1,fontSize:13,color:"#374151",fontWeight:600}}>{ph.numero}</span>
                            <button onClick={()=>handleRemovePhone(ph.id)} title="Supprimer ce numéro"
                              style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:2,display:"flex"}}>
                              <X size={15}/>
                            </button>
                          </div>
                        ))}
                        {addingPhone ? (
                          <div style={{display:"flex",gap:6}}>
                            <input autoFocus value={newPhoneValue} onChange={e=>setNewPhoneValue(e.target.value)}
                              placeholder="+216 XX XXX XXX" onKeyDown={e=>e.key==="Enter"&&handleAddPhone()}
                              style={{...inp(true),flex:1,minWidth:0}}/>
                            <button onClick={handleAddPhone} disabled={phoneAddLoading||!newPhoneValue.trim()}
                              style={{...btnSec,opacity:phoneAddLoading||!newPhoneValue.trim()?.6:1}}>
                              {phoneAddLoading?"…":"Ajouter"}
                            </button>
                            <button onClick={()=>{setAddingPhone(false);setNewPhoneValue("");}} style={btnSec}><X size={13}/></button>
                          </div>
                        ) : (
                          <button onClick={()=>setAddingPhone(true)} style={{...btnSec,alignSelf:"flex-start",display:"flex",alignItems:"center",gap:6}}>
                            <Plus size={13}/> Ajouter un numéro
                          </button>
                        )}
                      </div>
                    </F>
                  </div>
                  {editing&&<button onClick={handleSaveProfile} disabled={saving} style={{...saveBtn,marginTop:16}}><Save size={14}/> {saving?"Sauvegarde…":"Enregistrer"}</button>}
                </div>

                {/* Section Informations complémentaires (selon rôle) */}
                <div className="cpt-profil-card" style={{...card,padding:"26px 28px 24px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                    <div>
                      <h2 style={cardTitle}>Informations complémentaires</h2>
                      <p style={{fontSize:12,color:"#94a3b8",marginTop:2}}>
                        {storedUser?.role==="particulier"?"Informations personnelles":isAgent?"Informations agent":"Informations professionnelles"}
                      </p>
                    </div>
                    {/* Particulier : editing2 indépendant */}
                    {storedUser?.role==="particulier"&&(
                      !editing2
                        ?<button onClick={()=>setEditing2(true)} style={btnSec}><Edit size={13}/> Modifier</button>
                        :<button onClick={()=>setEditing2(false)} style={btnSec}><X size={13}/> Annuler</button>
                    )}
                    {/* Agent / Pro : proEditing */}
                    {(isAgent||isPro)&&(
                      !proEditing
                        ?<button onClick={()=>setProEditing(true)} style={btnSec}><Edit size={13}/> Modifier</button>
                        :<button onClick={()=>setProEditing(false)} style={btnSec}><X size={13}/> Annuler</button>
                    )}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
                    {/* Particulier : nom + prénom + profil + sexe */}
                    {storedUser?.role==="particulier"&&<>
                      <F label="Nom"><input style={inp(editing2)} value={profile.nom} readOnly={!editing2} placeholder={editing2?"Votre nom":"—"} onChange={e=>setProfile(p=>({...p,nom:e.target.value}))}/></F>
                      <F label="Prénom"><input style={inp(editing2)} value={profile.prenom} readOnly={!editing2} placeholder={editing2?"Votre prénom":"—"} onChange={e=>setProfile(p=>({...p,prenom:e.target.value}))}/></F>
                      <F label="Votre profil">
                        {editing2
                          ? <select style={{...inp(true),cursor:"pointer"}} value={profile.profil_particulier||""} onChange={e=>setProfile(p=>({...p,profil_particulier:e.target.value}))}>
                              <option value="">— Sélectionner —</option>
                              <option value="etudiant">Étudiant(e)</option>
                              <option value="jeune_actif">Jeune actif / Premier achat</option>
                              <option value="parent">Parent / Famille</option>
                              <option value="couple">Couple</option>
                              <option value="retraite">Retraité(e)</option>
                              <option value="investisseur">Investisseur</option>
                            </select>
                          : <input style={inp(false)} value={profile.profil_particulier||""} readOnly placeholder="—"/>
                        }
                      </F>
                      <F label="Mon objectif principal">
                        {editing2
                          ? <select style={{...inp(true),cursor:"pointer"}} value={profile.objectif||""} onChange={e=>setProfile(p=>({...p,objectif:e.target.value}))}>
                              <option value="">— Sélectionner —</option>
                              <option value="autre">Peu importe / Autre</option>
                              <option value="achete">J'achète</option>
                              <option value="vend">Je vends</option>
                              <option value="loue">Je loue</option>
                              <option value="met_location">Je mets en location</option>
                            </select>
                          : <input style={inp(false)} value={({achete:"J'achète",vend:"Je vends",loue:"Je loue",met_location:"Je mets en location",autre:"Peu importe / Autre"})[profile.objectif]||""} readOnly placeholder="—"/>
                        }
                      </F>
                      <F label="Sexe">
                        {editing2
                          ? <div style={{display:"flex",gap:6}}>
                              {[{v:"homme",l:"♂ Homme"},{v:"femme",l:"♀ Femme"}].map(({v,l})=>(
                                <button key={v} type="button" onClick={()=>setProfile(p=>({...p,sexe:v}))}
                                  style={{padding:"7px 10px",borderRadius:8,border:"1.5px solid",borderColor:profile.sexe===v?"#6366f1":"#e2e8f0",background:profile.sexe===v?"#eef2ff":"#f8fafc",color:profile.sexe===v?"#4f46e5":"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,transition:"all .15s",whiteSpace:"nowrap"}}>
                                  {l}
                                </button>
                              ))}
                            </div>
                          : <input style={inp(false)} value={profile.sexe==="homme"?"♂ Homme":profile.sexe==="femme"?"♀ Femme":""} readOnly placeholder="—"/>
                        }
                      </F>
                    </>}
                    {/* Agent : nom + prénom + agence + infos pro */}
                    {isAgent&&<>
                      <F label="Nom"><input style={inp(proEditing)} value={profile.nom} readOnly={!proEditing} placeholder={proEditing?"Votre nom":"—"} onChange={e=>setProfile(p=>({...p,nom:e.target.value}))}/></F>
                      <F label="Prénom"><input style={inp(proEditing)} value={profile.prenom} readOnly={!proEditing} placeholder={proEditing?"Votre prénom":"—"} onChange={e=>setProfile(p=>({...p,prenom:e.target.value}))}/></F>
                      <F label="Agence" full><input style={{...inp(false),background:"#f8fafc",color:"#64748b"}} value={profile.nom_entreprise||"—"} readOnly/></F>
                      <F label="Matricule fiscal"><input style={inp(proEditing)} value={proFields.matricule_fiscal} readOnly={!proEditing} placeholder={proEditing?"Ex : 1234567/A/M/000":"Non renseigné"} onChange={e=>setProFields(p=>({...p,matricule_fiscal:e.target.value}))}/></F>
                      <F label="Registre de commerce"><input style={inp(proEditing)} value={proFields.registre_commerce} readOnly={!proEditing} placeholder={proEditing?"Ex : B012345/2020":"Non renseigné"} onChange={e=>setProFields(p=>({...p,registre_commerce:e.target.value}))}/></F>
                      <F label="Gouvernorat">{proEditing?<select style={{...inp(true),cursor:"pointer"}} value={proFields.gouvernorat_id} onChange={e=>{const o=e.target.options[e.target.selectedIndex];handleProGovChange(e.target.value,o.text==="— Choisir —"?"":o.text);}}><option value="">— Choisir —</option>{gouvernorats.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select>:<input style={inp(false)} value={proFields.gouvernorat||""} readOnly placeholder="Non renseigné"/>}</F>
                      <F label="Délégation">{proEditing&&delegations.length>0?<select style={{...inp(true),cursor:"pointer"}} value={proFields.delegation_id} onChange={e=>{const o=e.target.options[e.target.selectedIndex];setProFields(p=>({...p,delegation_id:e.target.value,delegation:o.text==="— Toutes —"?"":o.text}));}}><option value="">— Toutes —</option>{delegations.map(d=><option key={d.id} value={d.id}>{d.nom}</option>)}</select>:<input style={inp(proEditing&&delegations.length===0)} value={proFields.delegation||""} readOnly={!proEditing||delegations.length>0} placeholder={proEditing&&!proFields.gouvernorat_id?"Choisissez d'abord un gouvernorat":"Non renseignée"} onChange={e=>setProFields(p=>({...p,delegation:e.target.value}))}/>}</F>
                      <F label="Adresse" full><input style={inp(proEditing)} value={proFields.adresse} readOnly={!proEditing} placeholder={proEditing?"Ex : 12 rue de la Liberté, La Marsa":"Non renseignée"} onChange={e=>setProFields(p=>({...p,adresse:e.target.value}))}/></F>
                    </>}
                    {/* ── Partenaire : secteur verrouillé + métier si artisan ── */}
                    {storedUser?.role==="partenaire"&&<>
                      {!["banques","assurances"].includes(storedUser?.secteur_partenaire)&&<>
                        <F label="Nom"><input style={inp(proEditing)} value={profile.nom} readOnly={!proEditing} placeholder={proEditing?"Votre nom":"—"} onChange={e=>setProfile(p=>({...p,nom:e.target.value}))}/></F>
                        <F label="Prénom"><input style={inp(proEditing)} value={profile.prenom} readOnly={!proEditing} placeholder={proEditing?"Votre prénom":"—"} onChange={e=>setProfile(p=>({...p,prenom:e.target.value}))}/></F>
                      </>}
                      <div style={{display:"contents"}}>
                        <F label="Secteur d'activité" full={storedUser?.secteur_partenaire!=="artisans"}>
                          <input
                            style={{...inp(false),background:"#f1f5f9",color:"#64748b",cursor:"not-allowed"}}
                            value={({banques:"Banque",assurances:"Assurance",notaires_avocats:"Notaire / Avocat",architectes:"Architecte",artisans:"Artisan / Professionnel du bâtiment"})[storedUser?.secteur_partenaire] || storedUser?.secteur_partenaire || "—"}
                            readOnly
                          />
                        </F>
                        {storedUser?.secteur_partenaire==="artisans"&&(
                          <F label="Métier">
                            {proEditing
                              ?<select style={{...inp(true),cursor:"pointer"}} value={proFields.metier_artisan} onChange={e=>setProFields(p=>({...p,metier_artisan:e.target.value}))}>
                                  <option value="">— Sélectionnez —</option>
                                  {["Maçon / Gros œuvre","Plombier","Électricien","Peintre en bâtiment","Carreleur","Menuisier","Charpentier","Couvreur","Plâtrier","Serrurier / Métallier","Climaticien / Chauffagiste","Cuisiniste","Architecte d'intérieur","Géomètre / Topographe","Expert immobilier","Photographe immobilier","Déménageur","Autre"].map(m=>(
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              :<input style={inp(false)} value={proFields.metier_artisan||""} readOnly placeholder="Non renseigné"/>
                            }
                          </F>
                        )}
                      </div>
                      <F label="Gouvernorat">{proEditing?<select style={{...inp(true),cursor:"pointer"}} value={proFields.gouvernorat_id} onChange={e=>{const o=e.target.options[e.target.selectedIndex];handleProGovChange(e.target.value,o.text==="— Choisir —"?"":o.text);}}><option value="">— Choisir —</option>{gouvernorats.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select>:<input style={inp(false)} value={proFields.gouvernorat||""} readOnly placeholder="Non renseigné"/>}</F>
                      <F label="Délégation">{proEditing&&delegations.length>0?<select style={{...inp(true),cursor:"pointer"}} value={proFields.delegation_id} onChange={e=>{const o=e.target.options[e.target.selectedIndex];setProFields(p=>({...p,delegation_id:e.target.value,delegation:o.text==="— Toutes —"?"":o.text}));}}><option value="">— Toutes —</option>{delegations.map(d=><option key={d.id} value={d.id}>{d.nom}</option>)}</select>:<input style={inp(proEditing&&delegations.length===0)} value={proFields.delegation||""} readOnly={!proEditing||delegations.length>0} placeholder={proEditing&&!proFields.gouvernorat_id?"Choisissez d'abord un gouvernorat":"Non renseignée"} onChange={e=>setProFields(p=>({...p,delegation:e.target.value}))}/>}</F>
                      <F label="Adresse" full><input style={inp(proEditing)} value={proFields.adresse} readOnly={!proEditing} placeholder={proEditing?"Ex : 12 rue de la Liberté":"Non renseignée"} onChange={e=>setProFields(p=>({...p,adresse:e.target.value}))}/></F>
                    </>}

                    {/* ── Promoteur / Agence (hors agent) ── */}
                    {isPro&&!isAgent&&storedUser?.role!=="partenaire"&&<>
                      <F label="Matricule fiscal"><input style={inp(proEditing)} value={proFields.matricule_fiscal} readOnly={!proEditing} placeholder={proEditing?"Ex : 1234567/A/M/000":"Non renseigné"} onChange={e=>setProFields(p=>({...p,matricule_fiscal:e.target.value}))}/></F>
                      <F label="Registre de commerce"><input style={inp(proEditing)} value={proFields.registre_commerce} readOnly={!proEditing} placeholder={proEditing?"Ex : B012345/2020":"Non renseigné"} onChange={e=>setProFields(p=>({...p,registre_commerce:e.target.value}))}/></F>
                      <F label="Gouvernorat">{proEditing?<select style={{...inp(true),cursor:"pointer"}} value={proFields.gouvernorat_id} onChange={e=>{const o=e.target.options[e.target.selectedIndex];handleProGovChange(e.target.value,o.text==="— Choisir —"?"":o.text);}}><option value="">— Choisir —</option>{gouvernorats.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select>:<input style={inp(false)} value={proFields.gouvernorat||""} readOnly placeholder="Non renseigné"/>}</F>
                      <F label="Délégation">{proEditing&&delegations.length>0?<select style={{...inp(true),cursor:"pointer"}} value={proFields.delegation_id} onChange={e=>{const o=e.target.options[e.target.selectedIndex];setProFields(p=>({...p,delegation_id:e.target.value,delegation:o.text==="— Toutes —"?"":o.text}));}}><option value="">— Toutes —</option>{delegations.map(d=><option key={d.id} value={d.id}>{d.nom}</option>)}</select>:<input style={inp(proEditing&&delegations.length===0)} value={proFields.delegation||""} readOnly={!proEditing||delegations.length>0} placeholder={proEditing&&!proFields.gouvernorat_id?"Choisissez d'abord un gouvernorat":"Non renseignée"} onChange={e=>setProFields(p=>({...p,delegation:e.target.value}))}/>}</F>
                      {storedUser?.role==="agence"
                        ? <>
                            <F label="Adresse"><input style={inp(proEditing)} value={proFields.adresse} readOnly={!proEditing} placeholder={proEditing?"Ex : 12 rue de la Liberté, La Marsa":"Non renseignée"} onChange={e=>setProFields(p=>({...p,adresse:e.target.value}))}/></F>
                            <F label="Référence agence">
                              <div style={{position:"relative"}}>
                                <input
                                  style={{...inp(proEditing),paddingRight:proEditing?36:undefined}}
                                  value={proFields.reference}
                                  readOnly={!proEditing}
                                  placeholder={proEditing?"Ex : LOC":"Non renseignée"}
                                  maxLength={3}
                                  onChange={e=>{
                                    const cleaned = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,"").slice(0,3).toUpperCase();
                                    setProFields(p=>({...p,reference:cleaned}));
                                    if(proEditing) checkReference(cleaned);
                                  }}
                                />
                                {proEditing&&proFields.reference&&(
                                  <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:16}}>
                                    {refStatus==="checking"&&<span style={{color:"#94a3b8",fontSize:12}}>…</span>}
                                    {refStatus==="available"&&<span style={{color:"#16a34a"}}>✓</span>}
                                    {refStatus==="taken"&&<span style={{color:"#dc2626"}}>✗</span>}
                                    {refStatus==="invalid"&&<span style={{color:"#dc2626"}}>✗</span>}
                                  </span>
                                )}
                              </div>
                              {proEditing&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Exactement 3 lettres · pas de chiffres ni de caractères spéciaux.</div>}
                              {proEditing&&refStatus==="taken"&&<div style={{fontSize:11,color:"#dc2626",marginTop:2}}>Référence déjà utilisée par une autre agence.</div>}
                              {proEditing&&refStatus==="invalid"&&<div style={{fontSize:11,color:"#dc2626",marginTop:2}}>Exactement 3 lettres uniquement.</div>}
                              {proEditing&&refStatus==="available"&&<div style={{fontSize:11,color:"#16a34a",marginTop:2}}>Référence disponible.</div>}
                            </F>
                          </>
                        : storedUser?.role==="promoteur"
                        ? <>
                            <F label="Adresse" full><input style={inp(proEditing)} value={proFields.adresse} readOnly={!proEditing} placeholder={proEditing?"Ex : 12 rue de la Liberté, La Marsa":"Non renseignée"} onChange={e=>setProFields(p=>({...p,adresse:e.target.value}))}/></F>
                            <F label="Référence promoteur">
                              <div style={{position:"relative"}}>
                                <input
                                  style={{...inp(proEditing),paddingRight:proEditing?36:undefined}}
                                  value={proFields.promoteur_reference}
                                  readOnly={!proEditing}
                                  placeholder={proEditing?"Ex : IMM":"Non renseignée"}
                                  maxLength={3}
                                  onChange={e=>{
                                    const cleaned = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,"").slice(0,3).toUpperCase();
                                    setProFields(p=>({...p,promoteur_reference:cleaned}));
                                    if(proEditing) checkPromoteurReference(cleaned);
                                  }}
                                />
                                {proEditing&&proFields.promoteur_reference&&(
                                  <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:16}}>
                                    {proRefStatus==="checking"&&<span style={{color:"#94a3b8",fontSize:12}}>…</span>}
                                    {proRefStatus==="available"&&<span style={{color:"#16a34a"}}>✓</span>}
                                    {proRefStatus==="taken"&&<span style={{color:"#dc2626"}}>✗</span>}
                                    {proRefStatus==="invalid"&&<span style={{color:"#dc2626"}}>✗</span>}
                                  </span>
                                )}
                              </div>
                              {proEditing&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Exactement 3 lettres · utilisée comme préfixe dans vos références d'annonces.</div>}
                              {proEditing&&proRefStatus==="taken"&&<div style={{fontSize:11,color:"#dc2626",marginTop:2}}>Référence déjà utilisée par un autre promoteur.</div>}
                              {proEditing&&proRefStatus==="invalid"&&<div style={{fontSize:11,color:"#dc2626",marginTop:2}}>Exactement 3 lettres uniquement.</div>}
                              {proEditing&&proRefStatus==="available"&&<div style={{fontSize:11,color:"#16a34a",marginTop:2}}>Référence disponible.</div>}
                            </F>
                          </>
                        : <F label="Adresse" full><input style={inp(proEditing)} value={proFields.adresse} readOnly={!proEditing} placeholder={proEditing?"Ex : 12 rue de la Liberté, La Marsa":"Non renseignée"} onChange={e=>setProFields(p=>({...p,adresse:e.target.value}))}/></F>
                      }
                    </>}
                  </div>
                  {/* Bouton Enregistrer propre à cette section */}
                  {storedUser?.role==="particulier"&&editing2&&(
                    <button onClick={handleSaveProfile2} disabled={saving} style={{...saveBtn,marginTop:16}}><Save size={14}/> {saving?"Sauvegarde…":"Enregistrer"}</button>
                  )}
                  {(isPro||isAgent)&&proEditing&&(
                    <button onClick={handleSavePro} disabled={proSaving} style={{...saveBtn,marginTop:16}}><Save size={14}/> {proSaving?"Sauvegarde…":"Enregistrer"}</button>
                  )}
                </div>

              </div>

              {/* ── Colonne droite 50% : photo de profil ── */}
              <div className="cpt-profil-right" style={{flex:"0 0 calc(50% - 10px)",minWidth:0}}>
                <div className="cpt-profil-card" style={{...card,padding:"26px 28px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                  <h2 style={{...cardTitle,alignSelf:"flex-start",display:"flex",alignItems:"center",gap:8}}><Camera size={16} style={{color:"#6366f1"}}/>Photo de profil</h2>

                  {/* Grande image quand renseignée */}
                  {avatarPreview&&(
                    <div style={{width:"100%",maxWidth:220,aspectRatio:"1/1",borderRadius:16,overflow:"hidden",border:"3px solid #e0e7ff",flexShrink:0,background:"#f8faff"}}>
                      <img src={imgUrl(avatarPreview)} alt="Avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                  )}

                  {/* Zone drag & drop — grande si pas d'image, petite si image présente */}
                  <div
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={()=>fileInputRef.current?.click()}
                    style={{
                      width:"100%",
                      height: avatarPreview ? 80 : 140,
                      borderRadius:14,
                      border:dragOver?"2px dashed #6366f1":"2px dashed #c7d2fe",
                      background:dragOver?"#eef2ff":"#f8faff",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      cursor:"pointer",position:"relative",overflow:"hidden",
                      transition:"all .2s",
                    }}
                  >
                    {!avatarPreview&&(
                      <div style={{textAlign:"center",color:"#94a3b8",padding:20}}>
                        <Upload size={32} style={{marginBottom:10,color:"#c7d2fe"}}/>
                        <div style={{fontSize:14,fontWeight:700,marginBottom:4,color:"#6366f1"}}>Glissez votre photo ici</div>
                        <div style={{fontSize:12}}>ou cliquez pour sélectionner</div>
                        <div style={{fontSize:11,marginTop:6,color:"#a5b4fc"}}>JPG, PNG, WEBP · Max 5 MB</div>
                      </div>
                    )}
                    {avatarPreview&&(
                      <div style={{display:"flex",alignItems:"center",gap:10,color:"#94a3b8",padding:"0 16px"}}>
                        <Upload size={18} style={{color:"#c7d2fe",flexShrink:0}}/>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:"#6366f1"}}>Glisser une nouvelle photo</div>
                          <div style={{fontSize:11}}>ou cliquer pour changer</div>
                        </div>
                      </div>
                    )}
                    {uploadingAvatar&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:12}}><div style={{width:24,height:24,border:"3px solid transparent",borderTopColor:"#fff",borderRadius:"50%",animation:"cpt-spin .7s linear infinite"}}/></div>}
                  </div>

                  <button onClick={()=>fileInputRef.current?.click()} disabled={uploadingAvatar} style={{padding:"9px 22px",border:"1.5px solid #c7d2fe",borderRadius:10,background:"#eef2ff",color:"#4f46e5",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
                    <Upload size={14}/> {uploadingAvatar?"Upload…":"Choisir une photo"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarChange}/>
                </div>
              </div>

            </div>
          )}

          {/* ═══════ MES ANNONCES (dashboard exact) ═══════ */}
          {tab==="annonces" && (
            <div className="db-page" style={{background:"transparent"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h1 className="db-header__title">Mes annonces</h1>
                  <p className="db-header__sub">Gérez toutes vos publications immobilières</p>
                </div>
                <PublierAnnonceBtn className="db-btn-primary"><Plus size={17}/> Nouvelle annonce</PublierAnnonceBtn>
              </div>

              {/* Stats */}
              <div className="db-stats">
                {[{icon:<Home size={20}/>,label:"Total",val:stats.total,cls:"",filter:""},{icon:<CheckCircle size={20}/>,label:"Publiées",val:stats.publiees,cls:"db-stat--green",filter:"En cours"},{icon:<Clock size={20}/>,label:"En attente",val:stats.attente,cls:"db-stat--amber",filter:"En attente"},{icon:<TrendingUp size={20}/>,label:"Vues totales",val:stats.vues,cls:"db-stat--blue",filter:null}].map(s=>(
                  <div key={s.label} className={`db-stat ${s.cls}`}
                    onClick={s.filter!==null ? ()=>setStatusFilter(s.filter) : undefined}
                    style={s.filter!==null ? {cursor:"pointer"} : undefined}>
                    <span className="db-stat__ico">{s.icon}</span><div><p className="db-stat__val">{s.val}</p><p className="db-stat__lbl">{s.label}</p></div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              {!annLoading && annonces.length>0 && (
                <div className="db-toolbar">
                  <div className="db-search"><Search size={15} className="db-search__ico"/><input className="db-search__input" type="text" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button className="db-search__clear" onClick={()=>setSearch("")}><X size={13}/></button>}</div>
                  <select className="db-toolbar__type" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{flex:1,minWidth:0,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 8px",fontSize:12.5,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"}}>
                    <option value="">Tous types</option>
                    {[["appartement","Appartement"],["villa_maison","Villa/Maison"],["immeuble","Immeuble"],["terrain","Terrain"],["local_commercial","Local commercial"],["bureau","Bureau"],["ferme_agricole","Ferme agricole"],["garage_parking","Garage / Parking"],["depot_stockage","Dépôt de stockage"],["batiment_industriel","Bâtiment industriel"],["immobiliers_divers","Immobiliers divers"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                  <select className="db-toolbar__status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{flex:1,minWidth:0,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 8px",fontSize:12.5,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"}}>
                    <option value="">Tous statuts</option>
                    <option value="En cours">Approuvée (en cours)</option>
                    <option value="En attente">En attente</option>
                    <option value="Refusée">Refusée</option>
                    <option value="Vendu">Déjà vendu</option>
                    <option value="Loué">Déjà loué</option>
                  </select>
                  <select className="db-toolbar__date" value={dateFilter} onChange={e=>{setDateFilter(e.target.value);setDateStart("");setDateEnd("");}} style={{flex:1,minWidth:0,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 8px",fontSize:12.5,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"}}>
                    <option value="">Toutes dates</option><option value="Aujourd'hui">Aujourd'hui</option><option value="Cette semaine">Cette semaine</option><option value="Ce mois">Ce mois</option>
                  </select>
                  <input className="db-toolbar__dstart" type="date" value={dateStart} onChange={e=>{setDateStart(e.target.value);setDateFilter("");}} style={{flex:1,minWidth:0,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 8px",fontSize:12.5,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"}}/>
                  <input className="db-toolbar__dend" type="date" value={dateEnd} onChange={e=>{setDateEnd(e.target.value);setDateFilter("");}} style={{flex:1,minWidth:0,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 8px",fontSize:12.5,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"}}/>
                  <span className="db-toolbar__count">{filtered.length} annonce{filtered.length!==1?"s":""}</span>
                </div>
              )}

              {/* List — design dashboard, 2 par ligne */}
              {annLoading?(
                <div className="db-empty"><div className="db-spinner"/><p>Chargement…</p></div>
              ):annonces.length===0?(
                <div className="db-empty"><Home size={48} strokeWidth={1.2}/><p>Aucune annonce publiée.</p><PublierAnnonceBtn className="db-btn-primary"><Plus size={16}/> Créer ma première annonce</PublierAnnonceBtn></div>
              ):filtered.length===0?(
                <div className="db-empty"><Search size={40} strokeWidth={1.2}/><p>Aucun résultat pour « <strong>{search}</strong> »</p><button className="db-btn-secondary" onClick={()=>setSearch("")}>Effacer</button></div>
              ):(
                <div className="cpt-ann-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {filtered.map(a=>{
                    const badge=statusBadge(a.status); const prop=a.properties?.[0];
                    const rawImg=a.image_principale||prop?.image_principale||null;
                    const imgSrc=rawImg?(rawImg.startsWith("http")?rawImg:`${API_URL}${rawImg}`):null;
                    return(
                      <div key={a.id} className="db-card" style={{flexWrap:"wrap",rowGap:10,padding:0,overflow:"hidden",opacity:a.status==="vendue"||a.status==="louee"?0.82:1}}>
                        {/* Image collée aux bords gauche/haut/bas */}
                        <div className="cpt-img-col" style={{width:120,alignSelf:"stretch",flexShrink:0,background:"#e5e7eb",overflow:"hidden",borderRadius:0,position:"relative"}}>
                          {imgSrc?<img src={imgSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Home size={26} style={{color:"#94a3b8"}}/></div>}
                          {(a.status==="vendue"||a.status==="louee")&&(
                            <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{background:a.status==="vendue"?"#166534":"#1e40af",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 7px",borderRadius:6,letterSpacing:".04em",textTransform:"uppercase"}}>
                                {a.status==="vendue"?"Vendu":"Loué"}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Contenu avec padding rétabli */}
                        <div className="cpt-content-col" style={{flex:1,display:"flex",alignItems:"center",gap:18,padding:"16px 18px",flexWrap:"wrap",rowGap:10,minWidth:0}}>
                        <div className="db-card__left">
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <div className="db-card__type-badge">{typeBienLabel(a.type_bien)}</div>
                            {/* Bouton vendu/loué — juste après le type */}
                            {a.status==="approuvee"&&(
                              <button className="cpt-ann-status-btn" onClick={()=>setSoldConfirm({id:a.id, label:a.categorie==="vente"?"vendu":"loue", titre:a.titre, categorie:a.categorie})}
                                style={{padding:"4px 12px",borderRadius:6,border:"1.5px solid #fbbf24",background:"#fffbeb",color:"#92400e",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",marginBottom:5}}>
                                {a.categorie==="vente"?"Déjà vendu ?":"Déjà loué ?"}
                              </button>
                            )}
                            {/* Bouton remettre sur la carte */}
                            {a.status==="louee"&&(a.categorie==="location"||a.categorie==="vacances")&&(
                              <button className="cpt-ann-status-btn" onClick={()=>setRemettreCarte({id:a.id,titre:a.titre,categorie:a.categorie})}
                                style={{padding:"3px 10px",borderRadius:6,border:"1.5px solid #6366f1",background:"#eef2ff",color:"#4338ca",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                                Remettre sur la carte
                              </button>
                            )}
                          </div>
                          <h3 className="db-card__title">{a.titre}</h3>
                          <div className="db-card__meta">
                            <span className={`db-badge ${badge.cls}`}>{badge.icon} {badge.label}</span>
                            <span className="db-card__cat">{categorieLabel(a.categorie)}</span>
                            {prop?.address&&<span className="db-card__loc"><MapPin size={11}/> {prop.address}</span>}
                          </div>
                        </div>
                        <div className="db-card__center">
                          <p className="db-card__prix">{a.prix?`${Number(a.prix).toLocaleString()} ${fmtDevise(a.devise)}`:"Prix non défini"}</p>
                          <p className="db-card__sup">{a.superficie?`${a.superficie} m²`:""}</p>
                          <p className="db-card__date"><Clock size={11}/> {new Date(a.date_creation).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}</p>
                          {/* Stats vues + favoris */}
                          {(() => { const st = annonceStats[a.id] || {}; return (
                            <div className="cpt-ann-stats" style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:12,marginTop:8}}>
                              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:14,fontWeight:800,color:"#6366f1"}}>
                                <Eye size={14}/> {st.views_count ?? a.views_count ?? 0}
                              </span>
                              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:14,fontWeight:800,color:"#e11d48"}}>
                                <span style={{fontSize:15}}>♥</span> {st.favoris_count ?? 0}
                              </span>
                            </div>
                          ); })()}
                        </div>
                        <div className="db-card__actions" style={{alignItems:"center",flexDirection:"column",gap:10}}>
                          {/* Accompagnement */}
                          <div style={{display:"flex",flexDirection:"column",gap:5,width:180,flexShrink:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <label style={{position:"relative",display:"inline-block",width:36,height:20,cursor:"pointer",flexShrink:0}}>
                                <input type="checkbox" checked={!!a.accompagnement} onChange={()=>updateAnnonceAccompagnement(a.id,!a.accompagnement)} style={{opacity:0,width:0,height:0}}/>
                                <span style={{position:"absolute",inset:0,background:a.accompagnement?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/>
                                <span style={{position:"absolute",width:14,height:14,background:"#fff",borderRadius:"50%",top:3,left:a.accompagnement?19:3,transition:".2s"}}/>
                              </label>
                              <span style={{fontSize:11.5,fontWeight:600,color:a.accompagnement?"#6366f1":"#94a3b8",whiteSpace:"nowrap"}}>Accompagnement</span>
                            </div>
                            <select disabled={!a.accompagnement} value={a.accompagnement_agence_id||""} onChange={e=>updateAnnonceAccompagnement(a.id,true,e.target.value?parseInt(e.target.value):null)}
                              style={{fontSize:11.5,padding:"4px 8px",borderRadius:6,border:`1px solid ${a.accompagnement?"#c7d2fe":"#e5e7eb"}`,background:a.accompagnement?"#f5f3ff":"#f8fafc",color:a.accompagnement?"#4338ca":"#94a3b8",fontFamily:"inherit",outline:"none",width:"100%",cursor:a.accompagnement?"pointer":"not-allowed",opacity:a.accompagnement?1:0.5}}>
                              <option value="">— Choisir un agent —</option>
                              {agencesList.map(ag=><option key={ag.id} value={ag.id}>{ag.nom||ag.email}</option>)}
                            </select>
                          </div>
                          {/* 4 boutons d'action alignés */}
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <button className="db-action db-action--view" title="Prévisualiser" onClick={()=>setPreviewAnnonceId(a.id)}><Eye size={16}/></button>
                            <Link to={`/modifier_annonce/${a.id}`} className="db-action db-action--edit" title="Modifier"><Edit2 size={16}/></Link>
                            {a.status==="approuvee"?(
                              <button onClick={()=>handleRefresh(a.id)} disabled={refreshingId===a.id} className="db-action db-action--refresh" title="Refresh" style={{position:"relative"}}>
                                <RefreshCw size={15} style={{animation:refreshingId===a.id?"spin 1s linear infinite":"none"}}/>
                              </button>
                            ):(
                              <button className="db-action db-action--refresh" disabled style={{opacity:0.3,cursor:"not-allowed"}} title="Refresh (annonce non publiée)">
                                <RefreshCw size={15}/>
                              </button>
                            )}
                            <button className="db-action db-action--del" title="Supprimer" onClick={()=>setDelItem(a)}><Trash2 size={16}/></button>
                          </div>
                        </div>
                        </div>{/* fin wrapper contenu */}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════ DEMANDES REÇUES ═══════ */}
          {tab==="contacts" && (
            <div style={{background:"transparent"}}>
              <div style={{marginBottom:20}}>
                <h1 className="db-header__title">Demandes de contact</h1>
                <p className="db-header__sub">Visiteurs qui souhaitent vous contacter via vos annonces anonymes</p>
              </div>
              {loadingContacts?(
                <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8",fontSize:14}}>Chargement des demandes…</div>
              ):contactRequests.length===0?(
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
                  <Bell size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                  <p style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:6}}>Aucune demande de contact</p>
                  <p style={{fontSize:13,color:"#94a3b8"}}>Les personnes intéressées par vos annonces anonymes apparaîtront ici.</p>
                </div>
              ):(
                <div className="cpt-contacts-wrap" style={{overflowX:"auto",background:"#fff",borderRadius:14,border:"1px solid #e5e7eb"}}>
                  <table className="cpt-contacts-tbl" style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Inter',system-ui,sans-serif",fontSize:13}}>
                    <thead><tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                      {["Contact","Annonce","Téléphone","Email","Message","Date","Statut"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {contactRequests.map(req=>(
                        <tr key={req.id} style={{background:req.lu?"#fff":"#f0f9ff",borderBottom:"1px solid #f1f5f9",transition:"background .15s"}}>
                          <td data-label="Contact" style={{padding:"12px 14px",verticalAlign:"middle"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{req.nom[0]?.toUpperCase()}</div>
                              <span style={{fontWeight:600,color:"#0f172a"}}>{req.nom}</span>
                            </div>
                          </td>
                          <td data-label="Annonce" style={{padding:"12px 14px",verticalAlign:"middle",maxWidth:200}}>
                            <Link to={`/annonce/${req.annonce_id}`} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none"}}>
                              <div style={{width:44,height:44,borderRadius:7,overflow:"hidden",background:"#e5e7eb",flexShrink:0,border:"1px solid #e5e7eb"}}>
                                <img src={`${API_URL}/annonces/${req.annonce_id}/image-principale`} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";e.target.parentNode.style.display="flex";e.target.parentNode.style.alignItems="center";e.target.parentNode.style.justifyContent="center";e.target.parentNode.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';}}/>
                              </div>
                              <span style={{color:"#6366f1",fontWeight:600,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",lineHeight:1.35}}>{req.annonce_titre||`Annonce #${req.annonce_id}`}</span>
                            </Link>
                          </td>
                          <td data-label="Téléphone" style={{padding:"12px 14px",verticalAlign:"middle",whiteSpace:"nowrap"}}>
                            {req.telephone?<div style={{display:"flex",gap:6}}><a href={`tel:${req.telephone.replace(/\s/g,"")}`} style={{color:"#15803d",fontWeight:600,textDecoration:"none"}}><Phone size={12}/> {req.telephone}</a><a href={`https://wa.me/${req.telephone.replace(/[\s+]/g,"").replace(/^00/,"")}?text=${encodeURIComponent(`Bonjour ${req.nom}, j'ai bien reçu votre demande.`)}`} target="_blank" rel="noopener noreferrer" style={{color:"#15803d",fontWeight:600,textDecoration:"none"}}>WhatsApp</a></div>:<span style={{color:"#cbd5e1"}}>—</span>}
                          </td>
                          <td data-label="Email" style={{padding:"12px 14px",verticalAlign:"middle"}}>{req.email?<a href={`mailto:${req.email}?subject=Réponse demande&body=Bonjour ${req.nom},`} style={{color:"#1d4ed8",fontWeight:600,textDecoration:"none"}}><Mail size={12}/> {req.email}</a>:<span style={{color:"#cbd5e1"}}>—</span>}</td>
                          <td data-label="Message" style={{padding:"12px 14px",verticalAlign:"top",minWidth:280,maxWidth:440,color:"#374151"}}>
                            <span style={{display:"block",lineHeight:1.6,fontSize:13,whiteSpace:expandedMsg!==req.id&&req.message?.length>120?"nowrap":"normal",overflow:expandedMsg!==req.id&&req.message?.length>120?"hidden":"visible",textOverflow:expandedMsg!==req.id&&req.message?.length>120?"ellipsis":"unset",cursor:req.message?.length>120?"pointer":"default"}} onClick={()=>req.message?.length>120&&setExpandedMsg(expandedMsg===req.id?null:req.id)}>{req.message||<span style={{color:"#cbd5e1"}}>—</span>}</span>
                            {req.message&&req.message.length>120&&<span style={{fontSize:10.5,color:"#6366f1",fontWeight:600,cursor:"pointer",marginTop:2,display:"block"}} onClick={()=>setExpandedMsg(expandedMsg===req.id?null:req.id)}>{expandedMsg===req.id?"▲ Réduire":"▼ Voir tout"}</span>}
                          </td>
                          <td data-label="Date" style={{padding:"12px 14px",verticalAlign:"middle",color:"#94a3b8",whiteSpace:"nowrap",fontSize:12}}>{new Date(req.created_at).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"})}</td>
                          <td data-label="Statut" style={{padding:"12px 14px",verticalAlign:"middle"}}>
                            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                              {!req.lu?<button onClick={()=>markAsRead(req.id)} style={{padding:"4px 9px",borderRadius:6,border:"none",background:"#0ea5e9",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>✓ Marquer lu</button>:<><span style={{fontSize:11,color:"#16a34a",fontWeight:600,padding:"4px 0"}}>✓ Lu</span><button onClick={()=>markAsUnread(req.id)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #e5e7eb",background:"#f8fafc",color:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Non lu</button></>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════ MES ALERTES ═══════ */}
          {tab==="alertes" && (
            <div style={{background:"transparent"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h1 className="db-header__title">Mes alertes immobilières</h1>
                  <p className="db-header__sub">Recevez des notifications quand de nouvelles annonces correspondent à vos critères.</p>
                </div>
                <button onClick={()=>{setAlerteForm({...EMPTY_FORM});setAlerteModal("new");}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:13.5,cursor:"pointer",fontFamily:"inherit"}}>
                  <Plus size={16}/> Créer une alerte
                </button>
              </div>
              {loadingAlertes?(
                <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8",fontSize:14}}>Chargement…</div>
              ):savedSearches.length===0?(
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
                  <Bell size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                  <p style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:6}}>Aucune alerte enregistrée</p>
                  <p style={{fontSize:13,color:"#94a3b8"}}>Cliquez sur "+ Créer une alerte" pour définir vos critères.</p>
                </div>
              ):(
                <div className="cpt-alerts-wrap" style={{overflowX:"auto",background:"#fff",borderRadius:14,border:"1px solid #e5e7eb"}}>
                  <table className="cpt-alerts-tbl" style={{width:"100%",minWidth:900,borderCollapse:"collapse",fontFamily:"'Inter',system-ui,sans-serif",fontSize:13}}>
                    <thead><tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                      {["Nom","Critères","Annonces","Accompagnement","Alerte email","Actions"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {savedSearches.map(s=>{
                        const c=s.criteres||{};
                        const ETAT_FR={nouveau:"Neuf",bon_etat:"Bon état",a_renover:"À rénover",cours_construction:"En construction"};
                        const FEAT_LABELS={vue_mer:"Vue sur mer",vue_montagne:"Vue sur montagne",vue_foret:"Vue sur forêt",jardin:"Jardin",terrasse:"Terrasse",balcon:"Balcon",piscine:"Piscine",parking:"Parking",ascenseur:"Ascenseur",garage:"Garage",cellier:"Cellier",meuble:"Meublé",concierge:"Concierge",gardien:"Gardien",animaux_admis:"Animaux admis",cuisine_equipee:"Cuisine équipée",climatisation:"Clim.",chauffage_centrale:"Chauffage",cheminee:"Cheminée",double_vitrage:"Double vitrage",porte_blindee:"Porte blindée",securite:"Sécurité",internet:"Internet",tv:"TV",machine_laver:"Machine laver",digicode:"Digicode",interphone:"Interphone"};
                        const TYPE_APPT_FR={studio:"Studio",s0:"S0","s+1":"S+1","s+2":"S+2","s+3":"S+3","s+4":"S+4",duplex:"Duplex",penthouse:"Penthouse"};
                        const TYPE_TERRAIN_FR={agricole:"Terrain agricole",constructible:"Terrain constructible",mixte:"Terrain mixte",industriel:"Terrain industriel"};
                        const STANDING_FR={economique:"Économique",moyen_standing:"Moyen standing",haut_standing:"Haut standing"};
                        const tags=[
                          c.categories?.length>0&&c.categories.map(v=>CAT_FR2[v]||v).join(" / "),
                          c.type&&(TYPE_FR[c.type]||c.type.replace(/_/g," ")),
                          c.govNom,c.delNom,c.locNom,
                          c.prixMin&&`≥ ${Number(c.prixMin).toLocaleString("fr-TN")} DT`,
                          c.prixMax&&`≤ ${Number(c.prixMax).toLocaleString("fr-TN")} DT`,
                          c.superficieMin&&c.superficieMax?`${c.superficieMin}–${c.superficieMax} m²`:c.superficieMin?`≥ ${c.superficieMin} m²`:c.superficieMax?`≤ ${c.superficieMax} m²`:null,
                          c.bedsMin&&`${c.bedsMin}+ pièces`,
                          c.piecesMin&&`${c.piecesMin}+ pièces`,
                          c.chambresMin&&`${c.chambresMin}+ ch.`,
                          c.etat&&(ETAT_FR[c.etat]||c.etat.replace(/_/g," ")),
                          c.type_appartement&&(TYPE_APPT_FR[c.type_appartement]||c.type_appartement),
                          c.type_terrain&&(TYPE_TERRAIN_FR[c.type_terrain]||c.type_terrain),
                          c.standing&&(STANDING_FR[c.standing]||c.standing),
                          c.titre_foncier&&"Titre foncier",
                          c.colocation&&"Colocation",
                          c.etage_min&&(c.etage_min==="0"?"RDC":`Étage ≥ ${c.etage_min}`),
                          c.anciennete&&({1:"Aujourd'hui",7:"7 derniers jours",30:"30 derniers jours",60:"60 derniers jours",90:"3 derniers mois",180:"6 derniers mois"}[c.anciennete]||`${c.anciennete} jours`),
                          ...(c.features?.length>0?c.features.map(k=>FEAT_LABELS[k]||k):[])
                        ].filter(Boolean);
                        const count=alerteMatchCounts[s.id];
                        return(
                          <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                            <td data-label="Nom" style={{padding:"14px 14px",verticalAlign:"middle",minWidth:140}}><div style={{fontWeight:700,color:"#0f172a",fontSize:15}}>{s.nom||"Ma recherche"}</div><div style={{fontSize:12.5,color:"#94a3b8",marginTop:3}}>{new Date(s.created_at).toLocaleDateString("fr-TN",{day:"2-digit",month:"short",year:"numeric"})}</div></td>
                            <td data-label="Critères" style={{padding:"14px 14px",verticalAlign:"middle",maxWidth:440}}>
                              {tags.length>0?(
                                <>
                                  <div className={`cpt-alert-tags${expandedAlertCrit[s.id]?"":" cpt-alert-tags--clamp"}`} style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                    {tags.map((t,i)=><span key={i} style={{background:"#eef2ff",color:"#4f46e5",fontSize:12.5,fontWeight:600,padding:"3px 10px",borderRadius:12}}>{t}</span>)}
                                  </div>
                                  {tags.length>3&&<button onClick={()=>setExpandedAlertCrit(p=>({...p,[s.id]:!p[s.id]}))} style={{fontSize:10.5,color:"#6366f1",fontWeight:600,cursor:"pointer",background:"none",border:"none",padding:"3px 0",fontFamily:"inherit",marginTop:3}}>{expandedAlertCrit[s.id]?"▲ Voir moins":"▼ Voir plus"}</button>}
                                </>
                              ):<span style={{color:"#94a3b8",fontSize:13}}>Tous les biens</span>}
                            </td>
                            <td data-label="Annonces" style={{padding:"14px 14px",verticalAlign:"middle",whiteSpace:"nowrap"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20,fontWeight:800,color:count>0?"#6366f1":"#94a3b8"}}>{count!=null?count:"…"}</span><Link to={buildCarteUrl(c)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,background:"#eef2ff",color:"#4f46e5",fontSize:12,fontWeight:700,textDecoration:"none"}}><Search size={11}/> Consulter</Link></div></td>
                            <td data-label="Accompagnement" style={{padding:"14px 14px",verticalAlign:"middle",minWidth:200}}>
                              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <label style={{position:"relative",display:"inline-block",width:40,height:22,cursor:"pointer",flexShrink:0}}><input type="checkbox" checked={!!alerteAccom[s.id]} onChange={()=>toggleAlerteAccom(s.id)} style={{opacity:0,width:0,height:0}}/><span style={{position:"absolute",inset:0,background:alerteAccom[s.id]?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/><span style={{position:"absolute",width:16,height:16,background:"#fff",borderRadius:"50%",top:3,left:alerteAccom[s.id]?21:3,transition:".2s"}}/></label>
                                  <span style={{fontSize:13,color:alerteAccom[s.id]?"#6366f1":"#94a3b8",fontWeight:600}}>{alerteAccom[s.id]?"Activé":"Désactivé"}</span>
                                </div>
                                {alerteAccom[s.id]&&<select value={alerteAgence[s.id]||""} onChange={e=>setAlerteAgenceVal(s.id,e.target.value)} onClick={e=>e.stopPropagation()} style={{fontSize:12,padding:"5px 8px",borderRadius:7,border:"1px solid #c7d2fe",background:"#f5f3ff",color:"#4338ca",fontFamily:"inherit",outline:"none",width:"100%"}}><option value="">— Choisir un agent —</option>{agencesList.map(ag=><option key={ag.id} value={ag.id}>{ag.nom||ag.email}</option>)}</select>}
                              </div>
                            </td>
                            <td data-label="Alerte email" style={{padding:"14px 14px",verticalAlign:"middle"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <label style={{position:"relative",display:"inline-block",width:40,height:22,cursor:"pointer"}}><input type="checkbox" checked={!!s.email_alert} onChange={()=>toggleAlerteEmail(s.id)} style={{opacity:0,width:0,height:0}}/><span style={{position:"absolute",inset:0,background:s.email_alert?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/><span style={{position:"absolute",width:16,height:16,background:"#fff",borderRadius:"50%",top:3,left:s.email_alert?21:3,transition:".2s"}}/></label>
                                <span style={{fontSize:13,color:s.email_alert?"#6366f1":"#94a3b8",fontWeight:600}}>{s.email_alert?"Activée":"Désactivée"}</span>
                              </div>
                            </td>
                            <td data-label="Actions" style={{padding:"14px 14px",verticalAlign:"middle",whiteSpace:"nowrap"}}>
                              <div className="cpt-alert-actions" style={{display:"flex",gap:8}}>
                                <button className="cpt-alert-btn-edit" onClick={()=>{setAlerteForm({...EMPTY_FORM,...(s.criteres||{}),nom:s.nom,email_alert:s.email_alert});setAlerteModal(s);}} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><Edit2 size={14}/><span className="cpt-alert-btn-label">Modifier</span></button>
                                <button className="cpt-alert-btn-del" onClick={()=>deleteAlert(s.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1.5px solid #fee2e2",background:"#fff",color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><Trash2 size={14}/><span className="cpt-alert-btn-label">Supprimer</span></button>
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
          )}

          {/* ═══════ MES FAVORIS ═══════ */}
          {tab==="favoris" && (
            <div style={{background:"transparent"}}>
              <div style={{marginBottom:20}}>
                <h1 className="db-header__title">Mes favoris {favoris.length>0&&<span style={{marginLeft:10,fontSize:14,fontWeight:600,background:"#fff0f6",color:"#e11d48",padding:"2px 10px",borderRadius:999}}>{favoris.length}</span>}</h1>
                <p className="db-header__sub">{favoris.length} annonce{favoris.length!==1?"s":""} sauvegardée{favoris.length!==1?"s":""}</p>
              </div>
              {favLoading?(
                <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>Chargement…</div>
              ):favoris.length===0?(
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
                  <Heart size={48} color="#e2e8f0" style={{margin:"0 auto 16px"}}/>
                  <p style={{color:"#64748b",marginBottom:20,fontSize:15}}>Vous n'avez pas encore de favoris.</p>
                  <Link to="/carte" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",background:"#0f172a",color:"#fff",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none"}}><MapPin size={15}/> Explorer les annonces</Link>
                </div>
              ):(
                <div className="fav-grid-compte">
                  {favoris.map(f=>{
                    const imgSrc=f.image?(f.image.startsWith("http")?f.image:`${API_URL}${f.image}`):null;
                    const inCompare=compareIds.includes(String(f.id));
                    return(
                      <div key={f.id} className="fav-card" onClick={()=>navigate(`/annonce/${f.id}`)} style={{cursor:"pointer"}}>
                        <div className="fav-card__img">
                          {imgSrc
                            ?<img src={imgSrc} alt={f.titre} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            :<div className="fav-card__no-img"><Home size={28} color="#cbd5e1"/></div>
                          }
                          {f.categorie==="location"&&<span className="fav-cat fav-cat--location">Location</span>}
                          {f.categorie==="vacances"&&<span className="fav-cat fav-cat--vacances">Vacances</span>}
                        </div>
                        <div className="fav-card__body">
                          <p className="fav-card__title">{f.titre}</p>
                          <p className="fav-card__loc"><MapPin size={12}/> {f.gouvernorat||"—"}</p>
                          {/* Specs */}
                          {(f.nb_pieces||f.nb_chambres||f.nb_salles_bain||f.superficie)&&(
                            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                              {f.nb_pieces!=null&&<span style={{display:"flex",alignItems:"center",gap:3,fontSize:12,color:"#374151",fontWeight:500}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>{f.nb_pieces} p.</span>}
                              {f.nb_chambres!=null&&<span style={{display:"flex",alignItems:"center",gap:3,fontSize:12,color:"#374151",fontWeight:500}}><Bed size={11}/>{f.nb_chambres} ch.</span>}
                              {f.nb_salles_bain!=null&&<span style={{display:"flex",alignItems:"center",gap:3,fontSize:12,color:"#374151",fontWeight:500}}><Bath size={11}/>{f.nb_salles_bain} sdb</span>}
                              {f.superficie!=null&&<span style={{display:"flex",alignItems:"center",gap:3,fontSize:12,color:"#374151",fontWeight:500}}><Maximize size={11}/>{f.superficie} m²</span>}
                            </div>
                          )}
                          <div className="fav-card__foot">
                            <div>
                              <span className="fav-card__price">{Number(f.prix||0).toLocaleString("fr-TN")} <small>{fmtDevise(f.devise)}</small></span>
                              {f.prix&&(()=>{const approx=fmtPriceApprox(f.prix,f.devise);return approx?<div style={{fontSize:10.5,color:"#94a3b8",fontWeight:500,marginTop:1}}>{approx}</div>:null;})()}
                            </div>
                            <div style={{display:"flex",gap:5,flexShrink:0}}>
                              <Link to={`/annonce/${f.id}`} onClick={e=>e.stopPropagation()} className="fav-btn fav-btn--view">Voir <ArrowRight size={12}/></Link>
                              <button className={`fav-btn fav-btn--compare${inCompare?" fav-btn--compare-active":""}`} onClick={e=>{e.stopPropagation();const result=toggleCompareStore({id:f.id,titre:f.titre,prix:f.prix,devise:f.devise,image:imgSrc,gouvernorat:f.gouvernorat});if(result.maxReached)toast("Maximum 4 annonces.","error");}} title={inCompare?"Retirer de la comparaison":"Comparer"}>⇄</button>
                              <button className="fav-btn fav-btn--del" onClick={e=>{e.stopPropagation();handleRemoveFav(f.id);}} title="Retirer des favoris"><Trash2 size={13}/></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* ═══════ NOTER LES SERVICES REÇUS (tous rôles) ═══════ */}
          {tab==="noter" && (
            <div>
              <div style={{...card,padding:"22px 24px",marginBottom:16}}>
                <h2 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:0}}>Noter les services reçus</h2>
                <p style={{fontSize:12.5,color:"#94a3b8",margin:"3px 0 0"}}>Donnez votre avis sur les prestataires dont vous avez bénéficié du service.</p>
              </div>

              {toRateLoading ? (
                <div style={{...card,padding:"40px",textAlign:"center",color:"#94a3b8"}}>Chargement…</div>
              ) : toRate.length === 0 ? (
                <div style={{...card,padding:"48px 24px",textAlign:"center"}}>
                  <Star size={40} color="#cbd5e1" style={{margin:"0 auto 14px"}}/>
                  <p style={{fontSize:15,fontWeight:700,color:"#475569",margin:"0 0 4px"}}>Rien à noter pour le moment</p>
                  <p style={{fontSize:13,color:"#94a3b8",margin:0}}>Quand un prestataire marque votre intervention comme réalisée, elle apparaît ici.</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {toRate.map(it => {
                    const nomComplet = [it.prestataire_prenom, it.prestataire_nom].filter(Boolean).join(" ") || it.prestataire_nom;
                    return (
                      <div key={it.id} style={{...card,padding:"24px"}}>
                        <p style={{fontSize:14.5,color:"#374151",lineHeight:1.7,margin:"0 0 18px",textAlign:"center"}}>
                          Vous venez de bénéficier du service de <strong style={{color:"#0f172a"}}>{it.role_label}</strong>{" "}
                          <strong style={{color:"#0f172a"}}>{nomComplet}</strong>. Nous souhaitons savoir votre avis sur le service qu'il vous a rendu.
                        </p>
                        <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
                          {[
                            {emoji:"😞",label:"Très insatisfait",val:1},
                            {emoji:"😕",label:"Insatisfait",val:2},
                            {emoji:"😐",label:"Neutre",val:3},
                            {emoji:"😊",label:"Satisfait",val:4},
                            {emoji:"😄",label:"Très satisfait",val:5},
                          ].map(({emoji,label,val}) => (
                            <button key={val} type="button" disabled={ratingId===it.id}
                              onClick={()=>submitRating(it.id, val)} title={label}
                              style={{
                                background:"#fff", border:"2px solid #e5e7eb", borderRadius:14, padding:"14px 18px",
                                cursor:ratingId===it.id?"default":"pointer", opacity:ratingId===it.id?.5:1,
                                transition:"all .22s cubic-bezier(.34,1.56,.64,1)",
                                display:"flex", flexDirection:"column", alignItems:"center", gap:6, minWidth:80,
                              }}
                              onMouseEnter={e=>{ if(ratingId!==it.id){ e.currentTarget.style.background="#eef2ff"; e.currentTarget.style.borderColor="#6366f1"; e.currentTarget.style.transform="scale(1.08)"; } }}
                              onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.transform="scale(1)"; }}
                            >
                              <span style={{fontSize:32}}>{emoji}</span>
                              <span style={{fontSize:11,color:"#94a3b8",fontWeight:700,lineHeight:1.2,textAlign:"center"}}>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* ═══════ MES INTERVENTIONS (partenaire only) ═══════ */}
          {tab==="interventions" && storedUser?.role==="partenaire" && (
            <div>
              <div style={{...card,padding:"22px 24px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:0}}>Mes interventions</h2>
                  <p style={{fontSize:12.5,color:"#94a3b8",margin:"3px 0 0"}}>Demandes reçues de clients. Marquez-les « réalisée » pour incrémenter votre compteur.</p>
                </div>
                <div style={{textAlign:"center",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 20px"}}>
                  <div style={{fontSize:26,fontWeight:900,color:"#6366f1",lineHeight:1}}>{interventions.filter(i=>i.status==="realisee").length}</div>
                  <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginTop:3}}>réalisée{interventions.filter(i=>i.status==="realisee").length!==1?"s":""}</div>
                </div>
              </div>

              {interventionsLoading ? (
                <div style={{...card,padding:"40px",textAlign:"center",color:"#94a3b8"}}>Chargement…</div>
              ) : interventions.length === 0 ? (
                <div style={{...card,padding:"48px 24px",textAlign:"center"}}>
                  <Briefcase size={40} color="#cbd5e1" style={{margin:"0 auto 14px"}}/>
                  <p style={{fontSize:15,fontWeight:700,color:"#475569",margin:"0 0 4px"}}>Aucune demande pour le moment</p>
                  <p style={{fontSize:13,color:"#94a3b8",margin:0}}>Les demandes des clients qui vous contactent apparaîtront ici.</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {interventions.map(i => {
                    const done = i.status === "realisee";
                    return (
                      <div key={i.id} style={{...card,padding:"18px 20px",borderLeft:`4px solid ${done?"#16a34a":"#f59e0b"}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                              <span style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{i.client_nom}</span>
                              <span style={{fontSize:10.5,fontWeight:700,padding:"2px 9px",borderRadius:20,background:done?"#f0fdf4":"#fffbeb",color:done?"#16a34a":"#b45309",border:`1px solid ${done?"#bbf7d0":"#fde68a"}`}}>
                                {done?"Réalisée":"En attente"}
                              </span>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:4,fontSize:13,color:"#475569"}}>
                              {i.client_telephone && <a href={`tel:${i.client_telephone}`} style={{display:"inline-flex",alignItems:"center",gap:7,color:"#374151",textDecoration:"none"}}><Phone size={13} style={{color:"#6366f1"}}/> {i.client_telephone}</a>}
                              {i.client_email && <a href={`mailto:${i.client_email}`} style={{display:"inline-flex",alignItems:"center",gap:7,color:"#6366f1",textDecoration:"none"}}><Mail size={13}/> {i.client_email}</a>}
                              {i.message && <div style={{marginTop:4,padding:"8px 12px",background:"#f8fafc",borderRadius:8,color:"#64748b",fontSize:12.5,lineHeight:1.5}}>{i.message}</div>}
                              {i.created_at && <span style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{new Date(i.created_at).toLocaleDateString("fr-TN",{day:"numeric",month:"long",year:"numeric"})}</span>}
                            </div>
                          </div>
                          {!done && (
                            <div style={{flexShrink:0,display:"flex",gap:8,flexWrap:"wrap"}}>
                              <button
                                onClick={()=>setIntervConfirm({id:i.id, action:"annuler", nom:i.client_nom})}
                                disabled={updatingIntervId===i.id}
                                style={{padding:"9px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:7}}>
                                <X size={14}/> Annuler
                              </button>
                              <button
                                onClick={()=>setIntervConfirm({id:i.id, action:"realisee", nom:i.client_nom})}
                                disabled={updatingIntervId===i.id}
                                style={{padding:"9px 16px",borderRadius:10,border:"none",background:"#16a34a",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:7}}>
                                <CheckCircle size={14}/> Marquer réalisée
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* ═══════ STATISTIQUES (tous les rôles) ═══════ */}
          {tab==="statistiques" && (
            <div>
              <div style={{...card, padding:"22px 26px"}}>
                <h2 style={{...cardTitle, display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                  <TrendingUp size={17} style={{color:"#6366f1"}}/>Statistiques
                </h2>
                <p style={{fontSize:12.5, color:"#94a3b8", marginBottom:20}}>
                  Vue d'ensemble des performances de vos annonces : vues, contacts reçus et zones les plus actives.
                </p>
                <AgencyStatsDashboard/>
              </div>
            </div>
          )}
          {/* ═══════ MON ÉQUIPE (agence only) ═══════ */}
          {tab==="equipe" && storedUser?.role==="agence" && (
            <div>
              <div style={{...card,padding:"0"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 26px 18px",borderBottom:"1px solid #f1f5f9"}}>
                  <div>
                    <h2 style={{...cardTitle,display:"flex",alignItems:"center",gap:8}}><Users size={17} style={{color:"#6366f1"}}/>Agents de l'agence</h2>
                    <p style={{fontSize:12,color:"#94a3b8",marginTop:3}}>{agents.length} agent{agents.length!==1?"s":""} rattaché{agents.length!==1?"s":""}</p>
                  </div>
                  <button onClick={()=>{ setAgentForm({username:"",email:"",nom:"",prenom:"",password:genAgentPwd()}); setAgentFormErr(""); setAgentViewMode(false); setShowAgentModal(true); }} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,background:"#6366f1",color:"#fff",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
                    <Plus size={15}/> Créer un compte agent
                  </button>
                </div>

                {agentLoading ? (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"48px 24px",color:"#94a3b8",fontSize:14,justifyContent:"center"}}>
                    <span style={{width:20,height:20,border:"2px solid #e2e8f0",borderTopColor:"#6366f1",borderRadius:"50%",display:"inline-block",animation:"cpt-spin .7s linear infinite"}}/>Chargement…
                  </div>
                ) : agents.length === 0 ? (
                  <div style={{textAlign:"center",padding:"56px 24px"}}>
                    <Users size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                    <p style={{fontWeight:600,color:"#374151",marginBottom:6}}>Aucun agent pour l'instant</p>
                    <p style={{fontSize:13,color:"#9ca3af"}}>Créez le premier compte agent de votre agence.</p>
                  </div>
                ) : (
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5}}>
                      <thead>
                        <tr>
                          {["Agent","Email","Téléphone","Statut",""].map(h=>(
                            <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".04em",borderBottom:"1px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {agents.map(a=>(
                          <tr key={a.id} style={{borderBottom:"1px solid #f8fafc"}}>
                            <td style={{padding:"14px 16px",verticalAlign:"middle"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:36,height:36,borderRadius:"50%",background:"#e0e7ff",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                                  {a.profile_picture?<img src={imgUrl(a.profile_picture)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:14,fontWeight:700,color:"#6366f1"}}>{(a.username||"?")[0].toUpperCase()}</span>}
                                </div>
                                <div>
                                  <div style={{fontWeight:700,color:"#0f172a"}}>{a.nom&&a.prenom?`${a.prenom} ${a.nom}`:a.username}</div>
                                  {(a.nom||a.prenom)&&<div style={{fontSize:11,color:"#94a3b8"}}>@{a.username}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{padding:"14px 16px",color:"#475569",fontSize:13,verticalAlign:"middle"}}>{a.email}</td>
                            <td style={{padding:"14px 16px",color:"#475569",fontSize:13,verticalAlign:"middle"}}>{a.phone_number||"—"}</td>
                            <td style={{padding:"14px 16px",verticalAlign:"middle"}}>
                              {a.must_change_password
                                ?<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:700,background:"#fef9c3",color:"#854d0e"}}><Clock size={11}/> Connexion en attente</span>
                                :<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:700,background:"#dcfce7",color:"#166534"}}><CheckCircle size={11}/> Actif</span>
                              }
                            </td>
                            <td style={{padding:"14px 16px",verticalAlign:"middle"}}>
                              <div style={{display:"flex",gap:6}}>
                                <button onClick={()=>{
                                  const storedPwds = (() => { try { return JSON.parse(localStorage.getItem("localizi_agent_pwds")||"{}"); } catch { return {}; } })();
                                  setAgentForm({ username: a.username||"", email: a.email||"", nom: a.nom||"", prenom: a.prenom||"", password: storedPwds[a.username]||"" });
                                  setAgentBeingEdited(a.id); setAgentEditMode(false); setAgentFormErr(""); setAgentViewMode(true); setShowAgentModal(true);
                                }} style={{width:30,height:30,borderRadius:8,border:"1.5px solid #e5e7eb",background:"#f8fafc",color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}}
                                  onMouseOver={e=>{e.currentTarget.style.background="#e0e7ff";e.currentTarget.style.borderColor="#a5b4fc";e.currentTarget.style.color="#6366f1";}}
                                  onMouseOut={e=>{e.currentTarget.style.background="#f8fafc";e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#94a3b8";}}>
                                  <Eye size={14}/>
                                </button>
                                <button onClick={()=>{
                                  const storedPwds = (() => { try { return JSON.parse(localStorage.getItem("localizi_agent_pwds")||"{}"); } catch { return {}; } })();
                                  setAgentForm({ username: a.username||"", email: a.email||"", nom: a.nom||"", prenom: a.prenom||"", password: storedPwds[a.username]||"" });
                                  setAgentBeingEdited(a.id); setAgentEditMode(true); setAgentFormErr(""); setAgentViewMode(true); setShowAgentModal(true);
                                }} style={{width:30,height:30,borderRadius:8,border:"1.5px solid #e5e7eb",background:"#f8fafc",color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}}
                                  onMouseOver={e=>{e.currentTarget.style.background="#fffbeb";e.currentTarget.style.borderColor="#fde68a";e.currentTarget.style.color="#f59e0b";}}
                                  onMouseOut={e=>{e.currentTarget.style.background="#f8fafc";e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#94a3b8";}}>
                                  <Pencil size={14}/>
                                </button>
                                <button onClick={()=>handleDeleteAgent(a.id,a.username)} disabled={deletingAgent===a.id} style={{width:30,height:30,borderRadius:8,border:"1.5px solid #e5e7eb",background:"#f8fafc",color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}}
                                  onMouseOver={e=>{e.currentTarget.style.background="#fee2e2";e.currentTarget.style.borderColor="#fca5a5";e.currentTarget.style.color="#ef4444";}}
                                  onMouseOut={e=>{e.currentTarget.style.background="#f8fafc";e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#94a3b8";}}>
                                  {deletingAgent===a.id?<span style={{width:14,height:14,border:"2px solid transparent",borderTopColor:"#ef4444",borderRadius:"50%",display:"inline-block",animation:"cpt-spin .7s linear infinite"}}/>:<Trash2 size={14}/>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal création agent */}
            </div>
          )}

          {tab==="onboarding_agence" && storedUser?.role==="agence" && (
            <AgenceOnboarding embedded onProgressChange={_refreshOnb} />
          )}

          {tab==="onboarding_promoteur" && storedUser?.role==="promoteur" && (
            <PromoteurOnboarding embedded onProgressChange={_refreshOnb} />
          )}

        </main>
      </div>

      {/* ── Confirm delete ── */}
      {delItem&&(
        <div className="db-modal-bg" onClick={()=>setDelItem(null)}>
          <div className="db-modal db-modal--sm" onClick={e=>e.stopPropagation()}>
            <div className="db-modal__head"><h2>Supprimer cette annonce ?</h2><button onClick={()=>setDelItem(null)}><X size={20}/></button></div>
            <div className="db-modal__body"><p style={{color:"#4b5563"}}>« <strong>{delItem.titre}</strong> » sera définitivement supprimée. Cette action est irréversible.</p></div>
            <div className="db-modal__foot"><button className="db-modal__cancel" onClick={()=>setDelItem(null)}>Annuler</button><button className="db-modal__del" onClick={()=>handleDelete(delItem.id)}><Trash2 size={15}/> Supprimer</button></div>
          </div>
        </div>
      )}

      {/* ── Popup prévisualisation annonce ── */}
      {previewAnnonceId && (
        <AnnonceDetailModal annonceId={previewAnnonceId} onClose={() => setPreviewAnnonceId(null)} />
      )}

      {/* ── Popup : marquer vendu / loué ── */}
      {soldConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSoldConfirm(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:"36px 32px",maxWidth:420,width:"92%",boxShadow:"0 24px 64px rgba(0,0,0,.22)",fontFamily:"'Inter',system-ui,sans-serif"}} onClick={e=>e.stopPropagation()}>
            {/* Logo / icône monochrome */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
              <div style={{width:56,height:56,borderRadius:16,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {soldConfirm.label==="vendu"
                  ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                }
              </div>
            </div>
            <h3 style={{fontSize:19,fontWeight:800,color:"#0f172a",textAlign:"center",marginBottom:8}}>
              {soldConfirm.label==="vendu" ? "Bien vendu ?" : "Bien loué ?"}
            </h3>
            <p style={{fontSize:14,color:"#64748b",textAlign:"center",marginBottom:28,lineHeight:1.6}}>
              <strong style={{color:"#0f172a"}}>"{soldConfirm.titre}"</strong><br/>
              L'annonce restera visible dans votre tableau de bord avec le statut <strong>{soldConfirm.label==="vendu"?"Vendu":"Loué"}</strong>.<br/>
              Elle sera retirée de la carte publique.
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setSoldConfirm(null)} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
                Annuler
              </button>
              <button onClick={()=>handleStatutPublication(soldConfirm.id, soldConfirm.label==="vendu"?"vendue":"louee")}
                style={{flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : créer / voir / modifier un agent ── */}
      {showAgentModal&&(()=>{
        const isReadOnly = agentViewMode && !agentEditMode;
        const inputBg = isReadOnly ? "#f8fafc" : "#fff";
        const inputStyle = {padding:"10px 13px",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13.5,fontFamily:"inherit",color:"#0f172a",outline:"none",background:inputBg};
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:16}}>
            <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,boxShadow:"0 24px 64px rgba(0,0,0,.22)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid #f1f5f9"}}>
                <h3 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0,display:"flex",alignItems:"center",gap:8}}>
                  {agentViewMode
                    ? (agentEditMode ? <><Pencil size={16} style={{color:"#f59e0b"}}/>Modifier l'agent</> : <><Eye size={16} style={{color:"#6366f1"}}/>Fiche agent</>)
                    : <><Plus size={16} style={{color:"#6366f1"}}/>Créer un compte agent</>}
                </h3>
                <button onClick={()=>setShowAgentModal(false)} style={{width:32,height:32,borderRadius:8,border:"none",background:"#f1f5f9",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16}/></button>
              </div>
              <form onSubmit={agentEditMode ? handleUpdateAgent : handleCreateAgent}>
                <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:14}}>
                  {/* Bannière contextuelle */}
                  {!agentViewMode
                    ? <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af",display:"flex",alignItems:"flex-start",gap:8}}>
                        <Building2 size={14} style={{flexShrink:0,marginTop:1}}/><span>Cet agent fera partie de <strong>{storedUser?.username}</strong>. Il pourra changer son mot de passe à sa première connexion.</span>
                      </div>
                    : agentEditMode
                      ? <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#92400e",display:"flex",alignItems:"flex-start",gap:8}}>
                          <Pencil size={14} style={{flexShrink:0,marginTop:1}}/><span>Mode modification — mettez à jour les informations de <strong>@{agentForm.username}</strong>.</span>
                        </div>
                      : <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#166534",display:"flex",alignItems:"flex-start",gap:8}}>
                          <Eye size={14} style={{flexShrink:0,marginTop:1}}/><span>Mode visualisation — informations de l'agent <strong>@{agentForm.username}</strong>.</span>
                        </div>
                  }
                  <p style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",margin:"4px 0 -4px"}}>Identité (optionnel)</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      <label style={{fontSize:11.5,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>Prénom</label>
                      <input value={agentForm.prenom} onChange={e=>setAgentForm(p=>({...p,prenom:e.target.value}))} readOnly={isReadOnly} placeholder="Prénom" style={inputStyle}/>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      <label style={{fontSize:11.5,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>Nom</label>
                      <input value={agentForm.nom} onChange={e=>setAgentForm(p=>({...p,nom:e.target.value}))} readOnly={isReadOnly} placeholder="Nom de famille" style={inputStyle}/>
                    </div>
                  </div>
                  <p style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",margin:"4px 0 -4px"}}>Identifiants de connexion *</p>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11.5,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>Nom d'utilisateur</label>
                    <input value={agentForm.username} readOnly placeholder="ex : agent.dupont" style={{...inputStyle,background:"#f8fafc",color:agentViewMode?"#64748b":"#0f172a"}}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11.5,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>Email</label>
                    <input value={agentForm.email} onChange={e=>setAgentForm(p=>({...p,email:e.target.value}))} readOnly={isReadOnly} placeholder="agent@exemple.com" style={inputStyle}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11.5,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>Agence (rattachement)</label>
                    <input value={storedUser?.username||""} readOnly style={{...inputStyle,background:"#f8fafc",color:"#94a3b8"}}/>
                  </div>
                  <p style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",margin:"4px 0 -4px"}}>Mot de passe provisoire</p>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11.5,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>Mot de passe à communiquer</label>
                    <div style={{display:"flex",gap:8}}>
                      <input type={showAgentPwd?"text":"password"} value={agentForm.password}
                        onChange={e=>!agentViewMode&&setAgentForm(p=>({...p,password:e.target.value}))} readOnly={agentViewMode}
                        style={{flex:1,minWidth:0,...inputStyle,color:agentViewMode?"#6366f1":"#0f172a",fontWeight:agentViewMode?700:400,background:agentViewMode?"#f8fafc":"#fff"}}/>
                      <button type="button" onClick={()=>setShowAgentPwd(v=>!v)} style={{width:40,height:40,border:"1.5px solid #e2e8f0",borderRadius:9,background:"#f8fafc",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>{showAgentPwd?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                      <button type="button" onClick={()=>{navigator.clipboard.writeText(agentForm.password).then(()=>{setAgentPwdCopied(true);setTimeout(()=>setAgentPwdCopied(false),1800);});}} style={{width:40,height:40,border:"1.5px solid #e2e8f0",borderRadius:9,background:"#f8fafc",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>{agentPwdCopied?<CheckCircle size={15} style={{color:"#16a34a"}}/>:<Copy size={15}/>}</button>
                      {!agentViewMode&&<button type="button" onClick={()=>setAgentForm(p=>({...p,password:genAgentPwd()}))} style={{width:40,height:40,border:"1.5px solid #e2e8f0",borderRadius:9,background:"#f8fafc",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><RefreshCw size={15}/></button>}
                    </div>
                    {agentViewMode && !agentForm.password && <p style={{fontSize:11,color:"#f59e0b",marginTop:2,fontWeight:600}}>⚠ Mot de passe non disponible — l'agent l'a peut-être déjà modifié.</p>}
                    {!agentViewMode && <p style={{fontSize:11,color:"#94a3b8",marginTop:2}}>L'agent devra changer ce mot de passe à sa première connexion.</p>}
                  </div>
                  {agentFormErr&&<p style={{color:"#ef4444",fontSize:12.5,fontWeight:600,margin:0}}>{agentFormErr}</p>}
                </div>
                <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end"}}>
                  {!agentViewMode && <>
                    <button type="button" onClick={()=>setShowAgentModal(false)} style={{padding:"9px 18px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#475569",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
                    <button type="submit" disabled={agentSaving} style={{padding:"9px 22px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
                      {agentSaving?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"cpt-spin .7s linear infinite"}}/>Création…</>:<><Plus size={13}/>Créer l'agent</>}
                    </button>
                  </>}
                  {agentViewMode && !agentEditMode && <>
                    <button type="button" onClick={()=>setShowAgentModal(false)} style={{padding:"9px 18px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#475569",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Fermer</button>
                    <button type="button" onClick={()=>{setAgentEditMode(true);setAgentFormErr("");}} style={{padding:"9px 22px",borderRadius:10,border:"none",background:"#f59e0b",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}><Pencil size={13}/>Modifier</button>
                  </>}
                  {agentViewMode && agentEditMode && <>
                    <button type="button" onClick={()=>{setAgentEditMode(false);setAgentFormErr("");}} style={{padding:"9px 18px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#475569",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
                    <button type="submit" disabled={agentSaving} style={{padding:"9px 22px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
                      {agentSaving?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"cpt-spin .7s linear infinite"}}/>Sauvegarde…</>:<><CheckCircle size={13}/>Sauvegarder</>}
                    </button>
                  </>}
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── Popup : remettre sur la carte ── */}
      {remettreCarte&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setRemettreCarte(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:"36px 32px",maxWidth:420,width:"92%",boxShadow:"0 24px 64px rgba(0,0,0,.22)",fontFamily:"'Inter',system-ui,sans-serif"}} onClick={e=>e.stopPropagation()}>
            {/* Logo monochrome */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
              <div style={{width:56,height:56,borderRadius:16,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
            </div>
            <h3 style={{fontSize:19,fontWeight:800,color:"#0f172a",textAlign:"center",marginBottom:8}}>
              Remettre sur la carte
            </h3>
            <p style={{fontSize:14,color:"#64748b",textAlign:"center",marginBottom:28,lineHeight:1.6}}>
              <strong style={{color:"#0f172a"}}>"{remettreCarte.titre}"</strong><br/>
              Souhaitez-vous modifier l'annonce avant de la soumettre à nouveau, ou la soumettre directement pour approbation ?
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{setRemettreCarte(null); window.location.href=`/modifier_annonce/${remettreCarte.id}`;}}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"16px 12px",borderRadius:12,border:"1.5px solid #e5e7eb",background:"#f8fafc",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Modifier
              </button>
              <button onClick={()=>handleRemettreSurCarte(remettreCarte.id)}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"16px 12px",borderRadius:12,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                Soumettre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerte modal ── */}
      {alerteModal&&<AlerteFiltersModal form={alerteForm} setForm={setAlerteForm} onClose={()=>setAlerteModal(null)} onSave={saveAlerte} saving={alerteSaving} isEdit={alerteModal!=="new"}/>}

      <style>{`
        @keyframes cpt-spin { to { transform: rotate(360deg); } }
        .db-page { font-family: 'Inter', system-ui, sans-serif; }
        .db-header__title { font-size: 22px; font-weight: 800; color: #0f172a; margin:0 0 2px; }
        .db-header__sub { font-size: 13px; color: #94a3b8; margin: 0; }
        .db-btn-primary { display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:#0f172a;color:#fff;border-radius:10px;font-size:14px;font-weight:700;border:none;cursor:pointer;text-decoration:none;transition:background .15s;font-family:inherit; }
        .db-btn-primary:hover { background:#1e293b; }
        .db-btn-secondary { display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:#f1f5f9;color:#374151;border-radius:9px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer;transition:background .15s; }
        .db-btn-secondary:hover { background:#e2e8f0; }
        .db-stats { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px; }
        .db-stat { background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:12; }
        .db-stat__ico { width:42px;height:42px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#64748b; }
        .db-stat--green .db-stat__ico { background:#f0fdf4;color:#16a34a; }
        .db-stat--amber .db-stat__ico { background:#fffbeb;color:#d97706; }
        .db-stat--blue  .db-stat__ico { background:#eff6ff;color:#2563eb; }
        .db-stat__val { font-size:22px;font-weight:800;color:#0f172a;line-height:1; }
        .db-stat__lbl { font-size:12px;color:#94a3b8;margin-top:3px; }
        .db-toolbar { display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:nowrap;width:100%; }
        .db-search { flex:0 0 calc(50% - 4px);min-width:0;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;transition:border-color .15s; }
        .db-search:focus-within { border-color:#6366f1; }
        .db-search__ico { color:#94a3b8;flex-shrink:0; }
        .db-search__input { flex:1;border:none;outline:none;background:transparent;font-size:13.5px;color:#0f172a;font-family:inherit;padding:10px 0; }
        .db-search__input::placeholder { color:#b0bac5; }
        .db-search__clear { background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:2px;border-radius:4px;transition:color .15s; }
        .db-search__clear:hover { color:#ef4444; }
        .db-toolbar__count { font-size:12.5px;font-weight:600;color:#94a3b8;white-space:nowrap; }
        .db-empty { text-align:center;padding:80px 20px;color:#94a3b8;display:flex;flex-direction:column;align-items:center;gap:16px; }
        .db-spinner { width:34px;height:34px;border:3px solid #e5e7eb;border-top-color:#6366f1;border-radius:50%;animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .db-list { display:flex;flex-direction:column;gap:12px; }
        .db-card { background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px;display:flex;align-items:center;gap:18px;transition:box-shadow .15s; }
        .db-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.07); }
        .db-card__left { flex:1;min-width:0; }
        .db-card__type-badge { display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6366f1;background:#eef2ff;padding:3px 8px;border-radius:6px;margin-bottom:5px; }
        .db-card__title { font-size:15px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px; }
        .db-card__meta { display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:5px; }
        .db-badge { display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px; }
        .db-badge--ok   { background:#f0fdf4;color:#15803d; }
        .db-badge--warn { background:#fffbeb;color:#b45309; }
        .db-badge--err  { background:#fef2f2;color:#b91c1c; }
        .db-card__cat { font-size:12px;color:#64748b;background:#f1f5f9;padding:3px 8px;border-radius:6px; }
        .db-card__loc { font-size:12px;color:#94a3b8;display:flex;align-items:center;gap:3px; }
        .db-card__center { min-width:130px;text-align:right; }
        .db-card__prix { font-size:19px;font-weight:800;color:#0f172a; }
        .db-card__sup { font-size:12px;color:#64748b;margin-top:2px; }
        .db-card__date { font-size:11px;color:#94a3b8;margin-top:5px;display:flex;align-items:center;justify-content:flex-end;gap:4px; }
        .db-card__actions { display:flex;gap:7px;flex-shrink:0; }
        .db-action { width:34px;height:34px;border-radius:9px;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#fff;text-decoration:none;color:#64748b;transition:all .15s; }
        .db-action--view:hover { border-color:#6366f1;color:#6366f1;background:#eef2ff; }
        .db-action--refresh { color:#4338ca;border-color:#a5b4fc;background:#eef2ff; }
        .db-action--refresh:hover { border-color:#6366f1;color:#fff;background:#6366f1; }
        .db-action--refresh:hover::after { content:"Refresh";position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:5px;white-space:nowrap;pointer-events:none; }
        .db-action--edit:hover { border-color:#f59e0b;color:#d97706;background:#fffbeb; }
        .db-action--del:hover  { border-color:#ef4444;color:#dc2626;background:#fef2f2; }
        .db-modal-bg { position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px; }
        .db-modal { background:#fff;border-radius:16px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden; }
        .db-modal--sm { max-width:400px; }
        .db-modal__head { display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e5e7eb; }
        .db-modal__head h2 { font-size:17px;font-weight:700;color:#0f172a; }
        .db-modal__head button { background:none;border:none;cursor:pointer;color:#64748b;padding:4px; }
        .db-modal__body { padding:20px 24px;display:flex;flex-direction:column;gap:14px; }
        .db-modal__body p { color:#4b5563; }
        .db-modal__foot { display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #e5e7eb;background:#f8fafc; }
        .db-modal__cancel { padding:9px 18px;border-radius:9px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:14px;cursor:pointer;font-family:inherit; }
        .db-modal__del { display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:9px;border:none;background:#dc2626;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit; }

        /* Favoris fav-card grid */
        .fav-grid-compte { display:grid; grid-template-columns:repeat(5,1fr); gap:18px; }

        /* ── MOBILE ONLY (max-width 860px) ── */
        @media (max-width: 860px) {
          /* Cache la sidebar */
          .cpt-aside { display: none !important; }
          /* Grid → 1 colonne pleine */
          .cpt-grid { grid-template-columns: 1fr !important; padding: 14px 12px 40px !important; gap: 16px !important; }

          /* Mon profil : colonnes empilées verticalement */
          .cpt-profil-layout { flex-direction: column !important; }
          .cpt-profil-left, .cpt-profil-right { flex: none !important; width: 100% !important; }
          /* Grille profil (Nom, Email, Rôle, Téléphone) : 1 colonne sur mobile */
          .cpt-profil-card .cpt-profil-grid { grid-template-columns: 1fr !important; }

          /* Stats : 2 par ligne */
          .db-stats { grid-template-columns: 1fr 1fr !important; gap: 10px !important; margin-bottom: 14px !important; }
          .db-stat { padding: 12px 12px !important; }
          .db-stat__val { font-size: 18px !important; }
          .db-header__title { font-size: 17px !important; }

          /* ── Toolbar filtres : grille 2 colonnes ── */
          .db-toolbar {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
            align-items: stretch !important;
            margin-bottom: 14px !important;
          }
          /* Barre de recherche : pleine largeur */
          .db-search { grid-column: 1 / -1 !important; flex: none !important; width: auto !important; }
          /* Type + Status : chacun sur 1 colonne → même ligne */
          .db-toolbar__type { grid-column: 1 !important; }
          .db-toolbar__status { grid-column: 2 !important; }
          /* Date filter : pleine largeur */
          .db-toolbar__date { grid-column: 1 / -1 !important; }
          /* Dates début + fin : même ligne */
          .db-toolbar__dstart { grid-column: 1 !important; }
          .db-toolbar__dend { grid-column: 2 !important; }
          /* Compteur : pleine largeur */
          .db-toolbar__count { grid-column: 1 / -1 !important; text-align: center !important; }
          /* Styles communs des selects/inputs du toolbar */
          .db-toolbar__type, .db-toolbar__status, .db-toolbar__date,
          .db-toolbar__dstart, .db-toolbar__dend {
            width: 100% !important; box-sizing: border-box !important; font-size: 12px !important;
          }

          /* ── Annonces : grille 4-quadrants ── */
          .cpt-ann-grid { grid-template-columns: 1fr !important; }

          /* Carte en grille 2 colonnes 40/60 (image+actions | contenu) */
          .db-card {
            display: grid !important;
            grid-template-columns: 40% 60% !important;
            grid-template-rows: auto auto !important;
            align-items: start !important;
            padding: 0 !important;
          }

          /* Image : haut-gauche, dimensions fixes peu importe le contenu */
          .cpt-img-col {
            grid-column: 1 !important;
            grid-row: 1 !important;
            width: 100% !important;
            height: 110px !important;
            min-height: 110px !important;
            max-height: 110px !important;
            align-self: start !important;
            flex-shrink: 0 !important;
            overflow: hidden !important;
          }
          .cpt-img-col img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          /* Wrapper contenu → transparent (enfants participent au grid) */
          .cpt-content-col {
            display: contents !important;
          }

          /* Texte principal (badge + titre + meta) : haut-droite */
          .db-card__left {
            grid-column: 2 !important;
            grid-row: 1 !important;
            padding: 10px 10px 4px !important;
            flex: unset !important;
            min-width: 0 !important;
          }

          /* Prix / date / stats : bas-droite */
          .db-card__center {
            grid-column: 2 !important;
            grid-row: 2 !important;
            min-width: unset !important;
            text-align: left !important;
            padding: 0 10px 10px !important;
          }

          /* Actions (accompagnement + icones) : bas-gauche, fond blanc comme la vignette */
          .db-card__actions {
            grid-column: 1 !important;
            grid-row: 2 !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 6px 4px !important;
            background: #fff !important;
            border-top: none !important;
            gap: 5px !important;
            flex-shrink: unset !important;
          }

          /* Section accompagnement : pleine largeur de la colonne gauche */
          .db-card__actions > div:first-child { width: 100% !important; box-sizing: border-box !important; }
          .db-card__actions > div:first-child span { font-size: 10px !important; }
          .db-card__actions > div:first-child select { font-size: 10px !important; padding: 3px 4px !important; width: 100% !important; }

          /* 4 icones : carrés fixes, petits, sur une seule ligne */
          .db-card__actions > div:last-child {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            gap: 4px !important;
            width: 100% !important;
            justify-content: center !important;
          }
          .db-card__actions > div:last-child .db-action {
            flex: 0 0 26px !important;
            width: 26px !important;
            height: 26px !important;
            min-width: 26px !important;
            max-width: 26px !important;
            padding: 0 !important;
            border-radius: 7px !important;
          }
          .db-card__actions > div:last-child .db-action svg {
            width: 13px !important;
            height: 13px !important;
          }

          /* Type badge + statut sur la même ligne */
          .db-card__left > div:first-child { flex-wrap: nowrap !important; gap: 4px !important; align-items: center !important; }
          .db-card__type-badge { font-size: 10px !important; padding: 2px 5px !important; white-space: nowrap !important; flex-shrink: 0 !important; }

          /* Bouton déjà vendu/loué : padding gauche/droite réduit */
          .cpt-ann-status-btn { padding: 3px 7px !important; font-size: 10.5px !important; white-space: nowrap !important; flex-shrink: 0 !important; }

          /* Titre : 2 lignes max puis troncature propre */
          .db-card__title {
            white-space: normal !important;
            max-width: none !important;
            font-size: 12.5px !important;
            line-height: 1.35 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            word-break: break-word !important;
          }

          /* Adresse : ligne séparée, 2 lignes max puis '...' propre */
          .db-card__loc {
            flex-basis: 100% !important;
            white-space: normal !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            font-size: 11px !important;
            margin-top: 2px !important;
          }

          /* Prix légèrement agrandi */
          .db-card__prix { font-size: 15.5px !important; font-weight: 800 !important; }

          /* Date : alignée à gauche */
          .db-card__date { justify-content: flex-start !important; font-size: 10.5px !important; }

          /* Vues + favoris : sous la date, alignés à gauche */
          .cpt-ann-stats {
            justify-content: flex-start !important;
            margin-top: 4px !important;
            gap: 8px !important;
          }
          .cpt-ann-stats span { font-size: 12px !important; }

          /* ── Favoris : 1 par ligne, carte horizontale ── */
          .fav-grid-compte { grid-template-columns: 1fr !important; gap: 10px !important; }
          .fav-card { display: flex !important; flex-direction: row !important; align-items: stretch !important; }
          .fav-card__img { width: 110px !important; min-width: 110px !important; height: auto !important; flex-shrink: 0 !important; }
          .fav-card__body { flex: 1 !important; padding: 10px 12px !important; min-width: 0 !important; }
          .fav-card__title { font-size: 13px !important; white-space: normal !important; }
          .fav-card__price { font-size: 14px !important; }
          .fav-btn { padding: 5px 8px !important; font-size: 11px !important; }

          /* Label "Location/Vacances" : petit, haut-gauche, image reste claire */
          .fav-cat {
            font-size: 9px !important;
            padding: 2px 5px !important;
            border-radius: 8px !important;
            top: 6px !important;
            left: 6px !important;
            font-weight: 700 !important;
            letter-spacing: .02em !important;
          }

          /* ── Mon profil : padding réduit, grille 1 colonne ── */
          .cpt-profil-card { padding: 14px 12px !important; }
          .cpt-profil-card h2 { margin-bottom: 12px !important; font-size: 14px !important; }
          /* Bouton Modifier aligné en haut à droite du titre */
          .cpt-profil-card > div:first-child { align-items: flex-start !important; margin-bottom: 12px !important; }

          /* ── Mes annonces : décalage droite + padding bordure droite ── */
          .db-card__left { padding-left: 6px !important; padding-right: 12px !important; }
          .db-card__center { padding-left: 6px !important; padding-right: 12px !important; }
          /* Le wrapper contenu a un léger padding-right pour éviter collage bordure */
          .cpt-content-col { padding-right: 0 !important; }

          /* ── Demandes reçues : tableau → cartes ── */
          .cpt-contacts-wrap { overflow-x: visible !important; background: transparent !important; border: none !important; border-radius: 0 !important; }
          .cpt-contacts-tbl,
          .cpt-contacts-tbl tbody,
          .cpt-contacts-tbl tr,
          .cpt-contacts-tbl td { display: block !important; }
          .cpt-contacts-tbl thead { display: none !important; }
          .cpt-contacts-tbl tr {
            background: #fff !important;
            border-radius: 14px !important;
            border: 1.5px solid #e2e8f0 !important;
            margin-bottom: 14px !important;
            padding: 14px 14px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,.04) !important;
          }
          .cpt-contacts-tbl td {
            padding: 6px 0 !important;
            border: none !important;
            font-size: 13px !important;
            min-width: unset !important;
            max-width: 100% !important;
            white-space: normal !important;
          }
          .cpt-contacts-tbl td::before {
            content: attr(data-label);
            display: block;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .05em;
            color: #94a3b8;
            margin-bottom: 3px;
          }

          /* ── Mes alertes : tableau → cartes pleine largeur ── */
          .cpt-alerts-wrap {
            overflow-x: hidden !important;
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .cpt-alerts-tbl {
            display: block !important;
            min-width: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .cpt-alerts-tbl tbody { display: block !important; width: 100% !important; }
          .cpt-alerts-tbl thead { display: none !important; }
          .cpt-alerts-tbl tr {
            display: block !important;
            position: relative !important;
            background: #fff !important;
            border-radius: 14px !important;
            border: 1.5px solid #e2e8f0 !important;
            margin-bottom: 14px !important;
            padding: 46px 14px 14px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            box-shadow: 0 2px 8px rgba(0,0,0,.04) !important;
          }
          .cpt-alerts-tbl td {
            display: block !important;
            padding: 5px 0 !important;
            border: none !important;
            font-size: 13px !important;
            min-width: unset !important;
            max-width: 100% !important;
            white-space: normal !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .cpt-alerts-tbl td::before {
            content: attr(data-label);
            display: block;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .05em;
            color: #94a3b8;
            margin-bottom: 3px;
          }
          /* Accompagnement + Email alert : côte à côte */
          .cpt-alerts-tbl td[data-label="Accompagnement"],
          .cpt-alerts-tbl td[data-label="Alerte email"] {
            display: inline-block !important;
            width: 50% !important;
            vertical-align: top !important;
            box-sizing: border-box !important;
          }
          .cpt-alerts-tbl td[data-label="Alerte email"] {
            padding-left: 8px !important;
          }
          /* Actions : positionnées en haut à droite de la carte */
          .cpt-alerts-tbl td[data-label="Actions"] {
            display: block !important;
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            padding: 0 !important;
            width: auto !important;
          }
          .cpt-alerts-tbl td[data-label="Actions"]::before { display: none !important; }
          /* Boutons actions : icônes seulement sur mobile */
          .cpt-alert-btn-label { display: none !important; }
          .cpt-alert-btn-edit, .cpt-alert-btn-del {
            width: 30px !important; height: 30px !important;
            padding: 0 !important; justify-content: center !important;
            border-radius: 8px !important;
          }
          /* Critères : 2 lignes par défaut, voir plus/moins */
          .cpt-alert-tags--clamp {
            max-height: 58px !important;
            overflow: hidden !important;
          }
        }
        .fav-card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; transition:box-shadow .2s,transform .2s; }
        .fav-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.12); transform:translateY(-3px); }
        .fav-card__img { position:relative; height:190px; overflow:hidden; background:#e5e7eb; display:flex; align-items:center; justify-content:center; }
        .fav-card__img img { width:100%; height:100%; object-fit:cover; display:block; }
        .fav-card__no-img { display:flex; align-items:center; justify-content:center; width:100%; height:100%; }
        .fav-cat { position:absolute; top:10px; left:10px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; color:#fff; }
        .fav-cat--location { background:#1e40af; }
        .fav-cat--vacances { background:#f59e0b; }
        .fav-card__body { padding:14px 14px 12px; }
        .fav-card__title { font-weight:700; font-size:14px; color:#0f172a; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .fav-card__loc { display:flex; align-items:center; gap:4px; font-size:12px; color:#64748b; margin-bottom:10px; }
        .fav-card__foot { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid #f1f5f9; }
        .fav-card__price { font-size:17px; font-weight:800; color:#0f172a; }
        .fav-card__price small { font-size:12px; font-weight:500; color:#64748b; }
        .fav-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 11px; border-radius:7px; font-size:12px; font-weight:600; border:none; cursor:pointer; font-family:inherit; text-decoration:none; }
        .fav-btn--view { background:#ede9fe; color:#6d28d9; }
        .fav-btn--view:hover { background:#ddd6fe; }
        .fav-btn--compare { background:#f0fdf4; color:#16a34a; font-size:14px; }
        .fav-btn--compare:hover { background:#dcfce7; }
        .fav-btn--compare-active { background:#16a34a; color:#fff; }
        .fav-btn--compare-active:hover { background:#15803d; }
        .fav-btn--del { background:#fef2f2; color:#ef4444; }
        .fav-btn--del:hover { background:#fee2e2; }
        @keyframes fadeInCmp { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
      `}</style>

      {/* ── Modal OTP vérification téléphone ── */}
      {phoneOtpModal && (
        <div style={{position:"fixed",inset:0,zIndex:99998,background:"rgba(15,23,42,.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:20,maxWidth:400,width:"100%",padding:"36px 32px",boxShadow:"0 30px 80px rgba(0,0,0,.28)",position:"relative",animation:"fadeInCmp .2s ease"}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:48,marginBottom:12}}>📱</div>
              <h2 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:"0 0 8px"}}>Vérification du numéro</h2>
              <p style={{fontSize:13.5,color:"#64748b",lineHeight:1.6}}>Un code à 6 chiffres a été envoyé à votre adresse email. Saisissez-le ci-dessous pour confirmer le changement.</p>
            </div>
            <input
              value={phoneOtpCode}
              onChange={e=>setPhoneOtpCode(e.target.value.replace(/\D/g,"").slice(0,6))}
              placeholder="_ _ _ _ _ _"
              maxLength={6}
              style={{width:"100%",padding:"14px",textAlign:"center",fontSize:28,fontWeight:800,letterSpacing:10,border:`2px solid ${phoneOtpErr?"#ef4444":"#e2e8f0"}`,borderRadius:12,outline:"none",fontFamily:"monospace",boxSizing:"border-box",marginBottom:8}}
            />
            {phoneOtpErr && <p style={{color:"#ef4444",fontSize:13,textAlign:"center",marginBottom:8}}>{phoneOtpErr}</p>}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>{setPhoneOtpModal(false);setPhoneOtpCode("");setPhoneOtpErr("");}} style={{flex:1,padding:"12px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#374151",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
              <button disabled={phoneOtpCode.length!==6||phoneOtpLoading} onClick={async()=>{
                setPhoneOtpLoading(true); setPhoneOtpErr("");
                try{
                  const r=await fetch(`${API_URL}/users/me/confirm-phone-change`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({otp:phoneOtpCode})});
                  if(!r.ok){const e=await r.json().catch(()=>({}));setPhoneOtpErr(e.detail||"Code incorrect.");return;}
                  const updated=await r.json();
                  localStorage.setItem("user",JSON.stringify({...storedUser,...updated}));
                  setPhoneOtpModal(false); setEditing(false); toast("Numéro de téléphone vérifié et mis à jour !");
                }catch{setPhoneOtpErr("Erreur serveur.");}finally{setPhoneOtpLoading(false);}
              }} style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:phoneOtpCode.length===6?"#6366f1":"#e2e8f0",color:phoneOtpCode.length===6?"#fff":"#94a3b8",fontWeight:700,fontSize:14,cursor:phoneOtpCode.length===6?"pointer":"default",fontFamily:"inherit",transition:"all .2s"}}>
                {phoneOtpLoading?"Vérification…":"Confirmer →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Popup confirmation : marquer réalisée / annuler une intervention ── */}
      {intervConfirm && (()=>{
        const isRealisee = intervConfirm.action === "realisee";
        return (
          <div style={{position:"fixed",inset:0,zIndex:99999,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={()=>setIntervConfirm(null)}>
            <div style={{background:"#fff",borderRadius:18,maxWidth:420,width:"100%",padding:"28px 26px",boxShadow:"0 20px 60px rgba(0,0,0,.25)",textAlign:"center"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:18}}><Logo height={30}/></div>
              <div style={{width:56,height:56,borderRadius:"50%",background:isRealisee?"#f0fdf4":"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                {isRealisee ? <CheckCircle size={26} color="#16a34a"/> : <X size={26} color="#ef4444"/>}
              </div>
              <h3 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:"0 0 10px"}}>
                {isRealisee ? "Marquer l'intervention comme réalisée ?" : "Annuler cette demande ?"}
              </h3>
              <p style={{fontSize:13.5,color:"#64748b",lineHeight:1.7,margin:"0 0 24px"}}>
                {isRealisee
                  ? <>En appuyant sur ce bouton, vous confirmez que vous avez rendu service à <strong style={{color:"#374151"}}>{intervConfirm.nom}</strong>. Suite à cette action, une demande va être envoyée à la personne concernée pour noter votre service.</>
                  : <>En appuyant sur ce bouton d'annulation, vous confirmez que <strong style={{color:"#374151"}}>{intervConfirm.nom}</strong> n'est pas intéressé(e) et que vous n'avez plus besoin de ce contact. La demande sera supprimée et vous n'aurez plus ses coordonnées.</>
                }
              </p>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setIntervConfirm(null)} style={{flex:1,padding:"12px",borderRadius:11,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#374151",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                  Retour
                </button>
                <button onClick={async ()=>{
                    const {id, action} = intervConfirm;
                    setIntervConfirm(null);
                    if (action === "realisee") await setInterventionStatus(id, "realisee");
                    else await deleteIntervention(id);
                  }}
                  style={{flex:1,padding:"12px",borderRadius:11,border:"none",background:isRealisee?"#16a34a":"#ef4444",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                  {isRealisee ? "Confirmer" : "Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Le comparateur (aperçu + tableau complet) est désormais une popup
          globale unique, montée dans App.jsx — se déclenche automatiquement
          dès 2 biens ajoutés, quelle que soit la page. */}
    </div>
  );
}

/* ── Sub-components ── */
function F({ label, children, full }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:full?"1 / -1":undefined}}>
      <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>{label}</label>
      {children}
    </div>
  );
}

/* ── Style objects ── */
function sideNavStyle(active) {
  return { display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:11,border:"none",background:active?"#eef2ff":"transparent",color:active?"#4f46e5":"#475569",fontWeight:active?700:500,fontSize:15,cursor:"pointer",textDecoration:"none",textAlign:"left",width:"100%",fontFamily:"inherit",transition:"all .15s" };
}
function inp(editable) {
  return { padding:"9px 12px",borderRadius:9,fontSize:13.5,color:"#0f172a",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",border:editable?"1.5px solid #c7d2fe":"1.5px solid #e5e7eb",background:editable?"#fff":"#f8fafc",cursor:editable?"text":"default",transition:"border-color .15s" };
}
const card = { background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",padding:"24px 28px",boxShadow:"0 2px 10px rgba(0,0,0,.04)" };
const cardTitle = { fontSize:16,fontWeight:800,color:"#0f172a",margin:"0 0 20px" };
const btnSec = { display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:9,border:"1px solid #e5e7eb",background:"#fff",fontSize:13,fontWeight:600,color:"#374151",cursor:"pointer",fontFamily:"inherit" };
const saveBtn = { display:"flex",alignItems:"center",gap:7,marginTop:20,padding:"10px 22px",background:"#0f172a",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" };
