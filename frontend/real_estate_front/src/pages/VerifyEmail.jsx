import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import API_URL from "../config";
import Logo from "../components/Logo";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    fetch(`${API_URL}/users/verify-email/${token}`)
      .then(async r => {
        const data = await r.json();
        if (r.ok && data.detail && data.detail.includes("succès")) {
          setStatus("success");
          setMessage(data.detail);
        } else {
          setStatus("error");
          setMessage(data.detail || "Lien invalide ou expiré.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Impossible de vérifier le lien. Réessayez plus tard.");
      });
  }, [token]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, maxWidth: 460, width: "100%",
        padding: "44px 40px", textAlign: "center",
        boxShadow: "0 30px 80px rgba(0,0,0,.3)",
      }}>
        <div style={{ marginBottom: 28 }}>
          <Logo variant="color" height={36} />
        </div>

        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
              Vérification en cours…
            </h2>
            <p style={{ color: "#64748b", fontSize: 14 }}>Veuillez patienter quelques secondes.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#dcfce7", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px", fontSize: 36,
            }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
              Email vérifié !
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Votre adresse email a été confirmée avec succès.<br />
              Votre compte est maintenant actif.
            </p>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#6366f1", color: "#fff",
              padding: "13px 28px", borderRadius: 12,
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}>
              Se connecter →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#fee2e2", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px", fontSize: 36,
            }}>✗</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
              Lien invalide
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              {message}
            </p>
            <Link to="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#0f172a", color: "#fff",
              padding: "13px 28px", borderRadius: 12,
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}>
              Créer un compte
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
