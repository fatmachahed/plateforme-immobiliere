import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  MapPin, Eye, TrendingUp, Users, Star, Globe, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, ArrowRight, Search, Smartphone, Building2, ChevronRight
} from "lucide-react";

/* ── Stats issues de l'étude SeLoger / OpinionWay ── */
const STATS = [
  { val: "65 %",  label: "des acheteurs regrettent l'absence de localisation précise dans les annonces" },
  { val: "62 %",  label: "ont déjà écarté une annonce faute de localisation" },
  { val: "9/10",  label: "seraient davantage incités à visiter un bien si sa position exacte était indiquée" },
  { val: "×5",    label: "plus de contacts pour une annonce géolocalisée vs une annonce classique" },
];

/* ── Avantages ── */
const AVANTAGES = [
  {
    icon: <Eye size={22}/>,
    title: "Meilleure visibilité",
    desc: "Un bien géolocalisé apparaît dans les recherches par carte. Sans géolocalisation, il est invisible pour tous les visiteurs qui filtrent par zone — une audience qui ne cesse de croître.",
  },
  {
    icon: <Users size={22}/>,
    title: "Contacts plus qualifiés",
    desc: "En affichant la position du bien, vous éliminez les contacts qui cherchent uniquement l'adresse. Les personnes qui vous contactent ont déjà validé la localisation : ce sont des prospects réellement intéressés.",
  },
  {
    icon: <TrendingUp size={22}/>,
    title: "Annonces plus complètes",
    desc: "La carte enrichit automatiquement votre annonce d'informations contextuelles : proximité des axes routiers, espaces verts, ambiance du quartier. Une description que les mots seuls ne peuvent pas transmettre.",
  },
  {
    icon: <Star size={22}/>,
    title: "Transparence & confiance",
    desc: "Les acheteurs d'aujourd'hui exigent la transparence. Cacher la localisation d'un bien crée un sentiment de méfiance. La géolocalisation rassure et accélère la prise de décision.",
  },
  {
    icon: <Search size={22}/>,
    title: "Meilleur référencement",
    desc: "Un bien géolocalisé dispose de données géographiques structurées qui améliorent son positionnement dans les moteurs de recherche — Google valorise de plus en plus les contenus géolocalisés.",
  },
  {
    icon: <Smartphone size={22}/>,
    title: "Incontournable sur mobile",
    desc: "Sur smartphone, la recherche immobilière se fait naturellement sur une carte. Un bien sans géolocalisation n'existe tout simplement pas pour les utilisateurs mobiles — une audience majoritaire.",
  },
];

/* ── Exemples internationaux ── */
const EXEMPLES = [
  {
    pays: "Australie",
    site: "RealEstate.au",
    desc: "Recherche directe par carte avec zoom progressif. Les marqueurs se transforment en compteurs de biens disponibles au fur et à mesure du zoom. Informations sur les écoles à proximité (distance, type, niveau) — un critère décisif pour les familles.",
    color: "#f59e0b",
  },
  {
    pays: "Pays-Bas",
    site: "Funda",
    desc: "Carte interactive avec vues à 360° du quartier et de l'intérieur du bien. L'utilisateur commence sa visite depuis la rue et entre dans l'appartement virtuellement, sans quitter son écran.",
    color: "#f97316",
  },
  {
    pays: "États-Unis",
    site: "Trulia",
    desc: "Superposition de multiples couches de données sur la carte : démographie, commerces, écoles, sécurité, score de marchabilité (\"walk score\"). La localisation devient le cœur de la recherche immobilière.",
    color: "#6366f1",
  },
  {
    pays: "Royaume-Uni",
    site: "Rightmove",
    desc: "Recherche par dessin libre sur la carte : l'utilisateur trace lui-même sa zone. Également : recherche par arrêt de métro, visualisation des écoles à proximité. L'interactivité maximale au service de l'expérience client.",
    color: "#0ea5e9",
  },
  {
    pays: "Brésil",
    site: "VivaReal",
    desc: "Adresse intégrée dès la liste des résultats. Recherche par carte réservée aux utilisateurs mobiles — un choix stratégique cohérent avec l'usage majoritairement mobile de la plateforme.",
    color: "#10b981",
  },
];

