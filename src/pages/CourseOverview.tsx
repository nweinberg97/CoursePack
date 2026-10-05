import { useState } from 'react';
import type { Course, Lesson } from '../types';
import { CATEGORIES } from '../data';
import { creator } from '../data/creators';
import { allLessons } from '../lib/buildCourse';
import { cx, hoursMinutes } from '../lib/format';
import { go, href } from '../state/router';
import { useCourseStats, useStore } from '../state/store';
import { AppShell, Footer } from '../components/layout/Shell';
import { CourseCover } from '../components/course/CourseCard';
import { CreatorCard } from '../components/course/Creator';
import { ModuleList } from '../components/course/Curriculum';
import { ProjectCard } from '../components/course/ProjectCard';
import { WhyThisVideo } from '../components/course/Validation';
import { Icon } from '../components/ui/Icon';
import { Button, LinkButton, Modal, Pill, ProgressBar, useToast } from '../components/ui/primitives';

export function CourseOverview({ course }: { course: Course }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const st = useCourseStats(course);
  const p = state.progress[course.id];
  const [why, setWhy] = useState<Lesson | null>(null);
  const lessons = allLessons(course);
  const saved = state.saved.includes(course.id);
  const candidates = lessons.reduce((a, l) => a + l.candidates.length + 1, 0);

  const start = () => {
    dispatch({ type: 'start', courseId: course.id });
    go('learn', course.id, p?.currentLessonId ?? lessons[0].id);
  };

  return (
    <AppShell active="explore">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-14 px-4 py-8 sm:px-6 sm:py-10">
        {/* CourseHeader */}
        <header className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="flex flex-col gap-5">
            <nav className="flex items-center gap-1.5 text-[13px] text-muted">
              <a href={href('explore')} className="hover:text-ink">Explore</a>
              <Icon name="chevron-right" size={13} />
              <span>{CATEGORIES.find((c) => c.id === course.category)?.label}</span>
            </nav>
            <h1 className="display text-[clamp(36px,5.6vw,64px)]">{course.title}</h1>
            <p className="max-w-[56ch] text-[17px] leading-relaxed text-muted">{course.description}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
              {[
                [course.modules.length, 'modules'],
                [lessons.length, 'lessons'],
                [hoursMinutes(course.minutes), ''],
                [course.creators.length, 'creators'],
              ].map(([n, l], i) => (
                <span key={i}>
                  <span className="num font-[640]">{n}</span> <span className="text-muted">{l}</span>
                </span>
              ))}
              <Pill tone="outline">{course.level}</Pill>
            </div>
            {st.started && (
              <div className="flex max-w-[460px] items-center gap-3">
                <ProgressBar value={st.pct} tone={st.finished ? 'green' : 'red'} className="flex-1" height={6} />
                <span className="num text-[13px] font-[560]">{st.done}/{st.total}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2.5">
              {st.finished ? (
                <LinkButton href={href('complete', course.id)} variant="primary" size="lg" icon="award">View completion</LinkButton>
              ) : (
                <Button variant="primary" size="lg" iconRight="arrow-right" onClick={start}>
                  {st.started ? 'Continue Learning' : 'Start Course'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                icon="bookmark"
                onClick={() => {
                  dispatch({ type: 'save', courseId: course.id });
                  toast(saved ? 'Removed from saved' : 'Saved to your learning', 'bookmark');
                }}
              >
                {saved ? 'Saved' : 'Save'}
              </Button>
              {st.started && <LinkButton href={href('study', course.id)} variant="quiet" size="lg" icon="book">Study Kit</LinkButton>}
            </div>
            {st.started && st.current && !st.finished && (
              <div className="text-[13.5px] text-muted">
                Up next: <a href={href('learn', course.id, st.current.lesson.id)} className="font-[560] text-ink hover:underline">{st.current.lesson.title}</a> · ~{hoursMinutes(st.remainingMin)} remaining
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[20px] ring-1 ring-line">
              <CourseCover course={course} size="lg" />
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[16px] bg-line ring-1 ring-line">
              {[
                [course.scanned.toLocaleString(), 'videos scanned'],
                [candidates.toString(), 'finalists compared'],
                [lessons.length.toString(), 'selected'],
              ].map(([n, l]) => (
                <div key={l} className="bg-surface p-3.5">
                  <div className="num text-[18px] font-[660] tracking-[-0.02em]">{n}</div>
                  <div className="text-[12px] text-muted">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="flex min-w-0 flex-col gap-12">
            <section className="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="text-[18px] font-[640]">What you’ll be able to do</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {course.outcomes.map((o) => (
                    <li key={o} className="flex gap-2.5 text-[14.5px]">
                      <Icon name="check" size={17} className="mt-0.5 text-green-ink" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-[18px] font-[640]">Skills</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {course.skills.map((s) => (
                      <Pill key={s}>{s}</Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-[18px] font-[640]">You’ll need</h2>
                  <ul className="mt-2 flex flex-col gap-1.5 text-[14px] text-muted">
                    {course.tools.map((t) => (
                      <li key={t} className="flex gap-2">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-faint" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-[660]">Curriculum</h2>
                  <p className="text-[14px] text-muted">Sequenced by prerequisites. Each lesson is the best-validated video for that point in the path.</p>
                </div>
              </div>
              <ModuleList course={course} progress={p} currentLessonId={p?.currentLessonId} onSelect={(l) => { dispatch({ type: 'start', courseId: course.id }); go('learn', course.id, l.id); }} onWhy={setWhy} />
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            <ProjectCard course={course} />
            <div>
              <h2 className="text-[16px] font-[640]">Built from the best of YouTube</h2>
              <p className="mt-0.5 text-[13.5px] text-muted">{course.creators.length} creators, each chosen for the concepts they explain best.</p>
              <div className="mt-4 flex flex-col gap-2">
                {course.creators.map((id) => (
                  <CreatorCard key={id} c={creator(id)} course={course} />
                ))}
              </div>
            </div>
            <div className={cx('rounded-[16px] bg-sunken p-4 text-[13px] leading-relaxed text-muted')}>
              CoursePack links to and credits every source video. Creators keep their views; CoursePack adds the structure around them.
            </div>
          </aside>
        </div>
      </div>
      <Footer />
      <Modal open={!!why} onClose={() => setWhy(null)} label="Why this video?">
        {why && <WhyThisVideo lesson={why} onClose={() => setWhy(null)} />}
      </Modal>
    </AppShell>
  );
}
