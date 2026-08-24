'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RealBrides.css';

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

const bridesData = [
  {
    id: 1,
    name: "Aanya Sharma",
    review: "These handcrafted ensembles are not just outfits, they are a celebration of our culture and heritage.",
    mobileReview: "“Beautiful craftsmanship and an amazing fit.”",
    image: "/products/Lehenga-Light Purple/1.JPG",
  },
  {
    id: 2,
    name: "Meera Rajput",
    review: "“Wearing Miraya felt like wearing a piece of art. Every detail felt personal.”",
    mobileReview: "“The detailing was absolutely beautiful. It felt made just for me.”",
    image: "/products/Lehenga-Pink Blush/2.JPG",
  },
  {
    id: 3,
    name: "Ishita Verma",
    review: "Timeless designs, flawless craftsmanship and the most luxurious experience.",
    mobileReview: "“Flawless craftsmanship and the most luxurious experience.”",
    image: "/products/Lehenga-Golden/ANU06985.JPG",
  }
];

const RealBrides = () => {
  const [activeIndex, setActiveIndex] = useState(1);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % bridesData.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + bridesData.length) % bridesData.length);
  };

  const getVisibleBrides = () => {
    const prev = (activeIndex - 1 + bridesData.length) % bridesData.length;
    const next = (activeIndex + 1) % bridesData.length;
    return [
      { ...bridesData[prev], type: 'light', key: bridesData[prev].id, position: 'prev' },
      { ...bridesData[activeIndex], type: 'dark', key: bridesData[activeIndex].id, position: 'active' },
      { ...bridesData[next], type: 'light', key: bridesData[next].id, position: 'next' },
    ];
  };

  const visibleBrides = getVisibleBrides();

  return (
    <section className="real-brides-section">
      <div className="floral-bg floral-left"></div>
      <div className="floral-bg floral-right"></div>
      
      <div className="container">
        <div className="section-header text-center">
          <div className="subtitle-wrapper">
            <span className="subtitle-line"></span>
            <span className="subtitle">CLIENT DIARIES</span>
            <span className="subtitle-line"></span>
          </div>
          <h2 className="title"><i>Real</i> Queens</h2>
          <p className="description">
            Real stories. Real style.<br className="mobile-only-br" /> Loved and worn by the Miraya community.
          </p>
        </div>

        <div className="brides-carousel">
          <AnimatePresence mode="popLayout">
            {visibleBrides.map((bride) => (
              <motion.div 
                key={bride.key} 
                layout
                drag={bride.type === "dark" ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    nextSlide();
                  } else if (swipe > swipeConfidenceThreshold) {
                    prevSlide();
                  }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, position: 'absolute' }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                className={`bride-card ${bride.type}`}
              >
              <div className="bride-image-col">
                <img src={bride.image} alt={bride.name} className="bride-image" loading="lazy" />
              </div>
              <div className="bride-text-col">
                {bride.type === "dark" ? (
                  <>
                    <div className="quote-icon dark-quote desktop-only">“</div>
                    <p className="bride-review desktop-only"><i>{bride.review}</i></p>
                    <h3 className="bride-name desktop-only">- {bride.name}</h3>

                    <div className="mobile-only mobile-review-content">
                      <div className="stars">★★★★★</div>
                      <p className="bride-review"><i>{bride.mobileReview}</i></p>
                      <h3 className="bride-name">— {bride.name}</h3>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="bride-name">{bride.name}</h3>
                    <div className="stars">★★★★★</div>
                    <p className="bride-review">"{bride.review}"</p>
                    <div className="quote-icon light-quote">“</div>
                  </>
                )}
              </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="carousel-controls">
          <button className="control-btn prev-btn" onClick={prevSlide}>←</button>
          <div className="carousel-dots">
            {bridesData.map((_, index) => (
              <span 
                key={index} 
                className={`dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              ></span>
            ))}
          </div>
          <button className="control-btn next-btn" onClick={nextSlide}>→</button>
        </div>

      </div>
    </section>
  );
};

export default RealBrides;
