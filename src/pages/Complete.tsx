import type { Course } from '../types';
import { getCourse } from '../data';
import { allLessons } from '../lib/buildCourse';
import { hash } from '../lib/random';
import { hoursMinutes } from '../lib/format';
import { go, href } from '../state/router';
import { courseStats, useStore } from '../state/store';
import { AppShell, Footer } from '../components/layout/Shell';
import { Icon } from '../components/ui/Icon';
import { Button, copyText, LinkButton, useToast } from '../components/ui/primitives';
import { Certificate } from '../components/progress/SkillProgress';
import { CourseCard } from '../components/course/CourseCard';

const NEXT: Record<string, string[]> = {
  'ai-app': ['sql', 'website', 'product-design'],
  sql: ['python', 'ai-app', 'business'],
  python: ['ai-app', 'sql', 'website'],
};

export function Complete({ course }: { course: Course }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const p = state.progress[course.id];
  const st = courseStats(course, p);

  if (!st.finished) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-[640px] flex-col items-start gap-4 px-4 py-20 sm:px-6">
          <h1 className="text-[32px] font-[680] tracking-[-0.03em]">Not finished yet</h1>
          <p className="text-muted">You’ve completed {st.done} of {st.total} lessons in {course.title}. The completion record unlocks when every lesson and the final project are done.</p>
          <div className="flex gap-2">
            {st.current && <LinkButton href={href('learn', course.id, st.current.lesson.id)} variant="primary">Continue learning</LinkButton>}
            <Button variant="quiet" onClick={() => dispatch({ type: 'finishCourse', courseId: course.id })}>Prototype: mark everything complete</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const minutes = (p?.focusedSeconds ?? course.minutes * 60) / 60;
  const accuracy = p?.quizTotal ? Math.round((p.quizCorrect / p.quizTotal) * 100) : 92;
  const recordId = `CP-${hash(course.id + state.name).toString(36).toUpperCase().slice(0, 6)}`;
  const nexts = (NEXT[course.id] ?? ['ai-app', 'sql', 'product-design']).filter((id) => id !== course.id).map((id) => getCourse(id)!).slice(0, 3);
  const projectUrl = p?.projectUrl;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1100px] flex-col gap-14 px-4 py-10 sm:px-6 sm:py-14">
        <header className="anim-fade-up flex flex-col items-start gap-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-green text-white">
            <Icon name="award" size={28} />
          </span>
          <div>
            <div className="eyebrow">Course complete</div>
            <h1 className="display mt-2 text-[clamp(38px,6vw,72px)]">{course.title}</h1>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              [`${allLessons(course).length} / ${allLessons(course).length}`, 'lessons'],
              [hoursMinutes(minutes), 'learned'],
              [`${accuracy}%`, 'practice accuracy'],
              [String(course.finalProject.milestones.length), 'project milestones'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="num text-[30px] font-[680] tracking-[-0.03em]">{n}</div>
                <div className="text-[13.5px] text-muted">{l}</div>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-[20px] p-6 ring-1 ring-line">
            <div className="eyebrow">You learned</div>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {course.skills.map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-[15px] font-[560]"><Icon name="check" size={17} className="text-green-ink" /> {s}</li>
              ))}
            </ul>
            <ul className="mt-5 flex flex-col gap-1.5 border-t border-line pt-4 text-[14px] text-muted">
              {course.outcomes.slice(0, 4).map((o) => <li key={o}>{o}</li>)}
            </ul>
          </section>
          <section className="flex flex-col justify-between gap-6 rounded-[20px] bg-ink p-6 text-bg">
            <div>
              <div className="font-mono text-[11.5px] uppercase tracking-[0.08em] opacity-60">You built</div>
              <div className="mt-2 text-[28px] font-[680] leading-tight tracking-[-0.03em]">{course.finalProject.title}</div>
              <p className="mt-2 text-[14.5px] opacity-70">{course.finalProject.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {projectUrl ? (
                <a href={projectUrl.startsWith('http') ? projectUrl : `https://${projectUrl}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-bg px-4 text-[14px] font-[600] text-ink">
                  View Project <Icon name="external" size={15} />
                </a>
              ) : (
                <a href={href('progress', course.id)} className="inline-flex h-10 items-center gap-2 rounded-full bg-bg px-4 text-[14px] font-[600] text-ink">View Project</a>
              )}
              {projectUrl && <span className="truncate font-mono text-[12.5px] opacity-60">{projectUrl}</span>}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[22px] font-[660]">Certificate of Completion</h2>
            <Button
              variant="ink"
              icon="share"
              onClick={async () => {
                const text = `I just completed “${course.title}” on CoursePack: ${allLessons(course).length} lessons from ${course.creators.length} YouTube creators, and I built ${course.finalProject.title}. Record ${recordId}.`;
                const ok = await copyText(text);
                toast(ok ? 'Completion summary copied' : 'Copy unavailable here. Select the certificate text instead.', ok ? 'copy' : 'info');
              }}
            >
              Share Completion
            </Button>
          </div>
          <Certificate course={course} name={state.name === 'Alex' ? 'Alex Rivera' : state.name} date={p?.completedAt ?? Date.now()} minutes={minutes} id={recordId} />
        </section>

        <section className="flex flex-col gap-6 border-t border-line pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[26px] font-[680] tracking-[-0.03em]">Explore your next CoursePack</h2>
            <Button variant="ghost" iconRight="arrow-right" onClick={() => go('build')}>Build a new path</Button>
          </div>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {nexts.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      </div>
      <Footer />
    </AppShell>
  );
}
