import { useEffect, useState } from 'react';

/** Minimal hash router: #/learn/ai-app/ai-app-m1-l1 → ['learn','ai-app','ai-app-m1-l1'] */
export function parseHash(h = window.location.hash): string[] {
  return h.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function useRoute() {
  const [parts, setParts] = useState(parseHash);
  useEffect(() => {
    const on = () => {
      setParts(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export function href(...parts: (string | undefined)[]) {
  return '#/' + parts.filter(Boolean).map((p) => encodeURIComponent(p!)).join('/');
}

export function go(...parts: (string | undefined)[]) {
  const next = href(...parts);
  if (window.location.hash === next) return;
  window.location.hash = next;
}
