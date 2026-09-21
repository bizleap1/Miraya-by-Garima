'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const formatCategoryName = (name) => {
  if (!name) return null;
  const titleCased = name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const words = titleCased.split(' ');
  if (words.length <= 1) return <i>{titleCased}</i>;
  const lastWord = words.pop();
  return <>{words.join(' ')} <i>{lastWord}</i></>;
};

const DEFAULT_CATEGORIES = [
  {
    id: 'indo-western',
    name: 'INDO WESTERN',
    link: '/collection/all',
    state: { filters: ['indo-western'] },
    image: '/products/Indo Western Suit -Red/1.JPG',
    alt: 'Miraya by Garima Indo Western Collection'
  },
  {
    id: 'sarees',
    name: 'SAREES',
    link: '/collection/all',
    state: { filters: ['drape-sarees'] },
    image: '/products/Drape Saree-Grey Color/1.JPG',
    alt: 'Miraya by Garima Designer Drape and Shimmer Sarees'
  },
  {
    id: 'suits',
    name: 'SUITS',
    link: '/collection/all',
    state: { filters: ['designer-suits'] },
    image: '/products/Suit- Red/1.JPG',
    alt: 'Miraya by Garima Embroidered Designer Suits'
  },
  {
    id: 'coord-sets',
    name: 'CO-ORD SETS',
    link: '/collection/all',
    state: { filters: ['coord-sets'] },
    image: '/products/grey co-order set/1.JPG',
    alt: 'Miraya by Garima Couture Co-Ord Sets and Capes'
  }
];

export default function EditorialCategoryGrid({ categories = DEFAULT_CATEGORIES }) {
  return (
    <section className="na-category-grid-section" aria-label="Editorial Category Showcase">
      <div className="na-category-grid">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            className="na-category-card-wrap"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.8,
              delay: idx * 0.12,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <Link
              to={cat.link}
              state={cat.state}
              className="na-category-card"
              aria-label={`Shop ${cat.name} Collection`}
            >
              {/* Media Wrap with Hover Zoom */}
              <div className="na-category-media">
                <img
                  src={cat.image}
                  alt={cat.alt}
                  className="na-category-img"
                  loading="lazy"
                />
                {/* Dark Subtle Bottom Gradient Overlay for Typography Contrast */}
                <div className="na-category-overlay" aria-hidden="true" />
              </div>

              {/* Bottom-Left Editorial Content */}
              <div className="na-category-content">
                <span className="na-gold-line" aria-hidden="true" />
                <h3 className="na-category-name">{formatCategoryName(cat.name)}</h3>
                <span className="na-category-cta">
                  <span>SHOP NOW</span>
                  <span className="na-arrow-hover" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
