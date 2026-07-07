import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { ToastProvider } from "./components/Toast";
import CookieBanner    from "./components/CookieBanner";
import { LanguageProvider } from "./contexts/LanguageContext";

/* Pages */
import Home             from "./pages/Home";
import CartePage        from "./pages/CartePage";
import Abonnements      from "./pages/Abonnements";
import AnnonceDetail    from "./pages/AnnonceDetail";
import RechercheAnnonce from "./pages/RechercheAnnonce";
import CreerAnnonce     from "./pages/CreerAnnonce";
import Compte           from "./pages/Compte";
import Dashboard        from "./pages/Dashboard";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import VerifyEmail      from "./pages/VerifyEmail";
import Logout           from "./pages/Logout";
import Apropos          from "./pages/Apropos";
import Contact          from "./pages/Contact";
import AdminDashboard   from "./pages/AdminDashboard";
import Favoris          from "./pages/Favoris";
import EditAnnonce      from "./pages/EditAnnonce";
import ForgotPassword   from "./pages/ForgotPassword";
import ResetPassword    from "./pages/ResetPassword";
import BoosterPage             from "./pages/BoosterPage";
import MonAbonnement           from "./pages/MonAbonnement";
import QuiSommesNous          from "./pages/QuiSommesNous";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import Comparateur              from "./pages/Comparateur";
import FAQ                      from "./pages/FAQ";
import CGU                      from "./pages/CGU";
import TrouverUnAgent           from "./pages/TrouverUnAgent";
import AgentProfile             from "./pages/AgentProfile";
import CommentCaMarche          from "./pages/CommentCaMarche";
import SignalerProbleme         from "./pages/SignalerProbleme";
import Partenaires              from "./pages/Partenaires";
import MentionsLegales          from "./pages/MentionsLegales";
import Cookies                  from "./pages/Cookies";
import VendrePage               from "./pages/VendrePage";
import AgenceAgents             from "./pages/AgenceAgents";
import AgenceOnboarding         from "./pages/AgenceOnboarding";
import PromoteurOnboarding      from "./pages/PromoteurOnboarding";
import TrouverUnPromoteur       from "./pages/TrouverUnPromoteur";
import TrouverUnPrestataire     from "./pages/TrouverUnPrestataire";
import Geolocalisation          from "./pages/Geolocalisation";
import NotFound                 from "./pages/NotFound";

function AnnonceRedirect() {
  const { id } = useParams();
  return <Navigate to={`/carte?annonce=${id}`} replace />;
}

/* Lien email alerte : déconnecte silencieusement puis recharge la page carte en mode invité */
function VoirAnnonceAlert() {
  const { id } = useParams();
  /* Vider localStorage ET sessionStorage (Login utilise l'un ou l'autre selon "Se souvenir de moi") */
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  /* Rechargement complet — vide tout le state React en mémoire (Navbar, userData, etc.) */
  window.location.replace(`/carte?annonce=${id}`);
  return null;
}

function App() {
  return (
    <LanguageProvider>
    <ToastProvider>
      <Router>
        <Routes>
          {/* Principales */}
          <Route path="/"              element={<Home />} />
          <Route path="/carte"         element={<CartePage />} />
          <Route path="/abonnements"   element={<Abonnements />} />

          {/* Recherche / annonces */}
          <Route path="/recherche_annonce"       element={<RechercheAnnonce />} />
          <Route path="/recherche_annonce_carte" element={<CartePage />} />
          <Route path="/annonce/:id"             element={<AnnonceRedirect />} />
          <Route path="/voir-annonce/:id"        element={<VoirAnnonceAlert />} />
          <Route path="/creer_annonce"           element={<CreerAnnonce />} />
          <Route path="/modifier_annonce/:id"    element={<EditAnnonce />} />
          <Route path="/booster"                element={<BoosterPage />} />
          <Route path="/mon-abonnement"         element={<MonAbonnement />} />
          <Route path="/comparateur"            element={<Comparateur />} />

          {/* Compte */}
          <Route path="/compte"    element={<Compte />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/favoris"   element={<Favoris />} />
          <Route path="/login"            element={<Login />} />
          <Route path="/register"         element={<Register />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/logout"           element={<Logout />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />
          <Route path="/reset-password"   element={<ResetPassword />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Info */}
          <Route path="/apropos"                   element={<Apropos />} />
          <Route path="/contact"                   element={<Contact />} />
          <Route path="/qui-sommes-nous"            element={<QuiSommesNous />} />
          <Route path="/politique-confidentialite"  element={<PolitiqueConfidentialite />} />
          <Route path="/faq"                        element={<FAQ />} />
          <Route path="/cgu"                        element={<CGU />} />
          <Route path="/trouver-un-agent"           element={<TrouverUnAgent />} />
          <Route path="/agent/:id"                  element={<AgentProfile />} />
          <Route path="/promoteur/:id"              element={<AgentProfile />} />
          <Route path="/comment-ca-marche"          element={<CommentCaMarche />} />
          <Route path="/signaler-probleme"          element={<SignalerProbleme />} />
          <Route path="/partenaires"               element={<Partenaires />} />
          <Route path="/mentions-legales"          element={<MentionsLegales />} />
          <Route path="/cookies"                   element={<Cookies />} />
          <Route path="/vendre"                    element={<VendrePage />} />
          <Route path="/espace-agence/agents"      element={<AgenceAgents />} />
          <Route path="/espace-agence/onboarding"    element={<Navigate to="/compte?tab=onboarding_agence" replace />} />
          <Route path="/espace-promoteur/onboarding" element={<Navigate to="/compte?tab=onboarding_promoteur" replace />} />
          <Route path="/trouver-un-promoteur"      element={<TrouverUnPromoteur />} />
          <Route path="/trouver-un-prestataire"   element={<TrouverUnPrestataire />} />
          <Route path="/faq/geolocalisation-immobilier" element={<Geolocalisation />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <CookieBanner />
    </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
