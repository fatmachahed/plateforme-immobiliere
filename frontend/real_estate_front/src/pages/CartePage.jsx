import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import API_URL, { fmtDevise, convertPrice, fmtPriceApprox } from '../config';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import {
  getCompareIds, useIsInCompare, useCompareMeta, useCompareCount,
  toggleCompare as toggleCompareStore, removeFromCompare as removeFromCompareStore,
  clearCompare as clearCompareStore,
} from "../utils/compareStore";
import {
  Search, ChevronLeft, ChevronRight, Bed, Bath, Maximize,
  MapPin, Heart, X, SlidersHorizontal, Star, School, Moon,
  ChevronDown, Loader2, LayoutList, Map as MapIcon, Save,
  Waves, Mountain, TreePine, Fence, Sun, Flower2, Droplets, ParkingCircle,
  ArrowUpDown, Car, Package, Sofa, Users, ShieldCheck,
  UtensilsCrossed, Wind, Thermometer, Flame, DoorClosed, LockKeyhole,
  Fingerprint, Wifi, Monitor, RefreshCw, KeyRound, PhoneCall, Check, PenLine,
  Layers, GitCompare, ChevronUp
} from "lucide-react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import useLocalisation from "../hooks/useLocalisation";
import { getDelegations } from "../api/localisation.api";
import AnnonceDetailModal from "./AnnonceDetailModal";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

/* -------------------------------------------------------------
   POINT-IN-POLYGON – ray casting algorithm
------------------------------------------------------------- */
function pointInPolygon(point, polygon) {
  const { lat: y, lng: x } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/* -------------------------------------------------------------
   POI ICON HELPER – circular divIcon markers
------------------------------------------------------------- */
const makePOIIcon = (L, color, svgPath) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px; height:28px; border-radius:50%;
    background:${color}; border:2px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.3);
    display:flex; align-items:center; justify-content:center;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      ${svgPath}
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/* SVG paths – partag�s entre les marqueurs de carte ET les boutons filtres */
/* Écoles : livre ouvert */
const SCHOOL_SVG   = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
const MOSQUE_SVG   = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
/* Faculté : chapeau acad�mique (mortier) */
const FACULTY_SVG  = '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>';
/* Grande surface : chariot de supermarch� (ancien, restaur�) */
const SURFACE_SVG  = '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>';

/* Petit SVG React pour les boutons (même chemin que les marqueurs de carte) */
const PoiSvg = ({ path, size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: path }}
  />
);

/* POIs � Écoles & Mosquées (d�mo) */
const SCHOOLS = [
  { id:"sc1", nom:"Lycée Pilote de Tunis",        lat:36.821, lng:10.159, gov:"Tunis"      },
  { id:"sc2", nom:"Collège Ibn Khaldoun",          lat:36.833, lng:10.171, gov:"Tunis"      },
  { id:"sc3", nom:"École El Menzah VI",            lat:36.846, lng:10.206, gov:"Tunis"      },
  { id:"sc4", nom:"Lycée Technique Ariana",        lat:36.866, lng:10.197, gov:"Ariana"     },
  { id:"sc5", nom:"Collège La Soukra",             lat:36.882, lng:10.213, gov:"Ariana"     },
  { id:"sc6", nom:"Lycée Habib Bourguiba Sousse",  lat:35.830, lng:10.638, gov:"Sousse"     },
  { id:"sc7", nom:"École Primaire Port Kantaoui",  lat:35.892, lng:10.612, gov:"Sousse"     },
  { id:"sc8", nom:"Lycée Farhat Hached Sfax",      lat:34.744, lng:10.762, gov:"Sfax"       },
  { id:"sc9", nom:"Collège Ibn Sina Sfax",         lat:34.737, lng:10.756, gov:"Sfax"       },
  { id:"sc10",nom:"École Tahar Haddad Hammamet",   lat:36.403, lng:10.617, gov:"Nabeul"     },
  { id:"sc11",nom:"Lycée Pilote Nabeul",           lat:36.458, lng:10.732, gov:"Nabeul"     },
  { id:"sc12",nom:"École Erriadh Monastir",        lat:35.785, lng:10.815, gov:"Monastir"   },
  { id:"sc13",nom:"Collège Djerba Midoun",         lat:33.825, lng:10.885, gov:"Médenine"   },
  { id:"sc14",nom:"Lycée Teboulba Ben Arous",      lat:36.720, lng:10.240, gov:"Ben Arous"  },
  { id:"sc15",nom:"Lycée de Bizerte",              lat:37.274, lng:9.872,  gov:"Bizerte"    },
  { id:"sc16",nom:"Collège Zarzouna Bizerte",      lat:37.263, lng:9.887,  gov:"Bizerte"    },
  { id:"sc17",nom:"Lycée Pilote Béja",             lat:36.727, lng:9.183,  gov:"Béja"       },
  { id:"sc18",nom:"Collège Ibn Rachiq Béja",       lat:36.733, lng:9.190,  gov:"Béja"       },
  { id:"sc19",nom:"Lycée Jendouba",                lat:36.502, lng:8.779,  gov:"Jendouba"   },
  { id:"sc20",nom:"Collège Garçons Jendouba",      lat:36.508, lng:8.785,  gov:"Jendouba"   },
  { id:"sc21",nom:"Lycée Siliana",                 lat:36.088, lng:9.372,  gov:"Siliana"    },
  { id:"sc22",nom:"Lycée Zaghouan",                lat:36.408, lng:10.143, gov:"Zaghouan"   },
  { id:"sc23",nom:"Lycée Kairouan",                lat:35.678, lng:10.100, gov:"Kairouan"   },
  { id:"sc24",nom:"Lycée Mahdia",                  lat:35.502, lng:11.066, gov:"Mahdia"     },
  { id:"sc25",nom:"Collège Ouled Chamekh Mahdia",  lat:35.488, lng:11.044, gov:"Mahdia"     },
  { id:"sc26",nom:"Lycée de Gabès",                lat:33.881, lng:10.098, gov:"Gabès"      },
  { id:"sc27",nom:"Collège Gabès Centre",          lat:33.887, lng:10.104, gov:"Gabès"      },
  { id:"sc28",nom:"Lycée Kébili",                  lat:33.705, lng:8.965,  gov:"Kébili"     },
  { id:"sc29",nom:"Lycée Gafsa",                   lat:34.422, lng:8.780,  gov:"Gafsa"      },
  { id:"sc30",nom:"Collège Redeyef Gafsa",         lat:34.373, lng:8.195,  gov:"Gafsa"      },
  { id:"sc31",nom:"Lycée Kasserine",               lat:35.167, lng:8.834,  gov:"Kasserine"  },
  { id:"sc32",nom:"Lycée Sidi Bouzid",             lat:35.039, lng:9.484,  gov:"Sidi Bouzid"},
  { id:"sc33",nom:"Lycée Tataouine",               lat:32.929, lng:10.450, gov:"Tataouine"  },
  { id:"sc34",nom:"Lycée Tozeur",                  lat:33.924, lng:8.130,  gov:"Tozeur"     },
  { id:"sc35",nom:"Lycée Manouba",                 lat:36.810, lng:10.099, gov:"Manouba"    },
];

const MOSQUES = [
  { id:"mo1", nom:"Mosquée Zitouna",               lat:36.798, lng:10.174, gov:"Tunis"      },
  { id:"mo2", nom:"Mosquée El Fath Lac",           lat:36.840, lng:10.234, gov:"Tunis"      },
  { id:"mo3", nom:"Mosquée Ennasr",                lat:36.858, lng:10.193, gov:"Ariana"     },
  { id:"mo4", nom:"Mosquée Raoued",                lat:36.890, lng:10.177, gov:"Ariana"     },
  { id:"mo5", nom:"Mosquée Boujemaa Sousse",       lat:35.826, lng:10.636, gov:"Sousse"     },
  { id:"mo6", nom:"Mosquée Sidi Bouali Sousse",    lat:35.818, lng:10.644, gov:"Sousse"     },
  { id:"mo7", nom:"Mosquée Trois Portes Sfax",     lat:34.739, lng:10.759, gov:"Sfax"       },
  { id:"mo8", nom:"Mosquée Sidi Lakhmi Sfax",      lat:34.746, lng:10.767, gov:"Sfax"       },
  { id:"mo9", nom:"Mosquée El Kebir Hammamet",     lat:36.397, lng:10.621, gov:"Nabeul"     },
  { id:"mo10",nom:"Mosquée Nabeul Ville",          lat:36.452, lng:10.739, gov:"Nabeul"     },
  { id:"mo11",nom:"Mosquée Monastir Médina",       lat:35.776, lng:10.827, gov:"Monastir"   },
  { id:"mo12",nom:"Mosquée Erriadh Djerba",        lat:33.833, lng:10.862, gov:"Médenine"   },
  { id:"mo13",nom:"Mosquée Ben Arous",             lat:36.753, lng:10.229, gov:"Ben Arous"  },
  { id:"mo14",nom:"Mosquée Kairouan Okba",         lat:35.681, lng:10.098, gov:"Kairouan"   },
  { id:"mo15",nom:"Grande Mosquée de Bizerte",     lat:37.275, lng:9.869,  gov:"Bizerte"    },
  { id:"mo16",nom:"Mosquée Zarzouna Bizerte",      lat:37.263, lng:9.889,  gov:"Bizerte"    },
  { id:"mo17",nom:"Mosquée Béja Médina",           lat:36.727, lng:9.185,  gov:"Béja"       },
  { id:"mo18",nom:"Mosquée Jendouba Centre",       lat:36.503, lng:8.780,  gov:"Jendouba"   },
  { id:"mo19",nom:"Mosquée Bou Salem Jendouba",    lat:36.621, lng:8.968,  gov:"Jendouba"   },
  { id:"mo20",nom:"Mosquée Siliana Centre",        lat:36.088, lng:9.369,  gov:"Siliana"    },
  { id:"mo21",nom:"Mosquée Zaghouan",              lat:36.408, lng:10.143, gov:"Zaghouan"   },
  { id:"mo22",nom:"Mosquée Mahdia Médina",         lat:35.503, lng:11.068, gov:"Mahdia"     },
  { id:"mo23",nom:"Mosquée Gabès Centre",          lat:33.883, lng:10.100, gov:"Gabès"      },
  { id:"mo24",nom:"Mosquée Sidi Bouzid",           lat:35.039, lng:9.484,  gov:"Sidi Bouzid"},
  { id:"mo25",nom:"Mosquée Kasserine",             lat:35.167, lng:8.835,  gov:"Kasserine"  },
  { id:"mo26",nom:"Mosquée Gafsa Médina",          lat:34.425, lng:8.781,  gov:"Gafsa"      },
  { id:"mo27",nom:"Mosquée Kébili",                lat:33.706, lng:8.966,  gov:"Kébili"     },
  { id:"mo28",nom:"Mosquée Tataouine",             lat:32.930, lng:10.451, gov:"Tataouine"  },
  { id:"mo29",nom:"Mosquée Tozeur Médina",         lat:33.922, lng:8.131,  gov:"Tozeur"     },
  { id:"mo30",nom:"Mosquée Manouba",               lat:36.811, lng:10.098, gov:"Manouba"    },
];

/* POIs statiques – Facultés & Grandes surfaces (fallback si Overpass indisponible) */
const FACULTIES = [
  { id:"fac1", nom:"Université Tunis El Manar",        lat:36.838, lng:10.168, gov:"Tunis"      },
  { id:"fac2", nom:"Faculté des Sciences de Tunis",    lat:36.835, lng:10.172, gov:"Tunis"      },
  { id:"fac3", nom:"INSAT Tunis",                      lat:36.855, lng:10.197, gov:"Tunis"      },
  { id:"fac4", nom:"Université Carthage",              lat:36.870, lng:10.184, gov:"Tunis"      },
  { id:"fac5", nom:"ISSAT Sousse",                     lat:35.822, lng:10.631, gov:"Sousse"     },
  { id:"fac6", nom:"Faculté de Médecine Sousse",       lat:35.840, lng:10.647, gov:"Sousse"     },
  { id:"fac7", nom:"Université de Sfax",               lat:34.749, lng:10.758, gov:"Sfax"       },
  { id:"fac8", nom:"FSEG Sfax",                        lat:34.740, lng:10.752, gov:"Sfax"       },
  { id:"fac9", nom:"IPEIM Monastir",                   lat:35.778, lng:10.826, gov:"Monastir"   },
  { id:"fac10",nom:"Université Manouba",               lat:36.828, lng:10.093, gov:"Manouba"    },
  { id:"fac11",nom:"ISG Tunis",                        lat:36.812, lng:10.147, gov:"Tunis"      },
  { id:"fac12",nom:"Faculté Droit Sciences Politiques",lat:36.795, lng:10.181, gov:"Tunis"      },
  { id:"fac13",nom:"ISSAT Bizerte",                    lat:37.279, lng:9.871,  gov:"Bizerte"    },
  { id:"fac14",nom:"ISBA Bizerte",                     lat:37.268, lng:9.876,  gov:"Bizerte"    },
  { id:"fac15",nom:"Institut Supérieur Béja",          lat:36.730, lng:9.186,  gov:"Béja"       },
  { id:"fac16",nom:"Faculté Sciences Jendouba",        lat:36.505, lng:8.782,  gov:"Jendouba"   },
  { id:"fac17",nom:"Institut Sup. Siliana",            lat:36.090, lng:9.374,  gov:"Siliana"    },
  { id:"fac18",nom:"Institut Sup. Zaghouan",           lat:36.410, lng:10.145, gov:"Zaghouan"   },
  { id:"fac19",nom:"Université de Kairouan",           lat:35.675, lng:10.096, gov:"Kairouan"   },
  { id:"fac20",nom:"Faculté Sciences Mahdia",          lat:35.497, lng:11.062, gov:"Mahdia"     },
  { id:"fac21",nom:"Université de Gabès",              lat:33.879, lng:10.097, gov:"Gabès"      },
  { id:"fac22",nom:"Institut Sup. Gafsa",              lat:34.423, lng:8.782,  gov:"Gafsa"      },
  { id:"fac23",nom:"Institut Sup. Kasserine",          lat:35.170, lng:8.836,  gov:"Kasserine"  },
  { id:"fac24",nom:"Institut Sup. Sidi Bouzid",        lat:35.041, lng:9.486,  gov:"Sidi Bouzid"},
  { id:"fac25",nom:"Institut Sup. Kébili",             lat:33.707, lng:8.967,  gov:"Kébili"     },
  { id:"fac26",nom:"Institut Sup. Tataouine",          lat:32.931, lng:10.452, gov:"Tataouine"  },
  { id:"fac27",nom:"Institut Sup. Tozeur",             lat:33.925, lng:8.132,  gov:"Tozeur"     },
  { id:"fac28",nom:"ISLAIB Nabeul",                    lat:36.460, lng:10.735, gov:"Nabeul"     },
  { id:"fac29",nom:"Faculté Sciences Médenine",        lat:33.360, lng:10.505, gov:"Médenine"   },
];

const HOSPITALS = [
  { id:"ho1",  nom:"Hôpital Charles Nicolle",          lat:36.820, lng:10.172, gov:"Tunis"      },
  { id:"ho2",  nom:"Hôpital La Rabta",                 lat:36.831, lng:10.167, gov:"Tunis"      },
  { id:"ho3",  nom:"Hôpital Mongi Slim La Marsa",      lat:36.876, lng:10.321, gov:"Tunis"      },
  { id:"ho4",  nom:"Clinique Les Oliviers Ariana",     lat:36.854, lng:10.195, gov:"Ariana"     },
  { id:"ho5",  nom:"Hôpital Régional Ariana",          lat:36.868, lng:10.190, gov:"Ariana"     },
  { id:"ho6",  nom:"Hôpital Farhat Hached Sousse",     lat:35.828, lng:10.635, gov:"Sousse"     },
  { id:"ho7",  nom:"Clinique Avicenne Sousse",         lat:35.835, lng:10.644, gov:"Sousse"     },
  { id:"ho8",  nom:"CHU Habib Bourguiba Sfax",         lat:34.746, lng:10.760, gov:"Sfax"       },
  { id:"ho9",  nom:"Polyclinique CNSS Sfax",           lat:34.739, lng:10.754, gov:"Sfax"       },
  { id:"ho10", nom:"Hôpital Régional Hammamet",        lat:36.400, lng:10.619, gov:"Nabeul"     },
  { id:"ho11", nom:"Hôpital Monastir",                 lat:35.780, lng:10.820, gov:"Monastir"   },
  { id:"ho12", nom:"Hôpital Régional Médenine",        lat:33.356, lng:10.502, gov:"Médenine"   },
  { id:"ho13", nom:"Hôpital de la Manouba",            lat:36.830, lng:10.097, gov:"Manouba"    },
  { id:"ho14", nom:"Hôpital Ben Arous",                lat:36.749, lng:10.232, gov:"Ben Arous"  },
  { id:"ho15", nom:"Hôpital Régional Kairouan",        lat:35.676, lng:10.093, gov:"Kairouan"   },
  { id:"ho16", nom:"Hôpital Régional Bizerte",         lat:37.275, lng:9.866,  gov:"Bizerte"    },
  { id:"ho17", nom:"Hôpital Régional Béja",            lat:36.726, lng:9.182,  gov:"Béja"       },
  { id:"ho18", nom:"Hôpital Régional Jendouba",        lat:36.502, lng:8.778,  gov:"Jendouba"   },
  { id:"ho19", nom:"Hôpital Régional Siliana",         lat:36.085, lng:9.370,  gov:"Siliana"    },
  { id:"ho20", nom:"Hôpital Régional Zaghouan",        lat:36.406, lng:10.141, gov:"Zaghouan"   },
  { id:"ho21", nom:"Hôpital Régional Mahdia",          lat:35.500, lng:11.064, gov:"Mahdia"     },
  { id:"ho22", nom:"CHU Habib Bourguiba Gabès",        lat:33.884, lng:10.099, gov:"Gabès"      },
  { id:"ho23", nom:"Hôpital Régional Kébili",          lat:33.704, lng:8.964,  gov:"Kébili"     },
  { id:"ho24", nom:"Hôpital Régional Gafsa",           lat:34.420, lng:8.779,  gov:"Gafsa"      },
  { id:"ho25", nom:"Hôpital Régional Kasserine",       lat:35.165, lng:8.833,  gov:"Kasserine"  },
  { id:"ho26", nom:"Hôpital Régional Sidi Bouzid",     lat:35.037, lng:9.482,  gov:"Sidi Bouzid"},
  { id:"ho27", nom:"Hôpital Régional Tataouine",       lat:32.927, lng:10.449, gov:"Tataouine"  },
  { id:"ho28", nom:"Hôpital Régional Tozeur",          lat:33.921, lng:8.129,  gov:"Tozeur"     },
];

const HOSPITAL_SVG = '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>';

const GRAND_SURFACES = [
  { id:"gs1", nom:"Carrefour Lac Tunis",               lat:36.841, lng:10.237, gov:"Tunis"      },
  { id:"gs2", nom:"Géant Casino Ennasr",               lat:36.859, lng:10.192, gov:"Ariana"     },
  { id:"gs3", nom:"Monoprix Menzah",                   lat:36.848, lng:10.207, gov:"Tunis"      },
  { id:"gs4", nom:"Carrefour Market Ariana",           lat:36.866, lng:10.199, gov:"Ariana"     },
  { id:"gs5", nom:"Azur Sousse",                       lat:35.834, lng:10.641, gov:"Sousse"     },
  { id:"gs6", nom:"Carrefour Market Sfax",             lat:34.741, lng:10.763, gov:"Sfax"       },
  { id:"gs7", nom:"Géant Hammamet",                    lat:36.405, lng:10.624, gov:"Nabeul"     },
  { id:"gs8", nom:"Monoprix Centre-ville Tunis",       lat:36.803, lng:10.180, gov:"Tunis"      },
  { id:"gs9", nom:"Carrefour Ben Arous",               lat:36.741, lng:10.226, gov:"Ben Arous"  },
  { id:"gs10",nom:"MG Monastir",                       lat:35.781, lng:10.831, gov:"Monastir"   },
  { id:"gs11",nom:"Magasin Général Bizerte",           lat:37.272, lng:9.873,  gov:"Bizerte"    },
  { id:"gs12",nom:"Monoprix Bizerte",                  lat:37.270, lng:9.869,  gov:"Bizerte"    },
  { id:"gs13",nom:"MG Béja",                           lat:36.729, lng:9.187,  gov:"Béja"       },
  { id:"gs14",nom:"Magasin Général Jendouba",          lat:36.504, lng:8.781,  gov:"Jendouba"   },
  { id:"gs15",nom:"Magasin Général Siliana",           lat:36.087, lng:9.371,  gov:"Siliana"    },
  { id:"gs16",nom:"Magasin Général Zaghouan",          lat:36.409, lng:10.142, gov:"Zaghouan"   },
  { id:"gs17",nom:"MG Kairouan",                       lat:35.679, lng:10.100, gov:"Kairouan"   },
  { id:"gs18",nom:"Magasin Général Mahdia",            lat:35.501, lng:11.065, gov:"Mahdia"     },
  { id:"gs19",nom:"MG Gabès",                          lat:33.882, lng:10.101, gov:"Gabès"      },
  { id:"gs20",nom:"Magasin Général Gafsa",             lat:34.424, lng:8.782,  gov:"Gafsa"      },
  { id:"gs21",nom:"Magasin Général Kasserine",         lat:35.168, lng:8.835,  gov:"Kasserine"  },
  { id:"gs22",nom:"Magasin Général Sidi Bouzid",       lat:35.040, lng:9.485,  gov:"Sidi Bouzid"},
  { id:"gs23",nom:"Magasin Général Médenine",          lat:33.358, lng:10.504, gov:"Médenine"   },
  { id:"gs24",nom:"Magasin Général Kébili",            lat:33.706, lng:8.966,  gov:"Kébili"     },
  { id:"gs25",nom:"Magasin Général Tataouine",         lat:32.929, lng:10.451, gov:"Tataouine"  },
  { id:"gs26",nom:"Magasin Général Tozeur",            lat:33.923, lng:8.131,  gov:"Tozeur"     },
  { id:"gs27",nom:"MG Manouba",                        lat:36.812, lng:10.100, gov:"Manouba"    },
];

const TYPES    = ["appartement","villa_maison","immeuble","terrain","local_commercial","bureau","ferme_agricole","garage_parking","depot_stockage","batiment_industriel","immobiliers_divers"];
const TYPE_LBL = {
  appartement:       "Appartement",
  villa_maison:      "Villa/Maison",
  immeuble:          "Immeuble",
  terrain:           "Terrain",
  local_commercial:  "Local commercial",
  bureau:            "Bureau",
  ferme_agricole:    "Ferme agricole",
  garage_parking:    "Garage / Parking",
  depot_stockage:    "Dépôt de stockage",
  batiment_industriel:"Bâtiment industriel",
  immobiliers_divers:"Immobiliers divers",
};
const ETATS    = ["nouveau","bon_etat","a_renover","cours_construction"];
const ETAT_LBL = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"à rénover", cours_construction:"En construction" };
const CAT_LBL    = { vente:"Achat", location:"Location", vacances:"Vacances" };
const CAT_COLORS = { vente:"#166534", location:"#1e40af", vacances:"#d97706" }; // vert / bleu / ambre

function fmtPin(p)  { return p >= 1e6 ? `${(p/1e6).toFixed(1)}M` : p >= 1000 ? `${Math.round(p/1000)}k` : `${p}`; }
function fmtFull(p) { const n = Number(p); return (!p || isNaN(n)) ? "Prix sur demande" : n.toLocaleString("fr-TN"); }
function ucFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g," ") : ""; }

/* --- Carrousel --- */
function Carousel({ images, h = 190 }) {
  const [idx, setIdx]       = useState(0);
  const [prev2, setPrev2]   = useState(null); // index de l'image sortante
  const [dir, setDir]       = useState(1);    // 1 = gauche→droite, -1 = droite→gauche
  const [animating, setAnim]= useState(false);

  const go = (e, delta) => {
    e.stopPropagation();
    if (animating || images.length < 2) return;
    const next = (idx + delta + images.length) % images.length;
    setDir(delta);
    setPrev2(idx);
    setIdx(next);
    setAnim(true);
    setTimeout(() => { setPrev2(null); setAnim(false); }, 420);
  };

  const goTo = (e, i) => {
    e.stopPropagation();
    if (animating || i === idx) return;
    const delta = i > idx ? 1 : -1;
    setDir(delta);
    setPrev2(idx);
    setIdx(i);
    setAnim(true);
    setTimeout(() => { setPrev2(null); setAnim(false); }, 420);
  };

  return (
    <div style={{ position:"relative", height:h, background:"#f3f4f6", overflow:"hidden", flexShrink:0, isolation:"isolate" }}>
      {/* Image sortante */}
      {prev2 !== null && (
        <img src={images[prev2]} alt="" style={{
          position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
          animation:`carouselOut${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards`,
          zIndex:1,
        }}/>
      )}
      {/* Image entrante */}
      <img key={idx} src={images[idx]} alt="" style={{
        position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
        animation: prev2 !== null
          ? `carouselIn${dir > 0 ? "L" : "R"} .42s cubic-bezier(.4,0,.2,1) forwards`
          : "none",
        zIndex:2,
      }} loading="lazy"/>
      {/* Filigrane logo */}
      <div style={{
        position:"absolute", inset:0, zIndex:3,
        display:"flex", alignItems:"center", justifyContent:"center",
        pointerEvents:"none",
      }}>
        <span style={{
          fontSize:18, fontWeight:900, letterSpacing:"-0.5px",
          fontFamily:"Arial,sans-serif",
          color:"rgba(255,255,255,0.22)",
          textShadow:"0 1px 3px rgba(0,0,0,0.18)",
          userSelect:"none",
          transform:"rotate(-15deg)",
        }}>
          LOCAL<span style={{color:"rgba(99,102,241,0.30)"}}>IZI</span>.TN
        </span>
      </div>

      {images.length > 1 && <>
        <button onClick={e=>go(e,-1)} style={{...arrowBtn("left"),zIndex:4}}><ChevronLeft size={14}/></button>
        <button onClick={e=>go(e,+1)} style={{...arrowBtn("right"),zIndex:4}}><ChevronRight size={14}/></button>
        <div style={{ position:"absolute", bottom:7, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4, zIndex:3 }}>
          {images.map((_,i) => (
            <span key={i} onClick={(e)=>goTo(e,i)}
              style={{ width:6, height:6, borderRadius:"50%", cursor:"pointer",
                background: i===idx?"#fff":"rgba(255,255,255,.45)", transition:"background .2s" }}
            />
          ))}
        </div>
      </>}
    </div>
  );
}
const arrowBtn = (s) => ({
  position:"absolute", top:"50%", transform:"translateY(-50%)", [s]:8,
  width:27, height:27, borderRadius:"50%", background:"rgba(255,255,255,.45)",
  backdropFilter:"blur(4px)",
  border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 1px 4px rgba(0,0,0,.15)", color:"#fff", zIndex:2,
});

/* -------------------------------------------------------------
   ÉVALUATION DU PRIX � barre de 5 segments colorés
------------------------------------------------------------- */
const EVAL_LEVELS = [
  { key:"none",  label:"Aucune évaluation", segs:0, color:"#d1d5db" },
  { key:"high3", label:"Prix très élevé",   segs:1, color:"#dc2626" },
  { key:"high2", label:"Prix élevé",        segs:2, color:"#f59e0b" },
  { key:"fair",  label:"Prix équitable",    segs:3, color:"#3b82f6" },
  { key:"good",  label:"Bon prix",          segs:4, color:"#16a34a" },
  { key:"great", label:"Très bon prix",     segs:5, color:"#15803d" },
];
const EVAL_TOTAL = 5;

function getEvalLevel(prixM2, govAvg, count) {
  if (!count || !govAvg || !prixM2 || govAvg <= 0) return EVAL_LEVELS[0];
  const r = prixM2 / govAvg;
  if (r >= 1.30) return EVAL_LEVELS[1];
  if (r >= 1.10) return EVAL_LEVELS[2];
  if (r >= 0.90) return EVAL_LEVELS[3];
  if (r >= 0.70) return EVAL_LEVELS[4];
  return EVAL_LEVELS[5];
}

function PriceEvalBar({ prixM2, govStats }) {
  const gs  = govStats || { sum: 0, count: 0 };
  const avg = gs.count > 0 ? gs.sum / gs.count : 0;
  const ev  = getEvalLevel(prixM2, avg, gs.count);
  const isNone = ev.key === "none";
  return (
    <div className="peb">
      <span className="peb__label" style={{ color: isNone ? "#9ca3af" : ev.color }}>
        {ev.label}
      </span>
      <div className="peb__bar">
        {Array.from({ length: EVAL_TOTAL }, (_, i) => (
          <span key={i} className="peb__seg"
            style={{ background: i < ev.segs ? ev.color : "#e2e8f0" }}
          />
        ))}
      </div>
    </div>
  );
}

/* --- Comparateur : logique centralisée dans utils/compareStore.js --- */

