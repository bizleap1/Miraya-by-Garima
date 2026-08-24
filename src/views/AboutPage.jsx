'use client';
import { motion } from 'framer-motion';
import About from '../components/About';
import BrandVoice from '../components/BrandVoice';
import SEO from '../components/SEO';
import './AboutPage.css';
import { useEffect } from 'react';

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="about-page-main">
      <SEO
        title="About The Atelier & Designer Garima"
        description="Learn the story of Miraya by Garima. Founded by designer Garima, our Nagpur atelier blends heritage Indian craftsmanship with modern haute couture silhouettes."
        keywords="About Miraya by Garima, Designer Garima Nagpur, Couture Atelier Nagpur, Indian Fashion Heritage"
      />
      <motion.div 
        className="about-page-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
      </motion.div>
      <About />
      <BrandVoice />
    </main>
  );
};

export default AboutPage;
