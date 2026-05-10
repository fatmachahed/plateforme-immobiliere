/**
 * Logo Localizi — composant SVG réutilisable
 *
 * variant="color"  → "LOCAL" sombre + "IZI" indigo  (default, fond clair)
 * variant="white"  → tout blanc                      (fond sombre)
 * variant="indigo" → tout indigo                     (accents)
 *
 * height  → hauteur du SVG en px (default 44)
 * noText  → affiche uniquement le pin sans le texte
 */
import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ variant = "color", height = 44, noText = false, to = "/" }) {
  const W = noText ? 44 : 180;
  const H = 44;

  /* Couleurs selon variant */
  const pinTop    = variant === "white" ? "#ffffff" : "#6366f1";
  const pinBot    = variant === "white" ? "#cbd5e1" : "#4338ca";
  const pinCircle = variant === "white" ? "rgba(255,255,255,.9)" : "white";
  const houseIco  = variant === "white" ? "#6366f1" : "#4f46e5";
  const wordLeft  = variant === "white" ? "#ffffff" : "#0f172a";   /* LOCAL */
  const wordRight = variant === "white" ? "#ffffff" : "#6366f1";   /* IZI  */
  const shadowOp  = variant === "white" ? ".2" : ".12";

  const logo = (
    <svg
      width={noText ? height : Math.round(height * (W / H))}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Localizi"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`pin-g-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pinTop} />
          <stop offset="100%" stopColor={pinBot} />
        </linearGradient>
      </defs>

      {/* Ombre du pin */}
      <ellipse cx="16" cy="40" rx="7" ry="3" fill={pinTop} fillOpacity={shadowOp} />

      {/* Corps du pin */}
      <path
        d="M16 2C9.92 2 5 6.92 5 13C5 21.5 16 38 16 38C16 38 27 21.5 27 13C27 6.92 22.08 2 16 2Z"
        fill={`url(#pin-g-${variant})`}
      />

      {/* Cercle intérieur */}
      <circle cx="16" cy="13" r="6" fill={pinCircle} />

      {/* Icône maison dans le pin */}
      <path d="M13 16V12.8L16 10.5L19 12.8V16H17.2V14.2H14.8V16H13Z" fill={houseIco} />

      {/* Texte "LOCAL" + "IZI" */}
      {!noText && (
        <text
          x="35" y="29"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="26"
          letterSpacing="-0.5"
        >
          <tspan fill={wordLeft}>LOCAL</tspan>
          <tspan fill={wordRight}>IZI</tspan>
        </text>
      )}
    </svg>
  );

  if (!to) return logo;
  return <Link to={to} style={{ display: "inline-flex", alignItems: "center" }}>{logo}</Link>;
}
