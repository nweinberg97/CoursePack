import { useEffect, useRef, useState } from 'react';
import type { Lesson } from '../../types';
import { creator } from '../../data/creators';
import { clock, compact, cx } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { Thumbnail } from '../course/Thumbnail';

export interface Playback {
  time: number;
  playing: boolean;
  rate: number;
  setTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setRate: (r: number) => void;
}

/** Simulated playback clock. A real build would bind this to the YouTube IFrame Player API. */
export function usePlayback(duration: number, onEnded: () => void, initial = 0): Playback {
  const [time, setTimeRaw] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const ended = useRef(onEnded);
  ended.current = onEnded;
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = ((now - last) / 1000) * rate;
      last = now;
      setTimeRaw((t) => {
        const n = t + dt;
        if (n >= duration) {
          setPlaying(false);
          setTimeout(() => ended.current(), 0);
          return duration;
        }
        return n;
      });
    }, 200);
    return () => clearInterval(id);
  }, [playing, rate, duration]);
  return { time, playing, rate, setTime: (t) => setTimeRaw(Math.max(0, Math.min(duration, t))), setPlaying, setRate };
}

export function VideoPlayer({ lesson, pb, ended, onReplay, endCard, focus }: { lesson: Lesson; pb: Playback; ended: boolean; onReplay: () => void; endCard?: React.ReactNode; focus?: boolean }) {
  const dur = lesson.duration;
  const [cc, setCc] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const chapterIdx = Math.max(0, lesson.chapters.findIndex((c, i) => pb.time >= c.t && (i === lesson.chapters.length - 1 || pb.time < lesson.chapters[i + 1].t)));
  const chapter = lesson.chapters[chapterIdx];
  const sentences = chapter.text.split(/(?<=[.?!])\s+/);
  const chapterEnd = lesson.chapters[chapterIdx + 1]?.t ?? dur;
  const sIdx = Math.min(sentences.length - 1, Math.floor(((pb.time - chapter.t) / Math.max(1, chapterEnd - chapter.t)) * sentences.length));
  const [showCard, setShowCard] = useState(false);
  const lastCh = useRef(chapterIdx);
  useEffect(() => {
    if (lastCh.current !== chapterIdx && pb.playing) {
      setShowCard(true);
      const id = setTimeout(() => setShowCard(false), 2200);
      lastCh.current = chapterIdx;
      return () => clearTimeout(id);
    }
    lastCh.current = chapterIdx;
  }, [chapterIdx, pb.playing]);

  const seekFromEvent = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    pb.setTime(((clientX - r.left) / r.width) * dur);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      pb.setPlaying(!pb.playing);
    } else if (e.key === 'ArrowRight' || e.key === 'l') pb.setTime(pb.time + 10);
    else if (e.key === 'ArrowLeft' || e.key === 'j') pb.setTime(pb.time - 10);
  };

  const fullscreen = () => {
    const el = wrap.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  return (
    <div ref={wrap} tabIndex={0} onKeyDown={onKey} aria-label={`Video player: ${lesson.video.title}`} className={cx('group/player relative overflow-hidden bg-stage text-white outline-none', focus ? 'rounded-[18px]' : 'rounded-[16px]')}>
      <button className="absolute inset-0 z-[1]" aria-label={pb.playing ? 'Pause' : 'Play'} onClick={() => pb.setPlaying(!pb.playing)} />
      <div className={cx('transition-transform duration-[20s] ease-linear', pb.playing ? 'scale-[1.06]' : 'scale-100')}>
        <Thumbnail thumb={lesson.video.thumb} size="lg" raised />
      </div>

      {/* Chapter title card when a new section starts */}
      {showCard && (
        <div className="anim-fade-up pointer-events-none absolute right-[4%] top-[6%] z-[2] rounded-[10px] bg-black/70 px-3 py-2 backdrop-blur">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/60">Chapter {chapterIdx + 1}</div>
          <div className="text-[14px] font-[600]">{chapter.title}</div>
        </div>
      )}

      {/* Big play state */}
      {!pb.playing && !ended && (
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/25">
          <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white/95 text-black shadow-card transition group-hover/player:scale-105">
            <Icon name="play" size={28} fill className="ml-1" />
          </span>
        </div>
      )}

      {/* Captions from the transcript */}
      {cc && (pb.playing || pb.time > 0) && !ended && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[64px] z-[2] flex justify-center px-[8%]">
          <span className="rounded-[6px] bg-black/75 px-2.5 py-1 text-center text-[clamp(12px,1.6vw,16px)] leading-snug">{sentences[Math.max(0, sIdx)]}</span>
        </div>
      )}

      {ended && endCard && <div className="absolute inset-0 z-[3] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[2px]">{endCard}</div>}

      {/* Controls */}
      <div className={cx('absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-10 transition-opacity sm:px-4', pb.playing ? 'opacity-0 group-hover/player:opacity-100 group-focus-within/player:opacity-100' : 'opacity-100')}>
        <div
          ref={bar}
          className="group/bar relative flex h-4 cursor-pointer items-center"
          onClick={(e) => seekFromEvent(e.clientX)}
          onMouseMove={(e) => {
            const r = bar.current!.getBoundingClientRect();
            setHover(((e.clientX - r.left) / r.width) * dur);
          }}
          onMouseLeave={() => setHover(null)}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(pb.time)}
          tabIndex={-1}
        >
          <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-white/25 transition-[height] group-hover/bar:h-[6px]">
            {hover !== null && <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${(hover / dur) * 100}%` }} />}
            <div className="absolute inset-y-0 left-0 bg-red" style={{ width: `${(pb.time / dur) * 100}%` }} />
          </div>
          {lesson.chapters.slice(1).map((c) => (
            <span key={c.t} className="absolute top-1/2 h-[6px] w-[2px] -translate-y-1/2 bg-black/70" style={{ left: `${(c.t / dur) * 100}%` }} />
          ))}
          <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red opacity-0 transition group-hover/bar:opacity-100" style={{ left: `${(pb.time / dur) * 100}%` }} />
          {hover !== null && (
            <span className="num absolute bottom-5 -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-black/85 px-1.5 py-0.5 text-[11.5px]" style={{ left: `${(hover / dur) * 100}%` }}>
              {clock(hover)} · {lesson.chapters.filter((c) => c.t <= hover).at(-1)?.title}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 sm:gap-2">
          <Ctl label={pb.playing ? 'Pause' : 'Play'} icon={pb.playing ? 'pause' : 'play'} fill={!pb.playing} onClick={() => pb.setPlaying(!pb.playing)} />
          <Ctl label="Back 10 seconds" icon="rewind" onClick={() => pb.setTime(pb.time - 10)} />
          <span className="num ml-1 text-[12.5px] text-white/90">
            {clock(pb.time)} <span className="text-white/50">/ {clock(dur)}</span>
          </span>
          <span className="ml-2 hidden min-w-0 truncate text-[12.5px] text-white/70 md:inline">· {chapter.title}</span>
          <span className="ml-auto" />
          <button onClick={() => pb.setRate(pb.rate === 1 ? 1.5 : pb.rate === 1.5 ? 2 : 1)} className="relative z-[5] rounded-[6px] px-2 py-1 font-mono text-[12px] text-white/90 hover:bg-white/15" aria-label="Playback speed">
            {pb.rate}×
          </button>
          <Ctl label={cc ? 'Hide captions' : 'Show captions'} icon="captions" active={cc} onClick={() => setCc(!cc)} />
          <Ctl label="Full screen" icon="maximize" onClick={fullscreen} />
        </div>
      </div>
      {ended && !endCard && (
        <button onClick={onReplay} className="absolute inset-0 z-[3] flex items-center justify-center bg-black/60 text-[14px]">
          <Icon name="refresh" /> Replay
        </button>
      )}
    </div>
  );
}

function Ctl({ label, icon, onClick, fill, active }: { label: string; icon: Parameters<typeof Icon>[0]['name']; onClick: () => void; fill?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={cx('relative z-[5] flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15', active === false && 'text-white/60')}>
      <Icon name={icon} size={19} fill={fill} />
    </button>
  );
}

export function SourceLine({ lesson }: { lesson: Lesson }) {
  const c = creator(lesson.video.creatorId);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
      <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-sunken px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em]">
        <Icon name="play" size={11} fill className="text-red" /> Source video
      </span>
      <span className="font-[560] text-ink">{lesson.video.title}</span>
      <span>· {c.name} · YouTube · {clock(lesson.duration)} · {compact(lesson.video.metrics.views)} views</span>
    </div>
  );
}
