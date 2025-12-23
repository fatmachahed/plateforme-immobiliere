// src/pages/Login.jsx
import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./css/Login.css";
import Layout from "../components/Layout";
import { Eye, EyeOff } from "react-feather";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await API.post(
      "/users/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    localStorage.setItem("token", res.data.access_token);
    navigate("/dashboard");
  } catch (err) {
    setError("Email ou mot de passe incorrect");
  }
};


  return (
    <Layout>
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Connexion</h2>
          <input
            type="email"
            placeholder="Email"
            style={{ background: "#f0f4f8", color: "#666" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            style={{ background: "#f0f4f8", color: "#666", paddingRight: "45px" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </span>
          </div>

          <button type="submit">Se connecter</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </Layout>
  );
}
