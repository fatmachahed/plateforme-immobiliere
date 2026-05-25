import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook, Instagram, Twitter, Zap, Home, ArrowRight } from "lucide-react";
import Logo from "./Logo";

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
            <p>La plateforme immobilière N°1 en Tunisie. Achetez, louez et vendez vos biens immobiliers facilement.</p>
            <div className="lz-footer__social">
              <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="lz-footer__heading">Explorer</p>
            <ul className="lz-footer__links">
              <li><Link to="/carte?categorie=vente">Acheter</Link></li>
              <li><Link to="/carte?categorie=location">Louer</Link></li>
              <li><Link to="/carte?categorie=vacances">Vacances</Link></li>
              <li><Link to="/carte">Carte interactive</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="lz-footer__heading">Services</p>
            <ul className="lz-footer__links">
              <li><Link to="/creer_annonce">Publier une annonce</Link></li>
              {/* <li><Link to="/abonnements"><Zap size={12} /> Booster mon annonce</Link></li> */}
              <li><Link to="/dashboard">Mon tableau de bord</Link></li>
              <li><Link to="/apropos">À propos</Link></li>
              <li><Link to="/qui-sommes-nous">Qui sommes-nous</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="lz-footer__heading">Contact</p>
            <ul className="lz-footer__contact">
              <li><MapPin size={15} /><span>La Marsa, Tunis</span></li>
              <li><Mail size={15} /><span>xpertiseimmo@gmail.com</span></li>
              <li><Phone size={15} /><span>+216 23 423 000</span></li>
            </ul>

            {/* Newsletter mini */}
            <div className="lz-footer__newsletter">
              <input type="email" placeholder="Votre email…" className="lz-footer__email-inp" />
              <button className="lz-footer__email-btn"><ArrowRight size={16} /></button>
            </div>
          </div>
        </div>

        <div className="lz-footer__bottom">
          <p>© {new Date().getFullYear()} Localizi. Tous droits réservés.</p>
          <div className="lz-footer__bottom-links">
            <Link to="/politique-confidentialite">Politique de confidentialité</Link>
            <Link to="/qui-sommes-nous">Qui sommes-nous</Link>
            <a href="#">CGU</a>
          </div>
        </div>
      </div>

      <style>{`
        .lz-footer {
          background: var(--text-primary);
          color: rgba(255,255,255,.6);
          padding: 64px 0 0;
          margin-top: auto;
        }
        .lz-footer__grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .lz-footer__logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 22px; font-weight: 800; color: white;
          margin-bottom: 14px;
        }
        .lz-footer__brand p { font-size: 14px; line-height: 1.7; }
        .lz-footer__social {
          display: flex; gap: 12px; margin-top: 20px;
        }
        .lz-footer__social a {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,.6); transition: all .15s;
        }
        .lz-footer__social a:hover { background: var(--primary); color: white; }
        .lz-footer__heading {
          font-size: 12px; font-weight: 700; letter-spacing: 1.2px;
          text-transform: uppercase; color: white; margin-bottom: 18px;
        }
        .lz-footer__links { display: flex; flex-direction: column; gap: 10px; }
        .lz-footer__links li a {
          font-size: 14px; color: rgba(255,255,255,.6);
          display: flex; align-items: center; gap: 5px;
          transition: color .15s;
        }
        .lz-footer__links li a:hover { color: white; }
        .lz-footer__contact { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .lz-footer__contact li { display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .lz-footer__newsletter { display: flex; gap: 6px; }
        .lz-footer__email-inp {
          flex: 1; padding: 9px 12px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: var(--r-sm); color: white;
          font-size: 13px; font-family: inherit; outline: none;
          transition: border-color .15s;
        }
        .lz-footer__email-inp:focus { border-color: var(--primary); }
        .lz-footer__email-inp::placeholder { color: rgba(255,255,255,.35); }
        .lz-footer__email-btn {
          width: 36px; height: 36px; border-radius: var(--r-sm);
          background: var(--primary); color: white;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .lz-footer__email-btn:hover { background: var(--primary-dark); }
        .lz-footer__bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 0; font-size: 13px;
          flex-wrap: wrap; gap: 12px;
        }
        .lz-footer__bottom-links { display: flex; gap: 20px; }
        .lz-footer__bottom-links a { color: rgba(255,255,255,.4); transition: color .15s; font-size: 13px; }
        .lz-footer__bottom-links a:hover { color: rgba(255,255,255,.8); }
        @media (max-width: 1024px) {
          .lz-footer__grid { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
        @media (max-width: 600px) {
          .lz-footer__grid { grid-template-columns: 1fr; gap: 28px; }
          .lz-footer__bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  );
}
