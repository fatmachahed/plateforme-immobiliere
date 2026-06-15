import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL from "../config";
import { AlertTriangle, Upload, X, Check, Send } from "lucide-react";

const TYPES_PROBLEME = [
  "Annonce frauduleuse ou trompeuse",
  "Annonce déjà vendue / louée",
  "Photos ne correspondant pas au bien",
  "Prix incorrect ou trompeur",
  "Coordonnées incorrectes",
  "Contenu inapproprié ou offensant",
  "Problème technique sur le site",
  "Compte piraté / usurpation d'identité",
  "Autre problème",
];

export default function SignalerProbleme() {
  const location = useLocation();
  const [type,       setType]       = useState("");
  const [lienAnnonce,setLienAnnonce]= useState("");
  const [description,setDescription]= useState("");
  const [nom,        setNom]        = useState("");
  const [email,      setEmail]      = useState("");
  const [image,      setImage]      = useState(null);   // base64
  const [imagePreview,setImagePreview]= useState(null);
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const s = location.state;
    if (!s) return;
    if (s.lienAnnonce) setLienAnnonce(s.lienAnnonce);
    if (s.type)        setType(s.type);
    if (s.nom)         setNom(s.nom);
    if (s.email)       setEmail(s.email);
    if (s.reference)   setDescription(`Référence annonce : ${s.reference}\n\n`);
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Image trop grande (max 10 Mo)."); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const original = ev.target.result;
      // Compression via canvas (max 1000px, JPEG 80%)
      const img = new Image();
      img.onload = () => {
        const MAX = 1000;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.8);
        setImage(compressed);
        setImagePreview(compressed);
      };
      img.onerror = () => { setImage(original); setImagePreview(original); };
      img.src = original;
    };
    reader.onerror = () => setError("Impossible de lire l'image. Réessayez.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!type) { setError("Veuillez sélectionner un type de problème."); return; }
    if (!description.trim()) { setError("Veuillez décrire le problème."); return; }
    setLoading(true);
    try {
      const body = { nom: nom || "Anonyme", email: email || null, sujet: `[Signalement] ${type}`, message: `${description}\n\nLien : ${lienAnnonce || "—"}`, image: image || null };
      const res = await fetch(`${API_URL}/contact`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(body),
      });
      if (res.ok) setDone(true);
      else setError("Une erreur s'est produite. Réessayez.");
    } catch { setError("Serveur inaccessible."); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc", fontFamily:"'Poppins',system-ui,sans-serif"}}>
      <Navbar/>

      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"52px 24px 48px", textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:56,height:56,borderRadius:"50%",background:"rgba(239,68,68,.2)",marginBottom:18,border:"1.5px solid rgba(239,68,68,.4)"}}>
          <AlertTriangle size={26} color="#fca5a5"/>
        </div>
        <h1 style={{fontSize:"clamp(22px,3vw,30px)", fontWeight:800, color:"#fff", margin:"0 0 10px"}}>
          Signaler un problème
        </h1>
        <p style={{fontSize:14.5, color:"rgba(255,255,255,.6)", maxWidth:500, margin:"0 auto"}}>
          Aidez-nous à maintenir la qualité de la plateforme en signalant tout contenu problématique.
        </p>
      </div>

      <div style={{maxWidth:640, margin:"0 auto", padding:"40px 20px 80px"}}>
        {done ? (
          <div style={{background:"#fff",borderRadius:16,border:"1px solid #bbf7d0",padding:"48px 32px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <Check size={28} color="#16a34a"/>
            </div>
            <h2 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:"0 0 10px"}}>Signalement envoyé !</h2>
            <p style={{color:"#64748b",fontSize:14,lineHeight:1.7,margin:0}}>
              Merci pour votre signalement. Notre équipe va l'examiner et prendre les mesures nécessaires dans les 24–48 heures.
            </p>
          </div>
        ) : (
          <div style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",padding:"32px",boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
            {error && (
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"11px 14px",fontSize:13,color:"#b91c1c",marginBottom:20,fontWeight:500}}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:18}}>

              {/* Type de problème */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:700,color:"#374151",marginBottom:7}}>
                  Type de problème <span style={{color:"#ef4444"}}>*</span>
                </label>
                <select value={type} onChange={e=>setType(e.target.value)} required
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${type?"#6366f1":"#e2e8f0"}`,fontFamily:"inherit",fontSize:14,outline:"none",background:"#f8fafc",color:type?"#0f172a":"#94a3b8",boxSizing:"border-box"}}>
                  <option value="">— Sélectionner le type de problème —</option>
                  {TYPES_PROBLEME.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Lien annonce (optionnel) */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:700,color:"#374151",marginBottom:7}}>
                  Lien de l'annonce concernée <span style={{color:"#94a3b8",fontWeight:400}}>(optionnel)</span>
                </label>
                <input type="url" value={lienAnnonce} onChange={e=>setLienAnnonce(e.target.value)}
                  placeholder="https://localizi.tn/annonce/123"
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:14,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
              </div>

              {/* Description */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:700,color:"#374151",marginBottom:7}}>
                  Description du problème <span style={{color:"#ef4444"}}>*</span>
                </label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} required rows={5}
                  placeholder="Décrivez le problème avec le plus de détails possible…"
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:14,outline:"none",background:"#f8fafc",resize:"vertical",boxSizing:"border-box",lineHeight:1.6}}/>
              </div>

              {/* Image */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:700,color:"#374151",marginBottom:7}}>
                  Capture d'écran / Photo <span style={{color:"#94a3b8",fontWeight:400}}>(optionnel, max 5 Mo)</span>
                </label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{display:"none"}}/>
                {imagePreview ? (
                  <div style={{position:"relative",display:"inline-block",maxWidth:"100%"}}>
                    <img src={imagePreview} alt="Preview" style={{maxWidth:"100%",maxHeight:220,borderRadius:10,border:"1.5px solid #e2e8f0",objectFit:"contain"}}/>
                    <button type="button" onClick={()=>{setImage(null);setImagePreview(null);if(fileRef.current)fileRef.current.value="";}}
                      style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                      <X size={13}/>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={()=>fileRef.current?.click()}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"13px 20px",borderRadius:10,border:"1.5px dashed #d1d5db",background:"#f8fafc",cursor:"pointer",fontFamily:"inherit",fontSize:13.5,color:"#64748b",width:"100%",justifyContent:"center",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#6366f1";e.currentTarget.style.background="#eef2ff";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#f8fafc";}}>
                    <Upload size={18} color="#94a3b8"/>
                    Ajouter une capture d'écran
                  </button>
                )}
              </div>

              {/* Infos contact (optionnel) */}
              <div style={{borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                <p style={{fontSize:12.5,color:"#94a3b8",margin:"0 0 14px",fontWeight:500}}>Vos coordonnées (optionnel — pour que nous puissions vous répondre)</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <input type="text" value={nom} onChange={e=>setNom(e.target.value)} placeholder="Votre nom"
                    style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13.5,outline:"none",background:"#f8fafc"}}/>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Votre email"
                    style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:13.5,outline:"none",background:"#f8fafc"}}/>
                </div>
              </div>

              <button type="submit" disabled={loading||!type||!description.trim()}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px",borderRadius:11,border:"none",background:"#ef4444",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:(loading||!type||!description.trim())?0.5:1,transition:"opacity .15s"}}>
                <Send size={16}/>
                {loading ? "Envoi…" : "Envoyer le signalement"}
              </button>
            </form>
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}
