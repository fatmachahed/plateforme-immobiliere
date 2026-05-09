// Step3.js
import React from "react";
import useLocalisation from "../hooks/useLocalisation";

const Step3 = ({ formData, onChange, nextStep, prevStep }) => {
  // Préparer la hiérarchie pour le hook
  const hierarchy = {
    gouvernorat: formData.gouvernorat,
    delegation: formData.delegation,
    localite: formData.localite
  };

  const { gouvernorats, delegations, localites, loading } = useLocalisation(hierarchy);

  // Gestion du changement dans la hiérarchie
  const handleHierarchyChange = (level, value) => {
    if (level === "gouvernorat") {
      onChange("gouvernorat", value);
      onChange("delegation", "");
      onChange("localite", "");
    } else if (level === "delegation") {
      onChange("delegation", value);
      onChange("localite", "");
    } else {
      onChange("localite", value);
    }
  };

  return (
    <div className="form-step">
      <h2 className="step-title">Localisation</h2>

      {/* Gouvernorat */}
      <div className="form-group">
        <label>Gouvernorat *</label>
        <select
          value={formData.gouvernorat}
          onChange={(e) => handleHierarchyChange("gouvernorat", e.target.value)}
        >
          <option value="">Sélectionner</option>
          {gouvernorats.map((gov) => (
            <option key={gov.value} value={gov.value}>
              {gov.label}
            </option>
          ))}
        </select>
      </div>

      {/* Délégation */}
      <div className="form-group">
        <label>Délégation</label>
        <select
          value={formData.delegation}
          onChange={(e) => handleHierarchyChange("delegation", e.target.value)}
          disabled={!formData.gouvernorat || loading}
        >
          <option value="">
            {formData.gouvernorat ? "Toutes les délégations" : "Sélectionnez d'abord un gouvernorat"}
          </option>
          {delegations.map((del) => (
            <option key={del.id} value={del.id}>
              {del.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Localité */}
      <div className="form-group">
        <label>Localité</label>
        <select
          value={formData.localite}
          onChange={(e) => handleHierarchyChange("localite", e.target.value)}
          disabled={!formData.delegation || loading}
        >
          <option value="">
            {formData.delegation ? "Toutes les localités" : "Sélectionnez d'abord une délégation"}
          </option>
          {localites.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Adresse libre */}
      <div className="form-group">
        <label>Adresse *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </div>

      {/* Navigation */}
      <div className="form-navigation">
        <button className="nav-btn secondary" onClick={prevStep}>
          Précédent
        </button>
        <button className="nav-btn primary" onClick={nextStep}>
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Step3;