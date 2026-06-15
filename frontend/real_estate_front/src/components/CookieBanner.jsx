import React, { useState, useEffect } from "react";

const COOKIE_KEY = "localizi_cookies_accepted";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "all");
    setVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem(COOKIE_KEY, "essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cookie-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .cookie-banner {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          width: calc(100% - 48px); max-width: 680px;
          background: #0f172a; color: #e2e8f0;
          border-radius: 16px; padding: 20px 24px;
          box-shadow: 0 8px 40px rgba(0,0,0,.45);
          z-index: 99999;
          animation: cookie-slide-up .35s cubic-bezier(.22,.61,.36,1) both;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .cookie-banner__row { display: flex; align-items: flex-start; gap: 16px; }
        .cookie-banner__icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
        .cookie-banner__content { flex: 1; min-width: 0; }
        .cookie-banner__title {
          font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 6px;
        }
        .cookie-banner__text {
          font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0;
        }
        .cookie-banner__link {
          color: #818cf8; text-decoration: underline; cursor: pointer; background: none;
          border: none; font-size: 13px; padding: 0; font-family: inherit;
        }
        .cookie-banner__btns {
          display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap;
        }
        .cookie-banner__btn {
          padding: 9px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; font-family: inherit; transition: all .15s;
        }
        .cookie-banner__btn--accept {
          background: #6366f1; color: #fff;
        }
        .cookie-banner__btn--accept:hover { background: #4f46e5; }
        .cookie-banner__btn--essential {
          background: transparent; color: #94a3b8; border: 1.5px solid #334155;
        }
        .cookie-banner__btn--essential:hover { border-color: #64748b; color: #cbd5e1; }
        .cookie-banner__details {
          margin-top: 14px; padding-top: 14px; border-top: 1px solid #1e293b;
          font-size: 12.5px; color: #64748b; line-height: 1.7;
        }
        .cookie-banner__details ul { margin: 8px 0 0; padding-left: 18px; }
        .cookie-banner__details li { margin-bottom: 4px; }
        @media (max-width: 480px) {
          .cookie-banner { bottom: 0; left: 0; right: 0; transform: none; width: 100%;
            max-width: 100%; border-radius: 16px 16px 0 0; }
        }
      `}</style>

      <div className="cookie-banner" role="dialog" aria-label="Consentement aux cookies">
        <div className="cookie-banner__row">
          <div className="cookie-banner__icon">🍪</div>
          <div className="cookie-banner__content">
            <p className="cookie-banner__title">Nous utilisons des cookies</p>
            <p className="cookie-banner__text">
              Localizi.tn utilise des cookies pour améliorer votre expérience, analyser le trafic
              et personnaliser le contenu.{" "}
              <button className="cookie-banner__link" onClick={() => setShowDetails(v => !v)}>
                {showDetails ? "Masquer les détails" : "En savoir plus"}
              </button>
            </p>

            {showDetails && (
              <div className="cookie-banner__details">
                <strong style={{ color: "#cbd5e1" }}>Types de cookies utilisés :</strong>
                <ul>
                  <li><strong style={{ color: "#e2e8f0" }}>Essentiels</strong> — connexion, session, préférences. Toujours actifs.</li>
                  <li><strong style={{ color: "#e2e8f0" }}>Analytiques</strong> — mesure d'audience anonymisée pour améliorer le service.</li>
                  <li><strong style={{ color: "#e2e8f0" }}>Fonctionnels</strong> — recherches sauvegardées, favoris, historique de navigation.</li>
                </ul>
              </div>
            )}

            <div className="cookie-banner__btns">
              <button className="cookie-banner__btn cookie-banner__btn--accept" onClick={accept}>
                Accepter tous les cookies
              </button>
              <button className="cookie-banner__btn cookie-banner__btn--essential" onClick={acceptEssential}>
                Essentiels uniquement
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
