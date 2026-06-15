import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import API_URL from "../config";
import {
  Users, Plus, Trash2, X, Eye, EyeOff, User, Mail,
  Phone, RefreshCw, Copy, CheckCircle, AlertCircle,
  Home, Heart, LogOut, Building2, Shield,
} from "lucide-react";
import { useToast } from "../components/Toast";

/* ─── Génération mot de passe ─── */
const genPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let p = "Loc@";
  for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
};

export default function AgenceAgents() {
  const toast    = useToast();
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const token      = localStorage.getItem("token");

  /* Redirection si pas agence */
  useEffect(() => {
    if (!storedUser || storedUser.role !== "agence") navigate("/compte");
  }, []); // eslint-disable-line

  const [agents,  setAgents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState(null); /* id en cours de suppression */

  /* ── Chargement agents ── */
  const loadAgents = () => {
    setLoading(true);
    fetch(`${API_URL}/users/me/agents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setAgents(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAgents(); }, []); // eslint-disable-line

  const handleDelete = async (agentId, username) => {
    if (!confirm(`Supprimer le compte de ${username} ? Cette action est irréversible.`)) return;
    setDeleting(agentId);
    try {
      const r = await fetch(`${API_URL}/users/me/agents/${agentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      toast(`Compte de ${username} supprimé.`);
      setAgents(prev => prev.filter(a => a.id !== agentId));
    } catch {
      toast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast("Déconnexion réussie.");
    setTimeout(() => { window.location.href = "/"; }, 800);
  };

  return (
    <Layout>
      <div className="aa-page">

        {/* ── Hero ── */}
        <div className="aa-hero">
          <div className="aa-hero__inner">
            <div className="aa-hero__icon"><Building2 size={28} /></div>
            <div>
              <h1 className="aa-hero__name">{storedUser?.username}</h1>
              <p className="aa-hero__sub">{storedUser?.email}</p>
              <span className="aa-hero__badge">Agence</span>
            </div>
          </div>
        </div>

        <div className="aa-body">
          {/* ── Sidebar ── */}
          <aside className="aa-sidebar">
            <Link to="/dashboard" className="aa-nav-item">
              <Home size={17}/> Mes annonces
            </Link>
            <Link to="/favoris" className="aa-nav-item">
              <Heart size={17}/> Mes favoris
            </Link>
            <Link to="/compte" className="aa-nav-item">
              <User size={17}/> Mon profil
            </Link>
            <button className="aa-nav-item aa-nav-item--active">
              <Users size={17}/> Mon équipe
            </button>
            <button className="aa-nav-item aa-nav-item--danger" onClick={handleLogout}>
              <LogOut size={17}/> Déconnexion
            </button>
          </aside>

          {/* ── Main ── */}
          <main className="aa-main">
            <div className="aa-card">
              <div className="aa-card__head">
                <div>
                  <h2><Users size={18} style={{verticalAlign:"middle",marginRight:8,color:"#6366f1"}}/>
                    Agents de l'agence
                  </h2>
                  <p className="aa-card__sub">
                    {agents.length} agent{agents.length !== 1 ? "s" : ""} rattaché{agents.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button className="aa-btn-primary" onClick={() => setShowModal(true)}>
                  <Plus size={15}/> Créer un compte agent
                </button>
              </div>

              {loading ? (
                <div className="aa-loading"><RefreshCw size={20} className="aa-spin"/> Chargement…</div>
              ) : agents.length === 0 ? (
                <div className="aa-empty">
                  <Users size={40} style={{color:"#d1d5db",marginBottom:12}}/>
                  <p style={{fontWeight:600,color:"#374151"}}>Aucun agent pour l'instant</p>
                  <p style={{fontSize:13,color:"#9ca3af"}}>Créez le premier compte agent de votre agence.</p>
                </div>
              ) : (
                <div className="aa-table-wrap">
                  <table className="aa-table">
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Statut</th>
                        <th style={{width:60}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map(a => (
                        <tr key={a.id}>
                          <td>
                            <div className="aa-agent-name">
                              <div className="aa-avatar">
                                {a.profile_picture
                                  ? <img src={a.profile_picture} alt=""/>
                                  : <span>{(a.username||"?")[0].toUpperCase()}</span>
                                }
                              </div>
                              <div>
                                <div style={{fontWeight:700,color:"#0f172a"}}>
                                  {a.nom && a.prenom ? `${a.prenom} ${a.nom}` : a.username}
                                </div>
                                {(a.nom || a.prenom) && (
                                  <div style={{fontSize:11,color:"#94a3b8"}}>@{a.username}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{color:"#475569",fontSize:13}}>{a.email}</td>
                          <td style={{color:"#475569",fontSize:13}}>{a.phone_number || "—"}</td>
                          <td>
                            {a.must_change_password
                              ? <span className="aa-pill aa-pill--warn"><AlertCircle size={11}/> Connexion en attente</span>
                              : <span className="aa-pill aa-pill--ok"><CheckCircle size={11}/> Actif</span>
                            }
                          </td>
                          <td>
                            <button
                              className="aa-del-btn"
                              title="Supprimer cet agent"
                              disabled={deleting === a.id}
                              onClick={() => handleDelete(a.id, a.username)}
                            >
                              {deleting === a.id ? <RefreshCw size={14} className="aa-spin"/> : <Trash2 size={14}/>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ── Modal création agent ── */}
        {showModal && (
          <CreateAgentModal
            storedUser={storedUser}
            token={token}
            onClose={() => setShowModal(false)}
            onCreated={(newAgent) => {
              setAgents(prev => [...prev, newAgent]);
              setShowModal(false);
            }}
          />
        )}

      </div>

      {/* ── Styles ── */}
      <style>{`
        .aa-page { min-height:100vh; background:#f8fafc; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }

        /* Hero */
        .aa-hero { background:linear-gradient(135deg,#1e293b,#334155); padding:32px 40px; }
        .aa-hero__inner { display:flex; align-items:center; gap:20px; max-width:1100px; margin:0 auto; }
        .aa-hero__icon { width:56px;height:56px;border-radius:16px;background:rgba(255,255,255,.12);
          display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0; }
        .aa-hero__name { font-size:22px;font-weight:800;color:#fff;margin:0 0 2px; }
        .aa-hero__sub  { font-size:13px;color:#94a3b8;margin:0 0 6px; }
        .aa-hero__badge { display:inline-block;font-size:11px;font-weight:700;
          background:#ede9fe;color:#6d28d9;padding:2px 10px;border-radius:999px; }

        /* Layout */
        .aa-body { display:flex; max-width:1100px; margin:0 auto; padding:32px 24px; gap:24px; }

        /* Sidebar */
        .aa-sidebar { width:200px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;
          background:#fff;border-radius:14px;padding:8px;border:1.5px solid #e2e8f0;
          align-self:flex-start; }
        .aa-nav-item { display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:9px;
          font-size:13.5px;font-weight:600;color:#475569;text-decoration:none;background:transparent;border:none;
          cursor:pointer;font-family:inherit;transition:all .15s;width:100%;text-align:left; }
        .aa-nav-item:hover { background:#f1f5f9;color:#1e293b; }
        .aa-nav-item--active { background:#eef2ff;color:#4f46e5; }
        .aa-nav-item--danger { color:#ef4444; }
        .aa-nav-item--danger:hover { background:#fee2e2; }

        /* Main */
        .aa-main { flex:1;min-width:0; }
        .aa-card { background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden; }
        .aa-card__head { display:flex;align-items:flex-start;justify-content:space-between;
          padding:22px 24px 20px;border-bottom:1px solid #f1f5f9; }
        .aa-card__head h2 { font-size:16px;font-weight:800;color:#0f172a;margin:0 0 3px; }
        .aa-card__sub { font-size:12px;color:#94a3b8;margin:0; }

        .aa-btn-primary { display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;
          background:#6366f1;color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;
          font-family:inherit;transition:all .15s;white-space:nowrap; }
        .aa-btn-primary:hover { background:#4f46e5;transform:translateY(-1px); }

        .aa-loading { display:flex;align-items:center;gap:10px;padding:48px 24px;
          color:#94a3b8;font-size:14px;justify-content:center; }
        .aa-empty { text-align:center;padding:56px 24px; }
        @keyframes aa-spin { to { transform:rotate(360deg); } }
        .aa-spin { animation:aa-spin .7s linear infinite; }

        /* Table */
        .aa-table-wrap { overflow-x:auto; }
        .aa-table { width:100%;border-collapse:collapse;font-size:13.5px; }
        .aa-table th { padding:10px 16px;text-align:left;font-size:11px;font-weight:700;
          color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;
          border-bottom:1px solid #f1f5f9;white-space:nowrap; }
        .aa-table td { padding:14px 16px;border-bottom:1px solid #f8fafc;vertical-align:middle; }
        .aa-table tr:last-child td { border-bottom:none; }
        .aa-table tbody tr:hover td { background:#fafafa; }

        .aa-agent-name { display:flex;align-items:center;gap:10px; }
        .aa-avatar { width:36px;height:36px;border-radius:50%;background:#e0e7ff;
          display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0; }
        .aa-avatar img { width:100%;height:100%;object-fit:cover; }
        .aa-avatar span { font-size:14px;font-weight:700;color:#6366f1; }

        .aa-pill { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;
          border-radius:999px;font-size:11px;font-weight:700; }
        .aa-pill--ok   { background:#dcfce7;color:#166534; }
        .aa-pill--warn { background:#fef9c3;color:#854d0e; }

        .aa-del-btn { width:30px;height:30px;border-radius:8px;border:1.5px solid #e5e7eb;
          background:#f8fafc;color:#94a3b8;display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:all .15s; }
        .aa-del-btn:hover { background:#fee2e2;border-color:#fca5a5;color:#ef4444; }
        .aa-del-btn:disabled { opacity:.5;cursor:not-allowed; }

        /* Modal */
        .aa-modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);
          display:flex;align-items:center;justify-content:center;z-index:9000;padding:16px; }
        .aa-modal { background:#fff;border-radius:16px;width:100%;max-width:520px;
          box-shadow:0 24px 64px rgba(0,0,0,.22);overflow:hidden; }
        .aa-modal__head { display:flex;align-items:center;justify-content:space-between;
          padding:20px 24px;border-bottom:1px solid #f1f5f9; }
        .aa-modal__head h3 { font-size:16px;font-weight:800;color:#0f172a;margin:0; }
        .aa-modal__close { width:32px;height:32px;border-radius:8px;border:none;background:#f1f5f9;
          color:#64748b;display:flex;align-items:center;justify-content:center;cursor:pointer; }
        .aa-modal__body { padding:24px; }
        .aa-modal__foot { padding:16px 24px;border-top:1px solid #f1f5f9;
          display:flex;gap:10px;justify-content:flex-end; }

        .aa-field { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
        .aa-field label { font-size:11.5px;font-weight:700;color:#64748b;
          text-transform:uppercase;letter-spacing:.04em; }
        .aa-field input { padding:10px 13px;border:1.5px solid #e2e8f0;border-radius:9px;
          font-size:13.5px;font-family:inherit;color:#0f172a;outline:none;
          transition:border-color .15s; }
        .aa-field input:focus { border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1); }
        .aa-field input:read-only { background:#f8fafc;color:#94a3b8;cursor:default; }

        .aa-field-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }

        .aa-pwd-row { display:flex;gap:8px; }
        .aa-pwd-row input { flex:1;min-width:0; }
        .aa-pwd-toggle { width:40px;height:40px;border:1.5px solid #e2e8f0;border-radius:9px;
          background:#f8fafc;color:#64748b;display:flex;align-items:center;justify-content:center;
          cursor:pointer;flex-shrink:0;transition:all .15s; }
        .aa-pwd-toggle:hover { background:#eef2ff;border-color:#c7d2fe;color:#6366f1; }
        .aa-pwd-copy { width:40px;height:40px;border:1.5px solid #e2e8f0;border-radius:9px;
          background:#f8fafc;color:#64748b;display:flex;align-items:center;justify-content:center;
          cursor:pointer;flex-shrink:0;transition:all .15s; }
        .aa-pwd-copy:hover { background:#dcfce7;border-color:#86efac;color:#16a34a; }
        .aa-pwd-hint { font-size:11px;color:#94a3b8;margin-top:3px; }

        .aa-btn-ghost { padding:9px 18px;border-radius:10px;border:1.5px solid #e5e7eb;
          background:#fff;color:#475569;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit; }
        .aa-btn-ghost:hover { background:#f8fafc; }
        .aa-btn-submit { padding:9px 22px;border-radius:10px;border:none;
          background:#6366f1;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;
          transition:all .15s;display:flex;align-items:center;gap:6px; }
        .aa-btn-submit:hover { background:#4f46e5; }
        .aa-btn-submit:disabled { opacity:.6;cursor:not-allowed; }

        .aa-section-title { font-size:11px;font-weight:700;color:#94a3b8;
          text-transform:uppercase;letter-spacing:.06em;margin:18px 0 10px;
          padding-bottom:6px;border-bottom:1px solid #f1f5f9; }

        .aa-info-box { background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;
          padding:10px 13px;font-size:12px;color:#1e40af;margin-bottom:14px;
          display:flex;align-items:flex-start;gap:8px; }
      `}</style>
    </Layout>
  );
}


/* ─────────────────────────────────────────────────
   Modal de création d'un agent
───────────────────────────────────────────────── */
function CreateAgentModal({ storedUser, token, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    username: "",
    email:    "",
    nom:      "",
    prenom:   "",
    password: genPassword(),
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const copyPwd = () => {
    navigator.clipboard.writeText(form.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.email.trim()) {
      setError("Nom d'utilisateur et email sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me/agents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email:    form.email.trim(),
          password: form.password,
          nom:      form.nom.trim()    || undefined,
          prenom:   form.prenom.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Erreur lors de la création.");
        return;
      }
      const data = await res.json();
      toast(`Compte agent @${data.username} créé !`);
      onCreated(data);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aa-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="aa-modal">
        <div className="aa-modal__head">
          <h3><Plus size={16} style={{verticalAlign:"middle",marginRight:6,color:"#6366f1"}}/>
            Créer un compte agent
          </h3>
          <button className="aa-modal__close" onClick={onClose}><X size={16}/></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="aa-modal__body">

            {/* Info box */}
            <div className="aa-info-box">
              <Shield size={14} style={{flexShrink:0,marginTop:1}}/>
              <span>
                Cet agent fera partie de <strong>{storedUser?.username}</strong>.
                Il pourra changer son mot de passe après sa première connexion.
              </span>
            </div>

            {/* Identité */}
            <div className="aa-section-title">Identité (optionnel)</div>
            <div className="aa-field-row">
              <div className="aa-field">
                <label>Prénom</label>
                <input value={form.prenom} onChange={e => set("prenom", e.target.value)} placeholder="Prénom"/>
              </div>
              <div className="aa-field">
                <label>Nom</label>
                <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Nom de famille"/>
              </div>
            </div>

            {/* Connexion */}
            <div className="aa-section-title">Identifiants de connexion *</div>
            <div className="aa-field">
              <label><User size={11} style={{verticalAlign:"middle",marginRight:3}}/>Nom d'utilisateur</label>
              <input
                value={form.username}
                onChange={e => set("username", e.target.value)}
                placeholder="ex : agent.dupont"
                required
              />
            </div>
            <div className="aa-field">
              <label><Mail size={11} style={{verticalAlign:"middle",marginRight:3}}/>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="agent@exemple.com"
                required
              />
            </div>

            {/* Agence — pré-rempli lecture seule */}
            <div className="aa-section-title">Rattachement agence</div>
            <div className="aa-field">
              <label>Agence</label>
              <input value={storedUser?.username || ""} readOnly/>
            </div>

            {/* Mot de passe provisoire */}
            <div className="aa-section-title">Mot de passe provisoire</div>
            <div className="aa-field">
              <label>Mot de passe à communiquer à l'agent</label>
              <div className="aa-pwd-row">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                />
                <button type="button" className="aa-pwd-toggle" onClick={() => setShowPwd(v => !v)} title="Afficher">
                  {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
                <button type="button" className="aa-pwd-copy" onClick={copyPwd} title="Copier">
                  {copied ? <CheckCircle size={15}/> : <Copy size={15}/>}
                </button>
                <button type="button" className="aa-pwd-copy" onClick={() => set("password", genPassword())} title="Regénérer">
                  <RefreshCw size={15}/>
                </button>
              </div>
              <p className="aa-pwd-hint">L'agent devra changer ce mot de passe à sa première connexion.</p>
            </div>

            {error && (
              <p style={{color:"#ef4444",fontSize:12.5,fontWeight:600,margin:"4px 0 0"}}>{error}</p>
            )}
          </div>

          <div className="aa-modal__foot">
            <button type="button" className="aa-btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="aa-btn-submit" disabled={saving}>
              {saving ? <><RefreshCw size={13} className="aa-spin"/> Création…</> : <><Plus size={13}/> Créer l'agent</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
