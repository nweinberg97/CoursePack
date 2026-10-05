import { useCallback, useEffect, useState } from 'react';
import type { Course, Lesson } from '../types';
import { locate, neighbors } from '../lib/buildCourse';
import { answerLesson, LESSON_PROMPTS, type Source } from '../lib/tutor';
import { cx, hoursMinutes } from '../lib/format';
import { go, href } from '../state/router';
import { useCourseStats, useStore } from '../state/store';
import { Icon, Logo } from '../components/ui/Icon';
import { Button, Drawer, IconButton, Modal, ProgressBar, ProgressRing, Tabs, useToast } from '../components/ui/primitives';
import { ModuleList } from '../components/course/Curriculum';
import { WhyThisVideo } from '../components/course/Validation';
import { SourceLine, usePlayback, VideoPlayer } from '../components/learn/VideoPlayer';
import { NotesPanel, OverviewPanel, PracticePanel, TranscriptPanel } from '../components/learn/LessonPanels';
import { TutorChat, useTutor } from '../components/ai/TutorChat';
import { ThemeToggle } from '../components/layout/Shell';

/** Seek requested from another lesson (e.g. a Study Partner source). */
let pendingSeek: { lessonId: string; t: number } | null = null;

type Tab = 'overview' | 'notes' | 'transcript' | 'practice';

export function Learn({ course, lessonId }: { course: Course; lessonId: string }) {
  const { state, dispatch } = useStore();
  const { lesson, module, indexInModule } = locate(course, lessonId);
  useEffect(() => {
    dispatch({ type: 'start', courseId: course.id });
    dispatch({ type: 'setCurrent', courseId: course.id, lessonId: lesson.id });
  }, [course.id, lesson.id, dispatch]);
  return <LessonView key={lesson.id} course={course} lesson={lesson} moduleIndex={module.index} indexInModule={indexInModule} focus={state.focusMode} />;
}

