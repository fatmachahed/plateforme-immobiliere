import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroBannerImg from "../assets/hero-booster.jpg";
import {
  Zap, Star, Crown, Check, X, ArrowLeft, Rocket, Gift,
  User, Briefcase, Building2, HardHat, Handshake, ChevronRight,
  TrendingUp, Shield, Clock, Users, BarChart2, MapPin, Bell,
  Phone, BookOpen, Lock, Award, Sparkles, MessageSquare, Globe,
  ToggleLeft, ToggleRight,
  Eye, Target, Megaphone, RefreshCw, Package, ShoppingCart, ArrowLeftRight
} from "lucide-react";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const SEGMENTS = [
  { id: "particulier",  label: "Particuliers",        icon: User,       color: "#6366f1", lightColor: "#eef2ff" },
  { id: "agent",        label: "Agents indépendants",  icon: Briefcase,  color: "#0ea5e9", lightColor: "#e0f2fe" },
  { id: "agence",       label: "Agences",              icon: Building2,  color: "#10b981", lightColor: "#d1fae5" },
  { id: "promoteur",    label: "Promoteurs",           icon: HardHat,    color: "#f59e0b", lightColor: "#fef3c7" },
  { id: "partenaire",   label: "Partenaires/Prestataires", icon: Handshake,  color: "#8b5cf6", lightColor: "#f5f3ff" },
  { id: "catalogue",    label: "Acheter des Boosts",   icon: Zap,        color: "#f59e0b", lightColor: "#fef3c7" },
];

