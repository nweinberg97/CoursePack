import { useMemo } from 'react';
import type { Course } from '../types';
import { allLessons } from '../lib/buildCourse';
import { answerCourse, COURSE_PROMPTS } from '../lib/tutor';
import { rng } from '../lib/random';
import { cx } from '../lib/format';
import { go, href } from '../state/router';
import { useStore } from '../state/store';
import { AppShell, Footer } from '../components/layout/Shell';
import { Icon, type IconName } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/primitives';
import { FlashcardDeck } from '../components/study/Flashcards';
import { ConceptMap } from '../components/study/ConceptMap';
import { QuizCard } from '../components/study/Practice';
import { TutorChat, useTutor } from '../components/ai/TutorChat';

const TABS: { id: string; label: string; icon: IconName }[] = [
  { id: 'guide', label: 'Study Guide', icon: 'book' },
  { id: 'cards', label: 'Flashcards', icon: 'cards' },
  { id: 'quiz', label: 'Practice Quiz', icon: 'quiz' },
  { id: 'map', label: 'Key Concepts', icon: 'graph' },
  { id: 'ask', label: 'Ask the Course', icon: 'message' },
  { id: 'weak', label: 'Weak Concepts', icon: 'target' },
];

export function StudyKit({ course, tab = 'guide' }: { course: Course; tab?: string }) {
  const { state } = useStore();
  const p = state.progress[course.id];
  const active = TABS.some((t) => t.id === tab) ? tab : 'guide';

  return (
    <AppShell active="progress">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
        <a href={href('course', course.id)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <Icon name="arrow-left" size={14} /> {course.title}
        </a>
        <h1 className="mt-2 text-[clamp(30px,4.4vw,48px)] font-[700] tracking-[-0.04em]">Study Kit</h1>
        <p className="mt-1 max-w-[60ch] text-[15px] text-muted">Everything for review in one place, tuned to how you’re actually doing in this course.</p>

        <div className="no-scrollbar -mx-4 mt-7 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist">
          {TABS.map((t) => (
            <a key={t.id} href={href('study', course.id, t.id)} role="tab" aria-selected={active === t.id} className={cx('relative inline-flex shrink-0 items-center gap-1.5 px-3 pb-3 pt-1 text-[14px] font-[560] transition', active === t.id ? 'text-ink' : 'text-muted hover:text-ink')}>
              <Icon name={t.icon} size={16} /> {t.label}
              {active === t.id && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-red" />}
            </a>
          ))}
        </div>

        <div className="pt-8">
          {active === 'guide' && <StudyGuide course={course} />}
          {active === 'cards' && <FlashcardDeck course={course} />}
          {active === 'quiz' && <PracticeQuiz course={course} />}
          {active === 'map' && <ConceptMap course={course} progress={p} />}
          {active === 'ask' && <AskTheCourse course={course} />}
          {active === 'weak' && <WeakConcepts course={course} />}
        </div>
      </div>
      <Footer />
    </AppShell>
  );
}

function StudyGuide({ course }: { course: Course }) {
  const { state } = useStore();
  const p = state.progress[course.id];
  const seen = new Set<string>();
  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <nav className="hidden lg:block">
        <ol className="sticky top-[84px] flex flex-col gap-1 text-[13.5px]">
          {course.modules.map((m) => (
            <li key={m.id}>
              <a href={`#guide-${m.index}`} onClick={(e) => { e.preventDefault(); document.getElementById(`guide-${m.index}`)?.scrollIntoView({ behavior: 'smooth' }); }} className="flex gap-2 rounded-[8px] px-2 py-1.5 text-muted hover:bg-sunken hover:text-ink">
                <span className="num font-mono text-[11.5px] text-faint">{String(m.index).padStart(2, '0')}</span> {m.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex max-w-[760px] flex-col gap-12">
        {course.modules.map((m) => {
          const fresh = Array.from(new Set(m.lessons.flatMap((l) => l.concepts))).filter((c) => !seen.has(c) && course.glossary[c]);
          fresh.forEach((c) => seen.add(c));
          const done = m.lessons.every((l) => p?.completed.includes(l.id));
          return (
            <section key={m.id} id={`guide-${m.index}`} className="scroll-mt-24">
              <div className="flex items-baseline gap-3">
                <span className="num font-mono text-[13px] text-faint">{String(m.index).padStart(2, '0')}</span>
                <h2 className="text-[22px] font-[660] tracking-[-0.02em]">{m.title}</h2>
                {done && <Icon name="check-circle" size={18} className="text-green-ink" />}
              </div>
              <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{m.description}</p>
              {fresh.length > 0 && (
                <dl className="mt-5 flex flex-col divide-y divide-line rounded-[16px] ring-1 ring-line">
                  {fresh.map((c) => (
                    <div key={c} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                      <dt className="text-[14.5px] font-[620]">{course.glossary[c].term}</dt>
                      <dd className="text-[14.5px] leading-relaxed text-muted">{course.glossary[c].def}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <ol className="mt-4 flex flex-col gap-1">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <a href={href('learn', course.id, l.id)} className="flex items-start gap-3 rounded-[10px] px-2 py-2 hover:bg-sunken">
                      <Icon name={p?.completed.includes(l.id) ? 'check-circle' : 'circle'} size={17} className={cx('mt-0.5', p?.completed.includes(l.id) ? 'text-green-ink' : 'text-faint')} />
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-[560]">{l.title}</span>
                        <span className="block text-[13.5px] text-muted">{l.objective}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PracticeQuiz({ course }: { course: Course }) {
  const { state, dispatch } = useStore();
  const p = state.progress[course.id];
  const questions = useMemo(() => {
    const pool = course.quiz.length >= 6 ? course.quiz : [...course.quiz, ...allLessons(course).flatMap((l) => l.check)];
    const uniq = Array.from(new Map(pool.map((q) => [q.id, q])).values());
    return rng(`${course.id}:${Date.now() >> 16}`).shuffle(uniq).slice(0, 6);
  }, [course]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="max-w-[720px]">
        <QuizCard title="Practice quiz · 6 questions" questions={questions} onAnswer={(q, ok) => dispatch({ type: 'answer', courseId: course.id, concept: q.concept, correct: ok })} />
      </div>
      <aside className="flex flex-col gap-2 rounded-[18px] bg-sunken p-5">
        <div className="eyebrow">Practice accuracy</div>
        <div className="num text-[36px] font-[680] tracking-[-0.03em]">{p?.quizTotal ? Math.round((p.quizCorrect / p.quizTotal) * 100) : 0}%</div>
        <div className="text-[13px] text-muted">{p?.quizCorrect ?? 0} of {p?.quizTotal ?? 0} answers correct across this course. Every answer updates your concept confidence.</div>
      </aside>
    </div>
  );
}

function AskTheCourse({ course }: { course: Course }) {
  const { state, dispatch } = useStore();
  const p = state.progress[course.id];
  const tutor = useTutor(
    [{ id: 'hello-course', role: 'tutor', text: `I know all ${allLessons(course).length} lessons of ${course.title}. Ask how ideas connect, or use a shortcut below.` }],
    (text, id) => answerCourse(course, text, state.progress[course.id], id),
  );
  const suggestions = [
    ...(course.id === 'ai-app' ? [{ id: '', label: 'How does RAG fit into the AI architecture we built?' }] : []),
    ...COURSE_PROMPTS,
  ];
  return (
    <div className="mx-auto h-[min(680px,75vh)] max-w-[820px] overflow-hidden rounded-[20px] ring-1 ring-line">
      <TutorChat
        title="Ask the Course"
        subtitle={`Answers come from the ${course.modules.length} modules of this course, with links to the lessons.`}
        messages={tutor.messages}
        thinking={tutor.thinking}
        suggestions={suggestions}
        onSend={(t, id) => tutor.send(t, id || undefined)}
        onSource={(s) => go('learn', course.id, s.lessonId)}
        onLesson={(id) => go('learn', course.id, id)}
        onAnswer={(q, ok) => dispatch({ type: 'answer', courseId: course.id, concept: q.concept, correct: ok })}
        placeholder="Ask anything about this course"
        className="h-full"
        headerExtra={p ? <span className="hidden rounded-full bg-sunken px-2.5 py-1 text-[12px] text-muted sm:inline">{p.completed.length} lessons watched</span> : null}
      />
    </div>
  );
}

function WeakConcepts({ course }: { course: Course }) {
  const { state } = useStore();
  const p = state.progress[course.id];
  const rows = Object.entries(p?.confidence ?? {})
    .filter(([k]) => course.glossary[k])
    .sort((a, b) => a[1] - b[1]);
  const lessons = allLessons(course);
  if (!rows.length) return <p className="text-[15px] text-muted">Answer a few questions in the Practice Quiz or Flashcards and CoursePack will show where to focus.</p>;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <ol className="flex flex-col divide-y divide-line rounded-[18px] ring-1 ring-line">
        {rows.map(([k, v], i) => {
          const l = lessons.find((x) => x.concepts[0] === k) ?? lessons.find((x) => x.concepts.includes(k));
          return (
            <li key={k} className="grid items-center gap-3 px-4 py-4 sm:grid-cols-[1fr_200px_auto]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-[620]">{course.glossary[k].term}</span>
                  {i < 2 && v < 75 && <span className="rounded-full bg-red-soft px-2 py-0.5 text-[11.5px] font-[600] text-red-ink">Review recommended</span>}
                </div>
                <div className="truncate text-[13px] text-muted">{course.glossary[k].def}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <ProgressBar value={v} tone={v >= 80 ? 'green' : 'ink'} className="flex-1" />
                <span className="num w-[86px] text-right font-mono text-[12px] text-muted">{v}% confidence</span>
              </div>
              {l && (
                <a href={href('learn', course.id, l.id)} className="inline-flex items-center gap-1 justify-self-start text-[13px] font-[600] hover:underline sm:justify-self-end">
                  Review <Icon name="arrow-right" size={13} />
                </a>
              )}
            </li>
          );
        })}
      </ol>
      <aside className="rounded-[18px] bg-sunken p-5 text-[14px] text-muted">
        <div className="eyebrow mb-2">How confidence works</div>
        Confidence rises when you answer correctly or pass an exercise, and drops when you miss a question. It’s about what you can recall, not what you’ve watched.
      </aside>
    </div>
  );
}