/* ── FAQ géolocalisation ── */
const FAQS = [
  {
    q: "Faut-il géolocaliser tous ses biens ?",
    a: "Oui, dans la mesure du possible. Un bien non géolocalisé est pénalisé en visibilité sur la carte et dans les moteurs de recherche. Pour les propriétaires souhaitant garder une certaine discrétion, une géolocalisation approximative (au quartier ou à la délégation) est préférable à une absence totale de localisation : le bien reste visible sur la carte sans que l'adresse exacte soit divulguée.",
  },
  {
    q: "La géolocalisation précise n'expose-t-elle pas trop le bien ?",
    a: "La crainte est légitime mais souvent surestimée. Sur Localizi.tn, vous choisissez le niveau de précision : adresse exacte, quartier ou délégation. Une géolocalisation partielle (cercle approximatif) permet d'apparaître sur la carte tout en préservant l'adresse exacte. Par ailleurs, un concurrent mal intentionné peut toujours trouver l'adresse d'un bien via d'autres moyens — cacher la position ne protège pas réellement.",
  },
  {
    q: "La géolocalisation augmente-t-elle vraiment le nombre de contacts ?",
    a: "Les données sont sans appel : une annonce géolocalisée génère en moyenne 5 fois plus de contacts qu'une annonce sans localisation (source : SeLoger/OpinionWay). Ces contacts sont en outre bien plus qualifiés, car le prospect a déjà validé la zone avant de vous écrire.",
  },
  {
    q: "Comment Localizi.tn utilise-t-elle la géolocalisation ?",
    a: "Localizi.tn place chaque annonce sur une carte interactive couvrant les 24 gouvernorats tunisiens. Les biens sont géolocalisés selon le gouvernorat, la délégation et, si le propriétaire le souhaite, la localité précise. Les visiteurs peuvent zoomer, filtrer par zone et consulter le contexte géographique de chaque bien directement sur la carte.",
  },
  {
    q: "Quels types de biens bénéficient le plus de la géolocalisation ?",
    a: "Tous les biens en bénéficient, mais particulièrement ceux dont la situation est un atout : vue mer, proximité d'une école ou d'un centre commercial, accès direct à une route principale, quartier résidentiel calme. La carte permet de mettre en valeur ce qui ne peut pas être dit dans une description texte.",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14.5, color: "#0f172a", lineHeight: 1.5, paddingRight: 16 }}>{q}</span>
        {open
          ? <ChevronUp size={18} style={{ color: "#6366f1", flexShrink: 0 }} />
          : <ChevronDown size={18} style={{ color: "#94a3b8", flexShrink: 0 }} />
        }
      </button>
      {open && <div style={{ paddingBottom: 18, fontSize: 14, color: "#475569", lineHeight: 1.8 }}>{a}</div>}
    </div>
  );
}

