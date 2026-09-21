'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function NewArrivalsHero({
  eyebrow = 'NEW SEASON',
  titlePart1 = 'Fresh',
  titlePart2 = 'Arrivals',
  subtitle = 'TRADITION MEETS TODAY',
  description = 'Discover our latest collection — where timeless craftsmanship meets modern silhouettes.',
  ctaText = 'EXPLORE NEW ARRIVALS',
  ctaLink = '/collection/all',
  imageSrc = '/products/Drape Saree-Grey Color/1.JPG'
}) {
  return (
    <section className="na-hero-section" aria-label="New Arrivals Editorial Showcase">
      <div className="na-hero-grid">
        {/* ── LEFT COLUMN: EDITORIAL TYPOGRAPHY & CTA ── */}
        <div className="na-hero-left">
          {/* Eyebrow */}
          <motion.div
            className="na-hero-eyebrow-row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="na-hero-eyebrow">{eyebrow}</span>
            <span className="na-eyebrow-line" aria-hidden="true" />
          </motion.div>

          {/* Display Heading */}
          <h1 className="na-hero-heading">
            <motion.span
              className="na-hero-heading-line1"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="heading-fresh">{titlePart1}</span>
              <span className="heading-sparkle" aria-hidden="true">✦</span>
            </motion.span>
            <motion.span
              className="na-hero-heading-line2"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <i className="heading-arrivals" style={{ fontStyle: 'normal' }}>{titlePart2}</i>
            </motion.span>
          </h1>

          {/* Subtitle & Copy */}
          <motion.div
            className="na-hero-sub-block"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="na-hero-subtitle">{subtitle}</p>
            <p className="na-hero-desc">
              Discover our latest collection —<br className="desktop-br" />
              where timeless craftsmanship<br className="desktop-br" />
              meets modern silhouettes.
            </p>
          </motion.div>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to={ctaLink} className="na-hero-cta" aria-label="Explore Miraya New Arrivals Collection">
              <span>{ctaText}</span>
              <span className="na-cta-arrow" aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>

        {/* ── CENTER COLUMN: MAIN FASHION CAMPAIGN IMAGE ── */}
        <div className="na-hero-center">
          <motion.div
            className="na-hero-img-wrap"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={imageSrc}
              alt="Miraya by Garima New Arrivals Couture Collection Editorial"
              className="na-hero-img"
              loading="eager"
            />
            {/* Subtle atmospheric vignette for seamless blending */}
            <div className="na-hero-vignette" aria-hidden="true" />
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN: MIRAYA MASTHEAD BRAND PANEL ── */}
        <div className="na-hero-right">
          <motion.div
            className="na-hero-masthead"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top Logo */}
            <div className="na-masthead-logo-wrap">
              <img
                src="/logoR.png"
                alt="Miraya by Garima Monogram Logo"
                className="na-masthead-logo"
              />
              <div className="na-masthead-brand-title">MIRAYA</div>
              <div className="na-masthead-brand-sub">— by garima —</div>
            </div>

            {/* Bottom Slogan / Masthead Statement */}
            <div className="na-masthead-statement">
              <div className="statement-line">MORE</div>
              <div className="statement-line">THAN</div>
              <div className="statement-line">OUTFITS</div>
              <div className="statement-divider" aria-hidden="true" />
              <div className="statement-feeling">A FEELING</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
