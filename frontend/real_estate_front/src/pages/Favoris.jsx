import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useToast } from "../components/Toast";
import { Heart, MapPin, Trash2, Home, ArrowRight } from "lucide-react";


const TYPE_FR = {
  appartement: "Appartement", villa: "Villa", maison: "Maison",
  terrain: "Terrain", bureau: "Bureau", local_commercial: "Local com.", ferme: "Ferme",
};
const CAT_FR = { vente: "Vente", location: "Location", vacances: "Vacances" };

export default function Favoris() {
  const [favoris,  setFavoris]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const toast = useToast();
  const token = localStorage.getItem("token");
  const user  = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`\/users/me/favoris`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setFavoris(Array.isArray(data) ? data : []))
      .catch(() => setFavoris([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (annonceId) => {
    try {
      await fetch(`\/users/me/favoris/${annonceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavoris(prev => prev.filter(f => f.id !== annonceId));
      toast("Retiré des favoris.");
    } catch {
      toast("Erreur lors de la suppression.", "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div className="container" style={{ padding: "48px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <Heart size={22} color="#6366f1" fill="#6366f1" />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>Mes favoris</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {favoris.length} annonce{favoris.length !== 1 ? "s" : ""} sauvegardée{favoris.length !== 1 ? "s" : ""}
          </p>
        </div>

        {!token ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <Heart size={48} color="#e2e8f0" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Connectez-vous pour voir vos annonces sauvegardées.
            </p>
            <Link to="/login" className="btn btn-primary">Se connecter</Link>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            Chargement…
          </div>
        ) : favoris.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <Heart size={52} color="#e2e8f0" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ color: "var(--text-secondary)", marginBottom: 8 }}>Aucun favori pour l'instant</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
              Explorez les annonces et sauvegardez celles qui vous intéressent.
            </p>
            <Link to="/carte" className="btn btn-primary">
              <MapPin size={16} /> Explorer la carte
            </Link>
          </div>
        ) : (
          <div className="fav-grid">
            {favoris.map(f => (
              <div key={f.id} className="fav-card">
                <div className="fav-card__img">
                  {f.image
                    ? <img src={f.image.startsWith("/") ? `\${f.image}` : f.image} alt={f.titre} />
                    : <div className="fav-card__no-img"><Home size={32} color="#cbd5e1" /></div>
                  }
                  <span className={`fav-cat fav-cat--${f.categorie}`}>
                    {CAT_FR[f.categorie] || f.categorie}
                  </span>
                </div>
                <div className="fav-card__body">
                  <p className="fav-card__title">{f.titre}</p>
                  <p className="fav-card__loc">
                    <MapPin size={13} /> {f.gouvernorat || "—"}
                  </p>
                  <p className="fav-card__type">{TYPE_FR[f.type_bien] || f.type_bien}</p>
                  <div className="fav-card__foot">
                    <span className="fav-card__price">
                      {Number(f.prix).toLocaleString("fr-TN")} <small>{f.devise}</small>
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link to={`/annonce/${f.id}`} className="fav-btn fav-btn--view">
                        Voir <ArrowRight size={13} />
                      </Link>
                      <button className="fav-btn fav-btn--del" onClick={() => handleRemove(f.id)} title="Retirer des favoris">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        .fav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        .fav-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); overflow: hidden;
          transition: box-shadow .2s, transform .2s;
        }
        .fav-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
        .fav-card__img { position: relative; height: 190px; overflow: hidden; background: var(--bg); }
        .fav-card__img img { width: 100%; height: 100%; object-fit: cover; }
        .fav-card__no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .fav-cat {
          position: absolute; top: 10px; left: 10px;
          padding: 3px 10px; border-radius: var(--r-full);
          font-size: 11px; font-weight: 700; color: white;
        }
        .fav-cat--vente    { background: var(--primary); }
        .fav-cat--location { background: var(--success); }
        .fav-cat--vacances { background: var(--gold); }
        .fav-card__body { padding: 16px; }
        .fav-card__title {
          font-weight: 700; font-size: 15px; color: var(--text-primary);
          margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .fav-card__loc {
          display: flex; align-items: center; gap: 4px;
          font-size: 13px; color: var(--text-muted); margin-bottom: 4px;
        }
        .fav-card__type { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; }
        .fav-card__foot {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 12px; border-top: 1px solid var(--border-light);
        }
        .fav-card__price { font-size: 18px; font-weight: 800; color: var(--text-primary); }
        .fav-card__price small { font-size: 12px; font-weight: 500; color: var(--text-muted); }
        .fav-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 12px; border-radius: var(--r-sm);
          font-size: 13px; font-weight: 600; transition: all .15s; cursor: pointer; border: none;
        }
        .fav-btn--view {
          background: var(--primary-light); color: var(--primary);
        }
        .fav-btn--view:hover { background: var(--primary); color: white; }
        .fav-btn--del {
          background: #fef2f2; color: var(--danger);
        }
        .fav-btn--del:hover { background: var(--danger); color: white; }
        @media (max-width: 600px) {
          .fav-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
