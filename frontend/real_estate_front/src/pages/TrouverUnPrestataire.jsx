import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import API_URL from "../config";
import { Search, MapPin, Phone, Mail, ChevronRight, Wrench, Landmark, Shield, Scale, Ruler, Star, Briefcase } from "lucide-react";

/* ── Secteurs : ordre d'affichage et métadonnées ── */
const SECTEURS = [
  { value: "banques",           label: "Banques",                              icon: Landmark, color: "#0369a1" },
  { value: "assurances",        label: "Assurances",                           icon: Shield,   color: "#7c3aed" },
  { value: "notaires_avocats",  label: "Notaires / Avocats",                   icon: Scale,    color: "#0f172a" },
  { value: "architectes",       label: "Architectes",                          icon: Ruler,    color: "#b45309" },
  { value: "artisans",          label: "Artisans / Professionnels du bâtiment",icon: Wrench,   color: "#15803d" },
];

const METIERS_ARTISAN = [
  "Architecte d'intérieur",
  "Carreleur / Poseur",
  "Charpentier",
  "Chapiste / Cuveleur (chape, cuvelage)",
  "Climaticien / Chauffagiste",
  "Conseiller immobilier",
  "Couvreur",
  "Cuisiniste",
  "Décorateur",
  "Déménageur",
  "Électricien",
  "Entrepreneur",
  "Entreprise VRD (Voieries, réseaux et aménagements extérieurs)",
  "Etancheur (étanchéité)",
  "Expert immobilier",
  "Géomètre / Topographe",
  "Ingénieur électricité",
  "Ingénieur fluides",
  "Ingénieur génie civil",
  "Ingénieur sécurité incendie",
  "Jardinier / Paysagiste",
  "Lustreur",
  "Maçon",
  "Menuisier aluminium",
  "Menuisier bois",
  "Peintre en bâtiment",
  "Photographe immobilier",
  "Pisciniste",
  "Plâtrier",
  "Plombier",
  "Serrurier / Métallier",
  "Autre",
];

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

