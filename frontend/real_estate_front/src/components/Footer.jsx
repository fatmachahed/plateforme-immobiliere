import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Facebook, Instagram, Phone } from "lucide-react";
import Logo from "./Logo";
import PublierAnnonceBtn from "./PublierAnnonceBtn";

/* Icônes réseaux sociaux en SVG inline (non disponibles dans lucide-react) */
function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
    </svg>
  );
}
function TikTokIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.687a8.182 8.182 0 004.773 1.526V6.79a4.831 4.831 0 01-1.003-.104z"/>
    </svg>
  );
}
function YouTubeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="lz-footer">
      <div className="container">
        <div className="lz-footer__grid">

          {/* Brand */}
          <div className="lz-footer__brand">
            <div className="lz-footer__logo">
              <Logo variant="white" height={38} to="/" />
            </div>
            <p>La plateforme immobilière de référence en Tunisie. Achetez, louez et vendez vos biens facilement.</p>
            <div className="lz-footer__social">
              <a href="https://www.facebook.com/profile.php?id=61591506505563" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="https://www.instagram.com/localizi.tn/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="WhatsApp Business"><WhatsAppIcon size={18} /></a>
              <a href="#" aria-label="TikTok"><TikTokIcon size={18} /></a>
              <a href="#" aria-label="YouTube"><YouTubeIcon size={18} /></a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="lz-footer__heading">Explorer</p>
            <ul className="lz-footer__links">
              <li><Link to="/carte?categorie=vente">Acheter</Link></li>
              <li><Link to="/carte?categorie=location">Louer</Link></li>
              <li><Link to="/carte?categorie=vacances">Vacances</Link></li>
              <li><Link to="/vendre">Vendre</Link></li>
              <li><Link to="/carte">Carte interactive</Link></li>
            </ul>
          </div>

          {/* Services — colonne élargie pour éviter les coupures */}
          <div className="lz-footer__col-services">
            <p className="lz-footer__heading">Services</p>
            <ul className="lz-footer__links">
              <li><PublierAnnonceBtn as="a" style={{cursor:"pointer",background:"none",border:"none",padding:0,color:"inherit",fontSize:"inherit",fontFamily:"inherit",textDecoration:"none"}}>Publier une annonce</PublierAnnonceBtn></li>
              <li><Link to="/dashboard">Mon tableau de bord</Link></li>
              <li><Link to="/trouver-un-agent">Trouver un agent</Link></li>
              <li><Link to="/trouver-un-promoteur">Trouver un promoteur</Link></li>
              <li><Link to="/trouver-un-prestataire">Trouver un prestataire</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="lz-footer__heading">Contact</p>
            <ul className="lz-footer__contact">
              <li><MapPin size={15} /><span>La Marsa, Tunis</span></li>
              <li><Mail size={15} /><span>contact@localizi.tn</span></li>
              <li>
                <Phone size={15} />
                <span style={{display:"flex",alignItems:"center",gap:5}}>
                  +216 23 423 000
                  <span style={{
                    fontSize:10, fontWeight:700, background:"#25D366",
                    color:"#fff", borderRadius:4, padding:"1px 5px", letterSpacing:".03em"
                  }}>WhatsApp</span>
                </span>
              </li>
            </ul>
            <ul className="lz-footer__links" style={{marginTop:0}}>
              <li><Link to="/contact">Nous contacter</Link></li>
              <li><Link to="/partenaires">Partenariats</Link></li>
            </ul>
          </div>

          {/* Autres */}
          <div>
            <p className="lz-footer__heading">Autres</p>
            <ul className="lz-footer__links">
              <li><Link to="/dashboard?tab=alertes">🔔 Mes alertes</Link></li>
              <li><Link to="/signaler-probleme">Signaler un problème</Link></li>
              <li><Link to="/comment-ca-marche">Comment ça marche ?</Link></li>
              <li><Link to="/qui-sommes-nous">Qui sommes-nous ?</Link></li>
              <li><Link to="/faq/geolocalisation-immobilier">Pourquoi géolocaliser ?</Link></li>
            </ul>
          </div>
        </div>

        <div className="lz-footer__bottom">
          <p style={{color:"#fff"}}>© {new Date().getFullYear()} Localizi.tn. Tous droits réservés.</p>
          <div className="lz-footer__bottom-links">
            <Link to="/politique-confidentialite">Politique de confidentialité</Link>
            <Link to="/cgu">CGU</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </div>

      <style>{`
        .lz-footer {
          background: var(--text-primary);
          color: rgba(255,255,255,.9);
          padding: 72px 0 0;
          margin-top: auto;
        }
        .lz-footer__grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1.3fr 1.9fr 1.7fr;
          gap: 48px;
          padding-bottom: 56px;
          border-bottom: 1px solid rgba(255,255,255,.12);
        }
        .lz-footer__logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 24px; font-weight: 800; color: white;
          margin-bottom: 16px;
        }
        .lz-footer__brand p { font-size: 15px; line-height: 1.8; color: #fff; font-weight: 500; }
        .lz-footer__social {
          display: flex; gap: 12px; margin-top: 20px;
        }
        .lz-footer__social a {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,.1);
          display: flex; align-items: center; justify-content: center;
          color: #fff; transition: all .15s;
        }
        .lz-footer__social a:hover { background: var(--primary); color: white; }
        .lz-footer__heading {
          font-size: 13px; font-weight: 800; letter-spacing: 1.4px;
          text-transform: uppercase; color: #fff; margin-bottom: 20px;
        }
        .lz-footer__links { display: flex; flex-direction: column; gap: 12px; }
        .lz-footer__links li a, .lz-footer__links li button {
          font-size: 15px; color: #fff; font-weight: 500;
          display: flex; align-items: center; gap: 5px;
          transition: color .15s; opacity: .85;
          white-space: nowrap;
        }
        .lz-footer__links li a:hover, .lz-footer__links li button:hover { color: #a5b4fc; opacity: 1; }
        .lz-footer__contact { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .lz-footer__contact li { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #fff; font-weight: 500; white-space: nowrap; }
        .lz-footer__newsletter { display: flex; gap: 6px; }
        .lz-footer__email-inp {
          flex: 1; padding: 10px 14px;
          background: rgba(255,255,255,.1);
          border: 1.5px solid rgba(255,255,255,.2);
          border-radius: var(--r-sm); color: white;
          font-size: 14px; font-family: inherit; outline: none;
          transition: border-color .15s;
        }
        .lz-footer__email-inp:focus { border-color: var(--primary); }
        .lz-footer__email-inp::placeholder { color: rgba(255,255,255,.5); }
        .lz-footer__email-btn {
          width: 40px; height: 40px; border-radius: var(--r-sm);
          background: var(--primary); color: white;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .lz-footer__email-btn:hover { background: var(--primary-dark); }
        .lz-footer__bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 0; font-size: 14px; color: #fff;
          flex-wrap: wrap; gap: 12px; font-weight: 500;
        }
        .lz-footer__bottom-links { display: flex; gap: 20px; }
        .lz-footer__bottom-links a { color: rgba(255,255,255,.8); transition: color .15s; font-size: 14px; font-weight: 500; }
        .lz-footer__bottom-links a:hover { color: #a5b4fc; }
        .lz-footer__alert-box { }
        .lz-footer__alert-inp {
          width: 100%; padding: 9px 12px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: var(--r-sm); color: white;
          font-size: 13px; font-family: inherit; outline: none;
          transition: border-color .15s; box-sizing: border-box;
        }
        .lz-footer__alert-inp:focus { border-color: #818cf8; }
        .lz-footer__alert-inp::placeholder { color: rgba(255,255,255,.35); }
        .lz-footer__alert-inp option { color: #0f172a; background: #fff; }
        @media (max-width: 1200px) {
          .lz-footer__grid { grid-template-columns: 2fr 1fr 1.3fr 1.9fr; gap: 32px; }
        }
        @media (max-width: 1024px) {
          .lz-footer__grid { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
        @media (max-width: 600px) {
          .lz-footer__grid { grid-template-columns: 1fr; gap: 28px; }
          .lz-footer__bottom { flex-direction: column; align-items: flex-start; }
          .lz-footer__bottom-links { flex-direction: column; gap: 8px; }
        }
      `}</style>
    </footer>
  );
}
