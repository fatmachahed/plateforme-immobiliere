import React from "react";

/* Tampon "Déjà loué" / "Déjà vendu" posé en filigrane sur la photo des biens
   clôturés (status louee / vendue). Style "SOLD OUT" : slab serif noir épais,
   rouge, double cadre, légèrement incliné. */
const STAMP_FONT = "'Rockwell Extra Bold','Rockwell','Alfa Slab One','Roboto Slab','Georgia',serif";

export function stampLabel(status, categorie) {
  if (status === "vendue") return "Déjà vendu";
  if (status === "louee")  return "Déjà loué";
  return null;
}

export const isClosedStatus = (status) => status === "vendue" || status === "louee";

/* size : "sm" (cartes/popup) | "lg" (galerie détail) */
export default function SoldStamp({ status, size = "sm" }) {
  const label = stampLabel(status);
  if (!label) return null;
  const lg = size === "lg";
  return (
    <div style={{ position:"absolute", inset:0, zIndex:4, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
      <span style={{
        transform:"rotate(-12deg)", color:"#c8202a", border:`${lg?5:3}px solid #c8202a`, borderRadius:4,
        padding: lg ? "6px 22px" : "2px 10px", fontFamily:STAMP_FONT, fontWeight:900,
        fontSize: lg ? 56 : 24, letterSpacing:".04em", textTransform:"uppercase", whiteSpace:"nowrap",
        background:"rgba(255,255,255,.35)", outline:`${lg?2:1}px solid #c8202a`, outlineOffset:-(lg?11:6),
        opacity:.92, userSelect:"none", textShadow:"0 0 1px rgba(200,32,42,.6)",
      }}>{label}</span>
    </div>
  );
}

/* Version HTML (popups Leaflet construits en chaîne de caractères) */
export function soldStampHtml(status) {
  const label = stampLabel(status);
  if (!label) return "";
  return `<div style="position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;pointer-events:none;"><span style="transform:rotate(-12deg);color:#c8202a;border:3px solid #c8202a;border-radius:4px;padding:2px 10px;font-family:${STAMP_FONT};font-weight:900;font-size:24px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;background:rgba(255,255,255,.35);outline:1px solid #c8202a;outline-offset:-6px;opacity:.92;">${label}</span></div>`;
}
