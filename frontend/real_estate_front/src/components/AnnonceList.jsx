import { useEffect, useState } from "react";
import API from "../api/axios";

export default function AnnonceList() {
  const [annonces, setAnnonces] = useState([]);

  useEffect(() => {
    const fetchAnnonces = async () => {
      try {
        const res = await API.get("/annonces");
        setAnnonces(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnnonces();
  }, []);

  return (
    <div>
      <h2>Liste des Annonces</h2>
      {annonces.map((a) => (
        <div key={a.id}>
          <h3>{a.title}</h3>
          <p>{a.description}</p>
          <p>{a.address}</p>
        </div>
      ))}
    </div>
  );
}
