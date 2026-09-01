import API_URL from '../config';

// Mapping for Haute Couture Dresses DSC camera placeholders to high-res dress images
const DRESS_DSC_MAP = {
  'DSC04689': '/dresses/1.png',
  'DSC04710': '/dresses/2.png',
  'DSC04862': '/dresses/3.png',
  'DSC04995': '/dresses/4.png',
  'DSC05002': '/dresses/5.png',
  'DSC05010': '/dresses/6.png'
};

export function getProductImage(url) {
  if (!url) return '/products/Lehenga-Pink%20Blush/1.JPG';
  let str = String(url).trim();

  // 1. If localhost:5000 is present in URL (e.g. from local DB uploads), replace with production backend
  if (str.includes('localhost:5000')) {
    const backendHost = API_URL || 'https://miraya-by-garima.onrender.com';
    str = str.replace(/http:\/\/localhost:5000/g, backendHost);
  }

  // 2. Ensure HTTPS for render backend to prevent Mixed Content blocking on live site
  if (str.startsWith('http://miraya-by-garima.onrender.com')) {
    str = str.replace('http://', 'https://');
  }

  // 3. Check for Haute Couture DSC dummy camera placeholders
  for (const [dscKey, dressImg] of Object.entries(DRESS_DSC_MAP)) {
    if (str.includes(dscKey)) {
      // If it's a raw DSC reference on dresses, fallback to dress asset
      str = str.replace(new RegExp(`/products/${dscKey}\\.(jpg|JPG)`, 'i'), dressImg);
      break;
    }
  }

  // 4. Fix Linux / Vercel case-sensitivity for static DSC and product assets
  if (str.includes('/products/') && str.endsWith('.jpg')) {
    str = str.replace(/\.jpg$/, '.JPG');
  }

  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  const backendHost = API_URL || 'https://miraya-by-garima.onrender.com';
  if (str.startsWith('/uploads/')) {
    return `${backendHost}${str}`;
  }
  if (str.startsWith('uploads/')) {
    return `${backendHost}/${str}`;
  }

  return str;
}

export function getProductGallery(product) {
  if (!product) return ['/products/Lehenga-Pink%20Blush/1.JPG'];

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
  if (!primary) return ['/products/Lehenga-Pink%20Blush/1.JPG'];

  if (primary.includes('/products/') && (primary.endsWith('/1.JPG') || primary.endsWith('/1.jpg'))) {
    const basePath = primary.substring(0, primary.lastIndexOf('/'));
    return [1, 2, 3, 4, 5].map(n => getProductImage(`${basePath}/${n}.JPG`));
  }

  return [getProductImage(primary)];
}


