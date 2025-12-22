import { CheckCircle2 } from "lucide-react";

const options = [
  { key: "vue_mer", label: "Vue sur mer 🌊" },
  { key: "vue_montagne", label: "Vue montagne ⛰️" },
  { key: "jardin", label: "Jardin 🌳" },
  { key: "garage", label: "Garage 🚗" },
  { key: "climatisation", label: "Climatisation ❄️" },
];

const Step2 = ({ formData, onChange, nextStep, prevStep }) => {
  return (
    <div className="form-step">
      <h2 className="step-title">Caractéristiques</h2>

      <div className="checkbox-grid">
        {options.map(opt => (
          <label key={opt.key} className="checkbox-card">
            <input
              type="checkbox"
              checked={formData[opt.key]}
              onChange={() => onChange(opt.key, !formData[opt.key])}
            />
            <span>{opt.label}</span>
            {formData[opt.key] && <CheckCircle2 size={16} />}
          </label>
        ))}
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

export default Step2;
