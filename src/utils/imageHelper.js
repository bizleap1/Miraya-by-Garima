import API_URL from '../config';

export function getProductImage(url) {
  if (!url) return '/products/Lehenga-Pink Blush/1.JPG';
  const str = String(url).trim();
  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  const backendHost = API_URL || 'http://localhost:5000';
  if (str.startsWith('/uploads/')) {
    return `${backendHost}${str}`;
  }
  if (str.startsWith('uploads/')) {
    return `${backendHost}/${str}`;
  }
  return str;
}

export function getProductGallery(product) {
  if (!product) return ['/products/Lehenga-Pink Blush/1.JPG'];

  // Parse images if stringified JSON
  let rawImages = product.images;
  if (typeof rawImages === 'string') {
    try {
      rawImages = JSON.parse(rawImages);
    } catch (_) {
      rawImages = [rawImages];
    }
  }

  // 1. If images array with 1 or more items exists
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    // If it's a single static folder path, expand into 5 angles
    if (rawImages.length === 1) {
      const single = String(rawImages[0] || '').trim();
      if (single.includes('/products/') && (single.endsWith('/1.JPG') || single.endsWith('/1.jpg'))) {
        const basePath = single.substring(0, single.lastIndexOf('/'));
        return [1, 2, 3, 4, 5].map(n => getProductImage(`${basePath}/${n}.JPG`));
      }
    }
    return rawImages.map(img => getProductImage(img));
  }

  // 2. Primary image fallback
  const primary = String(product.image_url || product.image || '').trim();
  if (!primary) return ['/products/Lehenga-Pink Blush/1.JPG'];

  if (primary.includes('/products/') && (primary.endsWith('/1.JPG') || primary.endsWith('/1.jpg'))) {
    const basePath = primary.substring(0, primary.lastIndexOf('/'));
    return [1, 2, 3, 4, 5].map(n => getProductImage(`${basePath}/${n}.JPG`));
  }

  return [getProductImage(primary)];
}

