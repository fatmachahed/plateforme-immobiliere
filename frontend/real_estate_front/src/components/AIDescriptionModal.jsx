import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Check, Loader2 } from "lucide-react";

/* ── Génère une description à partir des données + instruction utilisateur ── */
function genDescription(initialData, instruction) {
  const d = initialData || {};
  const w = (instruction || "").toLowerCase();

  const typeLabels = {
    appartement: "appartement", duplex: "duplex", penthouse: "penthouse", villa: "villa", terrain: "terrain",
    bureau: "bureau", ferme: "ferme agricole", ferme_agricole: "ferme agricole", local_commercial: "local commercial",
    maison: "maison", bord_eau: "bien en bord de mer",
  };
  const typeFr  = typeLabels[d.type_bien] || d.type_bien || "bien immobilier";
  const det     = ["appartement","duplex","penthouse","bureau"].includes(d.type_bien) ? "cet"
                : ["villa","maison","ferme","ferme_agricole"].includes(d.type_bien) ? "cette"
                : "ce";
  const offreFr = d.categorie === "location" ? "à louer"
                : d.categorie === "vacances"  ? "en location saisonnière"
                : "à vendre";

  const ctx = {
    calme:    /calme|tranquil|paisible|silencieux/i.test(w),
    lumineux: /lumineux|luminosité|ensoleillé|clair/i.test(w),
    moderne:  /moderne|contemporain|design|standing|luxe/i.test(w),
    famille:  /famille|familial|enfant|scolaire/i.test(w),
    vue:      /vue|panorama|horizon|paysage/i.test(w),
    central:  /centre|central|proche|commodités|accès|quartier/i.test(w),
    sécurisé: /sécuris|gardien|résidence fermée|surveillance/i.test(w),
    invest:   /invest|rentabilité|rendement|locatif/i.test(w),
    court:    /court|court|résume|raccourcis|bref|simple/i.test(w),
    formel:   /formel|professionnel|soutenu|officiel/i.test(w),
  };

  const loc = d.delegation
    ? `${d.delegation}${d.gouvernorat ? `, ${d.gouvernorat}` : ""}`
    : d.gouvernorat || "";

  const paragraphs = [];

  /* §1 Introduction */
  let intro = ctx.formel
    ? `Nous avons l'honneur de vous présenter ${det} ${typeFr} ${offreFr}`
    : `Nous vous proposons ${det} ${typeFr} ${offreFr}`;
  if (loc) intro += `, idéalement situé${["appartement","duplex","penthouse"].includes(d.type_bien) ? "e" : ""} à ${loc}`;
  const qualifiers = [];
  if (ctx.calme)    qualifiers.push("dans un cadre calme et résidentiel");
  if (ctx.central)  qualifiers.push("à proximité immédiate de toutes les commodités");
  if (ctx.sécurisé) qualifiers.push("au sein d'une résidence sécurisée");
  if (ctx.famille)  qualifiers.push("dans un environnement idéal pour les familles");
  if (qualifiers.length) intro += ", " + qualifiers.join(" et ");
  intro += ".";
  paragraphs.push(intro);

  /* §2 Composition */
  if (!ctx.court) {
    const compo = [];
    if (d.superficie)      compo.push(`une superficie de ${d.superficie} m²`);
    if (d.type_bien !== "terrain") {
      if (d.nb_pieces     > 0) compo.push(`${d.nb_pieces} pièce${d.nb_pieces > 1 ? "s" : ""}`);
      if (d.nb_chambres   > 0) compo.push(`${d.nb_chambres} chambre${d.nb_chambres > 1 ? "s" : ""}`);
      if (d.nb_salles_bain > 0) compo.push(`${d.nb_salles_bain} salle${d.nb_salles_bain > 1 ? "s" : ""} de bain`);
    }
    if (compo.length > 0) {
      let p2 = `Ce bien ${ctx.lumineux ? "lumineux et agréable " : ""}dispose de ${compo.join(", ")}`;
      const etatMap = {
        nouveau:            ctx.moderne
          ? ". Livré en état neuf avec des finitions haut de gamme et un design contemporain"
          : ". Livré en état neuf, prêt à l'emménagement",
        bon_etat:           ". En excellent état général, sans travaux à prévoir",
        a_renover:          ". Nécessitant des travaux, il représente une belle opportunité de valorisation",
        cours_construction: ". Actuellement en cours de construction",
      };
      p2 += etatMap[d.etat_bien] || "";
      p2 += ".";
      paragraphs.push(p2);
    }

    /* §3 Équipements */
    const equip = [
      d.vue_mer && "vue sur mer", d.jardin && "jardin privatif",
      d.terrasse && "terrasse", d.balcon && "balcon",
      d.ascenseur && "ascenseur", d.garage && "garage",
      d.parking && "parking privatif", d.meuble && "meublé",
      d.cuisine_equipee && "cuisine équipée", d.climatisation && "climatisation",
    ].filter(Boolean);
    if (equip.length > 0) {
      paragraphs.push(`Parmi ses atouts : ${equip.join(", ")}.`);
    }
  }

  /* §4 Fermeture */
  let closing = "";
  if (d.prix) closing += `Affiché au prix de ${Number(d.prix).toLocaleString("fr-TN")} ${d.devise || "TND"}, `;
  closing += ctx.invest
    ? "ce bien représente une opportunité d'investissement à ne pas manquer. Contactez-nous pour plus d'informations."
    : ctx.formel
      ? "nous vous invitons à nous contacter pour tout renseignement complémentaire ou pour convenir d'une visite."
      : "n'hésitez pas à nous contacter pour organiser une visite.";
  paragraphs.push(closing);

  return paragraphs.join("\n\n");
}

