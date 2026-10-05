import { useState } from 'react';
import type { CategoryId } from '../types';
import { CATEGORIES, getCourse, libraryCourses, TOPICS } from '../data';
import { cx } from '../lib/format';
import { go } from '../state/router';
import { useStore } from '../state/store';
import { AppShell, Footer } from '../components/layout/Shell';
import { CourseCard } from '../components/course/CourseCard';
import { Icon } from '../components/ui/Icon';
import { Tabs } from '../components/ui/primitives';

export function Explore() {
  const { state } = useStore();
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [q, setQ] = useState('');
  const generated = state.generated.map((g) => getCourse(g.split('|')[0])).filter(Boolean) as ReturnType<typeof libraryCourses>;
  const courses = libraryCourses()
    .concat(generated)
    .filter((c) => (cat === 'all' || c.category === cat) && (!q || `${c.title} ${c.topic} ${c.description}`.toLowerCase().includes(q.toLowerCase())));
  const topics = TOPICS.filter((t) => (cat === 'all' || t.category === cat) && (!q || t.label.toLowerCase().includes(q.toLowerCase())));

  return (
    <AppShell active="explore">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-5">
          <h1 className="display max-w-[18ch] text-[clamp(34px,5vw,60px)]">If it’s taught well on YouTube, it can be a CoursePack.</h1>
          <p className="max-w-[60ch] text-[16px] text-muted">Every path is assembled from many creators, validated with public learner signals, and sequenced so each lesson prepares you for the next.</p>
          <form
            className="flex max-w-[560px] items-center gap-2 rounded-full bg-sunken px-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!courses.length && q.trim()) go('build', q.trim());
            }}
          >
            <Icon name="search" size={17} className="text-faint" />
            <label htmlFor="ex-q" className="sr-only">Search learning paths</label>
            <input id="ex-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search paths and topics" className="h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-faint" />
          </form>
        </div>

        <Tabs value={cat} onChange={setCat} tabs={[{ id: 'all' as const, label: 'All' }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))]} />

        {courses.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-[18px] bg-sunken p-6">
            <div className="text-[16px] font-[600]">No ready-made path for “{q}” yet.</div>
            <p className="text-[14px] text-muted">CoursePack can build one now from what’s on YouTube.</p>
            <button onClick={() => go('build', q)} className="inline-flex items-center gap-1.5 rounded-full bg-red px-4 py-2 text-[14px] font-[560] text-white">
              Build a path for “{q}” <Icon name="arrow-right" size={15} />
            </button>
          </div>
        )}

        <section className="flex flex-col gap-5 border-t border-line pt-10">
          <div>
            <h2 className="text-[20px] font-[640]">Topics</h2>
            <p className="text-[14px] text-muted">Pick any topic. Ones without a ready path are built for you in about ten seconds.</p>
          </div>
          {(cat === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === cat)).map((c) => {
            const ts = topics.filter((t) => t.category === c.id);
            if (!ts.length) return null;
            return (
              <div key={c.id} className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <div>
                  <div className="text-[14.5px] font-[620]">{c.label}</div>
                  <div className="text-[12.5px] text-muted">{c.blurb}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ts.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => (t.courseId ? go('course', t.courseId) : go('build', t.label))}
                      className={cx('inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13.5px] transition', t.courseId ? 'border-line-strong text-ink hover:bg-sunken' : 'border-dashed border-line-strong text-muted hover:border-solid hover:text-ink')}
                    >
                      {t.label}
                      {!t.courseId && <Icon name="plus" size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
      <Footer />
    </AppShell>
  );
}
