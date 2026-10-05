import { useMemo, useState } from 'react';
import type { Exercise, QuizQuestion } from '../../types';
import { cx } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/primitives';

/** Multiple-choice quiz with immediate feedback. Reports each answer upward. */
export function QuizCard({ questions, onAnswer, onFinish, title = 'Quick check', compact }: { questions: QuizQuestion[]; onAnswer?: (q: QuizQuestion, correct: boolean) => void; onFinish?: (score: number) => void; title?: string; compact?: boolean }) {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = questions[i];
  if (!q) return null;

  if (finished) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[18px] bg-sunken p-5">
        <div className="flex items-center gap-2.5">
          <span className={cx('flex h-9 w-9 items-center justify-center rounded-full', score === questions.length ? 'bg-green text-white' : 'bg-ink text-bg')}>
            <Icon name={score === questions.length ? 'check' : 'target'} size={18} />
          </span>
          <div>
            <div className="text-[16px] font-[640]">{score} of {questions.length} correct</div>
            <div className="text-[13px] text-muted">{score === questions.length ? 'Solid. Your confidence on these concepts went up.' : 'Worth a quick rewatch of the sections you missed.'}</div>
          </div>
        </div>
        <Button size="sm" icon="refresh" onClick={() => { setI(0); setPick(null); setScore(0); setFinished(false); }}>Try again</Button>
      </div>
    );
  }

  return (
    <div className={cx('flex flex-col gap-4 rounded-[18px] ring-1 ring-line', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow">{title}</div>
        <div className="flex gap-1">
          {questions.map((_, k) => (
            <span key={k} className={cx('h-1.5 w-5 rounded-full', k < i ? 'bg-ink' : k === i ? 'bg-red' : 'bg-sunken-2')} />
          ))}
        </div>
      </div>
      <div className="text-[16px] font-[600] leading-snug">{q.prompt}</div>
      <div className="flex flex-col gap-2">
        {q.options.map((o, k) => {
          const state = pick === null ? 'idle' : k === q.answer ? 'right' : k === pick ? 'wrong' : 'dim';
          return (
            <button
              key={o}
              disabled={pick !== null}
              onClick={() => {
                setPick(k);
                const ok = k === q.answer;
                if (ok) setScore((s) => s + 1);
                onAnswer?.(q, ok);
              }}
              className={cx(
                'flex items-start gap-3 rounded-[12px] border px-3.5 py-3 text-left text-[14px] leading-snug transition',
                state === 'idle' && 'border-line hover:border-line-strong hover:bg-sunken',
                state === 'right' && 'border-green bg-green-soft',
                state === 'wrong' && 'border-red bg-red-soft',
                state === 'dim' && 'border-line opacity-50',
              )}
            >
              <span className={cx('mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-[600]', state === 'right' ? 'border-green bg-green text-white' : state === 'wrong' ? 'border-red bg-red text-white' : 'border-line-strong text-muted')}>
                {state === 'right' ? <Icon name="check" size={12} strokeWidth={2.6} /> : state === 'wrong' ? <Icon name="x" size={12} strokeWidth={2.6} /> : String.fromCharCode(65 + k)}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {pick !== null && (
        <div className="anim-fade-up flex flex-col gap-3">
          <p className="text-[14px] text-muted"><span className="font-[600] text-ink">{pick === q.answer ? 'Correct.' : 'Not quite.'}</span> {q.explanation}</p>
          <Button
            variant="ink"
            size="sm"
            className="self-start"
            iconRight="arrow-right"
            onClick={() => {
              if (i + 1 >= questions.length) {
                setFinished(true);
                onFinish?.(score);
              } else {
                setI(i + 1);
                setPick(null);
              }
            }}
          >
            {i + 1 >= questions.length ? 'See result' : 'Next question'}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Hands-on exercise with rubric checks. Code, SQL or written answers. */
export function PracticeExercise({ ex, passed, onPass, topic }: { ex: Exercise; passed: boolean; onPass: () => void; topic: string }) {
  const [value, setValue] = useState(ex.starter ?? '');
  const [ran, setRan] = useState(false);
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  const results = useMemo(() => ex.checks.map((c) => ({ ...c, ok: new RegExp(c.pattern, 'i').test(value) })), [ex, value]);
  const allOk = results.every((r) => r.ok);
  const isCode = ex.kind !== 'text';

  const run = () => {
    setRan(true);
    if (allOk && !passed) onPass();
  };

  return (
    <div className="flex flex-col gap-4 rounded-[18px] ring-1 ring-line">
      <div className="flex items-start gap-3 px-5 pt-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sunken">
          <Icon name={isCode ? 'code' : 'pen'} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">Exercise · {topic}</span>
            {passed && <span className="inline-flex items-center gap-1 text-[12px] font-[600] text-green-ink"><Icon name="check" size={13} /> Passed</span>}
          </div>
          <div className="mt-1 text-[15.5px] font-[600] leading-snug">{ex.prompt}</div>
        </div>
      </div>
      <div className="px-5">
        <div className={cx('overflow-hidden rounded-[12px]', isCode ? 'bg-stage' : 'bg-sunken')}>
          {isCode && (
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 font-mono text-[11px] text-white/50">
              <span>{ex.language === 'sql' ? 'query.sql' : 'main.py'}</span>
              <span>{ex.language}</span>
            </div>
          )}
          <label htmlFor={`ex-${ex.prompt.length}`} className="sr-only">Your answer</label>
          <textarea
            id={`ex-${ex.prompt.length}`}
            value={value}
            spellCheck={!isCode}
            onChange={(e) => { setValue(e.target.value); setRan(false); }}
            rows={isCode ? Math.max(8, (ex.starter ?? '').split('\n').length + 2) : 5}
            placeholder={isCode ? '' : 'Write your answer…'}
            className={cx('block w-full resize-y bg-transparent p-3.5 outline-none', isCode ? 'font-mono text-[12.5px] leading-[1.65] text-white/90' : 'text-[14.5px] leading-relaxed')}
          />
        </div>
      </div>

      {ran && (
        <div className="anim-fade-up flex flex-col gap-3 px-5">
          <ul className="flex flex-col gap-1.5">
            {results.map((r) => (
              <li key={r.label} className={cx('flex items-center gap-2 text-[13.5px]', r.ok ? 'text-green-ink' : 'text-muted')}>
                <Icon name={r.ok ? 'check-circle' : 'circle'} size={16} /> {r.label}
              </li>
            ))}
          </ul>
          {allOk && ex.resultPreview && (
            <div className="overflow-x-auto rounded-[12px] ring-1 ring-line">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-sunken font-mono text-[11.5px] text-muted">
                  <tr>{ex.resultPreview.columns.map((c) => <th key={c} className="px-3 py-2 font-[500]">{c}</th>)}</tr>
                </thead>
                <tbody className="num">
                  {ex.resultPreview.rows.map((r, i) => (
                    <tr key={i} className="border-t border-line">{r.map((v, j) => <td key={j} className="px-3 py-1.5 font-mono">{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-line px-3 py-1.5 font-mono text-[11px] text-faint">5 rows · sample dataset</div>
            </div>
          )}
          <p className={cx('text-[14px]', allOk ? 'font-[560] text-green-ink' : 'text-muted')}>
            {allOk ? 'All checks pass. Nice work.' : `${results.filter((r) => r.ok).length} of ${results.length} checks passing. ${hint ? '' : 'Need a nudge? Show the hint.'}`}
          </p>
        </div>
      )}

      {hint && <div className="anim-fade-up mx-5 rounded-[12px] bg-amber-soft px-3.5 py-2.5 text-[13.5px]"><span className="font-[600]">Hint.</span> {ex.hint}</div>}
      {solution && <pre className="anim-fade-up scroll-thin mx-5 overflow-x-auto rounded-[12px] bg-sunken p-3.5 font-mono text-[12px] leading-relaxed">{ex.solution}</pre>}

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ink" size="sm" icon={isCode ? 'play' : 'check'} onClick={run}>{isCode ? 'Run checks' : 'Check answer'}</Button>
        {!hint && <Button variant="quiet" size="sm" onClick={() => setHint(true)}>Show hint</Button>}
        {ran && !allOk && !solution && <Button variant="quiet" size="sm" onClick={() => setSolution(true)}>Show a solution</Button>}
      </div>
    </div>
  );
}
