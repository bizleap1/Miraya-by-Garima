import Hero from '../components/Hero';
import PremiumSlider from '../components/PremiumSlider';
import OurStory from '../components/OurStory';
import Collections from '../components/Collections';
import RealBrides from '../components/RealBrides';
import CorePillars from '../components/CorePillars';
import Lookbook from '../components/Lookbook';
import FinalCTA from '../components/FinalCTA';
import SEO from '../components/SEO';

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
  return (
    <main>
      <SEO
        title="Haute Couture, Designer Bridal Lehengas & Luxury Ethnic Wear Nagpur"
        description="Miraya by Garima is Nagpur’s premier luxury bridal atelier. Explore handcrafted wedding lehengas, pre-draped sarees, cocktail gowns, and designer Indo-Western co-ord sets."
        keywords="Miraya by Garima, Designer Boutique Nagpur, Bridal Lehengas Nagpur, Luxury Ethnic Wear Nagpur, Drape Sarees, Reception Gowns, Law College Square Nagpur, Garima Designer Studio"
        schemaJson={homeSchema}
      />
      <Hero />
      <PremiumSlider />
      <OurStory />
      <Collections />
      <RealBrides />
      <CorePillars />
      <Lookbook />
      <FinalCTA />
    </main>
  );
};

export default Home;
