import { useEffect, useState } from 'react';
import type { Course, CourseProgress, Lesson, Module } from '../../types';
import { creator } from '../../data/creators';
import { coursePackScore, signalsFor } from '../../lib/scoring';
import { clock, cx, hoursMinutes, pad2 } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { CoursePackScore } from './Validation';
import { CreatorAvatar } from './Creator';

type Status = 'done' | 'current' | 'upcoming';

export function StatusDot({ status, project }: { status: Status; project?: boolean }) {
  if (status === 'done')
    return (
      <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-green text-white">
        <Icon name="check" size={13} strokeWidth={2.6} />
      </span>
    );
  if (status === 'current')
    return (
      <span className="relative flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-[2px] border-red">
        <span className="h-[8px] w-[8px] rounded-full bg-red" />
      </span>
    );
  return (
    <span className={cx('flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong text-faint', project && 'rounded-[6px]')}>
      {project && <Icon name="hammer" size={11} />}
    </span>
  );
}

export function LessonItem({ lesson, status, onSelect, onWhy, dense, index }: { lesson: Lesson; status: Status; onSelect: () => void; onWhy?: () => void; dense?: boolean; index: string }) {
  const c = creator(lesson.video.creatorId);
  const score = coursePackScore(signalsFor(lesson.video, c));
  return (
    <div className={cx('group relative flex items-start gap-3 rounded-[12px] transition', dense ? 'px-2.5 py-2' : 'px-3 py-2.5', status === 'current' ? 'bg-red-soft/70' : 'hover:bg-sunken')}>
      <button onClick={onSelect} className="absolute inset-0 rounded-[12px]" aria-label={`Open lesson: ${lesson.title}`} />
      <div className="pt-[1px]">
        <StatusDot status={status} project={lesson.kind === 'project'} />
      </div>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={cx('text-[14px] leading-snug', status === 'current' ? 'font-[620]' : 'font-[500]', status === 'done' && 'text-muted')}>
            {lesson.title}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
          {!dense && <CreatorAvatar c={c} size={15} />}
          <span className="truncate">{c.name}</span>
          <span className="text-faint">·</span>
          <span className="num shrink-0">{clock(lesson.duration)}</span>
          {lesson.kind === 'project' && <span className="shrink-0 font-[560] text-ink">· Project</span>}
        </div>
      </div>
      {!dense && (
        <div className="relative flex shrink-0 items-center gap-1.5 pt-0.5">
          {onWhy && (
            <button onClick={onWhy} className="hidden rounded-full px-2 py-1 text-[12px] font-[540] text-muted hover:bg-surface hover:text-ink sm:inline-flex">
              Why this video?
            </button>
          )}
          <CoursePackScore score={score} size="xs" />
        </div>
      )}
      <span className="sr-only">{index}</span>
    </div>
  );
}

export function ModuleList({
  course,
  progress,
  currentLessonId,
  onSelect,
  onWhy,
  dense,
  expandAll,
}: {
  course: Course;
  progress?: CourseProgress;
  currentLessonId?: string;
  onSelect: (l: Lesson) => void;
  onWhy?: (l: Lesson) => void;
  dense?: boolean;
  expandAll?: boolean;
}) {
  const currentModule = course.modules.find((m) => m.lessons.some((l) => l.id === currentLessonId))?.id ?? course.modules[0].id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(expandAll ? course.modules.map((m) => m.id) : [currentModule]));
  useEffect(() => {
    setOpen((o) => new Set([...o, currentModule]));
  }, [currentModule]);
  const status = (l: Lesson): Status => (progress?.completed.includes(l.id) ? 'done' : l.id === currentLessonId ? 'current' : 'upcoming');
  const toggle = (m: Module) =>
    setOpen((o) => {
      const n = new Set(o);
      n.has(m.id) ? n.delete(m.id) : n.add(m.id);
      return n;
    });

  return (
    <div className="flex flex-col">
      {course.modules.map((m) => {
        const done = m.lessons.filter((l) => progress?.completed.includes(l.id)).length;
        const isOpen = open.has(m.id);
        const min = m.lessons.reduce((a, l) => a + l.duration / 60, 0);
        const complete = done === m.lessons.length;
        return (
          <div key={m.id} className={cx(!dense && 'border-b border-line last:border-0')}>
            <button onClick={() => toggle(m)} aria-expanded={isOpen} className={cx('flex w-full items-start gap-3 text-left', dense ? 'px-2.5 py-3' : 'px-1 py-4')}>
              <span className={cx('num font-mono text-[12px] pt-[3px]', complete ? 'text-green-ink' : 'text-faint')}>{pad2(m.index)}</span>
              <span className="min-w-0 flex-1">
                <span className={cx('block font-[620] leading-snug', dense ? 'text-[13.5px]' : 'text-[16px]')}>{m.title}</span>
                <span className="mt-0.5 block text-[12.5px] text-muted">
                  {done}/{m.lessons.length} lessons · {hoursMinutes(min)}
                  {m.project && !dense && <> · <span className="text-ink">Project: {m.project}</span></>}
                </span>
                {!dense && isOpen && <span className="mt-1.5 block max-w-[60ch] text-[14px] text-muted">{m.description}</span>}
              </span>
              <Icon name="chevron-down" size={17} className={cx('mt-0.5 text-faint transition', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className={cx('flex flex-col', dense ? 'pb-2' : 'pb-4 sm:pl-6')}>
                {m.lessons.map((l, i) => (
                  <LessonItem key={l.id} lesson={l} index={`${m.index}.${i + 1}`} status={status(l)} onSelect={() => onSelect(l)} onWhy={onWhy ? () => onWhy(l) : undefined} dense={dense} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
