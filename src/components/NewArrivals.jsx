'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import API_URL from '../config';
import './NewArrivals.css';

const CMS_STORAGE_KEY = 'miraya_cms_new_arrivals_v2';

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Purple Suit',
    label: 'PURPLE SUIT',
    tagline: 'Regal hues, exquisite craft.',
    image: '/products/Suit-Purple/1.JPG',
    category: 'designer-suits',
    href: '/product/designer-suits/purple-suit',
    objectPosition: 'center 15%',
  },
  {
    id: 2,
    name: 'Pink Blush Lehenga',
    label: 'PINK BLUSH',
    tagline: 'Dream draped in blush.',
    image: '/products/Lehenga-Pink Blush/1.JPG',
    category: 'indo-western',
    href: '/product/indo-western/1',
    objectPosition: 'center 12%',
  },
  {
    id: 3,
    name: 'Mustard Suit',
    label: 'MUSTARD',
    tagline: 'Bold hues, timeless grace.',
    image: '/products/Suit -Mustard/1.JPG',
    category: 'designer-suits',
    href: '/product/designer-suits/10',
    objectPosition: 'center top',
  },
  {
    id: 4,
    name: 'Pink Blush Drape Saree',
    label: 'DRAPE SAREE',
    tagline: 'Elegance effortlessly worn.',
    image: '/products/Drape Saree-Pink Blush Color/1.JPG',
    category: 'drape-sarees',
    href: '/product/drape-sarees/6',
    objectPosition: 'center top',
  },
];

