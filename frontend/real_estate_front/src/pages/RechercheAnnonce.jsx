import React from "react";
import Layout from "../components/Layout";
import RecentProperties from "../components/RecentProperties";
import "./css/RechercheAnnonce.css"
import SearchFilters from "../components/SearchFilters";


// Exemple de données à afficher
const recentProperties = [
  {
    id: 1,
    title: "Villa Moderne à La Marsa",
    price: "850 000",
    location: "La Marsa, Tunis",
    beds: 4,
    baths: 3,
    area: 320,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500"
  },
  {
    id: 2,
    title: "Appartement Centre-Ville",
    price: "320 000",
    location: "Centre-Ville, Tunis",
    beds: 3,
    baths: 2,
    area: 150,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500"
  },
  {
    id: 3,
    title: "Terrain Résidentiel",
    price: "180 000",
    location: "Sousse",
    beds: null,
    baths: null,
    area: 500,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500"
  },
    {
    id: 4,
    title: "Terrain Résidentiel",
    price: "180 000",
    location: "Sousse",
    beds: null,
    baths: null,
    area: 500,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500"
  }
];




export default function RechercheAnnonce() {
  return (
    <Layout>
      {/* 🔍 Barre de recherche + filtres */}
      <SearchFilters />

      {/* 🏠 Résultats */}
    <section className="properties-section">
      <div className="containerRecherche">
        <RecentProperties properties={recentProperties} />
      </div>
    </section>
    </Layout>
  );
}

