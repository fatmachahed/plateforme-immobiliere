import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API_URL from "../config";
import Navbar from "../components/Navbar";
import {
  X, ArrowLeft, Check,
  Fence, Sun, Flower2, Droplets, ParkingCircle, ArrowUpDown, Car, Package, Sofa,
  Users, ShieldCheck, Heart, Waves, Mountain, TreePine,
  Wind, Thermometer, Flame, Tv, DoorClosed, LockKeyhole, Fingerprint,
  KeyRound, PhoneCall, Wifi, Monitor, Signal, UtensilsCrossed,
  ScrollText,
} from "lucide-react";

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

function getCompare() { try { return JSON.parse(localStorage.getItem("localizi_compare")||"[]"); } catch { return []; } }
function setCompare(arr) { localStorage.setItem("localizi_compare", JSON.stringify(arr)); window.dispatchEvent(new Event("compare-updated")); }

const ROWS = [
  // ── Identité ──
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
  // ── Extérieur & communs ──
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
  // ── Intérieur ──
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
  // ── Cuisine & équipements ──
  { key: "cui_equipee",        label: "Cuisine équipée",         section: "Cuisine & équipements", ico: UtensilsCrossed },
  { key: "cui_machine_laver",  label: "Machine à laver",         section: "Cuisine & équipements", ico: WashingMachineIco },
  { key: "cui_frigo",          label: "Réfrigérateur",           section: "Cuisine & équipements", ico: null },
  { key: "cui_four",           label: "Four",                    section: "Cuisine & équipements", ico: null },
];

