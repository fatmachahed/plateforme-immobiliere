import React from "react";
import Layout from "../components/Layout";
import { MapPin, Users, Target, Heart, TrendingUp, Shield, CheckCircle, Gift } from "lucide-react";

const VALUES = [
  {
    icon: <Shield size={24}/>,
    title: "Confiance & Transparence",
    desc: "Chaque annonce publiée sur Localizi.tn est vérifiée par notre équipe pour vous garantir des informations fiables et honnêtes.",
  },
  {
    icon: <MapPin size={24}/>,
    title: "Ancrage Local",
    desc: "Nous connaissons le marché immobilier tunisien en profondeur — de Tunis à Djerba, de Sfax à Tabarka. Tous les 24 gouvernorats sont couverts.",
  },
  {
    icon: <TrendingUp size={24}/>,
    title: "Innovation Continue",
    desc: "Carte interactive, filtres avancés, alertes en temps réel : nous innovons chaque jour pour simplifier votre recherche immobilière.",
  },
  {
    icon: <Heart size={24}/>,
    title: "Proximité Humaine",
    desc: "Derrière chaque annonce, il y a une personne. Nous mettons l'humain au cœur de chaque interaction sur notre plateforme.",
  },
];

const FREE_PROFILES = [
  { label: "Particuliers",               desc: "Publiez vos biens sans aucun frais ni abonnement." },
  { label: "Agents immobiliers",         desc: "Diffusez vos annonces et développez votre clientèle gratuitement." },
  { label: "Agences immobilières",       desc: "Gérez votre portefeuille de biens sans coût de publication." },
  { label: "Promoteurs immobiliers",     desc: "Présentez vos projets neufs à des milliers d'acheteurs, sans débourser un dinar." },
  { label: "Partenaires",               desc: "Prestataires, artisans et professionnels du secteur : rejoignez notre réseau et boostez votre visibilité." },
];

const STATS = [
  { val: "100 % Gratuit",  label: "Publication d'annonces" },
  { val: "24",             label: "Gouvernorats couverts" },
  { val: "24/7",           label: "Disponible en continu" },
  { val: "2026",           label: "Année de création" },
];

