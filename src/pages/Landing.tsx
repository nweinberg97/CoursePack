import { useState } from 'react';
import { getCourse, SUGGESTED_INTENTS } from '../data';
import { creator } from '../data/creators';
import { allLessons } from '../lib/buildCourse';
import { coursePackScore, signalsFor } from '../lib/scoring';
import { clock, compact, cx } from '../lib/format';
import { go, href } from '../state/router';
import { Icon, Logo, type IconName } from '../components/ui/Icon';
import { Button, LinkButton } from '../components/ui/primitives';
import { CourseCard, courseMeta } from '../components/course/CourseCard';
import { CoursePackScore } from '../components/course/Validation';
import { CreatorAvatar, CreatorStack } from '../components/course/Creator';
import { ValidationLab } from '../components/generate/ValidationLab';
import { Footer, ThemeToggle } from '../components/layout/Shell';

export function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky z-30 border-b border-line/0 bg-bg/85 backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-[64px] max-w-[1240px] items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="ml-6 hidden gap-6 text-[14px] font-[520] text-muted md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#method" className="hover:text-ink">How videos are chosen</a>
            <a href={href('explore')} className="hover:text-ink">Explore</a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <LinkButton href={href('home')} variant="ink" size="sm">Open CoursePack</LinkButton>
          </div>
        </div>
      </header>

      <Hero />
      <ValueChain />
      <Method />
      <StopWatching />
      <Skills />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Hero() {
  const sql = getCourse('sql')!;
  const lessons = sql.modules.slice(0, 4).map((m) => m.lessons[m.index === 3 ? 1 : 0]);
  return (
    <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-7">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-3 py-1 text-[13px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-red" /> A learning layer for YouTube
        </div>
        <h1 className="display text-[clamp(48px,8.4vw,104px)]">
          Learn anything.
          <br />
          <span className="text-muted">Actually.</span>
        </h1>
        <p className="max-w-[48ch] text-[clamp(17px,1.6vw,19px)] leading-[1.5] text-muted">
          <span className="text-ink">CoursePack turns the best educational content on YouTube into structured learning paths,</span> with AI tutoring, practice, and progress built in.
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={href('explore')} variant="primary" size="lg" iconRight="arrow-right">Explore Courses</LinkButton>
          <LinkButton href="#how" variant="ghost" size="lg">See How It Works</LinkButton>
        </div>
      </div>

      {/* Product vignette: an assembled path, with the evidence on show. */}
      <div className="relative">
        <div className="rounded-[24px] bg-surface p-2 shadow-card ring-1 ring-line">
          <div className="flex items-center gap-2 rounded-[18px] bg-sunken px-4 py-3 text-[14px]">
            <Icon name="search" size={16} className="text-faint" />
            <span className="text-muted">I want to learn</span>
            <span className="font-[600]">SQL</span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-green-ink">
              <Icon name="check" size={13} /> path ready
            </span>
          </div>
          <div className="px-4 pb-2 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[19px] font-[660] tracking-[-0.02em]">{sql.title}</div>
                <div className="mt-0.5 text-[13px] text-muted">{courseMeta(sql)}</div>
              </div>
              <CreatorStack ids={sql.creators} size={24} max={4} />
            </div>
            <div className="mt-2 font-mono text-[11.5px] text-faint">{sql.scanned.toLocaleString()} videos scanned · {allLessons(sql).length} selected</div>
          </div>
          <ol className="flex flex-col p-2">
            {lessons.map((l, i) => {
              const c = creator(l.video.creatorId);
              return (
                <li key={l.id} className="flex items-center gap-3 rounded-[12px] px-2 py-2.5 hover:bg-sunken">
                  <span className="num w-5 font-mono text-[12px] text-faint">{String(i + 1).padStart(2, '0')}</span>
                  <CreatorAvatar c={c} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-[580]">{l.title}</div>
                    <div className="truncate text-[12.5px] text-muted">
                      {c.name} · {clock(l.duration)} · {compact(l.video.metrics.views)} views
                    </div>
                  </div>
                  <CoursePackScore score={coursePackScore(signalsFor(l.video, c))} size="xs" />
                </li>
              );
            })}
          </ol>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className="text-[12.5px] text-muted">Final project: analyse a real customer dataset</span>
            <a href={href('build', 'I want to learn SQL')} className="inline-flex items-center gap-1 text-[13px] font-[600] text-red-ink">
              Build it <Icon name="arrow-right" size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const CHAIN: { label: string; icon: IconName; desc: string }[] = [
  { label: 'YouTube videos', icon: 'play', desc: 'Thousands of candidates per topic' },
  { label: 'Validation', icon: 'shield', desc: 'Learner feedback, engagement, authority' },
  { label: 'Curriculum', icon: 'route', desc: 'Sequenced by prerequisites' },
  { label: 'AI Study Partner', icon: 'message', desc: 'Answers from the lesson, with sources' },
  { label: 'Practice', icon: 'target', desc: 'Checks and exercises after lessons' },
  { label: 'Projects', icon: 'hammer', desc: 'Every path ends in something real' },
  { label: 'Progress', icon: 'chart', desc: 'Measured as capability' },
  { label: 'Real skills', icon: 'award', desc: 'What you can now do' },
];

function ValueChain() {
  return (
    <section id="how" className="scroll-mt-20 border-y border-line bg-sunken/60">
      <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <h2 className="display text-[clamp(34px,5vw,58px)]">
            YouTube has the videos.
            <br />
            <span className="text-muted">CoursePack builds the learning experience.</span>
          </h2>
          <p className="max-w-[46ch] text-[17px] text-muted md:justify-self-end">
            The best explanation of APIs, the best explanation of RAG and the best project tutorial usually come from different creators. CoursePack finds each one and puts them in the order you need them.
          </p>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[20px] bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
          {CHAIN.map((s, i) => (
            <li key={s.label} className="flex flex-col gap-6 bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className={cx('flex h-9 w-9 items-center justify-center rounded-[10px]', i === 0 ? 'bg-red text-white' : i === CHAIN.length - 1 ? 'bg-ink text-bg' : 'bg-sunken text-ink')}>
                  <Icon name={s.icon} size={18} />
                </span>
                <span className="font-mono text-[11.5px] text-faint">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div>
                <div className="text-[16px] font-[620]">{s.label}</div>
                <div className="mt-0.5 text-[13.5px] text-muted">{s.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const PIPE = ['YouTube', 'Candidate videos', 'Transcript analysis', 'Validation signals', 'Concept mapping', 'Curriculum sequencing', 'CoursePack course'];

function Method() {
  return (
    <section id="method" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="eyebrow">How videos are chosen</div>
          <h2 className="display mt-3 text-[clamp(32px,4.4vw,52px)]">The most viewed video is rarely the best lesson.</h2>
        </div>
        <div className="flex flex-col gap-4 text-[16px] text-muted lg:pt-8">
          <p>For every concept, CoursePack scores candidates on three ecosystem signals. <span className="text-ink">Learner feedback</span> asks whether comments show people actually understood it. <span className="text-ink">Engagement</span> looks at performance relative to a channel’s reach, not raw views. <span className="text-ink">Creator authority</span> counts, but it’s log-scaled so size alone can’t win.</p>
          <p>Then <span className="text-ink">curriculum fit</span> asks the question a playlist never does: is this the best video for this learner, at this point in the path?</p>
        </div>
      </div>
      <div className="no-scrollbar mt-10 flex items-center gap-2 overflow-x-auto pb-1 font-mono text-[12px]">
        {PIPE.map((p, i) => (
          <span key={p} className="flex shrink-0 items-center gap-2">
            <span className={cx('rounded-full px-3 py-1.5', i === PIPE.length - 1 ? 'bg-ink text-bg' : 'bg-sunken text-muted')}>{p}</span>
            {i < PIPE.length - 1 && <Icon name="arrow-right" size={14} className="text-faint" />}
          </span>
        ))}
      </div>
      <div className="mt-8">
        <ValidationLab />
      </div>
    </section>
  );
}

function StopWatching() {
  const yt = ['Search', 'Watch', 'Next video', 'Recommendation', 'Shorts', 'Forget'];
  const cp = ['Goal', 'Validated content', 'Curriculum', 'Lesson', 'Practice', 'Project', 'Progress'];
  return (
    <section className="bg-stage text-white">
      <div className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
        <h2 className="display text-[clamp(38px,6vw,76px)]">
          Stop watching.
          <br />
          Start learning.
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-[22px] bg-white/[0.04] p-6 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-white/50">YouTube</span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-white/50">
                <Icon name="refresh" size={14} /> loops
              </span>
            </div>
            <ol className="mt-6 flex flex-col">
              {yt.map((s, i) => (
                <li key={s} className="flex items-center gap-4 border-b border-white/[0.07] py-3 last:border-0">
                  <span className="font-mono text-[12px] text-white/30">{String(i + 1).padStart(2, '0')}</span>
                  <span className={cx('text-[18px] font-[560]', i === yt.length - 1 ? 'text-white/35 line-through decoration-white/30' : 'text-white/75')}>{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13.5px] text-white/45">Optimised for the next view. You end where you started.</p>
          </div>
          <div className="rounded-[22px] bg-white p-6 text-[#0f0f0f]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[#606060]">CoursePack</span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#606060]">
                <Icon name="trend" size={14} /> compounds
              </span>
            </div>
            <ol className="mt-6 flex flex-col">
              {cp.map((s, i) => (
                <li key={s} className="flex items-center gap-4 border-b border-black/[0.07] py-[9px] last:border-0">
                  <span className="font-mono text-[12px] text-[#8c8c8c]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[18px] font-[600]" style={{ paddingLeft: i * 6 }}>{s}</span>
                  {i === cp.length - 1 && <span className="ml-auto h-2 w-2 rounded-full bg-[#ff0000]" />}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13.5px] text-[#606060]">Optimised for what you can do afterwards.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Skills() {
  const ids = ['ai-app', 'sql', 'product-design', 'business', 'video-editing', 'python'];
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="display max-w-[16ch] text-[clamp(32px,4.6vw,56px)]">Learn skills that actually do something.</h2>
        <LinkButton href={href('explore')} variant="ghost" iconRight="arrow-right">All learning paths</LinkButton>
      </div>
      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => (
          <CourseCard key={id} course={getCourse(id)!} />
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  const [q, setQ] = useState('');
  return (
    <section className="border-t border-line bg-sunken/60">
      <div className="mx-auto flex max-w-[860px] flex-col items-center gap-7 px-4 py-24 text-center sm:px-6">
        <h2 className="display text-[clamp(36px,5.6vw,68px)]">What do you want to learn?</h2>
        <form
          className="flex w-full max-w-[560px] items-center gap-2 rounded-full bg-surface p-1.5 pl-5 shadow-card ring-1 ring-line"
          onSubmit={(e) => {
            e.preventDefault();
            go('build', q.trim() || 'I want to learn SQL');
          }}
        >
          <label htmlFor="cta-q" className="sr-only">What do you want to learn?</label>
          <input id="cta-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Build my first website" className="h-10 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint" />
          <Button variant="primary" type="submit">Build my path</Button>
        </form>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED_INTENTS.map((s) => (
            <button key={s} onClick={() => go('build', s)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-muted hover:border-line-strong hover:text-ink">
              {s}
            </button>
          ))}
        </div>
        <LinkButton href={href('explore')} variant="quiet" iconRight="arrow-right">Explore CoursePacks</LinkButton>
      </div>
    </section>
  );
}
