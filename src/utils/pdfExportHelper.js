import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Haute Couture Luxury Brand Colors (RGB)
const BURGUNDY = [94, 10, 11];     // #5e0a0b
const GOLD = [198, 164, 106];      // #c6a46a
const DARK = [26, 26, 26];         // #1a1a1a
const CREAM = [250, 248, 245];     // #FAF8F5
const BORDER = [230, 216, 195];    // #e6d8c3
const MUTED = [90, 90, 90];        // #5a5a5a
const GREEN = [39, 174, 96];       // #27ae60
const RED = [197, 34, 31];         // #c5221f
const AMBER = [211, 84, 0];        // #d35400
const BLUE = [41, 128, 185];       // #2980b9

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0).replace('₹', 'Rs. ');
};

/**
 * Draw Haute Couture Header Banner (Guaranteed Clean ASCII & Zero Overlap)
 */
const drawHeader = (doc, title, subtitle = 'HAUTE COUTURE & LUXURY BRIDAL APPAREL', isLandscape = false) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Luxury Burgundy & Gold accent bar
  doc.setFillColor(...BURGUNDY);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BURGUNDY);
  doc.text('MIRAYA BY GARIMA', pageWidth / 2, 16.5, { align: 'center' });

  // Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text(subtitle.toUpperCase(), pageWidth / 2, 21.5, { align: 'center' });

  // Address, GSTIN, and Contact
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(
    'Shop no. UG/5, Jagat Plaza, Law College Sq., Amravati Rd, Nagpur, Maharashtra - 440033 | GSTIN: 27AABCM9876Q1Z5 | Ph: +91 92712 18156',
    pageWidth / 2,
    26,
    { align: 'center' }
  );

  // Divider line
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.line(14, 29, pageWidth - 14, 29);

  // Title Banner Box (Spacious 12mm box with two dedicated lines to prevent any text overlap)
  doc.setFillColor(...CREAM);
  doc.roundedRect(14, 31.5, pageWidth - 28, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(...BORDER);
  doc.roundedRect(14, 31.5, pageWidth - 28, 12, 1.5, 1.5, 'D');

  // Line 1: Report Title (Clean ASCII, bold burgundy)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BURGUNDY);
  doc.text(title.toUpperCase(), 18, 36.5);

  // Line 2: Audit metadata
  const dateStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(`Generated: ${dateStr}   |   Scope: Nagpur Flagship Atelier   |   Status: Verified Active`, 18, 41);

  return 47; // Safe Y position for next elements
};

/**
 * Draw Metric KPI Cards
 */
const drawKpiCards = (doc, startY, cards) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 3.5;
  const cardWidth = (pageWidth - (margin * 2) - (gap * (cards.length - 1))) / cards.length;
  const cardHeight = 16.5;

  cards.forEach((card, idx) => {
    const x = margin + idx * (cardWidth + gap);

    // Card background
    doc.setFillColor(...CREAM);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(...BORDER);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'D');

    // Top accent border for card
    const accentColor = card.color || BURGUNDY;
    doc.setFillColor(...accentColor);
    doc.rect(x, startY, cardWidth, 1.5, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(card.label.toUpperCase(), x + 3.5, startY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...(card.valColor || BURGUNDY));
    doc.text(String(card.value), x + 3.5, startY + 11.5);

    // Subtitle note
    if (card.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(...MUTED);
      doc.text(card.sub, x + 3.5, startY + 15);
    }
  });

  return startY + cardHeight + 6;
};

/**
 * Draw Footer with Page Numbers & Confidential Atelier Seal
 */
const drawFooter = (doc) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(
      'Miraya by Garima Executive Record | HSN: 6204 | GSTIN: 27AABCM9876Q1Z5 | mirayaofficial.in@gmail.com | +91 92712 18156',
      14,
      pageHeight - 8.5
    );

    doc.setFont('helvetica', 'bold');
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8.5,
      { align: 'right' }
    );
  }
};

/**
 * 1. DIRECT PDF DOWNLOAD: EXECUTIVE STORE AUDIT REPORT (DETAILED)
 */
