import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav>
      <Link to="/">Accueil</Link>
      <Link to="/dashboard">Dashboard</Link>
      <button onClick={handleLogout}>Déconnexion</button>
    </nav>
  );
}
