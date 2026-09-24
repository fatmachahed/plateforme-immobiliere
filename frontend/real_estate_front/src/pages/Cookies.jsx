import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Cookie, Settings, Check } from "lucide-react";
import { getConsent, setConsent } from "../utils/analytics";

const CHOIX = {
  all:       "Tous les cookies acceptés (y compris mesure d'audience : Google Analytics, Microsoft Clarity)",
  essential: "Cookies essentiels uniquement — aucune mesure d'audience",
};

/** Choix actuel du visiteur + bouton « Modifier mes choix » (retrait du consentement à tout moment). */
function CookiePreferences() {
  const [choix, setChoix] = useState(getConsent);
  const [edition, setEdition] = useState(false);

  const choisir = value => {
    setConsent(value);          // recharge la page si le consentement est retiré
    setChoix(value);
    setEdition(false);
  };

  const btn = actif => ({
    display:"inline-flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:9, fontSize:13.5, fontWeight:600,
    fontFamily:"inherit", cursor:"pointer", border: actif ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
    background: actif ? "#eef2ff" : "#fff", color: actif ? "#4338ca" : "#374151",
  });

  return (
    <div id="preferences" style={{ background:"#fff", border:"1.5px solid #c7d2fe", borderRadius:12, padding:"18px 20px", marginBottom:36 }}>
      <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:"0 0 6px" }}>Vos préférences</p>
      <p style={{ fontSize:14, color:"#374151", margin:"0 0 14px", lineHeight:1.6 }}>
        {CHOIX[choix] || "Vous n'avez pas encore fait de choix."}
      </p>
      {!edition ? (
        <button onClick={() => setEdition(true)} style={btn(true)}>
          <Settings size={15}/> Modifier mes choix
        </button>
      ) : (
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={() => choisir("all")} style={btn(choix === "all")}>
            {choix === "all" && <Check size={15}/>} Accepter tous les cookies
          </button>
          <button onClick={() => choisir("essential")} style={btn(choix === "essential")}>
            {choix === "essential" && <Check size={15}/>} Essentiels uniquement
          </button>
          <button onClick={() => setEdition(false)} style={{ ...btn(false), border:"none", color:"#64748b" }}>Annuler</button>
        </div>
      )}
    </div>
  );
}

export default function Cookies() {
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'Poppins',system-ui,sans-serif" }}>
      <Navbar />
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", padding:"60px 24px 48px", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:56, height:56, borderRadius:"50%", background:"rgba(99,102,241,.2)", marginBottom:18 }}>
          <Cookie size={28} color="#818cf8"/>
        </div>
        <h1 style={{ fontSize:32, fontWeight:800, color:"#fff", margin:"0 0 12px", letterSpacing:"-.02em" }}>Politique de cookies</h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,.5)", margin:0 }}>Dernière mise à jour : juin 2026</p>
      </div>
      <div style={{ maxWidth:820, margin:"0 auto", padding:"48px 24px 80px" }}>

        <CookiePreferences />

        {[
          {
            title: "Qu'est-ce qu'un cookie ?",
            content: "Un cookie est un petit fichier texte enregistré sur votre ordinateur ou appareil mobile lors de votre visite sur un site web. Il permet au site de mémoriser vos préférences et d'améliorer votre expérience de navigation.",
          },
          {
            title: "Les cookies que nous utilisons",
            items: [
              { name: "Cookies essentiels", desc: "Nécessaires au fonctionnement du site (session, authentification, sécurité). Ils ne peuvent pas être désactivés." },
              { name: "Cookies de préférences", desc: "Mémorisent vos choix (langue, devise affichée, filtres de recherche) pour personnaliser votre expérience." },
              { name: "Cookies analytiques", desc: "Nous aident à comprendre comment les visiteurs utilisent le site (pages consultées, durée de session). Les données sont anonymisées." },
              { name: "Cookies de performance", desc: "Permettent d'optimiser la vitesse de chargement et la qualité de l'expérience sur notre plateforme." },
            ],
          },
          {
            title: "Durée de conservation",
            content: "Les cookies de session sont supprimés automatiquement à la fermeture de votre navigateur. Les cookies persistants ont une durée de vie maximale de 13 mois.",
          },
          {
            title: "Gestion de vos cookies",
            content: "Vous pouvez modifier votre choix à tout moment avec le bouton « Modifier mes choix » en haut de cette page. Vous pouvez aussi régler les paramètres de votre navigateur pour refuser les cookies ou être averti avant de les accepter. Les principaux navigateurs proposent des options de gestion des cookies dans leurs réglages :\n• Google Chrome : Paramètres → Confidentialité et sécurité → Cookies\n• Firefox : Paramètres → Vie privée et sécurité\n• Safari : Préférences → Confidentialité\n• Edge : Paramètres → Cookies et autorisations de site\n\nAttention : le refus de certains cookies peut altérer le bon fonctionnement du site.",
          },
          {
            title: "Cookies tiers",
            content: "Localizi.tn peut intégrer des services tiers (Google OAuth, Google Analytics et Microsoft Clarity — uniquement si vous acceptez tous les cookies —, cartes interactives) qui déposent leurs propres cookies. Ces cookies sont régis par la politique de confidentialité de ces tiers, indépendamment de notre politique.",
          },
          {
            title: "Contact",
            content: "Pour toute question concernant notre utilisation des cookies, contactez-nous à : privacy@Localizi.tn",
          },
        ].map(({ title, content, items }) => (
          <div key={title} style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:"#0f172a", marginBottom:10, paddingBottom:8, borderBottom:"1px solid #f1f5f9" }}>{title}</h2>
            {content && content.split("\n").map((line, i) => (
              <p key={i} style={{ fontSize:14, color:"#374151", lineHeight:1.8, margin:"0 0 6px" }}>{line}</p>
            ))}
            {items && (
              <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:8 }}>
                {items.map(it => (
                  <div key={it.name} style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 16px" }}>
                    <p style={{ fontSize:14,fontWeight:700,color:"#0f172a",margin:"0 0 4px" }}>{it.name}</p>
                    <p style={{ fontSize:13.5,color:"#64748b",margin:0,lineHeight:1.6 }}>{it.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
