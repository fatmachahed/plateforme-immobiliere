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
    qn: strip(item.q),
    an: strip(item.a),
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

/* -- Mode "moteur de recherche" : un mot tapé (ex. "gratuit") doit remonter
   TOUTES les entrées où ce mot apparaît, pas juste une seule "meilleure"
   réponse devinée. On note chaque entrée (correspondance exacte du mot
   normalisé > correspondance partielle, question > réponse) puis on
   renvoie la liste triée. -- */
const MAX_RESULTS = 6;

function searchFaq(query) {
  const tokens = (strip(query).match(/[a-z0-9]+/g) || [])
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map(norm);
  if (tokens.length === 0) return [];

  const scored = ENTRIES.map((entry) => {
    let score = 0;
    for (const t of tokens) {
      if (entry.tokensQ.has(t)) score += 5;
      else if ([...entry.tokensQ].some((w) => w.includes(t) || t.includes(w))) score += 3;
      else if (entry.tokensA.has(t)) score += 2;
      else if ([...entry.tokensA].some((w) => w.includes(t) || t.includes(w))) score += 1;
    }
    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_RESULTS).map((r) => r.entry);
}

/* -- Recherche instantanée pendant la frappe : chaque fragment tapé
   (dès 2 lettres, ex. "gra") doit apparaître tel quel dans la question ou
   la réponse. Tous les fragments doivent correspondre (ET). Les entrées dont
   la QUESTION contient le fragment passent devant, surtout en début de mot. -- */
const LIVE_MIN_CHARS = 2;

const liveTokens = (query) =>
  (strip(query).match(/[a-z0-9]+/g) || []).filter(
    (t) => t.length >= LIVE_MIN_CHARS && !STOPWORDS.has(t)
  );

function liveSearch(query) {
  const tokens = liveTokens(query);
  if (tokens.length === 0) return [];

  return ENTRIES.map((entry) => {
    let score = 0;
    for (const t of tokens) {
      const iq = entry.qn.indexOf(t);
      if (iq !== -1) {
        score += 3;
        if (iq === 0 || !/[a-z0-9]/.test(entry.qn[iq - 1])) score += 2;
      } else if (entry.an.includes(t)) {
        score += 1;
      } else {
        return null; // un fragment absent => entrée écartée
      }
    }
    return { entry, score };
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}

/* -- Met en gras les fragments trouvés dans l'intitulé de la question.
   strip() conserve la longueur caractère par caractère (accents retirés),
   donc les positions trouvées dans le texte normalisé valent pour l'original. -- */
function highlight(text, tokens) {
  const n = [...text].map((c) => strip(c).charAt(0) || c).join("");
  const marks = new Array(text.length).fill(false);
  for (const t of tokens) {
    let i = n.indexOf(t);
    while (i !== -1) {
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      i = n.indexOf(t, i + 1);
    }
  }
  const out = [];
  let buf = "", on = false;
  [...text].forEach((c, i) => {
    if (marks[i] !== on) {
      if (buf) out.push(on ? <mark key={i} style={MARK_STYLE}>{buf}</mark> : buf);
      buf = ""; on = marks[i];
    }
    buf += c;
  });
  if (buf) out.push(on ? <mark key="end" style={MARK_STYLE}>{buf}</mark> : buf);
  return out;
}

const MARK_STYLE = { background: "#fde68a", color: "inherit", borderRadius: 3, padding: "0 1px" };

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
    const results = searchFaq(q);

    let botMessage;
    if (results.length === 0) {
      botMessage = {
        from: "bot",
        text: "Je n'ai pas trouvé de réponse précise à cette question. Consultez notre page FAQ complète ou contactez notre support, ils vous répondront rapidement.",
        fallback: true,
      };
    } else if (results.length === 1) {
      botMessage = { from: "bot", text: results[0].a };
    } else {
      botMessage = {
        from: "bot",
        text: `${results.length} réponses contiennent « ${q} » — cliquez sur une question :`,
        results,
      };
    }

    setMessages((m) => [...m, { from: "user", text: q }, botMessage]);
    setInput("");
  };

  /* Choix d'un résultat dans une liste de recherche : on affiche directement
     sa réponse (pas une nouvelle recherche sur son intitulé, qui redonnerait
     souvent plusieurs résultats à cause des mots communs "gratuit", "annonce"…). */
  const pick = (entry) => {
    setMessages((m) => [...m, { from: "user", text: entry.q }, { from: "bot", text: entry.a }]);
    setInput("");
  };

  /* Résultats instantanés recalculés à chaque frappe */
  const liveQuery = input.trim();
  const typing = liveQuery.length >= LIVE_MIN_CHARS;
  const liveResults = typing ? liveSearch(liveQuery) : [];
  const liveHl = liveTokens(liveQuery);

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
                  {m.results && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {m.results.map((r, ri) => (
                        <button
                          key={ri}
                          onClick={() => pick(r)}
                          style={{
                            textAlign: "left", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9,
                            padding: "7px 10px", fontSize: 12.5, color: "#4338ca", cursor: "pointer",
                            fontFamily: "inherit", fontWeight: 600,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.background = "#eef2ff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
                        >
                          {r.q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && !typing && (
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

          {/* Résultats instantanés pendant la frappe */}
          {typing && (
            <div style={{
              flexShrink: 0, maxHeight: "45%", overflowY: "auto", borderTop: "1px solid #e2e8f0",
              background: "#f8fafc", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                {liveResults.length === 0
                  ? `Aucune rubrique ne contient « ${liveQuery} »`
                  : `${liveResults.length} rubrique${liveResults.length > 1 ? "s" : ""} contenant « ${liveQuery} »`}
              </div>
              {liveResults.map((r, ri) => (
                <button
                  key={ri}
                  type="button"
                  onClick={() => pick(r)}
                  style={{
                    textAlign: "left", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9,
                    padding: "7px 10px", fontSize: 12.5, color: "#334155", cursor: "pointer",
                    fontFamily: "inherit", fontWeight: 500,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.background = "#eef2ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
                >
                  {highlight(r.q, liveHl)}
                  <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>{r.cat}</div>
                </button>
              ))}
            </div>
          )}

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
