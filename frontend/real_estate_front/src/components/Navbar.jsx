import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Menu, X, User, LogIn, UserPlus, LogOut,
  LayoutDashboard, Zap, ChevronDown, ChevronRight, Map, Heart, Globe,
  Home, Key, Umbrella, Phone, PlusCircle, Bell, Users, AlertTriangle, Building2,
  HelpCircle, Info, Mail, Wrench, Facebook, Instagram, Youtube
} from "lucide-react";
import API_URL from "../config";
import { useLanguage } from "../contexts/LanguageContext";
import Logo from "./Logo";

/* Icônes réseaux sociaux non disponibles dans lucide-react */
function WhatsAppIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
    </svg>
  );
}
function TikTokIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.687a8.182 8.182 0 004.773 1.526V6.79a4.831 4.831 0 01-1.003-.104z"/>
    </svg>
  );
}

const NAV_LINK_KEYS = [
  { key: "nav_buy",      href: "/carte?categorie=vente",    icon: Building2  },
  { key: "nav_rent",     href: "/carte?categorie=location", icon: Key        },
  { key: "nav_vacation", href: "/carte?categorie=vacances", icon: Umbrella   },
  { key: "nav_sell",     href: "/vendre",                   icon: PlusCircle, label: "Vente" },
];

const PROS_LINKS = [
  { href: "/trouver-un-agent",        icon: Users,    label: "Trouver un agent" },
  { href: "/trouver-un-promoteur",    icon: Building2,label: "Trouver un promoteur" },
  { href: "/trouver-un-prestataire",  icon: Wrench,   label: "Trouver un prestataire" },
];

