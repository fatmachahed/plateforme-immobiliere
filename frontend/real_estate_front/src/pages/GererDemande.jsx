import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL from "../config";
import { CheckCircle2, XCircle, RefreshCw, Loader, Info, MapPin, Home, Banknote, Clock } from "lucide-react";

const STATUT_LABELS = {
  pending:  { label: "En attente de confirmation", color: "#f59e0b", bg: "#fffbeb" },
  active:   { label: "Active",     color: "#16a34a", bg: "#f0fdf4" },
  expired:  { label: "Expirée",    color: "#9ca3af", bg: "#f9fafb" },
  closed:   { label: "Clôturée",   color: "#6b7280", bg: "#f3f4f6" },
  refusee:  { label: "Refusée",    color: "#dc2626", bg: "#fef2f2" },
};

const CATEGORIE_LABELS = { achat: "Achat", location: "Location", vacances: "Vacances / saisonnier" };
const DELAI_LABELS = { urgent: "Urgent (< 1 mois)", "3mois": "Dans les 3 mois", reflexion: "En cours de réflexion" };

export default function GererDemande() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action"); // "confirm" | "close" | "renew"

  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success"|"error", text }

  useEffect(() => {
    fetchDemande();
    if (action === "confirm") handleAction("confirm");
    if (action === "close")   handleAction("close");
    if (action === "renew")   handleAction("renew");
  }, [token]);

  const fetchDemande = async () => {
    try {
      const res = await fetch(`${API_URL}/demandes/token/${token}`);
      if (!res.ok) throw new Error("Demande introuvable");
      setDemande(await res.json());
    } catch {
      setMessage({ type: "error", text: "Demande introuvable ou lien expiré." });
    }
    setLoading(false);
  };

  const handleAction = async (act) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/demandes/token/${token}/${act}`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Erreur serveur");
      }
      const msgs = {
        confirm: "Votre demande est confirmée. Notre équipe va l'assigner à l'agent le plus adapté à votre recherche.",
        close:   "Votre demande a été clôturée. Bonne chance pour votre projet !",
        renew:   "Votre demande a été renouvelée pour 30 jours supplémentaires.",
      };
      setMessage({ type: "success", text: msgs[act] });
      fetchDemande();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
    setActionLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="gd-page">
        <div className="gd-container">

          {loading ? (
            <div className="gd-center">
              <Loader size={32} className="gd-spin" color="#6366f1"/>
              <p>Chargement de votre demande…</p>
            </div>
          ) : message?.type === "error" && !demande ? (
            <div className="gd-center">
              <XCircle size={48} color="#ef4444"/>
              <h2 className="gd-err-title">Lien invalide</h2>
              <p className="gd-err-sub">{message.text}</p>
              <Link to="/deposer-une-demande" className="gd-btn gd-btn--primary">
                Déposer une nouvelle demande
              </Link>
            </div>
          ) : demande ? (
            <>
              <div className="gd-header">
                <h1 className="gd-title">Ma demande immobilière</h1>
                {demande.statut && (
                  <span className="gd-badge" style={{
                    color: STATUT_LABELS[demande.statut]?.color,
                    background: STATUT_LABELS[demande.statut]?.bg,
                  }}>
                    {STATUT_LABELS[demande.statut]?.label || demande.statut}
                  </span>
                )}
              </div>

              {message && (
                <div className={`gd-msg gd-msg--${message.type}`}>
                  {message.type === "success"
                    ? <CheckCircle2 size={18}/>
                    : <XCircle size={18}/>}
                  {message.text}
                </div>
              )}

              {/* Récapitulatif */}
              <div className="gd-card">
                <div className="gd-card__row">
                  <Home size={16} color="#6366f1"/>
                  <span className="gd-card__key">Type de bien</span>
                  <span className="gd-card__val">
                    {CATEGORIE_LABELS[demande.categorie] || demande.categorie} · {demande.type_bien}
                  </span>
                </div>
                {demande.gouvernorats?.length > 0 && (
                  <div className="gd-card__row">
                    <MapPin size={16} color="#6366f1"/>
                    <span className="gd-card__key">Gouvernorat</span>
                    <span className="gd-card__val">{demande.gouvernorats.join(", ")}</span>
                  </div>
                )}
                {demande.delegations?.length > 0 && (
                  <div className="gd-card__row">
                    <MapPin size={16} color="#6366f1"/>
                    <span className="gd-card__key">Délégation(s)</span>
                    <span className="gd-card__val">{demande.delegations.join(", ")}</span>
                  </div>
                )}
                {(demande.budget_min || demande.budget_max) && (
                  <div className="gd-card__row">
                    <Banknote size={16} color="#6366f1"/>
                    <span className="gd-card__key">Budget</span>
                    <span className="gd-card__val">
                      {demande.budget_min ? `${Number(demande.budget_min).toLocaleString("fr-TN")} ${demande.devise || "DT"}` : "—"}
                      {" "} → {" "}
                      {demande.budget_max ? `${Number(demande.budget_max).toLocaleString("fr-TN")} ${demande.devise || "DT"}` : "—"}
                    </span>
                  </div>
                )}
                {demande.delai && (
                  <div className="gd-card__row">
                    <Clock size={16} color="#6366f1"/>
                    <span className="gd-card__key">Délai</span>
                    <span className="gd-card__val">{DELAI_LABELS[demande.delai] || demande.delai}</span>
                  </div>
                )}
                {demande.description && (
                  <div className="gd-card__desc">
                    <p className="gd-card__desc-label">Description</p>
                    <p className="gd-card__desc-text">{demande.description}</p>
                  </div>
                )}
                {demande.expire_at && (
                  <div className="gd-card__expire">
                    <Info size={14}/>
                    Expire le {new Date(demande.expire_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="gd-actions">
                {demande.statut === "pending" && (
                  <button className="gd-btn gd-btn--primary" disabled={actionLoading}
                    onClick={() => handleAction("confirm")}>
                    <CheckCircle2 size={17}/>
                    Confirmer ma demande
                  </button>
                )}
                {(demande.statut === "active" || demande.statut === "expired") && (
                  <button className="gd-btn gd-btn--secondary" disabled={actionLoading}
                    onClick={() => handleAction("renew")}>
                    <RefreshCw size={17}/>
                    Renouveler (30 jours)
                  </button>
                )}
                {(demande.statut === "active" || demande.statut === "pending") && (
                  <button className="gd-btn gd-btn--danger" disabled={actionLoading}
                    onClick={() => handleAction("close")}>
                    <XCircle size={17}/>
                    Clôturer (j'ai trouvé)
                  </button>
                )}
              </div>

              <p className="gd-back">
                <Link to="/">← Retour à l'accueil</Link>
              </p>
            </>
          ) : null}
        </div>
      </div>
      <Footer />

      <style>{`
        .gd-page { min-height: 80vh; background: #f8fafc; padding: 48px 20px 80px; }
        .gd-container { max-width: 600px; margin: 0 auto; }
        .gd-center {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; text-align: center; padding: 60px 0;
        }
        .gd-spin { animation: gd-rotate 1s linear infinite; }
        @keyframes gd-rotate { to { transform: rotate(360deg); } }
        .gd-err-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
        .gd-err-sub   { font-size: 15px; color: #6b7280; margin: 0; }

        .gd-header {
          display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap; margin-bottom: 24px;
        }
        .gd-title  { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
        .gd-badge  {
          padding: 5px 14px; border-radius: 20px;
          font-size: 13px; font-weight: 600;
        }

        .gd-msg {
          display: flex; align-items: center; gap: 10px;
          border-radius: 10px; padding: 14px 16px;
          font-size: 14px; margin-bottom: 20px;
        }
        .gd-msg--success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .gd-msg--error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

        .gd-card {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 16px; padding: 24px;
          display: flex; flex-direction: column; gap: 0;
          margin-bottom: 28px;
        }
        .gd-card__row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 0; border-bottom: 1px solid #f3f4f6;
        }
        .gd-card__row:last-of-type { border-bottom: none; }
        .gd-card__key { font-size: 13px; color: #6b7280; font-weight: 500; min-width: 120px; }
        .gd-card__val { font-size: 14px; color: #0f172a; font-weight: 600; }
        .gd-card__desc { padding: 16px 0 4px; }
        .gd-card__desc-label { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 6px; }
        .gd-card__desc-text  { font-size: 14px; color: #374151; line-height: 1.6; margin: 0; }
        .gd-card__expire {
          display: flex; align-items: center; gap: 8px;
          font-size: 12.5px; color: #9ca3af; margin-top: 12px;
          padding-top: 12px; border-top: 1px solid #f3f4f6;
        }

        .gd-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .gd-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 20px; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          border: none; transition: all .15s;
        }
        .gd-btn:disabled { opacity: .6; cursor: not-allowed; }
        .gd-btn--primary   { background: #6366f1; color: #fff; }
        .gd-btn--primary:hover:not(:disabled)   { background: #4f46e5; }
        .gd-btn--secondary { background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; }
        .gd-btn--secondary:hover:not(:disabled) { background: #e2e8f0; }
        .gd-btn--danger    { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .gd-btn--danger:hover:not(:disabled)    { background: #fee2e2; }

        .gd-back { font-size: 14px; }
        .gd-back a { color: #6366f1; text-decoration: none; }
        .gd-back a:hover { text-decoration: underline; }
      `}</style>
    </>
  );
}
