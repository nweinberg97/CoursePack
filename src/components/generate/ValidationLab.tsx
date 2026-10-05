import { useMemo, useState } from 'react';
import { DEMO_CREATORS, DEMO_VIDEOS } from '../../data/demo';
import { coursePackScore, DEFAULT_WEIGHTS, signalsFor, SIGNAL_META, type Weights } from '../../lib/scoring';
import { clock, compact, cx } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { CoursePackScore, SignalMeter } from '../course/Validation';
import { CreatorAvatar } from '../course/Creator';

/**
 * Interactive demonstration of the validation model on one concept.
 * Toggle between "most views" and CoursePack ranking, and change weights.
 */
export function ValidationLab() {
  const [mode, setMode] = useState<'views' | 'coursepack'>('coursepack');
  const [w, setW] = useState<Weights>(DEFAULT_WEIGHTS);
  const rows = useMemo(() => {
    const r = DEMO_VIDEOS.map((v) => {
      const s = signalsFor(v, DEMO_CREATORS[v.creatorId]);
      return { v, s, score: coursePackScore(s, w) };
    });
    return r.sort((a, b) => (mode === 'views' ? b.v.metrics.views - a.v.metrics.views : b.score - a.score));
  }, [mode, w]);
  const total = w.learner + w.virality + w.authority;
  const pct = (k: keyof Weights) => Math.round((w[k] / total) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 rounded-[20px] bg-surface p-3 ring-1 ring-line sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
          <div>
            <div className="eyebrow">Concept · Python functions</div>
            <div className="text-[14px] text-muted">4 of 212 candidates shown</div>
          </div>
          <div className="inline-flex rounded-full bg-sunken p-1" role="radiogroup" aria-label="Ranking method">
            {(['views', 'coursepack'] as const).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cx('h-8 rounded-full px-3.5 text-[13px] font-[560] transition', mode === m ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}>
                {m === 'views' ? 'Most viewed' : 'CoursePack'}
              </button>
            ))}
          </div>
        </div>
        <ol className="flex flex-col gap-1.5">
          {rows.map((r, i) => {
            const c = DEMO_CREATORS[r.v.creatorId];
            const top = i === 0;
            return (
              <li key={r.v.id} className={cx('grid grid-cols-[22px_1fr_auto] items-start gap-3 rounded-[14px] p-3 transition-all duration-300', top && mode === 'coursepack' ? 'bg-green-soft/70' : top ? 'bg-sunken' : '')}>
                <span className="num pt-0.5 font-mono text-[13px] text-faint">{i + 1}</span>
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-[600]">{r.v.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CreatorAvatar c={c} size={15} /> {c.name}
                    </span>
                    <span>{compact(c.subscribers)} subs</span>
                    <span className={cx(mode === 'views' && 'font-[600] text-ink')}>{compact(r.v.metrics.views)} views</span>
                    <span>{clock(r.v.duration)}</span>
                  </div>
                  <div className="mt-2 hidden flex-wrap gap-x-4 gap-y-1 sm:flex">
                    {(Object.keys(SIGNAL_META) as (keyof typeof SIGNAL_META)[]).map((k) => (
                      <span key={k} className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
                        {SIGNAL_META[k].short} <SignalMeter value={r.s[k]} />
                      </span>
                    ))}
                  </div>
                  {top && mode === 'coursepack' && (
                    <div className="mt-2 text-[13px] italic text-ink/80">“{r.v.analysis.quotes[0]}”</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CoursePackScore score={r.score} />
                  {top && mode === 'coursepack' && <span className="text-[11.5px] font-[600] text-green-ink">Selected</span>}
                </div>
              </li>
            );
          })}
        </ol>
        {mode === 'views' && (
          <p className="mt-3 flex gap-2 px-1 text-[13px] text-muted">
            <Icon name="info" size={15} className="mt-0.5" /> The most-viewed result is a 12-hour course where functions start three hours in. Popular isn’t the same as learnable.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5 rounded-[20px] bg-sunken p-5">
        <div>
          <div className="eyebrow">Validation weights</div>
          <p className="mt-1 text-[13.5px] text-muted">Adjust how much each signal counts. Curriculum fit adds 20% on top.</p>
        </div>
        {(['learner', 'virality', 'authority'] as const).map((k) => (
          <label key={k} className="flex flex-col gap-1.5" htmlFor={`w-${k}`}>
            <span className="flex items-baseline justify-between text-[13.5px] font-[560]">
              {SIGNAL_META[k].label}
              <span className="num font-mono text-[12.5px] text-muted">{pct(k)}%</span>
            </span>
            <input id={`w-${k}`} type="range" min={0} max={1} step={0.05} value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} className="accent-[var(--red)]" />
            <span className="text-[12px] leading-snug text-faint">{SIGNAL_META[k].explain}</span>
          </label>
        ))}
        <button onClick={() => setW(DEFAULT_WEIGHTS)} className="self-start text-[13px] font-[560] text-muted underline-offset-4 hover:text-ink hover:underline">
          Reset to 40 / 35 / 25
        </button>
      </div>
    </div>
  );
}
