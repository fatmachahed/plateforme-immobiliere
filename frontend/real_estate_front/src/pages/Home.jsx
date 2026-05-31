import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, MapPin, Home, TrendingUp, Shield, Clock, Star,
  ArrowRight, Bed, Bath, Maximize, Zap, CheckCircle,
  Building2, Trees, ChevronRight, Play
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ── Static demo data (remplace par API calls) ── */
const RECENT_PROPS = [
  {
    id: 1, titre: "Villa Moderne Prestige", prix: "850 000", devise: "TND",
    location: "La Marsa, Tunis", beds: 4, baths: 3, area: 320,
    type: "villa", categorie: "Vente", boost: 3,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    lat: 36.879, lng: 10.325,
  },
  {
    id: 2, titre: "Appartement S+3 Neuf", prix: "320 000", devise: "TND",
    location: "Les Berges du Lac, Tunis", beds: 3, baths: 2, area: 145,
    type: "appartement", categorie: "Vente", boost: 2,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    lat: 36.838, lng: 10.235,
  },
  {
    id: 3, titre: "Terrain Résidentiel Viabilisé", prix: "180 000", devise: "TND",
    location: "Sousse Nord", beds: null, baths: null, area: 500,
    type: "terrain", categorie: "Vente", boost: 0,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    lat: 35.870, lng: 10.590,
  },
  {
    id: 4, titre: "Appartement Meublé Vue Mer", prix: "1 800", devise: "TND/mois",
    location: "Hammamet", beds: 2, baths: 1, area: 85,
    type: "appartement", categorie: "Location", boost: 2,
    image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80",
    lat: 36.400, lng: 10.620,
  },
  {
    id: 5, titre: "Villa avec Piscine", prix: "3 500", devise: "TND/sem.",
    location: "Djerba", beds: 5, baths: 3, area: 280,
    type: "villa", categorie: "Vacances", boost: 3,
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80",
    lat: 33.830, lng: 10.870,
  },
  {
    id: 6, titre: "Bureau Open Space Moderne", prix: "2 500", devise: "TND/mois",
    location: "Centre Urbain Nord, Tunis", beds: null, baths: 2, area: 220,
    type: "bureau", categorie: "Location", boost: 1,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    lat: 36.855, lng: 10.194,
  },
];

