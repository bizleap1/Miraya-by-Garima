import Hero from '../components/Hero';
import PremiumSlider from '../components/PremiumSlider';
import OurStory from '../components/OurStory';
import Collections from '../components/Collections';
import RealBrides from '../components/RealBrides';
import CorePillars from '../components/CorePillars';
import Lookbook from '../components/Lookbook';
import FinalCTA from '../components/FinalCTA';

export const metadata = {
  title: 'Miraya by Garima',
  description:
    'Miraya by Garima is Nagpur’s premier luxury bridal atelier. Explore handcrafted wedding lehengas, pre-draped sarees, cocktail gowns, and designer Indo-Western co-ord sets at Law College Square.',
  alternates: {
    canonical: 'https://www.mirayabygarima.com/',
  },
};

export default function HomePage() {
  return (
    <main>
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
}
