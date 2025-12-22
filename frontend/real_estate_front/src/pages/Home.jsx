import React, { useState, useEffect } from "react";
import { Search, Users, Home, Map, Star, TrendingUp, Shield, Clock, CheckCircle, ArrowRight, MapPin, Bed, Bath, Maximize } from "lucide-react";
import Layout from "../components/Layout";
import logoconseil from "../assets/conseil2.png";
import femmel from "../assets/femme.png";

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
      <section className="recent-properties-section">
        <div className="container">
          <div className="section-header">
            <h2>Propriétés Récentes</h2>
            <p>Découvrez nos dernières annonces</p>
          </div>
          
          <div className="properties-grid">
            {recentProperties.map((property) => (
              <div key={property.id} className="property-card">
                <div className="property-image">
                  <img src={property.image} alt={property.title} />
                  <div className="property-badge">Nouveau</div>
                </div>
                <div className="property-details">
                  <h3>{property.title}</h3>
                  <p className="property-location">
                    <MapPin size={16} /> {property.location}
                  </p>
                  <div className="property-features">
                    {property.beds && (
                      <span><Bed size={16} /> {property.beds} chambres</span>
                    )}
                    {property.baths && (
                      <span><Bath size={16} /> {property.baths} SDB</span>
                    )}
                    <span><Maximize size={16} /> {property.area}m²</span>
                  </div>
                  <div className="property-footer">
                    <div className="property-price">{property.price} TND</div>
                    <button className="view-button">Voir détails</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="view-all-container">
            <a href="/recherche_annonce" className="view-all-button">
              Voir toutes les propriétés <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>




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



      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .home-container {
          width: 100%;
          overflow-x: hidden;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          height: 700px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #75c9c8 0%, #80a1d4 50%, #75c9c8 100%);
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%2375c9c8" fill-opacity="0.05" width="1200" height="600"/><g fill-opacity="0.1"><polygon fill="%2375c9c8" points="1200 0 800 600 1200 600"/><polygon fill="%2375c9c8" points="0 600 400 0 0 0"/></g></svg>');

          opacity: 0.3;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          color: white;
          max-width: 900px;
          padding: 0 20px;
        }

        .hero-title {
          font-size: 64px;
          font-weight: 800;
          margin-bottom: 20px;
          line-height: 1.2;
          animation: fadeInUp 1s ease;
          color:white;
        }

        .highlight {
          color: #75c9c8;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
        }

        .hero-subtitle {
          font-size: 24px;
          margin-bottom: 40px;
          opacity: 0.95;
          animation: fadeInUp 1s ease 0.2s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-container {
          animation: fadeInUp 1s ease 0.4s both;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 50px;
          padding: 8px 8px 8px 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 700px;
          margin: 0 auto;
          transition: transform 0.3s;
        }

        .search-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
        }

        .search-icon {
          color: #75c9c8;
          margin-right: 12px;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: #333;
          background:transparent;
        }

        .search-input::placeholder {
          color: #999;
        }

        .search-button {
          background: linear-gradient(135deg, #80a1d4, #75c9c8);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }

        .search-button:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
        }

        /* Services Section */
        .services-section {
          padding: 80px 0;
          background: #f8f9fa;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .service-card {
          background: white;
          padding: 40px 30px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
          text-decoration: none;
          color: #333;
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent,rgba(117,201,200,0.1), transparent);
          transition: left 0.5s;
        }

        .service-card:hover::before {
          left: 100%;
        }

        .service-card:hover {
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
        }

        .service-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #80a1d4, #75c9c8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .service-content h3 {
          font-size: 18px;
          margin-bottom: 5px;
          color: #75c9c8;
        }

        .service-content p {
          font-size: 14px;
          color: #666;
        }

        .service-arrow {
          margin-left: auto;
          color: #75c9c8;
          transition: transform 0.3s;
        }

        .service-card:hover .service-arrow {
          transform: translateX(5px);
        }

        /* Section Header */
        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-header h2 {
          font-size: 42px;
          color: #333;
          margin-bottom: 15px;
        }

        .section-header p {
          font-size: 18px;
          color: #666;
        }

        /* Property Types */
        .property-types-section {
          padding: 100px 0;
        }

        .property-types-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          margin-left:80px;
        }

        .property-type-card {
          background: #f8f9fa;
          padding: 50px 30px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
          transition: all 0.4s;
          animation: fadeInUp 0.6s ease both;
        }

        .property-type-card:hover {
          transform: translateY(-15px);
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
        }

        .property-type-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }

        .property-type-card h3 {
          font-size: 26px;
          color: #333;
          margin-bottom: 10px;
        }

        .property-count {
          color: #666;
          margin-bottom: 25px;
        }

        .explore-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #75c9c8;
          text-decoration: none;
          font-weight: 600;
          transition: gap 0.3s;
        }

        .explore-link:hover {
          gap: 12px;
        }

        /* Stats Section */
        .stats-section {
          padding: 80px 0;
          background: linear-gradient(135deg, #75c9c8, #80a1d4);
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
        }

        .stat-card {
          text-align: center;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s;
        }

        .stat-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stat-icon {
          margin-bottom: 20px;
          opacity: 0.8;
        }

        .stat-value {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 16px;
          opacity: 0.9;
        }

        /* Recent Properties */
        .recent-properties-section {
          padding: 100px 0;
          background: #f8f9fa;
        }

        .properties-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-bottom: 50px;
        }

        .property-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
          transition: all 0.4s;
        }

        .property-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
        }

        .property-image {
          position: relative;
          height: 240px;
          overflow: hidden;
        }

        .property-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s;
        }

        .property-card:hover .property-image img {
          transform: scale(1.1);
        }

        .property-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          background: #80a1d4;
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .property-details {
          padding: 25px;
        }

        .property-details h3 {
          font-size: 20px;
          color: #333;
          margin-bottom: 12px;
        }

        .property-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .property-features {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .property-features span {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: #666;
        }

        .property-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .property-price {
          font-size: 24px;
          font-weight: 700;
          color: #75c9c8;
        }

        .view-button {
          background: #75c9c8;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .view-button:hover {
          background: #80a1d4;
          transform: scale(1.05);
        }

        .view-all-container {
          text-align: center;
        }

        .view-all-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #80a1d4, #75c9c8);
          color: white;
          padding: 15px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }

        .view-all-button:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
        }

        /* Features Section */
        .features-section {
          padding: 100px 0;
          background-color:#f8f9fa;
        }

        .features-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .features-text h2 {
          font-size: 42px;
          color: #333;
          margin-bottom: 20px;
        }

        .features-intro {
          font-size: 18px;
          color: #666;
          margin-bottom: 40px;
        }

        .features-list {
          display: grid;
          gap: 30px;
          margin-bottom: 40px;
        }

        .feature-item {
          display: flex;
          gap: 20px;
        }

        .feature-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #80a1d4, #75c9c8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .feature-item h4 {
          font-size: 18px;
          color: #333;
          margin-bottom: 5px;
        }

        .feature-item p {
          color: #666;
          font-size: 14px;
        }

        .extra-features {
          display: grid;
          gap: 15px;
        }

        .extra-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #666;
        }

        .check-icon {
          color: #75c9c8;
          flex-shrink: 0;
        }

        .features-image {
          position: relative;
          height: 500px;
        }

        .floating-card {
          position: absolute;
          background: white;
          padding: 25px;
          border-radius: 16px;
          box-shadow: 0 5px 15px rgba(117,201,200,0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          animation: float 3s ease-in-out infinite;
        }

        .card-1 {
          top: 50px;
          left: 50px;
          color: #75c9c8;
        }

        .card-2 {
          top: 200px;
          right: 50px;
          color: #80a1d4;
          animation-delay: 0.5s;
        }

        .card-3 {
          bottom: 80px;
          left: 100px;
          color: #75c9c8;
          animation-delay: 1s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .floating-card span {
          font-weight: 600;
          font-size: 14px;
        }

        /* CTA Section */
        .cta-section {
          padding: 100px 0;
          background: linear-gradient(135deg, #75c9c8, #80a1d4);
          color: white;
        }

        .cta-content {
          text-align: center;
        }

        .cta-content h2 {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .cta-content p {
          font-size: 20px;
          margin-bottom: 40px;
          opacity: 0.95;
        }

        .cta-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
        }

        .cta-button {
          padding: 16px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s;
        }

        .cta-button.primary {
          background: white;
          color: #75c9c8;
        }

        .cta-button.primary:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(255,255,255,0.3);
        }

        .cta-button.secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }

        .cta-button.secondary:hover {
          background: white;
          color: #75c9c8;
          transform: scale(1.05);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero-title {
            font-size: 48px;
          }

          .services-grid {
            grid-template-columns: 1fr;
          }

          .property-types-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .properties-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .features-content {
            grid-template-columns: 1fr;
            gap: 50px;
          }

          .features-image {
            height: 400px;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 20px;
          }

          .hero-section {
            height: 600px;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-subtitle {
            font-size: 18px;
          }

          .search-box {
            flex-direction: column;
            padding: 15px;
            border-radius: 16px;
          }

          .search-input {
            width: 100%;
            padding: 12px 0;
          }

          .search-button {
            width: 100%;
            justify-content: center;
          }

          .services-section {
            padding: 50px 0;
          }

          .property-types-section,
          .recent-properties-section,
          .features-section,
          .cta-section {
            padding: 60px 0;
          }

          .section-header h2 {
            font-size: 32px;
          }

          .property-types-grid {
            grid-template-columns: 1fr;
            gap: 25px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .properties-grid {
            grid-template-columns: 1fr;
          }

          .features-text h2 {
            font-size: 32px;
          }

          .features-image {
            display: none;
          }

          .cta-content h2 {
            font-size: 32px;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }

          .cta-button {
            width: 100%;
            max-width: 300px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 28px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .service-card {
            padding: 25px 20px;
          }

          .section-header h2 {
            font-size: 26px;
          }

          .stat-value {
            font-size: 36px;
          }

          .property-type-icon {
            font-size: 60px;
          }
        }

        .features-image {
        position: relative;
        display: flex;
        justify-content: flex-end; /* image à droite */
        align-items: center;
        gap: 20px; /* espace entre l'image et les cartes */
      }

      .advising-image {
        max-width: 400px; /* ajustable selon la taille désirée */
        height: auto;
        object-fit: contain;
        margin-top:250px;
        margin-right:115px;
      }

      .property-types-wrapper {
        display: flex;
        align-items: center;
        gap: 40px;
        flex-wrap: wrap;
      }

      .property-types-image img {
        max-width: 400px;
        height: 280px;
        border-radius: 16px;
        // box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        // animation: float 3s ease-in-out infinite;
        margin-left:70px;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .property-type-card {
        background: white;
        padding: 20px;
        border-radius: 16px;
        text-align: center;
        transition: transform 0.3s, box-shadow 0.3s;
      }

      .property-type-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 15px 40px rgba(0,0,0,0.2);
      }

      .property-type-icon {
        font-size: 48px;
        margin-bottom: 15px;
      }


      `}</style>
    </div>
    </Layout>
  );
};

export default HomePage;