const PLANS = {
  particulier: [
    {
      id: "gratuit", name: "Gratuit", priceMonthly: 0, priceAnnual: 0, period: "pour toujours",
      color: "#6366f1", lightColor: "#eef2ff", badge: null,
      cta: "Créer un compte", ctaStyle: "outline",
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
      color: "#64748b", lightColor: "#f1f5f9", badge: null,
      cta: "Commencer", ctaStyle: "outline",
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
      color: "#64748b", lightColor: "#f1f5f9", badge: null,
      cta: "Commencer", ctaStyle: "outline",
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
      color: "#64748b", lightColor: "#f1f5f9", badge: null,
      cta: "Commencer", ctaStyle: "outline",
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
    /* ── DIAMOND désactivé temporairement ──
    {
      id: "diamond", name: "Diamond", priceMonthly: null, priceAnnual: null, period: "",
      color: "#c2410c", lightColor: "#ffedd5", badge: "Exclusif",
      cta: "Nous contacter", ctaStyle: "fill",
      features: [
        { label: "Projets illimités", ok: true },
        { label: "Annonces illimitées", ok: true },
        { label: "60 boosts / mois", ok: true },
        { label: "600 Refresh / mois", ok: true },
        { label: "Espace Boutique full", ok: true },
        { label: "Badge Promoteur Diamond", ok: true },
        { label: "Statistiques temps réel", ok: true },
        { label: "Rapport marché sur mesure", ok: true },
        { label: "Notifications push acheteurs", ok: true },
        { label: "Campagne SMS / email ciblée", ok: true },
        { label: "Account manager dédié", ok: true },
      ],
    },
    ── fin Diamond ── */
  ],
  partenaire: [
    {
      id: "smart", name: "Smart Partner", priceMonthly: 149, priceAnnual: 1490, period: "/ mois",
      cible: "Artisans / Professionnels du bâtiment",
      color: "#c8956c", lightColor: "#fdf4ec", badge: "3 mois offerts",
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
      color: "#a0673a", lightColor: "#fae8d5", badge: "3 mois offerts",
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
      color: "#7a4a28", lightColor: "#f5dcc8", badge: "3 mois offerts", popular: true,
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
      color: "#4d2d12", lightColor: "#eed9c0", badge: "3 mois offerts",
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

/* ─────────────────────────────────────────────
   PLAN CARD
───────────────────────────────────────────── */
function PlanCard({ plan, color, billing }) {
  const c = plan.color || color;
  const isAnnual = billing === "annual";
  const isFree   = plan.priceMonthly === 0;
  const isDevis  = plan.priceMonthly === null;

  const displayPrice  = isAnnual ? plan.priceAnnual  : plan.priceMonthly;
  const displayPeriod = isAnnual ? "/ an" : plan.period;

  return (
    <div className={`bst-plan-card${plan.popular ? " bst-plan-card--popular" : ""}`}
      style={plan.popular ? { borderColor: c, boxShadow: `0 0 0 3px ${c}22` } : {}}>
      {plan.popular && (
        <div className="bst-plan-card__pop" style={{ background: c }}>
          <Star size={11}/> Le plus populaire
        </div>
      )}
      {plan.badge && (
        <div className="bst-plan-card__badge" style={{ background: plan.lightColor, color: c, border:`1px solid ${c}33` }}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="bst-plan-card__head">
        <div className="bst-plan-card__name" style={{ color: c }}>{plan.name}</div>
        {plan.cible && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background: `${c}15`, border:`1px solid ${c}30`,
            borderRadius:20, padding:"3px 10px",
            fontSize:11, fontWeight:700, color:c, marginBottom:6,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {plan.cible}
          </div>
        )}
        <div className="bst-plan-card__price">
          {isDevis ? (
            <span className="bst-plan-card__price-val" style={{ color: c, fontSize: 28 }}>Sur devis</span>
          ) : (
            <>
              {isAnnual && !isFree && (
                <div className="bst-plan-card__price-crossed">
                  <span style={{ textDecorationColor: c }}>{(plan.priceMonthly * 12).toLocaleString("fr-TN")} TND</span>
                  <span className="bst-plan-card__price-save" style={{ background: c }}>
                    −{Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)}%
                  </span>
                </div>
              )}
              <span className="bst-plan-card__price-val" style={{ color: isFree ? "#94a3b8" : c }}>
                {isFree ? "0" : displayPrice?.toLocaleString("fr-TN")} TND
              </span>
              <span className="bst-plan-card__price-per">{isFree ? "pour toujours" : displayPeriod}</span>
            </>
          )}
        </div>
        {!isFree && !isDevis && (
          <div style={{fontSize:12,color:"#94a3b8",marginTop:4,fontWeight:700}}>Montant TTC</div>
        )}
      </div>

      {/* Features */}
      <ul className="bst-plan-card__features">
        {plan.features.map((f, i) => (
          <li key={i} className={f.ok ? "" : "bst-plan-card__feat--off"}>
            {f.ok
              ? <Check size={15} style={{ color: c, flexShrink: 0 }}/>
              : <X size={15} style={{ color: "#cbd5e1", flexShrink: 0 }}/>
            }
            <span>{f.label}{f.note ? <em> — {f.note}</em> : ""}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button className={`bst-plan-card__cta${plan.ctaStyle === "fill" ? " bst-plan-card__cta--fill" : " bst-plan-card__cta--outline"}`}
        style={plan.ctaStyle === "fill" ? { background: c, boxShadow: `0 4px 16px ${c}44` } : { borderColor: c, color: c }}>
        {plan.cta} <ChevronRight size={14}/>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BOOST CATALOGUE DATA
───────────────────────────────────────────── */
const BOOST_CATEGORIES = [
  {
    id: "visibilite", num: 1, icon: Eye,
    title: "Visibilité",
    subtitle: "Super Boost, Star Map, mise en avant agence et agent",
    color: "#6366f1", lightColor: "#eef2ff",
    description: "Ces actions consomment des Boosts (monnaie virtuelle) pour mettre en avant une annonce, un profil ou une agence. Le Super Boost remonte votre annonce en tête des résultats pendant 7 jours.",
    cols: ["Action", "Coût", "Durée", "Effet"],
    actions: [
      { name: "Super Boost",            cost: "1 boost",   dur: "7 jours",          effect: "Annonce remontée en tête des résultats de recherche et épingle mise en avant sur la carte" },
      { name: "Super Boost Plus",       cost: "4 boosts",  dur: "14 jours",         effect: "Tête des résultats en continu pendant 14 jours · renouvellement automatique à mi-parcours" },
      { name: "Star Map",               cost: "1 boost",   dur: "7 jours",          effect: "Le point de l'annonce sur la carte devient une étoile" },
      { name: "Amount Map",             cost: "2 boosts",  dur: "7 jours",          effect: "L'étoile affiche directement le prix sur la carte, sans clic" },
      { name: "Mise en avant Agence",   cost: "3 boosts",  dur: "7 jours",          effect: "Profil agence épinglé en tête de l'annuaire de la zone" },
      { name: "Mise en avant Agent",    cost: "2 boosts",  dur: "7 jours",          effect: "Profil de l'agent mis en avant sur ses fiches et dans les résultats" },
    ],
  },
  {
    id: "credibilite", num: 2, icon: Shield,
    title: "Crédibilité",
    subtitle: "Confiance et preuve sociale",
    color: "#10b981", lightColor: "#d1fae5",
    description: "Ces actions débloquent un statut qui reste actif tant que le profil ou l'annonce est en ligne — elles ne s'épuisent pas dans le temps.",
    cols: ["Action", "Coût", "Validité", "Effet"],
    actions: [
      { name: "Badge Certifié",  cost: "2 boosts", dur: "Permanent",           effect: "Vérification manuelle d'identité, badge affiché sur le profil" },
      { name: "Contact Direct",  cost: "2 boosts", dur: "Durée de l'annonce",  effect: "Numéro affiché sans floutage ni intermédiaire" },
    ],
  },
  {
    id: "prospection", num: 3, icon: Target,
    title: "Prospection & Leads",
    subtitle: "Mise en relation avec des acheteurs qualifiés",
    color: "#0ea5e9", lightColor: "#e0f2fe",
    description: "Ces boosts accélèrent la mise en relation, côté vendeur comme côté acheteur. Le quota inclus dans l'abonnement reste la base ; le boost permet d'aller au-delà sans changer de formule.",
    cols: ["Action", "Coût", "Effet"],
    actions: [
      { name: "Lead qualifié supplémentaire",  cost: "4 boosts / lead", dur: null, effect: "Un lead entrant additionnel au-delà du quota inclus dans l'abonnement" },
      { name: "Alerte exclusive (acquéreur)",  cost: "4 boosts",        dur: null, effect: "Accès 24h avant le grand public aux nouveaux projets correspondant aux critères" },
      { name: "Contact prioritaire (acquéreur)", cost: "1 boost",       dur: null, effect: "Email transmis au promoteur, avec engagement de réponse sous 24h" },
    ],
  },
  {
    id: "analyse", num: 4, icon: BarChart2,
    title: "Analyse & Données",
    subtitle: "Rapports et estimations à la demande",
    color: "#8b5cf6", lightColor: "#f5f3ff",
    description: "Ouverts à tous les profils : un agent ou un promoteur peut tout aussi bien commander une analyse de quartier pour étayer un argumentaire client.",
    cols: ["Action", "Coût", "Effet"],
    actions: [
      { name: "Analyse de quartier",      cost: "2 boosts", dur: null, effect: "Rapport écoles / transports / commerces pour la zone du bien" },
      { name: "Estimation personnalisée", cost: "4 boosts", dur: null, effect: "Comparatif du prix/m² avec 10 biens comparables" },
      { name: "Visite virtuelle Pro",     cost: "8 boosts", dur: null, effect: "Scan 3D haute définition + visite en réalité virtuelle (biens en construction)" },
    ],
  },
  {
    id: "marketing", num: 5, icon: Megaphone,
    title: "Marketing & Diffusion",
    subtitle: "Notifications ciblées — réservées aux lancements de programmes",
    color: "#ef4444", lightColor: "#fee2e2",
    description: "5 paliers de diffusion, du test de marché discret au lancement majeur. Le coût par acheteur réellement touché diminue à chaque palier.",
    cols: ["Offre", "Coût", "Audience", "Cas d'usage"],
    actions: [
      { name: "First Blast",   cost: "6 boosts",  dur: "500 acheteurs",    effect: "Lancement discret, test de marché" },
      { name: "Basic Blast",   cost: "10 boosts", dur: "1 000 acheteurs",  effect: "Lancement standard" },
      { name: "Medium Blast",  cost: "20 boosts", dur: "2 500 acheteurs",  effect: "Lancement à portée moyenne" },
      { name: "Mega Blast",    cost: "30 boosts", dur: "5 000 acheteurs",  effect: "Lancement à forte visibilité" },
      { name: "Premium Blast", cost: "50 boosts", dur: "10 000 acheteurs", effect: "Lancement majeur / programme phare" },
    ],
    note: "Coût par acheteur : 0,06 TND (First) → 0,05 → 0,04 → 0,03 → 0,025 TND (Premium)",
  },
  {
    id: "gestion", num: 6, icon: RefreshCw,
    title: "Gestion d'annonces",
    subtitle: "Fraîcheur, visibilité et capacité de publication",
    color: "#f59e0b", lightColor: "#fef3c7",
    description: "Tous ces services sont payables en boosts, la monnaie virtuelle de la plateforme. Le Refresh remet votre annonce à la date du jour. Le Spotlight ajoute un badge '⭐ À ne pas manquer' visible sur la carte et dans les résultats.",
    cols: ["Action", "Prix", "Contenu", "Effet"],
    actions: [
      { name: "Refresh 10",             cost: "2 boosts",   dur: "10 refresh",  effect: "Réactualise la date de publication — remonte dans le tri 'plus récentes'" },
      { name: "Refresh 50",             cost: "9 boosts",   dur: "50 refresh",  effect: "−10% · meilleure cadence de publication" },
      { name: "Refresh 100",            cost: "16 boosts",  dur: "100 refresh", effect: "−20% · usage intensif — meilleure offre" },
      { name: "Spotlight 7 jours",      cost: "2 boosts",   dur: "7 jours",     effect: "Badge ⭐ 'À ne pas manquer' visible sur carte + résultats de recherche" },
      { name: "Annonce supplémentaire", cost: "3 boosts",   dur: "30 jours",    effect: "Ajoute 1 annonce active hors quota de votre abonnement" },
      { name: "Pack Visibilité Max",    cost: "4 boosts",   dur: "7 jours",     effect: "1 Super Boost + 1 Spotlight + 5 Refresh · économie de 4 boosts vs achat séparé" },
    ],
  },
];

/* ─────────────────────────────────────────────
   BOOST CATALOGUE COMPONENT
───────────────────────────────────────────── */
/* Parse "4 boosts", "2 boosts / lead", "20 boosts" → number */
function parseBoostCost(costStr) {
  const m = String(costStr).match(/^([\d,]+)\s*boost/);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}

function BoostCatalogue({ boostBalance, onBuyBoosts, onActivate }) {
  return (
    <div className="bst-cat">

      {/* ── Explication des 3 produits ── */}
      <div className="bst-cat__products-intro">
        <h2 className="bst-cat__products-intro-title">Comment fonctionne la visibilité payante ?</h2>
        <p className="bst-cat__products-intro-sub">3 outils indépendants, chacun avec un rôle précis. Utilisez-les séparément ou combinez-les pour un impact maximal.</p>
        <div className="bst-cat__products-grid">

          {/* Super Boost */}
          <div className="bst-cat__product-card bst-cat__product-card--boost">
            <div className="bst-cat__product-icon" style={{background:"#fbbf24"}}><Zap size={20} color="#fff"/></div>
            <div className="bst-cat__product-name">Super Boost</div>
            <div className="bst-cat__product-price">à partir de 5 TND / 7 jours</div>
            <div className="bst-cat__product-desc">
              Remonte votre annonce en <strong>tête des résultats de recherche</strong> et sur la carte. Plus votre niveau est élevé, plus vous apparaissez en premier face aux autres annonces.
            </div>
            <ul className="bst-cat__product-list">
              <li><Check size={12}/> Position prioritaire dans les résultats</li>
              <li><Check size={12}/> Épingle mise en avant sur la carte</li>
              <li><Check size={12}/> Durée : 7 jours à compter de l'activation</li>
            </ul>
            <div className="bst-cat__product-tip">
              <span>💡</span> Payable avec vos Boosts (monnaie virtuelle de la plateforme). 1 Super Boost 7j = 1 boost.
            </div>
          </div>

          {/* Refresh */}
          <div className="bst-cat__product-card bst-cat__product-card--refresh">
            <div className="bst-cat__product-icon" style={{background:"#3b82f6"}}><RefreshCw size={20} color="#fff"/></div>
            <div className="bst-cat__product-name">Refresh</div>
            <div className="bst-cat__product-price">à partir de 1 TND / jour</div>
            <div className="bst-cat__product-desc">
              Remet la <strong>date de publication à aujourd'hui</strong>, ce qui fait remonter votre annonce dans les tris par date. Simple, rapide, sans avoir besoin de boosts.
            </div>
            <ul className="bst-cat__product-list">
              <li><Check size={12}/> Remonte dans le tri "les plus récentes"</li>
              <li><Check size={12}/> 1 boost = 5 rafraîchissements instantanés</li>
            </ul>
            <div className="bst-cat__product-tip">
              <span>💡</span> Idéal pour les annonces actives depuis plusieurs jours qui ont perdu de la visibilité par ancienneté.
            </div>
          </div>

          {/* Spotlight */}
          <div className="bst-cat__product-card bst-cat__product-card--spotlight">
            <div className="bst-cat__product-icon" style={{background:"#ea580c"}}><Star size={20} color="#fff"/></div>
            <div className="bst-cat__product-name">Spotlight</div>
            <div className="bst-cat__product-price">à partir de 9 TND / 7 jours</div>
            <div className="bst-cat__product-desc">
              Ajoute un <strong>badge "⭐ À ne pas manquer"</strong> sur votre annonce, visible dans les résultats de recherche ET sur la carte. Attire l'œil des visiteurs et augmente les clics.
            </div>
            <ul className="bst-cat__product-list">
              <li><Check size={12}/> Badge orange visible sur la carte pendant 7 jours</li>
              <li><Check size={12}/> Badge affiché sur la fiche dans les résultats</li>
              <li><Check size={12}/> 2 boosts = 1 spotlight</li>
            </ul>
            <div className="bst-cat__product-tip">
              <span>💡</span> Idéal pour se démarquer visuellement quand il y a beaucoup d'annonces similaires dans la même zone.
            </div>
          </div>

        </div>

        {/* Pack recommandé */}
        <div className="bst-cat__bundle-recommend">
          <div className="bst-cat__bundle-recommend-left">
            <div className="bst-cat__bundle-recommend-badge"><Zap size={11}/> Recommandé</div>
            <div className="bst-cat__bundle-recommend-title">Pack Visibilité Max — 19 TND</div>
            <div className="bst-cat__bundle-recommend-sub">
              Combinez les 3 outils en un seul achat : <strong>1 Super Boost 7j + 1 Spotlight 7j + 5 Refresh</strong>
            </div>
          </div>
          <div className="bst-cat__bundle-recommend-savings">
            <div className="bst-cat__bundle-recommend-old">Valeur séparée : 28 TND</div>
            <div className="bst-cat__bundle-recommend-gain">Vous économisez 9 TND</div>
          </div>
          <button className="bst-cat__bundle-recommend-btn" onClick={() => onActivate(0, {pack:"visibilite_max", tnd:19})}>
            <ShoppingCart size={14}/> Activer ce pack
          </button>
        </div>
      </div>

      {/* ── Packs individuels ── */}
      <div className="bst-cat__packs-hero">
        <div className="bst-cat__packs-hero-label"><Zap size={14}/> Acheter des Boosts — monnaie virtuelle de la plateforme</div>
        <h3 className="bst-cat__packs-hero-title">Rechargez votre solde de Boosts</h3>
        <p className="bst-cat__packs-hero-sub">Les Boosts sont la monnaie virtuelle Localizi. Utilisez-les pour activer un Super Boost, des analyses, du marketing et bien plus — jusqu'à −20% sur les packs.</p>

        {/* ── Ligne 1 : Packs Boosts (monnaie) ── */}
        <div className="bst-cat__packs-grouplabels">
          <div className="bst-cat__packs-grouplabel">
            <Zap size={12}/> Packs Boosts — monnaie virtuelle de la plateforme
          </div>
        </div>
        <div className="bst-cat__pricing-row bst-cat__pricing-row--3">
          <div className="bst-cat__boost-coin-card bst-cat__boost-coin-card--lg">
            <div className="bst-cat__boost-coin-header"><Zap size={14} color="#fbbf24"/> Monnaie Boost</div>
            <div className="bst-cat__boost-coin-name">Boost 10</div>
            <div className="bst-cat__boost-coin-qty"><span>10</span> boosts</div>
            <div className="bst-cat__boost-coin-price">50 <span>TND</span></div>
            <div className="bst-cat__boost-coin-unit">5,00 TND / boost · utilisables sur tous les services</div>
            <div className="bst-cat__boost-coin-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__boost-coin-btn" onClick={() => onBuyBoosts(10)}>Commander</button>
          </div>
          <div className="bst-cat__boost-coin-card bst-cat__boost-coin-card--mid bst-cat__boost-coin-card--lg">
            <div className="bst-cat__boost-coin-header"><Zap size={14} color="#fbbf24"/> Monnaie Boost</div>
            <div className="bst-cat__boost-coin-name">Boost 50</div>
            <div className="bst-cat__boost-coin-qty"><span>50</span> boosts</div>
            <div className="bst-cat__boost-coin-price">225 <span>TND</span></div>
            <div className="bst-cat__boost-coin-unit">4,50 TND / boost · économie −10%</div>
            <div className="bst-cat__boost-coin-disc">−10%</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__boost-coin-btn" onClick={() => onBuyBoosts(50)}>Commander</button>
          </div>
          <div className="bst-cat__boost-coin-card bst-cat__boost-coin-card--best bst-cat__boost-coin-card--lg">
            <div className="bst-cat__boost-coin-best-badge"><Zap size={10}/> Meilleure offre</div>
            <div className="bst-cat__boost-coin-header"><Zap size={14} color="#fbbf24"/> Monnaie Boost</div>
            <div className="bst-cat__boost-coin-name">Boost 100</div>
            <div className="bst-cat__boost-coin-qty"><span>100</span> boosts</div>
            <div className="bst-cat__boost-coin-price">400 <span>TND</span></div>
            <div className="bst-cat__boost-coin-unit">4,00 TND / boost · économie −20%</div>
            <div className="bst-cat__boost-coin-disc">−20%</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__boost-coin-btn" onClick={() => onBuyBoosts(100)}>Commander</button>
          </div>
        </div>

        {/* ── Ligne 2 : Packs Super Boost ── */}
        <div className="bst-cat__packs-grouplabels" style={{marginTop:28}}>
          <div className="bst-cat__packs-grouplabel" style={{color:"rgba(251,191,36,.8)"}}>
            <TrendingUp size={12}/> Packs Super Boost
          </div>
        </div>
        <div className="bst-cat__pricing-row bst-cat__pricing-row--3">
          <div className="bst-cat__pricing-card" style={{borderColor:"#f59e0b"}}>
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name" style={{color:"#d97706"}}>Super Boost 10</div>
            <div className="bst-cat__pricing-qty">10 <span>activations</span></div>
            <div className="bst-cat__pricing-price" style={{color:"#d97706"}}>10 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 50 TND · mise en avant 7j</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn" style={{background:"#f59e0b"}} onClick={() => onActivate(10, {superboost:10})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card" style={{borderColor:"#f59e0b",background:"rgba(245,158,11,.08)"}}>
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name" style={{color:"#d97706"}}>Super Boost 50</div>
            <div className="bst-cat__pricing-qty">50 <span>activations</span></div>
            <div className="bst-cat__pricing-price" style={{color:"#d97706"}}>50 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 250 TND · mise en avant 7j</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn" style={{background:"#f59e0b"}} onClick={() => onActivate(50, {superboost:50})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card" style={{borderColor:"#fbbf24",background:"rgba(245,158,11,.13)",boxShadow:"0 0 0 1px rgba(251,191,36,.3)"}}>
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name" style={{color:"#d97706"}}>Super Boost 100</div>
            <div className="bst-cat__pricing-qty">100 <span>activations</span></div>
            <div className="bst-cat__pricing-price" style={{color:"#d97706"}}>100 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 500 TND · mise en avant 7j</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn" style={{background:"#f59e0b"}} onClick={() => onActivate(100, {superboost:100})}>Activer</button>
          </div>
        </div>
        <div className="bst-cat__refresh-hero-desc" style={{marginTop:8}}>
          <TrendingUp size={12}/> Super Boost = mise en avant de l'annonce pendant 7 jours en tête des résultats · payable en boosts
        </div>

        {/* ── Ligne 3 : Packs Refresh ── */}
        <div className="bst-cat__packs-grouplabels" style={{marginTop:28}}>
          <div className="bst-cat__packs-grouplabel bst-cat__packs-grouplabel--blue">
            <RefreshCw size={12}/> Packs Refresh
          </div>
        </div>
        <div className="bst-cat__pricing-row bst-cat__pricing-row--3">
          <div className="bst-cat__pricing-card bst-cat__pricing-card--refresh-hero">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--blue">Refresh 10</div>
            <div className="bst-cat__pricing-qty">10 <span>refresh</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--blue">2 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 10 TND · 1 boost / 5 refresh</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--blue" onClick={() => onActivate(2, {refresh:10})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--refresh-hero bst-cat__pricing-card--refresh-mid">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--blue">Refresh 50</div>
            <div className="bst-cat__pricing-qty">50 <span>refresh</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--blue">10 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 50 TND · 1 boost / 5 refresh</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--blue" onClick={() => onActivate(10, {refresh:50})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--refresh-hero bst-cat__pricing-card--refresh-best">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--blue">Refresh 100</div>
            <div className="bst-cat__pricing-qty">100 <span>refresh</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--blue">20 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 100 TND · 1 boost / 5 refresh</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--blue" onClick={() => onActivate(20, {refresh:100})}>Activer</button>
          </div>
        </div>
        <div className="bst-cat__refresh-hero-desc" style={{marginTop:8}}>
          <RefreshCw size={12}/> Refresh = réactualise instantanément la date de publication · payable en boosts
        </div>

        {/* ── Ligne 4 : Packs Annonces supplémentaires ── */}
        <div className="bst-cat__packs-grouplabels" style={{marginTop:28}}>
          <div className="bst-cat__packs-grouplabel bst-cat__packs-grouplabel--green">
            <Package size={12}/> Packs Annonces supplémentaires
          </div>
        </div>
        <div className="bst-cat__pricing-row bst-cat__pricing-row--3">
          <div className="bst-cat__pricing-card bst-cat__pricing-card--annonce">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--green">Annonce 5</div>
            <div className="bst-cat__pricing-qty">5 <span>annonces</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--green">15 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 75 TND · 3 boosts / annonce</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--green" onClick={() => onActivate(15, {annonce:5})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--annonce bst-cat__pricing-card--annonce-mid">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--green">Annonce 10</div>
            <div className="bst-cat__pricing-qty">10 <span>annonces</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--green">30 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 150 TND · 3 boosts / annonce</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--green" onClick={() => onActivate(30, {annonce:10})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--annonce bst-cat__pricing-card--annonce-best">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--green">Annonce 15</div>
            <div className="bst-cat__pricing-qty">15 <span>annonces</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--green">45 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 225 TND · 3 boosts / annonce</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--green" onClick={() => onActivate(45, {annonce:15})}>Activer</button>
          </div>
        </div>

        {/* ── Ligne 5 : Packs Leads qualifiés ── */}
        <div className="bst-cat__packs-grouplabels" style={{marginTop:28}}>
          <div className="bst-cat__packs-grouplabel bst-cat__packs-grouplabel--violet">
            <Target size={12}/> Packs Leads qualifiés
          </div>
        </div>
        <div className="bst-cat__pricing-row bst-cat__pricing-row--3">
          <div className="bst-cat__pricing-card bst-cat__pricing-card--lead">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--violet">Leads 10</div>
            <div className="bst-cat__pricing-qty">10 <span>leads</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--violet">40 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 200 TND · 4 boosts / lead</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--violet" onClick={() => onActivate(40, {lead:10})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--lead bst-cat__pricing-card--lead-mid">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--violet">Leads 50</div>
            <div className="bst-cat__pricing-qty">50 <span>leads</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--violet">200 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 1 000 TND · 4 boosts / lead</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--violet" onClick={() => onActivate(200, {lead:50})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--lead bst-cat__pricing-card--lead-best">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--violet">Leads 100</div>
            <div className="bst-cat__pricing-qty">100 <span>leads</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--violet">400 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 2 000 TND · 4 boosts / lead</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--violet" onClick={() => onActivate(400, {lead:100})}>Activer</button>
          </div>
        </div>

        {/* ── Ligne 6 : Packs Spotlight ── */}
        <div className="bst-cat__packs-grouplabels" style={{marginTop:28}}>
          <div className="bst-cat__packs-grouplabel" style={{color:"rgba(251,146,60,.85)"}}>
            <Star size={12}/> Packs Spotlight
          </div>
        </div>
        <div className="bst-cat__pricing-row bst-cat__pricing-row--3">
          <div className="bst-cat__pricing-card bst-cat__pricing-card--spotlight">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--orange">Spotlight 1</div>
            <div className="bst-cat__pricing-qty">1 <span>spotlight</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--orange">2 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 10 TND · 7 jours</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--orange">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--orange" onClick={() => onActivate(2, {spotlight:1})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--spotlight bst-cat__pricing-card--spotlight-mid">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--orange">Spotlight 3</div>
            <div className="bst-cat__pricing-qty">3 <span>spotlights</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--orange">6 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 30 TND · 2 boosts / spotlight</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--orange" onClick={() => onActivate(6, {spotlight:3})}>Activer</button>
          </div>
          <div className="bst-cat__pricing-card bst-cat__pricing-card--spotlight bst-cat__pricing-card--spotlight-best">
            <div className="bst-cat__pricing-badge-placeholder"/>
            <div className="bst-cat__pricing-name bst-cat__pricing-name--orange">Spotlight 10</div>
            <div className="bst-cat__pricing-qty">10 <span>spotlights</span></div>
            <div className="bst-cat__pricing-price bst-cat__pricing-price--orange">20 <span>boosts</span></div>
            <div className="bst-cat__pricing-unit">= 100 TND · 2 boosts / spotlight</div>
            <div className="bst-cat__pricing-disc bst-cat__pricing-disc--none">Tarif de base</div>
            <div className="bst-cat__pricing-grow"/>
            <button className="bst-cat__pricing-btn bst-cat__pricing-btn--orange" onClick={() => onActivate(20, {spotlight:10})}>Activer</button>
          </div>
        </div>
        <div className="bst-cat__refresh-hero-desc" style={{marginTop:8}}>
          <Star size={12}/> Spotlight = badge "⭐ À ne pas manquer" sur la carte et dans les résultats · 7 jours · payable en boosts
        </div>
      </div>

      {/* ── Grille des 6 catégories ── */}
      <div className="bst-cat__grid">
        {BOOST_CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          return (
            <div key={cat.id} className="bst-cat__card">
              <div className="bst-cat__card-head" style={{ background: cat.lightColor, borderLeft: `5px solid ${cat.color}` }}>
                <div className="bst-cat__card-icon" style={{ background: cat.color }}>
                  <CatIcon size={18} color="#fff"/>
                </div>
                <div>
                  <div className="bst-cat__card-title" style={{ color: cat.color }}>
                    {cat.num}. {cat.title}
                  </div>
                  <div className="bst-cat__card-subtitle">{cat.subtitle}</div>
                </div>
              </div>
              <p className="bst-cat__card-desc">{cat.description}</p>
              <table className="bst-cat__table">
                <thead>
                  <tr>
                    {cat.cols.map(c => <th key={c}>{c}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cat.actions.map((a, i) => {
                    const cost = parseBoostCost(a.cost);
                    const isTnd = /TND/i.test(a.cost);
                    const canActivate = isTnd ? true : (cost !== null && boostBalance >= cost);
                    const noCost = cost === null && !isTnd;
                    return (
                      <tr key={i}>
                        <td className="bst-cat__td-name">{a.name}</td>
                        <td className="bst-cat__td-cost">
                          <span className="bst-cat__cost-badge" style={{ background: isTnd ? "#fff7ed" : cat.lightColor, color: isTnd ? "#ea580c" : cat.color }}>
                            {a.cost}
                          </span>
                        </td>
                        {a.dur !== undefined && a.dur !== null && (
                          <td className="bst-cat__td-dur">{a.dur}</td>
                        )}
                        <td className="bst-cat__td-eff">{a.effect}</td>
                        <td className="bst-cat__td-act">
                          <button
                            className={`bst-cat__act-btn${canActivate ? "" : " bst-cat__act-btn--disabled"}`}
                            style={canActivate ? { background: isTnd ? "#ea580c" : cat.color } : {}}
                            disabled={noCost}
                            onClick={() => canActivate && onActivate(cost || 0, isTnd ? { tnd: parseFloat(a.cost) } : {})}
                            title={!canActivate && !noCost ? `Solde insuffisant (${boostBalance} boost${boostBalance > 1 ? "s" : ""} disponible${boostBalance > 1 ? "s" : ""})` : ""}
                          >
                            {isTnd ? "Acheter" : "Activer"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cat.note && (
                <div className="bst-cat__card-note" style={{ color: cat.color, background: cat.lightColor }}>
                  📉 {cat.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Synthèse finale ── */}
      <div className="bst-cat__summary">
        <div className="bst-cat__summary-item">
          <span className="bst-cat__summary-emoji">💶</span>
          <div><strong>1 TND = 1 Refresh</strong><span>La micro-action au prix d'un café</span></div>
        </div>
        <div className="bst-cat__summary-sep"/>
        <div className="bst-cat__summary-item">
          <span className="bst-cat__summary-emoji">⚡</span>
          <div><strong>5 TND = 1 Boost = 5 Refresh</strong><span>La devise de la plateforme</span></div>
        </div>
        <div className="bst-cat__summary-sep"/>
        <div className="bst-cat__summary-item">
          <span className="bst-cat__summary-emoji">🔁</span>
          <div><strong>Convertible librement</strong><span>Visibilité · Crédibilité · Prospection · Analyse · Marketing</span></div>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   BOOST CONVERTER
───────────────────────────────────────────── */
// Taux par rapport au boost : 1 boost = X unités
const CONV_RATES = {
  boost:      1,
  superBoost: 1,
  refresh:    5,
  annonce:    1 / 3,   // 3 boosts = 1 annonce
  lead:       1 / 4,   // 4 boosts = 1 lead
  spotlight:  1 / 2,   // 2 boosts = 1 spotlight
};

const CONV_FIELDS = [
  { key: "boost",      label: "Boosts",               icon: "⚡", color: "#f59e0b", bg: "#fffbeb" },
  { key: "superBoost", label: "Super Boosts",          icon: "🚀", color: "#d97706", bg: "#fef3c7" },
  { key: "refresh",    label: "Refresh",               icon: "🔄", color: "#3b82f6", bg: "#eff6ff" },
  { key: "annonce",    label: "Annonces supp.",        icon: "📦", color: "#10b981", bg: "#ecfdf5" },
  { key: "lead",       label: "Leads qualifiés",       icon: "🎯", color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "spotlight",  label: "Spotlights",            icon: "⭐", color: "#f97316", bg: "#fff7ed" },
];

function BoostConverter() {
  const [values, setValues] = useState({ boost:"", superBoost:"", refresh:"", annonce:"", lead:"", spotlight:"" });

  function handleChange(key, raw) {
    const num = raw === "" ? "" : parseFloat(raw);
    if (raw !== "" && (isNaN(num) || num < 0)) return;
    const next = { boost:"", superBoost:"", refresh:"", annonce:"", lead:"", spotlight:"" };
    next[key] = raw;
    if (raw !== "" && !isNaN(num)) {
      const boosts = num / CONV_RATES[key];
      CONV_FIELDS.forEach(f => {
        if (f.key === key) return;
        const val = boosts * CONV_RATES[f.key];
        next[f.key] = Number.isInteger(val) ? String(val) : val.toFixed(2).replace(/\.?0+$/, "");
      });
    }
    setValues(next);
  }

  return (
    <div className="bst-converter">
      <div className="bst-converter__header">
        <ArrowLeftRight size={16}/>
        <span>Convertisseur de boosts</span>
        <span className="bst-converter__hint">Entrez une valeur dans n'importe quel champ</span>
      </div>
      <div className="bst-converter__grid">
        {CONV_FIELDS.map(f => (
          <div key={f.key} className="bst-converter__field" style={{ "--fc": f.color, "--fb": f.bg }}>
            <label className="bst-converter__label">
              <span className="bst-converter__icon">{f.icon}</span>
              {f.label}
            </label>
            <div className="bst-converter__input-wrap">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={values[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                className="bst-converter__input"
              />
            </div>
            {f.key !== "boost" && values[f.key] !== "" && !isNaN(parseFloat(values[f.key])) && (
              <div className="bst-converter__equiv">
                = {Math.ceil(parseFloat(values[f.key]) / CONV_RATES[f.key])} boost{Math.ceil(parseFloat(values[f.key]) / CONV_RATES[f.key]) > 1 ? "s" : ""}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="bst-converter__rates">
        <span>Taux de base :</span>
        <span>1 boost = 1 super boost</span>
        <span>·</span>
        <span>1 boost = 5 refresh</span>
        <span>·</span>
        <span>3 boosts = 1 annonce</span>
        <span>·</span>
        <span>4 boosts = 1 lead</span>
        <span>·</span>
        <span>2 boosts = 1 spotlight</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function BoosterPage() {
  const navigate = useNavigate();
  const [activeSegment, setActiveSegment] = useState("particulier");
  const [billing, setBilling] = useState("monthly");
  const [boostBalance, setBoostBalance] = useState(0);
  const [superBoostBalance, setSuperBoostBalance] = useState(0);
  const [refreshBalance, setRefreshBalance] = useState(0);
  const [annoncesActive, setAnnoncesActive] = useState(0);
  const [leadsBalance, setLeadsBalance] = useState(0);
  const [spotlightBalance, setSpotlightBalance] = useState(0);
  const [balanceFlash, setBalanceFlash] = useState(null); // "up" | "down"
  const flashTimer = useRef(null);
  const seg = SEGMENTS.find(s => s.id === activeSegment);

  function triggerFlash(dir) {
    setBalanceFlash(dir);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setBalanceFlash(null), 800);
  }
  function handleBuyBoosts(qty) {
    setBoostBalance(b => b + qty);
    triggerFlash("up");
  }
  function handleActivate(cost, meta) {
    setBoostBalance(b => Math.max(0, b - cost));
    triggerFlash("down");
    if (meta?.superboost) setSuperBoostBalance(b => b + meta.superboost);
    if (meta?.refresh)    setRefreshBalance(b => b + meta.refresh);
    if (meta?.annonce)    setAnnoncesActive(b => b + meta.annonce);
    if (meta?.lead)       setLeadsBalance(b => b + meta.lead);
    if (meta?.spotlight)  setSpotlightBalance(b => b + meta.spotlight);
  }

  const isCatalogue = activeSegment === "catalogue";
  const hasBillingToggle = !["catalogue"].includes(activeSegment);
  const plans = PLANS[activeSegment] || [];

  /* For "particulier" (2 plans) use 4 cols so cards have same width as 4-plan segments */
  const gridCols = activeSegment === "particulier"
    ? "repeat(4, 1fr)"
    : `repeat(${plans.length}, 1fr)`;

  return (
    <>
      <Navbar/>
      <div className="bst-page">

        {/* ── Hero ── */}
        <div className="bst-hero">
          <img src={heroBannerImg} alt="" className="bst-hero__img"/>
          <div className="bst-hero__overlay"/>
          <div className="bst-hero__inner">
            <div className="bst-hero__badge"><Rocket size={13}/> Visibilité maximale</div>
            <h1 className="bst-hero__title">Boostez vos annonces,<br/><em>multipliez vos contacts</em></h1>
            <p className="bst-hero__sub">5 profils · Plans adaptés à chaque besoin · Freemium + Boosts/Refresh + Abonnements Pro</p>
            <div className="bst-hero__stats">
              <div className="bst-hero__stat"><strong>×8</strong><span>plus de vues</span></div>
              <div className="bst-hero__stat-sep"/>
              <div className="bst-hero__stat"><strong>×3</strong><span>plus de contacts</span></div>
              <div className="bst-hero__stat-sep"/>
              <div className="bst-hero__stat"><strong>10</strong><span>annonces gratuites</span></div>
              <div className="bst-hero__stat-sep"/>
              <div className="bst-hero__stat"><strong>5 TND</strong><span>le boost</span></div>
            </div>
            <div className="bst-hero__promo">
              <Gift size={15}/> Gratuit jusqu'à 10 annonces/mois · 3 mois d'essai offerts au lancement
            </div>
          </div>
        </div>

        {/* ── Segment tabs ── */}
        <div className="bst-tabs-wrap">
          <div className="bst-tabs">
            {SEGMENTS.map(s => {
              const Ico = s.icon;
              const active = activeSegment === s.id;
              return (
                <button key={s.id}
                  className={`bst-tab${active ? " bst-tab--active" : ""}`}
                  style={active ? { borderColor: s.color, color: s.color, background: s.lightColor } : {}}
                  onClick={() => setActiveSegment(s.id)}>
                  <Ico size={16} style={{ flexShrink: 0 }}/>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="bst-content">

          {/* Segment header */}
          <div className="bst-seg-head">
            <div className="bst-seg-head__icon" style={{ background: seg.lightColor, color: seg.color }}>
              <seg.icon size={22}/>
            </div>
            <div>
              <h2 className="bst-seg-head__title">{seg.label}</h2>
              <p className="bst-seg-head__sub">
                {activeSegment === "particulier" && "Freelances · 3 niveaux · 3 mois d'essai gratuit sur tous les plans payants au lancement"}
                {activeSegment === "agent"       && "Freelances · 4 niveaux · 3 mois d'essai gratuit sur tous les plans payants au lancement"}
                {activeSegment === "agence"      && "Structures établies · Multi-comptes · Tableau de bord centralisé"}
                {activeSegment === "promoteur"   && "Par projet actif · Visibilité maximale · Outils de lancement"}
                {activeSegment === "partenaire"  && "Référencement géolocalisé · Leads qualifiés"}
                {activeSegment === "catalogue"   && "1 boost = 5 TND · 6 catégories de services · Packs avec remise jusqu'à 10%"}
              </p>
            </div>
            {isCatalogue && (
              <div className="bst-seg-head__catalogue-wallet">
                {/* 1. Solde Boosts (monnaie) */}
                <div className={`bst-balance${balanceFlash === "up" ? " bst-balance--up" : balanceFlash === "down" ? " bst-balance--down" : ""}`}>
                  <div className="bst-balance__icon-wrap"><Zap size={22} className="bst-balance__zap"/></div>
                  <div className="bst-balance__body">
                    <span className="bst-balance__label">Solde Boosts</span>
                    <div className="bst-balance__count-row">
                      <span className="bst-balance__value">{boostBalance}</span>
                      <span className="bst-balance__unit">boost{boostBalance !== 1 ? "s" : ""}</span>
                      {balanceFlash === "up"   && <span className="bst-balance__delta bst-balance__delta--up">▲</span>}
                      {balanceFlash === "down" && <span className="bst-balance__delta bst-balance__delta--down">▼</span>}
                    </div>
                  </div>
                </div>
                {/* 2. Solde Super Boosts */}
                <div className="bst-balance bst-balance--superboost">
                  <div className="bst-balance__icon-wrap"><TrendingUp size={22} className="bst-balance__zap"/></div>
                  <div className="bst-balance__body">
                    <span className="bst-balance__label">Solde Super Boosts</span>
                    <div className="bst-balance__count-row">
                      <span className="bst-balance__value">{superBoostBalance}</span>
                      <span className="bst-balance__unit">super boost{superBoostBalance !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
                {/* 3. Solde Refresh */}
                <div className="bst-balance bst-balance--refresh">
                  <div className="bst-balance__icon-wrap"><RefreshCw size={22} className="bst-balance__zap"/></div>
                  <div className="bst-balance__body">
                    <span className="bst-balance__label">Solde Refresh</span>
                    <div className="bst-balance__count-row">
                      <span className="bst-balance__value">{refreshBalance}</span>
                      <span className="bst-balance__unit">refresh</span>
                    </div>
                  </div>
                </div>
                {/* 4. Solde Annonces */}
                <div className="bst-balance bst-balance--annonces">
                  <div className="bst-balance__icon-wrap"><Package size={22} className="bst-balance__zap"/></div>
                  <div className="bst-balance__body">
                    <span className="bst-balance__label">Solde Annonces</span>
                    <div className="bst-balance__count-row">
                      <span className="bst-balance__value">{annoncesActive}</span>
                      <span className="bst-balance__unit">annonce{annoncesActive !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
                {/* 5. Solde Leads */}
                <div className="bst-balance bst-balance--leads">
                  <div className="bst-balance__icon-wrap"><Target size={22} className="bst-balance__zap"/></div>
                  <div className="bst-balance__body">
                    <span className="bst-balance__label">Solde Leads</span>
                    <div className="bst-balance__count-row">
                      <span className="bst-balance__value">{leadsBalance}</span>
                      <span className="bst-balance__unit">lead{leadsBalance !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
                {/* 6. Solde Spotlight */}
                <div className="bst-balance bst-balance--spotlight">
                  <div className="bst-balance__icon-wrap"><Star size={22} className="bst-balance__zap"/></div>
                  <div className="bst-balance__body">
                    <span className="bst-balance__label">Solde Spotlight</span>
                    <div className="bst-balance__count-row">
                      <span className="bst-balance__value">{spotlightBalance}</span>
                      <span className="bst-balance__unit">spotlight{spotlightBalance !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Convertisseur de boosts */}
          {isCatalogue && <BoostConverter />}

          {/* Billing toggle */}
          {hasBillingToggle && (
            <div className="bst-billing-toggle">
              <button
                className={`bst-billing-btn${billing === "monthly" ? " bst-billing-btn--on" : ""}`}
                onClick={() => setBilling("monthly")}
                style={billing === "monthly" ? { background: seg.color, color: "#fff" } : {}}>
                Mensuel
              </button>
              <button
                className={`bst-billing-btn${billing === "annual" ? " bst-billing-btn--on" : ""}`}
                onClick={() => setBilling("annual")}
                style={billing === "annual" ? { background: seg.color, color: "#fff" } : {}}>
                Annuel
                <span className="bst-billing-save">−17%</span>
              </button>
            </div>
          )}

          {/* Catalogue Boosts */}
          {isCatalogue && <BoostCatalogue boostBalance={boostBalance} onBuyBoosts={handleBuyBoosts} onActivate={handleActivate}/>}

          {/* Plans grid */}
          {!isCatalogue && (
            <div className="bst-plans-grid" style={{ gridTemplateColumns: gridCols }}>
              {plans.map(plan => (
                <PlanCard key={plan.id} plan={plan} color={seg.color} billing={billing}/>
              ))}
            </div>
          )}

          {/* Argumentaire */}
          {!isCatalogue && (
            <div className="bst-quote">
              <div className="bst-quote__bar" style={{ background: seg.color }}/>
              <p className="bst-quote__text">
                {activeSegment === "particulier" && "LOCALIZI.TN, c'est gratuit pour toujours. Publiez votre bien en 2 minutes, soyez vu par des milliers d'acheteurs dans votre quartier. Et si vous voulez passer en première ligne, un boost à 5 TND suffit."}
                {activeSegment === "agent"       && "LOCALIZI.TN vous donne les mêmes outils qu'une grande agence, sans en payer le prix. Profil vérifié, CRM, leads qualifiés dans votre secteur exclusif et des boosts quand vous en avez besoin — 3 mois d'essai gratuit, aucun engagement."}
                {activeSegment === "agence"      && "Agency Pro centralise toute votre activité : chaque agent a son profil, vous avez votre tableau de bord. Vos leads sont qualifiés avant de vous parvenir."}
                {activeSegment === "promoteur"   && "Avec Localizi Premium, vos projets sont sous les projecteurs dès le lancement. Stats en temps réel, notifications ciblées par budget et zone géographique, espace boutique dédié, vous touchez les acheteurs au bon moment."}
                {activeSegment === "partenaire"  && "Avec Localizi.tn, gagnez en visibilité et contractualisez rapidement."}
              </p>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .bst-page {
          min-height: 100vh; background: #f8fafc;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          padding-bottom: 80px;
        }

        /* ── Hero ── */
        .bst-hero {
          position: relative; overflow: hidden;
          height: 520px; background: #0f172a;
        }
        .bst-hero__img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover; object-position: center 30%;
          opacity: .42;
        }
        .bst-hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(15,23,42,.92) 0%, rgba(15,23,42,.5) 55%, rgba(15,23,42,.15) 100%);
        }
        .bst-hero__inner {
          position: relative; max-width: 1200px; margin: 0 auto;
          padding: 32px 48px; height: 100%; display: flex; flex-direction: column; justify-content: center;
        }
        .bst-hero__badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 20px;
          background: rgba(245,158,11,.2); border: 1px solid rgba(245,158,11,.4);
          color: #fcd34d; font-size: 12px; font-weight: 700; margin-bottom: 12px; width: fit-content;
        }
        .bst-hero__title {
          font-size: 40px; font-weight: 900; color: #fff;
          line-height: 1.15; margin-bottom: 10px;
        }
        .bst-hero__title em { font-style: normal; color: #fbbf24; }
        .bst-hero__sub { font-size: 15px; color: rgba(255,255,255,.6); margin-bottom: 20px; line-height: 1.6; }
        .bst-hero__stats { display: flex; align-items: center; margin-bottom: 18px; }
        .bst-hero__stat { display: flex; flex-direction: column; padding: 0 22px; }
        .bst-hero__stat:first-child { padding-left: 0; }
        .bst-hero__stat strong { font-size: 28px; font-weight: 900; color: #6366f1; line-height: 1; }
        .bst-hero__stat span { font-size: 11.5px; color: rgba(255,255,255,.5); margin-top: 2px; }
        .bst-hero__stat-sep { width: 1px; height: 38px; background: rgba(255,255,255,.15); }
        .bst-hero__promo {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(251,191,36,.15); border: 1px solid rgba(251,191,36,.35);
          border-radius: 10px; padding: 8px 18px; color: #fcd34d; font-size: 13px; font-weight: 600;
          width: fit-content;
        }

        /* ── Boost Balance widget (in seg-head) ── */
        .bst-balance {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 22px;
          border-radius: 16px;
          border: 2px solid #fde68a;
          background: #fefce8;
          transition: background .25s, border-color .25s;
          flex-shrink: 0;
        }
        .bst-balance--up   { background: #dcfce7; border-color: #16a34a; animation: bst-bal-pulse .55s ease; }
        .bst-balance--down { background: #fff1f2; border-color: #e11d48; animation: bst-bal-pulse .55s ease; }
        @keyframes bst-bal-pulse {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .bst-balance__icon-wrap {
          width: 40px; height: 40px; border-radius: 10px;
          background: #fbbf24; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: 0 2px 8px rgba(245,158,11,.35);
        }
        .bst-balance--up   .bst-balance__icon-wrap { background: #16a34a; }
        .bst-balance--down .bst-balance__icon-wrap { background: #e11d48; }
        .bst-balance__zap { color: #fff; }
        .bst-balance__body { display: flex; flex-direction: column; gap: 1px; }
        .bst-balance__label {
          font-size: 13px; font-weight: 800; letter-spacing: .05em;
          text-transform: uppercase; color: #92400e;
        }
        .bst-balance--up   .bst-balance__label { color: #166534; }
        .bst-balance--down .bst-balance__label { color: #9f1239; }
        .bst-balance__count-row { display: flex; align-items: baseline; gap: 6px; }
        .bst-balance__value { font-size: 32px; font-weight: 900; color: #f59e0b; line-height: 1; }
        .bst-balance--up   .bst-balance__value { color: #16a34a; }
        .bst-balance--down .bst-balance__value { color: #e11d48; }
        .bst-balance__unit { font-size: 15px; font-weight: 700; color: #a16207; }
        .bst-balance__delta {
          font-size: 14px; font-weight: 900;
          animation: bst-delta-fade .7s ease forwards;
        }
        .bst-balance__delta--up   { color: #16a34a; }
        .bst-balance__delta--down { color: #e11d48; }
        @keyframes bst-delta-fade {
          0%   { opacity: 0; transform: translateY(4px); }
          20%  { opacity: 1; transform: translateY(0); }
          70%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-6px); }
        }

        /* ── Activer button in category table ── */
        .bst-cat__td-act { width: 90px; text-align: center; }
        .bst-cat__act-btn {
          padding: 5px 14px; border-radius: 6px; border: none;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: inherit; color: #fff; transition: opacity .15s, transform .1s;
        }
        .bst-cat__act-btn:hover:not(.bst-cat__act-btn--disabled) { opacity: .85; transform: scale(1.03); }
        .bst-cat__act-btn--disabled {
          background: #e2e8f0 !important; color: #94a3b8;
          cursor: not-allowed;
        }

        /* ── Segment tabs ── */
        .bst-tabs-wrap {
          background: #fff; border-bottom: 1px solid #e5e7eb;
          position: sticky; top: 60px; z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,.06);
        }
        .bst-tabs {
          max-width: 1200px; margin: 0 auto; padding: 0 48px;
          display: flex; gap: 4px; overflow-x: auto;
        }
        .bst-tab {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 14px 20px; font-size: 13.5px; font-weight: 600;
          background: none; border: none; border-bottom: 3px solid transparent;
          color: #64748b; cursor: pointer; font-family: inherit;
          white-space: nowrap; transition: all .15s; flex-shrink: 0;
        }
        .bst-tab:hover { color: #0f172a; background: #f8fafc; }
        .bst-tab--active { border-bottom-color: currentColor; }

        /* ── Content ── */
        .bst-content { max-width: 100%; margin: 0; padding: 48px 200px 0 200px; }

        /* Segment head */
        .bst-seg-head {
          display: flex; align-items: center; gap: 18px; margin-bottom: 28px; flex-wrap: wrap;
        }
        .bst-seg-head__icon {
          width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .bst-seg-head__title { font-size: 26px; font-weight: 900; color: #0f172a; }
        .bst-seg-head__sub { font-size: 14px; color: #64748b; margin-top: 3px; }
        /* ── Catalogue wallet wrapper (4 soldes en ligne) ── */
        .bst-seg-head__catalogue-wallet {
          margin-left: auto; display: flex; flex-direction: row; align-items: center;
          gap: 10px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;
        }

        /* ── Solde Annonces (vert) ── */
        .bst-balance--annonces { background: #f0fdf4; border-color: #86efac; }
        .bst-balance--annonces .bst-balance__icon-wrap { background: #22c55e; box-shadow: 0 2px 8px rgba(34,197,94,.35); }
        .bst-balance--annonces .bst-balance__label { color: #166534; }
        .bst-balance--annonces .bst-balance__value { color: #16a34a; }
        .bst-balance--annonces .bst-balance__unit  { color: #15803d; }

        /* ── Solde Super Boosts (ambre chaud) ── */
        .bst-balance--superboost { background: #fffbeb; border-color: #fcd34d; }
        .bst-balance--superboost .bst-balance__icon-wrap { background: #d97706; box-shadow: 0 2px 8px rgba(217,119,6,.35); }
        .bst-balance--superboost .bst-balance__label { color: #92400e; }
        .bst-balance--superboost .bst-balance__value { color: #b45309; }
        .bst-balance--superboost .bst-balance__unit  { color: #92400e; }

        /* ── Solde Refresh (bleu) ── */
        .bst-balance--refresh { background: #eff6ff; border-color: #93c5fd; }
        .bst-balance--refresh .bst-balance__icon-wrap { background: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,.35); }
        .bst-balance--refresh .bst-balance__label { color: #1e40af; }
        .bst-balance--refresh .bst-balance__value { color: #2563eb; }
        .bst-balance--refresh .bst-balance__unit  { color: #1d4ed8; }

        /* ── Solde Spotlight (orange) ── */
        .bst-balance--spotlight { background: #fff7ed; border-color: #fdba74; }
        .bst-balance--spotlight .bst-balance__icon-wrap { background: #ea580c; box-shadow: 0 2px 8px rgba(234,88,12,.35); }
        .bst-balance--spotlight .bst-balance__label { color: #9a3412; }
        .bst-balance--spotlight .bst-balance__value { color: #c2410c; }
        .bst-balance--spotlight .bst-balance__unit  { color: #b45309; }

        /* ── Solde Leads (violet) ── */
        .bst-balance--leads { background: #f5f3ff; border-color: #c4b5fd; }
        .bst-balance--leads .bst-balance__icon-wrap { background: #8b5cf6; box-shadow: 0 2px 8px rgba(139,92,246,.35); }
        .bst-balance--leads .bst-balance__label { color: #4c1d95; }
        .bst-balance--leads .bst-balance__value { color: #7c3aed; }
        .bst-balance--leads .bst-balance__unit  { color: #6d28d9; }

        /* ── Convertisseur de boosts ── */
        .bst-converter {
          margin: 0 0 28px 0;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px 24px 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,.05);
        }
        .bst-converter__header {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: #374151;
          margin-bottom: 16px;
        }
        .bst-converter__hint {
          font-size: 12px; font-weight: 400; color: #9ca3af; margin-left: 4px;
        }
        .bst-converter__grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }
        @media (max-width: 900px) {
          .bst-converter__grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 560px) {
          .bst-converter__grid { grid-template-columns: repeat(2, 1fr); }
        }
        .bst-converter__field {
          display: flex; flex-direction: column; gap: 4px;
          background: var(--fb); border: 1.5px solid var(--fc);
          border-radius: 12px; padding: 10px 12px 8px;
        }
        .bst-converter__label {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; color: var(--fc);
          text-transform: uppercase; letter-spacing: .4px;
        }
        .bst-converter__icon { font-size: 13px; }
        .bst-converter__input-wrap { position: relative; }
        .bst-converter__input {
          width: 100%; box-sizing: border-box;
          border: 1.5px solid color-mix(in srgb, var(--fc) 30%, transparent);
          border-radius: 8px; background: #fff;
          padding: 6px 8px; font-size: 18px; font-weight: 800;
          color: var(--fc); outline: none; text-align: center;
          transition: border-color .15s;
        }
        .bst-converter__input:focus { border-color: var(--fc); }
        .bst-converter__input::placeholder { color: #d1d5db; font-weight: 400; font-size: 16px; }
        .bst-converter__input::-webkit-inner-spin-button,
        .bst-converter__input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .bst-converter__equiv {
          font-size: 11px; font-weight: 600; color: var(--fc);
          text-align: center; opacity: .8;
        }
        .bst-converter__rates {
          display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
          margin-top: 14px; padding-top: 12px;
          border-top: 1px dashed #e5e7eb;
          font-size: 11px; color: #9ca3af;
        }
        .bst-converter__rates span:first-child { font-weight: 700; color: #6b7280; }

        .bst-seg-head__alert {
          margin-left: auto; display: inline-flex; align-items: center; gap: 7px;
          background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px;
          padding: 8px 16px; color: #92400e; font-size: 12.5px; font-weight: 700;
        }

        /* Billing toggle */
        .bst-billing-toggle {
          display: inline-flex; align-items: center; gap: 4px;
          background: #f1f5f9; border-radius: 10px; padding: 4px;
          margin-bottom: 28px;
        }
        .bst-billing-btn {
          padding: 7px 22px; border-radius: 8px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
          color: #64748b; background: transparent; transition: all .15s;
          display: inline-flex; align-items: center; gap: 7px;
        }
        .bst-billing-btn--on { box-shadow: 0 2px 8px rgba(0,0,0,.10); }
        .bst-billing-save {
          font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 5px;
          background: #dcfce7; color: #15803d;
        }

        /* Plans grid */
        .bst-plans-grid {
          display: grid; gap: 22px; margin-bottom: 36px;
          grid-template-columns: repeat(4, 1fr);
        }

        /* Plan card */
        .bst-plan-card {
          position: relative; display: flex; flex-direction: column;
          background: #fff; border: 2px solid #e5e7eb; border-radius: 20px;
          padding: 32px 28px 28px; transition: all .22s;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .bst-plan-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.09); }
        .bst-plan-card--popular { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.12); }
        .bst-plan-card__pop {
          position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 18px; border-radius: 20px; font-size: 11.5px; font-weight: 800;
          color: #fff; white-space: nowrap;
        }
        .bst-plan-card__badge {
          display: inline-block; align-self: flex-start;
          padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
          margin-bottom: 12px;
        }
        .bst-plan-card__head { margin-bottom: 20px; }
        .bst-plan-card__name { font-size: 17px; font-weight: 800; margin-bottom: 8px; }
        .bst-plan-card__price { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
        .bst-plan-card__price-val { font-size: 38px; font-weight: 900; line-height: 1; }
        .bst-plan-card__price-per { font-size: 13px; color: #94a3b8; font-weight: 600; }
        .bst-plan-card__price-crossed {
          width: 100%; display: flex; align-items: center; gap: 8px; margin-bottom: 2px;
        }
        .bst-plan-card__price-crossed span:first-child {
          font-size: 20px; font-weight: 700; color: #94a3b8;
          text-decoration: line-through;
          text-decoration-thickness: 2px;
        }
        .bst-plan-card__price-save {
          font-size: 11px; font-weight: 800; color: #fff;
          padding: 2px 7px; border-radius: 20px; letter-spacing: .03em;
        }

        .bst-plan-card__features {
          list-style: none; padding: 0; margin: 0 0 24px;
          display: flex; flex-direction: column; gap: 11px; flex: 1;
        }
        .bst-plan-card__features li {
          display: flex; align-items: center; gap: 9px;
          font-size: 13.5px; color: #374151; font-weight: 500;
        }
        .bst-plan-card__feat--off li,
        .bst-plan-card__features li.bst-plan-card__feat--off { color: #94a3b8; }
        .bst-plan-card__features em { font-style: normal; color: #94a3b8; font-size: 12px; }

        .bst-plan-card__cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 13px 20px; border-radius: 12px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit; border: 2px solid transparent;
          transition: all .15s; width: 100%;
        }
        .bst-plan-card__cta--fill { color: #fff; border-color: transparent; }
        .bst-plan-card__cta--fill:hover { opacity: .88; transform: translateY(-1px); }
        .bst-plan-card__cta--outline { background: transparent; }
        .bst-plan-card__cta--outline:hover { opacity: .75; }

        /* ── Quote ── */
        .bst-quote {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 24px 28px; background: #fff; border-radius: 14px;
          border: 1px solid #e5e7eb; margin-top: 8px;
        }
        .bst-quote__bar { width: 4px; border-radius: 4px; flex-shrink: 0; align-self: stretch; min-height: 40px; }
        .bst-quote__text { font-size: 14.5px; color: #374151; line-height: 1.7; font-style: italic; margin: 0; }

        /* ── Boost Catalogue ── */
        .bst-cat { padding-bottom: 40px; }

        /* ── Intro 3 produits ── */
        .bst-cat__products-intro {
          margin-bottom: 36px;
        }
        .bst-cat__products-intro-title {
          font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 6px;
        }
        .bst-cat__products-intro-sub {
          font-size: 14px; color: #64748b; margin: 0 0 24px;
        }
        .bst-cat__products-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;
        }
        .bst-cat__product-card {
          border-radius: 16px; border: 1.5px solid #e2e8f0; background: #fff;
          padding: 20px; display: flex; flex-direction: column; gap: 10px;
        }
        .bst-cat__product-card--boost    { border-color: #fde68a; background: #fffbeb; }
        .bst-cat__product-card--refresh  { border-color: #bfdbfe; background: #eff6ff; }
        .bst-cat__product-card--spotlight{ border-color: #fed7aa; background: #fff7ed; }
        .bst-cat__product-icon {
          width: 40px; height: 40px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .bst-cat__product-name {
          font-size: 21px; font-weight: 900; color: #0f172a;
        }
        .bst-cat__product-price {
          font-size: 14px; font-weight: 700; color: #64748b;
          background: rgba(0,0,0,.06); border-radius: 20px; padding: 3px 12px; display: inline-block; align-self: flex-start;
        }
        .bst-cat__product-desc {
          font-size: 15px; color: #475569; line-height: 1.65;
        }
        .bst-cat__product-desc strong { color: #0f172a; }
        .bst-cat__product-list {
          list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px;
        }
        .bst-cat__product-list li {
          font-size: 14px; color: #374151; display: flex; align-items: center; gap: 7px;
        }
        .bst-cat__product-list svg { color: #10b981; flex-shrink: 0; }
        .bst-cat__product-tip {
          font-size: 13px; color: #64748b; background: rgba(0,0,0,.04);
          border-radius: 8px; padding: 10px 12px; display: flex; gap: 6px; align-items: flex-start; line-height: 1.55;
        }

        /* ── Bundle recommandé ── */
        .bst-cat__bundle-recommend {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
          background: linear-gradient(135deg, #eef2ff, #f0fdf4);
          border: 1.5px solid #a5b4fc; border-radius: 16px; padding: 18px 24px;
        }
        .bst-cat__bundle-recommend-left { flex: 1; min-width: 200px; }
        .bst-cat__bundle-recommend-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: #4f46e5; color: #fff; border-radius: 20px;
          padding: 2px 10px; font-size: 10px; font-weight: 800; margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: .05em;
        }
        .bst-cat__bundle-recommend-title {
          font-size: 17px; font-weight: 900; color: #1e1b4b; margin-bottom: 3px;
        }
        .bst-cat__bundle-recommend-sub {
          font-size: 12.5px; color: #4338ca;
        }
        .bst-cat__bundle-recommend-sub strong { color: #1e1b4b; }
        .bst-cat__bundle-recommend-savings { text-align: right; }
        .bst-cat__bundle-recommend-old {
          font-size: 12px; color: #94a3b8; text-decoration: line-through;
        }
        .bst-cat__bundle-recommend-gain {
          font-size: 16px; font-weight: 900; color: #16a34a;
        }
        .bst-cat__bundle-recommend-btn {
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff; border: none; border-radius: 10px;
          padding: 11px 22px; font-size: 13px; font-weight: 800; cursor: pointer;
          box-shadow: 0 4px 14px rgba(99,102,241,.35); transition: opacity .15s;
          white-space: nowrap; font-family: inherit;
        }
        .bst-cat__bundle-recommend-btn:hover { opacity: .88; }

        @media (max-width: 768px) {
          .bst-cat__products-grid { grid-template-columns: 1fr; }
          .bst-cat__bundle-recommend { flex-direction: column; align-items: flex-start; }
          .bst-cat__bundle-recommend-savings { text-align: left; }
        }

        .bst-cat__principle {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
          background: linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%);
          border: 1.5px solid #fde68a; border-radius: 18px;
          padding: 24px 32px; margin-bottom: 32px;
        }
        .bst-cat__principle-left { display: flex; align-items: center; gap: 16px; }
        .bst-cat__principle-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex; align-items: center; justify-content: center;
          color: #fff; flex-shrink: 0; box-shadow: 0 4px 14px rgba(245,158,11,.4);
        }
        .bst-cat__principle-title { font-size: 20px; font-weight: 900; color: #92400e; }
        .bst-cat__principle-sub { font-size: 13px; color: #b45309; margin-top: 3px; }
        .bst-cat__principle-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .bst-cat__pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 700;
          background: rgba(255,255,255,.75); border: 1px solid #fde68a; color: #92400e;
        }
        .bst-cat__pill--gold { background: #f59e0b; color: #fff; border-color: transparent; }

        .bst-cat__grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; margin-bottom: 32px;
        }
        .bst-cat__card {
          background: #fff; border: 1.5px solid #e5e7eb; border-radius: 16px;
          overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.04);
          display: flex; flex-direction: column;
        }
        .bst-cat__card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.08); transform: translateY(-2px); transition: all .2s; }
        .bst-cat__card-head {
          display: flex; align-items: center; gap: 14px; padding: 16px 20px;
        }
        .bst-cat__card-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .bst-cat__card-title { font-size: 15px; font-weight: 800; }
        .bst-cat__card-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
        .bst-cat__card-desc {
          font-size: 13px; color: #64748b; line-height: 1.6;
          padding: 14px 20px 10px; margin: 0; border-bottom: 1px solid #f1f5f9;
        }

        .bst-cat__table {
          width: 100%; border-collapse: collapse; font-size: 13px;
        }
        .bst-cat__table thead tr { background: #f8fafc; }
        .bst-cat__table th {
          padding: 9px 14px; text-align: left; font-size: 11px; font-weight: 700;
          color: #94a3b8; text-transform: uppercase; letter-spacing: .04em;
          border-bottom: 1px solid #e5e7eb;
        }
        .bst-cat__table tbody tr:hover { background: #fafafa; }
        .bst-cat__table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .bst-cat__table tbody tr:last-child td { border-bottom: none; }
        .bst-cat__td-name { font-weight: 700; color: #1e293b; white-space: nowrap; }
        .bst-cat__td-cost { white-space: nowrap; }
        .bst-cat__td-dur { color: #64748b; font-size: 12px; white-space: nowrap; }
        .bst-cat__td-eff { color: #475569; line-height: 1.5; }
        .bst-cat__cost-badge {
          display: inline-block; padding: 3px 10px; border-radius: 20px;
          font-size: 12px; font-weight: 800;
        }
        .bst-cat__card-note {
          padding: 10px 16px; font-size: 12px; font-weight: 600;
          border-top: 1px solid #f1f5f9; line-height: 1.5;
        }
        .bst-cat__best {
          display: inline-block; background: #dcfce7; color: #15803d;
          border-radius: 10px; padding: 1px 8px; font-size: 11px; font-weight: 700;
          margin-left: 6px; vertical-align: middle;
        }
        .bst-cat__discount-badge {
          display: inline-block; background: #dcfce7; color: #15803d;
          border-radius: 20px; padding: 2px 9px; font-size: 12px; font-weight: 800;
        }

        /* Packs */
        /* ── Packs Hero ── */
        .bst-cat__packs-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
          border-radius: 24px; padding: 40px 44px 36px; margin-bottom: 36px;
          box-shadow: 0 8px 40px rgba(15,23,42,.28);
        }
        .bst-cat__packs-hero-label {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(251,191,36,.15); color: #fbbf24; border: 1px solid rgba(251,191,36,.3);
          border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: 14px;
        }
        .bst-cat__packs-hero-title {
          font-size: 30px; font-weight: 900; color: #fff; margin: 0 0 6px; line-height: 1.2;
        }
        .bst-cat__packs-hero-sub {
          font-size: 14px; color: rgba(255,255,255,.55); margin: 0 0 30px;
        }
        /* ── Labels de groupe au-dessus des 6 cartes ── */
        .bst-cat__packs-grouplabels {
          display: flex; gap: 10px; margin-bottom: 10px;
        }
        .bst-cat__packs-grouplabel {
          flex: 3; display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em;
          color: rgba(251,191,36,.8);
        }
        .bst-cat__packs-grouplabel--blue   { color: rgba(96,165,250,.8); }
        .bst-cat__packs-grouplabel--green  { color: rgba(34,197,94,.85); }
        .bst-cat__packs-grouplabel--violet { color: rgba(167,139,250,.85); }
        /* Séparateur vertical entre les 2 groupes */
        .bst-cat__packs-sep {
          width: 1px; background: rgba(255,255,255,.12); flex-shrink: 0; align-self: stretch; margin: 0 4px;
        }
        /* Boutons */
        .bst-cat__pricing-btn {
          margin-top: 12px; width: 100%; padding: 9px 0;
          border-radius: 10px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 800; font-family: inherit;
          background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e1b4b;
          transition: opacity .15s, transform .12s;
        }
        .bst-cat__pricing-btn:hover { opacity: .88; transform: translateY(-1px); }
        .bst-cat__pricing-btn--blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
        .bst-cat__pricing-btn--green  { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }
        .bst-cat__pricing-btn--violet { background: linear-gradient(135deg, #a78bfa, #7c3aed); color: #fff; }
        .bst-cat__packs-col-label {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em;
          color: rgba(251,191,36,.8); margin-bottom: 10px;
        }
        .bst-cat__packs-col-label--blue { color: rgba(96,165,250,.8); }

        /* Espace réservé pour aligner les cartes sans badge */
        .bst-cat__pricing-badge-placeholder { height: 24px; flex-shrink: 0; }
        /* Spacer qui pousse le bouton en bas */
        .bst-cat__pricing-grow { flex: 1; min-height: 12px; }

        /* Ligne unique des 6 cartes — grid pour hauteur égale garantie */
        /* DOIT être après .bst-cat__pricing-row pour prendre priorité */
        .bst-cat__pricing-row--6 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 2px 1fr 1fr 1fr;
          gap: 8px;
          align-items: stretch;
        }
        .bst-cat__pricing-row--6 .bst-cat__pricing-card,
        .bst-cat__pricing-row--6 .bst-cat__boost-coin-card {
          width: auto !important; min-width: 0; flex-shrink: unset;
        }
        /* Ligne unique des 12 cartes — 4 groupes de 3 avec séparateurs */
        .bst-cat__pricing-row--12 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 2px 1fr 1fr 1fr 2px 1fr 1fr 1fr 2px 1fr 1fr 1fr;
          gap: 8px;
          align-items: stretch;
        }
        .bst-cat__pricing-row--12 .bst-cat__pricing-card {
          width: auto !important; min-width: 0; flex-shrink: unset;
          display: flex; flex-direction: column; text-align: center;
        }
        /* Labels en 4 colonnes alignées sur la grille 12 */
        .bst-cat__packs-grouplabels--4 {
          display: grid;
          grid-template-columns: 3fr 3fr 3fr 3fr;
          gap: 8px;
        }
        .bst-cat__packs-grouplabels--4 .bst-cat__packs-grouplabel { flex: unset; }
        /* ── Cartes monnaie Boost (achat de la devise) ── */
        .bst-cat__boost-coin-card {
          background: linear-gradient(160deg, #1e1440 0%, #0f0a2a 100%);
          border: 1.5px solid rgba(251,191,36,.35);
          border-radius: 14px; padding: 0 0 16px 0; position: relative;
          transition: transform .15s; display: flex; flex-direction: column; text-align: center;
          box-shadow: 0 4px 20px rgba(251,191,36,.08), inset 0 1px 0 rgba(251,191,36,.12);
          overflow: hidden;
        }
        .bst-cat__boost-coin-card:hover { transform: translateY(-2px); }
        .bst-cat__boost-coin-card--mid {
          border-color: rgba(251,191,36,.55);
          box-shadow: 0 4px 20px rgba(251,191,36,.14), inset 0 1px 0 rgba(251,191,36,.2);
        }
        .bst-cat__boost-coin-card--best {
          border-color: #fbbf24;
          box-shadow: 0 0 0 1px rgba(251,191,36,.4), 0 8px 24px rgba(251,191,36,.2), inset 0 1px 0 rgba(251,191,36,.3);
          background: linear-gradient(160deg, #241a50 0%, #120d35 100%);
        }
        .bst-cat__boost-coin-best-badge {
          position: absolute; top: 0; right: 0;
          background: linear-gradient(90deg, #f59e0b, #d97706);
          color: #1e1b4b; font-size: 9px; font-weight: 900;
          padding: 3px 10px; border-radius: 0 14px 0 10px;
          display: flex; align-items: center; gap: 3px; letter-spacing: .04em;
        }
        .bst-cat__boost-coin-header {
          background: linear-gradient(90deg, rgba(251,191,36,.15), rgba(245,158,11,.08));
          border-bottom: 1px solid rgba(251,191,36,.2);
          padding: 7px 14px; margin-bottom: 14px;
          font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em;
          color: #fbbf24; display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .bst-cat__boost-coin-name {
          font-size: 15px; font-weight: 900; color: #fef3c7; letter-spacing: .02em; margin-bottom: 6px;
        }
        .bst-cat__boost-coin-qty {
          font-size: 12px; color: rgba(254,243,199,.6); margin-bottom: 10px;
        }
        .bst-cat__boost-coin-qty span { font-size: 28px; font-weight: 900; color: #fbbf24; display: block; line-height: 1.1; }
        .bst-cat__boost-coin-price {
          font-size: 22px; font-weight: 900; color: #fff; margin-bottom: 2px;
        }
        .bst-cat__boost-coin-price span { font-size: 13px; font-weight: 700; color: rgba(255,255,255,.6); }
        .bst-cat__boost-coin-unit {
          font-size: 11px; color: rgba(254,243,199,.5); margin-bottom: 4px;
        }
        .bst-cat__boost-coin-disc {
          font-size: 11px; font-weight: 800; color: #fbbf24; margin-bottom: 4px;
        }
        .bst-cat__boost-coin-disc--none {
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,.3); margin-bottom: 4px;
        }
        .bst-cat__boost-coin-btn {
          margin: 12px 14px 0; padding: 9px 0;
          border-radius: 10px; border: 1.5px solid #fbbf24; cursor: pointer;
          font-size: 13px; font-weight: 800; font-family: inherit;
          background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e1b4b;
          transition: opacity .15s, transform .12s;
        }
        .bst-cat__boost-coin-btn:hover { opacity: .88; transform: translateY(-1px); }

        .bst-cat__pricing-card {
          background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.12);
          border-radius: 14px; padding: 16px 14px; position: relative; transition: transform .15s;
        }
        .bst-cat__pricing-card:hover { transform: translateY(-2px); }
        .bst-cat__pricing-card--mid {
          background: rgba(251,191,36,.08); border-color: rgba(251,191,36,.25);
        }
        .bst-cat__pricing-card--best {
          background: linear-gradient(135deg, rgba(251,191,36,.18), rgba(245,158,11,.12));
          border-color: #fbbf24; box-shadow: 0 0 0 1px rgba(251,191,36,.3), 0 6px 18px rgba(251,191,36,.15);
        }
        .bst-cat__pricing-card--refresh-hero {
          background: rgba(59,130,246,.1); border-color: rgba(96,165,250,.35);
          box-shadow: 0 0 0 1px rgba(96,165,250,.2), 0 6px 18px rgba(59,130,246,.1);
          width: 300px; flex-shrink: 0; text-align: center; height: 100%;
        }
        .bst-cat__pricing-name {
          font-size: 13px; font-weight: 800; color: rgba(255,255,255,.5);
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px;
        }
        .bst-cat__pricing-name--blue   { color: rgba(96,165,250,.6); }
        .bst-cat__pricing-name--green  { color: rgba(74,222,128,.75); }
        .bst-cat__pricing-name--violet { color: rgba(167,139,250,.75); }

        /* ── Packs Annonces / Leads cards ── */
        .bst-cat__pricing-row--3 {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: stretch;
        }
        .bst-cat__pricing-row--3 .bst-cat__pricing-card {
          width: auto !important; min-width: 0; flex-shrink: unset;
          display: flex; flex-direction: column; text-align: center;
        }
        .bst-cat__pricing-row--3 .bst-cat__boost-coin-card {
          width: auto !important; min-width: 0;
        }
        /* Variante agrandie pour les cartes monnaie sur leur propre ligne */
        .bst-cat__boost-coin-card--lg {
          min-height: 220px;
        }
        .bst-cat__boost-coin-card--lg .bst-cat__boost-coin-header {
          font-size: 11px; padding: 9px 18px;
        }
        .bst-cat__boost-coin-card--lg .bst-cat__boost-coin-name {
          font-size: 20px; margin-bottom: 8px;
        }
        .bst-cat__boost-coin-card--lg .bst-cat__boost-coin-qty span {
          font-size: 38px;
        }
        .bst-cat__boost-coin-card--lg .bst-cat__boost-coin-price {
          font-size: 28px; margin-top: 6px;
        }
        .bst-cat__boost-coin-card--lg .bst-cat__boost-coin-btn {
          margin: 16px 18px 0; padding: 11px 0; font-size: 14px;
        }
        .bst-cat__pricing-card--annonce {
          background: rgba(34,197,94,.1); border-color: rgba(74,222,128,.35);
          box-shadow: 0 0 0 1px rgba(74,222,128,.2), 0 6px 18px rgba(34,197,94,.1);
        }
        .bst-cat__pricing-card--annonce-mid  { background: rgba(34,197,94,.14); border-color: rgba(74,222,128,.5); }
        .bst-cat__pricing-card--annonce-best { background: rgba(34,197,94,.18); border-color: #4ade80;
          box-shadow: 0 0 0 1.5px rgba(74,222,128,.45), 0 8px 24px rgba(34,197,94,.2); }
        .bst-cat__pricing-price--green { color: #4ade80; }
        .bst-cat__pricing-disc--green  { color: rgba(74,222,128,.7); }
        .bst-cat__pricing-best-badge--green { background: #22c55e; color: #fff; }

        .bst-cat__pricing-card--lead {
          background: rgba(139,92,246,.1); border-color: rgba(167,139,250,.35);
          box-shadow: 0 0 0 1px rgba(167,139,250,.2), 0 6px 18px rgba(139,92,246,.1);
        }
        .bst-cat__pricing-card--lead-mid  { background: rgba(139,92,246,.14); border-color: rgba(167,139,250,.5); }
        .bst-cat__pricing-card--lead-best { background: rgba(139,92,246,.18); border-color: #a78bfa;
          box-shadow: 0 0 0 1.5px rgba(167,139,250,.45), 0 8px 24px rgba(139,92,246,.2); }
        .bst-cat__pricing-price--violet { color: #c4b5fd; }
        .bst-cat__pricing-disc--violet  { color: rgba(167,139,250,.7); }
        .bst-cat__pricing-best-badge--violet { background: #7c3aed; color: #fff; }
        .bst-cat__pricing-best-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: #fbbf24; color: #1e1b4b; border-radius: 20px;
          padding: 2px 8px; font-size: 10px; font-weight: 800;
          margin-bottom: 8px; text-transform: uppercase; letter-spacing: .04em;
        }
        .bst-cat__pricing-best-badge--blue {
          background: #3b82f6; color: #fff;
        }
        .bst-cat__pricing-qty {
          font-size: 26px; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 2px;
        }
        .bst-cat__pricing-qty span { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.6); }
        .bst-cat__pricing-price {
          font-size: 32px; font-weight: 900; color: #fbbf24; line-height: 1.1; margin-bottom: 3px;
        }
        .bst-cat__pricing-price--blue { color: #60a5fa; }
        .bst-cat__pricing-price--blue span { color: rgba(96,165,250,.7); }
        .bst-cat__pricing-price span { font-size: 16px; font-weight: 700; color: rgba(251,191,36,.7); }
        .bst-cat__pricing-unit {
          font-size: 11px; color: rgba(255,255,255,.4); margin-bottom: 8px;
        }
        .bst-cat__pricing-disc {
          display: inline-block; background: #22c55e; color: #fff;
          border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 800;
        }
        .bst-cat__pricing-disc--none {
          background: rgba(255,255,255,.1); color: rgba(255,255,255,.4); font-weight: 600;
        }
        .bst-cat__pricing-disc--blue   { background: rgba(59,130,246,.2);  color: #60a5fa;  font-weight: 700; }
        .bst-cat__pricing-disc--green  { background: rgba(34,197,94,.2);   color: #4ade80;  font-weight: 700; }
        .bst-cat__pricing-disc--violet { background: rgba(139,92,246,.2);  color: #c4b5fd;  font-weight: 700; }
        .bst-cat__pricing-card--refresh-mid {
          background: rgba(59,130,246,.14); border-color: rgba(96,165,250,.4);
        }
        .bst-cat__pricing-card--refresh-best {
          background: linear-gradient(135deg, rgba(59,130,246,.22), rgba(37,99,235,.14));
          border-color: #60a5fa; box-shadow: 0 0 0 1px rgba(96,165,250,.3), 0 6px 18px rgba(59,130,246,.15);
        }

        /* ── Spotlight cards ── */
        .bst-cat__pricing-card--spotlight {
          background: rgba(234,88,12,.1); border-color: rgba(251,146,60,.35);
          box-shadow: 0 0 0 1px rgba(251,146,60,.2), 0 6px 18px rgba(234,88,12,.1);
        }
        .bst-cat__pricing-card--spotlight-mid  { background: rgba(234,88,12,.14); border-color: rgba(251,146,60,.5); }
        .bst-cat__pricing-card--spotlight-best {
          background: rgba(234,88,12,.18); border-color: #fb923c;
          box-shadow: 0 0 0 1.5px rgba(251,146,60,.45), 0 8px 24px rgba(234,88,12,.2);
        }
        .bst-cat__pricing-name--orange { color: rgba(251,146,60,.8); }
        .bst-cat__pricing-price--orange { color: #fb923c; }
        .bst-cat__pricing-price--orange span { color: rgba(251,146,60,.6); }
        .bst-cat__pricing-disc--orange  { background: rgba(234,88,12,.2); color: #fb923c; font-weight: 700; }
        .bst-cat__pricing-best-badge--orange { background: #ea580c; color: #fff; }
        .bst-cat__pill--orange { background: rgba(234,88,12,.15); border-color: rgba(251,146,60,.3); color: #fb923c; }

        /* ── Pack Bundle card ── */
        .bst-cat__pricing-card--bundle {
          background: linear-gradient(135deg, rgba(99,102,241,.15), rgba(16,185,129,.08));
          border-color: rgba(99,102,241,.5);
          box-shadow: 0 0 0 1.5px rgba(99,102,241,.3), 0 8px 28px rgba(99,102,241,.15);
          flex-direction: row; gap: 16px; align-items: center; text-align: left; padding: 18px 24px;
        }
        .bst-cat__pricing-name--dark { color: rgba(199,210,254,.8); }
        .bst-cat__pricing-price--dark { color: #a5b4fc; }
        .bst-cat__pricing-price--dark span { color: rgba(165,180,252,.6); }
        .bst-cat__pricing-disc--dark  { background: rgba(99,102,241,.25); color: #a5b4fc; font-weight: 700; }
        .bst-cat__pricing-best-badge--dark { background: #4f46e5; color: #fff; }
        .bst-cat__pricing-btn--dark {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 4px 14px rgba(99,102,241,.4);
        }
        .bst-cat__pricing-btn--dark:hover { background: linear-gradient(135deg, #818cf8, #6366f1); }
        .bst-cat__packs-grouplabel--orange { background: rgba(234,88,12,.12); color: #fb923c; border-color: rgba(251,146,60,.25); }
        .bst-cat__packs-grouplabel--dark   { background: rgba(99,102,241,.12); color: #a5b4fc; border-color: rgba(99,102,241,.25); }
        .bst-cat__pricing-btn--orange {
          background: linear-gradient(135deg, #f97316, #ea580c);
          box-shadow: 0 4px 14px rgba(234,88,12,.35);
        }
        .bst-cat__pricing-btn--orange:hover { background: linear-gradient(135deg, #fb923c, #f97316); }
        .bst-cat__refresh-hero-desc {
          display: flex; align-items: center; gap: 5px; margin-top: 10px;
          font-size: 11px; color: rgba(96,165,250,.7); font-weight: 600; line-height: 1.4;
        }

        /* Summary */
        .bst-cat__summary {
          display: flex; align-items: center; justify-content: center; gap: 0;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          border-radius: 18px; padding: 28px 40px; flex-wrap: wrap;
        }
        .bst-cat__summary-item {
          display: flex; align-items: center; gap: 14px; padding: 0 32px; flex: 1; min-width: 220px;
        }
        .bst-cat__summary-emoji { font-size: 28px; flex-shrink: 0; }
        .bst-cat__summary-item strong { display: block; color: #fbbf24; font-size: 15px; font-weight: 800; }
        .bst-cat__summary-item span { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 3px; display: block; }
        .bst-cat__summary-sep { width: 1px; height: 60px; background: rgba(255,255,255,.12); flex-shrink: 0; }

        /* ── Responsive ── */
        @media (max-width: 1400px) {
          .bst-content { padding: 48px 80px 0; }
          .bst-plans-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .bst-hero { height: auto; min-height: 380px; }
          .bst-hero__inner { padding: 28px 24px; }
          .bst-hero__title { font-size: 30px; }
          .bst-tabs { padding: 0 24px; }
          .bst-content { padding: 32px 24px 0; }
          .bst-plans-grid { grid-template-columns: 1fr !important; }
          .bst-cat__grid { grid-template-columns: 1fr; }
          .bst-cat__pricing-row { flex-wrap: wrap; }
          .bst-cat__pricing-row .bst-cat__pricing-card,
          .bst-cat__pricing-card--refresh-hero { width: 100%; }
          .bst-cat__packs-hero { padding: 28px 20px 24px; }
          .bst-cat__principle { flex-direction: column; align-items: flex-start; }
          .bst-cat__summary { flex-direction: column; gap: 20px; }
          .bst-cat__summary-sep { width: 60px; height: 1px; }
        }
        @media (max-width: 540px) {
          .bst-hero__stats { flex-wrap: wrap; gap: 12px; }
          .bst-hero__stat-sep { display: none; }
          .bst-tab { padding: 12px 14px; font-size: 12px; }
        }
      `}</style>
    </>
  );
}
