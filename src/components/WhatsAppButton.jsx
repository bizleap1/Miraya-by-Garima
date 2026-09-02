'use client';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '../context/StoreSettingsContext';
import API_URL from '../config';
import './WhatsAppButton.css';

const WhatsAppButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const { whatsapp_number } = useStoreSettings();
  const targetNumber = (whatsapp_number || '919271218156').replace(/[^0-9]/g, '');

  const defaultMessage = encodeURIComponent('Hi Miraya! I need some help with custom outfits.');
  const [waLink, setWaLink] = useState(`https://wa.me/${targetNumber}?text=${defaultMessage}`);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanNumber = (whatsapp_number || '919271218156').replace(/[^0-9]/g, '');
    const isProductPage = location.pathname.startsWith('/product/');

    if (!isProductPage) {
      setWaLink(`https://wa.me/${cleanNumber}?text=${defaultMessage}`);
      return;
    }

    const parts = location.pathname.replace(/^\/product\/?/, '').split('/').filter(Boolean);
    const productId = parts.length >= 1 ? decodeURIComponent(parts[parts.length - 1]) : null;
    const category = parts.length >= 2 ? decodeURIComponent(parts[0]) : '';

    if (!productId) {
      setWaLink(`https://wa.me/${cleanNumber}?text=${defaultMessage}`);
      return;
    }

    let cancelled = false;
    const buildProductWaMessage = async () => {
      let product = null;
      try {
        const res = await fetch(`${API_URL}/api/products/${productId}`);
        if (res.ok) {
          product = await res.json();
        }
      } catch (_) {}

      if (!product) {
        try {
          const { getProductById } = await import('../data/products');
          product = getProductById(productId, category);
        } catch (_) {}
      }

      if (cancelled) return;

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mirayabygarima.com';
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      const productName = product?.title || product?.name || 'Outfit';
      const categoryName = product?.category?.name || product?.category || category || 'Haute Couture';
      const priceFormatted = product?.price ? `₹${typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}` : '';
      const rawImg = product?.image || product?.image_url || (product?.images && product.images[0]) || '';
      const fullImgUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${origin}${rawImg}`) : '';

      let text = `*PRODUCT INQUIRY — MIRAYA BY GARIMA*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      text += `Hello! I am interested in this outfit and would like to get more details:\n\n`;
      text += `*Garment Name:* ${productName}\n`;
      if (categoryName) text += `*Category:* ${categoryName}\n`;
      if (priceFormatted) text += `*Price:* ${priceFormatted}\n`;
      if (product?.fabric) text += `*Fabric:* ${product.fabric}\n`;
      if (product?.color) text += `*Color:* ${product.color}\n`;
      if (currentUrl) text += `*Product Link:* ${currentUrl}\n\n`;
      text += `Please share details regarding availability, custom tailoring, and delivery timeline. Thank you!`;

      setWaLink(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`);
    };

    buildProductWaMessage();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, whatsapp_number]);

  if (!isVisible) return null;

  return (
    <a 
      href={waLink} 
      target="_blank" 
      rel="noopener noreferrer"
      className="whatsapp-float-btn animate-bounce-in"
      aria-label="Chat with us on WhatsApp"
    >
      <div className="wa-tooltip">Chat with Stylist</div>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        className="wa-icon"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    </a>
  );
};

export default WhatsAppButton;
