// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Eye, EyeOff } from "react-feather";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const API_BASE_URL = "http://localhost:8000";
      const LOGIN_URL = `${API_BASE_URL}/users/login`;

      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) setError("Email ou mot de passe incorrect");
        else setError(errorData.detail || `Erreur serveur ${response.status}`);
        return;
      }

      const data = await response.json();

      if (!data.access_token) {
        setError("Réponse serveur invalide : token manquant");
        return;
      }

      localStorage.setItem("token", data.access_token);
      navigate("/recherche_annonce");
    } catch (err) {
      setError(`Erreur réseau : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Connexion</h2>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              style={{ background: "#f0f4f8", color: "#666" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                style={{ background: "#f0f4f8", color: "#666", paddingRight: "45px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>

          {error && (
            <div className="error-message">
              <p className="error">{error}</p>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}
