import { useEffect, useState, type ReactNode } from 'react';
import { Icon, Logo, type IconName } from '../ui/Icon';
import { cx } from '../../lib/format';
import { go, href } from '../../state/router';
import { useStore } from '../../state/store';
import { FLAGSHIP_ID } from '../../data';
import { useToast } from '../ui/primitives';

const NAV: { id: string; label: string; icon: IconName; to: string[] }[] = [
  { id: 'home', label: 'Home', icon: 'home', to: ['home'] },
  { id: 'explore', label: 'Explore', icon: 'compass', to: ['explore'] },
  { id: 'build', label: 'New path', icon: 'route', to: ['build'] },
  { id: 'progress', label: 'Progress', icon: 'chart', to: ['progress'] },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(() => document.documentElement.getAttribute('data-theme'));
  useEffect(() => {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const dark = theme ? theme === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return (
    <button onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-ink">
      <Icon name={dark ? 'sun' : 'moon'} size={17} />
    </button>
  );
}

export function AppShell({ active, children, hideMobileNav }: { active?: string; children: ReactNode; hideMobileNav?: boolean }) {
  const [q, setQ] = useState('');
  return (
    <div className="min-h-screen">
      <header className="sticky z-30 border-b border-line bg-bg/90 backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-4 px-4 sm:px-6">
          <a href={href('home')} aria-label="CoursePack home">
            <Logo />
          </a>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.id} href={href(...n.to)} className={cx('rounded-full px-3 py-1.5 text-[14px] font-[540] transition', active === n.id ? 'bg-sunken text-ink' : 'text-muted hover:text-ink')}>
                {n.label}
              </a>
            ))}
          </nav>
          <form
            className="ml-auto hidden w-full max-w-[320px] items-center gap-2 rounded-full bg-sunken px-3.5 lg:flex"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) go('build', q.trim());
            }}
          >
            <Icon name="search" size={16} className="text-faint" />
            <label htmlFor="nav-q" className="sr-only">What do you want to learn?</label>
            <input id="nav-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to learn?" className="h-9 w-full bg-transparent text-[14px] outline-none placeholder:text-faint" />
          </form>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <ThemeToggle />
            <a href={href('progress')} aria-label="Your profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-[650] text-bg">
              A
            </a>
          </div>
        </div>
      </header>
      <main className={cx(!hideMobileNav && 'pb-24 md:pb-0')}>{children}</main>
      {!hideMobileNav && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 backdrop-blur-md md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {NAV.map((n) => (
            <a key={n.id} href={href(...n.to)} className={cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-[540]', active === n.id ? 'text-ink' : 'text-faint')}>
              <Icon name={n.icon} size={21} />
              {n.label}
            </a>
          ))}
        </nav>
      )}
      <DemoControls />
    </div>
  );
}

/** Clearly labelled prototype controls, so reviewers can jump through the demo. */
export function DemoControls() {
  const [open, setOpen] = useState(false);
  const { dispatch } = useStore();
  const toast = useToast();
  const items: { label: string; icon: IconName; run: () => void }[] = [
    { label: 'Guided demo: “I want to learn SQL”', icon: 'route', run: () => go('build', 'I want to learn SQL') },
    { label: 'Open the flagship lesson', icon: 'play', run: () => go('learn', FLAGSHIP_ID, 'ai-app-m1-l4') },
    {
      label: 'Fast-forward: finish flagship course',
      icon: 'award',
      run: () => {
        dispatch({ type: 'finishCourse', courseId: FLAGSHIP_ID });
        go('complete', FLAGSHIP_ID);
      },
    },
    {
      label: 'Reset demo data',
      icon: 'refresh',
      run: () => {
        dispatch({ type: 'reset' });
        toast('Demo data reset', 'refresh');
        go('home');
      },
    },
  ];
  return (
    <div className="fixed left-3 z-40 hidden md:block" style={{ bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}>
      {open && (
        <div className="anim-pop mb-2 w-[290px] overflow-hidden rounded-[16px] bg-surface p-1.5 shadow-card ring-1 ring-line">
          <div className="px-3 pb-1 pt-2 text-[12px] text-muted">Prototype controls. Sample data only.</div>
          {items.map((i) => (
            <button
              key={i.label}
              onClick={() => {
                setOpen(false);
                i.run();
              }}
              className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[13.5px] hover:bg-sunken"
            >
              <Icon name={i.icon} size={16} className="text-muted" /> {i.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted shadow-card ring-1 ring-line hover:text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Prototype
      </button>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-10 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo className="text-ink" />
        <p className="max-w-[62ch]">
          A product prototype. Creators, videos and metrics are fictional sample data used to demonstrate the validation and sequencing model. CoursePack organises content creators publish on YouTube and always credits the source.
        </p>
      </div>
    </footer>
  );
}
