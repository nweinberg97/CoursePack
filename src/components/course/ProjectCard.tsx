import { useState } from 'react';
import type { Course } from '../../types';
import { locate } from '../../lib/buildCourse';
import { cx } from '../../lib/format';
import { useStore } from '../../state/store';
import { href } from '../../state/router';
import { Icon } from '../ui/Icon';
import { Button, ProgressBar, useToast } from '../ui/primitives';

export function ProjectCard({ course, showSubmit = true }: { course: Course; showSubmit?: boolean }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const p = state.progress[course.id];
  const proj = course.finalProject;
  const done = proj.milestones.filter((m) => p?.milestones.includes(m.id)).length;
  const [url, setUrl] = useState(p?.projectUrl ?? '');

  return (
    <div className="flex flex-col gap-5 rounded-[20px] p-5 ring-1 ring-line sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-ink text-bg">
          <Icon name="hammer" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">What you’ll build</div>
          <h3 className="mt-0.5 text-[19px] font-[640] leading-tight">{proj.title}</h3>
          <p className="mt-1 text-[14px] text-muted">{proj.summary}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={(done / proj.milestones.length) * 100} tone="green" className="flex-1" />
        <span className="num text-[12.5px] text-muted">{done}/{proj.milestones.length} milestones</span>
      </div>
      <ol className="flex flex-col">
        {proj.milestones.map((m) => {
          const on = !!p?.milestones.includes(m.id);
          const l = m.lessonId ? locate(course, m.lessonId) : null;
          return (
            <li key={m.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
              <button
                onClick={() => p && dispatch({ type: 'milestone', courseId: course.id, id: m.id })}
                disabled={!p}
                aria-pressed={on}
                aria-label={`Mark “${m.title}” ${on ? 'not done' : 'done'}`}
                className={cx('flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] transition', on ? 'bg-green text-white' : 'border-[1.5px] border-line-strong hover:border-ink')}
              >
                {on && <Icon name="check" size={13} strokeWidth={2.6} />}
              </button>
              <span className={cx('flex-1 text-[14px]', on && 'text-muted line-through decoration-line-strong')}>{m.title}</span>
              {l && (
                <a href={href('learn', course.id, l.lesson.id)} className="hidden shrink-0 text-[12.5px] text-muted hover:text-ink sm:inline">
                  Module {l.module.index}
                </a>
              )}
            </li>
          );
        })}
      </ol>
      {showSubmit && p && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'projectUrl', courseId: course.id, url: url.trim() });
            toast('Project link saved', 'link');
          }}
        >
          <label htmlFor={`proj-${course.id}`} className="text-[13px] font-[560]">{proj.deliverable}</label>
          <div className="flex gap-2">
            <input id={`proj-${course.id}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link to your project" className="h-10 min-w-0 flex-1 rounded-full bg-sunken px-4 text-[14px] outline-none placeholder:text-faint focus:ring-2 focus:ring-line-strong" />
            <Button type="submit" variant="ink" disabled={!url.trim()}>Save</Button>
          </div>
        </form>
      )}
    </div>
  );
}
