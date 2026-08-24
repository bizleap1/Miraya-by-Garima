'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Hero.css';

const textReveal = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } }
};

const drawSVG = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1, 
    transition: { duration: 1.5, ease: "easeInOut", delay: 0.5 } 
  }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.5
    }
  }
};

const Hero = () => {
  const containerRef = useRef(null);
  
  // Parallax effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section className="hero" ref={containerRef} style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Video Background */}
      <motion.div 
        className="hero-video-wrapper"
        initial={{ scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        style={{ y: videoY, scale: videoScale, originY: 0 }}
      >
        <img 
          src="/yebg.png" 
          alt="Hero Background"
          className="hero-video"
        />
        <div className="video-overlay-gradient"></div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="hero-content"
        style={{ y: textY, opacity: textOpacity }}
      >
        <motion.div 
          className="hero-text-container"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Subtitle */}
          <div className="hero-subtitle-container">
            <motion.div variants={textReveal} className="subtitle-wrapper">
              <span className="subtitle gold-shimmer-text">MIRAYA BY GARIMA</span>
              <div className="hero-divider">
                <svg width="100%" height="15" viewBox="0 0 250 15" preserveAspectRatio="xMinYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                  <motion.line variants={drawSVG} x1="0" y1="7.5" x2="90" y2="7.5" stroke="#dfc28d" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                  <motion.circle variants={drawSVG} cx="100" cy="7.5" r="2.5" stroke="#dfc28d" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke"/>
                  <motion.path variants={drawSVG} d="M125 0 L132.5 7.5 L125 15 L117.5 7.5 Z" stroke="#dfc28d" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke"/>
                  <motion.circle variants={drawSVG} cx="150" cy="7.5" r="2.5" stroke="#dfc28d" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke"/>
                  <motion.line variants={drawSVG} x1="160" y1="7.5" x2="250" y2="7.5" stroke="#dfc28d" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                </svg>
              </div>
            </motion.div>
          </div>
          
          {/* Main Title */}
          <div className="hero-title-wrapper">
            <h1 className="hero-title">
              <div className="hero-title-line-1">
                <motion.span variants={textReveal} className="hero-title-italic">The Art of</motion.span>
              </div>
              <div className="hero-title-line-2">
                <motion.span variants={textReveal} className="hero-title-bold gold-shimmer-text">Elegance</motion.span>
              </div>
            </h1>
          </div>

          {/* Description */}
          <div style={{ overflow: "hidden", padding: "0 20px", marginLeft: "-20px" }}>
            <motion.div variants={textReveal}>
              <p className="hero-description">Timeless ethnic wear, thoughtfully crafted for the modern wardrobe.</p>
            </motion.div>
          </div>
          
          {/* CTA Button */}
          <div style={{ overflow: "hidden", padding: "10px 20px", marginLeft: "-20px", marginTop: "1rem" }}>
            <motion.div
              variants={textReveal}
              className="hero-cta"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ display: "inline-block" }}
            >
              <Link to="/collection/all" className="btn btn-hollow-gold btn-luxury">
                Explore Collection <span className="btn-arrow">⟶</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

    </section>
  );
};

export default Hero;
