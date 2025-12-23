import React, { useState, useEffect } from "react";
import { Search, Users, Home, Map, Star, TrendingUp, Shield, Clock, CheckCircle, ArrowRight, MapPin, Bed, Bath, Maximize } from "lucide-react";
import Layout from "../components/Layout";
import RecentProperties from "../components/RecentProperties";
import logoconseil from "../assets/conseil2.png";
import femmel from "../assets/femme.png";
import "./css/HomePage.css"; 


const logocon=logoconseil;
const femmelogo=femmel;


const HomePage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (window.scrollY > 300) {
        setStatsVisible(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const propertyTypes = [
    { title: "Appartement", icon: "🏢", count: "250+ annonces", color: "#80a1d4" },
    { title: "Villa", icon: "🏡", count: "180+ annonces", color: "#75c9c8" },
    { title: "Terrain", icon: "🏞️", count: "320+ annonces", color: "#75c9c8" }
  ];

  const services = [
    { icon: <Users size={24} />, title: "Contacter un agent", desc: "Experts à votre écoute", link: "#" },
    { icon: <Home size={24} />, title: "Publier une annonce", desc: "Gratuit et rapide", link: "/creer_annonce" },
    { icon: <Map size={24} />, title: "Consulter les biens", desc: "Plus de 750 propriétés", link: "/recherche_annonce" }
  ];

  const stats = [
    { value: "750+", label: "Propriétés", icon: <Home size={32} /> },
    { value: "500+", label: "Clients satisfaits", icon: <Star size={32} /> },
    { value: "98%", label: "Taux de satisfaction", icon: <TrendingUp size={32} /> },
    { value: "24/7", label: "Support client", icon: <Clock size={32} /> }
  ];

  const features = [
    { icon: <MapPin />, title: "Géolocalisation", desc: "Cartographie interactive des biens immobiliers" },
    { icon: <Shield />, title: "Sécurisé", desc: "Transactions sécurisées et vérifiées" },
    { icon: <Star />, title: "Gratuit", desc: "Jusqu'à 5 annonces gratuites" },
    { icon: <Clock />, title: "Support 24/7", desc: "Réponse rapide à toutes vos questions" }
  ];

  const recentProperties = [
    { id: 1, title: "Villa Moderne à La Marsa", price: "850 000", location: "La Marsa, Tunis", beds: 4, baths: 3, area: 320, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500" },
    { id: 2, title: "Appartement Centre-Ville", price: "320 000", location: "Centre-Ville, Tunis", beds: 3, baths: 2, area: 150, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500" },
    { id: 3, title: "Terrain Résidentiel", price: "180 000", location: "Sousse", beds: null, baths: null, area: 500, image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500" }
  ];

  return (
      <Layout>
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
          <h1 className="hero-title">
            Trouvez Votre <span className="highlight">Propriété Idéale</span>
          </h1>
          <p className="hero-subtitle">
            Appartements • Villas • Terrains à travers toute la Tunisie
          </p>
          
          <div className="search-container">
            <div className="search-box">
              <MapPin className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Entrez une localisation, ville ou gouvernorat..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="search-input"
              />
              <button className="search-button">
                <Search size={20} />
                Rechercher
              </button>
            </div>
          </div>
        </div>
        
        <div className="hero-background"></div>
      </section>

      {/* Services rapides */}
      <section className="services-section">
        <div className="container">
          <div className="services-grid">
            {services.map((service, index) => (
              <a
                key={index}
                href={service.link}
                className="service-card"
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
                style={{
                  transform: activeCard === index ? 'translateY(-10px)' : 'translateY(0)',
                }}
              >
                <div className="service-icon">{service.icon}</div>
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>
                </div>
                <ArrowRight className="service-arrow" size={20} />
              </a>
            ))}
          </div>
        </div>
      </section>

{/* Types de propriétés */}
<section className="property-types-section">
  <div className="container">
    <div className="section-header">
      <h2>Explorez Par Type</h2>
      <p>Découvrez nos différentes catégories de biens immobiliers et trouvez rapidement votre logement idéal</p>
    </div>

    <div className="property-types-wrapper">


      {/* Grid des cartes */}
      <div className="property-types-grid">
        {propertyTypes.map((type, index) => (
          <div
            key={index}
            className="property-type-card"
            style={{
              animationDelay: `${index * 0.2}s`,
              borderTop: `4px solid ${type.color}`,
            }}
          >
            <div className="property-type-icon">{type.icon}</div>
            <h3>{type.title}</h3>
            <p className="property-count">{type.count}</p>
            <a href="/recherche_annonce" className="explore-link">
              Explorer <ArrowRight size={16} />
            </a>
          </div>
        ))}
      </div>
            {/* Image d'une femme qui montre les types */}
      <div className="property-types-image">
        <img src={femmelogo} alt="Présentation des types" />
      </div>
    </div>
  </div>
</section>


      {/* Statistiques */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`stat-card ${statsVisible ? 'visible' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Propriétés récentes */}
         <RecentProperties properties={recentProperties} />




      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à Trouver Votre Prochaine Propriété ?</h2>
            <p>Rejoignez des milliers de Tunisiens qui ont trouvé leur maison idéale</p>
            <div className="cta-buttons">
              <a href="/recherche_annonce" className="cta-button primary">
                Parcourir les annonces
              </a>
              <a href="/creer_annonce" className="cta-button secondary">
                Publier une annonce
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* Avantages */}
      <section className="features-section">
        <div className="container">
          <div className="features-content">
            <div className="features-text">
              <h2>Pourquoi Choisir <span className="highlight">Xpertise Immo</span> ?</h2>
              <p className="features-intro">
                Nous offrons une plateforme complète et gratuite pour tous vos besoins immobiliers
              </p>
              
              <div className="features-list">
                {features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-icon">{feature.icon}</div>
                    <div>
                      <h4>{feature.title}</h4>
                      <p>{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="extra-features">
                <div className="extra-feature">
                  <CheckCircle size={20} className="check-icon" />
                  <span>Visualisation cartographique des biens</span>
                </div>
                <div className="extra-feature">
                  <CheckCircle size={20} className="check-icon" />
                  <span>Écoles et hôpitaux à proximité</span>
                </div>
                <div className="extra-feature">
                  <CheckCircle size={20} className="check-icon" />
                  <span>Recherche personnalisée avancée</span>
                </div>
                <div className="extra-feature">
                  <CheckCircle size={20} className="check-icon" />
                  <span>Filtrage selon le profil des vendeurs</span>
                </div>
              </div>
            </div>
            <div className="features-image">
                 {/* L'image de l'homme */}
              <img 
                src={logocon}
                alt="Conseil immobilier" 
                className="advising-image"
              />
              <div className="floating-card card-1">
                <Home size={32} />
                <span>5 Annonces Gratuites</span>
              </div>
              <div className="floating-card card-2">
                <Shield size={32} />
                <span>100% Sécurisé</span>
              </div>
              <div className="floating-card card-3">
                <Star size={32} />
                <span>Service Premium</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </Layout>
  );
};

export default HomePage;