import React, { useState, useRef, useEffect } from "react";
import { CheckCircle, Upload, FileText, CreditCard, HardHat, ChevronRight, ChevronLeft, Eye, X, AlertCircle, Clock, Shield } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const S = {
  root: { minHeight: "100vh", background: "linear-gradient(135deg,#fffbeb 0%,#fafafa 60%)", fontFamily: "'Poppins', system-ui, sans-serif", color: "#1e293b" },
  container: { maxWidth: 860, margin: "0 auto", padding: "40px 20px 80px" },
  stepper: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 48 },
  stepItem: () => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, position: "relative" }),
  stepCircle: (active, done) => ({ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, zIndex: 1, background: done ? "#22c55e" : active ? "#f59e0b" : "#e2e8f0", color: done || active ? "#fff" : "#94a3b8", border: active ? "3px solid #fcd34d" : "none", transition: "all .3s" }),
  stepLabel: (active, done) => ({ fontSize: 11, fontWeight: active || done ? 600 : 400, color: active ? "#f59e0b" : done ? "#22c55e" : "#94a3b8", textAlign: "center", lineHeight: 1.3 }),
  stepLine: (done) => ({ flex: 1, height: 3, background: done ? "#22c55e" : "#e2e8f0", marginBottom: 22, transition: "all .3s" }),
  card: { background: "#fff", borderRadius: 18, boxShadow: "0 4px 24px rgba(0,0,0,.07)", padding: "40px 48px", marginBottom: 24 },
  cardTitle: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  cardSub: { fontSize: 14, color: "#64748b", marginBottom: 32 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  formGroupFull: { display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color .15s" },
  select: { border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", appearance: "none", background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\") no-repeat right 12px center", cursor: "pointer" },
  uploadZone: (drag) => ({ border: `2px dashed ${drag ? "#f59e0b" : "#e2e8f0"}`, borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: drag ? "#fffbeb" : "#fafafa", transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }),
  uploadLabel: { fontSize: 13.5, fontWeight: 600, color: "#374151" },
  uploadHint: { fontSize: 11.5, color: "#94a3b8" },
  filePreviewRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 12px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" },
  filePreviewName: { flex: 1, fontSize: 12.5, color: "#0369a1", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  conventionBox: { height: 320, overflowY: "auto", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", fontSize: 13, lineHeight: 1.8, color: "#374151", background: "#fafafa" },
  checkRow: { display: "flex", alignItems: "flex-start", gap: 12, marginTop: 24, padding: "16px 20px", background: "#fffbeb", borderRadius: 10, border: "1.5px solid #fcd34d" },
  plansGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, marginTop: 8 },
  planCard: (selected, color) => ({ border: selected ? `2.5px solid ${color}` : "2px solid #e2e8f0", borderRadius: 14, padding: "24px 20px", cursor: "pointer", background: selected ? `${color}08` : "#fff", transition: "all .2s", position: "relative" }),
  planBadge: (color) => ({ position: "absolute", top: -1, right: 16, background: color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: "0 0 8px 8px", letterSpacing: ".04em" }),
  planName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  planPrice: (color) => ({ fontSize: 26, fontWeight: 800, color, marginBottom: 2 }),
  planPriceUnit: { fontSize: 13, color: "#64748b", marginBottom: 14 },
  planFeature: { fontSize: 12.5, color: "#374151", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 },
  statusCard: (color, bg) => ({ background: bg, border: `1.5px solid ${color}`, borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }),
  btnPrimary: { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
  btnSecondary: { background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 12, padding: "13px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
};

const DELEGATIONS = {
  "Tunis": ["Bab Bhar","Bab Souika","Carthage","El Hrairia","El Kabaria","El Menzah","El Omrane","El Omrane Supérieur","El Ouardia","Ettahrir","Ezzouhour","Ghazela","La Goulette","La Marsa","Le Bardo","Séjoumi","Sidi El Béchir","Sidi Hassine"],
  "Ariana": ["Ariana Ville","Ettadhamen","Kalâat el-Andalous","La Soukra","Mnihla","Raoued","Sidi Thabet"],
  "Ben Arous": ["Ben Arous","Bou Mhel el-Bassatine","El Mourouj","Ezzahra","Fouchana","Hammam Chott","Hammam Lif","Medina Jedida","Mégrine","Mohamedia","Radès","Nouvelle Médina"],
  "Manouba": ["Borj El Amri","Djedeida","El Battan","La Manouba","Mornaguia","Oued Ellil","Tébourba","Douar Hicher"],
  "Nabeul": ["Béni Khalled","Béni Khiar","Bou Argoub","Cap Bon","Dar Chaabane El Fehri","El Haouaria","El Mida","Grombalia","Hammam Ghezèze","Hammamet","Kélibia","Korbous","Menzel Bouzelfa","Menzel Temime","Nabeul","Soliman","Takelsa"],
  "Zaghouan": ["Bir Mcherga","El Fahs","Nadhour","Saouef","Zaghouan","Zriba"],
  "Bizerte": ["Bizerte Nord","Bizerte Sud","El Alia","Ghezala","Ghar El Melah","Joumine","Mateur","Menzel Bourguiba","Menzel Jemil","Protville","Ras Jebel","Sejnane","Tinja","Utique","Zarzouna"],
  "Béja": ["Amdoun","Béja Nord","Béja Sud","Goubellat","Medjez el-Bab","Nefza","Téboursouk","Testour","Thibar"],
  "Jendouba": ["Ain Draham","Balta-Bou Aouane","Bou Salem","Fernana","Ghardimaou","Jendouba","Jendouba Nord","Oued Mliz","Tabarka"],
  "Le Kef": ["Dahmani","El Ksour","Jérissa","Kalaa Khasba","Kalaat Senan","Le Kef Est","Le Kef Ouest","Le Sers","Nebeur","Sakiet Sidi Youssef","Tajerouine"],
  "Siliana": ["Bargou","Bou Arada","El Aroussa","El Krib","Gaâfour","Kesra","Makthar","Rouhia","Sidi Bou Rouis","Siliana Nord","Siliana Sud"],
  "Sousse": ["Akouda","Bou Ficha","Enfidha","Hammam Sousse","Hergla","Kalâa Kebira","Kalâa Sghira","Kondar","M'saken","Sidi Bou Ali","Sidi El Hani","Sousse Jaouhara","Sousse Médina","Sousse Riadh","Sousse Sidi Abdelhamid"],
  "Monastir": ["Bekalta","Bembla","Beni Hassen","Jemmal","Ksar Hellal","Ksibet el-Médiouni","Moknine","Monastir","Ouerdanine","Sahline","Sayada-Lamta-Bou Hajar","Téboulba","Zeramdine"],
  "Mahdia": ["Bou Merdes","Chorbane","El Djem","Essouassi","Hebira","Ksour Essef","La Chebba","Mahdia","Melloulèche","Ouled Chamekh","Sidi Alouane"],
  "Sfax": ["Agareb","Bir Ali Ben Khalifa","El Ain","El Amra","El Hancha","Ghraiba","Jebeniana","Kerkennah","Mahrès","Menzel Chaker","Sakiet Eddaïer","Sakiet Ezzit","Sfax Est","Sfax Ouest","Sfax Ville","Skhira","Thyna","Tina"],
  "Kairouan": ["Bou Hajla","Chebika","Chrarda","El Alâa","Haffouz","Hajeb El Ayoun","Kairouan Nord","Kairouan Sud","Nasrallah","Oueslatia","Sbikha"],
  "Kasserine": ["Ayoun","El Ayoun","Ezzouhour","Fériana","Foussana","Haïdra","Hassi El Frid","Jedeliane","Majel Bel Abbès","Sbeitla","Sbiba","Thala","Kasserine Nord","Kasserine Sud"],
  "Sidi Bouzid": ["Bir El Hafey","Cebbala Ouled Asker","Jilma","Maknassy","Meknassy","Menzel Bouzaiane","Mezzouna","Ouled Haffouz","Regueb","Sidi Ali Ben Aoun","Sidi Bouzid Est","Sidi Bouzid Ouest","Souk Jedid"],
  "Gabès": ["El Hamma","Ghannouch","Gabès Médina","Gabès Ouest","Gabès Sud","Kettana","Mareth","Matmata","Nouvelle Matmata","Menzel El Habib"],
  "Medenine": ["Beni Khedache","Ben Gardane","Djerba - Ajim","Djerba - Houmt Souk","Djerba - Midoun","Medenine Nord","Medenine Sud","Sidi Makhlouf","Zarzis"],
  "Tataouine": ["Bir Lahmar","Dehiba","Ghomrassen","Remada","Smar","Tataouine Nord","Tataouine Sud"],
  "Gafsa": ["Belkhir","El Guetar","El Ksar","Gafsa Nord","Gafsa Sud","Lalla","Mdhilla","Metlaoui","Moularès","Redeyef","Sned"],
  "Tozeur": ["Degache","Hazoua","Nefta","Tameghza","Tozeur"],
  "Kébili": ["Douz Nord","Douz Sud","El Faouar","Kébili Nord","Kébili Sud","Souk Lahad"],
};

const STEPS = [
  { label: "Informations\nentreprise" },
  { label: "Documents\njustificatifs" },
  { label: "Convention\n& signature" },
  { label: "Abonnement" },
  { label: "Confirmation" },
];

const DOCS_CONFIG = [
  { key: "patente",   label: "Patente commerciale",          hint: "PDF ou image, max 5 Mo", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "rc",        label: "Registre de commerce",         hint: "PDF ou image, max 5 Mo", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "cin",       label: "CIN du dirigeant (recto/verso)",hint: "PDF ou image, max 5 Mo", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "logo",      label: "Logo de l'entreprise",         hint: "PNG ou JPG recommandé, max 2 Mo", accept: ".png,.jpg,.jpeg" },
];

const PLANS = [
  {
    id: "gratuit", name: "Gratuit", price: 0, period: "pour toujours",
    color: "#64748b", badge: null, popular: false,
    features: [
      { label: "1 projet actif simultané",        ok: true  },
      { label: "10 annonces actives",              ok: true  },
      { label: "0 boosts / mois",                 ok: false },
      { label: "0 Refresh / mois",                ok: false },
      { label: "Espace Boutique promoteur",        ok: false },
      { label: "Badge Promoteur Certifié",         ok: true  },
      { label: "Statistiques temps réel",          ok: false },
      { label: "Rapport marché mensuel",           ok: false },
      { label: "Account manager dédié",            ok: false },
    ],
  },
  {
    id: "basic", name: "Basic", price: 249, period: "/ mois",
    color: "#fb923c", badge: "3 mois offerts", popular: false,
    features: [
      { label: "1 projet actif",                       ok: true  },
      { label: "40 annonces actives",                  ok: true  },
      { label: "5 boosts / mois",                      ok: true  },
      { label: "50 Refresh / mois",                    ok: true  },
      { label: "Espace Boutique promoteur",             ok: true  },
      { label: "Badge Promoteur Certifié",              ok: true  },
      { label: "Support WhatsApp 24h/24 7j/7",          ok: true  },
      { label: "Statistiques temps réel",               ok: false },
      { label: "Rapport marché mensuel",                ok: false },
      { label: "Account manager dédié",                 ok: false },
    ],
  },
  {
    id: "standard", name: "Standard", price: 499, period: "/ mois",
    color: "#f97316", badge: "3 mois offerts", popular: false,
    features: [
      { label: "3 projets actifs simultanés",          ok: true  },
      { label: "80 annonces actives",                  ok: true  },
      { label: "10 boosts / mois",                     ok: true  },
      { label: "100 Refresh / mois",                   ok: true  },
      { label: "Espace Boutique promoteur",             ok: true  },
      { label: "Badge Promoteur Certifié",              ok: true  },
      { label: "Support WhatsApp 24h/24 7j/7",          ok: true  },
      { label: "Statistiques temps réel",               ok: true  },
      { label: "Rapport marché mensuel",                ok: false },
      { label: "Account manager dédié",                 ok: false },
    ],
  },
  {
    id: "premium", name: "Premium", price: 749, period: "/ mois",
    color: "#ea580c", badge: "Recommandé", popular: true,
    features: [
      { label: "Projets illimités",                    ok: true  },
      { label: "120 annonces actives",                 ok: true  },
      { label: "30 boosts / mois",                     ok: true  },
      { label: "300 Refresh / mois",                   ok: true  },
      { label: "Espace Boutique premium",              ok: true  },
      { label: "Badge Promoteur Étoile",               ok: true  },
      { label: "Support WhatsApp 24h/24 7j/7",          ok: true  },
      { label: "Statistiques temps réel",               ok: true  },
      { label: "Rapport marché mensuel",                ok: true  },
      { label: "Notifications push acheteurs",          ok: true  },
    ],
  },
];

const CONVENTION_TEXT = `CONVENTION DE PARTENARIAT — LOCALIZI.TN

Entre la société LOCALIZI.TN (ci-après « la Plateforme ») et le Promoteur soussigné (ci-après « le Promoteur »).

ARTICLE 1 — OBJET
La présente convention a pour objet de définir les modalités de collaboration entre la Plateforme et le Promoteur dans le cadre de la promotion et diffusion de projets immobiliers neufs sur le portail LOCALIZI.TN.

ARTICLE 2 — ENGAGEMENTS DU PROMOTEUR
Le Promoteur s'engage à :
  • Fournir des informations exactes et vérifiables sur son identité, son activité et ses projets.
  • Publier uniquement des projets conformes à la réglementation tunisienne en vigueur.
  • Disposer de toutes les autorisations légales nécessaires pour les projets présentés.
  • Ne pas diffuser de fausses informations ou de contenus trompeurs sur ses projets.
  • Respecter les conditions générales d'utilisation de la Plateforme.
  • Mettre à jour les informations relatives à l'avancement des projets.

ARTICLE 3 — ENGAGEMENTS DE LA PLATEFORME
La Plateforme s'engage à :
  • Mettre à disposition du Promoteur un espace dédié et sécurisé.
  • Assurer la visibilité des projets conformément au plan d'abonnement souscrit.
  • Fournir les outils de gestion (tableau de bord, statistiques, boosts).
  • Traiter les données personnelles conformément à la réglementation tunisienne.

ARTICLE 4 — DURÉE
La convention est conclue pour la durée du plan d'abonnement souscrit, renouvelable par tacite reconduction, sauf résiliation avec préavis de 30 jours.

ARTICLE 5 — CONFIDENTIALITÉ
Les parties s'engagent à maintenir la stricte confidentialité de toutes les informations échangées.

ARTICLE 6 — RÉSILIATION
La Plateforme se réserve le droit de résilier la convention en cas de non-respect des présents engagements.

ARTICLE 7 — LOI APPLICABLE
La présente convention est soumise au droit tunisien. Tout litige sera soumis aux juridictions compétentes de Tunis.

En cochant la case ci-dessous, le Promoteur déclare avoir lu, compris et accepté l'intégralité de la présente convention de partenariat.`;

const LEGAL_REQUIRED = [
  { key: "nom_entreprise",    label: "Raison sociale" },
  { key: "responsable",       label: "Nom du dirigeant" },
  { key: "matricule_fiscal",  label: "Matricule fiscal" },
  { key: "registre_commerce", label: "Registre de commerce" },
  { key: "adresse",           label: "Adresse du siège social" },
  { key: "gouvernorat",       label: "Gouvernorat" },
  { key: "delegation",        label: "Délégation" },
  { key: "telephone",         label: "Téléphone" },
  { key: "email",             label: "Email professionnel" },
];

function getLegalErrors(data) {
  const errors = {};
  LEGAL_REQUIRED.forEach(({ key, label }) => {
    if (!data[key] || !String(data[key]).trim()) errors[key] = `${label} est obligatoire`;
  });
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Email invalide";
  return errors;
}

function UploadField({ config, value, onChange, onPreview }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  function handleFiles(files) { if (!files || !files[0]) return; onChange(config.key, files[0]); }
  return (
    <div>
      <div style={S.label}>{config.label}</div>
      <div style={S.uploadZone(drag)} onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}>
        <Upload size={20} color={drag ? "#f59e0b" : "#94a3b8"} />
        <span style={S.uploadLabel}>{value ? "Remplacer le fichier" : "Glisser-déposer ou cliquer"}</span>
        <span style={S.uploadHint}>{config.hint}</span>
        <input ref={ref} type="file" accept={config.accept} style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>
      {value && (
        <div style={S.filePreviewRow}>
          <FileText size={16} color="#f59e0b" />
          <span style={S.filePreviewName}>{value.name}</span>
          <button onClick={() => onPreview(value)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e0b", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
            <Eye size={14} /> Voir
          </button>
          <button onClick={() => onChange(config.key, null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function PreviewModal({ file, onClose }) {
  if (!file) return null;
  const url = URL.createObjectURL(file);
  const isImage = file.type.startsWith("image/");
  const isPDF = file.type === "application/pdf";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, maxWidth: 800, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #e2e8f0", gap: 10 }}>
          <FileText size={18} color="#f59e0b" />
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{file.name}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f8fafc" }}>
          {isImage && <img src={url} alt={file.name} style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }} />}
          {isPDF && <iframe src={url} title={file.name} style={{ width: "100%", height: "70vh", border: "none", borderRadius: 8 }} />}
          {!isImage && !isPDF && <div style={{ textAlign: "center", color: "#64748b" }}><FileText size={48} style={{ marginBottom: 12, opacity: .4 }} /><div style={{ fontSize: 14 }}>Aperçu non disponible.</div></div>}
        </div>
      </div>
    </div>
  );
}

function getOnboardingKeyPromoteur() {
  try { const u = JSON.parse(localStorage.getItem("user")||"{}"); return `localizi_onboarding_promoteur_${u.id||u.username||"anon"}`; }
  catch { return "localizi_onboarding_promoteur_anon"; }
}

function savePromoteurProgress(step, onProgressChange, formState = {}) {
  const status = step >= 4 ? "soumis" : "en_cours";
  const existing = (() => { try { return JSON.parse(localStorage.getItem(getOnboardingKeyPromoteur())||"{}"); } catch { return {}; } })();
  localStorage.setItem(getOnboardingKeyPromoteur(), JSON.stringify({ ...existing, step, total: 5, status, ...formState }));
  onProgressChange?.();
}

export default function PromoteurOnboarding({ embedded = false, onProgressChange }) {
  const [step, setStep] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(getOnboardingKeyPromoteur())||"{}"); return Math.min(s.step||0, 4); } catch { return 0; }
  });
  const [legalData, setLegalData] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(getOnboardingKeyPromoteur())||"{}"); return s.legalData || {}; } catch { return {}; }
  });
  const [docs, setDocs] = useState({});
  const [conventionAccepted, setConventionAccepted] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(getOnboardingKeyPromoteur())||"{}"); return !!s.conventionAccepted; } catch { return false; }
  });
  const [signedAt, setSignedAt] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(getOnboardingKeyPromoteur())||"{}"); return s.signedAt || null; } catch { return null; }
  });
  const [selectedPlan, setSelectedPlan] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(getOnboardingKeyPromoteur())||"{}"); return s.selectedPlan || "standard"; } catch { return "standard"; }
  });
  const [previewFile, setPreviewFile] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const scrollRef = useRef();
  const [scrolled, setScrolled] = useState(false);

  // Si le formulaire était déjà soumis avant l'ajout du backend, on re-soumet au montage
  useEffect(() => {
    if (step === 4) submitConventionToServer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateLegal(key, val) { setLegalData(d => ({ ...d, [key]: val })); setShowErrors(false); }
  function updateDoc(key, file) { setDocs(d => ({ ...d, [key]: file })); }
  function handleAcceptConvention(val) { setConventionAccepted(val); if (val && !signedAt) setSignedAt(new Date().toISOString()); if (!val) setSignedAt(null); }

  function isStepValid() { return true; }

  async function submitConventionToServer() {
    try {
      const token = localStorage.getItem("localizi_token") || localStorage.getItem("token");
      if (!token) return;
      const API_URL = (await import("../config")).default;

      // Upload des pièces jointes
      const docsUrls = {};
      for (const cfg of DOCS_CONFIG) {
        const file = docs[cfg.key];
        if (!file || typeof file === "string") {
          if (typeof file === "string") docsUrls[cfg.key] = file;
          continue;
        }
        try {
          const fd = new FormData();
          fd.append("file", file);
          const r = await fetch(`${API_URL}/upload/convention-doc`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (r.ok) { const d = await r.json(); docsUrls[cfg.key] = d.url; }
        } catch {}
      }

      await fetch(`${API_URL}/users/me/convention`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "promoteur",
          form_data: { ...legalData, conventionAccepted, signedAt, plan: selectedPlan, docs: docsUrls },
        }),
      });
    } catch {}
  }

  function handleNext() {
    if (isStepValid()) {
      setShowErrors(false);
      const next = step + 1;
      setStep(next);
      savePromoteurProgress(next, onProgressChange, { legalData, conventionAccepted, signedAt, selectedPlan });
      if (next === 4) submitConventionToServer();
    } else setShowErrors(true);
  }

  const legalErrors = showErrors && step === 0 ? getLegalErrors(legalData) : {};
  const errorCount = Object.keys(legalErrors).length;
  const delegations = legalData.gouvernorat ? (DELEGATIONS[legalData.gouvernorat] || []) : [];
  const plan = PLANS.find(p => p.id === selectedPlan);
  const docsCount = DOCS_CONFIG.filter(d => docs[d.key]).length;

  const inputStyle = key => ({ ...S.input, borderColor: legalErrors[key] ? "#ef4444" : "#e2e8f0" });
  const selectStyle = key => ({ ...S.select, borderColor: legalErrors[key] ? "#ef4444" : "#e2e8f0" });
  const errMsg = key => legalErrors[key] ? <span style={{ fontSize: 11.5, color: "#ef4444", marginTop: 2 }}>{legalErrors[key]}</span> : null;
  const field = (key, label, placeholder, full = false) => (
    <div style={full ? S.formGroupFull : S.formGroup}>
      <label style={S.label}>{label}</label>
      <input style={inputStyle(key)} placeholder={placeholder} value={legalData[key] || ""} onChange={e => updateLegal(key, e.target.value)} />
      {errMsg(key)}
    </div>
  );

  const wizardInner = (
    <><div style={S.container}>
        {/* Stepper */}
        <div style={S.stepper}>
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={S.stepLine(i <= step)} />}
              <div style={{ ...S.stepItem(step === i, i < step), cursor: "pointer" }} onClick={() => { setShowErrors(false); const t=i; setStep(t); savePromoteurProgress(t, onProgressChange, { legalData, conventionAccepted, signedAt, selectedPlan }); }}>
                <div style={S.stepCircle(step === i, i < step)}>
                  {i < step ? <CheckCircle size={20} /> : i + 1}
                </div>
                <span style={S.stepLabel(step === i, i < step)}>
                  {s.label.split("\n").map((l, j) => <React.Fragment key={j}>{l}{j === 0 && <br />}</React.Fragment>)}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={S.card}>
          {/* Errors banner */}
          {showErrors && errorCount > 0 && step === 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:"#fef2f2", borderRadius:10, border:"1.5px solid #fecaca", marginBottom:24 }}>
              <AlertCircle size={18} color="#dc2626" />
              <span style={{ fontSize:13, color:"#dc2626", fontWeight:600 }}>{errorCount} champ{errorCount > 1 ? "s" : ""} obligatoire{errorCount > 1 ? "s" : ""} manquant{errorCount > 1 ? "s" : ""}.</span>
            </div>
          )}

          {/* Step 0 — Infos légales */}
          {step === 0 && (
            <>
              <div style={S.cardTitle}>Informations de l'entreprise</div>
              <div style={S.cardSub}>Renseignez les informations officielles de votre société de promotion immobilière.</div>
              <div style={S.formGrid}>
                {field("nom_entreprise", "Raison sociale *", "Ex : Immobilière Al Bina SARL", true)}
                {field("responsable", "Nom du dirigeant *", "Prénom Nom")}
                {field("matricule_fiscal", "Matricule fiscal *", "Ex : 1234567A/P/M/000")}
                {field("registre_commerce", "Numéro registre de commerce *", "Ex : B12345672024")}
                {field("adresse", "Adresse du siège social *", "Rue, Cité...", true)}
                <div style={S.formGroup}>
                  <label style={S.label}>Gouvernorat *</label>
                  <select style={selectStyle("gouvernorat")} value={legalData.gouvernorat || ""} onChange={e => { updateLegal("gouvernorat", e.target.value); updateLegal("delegation", ""); }}>
                    <option value="">Sélectionner...</option>
                    {Object.keys(DELEGATIONS).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errMsg("gouvernorat")}
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Délégation *</label>
                  <select style={{ ...selectStyle("delegation"), background: !legalData.gouvernorat ? "#f1f5f9" : "#fff", color: !legalData.gouvernorat ? "#94a3b8" : "#1e293b" }}
                    value={legalData.delegation || ""} disabled={!legalData.gouvernorat} onChange={e => updateLegal("delegation", e.target.value)}>
                    <option value="">{legalData.gouvernorat ? "Sélectionner..." : "— Choisir d'abord un gouvernorat —"}</option>
                    {delegations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errMsg("delegation")}
                </div>
                {field("telephone", "Téléphone *", "Ex : +216 71 XXX XXX")}
                {field("email", "Email professionnel *", "contact@promoteur.tn")}
                {field("site_web", "Site web (optionnel)", "https://...")}
              </div>
            </>
          )}

          {/* Step 1 — Documents */}
          {step === 1 && (
            <>
              <div style={S.cardTitle}>Documents justificatifs</div>
              <div style={S.cardSub}>Importez les documents officiels requis pour la vérification de votre entreprise. Formats acceptés : PDF, JPG, PNG.</div>
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                {DOCS_CONFIG.map(cfg => <UploadField key={cfg.key} config={cfg} value={docs[cfg.key] || null} onChange={updateDoc} onPreview={setPreviewFile} />)}
              </div>
              {showErrors && docsCount < 3 && (
                <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:8, padding:"12px 16px", background:"#fef2f2", borderRadius:10, border:"1.5px solid #fecaca" }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span style={{ fontSize:13, color:"#dc2626", fontWeight:600 }}>Au moins 3 documents sont requis ({docsCount}/4 fournis).</span>
                </div>
              )}
              <div style={{ marginTop:20, padding:"14px 18px", background:"#fef3c7", borderRadius:10, fontSize:12.5, color:"#92400e", display:"flex", gap:8 }}>
                <AlertCircle size={16} style={{ flexShrink:0, marginTop:1 }} />
                <span>Tous les documents doivent être lisibles et en cours de validité.</span>
              </div>
            </>
          )}

          {/* Step 2 — Convention */}
          {step === 2 && (
            <>
              <div style={S.cardTitle}>Convention de partenariat</div>
              <div style={S.cardSub}>Lisez attentivement la convention ci-dessous avant de la signer électroniquement.</div>
              <div ref={scrollRef} style={S.conventionBox} onScroll={e => { const el = e.target; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true); }}>
                {CONVENTION_TEXT.split("\n").map((line, i) => <p key={i} style={{ margin:"2px 0", whiteSpace:"pre-wrap" }}>{line || " "}</p>)}
              </div>
              {!scrolled && <div style={{ fontSize:12, color:"#94a3b8", textAlign:"center", marginTop:8 }}>Faites défiler jusqu'en bas pour débloquer la signature.</div>}
              <div style={{ ...S.checkRow, opacity: scrolled ? 1 : .45, pointerEvents: scrolled ? "auto" : "none" }}>
                <input type="checkbox" id="accept-conv-prom" checked={conventionAccepted} onChange={e => handleAcceptConvention(e.target.checked)} style={{ width:18, height:18, marginTop:2, cursor:"pointer", flexShrink:0 }} />
                <label htmlFor="accept-conv-prom" style={{ fontSize:13.5, lineHeight:1.5, cursor:"pointer" }}>
                  J'ai lu, compris et j'accepte l'intégralité de la convention de partenariat LOCALIZI.TN. Cette acceptation électronique a valeur contractuelle.
                </label>
              </div>
              {conventionAccepted && signedAt && (
                <div style={{ marginTop:12, fontSize:12, color:"#22c55e", fontWeight:600 }}>✓ Signé électroniquement le {new Date(signedAt).toLocaleString("fr-TN")}</div>
              )}
            </>
          )}

          {/* Step 3 — Abonnement */}
          {step === 3 && (
            <>
              <div style={S.cardTitle}>Choisissez votre abonnement</div>
              <div style={S.cardSub}>Sélectionnez le plan le mieux adapté à votre activité de promotion immobilière.</div>
              <div style={S.plansGrid}>
                {PLANS.map(p => {
                  const isSel = selectedPlan === p.id;
                  return (
                    <div key={p.id} style={{ ...S.planCard(isSel, p.color), padding:"20px 16px" }} onClick={() => setSelectedPlan(p.id)}>
                      {p.badge && <div style={S.planBadge(p.color)}>{p.badge}</div>}
                      <div style={{ ...S.planName, fontSize:14 }}>{p.name}</div>
                      {p.price === 0
                        ? <div style={{ ...S.planPrice(p.color), fontSize:22 }}>Gratuit</div>
                        : <><div style={{ ...S.planPrice(p.color), fontSize:22 }}>{p.price} <span style={{ fontSize:12 }}>TND</span></div>
                           <div style={S.planPriceUnit}>{p.period} (HT)</div></>
                      }
                      <div style={{ height:1, background:"#f1f5f9", margin:"12px 0" }} />
                      {p.features.map(f => (
                        <div key={f.label} style={{ ...S.planFeature, marginBottom:6 }}>
                          {f.ok
                            ? <CheckCircle size={12} color={p.color} style={{ flexShrink:0 }} />
                            : <span style={{ width:12, height:12, borderRadius:"50%", background:"#e2e8f0", display:"inline-flex", flexShrink:0 }} />
                          }
                          <span style={{ color:f.ok?"#1e293b":"#94a3b8", fontSize:11.5 }}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {selectedPlan && plan && (
                <div style={{ marginTop:24, padding:"18px 22px", background:"#f8fafc", borderRadius:14, border:"1.5px solid #e2e8f0" }}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Récapitulatif</div>
                  {plan.price === 0 ? (
                    <div style={{ fontSize:13, color:"#64748b" }}>Plan <strong>{plan.name}</strong> — aucun paiement requis.</div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span>{plan.name}</span><span>{plan.price} TND/mois</span></div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#64748b" }}><span>TVA (19%)</span><span>{Math.round(plan.price * 0.19)} TND</span></div>
                      <div style={{ height:1, background:"#e2e8f0" }} />
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700 }}><span>Total TTC</span><span style={{ color:plan.color }}>{Math.round(plan.price * 1.19)} TND/mois</span></div>
                      <div style={{ marginTop:8, padding:"12px 14px", background:"#fff7ed", borderRadius:10, fontSize:12.5, color:"#9a3412", display:"flex", gap:8, alignItems:"flex-start" }}>
                        <CreditCard size={14} style={{ flexShrink:0, marginTop:1 }} />
                        <span>Le paiement sera activé une fois votre dossier vérifié. Vous recevrez un lien de paiement sécurisé par email.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 4 — Confirmation */}
          {step === 4 && (
            <>
              <div style={S.cardTitle}>Dossier soumis avec succès !</div>
              <div style={S.cardSub}>Votre demande d'adhésion a été enregistrée. Voici le suivi de votre dossier.</div>
              <div style={S.statusCard("#22c55e","#f0fdf4")}><CheckCircle size={22} color="#22c55e" style={{ flexShrink:0,marginTop:2 }} /><div><div style={{ fontWeight:700,fontSize:14,color:"#15803d" }}>Dossier reçu</div><div style={{ fontSize:12.5,color:"#166534",marginTop:2 }}>Votre dossier a bien été soumis le {new Date().toLocaleDateString("fr-TN")}.</div></div></div>
              <div style={S.statusCard("#f59e0b","#fffbeb")}><Clock size={22} color="#f59e0b" style={{ flexShrink:0,marginTop:2 }} /><div><div style={{ fontWeight:700,fontSize:14,color:"#92400e" }}>Vérification en cours</div><div style={{ fontSize:12.5,color:"#78350f",marginTop:2 }}>Notre équipe vérifie vos documents. Délai estimé : 24 à 48h ouvrées.</div></div></div>
              <div style={{ ...S.statusCard("#94a3b8","#f8fafc"), opacity:.6 }}><CreditCard size={22} color="#94a3b8" style={{ flexShrink:0,marginTop:2 }} /><div><div style={{ fontWeight:700,fontSize:14,color:"#475569" }}>Activation du compte</div><div style={{ fontSize:12.5,color:"#64748b",marginTop:2 }}>Vous recevrez un lien de paiement pour activer votre abonnement {plan?.name}.</div></div></div>
              <div style={{ ...S.statusCard("#94a3b8","#f8fafc"), opacity:.6 }}><Shield size={22} color="#94a3b8" style={{ flexShrink:0,marginTop:2 }} /><div><div style={{ fontWeight:700,fontSize:14,color:"#475569" }}>Compte actif</div><div style={{ fontSize:12.5,color:"#64748b",marginTop:2 }}>Votre espace promoteur sera pleinement opérationnel après paiement.</div></div></div>
              <div style={{ marginTop:28, background:"#f8fafc", borderRadius:14, border:"1.5px solid #e2e8f0", padding:"20px 24px" }}>
                <div style={{ fontSize:13,fontWeight:700,marginBottom:14 }}>Récapitulatif</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 24px",fontSize:13 }}>
                  <div><span style={{ color:"#64748b" }}>Entreprise : </span><strong>{legalData.nom_entreprise || "—"}</strong></div>
                  <div><span style={{ color:"#64748b" }}>Dirigeant : </span><strong>{legalData.responsable || "—"}</strong></div>
                  <div><span style={{ color:"#64748b" }}>Email : </span><strong>{legalData.email || "—"}</strong></div>
                  <div><span style={{ color:"#64748b" }}>Plan : </span><strong style={{ color:plan?.color }}>{plan?.name}</strong></div>
                  <div><span style={{ color:"#64748b" }}>Documents : </span><strong>{docsCount}/{DOCS_CONFIG.length} fournis</strong></div>
                  <div><span style={{ color:"#64748b" }}>Convention : </span><strong style={{ color:"#22c55e" }}>Signée électroniquement</strong></div>
                </div>
              </div>
              <div style={{ marginTop:20, padding:"14px 18px", background:"#eff6ff", borderRadius:10, fontSize:13, color:"#1d4ed8", fontWeight:500 }}>
                📧 Un email de confirmation a été envoyé à <strong>{legalData.email}</strong> avec votre numéro de dossier.
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display:"flex", justifyContent: step === 0 ? "flex-end" : "space-between", gap:12 }}>
          {step > 0 && step < 4 && (
            <button style={S.btnSecondary} onClick={() => { const prev=step-1; setStep(prev); savePromoteurProgress(prev, onProgressChange, { legalData, conventionAccepted, signedAt, selectedPlan }); }}>
              <ChevronLeft size={16} /> Précédent
            </button>
          )}
          {step < 4 && (
            <button style={S.btnPrimary} onClick={handleNext}>
              {step === 3 ? "Soumettre le dossier" : "Suivant"} <ChevronRight size={16} />
            </button>
          )}
          {step === 4 && (
            <button style={S.btnPrimary} onClick={() => window.location.href = "/compte?tab=annonces"}>
              Accéder à mon compte <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );

  if (embedded) return wizardInner;

  return (
    <div style={S.root}>
      <Navbar />
      <div style={{ position:"relative", height:260, overflow:"hidden", background:"#1e293b" }}>
        <img src="/images/localizi_ia3.jpeg" alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%", opacity:.55 }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", padding:"0 40px", background:"linear-gradient(90deg,rgba(15,23,42,.7) 0%,rgba(15,23,42,.15) 100%)" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:8 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(245,158,11,.85)", border:"3px solid rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <HardHat size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ color:"#fff", fontSize:22, fontWeight:800, margin:0, lineHeight:1.2 }}>Convention Promoteur</h1>
                <p style={{ color:"rgba(255,255,255,.6)", fontSize:13, margin:"4px 0 0" }}>Complétez votre dossier d'adhésion pour activer votre espace promoteur immobilier</p>
              </div>
            </div>
            <span style={{ display:"inline-block", background:"rgba(245,158,11,.8)", color:"#fff", fontSize:11.5, fontWeight:700, padding:"3px 14px", borderRadius:999, backdropFilter:"blur(4px)", marginTop:4 }}>
              Promoteur immobilier
            </span>
          </div>
        </div>
      </div>
      {wizardInner}
      <Footer />
    </div>
  );
}
