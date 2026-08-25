'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, User, Mail, PenLine, MessageSquare, Calendar, Navigation, ExternalLink } from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import SEO from '../components/SEO';
import './ContactPage.css';

// Reusable ornament component to match the design exactly
const Ornament = () => (
  <div className="contact-ornament">
    <div className="contact-line"></div>
    <div className="contact-diamond">
       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15 12L12 22L9 12Z"/></svg>
    </div>
    <div className="contact-line"></div>
  </div>
);

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'Miraya by Garima',
  telephone: '+919271218156',
  email: 'mirayaofficial.in@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop no. UG/5, Jagat Plaza, Law College Square, Amravati Rd',
    addressLocality: 'Nagpur',
    addressRegion: 'Maharashtra',
    postalCode: '440033',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.1458,
    longitude: 79.0882
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '11:00',
      closes: '21:00'
    }
  ]
};

const ContactPage = () => {
  const { support_phone, support_email, atelier_address, google_review_url } = useStoreSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="contact-page">
      <SEO
        title="Contact Nagpur Atelier & Boutique Location"
        description="Visit Miraya by Garima at Shop no. UG/5, Jagat Plaza, Law College Square, Amravati Rd, Nagpur. Call +91 92712 18156 for custom bridal appointments."
        keywords="Contact Miraya by Garima, Nagpur Boutique Address, Law College Square Boutique, Bridal Appointment Nagpur"
        schemaJson={contactSchema}
      />
      <div className="contact-header">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="contact-header-content text-center"
        >
          <div className="subtitle">GET IN TOUCH</div>
          <Ornament />
          <h1 className="contact-title">
            <i>Visit our</i>
            ATELIER
          </h1>
          <Ornament />
          <p className="contact-header-desc">
            We would love to hear from you. Reach out to us for personalized assistance or visit our atelier.
          </p>
        </motion.div>
      </div>

        <div className="container contact-container">
          <div className="contact-grid">
            
            {/* Left Column: Form */}
            <motion.div 
              className="contact-panel form-panel"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="panel-header text-center">
                <h2 className="panel-title">
                  <span className="script-text">Connect with</span>
                  Miraya
                </h2>
                <Ornament />
                <p className="panel-desc">
                  For bespoke appointments or general inquiries,<br/>
                  please leave us a message below.
                </p>
              </div>
              
              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group-outline">
                  <User size={18} className="form-icon" />
                  <input type="text" placeholder="FULL NAME" required />
                </div>
                <div className="form-group-outline">
                  <Mail size={18} className="form-icon" />
                  <input type="email" placeholder="EMAIL ADDRESS" required />
                </div>
                <div className="form-group-outline">
                  <PenLine size={18} className="form-icon" />
                  <input type="text" placeholder="SUBJECT" required />
                </div>
                <div className="form-group-outline">
                  <MessageSquare size={18} className="form-icon message-icon" />
                  <textarea rows="4" placeholder="MESSAGE" required></textarea>
                </div>
                <button type="submit" className="submit-btn-solid">
                  SEND MESSAGE &nbsp; <span>⟶</span>
                </button>
              </form>
            </motion.div>

            {/* Right Column: Info */}
            <motion.div 
              className="contact-panel info-panel"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <div className="panel-header text-center">
                <h2 className="panel-title">
                  <span className="script-text">Our</span>
                  Atelier
                </h2>
                <Ornament />
                <p className="panel-desc">
                  We invite you to experience our collections in person.<br/>
                  Our doors are open for those who appreciate the finer details.
                </p>
              </div>

              <div className="info-list">
                <div className="info-block">
                  <div className="info-icon-wrapper">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="info-title">FLAGSHIP ATELIER</h3>
                    <address className="info-text">
                      {atelier_address || "Shop no. UG/5, Jagat Plaza, Mouze Pandharabodi, Law College Square, Amravati Rd, Nagpur, Maharashtra 440033"}
                    </address>
                  </div>
                </div>
                
                <div className="info-block">
                  <div className="info-icon-wrapper">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="info-title">CONTACT DETAILS</h3>
                    <p className="info-text">
                      <a href={`mailto:${support_email || "mirayaofficial.in@gmail.com"}`}>{support_email || "mirayaofficial.in@gmail.com"}</a><br />
                      <a href={`tel:${(support_phone || "+919271218156").replace(/\s/g, "")}`} style={{ color: 'inherit', textDecoration: 'none' }}>{support_phone || "+91 92712 18156"}</a>
                    </p>
                  </div>
                </div>
                
                <div className="info-block" style={{ marginBottom: 0 }}>
                  <div className="info-icon-wrapper">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="info-title">ATELIER HOURS</h3>
                    <p className="info-text">
                      Monday – Saturday: 10:00 AM – 7:00 PM<br />
                      Sunday: By Appointment
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Map Section */}
          <motion.div 
            className="map-section-simple"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <div className="map-container-simple">
              <div className="map-header-bar">
                <div className="map-header-title">
                  <MapPin size={18} color="var(--gold-accent)" />
                  <span>Miraya Flagship Store & Atelier</span>
                </div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Shop+no.+UG%2F5%2C+Jagat+Plaza%2C+Mouze+Pandharabodi%2C+Law+College+Square%2C+Amravati+Rd%2C+Nagpur%2C+Maharashtra+440033"
                  target="_blank"
                  rel="noreferrer"
                  className="map-directions-btn"
                >
                  <Navigation size={14} />
                  <span>Get Directions</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <iframe
                src="https://www.google.com/maps?q=Jagat+Plaza,+Law+College+Square,+Amravati+Rd,+Nagpur,+Maharashtra+440033&hl=en&z=16&output=embed"
                width="100%"
                height="450"
                style={{ border: 0, display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Miraya Store Location"
              ></iframe>
            </div>
          </motion.div>
        </div>
    </div>
  );
};

export default ContactPage;
