// ==================== PAGE CONTACT ====================
// pages/Contact.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    sujet: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message envoyé avec succès !');
    // Reset form
    setFormData({ nom: '', email: '', telephone: '', sujet: '', message: '' });
  };

  const contactInfo = [
    { icon: <MapPin />, title: "Adresse", value: "Avenue Habib Bourguiba, Tunis" },
    { icon: <Phone />, title: "Téléphone", value: "+216 71 123 456" },
    { icon: <Mail />, title: "Email", value: "xpertiseimmo@gmail.com" },
    { icon: <Clock />, title: "Horaires", value: "24h/24, 7j/7" }
  ];

  return (
    <Layout>
      <div className="contact-page">
        {/* Hero Section */}
        <section className="contact-hero">
          <div className="contact-hero-content">
            <h1 className="contact-hero-title">Contactez-nous</h1>
            <p className="contact-hero-subtitle">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <div className="contact-container">
            <div className="contact-layout">
              {/* Contact Info */}
              <div className="contact-info-column">
                <h2 className="contact-section-title">Nos Coordonnées</h2>
                <div className="contact-info-list">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="contact-info-card">
                      <div className="contact-info-icon">{info.icon}</div>
                      <div>
                        <h4>{info.title}</h4>
                        <p>{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="contact-social-section">
                  <h3>Suivez-nous</h3>
                  <div className="contact-social-links">
                    <a href="#" className="contact-social-btn">📘 Facebook</a>
                    <a href="#" className="contact-social-btn">📷 Instagram</a>
                    <a href="#" className="contact-social-btn">🎵 TikTok</a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="contact-form-column">
                <div className="contact-form-card">
                  <h2 className="contact-section-title">Envoyez-nous un message</h2>
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="contact-form-group">
                      <label>Nom complet <span className="contact-required">*</span></label>
                      <input
                        type="text"
                        className="contact-form-input"
                        placeholder="Votre nom"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        required
                      />
                    </div>

                    <div className="contact-form-row">
                      <div className="contact-form-group">
                        <label>Email <span className="contact-required">*</span></label>
                        <input
                          type="email"
                          className="contact-form-input"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>

                      <div className="contact-form-group">
                        <label>Téléphone</label>
                        <input
                          type="tel"
                          className="contact-form-input"
                          placeholder="+216 XX XXX XXX"
                          value={formData.telephone}
                          onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="contact-form-group">
                      <label>Sujet <span className="contact-required">*</span></label>
                      <select
                        className="contact-form-select"
                        value={formData.sujet}
                        onChange={(e) => setFormData({...formData, sujet: e.target.value})}
                        required
                      >
                        <option value="">Sélectionner un sujet</option>
                        <option value="info">Demande d'information</option>
                        <option value="support">Support technique</option>
                        <option value="partenariat">Partenariat</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div className="contact-form-group">
                      <label>Message <span className="contact-required">*</span></label>
                      <textarea
                        className="contact-form-textarea"
                        rows="6"
                        placeholder="Votre message..."
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                      />
                    </div>

                    <button type="submit" className="contact-btn-submit">
                      <Send size={20} />
                      Envoyer le message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          .contact-page {
            width: 100%;
            background: #f8f9fa;
          }

          .contact-hero {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            padding: 80px 20px;
            text-align: center;
            color: white;
          }

          .contact-hero-content {
            max-width: 800px;
            margin: 0 auto;
          }

          .contact-hero-title {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 20px;
            animation: fadeInUp 1s ease;
          }

          .contact-hero-subtitle {
            font-size: 20px;
            opacity: 0.95;
            animation: fadeInUp 1s ease 0.2s both;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .contact-section {
            padding: 80px 20px;
          }

          .contact-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .contact-layout {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 60px;
          }

          .contact-section-title {
            font-size: 32px;
            color: #333;
            margin-bottom: 30px;
            font-weight: 700;
          }

          .contact-info-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 40px;
          }

          .contact-info-card {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 25px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease;
          }

          .contact-info-card:hover {
            transform: translateX(5px);
          }

          .contact-info-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
          }

          .contact-info-card h4 {
            color: #333;
            margin-bottom: 5px;
            font-size: 16px;
            font-weight: 600;
          }

          .contact-info-card p {
            color: #666;
            font-size: 15px;
          }

          .contact-social-section h3 {
            font-size: 20px;
            color: #333;
            margin-bottom: 15px;
            font-weight: 600;
          }

          .contact-social-links {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .contact-social-btn {
            padding: 15px 20px;
            background: white;
            border-radius: 12px;
            text-decoration: none;
            color: #333;
            font-weight: 600;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            display: block;
          }

          .contact-social-btn:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
          }

          .contact-form-card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }

          .contact-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .contact-form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .contact-form-group label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }

          .contact-required {
            color: #e74c3c;
          }

          .contact-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .contact-form-input,
          .contact-form-select {
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 15px;
            outline: none;
            transition: border-color 0.3s ease;
            font-family: inherit;
            background: #f8f9fa;
          }

          .contact-form-input:focus,
          .contact-form-select:focus {
            border-color: #80a1d4;
            box-shadow: 0 0 0 3px rgba(128, 161, 212, 0.1);
          }

          .contact-form-textarea {
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 15px;
            font-family: inherit;
            resize: vertical;
            outline: none;
            transition: border-color 0.3s ease;
            background: #f8f9fa;
          }

          .contact-form-textarea:focus {
            border-color: #80a1d4;
            box-shadow: 0 0 0 3px rgba(128, 161, 212, 0.1);
          }

          .contact-btn-submit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .contact-btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(128, 161, 212, 0.3);
          }

          @media (max-width: 1024px) {
            .contact-layout {
              grid-template-columns: 1fr;
              gap: 40px;
            }
          }

          @media (max-width: 768px) {
            .contact-hero-title {
              font-size: 32px;
            }

            .contact-hero-subtitle {
              font-size: 16px;
            }

            .contact-section {
              padding: 50px 20px;
            }

            .contact-form-row {
              grid-template-columns: 1fr;
            }

            .contact-form-card {
              padding: 25px;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}
