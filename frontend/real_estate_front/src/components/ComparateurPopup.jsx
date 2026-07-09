import React from "react";
import ReactDOM from "react-dom";
import { Link } from "react-router-dom";
import { GitCompare, X } from "lucide-react";
import API_URL from "../config";
import { getCompareIds, removeFromCompare } from "../utils/compareStore";

/**
 * Popup comparateur unique, partagée par toute l'application (montée une
 * seule fois dans App.jsx). Le comparateur n'est JAMAIS une page séparée :
 * il s'ouvre toujours en overlay, par-dessus la page courante, quel que
 * soit l'endroit d'où on le déclenche (carte, vue liste, détail annonce,
 * favoris…).
 */
export default function ComparateurPopup({ onClose }) {
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
    const newCount = removeFromCompare(id);
    setAnnonces(prev => prev.filter(a => String(a.id) !== String(id)));
    if (newCount === 0) onClose();
  }

  const ROWS = [
    { label:"Prix",        key:"prix" },
    { label:"Superficie",  key:"superficie" },
    { label:"Chambres",    key:"nb_chambres" },
    { label:"Salles de bain", key:"nb_salles_bain" },
    { label:"Pièces",      key:"nb_pieces" },
    { label:"Étage",       key:"etage" },
    { label:"État",        key:"etat" },
    { label:"Gouvernorat", key:"gouvernorat" },
    { label:"Délégation",  key:"delegation" },
  ];
  const val = (a, k) => {
    const v = a[k] ?? a.caractere_general?.[k] ?? a.caracteristique_interieure?.[k];
    if (v == null || v === "") return "—";
    if (k === "prix") return `${Number(v).toLocaleString("fr-TN")} ${a.devise || "TND"}`;
    if (k === "superficie") return `${v} m²`;
    return String(v);
  };

  return ReactDOM.createPortal(
    <div style={{position:"fixed",inset:0,background:"rgba(10,12,20,.65)",zIndex:99990,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0"}}
      onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:900,
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 -12px 50px rgba(0,0,0,.25)", overflow:"hidden",
      }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          <GitCompare size={18} color="#6366f1"/>
          <span style={{fontWeight:800,fontSize:16,color:"#0f172a",flex:1}}>Comparateur</span>
          <span style={{fontSize:13,color:"#64748b",fontWeight:500}}>{annonces.length} annonce{annonces.length!==1?"s":""}</span>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600,fontSize:13,color:"#475569"}}>
            <X size={14}/> Fermer
          </button>
        </div>

        {/* Corps */}
        <div style={{overflowY:"auto",flex:1,padding:"16px 20px 24px"}}>
          {loading ? (
            <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Chargement…</div>
          ) : annonces.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Aucune annonce à comparer.</div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:annonces.length*220}}>
                <thead>
                  <tr>
                    <th style={{textAlign:"left",padding:"10px 14px",borderBottom:"2px solid #f1f5f9",color:"#94a3b8",fontSize:12,fontWeight:700,width:110}}>Critère</th>
                    {annonces.map(a => (
                      <th key={a.id} style={{padding:"10px 14px",borderBottom:"2px solid #f1f5f9",minWidth:200,verticalAlign:"top"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:6}}>
                          <Link to={`/carte?annonce=${a.id}`} onClick={onClose}
                            style={{fontWeight:700,color:"#0f172a",fontSize:13,textDecoration:"none",lineHeight:1.3}}>
                            {a.titre||`Annonce #${a.id}`}
                          </Link>
                          <button onClick={()=>removeOne(a.id)} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:4,cursor:"pointer",color:"#dc2626",flexShrink:0}}>
                            <X size={12}/>
                          </button>
                        </div>
                        {(a.image_principale||a.image) && (
                          <img src={(a.image_principale||a.image).startsWith("http")?(a.image_principale||a.image):`${API_URL}${a.image_principale||a.image}`}
                            alt="" style={{width:"100%",height:100,objectFit:"cover",borderRadius:8}}/>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.key} style={{background: i%2===0?"#f8fafc":"#fff"}}>
                      <td style={{padding:"9px 14px",fontSize:12,fontWeight:700,color:"#64748b",whiteSpace:"nowrap"}}>{row.label}</td>
                      {annonces.map(a => {
                        const v = val(a, row.key);
                        return <td key={a.id} style={{padding:"9px 14px",fontSize:13,color: v==="—"?"#cbd5e1":"#0f172a",fontWeight: v==="—"?400:600,textAlign:"center"}}>{v}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
