import { useState } from "react";

/**
 * Image avec skeleton loader — affiche un placeholder gris animé
 * pendant le chargement, puis fait apparaître l'image en fondu.
 */
export default function LazyImage({ src, alt = "", style = {}, className = "", ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  return (
    <div style={{ position: "relative", overflow: "hidden", ...style }} className={className}>
      {/* Skeleton animé visible tant que l'image n'est pas chargée */}
      {!loaded && !error && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
          backgroundSize: "200% 100%",
          animation: "lz-shimmer 1.4s infinite linear",
        }}/>
      )}

      {/* Placeholder si erreur */}
      {error && (
        <div style={{
          position: "absolute", inset: 0,
          background: "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#94a3b8", fontSize: 12,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}

      {/* Image réelle */}
      {!error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          {...props}
        />
      )}

      <style>{`
        @keyframes lz-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
