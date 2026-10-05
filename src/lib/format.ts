export function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? h + ':' : ''}${mm}:${String(r).padStart(2, '0')}`;
}

export function hoursMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export function approxHours(min: number): string {
  const h = min / 60;
  if (h < 1) return `~${Math.round(min)} min`;
  return `~${Math.round(h)} hours`;
}

export function age(days: number): string {
  if (days < 45) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const y = Math.round(days / 365);
  return `${y} year${y > 1 ? 's' : ''} ago`;
}

export function relTime(ts: number, now = Date.now()): string {
  const d = Math.round((now - ts) / 60000);
  if (d < 1) return 'Just now';
  if (d < 60) return `${d}m ago`;
  const h = Math.round(d / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
