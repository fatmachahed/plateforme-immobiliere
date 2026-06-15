import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Bed, ShowerHead, Ruler, HardHat, ChevronLeft, ChevronRight } from "lucide-react";
import API_URL, { fmtDevise } from "../config";

const CAT_COLOR = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
const CAT_LBL   = { vente:"Achat", location:"Location", vacances:"Vacances" };

const FEAT_LABELS = {
  jardin:"Jardin", terrasse:"Terrasse", balcon:"Balcon", parking:"Parking",
  garage:"Garage", ascenseur:"Ascenseur", piscine:"Piscine",
  meuble:"Meublé", vue_mer:"Vue mer", climatisation:"Climatisation",
  chauffage_central:"Chauffage", internet:"Internet", securite:"Sécurité",
};

export default function AnnonceModal({ annonceId, onClose }) {
  const [prop,         setProp]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [imgIdx,       setImgIdx]       = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!annonceId) return;
    setLoading(true); setProp(null); setImgIdx(0);
    fetch(`${API_URL}/annonces/${annonceId}/detail`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const images = (data.images || []).length > 0
          ? data.images.map(img => img.startsWith("http") ? img : `${API_URL}${img}`)
          : data.image_principale
            ? [data.image_principale.startsWith("http") ? data.image_principale : `${API_URL}${data.image_principale}`]
            : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"];
        setProp({
          id:          data.id,
          titre:       data.titre,
          prix:        Number(data.prix).toLocaleString("fr-TN"),
          devise:      fmtDevise(data.devise),
          categorie:   data.categorie || "vente",
          gouvernorat: data.gouvernorat || "",
          delegation:  data.delegation  || "",
          localite:    data.localite    || "",
          beds:        data.nb_chambres,
          baths:       data.nb_salles_bain,
          pieces:      data.nb_pieces,
          area:        data.superficie,
          type:        data.type_bien   || "",
          etat:        data.etat_bien   || "",
          description: data.description || "",
          features:    data.features    || [],
          contact: {
            nom:   data.user?.username     || "Propriétaire",
            tel:   data.user?.phone_number || "",
            email: data.user?.email        || "",
            avatar:data.user?.profile_picture || null,
          },
          anonyme:   data.anonyme || false,
          reference: data.reference || null,
          images,
          duree_type:          data.duree_type || null,
          colocation:          data.colocation || false,
          chambres_colocation: data.chambres_colocation || [],
          profil_coloc:        data.profil_coloc || null,
          genre_coloc:         data.genre_coloc || [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [annonceId]);

  const handleKey = useCallback(e => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [handleKey]);

  const prix = prop
    ? `${prop.prix} ${prop.devise}${prop.categorie === "location" ? " /mois" : prop.categorie === "vacances" && prop.duree_type ? ` /${prop.duree_type}` : ""}`
    : "";

  const activeFeats = prop ? (prop.features || []).filter(f => FEAT_LABELS[f]) : [];

  return (
    <div
      style={{
        position:"fixed", inset:0, zIndex:99999,
        background:"rgba(0,0,0,.62)", backdropFilter:"blur(3px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"16px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:"#fff", borderRadius:20,
        width:"100%", maxWidth:860, maxHeight:"90vh",
        display:"flex", flexDirection:"column",
        boxShadow:"0 24px 80px rgba(0,0,0,.35)",
        overflow:"hidden", position:"relative",
      }}>
        {/* Bouton fermer */}
        <button onClick={onClose} style={{
          position:"absolute", top:14, right:14, zIndex:10,
          width:36, height:36, borderRadius:"50%",
          background:"rgba(0,0,0,.55)", color:"#fff",
          border:"none", cursor:"pointer", fontSize:18, fontWeight:700,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>✕</button>

        {loading ? (
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:60}}>
            <div style={{
              width:40, height:40, borderRadius:"50%",
              border:"3px solid #e2e8f0", borderTopColor:"#6366f1",
              animation:"spin 0.8s linear infinite",
            }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !prop ? (
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:60, flexDirection:"column", gap:12}}>
            <p style={{fontSize:16, color:"#374151", fontWeight:600}}>Annonce introuvable</p>
            <button onClick={onClose} style={{padding:"8px 20px", borderRadius:8, border:"1.5px solid #e2e8f0", cursor:"pointer", background:"#f8fafc", fontWeight:600}}>Fermer</button>
          </div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", overflow:"hidden", flex:1}}>
            {/* Image + carousel */}
            <div style={{position:"relative", height:300, flexShrink:0, background:"#1e293b"}}>
              <img
                src={prop.images[imgIdx]}
                alt={prop.titre}
                style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}}
                onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"; }}
              />
              {/* Gradient bas */}
              <div style={{position:"absolute", bottom:0, left:0, right:0, height:80, background:"linear-gradient(transparent, rgba(0,0,0,.5))"}}/>
              {/* Badge catégorie — affiché uniquement pour location et vacances */}
              {(prop.categorie === "location" || prop.categorie === "vacances") && (
                <span style={{
                  position:"absolute", top:14, left:14,
                  background: CAT_COLOR[prop.categorie] || "#374151", color:"#fff",
                  padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:800, letterSpacing:".04em",
                }}>{CAT_LBL[prop.categorie]}</span>
              )}
              {/* Prix overlay */}
              <div style={{position:"absolute", bottom:14, left:18}}>
                <span style={{color:"#fff", fontSize:26, fontWeight:900, textShadow:"0 2px 8px rgba(0,0,0,.6)"}}>
                  {prix}
                </span>
              </div>
              {/* Navigation images */}
              {prop.images.length > 1 && (
                <>
                  <button onClick={()=>setImgIdx(i=>(i-1+prop.images.length)%prop.images.length)} style={{
                    position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
                    background:"rgba(255,255,255,.28)", backdropFilter:"blur(4px)", border:"none", borderRadius:"50%",
                    width:36, height:36, cursor:"pointer", color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}><ChevronLeft size={20}/></button>
                  <button onClick={()=>setImgIdx(i=>(i+1)%prop.images.length)} style={{
                    position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                    background:"rgba(255,255,255,.28)", backdropFilter:"blur(4px)", border:"none", borderRadius:"50%",
                    width:36, height:36, cursor:"pointer", color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}><ChevronRight size={20}/></button>
                  <div style={{position:"absolute", bottom:14, right:14, background:"rgba(0,0,0,.5)", color:"#fff", borderRadius:12, padding:"3px 10px", fontSize:12, fontWeight:600}}>
                    {imgIdx+1}/{prop.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Corps scrollable */}
            <div style={{flex:1, overflowY:"auto", padding:"22px 28px 24px"}}>
              {/* Titre + ref */}
              <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:6}}>
                <h2 style={{fontSize:22, fontWeight:800, color:"#0a0a0a", lineHeight:1.2, margin:0}}>{prop.titre}</h2>
                {prop.reference && <span style={{flexShrink:0, background:"#f1f5f9", color:"#475569", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:600}}>{prop.reference}</span>}
              </div>

              {/* Localisation */}
              <p style={{fontSize:14, color:"#374151", fontWeight:500, marginBottom:16, display:"flex", alignItems:"center", gap:5}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {[prop.localite, prop.delegation, prop.gouvernorat].filter(Boolean).join(" · ")}
              </p>

              {/* Specs */}
              <div style={{display:"flex", gap:10, flexWrap:"wrap", marginBottom:16}}>
                {prop.pieces != null && <Chip icon={<LayoutGrid size={14} strokeWidth={2}/>} label={`${prop.pieces} pièces`}/>}
                {prop.beds   != null && <Chip icon={<Bed size={14} strokeWidth={2}/>} label={`${prop.beds} chambre${prop.beds>1?"s":""}`}/>}
                {prop.baths  != null && <Chip icon={<ShowerHead size={14} strokeWidth={2}/>} label={`${prop.baths} sdb`}/>}
                {prop.area           && <Chip icon={<Ruler size={14} strokeWidth={2}/>} label={`${prop.area} m²`}/>}
                {prop.etat           && <Chip icon={<HardHat size={14} strokeWidth={2}/>} label={prop.etat.replace(/_/g," ")}/>}
              </div>

              {/* Features */}
              {activeFeats.length > 0 && (
                <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:16}}>
                  {activeFeats.map(f => (
                    <span key={f} style={{background:"#f0fdf4", color:"#166534", border:"1px solid #bbf7d0", borderRadius:20, padding:"4px 12px", fontSize:13, fontWeight:600}}>
                      {FEAT_LABELS[f]}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {prop.description && prop.description !== "Aucune description disponible." && (() => {
                const DESC_LIMIT = 220;
                const longDesc = prop.description.length > DESC_LIMIT;
                return (
                  <div style={{marginBottom:18}}>
                    <p style={{fontSize:13, fontWeight:700, color:"#0a0a0a", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>Description</p>
                    <p style={{fontSize:14, color:"#374151", lineHeight:1.7, whiteSpace:"pre-line", margin:0}}>
                      {descExpanded || !longDesc ? prop.description : prop.description.slice(0, DESC_LIMIT) + "…"}
                    </p>
                    {longDesc && (
                      <button onClick={() => setDescExpanded(p => !p)} style={{
                        marginTop:8, background:"none", border:"none", cursor:"pointer",
                        color:"#4f46e5", fontWeight:700, fontSize:13,
                        display:"flex", alignItems:"center", gap:4, padding:0,
                      }}>
                        {descExpanded
                          ? <><ChevronLeft size={14} style={{transform:"rotate(90deg)"}}/> Voir moins</>
                          : <>Voir plus <ChevronRight size={14}/></>}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* ── Tableau colocation ── */}
              {prop.colocation && prop.chambres_colocation && prop.chambres_colocation.length > 0 && (
                <div style={{marginBottom:18}}>
                  <p style={{fontSize:13, fontWeight:700, color:"#0a0a0a", marginBottom:10, textTransform:"uppercase", letterSpacing:".06em", display:"flex", alignItems:"center", gap:7}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:6,background:"#eef2ff"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </span>
                    Détail des chambres
                    {prop.genre_coloc && prop.genre_coloc.length > 0 && (
                      <span style={{marginLeft:8,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",textTransform:"none",letterSpacing:0}}>
                        {prop.genre_coloc.length === 2 ? "Mixte (H/F)" : prop.genre_coloc[0] === "homme" ? "Hommes" : "Femmes"}
                      </span>
                    )}
                    {prop.profil_coloc && prop.profil_coloc !== "tous" && (
                      <span style={{marginLeft:4,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:"#eef2ff",color:"#6366f1",border:"1px solid #c7d2fe",textTransform:"none",letterSpacing:0}}>
                        {prop.profil_coloc === "etudiant" ? "Étudiants" : prop.profil_coloc === "professionnel" ? "Professionnels" : prop.profil_coloc === "famille" ? "Familles" : prop.profil_coloc}
                      </span>
                    )}
                  </p>
                  <div style={{overflowX:"auto", borderRadius:12, border:"1.5px solid #e2e8f0"}}>
                    <table style={{width:"100%", borderCollapse:"collapse", fontSize:13}}>
                      <thead>
                        <tr style={{background:"#eef2ff"}}>
                          <th style={{padding:"9px 14px",fontWeight:700,color:"#4338ca",textAlign:"left"}}>Chambre</th>
                          <th style={{padding:"9px 14px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Capacité</th>
                          <th style={{padding:"9px 14px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Occupées</th>
                          <th style={{padding:"9px 14px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Disponibles</th>
                          <th style={{padding:"9px 14px",fontWeight:700,color:"#4338ca",textAlign:"center"}}>Prix/place</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prop.chambres_colocation.map((ch, i) => {
                          const dispo = Math.max(0, ch.capacite - ch.places_occupees);
                          return (
                            <tr key={i} style={{borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#f8fafc"}}>
                              <td style={{padding:"8px 14px",fontWeight:700,color:"#374151"}}>Ch. {ch.numero_chambre}</td>
                              <td style={{padding:"8px 14px",textAlign:"center",color:"#374151"}}>{ch.capacite} pers.</td>
                              <td style={{padding:"8px 14px",textAlign:"center",color: ch.places_occupees>0?"#dc2626":"#94a3b8"}}>{ch.places_occupees}</td>
                              <td style={{padding:"8px 14px",textAlign:"center"}}>
                                <span style={{fontWeight:700, color: dispo>0?"#16a34a":"#dc2626"}}>{dispo}</span>
                              </td>
                              <td style={{padding:"8px 14px",textAlign:"center",fontWeight:700,color:"#6366f1"}}>
                                {ch.prix_par_place > 0 ? `${Number(ch.prix_par_place).toLocaleString("fr-TN")} TND` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{background:"#f1f5f9",borderTop:"2px solid #e2e8f0"}}>
                          <td style={{padding:"8px 14px",fontWeight:800,color:"#0f172a"}}>Total</td>
                          <td style={{padding:"8px 14px",textAlign:"center",fontWeight:700,color:"#0f172a"}}>{prop.chambres_colocation.reduce((s,c)=>s+c.capacite,0)} pers.</td>
                          <td style={{padding:"8px 14px",textAlign:"center",fontWeight:700,color:"#dc2626"}}>{prop.chambres_colocation.reduce((s,c)=>s+c.places_occupees,0)}</td>
                          <td style={{padding:"8px 14px",textAlign:"center",fontWeight:800,color:"#16a34a"}}>{prop.chambres_colocation.reduce((s,c)=>s+Math.max(0,c.capacite-c.places_occupees),0)}</td>
                          <td style={{padding:"8px 14px",textAlign:"center",fontWeight:800,color:"#6366f1"}}>
                            {prop.chambres_colocation.reduce((s,c)=>s+(c.prix_par_place||0),0)>0
                              ? `${prop.chambres_colocation.reduce((s,c)=>s+((c.capacite||1)*(c.prix_par_place||0)),0).toLocaleString("fr-TN")} TND/mois`
                              : "—"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Séparateur */}
              <div style={{height:1, background:"#f1f5f9", margin:"4px 0 18px"}}/>

              {/* Bas : contact + bouton page complète */}
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap"}}>
                {!prop.anonyme && (
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    <OwnerAvatar contact={prop.contact}/>
                    <div>
                      <p style={{fontSize:14, fontWeight:700, color:"#0a0a0a", margin:0}}>{prop.contact.nom}</p>
                      {prop.contact.tel && <p style={{fontSize:13, color:"#374151", margin:0}}>{prop.contact.tel}</p>}
                    </div>
                  </div>
                )}
                <div style={{display:"flex", gap:10, marginLeft:"auto"}}>
                  <button onClick={onClose} style={{
                    padding:"10px 20px", borderRadius:10,
                    border:"2px solid #e2e8f0", background:"#fff",
                    fontSize:14, fontWeight:700, color:"#374151", cursor:"pointer",
                  }}>Fermer</button>
                  <Link to={`/annonce/${prop.id}`} onClick={onClose} style={{
                    padding:"10px 22px", borderRadius:10,
                    background:"#6366f1", color:"#fff",
                    fontSize:14, fontWeight:800, textDecoration:"none",
                    display:"inline-flex", alignItems:"center", gap:7,
                    boxShadow:"0 3px 12px rgba(99,102,241,.35)",
                  }}>
                    Page complète →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerAvatar({ contact }) {
  const [err, setErr] = React.useState(false);
  const initial = (contact?.nom || "?")[0].toUpperCase();
  const fallback = (
    <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#818cf8)",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,
      color:"#fff",border:"2px solid #e2e8f0",flexShrink:0}}>
      {initial}
    </div>
  );
  if (!contact?.avatar || err) return fallback;
  const src = (contact.avatar.startsWith("http") || contact.avatar.startsWith("data:"))
    ? contact.avatar
    : `${API_URL}${contact.avatar}`;
  return (
    <img src={src} alt="" onError={()=>setErr(true)}
      style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid #e2e8f0",flexShrink:0}}/>
  );
}

function Chip({ icon, label }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:"#f8fafc", border:"1.5px solid #e2e8f0",
      borderRadius:10, padding:"6px 12px",
      fontSize:14, fontWeight:600, color:"#1e293b",
    }}>
      <span style={{display:"inline-flex",alignItems:"center",color:"#64748b"}}>{icon}</span> {label}
    </span>
  );
}
