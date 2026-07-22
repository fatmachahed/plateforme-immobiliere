import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API_URL, { fmtDevise } from "../config";
import Navbar from "../components/Navbar";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, ShieldCheck, ShieldOff, Star, FileText, Eye } from "lucide-react";

const ROLE_LABELS = {
  particulier: "Particulier", agent: "Agent", agence: "Agence / Agent",
  promoteur: "Promoteur", partenaire: "Partenaire", professionnel: "Professionnel",
  manager_commercial: "Manager commercial", admin: "Administrateur",
};
const STATUS_LABELS = { approuvee: "Approuvée", en_attente: "En attente", refusee: "Refusée" };
const STATUS_COLORS = { approuvee: "#16a34a", en_attente: "#d97706", refusee: "#dc2626" };

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{value ?? "—"}</div>
    </div>
  );
}

export default function AdminUserView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_URL}/admin/users/${id}/detail`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.detail || "Impossible de charger cet utilisateur.");
        }
        return r.json();
      })
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 60px" }}>
        <button onClick={() => navigate("/admin")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 700, fontSize: 13.5, marginBottom: 18, padding: 0 }}>
          <ArrowLeft size={16} /> Retour à l'administration
        </button>

        <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "9px 14px", fontSize: 12.5, color: "#4338ca", fontWeight: 600, marginBottom: 18, display: "flex", alignItems: "center", gap: 7 }}>
          <Eye size={14} /> Vue admin — lecture seule. Pour modifier ce compte, utilisez le bouton "Modifier" depuis la liste des utilisateurs.
        </div>

        {loading ? (
          <p style={{ color: "#64748b" }}>Chargement…</p>
        ) : error ? (
          <p style={{ color: "#dc2626" }}>{error}</p>
        ) : (
          <>
            {/* Carte profil */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 28px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
                {user.profile_picture ? (
                  <img src={user.profile_picture.startsWith("http") ? user.profile_picture : `${API_URL}${user.profile_picture}`} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 800 }}>
                    {(user.username || "?")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: 0 }}>{user.username}</h1>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#4338ca", background: "#eef2ff", padding: "2px 10px", borderRadius: 999 }}>{ROLE_LABELS[user.role] || user.role}</span>
                    {user.is_blocked && <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: 999 }}>Bloqué</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: user.is_verified ? "#16a34a" : "#d97706", fontSize: 12.5, fontWeight: 600 }}>
                    {user.is_verified ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                    {user.is_verified ? "Email vérifié" : "Email non vérifié"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 18 }}>
                <Field label="Nom" value={user.nom} />
                <Field label="Prénom" value={user.prenom} />
                <Field label="Email" value={user.email} />
                <Field label="Téléphone" value={user.phone_number} />
                <Field label="Gouvernorat" value={user.gouvernorat} />
                <Field label="Localité" value={user.localite} />
                <Field label="Adresse" value={user.adresse} />
                {user.nom_entreprise && <Field label="Entreprise" value={user.nom_entreprise} />}
                {user.agence && <Field label="Agence rattachée" value={user.agence.nom} />}
                {user.matricule_fiscal && <Field label="Matricule fiscal" value={user.matricule_fiscal} />}
                {user.registre_commerce && <Field label="Registre de commerce" value={user.registre_commerce} />}
                {user.secteur_partenaire && <Field label="Secteur partenaire" value={user.secteur_partenaire} />}
                {user.metier_artisan && <Field label="Métier" value={user.metier_artisan} />}
                {user.promoteur_reference && <Field label="Référence promoteur" value={user.promoteur_reference} />}
                {user.profil_particulier && <Field label="Profil" value={user.profil_particulier} />}
                {user.sexe && <Field label="Sexe" value={user.sexe} />}
                {user.objectif && <Field label="Objectif" value={user.objectif} />}
                {user.note_prestataire != null && <Field label="Note prestataire" value={`${user.note_prestataire} / 5 (${user.nombre_avis || 0} avis)`} />}
                {user.nombre_interventions != null && <Field label="Interventions réalisées" value={user.nombre_interventions} />}
                <Field label="Inscrit le" value={user.created_at ? new Date(user.created_at).toLocaleString("fr-FR") : null} />
                <Field label="Dernière connexion" value={user.last_login ? new Date(user.last_login).toLocaleString("fr-FR") : "Jamais"} />
              </div>
            </div>

            {/* Stats annonces */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Total annonces", val: user.stats.total, color: "#0f172a" },
                { label: "Approuvées", val: user.stats.approuvees, color: "#16a34a" },
                { label: "En attente", val: user.stats.en_attente, color: "#d97706" },
                { label: "Refusées", val: user.stats.refusees, color: "#dc2626" },
                { label: "Vues cumulées", val: user.stats.vues, color: "#6366f1" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Annonces */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 7 }}>
                <FileText size={16} /> Annonces ({user.annonces.length})
              </h2>
              {user.annonces.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Aucune annonce publiée.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {user.annonces.map(a => (
                    <Link key={a.id} to={`/annonce/${a.id}`} target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #f1f5f9", textDecoration: "none", color: "inherit", flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{a.titre}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.reference || `#${a.id}`} · {a.gouvernorat || "—"} · {new Date(a.date_creation).toLocaleDateString("fr-FR")}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{a.prix ? `${Number(a.prix).toLocaleString("fr-TN")} ${fmtDevise(a.devise)}` : "—"}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[a.status] || "#64748b", background: "#f8fafc", padding: "2px 8px", borderRadius: 999 }}>{STATUS_LABELS[a.status] || a.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
