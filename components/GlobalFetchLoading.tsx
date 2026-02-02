'use client';

import { useEffect, useState, useCallback } from 'react';

function isApiRequest(input: RequestInfo | URL): boolean {
  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.pathname;
  } else {
    url = input.url;
  }
  return url.includes('/api/');
}

export function GlobalFetchLoading() {
  const [loadingCount, setLoadingCount] = useState(0);
  const isActive = loadingCount > 0;

  const increment = useCallback(() => setLoadingCount((c) => c + 1), []);
  const decrement = useCallback(() => setLoadingCount((c) => Math.max(0, c - 1)), []);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const isApi = isApiRequest(input);
      if (isApi) increment();

      try {
        const response = await originalFetch(input, init);
        return response;
      } finally {
        if (isApi) decrement();
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
