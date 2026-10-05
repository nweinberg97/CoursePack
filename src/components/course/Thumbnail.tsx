import type { ThumbStyle } from '../../types';
import { clock, cx } from '../../lib/format';
import { rng } from '../../lib/random';

/**
 * Generated "YouTube-style" thumbnail. Stands in for the real thumbnail
 * image a production build would pull from the video metadata.
 */
export function Thumbnail({ thumb, duration, className, size = 'md', showKicker = true, raised }: { thumb: ThumbStyle; duration?: number; className?: string; size?: 'sm' | 'md' | 'lg'; showKicker?: boolean; raised?: boolean }) {
  const h = thumb.hue;
  const bg = `radial-gradient(120% 90% at 85% 10%, oklch(0.42 0.11 ${h}) 0%, oklch(0.22 0.05 ${h}) 55%, oklch(0.14 0.02 ${h}) 100%)`;
  const r = rng(thumb.headline + thumb.variant);
  const fs = size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[clamp(22px,4.2vw,44px)]' : 'text-[clamp(16px,2.4vw,22px)]';
  return (
    <div className={cx('relative aspect-video w-full max-w-full overflow-hidden select-none', className)} style={{ background: bg }}>
      <Motif variant={thumb.variant} hue={h} seed={r} />
      <div className={cx('absolute inset-0 flex flex-col', raised ? 'justify-start p-[5%] pt-[7%]' : 'justify-end', !raised && (size === 'sm' ? 'p-2.5' : size === 'lg' ? 'p-[5%]' : 'p-4'))}>
        {showKicker && size !== 'sm' && (
          <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/60">{thumb.kicker}</div>
        )}
        <div className={cx(raised ? 'max-w-[55%]' : 'max-w-[78%]', 'font-[780] leading-[0.98] tracking-[-0.035em] text-white', fs)} style={{ textShadow: '0 2px 18px rgba(0,0,0,.35)' }}>
          {thumb.headline}
        </div>
      </div>
      {duration !== undefined && (
        <span className="num absolute bottom-1.5 right-1.5 rounded-[4px] bg-black/80 px-1.5 py-[1px] text-[11.5px] font-[560] text-white">{clock(duration)}</span>
      )}
    </div>
  );
}

function Motif({ variant, hue, seed }: { variant: ThumbStyle['variant']; hue: number; seed: ReturnType<typeof rng> }) {
  const accent = `oklch(0.78 0.14 ${(hue + 40) % 360})`;
  if (variant === 'code') {
    const lines = Array.from({ length: 9 }, () => ({ indent: seed.int(0, 3), w: seed.int(18, 60), c: seed.next() > 0.7 }));
    return (
      <div className="absolute right-[6%] top-[12%] flex w-[46%] flex-col gap-[7%] opacity-80" style={{ height: '62%' }}>
        {lines.map((l, i) => (
          <div key={i} className="flex gap-[3%]" style={{ paddingLeft: `${l.indent * 8}%` }}>
            <span className="h-[5px] rounded-full" style={{ width: `${l.w * 0.4}%`, background: l.c ? accent : 'rgba(255,255,255,.35)' }} />
            <span className="h-[5px] rounded-full bg-white/15" style={{ width: `${l.w * 0.6}%` }} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'diagram') {
    const nodes = [[70, 22], [86, 44], [64, 58], [82, 74], [52, 34]];
    return (
      <svg className="absolute inset-0 h-full w-full opacity-90" viewBox="0 0 100 56.25" preserveAspectRatio="none">
        {[[0, 1], [1, 2], [2, 3], [0, 4], [4, 2]].map(([a, b], i) => (
          <line key={i} x1={nodes[a][0]} y1={nodes[a][1] * 0.5625} x2={nodes[b][0]} y2={nodes[b][1] * 0.5625} stroke="rgba(255,255,255,.28)" strokeWidth=".35" />
        ))}
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y * 0.5625} r={i === 2 ? 3.2 : 2.1} fill={i === 2 ? accent : 'rgba(255,255,255,.75)'} />
        ))}
      </svg>
    );
  }
  if (variant === 'type') {
    return (
      <div className="absolute -right-[4%] -top-[18%] font-[800] leading-none tracking-[-0.08em] text-white/[0.09]" style={{ fontSize: '170%', transform: 'scale(5)', transformOrigin: 'top right' }}>
        Aa
      </div>
    );
  }
  if (variant === 'grid') {
    return (
      <div className="absolute right-[5%] top-[12%] grid w-[44%] grid-cols-4 gap-[4px] opacity-85">
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className="h-[9px] rounded-[2px]" style={{ background: i < 4 ? accent : `rgba(255,255,255,${0.1 + seed.next() * 0.22})` }} />
        ))}
      </div>
    );
  }
  return (
    <div className="absolute right-[5%] top-[18%] flex h-[42%] w-[48%] items-center gap-[2.5%]">
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i} className="flex-1 rounded-full" style={{ height: `${18 + Math.abs(Math.sin(i * 0.7 + seed.next())) * 82}%`, background: i > 14 ? 'rgba(255,255,255,.22)' : accent, opacity: 0.85 }} />
      ))}
    </div>
  );
}
