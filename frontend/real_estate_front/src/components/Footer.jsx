import React from "react";
import { MapPin, Mail, Clock, Phone, Facebook, Instagram, Send } from "lucide-react";
import logoLocalizi from "../assets/logo_localizi.png";

const logoUrl = logoLocalizi;
 
const Footer = ({ logo }) => {
  return (
    <footer className="footer-container">
      {/* Section principale */}
      <div className="footer-main">
        <div className="footer-content">
          {/* Logo et description */}
          <div className="footer-brand">
            {logo ? (
              <img src={logoUrl} alt="Logo" className="footer-logo" />
            ) : (
              <div className="footer-logo-placeholder">LOGO</div>
            )}
            <p className="footer-description">
              Votre partenaire de confiance pour tous vos projets immobiliers en Tunisie. 
              Achetez, vendez ou louez en toute sérénité.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook" className="social-icon">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Instagram" className="social-icon">
                <Instagram size={20} />
              </a>
              <a href="#" aria-label="TikTok" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-links">
            <h3 className="footer-title">Navigation</h3>
            <ul className="footer-list">
              <li><a href="/">Accueil</a></li>
              <li><a href="/apropos">À propos</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="#">Mentions légales</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-links">
            <h3 className="footer-title">Nos Services</h3>
            <ul className="footer-list">
              <li><a href="/recherche_annonce">Acheter</a></li>
              <li><a href="#">Louer</a></li>
              <li><a href="/creer_annonce">Vendre</a></li>
              <li><a href="#">Estimation gratuite</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-contact">
            <h3 className="footer-title">Contactez-nous</h3>
            <div className="contact-info">
              <div className="contact-item">
                <MapPin size={18} className="contact-icon" />
                <span>Tunis, Tunisie</span>
              </div>
              <div className="contact-item">
                <Mail size={18} className="contact-icon" />
                <a href="mailto:xpertiseimmo@gmail.com">xpertiseimmo@gmail.com</a>
              </div>
              <div className="contact-item">
                <Phone size={18} className="contact-icon" />
                <span>+216 XX XXX XXX</span>
              </div>
              <div className="contact-item">
                <Clock size={18} className="contact-icon" />
                <span>Disponible 24h/24, 7j/7</span>
              </div>
            </div>
            <a href="/contact" className="contact-button">
              <Send size={16} />
              Nous contacter
            </a>
          </div>
        </div>
      </div>

      {/* Barre du bas */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© 2025 Xpertise Immo. Tous droits réservés.</p>
          <p className="footer-credits">
            Développé avec <span className="heart">❤️</span> en Tunisie
          </p>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .footer-container {
          width: 100%;
          background: linear-gradient(135deg, #80a1d4 0%, #75c9c8 100%);
          color: white;
          margin-top: auto;
        }

        .footer-main {
          padding: 60px 40px 40px;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 50px;
        }

        /* Brand section */
        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .footer-logo {
          height: 60px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }

        .footer-logo-placeholder {
          width: 120px;
          height: 60px;
          background: white;
          color: #75c9c8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border-radius: 8px;
          font-size: 18px;
        }

        .footer-description {
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        .social-links {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .social-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .social-icon:hover {
          background: white;
          color: #75c9c8;
          transform: translateY(-3px);
        }

        /* Links sections */
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .footer-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 5px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .footer-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-list li a {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .footer-list li a:hover {
          color: white;
          padding-left: 8px;
        }

        /* Contact section */
        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .contact-icon {
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .contact-item a {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          transition: color 0.3s;
        }

        .contact-item a:hover {
          color: white;
        }

        .contact-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: white;
          color: #75c9c8;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          width: fit-content;
          margin-top: 10px;
        }

        .contact-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        /* Bottom bar */
        .footer-bottom {
          background: rgba(0, 0, 0, 0.2);
          padding: 25px 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-bottom-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .footer-credits {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .heart {
          color: #80a1d4;
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .footer-content {
            grid-template-columns: 2fr 1fr 1fr;
            gap: 40px;
          }

          .footer-contact {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .footer-main {
            padding: 40px 25px 30px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .footer-brand {
            text-align: center;
            align-items: center;
          }

          .footer-description {
            text-align: center;
          }

          .social-links {
            justify-content: center;
          }

          .footer-title {
            font-size: 16px;
          }

          .footer-bottom {
            padding: 20px 25px;
          }

          .footer-bottom-content {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }

          .contact-button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .footer-main {
            padding: 30px 20px 25px;
          }

          .footer-content {
            gap: 30px;
          }

          .footer-title {
            font-size: 15px;
          }

          .footer-list li a,
          .contact-item,
          .footer-description {
            font-size: 13px;
          }

          .social-icon {
            width: 36px;
            height: 36px;
          }

          .footer-bottom {
            padding: 18px 20px;
          }

          .footer-bottom-content {
            font-size: 12px;
          }
        }
      `}</style>
    </footer>
  );
};

// Exemple d'utilisation
export default function App() {
  // Simuler l'import du logo
  const logoUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=60&fit=crop";

  return (
    <div style={{ /*minHeight: "100vh",*/ display: "flex", flexDirection: "column" }}>
      {/* Contenu de la page
      <div style={{ flex: 1, padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ color: "#BD2138", marginBottom: "20px" }}>
            Bienvenue sur Xpertise Immo
          </h1>
          <p style={{ lineHeight: "1.6", color: "#666" }}>
            Scrollez jusqu'en bas pour voir le nouveau footer moderne et responsive.
            Testez-le en redimensionnant votre fenêtre !
          </p>
        </div>
      </div> */}

      {/* Footer */}
      <Footer logo={logoUrl} />
    </div>
  );
}

// export default Footer;
