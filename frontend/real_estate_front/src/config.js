// URL de l'API — en dev : localhost, en prod : variable Vercel
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export default API_URL;
