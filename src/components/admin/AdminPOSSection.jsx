import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Search, Plus, Minus, Trash2, Printer, CheckCircle,
  CreditCard, Smartphone, Banknote, User, Phone, Tag, Clock,
  DollarSign, ArrowRight, RefreshCw, X, Receipt, Download, FileText,
  Barcode, Split, ShieldAlert, AlertTriangle
} from 'lucide-react';
import './AdminPOSSection.css';

export default function AdminPOSSection({ token, API_BASE_URL, onRefresh }) {
  // Live Data States
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todaySalesCount: 0,
    todayCash: 0,
    todayUpi: 0,
    todayCard: 0,
  });

  // UI Search & Scanner States
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Cashier Cart & Bill State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [staffName, setStaffName] = useState('Boutique Stylist');

  // Payment Mode
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card' | 'split'
  const [amountTendered, setAmountTendered] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  // Split Payment State
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitUpiAmount, setSplitUpiAmount] = useState('');
  const [splitCardAmount, setSplitCardAmount] = useState('');
  const [splitUpiRef, setSplitUpiRef] = useState('');

  // Print Receipt Modal & Recent Invoices
  const [receiptSale, setReceiptSale] = useState(null);
  const [receiptFormat, setReceiptFormat] = useState('thermal'); // 'thermal' | 'a4'
  const [viewPastInvoicesModal, setViewPastInvoicesModal] = useState(false);

  const barcodeInputRef = useRef(null);

  // Fetch Live Inventory & Sales
  const fetchPosData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [resProds, resSales, resStats] = await Promise.all([
        fetch(`${API_BASE_URL}/api/pos/products`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/pos/sales`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/pos/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (Array.isArray(resProds)) {
        setProducts(resProds);
      } else {
        setProducts([]);
      }

      if (Array.isArray(resSales)) setSales(resSales);
      if (resStats) setStats(resStats);
    } catch (err) {
      console.error('POS fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosData();
  }, []);

  // Barcode Scanner Form Submit
  const handleBarcodeScanSubmit = async (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/pos/scan/${encodeURIComponent(code)}`, { headers });
      const data = await res.json();

      if (res.ok && data.success && data.variant) {
        const v = data.variant;
        if (v.available_stock <= 0) {
          setFeedbackMsg({ type: 'error', text: `Scanned Item "${v.product_name}" (Size: ${v.size}) is OUT OF STOCK!` });
        } else {
          addItemVariantToCart({
            product_id: v.product_id,
            variant_id: v.id,
            name: v.product_name,
            size: v.size,
            sku: v.sku,
            price: Number(v.price),
            availableStock: v.available_stock,
            image_url: v.product_image,
          });
          setFeedbackMsg({ type: 'success', text: `Scanned: ${v.product_name} (${v.size}) added to cart.` });
        }
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || `Barcode "${code}" not found.` });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Error scanning barcode.' });
    } finally {
      setBarcodeInput('');
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }
  };

  // Add Item with specific Variant / Size to Cashier Cart
  const handleAddToCart = (product, variantOrSize) => {
    let variant = null;
    let size = '';
    let availableStock = 0;
    let unitPrice = Number(product.price);
    let sku = '';

    if (typeof variantOrSize === 'object' && variantOrSize.size) {
      variant = variantOrSize;
      size = variant.size;
      sku = variant.sku;
      unitPrice = Number(variant.price || product.price);
      availableStock = Math.max(0, (variant.stock || 0) - (variant.reserved_stock || 0));
    } else {
      size = String(variantOrSize);
      if (product.variants && Array.isArray(product.variants)) {
        variant = product.variants.find(v => v.size.toLowerCase() === size.toLowerCase());
      }
      if (variant) {
        sku = variant.sku;
        unitPrice = Number(variant.price || product.price);
        availableStock = Math.max(0, (variant.stock || 0) - (variant.reserved_stock || 0));
      } else {
        const sizeStockMap = product.size_stock || {};
        availableStock = sizeStockMap[size] !== undefined ? sizeStockMap[size] : product.stock;
      }
    }

    if (availableStock <= 0) {
      setFeedbackMsg({ type: 'error', text: `Size ${size} for "${product.name}" is completely Out of Stock!` });
      return;
    }

    addItemVariantToCart({
      product_id: product.id,
      variant_id: variant?.id || null,
      name: product.name,
      size,
      sku,
      price: unitPrice,
      availableStock,
      image_url: product.image_url,
    });
  };

  const addItemVariantToCart = ({ product_id, variant_id, name, size, sku, price, availableStock, image_url }) => {
    const cartItemId = variant_id ? `V-${variant_id}` : `${product_id}-${size}`;
    const existingIndex = cart.findIndex(it => it.cartItemId === cartItemId);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= availableStock) {
        setFeedbackMsg({ type: 'error', text: `Maximum available store stock for Size ${size} is ${availableStock} units.` });
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          cartItemId,
          product_id,
          variant_id,
          name,
          size,
          sku: sku || `SKU-${product_id}-${size}`,
          price,
          quantity: 1,
          maxStock: availableStock,
          image_url,
        },
      ]);
    }
    setFeedbackMsg({ type: 'success', text: `Added ${name} (Size: ${size}) to register.` });
  };

  // Stepper adjustments
  const updateCartQty = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;

    if (newQty <= 0) {
      updated.splice(index, 1);
    } else if (newQty > updated[index].maxStock) {
      setFeedbackMsg({ type: 'error', text: `Only ${updated[index].maxStock} units physically in stock.` });
      return;
    } else {
      updated[index].quantity = newQty;
    }
    setCart(updated);
  };

  const removeCartItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const discountVal = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const taxVal = Math.max(0, Number(tax) || 0);
  const grandTotal = Math.max(0, subtotal - discountVal + taxVal);

  const changeDue = paymentMode === 'cash' && Number(amountTendered) > grandTotal
    ? Number(amountTendered) - grandTotal
    : 0;

  // Split payment validation
  const splitTotalSum =
    (Number(splitCashAmount) || 0) +
    (Number(splitUpiAmount) || 0) +
    (Number(splitCardAmount) || 0);
  const splitBalance = grandTotal - splitTotalSum;

  // Submit POS Sale
  const handleCompleteSale = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please add at least one outfit to the register.' });
      return;
    }

    // Build payload
    const salePayload = {
      customer_name: customerName.trim() || 'Walk-in Customer',
      customer_phone: customerPhone.trim() || null,
      discount: discountVal,
      tax: taxVal,
      items: cart.map(it => ({
        product_id: it.product_id,
        variant_id: it.variant_id,
        product_name: it.name,
        size: it.size,
        quantity: it.quantity,
        price: it.price,
      })),
    };

    if (paymentMode === 'split') {
      if (Math.abs(splitBalance) > 0.01) {
        setFeedbackMsg({
          type: 'error',
          text: `Split payment totals (₹${splitTotalSum.toFixed(2)}) must equal Grand Total (₹${grandTotal.toFixed(2)}). Balance remaining: ₹${splitBalance.toFixed(2)}`,
        });
        return;
      }

      const splitEntries = [];
      if (Number(splitCashAmount) > 0) splitEntries.push({ method: 'cash', amount: Number(splitCashAmount) });
      if (Number(splitUpiAmount) > 0) splitEntries.push({ method: 'upi', amount: Number(splitUpiAmount), reference: splitUpiRef || 'UPI' });
      if (Number(splitCardAmount) > 0) splitEntries.push({ method: 'card', amount: Number(splitCardAmount) });

      salePayload.payment_method = 'split';
      salePayload.split_payments = splitEntries;
    } else {
      salePayload.payment_method = paymentMode;
      if (paymentMode === 'cash') {
        salePayload.amount_received = amountTendered ? Number(amountTendered) : grandTotal;
      }
      salePayload.payment_reference = paymentRef || null;
    }

    setBillingLoading(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(salePayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error processing POS sale');

      // Success: open receipt modal & clear cart
      setReceiptSale(data.sale);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setDiscount(0);
      setTax(0);
      setAmountTendered('');
      setPaymentRef('');
      setSplitCashAmount('');
      setSplitUpiAmount('');
      setSplitCardAmount('');
      setSplitUpiRef('');

      setFeedbackMsg({ type: 'success', text: `✨ Sale ${data.sale.invoice_number} Completed & Real-time Stock Deducted!` });

      fetchPosData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setBillingLoading(false);
    }
  };

  // Filtered product items
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.id).includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' ||
      (p.category?.name && p.category.name.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadPdf = (saleId) => {
    window.open(`${API_BASE_URL}/api/pos/sales/${saleId}/receipt-pdf`, '_blank');
  };

  return (
    <div className="pos-terminal-wrapper animate-fade">
      {/* ── TOP STATS OVERVIEW CARDS ── */}
      <div className="pos-stats-grid">
        <div className="pos-stat-card gold">
          <div className="stat-icon-wrap"><DollarSign size={20} /></div>
          <div>
            <span className="stat-label">TODAY'S STORE SALES</span>
            <h3 className="stat-value">₹{stats.todayRevenue.toLocaleString('en-IN')}</h3>
            <span className="stat-sub">{stats.todaySalesCount} Invoices Billed</span>
          </div>
        </div>

        <div className="pos-stat-card cash">
          <div className="stat-icon-wrap"><Banknote size={20} /></div>
          <div>
            <span className="stat-label">CASH REGISTER</span>
            <h3 className="stat-value">₹{stats.todayCash.toLocaleString('en-IN')}</h3>
            <span className="stat-sub">Physical Cash Drawer</span>
          </div>
        </div>

        <div className="pos-stat-card upi">
          <div className="stat-icon-wrap"><Smartphone size={20} /></div>
          <div>
            <span className="stat-label">UPI / QR SALES</span>
            <h3 className="stat-value">₹{stats.todayUpi.toLocaleString('en-IN')}</h3>
            <span className="stat-sub">Instant Bank Settlement</span>
          </div>
        </div>

        <div className="pos-stat-card card">
          <div className="stat-icon-wrap"><CreditCard size={20} /></div>
          <div>
            <span className="stat-label">CARD SWIPES</span>
            <h3 className="stat-value">₹{stats.todayCard.toLocaleString('en-IN')}</h3>
            <span className="stat-sub">POS Terminal</span>
          </div>
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`pos-banner ${feedbackMsg.type}`}>
          {feedbackMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ── MAIN POS SPLIT SCREEN ── */}
      <div className="pos-main-split">
        {/* ── LEFT: INVENTORY BROWSER & BARCODE SCANNER ── */}
        <div className="pos-catalog-panel">
          <div className="pos-panel-header">
            {/* Rapid Barcode Scanner Bar */}
            <form onSubmit={handleBarcodeScanSubmit} className="pos-barcode-scanner-form">
              <Barcode size={18} className="scanner-icon" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan / Type Barcode or SKU & Press Enter..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                className="scanner-input"
              />
              <button type="submit" className="btn-scanner-add">SCAN</button>
            </form>

            <div className="header-sub-row">
              <div className="pos-search-bar">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search outfit name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} /></button>}
              </div>

              <div className="header-quick-actions">
                <button className="btn-view-invoices" onClick={() => setViewPastInvoicesModal(true)}>
                  <Receipt size={14} /> PAST BILLS
                </button>
                <button className="btn-refresh-stock" onClick={fetchPosData} title="Sync Live Stock">
                  <RefreshCw size={14} className={loading ? 'spinning' : ''} /> SYNC
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="pos-category-pills">
            {['all', 'Lehenga', 'Drape Sarees', 'Co-ord Sets', 'Designer Suits', 'Indo Western', 'Suit Materials'].map(cat => (
              <button
                key={cat}
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All Outfits' : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="pos-products-grid">
            {filteredProducts.map(product => {
              const variantsList = product.variants || [];
              return (
                <div key={product.id} className="pos-product-card">
                  <div className="prod-card-top">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="prod-card-img" />
                    ) : (
                      <div className="prod-card-placeholder"><ShoppingBag size={24} /></div>
                    )}
                    <div className="prod-card-info">
                      <h4 className="prod-card-name">{product.name}</h4>
                      <span className="prod-card-cat">{product.category?.name || 'Garment'}</span>
                      <div className="prod-card-price">₹{Number(product.price).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Variant Size Stock Chips */}
                  <div className="variant-sizes-section">
                    <span className="sizes-title">Available Sizes:</span>
                    <div className="sizes-chips-row">
                      {variantsList.length > 0 ? (
                        variantsList.map(v => {
                          const avail = Math.max(0, v.stock - v.reserved_stock);
                          const isOut = avail <= 0;
                          return (
                            <button
                              key={v.id}
                              className={`size-chip-btn ${isOut ? 'disabled' : ''}`}
                              disabled={isOut}
                              onClick={() => handleAddToCart(product, v)}
                              title={isOut ? 'Out of Stock' : `${avail} units available`}
                            >
                              <span className="chip-sz">{v.size}</span>
                              <span className={`chip-stk ${isOut ? 'zero' : ''}`}>{avail}</span>
                            </button>
                          );
                        })
                      ) : (
                        (product.sizes || ['Free Size']).map(sz => (
                          <button
                            key={sz}
                            className="size-chip-btn"
                            onClick={() => handleAddToCart(product, sz)}
                          >
                            <span className="chip-sz">{sz}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: CASHIER REGISTER & BILLING ── */}
        <div className="pos-checkout-panel">
          <div className="cart-header">
            <div className="cart-title">
              <ShoppingBag size={18} color="#c6a46a" />
              <span>CURRENT REGISTER</span>
            </div>
            {cart.length > 0 && (
              <button className="btn-clear-cart" onClick={() => setCart([])}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="cart-items-container">
            {cart.length === 0 ? (
              <div className="empty-cart-state">
                <ShoppingBag size={36} color="rgba(198,164,106,0.3)" />
                <p>Register is empty</p>
                <span>Scan a barcode or click a garment size on the left to add items.</span>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={item.cartItemId} className="cart-line-item">
                  <div className="line-item-meta">
                    <span className="item-name">{item.name}</span>
                    <span className="item-variant">Size: <strong>{item.size}</strong> | {item.sku}</span>
                    <span className="item-unit-price">₹{item.price.toLocaleString('en-IN')} each</span>
                  </div>

                  <div className="line-item-qty">
                    <button className="qty-btn" onClick={() => updateCartQty(index, -1)}><Minus size={12} /></button>
                    <span className="qty-val">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateCartQty(index, 1)}><Plus size={12} /></button>
                  </div>

                  <div className="line-item-total">
                    <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    <button className="btn-remove-line" onClick={() => removeCartItem(index)} title="Remove">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Summary & Payment Form */}
          <form onSubmit={handleCompleteSale} className="pos-bill-form">
            {/* Customer Information */}
            <div className="customer-info-box">
              <div className="cust-row">
                <input
                  type="text"
                  placeholder="Customer Name (Optional Walk-in)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="pos-input"
                />
                <input
                  type="tel"
                  placeholder="Customer Phone (For Loyalty / SMS)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="pos-input"
                />
              </div>
            </div>

            {/* Discount & Tax Row */}
            <div className="discount-tax-row">
              <div className="dt-group">
                <label>Bill Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  placeholder="₹ 0"
                  value={discount === 0 ? '' : discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="pos-input-sm"
                />
              </div>
              <div className="dt-group">
                <label>Tax / GST (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="₹ 0"
                  value={tax === 0 ? '' : tax}
                  onChange={e => setTax(e.target.value)}
                  className="pos-input-sm"
                />
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="totals-breakdown">
              <div className="tot-line">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountVal > 0 && (
                <div className="tot-line discount-text">
                  <span>Store Discount</span>
                  <span>- ₹{discountVal.toLocaleString('en-IN')}</span>
                </div>
              )}
              {taxVal > 0 && (
                <div className="tot-line">
                  <span>Tax / GST</span>
                  <span>+ ₹{taxVal.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="tot-line grand-total-line">
                <span>GRAND TOTAL</span>
                <span className="grand-val">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-method-selector">
              <label className="pm-label">PAYMENT METHOD</label>
              <div className="pm-buttons-grid">
                <button
                  type="button"
                  className={`pm-btn ${paymentMode === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('cash')}
                >
                  <Banknote size={16} /> CASH
                </button>
                <button
                  type="button"
                  className={`pm-btn ${paymentMode === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('upi')}
                >
                  <Smartphone size={16} /> UPI / QR
                </button>
                <button
                  type="button"
                  className={`pm-btn ${paymentMode === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('card')}
                >
                  <CreditCard size={16} /> CARD
                </button>
                <button
                  type="button"
                  className={`pm-btn ${paymentMode === 'split' ? 'active' : ''}`}
                  onClick={() => setPaymentMode('split')}
                >
                  <Split size={16} /> SPLIT
                </button>
              </div>
            </div>

            {/* Mode-specific Tender inputs */}
            {paymentMode === 'cash' && (
              <div className="tender-box animate-fade">
                <div className="tender-inputs-row">
                  <div className="ti-col">
                    <label>Cash Tendered</label>
                    <input
                      type="number"
                      placeholder={`₹ ${grandTotal}`}
                      value={amountTendered}
                      onChange={e => setAmountTendered(e.target.value)}
                      className="pos-input"
                    />
                  </div>
                  <div className="ti-col">
                    <label>Change Due</label>
                    <div className="change-display">
                      ₹{changeDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMode === 'upi' && (
              <div className="tender-box animate-fade">
                <input
                  type="text"
                  placeholder="UPI Transaction ID / Ref # (Optional)"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="pos-input"
                />
              </div>
            )}

            {paymentMode === 'card' && (
              <div className="tender-box animate-fade">
                <input
                  type="text"
                  placeholder="Card Last 4 Digits / Auth Code"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="pos-input"
                />
              </div>
            )}

            {paymentMode === 'split' && (
              <div className="split-tender-box animate-fade">
                <div className="split-row">
                  <span className="split-label">Cash Amount:</span>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={splitCashAmount}
                    onChange={e => setSplitCashAmount(e.target.value)}
                    className="pos-input-sm"
                  />
                </div>
                <div className="split-row">
                  <span className="split-label">UPI Amount:</span>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={splitUpiAmount}
                    onChange={e => setSplitUpiAmount(e.target.value)}
                    className="pos-input-sm"
                  />
                </div>
                <div className="split-row">
                  <span className="split-label">Card Amount:</span>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={splitCardAmount}
                    onChange={e => setSplitCardAmount(e.target.value)}
                    className="pos-input-sm"
                  />
                </div>
                <div className={`split-status-bar ${Math.abs(splitBalance) < 0.01 ? 'balanced' : 'unbalanced'}`}>
                  <span>Split Total: ₹{splitTotalSum.toFixed(2)}</span>
                  <span>{Math.abs(splitBalance) < 0.01 ? '✓ Balanced' : `Remaining: ₹${splitBalance.toFixed(2)}`}</span>
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              type="submit"
              className="btn-complete-checkout"
              disabled={billingLoading || cart.length === 0}
            >
              {billingLoading ? (
                <span>RECORDING TRANSACTION...</span>
              ) : (
                <>
                  <span>COMPLETE BILL (₹{grandTotal.toLocaleString('en-IN')})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── MODAL: SALE INVOICE & RECEIPT (VIEW, PRINT, PDF) ── */}
      {receiptSale && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setReceiptSale(null)}>
          <div className="modal-card receipt-modal" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Receipt size={18} color="#c6a46a" />
                <span>BOUTIQUE SALE INVOICE</span>
              </div>
              <div className="receipt-header-btns">
                <button
                  className="btn-receipt-action"
                  onClick={() => handleDownloadPdf(receiptSale.id || receiptSale.invoice_number)}
                  title="Download Official PDF"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  className="btn-receipt-action print"
                  onClick={handlePrintReceipt}
                  title="Print Thermal / A4 Receipt"
                >
                  <Printer size={14} /> PRINT
                </button>
                <button className="btn-close-modal" onClick={() => setReceiptSale(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* Printable Luxury Invoice Container */}
              <div className="printable-boutique-invoice">
                <div className="inv-top-brand">
                  <span className="inv-emblem-seal">◈ MIRAYA COUTURE ◈</span>
                  <h2 className="inv-brand-name">MIRAYA BY GARIMA</h2>
                  <p className="inv-brand-tagline">HAUTE COUTURE & LUXURY BRIDAL APPAREL</p>
                  <p className="inv-address-line">Shop no. UG/5, Jagat Plaza, Law College Square, Amravati Rd, Nagpur, MH 440033</p>
                  <p className="inv-gst-line">GSTIN: 27AABCM9876Q1Z5 | Phone: +91 92712 18156 | Email: mirayaofficial.in@gmail.com</p>
                  <div className="inv-gold-divider"></div>
                  <p className="inv-tax-tag">OFFICIAL TAX INVOICE / RETAIL RECEIPT</p>
                </div>

                <div className="inv-meta-grid">
                  <div><span>Invoice #:</span> <strong>{receiptSale.invoice_number}</strong></div>
                  <div><span>Date & Time:</span> <strong>{new Date(receiptSale.created_at).toLocaleString('en-IN')}</strong></div>
                  <div><span>Customer Name:</span> <strong>{receiptSale.customer_name || 'Walk-in Client'}</strong></div>
                  <div><span>Contact Phone:</span> <strong>{receiptSale.customer_phone || 'N/A'}</strong></div>
                  <div><span>Boutique Stylist:</span> <strong>{receiptSale.staff_name || 'Senior Couturier'}</strong></div>
                  <div><span>Payment Mode:</span> <strong style={{ textTransform: 'uppercase', color: 'var(--primary-burgundy, #5e0a0b)' }}>{receiptSale.payment_method}</strong></div>
                </div>

                <table className="inv-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>S.NO</th>
                      <th>ITEM & DESIGN SPECIFICATION</th>
                      <th style={{ width: '60px' }}>HSN</th>
                      <th style={{ width: '70px' }}>SIZE</th>
                      <th style={{ textAlign: 'center', width: '50px' }}>QTY</th>
                      <th style={{ textAlign: 'right', width: '90px' }}>RATE (₹)</th>
                      <th style={{ textAlign: 'right', width: '100px' }}>AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receiptSale.items || []).map((it, idx) => {
                      const unitPrice = Number(it.price_at_sale || it.price || 0);
                      const qty = Number(it.quantity || 1);
                      const rowTotal = Number(it.total_price || (unitPrice * qty));

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{it.product_name_snapshot || it.product_name || 'Haute Couture Piece'}</strong>
                          </td>
                          <td style={{ color: '#777' }}>6204</td>
                          <td>{it.size_snapshot || it.size || 'Free Size'}</td>
                          <td style={{ textAlign: 'center' }}>{qty}</td>
                          <td style={{ textAlign: 'right' }}>₹{unitPrice.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{rowTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="inv-summary-section">
                  <div className="inv-sum-row">
                    <span>Taxable Subtotal (Net):</span>
                    <span>₹{Number(receiptSale.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {Number(receiptSale.discount) > 0 && (
                    <div className="inv-sum-row discount-row" style={{ color: '#27ae60' }}>
                      <span>Boutique Privilege Discount:</span>
                      <span>- ₹{Number(receiptSale.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {Number(receiptSale.tax) > 0 ? (
                    <div className="inv-sum-row">
                      <span>GST (CGST 6% + SGST 6% Included):</span>
                      <span>+ ₹{Number(receiptSale.tax).toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <div className="inv-sum-row">
                      <span>GST (12% Integrated Luxury Tax Included):</span>
                      <span>₹{Math.round((Number(receiptSale.total || 0) * 12) / 112).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="inv-sum-row grand-sum-row">
                    <span>GRAND TOTAL:</span>
                    <span>₹{Number(receiptSale.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {receiptSale.change_amount > 0 && (
                    <div className="inv-sum-row change-row">
                      <span>Cash Tendered: ₹{Number(receiptSale.amount_received).toLocaleString('en-IN')} | Change Returned:</span>
                      <span>₹{Number(receiptSale.change_amount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                <div className="inv-bottom-signatures">
                  <div className="inv-policy-terms">
                    <p><strong>Boutique Policy & Care:</strong></p>
                    <p>• Professional Dry Clean Only for all hand-embroidered ensembles.</p>
                    <p>• Alteration & fitting requests honoured within 7 days with this invoice.</p>
                  </div>

                  <div className="inv-auth-stamp">
                    <p className="stamp-title">FOR MIRAYA BY GARIMA</p>
                    <p className="stamp-desc">Digitally Authenticated</p>
                    <p className="stamp-seal">◈ Authorized Atelier Seal ◈</p>
                  </div>
                </div>

                <div className="inv-footer-msg">
                  <p>Thank you for choosing Miraya by Garima. We look forward to curating your wardrobe!</p>
                  <p className="inv-website-link">www.mirayabygarima.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PAST INVOICES LIST (REPRINT / VIEW) ── */}
      {viewPastInvoicesModal && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setViewPastInvoicesModal(false)}>
          <div className="modal-card past-invoices-modal" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Receipt size={18} color="#c6a46a" />
                <span>PAST POS INVOICES & REPRINTS</span>
              </div>
              <button className="btn-close-modal" onClick={() => setViewPastInvoicesModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="invoices-list-table-wrap">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>INVOICE #</th>
                      <th>DATE / TIME</th>
                      <th>CUSTOMER</th>
                      <th>METHOD</th>
                      <th>TOTAL</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No past sales found.</td></tr>
                    ) : (
                      sales.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.invoice_number}</strong></td>
                          <td>{new Date(s.created_at).toLocaleString()}</td>
                          <td>{s.customer_name} {s.customer_phone ? `(${s.customer_phone})` : ''}</td>
                          <td><span className="pm-tag">{s.payment_method}</span></td>
                          <td><strong>₹{Number(s.total).toLocaleString('en-IN')}</strong></td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-reprint"
                              onClick={() => {
                                setReceiptSale(s);
                                setViewPastInvoicesModal(false);
                              }}
                            >
                              <Printer size={12} /> View / Print
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
