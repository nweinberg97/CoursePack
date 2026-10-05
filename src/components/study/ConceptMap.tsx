import { useMemo, useState } from 'react';
import type { Course, CourseProgress } from '../../types';
import { allLessons } from '../../lib/buildCourse';
import { cx } from '../../lib/format';
import { href } from '../../state/router';
import { Icon } from '../ui/Icon';

/** Prerequisite graph laid out in dependency layers, coloured by confidence. */
export function ConceptMap({ course, progress }: { course: Course; progress?: CourseProgress }) {
  const [sel, setSel] = useState<string | null>(null);
  const layout = useMemo(() => {
    const keys = Object.keys(course.glossary);
    const depth: Record<string, number> = {};
    const d = (k: string, seen = new Set<string>()): number => {
      if (depth[k] !== undefined) return depth[k];
      if (seen.has(k)) return 0;
      seen.add(k);
      const req = (course.glossary[k]?.requires ?? []).filter((r) => course.glossary[r]);
      depth[k] = req.length ? Math.max(...req.map((r) => d(r, seen))) + 1 : 0;
      return depth[k];
    };
    keys.forEach((k) => d(k));
    const cols: string[][] = [];
    keys.forEach((k) => (cols[depth[k]] ??= []).push(k));
    const W = 168, H = 50, GX = 56, GY = 14;
    const maxRows = Math.max(...cols.map((c) => c.length));
    const pos: Record<string, { x: number; y: number }> = {};
    cols.forEach((col, ci) => {
      const off = ((maxRows - col.length) * (H + GY)) / 2;
      col.forEach((k, ri) => (pos[k] = { x: ci * (W + GX), y: off + ri * (H + GY) }));
    });
    return { pos, W, H, width: cols.length * (W + GX) - GX, height: maxRows * (H + GY) - GY };
  }, [course]);

  const lessons = allLessons(course);
  const status = (k: string) => {
    const conf = progress?.confidence[k];
    const covered = lessons.some((l) => l.concepts.includes(k) && progress?.completed.includes(l.id));
    if (conf === undefined && !covered) return { tone: 'todo', conf };
    const c = conf ?? 72;
    return { tone: c >= 80 ? 'strong' : c >= 65 ? 'ok' : 'weak', conf: c };
  };
  const toneCls: Record<string, string> = {
    todo: 'bg-surface text-muted ring-line',
    strong: 'bg-green-soft text-ink ring-green',
    ok: 'bg-amber-soft text-ink ring-amber',
    weak: 'bg-red-soft text-ink ring-red',
  };
  const g = sel ? course.glossary[sel] : null;
  const lesson = sel ? lessons.find((l) => l.concepts[0] === sel) ?? lessons.find((l) => l.concepts.includes(sel)) : null;
  const pad = 12;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="scroll-thin overflow-x-auto rounded-[18px] bg-sunken/60 p-4 ring-1 ring-line">
        <div className="relative" style={{ width: layout.width + pad * 2, height: layout.height + pad * 2 }}>
          <svg className="absolute inset-0" width={layout.width + pad * 2} height={layout.height + pad * 2} aria-hidden="true">
            {Object.entries(course.glossary).flatMap(([k, gl]) =>
              (gl.requires ?? []).filter((r) => layout.pos[r]).map((r) => {
                const a = layout.pos[r], b = layout.pos[k];
                const x1 = a.x + layout.W + pad, y1 = a.y + layout.H / 2 + pad, x2 = b.x + pad, y2 = b.y + layout.H / 2 + pad;
                const on = sel === k || sel === r;
                return <path key={r + k} d={`M${x1},${y1} C${x1 + 30},${y1} ${x2 - 30},${y2} ${x2},${y2}`} fill="none" stroke={on ? 'var(--ink)' : 'var(--line-strong)'} strokeWidth={on ? 1.8 : 1.2} />;
              }),
            )}
          </svg>
          {Object.keys(course.glossary).map((k) => {
            const s = status(k);
            const p = layout.pos[k];
            return (
              <button
                key={k}
                onClick={() => setSel(sel === k ? null : k)}
                className={cx('absolute flex items-center justify-between gap-2 rounded-[12px] px-3 text-left text-[13px] font-[580] ring-1 transition hover:-translate-y-[1px]', toneCls[s.tone], sel === k && 'ring-2 ring-ink')}
                style={{ left: p.x + pad, top: p.y + pad, width: layout.W, height: layout.H }}
              >
                <span className="truncate">{course.glossary[k].term}</span>
                {s.conf !== undefined && <span className="num shrink-0 font-mono text-[11px] text-muted">{s.conf}%</span>}
              </button>
            );
          })}
        </div>
      </div>
      <aside className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
          {[['bg-green', 'Strong'], ['bg-amber', 'Developing'], ['bg-red', 'Review'], ['bg-line-strong', 'Not yet studied']].map(([c, l]) => (
            <span key={l} className="inline-flex items-center gap-1.5"><span className={cx('h-2.5 w-2.5 rounded-full', c)} /> {l}</span>
          ))}
        </div>
        {g ? (
          <div className="anim-fade-up rounded-[16px] p-4 ring-1 ring-line">
            <div className="eyebrow">{g.skill}</div>
            <div className="mt-1 text-[18px] font-[650]">{g.term}</div>
            <p className="mt-1.5 text-[14px] text-muted">{g.def}</p>
            {g.example && <p className="mt-2 text-[13.5px] italic">{g.example}</p>}
            {g.requires?.length ? <p className="mt-3 text-[12.5px] text-muted">Builds on: {g.requires.map((r) => course.glossary[r]?.term).join(', ')}</p> : null}
            {lesson && (
              <a href={href('learn', course.id, lesson.id)} className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-[600] hover:underline">
                <Icon name="play" size={13} fill /> {lesson.title}
              </a>
            )}
          </div>
        ) : (
          <p className="text-[14px] text-muted">Concepts flow left to right: each one builds on the ones it’s connected to. Select a concept to see what it depends on and where it’s taught.</p>
        )}
      </aside>
    </div>
  );
}
