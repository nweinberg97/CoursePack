/**
 * Study Partner + Ask the Course.
 *
 * A deterministic, retrieval-based stand-in for an LLM tutor. It answers
 * from the lesson's own transcript and the course glossary and always
 * returns sources (lesson + timestamp), which is the behaviour a real
 * model integration would be held to. Swap `answer*` for an API call that
 * receives the same retrieved context.
 */
import type { Course, CourseProgress, Lesson, QuizQuestion } from '../types';
import { allLessons, locate, neighbors } from './buildCourse';
import { clock } from './format';

export interface Source {
  lessonId: string;
  t: number;
  label: string;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  bullets?: string[];
  code?: string;
  sources?: Source[];
  quiz?: QuizQuestion;
  lessons?: { id: string; title: string; note: string }[];
}

export const LESSON_PROMPTS = [
  { id: 'simpler', label: 'Explain this more simply' },
  { id: 'remember', label: 'What should I remember?' },
  { id: 'quiz', label: 'Quiz me' },
  { id: 'example', label: 'Give me an example' },
  { id: 'connect', label: 'Connect this to the previous lesson' },
  { id: 'where', label: 'Where did they explain this?' },
] as const;

export const COURSE_PROMPTS = [
  { id: 'eli', label: 'Explain like I’m new' },
  { id: 'test', label: 'Test me' },
  { id: 'practice', label: 'Give me practice' },
  { id: 'weak', label: 'Find my weak spots' },
  { id: 'module', label: 'Review this module' },
] as const;

let seq = 0;
const mid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

const STOP = new Set('a an the is are was were be to of in on for and or but what how why when does do i my me it this that with as at by from about can you your we our vs versus difference between explain'.split(' '));
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

function stem(w: string) {
  return w.replace(/(ings|ing|ies|es|s|ed)$/, '');
}

function overlap(q: string[], text: string) {
  const t = new Set(words(text).map(stem));
  return q.reduce((n, w) => n + (t.has(stem(w)) ? 1 : 0), 0);
}

function chapterFor(lesson: Lesson, concept: string, course: Course) {
  const term = course.glossary[concept]?.term.toLowerCase() ?? concept;
  const body = lesson.chapters.slice(1);
  return body.find((c) => c.title.toLowerCase().includes(term)) ?? body.find((c) => c.text.toLowerCase().includes(term)) ?? lesson.chapters[1] ?? lesson.chapters[0];
}

const src = (lesson: Lesson, t: number, label?: string): Source => ({ lessonId: lesson.id, t, label: label ?? clock(t) });

