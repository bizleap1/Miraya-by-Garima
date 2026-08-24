'use client';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import './Preloader.css';

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${5 + Math.random() * 90}%`,
  delay: Math.random() * 6,
  duration: 6 + Math.random() * 5,
  size: 1 + Math.random() * 2,
}));

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
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

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
