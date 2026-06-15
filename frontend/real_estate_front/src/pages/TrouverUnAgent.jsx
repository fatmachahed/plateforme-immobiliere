import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL, { fmtDevise } from "../config";
import { Search, MapPin, Phone, Mail, Building2, Users, ChevronRight, Star } from "lucide-react";

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

function AgentCard({ p }) {
  const navigate = useNavigate();
  const photoUrl = resolveUrl(p.profile_picture);
  const initiale = (p.nom || "?")[0].toUpperCase();

  return (
    <div
      onClick={() => navigate(`/agent/${p.id}`)}
      style={{
        background:"#fff", borderRadius:16, border:"1px solid #e2e8f0",
        overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.05)",
        transition:"transform .2s, box-shadow .2s", display:"flex", flexDirection:"column",
        cursor:"pointer",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.05)"; }}
    >
      <div style={{
        height:160, background:"linear-gradient(135deg,#0f172a,#1e293b)",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0, position:"relative", overflow:"hidden",
      }}>
        {photoUrl ? (
          <img src={photoUrl} alt={p.nom} style={{width:"100%", height:"100%", objectFit:"cover", opacity:.85}}/>
        ) : (
          <div style={{
            width:90, height:90, borderRadius:20,
            background:"linear-gradient(135deg,#0369a1,#0ea5e9)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:40, fontWeight:900, color:"#fff",
            boxShadow:"0 6px 20px rgba(0,0,0,.25)",
          }}>{initiale}</div>
        )}
      </div>
      <div style={{padding:"16px 20px", display:"flex", flexDirection:"column", gap:6, flex:1}}>
        <h3 style={{fontSize:15.5, fontWeight:700, color:"#0f172a", margin:0, textAlign:"center"}}>{p.nom}</h3>
        {(p.gouvernorat || p.localite) && (
          <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12.5, color:"#64748b"}}>
            <MapPin size={12} style={{flexShrink:0, color:"#6366f1"}}/>
            {[p.gouvernorat, p.localite].filter(Boolean).join(" · ")}
          </div>
        )}
        <div style={{borderTop:"1px solid #f1f5f9", marginTop:10, paddingTop:12, display:"flex", flexDirection:"column", gap:7}}>
          {p.email && (
            <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()}
              style={{display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"#6366f1", textDecoration:"none", fontWeight:500}}>
              <Mail size={13}/> {p.email}
            </a>
          )}
          {p.telephone && (
            <a href={`tel:${p.telephone}`} onClick={e => e.stopPropagation()}
              style={{display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"#374151", textDecoration:"none"}}>
              <Phone size={13}/> {p.telephone}
            </a>
          )}
          {!p.email && !p.telephone && (
            <span style={{fontSize:12, color:"#94a3b8", fontStyle:"italic", textAlign:"center"}}>
              Coordonnées non renseignées
            </span>
          )}
        </div>
        <div style={{marginTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12, color:"#6366f1", fontWeight:600}}>
          Voir les annonces <ChevronRight size={13}/>
        </div>
      </div>
    </div>
  );
}

