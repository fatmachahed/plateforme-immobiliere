import React, { useState } from "react";
import Layout from "../components/Layout";
import { Shield, Eye, Lock, Database, UserCheck, Bell, Trash2, Mail, ChevronDown, ChevronUp } from "lucide-react";

const SECTIONS = [
  {
    icon: <Database size={22} />,
    title: "Données collectées",
    content: [
      {
        subtitle: "Informations d'inscription",
        text: "Lors de la création de votre compte, nous collectons votre nom, prénom, adresse e-mail, numéro de téléphone et mot de passe (stocké sous forme chiffrée). Ces données sont nécessaires pour vous identifier et sécuriser votre accès à la plateforme.",
      },
      {
        subtitle: "Données liées aux annonces",
        text: "Lorsque vous publiez une annonce, nous collectons les informations que vous fournissez : type de bien, localisation, superficie, prix, description et photos. Ces données sont visibles publiquement sur la plateforme.",
      },
      {
        subtitle: "Données de navigation",
        text: "Nous collectons des données techniques comme votre adresse IP, le type de navigateur utilisé, les pages visitées et la durée de visite. Ces informations nous permettent d'améliorer la performance et l'expérience utilisateur.",
      },
    ],
  },
  {
    icon: <Eye size={22} />,
    title: "Utilisation des données",
    content: [
      {
        subtitle: "Fonctionnement de la plateforme",
        text: "Vos données sont utilisées pour gérer votre compte, afficher vos annonces, vous permettre de contacter d'autres utilisateurs et vous envoyer des notifications relatives à vos annonces (messages reçus, statut de modération, etc.).",
      },
      {
        subtitle: "Amélioration des services",
        text: "Nous analysons les données d'utilisation (anonymisées) pour améliorer nos fonctionnalités, optimiser la carte interactive et personnaliser les résultats de recherche selon vos préférences.",
      },
      {
        subtitle: "Communications",
        text: "Avec votre consentement, nous pouvons vous envoyer des e-mails d'information sur les nouvelles fonctionnalités, les offres d'abonnement ou des alertes immobilières correspondant à vos critères de recherche.",
      },
    ],
  },
  {
    icon: <Lock size={22} />,
    title: "Sécurité & stockage",
    content: [
      {
        subtitle: "Chiffrement",
        text: "Toutes les communications entre votre navigateur et nos serveurs sont chiffrées via le protocole HTTPS/TLS. Les mots de passe sont hashés avec bcrypt — nous ne stockons jamais votre mot de passe en clair.",
      },
      {
        subtitle: "Durée de conservation",
        text: "Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont effacées dans un délai de 30 jours, à l'exception des données légalement requises.",
      },
    ],
  },
  {
    icon: <UserCheck size={22} />,
    title: "Vos droits",
    content: [
      {
        subtitle: "Droit d'accès",
        text: "Vous pouvez à tout moment consulter les données personnelles que nous détenons sur vous en accédant à votre espace « Mon compte ».",
      },
      {
        subtitle: "Droit de rectification",
        text: "Vous pouvez modifier vos informations personnelles (nom, e-mail, téléphone) directement depuis les paramètres de votre compte.",
      },
      {
        subtitle: "Droit à l'effacement",
        text: "Vous pouvez demander la suppression de votre compte et de toutes vos données en nous contactant à privacy@Localizi.tn. La demande sera traitée dans un délai de 7 jours ouvrés.",
      },
      {
        subtitle: "Droit d'opposition",
        text: "Vous pouvez vous opposer à la réception de communications marketing en cliquant sur le lien de désinscription présent dans chaque e-mail, ou en modifiant vos préférences de notification dans votre compte.",
      },
    ],
  },
  {
    icon: <Bell size={22} />,
    title: "Cookies",
    content: [
      {
        subtitle: "Cookies essentiels",
        text: "Ces cookies sont indispensables au fonctionnement de la plateforme (authentification, panier, préférences de langue). Ils ne peuvent pas être désactivés.",
      },
      {
        subtitle: "Cookies analytiques",
        text: "Avec votre consentement, nous utilisons des cookies analytiques pour mesurer l'audience et améliorer nos services. Ces données sont anonymisées et ne permettent pas de vous identifier personnellement.",
      },
      {
        subtitle: "Gestion des cookies",
        text: "Vous pouvez gérer vos préférences de cookies à tout moment via les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter le bon fonctionnement de la plateforme.",
      },
    ],
  },
  {
    icon: <Trash2 size={22} />,
    title: "Partage des données",
    content: [
      {
        subtitle: "Tiers de confiance",
        text: "Nous ne vendons jamais vos données personnelles à des tiers. Nous pouvons partager certaines données avec des prestataires techniques (hébergement, e-mail transactionnel) liés par des contrats de confidentialité stricts.",
      },
      {
        subtitle: "Annonces publiques",
        text: "Les informations que vous publiez dans vos annonces (description, localisation approximative, prix, photos) sont visibles par tous les utilisateurs de la plateforme, y compris les visiteurs non connectés.",
      },
      {
        subtitle: "Obligations légales",
        text: "Nous pouvons être amenés à divulguer vos données si la loi l'exige (réquisition judiciaire, obligation légale) ou pour protéger les droits, la propriété ou la sécurité de Localizi.tn ou de ses utilisateurs.",
      },
    ],
  },
];

