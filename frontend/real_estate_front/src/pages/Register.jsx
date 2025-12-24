import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./css/Login.css";
import Layout from "../components/Layout";
import { Eye, EyeOff } from "react-feather";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      // POST vers /users/ (avec / final)
      const res = await API.post("/users/", { username, email, password });
      
      // Si le backend ne renvoie pas de token automatiquement, tu peux rediriger
      navigate("/recherche_annonce");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.detail || "Email déjà utilisé");
      } else {
        setError("Erreur lors de l'inscription. Vérifiez vos informations");
      }
    }
  };

  return (
    <Layout>
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Inscription</h2>

          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"} // 🔄 inversé
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: "45px" }}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </span>
          </div>

          <div className="password-wrapper">
            <input
              type={showConfirm ? "text" : "password"} // 🔄 inversé
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ paddingRight: "45px" }}
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
            </span>
          </div>

          <button type="submit">S'inscrire</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </Layout>
  );
}
