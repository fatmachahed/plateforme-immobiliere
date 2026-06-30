import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MentionsLegales() {
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'Poppins',system-ui,sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth:820, margin:"48px auto", padding:"0 24px 80px" }}>
        <h1 style={{ fontSize:30, fontWeight:900, color:"#0f172a", marginBottom:6 }}>Mentions légales</h1>
        <p style={{ fontSize:13.5, color:"#94a3b8", marginBottom:40 }}>Dernière mise à jour : juin 2026</p>

        {[
          {
            title: "1. Éditeur du site",
            content: `Le site Localizi.tn est édité par la société CID SARL, société à responsabilité limitée au capital de 60 000 TND, immatriculée au Registre du Commerce de Tunis sous le numéro RC B2471432010.\n\nSiège social : Zaghouan, Tunisie\nEmail : myconsultingid@gmail.com\nTéléphone : +216 23 423 000`,
          },
          {
            title: "2. Directeur de la publication",
            content: "Le directeur de la publication est le gérant de la société CID SARL.",
          },
          {
            title: "3. Propriété intellectuelle",
            content: "L'ensemble des contenus présents sur le site Localizi.tn (textes, images, graphismes, logo, icônes, sons, logiciels) sont la propriété exclusive de CID SARL ou de ses partenaires, et sont protégés par les lois tunisiennes et internationales relatives à la propriété intellectuelle.\n\nToute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable.",
          },
          {
            title: "4. Responsabilité",
            content: "Localizi.tn s'efforce de fournir sur le site des informations aussi précises que possible. Toutefois, elle ne pourra être tenue responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.",
          },
          {
            title: "5. Données personnelles",
            content: "Les informations recueillies font l'objet d'un traitement informatique destiné à la gestion des comptes utilisateurs et à l'amélioration de nos services. Conformément à la loi tunisienne n° 2004-63 du 27 juillet 2004 portant sur la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.\n\nPour exercer ce droit, contactez-nous à : privacy@Localizi.tn",
          },
          {
            title: "6. Cookies",
            content: "Le site utilise des cookies pour améliorer l'expérience utilisateur. En continuant à naviguer sur ce site, vous acceptez l'utilisation de cookies conformément à notre politique de cookies.",
          },
          {
            title: "7. Droit applicable",
            content: "Tout litige en relation avec l'utilisation du site Localizi.tn est soumis au droit tunisien. En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents de Tunis.",
          },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:"#0f172a", marginBottom:10, paddingBottom:8, borderBottom:"1px solid #f1f5f9" }}>{title}</h2>
            {content.split("\n").map((line, i) => (
              <p key={i} style={{ fontSize:14, color:"#374151", lineHeight:1.8, margin:"0 0 6px" }}>{line}</p>
            ))}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
