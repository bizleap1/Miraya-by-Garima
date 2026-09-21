import NewArrivalsPage from '../../views/NewArrivalsPage';

export const metadata = {
  title: 'New Arrivals | Designer Bridal Lehengas & Luxury Couture | Miraya by Garima',
  description:
    'Discover our latest collection — where timeless craftsmanship meets modern silhouettes. Shop handcrafted bridal lehengas, pre-stitched drape sarees, designer suits, and couture co-ord sets.',
  alternates: {
    canonical: 'https://www.mirayabygarima.com/new-arrivals',
  },
  openGraph: {
    title: 'New Arrivals — Fresh Haute Couture Collection | Miraya by Garima',
    description:
      'Explore the latest bridal lehengas, designer drape sarees, and festive co-ord sets handcrafted in Nagpur by Miraya by Garima.',
    url: 'https://www.mirayabygarima.com/new-arrivals',
    siteName: 'Miraya by Garima',
    type: 'website',
    images: [
      {
        url: '/assets/new-arrivals/hero-model.jpg',
        width: 1200,
        height: 1600,
        alt: 'Miraya by Garima New Arrivals Editorial Campaign',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'New Arrivals | Miraya by Garima Luxury Indian Couture',
    description:
      'Discover our latest collection where timeless craftsmanship meets modern silhouettes.',
    images: ['/assets/new-arrivals/hero-model.jpg'],
  },
};

export default function Page() {
  return <NewArrivalsPage />;
}
