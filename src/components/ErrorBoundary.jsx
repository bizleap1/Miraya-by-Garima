'use client';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: '#F9F6F0',
          color: '#5e0a0b',
          fontFamily: 'Playfair Display, serif'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(198, 164, 106, 0.3)',
            borderRadius: '12px',
            padding: '3rem 2.5rem',
            maxWidth: '550px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontSize: '1.8rem', color: '#c6a46a', display: 'block', marginBottom: '1rem' }}>◈</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '0.8rem', color: '#5e0a0b' }}>
              Outfit Details Loading
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: '#555', marginBottom: '2rem', lineHeight: '1.6' }}>
              We encountered a brief interruption while loading this masterpiece. Please refresh or return to our curated collections.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#5e0a0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.8rem 1.8rem',
                  borderRadius: '6px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Refresh Page
              </button>
              <a
                href="/collection/all"
                style={{
                  backgroundColor: 'transparent',
                  color: '#5e0a0b',
                  border: '1px solid #5e0a0b',
                  padding: '0.8rem 1.8rem',
                  borderRadius: '6px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  display: 'inline-block',
                  fontWeight: 600
                }}
              >
                View Collection
              </a>
            </div>

            {import.meta.env?.DEV && this.state.error && (
              <details style={{ marginTop: '2rem', textAlign: 'left', background: '#fff5f5', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', color: '#c0392b' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Developer Trace</summary>
                <p style={{ margin: '0.5rem 0 0 0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
