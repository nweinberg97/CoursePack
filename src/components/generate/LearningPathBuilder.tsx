import { useEffect, useMemo, useState } from 'react';
import type { Course, Lesson } from '../../types';
import { creator, GENERALISTS } from '../../data/creators';
import { allLessons } from '../../lib/buildCourse';
import { coursePackScore, signalsFor } from '../../lib/scoring';
import { approxHours, compact, cx } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { CreatorAvatar } from '../course/Creator';
import { CoursePackScore } from '../course/Validation';

export const BUILD_STEPS = [
  'Searching relevant videos',
  'Analyzing learner feedback',
  'Comparing engagement',
  'Evaluating creator authority',
  'Mapping concepts',
  'Identifying prerequisites',
  'Sequencing lessons',
  'Building projects',
];

const STEP_MS = [1500, 1300, 1100, 1100, 1000, 1000, 1200, 900];

export function useBuildProgress(key: string, skip: boolean) {
  const [step, setStep] = useState(0);
  const [t, setT] = useState(0);
  useEffect(() => {
    setStep(0);
    setT(0);
  }, [key]);
  useEffect(() => {
    if (skip) {
      setStep(BUILD_STEPS.length);
      return;
    }
    if (step >= BUILD_STEPS.length) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / STEP_MS[step]);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setStep((s) => s + 1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, skip, key]);
  return { step, t, done: step >= BUILD_STEPS.length };
}

