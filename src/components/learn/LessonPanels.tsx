import { useMemo, useState } from 'react';
import type { Course, Lesson } from '../../types';
import { creator } from '../../data/creators';
import { coursePackScore, signalsFor } from '../../lib/scoring';
import { clock, cx, relTime } from '../../lib/format';
import { useStore } from '../../state/store';
import { Icon } from '../ui/Icon';
import { Button, useToast } from '../ui/primitives';
import { CreatorCard } from '../course/Creator';
import { CoursePackScore, VideoValidation } from '../course/Validation';
import { PracticeExercise, QuizCard } from '../study/Practice';

export function OverviewPanel({ course, lesson, onWhy, onAsk }: { course: Course; lesson: Lesson; onWhy: () => void; onAsk: (q: string) => void }) {
  const c = creator(lesson.video.creatorId);
  const s = signalsFor(lesson.video, c);
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px]">
      <div className="flex min-w-0 flex-col gap-7">
        <div>
          <h3 className="text-[16px] font-[640]">What you’ll learn</h3>
          <p className="mt-1 text-[14.5px] text-muted">{lesson.objective}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {(lesson.outcomes.length ? lesson.outcomes : [lesson.objective]).map((o) => (
              <li key={o} className="flex gap-2.5 text-[14.5px]"><Icon name="check" size={17} className="mt-0.5 text-green-ink" /> {o}</li>
            ))}
            {lesson.chapters.slice(1, 4).map((ch) => (
              <li key={ch.t} className="flex gap-2.5 text-[14.5px] text-muted"><Icon name="chevron-right" size={17} className="mt-0.5 text-faint" /> {ch.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-[16px] font-[640]">Key concepts</h3>
          <p className="mt-0.5 text-[13px] text-muted">Tap one to have your Study Partner explain it.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.concepts.map((k) => (
              <button key={k} onClick={() => onAsk(`Explain ${course.glossary[k]?.term ?? k}`)} className="rounded-[10px] border border-line px-3 py-1.5 text-left transition hover:border-line-strong hover:bg-sunken">
                <span className="block text-[14px] font-[600]">{course.glossary[k]?.term ?? k}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <aside className="flex flex-col gap-4">
        <div className="rounded-[16px] bg-sunken p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Why this video?</span>
            <CoursePackScore score={coursePackScore(s)} size="xs" />
          </div>
          <div className="mt-3">
            <VideoValidation signals={s} compact />
          </div>
          <p className="mt-3 text-[13px] leading-snug text-muted">Chosen over {lesson.candidates.length} finalists from {lesson.scanned} videos on this concept.</p>
          <button onClick={onWhy} className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-[600] hover:underline">
            See the evidence <Icon name="arrow-right" size={14} />
          </button>
        </div>
        <CreatorCard c={c} />
      </aside>
    </div>
  );
}

export function TranscriptPanel({ lesson, time, onSeek }: { lesson: Lesson; time: number; onSeek: (t: number) => void }) {
  const [q, setQ] = useState('');
  const { dispatch } = useStore();
  const toast = useToast();
  const active = lesson.chapters.filter((c) => c.t <= time).at(-1)?.t;
  const hits = useMemo(() => (q.trim() ? lesson.chapters.filter((c) => `${c.title} ${c.text}`.toLowerCase().includes(q.toLowerCase())).length : null), [q, lesson]);
  const mark = (s: string) => {
    if (!q.trim()) return s;
    const parts = s.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
    return parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i} className="rounded-[3px] bg-amber-soft px-0.5 text-ink">{p}</mark> : p));
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-full bg-sunken px-3.5">
        <Icon name="search" size={16} className="text-faint" />
        <label htmlFor="tr-q" className="sr-only">Search transcript</label>
        <input id="tr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the transcript" className="h-10 w-full bg-transparent text-[14px] outline-none placeholder:text-faint" />
        {hits !== null && <span className="num shrink-0 text-[12px] text-muted">{hits} match{hits === 1 ? '' : 'es'}</span>}
      </div>
      <ol className="flex flex-col">
        {lesson.chapters.map((c) => {
          const on = c.t === active;
          const dim = q.trim() && !`${c.title} ${c.text}`.toLowerCase().includes(q.toLowerCase());
          return (
            <li key={c.t} className={cx('group relative grid grid-cols-[64px_1fr] gap-3 rounded-[12px] px-2 py-3 transition', on ? 'bg-red-soft/60' : 'hover:bg-sunken', dim && 'opacity-35')}>
              <button onClick={() => onSeek(c.t)} className={cx('num self-start rounded-[6px] px-1.5 py-0.5 text-left font-mono text-[12.5px]', on ? 'text-red-ink' : 'text-blue-ink hover:underline')}>
                {clock(c.t)}
              </button>
              <div className="min-w-0">
                <button onClick={() => onSeek(c.t)} className="text-left text-[14.5px] font-[620] hover:underline">{mark(c.title)}</button>
                <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{mark(c.text)}</p>
                <button
                  onClick={() => {
                    dispatch({ type: 'note', note: { id: `n${Date.now()}`, lessonId: lesson.id, t: c.t, text: '', quote: c.text.split(/(?<=\.)\s/)[0], createdAt: Date.now() } });
                    toast('Highlight saved to notes', 'bookmark');
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] text-muted opacity-100 hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Icon name="bookmark" size={13} /> Highlight
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function NotesPanel({ lesson, time, onSeek }: { lesson: Lesson; time: number; onSeek: (t: number) => void }) {
  const { state, dispatch } = useStore();
  const [text, setText] = useState('');
  const notes = state.notes.filter((n) => n.lessonId === lesson.id).sort((a, b) => a.t - b.t);
  const save = () => {
    if (!text.trim()) return;
    dispatch({ type: 'note', note: { id: `n${Date.now()}`, lessonId: lesson.id, t: Math.floor(time), text: text.trim(), createdAt: Date.now() } });
    setText('');
  };
  return (
    <div className="flex flex-col gap-5">
      <form className="flex flex-col gap-2 rounded-[16px] bg-sunken p-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="flex items-center gap-2 px-1 text-[12.5px] text-muted">
          <Icon name="pen" size={14} /> Note at <span className="num font-mono text-blue-ink">{clock(time)}</span>
        </div>
        <label htmlFor="note-input" className="sr-only">Your note</label>
        <textarea
          id="note-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }}
          rows={2}
          placeholder="What clicked? What’s still fuzzy?"
          className="w-full resize-none bg-transparent px-1 text-[14.5px] outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-between">
          <span className="hidden text-[12px] text-faint sm:inline">⌘/Ctrl + Enter to save</span>
          <Button type="submit" variant="ink" size="sm" disabled={!text.trim()} className="ml-auto">Save note</Button>
        </div>
      </form>
      {notes.length ? (
        <ol className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="group flex gap-3 rounded-[14px] p-3 ring-1 ring-line">
              <button onClick={() => onSeek(n.t)} className="num h-fit rounded-[6px] bg-blue-soft px-1.5 py-0.5 font-mono text-[12px] text-blue-ink hover:brightness-95" aria-label={`Jump to ${clock(n.t)}`}>
                {clock(n.t)}
              </button>
              <div className="min-w-0 flex-1">
                {n.quote && <blockquote className="border-l-2 border-red pl-2.5 text-[14px] italic leading-snug">{n.quote}</blockquote>}
                {n.text && <p className={cx('text-[14px] leading-snug', n.quote && 'mt-1.5 text-muted')}>{n.text}</p>}
                <div className="mt-1 text-[11.5px] text-faint">{relTime(n.createdAt)}</div>
              </div>
              <button onClick={() => dispatch({ type: 'deleteNote', id: n.id })} aria-label="Delete note" className="h-fit rounded-full p-1.5 text-faint opacity-100 hover:bg-sunken hover:text-ink sm:opacity-0 sm:group-hover:opacity-100">
                <Icon name="trash" size={15} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[14px] text-muted">No notes yet. Notes are pinned to the moment in the video, so you can jump straight back.</p>
      )}
    </div>
  );
}

export function PracticePanel({ course, lesson, onComplete }: { course: Course; lesson: Lesson; onComplete: () => void }) {
  const { state, dispatch } = useStore();
  const p = state.progress[course.id];
  const passed = !!p?.exercisesPassed.includes(lesson.id);
  const done = !!p?.completed.includes(lesson.id);
  const toast = useToast();
  return (
    <div className="flex flex-col gap-5">
      {lesson.exercise && (
        <PracticeExercise
          ex={lesson.exercise}
          passed={passed}
          topic={course.topic}
          onPass={() => {
            dispatch({ type: 'exercise', courseId: course.id, lessonId: lesson.id });
            toast('Exercise passed', 'check');
          }}
        />
      )}
      {lesson.check.length > 0 && (
        <QuizCard
          key={lesson.id}
          questions={lesson.check}
          onAnswer={(q, ok) => dispatch({ type: 'answer', courseId: course.id, concept: q.concept, correct: ok })}
        />
      )}
      {!lesson.exercise && (
        <div className="rounded-[16px] bg-sunken p-4 text-[14px]">
          <div className="font-[600]">Apply it</div>
          <p className="mt-0.5 text-muted">Before moving on, write one sentence in Notes on how you’d use “{course.glossary[lesson.concepts[0]]?.term ?? lesson.title}” in your project.</p>
        </div>
      )}
      {!done && (
        <Button variant="primary" className="self-start" icon="check" onClick={onComplete}>Mark lesson complete</Button>
      )}
    </div>
  );
}
