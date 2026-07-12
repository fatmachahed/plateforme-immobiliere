import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroVendreImg from "../assets/hero-vendre.png";
import { Users, Home, ChevronRight, CheckCircle2, Tag, AlertTriangle, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import Seo from "../components/Seo";

export default function VendrePage() {
  const navigate = useNavigate();
  const [showWarn, setShowWarn] = useState(false);

  return (
    <>
      <Seo
        title="Vendre ou louer votre bien en Tunisie"
        description="Publiez gratuitement votre annonce immobilière sur Localizi.tn : vendez ou louez votre appartement, villa, terrain ou local commercial rapidement, avec géolocalisation sur carte."
        path="/vendre"
      />
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
        <style>{`
          /* Desktop : icon séparée du titre avec espacement */
          .vp-card-head { display: flex; flex-direction: column; gap: 18px; }
          .vp-card h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
          @media (max-width:860px) {
            .vp-cards { padding: 0 14px 60px !important; margin-top: 32px !important; gap: 16px !important; }
            .vp-card { padding: 22px 18px !important; }
            .vp-card-head { flex-direction: row !important; align-items: center !important; gap: 12px !important; }
            .vp-card-ico { width: 44px !important; height: 44px !important; border-radius: 12px !important; flex-shrink: 0 !important; }
            .vp-card-ico svg { width: 22px !important; height: 22px !important; }
            .vp-card h2 { font-size: 15px !important; margin: 0 !important; line-height: 1.3 !important; }
            .vp-card li { font-size: 12px !important; }
            .vp-card-body p { font-size: 13px !important; }
          }
        `}</style>
        <section className="vp-cards" style={{
          display: "flex", flexWrap: "wrap", gap: 28,
          justifyContent: "center", alignItems: "stretch",
          padding: "0 24px 80px", maxWidth: 900, margin: "60px auto 0"
        }}>

          {/* Option 1 — Trouver un agent */}
          <div
            className="vp-card"
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
            <div className="vp-card-head">
              <div className="vp-card-ico" style={{
                width: 60, height: 60, borderRadius: 16,
                background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Users size={28} color="#6366f1" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Trouver un agent<br />près de chez vous
              </h2>
            </div>

            <div className="vp-card-body">
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
            className="vp-card"
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
            <div className="vp-card-head">
              <div className="vp-card-ico" style={{
                width: 60, height: 60, borderRadius: 16,
                background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Home size={28} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Vendre soi-même<br />sur Localizi.tn
              </h2>
            </div>

            <div className="vp-card-body">
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
            background:"#fff", borderRadius:16, padding:"18px 16px",
            maxWidth:400, width:"100%",
            boxShadow:"0 24px 64px rgba(0,0,0,.18)",
            position:"relative",
          }} onClick={e => e.stopPropagation()}>

            {/* Header compact centré */}
            <div style={{textAlign:"center", marginBottom:12, position:"relative"}}>
              <div style={{display:"flex", justifyContent:"center", marginBottom:5}}>
                <Logo variant="color" height={20} to={null}/>
              </div>
              <div style={{fontSize:13, fontWeight:800, color:"#0f172a"}}>Publier une annonce</div>
              <div style={{fontSize:10.5, color:"#94a3b8", marginTop:2}}>Informations importantes</div>
              <button onClick={() => setShowWarn(false)} style={{
                position:"absolute", top:0, right:0,
                background:"#f1f5f9", border:"none", cursor:"pointer", borderRadius:8,
                width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center",
                color:"#64748b",
              }}>
                <X size={13} strokeWidth={2.5}/>
              </button>
            </div>

            {/* Icône */}
            <div style={{display:"flex", justifyContent:"center", marginBottom:10}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <AlertTriangle size={21} color="#475569" strokeWidth={1.8}/>
              </div>
            </div>

            <h2 style={{fontSize:15,fontWeight:900,color:"#0f172a",margin:"0 0 8px",textAlign:"center",lineHeight:1.2}}>
              Avant de publier
            </h2>
            <p style={{fontSize:11.5,color:"#374151",lineHeight:1.6,margin:"0 0 16px",textAlign:"center"}}>
              En publiant votre annonce sur Localizi.tn, la carte affichera la <strong>position exacte</strong> du bien immobilier.
              Assurez-vous d'être le propriétaire ou le mandataire exclusif du bien.
              Vous pouvez déplacer la position sur la carte si nécessaire.
            </p>

            <div style={{display:"flex", gap:8, paddingBottom:6}}>
              <button onClick={() => setShowWarn(false)} style={{
                flex:1, padding:"10px 8px", borderRadius:10,
                border:"1.5px solid #e2e8f0", background:"#fff",
                fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit",
              }}>
                Annuler
              </button>
              <button onClick={() => { setShowWarn(false); navigate("/creer_annonce"); }} style={{
                flex:1, padding:"10px 8px", borderRadius:10,
                border:"none", background:"#0f172a", color:"#fff",
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>
                Je publie
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
