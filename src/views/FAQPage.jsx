'use client';
import React from 'react';
import SEO from '../components/SEO';
import './AboutPage.css';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How long does delivery take for Miraya by Garima outfits?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our standard delivery time is 7-10 business days for ready-to-wear items, and 3-4 weeks for bespoke or custom made-to-order bridal pieces.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you ship internationally?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Miraya by Garima ships globally across USA, UK, UAE, Canada, Australia and worldwide with insured courier partners.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I customize the size and color of my outfit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer complete bespoke tailoring and personalization at our Nagpur flagship atelier. Reach out to our design team via WhatsApp or contact page.'
      }
    }
  ]
};

const FAQPage = () => {
  return (
    <div className="about-page" style={{paddingTop: '100px', minHeight: '80vh'}}>
      <SEO
        title="Frequently Asked Questions (FAQ) & Shipping"
        description="Find answers to common questions about Miraya by Garima designer outfits, global shipping, bespoke bridal tailoring, and order tracking."
        keywords="Miraya by Garima FAQ, Bridal Delivery Times Nagpur, Custom Saree Tailoring, International Shipping Indian Wear"
        schemaJson={faqSchema}
      />
      <div className="about-hero" style={{height: '20vh'}}>
        <h1 style={{color: 'var(--primary-burgundy)', textAlign: 'center'}}>Frequently Asked Questions</h1>
      </div>
      <div className="about-content" style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>How long does delivery take?</h3>
        <p>Our standard delivery time is 7-10 business days for ready-to-wear items, and 3-4 weeks for custom or made-to-order pieces.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Do you ship internationally?</h3>
        <p>Yes, we ship globally across USA, UK, UAE, Canada and worldwide. Shipping options are provided at checkout.</p>
        
        <h3 style={{color: 'var(--gold-accent)', marginTop: '2rem'}}>Can I track my order?</h3>
        <p>Once your order is shipped, you will receive an SMS and email notification with a tracking ID to follow live transit.</p>
      </div>
    </div>
  );
};

export default FAQPage;
