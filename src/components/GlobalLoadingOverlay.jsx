'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../context/LoadingContext';
import './GlobalLoadingOverlay.css';

export const GlobalLoadingOverlay = () => {
  const { isLoading, loadingMessage } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="luxury-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <motion.div
            className="luxury-loading-card"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -5 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Corner details */}
            <div className="luxury-corner tl" />
            <div className="luxury-corner tr" />
            <div className="luxury-corner bl" />
            <div className="luxury-corner br" />

            {/* Logo */}
            <div className="luxury-loading-logo-wrap">
              <img
                src="/logoR.png"
                alt="Miraya By Garima"
                className="luxury-loading-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            {/* Gem & Ring Spinner */}
            <div className="luxury-spinner-ring">
              <div className="luxury-spinner-circle" />
              <span className="luxury-spinner-gem">◈</span>
            </div>

            {/* Title */}
            <p className="luxury-loading-brand">MIRAYA BY GARIMA</p>

            {/* Dynamic Message */}
            <p className="luxury-loading-message">
              {loadingMessage || 'PLEASE WAIT...'}
            </p>

            {/* Shimmer accent line */}
            <div className="luxury-loading-shimmer-line" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const TopProgressBar = ({ active }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="luxury-top-progress-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="luxury-top-progress-fill"
            initial={{ width: '15%' }}
            animate={{ width: ['20%', '75%', '98%'] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const LuxuryPageFallback = () => {
  return (
    <div className="luxury-page-fallback">
      <div className="luxury-page-fallback-ring" />
      <p className="luxury-page-fallback-text">Loading Collection...</p>
    </div>
  );
};

export default GlobalLoadingOverlay;
