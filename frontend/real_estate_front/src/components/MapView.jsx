import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';

const MapView = ({ onLocationChange, initialPosition }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(
    initialPosition || { lat: 36.8065, lng: 10.1815, address: 'Tunis, Tunisie' }
  );

  // Fonction pour récupérer l'adresse à partir des coordonnées
  const getAddressFromCoords = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Erreur de récupération de l\'adresse');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        // Construire une adresse lisible
        const addressParts = [];
        if (data.address.house_number) addressParts.push(data.address.house_number);
        if (data.address.road) addressParts.push(data.address.road);
        if (data.address.neighbourhood) addressParts.push(data.address.neighbourhood);
        if (data.address.postcode) addressParts.push(data.address.postcode);
        if (data.address.city || data.address.town || data.address.village) {
          addressParts.push(data.address.city || data.address.town || data.address.village);
        }
        if (data.address.country) addressParts.push(data.address.country);
        
        return addressParts.join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
      
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Erreur récupération adresse:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Initialisation de la carte
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        
        if (!mounted || !mapContainerRef.current) return;

        // Configuration des icônes Leaflet (punaises standards)
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Création de la carte
        const map = L.map(mapContainerRef.current).setView(
          [currentPosition.lat, currentPosition.lng], 
          13
        );
        mapRef.current = map;

        // Tuiles OpenStreetMap en français
        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">Contributeurs OpenStreetMap</a>',
          maxZoom: 20,
        }).addTo(map);

        // Créer une icône de punaise bleue
        const blueMarkerIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          shadowSize: [41, 41],
          shadowAnchor: [13, 41]
        });

        // Ajouter le marqueur DRAGGABLE avec l'icône de punaise bleue
        const marker = L.marker([currentPosition.lat, currentPosition.lng], {
          icon: blueMarkerIcon,
          draggable: true,
          autoPan: true,
          title: 'Position du bien'
        }).addTo(map);

        markerRef.current = marker;

        // Popup initial
        marker.bindPopup(`
          <div style="text-align: center; padding: 8px; min-width: 200px;">
            <strong style="color: #1e40af;">📍 Votre bien immobilier</strong><br/>
            <span style="color: #4b5563; font-size: 12px;">${currentPosition.address}</span><br/>
            <span style="color: #6b7280; font-size: 11px; margin-top: 5px; display: block;">
              Lat: ${currentPosition.lat.toFixed(6)}<br/>
              Lng: ${currentPosition.lng.toFixed(6)}
            </span>
            <p style="font-size: 10px; color: #9ca3af; margin-top: 5px;">
              Déplacez cette punaise pour ajuster la position
            </p>
          </div>
        `).openPopup();

        // Événement quand le marqueur est déplacé
        const handleMarkerDragEnd = async function(event) {
          const marker = event.target;
          const position = marker.getLatLng();
          
          // Récupérer l'adresse
          const address = await getAddressFromCoords(position.lat, position.lng);
          
          const newPosition = {
            lat: position.lat,
            lng: position.lng,
            address: address
          };
          
          setCurrentPosition(newPosition);
          
          // Mettre à jour le popup
          marker.getPopup().setContent(`
            <div style="text-align: center; padding: 8px; min-width: 200px;">
              <strong style="color: #1e40af;">📍 Nouvelle position</strong><br/>
              <span style="color: #4b5563; font-size: 12px;">${address}</span><br/>
              <span style="color: #6b7280; font-size: 11px; margin-top: 5px; display: block;">
                Lat: ${position.lat.toFixed(6)}<br/>
                Lng: ${position.lng.toFixed(6)}
              </span>
              <p style="font-size: 10px; color: #9ca3af; margin-top: 5px;">
                Déplacez cette punaise pour ajuster la position
              </p>
            </div>
          `).openPopup();
          
          // Notifier le parent
          if (onLocationChange) {
            onLocationChange(newPosition);
          }
        };

        marker.on('dragend', handleMarkerDragEnd);

        // Événement pour cliquer sur la carte pour déplacer le marqueur
        const handleMapClick = async function(event) {
          const { lat, lng } = event.latlng;
          
          // Récupérer l'adresse
          const address = await getAddressFromCoords(lat, lng);
          
          // Déplacer le marqueur
          marker.setLatLng([lat, lng]);
          
          const newPosition = { lat, lng, address };
          setCurrentPosition(newPosition);
          
          // Notifier le parent
          if (onLocationChange) {
            onLocationChange(newPosition);
          }
          
          // Mettre à jour le popup
          marker.getPopup().setContent(`
            <div style="text-align: center; padding: 8px; min-width: 200px;">
              <strong style="color: #1e40af;">📍 Nouvelle position</strong><br/>
              <span style="color: #4b5563; font-size: 12px;">${address}</span><br/>
              <span style="color: #6b7280; font-size: 11px; margin-top: 5px; display: block;">
                Lat: ${lat.toFixed(6)}<br/>
                Lng: ${lng.toFixed(6)}
              </span>
              <p style="font-size: 10px; color: #9ca3af; margin-top: 5px;">
                Déplacez cette punaise pour ajuster la position
              </p>
            </div>
          `).openPopup();
        };

        map.on('click', handleMapClick);

        // Contrôles en français
        L.control.scale({ imperial: false, metric: true, position: 'bottomleft' })
          .addTo(map)
          .getContainer().title = "Échelle de la carte";

        // Redimensionner
        setTimeout(() => {
          if (map && mounted) map.invalidateSize();
        }, 100);

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [getAddressFromCoords, onLocationChange]);

  // Mettre à jour si initialPosition change
  useEffect(() => {
    if (initialPosition && markerRef.current && mapRef.current) {
      setCurrentPosition(initialPosition);
      markerRef.current.setLatLng([initialPosition.lat, initialPosition.lng]);
      mapRef.current.setView([initialPosition.lat, initialPosition.lng], 13);
      
      // Mettre à jour le popup
      markerRef.current.getPopup().setContent(`
        <div style="text-align: center; padding: 8px; min-width: 200px;">
          <strong style="color: #1e40af;">📍 Votre bien immobilier</strong><br/>
          <span style="color: #4b5563; font-size: 12px;">${initialPosition.address}</span><br/>
          <span style="color: #6b7280; font-size: 11px; margin-top: 5px; display: block;">
            Lat: ${initialPosition.lat.toFixed(6)}<br/>
            Lng: ${initialPosition.lng.toFixed(6)}
          </span>
          <p style="font-size: 10px; color: #9ca3af; margin-top: 5px;">
            Déplacez cette punaise pour ajuster la position
          </p>
        </div>
      `);
    }
  }, [initialPosition]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={mapContainerRef}
        style={{
          height: '350px',
          width: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: isLoading ? '#f3f4f6' : 'transparent',
          cursor: 'pointer'
        }}
      />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(243, 244, 246, 0.9)',
          borderRadius: '16px',
          zIndex: 10
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }} />
            <p style={{ color: '#6b7280' }}>Chargement de la carte...</p>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div style={{ 
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 5,
        textAlign: 'center'
      }}>
        <p style={{ color: '#1f2937', margin: 0 }}>
          <strong>✨ Comment utiliser :</strong> Cliquez sur la carte OU déplacez la punaise
        </p>
      </div>

      {/* Légende avec coordonnées */}
      <div style={{ 
        position: 'absolute',
        bottom: '50px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 5,
        maxWidth: '250px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '16px solid #3b82f6',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: 'white',
              borderRadius: '50%'
            }} />
          </div>
          <span style={{ color: '#1f2937', fontWeight: '500' }}>Position du bien</span>
        </div>
        <div style={{ 
          height: '1px', 
          backgroundColor: '#e5e7eb', 
          margin: '6px 0' 
        }} />
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#6b7280', fontSize: '11px' }}>Latitude: </span>
          <span style={{ color: '#1f2937', fontWeight: '500' }}>{currentPosition.lat.toFixed(6)}</span>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#6b7280', fontSize: '11px' }}>Longitude: </span>
          <span style={{ color: '#1f2937', fontWeight: '500' }}>{currentPosition.lng.toFixed(6)}</span>
        </div>
        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #e5e7eb' }}>
          <span style={{ color: '#6b7280', fontSize: '11px' }}>Adresse: </span>
          <span style={{ color: '#1f2937', fontSize: '11px', display: 'block', marginTop: '2px' }}>
            {currentPosition.address}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
        }
        .leaflet-marker-draggable {
          cursor: move !important;
        }
      `}</style>
    </div>
  );
};

// Valeurs par défaut pour les props
MapView.defaultProps = {
  onLocationChange: null,
  initialPosition: { lat: 36.8065, lng: 10.1815, address: 'Tunis, Tunisie' }
};

export default MapView;