import { MapPinCheck } from "lucide-react";

/* Badge affiché sur les annonces publiées directement sur Localizi :
   la position sur la carte est celle saisie par l'annonceur (pas un point approximatif). */
export default function LocalisationExacteBadge({ style, size = 11 }) {
  return (
    <span
      title="Position exacte du bien, renseignée par l'annonceur"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "rgba(5,150,105,.94)", color: "#fff",
        borderRadius: 8, padding: "3px 9px", fontSize: 10.5, fontWeight: 700,
        letterSpacing: ".01em", whiteSpace: "nowrap", ...style,
      }}
    >
      <MapPinCheck size={size} /> Localisation exacte
    </span>
  );
}
