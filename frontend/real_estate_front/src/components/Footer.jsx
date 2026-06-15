import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Facebook, Instagram, Twitter } from "lucide-react";
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
            <p>La plateforme immobilière de référence en Tunisie. Achetez, louez et vendez vos biens facilement.</p>
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
              <li><Link to="/dashboard">Mon tableau de bord</Link></li>
              <li><Link to="/trouver-un-agent">Trouver un agent</Link></li>
              <li><Link to="/partenaires">Partenariats</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="lz-footer__heading">Contact</p>
            <ul className="lz-footer__contact">
              <li><MapPin size={15} /><span>La Marsa, Tunis</span></li>
              <li><Mail size={15} /><span>xpertiseimmo@gmail.com</span></li>
            </ul>
            <ul className="lz-footer__links" style={{marginTop:12}}>
              <li><Link to="/contact">Nous contacter</Link></li>
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
          grid-template-columns: 2fr 1fr 1fr 1.5fr 1.8fr;
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
        .lz-footer__links li a {
          font-size: 15px; color: #fff; font-weight: 500;
          display: flex; align-items: center; gap: 5px;
          transition: color .15s; opacity: .85;
        }
        .lz-footer__links li a:hover { color: #a5b4fc; opacity: 1; }
        .lz-footer__contact { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .lz-footer__contact li { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #fff; font-weight: 500; }
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
          .lz-footer__grid { grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 32px; }
        }
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
