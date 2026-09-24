'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import API_URL from '../config';
import { getProductImage } from '../utils/imageHelper';
import './PrimeCollectionPage.css';
import { ArrowRight } from 'lucide-react';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Prime Collection — Miraya by Garima',
  description: 'Our luxurious Prime Collection featuring opulent designs and intricate hand-craftsmanship.',
  url: 'https://www.mirayabygarima.com/collection/prime',
};

export default function PrimeCollectionPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        // Prime condition: Price >= 6000
        const primeProducts = data.filter(p => Number(p.price) >= 6000);
        setProducts(primeProducts);
      }
    } catch (error) {
      console.error('Error fetching prime collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="prime-editorial">
      <SEO 
        title="Prime Collection | Miraya Couture"
        description="Explore the Miraya Prime Collection. Opulent, rich, and heavily hand-embroidered masterpieces."
        schemaJson={schema}
      />

      {/* ── PRIME HERO SECTION ── */}
      <section className="prime-hero">
        <div className="prime-hero-bg">
          <img 
            src="/prime_hero.jpg" 
            alt="Prime Collection" 
            className="prime-hero-img"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              document.getElementById('prime-fallback-header').style.display = 'flex';
            }}
          />
          <div id="prime-fallback-header" style={{ display: 'none', width: '100%', height: '500px', backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 300, letterSpacing: '4px', margin: 0 }}>THE PRIME COLLECTION</h1>
            <p style={{ marginTop: '1rem', letterSpacing: '2px', color: '#C6A46A' }}>Bespoke Elegance & Rich Craftsmanship</p>
          </div>
        </div>
      </section>

      {/* ── PRODUCT GRID ── */}
      <section className="prime-grid-section">
        <div className="prime-grid-container">
          {loading ? (
            <div className="prime-loading">Curating collection...</div>
          ) : (
            <div className="prime-product-grid">
              {products.map((p, index) => (
                <Link to={`/product/${p.category?.name?.toLowerCase() || 'prime'}/${p.id}`} key={p.id} className="prime-product-card">
                  <div className="prime-image-wrapper">
                    <img 
                      src={getProductImage(p.images?.[0] || p.image_url)} 
                      alt={p.name} 
                      loading="lazy"
                    />
                    <div className="prime-hover-overlay">
                      <span className="prime-view-text">View Details <ArrowRight size={16}/></span>
                    </div>
                  </div>
                  
                  <div className="prime-product-info">
                    <h3 className="prime-product-title">{p.name}</h3>
                    <div className="prime-product-meta">
                      <span className="prime-price">{formatINR(p.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {products.length === 0 && !loading && (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#888', gridColumn: '1 / -1' }}>
                  No prime pieces available at the moment.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
