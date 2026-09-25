'use client';
import React from 'react';
import { motion } from 'framer-motion';
import './CorePillars.css';

const BotanicalFlourish = ({ className = '', flip = false }) => (
  <svg
    viewBox="0 0 120 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pillars-botanical ${className} ${flip ? 'flipped' : ''}`}
    aria-hidden="true"
  >
    {/* Graceful central branch stem */}
    <path
      d="M12 390 C26 315 42 240 32 175 C22 115 46 55 78 8"
      stroke="#C6A46A"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.65"
    />
    {/* Lower tier leaves */}
    <path
      d="M32 280 C15 270 4 252 8 236 C18 245 28 260 32 280Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    <path
      d="M33 275 C47 260 64 254 78 262 C70 276 54 280 33 275Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    {/* Mid tier leaves */}
    <path
      d="M28 215 C10 205 1 186 6 170 C18 180 26 195 28 215Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    <path
      d="M30 205 C48 190 68 185 82 196 C74 209 56 213 30 205Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    {/* Upper-mid tier leaves */}
    <path
      d="M27 150 C11 135 7 116 16 102 C25 115 30 132 27 150Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    <path
      d="M32 142 C52 130 70 127 84 140 C73 151 55 152 32 142Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    {/* Top tier leaves */}
    <path
      d="M40 88 C30 74 32 56 44 46 C48 60 48 74 40 88Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    <path
      d="M48 82 C68 70 84 70 96 82 C86 93 69 92 48 82Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.08"
    />
    {/* Apex leaf */}
    <path
      d="M66 32 C63 18 71 6 84 2 C86 16 81 27 66 32Z"
      stroke="#C6A46A"
      strokeWidth="1"
      fill="#C6A46A"
      fillOpacity="0.12"
    />
    {/* Accent buds */}
    <circle cx="8" cy="236" r="1.5" fill="#C6A46A" opacity="0.65" />
    <circle cx="78" cy="262" r="1.5" fill="#C6A46A" opacity="0.65" />
    <circle cx="6" cy="170" r="1.5" fill="#C6A46A" opacity="0.65" />
    <circle cx="82" cy="196" r="1.5" fill="#C6A46A" opacity="0.65" />
    <circle cx="84" cy="2" r="1.5" fill="#C6A46A" opacity="0.65" />
  </svg>
);

const pillarsData = [
  {
    id: 'refined',
    subtitle: 'PRECISE ELEGANCE',
    title: 'REFINED',
    text: 'Every silhouette is meticulously tailored, balancing structured drapery with fluid grace. We choose only the finest silks, georgettes, and organic fabrics that whisper luxury with every thread and stitch.',
    image: '/images/pillars/pillar-refined.jpg',
    imageAlt: 'Handcrafted zardozi and pearl embroidery by Miraya',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" fill="currentColor" fillOpacity="0.25" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'authentic',
    subtitle: 'HERITAGE CRAFT',
    title: 'AUTHENTIC',
    text: 'Our garments celebrate the handloom weavers and zardozi artisans of India. By preserving age-old embellishment techniques, we honor heritage while breathing new life into traditional occasion wear.',
    image: '/images/pillars/pillar-authentic.jpg',
    imageAlt: 'Master artisan handcrafting zardozi embroidery on loom',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
        <line x1="3.5" y1="9.16" x2="20.5" y2="9.16" />
        <line x1="3.5" y1="14.83" x2="20.5" y2="14.83" />
        <line x1="9.16" y1="3.5" x2="9.16" y2="20.5" />
        <line x1="14.83" y1="3.5" x2="14.83" y2="20.5" />
        <rect x="4.5" y="4.5" width="3.6" height="3.6" fill="currentColor" fillOpacity="0.3" />
        <rect x="10.2" y="10.2" width="3.6" height="3.6" fill="currentColor" fillOpacity="0.8" />
        <rect x="15.8" y="15.8" width="3.6" height="3.6" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'aspirational',
    subtitle: 'FOR GENERATIONS',
    title: 'ASPIRATIONAL',
    text: 'Miraya designs are created to be heirloom pieces. Bridging the aesthetic tastes of mothers, daughters, and granddaughters, we cultivate a shared lineage of style, dignity, and elegance.',
    image: '/images/pillars/pillar-aspirational.jpg',
    imageAlt: 'Graceful bride in heirloom Miraya couture with pearl jhumkas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20.5S3.5 15.5 3.5 9.5a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2c0 6-8.5 11-8.5 11z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 45 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const formatHeading = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Case-insensitive match for "miraya"
  const regex = /^(.*?)\b(miraya)\b(.*)$/i;
  const match = text.match(regex);
  if (match) {
    return (
      <>
        <span>{match[1]}</span>
        <span className="pillars-brand-script">Miraya</span>
        {match[3] && <span>{match[3]}</span>}
      </>
    );
  }

  // Fallback: split words and style last word with signature script
  const words = text.split(' ');
  if (words.length <= 1) return <span className="pillars-brand-script">{text}</span>;
  const lastWord = words.pop();
  return (
    <>
      <span>{words.join(' ')} </span>
      <span className="pillars-brand-script">{lastWord}</span>
    </>
  );
};

const CorePillars = ({
  title = "THE CORE PILLARS OF MIRAYA",
  tagline = "OUR PHILOSOPHY",
  subtitle = "Rooted in tradition. Designed for today. Created to inspire for generations."
} = {}) => {
  return (
    <section className="core-pillars" id="core-pillars">
      {/* Side botanical artistic flourishes */}
      <BotanicalFlourish className="pillars-botanical-left" />
      <BotanicalFlourish className="pillars-botanical-right" flip={true} />

      <div className="pillars-container">
        {/* Section Header */}
        <div className="pillars-header">
          {/* Top Diamond Ornament */}
          <div className="pillars-top-ornament">
            <span className="ornament-line" />
            <span className="ornament-diamond">◈</span>
            <span className="ornament-line" />
          </div>

          <motion.h4
            className="pillars-subtitle"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {tagline}
          </motion.h4>

          <motion.h2
            className="pillars-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {formatHeading(title)}
          </motion.h2>

          <motion.p
            className="pillars-desc"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {subtitle}
          </motion.p>
        </div>

        {/* 3 Arched Pillar Cards */}
        <motion.div
          className="pillars-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {pillarsData.map((p) => (
            <motion.div
              key={p.id}
              className="pillar-card"
              variants={cardVariants}
            >
              {/* Top Arched Image Window */}
              <div className="pillar-image-arch">
                <img
                  src={p.image}
                  alt={p.imageAlt}
                  className="pillar-image"
                  loading="lazy"
                />
                <div className="pillar-image-overlay" />
              </div>

              {/* Overlapping Badge & Seam */}
              <div className="pillar-badge-wrapper">
                <div className="pillar-seam-line" />
                <div className="pillar-icon-badge" aria-hidden="true">
                  {p.icon}
                </div>
              </div>

              {/* Text Information */}
              <div className="pillar-card-content">
                <h5 className="pillar-card-subtitle">{p.subtitle}</h5>
                <h3 className="pillar-card-title">{p.title}</h3>
                <div className="pillar-divider">
                  <span>◈</span>
                </div>
                <p className="pillar-card-text">{p.text}</p>
              </div>

              {/* Bottom gilded reveal line on hover */}
              <div className="pillar-bottom-line" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CorePillars;
