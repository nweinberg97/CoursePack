import { useEffect, useRef, useState } from 'react';
import type { QuizQuestion } from '../../types';
import type { Source, TutorMessage } from '../../lib/tutor';
import { cx } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { MD } from '../ui/primitives';

/** Streams tutor text word by word, the way a model response arrives. */
function useStream(text: string, active: boolean) {
  const [n, setN] = useState(active ? 0 : Infinity);
  useEffect(() => {
    if (!active) return;
    const words = text.split(' ').length;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(i);
      if (i >= words) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [text, active]);
  const words = text.split(' ');
  return { shown: words.slice(0, n).join(' '), done: n >= words.length };
}

export function AIMessage({
  m,
  fresh,
  onSource,
  onLesson,
  onAnswer,
}: {
  m: TutorMessage;
  fresh: boolean;
  onSource?: (s: Source) => void;
  onLesson?: (id: string) => void;
  onAnswer?: (q: QuizQuestion, correct: boolean) => void;
}) {
  const { shown, done } = useStream(m.text, fresh && m.role === 'tutor');
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[16px] rounded-br-[6px] bg-sunken px-3.5 py-2 text-[14px] leading-relaxed">{m.text}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5 text-[14px] leading-relaxed">
      <p>
        <MD text={shown} />
        {!done && <span className="anim-pulse ml-0.5 inline-block h-3.5 w-[6px] translate-y-[2px] rounded-[1px] bg-ink" />}
      </p>
      {done && (
        <div className="anim-fade-up flex flex-col gap-2.5">
          {m.bullets && (
            <ul className="flex flex-col gap-1.5">
              {m.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  <MD text={b} className="text-ink/90" />
                </li>
              ))}
            </ul>
          )}
          {m.code && <pre className="scroll-thin overflow-x-auto rounded-[10px] bg-stage p-3 font-mono text-[12px] leading-relaxed text-white/90">{m.code}</pre>}
          {m.quiz && onAnswer && <InlineQuiz q={m.quiz} onAnswer={onAnswer} />}
          {m.lessons && m.lessons.length > 0 && (
            <div className="flex flex-col gap-1">
              {m.lessons.map((l) => (
                <button key={l.id + l.title} disabled={!l.id} onClick={() => l.id && onLesson?.(l.id)} className="flex items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-left text-[13px] hover:bg-sunken disabled:opacity-60">
                  <Icon name="play" size={13} className="text-faint" />
                  <span className="min-w-0 flex-1 truncate font-[560]">{l.title}</span>
                  <span className="shrink-0 text-[12px] text-muted">{l.note}</span>
                </button>
              ))}
            </div>
          )}
          {m.sources && m.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {m.sources.map((s) => (
                <button key={s.lessonId + s.t + s.label} onClick={() => onSource?.(s)} className="inline-flex items-center gap-1.5 rounded-full bg-blue-soft px-2.5 py-1 text-[12px] font-[560] text-blue-ink hover:brightness-95">
                  <Icon name="play" size={11} fill /> Source: {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InlineQuiz({ q, onAnswer }: { q: QuizQuestion; onAnswer: (q: QuizQuestion, correct: boolean) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="rounded-[14px] border border-line p-3">
      <div className="text-[14px] font-[600] leading-snug">{q.prompt}</div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {q.options.map((o, i) => {
          const state = pick === null ? 'idle' : i === q.answer ? 'right' : i === pick ? 'wrong' : 'dim';
          return (
            <button
              key={o}
              disabled={pick !== null}
              onClick={() => {
                setPick(i);
                onAnswer(q, i === q.answer);
              }}
              className={cx(
                'rounded-[10px] px-3 py-2 text-left text-[13px] leading-snug transition',
                state === 'idle' && 'bg-sunken hover:bg-sunken-2',
                state === 'right' && 'bg-green-soft font-[560] text-green-ink',
                state === 'wrong' && 'bg-red-soft text-red-ink',
                state === 'dim' && 'bg-sunken opacity-50',
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      {pick !== null && <p className="anim-fade-up mt-2.5 text-[13px] text-muted"><span className="font-[600] text-ink">{pick === q.answer ? 'Correct.' : 'Not quite.'}</span> {q.explanation}</p>}
    </div>
  );
}

export function TutorChat({
  title,
  subtitle,
  messages,
  suggestions,
  onSend,
  onSource,
  onLesson,
  onAnswer,
  thinking,
  placeholder,
  className,
  headerExtra,
  examples,
}: {
  title: string;
  subtitle: string;
  messages: TutorMessage[];
  suggestions: readonly { id: string; label: string }[];
  onSend: (text: string, promptId?: string) => void;
  onSource?: (s: Source) => void;
  onLesson?: (id: string) => void;
  onAnswer?: (q: QuizQuestion, correct: boolean) => void;
  thinking: boolean;
  placeholder: string;
  className?: string;
  headerExtra?: React.ReactNode;
  examples?: string[];
}) {
  const [text, setText] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const freshId = useRef<string | null>(null);
  const prevLen = useRef(messages.length);
  if (messages.length > prevLen.current) freshId.current = messages[messages.length - 1].id;
  prevLen.current = messages.length;
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, thinking]);

  return (
    <div className={cx('flex min-h-0 flex-col', className)}>
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-ink text-bg">
              <Icon name="message" size={13} />
            </span>
            <h2 className="text-[16px] font-[640]">{title}</h2>
          </div>
          <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
        </div>
        {headerExtra}
      </div>
      <div ref={scroller} className="scroll-thin flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        {messages.map((m) => (
          <AIMessage key={m.id} m={m} fresh={m.id === freshId.current} onSource={onSource} onLesson={onLesson} onAnswer={onAnswer} />
        ))}
        {messages.length === 1 && !thinking && examples && examples.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="eyebrow">Try asking</div>
            {examples.map((e) => (
              <button key={e} onClick={() => onSend(e)} className="flex items-center gap-2.5 rounded-[12px] border border-line px-3 py-2.5 text-left text-[13.5px] transition hover:border-line-strong hover:bg-sunken">
                <Icon name="arrow-right" size={14} className="text-faint" />
                <span className="flex-1">{e}</span>
              </button>
            ))}
          </div>
        )}
        {thinking && (
          <div className="flex items-center gap-1.5 text-[13px] text-muted">
            <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-muted [animation-delay:.15s]" />
            <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-muted [animation-delay:.3s]" />
            <span className="ml-1">Reading the transcript…</span>
          </div>
        )}
      </div>
      <div className="border-t border-line px-3 pb-3 pt-2.5">
        <div className="no-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1">
          {suggestions.map((s) => (
            <button key={s.id} disabled={thinking} onClick={() => onSend(s.label, s.id)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted transition hover:border-line-strong hover:text-ink disabled:opacity-50">
              {s.label}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2 rounded-[16px] bg-sunken p-1.5 pl-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim() || thinking) return;
            onSend(text.trim());
            setText('');
          }}
        >
          <label htmlFor={`chat-${title}`} className="sr-only">{placeholder}</label>
          <input id={`chat-${title}`} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="h-9 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint" />
          <button type="submit" disabled={!text.trim() || thinking} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-bg transition disabled:opacity-30">
            <Icon name="arrow-up" size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

/** Message state + simulated latency, shared by Study Partner and Ask the Course. */
export function useTutor(initial: TutorMessage[], answer: (text: string, promptId?: string) => TutorMessage) {
  const [messages, setMessages] = useState<TutorMessage[]>(initial);
  const [thinking, setThinking] = useState(false);
  const send = (text: string, promptId?: string) => {
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages((m) => [...m, answer(text, promptId)]);
    }, 550 + Math.random() * 450);
  };
  return { messages, thinking, send, setMessages };
}
