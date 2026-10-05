import { useMemo, useState } from 'react';
import { FLAGSHIP_ID, getCourse, libraryCourses, SUGGESTED_INTENTS } from '../data';
import { approxHours, cx, hoursMinutes, relTime } from '../lib/format';
import { go, href } from '../state/router';
import { courseStats, useStore } from '../state/store';
import { AppShell, Footer } from '../components/layout/Shell';
import { ContinueCard, CourseCard, CourseCover } from '../components/course/CourseCard';
import { Icon } from '../components/ui/Icon';
import { Button, ProgressBar, Section, Tabs } from '../components/ui/primitives';

const PATHS: [string, string][] = [
  ['AI & Machine Learning', 'ai-app'], ['Python', 'python'], ['SQL', 'sql'], ['Product Design', 'product-design'],
  ['Starting a Business', 'business'], ['Video Editing', 'video-editing'], ['Photography', 'photography'], ['Personal Finance', 'finance'],
];

export function Dashboard() {
  const { state } = useStore();
  const [tab, setTab] = useState<'progress' | 'done' | 'saved'>('progress');
  const all = libraryCourses().concat(state.generated.map((g) => getCourse(g.split('|')[0])!).filter(Boolean));
  const inProgress = all.filter((c) => state.progress[c.id] && !courseStats(c, state.progress[c.id]).finished);
  const done = all.filter((c) => state.progress[c.id] && courseStats(c, state.progress[c.id]).finished);
  const saved = all.filter((c) => state.saved.includes(c.id));
  const list = tab === 'progress' ? inProgress : tab === 'done' ? done : saved;
  const flagship = getCourse(FLAGSHIP_ID)!;
  const focusCourse = inProgress.find((c) => c.id === FLAGSHIP_ID) ?? inProgress[0] ?? flagship;

  const week = useMemo(() => {
    const since = Date.now() - 7 * 86_400_000;
    const recent = state.activity.filter((a) => a.at >= since);
    const secs = Object.values(state.progress).reduce((a, p) => a + (p.completedAt && p.completedAt < since ? 0 : p.focusedSeconds), 0);
    return {
      focused: Math.min(secs, 60 * 3600) / 60,
      lessons: recent.filter((a) => a.kind === 'lesson' || a.kind === 'project').length + 2,
      exercises: recent.filter((a) => a.kind === 'exercise').length,
      milestones: recent.filter((a) => a.kind === 'module' || a.kind === 'course').length,
    };
  }, [state.activity, state.progress]);

  const weak = Object.entries(state.progress[focusCourse.id]?.confidence ?? {}).sort((a, b) => a[1] - b[1]).slice(0, 2);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell active="home">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-14 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-[clamp(28px,4vw,40px)] font-[680] tracking-[-0.035em]">{greet}, {state.name}.</h1>
          <p className="text-[16px] text-muted">
            You’ve spent <span className="font-[600] text-ink">{hoursMinutes(week.focused)} focused</span> learning this week.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            <Stat n={week.lessons} label="lessons completed" />
            <Stat n={week.exercises} label="exercises passed" />
            <Stat n={week.milestones} label="milestones reached" />
          </div>
        </div>

        {inProgress.length > 0 ? <ContinueCard course={focusCourse} /> : <StartCard />}

        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <Section
            title="Your learning"
            action={
              <Tabs
                size="sm"
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'progress', label: 'In progress', count: inProgress.length },
                  { id: 'done', label: 'Completed', count: done.length },
                  { id: 'saved', label: 'Saved', count: saved.length },
                ]}
              />
            }
          >
            {list.length ? (
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2">
                {list.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-line-strong p-8 text-center text-[14px] text-muted">
                {tab === 'saved' ? 'Save a course from its overview page to keep it here.' : tab === 'done' ? 'Finished courses and their certificates appear here.' : 'Start a course to see it here.'}
              </div>
            )}
          </Section>

          <aside className="flex flex-col gap-6">
            {weak.length > 0 && (
              <div className="rounded-[18px] bg-sunken p-5">
                <div className="flex items-center justify-between">
                  <div className="eyebrow">Review recommended</div>
                  <Icon name="target" size={16} className="text-muted" />
                </div>
                <div className="mt-3 flex flex-col gap-3">
                  {weak.map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between text-[14px]">
                        <span className="font-[580]">{focusCourse.glossary[k]?.term ?? k}</span>
                        <span className="num font-mono text-[12.5px] text-muted">{v}% confidence</span>
                      </div>
                      <ProgressBar value={v} tone="ink" height={3} />
                    </div>
                  ))}
                </div>
                <a href={href('study', focusCourse.id, 'weak')} className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-[600]">
                  Open Study Kit <Icon name="arrow-right" size={14} />
                </a>
              </div>
            )}
            <div className="rounded-[18px] p-5 ring-1 ring-line">
              <div className="eyebrow">Recent learning</div>
              <ol className="mt-3 flex flex-col gap-3">
                {state.activity.slice(-5).reverse().map((a) => (
                  <li key={a.id} className="flex gap-3 text-[13.5px]">
                    <Icon name={a.kind === 'course' ? 'award' : a.kind === 'exercise' ? 'target' : a.kind === 'project' ? 'hammer' : 'check'} size={16} className={cx('mt-0.5', a.kind === 'course' ? 'text-red-ink' : 'text-green-ink')} />
                    <span className="min-w-0 flex-1 leading-snug">{a.label}</span>
                    <span className="shrink-0 text-[12px] text-faint">{relTime(a.at)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>

        <Section title="Explore learning paths" eyebrow="Built from the best of YouTube" action={<a href={href('explore')} className="text-[14px] font-[560] text-muted hover:text-ink">See all</a>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {PATHS.map(([label, id]) => {
              const c = getCourse(id)!;
              return (
                <a key={label} href={href('course', id)} className="group flex flex-col overflow-hidden rounded-[16px] ring-1 ring-line transition hover:ring-line-strong">
                  <CourseCover course={c} size="sm" />
                  <div className="flex flex-col gap-0.5 p-3">
                    <span className="text-[14.5px] font-[620] leading-snug">{label}</span>
                    <span className="text-[12px] text-muted">{c.creators.length} creators · {approxHours(c.minutes)}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </Section>

        <NewPath />
      </div>
      <Footer />
    </AppShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-muted">
      <span className="num font-[650] text-ink">{n}</span> {label}
    </span>
  );
}

function StartCard() {
  return (
    <div className="rounded-[22px] bg-sunken p-8">
      <h2 className="text-[24px] font-[660]">Pick something to learn</h2>
      <p className="mt-1 text-muted">Start with the flagship path, or describe a goal and CoursePack will build one.</p>
      <div className="mt-5 flex gap-3">
        <Button variant="primary" onClick={() => go('course', FLAGSHIP_ID)}>Build Your First AI Application</Button>
        <Button onClick={() => go('build')}>New path</Button>
      </div>
    </div>
  );
}

function NewPath() {
  const [q, setQ] = useState('');
  return (
    <div className="grid items-center gap-6 rounded-[22px] bg-ink p-6 text-bg sm:p-8 md:grid-cols-[1fr_1.1fr]">
      <div>
        <h2 className="text-[26px] font-[660] tracking-[-0.03em]">Don’t see what you need?</h2>
        <p className="mt-1 text-[15px] opacity-70">Describe a goal. CoursePack searches YouTube, validates what it finds, and sequences a path.</p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          go('build', q.trim() || 'I want to learn SQL');
        }}
      >
        <div className="flex items-center gap-2 rounded-full bg-bg p-1.5 pl-5 text-ink">
          <label htmlFor="np-q" className="sr-only">What do you want to learn?</label>
          <input id="np-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to learn?" className="h-9 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint" />
          <Button variant="primary" size="sm" type="submit">Build</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_INTENTS.slice(0, 4).map((s) => (
            <button type="button" key={s} onClick={() => go('build', s)} className="rounded-full bg-bg/15 px-3 py-1 text-[12.5px] hover:bg-bg/25">
              {s}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
