// ==================== PAGE COMPTE ====================
// pages/Compte.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import { User, Home, BarChart3, Settings, LogOut, Edit, Eye, Heart, MessageCircle } from "lucide-react";

export default function Compte() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    nom: "Ben Ali",
    prenom: "Ahmed",
    email: "ahmed.benali@email.com",
    telephone: "+216 98 765 432",
    adresse: "Tunis, Tunisie"
  });

  const myListings = [
    { id: 1, title: "Villa Moderne à La Marsa", status: "Publié", views: 156, likes: 23 },
    { id: 2, title: "Appartement Centre-Ville", status: "En attente", views: 89, likes: 12 },
    { id: 3, title: "Terrain Résidentiel Sousse", status: "Publié", views: 234, likes: 45 }
  ];

  const activities = [
    { action: "Publication d'une annonce", date: "Il y a 2 jours", icon: <Home /> },
    { action: "Message reçu de Salma M.", date: "Il y a 3 jours", icon: <MessageCircle /> },
    { action: "Annonce vue 50 fois", date: "Il y a 5 jours", icon: <Eye /> }
  ];

  return (
    <Layout>
      <div className="compte-page">
        {/* Profile Hero */}
        <section className="compte-hero">
          <div className="compte-container">
            <div className="compte-profile-header">
              <div className="compte-profile-avatar-large">
                <User size={48} />
              </div>
              <div className="compte-profile-info">
                <h1>{profile.prenom} {profile.nom}</h1>
                <p className="compte-profile-subtitle">Membre depuis janvier 2024</p>
              </div>
            </div>
          </div>
        </section>

        <div className="compte-container">
          <div className="compte-profile-layout">
            {/* Sidebar */}
            <aside className="compte-sidebar">
              <nav className="compte-nav">
                <button 
                  className={`compte-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User size={20} />
                  Mon Profil
                </button>
                <button 
                  className={`compte-nav-item ${activeTab === 'listings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('listings')}
                >
                  <Home size={20} />
                  Mes Annonces
                </button>
                <button 
                  className={`compte-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  <BarChart3 size={20} />
                  Activité
                </button>
                <button 
                  className={`compte-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={20} />
                  Paramètres
                </button>
                <button className="compte-nav-item compte-logout">
                  <LogOut size={20} />
                  Déconnexion
                </button>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="compte-content">
              {activeTab === 'profile' && (
                <div className="compte-content-card">
                  <div className="compte-card-header">
                    <h2>Informations Personnelles</h2>
                    <button className="compte-btn-icon">
                      <Edit size={18} />
                    </button>
                  </div>
                  <div className="compte-info-grid">
                    <div className="compte-info-item">
                      <label>Prénom</label>
                      <input type="text" value={profile.prenom} className="compte-form-input" readOnly />
                    </div>
                    <div className="compte-info-item">
                      <label>Nom</label>
                      <input type="text" value={profile.nom} className="compte-form-input" readOnly />
                    </div>
                    <div className="compte-info-item">
                      <label>Email</label>
                      <input type="email" value={profile.email} className="compte-form-input" readOnly />
                    </div>
                    <div className="compte-info-item">
                      <label>Téléphone</label>
                      <input type="tel" value={profile.telephone} className="compte-form-input" readOnly />
                    </div>
                    <div className="compte-info-item compte-full-width">
                      <label>Adresse</label>
                      <input type="text" value={profile.adresse} className="compte-form-input" readOnly />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'listings' && (
                <div className="compte-content-card">
                  <div className="compte-card-header">
                    <h2>Mes Annonces ({myListings.length})</h2>
                    <button className="compte-btn-primary">
                      <Home size={18} />
                      Nouvelle annonce
                    </button>
                  </div>
                  <div className="compte-listings-list">
                    {myListings.map(listing => (
                      <div key={listing.id} className="compte-listing-item">
                        <div className="compte-listing-info">
                          <h3>{listing.title}</h3>
                          <span className={`compte-status-badge ${listing.status === 'Publié' ? 'published' : 'pending'}`}>
                            {listing.status}
                          </span>
                        </div>
                        <div className="compte-listing-stats">
                          <span><Eye size={16} /> {listing.views}</span>
                          <span><Heart size={16} /> {listing.likes}</span>
                        </div>
                        <div className="compte-listing-actions">
                          <button className="compte-btn-icon"><Eye size={18} /></button>
                          <button className="compte-btn-icon"><Edit size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="compte-content-card">
                  <div className="compte-card-header">
                    <h2>Activité Récente</h2>
                  </div>
                  <div className="compte-activity-list">
                    {activities.map((activity, index) => (
                      <div key={index} className="compte-activity-item">
                        <div className="compte-activity-icon">{activity.icon}</div>
                        <div className="compte-activity-content">
                          <p>{activity.action}</p>
                          <span className="compte-activity-date">{activity.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="compte-content-card">
                  <div className="compte-card-header">
                    <h2>Paramètres</h2>
                  </div>
                  <div className="compte-settings-section">
                    <div className="compte-setting-item">
                      <div>
                        <h4>Notifications par email</h4>
                        <p>Recevoir des notifications pour les nouvelles annonces</p>
                      </div>
                      <label className="compte-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="compte-slider"></span>
                      </label>
                    </div>
                    <div className="compte-setting-item">
                      <div>
                        <h4>Notifications push</h4>
                        <p>Recevoir des notifications sur votre appareil</p>
                      </div>
                      <label className="compte-switch">
                        <input type="checkbox" />
                        <span className="compte-slider"></span>
                      </label>
                    </div>
                    <div className="compte-setting-item">
                      <div>
                        <h4>Profil public</h4>
                        <p>Rendre votre profil visible aux autres utilisateurs</p>
                      </div>
                      <label className="compte-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="compte-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        <style jsx>{`
          .compte-page {
            width: 100%;
            background: #f8f9fa;
            min-height: 100vh;
          }

          .compte-hero {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            padding: 40px 20px;
          }

          .compte-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .compte-profile-header {
            display: flex;
            align-items: center;
            gap: 30px;
          }

          .compte-profile-avatar-large {
            width: 120px;
            height: 120px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #80a1d4;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }

          .compte-profile-info h1 {
            color: white;
            font-size: 32px;
            margin-bottom: 5px;
            font-weight: 700;
          }

          .compte-profile-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
          }

          .compte-profile-layout {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 30px;
            padding: 40px 0;
          }

          .compte-sidebar {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            height: fit-content;
            position: sticky;
            top: 20px;
          }

          .compte-nav {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .compte-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: transparent;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            color: #666;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            width: 100%;
            font-weight: 500;
          }

          .compte-nav-item:hover {
            background: #f8f9fa;
          }

          .compte-nav-item.active {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            color: white;
          }

          .compte-nav-item.compte-logout {
            color: #e74c3c;
            margin-top: 20px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }

          .compte-content {
            min-height: 400px;
          }

          .compte-content-card {
            background: white;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
          }

          .compte-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }

          .compte-card-header h2 {
            font-size: 24px;
            color: #333;
            font-weight: 700;
          }

          .compte-btn-icon {
            width: 40px;
            height: 40px;
            border: none;
            background: #f8f9fa;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .compte-btn-icon:hover {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            color: white;
          }

          .compte-btn-primary {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .compte-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(128, 161, 212, 0.3);
          }

          .compte-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .compte-info-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .compte-info-item.compte-full-width {
            grid-column: 1 / -1;
          }

          .compte-info-item label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }

          .compte-form-input {
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 15px;
            outline: none;
            transition: border-color 0.3s ease;
            background: #f8f9fa;
          }

          .compte-listings-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .compte-listing-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            transition: all 0.3s ease;
          }

          .compte-listing-item:hover {
            background: #e9f5ff;
          }

          .compte-listing-info {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .compte-listing-info h3 {
            font-size: 16px;
            color: #333;
            font-weight: 600;
          }

          .compte-status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }

          .compte-status-badge.published {
            background: #d4edda;
            color: #155724;
          }

          .compte-status-badge.pending {
            background: #fff3cd;
            color: #856404;
          }

          .compte-listing-stats {
            display: flex;
            gap: 20px;
            color: #666;
            font-size: 14px;
          }

          .compte-listing-stats span {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .compte-listing-actions {
            display: flex;
            gap: 10px;
          }

          .compte-activity-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .compte-activity-item {
            display: flex;
            gap: 15px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
          }

          .compte-activity-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
          }

          .compte-activity-content p {
            font-weight: 500;
            color: #333;
            margin-bottom: 5px;
          }

          .compte-activity-date {
            font-size: 13px;
            color: #999;
          }

          .compte-settings-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .compte-setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
          }

          .compte-setting-item h4 {
            font-size: 16px;
            color: #333;
            margin-bottom: 5px;
            font-weight: 600;
          }

          .compte-setting-item p {
            font-size: 14px;
            color: #666;
          }

          .compte-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 28px;
          }

          .compte-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .compte-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.4s;
            border-radius: 28px;
          }

          .compte-slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
          }

          input:checked + .compte-slider {
            background: linear-gradient(135deg, #80a1d4, #75c9c8);
          }

          input:checked + .compte-slider:before {
            transform: translateX(22px);
          }

          @media (max-width: 1024px) {
            .compte-profile-layout {
              grid-template-columns: 1fr;
            }

            .compte-sidebar {
              position: static;
            }
          }

          @media (max-width: 768px) {
            .compte-profile-header {
              flex-direction: column;
              text-align: center;
            }

            .compte-profile-info h1 {
              font-size: 24px;
            }

            .compte-info-grid {
              grid-template-columns: 1fr;
            }

            .compte-listing-item {
              flex-direction: column;
              align-items: flex-start;
            }

            .compte-listing-actions {
              width: 100%;
              justify-content: flex-end;
            }

            .compte-content-card {
              padding: 20px;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}