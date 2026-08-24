'use client';
import React from 'react';
import './AboutPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="about-page" style={{paddingTop: '100px', minHeight: '80vh'}}>
      <div className="about-hero" style={{height: '20vh'}}>
        <h1 style={{color: 'var(--primary-burgundy)', textAlign: 'center'}}>Privacy Policy</h1>
      </div>
      <div className="about-content" style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Your Privacy is Important</h3>
        <p>At Miraya, we respect your privacy and are committed to protecting the personal information you share with us.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Data Collection</h3>
        <p>We collect information you provide directly to us when you make a purchase, create an account, or sign up for our newsletter.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>How We Use Your Data</h3>
        <p>Your data is used to process your transactions, manage your account, and provide you with personalized recommendations and offers.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
