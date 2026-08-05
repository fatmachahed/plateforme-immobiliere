/**
 * AlerteFiltersModal
 * Popup de création/modification d'alerte avec exactement les mêmes filtres
 * que le panneau de recherche de la CartePage (3 niveaux géo, toutes les caractéristiques).
 */
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import API_URL from "../config";
import {
  X, Check, ChevronDown, SlidersHorizontal, Save, Bell,
  Home, Key, Sun as SunIcon,
  Waves, Mountain, TreePine, Fence, Sun, Flower2, Droplets, ParkingCircle,
  ArrowUpDown, Car, Package, Sofa, Users, ShieldCheck, Heart,
  UtensilsCrossed, Wind, Thermometer, Flame, DoorClosed, LockKeyhole,
  Fingerprint, Wifi, Monitor, RefreshCw, KeyRound, PhoneCall,
  Wrench, HardHat, ThumbsUp,
} from "lucide-react";

const EMPTY_FORM = {
  nom: "",
  categories: [],
  type: "",
  govId: "", govNom: "",
  delId: "", delNom: "",
  locId: "", locNom: "",
  prixMin: "", prixMax: "",
  superficieMin: "", superficieMax: "",
  bedsMin: "", piecesMin: "", chambresMin: "",
  etat: "",
  titre_foncier: "",
  type_terrain: "", vocation_terrain: "",
  type_appartement: "", type_villa: "", etage: "",
  features: [],
  email_alert: true,
};

export { EMPTY_FORM };

const FEAT_SECTIONS = [
  { section: "Vue", items: [
    { k:"vue_mer",      l:"Vue sur mer",       Ico:Waves        },
    { k:"vue_montagne", l:"Vue sur montagne",       Ico:Mountain     },
    { k:"vue_foret",    l:"Vue sur forêt",          Ico:TreePine     },
  ]},
  { section: "Espaces extérieurs", items: [
    { k:"jardin",    l:"Jardin",    Ico:Fence         },
    { k:"terrasse",  l:"Terrasse",  Ico:Sun           },
    { k:"balcon",    l:"Balcon",    Ico:Flower2       },
    { k:"piscine",   l:"Piscine",   Ico:Droplets      },
    { k:"parking",   l:"Parking",   Ico:ParkingCircle },
  ]},
  { section: "Commodités", items: [
    { k:"ascenseur",     l:"Ascenseur",          Ico:ArrowUpDown },
    { k:"garage",        l:"Garage",              Ico:Car         },
    { k:"cellier",       l:"Cellier",  Ico:Package     },
    { k:"meuble",        l:"Meublé",              Ico:Sofa        },
    { k:"concierge",     l:"Concierge",           Ico:Users       },
    { k:"gardien",       l:"Gardien",             Ico:ShieldCheck },
    { k:"animaux_admis", l:"Animaux admis",       Ico:Heart       },
  ]},
  { section: "Intérieur & équipements", items: [
    { k:"cuisine_equipee",   l:"Cuisine équipée",  Ico:UtensilsCrossed },
    { k:"climatisation",     l:"Climatisation",     Ico:Wind            },
    { k:"chauffage_centrale",l:"Chauffage central", Ico:Thermometer     },
    { k:"cheminee",          l:"Cheminée",          Ico:Flame           },
    { k:"double_vitrage",    l:"Double vitrage",    Ico:DoorClosed      },
    { k:"porte_blindee",     l:"Porte blindée",     Ico:LockKeyhole     },
    { k:"securite",          l:"Sécurité",          Ico:Fingerprint     },
    { k:"internet",          l:"Internet",           Ico:Wifi            },
    { k:"tv",                l:"TV",                 Ico:Monitor         },
    { k:"machine_laver",     l:"Machine à laver",   Ico:RefreshCw       },
    { k:"digicode",          l:"Digicode",           Ico:KeyRound        },
    { k:"interphone",        l:"Interphone",         Ico:PhoneCall       },
  ]},
];

