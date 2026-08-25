'use client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import './Footer.css';

const Footer = () => {
  const { support_phone, support_email, atelier_address, instagram_url, facebook_url } = useStoreSettings();

  return (
    <footer id="contact" className="footer">
      <div className="container">
        
        <div className="footer-top">
          {/* Column 1: Brand & Newsletter */}
          <div className="footer-brand-section">
            <img src="/logo-white.png" alt="Miraya by Garima" className="footer-logo-img" loading="lazy" />
            <p className="footer-desc">
              Join the inner circle of Miraya for early access to private seasonal launches, design histories, and exclusive artisanal exhibitions.
            </p>
            <div className="footer-socials-new">
              <a href={instagram_url || "https://www.instagram.com/miraya_official.in/"} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.5" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href={facebook_url || "https://www.facebook.com/profile.php?id=61591287333326"} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
            </div>
          </div>
          
          <div className="footer-links-section">
            {/* Column 2: Collections */}
            <div className="footer-column-new">
              <h4 className="footer-heading-new">
                COLLECTIONS
                <div className="heading-ornament">◈</div>
              </h4>
              <ul>
                <li><Link to="/collection/coord-sets">Co-ord Sets</Link></li>
                <li><Link to="/collection/indo-western">Indo Western</Link></li>
                <li><Link to="/collection/drape-sarees">Drape Sarees</Link></li>
                <li><Link to="/collection/designer-suits">Designer Suits</Link></li>
                <li><Link to="/collection/lehenga">Lehengas</Link></li>
                <li><Link to="/collection/premium-suit-materials">Premium Suit Materials</Link></li>
              </ul>
            </div>
            
            {/* Column 3: About Miraya */}
            <div className="footer-column-new">
              <h4 className="footer-heading-new">
                ABOUT MIRAYA
                <div className="heading-ornament">◈</div>
              </h4>
              <ul>
                <li><Link to="/about">Our Story</Link></li>
                <li><Link to="/lookbook">Lookbook</Link></li>
              </ul>
            </div>
            
            {/* Column 4: Services */}
            <div className="footer-column-new">
              <h4 className="footer-heading-new">
                SERVICES
                <div className="heading-ornament">◈</div>
              </h4>
              <ul>
                <li><Link to="/contact">Contact Boutique</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/shipping-returns">Shipping & Returns</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Column 5: Boutique */}
          <div className="footer-boutique-section">
            <div className="boutique-box">
              <div className="boutique-icon">
                <MapPin size={16} strokeWidth={2} />
              </div>
              <h4 className="boutique-heading">BOUTIQUE</h4>
              <address className="boutique-address">
                {atelier_address || "Shop no. UG/5, Jagat Plaza, Mouze Pandharabodi, Law College Square, Amravati Rd, Nagpur, Maharashtra 440033"}
              </address>
              <div className="boutique-contact">
                <p>Email: <a href={`mailto:${support_email || "mirayaofficial.in@gmail.com"}`}>{support_email || "mirayaofficial.in@gmail.com"}</a></p>
                <p>Phone: <a href={`tel:${(support_phone || "+919271218156").replace(/\s/g, "")}`}>{support_phone || "+91 92712 18156"}</a></p>
              </div>
            </div>
          </div>

        </div>
        
        <div className="footer-bottom-new">
          <p>&copy; {new Date().getFullYear()} Miraya by Garima. Crafted with Pride in India. All Rights Reserved.</p>
          <div className="footer-bottom-ornament">
             <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                 <path d="M20 10L10 5H30L20 10Z" fill="#dfc28d" opacity="0.8"/>
                 <circle cx="20" cy="15" r="2" fill="#dfc28d" />
             </svg>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
