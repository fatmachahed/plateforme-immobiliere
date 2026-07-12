import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import PublierAnnonceBtn from "../components/PublierAnnonceBtn";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import {
  Search, MapPin, Heart, Bell, PlusCircle, CheckCircle, Eye, MessageSquare,
  Users, ArrowRight, ArrowDown, Home, UserPlus, Camera, Clock, BarChart2,
  Phone, Shield, Star
} from "lucide-react";

/* ─── Schéma visuel avec flèches ─── */
function FlowSchema({ steps, color }) {
  return (
    <div style={{position:"relative",padding:"0 0 8px"}}>
      {steps.map((step, i) => (
        <div key={i}>
          {/* Carte étape */}
          <div style={{
            display:"flex", alignItems:"flex-start", gap:16,
            background:"#fff", borderRadius:14, border:`1.5px solid ${color}22`,
            padding:"18px 22px", boxShadow:"0 2px 12px rgba(0,0,0,.05)",
            position:"relative", zIndex:1,
          }}>
            {/* Numéro + icône */}
            <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{
                width:44,height:44,borderRadius:12,
                background:`linear-gradient(135deg,${color},${color}cc)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",boxShadow:`0 4px 12px ${color}44`,
              }}>
                {step.icon}
              </div>
              <span style={{
                fontSize:20,fontWeight:900,color:color,
                background:`${color}15`,padding:"2px 9px",borderRadius:20,
                minWidth:32,textAlign:"center",display:"inline-block",
              }}>
                {i + 1}
              </span>
            </div>
            {/* Contenu */}
            <div style={{flex:1,minWidth:0}}>
              <h3 style={{fontSize:15,fontWeight:800,color:"#0f172a",margin:"0 0 5px",lineHeight:1.3}}>
                {step.title}
              </h3>
              <p style={{fontSize:13.5,color:"#64748b",margin:0,lineHeight:1.7}}>
                {step.desc}
              </p>
              {step.detail && (
                <div style={{marginTop:8,padding:"8px 12px",background:`${color}0a`,borderRadius:8,border:`1px solid ${color}20`,fontSize:12.5,color:color,fontWeight:600}}>
                  💡 {step.detail}
                </div>
              )}
            </div>
          </div>

          {/* Flèche entre les étapes */}
          {i < steps.length - 1 && (
            <div style={{display:"flex",justifyContent:"flex-start",padding:"6px 0 6px 22px",position:"relative",zIndex:0}}>
              <div style={{
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              }}>
                <div style={{width:2,height:16,background:`${color}30`,borderRadius:2}}/>
                <ArrowDown size={16} style={{color,opacity:.55}}/>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const STEPS_ACHETEUR = [
  {
    icon:<Search size={22}/>,
    title:"Recherchez votre bien",
    desc:"Utilisez nos filtres avancés (lieu, type, budget, surface) ou explorez la carte interactive pour trouver le bien idéal.",
    detail:"Filtrez par gouvernorat, délégation, localité et jusqu'à 30 critères différents.",
  },
  {
    icon:<Eye size={22}/>,
    title:"Consultez les annonces",
    desc:"Découvrez les photos, la description détaillée, la localisation précise et la référence unique du bien.",
    detail:"Comparez plusieurs biens côte-à-côte grâce au comparateur intégré.",
  },
  {
    icon:<Heart size={22}/>,
    title:"Sauvegardez vos favoris",
    desc:"Ajoutez les biens qui vous intéressent à vos favoris pour les retrouver facilement.",
  },
  {
    icon:<Bell size={22}/>,
    title:"Activez une alerte email",
    desc:"Configurez une alerte pour être notifié(e) dès qu'une nouvelle annonce correspondant à vos critères est publiée.",
    detail:"Disponible depuis la carte ou la page d'accueil → « Enregistrer cette recherche ».",
  },
  {
    icon:<Phone size={22}/>,
    title:"Contactez le vendeur",
    desc:"Contactez directement le propriétaire ou l'agent par téléphone, WhatsApp ou via le formulaire de contact sécurisé.",
    detail:"🔐 Pour voir les numéros de téléphone des propriétaires, vous devez être connecté(e). Créez un compte gratuitement en moins de 2 minutes.",
  },
];

const STEPS_VENDEUR = [
  {
    icon:<UserPlus size={22}/>,
    title:"Créez votre compte",
    desc:"Inscrivez-vous gratuitement en tant que particulier ou professionnel (agence). L'inscription prend moins de 2 minutes.",
    detail:"Les professionnels renseignent leur gouvernorat de couverture, matricule fiscal et registre de commerce.",
  },
  {
    icon:<PlusCircle size={22}/>,
    title:"Publiez votre annonce",
    desc:"Remplissez les informations du bien (type, superficie, prix, caractéristiques), géolocalisez-le sur la carte et ajoutez vos photos.",
    detail:"Une référence unique (ex : SF0012) est attribuée automatiquement à chaque annonce.",
  },
  {
    icon:<Eye size={22}/>,
    title:"Prévisualisez avant de publier",
    desc:"Vérifiez exactement l'apparence de votre annonce telle qu'elle sera vue par les acheteurs, avec la mise en page complète.",
  },
  {
    icon:<Clock size={22}/>,
    title:"Validation en 24–48h",
    desc:"Notre équipe examine votre annonce et la publie rapidement. Vous recevez une notification dès la mise en ligne.",
  },
  {
    icon:<BarChart2 size={22}/>,
    title:"Suivez vos performances",
    desc:"Depuis votre tableau de bord, suivez les vues, modifiez les informations et répondez aux demandes de contact.",
    detail:"Option : boostez votre annonce pour apparaître en tête des résultats.",
  },
];

const FAQ_CCM = [
  { q:"Combien coûte la publication ?", a:"La publication de base est entièrement gratuite. Des options payantes (Boost, mise en avant) permettent d'augmenter la visibilité de votre annonce." },
  { q:"Qui peut voir mon annonce ?", a:"Toutes les annonces approuvées sont visibles par tous les visiteurs, connectés ou non. Vous pouvez choisir de publier anonymement pour masquer votre identité." },
  { q:"Comment fonctionne la carte interactive ?", a:"La carte affiche toutes les annonces géolocalisées. Vous pouvez zoomer, filtrer et cliquer sur chaque marqueur pour voir les détails sans quitter la carte." },
  { q:"Comment activer une alerte email ?", a:"Depuis la carte ou la page d'accueil, configurez vos critères puis cliquez sur « Enregistrer cette recherche ». Vous recevrez un email à chaque nouvelle annonce correspondante." },
  { q:"Qu'est-ce que la référence d'une annonce ?", a:"Chaque bien publié reçoit une référence unique (ex : TN0001 pour Tunis, SF0012 pour Sfax). Elle permet de retrouver et partager facilement une annonce spécifique." },
  { q:"Faut-il un compte pour contacter un vendeur ?", a:"Oui, pour voir les numéros de téléphone et contacter directement les propriétaires, vous devez être connecté(e). Les visiteurs non connectés voient un numéro masqué et peuvent créer un compte gratuitement pour accéder aux coordonnées. Les annonces anonymes utilisent un formulaire de contact sécurisé." },
];

export default function CommentCaMarche() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc", fontFamily:"'Poppins',system-ui,sans-serif"}}>
      <Seo
        title="Comment ça marche ?"
        description="Découvrez comment publier une annonce, rechercher un bien par carte géolocalisée et recevoir des alertes personnalisées sur Localizi.tn."
        path="/comment-ca-marche"
      />
      <Navbar/>

      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"60px 24px 56px", textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,.2)",border:"1px solid rgba(99,102,241,.35)",padding:"5px 14px",borderRadius:999,fontSize:12,fontWeight:700,color:"#a5b4fc",marginBottom:16,letterSpacing:".04em",textTransform:"uppercase"}}>
          <Star size={12}/> Guide d'utilisation
        </div>
        <h1 style={{fontSize:"clamp(26px,3vw,36px)", fontWeight:800, color:"#fff", margin:"0 0 14px", letterSpacing:"-.02em"}}>
          Comment ça marche ?
        </h1>
        <p style={{fontSize:15, color:"rgba(255,255,255,.6)", maxWidth:560, margin:"0 auto"}}>
          Localizi.tn simplifie l'immobilier tunisien. Voici ci-après comment acheter, louer ou vendre en quelques étapes claires.
        </p>

        {/* Aperçu rapide — cliquable pour naviguer vers les sections */}
        <div style={{display:"flex",justifyContent:"center",gap:32,marginTop:36,flexWrap:"wrap"}}>
          {[
            {n:"5 étapes",l:"Pour trouver un bien",c:"#6366f1",anchor:"section-acheteurs"},
            {n:"5 étapes",l:"Pour publier une annonce",c:"#10b981",anchor:"section-vendeurs"},
            {n:"< 2 min",l:"Pour s'inscrire",c:"#f59e0b",anchor:"section-inscription"},
          ].map((item,i) => (
            <button key={i} onClick={() => {
              const el = document.getElementById(item.anchor);
              if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 72; window.scrollTo({top:y,behavior:"smooth"}); }
            }} style={{textAlign:"center",background:"none",border:"none",cursor:"pointer",padding:"8px 12px",borderRadius:12,transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <div style={{fontSize:22,fontWeight:900,color:item.c}}>{item.n}</div>
              <div style={{fontSize:12.5,color:"rgba(255,255,255,.5)",marginTop:2}}>{item.l}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:900, margin:"0 auto", padding:"52px 20px 80px"}}>

        {/* ─── ACHETEURS ─── */}
        <div id="section-acheteurs" style={{marginBottom:56}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
            <div style={{width:42,height:42,borderRadius:12,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Search size={20} color="#6366f1"/>
            </div>
            <div>
              <p style={{fontSize:11.5,fontWeight:800,color:"#6366f1",textTransform:"uppercase",letterSpacing:".1em",margin:0}}>Pour les acheteurs & locataires</p>
              <h2 style={{fontSize:22,fontWeight:900,color:"#0f172a",margin:0}}>Trouver votre bien idéal</h2>
            </div>
          </div>
          <FlowSchema steps={STEPS_ACHETEUR} color="#6366f1"/>
        </div>

        {/* Séparateur décoratif */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:56}}>
          <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
          <div style={{padding:"8px 20px",borderRadius:999,background:"#fff",border:"1.5px solid #e2e8f0",fontSize:12.5,fontWeight:700,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}>
            <Home size={13}/> Vous êtes vendeur ou bailleur ?
          </div>
          <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
        </div>

        {/* ─── VENDEURS ─── */}
        <div id="section-vendeurs" style={{marginBottom:56}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
            <div style={{width:42,height:42,borderRadius:12,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <PlusCircle size={20} color="#10b981"/>
            </div>
            <div>
              <p style={{fontSize:11.5,fontWeight:800,color:"#10b981",textTransform:"uppercase",letterSpacing:".1em",margin:0}}>Pour les vendeurs & bailleurs</p>
              <h2 style={{fontSize:22,fontWeight:900,color:"#0f172a",margin:0}}>Publier votre annonce</h2>
            </div>
          </div>
          <FlowSchema steps={STEPS_VENDEUR} color="#10b981"/>
        </div>

        {/* ─── INSCRIPTION RAPIDE ─── */}
        <div id="section-inscription" style={{marginBottom:56}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
            <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
            <div style={{padding:"8px 20px",borderRadius:999,background:"#fff",border:"1.5px solid #e2e8f0",fontSize:12.5,fontWeight:700,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}>
              <Clock size={13}/> Inscription express
            </div>
            <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
            <div style={{width:42,height:42,borderRadius:12,background:"#fffbeb",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <UserPlus size={20} color="#f59e0b"/>
            </div>
            <div>
              <p style={{fontSize:11.5,fontWeight:800,color:"#f59e0b",textTransform:"uppercase",letterSpacing:".1em",margin:0}}>S'inscrire gratuitement</p>
              <h2 style={{fontSize:22,fontWeight:900,color:"#0f172a",margin:0}}>Créez votre compte en moins de 2 minutes</h2>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[
              {
                n:1, title:"Choisissez votre profil",
                desc:"Sélectionnez « Particulier » (achat, location, vente) ou « Professionnel » (agence, promoteur, prestataire).",
              },
              {
                n:2, title:"Renseignez vos informations",
                desc:"Nom d'utilisateur, adresse e-mail et mot de passe. Vous pouvez aussi vous inscrire directement avec votre compte Google en un seul clic.",
              },
              {
                n:3, title:"Confirmez votre e-mail",
                desc:"Un e-mail de confirmation vous est envoyé instantanément. Cliquez sur le lien pour activer votre compte.",
              },
              {
                n:4, title:"Votre compte est prêt !",
                desc:"Accédez à votre tableau de bord : publiez des annonces, contactez des vendeurs, sauvegardez des favoris et activez vos alertes.",
              },
            ].map(step => (
              <div key={step.n} style={{display:"flex",alignItems:"flex-start",gap:16,background:"#fff",borderRadius:14,border:"1.5px solid #f59e0b22",padding:"18px 22px",boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
                <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#f59e0b,#f59e0bcc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 4px 12px #f59e0b44"}}>
                    <UserPlus size={22}/>
                  </div>
                  <span style={{fontSize:20,fontWeight:900,color:"#f59e0b",background:"#f59e0b15",padding:"2px 9px",borderRadius:20,minWidth:32,textAlign:"center",display:"inline-block"}}>{step.n}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <h3 style={{fontSize:15,fontWeight:800,color:"#0f172a",margin:"0 0 5px",lineHeight:1.3}}>{step.title}</h3>
                  <p style={{fontSize:13.5,color:"#64748b",margin:0,lineHeight:1.7}}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,padding:"14px 20px",background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:12,border:"1px solid #fde68a",display:"flex",alignItems:"center",gap:12}}>
            <Shield size={18} color="#f59e0b" style={{flexShrink:0}}/>
            <p style={{margin:0,fontSize:13.5,color:"#92400e",fontWeight:500,lineHeight:1.6}}>
              L'inscription est <strong>100% gratuite</strong> et ne prend que quelques secondes. Aucune carte bancaire requise.
            </p>
          </div>
        </div>

        {/* ─── FAQ ─── */}
        <div style={{marginBottom:52}}>
          <h2 style={{fontSize:20,fontWeight:900,color:"#0f172a",marginBottom:16}}>Questions fréquentes</h2>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {FAQ_CCM.map((item, i) => (
              <div key={i}
                style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",
                  boxShadow: openFaq===i ? "0 4px 16px rgba(99,102,241,.08)" : "none",
                  transition:"box-shadow .2s",
                }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"16px 20px",background:"none",border:"none",cursor:"pointer",textAlign:"left",
                    fontFamily:"inherit",
                  }}
                >
                  <span style={{fontWeight:700,color:"#0f172a",fontSize:14}}>{item.q}</span>
                  <div style={{
                    width:26,height:26,borderRadius:8,
                    background:openFaq===i?"#6366f1":"#f1f5f9",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                    transition:"background .15s",
                  }}>
                    <ArrowDown size={14} style={{
                      color:openFaq===i?"#fff":"#64748b",
                      transform:openFaq===i?"rotate(180deg)":"none",
                      transition:"transform .2s",
                    }}/>
                  </div>
                </button>
                {openFaq === i && (
                  <div style={{padding:"0 20px 18px",fontSize:13.5,color:"#64748b",lineHeight:1.75}}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── CTA ─── */}
        <div style={{background:"linear-gradient(135deg,#6366f1,#4f46e5)",borderRadius:18,padding:"40px 36px",textAlign:"center"}}>
          <Shield size={28} style={{color:"rgba(255,255,255,.6)",marginBottom:12}}/>
          <h3 style={{fontSize:22,fontWeight:900,color:"#fff",margin:"0 0 10px"}}>Prêt à commencer ?</h3>
          <p style={{fontSize:14,color:"rgba(255,255,255,.75)",margin:"0 0 28px"}}>
            Rejoignez Localizi.tn et trouvez ou publiez votre bien dès maintenant.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <Link to="/carte" style={{display:"inline-flex",alignItems:"center",gap:7,background:"#fff",color:"#4f46e5",fontWeight:700,fontSize:14,padding:"13px 26px",borderRadius:11,textDecoration:"none",boxShadow:"0 4px 14px rgba(0,0,0,.15)"}}>
              <Search size={15}/> Rechercher un bien
            </Link>
            <PublierAnnonceBtn style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,255,255,.15)",color:"#fff",fontWeight:700,fontSize:14,padding:"13px 26px",borderRadius:11,textDecoration:"none",border:"1.5px solid rgba(255,255,255,.3)"}}>
              <PlusCircle size={15}/> Publier une annonce
            </PublierAnnonceBtn>
          </div>
        </div>

      </div>

      <Footer/>
    </div>
  );
}
