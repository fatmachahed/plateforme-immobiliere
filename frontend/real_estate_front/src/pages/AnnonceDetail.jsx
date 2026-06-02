import React, { useState, useEffect } from "react";
import API_URL from '../config';
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ArrowLeft, MapPin,
  Bed, Bath, Maximize, Phone, Mail, Heart, Share2,
  CheckCircle, Calendar, Tag, Home, Loader,
  Languages, Navigation, Eye,
  Waves, Mountain, TreePine, Fence, Sun, Flower2, Droplets, ParkingCircle,
  ArrowUpDown, Car, Package, Sofa, Users, ShieldCheck,
  UtensilsCrossed, Wind, Thermometer, Flame, DoorClosed, LockKeyhole,
  Fingerprint, Wifi, Monitor, RefreshCw, KeyRound, PhoneCall
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useToast } from "../components/Toast";
import { useLanguage } from "../contexts/LanguageContext";


/* ── Haversine distance in km ── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
    + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/* DEMO fallback for non-API annonces */
const DEMO = [
  { id:1, titre:"Villa 4 chambres — La Marsa", prix:850000, devise:"TND", location:"La Marsa, Tunis", beds:4, baths:3, area:320, type:"Villa", categorie:"Vente", etat:"Bon état", annee:2018, description:"Magnifique villa moderne de 320 m² avec jardins aménagés, piscine et double garage. Finitions haut de gamme, cuisine équipée, salon américain et vue dégagée.", features:["Jardin","Piscine","Garage","Terrasse","Cuisine équipée","Climatisation","Sécurité"], lat:36.879, lng:10.325, images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6d338c45?w=900&q=80"], contact:{nom:"Ahmed Ben Salem",tel:"+216 55 123 456",email:"ahmed@immo.tn"} },
  { id:2, titre:"Appartement S+3 — Lac 2", prix:320000, devise:"TND", location:"Berges du Lac, Tunis", beds:3, baths:2, area:145, type:"Appartement", categorie:"Vente", etat:"Neuf", annee:2023, description:"Appartement neuf S+3 dans résidence sécurisée avec ascenseur et parking. Lumineux, vue sur le lac.", features:["Ascenseur","Parking","Gardien","Double vitrage"], lat:36.838, lng:10.235, images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80"], contact:{nom:"Sonia Trabelsi",tel:"+216 22 987 654",email:"sonia@immo.tn"} },
  { id:3, titre:"Terrain résidentiel — Sousse", prix:180000, devise:"TND", location:"Sousse Nord", beds:null, baths:null, area:500, type:"Terrain", categorie:"Vente", etat:"Viabilisé", annee:null, description:"Terrain résidentiel de 500 m² dans lotissement autorisé. Toutes viabilisations réalisées.", features:["Titre foncier","Viabilisé","Raccordé ONAS"], lat:35.828, lng:10.636, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80"], contact:{nom:"Mohamed Gharbi",tel:"+216 98 456 789",email:"m.gharbi@terrain.tn"} },
  { id:4, titre:"Appartement meublé — Hammamet", prix:1800, devise:"TND/mois", location:"Hammamet Centre", beds:2, baths:1, area:85, type:"Appartement", categorie:"Location", etat:"Meublé", annee:2015, description:"Appartement S+2 entièrement meublé à 5 min de la plage. Tout équipé.", features:["Meublé","Climatisation","Wifi","Balcon"], lat:36.400, lng:10.620, images:["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=900&q=80"], contact:{nom:"Karim Chaabane",tel:"+216 71 234 567",email:"karim@immo.tn"} },
  { id:5, titre:"Villa avec piscine — Gammarth", prix:1200000, devise:"TND", location:"Gammarth", beds:5, baths:4, area:420, type:"Villa", categorie:"Vente", etat:"Excellent état", annee:2020, description:"Villa de luxe R+1 avec piscine chauffée, jardin 800 m², 5 chambres.", features:["Piscine chauffée","Jardin 800m²","Gardien 24h"], lat:36.903, lng:10.299, images:["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&q=80"], contact:{nom:"Agence Prestige Immo",tel:"+216 71 800 900",email:"contact@prestige.tn"} },
  { id:6, titre:"Duplex — Ennasr", prix:290000, devise:"TND", location:"Ennasr, Ariana", beds:3, baths:2, area:165, type:"Appartement", categorie:"Vente", etat:"Bon état", annee:2016, description:"Beau duplex S+3 de 165 m² avec terrasse 40 m².", features:["Terrasse 40m²","Ascenseur","Cuisine équipée"], lat:36.860, lng:10.195, images:["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80"], contact:{nom:"Nadia Hajri",tel:"+216 29 111 222",email:"nadia@immo.tn"} },
];

const TYPE_FR  = { appartement:"Appartement", villa:"Villa", maison:"Maison", terrain:"Terrain", bureau:"Bureau", local_commercial:"Local commercial", ferme:"Ferme" };
const CAT_FR   = { vente:"Achat", location:"Location", vacances:"Vacances" };
const ETAT_FR  = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"À rénover", cours_construction:"En construction" };

function normalizeApi(a) {
  const loc = [a.localite, a.delegation, a.gouvernorat].filter(Boolean).join(", ");
  return {
    id:          a.id,
    titre:       a.titre,
    prix:        a.prix,
    devise:      a.devise,
    location:    loc || "Tunisie",
    /* adresse détaillée */
    address:     a.address     || null,
    gouvernorat: a.gouvernorat || null,
    delegation:  a.delegation  || null,
    localite:    a.localite    || null,
    beds:        a.nb_chambres,
    baths:       a.nb_salles_bain,
    area:        a.superficie,
    type:        TYPE_FR[a.type_bien] || a.type_bien,
    categorie:   CAT_FR[a.categorie] || a.categorie,
    etat:        ETAT_FR[a.etat_bien] || a.etat_bien || null,
    annee:       a.annee_construction,
    description: a.description || "Aucune description disponible.",
    features:    a.features || [],
    lat:         a.latitude  || 36.8065,
    lng:         a.longitude || 10.1815,
    images:      (a.images || []).length > 0
      ? (a.images || []).map(img => img.startsWith("http") ? img : `${API_URL}${img}`)
      : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"],
    anonyme: a.anonyme || false,
    contact: {
      nom:   a.user?.username     || "Propriétaire",
      tel:   a.user?.phone_number || "",
      email: a.user?.email        || "",
    },
    fromApi: true,
    utilisateur_id: a.user?.id,
    views_count: a.views_count || 0,
  };
}

export default function AnnonceDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [prop,      setProp]      = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm,  setContactForm]  = useState({ nom:"", email:"", telephone:"", message:"" });
  const [contactSent,  setContactSent]  = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [imgIdx,    setImgIdx]    = useState(0);
  const [showPhone,    setShowPhone]    = useState(false);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [isFavori,  setIsFavori]  = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [nearby,    setNearby]    = useState([]);
  const [translated, setTranslated] = useState("");
  const [translating, setTranslating] = useState(false);

  const token    = localStorage.getItem("token");
  const userData = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const { lang, t } = useLanguage();

  /* Fetch annonce from API, fall back to DEMO */
  useEffect(() => {
    setLoading(true);
    setImgIdx(0);
    fetch(`${API_URL}/annonces/${id}/detail`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProp(normalizeApi(data));
        } else {
          const demo = DEMO.find(p => p.id === Number(id));
          setProp(demo || null);
        }
      })
      .catch(() => {
        const demo = DEMO.find(p => p.id === Number(id));
        setProp(demo || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* Fetch nearby annonces by proximity */
  useEffect(() => {
    if (!prop) return;
    setNearby([]);
    fetch(`${API_URL}/annonces/public?limit=100`)
      .then(r => r.json())
      .then(data => {
        const annonces = Array.isArray(data) ? data : [];
        const withDist = annonces
          .filter(a => String(a.id) !== String(id) && a.latitude && a.longitude)
          .map(a => ({ ...a, _dist: haversine(prop.lat, prop.lng, a.latitude, a.longitude) }))
          .sort((a, b) => a._dist - b._dist)
          .slice(0, 6);
        setNearby(withDist);
      })
      .catch(() => {});
  }, [prop, id]);

  /* Check if already saved */
  useEffect(() => {
    if (!token || !prop?.fromApi) return;
    fetch(`${API_URL}/users/me/favoris`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setIsFavori(data.some(f => f.id === Number(id)));
      })
      .catch(() => {});
  }, [token, id, prop?.fromApi]);

  const handleToggleFavori = async () => {
    if (!token) {
      toast("Connectez-vous pour sauvegarder cette annonce.", "error");
      return;
    }
    if (!prop?.fromApi) {
      toast("Les annonces de démonstration ne peuvent pas être sauvegardées.", "error");
      return;
    }
    setFavLoading(true);
    try {
      if (isFavori) {
        await fetch(`${API_URL}/users/me/favoris/${id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavori(false);
        toast("Retiré des favoris.");
      } else {
        await fetch(`${API_URL}/users/me/favoris/${id}`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavori(true);
        toast("Annonce sauvegardée dans vos favoris !");
      }
    } catch {
      toast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setFavLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (translating) return;
    if (translated) { setTranslated(""); return; } // toggle off
    setTranslating(true);
    try {
      const text = prop.description || "";
      /* Translate in the direction opposite to current site language */
      const pair = lang === "fr" ? "fr|en" : "en|fr";
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`
      );
      const data = await res.json();
      setTranslated(data?.responseData?.translatedText || "");
    } catch {
      toast(lang === "fr" ? "Traduction impossible pour l'instant." : "Translation unavailable right now.", "error");
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-root">
        <Navbar />
        <div className="ad-loading"><Loader size={32} className="ad-spin" /><p>Chargement…</p></div>
      </div>
    );
  }

  if (!prop) {
    return (
      <div className="ad-root">
        <Navbar />
        <div className="ad-not-found">
          <Home size={48} strokeWidth={1} />
          <p>Annonce introuvable.</p>
          <button className="ad-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Retour
          </button>
        </div>
      </div>
    );
  }

  const images = prop.images?.length > 0 ? prop.images : ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=900&q=80"];
  const prevImg = () => setImgIdx(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx(i => (i + 1) % images.length);

  const isOwner = userData && prop.utilisateur_id && userData.id === prop.utilisateur_id;

  return (
    <div className="ad-root">
      <Navbar />

      {/* Top bar */}
      <div className="ad-topbar">
        <button className="ad-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Retour
        </button>
        <div className="ad-topbar__actions">
          {isOwner && (
            <Link to={`/modifier_annonce/${prop.id}`} className="ad-action">
              <CheckCircle size={15} /> Modifier
            </Link>
          )}
          <button
            className={`ad-action${isFavori ? " ad-action--liked" : ""}`}
            onClick={handleToggleFavori}
            disabled={favLoading}
          >
            <Heart size={15} fill={isFavori ? "currentColor" : "none"} />
            {isFavori ? "Sauvegardé" : "Sauvegarder"}
          </button>
          <button className="ad-action" onClick={() => {
            if (navigator.share) navigator.share({ title: prop.titre, url: window.location.href });
            else { navigator.clipboard.writeText(window.location.href); toast("Lien copié !"); }
          }}>
            <Share2 size={15} /> Partager
          </button>
        </div>
      </div>

      <div className="ad-body">
        {/* Left column */}
        <div className="ad-left">
          {/* Gallery */}
          <div className="ad-gallery">
            <div className="ad-gallery__main">
              <img key={imgIdx} src={images[imgIdx]} alt={prop.titre} className="ad-gallery__img" />
              {images.length > 1 && (
                <>
                  <button className="ad-gallery__btn ad-gallery__btn--l" onClick={prevImg}><ChevronLeft size={18}/></button>
                  <button className="ad-gallery__btn ad-gallery__btn--r" onClick={nextImg}><ChevronRight size={18}/></button>
                  <span className="ad-gallery__counter">{imgIdx+1} / {images.length}</span>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="ad-gallery__thumbs">
                {images.map((src,i) => (
                  <img key={i} src={src} alt="" loading="lazy"
                    className={`ad-gallery__thumb${i===imgIdx?" ad-gallery__thumb--on":""}`}
                    onClick={() => setImgIdx(i)} />
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="ad-section">
            <div className="ad-section__header">
              <h2 className="ad-section__title">{t("ad_description")}</h2>
              <button className="ad-translate-btn" onClick={handleTranslate} disabled={translating}>
                {translating
                  ? <Loader size={13} className="ad-spin"/>
                  : <Languages size={13}/>
                }
                {translated ? t("ad_original") : t("ad_translate")}
              </button>
            </div>
            <p className="ad-desc">{translated || prop.description}</p>
            {translated && (
              <p className="ad-translated-note">🌐 Traduit automatiquement · <button onClick={()=>setTranslated("")} className="ad-translated-reset">Voir l'original</button></p>
            )}
          </div>

          {/* Features */}
          {prop.features?.length > 0 && (() => {
            /* Mapping label → icône (même icônes que dans CreerAnnonce) */
            const FEAT_ICONS = {
              "Vue sur mer":       Waves,        "Vue montagne":      Mountain,
              "Vue forêt":         TreePine,     "Jardin":            Fence,
              "Terrasse":          Sun,          "Balcon":            Flower2,
              "Piscine":           Droplets,     "Parking":           ParkingCircle,
              "Ascenseur":         ArrowUpDown,  "Garage":            Car,
              "Chambre rangement": Package,      "Meublé":            Sofa,
              "Concierge":         Users,        "Gardien":           ShieldCheck,
              "Animaux admis":     Heart,        "Cuisine équipée":   UtensilsCrossed,
              "Climatisation":     Wind,         "Chauffage central": Thermometer,
              "Cheminée":          Flame,        "Double vitrage":    DoorClosed,
              "Porte blindée":     LockKeyhole,  "Sécurité":          Fingerprint,
              "Internet":          Wifi,         "TV":                Monitor,
              "Machine à laver":   RefreshCw,    "Digicode":          KeyRound,
              "Interphone":        PhoneCall,    "Relié ONAS":        Droplets,
              "Salon américain":   Monitor,      "Fibre optique":     Wifi,
            };
            return (
              <div className="ad-section">
                <h2 className="ad-section__title">Caractéristiques du bien</h2>
                <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:"10px 8px"}}>
                  {prop.features.map(f => {
                    const Ico = FEAT_ICONS[f] || CheckCircle;
                    return (
                      <div key={f} style={{
                        display:"flex", alignItems:"center", gap:8,
                        padding:"9px 11px", borderRadius:8,
                        background:"#f8fafc", border:"1px solid #e5e7eb",
                        fontSize:12.5, fontWeight:600, color:"#374151",
                      }}>
                        <Ico size={16} strokeWidth={1.6} style={{color:"#4f46e5",flexShrink:0}}/>
                        {f}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right column */}
        <div className="ad-right">
          <div className="ad-card">
            <span className={`ad-card__cat ad-card__cat--${prop.categorie?.toLowerCase()}`}>{prop.categorie}</span>
            <h1 className="ad-card__titre">{prop.titre}</h1>
            {/* ── Adresse complète ── */}
            <div className="ad-addr">
              {prop.address && (
                <p className="ad-addr__street">
                  <MapPin size={13} className="ad-addr__ico"/>
                  {prop.address}
                </p>
              )}
              <div className="ad-addr__hier">
                {prop.localite    && <span className="ad-addr__chip ad-addr__chip--loc">{prop.localite}</span>}
                {prop.localite    && prop.delegation && <span className="ad-addr__sep">›</span>}
                {prop.delegation  && <span className="ad-addr__chip ad-addr__chip--del">{prop.delegation}</span>}
                {(prop.delegation || prop.localite) && prop.gouvernorat && <span className="ad-addr__sep">›</span>}
                {prop.gouvernorat && <span className="ad-addr__chip ad-addr__chip--gov">{prop.gouvernorat}</span>}
                {!prop.gouvernorat && !prop.delegation && !prop.localite && !prop.address && (
                  <span style={{color:"#9ca3af",fontSize:13}}><MapPin size={12}/> {prop.location}</span>
                )}
              </div>
            </div>
            <p className="ad-card__price">
              {Number(prop.prix).toLocaleString("fr-TN")}
              <span> {prop.devise}</span>
            </p>

            <div className="ad-specs">
              {prop.beds  != null && <div className="ad-spec"><Bed size={16}/><p className="ad-spec__val">{prop.beds}</p><p className="ad-spec__lbl">Chambres</p></div>}
              {prop.baths != null && <div className="ad-spec"><Bath size={16}/><p className="ad-spec__val">{prop.baths}</p><p className="ad-spec__lbl">Sdb</p></div>}
              {prop.area  &&         <div className="ad-spec"><Maximize size={16}/><p className="ad-spec__val">{prop.area}</p><p className="ad-spec__lbl">m²</p></div>}
            </div>

            <div className="ad-meta">
              <div className="ad-meta__item"><Tag size={13}/> <span>Type :</span> {prop.type}</div>
              {prop.etat  && <div className="ad-meta__item"><CheckCircle size={13}/><span>État :</span> {prop.etat}</div>}
              {prop.annee && <div className="ad-meta__item"><Calendar size={13}/><span>Année :</span> {prop.annee}</div>}
            </div>

            <div className="ad-divider" />

            {/* ── Bloc contact Phase 1 ── */}
            <div className="ad-contact-box">
              {/* ── Avatar + nom ── */}
              <div className="ad-contact-box__header">
                {prop.anonyme ? (
                  /* Avatar anonyme — affiché pour TOUT le monde quand anonyme=true */
                  <div style={{
                    width:44, height:44, borderRadius:"50%",
                    background:"linear-gradient(135deg,#94a3b8,#64748b)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0, border:"2px solid #e2e8f0"
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                ) : (() => {
                  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                  const avatarUrl = isOwner ? storedUser?.profile_picture : null;
                  const initiale  = (prop.contact.nom||"?")[0].toUpperCase();
                  return avatarUrl ? (
                    <img src={avatarUrl.startsWith("http") ? avatarUrl : `${API_URL}${avatarUrl}`}
                      alt="avatar" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e2e8f0"}}/>
                  ) : (
                    <div className="ad-contact-box__avatar">{initiale}</div>
                  );
                })()}
                <div>
                  <div className="ad-contact-box__name">
                    {prop.anonyme ? "Membre anonyme" : prop.contact.nom}
                  </div>
                  <div className="ad-contact-box__role">
                    {prop.anonyme
                      ? "Identité masquée · Publication anonyme"
                      : (prop.fromApi ? "Propriétaire / Agent" : "Propriétaire")}
                  </div>
                </div>
              </div>

              {/* ── Vues (visible au propriétaire seulement) ── */}
              {isOwner && prop.views_count > 0 && (
                <div className="ad-views-row">
                  <Eye size={14}/> <span>{prop.views_count} vue{prop.views_count > 1 ? "s" : ""}</span>
                </div>
              )}

              {/* ── Contact : logique anonyme stricte ── */}
              {prop.anonyme ? (
                /* ANONYME — tout le monde voit ce bloc, y compris l'owner (pour preview) */
                <div style={{marginTop:16}}>
                  {isOwner && (
                    <div style={{
                      background:"#fffbeb", border:"1px solid #fde68a", borderRadius:9,
                      padding:"9px 13px", fontSize:12.5, color:"#92400e", marginBottom:12,
                      lineHeight:1.5
                    }}>
                      🔒 Votre annonce est publiée <strong>anonymement</strong>.<br/>Les visiteurs ne voient pas vos coordonnées.
                    </div>
                  )}
                  {!isOwner && (
                    <>
                      <button
                        onClick={() => {
                          /* Pré-remplir avec les infos du compte connecté */
                          const u = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
                          if (u) setContactForm(f => ({
                            ...f,
                            nom:       f.nom       || u.username     || "",
                            telephone: f.telephone || u.phone_number || "",
                            email:     f.email     || u.email        || "",
                          }));
                          setShowContactModal(true);
                        }}
                        style={{
                          width:"100%", padding:"13px 16px", borderRadius:11, border:"none",
                          background:"linear-gradient(135deg,#6366f1,#818cf8)", color:"#fff",
                          fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:8
                        }}
                      >
                        📩 Contacter le propriétaire
                      </button>
                      <p style={{fontSize:11.5, color:"#94a3b8", textAlign:"center", marginTop:8}}>
                        Laissez vos coordonnées — le propriétaire vous contactera s'il est intéressé.
                      </p>
                    </>
                  )}
                </div>
              ) : token ? (
                /* ── NON-ANONYME + CONNECTÉ : coordonnées visibles ── */
                <div className="ad-contact-box__btns">
                  {prop.contact.tel && (
                    <>
                      <a href={`tel:${prop.contact.tel.replace(/\s/g,"")}`} className="ad-cbtn ad-cbtn--call">
                        <Phone size={15}/> {prop.contact.tel}
                      </a>
                      <a
                        href={`https://wa.me/${prop.contact.tel.replace(/[\s+]/g,"").replace(/^00/,"")}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce "${prop.titre}" sur Localizi.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="ad-cbtn ad-cbtn--whatsapp"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.549 4.112 1.51 5.845L.057 23.617a.5.5 0 00.611.65l5.975-1.566A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.893 9.893 0 01-5.048-1.38l-.361-.215-3.745.982.999-3.648-.235-.374A9.861 9.861 0 012.106 12C2.106 6.527 6.527 2.106 12 2.106S21.894 6.527 21.894 12 17.473 21.894 12 21.894z"/></svg>
                        WhatsApp
                      </a>
                    </>
                  )}
                  {prop.contact.email && (
                    <a href={`mailto:${prop.contact.email}?subject=${encodeURIComponent(`Annonce "${prop.titre}" — Localizi`)}&body=${encodeURIComponent(`Bonjour,\n\nJe suis intéressé(e) par votre annonce "${prop.titre}".\n\nCordialement`)}`}
                      className="ad-cbtn ad-cbtn--mail">
                      <Mail size={15}/> Envoyer un e-mail
                    </a>
                  )}
                </div>
              ) : (
                /* ── NON-ANONYME + NON CONNECTÉ : numéro flouté ── */
                <div className="ad-contact-box__locked">
                  <button
                    className="ad-contact-box__blur-btn"
                    onClick={() => window.location.href = `/login?redirect=/annonce/${prop.id}`}
                    title="Connectez-vous pour voir le numéro"
                  >
                    <Phone size={14}/>
                    <span className="ad-contact-box__blur-num">+216 XX XXX XXX</span>
                    <span className="ad-contact-box__blur-lock">🔒 Voir le numéro</span>
                  </button>
                  <p className="ad-contact-box__lock-msg">
                    Connectez-vous pour accéder aux coordonnées du propriétaire
                  </p>
                  <div className="ad-contact-box__auth-btns">
                    <a href={`/login?redirect=/annonce/${prop.id}`} className="ad-cbtn ad-cbtn--login">
                      Se connecter
                    </a>
                    <a href="/register" className="ad-cbtn ad-cbtn--register">
                      Créer un compte
                    </a>
                  </div>
                </div>
              ) /* fin ternaire anonyme/token */ }
            </div>
          </div>

          <div className="ad-map-mini">
            <MiniMap lat={prop.lat} lng={prop.lng} />
          </div>
        </div>
      </div>

      {/* ── Nearby recommendations ── */}
      {nearby.length > 0 && (
        <div className="ad-nearby">
          <div className="ad-nearby__head">
            <Navigation size={18} className="ad-nearby__ico"/>
            <h2 className="ad-nearby__title">{t("ad_nearby")}</h2>
          </div>
          <div className="ad-nearby__scroll">
            {nearby.map(a => {
              const img = a.image_principale
                ? (a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`)
                : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=75";
              const CAT_COLOR = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
              const CAT_BG    = { vente:"#dcfce7", location:"#dbeafe", vacances:"#fef9c3" };
              const cat = a.categorie || "vente";
              return (
                <div key={a.id} className="ad-ncard" onClick={() => { navigate(`/annonce/${a.id}`); window.scrollTo(0,0); }}>
                  <div className="ad-ncard__img-wrap">
                    <img src={img} alt={a.titre} className="ad-ncard__img" loading="lazy"/>
                    <span className="ad-ncard__cat" style={{ background: CAT_BG[cat], color: CAT_COLOR[cat] }}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </span>
                  </div>
                  <div className="ad-ncard__body">
                    <p className="ad-ncard__price">
                      {Number(a.prix).toLocaleString("fr-TN")}
                      <span> {a.devise}</span>
                    </p>
                    <p className="ad-ncard__titre">{a.titre}</p>
                    <p className="ad-ncard__dist">
                      <MapPin size={10}/>
                      {a._dist < 1 ? `${Math.round(a._dist * 1000)} m` : `${a._dist.toFixed(1)} km`}
                      {a.delegation ? ` · ${a.delegation}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .ad-root { min-height:100vh; background:#f9fafb; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
        .ad-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; gap:16px; color:#94a3b8; font-size:15px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .ad-spin { animation: spin 1s linear infinite; }
        .ad-topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 24px; background:#fff; border-bottom:1px solid #e5e7eb;
          position:sticky; top:64px; z-index:30;
        }
        .ad-back { display:flex; align-items:center; gap:6px; font-size:13px; color:#6b7280; font-family:inherit; transition:color .15s; }
        .ad-back:hover { color:#111; }
        .ad-topbar__actions { display:flex; gap:8px; }
        .ad-action {
          display:flex; align-items:center; gap:6px;
          padding:7px 14px; border:1px solid #e5e7eb;
          border-radius:6px; font-size:13px; color:#6b7280;
          background:#fff; font-family:inherit; cursor:pointer; transition:all .15s; text-decoration:none;
        }
        .ad-action:hover { border-color:#9ca3af; color:#111; }
        .ad-action--liked { color:#6366f1; border-color:#6366f1; background:#eef2ff; }
        .ad-body {
          display:grid; grid-template-columns:1fr 360px; gap:24px;
          max-width:1200px; margin:24px auto; padding:0 24px 48px;
        }
        .ad-gallery { margin-bottom:24px; }
        .ad-gallery__main { position:relative; border-radius:10px; overflow:hidden; background:#e5e7eb; }
        .ad-gallery__img { width:100%; height:440px; object-fit:cover; display:block; animation:fadeIn .2s ease; }
        .ad-gallery__btn {
          position:absolute; top:50%; transform:translateY(-50%);
          width:36px; height:36px; border-radius:50%;
          background:rgba(255,255,255,.9); color:#374151;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.12); transition:background .15s;
        }
        .ad-gallery__btn:hover { background:#fff; }
        .ad-gallery__btn--l { left:12px; }
        .ad-gallery__btn--r { right:12px; }
        .ad-gallery__counter { position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,.45); color:#fff; padding:3px 10px; border-radius:20px; font-size:12px; }
        .ad-gallery__thumbs { display:flex; gap:8px; margin-top:8px; overflow-x:auto; padding-bottom:4px; }
        .ad-gallery__thumb { width:80px; height:60px; object-fit:cover; border-radius:6px; border:2px solid transparent; cursor:pointer; flex-shrink:0; opacity:.65; transition:all .15s; }
        .ad-gallery__thumb--on { border-color:#6366f1; opacity:1; }
        .ad-gallery__thumb:hover { opacity:1; }
        .ad-section { margin-bottom:24px; }
        .ad-section__title { font-size:16px; font-weight:700; color:#111; margin-bottom:12px; }
        .ad-desc { font-size:14px; color:#4b5563; line-height:1.75; }
        .ad-features { display:flex; flex-wrap:wrap; gap:8px; }
        .ad-feature { display:flex; align-items:center; gap:6px; padding:6px 12px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:6px; font-size:13px; color:#374151; }
        .ad-feature svg { color:#6366f1; }
        .ad-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:20px; margin-bottom:16px; }
        .ad-card__cat { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
        .ad-card__cat--vente    { background:#eef2ff; color:#6366f1; }
        .ad-card__cat--location { background:#e6f9f3; color:#00B47D; }
        .ad-card__cat--vacances { background:#fff8e7; color:#9a6700; }
        .ad-card__titre { font-size:18px; font-weight:800; color:#111; line-height:1.3; margin-bottom:6px; }
        /* ─── Bloc adresse hiérarchique ─── */
        .ad-addr { margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; }
        .ad-addr__street {
          display: flex; align-items: flex-start; gap: 5px;
          font-size: 13px; color: #374151; font-weight: 500; line-height: 1.4;
        }
        .ad-addr__ico { color: #6366f1; flex-shrink: 0; margin-top: 1px; }
        .ad-addr__hier {
          display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
        }
        .ad-addr__chip {
          display: inline-flex; align-items: center;
          padding: 3px 9px; border-radius: 20px;
          font-size: 11.5px; font-weight: 600; line-height: 1;
        }
        .ad-addr__chip--loc { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .ad-addr__chip--del { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .ad-addr__chip--gov { background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; }
        .ad-addr__sep { font-size: 13px; color: #d1d5db; font-weight: 400; }
        .ad-card__price { font-size:28px; font-weight:900; color:#111; margin-bottom:16px; }
        .ad-card__price span { font-size:14px; font-weight:400; color:#9ca3af; }
        .ad-specs { display:flex; gap:0; margin-bottom:16px; }
        .ad-spec { flex:1; text-align:center; padding:12px 8px; border:1px solid #e5e7eb; border-radius:8px; margin-right:6px; }
        .ad-spec:last-child { margin-right:0; }
        .ad-spec svg { color:#9ca3af; margin:0 auto 4px; }
        .ad-spec__val { font-size:18px; font-weight:800; color:#111; }
        .ad-spec__lbl { font-size:11px; color:#9ca3af; margin-top:1px; }
        .ad-meta { display:flex; flex-direction:column; gap:7px; margin-bottom:16px; }
        .ad-meta__item { display:flex; align-items:center; gap:7px; font-size:13px; color:#4b5563; }
        .ad-meta__item svg { color:#9ca3af; }
        .ad-meta__item span { font-weight:600; color:#6b7280; }
        .ad-divider { height:1px; background:#f3f4f6; margin:16px 0; }
        /* ── Bloc contact Phase 1 ── */
        .ad-contact-box {
          border: 1.5px solid #e5e7eb; border-radius: 14px;
          overflow: hidden; background: #fff;
        }
        .ad-contact-box__header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }
        .ad-contact-box__avatar {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff; font-size: 18px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .ad-contact-box__name { font-size: 14px; font-weight: 700; color: #0f172a; }
        .ad-contact-box__role { font-size: 11.5px; color: #94a3b8; margin-top: 2px; }

        /* Buttons */
        .ad-contact-box__btns {
          display: flex; flex-direction: column; gap: 8px; padding: 14px 16px;
        }
        .ad-cbtn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 11px 14px; border-radius: 9px;
          font-size: 13.5px; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: all .15s; text-decoration: none;
          border: none; text-align: center;
        }
        .ad-cbtn--call {
          background: #6366f1; color: #fff;
        }
        .ad-cbtn--call:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,.3); }
        .ad-cbtn__tel {
          color: #fff; text-decoration: none; font-weight: 800; font-size: 15px;
        }
        .ad-cbtn--whatsapp {
          background: #25d366; color: #fff;
        }
        .ad-cbtn--whatsapp:hover { background: #1ebe5d; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,211,102,.3); }
        .ad-cbtn--mail {
          background: #fff; color: #374151;
          border: 1.5px solid #d1d5db;
        }
        .ad-cbtn--mail:hover { border-color: #6b7280; background: #f9fafb; }

        /* Views row (owner only) */
        .ad-views-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 12.5px; color: #64748b; font-weight: 600;
          padding: 6px 16px 0;
        }

        /* Locked state */
        .ad-contact-box__locked { padding: 14px 16px; }
        .ad-contact-box__blur-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 11px 14px; margin-bottom: 6px;
          background: #f1f5f9; border: 1.5px dashed #cbd5e1;
          border-radius: 10px; cursor: pointer; text-align: left;
          transition: background .15s, border-color .15s;
          font-family: inherit;
        }
        .ad-contact-box__blur-btn:hover {
          background: #e2e8f0; border-color: #94a3b8;
        }
        .ad-contact-box__blur-num {
          flex: 1; filter: blur(4px); user-select: none; pointer-events: none;
          font-weight: 700; color: #374151; font-size: 14px; letter-spacing: .5px;
        }
        .ad-contact-box__blur-lock {
          font-size: 12px; font-weight: 700; color: #6366f1;
          white-space: nowrap; filter: none;
        }
        .ad-contact-box__lock-msg {
          text-align: center; font-size: 12.5px; color: #64748b;
          font-weight: 500; margin: 8px 0 12px; line-height: 1.5;
        }
        .ad-contact-box__auth-btns {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }
        .ad-cbtn--login {
          background: #0f172a; color: #fff; text-decoration: none;
        }
        .ad-cbtn--login:hover { background: #1e293b; }
        .ad-cbtn--register {
          background: #fff; color: #6366f1;
          border: 1.5px solid #c7d2fe;
        }
        .ad-cbtn--register:hover { background: #eef2ff; }
        .ad-map-mini { border-radius:10px; overflow:hidden; border:1px solid #e5e7eb; height:200px; }
        .ad-not-found { text-align:center; padding:80px 24px; color:#6b7280; font-size:15px; display:flex; flex-direction:column; align-items:center; gap:16px; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @media (max-width:900px) {
          .ad-body { grid-template-columns:1fr; }
          .ad-right { order:-1; }
          .ad-gallery__img { height:280px; }
        }
        @media (max-width:560px) {
          .ad-body { padding:0 12px 32px; margin-top:12px; }
          .ad-topbar { padding:8px 12px; }
          .ad-topbar__actions { gap:4px; }
          .ad-action { padding:6px 10px; font-size:12px; }
        }

        /* ─── Description header + translate ─── */
        .ad-section__header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .ad-section__header .ad-section__title { margin-bottom:0; }
        .ad-translate-btn {
          display:flex; align-items:center; gap:5px;
          padding:6px 12px; border-radius:8px; font-size:12px; font-weight:600;
          border:1.5px solid #e0e7ff; background:#eef2ff; color:#4f46e5;
          cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap;
        }
        .ad-translate-btn:hover:not(:disabled) { background:#e0e7ff; }
        .ad-translate-btn:disabled { opacity:.6; cursor:not-allowed; }
        .ad-translated-note { font-size:11.5px; color:#9ca3af; margin-top:8px; }
        .ad-translated-reset { font-size:11.5px; color:#6366f1; text-decoration:underline; cursor:pointer; background:none; border:none; font-family:inherit; padding:0; }

        /* ─── Nearby recommendations ─── */
        .ad-nearby {
          max-width:1200px; margin:0 auto 48px; padding:0 24px;
        }
        .ad-nearby__head {
          display:flex; align-items:center; gap:10px; margin-bottom:18px;
        }
        .ad-nearby__ico { color:#6366f1; flex-shrink:0; }
        .ad-nearby__title { font-size:18px; font-weight:800; color:#0f172a; letter-spacing:-.02em; }
        .ad-nearby__scroll {
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap:16px;
        }
        .ad-ncard {
          background:#fff; border:1.5px solid #e2e8f0; border-radius:12px;
          overflow:hidden; cursor:pointer;
          transition:box-shadow .18s, border-color .18s, transform .12s;
        }
        .ad-ncard:hover {
          box-shadow:0 8px 24px rgba(0,0,0,.1); border-color:#a5b4fc;
          transform:translateY(-2px);
        }
        .ad-ncard__img-wrap { position:relative; height:160px; overflow:hidden; }
        .ad-ncard__img { width:100%; height:100%; object-fit:cover; transition:transform .25s; }
        .ad-ncard:hover .ad-ncard__img { transform:scale(1.04); }
        .ad-ncard__cat {
          position:absolute; top:8px; right:8px;
          padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700;
        }
        .ad-ncard__body { padding:12px; }
        .ad-ncard__price { font-size:17px; font-weight:800; color:#0f172a; margin-bottom:3px; }
        .ad-ncard__price span { font-size:11px; font-weight:400; color:#94a3b8; }
        .ad-ncard__titre { font-size:13px; color:#334155; margin-bottom:6px; line-height:1.35; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .ad-ncard__dist { display:flex; align-items:center; gap:3px; font-size:11.5px; color:#94a3b8; }
        .ad-ncard__dist svg { color:#6366f1; }

        @media (max-width:900px) {
          .ad-nearby { padding:0 16px; }
          .ad-nearby__scroll { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
        @media (max-width:600px) {
          .ad-nearby__scroll { grid-template-columns: 1fr 1fr; }
          .ad-ncard__img-wrap { height:130px; }
        }
        @media (max-width:420px) {
          .ad-nearby__scroll { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Modal contact anonyme ── */}
      {showContactModal && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:99999,
          display:"flex",alignItems:"center",justifyContent:"center",padding:20,
          fontFamily:"'Inter',system-ui,sans-serif"
        }}>
          <div style={{
            background:"#fff",borderRadius:18,width:"100%",maxWidth:480,
            padding:"32px 28px",boxShadow:"0 24px 80px rgba(0,0,0,.28)"
          }}>
            {contactSent ? (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <h3 style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:8}}>Demande envoyée !</h3>
                <p style={{fontSize:14,color:"#64748b",lineHeight:1.6}}>
                  La personne au {contactForm.telephone ? `numéro ${contactForm.telephone}` : `mail ${contactForm.email}`} souhaite vous contacter pour le bien <strong>"{prop?.titre}"</strong>. Le propriétaire dispose de vos coordonnées pour vous joindre.
                </p>
                <button onClick={() => { setShowContactModal(false); setContactSent(false); }}
                  style={{marginTop:20,padding:"11px 28px",borderRadius:10,border:"none",
                    background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",
                    fontSize:14,fontFamily:"inherit"}}>Fermer</button>
              </div>
            ) : (<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <h3 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Contacter le propriétaire</h3>
                  <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>
                    Le propriétaire vous contactera directement par WhatsApp / téléphone / email selon vos informations ci-dessous.
                  </p>
                </div>
                <button onClick={()=>setShowContactModal(false)}
                  style={{background:"#f1f5f9",border:"none",borderRadius:"50%",
                    width:34,height:34,cursor:"pointer",fontSize:18,color:"#64748b",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>

              {contactError && (
                <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,
                  padding:"10px 14px",fontSize:13,color:"#dc2626",marginBottom:14}}>{contactError}</div>
              )}

              {[
                {key:"nom",       label:"Votre nom *",             type:"text",  placeholder:"Prénom Nom"},
                {key:"telephone", label:"Votre téléphone",         type:"tel",   placeholder:"+216 XX XXX XXX"},
                {key:"email",     label:"Votre email",             type:"email", placeholder:"vous@email.com"},
                {key:"message",   label:"Message (optionnel)",     type:"textarea", placeholder:"Décrivez votre intérêt..."},
              ].map(({key,label,type,placeholder}) => (
                <div key={key} style={{marginBottom:14}}>
                  <label style={{fontSize:12.5,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>{label}</label>
                  {type === "textarea" ? (
                    <textarea placeholder={placeholder}
                      value={contactForm[key]} rows={3}
                      onChange={e => setContactForm(f=>({...f,[key]:e.target.value}))}
                      style={{width:"100%",padding:"10px 13px",border:"1.5px solid #e2e8f0",
                        borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",
                        resize:"vertical",background:"#f8fafc",boxSizing:"border-box"}}/>
                  ) : (
                    <input type={type} placeholder={placeholder}
                      value={contactForm[key]}
                      onChange={e => setContactForm(f=>({...f,[key]:e.target.value}))}
                      style={{width:"100%",padding:"11px 13px",border:"1.5px solid #e2e8f0",
                        borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",
                        background:"#f8fafc",boxSizing:"border-box"}}/>
                  )}
                </div>
              ))}

              <p style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>
                📞 Renseignez au moins votre téléphone ou votre email pour que le propriétaire puisse vous contacter.
              </p>

              <button
                disabled={contactLoading || !contactForm.nom.trim() || (!contactForm.telephone && !contactForm.email)}
                onClick={async () => {
                  setContactLoading(true); setContactError("");
                  try {
                    const res = await fetch(`${API_URL}/annonces/${prop.id}/contact-request`, {
                      method:"POST",
                      headers:{"Content-Type":"application/json"},
                      body:JSON.stringify({
                        nom:       contactForm.nom.trim(),
                        telephone: contactForm.telephone.trim() || null,
                        email:     contactForm.email.trim() || null,
                        message:   contactForm.message.trim() || null,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.detail || "Erreur");
                    setContactSent(true);
                  } catch(err) {
                    setContactError(err.message || "Erreur lors de l'envoi");
                  } finally {
                    setContactLoading(false);
                  }
                }}
                style={{
                  width:"100%",padding:"13px",borderRadius:11,border:"none",
                  background: contactLoading ? "#94a3b8" : "#0f172a",
                  color:"#fff",fontSize:14,fontWeight:700,cursor:contactLoading?"not-allowed":"pointer",
                  fontFamily:"inherit",marginTop:4
                }}
              >
                {contactLoading ? "Envoi en cours…" : "📩 Envoyer ma demande"}
              </button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniMap({ lat, lng }) {
  const ref    = React.useRef(null);
  const mapRef = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !ref.current) return;
      const map = L.map(ref.current, { zoomControl:false, dragging:false, scrollWheelZoom:false }).setView([lat,lng],14);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{attribution:"© OpenStreetMap © CARTO",maxZoom:19}).addTo(map);
      const icon = L.divIcon({ className:"", html:`<div style="width:14px;height:14px;background:#6366f1;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`, iconSize:[14,14], iconAnchor:[7,7] });
      L.marker([lat,lng],{icon}).addTo(map);
      setTimeout(()=>map.invalidateSize(),80);
    })();
    return () => { live=false; if(mapRef.current){mapRef.current.remove();mapRef.current=null;} };
  }, [lat,lng]);
  return <div ref={ref} style={{width:"100%",height:"100%"}} />;
}