/* --- Carte de bien --- */
function PropCard({ p, active, onHover, onClick, govMarketStats, compact }) {
  const prixM2   = (p.prix > 0 && p.area > 0) ? p.prix / p.area : null;
  const govStats = govMarketStats?.[p.gouvernorat] || null;
  const realId   = p._realId || p.id?.toString().replace("api_","");
  const toast    = useToast();

  /* -- Comparateur (état centralisé, partagé avec toutes les interfaces) -- */
  const inCompare = useIsInCompare(realId);
  const toggleCompareClick = (e) => {
    e.stopPropagation();
    const result = toggleCompareStore({
      id: realId, titre: p.titre, prix: p.prix, devise: p.devise,
      image: (p.images||[])[0]||"", gouvernorat: p.gouvernorat, delegation: p.delegation,
      categorie: p.categorie,
    });
    if (result.maxReached) toast("Maximum 4 annonces dans le comparateur.", "error");
    else if (result.added) toast("Ajouté au comparateur", "success");
    else toast("Retiré du comparateur.");
  };

  /* -- Favoris -- */
  const [isFav, setIsFav] = React.useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
      return favs.some(id => String(id) === String(realId));
    } catch { return false; }
  });

  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = `/login?redirect=/carte`;
      return;
    }
    /* Snapshot de l'�tat AVANT l'action */
    const wasOn = isFav;
    const method = wasOn ? "DELETE" : "POST";
    const url    = `${API_URL}/users/me/favoris/${realId}`;

    /* Mise à jour visuelle imm�diate */
    setIsFav(!wasOn);

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        /* Persister en localStorage */
        try {
          const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
          const updated = !wasOn
            ? [...new Set([...favs, realId])]
            : favs.filter(id => String(id) !== String(realId));
          localStorage.setItem("localizi_favs", JSON.stringify(updated));
        } catch {}
      } else {
        /* Rollback propre */
        setIsFav(wasOn);
      }
    } catch {
      setIsFav(wasOn);
    }
  };

  return (
    <div className={`pc${active?" pc--active":""}`}
      onMouseEnter={()=>onHover(p.id)} onMouseLeave={()=>onHover(null)}
      onClick={()=>onClick(p.id)}
      style={{position:"relative"}}
    >
      <div style={{ position:"relative" }}>
        <Carousel images={p.images} h={compact ? 130 : 190} />
        {(p.categorie === "location" || p.categorie === "vacances") && (
          <span className={`pc__cat-badge pc__cat-badge--${p.categorie}`}>
            {p.categorie === "location" ? "Location" : "Vacances"}
          </span>
        )}
        {(() => {
          const isNeuf = p.etat === "nouveau" && p.categorie === "vente";
          const badgeStyle = (top) => ({position:"absolute",top,left:8,zIndex:10,borderRadius:8,padding:"3px 9px",fontSize:10.5,fontWeight:800,display:"flex",alignItems:"center",gap:4,backdropFilter:"blur(4px)"});
          return <>
            {isNeuf && (
              <span style={{...badgeStyle(8),background:"rgba(5,150,105,.93)",color:"#fff",letterSpacing:".04em",textTransform:"uppercase"}}>
                ✦ Neuf
              </span>
            )}
            {p.colocation && (
              <span style={{...badgeStyle(isNeuf ? 36 : 8),background:"rgba(99,102,241,.92)",color:"#fff",fontWeight:700}}>
                <Users size={11}/> Coloc
              </span>
            )}
          </>;
        })()}
      </div>
      <div className="pc__body">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{minWidth:0, flex:1}}>
            {p.prix_ancien && (
              <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 1px",fontWeight:500,lineHeight:1.2,textDecoration:"line-through"}}>
                {fmtFull(p.prix_ancien)} {fmtDevise(p.devise)}
              </p>
            )}
            <p className="pc__price" style={{fontSize: p.prix_ancien ? 17 : undefined}}>
              {fmtFull(p.prix)}
              {p.prix_ancien && (
                <span style={{fontSize:10,fontWeight:700,color:"#ef4444",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,padding:"1px 5px",marginLeft:6,verticalAlign:"middle"}}>
                  ▼ {Math.round((1 - p.prix / p.prix_ancien) * 100)}%
                </span>
              )}
              <span className="pc__devise">
                {fmtDevise(p.devise)}
                {p.categorie === "location" ? " /mois"
                  : p.categorie === "vacances" ? (
                    p.duree_type === "nuit"   ? " /nuitée"
                    : p.duree_type === "semaine" ? " /sem."
                    : p.duree_type === "mois"    ? " /mois"
                    : p.duree_type === "annee"   ? " /an"
                    : ""
                  ) : ""}
              </span>
            </p>
            {p.prix && (() => {
              const approx = fmtPriceApprox(p.prix, p.devise);
              return approx ? <p style={{fontSize:11,color:"#94a3b8",margin:"-4px 0 2px",fontWeight:500,lineHeight:1.3}}>{approx}</p> : null;
            })()}
            <p className="pc__title" style={{
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"
            }}>{p.titre}</p>
          </div>
          <button
            className={`pc__fav${isFav ? " pc__fav--on" : ""}`}
            onClick={toggleFav}
            title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart size={14} fill={isFav ? "#ef4444" : "none"}/>
          </button>
        </div>
        {/* Barre d'évaluation prix � toujours affichée */}
        <PriceEvalBar prixM2={prixM2} govStats={govStats} />
        <p className="pc__loc"><MapPin size={10}/> {p.delegation} · {p.localite}</p>
        <div className="pc__specs">
          {p.pieces != null && <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> {p.pieces} p.</span>}
          {p.beds   != null && <span><Bed      size={11}/> {p.beds} ch.</span>}
          {p.baths  != null && <span><Bath     size={11}/> {p.baths} sdb</span>}
          {p.area           && <span><Maximize size={11}/> {p.area} m²</span>}
          {p.garage         && <span><Car      size={11}/> Garage</span>}
          {p.categorie === "vacances" && <span><Users size={11}/> {p.capacite_accueil ? `${p.capacite_accueil} pers.` : "—"}</span>}
          {p.categorie === "vacances" && p.duree_valeur && p.duree_type && <span><Moon size={11}/> {p.duree_valeur} {p.duree_type === "nuit" ? "nuit(s) min" : p.duree_type === "semaine" ? "sem. min" : p.duree_type === "mois" ? "mois min" : "an min"}</span>}
        </div>
        <button
          onClick={toggleCompareClick}
          title={inCompare ? "Retirer du comparateur" : "Ajouter au comparateur"}
          style={{
            marginTop:8, width:"100%", padding:"5px 0",
            borderRadius:7, border:`1.5px solid ${inCompare?"#6366f1":"#e5e7eb"}`,
            background: inCompare ? "#eef2ff" : "#f8fafc",
            color: inCompare ? "#4f46e5" : "#64748b",
            fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            transition:"all .15s",
          }}
        >
          <GitCompare size={11}/>{inCompare ? " Dans le comparateur" : " Comparer"}
        </button>
      </div>
    </div>
  );
}

/* --- GeoJSON gouvernorats + délégations : fichiers statiques, chargés 1x par session --- */
let GOV_GEOJSON_CACHE = null;
let DEL_GEOJSON_CACHE = null;
async function loadGovGeoJSON() {
  if (GOV_GEOJSON_CACHE) return GOV_GEOJSON_CACHE;
  try { const r = await fetch("/tunisia-gov.geojson"); GOV_GEOJSON_CACHE = await r.json(); return GOV_GEOJSON_CACHE; } catch { return null; }
}
async function loadDelGeoJSON() {
  if (DEL_GEOJSON_CACHE) return DEL_GEOJSON_CACHE;
  try { const r = await fetch("/tunisia-del.geojson"); DEL_GEOJSON_CACHE = await r.json(); return DEL_GEOJSON_CACHE; } catch { return null; }
}

/* --------------------------------------------------------------------------
   Table de correspondance GADM delNom → nom API officiel
   Utilisée dans les deux sens : sélection carte→API et highlight API→carte.
   Clé = norm(GADM name), valeur = norm(API name).
   -------------------------------------------------------------------------- */
/* Normalisation agressive : accents NFD, minuscules, tirets/apostrophes→espace, espaces multiples */
const _n = s => (s||"").normalize("NFD")
  .replace(/[̀-ͯ]/g,"")
  .toLowerCase()
  .replace(/[\u0027\u002D\u02BC\u2010-\u2015\u2018-\u2019]+/g," ")
  .replace(/\s+/g," ")
  .trim();

/* Table GADM delNom (normalisé) → API délégation (normalisé).
   Les clés sont calculées avec _n() pour rester cohérentes après les changements de _n. */
const GADM_DEL_ALIASES = Object.fromEntries([
  /* Ariana */
  ["Ariana Médina",          "Ariana Ville"],
  ["Kalaat El Andalous",     "Kalaat Landlous"],
  ["Soukra",                 "La Soukra"],
  /* Ben Arous */
  ["Boumhel",                "Bou Mhel El Bassatine"],
  ["Hammam Chott",           "Hammam Chatt"],
  ["M’Hamdia",               "Mohamadia"],
  /* Bizerte */
  ["Ghazala",                "Ghezala"],
  /* Gabès */
  ["Hamma",                  "El Hamma"],
  ["Metouia",                "El Metouia"],
  ["Ghannouch",              "Ghannouche"],
  ["Matmata Nouvelle",       "Nouvelle Matmata"],
  /* Gafsa */
  ["Guetar",                 "El Guettar"],
  ["Ksar",                   "El Ksar"],
  ["Mdhilla",                "El Mdhilla"],
  ["Sened",                  "Sned"],
  /* Jendouba */
  ["Balta Bou Aouane",       "Balta Bou Aouene"],
  ["Bousalem",               "Bou Salem"],
  ["Jendouba Nord",          "Jendouba"],
  ["Jendouba Sud",           "Jendouba"],
  /* Kairouan */
  ["Bouhajla",               "Bou Hajla"],
  ["Chrarda",                "Cherarda"],
  ["Alaa",                   "El Ala"],
  /* Kasserine */
  ["Ayoun",                  "El Ayoun"],
  ["Hidra",                  "Haidra"],
  ["Hassi El Ferid",         "Hassi El Frid"],
  ["Jedeliane",              "Jediliane"],
  ["Majel Belabbes",         "Mejel Bel Abbes"],
  /* Kébili */
  ["Faouar",                 "El Faouar"],
  ["Souk El Ahed",           "Souk El Ahad"],
  /* Kef */
  ["Ksour",                  "El Ksour"],
  ["Kalaa Khesba",           "Kalaa El Khasba"],
  ["Kalaat Senan",           "Kalaat Sinane"],
  ["Kef Est",                "Le Kef Est"],
  ["Kef Ouest",              "Le Kef Ouest"],
  ["Es Sers",                "Le Sers"],
  ["Tajerouine",             "Touiref"],
  ["Nebeur",                 "Touiref"],
  /* Mahdia */
  ["Boumerdès",              "Bou Merdes"],
  ["Boumerdes",              "Bou Merdes"],
  ["Chebba",                 "La Chebba"],
  ["Ksour Essef",            "Ksour Essaf"],
  ["Ouled Chamekh",          "Ouled Chamakh"],
  ["Sidi Alouane",           "Sidi Alouene"],
  /* Manouba */
  ["Manouba",                "Mannouba"],
  /* Médenine */
  ["Djerba Ajim",            "Ajim"],
  ["Houmt Souk",             "Houmet Essouk"],
  ["Djerba Midoun",          "Midoun"],
  /* Monastir */
  ["Jammel",                 "Jemmal"],
  ["Ksar Hellal",            "Ksar Helal"],
  ["Sayada-Lamta-Bou Hjar",  "Sayada Lamta Bou Hajar"],
  /* Nabeul */
  ["Dar Chaabane El Fehri",  "Dar Chaabane Elfehri"],
  ["Haouaria",               "El Haouaria"],
  ["Hammam Ghezaz",          "Hammam El Ghezaz"],
  /* Sfax */
  ["Hencha",                 "El Hencha"],
  ["Skhira",                 "Esskhira"],
  ["El Ghraiba",             "Ghraiba"],
  ["Kerkennah",              "Kerkenah"],
  ["Mahres",                 "Mahras"],
  ["Sfax Médina",            "Sfax Ville"],
  ["Sfax Medina",            "Sfax Ville"],
  /* Sidi Bouzid */
  ["Bir El Hfay",            "Bir El Haffey"],
  ["Jelma",                  "Jilma"],
  ["Sabalat Ouled Asker",    "Cebbala"],
  ["Meknassi",               "Maknassy"],
  ["Mazzouna",               "Mezzouna"],
  ["Sidi Ali Ben Aoun",      "Ben Oun"],
  /* Siliana */
  ["Bouarada",               "Bou Arada"],
  ["Laroussa",               "El Aroussa"],
  ["El Krib",                "Le Krib"],
  ["Bourouis",               "Sidi Bou Rouis"],
  ["Rouhia",                 "Rohia"],
  /* Zaghouan */
  ["Zriba",                  "Hammam Zriba"],
].map(([k,v]) => [_n(k), _n(v)]));

/* Reverse map : API normalized → GADM normalized */
const GADM_DEL_ALIASES_REV = Object.fromEntries(
  Object.entries(GADM_DEL_ALIASES).map(([k,v]) => [v, k])
);
/* normDel : _n + suppression des préfixes El/La/Le/Es/Bou en début */
const normDel = s => _n(s).replace(/^(el |la |le |les |es |bou )/,"");

/* matchDel : compare un nom GADM et un nom API avec les 4 stratégies
   (égalité normalisée, normDel, alias avant, alias inverse).
   Utilisé dans les handlers mouseover/mouseout/eachLayer pour éviter
   que le mouseout réinitialise le style d'une délégation sélectionnée
   quand le nom API ≠ nom GADM (ex: "La Soukra" vs "Soukra"). */
const matchDel = (gadmName, apiName) => {
  if (!apiName) return false;
  const ng = _n(gadmName), na = _n(apiName);
  return ng === na ||
         normDel(ng) === normDel(na) ||
         GADM_DEL_ALIASES[ng] === na ||
         GADM_DEL_ALIASES_REV[na] === ng;
};

