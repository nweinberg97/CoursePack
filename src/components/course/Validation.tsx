import type { Creator, Lesson, Signals, Video } from '../../types';
import { band, coursePackScore, DEFAULT_WEIGHTS, FIT_BLEND, signalsFor, SIGNAL_META, validationScore } from '../../lib/scoring';
import { compact, cx } from '../../lib/format';
import { creator } from '../../data/creators';
import { Icon } from '../ui/Icon';
import { CreatorAvatar } from './Creator';

/* --------------------------- CoursePackScore --------------------------- */

export function CoursePackScore({ score, size = 'sm', className }: { score: number; size?: 'xs' | 'sm' | 'lg'; className?: string }) {
  if (size === 'lg') {
    return (
      <div className={cx('flex items-center gap-3', className)}>
        <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[18px] bg-ink text-bg">
          <span className="num text-[30px] font-[680] tracking-[-0.04em]">{score}</span>
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface bg-red" />
        </div>
        <div>
          <div className="eyebrow">CoursePack Score</div>
          <div className="text-[14px] font-[560]">{band(score).label} match for this point in the path</div>
        </div>
      </div>
    );
  }
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-[7px] border border-line bg-surface font-mono font-[600] text-ink', size === 'xs' ? 'h-[22px] px-1.5 text-[11.5px]' : 'h-[26px] px-2 text-[12.5px]', className)} title="CoursePack Score">
      <span className="h-[7px] w-[7px] rounded-[2px] bg-red" />
      <span className="num">{score}</span>
    </span>
  );
}

/* ----------------------------- Signal meter ---------------------------- */

export function SignalMeter({ value, className }: { value: number; className?: string }) {
  const { steps } = band(value);
  return (
    <span className={cx('inline-flex items-center gap-[3px]', className)} aria-label={`${value} out of 100`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cx('h-[10px] w-[5px] rounded-[1.5px]', i <= steps ? 'bg-ink' : 'bg-sunken-2')} />
      ))}
    </span>
  );
}

