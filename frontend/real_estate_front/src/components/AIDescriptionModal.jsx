import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, Check, RotateCcw, Zap, Clock, TrendingUp, Copy, MessageSquare, FileText, CheckCircle } from 'lucide-react';

const AIDescriptionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialData,
  currentDescription 
}) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const chatContainerRef = useRef(null);
  const previewRef = useRef(null);

  const tones = [
    { id: 'professional', label: 'Professionnel', emoji: '💼' },
    { id: 'friendly', label: 'Convivial', emoji: '😊' },
    { id: 'luxury', label: 'Luxe', emoji: '✨' },
    { id: 'urgent', label: 'Urgent', emoji: '⚡' },
    { id: 'detailed', label: 'Détaillé', emoji: '📋' }
  ];

  // Initialisation de la conversation
  useEffect(() => {
    if (isOpen) {
      const initialMessages = [
        {
          id: 1,
          role: 'bot',
          content: '👋 Bonjour ! Je suis votre assistant IA spécialisé en immobilier.',
          timestamp: new Date()
        },
        {
          id: 2,
          role: 'bot',
          content: "Je vais analyser votre bien et vous proposer une description qui attire l'attention et convertit plus d'acheteurs.",
          timestamp: new Date()
        },
        {
          id: 3,
          role: 'bot',
          content: "En fonction de vos informations, je peux adapter le ton de la description pour maximiser son impact.",
          timestamp: new Date()
        }
      ];

      setMessages(initialMessages);
      generateAISuggestion();
    }
  }, [isOpen]);

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Faire défiler la prévisualisation
  useEffect(() => {
    if (previewRef.current && aiSuggestion) {
      previewRef.current.scrollTop = 0;
    }
  }, [aiSuggestion]);

  // Générer une suggestion IA
  const generateAISuggestion = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const { 
        type_bien = 'bien',
        titre = '',
        superficie = '',
        nb_pieces = 0,
        nb_chambres = 0,
        gouvernorat = '',
        address = '',
        prix = '',
        devise = 'TND',
        etat_bien = ''
      } = initialData || {};

      const characteristics = [];
      if (initialData?.vue_mer) characteristics.push('vue sur mer panoramique');
      if (initialData?.vue_montagne) characteristics.push('vue montagne');
      if (initialData?.jardin) characteristics.push('jardin privatif');
      if (initialData?.terrasse) characteristics.push('grande terrasse');
      if (initialData?.balcon) characteristics.push('balcon');
      if (initialData?.ascenseur) characteristics.push('ascenseur');
      if (initialData?.garage) characteristics.push('garage');
      if (initialData?.climatisation) characteristics.push('climatisation réversible');
      if (initialData?.meuble) characteristics.push('entièrement meublé');
      if (initialData?.cuisine_equipee) characteristics.push('cuisine équipée haut de gamme');

      let suggestion = '';
      
      // Adaptation du ton
      const toneConfig = {
        professional: {
          intro: `🏢 **EXCLUSIF - ${titre.toUpperCase() || `${type_bien?.toUpperCase() || 'BIEN'} À VENDRE`}**\n\n`,
          style: 'formel et détaillé'
        },
        friendly: {
          intro: `🏡 **Coup de cœur ! ${titre || `Super ${type_bien || 'bien'}`}**\n\n`,
          style: 'chaleureux et accueillant'
        },
        luxury: {
          intro: `✨ **PRESTIGE - ${titre || `${type_bien || 'bien'} d'exception`}**\n\n`,
          style: 'luxueux et exclusif'
        },
        urgent: {
          intro: `⚡ **OPPORTUNITÉ EXCEPTIONNELLE ! ${titre || type_bien || 'bien'}**\n\n`,
          style: 'dynamique et urgent'
        },
        detailed: {
          intro: `📋 **DESCRIPTION COMPLÈTE - ${titre || type_bien || 'bien'}**\n\n`,
          style: 'technique et complet'
        }
      };

      const tone = toneConfig[selectedTone];
      suggestion += tone.intro;

      // Caractéristiques principales
      const mainFeatures = [];
      if (superficie) mainFeatures.push(`${superficie} m²`);
      if (nb_pieces) mainFeatures.push(`${nb_pieces} pièce${nb_pieces > 1 ? 's' : ''}`);
      if (nb_chambres) mainFeatures.push(`${nb_chambres} chambre${nb_chambres > 1 ? 's' : ''}`);
      
      if (mainFeatures.length > 0) {
        suggestion += `**Caractéristiques :** ${mainFeatures.join(' • ')}\n\n`;
      }

      // Description détaillée
      suggestion += `**📝 Description :**\n`;
      
      switch (selectedTone) {
        case 'professional':
          suggestion += `Nous avons le plaisir de vous présenter ce ${type_bien || 'bien'} situé ${address || `à ${gouvernorat || 'une localisation privilégiée'}`}. `;
          suggestion += `Ce bien ${etat_bien === 'neuf' ? 'neuf' : 'en excellent état'} `;
          break;
        case 'friendly':
          suggestion += `Découvrez ce charmant ${type_bien || 'bien'} situé ${address || `dans le quartier de ${gouvernorat || 'cette belle région'}`}. `;
          suggestion += `Un véritable coup de cœur ${etat_bien === 'neuf' ? 'tout neuf' : 'bien entretenu'} `;
          break;
        case 'luxury':
          suggestion += `Pour les amateurs de prestige, ce ${type_bien || 'bien'} d'exception situé ${address || `à ${gouvernorat || 'un emplacement prestigieux'}`}. `;
          suggestion += `Une réalisation ${etat_bien === 'neuf' ? 'haute gamme' : 'de caractère'} `;
          break;
        case 'urgent':
          suggestion += `NE MANQUEZ PAS CETTE OCCASION ! ${type_bien || 'Bien'} rare ${address || `à ${gouvernorat || 'cette adresse exclusive'}`}. `;
          suggestion += `Disponible ${etat_bien === 'neuf' ? 'immédiatement' : 'rapidement'} `;
          break;
        case 'detailed':
          suggestion += `Présentation détaillée de ce ${type_bien || 'bien'} situé ${address || `dans la région de ${gouvernorat || 'cette zone recherchée'}`}. `;
          suggestion += `État du bien : ${etat_bien || 'excellent'}. `;
          break;
      }

      if (characteristics.length > 0) {
        suggestion += `avec ${characteristics.slice(0, 3).join(', ')}`;
        if (characteristics.length > 3) suggestion += `, et plus encore`;
        suggestion += `. `;
      }

      suggestion += `\n\n**🎯 Points forts :**\n`;
      suggestion += `• Situation ${address ? 'privilégiée' : 'idéale'} ${address ? `(${address.split(',')[0]})` : ''}\n`;
      if (superficie) suggestion += `• Surface spacieuse de ${superficie} m²\n`;
      if (characteristics.length > 0) {
        suggestion += `• Équipements premium : ${characteristics.slice(0, 4).join(', ')}\n`;
      }
      suggestion += `• ${etat_bien === 'neuf' ? 'Livraison immédiate' : 'Prêt à emménager'}\n`;

      if (prix) {
        suggestion += `\n**💰 Prix : ${parseInt(prix || 0).toLocaleString()} ${devise}**\n`;
      }

      suggestion += `\n**📞 Contact :**\n`;
      suggestion += `Pour plus d'informations ou organiser une visite, n'hésitez pas à nous contacter. Cette opportunité ne restera pas disponible longtemps !`;

      const newMessage = {
        id: messages.length + 1,
        role: 'bot',
        content: `**Nouvelle description générée (Ton: ${selectedTone}) :**\n\n${suggestion}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      setAiSuggestion(suggestion);
      setIsLoading(false);
    }, 1500);
  };

  // Envoyer un message utilisateur
  const handleSendMessage = () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    setIsLoading(true);
    setTimeout(() => {
      const responses = [
        "J'ai bien pris en compte vos précisions. Voici la description ajustée :",
        "Excellent point ! J'ai intégré vos suggestions :",
        "Très bonne idée. Voici une version améliorée :",
        "J'ai personnalisé la description selon votre demande :"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const improvedSuggestion = `${aiSuggestion}\n\n**Personnalisation :** ${userInput}`;

      const botMessage = {
        id: messages.length + 2,
        role: 'bot',
        content: `${randomResponse}\n\n${improvedSuggestion}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setAiSuggestion(improvedSuggestion);
      setIsLoading(false);
    }, 1200);
  };

  // Changer le ton
  const handleToneChange = (toneId) => {
    setSelectedTone(toneId);
    const tone = tones.find(t => t.id === toneId);
    const toneMessage = {
      id: messages.length + 1,
      role: 'bot',
      content: `🔄 Changement de ton : **${tone.label}** ${tone.emoji}\nJe regénère la description avec ce style...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, toneMessage]);
    setIsLoading(true);
    
    setTimeout(() => {
      generateAISuggestion();
    }, 800);
  };

  // Régénérer la description
  const handleRegenerate = () => {
    const regenerateMessage = {
      id: messages.length + 1,
      role: 'bot',
      content: '🔄 Régénération en cours avec les mêmes paramètres...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, regenerateMessage]);
    setIsLoading(true);
    
    setTimeout(() => {
      generateAISuggestion();
    }, 800);
  };

  // Copier la description
  const handleCopy = () => {
    navigator.clipboard.writeText(aiSuggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Appliquer la description au formulaire principal
  const handleApply = () => {
    if (!aiSuggestion) return;
    
    onConfirm(aiSuggestion);
    setApplied(true);
    
    // Fermer automatiquement après 2 secondes
    setTimeout(() => {
      onClose();
      setApplied(false);
    }, 2000);
  };

  // Gérer la touche Entrée
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="ai-modal">
        {/* En-tête */}
        <div className="modal-header">
            
          <div className="modal-title">
            <div className="title-content">
              <Bot size={24} />
              <div>
                <h3>Assistant IA Description</h3>
                <p className="subtitle">Génération optimisée pour l'immobilier</p>
              </div>
            </div>
            <div className="ai-stats">
              <div className="stat">
                <Zap size={14} />
                <span>IA Powered</span>
              </div>
              <div className="stat">
                <TrendingUp size={14} />
                <span>+47% d'engagement</span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Corps de la modale - DIVISÉ EN DEUX PARTIES */}
        <div className="modal-body">
          {/* Partie gauche : Discussion avec l'IA */}
          <div className="chat-side">
            {/* Sélecteur de ton */}
            <div className="tone-selector">
              <div className="tone-header">
                <Sparkles size={18} />
                <span>Sélectionnez le ton</span>
              </div>
              <div className="tone-buttons">
                {tones.map(tone => (
                  <button
                    key={tone.id}
                    className={`tone-btn ${selectedTone === tone.id ? 'active' : ''}`}
                    onClick={() => handleToneChange(tone.id)}
                    disabled={isLoading}
                  >
                    <span className="tone-emoji">{tone.emoji}</span>
                    <span className="tone-label">{tone.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone de chat */}
            <div className="chat-container-wrapper">
              <div className="chat-container" ref={chatContainerRef}>
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`message ${message.role}`}
                  >
                    <div className="message-header">
                      {message.role === 'bot' ? (
                        <>
                          <div className="message-avatar bot">
                            <Bot size={14} />
                          </div>
                          <span className="message-author">Assistant IA</span>
                        </>
                      ) : (
                        <>
                          <div className="message-avatar user">
                            <User size={14} />
                          </div>
                          <span className="message-author">Vous</span>
                        </>
                      )}
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="message-content">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="message bot">
                    <div className="message-header">
                      <div className="message-avatar bot">
                        <Bot size={14} />
                      </div>
                      <span className="message-author">Assistant IA</span>
                    </div>
                    <div className="loading-message">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p>Rédaction en cours...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zone de saisie */}
            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Personnalisez la description (ex: 'Ajoutez une mention sur la proximité des écoles', 'Mettez en avant les rénovations récentes'...)"
                  rows={2}
                  disabled={isLoading}
                />
                <button 
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isLoading}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="input-hint">
                <MessageSquare size={12} />
                <span>Appuyez sur Entrée pour envoyer</span>
              </div>
            </div>
          </div>

          {/* Partie droite : Prévisualisation */}
          <div className="preview-side">
            <div className="preview-header">
              <div className="preview-title">
                <FileText size={20} />
                <h4>Prévisualisation</h4>
              </div>
              <div className="preview-actions-top">
                     <div className="stat-item">
                <span>{(aiSuggestion?.split(' ')?.length || 0)} mots</span>
              </div>
                <button 
                  className="copy-btn"
                  onClick={handleCopy}
                  disabled={!aiSuggestion || isLoading}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copier
                    </>
                  )}
                </button>
                <button 
                  className="regenerate-btn"
                  onClick={handleRegenerate}
                  disabled={isLoading}
                >
                  <RotateCcw size={16} />
                  Régénérer
                </button>
              </div>
            </div>

      
            
            {/* Contenu de la prévisualisation */}
            <div className="preview-content" ref={previewRef}>
              {aiSuggestion ? (
                <div className="preview-text">
                  {aiSuggestion.split('\n').map((line, i) => {
                    if (line.includes('**') && line.includes('**')) {
                      return <h3 key={i} className="preview-heading">{line.replace(/\*\*/g, '')}</h3>;
                    } else if (line.includes('•') || line.includes('◦')) {
                      return <p key={i} className="preview-list-item">{line}</p>;
                    } else if (line.trim() === '') {
                      return <br key={i} />;
                    } else {
                      return <p key={i}>{line}</p>;
                    }
                  })}
                </div>
              ) : (
                <div className="preview-placeholder">
                  <Sparkles size={48} />
                  <h4>Description en attente</h4>
                  <p>Votre description générée par IA apparaîtra ici</p>
                  <small>L'IA analyse votre bien pour créer un contenu optimisé</small>
                </div>
              )}
            </div>
            
   
                  {/* Pied de la modale */}
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Annuler
          </button>
          <button 
            className="confirm-btn"
            onClick={handleApply}
            disabled={!aiSuggestion || isLoading || applied}
          >
            {applied ? (
              <>
                <CheckCircle size={18} />
                Description appliquée !
              </>
            ) : (
              <>
                <Check size={18} />
                Utiliser cette description
              </>
            )}
          </button>
        </div>
      </div>
        </div>        </div>


      
      {/* Styles */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ai-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 1200px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          padding: 20px 30px;
          background: linear-gradient(135deg, #80a1d4 0%, #75c9c8 100%);
          color: white;
          position: relative;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .title-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-content h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }

        .subtitle {
          margin: 2px 0 0;
          font-size: 13px;
          opacity: 0.9;
        }

        .ai-stats {
          display: flex;
          gap: 12px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.15);
          padding: 5px 10px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
          z-index: 2;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: rotate(90deg);
        }

        /* Corps de la modale divisé */
        .modal-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          padding: 0;
          min-height: 500px;
        }

        /* Partie gauche : Discussion */
        .chat-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          border-right: 1px solid #e5e7eb;
          background: #f8f9fa;
        }

        /* Partie droite : Prévisualisation */
        .preview-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: white;
        }

        /* Sélecteur de ton */
        .tone-selector {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .tone-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: #333;
          font-size: 14px;
          font-weight: 600;
        }

        .tone-buttons {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .tone-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tone-btn:hover:not(:disabled) {
          border-color: #75c9c8;
          background: #f8f9fa;
        }

        .tone-btn.active {
          background: linear-gradient(135deg, #80a1d4, #75c9c8);
          border-color: #75c9c8;
          color: white;
        }

        .tone-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tone-emoji {
          font-size: 16px;
        }

        /* Zone de chat */
        .chat-container-wrapper {
          flex: 1;
          overflow: hidden;
          position: relative;
          

        }

        .chat-container {
          height: 100%;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
        }

        .message {
          margin-bottom: 16px;
          animation: messageAppear 0.3s ease;
        }

        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .message-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-avatar.bot {
          background: linear-gradient(135deg, #80a1d4, #75C9C8);
          color: white;
        }

        .message-avatar.user {
          background: linear-gradient(135deg, #80a1d4, #75c9c8);
          color: white;
        }

        .message-author {
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
        }

        .message-time {
          margin-left: auto;
          font-size: 11px;
          color: #9ca3af;
        }

        .message-content {
          background: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          border: 1px solid #e5e7eb;
          margin-left: 8px;
        }

        .message.bot .message-content {
          background: white;
          border-left: 3px solid #75c9c8;
        }

        .message.user .message-content {
          background: #f0fdf4;
          border-left: 3px solid #10b981;
        }

        .message-content p {
          margin: 6px 0;
          color: #4b5563;
        }

        .message-content p:first-child {
          margin-top: 0;
        }

        .message-content p:last-child {
          margin-bottom: 0;
        }

        .loading-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #667eea;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }

        /* Zone de saisie */
        .input-container {
          padding: 15px 20px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .input-wrapper {
          display: flex;
          gap: 10px;
        }

        .input-wrapper textarea {
          flex: 1;
          padding: 12px 14px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 13px;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: all 0.2s;
          background: #f9fafb;
          color: #374151;
          line-height: 1.5;
        }

        .input-wrapper textarea:focus {
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-wrapper textarea:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .send-btn {
          background: linear-gradient(135deg, #80a1d4, #75c9c8);
          color: white;
          border: none;
          border-radius: 10px;
          width:60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 6px;
          padding-left: 4px;
        }

        /* Prévisualisation */
        .preview-header {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preview-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #333;
        }

        .preview-title h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .preview-title svg {
          color: #667eea;
        }

        .preview-actions-top {
          display: flex;
          gap: 8px;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 80px;
          justify-content: center;
        }

        .copy-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .copy-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .copy-btn svg {
          color: #667eea;
        }

        .regenerate-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
          justify-content: center;
        }

        .regenerate-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .regenerate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .regenerate-btn svg {
          color: #667eea;
        }

        /* Statistiques */
        .preview-stats {
          display: flex;
          gap: 12px;
          padding: 12px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e5e7eb;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
          background: white;
          padding: 6px 10px;
          border-radius: 6px;
        //   border: 1px solid #e5e7eb;
          flex: 1;
          justify-content: center;
        }

        /* Contenu de la prévisualisation */
        .preview-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: white;
        }

        .preview-text {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }

        .preview-text p {
          margin: 12px 0;
        }

        .preview-heading {
          margin: 16px 0 12px;
          color: #1f2937;
          font-size: 16px;
          font-weight: 700;
        }

        .preview-list-item {
          margin: 6px 0;
          padding-left: 8px;
          position: relative;
        }

        .preview-list-item:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #667eea;
        }

        .preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #9ca3af;
          text-align: center;
          height: 100%;
        }

        .preview-placeholder svg {
          margin-bottom: 16px;
          color: #d1d5db;
          opacity: 0.5;
        }

        .preview-placeholder h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: #6b7280;
        }

        .preview-placeholder p {
          margin: 0 0 4px;
          font-size: 14px;
        }

        .preview-placeholder small {
          font-size: 12px;
        }

        /* Conseils */
        .preview-tips {
          padding: 15px 20px;
          background: #f0f9ff;
          border-top: 1px solid #e0f2fe;
        }

        .tip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .tip span {
          font-size: 16px;
          margin-top: 2px;
        }

        .tip p {
          margin: 0;
          font-size: 13px;
          color: #0c4a6e;
          line-height: 1.5;
        }

        /* Pied de la modale */
        .modal-footer {
          padding: 15px 20px;
          background: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e5e7eb;
              }

        .cancel-btn {
          padding: 10px 20px;
          background: #E32D45;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
          
        }

        .footer-info small {
          color: #9ca3af;
          font-size: 12px;
        }

        .confirm-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 180px;
          justify-content: center;
        }

        .confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Animation pour le bouton appliqué */
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .confirm-btn:not(:disabled) {
          animation: ${applied ? 'successPulse 0.5s ease-in-out' : 'none'};
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ai-modal {
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-body {
            flex-direction: column;
          }

          .chat-side {
            flex: 1;
            min-height: 300px;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .preview-side {
            flex: 1;
            min-height: 300px;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .ai-stats {
            width: 100%;
            justify-content: flex-start;
          }

          .tone-selector,
          .chat-container,
          .input-container,
          .preview-header,
          .preview-content,
          .modal-footer {
            padding: 16px;
          }

          .preview-stats {
            padding: 12px 16px;
            flex-direction: column;
            gap: 8px;
          }

          .stat-item {
            width: 100%;
          }

          .preview-tips {
            padding: 12px 16px;
          }

          .tone-buttons {
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .tone-btn {
            white-space: nowrap;
          }

          .preview-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .preview-actions-top {
            width: 100%;
          }

          .copy-btn,
          .regenerate-btn {
            flex: 1;
            justify-content: center;
          }

          .modal-footer {
            flex-direction: column;
            gap: 10px;
          }

          .cancel-btn,
          .confirm-btn {
            width: 100%;
            justify-content: center;
          }
        }
.tone-btn {
  color: #666;              /* par défaut (non cliqué) */
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tone-btn.active {
  color: #fff;              /* cliqué → blanc */
  background-color: #1f2937; /* optionnel mais conseillé */
}

.tone-btn .tone-label {
  color: inherit;           /* hérite de la couleur du bouton */
}



      `}</style>
    </div>
  );
};

export default AIDescriptionModal;