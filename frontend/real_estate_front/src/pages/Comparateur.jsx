import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API_URL from "../config";
import Navbar from "../components/Navbar";
import { X, ArrowLeft } from "lucide-react";

function getCompare() { try { return JSON.parse(localStorage.getItem("localizi_compare")||"[]"); } catch { return []; } }
function setCompare(arr) { localStorage.setItem("localizi_compare", JSON.stringify(arr)); window.dispatchEvent(new Event("compare-updated")); }

const ROWS = [
  { key: "prix",        label: "Prix" },
  { key: "type_bien",   label: "Type de bien" },
  { key: "categorie",   label: "Catégorie" },
  { key: "surface",     label: "Surface (m²)" },
  { key: "pieces",      label: "Pièces" },
  { key: "chambres",    label: "Chambres" },
  { key: "salles_bain", label: "Salles de bain" },
  { key: "gouvernorat", label: "Gouvernorat" },
  { key: "delegation",  label: "Délégation" },
  { key: "adresse",     label: "Adresse" },
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

  function val(a, key) {
    const prop = a.property || a.prop || a;
    switch (key) {
      case "prix":        return a.prix != null ? `${a.prix.toLocaleString("fr-FR")} DT` : "—";
      case "type_bien":   return a.type_bien || "—";
      case "categorie":   return a.categorie || "—";
      case "surface":     return prop.surface != null ? prop.surface : (a.surface != null ? a.surface : "—");
      case "pieces":      return a.pieces ?? "—";
      case "chambres":    return a.chambres ?? "—";
      case "salles_bain": return a.salles_bain ?? "—";
      case "gouvernorat": return a.gouvernorat || prop.gouvernorat || "—";
      case "delegation":  return a.delegation || prop.delegation || "—";
      case "adresse":     return prop.address || prop.adresse || "—";
      default: return "—";
    }
  }

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc"}}>
      <Navbar />
      <div style={{maxWidth:1200, margin:"0 auto", padding:"24px 16px 60px"}}>
        <button onClick={() => navigate(-1)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#6366f1",fontWeight:600,cursor:"pointer",marginBottom:16,fontSize:14}}>
          <ArrowLeft size={16}/> Retour
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
                {ROWS.map((row, i) => (
                  <tr key={row.key} style={{background: i % 2 === 0 ? "#fff" : "#f8fafc"}}>
                    <td style={{padding:"12px 16px", fontWeight:600, color:"#475569", fontSize:13.5, borderBottom:"1px solid #f1f5f9"}}>{row.label}</td>
                    {annonces.map(a => (
                      <td key={a.id} style={{padding:"12px 16px", color:"#0f172a", fontSize:13.5, borderBottom:"1px solid #f1f5f9"}}>
                        {val(a, row.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
