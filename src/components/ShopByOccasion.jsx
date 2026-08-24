'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './ShopByOccasion.css';

const LotusIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="occasion-icon">
    <path d="M12 22C12 22 10 16 4 15C10 14 11 8 12 2C13 8 14 14 20 15C14 16 12 22 12 22Z" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22C12 22 8 18 2 20C7 18 9 12 10 7" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22C12 22 16 18 22 20C17 18 15 12 14 7" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CrownIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="occasion-icon">
    <path d="M2 20H22M4 20L5 9L9 13L12 4L15 13L19 9L20 20" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LineOrnamentLeft = () => (
  <svg width="80" height="12" viewBox="0 0 80 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="title-ornament">
    <line x1="80" y1="6" x2="10" y2="6" stroke="#712323" strokeWidth="0.8" />
    <path d="M15 2L9 6L15 10" stroke="#712323" strokeWidth="0.8" fill="none" />
    <circle cx="5" cy="6" r="2.5" fill="none" stroke="#712323" strokeWidth="0.8" />
  </svg>
);

const LineOrnamentRight = () => (
  <svg width="80" height="12" viewBox="0 0 80 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="title-ornament">
    <line x1="0" y1="6" x2="70" y2="6" stroke="#712323" strokeWidth="0.8" />
    <path d="M65 2L71 6L65 10" stroke="#712323" strokeWidth="0.8" fill="none" />
    <circle cx="75" cy="6" r="2.5" fill="none" stroke="#712323" strokeWidth="0.8" />
  </svg>
);

const occasions = [
  {
    id: 1,
    title: 'Mehendi & Haldi',
    subtitle: 'Vibrant Yellows & Greens',
    image: '/mehendi-haldi.png',
    link: '/collection',
    icon: <LotusIcon />
  },
  {
    id: 2,
    title: 'Sangeet Glam',
    subtitle: 'Shimmery & Indo-western',
    image: '/sangeet-glam.png',
    link: '/collection',
    icon: <LotusIcon />
  },
  {
    id: 3,
    title: 'The Bridal Trousseau',
    subtitle: 'Heavy Ensembles & Sets',
    image: '/bridal-trousseau.png',
    link: '/collection',
    icon: <CrownIcon />
  },
  {
    id: 4,
    title: 'Festive Wear',
    subtitle: 'Elegant Co-ords & Suits',
    image: '/festive-wear.png',
    link: '/collection',
    icon: <LotusIcon />
  }
];

const ShopByOccasion = () => {
  return (
    <section className="shop-by-occasion-section">
      <div className="occasion-header">
        <div className="occasion-title-wrapper">
          <LineOrnamentLeft />
          <motion.h2 
            className="occasion-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            EXPLORE BY OCCASION
          </motion.h2>
          <LineOrnamentRight />
        </div>
      </div>

      <div className="occasion-grid">
        {occasions.map((occasion, index) => (
          <motion.div 
            key={occasion.id}
            className="occasion-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
          >
            <Link to={occasion.link} className="occasion-link">
              <div className="occasion-image-container">
                <img src={occasion.image} alt={occasion.title} className="occasion-image" loading="lazy" />
                <div className="occasion-overlay"></div>
                <div className="occasion-content">
                  <div className="icon-wrapper">
                    {occasion.icon}
                  </div>
                  <h3 className="occasion-card-title">{occasion.title}</h3>
                  <p className="occasion-card-subtitle">{occasion.subtitle}</p>
                  <span className="occasion-explore-btn">
                    EXPLORE <span className="arrow">→</span>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ShopByOccasion;
