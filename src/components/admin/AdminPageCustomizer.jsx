import { useState, useEffect } from 'react';
import API_URL from '../../config.js';
import { useToast } from '../../context/ToastContext';
import { Search, MoveUp, MoveDown, X, Save } from 'lucide-react';

export default function AdminPageCustomizer() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // We are currently hardcoding the "new-arrivals" page
  const PAGE_NAME = 'new-arrivals';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all products for selection
      const prodRes = await fetch(`${API_URL}/api/products`);
      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }

      // Fetch current configuration
      const configRes = await fetch(`${API_URL}/api/page-customizer/${PAGE_NAME}`);
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.product_ids) {
          setSelectedProductIds(configData.product_ids);
        }
      }
    } catch (error) {
      toast.error('Failed to load page configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/page-customizer/${PAGE_NAME}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_ids: selectedProductIds })
      });

      if (res.ok) {
        toast.success('Page layout saved successfully!');
      } else {
        toast.error('Failed to save layout.');
      }
    } catch (error) {
      toast.error('Error saving layout.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = (productId) => {
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newIds = [...selectedProductIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    setSelectedProductIds(newIds);
  };

  const handleMoveDown = (index) => {
    if (index === selectedProductIds.length - 1) return;
    const newIds = [...selectedProductIds];
    [newIds[index + 1], newIds[index]] = [newIds[index], newIds[index + 1]];
    setSelectedProductIds(newIds);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && !selectedProductIds.includes(p.id)
  );

  const selectedProductsDetails = selectedProductIds.map(id => products.find(p => p.id === id)).filter(p => p);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading customizer...</div>;
  }

  return (
    <div style={{ padding: '2rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--primary-burgundy)', fontFamily: 'var(--font-serif)' }}>
          Page Customizer: New Arrivals
        </h2>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{
            background: 'var(--primary-burgundy)',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Selected Products (Order Matters) */}
        <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--primary-gold)', paddingBottom: '0.5rem', display: 'inline-block' }}>
            Selected Products ({selectedProductsDetails.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
            These products will appear on the New Arrivals page in the exact order shown below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {selectedProductsDetails.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: '4px' }}>
                No products selected yet. Search and add products from the right panel.
              </div>
            ) : (
              selectedProductsDetails.map((product, index) => (
                <div key={product.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8f5f0', borderRadius: '6px', gap: '1rem' }}>
                  <img src={product.images[0] || product.image_url} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{product.name}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>₹{product.price}</p>
                  </div>
                  
                  {/* Controls */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleMoveUp(index)} disabled={index === 0} style={{ padding: '0.4rem', cursor: index === 0 ? 'not-allowed' : 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', opacity: index === 0 ? 0.5 : 1 }}>
                      <MoveUp size={16} />
                    </button>
                    <button onClick={() => handleMoveDown(index)} disabled={index === selectedProductsDetails.length - 1} style={{ padding: '0.4rem', cursor: index === selectedProductsDetails.length - 1 ? 'not-allowed' : 'pointer', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', opacity: index === selectedProductsDetails.length - 1 ? 0.5 : 1 }}>
                      <MoveDown size={16} />
                    </button>
                    <button onClick={() => handleRemoveProduct(product.id)} style={{ padding: '0.4rem', cursor: 'pointer', background: '#fee', border: '1px solid #fcc', color: '#c00', borderRadius: '4px' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Products */}
        <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--primary-gold)', paddingBottom: '0.5rem', display: 'inline-block' }}>
            Available Products
          </h3>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="Search products by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: '#888' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {filteredProducts.map(product => (
              <div key={product.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', border: '1px solid #eee', borderRadius: '6px', gap: '1rem' }}>
                <img src={product.images[0] || product.image_url} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem', fontWeight: '500' }}>{product.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>₹{product.price}</p>
                </div>
                <button 
                  onClick={() => handleAddProduct(product.id)}
                  style={{ background: '#f0f0f0', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Add
                </button>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>No matching products found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