export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [prosOpen,      setProsOpen]      = useState(false);
  const [mobProsOpen,   setMobProsOpen]   = useState(false);
  const prosRef = useRef(null);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchVal,     setSearchVal]     = useState("");
  const [mobAccOpen,    setMobAccOpen]    = useState(false);  // sous-menu profil
  const profileRef = useRef(null);
  const location   = useLocation();
  const isProsActive = PROS_LINKS.some(p => location.pathname === p.href);
  const isAccActive  = location.pathname.startsWith("/compte") || location.pathname === "/admin";
  const { lang, toggleLang, t } = useLanguage();
  const [showPublishWarn, setShowPublishWarn] = useState(false);
  const [quotaBlock,      setQuotaBlock]      = useState(false);
  const [quotaBlockInfo,  setQuotaBlockInfo]  = useState({ current: 0, max: 0 });
  const [menuClosing,    setMenuClosing]    = useState(false);
  const navigate = useNavigate();

  /* Vérifie le quota avant d'ouvrir la modal de publication */
  const handlePublishClick = async () => {
    try {
      const token_ = localStorage.getItem("token");
      const user_  = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
      if (token_ && user_) {
        const DEFAULT_QUOTAS = { particulier: 3, agence: 50, promoteur: 30, partenaire: 50, admin: 999 };
        const quotas = (() => { try { return JSON.parse(localStorage.getItem("lz_quotas") || "{}"); } catch { return {}; } })();
        const role   = user_?.role || "particulier";
        const maxQ   = quotas[role] ?? DEFAULT_QUOTAS[role] ?? 3;
        if (maxQ < 999) {
          const res = await fetch(`${API_URL}/annonces/`, { headers: { Authorization: `Bearer ${token_}` } });
          if (res.ok) {
            const myAnnonces = await res.json();
            const active = (myAnnonces || []).filter(a => ["approuvee","en_attente"].includes(a.status)).length;
            if (active >= maxQ) {
              setQuotaBlockInfo({ current: active, max: maxQ });
              setQuotaBlock(true);
              setShowPublishWarn(true);
              return;
            }
          }
        }
      }
    } catch { /* réseau – on laisse passer */ }
    setQuotaBlock(false);
    setShowPublishWarn(true);
  };

  /* Auto-ouvre les sous-menus si on est déjà sur une de leurs pages */
  useEffect(() => {
    if (mobileOpen) {
      if (isProsActive) setMobProsOpen(true);
      if (isAccActive)  setMobAccOpen(true);
    }
  }, [mobileOpen]); // eslint-disable-line

  /* Permet aux pages Login/Register d'ouvrir ce drawer via événement global */
  useEffect(() => {
    const openMenu = () => setMobileOpen(true);
    window.addEventListener('localizi:openMobileMenu', openMenu);
    return () => window.removeEventListener('localizi:openMobileMenu', openMenu);
  }, []);

  const closeMenu = () => {
    setMenuClosing(true);
    setTimeout(() => { setMobileOpen(false); setMenuClosing(false); }, 240);
  };
  const closeAndNavigate = (href) => (e) => {
    e.preventDefault();
    closeMenu();
    setTimeout(() => { navigate(href); window.scrollTo(0, 0); }, 250);
  };

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
      if (prosRef.current && !prosRef.current.contains(e.target)) setProsOpen(false);
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
                {t(n.key) || n.label}
              </Link>
            ))}

            {/* Dropdown Professionnels */}
            <div className="lz-nav__pros" ref={prosRef}>
              <button
                className={`lz-nav__link lz-nav__pros-btn${PROS_LINKS.some(p => isActive(p.href)) ? " lz-nav__link--active" : ""}`}
                onClick={() => setProsOpen(v => !v)}
              >
                Professionnels <ChevronDown size={13} style={{ transform: prosOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}/>
              </button>
              {prosOpen && (
                <div className="lz-nav__pros-menu animate-fadeInDown">
                  {PROS_LINKS.map(p => (
                    <Link key={p.href} to={p.href} className="lz-nav__pros-item" onClick={() => setProsOpen(false)}>
                      <p.icon size={14}/> {p.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* ── Desktop right actions ── */}
          <div className="lz-nav__right">
            {/* Search — hidden on mobile */}
            <button className="lz-nav__icon-btn lz-nav__desktop-only" onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <X size={19} /> : <Search size={19} />}
            </button>

            {/* Map — si on est sur /carte : bascule vue carte via event, sinon navigue vers /carte */}
            {location.pathname === "/carte" ? (
              <button
                className="lz-nav__icon-btn lz-nav__desktop-only"
                title="Vue carte"
                onClick={() => window.dispatchEvent(new CustomEvent("localizi-switch-to-carte"))}
              >
                <Map size={19} />
              </button>
            ) : (
              <Link to="/carte" className="lz-nav__icon-btn lz-nav__desktop-only">
                <Map size={19} />
              </Link>
            )}

            {/* Publish CTA — hidden on mobile (shown in drawer instead) */}
            <button onClick={() => handlePublishClick()} className="btn btn-primary btn-sm btn-round lz-nav__desktop-only">
              + Publier annonce
            </button>

            {/* ── Bell notification (demandes de contact anonyme) ── */}
            {user && (
              <Link to="/compte?tab=contacts" className="lz-nav__bell lz-nav__desktop-only" title="Demandes de contact">
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
                        <Link to="/compte?tab=profil"    className="lz-nav__dd-item"><User size={14} /> Mon profil</Link>
                        <Link to="/compte?tab=annonces&statut=approuvee"  className="lz-nav__dd-item"><LayoutDashboard size={14} /> Mes annonces</Link>
                        <Link to="/compte?tab=contacts"  className="lz-nav__dd-item"><Bell size={14} /> Demandes reçues</Link>
                        <Link to="/compte?tab=favoris"   className="lz-nav__dd-item"><Heart size={14} /> Mes favoris</Link>
                        <Link to="/booster" className="lz-nav__dd-item" style={{color:"#b45309",fontWeight:700}}><Zap size={14} style={{color:"#f59e0b"}}/> Booster mes annonces</Link>
                        {user?.role === "agence" && (
                          <Link to="/compte?tab=equipe"  className="lz-nav__dd-item"><Users size={14} /> Mon équipe</Link>
                        )}
                        {user?.role === "admin" && (
                          <Link to="/admin" className="lz-nav__dd-item lz-nav__dd-item--admin"><LayoutDashboard size={14} /> Admin</Link>
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

            {/* ── Icône carte rapide — mobile only ── */}
            <Link to="/carte" className="lz-nav__map-shortcut" aria-label="Carte">
              <Map size={20}/>
            </Link>

            {/* ── Hamburger — mobile only ── */}
            <button
              className="lz-nav__hamburger"
              onClick={() => mobileOpen ? closeMenu() : setMobileOpen(true)}
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
      {(mobileOpen || menuClosing) && (
        <div className={`lz-mob-drawer ${menuClosing ? "animate-slideOut" : "animate-slideIn"}`}>
          <div className="lz-mob-list">

            {/* Accueil — toujours en premier */}
            <Link to="/" onClick={closeAndNavigate("/")}
              className={`lz-mob-row${isActive("/") ? " lz-mob-row--active" : ""}`}>
              <Home size={17}/> Accueil
            </Link>

            {/* Navigation principale avec icônes */}
            {NAV_LINK_KEYS.map((n) => (
              <Link key={n.key} to={n.href} onClick={closeAndNavigate(n.href)}
                className={`lz-mob-row${isActive(n.href) ? " lz-mob-row--active" : ""}`}>
                <n.icon size={17}/> {t(n.key) || n.label}
              </Link>
            ))}

            {/* Professionnels (sous-menu mobile) */}
            <button className="lz-mob-row lz-mob-row--profile" onClick={() => setMobProsOpen(v => !v)}>
              <span className="lz-mob-row__left"><Users size={17}/> Professionnels</span>
              <ChevronDown size={15} style={{ transform: mobProsOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}/>
            </button>
            {mobProsOpen && (
              <div className="lz-mob-submenu">
                {PROS_LINKS.map(p => (
                  <Link key={p.href} to={p.href} onClick={closeAndNavigate(p.href)}
                    className={`lz-mob-subrow${location.pathname === p.href ? " lz-mob-subrow--active" : ""}`}>
                    <p.icon size={14}/> {p.label}
                  </Link>
                ))}
              </div>
            )}
            <Link to="/carte" onClick={closeAndNavigate("/carte")} className={`lz-mob-row${location.pathname==="/carte"?" lz-mob-row--active":""}`}><Map size={17}/> {t("nav_map") || "Carte"}</Link>

            {/* Bouton Publier — même style que le CTA bas, positionné sous Carte */}
            <div style={{padding:"6px 12px"}}>
              <button onClick={() => { closeMenu(); setTimeout(() => handlePublishClick(), 260); }} className="btn btn-primary lz-mob-cta__btn">
                <PlusCircle size={16}/> {t("nav_publish") || "Publier une annonce"}
              </button>
            </div>

            <div className="lz-mob-sep"/>

            {/* Profil */}
            {user ? (
              <>
                <button className="lz-mob-row lz-mob-row--profile" onClick={() => setMobAccOpen(v => !v)}>
                  <span className="lz-mob-row__left">
                    {user?.profile_picture
                      ? <img src={user.profile_picture} alt="profil" style={{width:22,height:22,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
                      : <User size={17}/>
                    }
                    {" "}{user.username}
                  </span>
                  <ChevronDown size={15} style={{ transform: mobAccOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}/>
                </button>
                {mobAccOpen && (
                  <div className="lz-mob-submenu">
                    {[
                      { to:"/compte?tab=profil",   label:"Mon profil",       Ico:User,            badge:0           },
                      { to:"/compte?tab=annonces", label:"Mes annonces",     Ico:LayoutDashboard, badge:0           },
                      { to:"/compte?tab=contacts", label:"Demandes reçues",  Ico:Bell,            badge:unreadCount },
                      { to:"/compte?tab=favoris",  label:"Mes favoris",      Ico:Heart,           badge:0           },
                      { to:"/compte?tab=alertes",  label:"Mes alertes",      Ico:Bell,            badge:0           },
                    ].map(({to,label,Ico,badge}) => {
                      const tabMatch = location.pathname === "/compte" &&
                        new URLSearchParams(location.search).get("tab") === new URLSearchParams(to.split("?")[1]).get("tab");
                      return (
                        <Link key={to} to={to} onClick={closeAndNavigate(to)}
                          className={`lz-mob-subrow${tabMatch ? " lz-mob-subrow--active" : ""}`}>
                          <Ico size={14}/> {label}
                          {badge>0 && <span style={{marginLeft:"auto",background:"#ef4444",color:"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"1px 6px",minWidth:16,textAlign:"center",flexShrink:0}}>{badge}</span>}
                        </Link>
                      );
                    })}
                    {user?.role === "agence" && (
                      <Link to="/compte?tab=equipe" onClick={closeAndNavigate("/compte?tab=equipe")}
                        className={`lz-mob-subrow${location.pathname==="/compte"&&new URLSearchParams(location.search).get("tab")==="equipe"?" lz-mob-subrow--active":""}`}>
                        <Users size={14}/> Mon équipe
                      </Link>
                    )}
                    {user?.role === "admin" && (
                      <Link to="/admin" onClick={closeAndNavigate("/admin")}
                        className={`lz-mob-subrow lz-mob-subrow--admin${location.pathname==="/admin"?" lz-mob-subrow--active":""}`}>
                        <LayoutDashboard size={14}/> Admin
                      </Link>
                    )}
                    <Link to="/logout" onClick={closeAndNavigate("/logout")} className="lz-mob-subrow lz-mob-subrow--danger"><LogOut size={14}/> {t("nav_logout") || "Déconnexion"}</Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link to="/login"    onClick={closeAndNavigate("/login")}    className="lz-mob-row"><LogIn    size={17}/> {t("nav_login")    || "Se connecter"}</Link>
                <Link to="/register" onClick={closeAndNavigate("/register")} className="lz-mob-row"><UserPlus size={17}/> {t("nav_register") || "Créer un compte"}</Link>
              </>
            )}

            <div className="lz-mob-sep"/>

            {/* Pages supplémentaires */}
            {[
              { to:"/signaler-probleme",     label:"Signaler un problème",  Ico:AlertTriangle },
              { to:"/comment-ca-marche",     label:"Comment ça marche ?",   Ico:HelpCircle    },
              { to:"/qui-sommes-nous",       label:"Qui sommes-nous ?",     Ico:Info          },
              { to:"/contact",               label:"Nous contacter",         Ico:Mail          },
            ].map(({to,label,Ico}) => (
              <Link key={to} to={to} onClick={closeAndNavigate(to)}
                className={`lz-mob-row${isActive(to) ? " lz-mob-row--active" : ""}`}>
                <Ico size={17}/> {label}
              </Link>
            ))}

          </div>

          {/* ── Zone fixe en bas : Réseaux sociaux ── */}
          <div className="lz-mob-bottom">
            <div className="lz-mob-socials">
              <p className="lz-mob-socials__label">Suivez-nous</p>
              <div className="lz-mob-socials__row">
                <a href="https://www.facebook.com/profile.php?id=61591506505563" target="_blank" rel="noopener noreferrer" className="lz-mob-social-icon" aria-label="Facebook"><Facebook size={17}/></a>
                <a href="https://www.instagram.com/localizi.tn/" target="_blank" rel="noopener noreferrer" className="lz-mob-social-icon" aria-label="Instagram"><Instagram size={17}/></a>
                <a href="#" className="lz-mob-social-icon" aria-label="WhatsApp"><WhatsAppIcon size={17}/></a>
                <a href="#" className="lz-mob-social-icon" aria-label="TikTok"><TikTokIcon size={17}/></a>
                <a href="https://www.youtube.com/@localizi" target="_blank" rel="noopener noreferrer" className="lz-mob-social-icon" aria-label="YouTube"><Youtube size={17}/></a>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Overlay backdrop */}
      {(mobileOpen || menuClosing) && (
        <div className="lz-mob-backdrop" onClick={closeMenu} />
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
          height: 64px; max-width: 1600px;
          margin: 0 auto; padding: 0 32px;
        }
        .lz-nav__logo svg { height: 44px; width: auto; display: block; }

        /* ── Desktop links ── */
        .lz-nav__links { display: flex; align-items: center; gap: 4px; flex: 1; }
        .lz-nav__link {
          padding: 8px 12px; border-radius: var(--r-sm);
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

        /* ── Dropdown Professionnels ── */
        .lz-nav__pros { position: relative; }
        .lz-nav__pros-btn {
          display: inline-flex; align-items: center; gap: 4px; background: none; border: none;
          cursor: pointer; font-family: inherit;
        }
        .lz-nav__pros-menu {
          position: absolute; top: calc(100% + 10px); left: 0;
          background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,.10); padding: 6px; min-width: 220px; z-index: 200;
        }
        .lz-nav__pros-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 7px; font-size: 13.5px;
          color: var(--text); text-decoration: none; transition: background .12s;
        }
        .lz-nav__pros-item:hover { background: var(--surface); color: var(--primary); }

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
          background: #fff; z-index: 9600;
          overflow-y: auto; overflow-x: hidden;
          scrollbar-gutter: stable;
        }
        .lz-mob-drawer::-webkit-scrollbar { width: 6px; }
        .lz-mob-drawer::-webkit-scrollbar-track { background: #fff; }
        .lz-mob-drawer::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 4px; }
        /* Zone bas — flux normal, suite du menu */
        .lz-mob-bottom {
          padding: 12px 8px 28px;
          border-top: 1.5px solid #f1f5f9;
          margin-top: 6px;
        }
        /* Zone bas — flux normal, après le dernier élément du menu */
        .lz-mob-bottom {
          padding: 16px 12px 28px;
          border-top: 1.5px solid #f1f5f9;
          margin-top: 8px;
          background: #fff;
          box-sizing: border-box;
          width: 100%;
        }
        .lz-mob-cta__btn {
          border-radius: 12px; padding: 11px 14px; font-size: 14px; font-weight: 700;
          display: flex !important; align-items: center; justify-content: center; gap: 8px;
          width: 100%; box-sizing: border-box; margin-bottom: 12px;
        }

        /* Flat list */
        .lz-mob-list {
          display: flex; flex-direction: column; padding: 0 8px;
          box-sizing: border-box; width: 100%; overflow-x: hidden;
        }

        /* Each row */
        .lz-mob-row {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 12px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          color: #334155; transition: background .12s, color .12s;
          border: none; background: none; cursor: pointer;
          font-family: inherit; text-decoration: none;
          width: 100%; box-sizing: border-box; min-width: 0;
        }
        .lz-mob-row:hover       { background: #f1f5f9; color: #6366f1; }
        .lz-mob-row--active     { color: #6366f1 !important; background: #eef2ff !important; font-weight: 700 !important; }
        .lz-mob-subrow--active  { color: #6366f1 !important; background: #eef2ff !important; font-weight: 700 !important; border-radius: 8px; }
        .lz-mob-row--gold       { color: #b45309; }
        .lz-mob-row--gold:hover { background: #fef9ec; color: #92400e; }
        .lz-mob-row--profile    { justify-content: space-between; }
        .lz-mob-row--publish-cta { color: #6366f1; font-weight: 700; }
        .lz-mob-row--publish-cta:hover { background: #eef2ff; color: #4338ca; }
        .lz-mob-row__left       { display: flex; align-items: center; gap: 10px; }

        /* Separator */
        .lz-mob-sep { height: 1px; background: #e2e8f0; margin: 6px 12px; }

        /* Sub-rows (profil sous-menu) */
        .lz-mob-submenu {
          padding-left: 16px; border-left: 2px solid #e2e8f0; margin: 0 12px 4px 20px;
          box-sizing: border-box; overflow-x: hidden;
        }
        .lz-mob-subrow {
          display: flex; align-items: center; gap: 9px;
          padding: 11px 10px; border-radius: 8px;
          font-size: 14px; font-weight: 500; color: #475569;
          transition: background .12s, color .12s;
          width: 100%; box-sizing: border-box; min-width: 0;
          text-decoration: none;
        }
        .lz-mob-subrow:hover             { background: #f1f5f9; color: #334155; }
        .lz-mob-subrow--danger           { color: #ef4444; }
        .lz-mob-subrow--danger:hover     { background: #fef2f2; }
        .lz-mob-subrow--admin            { color: #6366f1; font-weight: 700; }
        .lz-mob-subrow--admin:hover      { background: #eef2ff; }

        /* Réseaux sociaux */
        .lz-mob-socials { padding: 8px 20px 20px; text-align: center; }
        .lz-mob-socials__divider { height: 1px; background: #f1f5f9; margin-bottom: 18px; }
        .lz-mob-socials__label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .1em; margin: 0 0 14px; }
        .lz-mob-socials__row { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .lz-mob-social-icon { width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #475569; transition: background .15s, color .15s, transform .15s; text-decoration: none; }
        .lz-mob-social-icon:hover { background: var(--primary, #6366f1); color: #fff; transform: translateY(-2px); }

        /* Backdrop */
        .lz-mob-backdrop {
          position: fixed; inset: 0; z-index: 9500;
          background: rgba(15, 23, 42, .45);
        }

        /* ── Responsive breakpoints ── */
        @media (max-width: 1100px) {
          .lz-nav__links        { display: none !important; }
          .lz-nav__hamburger    { display: flex !important; }
          .lz-nav__desktop-only { display: none !important; }
          .lz-nav__map-shortcut { display: flex !important; }

          /* Barre plus compacte + ancrage pour centrer le logo */
          .lz-nav__inner   { height: 54px; padding: 0 10px; position: relative; }

          /* Logo centré horizontalement et plus petit */
          .lz-nav__logo      { position: absolute; left: 50%; transform: translateX(-50%); }
          .lz-nav__logo svg  { height: 30px !important; }

          /* Hamburger collé à droite */
          .lz-nav__right     { margin-left: auto; }
          .lz-nav__hamburger { margin-right: 0; }

          /* Le drawer démarre sous la barre réduite */
          .lz-mob-drawer { top: 54px; }
        }
        @media (min-width: 1101px) {
          .lz-nav__hamburger { display: none !important; }
          .lz-mob-drawer     { display: none !important; }
          .lz-mob-backdrop   { display: none !important; }
        }

        /* Animation drawer */
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(100%); }
        }
        .animate-slideIn  { animation: slideIn  .24s cubic-bezier(.4,0,.2,1) both; }
        .animate-slideOut { animation: slideOut .22s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInDown { animation: fadeInDown .18s ease both; }
        /* Icône carte rapide — mobile only */
        .lz-nav__map-shortcut {
          display: none;
          align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          color: var(--text); text-decoration: none;
          transition: background .15s, color .15s;
        }
        .lz-nav__map-shortcut:hover { background: var(--surface); color: var(--primary); }
      `}</style>

      {/* ── Popup publication / quota atteint ── */}
      {showPublishWarn && (
        <div style={{
          position:"fixed", inset:0, zIndex:99999,
          background:"rgba(15,23,42,.55)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }} onClick={() => { setShowPublishWarn(false); setQuotaBlock(false); }}>
          <div style={{
            background:"#fff", borderRadius:20, padding:"28px 32px 0",
            maxWidth:480, width:"100%", maxHeight:"90vh",
            display:"flex", flexDirection:"column",
            boxShadow:"0 24px 64px rgba(0,0,0,.18)",
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{textAlign:"center", marginBottom:12, position:"relative"}}>
              <div style={{display:"flex", justifyContent:"center", marginBottom:5}}>
                <Logo variant="color" height={20} to={null}/>
              </div>
              <div style={{fontSize:13, fontWeight:800, color:"#0f172a"}}>
                {quotaBlock ? "Limite de publication atteinte" : "Publier une annonce"}
              </div>
              <div style={{fontSize:10.5, color:"#94a3b8", marginTop:2}}>
                {quotaBlock ? "Votre quota d'annonces actives est épuisé" : "Informations importantes"}
              </div>
              <button onClick={() => { setShowPublishWarn(false); setQuotaBlock(false); }} style={{
                position:"absolute", top:0, right:0,
                background:"#f1f5f9", border:"none", cursor:"pointer", borderRadius:8,
                width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center",
                color:"#64748b",
              }}>
                <X size={13} strokeWidth={2.5}/>
              </button>
            </div>

            {/* Icône */}
            <div style={{display:"flex", justifyContent:"center", marginBottom:10}}>
              <div style={{width:52,height:52,borderRadius:"50%",background: quotaBlock ? "#fef2f2" : "#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <AlertTriangle size={26} color={quotaBlock ? "#ef4444" : "#475569"} strokeWidth={1.8}/>
              </div>
            </div>

            {quotaBlock ? (
              /* ── Contenu quota dépassé ── */
              <>
                <h2 style={{fontSize:16,fontWeight:900,color:"#0f172a",margin:"0 0 10px",textAlign:"center",lineHeight:1.2}}>
                  Vous avez atteint votre limite
                </h2>
                <p style={{fontSize:12,color:"#374151",lineHeight:1.65,margin:"0 0 14px",textAlign:"center"}}>
                  Votre profil autorise <strong>{quotaBlockInfo.max} annonce{quotaBlockInfo.max>1?"s":""} active{quotaBlockInfo.max>1?"s":""}</strong> au maximum.<br/>
                  Vous en avez actuellement <strong style={{color:"#ef4444"}}>{quotaBlockInfo.current}</strong>.
                </p>
                <div style={{background:"#fef9ec",border:"1.5px solid #fde68a",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:11.5,color:"#92400e",lineHeight:1.6}}>
                  Pour publier une nouvelle annonce, <strong>supprimez</strong> ou <strong>retirez de la carte</strong> une annonce existante depuis votre tableau de bord.
                </div>
                <div style={{display:"flex", gap:8, paddingBottom:24}}>
                  <button onClick={() => { setShowPublishWarn(false); setQuotaBlock(false); }} style={{
                    flex:1, padding:"10px 8px", borderRadius:10,
                    border:"1.5px solid #e2e8f0", background:"#fff",
                    fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit",
                  }}>Fermer</button>
                  <button onClick={() => { setShowPublishWarn(false); setQuotaBlock(false); navigate("/compte?tab=annonces"); }} style={{
                    flex:1, padding:"10px 8px", borderRadius:10,
                    border:"none", background:"#6366f1", color:"#fff",
                    fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  }}>Gérer mes annonces</button>
                </div>
              </>
            ) : (
              /* ── Contenu normal ── */
              <>
                <h2 style={{fontSize:15,fontWeight:900,color:"#0f172a",margin:"0 0 8px",textAlign:"center",lineHeight:1.2}}>
                  Avant de publier
                </h2>
                <p style={{fontSize:11.5,color:"#374151",lineHeight:1.6,margin:"0 0 16px",textAlign:"center"}}>
                  En publiant votre annonce sur Localizi.tn, la carte affichera la <strong>position exacte</strong> du bien immobilier.
                  Assurez-vous d'être le propriétaire ou le mandataire exclusif du bien.
                  Vous pouvez déplacer la position sur la carte si nécessaire.
                </p>
                <div style={{display:"flex", gap:8, paddingBottom:6}}>
                  <button onClick={() => setShowPublishWarn(false)} style={{
                    flex:1, padding:"10px 8px", borderRadius:10,
                    border:"1.5px solid #e2e8f0", background:"#fff",
                    fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit",
                  }}>Annuler</button>
                  <button onClick={() => { setShowPublishWarn(false); navigate("/creer_annonce"); }} style={{
                    flex:1, padding:"10px 8px", borderRadius:10,
                    border:"none", background:"#0f172a", color:"#fff",
                    fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  }}>Je publie</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
