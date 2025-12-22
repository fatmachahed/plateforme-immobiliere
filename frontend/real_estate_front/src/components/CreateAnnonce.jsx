import React, { useState } from "react";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";
import ProgressBar from "./components/ProgressBar";
import "./CreateAnnonce.css";

const CreateAnnonce = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1 />;
      case 2: return <Step2 />;
      case 3: return <Step3 />;
      case 4: return <Step4 />;
      case 5: return <Step5 />;
      default: return <Step1 />;
    }
  };

  return (
    <div className="create-annonce-container">
      <h1>Créer une annonce</h1>

      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <form>
        {renderStep()}

        <div className="step-buttons">
          {currentStep > 1 && (
            <button type="button" className="btn-prev" onClick={prevStep}>
              ← Précédent
            </button>
          )}
          {currentStep < totalSteps && (
            <button type="button" className="btn-next" onClick={nextStep}>
              Suivant →
            </button>
          )}
          {currentStep === totalSteps && (
            <button type="submit" className="btn-submit">
              Créer l'annonce
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateAnnonce;
