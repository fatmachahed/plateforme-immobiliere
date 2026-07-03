import { useNavigate } from "react-router-dom";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import Logo from "../components/Logo";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdf4 100%)",
      padding: "24px", fontFamily: "inherit",
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-card { animation: fadeUp .5s ease both; }
        .nf-icon { animation: float 3.5s ease-in-out infinite; }
        .nf-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700;
          cursor: pointer; border: none; transition: all .18s; text-decoration: none;
        }
        .nf-btn--primary { background: #6366f1; color: #fff; }
        .nf-btn--primary:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,.35); }
        .nf-btn--outline { background: #fff; color: #475569; border: 1.5px solid #e2e8f0; }
        .nf-btn--outline:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
        .nf-btn--green { background: #22c55e; color: #fff; }
        .nf-btn--green:hover { background: #16a34a; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,.35); }
      `}</style>

      <div className="nf-card" style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <Logo variant="color" height={36} to="/" />
        </div>

        {/* Illustration */}
        <div className="nf-icon" style={{ marginBottom: 32, position: "relative", display: "inline-block" }}>
          <div style={{
            width: 140, height: 140, borderRadius: "50%",
            background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto", boxShadow: "0 20px 60px rgba(99,102,241,.15)",
          }}>
            <span style={{ fontSize: 64, lineHeight: 1 }}>🏠</span>
          </div>
          <div style={{
            position: "absolute", top: -8, right: -8,
            background: "#6366f1", color: "#fff",
            borderRadius: "50%", width: 40, height: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, boxShadow: "0 4px 14px rgba(99,102,241,.4)",
          }}>?</div>
        </div>

        {/* Texte */}
        <div style={{
          display: "inline-block", background: "#eef2ff", color: "#6366f1",
          borderRadius: 8, padding: "4px 14px", fontSize: 12, fontWeight: 700,
          letterSpacing: ".08em", marginBottom: 16,
        }}>ERREUR 404</div>

        <h1 style={{
          fontSize: 32, fontWeight: 900, color: "#0f172a",
          margin: "0 0 14px", lineHeight: 1.2,
        }}>Page introuvable</h1>

        <p style={{
          fontSize: 16, color: "#64748b", lineHeight: 1.7,
          margin: "0 0 36px",
        }}>
          Cette page n'existe pas ou a été déplacée.<br />
          Pas d'inquiétude — des milliers d'annonces vous attendent.
        </p>

        {/* Boutons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
          <button className="nf-btn nf-btn--outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={15}/> Retour
          </button>
          <button className="nf-btn nf-btn--primary" onClick={() => navigate("/")}>
            <Home size={15}/> Accueil
          </button>
          <button className="nf-btn nf-btn--green" onClick={() => navigate("/carte")}>
            <MapPin size={15}/> Voir la carte
          </button>
        </div>

        {/* Suggestions */}
        <div style={{
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16,
          padding: "20px 24px", textAlign: "left",
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 12 }}>
            PAGES POPULAIRES
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "Rechercher une annonce", href: "/carte" },
              { label: "Publier une annonce",     href: "/creer_annonce" },
              { label: "Comment ça marche ?",     href: "/comment-ca-marche" },
              { label: "Nous contacter",           href: "/contact" },
            ].map(({ label, href }) => (
              <button key={href} onClick={() => navigate(href)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8, border: "none",
                  background: "transparent", cursor: "pointer", textAlign: "left",
                  color: "#374151", fontSize: 14, fontWeight: 500,
                  transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Search size={14} color="#6366f1" style={{ flexShrink: 0 }}/>
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