function AccordionItem({ section, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className={`pc-accordion ${open ? "pc-accordion--open" : ""}`}>
      <button className="pc-accordion__head" onClick={() => setOpen(!open)}>
        <span className="pc-accordion__ico">{section.icon}</span>
        <span className="pc-accordion__title">{section.title}</span>
        <span className="pc-accordion__chevron">{open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</span>
      </button>
      {open && (
        <div className="pc-accordion__body">
          {section.content.map((item, j) => (
            <div key={j} className="pc-accordion__item">
              <h4 className="pc-accordion__subtitle">{item.subtitle}</h4>
              <p className="pc-accordion__text">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PolitiqueConfidentialite() {
  return (
    <Layout>
      <div className="pc">

        {/* ── Hero ── */}
        <section className="pc-hero">
          <div className="pc-hero__bg"/>
          <div className="pc-hero__overlay"/>
          <div className="pc-hero__content">
            <span className="pc-eyebrow">Transparence & confiance</span>
            <h1 className="pc-hero__title">
              Politique de<br/>
              <span className="pc-hero__highlight">confidentialité</span>
            </h1>
            <p className="pc-hero__sub">
              Chez Localizi.tn, la protection de vos données personnelles est une priorité.
              Cette page vous explique clairement quelles données nous collectons, comment
              nous les utilisons et quels sont vos droits.
            </p>
            <div className="pc-hero__meta">
              <span className="pc-badge"><Shield size={13}/> Dernière mise à jour : mai 2026</span>
            </div>
          </div>
        </section>

        {/* ── Intro highlight ── */}
        <section className="pc-intro-section">
          <div className="pc-container">
            <div className="pc-intro-grid">
              <div className="pc-intro-card pc-intro-card--blue">
                <Lock size={28} className="pc-intro-card__ico"/>
                <div className="pc-intro-card__val">Chiffrement</div>
                <div className="pc-intro-card__label">HTTPS & bcrypt</div>
              </div>
              <div className="pc-intro-card pc-intro-card--green">
                <UserCheck size={28} className="pc-intro-card__ico"/>
                <div className="pc-intro-card__val">Vos droits</div>
                <div className="pc-intro-card__label">Accès, rectif., effacement</div>
              </div>
              <div className="pc-intro-card pc-intro-card--indigo">
                <Shield size={28} className="pc-intro-card__ico"/>
                <div className="pc-intro-card__val">Zéro vente</div>
                <div className="pc-intro-card__label">Données jamais vendues</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Accordéon ── */}
        <section className="pc-section">
          <div className="pc-container pc-container--narrow">
            <div className="pc-section__head">
              <span className="pc-eyebrow" style={{color:"#6366f1"}}>Tout ce que vous devez savoir</span>
              <h2 className="pc-section__title">Détail de notre politique</h2>
              <p className="pc-section__desc">
                Nous nous engageons à être transparents sur chaque aspect du traitement de vos données.
                Cliquez sur une section pour en savoir plus.
              </p>
            </div>
            <div className="pc-accordions">
              {SECTIONS.map((s, i) => (
                <AccordionItem key={i} section={s} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact DPO ── */}
        <section className="pc-contact-section">
          <div className="pc-container">
            <div className="pc-contact-box">
              <div className="pc-contact-box__left">
                <Mail size={32} className="pc-contact-box__ico"/>
                <div>
                  <h3 className="pc-contact-box__title">Une question sur vos données ?</h3>
                  <p className="pc-contact-box__text">
                    Notre délégué à la protection des données (DPO) est disponible pour répondre
                    à toutes vos questions concernant le traitement de vos données personnelles.
                  </p>
                </div>
              </div>
              <div className="pc-contact-box__right">
                <a href="mailto:privacy@Localizi.tn" className="pc-btn pc-btn--primary">
                  Contacter le DPO
                </a>
                <a href="/contact" className="pc-btn pc-btn--outline">
                  Formulaire de contact
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>

      <style>{`
        .pc { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

        /* Hero */
        .pc-hero {
          position: relative; overflow: hidden;
          min-height: 400px;
          display: flex; align-items: center; justify-content: center;
        }
        .pc-hero__bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #0a1628 0%, #1e1b4b 50%, #0a1628 100%);
        }
        .pc-hero__overlay {
          position: absolute; inset: 0;
          background: url("https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Sidi_Bou_Said_-_TN.jpg/1280px-Sidi_Bou_Said_-_TN.jpg") center/cover no-repeat;
          opacity: .10;
        }
        .pc-hero__content {
          position: relative; z-index: 2;
          text-align: center; padding: 80px 24px;
          max-width: 720px; margin: 0 auto;
        }
        .pc-eyebrow {
          display: inline-block;
          font-size: 12px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: #93c5fd; margin-bottom: 14px;
        }
        .pc-hero__title {
          font-size: clamp(28px, 5vw, 48px); font-weight: 900;
          color: #fff; line-height: 1.15; margin: 0 0 18px;
        }
        .pc-hero__highlight { color: #818cf8; }
        .pc-hero__sub {
          font-size: 15px; color: #94a3b8; line-height: 1.8;
          max-width: 580px; margin: 0 auto 20px;
        }
        .pc-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(99,102,241,.2); border: 1px solid rgba(99,102,241,.35);
          color: #a5b4fc; font-size: 12px; font-weight: 600;
          padding: 6px 14px; border-radius: 999px;
        }

        /* Intro cards */
        .pc-intro-section { padding: 48px 0; background: #f8fafc; }
        .pc-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .pc-container--narrow { max-width: 860px; }
        .pc-intro-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .pc-intro-card {
          border-radius: 16px; padding: 28px 20px; text-align: center;
          border: 1.5px solid transparent;
          transition: transform .2s;
        }
        .pc-intro-card:hover { transform: translateY(-3px); }
        .pc-intro-card--blue   { background: #eff6ff; border-color: #bfdbfe; }
        .pc-intro-card--green  { background: #f0fdf4; border-color: #bbf7d0; }
        .pc-intro-card--indigo { background: #eef2ff; border-color: #c7d2fe; }
        .pc-intro-card--rose   { background: #fff1f2; border-color: #fecdd3; }
        .pc-intro-card__ico {
          margin: 0 auto 10px;
          display: block;
        }
        .pc-intro-card--blue   .pc-intro-card__ico { color: #3b82f6; }
        .pc-intro-card--green  .pc-intro-card__ico { color: #22c55e; }
        .pc-intro-card--indigo .pc-intro-card__ico { color: #6366f1; }
        .pc-intro-card--rose   .pc-intro-card__ico { color: #f43f5e; }
        .pc-intro-card__val   { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .pc-intro-card__label { font-size: 12px; color: #64748b; font-weight: 500; }

        /* Section */
        .pc-section { padding: 72px 0; }
        .pc-section__head { text-align: center; margin-bottom: 44px; }
        .pc-section__title {
          font-size: clamp(22px, 3.5vw, 32px); font-weight: 800;
          color: #0f172a; margin: 10px 0 12px; line-height: 1.2;
        }
        .pc-section__desc { font-size: 14.5px; color: #475569; line-height: 1.8; max-width: 600px; margin: 0 auto; }

        /* Accordion */
        .pc-accordions { display: flex; flex-direction: column; gap: 10px; }
        .pc-accordion {
          border: 1.5px solid #e5e7eb; border-radius: 14px;
          background: #fff; overflow: hidden;
          transition: box-shadow .2s, border-color .2s;
        }
        .pc-accordion--open {
          border-color: #c7d2fe;
          box-shadow: 0 4px 20px rgba(99,102,241,.1);
        }
        .pc-accordion__head {
          width: 100%; display: flex; align-items: center; gap: 14px;
          padding: 18px 22px; background: none; border: none;
          cursor: pointer; text-align: left;
          transition: background .15s;
        }
        .pc-accordion__head:hover { background: #f8fafc; }
        .pc-accordion--open .pc-accordion__head { background: #f5f3ff; }
        .pc-accordion__ico {
          width: 40px; height: 40px; border-radius: 10px;
          background: #eef2ff; color: #6366f1;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pc-accordion--open .pc-accordion__ico { background: #6366f1; color: #fff; }
        .pc-accordion__title { flex: 1; font-size: 15px; font-weight: 700; color: #0f172a; }
        .pc-accordion__chevron { color: #6366f1; flex-shrink: 0; }
        .pc-accordion__body { padding: 0 22px 22px; }
        .pc-accordion__item { padding: 16px 0; border-top: 1px solid #f1f5f9; }
        .pc-accordion__item:first-child { border-top: none; padding-top: 8px; }
        .pc-accordion__subtitle {
          font-size: 13.5px; font-weight: 700; color: #1e293b;
          margin: 0 0 8px; display: flex; align-items: center; gap: 6px;
        }
        .pc-accordion__subtitle::before {
          content: ""; width: 4px; height: 4px; border-radius: 50%;
          background: #6366f1; display: inline-block; flex-shrink: 0;
        }
        .pc-accordion__text { font-size: 13.5px; color: #475569; line-height: 1.75; margin: 0; }

        /* Contact box */
        .pc-contact-section { padding: 60px 0; background: #f8fafc; }
        .pc-contact-box {
          background: linear-gradient(135deg, #0f172a, #1e1b4b);
          border-radius: 20px; padding: 40px 44px;
          display: flex; align-items: center; gap: 32px;
          flex-wrap: wrap; justify-content: space-between;
        }
        .pc-contact-box__left { display: flex; align-items: flex-start; gap: 20px; flex: 1; min-width: 260px; }
        .pc-contact-box__ico { color: #818cf8; flex-shrink: 0; margin-top: 2px; }
        .pc-contact-box__title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 8px; }
        .pc-contact-box__text { font-size: 13.5px; color: #94a3b8; line-height: 1.7; margin: 0; max-width: 420px; }
        .pc-contact-box__right { display: flex; gap: 12px; flex-wrap: wrap; flex-shrink: 0; }
        .pc-btn {
          padding: 12px 24px; border-radius: 12px;
          font-size: 13.5px; font-weight: 700; text-decoration: none;
          transition: all .2s; display: inline-flex; align-items: center;
          white-space: nowrap;
        }
        .pc-btn--primary { background: #6366f1; color: #fff; box-shadow: 0 4px 16px rgba(99,102,241,.4); }
        .pc-btn--primary:hover { background: #4f46e5; transform: translateY(-2px); }
        .pc-btn--outline { border: 2px solid rgba(255,255,255,.25); color: #fff; }
        .pc-btn--outline:hover { background: rgba(255,255,255,.1); }

        @media (max-width: 768px) {
          .pc-contact-box { padding: 28px 24px; flex-direction: column; }
          .pc-contact-box__left { flex-direction: column; gap: 12px; }
          .pc-hero { min-height: 320px; }
        }
      `}</style>
    </Layout>
  );
}
