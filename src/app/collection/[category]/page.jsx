import CategoryPage from '../../../views/CategoryPage';

const CATEGORY_SEO = {
  'indo-western': {
    name: 'Indo-Western & Pre-Stitched Gowns',
    title: 'Designer Indo-Western Lehengas & Pre-Stitched Gowns Nagpur | Miraya by Garima',
    description:
      'Explore bespoke Indo-Western couture, pre-draped sarees, contemporary jacket sets, and reception gowns handcrafted with artisanal Zari embroidery at Miraya by Garima, Nagpur.',
  },
  'drape-saree': {
    name: 'Drape Sarees & Cocktail Sarees',
    title: 'Designer Pre-Stitched Drape Sarees Nagpur | Luxury Party Wear | Miraya by Garima',
    description:
      'Discover effortless pre-stitched cocktail drape sarees and modern silhouette sarees handcrafted in pure georgette and shimmer silks at Miraya by Garima Nagpur.',
  },
  'bridal-lehenga': {
    name: 'Bridal Lehengas & Trousseau',
    title: 'Handcrafted Bridal Lehengas & Wedding Trousseau Nagpur | Miraya by Garima',
    description:
      'Nagpur’s finest destination for bespoke bridal lehengas featuring heritage Zardozi, Mukaish work, and royal silk craftsmanship. Book a bridal consultation at Law College Square.',
  },
  'co-ord-sets': {
    name: 'Couture Co-Ord Sets',
    title: 'Luxury Indo-Western Co-Ord Sets & Jacket Suits Nagpur | Miraya by Garima',
    description:
      'Shop statement artisanal co-ord sets, embroidered trousers, and crop tops tailored for festive celebrations and destination weddings by Miraya by Garima.',
  },
};

export async function generateMetadata({ params }) {
  const { category } = await params;
  const key = (category || '').toLowerCase();
  const info = CATEGORY_SEO[key] || {
    name: (category || 'Haute Couture').replace(/-/g, ' ').toUpperCase(),
    title: `Designer ${(category || 'Haute Couture').replace(/-/g, ' ')} Collection Nagpur | Miraya by Garima`,
    description: `Explore the handcrafted ${(category || 'Haute Couture').replace(/-/g, ' ')} collection designed with artisanal perfection by Miraya by Garima in Nagpur.`,
  };

  const canonicalUrl = `https://www.mirayabygarima.com/collection/${category}`;

  return {
    title: info.title,
    description: info.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: info.title,
      description: info.description,
      url: canonicalUrl,
      siteName: 'Miraya by Garima',
      type: 'website',
      images: [
        {
          url: '/products/Lehenga-Pink%20Blush/1.JPG',
          width: 1200,
          height: 1600,
          alt: `${info.name} - Miraya by Garima Nagpur`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: info.title,
      description: info.description,
      images: ['/products/Lehenga-Pink%20Blush/1.JPG'],
    },
  };
}

export default async function CollectionPage({ params }) {
  const { category } = await params;
  const key = (category || '').toLowerCase();
  const info = CATEGORY_SEO[key] || {
    name: (category || 'Collection').replace(/-/g, ' ').toUpperCase(),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mirayabygarima.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: info.name,
        item: `https://www.mirayabygarima.com/collection/${category}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryPage />
    </>
  );
}
