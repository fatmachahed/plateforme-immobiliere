import { useState, useEffect } from "react";
import API_URL from '../config';
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Home, Building2, ShoppingCart, Tag, Key, DoorOpen, ChevronRight, ChevronLeft, X, Menu } from "lucide-react";
import { useToast } from "../components/Toast";
import Logo from "../components/Logo";
import Navbar from "../components/Navbar";
import { useGoogleLogin } from "@react-oauth/google";
import heroImg from "../assets/hero-localizi.png";

/* Indicatifs téléphoniques — identique à la liste utilisée dans le profil (Compte.jsx) */
const PHONE_CODES = [
  {code:"+216",flag:"🇹🇳",name:"Tunisie"},
  {code:"+33", flag:"🇫🇷",name:"France"},
  {code:"+1",  flag:"🇺🇸",name:"USA/Canada"},
  {code:"+44", flag:"🇬🇧",name:"Royaume-Uni"},
  {code:"+49", flag:"🇩🇪",name:"Allemagne"},
  {code:"+32", flag:"🇧🇪",name:"Belgique"},
  {code:"+41", flag:"🇨🇭",name:"Suisse"},
  {code:"+212",flag:"🇲🇦",name:"Maroc"},
  {code:"+213",flag:"🇩🇿",name:"Algérie"},
  {code:"+218",flag:"🇱🇾",name:"Libye"},
  {code:"+966",flag:"🇸🇦",name:"Arabie Saoudite"},
  {code:"+971",flag:"🇦🇪",name:"Émirats Arabes Unis"},
  {code:"+974",flag:"🇶🇦",name:"Qatar"},
  {code:"+90", flag:"🇹🇷",name:"Turquie"},
  {code:"+34", flag:"🇪🇸",name:"Espagne"},
  {code:"+39", flag:"🇮🇹",name:"Italie"},
];

/* Nombre de chiffres attendu (hors indicatif) pour les numéros mobiles des
   pays les plus courants ici. Pour un code non listé, on retombe sur une
   fourchette générique (7 à 12 chiffres) plutôt que de bloquer à tort. */
