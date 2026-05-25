import React from "react";
import Layout from "../components/Layout";
import { MapPin, Users, Target, Award, Heart, TrendingUp, Shield, Star } from "lucide-react";

const TEAM = [
  { name: "Fatma Chahed",    role: "Fondatrice & CEO",           avatar: "FC" },
  { name: "Équipe Tech",     role: "Développement & Innovation", avatar: "ET" },
  { name: "Équipe Produit",  role: "Design & Expérience",        avatar: "EP" },
  { name: "Support Client",  role: "Accompagnement & Conseil",   avatar: "SC" },
];

const VALUES = [
  {
    icon: <Shield size={24}/>,
    title: "Confiance & Transparence",
    desc: "Nous vérifions chaque annonce publiée sur notre plateforme pour vous garantir des informations fiables et honnêtes.",
  },
  {
    icon: <MapPin size={24}/>,
    title: "Ancrage Local",
    desc: "Nous connaissons le marché immobilier tunisien en profondeur — de Tunis à Djerba, de Sfax à Tabarka.",
  },
  {
    icon: <TrendingUp size={24}/>,
    title: "Innovation Continue",
    desc: "Carte interactive, IA de rédaction, filtres avancés : nous innovons pour simplifier votre recherche.",
  },
  {
    icon: <Heart size={24}/>,
    title: "Proximité Humaine",
    desc: "Derrière chaque annonce, il y a une personne. Nous mettons l'humain au cœur de chaque interaction.",
  },
];

const STATS = [
  { val: "10 000+", label: "Annonces publiées" },
  { val: "24",      label: "Gouvernorats couverts" },
  { val: "98%",     label: "Satisfaction client" },
  { val: "2024",    label: "Année de création" },
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
              Localizi est née d'une conviction simple : trouver un bien immobilier
              en Tunisie devrait être simple, transparent et accessible à tous.
            </p>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="qsn-section qsn-section--light">
          <div className="qsn-container">
            <div className="qsn-mission">
              <div className="qsn-mission__text">
                <span className="qsn-eyebrow" style={{color:"#6366f1"}}>Notre mission</span>
                <h2 className="qsn-section__title">Connecter acheteurs et vendeurs à travers toute la Tunisie</h2>
                <p className="qsn-section__desc">
                  Fondée en 2024, Localizi est la première plateforme immobilière tunisienne à
                  combiner une carte interactive, un assistant IA et une base de données
                  couvrant l'ensemble des 24 gouvernorats du pays.
                </p>
                <p className="qsn-section__desc">
                  Notre objectif : rendre le marché immobilier tunisien plus transparent,
                  plus accessible, et plus efficace — aussi bien pour les particuliers
                  que pour les professionnels de l'immobilier.
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
                  <div className="qsn-value-card__ico">{v.icon}</div>
                  <h3 className="qsn-value-card__title">{v.title}</h3>
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
              <span className="qsn-eyebrow" style={{color:"#6366f1"}}>Les gens derrière Localizi</span>
              <h2 className="qsn-section__title">Notre équipe</h2>
            </div>
            <div className="qsn-team">
              {TEAM.map((m, i) => (
                <div key={i} className="qsn-team-card">
                  <div className="qsn-team-card__avatar">{m.avatar}</div>
                  <div className="qsn-team-card__name">{m.name}</div>
                  <div className="qsn-team-card__role">{m.role}</div>
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
              <p className="qsn-cta__sub">Des milliers d'annonces vérifiées vous attendent sur Localizi.</p>
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
        .qsn-stat__val { font-size: 30px; font-weight: 900; color: #6366f1; }
        .qsn-stat__label { font-size: 12.5px; color: #64748b; font-weight: 600; margin-top: 4px; }

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
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: #fff; font-size: 20px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(99,102,241,.35);
        }
        .qsn-team-card__name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .qsn-team-card__role { font-size: 12.5px; color: #6366f1; font-weight: 600; }

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
      `}</style>
    </Layout>
  );
}
