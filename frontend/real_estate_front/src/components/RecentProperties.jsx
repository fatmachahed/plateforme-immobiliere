// src/components/RecentProperties.jsx
import React from "react";
import { MapPin, Bed, Bath, Maximize, ArrowRight } from "lucide-react";

const RecentProperties = ({ properties }) => {
  return (
    <>
        <div className="properties-grid">
          {properties.map((property) => (
            <div key={property.id} className="property-card">
              <div className="property-image">
                <img src={property.image} alt={property.title} />
                <div className="property-badge">Nouveau</div>
              </div>
              <div className="property-details">
                <h3>{property.title}</h3>
                <p className="property-location">
                  <MapPin size={16} /> {property.location}
                </p>
                <div className="property-features">
                  {property.beds && <span><Bed size={16} /> {property.beds} chambres</span>}
                  {property.baths && <span><Bath size={16} /> {property.baths} SDB</span>}
                  <span><Maximize size={16} /> {property.area}m²</span>
                </div>
                <div className="property-footer">
                  <div className="property-price">{property.price} DT</div>
                  <button className="view-button">Voir détails</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="view-all-container">
          <a href="/recherche_annonce" className="view-all-button">
            Voir toutes les propriétés <ArrowRight size={20} />
          </a>
        </div>
        </>
 
  );
};

export default RecentProperties;
