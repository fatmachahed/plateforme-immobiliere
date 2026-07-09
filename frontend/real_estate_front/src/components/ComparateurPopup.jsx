import React from "react";
import ReactDOM from "react-dom";
import { Link } from "react-router-dom";
import API_URL, { fmtDevise } from "../config";
import Logo from "./Logo";
import {
  GitCompare, X, Check, MapPin,
  Fence, Sun, Flower2, Droplets, ParkingCircle, ArrowUpDown, Car, Package, Sofa,
  Users, ShieldCheck, Heart, Waves, Mountain, TreePine,
  Wind, Thermometer, Flame, Tv, DoorClosed, LockKeyhole, Fingerprint,
  KeyRound, PhoneCall, Wifi, Monitor, Signal, UtensilsCrossed, ScrollText,
} from "lucide-react";
import { getCompareIds, useCompareMeta, removeFromCompare } from "../utils/compareStore";

const WashingMachineIco = ({ size = 16, strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2"/>
    <circle cx="12" cy="13" r="5"/>
    <circle cx="12" cy="13" r="2.5"/>
    <circle cx="8" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="11" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    <path d="M15 6h2"/>
  </svg>
);

/* Lignes de comparaison — identiques à l'ancienne page /comparateur */
const ROWS = [
  { key: "reference",          label: "Référence",               section: null,                    ico: null },
  { key: "prix",               label: "Prix",                    section: null,                    ico: null },
  { key: "categorie",          label: "Catégorie",               section: null,                    ico: null },
  { key: "type_bien",          label: "Type de bien",            section: null,                    ico: null },
  { key: "sous_type",          label: "Sous-type",               section: null,                    ico: null },
  { key: "etat_bien",          label: "État du bien",            section: null,                    ico: null },
  { key: "surface",            label: "Surface (m²)",            section: null,                    ico: null },
  { key: "pieces",             label: "Pièces",                  section: null,                    ico: null },
  { key: "chambres",           label: "Chambres",                section: null,                    ico: null },
  { key: "salles_bain",        label: "Salles de bain",          section: null,                    ico: null },
  { key: "etage",              label: "Étage",                   section: null,                    ico: null },
  { key: "hauteur_immeuble",   label: "Hauteur immeuble",        section: null,                    ico: null },
  { key: "nb_appartements",    label: "Nb appartements",         section: null,                    ico: null },
  { key: "orientation",        label: "Orientation",             section: null,                    ico: null },
  { key: "annee_construction", label: "Année de construction",   section: null,                    ico: null },
  { key: "gouvernorat",        label: "Gouvernorat",             section: null,                    ico: null },
  { key: "delegation",         label: "Délégation",              section: null,                    ico: null },
  { key: "adresse",            label: "Adresse",                 section: null,                    ico: null },
  { key: "titre_foncier",      label: "Titre foncier",           section: null,                    ico: ScrollText },
  { key: "sec_jardin",         label: "Jardin",                  section: "Extérieur & communs",   ico: Fence },
  { key: "sec_terrasse",       label: "Terrasse",                section: "Extérieur & communs",   ico: Sun },
  { key: "sec_balcon",         label: "Balcon",                  section: "Extérieur & communs",   ico: Flower2 },
  { key: "sec_parking",        label: "Parking",                 section: "Extérieur & communs",   ico: ParkingCircle },
  { key: "sec_garage",         label: "Garage",                  section: "Extérieur & communs",   ico: Car },
  { key: "sec_ascenseur",      label: "Ascenseur",               section: "Extérieur & communs",   ico: ArrowUpDown },
  { key: "sec_piscine",        label: "Piscine",                 section: "Extérieur & communs",   ico: Droplets },
  { key: "sec_vue_mer",        label: "Vue mer",                 section: "Extérieur & communs",   ico: Waves },
  { key: "sec_vue_montagne",   label: "Vue sur montagne",        section: "Extérieur & communs",   ico: Mountain },
  { key: "sec_vue_foret",      label: "Vue sur forêt",           section: "Extérieur & communs",   ico: TreePine },
  { key: "sec_meuble",         label: "Meublé",                  section: "Extérieur & communs",   ico: Sofa },
  { key: "sec_concierge",      label: "Concierge",               section: "Extérieur & communs",   ico: Users },
  { key: "sec_gardien",        label: "Gardien",                 section: "Extérieur & communs",   ico: ShieldCheck },
  { key: "sec_animaux",        label: "Animaux admis",           section: "Extérieur & communs",   ico: Heart },
  { key: "sec_cellier",        label: "Cellier",                 section: "Extérieur & communs",   ico: Package },
  { key: "int_clim",           label: "Climatisation",           section: "Intérieur",             ico: Wind },
  { key: "int_chauffage",      label: "Chauffage central",       section: "Intérieur",             ico: Thermometer },
  { key: "int_cheminee",       label: "Cheminée",                section: "Intérieur",             ico: Flame },
  { key: "int_salon_americain",label: "Salon américain",         section: "Intérieur",             ico: Tv },
  { key: "int_double_vitrage", label: "Double vitrage",          section: "Intérieur",             ico: DoorClosed },
  { key: "int_porte_blindee",  label: "Porte blindée",           section: "Intérieur",             ico: LockKeyhole },
  { key: "int_securite",       label: "Sécurité",                section: "Intérieur",             ico: Fingerprint },
  { key: "int_digicode",       label: "Digicode",                section: "Intérieur",             ico: KeyRound },
  { key: "int_interphone",     label: "Interphone",              section: "Intérieur",             ico: PhoneCall },
  { key: "int_fibre",          label: "Fibre optique",           section: "Intérieur",             ico: Signal },
  { key: "int_internet",       label: "Internet",                section: "Intérieur",             ico: Wifi },
  { key: "int_tv",             label: "TV",                      section: "Intérieur",             ico: Monitor },
  { key: "int_onas",           label: "Relié ONAS",              section: "Intérieur",             ico: Droplets },
  { key: "cui_equipee",        label: "Cuisine équipée",         section: "Cuisine & équipements", ico: UtensilsCrossed },
  { key: "cui_machine_laver",  label: "Machine à laver",         section: "Cuisine & équipements", ico: WashingMachineIco },
  { key: "cui_frigo",          label: "Réfrigérateur",           section: "Cuisine & équipements", ico: null },
  { key: "cui_four",           label: "Four",                    section: "Cuisine & équipements", ico: null },
];

function isBoolTrue(a, key) {
  const cg = a.caractere_general || {};
  const ci = a.caracteristique_interieure || {};
  const feat = (k) => !!(a[k] || cg[k] || ci[k]);
  const cu = a.cuisine_equipee_obj || a.cuisine_equipee || {};
  switch (key) {
    case "sec_jardin":         return feat("jardin");
    case "sec_terrasse":       return feat("terrasse");
    case "sec_balcon":         return feat("balcon");
    case "sec_parking":        return feat("parking");
    case "sec_garage":         return feat("garage");
    case "sec_ascenseur":      return feat("ascenseur");
    case "sec_piscine":        return feat("piscine");
    case "sec_vue_mer":        return feat("vue_mer");
    case "sec_vue_montagne":   return feat("vue_montagne");
    case "sec_vue_foret":      return feat("vue_foret");
    case "sec_meuble":         return feat("meuble");
    case "sec_concierge":      return feat("concierge");
    case "sec_gardien":        return feat("gardien");
    case "sec_animaux":        return feat("animaux_admis");
    case "sec_cellier":        return feat("cellier");
    case "int_clim":           return feat("climatisation");
    case "int_chauffage":      return feat("chauffage_centrale") || feat("chauffage_central");
    case "int_cheminee":       return feat("cheminee");
    case "int_salon_americain":return feat("salon_americain");
    case "int_double_vitrage": return feat("double_vitrage");
    case "int_porte_blindee":  return feat("porte_blindee");
    case "int_securite":       return feat("securite");
    case "int_digicode":       return feat("digicode");
    case "int_interphone":     return feat("interphone");
    case "int_fibre":          return feat("fibre_optique");
    case "int_internet":       return feat("internet");
    case "int_tv":             return feat("tv");
    case "int_onas":           return feat("relie_onas");
    case "cui_equipee":        return feat("cuisine_equipee");
    case "cui_machine_laver":  return feat("machine_laver");
    case "cui_frigo":          return !!(cu.refrigerateur || feat("refrigerateur"));
    case "cui_four":           return !!(cu.four || feat("four"));
    default: return false;
  }
}

function boolCell(v) {
  return v
    ? <Check size={16} strokeWidth={2.5} style={{color:"#16a34a"}}/>
    : <X size={16} strokeWidth={2.5} style={{color:"#cbd5e1"}}/>;
}

function val(a, key) {
  const prop = a.property || a.prop || a;
  const cg   = a.caractere_general || {};
  const ci   = a.caracteristique_interieure || {};
  const cu   = a.cuisine_equipee_obj || a.cuisine_equipee || {};
  const feat = (k) => !!(a[k] || cg[k] || ci[k]);
  const TYPE_FR = { appartement:"Appartement", villa:"Villa/Maison", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", immeuble:"Immeuble", garage_parking:"Garage/Parking", depot_stockage:"Dépôt de stockage", batiment_industriel:"Bâtiment industriel", immobiliers_divers:"Immobiliers divers" };
  const ETAT_FR = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"À rénover", cours_construction:"En construction" };
  const CAT_FR  = { vente:"Vente", location:"Location", vacances:"Vacances" };
  const ORIENT_FR = { nord:"Nord", nord_est:"Nord-Est", est:"Est", sud_est:"Sud-Est", sud:"Sud", sud_ouest:"Sud-Ouest", ouest:"Ouest", nord_ouest:"Nord-Ouest" };
  switch (key) {
    case "reference":          return a.reference || "—";
    case "prix":               return a.prix != null ? `${Number(a.prix).toLocaleString("fr-FR")} ${a.devise || "TND"}` : "—";
    case "categorie":          return CAT_FR[a.categorie] || a.categorie || "—";
    case "type_bien":          return TYPE_FR[a.type_bien] || a.type_bien || "—";
    case "sous_type":          return a.type_appartement || a.type_villa || a.type_terrain || "—";
    case "etat_bien":          return ETAT_FR[a.etat_bien] || a.etat_bien || "—";
    case "surface":            return a.superficie != null ? `${a.superficie} m²` : (prop.surface != null ? `${prop.surface} m²` : "—");
    case "pieces":             return a.nb_pieces ?? a.pieces ?? "—";
    case "chambres":           return a.nb_chambres ?? a.chambres ?? "—";
    case "salles_bain":        return a.nb_salles_bain ?? a.salles_bain ?? "—";
    case "etage":              return a.etage != null ? a.etage : "—";
    case "hauteur_immeuble":   return a.hauteur_immeuble || "—";
    case "nb_appartements":    return a.nb_appartements != null ? a.nb_appartements : "—";
    case "orientation":        return ORIENT_FR[a.orientation_immeuble] || a.orientation_immeuble || "—";
    case "annee_construction": return a.annee_construction ?? "—";
    case "gouvernorat":        return a.gouvernorat || prop.gouvernorat || "—";
    case "delegation":         return a.delegation || prop.delegation || "—";
    case "adresse":            return a.adresse || prop.address || prop.adresse || "—";
    case "titre_foncier":      return a.titre_foncier || "—";
    case "sec_jardin":         return boolCell(feat("jardin"));
    case "sec_terrasse":       return boolCell(feat("terrasse"));
    case "sec_balcon":         return boolCell(feat("balcon"));
    case "sec_parking":        return boolCell(feat("parking"));
    case "sec_garage":         return boolCell(feat("garage"));
    case "sec_ascenseur":      return boolCell(feat("ascenseur"));
    case "sec_piscine":        return boolCell(feat("piscine"));
    case "sec_vue_mer":        return boolCell(feat("vue_mer"));
    case "sec_vue_montagne":   return boolCell(feat("vue_montagne"));
    case "sec_vue_foret":      return boolCell(feat("vue_foret"));
    case "sec_meuble":         return boolCell(feat("meuble"));
    case "sec_concierge":      return boolCell(feat("concierge"));
    case "sec_gardien":        return boolCell(feat("gardien"));
    case "sec_animaux":        return boolCell(feat("animaux_admis"));
    case "sec_cellier":        return boolCell(feat("cellier"));
    case "int_clim":           return boolCell(feat("climatisation"));
    case "int_chauffage":      return boolCell(feat("chauffage_centrale") || feat("chauffage_central"));
    case "int_cheminee":       return boolCell(feat("cheminee"));
    case "int_salon_americain":return boolCell(feat("salon_americain"));
    case "int_double_vitrage": return boolCell(feat("double_vitrage"));
    case "int_porte_blindee":  return boolCell(feat("porte_blindee"));
    case "int_securite":       return boolCell(feat("securite"));
    case "int_digicode":       return boolCell(feat("digicode"));
    case "int_interphone":     return boolCell(feat("interphone"));
    case "int_fibre":          return boolCell(feat("fibre_optique"));
    case "int_internet":       return boolCell(feat("internet"));
    case "int_tv":             return boolCell(feat("tv"));
    case "int_onas":           return boolCell(feat("relie_onas"));
    case "cui_equipee":        return boolCell(feat("cuisine_equipee"));
    case "cui_machine_laver":  return boolCell(feat("machine_laver"));
    case "cui_frigo":          return boolCell(cu.refrigerateur || feat("refrigerateur"));
    case "cui_four":           return boolCell(cu.four || feat("four"));
    default: return "—";
  }
}

/* ─── Vue « aperçu » : petite liste des biens sélectionnés ─── */
function PreviewView({ meta, onGoFull, onClose }) {
  const catColors = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
  return (
    <div style={{position:"fixed",inset:0,zIndex:99990,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={onClose}>
      <div style={{background:"#fff",borderRadius:20,maxWidth:520,width:"100%",padding:"28px 26px",boxShadow:"0 30px 80px rgba(0,0,0,.28)",position:"relative"}}
        onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"#f1f5f9",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={16}/></button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <Logo variant="color" height={30} to={null}/>
          <div>
            <div style={{fontSize:17,fontWeight:800,color:"#0f172a"}}>Sélection pour comparaison</div>
            <div style={{fontSize:12.5,color:"#94a3b8"}}>{meta.length} bien{meta.length>1?"s":""} sélectionné{meta.length>1?"s":""} · max 4</div>
          </div>
        </div>
        <div style={{height:1,background:"#f1f5f9",margin:"18px 0"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22,maxHeight:320,overflowY:"auto"}}>
          {meta.map(d => {
            const id = String(d.id);
            const catColor = catColors[d.categorie] || "#4f46e5";
            const location = d.delegation || d.gouvernorat || "";
            return (
              <div key={id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:12,background:"#f8fafc",border:"1.5px solid #e5e7eb"}}>
                <div style={{width:10,height:10,borderRadius:"50%",flexShrink:0,background:catColor,boxShadow:`0 0 0 3px ${catColor}22`}}/>
                {d.image
                  ? <img src={d.image} style={{width:60,height:46,objectFit:"cover",borderRadius:8,flexShrink:0,background:"#e5e7eb"}} onError={e=>{e.target.style.display="none";}}/>
                  : <div style={{width:60,height:46,borderRadius:8,background:"#e5e7eb",flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.titre || `Annonce #${id}`}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                    {location && <span style={{display:"inline-flex",alignItems:"center",gap:3}}><MapPin size={11} strokeWidth={2} style={{color:"#94a3b8",flexShrink:0}}/>{location}</span>}
                    {d.prix != null && <span style={{fontWeight:700,color:catColor}}>{Number(d.prix).toLocaleString("fr-TN")} {fmtDevise(d.devise)}</span>}
                  </div>
                </div>
                <button onClick={()=>removeFromCompare(id)} style={{background:"none",border:"1.5px solid #e5e7eb",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>×</button>
              </div>
            );
          })}
        </div>
        {meta.length === 0 ? (
          <div style={{textAlign:"center",color:"#94a3b8",fontSize:14,paddingBottom:8}}>Sélectionnez des biens pour les comparer.</div>
        ) : (
          <div style={{display:"flex",gap:12}}>
            <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#f8fafc",color:"#374151",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>Fermer</button>
            <button onClick={onGoFull} style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <GitCompare size={16}/> Aller au comparateur
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Vue « comparateur complet » : tableau identique à l'ancienne page ─── */
function FullView({ onBack, onClose }) {
  const ids = getCompareIds();
  const [annonces, setAnnonces] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    Promise.all(ids.map(id =>
      fetch(`${API_URL}/annonces/${id}/detail`).then(r => r.ok ? r.json() : null).catch(() => null)
    )).then(res => { setAnnonces(res.filter(Boolean)); setLoading(false); });
  }, []); // eslint-disable-line

  function removeOne(id) {
    const remaining = removeFromCompare(id);
    setAnnonces(prev => prev.filter(a => String(a.id) !== String(id)));
    if (remaining === 0) onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,12,20,.65)",zIndex:99990,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"4vh 12px"}}
      onClick={onClose}>
      <div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:1000,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 70px rgba(0,0,0,.3)",overflow:"hidden"}}
        onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          <button onClick={onBack} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:600,fontSize:13,color:"#475569"}}>← Retour</button>
          <GitCompare size={18} color="#6366f1"/>
          <span style={{fontWeight:800,fontSize:16,color:"#0f172a",flex:1}}>Comparateur d'annonces</span>
          <span style={{fontSize:13,color:"#64748b",fontWeight:500}}>{annonces.length} bien{annonces.length!==1?"s":""}</span>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600,fontSize:13,color:"#475569"}}>
            <X size={14}/> Fermer
          </button>
        </div>
        {/* Corps — scrollable vertical + horizontal */}
        <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
          {loading ? (
            <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Chargement…</div>
          ) : annonces.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Aucune annonce à comparer.</div>
          ) : (
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:Math.max(600, 170 + annonces.length*210)}}>
              <thead>
                <tr>
                  <th style={{position:"sticky",left:0,zIndex:2,background:"#fff",textAlign:"left",padding:"14px 16px",borderBottom:"1px solid #e2e8f0",color:"#64748b",fontSize:13,fontWeight:700,width:170,minWidth:170}}>Critère</th>
                  {annonces.map(a => (
                    <th key={a.id} style={{padding:"14px 16px",borderBottom:"1px solid #e2e8f0",minWidth:210,verticalAlign:"top"}}>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                          <Link to={`/annonce/${a.id}`} onClick={onClose} style={{fontWeight:700,color:"#0f172a",fontSize:14,textDecoration:"none",lineHeight:1.3}}>
                            {a.titre || `Annonce #${a.id}`}
                          </Link>
                          <button onClick={()=>removeOne(a.id)} title="Retirer" style={{background:"#fee2e2",border:"none",borderRadius:8,padding:4,cursor:"pointer",color:"#dc2626",flexShrink:0}}>
                            <X size={14}/>
                          </button>
                        </div>
                        {(a.image_principale || a.image) && (
                          <img src={(a.image_principale || a.image).startsWith("http") ? (a.image_principale || a.image) : `${API_URL}${a.image_principale || a.image}`}
                            alt="" style={{width:"100%",height:110,objectFit:"cover",borderRadius:10}}/>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = [];
                  let lastSection = null;
                  let rowIdx = 0;
                  for (const row of ROWS) {
                    if (row.section) {
                      if (!annonces.some(a => isBoolTrue(a, row.key))) continue;
                    } else {
                      if (!annonces.some(a => { const v = val(a, row.key); return v && v !== "—"; })) continue;
                    }
                    if (row.section && row.section !== lastSection) {
                      lastSection = row.section;
                      rows.push(
                        <tr key={`sec-${row.section}`}>
                          <td colSpan={annonces.length + 1} style={{padding:"10px 16px 6px",fontWeight:800,fontSize:11.5,color:"#6366f1",background:"#f0f0ff",textTransform:"uppercase",letterSpacing:".08em",borderBottom:"1px solid #e0e0ff"}}>{row.section}</td>
                        </tr>
                      );
                    }
                    rows.push(
                      <tr key={row.key} style={{background: rowIdx % 2 === 0 ? "#fff" : "#f8fafc"}}>
                        <td style={{position:"sticky",left:0,zIndex:1,background:"inherit",padding:"12px 16px",fontWeight:600,color:"#475569",fontSize:13,borderBottom:"1px solid #f1f5f9"}}>
                          <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                            {row.ico && <row.ico size={15} strokeWidth={1.8} style={{color:"#64748b",flexShrink:0}}/>}
                            {row.label}
                          </span>
                        </td>
                        {annonces.map(a => (
                          <td key={a.id} style={{padding:"12px 16px",color:"#0f172a",fontSize:13,borderBottom:"1px solid #f1f5f9",textAlign:"center"}}>
                            {val(a, row.key)}
                          </td>
                        ))}
                      </tr>
                    );
                    rowIdx++;
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Comparateur global : s'ouvre d'abord sur l'aperçu (petite liste des biens),
 * puis « Aller au comparateur » bascule sur le tableau complet — le tout en
 * popup superposée, jamais une page séparée. Monté une seule fois dans App.jsx.
 */
export default function ComparateurPopup({ onClose }) {
  const [mode, setMode] = React.useState("preview");
  const meta = useCompareMeta();

  if (mode === "full") {
    return ReactDOM.createPortal(
      <FullView onBack={() => setMode("preview")} onClose={onClose} />,
      document.body
    );
  }
  return ReactDOM.createPortal(
    <PreviewView meta={meta} onGoFull={() => setMode("full")} onClose={onClose} />,
    document.body
  );
}
