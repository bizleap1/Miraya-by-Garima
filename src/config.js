// Central API URL - uses VITE_API_URL env var, defaults to Render backend in production and localhost in dev
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://miraya-by-garima.onrender.com' : 'http://localhost:5000');

export default API_URL;
