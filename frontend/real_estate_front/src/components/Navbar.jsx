import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search, Menu, X, User, LogIn, UserPlus, LogOut,
  LayoutDashboard, Zap, ChevronDown, ChevronRight, Map, Heart, Globe
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const NAV_LINK_KEYS = [
  { key: "nav_buy",      href: "/carte?categorie=vente" },
  { key: "nav_rent",     href: "/carte?categorie=location" },
  { key: "nav_vacation", href: "/carte?categorie=vacances" },
  { key: "nav_contact",  href: "/contact" },
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

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

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
          <Link to="/" className="lz-nav__logo">
            <svg width="168" height="44" viewBox="0 0 168 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Localizi">
              <defs>
                <linearGradient id="nav-pin-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#4338ca"/>
                </linearGradient>
              </defs>
              <ellipse cx="16" cy="40" rx="7" ry="3" fill="#6366f1" fillOpacity=".12"/>
              <path d="M16 2C9.92 2 5 6.92 5 13C5 21.5 16 38 16 38C16 38 27 21.5 27 13C27 6.92 22.08 2 16 2Z" fill="url(#nav-pin-g)"/>
              <circle cx="16" cy="13" r="6" fill="white" fillOpacity=".92"/>
              <path d="M13 16V12.8L16 10.5L19 12.8V16H17.2V14.2H14.8V16H13Z" fill="#4f46e5"/>
              <text x="35" y="29" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight="800" fontSize="26" letterSpacing="-0.5">
                <tspan fill="#0f172a">LOCALI</tspan><tspan fill="#6366f1">ZI</tspan>
              </text>
            </svg>
          </Link>

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
            <Link to="/abonnements" className="lz-nav__link lz-nav__link--boost">
              <Zap size={13} /> {t("nav_boost")}
            </Link>
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
              + Publier
            </Link>

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
                        <Link to="/abonnements" className="lz-nav__dd-item lz-nav__dd-item--gold"><Zap size={14} /> {t("nav_boost")}</Link>
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

            {/* Language toggle — hidden on mobile */}
            <button
              className="lz-nav__lang-btn lz-nav__desktop-only"
              onClick={toggleLang}
              title={lang === "fr" ? "Switch to English" : "Passer en français"}
            >
              <Globe size={14} />
              <span>{lang === "fr" ? "EN" : "FR"}</span>
            </button>

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
                placeholder={t("nav_search_ph")}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchVal.trim())
                    window.location.href = `/carte?q=${encodeURIComponent(searchVal)}`;
                }}
                className="lz-nav__search-inp"
              />
              {searchVal && (
                <button onClick={() => setSearchVal("")} className="lz-nav__search-clear">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════
          MOBILE DRAWER — menu plat simple
      ════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="lz-mob-drawer animate-slideUp">

          {/* CTA en haut */}
          <div className="lz-mob-cta">
            <Link to="/creer_annonce" className="btn btn-primary btn-full">
              + {t("nav_publish") || "Publier une annonce"}
            </Link>
          </div>

          <div className="lz-mob-list">
            {/* Navigation principale */}
            {NAV_LINK_KEYS.map((n) => (
              <Link key={n.key} to={n.href}
                className={`lz-mob-row${isActive(n.href) ? " lz-mob-row--active" : ""}`}>
                {t(n.key)}
              </Link>
            ))}
            <Link to="/carte"       className="lz-mob-row"><Map size={15}/> {t("nav_map") || "Carte"}</Link>
            <Link to="/abonnements" className="lz-mob-row lz-mob-row--gold"><Zap size={15}/> {t("nav_boost") || "Boost"}</Link>

            <div className="lz-mob-sep"/>

            {/* Profil — ligne cliquable qui ouvre les sous-éléments */}
            {user ? (
              <>
                <button className="lz-mob-row lz-mob-row--profile" onClick={() => setMobAccOpen(v => !v)}>
                  <span className="lz-mob-row__left">
                    <User size={15}/> {user.username}
                  </span>
                  <ChevronDown size={15} style={{ transform: mobAccOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}/>
                </button>
                {mobAccOpen && (
                  <div className="lz-mob-submenu">
                    <Link to="/compte"      className="lz-mob-subrow"><User size={14}/> {t("nav_profile") || "Mon profil"}</Link>
                    <Link to="/dashboard"   className="lz-mob-subrow"><LayoutDashboard size={14}/> {t("nav_listings") || "Mes annonces"}</Link>
                    <Link to="/favoris"     className="lz-mob-subrow"><Heart size={14}/> {t("nav_favorites") || "Favoris"}</Link>
                    {user?.role === "admin" && (
                      <Link to="/admin"     className="lz-mob-subrow lz-mob-subrow--admin"><LayoutDashboard size={14}/> {t("nav_admin") || "Admin"}</Link>
                    )}
                    <Link to="/logout"      className="lz-mob-subrow lz-mob-subrow--danger"><LogOut size={14}/> {t("nav_logout") || "Déconnexion"}</Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link to="/login"    className="lz-mob-row"><LogIn size={15}/> {t("nav_login") || "Se connecter"}</Link>
                <Link to="/register" className="lz-mob-row"><UserPlus size={15}/> {t("nav_register") || "Créer un compte"}</Link>
              </>
            )}

            <div className="lz-mob-sep"/>

            {/* Langue */}
            <button className="lz-mob-row" onClick={toggleLang}>
              <Globe size={15}/> {lang === "fr" ? "English" : "Français"}
            </button>
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

        /* CTA top */
        .lz-mob-cta { padding: 14px 16px 8px; }
        .lz-mob-cta .btn { border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 700; }

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
