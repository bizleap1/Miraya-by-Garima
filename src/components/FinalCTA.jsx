'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './FinalCTA.css';

const FinalCTA = ({
  heading = "YOUR NEXT SIGNATURE LOOK AWAITS",
  subtitle = "Discover timeless pieces crafted to become part of your story.",
  buttonText = "EXPLORE COLLECTION",
  buttonLink = "/collection/all"
} = {}) => {
  return (
    <section className="final-cta-section">
      <div className="final-cta-overlay"></div>
      
      <div className="final-cta-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="final-cta-inner"
        >
          <h2 className="cta-title">{heading}</h2>
          <p className="cta-desc">
            {subtitle}
          </p>
          <Link to={buttonLink} className="cta-button">
            {buttonText} <span>&rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
