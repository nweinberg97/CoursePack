import type { Course } from '../../types';
import { allLessons } from '../../lib/buildCourse';
import { approxHours, cx, hoursMinutes } from '../../lib/format';
import { href } from '../../state/router';
import { courseStats, useStore } from '../../state/store';
import { Icon } from '../ui/Icon';
import { LinkButton, ProgressBar } from '../ui/primitives';
import { CreatorStack } from './Creator';
import { Thumbnail } from './Thumbnail';

export function CourseCover({ course, size = 'md', className }: { course: Course; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <Thumbnail
      className={className}
      size={size}
      thumb={{ kicker: `CoursePack · ${course.creators.length} creators`, headline: course.topic === 'AI' ? 'Build an AI app' : course.topic, variant: course.cover.motif, hue: course.cover.hue }}
    />
  );
}

export function courseMeta(c: Course) {
  return `${c.modules.length} modules · ${allLessons(c).length} lessons · ${c.creators.length} creators`;
}

export function CourseCard({ course, className }: { course: Course; className?: string }) {
  const { state } = useStore();
  const st = courseStats(course, state.progress[course.id]);
  const saved = state.saved.includes(course.id);
  return (
    <a href={href('course', course.id)} className={cx('group flex flex-col gap-3 rounded-[16px] outline-none', className)}>
      <div className="overflow-hidden rounded-[14px] ring-1 ring-line transition group-hover:ring-line-strong">
        <div className="transition duration-500 group-hover:scale-[1.02]">
          <CourseCover course={course} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-[620] leading-snug">{course.title}</h3>
          {saved && !st.started && <Icon name="bookmark" size={16} className="mt-0.5 text-muted" fill />}
        </div>
        <div className="text-[13px] text-muted">{courseMeta(course)}</div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <CreatorStack ids={course.creators} size={22} max={4} />
          <span className="text-[12.5px] text-muted">{approxHours(course.minutes)} · {course.level.split(' ')[0]}</span>
        </div>
        {st.started && (
          <div className="mt-1.5 flex items-center gap-2.5">
            <ProgressBar value={st.pct} tone={st.finished ? 'green' : 'red'} className="flex-1" />
            <span className="num text-[12px] text-muted">{st.finished ? 'Complete' : `${st.pct}%`}</span>
          </div>
        )}
      </div>
    </a>
  );
}

/** The dominant "continue learning" card on the dashboard. */
export function ContinueCard({ course }: { course: Course }) {
  const { state } = useStore();
  const st = courseStats(course, state.progress[course.id]);
  const cur = st.current;
  if (!cur) return null;
  return (
    <div className="grid overflow-hidden rounded-[22px] bg-surface ring-1 ring-line md:grid-cols-[1.15fr_1fr]">
      <a href={href('learn', course.id, cur.lesson.id)} className="group relative block" aria-label={`Continue: ${cur.lesson.title}`}>
        <Thumbnail thumb={cur.lesson.video.thumb} size="lg" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-card transition group-hover:scale-105">
            <Icon name="play" size={26} fill className="ml-1" />
          </span>
        </span>
        <div className="absolute inset-x-0 bottom-0 h-[4px] bg-white/20">
          <div className="h-full bg-red" style={{ width: '38%' }} />
        </div>
      </a>
      <div className="flex flex-col justify-between gap-6 p-5 sm:p-7">
        <div className="flex flex-col gap-3">
          <div className="eyebrow">Continue learning</div>
          <h2 className="text-[26px] font-[680] leading-[1.08] tracking-[-0.03em] sm:text-[30px]">{course.title}</h2>
          <div className="text-[14px] text-muted">
            Module {cur.module.index} of {course.modules.length} · {cur.module.title}
          </div>
          <div className="mt-2 rounded-[14px] bg-sunken p-3.5">
            <div className="text-[12px] font-[560] text-muted">Up next</div>
            <div className="mt-0.5 text-[15px] font-[600]">{cur.lesson.title}</div>
            <div className="mt-0.5 text-[13px] text-muted">{cur.lesson.objective}</div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ProgressBar value={st.pct} className="flex-1" height={6} />
            <span className="num text-[13px] font-[560]">{st.done} / {st.total} lessons</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] text-muted">~{hoursMinutes(st.remainingMin)} remaining</span>
            <LinkButton href={href('learn', course.id, cur.lesson.id)} variant="primary" iconRight="arrow-right">
              Continue
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
