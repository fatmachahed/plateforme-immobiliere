// hooks/useLocalisation.js 
import { useEffect, useState } from "react";
import {
  getGouvernorats,
  getDelegations,
  getLocalites
} from "../api/localisation.api";

export default function useLocalisation(hierarchy) {
  const [gouvernorats, setGouvernorats] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [localites, setLocalites] = useState([]);
  const [loading, setLoading] = useState({
    gouvernorats: false,
    delegations: false,
    localites: false
  });
  const [error, setError] = useState(null);

  // Fetch gouvernorats
  useEffect(() => {
    const fetchGouvernorats = async () => {
      try {
        setLoading(prev => ({ ...prev, gouvernorats: true }));
        const response = await getGouvernorats();
        
        if (!response.data || !Array.isArray(response.data)) {
          setGouvernorats([]);
          return;
        }

        const formattedGouvernorats = response.data.map((gov, index) => {
          const id = gov.id || gov.value || index.toString();
          const nom = gov.nom || gov.name || gov.label || `Gouvernorat ${index + 1}`;
          
          return {
            value: id.toString(),
            label: nom,
            icon: "🏛️"
          };
        });
        
        setGouvernorats(formattedGouvernorats);
        setError(null);
        
      } catch (err) {
        setError(err.message || "Erreur de chargement des gouvernorats");
        // Données de secours pour le développement
        setGouvernorats([
          { value: "1", label: "Tunis", icon: "🏛️" },
          { value: "2", label: "Sfax", icon: "🏛️" },
          { value: "3", label: "Sousse", icon: "🏛️" }
        ]);
      } finally {
        setLoading(prev => ({ ...prev, gouvernorats: false }));
      }
    };

    fetchGouvernorats();
  }, []);

  // Fetch delegations
  useEffect(() => {
    const fetchDelegations = async () => {
      if (!hierarchy.gouvernorat) {
        setDelegations([]);
        return;
      }

      try {
        setLoading(prev => ({ ...prev, delegations: true }));
        const response = await getDelegations(hierarchy.gouvernorat);
        
        if (Array.isArray(response.data)) {
          const formattedDelegations = response.data.map(del => ({
            id: (del.id || del.value || "").toString(),
            nom: del.nom || del.name || ""
          }));
          setDelegations(formattedDelegations);
        } else {
          setDelegations([]);
        }
      } catch (err) {
        setDelegations([]);
      } finally {
        setLoading(prev => ({ ...prev, delegations: false }));
      }
    };

    fetchDelegations();
  }, [hierarchy.gouvernorat]);

  // Fetch localites
  useEffect(() => {
    const fetchLocalites = async () => {
      if (!hierarchy.delegation) {
        setLocalites([]);
        return;
      }

      try {
        setLoading(prev => ({ ...prev, localites: true }));
        const response = await getLocalites(hierarchy.delegation);
        
        if (Array.isArray(response.data)) {
          const formattedLocalites = response.data.map(loc => ({
            id: (loc.id || loc.value || "").toString(),
            nom: loc.nom || loc.name || ""
          }));
          setLocalites(formattedLocalites);
        } else {
          setLocalites([]);
        }
      } catch (err) {
        setLocalites([]);
      } finally {
        setLoading(prev => ({ ...prev, localites: false }));
      }
    };

    fetchLocalites();
  }, [hierarchy.delegation]);

  return { 
    gouvernorats, 
    delegations, 
    localites,
    loading: loading.gouvernorats || loading.delegations || loading.localites,
    error
  };
}