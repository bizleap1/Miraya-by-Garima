import './BrandVoice.css';
import { motion } from 'framer-motion';

const BrandVoice = () => {
  return (
    <section className="brand-voice-section">
      <div className="container">
        <div className="brand-voice-content">
          <motion.div 
            className="brand-voice-image-wrapper"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="image-border"></div>
            <img 
              src="/products/Indo Western Suit -Red/1.JPG" 
              alt="Miraya Craftsmanship" 
              className="brand-voice-image"
              loading="lazy"
            />
          </motion.div>

          <motion.div 
            className="brand-voice-text"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          >
            <div className="section-label">
              <span className="line"></span>
              <span>Our Philosophy</span>
            </div>
            
            <h2 className="brand-voice-title">
              <span className="script-text">The Essence</span>
              Of Miraya
            </h2>
            
            <p className="brand-voice-desc">
              Every piece we create is a testament to the art of fine craftsmanship. 
              We delicately blend centuries-old heritage techniques with contemporary 
              aesthetics to bring you timeless elegance. For us, luxury is not just 
              about what you wear—it is about the confidence and grace it inspires 
              within you.
            </p>

            <div className="founder-signature">
              By Garima
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BrandVoice;
