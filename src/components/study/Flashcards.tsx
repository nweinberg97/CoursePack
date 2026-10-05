import { useEffect, useState } from 'react';
import type { Course } from '../../types';
import { cx } from '../../lib/format';
import { useStore } from '../../state/store';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/primitives';

export function Flashcard({ front, back, example, flipped, onFlip }: { front: string; back: string; example?: string; flipped: boolean; onFlip: () => void }) {
  return (
    <button onClick={onFlip} aria-label={flipped ? 'Show question' : 'Show answer'} className="group relative block aspect-[16/10] w-full max-w-full [perspective:1400px] sm:aspect-[16/9]">
      <span className={cx('relative block h-full w-full rounded-[22px] transition-transform duration-500 [transform-style:preserve-3d]', flipped && '[transform:rotateY(180deg)]')}>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[22px] bg-surface p-6 text-center ring-1 ring-line [backface-visibility:hidden]">
          <span className="eyebrow">Concept</span>
          <span className="text-[clamp(26px,4.4vw,44px)] font-[680] leading-tight tracking-[-0.03em]">What is {/^[A-Z]{2,}/.test(front) ? front : front.toLowerCase()}?</span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-muted"><Icon name="refresh" size={14} /> Tap to flip</span>
        </span>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[22px] bg-ink p-6 text-center text-bg [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-10">
          <span className="font-mono text-[11.5px] uppercase tracking-[0.08em] opacity-60">{front}</span>
          <span className="max-w-[44ch] text-[clamp(17px,2.2vw,22px)] font-[560] leading-snug">{back}</span>
          {example && <span className="max-w-[48ch] text-[14px] opacity-65">{example}</span>}
        </span>
      </span>
    </button>
  );
}

export function FlashcardDeck({ course }: { course: Course }) {
  const { dispatch } = useStore();
  const cards = Object.entries(course.glossary);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [k, g] = cards[i];

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === 'ArrowRight') { setI((x) => Math.min(cards.length - 1, x + 1)); setFlipped(false); }
      if (e.key === 'ArrowLeft') { setI((x) => Math.max(0, x - 1)); setFlipped(false); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [cards.length]);

  const grade = (ok: boolean) => {
    dispatch({ type: 'answer', courseId: course.id, concept: k, correct: ok });
    setKnown((s) => {
      const n = new Set(s);
      ok ? n.add(k) : n.delete(k);
      return n;
    });
    setFlipped(false);
    setI((x) => (x + 1) % cards.length);
  };

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <div className="flex items-center justify-between text-[13px] text-muted">
        <span className="num">Card {i + 1} of {cards.length}</span>
        <span className="num">{known.size} known this session</span>
      </div>
      <Flashcard front={g.term} back={g.def} example={g.example} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          <Button variant="quiet" size="sm" icon="chevron-left" disabled={i === 0} onClick={() => { setI(i - 1); setFlipped(false); }}>Prev</Button>
          <Button variant="quiet" size="sm" iconRight="chevron-right" disabled={i === cards.length - 1} onClick={() => { setI(i + 1); setFlipped(false); }}>Next</Button>
        </div>
        {flipped ? (
          <div className="anim-fade-up flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => grade(false)}>Review again</Button>
            <Button size="sm" variant="ink" icon="check" onClick={() => grade(true)}>I knew it</Button>
          </div>
        ) : (
          <span className="hidden text-[12.5px] text-faint sm:inline">Space to flip · ← → to move</span>
        )}
      </div>
    </div>
  );
}
