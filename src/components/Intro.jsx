import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Intro.css';

const Intro = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide entire intro after 4.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="intro-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -100, filter: "blur(10px)" }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Background image with subtle movement */}
          <motion.div 
            className="intro-image-container"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 1 }}
            transition={{ duration: 4.5, ease: "easeOut" }}
          >
            <img src="/intro-image.png" alt="Miraya Intro" className="intro-image" />
            <div className="intro-overlay dark-overlay"></div>
          </motion.div>

          <div className="intro-content-wrapper">
            {/* Luxury Text Animation */}
            <motion.div 
              className="intro-text-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <motion.div className="overflow-hidden">
                <motion.h1 
                  className="intro-logo-text"
                  initial={{ y: 100, opacity: 0, rotate: 2 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  MIRAYA
                </motion.h1>
              </motion.div>
              
              <motion.div
                className="intro-subtitle-wrapper"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, delay: 1.6, ease: "easeOut" }}
              >
                <motion.div 
                  className="intro-line"
                  initial={{ width: 0 }}
                  animate={{ width: "40px" }}
                  transition={{ duration: 1.2, delay: 1.8, ease: "easeInOut" }}
                ></motion.div>
                <span className="intro-subtitle">By Garima</span>
                <motion.div 
                  className="intro-line"
                  initial={{ width: 0 }}
                  animate={{ width: "40px" }}
                  transition={{ duration: 1.2, delay: 1.8, ease: "easeInOut" }}
                ></motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Intro;
