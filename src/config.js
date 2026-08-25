// Central API URL - uses NEXT_PUBLIC_API_URL env var, defaults to Render backend in production and localhost in dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://miraya-by-garima.onrender.com' : 'http://localhost:5000');

export default API_URL;
