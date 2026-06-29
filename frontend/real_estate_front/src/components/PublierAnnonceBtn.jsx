import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import Logo from "./Logo";

export default function PublierAnnonceBtn({ children, className, style, as: Tag = "button", ...rest }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleClick(e) {
    e.preventDefault();
    setOpen(true);
  }

  return (
    <>
      <Tag {...rest} className={className} style={style} onClick={handleClick} href="#" to="#">
        {children}
      </Tag>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:9999,
            background:"rgba(0,0,0,.45)", backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"16px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:16, padding:"18px 16px",
              maxWidth:400, width:"100%",
              boxShadow:"0 24px 64px rgba(0,0,0,.18)",
              position:"relative",
            }}
          >
            {/* Header : logo centré, titre dessous, croix absolue */}
            <div style={{textAlign:"center", marginBottom:12, position:"relative"}}>
              <div style={{display:"flex", justifyContent:"center", marginBottom:5}}>
                <Logo variant="color" height={20} to={null}/>
              </div>
              <div style={{fontSize:13, fontWeight:800, color:"#0f172a"}}>Publier une annonce</div>
              <div style={{fontSize:10.5, color:"#94a3b8", marginTop:2}}>Informations importantes</div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  position:"absolute", top:0, right:0,
                  background:"#f1f5f9", border:"none", cursor:"pointer", borderRadius:8,
                  width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#64748b",
                }}
              >
                <X size={13} strokeWidth={2.5}/>
              </button>
            </div>

            {/* Icône */}
            <div style={{display:"flex", justifyContent:"center", marginBottom:10}}>
              <div style={{
                width:42, height:42, borderRadius:"50%", background:"#f1f5f9",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <AlertTriangle size={21} color="#475569" strokeWidth={1.8}/>
              </div>
            </div>

            <h2 style={{fontSize:15, fontWeight:900, color:"#0f172a", margin:"0 0 8px", textAlign:"center", lineHeight:1.2}}>
              Avant de publier
            </h2>

            <p style={{fontSize:11.5, color:"#374151", lineHeight:1.6, margin:"0 0 16px", textAlign:"center"}}>
              En publiant votre annonce sur Localizi.tn, la carte affichera la{" "}
              <strong>position exacte</strong> du bien immobilier. Assurez-vous d'être le
              propriétaire ou le mandataire exclusif du bien. Vous pouvez déplacer la position
              sur la carte si nécessaire.
            </p>

            {/* Boutons côte à côte */}
            <div style={{display:"flex", gap:8}}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex:1, padding:"10px 8px", borderRadius:10,
                  border:"1.5px solid #e2e8f0", background:"#fff",
                  fontSize:13, fontWeight:600, color:"#374151",
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/creer_annonce"); }}
                style={{
                  flex:1, padding:"10px 8px", borderRadius:10,
                  border:"none", background:"#0f172a", color:"#fff",
                  fontSize:13, fontWeight:700, cursor:"pointer",
                  fontFamily:"inherit",
                }}
              >
                Je publie
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
