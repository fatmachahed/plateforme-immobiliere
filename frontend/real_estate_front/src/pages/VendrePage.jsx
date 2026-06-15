import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroVendreImg from "../assets/hero-vendre.png";
import { Users, Home, ChevronRight, CheckCircle2, Tag, AlertTriangle, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../components/Logo";

export default function VendrePage() {
  const navigate = useNavigate();
  const [showWarn, setShowWarn] = useState(false);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)" }}>

        {/* ── Hero banner ── */}
        <section style={{
          position: "relative", height: "clamp(280px, 38vw, 480px)",
          overflow: "hidden",
          background: "#1e293b",
        }}>
          <img
            src={heroVendreImg}
            alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 75%", opacity:.55 }}
          />
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(90deg, rgba(15,23,42,.7) 0%, rgba(15,23,42,.15) 100%)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{ textAlign:"center", padding:"0 24px" }}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:7,
                background:"rgba(99,102,241,.85)", color:"#fff",
                padding:"5px 16px", borderRadius:20, fontSize:12.5, fontWeight:700,
                marginBottom:20, backdropFilter:"blur(6px)",
              }}>
                <Tag size={12}/> Vendre votre bien
              </div>
              <h1 style={{
                fontSize:"clamp(26px,4.5vw,52px)", fontWeight:900,
                color:"#fff", lineHeight:1.12, margin:"0 auto 16px", maxWidth:700,
                letterSpacing:"-.02em", textShadow:"0 2px 20px rgba(0,0,0,.3)",
              }}>
                Comment souhaitez-vous<br/>
                <span style={{ background:"linear-gradient(90deg,#818cf8,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  vendre votre bien ?
                </span>
              </h1>
              <p style={{ fontSize:16, color:"rgba(255,255,255,.75)", maxWidth:540, margin:"0 auto", lineHeight:1.65 }}>
                Plusieurs options pour vendre en toute confiance, avec la flexibilité de choisir ce qui convient le mieux à votre situation.
              </p>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section style={{
          display: "flex", flexWrap: "wrap", gap: 28,
          justifyContent: "center", alignItems: "stretch",
          padding: "0 24px 80px", maxWidth: 900, margin: "60px auto 0"
        }}>

          {/* Option 1 — Trouver un agent */}
          <div
            onClick={() => navigate("/trouver-un-agent")}
            style={{
              flex: "1 1 360px", maxWidth: 420,
              background: "#fff", borderRadius: 20,
              border: "2px solid #e2e8f0",
              padding: "40px 36px", cursor: "pointer",
              boxShadow: "0 4px 24px rgba(99,102,241,.07)",
              transition: "all .2s",
              display: "flex", flexDirection: "column", gap: 18
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#6366f1";
              e.currentTarget.style.boxShadow = "0 8px 36px rgba(99,102,241,.16)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Users size={28} color="#6366f1" />
            </div>

            <div style={{ minHeight: 130 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Trouver un agent<br />près de chez vous
              </h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.55, margin: 0 }}>
                Confiez la vente à un professionnel de l'immobilier. Il s'occupe des visites, des négociations et des démarches administratives.
              </p>
            </div>

            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Estimation gratuite de votre bien",
                "Accompagnement complet de A à Z",
                "Réseau d'acheteurs qualifiés",
                "Sécurité juridique garantie",
              ].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#334155" }}>
                  <CheckCircle2 size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>

            <button style={{
              marginTop: "auto",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 24px", borderRadius: 12,
              background: "#6366f1", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 700, fontFamily: "inherit",
              transition: "background .15s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#4f46e5"}
              onMouseLeave={e => e.currentTarget.style.background = "#6366f1"}
            >
              Trouver un agent <ChevronRight size={17} />
            </button>
          </div>

          {/* Option 2 — Vendre soi-même */}
          <div
            onClick={() => setShowWarn(true)}
            style={{
              flex: "1 1 360px", maxWidth: 420,
              background: "#fff", borderRadius: 20,
              border: "2px solid #e2e8f0",
              padding: "40px 36px", cursor: "pointer",
              boxShadow: "0 4px 24px rgba(16,185,129,.07)",
              transition: "all .2s",
              display: "flex", flexDirection: "column", gap: 18
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#10b981";
              e.currentTarget.style.boxShadow = "0 8px 36px rgba(16,185,129,.16)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(16,185,129,.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Home size={28} color="#10b981" />
            </div>

            <div style={{ minHeight: 130 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Vendre soi-même<br />sur Localizi.tn
              </h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.55, margin: 0 }}>
                Publiez votre annonce directement sur Localizi.tn et gérez les contacts d'acheteurs potentiels en toute autonomie jusqu'à la vente effective de votre bien.
              </p>
            </div>

            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Publication rapide en quelques minutes",
                "Visibilité sur toute la plateforme",
                "Gestion directe des contacts",
                "Sans commission d'agence",
              ].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#334155" }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>

            <button style={{
              marginTop: "auto",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 24px", borderRadius: 12,
              background: "#10b981", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 700, fontFamily: "inherit",
              transition: "background .15s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#059669"}
              onMouseLeave={e => e.currentTarget.style.background = "#10b981"}
            >
              Publier mon annonce <ChevronRight size={17} />
            </button>
          </div>

        </section>
      </main>
      <Footer />

      {/* ── Popup avertissement publication ── */}
      {showWarn && (
        <div style={{
          position:"fixed", inset:0, zIndex:99999,
          background:"rgba(15,23,42,.55)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }} onClick={() => setShowWarn(false)}>
          <div style={{
            background:"#fff", borderRadius:20, padding:"28px 32px 0",
            maxWidth:580, width:"100%", maxHeight:"90vh",
            display:"flex", flexDirection:"column",
            boxShadow:"0 24px 64px rgba(0,0,0,.18)",
          }} onClick={e => e.stopPropagation()}>

            {/* Header — style comparateur */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Logo variant="color" height={28} to={null}/>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>Publier une annonce</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Informations importantes avant de continuer</div>
                </div>
              </div>
              <button onClick={() => setShowWarn(false)} style={{
                background:"#f1f5f9", border:"none", cursor:"pointer", borderRadius:10,
                width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center",
                color:"#64748b", flexShrink:0,
              }}>
                <X size={18} strokeWidth={2.5}/>
              </button>
            </div>

            {/* Corps */}
            <div style={{flex:1, overflowY:"auto", paddingBottom:32}}>
              {/* Icône monochrome centrée */}
              <div style={{display:"flex",justifyContent:"center",marginBottom:22}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <AlertTriangle size={36} color="#475569" strokeWidth={1.8}/>
                </div>
              </div>

              <h2 style={{fontSize:24,fontWeight:900,color:"#0f172a",margin:"0 0 14px",textAlign:"center",lineHeight:1.2}}>
                Avant de publier
              </h2>
              <p style={{fontSize:15,color:"#374151",lineHeight:1.75,margin:"0 0 28px",textAlign:"center"}}>
                En publiant votre annonce sur Localizi.tn, la carte affichera la <strong>position exacte</strong> du bien immobilier.
                Assurez-vous d'être le propriétaire ou le mandataire exclusif du bien.
                Vous pouvez déplacer la position sur la carte si nécessaire.
              </p>

              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={() => setShowWarn(false)} style={{
                  padding:"13px 28px", borderRadius:12, border:"1.5px solid #e2e8f0",
                  background:"#fff", fontSize:15, fontWeight:600, color:"#374151",
                  cursor:"pointer", minWidth:130,
                }}>
                  Annuler
                </button>
                <button onClick={() => { setShowWarn(false); navigate("/creer_annonce"); }} style={{
                  padding:"13px 36px", borderRadius:12, border:"none",
                  background:"#0f172a", color:"#fff",
                  fontSize:16, fontWeight:800, cursor:"pointer", minWidth:150,
                  letterSpacing:".01em",
                }}>
                  Je publie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
