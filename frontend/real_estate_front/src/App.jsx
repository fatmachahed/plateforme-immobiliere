import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { ToastProvider } from "./components/Toast";
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
import Logout           from "./pages/Logout";
import Apropos          from "./pages/Apropos";
import Contact          from "./pages/Contact";
import AdminDashboard   from "./pages/AdminDashboard";
import Favoris          from "./pages/Favoris";
import EditAnnonce      from "./pages/EditAnnonce";
import ForgotPassword   from "./pages/ForgotPassword";
import ResetPassword    from "./pages/ResetPassword";
import BoosterPage             from "./pages/BoosterPage";
import QuiSommesNous          from "./pages/QuiSommesNous";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";

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
          <Route path="/annonce/:id"             element={<AnnonceDetail />} />
          <Route path="/creer_annonce"           element={<CreerAnnonce />} />
          <Route path="/modifier_annonce/:id"    element={<EditAnnonce />} />
          <Route path="/booster"                element={<BoosterPage />} />

          {/* Compte */}
          <Route path="/compte"    element={<Compte />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/favoris"   element={<Favoris />} />
          <Route path="/login"            element={<Login />} />
          <Route path="/register"         element={<Register />} />
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
        </Routes>
      </Router>
    </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