export const exportStoreAuditPDF = ({ dashboard = {}, orders = [], products = [] }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const startY = drawHeader(doc, 'Executive Store Audit & Comprehensive Ledger');

  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = dashboard.revenue ?? validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrders = orders.length || dashboard.orders || 0;
  const totalProducts = products.length || dashboard.products || 0;
  const lowStockCount = dashboard.lowStock || 0;

  // Financial and Tax breakdowns
  const gstCollected = Math.round((totalRevenue * 12) / 112);
  const netTaxableRevenue = totalRevenue - gstCollected;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Payment Breakdown
  const checkIsOrderPaid = (o) => {
    if (!o) return false;
    if (String(o.payment_status || '').toLowerCase() === 'paid') return true;
    if (String(o.payment_method || '').toLowerCase().includes('razorpay') || String(o.payment_method || '').toLowerCase().includes('online')) return true;
    if (o.payment_id && o.payment_id !== 'COD' && o.payment_id !== 'CASH_ON_DELIVERY') return true;
    if (o.razorpay_order_id) return true;
    if (Array.isArray(o.payments) && o.payments.some(p => p.status === 'PAID' || p.gateway === 'RAZORPAY')) return true;
    return false;
  };

  const onlineOrders = orders.filter(o => checkIsOrderPaid(o));
  const codOrders = orders.filter(o => !checkIsOrderPaid(o));
  const onlineRevenue = onlineOrders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum, 0);
  const codRevenue = codOrders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum, 0);

  // Total Inventory units & valuation
  let totalInventoryUnits = 0;
  let totalInventoryValuation = 0;
  products.forEach(p => {
    const stock = Number(p?.stock ?? 0);
    const price = Number(p?.price ?? 0);
    totalInventoryUnits += stock;
    totalInventoryValuation += stock * price;
  });

  const kpis = [
    { label: 'Gross Revenue', value: formatINR(totalRevenue), color: GOLD, sub: `Net: ${formatINR(netTaxableRevenue)}` },
    { label: 'Total Orders', value: totalOrders, color: BURGUNDY, sub: `Avg Order: ${formatINR(avgOrderValue)}` },
    { label: 'GST (12%)', value: formatINR(gstCollected), color: BLUE, sub: 'CGST 6% + SGST 6%' },
    { label: 'Catalog Stock', value: `${totalInventoryUnits} Pcs`, color: GREEN, sub: `${totalProducts} Unique Garments` },
    { label: 'Low Stock Alerts', value: lowStockCount, color: lowStockCount > 0 ? RED : GREEN, valColor: lowStockCount > 0 ? RED : GREEN, sub: lowStockCount > 0 ? 'Restock Required' : 'Optimal Stock' }
  ];

  const tableStartY = drawKpiCards(doc, startY, kpis);

  // SECTION 1: STORE ORDERS LEDGER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BURGUNDY);
  doc.text(`1. STORE ORDERS & TRANSACTION LEDGER (${orders.length} Records | Online: ${formatINR(onlineRevenue)} | COD: ${formatINR(codRevenue)})`, 14, tableStartY + 1);

  const orderRows = orders.slice(0, 100).map((o, idx) => {
    const custName = o?.user?.name || o?.shipping_name || o?.customer_name || 'Valued Client';
    const phone = o?.user?.phone || o?.shipping_phone || o?.phone || 'N/A';
    const city = o?.shipping_city ? `${o.shipping_city}, ${o.shipping_state || ''}` : 'Nagpur Atelier';
    const invoiceNo = `INV-MRY-${String(o?.id || idx + 1).padStart(5, '0')}`;

    let itemsSummary = 'Haute Couture Garment';
    try {
      let parsed = o?.items;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        itemsSummary = parsed.map((it) => `${it?.product?.name || it?.product?.title || it?.name || it?.title || 'Garment'} [Sz: ${it?.variant?.size || it?.size || 'M'}, Qty: ${it?.quantity || 1}]`).join('\n');
      }
    } catch (_) {
      itemsSummary = 'Haute Couture Garment';
    }

    const totalAmt = Number(o?.total || o?.total_amount || 0);
    const taxAmt = Math.round((totalAmt * 12) / 112);
    const netAmt = totalAmt - taxAmt;

    const statusText = String(o?.status || 'Pending').toUpperCase();
    const isPaid = checkIsOrderPaid(o);
    const paymentText = `${o?.payment_method ? String(o.payment_method).toUpperCase() : (isPaid ? 'RAZORPAY' : 'COD')}\n(${isPaid ? 'PAID' : 'PENDING'})`;
    const orderDate = o?.created_at || o?.createdAt ? new Date(o.created_at || o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

    return [
      `#MRY-${o?.id || idx + 1}\n${invoiceNo}`,
      `${custName}\n${phone}\n${city}`,
      itemsSummary,
      `${formatINR(netAmt)}\n+GST ${formatINR(taxAmt)}`,
      paymentText,
      statusText,
      formatINR(totalAmt),
      orderDate
    ];
  });

  autoTable(doc, {
    startY: tableStartY + 3.5,
    head: [['Order & Inv #', 'Customer & Contact', 'Garment Pieces & Sizes', 'Taxable + GST', 'Payment', 'Status', 'Total', 'Date & Time']],
    body: orderRows.length > 0 ? orderRows : [['N/A', 'No orders recorded yet.', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']],
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 2,
      textColor: DARK,
      lineColor: BORDER
    },
    alternateRowStyles: {
      fillColor: CREAM
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', textColor: BURGUNDY },
      1: { cellWidth: 32 },
      2: { cellWidth: 46 },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 16, halign: 'right', fontStyle: 'bold', textColor: BURGUNDY },
      7: { cellWidth: 14, halign: 'right', fontSize: 5.5 }
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(...BURGUNDY);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 3, 'F');
      }
    }
  });

  // SECTION 2: LIVE CATALOG & STOCK VALUATION LEDGER
  if (products.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 8;
    const pageHeight = doc.internal.pageSize.getHeight();

    if (finalY < pageHeight - 45) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...BURGUNDY);
      doc.text(`2. CATALOG & INVENTORY VALUATION LEDGER (${products.length} Garments | Asset Valuation: ${formatINR(totalInventoryValuation)})`, 14, finalY);

      const prodRows = products.slice(0, 40).map((p, idx) => {
        const stock = Number(p?.stock !== undefined ? p.stock : (Array.isArray(p?.variants) ? p.variants.reduce((acc, v) => acc + (Number(v?.stock) || 0), 0) : 0));
        const price = Number(p?.price || 0);
        const valuation = stock * price;

        let statusText = 'IN STOCK';
        if (stock <= 0) statusText = 'OUT OF STOCK';
        else if (stock <= 5) statusText = 'LOW STOCK';

        // Size breakdown snapshot if available
        let sizesSnapshot = 'Standard';
        if (Array.isArray(p?.variants) && p.variants.length > 0) {
          sizesSnapshot = p.variants.map(v => `${v.size || 'M'}:${v.stock ?? 0}`).join(' | ');
        } else if (Array.isArray(p?.sizes)) {
          sizesSnapshot = p.sizes.join(', ');
        }

        return [
          idx + 1,
          p?.title || p?.name || 'Garment Piece',
          p?.sku || `SKU-MRY-${String(p?.id || idx + 1).padStart(4, '0')}`,
          String(p?.category?.name || p?.category || 'Couture').toUpperCase(),
          sizesSnapshot,
          formatINR(price),
          `${stock} Units`,
          formatINR(valuation),
          statusText
        ];
      });

      autoTable(doc, {
        startY: finalY + 3,
        head: [['#', 'Garment Name', 'SKU', 'Category', 'Size Breakdown', 'Unit Price', 'Stock', 'Asset Value', 'Status']],
        body: prodRows,
        theme: 'grid',
        headStyles: {
          fillColor: BURGUNDY,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 6.5,
          cellPadding: 2,
          textColor: DARK,
          lineColor: BORDER
        },
        alternateRowStyles: {
          fillColor: CREAM
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 28 },
          5: { cellWidth: 16, halign: 'right' },
          6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
          7: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: BURGUNDY },
          8: { cellWidth: 16, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14, bottom: 18 }
      });
    }
  }

  drawFooter(doc);

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Miraya_Executive_Audit_Report_${fileDate}.pdf`);
};

/**
 * 2. DIRECT PDF DOWNLOAD: ORDERS & REVENUE LEDGER (DETAILED LANDSCAPE/PORTRAIT)
 */
export const exportOrdersPDF = (orders = [], activeFilter = 'All') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const startY = drawHeader(doc, `Official Orders & Revenue Tax Ledger (${activeFilter.toUpperCase()})`, 'HAUTE COUTURE & LUXURY BRIDAL APPAREL', true);

  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum, 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const gstCollected = Math.round((totalRevenue * 12) / 112);
  const netTaxable = totalRevenue - gstCollected;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const kpis = [
    { label: 'Total Gross Revenue', value: formatINR(totalRevenue), color: GOLD, sub: `Net: ${formatINR(netTaxable)}` },
    { label: 'GST Collected (12%)', value: formatINR(gstCollected), color: BLUE, sub: 'CGST 6% + SGST 6%' },
    { label: 'Total Orders', value: totalOrders, color: BURGUNDY, sub: `Avg Order: ${formatINR(avgOrderValue)}` },
    { label: 'Fulfilled / Delivered', value: deliveredOrders, color: GREEN, sub: `${Math.round((deliveredOrders / (totalOrders || 1)) * 100)}% Fulfillment` },
    { label: 'Pending Processing', value: pendingOrders, color: AMBER, sub: 'Needs Dispatch' }
  ];

  const tableStartY = drawKpiCards(doc, startY, kpis);

  const tableRows = orders.map((o, idx) => {
    const custName = o?.user?.name || o?.shipping_name || 'Customer';
    const phone = o?.shipping_phone || o?.user?.phone || 'N/A';
    const email = o?.user?.email || o?.shippingDetails?.email || 'N/A';
    const address = `${o?.shipping_address || ''} ${o?.shipping_city ? `${o.shipping_city}, ${o.shipping_state || ''}` : 'Nagpur'} ${o?.shipping_pincode || ''}`.trim();
    const invoiceNo = `INV-MRY-${String(o?.id || idx + 1).padStart(5, '0')}`;

    let itemsDetail = 'Garment Piece';
    try {
      let parsed = o?.items;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        itemsDetail = parsed.map(it => `${it.product?.name || it.title || 'Outfit'} [Size: ${it.variant?.size || it.size || 'M'}, Qty: ${it.quantity || 1}]`).join('\n');
      }
    } catch (_) {
      itemsDetail = 'Garment Piece';
    }

    const subtotal = Number(o.total || 0);
    const gst = Math.round((subtotal * 12) / 112);
    const net = subtotal - gst;
    const isPaid = (String(o?.payment_status || '').toLowerCase() === 'paid') || Boolean(o?.payment_id && o?.payment_id !== 'COD' && o?.payment_id !== 'CASH_ON_DELIVERY') || (Array.isArray(o?.payments) && o.payments.some(p => p.status === 'PAID' || p.gateway === 'RAZORPAY'));
    const statusText = (o.status || 'Pending').toUpperCase();
    const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

    return [
      `#ORD-${o.id}\n${invoiceNo}`,
      dateStr,
      `${custName}\n${phone}\n${email}`,
      address,
      itemsDetail,
      `${formatINR(net)}\n+GST ${formatINR(gst)}`,
      formatINR(subtotal),
      o.payment_method || (isPaid ? 'Razorpay Online' : 'COD'),
      isPaid ? 'PAID' : 'COD PENDING',
      statusText
    ];
  });

  autoTable(doc, {
    startY: tableStartY + 2,
    head: [['Order & Inv #', 'Date & Time', 'Customer Details', 'Shipping Destination', 'Garment Pieces & Sizes', 'Net + GST (12%)', 'Gross Total', 'Payment Mode', 'Pay Status', 'Status']],
    body: tableRows.length > 0 ? tableRows : [['N/A', 'N/A', 'No orders found matching filter.', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']],
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 2,
      textColor: DARK,
      lineColor: BORDER
    },
    alternateRowStyles: {
      fillColor: CREAM
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold', textColor: BURGUNDY },
      1: { cellWidth: 24, fontSize: 6 },
      2: { cellWidth: 38 },
      3: { cellWidth: 42 },
      4: { cellWidth: 55 },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: BURGUNDY },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  drawFooter(doc);

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Miraya_Orders_Tax_Ledger_${fileDate}.pdf`);
};

/**
 * 3. DIRECT PDF DOWNLOAD: INVENTORY STOCK VALUATION LEDGER (DETAILED)
 */
export const exportInventoryPDF = (variants = [], activeFilter = 'All') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const startY = drawHeader(doc, `Live Inventory Stock Valuation Ledger (${activeFilter.toUpperCase()})`, 'HAUTE COUTURE & LUXURY BRIDAL APPAREL', true);

  const totalStockCount = variants.reduce((acc, v) => acc + Number(v.physical_stock ?? v.stock ?? 0), 0);
  const totalValuation = variants.reduce((acc, v) => acc + (Number(v.physical_stock ?? v.stock ?? 0) * Number(v.price || v.product?.price || 0)), 0);
  const lowStockCount = variants.filter(v => (v.physical_stock ?? v.stock ?? 0) > 0 && (v.physical_stock ?? v.stock ?? 0) <= 5).length;
  const outOfStockCount = variants.filter(v => (v.physical_stock ?? v.stock ?? 0) <= 0).length;

  const kpis = [
    { label: 'Total Asset Valuation', value: formatINR(totalValuation), color: GOLD, sub: 'Current Retail Value' },
    { label: 'Total Units On Hand', value: `${totalStockCount} Units`, color: BURGUNDY, sub: `${variants.length} Tracked SKUs` },
    { label: 'Low Stock SKUs (<=5)', value: lowStockCount, color: lowStockCount > 0 ? RED : GREEN, valColor: lowStockCount > 0 ? RED : GREEN, sub: 'Immediate Restock Needed' },
    { label: 'Out of Stock SKUs', value: outOfStockCount, color: outOfStockCount > 0 ? RED : GREEN, valColor: outOfStockCount > 0 ? RED : GREEN, sub: 'Zero Stock Left' }
  ];

  const tableStartY = drawKpiCards(doc, startY, kpis);

  const tableRows = variants.map((v, idx) => {
    const stock = Number(v.physical_stock ?? v.stock ?? 0);
    const price = Number(v.price || v.product?.price || 0);
    const val = stock * price;

    let statusText = 'IN STOCK';
    if (stock <= 0) statusText = 'OUT OF STOCK';
    else if (stock <= 5) statusText = 'LOW STOCK';

    return [
      idx + 1,
      v.product_name || v.name || 'Haute Couture Outfit',
      v.sku || `SKU-MRY-${String(idx + 1).padStart(5, '0')}`,
      v.barcode || v.sku || 'N/A',
      v.category || v.product?.category?.name || 'Couture',
      v.size || 'Free Size',
      v.color || 'Standard',
      formatINR(price),
      `${stock} Pcs`,
      formatINR(val),
      statusText
    ];
  });

  autoTable(doc, {
    startY: tableStartY + 2,
    head: [['#', 'Garment Name', 'SKU Code', 'Barcode', 'Category', 'Size', 'Color', 'Unit Price', 'Stock Qty', 'Total Asset Value', 'Stock Status']],
    body: tableRows.length > 0 ? tableRows : [['N/A', 'N/A', 'No inventory records found.', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']],
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 2,
      textColor: DARK,
      lineColor: BORDER
    },
    alternateRowStyles: {
      fillColor: CREAM
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 28 },
      4: { cellWidth: 26 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 20 },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: BURGUNDY },
      10: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  drawFooter(doc);

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Miraya_Inventory_Valuation_${fileDate}.pdf`);
};

/**
 * 4. DIRECT PDF DOWNLOAD: VIP CUSTOMER DIRECTORY (DETAILED)
 */
export const exportCustomersPDF = (customers = []) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const startY = drawHeader(doc, 'VIP Clientele & Customer Intelligence Directory');

  const totalClients = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spend ?? c.totalSpend ?? 0), 0);
  const totalOrdersPlaced = customers.reduce((sum, c) => sum + Number(c.total_orders ?? c.totalOrders ?? 0), 0);
  const avgSpend = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;

  const kpis = [
    { label: 'Lifetime Client Spend', value: formatINR(totalRevenue), color: GOLD, sub: 'Total Store Order Value' },
    { label: 'Total Registered Clients', value: totalClients, color: BURGUNDY, sub: 'Active Profiles' },
    { label: 'Total Orders Placed', value: totalOrdersPlaced, color: GREEN, sub: `${(totalOrdersPlaced / (totalClients || 1)).toFixed(1)} Orders / Client` },
    { label: 'Avg Client Lifetime Value', value: formatINR(avgSpend), color: GOLD, sub: 'LTV Benchmark' }
  ];

  const tableStartY = drawKpiCards(doc, startY, kpis);

  const tableRows = customers.map((c, idx) => {
    const ordersCount = Number(c.total_orders ?? c.totalOrders ?? 0);
    const spend = Number(c.total_spend ?? c.totalSpend ?? 0);
    const avgPerOrder = ordersCount > 0 ? Math.round(spend / ordersCount) : 0;
    const dateJoined = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    return [
      idx + 1,
      c.name || 'Valued Client',
      c.email || 'N/A',
      c.phone || 'N/A',
      (c.type || 'CUSTOMER').toUpperCase(),
      ordersCount,
      formatINR(spend),
      formatINR(avgPerOrder),
      dateJoined
    ];
  });

  autoTable(doc, {
    startY: tableStartY + 2,
    head: [['#', 'Client Name', 'Email Address', 'Phone Number', 'Account Type', 'Orders', 'Lifetime Spend', 'Avg / Order', 'Joined Date']],
    body: tableRows.length > 0 ? tableRows : [['N/A', 'No client records found.', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']],
    theme: 'grid',
    headStyles: {
      fillColor: BURGUNDY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 2,
      textColor: DARK,
      lineColor: BORDER
    },
    alternateRowStyles: {
      fillColor: CREAM
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 24 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: BURGUNDY },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 16, halign: 'right' }
    },
    margin: { left: 14, right: 14, bottom: 18 }
  });

  drawFooter(doc);

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`Miraya_VIP_Customer_Directory_${fileDate}.pdf`);
};
