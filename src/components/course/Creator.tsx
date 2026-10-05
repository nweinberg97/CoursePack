import type { Course, Creator } from '../../types';
import { creator } from '../../data/creators';
import { allLessons } from '../../lib/buildCourse';
import { compact, cx } from '../../lib/format';

export function CreatorAvatar({ c, size = 28, ring = false }: { c: Creator; size?: number; ring?: boolean }) {
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-[650] text-white', ring && 'ring-2 ring-surface')}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `oklch(0.52 0.12 ${c.hue})`, letterSpacing: '-0.02em' }}
      aria-hidden="true"
    >
      {c.monogram}
    </span>
  );
}

export function CreatorStack({ ids, max = 5, size = 26 }: { ids: string[]; max?: number; size?: number }) {
  const shown = ids.slice(0, max);
  return (
    <span className="inline-flex items-center">
      {shown.map((id, i) => (
        <span key={id} style={{ marginLeft: i ? -size * 0.28 : 0 }}>
          <CreatorAvatar c={creator(id)} size={size} ring />
        </span>
      ))}
      {ids.length > max && <span className="num ml-1.5 text-[12px] text-muted">+{ids.length - max}</span>}
    </span>
  );
}

export function CreatorCard({ c, course, compact: small }: { c: Creator; course?: Course; compact?: boolean }) {
  const count = course ? allLessons(course).filter((l) => l.video.creatorId === c.id).length : 0;
  return (
    <div className={cx('flex items-center gap-3', !small && 'rounded-[14px] border border-line p-3')}>
      <CreatorAvatar c={c} size={small ? 32 : 40} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-[600]">{c.name}</div>
        <div className="truncate text-[12.5px] text-muted">
          {compact(c.subscribers)} subscribers · {c.focus}
        </div>
      </div>
      {course && <span className="num shrink-0 text-[12px] text-muted">{count} lesson{count === 1 ? '' : 's'}</span>}
    </div>
  );
}
