import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Check, RotateCcw, Copy, Wand2, Loader2 } from "lucide-react";

/* ── Chips de suggestions ── */
const CHIPS = [
  "Vue sur mer",
  "Lumineux",
  "Quartier calme",
  "Résidence sécurisée",
  "Idéal famille",
  "Bon investissement",
  "Moderne & standing",
  "Proche commodités",
  "Jardin verdoyant",
  "Vue dégagée",
];

/* ── Icône par type de bien ── */
const TYPE_ICO = {
  appartement: "🏢", villa: "🏡", terrain: "🌿", bureau: "🏢",
  ferme: "🌾", local_commercial: "🏪", maison: "🏠", bord_eau: "🌊",
};

/* ═══════════════════════════════════════════════════════
   Générateur de description — basé uniquement sur les
   données réelles du formulaire + souhaits utilisateur.
   Aucune hallucination : si un champ est absent, on ne
   l'invente pas.
═══════════════════════════════════════════════════════ */
function genDescription(initialData, wishes) {
  const d = initialData || {};
  const w = (wishes || "").toLowerCase();

  const typeLabels = {
    appartement: "appartement", villa: "villa", terrain: "terrain",
    bureau: "bureau", ferme: "ferme", local_commercial: "local commercial",
    maison: "maison", bord_eau: "bien en bord de mer",
  };
  const typeFr  = typeLabels[d.type_bien] || d.type_bien || "bien immobilier";
  const det     = ["appartement","bureau"].includes(d.type_bien) ? "cet" : "ce";
  const offreFr = d.categorie === "location"  ? "à louer"
                : d.categorie === "vacances"  ? "en location saisonnière"
                : "à vendre";

  /* Contexte utilisateur */
  const ctx = {
    calme:       /calme|tranquil|paisible|silencieux/i.test(w),
    lumineux:    /lumineux|luminosité|ensoleillé|clair/i.test(w),
    moderne:     /moderne|contemporain|design|standing|luxe/i.test(w),
    famille:     /famille|familial|enfant|scolaire/i.test(w),
    vue:         /vue|panorama|horizon|paysage/i.test(w),
    central:     /centre|central|proche|commodités|accès|quartier/i.test(w),
    sécurisé:    /sécuris|gardien|résidence fermée|surveillance/i.test(w),
    invest:      /invest|rentabilité|rendement|locatif/i.test(w),
    verdoyant:   /jardin|vert|verdoyant|nature/i.test(w),
  };

  /* Localisation */
  const loc = d.delegation
    ? `${d.delegation}${d.gouvernorat ? `, ${d.gouvernorat}` : ""}`
    : d.gouvernorat || "";

  const paragraphs = [];

  /* ── §1 Introduction ── */
  let intro = `Nous vous proposons ${det} ${typeFr} ${offreFr}`;
  if (loc)    intro += `, idéalement situé${d.type_bien === "appartement" ? "e" : ""} à ${loc}`;
  if (d.address && d.address !== "Tunis, Tunisie") intro += ` (${d.address})`;

  const qualifiers = [];
  if (ctx.calme)    qualifiers.push("dans un cadre calme et résidentiel");
  if (ctx.central)  qualifiers.push("à proximité immédiate de toutes les commodités");
  if (ctx.sécurisé) qualifiers.push("au sein d'une résidence sécurisée");
  if (ctx.famille)  qualifiers.push("dans un environnement idéal pour les familles");
  if (qualifiers.length) intro += ", " + qualifiers.join(" et ");
  intro += ".";
  paragraphs.push(intro);

  /* ── §2 Composition ── */
  const compo = [];
  if (d.superficie)     compo.push(`une superficie de ${d.superficie} m²`);
  if (d.type_bien !== "terrain") {
    if (d.nb_pieces     > 0) compo.push(`${d.nb_pieces} pièce${d.nb_pieces > 1 ? "s" : ""}`);
    if (d.nb_chambres   > 0) compo.push(`${d.nb_chambres} chambre${d.nb_chambres > 1 ? "s" : ""}`);
    if (d.nb_salles_bain > 0) compo.push(`${d.nb_salles_bain} salle${d.nb_salles_bain > 1 ? "s" : ""} de bain`);
  }
  if (d.type_appartement) compo.push(`type ${d.type_appartement.toUpperCase()}`);
  if (d.etage !== undefined && d.etage !== "") {
    compo.push(String(d.etage) === "0" ? "situé au rez-de-chaussée" : `au ${d.etage}e étage`);
  }

  if (compo.length > 0) {
    let p2 = `Ce bien ${ctx.lumineux ? "lumineux et agréable " : ""}dispose de ${compo.join(", ")}`;
    const etatMap = {
      nouveau:            ctx.moderne
        ? ". Livré en état neuf avec des finitions haut de gamme et un design contemporain soigné"
        : ". Livré en état neuf, il est prêt à l'emménagement dès sa remise des clés",
      bon_etat:           ". En excellent état général, il ne nécessite aucun travaux et peut être habité immédiatement",
      a_renover:          ". Nécessitant des travaux de rénovation, il représente une belle opportunité de valorisation à fort potentiel",
      cours_construction: ". Actuellement en cours de construction, la livraison est prévue prochainement",
    };
    p2 += etatMap[d.etat_bien] || "";
    p2 += ".";
    paragraphs.push(p2);
  }

  /* ── §3 Équipements ── */
  const equip = [
    d.vue_mer         && (ctx.vue ? "une vue sur mer époustouflante" : "vue sur mer"),
    d.vue_montagne    && "vue dégagée sur la montagne",
    d.vue_foret       && "vue sur la forêt",
    d.jardin          && (ctx.verdoyant ? "un grand jardin verdoyant et arborisé" : "un jardin privatif"),
    d.terrasse        && "une terrasse",
    d.balcon          && "un balcon",
    d.ascenseur       && "un ascenseur",
    d.garage          && "un garage individuel",
    d.parking         && "une place de parking privative",
    d.meuble          && "un mobilier de qualité inclus",
    d.cuisine_equipee && "une cuisine entièrement équipée",
    d.climatisation   && "une climatisation intégrée",
    d.cellier         && "un cellier",
  ].filter(Boolean);

  if (equip.length > 0) {
    const list = equip.length === 1
      ? equip[0]
      : equip.slice(0, -1).join(", ") + " et " + equip.at(-1);
    paragraphs.push(`Parmi ses atouts, ${det} ${typeFr} bénéficie de : ${list}.`);
  }

  /* ── §4 Terrain spécifique ── */
  if (d.type_bien === "terrain" && d.type_terrain) {
    const tl = {
      agricole: "à vocation agricole", nu: "nu constructible",
      zone_verte: "en zone verte", lotissement: "en lotissement",
      commercial: "à vocation commerciale", industriel: "à vocation industrielle",
    };
    let tp = `Il s'agit d'un terrain ${tl[d.type_terrain] || d.type_terrain}`;
    if (d.titre_foncier === "1")      tp += ", disposant d'un titre foncier en bonne et due forme";
    else if (d.titre_foncier === "0") tp += ", sans titre foncier";
    tp += ".";
    paragraphs.push(tp);
  }

  /* ── §5 Points forts (souhaits utilisateur) — intégrés naturellement ── */
  if (wishes && wishes.trim().length > 5) {
    const pts = wishes.trim()
      .split(/[.,;!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 3);

    if (pts.length > 0) {
      let pf = "";
      if (ctx.invest) {
        pf = `Du point de vue de l'investissement, ${pts[0].charAt(0).toLowerCase() + pts[0].slice(1)}`;
        if (pts.length > 1) pf += `. ${pts.slice(1).join(". ")}`;
        pf += ".";
      } else if (ctx.famille) {
        pf = `Idéal pour une famille, ${pts[0].charAt(0).toLowerCase() + pts[0].slice(1)}`;
        if (pts.length > 1) pf += `. ${pts.slice(1).join(". ")}`;
        pf += ".";
      } else {
        pf = pts.join(". ") + ".";
      }
      paragraphs.push(pf);
    }
  }

  /* ── §6 Prix + contact ── */
  let closing = "";
  if (d.prix) closing += `Affiché au prix de ${Number(d.prix).toLocaleString("fr-TN")} ${d.devise || "TND"}, `;
  closing += ctx.invest
    ? "ce bien représente une opportunité d'investissement à ne pas manquer. Contactez-nous dès aujourd'hui pour plus d'informations ou pour convenir d'une visite."
    : "ce bien constitue une opportunité rare sur le marché. N'hésitez pas à nous contacter pour toute information complémentaire ou pour organiser une visite.";
  paragraphs.push(closing);

  return paragraphs.join("\n\n");
}

/* ═══════════════════════════════════════════════════════ */

const AIDescriptionModal = ({ isOpen, onClose, onConfirm, initialData, currentDescription }) => {
  const [wishes,    setWishes]    = useState("");
  const [result,    setResult]    = useState(currentDescription || "");
  const [loading,   setLoading]   = useState(false);
  const [copied,    setCopied]    = useState(false);
  const wishRef   = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setWishes("");
    setResult(currentDescription || "");
  }, [isOpen]);

  /* Focus textarea on open */
  useEffect(() => {
    if (isOpen) setTimeout(() => wishRef.current?.focus(), 80);
  }, [isOpen]);

  /* Générer */
  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setResult(genDescription(initialData, wishes));
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }, 750);
  };

  /* Chip click — ajoute au texte */
  const addChip = (chip) => {
    setWishes(prev => prev ? `${prev}, ${chip.toLowerCase()}` : chip.toLowerCase());
    wishRef.current?.focus();
  };

  /* Copier */
  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  /* Contexte bien (affiché en haut du modal) */
  const d = initialData || {};
  const ctxParts = [
    d.type_bien && `${TYPE_ICO[d.type_bien] || "🏠"} ${d.type_bien.charAt(0).toUpperCase() + d.type_bien.slice(1)}`,
    d.categorie && d.categorie.charAt(0).toUpperCase() + d.categorie.slice(1),
    d.gouvernorat || "",
    d.superficie  && `${d.superficie} m²`,
  ].filter(Boolean);

  const wordCount = result.split(/\s+/).filter(Boolean).length;

  return (
    <div className="aim-overlay" onClick={onClose}>
      <div className="aim-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="aim-header">
          <div className="aim-header__dot"/>
          <div className="aim-header__inner">
            <div className="aim-header__left">
              <div className="aim-header__ico"><Wand2 size={18}/></div>
              <div>
                <div className="aim-header__title">Rédiger avec l'IA</div>
                <div className="aim-header__sub">Description professionnelle en quelques secondes</div>
              </div>
            </div>
            <button className="aim-close" onClick={onClose}><X size={16}/></button>
          </div>
        </div>

        {/* Contexte du bien */}
        {ctxParts.length > 0 && (
          <div className="aim-context">
            {ctxParts.map((p, i) => (
              <span key={i} className="aim-context__pill">{p}</span>
            ))}
          </div>
        )}

        {/* Corps */}
        <div className="aim-body">

          {/* Zone souhaits */}
          <div className="aim-section">
            <label className="aim-label">
              Vos souhaits pour cette annonce
              <span className="aim-label__hint">optionnel — l'IA utilise déjà les données de votre formulaire</span>
            </label>
            <textarea
              ref={wishRef}
              className="aim-wishes"
              rows={3}
              placeholder="Ex : vue mer, quartier calme et résidentiel, idéal pour une famille…"
              value={wishes}
              onChange={e => setWishes(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleGenerate(); }}
            />

            {/* Chips */}
            <div className="aim-chips">
              {CHIPS.map((c, i) => (
                <button
                  key={i} type="button"
                  className={`aim-chip${wishes.toLowerCase().includes(c.toLowerCase()) ? " aim-chip--on" : ""}`}
                  onClick={() => addChip(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton générer */}
          <button
            className="aim-gen-btn"
            type="button"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading
              ? <><Loader2 size={16} className="aim-spin"/> Génération en cours…</>
              : <><Sparkles size={16}/> {result ? "Régénérer" : "Générer la description"}</>
            }
          </button>

          {/* Résultat */}
          {(result || loading) && (
            <div className="aim-result" ref={resultRef}>
              <div className="aim-result__head">
                <span className="aim-result__title">Description générée</span>
                <div className="aim-result__actions">
                  <button className="aim-icon-btn" type="button" onClick={() => { setLoading(true); setTimeout(() => { setResult(genDescription(initialData, wishes)); setLoading(false); }, 600); }} disabled={loading} title="Régénérer">
                    <RotateCcw size={13}/>
                  </button>
                  <button className="aim-icon-btn" type="button" onClick={handleCopy} disabled={!result} title="Copier">
                    {copied ? <Check size={13}/> : <Copy size={13}/>}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="aim-result__skeleton">
                  <div className="aim-sk"/><div className="aim-sk aim-sk--w80"/><div className="aim-sk aim-sk--w90"/>
                  <div className="aim-sk aim-sk--w70"/><div className="aim-sk"/><div className="aim-sk aim-sk--w60"/>
                </div>
              ) : (
                <>
                  <textarea
                    className="aim-result__text"
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    rows={10}
                  />
                  <div className="aim-result__stats">
                    <span>{wordCount} mots</span>
                    <span>·</span>
                    <span>{result.length} caractères</span>
                    {result.length >= 200 && <span className="aim-result__badge">✓ Score +100 pts</span>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="aim-footer">
          <button className="aim-footer__cancel" type="button" onClick={onClose}>Annuler</button>
          <button
            className="aim-footer__confirm"
            type="button"
            onClick={() => onConfirm(result)}
            disabled={!result || loading}
          >
            <Check size={14}/> Utiliser cette description
          </button>
        </div>
      </div>

      <style>{`
        .aim-overlay {
          position: fixed; inset: 0;
          background: rgba(2,6,23,.6);
          backdrop-filter: blur(5px);
          z-index: 9000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: aimFade .18s ease;
        }
        @keyframes aimFade { from{opacity:0} to{opacity:1} }

        .aim-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%; max-width: 620px;
          max-height: 90vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
          animation: aimUp .28s cubic-bezier(.16,1,.3,1);
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        @keyframes aimUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }

        /* Header */
        .aim-header {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #0f172a 0%, #312e81 100%);
          flex-shrink: 0;
        }
        .aim-header__dot {
          position: absolute; inset: 0; opacity: .05;
          background-image: radial-gradient(circle at 1px 1px, #fff 1px, transparent 0);
          background-size: 20px 20px;
        }
        .aim-header__inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px;
        }
        .aim-header__left { display: flex; align-items: center; gap: 12px; }
        .aim-header__ico {
          width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
          background: linear-gradient(135deg,#6366f1,#818cf8);
          display: flex; align-items: center; justify-content: center; color: #fff;
          box-shadow: 0 4px 14px rgba(99,102,241,.45);
        }
        .aim-header__title { font-size: 15px; font-weight: 800; color: #fff; }
        .aim-header__sub   { font-size: 11.5px; color: #a5b4fc; margin-top: 2px; }
        .aim-close {
          width: 30px; height: 30px; border-radius: 8px; border: none;
          background: rgba(255,255,255,.1); color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .15s;
        }
        .aim-close:hover { background: rgba(255,255,255,.18); color: #fff; }

        /* Contexte */
        .aim-context {
          display: flex; flex-wrap: wrap; gap: 6px;
          padding: 12px 22px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .aim-context__pill {
          font-size: 11.5px; font-weight: 600; color: #4f46e5;
          background: #eef2ff; border: 1px solid #c7d2fe;
          padding: 3px 10px; border-radius: 20px;
        }

        /* Corps */
        .aim-body {
          flex: 1; overflow-y: auto;
          padding: 22px 22px 8px;
          display: flex; flex-direction: column; gap: 16px;
        }

        /* Section souhaits */
        .aim-section { display: flex; flex-direction: column; gap: 10px; }
        .aim-label {
          font-size: 13px; font-weight: 700; color: #0f172a;
          display: flex; flex-direction: column; gap: 2px;
        }
        .aim-label__hint {
          font-size: 11px; font-weight: 400; color: #94a3b8;
        }
        .aim-wishes {
          width: 100%; resize: vertical; min-height: 72px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          padding: 10px 13px; font-size: 13px; font-family: inherit;
          color: #1e293b; background: #f9fafb; outline: none;
          line-height: 1.55; transition: border-color .15s, background .15s;
          box-sizing: border-box;
        }
        .aim-wishes:focus { border-color: #6366f1; background: #fff; }
        .aim-wishes::placeholder { color: #94a3b8; }

        /* Chips */
        .aim-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .aim-chip {
          padding: 5px 12px; border-radius: 20px;
          border: 1.5px solid #e2e8f0; background: #fff;
          font-size: 11.5px; font-weight: 600; color: #374151;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .aim-chip:hover {
          border-color: #6366f1; color: #4f46e5;
          background: #eef2ff; transform: translateY(-1px);
        }
        .aim-chip--on {
          border-color: #6366f1; background: #eef2ff; color: #4f46e5;
        }

        /* Bouton générer */
        .aim-gen-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #0f172a, #312e81);
          color: #fff; font-size: 14px; font-weight: 700;
          border: none; border-radius: 12px; cursor: pointer;
          font-family: inherit; transition: opacity .15s, transform .15s;
          box-shadow: 0 4px 16px rgba(15,23,42,.2);
        }
        .aim-gen-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .aim-gen-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .aim-spin { animation: aimSpin .8s linear infinite; }
        @keyframes aimSpin { to { transform: rotate(360deg); } }

        /* Résultat */
        .aim-result {
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          overflow: hidden;
        }
        .aim-result__head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: #f8fafc; border-bottom: 1px solid #e5e7eb;
        }
        .aim-result__title { font-size: 12px; font-weight: 700; color: #0f172a; }
        .aim-result__actions { display: flex; gap: 6px; }
        .aim-icon-btn {
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid #e5e7eb; background: #fff; color: #64748b;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .15s;
        }
        .aim-icon-btn:hover:not(:disabled) { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
        .aim-icon-btn:disabled { opacity: .35; cursor: not-allowed; }

        /* Textarea résultat éditable */
        .aim-result__text {
          width: 100%; resize: none; border: none; outline: none;
          padding: 14px 16px; font-size: 13.5px; font-family: inherit;
          color: #1e293b; line-height: 1.8; background: #fff;
          box-sizing: border-box;
        }

        .aim-result__stats {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px;
          background: #f8fafc; border-top: 1px solid #f1f5f9;
          font-size: 11px; color: #94a3b8;
        }
        .aim-result__badge {
          margin-left: auto;
          font-size: 11px; font-weight: 700; color: #16a34a;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          padding: 2px 8px; border-radius: 20px;
        }

        /* Skeleton loading */
        .aim-result__skeleton { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .aim-sk {
          height: 12px; border-radius: 6px; width: 100%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: aimShimmer 1.4s infinite;
        }
        .aim-sk--w60 { width: 60%; }
        .aim-sk--w70 { width: 70%; }
        .aim-sk--w80 { width: 80%; }
        .aim-sk--w90 { width: 90%; }
        @keyframes aimShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Footer */
        .aim-footer {
          display: flex; justify-content: flex-end; align-items: center; gap: 10px;
          padding: 14px 22px;
          background: #f8fafc; border-top: 1px solid #e5e7eb; flex-shrink: 0;
        }
        .aim-footer__cancel {
          padding: 9px 18px; border-radius: 10px; border: 1.5px solid #e5e7eb;
          background: #fff; color: #374151; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all .15s;
        }
        .aim-footer__cancel:hover { background: #f3f4f6; }
        .aim-footer__confirm {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 20px; border-radius: 10px; border: none;
          background: linear-gradient(135deg,#0f172a,#312e81);
          color: #fff; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 12px rgba(15,23,42,.2);
          transition: opacity .15s, transform .15s;
        }
        .aim-footer__confirm:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .aim-footer__confirm:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; transform: none; }

        @media (max-width: 640px) {
          .aim-modal { max-width: 100%; border-radius: 16px; }
          .aim-body { padding: 16px 16px 8px; }
          .aim-header__inner { padding: 14px 16px; }
          .aim-footer { padding: 12px 16px; }
        }
      `}</style>
    </div>
  );
};

export default AIDescriptionModal;
