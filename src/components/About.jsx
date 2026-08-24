import { motion } from 'framer-motion';
import './About.css';

const About = () => {
  return (
    <section className="about-section" id="about">
      <div className="container about-container">
        <motion.div 
          className="about-image-wrapper"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
        >
          {/* Using a placeholder for now. Replace with your uploaded image in public folder */}
          <img src="/brand-intro.png" alt="Miraya Brand" className="about-image" loading="lazy" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?q=80&w=800&auto=format&fit=crop"; }} />
        </motion.div>
        
        <motion.div 
          className="about-content"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h2 className="section-title">The Miraya Experience</h2>
          <div className="title-separator"></div>
          
          <p className="about-text">
            Miraya was born from a simple belief: true luxury is authentic. It isn't just about what you wear, but how it makes you feel. From the careful selection of our fabrics to the final stitch of hand-embroidery, every garment is an honest expression of our craft.
          </p>
          
          <p className="about-text">
            We are dedicated to creating refined, enduring pieces that inspire you to celebrate your own unique story, wrapped in our signature burgundy.
          </p>
          
          <div className="about-signature">
            <span className="founder-name">Garima</span>
            <span className="founder-title">Founder & Creative Director</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
