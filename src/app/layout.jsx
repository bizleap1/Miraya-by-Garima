import '../index.css';
import Providers from './providers';

export const metadata = {
  metadataBase: new URL('https://www.mirayabygarima.com'),
  title: {
    default: 'Miraya by Garima',
    template: '%s | Miraya by Garima',
  },
  description:
    "Discover Miraya by Garima - Nagpur's premier Haute Couture atelier for bespoke bridal lehengas, pre-stitched drape sarees, reception gowns, and Indo-Western designer co-ord sets. Visit our flagship boutique at Law College Square, Amravati Road, Nagpur.",
  keywords: [
    'Miraya by Garima',
    'Designer Boutique Nagpur',
    'Bridal Lehengas Nagpur',
    'Luxury Ethnic Wear Nagpur',
    'Drape Sarees',
    'Indo Western Lehengas',
    'Reception Gowns',
    'Custom Bridal Trousseau',
    'Law College Square Boutique',
    'Garima Designer Studio',
    'Indian Wedding Wear',
  ],
  authors: [{ name: 'Garima - Miraya by Garima' }],
  creator: 'Miraya by Garima',
  publisher: 'Miraya by Garima',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.mirayabygarima.com',
    siteName: 'Miraya by Garima',
    title: 'Miraya by Garima | Luxury Haute Couture & Bridal Apparel Nagpur',
    description:
      'Explore bespoke bridal lehengas, designer drape sarees, cocktail gowns, and couture co-ord sets handcrafted in Nagpur.',
    images: [
      {
        url: '/products/Lehenga-Pink%20Blush/1.JPG',
        width: 1200,
        height: 1600,
        alt: 'Miraya by Garima Haute Couture Bridal Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Miraya by Garima | Designer Bridal Lehengas & Luxury Ethnic Wear',
    description:
      "Nagpur's flagship atelier for bespoke bridal lehengas, reception gowns, drape sarees, and Indo-Western couture.",
    images: ['/products/Lehenga-Pink%20Blush/1.JPG'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logoR.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/logoR.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
  other: {
    'geo.region': 'IN-MH',
    'geo.placename': 'Nagpur',
    'geo.position': '21.1458;79.0882',
    ICBM: '21.1458, 79.0882',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'Miraya by Garima',
  image: 'https://www.mirayabygarima.com/products/Lehenga-Pink%20Blush/1.JPG',
  '@id': 'https://www.mirayabygarima.com/#store',
  url: 'https://www.mirayabygarima.com/',
  telephone: '+919271218156',
  priceRange: '₹₹₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop no. UG/5, Jagat Plaza, Mouze Pandharabodi, Law College Square, Amravati Rd',
    addressLocality: 'Nagpur',
    addressRegion: 'Maharashtra',
    postalCode: '440033',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.1458,
    longitude: 79.0882,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '11:00',
      closes: '21:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/miraya_official.in/',
    'https://www.facebook.com/profile.php?id=61591287333326',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logoR.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
