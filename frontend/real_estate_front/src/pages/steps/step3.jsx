const Step3 = ({ formData, onChange, nextStep, prevStep }) => {
  return (
    <div className="form-step">
      <h2 className="step-title">Localisation</h2>

      <div className="form-group">
        <label>Gouvernorat *</label>
        <select
          value={formData.gouvernorat}
          onChange={(e) => onChange("gouvernorat", e.target.value)}
        >
          <option value="">Sélectionner</option>
          <option value="tunis">Tunis</option>
          <option value="ariana">Ariana</option>
          <option value="sousse">Sousse</option>
        </select>
      </div>

      <div className="form-group">
        <label>Adresse *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
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

export default Step3;
