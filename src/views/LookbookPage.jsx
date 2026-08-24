'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './LookbookPage.css';

const LookbookPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const signatureSlides = [
    {
      id: 1,
      image: "/mehendi-haldi.png",
      video: "/herobg2.mp4",
      category: "ETHNIC ELEGANCE",
      title: <>Festive<br />Ensembles</>,
      desc: "Intricate embroideries, rich fabrics and timeless designs for every celebration.",
      link: "/collection/wedding"
    },
    {
      id: 2,
      image: "/collectionbg.png",
      category: "MODERN CLASSIC",
      title: <>Elegant<br />Drapes</>,
      desc: "Fluid fabrics that move with you, designed for the contemporary woman.",
      link: "/collection/drapes"
    },
    {
      id: 3,
      image: "/bridal-trousseau.png",
      category: "HERITAGE WEAVES",
      title: <>Woven<br />Tales</>,
      desc: "Authentic handloom pieces that carry the legacy of Indian craftsmanship.",
      link: "/collection/heritage"
    },
    {
      id: 4,
      image: "/craftman.jpg",
      category: "ROYAL CHARM",
      title: <>Regal<br />Sets</>,
      desc: "Statement pieces crafted for unforgettable moments and grand celebrations.",
      link: "/collection/royal"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === signatureSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? signatureSlides.length - 1 : prev - 1));
  };
  return (
    <div className="lookbook-page-new">
      <SEO
        title="Haute Couture Lookbook & Style Guide"
        description="Immerse in the Miraya by Garima Lookbook. Discover editorial bridal silhouettes, festive drape sarees, and contemporary styling guides from our Nagpur atelier."
        keywords="Miraya by Garima Lookbook, Bridal Fashion Trends Nagpur, Couture Style Guide, Designer Ethnic Lookbook"
      />
      <div className="lookbook-hero-new">

        {/* LEFT COLUMN */}
        <div className="lookbook-left-col">
          <div className="floral-bg-lookbook"></div>

          <div className="lookbook-content-wrapper">
            <div className="style-guide-label">
              <span className="line"></span>
              STYLE GUIDE
              <span className="line"></span>
            </div>

            <h1 className="lookbook-main-title">
              The Art of<br />Styling <i>Co-ords</i>
            </h1>

            <div className="lotus-ornament">
              <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2C20 2 26 12 20 18C14 12 20 2 20 2Z" stroke="#cda372" strokeWidth="1.5" />
                <path d="M20 18C20 18 28 14 32 10C26 10 20 18 20 18Z" stroke="#cda372" strokeWidth="1.5" />
                <path d="M20 18C20 18 12 14 8 10C14 10 20 18 20 18Z" stroke="#cda372" strokeWidth="1.5" />
                <line x1="10" y1="10" x2="30" y2="10" stroke="#cda372" strokeWidth="1.5" />
              </svg>
            </div>

            <p className="lookbook-desc">
              From desk to dinner, the co-ord set remains a versatile staple in every Indian woman's wardrobe. Pair our hand-embroidered sets with tailored trousers for a sharp daytime look, or elevate them with statement jewelry for evening festivities. The key lies in the layering and accessories.
            </p>

            <Link to="/collection/coord-sets" className="btn-shop-kurtis">
              <span className="btn-lotus">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L15 12L12 22L9 12Z" />
                </svg>
              </span>
              SHOP CO-ORD SETS
              <span className="btn-arrow">→</span>
            </Link>

            <div className="lookbook-features">
              <div className="feature-item">
                <div className="feature-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6M4 6L12 3l8 3" />
                  </svg>
                </div>
                <span>TIMELESS<br />DESIGNS</span>
              </div>

              <div className="feature-divider"></div>

              <div className="feature-item">
                <div className="feature-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="8" x2="16" y2="16" />
                    <line x1="16" y1="8" x2="8" y2="16" />
                  </svg>
                </div>
                <span>HANDCRAFTED<br />EMBROIDERY</span>
              </div>

              <div className="feature-divider"></div>

              <div className="feature-item">
                <div className="feature-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 22C12 22 4 15 4 9A8 8 0 0 1 20 9C20 15 12 22 12 22Z" />
                    <path d="M12 2L12 10" />
                    <path d="M10 6L14 6" />
                  </svg>
                </div>
                <span>PREMIUM<br />FABRICS</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lookbook-right-col">
          <div className="lookbook-image-wrapper">
            <img src="/products/DSC04862.JPG" alt="Styling Co-ords" className="main-look-img" loading="lazy" />
          </div>
        </div>

      </div>

      {/* SECTION 2: SIGNATURE STYLES (NEW BENTO GRID) */}
      <div className="signature-styles-wrapper">

        {/* Faint floral side branches */}
        <div className="floral-branch left"></div>
        <div className="floral-branch right"></div>

        <div className="signature-styles-header">
          <div className="style-guide-label">
            <span className="line"></span>
            CURATED LOOKS
            <span className="line"></span>
          </div>
          <h2 className="signature-title">
            <i>Signature</i> Styles
          </h2>
          <div className="lotus-ornament">
            <svg width="24" height="12" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2C20 2 26 12 20 18C14 12 20 2 20 2Z" stroke="#cda372" strokeWidth="1.5" />
              <path d="M20 18C20 18 28 14 32 10C26 10 20 18 20 18Z" stroke="#cda372" strokeWidth="1.5" />
              <path d="M20 18C20 18 12 14 8 10C14 10 20 18 20 18Z" stroke="#cda372" strokeWidth="1.5" />
              <line x1="10" y1="10" x2="30" y2="10" stroke="#cda372" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="signature-subtitle">
            Timeless silhouettes, exquisite details & designs that speak elegance.
          </p>
        </div>

        <div className="signature-bento-grid">
          {/* Left Large Card */}
          <div className="bento-card large">
            {signatureSlides[currentSlide].video ? (
              <video
                key={signatureSlides[currentSlide].id}
                src={signatureSlides[currentSlide].video}
                className="bento-bg-img"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                key={signatureSlides[currentSlide].id}
                src={signatureSlides[currentSlide].image}
                alt="Signature Look"
                className="bento-bg-img"
                loading="lazy"
              />
            )}

            {/* The beige gradient overlay that fades out */}
            <div className="bento-gradient-overlay left-gradient"></div>

            <div className="bento-content">
              <div className="bento-category">{signatureSlides[currentSlide].category}</div>
              <h3 className="bento-heading">{signatureSlides[currentSlide].title}</h3>
              <p className="bento-desc">{signatureSlides[currentSlide].desc}</p>
              <Link to={signatureSlides[currentSlide].link} className="btn-bento-burgundy">
                EXPLORE COLLECTION <span className="arrow-right">→</span>
              </Link>
            </div>

            <div className="bento-slider-controls">
              <button className="slider-btn prev-btn" onClick={prevSlide} aria-label="Previous Slide">
                ←
              </button>
              <div className="slider-dots">
                {signatureSlides.map((_, idx) => (
                  <span
                    key={idx}
                    className={`dot ${currentSlide === idx ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>
              <button className="slider-btn next-btn" onClick={nextSlide} aria-label="Next Slide">
                →
              </button>
            </div>
          </div>
        </div>



      </div>

      {/* SECTION 3: SEASONAL EDIT — Luxury Parallax Strip */}
      <div className="seasonal-edit-section">
        <div className="seasonal-bg-texture" />

        <div className="seasonal-header">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="style-guide-label">
              <span className="line" />
              SEASONAL EDIT
              <span className="line" />
            </div>
            <h2 className="seasonal-title">
              <i>Festive</i> Wardrobe
            </h2>
            <p className="seasonal-subtitle">
              Curated ensembles for every celebration on your calendar.
            </p>
          </motion.div>
        </div>

        <div className="seasonal-cards-row">
          {[
            { img: "/products/Lehenga-Golden/5.JPG", label: "BRIDAL TROUSSEAU", caption: "Heirloom pieces for your forever day" },
            { img: "/products/Indo Western Suit -Red/1.JPG", label: "FESTIVE WEAR", caption: "Celebrations woven in silk & gold" },
            { img: "/products/Co-order Mustard/1.JPG", label: "MEHENDI & HALDI", caption: "Vibrant hues for joyous rituals" },
            { img: "/products/Co-order Dark Green/1.JPG", label: "SANGEET GLAM", caption: "Dance the night in pure elegance" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="seasonal-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -12 }}
            >
              <div className="seasonal-card-img-wrap">
                <img src={item.img} alt={item.label} loading="lazy" />
                <div className="seasonal-card-overlay" />
              </div>
              <div className="seasonal-card-info">
                <span className="seasonal-card-label">{item.label}</span>
                <p className="seasonal-card-caption">{item.caption}</p>
                <div className="seasonal-card-line" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 4: OCCASION GUIDE — Editorial Magazine Strip */}
      <div className="occasion-guide-section">
        <div className="occasion-bg-vignette" />

        <motion.div
          className="occasion-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="style-guide-label">
            <span className="line" />
            THE MIRAYA GUIDE
            <span className="line" />
          </div>
          <h2 className="occasion-title">Dress for the <i>Occasion</i></h2>
          <p className="occasion-subtitle">
            Every moment deserves its own masterpiece. Here's how to wear Miraya, from intimate poojas to grand receptions.
          </p>
        </motion.div>

        <div className="occasion-strip">
          {[
            { img: "/craftsmanship-bg.png", occasion: "Intimate Pooja", tip: "Pair a handwoven ensemble with gold jhumkas and a silk dupatta for understated devotion." },
            { img: "/products/Co-order Golden-Black/5.JPG", occasion: "Engagement Ceremony", tip: "A richly embroidered co-ord set with statement bangles creates an unforgettable silhouette." },
            { img: "/products/Drape Saree-Pink Blush Color/3.JPG", occasion: "Cocktail Evening", tip: "An Indo-Western drape with minimalist diamonds — let the garment do the talking." },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="occasion-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.2, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="occasion-card-img-wrap">
                <img src={item.img} alt={item.occasion} loading="lazy" />
                <div className="occasion-card-img-overlay" />
              </div>
              <div className="occasion-card-body">
                <span className="occasion-card-number">0{i + 1}</span>
                <h3 className="occasion-card-title">{item.occasion}</h3>
                <div className="occasion-card-divider">
                  <svg width="24" height="8" viewBox="0 0 24 8" fill="none">
                    <line x1="0" y1="4" x2="10" y2="4" stroke="#cda372" strokeWidth="1" />
                    <path d="M12 1L13.5 4L12 7L10.5 4Z" fill="#cda372" />
                    <line x1="14" y1="4" x2="24" y2="4" stroke="#cda372" strokeWidth="1" />
                  </svg>
                </div>
                <p className="occasion-card-tip">{item.tip}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="occasion-cta-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Link to="/collection/all" className="btn-occasion-explore">
            <span className="btn-occasion-diamond">◈</span>
            EXPLORE ALL COLLECTIONS
            <span className="btn-occasion-arrow">⟶</span>
          </Link>
        </motion.div>
      </div>

    </div>
  );
};

export default LookbookPage;
