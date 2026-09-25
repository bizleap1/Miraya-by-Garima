'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './HeroSlider.css';

const SLIDES = [
  {
    id: 1,
    bgImage: '/slidess/main1.jpg',
    mobileBgImage: '/slidess/mobile-slides/main1mr.jpg',
    brandText: 'MIRAYA BY GARIMA',
    headingScript: 'New',
    headingSerif: 'COLLECTION',
    subheading: 'Live Now',
    ctaText: 'Shop Now',
    ctaLink: '/collection/all',
    isLightBackground: false
  },
  {
    id: 2,
    bgImage: '/slidess/main2.jpg',
    mobileBgImage: '/slidess/mobile-slides/main2mr.jpg',
    brandText: 'MIRAYA BY GARIMA',
    headingScript: 'The Art of',
    headingSerif: 'ELEGANCE',
    subheading: 'Timeless ethnic wear, thoughtfully crafted for the modern wardrobe.',
    ctaText: 'Explore Collection',
    ctaLink: '/collection/all',
    isLightBackground: true
  }
];

const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const isLight = SLIDES[currentIndex].isLightBackground;
    window.dispatchEvent(new CustomEvent('hero-slide-change', { detail: { isLight } }));
  }, [currentIndex]);

  const slideVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 1.5, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <section className="hero-slider-section">
      <div className="hero-slider-container">
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            className="hero-slide"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* Background Image */}
              <picture>
                {currentSlide.mobileBgImage && (
                  <source media="(max-width: 768px)" srcSet={currentSlide.mobileBgImage} />
                )}
                <img 
                  className="hero-bg-image"
                  src={currentSlide.bgImage} 
                  alt="Campaign" 
                  fetchpriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding={index === 0 ? "sync" : "async"}
                />
              </picture>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="hero-slider-controls">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Mobile Text Content */}
      <div className="hero-mobile-text-container mobile-only">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.6 }}
            className="hero-mobile-text"
          >
            <p className="hm-brand">{currentSlide.brandText}</p>
            <div className="hm-ornament">
              <div className="hm-line"></div>
              <div className="hm-diamond"></div>
              <div className="hm-line"></div>
            </div>
            <h2 className="hm-title">
              <span className="hm-title-script">{currentSlide.headingScript}</span>
              <span className="hm-title-serif">{currentSlide.headingSerif}</span>
            </h2>
            <p className="hm-desc">{currentSlide.subheading}</p>
            <Link to={currentSlide.ctaLink} className="hm-cta">
              {currentSlide.ctaText} &rarr;
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HeroSlider;


