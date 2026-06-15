import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQS = [
  {
    cat: "Publier une annonce",
    items: [
      { q: "Comment publier une annonce sur Localizi.tn ?", a: "Créez un compte, connectez-vous, puis cliquez sur « Publier une annonce ». Remplissez les informations du bien, ajoutez des photos et soumettez. Votre annonce sera examinée par notre équipe avant publication." },
      { q: "Combien coûte la publication d'une annonce ?", a: "La publication de base est entièrement gratuite. Des options payantes (boost, mise en avant) sont disponibles pour augmenter la visibilité de votre annonce." },
      { q: "Sous quel délai mon annonce sera-t-elle publiée ?", a: "Nos équipes examinent les annonces sous 24 à 48 heures ouvrables. Vous recevez une notification par email dès la validation ou en cas de refus avec les raisons." },
      { q: "Puis-je publier anonymement ?", a: "Oui. Lors de la création de l'annonce, cochez l'option « Publication anonyme ». Vos coordonnées resteront masquées et les visiteurs pourront vous contacter via notre formulaire sécurisé." },
      { q: "Comment modifier ou supprimer mon annonce ?", a: "Accédez à votre tableau de bord > Mes annonces, puis cliquez sur « Modifier » ou « Supprimer » en regard de l'annonce concernée." },
    ],
  },
  {
    cat: "Rechercher un bien",
    items: [
      { q: "Comment utiliser la carte interactive ?", a: "Rendez-vous sur la page Carte et utilisez les filtres (type de bien, prix, surface, etc.) pour affiner votre recherche. Cliquez sur un marqueur pour voir les détails de l'annonce." },
      { q: "Comment enregistrer une alerte email ?", a: "Configurez vos critères de recherche sur la carte ou depuis la page d'accueil, puis cliquez sur « Enregistrer cette alerte ». Vous recevrez un email dès qu'une nouvelle annonce correspondante est publiée." },
      { q: "Comment ajouter un bien à mes favoris ?", a: "Cliquez sur l'icône cœur sur la carte ou sur la page de détail de l'annonce. Vous devez être connecté pour sauvegarder des favoris." },
      { q: "Comment comparer plusieurs annonces ?", a: "Sur la carte, cliquez sur le bouton « Comparer » d'une annonce pour l'ajouter au comparateur. Vous pouvez comparer jusqu'à 4 annonces simultanément." },
      { q: "Puis-je filtrer par ancienneté de publication ?", a: "Oui. Dans les filtres de la carte, vous trouverez un filtre « Publiée depuis » qui vous permet de voir uniquement les annonces récentes (ex. : moins de 7 jours, 30 jours, etc.)." },
    ],
  },
  {
    cat: "Compte et profil",
    items: [
      { q: "Comment créer un compte ?", a: "Cliquez sur « Créer un compte » dans la barre de navigation. Vous pouvez vous inscrire avec votre email ou via votre compte Google." },
      { q: "J'ai oublié mon mot de passe. Que faire ?", a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ? ». Entrez votre email et vous recevrez un lien de réinitialisation." },
      { q: "Quelle est la différence entre Particulier et Professionnel ?", a: "Un Particulier publie ses propres biens. Un Professionnel (Agence ou Promoteur) dispose d'un espace dédié pour gérer plusieurs biens et peut être référencé dans l'annuaire des agents." },
    ],
  },
  {
    cat: "Trouver un agent",
    items: [
      { q: "Comment trouver un agent immobilier sur Localizi.tn ?", a: "Accédez à la page « Trouver un agent » depuis le menu. Vous pouvez rechercher par nom ou par couverture géographique (gouvernorat / délégation)." },
      { q: "Comment un professionnel peut-il s'inscrire sur Localizi.tn ?", a: "Lors de l'inscription, choisissez « Professionnel » puis « Agence/Agent » ou « Promoteur ». Votre profil sera visible dans l'annuaire des professionnels." },
    ],
  },
  {
    cat: "Sécurité et données",
    items: [
      { q: "Mes données personnelles sont-elles protégées ?", a: "Oui. Nous appliquons les meilleures pratiques de sécurité (chiffrement HTTPS, mots de passe hachés). Consultez notre Politique de confidentialité pour plus de détails." },
      { q: "Comment signaler une annonce frauduleuse ?", a: "Contactez-nous via le formulaire de contact en précisant l'ID de l'annonce. Notre équipe traitera votre signalement sous 24 heures." },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{borderBottom:"1px solid #f1f5f9", overflow:"hidden"}}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 0", background:"none", border:"none", cursor:"pointer",
          textAlign:"left", fontFamily:"'Poppins',system-ui,sans-serif",
        }}
      >
        <span style={{fontWeight:600, fontSize:14.5, color:"#0f172a", lineHeight:1.5, paddingRight:16}}>{q}</span>
        {open
          ? <ChevronUp size={18} style={{color:"#6366f1", flexShrink:0}}/>
          : <ChevronDown size={18} style={{color:"#94a3b8", flexShrink:0}}/>
        }
      </button>
      {open && (
        <div style={{paddingBottom:18, fontSize:14, color:"#475569", lineHeight:1.75}}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div style={{minHeight:"100vh", background:"#f8fafc", fontFamily:"'Poppins',system-ui,sans-serif"}}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
        padding:"60px 24px 48px", textAlign:"center",
      }}>
        <div style={{display:"inline-flex", alignItems:"center", justifyContent:"center",
          width:56, height:56, borderRadius:"50%",
          background:"rgba(99,102,241,.2)", marginBottom:18}}>
          <HelpCircle size={28} color="#818cf8"/>
        </div>
        <h1 style={{fontSize:32, fontWeight:800, color:"#fff", margin:"0 0 12px", letterSpacing:"-.02em"}}>
          Questions fréquentes
        </h1>
        <p style={{fontSize:15, color:"rgba(255,255,255,.6)", maxWidth:560, margin:"0 auto"}}>
          Trouvez rapidement les réponses à vos questions sur Localizi.tn.
        </p>
      </div>

      {/* Content */}
      <div style={{maxWidth:800, margin:"0 auto", padding:"48px 24px 80px"}}>
        {FAQS.map(section => (
          <div key={section.cat} style={{marginBottom:40}}>
            <h2 style={{
              fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em",
              color:"#6366f1", marginBottom:16,
            }}>{section.cat}</h2>
            <div style={{background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"0 24px"}}>
              {section.items.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        <div style={{
          background:"linear-gradient(135deg,#6366f1,#4f46e5)", borderRadius:16,
          padding:"32px", textAlign:"center", marginTop:20,
        }}>
          <p style={{color:"#fff", fontWeight:700, fontSize:16, margin:"0 0 8px"}}>
            Vous n'avez pas trouvé votre réponse ?
          </p>
          <p style={{color:"rgba(255,255,255,.75)", fontSize:14, margin:"0 0 20px"}}>
            Notre équipe est disponible pour vous aider.
          </p>
          <a href="/contact" style={{
            display:"inline-block", background:"#fff", color:"#4f46e5",
            fontWeight:700, fontSize:14, padding:"11px 28px", borderRadius:10,
            textDecoration:"none", transition:"opacity .15s",
          }}>
            Nous contacter
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
