import { useState } from "react";
import API_URL from "../config";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Home, Eye, EyeOff, CheckCircle } from "lucide-react";
import Logo from "../components/Logo";

const heroUrl = "https://www.guidesulysse.com/images/destinations/iStock-498116298.jpg";

export default function ResetPassword() {
  const [searchParams]  = useSearchParams();
  const token           = searchParams.get("token") || "";
  const navigate        = useNavigate();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  if (!token) return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit"}}>
      <p style={{color:"#dc2626"}}>Lien invalide. <Link to="/forgot-password" style={{color:"#6366f1"}}>Réessayer</Link></p>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm)  { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2800);
    } catch (err) {
      setError(err.message || "Token invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-page">
      <div className="sp-left">
        <img src={heroUrl} alt="" className="sp-left__bg" />
        <div className="sp-left__overlay" />
        <div className="sp-left__content">
          <div className="sp-left__logo"><Logo variant="white" height={46} to="/" /></div>
          <h2 className="sp-left__tagline">Trouvez le bien immobilier<br/>de vos rêves en Tunisie.</h2>
          <p className="sp-left__sub">Des milliers d'offres de vente, location et vacances, partout en Tunisie.</p>
          <div className="sp-left__pills">
            <span className="sp-left__pill"><span className="sp-left__pill-dot"/>Vente</span>
            <span className="sp-left__pill"><span className="sp-left__pill-dot"/>Location</span>
            <span className="sp-left__pill"><span className="sp-left__pill-dot"/>Vacances</span>
            <span className="sp-left__pill"><span className="sp-left__pill-dot"/>Carte interactive</span>
          </div>
        </div>
        <div className="sp-left__accent"/>
      </div>

      <div className="sp-center-icon"><Home size={26} color="#6366f1"/></div>

      <div className="sp-right">
        <div className="sp-form-wrap">
          <div className="sp-logo-mobile"><Logo variant="color" height={40} to="/" /></div>

          {success ? (
            <div style={{textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:20}}>
              <CheckCircle size={56} color="#16a34a" strokeWidth={1.5}/>
              <h1 className="sp-title">Mot de passe réinitialisé !</h1>
              <p className="sp-sub" style={{marginBottom:0}}>Vous allez être redirigé vers la page de connexion…</p>
              <Link to="/login" className="sp-btn" style={{display:"block", textDecoration:"none", textAlign:"center"}}>
                Se connecter maintenant
              </Link>
            </div>
          ) : (
            <>
              <h1 className="sp-title">Nouveau mot de passe</h1>
              <p className="sp-sub">Choisissez un nouveau mot de passe sécurisé.</p>

              {error && <div className="sp-notice sp-notice--err">{error}</div>}

              <form onSubmit={handleSubmit} className="sp-form">
                <div className="sp-field">
                  <label className="sp-label">Nouveau mot de passe</label>
                  <div className="sp-pw-wrap">
                    <input type={showPwd ? "text" : "password"} className="sp-input"
                      placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)}
                      required minLength={6} disabled={loading} autoComplete="new-password"/>
                    <button type="button" className="sp-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                      {showPwd ? <EyeOff size={17}/> : <Eye size={17}/>}
                    </button>
                  </div>
                </div>

                <div className="sp-field">
                  <label className="sp-label">Confirmer le mot de passe</label>
                  <input type={showPwd ? "text" : "password"} className="sp-input"
                    placeholder="••••••••" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required disabled={loading} autoComplete="new-password"/>
                </div>

                <button type="submit" className="sp-btn" disabled={loading || !password || !confirm}>
                  {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
                </button>
              </form>
            </>
          )}

          <p className="sp-switch">
            <Link to="/login" className="sp-link">← Retour à la connexion</Link>
          </p>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sp-page { min-height: 100vh; display: flex; position: relative; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .sp-left { width: 50%; position: relative; overflow: hidden; display: flex; align-items: flex-end; flex-shrink: 0; }
        .sp-left__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .sp-left__overlay { position: absolute; inset: 0; background: linear-gradient(160deg,rgba(6,8,24,.78) 0%,rgba(15,23,42,.92) 100%); }
        .sp-left::before { content:""; position:absolute; inset:0; z-index:1; background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px); background-size:24px 24px; }
        .sp-left__content { position:relative; z-index:2; padding:52px; }
        .sp-left__logo { margin-bottom:40px; }
        .sp-left__tagline { font-size:clamp(26px,2.8vw,34px); font-weight:800; color:#fff; line-height:1.25; letter-spacing:-.025em; }
        .sp-left__sub { font-size:15px; color:rgba(255,255,255,.6); margin-top:14px; line-height:1.7; }
        .sp-left__pills { display:flex; flex-wrap:wrap; gap:8px; margin-top:28px; }
        .sp-left__pill { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:rgba(255,255,255,.7); background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); padding:5px 12px; border-radius:999px; }
        .sp-left__pill-dot { width:6px; height:6px; border-radius:50%; background:#6366f1; }
        .sp-left__accent { position:absolute; bottom:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#6366f1,#818cf8,#a5b4fc); z-index:3; }
        .sp-center-icon { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:30; width:58px; height:58px; border-radius:50%; background:white; box-shadow:0 8px 32px rgba(0,0,0,.22),0 0 0 5px rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; }
        .sp-right { flex:1; background:#fff; overflow-y:auto; display:flex; align-items:center; justify-content:center; padding:52px 48px; position:relative; }
        .sp-right::before { content:""; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#6366f1,#818cf8); }
        .sp-form-wrap { width:100%; max-width:400px; }
        .sp-logo-mobile { display:none; justify-content:center; margin-bottom:28px; }
        .sp-title { font-size:27px; font-weight:800; color:#0f172a; letter-spacing:-.02em; }
        .sp-sub { font-size:14px; color:#94a3b8; margin-top:5px; margin-bottom:30px; }
        .sp-notice { border-radius:10px; padding:11px 14px; font-size:13px; margin-bottom:18px; line-height:1.5; font-weight:500; }
        .sp-notice--err { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; }
        .sp-form { display:flex; flex-direction:column; gap:18px; }
        .sp-field { display:flex; flex-direction:column; gap:6px; }
        .sp-label { font-size:12.5px; font-weight:700; color:#374151; letter-spacing:.2px; }
        .sp-input { width:100%; padding:12px 15px; border:1.5px solid #e2e8f0; border-radius:11px; font-size:14px; font-family:inherit; outline:none; color:#0f172a; background:#f8fafc; transition:border-color .15s,background .15s,box-shadow .15s; }
        .sp-input:focus { border-color:#6366f1; background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
        .sp-input::placeholder { color:#c0cadb; }
        .sp-input:disabled { opacity:.6; }
        .sp-pw-wrap { position:relative; }
        .sp-pw-wrap .sp-input { padding-right:46px; }
        .sp-eye { position:absolute; right:13px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; display:flex; padding:4px; border-radius:6px; transition:color .15s,background .15s; }
        .sp-eye:hover { color:#374151; background:#f1f5f9; }
        .sp-btn { width:100%; padding:13px; border-radius:11px; border:none; background:#0f172a; color:#fff; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; margin-top:4px; transition:background .15s,transform .1s,box-shadow .15s; letter-spacing:.01em; }
        .sp-btn:hover:not(:disabled) { background:#1e293b; box-shadow:0 6px 20px rgba(15,23,42,.22); }
        .sp-btn:disabled { opacity:.5; cursor:not-allowed; }
        .sp-switch { text-align:center; font-size:13.5px; color:#6b7280; margin-top:22px; }
        .sp-link { color:#6366f1; font-weight:700; text-decoration:none; }
        .sp-link:hover { text-decoration:underline; }
        @media (max-width:900px) { .sp-left { display:none; } .sp-center-icon { display:none; } .sp-right { width:100%; padding:40px 24px; } .sp-logo-mobile { display:flex; } }
        @media (max-width:480px) { .sp-right { padding:32px 20px; } .sp-form-wrap { max-width:100%; } }
      `}</style>
    </div>
  );
}
