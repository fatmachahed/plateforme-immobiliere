import { useState, useEffect } from "react";
import { Search, RefreshCw, Activity, Users, AlertTriangle, CheckCircle, XCircle, Monitor, Smartphone, Tablet } from "lucide-react";

const PAGE_SIZE = 100;

const MOTIFS = {
  mot_de_passe:   "Mot de passe incorrect",
  compte_inconnu: "Compte inexistant",
  non_verifie:    "Email non vérifié",
  ip_bloquee:     "IP bloquée (trop d'essais)",
};

const DEVICE_ICON = { Mobile: Smartphone, Tablette: Tablet, Ordinateur: Monitor };

// Code pays ISO (TN, FR…) → drapeau emoji
const flag = cc => (cc && /^[A-Z]{2}$/.test(cc))
  ? String.fromCodePoint(...[...cc].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
  : "";

const fmtDate = iso => iso
  ? new Date(iso).toLocaleString("fr-TN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" })
  : "—";

const inputStyle = { height:36, border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, fontFamily:"inherit", padding:"0 12px", background:"#fff", outline:"none" };
const td = { padding:"11px 14px", verticalAlign:"middle" };

export default function AdminConnexions({ authFetch }) {
  const [data,     setData]     = useState({ total:0, stats:null, items:[] });
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(0);
  const [q,        setQ]        = useState("");
  const [succes,   setSucces]   = useState("");
  const [methode,  setMethode]  = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  async function load(p = page) {
    setLoading(true);
    const params = new URLSearchParams({ skip: p * PAGE_SIZE, limit: PAGE_SIZE });
    if (q.trim())  params.set("q", q.trim());
    if (succes)    params.set("succes", succes);
    if (methode)   params.set("methode", methode);
    if (dateFrom)  params.set("date_from", dateFrom);
    if (dateTo)    params.set("date_to", dateTo);
    try {
      const res = await authFetch(`/admin/connexions?${params}`);
      if (res.ok) setData(await res.json());
    } catch { /* 401 déjà géré par authFetch */ }
    finally { setLoading(false); }
  }

  // Recharge à chaque changement de filtre (recherche texte : après 400 ms de pause)
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load(0); }, q ? 400 : 0);
    return () => clearTimeout(t);
  }, [q, succes, methode, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const goto = p => { setPage(p); load(p); };
  const s = data.stats;
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Journal des connexions</h2>
        <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>
          Chaque tentative de connexion (email ou Google), réussie ou non. Conservation : 12 mois.
        </p>
      </div>

      {s && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:18}}>
          {[
            { icon:<Activity size={18}/>,      label:"Connexions (24 h)",      val:s.connexions_24h,  color:"#2563eb" },
            { icon:<Users size={18}/>,         label:"Utilisateurs (24 h)",    val:s.utilisateurs_24h, color:"#16a34a" },
            { icon:<Users size={18}/>,         label:"Utilisateurs (7 jours)", val:s.utilisateurs_7j,  color:"#7c3aed" },
            { icon:<AlertTriangle size={18}/>, label:"Échecs (24 h)",          val:s.echecs_24h,      color:"#dc2626" },
          ].map(k => (
            <div key={k.label} style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <span style={{color:k.color}}>{k.icon}</span>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:"#0f172a"}}>{k.val}</div>
                <div style={{fontSize:12,color:"#64748b"}}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
        <div style={{position:"relative"}}>
          <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Email, utilisateur ou IP…"
            style={{...inputStyle,paddingLeft:32,minWidth:230}}/>
        </div>
        <select value={succes} onChange={e=>setSucces(e.target.value)} style={inputStyle}>
          <option value="">Tous les résultats</option>
          <option value="true">Réussies</option>
          <option value="false">Échouées</option>
        </select>
        <select value={methode} onChange={e=>setMethode(e.target.value)} style={inputStyle}>
          <option value="">Toutes méthodes</option>
          <option value="password">Email + mot de passe</option>
          <option value="google">Google</option>
        </select>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inputStyle} title="Du"/>
        <input type="date" value={dateTo}   onChange={e=>setDateTo(e.target.value)}   style={inputStyle} title="Au"/>
        <button onClick={()=>load()} style={{...inputStyle,cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:"#64748b"}}>
          <RefreshCw size={14}/>Actualiser
        </button>
      </div>

      {loading && data.items.length === 0
        ? <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>Chargement…</div>
        : data.items.length === 0
          ? <div style={{textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,border:"1.5px dashed #e2e8f0"}}>
              <Activity size={40} style={{color:"#d1d5db",marginBottom:12}}/>
              <p style={{fontWeight:700,color:"#374151",marginBottom:6,fontSize:15}}>Aucune connexion enregistrée</p>
              <p style={{fontSize:13,color:"#94a3b8"}}>Les connexions apparaîtront ici dès la mise en ligne de cette version.</p>
            </div>
          : <>
              <div style={{overflowX:"auto",opacity:loading?.6:1}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                      {["Date","Utilisateur","Résultat","Méthode","IP / Pays","Appareil"].map(h=>(
                        <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11.5,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map(e => {
                      const Dev = DEVICE_ICON[e.appareil] || Monitor;
                      return (
                        <tr key={e.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                          <td style={{...td,color:"#64748b",whiteSpace:"nowrap"}}>{fmtDate(e.date)}</td>
                          <td style={td}>
                            {e.username
                              ? <><div style={{fontWeight:700,color:"#0f172a"}}>@{e.username}{e.role && <span style={{marginLeft:6,fontSize:11,fontWeight:600,color:"#64748b"}}>{e.role}</span>}</div>
                                  <div style={{fontSize:11.5,color:"#64748b"}}>{e.nom ? `${e.nom} · ` : ""}{e.email}</div></>
                              : <div style={{color:"#94a3b8",fontStyle:"italic"}}>{e.email || "—"}</div>}
                          </td>
                          <td style={td}>
                            {e.succes
                              ? <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:999,fontSize:11.5,fontWeight:700,background:"#dcfce7",color:"#16a34a"}}><CheckCircle size={12}/>Réussie</span>
                              : <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:999,fontSize:11.5,fontWeight:700,background:"#fee2e2",color:"#dc2626"}} title={e.motif}><XCircle size={12}/>{MOTIFS[e.motif] || "Échec"}</span>}
                          </td>
                          <td style={{...td,color:"#374151"}}>{e.methode === "google" ? "Google" : "Email"}</td>
                          <td style={{...td,whiteSpace:"nowrap"}}>
                            <div style={{fontFamily:"ui-monospace,monospace",fontSize:12,color:"#0f172a"}}>{e.ip || "—"}</div>
                            {e.pays && <div style={{fontSize:11.5,color:"#64748b"}}>{flag(e.pays)} {e.pays}</div>}
                          </td>
                          <td style={td} title={e.user_agent}>
                            <div style={{display:"flex",alignItems:"center",gap:6,color:"#374151"}}><Dev size={14}/>{e.appareil}</div>
                            <div style={{fontSize:11.5,color:"#64748b"}}>{e.navigateur} · {e.os}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,fontSize:13,color:"#64748b"}}>
                <span>{data.total} connexion{data.total > 1 ? "s" : ""}</span>
                {pages > 1 && (
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <button disabled={page===0} onClick={()=>goto(page-1)} style={{...inputStyle,cursor:page===0?"default":"pointer"}}>‹ Précédent</button>
                    <span>Page {page+1} / {pages}</span>
                    <button disabled={page>=pages-1} onClick={()=>goto(page+1)} style={{...inputStyle,cursor:page>=pages-1?"default":"pointer"}}>Suivant ›</button>
                  </div>
                )}
              </div>
            </>
      }
    </div>
  );
}