export default function QuiSommesNous() {
  return (
    <Layout>
      <div className="qsn">

        {/* ── Hero ── */}
        <section className="qsn-hero">
          <div className="qsn-hero__bg"/>
          <div className="qsn-hero__overlay"/>
          <div className="qsn-hero__content">
            <span className="qsn-eyebrow">Notre histoire</span>
            <h1 className="qsn-hero__title">
              La plateforme immobilière<br/>
              <span className="qsn-hero__highlight">100% tunisienne</span>
            </h1>
            <p className="qsn-hero__sub">
              Localizi.tn est née d'une conviction simple : trouver ou vendre un bien immobilier
              en Tunisie devrait être simple, transparent et accessible à tous.
            </p>
          </div>
        </section>

        {/* ── Qui sommes-nous ── */}
        <section className="qsn-section qsn-section--light">
          <div className="qsn-container">
            <div className="qsn-mission">
              <div className="qsn-mission__text">
                <span className="qsn-eyebrow" style={{color:"#6366f1"}}>Qui sommes-nous ?</span>
                <h2 className="qsn-section__title">Une équipe passionnée d'immobilier et de technologie</h2>
                <p className="qsn-section__desc">
                  Localizi.tn est portée par une équipe de talents en informatique et en gestion,
                  profondément passionnés par l'immobilier tunisien. Forts d'expertises complémentaires
                  en développement, en gestion de projets et en connaissance du marché local, nous
                  avons conçu une plateforme pensée pour répondre aux vrais besoins des Tunisiens.
                </p>
                <p className="qsn-section__desc">
                  Notre ambition : <strong>faciliter l'intermédiation entre offreurs et demandeurs</strong>
                  de biens immobiliers, et rendre cette mise en relation accessible au plus grand nombre,
                  en éliminant les barrières techniques, géographiques et financières.
                </p>
                <p className="qsn-section__desc">
                  Que vous soyez un particulier qui cherche à louer un appartement, un agent immobilier
                  cherchant à élargir sa clientèle, ou un promoteur souhaitant présenter ses projets neufs,
                  Localizi.tn est l'outil qu'il vous faut.
                </p>
              </div>
              <div className="qsn-mission__stats">
                {STATS.map((s, i) => (
                  <div key={i} className="qsn-stat">
                    <div className="qsn-stat__val">{s.val}</div>
                    <div className="qsn-stat__label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Entièrement Gratuit (section mise en avant) ── */}
        <section className="qsn-section qsn-section--free">
          <div className="qsn-container">
            <div className="qsn-free__header">
              <div className="qsn-free__ico">
                <Gift size={32} color="#fff"/>
              </div>
              <span className="qsn-eyebrow" style={{color:"#a5b4fc"}}>Notre engagement</span>
              <h2 className="qsn-section__title" style={{color:"#fff"}}>
                Localizi.tn est accessible à tous
              </h2>
              <p style={{color:"rgba(255,255,255,.7)", fontSize:15, lineHeight:1.7, maxWidth:620, margin:"0 auto 48px"}}>
                Nous croyons que la mise en relation immobilière ne devrait coûter rien.
                Aucun paiement n'est demandé pour utiliser la plateforme, quels que soient
                votre profil ou votre volume de publications.
              </p>
            </div>
            <div className="qsn-free__grid">
              {FREE_PROFILES.map((p, i) => (
                <div key={i} className="qsn-free-card">
                  <div className="qsn-free-card__head">
                    <div className="qsn-free-card__check">
                      <CheckCircle size={22} color="#6366f1"/>
                    </div>
                    <div className="qsn-free-card__label">{p.label}</div>
                  </div>
                  <div className="qsn-free-card__desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Valeurs ── */}
        <section className="qsn-section">
          <div className="qsn-container">
            <div className="qsn-section__head">
              <span className="qsn-eyebrow" style={{color:"#6366f1"}}>Ce qui nous guide</span>
              <h2 className="qsn-section__title">Nos valeurs fondamentales</h2>
            </div>
            <div className="qsn-values">
              {VALUES.map((v, i) => (
                <div key={i} className="qsn-value-card">
                  <div className="qsn-value-card__head">
                    <div className="qsn-value-card__ico">{v.icon}</div>
                    <h3 className="qsn-value-card__title">{v.title}</h3>
                  </div>
                  <p className="qsn-value-card__desc">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Équipe ── */}
        <section className="qsn-section qsn-section--light">
          <div className="qsn-container">
            <div className="qsn-section__head">
              <span className="qsn-eyebrow" style={{color:"#6366f1"}}>Les équipes derrière Localizi.tn</span>
              <h2 className="qsn-section__title">Notre équipe</h2>
              <p style={{color:"#64748b", fontSize:14.5, maxWidth:560, margin:"12px auto 0", lineHeight:1.7}}>
                Informaticiens, gestionnaires et passionnés d'immobilier — nous unissons nos
                compétences pour offrir la meilleure expérience possible aux utilisateurs tunisiens.
              </p>
            </div>
            <div className="qsn-team">
              {[
                { avatar:"IT", name:"Équipe Tech",       role:"Développement & Innovation",  color:"#6366f1" },
                { avatar:"G",  name:"Équipe Gestion",    role:"Stratégie & Opérations",      color:"#0ea5e9" },
                { avatar:"UX", name:"Équipe Produit",    role:"Design & Expérience",         color:"#10b981" },
                { avatar:"SC", name:"Support Client",    role:"Accompagnement & Conseil",    color:"#f59e0b" },
              ].map((m, i) => (
                <div key={i} className="qsn-team-card">
                  <div className="qsn-team-card__avatar" style={{background:`linear-gradient(135deg, ${m.color}, ${m.color}aa)`}}>{m.avatar}</div>
                  <div className="qsn-team-card__name">{m.name}</div>
                  <div className="qsn-team-card__role" style={{color:m.color}}>{m.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="qsn-cta">
          <div className="qsn-container">
            <div className="qsn-cta__inner">
              <h2 className="qsn-cta__title">Prêt à trouver votre prochain bien ?</h2>
              <p className="qsn-cta__sub">
                Des milliers d'annonces vérifiées vous attendent — gratuitement.
              </p>
              <div className="qsn-cta__btns">
                <a href="/carte" className="qsn-btn qsn-btn--primary">Explorer la carte</a>
                <a href="/contact" className="qsn-btn qsn-btn--outline">Nous contacter</a>
              </div>
            </div>
          </div>
        </section>

      </div>

      <style>{`
        .qsn { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

        /* Hero */
        .qsn-hero {
          position: relative; overflow: hidden;
          min-height: 420px;
          display: flex; align-items: center; justify-content: center;
        }
        .qsn-hero__bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #0a1628 0%, #1e1b4b 50%, #0a1628 100%);
        }
        .qsn-hero__overlay {
          position: absolute; inset: 0;
          background: url("https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Sidi_Bou_Said_-_TN.jpg/1280px-Sidi_Bou_Said_-_TN.jpg") center/cover no-repeat;
          opacity: .12;
        }
        .qsn-hero__content {
          position: relative; z-index: 2;
          text-align: center; padding: 80px 24px;
          max-width: 720px; margin: 0 auto;
        }
        .qsn-eyebrow {
          display: inline-block;
          font-size: 12px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: #93c5fd; margin-bottom: 14px;
        }
        .qsn-hero__title {
          font-size: clamp(28px, 5vw, 48px); font-weight: 900;
          color: #fff; line-height: 1.15; margin: 0 0 18px;
        }
        .qsn-hero__highlight { color: #818cf8; }
        .qsn-hero__sub { font-size: 16px; color: #94a3b8; line-height: 1.7; max-width: 560px; margin: 0 auto; }

        /* Sections */
        .qsn-section { padding: 80px 0; }
        .qsn-section--light { background: #f8fafc; }
        .qsn-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .qsn-section__head { text-align: center; margin-bottom: 48px; }
        .qsn-section__title {
          font-size: clamp(22px, 3.5vw, 34px); font-weight: 800;
          color: #0f172a; margin: 10px 0 0; line-height: 1.2;
        }
        .qsn-section__desc {
          font-size: 15px; color: #475569; line-height: 1.8;
          max-width: 680px; margin: 0 0 14px;
        }

        /* Mission */
        .qsn-mission { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .qsn-mission__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .qsn-stat {
          background: #fff; border: 1.5px solid #e5e7eb; border-radius: 16px;
          padding: 24px; text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,.06);
        }
        .qsn-stat__val { font-size: 22px; font-weight: 900; color: #6366f1; }
        .qsn-stat__label { font-size: 12.5px; color: #64748b; font-weight: 600; margin-top: 4px; }

        /* Gratuit */
        .qsn-section--free {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          padding: 80px 0;
        }
        .qsn-free__header { text-align: center; margin-bottom: 40px; }
        .qsn-free__ico {
          width: 68px; height: 68px; border-radius: 50%;
          background: rgba(99,102,241,.25); border: 2px solid rgba(99,102,241,.4);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .qsn-free__grid {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 16px; margin-bottom: 40px;
        }
        .qsn-free-card {
          background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.12);
          border-radius: 14px; padding: 20px 22px;
          display: flex; flex-direction: column; gap: 10px;
          backdrop-filter: blur(6px);
          transition: background .2s;
        }
        .qsn-free-card:hover { background: rgba(255,255,255,.12); }
        .qsn-free-card__head {
          display: flex; align-items: center; gap: 12px;
        }
        .qsn-free-card__check {
          background: rgba(99,102,241,.15); border-radius: 8px;
          padding: 6px; flex-shrink: 0;
        }
        .qsn-free-card__label { font-size: 15px; font-weight: 700; color: #fff; }
        .qsn-free-card__desc { font-size: 13px; color: rgba(255,255,255,.6); line-height: 1.6; }
        .qsn-free__badge {
          text-align: center;
          background: rgba(99,102,241,.2); border: 1.5px solid rgba(99,102,241,.4);
          border-radius: 12px; padding: 16px 28px;
          font-size: 14px; color: rgba(255,255,255,.8); font-weight: 500;
          max-width: 560px; margin: 0 auto;
        }
        .qsn-free__badge span {
          font-size: 20px; font-weight: 900; color: #a5b4fc; margin-right: 8px;
        }

        /* Valeurs */
        .qsn-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
        .qsn-value-card {
          background: #fff; border: 1.5px solid #e5e7eb; border-radius: 16px;
          padding: 28px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,.05);
          transition: transform .2s, box-shadow .2s;
        }
        .qsn-value-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,.1); }
        .qsn-value-card__ico {
          width: 48px; height: 48px; border-radius: 12px;
          background: #eef2ff; color: #6366f1;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .qsn-value-card__title { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }
        .qsn-value-card__desc { font-size: 13.5px; color: #64748b; line-height: 1.7; margin: 0; }

        /* Équipe */
        .qsn-team { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
        .qsn-team-card {
          background: #fff; border: 1.5px solid #e5e7eb; border-radius: 16px;
          padding: 32px 20px; text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,.05);
          transition: transform .2s;
        }
        .qsn-team-card:hover { transform: translateY(-3px); }
        .qsn-team-card__avatar {
          width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px;
          color: #fff; font-size: 18px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,.2);
        }
        .qsn-team-card__name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .qsn-team-card__role { font-size: 12.5px; font-weight: 600; }

        /* CTA */
        .qsn-cta { background: linear-gradient(135deg, #0f172a, #1e1b4b); padding: 80px 0; }
        .qsn-cta__inner { text-align: center; }
        .qsn-cta__title { font-size: clamp(24px, 4vw, 38px); font-weight: 900; color: #fff; margin: 0 0 12px; }
        .qsn-cta__sub { font-size: 15px; color: #94a3b8; margin: 0 0 32px; }
        .qsn-cta__btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .qsn-btn {
          padding: 13px 28px; border-radius: 12px;
          font-size: 14px; font-weight: 700; text-decoration: none;
          transition: all .2s; display: inline-flex; align-items: center;
        }
        .qsn-btn--primary { background: #6366f1; color: #fff; box-shadow: 0 4px 16px rgba(99,102,241,.4); }
        .qsn-btn--primary:hover { background: #4f46e5; transform: translateY(-2px); }
        .qsn-btn--outline { border: 2px solid rgba(255,255,255,.25); color: #fff; }
        .qsn-btn--outline:hover { background: rgba(255,255,255,.1); }

        @media (max-width: 768px) {
          .qsn-mission { grid-template-columns: 1fr; gap: 36px; }
          .qsn-hero { min-height: 320px; }
        }
        @media (max-width: 860px) {
          .qsn-free__grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .qsn-free-card { box-sizing: border-box !important; min-width: 0 !important; padding: 16px 14px !important; }
          .qsn-free-card__head { gap: 8px !important; }
          .qsn-free-card__check { padding: 5px !important; }
          .qsn-free-card__label { font-size: 13.5px !important; min-width: 0 !important; }
          .qsn-free-card__desc { font-size: 12px !important; }
          .qsn-section { padding: 36px 0 !important; }
          .qsn-section__head { margin-bottom: 24px !important; }
          .qsn-value-card__head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
          .qsn-value-card__ico { margin-bottom: 0 !important; width: 38px !important; height: 38px !important; border-radius: 10px !important; flex-shrink: 0; }
          .qsn-value-card__title { margin: 0 !important; font-size: 14px !important; }
          .qsn-team { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }
          .qsn-team-card { padding: 20px 12px !important; }
          .qsn-team-card__avatar { width: 48px !important; height: 48px !important; font-size: 14px !important; margin-bottom: 10px !important; }
          .qsn-team-card__name { font-size: 13px !important; }
          .qsn-team-card__role { font-size: 11px !important; }
        }
      `}</style>
    </Layout>
  );
}
