import type { Course } from '../../types';
import { creator } from '../../data/creators';
import { hoursMinutes } from '../../lib/format';
import { Logo } from '../ui/Icon';

export function SkillProgress({ skills }: { skills: { skill: string; value: number }[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {skills.map((s) => (
        <div key={s.skill} className="grid grid-cols-[minmax(0,140px)_1fr_40px] items-center gap-3">
          <span className="truncate text-[14px] font-[560]">{s.skill}</span>
          <div className="flex gap-[3px]" aria-label={`${s.value}%`}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-[10px] flex-1 rounded-[2px] ${i < Math.round(s.value / 10) ? 'bg-ink' : 'bg-sunken-2'}`} />
            ))}
          </div>
          <span className="num text-right font-mono text-[12px] text-muted">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Certificate({ course, name, date, minutes, id }: { course: Course; name: string; date: number; minutes: number; id: string }) {
  const names = course.creators.map((c) => creator(c).name);
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[#fbfaf7] p-[clamp(20px,5vw,52px)] text-[#121212] shadow-card ring-1 ring-black/10">
      <div className="pointer-events-none absolute inset-[10px] rounded-[14px] border border-black/10" />
      <div className="relative flex flex-col gap-[clamp(18px,3vw,30px)]">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-black/45">Certificate of completion</span>
        </div>
        <div>
          <div className="text-[13px] text-black/55">This certifies that</div>
          <div className="mt-1 text-[clamp(30px,5vw,48px)] font-[700] tracking-[-0.04em]">{name}</div>
          <div className="mt-3 text-[13px] text-black/55">completed every lesson, practice check and the final project of</div>
          <div className="mt-1 text-[clamp(20px,3vw,28px)] font-[650] leading-tight tracking-[-0.02em]">{course.title}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-black/10 pt-5 text-[13px] sm:grid-cols-4">
          <Field k="Completed" v={new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />
          <Field k="Time learning" v={hoursMinutes(minutes)} />
          <Field k="Final project" v={course.finalProject.title} />
          <Field k="Record ID" v={id} mono />
        </div>
        <div className="text-[12px] leading-relaxed text-black/50">
          Taught through videos by {names.slice(0, -1).join(', ')}{names.length > 1 ? ' and ' : ''}{names.at(-1)}. CoursePack is not an accredited institution; this records completion, not accreditation.
        </div>
      </div>
    </div>
  );
}

function Field({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-[0.08em] text-black/45">{k}</div>
      <div className={`mt-0.5 truncate font-[600] ${mono ? 'font-mono text-[12px]' : ''}`}>{v}</div>
    </div>
  );
}
