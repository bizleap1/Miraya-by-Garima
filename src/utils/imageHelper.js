import API_URL from '../config';

export function getProductImage(url) {
  if (!url) return '/products/Lehenga-Pink Blush/1.JPG';
  const str = String(url).trim();
  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  if (str.startsWith('/uploads')) {
    const backendHost = API_URL || 'http://localhost:5000';
    return `${backendHost}${str}`;
  }
  return str;
}
