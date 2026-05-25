import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../components/Toast";
import API_URL from "../config";
import {
  Home, Plus, Eye, Edit2, Trash2, MapPin, TrendingUp,
  Clock, CheckCircle, XCircle, AlertCircle, X, Search, Zap
} from "lucide-react";


function statusBadge(s) {
  if (s === "approuvee")    return { label: "Approuvée",     cls: "db-badge--ok",   icon: <CheckCircle size={12}/> };
  if (s === "refusee")      return { label: "Refusée",       cls: "db-badge--err",  icon: <XCircle size={12}/> };
  return                           { label: "En attente",    cls: "db-badge--warn", icon: <Clock size={12}/> };
}

function typeBienLabel(t) {
  const map = { appartement:"Appartement", villa:"Villa", maison:"Maison",
    terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme" };
  return map[t] || t;
}
function categorieLabel(c) {
  const map = { vente:"Vente", location:"Location", vacances:"Vacances" };
  return map[c] || c;
}

export default function Dashboard() {
  const [annonces, setAnnonces]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [delItem,  setDelItem]      = useState(null);
  const [search,   setSearch]       = useState("");
  const navigate = useNavigate();
  const toast    = useToast();

  const token = localStorage.getItem("token");
  const user  = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchAnnonces();
  }, []);

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
        ? [...data].sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
        : [];
      setAnnonces(sorted);
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

  const stats = {
    total:    annonces.length,
    publiees: annonces.filter(a => a.status === "approuvee").length,
    attente:  annonces.filter(a => a.status === "en_attente").length,
    vues:     annonces.reduce((s, a) => s + (a.views_count || 0), 0),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return annonces;
    return annonces.filter(a => {
      const prop = a.properties?.[0];
      return (
        (a.titre         || "").toLowerCase().includes(q) ||
        (a.type_bien     || "").toLowerCase().includes(q) ||
        (a.categorie     || "").toLowerCase().includes(q) ||
        (a.status        || "").toLowerCase().includes(q) ||
        (prop?.address   || "").toLowerCase().includes(q) ||
        typeBienLabel(a.type_bien).toLowerCase().includes(q) ||
        categorieLabel(a.categorie).toLowerCase().includes(q)
      );
    });
  }, [annonces, search]);

  return (
    <>
      <Navbar />
      <div className="db-page">
        {/* Header */}
        <div className="db-header">
          <div className="db-header__inner">
            <div>
              <h1 className="db-header__title">Mes annonces</h1>
              <p className="db-header__sub">Gérez toutes vos publications immobilières</p>
            </div>
            <div style={{display:"flex",gap:10}}>
{/* Boost désactivé temporairement
              <Link to="/booster" className="db-btn-boost">
                <Zap size={16}/> Booster mes annonces
              </Link>
*/}
              <Link to="/creer_annonce" className="db-btn-primary">
                <Plus size={17}/> Nouvelle annonce
              </Link>
            </div>
          </div>
        </div>

        <div className="db-inner">
          {/* Stats */}
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

          {/* Search bar */}
          {!loading && annonces.length > 0 && (
            <div className="db-toolbar">
              <div className="db-search">
                <Search size={15} className="db-search__ico"/>
                <input
                  className="db-search__input"
                  type="text"
                  placeholder="Rechercher par titre, type, ville, statut…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="db-search__clear" onClick={() => setSearch("")} type="button">
                    <X size={13}/>
                  </button>
                )}
              </div>
              <span className="db-toolbar__count">
                {filtered.length} annonce{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="db-empty"><div className="db-spinner"/><p>Chargement…</p></div>
          ) : annonces.length === 0 ? (
            <div className="db-empty">
              <Home size={48} strokeWidth={1.2}/>
              <p>Aucune annonce publiée pour l'instant.</p>
              <Link to="/creer_annonce" className="db-btn-primary"><Plus size={16}/> Créer ma première annonce</Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="db-empty">
              <Search size={40} strokeWidth={1.2}/>
              <p>Aucune annonce ne correspond à « <strong>{search}</strong> »</p>
              <button className="db-btn-secondary" onClick={() => setSearch("")}>Effacer la recherche</button>
            </div>
          ) : (
            <div className="db-list">
              {filtered.map(a => {
                const badge = statusBadge(a.status);
                const prop  = a.properties?.[0];
                return (
                  <div key={a.id} className="db-card">
                    <div className="db-card__left">
                      <div className="db-card__type-badge">{typeBienLabel(a.type_bien)}</div>
                      <h3 className="db-card__title">{a.titre}</h3>
                      <div className="db-card__meta">
                        <span className={`db-badge ${badge.cls}`}>{badge.icon} {badge.label}</span>
                        <span className="db-card__cat">{categorieLabel(a.categorie)}</span>
                        {prop?.address && (
                          <span className="db-card__loc"><MapPin size={12}/> {prop.address}</span>
                        )}
                      </div>
                    </div>

                    <div className="db-card__center">
                      <p className="db-card__prix">{a.prix ? `${Number(a.prix).toLocaleString()} ${a.devise}` : "Prix non défini"}</p>
                      <p className="db-card__sup">{a.superficie ? `${a.superficie} m²` : ""}</p>
                      <p className="db-card__date">
                        <Clock size={11}/> {new Date(a.date_creation).toLocaleString("fr-FR", { dateStyle:"short", timeStyle:"short" })}
                      </p>
                    </div>

                    <div className="db-card__actions">
                      <Link to={`/annonce/${a.id}`} className="db-action db-action--view" title="Voir">
                        <Eye size={16}/>
                      </Link>
                      <Link to={`/modifier_annonce/${a.id}`} className="db-action db-action--edit" title="Modifier">
                        <Edit2 size={16}/>
                      </Link>
                      <button className="db-action db-action--del" title="Supprimer"
                        onClick={() => setDelItem(a)}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
        .db-card__title { font-size: 16px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
    </>
  );
}
