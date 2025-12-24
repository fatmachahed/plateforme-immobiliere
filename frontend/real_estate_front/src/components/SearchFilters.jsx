import React, { useState } from "react";
import { Search, Home, SlidersHorizontal, MapPin, DollarSign, Maximize2, Bed, Bath, X, ChevronDown, Filter, ChevronRight, CheckCircle2, Handshake } from "lucide-react";
import "./css/SearchFilters.css";
import useLocalisation from "../hooks/useLocalisation";


export default function SearchFilters() {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [hierarchy, setHierarchy] = useState({
    gouvernorat: "",
    delegation: "",
    localite: ""
  });

const { gouvernorats, delegations, localites } = useLocalisation(hierarchy);
const toggleAdvanced = () => setIsAdvancedOpen(!isAdvancedOpen);

  const propertyTypes = [
    { value: "", label: "Tous", icon: "🏠" },
    { value: "appartement", label: "Appartement", icon: "🏢" },
    { value: "villa", label: "Villa", icon: "🏡" },
    { value: "terrain", label: "Terrain", icon: "🌱" },
    { value: "commercial", label: "Commercial", icon: "🏪" },
    { value: "bureau", label: "Bureau", icon: "💼" }
  ];

  const transactionTypes = [
    { value: "", label: "Acheter/Louer" },
    { value: "vente", label: "À vendre" },
    { value: "location", label: "À louer" }
  ];


  const [addressFilter, setAddressFilter] = useState("");

  const handleHierarchyChange = (level, value) => {
    const newHierarchy = { ...hierarchy };
    
    if (level === "gouvernorat") {
      newHierarchy.gouvernorat = value;
      newHierarchy.delegation = "";
      newHierarchy.localite = "";
    } else if (level === "delegation") {
      newHierarchy.delegation = value;
      newHierarchy.localite = "";
    } else {
      newHierarchy[level] = value;
    }
    
    setHierarchy(newHierarchy);
  };


  return (
    <div className="search-hero">
      {/* En-tête avec titre */}
      <div className="search-header">
        <h1 className="search-title">
          <span className="title-accent">Trouvez</span> votre bien idéal
        </h1>
        <p className="search-subtitle">
          Des milliers de biens exceptionnels vous attendent
        </p>
      </div>

    {/* Statistiques */}
      <div className="search-stats">
        <div className="stat-item">
          <span className="stat-number">2,458</span>
          <span className="stat-label">Biens disponibles</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">98%</span>
          <span className="stat-label">Satisfaction clients</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">24h</span>
          <span className="stat-label">Mise à jour quotidienne</span>
        </div>
      </div>


      {/* Barre de recherche principale - Ligne 1 */}
      <div className="search-main-row">
        {/* Colonne gauche : Filtre hiérarchique */}
        <div className="search-column left-column">
          {/* Recherche par localisation AVEC HIÉRARCHIE */}
          <div className="search-card location-card">
            <div className="card-icon">
              <MapPin size={20} />
            </div>
            <div className="card-content">
              <label className="card-label">Localisation</label>
               {/* Filtre hiérarchique à 3 niveaux */}
<div className="hierarchy-filters">
  {/* Gouvernorat */}
  <div className="hierarchy-level">
    <select
      className="hierarchy-select"
      value={hierarchy.gouvernorat}
      onChange={(e) => handleHierarchyChange("gouvernorat", e.target.value)}
    >
      {(gouvernorats || []).filter(gov =>
        (gov.label || "").toLowerCase().includes((addressFilter || "").toLowerCase())
      ).map(gov => (
        <option key={gov.value} value={gov.value}>
          {gov.icon} {gov.label}
        </option>
      ))}
    </select>
    <ChevronRight size={16} className="hierarchy-arrow" />
  </div>

  {/* Délégation */}
  <div className="hierarchy-level">
    <select
      className="hierarchy-select"
      value={hierarchy.delegation}
      onChange={(e) => handleHierarchyChange("delegation", e.target.value)}
      disabled={!hierarchy.gouvernorat}
    >
      <option value="">
        {hierarchy.gouvernorat
          ? "Toutes les délégations"
          : "Sélectionnez d'abord un gouvernorat"}
      </option>
      {(delegations || []).map((del) => (
        <option key={del.id} value={del.id}>
          {del.nom || ""}
        </option>
      ))}
    </select>
    <ChevronRight size={16} className="hierarchy-arrow" />
  </div>

  {/* Localité */}
  <div className="hierarchy-level">
    <select
      className="hierarchy-select"
      value={hierarchy.localite}
      onChange={(e) => handleHierarchyChange("localite", e.target.value)}
      disabled={!hierarchy.delegation}
    >
      <option value="">
        {hierarchy.delegation
          ? "Toutes les localités"
          : "Sélectionnez d'abord une délégation"}
      </option>
      {(localites || []).map((loc) => (
        <option key={loc.id} value={loc.id}>
          {loc.nom || ""}
        </option>
      ))}
    </select>
  </div>
</div>

{/* Recherche d'adresse libre */}
<div className="address-search">
  <label className="card-label">Adresse</label>
  <input
    type="text"
    placeholder="Ou recherchez par adresse exacte..."
    className="address-input"
  />
</div>

     
         
            </div>
          </div>
        </div>



        

        {/* Colonne droite : Transaction + Type + Prix */}
        <div className="search-column right-column">
          {/* Ligne supérieure : Transaction et Type de bien */}
          <div className="top-row">


                        <div className="price-card">
            <div className="card-icon">
              <DollarSign size={20} />
            </div>
            <div className="card-content">
         
              <div className="price-range-full">
                <div className="price-input-group">
                  <span className="price-label">
                         <label className="card-label">Budget De</label>
                         </span>
                  <input
                    type="number"
                    placeholder="Min"
                    className="price-input-min"
                  />
                  <span className="price-label">à</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="price-input-max"
                  />
                  <select className="price-currency-select">
                    <option>TND</option>
                    <option>EUR</option>
                    <option>USD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>




          </div>

          {/* Ligne inférieure : Prix sur toute la largeur */}
          <div className="price-card">
            <div className="card-icon">
                <Maximize2 size={16} /> 
            </div>
            <div className="card-content">
         
              <div className="price-range-full">
                <div className="price-input-group">
                  <span className="price-label">
                         <label className="card-label">Surface De</label>
                         </span>
                  <input
                    type="number"
                    placeholder="Min"
                    className="price-input-min"
                  />
                  <span className="price-label">à</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="price-input-max"
                  />
                  <select className="price-currency-select">
                    <option>m²</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
   

   


        {/* Bouton de recherche */}
        {/* <button className="search-action-btn">
          <Search size={22} />
          <span>Rechercher</span>
        </button> */}
      </div>

      {/* Filtres avancés - Ligne 2 */}
      <div className="search-advanced-row">

       

                   {/* Type de transaction */}
            <div className="search-card transaction-card">
              <div className="card-icon">
                <Handshake size={20} />
              </div>
              <div className="card-content">
                <label className="card-label">Transaction</label>
                <select className="search-select">
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type de bien */}
            <div className="search-card type-card">
              <div className="card-icon">
                <Home size={20} />
              </div>
              <div className="card-content">
                <label className="card-label">Type de bien</label>
                <select className="search-select">
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>



            <div className="search-card state-card">
            <div className="card-icon">
                <CheckCircle2 size={20} />
            </div>
            <div className="card-content">
                <label className="card-label">État du bien</label>
                <select className="search-select">
                <option value="">Tous les états</option>
                <option value="neuf">🆕 Neuf</option>
                <option value="excellent">✨ Excellent</option>
                <option value="bon">👍 Bon état</option>
                <option value="renover">🔨 À rénover</option>
                <option value="ancien">🏚️ Ancien</option>
                <option value="vieux">🕰️ Vieux</option>
                </select>
            </div>
            </div>




        {/* Surface */}
        {/* <div className="filter-group">
          <label className="filter-label">
            <Maximize2 size={16} /> Surface
          </label>
          <div className="surface-input">
            <input
              type="number"
              placeholder="Min m²"
              className="surface-min"
            />
          </div>
        </div> */}

        {/* Chambres */}
        <div className="filter-group">
          <label className="filter-label">
            <Bed size={16} /> Chambres
          </label>
          <select className="bed-select">
            <option>Toutes</option>
            <option>1+</option>
            <option>2+</option>
            <option>3+</option>
            <option>4+</option>
            <option>5+</option>
          </select>
        </div>

        {/* Salles de bain */}
        <div className="filter-group">
          <label className="filter-label">
            <Bath size={16} /> Salles de bain
          </label>
          <select className="bath-select">
            <option>Toutes</option>
            <option>1+</option>
            <option>2+</option>
            <option>3+</option>
            <option>4+</option>
          </select>
        </div>
        

        {/* Bouton filtres avancés */}
        <button 
          className="advanced-toggle-btn"
          onClick={toggleAdvanced}
        >
          <Filter size={18} />
          <span>Plus de filtres</span>
          <ChevronDown size={16} className={isAdvancedOpen ? "rotate" : ""} />
        </button>
      </div>

      {/* Filtres additionnels (toggle) */}
      {isAdvancedOpen && (
        <div className="additional-filters">
          <div className="filters-grid">
            {/* État du bien */}
            {/* <div className="additional-filter">
              <label>État du bien</label>
              <select>
                <option>Tous</option>
                <option>Neuf</option>
                <option>Excellent</option>
                <option>Bon</option>
                <option>À rénover</option>
              </select>
            </div> */}

            {/* Caractéristiques */}
            <div className="additional-filter">
              <label>Caractéristiques</label>
              <select>
                <option>Toutes</option>
                <option>Avec jardin</option>
                <option>Avec piscine</option>
                <option>Avec garage</option>
                <option>Vue mer</option>
                <option>Ascenseur</option>
              </select>
            </div>

            {/* Année de construction */}
            <div className="additional-filter">
              <label>Année de construction</label>
              <input type="number" placeholder="Après..." />
            </div>

            {/* Tri par */}
            <div className="additional-filter">
              <label>Trier par</label>
              <select>
                <option>Pertinence</option>
                <option>Prix croissant</option>
                <option>Prix décroissant</option>
                <option>Surface</option>
                <option>Date de publication</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tags de filtres actifs */}
      {selectedFilters.length > 0 && (
        <div className="active-filters">
          <div className="active-filters-header">
            <span>Filtres actifs :</span>
            <button className="clear-all">Tout effacer</button>
          </div>
          <div className="filter-tags">
            {selectedFilters.map((filter, index) => (
              <span key={index} className="filter-tag">
                {filter}
                <X size={14} />
              </span>
            ))}
          </div>
        </div>
      )}



      <style jsx>{`
        /* Nouvelle structure en colonnes */
        .search-main-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .search-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .left-column {
          min-width: 0;
        }

        .right-column {
          min-width: 0;
        }

        .top-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        /* Carte de prix pleine largeur */
        .price-card {
          background: white;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          gap: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 2px solid transparent;
          grid-column: 1 / -1;
        }

        .price-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
          border-color: #80a1d4;
        }

        .price-range-full {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .price-input-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .price-label {
          color: #666;
          font-weight: 500;
          font-size: 14px;
          white-space: nowrap;
        }

        .price-input-min,
        .price-input-max {
          flex: 1;
          min-width: 120px;
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
          background:white;
          color:#666;
        }

        .price-input-min:focus,
        .price-input-max:focus {
          border-color: #80a1d4;
          box-shadow: 0 0 0 3px rgba(128, 161, 212, 0.2);
        }

        .price-currency-select {
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          min-width: 80px;
          background: white;
        }

        .price-currency-select:focus {
          border-color: #80a1d4;
        }

        .price-hint {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .hint-text {
          font-size: 12px;
          color: #999;
          font-style: italic;
        }

        /* Styles spécifiques pour la hiérarchie */
        .hierarchy-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .hierarchy-level {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .hierarchy-select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        .hierarchy-select:focus {
          border-color: #80a1d4;
          box-shadow: 0 0 0 3px rgba(128, 161, 212, 0.2);
        }

        .hierarchy-select:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .hierarchy-arrow {
          color: #80a1d4;
          margin: 0 4px;
          flex-shrink: 0;
        }

        .hierarchy-level:last-child .hierarchy-arrow {
          display: none;
        }

        .address-search {
          margin-top: 12px;
        }

        .address-input {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
          background:white;
          color:#666;
        }

        .address-input:focus {
          border-color: #80a1d4;
          box-shadow: 0 0 0 3px rgba(128, 161, 212, 0.2);
        }

        .address-input::placeholder {
          color: #999;
          font-size: 13px;
        }

        /* Ajustement de la ligne avancée (enlever le prix) */
        .search-advanced-row {
        display:grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr auto;
          gap:16px;

            justify-content: space-between;


        }

        .search-advanced-row .filter-group:nth-child(1) {
          /* Surface */
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .search-main-row {
            grid-template-columns: 1fr;
          }

          .top-row {
            grid-template-columns: 1fr 1fr;
          }

          .hierarchy-filters {
            flex-direction: column;
            gap: 10px;
          }

          .hierarchy-level {
            width: 100%;
          }

          .hierarchy-arrow {
            transform: rotate(90deg);
            margin: 4px 0;
          }

          .price-input-group {
            flex-direction: column;
            align-items: stretch;
          }

          .price-input-min,
          .price-input-max {
            min-width: 100%;
    
          }
        }

        @media (max-width: 768px) {
          .search-main-row {
            grid-template-columns: 1fr;
          }

          .top-row {
            grid-template-columns: 1fr;
          }

          .search-advanced-row {
            grid-template-columns: 1fr;
          }

          .hierarchy-filters {
            gap: 8px;
          }

          .hierarchy-select,
          .address-input {
            font-size: 13px;
            padding: 8px 10px;
          }
        }
      `}</style>
    </div>
  );
}