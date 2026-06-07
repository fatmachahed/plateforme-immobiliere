import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Zap, CheckCircle, TrendingUp,
  MapPin, Eye, Crown, ArrowRight, X, Check
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PLANS = [
  {
    id: "gratuit",
    name: "Gratuit",
    price: 0,
    period: "",
    color: "#475569",
    accent: "var(--bg)",
    badge: null,
    features: [
      "5 annonces actives",
      "Photos : 5 par annonce",
      "Apparition standard dans les résultats",
      "Contact par formulaire",
      "Durée : 30 jours/annonce",
    ],
    limits: [
      "Pas de mise en avant",
      "Pas de statistiques",
      "Pas de punaise boostée sur la carte",
    ],
    cta: "Commencer gratuitement",
    ctaStyle: "btn btn-ghost btn-full",
  },
  {
    id: "standard",
    name: "Standard",
    price: 19,
    period: "/ mois",
    color: "var(--primary)",
    accent: "var(--primary-light)",
    badge: null,
    features: [
      "20 annonces actives",
      "Photos : 15 par annonce",
      "Apparition en haut de liste (zone Standard)",
      "Punaise colorée sur la carte",
      "Durée : 60 jours/annonce",
      "Statistiques de base (vues)",
      "Support email",
    ],
    limits: [],
    cta: "Choisir Standard",
    ctaStyle: "btn btn-outline btn-full",
  },
  {
    id: "premium",
    name: "Premium",
    price: 49,
    period: "/ mois",
    color: "var(--gold)",
    accent: "var(--gold-light)",
    badge: "POPULAIRE",
    popular: true,
    features: [
      "Annonces illimitées",
      "Photos : 30 par annonce",
      "Apparition prioritaire dans tous les résultats",
      "Punaise dorée sur la carte (visible de loin)",
      "Durée illimitée",
      "Statistiques avancées (vues, clics, contacts)",
      "Mise en avant sur la page d'accueil",
      "Badge vérifié sur votre profil",
      "Support prioritaire 7j/7",
    ],
    limits: [],
    cta: "Choisir Premium",
    ctaStyle: "btn btn-gold btn-full",
  },
  {
    id: "boost",
    name: "Boost Unique",
    price: 9,
    period: "/ annonce",
    color: "var(--boost)",
    accent: "var(--boost-light)",
    badge: "COUP DE POUCE",
    features: [
      "1 annonce poussée en 1ère position",
      "Punaise BOOST orange sur la carte (très visible)",
      "Mise en avant pendant 7 jours",
      "Icône ⚡ sur la carte et dans la liste",
      "Sans abonnement requis",
    ],
    limits: [],
    cta: "Booster une annonce",
    ctaStyle: "btn btn-full",
    ctaCustom: { background: "var(--boost)", color: "white" },
  },
];

const FAQ = [
  { q: "Comment fonctionne le boost ?", a: "Lorsque vous boostez une annonce, elle apparaît en 1ère position dans les résultats de recherche ET sa punaise est mise en avant (orange vif) sur la carte. Les autres utilisateurs la voient immédiatement." },
  { q: "Puis-je annuler mon abonnement ?", a: "Oui, à tout moment. L'abonnement restera actif jusqu'à la fin de la période payée." },
  { q: "Les annonces gratuites apparaissent-elles sur la carte ?", a: "Oui, mais avec une punaise standard. Les annonces boostées ont une punaise plus grande et colorée." },
  { q: "Comment payer ?", a: "Paiement par carte bancaire, virement, ou paiement en cash via nos partenaires (Postnet, etc.) selon votre région." },
];

/* ── Punaises de démo pour la comparaison ── */
const COMPARE_PINS = [
  { lat: 36.879, lng: 10.325, level: "boost",    label: "⚡ 850k" },
  { lat: 34.750, lng: 10.770, level: "premium",  label: "★ 320k" },
  { lat: 35.870, lng: 10.590, level: "standard", label: "180k"   },
  { lat: 36.400, lng: 10.620, level: "free",     label: "280k"   },
  { lat: 34.422, lng:  8.774, level: "free",     label: "95k"    },
];

const PIN_STYLE = {
  boost:    { bg: "#ea580c", size: "15px", pad: "8px 15px" },
  premium:  { bg: "#f59e0b", size: "14px", pad: "7px 13px" },
  standard: { bg: "#6366f1", size: "13px", pad: "6px 11px" },
  free:     { bg: "#64748b", size: "12px", pad: "5px 10px" },
};

