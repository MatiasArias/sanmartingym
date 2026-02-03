'use client';

import { useEffect, useState, useCallback } from 'react';

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function shouldShowLoading(input: RequestInfo | URL): boolean {
  const url = getRequestUrl(input);
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) return false;
    const path = parsed.pathname;
    if (path.startsWith('/_next/static/')) return false;
    if (/\.(js|css|woff2?|ico|png|jpg|jpeg|gif|svg|webp)(\?|$)/.test(path)) return false;
    return path.startsWith('/api/') || path.startsWith('/_next/data/') || (!path.startsWith('/_next/') && !path.includes('.'));
  } catch {
    return false;
  }
}

export function GlobalFetchLoading() {
  const [loadingCount, setLoadingCount] = useState(0);
  const isActive = loadingCount > 0;

  const increment = useCallback(() => setLoadingCount((c) => c + 1), []);
  const decrement = useCallback(() => setLoadingCount((c) => Math.max(0, c - 1)), []);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const show = shouldShowLoading(input);
      if (show) increment();

      try {
        const response = await originalFetch(input, init);
        return response;
      } finally {
        if (show) decrement();
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [increment, decrement]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 overflow-hidden transition-opacity duration-200"
      style={{ opacity: isActive ? 1 : 0, pointerEvents: 'none' }}
    >
      <div className="absolute inset-0 bg-sanmartin-red/30" />
      <div
        className="absolute top-0 left-0 h-full w-1/4 bg-sanmartin-red"
        style={{ animation: 'fetch-loading-slide 1.2s ease-in-out infinite' }}
      />
    </div>
  );
}
