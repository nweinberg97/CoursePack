import type { Course } from '../types';
import { getCourse, libraryCourses } from '../data';
import { cx, hoursMinutes, relTime } from '../lib/format';
import { href } from '../state/router';
import { courseStats, skillLevels, useStore } from '../state/store';
import { AppShell, Footer } from '../components/layout/Shell';
import { Icon } from '../components/ui/Icon';
import { LinkButton, ProgressBar, ProgressRing } from '../components/ui/primitives';
import { SkillProgress } from '../components/progress/SkillProgress';
import { ProjectCard } from '../components/course/ProjectCard';

export function Progress({ courseId }: { courseId?: string }) {
  const { state } = useStore();
  const started = libraryCourses()
    .concat(state.generated.map((g) => getCourse(g.split('|')[0])!).filter(Boolean))
    .filter((c) => state.progress[c.id]);
  const course = (courseId && getCourse(courseId)) || started.find((c) => !courseStats(c, state.progress[c.id]).finished) || started[0];
  const completed = started.filter((c) => courseStats(c, state.progress[c.id]).finished);

  return (
    <AppShell active="progress">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-[clamp(30px,4.4vw,48px)] font-[700] tracking-[-0.04em]">Progress</h1>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {started.map((c) => (
              <a key={c.id} href={href('progress', c.id)} className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] font-[540]', c.id === course?.id ? 'bg-ink text-bg' : 'bg-sunken text-muted hover:text-ink')}>
                {c.title}
              </a>
            ))}
          </div>
        </div>
        {course ? <CourseProgressView course={course} /> : <p className="text-muted">Start a course to see your progress.</p>}

        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-[640]">Learning history</h2>
          {completed.length ? (
            <ol className="flex flex-col divide-y divide-line rounded-[18px] ring-1 ring-line">
              {completed
                .sort((a, b) => (state.progress[b.id].completedAt ?? 0) - (state.progress[a.id].completedAt ?? 0))
                .map((c) => {
                  const p = state.progress[c.id];
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-4 px-4 py-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-soft text-green-ink"><Icon name="award" size={19} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-[620]">{c.title}</div>
                        <div className="text-[13px] text-muted">
                          Completed {p.completedAt ? new Date(p.completedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : ''} · {hoursMinutes(p.focusedSeconds / 60)} · Built {c.finalProject.title}
                        </div>
                      </div>
                      <LinkButton href={href('complete', c.id)} size="sm" variant="ghost">Certificate</LinkButton>
                    </li>
                  );
                })}
            </ol>
          ) : (
            <p className="text-[14px] text-muted">Completed courses will be listed here with their certificates.</p>
          )}
        </section>
      </div>
      <Footer />
    </AppShell>
  );
}

function CourseProgressView({ course }: { course: Course }) {
  const { state } = useStore();
  const p = state.progress[course.id];
  const st = courseStats(course, p);
  const skills = skillLevels(course, p);
  const recent = state.activity.filter((a) => a.courseId === course.id).slice(-6).reverse();
  const accuracy = p?.quizTotal ? Math.round((p.quizCorrect / p.quizTotal) * 100) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-wrap items-center gap-6 rounded-[22px] bg-sunken p-6">
          <ProgressRing value={st.pct} size={104} stroke={8} tone={st.finished ? 'var(--green)' : 'var(--red)'}>
            <span className="num text-[24px] font-[700] tracking-[-0.03em]">{st.pct}%</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="text-[22px] font-[660] leading-tight tracking-[-0.02em]">{course.title}</div>
            <div className="mt-1 text-[14.5px] text-muted">
              <span className="num font-[600] text-ink">{st.done} / {st.total}</span> lessons
              {accuracy !== null && <> · <span className="num font-[600] text-ink">{accuracy}%</span> practice accuracy</>}
              {' · '}
              <span className="num font-[600] text-ink">{hoursMinutes((p?.focusedSeconds ?? 0) / 60)}</span> focused
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {st.finished ? (
                <LinkButton href={href('complete', course.id)} variant="primary" size="sm" icon="award">View completion</LinkButton>
              ) : (
                st.current && <LinkButton href={href('learn', course.id, st.current.lesson.id)} variant="primary" size="sm" iconRight="arrow-right">Continue: {st.current.lesson.title}</LinkButton>
              )}
              <LinkButton href={href('study', course.id)} variant="ghost" size="sm" icon="book">Study Kit</LinkButton>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-[640]">Skills</h2>
            <span className="text-[12.5px] text-muted">Lessons covered × quiz confidence</span>
          </div>
          <SkillProgress skills={skills} />
        </section>

        <section>
          <h2 className="mb-4 text-[18px] font-[640]">Modules</h2>
          <ol className="flex flex-col gap-2.5">
            {course.modules.map((m) => {
              const d = m.lessons.filter((l) => p?.completed.includes(l.id)).length;
              return (
                <li key={m.id} className="grid grid-cols-[28px_1fr_120px_44px] items-center gap-3 text-[14px]">
                  <span className={cx('num font-mono text-[12px]', d === m.lessons.length ? 'text-green-ink' : 'text-faint')}>{String(m.index).padStart(2, '0')}</span>
                  <span className="truncate">{m.title}</span>
                  <ProgressBar value={(d / m.lessons.length) * 100} tone={d === m.lessons.length ? 'green' : 'ink'} />
                  <span className="num text-right text-[12.5px] text-muted">{d}/{m.lessons.length}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <aside className="flex flex-col gap-6">
        <div className="rounded-[18px] p-5 ring-1 ring-line">
          <div className="eyebrow">Recent learning</div>
          <ol className="mt-3 flex flex-col gap-3">
            {recent.length ? recent.map((a) => (
              <li key={a.id} className="flex gap-3 text-[14px]">
                <Icon name="check" size={16} className="mt-0.5 text-green-ink" />
                <span className="flex-1 leading-snug">{a.label}</span>
                <span className="shrink-0 text-[12px] text-faint">{relTime(a.at)}</span>
              </li>
            )) : <li className="text-[14px] text-muted">Nothing yet.</li>}
          </ol>
        </div>
        <ProjectCard course={course} />
      </aside>
    </div>
  );
}
