import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL from "../config";
import { Search, MapPin, Phone, Mail, Building2, ChevronRight, Star } from "lucide-react";

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

const ACCENT = "#6366f1";
const ACCENT_DARK = "#4f46e5";
const ACCENT_LIGHT = "#eef2ff";
const ACCENT_BORDER = "#c7d2fe";

function PromoteurCard({ p }) {
  const navigate = useNavigate();
  const photoUrl = resolveUrl(p.profile_picture);
  const initiale = (p.nom || "?")[0].toUpperCase();

  return (
    <div
      onClick={() => navigate(`/promoteur/${p.id}`)}
      style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
        overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.05)",
        transition: "transform .2s, box-shadow .2s", display: "flex", flexDirection: "column",
        cursor: "pointer",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.05)"; }}
    >
      <div style={{
        height: 160, background: "linear-gradient(135deg,#0f172a,#1e293b)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, position: "relative", overflow: "hidden",
      }}>
        {photoUrl ? (
          <img src={photoUrl} alt={p.nom} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .85 }} />
        ) : (
          <div style={{
            width: 90, height: 90, borderRadius: 20,
            background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, fontWeight: 900, color: "#fff",
            boxShadow: "0 6px 20px rgba(0,0,0,.25)",
          }}>{initiale}</div>
        )}
      </div>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a", margin: 0, textAlign: "center" }}>{p.nom}</h3>
        {(p.gouvernorat || p.localite) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12.5, color: "#64748b" }}>
            <MapPin size={12} style={{ flexShrink: 0, color: ACCENT }} />
            {[p.gouvernorat, p.localite].filter(Boolean).join(" · ")}
          </div>
        )}
        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 10, paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
          {p.email && (
            <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: ACCENT, textDecoration: "none", fontWeight: 500 }}>
              <Mail size={13} /> {p.email}
            </a>
          )}
          {p.telephone && (
            <a href={`tel:${p.telephone}`} onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151", textDecoration: "none" }}>
              <Phone size={13} /> {p.telephone}
            </a>
          )}
          {!p.email && !p.telephone && (
            <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>
              Coordonnées non renseignées
            </span>
          )}
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
          Voir les projets <ChevronRight size={13} />
        </div>
      </div>
    </div>
  );
}

export default function TrouverUnPromoteur() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchNom, setSearchNom]         = useState("");
  const [gouvernorats, setGouvernorats]   = useState([]);
  const [delegations, setDelegations]     = useState([]);
  const [filterGovId, setFilterGovId]     = useState("");
  const [filterGovNom, setFilterGovNom]   = useState("");
  const [filterDelNom, setFilterDelNom]   = useState("");

  useEffect(() => {
    fetch(`${API_URL}/users/promoteurs/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setProfessionals(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`${API_URL}/localisation/gouvernorats`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setGouvernorats(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleGovChange = (govId) => {
    setFilterGovId(govId); setFilterDelNom("");
    if (!govId) { setDelegations([]); setFilterGovNom(""); return; }
    const g = gouvernorats.find(g => String(g.id) === String(govId));
    setFilterGovNom(g?.nom || "");
    fetch(`${API_URL}/localisation/delegations?gouvernorat_id=${govId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setDelegations(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const filtered = professionals.filter(p => {
    const matchNom = !searchNom || (p.nom || "").toLowerCase().includes(searchNom.toLowerCase());
    const matchGov = !filterGovNom || (p.gouvernorat || "").toLowerCase() === filterGovNom.toLowerCase();
    const matchDel = !filterDelNom || (p.localite || "").toLowerCase().includes(filterDelNom.toLowerCase());
    return matchNom && matchGov && matchDel;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Poppins',system-ui,sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
        padding: "56px 24px 90px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .04, backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

        <img
          src="/images/creer-annonce-illus.png"
          alt=""
          className="tup-hero-illus"
          style={{
            position: "absolute", right: 40, bottom: 0,
            height: "95%", width: "auto",
            objectFit: "contain", zIndex: 10,
            filter: "drop-shadow(0 8px 32px rgba(0,0,0,.5))",
            pointerEvents: "none", opacity: 1,
          }}
        />
        <style>{`@media (max-width:860px){.tup-hero-illus{display:none!important;}}`}</style>

        <div style={{ position: "relative", zIndex: 11 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(245,158,11,.2)", marginBottom: 20,
            border: "1.5px solid rgba(245,158,11,.4)",
          }}>
            <Building2 size={28} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-.025em" }}>
            Promoteurs immobiliers
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.6)", maxWidth: 560, margin: "0 auto 36px" }}>
            Découvrez les promoteurs immobiliers enregistrés sur Localizi.tn et explorez leurs projets neufs en Tunisie.
          </p>

          {/* Filtres */}
          <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
              <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.5)" }} />
              <input type="text" value={searchNom} onChange={e => setSearchNom(e.target.value)} placeholder="Rechercher par nom…"
                style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
              <MapPin size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.5)", pointerEvents: "none" }} />
              <select value={filterGovId} onChange={e => handleGovChange(e.target.value)}
                style={{ width: "100%", padding: "11px 14px 11px 34px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.1)", color: filterGovId ? "#fff" : "rgba(255,255,255,.55)", fontSize: 13.5, fontFamily: "inherit", outline: "none", appearance: "none", boxSizing: "border-box", cursor: "pointer" }}>
                <option value="" style={{ color: "#0f172a", background: "#fff" }}>Tous les gouvernorats</option>
                {gouvernorats.map(g => <option key={g.id} value={g.id} style={{ color: "#0f172a", background: "#fff" }}>{g.nom}</option>)}
              </select>
            </div>

            {delegations.length > 0 && (
              <div style={{ flex: "1 1 160px", minWidth: 140 }}>
                <select value={filterDelNom} onChange={e => setFilterDelNom(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.1)", color: filterDelNom ? "#fff" : "rgba(255,255,255,.55)", fontSize: 13.5, fontFamily: "inherit", outline: "none", appearance: "none", boxSizing: "border-box", cursor: "pointer" }}>
                  <option value="" style={{ color: "#0f172a", background: "#fff" }}>Toutes délégations</option>
                  {delegations.map(d => <option key={d.id} value={d.nom} style={{ color: "#0f172a", background: "#fff" }}>{d.nom}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grille */}
      <div style={{ maxWidth: 1200, margin: "-40px auto 60px", padding: "0 20px", position: "relative", zIndex: 5 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontSize: 15 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px dashed #e2e8f0", textAlign: "center", padding: "60px 24px" }}>
            <Building2 size={40} style={{ color: "#d1d5db", marginBottom: 14 }} />
            <p style={{ fontWeight: 700, color: "#374151", fontSize: 15, margin: "0 0 6px" }}>Aucun promoteur trouvé</p>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Modifiez vos critères ou revenez plus tard.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, fontWeight: 500 }}>
              {filtered.length} promoteur{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 22 }}>
              {filtered.map(p => <PromoteurCard key={p.id} p={p} />)}
            </div>
          </>
        )}
      </div>

      <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Vous êtes un promoteur immobilier ?</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 auto 24px", maxWidth: 500 }}>Inscrivez-vous sur Localizi.tn pour être référencé dans cet annuaire et présenter vos projets à des milliers d'acheteurs.</p>
        <Link to="/register?type=promoteur" style={{ display: "inline-block", background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 32px", borderRadius: 11, textDecoration: "none" }}>
          Créer un compte Promoteur
        </Link>
      </div>
      <Footer />
    </div>
  );
}
