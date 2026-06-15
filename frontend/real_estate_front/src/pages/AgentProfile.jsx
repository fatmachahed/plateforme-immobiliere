import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL, { fmtDevise } from "../config";
import { MapPin, Phone, Mail, Building2, Bed, Bath, Maximize, ArrowLeft, Heart, Eye } from "lucide-react";

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

const CAT_COLOR = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
const CAT_BG    = { vente:"#dcfce7",  location:"#dbeafe",  vacances:"#fef9c3"  };
const CAT_LBL   = { vente:"Vente",    location:"Location",  vacances:"Vacances" };

function AnnonceCard({ a }) {
  const imgSrc = a.image
    ? resolveUrl(a.image)
    : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=75";
  const cat = a.categorie || "vente";
  const joursEcoules = a.date_creation
    ? Math.floor((Date.now() - new Date(a.date_creation)) / 86_400_000)
    : null;
  const ageLabel = joursEcoules === 0 ? "aujourd'hui"
    : joursEcoules === 1 ? "il y a 1 jour"
    : joursEcoules != null ? `il y a ${joursEcoules} jours` : "";

  return (
    <Link to={`/annonce/${a.id}`} style={{textDecoration:"none", display:"block"}}>
      <div style={{
        background:"#fff", borderRadius:14, border:"1px solid #e2e8f0",
        overflow:"hidden", boxShadow:"0 1px 8px rgba(0,0,0,.05)",
        transition:"transform .18s, box-shadow .18s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 1px 8px rgba(0,0,0,.05)"; }}
      >
        {/* Image */}
        <div style={{position:"relative", height:180}}>
          <img src={imgSrc} alt={a.titre} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
          <span style={{
            position:"absolute", top:10, left:10,
            background:CAT_BG[cat], color:CAT_COLOR[cat],
            fontSize:10.5, fontWeight:800, padding:"3px 9px", borderRadius:999,
            textTransform:"uppercase", letterSpacing:".05em",
          }}>{CAT_LBL[cat]}</span>
        </div>

        {/* Corps */}
        <div style={{padding:"14px 16px"}}>
          <p style={{fontSize:18, fontWeight:800, color:"#0f172a", margin:"0 0 4px"}}>
            {Number(a.prix).toLocaleString("fr-TN")}
            <span style={{fontSize:13, fontWeight:500, color:"#94a3b8"}}> {fmtDevise(a.devise)}</span>
          </p>
          <p style={{fontSize:13.5, fontWeight:600, color:"#374151", margin:"0 0 8px",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{a.titre}</p>

          {(a.gouvernorat || a.delegation) && (
            <p style={{fontSize:12, color:"#6366f1", display:"flex", alignItems:"center", gap:4, margin:"0 0 8px"}}>
              <MapPin size={11}/> {[a.delegation, a.gouvernorat].filter(Boolean).join(", ")}
            </p>
          )}

          <div style={{display:"flex", gap:12, fontSize:12, color:"#64748b"}}>
            {a.superficie && <span><Maximize size={11}/> {a.superficie} m²</span>}
            {a.nb_pieces  && <span><Building2 size={11}/> {a.nb_pieces} p.</span>}
            {a.nb_chambres && <span><Bed size={11}/> {a.nb_chambres} ch.</span>}
          </div>

          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, fontSize:11.5, color:"#94a3b8"}}>
            <span style={{display:"flex", alignItems:"center", gap:3}}>
              <span style={{fontSize:13, color:"#374151", fontWeight:600}}>{a.type_bien?.replace(/_/g," ")}</span>
            </span>
            {ageLabel && <span>{ageLabel}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AgentProfile() {
  const { id } = useParams();
  const [agent, setAgent]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/users/${id}/public-profile`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setAgent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Poppins',system-ui,sans-serif"}}>
      <p style={{color:"#94a3b8"}}>Chargement…</p>
    </div>
  );

  if (!agent) return (
    <div style={{minHeight:"100vh", fontFamily:"'Poppins',system-ui,sans-serif"}}>
      <Navbar/>
      <div style={{maxWidth:800, margin:"80px auto", textAlign:"center", color:"#94a3b8"}}>
        <p style={{fontSize:18, fontWeight:700}}>Agent introuvable</p>
        <Link to="/trouver-un-agent" style={{color:"#6366f1"}}>← Retour à la liste</Link>
      </div>
    </div>
  );

  const photoUrl = resolveUrl(agent.profile_picture);
  const initiale = (agent.nom||"?")[0].toUpperCase();

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc", fontFamily:"'Poppins',system-ui,sans-serif"}}>
      <Navbar/>

      <div style={{maxWidth:1200, margin:"0 auto", padding:"32px 20px 80px"}}>
        <Link to="/trouver-un-agent" style={{display:"inline-flex", alignItems:"center", gap:6, color:"#6366f1", fontWeight:600, fontSize:13.5, textDecoration:"none", marginBottom:24}}>
          <ArrowLeft size={15}/> Retour aux professionnels
        </Link>

        {/* ── En-tête agent ── */}
        <div style={{background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden", marginBottom:32, boxShadow:"0 1px 6px rgba(0,0,0,.05)"}}>

          {/* Bande principale */}
          <div style={{
            background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
            padding:"32px 36px",
            display:"flex", alignItems:"center", gap:32, flexWrap:"wrap",
          }}>
            {/* Logo / avatar en grand sur la bande */}
            <div style={{flexShrink:0}}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={agent.nom}
                  style={{
                    width:110, height:110, objectFit:"contain",
                    borderRadius:6, background:"rgba(255,255,255,.06)",
                    border:"2px solid rgba(255,255,255,.15)",
                    padding:6,
                  }}
                />
              ) : (
                <div style={{
                  width:110, height:110, borderRadius:6,
                  background:"rgba(255,255,255,.08)",
                  border:"2px solid rgba(255,255,255,.12)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:48, fontWeight:900, color:"rgba(255,255,255,.7)",
                }}>{initiale}</div>
              )}
            </div>

            {/* Infos textuelles */}
            <div style={{flex:1, minWidth:200}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap"}}>
                <h1 style={{fontSize:24, fontWeight:900, color:"#fff", margin:0, letterSpacing:"-.02em"}}>{agent.nom}</h1>
                <span style={{fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:4, background:"rgba(14,165,233,.2)", color:"#7dd3fc", border:"1px solid rgba(14,165,233,.25)"}}>
                  Agence / Agent
                </span>
              </div>

              {/* Localisation */}
              {(agent.gouvernorat || agent.localite || agent.adresse) && (
                <div style={{display:"flex", alignItems:"center", gap:6, fontSize:13.5, color:"rgba(255,255,255,.6)", marginBottom:14}}>
                  <MapPin size={14} style={{color:"rgba(255,255,255,.4)"}}/>&nbsp;
                  {[agent.adresse, agent.localite, agent.gouvernorat].filter(Boolean).join(" · ")}
                </div>
              )}

              {/* Boutons contact */}
              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                {agent.telephone && (
                  <a href={`tel:${agent.telephone}`} style={{
                    display:"inline-flex", alignItems:"center", gap:7,
                    background:"#16a34a", color:"#fff", padding:"9px 18px", borderRadius:6,
                    fontSize:13.5, fontWeight:700, textDecoration:"none",
                  }}>
                    <Phone size={14}/> {agent.telephone}
                  </a>
                )}
                {agent.email && (
                  <a href={`mailto:${agent.email}`} style={{
                    display:"inline-flex", alignItems:"center", gap:7,
                    background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.85)",
                    padding:"9px 18px", borderRadius:6,
                    fontSize:13.5, fontWeight:700, textDecoration:"none",
                    border:"1px solid rgba(255,255,255,.15)",
                  }}>
                    <Mail size={14}/> {agent.email}
                  </a>
                )}
              </div>
            </div>

            {/* Badge annonces */}
            <div style={{
              background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
              borderRadius:8, padding:"16px 24px", textAlign:"center", flexShrink:0,
            }}>
              <div style={{fontSize:30, fontWeight:900, color:"#fff", lineHeight:1}}>{agent.nb_annonces}</div>
              <div style={{fontSize:12.5, color:"rgba(255,255,255,.5)", marginTop:4, fontWeight:600}}>
                annonce{agent.nb_annonces !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

        </div>

        {/* Annonces de l'agent */}
        <h2 style={{fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:20}}>
          Annonces de {agent.nom} ({agent.nb_annonces})
        </h2>

        {agent.annonces.length === 0 ? (
          <div style={{background:"#fff", borderRadius:14, border:"1.5px dashed #e2e8f0", padding:"60px 24px", textAlign:"center"}}>
            <Building2 size={36} style={{color:"#d1d5db", marginBottom:12}}/>
            <p style={{fontWeight:600, color:"#374151", margin:0}}>Aucune annonce publiée pour le moment</p>
          </div>
        ) : (
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",
            gap:20,
          }}>
            {agent.annonces.map(a => <AnnonceCard key={a.id} a={a}/>)}
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}