/** The checklist half of the build experience. */
export function BuildSteps({ step, t }: { step: number; t: number }) {
  return (
    <ol className="flex flex-col">
      {BUILD_STEPS.map((s, i) => {
        const state = i < step ? 'done' : i === step ? 'active' : 'todo';
        return (
          <li key={s} className="relative flex items-center gap-3.5 py-2.5">
            <span className={cx('flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition', state === 'done' ? 'bg-ink text-bg' : state === 'active' ? 'border-2 border-red' : 'border-[1.5px] border-line-strong')}>
              {state === 'done' && <Icon name="check" size={13} strokeWidth={2.6} />}
              {state === 'active' && <span className="anim-pulse h-2 w-2 rounded-full bg-red" />}
            </span>
            <span className={cx('text-[16px] transition', state === 'todo' ? 'text-faint' : state === 'active' ? 'font-[600]' : 'text-ink')}>{s}</span>
            {state === 'active' && (
              <span className="ml-auto h-[3px] w-14 overflow-hidden rounded-full bg-sunken-2">
                <span className="block h-full bg-red" style={{ width: `${t * 100}%` }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The "what the system is doing" half: shows real data from the course being built. */
export function BuildLiveView({ course, step, t }: { course: Course; step: number; t: number }) {
  const lessons = useMemo(() => allLessons(course), [course]);
  const comments = useMemo(() => lessons.reduce((a, l) => a + l.video.analysis.analyzed + l.candidates.reduce((b, c) => b + c.analysis.analyzed, 0), 0) * 11, [lessons]);
  const featured = useMemo(() => pickFeatured(lessons), [lessons]);
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const prog = step > 7 ? 1 : ease(t);

  const panel = (() => {
    switch (Math.min(step, 7)) {
      case 0: {
        const titles = lessons.flatMap((l) => [l.video.title, ...l.candidates.map((c) => c.title)]);
        const shown = Math.max(1, Math.floor(prog * 7));
        return (
          <Panel title="Candidate videos" metric={`${Math.round(course.scanned * prog).toLocaleString()} scanned`}>
            <ul className="flex flex-col gap-1.5">
              {titles.slice(0, 40).filter((_, i) => i % 3 === 0).slice(0, shown).map((x, i) => (
                <li key={x + i} className="anim-fade-up flex items-center gap-2.5 text-[13.5px]">
                  <Icon name="play" size={13} className="text-faint" />
                  <span className="truncate">{x}</span>
                </li>
              ))}
            </ul>
          </Panel>
        );
      }
      case 1:
        return (
          <Panel title="Comment analysis" metric={`${compact(Math.round(comments * prog))} comments classified`}>
            <div className="flex flex-col gap-2.5">
              {featured.video.analysis.quotes.slice(0, Math.max(1, Math.ceil(prog * 3))).map((q) => (
                <div key={q} className="anim-fade-up flex gap-2.5 rounded-[12px] bg-sunken p-3 text-[13.5px] leading-snug">
                  <Icon name="thumbs-up" size={15} className="mt-0.5 text-green-ink" />
                  <span>“{q.replace(/\*/g, '')}”</span>
                </div>
              ))}
              <div className="text-[12.5px] text-muted">Looking for comments where people say they understood it, applied it, or recommend it.</div>
            </div>
          </Panel>
        );
      case 2: {
        const rows = [featured.video, ...featured.candidates].map((v) => ({ v, c: creator(v.creatorId) })).sort((a, b) => b.v.metrics.views - a.v.metrics.views);
        return (
          <Panel title="Relative performance" metric="views ÷ channel reach">
            <div className="flex flex-col gap-3">
              {rows.map(({ v, c }) => {
                const ratio = v.metrics.views / c.subscribers;
                return (
                  <div key={v.id} className="flex flex-col gap-1">
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="truncate">{v.title}</span>
                      <span className="num shrink-0 font-mono text-[12px] text-muted">{ratio.toFixed(2)}×</span>
                    </div>
                    <div className="h-[6px] overflow-hidden rounded-full bg-sunken-2">
                      <div className={cx('h-full rounded-full transition-all duration-700', v.id === featured.video.id ? 'bg-red' : 'bg-line-strong')} style={{ width: `${Math.min(100, (ratio / 6) * 100) * prog}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        );
      }
      case 3: {
        const ids = Array.from(new Set([...course.creators, ...GENERALISTS.slice(0, 4)]));
        return (
          <Panel title="Creators evaluated" metric={`${course.creators.length} selected`}>
            <div className="flex flex-wrap gap-2">
              {ids.slice(0, Math.ceil(ids.length * prog)).map((id) => {
                const c = creator(id);
                const sel = course.creators.includes(id);
                return (
                  <span key={id} className={cx('anim-fade-up inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12.5px]', sel ? 'bg-green-soft text-ink' : 'bg-sunken text-faint line-through')}>
                    <CreatorAvatar c={c} size={22} /> {c.name}
                  </span>
                );
              })}
            </div>
          </Panel>
        );
      }
      case 4: {
        const terms = Object.values(course.glossary);
        return (
          <Panel title="Concepts found in transcripts" metric={`${terms.length} concepts`}>
            <div className="flex flex-wrap gap-1.5">
              {terms.slice(0, Math.ceil(terms.length * prog)).map((g) => (
                <span key={g.term} className="anim-fade-up rounded-[8px] bg-sunken px-2.5 py-1 font-mono text-[12px]">{g.term}</span>
              ))}
            </div>
          </Panel>
        );
      }
      case 5: {
        const edges = Object.values(course.glossary).flatMap((g) => (g.requires ?? []).map((r) => [course.glossary[r]?.term, g.term] as const)).filter(([a]) => a);
        return (
          <Panel title="Prerequisite graph" metric={`${edges.length} dependencies`}>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {edges.slice(0, Math.max(1, Math.ceil(Math.min(edges.length, 10) * prog))).map(([a, b]) => (
                <li key={a + b} className="anim-fade-up flex items-center gap-1.5 font-mono text-[12px]">
                  <span className="rounded-[6px] bg-sunken px-1.5 py-0.5">{a}</span>
                  <Icon name="arrow-right" size={12} className="text-faint" />
                  <span className="rounded-[6px] bg-sunken px-1.5 py-0.5">{b}</span>
                </li>
              ))}
            </ul>
          </Panel>
        );
      }
      case 6:
        return (
          <Panel title="Sequence" metric={`${course.modules.length} modules`}>
            <ol className="flex flex-col gap-1.5">
              {course.modules.slice(0, Math.max(1, Math.ceil(course.modules.length * prog))).map((m) => (
                <li key={m.id} className="anim-fade-up flex items-center gap-3 text-[13.5px]">
                  <span className="num w-5 font-mono text-[12px] text-faint">{String(m.index).padStart(2, '0')}</span>
                  <span className="font-[560]">{m.title}</span>
                  <span className="ml-auto text-[12px] text-muted">{m.lessons.length} lessons</span>
                </li>
              ))}
            </ol>
          </Panel>
        );
      default:
        return (
          <Panel title="Final project" metric="outcome">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-ink text-bg">
                <Icon name="hammer" size={19} />
              </span>
              <div>
                <div className="text-[15px] font-[620]">{course.finalProject.title}</div>
                <div className="text-[13.5px] text-muted">{course.finalProject.summary}</div>
              </div>
            </div>
          </Panel>
        );
    }
  })();

  const stats: [string, string, number][] = [
    [course.scanned.toLocaleString(), 'videos scanned', 0],
    [compact(comments), 'comments read', 1],
    [String(course.creators.length), 'creators chosen', 3],
    [String(Object.keys(course.glossary).length), 'concepts mapped', 4],
    [String(lessons.length), 'lessons sequenced', 6],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-line ring-1 ring-line sm:grid-cols-5">
        {stats.map(([n, l, at]) => (
          <div key={l} className="bg-surface px-3.5 py-3">
            <div className={cx('num text-[17px] font-[660] tracking-[-0.02em] transition-colors', step > at ? 'text-ink' : 'text-line-strong')}>{step > at ? n : '—'}</div>
            <div className="text-[11.5px] text-muted">{l}</div>
          </div>
        ))}
      </div>
      <div key={Math.min(step, 7)} className="anim-fade-up">{panel}</div>
    </div>
  );
}

function Panel({ title, metric, children }: { title: string; metric: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] bg-surface p-5 ring-1 ring-line">
      <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
        <div className="anim-scan h-full w-1/3 bg-gradient-to-r from-transparent via-red to-transparent" />
      </div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <span className="eyebrow">{title}</span>
        <span className="num font-mono text-[12px] text-muted">{metric}</span>
      </div>
      {children}
    </div>
  );
}

/** The lesson whose selection tells the clearest story: a winner with fewer views than a rejected candidate. */
export function pickFeatured(lessons: Lesson[]): Lesson {
  let best = lessons[0];
  let gap = -Infinity;
  for (const l of lessons) {
    const louder = Math.max(...l.candidates.map((c) => c.metrics.views));
    const g = louder - l.video.metrics.views;
    if (g > gap && l.kind === 'lesson') {
      gap = g;
      best = l;
    }
  }
  return best;
}

export function SelectionHighlight({ lesson, total, onWhy }: { lesson: Lesson; total: number; onWhy: () => void }) {
  const v = lesson.video;
  const c = creator(v.creatorId);
  const loud = [...lesson.candidates].sort((a, b) => b.metrics.views - a.metrics.views)[0];
  const lc = creator(loud.creatorId);
  return (
    <div className="rounded-[18px] bg-sunken p-4 sm:p-5">
      <div className="eyebrow mb-3">One of {total} selections · {lesson.title}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[14px] bg-surface p-3.5 ring-2 ring-green">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[12px] font-[600] text-green-ink">
              <Icon name="check" size={13} /> Selected
            </span>
            <CoursePackScore score={coursePackScore(signalsFor(v, c))} size="xs" />
          </div>
          <div className="mt-2 text-[14px] font-[600] leading-snug">{v.title}</div>
          <div className="mt-1 text-[12.5px] text-muted">{c.name} · {compact(v.metrics.views)} views</div>
        </div>
        <div className="rounded-[14px] bg-surface/60 p-3.5 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[560] text-muted">Not selected</span>
            <CoursePackScore score={coursePackScore(signalsFor(loud, lc))} size="xs" />
          </div>
          <div className="mt-2 text-[14px] font-[560] leading-snug text-muted">{loud.title}</div>
          <div className="mt-1 text-[12.5px] text-muted">{lc.name} · {compact(loud.metrics.views)} views</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13.5px] text-muted">{loud.metrics.views > v.metrics.views ? `${compact(loud.metrics.views - v.metrics.views)} fewer views, much stronger learner feedback.` : 'Stronger learner feedback and a better fit at this point.'}</p>
        <button onClick={onWhy} className="inline-flex items-center gap-1 text-[13.5px] font-[600] text-ink hover:underline">
          Why this video? <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  );
}

export function BuiltSummary({ course }: { course: Course }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      {[
        [course.modules.length, 'modules'],
        [allLessons(course).length, 'lessons'],
        [course.creators.length, 'creators'],
        [approxHours(course.minutes).replace('~', ''), 'of video'],
      ].map(([n, l]) => (
        <div key={String(l)} className="flex flex-col">
          <span className="num text-[28px] font-[680] tracking-[-0.03em]">{n}</span>
          <span className="text-[13px] text-muted">{l}</span>
        </div>
      ))}
    </div>
  );
}
