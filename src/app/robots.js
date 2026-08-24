export default function robots() {
  const baseUrl = 'https://www.mirayabygarima.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/product/',
          '/collection/',
          '/about',
          '/lookbook',
          '/contact',
          '/faq',
          '/privacy-policy',
          '/terms',
          '/shipping-returns',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/checkout',
          '/account',
          '/auth',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
