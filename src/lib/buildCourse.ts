/**
 * Turns a compact authored course spec into a full `Course`.
 *
 * In production this is where the pipeline output would land: selected
 * videos per concept, the candidates they beat, transcripts, and the
 * prerequisite graph. Here it is filled deterministically from the spec
 * so every course has the same depth without hand-writing every number.
 */
import type {
  Candidate,
  CategoryId,
  Chapter,
  Course,
  Exercise,
  GlossaryEntry,
  Lesson,
  Level,
  Module,
  Project,
  QuizQuestion,
  ThumbStyle,
  Video,
} from '../types';
import { creator, GENERALISTS } from '../data/creators';
import { coursePackScore, signalsFor } from './scoring';
import { rng } from './random';

export interface LessonSpec {
  title: string;
  /** Source video title as it appears on YouTube. */
  video: string;
  by: string;
  /** Minutes, decimals allowed (18.7 → 18:42). */
  min: number;
  objective: string;
  outcomes?: string[];
  concepts: string[];
  chapters?: [string, string][];
  quotes?: string[];
  exercise?: Exercise;
  project?: boolean;
  fitNote?: string;
  thumb?: string;
  views?: number;
}

export interface ModuleSpec {
  title: string;
  description: string;
  requires?: string[];
  project?: string;
  lessons: LessonSpec[];
}

export interface CourseSpec {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  topic: string;
  level: Level;
  skills: string[];
  tools: string[];
  outcomes: string[];
  finalProject: Project;
  glossary: Record<string, Omit<GlossaryEntry, 'term'> & { term?: string }>;
  quiz?: QuizQuestion[];
  cover: Course['cover'];
  modules: ModuleSpec[];
  flagship?: boolean;
}

const QUOTE_BANK = [
  'I’ve watched three other videos on this and this is the first one that actually clicked.',
  'The diagram at the start did more for me than an hour of reading docs.',
  'Paused every two minutes to try it myself. Worked first time.',
  'Finally someone explains *why*, not just *how*.',
  'Came in knowing nothing, left with something working. Thank you.',
  'Sending this to everyone on my team who keeps asking me about this.',
  'The pacing is perfect. Not too slow, never skips a step.',
  'This is the video I wish existed when I started.',
  'Rewatched the middle section twice and now it makes total sense.',
  'Used this the same afternoon at work. Saved me hours.',
];

const CANDIDATE_PATTERNS: { title: (t: string) => string; reason: string; kind: 'fast' | 'long' | 'stale' | 'opinion' | 'broad' }[] = [
  { title: (t) => `${t} in 100 Seconds`, reason: 'Popular and well made, but too compressed to learn from. Comments frequently ask for a slower version.', kind: 'fast' },
  { title: (t) => `${t} — Full Course for Beginners (4 Hours)`, reason: 'Covers this concept, but it’s buried inside a four-hour course. Only a short segment is relevant at this point.', kind: 'long' },
  { title: (t) => `${t} Explained | Complete Tutorial`, reason: 'High view count, but a noticeable share of recent comments report outdated steps.', kind: 'stale' },
  { title: (t) => `Stop Doing ${t} Wrong`, reason: 'Opinion-led and assumes you already know the basics. Better as optional viewing later.', kind: 'opinion' },
  { title: (t) => `${t}: Everything You Need to Know`, reason: 'Large channel, but a low share of comments indicate viewers actually understood the material.', kind: 'broad' },
];

function shortTitle(t: string) {
  return t.replace(/^(Build-along|Project|Final project):\s*/i, '').replace(/\?$/, '');
}

function makeThumb(spec: LessonSpec, hue: number, motif: ThumbStyle['variant'], idx: number): ThumbStyle {
  const variants: ThumbStyle['variant'][] = ['code', 'diagram', 'type', 'grid', 'wave'];
  return {
    kicker: creator(spec.by).name,
    headline: spec.thumb ?? shortTitle(spec.title),
    variant: idx % 3 === 0 ? motif : variants[(idx + motif.length) % variants.length],
    hue,
  };
}

