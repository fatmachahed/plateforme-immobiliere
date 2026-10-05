import { MapPinOff } from "lucide-react";

/* Annonce sans coordonnées GPS : on le dit au lieu d'afficher un repère au hasard. */
export default function PositionNonRenseignee({ style, size = 12 }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
      borderRadius: 8, padding: "3px 9px", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", ...style,
    }}>
      <MapPinOff size={size} /> Position non renseignée
    </span>
  );
}
