import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import API_URL from '../config';
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, ChevronLeft, ChevronRight, Bed, Bath, Maximize,
  MapPin, Heart, X, SlidersHorizontal, Star, School, Moon,
  ChevronDown, Loader2, LayoutList, Map as MapIcon,
  Waves, Mountain, TreePine, Fence, Sun, Flower2, Droplets, ParkingCircle,
  ArrowUpDown, Car, Package, Sofa, Users, ShieldCheck,
  UtensilsCrossed, Wind, Thermometer, Flame, DoorClosed, LockKeyhole,
  Fingerprint, Wifi, Monitor, RefreshCw, KeyRound, PhoneCall, Check
} from "lucide-react";
import Navbar from "../components/Navbar";
import useLocalisation from "../hooks/useLocalisation";
import "leaflet/dist/leaflet.css";

/* ─────────────────────────────────────────────────────────────
   DÉMO — 35 annonces réparties sur toute la Tunisie
───────────────────────────────────────────────────────────── */
const DEMO = [
  { id:1,  titre:"Villa 4 ch. — La Marsa",         prix:850000,  devise:"TND",       gouvernorat:"Tunis",     delegation:"La Marsa",         localite:"Ain Zaghouan",   beds:4, baths:3, area:320,  type:"villa",       categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:3, lat:36.879, lng:10.325, images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75","https://images.unsplash.com/photo-1600607687939-ce8a6d338c45?w=600&q=75","https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=600&q=75"] },
  { id:2,  titre:"Appartement S+3 — Lac 2",          prix:320000,  devise:"TND",       gouvernorat:"Tunis",     delegation:"El Menzah",        localite:"Lac 2",          beds:3, baths:2, area:145,  type:"appartement", categorie:"vente",    etat:"nouveau",    titre_foncier:true,  boost:2, lat:36.838, lng:10.235, images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75","https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=75"] },
  { id:3,  titre:"Terrain résidentiel — Sousse",     prix:180000,  devise:"TND",       gouvernorat:"Sousse",    delegation:"Sousse Nord",      localite:"Khezama",        beds:null,baths:null,area:500, type:"terrain",     categorie:"vente",    etat:null,         titre_foncier:true,  boost:0, lat:35.870, lng:10.590, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75"] },
  { id:4,  titre:"Appartement meublé vue mer",       prix:1800,    devise:"TND/mois",  gouvernorat:"Nabeul",    delegation:"Hammamet",         localite:"Hammamet Nord",  beds:2, baths:1, area:85,   type:"appartement", categorie:"location", etat:"bon_etat",   titre_foncier:false, boost:1, lat:36.400, lng:10.620, images:["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=75","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75"] },
  { id:5,  titre:"Villa piscine — Gammarth",         prix:1200000, devise:"TND",       gouvernorat:"Tunis",     delegation:"La Marsa",         localite:"Gammarth",       beds:5, baths:4, area:420,  type:"villa",       categorie:"vente",    etat:"nouveau",    titre_foncier:true,  boost:3, lat:36.903, lng:10.299, images:["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=75","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"] },
  { id:6,  titre:"Duplex — Ennasr",                  prix:290000,  devise:"TND",       gouvernorat:"Ariana",    delegation:"Ariana Ville",     localite:"Ennasr 2",       beds:3, baths:2, area:165,  type:"appartement", categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:2, lat:36.860, lng:10.195, images:["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=75","https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=600&q=75"] },
  { id:7,  titre:"Studio meublé — Centre Tunis",     prix:900,     devise:"TND/mois",  gouvernorat:"Tunis",     delegation:"Tunis Ville",      localite:"Passage",        beds:1, baths:1, area:45,   type:"appartement", categorie:"location", etat:"bon_etat",   titre_foncier:false, boost:0, lat:36.819, lng:10.165, images:["https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=600&q=75"] },
  { id:8,  titre:"Ferme agricole — Mornag",          prix:350000,  devise:"TND",       gouvernorat:"Ben Arous", delegation:"Mornag",           localite:"Mornag",         beds:null,baths:1, area:5000, type:"ferme",       categorie:"vente",    etat:"a_renover",  titre_foncier:true,  boost:0, lat:36.710, lng:10.280, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75"] },
  { id:9,  titre:"Terrain zone commerciale — Sfax",  prix:420000,  devise:"TND",       gouvernorat:"Sfax",      delegation:"Sfax Sud",         localite:"Agareb",         beds:null,baths:null,area:800, type:"terrain",     categorie:"vente",    etat:null,         titre_foncier:true,  boost:1, lat:34.710, lng:10.745, images:["https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&q=75"] },
  { id:10, titre:"Villa R+1 — Sfax Centre",          prix:650000,  devise:"TND",       gouvernorat:"Sfax",      delegation:"Sfax Ville",       localite:"Centre Ville",   beds:4, baths:3, area:280,  type:"villa",       categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:2, lat:34.750, lng:10.770, images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75","https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=600&q=75"] },
  { id:11, titre:"Appartement neuf — Sfax",          prix:185000,  devise:"TND",       gouvernorat:"Sfax",      delegation:"Sfax Ville",       localite:"Sfax Ville",     beds:2, baths:1, area:95,   type:"appartement", categorie:"vente",    etat:"nouveau",    titre_foncier:true,  boost:0, lat:34.740, lng:10.760, images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75"] },
  { id:12, titre:"Bureau — Centre Urbain Nord",      prix:2500,    devise:"TND/mois",  gouvernorat:"Tunis",     delegation:"El Menzah",        localite:"Centre Urbain",  beds:null,baths:1, area:120,  type:"bureau",      categorie:"location", etat:"nouveau",    titre_foncier:false, boost:1, lat:36.855, lng:10.194, images:["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75"] },
  { id:13, titre:"Villa vacances — Djerba",          prix:3500,    devise:"TND/semaine",gouvernorat:"Médenine",  delegation:"Djerba Houmt Souk",localite:"Midoun",         beds:4, baths:2, area:200,  type:"villa",       categorie:"vacances", etat:"bon_etat",   titre_foncier:false, boost:2, lat:33.830, lng:10.870, images:["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=75","https://images.unsplash.com/photo-1600607687939-ce8a6d338c45?w=600&q=75"] },
  { id:14, titre:"Appartement — Sousse Corniche",    prix:250000,  devise:"TND",       gouvernorat:"Sousse",    delegation:"Sousse Ville",     localite:"Corniche",       beds:2, baths:1, area:100,  type:"appartement", categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:1, lat:35.826, lng:10.640, images:["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=75"] },
  { id:15, titre:"Terrain agricole — Grombalia",     prix:95000,   devise:"TND",       gouvernorat:"Nabeul",    delegation:"Grombalia",        localite:"Grombalia",      beds:null,baths:null,area:2000,type:"terrain",     categorie:"vente",    etat:null,         titre_foncier:true,  boost:0, lat:36.601, lng:10.504, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75"] },
  { id:16, titre:"Local commercial — Bizerte",       prix:3200,    devise:"TND/mois",  gouvernorat:"Bizerte",   delegation:"Bizerte Nord",     localite:"Centre Ville",   beds:null,baths:1, area:180,  type:"local_commercial",categorie:"location", etat:"bon_etat",titre_foncier:false,  boost:1, lat:37.270, lng:9.873,  images:["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75"] },
  { id:17, titre:"Villa haut standing — Monastir",   prix:720000,  devise:"TND",       gouvernorat:"Monastir",  delegation:"Monastir",         localite:"Skanes",         beds:4, baths:3, area:310,  type:"villa",       categorie:"vente",    etat:"nouveau",    titre_foncier:true,  boost:3, lat:35.790, lng:10.800, images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=75"] },
  { id:18, titre:"S+2 meublé — Nabeul Centre",       prix:1200,    devise:"TND/mois",  gouvernorat:"Nabeul",    delegation:"Nabeul",           localite:"Centre Ville",   beds:2, baths:1, area:80,   type:"appartement", categorie:"location", etat:"bon_etat",   titre_foncier:false, boost:0, lat:36.455, lng:10.736, images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75"] },
  { id:19, titre:"Terrain vue mer — Kelibia",        prix:220000,  devise:"TND",       gouvernorat:"Nabeul",    delegation:"Kelibia",          localite:"Kelibia",        beds:null,baths:null,area:750, type:"terrain",     categorie:"vente",    etat:null,         titre_foncier:true,  boost:2, lat:36.847, lng:11.109, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75"] },
  { id:20, titre:"Appartement S+4 — Ariana",         prix:380000,  devise:"TND",       gouvernorat:"Ariana",    delegation:"Raoued",           localite:"Raoued Plage",   beds:4, baths:2, area:190,  type:"appartement", categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:1, lat:36.892, lng:10.180, images:["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=75"] },
  { id:21, titre:"Villa balnéaire — Mahdia",         prix:550000,  devise:"TND",       gouvernorat:"Mahdia",    delegation:"Mahdia",           localite:"Cap Afrique",    beds:3, baths:2, area:220,  type:"villa",       categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:1, lat:35.495, lng:11.065, images:["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=75"] },
  { id:22, titre:"Bureau moderne — La Soukra",       prix:1800,    devise:"TND/mois",  gouvernorat:"Ariana",    delegation:"La Soukra",        localite:"La Soukra",      beds:null,baths:1, area:95,   type:"bureau",      categorie:"location", etat:"nouveau",    titre_foncier:false, boost:0, lat:36.880, lng:10.210, images:["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75"] },
  { id:23, titre:"Maison R+1 — Kairouan",            prix:195000,  devise:"TND",       gouvernorat:"Kairouan",  delegation:"Kairouan Nord",    localite:"Centre Ville",   beds:3, baths:2, area:160,  type:"villa",       categorie:"vente",    etat:"a_renover",  titre_foncier:true,  boost:0, lat:35.680, lng:10.100, images:["https://images.unsplash.com/photo-1600607687939-ce8a6d338c45?w=600&q=75"] },
  { id:24, titre:"Appartement S+1 — Gafsa",          prix:85000,   devise:"TND",       gouvernorat:"Gafsa",     delegation:"Gafsa Nord",       localite:"Centre",         beds:1, baths:1, area:55,   type:"appartement", categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:0, lat:34.422, lng:8.774,  images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75"] },
  { id:25, titre:"Villa désert — Tozeur",            prix:480000,  devise:"TND",       gouvernorat:"Tozeur",    delegation:"Tozeur",           localite:"Nefta",          beds:4, baths:2, area:260,  type:"villa",       categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:1, lat:33.911, lng:8.126,  images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"] },
  { id:26, titre:"Résidence touristique — Djerba",   prix:4200,    devise:"TND/semaine",gouvernorat:"Médenine",  delegation:"Djerba Houmt Souk",localite:"Houmt Souk",     beds:3, baths:2, area:150,  type:"appartement", categorie:"vacances", etat:"nouveau",    titre_foncier:false, boost:3, lat:33.875, lng:10.860, images:["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=75","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=75"] },
  { id:27, titre:"Local entrepôt — Ben Arous",       prix:5000,    devise:"TND/mois",  gouvernorat:"Ben Arous", delegation:"Ezzahra",          localite:"Ezzahra",        beds:null,baths:1, area:600,  type:"local_commercial",categorie:"location",etat:"bon_etat",titre_foncier:false,  boost:0, lat:36.742, lng:10.234, images:["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75"] },
  { id:28, titre:"S+3 neuf — Manouba",               prix:260000,  devise:"TND",       gouvernorat:"Manouba",   delegation:"Manouba",          localite:"Manouba",        beds:3, baths:2, area:130,  type:"appartement", categorie:"vente",    etat:"nouveau",    titre_foncier:true,  boost:0, lat:36.808, lng:10.098, images:["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=75"] },
  { id:29, titre:"Terrain — Zaghouan",               prix:70000,   devise:"TND",       gouvernorat:"Zaghouan",  delegation:"Zaghouan",         localite:"Zaghouan",       beds:null,baths:null,area:1200,type:"terrain",     categorie:"vente",    etat:null,         titre_foncier:true,  boost:0, lat:36.402, lng:10.145, images:["https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&q=75"] },
  { id:30, titre:"Villa pied dans l'eau — Tabarka",  prix:890000,  devise:"TND",       gouvernorat:"Jendouba",  delegation:"Tabarka",          localite:"Tabarka",        beds:5, baths:3, area:380,  type:"villa",       categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:2, lat:36.955, lng:8.760,  images:["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=75","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"] },
  { id:31, titre:"Riad rénové — Médina Tunis",       prix:420000,  devise:"TND",       gouvernorat:"Tunis",     delegation:"Tunis Ville",      localite:"Médina",         beds:4, baths:3, area:210,  type:"villa",       categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:1, lat:36.799, lng:10.172, images:["https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=600&q=75"] },
  { id:32, titre:"Studio vue — Sidi Bou Said",       prix:1600,    devise:"TND/mois",  gouvernorat:"Tunis",     delegation:"Carthage",         localite:"Sidi Bou Said",  beds:1, baths:1, area:50,   type:"appartement", categorie:"location", etat:"bon_etat",   titre_foncier:false, boost:1, lat:36.870, lng:10.347, images:["https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=600&q=75"] },
  { id:33, titre:"Penthouse — Ain Zaghouan",         prix:590000,  devise:"TND",       gouvernorat:"Tunis",     delegation:"El Menzah",        localite:"Ain Zaghouan",   beds:4, baths:2, area:220,  type:"appartement", categorie:"vente",    etat:"nouveau",    titre_foncier:true,  boost:3, lat:36.843, lng:10.218, images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75","https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=75"] },
  { id:34, titre:"Villa côtière — Hammamet",         prix:980000,  devise:"TND",       gouvernorat:"Nabeul",    delegation:"Hammamet",         localite:"Hammamet Sud",   beds:5, baths:4, area:400,  type:"villa",       categorie:"vente",    etat:"nouveau",    titre_foncier:true,  boost:3, lat:36.375, lng:10.562, images:["https://images.unsplash.com/photo-1600607687939-ce8a6d338c45?w=600&q=75","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=75"] },
  { id:35, titre:"Appartement — Sousse Kantaoui",    prix:310000,  devise:"TND",       gouvernorat:"Sousse",    delegation:"Hammam Sousse",    localite:"Port El Kantaoui",beds:3, baths:2, area:135,  type:"appartement", categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:1, lat:35.890, lng:10.610, images:["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=75"] },
  { id:36, titre:"Villa pieds dans l'eau — Tabarka", prix:920000,  devise:"TND",       gouvernorat:"Jendouba",  delegation:"Tabarka",          localite:"Tabarka",        beds:4, baths:3, area:290,  type:"bord_eau",    categorie:"vente",    etat:"bon_etat",   titre_foncier:true,  boost:2, lat:36.960, lng:8.756, images:["https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=75"] },
  { id:37, titre:"Appartement front de mer — Sfax",  prix:1400,    devise:"TND/mois",  gouvernorat:"Sfax",      delegation:"Sfax Ville",       localite:"Corniche",       beds:2, baths:1, area:90,   type:"bord_eau",    categorie:"location", etat:"bon_etat",   titre_foncier:false, boost:1, lat:34.740, lng:10.775, images:["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=75"] },
  { id:38, titre:"Chalet balnéaire — Kelibia",       prix:2800,    devise:"TND/semaine",gouvernorat:"Nabeul",    delegation:"Kelibia",          localite:"Kelibia Plage",  beds:3, baths:2, area:120,  type:"bord_eau",    categorie:"vacances", etat:"bon_etat",   titre_foncier:false, boost:3, lat:36.842, lng:11.103, images:["https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=75"] },
];

/* ─────────────────────────────────────────────────────────────
   POI ICON HELPER — circular divIcon markers
───────────────────────────────────────────────────────────── */
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

/* SVG paths — partagés entre les marqueurs de carte ET les boutons filtres */
/* Écoles : livre ouvert */
const SCHOOL_SVG   = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
const MOSQUE_SVG   = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
/* Faculté : chapeau académique (mortier) */
const FACULTY_SVG  = '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>';
/* Grande surface : chariot de supermarché (ancien, restauré) */
const SURFACE_SVG  = '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>';

/* Petit SVG React pour les boutons (même chemin que les marqueurs de carte) */
const PoiSvg = ({ path, size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: path }}
  />
);

/* POIs — Écoles & Mosquées (démo) */
const SCHOOLS = [
  { id:"sc1", nom:"Lycée Pilote de Tunis",        lat:36.821, lng:10.159, gov:"Tunis"   },
  { id:"sc2", nom:"Collège Ibn Khaldoun",          lat:36.833, lng:10.171, gov:"Tunis"   },
  { id:"sc3", nom:"École El Menzah VI",            lat:36.846, lng:10.206, gov:"Tunis"   },
  { id:"sc4", nom:"Lycée Technique Ariana",        lat:36.866, lng:10.197, gov:"Ariana"  },
  { id:"sc5", nom:"Collège La Soukra",             lat:36.882, lng:10.213, gov:"Ariana"  },
  { id:"sc6", nom:"Lycée Habib Bourguiba Sousse",  lat:35.830, lng:10.638, gov:"Sousse"  },
  { id:"sc7", nom:"École Primaire Port Kantaoui",  lat:35.892, lng:10.612, gov:"Sousse"  },
  { id:"sc8", nom:"Lycée Farhat Hached Sfax",      lat:34.744, lng:10.762, gov:"Sfax"    },
  { id:"sc9", nom:"Collège Ibn Sina Sfax",         lat:34.737, lng:10.756, gov:"Sfax"    },
  { id:"sc10",nom:"École Tahar Haddad Hammamet",   lat:36.403, lng:10.617, gov:"Nabeul"  },
  { id:"sc11",nom:"Lycée Pilote Nabeul",           lat:36.458, lng:10.732, gov:"Nabeul"  },
  { id:"sc12",nom:"École Erriadh Monastir",        lat:35.785, lng:10.815, gov:"Monastir"},
  { id:"sc13",nom:"Collège Djerba Midoun",         lat:33.825, lng:10.885, gov:"Médenine"},
  { id:"sc14",nom:"Lycée Teboulba Ben Arous",      lat:36.720, lng:10.240, gov:"Ben Arous"},
];

const MOSQUES = [
  { id:"mo1", nom:"Mosquée Zitouna",               lat:36.798, lng:10.174, gov:"Tunis"   },
  { id:"mo2", nom:"Mosquée El Fath Lac",           lat:36.840, lng:10.234, gov:"Tunis"   },
  { id:"mo3", nom:"Mosquée Ennasr",                lat:36.858, lng:10.193, gov:"Ariana"  },
  { id:"mo4", nom:"Mosquée Raoued",                lat:36.890, lng:10.177, gov:"Ariana"  },
  { id:"mo5", nom:"Mosquée Boujemaa Sousse",       lat:35.826, lng:10.636, gov:"Sousse"  },
  { id:"mo6", nom:"Mosquée Sidi Bouali Sousse",    lat:35.818, lng:10.644, gov:"Sousse"  },
  { id:"mo7", nom:"Mosquée Trois Portes Sfax",     lat:34.739, lng:10.759, gov:"Sfax"    },
  { id:"mo8", nom:"Mosquée Sidi Lakhmi Sfax",      lat:34.746, lng:10.767, gov:"Sfax"    },
  { id:"mo9", nom:"Mosquée El Kebir Hammamet",     lat:36.397, lng:10.621, gov:"Nabeul"  },
  { id:"mo10",nom:"Mosquée Nabeul Ville",          lat:36.452, lng:10.739, gov:"Nabeul"  },
  { id:"mo11",nom:"Mosquée Monastir Médina",       lat:35.776, lng:10.827, gov:"Monastir"},
  { id:"mo12",nom:"Mosquée Erriadh Djerba",        lat:33.833, lng:10.862, gov:"Médenine"},
  { id:"mo13",nom:"Mosquée Ben Arous",             lat:36.753, lng:10.229, gov:"Ben Arous"},
  { id:"mo14",nom:"Mosquée Kairouan Okba",         lat:35.681, lng:10.098, gov:"Kairouan"},
];

/* POIs statiques — Facultés & Grandes surfaces (fallback si Overpass indisponible) */
const FACULTIES = [
  { id:"fac1", nom:"Université Tunis El Manar",        lat:36.838, lng:10.168, gov:"Tunis"    },
  { id:"fac2", nom:"Faculté des Sciences de Tunis",    lat:36.835, lng:10.172, gov:"Tunis"    },
  { id:"fac3", nom:"INSAT Tunis",                      lat:36.855, lng:10.197, gov:"Tunis"    },
  { id:"fac4", nom:"Université Carthage",              lat:36.870, lng:10.184, gov:"Tunis"    },
  { id:"fac5", nom:"ISSAT Sousse",                     lat:35.822, lng:10.631, gov:"Sousse"   },
  { id:"fac6", nom:"Faculté de Médecine Sousse",       lat:35.840, lng:10.647, gov:"Sousse"   },
  { id:"fac7", nom:"Université de Sfax",               lat:34.749, lng:10.758, gov:"Sfax"     },
  { id:"fac8", nom:"FSEG Sfax",                        lat:34.740, lng:10.752, gov:"Sfax"     },
  { id:"fac9", nom:"IPEIM Monastir",                   lat:35.778, lng:10.826, gov:"Monastir" },
  { id:"fac10",nom:"Université Manouba",               lat:36.828, lng:10.093, gov:"Manouba"  },
  { id:"fac11",nom:"ISG Tunis",                        lat:36.812, lng:10.147, gov:"Tunis"    },
  { id:"fac12",nom:"Faculté Droit Sciences Politiques",lat:36.795, lng:10.181, gov:"Tunis"    },
];

const GRAND_SURFACES = [
  { id:"gs1", nom:"Carrefour Lac Tunis",               lat:36.841, lng:10.237, gov:"Tunis"    },
  { id:"gs2", nom:"Géant Casino Ennasr",               lat:36.859, lng:10.192, gov:"Ariana"   },
  { id:"gs3", nom:"Monoprix Menzah",                   lat:36.848, lng:10.207, gov:"Tunis"    },
  { id:"gs4", nom:"Carrefour Market Ariana",           lat:36.866, lng:10.199, gov:"Ariana"   },
  { id:"gs5", nom:"Azur Sousse",                       lat:35.834, lng:10.641, gov:"Sousse"   },
  { id:"gs6", nom:"Carrefour Market Sfax",             lat:34.741, lng:10.763, gov:"Sfax"     },
  { id:"gs7", nom:"Géant Hammamet",                    lat:36.405, lng:10.624, gov:"Nabeul"   },
  { id:"gs8", nom:"Monoprix Centre-ville Tunis",       lat:36.803, lng:10.180, gov:"Tunis"    },
  { id:"gs9", nom:"Carrefour Ben Arous",               lat:36.741, lng:10.226, gov:"Ben Arous" },
  { id:"gs10",nom:"MG Monastir",                       lat:35.781, lng:10.831, gov:"Monastir" },
];

const TYPES    = ["appartement","villa_maison","terrain","bureau","ferme","local_commercial","immobiliers_divers"];
const TYPE_LBL = {
  appartement:"Appartement", villa:"Villa", villa_maison:"Villa/Maison", terrain:"Terrain",
  bureau:"Bureau", ferme:"Ferme", local_commercial:"Local commercial",
  immobiliers_divers:"Immobiliers divers",
};
const ETATS    = ["nouveau","bon_etat","a_renover","cours_construction"];
const ETAT_LBL = { nouveau:"Neuf", bon_etat:"Bon état", a_renover:"À rénover", cours_construction:"En construction" };
const CAT_LBL    = { vente:"Achat", location:"Location", vacances:"Vacances" };
const CAT_COLORS = { vente:"#166534", location:"#1e40af", vacances:"#d97706" }; // vert / bleu / ambre

function fmtPin(p)  { return p >= 1e6 ? `${(p/1e6).toFixed(1)}M` : p >= 1000 ? `${Math.round(p/1000)}k` : `${p}`; }
function fmtFull(p) { return p.toLocaleString("fr-TN"); }
function ucFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g," ") : ""; }

/* ─── Carrousel ─── */
function Carousel({ images, h = 190 }) {
  const [idx, setIdx] = useState(0);
  const prev = (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); };
  return (
    <div style={{ position:"relative", height:h, background:"#f3f4f6", overflow:"hidden", flexShrink:0 }}>
      <img key={idx} src={images[idx]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", animation:"imgFade .22s ease" }} loading="lazy" />
      {images.length > 1 && <>
        <button onClick={prev} style={arrowBtn("left")}><ChevronLeft size={14}/></button>
        <button onClick={next} style={arrowBtn("right")}><ChevronRight size={14}/></button>
        <div style={{ position:"absolute", bottom:7, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
          {images.map((_,i) => (
            <span key={i} onClick={(e)=>{e.stopPropagation();setIdx(i);}}
              style={{ width:6, height:6, borderRadius:"50%", cursor:"pointer",
                background: i===idx?"#fff":"rgba(255,255,255,.45)", transition:"background .15s" }}
            />
          ))}
        </div>
      </>}
    </div>
  );
}
const arrowBtn = (s) => ({
  position:"absolute", top:"50%", transform:"translateY(-50%)", [s]:8,
  width:27, height:27, borderRadius:"50%", background:"rgba(255,255,255,.9)",
  border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 1px 5px rgba(0,0,0,.2)", color:"#374151", zIndex:2,
});

/* ─────────────────────────────────────────────────────────────
   ÉVALUATION DU PRIX — barre de 5 segments colorés
───────────────────────────────────────────────────────────── */
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

/* ─── Carte de bien ─── */
function PropCard({ p, active, onHover, onClick, govMarketStats }) {
  const prixM2   = (p.prix > 0 && p.area > 0) ? p.prix / p.area : null;
  const govStats = govMarketStats?.[p.gouvernorat] || null;

  /* ── Favoris ── */
  const [isFav, setIsFav] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("localizi_favs")||"[]").includes(p.id); } catch { return false; }
  });

  const toggleFav = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = `/login?redirect=/carte`;
      return;
    }
    /* Snapshot de l'état AVANT l'action */
    const wasOn = isFav;
    const method = wasOn ? "DELETE" : "POST";
    const url    = `${API_URL}/users/me/favoris/${p.id}`;

    /* Mise à jour visuelle immédiate */
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
            ? [...new Set([...favs, p.id])]
            : favs.filter(id => String(id) !== String(p.id));
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
    >
      <div style={{ position:"relative" }}>
        <Carousel images={p.images} />
        <span className={`pc__cat-badge pc__cat-badge--${p.categorie}`}>{CAT_LBL[p.categorie]}</span>
      </div>
      <div className="pc__body">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p className="pc__price">
              {fmtFull(p.prix)}
              <span className="pc__devise">
                {p.devise === "TND" ? "DT" : p.devise}
                {p.categorie === "location" ? " /mois"
                  : p.categorie === "vacances" ? (
                    p.duree_type === "nuit"   ? " /nuit."
                    : p.duree_type === "semaine" ? " /sem."
                    : p.duree_type === "mois"    ? " /mois"
                    : p.duree_type === "annee"   ? " /an"
                    : ""
                  ) : ""}
              </span>
            </p>
            <p className="pc__title">{p.titre}</p>
          </div>
          <button
            className={`pc__fav${isFav ? " pc__fav--on" : ""}`}
            onClick={toggleFav}
            title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart size={14} fill={isFav ? "#ef4444" : "none"}/>
          </button>
        </div>
        {/* Barre d'évaluation prix — toujours affichée */}
        <PriceEvalBar prixM2={prixM2} govStats={govStats} />
        <p className="pc__loc"><MapPin size={10}/> {p.delegation} · {p.localite}</p>
        <div className="pc__specs">
          {p.beds  != null && <span><Bed      size={11}/> {p.beds} ch.</span>}
          {p.baths != null && <span><Bath     size={11}/> {p.baths} sdb</span>}
          {p.area          && <span><Maximize size={11}/> {p.area} m²</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Carte Leaflet ─── */
function PropertyMap({ properties, activeId, selectedGov, onPinClick, onBoundsChange, showSchools, showMosques, showFaculties, showGrandSurfaces, liveSchools = [], liveMosques = [], liveFaculties = [], liveGrandSurfaces = [], onPinHover, sharedHoverTimer, centerTarget }) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const leafletRef      = useRef(null);   /* ← Leaflet stocké ici dès son chargement */
  const markersRef      = useRef({});
  const geoLayerRef     = useRef(null);
  const poiLayersRef    = useRef({ schools: [], mosques: [], faculties: [], grandSurfaces: [] });
  const prevGov         = useRef(null);
  const hoverTimerRef   = useRef(null);
  const selectedGovRef  = useRef(selectedGov);
  /* Ref vers onPinHover — toujours à jour, évite les closures stales dans drawPins */
  const onPinHoverRef   = useRef(onPinHover);
  useEffect(() => { selectedGovRef.current = selectedGov; }, [selectedGov]);
  useEffect(() => { onPinHoverRef.current  = onPinHover;  }, [onPinHover]);

  /* ── Zoom automatique quand un filtre de localisation est sélectionné ── */
  const lastCenterQuery = useRef(null);
  useEffect(() => {
    if (!centerTarget || !mapRef.current) return;
    if (centerTarget.query === lastCenterQuery.current) return; // déjà centré ici
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

  const drawBoundary = useCallback(async (L, map, gov) => {
    if (geoLayerRef.current) { geoLayerRef.current.remove(); geoLayerRef.current = null; }
    if (!gov) { map.setView([34.5,9.5], 6); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent("gouvernorat "+gov+", Tunisie")}&format=geojson&polygon_geojson=1&countrycodes=tn&limit=1`,
        { headers:{ "Accept-Language":"fr", "User-Agent":"Localizi/1.0" } }
      );
      const gj = await res.json();
      if (!gj.features?.length) return;
      geoLayerRef.current = L.geoJSON(gj.features[0], {
        style: { color:"#7c1a2e", weight:1.2, fillColor:"#9b2335", fillOpacity:0.13, dashArray:"none" }
      }).addTo(map);
      map.fitBounds(geoLayerRef.current.getBounds(), { padding:[40,40], maxZoom:12 });
    } catch { /* silencieux */ }
  }, []);

  const drawPins = useCallback((L, map, props, active) => {
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Helper: add a single pin with hover popup
    const addSinglePin = (p) => {
      const isA    = active === p.id;
      const catCls = p.categorie ? `pin-dot--${p.categorie}` : "pin-dot--std";
      const cls    = `pin-dot ${catCls}${isA ? " pin-dot--active" : ""}`;
      const icon = L.divIcon({
        className: "",
        html: `<div class="${cls}"></div>`,
        iconSize: [null, null], iconAnchor: [10, 10],
      });
      const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
      m.on("click", () => onPinClick(p.id));

      /* ── Hover via événements DOM natifs mouseenter/mouseleave ──────────────────
         getElement() est disponible immédiatement après addTo(map).
         mouseenter/mouseleave ne bubblent pas → aucun cycle icon/shadow Leaflet. */
      const el = m.getElement();
      if (el) {
        el.addEventListener('mouseenter', (e) => {
          clearTimeout(hoverTimerRef.current);
          const rect = containerRef.current?.getBoundingClientRect() || { left:0, top:0 };
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          onPinHoverRef.current?.({ ...p, _px: px, _py: py });
        });
        el.addEventListener('mouseleave', () => {
          /* Délai 120ms : laisse le temps de déplacer le curseur vers la carte hover */
          const timerRef = sharedHoverTimer || hoverTimerRef;
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => onPinHoverRef.current?.(null), 120);
        });
        el.addEventListener('mouseenter', () => {
          const timerRef = sharedHoverTimer || hoverTimerRef;
          clearTimeout(timerRef.current);
        });
      }

      markersRef.current[p.id] = m;
    };

    // Group pins by exact lat/lng for clustering
    const grouped = {};
    props.forEach(p => {
      if (!p.lat || !p.lng) return;
      const key = `${p.lat}_${p.lng}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    Object.values(grouped).forEach(group => {
      if (group.length === 1) {
        addSinglePin(group[0]);
      } else {
        // Cluster pin — couleur selon catégorie dominante
        const cluster = group[0];
        const count = group.length;
        // Catégorie dominante (plus fréquente dans le groupe)
        const catCount = {};
        group.forEach(p => { catCount[p.categorie||"std"] = (catCount[p.categorie||"std"]||0)+1; });
        const dominantCat = Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0][0];
        const clusterColor = dominantCat === "vente" ? "#166534"
          : dominantCat === "location" ? "#1e40af"
          : dominantCat === "vacances" ? "#d97706"
          : "#9b1c2e";
        const clusterHtml = `
          <div style="
            display:inline-flex; align-items:center; gap:5px;
            background:${clusterColor}; color:#fff;
            border-radius:16px; padding:5px 10px 5px 8px;
            border:2.5px solid #fff;
            box-shadow:0 3px 10px rgba(0,0,0,.30);
            white-space:nowrap; cursor:pointer;
            font-family:system-ui,sans-serif;
          ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="white" stroke-width="2" fill="none"/>
            </svg>
            <span style="font-size:12px;font-weight:700;line-height:1;">${count}</span>
          </div>
        `;
        const clusterIcon = L.divIcon({
          className: '',
          html: clusterHtml,
          iconSize: null,
          iconAnchor: [0, 0],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon }).addTo(map);

        /* ── Popup cluster : image GAUCHE, texte DROITE, navigation stable ── */
        let currentIdx = 0;
        /* Même palette que les badges des cartes à droite */
        const catBgMap = { vente:"#dcfce7", location:"#dbeafe", vacances:"#fef9c3" };
        const catFgMap = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
        const catColor = catFgMap; /* utilisé pour la barre couleur + bouton */
        const catLabel = { vente:"ACHAT", location:"LOCATION", vacances:"VACANCES" };

        const buildPopup = () => {
          const pin = group[currentIdx];
          const img = (pin.images && pin.images[0]) || "";
          const cc  = catFgMap[pin.categorie] || "#475569";
          const bg2 = catBgMap[pin.categorie] || "#f1f5f9";
          const cl  = catLabel[pin.categorie] || (pin.categorie||"").toUpperCase();
          const dev = pin.devise === "TND" ? "DT" : (pin.devise || "DT");
          return `
            <div style="
              width:480px; font-family:'Inter',system-ui,sans-serif;
              overflow:hidden; border-radius:2px;
            ">
              <!-- Image pleine largeur en haut -->
              <div style="position:relative;height:200px;overflow:hidden;background:#f1f5f9;">
                ${img
                  ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;display:block;"
                       onerror="this.src='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=70'"/>`
                  : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:56px;color:#cbd5e1;">🏠</div>`
                }
                <!-- Badge catégorie — même design que les cartes à droite -->
                <span style="
                  position:absolute;top:8px;right:8px;
                  background:${bg2};color:${cc};
                  font-size:10px;font-weight:700;
                  padding:3px 9px;border-radius:20px;letter-spacing:.04em;
                ">${cl}</span>
                <!-- Compteur biens supprimé — affiché en bas dans la navigation -->
              </div>

              <!-- Corps texte -->
              <div style="padding:16px 18px 14px;border-top:2px solid ${cc};">
                <!-- Titre cliquable → page de détail -->
                <div onclick="window.location.href='/annonce/${pin._realId || pin.id.toString().replace('api_','')}'"
                  style="
                    font-size:15px;font-weight:800;color:#0f172a;
                    margin-bottom:6px;line-height:1.3;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                    cursor:pointer; text-decoration:underline; text-underline-offset:2px;
                  ">${pin.titre || "Bien immobilier"}</div>

                <!-- Prix -->
                <div style="font-size:20px;font-weight:900;color:#0f172a;margin-bottom:10px;letter-spacing:-.02em;">
                  ${(pin.prix||0).toLocaleString("fr-TN")}
                  <span style="font-size:13px;font-weight:600;color:#64748b;margin-left:5px;">${dev}</span>
                </div>

                <!-- Specs -->
                <div style="display:flex;gap:14px;font-size:12.5px;color:#475569;margin-bottom:8px;flex-wrap:wrap;">
                  ${pin.area  ? `<span style="display:flex;align-items:center;gap:4px;">📐 ${pin.area} m²</span>` : ""}
                  ${pin.beds  != null ? `<span>🛏 ${pin.beds} ch.</span>` : ""}
                  ${pin.baths != null ? `<span>🚿 ${pin.baths}</span>` : ""}
                </div>

                <!-- Localisation -->
                ${pin.delegation ? `
                  <div style="font-size:11.5px;color:#94a3b8;display:flex;align-items:center;gap:4px;margin-bottom:6px;">
                    📍 ${pin.delegation}${pin.gouvernorat ? ` · ${pin.gouvernorat}` : ""}
                  </div>
                ` : ""}
                <!-- Bouton voir le détail -->
                <button onclick="window.location.href='/annonce/${pin._realId || pin.id.toString().replace('api_','')}';"
                  style="
                    margin-top:8px;padding:7px 16px;border-radius:6px;border:none;
                    background:${cc};color:#fff;font-size:12.5px;font-weight:700;
                    cursor:pointer;font-family:inherit;width:100%;text-align:center;
                  ">Voir le détail →</button>

                <!-- Navigation entre biens -->
                ${count > 1 ? `
                  <div style="
                    display:flex;align-items:center;justify-content:space-between;
                    margin-top:14px;padding-top:12px;border-top:1px solid #f1f5f9;
                  ">
                    <button onclick="event.stopPropagation();window._clPrev_${cluster.lat.toFixed(5).replace('.','_')}()"
                      style="
                        display:flex;align-items:center;gap:5px;
                        padding:7px 16px;border:1.5px solid #e5e7eb;border-radius:4px;
                        background:#f8fafc;cursor:pointer;
                        font-size:13px;font-weight:700;color:#374151;
                        font-family:inherit;
                      ">← Précédent</button>
                    <span style="font-size:12px;color:#94a3b8;font-weight:600;">
                      Bien ${currentIdx+1} sur ${count}
                    </span>
                    <button onclick="event.stopPropagation();window._clNext_${cluster.lat.toFixed(5).replace('.','_')}()"
                      style="
                        display:flex;align-items:center;gap:5px;
                        padding:7px 16px;border:none;border-radius:4px;
                        background:${cc};cursor:pointer;
                        font-size:13px;font-weight:700;color:#fff;
                        font-family:inherit;
                      ">Suivant →</button>
                  </div>
                ` : ""}
              </div>
            </div>
          `;
        };

        const clKey = cluster.lat.toFixed(5).replace('.','_');
        window[`_clPrev_${clKey}`] = () => { currentIdx=(currentIdx-1+count)%count; marker.setPopupContent(buildPopup()); };
        window[`_clNext_${clKey}`] = () => { currentIdx=(currentIdx+1)%count;       marker.setPopupContent(buildPopup()); };

        marker.bindPopup(buildPopup(), {
          maxWidth:500, closeButton:true, className:"cluster-popup",
          offset:L.point(0,-8), autoPan:true, autoPanPadding:[20,20],
        });
        /* Cluster : ouvre le grand popup au hover (pas au clic) ──────────────────
           Le popup reste ouvert quand le curseur se déplace vers les boutons Prev/Next.
           Il se ferme seulement quand le curseur quitte à la fois le marker ET le popup. */
        const clEl = marker.getElement();
        const clTimer = { id: null };

        const openCluster = () => {
          clearTimeout(clTimer.id);
          onPinHoverRef.current?.(null); // s'assurer qu'aucune hover-card simple n'est visible
          marker.openPopup();
        };
        const closeCluster = (delay = 220) => {
          clTimer.id = setTimeout(() => marker.closePopup(), delay);
        };

        if (clEl) {
          clEl.addEventListener('mouseenter', openCluster);
          clEl.addEventListener('mouseleave', () => closeCluster());
        }

        /* Garder le popup ouvert quand la souris entre dans son contenu */
        marker.on('popupopen', () => {
          const popupEl = marker.getPopup()?.getElement();
          if (popupEl) {
            popupEl.addEventListener('mouseenter', () => clearTimeout(clTimer.id));
            popupEl.addEventListener('mouseleave', () => closeCluster(80));
          }
        });

        /* Clic = ouvre aussi (si l'utilisateur clique directement sans hover) */
        marker.on("click", (e) => { L.DomEvent.stopPropagation(e); marker.openPopup(); });

        // Store under a cluster key
        markersRef.current[`cluster_${cluster.lat}_${cluster.lng}`] = marker;
      }
    });
  }, [onPinClick]);

  /* init */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let live = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!live || !containerRef.current) return;
      leafletRef.current = L;   /* ← stocker pour usage synchrone dans les effets POI */
      const map = L.map(containerRef.current, { zoomControl:false })
        .setView([34.5,9.5], 6);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution:"© OpenStreetMap © CARTO", maxZoom:19 }).addTo(map);
      L.control.zoom({ position:"bottomright" }).addTo(map);
      setTimeout(()=>map.invalidateSize(), 80);
      drawPins(L, map, properties, activeId);

      /* Si un gouvernorat est déjà sélectionné au montage (ex: URL homepage), dessiner la limite */
      if (selectedGovRef.current) {
        prevGov.current = selectedGovRef.current;
        drawBoundary(L, map, selectedGovRef.current);
      }

      /* ── Mise à jour de la liste au zoom/déplacement ── */
      const emitBounds = () => {
        if (onBoundsChange) onBoundsChange(map.getBounds());
      };
      map.on("zoomend moveend", emitBounds);
    })();
    return ()=>{ live=false; if(mapRef.current){mapRef.current.remove();mapRef.current=null;} };
  }, []); // eslint-disable-line

  /* redessiner pins */
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then(({default:L}) => drawPins(L, mapRef.current, properties, activeId));
  }, [properties, activeId, drawPins]);

  /* zoom région + GeoJSON polygon — fires on mount and whenever selectedGov changes */
  useEffect(() => {
    if (!mapRef.current || selectedGov === prevGov.current) return;
    prevGov.current = selectedGov;
    import("leaflet").then(({default:L}) => {
      if (!mapRef.current) return;
      drawBoundary(L, mapRef.current, selectedGov);
    });
  }, [selectedGov, drawBoundary]);

  /* ── Helper pour dessiner une couche POI — avec flag `cancelled` pour éviter la race condition ── */
  const makePOIEffect = (layerKey, show, liveData, staticFallback, label, svgPath) => {
    let cancelled = false;
    if (!mapRef.current) return () => { cancelled = true; };
    import("leaflet").then(({ default: L }) => {
      if (cancelled) return; /* effet suivant déjà lancé — abandonner */
      poiLayersRef.current[layerKey].forEach(m => m.remove());
      poiLayersRef.current[layerKey] = [];
      if (!show) return;
      const src = liveData.length > 0 ? liveData : staticFallback;
      const icon = makePOIIcon(L, "#475569", svgPath);
      src.forEach(s => {
        if (!s.lat || !s.lng) return;
        poiLayersRef.current[layerKey].push(
          L.marker([s.lat, s.lng], { icon }).addTo(mapRef.current)
           .bindPopup(`<b>${label}</b><br>${s.nom}`)
        );
      });
    });
    return () => { cancelled = true; }; /* cleanup = annule le callback en cours */
  };

  /* POIs écoles */
  useEffect(() => makePOIEffect(
    "schools", showSchools, liveSchools,
    selectedGov ? SCHOOLS.filter(s=>s.gov===selectedGov) : SCHOOLS,
    "École", SCHOOL_SVG
  ), [showSchools, liveSchools, selectedGov]);

  /* POIs mosquées */
  useEffect(() => makePOIEffect(
    "mosques", showMosques, liveMosques,
    selectedGov ? MOSQUES.filter(m=>m.gov===selectedGov) : MOSQUES,
    "Mosquée", MOSQUE_SVG
  ), [showMosques, liveMosques, selectedGov]);

  /* POIs facultés */
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

  return <div ref={containerRef} style={{ width:"100%", height:"100%" }} />;
}

/* ─── Tag filtre actif ─── */
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

/* ─── Sélecteur hiérarchique localisation ─── */
function LocationCascade({ govId, delId, locId, govNom, delNom, locNom, onChange }) {
  const { gouvernorats, delegations, localites, loading } = useLocalisation({
    gouvernorat: govId,
    delegation:  delId,
    localite:    locId,
  });

  /* ── Résolution automatique des IDs à partir des noms ───────────────
     Quand la détection intelligente (saisie texte) remplit govNom/delNom/locNom
     sans les IDs correspondants, ces effets les retrouvent dès que les
     listes de référence sont disponibles, et mettent à jour la cascade. */

  // 1 — govId depuis govNom
  useEffect(() => {
    if (!govId && govNom && gouvernorats.length > 0) {
      const found = gouvernorats.find(g => g.label.toLowerCase() === govNom.toLowerCase());
      if (found) {
        onChange({ govId: String(found.value), govNom, delId: "", delNom, locId: "", locNom });
      }
    }
  }, [govNom, gouvernorats]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2 — delId depuis delNom (requiert govId)
  useEffect(() => {
    if (govId && !delId && delNom && delegations.length > 0) {
      const found = delegations.find(d => d.nom.toLowerCase() === delNom.toLowerCase());
      if (found) {
        onChange({ govId, govNom, delId: String(found.id), delNom, locId: "", locNom });
      }
    }
  }, [delNom, delegations, govId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3 — locId depuis locNom (requiert delId)
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
          <option value="">Gouvernorat</option>
          {gouvernorats.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        {loading && (govId || govNom) && <Loader2 size={12} className="lc__spin"/>}
      </div>

      <ChevronRight size={14} className="loc-cascade__arrow" />

      {/* Délégation */}
      <div className={`loc-cascade__field${!govId?" loc-cascade__field--disabled":""}`}>
        <span className="lc__ico lc__ico--del">🏘</span>
        <select className="lc__sel" disabled={!govId}
          value={delId}
          onChange={(e) => {
            const opt = delegations.find(d=>d.id===e.target.value);
            onChange({ govId, govNom, delId:e.target.value, delNom:opt?.nom||"", locId:"", locNom:"" });
          }}
        >
          <option value="">Délégation</option>
          {delegations.map(d=><option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
      </div>

      <ChevronRight size={14} className="loc-cascade__arrow" />

      {/* Localité */}
      <div className={`loc-cascade__field${!delId?" loc-cascade__field--disabled":""}`}>
        <span className="lc__ico lc__ico--loc">📍</span>
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

/* ─── PANNEAU FILTRES ─── */
const INIT_F = {
  query:"", govId:"", govNom:"", delId:"", delNom:"", locId:"", locNom:"",
  categories:[], type:"",
  prixMin:"", prixMax:"", superficieMin:"", superficieMax:"", bedsMin:"", piecesMin:"", chambresMin:"", etat:"", titre_foncier:"",
  features:[],
  type_terrain:"", vocation_terrain:"",
};

function FilterPanel({ filters, onChange, showSchools, showMosques, showFaculties, showGrandSurfaces,
                       onToggleSchools, onToggleMosques, onToggleFaculties, onToggleGrandSurfaces, poiLoading,
                       liveSchoolCount, liveMosqueCount, liveFacultyCount, liveGrandSurfaceCount }) {
  const [local,         setLocal]         = useState(filters);
  const [advanced,      setAdvanced]      = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);

  /* Resync si les filtres changent depuis l'extérieur (ex : navigation via la navbar) */
  useEffect(() => { setLocal(filters); }, [filters]);

  const set    = (k, v) => setLocal(f => ({ ...f, [k]:v }));
  const apply  = ()     => onChange(local);
  const reset  = ()     => { setLocal(INIT_F); onChange(INIT_F); };

  return (
    <div className="fp">
      {/* ── Ligne 1 ── */}
      <div className="fp__row1">

        {/* Recherche textuelle */}
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

        {/* Catégorie — multi-sélection avec bouton Tous */}
        <div className="fp__pill-group">
          {/* Tous — actif quand aucune catégorie sélectionnée */}
          <button
            className={`fp__pill fp__pill--tous${(local.categories||[]).length === 0 ? " fp__pill--on" : ""}`}
            onClick={() => set("categories", [])}
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
                  set("categories", active ? cats.filter(c => c !== v) : [...cats, v]);
                }}
              >
                {CAT_LBL[v]}
              </button>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:8, marginLeft:"auto", alignItems:"center" }}>
          {/* Filtres avancés */}
          <button className={`fp__adv-btn${advanced?" fp__adv-btn--on":""}`} onClick={()=>setAdvanced(!advanced)}>
            <SlidersHorizontal size={13}/>
            <span>Filtres</span>
            <ChevronDown size={11} style={{ transform:advanced?"rotate(180deg)":"none", transition:"transform .2s" }}/>
          </button>

          {/* Bouton rechercher */}
          <button className="fp__submit" onClick={apply}>
            <Search size={14}/> Rechercher
          </button>
        </div>
      </div>

      {/* ── Localisation hiérarchique ── */}
      <div className="fp__loc-row">
        <LocationCascade
          govId={local.govId} govNom={local.govNom}
          delId={local.delId} delNom={local.delNom}
          locId={local.locId} locNom={local.locNom}
          onChange={(v) => {
            // Sélection cascade → efface la recherche texte précédente
            const updated = { ...local, ...v, query: "" };
            setLocal(updated);
            onChange(updated);   // applique immédiatement sans cliquer "Rechercher"
          }}
        />

        {/* Overlays POI */}
        <div className="fp__poi-group">
          <button
            className={`fp__poi-btn fp__poi-btn--school${showSchools?" fp__poi-btn--on":""}`}
            onClick={onToggleSchools}
          >
            {poiLoading && showSchools
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={SCHOOL_SVG}/>
            }
            Écoles
            {liveSchoolCount > 0 && (
              <span className="fp__poi-count">{liveSchoolCount}</span>
            )}
          </button>
          <button
            className={`fp__poi-btn fp__poi-btn--mosque${showMosques?" fp__poi-btn--on":""}`}
            onClick={onToggleMosques}
          >
            {poiLoading && showMosques
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={MOSQUE_SVG}/>
            }
            Mosquées
            {liveMosqueCount > 0 && (
              <span className="fp__poi-count">{liveMosqueCount}</span>
            )}
          </button>
          <button
            className={`fp__poi-btn fp__poi-btn--faculty${showFaculties?" fp__poi-btn--on":""}`}
            onClick={onToggleFaculties}
          >
            {poiLoading && showFaculties
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={FACULTY_SVG}/>
            }
            Facultés
            {liveFacultyCount > 0 && (
              <span className="fp__poi-count">{liveFacultyCount}</span>
            )}
          </button>
          <button
            className={`fp__poi-btn fp__poi-btn--surface${showGrandSurfaces?" fp__poi-btn--on":""}`}
            onClick={onToggleGrandSurfaces}
          >
            {poiLoading && showGrandSurfaces
              ? <Loader2 size={13} className="lc__spin"/>
              : <PoiSvg path={SURFACE_SVG}/>
            }
            Grandes surfaces
            {liveGrandSurfaceCount > 0 && (
              <span className="fp__poi-count">{liveGrandSurfaceCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filtres avancés ── */}
      {advanced && (
        <div className="fp__advanced">
          {/* Type de bien */}
          <div className="fp__adv-group">
            <label className="fp__adv-label">Type de bien</label>
            <select className="fp__adv-sel" value={local.type} onChange={(e)=>set("type",e.target.value)}>
              <option value="">Tous</option>
              {TYPES.map(t=><option key={t} value={t}>{TYPE_LBL[t] || ucFirst(t)}</option>)}
            </select>
          </div>
          {/* Prix */}
          <div className="fp__adv-group">
            <label className="fp__adv-label">Prix min (TND)</label>
            <input type="number" placeholder="0" value={local.prixMin}
              onChange={(e)=>set("prixMin",e.target.value)} className="fp__adv-inp"/>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Prix max (TND)</label>
            <input type="number" placeholder="∞" value={local.prixMax}
              onChange={(e)=>set("prixMax",e.target.value)} className="fp__adv-inp"/>
          </div>
          {/* Superficie */}
          <div className="fp__adv-group">
            <label className="fp__adv-label">Superficie min (m²)</label>
            <input type="number" placeholder="0" value={local.superficieMin}
              onChange={(e)=>set("superficieMin",e.target.value)} className="fp__adv-inp"/>
          </div>
          <div className="fp__adv-group">
            <label className="fp__adv-label">Surface max (m²)</label>
            <input className="fp__adv-inp" type="number" placeholder="∞" min="0"
              value={local.superficieMax || ""}
              onChange={e => set("superficieMax", e.target.value)}/>
          </div>
          {/* Pièces min — masqué pour terrain */}
          {local.type !== "terrain" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Pièces min</label>
              <select className="fp__adv-sel" value={local.piecesMin||""} onChange={e=>set("piecesMin",e.target.value)}>
                <option value="">Peu importe</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
                <option value="6">6+</option>
              </select>
            </div>
          )}
          {/* Chambres min — masqué pour terrain */}
          {local.type !== "terrain" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">Chambres min</label>
              <select className="fp__adv-sel" value={local.chambresMin||""} onChange={e=>set("chambresMin",e.target.value)}>
                <option value="">Peu importe</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
          )}
          {/* État du bien — masqué pour terrain */}
          {local.type !== "terrain" && (
            <div className="fp__adv-group">
              <label className="fp__adv-label">État du bien</label>
              <select className="fp__adv-sel" value={local.etat} onChange={(e)=>set("etat",e.target.value)}>
                <option value="">Tous</option>
                {ETATS.map(e=><option key={e} value={e}>{ETAT_LBL[e]}</option>)}
              </select>
            </div>
          )}
          {/* Terrain : type et vocation */}
          {local.type === "terrain" && (<>
            <div className="fp__adv-group">
              <label className="fp__adv-label">Type de terrain</label>
              <select className="fp__adv-sel" value={local.type_terrain||""} onChange={e=>set("type_terrain",e.target.value)}>
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
                <option value="residentielle">Résidentielle</option>
                <option value="commerciale">Commerciale</option>
                <option value="industrielle">Industrielle</option>
                <option value="agricole">Agricole</option>
                <option value="touristique">Touristique</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>
          </>)}
          {/* Titre foncier — affiché seulement pour terrain */}
          {local.type === "terrain" && (
            <div className="fp__adv-group fp__adv-group--check">
              <label className="fp__adv-label fp__adv-label--check">
                <input type="checkbox" checked={local.titre_foncier==="1"}
                  onChange={(e)=>set("titre_foncier",e.target.checked?"1":"")}/>
                Titre foncier uniquement
              </label>
            </div>
          )}
          {/* Autres critères — masqué pour terrain (non pertinent) */}
          {local.type !== "terrain" && (
          <button
            className={`fp__adv-btn${(local.features||[]).length > 0 ? " fp__adv-btn--on" : ""}`}
            type="button"
            onClick={() => setShowFeatModal(true)}
            style={{ alignSelf:"flex-end" }}
          >
            Autres critères{(local.features||[]).length > 0 ? ` (${local.features.length})` : " +"}
          </button>
          )}
          {/* Reset */}
          <button className="fp__reset" onClick={reset}><X size={11}/> Réinitialiser</button>
        </div>
      )}

      {/* ── Modal "Autres critères" — icônes comme dans la création d'annonce ── */}
      {showFeatModal && ReactDOM.createPortal(
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.60)", zIndex:999999,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"16px"
        }} onClick={e=>{ if(e.target===e.currentTarget) setShowFeatModal(false); }}>
          <div style={{
            background:"#fff", borderRadius:20, width:"100%", maxWidth:760,
            maxHeight:"88vh", overflow:"hidden", display:"flex", flexDirection:"column",
            boxShadow:"0 24px 80px rgba(0,0,0,.30)",
            fontFamily:"'Inter',system-ui,sans-serif"
          }}>
            {/* Header */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"22px 28px 18px", borderBottom:"1px solid #f1f5f9", flexShrink:0
            }}>
              <div>
                <h3 style={{fontSize:19,fontWeight:800,color:"#0f172a",margin:0}}>Caractéristiques</h3>
                <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Sélectionnez les équipements souhaités</p>
              </div>
              <button onClick={()=>setShowFeatModal(false)}
                style={{width:34,height:34,borderRadius:"50%",background:"#f1f5f9",border:"none",
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>
                <X size={16}/>
              </button>
            </div>

            {/* Body scrollable */}
            <div style={{flex:1,overflowY:"auto",padding:"20px 28px"}}>
              {[
                { section:"🌅 Vue", items:[
                  {k:"vue_mer",     l:"Vue sur mer",    Ico:Waves       },
                  {k:"vue_montagne",l:"Vue montagne",   Ico:Mountain    },
                  {k:"vue_foret",   l:"Vue forêt",      Ico:TreePine    },
                ]},
                { section:"🏡 Espaces extérieurs", items:[
                  {k:"jardin",   l:"Jardin",   Ico:Fence        },
                  {k:"terrasse", l:"Terrasse", Ico:Sun          },
                  {k:"balcon",   l:"Balcon",   Ico:Flower2      },
                  {k:"piscine",  l:"Piscine",  Ico:Droplets     },
                  {k:"parking",  l:"Parking",  Ico:ParkingCircle},
                ]},
                { section:"🏢 Commodités", items:[
                  {k:"ascenseur",    l:"Ascenseur",       Ico:ArrowUpDown},
                  {k:"garage",       l:"Garage",          Ico:Car        },
                  {k:"cellier",      l:"Chambre rangement",Ico:Package   },
                  {k:"meuble",       l:"Meublé",          Ico:Sofa       },
                  {k:"concierge",    l:"Concierge",       Ico:Users      },
                  {k:"gardien",      l:"Gardien",         Ico:ShieldCheck},
                  {k:"animaux_admis",l:"Animaux admis",   Ico:Heart      },
                ]},
                { section:"🛋️ Intérieur & équipements", items:[
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
                <div key={section} style={{marginBottom:28}}>
                  <div style={{
                    fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",
                    letterSpacing:".6px",marginBottom:14,display:"flex",alignItems:"center",gap:8
                  }}>{section}</div>
                  <div style={{
                    display:"grid",
                    gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",
                    gap:10
                  }}>
                    {items.map(({k, l, Ico}) => {
                      const isOn = (local.features||[]).includes(k);
                      return (
                        <button key={k} type="button"
                          onClick={() => {
                            const cur = local.features||[];
                            set("features", isOn ? cur.filter(f=>f!==k) : [...cur,k]);
                          }}
                          style={{
                            position:"relative",
                            display:"flex",flexDirection:"column",alignItems:"center",
                            gap:7,padding:"18px 8px 14px",
                            borderRadius:14,border:"none",
                            background: isOn ? "#eef2ff" : "transparent",
                            cursor:"pointer",fontFamily:"inherit",
                            transition:"background .15s,transform .15s",
                            minHeight:90,
                          }}
                          onMouseEnter={e=>{ if(!isOn) e.currentTarget.style.background="#f8faff"; }}
                          onMouseLeave={e=>{ if(!isOn) e.currentTarget.style.background="transparent"; }}
                        >
                          <Ico size={36} strokeWidth={1.4}
                            style={{color: isOn?"#4f46e5":"#94a3b8",transition:"color .15s"}}/>
                          <span style={{
                            fontSize:11.5,fontWeight:600,textAlign:"center",lineHeight:1.3,
                            color:isOn?"#4f46e5":"#6b7280"
                          }}>{l}</span>
                          {isOn && (
                            <div style={{
                              position:"absolute",top:7,right:7,
                              width:16,height:16,borderRadius:"50%",
                              background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center"
                            }}>
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
            <div style={{
              display:"flex",gap:12,justifyContent:"space-between",alignItems:"center",
              padding:"16px 28px 20px",borderTop:"1px solid #f1f5f9",flexShrink:0,
              background:"#fafafa"
            }}>
              <span style={{fontSize:13,color:"#64748b"}}>
                {(local.features||[]).length > 0
                  ? `${local.features.length} critère${local.features.length>1?"s":""} sélectionné${local.features.length>1?"s":""}`
                  : "Aucun critère sélectionné"}
              </span>
              <div style={{display:"flex",gap:10}}>
                <button type="button"
                  onClick={() => set("features",[])}
                  style={{padding:"10px 18px",borderRadius:10,border:"1.5px solid #e5e7eb",
                    background:"#fff",color:"#374151",fontWeight:600,cursor:"pointer",
                    fontSize:13,fontFamily:"inherit"}}
                >Tout effacer</button>
                <button type="button"
                  onClick={() => { onChange({...local}); setShowFeatModal(false); }}
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

/* ─────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────────── */
/* ══════════════════════════════════════════════════════════════
   SCORE COMPOSITE — tie-breaking entre annonces de même boost
   ──────────────────────────────────────────────────────────────
   Critère            Poids max   Logique
   ─────────────────────────────────────────────────────────────
   boost_level        4 000 pts   priorité absolue (1000 × niveau)
   photos             200 pts     ≥5 photos = score plein
   description        100 pts     ≥200 car. = score plein, ≥50 = moitié
   titre_foncier      150 pts     confiance juridique
   fraîcheur          500 pts     500 - jours depuis publication (min 0)
   ──────────────────────────────────────────────────────────────
   Total max          ~4 950 pts
   Les annonces du même niveau boost sont donc départagées par
   la qualité et la fraîcheur, pas aléatoirement.
══════════════════════════════════════════════════════════════ */
function computeScore(p) {
  const boost     = (p.boost || 0) * 1000;
  const photos    = Math.min((p.images?.length || 0), 5) * 40;            // 40pts × nb photos (max 200)
  const desc      = (p.description?.length || 0) >= 200 ? 100
                  : (p.description?.length || 0) >= 50  ? 50 : 0;
  const tf        = p.titre_foncier ? 150 : 0;
  const freshness = p.date_creation
    ? Math.max(0, 500 - Math.floor((Date.now() - new Date(p.date_creation)) / 86_400_000))
    : 0;
  return boost + photos + desc + tf + freshness;
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
    beds:          a.nb_chambres   || null,
    baths:         a.nb_salles_bain|| null,
    area:          a.superficie    || 0,
    type:          a.type_bien === "maison" ? "villa_maison" : (a.type_bien || ""),
    categorie:     a.categorie,
    duree_type:    a.duree_type    || null,
    etat:          a.etat_bien     || null,
    titre_foncier: a.titre_foncier || false,
    boost:         a.boost_level   || 0,
    description:   a.description   || "",
    date_creation: a.date_creation || null,
    lat:           a.latitude,
    lng:           a.longitude,
    images:        (a.images || []).length > 0
      ? (a.images || []).map(img => img.startsWith("http") ? img : `${API_URL}${img}`)
      : a.image_principale
        ? [a.image_principale.startsWith("http") ? a.image_principale : `${API_URL}${a.image_principale}`]
        : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"],
    features:      a.features || [],
    isReal: true,
  };
}

/* Mapping clé filtre → label feature (pour le filtre "Autres critères") */
const FEAT_KEY_TO_LABEL = {
  jardin:"Jardin", terrasse:"Terrasse", balcon:"Balcon", parking:"Parking",
  garage:"Garage", ascenseur:"Ascenseur", vue_mer:"Vue sur mer",
  vue_montagne:"Vue montagne", vue_foret:"Vue forêt", piscine:"Piscine",
  concierge:"Concierge", cellier:"Chambre rangement", meuble:"Meublé",
  gardien:"Gardien", animaux_admis:"Animaux admis",
  cuisine_equipee:"Cuisine équipée", climatisation:"Climatisation",
  chauffage_centrale:"Chauffage central", cheminee:"Cheminée",
  double_vitrage:"Double vitrage", porte_blindee:"Porte blindée",
  securite:"Sécurité", internet:"Internet", tv:"TV",
  machine_laver:"Machine à laver", digicode:"Digicode", interphone:"Interphone",
  salon_americain:"Salon américain", relie_onas:"Relié ONAS",
  fibre_optique:"Fibre optique",
};

export default function CartePage() {
  const navigate                   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive]         = useState(null);
  const [apiProperties, setApiProps] = useState([]);
  const [mapBounds, setMapBounds]   = useState(null);
  /* Ref toujours synchronisé avec allProperties (utilisé dans applyFilters) */
  const allPropertiesRef = useRef([]);
  /* Liste complète des gouvernorats — pour la détection même sans annonces chargées */
  const { gouvernorats: _allGovs } = useLocalisation({ gouvernorat:"", delegation:"", localite:"" });
  const govListRef = useRef([]);
  govListRef.current = _allGovs;

  /* ── Lecture URL → objet filtre (source de vérité unique) ── */
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
    type_terrain:    sp.get("tterrain") || "",
    vocation_terrain:sp.get("vterrain") || "",
  }), []);

  /* ── État initial : URL d'abord, sessionStorage en fallback ── */
  const [filters, setFilters] = useState(() => {
    const fromUrl = readFiltersFromUrl(searchParams);
    const hasUrlFilters = Object.values(fromUrl).some(v =>
      Array.isArray(v) ? v.length > 0 : v !== ""
    );
    if (hasUrlFilters) return { ...INIT_F, ...fromUrl };
    /* Pas de params URL → restaurer depuis sessionStorage (retour depuis détail) */
    try {
      const saved = JSON.parse(sessionStorage.getItem("localizi_carte_filters"));
      if (saved) return { ...INIT_F, ...saved };
    } catch {}
    return { ...INIT_F };
  });

  /* ── Sync URL params → filters (navigation externe / retour navigateur) ── */
  useEffect(() => {
    setFilters({ ...INIT_F, ...readFiltersFromUrl(searchParams) });
  }, [searchParams, readFiltersFromUrl]);

  /* ── Sauvegarde sessionStorage (restauration au retour depuis le détail) ── */
  useEffect(() => {
    sessionStorage.setItem("localizi_carte_filters", JSON.stringify(filters));
  }, [filters]);

  /* ── Écriture URL → ALL filtres sérialisés ──
     Détection de localisation dans le texte saisi (synchrone, sur les données chargées). */
  const applyFilters = useCallback((newFilters) => {
    let f = { ...newFilters };
    const q = (f.query || "").trim();

    if (q) {
      /* Efface l'ancienne hiérarchie pour repartir proprement */
      f = { ...f, govNom:"", govId:"", delNom:"", delId:"", locNom:"", locId:"" };

      const props = allPropertiesRef.current;
      const ql    = q.toLowerCase();
      let detected = false;

      /* 1 — Correspondance EXACTE dans les annonces chargées (localité > délégation > gouvernorat) */
      const locExact = props.find(p => p.localite   && p.localite.toLowerCase()   === ql);
      const delExact = props.find(p => p.delegation  && p.delegation.toLowerCase()  === ql);
      const govExact = props.find(p => p.gouvernorat && p.gouvernorat.toLowerCase() === ql);

      if (locExact) {
        f = { ...f, query:"", locNom:locExact.localite, delNom:locExact.delegation||"", govNom:locExact.gouvernorat||"", locId:"", delId:"", govId:"" };
        detected = true;
      } else if (delExact) {
        f = { ...f, query:"", delNom:delExact.delegation, govNom:delExact.gouvernorat||"", locNom:"", delId:"", govId:"", locId:"" };
        detected = true;
      } else if (govExact) {
        f = { ...f, query:"", govNom:govExact.gouvernorat, delNom:"", locNom:"", govId:"", delId:"", locId:"" };
        detected = true;
      }

      /* 2 — Correspondance PARTIELLE dans les annonces */
      if (!detected) {
        const locPart = props.find(p => p.localite   && p.localite.toLowerCase().includes(ql));
        const delPart = props.find(p => p.delegation  && p.delegation.toLowerCase().includes(ql));
        const govPart = props.find(p => p.gouvernorat && p.gouvernorat.toLowerCase().includes(ql));

        if (locPart) {
          f = { ...f, query:"", locNom:locPart.localite, delNom:locPart.delegation||"", govNom:locPart.gouvernorat||"", locId:"", delId:"", govId:"" };
          detected = true;
        } else if (delPart) {
          f = { ...f, query:"", delNom:delPart.delegation, govNom:delPart.gouvernorat||"", locNom:"", delId:"", govId:"", locId:"" };
          detected = true;
        } else if (govPart) {
          f = { ...f, query:"", govNom:govPart.gouvernorat, delNom:"", locNom:"", govId:"", delId:"", locId:"" };
          detected = true;
        }
      }

      /* 3 — Fallback : liste complète des gouvernorats (même sans annonces chargées) */
      if (!detected) {
        const govFull = govListRef.current.find(g => g.label.toLowerCase() === ql);
        if (govFull) {
          f = { ...f, query:"", govNom:govFull.label, govId:String(govFull.value), delNom:"", locNom:"", delId:"", locId:"" };
          detected = true;
        }
      }
      /* Si rien trouvé → texte libre, la recherche multi-champs gère le reste */
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
    /* setSearchParams déclenche le useEffect ci-dessus qui met à jour filters */
    setSearchParams(sp, { replace: true });
  }, [setSearchParams]);

  const [showSchools,      setShowSchools]      = useState(false);
  const [showMosques,      setShowMosques]      = useState(false);
  const [showFaculties,    setShowFaculties]    = useState(false);
  const [showGrandSurfaces,setShowGrandSurfaces]= useState(false);
  const [listMode,         setListMode]         = useState(searchParams.get("vue") === "liste");
  const [livePOIs,         setLivePOIs]         = useState({ schools: [], mosques: [], faculties: [], grandSurfaces: [], loading: false });
  const [hoveredPin,       setHoveredPin]       = useState(null);
  /* Timer partagé : PropertyMap (mouseleave pin) ET hover card (onMouseEnter) l'utilisent */
  const sharedHoverTimer = useRef(null);

  /* ── Fetch POIs depuis Overpass (bbox visible de la carte) ── */
  const fetchPOIs = useCallback(async (bbox) => {
    if (!bbox) return;
    setLivePOIs({ schools: [], mosques: [], faculties: [], grandSurfaces: [], loading: true });
    try {
      const query =
        `[out:json][timeout:35];\n` +
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
        `);\nout center;`;

      const ovRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: query,
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

      setLivePOIs({ schools, mosques, faculties, grandSurfaces, loading: false });
    } catch {
      setLivePOIs({ schools: [], mosques: [], faculties: [], grandSurfaces: [], loading: false });
    }
  }, []);

  /* Ref vers la bbox courante de la carte (mis à jour à chaque zoom/pan) */
  const mapBboxRef = useRef(null);

  /* Conversion Leaflet bounds → string bbox Overpass */
  const boundsToOverpassBbox = useCallback((bounds) => {
    if (!bounds || !bounds.getSouth) return null;
    return `${bounds.getSouth().toFixed(6)},${bounds.getWest().toFixed(6)},${bounds.getNorth().toFixed(6)},${bounds.getEast().toFixed(6)}`;
  }, []);

  /* ── Re-fetch quand la bbox change ET qu'au moins un bouton est actif ── */
  useEffect(() => {
    if (!mapBounds) return;
    const newBbox = boundsToOverpassBbox(mapBounds);
    mapBboxRef.current = newBbox;
    const anyActive = showSchools || showMosques || showFaculties || showGrandSurfaces;
    if (!anyActive) return;
    const timer = setTimeout(() => {
      if (mapBboxRef.current) fetchPOIs(mapBboxRef.current);
    }, 600);
    return () => clearTimeout(timer);
  }, [mapBounds]); // eslint-disable-line

  const livePOIsRef = useRef({ schools:[], mosques:[], faculties:[], grandSurfaces:[] });
  livePOIsRef.current = livePOIs;

  const handleTogglePOI = useCallback((type, currentState) => {
    const next = !currentState;

    /* ── Désactiver : juste masquer les marqueurs, PAS de re-fetch ── */
    if (!next) {
      if (type === "schools")       setShowSchools(false);
      if (type === "mosques")       setShowMosques(false);
      if (type === "faculties")     setShowFaculties(false);
      if (type === "grandSurfaces") setShowGrandSurfaces(false);
      return;
    }

    /* ── Activer : afficher + fetch seulement si pas encore de données ── */
    if (type === "schools")       setShowSchools(true);
    if (type === "mosques")       setShowMosques(true);
    if (type === "faculties")     setShowFaculties(true);
    if (type === "grandSurfaces") setShowGrandSurfaces(true);

    const current = livePOIsRef.current;
    const hasData  = current.schools.length > 0 || current.mosques.length > 0
                  || current.faculties.length > 0 || current.grandSurfaces.length > 0;

    if (!hasData) {
      /* Première activation : fetch Overpass pour la zone visible */
      fetchPOIs(mapBboxRef.current || "30.2,7.5,37.8,11.8");
    }
    /* Si données déjà chargées → les effets de dessin les afficheront automatiquement */
  }, [fetchPOIs]);

  useEffect(() => {
    fetch(`${API_URL}/annonces/public?limit=100`)
      .then(r => r.json())
      .then(data => {
        const transformed = (Array.isArray(data) ? data : [])
          .map(transformApiAnnonce)
          .filter(a => a.lat && a.lng);
        setApiProps(transformed);
      })
      .catch(() => {});
  }, []);

  /* Sync favoris API → localStorage au montage (si connecté) */
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

  /* ── Cible de zoom carte selon la hiérarchie sélectionnée ──
     Plus on précise (gov → del → loc), plus le zoom est élevé. */
  const centerTarget = React.useMemo(() => {
    const { locNom, delNom, govNom } = filters;
    if (!govNom && !delNom && !locNom) return null;
    const parts = [locNom, delNom, govNom].filter(Boolean);
    const zoom  = locNom ? 14 : delNom ? 12 : 10;
    return { query: parts.join(", ") + ", Tunisie", zoom };
  }, [filters.govNom, filters.delNom, filters.locNom]);

  /* Stats marché : prix moyen/m² par gouvernorat (vente uniquement) */
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
      /* Si une localisation est détectée (govNom/delNom/locNom), on ne réapplique pas
         le filtre texte (la cascade est plus précise et évite les doublons) */
      const hasLocationFilter = filters.govNom || filters.delNom || filters.locNom;
      if (filters.query && !hasLocationFilter &&
          !`${p.titre} ${p.delegation} ${p.gouvernorat} ${p.localite} ${p.address||""}`
          .toLowerCase().includes(filters.query.toLowerCase())) return false;
      if (filters.govNom && p.gouvernorat !== filters.govNom)   return false;
      if (filters.delNom && p.delegation  !== filters.delNom)   return false;
      if (filters.locNom && p.localite    !== filters.locNom)   return false;
      const cats = filters.categories || [];
      if (cats.length > 0 && !cats.includes(p.categorie))       return false;
      if (filters.type) {
        if (filters.type === "villa_maison") {
          if (!["villa","maison","villa_maison"].includes(p.type)) return false;
        } else {
          if (p.type !== filters.type) return false;
        }
      }
      if (filters.prixMin && p.prix < +filters.prixMin)          return false;
      if (filters.prixMax && p.prix > +filters.prixMax)          return false;
      if (filters.superficieMin && p.area < +filters.superficieMin) return false;
      if (filters.superficieMax && p.area > +filters.superficieMax) return false;
      if (filters.bedsMin && (p.beds==null||p.beds < +filters.bedsMin)) return false;
      if (filters.piecesMin && (p.beds==null||p.beds < +filters.piecesMin)) return false;
      if (filters.chambresMin && (p.beds==null||p.beds < +filters.chambresMin)) return false;
      if (filters.etat && p.etat !== filters.etat)               return false;
      if (filters.titre_foncier==="1" && !p.titre_foncier)       return false;
      if (filters.type_terrain && p.type_terrain !== filters.type_terrain) return false;
      if (filters.vocation_terrain && p.vocation_terrain !== filters.vocation_terrain) return false;
      if (filters.features && filters.features.length > 0) {
        const hasAll = filters.features.every(feat => {
          /* Convertir la clé filtre en label (ex: "jardin" → "Jardin") */
          const label = FEAT_KEY_TO_LABEL[feat] || feat;
          if (Array.isArray(p.features) && p.features.length > 0) {
            return p.features.includes(label);
          }
          /* Fallback : vérifier le booléen direct (données démo) */
          return p[feat] === true;
        });
        if (!hasAll) return false;
      }
      return true;
    })
    .sort((a, b) => computeScore(b) - computeScore(a));

  /* Sous-ensemble visible dans la zone de la carte (pour la liste droite) */
  const visibleResults = mapBounds
    ? results.filter(p =>
        p.lat && p.lng && mapBounds.contains && mapBounds.contains([p.lat, p.lng])
      )
    : results;

  /* Tags filtres actifs (toujours visibles même si 0 résultats) */
  const activeTags = [
    /* query = filtre texte libre silencieux — pas de chip, seules les localisations vérifiées en ont un */
    filters.govNom     && { label:filters.govNom,          key:"govNom",  color:"#4f46e5" },
    filters.delNom     && { label:filters.delNom,         key:"delNom",  color:"#7c3aed" },
    filters.locNom     && { label:filters.locNom,         key:"locNom",  color:"#9333ea" },
    ...(filters.categories||[]).map(c=>({ label:CAT_LBL[c], key:`cat_${c}`, color:"#0369a1" })),
    filters.type       && { label:ucFirst(filters.type),  key:"type",    color:"#0f766e" },
    filters.etat       && { label:ETAT_LBL[filters.etat], key:"etat",    color:"#92400e" },
    filters.prixMin    && { label:`≥ ${fmtFull(+filters.prixMin)} TND`, key:"prixMin", color:"#1d4ed8" },
    filters.prixMax    && { label:`≤ ${fmtFull(+filters.prixMax)} TND`, key:"prixMax", color:"#1d4ed8" },
    filters.bedsMin    && { label:`${filters.bedsMin}+ ch.`, key:"bedsMin", color:"#be185d" },
    filters.titre_foncier && { label:"Titre foncier",     key:"titre_foncier", color:"#15803d" },
    ...(filters.features||[]).map(k => ({ label: k.replace(/_/g," "), key:`feat_${k}`, color:"#7c3aed" })),
  ].filter(Boolean);

  /* Click pin → scroll vers la carte */
  const handlePin = (id) => {
    setActive(id);
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"nearest" });
  };

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

  return (
    <div className="cp-root">
      <Navbar />

      <FilterPanel
        filters={filters} onChange={applyFilters}
        showSchools={showSchools} showMosques={showMosques} showFaculties={showFaculties} showGrandSurfaces={showGrandSurfaces}
        onToggleSchools={()=>handleTogglePOI("schools",      showSchools)}
        onToggleMosques={()=>handleTogglePOI("mosques",      showMosques)}
        onToggleFaculties={()=>handleTogglePOI("faculties",  showFaculties)}
        onToggleGrandSurfaces={()=>handleTogglePOI("grandSurfaces", showGrandSurfaces)}
        poiLoading={livePOIs.loading}
        liveSchoolCount={livePOIs.schools.length}
        liveMosqueCount={livePOIs.mosques.length}
        liveFacultyCount={livePOIs.faculties.length}
        liveGrandSurfaceCount={(livePOIs.grandSurfaces||[]).length}
      />

      {/* Barre compteur + tags */}
      <div className="cp-bar">
        <span className="cp-bar__count">
          <strong>{mapBounds ? visibleResults.length : results.length}</strong> annonce{results.length!==1?"s":""} trouvée{results.length!==1?"s":""}
          {mapBounds && visibleResults.length !== results.length && <> dans la zone visible</>}
          {filters.govNom && !mapBounds && <> dans <strong>{filters.govNom}</strong></>}
        </span>
        {activeTags.length > 0 && (
          <div className="cp-bar__tags">
            {activeTags.map(t=>(
              <Tag key={t.key} label={t.label} color={t.color} onRemove={()=>removeTag(t.key)} />
            ))}
            <button className="cp-bar__clear-all" onClick={()=>applyFilters(INIT_F)}>
              Tout effacer
            </button>
          </div>
        )}
        <button className="cp-toggle-btn" onClick={()=>setListMode(v=>!v)}>
          {listMode
            ? <><MapIcon size={14}/> Vue carte</>
            : <><LayoutList size={14}/> Vue liste</>}
        </button>
      </div>

      {/* Layout carte + liste / mode liste seule */}
      {listMode ? (
        <div className="cp-listonly">
          {results.length === 0
            ? <div className="cp-empty" style={{gridColumn:"1/-1"}}>
                <MapPin size={36} style={{color:"#d1d5db",margin:"0 auto 14px"}}/>
                <p style={{fontWeight:600,color:"#374151",marginBottom:6}}>Aucun résultat</p>
                <p style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>Essayez d'élargir vos filtres</p>
                <button className="fp__reset" onClick={()=>applyFilters(INIT_F)}>
                  <X size={12}/> Effacer les filtres
                </button>
              </div>
            : results.map((p) => (
                <div key={p.id}>
                  <PropCard p={p} active={false} govMarketStats={govMarketStats}
                    onHover={()=>{}}
                    onClick={(id)=>{
                      const realId = String(id).startsWith("api_") ? String(id).replace("api_","") : id;
                      navigate(`/annonce/${realId}`);
                    }}
                  />
                </div>
              ))
          }
        </div>
      ) : (
        <div className="cp-layout">
          {/* Carte — occupe tout l'espace restant */}
          <div className="cp-map" style={{ position:"relative" }}
            onMouseLeave={() => setHoveredPin(null)}
          >
            <PropertyMap
              properties={results}
              activeId={active}
              selectedGov={filters.govNom}
              onPinClick={handlePin}
              onBoundsChange={setMapBounds}
              showSchools={showSchools}
              showMosques={showMosques}
              showFaculties={showFaculties}
              showGrandSurfaces={showGrandSurfaces}
              liveSchools={livePOIs.schools}
              liveMosques={livePOIs.mosques}
              liveFaculties={livePOIs.faculties}
              liveGrandSurfaces={livePOIs.grandSurfaces||[]}
              onPinHover={setHoveredPin}
              sharedHoverTimer={sharedHoverTimer}
              centerTarget={centerTarget}
            />
            {/* ── Tooltip hover — purement visuel, aucun bouton interactif ── */}
            {hoveredPin && (() => {
              const px    = hoveredPin._px || 20;
              const py    = hoveredPin._py || 100;
              const mapEl = document.querySelector(".leaflet-container");
              const mapW  = mapEl?.clientWidth  || 800;
              const mapH  = mapEl?.clientHeight || 600;
              const cardW = 340;
              const cardH = 230; /* hauteur estimée pour rester dans la carte */
              /* Positionner à droite du pin par défaut, basculer à gauche si trop près du bord */
              const left  = (px + 18 + cardW > mapW - 8) ? Math.max(px - cardW - 14, 8) : px + 18;
              const top   = Math.min(Math.max(py - 80, 8), mapH - cardH - 8);
              const img   = hoveredPin.images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75";
              /* Mêmes couleurs/design que les badges des cartes à droite */
              const catBg   = { vente:"#dcfce7", location:"#dbeafe", vacances:"#fef9c3" };
              const catFg   = { vente:"#166534", location:"#1e40af", vacances:"#854d0e" };
              const catLabels = { vente:"Achat", location:"Location", vacances:"Vacances" };
              const bg = catBg[hoveredPin.categorie] || "#f1f5f9";
              const cc = catFg[hoveredPin.categorie] || "#475569";
              return (
                <div
                  style={{
                    position:"absolute", left, top, width:cardW, zIndex:9100,
                    pointerEvents:"auto", cursor:"pointer",
                    background:"#fff", borderRadius:4, overflow:"hidden",
                    boxShadow:"0 8px 32px rgba(0,0,0,.32), 0 2px 8px rgba(0,0,0,.16)",
                    animation:"hoverFadeIn .10s ease", border:"1.5px solid #e2e8f0"
                  }}
                  onClick={() => {
                    const realId = hoveredPin.id.toString().replace("api_","");
                    navigate(`/annonce/${realId}`);
                  }}
                  onMouseEnter={() => clearTimeout(sharedHoverTimer.current)}
                  onMouseLeave={() => { clearTimeout(sharedHoverTimer.current); setHoveredPin(null); }}
                >
                  {/* Image */}
                  <div style={{position:"relative",height:170,overflow:"hidden",flexShrink:0}}>
                    <img src={img} alt=""
                      style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                      onError={e => { e.currentTarget.src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"; }}
                    />
                    <span style={{
                      position:"absolute", top:8, right:8,
                      background:bg, color:cc,
                      fontSize:10, fontWeight:700,
                      padding:"3px 9px", borderRadius:20,
                      letterSpacing:".03em", textTransform:"uppercase"
                    }}>{catLabels[hoveredPin.categorie] || hoveredPin.categorie}</span>
                  </div>
                  {/* Corps */}
                  <div style={{padding:"13px 15px 14px",borderTop:"1px solid #f1f5f9"}}>
                    <p style={{
                      fontSize:13.5,fontWeight:700,color:"#0f172a",
                      margin:"0 0 5px",lineHeight:1.3,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
                    }}>{hoveredPin.titre}</p>
                    <p style={{fontSize:18,fontWeight:900,color:"#0f172a",margin:"0 0 8px",letterSpacing:"-.01em"}}>
                      {(hoveredPin.prix||0).toLocaleString("fr-TN")}
                      <span style={{fontSize:12,fontWeight:400,color:"#94a3b8",marginLeft:4}}>
                        {hoveredPin.devise === "TND" ? "DT" : (hoveredPin.devise||"DT")}
                      </span>
                    </p>
                    <div style={{display:"flex",gap:14,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
                      {hoveredPin.area  && <span>📐 {hoveredPin.area} m²</span>}
                      {hoveredPin.beds  != null && <span>🛏 {hoveredPin.beds} ch.</span>}
                      {hoveredPin.baths != null && <span>🚿 {hoveredPin.baths}</span>}
                    </div>
                    {hoveredPin.delegation && (
                      <p style={{
                        fontSize:11,color:"#94a3b8",margin:"7px 0 0",
                        display:"flex",alignItems:"center",gap:3,
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
                      }}>
                        📍 {hoveredPin.delegation}{hoveredPin.gouvernorat ? ` · ${hoveredPin.gouvernorat}` : ""}
                      </p>
                    )}
                    <div style={{
                      marginTop:8, paddingTop:7, borderTop:"1px solid #f1f5f9",
                      fontSize:11.5, fontWeight:600, color:cc, textAlign:"center"
                    }}>
                      Voir le détail →
                    </div>
                  </div>
                </div>
              );
            })()}
            )}
          </div>

          {/* Liste à droite — filtrée par zone visible sur la carte */}
          <div className="cp-list">
            {visibleResults.length === 0
              ? <div className="cp-empty">
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
              : visibleResults.map((p) => (
                  <div id={`card-${p.id}`} key={p.id}>
                    <PropCard p={p} active={active===p.id} govMarketStats={govMarketStats}
                      onHover={setActive}
                      onClick={(id)=>{
                        const realId = String(id).startsWith("api_") ? String(id).replace("api_","") : id;
                        navigate(`/annonce/${realId}`);
                      }}
                    />
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* ── CSS ── */}
      <style>{`
        @keyframes imgFade { from{opacity:0} to{opacity:1} }

        .cp-root {
          display: flex; flex-direction: column;
          min-height: 100vh; overflow-x: hidden;
          background: #fff;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .cp-root:has(.cp-layout) { height: 100vh; overflow: hidden; }

        /* ══════════════════════════════════════
           PANNEAU FILTRES — light theme
        ══════════════════════════════════════ */
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
          color: #111; font-size: 13.5px; font-family: inherit;
          padding: 9px 8px; width: 100%; min-width: 0;
        }
        .fp__search-inp::placeholder { color: #9ca3af; }
        .fp__clear {
          display: flex; color: #9ca3af; cursor: pointer;
          padding: 3px; border-radius: 50%; border: none; background: none; flex-shrink:0;
        }
        .fp__clear:hover { color: #374151; background: #f3f4f6; }

        .fp__pill-group { display: flex; gap: 4px; flex-shrink: 0; }
        .fp__pill {
          padding: 7px 14px; border-radius: 20px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280;
          transition: all .15s;
        }
        .fp__pill:hover { background: #f3f4f6; border-color: #d1d5db; color: #374151; }

        /* ── Tous ── */
        .fp__pill--tous.fp__pill--on { background: #475569; border-color: #475569; color: #fff; box-shadow: 0 2px 8px rgba(71,85,105,.35); }
        .fp__pill--tous:not(.fp__pill--on):hover { background: #f1f5f9; color: #475569; border-color: #94a3b8; }

        /* ── Achat (vente) — vert (comme le badge carte) ── */
        .fp__pill--vente.fp__pill--on { background: #166534; border-color: #166534; color: #fff; box-shadow: 0 2px 8px rgba(22,101,52,.40); }
        .fp__pill--vente:not(.fp__pill--on):hover { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

        /* ── Location — bleu (comme le badge carte) ── */
        .fp__pill--location.fp__pill--on { background: #1e40af; border-color: #1e40af; color: #fff; box-shadow: 0 2px 8px rgba(30,64,175,.40); }
        .fp__pill--location:not(.fp__pill--on):hover { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }

        /* ── Vacances — ambre ── */
        .fp__pill--vacances.fp__pill--on { background: #f59e0b; border-color: #f59e0b; color: #fff; box-shadow: 0 2px 8px rgba(245,158,11,.40); }
        .fp__pill--vacances:not(.fp__pill--on):hover { background: #fffbeb; color: #d97706; border-color: #fcd34d; }

        .fp__adv-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280;
          transition: all .15s; white-space: nowrap;
        }
        .fp__adv-btn:hover { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
        .fp__adv-btn--on { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }

        .fp__submit {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 26px; border-radius: 10px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: inherit;
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

        .loc-cascade {
          display: flex; align-items: center; gap: 4px; flex: 1; flex-wrap: wrap;
        }
        .loc-cascade__field {
          display: flex; align-items: center; gap: 7px;
          background: #f9fafb; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 8px 12px;
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
          color: #374151; font-size: 13px; font-family: inherit; cursor: pointer;
          width: 100%; min-width: 0;
        }
        .lc__sel option { color: #111; background: #fff; }

        .fp__poi-group { display: flex; gap: 6px; flex-shrink: 0; }
        .fp__poi-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 8px 13px; border-radius: 20px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          border: 1.5px solid transparent; transition: all .15s;
        }
        /* POI buttons — UNE seule couleur slate, icônes différentes, clair/foncé */
        .fp__poi-btn--school,
        .fp__poi-btn--mosque,
        .fp__poi-btn--faculty,
        .fp__poi-btn--surface {
          background: #f8fafc; color: #475569; border-color: #cbd5e1;
        }
        .fp__poi-btn--school.fp__poi-btn--on,
        .fp__poi-btn--mosque.fp__poi-btn--on,
        .fp__poi-btn--faculty.fp__poi-btn--on,
        .fp__poi-btn--surface.fp__poi-btn--on {
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
          display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap;
          margin-top: 10px; padding: 14px 16px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .fp__adv-group { display: flex; flex-direction: column; gap: 4px; }
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
          padding: 7px 10px; font-size: 13px; font-family: inherit;
          background: #fff; color: #374151; outline: none;
          transition: border-color .15s; min-width: 110px;
        }
        .fp__adv-sel:focus, .fp__adv-inp:focus {
          border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.08);
        }
        .fp__adv-inp::placeholder { color: #9ca3af; }
        .fp__adv-group--check { justify-content: flex-end; }
        .fp__reset {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 8px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280;
          transition: all .15s; align-self: flex-end;
        }
        .fp__reset:hover { border-color: #d1d5db; color: #374151; background: #f9fafb; }

        /* ══════════════════════════════════════
           BARRE COMPTEUR / TAGS
        ══════════════════════════════════════ */
        .cp-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 16px; background: #f8fafc;
          border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; min-height: 38px;
        }
        .cp-bar__count { font-size: 12.5px; color: #64748b; white-space: nowrap; }
        .cp-bar__count strong { color: #1e293b; }
        .cp-bar__tags  { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex: 1; }
        .cp-bar__clear-all {
          font-size: 11px; color: #94a3b8; cursor: pointer; border: none;
          background: none; font-family: inherit; text-decoration: underline;
          padding: 2px 4px;
        }
        .cp-bar__clear-all:hover { color: #475569; }
        .cp-toggle-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 9px; font-size: 12.5px;
          font-weight: 700; cursor: pointer; font-family: inherit;
          border: 1.5px solid #6366f1; background: #eef2ff; color: #4338ca;
          transition: all .15s; white-space: nowrap; flex-shrink: 0; margin-left: auto;
        }
        .cp-toggle-btn:hover { background: #6366f1; color: #fff; }

        /* ══════════════════════════════════════
           LAYOUT CARTE + LISTE
        ══════════════════════════════════════ */
        .cp-layout { flex: 1; display: flex; overflow: hidden; }
        .cp-map    { flex: 1; min-width: 0; }

        /* Liste desktop — visible uniquement sur grand écran */
        .cp-list {
          width: 400px; min-width: 290px;
          overflow-y: auto; background: #f8fafc;
          border-left: 1px solid #e2e8f0;
          padding: 10px; display: flex; flex-direction: column; gap: 10px;
        }

        /* ══════════════════════════════════════
           MODE LISTE SEULE
        ══════════════════════════════════════ */
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

        /* ══════════════════════════════════════
           CARTE DE BIEN
        ══════════════════════════════════════ */
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
          position: absolute; top: 8px; right: 8px;
          padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700;
        }
        .pc__cat-badge--vente    { background: #dcfce7; color: #166534; }
        .pc__cat-badge--location { background: #dbeafe; color: #1e40af; }
        .pc__cat-badge--vacances { background: #fef9c3; color: #854d0e; }
        .pc__body  { padding: 11px 13px 12px; }
        .pc__price { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
        .pc__devise{ font-size: 11px; font-weight: 400; color: #94a3b8; margin-left: 2px; }
        .pc__title { font-size: 13px; color: #334155; margin-bottom: 5px; line-height: 1.35; }
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
          font-size: 11.5px; color: #94a3b8; margin-bottom: 9px;
        }
        .pc__specs {
          display: flex; gap: 12px;
          padding-top: 8px; border-top: 1px solid #f1f5f9;
        }
        .pc__specs span {
          display: flex; align-items: center; gap: 3px;
          font-size: 11px; color: #64748b;
        }

        /* ── Barre évaluation prix ── */
        /* Cluster popup — supprimer le padding interne de Leaflet */
        /* Cluster popup — rectangle rigide, grande taille */
        .cluster-popup .leaflet-popup-content-wrapper {
          padding: 0; border-radius: 3px; overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.14);
          border: 1.5px solid #e2e8f0;
        }
        .cluster-popup .leaflet-popup-content { margin: 0; width: auto !important; line-height: 1; }
        .cluster-popup .leaflet-popup-tip-container { display: none; } /* pas de flèche pointue */
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

        /* ══════════════════════════════════════
           PINS CARTE
        ══════════════════════════════════════ */
        /* Non-boosted pin — small */
        /* ── Punaises — base ── */
        .pin-dot {
          border-radius: 50%; border: 2.5px solid #fff;
          cursor: pointer; transition: transform .13s, box-shadow .13s;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .pin-dot:hover, .pin-dot--active { transform: scale(1.4); z-index: 999 !important; }

        /* ── Achat / vente — vert (comme badge carte) ── */
        .pin-dot--vente {
          width: 20px; height: 20px;
          background: #166534;
          box-shadow: 0 2px 8px rgba(22,101,52,.50);
        }
        .pin-dot--vente:hover, .pin-dot--vente.pin-dot--active {
          background: #14532d;
          box-shadow: 0 3px 14px rgba(22,101,52,.70);
        }
        /* ── Location — bleu indigo (comme badge carte) ── */
        .pin-dot--location {
          width: 20px; height: 20px;
          background: #1e40af;
          box-shadow: 0 2px 8px rgba(30,64,175,.50);
        }
        .pin-dot--location:hover, .pin-dot--location.pin-dot--active {
          background: #1e3a8a;
          box-shadow: 0 3px 14px rgba(30,64,175,.70);
        }
        /* ── Vacances — ambre ── */
        .pin-dot--vacances {
          width: 20px; height: 20px;
          background: #d97706;
          box-shadow: 0 2px 8px rgba(217,119,6,.50);
        }
        .pin-dot--vacances:hover, .pin-dot--vacances.pin-dot--active {
          background: #b45309;
          box-shadow: 0 3px 14px rgba(217,119,6,.70);
        }
        /* ── Fallback bordeaux ── */
        .pin-dot--std {
          width: 20px; height: 20px;
          background: #9b1c2e;
          box-shadow: 0 2px 8px rgba(155,28,46,.45);
        }
        .pin-dot--std:hover, .pin-dot--std.pin-dot--active {
          background: #7c1022;
          box-shadow: 0 3px 14px rgba(155,28,46,.65);
        }

        /* Icônes internes */
        .pin-star {
          font-size: 13px; color: #fff; line-height: 1;
          pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,.4);
        }
        .pin-icon {
          font-size: 14px; line-height: 1;
          pointer-events: none; filter: drop-shadow(0 1px 1px rgba(0,0,0,.3));
        }

        /* POI markers */
        /* ── POI markers — carré arrondi pour se distinguer visuellement
              des punaises rondes des annonces ── */
        .poi-icon {
          width: 30px; height: 30px;
          border-radius: 8px;          /* ← CARRÉ ARRONDI ≠ cercle des pins */
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,.28);
          cursor: pointer; transition: transform .12s;
        }
        .poi-icon:hover { transform: scale(1.15); }

        /* Couleurs distinctes de tous les niveaux de pins :
           pins = orange / doré / indigo / gris
           POI  = cyan / vert émeraude / violet foncé               */
        .poi-icon--school  { background: #0ea5e9; }   /* cyan  — ≠ indigo pins */
        .poi-icon--mosque  { background: #059669; }   /* émeraude — aucun pin n'est vert */
        .poi-icon--faculty { background: #7c3aed; }   /* violet foncé — aucun pin n'est violet */

        /* ══════════════════════════════════════
           RESPONSIVE
        ══════════════════════════════════════ */

        @media (max-width: 860px) {
          .cp-layout   { flex-direction: column; }
          .cp-map      { flex: 1; }
          .cp-list     { display: none !important; }
          .cp-listonly { grid-template-columns: 1fr 1fr; padding: 12px; }
          .cp-bar      { padding: 4px 10px; min-height: 32px; }

          /* ── Panneau filtres : tout empilé verticalement ── */
          .fp          { padding: 10px 12px 12px; }

          /* Ligne 1 : barre de recherche + boutons Filtres/Rechercher */
          .fp__row1    { flex-direction: column; gap: 8px; align-items: stretch; }
          .fp__search  { min-width: 0; }
          .fp__pill-group { display: none; }          /* cachées sur mobile */
          .fp__row1 > div:last-child { flex-direction: row; justify-content: flex-end; gap: 8px; margin-left: 0; }

          /* Ligne 2 : localisation — chaque select sur sa propre ligne */
          .fp__loc-row        { flex-direction: column; align-items: stretch; gap: 6px; margin-top: 8px; }
          .loc-cascade        { flex-direction: column; gap: 6px; width: 100%; }
          .loc-cascade__arrow { display: none; }
          .loc-cascade__field { width: 100%; flex: none; min-width: 0; }

          /* Boutons POI (Écoles / Mosquées / Facultés) — même ligne */
          .fp__poi-group      { display: flex; flex-direction: row; gap: 6px; flex-wrap: nowrap; width: 100%; }
          .fp__poi-btn        { flex: 1; justify-content: center; }
        }

        @media (max-width: 640px) {
          .cp-listonly { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