function LocaliziCardSpecial({ p }) {
  const navigate = useNavigate();
  const photoUrl = resolveUrl(p.profile_picture);
  return (
    <div
      onClick={() => navigate(`/agent/${p.id}`)}
      style={{
        background:"#fff", borderRadius:16,
        border:"2px solid #6366f1",
        overflow:"hidden", boxShadow:"0 4px 20px rgba(99,102,241,.18)",
        display:"flex", flexDirection:"column",
        position:"relative", cursor:"pointer",
        transition:"transform .2s, box-shadow .2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(99,102,241,.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 20px rgba(99,102,241,.18)"; }}
    >
      {/* Badge Recommandé */}
      <div style={{
        position:"absolute", top:10, left:12, zIndex:2,
        background:"#6366f1", color:"#fff",
        fontSize:10, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase",
        padding:"3px 10px", borderRadius:999,
        display:"flex", alignItems:"center", gap:4,
      }}>
        <Star size={10} fill="#fff"/> Recommandé
      </div>
      {/* Zone logo pleine largeur */}
      <div style={{
        height:160, background:"linear-gradient(135deg,#4f46e5,#6366f1,#818cf8)",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0, overflow:"hidden",
      }}>
        {photoUrl ? (
          <img src={photoUrl} alt="Localizi.tn"
            style={{width:"100%", height:"100%", objectFit:"cover", opacity:.9}}/>
        ) : (
          <div style={{
            width:90, height:90, borderRadius:20,
            background:"rgba(255,255,255,.15)", backdropFilter:"blur(4px)",
            border:"2px solid rgba(255,255,255,.4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:44, fontWeight:900, color:"#fff", letterSpacing:"-2px",
            boxShadow:"0 8px 24px rgba(0,0,0,.2)",
          }}>L</div>
        )}
      </div>
      {/* Corps */}
      <div style={{padding:"16px 20px 20px", display:"flex", flexDirection:"column", gap:6, flex:1}}>
        <h3 style={{fontSize:15.5, fontWeight:800, color:"#4f46e5", margin:0, textAlign:"center"}}>
          {p.nom || "Localizi.tn"}
        </h3>
        <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12, color:"#64748b"}}>
          <MapPin size={12} style={{color:"#6366f1"}}/> Tunisie — Couverture nationale
        </div>
        <div style={{borderTop:"1px solid #f1f5f9", marginTop:10, paddingTop:12, display:"flex", flexDirection:"column", gap:7}}>
          {p.email && (
            <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()}
              style={{display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"#6366f1", textDecoration:"none", fontWeight:500}}>
              <Mail size={13}/> {p.email}
            </a>
          )}
          {p.telephone && (
            <a href={`tel:${p.telephone}`} onClick={e => e.stopPropagation()}
              style={{display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"#374151", textDecoration:"none"}}>
              <Phone size={13}/> {p.telephone}
            </a>
          )}
        </div>
        <div style={{marginTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:12, color:"#4f46e5", fontWeight:700}}>
          Notre équipe vous accompagne <ChevronRight size={13}/>
        </div>
      </div>
    </div>
  );
}

