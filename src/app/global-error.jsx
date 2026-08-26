'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#FAF8F5',
        color: '#333'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '2rem',
            color: '#5e0a0b',
            marginBottom: '1rem'
          }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
            We apologize for the inconvenience. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#5e0a0b',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