// Staggered variants for text
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const NewArrivals = () => {
  const sectionRef = useRef(null);

  // Dynamic CMS State
  const [cmsData, setCmsData] = useState({
    is_active: true,
    heading: 'Fresh Arrivals,\nTimeless Grace',
    description: 'Thoughtfully designed. Beautifully detailed.\nA celebration of you, in every thread.',
    button_text: 'DISCOVER NEW ARRIVALS',
    button_link: '/collection/all',
    items: DEFAULT_PRODUCTS,
  });

  // Fetch dynamic CMS data on mount + storage sync
  useEffect(() => {
    let isMounted = true;

    const loadCmsData = async () => {
      // 1. Try local storage cache first for zero-latency load
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(CMS_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (isMounted && parsed) {
              const sanitizedItems = (parsed.items || []).map((item, idx) => ({
                ...item,
                objectPosition: item.objectPosition || (idx === 0 ? 'center 15%' : idx === 1 ? 'center 12%' : 'center top'),
              }));
              setCmsData((prev) => ({
                ...prev,
                is_active: parsed.is_active ?? true,
                heading: parsed.heading || prev.heading,
                description: parsed.description || prev.description,
                button_text: parsed.button_text || prev.button_text,
                button_link: parsed.button_link || prev.button_link,
                items: sanitizedItems.length ? sanitizedItems : DEFAULT_PRODUCTS,
              }));
            }
          }
        } catch (_) {}
      }

      // 2. Fetch from Backend API (if available)
      try {
        const res = await fetch(`${API_URL}/api/homepage-sections/new-arrivals`).catch(() => null);
        if (res && res.ok) {
          const serverData = await res.json();
          if (isMounted && serverData && serverData.section_name) {
            const items = (serverData.newArrivalItems || []).map((item, idx) => {
              const cat = item.product?.category?.slug || item.product?.category?.name || 'indo-western';
              const pId = item.product_id || item.product?.id || idx + 1;
              return {
                id: pId,
                name: item.product?.name || item.tagline || 'Designer Outfit',
                label: (item.product?.name || 'DESIGNER PIECE').toUpperCase(),
                tagline: item.tagline || item.product?.category?.name || 'Handcrafted Couture',
                image: item.custom_image || item.product?.image_url || (item.product?.images && item.product?.images[0]) || '/products/Lehenga-Pink Blush/1.JPG',
                category: cat,
                href: `/product/${cat}/${pId}`,
                objectPosition: item.crop_position?.objectPosition || (idx === 0 ? 'center 15%' : idx === 1 ? 'center 12%' : 'center top'),
              };
            });

            setCmsData({
              is_active: serverData.is_active ?? true,
              heading: serverData.heading || 'Fresh Arrivals,\nTimeless Grace',
              description: serverData.description || 'Thoughtfully designed. Beautifully detailed.\nA celebration of you, in every thread.',
              button_text: serverData.button_text || 'DISCOVER NEW ARRIVALS',
              button_link: serverData.button_link || '/collection/all',
              items: items.length ? items : DEFAULT_PRODUCTS,
            });
          }
        }
      } catch (err) {
        // Graceful fallback to default/cached data
      }
    };

    loadCmsData();

    // Listen for cross-tab or admin storage updates
    const handleStorageChange = (e) => {
      if (e.key === CMS_STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setCmsData((prev) => ({
            ...prev,
            ...updated,
          }));
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parallax for cards (active on desktop, disabled on mobile)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '4%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-3%']);
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '3%']);
  const y4 = useTransform(scrollYProgress, [0, 1], ['0%', '-3%']);
  const parallaxTransforms = [y1, y2, y3, y4];

  // If section is disabled by admin in CMS, hide it completely
  if (!cmsData.is_active) {
    return null;
  }

  const displayProducts = cmsData.items.length ? cmsData.items : DEFAULT_PRODUCTS;

  return (
    <section className="ed-na-section" ref={sectionRef}>
      {/* Subtle floral watermark background */}
      <div className="ed-na-watermark" />

      <div className="ed-na-container">
        {/* LEFT EDITORIAL PANEL */}
        <motion.div
          className="ed-na-left"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px' }}
        >
          <motion.div className="ed-na-eyebrow" variants={itemVariants}>
            <span className="ed-na-line" />
            <span className="ed-na-eyebrow-text">NEW ARRIVALS</span>
            <span className="ed-na-line" />
          </motion.div>

          <motion.h2 className="ed-na-heading" variants={itemVariants} style={{ whiteSpace: 'pre-line' }}>
            {cmsData.heading}
          </motion.h2>

          <motion.p className="ed-na-desc" variants={itemVariants} style={{ whiteSpace: 'pre-line' }}>
            {cmsData.description}
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link to={cmsData.button_link || '/collection/all'} className="ed-na-cta">
              {cmsData.button_text} <span className="arrow">→</span>
            </Link>
          </motion.div>

          <motion.div className="ed-na-heritage" variants={itemVariants}>
            <span className="ed-na-star">❖</span>
            <span className="ed-na-heritage-text">
              HERITAGE<br />IN EVERY<br />WEAVE
            </span>
          </motion.div>
        </motion.div>

        {/* RIGHT CARDS SHOWCASE */}
        <div className="ed-na-right">
          {displayProducts.map((product, index) => {
            const crop = product.crop || { zoom: 1, x: 0, y: 0 };
            const productHref = product.href || `/product/${product.category || 'indo-western'}/${product.product_id || product.id}`;
            const displayImage = product.custom_image || product.image;

            return (
              <motion.div
                key={product.product_id || product.id || index}
                className="ed-na-card"
                initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
                whileInView={{ opacity: 1, clipPath: 'inset(0% 0 0 0)' }}
                viewport={{ once: true, margin: '0px' }}
                transition={{ duration: 0.9, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link to={productHref} className="ed-na-arch-wrap" style={{ display: 'block', textDecoration: 'none' }}>
                  <motion.div
                    className="ed-na-img-inner"
                    style={{
                      y: isMobile ? 0 : parallaxTransforms[index % 4],
                    }}
                  >
                    <img
                      src={displayImage}
                      alt={product.name || product.title}
                      className="ed-na-image"
                      style={{
                        objectPosition: product.objectPosition || 'center top',
                      }}
                      loading="lazy"
                    />
                  </motion.div>
                  {/* Decorative border matching the reference */}
                  <div className="ed-na-arch-border">
                    <div className="ed-na-arch-ornament">❖</div>
                  </div>
                </Link>

                <div className="ed-na-info">
                  <h3 className="ed-na-label">{product.label || product.name || product.title}</h3>
                  <p className="ed-na-tagline">{product.tagline}</p>
                  <Link to={productHref} className="ed-na-shop-link">
                    SHOP NOW <span className="arrow">→</span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
