import PDFDocument from 'pdfkit';

/**
 * Generates an ultra-premium, professional Haute Couture Tax Invoice PDF
 * for Miraya By Garima.
 */
export const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 36,
    info: {
      Title: `Tax Invoice #INV-MRY-${String(order.id).padStart(5, '0')}`,
      Author: 'Miraya By Garima',
      Subject: 'Luxury Haute Couture Tax Invoice / Retail Receipt',
      Keywords: 'miraya, haute couture, tax invoice, garima, nagpur boutique'
    }
  });

  doc.pipe(stream);

  // Luxury Color Palette
  const COLOR_BURGUNDY = '#5e0a0b';
  const COLOR_GOLD = '#c6a46a';
  const COLOR_DARK = '#1a1a1a';
  const COLOR_MUTED = '#555555';
  const COLOR_LIGHT_BG = '#FAF8F5';
  const COLOR_LINE = '#e6d8c3';
  const COLOR_ACCENT = '#8c2627';

  const pageWidth = 595.28; // A4 width in points
  const margin = 36;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = 36;

  // ─── 1. TOP HEADER & BRANDING ──────────────────────────────────────────────
  // Top Gold Banner Bar
  doc.rect(margin, currentY, contentWidth, 3.5).fill(COLOR_GOLD);
  currentY += 14;

  // Header Left: Brand & Boutique Information
  doc.font('Helvetica-Bold')
     .fontSize(21)
     .fillColor(COLOR_BURGUNDY)
     .text('MIRAYA BY GARIMA', margin, currentY, { characterSpacing: 2 });

  // Header Right: Tax Invoice Title
  doc.font('Helvetica-Bold')
     .fontSize(13)
     .fillColor(COLOR_DARK)
     .text('OFFICIAL TAX INVOICE', margin, currentY + 2, { align: 'right' });

  currentY += 23;

  doc.font('Helvetica')
     .fontSize(8.5)
     .fillColor(COLOR_GOLD)
     .text('HAUTE COUTURE & LUXURY TROUSSEAU', margin, currentY, { characterSpacing: 1 });

  doc.font('Helvetica-Bold')
     .fontSize(8.5)
     .fillColor(COLOR_BURGUNDY)
     .text(`Invoice No: INV-MRY-${String(order.id).padStart(5, '0')}`, margin, currentY, { align: 'right' });

  currentY += 13;

  // Store Address & Order Info
  doc.font('Helvetica')
     .fontSize(8)
     .fillColor(COLOR_MUTED)
     .text('Flagship Atelier: Shop no. UG/5, Jagat Plaza, Law College Square, Amravati Rd, Nagpur, MH 440033', margin, currentY);

  const orderDateStr = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  doc.text(`Invoice Date: ${orderDateStr}`, margin, currentY, { align: 'right' });

  currentY += 12;

  doc.text('GSTIN: 27AABCM9876Q1Z5 | State Code: 27 (Maharashtra) | Phone: +91 92712 18156', margin, currentY);
  doc.text(`Order Reference: #ORD-${order.id}`, margin, currentY, { align: 'right' });

  currentY += 12;

  doc.text('Email: mirayaofficial.in@gmail.com | Website: www.mirayabygarima.com', margin, currentY);
  doc.text(`Payment Ref: ${order.payment_id || (order.payment_method === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PREPAID')}`, margin, currentY, { align: 'right' });

  currentY += 16;

  // Decorative Filigree Divider
  doc.rect(margin, currentY, contentWidth, 0.8).fill(COLOR_LINE);
  currentY += 12;

  // ─── 2. BILLED TO & SHIPPED TO DUAL CARDS ──────────────────────────────────
  const cardWidth = (contentWidth - 14) / 2;
  const cardHeight = 86;

  // Left Card: Customer / Billed To
  doc.rect(margin, currentY, cardWidth, cardHeight)
     .fillAndStroke(COLOR_LIGHT_BG, COLOR_LINE);

  doc.font('Helvetica-Bold')
     .fontSize(8.5)
     .fillColor(COLOR_BURGUNDY)
     .text('BILLED TO (CUSTOMER DETAILS)', margin + 12, currentY + 9);

  const customerName = order.user?.name || order.shipping_name || 'Valued Client';
  const customerEmail = order.user?.email || order.shippingDetails?.email || 'N/A';
  const customerPhone = order.shipping_phone || order.user?.phone || 'N/A';

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_DARK).text(customerName, margin + 12, currentY + 24);
  doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED)
     .text(`Email: ${customerEmail}`, margin + 12, currentY + 38)
     .text(`Phone: ${customerPhone}`, margin + 12, currentY + 50)
     .text(`Place of Supply: ${order.shipping_state || 'Maharashtra'} (State Code: 27)`, margin + 12, currentY + 62);

  // Right Card: Delivery Address / Shipped To
  const rightCardX = margin + cardWidth + 14;
  doc.rect(rightCardX, currentY, cardWidth, cardHeight)
     .fillAndStroke(COLOR_LIGHT_BG, COLOR_LINE);

  doc.font('Helvetica-Bold')
     .fontSize(8.5)
     .fillColor(COLOR_BURGUNDY)
     .text('SHIPPED TO (DELIVERY ADDRESS)', rightCardX + 12, currentY + 9);

  const shipName = order.shipping_name || customerName;
  const shipAddress = order.shipping_address || (order.user?.addresses && order.user.addresses[0]?.address_line1) || 'Nagpur Flagship Boutique Dispatch';
  const shipCityState = [order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(', ') || 'Nagpur, Maharashtra 440033';

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_DARK).text(shipName, rightCardX + 12, currentY + 24);
  doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED)
     .text(shipAddress.slice(0, 52), rightCardX + 12, currentY + 38, { width: cardWidth - 24, height: 22 })
     .text(shipCityState, rightCardX + 12, currentY + 54)
     .text(`Contact: ${customerPhone}`, rightCardX + 12, currentY + 66);

  currentY += cardHeight + 16;

  // ─── 3. ITEM SPECIFICATION TABLE HEADER ────────────────────────────────────
  const colX = {
    sno: margin,
    desc: margin + 30,
    hsn: margin + 225,
    size: margin + 275,
    qty: margin + 325,
    rate: margin + 375,
    amount: margin + 445
  };

  doc.rect(margin, currentY, contentWidth, 22).fill(COLOR_BURGUNDY);

  doc.font('Helvetica-Bold')
     .fontSize(8)
     .fillColor('#ffffff')
     .text('S.NO', colX.sno + 6, currentY + 7)
     .text('ITEM & DESIGN SPECIFICATION', colX.desc, currentY + 7)
     .text('HSN', colX.hsn, currentY + 7)
     .text('SIZE / SKU', colX.size, currentY + 7)
     .text('QTY', colX.qty, currentY + 7, { width: 35, align: 'center' })
     .text('RATE (INR)', colX.rate, currentY + 7, { width: 65, align: 'right' })
     .text('AMOUNT (INR)', colX.amount, currentY + 7, { width: 75, align: 'right' });

  currentY += 22;

  // ─── 4. ITEM ROWS ──────────────────────────────────────────────────────────
  const items = order.items && order.items.length > 0 ? order.items : [
    {
      product: { name: 'Handcrafted Bespoke Garment' },
      size: 'Free Size',
      quantity: 1,
      price_at_purchase: order.total
    }
  ];

  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = 26;

    if (isEven) {
      doc.rect(margin, currentY, contentWidth, rowHeight).fill(COLOR_LIGHT_BG);
    }

    const unitPrice = Number(item.price_at_purchase || item.price || 0);
    const qty = Number(item.quantity || 1);
    const itemTotal = unitPrice * qty;
    const productName = item.product?.name || item.name || item.title || 'Haute Couture Ensemble';
    const itemSizeSku = item.sku_snapshot || (item.variant && item.variant.sku) || `${item.size || 'M'}`;

    doc.font('Helvetica').fontSize(8).fillColor(COLOR_DARK);
    doc.text(String(index + 1), colX.sno + 10, currentY + 8);
    doc.font('Helvetica-Bold').text(productName.slice(0, 36), colX.desc, currentY + 8);
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('6204', colX.hsn, currentY + 8);
    doc.text(itemSizeSku.slice(0, 10), colX.size, currentY + 8);
    doc.fillColor(COLOR_DARK).text(String(qty), colX.qty, currentY + 8, { width: 35, align: 'center' });
    doc.text(`₹${unitPrice.toLocaleString('en-IN')}`, colX.rate, currentY + 8, { width: 65, align: 'right' });
    doc.font('Helvetica-Bold').text(`₹${itemTotal.toLocaleString('en-IN')}`, colX.amount, currentY + 8, { width: 75, align: 'right' });

    // Subtle Row border
    doc.rect(margin, currentY + rowHeight - 0.5, contentWidth, 0.5).fill(COLOR_LINE);
    currentY += rowHeight;
  });

  currentY += 14;

  // ─── 5. SUMMARY & TOTALS BREAKDOWN ─────────────────────────────────────────
  const subtotal = Number(order.total || 0);
  const gstEstimated = Math.round((subtotal * 12) / 112); // 12% inclusive GST
  const netTaxable = subtotal - gstEstimated;
  const isInterstate = (order.shipping_state || '').toLowerCase().trim() !== 'maharashtra' && (order.shipping_state || '').toLowerCase().trim() !== 'mh' && Boolean(order.shipping_state);

  const summaryWidth = 230;
  const summaryX = pageWidth - margin - summaryWidth;

  // Payment Status & Seal Box (Left Side)
  const isPaid = (order.status || '').toLowerCase() !== 'cancelled' && (
    Boolean(order.payment_id && order.payment_id !== 'COD' && order.payment_id !== 'CASH_ON_DELIVERY') ||
    Boolean(order.razorpay_order_id) ||
    (Array.isArray(order.payments) && order.payments.some(p => p.status === 'PAID' || p.gateway === 'RAZORPAY')) ||
    String(order.payment_method || '').toLowerCase().includes('online') ||
    String(order.payment_method || '').toLowerCase().includes('razorpay')
  );
  const isCancelled = (order.status || '').toLowerCase() === 'cancelled';

  const stampColor = isCancelled ? '#c0392b' : (isPaid ? '#27ae60' : '#d35400');
  const stampTitle = isCancelled ? '✗ CANCELLED' : (isPaid ? '✓ PAID & CONFIRMED' : '⏳ COD - PAYMENT DUE');

  const methodStr = isPaid ? 'Razorpay Online' : (order.payment_method?.toUpperCase() || 'CASH ON DELIVERY');
  const refStr = (order.payment_id && order.payment_id !== 'COD') ? order.payment_id : (order.transaction_id || (order.payments && order.payments[0]?.gateway_payment_id) || 'COD-HANDOVER-PENDING');

  doc.rect(margin, currentY, 220, 84).fillAndStroke(COLOR_LIGHT_BG, stampColor);

  doc.font('Helvetica-Bold')
     .fontSize(9.5)
     .fillColor(stampColor)
     .text(stampTitle, margin + 12, currentY + 10);

  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor(COLOR_MUTED)
     .text(`Method: ${methodStr}`, margin + 12, currentY + 26)
     .text(`Payment Ref: ${refStr}`, margin + 12, currentY + 38)
     .text(`Fulfillment Status: ${(order.status || 'PROCESSING').toUpperCase()}`, margin + 12, currentY + 50)
     .text('Authentic Luxury Guarantee: 100% Handcrafted', margin + 12, currentY + 62);

  // Calculation Breakdown (Right Side)
  doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED);
  doc.text('Taxable Amount (Net):', summaryX, currentY);
  doc.font('Helvetica-Bold').fillColor(COLOR_DARK).text(`₹${netTaxable.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
  currentY += 14;

  if (isInterstate) {
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('IGST (12% Integrated Tax):', summaryX, currentY);
    doc.font('Helvetica-Bold').fillColor(COLOR_DARK).text(`₹${gstEstimated.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
  } else {
    const halfGst = Math.round(gstEstimated / 2);
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('CGST (6%) + SGST (6%):', summaryX, currentY);
    doc.font('Helvetica-Bold').fillColor(COLOR_DARK).text(`₹${halfGst.toLocaleString('en-IN')} + ₹${halfGst.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
  }
  currentY += 14;

  doc.font('Helvetica').fillColor(COLOR_MUTED).text('Luxury Atelier Packaging & Shipping:', summaryX, currentY);
  doc.font('Helvetica-Bold').fillColor('#27ae60').text('COMPLIMENTARY', summaryX, currentY, { width: summaryWidth, align: 'right' });
  currentY += 16;

  // Grand Total Highlight Bar
  doc.rect(summaryX - 8, currentY, summaryWidth + 8, 26).fill(COLOR_BURGUNDY);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff');
  doc.text('GRAND TOTAL (INR):', summaryX, currentY + 7);
  doc.text(`₹${subtotal.toLocaleString('en-IN')}`, summaryX, currentY + 7, { width: summaryWidth - 6, align: 'right' });

  currentY += 56;

  // ─── 6. FOOTER & AUTHORIZED DIGITAL SEAL ───────────────────────────────────
  // Terms & Conditions (Left side)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_BURGUNDY).text('BOUTIQUE TERMS & CARE INSTRUCTIONS:', margin, currentY);
  currentY += 10;
  doc.font('Helvetica').fontSize(7).fillColor(COLOR_MUTED);
  doc.text('1. All handcrafted garments are tailored with utmost care. Professional Dry Clean Only.', margin, currentY);
  doc.text('2. Alterations requests are honored within 7 days of delivery at our Nagpur atelier.', margin, currentY + 9);
  doc.text('3. This document serves as an authentic Computer-Generated Tax Invoice.', margin, currentY + 18);

  // Digital Signatory Seal (Right side)
  const sealX = pageWidth - margin - 150;
  doc.rect(sealX, currentY - 14, 150, 46).stroke(COLOR_LINE);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_BURGUNDY).text('FOR MIRAYA BY GARIMA', sealX + 8, currentY - 8);
  doc.font('Helvetica').fontSize(7).fillColor(COLOR_MUTED).text('Digitally Signed & Certified', sealX + 8, currentY + 4);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_GOLD).text('Authorized Couturier Seal ◈', sealX + 8, currentY + 16);

  // Bottom Decorative Gold Trim
  doc.rect(margin, 800, contentWidth, 2.5).fill(COLOR_GOLD);

  doc.end();
};
