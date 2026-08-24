import { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config';
import { getProductImage } from '../utils/imageHelper';
import { useLoading } from './LoadingContext';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { showLoading, hideLoading } = useLoading();
  const [cartItems, setCartItems] = useState([]);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('miraya_cart');
        if (saved) setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to read cart from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('miraya_cart', JSON.stringify(cartItems));
      }
    } catch (e) {
      console.warn("Failed to save cart to localStorage", e);
    }
  }, [cartItems]);

  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const mappedCart = data.map(item => ({
            ...item.product,
            selectedSize: item.size,
            qty: item.quantity,
            _cartId: item.id
          }));
          setCartItems(mappedCart);
        }
      } catch (e) {
        console.error("Failed to fetch cart from backend", e);
      }
    };

    fetchCart();

    window.addEventListener('loginStateChange', fetchCart);
    return () => window.removeEventListener('loginStateChange', fetchCart);
  }, []);

  const addToCart = async (product, size, qty = 1) => {
    if (!product) return;
    showLoading('Adding to Shopping Bag...');
    const token = localStorage.getItem('token');
    
    // Parse numeric price safely
    let numericPrice = typeof product.price === 'number'
      ? product.price
      : parseInt(String(product.price || 0).replace(/[^\d]/g, ''), 10);
    if (isNaN(numericPrice)) numericPrice = 0;

    const targetSize = size || product.selectedSize || (Array.isArray(product.sizes) ? product.sizes[0] : 'M');

    const safeProduct = {
      ...product,
      id: product.id,
      title: product.title || product.name || 'Luxury Outfit',
      price: numericPrice,
      image: getProductImage(product.image || product.image_url)
    };
    
    // Optimistic UI update
    setCartItems(prev => {
      const existing = prev.find(item => String(item.id) === String(safeProduct.id) && item.selectedSize === targetSize);
      if (existing) {
        return prev.map(item => 
          String(item.id) === String(safeProduct.id) && item.selectedSize === targetSize 
            ? { ...item, qty: (item.qty || 1) + qty } 
            : item
        );
      }
      return [...prev, { ...safeProduct, selectedSize: targetSize, qty }];
    });

    try {
      if (token) {
        const rawId = typeof product.id === 'number' ? product.id : parseInt(String(product.id || '').replace(/[^\d]/g, ''), 10);
        if (rawId && !isNaN(rawId)) {
          const res = await fetch(`${API_URL}/api/cart`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id: rawId, productId: rawId, quantity: qty, size: targetSize })
          });
          if (res.ok) {
            const data = await res.json();
            setCartItems(prev => prev.map(item => 
              String(item.id) === String(safeProduct.id) && item.selectedSize === targetSize 
                ? { ...item, _cartId: data.cartItem?.id || data.id } 
                : item
            ));
          }
        }
      }
    } catch (e) {
      console.error("Failed to add to backend cart", e);
    } finally {
      setTimeout(() => hideLoading(), 350);
    }
  };

  const updateQuantity = (id, size, qty) => {
    setCartItems(prev => prev.map(item => 
      item.id === id && item.selectedSize === size ? { ...item, qty } : item
    ));
  };

  const removeFromCart = async (id, size) => {
    showLoading('Updating Bag...');
    const token = localStorage.getItem('token');
    const existing = cartItems.find(item => item.id === id && item.selectedSize === size);
    
    setCartItems(prev => prev.filter(item => !(item.id === id && item.selectedSize === size)));

    try {
      if (token && existing && existing._cartId) {
        await fetch(`${API_URL}/api/cart/${existing._cartId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Failed to remove from backend cart", e);
    } finally {
      setTimeout(() => hideLoading(), 300);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    setCartItems([]);

    if (token) {
      try {
        await fetch(`${API_URL}/api/cart`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Failed to clear backend cart", e);
      }
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + (item.qty || 1), 0);

  const value = {
    cartItems,
    setCartItems, // Added for AccountPage backward compatibility
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
