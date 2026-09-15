import DynamicSectionRenderer from '../components/DynamicSectionRenderer';
import { DEFAULT_SECTION_ORDER } from '../constants/defaultHomepageLayout';
import SEO from '../components/SEO';
import API_URL from '../config';

const STORAGE_KEY = 'miraya_homepage_layout_v1';

const homeSchema = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'Miraya by Garima',
  image: 'https://www.mirayabygarima.com/products/Lehenga-Pink%20Blush/1.JPG',
  url: 'https://www.mirayabygarima.com/',
  telephone: '+919271218156',
  priceRange: '₹₹₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop no. UG/5, Jagat Plaza, Law College Square, Amravati Rd',
    addressLocality: 'Nagpur',
    addressRegion: 'Maharashtra',
    postalCode: '440033',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.1458,
    longitude: 79.0882
  },
  sameAs: [
    'https://www.instagram.com/miraya_official.in/',
    'https://www.facebook.com/profile.php?id=61591287333326'
  ]
};

const Home = () => {
  const [sections, setSections] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return DEFAULT_SECTION_ORDER;
  });

  useEffect(() => {
    let isMounted = true;

    const fetchLayout = async () => {
      try {
        const res = await fetch(`${API_URL}/api/homepage-sections/layout`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.layout) && data.layout.length > 0) {
            setSections(data.layout);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.layout));
            } catch (_) {}
          }
        }
      } catch (_) {}
    };

    fetchLayout();

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSections(parsed);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <main>
      <SEO
        title="Haute Couture, Designer Bridal Lehengas & Luxury Ethnic Wear Nagpur"
        description="Miraya by Garima is Nagpur’s premier luxury bridal atelier. Explore handcrafted wedding lehengas, pre-draped sarees, cocktail gowns, and designer Indo-Western co-ord sets."
        keywords="Miraya by Garima, Designer Boutique Nagpur, Bridal Lehengas Nagpur, Luxury Ethnic Wear Nagpur, Drape Sarees, Reception Gowns, Law College Square Nagpur, Garima Designer Studio"
        schemaJson={homeSchema}
      />
      <DynamicSectionRenderer sections={sections} />
    </main>
  );
};

export default Home;
