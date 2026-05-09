import { useState } from "react";
import API_URL from '../config';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Home } from "lucide-react";
import { useToast } from "../components/Toast";
import logoUrl from "../assets/logo_vert_new.png";
import heroUrl from "../assets/image_home_new.png";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const navigate = useNavigate();
  const toast    = useToast();
  const [searchParams] = useSearchParams();
  const sessionExpired  = searchParams.get("session") === "expired";
  const redirectAfter   = searchParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("username", email);
      body.append("password", password);

      const res = await fetch(`${API_URL}/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(res.status === 401 ? "Email ou mot de passe incorrect." : (err.detail || "Erreur serveur."));
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toast("Connexion réussie ! Bienvenue.");
      window.location.href = redirectAfter;
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
          <img src={logoUrl} alt="Localizi" className="sp-left__logo" />
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
          <Link to="/" className="sp-logo-mobile"><img src={logoUrl} alt="Localizi"/></Link>

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
                  {showPwd ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="sp-btn" disabled={loading || !email || !password}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="sp-switch">
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
          display: flex; align-items: flex-end; flex-shrink: 0;
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
        .sp-left__logo { height: 44px; margin-bottom: 40px; filter: brightness(0) invert(1); }
        .sp-left__tagline {
          font-size: clamp(26px, 2.8vw, 34px); font-weight: 800; color: #fff;
          line-height: 1.25; letter-spacing: -.025em;
        }
        .sp-left__sub { font-size: 15px; color: rgba(255,255,255,.6); margin-top: 14px; line-height: 1.7; }
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
        .sp-logo-mobile { display: none; justify-content: center; margin-bottom: 28px; }
        .sp-logo-mobile img { height: 38px; }

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
