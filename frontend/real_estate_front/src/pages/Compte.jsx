import React, { useState, useRef } from "react";
import API_URL from '../config';
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { User, Home, Heart, LogOut, Edit, Camera, Phone, Mail, Save, X } from "lucide-react";
import { useToast } from "../components/Toast";


export default function Compte() {
  const toast = useToast();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();
  const token = localStorage.getItem("token");

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [profile, setProfile] = useState({
    username:        storedUser?.username        || "",
    email:           storedUser?.email           || "",
    phone_number:    storedUser?.phone_number    || "",
    profile_picture: storedUser?.profile_picture || "",
  });
  const [avatarPreview, setAvatarPreview] = useState(storedUser?.profile_picture || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  if (!storedUser) {
    return (
      <Layout>
        <div style={{ textAlign:"center", padding:"80px 20px", fontFamily:"'Inter',system-ui,sans-serif" }}>
          <p style={{ marginBottom:16, color:"#64748b" }}>Vous n'êtes pas connecté.</p>
          <Link to="/login" style={{ color:"#4f46e5", fontWeight:700 }}>Se connecter</Link>
        </div>
      </Layout>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast("Déconnexion réussie.");
    setTimeout(() => { window.location.href = "/"; }, 800);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("Image trop lourde (max 5 MB).", "error"); return; }

    /* Local preview immediately */
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    /* Upload to backend */
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newPic = data.profile_picture;
      setAvatarPreview(newPic);
      setProfile(p => ({ ...p, profile_picture: newPic }));
      const updated = { ...storedUser, profile_picture: newPic };
      localStorage.setItem("user", JSON.stringify(updated));
      toast("Photo de profil mise à jour !");
    } catch {
      toast("Erreur lors de l'upload.", "error");
      setAvatarPreview(profile.profile_picture);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          username:     profile.username     || undefined,
          phone_number: profile.phone_number || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const newUser = { ...storedUser, ...updated };
      localStorage.setItem("user", JSON.stringify(newUser));
      setEditing(false);
      toast("Profil mis à jour !");
    } catch {
      toast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile.username || "?")[0].toUpperCase();

  return (
    <Layout>
      <div className="cpt-page">
        {/* Hero banner */}
        <div className="cpt-hero">
          <div className="cpt-hero__inner">
            {/* Avatar with upload button */}
            <div className="cpt-avatar-wrap">
              <div className="cpt-avatar">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar"/>
                  : <span className="cpt-avatar__init">{initials}</span>
                }
                {uploadingAvatar && <div className="cpt-avatar__spinner"/>}
              </div>
              <button
                className="cpt-avatar__cam"
                onClick={() => fileInputRef.current?.click()}
                title="Changer la photo"
                disabled={uploadingAvatar}
              >
                <Camera size={14}/>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display:"none" }}
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <h1 className="cpt-hero__name">{profile.username}</h1>
              <p className="cpt-hero__email">{profile.email}</p>
            </div>
          </div>
        </div>

        <div className="cpt-body">
          {/* Sidebar */}
          <aside className="cpt-sidebar">
            <Link to="/dashboard" className="cpt-nav-item">
              <Home size={17}/> Mes annonces
            </Link>
            <Link to="/favoris" className="cpt-nav-item">
              <Heart size={17}/> Mes favoris
            </Link>
            <button className="cpt-nav-item cpt-nav-item--active">
              <User size={17}/> Mon profil
            </button>
            <button className="cpt-nav-item cpt-nav-item--danger" onClick={handleLogout}>
              <LogOut size={17}/> Déconnexion
            </button>
          </aside>

          {/* Main */}
          <main className="cpt-main">
            {/* Profile card */}
            <div className="cpt-card">
              <div className="cpt-card__head">
                <h2>Informations personnelles</h2>
                {!editing
                  ? <button className="cpt-btn-sec" onClick={() => setEditing(true)}>
                      <Edit size={14}/> Modifier
                    </button>
                  : <button className="cpt-btn-sec" onClick={() => setEditing(false)}>
                      <X size={14}/> Annuler
                    </button>
                }
              </div>

              <div className="cpt-grid">
                <div className="cpt-field">
                  <label><User size={12}/> Nom d'utilisateur</label>
                  <input
                    className={`cpt-input${editing ? " cpt-input--edit" : ""}`}
                    value={profile.username}
                    readOnly={!editing}
                    onChange={e => setProfile(p => ({...p, username: e.target.value}))}
                  />
                </div>
                <div className="cpt-field">
                  <label><Mail size={12}/> Adresse e-mail</label>
                  <input className="cpt-input" value={profile.email} readOnly/>
                </div>
                <div className="cpt-field">
                  <label><Phone size={12}/> Téléphone</label>
                  <input
                    className={`cpt-input${editing ? " cpt-input--edit" : ""}`}
                    value={profile.phone_number || ""}
                    placeholder="Non renseigné"
                    readOnly={!editing}
                    onChange={e => setProfile(p => ({...p, phone_number: e.target.value}))}
                  />
                </div>
                <div className="cpt-field">
                  <label><Camera size={12}/> Photo de profil</label>
                  <div className="cpt-avatar-mini-row">
                    {avatarPreview
                      ? <img className="cpt-avatar-mini" src={avatarPreview} alt=""/>
                      : <div className="cpt-avatar-mini cpt-avatar-mini--init">{initials}</div>
                    }
                    <button
                      className="cpt-btn-upload"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? "Upload…" : "Changer la photo"}
                    </button>
                  </div>
                </div>
              </div>

              {editing && (
                <button
                  className="cpt-save-btn"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  <Save size={15}/> {saving ? "Sauvegarde…" : "Enregistrer les modifications"}
                </button>
              )}
            </div>

            {/* Mes annonces shortcut */}
            <div className="cpt-shortcut">
              <Home size={20} style={{color:"#6366f1", flexShrink:0}}/>
              <div className="cpt-shortcut__text">
                <p className="cpt-shortcut__title">Gérer mes annonces</p>
                <p className="cpt-shortcut__sub">Voir, modifier et supprimer vos publications</p>
              </div>
              <Link to="/dashboard" className="cpt-shortcut__btn">Accéder →</Link>
            </div>
          </main>
        </div>

        <style>{`
          .cpt-page { min-height:100vh; background:#f8fafc; font-family:'Inter',system-ui,sans-serif; }

          /* Hero */
          .cpt-hero { background:linear-gradient(135deg,#0f172a 0%,#312e81 100%); padding:40px 24px; }
          .cpt-hero__inner { max-width:1100px; margin:0 auto; display:flex; align-items:center; gap:24px; }
          .cpt-avatar-wrap { position:relative; flex-shrink:0; }
          .cpt-avatar {
            width:76px; height:76px; border-radius:50%; overflow:hidden;
            background:#fff; display:flex; align-items:center; justify-content:center;
            box-shadow:0 4px 20px rgba(0,0,0,.3); position:relative;
          }
          .cpt-avatar img { width:100%; height:100%; object-fit:cover; }
          .cpt-avatar__init { font-size:28px; font-weight:800; color:#0f172a; }
          .cpt-avatar__spinner {
            position:absolute; inset:0; background:rgba(0,0,0,.4);
            border-radius:50%; display:flex; align-items:center; justify-content:center;
          }
          .cpt-avatar__spinner::after {
            content:""; width:24px; height:24px; border:3px solid transparent;
            border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite;
          }
          .cpt-avatar__cam {
            position:absolute; bottom:0; right:0;
            width:26px; height:26px; border-radius:50%;
            background:#6366f1; border:2px solid #fff; color:#fff;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; transition:background .15s;
          }
          .cpt-avatar__cam:hover { background:#4f46e5; }
          .cpt-hero__name  { font-size:22px; font-weight:800; color:#fff; }
          .cpt-hero__email { font-size:14px; color:rgba(255,255,255,.7); margin-top:3px; }

          /* Body layout */
          .cpt-body { max-width:1100px; margin:0 auto; padding:32px 24px; display:grid; grid-template-columns:210px 1fr; gap:22px; }

          /* Sidebar */
          .cpt-sidebar {
            background:#fff; border:1px solid #e5e7eb; border-radius:14px;
            padding:10px; height:fit-content; position:sticky; top:20px;
            display:flex; flex-direction:column; gap:3px;
          }
          .cpt-nav-item {
            display:flex; align-items:center; gap:10px; padding:11px 13px;
            border-radius:9px; border:none; background:transparent;
            font-size:14px; font-weight:500; color:#64748b; cursor:pointer;
            text-decoration:none; transition:all .15s; text-align:left; width:100%;
            font-family:inherit;
          }
          .cpt-nav-item:hover { background:#f1f5f9; color:#0f172a; }
          .cpt-nav-item--active { background:#eef2ff; color:#4f46e5; font-weight:700; }
          .cpt-nav-item--danger { color:#dc2626; margin-top:8px; border-top:1px solid #f1f5f9; padding-top:12px; }
          .cpt-nav-item--danger:hover { background:#fef2f2; }

          /* Main */
          .cpt-main { display:flex; flex-direction:column; gap:16px; }

          /* Card */
          .cpt-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:26px; }
          .cpt-card__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
          .cpt-card__head h2 { font-size:17px; font-weight:700; color:#0f172a; }
          .cpt-btn-sec {
            display:flex; align-items:center; gap:6px; padding:8px 14px;
            border-radius:8px; border:1px solid #e5e7eb; background:#fff;
            font-size:13px; font-weight:600; color:#374151; cursor:pointer;
            font-family:inherit; transition:all .15s;
          }
          .cpt-btn-sec:hover { border-color:#6366f1; color:#4f46e5; background:#eef2ff; }

          /* Form grid */
          .cpt-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
          .cpt-field { display:flex; flex-direction:column; gap:6px; }
          .cpt-field label {
            font-size:11px; font-weight:700; color:#64748b; display:flex;
            align-items:center; gap:5px; text-transform:uppercase; letter-spacing:.04em;
          }
          .cpt-input {
            padding:10px 13px; border:1.5px solid #e2e8f0; border-radius:9px;
            font-size:14px; color:#0f172a; background:#f8fafc;
            font-family:inherit; outline:none; transition:border-color .15s;
          }
          .cpt-input--edit { background:#fff; border-color:#c7d2fe; }
          .cpt-input--edit:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
          .cpt-input[readonly] { cursor:default; }

          /* Avatar upload mini */
          .cpt-avatar-mini-row { display:flex; align-items:center; gap:12px; padding:6px 0; }
          .cpt-avatar-mini {
            width:40px; height:40px; border-radius:50%; object-fit:cover;
            border:2px solid #e5e7eb;
          }
          .cpt-avatar-mini--init {
            background:#eef2ff; display:flex; align-items:center; justify-content:center;
            font-size:16px; font-weight:800; color:#4f46e5;
          }
          .cpt-btn-upload {
            padding:7px 14px; border-radius:8px; border:1.5px solid #c7d2fe;
            background:#eef2ff; color:#4f46e5; font-size:13px; font-weight:600;
            cursor:pointer; font-family:inherit; transition:all .15s;
          }
          .cpt-btn-upload:hover { background:#e0e7ff; }
          .cpt-btn-upload:disabled { opacity:.6; cursor:not-allowed; }

          /* Save button */
          .cpt-save-btn {
            display:flex; align-items:center; gap:7px;
            margin-top:22px; padding:11px 24px; background:#0f172a; color:#fff;
            border:none; border-radius:10px; font-size:14px; font-weight:700;
            cursor:pointer; font-family:inherit; transition:background .15s;
          }
          .cpt-save-btn:hover { background:#1e293b; }
          .cpt-save-btn:disabled { opacity:.6; cursor:not-allowed; }

          /* Shortcut */
          .cpt-shortcut {
            background:#fff; border:1px solid #e5e7eb; border-radius:14px;
            padding:20px 24px; display:flex; align-items:center; gap:16px;
          }
          .cpt-shortcut__text { flex:1; }
          .cpt-shortcut__title { font-weight:700; color:#0f172a; font-size:15px; }
          .cpt-shortcut__sub   { font-size:13px; color:#94a3b8; margin-top:3px; }
          .cpt-shortcut__btn {
            padding:9px 18px; background:#0f172a; color:#fff;
            border-radius:9px; font-size:14px; font-weight:700; text-decoration:none;
            white-space:nowrap; transition:background .15s;
          }
          .cpt-shortcut__btn:hover { background:#1e293b; }

          @keyframes spin { to { transform:rotate(360deg); } }

          @media (max-width:768px) {
            .cpt-body { grid-template-columns:1fr; }
            .cpt-sidebar { position:static; }
            .cpt-grid { grid-template-columns:1fr; }
          }
        `}</style>
      </div>
    </Layout>
  );
}
