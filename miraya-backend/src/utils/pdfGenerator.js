import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve Miraya Official Brand Logo
const findLogoPath = () => {
  const candidatePaths = [
    path.resolve(__dirname, '../../../../public/logoR.png'),
    path.resolve(__dirname, '../../../public/logoR.png'),
    path.resolve(__dirname, '../../public/logoR.png'),
    path.resolve(process.cwd(), '../public/logoR.png'),
    path.resolve(process.cwd(), 'public/logoR.png'),
    'd:/Miraya-by-Garima-main (1)/Miraya-by-Garima-main/public/logoR.png'
  ];

  for (const candidate of candidatePaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
};

/**
 * Generates an ultra-luxury, high-end Haute Couture Tax Invoice PDF
 * for Miraya By Garima.
 */
export const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: `Tax Invoice #INV-MRY-${String(order.id).padStart(5, '0')}`,
      Author: 'Miraya By Garima',
      Subject: 'Luxury Haute Couture Tax Invoice',
      Keywords: 'miraya, haute couture, tax invoice, garima, nagpur boutique'
    }
  });

  doc.pipe(stream);

  // Haute Couture Palette
  const COLOR_BASE = '#FCFBF9'; // Warm ivory / light cream base
  const COLOR_BURGUNDY = '#5E0A0B'; // Deep wine / burgundy
  const COLOR_GOLD = '#D4AF37'; // Champagne gold
  const COLOR_GOLD_LIGHT = '#F4EAD5'; // Very subtle gold
  const COLOR_DARK = '#2C2C2C'; // Soft black for text
  const COLOR_MUTED = '#666666'; // Gray for secondary text
  const COLOR_CARD_BG = '#FFFFFF'; // White for cards to stand out against ivory
  
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - (margin * 2);

  // ─── 0. PREMIUM IVORY BACKGROUND & SUBTLE BORDER ───────────────────────────
  // Fill entire page with warm ivory base
  doc.rect(0, 0, pageWidth, pageHeight).fill(COLOR_BASE);
  
  // Outer Elegant Border
  doc.rect(margin - 10, margin - 10, contentWidth + 20, pageHeight - (margin * 2) + 20)
     .lineWidth(0.5)
     .stroke(COLOR_GOLD);

  let currentY = margin;

  // ─── 1. TOP HEADER & BRANDING ──────────────────────────────────────────────
  const logoPath = findLogoPath();
  const logoWidth = 65;
  const logoHeight = 70;

  if (logoPath) {
    try {
      doc.image(logoPath, margin, currentY, { fit: [logoWidth, logoHeight], align: 'center' });
    } catch (_) { }
  }

  const headerTextX = logoPath ? margin + logoWidth + 16 : margin;
  const headerRightWidth = 160;
  
  // Brand Name
  doc.font('Times-Bold')
     .fontSize(22)
     .fillColor(COLOR_BURGUNDY)
     .text('MIRAYA BY GARIMA', headerTextX, currentY + 4, { characterSpacing: 1.5 });

  // Tagline
  doc.font('Helvetica')
     .fontSize(8)
     .fillColor(COLOR_GOLD)
     .text('HAUTE COUTURE & LUXURY TROUSSEAU ATELIER', headerTextX, currentY + 28, { characterSpacing: 1 });

  // Boutique Address & Tax Details
  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor(COLOR_MUTED)
     .text('Flagship Atelier: Shop no. UG/5, Jagat Plaza, Law College Square, Nagpur, MH 440033', headerTextX, currentY + 44)
     .text('GSTIN: 27AABCM9876Q1Z5  |  State: 27 (Maharashtra)  |  Ph: +91 92712 18156', headerTextX, currentY + 54)
     .text('Web: www.mirayabygarima.com  |  Email: mirayabygarima@gmail.com', headerTextX, currentY + 64);

  // Official Tax Invoice Badge
  const rightBoxX = pageWidth - margin - headerRightWidth;
  doc.roundedRect(rightBoxX, currentY, headerRightWidth, 18, 9).fill(COLOR_BURGUNDY);

  doc.font('Helvetica-Bold')
     .fontSize(8.5)
     .fillColor('#ffffff')
     .text('OFFICIAL TAX INVOICE', rightBoxX, currentY + 5, { width: headerRightWidth, align: 'center', characterSpacing: 0.5 });

  // Invoice Metadata
  const orderDateStr = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const invoiceNo = `INV-MRY-${String(order.id).padStart(5, '0')}`;
  const paymentRefStr = order.payment_id || (order.payment_method === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PREPAID');

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_DARK)
     .text(`Invoice No:`, rightBoxX, currentY + 28, { width: 60, align: 'left' })
     .fillColor(COLOR_BURGUNDY).text(invoiceNo, rightBoxX + 60, currentY + 28, { width: headerRightWidth - 60, align: 'right' });

  doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED)
     .text(`Invoice Date:`, rightBoxX, currentY + 40, { width: 70, align: 'left' })
     .fillColor(COLOR_DARK).text(orderDateStr, rightBoxX + 70, currentY + 40, { width: headerRightWidth - 70, align: 'right' })
     
     .fillColor(COLOR_MUTED).text(`Order Reference:`, rightBoxX, currentY + 52, { width: 80, align: 'left' })
     .fillColor(COLOR_DARK).text(`#ORD-${order.id}`, rightBoxX + 80, currentY + 52, { width: headerRightWidth - 80, align: 'right' })
     
     .fillColor(COLOR_MUTED).text(`Payment Ref:`, rightBoxX, currentY + 64, { width: 70, align: 'left' })
     .fillColor(COLOR_DARK).text(paymentRefStr.slice(0, 20), rightBoxX + 70, currentY + 64, { width: headerRightWidth - 70, align: 'right' });

  currentY += 85;

  // Gold Divider
  doc.rect(margin, currentY, contentWidth, 0.5).fill(COLOR_GOLD);
  currentY += 15;

  // ─── 2. BILLED TO & SHIPPED TO CARDS ───────────────────────────────────────
  const cardGap = 16;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 88;

  let billObj = order.billingDetails;
  if (typeof billObj === 'string') {
    try { billObj = JSON.parse(billObj); } catch(_) { billObj = {}; }
  }
  billObj = billObj || {};

  let shipObj = order.shippingDetails;
  if (typeof shipObj === 'string') {
    try { shipObj = JSON.parse(shipObj); } catch(_) { shipObj = {}; }
  }
  shipObj = shipObj || {};

  const customerName = billObj.fullName || order.shipping_name || 'Valued Client';
  const customerEmail = billObj.email || order.shipping_email || shipObj.email || 'N/A';
  const customerPhone = billObj.phone || order.shipping_phone || 'N/A';
  const billAddress = billObj.addressString || (billObj.line1 ? `${billObj.line1}, ${billObj.city || ''} ${billObj.pincode || ''}` : '') || order.shipping_address || 'Nagpur Flagship Boutique Atelier';
  const billGstin = billObj.gstin ? `  |  GSTIN: ${billObj.gstin}` : '';

  const shipName = shipObj.fullName || order.shipping_name || customerName;
  const shipPhone = shipObj.phone || order.shipping_phone || customerPhone;
  const shipAddress = order.shipping_address || shipObj.addressString || (shipObj.line1 ? `${shipObj.line1}, ${shipObj.city || ''} ${shipObj.pincode || ''}` : '') || 'Nagpur Flagship Boutique Dispatch';
  const shipCityState = [shipObj.city || order.shipping_city, shipObj.state || order.shipping_state, shipObj.pincode || order.shipping_pincode].filter(Boolean).join(', ') || 'Nagpur, Maharashtra 440033';

  // Card drawing helper
  const drawAddressCard = (x, y, title, name, address, line3, line4) => {
    doc.roundedRect(x, y, cardWidth, cardHeight, 6).fillAndStroke(COLOR_CARD_BG, COLOR_GOLD_LIGHT);
    doc.font('Times-Bold').fontSize(8.5).fillColor(COLOR_BURGUNDY).text(title, x + 12, y + 12, { characterSpacing: 0.5 });
    doc.rect(x + 12, y + 24, 25, 0.5).fill(COLOR_GOLD); // Tiny accent line
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_DARK).text(name, x + 12, y + 32);
    doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED)
       .text(address.slice(0, 60), x + 12, y + 46, { width: cardWidth - 24, height: 12 })
       .text(line3, x + 12, y + 59, { width: cardWidth - 24 })
       .text(line4, x + 12, y + 71, { width: cardWidth - 24 });
  };

  drawAddressCard(margin, currentY, 'BILLED TO', customerName, `Address: ${billAddress}`, `Email: ${customerEmail}${billGstin}`, `Phone: +91 ${customerPhone.replace(/[^\d]/g, '')}  |  Place of Supply: ${billObj.state || order.shipping_state || 'Maharashtra'} (27)`);
  
  const rightCardX = margin + cardWidth + cardGap;
  drawAddressCard(rightCardX, currentY, 'SHIPPED TO', shipName, `Address: ${shipAddress}`, `City/State: ${shipCityState}`, `Delivery Contact: +91 ${shipPhone.replace(/[^\d]/g, '')}`);

  currentY += cardHeight + 20;

  // ─── 3. ITEM SPECIFICATION TABLE ───────────────────────────────────────────
  const colX = {
    sno: margin + 8,
    desc: margin + 36,
    hsn: margin + 225,
    size: margin + 270,
    qty: margin + 330,
    rate: margin + 375,
    amount: margin + 445
  };

  doc.rect(margin, currentY, contentWidth, 24).fill(COLOR_BURGUNDY);

  doc.font('Times-Bold').fontSize(8).fillColor('#ffffff')
     .text('S.NO', colX.sno, currentY + 8)
     .text('ITEM & DESIGN SPECIFICATION', colX.desc, currentY + 8)
     .text('HSN', colX.hsn, currentY + 8)
     .text('SIZE / SKU', colX.size, currentY + 8)
     .text('QTY', colX.qty, currentY + 8, { width: 35, align: 'center' })
     .text('RATE (INR)', colX.rate, currentY + 8, { width: 60, align: 'right' })
     .text('AMOUNT (INR)', colX.amount, currentY + 8, { width: 70, align: 'right' });

  currentY += 24;

  const items = order.items && order.items.length > 0 ? order.items : [
    { product: { name: 'Handcrafted Bespoke Garment' }, size: 'Free Size', quantity: 1, price_at_purchase: order.total }
  ];

  items.forEach((item, index) => {
    const rowHeight = 28;
    // Row background
    doc.rect(margin, currentY, contentWidth, rowHeight).fill(index % 2 === 0 ? COLOR_CARD_BG : COLOR_BASE);

    const unitPrice = Number(item.price_at_purchase || item.price || 0);
    const qty = Number(item.quantity || 1);
    const itemTotal = unitPrice * qty;
    const productName = item.product?.name || item.name || item.title || 'Haute Couture Ensemble';
    const itemSizeSku = item.sku_snapshot || (item.variant && item.variant.sku) || `${item.size || 'M'}`;

    doc.font('Helvetica').fontSize(8).fillColor(COLOR_DARK);
    doc.text(String(index + 1).padStart(2, '0'), colX.sno, currentY + 9);
    doc.font('Helvetica-Bold').text(productName.slice(0, 38), colX.desc, currentY + 9);
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('6204', colX.hsn, currentY + 9);
    doc.text(itemSizeSku.slice(0, 12), colX.size, currentY + 9);
    doc.fillColor(COLOR_DARK).text(String(qty), colX.qty, currentY + 9, { width: 35, align: 'center' });
    doc.text(unitPrice.toLocaleString('en-IN'), colX.rate, currentY + 9, { width: 60, align: 'right' });
    doc.font('Helvetica-Bold').text(itemTotal.toLocaleString('en-IN'), colX.amount, currentY + 9, { width: 70, align: 'right' });

    doc.rect(margin, currentY + rowHeight - 0.5, contentWidth, 0.5).fill(COLOR_GOLD_LIGHT);
    currentY += rowHeight;
  });

  currentY += 20;

  // ─── 4. SUMMARY & TOTALS ───────────────────────────────────────────────────
  const subtotal = Number(order.total || 0);
  const discountAmount = Number(order.discount || 0);
  const gstEstimated = Math.round((subtotal * 18) / 118);
  const netTaxable = subtotal - gstEstimated;
  const isInterstate = (order.shipping_state || '').toLowerCase().trim() !== 'maharashtra' && (order.shipping_state || '').toLowerCase().trim() !== 'mh' && Boolean(order.shipping_state);

  const summaryWidth = 220;
  const summaryX = pageWidth - margin - summaryWidth;

  // Payment Status Card (Left Side)
  const isPaid = (order.status || '').toLowerCase() !== 'cancelled' && (
    Boolean(order.payment_id && order.payment_id !== 'COD' && order.payment_id !== 'CASH_ON_DELIVERY') ||
    Boolean(order.razorpay_order_id) ||
    (Array.isArray(order.payments) && order.payments.some(p => p.status === 'PAID' || p.gateway === 'RAZORPAY')) ||
    String(order.payment_method || '').toLowerCase().includes('online') ||
    String(order.payment_method || '').toLowerCase().includes('razorpay')
  );
  const isCancelled = (order.status || '').toLowerCase() === 'cancelled';

  const stampColor = isCancelled ? '#A94442' : (isPaid ? '#2E7D32' : '#B7791F');
  const stampBg = isCancelled ? '#F2DEDE' : (isPaid ? '#E8F5E9' : '#FEFCBF');
  const stampTitle = isCancelled ? 'CANCELLED' : (isPaid ? 'PAYMENT CONFIRMED & VERIFIED' : 'COD - PAYMENT PENDING');
  const methodStr = isPaid ? 'Razorpay Online (Prepaid)' : (order.payment_method?.toUpperCase() || 'CASH ON DELIVERY');
  const refStr = (order.payment_id && order.payment_id !== 'COD') ? order.payment_id : (order.transaction_id || (order.payments && order.payments[0]?.gateway_payment_id) || 'COD-VERIFICATION-PENDING');

  doc.roundedRect(margin, currentY, 240, 85, 6).fillAndStroke(stampBg, stampColor);
  
  doc.font('Times-Bold').fontSize(8.5).fillColor(stampColor).text(stampTitle, margin + 12, currentY + 12);
  doc.rect(margin + 12, currentY + 24, 30, 0.5).fill(stampColor);
  
  doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_DARK)
     .text(`Payment Mode:`, margin + 12, currentY + 34, { continued: true }).fillColor(COLOR_MUTED).text(` ${methodStr}`)
     .fillColor(COLOR_DARK).text(`Transaction Ref:`, margin + 12, currentY + 46, { continued: true }).fillColor(COLOR_MUTED).text(` ${refStr.slice(0, 24)}`)
     .fillColor(COLOR_DARK).text(`GST Compliance:`, margin + 12, currentY + 58, { continued: true }).fillColor(COLOR_MUTED).text(` 18% Inclusive Tax`)
     .fillColor(COLOR_DARK).text(`Order Status:`, margin + 12, currentY + 70, { continued: true }).fillColor(COLOR_MUTED).text(` ${(order.status || 'PROCESSING').toUpperCase()}`);

  // Calculation Breakdown (Right Side)
  const drawSummaryRow = (label, value, isBold = false, isHighlight = false) => {
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor(isHighlight ? COLOR_BURGUNDY : (isBold ? COLOR_DARK : COLOR_MUTED));
    doc.text(label, summaryX, currentY);
    doc.text(value, summaryX, currentY, { width: summaryWidth, align: 'right' });
    currentY += 14;
  };

  drawSummaryRow('Taxable Base Value:', `Rs. ${netTaxable.toLocaleString('en-IN')}`);
  if (isInterstate) {
    drawSummaryRow('IGST (18% Integrated):', `Rs. ${gstEstimated.toLocaleString('en-IN')}`);
  } else {
    const halfGst = Math.round(gstEstimated / 2);
    drawSummaryRow('CGST (9% Central):', `Rs. ${halfGst.toLocaleString('en-IN')}`);
    drawSummaryRow('SGST (9% State):', `Rs. ${halfGst.toLocaleString('en-IN')}`);
  }
  drawSummaryRow('Total GST (Included):', `Rs. ${gstEstimated.toLocaleString('en-IN')}`, false, true);

  if (discountAmount > 0) {
    doc.font('Helvetica').fontSize(8.5).fillColor('#2E7D32').text('Privilege Promo Discount:', summaryX, currentY);
    doc.font('Helvetica-Bold').text(`- Rs. ${discountAmount.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
    currentY += 14;
  }

  doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_MUTED).text('Packaging & Shipping:', summaryX, currentY);
  doc.font('Helvetica-Bold').fillColor('#2E7D32').text('COMPLIMENTARY', summaryX, currentY, { width: summaryWidth, align: 'right' });
  currentY += 18;

  // Grand Total Highlight Bar
  doc.roundedRect(summaryX, currentY, summaryWidth, 26, 4).fill(COLOR_BURGUNDY);
  doc.font('Times-Bold').fontSize(10).fillColor('#ffffff');
  doc.text('TOTAL INVOICE VALUE', summaryX + 12, currentY + 8);
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, summaryX, currentY + 8, { width: summaryWidth - 12, align: 'right' });

  // ─── 5. FOOTER & CERTIFICATION ─────────────────────────────────────────────
  currentY = pageHeight - margin - 70;

  // Terms & Conditions
  doc.font('Times-Bold').fontSize(9).fillColor(COLOR_BURGUNDY).text('BOUTIQUE TERMS & CARE INSTRUCTIONS', margin, currentY);
  doc.rect(margin, currentY + 12, 20, 0.5).fill(COLOR_GOLD);
  
  doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED);
  doc.text('1. All handcrafted couture ensembles are tailored with bespoke artistry. Professional Dry Clean Only.', margin, currentY + 18);
  doc.text('2. Alteration and fitment requests are honored within 7 days of delivery at our Nagpur atelier.', margin, currentY + 28);
  doc.text('3. This document serves as an authentic Computer-Generated Tax Invoice under Indian GST regulations.', margin, currentY + 38);

  // Digital Signatory Seal Box
  const sealWidth = 180;
  const sealX = pageWidth - margin - sealWidth;
  doc.roundedRect(sealX, currentY, sealWidth, 54, 6).fillAndStroke(COLOR_CARD_BG, COLOR_GOLD_LIGHT);

  doc.font('Times-Bold').fontSize(8.5).fillColor(COLOR_BURGUNDY).text('FOR MIRAYA BY GARIMA', sealX, currentY + 12, { width: sealWidth, align: 'center' });
  doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED).text('Digitally Certified & Approved', sealX, currentY + 24, { width: sealWidth, align: 'center' });
  
  doc.rect(sealX + 30, currentY + 36, sealWidth - 60, 0.5).fill(COLOR_GOLD_LIGHT);
  doc.font('Times-Roman').fontSize(7.5).fillColor(COLOR_GOLD).text('OFFICIAL DIGITAL ATELIER SEAL', sealX, currentY + 41, { width: sealWidth, align: 'center' });

  doc.end();
};
