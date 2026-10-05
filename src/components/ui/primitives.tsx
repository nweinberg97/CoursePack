import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/format';
import { Icon, type IconName } from './Icon';

/* --------------------------------- Button -------------------------------- */

type Variant = 'primary' | 'ink' | 'secondary' | 'ghost' | 'quiet';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-red text-white hover:brightness-95 active:brightness-90',
  ink: 'bg-ink text-bg hover:opacity-90',
  secondary: 'bg-sunken text-ink hover:bg-sunken-2',
  ghost: 'text-ink border border-line-strong hover:bg-sunken',
  quiet: 'text-muted hover:text-ink hover:bg-sunken',
};

export function Button({ variant = 'secondary', size = 'md', icon, iconRight, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName }) {
  const s = size === 'sm' ? 'h-8 px-3 text-[13px] gap-1.5' : size === 'lg' ? 'h-12 px-5 text-[15px] gap-2' : 'h-10 px-4 text-[14px] gap-2';
  return (
    <button {...rest} className={cx('inline-flex items-center justify-center rounded-full font-[560] whitespace-nowrap transition disabled:opacity-40', s, VARIANTS[variant], className)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </button>
  );
}

export function LinkButton({ href, variant = 'secondary', size = 'md', icon, iconRight, className, children }: { href: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName; className?: string; children: ReactNode }) {
  const s = size === 'sm' ? 'h-8 px-3 text-[13px] gap-1.5' : size === 'lg' ? 'h-12 px-5 text-[15px] gap-2' : 'h-10 px-4 text-[14px] gap-2';
  return (
    <a href={href} className={cx('inline-flex items-center justify-center rounded-full font-[560] whitespace-nowrap transition', s, VARIANTS[variant], className)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </a>
  );
}

export function IconButton({ icon, label, onClick, active, className, size = 36 }: { icon: IconName; label: string; onClick?: () => void; active?: boolean; className?: string; size?: number }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} style={{ width: size, height: size }} className={cx('inline-flex items-center justify-center rounded-full transition', active ? 'bg-ink text-bg' : 'text-muted hover:text-ink hover:bg-sunken', className)}>
      <Icon name={icon} size={18} />
    </button>
  );
}

/* --------------------------------- Pills -------------------------------- */

export function Pill({ children, tone = 'neutral', className, icon }: { children: ReactNode; tone?: 'neutral' | 'red' | 'green' | 'blue' | 'amber' | 'outline'; className?: string; icon?: IconName }) {
  const t = {
    neutral: 'bg-sunken text-muted',
    red: 'bg-red-soft text-red-ink',
    green: 'bg-green-soft text-green-ink',
    blue: 'bg-blue-soft text-blue-ink',
    amber: 'bg-amber-soft text-amber',
    outline: 'border border-line text-muted',
  }[tone];
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-[540] whitespace-nowrap', t, className)}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

/* ------------------------------- Progress ------------------------------- */

export function ProgressBar({ value, tone = 'red', className, height = 4, label }: { value: number; tone?: 'red' | 'green' | 'ink' | 'blue'; className?: string; height?: number; label?: string }) {
  const c = { red: 'bg-red', green: 'bg-green', ink: 'bg-ink', blue: 'bg-blue-ink' }[tone];
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cx('w-full overflow-hidden rounded-full bg-sunken-2', className)} style={{ height }}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 44, stroke = 4, tone = 'var(--red)', children }: { value: number; size?: number; stroke?: number; tone?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset .6s' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

/* --------------------------------- Tabs --------------------------------- */

export function Tabs<T extends string>({ tabs, value, onChange, className, size = 'md' }: { tabs: { id: T; label: string; icon?: IconName; count?: number }[]; value: T; onChange: (t: T) => void; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div role="tablist" className={cx('no-scrollbar flex gap-1 overflow-x-auto', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'relative inline-flex shrink-0 items-center gap-1.5 rounded-full font-[540] transition',
            size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-[14px]',
            value === t.id ? 'bg-ink text-bg' : 'text-muted hover:bg-sunken hover:text-ink',
          )}
        >
          {t.icon && <Icon name={t.icon} size={15} />}
          {t.label}
          {t.count !== undefined && <span className={cx('num text-[11px]', value === t.id ? 'opacity-70' : 'text-faint')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Modal -------------------------------- */

export function Modal({ open, onClose, children, width = 640, label }: { open: boolean; onClose: () => void; children: ReactNode; width?: number; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <button aria-label="Close" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-pop scroll-thin relative max-h-[92vh] w-full overflow-y-auto rounded-t-[22px] bg-surface shadow-card sm:rounded-[20px]" style={{ maxWidth: width }}>
        {children}
      </div>
    </div>
  );
}

/** Bottom sheet on mobile, right-hand drawer on larger screens. */
export function Drawer({ open, onClose, children, side = 'left', label }: { open: boolean; onClose: () => void; children: ReactNode; side?: 'left' | 'right' | 'bottom'; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  const pos = side === 'bottom' ? 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-[22px] anim-sheet' : side === 'left' ? 'left-0 top-0 bottom-0 w-[min(360px,88vw)] anim-fade-up' : 'right-0 top-0 bottom-0 w-[min(400px,92vw)] anim-fade-up';
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <button aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cx('absolute flex flex-col overflow-hidden bg-surface shadow-card', pos)}>{children}</div>
    </div>
  );
}

/* --------------------------------- Toast -------------------------------- */

const ToastCtx = createContext<(msg: string, icon?: IconName) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; icon?: IconName }[]>([]);
  const n = useRef(0);
  const push = useCallback((msg: string, icon?: IconName) => {
    const id = ++n.current;
    setItems((x) => [...x.slice(-2), { id, msg, icon }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="anim-fade-up flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-[520] text-bg shadow-card">
            {t.icon && <Icon name={t.icon} size={16} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------ Misc layout ----------------------------- */

export function Section({ title, eyebrow, action, children, className }: { title?: ReactNode; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('flex flex-col gap-4', className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
            {title && <h2 className="text-[20px] font-[640] leading-tight">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Render **bold** in short strings from data/tutor. */
export function MD({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span className={cx('md', className)}>
      {parts.map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('*') && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : p))}
    </span>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
