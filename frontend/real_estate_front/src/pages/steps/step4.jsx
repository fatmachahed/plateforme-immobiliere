const Step4 = ({ formData, onChange, nextStep, prevStep }) => {
  return (
    <div className="form-step">
      <h2 className="step-title">Présentation</h2>

      <div className="form-group">
        <label>Titre *</label>
        <input
          type="text"
          value={formData.titre}
          onChange={(e) => onChange("titre", e.target.value)}
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Superficie (m²)</label>
          <input
            type="number"
            value={formData.superficie}
            onChange={(e) => onChange("superficie", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Prix</label>
          <input
            type="number"
            value={formData.prix}
            onChange={(e) => onChange("prix", e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          rows="5"
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>

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

export default Step4;
