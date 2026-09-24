'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './ShopByCategory.css';

const CATEGORIES = [
  {
    id: 1,
    name: 'INDO WESTERN',
    image: '/the miraya legacy.JPG',
    link: '/collection/indo-western',
    gridClass: 'sbc-item-large-left',
    type: 'large'
  },
  {
    id: 2,
    name: 'DRAPE SAREES',
    image: '/images/category/drape-sarees.jpg', // Group photo (3 girls in drape sarees)
    link: '/collection/drape-sarees',
    gridClass: 'sbc-item-small-top',
    type: 'small'
  },
  {
    id: 3,
    name: 'COCKTAIL DRESS',
    image: '/images/category/indo-western.jpg', // Group photo (3 girls in black/embellished)
    link: '/collection/lehenga',
    gridClass: 'sbc-item-small-bottom',
    type: 'small'
  },
  {
    id: 4,
    name: 'PREMIUM SUITS',
    image: '/The Miraya 2.JPG',
    link: '/collection/designer-suits',
    gridClass: 'sbc-item-large-right',
    type: 'large',
    scale: 1.25 // Zoomed in so the model's scale matches the left image
  },
];

const ShopByCategory = () => {
  return (
    <section className="shop-by-category-section">
      <div className="sbc-header-container">
        <div className="sbc-title-wrapper">
          <h2 className="sbc-main-heading legacy-heading">
            <span className="sbc-serif-text">The Miraya </span>
            <span className="sbc-script-text">Legacy</span>
          </h2>
        </div>
      </div>

      <div className="sbc-grid-container">
        <div className="sbc-grid desktop-grid">
          {CATEGORIES.map((cat, index) => (
            <Link to={cat.link} className={`sbc-card ${cat.gridClass}`} key={cat.id}>
              <div className={`sbc-image-wrapper ${cat.type}`}>
                <motion.img 
                  src={cat.image} 
                  alt={cat.name}
                  className="sbc-image"
                  initial={{ scale: cat.scale || 1 }}
                  animate={{ scale: cat.scale || 1 }}
                  whileHover={{ scale: (cat.scale || 1) + 0.05 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <h3 className="sbc-card-title">{cat.name}</h3>
            </Link>
          ))}
        </div>

        {/* Mobile Carousel View */}
        <div className="sbc-mobile-carousel">
          {CATEGORIES.map((cat, index) => (
            <Link to={cat.link} className="sbc-card sbc-mobile-card" key={`mob-${cat.id}`}>
              <div className="sbc-image-wrapper large">
                <motion.img 
                  src={cat.image} 
                  alt={cat.name}
                  className="sbc-image"
                  initial={{ scale: cat.scale || 1 }}
                  animate={{ scale: cat.scale || 1 }}
                  whileHover={{ scale: (cat.scale || 1) + 0.05 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <h3 className="sbc-card-title">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
