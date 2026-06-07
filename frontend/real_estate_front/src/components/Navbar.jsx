import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Menu, X, User, LogIn, UserPlus, LogOut,
  LayoutDashboard, Zap, ChevronDown, ChevronRight, Map, Heart, Globe,
  Home, Key, Umbrella, Phone, PlusCircle, Bell
} from "lucide-react";
import API_URL from "../config";
import { useLanguage } from "../contexts/LanguageContext";
import Logo from "./Logo";

const NAV_LINK_KEYS = [
  { key: "nav_buy",      href: "/carte?categorie=vente",    icon: Home     },
  { key: "nav_rent",     href: "/carte?categorie=location", icon: Key      },
  { key: "nav_vacation", href: "/carte?categorie=vacances", icon: Umbrella },
  { key: "nav_contact",  href: "/contact",                  icon: Phone    },
  { key: "nav_about",    href: "/qui-sommes-nous",          icon: User     }, // Ajouté
];

export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchVal,     setSearchVal]     = useState("");
  const [mobAccOpen,    setMobAccOpen]    = useState(false);  // sous-menu profil
  const profileRef = useRef(null);
  const location   = useLocation();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  /* ── Badge notifications : demandes de contact non lues ── */
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const load = () => {
      fetch(`${API_URL}/users/me/contact-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data)) setUnreadCount(data.filter(r => !r.lu).length);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 60000); // refresh toutes les 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu + dropdowns on navigation
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (href) => {
    const path = href.split("?")[0];
    const params = new URLSearchParams(href.split("?")[1] || "");
    const cat = params.get("categorie");
    if (path === "/carte" && cat) {
      return location.pathname === "/carte" &&
        new URLSearchParams(location.search).get("categorie") === cat;
    }
    return location.pathname === path;
  };

  return (
    <>
      <header className={`lz-nav${scrolled ? " lz-nav--scrolled" : ""}`}>
        <div className="lz-nav__inner">
          {/* ── Logo ── */}
          <div className="lz-nav__logo">
            <Logo variant="color" height={44} />
          </div>

          {/* ── Desktop nav links ── */}
          <nav className="lz-nav__links">
            {NAV_LINK_KEYS.map((n) => (
              <Link
                key={n.key}
                to={n.href}
                className={`lz-nav__link${isActive(n.href) ? " lz-nav__link--active" : ""}`}
              >
                {t(n.key)}
              </Link>
            ))}
            {/* Boost — hidden for now */}
          </nav>

          {/* ── Desktop right actions ── */}
          <div className="lz-nav__right">
            {/* Search — hidden on mobile */}
            <button className="lz-nav__icon-btn lz-nav__desktop-only" onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <X size={19} /> : <Search size={19} />}
            </button>

            {/* Map — hidden on mobile */}
            <Link to="/carte" className="lz-nav__icon-btn lz-nav__desktop-only">
              <Map size={19} />
            </Link>

            {/* Publish CTA — hidden on mobile (shown in drawer instead) */}
            <Link to="/creer_annonce" className="btn btn-primary btn-sm btn-round lz-nav__desktop-only">
              + Publier annonce
            </Link>

            {/* ── Bell notification (demandes de contact anonyme) ── */}
            {user && (
              <Link to="/dashboard?tab=contacts" className="lz-nav__bell lz-nav__desktop-only" title="Demandes de contact">
                <Bell size={18}/>
                {unreadCount > 0 && (
                  <span className="lz-nav__bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </Link>
            )}

            {/* Profile dropdown — hidden on mobile */}
            <div className="lz-nav__profile lz-nav__desktop-only" ref={profileRef}>
              <button
                className="lz-nav__profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                {user?.profile_picture
                  ? <img src={user.profile_picture} alt="profil" />
                  : <User size={17} />
                }
                <ChevronDown size={13} style={{ transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>

              {profileOpen && (
                <div className="lz-nav__dropdown animate-fadeInDown">
                  {user ? (
                    <>
                      <div className="lz-nav__dd-header">
                        <p className="lz-nav__dd-name">{user.username}</p>
                        <p className="lz-nav__dd-email">{user.email}</p>
                      </div>
                      <div className="lz-nav__dd-body">
                        <Link to="/compte"      className="lz-nav__dd-item"><User size={14} /> {t("nav_profile")}</Link>
                        <Link to="/dashboard"   className="lz-nav__dd-item"><LayoutDashboard size={14} /> {t("nav_listings")}</Link>
                        <Link to="/favoris"     className="lz-nav__dd-item"><Heart size={14} /> {t("nav_favorites")}</Link>
                        {user?.role === "admin" && (
                          <Link to="/admin" className="lz-nav__dd-item lz-nav__dd-item--admin"><LayoutDashboard size={14} /> {t("nav_admin")}</Link>
                        )}
                      </div>
                      <div className="lz-nav__dd-footer">
                        <Link to="/logout" className="lz-nav__dd-item lz-nav__dd-item--danger"><LogOut size={14} /> {t("nav_logout")}</Link>
                      </div>
                    </>
                  ) : (
                    <div className="lz-nav__dd-body">
                      <Link to="/login"    className="lz-nav__dd-item"><LogIn size={14} /> {t("nav_login")}</Link>
                      <Link to="/register" className="lz-nav__dd-item"><UserPlus size={14} /> {t("nav_register")}</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language toggle — hidden for now */}

            {/* ── Hamburger — mobile only ── */}
            <button
              className="lz-nav__hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Desktop search bar */}
        {searchOpen && (
          <div className="lz-nav__searchbar animate-fadeInDown">
            <div className="lz-nav__searchbar-inner">
              <Search size={17} className="lz-nav__search-ico" />
              <input
                autoFocus
                type="text"
                placeholder={t("nav_search_ph") || "Ville, délégation, gouvernorat, adresse…"}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = searchVal.trim();
                    if (q) {
                      navigate(`/carte?q=${encodeURIComponent(q)}`);
                      setSearchOpen(false);
                      setSearchVal("");
                    }
                  }
                  if (e.key === "Escape") { setSearchOpen(false); setSearchVal(""); }
                }}
                className="lz-nav__search-inp"
              />
              {searchVal && (
                <button onClick={() => setSearchVal("")} className="lz-nav__search-clear">
                  <X size={15} />
                </button>
              )}
              {/* Bouton "Rechercher" supprimé — utiliser Entrée */}
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════
          MOBILE DRAWER — menu plat simple
      ════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="lz-mob-drawer animate-slideUp">
          <div className="lz-mob-list">

            {/* Navigation principale avec icônes */}
            {NAV_LINK_KEYS.map((n) => (
              <Link key={n.key} to={n.href}
                className={`lz-mob-row${isActive(n.href) ? " lz-mob-row--active" : ""}`}>
                <n.icon size={17}/> {t(n.key)}
              </Link>
            ))}
            <Link to="/carte"       className="lz-mob-row"><Map size={17}/> {t("nav_map") || "Carte"}</Link>
            {/* Boost mobile — hidden for now */}

            <div className="lz-mob-sep"/>

            {/* Profil */}
            {user ? (
              <>
                <button className="lz-mob-row lz-mob-row--profile" onClick={() => setMobAccOpen(v => !v)}>
                  <span className="lz-mob-row__left"><User size={17}/> {user.username}</span>
                  <ChevronDown size={15} style={{ transform: mobAccOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}/>
                </button>
                {mobAccOpen && (
                  <div className="lz-mob-submenu">
                    <Link to="/compte"    className="lz-mob-subrow"><User size={14}/> {t("nav_profile")    || "Mon profil"}</Link>
                    <Link to="/dashboard" className="lz-mob-subrow"><LayoutDashboard size={14}/> {t("nav_listings")  || "Mes annonces"}</Link>
                    <Link to="/favoris"   className="lz-mob-subrow"><Heart size={14}/> {t("nav_favorites") || "Favoris"}</Link>
                    {user?.role === "admin" && (
                      <Link to="/admin"   className="lz-mob-subrow lz-mob-subrow--admin"><LayoutDashboard size={14}/> {t("nav_admin") || "Admin"}</Link>
                    )}
                    <Link to="/logout"    className="lz-mob-subrow lz-mob-subrow--danger"><LogOut size={14}/> {t("nav_logout") || "Déconnexion"}</Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link to="/login"    className="lz-mob-row"><LogIn    size={17}/> {t("nav_login")    || "Se connecter"}</Link>
                <Link to="/register" className="lz-mob-row"><UserPlus size={17}/> {t("nav_register") || "Créer un compte"}</Link>
              </>
            )}

            <div className="lz-mob-sep"/>

            {/* Langue — hidden for now */}

            {/* CTA — dernier élément */}
            <div className="lz-mob-cta">
              <Link to="/creer_annonce" className="btn btn-primary btn-full lz-mob-cta__btn">
                <PlusCircle size={17}/> {t("nav_publish") || "Publier une annonce"}
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Overlay backdrop */}
      {mobileOpen && (
        <div className="lz-mob-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <style>{`
        /* ── Base navbar ── */
        .lz-nav {
          position: sticky; top: 0; z-index: var(--z-nav, 1000);
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid transparent;
          transition: border-color .2s, box-shadow .2s;
        }
        .lz-nav--scrolled { border-color: var(--border); box-shadow: var(--shadow-sm); }
        .lz-nav__inner {
          display: flex; align-items: center; gap: 8px;
          height: 64px; max-width: 1340px;
          margin: 0 auto; padding: 0 24px;
        }
        .lz-nav__logo svg { height: 44px; width: auto; display: block; }

        /* ── Desktop links ── */
        .lz-nav__links { display: flex; align-items: center; gap: 2px; flex: 1; }
        .lz-nav__link {
          padding: 7px 13px; border-radius: var(--r-sm);
          font-size: 14px; font-weight: 600; color: var(--text-secondary);
          transition: all .15s;
        }
        .lz-nav__link:hover, .lz-nav__link--active { color: var(--primary); background: var(--primary-light); }
        .lz-nav__link--boost {
          display: flex; align-items: center; gap: 5px;
          color: var(--gold); background: var(--gold-light);
        }
        .lz-nav__link--boost:hover { background: #fcefc5; color: #b87a00; }

        /* ── Desktop right ── */
        .lz-nav__right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .lz-nav__icon-btn {
          width: 36px; height: 36px; border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); transition: all .15s;
        }
        .lz-nav__icon-btn:hover { background: var(--bg); color: var(--text-primary); }

        /* ── Profile dropdown ── */
        /* Bell notification */
        .lz-nav__bell {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          color: #64748b; text-decoration: none; transition: all .15s;
          border: 1.5px solid transparent;
        }
        .lz-nav__bell:hover { background: #f1f5f9; color: #0f172a; border-color: #e2e8f0; }
        .lz-nav__bell-badge {
          position: absolute; top: -4px; right: -4px;
          background: #ef4444; color: #fff; border-radius: 10px;
          font-size: 9px; font-weight: 800; padding: 1px 5px;
          border: 2px solid #fff; min-width: 16px; text-align: center; line-height: 1.4;
        }

        .lz-nav__profile { position: relative; }
        .lz-nav__profile-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: var(--r-sm);
          border: 1px solid var(--border); background: var(--bg);
          color: var(--text-secondary); font-size: 14px; transition: all .15s;
        }
        .lz-nav__profile-btn:hover { border-color: var(--primary); color: var(--primary); }
        .lz-nav__profile-btn img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
        .lz-nav__dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          min-width: 215px; background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--r-md);
          box-shadow: var(--shadow-lg); overflow: hidden; z-index: 1200;
        }
        .lz-nav__dd-header { padding: 14px 16px; background: var(--bg); border-bottom: 1px solid var(--border); }
        .lz-nav__dd-name  { font-weight: 700; font-size: 14px; color: var(--text-primary); }
        .lz-nav__dd-email { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .lz-nav__dd-body  { padding: 8px; }
        .lz-nav__dd-footer{ padding: 8px; border-top: 1px solid var(--border); }
        .lz-nav__dd-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 11px; border-radius: var(--r-sm);
          font-size: 14px; color: var(--text-secondary); transition: all .15s;
        }
        .lz-nav__dd-item:hover { background: var(--bg); color: var(--text-primary); }
        .lz-nav__dd-item--gold  { color: #9a6700; }
        .lz-nav__dd-item--gold:hover { background: var(--gold-light); }
        .lz-nav__dd-item--danger { color: var(--danger); }
        .lz-nav__dd-item--danger:hover { background: #fef2f2; }
        .lz-nav__dd-item--admin { color: var(--primary); font-weight: 600; }
        .lz-nav__dd-item--admin:hover { background: var(--primary-light); }

        /* ── Desktop search bar ── */
        .lz-nav__searchbar { padding: 10px 24px; border-top: 1px solid var(--border); background: var(--surface); }
        .lz-nav__searchbar-inner { position: relative; max-width: 580px; margin: 0 auto; }
        .lz-nav__search-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .lz-nav__search-inp {
          width: 100%; padding: 11px 40px; border: 1.5px solid var(--border);
          border-radius: var(--r-full); font-size: 15px; font-family: inherit; outline: none;
          transition: border-color .15s;
        }
        .lz-nav__search-inp:focus { border-color: var(--primary); }
        .lz-nav__search-clear {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          color: var(--text-muted); padding: 3px; border-radius: 50%;
        }
        .lz-nav__search-clear:hover { background: var(--bg); }

        /* ── Language toggle (desktop) ── */
        .lz-nav__lang-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 11px; border-radius: var(--r-sm);
          border: 1.5px solid var(--border); background: var(--bg);
          color: var(--text-secondary); font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all .15s;
          white-space: nowrap; letter-spacing: .3px;
        }
        .lz-nav__lang-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }

        /* ── Hamburger (mobile only) ── */
        .lz-nav__hamburger {
          display: none;
          align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px;
          color: #475569; background: none; border: none;
          cursor: pointer; transition: background .15s;
          flex-shrink: 0;
        }
        .lz-nav__hamburger:hover { background: #f1f5f9; color: #6366f1; }

        /* ════════════════════════════════════════
           MOBILE DRAWER — simple flat
        ════════════════════════════════════════ */
        .lz-mob-drawer {
          position: fixed; inset: 64px 0 0 0;
          background: #fff; z-index: calc(var(--z-nav, 1000) + 10);
          overflow-y: auto; display: flex; flex-direction: column;
          padding-bottom: 32px;
        }

        /* CTA bas */
        .lz-mob-cta { padding: 10px 4px 4px; }
        .lz-mob-cta__btn {
          border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 700;
          display: flex !important; align-items: center; justify-content: center; gap: 8px;
        }

        /* Flat list */
        .lz-mob-list { display: flex; flex-direction: column; padding: 0 8px; }

        /* Each row */
        .lz-mob-row {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 12px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          color: #334155; transition: background .12s, color .12s;
          border: none; background: none; cursor: pointer;
          font-family: inherit; text-decoration: none; width: 100%;
        }
        .lz-mob-row:hover       { background: #f1f5f9; color: #6366f1; }
        .lz-mob-row--active     { color: #6366f1; background: #eef2ff; }
        .lz-mob-row--gold       { color: #b45309; }
        .lz-mob-row--gold:hover { background: #fef9ec; color: #92400e; }
        .lz-mob-row--profile    { justify-content: space-between; }
        .lz-mob-row__left       { display: flex; align-items: center; gap: 10px; }

        /* Separator */
        .lz-mob-sep { height: 1px; background: #e2e8f0; margin: 6px 12px; }

        /* Sub-rows (profil sous-menu) */
        .lz-mob-submenu { padding-left: 16px; border-left: 2px solid #e2e8f0; margin: 0 12px 4px 20px; }
        .lz-mob-subrow {
          display: flex; align-items: center; gap: 9px;
          padding: 11px 10px; border-radius: 8px;
          font-size: 14px; font-weight: 500; color: #475569;
          transition: background .12s, color .12s;
        }
        .lz-mob-subrow:hover             { background: #f1f5f9; color: #334155; }
        .lz-mob-subrow--danger           { color: #ef4444; }
        .lz-mob-subrow--danger:hover     { background: #fef2f2; }
        .lz-mob-subrow--admin            { color: #6366f1; font-weight: 700; }
        .lz-mob-subrow--admin:hover      { background: #eef2ff; }

        /* Backdrop */
        .lz-mob-backdrop {
          position: fixed; inset: 0; z-index: calc(var(--z-nav, 1000) + 9);
          background: rgba(15, 23, 42, .45);
        }

        /* ── Responsive breakpoints ── */
        @media (max-width: 1100px) {
          .lz-nav__links        { display: none !important; }
          .lz-nav__hamburger    { display: flex !important; }
          .lz-nav__desktop-only { display: none !important; }
        }
        @media (min-width: 1101px) {
          .lz-nav__hamburger { display: none !important; }
          .lz-mob-drawer     { display: none !important; }
          .lz-mob-backdrop   { display: none !important; }
        }

        /* Animation */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp .22s ease both; }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInDown { animation: fadeInDown .18s ease both; }
      `}</style>
    </>
  );
}