export default function Comparateur() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  const ids = (params.get("ids") || "").split(",").map(s => s.trim()).filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const results = await Promise.all(ids.map(async id => {
        try {
          const r = await fetch(`${API_URL}/annonces/${id}/detail`);
          if (!r.ok) return null;
          const d = await r.json();
          return d;
        } catch { return null; }
      }));
      if (!cancelled) {
        setAnnonces(results.filter(Boolean));
        setLoading(false);
      }
    }
    if (ids.length) load(); else { setAnnonces([]); setLoading(false); }
    return () => { cancelled = true; };
  }, [params.toString()]);

  function remove(id) {
    const arr = getCompare().filter(x => String(x) !== String(id));
    setCompare(arr);
    navigate(arr.length ? `/comparateur?ids=${arr.join(",")}` : "/comparateur");
  }

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

  function bool(v) {
    return v
      ? <Check size={16} strokeWidth={2.5} style={{color:"#16a34a"}}/>
      : <X size={16} strokeWidth={2.5} style={{color:"#94a3b8"}}/>;
  }

  function val(a, key) {
    const prop = a.property || a.prop || a;
    const cg   = a.caractere_general || {};
    const ci   = a.caracteristique_interieure || {};
    const cu   = a.cuisine_equipee_obj || a.cuisine_equipee || {};
    // helper: check both direct field and nested objects
    const feat = (k) => !!(a[k] || cg[k] || ci[k]);
    const TYPE_FR = { appartement:"Appartement", villa:"Villa/Maison", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme agricole", ferme_agricole:"Ferme agricole", immeuble:"Immeuble", garage_parking:"Garage/Parking", depot_stockage:"Dépôt de stockage", immobiliers_divers:"Immobiliers divers" };
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
      // Extérieur & communs
      case "sec_jardin":         return bool(feat("jardin"));
      case "sec_terrasse":       return bool(feat("terrasse"));
      case "sec_balcon":         return bool(feat("balcon"));
      case "sec_parking":        return bool(feat("parking"));
      case "sec_garage":         return bool(feat("garage"));
      case "sec_ascenseur":      return bool(feat("ascenseur"));
      case "sec_piscine":        return bool(feat("piscine"));
      case "sec_vue_mer":        return bool(feat("vue_mer"));
      case "sec_vue_montagne":   return bool(feat("vue_montagne"));
      case "sec_vue_foret":      return bool(feat("vue_foret"));
      case "sec_meuble":         return bool(feat("meuble"));
      case "sec_concierge":      return bool(feat("concierge"));
      case "sec_gardien":        return bool(feat("gardien"));
      case "sec_animaux":        return bool(feat("animaux_admis"));
      case "sec_cellier":        return bool(feat("cellier"));
      // Intérieur
      case "int_clim":           return bool(feat("climatisation"));
      case "int_chauffage":      return bool(feat("chauffage_centrale") || feat("chauffage_central"));
      case "int_cheminee":       return bool(feat("cheminee"));
      case "int_salon_americain":return bool(feat("salon_americain"));
      case "int_double_vitrage": return bool(feat("double_vitrage"));
      case "int_porte_blindee":  return bool(feat("porte_blindee"));
      case "int_securite":       return bool(feat("securite"));
      case "int_digicode":       return bool(feat("digicode"));
      case "int_interphone":     return bool(feat("interphone"));
      case "int_fibre":          return bool(feat("fibre_optique"));
      case "int_internet":       return bool(feat("internet"));
      case "int_tv":             return bool(feat("tv"));
      case "int_onas":           return bool(feat("relie_onas"));
      // Cuisine
      case "cui_equipee":        return bool(feat("cuisine_equipee"));
      case "cui_machine_laver":  return bool(feat("machine_laver"));
      case "cui_frigo":          return bool(cu.refrigerateur || feat("refrigerateur"));
      case "cui_four":           return bool(cu.four || feat("four"));
      default: return "—";
    }
  }

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc"}}>
      <Navbar />
      <div style={{maxWidth:1200, margin:"0 auto", padding:"24px 16px 60px"}}>
        <button onClick={() => navigate("/carte")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#6366f1",fontWeight:600,cursor:"pointer",marginBottom:16,fontSize:14}}>
          <ArrowLeft size={16}/> Retour à la carte
        </button>
        <h1 style={{fontSize:24, fontWeight:800, color:"#0f172a", marginBottom:18}}>Comparateur d'annonces</h1>

        {loading ? (
          <div style={{padding:40, textAlign:"center", color:"#94a3b8"}}>Chargement...</div>
        ) : annonces.length === 0 ? (
          <div style={{padding:40, textAlign:"center", color:"#94a3b8"}}>
            Aucune annonce à comparer. Ajoutez des annonces depuis la carte ou une page de détail.
          </div>
        ) : (
          <div style={{overflowX:"auto", background:"#fff", borderRadius:14, border:"1px solid #e2e8f0"}}>
            <table style={{width:"100%", borderCollapse:"collapse", minWidth:600}}>
              <thead>
                <tr>
                  <th style={{textAlign:"left", padding:"14px 16px", borderBottom:"1px solid #e2e8f0", color:"#64748b", fontSize:13, fontWeight:700, width:160}}>Critère</th>
                  {annonces.map(a => (
                    <th key={a.id} style={{padding:"14px 16px", borderBottom:"1px solid #e2e8f0", minWidth:220, verticalAlign:"top"}}>
                      <div style={{display:"flex", flexDirection:"column", gap:8}}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}>
                          <Link to={`/annonce/${a.id}`} style={{fontWeight:700, color:"#0f172a", fontSize:14.5, textDecoration:"none"}}>
                            {a.titre || a.title || `Annonce #${a.id}`}
                          </Link>
                          <button onClick={() => remove(a.id)} title="Retirer" style={{background:"#f1f5f9", border:"none", borderRadius:8, padding:4, cursor:"pointer", color:"#64748b", flexShrink:0}}>
                            <X size={14}/>
                          </button>
                        </div>
                        {(a.image_principale || a.image) && (
                          <img src={(a.image_principale || a.image).startsWith("http") ? (a.image_principale || a.image) : `${API_URL}${a.image_principale || a.image}`}
                               alt="" style={{width:"100%", height:120, objectFit:"cover", borderRadius:10}}/>
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
                    /* Filtrer : booléens → au moins un vrai ; textuels → au moins une valeur */
                    if (row.section) {
                      const hasTrue = annonces.some(a => isBoolTrue(a, row.key));
                      if (!hasTrue) continue;
                    } else {
                      const hasVal = annonces.some(a => { const v = val(a, row.key); return v && v !== "—"; });
                      if (!hasVal) continue;
                    }
                    /* En-tête de section si nouvelle */
                    if (row.section && row.section !== lastSection) {
                      lastSection = row.section;
                      rows.push(
                        <tr key={`sec-${row.section}`}>
                          <td colSpan={annonces.length + 1} style={{
                            padding:"10px 16px 6px", fontWeight:800, fontSize:11.5,
                            color:"#6366f1", background:"#f0f0ff", textTransform:"uppercase",
                            letterSpacing:".08em", borderBottom:"1px solid #e0e0ff",
                          }}>{row.section}</td>
                        </tr>
                      );
                    }
                    rows.push(
                      <tr key={row.key} style={{background: rowIdx % 2 === 0 ? "#fff" : "#f8fafc"}}>
                        <td style={{padding:"12px 16px", fontWeight:600, color:"#475569", fontSize:13, borderBottom:"1px solid #f1f5f9"}}>
                          <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
                            {row.ico && <row.ico size={15} strokeWidth={1.8} style={{color:"#64748b", flexShrink:0}}/>}
                            {row.label}
                          </span>
                        </td>
                        {annonces.map(a => (
                          <td key={a.id} style={{padding:"12px 16px", color:"#0f172a", fontSize:13, borderBottom:"1px solid #f1f5f9", textAlign:"center"}}>
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
          </div>
        )}
      </div>
    </div>
  );
}
