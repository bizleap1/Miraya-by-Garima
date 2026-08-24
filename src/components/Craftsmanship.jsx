import React from 'react';
import { motion } from 'framer-motion';
import './Craftsmanship.css';

const features = [
  { num: '01', label: 'HAND-WOVEN TEXTILES' },
  { num: '02', label: 'INTRICATE ZARDOZI' },
  { num: '03', label: 'HERITAGE PATTERNS' },
];

const Craftsmanship = () => {
  return (
    <section className="craftsmanship-section">
      <div className="craft-container">
        <div className="craft-content-split">

          <div className="craft-text-col">
            <motion.h4
              className="craft-subtitle"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              BEHIND THE SCENES
            </motion.h4>
            <motion.h2
              className="craft-title"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              The Art of<br/>
              <i>Craftsmanship</i>
            </motion.h2>
            <motion.div
              className="craft-description"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <p>
                Every Miraya piece is a labor of love, brought to life by master artisans whose skills have been honed over generations. From the delicate tracery of Zardozi to the rhythmic weave of Banarasi silk, we preserve India's most treasured textile traditions.
              </p>
              <p>
                It takes hundreds of hours to hand-embroider a single bridal ensemble. We believe that true luxury lies in the time, patience, and human touch poured into every thread.
              </p>
            </motion.div>

            <div className="craft-features-list">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  className="craft-feature"
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                  whileHover={{ x: 8 }}
                >
                  <span className="feature-number">{f.num}</span>
                  <span className="feature-text">{f.label}</span>
                  <motion.div
                    className="feature-line"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.15 }}
                    style={{ originX: 0 }}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="craft-image-col">
            <motion.div
              className="craft-image-mask"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src="/craftsmanship-bg.png"
                alt="Artisan doing embroidery"
                className="craft-image"
              />
              <div className="craft-img-overlay" />
            </motion.div>

            <motion.div
              className="craft-stat-card"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
              whileHover={{ y: -5, boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}
            >
              <div className="stat-card-inner">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 3v3h12V3H6zm0 15v3h12v-3H6z"/>
                    <path d="M8 6h8v12H8z"/>
                    <line x1="8" y1="9" x2="16" y2="9"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="8" y1="15" x2="16" y2="15"/>
                  </svg>
                </div>
                <div className="stat-subtitle">TIME TAKEN</div>
                <div className="stat-value">100+</div>
                <div className="stat-unit">HOURS</div>
                <div className="stat-divider"></div>
                <div className="stat-footer">
                  ARTISAN MADE<br/>WITH LOVE
                  <div className="stat-heart">♡</div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Craftsmanship;
