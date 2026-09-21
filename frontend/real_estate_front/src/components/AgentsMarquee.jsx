import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { Building2 } from "lucide-react";

/* -- Bandeau défilant (droite → gauche) des agents/agences immobilières
   inscrits sur la plateforme. Mêmes sources de données que la page
   "Trouver un agent" (/users/agencies/public + /users/agents/public). -- */
export default function AgentsMarquee() {
  const [names, setNames] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/users/agencies/public`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/users/agents/public`).then(r => r.ok ? r.json() : []),
    ])
      .then(([agencies, agents]) => {
        const agencyIds = new Set((agencies || []).map(a => a.id));
        const agentsOnly = (agents || []).filter(a => !agencyIds.has(a.id));
        const all = [...(agencies || []), ...agentsOnly]
          .map(p => p.nom)
          .filter(Boolean);
        setNames(all);
      })
      .catch(() => {});
  }, []);

  if (names.length === 0) return null;

  /* Dupliqué pour un défilement en boucle continue sans saut visible */
  const loop = [...names, ...names];

  return (
    <div className="am-wrap">
      <div className="am-track">
        {loop.map((nom, i) => (
          <span className="am-pill" key={i}>
            <Building2 size={14} className="am-pill__ico"/>
            {nom}
          </span>
        ))}
      </div>

      <style>{`
        .am-wrap {
          overflow: hidden;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 0;
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
        }
        .am-track {
          display: flex;
          gap: 12px;
          width: max-content;
          animation: am-scroll 40s linear infinite;
        }
        .am-wrap:hover .am-track { animation-play-state: paused; }
        .am-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 999px;
          background: #f8fafc; border: 1px solid #e5e7eb;
          font-size: 13px; font-weight: 600; color: #374151;
          white-space: nowrap; flex-shrink: 0;
        }
        .am-pill__ico { color: #6366f1; flex-shrink: 0; }
        @keyframes am-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .am-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
