import { useEffect, useState } from "react";
import {
  getTypeBien,
  getCategories,
  getEtatBien
} from "../services/catalogueService";

export default function useCatalogue() {
  const [typeBiens, setTypeBiens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [etatBiens, setEtatBiens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [tb, cat, etat] = await Promise.all([
          getTypeBien(),
          getCategories(),
          getEtatBien()
        ]);

        setTypeBiens(tb || []);
        setCategories(cat || []);
        setEtatBiens(etat || []);
        setError(null);

      } catch (err) {
        setError("Erreur chargement catalogue");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return {
    typeBiens,
    categories,
    etatBiens,
    loading,
    error
  };
}
