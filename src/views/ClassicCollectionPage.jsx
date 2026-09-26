'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import API_URL from '../config';
import { getProductImage } from '../utils/imageHelper';
import './ClassicCollectionPage.css';
import { ArrowRight } from 'lucide-react';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Classic Collection — Miraya by Garima',
  description: 'Our everyday luxury Classic Collection featuring breezy silhouettes and timeless elegance.',
  url: 'https://www.mirayabygarima.com/collection/classic',
};

export default function ClassicCollectionPage() {
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
        // Classic condition: Price < 6000
        const classicProducts = data.filter(p => Number(p.price) < 6000);
        setProducts(classicProducts);
      }
    } catch (error) {
      console.error('Error fetching classic collection:', error);
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
    <div className="classic-editorial">
      <SEO 
        title="Classic Collection | Miraya Couture"
        description="Explore the Miraya Classic Collection. Effortlessly elegant everyday luxury."
        schemaJson={schema}
      />

      {/* ── CLASSIC HERO SECTION ── */}
      <section className="classic-hero">
        <div className="classic-hero-bg">
          <img 
            src="/classic_hero.jpg" 
            alt="Classic Collection" 
            className="classic-hero-img"
            style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              document.getElementById('classic-fallback-header').style.display = 'flex';
            }}
          />
          <div id="classic-fallback-header" style={{ display: 'none', width: '100%', height: '400px', backgroundColor: '#F8F5F0', alignItems: 'center', justifyContent: 'center', color: '#333', flexDirection: 'column', textAlign: 'center', padding: '0 20px', boxSizing: 'border-box' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 300, letterSpacing: '2px', margin: 0, color: 'var(--primary-burgundy)' }}>THE CLASSIC COLLECTION</h1>
            <p style={{ marginTop: '1rem', letterSpacing: '1px', color: '#666', fontSize: '0.9rem' }}>Everyday Elegance & Timeless Silhouettes</p>
          </div>
        </div>
      </section>

      {/* ── PRODUCT GRID ── */}
      <section className="classic-grid-section">
        <div className="classic-grid-container">
          {loading ? (
            <div className="classic-loading">Curating collection...</div>
          ) : (
            <div className="classic-product-grid">
              {products.map((p, index) => (
                <Link to={`/product/${p.category?.name?.toLowerCase() || 'classic'}/${p.id}`} key={p.id} className="classic-product-card">
                  <div className="classic-image-wrapper">
                    <img 
                      src={getProductImage(p.images?.[0] || p.image_url)} 
                      alt={p.name} 
                      loading="lazy"
                    />
                    <div className="classic-hover-overlay">
                      <span className="classic-view-text">View Details <ArrowRight size={16}/></span>
                    </div>
                  </div>
                  
                  <div className="classic-product-info">
                    <h3 className="classic-product-title">{p.name}</h3>
                    <div className="classic-product-meta">
                      <span className="classic-price">{formatINR(p.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {products.length === 0 && !loading && (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#888', gridColumn: '1 / -1' }}>
                  No classic pieces available at the moment.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
