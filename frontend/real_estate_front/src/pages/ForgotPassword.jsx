import { useState } from "react";
import API_URL from "../config";
import { Link } from "react-router-dom";
import { Home, Copy, Check, Menu } from "lucide-react";
import Logo from "../components/Logo";
import Navbar from "../components/Navbar";

const heroUrl = "https://www.guidesulysse.com/images/destinations/iStock-498116298.jpg";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [result,  setResult]  = useState(null);
  const [copied,  setCopied]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Veuillez saisir votre adresse e-mail."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur serveur");
      setResult(data);
    } catch (err) {
      setError(err.message || "Serveur inaccessible.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (result?.reset_link) {
      navigator.clipboard.writeText(result.reset_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="sp-page">
      {/* Barre mobile : logo + hamburger */}
      <div className="sp-logo-mobile">
        <Link to="/"><Logo height={28} /></Link>
        <button className="sp-mob-burger" onClick={() => window.dispatchEvent(new CustomEvent('localizi:openMobileMenu'))}>
          <Menu size={22}/>
        </button>
      </div>
      <div className="sp-hidden-nav"><Navbar /></div>

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

          <h1 className="sp-title">Mot de passe oublié</h1>
          <p className="sp-sub">Saisissez votre email pour recevoir un lien de réinitialisation.</p>

          {!result ? (
            <>
              {error && <div className="sp-notice sp-notice--err">{error}</div>}
              <form onSubmit={handleSubmit} className="sp-form">
                <div className="sp-field">
                  <label className="sp-label">Adresse e-mail</label>
                  <input type="email" className="sp-input" placeholder="vous@exemple.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required disabled={loading} autoComplete="email"/>
                </div>
                <button type="submit" className="sp-btn" disabled={loading || !email}>
                  {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="sp-notice sp-notice--ok">✅ {result.message}</div>
              {result.reset_link && (
                <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:16, padding:"16px", background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12}}>
                  <p style={{fontSize:13, fontWeight:700, color:"#166534", margin:0}}>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                  <a href={result.reset_link}
                    style={{display:"block", background:"#6366f1", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:700, textDecoration:"none", textAlign:"center", fontSize:14}}>
                    Réinitialiser mon mot de passe
                  </a>
                  <div style={{display:"flex", gap:8, alignItems:"flex-start", background:"#fff", border:"1px solid #d1fae5", borderRadius:8, padding:"8px 12px"}}>
                    <code style={{fontSize:10.5, color:"#059669", flex:1, wordBreak:"break-all", lineHeight:1.5}}>{result.reset_link}</code>
                    <button onClick={copyLink}
                      style={{flexShrink:0, background:copied?"#f0fdf4":"#fff", border:"1px solid #bbf7d0", cursor:"pointer", borderRadius:6, padding:"6px 10px", color:copied?"#166534":"#6366f1"}}>
                      {copied ? <Check size={14}/> : <Copy size={14}/>}
                    </button>
                  </div>
                </div>
              )}
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
        .sp-notice--ok  { background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; }
        .sp-form { display:flex; flex-direction:column; gap:18px; }
        .sp-field { display:flex; flex-direction:column; gap:6px; }
        .sp-label { font-size:12.5px; font-weight:700; color:#374151; letter-spacing:.2px; }
        .sp-input { width:100%; padding:12px 15px; border:1.5px solid #e2e8f0; border-radius:11px; font-size:14px; font-family:inherit; outline:none; color:#0f172a; background:#f8fafc; transition:border-color .15s,background .15s,box-shadow .15s; }
        .sp-input:focus { border-color:#6366f1; background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
        .sp-input::placeholder { color:#c0cadb; }
        .sp-input:disabled { opacity:.6; }
        .sp-btn { width:100%; padding:13px; border-radius:11px; border:none; background:#0f172a; color:#fff; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; margin-top:4px; transition:background .15s,transform .1s,box-shadow .15s; letter-spacing:.01em; }
        .sp-btn:hover:not(:disabled) { background:#1e293b; box-shadow:0 6px 20px rgba(15,23,42,.22); }
        .sp-btn:disabled { opacity:.5; cursor:not-allowed; }
        .sp-switch { text-align:center; font-size:13.5px; color:#6b7280; margin-top:22px; }
        .sp-link { color:#6366f1; font-weight:700; text-decoration:none; }
        .sp-link:hover { text-decoration:underline; }
        .sp-hidden-nav { display:none; }
        .sp-mob-burger { background:none; border:none; cursor:pointer; color:#0f172a; display:flex; align-items:center; padding:4px; border-radius:8px; }
        @media (max-width:900px) { .sp-left { display:none; } .sp-center-icon { display:none; } .sp-right { width:100%; padding:72px 24px 40px; } .sp-logo-mobile { display:flex; position:fixed; top:0; left:0; right:0; z-index:100; background:#fff; border-bottom:1px solid #e2e8f0; padding:12px 20px; align-items:center; justify-content:space-between; } }
        @media (max-width:480px) { .sp-right { padding:72px 20px 32px; } .sp-form-wrap { max-width:100%; } }
      `}</style>
    </div>
  );
}
