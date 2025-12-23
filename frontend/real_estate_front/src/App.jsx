import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Accueil from "./pages/Accueil";
import Apropos from "./pages/Apropos";
import Contact from "./pages/Contact";
import RechercheAnnonce from "./pages/RechercheAnnonce";
import RechercheAnnonceCarte from "./pages/RechercheAnnonceCarte"
import CreerAnnonce from "./pages/CreerAnnonce";
import Compte from "./pages/Compte";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import "leaflet/dist/leaflet.css";


function App() {
  const user = null; // ou l'objet user réel
  return (
    <Router>
      {/* <Header user={user} /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/" element={<Accueil />} /> */}
        <Route path="/apropos" element={<Apropos />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/recherche_annonce" element={<RechercheAnnonce />} />
        <Route path="/recherche_annonce_carte" element={<RechercheAnnonceCarte />} />
        <Route path="/creer_annonce" element={<CreerAnnonce />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
      {/* <Footer /> */}
    </Router>
  );
}

export default App;
