import { getAllProducts, getAllCategories } from '../lib/catalog';

export default async function sitemap() {
  const baseUrl = 'https://www.mirayabygarima.com';

  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  // Static core routes
  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lookbook`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping-returns`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Category routes
  const categoryRoutes = categories.map((cat) => ({
    url: `${baseUrl}/collection/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Product routes
  const productRoutes = products.map((prod) => ({
    url: `${baseUrl}/product/${prod.category || 'indo-western'}/${prod.id}`,
    lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