function LessonView({ course, lesson, moduleIndex, indexInModule, focus }: { course: Course; lesson: Lesson; moduleIndex: number; indexInModule: number; focus: boolean }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const st = useCourseStats(course);
  const p = state.progress[course.id];
  const module = course.modules[moduleIndex - 1];
  const { next, prev, index, total } = neighbors(course, lesson.id);
  const done = !!p?.completed.includes(lesson.id);
  const [ended, setEnded] = useState(false);
  const initial = pendingSeek?.lessonId === lesson.id ? pendingSeek.t : 0;
  const pb = usePlayback(lesson.duration, () => setEnded(true), initial);
  const [tab, setTab] = useState<Tab>('overview');
  const [why, setWhy] = useState(false);
  const [curriculum, setCurriculum] = useState(false);
  const [partner, setPartner] = useState(false);

  useEffect(() => {
    if (pendingSeek?.lessonId === lesson.id) {
      pendingSeek = null;
      pb.setPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count focused learning time while the video plays.
  useEffect(() => {
    if (!pb.playing) return;
    const id = setInterval(() => dispatch({ type: 'focusTick', courseId: course.id, seconds: Math.round(15 * pb.rate) }), 15000);
    return () => clearInterval(id);
  }, [pb.playing, pb.rate, course.id, dispatch]);

  const seek = useCallback(
    (t: number) => {
      pb.setTime(t);
      pb.setPlaying(true);
      setEnded(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [pb],
  );

  const completeAndNext = () => {
    dispatch({ type: 'complete', courseId: course.id, lessonId: lesson.id });
    const count = (p?.completed.length ?? 0) + (done ? 0 : 1);
    if (next) {
      toast(`Lesson complete · ${count}/${total}`, 'check');
      go('learn', course.id, next.id);
    } else {
      dispatch({ type: 'finishCourse', courseId: course.id });
      go('complete', course.id);
    }
  };

  const tutor = useTutor(
    [
      {
        id: `hello-${lesson.id}`,
        role: 'tutor',
        text: `I’ve read the transcript for “${lesson.title}”. Ask me anything about it, or try one of the suggestions below.`,
      },
    ],
    (text, promptId) => answerLesson(course, lesson, text, promptId),
  );

  const examples = [
    ...(lesson.concepts.some((c) => c === 'api' || c === 'sdk') ? ['What’s the difference between an API and an SDK?'] : []),
    ...lesson.concepts.slice(0, 2).map((c, i) => (i === 0 ? `What is ${course.glossary[c]?.term ?? c}, in plain words?` : `Where do they explain ${course.glossary[c]?.term ?? c}?`)),
  ].slice(0, 3);

  const onSource = (s: Source) => {
    if (s.lessonId === lesson.id) seek(s.t);
    else {
      pendingSeek = { lessonId: s.lessonId, t: s.t };
      go('learn', course.id, s.lessonId);
    }
    setPartner(false);
  };

  const ask = (q: string) => {
    tutor.send(q);
    setPartner(true);
  };

  const partnerEl = (
    <TutorChat
      title="Study Partner"
      subtitle="Ask me anything about this lesson."
      messages={tutor.messages}
      thinking={tutor.thinking}
      suggestions={LESSON_PROMPTS}
      onSend={tutor.send}
      onSource={onSource}
      onLesson={(id) => go('learn', course.id, id)}
      onAnswer={(q, ok) => dispatch({ type: 'answer', courseId: course.id, concept: q.concept, correct: ok })}
      placeholder="Ask about this lesson"
      className="h-full"
      examples={examples}
    />
  );

  const endCard = (
    <div className="anim-pop flex w-full max-w-[460px] flex-col items-center gap-4 text-center">
      <div className="text-[13px] text-white/60">{done ? 'Lesson complete' : 'Video finished'}</div>
      <div className="text-[20px] font-[650] leading-tight">{next ? `Up next: ${next.title}` : 'That’s the final lesson.'}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {lesson.check.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => { setEnded(false); setTab('practice'); document.getElementById('lesson-tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
            Quick check first
          </Button>
        )}
        <Button size="sm" variant="primary" iconRight="arrow-right" onClick={completeAndNext}>
          {next ? 'Complete & continue' : 'Finish course'}
        </Button>
      </div>
      <button onClick={() => { pb.setTime(0); setEnded(false); pb.setPlaying(true); }} className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white">
        <Icon name="refresh" size={14} /> Replay
      </button>
    </div>
  );

  return (
    <div className={cx('min-h-screen', focus && 'focus-dark')}>
      {/* Top bar */}
      <header className={cx('sticky z-30 border-b border-line backdrop-blur-md', focus ? 'bg-bg/90' : 'bg-bg/90')} style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex h-[56px] items-center gap-2 px-2 sm:gap-3 sm:px-4">
          <a href={href('course', course.id)} aria-label="Back to course" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-ink">
            <Icon name="arrow-left" size={18} />
          </a>
          {!focus && (
            <a href={href('home')} className="hidden shrink-0 sm:block" aria-label="CoursePack home">
              <Logo withWord={false} />
            </a>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-[600] leading-tight">{course.title}</div>
            <div className="num truncate text-[12px] text-muted">Lesson {index + 1} of {total} · {st.pct}% complete</div>
          </div>
          <div className="hidden w-[180px] items-center gap-2 lg:flex">
            <ProgressBar value={st.pct} className="flex-1" />
          </div>
          <button
            onClick={() => {
              dispatch({ type: 'focus' });
              toast(focus ? 'Focus Mode off' : 'Focus Mode on. Distractions hidden.', 'focus');
            }}
            aria-pressed={focus}
            className={cx('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-[560] transition', focus ? 'bg-red text-white' : 'bg-sunken text-ink hover:bg-sunken-2')}
          >
            <Icon name="focus" size={16} />
            <span className="hidden sm:inline">Focus</span>
          </button>
          <a href={href('study', course.id)} className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-[560] text-muted hover:bg-sunken hover:text-ink md:inline-flex">
            <Icon name="book" size={16} /> Study Kit
          </a>
          <IconButton icon="list" label="Curriculum" onClick={() => setCurriculum(true)} className={cx(!focus && 'xl:hidden')} />
          <span className="hidden sm:block"><ThemeToggle /></span>
        </div>
        <ProgressBar value={st.pct} height={2} className="rounded-none lg:hidden" />
      </header>

      <div className={cx('mx-auto grid gap-6 lg:px-6 lg:py-6', focus ? 'max-w-[1400px] lg:grid-cols-[minmax(0,1fr)_360px]' : 'max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[288px_minmax(0,1fr)_360px]')}>
        {/* Curriculum column */}
        {!focus && (
          <aside className="hidden xl:block">
            <div className="scroll-thin sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
              <CurriculumHeader course={course} pct={st.pct} remaining={st.remainingMin} />
              <ModuleList dense course={course} progress={p} currentLessonId={lesson.id} onSelect={(l) => go('learn', course.id, l.id)} />
            </div>
          </aside>
        )}

        {/* Center: lesson */}
        <section className="flex min-w-0 flex-col gap-5">
          {focus && <FocusModeHeader course={course} lesson={lesson} moduleIndex={moduleIndex} indexInModule={indexInModule} pct={st.pct} next={next} />}
          <div className="sticky top-[58px] z-20 md:static">
            <VideoPlayer lesson={lesson} pb={pb} ended={ended} onReplay={() => setEnded(false)} endCard={endCard} focus={focus} />
          </div>
          <div className="flex flex-col gap-4 px-4 lg:px-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {!focus && (
                  <div className="text-[12.5px] font-[560] text-muted">
                    Module {moduleIndex} · {module.title}
                  </div>
                )}
                <h1 className="mt-0.5 text-[clamp(22px,2.6vw,28px)] font-[680] leading-tight tracking-[-0.03em]">{lesson.title}</h1>
              </div>
              <button onClick={() => setWhy(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] font-[560] hover:bg-sunken">
                <Icon name="shield" size={15} className="text-green-ink" /> Why this video?
              </button>
            </div>
            <SourceLine lesson={lesson} />
            <NextAction courseId={course.id} lesson={lesson} next={next} prev={prev} done={done} passed={!!p?.exercisesPassed.includes(lesson.id)} onComplete={completeAndNext} onPractice={() => { setTab('practice'); document.getElementById('lesson-tabs')?.scrollIntoView({ behavior: 'smooth' }); }} />
          </div>

          <div id="lesson-tabs" className="scroll-mt-[300px] px-4 pb-28 md:scroll-mt-20 lg:px-0 lg:pb-12">
            <Tabs
              value={tab}
              onChange={setTab}
              className="mb-5 border-b border-line pb-3"
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'notes', label: 'Notes', count: state.notes.filter((n) => n.lessonId === lesson.id).length || undefined },
                { id: 'transcript', label: 'Transcript' },
                { id: 'practice', label: 'Practice', count: lesson.check.length + (lesson.exercise ? 1 : 0) },
              ]}
            />
            {tab === 'overview' && <OverviewPanel course={course} lesson={lesson} onWhy={() => setWhy(true)} onAsk={ask} />}
            {tab === 'notes' && <NotesPanel lesson={lesson} time={pb.time} onSeek={seek} />}
            {tab === 'transcript' && <TranscriptPanel lesson={lesson} time={pb.time} onSeek={seek} />}
            {tab === 'practice' && <PracticePanel course={course} lesson={lesson} onComplete={completeAndNext} />}
          </div>
        </section>

        {/* Study Partner column */}
        <aside className="hidden lg:block">
          <div className="sticky top-[80px] h-[calc(100vh-100px)] overflow-hidden rounded-[18px] bg-surface ring-1 ring-line">{partnerEl}</div>
        </aside>
      </div>

      {/* Mobile/tablet: Study Partner as a bottom sheet */}
      <button
        onClick={() => setPartner(true)}
        className="fixed right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-[14px] font-[600] text-bg shadow-card lg:hidden"
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Icon name="message" size={18} /> Study Partner
      </button>
      <Drawer open={partner} onClose={() => setPartner(false)} side="bottom" label="Study Partner">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" />
        <div className="flex h-[78vh] flex-col">{partnerEl}</div>
      </Drawer>

      <Drawer open={curriculum} onClose={() => setCurriculum(false)} side="left" label="Curriculum">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-[15px] font-[640]">Curriculum</span>
          <IconButton icon="x" label="Close" onClick={() => setCurriculum(false)} />
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-2">
          <CurriculumHeader course={course} pct={st.pct} remaining={st.remainingMin} />
          <ModuleList dense course={course} progress={p} currentLessonId={lesson.id} onSelect={(l) => { setCurriculum(false); go('learn', course.id, l.id); }} />
        </div>
      </Drawer>

      <Modal open={why} onClose={() => setWhy(false)} label="Why this video?">
        <WhyThisVideo lesson={lesson} onClose={() => setWhy(false)} />
      </Modal>
    </div>
  );
}

function CurriculumHeader({ course, pct, remaining }: { course: Course; pct: number; remaining: number }) {
  return (
    <div className="flex items-center gap-3 px-2.5 pb-2 pt-1">
      <ProgressRing value={pct} size={38} stroke={3.5}>
        <span className="num text-[10.5px] font-[650]">{pct}%</span>
      </ProgressRing>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-[620]">{course.modules.length} modules</div>
        <div className="text-[12px] text-muted">~{hoursMinutes(remaining)} remaining</div>
      </div>
    </div>
  );
}

export function FocusModeHeader({ course, lesson, moduleIndex, indexInModule, pct, next }: { course: Course; lesson: Lesson; moduleIndex: number; indexInModule: number; pct: number; next?: Lesson }) {
  const module = course.modules[moduleIndex - 1];
  return (
    <div className="anim-fade-up grid gap-4 px-4 pt-4 sm:grid-cols-[1fr_auto] lg:px-0 lg:pt-0">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted">
          <span>Module {moduleIndex} of {course.modules.length}</span>
          <span className="text-faint">/</span>
          <span>Lesson {indexInModule + 1} of {module.lessons.length}</span>
        </div>
        <div className="text-[15px] font-[600]">{module.title}</div>
        <div className="mt-1 text-[14px] text-muted">
          <span className="font-[600] text-ink">What you’ll learn:</span> {lesson.objective}
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <div className="flex items-center gap-2.5">
          <ProgressBar value={pct} className="w-[120px]" />
          <span className="num text-[14px] font-[650]">{pct}%</span>
        </div>
        {next && <div className="truncate text-[12.5px] text-muted">Next: {next.title}</div>}
      </div>
    </div>
  );
}

function NextAction({ courseId, lesson, next, prev, done, passed, onComplete, onPractice }: { courseId: string; lesson: Lesson; next?: Lesson; prev?: Lesson; done: boolean; passed: boolean; onComplete: () => void; onPractice: () => void }) {
  const needsPractice = !!lesson.exercise && !passed;
  return (
    <div className="flex flex-col gap-3 rounded-[16px] bg-sunken p-3 sm:flex-row sm:items-center sm:p-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', done ? 'bg-green text-white' : 'bg-surface')}>
          <Icon name={done ? 'check' : needsPractice ? 'target' : 'arrow-right'} size={17} />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] text-muted">{done ? 'Lesson complete · up next' : needsPractice ? 'Next step' : 'Up next'}</div>
          <div className="truncate text-[14.5px] font-[600]">
            {done ? (next ? next.title : 'You’ve finished every lesson') : needsPractice ? 'Try the exercise, then continue' : next ? next.title : 'Finish the course'}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {prev && (
          <a href={href('learn', courseId, prev.id)} className="hidden h-10 items-center rounded-full px-3 text-[13.5px] font-[560] text-muted hover:bg-surface hover:text-ink sm:inline-flex" aria-label={`Previous: ${prev.title}`}>
            <Icon name="chevron-left" size={16} /> Prev
          </a>
        )}
        {needsPractice && !done && <Button onClick={onPractice} variant="ghost" icon="code">Practice</Button>}
        <Button onClick={onComplete} variant="primary" iconRight="arrow-right" className="flex-1 sm:flex-none">
          {done ? (next ? 'Next lesson' : 'View completion') : next ? 'Complete & continue' : 'Finish course'}
        </Button>
      </div>
    </div>
  );
}

