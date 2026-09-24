'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import API_URL from '../config';
import { getProductImage } from '../utils/imageHelper';
import './NewArrivalsPage.css';
import { Heart, ArrowRight } from 'lucide-react';

const newArrivalsSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'New Arrivals — Miraya by Garima',
  description: 'Discover our latest collection where timeless Indian craftsmanship meets modern couture silhouettes.',
  url: 'https://www.mirayabygarima.com/new-arrivals',
};

export default function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/page-customizer/new-arrivals`);
      if (res.ok) {
        const data = await res.json();
        
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          // Fallback to fetch all products if no customizer data is set
          const fallbackRes = await fetch(`${API_URL}/api/products`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            setProducts(fallbackData.slice(0, 8));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
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
    <div className="new-arrivals-editorial">
      <SEO
        title="New Arrivals | High-End Editorial Collection | Miraya by Garima"
        description="Fresh silhouettes. Timeless charm. Discover the latest editorial pieces from Miraya by Garima."
        schemaJson={newArrivalsSchema}
      />

      {/* ── HERO SECTION ── */}
      <section className="na-hero">
        <div className="na-hero-bg">
          {/* Using new arrival hero image as requested */}
          <img src="/new hero arrival" alt="Miraya New Arrivals" className="na-hero-img" />
        </div>
      </section>


      {/* ── PRODUCT GRID ── */}
      <section className="na-grid-section">
        <div className="na-grid-container">
          {loading ? (
            <div className="na-loading">Curating collection...</div>
          ) : (
            <div className="na-product-grid">
              {products.map((p, index) => {
                // If it's the 6th item (index 5), inject the Editorial Block instead
                if (index === 5) {
                  return (
                    <div key="editorial-insert" className="na-editorial-insert">
                      <div className="na-insert-image">
                        <img src="/saree_detail.png" alt="Modern Traditions" />
                      </div>
                      <div className="na-insert-content">
                        <h3>MODERN<br/>TRADITIONS</h3>
                        <p>Contemporary silhouettes<br/>rooted in heritage —<br/>made for your story.</p>
                        <Link to="/collection/all" className="na-insert-link">
                          EXPLORE COLLECTION <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                }

                // Normal Product Card
                const img = getProductImage(p.image_url || (p.images && p.images[0]), API_URL);
                return (
                  <Link to={`/product/${p.category?.name || 'clothing'}/${p.id}`} key={p.id} className="na-product-card">
                    <div className="na-card-image-wrap">
                      <img src={img} alt={p.name} className="na-card-image" />
                      <button className="na-wishlist-btn"><Heart size={18} strokeWidth={1.5} /></button>
                    </div>
                    <div className="na-card-info">
                      <div className="na-card-text">
                        <h3 className="na-card-title">{p.name}</h3>
                        <p className="na-card-price">{formatINR(p.price)}</p>
                      </div>
                      <div className="na-card-arrow">
                        <ArrowRight size={16} strokeWidth={1.5} />
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {/* Fallback if less than 6 products, still show the editorial insert at the end */}
              {products.length < 6 && (
                <div key="editorial-insert-fallback" className="na-editorial-insert">
                  <div className="na-insert-image">
                    <img src="/saree_detail.png" alt="Modern Traditions" />
                  </div>
                  <div className="na-insert-content">
                    <h3>MODERN<br/>TRADITIONS</h3>
                    <p>Contemporary silhouettes<br/>rooted in heritage —<br/>made for your story.</p>
                    <Link to="/collection/all" className="na-insert-link">
                      EXPLORE COLLECTION <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── CRAFT / DETAIL BANNER ── */}
      <section className="na-bottom-banner">
        <div className="na-banner-bg">
          <img src="/fabric-tex.png" alt="Miraya Craftsmanship" />
          <div className="na-banner-overlay"></div>
        </div>
        <div className="na-banner-content">
          <h2>EVERY DETAIL<br/>A NEW STORY</h2>
          <div className="na-banner-line"></div>
          <Link to="/about" className="na-banner-link">
            DISCOVER MORE <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
