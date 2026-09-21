'use client';
import React, { useEffect } from 'react';
import SEO from '../components/SEO';
import NewArrivalsHero from '../components/new-arrivals/NewArrivalsHero';
import EditorialCategoryGrid from '../components/new-arrivals/EditorialCategoryGrid';
import LuxuryTrustStrip from '../components/new-arrivals/LuxuryTrustStrip';
import PremiumSlider from '../components/PremiumSlider';
import './NewArrivalsPage.css';

const newArrivalsSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'New Arrivals — Miraya by Garima',
  description:
    'Discover our latest collection where timeless Indian craftsmanship meets modern couture silhouettes. Explore handcrafted indo western suits, drape sarees, designer suits, and co-ord sets.',
  url: 'https://www.mirayabygarima.com/new-arrivals',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Miraya by Garima',
    url: 'https://www.mirayabygarima.com/'
  }
};

export default function NewArrivalsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="new-arrivals-page">
      <SEO
        title="New Arrivals | Luxury Haute Couture & Bridal Collection | Miraya by Garima"
        description="Discover the latest New Arrivals at Miraya by Garima — where timeless craftsmanship meets modern silhouettes. Shop bespoke indo western suits, drape sarees, designer suits, and couture co-ord sets."
        keywords="Miraya by Garima New Arrivals, Fresh Arrivals Nagpur, Indo Western Nagpur, Latest Drape Sarees, Luxury Ethnic Wear Nagpur, Wedding Trousseau"
        schemaJson={newArrivalsSchema}
      />

      {/* ── SECTION 01: EDITORIAL HERO ── */}
      <NewArrivalsHero />

      {/* ── SECTION 02: EDITORIAL CATEGORY GRID ── */}
      <EditorialCategoryGrid />

      {/* ── SECTION: PREMIUM SLIDER ── */}
      <PremiumSlider />

      {/* ── SECTION 03: LUXURY TRUST STRIP ── */}
      <LuxuryTrustStrip />
    </div>
  );
}
