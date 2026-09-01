import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, RefreshCw, AlertTriangle, CheckCircle,
  X, AlertCircle, Edit2, Boxes, Download, FileText, LayoutGrid, List, Plus, Minus
} from 'lucide-react';
import { exportInventoryPDF } from '../../utils/pdfExportHelper';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

import { getProductImage } from '../../utils/imageHelper';

const resolveImageUrl = (raw) => {
  return getProductImage(raw);
};

export default function AdminInventorySection({ token, API_BASE_URL }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'

  // Multi-Size Product Stock Edit Modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [sizeStockValues, setSizeStockValues] = useState({});
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Fetch live inventory
  const fetchInventory = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/inventory?limit=200`, { headers });
      const data = await res.json();

      if (data.success) {
        setVariants(data.variants || []);
      } else {
        if (!isSilent) setError(data.message || 'Error loading inventory.');
      }
    } catch (err) {
      if (!isSilent) setError('Network error while loading inventory.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(false);
    // Real-time live inventory polling
    const interval = setInterval(() => fetchInventory(true), 8000);
    return () => clearInterval(interval);
  }, []);

  // Group variants into unique products with their size-wise inventory
  const groupedProducts = useMemo(() => {
    const map = new Map();

    variants.forEach((v) => {
      const pId = v.product_id || v.id;
      if (!map.has(pId)) {
        const rawImg = v.product_image || v.image || v.product?.images?.[0] || v.product?.image_url || '/products/Lehenga-Pink Blush/1.JPG';
        map.set(pId, {
          id: pId,
          name: v.product_name || v.name || 'Garment Piece',
          image: resolveImageUrl(rawImg, API_BASE_URL),
          category: v.category_name || v.category || 'Couture',
          price: Number(v.price || 0),
          variants: [],
          totalStock: 0,
        });
      }

      const stock = Number(v.physical_stock ?? v.stock ?? 0);
      const prod = map.get(pId);
      prod.variants.push({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode,
        size: v.size || 'M',
        color: v.color || 'Classic',
        stock,
        price: Number(v.price || prod.price),
      });
      prod.totalStock += stock;
    });

    // Sort sizes logically within each product (S, M, L, XL, XXL, Free Size)
    const sizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, '3XL': 7, 'FREE SIZE': 8 };
    map.forEach((prod) => {
      prod.variants.sort((a, b) => {
        const orderA = sizeOrder[a.size.toUpperCase()] || 99;
        const orderB = sizeOrder[b.size.toUpperCase()] || 99;
        return orderA - orderB;
      });
    });

    return Array.from(map.values());
  }, [variants]);

  // Filter products by search and stock status
  const filteredProducts = useMemo(() => {
    return groupedProducts.filter((p) => {
      const pName = p.name.toLowerCase();
      const cat = p.category.toLowerCase();
      const q = search.toLowerCase().trim();

      const matchesSearch = !q || pName.includes(q) || cat.includes(q) ||
        p.variants.some(v => v.size.toLowerCase().includes(q) || (v.sku && v.sku.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (statusFilter === 'IN_STOCK') return p.totalStock > 5;
      if (statusFilter === 'LOW_STOCK') return p.totalStock > 0 && p.totalStock <= 5;
      if (statusFilter === 'OUT_OF_STOCK') return p.totalStock <= 0;

      return true;
    });
  }, [groupedProducts, search, statusFilter]);

  // Flatten filtered variants for PDF/CSV export and Table view
  const filteredVariants = useMemo(() => {
    const pIds = new Set(filteredProducts.map(p => p.id));
    return variants.filter(v => pIds.has(v.product_id || v.id));
  }, [variants, filteredProducts]);

  // Export Inventory to CSV
  const exportInventoryCSV = () => {
    if (!filteredVariants || filteredVariants.length === 0) {
      alert('No inventory records available to export.');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'SKU',
      'Barcode',
      'Size',
      'Color',
      'Unit Price (INR)',
      'Current Stock Qty',
      'Inventory Valuation (INR)',
      'Stock Health Status'
    ];

    const rows = filteredVariants.map(v => {
      const stock = Number(v.physical_stock ?? v.stock ?? 0);
      const price = Number(v.price || v.product?.price || 0);
      const val = stock * price;
      let status = 'In Stock';
      if (stock <= 0) status = 'Out of Stock';
      else if (stock <= 5) status = 'Low Stock';

      return [
        v.product_id || v.id,
        `"${(v.product_name || v.name || 'Outfit').replace(/"/g, '""')}"`,
        `"${(v.sku || 'N/A').replace(/"/g, '""')}"`,
        `"${(v.barcode || 'N/A').replace(/"/g, '""')}"`,
        `"${(v.size || 'M').replace(/"/g, '""')}"`,
        `"${(v.color || 'Standard').replace(/"/g, '""')}"`,
        price,
        stock,
        val,
        `"${status}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Miraya_Inventory_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary KPI Cards
  const totalProductsCount = groupedProducts.length;
  const totalStockCount = groupedProducts.reduce((acc, p) => acc + p.totalStock, 0);
  const lowStockCount = groupedProducts.filter(p => p.totalStock > 0 && p.totalStock <= 5).length;
  const outOfStockCount = groupedProducts.filter(p => p.totalStock <= 0).length;

  // Open Multi-Size Edit Modal
  const handleOpenEditProduct = (product, focusVariant = null) => {
    setEditingProduct(product);
    const initialStocks = {};
    product.variants.forEach((v) => {
      initialStocks[v.id] = v.stock;
    });
    setSizeStockValues(initialStocks);
    setUpdateError('');
  };

  // Handle stock value increment / decrement
  const handleSizeStockChange = (variantId, delta) => {
    setSizeStockValues((prev) => {
      const current = prev[variantId] !== undefined ? prev[variantId] : 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [variantId]: nextVal };
    });
  };

  // Submit Multi-Size Stock Save
  const handleBatchStockSave = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setUpdating(true);
    setUpdateError('');

    try {
      const activeToken = token || localStorage.getItem('token');
      const adjustmentsToMake = [];

      for (const v of editingProduct.variants) {
        const newStock = parseInt(sizeStockValues[v.id], 10);
        if (isNaN(newStock) || newStock < 0) continue;

        const currentStock = v.stock;
        const delta = newStock - currentStock;

        if (delta !== 0) {
          adjustmentsToMake.push({
            variant_id: v.id,
            product_id: editingProduct.id,
            quantity_delta: delta,
            type: delta > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
            note: `Admin size ${v.size} adjustment (${currentStock} -> ${newStock})`
          });
        }
      }

      if (adjustmentsToMake.length === 0) {
        setEditingProduct(null);
        setUpdating(false);
        return;
      }

      // Execute adjustments
      for (const adj of adjustmentsToMake) {
        await fetch(`${API_BASE_URL}/api/inventory/adjust`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`
          },
          body: JSON.stringify(adj)
        });
      }

      setEditingProduct(null);
      await fetchInventory();
    } catch (err) {
      setUpdateError('Error updating size stock. Please check server connection.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-actions">
        <div>
          <h2>Inventory</h2>
          <p>Manage products and size-wise stock in unified luxury cards.</p>
        </div>

        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-outline"
            style={{ borderColor: '#c6a46a', color: '#5e0a0b', fontWeight: 700 }}
            onClick={() => exportInventoryPDF(filteredVariants, statusFilter)}
            title="Export stock valuation ledger as styled Luxury PDF document"
          >
            <FileText size={14} /> Export Stock (PDF)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportInventoryCSV}
            title="Export full inventory ledger to Excel/CSV"
          >
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-secondary" onClick={fetchInventory}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Package size={22} /></div>
          <div>
            <span className="stat-title">Total Products</span>
            <strong className="stat-value">{totalProductsCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Boxes size={22} /></div>
          <div>
            <span className="stat-title">Total Stock Units</span>
            <strong className="stat-value">{totalStockCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><AlertTriangle size={22} style={{ color: 'var(--miraya-amber)' }} /></div>
          <div>
            <span className="stat-title">Low Stock Products</span>
            <strong className="stat-value" style={{ color: 'var(--miraya-amber)' }}>{lowStockCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><AlertCircle size={22} style={{ color: 'var(--miraya-red)' }} /></div>
          <div>
            <span className="stat-title">Out of Stock</span>
            <strong className="stat-value" style={{ color: 'var(--miraya-red)' }}>{outOfStockCount}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR & VIEW MODE SWITCHER */}
      <div className="admin-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="admin-input"
              placeholder="Search product, category, size..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Stock Status</option>
            <option value="IN_STOCK">In Stock (&gt;5)</option>
            <option value="LOW_STOCK">Low Stock (1-5)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>
        </div>

        <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--miraya-muted)' }}>
            Showing <strong>{filteredProducts.length}</strong> Products ({filteredVariants.length} Sizes)
          </span>

          <div style={{ display: 'inline-flex', background: '#f5f0eb', padding: '3px', borderRadius: '6px', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              style={{
                border: 'none',
                background: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                color: viewMode === 'CARDS' ? '#5e0a0b' : '#777',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: viewMode === 'CARDS' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: viewMode === 'CARDS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <LayoutGrid size={14} /> Cards
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              style={{
                border: 'none',
                background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TABLE' ? '#5e0a0b' : '#777',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: viewMode === 'TABLE' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* ─── 1. GROUPED PRODUCT CARDS VIEW (DEFAULT) ─── */}
      {viewMode === 'CARDS' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredProducts.map((product) => {
              const isOut = product.totalStock <= 0;
              const isLow = product.totalStock > 0 && product.totalStock <= 5;
              const badgeType = isOut ? 'danger' : isLow ? 'warning' : 'success';
              const badgeText = isOut ? 'Out of Stock' : isLow ? `Low Stock (${product.totalStock})` : `In Stock (${product.totalStock})`;

              return (
                <div
                  key={product.id}
                  style={{
                    background: 'var(--miraya-white, #ffffff)',
                    border: '1px solid var(--miraya-border, #EBE5E6)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* TOP: PRODUCT IMAGE & META */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '64px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #e6d8c3',
                        flexShrink: 0,
                        backgroundColor: '#FAF8F5'
                      }}
                      onError={(e) => { e.target.onerror = null; e.target.src = '/products/Lehenga-Pink%20Blush/1.JPG'; }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--miraya-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={product.name}
                      >
                        {product.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--miraya-muted)', display: 'block', marginTop: '2px' }}>
                        {product.category}
                      </span>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '15px', color: '#5e0a0b' }}>
                          {formatINR(product.price)}
                        </strong>
                        <span className={`status-badge status-${badgeType}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {badgeText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE: SIZE-WISE STOCK PRESENTATION */}
                  <div style={{ background: '#FAF8F5', border: '1px solid #f0e6d8', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#555' }}>
                        Size-Wise Stock:
                      </span>
                      <span style={{ fontSize: '11px', color: '#888' }}>
                        {product.variants.length} Size{product.variants.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: '6px' }}>
                      {product.variants.map((v) => {
                        const vOut = v.stock <= 0;
                        const vLow = v.stock > 0 && v.stock <= 2;
                        const bg = vOut ? '#fce8e6' : vLow ? '#fef7e0' : '#e6f4ea';
                        const borderColor = vOut ? '#f5c6cb' : vLow ? '#ffeeba' : '#c3e6cb';
                        const textColor = vOut ? '#c5221f' : vLow ? '#b45309' : '#15803d';

                        return (
                          <div
                            key={v.id}
                            onClick={() => handleOpenEditProduct(product, v)}
                            style={{
                              background: bg,
                              border: `1px solid ${borderColor}`,
                              borderRadius: '6px',
                              padding: '6px 4px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title={`Click to adjust stock for Size ${v.size} (Current: ${v.stock})`}
                          >
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#444' }}>{v.size}</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: textColor }}>{v.stock}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOTTOM: FOOTER & ACTIONS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--miraya-border)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--miraya-muted)' }}>
                      Total Units: <strong style={{ color: 'var(--miraya-text)' }}>{product.totalStock}</strong>
                    </span>
                    <button
                      className="btn btn-outline"
                      style={{ minHeight: '30px', padding: '0 12px', fontSize: '12px' }}
                      onClick={() => handleOpenEditProduct(product)}
                    >
                      <Edit2 size={12} /> Edit Stock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--miraya-muted)' }}>
              {loading ? 'Loading inventory catalog...' : 'No products found matching the criteria.'}
            </div>
          )}
        </div>
      )}

      {/* ─── 2. DETAILED VARIANT TABLE VIEW ─── */}
      {viewMode === 'TABLE' && (
        <div className="panel">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Update</th>
                </tr>
              </thead>

              <tbody>
                {filteredVariants.map((v) => {
                  const stock = v.physical_stock ?? v.stock ?? 0;
                  const statusType = stock > 5 ? 'success' : stock > 0 ? 'warning' : 'danger';
                  const statusLabel = stock > 5 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock';
                  const parentProd = groupedProducts.find(p => p.id === (v.product_id || v.id)) || { variants: [v], id: v.product_id || v.id, name: v.product_name };

                  return (
                    <tr key={v.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={v.product_image || v.image || '/products/Lehenga-Pink Blush/1.JPG'}
                            alt={v.product_name || 'Garment'}
                            style={{ width: '34px', height: '42px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/products/Lehenga-Pink%20Blush/1.JPG'; }}
                          />
                          <strong style={{ fontSize: '13px' }}>{v.product_name || v.name || 'Garment'}</strong>
                        </div>
                      </td>

                      <td><strong>{v.size || 'M'}</strong></td>
                      <td>{v.color || 'Classic'}</td>
                      <td style={{ fontWeight: '600' }}>{formatINR(v.price)}</td>
                      <td><strong style={{ fontSize: '14px' }}>{stock}</strong></td>

                      <td>
                        <span className={`status-badge status-${statusType}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ minHeight: '32px', padding: '0 12px' }}
                          onClick={() => handleOpenEditProduct(parentProd, v)}
                        >
                          <Edit2 size={13} /> Edit Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredVariants.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '25px', color: 'var(--miraya-muted)' }}>
                      {loading ? 'Loading inventory data...' : 'No inventory items match search criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MULTI-SIZE PRODUCT STOCK EDIT MODAL ─── */}
      {editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Manage Size-Wise Stock
              </h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleBatchStockSave}>
              <div className="modal-body" style={{ padding: '20px' }}>
                {updateError && (
                  <div style={{ background: 'var(--miraya-red-soft)', color: 'var(--miraya-red)', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>
                    {updateError}
                  </div>
                )}

                {/* PRODUCT SUMMARY */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#FAF8F5', border: '1px solid #e6d8c3', borderRadius: '8px', padding: '12px', marginBottom: '18px' }}>
                  <img
                    src={editingProduct.image}
                    alt={editingProduct.name}
                    style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/products/Lehenga-Pink%20Blush/1.JPG'; }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#1a1a1a', display: 'block' }}>{editingProduct.name}</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>{editingProduct.category} • {formatINR(editingProduct.price)}</span>
                    <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '2px' }}>
                      Current Total Stock: <strong>{editingProduct.totalStock} units</strong>
                    </span>
                  </div>
                </div>

                {/* SIZES LIST INPUTS */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#333' }}>
                  Adjust Quantities Per Size:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {editingProduct.variants.map((v) => {
                    const currentVal = sizeStockValues[v.id] !== undefined ? sizeStockValues[v.id] : v.stock;

                    return (
                      <div
                        key={v.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid var(--miraya-border)',
                          borderRadius: '8px'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '14px', color: '#1a1a1a' }}>Size {v.size}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--miraya-muted)', display: 'block' }}>
                            SKU: {v.sku || 'N/A'} (Current: {v.stock})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleSizeStockChange(v.id, -1)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #ccc',
                              background: '#f8f8f8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            type="number"
                            className="admin-input"
                            style={{ width: '65px', textAlign: 'center', height: '32px', fontWeight: 700 }}
                            value={currentVal}
                            min="0"
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setSizeStockValues(prev => ({ ...prev, [v.id]: isNaN(val) ? 0 : Math.max(0, val) }));
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => handleSizeStockChange(v.id, 1)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #ccc',
                              background: '#f8f8f8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--miraya-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Updating Stock...' : 'Save All Sizes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
