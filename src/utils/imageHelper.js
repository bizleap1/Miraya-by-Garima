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

export function getProductGallery(product) {
  if (!product) return ['/products/Lehenga-Pink Blush/1.JPG'];
  
  if (Array.isArray(product.images) && product.images.length > 1) {
    return product.images.map(img => getProductImage(img));
  }

  const primary = product.image_url || product.image || (Array.isArray(product.images) && product.images[0]) || '';
  if (!primary) return ['/products/Lehenga-Pink Blush/1.JPG'];

  // Automatically expand /products/<folder>/1.JPG into full 5-image gallery (1.JPG to 5.JPG)
  if (primary.includes('/products/') && (primary.endsWith('/1.JPG') || primary.endsWith('/1.jpg'))) {
    const basePath = primary.substring(0, primary.lastIndexOf('/'));
    return [1, 2, 3, 4, 5].map(n => getProductImage(`${basePath}/${n}.JPG`));
  }

  return [getProductImage(primary)];
}