export default function AlerteFiltersModal({ form, setForm, onClose, onSave, saving, isEdit }) {
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [gouvernorats, setGouvernorats]   = useState([]);
  const [delegations,  setDelegations]    = useState([]);
  const [localites,    setLocalites]      = useState([]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* Chargement des gouvernorats */
  useEffect(() => {
    fetch(`${API_URL}/localisation/gouvernorats`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setGouvernorats(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /* Chargement des délégations quand gouvernorat change */
  useEffect(() => {
    if (!form.govId) { setDelegations([]); setLocalites([]); return; }
    fetch(`${API_URL}/localisation/delegations?gouvernorat_id=${form.govId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setDelegations(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [form.govId]);

  /* Chargement des localités quand délégation change */
  useEffect(() => {
    if (!form.delId) { setLocalites([]); return; }
    fetch(`${API_URL}/localisation/localites?delegation_id=${form.delId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setLocalites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [form.delId]);

  const feats = form.features || [];
  const nbFeats = feats.length;

  const inp = {
    width:"100%", padding:"9px 13px", borderRadius:9,
    border:"1.5px solid #e2e8f0", fontFamily:"inherit", fontSize:13.5,
    outline:"none", background:"#f8fafc", boxSizing:"border-box", color:"#0f172a",
  };
  const selH = { ...inp, appearance:"none", cursor:"pointer" };

  return ReactDOM.createPortal(
    <>
      <style>{`
        @media (max-width: 860px) {
          .alm-outer { padding: 0 !important; align-items: flex-end !important; }
          .alm-box { border-radius: 20px 20px 0 0 !important; max-height: 96vh !important; max-width: 100% !important; width: 100% !important; }
          .alm-body { padding: 12px 14px !important; gap: 12px !important; }
          .alm-header { padding: 14px 16px 12px !important; }
          .alm-footer { padding: 12px 16px 16px !important; }
          .alm-feat-outer { padding: 0 !important; align-items: flex-end !important; }
          .alm-feat-box { border-radius: 20px 20px 0 0 !important; max-height: 96vh !important; max-width: 100% !important; width: 100% !important; }
          .alm-feat-header { padding: 14px 16px 10px !important; }
          .alm-feat-body { padding: 12px 14px !important; }
          .alm-feat-footer { padding: 10px 16px 14px !important; }
          .alm-feat-section { margin-bottom: 18px !important; }
          .alm-feat-grid { grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)) !important; gap: 6px !important; }
          .alm-feat-btn { padding: 10px 4px 8px !important; min-height: 64px !important; gap: 4px !important; border-radius: 10px !important; }
          .alm-feat-btn svg { width: 22px !important; height: 22px !important; }
          .alm-feat-label { font-size: 9.5px !important; line-height: 1.25 !important; }
          .alm-feat-check { width: 13px !important; height: 13px !important; top: 5px !important; right: 5px !important; }
          .alm-feat-check svg { width: 8px !important; height: 8px !important; }
        }
      `}</style>
      {/* Overlay principal */}
      <div className="alm-outer" style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,.55)",
        zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:16,
        fontFamily:"'Inter',system-ui,sans-serif",
      }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
        <div className="alm-box" style={{
          background:"#fff", borderRadius:20, width:"100%", maxWidth:620,
          maxHeight:"92vh", display:"flex", flexDirection:"column",
          boxShadow:"0 24px 80px rgba(0,0,0,.28)", overflow:"hidden",
        }} onClick={e=>e.stopPropagation()}>

          {/* ─── Header ─── */}
          <div className="alm-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 16px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
            <div>
              <h3 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:0}}>
                {isEdit ? "Modifier l'alerte" : "Créer une alerte"}
              </h3>
              <p style={{fontSize:12.5,color:"#94a3b8",margin:"3px 0 0"}}>Définissez vos critères de recherche</p>
            </div>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:"50%",background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>
              <X size={16}/>
            </button>
          </div>

          {/* ─── Corps scrollable ─── */}
          <div className="alm-body" style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:18}}>

            {/* Nom */}
            <div>
              <label style={lbl}>Nom de l'alerte <span style={{color:"#ef4444"}}>*</span></label>
              <input type="text" value={form.nom} onChange={e=>set("nom",e.target.value)}
                placeholder="Ex: Appartement Tunis centre" style={inp}/>
            </div>

            {/* Catégorie */}
            <div>
              <label style={lbl}>Catégorie</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[
                  {v:"vente",    l:"Achat",    Ico:Home   },
                  {v:"location", l:"Location", Ico:Key    },
                  {v:"vacances", l:"Vacances", Ico:SunIcon},
                ].map(({v, l, Ico}) => {
                  const on = (form.categories||[]).includes(v);
                  return (
                    <button key={v} type="button"
                      onClick={() => set("categories", on ? [] : [v])}
                      style={{...pillBtn, borderColor:on?"#6366f1":"#e2e8f0",background:on?"#eef2ff":"#f8fafc",color:on?"#4f46e5":"#64748b"}}>
                      {on ? <Check size={11}/> : <Ico size={11}/>} {l}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type de bien */}
            <div>
              <label style={lbl}>Type de bien</label>
              <select value={form.type||""} onChange={e=>set("type",e.target.value)} style={selH}>
                <option value="">Tous les types</option>
                {[["appartement","Appartement"],["duplex","Duplex"],["penthouse","Penthouse"],["villa","Villa/Maison"],["terrain","Terrain"],
                  ["local_commercial","Local commercial"],["bureau","Bureau"],["ferme_agricole","Ferme agricole"],
                  ["immeuble","Immeuble"],["garage_parking","Garage/Parking"],
                  ["depot_stockage","Dépôt de stockage"],
                  ["batiment_industriel","Bâtiment industriel"],
                  ["immobiliers_divers","Immobiliers divers"]].map(([v,l])=>(
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {/* Appartement: type logement + étage */}
            {["appartement","duplex","penthouse"].includes(form.type) && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={lbl}>Type de logement</label>
                  <select value={form.type_appartement||""} onChange={e=>set("type_appartement",e.target.value)} style={selH}>
                    <option value="">Tous</option>
                    {[["studio","Studio"],["s0","S0"],["s+1","S+1"],["s+2","S+2"],["s+3","S+3"],["s+4","S+4"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Étage</label>
                  <select value={form.etage||""} onChange={e=>set("etage",e.target.value)} style={selH}>
                    <option value="">Tous</option>
                    <option value="0">RDC</option>
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n}{n===4?"e+":"e"} étage</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Villa: type */}
            {form.type === "villa" && (
              <div>
                <label style={lbl}>Type de villa</label>
                <select value={form.type_villa||""} onChange={e=>set("type_villa",e.target.value)} style={selH}>
                  <option value="">Toutes</option>
                  {[["r","RDC"],["r+1","R+1"],["r+2","R+2"],["r+3","R+3"],["r+4","R+4"]].map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Local commercial / Bureau: étage */}
            {(form.type === "local_commercial" || form.type === "bureau") && (
              <div>
                <label style={lbl}>Étage</label>
                <select value={form.etage||""} onChange={e=>set("etage",e.target.value)} style={selH}>
                  <option value="">Tous</option>
                  <option value="-1">Sous-sol</option>
                  <option value="0">RDC</option>
                  {[1,2,3,4].map(n=><option key={n} value={n}>R+{n}</option>)}
                </select>
              </div>
            )}

            {/* Terrain: type + vocation */}
            {form.type === "terrain" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={lbl}>Type de terrain</label>
                  <select value={form.type_terrain||""} onChange={e=>set("type_terrain",e.target.value)} style={selH}>
                    <option value="">Tous</option>
                    {[["agricole","Agricole"],["nu","Nu"],["zone_verte","Zone verte"],["lotissement","Lotissement"],["commercial","Commercial"],["industriel","Industriel"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Vocation</label>
                  <select value={form.vocation_terrain||""} onChange={e=>set("vocation_terrain",e.target.value)} style={selH}>
                    <option value="">Toutes</option>
                    {[["residentielle","Résidentielle"],["commerciale","Commerciale"],["industrielle","Industrielle"],["agricole","Agricole"],["touristique","Touristique"],["mixte","Mixte"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Localisation — 3 niveaux */}
            <div>
              <label style={lbl}>Localisation</label>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {/* Gouvernorat */}
                <select value={form.govId||""} onChange={e=>{
                  const opt = e.target.options[e.target.selectedIndex];
                  setForm(f=>({...f,govId:e.target.value,govNom:opt.text==="Tous les gouvernorats"?"":opt.text,delId:"",delNom:"",locId:"",locNom:""}));
                }} style={selH}>
                  <option value="">Tous les gouvernorats</option>
                  {gouvernorats.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}
                </select>
                {/* Délégation */}
                {form.govId && (
                  <select value={form.delId||""} onChange={e=>{
                    const opt = e.target.options[e.target.selectedIndex];
                    setForm(f=>({...f,delId:e.target.value,delNom:e.target.value?opt.text:"",locId:"",locNom:""}));
                  }} style={selH}>
                    <option value="">Toutes les délégations</option>
                    {delegations.map(d=><option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                )}
                {/* Localité */}
                {form.delId && (
                  <select value={form.locId||""} onChange={e=>{
                    const opt = e.target.options[e.target.selectedIndex];
                    setForm(f=>({...f,locId:e.target.value,locNom:e.target.value?opt.text:""}));
                  }} style={selH}>
                    <option value="">Toutes les localités</option>
                    {localites.map(l=><option key={l.id} value={l.id}>{l.nom}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Prix */}
            <div>
              <label style={lbl}>Prix (DT)</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input type="number" value={form.prixMin||""} onChange={e=>set("prixMin",e.target.value)} placeholder="Min" style={inp}/>
                <input type="number" value={form.prixMax||""} onChange={e=>set("prixMax",e.target.value)} placeholder="Max" style={inp}/>
              </div>
            </div>

            {/* Superficie */}
            <div>
              <label style={lbl}>Superficie (m²)</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input type="number" value={form.superficieMin||""} onChange={e=>set("superficieMin",e.target.value)} placeholder="Min m²" style={inp}/>
                <input type="number" value={form.superficieMax||""} onChange={e=>set("superficieMax",e.target.value)} placeholder="Max m²" style={inp}/>
              </div>
            </div>

            {/* Pièces / Chambres */}
            {form.type !== "terrain" && form.type !== "garage_parking" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={lbl}>Pièces min</label>
                  <select value={form.bedsMin||""} onChange={e=>set("bedsMin",e.target.value)} style={selH}>
                    <option value="">Indifférent</option>
                    {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Chambres min</label>
                  <select value={form.chambresMin||""} onChange={e=>set("chambresMin",e.target.value)} style={selH}>
                    <option value="">Indifférent</option>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* État du bien */}
            {form.type !== "terrain" && (
              <div>
                <label style={lbl}>État du bien</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[
                    {v:"nouveau",l:"Neuf",Ico:SunIcon},{v:"bon_etat",l:"Bon état",Ico:ThumbsUp},
                    {v:"a_renover",l:"À rénover",Ico:Wrench},{v:"cours_construction",l:"En construction",Ico:HardHat},
                  ].map(({v,l,Ico})=>(
                    <button key={v} type="button"
                      onClick={()=>set("etat",form.etat===v?"":v)}
                      style={{...pillBtn,borderColor:form.etat===v?"#6366f1":"#e2e8f0",background:form.etat===v?"#eef2ff":"#f8fafc",color:form.etat===v?"#4f46e5":"#64748b"}}>
                      {form.etat===v ? <Check size={11}/> : <Ico size={11}/>} {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Titre foncier (terrain) */}
            {form.type === "terrain" && (
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <label style={{...lbl,margin:0}}>Titre foncier uniquement</label>
                <input type="checkbox" checked={form.titre_foncier==="1"}
                  onChange={e=>set("titre_foncier",e.target.checked?"1":"")}
                  style={{accentColor:"#16a34a",width:16,height:16}}/>
              </div>
            )}

            {/* Autres critères (caractéristiques) */}
            {!["terrain","garage_parking","immeuble"].includes(form.type) && (
              <div>
                <button type="button"
                  onClick={()=>setShowFeatModal(true)}
                  style={{
                    display:"flex",alignItems:"center",gap:8,
                    padding:"10px 16px",borderRadius:10,
                    border:`1.5px solid ${nbFeats>0?"#6366f1":"#e2e8f0"}`,
                    background:nbFeats>0?"#eef2ff":"#f8fafc",
                    color:nbFeats>0?"#4f46e5":"#374151",
                    fontWeight:600,fontSize:13.5,cursor:"pointer",fontFamily:"inherit",
                    width:"100%",justifyContent:"center",
                  }}>
                  <SlidersHorizontal size={16}/>
                  Autres critères{nbFeats>0?` (${nbFeats} sélectionné${nbFeats>1?"s":""})`:""}
                </button>
              </div>
            )}

            {/* Alerte email toggle */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:12,background:"#f8fafc",border:"1px solid #e2e8f0"}}>
              <div>
                <p style={{fontWeight:700,color:"#0f172a",fontSize:14,margin:0,display:"flex",alignItems:"center",gap:6}}><Bell size={14} strokeWidth={2}/> Notifications email</p>
                <p style={{fontSize:12,color:"#64748b",margin:"2px 0 0"}}>Recevoir un email dès qu'une annonce correspond</p>
              </div>
              <label style={{position:"relative",display:"inline-block",width:44,height:24,cursor:"pointer",flexShrink:0}}>
                <input type="checkbox" checked={!!form.email_alert}
                  onChange={e=>set("email_alert",e.target.checked)}
                  style={{opacity:0,width:0,height:0}}/>
                <span style={{position:"absolute",inset:0,background:form.email_alert?"#6366f1":"#e5e7eb",borderRadius:20,transition:".2s"}}/>
                <span style={{position:"absolute",width:18,height:18,background:"#fff",borderRadius:"50%",top:3,left:form.email_alert?23:3,transition:".2s"}}/>
              </label>
            </div>

          </div>{/* /body */}

          {/* ─── Footer ─── */}
          <div className="alm-footer" style={{display:"flex",gap:10,padding:"16px 24px 20px",borderTop:"1px solid #f1f5f9",flexShrink:0,background:"#fafafa"}}>
            <button onClick={onClose}
              style={{flex:1,padding:"11px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#374151",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Annuler
            </button>
            <button onClick={onSave} disabled={saving||!form.nom?.trim()}
              style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:(saving||!form.nom?.trim())?0.6:1}}>
              {saving ? "Enregistrement…" : <><Save size={14} strokeWidth={2} style={{flexShrink:0}}/> {isEdit ? "Mettre à jour" : "Enregistrer l'alerte"}</>}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modal Autres critères (caractéristiques avec icônes) ─── */}
      {showFeatModal && ReactDOM.createPortal(
        <div className="alm-feat-outer" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Inter',system-ui,sans-serif"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowFeatModal(false);}}>
          <div className="alm-feat-box" style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:760,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,.30)"}}>
            <div className="alm-feat-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 28px 18px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
              <div>
                <h3 style={{fontSize:19,fontWeight:800,color:"#0f172a",margin:0}}>Caractéristiques</h3>
                <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Sélectionnez les équipements souhaités</p>
              </div>
              <button onClick={()=>setShowFeatModal(false)} style={{width:34,height:34,borderRadius:"50%",background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>
                <X size={16}/>
              </button>
            </div>

            <div className="alm-feat-body" style={{flex:1,overflowY:"auto",padding:"20px 28px"}}>
              {FEAT_SECTIONS.map(({section,items})=>(
                <div key={section} className="alm-feat-section" style={{marginBottom:28}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".6px",marginBottom:14}}>
                    {section}
                  </div>
                  <div className="alm-feat-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:10}}>
                    {items.map(({k,l,Ico})=>{
                      const isOn = feats.includes(k);
                      return (
                        <button key={k} type="button" className="alm-feat-btn"
                          onClick={()=>set("features",isOn?feats.filter(f=>f!==k):[...feats,k])}
                          style={{
                            position:"relative",
                            display:"flex",flexDirection:"column",alignItems:"center",
                            gap:7,padding:"18px 8px 14px",
                            borderRadius:14,border:"none",
                            background: isOn ? "#eef2ff" : "transparent",
                            cursor:"pointer",fontFamily:"inherit",
                            transition:"background .15s,transform .15s",
                            minHeight:90,
                          }}
                          onMouseEnter={e=>{ if(!isOn) e.currentTarget.style.background="#f8faff"; }}
                          onMouseLeave={e=>{ if(!isOn) e.currentTarget.style.background="transparent"; }}
                        >
                          <Ico size={36} strokeWidth={1.4}
                            style={{color: isOn?"#4f46e5":"#94a3b8",transition:"color .15s"}}/>
                          <span className="alm-feat-label" style={{fontSize:11.5,fontWeight:600,textAlign:"center",lineHeight:1.3,color:isOn?"#4f46e5":"#6b7280"}}>{l}</span>
                          {isOn && (
                            <div className="alm-feat-check" style={{position:"absolute",top:7,right:7,width:16,height:16,borderRadius:"50%",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <Check size={10} color="#fff" strokeWidth={3}/>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="alm-feat-footer" style={{display:"flex",gap:12,justifyContent:"space-between",alignItems:"center",padding:"16px 28px 20px",borderTop:"1px solid #f1f5f9",flexShrink:0,background:"#fafafa"}}>
              <span style={{fontSize:13,color:"#64748b"}}>
                {nbFeats>0 ? `${nbFeats} critère${nbFeats>1?"s":""} sélectionné${nbFeats>1?"s":""}` : "Aucun critère sélectionné"}
              </span>
              <div style={{display:"flex",gap:10}}>
                <button type="button" onClick={()=>set("features",[])}
                  style={{padding:"10px 18px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                  Tout effacer
                </button>
                <button type="button" onClick={()=>setShowFeatModal(false)}
                  style={{padding:"10px 22px",borderRadius:10,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit",boxShadow:"0 4px 14px rgba(15,23,42,.25)"}}>
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>,
    document.body
  );
}

/* Styles partagés */
const lbl = { display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:7, textTransform:"uppercase", letterSpacing:".05em" };
const pillBtn = { display:"inline-flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:20, border:"1.5px solid", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" };
