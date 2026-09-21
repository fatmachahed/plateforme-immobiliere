import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_URL from "../config";
import useLocalisation from "../hooks/useLocalisation";
import {
  Search, Home, MapPin, Banknote, Maximize2, BedDouble,
  Phone, Mail, User, CheckCircle2, ChevronDown, Info
} from "lucide-react";

const DEVISES = ["DT", "EUR", "USD"];

const TYPES_BIEN = [
  "Appartement","Villa","Duplex","Studio","Maison","Terrain",
  "Bureau","Local commercial","Ferme","Immeuble","Autre",
];

const CATEGORIES = [
  { val: "achat",    label: "Achat" },
  { val: "location", label: "Location" },
  { val: "vacances", label: "Vacances / saisonnier" },
];

const DELAIS = [
  { val: "urgent",   label: "Urgent (moins d'un mois)" },
  { val: "3mois",    label: "Dans les 3 mois" },
  { val: "reflexion",label: "En cours de réflexion" },
];

const NB_PIECES = ["1","2","3","4","5","6+","Indifférent"];

function Field({ label, required, children, hint }) {
  return (
    <div className="dd-field">
      <label className="dd-label">
        {label}{required && <span className="dd-req"> *</span>}
      </label>
      {hint && <p className="dd-hint">{hint}</p>}
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="dd-select-wrap">
      <select className="dd-select" value={value} onChange={e => onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.val} value={o.val}>{o.label}</option>
        )}
      </select>
      <ChevronDown size={16} className="dd-select-arrow"/>
    </div>
  );
}

