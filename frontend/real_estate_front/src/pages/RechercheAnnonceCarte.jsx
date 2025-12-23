// src/pages/RechercheAnnonceCarte.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import SearchFilters from "../components/SearchFilters";
import MapView from "../components/MapView"; // ton composant de carte
import "./css/RechercheAnnonceCarte.css";

export default function RechercheAnnonceCarte() {
  const [mapLocation, setMapLocation] = useState({ lat: 36.8, lng: 10.2 }); // Position initiale (ex: Tunis)

  const handleMapLocationChange = (newLocation) => {
    setMapLocation(newLocation);
    // Ici tu peux déclencher une recherche en fonction de la position
    // par exemple appeler ton API pour récupérer les biens proches
  };

  return (
    <Layout>
      {/* Barre de recherche et filtres */}
      {/* <div className="search-filters-container"> */}
        <SearchFilters />
      {/* </div> */}

      {/* Carte fullscreen */}
      <div className="map-fullscreen-container">
        <MapView
          initialPosition={mapLocation}
          onLocationChange={handleMapLocationChange}
        />
      </div>
    </Layout>
  );
}