/* ── Suggestions rapides ── */
const SUGGESTIONS = [
  "Rends-la plus courte",
  "Rends-la plus professionnelle",
  "Mets en avant le quartier calme",
  "Ajoute un ton moderne et luxueux",
  "Idéal pour investissement locatif",
  "Idéal pour une famille",
];

/* ═══════════════════════════════════════ */

const AIDescriptionModal = ({ isOpen, onClose, onConfirm, initialData, currentDescription }) => {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [lastDesc,    setLastDesc]    = useState("");
  const inputRef  = useRef(null);
  const chatEnd   = useRef(null);

  /* Init à l'ouverture */
  useEffect(() => {
    if (!isOpen) return;
    const initial = currentDescription || "";
    setLastDesc(initial);
    setInput("");
    setLoading(false);
    setMessages([{
      role: "ai",
      text: initial
        ? "Bonjour ! Voici votre description actuelle. Dites-moi comment vous souhaitez l'améliorer."
        : "Bonjour ! Je vais vous aider à rédiger une description percutante. Dites-moi ce que vous souhaitez mettre en avant.",
      description: initial || null,
    }]);
  }, [isOpen]);

  /* Scroll auto */
  useEffect(() => {
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [messages, loading]);

  /* Focus input */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  const send = (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    setTimeout(() => {
      const newDesc = genDescription(initialData, msg + " " + lastDesc);
      setLastDesc(newDesc);
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Voici une version améliorée selon vos indications :",
        description: newDesc,
      }]);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="aic-overlay" onClick={onClose}>
      <div className="aic-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="aic-header">
          <div className="aic-header__left">
            <div className="aic-header__ico"><Sparkles size={16}/></div>
            <div>
              <div className="aic-header__title">Assistant description IA</div>
              <div className="aic-header__sub">Discutez pour améliorer votre annonce</div>
            </div>
          </div>
          <button className="aic-close" onClick={onClose}><X size={15}/></button>
        </div>

        {/* ── Chat ── */}
        <div className="aic-chat">
          {messages.map((msg, i) => (
            <div key={i} className={`aic-msg aic-msg--${msg.role}`}>
              {msg.role === "ai" && (
                <div className="aic-msg__avatar"><Sparkles size={12}/></div>
              )}
              <div className="aic-msg__body">
                <p className="aic-msg__text">{msg.text}</p>

                {msg.description && (
                  <div className="aic-proposal">
                    <pre className="aic-proposal__text">{msg.description}</pre>
                    <button
                      className="aic-proposal__use"
                      type="button"
                      onClick={() => onConfirm(msg.description)}
                    >
                      <Check size={13}/> Utiliser cette version
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="aic-msg aic-msg--ai">
              <div className="aic-msg__avatar"><Sparkles size={12}/></div>
              <div className="aic-msg__body">
                <div className="aic-typing">
                  <span/><span/><span/>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEnd}/>
        </div>

        {/* ── Suggestions rapides ── */}
        {!loading && (
          <div className="aic-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} type="button" className="aic-sugg" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <div className="aic-input-row">
          <input
            ref={inputRef}
            className="aic-input"
            placeholder="Ex : rends-la plus courte, ajoute un ton luxueux…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            disabled={loading}
          />
          <button
            className="aic-send"
            type="button"
            onClick={() => send()}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 size={16} className="aic-spin"/> : <Send size={16}/>}
          </button>
        </div>

      </div>

      <style>{`
        .aic-overlay {
          position: fixed; inset: 0;
          background: rgba(2,6,23,.55);
          backdrop-filter: blur(4px);
          z-index: 9000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: aicFade .15s ease;
        }
        @keyframes aicFade { from{opacity:0} to{opacity:1} }

        .aic-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%; max-width: 520px;
          height: 88vh; max-height: 640px;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 70px rgba(0,0,0,.25);
          animation: aicUp .25s cubic-bezier(.16,1,.3,1);
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        @keyframes aicUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }

        /* Header */
        .aic-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px;
          background: linear-gradient(135deg, #0f172a, #312e81);
          flex-shrink: 0;
        }
        .aic-header__left { display: flex; align-items: center; gap: 11px; }
        .aic-header__ico {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          display: flex; align-items: center; justify-content: center; color: #fff;
          box-shadow: 0 3px 10px rgba(99,102,241,.4);
        }
        .aic-header__title { font-size: 14px; font-weight: 800; color: #fff; }
        .aic-header__sub   { font-size: 11px; color: #a5b4fc; margin-top: 1px; }
        .aic-close {
          width: 28px; height: 28px; border-radius: 7px; border: none;
          background: rgba(255,255,255,.1); color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .15s; flex-shrink: 0;
        }
        .aic-close:hover { background: rgba(255,255,255,.2); color: #fff; }

        /* Chat zone */
        .aic-chat {
          flex: 1; overflow-y: auto;
          padding: 18px 16px;
          display: flex; flex-direction: column; gap: 16px;
          background: #f8fafc;
        }

        /* Messages */
        .aic-msg { display: flex; gap: 9px; max-width: 100%; }
        .aic-msg--user {
          flex-direction: row-reverse;
          align-self: flex-end;
          max-width: 78%;
        }
        .aic-msg--ai { align-self: flex-start; max-width: 92%; }

        .aic-msg__avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          display: flex; align-items: center; justify-content: center;
          color: #fff; margin-top: 2px;
        }
        .aic-msg__body { display: flex; flex-direction: column; gap: 8px; }

        .aic-msg__text {
          margin: 0; font-size: 13px; line-height: 1.55;
          padding: 10px 14px; border-radius: 14px;
        }
        .aic-msg--ai .aic-msg__text {
          background: #fff; color: #1e293b;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
        }
        .aic-msg--user .aic-msg__text {
          background: #6366f1; color: #fff;
          border-bottom-right-radius: 4px;
        }

        /* Proposal box */
        .aic-proposal {
          background: #fff;
          border: 1.5px solid #e0e7ff;
          border-radius: 12px;
          overflow: hidden;
        }
        .aic-proposal__text {
          margin: 0; padding: 14px 16px;
          font-size: 12.5px; line-height: 1.7;
          color: #334155; font-family: inherit;
          white-space: pre-wrap; word-break: break-word;
          max-height: 200px; overflow-y: auto;
          background: #fafbff;
        }
        .aic-proposal__use {
          display: flex; align-items: center; gap: 6px;
          width: 100%; padding: 9px 16px;
          background: #6366f1; color: #fff;
          border: none; font-size: 12.5px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: background .15s; justify-content: center;
        }
        .aic-proposal__use:hover { background: #4f46e5; }

        /* Typing */
        .aic-typing {
          display: flex; align-items: center; gap: 5px;
          padding: 12px 16px; background: #fff;
          border: 1px solid #e5e7eb; border-radius: 14px;
          border-bottom-left-radius: 4px; width: fit-content;
        }
        .aic-typing span {
          width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
          animation: aicBounce 1.2s ease-in-out infinite;
        }
        .aic-typing span:nth-child(2) { animation-delay: .15s; }
        .aic-typing span:nth-child(3) { animation-delay: .3s;  }
        @keyframes aicBounce {
          0%,60%,100% { transform: translateY(0); }
          30%          { transform: translateY(-5px); }
        }

        /* Suggestions */
        .aic-suggestions {
          display: flex; flex-wrap: wrap; gap: 6px;
          padding: 10px 16px;
          background: #fff; border-top: 1px solid #f1f5f9;
          flex-shrink: 0;
        }
        .aic-sugg {
          padding: 5px 12px; border-radius: 20px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          font-size: 11.5px; font-weight: 600; color: #475569;
          cursor: pointer; transition: all .15s; font-family: inherit;
          white-space: nowrap;
        }
        .aic-sugg:hover {
          border-color: #6366f1; color: #4f46e5;
          background: #eef2ff;
        }

        /* Input row */
        .aic-input-row {
          display: flex; gap: 8px;
          padding: 12px 16px;
          background: #fff; border-top: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .aic-input {
          flex: 1; padding: 10px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 12px;
          font-size: 13px; font-family: inherit; color: #1e293b;
          background: #f9fafb; outline: none;
          transition: border-color .15s, background .15s;
        }
        .aic-input:focus { border-color: #6366f1; background: #fff; }
        .aic-input:disabled { opacity: .5; }
        .aic-input::placeholder { color: #94a3b8; }

        .aic-send {
          width: 40px; height: 40px; border-radius: 12px; border: none;
          background: #6366f1; color: #fff; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .15s;
        }
        .aic-send:hover:not(:disabled) { background: #4f46e5; }
        .aic-send:disabled { opacity: .4; cursor: not-allowed; }
        .aic-spin { animation: aicSpin .8s linear infinite; }
        @keyframes aicSpin { to { transform: rotate(360deg); } }

        @media (max-width: 560px) {
          .aic-modal { max-height: 95vh; border-radius: 16px; }
        }
      `}</style>
    </div>
  );
};

export default AIDescriptionModal;
