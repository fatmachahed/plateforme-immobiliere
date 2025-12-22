import React from "react";

const ProgressBar = ({ currentStep, totalSteps }) => {
  const percent = (currentStep / totalSteps) * 100;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-fill" style={{ width: `${percent}%` }}>
        Étape {currentStep} / {totalSteps}
      </div>
    </div>
  );
};

export default ProgressBar;
