const Step5 = ({ formData, onChange, prevStep }) => {
  return (
    <div className="form-step">
      <h2 className="step-title">Photos</h2>

      <div className="form-group">
        <label>Image principale *</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange("image_principale", e.target.files[0])}
        />
      </div>

      <div className="form-group">
        <label>Images supplémentaires</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            onChange("images", Array.from(e.target.files))
          }
        />
      </div>

      <div className="form-navigation">
        <button className="nav-btn secondary" onClick={prevStep}>
          Précédent
        </button>
        <button className="nav-btn submit" type="submit">
          Créer l’annonce
        </button>
      </div>
    </div>
  );
};

export default Step5;