export default function Geolocalisation() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Poppins',system-ui,sans-serif" }}>
      <Navbar />

      {/* ── Fil d'Ariane ── */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb", padding: "10px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
          <Link to="/faq" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>FAQ</Link>
          <ChevronRight size={13} />
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Géolocalisation immobilière</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #0a1628 0%, #1e1b4b 60%, #0f172a 100%)",
        padding: "72px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 60% 50%, rgba(99,102,241,.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}/>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(99,102,241,.2)", border: "1px solid rgba(99,102,241,.35)",
          borderRadius: 100, padding: "6px 16px", marginBottom: 20,
        }}>
          <MapPin size={14} color="#a5b4fc" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#a5b4fc", letterSpacing: ".06em", textTransform: "uppercase" }}>
            Dossier Spécial
          </span>
        </div>
        <h1 style={{
          fontSize: "clamp(28px,5vw,50px)", fontWeight: 900, color: "#fff",
          margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-.02em",
        }}>
          La géolocalisation dans<br />
          <span style={{ color: "#818cf8" }}>l'immobilier tunisien</span>
        </h1>
        <p style={{
          fontSize: 16, color: "rgba(255,255,255,.65)", maxWidth: 620,
          margin: "0 auto 36px", lineHeight: 1.75,
        }}>
          Pourquoi situer un bien sur une carte est devenu le critère n°1 des acheteurs —
          et comment Localizi.tn en fait son avantage différentiel.
        </p>
        <a href="/carte" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 14,
          padding: "13px 28px", borderRadius: 12, textDecoration: "none",
          boxShadow: "0 4px 20px rgba(99,102,241,.45)",
        }}>
          Explorer la carte interactive <ArrowRight size={16} />
        </a>
      </div>

      {/* ── Intro ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 0" }}>
        <p style={{ fontSize: 15.5, color: "#374151", lineHeight: 1.85, marginBottom: 16 }}>
          Que ce soit pour trouver un restaurant, une boutique ou un appartement, les internautes ont pris
          l'habitude de s'appuyer sur des cartes interactives. Airbnb, Booking, Google Maps… la cartographie
          est devenue le mode de navigation universel du digital. L'immobilier n'échappe pas à cette révolution —
          il en est même l'un des secteurs les plus concernés, puisque <strong>l'emplacement est, de loin, le
          critère d°1 dans tout projet immobilier</strong>.
        </p>
        <p style={{ fontSize: 15.5, color: "#374151", lineHeight: 1.85, marginBottom: 0 }}>
          En Tunisie, cette transformation est en cours. Localizi.tn a fait le choix de placer la carte au
          cœur de l'expérience — pour les acheteurs, les locataires, mais aussi pour tous les professionnels
          qui souhaitent maximiser la visibilité de leurs biens.
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{ maxWidth: 1060, margin: "56px auto 0", padding: "0 24px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20,
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16,
              padding: "28px 22px", textAlign: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#6366f1", lineHeight: 1, marginBottom: 10 }}>
                {s.val}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
          Source : étude SeLoger / OpinionWay sur les attentes des internautes immobiliers
        </p>
      </div>

      {/* ── Section 1 : Enjeux ── */}
      <div style={{ maxWidth: 860, margin: "64px auto 0", padding: "0 24px" }}>
        <span style={{
          display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em",
          textTransform: "uppercase", color: "#6366f1", marginBottom: 10,
        }}>Les enjeux</span>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 800, color: "#0f172a", margin: "0 0 32px", lineHeight: 1.2 }}>
          Pourquoi la géolocalisation change tout pour votre annonce
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {AVANTAGES.map((a, i) => (
            <div key={i} style={{
              background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16,
              padding: "24px 22px", boxShadow: "0 2px 10px rgba(0,0,0,.05)",
              transition: "transform .2s, box-shadow .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.05)"; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "#eef2ff", color: "#6366f1",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>{a.icon}</div>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{a.title}</h3>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7, margin: 0 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Encart chiffre clé ── */}
      <div style={{ maxWidth: 860, margin: "56px auto 0", padding: "0 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          borderRadius: 18, padding: "36px 40px",
          display: "flex", alignItems: "flex-start", gap: 24,
        }}>
          <div style={{
            background: "rgba(99,102,241,.25)", borderRadius: 12,
            padding: 14, flexShrink: 0,
          }}>
            <TrendingUp size={28} color="#a5b4fc" />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px", lineHeight: 1.3 }}>
              « Une annonce immobilière géolocalisée génère <span style={{ color: "#a5b4fc" }}>5 fois plus de contacts</span> qu'une annonce classique. »
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.55)", margin: 0 }}>
              Témoignage de professionnels immobiliers recueillis après déploiement de la géolocalisation sur SeLoger
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2 : Exemples internationaux ── */}
      <div style={{ maxWidth: 860, margin: "64px auto 0", padding: "0 24px" }}>
        <span style={{
          display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em",
          textTransform: "uppercase", color: "#6366f1", marginBottom: 10,
        }}>Références internationales</span>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.2 }}>
          5 exemples qui ont fait de la carte leur marque de fabrique
        </h2>
        <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 32 }}>
          Dans tous les marchés immobiliers matures, la recherche par carte est devenue la norme.
          Voici ce dont Localizi.tn s'est inspirée.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {EXEMPLES.map((e, i) => (
            <div key={i} style={{
              background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14,
              padding: "22px 24px", display: "flex", alignItems: "flex-start", gap: 18,
              boxShadow: "0 2px 8px rgba(0,0,0,.04)",
            }}>
              <div style={{
                minWidth: 48, height: 48, borderRadius: 10,
                background: `${e.color}18`, border: `2px solid ${e.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Globe size={20} style={{ color: e.color }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{e.site}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: e.color,
                    background: `${e.color}15`, padding: "2px 8px", borderRadius: 100,
                  }}>{e.pays}</span>
                </div>
                <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, margin: 0 }}>{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3 : Avantages vs Inconvénients ── */}
      <div style={{ maxWidth: 860, margin: "64px auto 0", padding: "0 24px" }}>
        <span style={{
          display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em",
          textTransform: "uppercase", color: "#6366f1", marginBottom: 10,
        }}>Avantages & Précautions</span>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 800, color: "#0f172a", margin: "0 0 28px", lineHeight: 1.2 }}>
          Faut-il géolocaliser tous ses biens ?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Pour */}
          <div style={{
            background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 16, padding: "24px",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#15803d", display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
              <CheckCircle size={18} color="#22c55e" /> Oui, géolocalisez
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Les biens dont la situation est un atout (vue, calme, accès)",
                "Tous les biens en mandat exclusif",
                "Les biens proches d'écoles, de commerces ou de transports",
                "Les biens dans des quartiers recherchés ou en développement",
                "Les biens neufs ou récemment rénovés",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 13.5, color: "#166534", display: "flex", gap: 8, lineHeight: 1.5 }}>
                  <span style={{ color: "#22c55e", flexShrink: 0, marginTop: 2 }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Précautions */}
          <div style={{
            background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 16, padding: "24px",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#92400e", display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
              <AlertCircle size={18} color="#f59e0b" /> Géolocalisez partiellement
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Les biens dont l'adresse exacte peut révéler un contexte défavorable",
                "Les propriétaires qui préfèrent ne pas divulguer leur adresse précise",
                "Les biens dans des zones où la concurrence entre agences est très forte",
                "Les biens stratégiques pour générer du contact entrant",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 13.5, color: "#78350f", display: "flex", gap: 8, lineHeight: 1.5 }}>
                  <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }}>→</span> {item}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 12.5, color: "#92400e", marginTop: 14, marginBottom: 0, fontStyle: "italic" }}>
              Même partielle, la géolocalisation (au quartier ou à la délégation) reste bien meilleure qu'aucune localisation.
            </p>
          </div>
        </div>
      </div>

      {/* ── Comment Localizi.tn gère la géolocalisation ── */}
      <div style={{ maxWidth: 860, margin: "64px auto 0", padding: "0 24px" }}>
        <div style={{
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 18,
          padding: "36px 36px", boxShadow: "0 4px 20px rgba(0,0,0,.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg,#6366f1,#818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(99,102,241,.35)",
            }}>
              <Building2 size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Notre approche
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Comment Localizi.tn gère la géolocalisation
              </h2>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { step: "1", title: "Gouvernorat & délégation", desc: "Lors de la publication, chaque annonce est associée à un gouvernorat et une délégation. Ces données sont utilisées pour les filtres de recherche et le positionnement sur la carte." },
              { step: "2", title: "Localité précise (optionnel)", desc: "Le propriétaire peut choisir d'indiquer une localité précise pour affiner la position du bien sur la carte, tout en gardant la maîtrise du niveau de précision affiché." },
              { step: "3", title: "Carte interactive couvrant toute la Tunisie", desc: "Tous les 24 gouvernorats sont couverts. Les visiteurs peuvent zoomer jusqu'à la délégation et consulter le contexte géographique de chaque bien : routes, zones résidentielles, points d'intérêt." },
              { step: "4", title: "Alertes géolocalisées", desc: "Les utilisateurs peuvent enregistrer des alertes basées sur une zone géographique précise. Dès qu'un bien correspondant à leurs critères est publié dans cette zone, ils reçoivent une notification automatique." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{
                  minWidth: 32, height: 32, borderRadius: "50%",
                  background: "#eef2ff", color: "#6366f1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 860, margin: "64px auto 0", padding: "0 24px" }}>
        <span style={{
          display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em",
          textTransform: "uppercase", color: "#6366f1", marginBottom: 10,
        }}>Questions fréquentes</span>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 800, color: "#0f172a", margin: "0 0 24px", lineHeight: 1.2 }}>
          Vos questions sur la géolocalisation
        </h2>
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: "4px 28px 8px" }}>
          {FAQS.map((item, i) => <FAQItem key={i} {...item} />)}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ maxWidth: 860, margin: "56px auto 80px", padding: "0 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, #4f46e5, #6366f1, #818cf8)",
          borderRadius: 20, padding: "48px 40px", textAlign: "center",
          boxShadow: "0 8px 32px rgba(99,102,241,.4)",
        }}>
          <h2 style={{ fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 900, color: "#fff", margin: "0 0 12px" }}>
            Votre bien mérite d'être trouvé
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", margin: "0 0 32px", lineHeight: 1.7 }}>
            Publiez votre annonce sur Localizi.tn, géolocalisez-la en quelques clics
            et touchez les acheteurs qui cherchent exactement dans votre zone — gratuitement.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/carte" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", color: "#4f46e5", fontWeight: 800, fontSize: 14,
              padding: "12px 26px", borderRadius: 12, textDecoration: "none",
            }}>
              <MapPin size={16} /> Explorer la carte
            </a>
            <a href="/creer_annonce" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,.15)", color: "#fff", fontWeight: 700, fontSize: 14,
              padding: "12px 26px", borderRadius: 12, textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,.3)",
            }}>
              Publier une annonce <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
