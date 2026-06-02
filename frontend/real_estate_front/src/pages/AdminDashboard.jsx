import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../config";
import Navbar from "../components/Navbar";
import { useToast } from "../components/Toast";
import {
  LayoutDashboard, FileText, Users, CheckCircle, XCircle, Clock,
  Eye, Trash2, RefreshCw, Home, BarChart3, X, Check, Building, Plus,
  CreditCard, ShieldCheck, ShieldOff, Mail, Phone,
  DollarSign, Activity, Filter, Calendar, Edit3,
  TrendingUp, MapPin,
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
  const m = { appartement:"Appartement", villa:"Villa", maison:"Maison",
    terrain:"Terrain", bureau:"Bureau", local_commercial:"Local com.", ferme:"Ferme",
    bord_eau:"Bord d'eau" };
  return m[t] || t;
}

function CatFr(c) {
  return { vente:"Achat", location:"Location", vacances:"Vacances" }[c] || c;
}


export default function AdminDashboard() {
  const [tab,          setTab]         = useState("annonces");
  const [stats,        setStats]       = useState(null);
  const [annonces,     setAnnonces]    = useState([]);
  const [allAnnonces,  setAllAnnonces] = useState([]);
  const [users,        setUsers]       = useState([]);
  const [filter,       setFilter]      = useState("en_attente");
  const [loading,      setLoading]     = useState(true);
  const [modal,        setModal]       = useState(null);
  const [rejectMsg,    setRejectMsg]   = useState("");

  /* Agences state */
  const [agencies,      setAgencies]     = useState([]);
  const [agencyModal,   setAgencyModal]  = useState(false);
  const [agencyForm,    setAgencyForm]   = useState({
    nom:"", email:"", telephone:"", adresse:"",
    matricule:"", frais_mensuel:"50", username:"", password:"",
  });
  const [agencySaving,  setAgencySaving] = useState(false);
  const [agencyViewId,  setAgencyViewId] = useState(null);
  const [agencyNoteId,  setAgencyNoteId] = useState(null);
  const [agencyNoteText,setAgencyNoteText] = useState("");

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
    if (tab === "agences")  { loadAgencies(); if (allAnnonces.length === 0) loadAllAnnonces(); }
  }, [tab, filter]);

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

  async function loadAgencies() {
    try {
      const res = await authFetch("/admin/agencies");
      if (res.ok) setAgencies(await res.json());
      else setAgencies([]);
    } catch { setAgencies([]); }
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

  async function updateStatus(id, status, message = null) {
    try {
      const res = await authFetch(`/admin/annonces/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, message }),
      });
      if (!res.ok) throw new Error();
      setAnnonces(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast(status === "approuvee" ? "Annonce approuvée !" : "Annonce refusée.");
      setModal(null); setRejectMsg("");
      loadStats();
    } catch { toast("Erreur lors de la mise à jour.", "error"); }
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

  const hasAnyFilter = zoneFilter.gouvernorat || zoneFilter.delegation || zoneFilter.localite || freqFrom || freqTo;

  const STAT_CARDS = stats ? [
    { icon:<FileText size={22}/>,    label:"Total annonces", val:stats.total_annonces, cls:"" },
    { icon:<CheckCircle size={22}/>, label:"Approuvées",     val:stats.approuvees,     cls:"adm-stat--green" },
    { icon:<Clock size={22}/>,       label:"En attente",     val:stats.en_attente,     cls:"adm-stat--amber" },
    { icon:<XCircle size={22}/>,     label:"Refusées",       val:stats.refusees,       cls:"adm-stat--red" },
    { icon:<Users size={22}/>,       label:"Utilisateurs",   val:stats.total_users,    cls:"adm-stat--blue" },
  ] : [];

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
            { id:"annonces", icon:<FileText size={16}/>,  label:"Annonces" },
            { id:"stats",    icon:<BarChart3 size={16}/>, label:"Statistiques" },
            { id:"users",    icon:<Users size={16}/>,     label:"Utilisateurs" },
            { id:"agences",  icon:<Building size={16}/>,  label:"Agences" },
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
              {tab === "agences"  && "Comptes Agences"}
            </h1>
            <button className="adm-refresh" onClick={loadAll}><RefreshCw size={15}/></button>
          </div>

          {/* Global stats row */}
          {stats && (
            <div className="adm-stats">
              {STAT_CARDS.map(s => (
                <div key={s.label} className={`adm-stat ${s.cls}`}>
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
              {loading ? (
                <div className="adm-empty"><div className="adm-spinner"/></div>
              ) : annonces.length === 0 ? (
                <div className="adm-empty"><FileText size={40}/><p>Aucune annonce dans ce filtre.</p></div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Annonce</th><th>Propriétaire</th><th>Type / Cat.</th>
                        <th>Lieu</th><th>Prix</th><th>Statut</th><th>Date</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annonces.map(a => (
                        <tr key={a.id}>
                          <td>
                            <p className="adm-table__title">{a.titre}</p>
                            <span className="adm-table__id">#{a.id}</span>
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
                            {a.prix ? `${Number(a.prix).toLocaleString("fr-TN")} ${a.devise}` : "—"}
                          </td>
                          <td><StatusBadge status={a.status}/></td>
                          <td className="adm-table__date">
                            {new Date(a.date_creation).toLocaleDateString("fr-FR")}
                          </td>
                          <td>
                            <div className="adm-actions">
                              <Link to={`/annonce/${a.id}`} className="adm-action adm-action--view" title="Voir">
                                <Eye size={14}/>
                              </Link>
                              {a.status !== "approuvee" && (
                                <button className="adm-action adm-action--ok" title="Approuver"
                                  onClick={() => updateStatus(a.id, "approuvee")}>
                                  <Check size={14}/>
                                </button>
                              )}
                              {a.status !== "refusee" && (
                                <button className="adm-action adm-action--reject" title="Refuser"
                                  onClick={() => setModal({ annonce:a, action:"reject" })}>
                                  <X size={14}/>
                                </button>
                              )}
                              <button className="adm-action adm-action--del" title="Supprimer"
                                onClick={() => deleteAnnonce(a.id)}>
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
                                      {Math.round(row.avgM2).toLocaleString("fr-TN")} TND/m²
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
              {users.length === 0
                ? <div className="adm-empty"><Users size={40}/><p>Aucun utilisateur.</p></div>
                : (
                <table className="adm-table">
                  <thead><tr><th>#</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Annonces</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="adm-table__id">#{u.id}</td>
                        <td style={{fontWeight:600,color:"#0f172a"}}>{u.username}</td>
                        <td className="adm-table__email">{u.email}</td>
                        <td>
                          <span className={`adm-pill ${
                            u.role==="admin"  ? "adm-pill--admin"  :
                            u.role==="agence" ? "adm-pill--agency" : ""
                          }`}>{u.role}</span>
                        </td>
                        <td style={{fontWeight:600}}>{u.nb_annonces}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
              ) : (
                <div className="adm-agency-list">
                  {agencies.map(ag => (
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
                              {ag.created_at && (
                                <span><Calendar size={11}/> {new Date(ag.created_at).toLocaleDateString("fr-FR")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="adm-agency-card__right">
                          <div className="adm-agency-card__stats">
                            <span><Eye size={12}/> {ag.nb_annonces || 0} annonces</span>
                            <span><CreditCard size={12}/> {ag.frais_mensuel || 50} TND/mois</span>
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
        </main>
      </div>

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
                          {a.prix ? Number(a.prix).toLocaleString("fr-TN") + " " + a.devise : "—"}
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
                <label>Frais mensuel (TND)</label>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input className="adm-modal__input" type="number" min="10" style={{width:120}}
                    value={agencyForm.frais_mensuel} onChange={e => setAgencyForm(p=>({...p,frais_mensuel:e.target.value}))}/>
                  <span style={{fontSize:12,color:"#64748b"}}>TND / mois pour le tableau de bord avancé</span>
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
      {modal?.action === "reject" && (
        <div className="adm-modal-bg" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal__head">
              <h2>Refuser cette annonce</h2>
              <button onClick={() => setModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b"}}>
                <X size={18}/>
              </button>
            </div>
            <div className="adm-modal__body">
              <p style={{marginBottom:12,color:"#64748b"}}>
                Annonce : <strong>«{modal.annonce.titre}»</strong>
              </p>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>
                Message pour le propriétaire (optionnel)
              </label>
              <textarea className="adm-modal__textarea" rows={4}
                placeholder="Ex: Photos manquantes, titre incomplet, prix non renseigné…"
                value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}/>
            </div>
            <div className="adm-modal__foot">
              <button className="adm-modal__cancel" onClick={() => setModal(null)}>Annuler</button>
              <button className="adm-modal__reject-btn"
                onClick={() => updateStatus(modal.annonce.id, "refusee", rejectMsg)}>
                <X size={14}/> Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

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
