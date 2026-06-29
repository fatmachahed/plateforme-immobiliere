import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ChevronDown, ChevronUp, HelpCircle, MapPin, ArrowRight } from "lucide-react";

const FAQS = [
  {
    cat: "À propos de Localizi.tn",
    items: [
      {
        q: "Qu'est-ce que Localizi.tn ?",
        a: "Localizi.tn est une plateforme immobilière tunisienne qui met en relation les particuliers, agents immobiliers, agences et promoteurs. Elle permet de publier des annonces de vente et de location, de rechercher des biens sur une carte interactive et de recevoir des alertes personnalisées."
      },
      {
        q: "Est-ce que Localizi.tn est une agence immobilière ?",
        a: "Non. Localizi.tn n'est pas une agence immobilière. C'est une plateforme d'annonces immobilières qui facilite la mise en relation directe entre vendeurs/bailleurs et acheteurs/locataires. Nous n'intervenons pas dans les transactions."
      },
      {
        q: "Localizi.tn est-elle gratuite ?",
        a: "Oui, entièrement gratuite. Aucun paiement n'est demandé pour publier ou consulter des annonces, que vous soyez particulier, agent immobilier, agence immobilière ou promoteur. Il n'existe aucun abonnement, aucune commission et aucune carte bancaire n'est requise."
      },
      {
        q: "Qui peut utiliser Localizi.tn ?",
        a: "Tout le monde ! Les particuliers qui souhaitent vendre ou louer leur bien, les agents et agences immobilières qui gèrent un portefeuille d'annonces, et les promoteurs immobiliers qui souhaitent présenter leurs projets neufs. La plateforme couvre les 24 gouvernorats de la Tunisie."
      },
    ],
  },
  {
    cat: "Compte et connexion",
    items: [
      {
        q: "Comment créer un compte ?",
        a: "Cliquez sur « S'inscrire » dans la barre de navigation. Remplissez les champs requis (nom, email, mot de passe), acceptez les conditions d'utilisation et validez. Vous recevrez un email de confirmation pour activer votre compte."
      },
      {
        q: "Puis-je créer plusieurs comptes avec le même email ?",
        a: "Non. Un compte correspond à un email unique. Si vous avez besoin de plusieurs comptes, utilisez des adresses email différentes."
      },
      {
        q: "J'ai oublié mon mot de passe. Que faire ?",
        a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ? ». Saisissez votre adresse email et vous recevrez un lien de réinitialisation. Vérifiez votre dossier spam si vous ne le recevez pas."
      },
      {
        q: "Puis-je rester connecté sans ressaisir mes identifiants ?",
        a: "Oui, en cochant « Se souvenir de moi » sur la page de connexion. Votre session restera active sur l'appareil utilisé."
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Contactez notre support via le formulaire de contact en demandant la suppression de votre compte. Votre demande sera traitée dans les 48 heures."
      },
    ],
  },
  {
    cat: "Publier une annonce",
    items: [
      {
        q: "Comment publier une annonce sur Localizi.tn ?",
        a: "Connectez-vous, puis cliquez sur « Publier une annonce ». Suivez les étapes : choisissez la catégorie (vente/location), renseignez les informations du bien (type, surface, prix, localisation), ajoutez des photos et soumettez. Votre annonce sera examinée par notre équipe avant publication."
      },
      {
        q: "Combien coûte la publication ?",
        a: "La publication est entièrement gratuite pour tous les profils : particuliers, agents immobiliers, agences immobilières et promoteurs immobiliers. Aucun paiement n'est demandé."
      },
      {
        q: "Sous quel délai mon annonce sera-t-elle publiée ?",
        a: "Notre équipe examine les annonces sous 24 à 48 heures ouvrables. Vous recevrez une notification par email dès que votre annonce est approuvée, ou en cas de refus avec les raisons détaillées."
      },
      {
        q: "Quelles sont les conditions pour qu'une annonce soit acceptée ?",
        a: "Le bien doit exister physiquement et être disponible. L'annonce doit contenir des informations exactes (surface, prix, localisation, photos). Les photos doivent être de bonne qualité, sans logo, sans filigrane et correspondre au bien présenté. Aucune coordonnée de contact ne doit figurer dans la description."
      },
      {
        q: "Quelles annonces sont interdites ?",
        a: "Sont interdites : les annonces pour des biens fictifs, les biens non disponibles, les annonces avec des informations trompeuses, les photos volées ou ne correspondant pas au bien, et tout contenu offensant ou discriminatoire."
      },
      {
        q: "Comment modifier ou supprimer mon annonce ?",
        a: "Accédez à votre tableau de bord > « Mes annonces », puis cliquez sur « Modifier » ou « Supprimer » en regard de l'annonce concernée. Toute modification importante peut nécessiter une nouvelle validation."
      },
      {
        q: "Mon annonce a été refusée. Que faire ?",
        a: "Vous recevrez un email détaillant les raisons du refus. Corrigez les points signalés et republiez votre annonce. Si vous avez des questions, contactez notre support."
      },
    ],
  },
  {
    cat: "Rechercher un bien",
    items: [
      {
        q: "Comment utiliser la carte interactive ?",
        a: "Rendez-vous sur la page Carte. Utilisez les filtres (type de bien, prix, surface, gouvernorat, délégation, etc.) pour affiner votre recherche. Cliquez sur un marqueur pour voir les détails de l'annonce. Vous pouvez zoomer par zone pour affiner votre localisation."
      },
      {
        q: "Comment enregistrer une alerte email ?",
        a: "Configurez vos critères de recherche puis cliquez sur « Enregistrer cette alerte » depuis la page de recherche ou votre tableau de bord. Vous recevrez un email automatique dès qu'une nouvelle annonce correspondant à vos critères est publiée."
      },
      {
        q: "Comment ajouter un bien à mes favoris ?",
        a: "Cliquez sur l'icône cœur sur la carte ou sur la page de détail de l'annonce. Vous devez être connecté pour sauvegarder des favoris. Retrouvez tous vos favoris dans votre tableau de bord."
      },
      {
        q: "Comment comparer plusieurs annonces ?",
        a: "Depuis la carte, cliquez sur « Comparer » pour ajouter une annonce au comparateur. Vous pouvez comparer jusqu'à 4 annonces côte à côte en termes de surface, prix, localisation et caractéristiques."
      },
    ],
  },
  {
    cat: "Professionnels (Agences & Promoteurs)",
    items: [
      {
        q: "Comment un professionnel s'inscrit-il sur Localizi.tn ?",
        a: "Lors de l'inscription, choisissez le profil « Professionnel » puis sélectionnez « Agence/Agent » ou « Promoteur ». Votre profil sera visible dans l'annuaire des professionnels de Localizi.tn."
      },
      {
        q: "Les agences et promoteurs paient-ils pour publier ?",
        a: "Non. La publication est gratuite pour tous, y compris les agences immobilières et les promoteurs immobiliers. Aucun abonnement n'est requis."
      },
      {
        q: "Comment trouver un agent immobilier sur Localizi.tn ?",
        a: "Accédez à la page « Trouver un agent » depuis le menu. Vous pouvez rechercher par nom, par gouvernorat ou par délégation de couverture."
      },
      {
        q: "Un promoteur peut-il publier des biens neufs ?",
        a: "Oui. Les promoteurs immobiliers inscrits sur Localizi.tn peuvent publier leurs projets immobiliers neufs et les présenter à des milliers d'acheteurs potentiels, sans aucun frais."
      },
    ],
  },
  {
    cat: "Sécurité et données personnelles",
    items: [
      {
        q: "Mes données personnelles sont-elles protégées ?",
        a: "Oui. Nous appliquons les meilleures pratiques de sécurité : chiffrement HTTPS, mots de passe hachés, accès sécurisés. Consultez notre Politique de confidentialité pour plus de détails sur la gestion de vos données."
      },
      {
        q: "Comment signaler une annonce frauduleuse ou suspecte ?",
        a: "Depuis la page de l'annonce, cliquez sur « Signaler un problème » ou contactez-nous via le formulaire de contact en précisant la référence de l'annonce. Notre équipe traitera votre signalement sous 24 heures."
      },
      {
        q: "Mes coordonnées sont-elles visibles sur mes annonces ?",
        a: "Seules les informations que vous choisissez de partager lors de la création de votre annonce sont visibles. Vous pouvez également choisir de masquer votre numéro et d'utiliser uniquement le formulaire de contact de la plateforme."
      },
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
        <div style={{paddingBottom:18, fontSize:14, color:"#475569", lineHeight:1.8}}>
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
        <div style={{
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          width:56, height:56, borderRadius:"50%",
          background:"rgba(99,102,241,.2)", marginBottom:18,
        }}>
          <HelpCircle size={28} color="#818cf8"/>
        </div>
        <h1 style={{fontSize:32, fontWeight:800, color:"#fff", margin:"0 0 12px", letterSpacing:"-.02em"}}>
          Questions fréquentes
        </h1>
        <p style={{fontSize:15, color:"rgba(255,255,255,.6)", maxWidth:560, margin:"0 auto"}}>
          Trouvez rapidement les réponses à vos questions sur Localizi.tn.
        </p>
      </div>

      {/* Bannière gratuit */}
      <div style={{
        background:"linear-gradient(90deg,#6366f1,#4f46e5)",
        padding:"14px 24px", textAlign:"center",
      }}>
        <p style={{margin:0, color:"#fff", fontWeight:700, fontSize:14}}>
          ✓ Localizi.tn est 100% gratuite — aucun paiement demandé pour les particuliers, agents, agences et promoteurs
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

        {/* ── Dossier spécial ── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em",
            color: "#6366f1", marginBottom: 16,
          }}>Dossiers</h2>
          <Link to="/faq/geolocalisation-immobilier" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0",
              padding: "20px 24px", display: "flex", alignItems: "center", gap: 18,
              transition: "box-shadow .2s, border-color .2s",
              cursor: "pointer",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,.15)"; e.currentTarget.style.borderColor = "#a5b4fc"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg,#6366f1,#818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(99,102,241,.35)",
              }}>
                <MapPin size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>
                  Dossier spécial
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>
                  La géolocalisation des biens immobiliers
                </div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  Enjeux, exemples internationaux, avantages et retours de professionnels.
                </div>
              </div>
              <ArrowRight size={18} style={{ color: "#94a3b8", flexShrink: 0 }} />
            </div>
          </Link>
        </div>

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
            textDecoration:"none",
          }}>
            Nous contacter
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