/* --- Carte Leaflet --- */
function PropertyMap({ properties, activeId, selectedGov, onGovSelect, selectedDel, onDelSelect, onPinClick, onBoundsChange, showSchools, showMosques, showFaculties, showGrandSurfaces, showHospitals, liveSchools = [], liveMosques = [], liveFaculties = [], liveGrandSurfaces = [], liveHospitals = [], onPinHover, sharedHoverTimer, centerTarget, initialView, drawMode, drawnZones, onZoneDrawn, eraseMode, eraseSelectedIdx, onEraseSelect, onMapRef }) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const leafletRef      = useRef(null);   /* ? Leaflet stock� ici d�s son chargement */
  const markersRef      = useRef({});
  const clusterGroupRef = useRef(null); /* MarkerClusterGroup leaflet.markercluster */
  const drawPinsSeqRef  = useRef(0);   /* compteur d'annulation pour les appels async de drawPins */
  const geoLayerRef     = useRef(null); /* legacy – plus utilisé mais conservé pour éviter les erreurs */
  const govInteractiveRef = useRef(null); /* couche interactive gouvernorats */
  const delInteractiveRef = useRef(null); /* couche interactive délégations */
  const [delLayerReady, setDelLayerReady] = useState(false); /* true dès que le layer del est chargé → force sync useEffect */
  const onGovSelectRef  = useRef(onGovSelect);
  const onDelSelectRef  = useRef(onDelSelect);
  const selectedDelRef  = useRef(selectedDel);
  const drawModeRef     = useRef(drawMode);
  const poiLayersRef    = useRef({ schools: [], mosques: [], faculties: [], grandSurfaces: [], hospitals: [] });
  const prevGov         = useRef(null);
  /* Bloque le reset automatique vers toute la Tunisie au premier rendu quand une vue sauvegardée est restaurée */
  const skipAutoResetRef = useRef(!!initialView);
  const hoverTimerRef   = useRef(null);
  const selectedGovRef  = useRef(selectedGov);
  /* Ref vers onPinHover � toujours à jour, évite les closures stales dans drawPins */
  const onPinHoverRef   = useRef(onPinHover);
  /* Ref vers centerTarget � accessible dans le useEffect d'init (deps:[]) */
  const centerTargetRef = useRef(centerTarget);
  useEffect(() => { selectedGovRef.current  = selectedGov;   }, [selectedGov]);
  useEffect(() => { onPinHoverRef.current   = onPinHover;    }, [onPinHover]);
  useEffect(() => { centerTargetRef.current = centerTarget;  }, [centerTarget]);
  useEffect(() => { onGovSelectRef.current  = onGovSelect;   }, [onGovSelect]);
  useEffect(() => { onDelSelectRef.current  = onDelSelect;   }, [onDelSelect]);
  useEffect(() => { selectedDelRef.current  = selectedDel;   }, [selectedDel]);
  useEffect(() => { drawModeRef.current     = drawMode;      }, [drawMode]);

  /* -- Zoom automatique quand un filtre de localisation est sélectionné -- */
  const lastCenterQuery = useRef(null);
  useEffect(() => {
    if (!centerTarget || !mapRef.current) return;
    if (centerTarget.query === lastCenterQuery.current) return; // déjà centr� ici
    lastCenterQuery.current = centerTarget.query;
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(centerTarget.query)}&format=json&countrycodes=tn&limit=1`,
      { headers: { "Accept-Language": "fr", "User-Agent": "Localizi/1.0" } }
    )
      .then(r => r.json())
      .then(data => {
        if (!data.length || !data[0].lat) return;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current?.flyTo([lat, lng], centerTarget.zoom, { duration: 1.0 });
      })
      .catch(() => {});
  }, [centerTarget]);


  const drawPins = useCallback(async (L, map, props, active) => {
    const seq = ++drawPinsSeqRef.current;

    // Supprimer l'ancien cluster group
    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current = {};

    await import("leaflet.markercluster");

    // Si un appel plus récent a démarré entre-temps, on abandonne
    if (seq !== drawPinsSeqRef.current) return;

    const catBgMap = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
    const catFgMap = { vente:"#fff",    location:"#fff",    vacances:"#fff"    };

    /* Cluster group geographique avec icone personnalisee */
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 60,
      disableClusteringAtZoom: 16,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const markers = cluster.getAllChildMarkers();
        const count = markers.reduce((s, m) => s + (m.options.bienCount || 1), 0);
        const catCount = {};
        markers.forEach(m => {
          const cat = m.options.dominantCategorie || m.options.categorie || "std";
          catCount[cat] = (catCount[cat] || 0) + (m.options.bienCount || 1);
        });
        const dom = Object.entries(catCount).sort((a,b) => b[1]-a[1])[0]?.[0] || "std";
        const col = dom === "vente" ? "#166534" : dom === "location" ? "#1e40af" : dom === "vacances" ? "#d97706" : "#64748b";
        const shadow = dom === "vente" ? "rgba(22,101,52,.45)" : dom === "location" ? "rgba(30,64,175,.45)" : dom === "vacances" ? "rgba(217,119,6,.45)" : "rgba(0,0,0,.3)";
        const size  = count < 10 ? 38 : count < 50 ? 46 : 54;
        const fs    = count < 10 ? 13 : count < 50 ? 14 : 16;
        return L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${col};color:#fff;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 12px ${shadow};font-family:system-ui,sans-serif;font-size:${fs}px;font-weight:800;cursor:pointer;">${count}</div>`,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2],
        });
      },
    });

    /* Popup pour biens empiles (meme coordonnee exacte) */
    const bindStackedPopup = (marker, group) => {
      const count = group.length;
      let currentIdx = 0;
      const buildPopup = () => {
        const pin = group[currentIdx];
        const img = (pin.images && pin.images[0]) || "";
        const bg2 = catBgMap[pin.categorie] || "#f1f5f9";
        const cc  = catFgMap[pin.categorie] || "#475569";
        const dev = fmtDevise(pin.devise);
        const rid = pin._realId || pin.id.toString().replace("api_","");
        return `<div style="width:min(460px,calc(100vw - 32px));max-width:calc(100vw - 32px);font-family:'Inter',system-ui,sans-serif;overflow:hidden;border-radius:2px;cursor:pointer;" onclick="if(window.__openAnnonceModal){window.__openAnnonceModal('${rid}');}else{window.location.href='/annonce/${rid}';}event.stopPropagation();">
          <div style="position:relative;height:190px;overflow:hidden;background:#f1f5f9;">
            ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=70'"/>` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;color:#cbd5e1;">&#127968;</div>`}
            ${pin.spotlight ? `<span style="position:absolute;bottom:8px;left:8px;background:rgba(234,88,12,.92);color:#fff;border-radius:7px;padding:3px 8px;font-size:10px;font-weight:800;backdrop-filter:blur(4px);">&#11088; &Agrave; ne pas manquer</span>` : ""}
          </div>
          <div style="padding:14px 16px 12px;border-top:2px solid ${bg2};">
            <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pin.titre || "Bien immobilier"}</div>
            <div style="font-size:19px;font-weight:900;color:#0f172a;margin-bottom:8px;">${(pin.prix||0).toLocaleString("fr-TN")} <span style="font-size:12px;font-weight:600;color:#64748b;">${dev}</span></div>
            <div style="display:flex;gap:12px;font-size:12px;color:#475569;margin-bottom:6px;flex-wrap:wrap;">
              ${pin.area ? `<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>${pin.area} m&sup2;</span>` : ""}
              ${pin.beds != null ? `<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>${pin.beds} ch.</span>` : ""}
              ${pin.baths != null ? `<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.7 3 4 3.7 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="7" y1="19" x2="7" y2="21"/><line x1="17" y1="19" x2="17" y2="21"/></svg>${pin.baths} sdb</span>` : ""}
            </div>
            ${pin.delegation ? `<div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#94a3b8;margin-bottom:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${pin.delegation}${pin.gouvernorat ? ` &middot; ${pin.gouvernorat}` : ""}</div>` : ""}
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9;font-size:13px;font-weight:800;color:${bg2};">Voir d&eacute;tails &#8594;</div>
            ${count > 1 ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
              <button onclick="event.stopPropagation();window._stPrev_${group[0].id}()" style="padding:6px 14px;border:1.5px solid #e5e7eb;border-radius:4px;background:#f8fafc;cursor:pointer;font-size:13px;font-weight:700;color:#374151;font-family:inherit;">&#8592; Pr&eacute;c&eacute;dent</button>
              <span style="font-size:12px;color:#94a3b8;font-weight:600;">Bien ${currentIdx+1} sur ${count}</span>
              <button onclick="event.stopPropagation();window._stNext_${group[0].id}()" style="padding:6px 14px;border:none;border-radius:4px;background:${bg2};cursor:pointer;font-size:13px;font-weight:700;color:${cc};font-family:inherit;">Suivant &#8594;</button>
            </div>` : ""}
          </div>
        </div>`;
      };
      const gid = group[0].id;
      window[`_stPrev_${gid}`] = () => { currentIdx=(currentIdx-1+count)%count; marker.setPopupContent(buildPopup()); };
      window[`_stNext_${gid}`] = () => { currentIdx=(currentIdx+1)%count;       marker.setPopupContent(buildPopup()); };
      const isMob = window.innerWidth < 640;
      marker.bindPopup(buildPopup(), { maxWidth: isMob ? window.innerWidth - 32 : 480, closeButton:true, className:"cluster-popup", offset:L.point(0,-8), autoPan:true, autoPanPadding: isMob ? [8,8] : [20,20] });
      marker.on("click", (e) => { L.DomEvent.stopPropagation(e); onPinHoverRef.current?.(null); });
    };

    /* Grouper par coordonnees exactes */
    const grouped = {};
    props.forEach(p => {
      if (!p.lat || !p.lng) return;
      const key = `${(+p.lat).toFixed(6)}_${(+p.lng).toFixed(6)}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    Object.values(grouped).forEach(group => {
      const isA = group.some(p => p.id === active);
      if (group.length === 1) {
        const p      = group[0];
        const catCls = p.categorie ? `pin-dot--${p.categorie}` : "pin-dot--std";
        const cls    = `pin-dot ${catCls}${isA ? " pin-dot--active" : ""}`;
        const icon   = L.divIcon({ className:"", html:`<div class="${cls}"></div>`, iconSize:[null,null], iconAnchor:[10,10] });
        const m      = L.marker([p.lat, p.lng], { icon, bienCount: 1, categorie: p.categorie });
        m.on("click", (e) => { if (drawModeRef.current) return; L.DomEvent.stopPropagation(e); onPinHoverRef.current?.({ ...p, _px: e.containerPoint.x, _py: e.containerPoint.y }); });
        markersRef.current[p.id] = m;
        clusterGroup.addLayer(m);
      } else {
        const rep = group[0];
        const cnt = group.length;
        const catCount = {};
        group.forEach(p => { catCount[p.categorie||"std"] = (catCount[p.categorie||"std"]||0)+1; });
        const dom = Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0][0];
        const col = dom === "vente" ? "#166534" : dom === "location" ? "#1e40af" : dom === "vacances" ? "#d97706" : "#9b1c2e";
        const pillHtml = `<div style="display:inline-flex;align-items:center;gap:5px;background:${col};color:#fff;border-radius:20px;padding:6px 13px 6px 9px;border:2.5px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.35);white-space:nowrap;cursor:pointer;font-family:system-ui,sans-serif;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="2" y="2" width="20" height="22" rx="1" fill="rgba(255,255,255,.2)"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="9" y1="22" x2="9" y2="8"/></svg><span style="font-size:13px;font-weight:800;line-height:1;">${cnt}</span></div>`;
        const pillIcon = L.divIcon({ className:"", html:pillHtml, iconSize:null, iconAnchor:[0,0] });
        const m = L.marker([rep.lat, rep.lng], { icon: pillIcon, bienCount: cnt, dominantCategorie: dom });
        bindStackedPopup(m, group);
        markersRef.current[`stack_${rep.lat}_${rep.lng}`] = m;
        clusterGroup.addLayer(m);
      }
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);
  }, [onPinClick]);

  /* init */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !containerRef.current) return;
      leafletRef.current = L;   /* ? stocker pour usage synchrone dans les effets POI */
      const iv = initialView;
      const initCenter = iv ? [iv.center.lat, iv.center.lng] : [34.5, 9.5];
      const initZoom   = iv ? iv.zoom : 6;
      const map = L.map(containerRef.current, { zoomControl:false })
        .setView(initCenter, initZoom);
      mapRef.current = map;
      onMapRef?.(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution:"&copy; OpenStreetMap &copy; CARTO", maxZoom:19 }).addTo(map);
      L.control.zoom({ position:"bottomright" }).addTo(map);
      setTimeout(()=>map.invalidateSize(), 80);
      /* Clic sur le fond de la carte → ferme la HoverCard (pas en mode dessin) */
      map.on("click", () => { if (!drawModeRef.current) onPinHoverRef.current?.(null); });
      drawPins(L, map, properties, activeId);

      /* Couche interactive gouvernorats : fichier statique, chargement instantané */
      (async () => {
        const geoData = await loadGovGeoJSON();
        if (!live || !mapRef.current || !geoData) return;

        const styleDefault  = { color:"#94a3b8", weight:1.5, fillColor:"transparent", fillOpacity:0, opacity:0.8 };
        const styleHover    = { color:"#475569", weight:2, fillColor:"#64748b", fillOpacity:0.18, opacity:1 };
        const styleSelected = { color:"#1e40af", weight:2.5, fillColor:"#3b82f6", fillOpacity:0.13, opacity:1 };

        const govLayer = L.geoJSON(geoData, {
          style: () => ({ ...styleDefault }),
          onEachFeature: (feature, layer) => {
            const govNom = feature.properties?.govNom || "";
            const normStr = _n;
            layer.on({
              mouseover: () => {
                if (drawModeRef.current) return;
                if (normStr(selectedGovRef.current) === normStr(govNom)) return;
                layer.setStyle(styleHover);
              },
              mouseout: () => {
                if (drawModeRef.current) return;
                if (normStr(selectedGovRef.current) === normStr(govNom)) return;
                layer.setStyle(styleDefault);
              },
              click: () => {
                if (drawModeRef.current) return;
                govLayer.eachLayer(l => {
                  const n = l.feature?.properties?.govNom || "";
                  l.setStyle(normStr(n) === normStr(govNom) ? styleSelected : styleDefault);
                });
                onGovSelectRef.current?.(govNom);
              },
            });
          },
        }).addTo(map);
        govInteractiveRef.current = govLayer;

        /* Colorier + zoomer si un gouvernorat est déjà sélectionné au montage */
        if (selectedGovRef.current) {
          const normStr = _n;
          let mountBounds = null;
          govLayer.eachLayer(l => {
            const n = l.feature?.properties?.govNom || "";
            if (normStr(n) === normStr(selectedGovRef.current)) {
              l.setStyle(styleSelected);
              try { mountBounds = l.getBounds(); } catch {}
            }
          });
          if (!iv && mountBounds?.isValid()) map.fitBounds(mountBounds, { padding:[40,40], maxZoom:12 });
        }
      })();

      /* Couche interactive délégations : même approche, fichier statique */
      (async () => {
        const delData = await loadDelGeoJSON();
        if (!live || !mapRef.current || !delData) return;

        const sdDef = { color:"#6366f1", weight:1, fillColor:"transparent", fillOpacity:0, opacity:0, dashArray:"4,3" };
        const sdHov = { color:"#4338ca", weight:1.5, fillColor:"#6366f1", fillOpacity:0.15, opacity:1 };
        const sdSel = { color:"#1e40af", weight:2, fillColor:"#3b82f6", fillOpacity:0.2, opacity:1 };

        const delLayer = L.geoJSON(delData, {
          style: () => ({ ...sdDef }),
          onEachFeature: (feature, layer) => {
            const { govNom, delNom } = feature.properties || {};
            const normStr = _n;
            /* Vérifie si le gouvernorat de ce polygon = gouvernorat sélectionné
               (comparaison souple : normDel gère "Le Kef" vs "Kef", etc.) */
            const sameGov = () => {
              if (!selectedGovRef.current) return false;
              const g1 = normStr(govNom), g2 = normStr(selectedGovRef.current);
              return g1 === g2 || normDel(g1) === normDel(g2);
            };
            layer.on({
              mouseover: () => {
                if (drawModeRef.current) return;
                if (!sameGov()) return;
                if (matchDel(delNom, selectedDelRef.current)) return;
                layer.setStyle(sdHov);
              },
              mouseout: () => {
                if (drawModeRef.current) return;
                if (!sameGov()) return;
                if (matchDel(delNom, selectedDelRef.current)) return;
                layer.setStyle(sdDef);
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                if (drawModeRef.current) return;
                if (!sameGov()) return;
                delLayer.eachLayer(l => {
                  const dn = l.feature?.properties?.delNom || "";
                  const gn = l.feature?.properties?.govNom || "";
                  const _g1 = normStr(gn), _g2 = normStr(selectedGovRef.current||"");
                  const inGov = _g1 === _g2 || normDel(_g1) === normDel(_g2);
                  l.setStyle(normStr(dn) === normStr(delNom) ? sdSel : inGov ? sdDef : { ...sdDef, opacity:0 });
                });
                onDelSelectRef.current?.(delNom, govNom);
              },
            });
          },
        }).addTo(map);
        delInteractiveRef.current = delLayer;

        /* Après chargement : appliquer les styles corrects en utilisant la table
           d'alias complète (même logique que le sync useEffect) afin d'éviter la
           race condition où le useEffect s'est exécuté avant que delLayer soit prêt. */
        const sdVisible = { color:"#6366f1", weight:1, fillColor:"transparent", fillOpacity:0, opacity:0.85, dashArray:"4,3" };
        const sdHid2   = { opacity:0, fillOpacity:0 };
        const _ns = _n;
        delLayer.eachLayer(l => {
          const { govNom, delNom } = l.feature?.properties || {};
          const _g1 = _ns(govNom), _g2 = _ns(selectedGovRef.current||"");
          const inGov = selectedGovRef.current && (_g1 === _g2 || normDel(_g1) === normDel(_g2));
          const el = l.getElement?.();
          if (el) el.style.pointerEvents = inGov ? 'auto' : 'none';
          if (!inGov) { l.setStyle(sdHid2); return; }
          /* Identifier la délégation sélectionnée avec alias + normDel */
          const ng = _ns(delNom), na = _ns(selectedDelRef.current || "");
          const isSel = na && (
            ng === na ||
            normDel(ng) === normDel(na) ||
            GADM_DEL_ALIASES[ng] === na ||
            GADM_DEL_ALIASES_REV[na] === ng
          );
          l.setStyle(isSel ? sdSel : sdVisible);
        });
        setDelLayerReady(true);
      })();


      /* Quand initialView est restaur�, pr�-remplir lastCenterQuery pour que
         l'effet centerTarget ne déclenche PAS de flyTo au premier rendu. */
      if (iv && centerTargetRef.current) {
        lastCenterQuery.current = centerTargetRef.current.query;
      }

      /* -- Mise à jour de la liste au zoom/déplacement -- */
      const emitBounds = () => {
        if (onBoundsChange) onBoundsChange(map.getBounds());
        /* Persist map view for state restoration on navigate-back */
        const c = map.getCenter();
        sessionStorage.setItem("localizi_carte_view", JSON.stringify({ center: { lat: c.lat, lng: c.lng }, zoom: map.getZoom() }));
      };
      map.on("zoomend moveend", emitBounds);
      /* Sauvegarder la vue initiale imm�diatement (avant tout zoom/déplacement) */
      emitBounds();
    })();
    return ()=>{ live=false; if(mapRef.current){mapRef.current.remove();mapRef.current=null;} };
  }, []); // eslint-disable-line

  /* redessiner pins — uniquement quand le contenu change réellement.
     Sans ce garde, un simple déplacement de carte (ex. autoPan à l'ouverture d'un
     popup) émet de nouvelles bounds → le parent recalcule `properties` (nouvelle
     référence) → les pins sont reconstruits et le popup ouvert disparaît (clignotement). */
  const lastDrawSigRef = useRef("");
  useEffect(() => {
    if (!mapRef.current) return;
    const sig = properties.map(p => `${p.id}@${p.lat},${p.lng}`).join("|") + "#" + activeId;
    if (sig === lastDrawSigRef.current) return;
    lastDrawSigRef.current = sig;
    import("leaflet").then(({default:L}) => drawPins(L, mapRef.current, properties, activeId));
  }, [properties, activeId, drawPins]);

  /* Sync couches interactives quand selectedGov ou selectedDel change
     Phase 1 (pas de gov) : seuls les gouvernorats sont hoverable/cliquables
     Phase 2 (gov sélectionné) : gouvernorat figé bleu, délégations hoverable/cliquables */
  useEffect(() => {
    const govLayer = govInteractiveRef.current;
    const delLayer = delInteractiveRef.current;
    const gSel = { color:"#1e40af", weight:2.5, fillColor:"#3b82f6", fillOpacity:0.12, opacity:1 };
    const gDef = { fillColor:"transparent", fillOpacity:0, color:"#94a3b8", weight:1.5, opacity:0.8 };
    const dDef = { color:"#6366f1", weight:1, fillColor:"transparent", fillOpacity:0, opacity:0.85, dashArray:"4,3" };
    const dSel = { color:"#1e40af", weight:2, fillColor:"#3b82f6", fillOpacity:0.2, opacity:1, dashArray:null };
    const dHid = { opacity:0, fillOpacity:0 };

    const norm = _n;

    if (govLayer) {
      govLayer.eachLayer(l => {
        const n = l.feature?.properties?.govNom || "";
        l.setStyle(selectedGov && norm(n) === norm(selectedGov) ? gSel : gDef);
      });
    }

    if (delLayer) {
      delLayer.eachLayer(l => {
        const { govNom, delNom } = l.feature?.properties || {};
        const _ng = norm(govNom), _ns2 = norm(selectedGov||"");
        const inGov = selectedGov && (_ng === _ns2 || normDel(_ng) === normDel(_ns2));
        const isSel = selectedDel && matchDel(delNom, selectedDel);
        l.setStyle(inGov ? (isSel ? dSel : dDef) : dHid);
        /* pointer-events : seules les délégations du gov actif captent la souris.
           Les autres laissent passer les events au gov layer en dessous. */
        const el = l.getElement?.();
        if (el) el.style.pointerEvents = inGov ? 'auto' : 'none';
      });
    }

    /* Zoom : délégation en priorité, sinon gouvernorat, sinon vue Tunisie.
       skipAutoResetRef bloque le premier zoom automatique sur les 3 branches
       quand une vue sauvegardée (sessionStorage) est restaurée au refresh. */
    if (skipAutoResetRef.current) {
      /* Premier rendu avec vue sauvegardée → on ne touche pas au zoom,
         on consomme le skip pour que les actions suivantes de l'user déclenchent bien les zooms */
      skipAutoResetRef.current = false;
    } else if (selectedDel && delLayer && mapRef.current) {
      let bounds = null;
      delLayer.eachLayer(l => {
        const { govNom, delNom } = l.feature?.properties || {};
        if (selectedGov) { const _g1=norm(govNom),_g2=norm(selectedGov); if(_g1!==_g2 && normDel(_g1)!==normDel(_g2)) return; }
        if (matchDel(delNom, selectedDel)) {
          try { bounds = l.getBounds(); } catch {}
        }
      });
      if (bounds?.isValid()) mapRef.current.fitBounds(bounds, { padding:[30,30], maxZoom:14 });
    } else if (selectedGov && govLayer && mapRef.current) {
      let bounds = null;
      govLayer.eachLayer(l => {
        const _g1=norm(l.feature?.properties?.govNom||""),_g2=norm(selectedGov);
        if (_g1===_g2 || normDel(_g1)===normDel(_g2)) { try { bounds = l.getBounds(); } catch {} }
      });
      if (bounds?.isValid()) mapRef.current.fitBounds(bounds, { padding:[40,40], maxZoom:12 });
    } else if (!selectedGov && mapRef.current) {
      mapRef.current.setView([34.5, 9.5], 6);
    }
  }, [selectedGov, selectedDel, delLayerReady]);

  /* zoom r�gion + GeoJSON polygon – fires on mount and whenever selectedGov changes */

  /* -- Helper pour dessiner une couche POI � synchrone via leafletRef -- */
  const makePOIEffect = (layerKey, show, liveData, staticFallback, label, svgPath) => {
    const L   = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    /* Supprimer les marqueurs existants de cette couche */
    poiLayersRef.current[layerKey].forEach(m => { try { m.remove(); } catch {} });
    poiLayersRef.current[layerKey] = [];

    if (!show) return;

    const src  = liveData.length > 0 ? liveData : staticFallback;
    const icon = makePOIIcon(L, "#475569", svgPath);
    src.forEach(s => {
      if (!s.lat || !s.lng) return;
      try {
        const marker = L.marker([s.lat, s.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${label}</b><br>${s.nom || ""}`);
        poiLayersRef.current[layerKey].push(marker);
      } catch {}
    });
  };

  /* POIs Écoles */
  useEffect(() => makePOIEffect(
    "schools", showSchools, liveSchools,
    selectedGov ? SCHOOLS.filter(s=>s.gov===selectedGov) : SCHOOLS,
    "École", SCHOOL_SVG
  ), [showSchools, liveSchools, selectedGov]);

  /* POIs mosqu�es */
  useEffect(() => makePOIEffect(
    "mosques", showMosques, liveMosques,
    selectedGov ? MOSQUES.filter(m=>m.gov===selectedGov) : MOSQUES,
    "Mosquée", MOSQUE_SVG
  ), [showMosques, liveMosques, selectedGov]);

  /* POIs facult�s */
  useEffect(() => makePOIEffect(
    "faculties", showFaculties, liveFaculties,
    selectedGov ? FACULTIES.filter(f=>f.gov===selectedGov) : FACULTIES,
    "Faculté / Université", FACULTY_SVG
  ), [showFaculties, liveFaculties, selectedGov]);

  /* POIs grandes surfaces */
  useEffect(() => makePOIEffect(
    "grandSurfaces", showGrandSurfaces, liveGrandSurfaces,
    selectedGov ? GRAND_SURFACES.filter(g=>g.gov===selectedGov) : GRAND_SURFACES,
    "Grande surface", SURFACE_SVG
  ), [showGrandSurfaces, liveGrandSurfaces, selectedGov]);

  /* POIs hôpitaux */
  useEffect(() => makePOIEffect(
    "hospitals", showHospitals, liveHospitals,
    selectedGov ? HOSPITALS.filter(h=>h.gov===selectedGov) : HOSPITALS,
    "Hôpital / Clinique", HOSPITAL_SVG
  ), [showHospitals, liveHospitals, selectedGov]);

  /* -- Mode dessin de zone -- */
  useEffect(() => {
    const map = mapRef.current;
    const L   = leafletRef.current;
    if (!map || !L) return;

    if (!drawMode) {
      map.getContainer().style.cursor = '';
      map.dragging.enable();
      return;
    }

    map.getContainer().style.cursor = 'crosshair';
    map.dragging.disable();

    let vertices = [];
    let polyline = null;
    let drawing  = false;

    const redraw = () => {
      if (polyline) { polyline.remove(); polyline = null; }
      if (vertices.length >= 2)
        polyline = L.polyline(vertices.map(v => [v.lat, v.lng]),
          { color:'#1e40af', weight:3, dashArray:'6,3', opacity:.9 }).addTo(map);
    };

    const onMouseDown = (e) => {
      drawing = true;
      vertices = [{ lat: e.latlng.lat, lng: e.latlng.lng }];
      redraw();
    };

    const onMouseMove = (e) => {
      if (!drawing) return;
      vertices.push({ lat: e.latlng.lat, lng: e.latlng.lng });
      redraw();
    };

    const onMouseUp = () => {
      if (!drawing) return;
      drawing = false;
      if (vertices.length < 3) { if (polyline) { polyline.remove(); polyline = null; } vertices = []; return; }
      cleanup();
      onZoneDrawn && onZoneDrawn(vertices);
    };

    const container = map.getContainer();

    /* ── Support tactile (mobile) : convertir les touches en latlng ── */
    const touchLatLng = (ev) => {
      const t = ev.touches?.[0] || ev.changedTouches?.[0];
      if (!t) return null;
      const rect = container.getBoundingClientRect();
      return map.containerPointToLatLng(L.point(t.clientX - rect.left, t.clientY - rect.top));
    };
    const onTouchStart = (ev) => {
      if (ev.touches.length !== 1) return;   // ignore le pinch-zoom
      ev.preventDefault();
      drawing = true;
      const ll = touchLatLng(ev);
      vertices = ll ? [{ lat: ll.lat, lng: ll.lng }] : [];
      redraw();
    };
    const onTouchMove = (ev) => {
      if (!drawing) return;
      ev.preventDefault();
      const ll = touchLatLng(ev);
      if (ll) { vertices.push({ lat: ll.lat, lng: ll.lng }); redraw(); }
    };
    const onTouchEnd = () => {
      if (!drawing) return;
      drawing = false;
      if (vertices.length < 3) { if (polyline) { polyline.remove(); polyline = null; } vertices = []; return; }
      cleanup();
      onZoneDrawn && onZoneDrawn(vertices);
    };

    const cleanup = () => {
      if (polyline) polyline.remove();
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      map.dragging.enable();
      map.getContainer().style.cursor = '';
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    return cleanup;
  }, [drawMode, onZoneDrawn]); // eslint-disable-line

  /* -- Rendu du polygone dessin� -- */
  const drawnLayersRef = useRef([]);
  useEffect(() => {
    const map = mapRef.current;
    const L   = leafletRef.current;
    if (!map || !L) return;
    drawnLayersRef.current.forEach(l => l.remove());
    drawnLayersRef.current = [];
    (drawnZones || []).forEach((zone, i) => {
      if (!zone || zone.length < 3) return;
      const isSelected = eraseMode && eraseSelectedIdx === i;
      const poly = L.polygon(
        zone.map(v => [v.lat, v.lng]),
        { color: isSelected ? '#dc2626' : '#1e40af', weight:2.5, dashArray:'7,4',
          fillColor: isSelected ? '#ef4444' : '#3b82f6', fillOpacity: isSelected ? 0.25 : 0.10 }
      ).addTo(map);
      if (eraseMode) {
        poly.on('click', (e) => { L.DomEvent.stopPropagation(e); onEraseSelect && onEraseSelect(i); });
      }
      drawnLayersRef.current.push(poly);
    });
  }, [drawnZones, eraseMode, eraseSelectedIdx]); // eslint-disable-line

  return <div ref={containerRef} style={{ width:"100%", height:"100%" }} />;
}

/* --- Tag filtre actif --- */
function Tag({ label, color, onRemove }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 9px 3px 10px",
      background: color||"#eef2ff",
      border:`1px solid ${color?"transparent":"#c7d2fe"}`,
      borderRadius:20, fontSize:11, fontWeight:600, color: color?"#fff":"#4338ca",
    }}>
      {label}
      <button onClick={onRemove} style={{ display:"flex", border:"none", background:"rgba(0,0,0,.15)", cursor:"pointer",
        padding:0, borderRadius:"50%", width:14, height:14, alignItems:"center", justifyContent:"center", color:"inherit" }}>
        <X size={9}/>
      </button>
    </span>
  );
}

/* --- S�lecteur hiérarchique localisation --- */
function LocationCascade({ govId, delId, locId, govNom, delNom, locNom, onChange }) {
  const { gouvernorats, delegations, localites, loading } = useLocalisation({
    gouvernorat: govId,
    delegation:  delId,
    localite:    locId,
  });

  /* -- R�solution automatique des IDs à partir des noms ---------------
     Quand la détection intelligente (saisie texte) remplit govNom/delNom/locNom
     sans les IDs correspondants, ces effets les retrouvent d�s que les
     listes de référence sont disponibles, et mettent à jour la cascade. */

  // 1 � govId depuis govNom
  useEffect(() => {
    if (!govId && govNom && gouvernorats.length > 0) {
      const found = gouvernorats.find(g => g.label.toLowerCase() === govNom.toLowerCase());
      if (found) {
        onChange({ govId: String(found.value), govNom, delId: "", delNom, locId: "", locNom });
      }
    }
  }, [govNom, gouvernorats]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2 � delId depuis delNom (requiert govId)
  useEffect(() => {
    if (govId && !delId && delNom && delegations.length > 0) {
      const found = delegations.find(d => d.nom.toLowerCase() === delNom.toLowerCase());
      if (found) {
        onChange({ govId, govNom, delId: String(found.id), delNom, locId: "", locNom });
      }
    }
  }, [delNom, delegations, govId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3 à locId depuis locNom (requiert delId)
  useEffect(() => {
    if (delId && !locId && locNom && localites.length > 0) {
      const found = localites.find(l => l.nom.toLowerCase() === locNom.toLowerCase());
      if (found) {
        onChange({ govId, govNom, delId, delNom, locId: String(found.id), locNom });
      }
    }
  }, [locNom, localites, delId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="loc-cascade">
      {/* Gouvernorat */}
      <div className="loc-cascade__field">
        <MapPin size={13} className="lc__ico lc__ico--gov"/>
        <select className="lc__sel"
          value={govId}
          onChange={(e) => {
            const opt = gouvernorats.find(g=>g.value===e.target.value);
            onChange({ govId:e.target.value, govNom:opt?.label||"", delId:"", delNom:"", locId:"", locNom:"" });
          }}
        >
          <option value="">{govNom || "Gouvernorat"}</option>
          {gouvernorats.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        {loading && (govId || govNom) && <Loader2 size={12} className="lc__spin"/>}
      </div>

      <ChevronRight size={14} className="loc-cascade__arrow" />

      {/* Délégation */}
      <div className={`loc-cascade__field${!govId?" loc-cascade__field--disabled":""}`}>
        <MapPin size={13} className="lc__ico lc__ico--del"/>
        <select className="lc__sel" disabled={!govId}
          value={delId}
          onChange={(e) => {
            const opt = delegations.find(d=>d.id===e.target.value);
            onChange({ govId, govNom, delId:e.target.value, delNom:opt?.nom||"", locId:"", locNom:"" });
          }}
        >
          <option value="">{delNom || "Délégation"}</option>
          {delegations.map(d=><option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
      </div>

      <ChevronRight size={14} className="loc-cascade__arrow" />

      {/* Localité */}
      <div className={`loc-cascade__field${!delId?" loc-cascade__field--disabled":""}`}>
        <MapPin size={11} className="lc__ico lc__ico--loc"/>
        <select className="lc__sel" disabled={!delId}
          value={locId}
          onChange={(e) => {
            const opt = localites.find(l=>l.id===e.target.value);
            onChange({ govId, govNom, delId, delNom, locId:e.target.value, locNom:opt?.nom||"" });
          }}
        >
          <option value="">Localité</option>
          {localites.map(l=><option key={l.id} value={l.id}>{l.nom}</option>)}
        </select>
      </div>
    </div>
  );
}

/* --- PANNEAU FILTRES --- */
const INIT_F = {
  query:"", govId:"", govNom:"", delId:"", delNom:"", locId:"", locNom:"",
  categories:[], type:"",
  prixMin:"", prixMax:"", filterDevise:"TND", superficieMin:"", superficieMax:"", bedsMin:"", piecesMin:"", chambresMin:"", etat:"", titre_foncier:"",
  features:[],
  type_terrain:"", vocation_terrain:"",
  type_appartement:"", etage_min:"",
  type_villa:"",
  nb_appartements_min:"", hauteur_immeuble:"",
  emplacement_garage:"",
  type_bureau:"",
  anciennete:"",
  standing:"",
  colocation: false,
  datePubliMin:"",
};

function countActiveFilters(f) {
  let n = 0;
  if (f.query)                   n++;
  if (f.govId)                   n++;
  if (f.delId)                   n++;
  if (f.locId)                   n++;
  if ((f.categories||[]).length) n++;
  if (f.type)                    n++;
  if (f.prixMin)                 n++;
  if (f.prixMax)                 n++;
  if (f.superficieMin)           n++;
  if (f.superficieMax)           n++;
  if (f.bedsMin)                 n++;
  if (f.piecesMin)               n++;
  if (f.chambresMin)             n++;
  if (f.etat)                    n++;
  if (f.titre_foncier)           n++;
  if (f.vocation_terrain)        n++;
  if (f.type_terrain)            n++;
  if (f.anciennete)              n++;
  if (f.standing)                n++;
  if (f.etage_min)               n++;
  if (f.type_appartement)        n++;
  if (f.colocation)              n++;
  n += (f.features||[]).length;
  return n;
}

function FilterPanel({ filters, onChange, onSaveSearch, showSchools, showMosques, showFaculties, showGrandSurfaces, showHospitals,
                       onToggleSchools, onToggleMosques, onToggleFaculties, onToggleGrandSurfaces, onToggleHospitals, poiLoading, poiFetched,
                       liveSchoolCount, liveMosqueCount, liveFacultyCount, liveGrandSurfaceCount, liveHospitalCount }) {
  const [local,         setLocal]         = useState(filters);
  const [advanced,      setAdvanced]      = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [layersOpen,    setLayersOpen]    = useState(false);
  const layersBtnRef = useRef(null);
  const { poi_enabled: poiEnabled } = useFeatureFlags();

  /* Couches de données POI à afficher sur la carte (menu multi-choix "Couche data") */
  const LAYER_ITEMS = [
    { key:"schools",       label:"Écoles",          svg:SCHOOL_SVG,   on:showSchools,       toggle:onToggleSchools,       count:liveSchoolCount },
    { key:"mosques",       label:"Mosquées",        svg:MOSQUE_SVG,   on:showMosques,       toggle:onToggleMosques,       count:liveMosqueCount },
    { key:"faculties",     label:"Facultés",        svg:FACULTY_SVG,  on:showFaculties,     toggle:onToggleFaculties,     count:liveFacultyCount },
    { key:"grandSurfaces", label:"Grandes surfaces",svg:SURFACE_SVG,  on:showGrandSurfaces, toggle:onToggleGrandSurfaces, count:liveGrandSurfaceCount },
    { key:"hospitals",     label:"Hôpitaux",        svg:HOSPITAL_SVG, on:showHospitals,     toggle:onToggleHospitals,     count:liveHospitalCount },
  ];
  const activeLayers = LAYER_ITEMS.filter(l => l.on).length;

  /* Resync si les filtres changent depuis l'ext�rieur (ex : navigation via la navbar) */
  useEffect(() => { setLocal(filters); }, [filters]);

  const set          = (k, v) => setLocal(f => ({ ...f, [k]:v }));
  const apply        = ()     => onChange(local);
  const applyMobile  = ()     => {
    onChange(local);
    setAdvanced(false);
    // Après fermeture du panneau, le conteneur carte change de taille → Leaflet doit recalculer
    setTimeout(() => { leafletMapRef.current?.invalidateSize(); }, 320);
  };
  const reset        = ()     => { setLocal(INIT_F); onChange(INIT_F); };

  return (
    <div className="fp">
      {/* -- Ligne 1 -- */}
      <div className="fp__row1">

        {/* Recherche textuelle + bouton Rechercher accolé */}
        <div className="fp__search-wrap">
          <div className="fp__search">
            <Search size={14} className="fp__search-ico"/>
            <input
              type="text" placeholder="Titre, quartier, adresse…"
              value={local.query}
              onChange={(e)=>set("query",e.target.value)}
              onKeyDown={(e)=>e.key==="Enter"&&apply()}
              className="fp__search-inp"
            />
            {local.query && <button onClick={()=>set("query","")} className="fp__clear"><X size={11}/></button>}
          </div>
          <button className="fp__submit fp__submit--search" onClick={applyMobile}>
            <Search size={14}/> <span className="fp__submit-lbl">Rechercher</span>
          </button>
        </div>

        {/* Catégorie � multi-sélection avec bouton Tous */}
        <div className="fp__pill-group">
          {/* Tous — actif quand aucune catégorie sélectionnée */}
          <button
            className={`fp__pill fp__pill--tous${(local.categories||[]).length === 0 ? " fp__pill--on" : ""}`}
            onClick={() => { const updated = { ...local, categories: [] }; setLocal(updated); onChange(updated); }}
          >
            Tous
          </button>
          {["vente", "location", "vacances"].map(v => {
            const active = (local.categories || []).includes(v);
            return (
              <button key={v}
                className={`fp__pill fp__pill--${v}${active ? " fp__pill--on" : ""}`}
                onClick={() => {
                  const cats = local.categories || [];
                  const newCats = active ? cats.filter(c => c !== v) : [...cats, v];
                  const updated = { ...local, categories: newCats };
                  setLocal(updated);
                  onChange(updated);
                }}
              >
                {CAT_LBL[v]}
              </button>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:8, marginLeft:"auto", alignItems:"center" }}>
          {/* Couche data — menu déroulant multi-choix des POI à afficher sur la carte */}
          {poiEnabled && <div className="fp__layers">
            <button
              ref={layersBtnRef}
              className={`fp__adv-btn${activeLayers>0?" fp__adv-btn--on":""}`}
              onClick={()=>setLayersOpen(o=>!o)}
              type="button"
            >
              <Layers size={13}/>
              <span>Lieux</span>
              {activeLayers>0 && <span className="fp__layers-badge">{activeLayers}</span>}
              <ChevronDown size={11} style={{ transform:layersOpen?"rotate(180deg)":"none", transition:"transform .2s" }}/>
            </button>
            {layersOpen && ReactDOM.createPortal(
              (() => {
                const r = layersBtnRef.current?.getBoundingClientRect();
                const top  = r ? r.bottom + 6 : 80;
                const left = r ? Math.max(8, Math.min(r.left, window.innerWidth - 238)) : 8;
                return (
                  <>
                    <div className="fp__layers-backdrop" onClick={()=>setLayersOpen(false)}/>
                    <div className="fp__layers-menu" style={{ position:"fixed", top, left }}>
                      <div className="fp__layers-title">Données à afficher sur la carte</div>
                      {LAYER_ITEMS.map(item => (
                        <label key={item.key} className={`fp__layers-item${item.on?" fp__layers-item--on":""}`}>
                          <input type="checkbox" checked={item.on} onChange={item.toggle}/>
                          <span className="fp__layers-ico"><PoiSvg path={item.svg}/></span>
                          <span className="fp__layers-lbl">{item.label}</span>
                          {item.on && poiLoading
                            ? <Loader2 size={12} className="lc__spin"/>
                            : (item.on && item.count!=null && <span className="fp__layers-cnt">{item.count}</span>)}
                        </label>
                      ))}
                    </div>
                  </>
                );
              })(),
              document.body
            )}
          </div>}

          {/* Filtres avancés */}
          <button className={`fp__adv-btn${advanced?" fp__adv-btn--on":""}`} onClick={()=>setAdvanced(!advanced)}>
            <SlidersHorizontal size={13}/>
            <span>Filtres</span>
            <ChevronDown size={11} style={{ transform:advanced?"rotate(180deg)":"none", transition:"transform .2s" }}/>
          </button>

          {/* Bouton Rechercher — desktop uniquement, à la fin de la ligne */}
          <button className="fp__submit fp__submit--desktop" onClick={apply}>
            <Search size={14}/> <span className="fp__submit-lbl">Rechercher</span>
          </button>

          {/* Bouton Enregistrer — visible sur mobile uniquement (sur desktop il est dans la barre cp-bar) */}
          <button className="fp__save-search fp__save-search--mobile" onClick={onSaveSearch}>
            <Save size={13} strokeWidth={2}/> Enregistrer
          </button>
        </div>
      </div>

      {/* -- Localisation hiérarchique -- */}
      <div className="fp__loc-row">
        <LocationCascade
          govId={local.govId} govNom={local.govNom}
          delId={local.delId} delNom={local.delNom}
          locId={local.locId} locNom={local.locNom}
          onChange={(v) => {
            // Sélection cascade ? efface la recherche texte préc�dente
            const updated = { ...local, ...v, query: "" };
            setLocal(updated);
            onChange(updated);   // applique imm�diatement sans cliquer "Rechercher"
          }}
        />

        {/* Overlays POI — boutons cliquables (desktop uniquement ; sur mobile c'est le menu "Couche data") */}
        {/* POI désactivés si aucun gouvernorat sélectionné — la recherche Overpass nécessite une bbox limitée */}
        {poiEnabled && (
        <div className="fp__poi-group">
          {!local.govNom && (
            <div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic",padding:"4px 2px"}}>
              Sélectionnez un gouvernorat pour activer les lieux
            </div>
          )}
          <button disabled={!local.govNom} className={`fp__poi-btn fp__poi-btn--school${showSchools?" fp__poi-btn--on":""}`} onClick={onToggleSchools} title={!local.govNom?"Sélectionnez un gouvernorat d'abord":""}>
            {poiLoading && showSchools ? <Loader2 size={13} className="lc__spin"/> : <PoiSvg path={SCHOOL_SVG}/>}
            Écoles
            {showSchools && !poiLoading && <span className="fp__poi-count">{liveSchoolCount}</span>}
          </button>
          <button disabled={!local.govNom} className={`fp__poi-btn fp__poi-btn--mosque${showMosques?" fp__poi-btn--on":""}`} onClick={onToggleMosques} title={!local.govNom?"Sélectionnez un gouvernorat d'abord":""}>
            {poiLoading && showMosques ? <Loader2 size={13} className="lc__spin"/> : <PoiSvg path={MOSQUE_SVG}/>}
            Mosquées
            {showMosques && !poiLoading && <span className="fp__poi-count">{liveMosqueCount}</span>}
          </button>
          <button disabled={!local.govNom} className={`fp__poi-btn fp__poi-btn--faculty${showFaculties?" fp__poi-btn--on":""}`} onClick={onToggleFaculties} title={!local.govNom?"Sélectionnez un gouvernorat d'abord":""}>
            {poiLoading && showFaculties ? <Loader2 size={13} className="lc__spin"/> : <PoiSvg path={FACULTY_SVG}/>}
            Facultés
            {showFaculties && !poiLoading && <span className="fp__poi-count">{liveFacultyCount}</span>}
          </button>
          <button disabled={!local.govNom} className={`fp__poi-btn fp__poi-btn--surface${showGrandSurfaces?" fp__poi-btn--on":""}`} onClick={onToggleGrandSurfaces} title={!local.govNom?"Sélectionnez un gouvernorat d'abord":""}>
            {poiLoading && showGrandSurfaces ? <Loader2 size={13} className="lc__spin"/> : <PoiSvg path={SURFACE_SVG}/>}
            Grandes surfaces
            {showGrandSurfaces && !poiLoading && <span className="fp__poi-count">{liveGrandSurfaceCount}</span>}
          </button>
          <button disabled={!local.govNom} className={`fp__poi-btn fp__poi-btn--hospital${showHospitals?" fp__poi-btn--on":""}`} onClick={onToggleHospitals} title={!local.govNom?"Sélectionnez un gouvernorat d'abord":""}>
            {poiLoading && showHospitals ? <Loader2 size={13} className="lc__spin"/> : <PoiSvg path={HOSPITAL_SVG}/>}
            Hôpitaux
            {showHospitals && !poiLoading && <span className="fp__poi-count">{liveHospitalCount}</span>}
          </button>
        </div>
        )}
      </div>

      {/* -- Filtres avancés -- */}
      {advanced && (
        <div className="fp__advanced">
          {/* Catégorie — affichée ici uniquement sur mobile */}
          <div className="fp__adv-cats">
            <label className="fp__adv-label">Catégorie</label>
            <div className="fp__pill-group fp__pill-group--mobile">
              <button
                className={`fp__pill fp__pill--tous${(local.categories||[]).length === 0 ? " fp__pill--on" : ""}`}
                onClick={() => { const updated = { ...local, categories: [] }; setLocal(updated); onChange(updated); }}
              >Tous</button>
              {["vente","location","vacances"].map(v => {
                const active = (local.categories||[]).includes(v);
                return (
                  <button key={v}
                    className={`fp__pill fp__pill--${v}${active ? " fp__pill--on" : ""}`}
                    onClick={() => {
                      const cats = local.categories||[];
                      const newCats = active ? cats.filter(c=>c!==v) : [...cats,v];
                      const updated = { ...local, categories: newCats };
                      setLocal(updated); onChange(updated);
                    }}
                  >{CAT_LBL[v]}</button>
                );
              })}
            </div>
          </div>

          {/* Localisation — affichée ici uniquement sur mobile (gain de place) */}
          <div className="fp__adv-loc">
            <label className="fp__adv-label">Localisation</label>
            <LocationCascade
              govId={local.govId} govNom={local.govNom}
              delId={local.delId} delNom={local.delNom}
              locId={local.locId} locNom={local.locNom}
              onChange={(v) => {
                const updated = { ...local, ...v, query: "" };
                setLocal(updated);
                onChange(updated);
              }}
            />
          </div>
          {/* Type de bien — filtré si vacances seulement */}
          <div className="fp__adv-group fp__adv-group--full">
            <label className="fp__adv-label">Type de bien</label>
            <select className="fp__adv-sel" value={local.type} onChange={(e) => {
              const newType = e.target.value;
              setLocal(f => ({
                ...INIT_F,
                query: f.query,
                govId: f.govId,   govNom: f.govNom,
                delId: f.delId,   delNom: f.delNom,
                locId: f.locId,   locNom: f.locNom,
                categories:   f.categories,
                filterDevise: f.filterDevise,
                type: newType,
              }));
            }}>
              <option value="">Tous</option>
              {(local.categories?.length === 1 && local.categories[0] === "vacances"
                ? ["appartement","villa_maison","immobiliers_divers"]
                : TYPES
              ).map(t=><option key={t} value={t}>{TYPE_LBL[t] || ucFirst(t)}</option>)}
            </select>
          </div>
          {/* Prix min / max avec devise inline */}
          <div className="fp__adv-group">
            <label className="fp__adv-label">Prix min</label>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              <input type="number" placeholder="0" value={local.prixMin}
                onChange={(e)=>set("prixMin",e.target.value)} className="fp__adv-inp" style={{flex:1,minWidth:0}}/>
              <select className="fp__adv-sel" style={{minWidth:"unset",width:"60px",padding:"7px 4px",flexShrink:0,cursor:"pointer"}}
                value={local.filterDevise||"TND"} onChange={e=>set("filterDevise",e.target.value)}>
                <option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Prix max</label>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              <input type="number" placeholder="∞" value={local.prixMax}
                onChange={(e)=>set("prixMax",e.target.value)} className="fp__adv-inp" style={{flex:1,minWidth:0}}/>
              <select className="fp__adv-sel" style={{minWidth:"unset",width:"60px",padding:"7px 4px",flexShrink:0,cursor:"pointer"}}
                value={local.filterDevise||"TND"} onChange={e=>set("filterDevise",e.target.value)}>
                <option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Superficie min (m²)</label>
            <input type="number" placeholder="0" value={local.superficieMin}
              onChange={(e)=>set("superficieMin",e.target.value)} className="fp__adv-inp"/>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Superficie max (m²)</label>
            <input className="fp__adv-inp" type="number" placeholder="∞" min="0"
              value={local.superficieMax || ""}
              onChange={e => set("superficieMax", e.target.value)}/>
          </div>
          {/* Nbr pièces min */}
          {!["terrain","garage_parking","depot_stockage","batiment_industriel","immeuble"].includes(local.type) && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Nbr pièces min</label>
              <select className="fp__adv-sel" value={local.piecesMin||""} onChange={e=>set("piecesMin",e.target.value)}>
                <option value="">Peu importe</option>
                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          )}
          {/* Nbr chambre min */}
          {!["terrain","garage_parking","depot_stockage","batiment_industriel","immeuble","bureau","local_commercial"].includes(local.type) && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Nbr chambre min</label>
              <select className="fp__adv-sel" value={local.chambresMin||""} onChange={e=>set("chambresMin",e.target.value)}>
                <option value="">Peu importe</option>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          )}
          {/* État du bien */}
          {!["terrain","garage_parking","depot_stockage","batiment_industriel"].includes(local.type) && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">État du bien</label>
              <select className="fp__adv-sel" value={local.etat||""} onChange={e=>set("etat",e.target.value)}>
                <option value="">Tous</option>
                <option value="nouveau">Neuf</option>
                <option value="bon_etat">Bon état</option>
                <option value="a_renover">À rénover</option>
                {!(local.categories?.length===1 && local.categories[0]==="location") && (
                  <option value="cours_construction">En construction</option>
                )}
              </select>
            </div>
          )}
          {/* ── APPARTEMENT ── */}
          {local.type === "appartement" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de logement</label>
              <select className="fp__adv-sel" value={local.type_appartement||""} onChange={e=>set("type_appartement",e.target.value)}>
                <option value="">Tous</option>
                <option value="studio">Studio</option>
                <option value="s0">S0</option>
                <option value="s+1">S+1</option>
                <option value="s+2">S+2</option>
                <option value="s+3">S+3</option>
                <option value="s+4">S+4</option>
                <option value="duplex">Duplex</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Étage du bien</label>
              <select className="fp__adv-sel" value={local.etage_min||""} onChange={e=>set("etage_min",e.target.value)}>
                <option value="">Tous</option>
                <option value="0">RDC (Rez-de-chaussée)</option>
                <option value="1">1er étage</option>
                <option value="2">2ème étage</option>
                <option value="3">3ème étage</option>
                <option value="4">4ème+</option>
              </select>
            </div>
          </>)}

          {/* ── VILLA/MAISON ── */}
          {local.type === "villa_maison" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de villa</label>
              <select className="fp__adv-sel" value={local.type_villa||""} onChange={e=>set("type_villa",e.target.value)}>
                <option value="">Tous</option>
                <option value="r">RDC (Rez-de-chaussée)</option>
                <option value="r+1">R+1</option>
                <option value="r+2">R+2</option>
                <option value="r+3">R+3</option>
                <option value="r+4">R+4</option>
              </select>
            </div>
          )}

          {/* ── IMMEUBLE ── */}
          {local.type === "immeuble" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Nbre d'appartements min</label>
              <select className="fp__adv-sel" value={local.nb_appartements_min||""} onChange={e=>set("nb_appartements_min",e.target.value)}>
                <option value="">Peu importe</option>
                {[2,4,6,8,10,15,20].map(n=><option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Hauteur de l'immeuble</label>
              <select className="fp__adv-sel" value={local.hauteur_immeuble||""} onChange={e=>set("hauteur_immeuble",e.target.value)}>
                <option value="">Toutes</option>
                {["R+1","R+2","R+3","R+4","R+5","R+6","R+7","R+8","R+9","R+10"].map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </>)}

          {/* ── TERRAIN ── */}
          {local.type === "terrain" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de terrain</label>
              <select className="fp__adv-sel" value={local.type_terrain||""} onChange={e=>{ set("type_terrain",e.target.value); set("vocation_terrain",""); }}>
                <option value="">Tous</option>
                <option value="agricole">Agricole</option>
                <option value="nu">Nu</option>
                <option value="zone_verte">Zone verte</option>
                <option value="lotissement">Lotissement</option>
                <option value="commercial">Commercial</option>
                <option value="industriel">Industriel</option>
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Vocation</label>
              <select className="fp__adv-sel" value={local.vocation_terrain||""} onChange={e=>set("vocation_terrain",e.target.value)}>
                <option value="">Toutes</option>
                {(local.type_terrain === "agricole"   ? [["agricole","Agricole"],["touristique","Touristique"],["mixte","Mixte"]]
                : local.type_terrain === "zone_verte" ? [["residentielle","Résidentielle"],["mixte","Mixte"],["touristique","Touristique"]]
                : local.type_terrain === "lotissement"? [["residentielle","Résidentielle"],["commerciale","Commerciale"],["mixte","Mixte"]]
                : local.type_terrain === "commercial" ? [["commerciale","Commerciale"],["mixte","Mixte"]]
                : local.type_terrain === "industriel" ? [["industrielle","Industrielle"],["mixte","Mixte"]]
                : [["residentielle","Résidentielle"],["commerciale","Commerciale"],["industrielle","Industrielle"],["agricole","Agricole"],["touristique","Touristique"],["mixte","Mixte"]]
                ).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </>)}

          {/* ── LOCAL COMMERCIAL ── */}
          {local.type === "local_commercial" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Étage du bien</label>
              <select className="fp__adv-sel" value={local.etage_min||""} onChange={e=>set("etage_min",e.target.value)}>
                <option value="">Tous</option>
                <option value="-1">Sous-sol</option>
                <option value="0">RDC (Rez-de-chaussée)</option>
                <option value="1">R+1</option>
                <option value="2">R+2</option>
                <option value="3">R+3</option>
                <option value="4">R+4</option>
              </select>
            </div>
          )}

          {/* ── BUREAU ── */}
          {local.type === "bureau" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de bureau</label>
              <select className="fp__adv-sel" value={local.type_bureau||""} onChange={e=>set("type_bureau",e.target.value)}>
                <option value="">Tous</option>
                {["H0","H+1","H+2","H+3","H+4","H+5","Open Space"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Étage du bien</label>
              <select className="fp__adv-sel" value={local.etage_min||""} onChange={e=>set("etage_min",e.target.value)}>
                <option value="">Tous</option>
                <option value="-1">Sous-sol</option>
                <option value="0">RDC (Rez-de-chaussée)</option>
                <option value="1">R+1</option>
                <option value="2">R+2</option>
                <option value="3">R+3</option>
                <option value="4">R+4</option>
              </select>
            </div>
          </>)}

          {/* ── GARAGE ── */}
          {local.type === "garage_parking" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Emplacement</label>
              <select className="fp__adv-sel" value={local.emplacement_garage||""} onChange={e=>set("emplacement_garage",e.target.value)}>
                <option value="">Tous</option>
                <option value="en_exterieur">En extérieur</option>
                <option value="en_sous_sol">En sous-sol</option>
              </select>
            </div>
          )}

          {/* Titre foncier — terrain seulement */}
          {local.type === "terrain" && (
            <div className="fp__adv-group fp__adv-group--full" style={{alignSelf:"flex-end",flex:"none"}}>
              <label className="fp__adv-label">Titre foncier</label>
              <label style={{
                display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8,
                background: local.titre_foncier==="1" ? "#f0fdf4" : "#fff",
                borderColor: local.titre_foncier==="1" ? "#bbf7d0" : "#e5e7eb",
                fontSize:13, fontFamily:"inherit", color:"#374151", whiteSpace:"nowrap",
              }}>
                <input type="checkbox" checked={local.titre_foncier==="1"}
                  onChange={(e)=>set("titre_foncier",e.target.checked?"1":"")}
                  style={{accentColor:"#16a34a", width:14, height:14}}/>
                Titre foncier uniquement
              </label>
            </div>
          )}
          {/* Ancienneté de publication */}
          <div className="fp__adv-group" style={{display:"flex",flexDirection:"column",gap:3}}>
            <span style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em"}}>Date publication</span>
          <select
            className="fp__adv-sel"
            value={local.anciennete||""}
            onChange={e => set("anciennete", e.target.value)}
            title="Date de publication"
            style={{minWidth:130}}
          >
            <option value="">Toutes dates</option>
            <option value="1">Aujourd'hui</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="60">60 derniers jours</option>
            <option value="90">3 derniers mois</option>
            <option value="180">6 derniers mois</option>
          </select>
          </div>

          {/* Niveau de standing � pour types résidentiels/commerciaux */}
          {["appartement","villa","villa_maison","immeuble","local_commercial","bureau"].includes(local.type) && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Standing</label>
              <select className="fp__adv-sel" value={local.standing||""} onChange={e=>set("standing",e.target.value)}>
                <option value="">Tous</option>
                <option value="economique">Économique</option>
                <option value="moyen_standing">Moyen standing</option>
                <option value="haut_standing">Haut standing</option>
              </select>
            </div>
          )}

          {/* Colocation */}
          {(local.type === "" || local.type === "appartement" || local.type === "villa" || local.type === "villa_maison") && (
            <div className="fp__adv-group fp__adv-group--full" style={{alignSelf:"flex-end",flex:"none"}}>
              <label className="fp__adv-label">Colocation</label>
              <label style={{
                display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8,
                background: local.colocation ? "#eef2ff" : "#fff",
                borderColor: local.colocation ? "#a5b4fc" : "#e5e7eb",
                fontSize:13, fontFamily:"inherit", color:"#374151", whiteSpace:"nowrap",
              }}>
                <input type="checkbox" checked={!!local.colocation}
                  onChange={e => set("colocation", e.target.checked)}
                  style={{accentColor:"#6366f1", width:14, height:14}}/>
                Colocation uniquement
              </label>
            </div>
          )}

          {/* Actions : Autres critères (gauche) + Réinitialiser (droite) — toujours même ligne, à la fin */}
          <div className="fp__adv-actions">
            {!["terrain","garage_parking","depot_stockage","batiment_industriel"].includes(local.type) && (
              <button
                className={`fp__adv-btn${(local.features||[]).length > 0 ? " fp__adv-btn--on" : ""}`}
                type="button"
                onClick={() => setShowFeatModal(true)}
              >
                Autres critères{(local.features||[]).length > 0 ? ` (${local.features.length})` : " +"}
              </button>
            )}
            <button className="fp__reset" onClick={reset}><X size={11}/> Réinitialiser</button>
          </div>

          {/* Bouton Rechercher en bas du panneau — mobile uniquement */}
          <button className="fp__adv-search-btn" onClick={applyMobile}>
            <Search size={14}/> Rechercher
          </button>
        </div>
      )}

      {/* -- Modal "Autres critères" � ic�nes comme dans la création d'annonce -- */}
      {showFeatModal && ReactDOM.createPortal(
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.60)", zIndex:999999,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"16px"
        }} onClick={e=>{ if(e.target===e.currentTarget) setShowFeatModal(false); }}>
          <div className="feat-modal" style={{
            background:"#fff", borderRadius:20, width:"100%", maxWidth:460,
            maxHeight:"88vh", overflow:"hidden", display:"flex", flexDirection:"column",
            boxShadow:"0 24px 80px rgba(0,0,0,.30)",
            fontFamily:"'Inter',system-ui,sans-serif"
          }}>
            {/* Header */}
            <div className="feat-modal__header" style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"22px 28px 18px", borderBottom:"1px solid #f1f5f9", flexShrink:0
            }}>
              <div>
                <h3 className="feat-modal__title" style={{fontSize:19,fontWeight:800,color:"#0f172a",margin:0}}>Caractéristiques</h3>
                <p className="feat-modal__sub" style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Sélectionnez les équipements souhaités</p>
              </div>
              <button onClick={()=>setShowFeatModal(false)}
                style={{width:34,height:34,borderRadius:"50%",background:"#f1f5f9",border:"none",
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>
                <X size={16}/>
              </button>
            </div>

            {/* Body scrollable */}
            <div className="feat-modal__body" style={{flex:1,overflowY:"auto",padding:"20px 28px"}}>
              {[
                { section:"Vue", items:[
                  {k:"vue_mer",     l:"Vue sur mer",    Ico:Waves       },
                  {k:"vue_montagne",l:"Vue sur montagne",   Ico:Mountain    },
                  {k:"vue_foret",   l:"Vue sur forêt",      Ico:TreePine    },
                ]},
                { section:"Espaces extérieurs", items:[
                  {k:"jardin",   l:"Jardin",   Ico:Fence        },
                  {k:"terrasse", l:"Terrasse", Ico:Sun          },
                  {k:"balcon",   l:"Balcon",   Ico:Flower2      },
                  {k:"piscine",  l:"Piscine",  Ico:Droplets     },
                  {k:"parking",  l:"Parking",  Ico:ParkingCircle},
                ]},
                { section:"Commodités", items:[
                  {k:"ascenseur",    l:"Ascenseur",       Ico:ArrowUpDown},
                  {k:"garage",       l:"Garage",          Ico:Car        },
                  {k:"cellier",      l:"Cellier",Ico:Package   },
                  {k:"meuble",       l:"Meublé",          Ico:Sofa       },
                  {k:"concierge",    l:"Concierge",       Ico:Users      },
                  {k:"gardien",      l:"Gardien",         Ico:ShieldCheck},
                  {k:"animaux_admis",l:"Animaux admis",   Ico:Heart      },
                ]},
                { section:"Intérieur & équipements", items:[
                  {k:"cuisine_equipee",  l:"Cuisine équipée",  Ico:UtensilsCrossed},
                  {k:"climatisation",    l:"Climatisation",    Ico:Wind           },
                  {k:"chauffage_centrale",l:"Chauffage central",Ico:Thermometer  },
                  {k:"cheminee",         l:"Cheminée",         Ico:Flame          },
                  {k:"double_vitrage",   l:"Double vitrage",   Ico:DoorClosed     },
                  {k:"porte_blindee",    l:"Porte blindée",    Ico:LockKeyhole    },
                  {k:"securite",         l:"Sécurité",         Ico:Fingerprint    },
                  {k:"internet",         l:"Internet",         Ico:Wifi           },
                  {k:"tv",               l:"TV",               Ico:Monitor        },
                  {k:"machine_laver",    l:"Machine à laver",  Ico:RefreshCw      },
                  {k:"digicode",         l:"Digicode",         Ico:KeyRound       },
                  {k:"interphone",       l:"Interphone",       Ico:PhoneCall      },
                ]},
              ].map(({section, items}) => (
                <div key={section} className="feat-modal__section">
                  <div className="feat-modal__section-label">{section}</div>
                  <div className="feat-modal__grid">
                    {items.map(({k, l, Ico}) => {
                      const isOn = (local.features||[]).includes(k);
                      return (
                        <button key={k} type="button" className={`feat-modal__btn${isOn?" feat-modal__btn--on":""}`}
                          onClick={() => {
                            const cur = local.features||[];
                            set("features", isOn ? cur.filter(f=>f!==k) : [...cur,k]);
                          }}
                          onMouseEnter={e=>{ if(!isOn) e.currentTarget.style.background="#f8faff"; }}
                          onMouseLeave={e=>{ if(!isOn) e.currentTarget.style.background=""; }}
                        >
                          <Ico className="feat-modal__ico" strokeWidth={1.5}/>
                          <span className="feat-modal__lbl">{l}</span>
                          {isOn && (
                            <div className="feat-modal__check">
                              <Check size={10} color="#fff" strokeWidth={3}/>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="feat-modal__footer" style={{
              display:"flex",gap:12,justifyContent:"space-between",alignItems:"center",
              padding:"16px 28px 20px",borderTop:"1px solid #f1f5f9",flexShrink:0,
              background:"#fafafa"
            }}>
              <span className="feat-modal__count" style={{fontSize:13,color:"#64748b"}}>
                {(local.features||[]).length > 0
                  ? `${local.features.length} critère${local.features.length>1?"s":""} sélectionné${local.features.length>1?"s":""}`
                  : "Aucun critère sélectionné"}
              </span>
              <div style={{display:"flex",gap:10}}>
                <button type="button"
                  onClick={() => set("features",[])}
                  className="feat-modal__clear"
                  style={{padding:"10px 18px",borderRadius:10,border:"1.5px solid #e5e7eb",
                    background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer",
                    fontSize:13,fontFamily:"inherit"}}
                >Tout effacer</button>
                <button type="button"
                  onClick={() => { onChange({...local}); setShowFeatModal(false); }}
                  className="feat-modal__apply"
                  style={{padding:"10px 22px",borderRadius:10,border:"none",
                    background:"#0f172a",color:"#fff",fontWeight:700,cursor:"pointer",
                    fontSize:13,fontFamily:"inherit",
                    boxShadow:"0 4px 14px rgba(15,23,42,.25)"}}
                >Voir les résultats</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* -------------------------------------------------------------
   PAGE PRINCIPALE
------------------------------------------------------------- */
/* --------------------------------------------------------------
   SCORE COMPOSITE � tie-breaking entre annonces de même boost
   --------------------------------------------------------------
   Critère            Poids max   Logique
   -------------------------------------------------------------
   boost_level        4 000 pts   priorité absolue (1000 � niveau)
   photos             200 pts     =5 photos = score plein
   description        100 pts     =200 car. = score plein, =50 = moitié
   titre_foncier      150 pts     confiance juridique
   fraîcheur          500 pts     500 - jours depuis publication (min 0)
   --------------------------------------------------------------
   Total max          ~4 950 pts
   Les annonces du même niveau boost sont donc d�partag�es par
   la qualité et la fraîcheur, pas aléatoirement.
-------------------------------------------------------------- */
function computeScore(p) {
  const boost   = (p.boost || 0) * 1_000_000;
  const photos  = Math.min((p.images?.length || 0), 5) * 40;
  const desc    = (p.description?.length || 0) >= 200 ? 100
                : (p.description?.length || 0) >= 50  ? 50 : 0;
  const tf      = p.titre_foncier ? 150 : 0;
  // Fraîcheur : date de refresh/modification en priorité, sinon date de création
  const refDate   = p.date_mise_a_jour || p.date_creation;
  const freshness = refDate ? new Date(refDate).getTime() : 0;
  return boost + freshness + photos + desc + tf;
}

function transformApiAnnonce(a) {
  return {
    id:            `api_${a.id}`,
    _realId:       a.id,
    titre:         a.titre,
    prix:          a.prix,
    devise:        a.devise,
    gouvernorat:   a.gouvernorat   || "",
    delegation:    a.delegation    || "",
    localite:      a.localite      || "",
    address:       a.address       || "",
    beds:          a.nb_chambres    || null,
    pieces:        a.nb_pieces      || null,
    baths:         a.nb_salles_bain || null,
    garage:        !!(a.features?.includes("garage") || a.features?.includes("parking")),
    area:          a.superficie     || 0,
    type:          a.type_bien === "maison" ? "villa_maison" : (a.type_bien || ""),
    categorie:     a.categorie,
    duree_type:       a.duree_type       || null,
    duree_valeur:     a.duree_valeur     || null,
    capacite_accueil: a.capacite_accueil || null,
    etat:             a.etat_bien          || null,
    titre_foncier:    a.titre_foncier      || false,
    type_appartement: a.type_appartement   || null,
    type_villa:       a.type_villa         || null,
    type_bureau:      a.type_bureau        || null,
    etage:            a.etage              ?? null,
    nb_appartements:  a.nb_appartements    || null,
    hauteur_immeuble: a.hauteur_immeuble   || null,
    emplacement_garage: a.emplacement_garage || null,
    boost:         a.boost_level   || 0,
    spotlight:     a.spotlight_active || false,
    description:   a.description   || "",
    date_creation:    a.date_creation    || null,
    date_mise_a_jour: a.date_mise_a_jour || null,
    lat:           (a.latitude  && a.latitude  !== 0) ? a.latitude  : null,
    lng:           (a.longitude && a.longitude !== 0) ? a.longitude : null,
    images:        (a.images || []).length > 0
      ? (a.images || []).map(img => img.startsWith("http") ? img : `${API_URL}${img}`)
      : a.image_principale
        ? [a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`]
        : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"],
    features:      a.features || [],
    colocation:    a.colocation || false,
    places_totales:  a.places_totales  || null,
    places_occupees: a.places_occupees || null,
    profil_coloc:    a.profil_coloc    || null,
    isReal: true,
  };
}

/* Mapping clé filtre ? label feature (pour le filtre "Autres critères") */
const FEAT_KEY_TO_LABEL = {
  jardin:"Jardin", terrasse:"Terrasse", balcon:"Balcon", parking:"Parking",
  garage:"Garage", ascenseur:"Ascenseur", vue_mer:"Vue sur mer",
  vue_montagne:"Vue sur montagne", vue_foret:"Vue sur forêt", piscine:"Piscine",
  concierge:"Concierge", cellier:"Chambre rangement", meuble:"Meublé",
  gardien:"Gardien", animaux_admis:"Animaux admis",
  cuisine_equipee:"Cuisine équipée", climatisation:"Climatisation",
  chauffage_centrale:"Chauffage central", cheminee:"Cheminée",
  double_vitrage:"Double vitrage", porte_blindee:"Porte blindée",
  securite:"Sécurité", internet:"Internet", tv:"TV",
  machine_laver:"Machine à laver", digicode:"Digicode", interphone:"Interphone",
  salon_americain:"Salon am�ricain", relie_onas:"Reli� ONAS",
  fibre_optique:"Fibre optique",
};

/* --- Popup comparateur (s'affiche quand on ajoute un bien) --- */
function ComparePopup({ onClose }) {
  const navigate = useNavigate();
  const meta = useCompareMeta();
  const ids = meta.map(m => String(m.id));

  const catColors = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
  const catLabels = { vente:"Achat", location:"Location", vacances:"Vacances" };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"rgba(15,23,42,0.6)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"20px", animation:"fadeIn .2s ease",
    }} onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:20, maxWidth:560, width:"100%",
        padding:"32px 28px", boxShadow:"0 30px 80px rgba(0,0,0,.25)",
        position:"relative", fontFamily:"'Inter',system-ui,sans-serif",
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position:"absolute", top:14, right:14,
          background:"#f1f5f9", border:"none", borderRadius:"50%",
          width:32, height:32, cursor:"pointer", color:"#64748b",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, fontWeight:400, lineHeight:1,
        }}>×</button>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <Logo variant="color" height={32} to={null} />
          <div>
            <div style={{fontSize:17,fontWeight:800,color:"#0f172a"}}>Sélection pour comparaison</div>
            <div style={{fontSize:12.5,color:"#94a3b8"}}>{ids.length} bien{ids.length>1?"s":""} sélectionné{ids.length>1?"s":""} � max 4</div>
          </div>
        </div>

        <div style={{height:1,background:"#f1f5f9",margin:"20px 0"}}/>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24,maxHeight:320,overflowY:"auto"}}>
          {meta.map((d) => {
            const id = String(d.id);
            const catColor = catColors[d.categorie] || "#4f46e5";
            const location = d.delegation || d.gouvernorat || "";
            return (
              <div key={id} style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"13px 14px", borderRadius:12,
                background:"#f8fafc", border:"1.5px solid #e5e7eb",
                position:"relative",
              }}>
                <div style={{
                  width:10, height:10, borderRadius:"50%", flexShrink:0,
                  background:catColor, boxShadow:`0 0 0 3px ${catColor}22`,
                }}/>
                {d.image ? (
                  <img src={d.image} style={{
                    width:60, height:46, objectFit:"cover",
                    borderRadius:8, flexShrink:0, background:"#e5e7eb",
                  }} onError={e => { e.target.style.display="none"; }} />
                ) : (
                  <div style={{width:60,height:46,borderRadius:8,background:"#e5e7eb",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>??</div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {d.titre || `Annonce #${id}`}
                  </div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                    {location && <span style={{display:"inline-flex",alignItems:"center",gap:3}}><MapPin size={11} strokeWidth={2} style={{color:"#94a3b8",flexShrink:0}}/>{location}</span>}
                    {d.prix && (
                      <span style={{fontWeight:700,color:catColor}}>
                        {Number(d.prix).toLocaleString("fr-TN")} {fmtDevise(d.devise)}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => removeFromCompareStore(id)} style={{
                  background:"none", border:"1.5px solid #e5e7eb", borderRadius:"50%",
                  width:28, height:28, cursor:"pointer", color:"#94a3b8",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16, flexShrink:0, transition:"all .15s",
                }}>×</button>
              </div>
            );
          })}
        </div>

        {ids.length === 0 ? (
          <div style={{textAlign:"center",color:"#94a3b8",fontSize:14,paddingBottom:8}}>
            Sélectionnez des biens depuis la carte pour les comparer.
          </div>
        ) : (
          <div style={{display:"flex",gap:12}}>
            <button onClick={onClose} style={{
              flex:1, padding:"12px", borderRadius:10,
              border:"1.5px solid #e5e7eb", background:"#f8fafc",
              color:"#374151", fontWeight:700, cursor:"pointer",
              fontSize:14, fontFamily:"inherit",
            }}>
              Annuler
            </button>
            <button onClick={() => { onClose(); navigate(`/comparateur?ids=${ids.join(",")}`); }} style={{
              flex:2, padding:"12px", borderRadius:10,
              border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
              color:"#fff", fontWeight:700, cursor:"pointer",
              fontSize:14, fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              Aller au comparateur ?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Hover card avec carousel (pin simple au clic) --- */
function HoverCard({ pin, sharedHoverTimer, onOpen, onLeave }) {
  const images = (pin.images && pin.images.length > 0) ? pin.images : [];
  const [idx,     setIdx]    = useState(0);
  const [prevIdx, setPrevIdx]= useState(null);
  const [dir,     setDir]    = useState(1);
  const [sliding, setSliding]= useState(false);

  const realId = pin._realId || pin.id?.toString().replace("api_","");
  const [isFav, setIsFav] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_favs")||"[]").some(id => String(id) === String(realId)); }
    catch { return false; }
  });
  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = `/login?redirect=/carte`; return; }
    const wasOn = isFav;
    setIsFav(!wasOn);
    try {
      const res = await fetch(`${API_URL}/users/me/favoris/${realId}`, {
        method: wasOn ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const favs = JSON.parse(localStorage.getItem("localizi_favs")||"[]");
        const updated = wasOn ? favs.filter(id => String(id) !== String(realId)) : [...favs, realId];
        localStorage.setItem("localizi_favs", JSON.stringify(updated));
      } else { setIsFav(wasOn); }
    } catch { setIsFav(wasOn); }
  };

  /* Auto-fermeture après 10 s d'inactivité */
  const autoCloseTimer = React.useRef(null);
  const resetTimer = React.useCallback(() => {
    clearTimeout(autoCloseTimer.current);
    autoCloseTimer.current = setTimeout(() => onLeave(), 10000);
  }, [onLeave]);
  React.useEffect(() => {
    resetTimer();
    return () => clearTimeout(autoCloseTimer.current);
  }, [resetTimer]);

  const go = (e, delta) => {
    e.stopPropagation();
    resetTimer();
    if (sliding || images.length < 2) return;
    const next = (idx + delta + images.length) % images.length;
    setDir(delta); setPrevIdx(idx); setIdx(next); setSliding(true);
    setTimeout(() => { setPrevIdx(null); setSliding(false); }, 380);
  };

  const mapEl = document.querySelector(".leaflet-container");
  const mapW  = mapEl?.clientWidth  || 800;
  const mapH  = mapEl?.clientHeight || 600;
  const cardW = 320;
  const cardH = 280;
  const px = pin._px || 20;
  const py = pin._py || 100;
  const left = (px + 18 + cardW > mapW - 8) ? Math.max(px - cardW - 14, 8) : px + 18;
  const top  = Math.min(Math.max(py - 80, 8), mapH - cardH - 8);

  const catBg = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
  const bg    = catBg[pin.categorie] || "#6366f1";

  return (
    <div
      style={{
        position:"absolute", left, top, width:cardW, zIndex:9100,
        pointerEvents:"auto", cursor:"pointer",
        background:"#fff", borderRadius:12, overflow:"hidden",
        boxShadow:"0 8px 32px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.12)",
        animation:"hoverFadeIn .12s ease", border:"1.5px solid #e2e8f0",
      }}
      onClick={() => onOpen(pin.id.toString().replace("api_",""))}
      onMouseEnter={resetTimer}
      onMouseLeave={() => onLeave()}
    >
      {/* Carousel image */}
      <div style={{position:"relative", height:160, overflow:"hidden", isolation:"isolate", background:"#f1f5f9"}}>
        {images.length === 0 ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:48,color:"#cbd5e1"}}>🏠</div>
        ) : (
          <>
            {prevIdx !== null && (
              <img src={images[prevIdx]} alt="" style={{
                position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
                animation:`carouselOut${dir>0?"L":"R"} .38s cubic-bezier(.4,0,.2,1) forwards`, zIndex:1,
              }}/>
            )}
            <img key={idx} src={images[idx]} alt="" style={{
              position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
              animation: prevIdx !== null ? `carouselIn${dir>0?"L":"R"} .38s cubic-bezier(.4,0,.2,1) forwards` : "none",
              zIndex:2,
            }} onError={e=>{ e.currentTarget.style.display="none"; }}/>
          </>
        )}
        {/* Cœur favoris */}
        <button
          onClick={toggleFav}
          style={{position:"absolute",top:7,right:7,zIndex:6,width:28,height:28,borderRadius:"50%",
            background:"rgba(255,255,255,.85)",backdropFilter:"blur(4px)",
            border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}
        >
          <Heart size={13} fill={isFav?"#ef4444":"none"} color={isFav?"#ef4444":"#374151"}/>
        </button>
        {/* Badge catégorie */}
        {(pin.categorie === "location" || pin.categorie === "vacances") && (
          <span style={{position:"absolute",top:8,left:8,zIndex:5,background:bg,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>
            {pin.categorie === "location" ? "Location" : "Vacances"}
          </span>
        )}
        {pin.colocation && (
          <span style={{position:"absolute",top:36,left:8,zIndex:5,background:"rgba(99,102,241,.9)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,display:"flex",alignItems:"center",gap:3}}>
            <Users size={9}/> Colocation
          </span>
        )}
        {/* Flèches */}
        {images.length > 1 && <>
          <button onClick={e=>go(e,-1)} style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,.42)",backdropFilter:"blur(4px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",zIndex:4}}>
            <ChevronLeft size={12}/>
          </button>
          <button onClick={e=>go(e,+1)} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,.42)",backdropFilter:"blur(4px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",zIndex:4}}>
            <ChevronRight size={12}/>
          </button>
          <div style={{position:"absolute",bottom:5,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:4}}>
            {images.map((_,i)=><span key={i} onClick={e=>{e.stopPropagation();if(!sliding&&i!==idx){setDir(i>idx?1:-1);setPrevIdx(idx);setIdx(i);setSliding(true);setTimeout(()=>{setPrevIdx(null);setSliding(false);},380);}}} style={{width:5,height:5,borderRadius:"50%",cursor:"pointer",background:i===idx?"#fff":"rgba(255,255,255,.45)"}}/>)}
          </div>
        </>}
      </div>
      {/* Corps */}
      <div style={{padding:"11px 14px 12px"}}>
        <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 4px",lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pin.titre}</p>
        <p style={{fontSize:19,fontWeight:900,color:"#0f172a",margin:"0 0 7px",letterSpacing:"-.01em"}}>
          {(pin.prix||0).toLocaleString("fr-TN")}
          <span style={{fontSize:12,fontWeight:400,color:"#94a3b8",marginLeft:4}}>{fmtDevise(pin.devise)}</span>
        </p>
        <div style={{display:"flex",gap:10,fontSize:11.5,color:"#64748b",flexWrap:"wrap",marginBottom:2}}>
          {pin.area  && <span style={{display:"flex",alignItems:"center",gap:3}}><Maximize size={10}/> {pin.area} m²</span>}
          {pin.beds  != null && <span style={{display:"flex",alignItems:"center",gap:3}}><Bed size={10}/> {pin.beds} ch.</span>}
          {pin.baths != null && <span style={{display:"flex",alignItems:"center",gap:3}}><Bath size={10}/> {pin.baths} sdb</span>}
        </div>
        {pin.delegation && (
          <p style={{fontSize:10.5,color:"#94a3b8",margin:"5px 0 0",display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            <MapPin size={9} style={{flexShrink:0}}/> {pin.delegation}{pin.gouvernorat ? ` · ${pin.gouvernorat}` : ""}
          </p>
        )}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:8,paddingTop:7,borderTop:"1px solid #f1f5f9",fontSize:12,fontWeight:800,color:bg}}>
          Voir détails <ChevronRight size={13}/>
        </div>
      </div>
    </div>
  );
}

/* --- Bandeau comparateur flottant --- */
function CompareBar() {
  const navigate = useNavigate();
  const meta = useCompareMeta();
  const ids = meta.map(m => String(m.id));
  if (ids.length === 0) return null;
  return (
    <div style={{
      background:"#0f172a", color:"#fff",
      display:"inline-flex", alignItems:"center", gap:12,
      padding:"6px 16px", borderRadius:12,
      boxShadow:"0 2px 12px rgba(0,0,0,.3)",
      fontFamily:"'Inter',system-ui,sans-serif", fontSize:13,
      whiteSpace:"nowrap", flexShrink:0,
    }}>
      <span style={{fontWeight:700}}>{ids.length} bien{ids.length>1?"s":""} sélectionné{ids.length>1?"s":""}</span>
      <button onClick={() => navigate(`/comparateur?ids=${ids.join(",")}`)}
        style={{
          padding:"5px 14px", borderRadius:8, border:"none",
          background:"#6366f1", color:"#fff", fontWeight:700, cursor:"pointer",
          fontSize:12, fontFamily:"inherit",
        }}>
        Comparer ?
      </button>
      <button onClick={clearCompareStore}
        style={{
          padding:"5px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,.2)",
          background:"transparent", color:"rgba(255,255,255,.7)", fontWeight:600,
          cursor:"pointer", fontSize:11, fontFamily:"inherit",
        }}>
        Vider
      </button>
    </div>
  );
}

/* ─── Popup Comparateur inline (sans navigation) ─── */
function ComparateurPopup({ onClose }) {
  const ids = getCompareIds();
  const [annonces, setAnnonces] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    Promise.all(ids.map(id =>
      fetch(`${API_URL}/annonces/${id}/detail`).then(r => r.ok ? r.json() : null).catch(() => null)
    )).then(res => { setAnnonces(res.filter(Boolean)); setLoading(false); });
  }, []); // eslint-disable-line

  function removeOne(id) {
    const newCount = removeFromCompareStore(id);
    setAnnonces(prev => prev.filter(a => String(a.id) !== String(id)));
    if (newCount === 0) onClose();
  }

  const ROWS = [
    { label:"Prix",        key:"prix" },
    { label:"Superficie",  key:"superficie" },
    { label:"Chambres",    key:"nb_chambres" },
    { label:"Salles de bain", key:"nb_salles_bain" },
    { label:"Pièces",      key:"nb_pieces" },
    { label:"Étage",       key:"etage" },
    { label:"État",        key:"etat" },
    { label:"Gouvernorat", key:"gouvernorat" },
    { label:"Délégation",  key:"delegation" },
  ];
  const val = (a, k) => {
    const v = a[k] ?? a.caractere_general?.[k] ?? a.caracteristique_interieure?.[k];
    if (v == null || v === "") return "—";
    if (k === "prix") return `${Number(v).toLocaleString("fr-TN")} ${a.devise || "TND"}`;
    if (k === "superficie") return `${v} m²`;
    return String(v);
  };

  return ReactDOM.createPortal(
    <div style={{position:"fixed",inset:0,background:"rgba(10,12,20,.65)",zIndex:99990,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0"}}
      onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:900,
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 -12px 50px rgba(0,0,0,.25)", overflow:"hidden",
      }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          <GitCompare size={18} color="#6366f1"/>
          <span style={{fontWeight:800,fontSize:16,color:"#0f172a",flex:1}}>Comparateur</span>
          <span style={{fontSize:13,color:"#64748b",fontWeight:500}}>{annonces.length} annonce{annonces.length!==1?"s":""}</span>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600,fontSize:13,color:"#475569"}}>
            <X size={14}/> Fermer
          </button>
        </div>

        {/* Corps */}
        <div style={{overflowY:"auto",flex:1,padding:"16px 20px 24px"}}>
          {loading ? (
            <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Chargement…</div>
          ) : annonces.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Aucune annonce à comparer.</div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:annonces.length*220}}>
                <thead>
                  <tr>
                    <th style={{textAlign:"left",padding:"10px 14px",borderBottom:"2px solid #f1f5f9",color:"#94a3b8",fontSize:12,fontWeight:700,width:110}}>Critère</th>
                    {annonces.map(a => (
                      <th key={a.id} style={{padding:"10px 14px",borderBottom:"2px solid #f1f5f9",minWidth:200,verticalAlign:"top"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:6}}>
                          <Link to={`/carte?annonce=${a.id}`} onClick={onClose}
                            style={{fontWeight:700,color:"#0f172a",fontSize:13,textDecoration:"none",lineHeight:1.3}}>
                            {a.titre||`Annonce #${a.id}`}
                          </Link>
                          <button onClick={()=>removeOne(a.id)} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:4,cursor:"pointer",color:"#dc2626",flexShrink:0}}>
                            <X size={12}/>
                          </button>
                        </div>
                        {(a.image_principale||a.image) && (
                          <img src={(a.image_principale||a.image).startsWith("http")?(a.image_principale||a.image):`${API_URL}${a.image_principale||a.image}`}
                            alt="" style={{width:"100%",height:100,objectFit:"cover",borderRadius:8}}/>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.key} style={{background: i%2===0?"#f8fafc":"#fff"}}>
                      <td style={{padding:"9px 14px",fontSize:12,fontWeight:700,color:"#64748b",whiteSpace:"nowrap"}}>{row.label}</td>
                      {annonces.map(a => {
                        const v = val(a, row.key);
                        return <td key={a.id} style={{padding:"9px 14px",fontSize:13,color: v==="—"?"#cbd5e1":"#0f172a",fontWeight: v==="—"?400:600,textAlign:"center"}}>{v}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CartePage() {
  const navigate                   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive]         = useState(null);
  const [apiProperties, setApiProps] = useState([]);
  const [totalCount,    setTotalCount] = useState(null);
  const [mapBounds, setMapBounds]   = useState(null);
  /* Ref toujours synchronis� avec allProperties (utilisé dans applyFilters) */
  const allPropertiesRef = useRef([]);
  /* Liste complète des gouvernorats — pour la détection même sans annonces chargées */
  const { gouvernorats: _allGovs } = useLocalisation({ gouvernorat:"", delegation:"", localite:"" });
  const govListRef = useRef([]);
  govListRef.current = _allGovs;

  /* -- Lecture URL ? objet filtre (source de v�rit� unique) -- */
  const readFiltersFromUrl = useCallback((sp) => ({
    categories:    (sp.get("categories") || sp.get("categorie") || "")
                     .split(",").map(s => s.trim()).filter(Boolean),
    query:         sp.get("q")           || "",
    type:          sp.get("type")        || "",
    govNom:        sp.get("gouvernorat") || "",
    delNom:        sp.get("delegation")  || "",
    locNom:        sp.get("localite")    || "",
    govId:         sp.get("govId")       || "",
    delId:         sp.get("delId")       || "",
    locId:         sp.get("locId")       || "",
    filterDevise:  sp.get("devise") || "TND",
    prixMin:       sp.get("prixMin")     || "",
    prixMax:       sp.get("prixMax")     || "",
    superficieMin: sp.get("sMin")        || "",
    superficieMax: sp.get("sMax")        || "",
    bedsMin:       sp.get("beds")        || "",
    piecesMin:     sp.get("pMin")        || "",
    chambresMin:   sp.get("cMin")        || "",
    etat:          sp.get("etat")        || "",
    titre_foncier: sp.get("tf")          || "",
    features:      (sp.get("feat") || "").split(",").map(s=>s.trim()).filter(Boolean),
    type_terrain:    sp.get("tterrain")   || "",
    vocation_terrain:sp.get("vterrain")   || "",
    standing:        sp.get("standing")   || "",
    anciennete:      sp.get("anciennete") || "",
    etage_min:       sp.get("etage_min")  || "",
    type_appartement:sp.get("type_appt")  || "",
    colocation:      sp.get("colocation") === "1",
  }), []);

  /* -- �tat initial : URL d'abord, sessionStorage en fallback -- */
  const [filters, setFilters] = useState(() => {
    const fromUrl = readFiltersFromUrl(searchParams);
    const hasUrlFilters = Object.values(fromUrl).some(v =>
      Array.isArray(v) ? v.length > 0 : v !== ""
    );
    if (hasUrlFilters) return { ...INIT_F, ...fromUrl };
    /* Pas de params URL ? restaurer depuis sessionStorage (retour depuis détail) */
    try {
      const saved = JSON.parse(sessionStorage.getItem("localizi_carte_filters"));
      if (saved) return { ...INIT_F, ...saved };
    } catch {}
    return { ...INIT_F };
  });

  /* Liste des délégations du gouvernorat actif — mise à jour dès que govId change */
  const delListRef = useRef([]);
  useEffect(() => {
    if (!filters.govId) { delListRef.current = []; return; }
    getDelegations(filters.govId)
      .then(r => { if (Array.isArray(r.data)) delListRef.current = r.data.map(d => ({ id: String(d.id||d.value||""), nom: d.nom||d.name||"" })); })
      .catch(() => {});
  }, [filters.govId]);

  /* -- Sync URL params ? filters (navigation externe / retour navigateur) -- */
  useEffect(() => {
    setFilters({ ...INIT_F, ...readFiltersFromUrl(searchParams) });
    setListPage(1); // reset pagination on filter change
  }, [searchParams, readFiltersFromUrl]);

  /* -- Sauvegarde sessionStorage (restauration au retour depuis le détail) -- */
  useEffect(() => {
    sessionStorage.setItem("localizi_carte_filters", JSON.stringify(filters));
  }, [filters]);

  /* -- écriture URL ? ALL filtres sérialis�s --
     D�tection de localisation dans le texte saisi (synchrone, sur les données charg�es). */
  const handleSaveSearch = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaveModalLoading(true);
    try {
      const nom = (saveModalName || "").trim() || "Ma recherche";
      const res = await fetch(`${API_URL}/users/me/saved-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nom, criteres: filters, email_alert: true }),
      });
      if (res.ok) { setSaveModalSuccess(true); }
      else { setSaveModalSuccess(false); setShowSaveModal(false); }
    } catch { setShowSaveModal(false); }
    finally { setSaveModalLoading(false); }
  };

  const applyFilters = useCallback((newFilters) => {
    let f = { ...newFilters };
    const q = (f.query || "").trim();

    if (q) {
      /* Dans CartePage, la recherche texte = filtre libre sur titre + adresse uniquement.
         La détection de hiérarchie est faite en amont (page d'accueil via /localisation/search). */
      f = { ...f, query: q };
    }

    setFilters(f);
    const sp = new URLSearchParams();
    const cats = f.categories || [];
    if (cats.length > 0)    sp.set("categories",  cats.join(","));
    if (f.query)            sp.set("q",           f.query);
    if (f.type)             sp.set("type",        f.type);
    if (f.govNom)           sp.set("gouvernorat", f.govNom);
    if (f.delNom)           sp.set("delegation",  f.delNom);
    if (f.locNom)           sp.set("localite",    f.locNom);
    if (f.govId)            sp.set("govId",       f.govId);
    if (f.delId)            sp.set("delId",       f.delId);
    if (f.locId)            sp.set("locId",       f.locId);
    if (f.filterDevise && f.filterDevise !== "TND") sp.set("devise", f.filterDevise);
    if (f.prixMin)          sp.set("prixMin",     f.prixMin);
    if (f.prixMax)          sp.set("prixMax",     f.prixMax);
    if (f.superficieMin)    sp.set("sMin",        f.superficieMin);
    if (f.superficieMax)    sp.set("sMax",        f.superficieMax);
    if (f.bedsMin)          sp.set("beds",        f.bedsMin);
    if (f.piecesMin)        sp.set("pMin",        f.piecesMin);
    if (f.chambresMin)      sp.set("cMin",        f.chambresMin);
    if (f.etat)             sp.set("etat",        f.etat);
    if (f.titre_foncier)    sp.set("tf",          f.titre_foncier);
    if (f.type_terrain)     sp.set("tterrain", f.type_terrain);
    if (f.vocation_terrain) sp.set("vterrain", f.vocation_terrain);
    if (f.features && f.features.length > 0) sp.set("feat", f.features.join(","));
    if (f.standing)          sp.set("standing",       f.standing);
    if (f.anciennete)        sp.set("anciennete",     f.anciennete);
    if (f.etage_min)         sp.set("etage_min",      f.etage_min);
    if (f.type_appartement)  sp.set("type_appt",      f.type_appartement);
    if (f.colocation)        sp.set("colocation",     "1");
    /* setSearchParams déclenche le useEffect ci-dessus qui met à jour filters */
    setSearchParams(sp, { replace: true });
  }, [setSearchParams]);

  const _savedPOI     = (() => { try { return JSON.parse(sessionStorage.getItem("localizi_carte_poi")  || "null"); } catch { return null; } })();
  const [savedMapView] = useState(() => { try { return JSON.parse(sessionStorage.getItem("localizi_carte_view") || "null"); } catch { return null; } });
  const [drawMode,         setDrawMode]         = useState(false);
  const [drawnZones,       setDrawnZones]       = useState(() => { try { return JSON.parse(sessionStorage.getItem("localizi_carte_zones") || "null") || []; } catch { return []; } });
  const [eraseMode,        setEraseMode]        = useState(false);
  const [eraseSelectedIdx, setEraseSelectedIdx] = useState(null);
  const [modalId,          setModalId]          = useState(() => searchParams.get("annonce") || null);
  useEffect(() => { window.__openAnnonceModal = (id) => setModalId(id); return () => { delete window.__openAnnonceModal; }; }, []);
  /* Ouvrir le modal depuis l'URL ?annonce=ID (lien email alerte) */
  useEffect(() => {
    const id = searchParams.get("annonce");
    if (id) { setModalId(id); }
  }, []);
  const [showSaveModal,    setShowSaveModal]    = useState(false);
  const [saveModalName,    setSaveModalName]    = useState("Ma recherche");
  const [saveModalLoading, setSaveModalLoading] = useState(false);
  const [saveModalSuccess, setSaveModalSuccess] = useState(false);
  const [saveFilterAlert,  setSaveFilterAlert]  = useState(false);
  const [showMinFiltersModal, setShowMinFiltersModal] = useState(false);
  const [showFiltersSummary,  setShowFiltersSummary]  = useState(false);
  const filterSumBtnRef = useRef(null);
  const [showSchools,      setShowSchools]      = useState(_savedPOI?.showSchools      ?? false);
  const [showMosques,      setShowMosques]      = useState(_savedPOI?.showMosques      ?? false);
  const [showFaculties,    setShowFaculties]    = useState(_savedPOI?.showFaculties    ?? false);
  const [showGrandSurfaces,setShowGrandSurfaces]= useState(_savedPOI?.showGrandSurfaces ?? false);
  const [showHospitals,    setShowHospitals]    = useState(_savedPOI?.showHospitals    ?? false);
  const [listMode,         setListMode]         = useState(() => searchParams.get("vue") === "liste" || sessionStorage.getItem("localizi_carte_listmode") === "1");
  const [sortPrice,        setSortPrice]        = useState(null); // null | "asc" | "desc"
  const [sortField,    setSortField]    = useState(() => { try { return sessionStorage.getItem("lz_carte_sortfield") || null; } catch { return null; } });
  const [sortDir,      setSortDir]      = useState(() => { try { return sessionStorage.getItem("lz_carte_sortdir")  || "asc"; } catch { return "asc"; } });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortBtnRef = useRef(null);
  const compareCount = useCompareCount();
  const [showCompareMenu, setShowCompareMenu] = useState(false);
  const [showComparePop,  setShowComparePop]  = useState(false);
  const compareBtnRef = useRef(null);
  const [listPage,         setListPage]         = useState(1);
  const [listLoading,      setListLoading]      = useState(false);
  /* Mobile draggable filter panel */
  const [mobileFilterH,    setMobileFilterH]    = useState(null); // null = auto
  const dragState = useRef({ dragging: false, startY: 0, startH: 0 });
  const stickyBarRef = useRef(null);

  /* Drag handle — document-level listeners so the finger can move anywhere */
  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current.dragging) return;
      e.preventDefault();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dy = clientY - dragState.current.startY;
      const newH = Math.max(52, Math.min(window.innerHeight * 0.78, dragState.current.startH + dy));
      setMobileFilterH(newH);
    };
    const onEnd = () => { dragState.current.dragging = false; };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend',  onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onEnd);
    };
  }, []);
  const PAGE_SIZE = 30;
  const [livePOIs,         setLivePOIs]         = useState({ schools: [], mosques: [], faculties: [], grandSurfaces: [], hospitals: [], loading: false, fetched: false });
  const [hoveredPin,       setHoveredPin]       = useState(null);
  /* Timer partag� : PropertyMap (mouseleave pin) ET hover card (onMouseEnter) l'utilisent */
  const sharedHoverTimer = useRef(null);
  const leafletMapRef    = useRef(null);
  /* Basculer vers vue carte via événement custom (bouton Map de la Navbar) */
  React.useEffect(() => {
    const h = () => setListMode(false);
    window.addEventListener("localizi-switch-to-carte", h);
    return () => window.removeEventListener("localizi-switch-to-carte", h);
  }, []);

  /* -- Fetch POIs depuis Overpass (bbox visible de la carte) -- */
  const fetchPOIs = useCallback(async (bbox) => {
    if (!bbox) return;
    setLivePOIs(prev => ({ ...prev, loading: true }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s max

    try {
      const query =
        `[out:json][timeout:18];\n` +
        `(\n` +
        `  node["amenity"="school"](${bbox});\n` +
        `  way["amenity"="school"](${bbox});\n` +
        `  node["amenity"="place_of_worship"]["religion"="muslim"](${bbox});\n` +
        `  way["amenity"="place_of_worship"]["religion"="muslim"](${bbox});\n` +
        `  node["amenity"="university"](${bbox});\n` +
        `  way["amenity"="university"](${bbox});\n` +
        `  node["amenity"="college"](${bbox});\n` +
        `  way["amenity"="college"](${bbox});\n` +
        `  node["shop"~"supermarket|mall|department_store"](${bbox});\n` +
        `  way["shop"~"supermarket|mall|department_store"](${bbox});\n` +
        `  node["amenity"~"hospital|clinic"](${bbox});\n` +
        `  way["amenity"~"hospital|clinic"](${bbox});\n` +
        `);\nout center;`;

      const ovRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: query, signal: controller.signal,
      });
      const ovData = await ovRes.json();
      const elements = ovData.elements || [];

      const toPoint = e => ({
        lat: e.type === "way" ? e.center?.lat : e.lat,
        lng: e.type === "way" ? e.center?.lon : e.lon,
      });

      const schools = elements
        .filter(e => e.tags?.amenity === "school")
        .map(e => ({ id:`ov_sc_${e.id}`, nom: e.tags?.name || "École", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      const mosques = elements
        .filter(e => e.tags?.amenity === "place_of_worship" && e.tags?.religion === "muslim")
        .map(e => ({ id:`ov_mo_${e.id}`, nom: e.tags?.name || "Mosquée", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      const faculties = elements
        .filter(e => e.tags?.amenity === "university" || e.tags?.amenity === "college")
        .map(e => ({ id:`ov_fac_${e.id}`, nom: e.tags?.name || "Faculté", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      const grandSurfaces = elements
        .filter(e => e.tags?.shop && /supermarket|mall|department_store/.test(e.tags.shop))
        .map(e => ({ id:`ov_gs_${e.id}`, nom: e.tags?.name || "Grande surface", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      const hospitals = elements
        .filter(e => e.tags?.amenity === "hospital" || e.tags?.amenity === "clinic")
        .map(e => ({ id:`ov_ho_${e.id}`, nom: e.tags?.name || "Hôpital", ...toPoint(e) }))
        .filter(e => e.lat && e.lng);

      setLivePOIs({ schools, mosques, faculties, grandSurfaces, hospitals, loading: false, fetched: true });
    } catch {
      setLivePOIs(prev => ({ ...prev, loading: false, fetched: true }));
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  /* Ref vers la bbox courante de la carte (mis à jour à chaque zoom/pan) */
  const mapBboxRef = useRef(null);

  /* Conversion Leaflet bounds ? string bbox Overpass */
  const boundsToOverpassBbox = useCallback((bounds) => {
    if (!bounds || !bounds.getSouth) return null;
    return `${bounds.getSouth().toFixed(6)},${bounds.getWest().toFixed(6)},${bounds.getNorth().toFixed(6)},${bounds.getEast().toFixed(6)}`;
  }, []);

  /* -- Re-fetch quand la bbox change ET qu'au moins un bouton est actif -- */
  useEffect(() => {
    if (!mapBounds) return;
    const newBbox = boundsToOverpassBbox(mapBounds);
    mapBboxRef.current = newBbox;
    const anyActive = showSchools || showMosques || showFaculties || showGrandSurfaces || showHospitals;
    if (!anyActive) return;
    /* Réinitialise fetched pour forcer un nouveau fetch sur la nouvelle zone */
    setLivePOIs(prev => ({ ...prev, fetched: false }));
    const timer = setTimeout(() => {
      if (mapBboxRef.current) fetchPOIs(mapBboxRef.current);
    }, 600);
    return () => clearTimeout(timer);
  }, [mapBounds]); // eslint-disable-line

  const livePOIsRef = useRef({ schools:[], mosques:[], faculties:[], grandSurfaces:[] });
  livePOIsRef.current = livePOIs;

  const handleTogglePOI = useCallback((type, currentState) => {
    const next = !currentState;

    /* -- D�sactiver : juste masquer les marqueurs, PAS de re-fetch -- */
    if (!next) {
      if (type === "schools")       setShowSchools(false);
      if (type === "mosques")       setShowMosques(false);
      if (type === "faculties")     setShowFaculties(false);
      if (type === "grandSurfaces") setShowGrandSurfaces(false);
      if (type === "hospitals")     setShowHospitals(false);
      return;
    }

    /* -- Activer : afficher + fetch seulement si pas encore de données -- */
    if (type === "schools")       setShowSchools(true);
    if (type === "mosques")       setShowMosques(true);
    if (type === "faculties")     setShowFaculties(true);
    if (type === "grandSurfaces") setShowGrandSurfaces(true);
    if (type === "hospitals")     setShowHospitals(true);

    const current = livePOIsRef.current;
    /* Fetch uniquement si pas encore charg� ET pas en cours de chargement */
    if (!current.fetched && !current.loading) {
      if (mapBboxRef.current) {
        fetchPOIs(mapBboxRef.current);
      } else {
        /* Attendre que la carte émette ses bounds (max 1.5s) */
        const waitForBbox = setInterval(() => {
          if (mapBboxRef.current) {
            clearInterval(waitForBbox);
            fetchPOIs(mapBboxRef.current);
          }
        }, 200);
        setTimeout(() => clearInterval(waitForBbox), 1500);
      }
    }
    /* Si déjà fetch� ? les effets de dessin affichent les données (même vides = compteur 0) */
  }, [fetchPOIs]);

  /* Persist POI state to sessionStorage */
  useEffect(() => {
    sessionStorage.setItem("localizi_carte_poi", JSON.stringify({ showSchools, showMosques, showFaculties, showGrandSurfaces, showHospitals }));
  }, [showSchools, showMosques, showFaculties, showGrandSurfaces, showHospitals]);

  /* Persist drawn zones to sessionStorage */
  useEffect(() => {
    sessionStorage.setItem("localizi_carte_zones", JSON.stringify(drawnZones));
  }, [drawnZones]);

  /* Persist list/map mode to sessionStorage */
  useEffect(() => {
    sessionStorage.setItem("localizi_carte_listmode", listMode ? "1" : "0");
  }, [listMode]);

  /* Persist sort */
  useEffect(() => {
    try {
      if (sortField) { sessionStorage.setItem("lz_carte_sortfield", sortField); sessionStorage.setItem("lz_carte_sortdir", sortDir); }
      else { sessionStorage.removeItem("lz_carte_sortfield"); }
    } catch {}
  }, [sortField, sortDir]);

  /* Re-render map when switching from list → map (container was hidden, size was 0) */
  useEffect(() => {
    if (!listMode && leafletMapRef.current) {
      setTimeout(() => { try { leafletMapRef.current?.invalidateSize(); } catch {} }, 150);
    }
  }, [listMode]); // eslint-disable-line

  /* If any POI was restored from sessionStorage, trigger fetch once the map bbox is ready */
  useEffect(() => {
    if (!(showSchools || showMosques || showFaculties || showGrandSurfaces || showHospitals)) return;
    const waitId = setInterval(() => {
      if (mapBboxRef.current && !livePOIsRef.current.fetched && !livePOIsRef.current.loading) {
        clearInterval(waitId);
        fetchPOIs(mapBboxRef.current);
      } else if (mapBboxRef.current) {
        clearInterval(waitId); // bbox ready but already fetching/fetched
      }
    }, 200);
    setTimeout(() => clearInterval(waitId), 3000);
    return () => clearInterval(waitId);
  }, []); // eslint-disable-line

  /* Fetch total count once (lightweight — just IDs/count, no pins) */
  useEffect(() => {
    fetch(`${API_URL}/annonces/public?limit=500&fields=id`)
      .then(r => { const c = r.headers.get("X-Total-Count"); if (c) { setTotalCount(+c); return null; } return r.json(); })
      .then(data => { if (data && Array.isArray(data)) setTotalCount(data.length); })
      .catch(() => {});
  }, []); // eslint-disable-line

  /* Fetch annonces only when a gouvernorat is selected */
  useEffect(() => {
    if (!filters.govId) { setApiProps([]); return; }
    setListLoading(true);
    const params = new URLSearchParams({ limit: "500", gouvernorat_id: filters.govId });
    if (filters.delId) params.set("delegation_id", filters.delId);
    fetch(`${API_URL}/annonces/public?${params}`)
      .then(r => r.json())
      .then(data => {
        const transformed = (Array.isArray(data) ? data : []).map(transformApiAnnonce);
        setApiProps(transformed);
      })
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, [filters.govId, filters.delId]); // eslint-disable-line

  /* Sync favoris API ? localStorage au montage (si connect�) */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/users/me/favoris`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!Array.isArray(data)) return;
        const ids = data.map(f => f.annonce_id || f.id).filter(Boolean);
        localStorage.setItem("localizi_favs", JSON.stringify(ids));
      })
      .catch(() => {});
  }, []);

  /* Annonces réelles uniquement */
  const allProperties = [...apiProperties];
  allPropertiesRef.current = allProperties; // toujours à jour pour applyFilters

  /* -- Cible de zoom carte selon la hiérarchie sélectionnée --
     Plus on précise (gov ? del ? loc), plus le zoom est �lev�. */
  const centerTarget = React.useMemo(() => {
    const { locNom, delNom, govNom } = filters;
    if (!govNom && !delNom && !locNom) return null;
    const parts = [locNom, delNom, govNom].filter(Boolean);
    const zoom  = locNom ? 14 : delNom ? 12 : 10;
    return { query: parts.join(", ") + ", Tunisie", zoom };
  }, [filters.govNom, filters.delNom, filters.locNom]);

  /* Stats march� : prix moyen/m� par gouvernorat (vente uniquement) */
  const govMarketStats = React.useMemo(() => {
    const stats = {};
    allProperties.forEach(p => {
      if (p.categorie !== "vente" || !p.gouvernorat || !p.prix || !p.area || p.area <= 0) return;
      if (!stats[p.gouvernorat]) stats[p.gouvernorat] = { sum: 0, count: 0 };
      stats[p.gouvernorat].sum   += p.prix / p.area;
      stats[p.gouvernorat].count += 1;
    });
    return stats;
  }, [allProperties]);

  /* Filtrage complet (carte + liste) */
  const results = allProperties
    .filter((p) => {
      /* -- Filtre localisation + adresse (UNION) --
         Si une localisation est détect�e, une annonce passe si :
           (elle correspond à la hiérarchie)  OU  (son adresse/titre contient la requ�te)
         Sinon (texte libre) : filtre sur titre + tous champs géo + adresse */
      const hasLocationFilter = filters.govNom || filters.delNom || filters.locNom;
      if (hasLocationFilter) {
        const norm = _n;
        const locationMatch =
          (!filters.govNom || norm(p.gouvernorat) === norm(filters.govNom)) &&
          (!filters.delNom || norm(p.delegation)  === norm(filters.delNom)) &&
          (!filters.locNom || norm(p.localite)    === norm(filters.locNom));
        const addressMatch = filters.query &&
          `${p.titre} ${p.address||""}`.toLowerCase().includes(filters.query.toLowerCase());
        if (!locationMatch && !addressMatch) return false;
      } else if (filters.query) {
        if (!`${p.titre} ${p.delegation} ${p.gouvernorat} ${p.localite} ${p.address||""}`
            .toLowerCase().includes(filters.query.toLowerCase())) return false;
      }
      const cats = filters.categories || [];
      if (cats.length > 0 && !cats.includes(p.categorie))       return false;
      if (filters.type) {
        if (filters.type === "villa_maison") {
          if (!["villa","maison","villa_maison"].includes(p.type)) return false;
        } else {
          if (p.type !== filters.type) return false;
        }
      }
      if (filters.prixMin || filters.prixMax) {
        const fd = filters.filterDevise || "TND";
        // Convertir le prix de l'annonce vers la devise du filtre pour comparaison
        const prixConverti = convertPrice(p.prix, p.devise || "TND", fd) ?? p.prix;
        if (filters.prixMin && prixConverti < +filters.prixMin) return false;
        if (filters.prixMax && prixConverti > +filters.prixMax) return false;
      }
      if (filters.superficieMin && p.area < +filters.superficieMin) return false;
      if (filters.superficieMax && p.area > +filters.superficieMax) return false;
      if (filters.bedsMin && (p.beds==null||p.beds < +filters.bedsMin)) return false;
      if (filters.piecesMin   && (p.pieces==null || p.pieces  < +filters.piecesMin))   return false;
      if (filters.chambresMin && (p.beds==null   || p.beds    < +filters.chambresMin)) return false;
      if (filters.datePubliMin && p.date_creation) {
        if (new Date(p.date_creation) < new Date(filters.datePubliMin)) return false;
      }
      if (filters.etat && p.etat !== filters.etat)               return false;
      if (filters.titre_foncier==="1" && !p.titre_foncier)       return false;
      if (filters.type_terrain        && p.type_terrain        !== filters.type_terrain)        return false;
      if (filters.vocation_terrain    && p.vocation_terrain    !== filters.vocation_terrain)    return false;
      if (filters.standing             && p.standing             !== filters.standing)             return false;
      if (filters.type_appartement    && p.type_appartement    !== filters.type_appartement)    return false;
      if (filters.type_villa          && p.type_villa          !== filters.type_villa)          return false;
      if (filters.type_bureau         && p.type_bureau         !== filters.type_bureau)         return false;
      if (filters.etage_min           && (p.etage == null || p.etage < +filters.etage_min))     return false;
      if (filters.nb_appartements_min && (p.nb_appartements == null || p.nb_appartements < +filters.nb_appartements_min)) return false;
      if (filters.hauteur_immeuble    && p.hauteur_immeuble    !== filters.hauteur_immeuble)    return false;
      if (filters.emplacement_garage  && p.emplacement_garage  !== filters.emplacement_garage)  return false;
      /* -- Filtre ancienneté -- */
      if (filters.anciennete && p.date_creation) {
        const joursMax = parseInt(filters.anciennete);
        const joursEcoules = Math.floor((Date.now() - new Date(p.date_creation)) / 86_400_000);
        if (joursEcoules > joursMax) return false;
      }
      if (filters.features && filters.features.length > 0) {
        const hasAll = filters.features.every(feat => {
          /* Convertir la clé filtre en label (ex: "jardin" ? "Jardin") */
          const label = FEAT_KEY_TO_LABEL[feat] || feat;
          if (Array.isArray(p.features) && p.features.length > 0) {
            return p.features.includes(label);
          }
          /* Fallback : vérifier le bool�en direct (données d�mo) */
          return p[feat] === true;
        });
        if (!hasAll) return false;
      }
      if (filters.colocation && !p.colocation) return false;
      return true;
    })
    .sort((a, b) => computeScore(b) - computeScore(a));

  /* Sous-ensemble visible : zone dessin�e > bounds carte > tout
     En mode liste pure on ignore les bounds (la carte est masqu�e) */
  /* En mode liste, on affiche tous les résultats filtrés (pas de restriction par bounds carte) */
  const visibleResults = drawnZones.length > 0
    ? results.filter(p => p.lat && p.lng && drawnZones.some(z => pointInPolygon({ lat: p.lat, lng: p.lng }, z)))
    : (!listMode && mapBounds)
      ? results.filter(p => p.lat && p.lng && mapBounds.contains && mapBounds.contains([p.lat, p.lng]))
      : results;

  /* Tri */
  const sortedVisibleResults = sortField
    ? [...visibleResults].sort((a, b) => {
        const va = sortField === "prix" ? (parseFloat(a.prix)||0) : (parseFloat(a.area)||0);
        const vb = sortField === "prix" ? (parseFloat(b.prix)||0) : (parseFloat(b.area)||0);
        return sortDir === "asc" ? va - vb : vb - va;
      })
    : visibleResults;

  /* Pagination liste */
  const listTotalPages = Math.ceil(sortedVisibleResults.length / PAGE_SIZE);
  const listPageResults = sortedVisibleResults.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  /* Tags filtres actifs (toujours visibles même si 0 résultats) */
  const activeTags = [
    /* query = filtre texte libre silencieux � pas de chip, seules les localisations vérifi�es en ont un */
    filters.govNom     && { label:filters.govNom,          key:"govNom",  color:"#4f46e5" },
    filters.delNom     && { label:filters.delNom,         key:"delNom",  color:"#7c3aed" },
    filters.locNom     && { label:filters.locNom,         key:"locNom",  color:"#9333ea" },
    ...(filters.categories||[]).map(c=>({ label:CAT_LBL[c], key:`cat_${c}`, color:"#0369a1" })),
    filters.type       && { label:ucFirst(filters.type),  key:"type",    color:"#0f766e" },
    filters.etat       && { label:ETAT_LBL[filters.etat], key:"etat",    color:"#92400e" },
    filters.prixMin    && { label:`>= ${fmtFull(+filters.prixMin)} ${filters.filterDevise||"TND"}`, key:"prixMin", color:"#1d4ed8" },
    filters.prixMax    && { label:`<= ${fmtFull(+filters.prixMax)} ${filters.filterDevise||"TND"}`, key:"prixMax", color:"#1d4ed8" },
    filters.superficieMin && { label:`>= ${filters.superficieMin} m²`, key:"superficieMin", color:"#0369a1" },
    filters.superficieMax && { label:`<= ${filters.superficieMax} m²`, key:"superficieMax", color:"#0369a1" },
    filters.piecesMin  && { label:`${filters.piecesMin}+ pièces`, key:"piecesMin", color:"#be185d" },
    filters.chambresMin && { label:`${filters.chambresMin}+ chambres`, key:"chambresMin", color:"#be185d" },
    filters.bedsMin    && { label:`${filters.bedsMin}+ ch.`, key:"bedsMin", color:"#be185d" },
    filters.datePubliMin && { label:`Depuis ${filters.datePubliMin}`, key:"datePubliMin", color:"#0f766e" },
    filters.type_terrain     && { label: ({agricole:"Agricole",zone_verte:"Zone verte",lotissement:"Lotissement",commercial:"Commercial",industriel:"Industriel",mixte:"Mixte"})[filters.type_terrain] || filters.type_terrain, key:"type_terrain", color:"#854d0e" },
    filters.vocation_terrain && { label: ({agricole:"Voc. agricole",touristique:"Voc. touristique",mixte:"Voc. mixte",residentielle:"Voc. résidentielle",commerciale:"Voc. commerciale",industrielle:"Voc. industrielle"})[filters.vocation_terrain] || filters.vocation_terrain, key:"vocation_terrain", color:"#713f12" },
    filters.standing         && { label: ({economique:"Économique",moyen_standing:"Moyen standing",haut_standing:"Haut standing"})[filters.standing] || filters.standing, key:"standing", color:"#0e7490" },
    filters.anciennete       && { label: ({1:"Aujourd'hui",7:"7 derniers jours",30:"30 derniers jours",60:"60 derniers jours",90:"3 derniers mois",180:"6 derniers mois"})[filters.anciennete] || `${filters.anciennete} jours`, key:"anciennete", color:"#0f766e" },
    filters.etage_min        && { label: filters.etage_min==="0"?"RDC":`Étage ≥ ${filters.etage_min}`, key:"etage_min", color:"#4338ca" },
    filters.type_appartement && { label: ({studio:"Studio",s0:"S0","s+1":"S+1","s+2":"S+2","s+3":"S+3","s+4":"S+4",duplex:"Duplex",penthouse:"Penthouse"})[filters.type_appartement] || filters.type_appartement, key:"type_appartement", color:"#be185d" },
    filters.titre_foncier && { label:"Titre foncier",     key:"titre_foncier", color:"#15803d" },
    filters.colocation    && { label:"Colocation",         key:"colocation",    color:"#6366f1" },
    ...(filters.features||[]).map(k => ({ label: k.replace(/_/g," "), key:`feat_${k}`, color:"#7c3aed" })),
  ].filter(Boolean);

  /* Click pin ? scroll vers la carte */
  const handlePin = useCallback((id) => {
    setActive(id);
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"nearest" });
  }, []);

  /* removeTag passe par applyFilters pour synchroniser URL + sessionStorage */
  const removeTag = (key) => {
    let newF;
    if (key === "govNom")      newF = { ...filters, govId:"", govNom:"", delId:"", delNom:"", locId:"", locNom:"" };
    else if (key === "delNom") newF = { ...filters, delId:"", delNom:"", locId:"", locNom:"" };
    else if (key === "locNom") newF = { ...filters, locId:"", locNom:"" };
    else if (key.startsWith("cat_")) {
      const cat = key.replace("cat_","");
      newF = { ...filters, categories: (filters.categories||[]).filter(c => c !== cat) };
    }
    else if (key.startsWith("feat_")) {
      const feat = key.replace("feat_","");
      newF = { ...filters, features: (filters.features||[]).filter(f => f !== feat) };
    }
    else newF = { ...filters, [key]: "" };
    applyFilters(newF);
  };

  /* -- Calcul des comptes visibles pour chaque couche POI --
     On utilise les données live Overpass si disponibles, sinon le fallback statique.
     On filtre ensuite par les bounds actuelles de la carte. */
  const _govFilter = filters.govNom || null;
  const _inBounds = (item) => {
    if (!mapBounds || !mapBounds.contains) return true;
    return item.lat && item.lng && mapBounds.contains([item.lat, item.lng]);
  };
  const _staticSchools  = _govFilter ? SCHOOLS.filter(s=>s.gov===_govFilter)           : SCHOOLS;
  const _staticMosques  = _govFilter ? MOSQUES.filter(m=>m.gov===_govFilter)           : MOSQUES;
  const _staticFacults  = _govFilter ? FACULTIES.filter(f=>f.gov===_govFilter)         : FACULTIES;
  const _staticSurfaces = _govFilter ? GRAND_SURFACES.filter(g=>g.gov===_govFilter)    : GRAND_SURFACES;
  const _staticHosp     = _govFilter ? HOSPITALS.filter(h=>h.gov===_govFilter)         : HOSPITALS;
  const _liveSchools    = livePOIs.schools;
  const _liveMosques    = livePOIs.mosques;
  const _liveFacults    = livePOIs.faculties;
  const _liveSurfaces   = livePOIs.grandSurfaces || [];
  const _liveHosp       = livePOIs.hospitals || [];
  // For live Overpass data, filter by visible bounds; for static fallback, show all gov results
  const visSchoolCount   = _liveSchools.length   > 0 ? _liveSchools.filter(_inBounds).length   : _staticSchools.length;
  const visMosqueCount   = _liveMosques.length   > 0 ? _liveMosques.filter(_inBounds).length   : _staticMosques.length;
  const visFacultyCount  = _liveFacults.length   > 0 ? _liveFacults.filter(_inBounds).length   : _staticFacults.length;
  const visSurfaceCount  = _liveSurfaces.length  > 0 ? _liveSurfaces.filter(_inBounds).length  : _staticSurfaces.length;
  const visHospitalCount = _liveHosp.length      > 0 ? _liveHosp.filter(_inBounds).length      : _staticHosp.length;

  return (
    <div className={`cp-root${listMode ? "" : " cp-root--carte"}`}>
      <Navbar />

      <div
        ref={stickyBarRef}
        className="cp-sticky-bar"
        style={{
          position:"sticky",top:64,zIndex:200,background:"#fff",
          boxShadow:"0 2px 8px rgba(0,0,0,.06)",
          ...(mobileFilterH != null ? { maxHeight: mobileFilterH, overflowY:"auto", flexShrink:0 } : { flexShrink:0 }),
        }}
      >
      <FilterPanel
        filters={filters} onChange={applyFilters}
        onSaveSearch={() => {
          const token = localStorage.getItem("token");
          if (!token) { window.location.href = "/login?redirect=/carte"; return; }
          if (countActiveFilters(filters) < 3) { setShowMinFiltersModal(true); return; }
          setSaveModalName("Ma recherche");
          setSaveModalSuccess(false);
          setShowSaveModal(true);
        }}
        showSchools={showSchools} showMosques={showMosques} showFaculties={showFaculties} showGrandSurfaces={showGrandSurfaces} showHospitals={showHospitals}
        onToggleSchools={()=>handleTogglePOI("schools",      showSchools)}
        onToggleMosques={()=>handleTogglePOI("mosques",      showMosques)}
        onToggleFaculties={()=>handleTogglePOI("faculties",  showFaculties)}
        onToggleGrandSurfaces={()=>handleTogglePOI("grandSurfaces", showGrandSurfaces)}
        onToggleHospitals={()=>handleTogglePOI("hospitals",  showHospitals)}
        poiLoading={livePOIs.loading}
        poiFetched={livePOIs.fetched}
        liveSchoolCount={visSchoolCount}
        liveMosqueCount={visMosqueCount}
        liveFacultyCount={visFacultyCount}
        liveGrandSurfaceCount={visSurfaceCount}
        liveHospitalCount={visHospitalCount}
      />

      </div>{/* end sticky wrapper */}

      {/* Mobile drag handle — toujours visible, AU-DESSUS de la barre cp-bar */}
      <div
        className="cp-drag-handle"
        onTouchStart={e => {
          if (window.innerWidth > 860) return;
          e.preventDefault();
          const h = stickyBarRef.current ? stickyBarRef.current.getBoundingClientRect().height : 200;
          dragState.current = { dragging: true, startY: e.touches[0].clientY, startH: h };
        }}
      >
        <span className="cp-drag-handle__bar"/>
      </div>

      {/* Barre compteur + résumé filtres — sous le drag handle sur mobile */}
      <div className="cp-bar">
        <span className="cp-bar__count">
          <strong>{visibleResults.length}</strong> annonce{visibleResults.length!==1?"s":""} trouvée{visibleResults.length!==1?"s":""}
        </span>
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
          <CompareBar />
        </div>

        {/* Icône comparateur — mobile only, dès 2 annonces */}
        {compareCount >= 2 && (
          <div className="cp-filtersum cp-compare-mob" style={{position:"relative"}}>
            <button
              ref={compareBtnRef}
              className="cp-filtersum__btn"
              onClick={() => setShowCompareMenu(v => !v)}
              title="Comparateur"
            >
              <GitCompare size={14}/>
              <span className="cp-filtersum__badge">{compareCount}</span>
            </button>
            {showCompareMenu && ReactDOM.createPortal(
              <>
                <div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setShowCompareMenu(false)}/>
                <div style={{
                  position:"fixed", zIndex:9999,
                  ...(()=>{const r=compareBtnRef.current?.getBoundingClientRect(); return r?{top:r.bottom+6,right:window.innerWidth-r.right}:{top:120,right:16};})(),
                  background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12,
                  boxShadow:"0 8px 28px rgba(0,0,0,.14)", padding:"6px 0", minWidth:200,
                }}>
                  <button onClick={()=>{ setShowComparePop(true); setShowCompareMenu(false); }}
                    style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",border:"none",background:"transparent",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    <GitCompare size={14} color="#6366f1"/> Voir le comparateur
                  </button>
                  <div style={{borderTop:"1px solid #f1f5f9",margin:"4px 0"}}/>
                  <button onClick={()=>{ clearCompareStore(); setShowCompareMenu(false); }}
                    style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",border:"none",background:"transparent",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    <X size={14}/> Supprimer la sélection
                  </button>
                </div>
              </>,
              document.body
            )}
          </div>
        )}

        {/* Icône résumé des filtres actifs — juste à gauche de "Vue liste" */}
        {(activeTags.length > 0 || drawnZones.length > 0) && (
          <div className="cp-filtersum">
            <button ref={filterSumBtnRef} className="cp-filtersum__btn" onClick={()=>setShowFiltersSummary(o=>!o)} title="Filtres actifs">
              <SlidersHorizontal size={14}/>
              <span className="cp-filtersum__label">Filtres actifs</span>
              <span className="cp-filtersum__badge" key={activeTags.length + drawnZones.length}>{activeTags.length + drawnZones.length}</span>
            </button>
            {showFiltersSummary && ReactDOM.createPortal(
              (() => {
                const r = filterSumBtnRef.current?.getBoundingClientRect();
                const top  = r ? r.bottom + 8 : 110;
                const left = r ? Math.max(8, Math.min(r.right - 250, window.innerWidth - 258)) : 8;
                return (
                  <>
                    <div className="cp-filtersum__backdrop" onClick={()=>setShowFiltersSummary(false)}/>
                    <div className="cp-filtersum__menu" style={{ position:"fixed", top, left }}>
                      <div className="cp-filtersum__title">Filtres actifs</div>
                      {activeTags.map(t=>(
                        <div key={t.key} className="cp-filtersum__row">
                          <span className="cp-filtersum__dot" style={{background:t.color}}/>
                          <span className="cp-filtersum__lbl">{t.label}</span>
                          <button className="cp-filtersum__x" onClick={()=>removeTag(t.key)} title="Supprimer"><X size={13}/></button>
                        </div>
                      ))}
                      {drawnZones.map((_, i) => (
                        <div key={`z${i}`} className="cp-filtersum__row">
                          <span className="cp-filtersum__dot" style={{background:"#1e40af"}}/>
                          <span className="cp-filtersum__lbl">Zone {i+1}</span>
                          <button className="cp-filtersum__x" onClick={()=>setDrawnZones(z=>z.filter((_,j)=>j!==i))} title="Supprimer"><X size={13}/></button>
                        </div>
                      ))}
                      <button className="cp-filtersum__clear" onClick={()=>{
                        applyFilters(INIT_F); setDrawnZones([]); setEraseMode(false); setEraseSelectedIdx(null);
                        sessionStorage.removeItem("localizi_carte_zones"); setShowFiltersSummary(false);
                      }}>Tout effacer</button>
                    </div>
                  </>
                );
              })(),
              document.body
            )}
          </div>
        )}

        {/* Bouton Enregistrer — desktop uniquement */}
        <button className="fp__save-search fp__save-search--desktop" onClick={() => {
          const token = localStorage.getItem("token");
          if (!token) { window.location.href = "/login?redirect=/carte"; return; }
          if (countActiveFilters(filters) < 3) { setShowMinFiltersModal(true); return; }
          setSaveModalName("Ma recherche");
          setSaveModalSuccess(false);
          setShowSaveModal(true);
        }}>
          <Save size={13} strokeWidth={2}/> Enregistrer la recherche
        </button>

        {/* Bouton tri — icône seule + dropdown */}
        <div style={{position:"relative"}} className={!listMode ? "cp-sort-map-hidden" : ""}>
          <div className="cp-filtersum">
            <button
              ref={sortBtnRef}
              className="cp-filtersum__btn"
              onClick={() => setShowSortMenu(v => !v)}
              title={sortField ? `Tri : ${sortField === "prix" ? "Prix" : "Surface"} ${sortDir === "asc" ? "croissant" : "décroissant"}` : "Trier"}
            >
              {!sortField && <ArrowUpDown size={14}/>}
              {sortField && sortDir === "asc"  && <ChevronUp size={14}/>}
              {sortField && sortDir === "desc" && <ChevronDown size={14}/>}
              {sortField && <span className="cp-filtersum__badge">1</span>}
            </button>
          </div>
          {showSortMenu && ReactDOM.createPortal(
            <>
              <div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setShowSortMenu(false)}/>
              <div style={{
                position:"fixed", zIndex:9999,
                ...(()=>{const r=sortBtnRef.current?.getBoundingClientRect(); return r?{top:r.bottom+6,right:window.innerWidth-r.right}:{top:120,right:16};})(),
                background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12,
                boxShadow:"0 8px 28px rgba(0,0,0,.14)", padding:"6px 0", minWidth:180,
              }}>
                <div style={{padding:"6px 14px 4px",fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:".06em"}}>TRIER PAR</div>
                {[
                  {field:"prix", dir:"asc",  label:"Prix croissant"},
                  {field:"prix", dir:"desc", label:"Prix décroissant"},
                  {field:"surface", dir:"asc",  label:"Surface croissante"},
                  {field:"surface", dir:"desc", label:"Surface décroissante"},
                ].map(opt => {
                  const active = sortField === opt.field && sortDir === opt.dir;
                  return (
                    <button key={opt.field+opt.dir}
                      onClick={() => { setSortField(opt.field); setSortDir(opt.dir); setShowSortMenu(false); }}
                      style={{
                        display:"flex", alignItems:"center", gap:8, width:"100%",
                        padding:"8px 14px", border:"none", background: active?"#eef2ff":"transparent",
                        color: active?"#4f46e5":"#374151", fontSize:13, fontWeight: active?700:500,
                        cursor:"pointer", textAlign:"left",
                      }}
                    >
                      {active && <Check size={13} color="#4f46e5"/>}
                      {!active && <span style={{width:13}}/>}
                      {opt.label}
                    </button>
                  );
                })}
                {sortField && (
                  <>
                    <div style={{borderTop:"1px solid #f1f5f9",margin:"4px 0"}}/>
                    <button onClick={() => { setSortField(null); setShowSortMenu(false); }}
                      style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 14px",border:"none",background:"transparent",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                      <X size={13}/> Supprimer le tri
                    </button>
                  </>
                )}
              </div>
            </>,
            document.body
          )}
        </div>

        <button className="cp-toggle-btn" onClick={()=>setListMode(v=>!v)}>
          {listMode
            ? <><MapIcon size={14}/> Vue carte</>
            : <><LayoutList size={14}/> Vue liste</>}
        </button>
      </div>

      {/* Layout carte + liste / mode liste seule
          Les deux blocs sont TOUJOURS mont�s – on alterne uniquement display:none
          pour éviter de démonter PropertyMap (ce qui réinitialise le zoom/position). */}

      {/* -- Vue liste seule -- */}
      <div className="cp-listonly" style={{display: listMode ? undefined : "none"}}>
        {listLoading ? (
          <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 24px",gap:16}}>
            <div style={{
              width:44,height:44,borderRadius:"50%",
              border:"3px solid #e2e8f0",borderTopColor:"#6366f1",
              animation:"cp-spin 0.8s linear infinite",
            }}/>
            <p style={{fontWeight:600,color:"#374151",fontSize:15}}>Chargement des annonces…</p>
            <style>{`@keyframes cp-spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="cp-empty" style={{gridColumn:"1/-1"}}>
            <MapPin size={36} style={{color:"#d1d5db",margin:"0 auto 14px"}}/>
            <p style={{fontWeight:600,color:"#374151",marginBottom:6}}>Aucun résultat</p>
            <p style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>Essayez d'élargir vos filtres</p>
            <button className="fp__reset" onClick={()=>applyFilters(INIT_F)}>
              <X size={12}/> Effacer les filtres
            </button>
          </div>
        ) : (
          <>
            {/* pagination seulement */}
            {listTotalPages > 1 && (
              <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"4px 2px 8px"}}>
                <p style={{fontSize:13,color:"#6b7280",margin:0}}>Page {listPage} / {listTotalPages}</p>
              </div>
            )}

            {listPageResults.map((p) => (
              <div key={p.id}>
                <PropCard p={p} active={false} govMarketStats={govMarketStats}
                  onHover={()=>{}}
                  onClick={(id)=>{
                    const realId = String(id).startsWith("api_") ? String(id).replace("api_","") : id;
                    setModalId(realId);
                  }}
                />
              </div>
            ))}

            {/* Pagination */}
            {listTotalPages > 1 && (
              <div style={{
                gridColumn:"1/-1",
                display:"flex",alignItems:"center",justifyContent:"center",
                gap:8,padding:"24px 0 8px",flexWrap:"wrap",
              }}>
                <button
                  onClick={()=>{ setListPage(p=>Math.max(1,p-1)); window.scrollTo({top:0,behavior:"smooth"}); }}
                  disabled={listPage===1}
                  style={{
                    display:"flex",alignItems:"center",gap:6,
                    padding:"10px 18px",borderRadius:8,
                    border:"1.5px solid #e2e8f0",background:listPage===1?"#f8fafc":"#fff",
                    color:listPage===1?"#9ca3af":"#374151",
                    fontWeight:700,fontSize:14,cursor:listPage===1?"not-allowed":"pointer",
                    transition:"all .15s",
                  }}
                >
                  <ChevronLeft size={15}/> Précédent
                </button>

                {Array.from({length:listTotalPages},(_,i)=>i+1)
                  .filter(n => n===1 || n===listTotalPages || Math.abs(n-listPage)<=2)
                  .reduce((acc,n,idx,arr)=>{
                    if(idx>0 && n-arr[idx-1]>1) acc.push("�");
                    acc.push(n);
                    return acc;
                  },[])
                  .map((item,idx)=> item==="�"
                    ? <span key={`ell${idx}`} style={{padding:"0 4px",color:"#9ca3af",fontWeight:700}}>�</span>
                    : <button key={item}
                        onClick={()=>{ setListPage(item); window.scrollTo({top:0,behavior:"smooth"}); }}
                        style={{
                          width:40,height:40,borderRadius:8,
                          border:`1.5px solid ${listPage===item?"#6366f1":"#e2e8f0"}`,
                          background:listPage===item?"#6366f1":"#fff",
                          color:listPage===item?"#fff":"#374151",
                          fontWeight:700,fontSize:14,cursor:"pointer",
                          transition:"all .15s",
                        }}
                      >{item}</button>
                  )
                }

                <button
                  onClick={()=>{ setListPage(p=>Math.min(listTotalPages,p+1)); window.scrollTo({top:0,behavior:"smooth"}); }}
                  disabled={listPage===listTotalPages}
                  style={{
                    display:"flex",alignItems:"center",gap:6,
                    padding:"10px 18px",borderRadius:8,
                    border:"1.5px solid #e2e8f0",background:listPage===listTotalPages?"#f8fafc":"#fff",
                    color:listPage===listTotalPages?"#9ca3af":"#374151",
                    fontWeight:700,fontSize:14,cursor:listPage===listTotalPages?"not-allowed":"pointer",
                    transition:"all .15s",
                  }}
                >
                  Suivant <ChevronRight size={15}/>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* -- Vue carte + liste droite -- */}
      <div className="cp-layout" style={{display: listMode ? "none" : undefined}}>
          {/* Carte � occupe tout l'espace restant */}
          <div className="cp-map" style={{ position:"relative" }}
            onMouseLeave={() => setHoveredPin(null)}
          >
            <PropertyMap
              properties={results}
              activeId={active}
              selectedGov={filters.govNom}
              selectedDel={filters.delNom}
              onGovSelect={(gadmGovNom) => {
                const norm = _n;
                const list = govListRef.current;
                const ng = norm(gadmGovNom);
                /* 1) Exact normalisé */
                let found = list.find(g => norm(g.label) === ng);
                /* 2) Contenance */
                if (!found) found = list.find(g => { const nl=norm(g.label); return nl.includes(ng)||ng.includes(nl); });
                /* 3) Score caractères (Levenshtein simplifié) */
                if (!found && list.length) {
                  const lev = (a,b) => { const m=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i||j)); for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) m[i][j]=a[i-1]===b[j-1]?m[i-1][j-1]:1+Math.min(m[i-1][j],m[i][j-1],m[i-1][j-1]); return m[a.length][b.length]; };
                  found = list.reduce((best,g)=>{ const d=lev(norm(g.label),ng); return (!best||d<best._d)?{...g,_d:d}:best; },null);
                }
                if (found) applyFilters({ ...filters, govNom: found.label, govId: String(found.value), delId:"", delNom:"", locId:"", locNom:"", query:"" });
              }}
              onDelSelect={(gadmDelNom, gadmGovNom) => {
                const norm = _n;
                const lev = (a,b) => { const m=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i||j)); for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) m[i][j]=a[i-1]===b[j-1]?m[i-1][j-1]:1+Math.min(m[i-1][j],m[i][j-1],m[i-1][j-1]); return m[a.length][b.length]; };

                /* 1. Résoudre le gouvernorat depuis la liste API */
                const govList = govListRef.current;
                const ng = norm(gadmGovNom);
                let foundGov = govList.find(g => norm(g.label) === ng);
                if (!foundGov) foundGov = govList.find(g => { const nl=norm(g.label); return nl.includes(ng)||ng.includes(nl); });
                if (!foundGov && govList.length) foundGov = govList.reduce((b,g)=>{ const d=lev(norm(g.label),ng); return (!b||d<b._d)?{...g,_d:d}:b; },null);
                const resolvedGovNom = foundGov?.label || gadmGovNom;
                const resolvedGovId  = foundGov ? String(foundGov.value) : filters.govId || "";

                /* 2. Résoudre la délégation depuis la liste API */
                const delList = delListRef.current;
                const nd = norm(gadmDelNom);
                let foundDel = null;

                /* 2a. Table d'alias statique (GADM → API) */
                const aliasTarget = GADM_DEL_ALIASES[nd];
                if (aliasTarget) {
                  foundDel = delList.find(d => norm(d.nom) === aliasTarget);
                  if (!foundDel) foundDel = delList.find(d => norm(d.nom).includes(aliasTarget) || aliasTarget.includes(norm(d.nom)));
                }

                /* 2b. Correspondance exacte normalisée */
                if (!foundDel) foundDel = delList.find(d => norm(d.nom) === nd);

                /* 2c. normDel : supprime préfixes El/La/Le/Es/Bou */
                if (!foundDel) foundDel = delList.find(d => normDel(d.nom) === normDel(gadmDelNom));

                /* 2d. Contains */
                if (!foundDel) foundDel = delList.find(d => { const nl=normDel(d.nom); const nq=normDel(gadmDelNom); return nl.includes(nq)||nq.includes(nl); });

                /* 2e. Levenshtein sur normDel */
                if (!foundDel && delList.length) foundDel = delList.reduce((b,d)=>{ const dist=lev(normDel(d.nom),normDel(gadmDelNom)); return (!b||dist<b._d)?{...d,_d:dist}:b; },null);

                const resolvedDelNom = foundDel?.nom || gadmDelNom;
                const resolvedDelId  = foundDel ? String(foundDel.id) : "";

                applyFilters({ ...filters, govNom: resolvedGovNom, govId: resolvedGovId, delNom: resolvedDelNom, delId: resolvedDelId, locId:"", locNom:"", query:"" });
              }}
              onPinClick={handlePin}
              onBoundsChange={setMapBounds}
              showSchools={showSchools}
              showMosques={showMosques}
              showFaculties={showFaculties}
              showGrandSurfaces={showGrandSurfaces}
              showHospitals={showHospitals}
              liveSchools={livePOIs.schools}
              liveMosques={livePOIs.mosques}
              liveFaculties={livePOIs.faculties}
              liveGrandSurfaces={livePOIs.grandSurfaces||[]}
              liveHospitals={livePOIs.hospitals||[]}
              onPinHover={setHoveredPin}
              sharedHoverTimer={sharedHoverTimer}
              centerTarget={centerTarget}
              initialView={savedMapView}
              drawMode={drawMode}
              drawnZones={drawnZones}
              onZoneDrawn={(zone) => { setDrawnZones(z => [...z, zone]); setDrawMode(false); }}
              eraseMode={eraseMode}
              eraseSelectedIdx={eraseSelectedIdx}
              onEraseSelect={(i) => setEraseSelectedIdx(i === eraseSelectedIdx ? null : i)}
              onMapRef={(map) => { leafletMapRef.current = map; }}
            />

            {/* -- Overlay : pas de gouvernorat sélectionné — texte blanc direct sur la couche -- */}
            {!filters.govNom && (
              <div style={{
                position:"absolute", inset:0, zIndex:8500,
                background:"rgba(10,12,20,0.55)",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:12, padding:24, textAlign:"center", pointerEvents:"none",
              }}>
                <style>{`@keyframes cp-ov-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.cp-ov-txt{animation:cp-ov-fadein .4s ease both}`}</style>
                <div className="cp-ov-txt" style={{color:"#fff", display:"flex", flexDirection:"column", alignItems:"center", gap:10}}>
                  {totalCount != null && (
                    <div style={{fontSize:17, fontWeight:700, color:"#fff", letterSpacing:.1}}>
                      {totalCount.toLocaleString("fr-FR")} annonce{totalCount !== 1 ? "s" : ""} présente{totalCount !== 1 ? "s" : ""} aujourd'hui sur la plateforme
                    </div>
                  )}
                  <div style={{fontSize:16, fontWeight:700, letterSpacing:.2}}>
                    Sélectionnez un <span style={{color:"#a5b4fc"}}>gouvernorat</span>
                  </div>
                  <div style={{fontSize:14, color:"#fff"}}>
                    pour afficher les annonces sur la carte
                  </div>
                  <div style={{fontSize:14, color:"#fff", marginTop:2}}>
                    à partir du bouton <span style={{fontWeight:600}}>Filtres</span>
                  </div>
                </div>
              </div>
            )}

            {/* -- Boutons dessin / effacement zone -- */}
            <div style={{
              position:"absolute", bottom:12, left:12, zIndex:9200,
              display:"flex", flexDirection:"column", gap:6,
            }}>
              <button
                onClick={() => { setDrawMode(v => !v); setEraseMode(false); setEraseSelectedIdx(null); }}
                title={drawMode ? "Annuler le dessin" : "Dessiner une zone"}
                style={{
                  display:"flex", alignItems:"center", gap:7,
                  padding:"8px 13px", borderRadius:10, border:"2px solid",
                  borderColor: drawMode ? "#1e40af" : "#d1d5db",
                  background: drawMode ? "#dbeafe" : "#fff",
                  color: drawMode ? "#1e40af" : "#374151",
                  fontWeight:700, fontSize:13, cursor:"pointer",
                  boxShadow:"0 4px 16px rgba(0,0,0,.18)", whiteSpace:"nowrap",
                }}
              >
                <PenLine size={15}/>
                {drawMode ? "Annuler" : "Dessiner une zone"}
              </button>
              {drawnZones.length > 0 && !drawMode && (
                eraseMode ? (
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{
                      background:"rgba(220,38,38,.9)", color:"#fff", borderRadius:8,
                      padding:"6px 12px", fontSize:12, fontWeight:600, textAlign:"center",
                    }}>
                      {eraseSelectedIdx !== null ? `Zone ${eraseSelectedIdx+1} sélectionnée` : "Cliquez sur une zone"}
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      <button
                        disabled={eraseSelectedIdx === null}
                        onClick={() => {
                          setDrawnZones(z => z.filter((_,j)=>j!==eraseSelectedIdx));
                          setEraseSelectedIdx(null); setEraseMode(false);
                        }}
                        style={{
                          flex:1, padding:"7px 10px", borderRadius:8, border:"1.5px solid #dc2626",
                          background: eraseSelectedIdx!==null ? "#dc2626" : "#fca5a5",
                          color:"#fff", fontWeight:700, fontSize:12,
                          cursor: eraseSelectedIdx!==null ? "pointer" : "not-allowed",
                        }}
                      >Confirmer</button>
                      <button
                        onClick={() => { setEraseMode(false); setEraseSelectedIdx(null); }}
                        style={{
                          padding:"7px 10px", borderRadius:8, border:"1.5px solid #d1d5db",
                          background:"#fff", color:"#374151", fontWeight:600, fontSize:12, cursor:"pointer",
                        }}
                      >Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEraseMode(true); setEraseSelectedIdx(null); setDrawMode(false); }}
                    style={{
                      display:"flex", alignItems:"center", gap:6,
                      padding:"7px 12px", borderRadius:8, border:"1.5px solid #fca5a5",
                      background:"#fef2f2", color:"#dc2626",
                      fontWeight:600, fontSize:12, cursor:"pointer",
                      boxShadow:"0 2px 8px rgba(0,0,0,.15)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                    </svg>
                    Effacer une zone
                  </button>
                )
              )}
            </div>
            {/* -- Bandeau instruction -- */}
            {(drawMode || eraseMode) && (
              <div style={{
                position:"absolute", top:10, left:"50%", transform:"translateX(-50%)",
                zIndex:9200, background: eraseMode ? "rgba(220,38,38,.92)" : "rgba(30,64,175,.92)", color:"#fff",
                borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:600,
                pointerEvents:"none", whiteSpace:"nowrap",
                boxShadow:"0 2px 10px rgba(109,40,217,.35)",
              }}>
                {eraseMode
                  ? (eraseSelectedIdx !== null ? `Zone ${eraseSelectedIdx+1} sélectionnée — confirmez` : "Cliquez sur une zone pour la sélectionner")
                  : "Cliquez pour ajouter des points — Double-clic pour terminer"}
              </div>
            )}
            {/* -- Tooltip hover avec carousel -- */}
            {hoveredPin && <HoverCard
              pin={hoveredPin}
              sharedHoverTimer={sharedHoverTimer}
              onOpen={(id) => setModalId(id)}
              onLeave={() => setHoveredPin(null)}
            />}
      
          </div>

          {/* Liste à droite – filtrée par zone visible sur la carte */}
          <div className="cp-list">
            {/* Header fixe avec compteur */}
            <div className="cp-list__header">
              <span style={{
                background:"#6366f1", color:"#fff", fontWeight:800, fontSize:12,
                padding:"2px 8px", borderRadius:20, lineHeight:1.5,
              }}>{visibleResults.length}</span>
              annonce{visibleResults.length !== 1 ? "s" : ""} trouvée{visibleResults.length !== 1 ? "s" : ""}
              {results.length > visibleResults.length && (
                <span style={{color:"#94a3b8", fontWeight:400, fontSize:12}}>
                  &nbsp;(sur {results.length} au total)
                </span>
              )}
            </div>
            {/* Grid scrollable */}
            <div className="cp-list__body">
              {visibleResults.length === 0
                ? <div className="cp-empty" style={{gridColumn:"1/-1"}}>
                    <MapPin size={36} style={{color:"#d1d5db",margin:"0 auto 14px"}}/>
                    <p style={{fontWeight:600,color:"#374151",marginBottom:6}}>
                      {mapBounds && results.length > 0 ? "Aucun bien dans cette zone" : "Aucun résultat"}
                    </p>
                    <p style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>
                      {mapBounds && results.length > 0 ? "Dézoomez pour voir plus d'annonces" : "Essayez d'élargir vos filtres"}
                    </p>
                    {(!mapBounds || results.length === 0) && (
                      <button className="fp__reset" onClick={()=>applyFilters(INIT_F)}>
                        <X size={12}/> Effacer les filtres
                      </button>
                    )}
                  </div>
                : sortedVisibleResults.map((p) => (
                    <div id={`card-${p.id}`} key={p.id}>
                      <PropCard p={p} active={active===p.id} govMarketStats={govMarketStats}
                        compact
                        onHover={setActive}
                        onClick={(id)=>{
                          const realId = String(id).startsWith("api_") ? String(id).replace("api_","") : id;
                          setModalId(realId);
                        }}
                      />
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

      {/* -- Modal annonce -- */}
      {modalId && <AnnonceDetailModal annonceId={modalId} onClose={() => setModalId(null)} />}

      {/* -- Popup comparateur inline -- */}
      {showComparePop && <ComparateurPopup onClose={() => setShowComparePop(false)} />}

      {/* -- Popup : minimum 3 critères -- */}
      {showMinFiltersModal && ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99999,padding:16}}
          onClick={()=>setShowMinFiltersModal(false)}>
          <div style={{background:"#fff",borderRadius:20,width:440,maxWidth:"100%",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header violet avec logo */}
            <div style={{background:"linear-gradient(135deg,#6366f1 0%,#818cf8 100%)",padding:"18px 24px",display:"flex",alignItems:"center",gap:12}}>
              <Logo variant="white" height={28} to={null}/>
              <span style={{color:"#fff",fontSize:14,fontWeight:700,opacity:.9,marginLeft:4}}>Enregistrer la recherche</span>
            </div>
            {/* Contenu */}
            <div style={{padding:"32px 28px 28px",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"#fffbeb",border:"2px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 18px"}}>🔍</div>
              <p style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:"0 0 10px"}}>Pas assez de critères</p>
              <p style={{fontSize:14,color:"#64748b",lineHeight:1.7,margin:"0 0 8px"}}>
                Sélectionnez <strong>au moins 3 critères</strong> avant d'enregistrer votre recherche.
              </p>
              <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.6,margin:"0 0 24px"}}>
                Exemples : gouvernorat, type de bien, catégorie, prix, superficie, nombre de chambres, état du bien, équipements…
              </p>
              {/* Compteur de critères actifs */}
              <div style={{background:"#f8fafc",borderRadius:12,padding:"12px 20px",marginBottom:24,display:"inline-flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,color:"#64748b",fontWeight:600}}>Critères sélectionnés :</span>
                <span style={{fontSize:16,fontWeight:800,color:countActiveFilters(filters)>=3?"#16a34a":"#ef4444"}}>
                  {countActiveFilters(filters)} / 3
                </span>
              </div>
              <br/>
              <button onClick={()=>setShowMinFiltersModal(false)}
                style={{padding:"11px 36px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                Ajouter des filtres
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* -- Modal enregistrer recherche -- */}
      {showSaveModal && ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99999,padding:"16px"}}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div style={{background:"#fff",borderRadius:20,width:480,maxWidth:"100%",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.28)"}}>
            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#6366f1 0%,#818cf8 100%)",padding:"18px 24px",display:"flex",alignItems:"center",gap:12}}>
              <Logo variant="white" height={28} to={null}/>
              <span style={{color:"#fff",fontSize:14,fontWeight:700,opacity:.9,marginLeft:4}}>Enregistrer la recherche</span>
            </div>
            {!saveModalSuccess ? (
              <div style={{padding:"24px 28px 28px"}}>
                <p style={{fontSize:14,color:"#374151",marginBottom:20,lineHeight:1.6}}>
                  Donnez un nom à cette alerte pour la retrouver facilement dans <strong>Mon compte &gt; Mes Alertes</strong>.
                </p>
                <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:8}}>Nom de l'alerte <span style={{color:"#94a3b8",fontWeight:400}}>(facultatif)</span></label>
                <input type="text" value={saveModalName} onChange={e=>setSaveModalName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleSaveSearch()} autoFocus
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,fontSize:14,border:"1.5px solid #e2e8f0",outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"#0f172a"}}/>
                <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
                  <button onClick={()=>setShowSaveModal(false)} style={{padding:"10px 20px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:14,fontWeight:600,color:"#374151",cursor:"pointer"}}>Annuler</button>
                  <button onClick={handleSaveSearch} disabled={saveModalLoading} style={{padding:"10px 26px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",opacity:saveModalLoading?.6:1}}>
                    {saveModalLoading ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{padding:"36px 28px 32px",textAlign:"center"}}>
                <div style={{width:60,height:60,borderRadius:"50%",background:"#f0fdf4",border:"2px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>✅</div>
                <p style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:"0 0 8px"}}>Recherche enregistrée !</p>
                <p style={{fontSize:14,color:"#374151",lineHeight:1.6,margin:"0 0 24px"}}>Vous recevrez des alertes email dès qu'une annonce correspond.<br/>Consultez-les dans <strong>Mon compte &gt; Mes Alertes</strong>.</p>
                <button onClick={()=>setShowSaveModal(false)} style={{padding:"11px 32px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>OK</button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}


      {/* -- CSS -- */}
      <style>{`
        @keyframes carouselInL  { from { transform:translateX(100%); opacity:.6 } to { transform:translateX(0); opacity:1 } }
        @keyframes carouselOutL { from { transform:translateX(0);    opacity:1   } to { transform:translateX(-100%); opacity:.6 } }
        @keyframes carouselInR  { from { transform:translateX(-100%); opacity:.6 } to { transform:translateX(0); opacity:1 } }
        @keyframes carouselOutR { from { transform:translateX(0);     opacity:1   } to { transform:translateX(100%); opacity:.6 } }
        @keyframes fadeIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }

        .cp-root {
          display: flex; flex-direction: column;
          min-height: 100vh; overflow-x: clip;
          background: #fff;
          font-family: 'Poppins', system-ui, sans-serif;
        }
        .cp-root--carte { height: 100vh; height: 100dvh; overflow: hidden; }

        /* --------------------------------------
           PANNEAU FILTRES à light theme
        -------------------------------------- */
        .fp {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 2px 12px rgba(0,0,0,.06);
          padding: 12px 20px 10px;
          position: relative; z-index: 50;
        }

        .fp__row1 {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }

        .fp__search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 240px; }
        .fp__search-wrap .fp__search { flex: 1; min-width: 120px; }
        .fp__submit--search  { flex-shrink: 0; display: none !important; }  /* caché sur desktop, visible sur mobile */
        .fp__submit--desktop { display: flex; }                  /* visible sur desktop après bouton Filtres */
        .fp__search {
          position: relative; display: flex; align-items: center;
          background: #f9fafb; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 0 12px; flex: 1; min-width: 180px;
          transition: border-color .15s, background .15s;
        }
        .fp__search:focus-within {
          background: #fff; border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }
        .fp__search-ico { color: #9ca3af; flex-shrink:0; }
        .fp__search-inp {
          border: none; outline: none; background: transparent;
          color: #111; font-size: 14.5px; font-family: 'Poppins', sans-serif;
          padding: 9px 8px; width: 100%; min-width: 0;
        }
        .fp__search-inp::placeholder { color: #9ca3af; font-family: 'Poppins', sans-serif; }
        .fp__clear {
          display: flex; color: #9ca3af; cursor: pointer;
          padding: 3px; border-radius: 50%; border: none; background: none; flex-shrink:0;
        }
        .fp__clear:hover { color: #374151; background: #f3f4f6; }

        .fp__pill-group { display: flex; gap: 4px; flex-shrink: 0; }
        .fp__pill {
          padding: 7px 14px; border-radius: 20px; font-size: 13.5px;
          font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280;
          transition: all .15s;
        }
        .fp__pill:hover { background: #f3f4f6; border-color: #d1d5db; color: #374151; }

        /* -- Tous -- */
        .fp__pill--tous.fp__pill--on { background: #475569; border-color: #475569; color: #fff; box-shadow: 0 2px 8px rgba(71,85,105,.35); }
        .fp__pill--tous:not(.fp__pill--on):hover { background: #f1f5f9; color: #475569; border-color: #94a3b8; }

        /* -- Achat (vente) � vert (comme le badge carte) -- */
        .fp__pill--vente.fp__pill--on { background: #166534; border-color: #166534; color: #fff; box-shadow: 0 2px 8px rgba(22,101,52,.40); }
        .fp__pill--vente:not(.fp__pill--on):hover { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

        /* -- Location � bleu (comme le badge carte) -- */
        .fp__pill--location.fp__pill--on { background: #1e40af; border-color: #1e40af; color: #fff; box-shadow: 0 2px 8px rgba(30,64,175,.40); }
        .fp__pill--location:not(.fp__pill--on):hover { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }

        /* -- Vacances � ambre -- */
        .fp__pill--vacances.fp__pill--on { background: #f59e0b; border-color: #f59e0b; color: #fff; box-shadow: 0 2px 8px rgba(245,158,11,.40); }
        .fp__pill--vacances:not(.fp__pill--on):hover { background: #fffbeb; color: #d97706; border-color: #fcd34d; }

        .fp__adv-btn {
          display: flex; align-items: center; gap: 6px;
          height: 35px; padding: 0 14px; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280;
          transition: all .15s; white-space: nowrap; box-sizing: border-box;
        }
        .fp__adv-btn:hover { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
        .fp__adv-btn--on { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }

        /* -- Menu "Couche data" (POI multi-choix) — mobile uniquement -- */
        .fp__layers { position: relative; display: none; }
        .fp__layers-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px;
          background: #4338ca; color: #fff; font-size: 10.5px; font-weight: 800;
        }
        .fp__layers-backdrop { position: fixed; inset: 0; z-index: 99998; }
        .fp__layers-menu {
          z-index: 99999;
          width: 230px; max-width: calc(100vw - 16px);
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.16);
          padding: 8px; display: flex; flex-direction: column; gap: 2px;
        }
        .fp__layers-title {
          font-size: 10.5px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: .5px; padding: 6px 8px 8px;
        }
        .fp__layers-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 8px; border-radius: 8px; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: #374151;
          transition: background .12s;
        }
        .fp__layers-item:hover { background: #f3f4f6; }
        .fp__layers-item--on { background: #eef2ff; color: #4338ca; }
        .fp__layers-item input { width: 15px; height: 15px; accent-color: #6366f1; cursor: pointer; flex-shrink: 0; }
        .fp__layers-ico { display: flex; align-items: center; flex-shrink: 0; }
        .fp__layers-lbl { flex: 1; }
        .fp__layers-cnt {
          font-size: 11px; font-weight: 700; color: #6366f1;
          background: #eef2ff; border-radius: 10px; padding: 1px 7px;
        }

        .fp__submit {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 26px; border-radius: 10px; font-size: 14.5px;
          font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          color: #fff; border: none;
          box-shadow: 0 4px 14px rgba(234,88,12,.35);
          transition: transform .12s, box-shadow .12s; white-space: nowrap;
        }
        .fp__submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(234,88,12,.45); }
        .fp__submit:active { transform: scale(.97); }

        .fp__loc-row {
          display: flex; align-items: center; gap: 10px;
          margin-top: 10px; flex-wrap: wrap;
        }

        /* Localisation déplacée dans les filtres : visible uniquement sur mobile */
        .fp__adv-loc { display: none; }
        .fp__adv-cats { display: none; width: 100%; }
        .fp__adv-loc .fp__adv-label { display: block; margin-bottom: 6px; }

        .loc-cascade {
          display: flex; align-items: center; gap: 4px; flex: 1; flex-wrap: wrap;
        }
        .loc-cascade__field {
          display: flex; align-items: center; gap: 6px;
          background: #f9fafb; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 7px 10px;
          transition: all .15s; position: relative;
          flex: 1; min-width: 120px;
        }
        .loc-cascade__field:focus-within {
          background: #fff; border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }
        .loc-cascade__field--disabled { opacity: .4; pointer-events: none; }
        .loc-cascade__arrow { color: #d1d5db; flex-shrink: 0; }

        .lc__ico { font-size: 14px; flex-shrink: 0; }
        .lc__ico--gov { color: #f59e0b; }
        .lc__ico--del { color: #8b5cf6; }
        .lc__ico--loc { color: #06b6d4; }
        .lc__spin { animation: spin .7s linear infinite; color: #9ca3af; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes hoverFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .lc__sel {
          border: none; outline: none; background: transparent;
          color: #374151; font-size: 14px; font-family: 'Poppins', sans-serif; cursor: pointer;
          width: 100%; min-width: 0;
        }
        .lc__sel option { color: #111; background: #fff; font-family: 'Poppins', sans-serif; }

        .fp__poi-group { display: flex; gap: 6px; flex-shrink: 0; }
        .fp__poi-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 8px 13px; border-radius: 20px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid transparent; transition: all .15s;
        }
        /* POI buttons � UNE seule couleur slate, ic�nes différentes, clair/fonc� */
        .fp__poi-btn--school,
        .fp__poi-btn--mosque,
        .fp__poi-btn--faculty,
        .fp__poi-btn--surface,
        .fp__poi-btn--hospital {
          background: #f8fafc; color: #475569; border-color: #cbd5e1;
        }
        .fp__poi-btn--school.fp__poi-btn--on,
        .fp__poi-btn--mosque.fp__poi-btn--on,
        .fp__poi-btn--faculty.fp__poi-btn--on,
        .fp__poi-btn--surface.fp__poi-btn--on,
        .fp__poi-btn--hospital.fp__poi-btn--on {
          background: #334155; color: #fff; border-color: #334155;
          box-shadow: 0 2px 8px rgba(51,65,85,.4);
        }
        .fp__poi-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 5px;
          border-radius: 9px; font-size: 10px; font-weight: 700;
          background: rgba(255,255,255,.3); color: inherit;
          margin-left: 2px;
        }

        .fp__advanced {
          display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap;
          margin-top: 10px; padding: 12px 14px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .fp__adv-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 90px; }
        .fp__adv-group > .fp__adv-sel,
        .fp__adv-group > .fp__adv-inp { width: 100%; min-width: 0; box-sizing: border-box; }
        .fp__adv-label {
          font-size: 10.5px; font-weight: 700;
          color: #9ca3af; text-transform: uppercase; letter-spacing: .5px;
        }
        .fp__adv-label--check {
          display: flex; align-items: center; gap: 7px;
          font-size: 12.5px; font-weight: 600; text-transform: none;
          color: #374151; cursor: pointer; letter-spacing: 0; margin-top: 14px;
        }
        .fp__adv-sel, .fp__adv-inp {
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          padding: 7px 8px; font-size: 12.5px; font-family: inherit;
          background: #fff; color: #374151; outline: none;
          transition: border-color .15s; min-width: 80px;
        }
        .fp__adv-sel:focus, .fp__adv-inp:focus {
          border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.08);
        }
        .fp__adv-inp::placeholder { color: #9ca3af; }
        .fp__adv-group--check { justify-content: flex-end; }
        .fp__save-search {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 8px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          border: 1.5px solid #bbf7d0; background: #f0fdf4; color: #16a34a;
          transition: all .15s; align-self: flex-end;
        }
        .fp__save-search:hover { background: #dcfce7; border-color: #86efac; }
        /* Desktop : Enregistrer dans la barre du bas seulement */
        .fp__save-search--mobile  { display: none; }
        .fp__save-search--desktop { display: flex; }
        .fp__reset {
          display: flex; align-items: center; gap: 6px;
          height: 35px; padding: 0 14px; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280;
          transition: all .15s; align-self: flex-end; white-space: nowrap; box-sizing: border-box;
        }
        .fp__reset:hover { border-color: #d1d5db; color: #374151; background: #f9fafb; }

        /* ── Modal Caractéristiques ── */
        .feat-modal { max-width: 780px !important; }
        .feat-modal__header { padding: 28px 36px 20px !important; }
        .feat-modal__title  { font-size: 24px !important; }
        .feat-modal__sub    { font-size: 15px !important; margin: 6px 0 0 !important; }
        .feat-modal__body   { padding: 24px 32px !important; }
        .feat-modal__section { margin-bottom: 20px; }
        .feat-modal__section-label {
          font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase;
          letter-spacing: .6px; margin-bottom: 10px;
        }
        .feat-modal__grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
        }
        .feat-modal__btn {
          position: relative; display: flex; flex-direction: column; align-items: center;
          gap: 6px; padding: 16px 10px 12px; border-radius: 14px; border: none;
          background: transparent; cursor: pointer; font-family: inherit;
          transition: background .15s; min-height: 80px;
        }
        .feat-modal__btn--on { background: #eef2ff !important; }
        .feat-modal__ico { width: 30px !important; height: 30px !important; color: #94a3b8; transition: color .15s; }
        .feat-modal__btn--on .feat-modal__ico { color: #4f46e5; }
        .feat-modal__lbl {
          font-size: 12px; font-weight: 600; text-align: center; line-height: 1.3; color: #6b7280;
        }
        .feat-modal__btn--on .feat-modal__lbl { color: #4f46e5; }
        .feat-modal__check {
          position: absolute; top: 8px; right: 8px; width: 18px; height: 18px;
          border-radius: 50%; background: #4f46e5;
          display: flex; align-items: center; justify-content: center;
        }
        .feat-modal__footer { padding: 16px 32px 22px !important; }
        .feat-modal__count  { font-size: 14px !important; }
        .feat-modal__clear  { padding: 12px 22px !important; font-size: 14px !important; }
        .feat-modal__apply  { padding: 12px 28px !important; font-size: 14px !important; }

        /* Mobile : tailles plus grandes (format actuel) */
        @media (max-width: 860px) {
          .feat-modal { max-width: 460px !important; }
          .feat-modal__header { padding: 22px 28px 18px !important; }
          .feat-modal__title  { font-size: 19px !important; }
          .feat-modal__sub    { font-size: 13px !important; margin: 4px 0 0 !important; }
          .feat-modal__body   { padding: 20px 28px !important; }
          .feat-modal__section { margin-bottom: 16px; }
          .feat-modal__section-label { font-size: 11px; margin-bottom: 8px; }
          .feat-modal__grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .feat-modal__btn  { padding: 10px 6px 8px; border-radius: 12px; min-height: 60px; gap: 4px; }
          .feat-modal__ico  { width: 22px !important; height: 22px !important; }
          .feat-modal__lbl  { font-size: 10.5px; }
          .feat-modal__check { top: 7px; right: 7px; width: 16px; height: 16px; }
          .feat-modal__footer { padding: 16px 28px 20px !important; }
          .feat-modal__count  { font-size: 13px !important; }
          .feat-modal__clear  { padding: 10px 18px !important; font-size: 13px !important; }
          .feat-modal__apply  { padding: 10px 22px !important; font-size: 13px !important; }
        }

        /* Ligne d'actions : Autres critères (gauche) + Réinitialiser (droite) */
        .fp__adv-actions {
          flex-basis: 100%; width: 100%; display: flex; align-items: center; gap: 8px;
          margin-top: 14px; padding-top: 12px; border-top: 1px solid #eef0f4;
        }
        .fp__adv-actions .fp__reset { margin-left: auto; }

        /* --------------------------------------
           BARRE COMPTEUR / TAGS
        -------------------------------------- */
        .cp-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 16px; background: #f8fafc;
          border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; min-height: 38px;
        }
        .cp-bar__count { font-size: 13px; color: #64748b; white-space: nowrap; font-family: 'Poppins', sans-serif; }
        .cp-bar__count strong { color: #1e293b; }
        .cp-bar__tags  { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex: 1; }
        .cp-bar__clear-all {
          font-size: 12px; color: #94a3b8; cursor: pointer; border: none;
          background: none; font-family: 'Poppins', sans-serif; text-decoration: underline;
          padding: 2px 4px;
        }
        .cp-bar__clear-all:hover { color: #475569; }
        .cp-save-search-bar {
          margin-left: auto; flex-shrink: 0; align-self: center;
        }
        .cp-toggle-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 9px; font-size: 13.5px;
          font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif;
          border: 1.5px solid #6366f1; background: #eef2ff; color: #4338ca;
          transition: all .15s; white-space: nowrap; flex-shrink: 0;
        }
        .cp-toggle-btn:hover { background: #6366f1; color: #fff; }

        /* -- Résumé des filtres actifs (icône + menu) -- */
        .cp-filtersum { position: relative; display: flex; align-items: center; flex-shrink: 0; }
        .cp-compare-mob { display: none; } /* caché desktop, montré mobile via media */
        .cp-filtersum__btn {
          position: relative; display: inline-flex; align-items: center; gap: 7px;
          height: 35px; padding: 0 13px; border-radius: 9px;
          border: 1.5px solid #bbf7d0; background: #f0fdf4; color: #16a34a;
          cursor: pointer; transition: all .15s; flex-shrink: 0;
          font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 600;
        }
        .cp-filtersum__btn:hover { background: #dcfce7; border-color: #86efac; }
        .cp-filtersum__label { white-space: nowrap; }
        .cp-filtersum__badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px;
          background: #16a34a; color: #fff; font-size: 12px; font-weight: 800;
          animation: badge-pop .25s cubic-bezier(.36,.07,.19,.97);
        }
        @keyframes badge-pop {
          0%   { transform: scale(.6); }
          60%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .cp-filtersum__backdrop { position: fixed; inset: 0; z-index: 99998; }
        .cp-filtersum__menu {
          z-index: 99999;
          width: 250px; max-width: calc(100vw - 16px);
          background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0,0,0,.18); padding: 8px;
          display: flex; flex-direction: column; gap: 2px;
          max-height: 60vh; overflow-y: auto;
        }
        .cp-filtersum__title {
          font-size: 10.5px; font-weight: 700; color: #9ca3af; text-transform: uppercase;
          letter-spacing: .5px; padding: 6px 8px 8px;
        }
        .cp-filtersum__row {
          display: flex; align-items: center; gap: 9px;
          padding: 8px; border-radius: 8px; font-size: 13.5px; font-weight: 600; color: #374151;
        }
        .cp-filtersum__row:hover { background: #f8fafc; }
        .cp-filtersum__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .cp-filtersum__lbl { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cp-filtersum__x {
          display: flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 6px; border: none; background: #f1f5f9;
          color: #64748b; cursor: pointer; flex-shrink: 0; transition: all .15s;
        }
        .cp-filtersum__x:hover { background: #fee2e2; color: #dc2626; }
        .cp-filtersum__clear {
          margin-top: 6px; padding: 9px; border-radius: 8px; border: none;
          background: #f1f5f9; color: #475569; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all .15s;
        }
        .cp-filtersum__clear:hover { background: #fee2e2; color: #dc2626; }

        /* --------------------------------------
           LAYOUT CARTE + LISTE
        -------------------------------------- */
        .cp-layout { flex: 1; display: flex; overflow: hidden; }
        .cp-map    { flex: 1; min-width: 0; }

        /* Liste desktop – visible uniquement sur grand écran */
        .cp-list {
          width: 580px; min-width: 380px;
          display: flex; flex-direction: column;
          background: #f8fafc;
          border-left: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .cp-list__header {
          flex-shrink: 0;
          padding: 10px 12px 8px;
          border-bottom: 1px solid #e2e8f0;
          background: #fff;
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: #374151;
        }
        .cp-list__body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          align-content: start;
        }
        .cp-list__body > div { min-width: 0; }
        .cp-list__body .pc   { width: 100%; min-width: 0; }

        /* --------------------------------------
           MODE LISTE SEULE
        -------------------------------------- */
        .cp-listonly {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
          padding: 20px 24px;
          background: #f8fafc;
        }

        .cp-empty {
          text-align: center; padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center;
        }

        /* Cartes compactes dans le panneau liste (2 colonnes) */
        .cp-list__body .pc__body     { padding: 8px 10px 9px; }
        .cp-list__body .pc__price    { font-size: 14px; }
        .cp-list__body .pc__devise   { font-size: 11px; }
        .cp-list__body .pc__title    { font-size: 12px; margin-bottom: 3px; }
        .cp-list__body .pc__loc      { font-size: 11px; margin-bottom: 5px; }
        .cp-list__body .pc__specs    { gap: 5px; padding-top: 5px; }
        .cp-list__body .pc__specs span { font-size: 11px; }
        .cp-list__body .pc__fav      { width: 22px; height: 22px; }

        /* --------------------------------------
           CARTE DE BIEN
        -------------------------------------- */
        .pc {
          background: #fff; border: 1.5px solid #e2e8f0;
          border-radius: 12px; overflow: hidden;
          cursor: pointer; transition: box-shadow .18s, border-color .18s, transform .12s;
        }
        .pc:hover, .pc--active {
          box-shadow: 0 6px 20px rgba(0,0,0,.12);
          border-color: #94a3b8; transform: translateY(-1px);
        }
        .pc__boost-badge {
          position: absolute; top: 8px; left: 8px;
          display: inline-flex; align-items: center; gap: 3px;
          padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;
          background: linear-gradient(135deg,#f59e0b,#f97316); color: #fff;
          box-shadow: 0 2px 6px rgba(249,115,22,.4);
        }
        .pc__cat-badge {
          position: absolute; top: 8px; right: 8px; z-index: 10;
          padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700;
        }
        .pc__cat-badge--vente    { background: #166534; color: #fff; }
        .pc__cat-badge--location { background: #1e40af; color: #fff; }
        .pc__cat-badge--vacances { background: #854d0e; color: #fff; }
        .pc__body  { padding: 12px 14px 13px; }
        .pc__price { font-size: 22px; font-weight: 900; color: #0a0a0a; margin-bottom: 2px; }
        .pc__devise{ font-size: 13px; font-weight: 500; color: #475569; margin-left: 2px; }
        .pc__title {
          font-size: 15px; color: #0a0a0a; font-weight: 700; margin-bottom: 5px; line-height: 1.35;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
        }
        .pc__fav {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #cbd5e1; background: #f1f5f9; border: none; cursor: pointer;
          transition: all .15s;
        }
        .pc__fav:hover { color: #ef4444; background: #fee2e2; }
        .pc__fav--on   { color: #ef4444 !important; background: #fee2e2 !important; }
        .pc__loc {
          display: flex; align-items: center; gap: 3px;
          font-size: 12px; color: #374151; font-weight: 500; margin-bottom: 9px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        }
        .pc__specs {
          display: flex; gap: 10px; flex-wrap: wrap;
          padding-top: 8px; border-top: 1px solid #f1f5f9;
          max-height: 28px; overflow: hidden;
        }
        .pc__specs span {
          display: flex; align-items: center; gap: 3px;
          font-size: 13px; color: #1e293b; font-weight: 500;
        }

        /* -- Barre évaluation prix -- */
        /* Cluster popup � supprimer le padding interne de Leaflet */
        /* Cluster popup � rectangle rigide, grande taille */
        .cluster-popup .leaflet-popup-content-wrapper {
          padding: 0; border-radius: 3px; overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.14);
          border: 1.5px solid #e2e8f0;
        }
        .cluster-popup .leaflet-popup-content { margin: 0; width: auto !important; line-height: 1; }
        .cluster-popup .leaflet-popup-tip-container { display: none; } /* pas de fl�che pointue */
        .cluster-popup .leaflet-popup-close-button {
          top: 8px !important; right: 8px !important;
          background: rgba(0,0,0,.45) !important; color: #fff !important;
          width: 22px !important; height: 22px !important;
          border-radius: 50% !important; font-size: 16px !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          line-height: 1 !important;
        }

        .peb {
          display: flex; flex-direction: column; gap: 4px;
          margin: 5px 0 7px; padding-top: 7px;
          border-top: 1px solid #f1f5f9;
        }
        .peb__label {
          font-size: 9px; font-weight: 800;
          text-transform: uppercase; letter-spacing: .07em;
          line-height: 1;
        }
        .peb__bar { display: flex; gap: 2px; }
        .peb__seg { flex: 1; height: 5px; border-radius: 2px; transition: background .2s; }

        /* --------------------------------------
           PINS CARTE
        -------------------------------------- */
        /* Non-boosted pin � small */
        /* -- Punaises � base -- */
        .pin-dot {
          border-radius: 50%; border: 2.5px solid #fff;
          cursor: pointer; transition: transform .13s, box-shadow .13s;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .pin-dot:hover, .pin-dot--active { transform: scale(1.4); z-index: 999 !important; }

        /* -- Achat / vente � vert (comme badge carte) -- */
        .pin-dot--vente {
          width: 20px; height: 20px;
          background: #166534;
          box-shadow: 0 2px 8px rgba(22,101,52,.50);
        }
        .pin-dot--vente:hover, .pin-dot--vente.pin-dot--active {
          background: #14532d;
          box-shadow: 0 3px 14px rgba(22,101,52,.70);
        }
        /* -- Location � bleu indigo (comme badge carte) -- */
        .pin-dot--location {
          width: 20px; height: 20px;
          background: #1e40af;
          box-shadow: 0 2px 8px rgba(30,64,175,.50);
        }
        .pin-dot--location:hover, .pin-dot--location.pin-dot--active {
          background: #1e3a8a;
          box-shadow: 0 3px 14px rgba(30,64,175,.70);
        }
        /* -- Vacances � ambre -- */
        .pin-dot--vacances {
          width: 20px; height: 20px;
          background: #d97706;
          box-shadow: 0 2px 8px rgba(217,119,6,.50);
        }
        .pin-dot--vacances:hover, .pin-dot--vacances.pin-dot--active {
          background: #b45309;
          box-shadow: 0 3px 14px rgba(217,119,6,.70);
        }
        /* -- Fallback bordeaux -- */
        .pin-dot--std {
          width: 20px; height: 20px;
          background: #9b1c2e;
          box-shadow: 0 2px 8px rgba(155,28,46,.45);
        }
        .pin-dot--std:hover, .pin-dot--std.pin-dot--active {
          background: #7c1022;
          box-shadow: 0 3px 14px rgba(155,28,46,.65);
        }

        /* Ic�nes internes */
        .pin-star {
          font-size: 13px; color: #fff; line-height: 1;
          pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,.4);
        }
        .pin-icon {
          font-size: 14px; line-height: 1;
          pointer-events: none; filter: drop-shadow(0 1px 1px rgba(0,0,0,.3));
        }

        /* POI markers */
        /* -- POI markers � carr� arrondi pour se distinguer visuellement
              des punaises rondes des annonces -- */
        .poi-icon {
          width: 30px; height: 30px;
          border-radius: 8px;          /* ? CARR� ARRONDI ? cercle des pins */
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,.28);
          cursor: pointer; transition: transform .12s;
        }
        .poi-icon:hover { transform: scale(1.15); }

        /* Couleurs distinctes de tous les niveaux de pins :
           pins = orange / dor� / indigo / gris
           POI  = cyan / vert �meraude / violet fonc�               */
        .poi-icon--school  { background: #0ea5e9; }   /* cyan  � ? indigo pins */
        .poi-icon--mosque  { background: #059669; }   /* �meraude � aucun pin n'est vert */
        .poi-icon--faculty { background: #7c3aed; }   /* violet fonc� � aucun pin n'est violet */

        /* --------------------------------------
           RESPONSIVE
        -------------------------------------- */

        /* Drag handle mobile — caché sur desktop */
        .cp-drag-handle {
          display: none;
        }
        .cp-drag-handle__bar {
          width: 36px; height: 4px; border-radius: 2px;
          background: #cbd5e1; display: block;
        }

        @media (max-width: 860px) {
          /* Supprimer le gap visuel entre Navbar et la barre de filtres */
          .cp-root--carte .lz-nav {
            border-bottom-color: transparent !important;
            box-shadow: none !important;
          }
          /* Sur mobile : sticky-bar devient relative + overflow-y:auto */
          .cp-sticky-bar {
            position: relative !important;
            top: 0 !important;
            flex-shrink: 0;
            overflow-y: auto;
          }
          .cp-drag-handle {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 28px;
            min-height: 28px;
            background: #f8fafc;
            border-top: 2px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
            cursor: ns-resize;
            touch-action: none;
            flex-shrink: 0;
            z-index: 199;
          }
          .cp-drag-handle__bar { background: #94a3b8; width: 40px; height: 3px; border-radius: 2px; }
          /* cp-root sur mobile : colonne flex qui couvre tout l'écran */
          .cp-root--carte {
            height: 100dvh !important;
            overflow: hidden !important;
            display: flex;
            flex-direction: column;
          }
          /* cp-bar sous le drag handle sur mobile — flex-shrink:0 pour ne jamais disparaître */
          .cp-bar { flex-shrink: 0; }
          .cp-layout   { flex-direction: column; flex: 1; min-height: 0; }
          .cp-map      { flex: 1; min-height: 0; height: 100%; }
          .cp-list     { display: none !important; }
          /* Vue liste mobile : 2 colonnes compactes, comme la home page */
          .cp-listonly {
            grid-template-columns: 1fr 1fr;
            padding: 10px 12px;
            gap: 10px;
            flex: 1; overflow-y: auto; min-height: 0;
          }
          .cp-listonly > div { width: 100%; min-width: 0; }
          .cp-listonly .pc   { width: 100%; min-width: 0; border-radius: 12px; }
          /* Corps vignette compact */
          .cp-listonly .pc__body        { padding: 8px 10px 9px !important; }
          .cp-listonly .pc__price       { font-size: 14px !important; }
          .cp-listonly .pc__devise      { font-size: 11px !important; }
          .cp-listonly .pc__title       { font-size: 12px !important; margin-bottom: 3px !important; }
          .cp-listonly .pc__loc         { font-size: 11px !important; margin-bottom: 5px !important; }
          .cp-listonly .pc__specs       { gap: 4px !important; padding-top: 5px !important; }
          .cp-listonly .pc__specs span  { font-size: 11px !important; }
          .cp-listonly .pc__fav         { width: 22px !important; height: 22px !important; }
          /* cp-bar mobile : compteur à gauche — filtres/trier/vue à droite — 1 seule ligne */
          .cp-bar {
            padding: 8px 10px; min-height: 38px; flex-wrap: nowrap;
            gap: 0; overflow: hidden; justify-content: space-between;
          }
          .cp-layout   { margin-top: 3px; }
          .cp-bar__count { font-size: 12px; flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: auto; }
          .cp-bar__tags { display: none; }
          /* CompareBar masqué sur mobile */
          .cp-bar > div:nth-child(2) { display: none !important; }
          /* Icône comparateur visible sur mobile uniquement */
          .cp-compare-mob { display: flex; }
          /* Groupe boutons droite */
          .cp-filtersum { margin-left: 10px; }
          .cp-bar > button.cp-toggle-btn { margin-left: 6px; }
          /* cp-toggle-btn compact sur mobile */
          .cp-toggle-btn { padding: 5px 10px; font-size: 12px; gap: 4px; }
          /* Bouton Enregistrer desktop — caché sur mobile dans cp-bar */
          .fp__save-search--desktop { display: none; }
          /* Bouton Rechercher — visible sur mobile, caché sur desktop */
          .fp__submit--search { display: flex !important; }
          /* Bouton Trier — masqué en vue carte sur mobile, visible en vue liste */
          .cp-sort-map-hidden { display: none !important; }

          /* -- Panneau filtres : tout empil� verticalement -- */
          .fp          { padding: 10px 12px 12px; }

          /* Ligne 1 : barre de recherche + boutons Filtres/Enregistrer */
          .fp__row1    { flex-direction: column; gap: 8px; align-items: stretch; }
          .fp__search-wrap { min-width: 0; gap: 6px; }
          .fp__search  { min-width: 0; }
          .fp__pill-group { display: none; }          /* cachées sur mobile */
          .fp__pill-group--mobile { display: flex; flex-wrap: nowrap; gap: 6px; width: 100%; }
          .fp__pill-group--mobile .fp__pill {
            flex: 1 1 0; min-width: 0;
            font-size: 12px; padding: 8px 4px;
            text-align: center; letter-spacing: 0;
            white-space: nowrap; overflow: hidden;
            text-overflow: clip;
          }
          /* Les 3 boutons (Couche data / Filtres / Enregistrer) partagent la ligne à parts égales → toujours UNE seule ligne */
          .fp__row1 > div:last-child { flex-direction: row; flex-wrap: nowrap; gap: 5px; margin-left: 0; width: 100%; }
          .fp__layers { display: block; flex: 1 1 0; min-width: 0; }
          .fp__layers .fp__adv-btn { width: 100%; }
          /* Mobile : bouton filtres actifs compact (icône seule, badge absolu) */
          .cp-filtersum__btn {
            width: 34px; height: 34px; padding: 0; border-radius: 9px; gap: 0;
            border-color: #e2e8f0; background: #fff; color: #475569; font-size: 0;
            justify-content: center;
          }
          .cp-filtersum__btn:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
          .cp-filtersum__label { display: none; }
          .cp-filtersum__badge {
            position: absolute; top: -6px; right: -6px;
            min-width: 16px; height: 16px; padding: 0 4px;
            font-size: 10px; background: #6366f1;
          }

          /* Mobile : Enregistrer dans le panneau filtre, pas dans la barre du bas */
          .fp__save-search--mobile  { display: flex; }
          .fp__save-search--desktop { display: none; }
          .fp__row1 > div:last-child > .fp__adv-btn,
          .fp__row1 > div:last-child .fp__save-search { flex: 1 1 0; min-width: 0; }
          .fp__row1 > div:last-child .fp__adv-btn,
          .fp__row1 > div:last-child .fp__save-search {
            height: 34px; padding: 0 6px; font-size: 11.5px; justify-content: center; gap: 4px;
          }
          .fp__row1 > div:last-child .fp__adv-btn span {
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          /* Chevrons masqués sur mobile pour gagner de la place */
          .fp__row1 > div:last-child .fp__adv-btn > svg:last-child { display: none; }

          /* Rechercher (ligne du champ) — mobile uniquement */
          .fp__submit--search  { display: flex !important; flex-shrink: 0; }
          .fp__submit--desktop { display: none !important; }
          .fp__submit { padding: 9px 14px !important; font-size: 13px; font-weight: 700; }

          /* Localisation : retirée de la barre principale, déplacée dans les filtres */
          .fp__loc-row        { display: none !important; }
          .fp__adv-loc        { display: block; }
          .fp__adv-cats       { display: block; }
          .loc-cascade        { flex-direction: column; gap: 6px; width: 100%; }
          .loc-cascade__arrow { display: none; }
          .loc-cascade__field { width: 100%; flex: none; min-width: 0; }

          /* -- Panneau Filtres : grille 2 colonnes, agencement compact, scrollable -- */
          .fp__advanced { display: grid !important; grid-template-columns: 1fr 1fr; align-items: start; gap: 10px; max-height: 42vh; max-height: 42dvh; overflow-y: auto; }
          .fp__advanced > * { align-self: start !important; flex: none !important; min-width: 0 !important; }
          .fp__advanced .fp__adv-sel,
          .fp__advanced .fp__adv-inp { min-width: 0 !important; }
          /* Champs pleine largeur : Catégorie, Localisation, Type de bien, Colocation, ligne d'actions */
          .fp__adv-cats,
          .fp__adv-loc,
          .fp__adv-group--full,
          .fp__adv-actions { grid-column: 1 / -1; }
          .fp__adv-actions { align-self: start !important; }
          /* Bouton Rechercher en bas du panneau — mobile seulement */
          .fp__adv-search-btn {
            grid-column: 1 / -1; display: flex; align-items: center; justify-content: center;
            gap: 7px; width: 100%; padding: 11px 0; border-radius: 10px;
            background: #f97316; color: #fff; border: none; font-size: 14px;
            font-weight: 700; cursor: pointer; font-family: inherit;
            margin-top: 4px;
          }
        }
        /* Bouton caché sur desktop */
        .fp__adv-search-btn { display: none; }

        @media (max-width: 640px) {
          .cp-listonly { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
