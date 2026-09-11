'use client';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import './Preloader.css';

const PARTICLES = [
  { id: 0, left: '8%', delay: 0.2, duration: 8.5, size: 2 },
  { id: 1, left: '15%', delay: 1.4, duration: 9.2, size: 1.5 },
  { id: 2, left: '22%', delay: 2.8, duration: 7.8, size: 2.5 },
  { id: 3, left: '31%', delay: 0.6, duration: 10.1, size: 1.8 },
  { id: 4, left: '39%', delay: 3.2, duration: 8.0, size: 2.2 },
  { id: 5, left: '46%', delay: 1.9, duration: 9.5, size: 1.2 },
  { id: 6, left: '53%', delay: 4.1, duration: 7.2, size: 2.8 },
  { id: 7, left: '62%', delay: 0.9, duration: 8.7, size: 1.6 },
  { id: 8, left: '71%', delay: 2.5, duration: 10.4, size: 2.4 },
  { id: 9, left: '79%', delay: 3.8, duration: 8.1, size: 1.4 },
  { id: 10, left: '88%', delay: 1.1, duration: 9.0, size: 2.6 },
  { id: 11, left: '12%', delay: 4.5, duration: 7.5, size: 1.7 },
  { id: 12, left: '27%', delay: 2.1, duration: 9.8, size: 2.1 },
  { id: 13, left: '35%', delay: 0.4, duration: 8.3, size: 1.3 },
  { id: 14, left: '49%', delay: 3.6, duration: 10.2, size: 2.7 },
  { id: 15, left: '58%', delay: 1.7, duration: 7.9, size: 1.9 },
  { id: 16, left: '67%', delay: 4.8, duration: 8.6, size: 2.3 },
  { id: 17, left: '75%', delay: 2.3, duration: 9.4, size: 1.5 },
  { id: 18, left: '84%', delay: 0.8, duration: 7.7, size: 2.0 },
  { id: 19, left: '92%', delay: 3.0, duration: 10.5, size: 1.6 },
  { id: 20, left: '18%', delay: 1.5, duration: 8.9, size: 2.4 },
  { id: 21, left: '42%', delay: 4.2, duration: 7.4, size: 1.8 },
  { id: 22, left: '65%', delay: 2.9, duration: 9.6, size: 2.2 },
  { id: 23, left: '81%', delay: 0.5, duration: 8.2, size: 1.5 },
  { id: 24, left: '95%', delay: 3.4, duration: 9.1, size: 2.5 }
];

const Preloader = ({ onComplete }) => {
  const [phase, setPhase] = useState('dark');   // dark → brighten → text → hold → exit
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Fast luxury counter: 0 → 100 over 1.2s
    const start = Date.now();
    const dur = 1200;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(eased * 100));
      if (p < 1) requestAnimationFrame(tick);
      else setCount(100);
    };
    requestAnimationFrame(tick);

    const t1 = setTimeout(() => setPhase('brighten'), 150);
    const t2 = setTimeout(() => setPhase('text'), 450);
    const t3 = setTimeout(() => setPhase('exit'), 1400);
    // Guaranteed fallback to dismiss preloader if animation is interrupted
    const tFallback = setTimeout(() => onComplete?.(), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFallback);
    };
  }, [onComplete]);

  const showText = phase === 'text' || phase === 'exit';

  return (
    <motion.div
      className="preloader-container"
      animate={phase === 'exit' ? { y: '-100%' } : { y: 0 }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => { if (phase === 'exit') onComplete(); }}
    >
      <motion.div
        className="preloader-bg"
        initial={{ scale: 1, filter: 'brightness(0) saturate(0)' }}
        animate={
          phase === 'dark'
            ? { scale: 1, filter: 'brightness(0) saturate(0)' }
            : { scale: 1, filter: 'brightness(0.75) saturate(0.9)' }
        }
        transition={{ duration: 2.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <img
          src="/intro-image.png"
          alt=""
          className="preloader-img"
          aria-hidden="true"
        />
      </motion.div>

      {/* ── Dual-layer overlay ── */}
      <div className="preloader-overlay-dark" />
      <motion.div
        className="preloader-overlay-vignette"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'dark' ? 0 : 1 }}
        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.4 }}
      />

      {/* ── Gold particles ── */}
      <div className="preloader-particles">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="preloader-particle"
            style={{
              left: p.left,
              bottom: '-6px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* ── Center brand text ── */}
      <div className="preloader-content">

        {/* Top ornament line */}
        <motion.div
          className="preloader-ornament-top"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={showText ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        />

        {/* MIRAYA Logo */}
        <div className="preloader-logo-wrapper" style={{ overflow: 'hidden', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <motion.img
            src="/logoR.png"
            alt="Miraya"
            className="preloader-logo"
            initial={{ y: '105%' }}
            animate={showText ? { y: '0%' } : {}}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1,
            }}
          />
        </div>

        {/* Tagline */}
        <motion.p
          className="preloader-tagline"
          initial={{ opacity: 0 }}
          animate={showText ? { opacity: 0.7 } : {}}
          transition={{ duration: 1.2, delay: 0.6 }}
        >
          THE ART OF ELEGANCE
        </motion.p>

        {/* Bottom ornament */}
        <motion.div
          className="preloader-ornament-bottom"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={showText ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </div>

      {/* ── Progress bar ── */}
      <div className="preloader-progress-track">
        <motion.div
          className="preloader-progress-fill"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: count / 100 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.08 }}
        />
      </div>

      {/* ── Corner ornaments ── */}
      <div className="preloader-corner tl" />
      <div className="preloader-corner tr" />
      <div className="preloader-corner bl" />
      <div className="preloader-corner br" />
    </motion.div>
  );
};

export default Preloader;
