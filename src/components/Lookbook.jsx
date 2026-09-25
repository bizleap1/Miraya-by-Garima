'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Lookbook.css';

const formatHeading = (text) => {
  if (!text || typeof text !== 'string') return text;
  const titleCased = text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const words = titleCased.split(' ');
  if (words.length <= 1) return <i>{titleCased}</i>;
  const lastWord = words.pop();
  return <>{words.join(' ')} <i>{lastWord}</i></>;
};

const Lookbook = ({
  title = "Stories in Style",
  tagline = "THE MIRAYA EDIT"
} = {}) => {
  return (
    <section className="lookbook-section">
      <div className="lookbook-container">
        <div className="lookbook-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lookbook-subtitle"
          >
            <span className="line" />
            {tagline}
            <span className="line" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lookbook-title"
          >
            {formatHeading(title)}
          </motion.h2>
        </div>

        <div className="lookbook-grid">
          {/* LARGE FEATURED EDIT (LEFT) */}
          <motion.div
            className="lookbook-featured"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Link to="/collection/all" className="lookbook-card large">
              <div className="lookbook-image-wrapper">
                <img src="/Stories In Style/Festive Edit_fixed.JPG" alt="Festive Edit" loading="lazy" />
                <div className="lookbook-overlay"></div>
              </div>
              <div className="lookbook-content">
                <h3>{formatHeading("FESTIVE EDIT")}</h3>
                <p>Discover the collection &rarr;</p>
              </div>
            </Link>
          </motion.div>

          {/* 2 STACKED CARDS (RIGHT) */}
          <div className="lookbook-secondary-grid">
            <motion.div
              className="lookbook-card-container"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link to="/collection/all" className="lookbook-card small">
                <div className="lookbook-image-wrapper">
                  <img src="/Stories In Style/the art of draping_fixed.JPG" alt="The Art of Draping" loading="lazy" />
                  <div className="lookbook-overlay"></div>
                </div>
                <div className="lookbook-content">
                  <h3>{formatHeading("THE ART OF DRAPING")}</h3>
                  <p>Explore &rarr;</p>
                </div>
              </Link>
            </motion.div>

            <motion.div
              className="lookbook-card-container"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link to="/collection/all" className="lookbook-card small">
                <div className="lookbook-image-wrapper">
                  <img src="/Stories In Style/Modern Indian Silhouettes_fixed.JPG" alt="Modern Indian Silhouettes" loading="lazy" style={{ objectPosition: 'center 35%' }} />
                  <div className="lookbook-overlay"></div>
                </div>
                <div className="lookbook-content">
                  <h3>{formatHeading("MODERN INDIAN SILHOUETTES")}</h3>
                  <p>Explore &rarr;</p>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Lookbook;
