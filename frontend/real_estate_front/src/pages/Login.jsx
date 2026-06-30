import { useState } from "react";
import API_URL from '../config';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Home, Menu, X } from "lucide-react";
import { useToast } from "../components/Toast";
import Logo from "../components/Logo";
import { useGoogleLogin } from "@react-oauth/google";
import heroUrl from "../assets/hero-localizi.png";

export default function Login() {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [mobMenu,     setMobMenu]     = useState(false);
  const [rememberMe,  setRememberMe]  = useState(true);

  const navigate = useNavigate();
  const toast    = useToast();
  const [searchParams] = useSearchParams();
  const sessionExpired  = searchParams.get("session") === "expired";
  const redirectAfter   = searchParams.get("redirect") || "/";

  const handleGoogleSuccess = async (accessToken) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Erreur lors de la connexion Google.");
        return;
      }
      const data = await res.json();
      const store = rememberMe ? localStorage : sessionStorage;
      store.setItem("token", data.access_token);
      if (data.user) store.setItem("user", JSON.stringify(data.user));
      toast("Connexion Google réussie ! Bienvenue.");
      window.location.href = redirectAfter;
    } catch {
      setError("Serveur inaccessible — vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (resp) => handleGoogleSuccess(resp.access_token),
    onError: () => setError("Connexion Google annulée ou échouée."),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("username", email);
      body.append("password", password);

      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) { setError(err.detail || "Trop de tentatives. Réessayez dans quelques minutes."); return; }
        if (res.status === 403) { setError("⚠️ " + (err.detail || "Veuillez vérifier votre email avant de vous connecter.")); return; }
        setError(res.status === 401 ? "Email ou mot de passe incorrect." : (err.detail || "Erreur serveur."));
        return;
      }

      const data = await res.json();
      const store = rememberMe ? localStorage : sessionStorage;
      store.setItem("token", data.access_token);
      if (data.user) store.setItem("user", JSON.stringify(data.user));
      toast("Connexion réussie ! Bienvenue.");
      const isFirstLogin = localStorage.getItem("first_login") === "1";
      if (isFirstLogin) {
        localStorage.removeItem("first_login");
        window.location.href = "/compte?welcome=1";
      } else {
        window.location.href = redirectAfter;
      }
    } catch {
      setError("Serveur inaccessible — vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-page">
      {/* Left panel — hero image */}
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

      {/* Center divider icon */}
      <div className="sp-center-icon">
        <Home size={26} color="#6366f1" />
      </div>

      {/* Right panel — form */}
      <div className="sp-right">
        <div className="sp-form-wrap">
          <div className="sp-logo-mobile">
            <Logo variant="color" height={40} to="/" />
            <button className="sp-mob-burger" onClick={()=>setMobMenu(o=>!o)} aria-label="Menu">
              {mobMenu ? <X size={22}/> : <Menu size={22}/>}
            </button>
            {mobMenu && (
              <div className="sp-mob-drawer">
                <Link to="/" onClick={()=>setMobMenu(false)}>Accueil</Link>
                <Link to="/carte" onClick={()=>setMobMenu(false)}>Explorer la carte</Link>
                <Link to="/register" onClick={()=>setMobMenu(false)}>Créer un compte</Link>
                <Link to="/comment-ca-marche" onClick={()=>setMobMenu(false)}>Comment ça marche</Link>
                <Link to="/qui-sommes-nous" onClick={()=>setMobMenu(false)}>Qui sommes-nous</Link>
                <Link to="/faq" onClick={()=>setMobMenu(false)}>FAQ</Link>
              </div>
            )}
          </div>

          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20,fontSize:12.5,color:"#94a3b8"}}>
            <Link to="/" style={{display:"flex",alignItems:"center",gap:4,color:"#6366f1",textDecoration:"none",fontWeight:600}}>
              <Home size={13}/> Accueil
            </Link>
            <span>›</span>
            <span style={{color:"#374151",fontWeight:600}}>Connexion</span>
          </div>

          <h1 className="sp-title">Connexion</h1>
          <p className="sp-sub">Bienvenue, connectez-vous à votre compte.</p>

          {sessionExpired && (
            <div className="sp-notice sp-notice--warn">
              Votre session a expiré. Reconnectez-vous pour continuer.
            </div>
          )}
          {error && <div className="sp-notice sp-notice--err">{error}</div>}

          <form onSubmit={handleSubmit} className="sp-form">
            <div className="sp-field">
              <label className="sp-label">Adresse e-mail</label>
              <input
                type="email" className="sp-input" placeholder="vous@exemple.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required disabled={loading} autoComplete="email"
              />
            </div>

            <div className="sp-field">
              <label className="sp-label">Mot de passe</label>
              <div className="sp-pw-wrap">
                <input
                  type={showPwd ? "text" : "password"} className="sp-input"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required disabled={loading} autoComplete="current-password"
                />
                <button type="button" className="sp-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  {showPwd ? <Eye size={17}/> : <EyeOff size={17}/>}
                </button>
              </div>
              <div style={{textAlign:"right", marginTop:4}}>
                <Link to="/forgot-password" style={{fontSize:12, color:"#6366f1", textDecoration:"none", fontWeight:600}}>
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Se souvenir de moi */}
            <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",fontSize:13,color:"#374151",userSelect:"none"}}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                disabled={loading}
                style={{width:15,height:15,accentColor:"#6366f1",cursor:"pointer",flexShrink:0}}
              />
              <span>Se souvenir de moi</span>
              <span style={{marginLeft:"auto",fontSize:11.5,color:"#94a3b8"}}>
                {rememberMe ? "Rester connecté(e)" : "Session temporaire"}
              </span>
            </label>

            <button type="submit" className="sp-btn" disabled={loading || !email || !password}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <div className="sp-divider" style={{margin:"18px 0 14px"}}>
            <span>ou continuer avec</span>
          </div>

          <button
            type="button"
            onClick={() => loginWithGoogle()}
            disabled={loading}
            style={{
              width:"100%", padding:"11px 16px",
              borderRadius:11, border:"1.5px solid #6366f1",
              background:"#fff", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              fontSize:14, fontWeight:600, color:"#0f172a",
              fontFamily:"inherit", transition:"all .15s",
              boxShadow:"0 1px 4px rgba(99,102,241,.08)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#eef2ff"; e.currentTarget.style.borderColor="#4f46e5";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#6366f1";}}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Se connecter avec Google
          </button>

          <p className="sp-switch" style={{marginTop:18}}>
            Pas encore de compte ?{" "}
            <Link to="/register" className="sp-link">Créer un compte</Link>
          </p>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sp-page {
          min-height: 100vh; display: flex; position: relative;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        /* Left — hero panel */
        .sp-left {
          width: 50%; position: relative; overflow: hidden;
          display: flex; align-items: center; flex-shrink: 0;
        }
        .sp-left__bg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center;
        }
        .sp-left__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(160deg, rgba(6,8,24,.78) 0%, rgba(15,23,42,.92) 100%);
        }
        /* subtle dot pattern */
        .sp-left::before {
          content: "";
          position: absolute; inset: 0; z-index: 1;
          background-image: radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .sp-left__content {
          position: relative; z-index: 2; padding: 52px;
        }
        .sp-left__logo { margin-bottom: 40px; }
        .sp-left__tagline {
          font-size: clamp(30px, 3.2vw, 42px); font-weight: 800; color: #fff;
          line-height: 1.25; letter-spacing: -.025em;
        }
        .sp-left__sub { font-size: 16px; color: rgba(255,255,255,.7); margin-top: 16px; line-height: 1.75; }
        .sp-left__pills {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px;
        }
        .sp-left__pill {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,.7);
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
          padding: 5px 12px; border-radius: 999px;
        }
        .sp-left__pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; }

        /* Accent bar at the bottom of the left panel */
        .sp-left__accent {
          position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc);
          z-index: 3;
        }

        /* Center icon circle */
        .sp-center-icon {
          position: absolute; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          z-index: 30;
          width: 58px; height: 58px; border-radius: 50%;
          background: white;
          box-shadow: 0 8px 32px rgba(0,0,0,.22), 0 0 0 5px rgba(255,255,255,.12);
          display: flex; align-items: center; justify-content: center;
        }

        /* Right — form panel */
        .sp-right {
          flex: 1; background: #fff; overflow-y: auto;
          display: flex; align-items: center; justify-content: center;
          padding: 52px 48px;
          position: relative;
        }
        /* top accent stripe */
        .sp-right::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #6366f1, #818cf8);
        }
        .sp-form-wrap { width: 100%; max-width: 400px; }
        .sp-logo-mobile { display: none; justify-content: space-between; align-items: center; margin-bottom: 28px; position: relative; }
        .sp-mob-burger { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #374151; }
        .sp-mob-drawer { position: absolute; top: 52px; right: 0; left: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.12); z-index: 999; display: flex; flex-direction: column; padding: 8px; gap: 2px; }
        .sp-mob-drawer a { display: block; padding: 10px 14px; border-radius: 8px; color: #374151; text-decoration: none; font-weight: 600; font-size: 14px; }
        .sp-mob-drawer a:hover { background: #f1f5f9; color: #6366f1; }

        .sp-title {
          font-size: 27px; font-weight: 800; color: #0f172a;
          letter-spacing: -.02em;
        }
        .sp-sub { font-size: 14px; color: #94a3b8; margin-top: 5px; margin-bottom: 30px; }

        .sp-notice {
          border-radius: 10px; padding: 11px 14px; font-size: 13px;
          margin-bottom: 18px; line-height: 1.5; font-weight: 500;
        }
        .sp-notice--warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .sp-notice--err  { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

        .sp-form  { display: flex; flex-direction: column; gap: 18px; }
        .sp-field { display: flex; flex-direction: column; gap: 6px; }
        .sp-label {
          font-size: 12.5px; font-weight: 700; color: #374151;
          letter-spacing: .2px;
        }
        .sp-input {
          width: 100%; padding: 12px 15px; border: 1.5px solid #e2e8f0;
          border-radius: 11px; font-size: 14px; font-family: inherit;
          outline: none; color: #0f172a; background: #f8fafc;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }
        .sp-input:focus {
          border-color: #6366f1; background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }
        .sp-input::placeholder { color: #c0cadb; }
        .sp-input:disabled { opacity: .6; }

        .sp-pw-wrap { position: relative; }
        .sp-pw-wrap .sp-input { padding-right: 46px; }
        .sp-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; display: flex; padding: 4px; border-radius: 6px;
          transition: color .15s, background .15s;
        }
        .sp-eye:hover { color: #374151; background: #f1f5f9; }

        .sp-btn {
          width: 100%; padding: 13px; border-radius: 11px; border: none;
          background: #0f172a; color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: inherit; margin-top: 4px;
          transition: background .15s, transform .1s, box-shadow .15s;
          letter-spacing: .01em;
        }
        .sp-btn:hover:not(:disabled) {
          background: #1e293b;
          box-shadow: 0 6px 20px rgba(15,23,42,.22);
        }
        .sp-btn:active:not(:disabled) { transform: scale(.985); }
        .sp-btn:disabled { opacity: .5; cursor: not-allowed; }

        .sp-divider {
          display: flex; align-items: center; gap: 12px; margin: 2px 0;
        }
        .sp-divider::before, .sp-divider::after {
          content: ""; flex: 1; height: 1px; background: #e5e7eb;
        }
        .sp-divider span { font-size: 12px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

        .sp-switch { text-align: center; font-size: 13.5px; color: #6b7280; margin-top: 22px; }
        .sp-link   { color: #6366f1; font-weight: 700; text-decoration: none; }
        .sp-link:hover { text-decoration: underline; }

        @media (max-width: 900px) {
          .sp-left { display: none; }
          .sp-center-icon { display: none; }
          .sp-right { width: 100%; padding: 40px 24px; }
          .sp-logo-mobile { display: flex; }
        }
        @media (max-width: 480px) {
          .sp-right { padding: 32px 20px; }
          .sp-form-wrap { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
