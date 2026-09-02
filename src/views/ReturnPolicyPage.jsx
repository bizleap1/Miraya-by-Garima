'use client';
import React from 'react';
import './AboutPage.css';

const ReturnPolicyPage = () => {
  return (
    <div className="about-page" style={{paddingTop: '100px', minHeight: '80vh'}}>
      <div className="about-hero" style={{height: '20vh'}}>
        <h1 style={{color: 'var(--primary-burgundy)', textAlign: 'center'}}>Shipping & Size Exchange Policy</h1>
      </div>
      <div className="about-content" style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Shipping Policy</h3>
        <p>All domestic orders are processed and shipped within 2-3 business days with insured luxury courier packaging. Delivery times generally take 5-7 working days across India.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Size Exchange Policy</h3>
        <p>We operate under a strict <strong>Size Exchange Only</strong> policy. We do not issue monetary refunds or returns. If your outfit requires a different size, you may request a size exchange within 7 days of delivery through your Customer Account dashboard.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Exchange Eligibility & Guidelines</h3>
        <p>Exchanges are eligible only for unworn, unwashed garments with all original luxury tags intact. Made-to-measure bespoke couture and custom tailored pieces are non-exchangeable.</p>
      </div>
    </div>
  );
};


export default ReturnPolicyPage;
