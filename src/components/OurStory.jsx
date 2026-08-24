'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import './OurStory.css';
import { Link } from 'react-router-dom';

const Ornament = () => (
  <svg width="60" height="15" viewBox="0 0 60 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="section-ornament">
    <path d="M30 0L33 7.5L30 15L27 7.5L30 0Z" fill="#C6A46A" />
    <line x1="0" y1="7.5" x2="20" y2="7.5" stroke="#C6A46A" strokeWidth="0.5" />
    <line x1="40" y1="7.5" x2="60" y2="7.5" stroke="#C6A46A" strokeWidth="0.5" />
  </svg>
);

const useCounter = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [start, target, duration]);
  return count;
};

const StatCard = ({ value, label, suffix = '+', delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const numericValue = parseInt(value.replace(/\D/g, ''));
  const count = useCounter(numericValue, 1800, inView);
  const displaySuffix = value.includes('★') ? '★' : suffix;

  return (
    <motion.div
      ref={ref}
      className="stat-item"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
    >
      <h3>{value.includes('★') ? '5★' : `${count}${displaySuffix}`}</h3>
      <p>{label}</p>
    </motion.div>
  );
};

const OurStory = () => {
  return (
    <section className="our-story-section">
      <div className="our-story-bg-sketch"></div>
      <div className="container our-story-container">

        {/* Left Image Column */}
        <div className="our-story-image-col">
          <motion.div
            className="our-story-image-wrapper"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >

            <img src="/products/Lehenga-Pink Blush/1.JPG" alt="The Miraya Legacy" className="our-story-image" loading="lazy" />
            <div className="img-shimmer-overlay" />
          </motion.div>
        </div>

        {/* Right Content Column */}
        <div className="our-story-content-col">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h4 className="story-subtitle">OUR ESSENCE</h4>
            <Ornament />
            <h2 className="story-title">The Miraya <span className="story-title-script">Legacy</span></h2>

            <p className="story-description">
              Where Indian heritage meets contemporary elegance.
              Miraya brings together timeless craftsmanship, luxurious fabrics, and modern silhouettes to create occasion wear that feels both rooted and effortlessly refined.
            </p>

            <div className="story-stats-grid">
              <StatCard value="500" label="Happy Clients" suffix="+" delay={0.1} />
              <div className="stat-divider"></div>
              <StatCard value="50" label="Artisans" suffix="+" delay={0.2} />
              <div className="stat-divider"></div>
              <StatCard value="1000" label="Designs" suffix="+" delay={0.3} />
              <div className="stat-divider"></div>
              <StatCard value="5★" label="Customer Rating" suffix="" delay={0.4} />
            </div>

            <motion.div
              whileHover={{ x: 8 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ display: 'inline-block' }}
            >
              <Link to="/about" className="subtle-discover-btn" onClick={() => window.scrollTo(0, 0)}>
                DISCOVER OUR STORY &rarr;
              </Link>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default OurStory;
