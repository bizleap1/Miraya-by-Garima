'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, X, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import './AboutPage.css';

// Custom luxury line icons matching editorial haute couture aesthetic
const LotusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="about-luxury-icon">
    <path d="M12 3c-1.5 3-4 6-7 7 3 1.5 5 4 5 7 0-4 1-7 2-14z" />
    <path d="M12 3c1.5 3 4 6 7 7-3 1.5-5 4-5 7 0-4-1-7-2-14z" />
    <path d="M12 21c-3-2-6-1-8 0 1-3 3-5 8-5 5 0 7 2 8 5-2-1-5-2-8 0z" />
    <path d="M12 10c-2 2-3 4-3 7 1-1 2-2 3-2s2 1 3 2c0-3-1-5-3-7z" />
  </svg>
);

const FabricIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="about-luxury-icon">
    <ellipse cx="17.5" cy="8" rx="3.5" ry="5" transform="rotate(30 17.5 8)" />
    <path d="M6 16.5l8.5-5" />
    <path d="M4 19.5l9-5.5" />
    <path d="M4 14.5l10.5-6.5" />
    <ellipse cx="6.5" cy="17" rx="3.5" ry="2" transform="rotate(30 6.5 17)" />
  </svg>
);

const SilhouetteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="about-luxury-icon">
    <path d="M9 3h6v2l-1 2.5c2 2 3 5 2.5 8.5L18 20H6l1.5-4c-.5-3.5.5-6.5 2.5-8.5L9 5V3z" />
    <path d="M10 12h4" />
    <path d="M12 20v2" />
    <path d="M9 22h6" />
  </svg>
);

const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="about-luxury-icon">
    <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
    <path d="M2 9h20" />
    <path d="M12 21L8 9l4-6 4 6-4 12z" />
  </svg>
);

const FloralEmblem = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="about-floral-emblem">
    <path d="M16 4C14 8 11 12 7 14c4 2 7 6 7 10 0-5 2-9 2-20z" />
    <path d="M16 4c2 4 5 8 9 10-4 2-7 6-7 10 0-5-2-9-2-20z" />
    <circle cx="16" cy="16" r="2" fill="currentColor" />
  </svg>
);