function PartenaireCard({ p }) {
  const navigate = useNavigate();
  const photoUrl = resolveUrl(p.profile_picture);
  const initiale = (p.nom || "?")[0].toUpperCase();
  const secteur  = SECTEURS.find(s => s.value === p.secteur);
  const color    = secteur?.color || "#6366f1";

  return (
    <div
      onClick={() => navigate(`/prestataire/${p.id}`)}
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
        height: 140, background: `linear-gradient(135deg,${color},${color}cc)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, position: "relative", overflow: "hidden",
      }}>
        {photoUrl ? (
          <img src={photoUrl} alt={p.nom} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .85 }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: 18,
            background: "rgba(255,255,255,.2)", backdropFilter: "blur(4px)",
            border: "2px solid rgba(255,255,255,.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 900, color: "#fff",
          }}>{initiale}</div>
        )}
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, textAlign: "center" }}>{p.nom}</h3>
        {p.metier_artisan && (
          <p style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, textAlign: "center", margin: 0 }}>{p.metier_artisan}</p>
        )}
        {(p.gouvernorat || p.localite) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
            <MapPin size={11} style={{ flexShrink: 0, color: "#6366f1" }} />
            {[p.gouvernorat, p.localite].filter(Boolean).join(" · ")}
          </div>
        )}
        {(p.note != null || p.nombre_interventions > 0) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 12, marginTop: 2 }}>
            {p.note != null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#f59e0b", fontWeight: 700 }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" /> {Number(p.note).toFixed(1)}/5
              </span>
            )}
            {p.nombre_interventions > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#0f172a", fontWeight: 600 }}>
                <Briefcase size={12} color="#6366f1" /> {p.nombre_interventions} intervention{p.nombre_interventions > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 8, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {p.email && (
            <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6366f1", textDecoration: "none", fontWeight: 500 }}>
              <Mail size={12} /> {p.email}
            </a>
          )}
          {p.telephone && (
            <a href={`tel:${p.telephone}`} onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151", textDecoration: "none" }}>
              <Phone size={12} /> {p.telephone}
            </a>
          )}
          {!p.email && !p.telephone && (
            <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>Coordonnées non renseignées</span>
          )}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11.5, color: "#6366f1", fontWeight: 600 }}>
          Voir le profil <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

export default function TrouverUnPrestataire() {
  const [partenaires, setPartenaires] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchNom, setSearchNom]     = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterMetier, setFilterMetier]   = useState("");
  const [gouvernorats, setGouvernorats]   = useState([]);
  const [delegations, setDelegations]     = useState([]);
  const [filterGovId, setFilterGovId]     = useState("");
  const [filterGovNom, setFilterGovNom]   = useState("");
  const [filterDelNom, setFilterDelNom]   = useState("");

  useEffect(() => {
    fetch(`${API_URL}/users/partenaires/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPartenaires(Array.isArray(data) ? data : []); setLoading(false); })
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

  /* Filtrage global */
  const filtered = partenaires.filter(p => {
    const matchNom     = !searchNom     || (p.nom || "").toLowerCase().includes(searchNom.toLowerCase());
    const matchSecteur = !filterSecteur || p.secteur === filterSecteur;
    const matchMetier  = !filterMetier  || p.metier_artisan === filterMetier;
    const matchGov     = !filterGovNom  || (p.gouvernorat || "").toLowerCase() === filterGovNom.toLowerCase();
    const matchDel     = !filterDelNom  || (p.localite || "").toLowerCase().includes(filterDelNom.toLowerCase());
    return matchNom && matchSecteur && matchMetier && matchGov && matchDel;
  });

  /* Secteurs à afficher (tous ou seulement le secteur sélectionné) */
  const secteursToShow = filterSecteur
    ? SECTEURS.filter(s => s.value === filterSecteur)
    : SECTEURS;

  const totalFiltered = filtered.length;

  const selectStyle = {
    flex: "1 1 180px", minWidth: 160, padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.1)",
    fontSize: 13.5, fontFamily: "inherit", outline: "none", appearance: "none",
    boxSizing: "border-box", cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Poppins',system-ui,sans-serif" }}>
      <Seo
        title="Trouver un prestataire immobilier en Tunisie"
        description="Banques, assurances, notaires, architectes, artisans : trouvez un prestataire de confiance pour votre projet immobilier en Tunisie sur Localizi.tn."
        path="/trouver-un-prestataire"
      />
      <Navbar />

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
        padding: "56px 24px 90px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .04, backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 11 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: "50%", background: "rgba(99,102,241,.25)", marginBottom: 20, border: "1.5px solid rgba(99,102,241,.4)" }}>
            <Wrench size={28} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-.025em" }}>
            Prestataires &amp; Partenaires
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.6)", maxWidth: 560, margin: "0 auto 36px" }}>
            Artisans, architectes, notaires, banques… Trouvez le professionnel qu'il vous faut pour votre projet immobilier.
          </p>

          {/* Filtres */}
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>

            {/* Recherche nom */}
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 170 }}>
              <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.5)", pointerEvents: "none" }} />
              <input type="text" value={searchNom} onChange={e => setSearchNom(e.target.value)} placeholder="Rechercher par nom…"
                style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Secteur d'activité */}
            <select
              value={filterSecteur}
              onChange={e => { setFilterSecteur(e.target.value); setFilterMetier(""); }}
              style={{ ...selectStyle, color: filterSecteur ? "#fff" : "rgba(255,255,255,.55)" }}
            >
              <option value="" style={{ color: "#0f172a", background: "#fff" }}>Tous les secteurs</option>
              {SECTEURS.map(s => (
                <option key={s.value} value={s.value} style={{ color: "#0f172a", background: "#fff" }}>{s.label}</option>
              ))}
            </select>

            {/* Métier (artisans seulement) */}
            {filterSecteur === "artisans" && (
              <select
                value={filterMetier}
                onChange={e => setFilterMetier(e.target.value)}
                style={{ ...selectStyle, color: filterMetier ? "#fff" : "rgba(255,255,255,.55)" }}
              >
                <option value="" style={{ color: "#0f172a", background: "#fff" }}>Tous les métiers</option>
                {METIERS_ARTISAN.map(m => (
                  <option key={m} value={m} style={{ color: "#0f172a", background: "#fff" }}>{m}</option>
                ))}
              </select>
            )}

            {/* Gouvernorat */}
            <div style={{ position: "relative", flex: "1 1 170px", minWidth: 150 }}>
              <MapPin size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.5)", pointerEvents: "none" }} />
              <select value={filterGovId} onChange={e => handleGovChange(e.target.value)}
                style={{ ...selectStyle, paddingLeft: 34, color: filterGovId ? "#fff" : "rgba(255,255,255,.55)", width: "100%" }}>
                <option value="" style={{ color: "#0f172a", background: "#fff" }}>Tous les gouvernorats</option>
                {gouvernorats.map(g => <option key={g.id} value={g.id} style={{ color: "#0f172a", background: "#fff" }}>{g.nom}</option>)}
              </select>
            </div>

            {/* Délégation */}
            {delegations.length > 0 && (
              <select value={filterDelNom} onChange={e => setFilterDelNom(e.target.value)}
                style={{ ...selectStyle, color: filterDelNom ? "#fff" : "rgba(255,255,255,.55)", flex: "1 1 150px", minWidth: 130 }}>
                <option value="" style={{ color: "#0f172a", background: "#fff" }}>Toutes délégations</option>
                {delegations.map(d => <option key={d.id} value={d.nom} style={{ color: "#0f172a", background: "#fff" }}>{d.nom}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Contenu par sections */}
      <div style={{ maxWidth: 1200, margin: "-40px auto 60px", padding: "0 20px", position: "relative", zIndex: 5 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontSize: 15 }}>Chargement…</div>
        ) : totalFiltered === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px dashed #e2e8f0", textAlign: "center", padding: "60px 24px" }}>
            <Wrench size={40} style={{ color: "#d1d5db", marginBottom: 14 }} />
            <p style={{ fontWeight: 700, color: "#374151", fontSize: 15, margin: "0 0 6px" }}>Aucun prestataire trouvé</p>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Modifiez vos critères ou revenez plus tard.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28, fontWeight: 500 }}>
              {totalFiltered} prestataire{totalFiltered > 1 ? "s" : ""} trouvé{totalFiltered > 1 ? "s" : ""}
            </p>

            {secteursToShow.map(secteur => {
              const items = filtered.filter(p => p.secteur === secteur.value);
              if (items.length === 0) return null;
              const Icon = secteur.icon;
              return (
                <div key={secteur.value} style={{ marginBottom: 52 }}>
                  {/* En-tête de section */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: secteur.color + "18",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={20} color={secteur.color} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>{secteur.label}</h2>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{items.length} prestataire{items.length > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ flex: 1, height: 1, background: "#e2e8f0", marginLeft: 8 }} />
                  </div>

                  {/* Grille */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 18 }}>
                    {items.map(p => <PartenaireCard key={p.id} p={p} />)}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Vous êtes un professionnel ?</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 auto 24px", maxWidth: 500 }}>
          Inscrivez-vous sur Localizi.tn pour être référencé dans cet annuaire et recevoir des demandes de clients.
        </p>
        <Link to="/register?type=partenaire" style={{ display: "inline-block", background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 32px", borderRadius: 11, textDecoration: "none" }}>
          Créer un compte Prestataire
        </Link>
      </div>
      <Footer />
    </div>
  );
}