function ComparisonMap() {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [34.5, 9.2],
        zoom: 6,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      COMPARE_PINS.forEach(p => {
        const s = PIN_STYLE[p.level];
        const html = `
          <div style="
            background:${s.bg}; color:#fff;
            font-size:${s.size}; font-weight:800;
            padding:${s.pad}; border-radius:20px;
            box-shadow:0 3px 12px rgba(0,0,0,.3);
            white-space:nowrap; display:inline-flex; align-items:center;
            font-family:'Plus Jakarta Sans',system-ui,sans-serif;
            border:2px solid rgba(255,255,255,.4);
            letter-spacing:-.3px;
          ">${p.label} <small style="font-size:9px;opacity:.75;margin-left:2px">DT</small></div>`;
        const icon = L.divIcon({ className: "", html, iconSize: null, iconAnchor: [0, 0] });
        L.marker([p.lat, p.lng], { icon }).addTo(map);
      });
    })();
    return () => { live = false; };
  }, []);

  return (
    <div ref={containerRef} style={{
      height: 300, width: "100%",
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,.1)",
      border: "1px solid #e2e8f0",
    }}/>
  );
}

function PlanCard({ plan, yearly, selected, onSelect }) {
  const annualPrice  = Math.round(plan.price * 0.8);
  const displayPrice = yearly && plan.price > 0 ? annualPrice : plan.price;

  return (
    <div
      className={`sub-card${selected ? " sub-card--selected" : ""}${plan.popular ? " sub-card--popular" : ""}`}
      style={{ "--plan-color": plan.color }}
      onClick={onSelect}
    >
      {/* Top colour bar */}
      <div className="sub-card__bar" style={{ background: plan.color }} />

      {/* Badge */}
      {plan.badge && (
        <div className="sub-card__badge" style={{ background: plan.color }}>
          {plan.badge}
        </div>
      )}

      {/* Selected checkmark */}
      {selected && (
        <div className="sub-card__sel-mark" style={{ background: plan.color }}>
          <Check size={13} strokeWidth={3} />
        </div>
      )}

      {/* Header */}
      <div className="sub-card__header">
        <p className="sub-card__name" style={{ color: plan.color }}>{plan.name}</p>
        <div className="sub-card__price-wrap">
          {plan.price > 0 ? (
            <>
              <span className="sub-card__price">{displayPrice}</span>
              <span className="sub-card__period"> DT{plan.period}</span>
              {yearly && (
                <span className="sub-card__discount">−20%</span>
              )}
            </>
          ) : (
            <span className="sub-card__price">Gratuit</span>
          )}
        </div>
        {plan.price > 0 && (
          <p className="sub-card__billed">
            {yearly ? "Facturé annuellement" : "Facturé mensuellement"}
          </p>
        )}
      </div>

      {/* Features */}
      <div className="sub-card__body">
        <ul className="sub-card__features">
          {plan.features.map((f) => (
            <li key={f}>
              <CheckCircle size={14} style={{ color: plan.color, flexShrink: 0 }} />
              <span>{f}</span>
            </li>
          ))}
          {plan.limits.map((l) => (
            <li key={l} className="sub-card__limit">
              <X size={14} style={{ color: "#cbd5e1", flexShrink: 0 }} />
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="sub-card__footer">
        <button
          className="sub-card__cta"
          style={selected ? { background: plan.color, color: "#fff", borderColor: plan.color } : {}}
          onClick={(e) => { e.stopPropagation(); onSelect(); alert(`Abonnement ${plan.name} — Intégration paiement à configurer`); }}
        >
          {selected ? <><Check size={15}/> Sélectionné</> : <>{plan.cta} <ArrowRight size={15}/></>}
        </button>
      </div>
    </div>
  );
}

export default function Abonnements() {
  const [yearly,      setYearly]      = useState(false);
  const [openFaq,     setOpenFaq]     = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("premium");

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="sub-hero">
        <div className="sub-hero__bg" />
        <div className="container text-center" style={{ position: "relative", zIndex: 2, padding: "80px 24px 64px" }}>
          <span className="section-eyebrow" style={{ color: "#93c5fd" }}>Abonnements</span>
          <h1 style={{ color: "white", marginBottom: 16 }}>
            Boostez votre visibilité <span style={{ color: "var(--gold)" }}>et vendez plus vite</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 18, maxWidth: 540, margin: "0 auto 32px" }}>
            Choisissez le plan qui correspond à vos besoins et apparaissez en premier dans les résultats et sur la carte.
          </p>

          {/* Toggle annual/monthly */}
          <div className="sub-toggle">
            <span style={{ color: "rgba(255,255,255,.75)", fontSize: 14 }}>Mensuel</span>
            <div className={`sub-toggle__switch${yearly ? " sub-toggle__switch--on" : ""}`} onClick={() => setYearly(!yearly)}>
              <div className="sub-toggle__thumb" />
            </div>
            <span style={{ color: "rgba(255,255,255,.75)", fontSize: 14 }}>
              Annuel <span style={{ color: "var(--gold)", fontWeight: 700 }}>−20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="section" style={{ marginTop: -40 }}>
        <div className="container">
          <div className="sub-grid">
            {PLANS.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                yearly={yearly}
                selected={selectedPlan === p.id}
                onSelect={() => setSelectedPlan(p.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How boost works */}
      <section className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Fonctionnement</span>
            <h2>Comment fonctionne le boost ?</h2>
          </div>
          <div className="sub-how">
            {[
              { icon: <Zap size={28} />, num: "01", title: "Choisissez une annonce", desc: "Sélectionnez l'annonce que vous souhaitez propulser en tête de liste." },
              { icon: <TrendingUp size={28} />, num: "02", title: "Payez le boost", desc: "9 DT pour 7 jours de visibilité maximale, sans engagement d'abonnement." },
              { icon: <MapPin size={28} />, num: "03", title: "Punaise ⚡ sur la carte", desc: "Votre bien apparaît avec une punaise orange visible qui attire l'œil sur la carte." },
              { icon: <Eye size={28} />, num: "04", title: "Recevez plus de contacts", desc: "Les annonces boostées reçoivent en moyenne 5× plus de vues et 3× plus de contacts." },
            ].map((s) => (
              <div key={s.num} className="sub-step">
                <div className="sub-step__num">{s.num}</div>
                <div className="sub-step__icon">{s.icon}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Comparaison</span>
            <h2>Visibilité sur la carte selon votre plan</h2>
          </div>
          <div className="sub-map-compare">
            <div className="sub-map-compare__visual">
              <ComparisonMap />
            </div>
            <div className="sub-map-compare__legend">
              {[
                { cls: "sub-pin--boost",    label: "BOOST", desc: "Punaise orange vif, taille XXL, icône ⚡", price: "9 DT / annonce" },
                { cls: "sub-pin--premium",  label: "PREMIUM", desc: "Punaise dorée, taille XL, étoile ★", price: "49 DT / mois" },
                { cls: "sub-pin--standard", label: "STANDARD", desc: "Punaise bleue, taille normale", price: "19 DT / mois" },
                { cls: "sub-pin--free",     label: "Gratuit", desc: "Punaise grise standard", price: "Gratuit" },
              ].map((l) => (
                <div key={l.label} className="sub-legend-item">
                  <div className={`sub-legend-pin ${l.cls}`}>{l.label}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{l.desc}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{l.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ background: "var(--bg)" }}>
        <div className="container-sm">
          <div className="section-header">
            <span className="section-eyebrow">FAQ</span>
            <h2>Questions fréquentes</h2>
          </div>
          <div className="sub-faq">
            {FAQ.map((f, i) => (
              <div key={i} className={`sub-faq__item${openFaq === i ? " open" : ""}`}>
                <button className="sub-faq__q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="sub-faq__arrow">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <p className="sub-faq__a">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="section text-center" style={{ background: "linear-gradient(135deg, #0a1628, #0e2a58)" }}>
        <div className="container-sm">
          <Crown size={44} style={{ color: "var(--gold)", margin: "0 auto 16px" }} />
          <h2 style={{ color: "white", marginBottom: 12 }}>Prêt à booster vos annonces ?</h2>
          <p style={{ color: "rgba(255,255,255,.7)", marginBottom: 32, fontSize: 16 }}>Commencez gratuitement, upgradez quand vous voulez.</p>
          <div className="flex-center gap-16">
            <Link to="/creer_annonce" className="btn btn-gold btn-lg btn-round">
              <Zap size={17} /> Publier et booster
            </Link>
            <Link to="/carte" className="btn btn-lg btn-round" style={{ background: "rgba(255,255,255,.12)", color: "white", border: "1.5px solid rgba(255,255,255,.25)" }}>
              Voir la carte <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .sub-hero {
          position: relative;
          background: linear-gradient(135deg, #0a1628, #0e2a58);
        }
        .sub-hero__bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 60% 40%, rgba(0,106,255,.2) 0%, transparent 70%);
        }

        /* Toggle */
        .sub-toggle { display: flex; align-items: center; gap: 12px; justify-content: center; }
        .sub-toggle__switch {
          width: 48px; height: 26px; background: rgba(255,255,255,.2);
          border-radius: var(--r-full); padding: 3px; cursor: pointer;
          transition: background .2s; position: relative;
        }
        .sub-toggle__switch--on { background: var(--gold); }
        .sub-toggle__thumb {
          width: 20px; height: 20px; background: white;
          border-radius: 50%; transition: transform .2s;
        }
        .sub-toggle__switch--on .sub-toggle__thumb { transform: translateX(22px); }

        /* Plans grid */
        .sub-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: stretch;
        }
        .sub-card {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: transform .2s, box-shadow .2s, border-color .2s;
        }
        .sub-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(0,0,0,.1);
          border-color: var(--plan-color);
        }
        .sub-card--selected {
          border-color: var(--plan-color);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--plan-color) 18%, transparent),
                      0 10px 32px rgba(0,0,0,.12);
        }
        .sub-card--selected:hover { transform: translateY(-3px); }

        /* Top colour bar */
        .sub-card__bar {
          height: 5px;
          width: 100%;
          flex-shrink: 0;
        }

        /* Badge (POPULAIRE / COUP DE POUCE) */
        .sub-card__badge {
          display: inline-block;
          margin: 14px 20px 0;
          padding: 3px 12px;
          border-radius: 999px;
          color: white;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          width: fit-content;
        }

        /* Selected check mark */
        .sub-card__sel-mark {
          position: absolute;
          top: 16px; right: 16px;
          width: 26px; height: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,.2);
        }

        /* Header */
        .sub-card__header { padding: 16px 24px 18px; }
        .sub-card__name {
          font-size: 13px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 1.2px;
          margin-bottom: 10px;
        }
        .sub-card__price-wrap { display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
        .sub-card__price { font-size: 38px; font-weight: 900; color: var(--text-primary); line-height: 1; }
        .sub-card__period { font-size: 13px; color: var(--text-muted); }
        .sub-card__discount {
          padding: 2px 8px; background: var(--success-light); color: var(--success);
          border-radius: var(--r-full); font-size: 11px; font-weight: 700; margin-left: 4px;
        }
        .sub-card__billed { font-size: 11.5px; color: var(--text-muted); margin-top: 5px; }

        /* Body grows to fill height */
        .sub-card__body { padding: 4px 24px 20px; flex: 1; }
        .sub-card__features { display: flex; flex-direction: column; gap: 9px; }
        .sub-card__features li, .sub-card__limit {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 13.5px; color: var(--text-secondary); line-height: 1.4;
        }
        .sub-card__features li span, .sub-card__limit span { flex: 1; }
        .sub-card__limit span { color: var(--text-muted); }

        /* CTA button */
        .sub-card__footer { padding: 16px 24px 24px; }
        .sub-card__cta {
          width: 100%; padding: 12px 20px;
          border-radius: 12px;
          border: 2px solid var(--plan-color);
          background: transparent;
          color: var(--plan-color);
          font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: background .15s, color .15s, transform .1s, box-shadow .15s;
        }
        .sub-card__cta:hover {
          background: var(--plan-color);
          color: #fff;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--plan-color) 35%, transparent);
          transform: translateY(-1px);
        }

        /* How it works */
        .sub-how {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
        }
        .sub-step { text-align: center; position: relative; }
        .sub-step__num {
          font-size: 52px; font-weight: 900;
          color: var(--primary-light); line-height: 1;
          margin-bottom: -8px;
        }
        .sub-step__icon {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--primary-light); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .sub-step h4 { margin-bottom: 8px; }
        .sub-step p  { font-size: 14px; }

        /* Map comparison */
        .sub-map-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .sub-map-compare__legend { display: flex; flex-direction: column; gap: 16px; }
        .sub-legend-item { display: flex; align-items: center; gap: 14px; }
        .sub-legend-pin {
          padding: 6px 14px; border-radius: var(--r-full);
          font-size: 12px; font-weight: 800; white-space: nowrap;
          color: #fff; letter-spacing: .3px;
        }
        .sub-pin--boost    { background: #ea580c; }
        .sub-pin--premium  { background: #f59e0b; }
        .sub-pin--standard { background: #6366f1; }
        .sub-pin--free     { background: #64748b; }

        /* FAQ */
        .sub-faq { display: flex; flex-direction: column; gap: 2px; }
        .sub-faq__item { border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; margin-bottom: 8px; }
        .sub-faq__item.open { border-color: var(--primary); }
        .sub-faq__q {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; font-size: 15px; font-weight: 600;
          color: var(--text-primary); background: var(--surface); text-align: left;
          transition: background .15s;
        }
        .sub-faq__q:hover { background: var(--bg); }
        .sub-faq__arrow { font-size: 20px; color: var(--primary); }
        .sub-faq__a { padding: 0 20px 18px; font-size: 14px; color: var(--text-secondary); }

        @media (max-width: 1100px) {
          .sub-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .sub-how { grid-template-columns: repeat(2, 1fr); }
          .sub-map-compare { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .sub-grid { grid-template-columns: 1fr; }
          .sub-how  { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
