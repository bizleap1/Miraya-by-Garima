'use client';
import { motion } from 'framer-motion';
import './CorePillars.css';

const pillars = [
  {
    subtitle: 'PRECISE ELEGANCE',
    title: 'REFINED',
    text: 'Every silhouette is meticulously tailored, balancing structured drapery with fluid grace. We choose only the finest silks, georgettes, and organic fabrics that whisper luxury with every thread and stitch.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 22C12 22 10 16 4 15C10 14 12 8 12 8C12 8 14 14 20 15C14 16 12 22 12 22Z" fill="currentColor" fillOpacity="0.3"/>
        <path d="M12 8C12 8 10.5 5 9 3" /><path d="M12 8C12 8 13.5 5 15 3" />
      </svg>
    ),
  },
  {
    subtitle: 'HERITAGE CRAFT',
    title: 'AUTHENTIC',
    text: 'Our garments celebrate the handloom weavers and zardozi artisans of India. By preserving age-old embellishment techniques, we honor heritage while breathing new life into traditional occasion wear.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="4" y="4" width="16" height="16" rx="1"/>
        <line x1="10" y1="4" x2="10" y2="20"/><line x1="14" y1="4" x2="14" y2="20"/>
        <line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    subtitle: 'FOR GENERATIONS',
    title: 'ASPIRATIONAL',
    text: 'Miraya designs are created to be heirloom pieces. Bridging the aesthetic tastes of mothers, daughters, and granddaughters, we cultivate a shared lineage of style, dignity, and elegance.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 21.7C12 21.7 3 16 3 9.5C3 6.5 5.5 4 8.5 4C10.2 4 11.8 4.9 12 6C12.2 4.9 13.8 4 15.5 4C18.5 4 21 6.5 21 9.5C21 16 12 21.7 12 21.7Z" fill="currentColor" fillOpacity="0.2"/>
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

const CorePillars = () => {
  return (
    <section className="core-pillars">
      <div className="pillars-container">

        <div className="pillars-header">
          <motion.h4
            className="pillars-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            OUR PHILOSOPHY
          </motion.h4>
          <motion.h2
            className="pillars-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            THE CORE PILLARS OF MIRAYA
          </motion.h2>
          <motion.p
            className="pillars-desc"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Rooted in tradition. Designed for today. Created to inspire for generations.
          </motion.p>
        </div>

        <motion.div
          className="pillars-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              className="pillar-card"
              variants={cardVariants}
              whileHover={{ y: -10, boxShadow: '0 30px 60px rgba(0,0,0,0.12), 0 0 30px rgba(198,164,106,0.08)' }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Animated glow ring behind icon */}
              <div className="pillar-icon-ring" />
              <div className="pillar-icon">{p.icon}</div>

              <h5 className="pillar-card-subtitle">{p.subtitle}</h5>
              <h3 className="pillar-card-title">{p.title}</h3>
              <div className="pillar-divider">◈</div>
              <p className="pillar-card-text">{p.text}</p>

              {/* Bottom gold line reveal on hover */}
              <div className="pillar-bottom-line" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CorePillars;
