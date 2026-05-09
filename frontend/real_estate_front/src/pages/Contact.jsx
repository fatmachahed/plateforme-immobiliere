import React, { useState } from "react";
import Layout from "../components/Layout";
import {
  MapPin, Phone, Mail, Clock, Send, MessageSquare,
  Facebook, Instagram, Youtube, ArrowRight, CheckCircle2
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    nom: "", email: "", telephone: "", sujet: "", message: ""
  });
  const [sent, setSent] = useState(false);

  const DEST = "fachahed@gmail.com";

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      formData.sujet
        ? `[Localizi] ${formData.sujet}`
        : "[Localizi] Nouveau message de contact"
    );
    const body = encodeURIComponent(
      `Nom : ${formData.nom}\n` +
      `E-mail : ${formData.email}\n` +
      (formData.telephone ? `Téléphone : ${formData.telephone}\n` : "") +
      `\n${formData.message}`
    );
    window.location.href = `mailto:${DEST}?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ nom: "", email: "", telephone: "", sujet: "", message: "" });
    }, 4000);
  };

  const infos = [
    {
      icon: <MapPin size={18} strokeWidth={1.5}/>,
      label: "Adresse",
      value: "Avenue Habib Bourguiba, Tunis",
      sub: "Siège social"
    },
    {
      icon: <Phone size={18} strokeWidth={1.5}/>,
      label: "Téléphone",
      value: "+216 71 123 456",
      sub: "Lun – Sam, 9h – 18h"
    },
    {
      icon: <Mail size={18} strokeWidth={1.5}/>,
      label: "E-mail",
      value: "fachahed@gmail.com",
      sub: "Réponse sous 24 h"
    },
    {
      icon: <Clock size={18} strokeWidth={1.5}/>,
      label: "Disponibilité",
      value: "24 h / 24, 7 j / 7",
      sub: "Support en ligne"
    },
  ];

  const socials = [
    { icon: <Facebook size={16} strokeWidth={1.5}/>, label: "Facebook", href: "#" },
    { icon: <Instagram size={16} strokeWidth={1.5}/>, label: "Instagram", href: "#" },
    { icon: <Youtube size={16} strokeWidth={1.5}/>, label: "YouTube", href: "#" },
  ];

  return (
    <Layout>
      <div className="ct-page">

        {/* ── Hero ── */}
        <section className="ct-hero">
          <div className="ct-hero__bg-dots"/>
          <div className="ct-hero__inner">
            <span className="ct-hero__eyebrow">
              <MessageSquare size={13} strokeWidth={1.8}/> Contactez-nous
            </span>
            <h1 className="ct-hero__title">Une question ?<br/>Parlons-en.</h1>
            <p className="ct-hero__sub">
              Notre équipe est là pour vous accompagner dans tous vos projets immobiliers.
            </p>
            <div className="ct-hero__badges">
              <span><CheckCircle2 size={13} strokeWidth={2}/> Réponse rapide</span>
              <span><CheckCircle2 size={13} strokeWidth={2}/> Équipe dédiée</span>
              <span><CheckCircle2 size={13} strokeWidth={2}/> Disponible 7j/7</span>
            </div>
          </div>
        </section>

        {/* ── Main body ── */}
        <section className="ct-body">
          <div className="ct-container">
            <div className="ct-grid">

              {/* ── Left — info + social ── */}
              <div className="ct-left">
                <div className="ct-info-head">
                  <h2 className="ct-info-title">Nos coordonnées</h2>
                  <p className="ct-info-sub">Retrouvez-nous ou écrivez-nous directement.</p>
                </div>

                <div className="ct-info-list">
                  {infos.map((info, i) => (
                    <div key={i} className="ct-info-item">
                      <div className="ct-info-icon">{info.icon}</div>
                      <div className="ct-info-text">
                        <span className="ct-info-label">{info.label}</span>
                        <strong className="ct-info-value">{info.value}</strong>
                        <span className="ct-info-sub2">{info.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ct-divider"/>

                <div className="ct-social-wrap">
                  <p className="ct-social-title">Suivez-nous</p>
                  <div className="ct-social-row">
                    {socials.map((s, i) => (
                      <a key={i} href={s.href} className="ct-social-btn">
                        {s.icon}
                        <span>{s.label}</span>
                        <ArrowRight size={12} strokeWidth={1.5}/>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Dark card — hours */}
                <div className="ct-hours-card">
                  <div className="ct-hours-card__icon">
                    <Clock size={16} strokeWidth={1.5}/>
                  </div>
                  <div>
                    <p className="ct-hours-card__title">Horaires d'ouverture</p>
                    <p className="ct-hours-card__row"><span>Lun – Ven</span><strong>9h00 – 18h00</strong></p>
                    <p className="ct-hours-card__row"><span>Samedi</span><strong>9h00 – 13h00</strong></p>
                    <p className="ct-hours-card__row"><span>Dimanche</span><strong>Fermé</strong></p>
                  </div>
                </div>
              </div>

              {/* ── Right — form ── */}
              <div className="ct-right">
                <div className="ct-form-card">
                  {sent ? (
                    <div className="ct-success">
                      <div className="ct-success__icon">
                        <CheckCircle2 size={32} strokeWidth={1.5}/>
                      </div>
                      <h3>Message envoyé !</h3>
                      <p>Merci de nous avoir contacté. Nous vous répondrons dans les plus brefs délais.</p>
                    </div>
                  ) : (
                    <>
                      <div className="ct-form-head">
                        <h2 className="ct-form-title">Envoyez-nous un message</h2>
                        <p className="ct-form-sub">Remplissez le formulaire et nous vous répondrons rapidement.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="ct-form">
                        <div className="ct-form-row">
                          <div className="ct-field">
                            <label className="ct-label">Nom complet <span className="ct-req">*</span></label>
                            <input
                              type="text" className="ct-input"
                              placeholder="Votre nom"
                              value={formData.nom}
                              onChange={e => setFormData({...formData, nom: e.target.value})}
                              required
                            />
                          </div>
                          <div className="ct-field">
                            <label className="ct-label">Téléphone</label>
                            <input
                              type="tel" className="ct-input"
                              placeholder="+216 XX XXX XXX"
                              value={formData.telephone}
                              onChange={e => setFormData({...formData, telephone: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="ct-field">
                          <label className="ct-label">Adresse e-mail <span className="ct-req">*</span></label>
                          <input
                            type="email" className="ct-input"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>

                        <div className="ct-field">
                          <label className="ct-label">Sujet <span className="ct-req">*</span></label>
                          <select
                            className="ct-input ct-select"
                            value={formData.sujet}
                            onChange={e => setFormData({...formData, sujet: e.target.value})}
                            required
                          >
                            <option value="">Sélectionnez un sujet…</option>
                            <option value="info">Demande d'information</option>
                            <option value="annonce">Question sur une annonce</option>
                            <option value="support">Support technique</option>
                            <option value="partenariat">Partenariat</option>
                            <option value="autre">Autre</option>
                          </select>
                        </div>

                        <div className="ct-field">
                          <label className="ct-label">Message <span className="ct-req">*</span></label>
                          <textarea
                            className="ct-input ct-textarea"
                            rows={5}
                            placeholder="Décrivez votre demande en détail…"
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                            required
                          />
                        </div>

                        <button type="submit" className="ct-submit">
                          <Send size={16} strokeWidth={1.8}/>
                          Envoyer le message
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        /* ── Base ── */
        .ct-page {
          width: 100%;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        /* ── Hero ── */
        .ct-hero {
          position: relative;
          background: #0f172a;
          padding: 88px 24px 80px;
          overflow: hidden;
        }
        .ct-hero__bg-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(99,102,241,.15) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .ct-hero::after {
          content: "";
          position: absolute; bottom: -1px; left: 0; right: 0; height: 60px;
          background: #f4f6fa;
          clip-path: ellipse(55% 100% at 50% 100%);
        }
        .ct-hero__inner {
          position: relative; z-index: 1;
          max-width: 640px; margin: 0 auto; text-align: center;
        }
        .ct-hero__eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: #6366f1; background: rgba(99,102,241,.12); border: 1px solid rgba(99,102,241,.25);
          padding: 5px 14px; border-radius: 999px; margin-bottom: 20px;
        }
        .ct-hero__title {
          font-size: clamp(32px, 5vw, 52px); font-weight: 800; color: #fff;
          line-height: 1.15; letter-spacing: -.02em; margin-bottom: 18px;
        }
        .ct-hero__sub {
          font-size: 16px; color: rgba(255,255,255,.6); line-height: 1.7; margin-bottom: 28px;
        }
        .ct-hero__badges {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; flex-wrap: wrap;
        }
        .ct-hero__badges span {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.75);
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
          padding: 5px 13px; border-radius: 999px;
        }

        /* ── Body ── */
        .ct-body {
          background: #f4f6fa;
          padding: 60px 24px 80px;
        }
        .ct-container {
          max-width: 1140px; margin: 0 auto;
        }
        .ct-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 36px;
          align-items: start;
        }

        /* ── Left column ── */
        .ct-left { display: flex; flex-direction: column; gap: 0; }

        .ct-info-head { margin-bottom: 28px; }
        .ct-info-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .ct-info-sub { font-size: 14px; color: #64748b; }

        .ct-info-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
        .ct-info-item {
          display: flex; align-items: flex-start; gap: 14px;
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 14px; padding: 16px 18px;
          transition: border-color .15s, box-shadow .15s;
        }
        .ct-info-item:hover {
          border-color: #c7d2fe;
          box-shadow: 0 4px 16px rgba(99,102,241,.08);
        }
        .ct-info-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: #eef2ff; color: #6366f1;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid #c7d2fe;
        }
        .ct-info-text { display: flex; flex-direction: column; gap: 1px; }
        .ct-info-label { font-size: 10.5px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: #94a3b8; }
        .ct-info-value { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.4; }
        .ct-info-sub2  { font-size: 12px; color: #64748b; }

        .ct-divider { height: 1px; background: #e5e7eb; margin: 4px 0 24px; }

        .ct-social-title { font-size: 12px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
        .ct-social-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px; }
        .ct-social-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; border-radius: 12px;
          background: #fff; border: 1px solid #e5e7eb;
          color: #374151; font-size: 13.5px; font-weight: 600;
          text-decoration: none; transition: all .15s;
        }
        .ct-social-btn svg:first-child { color: #6366f1; }
        .ct-social-btn svg:last-child { margin-left: auto; color: #94a3b8; }
        .ct-social-btn:hover {
          border-color: #6366f1; color: #6366f1;
          box-shadow: 0 2px 12px rgba(99,102,241,.1);
          transform: translateX(3px);
        }

        .ct-hours-card {
          display: flex; gap: 16px; align-items: flex-start;
          background: #0f172a; border-radius: 16px;
          padding: 20px 22px; color: rgba(255,255,255,.85);
        }
        .ct-hours-card__icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          background: rgba(99,102,241,.25); color: #818cf8;
          display: flex; align-items: center; justify-content: center;
        }
        .ct-hours-card__title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .ct-hours-card__row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12.5px; padding: 3px 0;
        }
        .ct-hours-card__row span { color: rgba(255,255,255,.5); }
        .ct-hours-card__row strong { color: rgba(255,255,255,.85); font-weight: 600; }

        /* ── Right — form card ── */
        .ct-form-card {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 20px; padding: 40px 44px;
          box-shadow: 0 4px 24px rgba(0,0,0,.06);
        }
        .ct-form-head { margin-bottom: 28px; }
        .ct-form-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .ct-form-sub { font-size: 14px; color: #64748b; }

        .ct-form { display: flex; flex-direction: column; gap: 20px; }
        .ct-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ct-field { display: flex; flex-direction: column; gap: 6px; }
        .ct-label { font-size: 12.5px; font-weight: 700; color: #374151; letter-spacing: .2px; }
        .ct-req   { color: #ef4444; }
        .ct-input {
          padding: 11px 15px; border: 1.5px solid #e2e8f0;
          border-radius: 10px; font-size: 14px; font-family: inherit;
          outline: none; color: #0f172a; background: #f8fafc;
          transition: border-color .15s, background .15s, box-shadow .15s;
          width: 100%;
        }
        .ct-input:focus {
          border-color: #6366f1; background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }
        .ct-input::placeholder { color: #94a3b8; }
        .ct-select { cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 13px center;
          padding-right: 36px;
        }
        .ct-textarea { resize: vertical; min-height: 130px; }

        .ct-submit {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          padding: 13px 28px; border-radius: 12px; border: none;
          background: #0f172a; color: #fff;
          font-size: 14.5px; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: all .18s;
          width: 100%;
        }
        .ct-submit:hover {
          background: #1e293b;
          box-shadow: 0 6px 24px rgba(15,23,42,.2);
          transform: translateY(-1px);
        }

        /* ── Success state ── */
        .ct-success {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center;
          padding: 60px 20px; gap: 14px; min-height: 340px;
        }
        .ct-success__icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: #dcfce7; color: #16a34a;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .ct-success h3 { font-size: 22px; font-weight: 800; color: #0f172a; }
        .ct-success p  { font-size: 14px; color: #64748b; max-width: 320px; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .ct-grid { grid-template-columns: 1fr; }
          .ct-left { flex-direction: column; }
        }
        @media (max-width: 600px) {
          .ct-hero { padding: 64px 16px 72px; }
          .ct-hero__badges { gap: 8px; }
          .ct-body { padding: 40px 16px 60px; }
          .ct-form-card { padding: 24px 20px; }
          .ct-form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}