export default function DeposerDemande() {
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")); }
    catch { return null; }
  })();

  const [form, setForm] = useState({
    nom:         storedUser?.username || storedUser?.nom || "",
    email:       storedUser?.email || "",
    telephone:   storedUser?.phone_number || "",
    whatsapp:    "",
    categorie:   "",
    type_bien:   "",
    gouvernorat_id: "",
    gouvernorat: "",
    delegations: [],
    budget_min:  "",
    budget_max:  "",
    devise:      "DT",
    surface_min: "",
    surface_max: "",
    nb_pieces:   "",
    meuble:      "",
    colocation:  "",
    delai:       "",
    description: "",
  });

  const [loading, setLoading]   = useState(false);
  const [done,    setDone]      = useState(false);
  const [error,   setError]     = useState("");

  const { gouvernorats, delegations, loading: locLoading } = useLocalisation({ gouvernorat: form.gouvernorat_id });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectGouvernorat = (id) => {
    const g = gouvernorats.find(g => g.value === id);
    setForm(f => ({ ...f, gouvernorat_id: id, gouvernorat: g?.label || "", delegations: [] }));
  };

  const toggleDelegation = (nom) => {
    setForm(f => ({
      ...f,
      delegations: f.delegations.includes(nom)
        ? f.delegations.filter(x => x !== nom)
        : [...f.delegations, nom],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.nom)           return setError("Nom et email sont requis.");
    if (!form.whatsapp)                     return setError("Le numéro WhatsApp est requis.");
    if (!form.categorie)                    return setError("Veuillez choisir une catégorie (achat / location).");
    if (!form.type_bien)                    return setError("Veuillez choisir un type de bien.");
    if (!form.gouvernorat)                  return setError("Sélectionnez un gouvernorat.");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/demandes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gouvernorats: form.gouvernorat ? [form.gouvernorat] : [] }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Erreur serveur");
      }
      setDone(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue, veuillez réessayer.");
    }
    setLoading(false);
  };

  if (done) return (
    <>
      <Navbar />
      <div className="dd-success-page">
        <div className="dd-success-card">
          <div className="dd-success-ico"><CheckCircle2 size={48} color="#22c55e"/></div>
          <h1 className="dd-success-title">Demande envoyée !</h1>
          <p className="dd-success-sub">
            Un email de confirmation vous a été envoyé à <strong>{form.email}</strong>.
            Cliquez sur le lien dans cet email pour activer votre demande et la rendre
            visible aux agents immobiliers.
          </p>
          <div className="dd-success-tip">
            <Info size={16}/>
            <span>Vérifiez vos spams si vous ne recevez pas l'email dans quelques minutes.</span>
          </div>
          <Link to="/" className="dd-success-btn">Retour à l'accueil</Link>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="dd-page">

        {/* Hero */}
        <div className="dd-hero">
          <div className="dd-hero__inner">
            <div className="dd-hero__ico"><Search size={28} color="#fff"/></div>
            <h1 className="dd-hero__title">Déposer une demande</h1>
            <p className="dd-hero__sub">
              Décrivez le bien que vous recherchez. Les agents immobiliers actifs
              dans la zone recherchée vous contacteront directement.
            </p>
          </div>
        </div>

        <div className="dd-container">
          <form className="dd-form" onSubmit={handleSubmit} noValidate>

            {/* ── Vos coordonnées ── */}
            <div className="dd-section">
              <div className="dd-section__head">
                <User size={18} color="#6366f1"/>
                <h2 className="dd-section__title">Vos coordonnées</h2>
              </div>
              <div className="dd-grid-2">
                <Field label="Nom / Prénom" required>
                  <input className="dd-input" value={form.nom}
                    onChange={e => set("nom", e.target.value)}
                    placeholder="Votre nom complet"/>
                </Field>
                <Field label="Email" required>
                  <input className="dd-input" type="email" value={form.email}
                    onChange={e => set("email", e.target.value)}
                    placeholder="votre@email.com"/>
                </Field>
                <Field label="WhatsApp" required hint="Visible uniquement aux agents inscrits">
                  <input className="dd-input" type="tel" value={form.whatsapp}
                    onChange={e => set("whatsapp", e.target.value)}
                    placeholder="+216 XX XXX XXX"/>
                </Field>
                <Field label="Téléphone" hint="Si différent du numéro WhatsApp">
                  <input className="dd-input" type="tel" value={form.telephone}
                    onChange={e => set("telephone", e.target.value)}
                    placeholder="+216 XX XXX XXX"/>
                </Field>
              </div>
            </div>

            {/* ── Votre projet ── */}
            <div className="dd-section">
              <div className="dd-section__head">
                <Home size={18} color="#6366f1"/>
                <h2 className="dd-section__title">Votre projet</h2>
              </div>
              <div className="dd-grid-2">
                <Field label="Catégorie" required>
                  <Select value={form.categorie} onChange={v => set("categorie", v)}
                    options={CATEGORIES} placeholder="Achat ou location ?"/>
                </Field>
                <Field label="Type de bien" required>
                  <Select value={form.type_bien} onChange={v => set("type_bien", v)}
                    options={TYPES_BIEN} placeholder="Appartement, villa…"/>
                </Field>
                <Field label="Délai du projet">
                  <Select value={form.delai} onChange={v => set("delai", v)}
                    options={DELAIS} placeholder="Quand souhaitez-vous ?"/>
                </Field>
                {form.categorie === "location" && (
                  <>
                    <Field label="Meublé">
                      <Select value={form.meuble} onChange={v => set("meuble", v)}
                        options={[
                          {val:"oui",label:"Oui, meublé"},
                          {val:"non",label:"Non, vide"},
                          {val:"indifferent",label:"Indifférent"},
                        ]} placeholder="Meublé ?"/>
                    </Field>
                    <Field label="Colocation acceptée">
                      <Select value={form.colocation} onChange={v => set("colocation", v)}
                        options={[
                          {val:"oui",label:"Oui"},
                          {val:"non",label:"Non"},
                        ]} placeholder="Colocation ?"/>
                    </Field>
                  </>
                )}
                <Field label="Nombre de pièces">
                  <Select value={form.nb_pieces} onChange={v => set("nb_pieces", v)}
                    options={NB_PIECES} placeholder="Peu importe"/>
                </Field>
              </div>
            </div>

            {/* ── Localisation ── */}
            <div className="dd-section">
              <div className="dd-section__head">
                <MapPin size={18} color="#6366f1"/>
                <h2 className="dd-section__title">Gouvernorat souhaité</h2>
              </div>
              <p className="dd-section__desc">Sélectionnez un gouvernorat.</p>
              <Field label="Gouvernorat" required>
                <Select value={form.gouvernorat_id} onChange={selectGouvernorat}
                  options={gouvernorats.map(g => ({ val: g.value, label: g.label }))}
                  placeholder="Choisir un gouvernorat…"/>
              </Field>

              {form.gouvernorat_id && (
                <div style={{ marginTop: 18 }}>
                  <p className="dd-section__desc" style={{ margin: "0 0 10px" }}>
                    Délégation(s) souhaitée(s) — vous pouvez en choisir plusieurs.
                  </p>
                  {locLoading ? (
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>Chargement des délégations…</p>
                  ) : delegations.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>Aucune délégation trouvée pour ce gouvernorat.</p>
                  ) : (
                    <div className="dd-gouv-grid">
                      {delegations.map(d => (
                        <button type="button" key={d.id}
                          className={`dd-gouv-chip${form.delegations.includes(d.nom) ? " dd-gouv-chip--on" : ""}`}
                          onClick={() => toggleDelegation(d.nom)}>
                          {d.nom}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Budget & surface ── */}
            <div className="dd-section">
              <div className="dd-section__head">
                <Banknote size={18} color="#6366f1"/>
                <h2 className="dd-section__title">Budget & surface</h2>
              </div>
              <div className="dd-budget-row">
                <Field label="Budget minimum">
                  <input className="dd-input" type="number" min="0" value={form.budget_min}
                    onChange={e => set("budget_min", e.target.value)}
                    placeholder="ex : 150 000"/>
                </Field>
                <Field label="Budget maximum">
                  <input className="dd-input" type="number" min="0" value={form.budget_max}
                    onChange={e => set("budget_max", e.target.value)}
                    placeholder="ex : 400 000"/>
                </Field>
                <Field label="Devise">
                  <Select value={form.devise} onChange={v => set("devise", v)}
                    options={DEVISES} placeholder=""/>
                </Field>
              </div>
              <div className="dd-grid-2">
                <Field label="Surface minimum (m²)">
                  <input className="dd-input" type="number" min="0" value={form.surface_min}
                    onChange={e => set("surface_min", e.target.value)}
                    placeholder="ex : 80"/>
                </Field>
                <Field label="Surface maximum (m²)">
                  <input className="dd-input" type="number" min="0" value={form.surface_max}
                    onChange={e => set("surface_max", e.target.value)}
                    placeholder="ex : 200"/>
                </Field>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="dd-section">
              <div className="dd-section__head">
                <Search size={18} color="#6366f1"/>
                <h2 className="dd-section__title">Décrivez votre recherche</h2>
              </div>
              <Field label="Description libre" hint="Précisez vos critères importants : vue mer, proche école, garage, jardin…">
                <textarea className="dd-textarea" rows={4} value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Ex : Je cherche un appartement calme avec balcon, proche des transports en commun à Tunis…"/>
              </Field>
            </div>

            {/* Info confidentialité */}
            <div className="dd-privacy-note">
              <Info size={15}/>
              <span>
                Vos coordonnées (téléphone, WhatsApp, email) seront visibles
                <strong> uniquement</strong> aux agents et agences immobilières
                inscrits et actifs dans le gouvernorat et les délégations sélectionnées.
              </span>
            </div>

            {error && <div className="dd-error">{error}</div>}

            <button type="submit" className="dd-submit" disabled={loading}>
              {loading ? "Envoi en cours…" : "Envoyer ma demande"}
            </button>
          </form>
        </div>
      </div>
      <Footer />

      <style>{`
        .dd-page { min-height: 100vh; background: #f8fafc; }

        /* Hero */
        .dd-hero {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 56px 24px 48px;
          text-align: center;
        }
        .dd-hero__inner { max-width: 640px; margin: 0 auto; }
        .dd-hero__ico {
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(255,255,255,.15);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }
        .dd-hero__title { font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 12px; }
        .dd-hero__sub   { font-size: 15px; color: rgba(255,255,255,.85); line-height: 1.6; margin: 0; }

        /* Container */
        .dd-container { max-width: 780px; margin: 0 auto; padding: 40px 20px 64px; }

        /* Form */
        .dd-form { display: flex; flex-direction: column; gap: 28px; }

        /* Section */
        .dd-section {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 16px; padding: 28px;
        }
        .dd-section__head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
        }
        .dd-section__title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
        .dd-section__desc  { font-size: 13px; color: #6b7280; margin: -12px 0 16px; }

        /* Grid */
        .dd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .dd-budget-row { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
        .dd-budget-row > .dd-field:first-child,
        .dd-budget-row > .dd-field:nth-child(2) { flex: 1; min-width: 0; }
        .dd-budget-row > .dd-field:last-child { flex: 0 0 auto; width: 95px; }
        .dd-budget-row > .dd-field:last-child .dd-select { padding-left: 10px; padding-right: 26px; }

        /* Field */
        .dd-field { display: flex; flex-direction: column; gap: 6px; }
        .dd-label { font-size: 13px; font-weight: 600; color: #374151; }
        .dd-req   { color: #ef4444; }
        .dd-hint  { font-size: 11.5px; color: #9ca3af; margin: -3px 0 0; }

        /* Inputs */
        .dd-input, .dd-select, .dd-textarea {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 14px; color: #0f172a; font-family: inherit;
          background: #fff; outline: none;
          transition: border-color .15s;
          box-sizing: border-box;
        }
        .dd-input:focus, .dd-select:focus, .dd-textarea:focus {
          border-color: #6366f1;
        }
        .dd-textarea { resize: vertical; min-height: 90px; }

        /* Select wrapper */
        .dd-select-wrap { position: relative; }
        .dd-select { appearance: none; padding-right: 36px; cursor: pointer; }
        .dd-select-arrow {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%); pointer-events: none; color: #9ca3af;
        }

        /* Gouvernorats chips */
        .dd-gouv-grid {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .dd-gouv-chip {
          padding: 7px 14px; border-radius: 20px;
          border: 1.5px solid #e5e7eb; background: #f9fafb;
          font-size: 13px; font-weight: 500; color: #374151;
          cursor: pointer; transition: all .15s;
        }
        .dd-gouv-chip:hover { border-color: #6366f1; color: #6366f1; }
        .dd-gouv-chip--on {
          background: #eef2ff; border-color: #6366f1;
          color: #4f46e5; font-weight: 600;
        }

        /* Privacy note */
        .dd-privacy-note {
          display: flex; align-items: flex-start; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 10px; padding: 14px 16px;
          font-size: 13px; color: #166534; line-height: 1.5;
        }
        .dd-privacy-note svg { flex-shrink: 0; margin-top: 2px; color: #16a34a; }

        /* Error */
        .dd-error {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: #b91c1c;
        }

        /* Submit */
        .dd-submit {
          width: 100%; padding: 14px;
          background: #6366f1; color: #fff;
          border: none; border-radius: 12px;
          font-size: 16px; font-weight: 700;
          cursor: pointer; transition: background .15s;
        }
        .dd-submit:hover:not(:disabled) { background: #4f46e5; }
        .dd-submit:disabled { opacity: .6; cursor: not-allowed; }

        /* Success page */
        .dd-success-page {
          min-height: 70vh; display: flex;
          align-items: center; justify-content: center;
          padding: 40px 20px;
        }
        .dd-success-card {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 20px; padding: 48px 40px;
          max-width: 520px; text-align: center;
        }
        .dd-success-ico { margin-bottom: 20px; }
        .dd-success-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
        .dd-success-sub   { font-size: 15px; color: #6b7280; line-height: 1.7; margin: 0 0 20px; }
        .dd-success-tip {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 8px; padding: 12px 14px;
          font-size: 13px; color: #92400e; text-align: left; margin-bottom: 28px;
        }
        .dd-success-tip svg { flex-shrink: 0; margin-top: 1px; color: #d97706; }
        .dd-success-btn {
          display: inline-block; padding: 12px 28px;
          background: #6366f1; color: #fff;
          border-radius: 10px; font-weight: 700; font-size: 15px;
          text-decoration: none; transition: background .15s;
        }
        .dd-success-btn:hover { background: #4f46e5; }

        @media (max-width: 600px) {
          .dd-hero { padding: 40px 16px 32px; }
          .dd-hero__title { font-size: 22px; }
          .dd-grid-2 { grid-template-columns: 1fr; }
          .dd-budget-row { flex-wrap: wrap; }
          .dd-budget-row > .dd-field:last-child { flex: 1 0 100%; min-width: 0; }
          .dd-section { padding: 20px 16px; }
          .dd-success-card { padding: 32px 20px; }
        }
      `}</style>
    </>
  );
}