export default function TrouverUnAgent() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchNom, setSearchNom]         = useState("");
  const [gouvernorats, setGouvernorats]   = useState([]);
  const [delegations, setDelegations]     = useState([]);
  const [filterGovId, setFilterGovId]     = useState("");
  const [filterGovNom, setFilterGovNom]   = useState("");
  const [filterDelNom, setFilterDelNom]   = useState("");

  useEffect(() => {
    fetch(`${API_URL}/users/agencies/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setProfessionals(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`${API_URL}/localisation/gouvernorats`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setGouvernorats(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleGovChange = (govId) => {
    setFilterGovId(govId); setFilterDelNom("");
    if (!govId) { setDelegations([]); setFilterGovNom(""); return; }
    const g = gouvernorats.find(g => String(g.id) === String(govId));
    setFilterGovNom(g?.nom || "");
    fetch(`${API_URL}/localisation/delegations?gouvernorat_id=${govId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setDelegations(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // Séparer l'agence principale (toujours en tête, exclue des filtres) du reste
  const localiziCard = professionals.find(p => p.email === "xpertiseimmo@gmail.com");
  const otherProfessionals = professionals.filter(p => p.email !== "xpertiseimmo@gmail.com");
  const filtered = otherProfessionals.filter(p => {
    const matchNom = !searchNom || (p.nom||"").toLowerCase().includes(searchNom.toLowerCase());
    const matchGov = !filterGovNom || (p.gouvernorat||"").toLowerCase() === filterGovNom.toLowerCase();
    const matchDel = !filterDelNom || (p.localite||"").toLowerCase().includes(filterDelNom.toLowerCase());
    return matchNom && matchGov && matchDel;
  });

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc", fontFamily:"'Poppins',system-ui,sans-serif"}}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
        padding:"56px 24px 90px", textAlign:"center", position:"relative", overflow:"hidden",
      }}>
        <div style={{position:"absolute",inset:0,opacity:.04,backgroundImage:"radial-gradient(rgba(255,255,255,1) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none"}}/>

        {/* Image décorative — positionnée à droite, z-index élevé */}
        <img
          src="/images/creer-annonce-illus.png"
          alt=""
          style={{
            position:"absolute", right:40, bottom:0,
            height:"95%", width:"auto",
            objectFit:"contain",
            zIndex:10,
            filter:"drop-shadow(0 8px 32px rgba(0,0,0,.5))",
            pointerEvents:"none",
            opacity:1,
          }}
        />

        <div style={{position:"relative", zIndex:11}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:"50%",background:"rgba(99,102,241,.25)",marginBottom:20,border:"1.5px solid rgba(99,102,241,.4)"}}>
            <Users size={28} color="#818cf8"/>
          </div>
          <h1 style={{fontSize:"clamp(24px,3vw,34px)",fontWeight:800,color:"#fff",margin:"0 0 12px",letterSpacing:"-.025em"}}>
            Agences immobilières &amp; Agents immobiliers
          </h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,.6)",maxWidth:560,margin:"0 auto 36px"}}>
            Trouvez votre professionnel de confiance pour acheter, vendre ou louer en Tunisie.
          </p>

          {/* Filtres */}
          <div style={{maxWidth:700,margin:"0 auto",display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            <div style={{position:"relative",flex:"1 1 220px",minWidth:180}}>
              <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,.5)"}}/>
              <input type="text" value={searchNom} onChange={e=>setSearchNom(e.target.value)} placeholder="Rechercher par nom…"
                style={{width:"100%",padding:"11px 14px 11px 38px",borderRadius:10,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13.5,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            </div>

            <div style={{position:"relative",flex:"1 1 180px",minWidth:160}}>
              <MapPin size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,.5)",pointerEvents:"none"}}/>
              <select value={filterGovId} onChange={e=>handleGovChange(e.target.value)}
                style={{width:"100%",padding:"11px 14px 11px 34px",borderRadius:10,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:filterGovId?"#fff":"rgba(255,255,255,.55)",fontSize:13.5,fontFamily:"inherit",outline:"none",appearance:"none",boxSizing:"border-box",cursor:"pointer"}}>
                <option value="" style={{color:"#0f172a",background:"#fff"}}>Tous les gouvernorats</option>
                {gouvernorats.map(g => <option key={g.id} value={g.id} style={{color:"#0f172a",background:"#fff"}}>{g.nom}</option>)}
              </select>
            </div>

            {delegations.length > 0 && (
              <div style={{flex:"1 1 160px",minWidth:140}}>
                <select value={filterDelNom} onChange={e=>setFilterDelNom(e.target.value)}
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:filterDelNom?"#fff":"rgba(255,255,255,.55)",fontSize:13.5,fontFamily:"inherit",outline:"none",appearance:"none",boxSizing:"border-box",cursor:"pointer"}}>
                  <option value="" style={{color:"#0f172a",background:"#fff"}}>Toutes délégations</option>
                  {delegations.map(d => <option key={d.id} value={d.nom} style={{color:"#0f172a",background:"#fff"}}>{d.nom}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grille */}
      <div style={{maxWidth:1200,margin:"-40px auto 60px",padding:"0 20px",position:"relative",zIndex:5}}>
        {loading ? (
          <div style={{textAlign:"center",padding:"80px 0",color:"#94a3b8",fontSize:15}}>Chargement…</div>
        ) : !localiziCard && filtered.length === 0 ? (
          <div style={{background:"#fff",borderRadius:16,border:"1.5px dashed #e2e8f0",textAlign:"center",padding:"60px 24px"}}>
            <Users size={40} style={{color:"#d1d5db",marginBottom:14}}/>
            <p style={{fontWeight:700,color:"#374151",fontSize:15,margin:"0 0 6px"}}>Aucun professionnel trouvé</p>
            <p style={{color:"#94a3b8",fontSize:13}}>Modifiez vos critères ou revenez plus tard.</p>
          </div>
        ) : (
          <>
            <p style={{fontSize:13,color:"#64748b",marginBottom:20,fontWeight:500}}>
              {filtered.length + (localiziCard ? 1 : 0)} agence{(filtered.length + (localiziCard?1:0))>1?"s":""} / agent{(filtered.length + (localiziCard?1:0))>1?"s":""} trouvé{(filtered.length + (localiziCard?1:0))>1?"s":""}
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:22}}>
              {localiziCard && <LocaliziCardSpecial p={localiziCard}/>}
              {filtered.map(p => <AgentCard key={p.id} p={p}/>)}
            </div>
          </>
        )}
      </div>

      <div style={{background:"#fff",borderTop:"1px solid #e2e8f0",padding:"48px 24px",textAlign:"center"}}>
        <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a",margin:"0 0 10px"}}>Vous êtes une agence ou un agent immobilier ?</h2>
        <p style={{fontSize:14,color:"#64748b",margin:"0 auto 24px",maxWidth:500}}>Inscrivez-vous sur Localizi.tn pour être référencé dans cet annuaire et recevoir des demandes de clients.</p>
        <Link to="/register" style={{display:"inline-block",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:14,padding:"13px 32px",borderRadius:11,textDecoration:"none"}}>
          Créer un compte Agence / Agent
        </Link>
      </div>
      <Footer />
    </div>
  );
}
