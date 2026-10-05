import { useEffect, useMemo, useState } from 'react';
import { getCourse, SUGGESTED_INTENTS } from '../data';
import { allLessons } from '../lib/buildCourse';
import { ensureGenerated, resolveIntent } from '../lib/generate';
import { go } from '../state/router';
import { useStore } from '../state/store';
import { AppShell } from '../components/layout/Shell';
import { Icon } from '../components/ui/Icon';
import { Button, Modal } from '../components/ui/primitives';
import { BuildLiveView, BuildSteps, BuiltSummary, pickFeatured, SelectionHighlight, useBuildProgress } from '../components/generate/LearningPathBuilder';
import { CourseCover } from '../components/course/CourseCard';
import { CreatorAvatar } from '../components/course/Creator';
import { WhyThisVideo } from '../components/course/Validation';
import { creator } from '../data/creators';

/** CourseGenerator: the "What do you want to learn?" entry point. */
export function Build({ query }: { query?: string }) {
  return <AppShell active="build">{query ? <Builder key={query} query={query} /> : <Ask />}</AppShell>;
}

function Ask() {
  const [q, setQ] = useState('');
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[760px] flex-col justify-center gap-8 px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="eyebrow">New learning path</div>
        <h1 className="display text-[clamp(40px,7vw,76px)]">What do you want to learn?</h1>
        <p className="text-[16px] text-muted">Describe a skill or a goal. CoursePack searches YouTube, checks what learners say actually helped, and sequences a path with practice and a project.</p>
      </div>
      <form
        className="flex items-center gap-2 rounded-[20px] bg-surface p-2 pl-5 shadow-card ring-1 ring-line"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) go('build', q.trim());
        }}
      >
        <label htmlFor="build-q" className="sr-only">What do you want to learn?</label>
        <input id="build-q" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Build my first website" className="h-12 min-w-0 flex-1 bg-transparent text-[18px] outline-none placeholder:text-faint" />
        <Button variant="primary" size="lg" type="submit" disabled={!q.trim()}>Build path</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_INTENTS.map((s) => (
          <button key={s} onClick={() => go('build', s)} className="rounded-full border border-line px-3.5 py-1.5 text-[13.5px] text-muted hover:border-line-strong hover:text-ink">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Builder({ query }: { query: string }) {
  const { dispatch, state } = useStore();
  const intent = useMemo(() => resolveIntent(query), [query]);
  const course = useMemo(() => (intent.matched ? getCourse(intent.courseId)! : ensureGenerated(intent.courseId, intent.topic)), [intent]);
  const [skip, setSkip] = useState(false);
  const { step, t, done } = useBuildProgress(query, skip);
  const [why, setWhy] = useState(false);
  const featured = useMemo(() => pickFeatured(allLessons(course)), [course]);
  const lessons = allLessons(course);

  useEffect(() => {
    if (!intent.matched) dispatch({ type: 'generated', key: `${course.id}|${intent.topic}` });
  }, [course.id, intent, dispatch]);

  const start = () => {
    dispatch({ type: 'start', courseId: course.id });
    const p = state.progress[course.id];
    go('learn', course.id, p?.currentLessonId ?? lessons[0].id);
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-center gap-2 text-[14px] text-muted">
        <Icon name="search" size={15} />
        <span>“{query}”</span>
        <button onClick={() => go('build')} className="ml-1 rounded-full px-2 py-0.5 text-[13px] hover:bg-sunken hover:text-ink">Change</button>
      </div>

      {!done ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            <h1 className="text-[clamp(26px,3.6vw,38px)] font-[680] tracking-[-0.035em]">Building your learning path…</h1>
            <p className="mt-1 text-[15px] text-muted">Reading what learners say, not just counting views.</p>
            <div className="mt-6">
              <BuildSteps step={step} t={t} />
            </div>
            <button onClick={() => setSkip(true)} className="mt-4 text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">Skip animation</button>
          </div>
          <div className="min-w-0 lg:pt-2">
            <BuildLiveView course={course} step={step} t={t} />
          </div>
        </div>
      ) : (
        <div className="anim-fade-up grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-7">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[13.5px] font-[600] text-green-ink">
                <Icon name="check-circle" size={16} /> Your CoursePack is ready.
              </div>
              <h1 className="mt-2 text-[clamp(32px,4.6vw,54px)] font-[700] leading-[1.02] tracking-[-0.04em]">{course.title}</h1>
              <p className="mt-3 max-w-[54ch] text-[16px] text-muted">{course.description}</p>
            </div>
            <BuiltSummary course={course} />
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="lg" iconRight="arrow-right" onClick={start}>
                {state.progress[course.id] ? 'Continue course' : 'Start course'}
              </Button>
              <Button variant="ghost" size="lg" onClick={() => go('course', course.id)}>View curriculum</Button>
            </div>
            <SelectionHighlight lesson={featured} total={lessons.length} onWhy={() => setWhy(true)} />
          </div>

          <div className="flex flex-col gap-5">
            <div className="overflow-hidden rounded-[18px] ring-1 ring-line">
              <CourseCover course={course} />
              <div className="p-5">
                <div className="eyebrow">Final project</div>
                <div className="mt-1 text-[16px] font-[620]">{course.finalProject.title}</div>
                <p className="mt-0.5 text-[14px] text-muted">{course.finalProject.summary}</p>
              </div>
            </div>
            <div className="rounded-[18px] p-5 ring-1 ring-line">
              <div className="eyebrow">Built from the best of YouTube</div>
              <div className="mt-3 flex flex-col gap-2.5">
                {course.creators.map((id) => {
                  const c = creator(id);
                  const n = lessons.filter((l) => l.video.creatorId === id).length;
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <CreatorAvatar c={c} size={28} />
                      <span className="flex-1 truncate text-[14px] font-[560]">{c.name}</span>
                      <span className="num text-[12.5px] text-muted">{n} lesson{n > 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={why} onClose={() => setWhy(false)} label="Why this video?">
        <WhyThisVideo lesson={featured} onClose={() => setWhy(false)} />
      </Modal>
    </div>
  );
}
