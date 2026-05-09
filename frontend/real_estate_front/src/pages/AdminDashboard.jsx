import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../components/Toast";
import {
  LayoutDashboard, FileText, Users, CheckCircle, XCircle, Clock,
  Eye, Trash2, ChevronDown, RefreshCw, TrendingUp, Home, MapPin,
  BarChart3, X, Check, AlertCircle, Send, Building, Plus,
  CreditCard, ShieldCheck, ShieldOff, Mail, Phone
} from "lucide-react";


function StatusBadge({ status }) {
  const map = {
    approuvee:  { label:"Approuvée",   cls:"adm-badge--ok"   },
    en_attente: { label:"En attente",  cls:"adm-badge--warn" },
    refusee:    { label:"Refusée",     cls:"adm-badge--err"  },
  };
  const m = map[status] || { label: status, cls:"" };
  return <span className={`adm-badge ${m.cls}`}>{m.label}</span>;
}

function TypeBienFr(t) {
  const m = { appartement:"Appartement", villa:"Villa", maison:"Maison",
    terrain:"Terrain", bureau:"Bureau", local_commercial:"Local com.", ferme:"Ferme" };
  return m[t] || t;
}

export default function AdminDashboard() {
  const [tab,        setTab]      = useState("annonces");
  const [stats,      setStats]    = useState(null);
  const [annonces,   setAnnonces] = useState([]);
  const [users,      setUsers]    = useState([]);
  const [filter,     setFilter]   = useState("en_attente");
  const [loading,    setLoading]  = useState(true);
  const [modal,      setModal]    = useState(null);
  const [rejectMsg,  setRejectMsg]= useState("");

  /* ── Agences state ── */
  const [agencies,      setAgencies]     = useState([]);
  const [agencyModal,   setAgencyModal]  = useState(false);
  const [agencyForm,    setAgencyForm]   = useState({
    nom: "", email: "", telephone: "", adresse: "",
    matricule: "", frais_mensuel: "50", username: "", password: "",
  });
  const [agencySaving,  setAgencySaving] = useState(false);
  const [freqPeriod, setFreqPeriod] = useState("month");  // day | month | year
  const [freqFrom,   setFreqFrom]   = useState("");
  const [freqTo,     setFreqTo]     = useState("");
  const [freqData,   setFreqData]   = useState([]);

  const navigate = useNavigate();
  const toast    = useToast();
  const token    = localStorage.getItem("token");
  const user     = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      navigate("/login");
      return;
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (tab === "annonces") loadAnnonces();
    if (tab === "users")    loadUsers();
    if (tab === "stats")    loadFrequency();
    if (tab === "agences")  loadAgencies();
  }, [tab, filter]);

  useEffect(() => {
    if (tab === "stats") loadFrequency();
  }, [freqPeriod, freqFrom, freqTo]);

  async function authFetch(url, opts = {}) {
    const res = await fetch(`\${url}`, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
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
      else setAgencies([]);     // endpoint pas encore créé → liste vide
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...agencyForm, role: "agence" }),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abonnement_actif: !active }),
      });
      if (res.ok) {
        setAgencies(prev => prev.map(a => a.id === id ? { ...a, abonnement_actif: !active } : a));
        toast(!active ? "Abonnement activé." : "Abonnement suspendu.");
      }
    } catch {}
  }

  async function loadFrequency() {
    try {
      let url = "/admin/annonces?limit=1000";
      const res = await authFetch(url);
      if (!res.ok) return;
      const all = await res.json();
      const from = freqFrom ? new Date(freqFrom) : null;
      const to   = freqTo   ? new Date(freqTo + "T23:59:59") : null;

      const filtered = all.filter(a => {
        const d = new Date(a.date_creation);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
        return true;
      });

      const buckets = {};
      filtered.forEach(a => {
        const d = new Date(a.date_creation);
        let key;
        if (freqPeriod === "day")   key = d.toLocaleDateString("fr-FR");
        else if (freqPeriod === "year") key = `${d.getFullYear()}`;
        else key = d.toLocaleDateString("fr-FR", { month:"short", year:"numeric" });
        buckets[key] = (buckets[key] || 0) + 1;
      });

      const sorted = Object.entries(buckets)
        .map(([label, count]) => ({ label, count }))
        .slice(-20);
      setFreqData(sorted);
    } catch {}
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
      setModal(null);
      setRejectMsg("");
      loadStats();
    } catch {
      toast("Erreur lors de la mise à jour.", "error");
    }
  }

  async function deleteAnnonce(id) {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    try {
      await authFetch(`/admin/annonces/${id}`, { method: "DELETE" });
      setAnnonces(prev => prev.filter(a => a.id !== id));
      toast("Annonce supprimée.");
      loadStats();
    } catch {
      toast("Erreur.", "error");
    }
  }

  const STAT_CARDS = stats ? [
    { icon:<FileText size={22}/>,  label:"Total annonces",  val:stats.total_annonces, cls:"" },
    { icon:<CheckCircle size={22}/>,label:"Approuvées",     val:stats.approuvees,     cls:"adm-stat--green" },
    { icon:<Clock size={22}/>,     label:"En attente",      val:stats.en_attente,     cls:"adm-stat--amber" },
    { icon:<XCircle size={22}/>,   label:"Refusées",        val:stats.refusees,       cls:"adm-stat--red" },
    { icon:<Users size={22}/>,     label:"Utilisateurs",    val:stats.total_users,    cls:"adm-stat--blue" },
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
              className={`adm-nav${tab===item.id?" adm-nav--active":""}`}
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
          {/* Header */}
          <div className="adm-topbar">
            <h1 className="adm-topbar__title">
              {tab === "annonces"  && "Gestion des annonces"}
              {tab === "stats"     && "Statistiques"}
              {tab === "users"     && "Utilisateurs"}
              {tab === "agences"   && "Comptes Agences"}
            </h1>
            <button className="adm-refresh" onClick={loadAll}><RefreshCw size={15}/></button>
          </div>

          {/* Stats row (always visible) */}
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

          {/* ── TAB: Annonces ── */}
          {tab === "annonces" && (
            <>
              <div className="adm-filters">
                {[
                  { v:"en_attente", l:"En attente" },
                  { v:"approuvee",  l:"Approuvées" },
                  { v:"refusee",    l:"Refusées" },
                  { v:"",           l:"Toutes" },
                ].map(f => (
                  <button key={f.v}
                    className={`adm-filter-btn${filter===f.v?" adm-filter-btn--on":""}`}
                    onClick={() => setFilter(f.v)}>
                    {f.l}
                    {f.v==="en_attente" && stats?.en_attente > 0 && (
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
                        <th>Annonce</th>
                        <th>Propriétaire</th>
                        <th>Type / Cat.</th>
                        <th>Lieu</th>
                        <th>Prix</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Actions</th>
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
                            <span className="adm-pill adm-pill--cat">{a.categorie}</span>
                          </td>
                          <td className="adm-table__gov">{a.gouvernorat || "—"}</td>
                          <td className="adm-table__prix">
                            {a.prix ? `${Number(a.prix).toLocaleString()} ${a.devise}` : "—"}
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
                                  onClick={() => setModal({ annonce: a, action: "reject" })}>
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

          {/* ── TAB: Stats ── */}
          {tab === "stats" && stats && (
            <div className="adm-stats-page">

              {/* Fréquence de publication */}
              <div className="adm-chart-card adm-freq-card">
                <div className="adm-freq-header">
                  <h3>Fréquence de publication</h3>
                  <div className="adm-freq-controls">
                    {[
                      { v:"day",   l:"Par jour" },
                      { v:"month", l:"Par mois" },
                      { v:"year",  l:"Par année" },
                    ].map(p => (
                      <button key={p.v}
                        className={`adm-freq-btn${freqPeriod===p.v?" adm-freq-btn--on":""}`}
                        onClick={() => setFreqPeriod(p.v)}>
                        {p.l}
                      </button>
                    ))}
                    <div className="adm-freq-range">
                      <label>Du</label>
                      <input type="date" value={freqFrom} onChange={e=>setFreqFrom(e.target.value)} className="adm-freq-date"/>
                      <label>Au</label>
                      <input type="date" value={freqTo}   onChange={e=>setFreqTo(e.target.value)}   className="adm-freq-date"/>
                      {(freqFrom||freqTo) && (
                        <button className="adm-freq-clear" onClick={()=>{setFreqFrom("");setFreqTo("");}}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
                {freqData.length === 0 ? (
                  <p style={{color:"#94a3b8",textAlign:"center",padding:"30px 0",fontSize:13}}>Aucune donnée pour cette période</p>
                ) : (
                  <div className="adm-freq-chart">
                    {(() => {
                      const maxVal = Math.max(...freqData.map(d => d.count), 1);
                      return freqData.map(d => (
                        <div key={d.label} className="adm-freq-col">
                          <span className="adm-freq-val">{d.count}</span>
                          <div className="adm-freq-bar-wrap">
                            <div className="adm-freq-bar" style={{ height: `${Math.round((d.count/maxVal)*100)}%` }}/>
                          </div>
                          <span className="adm-freq-lbl">{d.label}</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              <div className="adm-charts-row" style={{marginTop:16}}>
                <div className="adm-chart-card">
                  <h3>Par type de bien</h3>
                  {stats.by_type.map(item => (
                    <div key={item.type} className="adm-bar-row">
                      <span className="adm-bar-label">{TypeBienFr(item.type)}</span>
                      <div className="adm-bar-wrap">
                        <div className="adm-bar" style={{
                          width: `${Math.min(100, (item.count / Math.max(...stats.by_type.map(x=>x.count))) * 100)}%`
                        }}/>
                      </div>
                      <span className="adm-bar-val">{item.count}</span>
                    </div>
                  ))}
                </div>

                <div className="adm-chart-card">
                  <h3>Par catégorie</h3>
                  {stats.by_categorie.map(item => (
                    <div key={item.categorie} className="adm-bar-row">
                      <span className="adm-bar-label">{item.categorie}</span>
                      <div className="adm-bar-wrap">
                        <div className="adm-bar adm-bar--purple" style={{
                          width: `${Math.min(100, (item.count / Math.max(...stats.by_categorie.map(x=>x.count))) * 100)}%`
                        }}/>
                      </div>
                      <span className="adm-bar-val">{item.count}</span>
                    </div>
                  ))}
                </div>

                <div className="adm-chart-card">
                  <h3>Top gouvernorats</h3>
                  {stats.top_gouvernorats.map((item, i) => (
                    <div key={item.nom} className="adm-bar-row">
                      <span className="adm-bar-label">
                        <span className="adm-rank">#{i+1}</span> {item.nom}
                      </span>
                      <div className="adm-bar-wrap">
                        <div className="adm-bar adm-bar--teal" style={{
                          width: `${Math.min(100, (item.count / Math.max(...stats.top_gouvernorats.map(x=>x.count))) * 100)}%`
                        }}/>
                      </div>
                      <span className="adm-bar-val">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Users ── */}
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
                        <td>{u.username}</td>
                        <td className="adm-table__email">{u.email}</td>
                        <td><span className={`adm-pill ${u.role==="admin"?"adm-pill--admin":""}`}>{u.role}</span></td>
                        <td>{u.nb_annonces}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {/* ── TAB: Agences ── */}
          {tab === "agences" && (
            <div className="adm-agences">
              {/* Header agences */}
              <div className="adm-agences__head">
                <div>
                  <h2 className="adm-agences__title">Comptes agences immobilières</h2>
                  <p className="adm-agences__sub">Chaque agence dispose d'un tableau de bord avancé pour le suivi de ses annonces</p>
                </div>
                <button className="adm-agences__create-btn" onClick={() => setAgencyModal(true)}>
                  <Plus size={15}/> Créer un compte agence
                </button>
              </div>

              {/* Pricing info */}
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

              {/* Liste agences */}
              {agencies.length === 0 ? (
                <div className="adm-empty"><Building size={40}/><p>Aucun compte agence créé.</p></div>
              ) : (
                <div className="adm-agency-list">
                  {agencies.map(ag => (
                    <div key={ag.id} className={`adm-agency-card${ag.abonnement_actif ? "" : " adm-agency-card--suspended"}`}>
                      <div className="adm-agency-card__left">
                        <div className="adm-agency-card__avatar">
                          {ag.nom?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="adm-agency-card__name">{ag.nom}</div>
                          <div className="adm-agency-card__meta">
                            <span><Mail size={11}/> {ag.email}</span>
                            {ag.telephone && <span><Phone size={11}/> {ag.telephone}</span>}
                            {ag.matricule && <span>Mat. {ag.matricule}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="adm-agency-card__right">
                        <div className="adm-agency-card__stats">
                          <span><Eye size={12}/> {ag.nb_annonces || 0} annonces</span>
                          <span><CreditCard size={12}/> {ag.frais_mensuel || 50} TND/mois</span>
                        </div>
                        <span className={`adm-agency-badge${ag.abonnement_actif ? " adm-agency-badge--active" : " adm-agency-badge--off"}`}>
                          {ag.abonnement_actif
                            ? <><ShieldCheck size={12}/> Actif</>
                            : <><ShieldOff size={12}/> Suspendu</>
                          }
                        </span>
                        <button
                          className={`adm-agency-toggle${ag.abonnement_actif ? " adm-agency-toggle--off" : " adm-agency-toggle--on"}`}
                          onClick={() => toggleAgencyStatus(ag.id, ag.abonnement_actif)}
                        >
                          {ag.abonnement_actif ? <><ShieldOff size={13}/> Suspendre</> : <><ShieldCheck size={13}/> Activer</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── Modal création agence ── */}
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
              <button onClick={() => setAgencyModal(false)}><X size={18}/></button>
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

              {/* Warning */}
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

      {/* Modal refus */}
      {modal?.action === "reject" && (
        <div className="adm-modal-bg" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal__head">
              <h2>Refuser cette annonce</h2>
              <button onClick={() => setModal(null)}><X size={18}/></button>
            </div>
            <div className="adm-modal__body">
              <p style={{marginBottom:12,color:"#64748b"}}>
                Annonce : <strong>«{modal.annonce.titre}»</strong>
              </p>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>
                Message pour le propriétaire (optionnel)
              </label>
              <textarea
                className="adm-modal__textarea"
                rows={4}
                placeholder="Ex: Photos manquantes, titre incomplet, prix non renseigné…"
                value={rejectMsg}
                onChange={e => setRejectMsg(e.target.value)}
              />
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

        /* Stats cards */
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

        /* Filters */
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
        .adm-table__id   { font-size:11px; color:#94a3b8; }
        .adm-table__user  { font-weight:600; color:#374151; }
        .adm-table__email { font-size:11px; color:#94a3b8; }
        .adm-table__gov   { font-size:12px; color:#64748b; }
        .adm-table__prix  { font-weight:700; color:#0f172a; font-size:13px; white-space:nowrap; }
        .adm-table__date  { font-size:12px; color:#64748b; white-space:nowrap; }

        /* Badges */
        .adm-badge {
          display:inline-block; font-size:11px; font-weight:700;
          padding:3px 9px; border-radius:20px;
        }
        .adm-badge--ok   { background:#f0fdf4; color:#15803d; }
        .adm-badge--warn { background:#fffbeb; color:#b45309; }
        .adm-badge--err  { background:#fef2f2; color:#b91c1c; }

        .adm-pill {
          display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase;
          letter-spacing:.04em; padding:2px 7px; border-radius:5px;
          background:#f1f5f9; color:#475569; margin-right:4px;
        }
        .adm-pill--cat   { background:#eef2ff; color:#4f46e5; }
        .adm-pill--admin { background:#0f172a; color:#fff; }

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

        /* Charts */
        .adm-stats-page { }
        .adm-charts-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .adm-chart-card {
          background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:20px;
        }
        .adm-chart-card h3 { font-size:14px; font-weight:700; color:#0f172a; margin-bottom:16px; }
        .adm-bar-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .adm-bar-label { font-size:12px; color:#64748b; width:110px; flex-shrink:0; display:flex; align-items:center; gap:5px; }
        .adm-bar-wrap { flex:1; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
        .adm-bar        { height:100%; background:#6366f1; border-radius:4px; transition:width .4s; }
        .adm-bar--purple{ background:#8b5cf6; }
        .adm-bar--teal  { background:#0d9488; }
        .adm-bar-val { font-size:12px; font-weight:700; color:#0f172a; width:24px; text-align:right; }
        .adm-rank { font-size:10px; font-weight:800; color:#94a3b8; }

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
        .adm-freq-range { display:flex; align-items:center; gap:6px; }
        .adm-freq-range label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; }
        .adm-freq-date {
          padding:5px 8px; border:1.5px solid #e5e7eb; border-radius:7px;
          font-size:12px; font-family:inherit; color:#374151; outline:none;
          transition:border-color .15s;
        }
        .adm-freq-date:focus { border-color:#6366f1; }
        .adm-freq-clear {
          padding:4px 8px; border-radius:6px; border:1px solid #e5e7eb;
          background:#fff; color:#94a3b8; cursor:pointer; font-size:11px;
          transition:all .15s;
        }
        .adm-freq-clear:hover { color:#dc2626; border-color:#dc2626; }

        .adm-freq-chart {
          display:flex; align-items:flex-end; gap:6px;
          height:180px; padding:0 4px;
          overflow-x:auto;
        }
        .adm-freq-col {
          display:flex; flex-direction:column; align-items:center; gap:4px;
          flex:1; min-width:36px; max-width:60px; height:100%;
        }
        .adm-freq-val {
          font-size:10px; font-weight:700; color:#4f46e5; white-space:nowrap;
        }
        .adm-freq-bar-wrap {
          flex:1; width:100%; display:flex; align-items:flex-end;
          background:#f1f5f9; border-radius:6px 6px 0 0; overflow:hidden;
        }
        .adm-freq-bar {
          width:100%; background:linear-gradient(180deg,#818cf8,#6366f1);
          border-radius:6px 6px 0 0; transition:height .4s ease;
          min-height:2px;
        }
        .adm-freq-lbl {
          font-size:9.5px; color:#94a3b8; text-align:center;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          max-width:100%; writing-mode:horizontal-tb;
        }

        /* Empty */
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

        /* Modal */
        .adm-modal-bg {
          position:fixed; inset:0; background:rgba(0,0,0,.4);
          z-index:9000; display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .adm-modal {
          background:#fff; border-radius:14px; width:100%; max-width:460px;
          box-shadow:0 20px 60px rgba(0,0,0,.2); overflow:hidden;
        }
        .adm-modal--agency { max-width:600px; }
        .adm-modal__input {
          width:100%; padding:9px 12px; border:1.5px solid #e2e8f0;
          border-radius:9px; font-size:13.5px; font-family:inherit; outline:none;
          color:#0f172a; box-sizing:border-box; margin-top:4px; background:#f9fafb;
          transition:border-color .15s;
        }
        .adm-modal__input:focus { border-color:#6366f1; background:#fff; }
        .adm-modal__section-lbl {
          font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
          color:#94a3b8; margin-bottom:10px; margin-top:4px;
        }
        .adm-modal__body label { font-size:12px; font-weight:700; color:#374151; display:block; }
        .adm-modal__row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:12px; }
        .adm-modal__row > div { display:flex; flex-direction:column; }
        .adm-modal__body > div:not(.adm-modal__row) { margin-bottom:12px; }
        .adm-modal__save {
          display:flex; align-items:center; gap:7px;
          padding:9px 18px; border-radius:9px; border:none;
          color:#fff; font-size:13.5px; font-weight:700; cursor:pointer;
          font-family:inherit; transition:opacity .15s;
        }
        .adm-modal__save:disabled { opacity:.6; cursor:not-allowed; }
        .adm-agency-warn {
          display:flex; align-items:flex-start; gap:8px;
          padding:10px 14px; background:#fef9c3; border:1px solid #fde68a;
          border-radius:10px; font-size:12px; color:#92400e; font-weight:500;
          margin-top:4px;
        }

        /* Agences tab */
        .adm-agences { padding:24px; }
        .adm-agences__head {
          display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
          margin-bottom:20px; flex-wrap:wrap;
        }
        .adm-agences__title { font-size:18px; font-weight:800; color:#0f172a; }
        .adm-agences__sub { font-size:13px; color:#94a3b8; margin-top:3px; }
        .adm-agences__create-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 18px; border-radius:10px; border:none;
          background:#6366f1; color:#fff; font-size:13px; font-weight:700;
          cursor:pointer; font-family:inherit; white-space:nowrap;
          transition:background .15s;
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
        .adm-agency-plan__name { font-size:14px; font-weight:800; color:#fff; }
        .adm-agency-plan__desc { font-size:12px; color:#64748b; margin-top:2px; }
        .adm-agency-plan__price { margin-left:auto; font-size:24px; font-weight:900; color:#6366f1; }
        .adm-agency-plan__price span { font-size:12px; color:#64748b; font-weight:600; }
        .adm-agency-plan__warning {
          display:flex; align-items:center; gap:5px;
          font-size:11.5px; color:#f59e0b; font-weight:600;
          padding:5px 10px; background:rgba(245,158,11,.1); border-radius:8px;
        }

        .adm-agency-list { display:flex; flex-direction:column; gap:12px; }
        .adm-agency-card {
          display:flex; align-items:center; gap:16px;
          background:#fff; border:1px solid #e5e7eb; border-radius:12px;
          padding:16px 18px; transition:box-shadow .15s;
        }
        .adm-agency-card:hover { box-shadow:0 3px 14px rgba(0,0,0,.06); }
        .adm-agency-card--suspended { opacity:.65; background:#fafafa; }
        .adm-agency-card__left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
        .adm-agency-card__avatar {
          width:44px; height:44px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#6366f1,#4f46e5);
          display:flex; align-items:center; justify-content:center;
          color:#fff; font-size:18px; font-weight:800;
        }
        .adm-agency-card__name { font-size:15px; font-weight:700; color:#0f172a; }
        .adm-agency-card__meta { display:flex; gap:12px; flex-wrap:wrap; margin-top:4px; }
        .adm-agency-card__meta span {
          display:flex; align-items:center; gap:4px;
          font-size:12px; color:#64748b;
        }
        .adm-agency-card__right { display:flex; align-items:center; gap:12px; flex-shrink:0; flex-wrap:wrap; }
        .adm-agency-card__stats { display:flex; gap:10px; }
        .adm-agency-card__stats span {
          display:flex; align-items:center; gap:4px;
          font-size:12px; color:#94a3b8; font-weight:600;
        }
        .adm-agency-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700;
        }
        .adm-agency-badge--active { background:#f0fdf4; color:#15803d; }
        .adm-agency-badge--off { background:#fef2f2; color:#b91c1c; }
        .adm-agency-toggle {
          display:flex; align-items:center; gap:5px;
          padding:7px 14px; border-radius:8px; border:none;
          font-size:12px; font-weight:700; cursor:pointer; font-family:inherit;
          transition:all .15s;
        }
        .adm-agency-toggle--off { background:#fef2f2; color:#b91c1c; }
        .adm-agency-toggle--off:hover { background:#fee2e2; }
        .adm-agency-toggle--on { background:#f0fdf4; color:#15803d; }
        .adm-agency-toggle--on:hover { background:#dcfce7; }
        .adm-modal__head {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 22px; border-bottom:1px solid #e5e7eb;
        }
        .adm-modal__head h2 { font-size:16px; font-weight:700; color:#0f172a; }
        .adm-modal__head button { background:none; border:none; cursor:pointer; color:#64748b; }
        .adm-modal__body { padding:18px 22px; }
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
        }
        .adm-modal__reject-btn {
          display:flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:8px; border:none;
          background:#dc2626; color:#fff; font-size:13px; font-weight:700;
          cursor:pointer; font-family:inherit;
        }

        @media (max-width:1200px) { .adm-stats { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:900px)  {
          .adm-page { flex-direction:column; }
          .adm-sidebar { width:100%; min-height:auto; flex-direction:row; flex-wrap:wrap; padding:10px; }
          .adm-charts-row { grid-template-columns:1fr; }
        }
      `}</style>
    </>
  );
}