/** Hand-tuned answers for the questions learners ask most often. */
const CANNED: { match: RegExp; text: string; concept: string; bullets?: string[] }[] = [
  { match: /\bapi\b.*\bsdk\b|\bsdk\b.*\bapi\b/i, concept: 'sdk', text: 'An API defines how your application communicates with another system. An SDK is a collection of tools that makes using that API easier. Same requests underneath, but you call normal functions instead of building HTTP calls by hand.' },
  { match: /\brag\b.*(fit|architecture|built|where)|(architecture|built).*\brag\b/i, concept: 'rag', text: 'RAG is the context layer of the app you’re building. The model and API calls from Modules 1–2 do the generating; RAG decides what the model gets to read before it answers.', bullets: ['Module 4 builds the retrieval half: embeddings, similarity search, and a store of your document chunks.', 'Module 5 puts retrieved chunks into the prompt with grounding rules, which turns it into a document assistant.', 'Module 6 adds tools on top. Search over your docs can itself become a tool the model chooses to call.'] },
  { match: /token/i, concept: 'token', text: 'A token is a chunk of text, roughly three-quarters of a word. Models read and write tokens, are limited by how many fit in the context window, and are billed by them.' },
  { match: /embedding/i, concept: 'embedding', text: 'An embedding turns text into a list of numbers that captures its meaning. Texts with similar meaning end up close together, which is what makes semantic search work.' },
  { match: /function call|tool call/i, concept: 'functioncall', text: 'With function calling you describe your functions to the model. It replies with a request to call one, with arguments. Your code runs it and sends the result back. The model never runs anything itself.' },
  { match: /json|structured/i, concept: 'structured', text: 'Structured output means asking for data in an exact shape, usually JSON matching a schema, then validating it before your code uses it. It’s what makes model output safe to build on.' },
  { match: /context window/i, concept: 'context', text: 'The context window is everything the model can see in one request: instructions, input, history and its own reply. Anything outside it simply doesn’t exist for the model.' },
  { match: /group by/i, concept: 'groupby', text: 'GROUP BY sorts rows into buckets that share a value, then every aggregate runs once per bucket. Every column you SELECT must be grouped or aggregated.' },
  { match: /where.*having|having.*where/i, concept: 'having', text: 'WHERE filters rows before grouping. HAVING filters groups after aggregation. If your filter uses COUNT, SUM or AVG, it belongs in HAVING.' },
  { match: /window function|over\s*\(/i, concept: 'window', text: 'A window function calculates across related rows but keeps every row. GROUP BY collapses rows into one per group; OVER() adds a calculated column to each row instead.' },
];

function findLessonWith(course: Course, concept: string): Lesson | undefined {
  return allLessons(course).find((l) => l.concepts[0] === concept) ?? allLessons(course).find((l) => l.concepts.includes(concept));
}

export function answerLesson(course: Course, lesson: Lesson, input: string, promptId?: string): TutorMessage {
  const { prev } = neighbors(course, lesson.id);
  const main = lesson.concepts[0];
  const g = course.glossary[main];
  const ch = chapterFor(lesson, main, course);

  switch (promptId) {
    case 'simpler': {
      const def = g?.def ?? lesson.objective;
      return {
        id: mid(), role: 'tutor',
        text: `Here’s the short version. ${def}`,
        bullets: [g?.example ? `In practice: ${g.example}` : '', `The point of this lesson: ${lesson.objective.charAt(0).toLowerCase()}${lesson.objective.slice(1)}`].filter(Boolean),
        sources: [src(lesson, ch.t, `${clock(ch.t)} · ${ch.title}`)],
      };
    }
    case 'remember': {
      const picks = lesson.chapters.filter((c, i) => i > 0 && c.title !== 'Recap' && c.title !== 'Putting it together').slice(0, 3);
      return {
        id: mid(), role: 'tutor',
        text: 'Three things worth keeping from this lesson:',
        bullets: picks.map((c) => `**${c.title}.** ${c.text.split(/(?<=\.)\s/)[0]}`),
        sources: picks.map((c) => src(lesson, c.t, `${clock(c.t)} · ${c.title}`)),
      };
    }
    case 'quiz': {
      const q = lesson.check[0];
      return q
        ? { id: mid(), role: 'tutor', text: 'Quick one. Answer without rewinding.', quiz: q }
        : { id: mid(), role: 'tutor', text: 'This lesson doesn’t have a check yet. Try “What should I remember?” instead.' };
    }
    case 'example': {
      const ex = lesson.concepts.map((c) => course.glossary[c]).find((x) => x?.example);
      if (lesson.exercise?.solution && lesson.exercise.kind !== 'text') {
        return { id: mid(), role: 'tutor', text: `Here’s a concrete example of ${g?.term ?? 'this'} in code:`, code: lesson.exercise.solution, sources: [src(lesson, ch.t)] };
      }
      return {
        id: mid(), role: 'tutor',
        text: ex ? `${ex.term}: ${ex.example}` : `A good example is in the “${ch.title}” section.`,
        bullets: ex ? [`Why it works: ${ex.def.charAt(0).toLowerCase()}${ex.def.slice(1)}`] : undefined,
        sources: [src(lesson, ch.t, `${clock(ch.t)} · ${ch.title}`)],
      };
    }
    case 'connect': {
      if (!prev) return { id: mid(), role: 'tutor', text: 'This is the first lesson, so there’s nothing before it. Everything later builds on the vocabulary introduced here.' };
      const shared = lesson.concepts.filter((c) => prev.concepts.includes(c));
      const req = lesson.concepts.flatMap((c) => course.glossary[c]?.requires ?? []).filter((r) => prev.concepts.includes(r));
      const link = [...shared, ...req].map((c) => course.glossary[c]?.term).filter(Boolean)[0];
      return {
        id: mid(), role: 'tutor',
        text: `“${prev.title}” gave you ${link ? `the idea of ${link}` : 'the groundwork'}. This lesson uses it to ${lesson.objective.charAt(0).toLowerCase()}${lesson.objective.slice(1).replace(/\.$/, '')}.`,
        bullets: [`Before: ${prev.objective}`, `Now: ${lesson.objective}`],
        sources: [src(prev, prev.chapters[1]?.t ?? 0, `Previous lesson · ${prev.title}`), src(lesson, 0, 'This lesson · start')],
      };
    }
    case 'where': {
      const hits = lesson.chapters.filter((c, i) => i > 0).slice(0, 4);
      return {
        id: mid(), role: 'tutor',
        text: 'Here’s where each idea is covered in the video:',
        sources: hits.map((c) => src(lesson, c.t, `${clock(c.t)} · ${c.title}`)),
      };
    }
  }

  // Free text: canned answers first, then retrieval over this lesson, then the course.
  const canned = CANNED.find((c) => c.match.test(input) && (course.glossary[c.concept] || lesson.concepts.includes(c.concept)));
  if (canned) {
    const where = lesson.concepts.includes(canned.concept) ? lesson : findLessonWith(course, canned.concept) ?? lesson;
    const c = chapterFor(where, canned.concept, course);
    return { id: mid(), role: 'tutor', text: canned.text, bullets: canned.bullets, sources: [src(where, c.t, where.id === lesson.id ? clock(c.t) : `${where.title} · ${clock(c.t)}`)] };
  }
  const q = words(input);
  const ranked = lesson.chapters.map((c) => ({ c, s: overlap(q, `${c.title} ${c.text}`) })).sort((a, b) => b.s - a.s);
  const gHit = Object.values(course.glossary).find((x) => q.some((w) => stem(x.term.toLowerCase()).includes(stem(w)) && w.length > 2));
  if (ranked[0]?.s > 0 || gHit) {
    const best = ranked[0].s > 0 ? ranked[0].c : chapterFor(lesson, Object.keys(course.glossary).find((k) => course.glossary[k] === gHit)!, course);
    return {
      id: mid(), role: 'tutor',
      text: gHit && !best.text.toLowerCase().includes(gHit.term.toLowerCase()) ? `${gHit.def} ${best.text.split(/(?<=\.)\s/)[0]}` : best.text,
      bullets: gHit?.example ? [`Example: ${gHit.example}`] : undefined,
      sources: [src(lesson, best.t, `${clock(best.t)} · ${best.title}`)],
    };
  }
  const elsewhere = allLessons(course)
    .map((l) => ({ l, s: overlap(q, `${l.title} ${l.objective} ${l.chapters.map((c) => c.text).join(' ')}`) }))
    .sort((a, b) => b.s - a.s)[0];
  if (elsewhere?.s > 0) {
    return { id: mid(), role: 'tutor', text: `That isn’t covered in this lesson. It’s the focus of “${elsewhere.l.title}”, later in the course.`, sources: [src(elsewhere.l, 0, `${elsewhere.l.title}`)] };
  }
  return { id: mid(), role: 'tutor', text: 'I couldn’t find that in this course. I only answer from the lessons here, so I don’t guess. Try asking about one of the key concepts, or use a suggestion below.' };
}

export function answerCourse(course: Course, input: string, progress: CourseProgress | undefined, promptId?: string): TutorMessage {
  const current = locate(course, progress?.currentLessonId ?? allLessons(course)[0].id);
  const conf = progress?.confidence ?? {};

  switch (promptId) {
    case 'eli':
      return {
        id: mid(), role: 'tutor',
        text: `${course.title} in plain language: ${course.description}`,
        bullets: course.modules.slice(0, 6).map((m) => `**${m.title}.** ${m.description}`),
      };
    case 'test': {
      const pool = course.quiz.length ? course.quiz : allLessons(course).flatMap((l) => l.check);
      const weakest = [...pool].sort((a, b) => (conf[a.concept] ?? 75) - (conf[b.concept] ?? 75))[0];
      return { id: mid(), role: 'tutor', text: `Testing your weakest area: ${course.glossary[weakest.concept]?.term ?? 'this course'}.`, quiz: weakest };
    }
    case 'practice': {
      const l = allLessons(course).find((x) => x.exercise && !progress?.exercisesPassed.includes(x.id));
      return l
        ? { id: mid(), role: 'tutor', text: `Try this one, from “${l.title}”:`, bullets: [l.exercise!.prompt], lessons: [{ id: l.id, title: l.title, note: 'Open the exercise' }] }
        : { id: mid(), role: 'tutor', text: 'You’ve passed every exercise in this course. The final project is the best practice from here.' };
    }
    case 'weak': {
      const entries = Object.entries(conf).sort((a, b) => a[1] - b[1]).slice(0, 3);
      if (!entries.length) return { id: mid(), role: 'tutor', text: 'Not enough signal yet. Answer a few quiz questions and I’ll show you where to focus.' };
      return {
        id: mid(), role: 'tutor',
        text: 'Based on your quiz answers and exercises, review these first:',
        lessons: entries.map(([c, v]) => {
          const l = findLessonWith(course, c);
          return { id: l?.id ?? '', title: `${course.glossary[c]?.term ?? c} · ${v}% confidence`, note: l ? `Rewatch “${l.title}”` : '' };
        }),
      };
    }
    case 'module': {
      const m = current.module;
      return {
        id: mid(), role: 'tutor',
        text: `Module ${m.index}: ${m.title}. ${m.description}`,
        bullets: Array.from(new Set(m.lessons.flatMap((l) => l.concepts))).slice(0, 5).map((c) => `**${course.glossary[c]?.term}.** ${course.glossary[c]?.def}`),
        lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, note: progress?.completed.includes(l.id) ? 'Completed' : 'Not yet watched' })),
      };
    }
  }

  const canned = CANNED.find((c) => c.match.test(input) && course.glossary[c.concept]);
  const q = words(input);
  const ranked = allLessons(course)
    .map((l) => ({ l, s: overlap(q, `${l.title} ${l.title} ${l.objective} ${l.concepts.map((c) => course.glossary[c]?.term ?? '').join(' ')} ${l.chapters.map((c) => c.text).join(' ')}`) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  if (canned) {
    return { id: mid(), role: 'tutor', text: canned.text, bullets: canned.bullets, lessons: ranked.map(({ l }) => ({ id: l.id, title: l.title, note: `Module ${locate(course, l.id).module.index}` })) };
  }
  if (ranked.length) {
    const top = ranked[0].l;
    const best = top.chapters.map((c) => ({ c, s: overlap(q, c.text + ' ' + c.title) })).sort((a, b) => b.s - a.s)[0].c;
    return {
      id: mid(), role: 'tutor',
      text: best.text,
      lessons: ranked.map(({ l }) => ({ id: l.id, title: l.title, note: `Module ${locate(course, l.id).module.index}` })),
      sources: [src(top, best.t, `${top.title} · ${clock(best.t)}`)],
    };
  }
  return { id: mid(), role: 'tutor', text: 'That’s outside what this course covers, so I won’t guess. Try one of the suggestions, or ask about a concept from the curriculum.' };
}
