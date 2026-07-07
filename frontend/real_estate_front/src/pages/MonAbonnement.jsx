import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL from "../config";
import {
  Check, X, Star, ChevronRight,
  User, Briefcase, Building2, HardHat, Handshake, Crown
} from "lucide-react";

/* ── Plans copiés depuis BoosterPage (même structure) ── */
const PLANS = {
  particulier: [
    {
      id: "gratuit", name: "Gratuit", priceMonthly: 0, priceAnnual: 0, period: "pour toujours",
      color: "#6366f1", lightColor: "#eef2ff", badge: null, cta: "Créer un compte", ctaStyle: "outline",
      features: [
        { label: "Consultation des annonces", ok: true },
        { label: "5 annonces actives", ok: true },
        { label: "0 boost / mois", ok: true },
        { label: "Visibilité sur la carte (standard)", ok: true },
        { label: "Contact via formulaire", ok: true },
        { label: "Téléphone masqué par défaut", ok: true },
        { label: "Alertes de recherche basiques", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: false },
        { label: "Badge Investisseur vérifié", ok: false },
        { label: "Statistiques détaillées (vues, contacts)", ok: false },
        { label: "Alertes de recherche avancées (multi-critères)", ok: false },
        { label: "Estimation de rendement locatif", ok: false },
        { label: "Accès prioritaire aux annonces avant publication", ok: false },
      ],
    },
    {
      id: "essentiel", name: "Essentiel", priceMonthly: 29, priceAnnual: 290, period: "/ mois",
      color: "#6366f1", lightColor: "#eef2ff", badge: "3 mois offerts", popular: false,
      cta: "Choisir Essentiel", ctaStyle: "fill",
      features: [
        { label: "Consultation des annonces", ok: true },
        { label: "10 annonces actives", ok: true },
        { label: "5 boosts / mois", ok: true },
        { label: "Visibilité sur la carte (prioritaire)", ok: true },
        { label: "Contact via formulaire", ok: true },
        { label: "Téléphone masqué par défaut", ok: true },
        { label: "Alertes de recherche basiques", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
        { label: "Badge Investisseur vérifié", ok: false },
        { label: "Statistiques détaillées (vues, contacts)", ok: false },
        { label: "Alertes de recherche avancées (multi-critères)", ok: false },
        { label: "Estimation de rendement locatif", ok: false },
        { label: "Accès prioritaire aux annonces avant publication", ok: false },
      ],
    },
    {
      id: "investisseur", name: "Investisseur", priceMonthly: 59, priceAnnual: 590, period: "/ mois",
      color: "#7c3aed", lightColor: "#f5f3ff", badge: "3 mois offerts", popular: true,
      cta: "Choisir Investisseur", ctaStyle: "fill",
      features: [
        { label: "Consultation des annonces", ok: true },
        { label: "20 annonces actives", ok: true },
        { label: "10 boosts / mois", ok: true },
        { label: "Visibilité sur la carte (prioritaire)", ok: true },
        { label: "Contact via formulaire", ok: true },
        { label: "Téléphone masqué par défaut", ok: true },
        { label: "Alertes de recherche basiques", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
        { label: "Badge Investisseur vérifié", ok: true },
        { label: "Statistiques détaillées (vues, contacts)", ok: true },
        { label: "Alertes de recherche avancées (multi-critères)", ok: true },
        { label: "Estimation de rendement locatif", ok: true },
        { label: "Accès prioritaire aux annonces avant publication", ok: true },
      ],
    },
  ],
  agent: [
    {
      id: "gratuit", name: "Gratuit", priceMonthly: 0, priceAnnual: 0, period: "pour toujours",
      color: "#64748b", lightColor: "#f1f5f9", badge: null, cta: "Commencer", ctaStyle: "outline",
      features: [
        { label: "10 annonces actives", ok: true },
        { label: "Visibilité carte standard", ok: true },
        { label: "0 boost / mois", ok: false },
        { label: "Badge profil vérifié", ok: false },
        { label: "Statistiques de vues", ok: false },
        { label: "Espace boutique agent", ok: false },
        { label: "CRM & Gestion contacts", ok: false },
        { label: "Tableau de bord", ok: false },
        { label: "Alertes prospects", ok: false },
        { label: "Numéro masqué (protection)", ok: false },
        { label: "Sectorisation géographique", ok: false },
        { label: "Partage des mandats", ok: false },
        { label: "Support WhatsApp 24h/24 7j/7", ok: false },
      ],
    },
    {
      id: "starter", name: "Starter", priceMonthly: 99, priceAnnual: 990, period: "/ mois",
      color: "#0ea5e9", lightColor: "#e0f2fe", badge: "3 mois offerts",
      cta: "Choisir Starter", ctaStyle: "fill",
      features: [
        { label: "20 annonces actives", ok: true },
        { label: "15 boosts / mois", ok: true },
        { label: "Visibilité carte prioritaire", ok: true },
        { label: "Badge profil vérifié", ok: true },
        { label: "Statistiques de vues", ok: true },
        { label: "Espace boutique agent", ok: false },
        { label: "CRM & Gestion contacts", ok: false },
        { label: "Tableau de bord", ok: false },
        { label: "Alertes prospects", ok: false },
        { label: "Numéro masqué (protection)", ok: true },
        { label: "Sectorisation géographique", ok: true },
        { label: "Partage des mandats", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
    {
      id: "pro", name: "Pro", priceMonthly: 199, priceAnnual: 1990, period: "/ mois",
      color: "#0ea5e9", lightColor: "#e0f2fe", badge: "3 mois offerts", popular: true,
      cta: "Choisir Pro", ctaStyle: "fill",
      features: [
        { label: "40 annonces actives", ok: true },
        { label: "45 boosts / mois", ok: true },
        { label: "Visibilité carte prioritaire", ok: true },
        { label: "Badge profil vérifié", ok: true },
        { label: "Statistiques de vues", ok: true },
        { label: "Espace boutique agent", ok: true },
        { label: "CRM & Gestion contacts", ok: true },
        { label: "Tableau de bord", ok: true },
        { label: "Alertes prospects", ok: true },
        { label: "Numéro masqué (protection)", ok: true },
        { label: "Sectorisation géographique", ok: true },
        { label: "Partage des mandats", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
    {
      id: "expert", name: "Expert", priceMonthly: 299, priceAnnual: 2990, period: "/ mois",
      color: "#0369a1", lightColor: "#dbeafe", badge: "3 mois offerts",
      cta: "Choisir Expert", ctaStyle: "fill",
      features: [
        { label: "80 annonces actives", ok: true },
        { label: "90 boosts / mois", ok: true },
        { label: "Position fixe sur la carte", ok: true },
        { label: "Badge profil Top Agent", ok: true },
        { label: "Statistiques de vues", ok: true },
        { label: "Espace boutique agent", ok: true },
        { label: "CRM & Gestion contacts", ok: true },
        { label: "Tableau de bord", ok: true },
        { label: "Alertes prospects", ok: true },
        { label: "Numéro masqué (protection)", ok: true },
        { label: "Sectorisation géographique", ok: true },
        { label: "Partage des mandats", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
  ],
  agence: [
    {
      id: "gratuit", name: "Gratuit", priceMonthly: 0, priceAnnual: 0, period: "pour toujours",
      color: "#64748b", lightColor: "#f1f5f9", badge: null, cta: "Commencer", ctaStyle: "outline",
      features: [
        { label: "10 annonces actives", ok: true },
        { label: "1 compte agent inclus", ok: true },
        { label: "0 boost / mois", ok: false },
        { label: "Espace boutique agence", ok: false },
        { label: "Logo + vidéo présentation", ok: false },
        { label: "Badge Agence Certifiée", ok: false },
        { label: "CRM simple", ok: false },
        { label: "Tableau de bord par agent", ok: false },
        { label: "Rapport marché mensuel", ok: false },
        { label: "Alertes prospects", ok: false },
        { label: "Support WhatsApp 24h/24 7j/7", ok: false },
      ],
    },
    {
      id: "start", name: "Agency Start", priceMonthly: 199, priceAnnual: 1990, period: "/ mois",
      color: "#10b981", lightColor: "#d1fae5", badge: "3 mois offerts",
      cta: "Choisir Agency Start", ctaStyle: "fill",
      features: [
        { label: "30 annonces actives", ok: true },
        { label: "3 comptes agents inclus", ok: true },
        { label: "45 boosts / mois", ok: true },
        { label: "Boutique agence", ok: true },
        { label: "Logo + vidéo présentation", ok: true },
        { label: "Badge Agence Certifiée", ok: true },
        { label: "CRM simple", ok: true },
        { label: "Tableau de bord par agent", ok: true },
        { label: "Rapport marché mensuel", ok: true },
        { label: "Alertes prospects", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
    {
      id: "pro", name: "Agency Pro", priceMonthly: 349, priceAnnual: 3490, period: "/ mois",
      color: "#10b981", lightColor: "#d1fae5", badge: "3 mois offerts", popular: true,
      cta: "Choisir Agency Pro", ctaStyle: "fill",
      features: [
        { label: "60 annonces actives", ok: true },
        { label: "10 comptes agents inclus", ok: true },
        { label: "170 boosts / mois", ok: true },
        { label: "Boutique premium", ok: true },
        { label: "Logo + vidéo présentation", ok: true },
        { label: "Badge Agence Certifiée", ok: true },
        { label: "CRM complet", ok: true },
        { label: "Tableau de bord par agent", ok: true },
        { label: "Rapport marché mensuel", ok: true },
        { label: "Alertes prospects", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
    {
      id: "power", name: "Agency Power", priceMonthly: 499, priceAnnual: 4990, period: "/ mois",
      color: "#065f46", lightColor: "#d1fae5", badge: "3 mois offerts",
      cta: "Choisir Agency Power", ctaStyle: "fill",
      features: [
        { label: "120 annonces actives", ok: true },
        { label: "Agents illimités", ok: true },
        { label: "380 boosts / mois", ok: true },
        { label: "Boutique full", ok: true },
        { label: "Logo + vidéo présentation", ok: true },
        { label: "Badge Agence Référente", ok: true },
        { label: "CRM complet + API", ok: true },
        { label: "Tableau de bord par agent", ok: true },
        { label: "Rapport marché mensuel", ok: true },
        { label: "Alertes prospects", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
  ],
  promoteur: [
    {
      id: "gratuit-promo", name: "Gratuit", priceMonthly: 0, priceAnnual: 0, period: "pour toujours",
      color: "#64748b", lightColor: "#f1f5f9", badge: null, cta: "Commencer", ctaStyle: "outline",
      features: [
        { label: "1 projet actif simultané", ok: true },
        { label: "10 annonces actives", ok: true },
        { label: "0 boost / mois", ok: false },
        { label: "Espace Boutique promoteur", ok: false },
        { label: "Badge Promoteur Certifié", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: false },
        { label: "Statistiques temps réel", ok: false },
        { label: "Rapport marché mensuel", ok: false },
        { label: "Notifications push acheteurs", ok: false },
        { label: "Campagne SMS / email ciblée", ok: false },
        { label: "Account manager dédié", ok: false },
      ],
    },
    {
      id: "basic", name: "Basic", priceMonthly: 249, priceAnnual: 2490, period: "/ mois",
      color: "#fb923c", lightColor: "#fff7ed", badge: "3 mois offerts",
      cta: "Choisir Basic", ctaStyle: "fill",
      features: [
        { label: "1 projet actif simultané", ok: true },
        { label: "40 annonces actives", ok: true },
        { label: "15 boosts / mois", ok: true },
        { label: "Espace Boutique promoteur", ok: true },
        { label: "Badge Promoteur Certifié", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
        { label: "Statistiques temps réel", ok: false },
        { label: "Rapport marché mensuel", ok: false },
        { label: "Notifications push acheteurs", ok: false },
        { label: "Campagne SMS / email ciblée", ok: false },
        { label: "Account manager dédié", ok: false },
      ],
    },
    {
      id: "standard", name: "Standard", priceMonthly: 499, priceAnnual: 4990, period: "/ mois",
      color: "#f97316", lightColor: "#ffedd5", badge: "3 mois offerts",
      cta: "Choisir Standard", ctaStyle: "fill",
      features: [
        { label: "3 projets actifs simultanés", ok: true },
        { label: "80 annonces actives", ok: true },
        { label: "30 boosts / mois", ok: true },
        { label: "Espace Boutique promoteur", ok: true },
        { label: "Badge Promoteur Certifié", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
        { label: "Statistiques temps réel", ok: true },
        { label: "Rapport marché mensuel", ok: false },
        { label: "Notifications push acheteurs", ok: false },
        { label: "Campagne SMS / email ciblée", ok: false },
        { label: "Account manager dédié", ok: false },
      ],
    },
    {
      id: "premium", name: "Premium", priceMonthly: 749, priceAnnual: 7490, period: "/ mois",
      color: "#ea580c", lightColor: "#fed7aa", badge: "3 mois offerts", popular: true,
      cta: "Choisir Premium", ctaStyle: "fill",
      features: [
        { label: "Projets illimités", ok: true },
        { label: "120 annonces actives", ok: true },
        { label: "90 boosts / mois", ok: true },
        { label: "Espace Boutique premium", ok: true },
        { label: "Badge Promoteur Étoile", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
        { label: "Statistiques temps réel", ok: true },
        { label: "Rapport marché mensuel", ok: true },
        { label: "Notifications push acheteurs", ok: true },
        { label: "Campagne SMS / email ciblée", ok: true },
        { label: "Account manager dédié", ok: true },
      ],
    },
  ],
  partenaire: [
    {
      id: "smart", name: "Smart Partner", priceMonthly: 149, priceAnnual: 1490, period: "/ mois",
      cible: "Artisans / Professionnels du bâtiment",
      color: "#a78bfa", lightColor: "#f5f3ff", badge: "3 mois offerts",
      cta: "Nous contacter", ctaStyle: "fill",
      features: [
        { label: "Profil partenaire dédié avec logo", ok: true },
        { label: "Badge Partenaire certifié", ok: true },
        { label: "Référencement local (1 gouvernorat)", ok: true },
        { label: "Visibilité sur la carte dans votre zone", ok: true },
        { label: "Alertes missions & opportunités", ok: true },
        { label: "20 boosts / mois", ok: true },
        { label: "Statistiques de visibilité (vues, clics)", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
    {
      id: "bronze", name: "Bronze Partner", priceMonthly: 299, priceAnnual: 2990, period: "/ mois",
      cible: "Notaires / Avocats · Architectes",
      color: "#8b5cf6", lightColor: "#ede9fe", badge: "3 mois offerts",
      cta: "Nous contacter", ctaStyle: "fill",
      features: [
        { label: "Profil partenaire dédié avec logo", ok: true },
        { label: "Badge Partenaire certifié", ok: true },
        { label: "Référencement multi-zones (3 gouvernorats)", ok: true },
        { label: "Visibilité sur la carte dans votre zone", ok: true },
        { label: "Alertes clients potentiels en temps réel", ok: true },
        { label: "60 boosts / mois", ok: true },
        { label: "Bannières sur fiches annonces (zone ciblée)", ok: true },
        { label: "Statistiques avancées (taux de conversion, clics)", ok: true },
        { label: "Accès aux annonces avec accompagnement activé", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7", ok: true },
      ],
    },
    {
      id: "silver", name: "Silver Partner", priceMonthly: 449, priceAnnual: 4490, period: "/ mois",
      cible: "Assurances",
      color: "#7c3aed", lightColor: "#e9d5ff", badge: "3 mois offerts", popular: true,
      cta: "Nous contacter", ctaStyle: "fill",
      features: [
        { label: "Profil partenaire dédié avec logo & présentation vidéo", ok: true },
        { label: "Badge Partenaire Premium", ok: true },
        { label: "Référencement national illimité", ok: true },
        { label: "Visibilité prioritaire sur la carte", ok: true },
        { label: "Alertes clients potentiels en temps réel", ok: true },
        { label: "120 boosts / mois", ok: true },
        { label: "Bannières sur toutes les fiches annonces", ok: true },
        { label: "Widget intégré sur les fiches (simulateur, calculateur)", ok: true },
        { label: "Accès aux annonces avec accompagnement activé", ok: true },
        { label: "Statistiques complètes + export rapport mensuel", ok: true },
        { label: "Mise en avant page d'accueil (rotation)", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7 dédié", ok: true },
      ],
    },
    {
      id: "gold", name: "Gold Partner", priceMonthly: 599, priceAnnual: 5990, period: "/ mois",
      cible: "Banques",
      color: "#6d28d9", lightColor: "#ddd6fe", badge: "3 mois offerts",
      cta: "Nous contacter", ctaStyle: "fill",
      features: [
        { label: "Profil partenaire dédié avec logo & présentation vidéo", ok: true },
        { label: "Badge Partenaire Gold exclusif", ok: true },
        { label: "Référencement national illimité + position #1", ok: true },
        { label: "Visibilité prioritaire sur la carte (épingle Gold)", ok: true },
        { label: "Alertes clients potentiels en temps réel", ok: true },
        { label: "240 boosts / mois", ok: true },
        { label: "Bannières exclusives sur toutes les fiches annonces", ok: true },
        { label: "Widget intégré sur les fiches (simulateur, calculateur)", ok: true },
        { label: "Accès prioritaire aux annonces avec accompagnement", ok: true },
        { label: "Statistiques temps réel + tableau de bord dédié", ok: true },
        { label: "Mise en avant permanente page d'accueil", ok: true },
        { label: "Campagne email ciblée vers les utilisateurs de la zone", ok: true },
        { label: "Account manager dédié", ok: true },
        { label: "Support WhatsApp 24h/24 7j/7 prioritaire", ok: true },
      ],
    },
  ],
};

const SEGMENT_META = {
  particulier: { label: "Particuliers",             Icon: User,      color: "#6366f1", desc: "3 niveaux · 3 mois d'essai gratuit sur tous les plans payants au lancement" },
  agent:       { label: "Agents indépendants",      Icon: Briefcase, color: "#0ea5e9", desc: "4 niveaux · Accès au CRM, boutique et tableau de bord" },
  agence:      { label: "Agences",                  Icon: Building2, color: "#10b981", desc: "Structures établies · Multi-comptes · Tableau de bord centralisé" },
  promoteur:   { label: "Promoteurs",               Icon: HardHat,   color: "#f59e0b", desc: "Gestion de programmes · Boutique promoteur · Campagnes ciblées" },
  partenaire:  { label: "Partenaires/Prestataires", Icon: Handshake, color: "#8b5cf6", desc: "Professionnels du bâtiment, notaires, assurances, banques" },
};

function PlanCard({ plan, billing }) {
  const c = plan.color;
  const isAnnual = billing === "annual";
  const isFree   = plan.priceMonthly === 0;
  const displayPrice  = isAnnual ? plan.priceAnnual : plan.priceMonthly;
  const displayPeriod = isAnnual ? "/ an" : plan.period;

  return (
    <div className={`mab-card${plan.popular ? " mab-card--popular" : ""}`}
      style={plan.popular ? { borderColor: c, boxShadow: `0 0 0 3px ${c}22` } : {}}>
      {plan.popular && (
        <div className="mab-card__pop" style={{ background: c }}>
          <Star size={11}/> Le plus populaire
        </div>
      )}
      {plan.badge && (
        <div className="mab-card__badge" style={{ background: plan.lightColor, color: c, border: `1px solid ${c}33` }}>
          {plan.badge}
        </div>
      )}

      <div className="mab-card__head">
        <div className="mab-card__name" style={{ color: c }}>{plan.name}</div>
        {plan.cible && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background:`${c}15`, border:`1px solid ${c}30`,
            borderRadius:20, padding:"3px 10px",
            fontSize:11, fontWeight:700, color:c, marginBottom:6,
          }}>
            {plan.cible}
          </div>
        )}
        <div className="mab-card__price">
          {isFree ? (
            <><span className="mab-card__price-val" style={{color:"#94a3b8"}}>0 TND</span>
            <span className="mab-card__price-per">pour toujours</span></>
          ) : (
            <>
              {isAnnual && (
                <div className="mab-card__price-crossed">
                  <span style={{textDecorationColor:c}}>{(plan.priceMonthly*12).toLocaleString("fr-TN")} TND</span>
                  <span className="mab-card__price-save" style={{background:c}}>
                    −{Math.round((1-plan.priceAnnual/(plan.priceMonthly*12))*100)}%
                  </span>
                </div>
              )}
              <span className="mab-card__price-val" style={{color:c}}>
                {displayPrice?.toLocaleString("fr-TN")} TND
              </span>
              <span className="mab-card__price-per">{displayPeriod}</span>
            </>
          )}
        </div>
        {!isFree && <div style={{fontSize:12,color:"#94a3b8",marginTop:4,fontWeight:700}}>Montant TTC</div>}
      </div>

      <ul className="mab-card__features">
        {plan.features.map((f, i) => (
          <li key={i} className={f.ok ? "" : "mab-card__feat--off"}>
            {f.ok
              ? <Check size={15} style={{color:c,flexShrink:0}}/>
              : <X size={15} style={{color:"#cbd5e1",flexShrink:0}}/>
            }
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      <button className={`mab-card__cta${plan.ctaStyle==="fill" ? " mab-card__cta--fill" : " mab-card__cta--outline"}`}
        style={plan.ctaStyle==="fill" ? {background:c,boxShadow:`0 4px 16px ${c}44`} : {borderColor:c,color:c}}
        onClick={() => alert(`${plan.name} — Intégration paiement à configurer`)}>
        {plan.cta} <ChevronRight size={14}/>
      </button>
    </div>
  );
}

export default function MonAbonnement() {
  const [billing, setBilling] = useState("monthly");
  const [plansConfig, setPlansConfig] = useState(null);
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/plans-config`)
      .then(r => r.json())
      .then(setPlansConfig)
      .catch(() => setPlansConfig(null));
  }, []);

  if (!user) {
    return (
      <div>
        <Navbar/>
        <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
          <Crown size={40} style={{color:"#6366f1"}}/>
          <p style={{fontSize:16,color:"#64748b"}}>Connectez-vous pour voir vos offres d'abonnement.</p>
          <button onClick={() => navigate("/login")}
            style={{padding:"10px 24px",background:"#6366f1",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>
            Se connecter
          </button>
        </div>
        <Footer/>
      </div>
    );
  }

  const role = user.role === "agent_independant" ? "agent" : (user.role || "particulier");
  const segment = PLANS[role] ? role : "particulier";
  const segConfig = plansConfig?.[segment];
  const plans = PLANS[segment].filter(p =>
    !segConfig || segConfig[p.id] !== false
  );
  const meta = SEGMENT_META[segment] || SEGMENT_META.particulier;
  const { Icon, color, label, desc } = meta;

  return (
    <div>
      <Navbar/>

      {/* Hero */}
      <section style={{background:`linear-gradient(135deg, #0a1628 0%, #0e2a58 100%)`,padding:"60px 24px 80px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:56,height:56,borderRadius:14,background:`${color}22`,border:`1.5px solid ${color}44`,marginBottom:18}}>
          <Icon size={26} style={{color}}/>
        </div>
        <h1 style={{color:"#fff",fontSize:32,fontWeight:900,marginBottom:10}}>{label}</h1>
        <p style={{color:"rgba(255,255,255,.65)",fontSize:15,marginBottom:32,maxWidth:500,margin:"0 auto 32px"}}>{desc}</p>

        {/* Toggle mensuel / annuel */}
        <div style={{display:"inline-flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.08)",borderRadius:999,padding:"8px 20px",border:"1px solid rgba(255,255,255,.15)"}}>
          <span style={{color: billing==="monthly"?"#fff":"rgba(255,255,255,.5)", fontWeight:700, fontSize:14, cursor:"pointer"}}
            onClick={() => setBilling("monthly")}>Mensuel</span>
          <div style={{width:44,height:24,background: billing==="annual"?color:"rgba(255,255,255,.2)",borderRadius:999,padding:3,cursor:"pointer",transition:"background .2s",flexShrink:0}}
            onClick={() => setBilling(billing==="monthly"?"annual":"monthly")}>
            <div style={{width:18,height:18,background:"#fff",borderRadius:"50%",transition:"transform .2s",transform: billing==="annual"?"translateX(20px)":"translateX(0)"}}/>
          </div>
          <span style={{color: billing==="annual"?"#fff":"rgba(255,255,255,.5)", fontWeight:700, fontSize:14, cursor:"pointer"}}
            onClick={() => setBilling("annual")}>
            Annuel <span style={{color,fontWeight:800}}>−17%</span>
          </span>
        </div>
      </section>

      {/* Plans */}
      <section style={{padding:"0 24px 80px",marginTop:-40}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div className="mab-grid">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} billing={billing}/>
            ))}
          </div>
        </div>
      </section>

      <Footer/>

      <style>{`
        .mab-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          align-items: stretch;
        }
        .mab-card {
          flex: 0 0 260px;
          max-width: 260px;
        }
        @media (max-width: 1100px) { .mab-card { flex: 0 0 calc(50% - 10px); max-width: calc(50% - 10px); } }
        @media (max-width: 600px)  { .mab-card { flex: 0 0 100%; max-width: 100%; } }

        .mab-card {
          background: #fff;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          transition: transform .2s, box-shadow .2s;
        }
        .mab-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,.1); }
        .mab-card--popular { margin-top: -12px; }
        .mab-card__pop {
          text-align: center; padding: 7px 16px;
          font-size: 11px; font-weight: 800; color: #fff;
          letter-spacing: .8px; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .mab-card__badge {
          display: inline-block; margin: 12px 20px 0;
          padding: 3px 12px; border-radius: 999px;
          font-size: 11px; font-weight: 700;
          width: fit-content;
        }
        .mab-card__head { padding: 16px 22px 16px; }
        .mab-card__name { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .mab-card__price { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
        .mab-card__price-val { font-size: 36px; font-weight: 900; color: #0f172a; line-height: 1; }
        .mab-card__price-per { font-size: 13px; color: #94a3b8; }
        .mab-card__price-crossed {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #94a3b8; text-decoration: line-through;
          margin-bottom: 2px; width: 100%;
        }
        .mab-card__price-save {
          text-decoration: none; color: #fff;
          padding: 1px 8px; border-radius: 999px;
          font-size: 11px; font-weight: 800;
        }
        .mab-card__features {
          padding: 8px 22px 20px; flex: 1;
          display: flex; flex-direction: column; gap: 9px;
          list-style: none; margin: 0;
        }
        .mab-card__features li, .mab-card__feat--off {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 13.5px; color: #475569; line-height: 1.4;
        }
        .mab-card__feat--off span { color: #cbd5e1; }
        .mab-card__cta {
          margin: 0 22px 22px;
          padding: 12px 20px; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: inherit; border: 2px solid transparent;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: opacity .15s, transform .1s;
        }
        .mab-card__cta:hover { opacity: .88; transform: translateY(-1px); }
        .mab-card__cta--fill { color: #fff; }
        .mab-card__cta--outline { background: transparent; }
      `}</style>
    </div>
  );
}
