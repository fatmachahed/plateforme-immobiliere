import React, { useState, useEffect } from "react";
import { 
  Home, Building2, MapPin, Camera, ChevronRight, ChevronLeft,
  Check, X, Upload, Trash2, Eye, Bed, Bath, Maximize2, DollarSign,
  CheckCircle2, XCircle, Loader, Sparkles, Wand2
} from "lucide-react";
import Layout from "../components/Layout"
import MapView from "../components/MapView";
import AIDescriptionModal from '../components/AIDescriptionModal';

const CreateListingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [mapLocation, setMapLocation] = useState({
    lat: 36.8065,
    lng: 10.1815,
    address: 'Tunis, Tunisie'
  });
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    type_bien: "",
    categorie: "",
    etat_bien: "",
    type_terrain: "",
    titre_foncier: "",
    type_appartement: "",
    etage: "",
    type_villa: "",
    type_option_villa: "",
    nb_pieces: 0,
    nb_chambres: 0,
    nb_salles_bain: 0,
    
    // Step 2 - Caractéristiques
    vue_mer: false,
    vue_montagne: false,
    vue_foret: false,
    jardin: false,
    terrasse: false,
    balcon: false,
    ascenseur: false,
    garage: false,
    parking: false,
    cellier: false,
    meuble: false,
    cuisine_equipee: false,
    climatisation: false,
    
    // Step 3 - Localisation
    gouvernorat: "",
    delegation: "",
    localite: "",
    address: "Tunis, Tunisie",
    latitude: "36.8065",
    longitude: "10.1815",
    
    // Step 4 - Présentation
    titre: "",
    superficie: "",
    prix: "",
    devise: "TND",
    description: "",
    
    // Step 5 - Images
    image_principale: null,
    images: []
  });

  const [imageValidation, setImageValidation] = useState({});

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Options pour les selects
  const typeBienOptions = [
    { value: "", label: "Sélectionner..." },
    { value: "appartement", label: "Appartement" },
    { value: "villa", label: "Villa" },
    { value: "terrain", label: "Terrain" },
    { value: "commercial", label: "Local commercial" }
  ];

  const categorieOptions = [
    { value: "", label: "Sélectionner..." },
    { value: "vente", label: "Vente" },
    { value: "location", label: "Location" }
  ];

  const etatBienOptions = [
    { value: "", label: "Sélectionner..." },
    { value: "neuf", label: "Neuf" },
    { value: "bon", label: "Bon état" },
    { value: "renover", label: "À rénover" }
  ];

  const gouvernoratOptions = [
    { value: "", label: "Sélectionner..." },
    { value: "tunis", label: "Tunis" },
    { value: "ariana", label: "Ariana" },
    { value: "ben_arous", label: "Ben Arous" },
    { value: "manouba", label: "Manouba" },
    { value: "nabeul", label: "Nabeul" },
    { value: "sousse", label: "Sousse" }
  ];

  // Fonction pour générer une description rapide avec IA
  const generateQuickAIDescription = async () => {
    if (!formData.titre && !formData.type_bien) {
      alert("Veuillez d'abord remplir le titre et le type de bien");
      return;
    }

    setIsAILoading(true);
    
    // Simuler une requête API (remplacez par votre véritable appel API)
    setTimeout(() => {
      const characteristics = [];
      if (formData.vue_mer) characteristics.push("vue mer");
      if (formData.vue_montagne) characteristics.push("vue montagne");
      if (formData.jardin) characteristics.push("jardin");
      if (formData.terrasse) characteristics.push("terrasse");
      if (formData.balcon) characteristics.push("balcon");
      if (formData.ascenseur) characteristics.push("ascenseur");
      if (formData.garage) characteristics.push("garage");
      if (formData.climatisation) characteristics.push("climatisation");
      if (formData.meuble) characteristics.push("meublé");
      if (formData.cuisine_equipee) characteristics.push("cuisine équipée");

      let generatedDescription = `🏡 **${formData.titre || formData.type_bien} exceptionnel !**\n\n`;

      // Superficie
      if (formData.superficie) {
        generatedDescription += `✨ Surface généreuse de ${formData.superficie} m²\n`;
      }

      // Pièces et chambres
      if (formData.nb_pieces > 0) {
        generatedDescription += `🚪 Composition : ${formData.nb_pieces} pièce${formData.nb_pieces > 1 ? 's' : ''}`;
        if (formData.nb_chambres > 0) {
          generatedDescription += ` dont ${formData.nb_chambres} chambre${formData.nb_chambres > 1 ? 's' : ''}`;
        }
        generatedDescription += `\n`;
      }

      // Caractéristiques
      if (characteristics.length > 0) {
        generatedDescription += `🌟 Points forts : ${characteristics.join(', ')}\n\n`;
      }

      // Description détaillée
      generatedDescription += `📝 **Description :**\n`;
      generatedDescription += `Ce ${formData.type_bien || 'bien'} ${formData.categorie === 'location' ? 'à louer' : 'à vendre'} `;
      
      if (formData.gouvernorat) {
        generatedDescription += `situé ${formData.address ? `à ${formData.address}` : `dans le gouvernorat de ${formData.gouvernorat}`} `;
      }
      
      generatedDescription += `est un véritable coup de cœur !\n\n`;
      
      if (formData.etat_bien) {
        generatedDescription += `🏗️ État : ${formData.etat_bien === 'neuf' ? 'Neuf - Livraison immédiate' : 
          formData.etat_bien === 'bon' ? 'Excellent état - Prêt à emménager' : 
          'À rénover - Grand potentiel'}\n`;
      }
      
      if (formData.prix) {
        generatedDescription += `💰 Prix : ${formData.prix} ${formData.devise}\n\n`;
      }
      
      generatedDescription += `💎 Une opportunité rare sur le marché ! Contactez-nous rapidement pour plus d'informations et une visite.`;

      setFormData(prev => ({
        ...prev,
        description: generatedDescription
      }));
      setIsAILoading(false);
    }, 2000);
  };

  // Fonction appelée quand la position sur la carte change
  const handleMapLocationChange = async (newLocation) => {
    setMapLocation(newLocation);
    
    setFormData(prev => ({
      ...prev,
      latitude: newLocation.lat.toString(),
      longitude: newLocation.lng.toString(),
      address: newLocation.address,
      fullAddress: newLocation.address
    }));
  };

  // Fonction pour géolocaliser l'utilisateur
  const handleGeolocate = async () => {
    if (navigator.geolocation) {
      setIsGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
            );
            
            if (response.ok) {
              const data = await response.json();
              let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              
              if (data && data.address) {
                const addressParts = [];
                if (data.address.road) addressParts.push(data.address.road);
                if (data.address.house_number) addressParts.push(data.address.house_number);
                if (data.address.city || data.address.town || data.address.village) {
                  addressParts.push(data.address.city || data.address.town || data.address.village);
                }
                if (data.address.country) addressParts.push(data.address.country);
                address = addressParts.join(', ');
              }
              
              handleMapLocationChange({
                lat: latitude,
                lng: longitude,
                address: address
              });
            }
          } catch (error) {
            handleMapLocationChange({
              lat: latitude,
              lng: longitude,
              address: `Position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
          }
          setIsGeolocating(false);
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          alert('Impossible de vous géolocaliser. Vérifiez vos permissions.');
          setIsGeolocating(false);
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'latitude' && !isNaN(parseFloat(value))) {
      setMapLocation(prev => ({
        ...prev,
        lat: parseFloat(value)
      }));
    }
    
    if (field === 'longitude' && !isNaN(parseFloat(value))) {
      setMapLocation(prev => ({
        ...prev,
        lng: parseFloat(value)
      }));
    }
    
    if (field === 'address') {
      setMapLocation(prev => ({
        ...prev,
        address: value
      }));
    }
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const incrementValue = (field) => {
    if (formData[field] < 15) {
      handleInputChange(field, formData[field] + 1);
    }
  };

  const decrementValue = (field) => {
    if (formData[field] > 0) {
      handleInputChange(field, formData[field] - 1);
    }
  };

  const handleImageUpload = (e, isMain = false) => {
    const files = Array.from(e.target.files);
    
    if (isMain) {
      const file = files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setImageValidation(prev => ({
            ...prev,
            main: { valid: false, message: "Fichier trop volumineux (>5MB)" }
          }));
          return;
        }
        
        setTimeout(() => {
          setImageValidation(prev => ({
            ...prev,
            main: { valid: true, message: "Image valide" }
          }));
        }, 1000);
        
        handleInputChange('image_principale', file);
      }
    } else {
      const currentImages = formData.images.length;
      const remainingSlots = 10 - currentImages;
      const newImages = files.slice(0, remainingSlots);
      
      newImages.forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) {
          setImageValidation(prev => ({
            ...prev,
            [currentImages + index]: { 
              valid: false, 
              message: "Fichier >5MB"
            }
          }));
          return;
        }
        
        setTimeout(() => {
          setImageValidation(prev => ({
            ...prev,
            [currentImages + index]: { 
              valid: true,
              message: "Image valide"
            }
          }));
        }, 1000 + index * 500);
      });
      
      handleInputChange('images', [...formData.images, ...newImages]);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    handleInputChange('images', newImages);
    
    const newValidation = { ...imageValidation };
    delete newValidation[index];
    setImageValidation(newValidation);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Annonce créée avec succès !");
  };

  const handleAIConfirm = (aiDescription) => {
    setFormData(prev => ({
      ...prev,
      description: aiDescription
    }));
    setIsAIModalOpen(false);
  };

  return (
    <Layout>
      <div className="create-listing-container">
        <div className="form-wrapper">
          <h1 className="form-title">
            <Home size={32} />
            Créer une annonce
            <span className="ai-badge">
              <Sparkles size={16} />
              IA Assistée
            </span>
          </h1>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              Étape {currentStep} sur {totalSteps}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Informations générales */}
            {currentStep === 1 && (
              <div className="form-step">
                <h2 className="step-title">
                  <Building2 size={24} />
                  Informations générales
                </h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Type de bien <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.type_bien}
                      onChange={(e) => handleInputChange('type_bien', e.target.value)}
                    >
                      {typeBienOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Type d'offre <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.categorie}
                      onChange={(e) => handleInputChange('categorie', e.target.value)}
                    >
                      {categorieOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.type_bien === 'appartement' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Type de logement</label>
                      <select 
                        className="form-select"
                        value={formData.type_appartement}
                        onChange={(e) => handleInputChange('type_appartement', e.target.value)}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="studio">Studio</option>
                        <option value="f2">F2</option>
                        <option value="f3">F3</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Étage du bien</label>
                      <select 
                        className="form-select"
                        value={formData.etage}
                        onChange={(e) => handleInputChange('etage', e.target.value)}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="rdc">Rez-de-chaussée</option>
                        <option value="1">1er étage</option>
                        <option value="2">2ème étage</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    État du bien <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.etat_bien}
                    onChange={(e) => handleInputChange('etat_bien', e.target.value)}
                  >
                    {etatBienOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Compteurs */}
                <div className="counters-section">
                  <div className="counter-group">
                    <label className="form-label">
                      <Bed size={18} /> Pièces
                    </label>
                    <div className="counter-controls">
                      <button 
                        type="button" 
                        className="counter-btn"
                        onClick={() => decrementValue('nb_pieces')}
                      >
                        −
                      </button>
                      <span className="counter-value">{formData.nb_pieces}</span>
                      <button 
                        type="button" 
                        className="counter-btn"
                        onClick={() => incrementValue('nb_pieces')}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="counter-group">
                    <label className="form-label">
                      <Bed size={18} /> Chambres
                    </label>
                    <div className="counter-controls">
                      <button 
                        type="button" 
                        className="counter-btn"
                        onClick={() => decrementValue('nb_chambres')}
                      >
                        −
                      </button>
                      <span className="counter-value">{formData.nb_chambres}</span>
                      <button 
                        type="button" 
                        className="counter-btn"
                        onClick={() => incrementValue('nb_chambres')}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="counter-group">
                    <label className="form-label">
                      <Bath size={18} /> Salles de bain
                    </label>
                    <div className="counter-controls">
                      <button 
                        type="button" 
                        className="counter-btn"
                        onClick={() => decrementValue('nb_salles_bain')}
                      >
                        −
                      </button>
                      <span className="counter-value">{formData.nb_salles_bain}</span>
                      <button 
                        type="button" 
                        className="counter-btn"
                        onClick={() => incrementValue('nb_salles_bain')}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Caractéristiques */}
            {currentStep === 2 && (
              <div className="form-step">
                <h2 className="step-title">Caractéristiques du bien</h2>
                
                <div className="characteristics-section">
                  <h3 className="section-subtitle">
                    <span className="section-icon">🌊</span>
                    Vue
                  </h3>
                  <div className="checkbox-grid">
                    {[
                      { key: 'vue_mer', icon: '🌊', label: 'Vue sur mer' },
                      { key: 'vue_montagne', icon: '⛰️', label: 'Vue sur montagne' },
                      { key: 'vue_foret', icon: '🌲', label: 'Vue sur forêt' }
                    ].map(item => (
                      <label key={item.key} className={`checkbox-card ${formData[item.key] ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={formData[item.key]}
                          onChange={() => handleCheckboxChange(item.key)}
                        />
                        <div className="checkbox-content">
                          <span className="checkbox-icon">{item.icon}</span>
                          <span className="checkbox-label">{item.label}</span>
                          {formData[item.key] && <CheckCircle2 className="check-icon" size={20} />}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="characteristics-section">
                  <h3 className="section-subtitle">
                    <span className="section-icon">🏡</span>
                    Espaces extérieurs
                  </h3>
                  <div className="checkbox-grid">
                    {[
                      { key: 'jardin', icon: '🏡', label: 'Jardin' },
                      { key: 'terrasse', icon: '☀️', label: 'Terrasse' },
                      { key: 'balcon', icon: '🪴', label: 'Balcon' }
                    ].map(item => (
                      <label key={item.key} className={`checkbox-card ${formData[item.key] ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={formData[item.key]}
                          onChange={() => handleCheckboxChange(item.key)}
                        />
                        <div className="checkbox-content">
                          <span className="checkbox-icon">{item.icon}</span>
                          <span className="checkbox-label">{item.label}</span>
                          {formData[item.key] && <CheckCircle2 className="check-icon" size={20} />}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="characteristics-section">
                  <h3 className="section-subtitle">
                    <span className="section-icon">⚙️</span>
                    Commodités
                  </h3>
                  <div className="checkbox-grid">
                    {[
                      { key: 'ascenseur', icon: '🛗', label: 'Ascenseur' },
                      { key: 'garage', icon: '🚗', label: 'Garage' },
                      { key: 'parking', icon: '🅿️', label: 'Parking' },
                      { key: 'cellier', icon: '📦', label: 'Cellier' },
                      { key: 'meuble', icon: '🛋️', label: 'Meublé' },
                      { key: 'cuisine_equipee', icon: '🍳', label: 'Cuisine équipée' },
                      { key: 'climatisation', icon: '❄️', label: 'Climatisation' }
                    ].map(item => (
                      <label key={item.key} className={`checkbox-card ${formData[item.key] ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={formData[item.key]}
                          onChange={() => handleCheckboxChange(item.key)}
                        />
                        <div className="checkbox-content">
                          <span className="checkbox-icon">{item.icon}</span>
                          <span className="checkbox-label">{item.label}</span>
                          {formData[item.key] && <CheckCircle2 className="check-icon" size={20} />}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Localisation */}
            {currentStep === 3 && (
              <div className="form-step">
                <h2 className="step-title">
                  <MapPin size={24} />
                  Localisation du bien
                </h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Gouvernorat <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.gouvernorat}
                      onChange={(e) => handleInputChange('gouvernorat', e.target.value)}
                    >
                      {gouvernoratOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Délégation <span className="required">*</span>
                    </label>
                    <select 
                      className="form-select"
                      value={formData.delegation}
                      onChange={(e) => handleInputChange('delegation', e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="centre_ville">Centre-ville</option>
                      <option value="lac">Lac</option>
                      <option value="nord">Nord</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Localité <span className="required">*</span>
                    </label>
                    <select 
                      className="form-select"
                      value={formData.localite}
                      onChange={(e) => handleInputChange('localite', e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="centre">Centre</option>
                      <option value="banlieue">Banlieue</option>
                      <option value="zones_residentielles">Zones résidentielles</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Adresse complète <span className="required">*</span>
                  </label>
                  <div className="address-input-group">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 15 Avenue Habib Bourguiba, Tunis"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      disabled={isGeolocating}
                      className="geolocate-btn"
                    >
                      {isGeolocating ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Localisation...
                        </>
                      ) : (
                        <>
                          <MapPin size={18} />
                          Géolocaliser
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 36.8065"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 10.1815"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                    />
                  </div>
                </div>

                <div className="map-container">
                  <label className="form-label">
                    📍 Localisation sur la carte
                  </label>
                  <MapView 
                    onLocationChange={handleMapLocationChange}
                    initialPosition={mapLocation}
                  />
                  <p className="map-hint">
                    Cliquez sur la carte ou déplacez le marqueur pour sélectionner l'emplacement exact.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Présentation avec IA */}
            {currentStep === 4 && (
              <div className="form-step">
                <h2 className="step-title">
                  <Sparkles size={24} />
                  Présentation du bien
                  <span className="ai-subtitle">(Assisté par IA)</span>
                </h2>
                
                <div className="form-group">
                  <label className="form-label">
                    Titre de l'annonce <span className="required">*</span>
                  </label>
                  <div className="input-with-ai">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Magnifique villa moderne avec piscine"
                      value={formData.titre}
                      style={{width:"95%"}}
                      onChange={(e) => handleInputChange('titre', e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="ai-suggestion-btn"
                      onClick={() => {
                        // Générer un titre avec IA basé sur les données
                        if (formData.type_bien && formData.gouvernorat) {
                          const titles = [
                            `Superbe ${formData.type_bien} à ${formData.gouvernorat}`,
                            `${formData.type_bien.charAt(0).toUpperCase() + formData.type_bien.slice(1)} exceptionnel à ${formData.gouvernorat}`,
                            `Magnifique ${formData.type_bien} moderne`
                          ];
                          handleInputChange('titre', titles[Math.floor(Math.random() * titles.length)]);
                        }
                      }}
                    >
                      <Wand2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <Maximize2 size={18} /> Superficie <span className="required">*</span>
                    </label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        className="form-input"
                        placeholder="150"
                        value={formData.superficie}
                        onChange={(e) => handleInputChange('superficie', e.target.value)}
                      />
                      <span className="input-unit">m²</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <DollarSign size={18} /> Prix <span className="required">*</span>
                    </label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        className="form-input"
                        placeholder="250000"
                        value={formData.prix}
                        onChange={(e) => handleInputChange('prix', e.target.value)}
                      />
                      <select 
                        className="currency-select"
                        value={formData.devise}
                        onChange={(e) => handleInputChange('devise', e.target.value)}
                      >
                        <option value="TND">TND</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="description-header">
                    <label className="form-label">
                      Description <span className="required">*</span>
                    </label>
                    <div className="ai-actions">
                      <button 
                        type="button" 
                        className="ai-button quick"
                        onClick={generateQuickAIDescription}
                        disabled={isAILoading}
                      >
                        {isAILoading ? (
                          <>
                            <Loader size={16} className="spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Générer avec IA
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="ai-button advanced"
                        onClick={() => setIsAIModalOpen(true)}
                      >
                        <Wand2 size={16} />
                        Assistant IA Avancé
                      </button>
                    </div>
                  </div>
                  
                  <div className={`description-container ${formData.description ? 'has-content' : ''}`}>
                    <textarea
                      className="form-textarea"
                      rows="6"
                      placeholder="Décrivez votre bien en détail... L'IA peut vous aider à rédiger une description attractive !"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                    {formData.description && (
                      <div className="description-stats">
                        <span>{formData.description.length} caractères</span>
                        <span>{formData.description.split(' ').length} mots</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ai-tips">
                    <p>
                      💡 <strong>Conseil IA :</strong> Incluez des détails sur la luminosité, 
                      les équipements récents, la proximité des commodités et l'atmosphère du bien.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Images */}
            {currentStep === 5 && (
              <div className="form-step">
                <h2 className="step-title">
                  <Camera size={24} />
                  Photos du bien
                </h2>
                
                {/* Image principale */}
                <div className="main-image-section">
                  <h3 className="section-subtitle">
                    Image principale 
                    <span className="required">*</span>
                  </h3>
                  {!formData.image_principale ? (
                    <label className="upload-area main">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        style={{ display: 'none' }}
                      />
                      <Upload size={48} />
                      <p>Cliquez pour ajouter une image</p>
                      <span className="upload-hint">JPG, PNG (max 5MB)</span>
                    </label>
                  ) : (
                    <div className="image-preview main-preview">
                      <img src={URL.createObjectURL(formData.image_principale)} alt="Principal" />
                      <div className="image-overlay">
                        <button 
                          type="button" 
                          className="overlay-btn preview"
                          onClick={() => window.open(URL.createObjectURL(formData.image_principale), '_blank')}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          type="button" 
                          className="overlay-btn delete"
                          onClick={() => handleInputChange('image_principale', null)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {imageValidation.main && (
                        <div className={`validation-badge ${imageValidation.main.valid ? 'valid' : 'invalid'}`}>
                          {imageValidation.main.valid ? (
                            <><CheckCircle2 size={16} /> Valide</>
                          ) : (
                            <><XCircle size={16} /> {imageValidation.main.message}</>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Images supplémentaires */}
                <div className="additional-images-section">
                  <div className="section-header">
                    <h3 className="section-subtitle">Images supplémentaires</h3>
                    <span className="image-count">{formData.images.length}/10</span>
                  </div>
                  
                  <div className="images-grid">
                    {formData.images.map((file, index) => (
                      <div key={index} className="image-preview">
                        <img src={URL.createObjectURL(file)} alt={`Image ${index + 1}`} />
                        <div className="image-overlay">
                          <button 
                            type="button" 
                            className="overlay-btn preview"
                            onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="overlay-btn delete"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {imageValidation[index] === undefined ? (
                          <div className="validation-badge loading">
                            <Loader size={14} className="spin" /> Analyse...
                          </div>
                        ) : (
                          <div className={`validation-badge ${imageValidation[index]?.valid ? 'valid' : 'invalid'}`}>
                            {imageValidation[index]?.valid ? (
                              <><CheckCircle2 size={14} /> Valide</>
                            ) : (
                              <><XCircle size={14} /> Rejetée</>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {formData.images.length < 10 && (
                      <label className="upload-area small">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImageUpload(e, false)}
                          style={{ display: 'none' }}
                        />
                        <Upload size={32} />
                        <p>Ajouter</p>
                        <span className="upload-hint">max 10 images</span>
                      </label>
                    )}
                  </div>
                  
                  <div className="image-tips">
                    <p>
                      📸 <strong>Conseil :</strong> Ajoutez des photos sous différents angles, 
                      des pièces principales, et des caractéristiques uniques.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button type="button" className="nav-btn secondary" onClick={prevStep}>
                  <ChevronLeft size={20} />
                  Précédent
                </button>
              )}
              
              <div className="nav-right">
                {currentStep < totalSteps ? (
                  <button type="button" className="nav-btn primary" onClick={nextStep}>
                    Suivant
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button type="submit" className="nav-btn submit">
                    <Check size={20} />
                    Créer l'annonce
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal IA */}
        <AIDescriptionModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onConfirm={handleAIConfirm}
          initialData={formData}
          currentDescription={formData.description}
        />

        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          .create-listing-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 40px 20px;
          }

          .form-wrapper {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            position: relative;
            overflow: hidden;
          }

          .form-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #80a1d4, #75c9c8, #ff6b9d);
          }

          .form-title {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 32px;
            color: #333;
            margin-bottom: 30px;
            position: relative;
          }

          .form-title svg {
            color: #80a1d4;
          }

          .ai-badge {
            margin-left: 15px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0% { opacity: 0.9; }
            50% { opacity: 1; }
            100% { opacity: 0.9; }
          }

          /* Progress Bar */
          .progress-section {
            margin-bottom: 40px;
          }

          .progress-bar-container {
            height: 10px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
            position: relative;
          }

          .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #80a1d4, #75c9c8);
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 10px;
            position: relative;
            overflow: hidden;
          }

          .progress-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .progress-text {
            text-align: center;
            color: #666;
            font-size: 14px;
            font-weight: 500;
          }

          /* Form Steps */
          .form-step {
            animation: fadeIn 0.4s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .step-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            color: #333;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
          }

          .step-title svg {
            color: #80a1d4;
          }

          .ai-subtitle {
            margin-left: 10px;
            font-size: 14px;
            color: #667eea;
            background: rgba(102, 126, 234, 0.1);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
          }

          .section-subtitle {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
          }

          .section-icon {
            font-size: 20px;
          }

          /* Form Elements */
          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 10px;
          }

          .form-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }

          .required {
            color: #e74c3c;
          }

          .form-select,
          .form-input {
            padding: 14px 16px;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            font-size: 15px;
            transition: all 0.3s;
            outline: none;
            background-color: #f8f9fa;
            color: #333;
          }

          .form-select:focus,
          .form-input:focus {
            border-color: #80a1d4;
            box-shadow: 0 0 0 3px rgba(128, 161, 212, 0.2);
            background-color: white;
          }

          .form-textarea {
            padding: 14px 16px;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            font-size: 15px;
            font-family: inherit;
            resize: vertical;
            transition: all 0.3s;
            outline: none;
            background-color: white;
            min-height: 150px;
            width: 100%;
            color:#666;
          }

          .form-textarea:focus {
            border-color: #80a1d4;
            box-shadow: 0 0 0 3px rgba(128, 161, 212, 0.2);
          }

          /* Input with AI */
          .input-with-ai {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .ai-suggestion-btn {
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .ai-suggestion-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
          }

          /* Description avec IA */
          .description-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .ai-actions {
            display: flex;
            gap: 10px;
          }

          .ai-button {
            padding: 10px 20px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }

          .ai-button.quick {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            color: white;
          }

          .ai-button.advanced {
            background: linear-gradient(135deg, #ff6b9d, #c06be0);
            color: white;
          }

          .ai-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .ai-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .description-container {
            position: relative;
          }

          .description-container.has-content .form-textarea {
            border-color: #80a1d4;
          }

          .description-stats {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
            display: flex;
            gap: 10px;
          }

          .ai-tips {
            margin-top: 15px;
            padding: 15px;
            background: linear-gradient(135deg, rgba(255, 235, 204, 0.2), rgba(255, 245, 230, 0.2));
            border-radius: 12px;
            border-left: 4px solid #ff6b9d;
          }

          .ai-tips p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }

          /* Counters */
          .counters-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 30px;
          }

          .counter-group {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            transition: all 0.3s;
          }

          .counter-group:hover {
            background: #e9f5ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .counter-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-top: 12px;
          }

          .counter-btn {
            width: 40px;
            height: 40px;
            border: none;
            background: white;
            color: #80a1d4;
            border-radius: 10px;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            padding: 0;
          }

          .counter-btn:hover {
            background: #80a1d4;
            color: white;
            transform: scale(1.1);
          }

          .counter-value {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            min-width: 40px;
            text-align: center;
          }

          /* Checkbox Cards */
          .characteristics-section {
            margin-bottom: 35px;
          }

          .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 15px;
          }

          .checkbox-card {
            position: relative;
            cursor: pointer;
          }

          .checkbox-card input {
            position: absolute;
            opacity: 0;
          }

          .checkbox-content {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid transparent;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-align: center;
            position: relative;
            height: 100%;
          }

          .checkbox-card:hover .checkbox-content {
            background: #e9f5ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .checkbox-card.active .checkbox-content {
            background: linear-gradient(135deg, rgba(128, 161, 212, 0.15), rgba(117, 201, 200, 0.15));
            border-color: #80a1d4;
          }

          .checkbox-icon {
            font-size: 32px;
          }

          .checkbox-label {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }

          .check-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            color: #28a745;
            animation: checkAppear 0.3s ease;
          }

          @keyframes checkAppear {
            from {
              opacity: 0;
              transform: scale(0.5);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          /* Input with unit */
          .input-with-unit {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .input-unit {
            padding: 14px 16px;
            background: #f8f9fa;
            border-radius: 8px;
            font-weight: 600;
            color: #666;
            min-width: 60px;
            text-align: center;
          }

          .currency-select {
            padding: 14px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 15px;
            cursor: pointer;
            outline: none;
            background: white;
            color: #666;
            min-width: 80px;
          }

          /* Address input */
          .address-input-group {
            display: flex;
            gap: 10px;
          }

          .geolocate-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
          }

          .geolocate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(128, 161, 212, 0.3);
          }

          .geolocate-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          /* Map container */
          .map-container {
            margin-top: 20px;
          }

          .map-hint {
            margin-top: 10px;
            font-size: 13px;
            color: #666;
            text-align: center;
            font-style: italic;
          }

          /* Images */
          .main-image-section {
            margin-bottom: 40px;
          }

          .upload-area {
            border: 2px dashed #d0d0d0;
            border-radius: 12px;
            padding: 60px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .upload-area:hover {
            border-color: #80a1d4;
            background: rgba(128, 161, 212, 0.05);
            transform: translateY(-2px);
          }

          .upload-area.main {
            background: #f8f9fa;
          }

          .upload-area.small {
            padding: 30px 10px;
            min-height: 150px;
            justify-content: center;
          }

          .upload-area svg {
            color: #80a1d4;
          }

          .upload-hint {
            font-size: 12px;
            color: #999;
          }

          .additional-images-section {
            margin-top: 30px;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .image-count {
            padding: 6px 12px;
            background: #f8f9fa;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            color: #666;
          }

          .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
          }

          .image-preview {
            position: relative;
            aspect-ratio: 1;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s;
          }

          .image-preview:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          .image-preview.main-preview {
            aspect-ratio: 16/9;
            max-width: 500px;
          }

          .image-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            opacity: 0;
            transition: opacity 0.3s;
          }

          .image-preview:hover .image-overlay {
            opacity: 1;
          }

          .overlay-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
          }

          .overlay-btn.preview:hover {
            background: #80a1d4;
            color: white;
          }

          .overlay-btn.delete {
            background: #e74c3c;
            color: white;
          }

          .overlay-btn.delete:hover {
            background: #c0392b;
          }

          .overlay-btn:hover {
            transform: scale(1.1);
          }

          .validation-badge {
            position: absolute;
            bottom: 10px;
            left: 10px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            backdrop-filter: blur(4px);
            z-index: 1;
          }

          .validation-badge.valid {
            background: rgba(40, 167, 69, 0.9);
            color: white;
          }

          .validation-badge.invalid {
            background: rgba(231, 76, 60, 0.9);
            color: white;
          }

          .validation-badge.loading {
            background: rgba(255, 193, 7, 0.9);
            color: white;
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .image-tips {
            margin-top: 20px;
            padding: 15px;
            background: linear-gradient(135deg, rgba(204, 235, 255, 0.2), rgba(230, 247, 255, 0.2));
            border-radius: 12px;
            border-left: 4px solid #80a1d4;
          }

          .image-tips p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }

          /* Navigation */
          .form-navigation {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #f0f0f0;
          }

          .nav-right {
            margin-left: auto;
          }

          .nav-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            min-width: 150px;
            justify-content: center;
          }

          .nav-btn.secondary {
            background: #f8f9fa;
            color: #333;
          }

          .nav-btn.secondary:hover {
            background: #e9ecef;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .nav-btn.primary {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            color: white;
          }

          .nav-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(128, 161, 212, 0.3);
          }

          .nav-btn.submit {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
          }

          .nav-btn.submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
          }

          /* Responsive */
          @media (max-width: 768px) {
            .form-wrapper {
              padding: 25px;
            }

            .form-title {
              font-size: 24px;
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }

            .ai-badge {
              margin-left: 0;
            }

            .step-title {
              font-size: 20px;
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }

            .form-grid {
              grid-template-columns: 1fr;
            }

            .checkbox-grid {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            }

            .counters-section {
              grid-template-columns: 1fr;
            }

            .images-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .description-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }

            .ai-actions {
              width: 100%;
            }

            .ai-button {
              width: 100%;
              justify-content: center;
            }

            .form-navigation {
              flex-direction: column;
              gap: 10px;
            }

            .nav-right {
              margin-left: 0;
              width: 100%;
            }

            .nav-btn {
              width: 100%;
            }

            .address-input-group {
              flex-direction: column;
            }
          }

           p{
   color:#80a1d4;
   }

   @media (max-width: 768px) {
  .form-navigation {
    position: sticky;
    bottom: 0;
    background: white;
    padding: 12px 0;
    margin-top: 20px;
    border-top: 1px solid #eee;
    z-index: 50;
  }
}
@media (max-width: 768px) {
  .create-listing-container {
    padding-bottom: 100px;
  }

  .form-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 15px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .form-navigation .nav-btn {
    width: 100%;
  }
}
  
@media (max-width: 768px) {
  .form-navigation {
    flex-direction: column;
    gap: 12px;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
    font-size: 16px;
    padding: 14px;
  }
}


.form-wrapper {
  padding-bottom: 120px;
}

        `}</style>
      </div>
    </Layout>
  );
};

export default CreateListingForm;