/* ── Mini-carte Leaflet centrée sur la Tunisie ── */
function HomeTunisiaMap({ props: annonces }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      /* Cadrage automatique sur la Tunisie */
      map.fitBounds([[30.2, 7.5], [37.5, 11.6]], { padding: [18, 18] });

      annonces.forEach(p => {
        if (!p.lat || !p.lng) return;

        /* Couleur selon niveau de boost */
        const color =
          p.boost >= 3 ? "#ea580c" :
          p.boost >= 2 ? "#f59e0b" :
          p.boost >= 1 ? "#6366f1" : "#64748b";

        const prefix = p.boost >= 3 ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z"/></svg>` : "";

        const html = `
          <div style="
            background:${color}; color:#fff;
            font-size:11px; font-weight:800; letter-spacing:-.2px;
            padding:5px 11px; border-radius:20px;
            box-shadow:0 3px 10px rgba(0,0,0,.28);
            white-space:nowrap; display:inline-flex; align-items:center; gap:4px;
            font-family:'Plus Jakarta Sans',system-ui,sans-serif;
            border:2px solid rgba(255,255,255,.35);
          ">${prefix}${p.prix}<span style="font-size:9px;opacity:.8;margin-left:1px">${p.devise.replace("/mois","").replace("/sem.","")}</span></div>`;

        const icon = L.divIcon({ className: "", html, iconSize: null, iconAnchor: [0, 0] });
        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${p.titre}</b><br>${p.location}`, { closeButton: false });
      });
    })();
    return () => { live = false; };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Badge pays */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 1000,
        background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
        padding: "5px 12px", borderRadius: 20,
        fontSize: 12, fontWeight: 700, color: "#0f172a",
        boxShadow: "0 2px 10px rgba(0,0,0,.12)",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        📍 Tunisie
      </div>
      <div ref={containerRef} style={{
        height: 310, width: "100%",
        borderRadius: 16, overflow: "hidden",
      }}/>
    </div>
  );
}

const STATS = [
  { value: "12 500+", label: "Annonces actives",   icon: <Home size={28} /> },
  { value: "8 200+",  label: "Clients satisfaits",  icon: <Star size={28} /> },
  { value: "98%",     label: "Taux de satisfaction", icon: <TrendingUp size={28} /> },
  { value: "24/7",    label: "Support disponible",   icon: <Clock size={28} /> },
];

const TYPES = [
  { label: "Appartement", icon: <Building2 size={32} />, count: "4 800+", href: "/carte?type=appartement", color: "#6366f1" },
  { label: "Villa",       icon: <Home size={32} />,      count: "2 100+", href: "/carte?type=villa",        color: "#00B47D" },
  { label: "Terrain",     icon: <Trees size={32} />,     count: "3 200+", href: "/carte?type=terrain",      color: "#F5A623" },
  { label: "Bureau",      icon: <Building2 size={32} />, count: "1 400+", href: "/carte?type=bureau",       color: "#FF6B35" },
];

const FEATURES = [
  { icon: <MapPin size={20} />,    title: "Carte interactive",        desc: "Visualisez tous les biens sur une carte en temps réel avec zoom et sélection de zones." },
  { icon: <Zap size={20} />,       title: "Publication rapide",       desc: "Créez et publiez votre annonce en quelques minutes et touchez des milliers d'acheteurs." },
  { icon: <Shield size={20} />,    title: "Sécurisé & vérifié",       desc: "Chaque annonce est vérifiée par notre équipe pour garantir la fiabilité des offres." },
  { icon: <TrendingUp size={20} />,title: "Statistiques en temps réel",desc: "Suivez vos vues, contacts et performances d'annonces depuis votre tableau de bord." },
];

/* ── Gouvernorat cards data  (nom = valeur exacte en base) ── */
const GOV_CARDS = [
  { nom:"TUNIS",       display:"Tunis",       img:"https://upload.wikimedia.org/wikipedia/commons/9/98/Tour_de_l%27Horloge_du_centre-ville_de_Tunis_03.jpg",           color:"#1e40af" },
  { nom:"ARIANA",      display:"Ariana",      img:"https://kapitalis.com/tunisie/wp-content/uploads/2021/05/08-2-1024x768-1.jpg",                                      color:"#0e7490" },
  { nom:"BEN AROUS",   display:"Ben Arous",   img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75",                                         color:"#4338ca" },
  { nom:"MANOUBA",     display:"Manouba",     img:"https://images.unsplash.com/photo-1549925245-f20a1bac5222?w=600&q=75",                                         color:"#166534" },
  { nom:"NABEUL",      display:"Nabeul",      img:"https://www.climamed.eu/wp-content/uploads/2021/02/nabeul-1024x688.jpg",                                       color:"#0369a1" },
  { nom:"ZAGHOUAN",    display:"Zaghouan",    img:"https://www.tunisieindustrie.nat.tn/fr/images/mono/zaghouan1.jpg",                                              color:"#4d7c0f" },
  { nom:"BIZERTE",     display:"Bizerte",     img:"https://media.istockphoto.com/id/1367865863/fr/photo/bizerte-tunisie-afrique-du-nord-bateaux-de-p%C3%AAche-accostent-au-bord-de-leau-ville-portuaire.jpg?s=612x612&w=0&k=20&c=GMbVO13CE35Jv8Mc_2PlCUHKC3ikTetXRWPC0V3PWM8=", color:"#0369a1" },
  { nom:"BEJA",        display:"Béja",        img:"https://www.shutterstock.com/image-photo/beja-tunisia-april-07-2023-260nw-2272834149.jpg",                                      color:"#166534" },
  { nom:"JENDOUBA",    display:"Jendouba",    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Bulla_Regia_-_temple_d%27Apollon.jpg/640px-Bulla_Regia_-_temple_d%27Apollon.jpg", color:"#92400e" },
  { nom:"KEF",         display:"Le Kef",      img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Le_Kef_-_Kasbah.jpg/640px-Le_Kef_-_Kasbah.jpg",    color:"#7c3aed" },
  { nom:"SILIANA",     display:"Siliana",     img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75",                                      color:"#14532d" },
  { nom:"SOUSSE",      display:"Sousse",      img:"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=75",                                      color:"#0c4a6e" },
  { nom:"MONASTIR",    display:"Monastir",    img:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=75",                                         color:"#1e40af" },
  { nom:"MAHDIA",      display:"Mahdia",      img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Mahdia-TN.jpg/640px-Mahdia-TN.jpg",                  color:"#0e7490" },
  { nom:"SFAX",        display:"Sfax",        img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Sfax_medina.jpg/640px-Sfax_medina.jpg",             color:"#92400e" },
  { nom:"KAIROUAN",    display:"Kairouan",    img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAUYc78FbsLdPCPI50CRDdRj_-liiGYo6i0Q&s", color:"#9a3412" },
  { nom:"KASSERINE",   display:"Kasserine",   img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Sbeitla_theatre.jpg/640px-Sbeitla_theatre.jpg",      color:"#78350f" },
  { nom:"SIDI BOUZID", display:"Sidi Bouzid", img:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75",                                      color:"#166534" },
  { nom:"GABES",       display:"Gabès",       img:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Gabes_oasis.jpg/640px-Gabes_oasis.jpg",             color:"#14532d" },
  { nom:"MEDENINE",    display:"Médenine",    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Centre_ville_de_Medenine.JPG/1280px-Centre_ville_de_Medenine.JPG",           color:"#92400e" },
  { nom:"TATAOUINE",   display:"Tataouine",   img:"https://www.les-covoyageurs.com/ressources/images-lieux/photo-lieu-1540-3.jpg", color:"#78350f" },
  { nom:"GAFSA",       display:"Gafsa",       img:"https://lapressetn.b-cdn.net/wp-content/uploads/2026/01/gafsa-sned-770x470.jpg",             color:"#9a3412" },
  { nom:"TOZEUR",      display:"Tozeur",      img:"https://media.routard.com/image/95/3/pt82944.1291953.w1000.jpg",           color:"#b45309" },
  { nom:"KEBILI",      display:"Kébili",      img:"https://cdn.nawaat.org/wp-content/uploads/2012/01/rond-point_kebili.jpg",                                         color:"#92400e" },
];

/* ── Property card ── */
function PropCard({ p, delay = 0 }) {
  return (
    <Link to={`/annonce/${p.id}`} className="hp-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="hp-card__img-wrap">
        <img src={p.image} alt={p.titre} loading="lazy" />
        <span className={`hp-card__cat hp-card__cat--${p.categorie.toLowerCase()}`}>{p.categorie}</span>
      </div>
      <div className="hp-card__body">
        <p className="hp-card__title">{p.titre}</p>
        <p className="hp-card__location"><MapPin size={13} /> {p.location}</p>
        {(p.beds !== null || p.area) && (
          <div className="hp-card__specs">
            {p.beds  !== null && <span><Bed size={13} /> {p.beds}</span>}
            {p.baths !== null && <span><Bath size={13} /> {p.baths}</span>}
            {p.area  && <span><Maximize size={13} /> {p.area} m²</span>}
          </div>
        )}
        <div className="hp-card__footer">
          <span className="hp-card__price">{p.prix} <span className="hp-card__devise">{p.devise}</span></span>
          <span className="hp-card__cta">Voir <ArrowRight size={13} /></span>
        </div>
      </div>
    </Link>
  );
}

/* ── Gouvernorat Card ── */
function GovCard({ gov }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);

  return (
    <div
      className="hp-gov-card"
      style={{ "--gov-color": gov.color }}
      onClick={() => navigate(`/carte?gouvernorat=${encodeURIComponent(gov.nom)}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && navigate(`/carte?gouvernorat=${encodeURIComponent(gov.nom)}`)}
    >
      {!err ? (
        <img
          src={gov.img}
          alt={gov.nom}
          loading="lazy"
          onError={() => setErr(true)}
          className="hp-gov-card__img"
        />
      ) : (
        <div className="hp-gov-card__fallback" style={{ background: gov.color }} />
      )}
      <div className="hp-gov-card__overlay" />
      <div className="hp-gov-card__content">
        <span className="hp-gov-card__name">{gov.display || gov.nom}</span>
        <span className="hp-gov-card__cta">Explorer <ArrowRight size={12}/></span>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function HomePage() {
  const [activeTab,  setActiveTab]  = useState("vente");
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) window.location.href = `/carte?q=${encodeURIComponent(query)}&categorie=${activeTab}`;
    else window.location.href = `/carte?categorie=${activeTab}`;
  };

  return (
    <div className="hp">
      <Navbar />

      {/* ── HERO ── */}
      <section className="hp-hero">
        <div className="hp-hero__bg" />
        <div className="hp-hero__overlay" />
        <div className="hp-hero__content animate-fadeInUp">
          <h1 className="hp-hero__title">
            Trouvez votre<br />
            <span className="hp-hero__highlight">propriété idéale</span>
          </h1>
          <p className="hp-hero__sub">
            Appartements · Villas · Terrains · Bureaux à travers toute la Tunisie
          </p>

          {/* Search box */}
          <div className="hp-search">
            <div className="hp-search__tabs">
              {[
                { val:"vente",    lbl:"Achat"    },
                { val:"location", lbl:"Location" },
                { val:"vacances", lbl:"Vacances" },
              ].map(({ val, lbl }) => (
                <button
                  key={val}
                  onClick={() => setActiveTab(val)}
                  className={`hp-search__tab${activeTab === val ? " hp-search__tab--active" : ""}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <form className="hp-search__box" onSubmit={handleSearch}>
              <MapPin size={18} className="hp-search__pin" />
              <input
                type="text"
                placeholder="Ville, gouvernorat, quartier…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="hp-search__input"
              />
              <button type="submit" className="hp-search__btn">
                <Search size={18} /> Rechercher
              </button>
            </form>
            <div className="hp-search__hint">
              <span>Populaire :</span>
              {["Tunis", "Sousse", "Sfax", "La Marsa", "Nabeul"].map((c) => (
                <Link key={c} to={`/carte?q=${c}`} className="hp-search__tag">{c}</Link>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ── TYPES ── */}
      <section className="hp-types section-sm">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Catégories</span>
            <h2>Explorer par type de bien</h2>
          </div>
          <div className="hp-types__grid">
            {TYPES.map((t, i) => (
              <Link to={t.href} key={t.label} className="hp-type-card" style={{ "--acc": t.color, animationDelay: `${i * 80}ms` }}>
                <div className="hp-type-card__icon">{t.icon}</div>
                <h3 className="hp-type-card__label">{t.label}</h3>
                <p className="hp-type-card__count">{t.count} annonces</p>
                <span className="hp-type-card__link">Explorer <ChevronRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT PROPERTIES ── */}
      <section className="hp-recent section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">En vedette</span>
            <h2>Annonces récentes</h2>
            <p>Découvrez les dernières annonces publiées</p>
          </div>

          <div className="hp-recent__grid">
            {RECENT_PROPS.map((p, i) => <PropCard key={p.id} p={p} delay={i * 60} />)}
          </div>

          <div className="text-center mt-24">
            <Link to="/carte" className="btn btn-outline btn-lg btn-round">
              Voir toutes les annonces <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── GOUVERNORATS ── */}
      <section className="hp-gov section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">🇹🇳 Explorer la Tunisie</span>
            <h2>Cherchez par gouvernorat</h2>
            <p>Cliquez sur un gouvernorat pour voir toutes ses annonces immobilières</p>
          </div>
          <div className="hp-gov__grid">
            {GOV_CARDS.map(gov => <GovCard key={gov.nom} gov={gov} />)}
          </div>
        </div>
      </section>

      {/* ── MAP CTA ── */}
      <section className="hp-map-cta section">
        <div className="container">
          <div className="hp-map-cta__inner">
            <div className="hp-map-cta__text">
              <span className="section-eyebrow">Carte interactive</span>
              <h2>Explorez les biens sur la carte</h2>
              <p>
                Visualisez toutes les annonces géolocalisées, zoomez sur votre quartier,
                dessinez une zone de recherche et consultez les offres en temps réel.
              </p>
              <ul className="hp-map-cta__checks">
                {["Punaises avec prix visible sur la carte","Filtres : type, prix, superficie","Sélection de zone libre à la main","Navigation par gouvernorat"].map((c) => (
                  <li key={c}><CheckCircle size={16} style={{ color: "var(--success)" }} />{c}</li>
                ))}
              </ul>
              <div className="flex gap-12 mt-24">
                <Link to="/carte" className="btn btn-primary btn-lg">
                  <MapPin size={18} /> Ouvrir la carte
                </Link>
                <Link to="/carte?vue=liste" className="btn btn-ghost btn-lg">
                  Vue liste
                </Link>
              </div>
            </div>
            <div className="hp-map-cta__visual">
              <HomeTunisiaMap props={RECENT_PROPS} />
              {/* Légende flottante */}
              <div className="hp-map-cta__legend">
                <span className="hp-map-cta__leg-item hp-map-cta__leg-item--std">Vente</span>
                <span className="hp-map-cta__leg-item hp-map-cta__leg-item--loc">Location</span>
                <span className="hp-map-cta__leg-item hp-map-cta__leg-item--vac">Vacances</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="hp-features section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Pourquoi Localizi ?</span>
            <h2>La plateforme immobilière la plus avancée</h2>
          </div>
          <div className="hp-features__grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="hp-feature" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="hp-feature__icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .hp { background: var(--bg); }

        /* ── HERO ── */
        .hp-hero {
          position: relative; min-height: 92vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .hp-hero__bg {
          position: absolute; inset: 0;
          background: url("https://www.guidesulysse.com/images/destinations/iStock-498116298.jpg") center/cover no-repeat;
        }
        .hp-hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10, 22, 40, 0.65) 0%,
            rgba(10, 22, 40, 0.45) 40%,
            rgba(10, 22, 40, 0.75) 100%
          );
        }
        .hp-hero__content {
          position: relative; z-index: 2;
          text-align: center; padding: 40px 24px 80px;
          max-width: 840px; margin: 0 auto;
        }
        .hp-hero__title {
          color: white; font-size: clamp(36px, 5.5vw, 68px); font-weight: 900;
          line-height: 1.1; margin: 10px 0 18px;
        }
        .hp-hero__highlight {
          background: linear-gradient(90deg, #a5b4fc, #c7d2fe);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hp-hero__sub { color: rgba(255,255,255,.7); font-size: 18px; margin-bottom: 36px; }

        /* Search box */
        .hp-search { max-width: 680px; margin: 0 auto; }
        .hp-search__tabs { display: flex; gap: 4px; margin-bottom: 0; }
        .hp-search__tab {
          padding: 10px 20px; border-radius: 10px 10px 0 0;
          font-size: 14px; font-weight: 600;
          background: rgba(255,255,255,.12); color: rgba(255,255,255,.7);
          transition: all .15s;
        }
        .hp-search__tab--active,
        .hp-search__tab:hover { background: white; color: var(--primary); }
        .hp-search__box {
          display: flex; align-items: center;
          background: white; border-radius: 0 12px 12px 12px;
          padding: 8px 8px 8px 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,.4);
        }
        .hp-search__pin { color: var(--primary); margin-right: 12px; flex-shrink: 0; }
        .hp-search__input {
          flex: 1; border: none; outline: none;
          font-size: 16px; font-family: inherit; color: var(--text-primary);
        }
        .hp-search__input::placeholder { color: var(--text-muted); }
        .hp-search__btn {
          display: flex; align-items: center; gap: 8px;
          background: var(--primary); color: white;
          padding: 13px 28px; border-radius: 8px;
          font-size: 15px; font-weight: 700;
          transition: all .15s;
        }
        .hp-search__btn:hover { background: var(--primary-dark); }
        .hp-search__hint {
          display: flex; align-items: center; gap: 10px;
          margin-top: 16px; flex-wrap: wrap;
        }
        .hp-search__hint span { color: rgba(255,255,255,.5); font-size: 13px; }
        .hp-search__tag {
          padding: 5px 12px; background: rgba(255,255,255,.12);
          color: rgba(255,255,255,.8); border-radius: var(--r-full);
          font-size: 13px; transition: all .15s;
        }
        .hp-search__tag:hover { background: rgba(255,255,255,.25); color: white; }

        /* Floating cards */
        .hp-hero__floats { position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 840px; pointer-events: none; }
        .hp-hero__float {
          position: absolute; display: flex; align-items: center; gap: 10px;
          background: white; border-radius: var(--r-md); padding: 12px 18px;
          box-shadow: var(--shadow-md);
        }
        .hp-hero__float--1 { left: 0; bottom: 0; }
        .hp-hero__float--2 { right: 0; bottom: 20px; }
        .hp-hero__float-num   { font-weight: 800; font-size: 16px; color: var(--text-primary); }
        .hp-hero__float-label { font-size: 12px; color: var(--text-muted); }

        /* ── TYPES ── */
        .hp-types__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .hp-type-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); padding: 32px 24px;
          text-align: center; transition: all .2s;
          border-top: 3px solid var(--acc);
          animation: fadeInUp .5s ease both;
        }
        .hp-type-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); }
        .hp-type-card__icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--primary-light); color: var(--acc);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .hp-type-card__label { font-size: 18px; font-weight: 700; color: var(--text-primary); }
        .hp-type-card__count { font-size: 13px; color: var(--text-muted); margin: 4px 0 14px; }
        .hp-type-card__link {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 13px; font-weight: 600; color: var(--acc);
        }

        /* ── PROPERTY CARDS ── */
        .hp-recent__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 8px;
        }
        .hp-legend { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
        .hp-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: var(--r-full);
          font-size: 11px; font-weight: 700; letter-spacing: .5px;
        }
        .hp-badge--boost    { background: var(--boost-light);   color: var(--boost); }
        .hp-badge--premium  { background: var(--gold-light);    color: #9a6700; }
        .hp-badge--standard { background: var(--primary-light); color: var(--primary); }

        .hp-card {
          background: var(--surface); border-radius: var(--r-lg);
          border: 1px solid var(--border); overflow: hidden;
          transition: all .22s; animation: fadeInUp .5s ease both;
          display: block;
        }
        .hp-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
        .hp-card--boost   { border-color: var(--boost);  box-shadow: 0 0 0 1px var(--boost); }
        .hp-card--premium { border-color: var(--gold);   box-shadow: 0 0 0 1px var(--gold); }
        .hp-card__img-wrap { position: relative; height: 210px; overflow: hidden; }
        .hp-card__img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
        .hp-card:hover .hp-card__img-wrap img { transform: scale(1.05); }
        .hp-card__cat {
          position: absolute; top: 12px; left: 12px;
          padding: 4px 11px; border-radius: var(--r-full);
          font-size: 11px; font-weight: 700;
        }
        .hp-card__cat--vente    { background: var(--primary); color: white; }
        .hp-card__cat--location { background: var(--success); color: white; }
        .hp-card__cat--vacances { background: var(--gold);    color: white; }
        .hp-card .hp-badge { position: absolute; top: 12px; right: 12px; }
        .hp-card__body { padding: 18px; }
        .hp-card__title { font-weight: 700; font-size: 16px; color: var(--text-primary); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hp-card__location { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
        .hp-card__specs { display: flex; gap: 14px; margin-bottom: 14px; }
        .hp-card__specs span { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-secondary); }
        .hp-card__footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-light); }
        .hp-card__price { font-size: 20px; font-weight: 800; color: var(--text-primary); }
        .hp-card__devise { font-size: 12px; font-weight: 500; color: var(--text-muted); }
        .hp-card__cta { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--primary); }

        /* ── STATS ── */
        .hp-stats {
          padding: 80px 0;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: white;
        }
        .hp-stats__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        .hp-stat { text-align: center; opacity: 0; transform: translateY(20px); transition: opacity .5s, transform .5s; }
        .hp-stat--visible { opacity: 1; transform: translateY(0); }
        .hp-stat__icon { margin-bottom: 14px; opacity: .7; color: white; }
        .hp-stat__val   { font-size: 44px; font-weight: 900; color: white; }
        .hp-stat__label { font-size: 14px; opacity: .8; margin-top: 4px; color: white; }

        /* ── MAP CTA ── */
        .hp-map-cta__inner {
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
        }
        .hp-map-cta__text h2 { margin-bottom: 16px; }
        .hp-map-cta__text p  { margin-bottom: 12px; }
        .hp-map-cta__checks  { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
        .hp-map-cta__checks li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-secondary); }
        .hp-map-cta__visual {
          position: relative;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 8px 36px rgba(0,0,0,.13);
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        /* Légende flottante sur la carte */
        .hp-map-cta__legend {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px; z-index: 1000;
          background: rgba(255,255,255,.92); backdrop-filter: blur(8px);
          padding: 6px 12px; border-radius: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,.12);
        }
        .hp-map-cta__leg-item {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; padding: 3px 9px;
          border-radius: 12px; white-space: nowrap;
        }
        .hp-map-cta__leg-item--std     { background: #4f46e5; color: #fff; }
        .hp-map-cta__leg-item--loc     { background: #16a34a; color: #fff; }
        .hp-map-cta__leg-item--vac     { background: #f59e0b; color: #fff; }

        /* ── FEATURES ── */
        .hp-features__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .hp-feature {
          background: var(--surface); border-radius: var(--r-lg);
          padding: 28px 24px; border: 1px solid var(--border);
          transition: all .2s; animation: fadeInUp .5s ease both;
        }
        .hp-feature:hover { transform: translateY(-4px); box-shadow: var(--shadow-sm); }
        .hp-feature__icon {
          width: 48px; height: 48px; border-radius: var(--r-md);
          background: var(--primary-light); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .hp-feature h4 { margin-bottom: 8px; }
        .hp-feature p  { font-size: 14px; }

        /* ── BOOST CTA ── */
        .hp-boost-cta {
          background: linear-gradient(135deg, #0f172a, #1e293b);
        }
        .hp-boost-cta h2 { font-size: clamp(24px, 3vw, 38px); }

        /* ── GOUVERNORATS ── */
        .hp-gov { background: var(--bg); }
        .hp-gov__grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .hp-gov-card {
          position: relative; border-radius: 14px; overflow: hidden;
          aspect-ratio: 3/4; cursor: pointer;
          background: var(--gov-color, #334155);
          transition: transform .25s, box-shadow .25s;
          outline: none;
        }
        .hp-gov-card:hover,
        .hp-gov-card:focus-visible { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(0,0,0,.25); }
        .hp-gov-card__img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform .4s;
        }
        .hp-gov-card:hover .hp-gov-card__img { transform: scale(1.08); }
        .hp-gov-card__fallback { width: 100%; height: 100%; }
        .hp-gov-card__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 50%, transparent 100%);
          transition: background .3s;
        }
        .hp-gov-card:hover .hp-gov-card__overlay {
          background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 60%, rgba(0,0,0,.1) 100%);
        }
        .hp-gov-card__content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 14px 12px 12px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .hp-gov-card__name {
          font-size: 14px; font-weight: 800; color: white;
          line-height: 1.2; letter-spacing: -.01em;
          text-shadow: 0 1px 4px rgba(0,0,0,.5);
        }
        .hp-gov-card__cta {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; color: rgba(255,255,255,.7);
          opacity: 0; transform: translateY(4px);
          transition: opacity .2s, transform .2s;
        }
        .hp-gov-card:hover .hp-gov-card__cta { opacity: 1; transform: translateY(0); }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .hp-types__grid   { grid-template-columns: repeat(2, 1fr); }
          .hp-recent__grid  { grid-template-columns: repeat(2, 1fr); }
          .hp-features__grid{ grid-template-columns: repeat(2, 1fr); }
          .hp-stats__grid   { grid-template-columns: repeat(2, 1fr); }
          .hp-map-cta__inner{ grid-template-columns: 1fr; gap: 36px; }
          .hp-gov__grid     { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 700px) {
          .hp-hero { min-height: 100vh; }
          .hp-search__box { flex-direction: column; padding: 12px; gap: 8px; border-radius: 0 12px 12px 12px; }
          .hp-search__btn { width: 100%; justify-content: center; }
          .hp-hero__floats { display: none; }
          .hp-recent__grid { grid-template-columns: 1fr; }
          .hp-types__grid  { grid-template-columns: 1fr 1fr; }
          .hp-features__grid { grid-template-columns: 1fr; }
          .hp-stats__grid { grid-template-columns: 1fr 1fr; gap: 20px; }
          .hp-stat__val { font-size: 32px; }
          .hp-gov__grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
        }
        @media (max-width: 420px) {
          .hp-types__grid { grid-template-columns: 1fr; }
          .hp-stats__grid { grid-template-columns: 1fr; }
          .hp-gov__grid   { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
