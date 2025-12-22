import { Bed, Bath } from "lucide-react";

const Step1 = ({ formData, onChange, nextStep }) => {
  return (
    <div className="form-step">
      <h2 className="step-title">Informations générales</h2>

      <div className="form-grid">
        <div className="form-group">
          <label>Type de bien *</label>
          <select
            value={formData.type_bien}
            onChange={(e) => onChange("type_bien", e.target.value)}
          >
            <option value="">Sélectionner</option>
            <option value="appartement">Appartement</option>
            <option value="villa">Villa</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>

        <div className="form-group">
          <label>Type d’offre *</label>
          <select
            value={formData.categorie}
            onChange={(e) => onChange("categorie", e.target.value)}
          >
            <option value="">Sélectionner</option>
            <option value="vente">Vente</option>
            <option value="location">Location</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>État du bien *</label>
        <select
          value={formData.etat_bien}
          onChange={(e) => onChange("etat_bien", e.target.value)}
        >
          <option value="">Sélectionner</option>
          <option value="neuf">Neuf</option>
          <option value="bon">Bon état</option>
          <option value="renover">À rénover</option>
        </select>
      </div>

      <div className="form-navigation">
        <button className="nav-btn primary" onClick={nextStep}>
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Step1;
