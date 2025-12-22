import { useState } from "react";
import API from "../api/axios";

export default function CreateAnnonce() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/annonces", { title, description, address });
      alert("Annonce créée !");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer Annonce</h2>
      <input
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        placeholder="Adresse"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button type="submit">Créer</button>
    </form>
  );
}
