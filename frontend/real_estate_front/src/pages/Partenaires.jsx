import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Handshake, Building2, BarChart2, Users, CheckCircle, Mail, Phone } from "lucide-react";

const PARTNERS = [
  {
    name: "BH Bank",
    logo: null,
    category: "Financement immobilier",
    desc: "Solutions de crédit immobilier avec des taux compétitifs pour l'achat de votre bien en Tunisie.",
    initiale: "BH",
    color: "#1e40af",
  },
  {
    name: "STEG",
    logo: null,
    category: "Services publics",
    desc: "Raccordement rapide et suivi des contrats d'électricité pour vos projets immobiliers.",
    initiale: "ST",
    color: "#d97706",
  },
  {
    name: "SONEDE",
    logo: null,
    category: "Services publics",
    desc: "Eau potable et raccordement réseau pour particuliers et promoteurs immobiliers.",
    initiale: "SO",
    color: "#0891b2",
  },
  {
    name: "Notaires Tunisiens",
    logo: null,
    category: "Juridique & Notariat",
    desc: "Réseau de notaires certifiés pour la rédaction de vos actes de vente et contrats.",
    initiale: "NT",
    color: "#7c3aed",
  },
];

const AVANTAGES = [
  { Ico: BarChart2, title: "Visibilité maximale",    desc: "Accès à des milliers d'acheteurs et vendeurs actifs sur Localizi.tn chaque mois." },
  { Ico: Users,     title: "Audience ciblée",        desc: "Vos offres atteignent des personnes en phase active d'achat, de vente ou de location." },
  { Ico: Building2, title: "Intégration native",     desc: "Vos services sont mis en avant directement dans les pages d'annonces pertinentes." },
  { Ico: CheckCircle,title:"Partenariat de confiance",desc:"Chaque partenaire est sélectionné pour la qualité de ses services et son sérieux." },
];

export default function Partenaires() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Poppins',system-ui,sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
        padding: "80px 24px 64px", textAlign: "center",
      }}>
        <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:999,padding:"6px 16px",fontSize:12,fontWeight:700,color:"#a5b4fc",marginBottom:20 }}>
          <Handshake size={14}/> Partenariats
        </div>
        <h1 style={{ fontSize:"clamp(28px,4vw,44px)",fontWeight:900,color:"#fff",margin:"0 0 16px",letterSpacing:"-.025em",lineHeight:1.2 }}>
          Nos partenaires de confiance
        </h1>
        <p style={{ fontSize:16,color:"rgba(255,255,255,.6)",maxWidth:560,margin:"0 auto 32px",lineHeight:1.7 }}>
          Localizi.tn collabore avec des acteurs de référence pour vous offrir une expérience immobilière complète — financement, juridique, raccordements et bien plus.
        </p>
        <a href="mailto:partenariat@Localizi.tn" style={{
          display:"inline-flex",alignItems:"center",gap:8,
          background:"#6366f1",color:"#fff",padding:"13px 28px",borderRadius:12,
          fontSize:15,fontWeight:700,textDecoration:"none",transition:"all .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="#4f46e5"}
          onMouseLeave={e=>e.currentTarget.style.background="#6366f1"}
        >
          <Mail size={16}/> Devenir partenaire
        </a>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 80px" }}>

        {/* Avantages */}
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <h2 style={{ fontSize:26,fontWeight:800,color:"#0f172a",marginBottom:8 }}>Pourquoi s'associer à Localizi.tn ?</h2>
          <p style={{ fontSize:15,color:"#64748b",maxWidth:500,margin:"0 auto" }}>Un partenariat gagnant-gagnant au service de l'immobilier tunisien.</p>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:20,marginBottom:72 }}>
          {AVANTAGES.map(({ Ico, title, desc }) => (
            <div key={title} style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"24px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
              <div style={{ width:44,height:44,borderRadius:12,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14 }}>
                <Ico size={22} style={{ color:"#6366f1" }}/>
              </div>
              <h3 style={{ fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:6 }}>{title}</h3>
              <p style={{ fontSize:13.5,color:"#64748b",lineHeight:1.6,margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Partenaires actuels */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <h2 style={{ fontSize:26,fontWeight:800,color:"#0f172a",marginBottom:8 }}>Nos partenaires actuels</h2>
          <p style={{ fontSize:15,color:"#64748b" }}>Des entreprises qui partagent nos valeurs d'excellence et de transparence.</p>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:20,marginBottom:72 }}>
          {PARTNERS.map(p => (
            <div key={p.name} style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"28px 24px",boxShadow:"0 1px 6px rgba(0,0,0,.04)",transition:"box-shadow .15s,transform .15s" }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.04)";e.currentTarget.style.transform=""}}
            >
              <div style={{ width:64,height:64,borderRadius:14,background:p.color+"22",border:`2px solid ${p.color}33`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,fontSize:20,fontWeight:900,color:p.color }}>
                {p.initiale}
              </div>
              <span style={{ fontSize:11,fontWeight:700,color:p.color,background:p.color+"15",padding:"3px 10px",borderRadius:999,display:"inline-block",marginBottom:10 }}>{p.category}</span>
              <h3 style={{ fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:8 }}>{p.name}</h3>
              <p style={{ fontSize:13.5,color:"#64748b",lineHeight:1.6,margin:0 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)",borderRadius:20,padding:"48px 40px",textAlign:"center",color:"#fff" }}>
          <h2 style={{ fontSize:26,fontWeight:800,marginBottom:12 }}>Vous souhaitez rejoindre nos partenaires ?</h2>
          <p style={{ fontSize:15,color:"rgba(255,255,255,.65)",maxWidth:480,margin:"0 auto 28px",lineHeight:1.7 }}>
            Contactez notre équipe pour discuter d'un partenariat adapté à votre activité.
          </p>
          <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
            <a href="mailto:partenariat@Localizi.tn" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#6366f1",color:"#fff",padding:"12px 24px",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none" }}>
              <Mail size={15}/> partenariat@Localizi.tn
            </a>
            <a href="tel:+21671000000" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.1)",color:"#fff",padding:"12px 24px",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none",border:"1px solid rgba(255,255,255,.15)" }}>
              <Phone size={15}/> +216 71 000 000
            </a>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
