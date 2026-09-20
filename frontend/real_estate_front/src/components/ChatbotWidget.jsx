import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, HelpCircle } from "lucide-react";
import { FAQS } from "../pages/FAQ";

/* -- Aplatit FAQS (groupé par catégorie dans FAQ.jsx) en une liste plate,
   et normalise le texte pour une recherche par mots-clés sans accents. -- */
const strip = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const STOPWORDS = new Set([
  "les","des","une","est","que","qui","pour","dans","avec","sur","mon","mes","comment",
  "quel","quelle","quels","quelles","est-ce","ce","cette","ces","aux","vos","votre","son",
  "sont","peut","puis","the","and","how","what",
]);

/* -- Normalisation légère : retire le "s" du pluriel pour que "photo"/"photos"
   ou "annonce"/"annonces" soient traités comme un seul et même mot-clé. -- */
const norm = (w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w);

const ENTRIES = FAQS.flatMap((section) =>
  section.items.map((item) => ({
    cat: section.cat,
    q: item.q,
    a: item.a,
    tokensQ: new Set((strip(item.q).match(/[a-z0-9]+/g) || []).map(norm)),
    tokensA: new Set((strip(item.a).match(/[a-z0-9]+/g) || []).map(norm)),
  }))
);

/* -- Quelques questions de navigation mises en avant dès l'ouverture -- */
const SUGGESTIONS = [
  "Comment publier une annonce ?",
  "Comment utiliser la carte interactive ?",
  "Comment créer un compte ?",
  "Comment enregistrer une alerte email ?",
  "La plateforme est-elle gratuite ?",
  "Comment contacter le support ?",
];

function findAnswer(question) {
  const tokens = (strip(question).match(/[a-z0-9]+/g) || [])
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map(norm);
  if (tokens.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const entry of ENTRIES) {
    let score = 0;
    for (const t of tokens) {
      if (entry.tokensQ.has(t)) score += 3;
      else if (entry.tokensA.has(t)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  /* Score minimal pour éviter une réponse hors-sujet sur une correspondance trop faible */
  return bestScore >= 3 ? best : null;
}

const WELCOME = "Bonjour 👋 Je suis l'assistant Localizi.tn. Posez-moi une question sur la navigation du site (publier une annonce, rechercher un bien, créer un compte…) ou choisissez une suggestion ci-dessous.";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ from: "bot", text: WELCOME }]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const ask = (question) => {
    const q = question.trim();
    if (!q) return;
    const match = findAnswer(q);
    const answer = match
      ? match.a
      : "Je n'ai pas trouvé de réponse précise à cette question. Consultez notre page FAQ complète ou contactez notre support, ils vous répondront rapidement.";
    setMessages((m) => [
      ...m,
      { from: "user", text: q },
      { from: "bot", text: answer, fallback: !match },
    ]);
    setInput("");
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9997, fontFamily: "'Poppins',system-ui,sans-serif" }}>
      {open && (
        <div
          style={{
            width: 340, maxWidth: "calc(100vw - 48px)", height: 480, maxHeight: "calc(100vh - 120px)",
            background: "#fff", borderRadius: 18, boxShadow: "0 12px 40px rgba(15,23,42,.22)",
            display: "flex", flexDirection: "column", overflow: "hidden", marginBottom: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#6366f1,#4f46e5)", padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.18)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <HelpCircle size={18} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Assistant Localizi</div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 11.5 }}>Questions fréquentes</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
            >
              <X size={18} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 13px", borderRadius: 14,
                  fontSize: 13, lineHeight: 1.55,
                  background: m.from === "user" ? "#6366f1" : "#f1f5f9",
                  color: m.from === "user" ? "#fff" : "#334155",
                  borderBottomRightRadius: m.from === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.from === "user" ? 14 : 4,
                }}>
                  {m.text}
                  {m.fallback && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link to="/faq" onClick={() => setOpen(false)} style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textDecoration: "underline" }}>
                        Voir la FAQ
                      </Link>
                      <Link to="/contact" onClick={() => setOpen(false)} style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textDecoration: "underline" }}>
                        Contacter le support
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    style={{
                      textAlign: "left", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
                      padding: "8px 12px", fontSize: 12.5, color: "#475569", cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.background = "#eef2ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #f1f5f9", flexShrink: 0 }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question…"
              style={{
                flex: 1, border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 12px",
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0,
                background: input.trim() ? "#6366f1" : "#cbd5e1", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() ? "pointer" : "default",
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Bulle flottante */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        style={{
          width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(99,102,241,.4)", marginLeft: "auto",
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