export function VideoValidation({ signals, compact: isCompact = false }: { signals: Signals; compact?: boolean }) {
  return (
    <div className={cx('grid gap-x-6', isCompact ? 'grid-cols-1 gap-y-2' : 'grid-cols-1 gap-y-2.5 sm:grid-cols-2')}>
      {(Object.keys(SIGNAL_META) as (keyof Signals)[]).map((k) => (
        <div key={k} className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted">{SIGNAL_META[k].label}</span>
          <span className="flex items-center gap-2">
            <SignalMeter value={signals[k]} />
            <span className="num w-6 text-right font-mono text-[12px] text-muted">{signals[k]}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Evidence ------------------------------ */

export function evidence(v: Video, c: Creator) {
  const { views, likes, comments, ageDays } = v.metrics;
  const share = Math.round((v.analysis.learningPositive / v.analysis.analyzed) * 100);
  const ratio = views / c.subscribers;
  const eng = ((likes + comments) / views) * 100;
  return {
    learner: `${share}% of ${v.analysis.analyzed.toLocaleString()} analysed comments describe understanding, applying, or recommending it. Typical for the topic: 12–20%.`,
    virality: `${ratio >= 1 ? ratio.toFixed(1) + '×' : Math.round(ratio * 100) + '% of'} the channel’s subscriber count in views, ${eng.toFixed(1)}% engagement rate, ${compact(Math.round(views / Math.max(ageDays, 30)))} views a day since release.`,
    authority: `${compact(c.subscribers)} subscribers. ${Math.round(c.topicFocus * 100)}% of the channel covers this subject, with ${c.consistency > 0.8 ? 'a consistent' : 'an irregular'} upload history.`,
    fit: v.fitNote,
  };
}

const HEADLINE: Record<keyof Signals, (n: number) => string> = {
  learner: (n) => (n >= 85 ? 'Strong learner feedback' : 'Positive learner feedback'),
  virality: (n) => (n >= 80 ? 'High engagement' : 'Solid engagement'),
  authority: (n) => (n >= 85 ? 'Creator authority' : 'Focused creator'),
  fit: () => 'Curriculum fit',
};

/* ------------------------------ WhyThisVideo --------------------------- */

export function WhyThisVideo({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const v = lesson.video;
  const c = creator(v.creatorId);
  const s = signalsFor(v, c);
  const score = coursePackScore(s);
  const ev = evidence(v, c);
  const rows = [{ v, cand: false as const }, ...lesson.candidates.map((x) => ({ v: x, cand: true as const }))]
    .map((r) => ({ ...r, score: coursePackScore(signalsFor(r.v, creator(r.v.creatorId))) }))
    .sort((a, b) => b.score - a.score);
  const louder = lesson.candidates.filter((x) => x.metrics.views > v.metrics.views).sort((a, b) => b.metrics.views - a.metrics.views)[0];

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-7">
        <div className="min-w-0">
          <div className="eyebrow">Why this video?</div>
          <h2 className="mt-1 text-[21px] font-[660] leading-tight">Why CoursePack selected this</h2>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-sunken hover:text-ink">
          <Icon name="x" />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-center gap-3">
          <CreatorAvatar c={c} size={40} />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-[600]">{v.title}</div>
            <div className="text-[13px] text-muted">
              {c.name} · {compact(v.metrics.views)} views · {compact(v.metrics.comments)} comments
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] bg-sunken p-4">
          <CoursePackScore score={score} size="lg" />
          <div className="font-mono text-[12px] leading-relaxed text-muted">
            <div>validation {Math.round(validationScore(s))} × {(1 - FIT_BLEND).toFixed(1)}</div>
            <div>+ curriculum fit {s.fit} × {FIT_BLEND.toFixed(1)}</div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-line">
          {(Object.keys(SIGNAL_META) as (keyof Signals)[]).map((k) => (
            <div key={k} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3.5 first:pt-0">
              <div className="text-[15px] font-[600]">{HEADLINE[k](s[k])}</div>
              <div className="flex items-center gap-2">
                <SignalMeter value={s[k]} />
                <span className="num w-7 text-right font-mono text-[12.5px]">{s[k]}</span>
              </div>
              <p className="col-span-2 text-[14px] leading-relaxed text-muted">{ev[k]}</p>
              {k !== 'fit' && (
                <div className="col-span-2 font-mono text-[11px] text-faint">
                  weight {Math.round(DEFAULT_WEIGHTS[k as keyof typeof DEFAULT_WEIGHTS] * 100)}% of validation
                </div>
              )}
              {k === 'learner' && v.analysis.quotes.length > 0 && (
                <div className="col-span-2 mt-2 flex flex-col gap-2">
                  {v.analysis.quotes.slice(0, 2).map((q) => (
                    <div key={q} className="flex gap-2.5 text-[13.5px] leading-snug">
                      <Icon name="message" size={15} className="mt-0.5 text-faint" />
                      <span className="italic text-ink/85">“{q.replace(/\*/g, '')}”</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-[620]">Compared with other candidates</h3>
            <span className="text-[12.5px] text-muted">{lesson.scanned} videos scanned for this concept</span>
          </div>
          {louder && (
            <p className="mb-3 text-[13.5px] text-muted">
              Selected over a video with <strong className="font-[600] text-ink">{compact(louder.metrics.views - v.metrics.views)} more views</strong>. Views alone don’t decide a lesson.
            </p>
          )}
          <div className="overflow-hidden rounded-[14px] border border-line">
            {rows.map((r) => {
              const rc = creator(r.v.creatorId);
              return (
                <div key={r.v.id} className={cx('flex gap-3 border-b border-line px-3.5 py-3 last:border-0', !r.cand && 'bg-green-soft/60')}>
                  <div className="pt-0.5">
                    <CoursePackScore score={r.score} size="xs" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="truncate text-[14px] font-[560]">{r.v.title}</span>
                      {!r.cand && (
                        <span className="inline-flex items-center gap-1 text-[12px] font-[600] text-green-ink">
                          <Icon name="check" size={13} /> Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-muted">
                      {rc.name} · {compact(rc.subscribers)} subs · {compact(r.v.metrics.views)} views
                    </div>
                    {r.cand && <p className="mt-1 text-[13px] leading-snug text-muted">{(r.v as { rejectedBecause: string }).rejectedBecause}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="flex gap-2 text-[12.5px] leading-relaxed text-faint">
          <Icon name="info" size={15} className="mt-0.5" />
          CoursePack uses public signals from the YouTube ecosystem to identify highly validated learning content. It’s a recommendation backed by evidence, not a claim that any video is objectively the best.
        </p>
      </div>
    </div>
  );
}
