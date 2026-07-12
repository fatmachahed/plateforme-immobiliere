// pages/Apropos.jsx
import React from "react";
import Layout from "../components/Layout";
import Seo from "../components/Seo";
import { Home, Users, Award, TrendingUp, Shield, Zap, Heart, Target } from "lucide-react";

export default function Apropos() {
  const stats = [
    { icon: <Home />, value: "750+", label: "Propriétés" },
    { icon: <Users />, value: "500+", label: "Clients satisfaits" },
    { icon: <Award />, value: "5 ans", label: "D'expérience" },
    { icon: <TrendingUp />, value: "98%", label: "Taux de réussite" }
  ];

  const values = [
    { icon: <Shield />, title: "Fiabilité", desc: "Transactions sécurisées et vérifiées" },
    { icon: <Zap />, title: "Rapidité", desc: "Réponses en moins de 24h" },
    { icon: <Heart />, title: "Engagement", desc: "À votre écoute 24/7" },
    { icon: <Target />, title: "Précision", desc: "Matching parfait de vos besoins" }
  ];

  const team = [
    { name: "Ahmed Ben Ali", role: "CEO & Fondateur", image: "👨‍💼" },
    { name: "Salma Mansour", role: "Directrice Marketing", image: "👩‍💼" },
    { name: "Karim Trabelsi", role: "Chef des ventes", image: "👨‍💻" },
    { name: "Ines Gharbi", role: "Support Client", image: "👩‍💻" }
  ];

  return (
    <Layout>
      <Seo
        title="À propos de Localizi.tn"
        description="Localizi.tn est la plateforme immobilière géolocalisée de référence en Tunisie : découvrez notre mission, nos valeurs et notre équipe."
        path="/apropos"
      />
      <div className="apropos-page">
        {/* Hero Section */}
        <section className="apropos-hero">
          <div className="hero-content">
            <h1 className="hero-title">À Propos de Xpertise Immo</h1>
            <p className="hero-subtitle">
              Votre partenaire de confiance pour tous vos projets immobiliers en Tunisie
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="apropos-stats-section">
          <div className="apropos-container">
            <div className="apropos-stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="apropos-stat-card">
                  <div className="apropos-stat-icon">{stat.icon}</div>
                  <div className="apropos-stat-value">{stat.value}</div>
                  <div className="apropos-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="apropos-content-section">
          <div className="apropos-container">
            <div className="apropos-two-columns">
              <div className="apropos-column">
                <h2 className="apropos-section-title">Notre Histoire</h2>
                <p className="apropos-text-content">
                  Fondée en 2019, <strong>Xpertise Immo</strong> est née d'une passion commune 
                  pour l'immobilier et d'une vision claire : démocratiser l'accès au marché 
                  immobilier tunisien grâce à la technologie.
                </p>
                <p className="apropos-text-content">
                  Nous croyons que chaque Tunisien mérite de trouver le bien immobilier de 
                  ses rêves sans complications. C'est pourquoi nous avons créé une plateforme 
                  intuitive, transparente et accessible à tous.
                </p>
              </div>
              <div className="apropos-column">
                <h2 className="apropos-section-title">Notre Mission</h2>
                <p className="apropos-text-content">
                  Simplifier et sécuriser les transactions immobilières en Tunisie en offrant 
                  une plateforme moderne qui connecte acheteurs, vendeurs et locataires.
                </p>
                <p className="apropos-text-content">
                  Nous nous engageons à fournir un service de qualité, transparent et 
                  personnalisé pour accompagner chaque client dans son projet immobilier.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="apropos-values-section">
          <div className="apropos-container">
            <h2 className="apropos-section-title apropos-centered">Nos Valeurs</h2>
            <div className="apropos-values-grid">
              {values.map((value, index) => (
                <div key={index} className="apropos-value-card">
                  <div className="apropos-value-icon">{value.icon}</div>
                  <h3>{value.title}</h3>
                  <p>{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="apropos-content-section">
          <div className="apropos-container">
            <h2 className="apropos-section-title apropos-centered">Notre Équipe</h2>
            <div className="apropos-team-grid">
              {team.map((member, index) => (
                <div key={index} className="apropos-team-card">
                  <div className="apropos-team-avatar">{member.image}</div>
                  <h3>{member.name}</h3>
                  <p className="apropos-team-role">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <style jsx>{`
          .apropos-page {
            width: 100%;
            background: #f8f9fa;
          }

          /* Hero Section */
          .apropos-hero {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            padding: 80px 20px;
            text-align: center;
            color: white;
          }

          .hero-content {
            max-width: 800px;
            margin: 0 auto;
          }

          .hero-title {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 20px;
            animation: fadeInUp 1s ease;
          }

          .hero-subtitle {
            font-size: 20px;
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

          /* Container */
          .apropos-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }

          /* Stats Section */
          .apropos-stats-section {
            padding: 60px 20px;
            margin-top: -40px;
            position: relative;
            z-index: 10;
          }

          .apropos-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
          }

          .apropos-stat-card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
          }

          .apropos-stat-card:hover {
            transform: translateY(-10px);
          }

          .apropos-stat-icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 15px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .apropos-stat-value {
            font-size: 36px;
            font-weight: 800;
            color: #333;
            margin-bottom: 5px;
          }

          .apropos-stat-label {
            color: #666;
            font-size: 14px;
          }

          /* Content Section */
          .apropos-content-section {
            padding: 80px 20px;
          }

          .apropos-section-title {
            font-size: 32px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 700;
          }

          .apropos-section-title.apropos-centered {
            text-align: center;
          }

          .apropos-two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-top: 40px;
          }

          .apropos-text-content {
            line-height: 1.8;
            color: #666;
            margin-bottom: 20px;
            font-size: 16px;
          }

          /* Values Section */
          .apropos-values-section {
            padding: 80px 20px;
            background: linear-gradient(135deg, rgba(128, 161, 212, 0.1), rgba(117, 201, 200, 0.1));
          }

          .apropos-values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin-top: 40px;
          }

          .apropos-value-card {
            background: white;
            padding: 40px 30px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
          }

          .apropos-value-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
          }

          .apropos-value-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .apropos-value-card h3 {
            font-size: 20px;
            margin-bottom: 10px;
            color: #333;
            font-weight: 600;
          }

          .apropos-value-card p {
            color: #666;
            line-height: 1.6;
            font-size: 15px;
          }

          /* Team Section */
          .apropos-team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-top: 40px;
          }

          .apropos-team-card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease;
          }

          .apropos-team-card:hover {
            transform: translateY(-5px);
          }

          .apropos-team-avatar {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
          }

          .apropos-team-card h3 {
            font-size: 18px;
            margin-bottom: 5px;
            color: #333;
            font-weight: 600;
          }

          .apropos-team-role {
            color: #666;
            font-size: 14px;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .hero-title {
              font-size: 32px;
            }

            .hero-subtitle {
              font-size: 16px;
            }

            .apropos-stats-grid {
              grid-template-columns: 1fr 1fr;
            }

            .apropos-two-columns {
              grid-template-columns: 1fr;
              gap: 40px;
            }

            .apropos-content-section {
              padding: 50px 20px;
            }

            .apropos-values-section {
              padding: 50px 20px;
            }

            .apropos-section-title {
              font-size: 26px;
            }
          }

          @media (max-width: 480px) {
            .apropos-stats-grid {
              grid-template-columns: 1fr;
            }

            .apropos-values-grid {
              grid-template-columns: 1fr;
            }

            .apropos-team-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}