function selectedVideo(courseId: string, lid: string, spec: LessonSpec, idx: number, cover: Course['cover']): Video {
  const r = rng(`${courseId}:${lid}:sel`);
  const c = creator(spec.by);
  const views = spec.views ?? Math.round(c.subscribers * r.range(0.9, 5.5) + r.range(20_000, 300_000));
  const analyzed = r.int(380, 1600);
  return {
    id: `${lid}-v`,
    title: spec.video,
    creatorId: spec.by,
    duration: Math.round(spec.min * 60),
    metrics: {
      views,
      likes: Math.round(views * r.range(0.042, 0.06)),
      comments: Math.round(views * r.range(0.0028, 0.0062)),
      ageDays: r.int(90, 1300),
    },
    analysis: {
      analyzed,
      learningPositive: Math.round(analyzed * r.range(0.32, 0.41)),
      confusion: Math.round(analyzed * r.range(0.008, 0.03)),
      quotes: spec.quotes ?? r.shuffle(QUOTE_BANK).slice(0, 3),
    },
    curriculumFit: r.int(90, 99),
    fitNote: spec.fitNote ?? '',
    thumb: makeThumb(spec, c.hue, cover.motif, idx),
  };
}

function candidatesFor(courseId: string, lid: string, spec: LessonSpec, chosen: Video, peers: string[], cover: Course['cover']): Candidate[] {
  const r = rng(`${courseId}:${lid}:cand`);
  const count = r.int(2, 3);
  const patterns = r.shuffle(CANDIDATE_PATTERNS).slice(0, count);
  const chosenScore = coursePackScore(signalsFor(chosen, creator(chosen.creatorId)));
  return patterns.map((p, i) => {
    const useSpecialist = p.kind === 'opinion' && peers.length > 0;
    const by = useSpecialist ? r.pick(peers.filter((x) => x !== spec.by).concat(GENERALISTS[0])) : r.pick(GENERALISTS);
    const c = creator(by);
    const views = Math.round(c.subscribers * r.range(0.25, 1.3) + r.range(200_000, 1_500_000));
    const analyzed = r.int(300, 2000);
    let pos = p.kind === 'opinion' ? r.range(0.27, 0.34) : p.kind === 'fast' ? r.range(0.18, 0.26) : r.range(0.12, 0.22);
    const conf = p.kind === 'stale' ? r.range(0.07, 0.12) : r.range(0.03, 0.07);
    const fit = p.kind === 'long' ? r.int(58, 70) : p.kind === 'opinion' ? r.int(68, 80) : r.int(66, 82);
    const cand: Candidate = {
      id: `${lid}-c${i}`,
      title: p.title(shortTitle(spec.title)),
      creatorId: by,
      duration: Math.round((p.kind === 'long' ? r.range(200, 280) : p.kind === 'fast' ? r.range(1.5, 2.5) : r.range(9, 26)) * 60),
      metrics: {
        views,
        likes: Math.round(views * r.range(0.012, 0.03)),
        comments: Math.round(views * r.range(0.0012, 0.003)),
        ageDays: r.int(200, 2100),
      },
      analysis: { analyzed, learningPositive: Math.round(analyzed * pos), confusion: Math.round(analyzed * conf), quotes: [] },
      curriculumFit: fit,
      fitNote: '',
      thumb: { kicker: c.name, headline: shortTitle(spec.title), variant: cover.motif, hue: c.hue },
      rejectedBecause: p.reason,
    };
    // Guarantee the selection is consistent with the model.
    while (coursePackScore(signalsFor(cand, c)) >= chosenScore - 4 && pos > 0.02) {
      pos -= 0.02;
      cand.analysis.learningPositive = Math.round(analyzed * pos);
    }
    return cand;
  });
}

function chaptersFor(spec: LessonSpec, glossary: Course['glossary'], duration: number, seed: string): Chapter[] {
  if (spec.chapters?.length) {
    const r = rng(seed);
    const n = spec.chapters.length;
    return spec.chapters.map(([title, text], i) => ({
      t: i === 0 ? 0 : Math.round((duration * (i + r.range(-0.15, 0.15))) / (n + 0.4)),
      title,
      text,
    }));
  }
  const parts: [string, string][] = [['Introduction', `${spec.objective} We’ll start with the intuition, then make it concrete.`]];
  for (const key of spec.concepts) {
    const g = glossary[key];
    if (!g) continue;
    parts.push([g.term, `${g.def}${g.example ? ` ${g.example}` : ''}`]);
  }
  parts.push(['Putting it together', (spec.outcomes ?? []).length ? `By now you should be able to ${spec.outcomes!.map((o) => o.charAt(0).toLowerCase() + o.slice(1)).join(', and ')}.` : 'A quick recap of the key ideas, and what to try before the next lesson.']);
  return chaptersFor({ ...spec, chapters: parts }, glossary, duration, seed);
}

