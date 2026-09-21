import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { MapPin, Mail, Phone } from "lucide-react";

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

/* -- Carte identique à AgentCard (page "Trouver un agent"), sans le pied
   de page "Voir les annonces" ni le clic vers le profil. -- */
function MiniAgentCard({ p }) {
  const photoUrl = resolveUrl(p.profile_picture);
  const initiale = (p.nom || "?")[0].toUpperCase();

  return (
    <div className="am-card">
      <div className="am-card__photo">
        {photoUrl ? (
          <img src={photoUrl} alt={p.nom}/>
        ) : (
          <div className="am-card__initiale">{initiale}</div>
        )}
      </div>
      <div className="am-card__body">
        <h3 className="am-card__name">{p.nom}</h3>
        {(p.gouvernorat || p.localite) && (
          <div className="am-card__loc">
            <MapPin size={12} className="am-card__ico"/>
            {[p.gouvernorat, p.localite].filter(Boolean).join(" · ")}
          </div>
        )}
        <div className="am-card__contact">
          {p.email && (
            <span className="am-card__row am-card__row--email">
              <Mail size={13}/> {p.email}
            </span>
          )}
          {p.telephone && (
            <span className="am-card__row am-card__row--tel">
              <Phone size={13}/> {p.telephone}
            </span>
          )}
          {!p.email && !p.telephone && (
            <span className="am-card__none">Coordonnées non renseignées</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -- Bandeau défilant (droite → gauche) des agents/agences immobilières
   inscrits sur la plateforme. Mêmes sources de données que la page
   "Trouver un agent" (/users/agencies/public + /users/agents/public). -- */
export default function AgentsMarquee() {
  const [pros, setPros] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/users/agencies/public`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/users/agents/public`).then(r => r.ok ? r.json() : []),
    ])
      .then(([agencies, agents]) => {
        const agencyIds = new Set((agencies || []).map(a => a.id));
        const agentsOnly = (agents || []).filter(a => !agencyIds.has(a.id));
        setPros([...(agencies || []), ...agentsOnly].filter(p => p.nom));
      })
      .catch(() => {});
  }, []);

  if (pros.length === 0) return null;

  /* Dupliqué pour un défilement en boucle continue sans saut visible */
  const loop = [...pros, ...pros];

  return (
    <div className="am-wrap">
      <div className="am-track">
        {loop.map((p, i) => <MiniAgentCard p={p} key={`${p.id}-${i}`}/>)}
      </div>

      <style>{`
        .am-wrap {
          overflow: hidden;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          padding: 20px 0;
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
        }
        .am-track {
          display: flex;
          gap: 16px;
          width: max-content;
          animation: am-scroll 55s linear infinite;
        }
        .am-wrap:hover .am-track { animation-play-state: paused; }

        .am-card {
          background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
          overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.05);
          display: flex; flex-direction: column; flex-shrink: 0;
          width: 220px;
        }
        .am-card__photo {
          height: 110px; background: linear-gradient(135deg,#0f172a,#1e293b);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }
        .am-card__photo img { width: 100%; height: 100%; object-fit: cover; opacity: .85; }
        .am-card__initiale {
          width: 56px; height: 56px; border-radius: 14px;
          background: linear-gradient(135deg,#0369a1,#0ea5e9);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 900; color: #fff;
          box-shadow: 0 6px 20px rgba(0,0,0,.25);
        }
        .am-card__body { padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; }
        .am-card__name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0; text-align: center; }
        .am-card__loc {
          display: flex; align-items: center; justify-content: center; gap: 4px;
          font-size: 11px; color: #64748b;
        }
        .am-card__ico { flex-shrink: 0; color: #6366f1; }
        .am-card__contact {
          border-top: 1px solid #f1f5f9; margin-top: 8px; padding-top: 8px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .am-card__row {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .am-card__row--email { color: #6366f1; font-weight: 500; }
        .am-card__row--tel   { color: #374151; }
        .am-card__none { font-size: 11px; color: #94a3b8; font-style: italic; text-align: center; }

        @media (prefers-reduced-motion: reduce) {
          .am-track { animation: none; }
        }
        @keyframes am-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
