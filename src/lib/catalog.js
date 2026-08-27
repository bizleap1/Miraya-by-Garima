import { productsData, getProductById as getStaticProductById } from '../data/products';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://miraya-by-garima.onrender.com' : 'http://localhost:5000');

function formatApiProduct(data, categoryParam) {
  let images = data.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch (_) { images = [images]; }
  }
  if (!Array.isArray(images) || images.length === 0) {
    images = [data.image_url || data.image || '/products/Lehenga-Pink%20Blush/1.JPG'];
  }
  const primary = data.image_url || data.image || images[0];
  if (primary && primary.includes('/products/') && (primary.endsWith('/1.JPG') || primary.endsWith('/1.jpg')) && images.length === 1) {
    const basePath = primary.substring(0, primary.lastIndexOf('/'));
    images = [1, 2, 3, 4, 5].map(n => `${basePath}/${n}.JPG`);
  }

  return {
    id: data.id,
    name: data.name || data.title || 'Haute Couture Garment',
    title: data.name || data.title || 'Haute Couture Garment',
    price: typeof data.price === 'number' ? `₹${data.price.toLocaleString('en-IN')}` : data.price,
    rawPrice: typeof data.price === 'number' ? data.price : parseFloat(String(data.price).replace(/[^0-9.]/g, '') || 0),
    mrp_price: data.mrp_price,
    is_on_sale: data.is_on_sale,
    discount_percent: data.discount_percent,
    promo_label: data.promo_label,
    whatsapp_inquiry: data.whatsapp_inquiry,
    category: data.category?.slug || data.category?.name || data.category || categoryParam || 'indo-western',
    description: data.description || 'Handcrafted Haute Couture ensemble designed with artisanal precision by Miraya by Garima Nagpur.',
    image: primary,
    images: images,
    sizes: data.sizes?.length ? data.sizes : ['Free Size (M to XL)'],
    size_stock: data.size_stock,
    fabric: data.fabric || 'Pure Silk, Georgette & Organza Blend',
    color: data.color || 'Artisanal Palette',
    wash_care: data.wash_care || 'Professional Dry Clean Only',
    craftsmanship: data.craftsmanship || 'Handcrafted Zari, Sequins & Thread Embroidery',
    inStock: (data.stock ?? 1) > 0,
    stock: data.stock ?? 1,
  };
}

/**
 * Fetch a single product for Server-Side Rendering (SSR)
 */
export async function getProductById(id, categoryParam) {
  if (!id) return null;
  const cleanId = String(id).trim();

  // 1. Try fetching from Backend API (with Render production fallback)
  const apiUrls = [
    API_BASE,
    'https://miraya-by-garima.onrender.com'
  ].filter((url, idx, arr) => url && arr.indexOf(url) === idx);

  for (const baseUrl of apiUrls) {
    try {
      const res = await fetch(`${baseUrl}/api/products/${cleanId}`, {
        next: { revalidate: 30 }, // ISR cache revalidation every 30 seconds
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.name || data.title)) {
          return formatApiProduct(data, categoryParam);
        }
      }
    } catch (e) {
      // Try next URL
    }
  }

  // 1b. If cleanId contains category prefix (e.g. "indo-western-iw-1"), try stripped ID on backend
  if (cleanId.includes('-')) {
    const parts = cleanId.split('-');
    const strippedId = parts.slice(-2).join('-');
    if (strippedId && strippedId !== cleanId) {
      try {
        const res = await fetch(`${API_BASE}/api/products/${strippedId}`, {
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.id || data.name || data.title)) {
            return formatApiProduct(data, categoryParam);
          }
        }
      } catch (e) {}
    }
  }

  // 2. Fallback to static catalog dataset using robust lookup
  const found = getStaticProductById(cleanId, categoryParam);
  if (found) {
    const rawPrice = typeof found.price === 'number'
      ? found.price
      : parseFloat(String(found.price).replace(/[^0-9.]/g, '') || 0);
    return {
      ...found,
      name: found.title || found.name || 'Haute Couture Garment',
      rawPrice,
      description: found.description || `Handcrafted ${found.title} in ${found.fabric || 'pure luxury fabric'} with ${found.craftsmanship || 'bespoke detailing'} by Miraya by Garima.`,
      inStock: true,
      stock: 5,
    };
  }

  return null;
}

/**
 * Fetch all products for dynamic sitemap and search
 */
export async function getAllProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p) => ({
          id: p.id,
          name: p.name || p.title,
          category: (p.category?.slug || p.category?.name || p.category || 'indo-western').toLowerCase().replace(/\s+/g, '-'),
          updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
        }));
      }
    }
  } catch (e) {
    console.warn('[SSR Catalog] All products API fetch failed, using fallback.');
  }

  // Static fallback
  const all = [];
  for (const [cat, list] of Object.entries(productsData)) {
    for (const item of list) {
      all.push({
        id: item.id,
        name: item.title,
        category: cat,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return all;
}

/**
 * Fetch all categories
 */
export async function getAllCategories() {
  const defaults = [
    { slug: 'indo-western', name: 'Indo Western & Lehengas', description: 'Contemporary drape sarees, pre-stitched gowns and bridal lehengas.' },
    { slug: 'drape-saree', name: 'Drape Sarees', description: 'Effortless luxury pre-draped cocktail and reception sarees.' },
    { slug: 'bridal-lehenga', name: 'Bridal Lehengas', description: 'Handcrafted bridal lehengas featuring heritage Zardozi craftsmanship.' },
    { slug: 'co-ord-sets', name: 'Couture Co-ords', description: 'Artisanal embroidered Indo-Western jacket and trouser co-ord sets.' },
    { slug: 'gowns', name: 'Reception & Cocktail Gowns', description: 'Sculptural silhouette evening gowns tailored in Nagpur.' },
  ];
  return defaults;
}
