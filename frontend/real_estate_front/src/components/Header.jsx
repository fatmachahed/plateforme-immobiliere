import React, { useState, useEffect } from "react";
import { Menu, X, User, BarChart3, LogOut, LogIn, UserPlus, Globe } from "lucide-react";
import logoLocalizi from "../assets/logo_vert1.png";



const Header = ({ user, logo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleLanguageDropdown = () => setLanguageDropdownOpen(!languageDropdownOpen);

  // Fermer le menu mobile lors du clic sur un lien
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="header-container">
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="email-marquee">
            <marquee direction="left">E-mail: xpertiseimmo@gmail.com</marquee>
          </div>
          
          {/* Language dropdown */}
          <div className="language-menu">
            <div 
              className="language-trigger" 
              onClick={toggleLanguageDropdown}
              role="button"
              tabIndex={0}
            >
              <Globe size={16} />
              <span>Français</span>
            </div>

            {languageDropdownOpen && (
              <div className="language-dropdown">
                <a href="#" onClick={() => setLanguageDropdownOpen(false)}>Français</a>
                <a href="#" onClick={() => setLanguageDropdownOpen(false)}>English</a>
                <a href="#" onClick={() => setLanguageDropdownOpen(false)}>العربية</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="header-main">
        {/* Navigation gauche (desktop) */}
        {!isMobile && (
          <nav className="nav-left">
            <a href="/recherche_annonce">Acheter</a>
            <a href="#">Louer</a>
            <a href="/creer_annonce">Vendre</a>
          </nav>
        )}

        {/* Hamburger (mobile) */}
        {isMobile && (
          <button 
            className="hamburger-btn" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        {/* Logo */}
        <div className="logo">
          <a href="/">
            {logo ? (
              <img src={logo} alt="Logo" style={{ height: "250px" }} />
            ) : (
              <div className="logo-placeholder">LOGO</div>
            )}
          </a>
        </div>

        {/* Navigation droite (desktop) */}
        {!isMobile && (
          <div className="nav-right">
            <a href="/">Accueil</a>
            <a href="/apropos">À propos</a>
            <a href="/contact">Contact</a>

            {/* Profile dropdown */}
            <div className="profile-menu">
              <div 
                className="profile-icon" 
                onClick={toggleDropdown}
                role="button"
                tabIndex={0}
              >
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profil" />
                ) : (
                  <User size={20} />
                )}
              </div>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  {user ? (
                    <>
                      <a href="/compte">
                        <User size={16} /> Mon profil
                      </a>
                      <a href="#">
                        <BarChart3 size={16} /> Statistiques
                      </a>
                      <a href="/logout">
                        <LogOut size={16} /> Logout
                      </a>
                    </>
                  ) : (
                    <>
                      <a href="/login">
                        <LogIn size={16} /> Login
                      </a>
                      <a href="/register">
                        <UserPlus size={16} /> Register
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Boost counter */}
            <div className="boost-counter">
              <div className="rocket-icon">🚀</div>
              <span>100</span>
            </div>
          </div>
        )}

        {/* Profile icon (mobile) */}
        {isMobile && (
          <div className="mobile-profile">
            <div className="profile-icon" onClick={toggleDropdown}>
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Profil" />
              ) : (
                <User size={20} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu mobile */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <a href="/" onClick={handleLinkClick}>Accueil</a>
            <a href="/apropos" onClick={handleLinkClick}>À propos</a>
            <a href="/contact" onClick={handleLinkClick}>Contact</a>
            <div className="separator"></div>
            <a href="/recherche_annonce" onClick={handleLinkClick}>Acheter</a>
            <a href="#" onClick={handleLinkClick}>Louer</a>
            <a href="/creer_annonce" onClick={handleLinkClick}>Vendre</a>
            <div className="separator"></div>
            
            {user ? (
              <>
                <a href="/compte" onClick={handleLinkClick}>
                  <User size={16} /> Mon profil
                </a>
                <a href="#" onClick={handleLinkClick}>
                  <BarChart3 size={16} /> Statistiques
                </a>
                <a href="/logout" onClick={handleLinkClick}>
                  <LogOut size={16} /> Logout
                </a>
              </>
            ) : (
              <>
                <a href="/login" onClick={handleLinkClick}>
                  <LogIn size={16} /> Login
                </a>
                <a href="/register" onClick={handleLinkClick}>
                  <UserPlus size={16} /> Register
                </a>
              </>
            )}

            <div className="mobile-boost">
              <div className="rocket-icon">🚀</div>
              <span>100 Boosts</span>
            </div>
          </nav>
        </div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .header-container {
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 1000;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Top bar */
        .top-bar {
          background-color: #BD2138;
          color: white;
        }

        .top-bar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 20px;
          font-size: 14px;
        }

        .email-marquee {
          flex: 1;
        }

        .language-menu {
          position: relative;
        }

        .language-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: white;
          color: #BD2138;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .language-trigger:hover {
          background: #f8f9fa;
        }

        .language-dropdown {
          position: absolute;
          top: 35px;
          right: 0;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          overflow: hidden;
          min-width: 140px;
          z-index: 1001;
        }

        .language-dropdown a {
          display: block;
          padding: 10px 16px;
          color: #333;
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s;
        }

        .language-dropdown a:hover {
          background: #f5f5f5;
          color: #BD2138;
        }

        .language-dropdown a:not(:last-child) {
          border-bottom: 1px solid #eee;
        }

        .language-selector {
          border: none;
          border-radius: 20px;
          padding: 6px 12px;
          color: #BD2138;
          background: white;
          cursor: pointer;
          font-size: 13px;
        }

        /* Main header */
        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 40px;
          background: #fff;
          position: relative;
        }

        .nav-left,
        .nav-right {
          display: flex;
          gap: 25px;
          align-items: center;
        }

        .nav-left a,
        .nav-right a {
          text-decoration: none;
          color: #717981;
          font-weight: 600;
          font-size: 15px;
          transition: color 0.3s;
        }

        .nav-left a:hover,
        .nav-right a:hover {
          color: #BD2138;
        }

        .logo {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .logo-placeholder {
          width: 60px;
          height: 60px;
          background: #BD2138;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          border-radius: 8px;
        }

        .logo img {
          height: 60px;
          object-fit: contain;
        }

        /* Profile menu */
        .profile-menu {
          position: relative;
        }

        .profile-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background 0.3s;
        }

        .profile-icon:hover {
          background: #e0e0e0;
        }

        .profile-icon img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .dropdown-menu {
          position: absolute;
          top: 50px;
          right: 0;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          overflow: hidden;
          min-width: 180px;
          z-index: 1001;
        }

        .dropdown-menu a {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          color: #333;
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s;
        }

        .dropdown-menu a:hover {
          background: #f5f5f5;
        }

        .dropdown-menu a:not(:last-child) {
          border-bottom: 1px solid #eee;
        }

        /* Boost counter */
        .boost-counter {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f8f9fa;
          border-radius: 20px;
        }

        .rocket-icon {
          font-size: 20px;
        }

        .boost-counter span {
          font-weight: bold;
          color: #75c9c8;
        }

        /* Hamburger button */
        .hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: #75c9c8;
          cursor: pointer;
          padding: 5px;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .header-main {
            padding: 15px 20px;
          }

          .hamburger-btn {
            display: block;
          }

          .nav-left,
          .nav-right {
            display: none;
          }

          .logo {
            position: static;
            transform: none;
          }

          .mobile-profile {
            display: flex;
            align-items: center;
          }

          .mobile-menu {
            background: white;
            border-top: 1px solid #eee;
            animation: slideDown 0.3s ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .mobile-nav {
            display: flex;
            flex-direction: column;
            padding: 10px 0;
          }

          .mobile-nav a {
            padding: 15px 20px;
            text-decoration: none;
            color: #717981;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.2s;
          }

          .mobile-nav a:hover {
            background: #f8f9fa;
            color: #BD2138;
          }

          .separator {
            height: 1px;
            background: #eee;
            margin: 8px 20px;
          }

          .mobile-boost {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px 20px;
            background: #f8f9fa;
            margin: 10px 20px;
            border-radius: 8px;
          }

          .mobile-boost span {
            font-weight: bold;
            color: #BD2138;
          }
        }

        /* Tablette */
        @media (max-width: 1024px) and (min-width: 769px) {
          .header-main {
            padding: 15px 30px;
          }

          .nav-left,
          .nav-right {
            gap: 15px;
          }

          .nav-left a,
          .nav-right a {
            font-size: 14px;
          }
        }

        /* Très petits écrans */
        @media (max-width: 480px) {
          .top-bar-content {
            padding: 6px 15px;
            font-size: 12px;
          }

          .header-main {
            padding: 12px 15px;
          }

          .logo-placeholder {
            width: 50px;
            height: 50px;
            font-size: 12px;
          }

          .profile-icon {
            width: 35px;
            height: 35px;
          }
        }
      `}</style>
    </header>
  );
};

// Exemple d'utilisation avec/sans utilisateur
export default function App() {
  const [user, setUser] = useState(null);
  
  // Simuler l'import du logo
  const logoUrl = logoLocalizi;


  return (
    <div>
      <Header user={user} logo={logoUrl} />
      

    </div>
  );
}