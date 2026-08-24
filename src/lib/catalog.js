import { productsData } from '../data/products';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Fetch a single product for Server-Side Rendering (SSR)
 */
export async function getProductById(id, categoryParam) {
  // 1. Try fetching from Backend API
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      next: { revalidate: 60 }, // ISR cache revalidation every 60 seconds
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        return {
          id: data.id,
          name: data.name || data.title || 'Haute Couture Garment',
          title: data.name || data.title || 'Haute Couture Garment',
          price: typeof data.price === 'number' ? `₹${data.price.toLocaleString('en-IN')}` : data.price,
          rawPrice: typeof data.price === 'number' ? data.price : parseFloat(String(data.price).replace(/[^0-9.]/g, '') || 0),
          category: data.category?.name || data.category || categoryParam || 'couture',
          description: data.description || 'Handcrafted Haute Couture ensemble designed with artisanal precision by Miraya by Garima Nagpur.',
          image: data.image_url || data.image || (data.images && data.images[0]) || '/products/Lehenga-Pink%20Blush/1.JPG',
          images: data.images?.length ? data.images : [data.image_url || data.image || '/products/Lehenga-Pink%20Blush/1.JPG'],
          sizes: data.sizes?.length ? data.sizes : ['S', 'M', 'L', 'XL'],
          fabric: data.fabric || 'Pure Silk, Georgette & Organza Blend',
          color: data.color || 'Artisanal Palette',
          wash_care: data.wash_care || 'Professional Dry Clean Only',
          craftsmanship: data.craftsmanship || 'Handcrafted Zari, Sequins & Thread Embroidery',
          inStock: (data.stock ?? 1) > 0,
          stock: data.stock ?? 10,
        };
      }
    }
  } catch (e) {
    console.warn(`[SSR Catalog] API fetch failed for product ${id}, falling back to static catalog.`, e.message);
  }

  // 2. Fallback to static catalog dataset
  const catKeys = categoryParam ? [categoryParam, ...Object.keys(productsData)] : Object.keys(productsData);
  for (const cat of catKeys) {
    const list = productsData[cat] || [];
    const found = list.find((p) => String(p.id) === String(id));
    if (found) {
      const rawPrice = parseFloat(String(found.price).replace(/[^0-9.]/g, '') || 0);
      return {
        ...found,
        name: found.title || 'Haute Couture Garment',
        rawPrice,
        description: found.description || `Handcrafted ${found.title} in ${found.fabric || 'pure luxury fabric'} with ${found.craftsmanship || 'bespoke detailing'} by Miraya by Garima.`,
        inStock: true,
        stock: 5,
      };
    }
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
