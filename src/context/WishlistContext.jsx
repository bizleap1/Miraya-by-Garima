import { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config';

const WishlistContext = createContext();

export const useWishlist = () => {
  return useContext(WishlistContext);
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('miraya_wishlist');
        const parsed = saved ? JSON.parse(saved) : [];
        if (Array.isArray(parsed)) {
          setWishlist(parsed.filter(i => typeof i === 'object' && i !== null && i.id));
        }
      }
    } catch (e) {
      console.warn("Failed to read wishlist from localStorage", e);
    }
  }, []);

  // Save to localStorage for unauthenticated users, or just as cache
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('miraya_wishlist', JSON.stringify(wishlist));
      }
    } catch (e) {
      console.warn("Failed to save wishlist to localStorage", e);
    }
  }, [wishlist]);

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/wishlist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend format to frontend format: attach _wishlistId to the product
          const mappedWishlist = data.map(item => ({
            ...item.product,
            _wishlistId: item.id
          }));
          setWishlist(mappedWishlist);
        }
      } catch (e) {
        console.error("Failed to fetch wishlist from backend", e);
      }
    };

    fetchWishlist();

    window.addEventListener('loginStateChange', fetchWishlist);
    return () => window.removeEventListener('loginStateChange', fetchWishlist);
  }, []);

  const toggleWishlist = async (productObj) => {
    const token = localStorage.getItem('token');
    const existing = wishlist.find(item => item.id === productObj.id);

    if (existing) {
      // Remove
      setWishlist(prev => prev.filter(item => item.id !== productObj.id));
      if (token && existing._wishlistId) {
        try {
          await fetch(`${API_URL}/api/wishlist/${existing._wishlistId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (e) {
          console.error("Failed to remove from backend wishlist", e);
        }
      }
    } else {
      // Add
      let newItem = { ...productObj };
      setWishlist(prev => [...prev, newItem]);
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/wishlist`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: productObj.id })
          });
          if (res.ok) {
            const data = await res.json();
            setWishlist(prev => prev.map(item => 
              item.id === productObj.id ? { ...item, _wishlistId: data.id } : item
            ));
          }
        } catch (e) {
          console.error("Failed to add to backend wishlist", e);
        }
      }
    }
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => item.id === id);
  };

  const wishlistCount = wishlist.length;

  const value = {
    wishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
