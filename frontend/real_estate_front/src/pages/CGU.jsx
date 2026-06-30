import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FileText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Objet",
    content: `Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les conditions dans lesquelles Localizi.tn (ci-après « la Plateforme ») met à disposition ses services aux utilisateurs.
En accédant à la Plateforme, l'utilisateur accepte sans réserve les présentes CGU.`,
  },
  {
    title: "2. Description des services",
    content: `Localizi.tn est une plateforme immobilière en ligne permettant :
• La publication et la consultation d'annonces immobilières (vente, location, vacances) en Tunisie.
• La mise en relation entre propriétaires, agents immobiliers et acheteurs/locataires.
• La recherche géolocalisée via une carte interactive.
• Le référencement de professionnels de l'immobilier (agents, agences, promoteurs, prestataires).`,
  },
  {
    title: "3. Inscription et compte utilisateur",
    content: `3.1. L'inscription est gratuite et ouverte à toute personne physique ou morale.
3.2. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription.
3.3. Chaque compte est strictement personnel et ne peut être partagé ou cédé.
3.4. L'utilisateur est responsable de la confidentialité de son mot de passe et de toutes les actions effectuées depuis son compte.
3.5. En cas d'utilisation frauduleuse présumée, l'utilisateur doit en informer immédiatement Localizi.tn.`,
  },
  {
    title: "4. Publication d'annonces",
    content: `4.1. Tout utilisateur inscrit peut publier des annonces immobilières.
4.2. Les annonces sont soumises à modération avant publication. Localizi.tn se réserve le droit de refuser ou supprimer toute annonce ne respectant pas les présentes CGU ou la législation en vigueur.
4.3. L'utilisateur garantit être propriétaire du bien ou habilité à le proposer à la vente ou à la location.
4.4. Les informations contenues dans l'annonce doivent être exactes et non trompeuses.
4.5. Sont strictement interdites les annonces :
  • à caractère illicite, frauduleux ou trompeur ;
  • portant sur des biens inexistants ou non disponibles ;
  • violant les droits de tiers (droits d'auteur, marques, etc.) ;
  • contenant des propos discriminatoires ou offensants.`,
  },
  {
    title: "5. Responsabilités",
    content: `5.1. Localizi.tn agit en qualité d'intermédiaire technique et n'est pas responsable des transactions entre utilisateurs.
5.2. Localizi.tn ne garantit pas l'exactitude des informations publiées par les utilisateurs.
5.3. L'utilisateur est seul responsable du contenu de ses annonces et des conséquences de leur publication.
5.4. Localizi.tn met en œuvre les moyens raisonnables pour assurer la disponibilité de la Plateforme, mais ne peut garantir un accès ininterrompu.`,
  },
  {
    title: "6. Propriété intellectuelle",
    content: `6.1. L'ensemble des éléments de la Plateforme (logo, textes, interface, code) est protégé par le droit de la propriété intellectuelle et appartient à CID.
6.2. Toute reproduction, représentation ou exploitation non autorisée est strictement interdite.
6.3. En publiant du contenu sur la Plateforme, l'utilisateur accorde à Localizi.tn une licence non exclusive et gratuite pour l'afficher et le diffuser.`,
  },
  {
    title: "7. Données personnelles",
    content: `7.1. Localizi.tn collecte et traite les données personnelles conformément à sa Politique de Confidentialité, disponible sur la Plateforme.
7.2. Conformément à la loi tunisienne n° 2004-63 du 27 juillet 2004 portant sur la protection des données à caractère personnel, l'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données.`,
  },
  {
    title: "8. Suspension et résiliation",
    content: `8.1. Localizi.tn se réserve le droit de suspendre ou de supprimer tout compte en cas de violation des présentes CGU, sans préavis ni indemnité.
8.2. L'utilisateur peut supprimer son compte à tout moment depuis son espace personnel.`,
  },
  {
    title: "9. Modification des CGU",
    content: `Localizi.tn se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou par notification sur la Plateforme. L'utilisation continue de la Plateforme après modification vaut acceptation des nouvelles CGU.`,
  },
  {
    title: "10. Droit applicable et juridiction",
    content: `Les présentes CGU sont régies par le droit tunisien. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents de Tunis.`,
  },
];

export default function CGU() {
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
          <FileText size={28} color="#818cf8"/>
        </div>
        <h1 style={{fontSize:32, fontWeight:800, color:"#fff", margin:"0 0 12px", letterSpacing:"-.02em"}}>
          Conditions Générales d'Utilisation
        </h1>
        <p style={{fontSize:14, color:"rgba(255,255,255,.5)", margin:0}}>
          Dernière mise à jour : juin 2026
        </p>
      </div>

      {/* Content */}
      <div style={{maxWidth:820, margin:"0 auto", padding:"48px 24px 80px"}}>
        <div style={{
          background:"#fff8ed", border:"1px solid #fde68a", borderRadius:12,
          padding:"14px 20px", marginBottom:32, fontSize:13.5, color:"#92400e", lineHeight:1.7,
        }}>
          <strong>Important :</strong> En utilisant la plateforme Localizi.tn, vous acceptez les présentes conditions générales d'utilisation dans leur intégralité.
        </div>

        {SECTIONS.map((s, i) => (
          <div key={i} style={{marginBottom:32}}>
            <h2 style={{fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:12, borderLeft:"3px solid #6366f1", paddingLeft:14}}>
              {s.title}
            </h2>
            <div style={{
              fontSize:14, color:"#475569", lineHeight:1.85, whiteSpace:"pre-line",
              background:"#fff", borderRadius:10, border:"1px solid #e2e8f0",
              padding:"18px 22px",
            }}>
              {s.content}
            </div>
          </div>
        ))}

        <div style={{
          borderTop:"1px solid #e2e8f0", paddingTop:24, textAlign:"center",
          fontSize:13, color:"#94a3b8",
        }}>
          Pour toute question relative aux présentes CGU, contactez-nous à{" "}
          <a href="mailto:contact@localizi.tn" style={{color:"#6366f1", fontWeight:600}}>
            contact@localizi.tn
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
