'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Collections.css';

const collectionsData = [
  {
    id: 1,
    title: "Indo Western",
    category: "COLLECTION I",
    desc: "A harmonious blend of traditional craftsmanship and contemporary silhouettes.",
    img: "/products/Lehenga-Pink Blush/ANU06799.JPG",
    link: "/collection/indo-western",
    position: "top"
  },
  {
    id: 2,
    title: "Drape Sarees",
    category: "COLLECTION II",
    desc: "Timeless elegance rooted in heritage. Discover the beauty of classic drapes.",
    img: "/products/Drape Saree-Grey Color/2.JPG",
    link: "/collection/drape-sarees",
    position: "center",
    scale: 1.25
  },
  {
    id: 3,
    title: "Designer Suits",
    category: "COLLECTION III",
    desc: "Statement pieces crafted for unforgettable moments and grand celebrations.",
    img: "/products/Suit- Red/1.JPG",
    link: "/collection/designer-suits",
    position: "center 20%"
  },
  {
    id: 4,
    title: "Festive Edit",
    category: "COLLECTION IV",
    desc: "Vibrant hues and luxurious embellishments, curated for grand celebrations.",
    img: "/products/Indo Western Suit -Red/5.JPG",
    link: "/collection/festive-edit",
    position: "center"
  },
  {
    id: 5,
    title: "Designer Co-ords",
    category: "COLLECTION V",
    desc: "Elevating the everyday. Thoughtful details, premium fabrics, and impeccable tailoring.",
    img: "/products/grey co-order set/1.JPG",
    link: "/collection/coord-sets"
  }
];

const Collections = () => {
  const [hoveredIndex, setHoveredIndex] = useState(0); // Default first item expanded

  return (
    <section id="collections" className="section collections-section">
      <div className="collections-bg-ornament" />
      
      <div className="container">
        
        <div className="collection-header-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="style-guide-label">
              <span className="line" />
              CURATED MASTERPIECES
              <span className="line" />
            </div>
            <h2 className="collection-main-title">
              Our <i>Collections</i>
            </h2>
            <p className="collection-main-desc">
              Discover a world where heritage meets modernity. Each collection is a testament to meticulous craftsmanship and timeless elegance.
            </p>
          </motion.div>
        </div>

        <div className="accordion-gallery-container">
          {collectionsData.map((item, index) => {
            const isActive = hoveredIndex === index;
            
            return (
              <motion.div 
                key={item.id}
                className={`accordion-panel ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onClick={() => setHoveredIndex(index)}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="accordion-bg">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    loading="lazy" 
                    style={{ 
                      objectPosition: item.position || 'top',
                      '--base-scale': item.scale || 1
                    }}
                  />
                  <div className="accordion-overlay" />
                </div>
                
                <div className="accordion-content">
                  <div className="accordion-category">{item.category}</div>
                  
                  <div className="accordion-text-wrapper">
                    <h3 className="accordion-title">
                      {item.title}
                      {!isActive && <span className="vert-arrow">↓</span>}
                    </h3>
                    <div className="accordion-details">
                      <p className="accordion-desc">{item.desc}</p>
                      <Link to={item.link} className="accordion-btn" onClick={() => window.scrollTo(0, 0)}>
                        EXPLORE <span className="arrow">⟶</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Collections;