function checkFor(spec: LessonSpec, lid: string, course: { quiz: QuizQuestion[]; glossary: Course['glossary'] }): QuizQuestion[] {
  const fromBank = course.quiz.filter((q) => spec.concepts.includes(q.concept)).slice(0, 2);
  if (fromBank.length >= 2) return fromBank;
  const r = rng(`${lid}:check`);
  const keys = Object.keys(course.glossary);
  const out = [...fromBank];
  for (const concept of spec.concepts) {
    if (out.length >= 2) break;
    if (out.some((q) => q.concept === concept)) continue;
    const g = course.glossary[concept];
    if (!g) continue;
    const distractors = r.shuffle(keys.filter((k) => k !== concept)).slice(0, 3).map((k) => course.glossary[k].def);
    const options = r.shuffle([g.def, ...distractors]);
    out.push({
      id: `${lid}-q-${concept}`,
      concept,
      prompt: `Which of these best describes ${/^[A-Z]{2,}/.test(g.term) ? g.term : g.term.toLowerCase()}?`,
      options,
      answer: options.indexOf(g.def),
      explanation: g.def + (g.example ? ` ${g.example}` : ''),
    });
  }
  return out;
}

export function buildCourse(spec: CourseSpec): Course {
  const glossary: Course['glossary'] = Object.fromEntries(
    Object.entries(spec.glossary).map(([k, g]) => [k, { term: g.term ?? k, ...g } as GlossaryEntry]),
  );
  const quiz = spec.quiz ?? [];
  const peers = Array.from(new Set(spec.modules.flatMap((m) => m.lessons.map((l) => l.by))));
  let idx = 0;
  let scanned = 0;
  const modules: Module[] = spec.modules.map((m, mi) => ({
    id: `${spec.id}-m${mi + 1}`,
    index: mi + 1,
    title: m.title,
    description: m.description,
    prerequisiteConcepts: m.requires ?? [],
    project: m.project,
    lessons: m.lessons.map((ls, li) => {
      const lid = `${spec.id}-m${mi + 1}-l${li + 1}`;
      const video = selectedVideo(spec.id, lid, ls, idx++, spec.cover);
      if (!video.fitNote) {
        const prev = li > 0 ? m.lessons[li - 1].title : mi > 0 ? spec.modules[mi - 1].title : null;
        const next = li < m.lessons.length - 1 ? m.lessons[li + 1].title : spec.modules[mi + 1]?.title;
        video.fitNote = prev
          ? `Picks up directly from “${shortTitle(prev)}” and sets up ${next ? `“${shortTitle(next)}”` : 'the final project'} without assuming anything you haven’t covered.`
          : `Assumes no prior knowledge and introduces the vocabulary the rest of the path builds on.`;
      }
      const r = rng(`${lid}:scan`);
      const lessonScanned = r.int(38, 240);
      scanned += lessonScanned;
      const lesson: Lesson = {
        id: lid,
        title: ls.title,
        duration: video.duration,
        video,
        candidates: candidatesFor(spec.id, lid, ls, video, peers, spec.cover),
        scanned: lessonScanned,
        objective: ls.objective,
        outcomes: ls.outcomes ?? [],
        concepts: ls.concepts,
        chapters: chaptersFor(ls, glossary, video.duration, `${lid}:ch`),
        exercise: ls.exercise,
        check: checkFor(ls, lid, { quiz, glossary }),
        kind: ls.project ? 'project' : 'lesson',
      };
      return lesson;
    }),
  }));
  const minutes = modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.duration / 60, 0), 0);
  const creatorsUsed = Array.from(new Set(modules.flatMap((m) => m.lessons.map((l) => l.video.creatorId))));
  return {
    id: spec.id,
    title: spec.title,
    tagline: spec.tagline,
    description: spec.description,
    category: spec.category,
    topic: spec.topic,
    level: spec.level,
    minutes,
    creators: creatorsUsed,
    modules,
    skills: spec.skills,
    tools: spec.tools,
    outcomes: spec.outcomes,
    finalProject: spec.finalProject,
    glossary,
    quiz,
    cover: spec.cover,
    scanned: scanned * 9,
    flagship: spec.flagship,
  };
}

/* ------------------------------- selectors ------------------------------- */

export const allLessons = (c: Course) => c.modules.flatMap((m) => m.lessons);

export function locate(c: Course, lessonId: string) {
  for (const m of c.modules) {
    const i = m.lessons.findIndex((l) => l.id === lessonId);
    if (i >= 0) return { module: m, lesson: m.lessons[i], indexInModule: i };
  }
  const m = c.modules[0];
  return { module: m, lesson: m.lessons[0], indexInModule: 0 };
}

export function neighbors(c: Course, lessonId: string) {
  const all = allLessons(c);
  const i = all.findIndex((l) => l.id === lessonId);
  return { prev: all[i - 1], next: all[i + 1], index: i, total: all.length };
}
