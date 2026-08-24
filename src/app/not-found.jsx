'use client';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--bg-cream, #f8f5f0)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(94, 10, 11, 0.08)',
          color: 'var(--primary-burgundy, #5e0a0b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <Sparkles size={28} />
      </div>

      <span
        style={{
          fontSize: '0.85rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--gold-accent, #c6a46a)',
          fontWeight: '600',
          marginBottom: '0.5rem',
        }}
      >
        Page Not Found
      </span>

      <h1
        style={{
          fontFamily: "var(--font-heading, 'Playfair Display', serif)",
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          color: 'var(--primary-burgundy, #5e0a0b)',
          fontWeight: '700',
          marginBottom: '1rem',
        }}
      >
        404 — Piece Not in Collection
      </h1>

      <p
        style={{
          maxWidth: '520px',
          color: '#666',
          fontSize: '1.05rem',
          lineHeight: '1.6',
          marginBottom: '2.5rem',
        }}
      >
        The haute couture ensemble or page you are looking for may have been moved, renamed, or is currently unavailable in our active atelier.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Return to Flagship
        </Link>
        <Link
          href="/collection/indo-western"
          className="btn btn-secondary"
          style={{ textDecoration: 'none' }}
        >
          Explore Collections
        </Link>
      </div>
    </div>
  );
}
