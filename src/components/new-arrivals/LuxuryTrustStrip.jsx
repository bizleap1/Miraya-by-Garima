'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function LuxuryTrustStrip() {
  const trustItems = [
    {
      id: 'fabrics',
      label: 'PREMIUM FABRICS',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c-1.5 3-4 6-8 7 3.5 1 5.5 4 6 8 .5-4 2.5-7 6-8-4-1-6.5-4-8-7z" />
          <path d="M12 12c-2 2-3 4-3 6m3-6c2 2 3 4 3 6" opacity="0.6" />
        </svg>
      )
    },
    {
      id: 'crafted',
      label: 'ARTISAN CRAFTED',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20l7-7" />
          <path d="M11 13l4-4-2-2-4 4 2 2z" />
          <path d="M15 9l2-2a2 2 0 113 3l-2 2" />
          <path d="M19 5l-1 1" />
        </svg>
      )
    },
    {
      id: 'designs',
      label: 'TIMELESS DESIGNS',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
          <path d="M2 9h20M10 3l-2 6 4 12 4-12-2-6" />
        </svg>
      )
    },
    {
      id: 'delivery',
      label: 'PAN INDIA DELIVERY',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 3h15v13H1z" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      )
    }
  ];

  return (
    <section className="na-trust-strip-section" aria-label="Miraya Atelier Assurances">
      <div className="na-trust-strip-container">
        {/* Four Trust Value Items */}
        <div className="na-trust-items-group">
          {trustItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <span className="na-trust-divider" aria-hidden="true" />}
              <motion.div
                className="na-trust-item"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="na-trust-icon" aria-hidden="true">{item.icon}</span>
                <span className="na-trust-label">{item.label}</span>
              </motion.div>
            </React.Fragment>
          ))}
        </div>

        {/* Far-Right Brand Signature */}
        <div className="na-trust-signature-wrap">
          <span className="na-signature-rule" aria-hidden="true" />
          <div className="na-signature-text">
            <span className="sig-line">WEAR</span>
            <span className="sig-line">YOUR STORY</span>
          </div>
        </div>
      </div>
    </section>
  );
}
