'use client';
import React from 'react';
import './AboutPage.css';

const TermsPage = () => {
  return (
    <div className="about-page" style={{paddingTop: '100px', minHeight: '80vh'}}>
      <div className="about-hero" style={{height: '20vh'}}>
        <h1 style={{color: 'var(--primary-burgundy)', textAlign: 'center'}}>Terms of Service</h1>
      </div>
      <div className="about-content" style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>1. Acceptance of Terms</h3>
        <p>By accessing or using our website, you agree to be bound by these terms.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>2. Orders & Pricing</h3>
        <p>All orders are subject to acceptance and availability. Prices are subject to change without notice.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>3. Custom Measurements</h3>
        <p>For custom made-to-measure orders, ensuring accurate measurements is the responsibility of the customer. We cannot accept returns for custom-fitted items unless there is a manufacturing defect.</p>
      </div>
    </div>
  );
};

export default TermsPage;
