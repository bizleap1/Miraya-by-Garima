'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API_URL from '../config';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchResults = async () => {
      if (query) {
        setLoading(true);
        let found = false;
        try {
          const res = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setResults(data);
              found = true;
            }
          }
        } catch (error) {
          // Fall back to local search
        }

        if (!found) {
          try {
            const { getAllProducts } = await import('../data/products');
            const allProds = getAllProducts();
            const q = query.toLowerCase().trim();
            const localResults = allProds.filter(p => 
              (p.title && p.title.toLowerCase().includes(q)) ||
              (p.category && p.category.toLowerCase().includes(q)) ||
              (p.fabric && p.fabric.toLowerCase().includes(q)) ||
              (p.color && p.color.toLowerCase().includes(q)) ||
              (p.craftsmanship && p.craftsmanship.toLowerCase().includes(q))
            );
            setResults(localResults);
          } catch (e) {
            console.error("Local search fallback error:", e);
          }
        }
        setLoading(false);
      } else {
        setResults([]);
      }
    };
    fetchResults();
  }, [query]);



  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results</h1>
        {query ? (
          <p>Showing {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
        ) : (
          <p>Please enter a search query to find products.</p>
        )}
      </div>

      <div className="container">
        {loading ? (
          <div style={{padding: '4rem', textAlign: 'center'}}>
            <h2>Searching...</h2>
          </div>
        ) : results.length > 0 ? (
          <div className="premium-grid">
            {results.map((item) => {
              const uniqueId = `${item.category}-${item.id}`;
              return (
                <div key={uniqueId} className="premium-card">
                  <div className="card-image-wrapper">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    


                    <div className="card-overlay">
                      <Link to={`/product/${item.category}/${item.id}`} className="view-details-btn">
                        View Details
                      </Link>
                    </div>
                  </div>
                  <div className="card-info">
                    <h3>{item.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        ) : query ? (
          <div className="no-items">
            <h2>No matches found.</h2>
            <p>Try searching for terms like "Silk", "Velvet", or "Ensemble".</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchPage;