const PHONE_LENGTHS = {
  "+216": 8,  // Tunisie
  "+33":  9,  // France
  "+1":   10, // USA/Canada
  "+44":  10, // Royaume-Uni
  "+32":  9,  // Belgique
  "+41":  9,  // Suisse
  "+212": 9,  // Maroc
  "+213": 9,  // Algérie
  "+974": 8,  // Qatar
  "+90":  10, // Turquie
  "+34":  9,  // Espagne
};
const isPhoneNumberValid = (code, number) => {
  const expected = PHONE_LENGTHS[code];
  return expected ? number.length === expected : (number.length >= 7 && number.length <= 12);
};
const phoneLengthHint = (code) => {
  const expected = PHONE_LENGTHS[code];
  return expected ? `Le numéro doit contenir ${expected} chiffres.` : "Numéro de téléphone invalide.";
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [username,          setUsername]          = useState("");
  const [email,             setEmail]             = useState("");
  const [phoneCode,         setPhoneCode]         = useState("+216");
  const [phoneNumber,       setPhoneNumber]       = useState("");
  const [password,          setPassword]          = useState("");
  const [confirmPassword,   setConfirmPassword]   = useState("");
  const [role,              setRole]              = useState("particulier");
  const [sousRole,          setSousRole]          = useState("");
  const [secteurPartenaire, setSecteurPartenaire] = useState("");
  const [metierArtisan,     setMetierArtisan]     = useState("");
  const [particulierIntent, setParticulierIntent] = useState("achete");
  const [particulierProfil, setParticulierProfil] = useState("");
  const [showGooglePopup,   setShowGooglePopup]   = useState(false);
  const [sexe,              setSexe]              = useState("");
  const [showPwd,           setShowPwd]           = useState(false);
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [error,             setError]             = useState("");
  const [emailError,        setEmailError]        = useState("");
  const [phoneError,        setPhoneError]        = useState("");
  const [usernameStatus,    setUsernameStatus]    = useState(null); // null | "checking" | "available" | "taken"
  const [loading,           setLoading]           = useState(false);
  const [acceptCGU,         setAcceptCGU]         = useState(false);
  const [resendLoading,     setResendLoading]     = useState(false);
  const [resendDone,        setResendDone]        = useState(false);
  const toast = useToast();
  const [searchParams] = useSearchParams();

  /* Pré-remplissage selon URL params (?type=promoteur | agence | partenaire | professionnel) */
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "promoteur")    { setRole("professionnel"); setSousRole("promoteur"); }
    else if (type === "agence")  { setRole("professionnel"); setSousRole("agence"); }
    else if (type === "partenaire") { setRole("professionnel"); setSousRole("partenaire"); }
    else if (type === "professionnel") { setRole("professionnel"); }
  }, []);

  const handleResend = async () => {
    setResendLoading(true); setResendDone(false);
    try {
      const res = await fetch(`${API_URL}/users/resend-verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { setResendDone(true); toast("Email renvoyé !"); }
      else { const e = await res.json().catch(()=>({})); toast(e.detail || "Erreur lors de l'envoi."); }
    } catch { toast("Serveur inaccessible."); }
    finally { setResendLoading(false); }
  };

  const handleGoogleSuccess = async (accessToken) => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); setError(err.detail||"Erreur Google."); return; }
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toast("Compte créé et connecté via Google ! Bienvenue.");
      window.location.href = data.is_new ? "/compte?welcome=1" : "/";
    } catch { setError("Serveur inaccessible."); } finally { setLoading(false); }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (resp) => handleGoogleSuccess(resp.access_token),
    onError: () => setError("Connexion Google annulée ou échouée."),
  });

  const handleNext = (e) => {
    e.preventDefault(); setError("");
    if (!username.trim()) { setError("Nom d'utilisateur requis."); return; }
    if (username.trim().length < 4) { setUsernameStatus("too-short"); return; }
    if (usernameStatus === "taken") { setError("Ce nom d'utilisateur est déjà pris."); return; }
    if (!email.trim()) { setEmailError("Adresse e-mail requise."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError("Adresse e-mail invalide — exemple : nom@domaine.com"); return; }
    setEmailError("");
    if (!phoneNumber.trim()) { setPhoneError("Numéro de téléphone (WhatsApp) requis."); return; }
    if (!isPhoneNumberValid(phoneCode, phoneNumber)) { setPhoneError(phoneLengthHint(phoneCode)); return; }
    setPhoneError("");
    if (role === "professionnel" && !sousRole) { setError("Veuillez sélectionner votre type de professionnel."); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!acceptCGU) { setError("Veuillez accepter les CGU et la politique de confidentialité."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          username, email, password,
          phone_number: `${phoneCode} ${phoneNumber.trim()}`,
          role: role==="professionnel" ? sousRole : role,
          secteur_partenaire: sousRole==="partenaire" ? secteurPartenaire : null,
          metier_artisan: (sousRole==="partenaire" && secteurPartenaire==="artisans") ? metierArtisan || null : null,
          objectif: role==="particulier" ? particulierIntent : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        const detail = err.detail;
        setError(Array.isArray(detail) ? detail.map(d=>d.msg).join(" ") : (detail||"Erreur lors de l'inscription."));
        return;
      }
      // Compte créé → onboarding pour les pros, sinon écran "vérifiez votre email"
      const finalRole = role === "professionnel" ? sousRole : role;
      if (finalRole === "agence") {
        window.location.href = "/espace-agence/onboarding";
      } else if (finalRole === "promoteur") {
        window.location.href = "/espace-promoteur/onboarding";
      } else {
        localStorage.setItem("first_login", "1");
        setStep("email-sent");
      }
    } catch { setError("Serveur inaccessible."); } finally { setLoading(false); }
  };

  return (
    <div className="sp-page">
      {/* Popup info Google : particuliers uniquement */}
      {showGooglePopup && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 16px"}}
             onClick={()=>setShowGooglePopup(false)}>
          <div style={{background:"#fff",borderRadius:16,padding:"28px 24px",maxWidth:400,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,.18)"}}
               onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>ℹ️</div>
            <h3 style={{margin:"0 0 10px",fontSize:17,fontWeight:700,color:"#0f172a",textAlign:"center"}}>
              Inscription Google — Particuliers uniquement
            </h3>
            <p style={{margin:"0 0 20px",fontSize:13.5,color:"#475569",textAlign:"center",lineHeight:1.6}}>
              L'inscription via Google est réservée aux <strong>particuliers</strong>.<br/>
              Si vous êtes un professionnel (agent, agence, promoteur, partenaire), veuillez utiliser le <strong>formulaire d'inscription classique</strong> pour renseigner votre rôle et secteur d'activité.
            </p>
            <div style={{display:"flex",gap:10,flexDirection:"column"}}>
              <button type="button"
                onClick={()=>{ setShowGooglePopup(false); loginWithGoogle(); }}
                style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                Je suis particulier — Continuer avec Google
              </button>
              <button type="button"
                onClick={()=>setShowGooglePopup(false)}
                style={{width:"100%",padding:"11px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#475569",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                Utiliser le formulaire
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Barre mobile : logo + hamburger — visible sur mobile uniquement */}
      <div className="sp-logo-mobile">
        <Link to="/"><Logo height={28} /></Link>
        <button className="sp-mob-burger" onClick={() => window.dispatchEvent(new CustomEvent('localizi:openMobileMenu'))}>
          <Menu size={22}/>
        </button>
      </div>

      {/* Navbar cachée — sert uniquement à rendre le drawer mobile */}
      <div className="sp-hidden-nav"><Navbar /></div>

      <div className="sp-panels">
      {/* Left */}
      <div className="sp-left">
        <img src={heroImg} alt="" className="sp-left__bg" />
        <div className="sp-left__overlay" />
        <div className="sp-left__content">
          <div className="sp-left__logo"><Logo variant="white" height={46} to="/" /></div>
          <h2 className="sp-left__tagline">Rejoignez des milliers<br/>d'utilisateurs Localizi.tn.</h2>
          <p className="sp-left__sub">Publiez, cherchez et trouvez le bien idéal en Tunisie. Inscription gratuite.</p>
          <div className="sp-left__pills">
            <span className="sp-left__pill"><span className="sp-left__pill-dot"/>Gratuit</span>
            <span className="sp-left__pill"><span className="sp-left__pill-dot"/>Rapide</span>
            <span className="sp-left__pill"><span className="sp-left__pill-dot"/>Sécurisé</span>
          </div>
        </div>
        <div className="sp-left__accent"/>
      </div>

      {/* Center divider icon */}
      <div className="sp-center-icon">
        <UserPlus size={26} color="#6366f1" />
      </div>

      {/* Right */}
      <div className="sp-right">
        <div className="sp-form-wrap">

          {/* ─── Écran email envoyé ─── */}
          {step==="email-sent" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:64,marginBottom:16}}>📧</div>
              <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a",margin:"0 0 12px"}}>Vérifiez votre email</h2>
              <p style={{fontSize:14,color:"#64748b",lineHeight:1.7,marginBottom:28}}>
                Un email de confirmation a été envoyé à <strong>{email}</strong>.<br/>
                Cliquez sur le lien dans l'email pour activer votre compte.
              </p>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"14px 18px",fontSize:13,color:"#166534",marginBottom:24,textAlign:"left"}}>
                ✓ Vérifiez aussi votre dossier <strong>spam</strong> si vous ne voyez pas l'email.
              </div>
              <Link to="/login" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:"#6366f1",color:"#fff",padding:"12px 24px",borderRadius:11,fontWeight:700,fontSize:14,textDecoration:"none",width:"100%",boxSizing:"border-box",marginBottom:12}}>
                Aller à la connexion →
              </Link>
              <button
                onClick={handleResend}
                disabled={resendLoading || resendDone}
                style={{width:"100%",padding:"11px",borderRadius:11,border:"1.5px solid #e2e8f0",background: resendDone?"#f0fdf4":"#f8fafc",color:resendDone?"#16a34a":"#64748b",fontWeight:600,fontSize:13.5,cursor:resendLoading||resendDone?"default":"pointer",fontFamily:"inherit",transition:"all .2s"}}
              >
                {resendLoading ? "Envoi en cours…" : resendDone ? "✓ Email renvoyé !" : "Je n'ai rien reçu — Renvoyer l'email"}
              </button>
            </div>
          )}

          {/* Breadcrumb */}
          {step!=="email-sent" && (
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20,fontSize:12.5,color:"#94a3b8"}}>
              <Link to="/" style={{display:"flex",alignItems:"center",gap:4,color:"#6366f1",textDecoration:"none",fontWeight:600}}>
                <Home size={13}/> Accueil
              </Link>
              <span>›</span>
              <span style={{color:"#374151",fontWeight:600}}>Inscription</span>
            </div>
          )}

          {/* Progress stepper + formulaires (masqués quand email envoyé) */}
          {step!=="email-sent" && <>
          <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:28}}>
            {[1,2].map((s,i)=>(
              <div key={s} style={{display:"flex",alignItems:"center",flex:i<1?1:undefined}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,border:"2px solid",borderColor:step>=s?"#6366f1":"#e2e8f0",background:step>=s?"#6366f1":"#fff",color:step>=s?"#fff":"#94a3b8",transition:"all .2s"}}>
                    {step>s ? "✓" : s}
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:step>=s?"#4f46e5":"#94a3b8",whiteSpace:"nowrap"}}>
                    {s===1?"Vos infos":"Mot de passe"}
                  </span>
                </div>
                {i<1&&<div style={{height:2,flex:1,background:step>1?"#6366f1":"#e2e8f0",margin:"0 8px",marginBottom:18,transition:"background .3s"}}/>}
              </div>
            ))}
          </div>

          <h1 className="sp-title">{step===1?"Créer un compte":"Sécurisez votre compte"}</h1>
          <p className="sp-sub">{step===1?"Rejoignez Localizi.tn et trouvez votre bien idéal.":"Choisissez un mot de passe sécurisé."}</p>

          {error && <div className="sp-notice sp-notice--err">{error}</div>}

          {/* ─── ÉTAPE 1 ─── */}
          {step===1 && (
            <form onSubmit={handleNext} className="sp-form">
              {/* Google en haut */}
              <button type="button" onClick={()=>setShowGooglePopup(true)} disabled={loading} className="sp-google-btn">
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                S'inscrire avec Google
              </button>

              <div className="sp-divider"><span>ou remplir le formulaire</span></div>

              <div className="sp-field">
                <label className="sp-label">Nom d'utilisateur <span style={{color:"#ef4444"}}>*</span></label>
                <input
                  type="text"
                  className="sp-input"
                  placeholder="votre_nom"
                  value={username}
                  onChange={e=>{ setUsername(e.target.value); setUsernameStatus(null); }}
                  onBlur={async e=>{ const v=e.target.value.trim(); if(!v) return; if(v.length<4){setUsernameStatus("too-short");return;} setUsernameStatus("checking"); try{ const r=await fetch(`${API_URL}/users/check-username?username=${encodeURIComponent(v)}`); const d=await r.json(); setUsernameStatus(d.available?"available":"taken"); }catch{ setUsernameStatus(null); } }}
                  disabled={loading}
                  autoComplete="username"
                  style={usernameStatus==="taken"||usernameStatus==="too-short"?{borderColor:"#ef4444",boxShadow:"0 0 0 3px rgba(239,68,68,.15)"}:usernameStatus==="available"?{borderColor:"#10b981",boxShadow:"0 0 0 3px rgba(16,185,129,.15)"}:{}}
                />
                {usernameStatus==="checking" && (
                  <div style={{marginTop:6,fontSize:12.5,color:"#94a3b8",fontWeight:500}}>Vérification…</div>
                )}
                {usernameStatus==="too-short" && (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:12.5,color:"#ef4444",fontWeight:500}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Le nom d'utilisateur doit contenir au moins 4 caractères
                  </div>
                )}
                {usernameStatus==="available" && (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:12.5,color:"#10b981",fontWeight:600}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Nom d'utilisateur disponible
                  </div>
                )}
                {usernameStatus==="taken" && (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:12.5,color:"#ef4444",fontWeight:500}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Ce nom d'utilisateur est déjà pris
                  </div>
                )}
              </div>
              <div className="sp-field">
                <label className="sp-label">Adresse e-mail <span style={{color:"#ef4444"}}>*</span></label>
                <input
                  type="text"
                  className="sp-input"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e=>{ setEmail(e.target.value); if(emailError) setEmailError(""); }}
                  onBlur={e=>{ const v=e.target.value.trim(); if(v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) setEmailError("Adresse e-mail invalide — exemple : nom@domaine.com"); }}
                  disabled={loading}
                  autoComplete="email"
                  style={emailError ? {borderColor:"#ef4444",boxShadow:"0 0 0 3px rgba(239,68,68,.15)"} : {}}
                />
                {emailError && (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:12.5,color:"#ef4444",fontWeight:500}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {emailError}
                  </div>
                )}
              </div>

              <div className="sp-field">
                <label className="sp-label">Numéro de téléphone (WhatsApp) <span style={{color:"#ef4444"}}>*</span></label>
                <div style={{display:"flex",gap:8}}>
                  <select
                    value={phoneCode}
                    onChange={e=>{ setPhoneCode(e.target.value); if(phoneError) setPhoneError(""); }}
                    disabled={loading}
                    className="sp-input"
                    style={{width:92,flexShrink:0,cursor:"pointer",paddingLeft:10,paddingRight:6}}
                  >
                    {PHONE_CODES.map(({code,flag})=><option key={code} value={code}>{flag} {code}</option>)}
                  </select>
                  <input
                    type="tel"
                    className="sp-input"
                    placeholder="22 345 678"
                    value={phoneNumber}
                    onChange={e=>{ setPhoneNumber(e.target.value.replace(/\D/g,"")); if(phoneError) setPhoneError(""); }}
                    onBlur={e=>{ const v=e.target.value.trim(); if(v && !isPhoneNumberValid(phoneCode,v)) setPhoneError(phoneLengthHint(phoneCode)); }}
                    disabled={loading}
                    autoComplete="tel"
                    inputMode="numeric"
                    style={{
                      flex:1, minWidth:0,
                      ...(phoneError
                        ? {borderColor:"#ef4444",boxShadow:"0 0 0 3px rgba(239,68,68,.15)"}
                        : isPhoneNumberValid(phoneCode,phoneNumber) ? {borderColor:"#10b981",boxShadow:"0 0 0 3px rgba(16,185,129,.15)"} : {}),
                    }}
                  />
                </div>
                {phoneError ? (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:12.5,color:"#ef4444",fontWeight:500}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {phoneError}
                  </div>
                ) : isPhoneNumberValid(phoneCode,phoneNumber) && (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:12.5,color:"#10b981",fontWeight:600}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Numéro valide
                  </div>
                )}
              </div>

              {/* Rôle */}
              <div className="sp-field">
                <label className="sp-label">Vous êtes</label>
                <div className="sp-role-group">
                  {[{v:"particulier",icon:<Home size={22}/>,label:"Particulier",desc:"Achat, vente ou location"},
                    {v:"professionnel",icon:<Building2 size={22}/>,label:"Professionnel",desc:"Agence, promoteur, agent"}
                  ].map(({v,icon,label,desc})=>(
                    <button key={v} type="button" className={`sp-role-btn${role===v?" sp-role-btn--active":""}`} onClick={()=>setRole(v)} disabled={loading}>
                      <span className="sp-role-icon">{icon}</span>
                      <span className="sp-role-label">{label}</span>
                      <span className="sp-role-desc">{desc}</span>
                    </button>
                  ))}
                </div>

                {role==="particulier"&&(
                  <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:12}}>
                    <div>
                      <label className="sp-label" style={{marginBottom:6,display:"block"}}>Mon objectif principal</label>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[{key:"achete",label:"J'achète",Ico:ShoppingCart},{key:"vend",label:"Je vends",Ico:Tag},{key:"loue",label:"Je loue",Ico:Key},{key:"met_location",label:"Je mets en location",Ico:DoorOpen}].map(({key,label,Ico})=>(
                          <button key={key} type="button" onClick={()=>setParticulierIntent(key)} disabled={loading}
                            style={{padding:"11px 8px",borderRadius:10,border:"1.5px solid",borderColor:particulierIntent===key?"#6366f1":"#e2e8f0",background:particulierIntent===key?"#eef2ff":"#f8fafc",color:particulierIntent===key?"#4f46e5":"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12.5,display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all .15s",lineHeight:1.3}}>
                            <Ico size={18} style={{color:"inherit"}}/>{label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {role==="professionnel"&&(
                  <div style={{marginTop:10}}>
                    <label className="sp-label" style={{marginBottom:6,display:"block"}}>Type de professionnel <span style={{color:"#ef4444"}}>*</span></label>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[{value:"agent",label:"Agent",sub:"1 personne"},{value:"agence",label:"Agence",sub:"2+ personnes"},{value:"promoteur",label:"Promoteur",sub:null},{value:"partenaire",label:"Partenaire / Prestataire",sub:null}].map(({value,label,sub})=>(
                        <button key={value} type="button" onClick={()=>setSousRole(value)} disabled={loading}
                          style={{padding:"10px 8px",borderRadius:10,border:"1.5px solid",borderColor:sousRole===value?"#6366f1":"#e2e8f0",background:sousRole===value?"#eef2ff":"#f8fafc",color:sousRole===value?"#4f46e5":"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          <span>{label}</span>{sub&&<span style={{fontSize:10,fontWeight:500,opacity:.7}}>{sub}</span>}
                        </button>
                      ))}
                    </div>
                    {sousRole==="partenaire"&&(
                      <div style={{marginTop:12}}>
                        <label className="sp-label" style={{marginBottom:6,display:"block"}}>Secteur d'activité <span style={{color:"#ef4444"}}>*</span></label>
                        <select value={secteurPartenaire} onChange={e=>{setSecteurPartenaire(e.target.value);setMetierArtisan("");}} disabled={loading} style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${secteurPartenaire?"#6366f1":"#e2e8f0"}`,fontFamily:"inherit",fontSize:14,outline:"none",background:"#f8fafc",color:"#0f172a",boxSizing:"border-box"}}>
                          <option value="">— Sélectionnez votre secteur —</option>
                          <option value="banques">Banques</option>
                          <option value="assurances">Assurances</option>
                          <option value="notaires_avocats">Notaires / Avocats</option>
                          <option value="architectes">Architectes</option>
                          <option value="artisans">Artisans / Professionnels du bâtiment</option>
                        </select>
                        {secteurPartenaire==="artisans"&&(
                          <div style={{marginTop:10}}>
                            <label className="sp-label" style={{marginBottom:6,display:"block"}}>Métier <span style={{color:"#ef4444"}}>*</span></label>
                            <select value={metierArtisan} onChange={e=>setMetierArtisan(e.target.value)} disabled={loading} style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${metierArtisan?"#6366f1":"#e2e8f0"}`,fontFamily:"inherit",fontSize:14,outline:"none",background:"#f8fafc",color:"#0f172a",boxSizing:"border-box"}}>
                              <option value="">— Sélectionnez votre métier —</option>
                              <option value="Architecte d'intérieur">Architecte d'intérieur</option>
                              <option value="Carreleur / Poseur">Carreleur / Poseur</option>
                              <option value="Charpentier">Charpentier</option>
                              <option value="Chapiste / Cuveleur (chape, cuvelage)">Chapiste / Cuveleur (chape, cuvelage)</option>
                              <option value="Climaticien / Chauffagiste">Climaticien / Chauffagiste</option>
                              <option value="Conseiller immobilier">Conseiller immobilier</option>
                              <option value="Couvreur">Couvreur</option>
                              <option value="Cuisiniste">Cuisiniste</option>
                              <option value="Décorateur">Décorateur</option>
                              <option value="Déménageur">Déménageur</option>
                              <option value="Électricien">Électricien</option>
                              <option value="Entrepreneur">Entrepreneur</option>
                              <option value="Entreprise VRD (Voieries, réseaux et aménagements extérieurs)">Entreprise VRD (Voieries, réseaux et aménagements extérieurs)</option>
                              <option value="Etancheur (étanchéité)">Etancheur (étanchéité)</option>
                              <option value="Expert immobilier">Expert immobilier</option>
                              <option value="Géomètre / Topographe">Géomètre / Topographe</option>
                              <option value="Ingénieur électricité">Ingénieur électricité</option>
                              <option value="Ingénieur fluides">Ingénieur fluides</option>
                              <option value="Ingénieur génie civil">Ingénieur génie civil</option>
                              <option value="Ingénieur sécurité incendie">Ingénieur sécurité incendie</option>
                              <option value="Jardinier / Paysagiste">Jardinier / Paysagiste</option>
                              <option value="Lustreur">Lustreur</option>
                              <option value="Maçon">Maçon</option>
                              <option value="Menuisier aluminium">Menuisier aluminium</option>
                              <option value="Menuisier bois">Menuisier bois</option>
                              <option value="Peintre en bâtiment">Peintre en bâtiment</option>
                              <option value="Photographe immobilier">Photographe immobilier</option>
                              <option value="Pisciniste">Pisciniste</option>
                              <option value="Plâtrier">Plâtrier</option>
                              <option value="Plombier">Plombier</option>
                              <option value="Serrurier / Métallier">Serrurier / Métallier</option>
                              <option value="Autre">Autre</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" className="sp-btn" disabled={loading||!username||!email||!phoneNumber}>
                Suivant <ChevronRight size={16} style={{display:"inline",verticalAlign:"middle"}}/>
              </button>

              <p className="sp-switch">Déjà un compte ?{" "}<Link to="/login" className="sp-link">Se connecter</Link></p>
            </form>
          )}

          {/* ─── ÉTAPE 2 ─── */}
          {step===2 && (
            <form onSubmit={handleSubmit} className="sp-form">
              <div className="sp-field">
                <label className="sp-label">Mot de passe <span style={{color:"#ef4444"}}>*</span></label>
                <div className="sp-pw-wrap">
                  <input type={showPwd?"text":"password"} className="sp-input" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required disabled={loading} autoComplete="new-password"/>
                  <button type="button" className="sp-eye" onClick={()=>setShowPwd(v=>!v)} tabIndex={-1}>{showPwd?<Eye size={17}/>:<EyeOff size={17}/>}</button>
                </div>
                {password.length>0&&(()=>{
                  const checks=[
                    {label:"Au moins 8 caractères",ok:password.length>=8},
                    {label:"Au moins un chiffre",ok:/\d/.test(password)},
                    {label:"Au moins une majuscule",ok:/[A-Z]/.test(password)},
                    {label:"Au moins une minuscule",ok:/[a-z]/.test(password)},
                    {label:"Au moins un caractère spécial",ok:/[^a-zA-Z0-9]/.test(password)},
                  ];
                  const score=checks.filter(c=>c.ok).length;
                  const strength=score<=1?"Faible":score<=2?"Moyen":score<=3?"Assez fort":score<=4?"Fort":"Très fort";
                  const strengthColor=score<=1?"#ef4444":score<=2?"#f59e0b":score<=3?"#3b82f6":score<=4?"#16a34a":"#15803d";
                  return(
                    <div style={{marginTop:10,padding:"12px 14px 10px",background:"transparent",borderRadius:0,border:"none"}}>
                      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
                        {checks.map(c=>(
                          <div key={c.label} style={{display:"flex",alignItems:"center",gap:7,fontSize:12.5,fontWeight:500,color:c.ok?"#16a34a":"#ef4444"}}>
                            <span style={{fontSize:13,fontWeight:700}}>{c.ok?"✓":"✗"}</span>
                            {c.label}
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{flex:1,height:5,borderRadius:999,background:"#e2e8f0",overflow:"hidden"}}>
                          <div style={{width:`${(score/5)*100}%`,height:"100%",background:strengthColor,borderRadius:999,transition:"width .3s,background .3s"}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:strengthColor,minWidth:60,textAlign:"right"}}>{strength}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="sp-field">
                <label className="sp-label">Confirmer le mot de passe <span style={{color:"#ef4444"}}>*</span></label>
                <div className="sp-pw-wrap">
                  <input type={showConfirm?"text":"password"} className="sp-input" placeholder="••••••••" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required disabled={loading} autoComplete="new-password"/>
                  <button type="button" className="sp-eye" onClick={()=>setShowConfirm(v=>!v)} tabIndex={-1}>{showConfirm?<Eye size={17}/>:<EyeOff size={17}/>}</button>
                </div>
              </div>

              <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",fontSize:13,color:"#374151",lineHeight:1.5}}>
                <input type="checkbox" checked={acceptCGU} onChange={e=>setAcceptCGU(e.target.checked)} disabled={loading} style={{width:16,height:16,accentColor:"#6366f1",marginTop:2,flexShrink:0,cursor:"pointer"}}/>
                <span>J'accepte les{" "}<Link to="/cgu" target="_blank" className="sp-link">Conditions Générales d'Utilisation</Link>{" "}et la{" "}<Link to="/politique-confidentialite" target="_blank" className="sp-link">Politique de confidentialité</Link>{" "}de Localizi.tn.</span>
              </label>

              <button type="submit" className="sp-btn" disabled={loading||!password||!confirmPassword||!acceptCGU}>
                {loading?"Création…":"Créer mon compte"}
              </button>

              <button type="button" onClick={()=>{setStep(1);setError("");}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",padding:"10px",border:"1.5px solid #e2e8f0",borderRadius:11,background:"#f8fafc",color:"#64748b",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                <ChevronLeft size={15}/> Retour
              </button>

              <p className="sp-switch">Déjà un compte ?{" "}<Link to="/login" className="sp-link">Se connecter</Link></p>
            </form>
          )}
          </>}
        </div>
      </div>
      </div>{/* end sp-panels */}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sp-page { min-height: 100vh; display: flex; flex-direction: column; position: relative; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .sp-left { width: 50%; position: relative; overflow: hidden; display: flex; align-items: center; flex-shrink: 0; }
        .sp-left__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .sp-left__overlay { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(6,8,24,.78) 0%, rgba(15,23,42,.92) 100%); }
        .sp-left::before { content: ""; position: absolute; inset: 0; z-index: 1; background-image: radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px); background-size: 24px 24px; }
        .sp-left__content { position: relative; z-index: 2; padding: 52px; }
        .sp-left__logo { margin-bottom: 40px; }
        .sp-left__tagline { font-size: clamp(30px, 3.2vw, 42px); font-weight: 800; color: #fff; line-height: 1.25; letter-spacing: -.025em; }
        .sp-left__sub { font-size: 16px; color: rgba(255,255,255,.7); margin-top: 16px; line-height: 1.75; }
        .sp-left__pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
        .sp-left__pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.7); background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); padding: 5px 12px; border-radius: 999px; }
        .sp-left__pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; }
        .sp-left__accent { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc); z-index: 3; }
        .sp-center-icon { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 30; width: 58px; height: 58px; border-radius: 50%; background: white; box-shadow: 0 8px 32px rgba(0,0,0,.22), 0 0 0 5px rgba(255,255,255,.12); display: flex; align-items: center; justify-content: center; }
        .sp-right { flex: 1; background: #fff; overflow-y: auto; display: flex; align-items: center; justify-content: center; padding: 52px 48px; position: relative; }
        .sp-right::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #818cf8); }
        .sp-form-wrap { width: 100%; max-width: 400px; }
        .sp-title { font-size: 27px; font-weight: 800; color: #0f172a; letter-spacing: -.02em; }
        .sp-sub   { font-size: 14px; color: #94a3b8; margin-top: 5px; margin-bottom: 22px; }
        .sp-notice { border-radius: 10px; padding: 11px 14px; font-size: 13px; margin-bottom: 18px; line-height: 1.5; font-weight: 500; }
        .sp-notice--warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .sp-notice--err  { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
        .sp-form  { display: flex; flex-direction: column; gap: 16px; }
        .sp-field { display: flex; flex-direction: column; gap: 6px; }
        .sp-label { font-size: 12.5px; font-weight: 700; color: #374151; letter-spacing: .2px; }
        .sp-input { width: 100%; padding: 12px 15px; border: 1.5px solid #e2e8f0; border-radius: 11px; font-size: 14px; font-family: inherit; outline: none; color: #0f172a; background: #f8fafc; transition: border-color .15s, background .15s, box-shadow .15s; }
        .sp-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
        .sp-input::placeholder { color: #c0cadb; }
        .sp-input:disabled { opacity: .6; }
        .sp-pw-wrap { position: relative; }
        .sp-pw-wrap .sp-input { padding-right: 46px; }
        .sp-eye { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; padding: 4px; border-radius: 6px; transition: color .15s, background .15s; }
        .sp-eye:hover { color: #374151; background: #f1f5f9; }
        .sp-btn { width: 100%; padding: 13px; border-radius: 11px; border: none; background: #0f172a; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 4px; transition: background .15s, transform .1s, box-shadow .15s; letter-spacing: .01em; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .sp-btn:hover:not(:disabled) { background: #1e293b; box-shadow: 0 6px 20px rgba(15,23,42,.22); }
        .sp-btn:active:not(:disabled) { transform: scale(.985); }
        .sp-btn:disabled { opacity: .5; cursor: not-allowed; }
        .sp-google-btn { width: 100%; padding: 11px 16px; border-radius: 11px; border: 1.5px solid #6366f1; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 14px; font-weight: 600; color: #0f172a; font-family: inherit; transition: all .15s; box-shadow: 0 1px 4px rgba(99,102,241,.08); }
        .sp-google-btn:hover:not(:disabled) { background: #eef2ff; border-color: #4f46e5; }
        .sp-google-btn:disabled { opacity: .6; cursor: not-allowed; }
        .sp-switch { text-align: center; font-size: 13.5px; color: #6b7280; margin-top: 4px; }
        .sp-link   { color: #6366f1; font-weight: 700; text-decoration: none; }
        .sp-link:hover { text-decoration: underline; }
        .sp-divider { display: flex; align-items: center; gap: 12px; color: #94a3b8; font-size: 12px; font-weight: 500; }
        .sp-divider::before, .sp-divider::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }
        .sp-role-group { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sp-role-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 10px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #94a3b8; cursor: pointer; font-family: inherit; text-align: center; transition: all .15s; }
        .sp-role-btn:hover:not(:disabled) { border-color: #94a3b8; background: #f1f5f9; color: #64748b; }
        .sp-role-btn--active { border: 1.5px solid #0f172a !important; background: #0f172a !important; color: #fff !important; box-shadow: 0 4px 14px rgba(15,23,42,.22); }
        .sp-role-btn:disabled { opacity: .6; cursor: not-allowed; }
        .sp-role-icon { display: flex; align-items: center; justify-content: center; line-height: 1; color: inherit; }
        .sp-role-label { font-size: 13px; font-weight: 700; color: inherit; }
        .sp-role-desc { font-size: 11px; color: inherit; opacity: .7; font-weight: 500; line-height: 1.3; }
        .sp-logo-mobile { display: none; }
        .sp-hidden-nav .lz-nav { display: none !important; }
        .sp-hidden-nav .lz-mob-drawer { top: 0 !important; }
        .sp-panels { display: flex; flex: 1; min-height: 0; }
        @media (max-width: 900px) {
          .sp-logo-mobile {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 16px; height: 54px; flex-shrink: 0;
            background: #fff; border-bottom: 1px solid #f1f5f9;
          }
          .sp-mob-burger {
            background: none; border: none; cursor: pointer;
            color: #0f172a; display: flex; padding: 6px; border-radius: 8px;
            transition: background .15s;
          }
          .sp-mob-burger:hover { background: #f1f5f9; }
          .sp-panels { flex-direction: column; flex: 1; }
          .sp-left { display: none; }
          .sp-center-icon { display: none; }
          .sp-right { width: 100%; padding: 24px 20px; flex: 1; }
          .sp-right::before { display: none; }
        }
        @media (max-width: 480px) { .sp-right { padding: 16px 20px; } .sp-form-wrap { max-width: 100%; } }
      `}</style>
    </div>
  );
}
