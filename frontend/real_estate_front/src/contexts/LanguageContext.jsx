import React, { createContext, useContext, useState, useCallback } from "react";

/* ─── Translation dictionary ─── */
const T = {
  fr: {
    /* Navbar */
    nav_buy:       "Achat",
    nav_rent:      "Location",
    nav_vacation:  "Vacances",
    nav_contact:   "Contact",
    nav_publish:   "Publier annonce",
    nav_boost:     "Booster",
    nav_map:       "Carte",
    nav_profile:   "Mon profil",
    nav_listings:  "Mes annonces",
    nav_favorites: "Mes favoris",
    nav_admin:     "Administration",
    nav_logout:    "Se déconnecter",
    nav_login:     "Se connecter",
    nav_register:  "Créer un compte",
    nav_search_ph: "Ville, gouvernorat, quartier…",
    nav_about:   "Qui sommes-nous ?",
    nav_agents:  "Trouver un agent",
    nav_sell:    "Vente",

    /* Home hero */
    hero_title:    "Trouvez votre bien idéal en Tunisie",
    hero_sub:      "Des milliers d'annonces de vente, location et vacances partout en Tunisie.",
    hero_search_ph:"Ville, région, quartier…",
    hero_btn:      "Rechercher",

    /* CartePage */
    cp_schools:    "Écoles",
    cp_mosques:    "Mosquées",
    cp_results:    "annonce(s) trouvée(s)",
    cp_no_results: "Aucun résultat",
    cp_broaden:    "Essayez d'élargir vos filtres",
    cp_clear:      "Effacer les filtres",
    cp_list_view:  "Vue liste",
    cp_map_view:   "Vue carte",
    cp_search_btn: "Rechercher",
    cp_filters:    "Filtres",

    /* AnnonceDetail */
    ad_back:        "Retour",
    ad_edit:        "Modifier",
    ad_save:        "Sauvegarder",
    ad_saved:       "Sauvegardé",
    ad_share:       "Partager",
    ad_description: "Description",
    ad_features:    "Caractéristiques",
    ad_translate:   "Traduire en anglais",
    ad_original:    "Voir l'original",
    ad_nearby:      "Annonces similaires à proximité",
    ad_contact_phone: "Afficher le numéro",
    ad_contact_mail:  "Envoyer un message",
    ad_bedrooms:    "Chambres",
    ad_bathrooms:   "Sdb",
    ad_sqm:         "m²",

    /* Contact */
    ct_title:       "Contactez-nous",
    ct_send:        "Envoyer le message",

    /* Common */
    loading:       "Chargement…",
    save:          "Enregistrer",
    cancel:        "Annuler",
    close:         "Fermer",
  },
  en: {
    /* Navbar */
    nav_buy:       "Buy",
    nav_rent:      "Rent",
    nav_vacation:  "Vacation",
    nav_sell:      "Sale",
    nav_contact:   "Contact",
    nav_publish:   "+ Post",
    nav_boost:     "Boost",
    nav_map:       "Map",
    nav_profile:   "My profile",
    nav_listings:  "My listings",
    nav_favorites: "My favorites",
    nav_admin:     "Administration",
    nav_logout:    "Sign out",
    nav_login:     "Sign in",
    nav_register:  "Create account",
    nav_search_ph: "City, region, neighbourhood…",

    /* Home hero */
    hero_title:    "Find your ideal property in Tunisia",
    hero_sub:      "Thousands of listings for sale, rent and vacation across Tunisia.",
    hero_search_ph:"City, region, neighbourhood…",
    hero_btn:      "Search",

    /* CartePage */
    cp_schools:    "Schools",
    cp_mosques:    "Mosques",
    cp_results:    "listing(s) found",
    cp_no_results: "No results",
    cp_broaden:    "Try widening your filters",
    cp_clear:      "Clear filters",
    cp_list_view:  "List view",
    cp_map_view:   "Map view",
    cp_search_btn: "Search",
    cp_filters:    "Filters",

    /* AnnonceDetail */
    ad_back:        "Back",
    ad_edit:        "Edit",
    ad_save:        "Save",
    ad_saved:       "Saved",
    ad_share:       "Share",
    ad_description: "Description",
    ad_features:    "Features",
    ad_translate:   "Translate to French",
    ad_original:    "Show original",
    ad_nearby:      "Similar listings nearby",
    ad_contact_phone: "Show number",
    ad_contact_mail:  "Send a message",
    ad_bedrooms:    "Bedrooms",
    ad_bathrooms:   "Baths",
    ad_sqm:         "sqft",

    /* Contact */
    ct_title:       "Contact us",
    ct_send:        "Send message",

    /* Common */
    loading:       "Loading…",
    save:          "Save",
    cancel:        "Cancel",
    close:         "Close",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("localizi_lang") || "fr"
  );

  const toggleLang = useCallback(() => {
    setLang(l => {
      const next = l === "fr" ? "en" : "fr";
      localStorage.setItem("localizi_lang", next);
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    return T[lang]?.[key] ?? T.fr[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: "fr", toggleLang: () => {}, t: (k) => T.fr[k] ?? k };
  return ctx;
}
