import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Zap, Star, Crown, Check, Lock, Shield, CreditCard,
  ChevronRight, ArrowLeft, Sparkles, TrendingUp, Eye,
  Building2, MapPin, X, CheckCircle2, AlertCircle
} from "lucide-react";


/* ── Plans ── */
const PLANS = [
  {
    id: "essentiel", name: "Essentiel", price: 5, color: "#6366f1", lightColor: "#eef2ff",
    icon: <Zap size={20}/>,
    features: ["Badge « Boosté »", "Priorité dans les résultats", "Statistiques de base"],
  },
  {
    id: "premium", name: "Premium", price: 8, color: "#f59e0b", lightColor: "#fffbeb",
    popular: true,
    icon: <Star size={20}/>,
    features: ["Tout l'Essentiel", "Top des résultats", "Badge Premium doré", "Mise en avant sur la carte", "Statistiques avancées"],
  },
  {
    id: "star", name: "Star", price: 12, color: "#8b5cf6", lightColor: "#f5f3ff",
    icon: <Crown size={20}/>,
    features: ["Tout le Premium", "Position #1 garantie", "Badge exclusif", "Analytics complets", "Support prioritaire 24/7"],
  },
];

/* ── Payment form ── */
function PaymentModal({ plan, annonces, total, onClose, onSuccess }) {
  const [step, setStep]         = useState("form"); // form | processing | success
  const [card, setCard]         = useState({ num: "", name: "", exp: "", cvv: "" });
  const [errors, setErrors]     = useState({});
  const [cardType, setCardType] = useState("");

  const detectCard = (num) => {
    const n = num.replace(/\s/g, "");
    if (/^4/.test(n))      return "visa";
    if (/^5[1-5]/.test(n)) return "mastercard";
    return "";
  };

  const formatCardNum = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExp = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const validate = () => {
    const e = {};
    if (card.num.replace(/\s/g, "").length < 16) e.num = "Numéro invalide";
    if (!card.name.trim()) e.name = "Requis";
    if (card.exp.length < 5) e.exp = "Date invalide";
    if (card.cvv.length < 3) e.cvv = "CVV invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setStep("processing");
    setTimeout(() => setStep("success"), 2200);
  };

  if (step === "success") return (
    <div className="bst-modal-bg" onClick={onClose}>
      <div className="bst-modal bst-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="bst-success">
          <div className="bst-success__anim">
            <div className="bst-success__ring"/>
            <CheckCircle2 size={48} color="#16a34a"/>
          </div>
          <h2 className="bst-success__title">Paiement confirmé !</h2>
          <p className="bst-success__sub">
            Vos <strong>{annonces.length} annonce{annonces.length > 1 ? "s" : ""}</strong> sont maintenant boostées
            avec le plan <strong>{plan.name}</strong>.
          </p>
          <div className="bst-success__recap">
            <span>Plan {plan.name}</span>
            <span className="bst-success__total">{total} DT / mois</span>
          </div>
          <button className="bst-success__btn" onClick={() => { onSuccess(); onClose(); }}>
            Voir mes annonces <ChevronRight size={16}/>
          </button>
        </div>
      </div>
    </div>
  );

  if (step === "processing") return (
    <div className="bst-modal-bg">
      <div className="bst-modal bst-modal--sm">
        <div className="bst-processing">
          <div className="bst-processing__spinner"/>
          <p>Traitement du paiement…</p>
          <small>Ne fermez pas cette fenêtre</small>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bst-modal-bg" onClick={onClose}>
      <div className="bst-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bst-modal__head">
          <div className="bst-modal__head-left">
            <div className="bst-modal__lock"><Lock size={16}/></div>
            <div>
              <div className="bst-modal__title">Paiement sécurisé</div>
              <div className="bst-modal__sub">SSL 256-bit · Données cryptées</div>
            </div>
          </div>
          <button className="bst-modal__close" onClick={onClose}><X size={18}/></button>
        </div>

        <div className="bst-modal__body">

          {/* Récapitulatif */}
          <div className="bst-recap">
            <div className="bst-recap__plan" style={{ background: plan.lightColor, borderColor: plan.color + "40" }}>
              <span style={{ color: plan.color }}>{plan.icon}</span>
              <div>
                <div className="bst-recap__plan-name">Plan {plan.name}</div>
                <div className="bst-recap__plan-detail">{plan.price} DT × {annonces.length} annonce{annonces.length > 1 ? "s" : ""}</div>
              </div>
              <div className="bst-recap__plan-total" style={{ color: plan.color }}>{total} DT<span>/mois</span></div>
            </div>
          </div>

          {/* Card logos */}
          <div className="bst-card-logos">
            <div className={`bst-card-logo${cardType === "visa" ? " bst-card-logo--active" : ""}`}>
              <svg viewBox="0 0 48 16" width="48" height="16"><text x="0" y="13" fontFamily="serif" fontWeight="900" fontSize="14" fill="#1a1f71">VISA</text></svg>
            </div>
            <div className={`bst-card-logo${cardType === "mastercard" ? " bst-card-logo--active" : ""}`}>
              <svg viewBox="0 0 36 24" width="36" height="24">
                <circle cx="14" cy="12" r="10" fill="#eb001b" opacity=".9"/>
                <circle cx="22" cy="12" r="10" fill="#f79e1b" opacity=".9"/>
                <path d="M18 5.5A10 10 0 0122 12a10 10 0 01-4 6.5A10 10 0 0114 12a10 10 0 014-6.5z" fill="#ff5f00"/>
              </svg>
            </div>
          </div>

          {/* Form */}
          <div className="bst-form">
            <div className="bst-form__group">
              <label className="bst-form__label">Numéro de carte</label>
              <div className={`bst-form__card-wrap${errors.num ? " bst-form__input--err" : ""}`}>
                <CreditCard size={16} className="bst-form__card-ico"/>
                <input
                  className="bst-form__input bst-form__input--card"
                  placeholder="0000 0000 0000 0000"
                  value={card.num}
                  maxLength={19}
                  onChange={e => {
                    const f = formatCardNum(e.target.value);
                    setCard(p => ({ ...p, num: f }));
                    setCardType(detectCard(f));
                    setErrors(p => ({ ...p, num: "" }));
                  }}
                />
                {cardType === "visa" && <span className="bst-form__card-type">VISA</span>}
                {cardType === "mastercard" && <span className="bst-form__card-type bst-form__card-type--mc">MC</span>}
              </div>
              {errors.num && <span className="bst-form__err">{errors.num}</span>}
            </div>

            <div className="bst-form__group">
              <label className="bst-form__label">Titulaire de la carte</label>
              <input
                className={`bst-form__input${errors.name ? " bst-form__input--err" : ""}`}
                placeholder="NOM PRÉNOM"
                value={card.name}
                onChange={e => { setCard(p => ({ ...p, name: e.target.value.toUpperCase() })); setErrors(p => ({ ...p, name: "" })); }}
                style={{ textTransform: "uppercase" }}
              />
              {errors.name && <span className="bst-form__err">{errors.name}</span>}
            </div>

            <div className="bst-form__row">
              <div className="bst-form__group">
                <label className="bst-form__label">Expiration</label>
                <input
                  className={`bst-form__input${errors.exp ? " bst-form__input--err" : ""}`}
                  placeholder="MM/AA"
                  value={card.exp}
                  maxLength={5}
                  onChange={e => { setCard(p => ({ ...p, exp: formatExp(e.target.value) })); setErrors(p => ({ ...p, exp: "" })); }}
                />
                {errors.exp && <span className="bst-form__err">{errors.exp}</span>}
              </div>
              <div className="bst-form__group">
                <label className="bst-form__label">CVV</label>
                <input
                  className={`bst-form__input${errors.cvv ? " bst-form__input--err" : ""}`}
                  placeholder="•••"
                  value={card.cvv}
                  maxLength={4}
                  type="password"
                  onChange={e => { setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "") })); setErrors(p => ({ ...p, cvv: "" })); }}
                />
                {errors.cvv && <span className="bst-form__err">{errors.cvv}</span>}
              </div>
            </div>
          </div>

          {/* Pay button */}
          <button className="bst-pay-btn" style={{ background: plan.color }} onClick={handlePay}>
            <Lock size={15}/>
            Payer {total} DT / mois
          </button>

          {/* Security badges */}
          <div className="bst-security">
            <span><Shield size={12}/> Paiement sécurisé</span>
            <span><Lock size={12}/> SSL 256-bit</span>
            <span><CheckCircle2 size={12}/> Sans engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function BoosterPage() {
  const navigate  = useNavigate();
  const token     = localStorage.getItem("token");

  const [annonces,    setAnnonces]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedPlan,setSelectedPlan]= useState("premium");
  const [selected,    setSelected]    = useState(new Set());
  const [showPayment, setShowPayment] = useState(false);

  const plan = PLANS.find(p => p.id === selectedPlan);

  /* ── Active boost helpers ── */
  const isActiveBoost = (a) => {
    if (!a.boost || a.boost <= 0) return false;
    if (!a.boost_until) return false;
    return new Date(a.boost_until) > new Date();
  };

  const formatBoostUntil = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const boostDaysLeft = (dateStr) => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`\/annonces/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const pub = (Array.isArray(data) ? data : [])
          .filter(a => a.status === "approuvee")
          .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
        setAnnonces(pub);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    const boostable = annonces.filter(a => !isActiveBoost(a));
    const allBoostableSelected = boostable.length > 0 && boostable.every(a => selected.has(a.id));
    if (allBoostableSelected) setSelected(new Set());
    else setSelected(new Set(boostable.map(a => a.id)));
  };

  const total = useMemo(() => plan.price * selected.size, [plan, selected]);
  const selectedAnnonces = annonces.filter(a => selected.has(a.id));

  return (
    <>
      <Navbar/>
      <div className="bst-page">

        {/* ── Hero ── */}
        <div className="bst-hero">
          <div className="bst-hero__bg"/>
          <div className="bst-hero__inner">
            <button className="bst-hero__back" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16}/> Mes annonces
            </button>
            <div className="bst-hero__badge"><Sparkles size={13}/> Booster mes annonces</div>
            <h1 className="bst-hero__title">Donnez de la visibilité<br/>à vos biens</h1>
            <p className="bst-hero__sub">Choisissez une formule, sélectionnez vos annonces et passez au paiement en quelques clics.</p>
            <div className="bst-hero__stats">
              <div><strong>×8</strong><span>plus de vues</span></div>
              <div><strong>×3</strong><span>plus de contacts</span></div>
              <div><strong>#1</strong><span>position garantie</span></div>
            </div>
          </div>
        </div>

        <div className="bst-content">

          {/* ── STEP 1 — Plans ── */}
          <section className="bst-section">
            <div className="bst-section__head">
              <div className="bst-step-num">1</div>
              <div>
                <h2 className="bst-section__title">Choisissez votre formule</h2>
                <p className="bst-section__sub">Tarif par annonce et par mois</p>
              </div>
            </div>

            <div className="bst-plans">
              {PLANS.map(p => (
                <button
                  key={p.id}
                  className={`bst-plan${selectedPlan === p.id ? " bst-plan--on" : ""}${p.popular ? " bst-plan--popular" : ""}`}
                  style={selectedPlan === p.id ? { borderColor: p.color, boxShadow: `0 0 0 3px ${p.color}22` } : {}}
                  onClick={() => setSelectedPlan(p.id)}
                >
                  {p.popular && <div className="bst-plan__pop" style={{ background: p.color }}>⭐ Populaire</div>}
                  <div className="bst-plan__icon" style={{ background: p.lightColor, color: p.color }}>{p.icon}</div>
                  <div className="bst-plan__name">{p.name}</div>
                  <div className="bst-plan__price" style={{ color: selectedPlan === p.id ? p.color : "#0f172a" }}>
                    {p.price} <span>DT</span>
                  </div>
                  <div className="bst-plan__period">/ annonce / mois</div>
                  <ul className="bst-plan__features">
                    {p.features.map(f => (
                      <li key={f}><Check size={13} style={{ color: p.color }}/> {f}</li>
                    ))}
                  </ul>
                  <div className={`bst-plan__sel${selectedPlan === p.id ? " bst-plan__sel--on" : ""}`}
                    style={selectedPlan === p.id ? { background: p.color } : {}}>
                    {selectedPlan === p.id ? <Check size={14} color="#fff"/> : ""}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── STEP 2 — Annonces ── */}
          <section className="bst-section">
            <div className="bst-section__head">
              <div className="bst-step-num">2</div>
              <div>
                <h2 className="bst-section__title">Sélectionnez vos annonces</h2>
                <p className="bst-section__sub">
                  {annonces.length} annonce{annonces.length !== 1 ? "s" : ""} approuvée{annonces.length !== 1 ? "s" : ""}
                  {annonces.filter(a => isActiveBoost(a)).length > 0 && (
                    <span className="bst-active-count">
                      &nbsp;· {annonces.filter(a => isActiveBoost(a)).length} déjà boostée{annonces.filter(a => isActiveBoost(a)).length > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
              {annonces.filter(a => !isActiveBoost(a)).length > 0 && (
                <button className="bst-sel-all" onClick={toggleAll}>
                  {annonces.filter(a => !isActiveBoost(a)).every(a => selected.has(a.id))
                    ? "Tout désélectionner"
                    : "Tout sélectionner"}
                </button>
              )}
            </div>

            {loading ? (
              <div className="bst-empty"><div className="bst-spinner"/><p>Chargement…</p></div>
            ) : annonces.length === 0 ? (
              <div className="bst-empty">
                <AlertCircle size={40} strokeWidth={1.2}/>
                <p>Aucune annonce approuvée à booster.</p>
                <button className="bst-cta-outline" onClick={() => navigate("/creer_annonce")}>
                  Créer une annonce
                </button>
              </div>
            ) : (
              <div className="bst-grid">
                {annonces.map(a => {
                  const prop    = a.properties?.[0];
                  const on      = selected.has(a.id);
                  const boosted = isActiveBoost(a);
                  const img     = a.image_principale
                    ? `\/uploads/${a.image_principale}`
                    : null;
                  return (
                    <div
                      key={a.id}
                      className={`bst-card${boosted ? " bst-card--boosted" : on ? " bst-card--on" : ""}`}
                      style={(!boosted && on) ? { borderColor: plan.color, boxShadow: `0 0 0 2px ${plan.color}33` } : {}}
                      onClick={() => !boosted && toggleSelect(a.id)}
                    >
                      {/* Checkbox or lock */}
                      {boosted ? (
                        <div className="bst-card__check bst-card__check--locked">
                          <Lock size={11} color="#94a3b8"/>
                        </div>
                      ) : (
                        <div className="bst-card__check" style={on ? { background: plan.color, borderColor: plan.color } : {}}>
                          {on && <Check size={12} color="#fff" strokeWidth={3}/>}
                        </div>
                      )}

                      {/* Image */}
                      <div className="bst-card__img">
                        {img
                          ? <img src={img} alt={a.titre}/>
                          : <div className="bst-card__img-ph"><Building2 size={28} color="#cbd5e1"/></div>
                        }
                        {boosted ? (
                          <div className="bst-card__active-badge">
                            <Zap size={10}/> Actif · {boostDaysLeft(a.boost_until)}j restants
                          </div>
                        ) : on && (
                          <div className="bst-card__boost-tag" style={{ background: plan.color }}>
                            <Zap size={10}/> {plan.name}
                          </div>
                        )}
                        {boosted && <div className="bst-card__boosted-overlay"/>}
                      </div>

                      {/* Info */}
                      <div className="bst-card__body">
                        <div className="bst-card__type">{a.type_bien}</div>
                        <div className="bst-card__title">{a.titre}</div>
                        {prop?.address && (
                          <div className="bst-card__loc"><MapPin size={11}/> {prop.address}</div>
                        )}
                        <div className="bst-card__footer">
                          <span className="bst-card__price">
                            {a.prix ? `${Number(a.prix).toLocaleString()} ${a.devise}` : "—"}
                          </span>
                          {boosted ? (
                            <span className="bst-card__until">jusqu'au {formatBoostUntil(a.boost_until)}</span>
                          ) : (
                            <span className="bst-card__views"><Eye size={11}/> {a.views_count || 0}</span>
                          )}
                        </div>
                        {boosted && (
                          <div className="bst-card__boosted-msg">
                            <Lock size={10}/> Boost en cours — renouvelable le {formatBoostUntil(a.boost_until)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Sticky bottom bar ── */}
        {selected.size > 0 && (
          <div className="bst-sticky">
            <div className="bst-sticky__inner">
              <div className="bst-sticky__info">
                <div className="bst-sticky__sel">
                  <div className="bst-sticky__dot" style={{ background: plan.color }}/>
                  <strong>{selected.size}</strong> annonce{selected.size > 1 ? "s" : ""} · Plan {plan.name}
                </div>
                <div className="bst-sticky__detail">
                  {plan.price} DT × {selected.size} annonce{selected.size > 1 ? "s" : ""}
                </div>
              </div>
              <div className="bst-sticky__total">
                <span className="bst-sticky__total-lbl">Total mensuel</span>
                <span className="bst-sticky__total-val" style={{ color: plan.color }}>{total} DT<span>/mois</span></span>
              </div>
              <button
                className="bst-sticky__cta"
                style={{ background: plan.color }}
                onClick={() => setShowPayment(true)}
              >
                Passer au paiement <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}

        {/* ── Payment modal ── */}
        {showPayment && (
          <PaymentModal
            plan={plan}
            annonces={selectedAnnonces}
            total={total}
            onClose={() => setShowPayment(false)}
            onSuccess={() => navigate("/dashboard")}
          />
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .bst-page {
          min-height: 100vh; background: #f8fafc;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          padding-bottom: 120px;
        }

        /* ── Hero ── */
        .bst-hero {
          position: relative; overflow: hidden;
          background: #0f172a; padding: 60px 24px 52px;
        }
        .bst-hero__bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 70% 50%, #6366f122 0%, transparent 60%),
                      radial-gradient(ellipse at 20% 80%, #8b5cf611 0%, transparent 50%);
        }
        .bst-hero__inner {
          position: relative; max-width: 720px; margin: 0 auto;
        }
        .bst-hero__back {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
          color: #94a3b8; font-size: 13px; font-weight: 600;
          padding: 7px 14px; border-radius: 20px; cursor: pointer;
          font-family: inherit; margin-bottom: 20px; transition: background .15s;
        }
        .bst-hero__back:hover { background: rgba(255,255,255,.14); color: #fff; }
        .bst-hero__badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 20px;
          background: rgba(99,102,241,.2); border: 1px solid rgba(99,102,241,.3);
          color: #a5b4fc; font-size: 12px; font-weight: 700; margin-bottom: 16px;
        }
        .bst-hero__title {
          font-size: 38px; font-weight: 900; color: #fff;
          line-height: 1.15; margin-bottom: 14px;
        }
        .bst-hero__sub { font-size: 15px; color: #94a3b8; margin-bottom: 28px; line-height: 1.6; }
        .bst-hero__stats {
          display: flex; gap: 32px;
        }
        .bst-hero__stats div { display: flex; flex-direction: column; }
        .bst-hero__stats strong { font-size: 24px; font-weight: 900; color: #6366f1; }
        .bst-hero__stats span { font-size: 12px; color: #64748b; }

        /* ── Content ── */
        .bst-content { max-width: 1100px; margin: 0 auto; padding: 40px 24px 0; }

        /* ── Section ── */
        .bst-section { margin-bottom: 40px; }
        .bst-section__head {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .bst-step-num {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff; font-size: 15px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .bst-section__title { font-size: 20px; font-weight: 800; color: #0f172a; }
        .bst-section__sub { font-size: 13px; color: #94a3b8; margin-top: 2px; }
        .bst-sel-all {
          margin-left: auto; font-size: 13px; font-weight: 600; color: #6366f1;
          background: none; border: none; cursor: pointer; font-family: inherit;
          padding: 6px 12px; border-radius: 8px; transition: background .15s;
        }
        .bst-sel-all:hover { background: #eef2ff; }

        /* ── Plans ── */
        .bst-plans {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
        }
        .bst-plan {
          position: relative; display: flex; flex-direction: column; align-items: flex-start;
          padding: 24px 20px; border-radius: 16px; border: 2px solid #e5e7eb;
          background: #fff; cursor: pointer; font-family: inherit; text-align: left;
          transition: all .2s; gap: 6px;
        }
        .bst-plan:hover { border-color: #c7d2fe; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.07); }
        .bst-plan--on { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.1); }
        .bst-plan__pop {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700;
          color: #fff; white-space: nowrap;
        }
        .bst-plan__icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
        }
        .bst-plan__name { font-size: 15px; font-weight: 800; color: #0f172a; }
        .bst-plan__price { font-size: 32px; font-weight: 900; margin-top: 4px; }
        .bst-plan__price span { font-size: 14px; font-weight: 600; color: #64748b; }
        .bst-plan__period { font-size: 11.5px; color: #94a3b8; margin-top: -2px; margin-bottom: 12px; }
        .bst-plan__features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; width: 100%; }
        .bst-plan__features li { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #374151; }
        .bst-plan__sel {
          position: absolute; top: 16px; right: 16px;
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s;
        }

        .bst-active-count { color: #16a34a; font-weight: 700; }

        /* ── Annonce grid ── */
        .bst-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px;
        }
        .bst-card {
          background: #fff; border: 2px solid #e5e7eb; border-radius: 14px;
          cursor: pointer; transition: all .18s; overflow: hidden; position: relative;
        }
        .bst-card:hover { border-color: #c7d2fe; box-shadow: 0 4px 16px rgba(0,0,0,.07); }
        .bst-card--on { transform: translateY(-2px); }

        /* Boosted (already active) state */
        .bst-card--boosted {
          cursor: not-allowed;
          opacity: .72;
          border-color: #16a34a !important;
          box-shadow: 0 0 0 2px #bbf7d033 !important;
          background: #f0fdf4;
        }
        .bst-card--boosted:hover {
          transform: none;
          border-color: #16a34a !important;
          box-shadow: 0 0 0 2px #bbf7d033 !important;
        }
        .bst-card--boosted .bst-card__img img { filter: grayscale(25%); }
        .bst-card__boosted-overlay {
          position: absolute; inset: 0;
          background: rgba(240,253,244,.25);
          pointer-events: none;
        }
        .bst-card__active-badge {
          position: absolute; bottom: 8px; right: 8px;
          padding: 3px 9px; border-radius: 12px; font-size: 10px; font-weight: 700;
          color: #fff; background: #16a34a;
          display: flex; align-items: center; gap: 4px;
        }
        .bst-card__check--locked {
          background: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
        }
        .bst-card__until {
          font-size: 10.5px; color: #16a34a; font-weight: 700;
          display: flex; align-items: center; gap: 3px;
        }
        .bst-card__boosted-msg {
          margin-top: 6px; padding: 5px 8px;
          background: #dcfce7; border-radius: 6px;
          font-size: 10.5px; color: #15803d; font-weight: 600;
          display: flex; align-items: center; gap: 5px;
        }

        .bst-card__check {
          position: absolute; top: 10px; left: 10px; z-index: 2;
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid #e5e7eb; background: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .bst-card__img { height: 150px; overflow: hidden; position: relative; }
        .bst-card__img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
        .bst-card:hover .bst-card__img img { transform: scale(1.04); }
        .bst-card__img-ph {
          height: 100%; background: #f1f5f9;
          display: flex; align-items: center; justify-content: center;
        }
        .bst-card__boost-tag {
          position: absolute; bottom: 8px; right: 8px;
          padding: 3px 9px; border-radius: 12px; font-size: 10px; font-weight: 700;
          color: #fff; display: flex; align-items: center; gap: 4px;
        }
        .bst-card__body { padding: 12px 14px 14px; }
        .bst-card__type {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .05em; color: #6366f1; background: #eef2ff;
          padding: 2px 7px; border-radius: 5px; display: inline-block; margin-bottom: 6px;
        }
        .bst-card__title {
          font-size: 13.5px; font-weight: 700; color: #0f172a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;
        }
        .bst-card__loc {
          font-size: 11.5px; color: #94a3b8;
          display: flex; align-items: center; gap: 3px; margin-bottom: 8px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .bst-card__footer { display: flex; align-items: center; justify-content: space-between; }
        .bst-card__price { font-size: 13px; font-weight: 800; color: #0f172a; }
        .bst-card__views { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 3px; }

        /* ── Sticky bar ── */
        .bst-sticky {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          padding: 14px 24px; background: #fff;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -8px 32px rgba(0,0,0,.1);
          animation: stickyIn .25s cubic-bezier(.16,1,.3,1);
        }
        @keyframes stickyIn { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }
        .bst-sticky__inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .bst-sticky__info { flex: 1; min-width: 0; }
        .bst-sticky__sel {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: #0f172a;
        }
        .bst-sticky__dot { width: 10px; height: 10px; border-radius: 50%; }
        .bst-sticky__detail { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }
        .bst-sticky__total { text-align: right; }
        .bst-sticky__total-lbl { display: block; font-size: 11px; color: #94a3b8; font-weight: 600; }
        .bst-sticky__total-val { font-size: 26px; font-weight: 900; }
        .bst-sticky__total-val span { font-size: 13px; font-weight: 600; color: #94a3b8; }
        .bst-sticky__cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 12px; border: none;
          color: #fff; font-size: 15px; font-weight: 800;
          cursor: pointer; font-family: inherit; white-space: nowrap;
          transition: opacity .15s, transform .15s;
          box-shadow: 0 4px 16px rgba(0,0,0,.2);
        }
        .bst-sticky__cta:hover { opacity: .9; transform: translateY(-1px); }

        /* ── Empty / spinner ── */
        .bst-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 14px; padding: 60px 20px; color: #94a3b8; text-align: center;
        }
        .bst-spinner {
          width: 32px; height: 32px; border: 3px solid #e5e7eb;
          border-top-color: #6366f1; border-radius: 50%;
          animation: bstSpin .7s linear infinite;
        }
        @keyframes bstSpin { to { transform: rotate(360deg); } }
        .bst-cta-outline {
          padding: 9px 20px; border-radius: 9px; border: 1.5px solid #6366f1;
          background: none; color: #6366f1; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
        }

        /* ── Modal overlay ── */
        .bst-modal-bg {
          position: fixed; inset: 0; background: rgba(2,6,23,.6);
          backdrop-filter: blur(5px); z-index: 9000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: bstFade .2s ease;
        }
        @keyframes bstFade { from{opacity:0} to{opacity:1} }
        .bst-modal {
          background: #fff; border-radius: 20px;
          width: 100%; max-width: 460px;
          box-shadow: 0 32px 80px rgba(0,0,0,.3);
          animation: bstUp .25s cubic-bezier(.16,1,.3,1);
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .bst-modal--sm { max-width: 380px; }
        @keyframes bstUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }

        /* Modal head */
        .bst-modal__head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px; background: #0f172a;
        }
        .bst-modal__head-left { display: flex; align-items: center; gap: 12px; }
        .bst-modal__lock {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(99,102,241,.25); color: #a5b4fc;
          display: flex; align-items: center; justify-content: center;
        }
        .bst-modal__title { font-size: 15px; font-weight: 700; color: #fff; }
        .bst-modal__sub { font-size: 11.5px; color: #64748b; margin-top: 1px; }
        .bst-modal__close {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: rgba(255,255,255,.08); color: #64748b;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .15s;
        }
        .bst-modal__close:hover { background: rgba(255,255,255,.16); color: #fff; }

        /* Modal body */
        .bst-modal__body { padding: 24px 22px; display: flex; flex-direction: column; gap: 18px; }

        /* Recap */
        .bst-recap__plan {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: 12px; border: 1.5px solid;
        }
        .bst-recap__plan-name { font-size: 14px; font-weight: 700; color: #0f172a; }
        .bst-recap__plan-detail { font-size: 12px; color: #64748b; margin-top: 2px; }
        .bst-recap__plan-total { margin-left: auto; font-size: 22px; font-weight: 900; }
        .bst-recap__plan-total span { font-size: 12px; font-weight: 600; color: #94a3b8; }

        /* Card logos */
        .bst-card-logos { display: flex; gap: 10px; }
        .bst-card-logo {
          padding: 6px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px;
          opacity: .45; transition: opacity .15s, border-color .15s;
          display: flex; align-items: center;
        }
        .bst-card-logo--active { opacity: 1; border-color: #6366f1; }

        /* Form */
        .bst-form { display: flex; flex-direction: column; gap: 14px; }
        .bst-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .bst-form__group { display: flex; flex-direction: column; gap: 5px; }
        .bst-form__label { font-size: 12px; font-weight: 700; color: #374151; }
        .bst-form__input {
          padding: 11px 13px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-family: inherit; color: #0f172a; outline: none;
          background: #f9fafb; transition: border-color .15s, background .15s;
        }
        .bst-form__input:focus { border-color: #6366f1; background: #fff; }
        .bst-form__input--err { border-color: #ef4444 !important; background: #fef2f2 !important; }
        .bst-form__card-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 0 13px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f9fafb; transition: border-color .15s;
        }
        .bst-form__card-wrap:focus-within { border-color: #6366f1; background: #fff; }
        .bst-form__card-ico { color: #94a3b8; flex-shrink: 0; }
        .bst-form__input--card { border: none; background: transparent; flex: 1; padding: 11px 0; }
        .bst-form__input--card:focus { outline: none; }
        .bst-form__card-type {
          font-size: 11px; font-weight: 900; color: #1a1f71;
          background: #eef2ff; padding: 2px 7px; border-radius: 5px;
        }
        .bst-form__card-type--mc { color: #eb001b; background: #fff1f0; }
        .bst-form__err { font-size: 11px; color: #ef4444; font-weight: 600; }

        /* Pay button */
        .bst-pay-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px; border-radius: 12px; border: none;
          color: #fff; font-size: 15px; font-weight: 800; cursor: pointer;
          font-family: inherit; transition: opacity .15s, transform .15s;
          box-shadow: 0 6px 20px rgba(0,0,0,.2);
        }
        .bst-pay-btn:hover { opacity: .88; transform: translateY(-1px); }

        /* Security */
        .bst-security {
          display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;
        }
        .bst-security span {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #94a3b8; font-weight: 600;
        }

        /* Processing */
        .bst-processing {
          padding: 48px 24px; display: flex; flex-direction: column;
          align-items: center; gap: 14px; text-align: center;
        }
        .bst-processing__spinner {
          width: 44px; height: 44px; border: 4px solid #e5e7eb;
          border-top-color: #6366f1; border-radius: 50%;
          animation: bstSpin .7s linear infinite;
        }
        .bst-processing p { font-size: 16px; font-weight: 700; color: #0f172a; }
        .bst-processing small { font-size: 12px; color: #94a3b8; }

        /* Success */
        .bst-success {
          padding: 40px 28px; display: flex; flex-direction: column;
          align-items: center; gap: 14px; text-align: center;
        }
        .bst-success__anim { position: relative; }
        .bst-success__ring {
          position: absolute; inset: -8px; border-radius: 50%;
          border: 3px solid #16a34a; animation: bstRing .6s ease-out forwards;
        }
        @keyframes bstRing { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
        .bst-success__title { font-size: 22px; font-weight: 900; color: #0f172a; }
        .bst-success__sub { font-size: 14px; color: #64748b; line-height: 1.6; max-width: 280px; }
        .bst-success__recap {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 12px 16px; background: #f0fdf4;
          border: 1px solid #bbf7d0; border-radius: 10px;
        }
        .bst-success__recap span { font-size: 13px; font-weight: 600; color: #15803d; }
        .bst-success__total { font-size: 18px; font-weight: 900; color: #15803d; }
        .bst-success__btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 24px; border-radius: 10px; border: none;
          background: #0f172a; color: #fff; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit; margin-top: 4px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .bst-hero__title { font-size: 28px; }
          .bst-plans { grid-template-columns: 1fr; }
          .bst-grid { grid-template-columns: repeat(2, 1fr); }
          .bst-sticky__inner { gap: 12px; }
          .bst-sticky__total-val { font-size: 20px; }
        }
        @media (max-width: 480px) {
          .bst-grid { grid-template-columns: 1fr; }
          .bst-hero__stats { gap: 20px; }
          .bst-sticky__cta { width: 100%; justify-content: center; }
        }
      `}</style>
    </>
  );
}
