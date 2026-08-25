'use client';
import React, { forwardRef } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';

/**
 * Universal Navigation Compatibility Adapter
 * Seamlessly bridges Next.js App Router navigation with React Router idioms
 */

export const Link = forwardRef(function Link({ to, href, children, ...props }, ref) {
  const target = to || href || '#';
  return (
    <NextLink ref={ref} href={target} {...props}>
      {children}
    </NextLink>
  );
});

export const NavLink = forwardRef(function NavLink({ to, href, className, children, end, ...props }, ref) {
  const target = to || href || '#';
  const pathname = usePathname() || '/';
  const isActive = pathname === target;
  const computedClass =
    typeof className === 'function'
      ? className({ isActive })
      : isActive
      ? `${className || ''} active`.trim()
      : className;

  return (
    <NextLink ref={ref} href={target} className={computedClass} {...props}>
      {children}
    </NextLink>
  );
});

export function useNavigate() {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === 'number') {
      if (to === -1 && typeof window !== 'undefined') {
        window.history.back();
      }
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearch(window.location.search || '');
    }
  }, [pathname]);

  return {
    pathname,
    search,
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null,
  };
}

export function useParams() {
  const params = useNextParams();
  const pathname = usePathname() || '';
  const result = { ...(params || {}) };

  // If slug is present (e.g. array [...slug])
  if (result.slug) {
    if (Array.isArray(result.slug)) {
      if (result.slug.length === 1) {
        if (!result.id) result.id = result.slug[0];
      } else if (result.slug.length >= 2) {
        if (!result.category) result.category = result.slug[0];
        if (!result.id) result.id = result.slug[result.slug.length - 1];
      }
    } else if (typeof result.slug === 'string') {
      if (!result.id) result.id = result.slug;
    }
  }

  // Fallback to pathname parsing if parameters are missing
  if (typeof pathname === 'string') {
    if (pathname.startsWith('/product/')) {
      const parts = pathname.replace(/^\/product\/?/, '').split('/').filter(Boolean);
      if (parts.length === 1) {
        if (!result.id) result.id = decodeURIComponent(parts[0]);
      } else if (parts.length >= 2) {
        if (!result.category) result.category = decodeURIComponent(parts[0]);
        if (!result.id) result.id = decodeURIComponent(parts[parts.length - 1]);
      }
    } else if (pathname.startsWith('/collection/')) {
      const cat = pathname.replace(/^\/collection\/?/, '').split('/')[0];
      if (cat && !result.category) result.category = decodeURIComponent(cat);
    }
  }

  return result;
}

export function useNavigationType() {
  return 'PUSH';
}

export function useSearchParams() {
  const pathname = usePathname();
  const [searchParams, setSearchParams] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, [pathname]);

  return [searchParams];
}
