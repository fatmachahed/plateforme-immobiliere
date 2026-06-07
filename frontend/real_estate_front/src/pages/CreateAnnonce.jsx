import React, { useState } from "react";
import Layout from "../components/Layout";

import Step1 from "./steps/step1";
import Step2 from "./steps/step2";
import Step3 from "./steps/step3";
import Step4 from "./steps/step4";
import Step5 from "./steps/step5";

const CreateAnnonce = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    type_bien: "",
    categorie: "",
    etat_bien: "",
    nb_pieces: 0,
    nb_chambres: 0,
    nb_salles_bain: 0,
    vue_mer: false,
    vue_montagne: false,
    vue_foret: false,
    gouvernorat: "",
    address: "",
    titre: "",
    superficie: "",
    prix: "",
    devise: "DT",
    description: "",
    image_principale: null,
    images: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, 5));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  return (
    <Layout>
      {currentStep === 1 && (
        <Step1
          formData={formData}
          onChange={handleInputChange}
          nextStep={nextStep}
        />
      )}

      {currentStep === 2 && (
        <Step2
          formData={formData}
          onChange={handleInputChange}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}

      {currentStep === 3 && (
        <Step3
          formData={formData}
          onChange={handleInputChange}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}

      {currentStep === 4 && (
        <Step4
          formData={formData}
          onChange={handleInputChange}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}

      {currentStep === 5 && (
        <Step5
          formData={formData}
          onChange={handleInputChange}
          prevStep={prevStep}
        />
      )}
    </Layout>
  );
};

export default CreateAnnonce;
