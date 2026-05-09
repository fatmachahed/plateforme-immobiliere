import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search, Menu, X, User, LogIn, UserPlus, LogOut,
  LayoutDashboard, Zap, ChevronDown, Map, Heart, Globe
} from "lucide-react";
/* Logo SVG inline — pas besoin d'import image */
import { useLanguage } from "../contexts/LanguageContext";

const NAV_LINK_KEYS = [
  { key: "nav_buy",      href: "/carte?categorie=vente" },
  { key: "nav_rent",     href: "/carte?categorie=location" },
  { key: "nav_vacation", href: "/carte?categorie=vacances" },
  { key: "nav_contact",  href: "/contact" },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchVal,   setSearchVal]   = useState("");
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

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

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
          <Link to="/" className="lz-nav__logo">
            <svg width="168" height="44" viewBox="0 0 168 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Localizi">
              <defs>
                <linearGradient id="nav-pin-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#4338ca"/>
                </linearGradient>
              </defs>
              {/* Pin shadow */}
              <ellipse cx="16" cy="40" rx="7" ry="3" fill="#6366f1" fillOpacity=".12"/>
              {/* Pin body */}
              <path d="M16 2C9.92 2 5 6.92 5 13C5 21.5 16 38 16 38C16 38 27 21.5 27 13C27 6.92 22.08 2 16 2Z" fill="url(#nav-pin-g)"/>
              {/* Pin inner circle */}
              <circle cx="16" cy="13" r="6" fill="white" fillOpacity=".92"/>
              {/* House icon inside pin */}
              <path d="M13 16V12.8L16 10.5L19 12.8V16H17.2V14.2H14.8V16H13Z" fill="#4f46e5"/>
              {/* Wordmark — tspan pour zéro espace entre LOCALI et ZI */}
              <text
                x="35" y="29"
                fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                fontWeight="800"
                fontSize="26"
                letterSpacing="-0.5"
              >
                <tspan fill="#0f172a">LOCALI</tspan><tspan fill="#6366f1">ZI</tspan>
              </text>
            </svg>
          </Link>

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

          <div className="lz-nav__right">
            <button className="lz-nav__icon-btn" onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <X size={19} /> : <Search size={19} />}
            </button>
            <Link to="/carte" className="lz-nav__icon-btn">
              <Map size={19} />
            </Link>
            <Link to="/creer_annonce" className="btn btn-primary btn-sm btn-round">
              + Publier
            </Link>

            <div className="lz-nav__profile" ref={profileRef}>
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
                        <Link to="/compte"    className="lz-nav__dd-item"><User size={14} /> {t("nav_profile")}</Link>
                        <Link to="/dashboard" className="lz-nav__dd-item"><LayoutDashboard size={14} /> {t("nav_listings")}</Link>
                        <Link to="/favoris"   className="lz-nav__dd-item"><Heart size={14} /> {t("nav_favorites")}</Link>
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

            {/* Language toggle */}
            <button
              className="lz-nav__lang-btn"
              onClick={toggleLang}
              title={lang === "fr" ? "Switch to English" : "Passer en français"}
            >
              <Globe size={14} />
              <span>{lang === "fr" ? "EN" : "FR"}</span>
            </button>

            <button className="lz-nav__hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

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

      {mobileOpen && (
        <div className="lz-nav__mobile animate-fadeIn">
          {NAV_LINK_KEYS.map((n) => (
            <Link key={n.key} to={n.href} className="lz-nav__mob-link">{t(n.key)}</Link>
          ))}
          <Link to="/carte"        className="lz-nav__mob-link"><Map size={15} /> {t("nav_map")}</Link>
          <Link to="/abonnements"  className="lz-nav__mob-link lz-nav__mob-link--gold"><Zap size={15} /> {t("nav_boost")}</Link>
          <div className="lz-nav__mob-sep" />
          {user ? (
            <>
              <Link to="/compte"    className="lz-nav__mob-link"><User size={15} /> {t("nav_profile")}</Link>
              <Link to="/dashboard" className="lz-nav__mob-link"><LayoutDashboard size={15} /> {t("nav_listings")}</Link>
              <Link to="/favoris"   className="lz-nav__mob-link"><Heart size={15} /> {t("nav_favorites")}</Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="lz-nav__mob-link lz-nav__mob-link--admin"><LayoutDashboard size={15} /> {t("nav_admin")}</Link>
              )}
              <Link to="/logout"    className="lz-nav__mob-link lz-nav__mob-link--danger"><LogOut size={15} /> {t("nav_logout")}</Link>
            </>
          ) : (
            <>
              <Link to="/login"    className="lz-nav__mob-link"><LogIn size={15} /> {t("nav_login")}</Link>
              <Link to="/register" className="lz-nav__mob-link"><UserPlus size={15} /> {t("nav_register")}</Link>
            </>
          )}
          <div className="lz-nav__mob-sep"/>
          <button className="lz-nav__mob-lang" onClick={toggleLang}>
            <Globe size={15}/> {lang === "fr" ? "Switch to English" : "Passer en français"}
          </button>
          <Link to="/creer_annonce" className="btn btn-primary btn-full mt-16">+ {t("nav_publish")}</Link>
        </div>
      )}

      <style>{`
        .lz-nav {
          position: sticky; top: 0; z-index: var(--z-nav);
          background: rgba(255,255,255,.9);
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
        .lz-nav__right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .lz-nav__icon-btn {
          width: 36px; height: 36px; border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); transition: all .15s;
        }
        .lz-nav__icon-btn:hover { background: var(--bg); color: var(--text-primary); }
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
        .lz-nav__mob-link--admin { color: var(--primary); font-weight: 600; }

        .lz-nav__searchbar { padding: 10px 24px; border-top: 1px solid var(--border); background: var(--surface); }
        .lz-nav__searchbar-inner { position: relative; max-width: 580px; margin: 0 auto; }
        .lz-nav__search-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .lz-nav__search-inp {
          width: 100%; padding: 11px 40px; border: 1.5px solid var(--border);
          border-radius: var(--r-full); font-size: 15px; font-family: inherit; outline: none;
          transition: border-color .15s;
        }
        .lz-nav__search-inp:focus { border-color: var(--primary); }
        .lz-nav__search-clear { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); padding: 3px; border-radius: 50%; }
        .lz-nav__search-clear:hover { background: var(--bg); }

        /* Language toggle */
        .lz-nav__lang-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 11px; border-radius: var(--r-sm);
          border: 1.5px solid var(--border); background: var(--bg);
          color: var(--text-secondary); font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all .15s;
          white-space: nowrap; letter-spacing: .3px;
        }
        .lz-nav__lang-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
        .lz-nav__mob-lang {
          display: flex; align-items: center; gap: 9px;
          padding: 13px 12px; border-radius: var(--r-sm);
          font-size: 15px; font-weight: 600; color: var(--text-secondary);
          width: 100%; border: none; background: none; cursor: pointer;
          font-family: inherit; transition: all .15s;
        }
        .lz-nav__mob-lang:hover { background: var(--bg); color: var(--primary); }

        .lz-nav__hamburger {
          display: none; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: var(--r-sm);
          color: var(--text-secondary); transition: background .15s;
        }
        .lz-nav__hamburger:hover { background: var(--bg); }

        .lz-nav__mobile {
          position: fixed; inset: 64px 0 0 0;
          background: var(--surface); z-index: calc(var(--z-nav) - 1);
          overflow-y: auto; padding: 16px;
          border-top: 1px solid var(--border);
        }
        .lz-nav__mob-link {
          display: flex; align-items: center; gap: 9px;
          padding: 13px 12px; border-radius: var(--r-sm);
          font-size: 15px; font-weight: 600; color: var(--text-secondary); transition: all .15s;
        }
        .lz-nav__mob-link:hover { background: var(--bg); color: var(--primary); }
        .lz-nav__mob-link--gold   { color: var(--gold); }
        .lz-nav__mob-link--danger { color: var(--danger); }
        .lz-nav__mob-sep { height: 1px; background: var(--border); margin: 8px 0; }

        @media (max-width: 900px) {
          .lz-nav__links { display: none; }
          .lz-nav__hamburger { display: flex; }
        }
        @media (max-width: 600px) {
          .lz-nav__right .btn-primary:not(.btn-full) { display: none; }
        }
      `}</style>
    </>
  );
}
