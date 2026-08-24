import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * Reusable SVG Barcode Graphic
 */
export function BarcodeSvg({ value, width = 1.5, height = 40, displayValue = true, fontSize = 12 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('JsBarcode render error:', err);
      }
    }
  }, [value, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className="miraya-barcode-svg" style={{ maxWidth: '100%' }} />;
}

/**
 * Professional Miraya Boutique Printable Barcode Garment Tag
 */
export function PrintableBarcodeLabel({ item }) {
  if (!item) return null;

  return (
    <div className="miraya-garment-tag">
      <div className="tag-header">
        <span className="tag-brand">MIRAYA BY GARIMA</span>
        <span className="tag-subtitle">LUXURY APPAREL</span>
      </div>

      <div className="tag-product-name">{item.product_name || item.name || 'Boutique Apparel'}</div>

      <div className="tag-details-row">
        <div className="tag-detail-col">
          <span className="tag-label">SIZE</span>
          <span className="tag-val size-val">{item.size || 'M'}</span>
        </div>
        <div className="tag-detail-col">
          <span className="tag-label">COLOR</span>
          <span className="tag-val">{item.color || 'Default'}</span>
        </div>
        <div className="tag-detail-col">
          <span className="tag-label">SKU</span>
          <span className="tag-val sku-val">{item.sku || 'N/A'}</span>
        </div>
      </div>

      <div className="tag-price-box">
        <span className="mrp-label">MRP (INCL. OF ALL TAXES)</span>
        <span className="mrp-price">₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
      </div>

      <div className="tag-barcode-wrap">
        <BarcodeSvg value={item.barcode || item.sku || 'MBG-VAR-001'} width={1.4} height={38} />
      </div>
    </div>
  );
}

export default BarcodeSvg;
