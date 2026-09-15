'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, User, Mail, PenLine, MessageSquare, Navigation, ExternalLink, CheckCircle2 } from 'lucide-react';
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
  const { support_phone, support_email, atelier_address, whatsapp_number } = useStoreSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cleanWaNumber = (whatsapp_number || support_phone || '+919271218156').replace(/[^0-9]/g, '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let text = `*NEW INQUIRY — MIRAYA BY GARIMA*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (formData.name?.trim()) text += `👤 *Name:* ${formData.name.trim()}\n`;
    if (formData.email?.trim()) text += `📧 *Email:* ${formData.email.trim()}\n`;
    if (formData.subject?.trim()) text += `📌 *Subject:* ${formData.subject.trim()}\n\n`;
    if (formData.message?.trim()) text += `💬 *Message:*\n${formData.message.trim()}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Sent via Miraya Contact Page`;

    const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleDirectWhatsApp = () => {
    const defaultText = `Hello Miraya! I would like to inquire about bespoke bridal tailoring and appointments at your Nagpur atelier.`;
    const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(defaultText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

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
              
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group-outline">
                  <User size={18} className="form-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="FULL NAME"
                    required
                  />
                </div>
                <div className="form-group-outline">
                  <Mail size={18} className="form-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="EMAIL ADDRESS"
                    required
                  />
                </div>
                <div className="form-group-outline">
                  <PenLine size={18} className="form-icon" />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="SUBJECT"
                    required
                  />
                </div>
                <div className="form-group-outline">
                  <MessageSquare size={18} className="form-icon message-icon" />
                  <textarea
                    rows="4"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="MESSAGE"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn-whatsapp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="wa-btn-icon">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  <span>CONNECT ON WHATSAPP</span>
                  <span className="wa-arrow">⟶</span>
                </button>

                {submitted && (
                  <div className="form-feedback-msg">
                    <CheckCircle2 size={16} /> Opening WhatsApp with your message...
                  </div>
                )}

                <div className="contact-wa-divider">
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  onClick={handleDirectWhatsApp}
                  className="direct-wa-btn"
                  title="Direct WhatsApp chat with stylist"
                >
                  <span>💬 Direct WhatsApp Chat with Stylist</span>
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

              <div className="atelier-storefront-wrap">
                <img
                  src="/miraya-storefront.webp"
                  alt="Miraya by Garima Flagship Atelier Storefront, Jagat Plaza Nagpur"
                  className="atelier-storefront-img"
                  loading="lazy"
                />
                <div className="atelier-storefront-badge">
                  <span>FLAGSHIP ATELIER • NAGPUR</span>
                </div>
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

                <div className="info-block">
                  <div className="info-icon-wrapper wa-info-icon-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" style={{ display: 'block' }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="info-title">WHATSAPP CONCIERGE</h3>
                    <p className="info-text">
                      <a 
                        href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Hi Miraya! I would like to inquire about bespoke bridal wear and appointments.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#128C7E', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {whatsapp_number || support_phone || "+91 92712 18156"} (Chat Now ⟶)
                      </a>
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
