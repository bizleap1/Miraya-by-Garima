'use client';
import React from 'react';
import './AboutPage.css';

const ReturnPolicyPage = () => {
  return (
    <div className="about-page" style={{paddingTop: '100px', minHeight: '80vh'}}>
      <div className="about-hero" style={{height: '20vh'}}>
        <h1 style={{color: 'var(--primary-burgundy)', textAlign: 'center'}}>Shipping & Returns</h1>
      </div>
      <div className="about-content" style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Shipping Policy</h3>
        <p>All domestic orders are processed and shipped within 2-3 business days. Delivery times vary based on location but generally take 5-7 working days. International orders may take up to 15 days.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Return Policy</h3>
        <p>We accept returns within 14 days of delivery for unworn, unwashed merchandise with all original tags attached. Custom orders and made-to-measure pieces are non-refundable.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>How to Initiate a Return</h3>
        <p>Please contact our support team at returns@miraya.com with your order number to initiate a return request.</p>
      </div>
    </div>
  );
};

export default ReturnPolicyPage;