const AboutPage = () => {
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const collageItems = [
    {
      img: '/about-collage-1.png',
      alt: 'Master artisan hand zardozi embroidery in Miraya atelier',
      kicker: 'TRADITION',
      title: 'IN EVERY THREAD',
    },
    {
      img: '/about-collage-2.png',
      alt: 'Handcrafted luxury bridal lehengas and reception gowns on boutique racks',
      kicker: 'CURATED',
      title: 'WITH LOVE',
    },
    {
      img: '/about-collage-3.png',
      alt: 'Miraya by Garima signature gold foil label on blush couture fabric',
      kicker: 'MADE FOR',
      title: 'REAL WOMEN',
    },
    {
      img: '/about-collage-4.png',
      alt: 'Delicate floral bouquet styling reflecting timeless femininity',
      kicker: 'TIMELESS',
      title: 'BY DESIGN',
    },
  ];

  return (
    <main className="about-editorial-page">
      <SEO
        title="About Miraya by Garima | The Story Behind The Couture House"
        description="Discover the story of Miraya by Garima. Rooted in heritage, designed for the modern woman — luxury bespoke couture, pure silk embroidery, and timeless silhouettes."
        keywords="About Miraya by Garima, Designer Garima Nagpur, Couture Atelier Nagpur, Indian Haute Couture, Luxury Bridal Lehengas"
      />

      {/* 1. CINEMATIC HERO SECTION */}
      <section className="about-hero-section">
        <div className="about-hero-bg-wrapper">
          <img
            src="/about-us-garima.png"
            alt="Garima, Founder and Creative Director of Miraya by Garima, in red couture ensemble"
            className="about-hero-bg-img"
            loading="eager"
          />
          <div className="about-hero-overlay" />
        </div>

        <div className="about-hero-container">
          <motion.div
            className="about-hero-typography"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="about-kicker-eyebrow">ABOUT US</span>
            <h1 className="about-hero-title">
              The Story
              <span className="about-hero-title-break">Behind Miraya</span>
            </h1>

            <div className="about-hero-tagline">
              <span>TRADITION</span>
              <span className="about-dot">•</span>
              <span>MEETS A BRIGHTER YOU</span>
            </div>

            <p className="about-hero-desc">
              Miraya by Garima is a celebration of the modern Indian woman — rooted in heritage, designed for today.
              Each ensemble is a reflection of timeless craftsmanship, luxurious fabrics and a deep love for every
              woman&apos;s unique story.
            </p>

            <div className="about-hero-cta-wrapper">
              <Link to="/collection/all" className="about-hero-btn">
                <span>EXPLORE OUR COLLECTIONS</span>
                <ArrowRight size={16} className="about-btn-arrow" />
              </Link>
            </div>

            <p className="about-hero-script">More than fashion, it&apos;s a feeling —</p>
          </motion.div>
        </div>
      </section>

      {/* 2. FOUNDER STORY SECTION */}
      <section className="about-founder-section">
        <div className="about-section-container">
          <div className="about-founder-grid">
            {/* Left Column: Founder Portrait */}
            <motion.div
              className="about-founder-portrait-col"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1 }}
            >
              <div className="about-portrait-vertical-label">
                <span className="about-vertical-text">FOUNDER</span>
                <span className="about-vertical-line" />
              </div>

              <div className="about-portrait-frame">
                <div className="about-portrait-outer-border" />
                <div className="about-portrait-img-box">
                  <img
                    src="/about-founder-portrait.png"
                    alt="Garima - Founder of Miraya by Garima"
                    className="about-founder-img"
                    loading="lazy"
                  />
                </div>
              </div>
            </motion.div>

            {/* Center Column: Narrative & Signature */}
            <motion.div
              className="about-founder-narrative-col"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1, delay: 0.15 }}
            >
              <span className="about-section-eyebrow">FROM THE FOUNDER</span>

              <blockquote className="about-founder-quote">
                “ Miraya is my way of celebrating every woman&apos;s unique kind of beauty. ”
              </blockquote>

              <div className="about-founder-paragraphs">
                <p>
                  When I started Miraya, it was more than just a label — it was a deeply personal dream. I wanted to
                  create ensembles that make you feel graceful, confident and effortlessly you. Every piece is
                  thoughtfully designed with love, keeping in mind the modern woman who values tradition, quality and
                  individuality.
                </p>
                <p>Thank you for being a part of this journey.</p>
              </div>

              <div className="about-founder-signature-box">
                <div className="about-calligraphy-signature">Garima</div>
                <div className="about-founder-meta">
                  <span className="about-meta-name">GARIMA</span>
                  <span className="about-meta-title">Founder, Miraya by Garima</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Founder's Edit & Smartphone Reel */}
            <motion.div
              className="about-founder-reel-col"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <div className="about-reel-layout">
                {/* Smartphone Reel Device Frame */}
                <div
                  className="about-phone-mockup"
                  onClick={() => setVideoOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setVideoOpen(true)}
                  aria-label="Play Founder Atelier Story Reel"
                >
                  <div className="about-phone-bezel">
                    {/* Top Notch / Speaker */}
                    <div className="about-phone-top-bar">
                      <div className="about-phone-avatar">
                        <img src="/about-thumb-1.png" alt="Miraya" />
                      </div>
                      <div className="about-phone-account">
                        <span className="about-phone-name">Miraya by Garima</span>
                        <span className="about-phone-sub">Founder&apos;s Edit</span>
                      </div>
                      <div className="about-phone-status-dots">•••</div>
                    </div>

                    {/* Reel Video Stream */}
                    <div className="about-phone-screen">
                      <video
                        src="/about-reel.mp4"
                        poster="/about-reel-poster.jpg"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="about-phone-video-stream"
                      />

                      {/* Glassmorphic Play Button */}
                      <div className="about-phone-play-btn">
                        <div className="about-play-pulse" />
                        <Play size={20} className="about-play-triangle" fill="white" stroke="none" />
                      </div>

                      {/* Reel Bottom Meta */}
                      <div className="about-phone-bottom-meta">
                        <span className="about-reel-caption">Watch The Story</span>
                        <span className="about-reel-duration">0:26</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Editorial Copy & Mini Thumbnails */}
                <div className="about-reel-info-side">
                  <span className="about-section-eyebrow">FOUNDER&apos;S EDIT</span>
                  <h2 className="about-reel-heading">Behind the Label</h2>
                  <p className="about-reel-desc">
                    A glimpse into the craft, the details and the story that inspires Miraya.
                  </p>

                  <div className="about-mini-thumbnails">
                    <button
                      type="button"
                      className="about-mini-thumb-btn"
                      onClick={() => setVideoOpen(true)}
                      aria-label="View embroidery detail clip"
                    >
                      <img src="/about-thumb-1.png" alt="Close-up hand embroidery detail" />
                    </button>
                    <button
                      type="button"
                      className="about-mini-thumb-btn"
                      onClick={() => setVideoOpen(true)}
                      aria-label="View bodice craft clip"
                    >
                      <img src="/about-thumb-2.png" alt="Couture bodice craftsmanship" />
                    </button>
                    <button
                      type="button"
                      className="about-mini-thumb-btn"
                      onClick={() => setVideoOpen(true)}
                      aria-label="View silhouette drape clip"
                    >
                      <img src="/about-thumb-3.png" alt="Cape and silhouette drape" />
                    </button>
                  </div>

                  <a
                    href="https://www.instagram.com/miraya_official.in/reels/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-reel-more-link"
                    aria-label="Watch more reels on Miraya by Garima Instagram"
                  >
                    <span>WATCH MORE REELS</span>
                    <ArrowRight size={14} className="about-more-arrow" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. BRAND VALUES SECTION ("A Closer Look at Our World") */}
      <section className="about-values-section">
        <div className="about-section-container">
          <div className="about-values-header">
            <span className="about-section-eyebrow">WHAT MAKES MIRAYA SPECIAL</span>
            <h2 className="about-values-title">A Closer Look at Our World</h2>
          </div>

          <div className="about-values-grid">
            <motion.div
              className="about-value-pillar"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="about-pillar-icon-box">
                <LotusIcon />
              </div>
              <h3 className="about-pillar-title">HANDCRAFTED DETAILS</h3>
              <p className="about-pillar-desc">
                Intricate embroidery and fine finishes, brought to life by skilled artisans.
              </p>
            </motion.div>

            <motion.div
              className="about-value-pillar"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <div className="about-pillar-icon-box">
                <FabricIcon />
              </div>
              <h3 className="about-pillar-title">LUXURY FABRICS</h3>
              <p className="about-pillar-desc">
                A curated selection of rich, breathable and enduring fabrics.
              </p>
            </motion.div>

            <motion.div
              className="about-value-pillar"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="about-pillar-icon-box">
                <SilhouetteIcon />
              </div>
              <h3 className="about-pillar-title">TIMELESS SILHOUETTES</h3>
              <p className="about-pillar-desc">
                Classic designs with a contemporary sensibility.
              </p>
            </motion.div>

            <motion.div
              className="about-value-pillar"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="about-pillar-icon-box">
                <DiamondIcon />
              </div>
              <h3 className="about-pillar-title">PERSONAL STYLING</h3>
              <p className="about-pillar-desc">
                A more thoughtful, personalised shopping experience.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. THE ART BEHIND MIRAYA (Editorial Collage Strip) */}
      <section className="about-collage-section" aria-label="Craftsmanship Collage">
        <div className="about-collage-strip">
          {collageItems.map((item, idx) => (
            <motion.div
              key={item.title}
              className="about-collage-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.12 }}
            >
              <div className="about-collage-img-wrap">
                <img src={item.img} alt={item.alt} className="about-collage-img" loading="lazy" />
                <div className="about-collage-vignette" />
              </div>
              <div className="about-collage-caption">
                <span className="about-collage-kicker">{item.kicker}</span>
                <span className="about-collage-headline">{item.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. FINAL BRAND STATEMENT ("Closing Statement") */}
      <section className="about-statement-section">
        <div className="about-statement-content">
          <div className="about-statement-emblem">
            <FloralEmblem />
          </div>

          <div className="about-statement-row">
            <span className="about-statement-hairline" />
            <h2 className="about-statement-quote">
              “ Elegance is a form of self-love. ”
            </h2>
            <span className="about-statement-hairline" />
          </div>

          <p className="about-statement-author">— GARIMA</p>
        </div>
      </section>

      {/* Video Modal Player */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            className="about-video-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              className="about-video-modal-container"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="about-video-close-btn"
                onClick={() => setVideoOpen(false)}
                aria-label="Close atelier video"
              >
                <X size={24} />
              </button>
              <div className="about-video-frame">
                <video
                  src="/about-reel.mp4"
                  poster="/about-reel-poster.jpg"
                  controls
                  autoPlay
                  playsInline
                  className="about-video-element"
                />
              </div>
              <div className="about-video-modal-footer">
                <span className="about-video-modal-title">Miraya by Garima • Founder&apos;s Story</span>
                <span className="about-video-modal-sub">Behind The Label • Handcrafted Elegance</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default AboutPage;
