'use client';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://www.mirayabygarima.com';
const DEFAULT_IMAGE = `${BASE_URL}/products/Lehenga-Pink%20Blush/1.JPG`;
const DEFAULT_TITLE = 'Miraya by Garima | Haute Couture, Designer Bridal Lehengas & Luxury Ethnic Wear Nagpur';
const DEFAULT_DESCRIPTION = 'Explore Miraya by Garima - Nagpur’s premier designer couture atelier for bridal lehengas, pre-stitched drape sarees, reception gowns, and Indo-Western co-ord sets at Law College Square, Nagpur.';
const DEFAULT_KEYWORDS = 'Miraya by Garima, Designer Boutique Nagpur, Bridal Lehengas Nagpur, Luxury Ethnic Wear, Drape Sarees, Indo Western Lehengas, Reception Gowns, Custom Bridal Trousseau, Nagpur Fashion Atelier';

export default function SEO({
  title,
  description,
  keywords,
  image,
  type = 'website',
  schemaJson,
  canonicalUrl
}) {
  const location = useLocation();
  const currentUrl = canonicalUrl || `${BASE_URL}${location.pathname}`;
  const pageTitle = title ? `${title} | Miraya by Garima` : DEFAULT_TITLE;
  const pageDesc = description || DEFAULT_DESCRIPTION;
  const pageKeywords = keywords || DEFAULT_KEYWORDS;
  const pageImage = image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : DEFAULT_IMAGE;

  useEffect(() => {
    // 1. Update Document Title
    document.title = pageTitle;

    // Helper to create or update meta tags
    const setMetaTag = (attr, key, content) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'description', pageDesc);
    setMetaTag('name', 'keywords', pageKeywords);

    // 3. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 4. Open Graph Tags
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDesc);
    setMetaTag('property', 'og:image', pageImage);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', type);

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDesc);
    setMetaTag('name', 'twitter:image', pageImage);

    // 6. JSON-LD Structured Data injection
    let schemaScript = document.getElementById('dynamic-seo-schema');
    if (schemaJson) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'dynamic-seo-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schemaJson);
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [pageTitle, pageDesc, pageKeywords, pageImage, currentUrl, type, schemaJson]);

  return null;
}
