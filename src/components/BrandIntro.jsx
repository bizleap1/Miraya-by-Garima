import { motion } from 'framer-motion';
import './BrandIntro.css';

const BrandIntro = () => {
  return (
    <section className="brand-intro-section">
      <div className="container brand-intro-container">
        <motion.div 
          className="brand-intro-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1 }}
        >
          <h2 className="main-title" style={{ marginTop: '0', marginBottom: '0.5rem', lineHeight: '1.2' }}>Discover <i>Miraya</i></h2>
          <p className="brand-subtitle">A LEGACY OF CRAFTSMANSHIP & MODERN ELEGANCE</p>
          <div className="gold-line"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandIntro;
