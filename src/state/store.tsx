import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { ActivityItem, Course, CourseProgress, LearnerState, Note } from '../types';
import { getCourse, FLAGSHIP_ID } from '../data';
import { allLessons, locate } from '../lib/buildCourse';
import { ensureGenerated } from '../lib/generate';

const KEY = 'coursepack:v1';
const DAY = 86_400_000;

type Action =
  | { type: 'start'; courseId: string }
  | { type: 'setCurrent'; courseId: string; lessonId: string }
  | { type: 'complete'; courseId: string; lessonId: string }
  | { type: 'uncomplete'; courseId: string; lessonId: string }
  | { type: 'answer'; courseId: string; concept: string; correct: boolean }
  | { type: 'exercise'; courseId: string; lessonId: string }
  | { type: 'milestone'; courseId: string; id: string }
  | { type: 'projectUrl'; courseId: string; url: string }
  | { type: 'finishCourse'; courseId: string }
  | { type: 'focusTick'; courseId: string; seconds: number }
  | { type: 'note'; note: Note }
  | { type: 'deleteNote'; id: string }
  | { type: 'save'; courseId: string }
  | { type: 'focus'; on?: boolean }
  | { type: 'generated'; key: string }
  | { type: 'reset' };

function freshProgress(courseId: string): CourseProgress {
  const c = getCourse(courseId);
  return {
    courseId,
    completed: [],
    currentLessonId: c ? allLessons(c)[0].id : '',
    confidence: {},
    exercisesPassed: [],
    milestones: [],
    quizCorrect: 0,
    quizTotal: 0,
    startedAt: Date.now(),
    focusedSeconds: 0,
  };
}

let aseq = 0;
const act = (courseId: string, kind: ActivityItem['kind'], label: string, at = Date.now()): ActivityItem => ({ id: `a${at}${aseq++}`, at, courseId, kind, label });

export function seedState(): LearnerState {
  const now = Date.now();
  const ai = getCourse(FLAGSHIP_ID)!;
  const aiLessons = allLessons(ai);
  const done = aiLessons.slice(0, 12).map((l) => l.id);
  const py = getCourse('python')!;
  return {
    name: 'Alex',
    focusMode: false,
    saved: ['product-design', 'business'],
    generated: [],
    notes: [
      { id: 'n1', lessonId: aiLessons[0].id, t: 102, text: 'Fluent ≠ correct. Always check outputs.', quote: 'The model isn’t “thinking” in the human sense. It is learning statistical relationships from data.', createdAt: now - 6 * DAY },
      { id: 'n2', lessonId: aiLessons[3].id, t: 134, text: 'Restaurant analogy: menu = API, waiter = request/response.', createdAt: now - 4 * DAY },
    ],
    activity: [
      act('python', 'course', 'Completed Python for Beginners', now - 23 * DAY),
      act(FLAGSHIP_ID, 'start', 'Started Build Your First AI Application', now - 12 * DAY),
      act(FLAGSHIP_ID, 'module', 'Completed Understand How AI Applications Work', now - 7 * DAY),
      act(FLAGSHIP_ID, 'exercise', 'Passed exercise: Structured outputs', now - 3 * DAY),
      act(FLAGSHIP_ID, 'module', 'Completed Work With AI APIs', now - 2 * DAY),
      act(FLAGSHIP_ID, 'lesson', 'Completed Chunking long text', now - 20 * 3600_000),
    ],
    progress: {
      [FLAGSHIP_ID]: {
        courseId: FLAGSHIP_ID,
        completed: done,
        currentLessonId: aiLessons[12].id,
        confidence: { llm: 92, token: 88, context: 79, prompt: 84, api: 94, sdk: 81, apikey: 90, structured: 86, errors: 71, chunking: 64, json: 89 },
        exercisesPassed: [aiLessons[8].id],
        milestones: [],
        quizCorrect: 17,
        quizTotal: 19,
        startedAt: now - 12 * DAY,
        focusedSeconds: 3 * 3600 + 10 * 60,
      },
      python: {
        ...freshProgress('python'),
        completed: allLessons(py).map((l) => l.id),
        currentLessonId: allLessons(py).at(-1)!.id,
        milestones: py.finalProject.milestones.map((m) => m.id),
        projectUrl: 'github.com/alex/spendlog',
        quizCorrect: 22,
        quizTotal: 24,
        startedAt: now - 52 * DAY,
        completedAt: now - 23 * DAY,
        focusedSeconds: 5 * 3600 + 31 * 60,
        confidence: { function: 91, loop: 88, list: 93, dict: 84, file: 80, exception: 77 },
      },
    },
  };
}

function withProgress(s: LearnerState, courseId: string, fn: (p: CourseProgress) => CourseProgress): LearnerState {
  const p = s.progress[courseId] ?? freshProgress(courseId);
  return { ...s, progress: { ...s.progress, [courseId]: fn(p) } };
}

function log(s: LearnerState, item: ActivityItem): LearnerState {
  return { ...s, activity: [...s.activity, item].slice(-80) };
}

function reducer(s: LearnerState, a: Action): LearnerState {
  switch (a.type) {
    case 'start': {
      if (s.progress[a.courseId]) return s;
      const c = getCourse(a.courseId);
      return log(withProgress(s, a.courseId, (p) => p), act(a.courseId, 'start', `Started ${c?.title ?? 'a course'}`));
    }
    case 'setCurrent':
      return withProgress(s, a.courseId, (p) => ({ ...p, currentLessonId: a.lessonId }));
    case 'complete': {
      const c = getCourse(a.courseId);
      const p0 = s.progress[a.courseId];
      if (!c || p0?.completed.includes(a.lessonId)) return s;
      let next = withProgress(s, a.courseId, (p) => ({ ...p, completed: [...p.completed, a.lessonId] }));
      const { lesson, module } = locate(c, a.lessonId);
      next = log(next, act(a.courseId, lesson.kind === 'project' ? 'project' : 'lesson', `${lesson.kind === 'project' ? 'Built' : 'Completed'} ${lesson.title}`));
      const p = next.progress[a.courseId];
      if (module.lessons.every((l) => p.completed.includes(l.id))) next = log(next, act(a.courseId, 'module', `Completed ${module.title}`));
      // Auto-tick project milestones tied to this lesson.
      const ms = c.finalProject.milestones.filter((m) => m.lessonId === a.lessonId).map((m) => m.id);
      if (ms.length) next = withProgress(next, a.courseId, (pp) => ({ ...pp, milestones: Array.from(new Set([...pp.milestones, ...ms])) }));
      return next;
    }
    case 'uncomplete':
      return withProgress(s, a.courseId, (p) => ({ ...p, completed: p.completed.filter((x) => x !== a.lessonId) }));
    case 'answer':
      return withProgress(s, a.courseId, (p) => {
        const cur = p.confidence[a.concept] ?? 65;
        const nextVal = a.correct ? Math.min(98, Math.round(cur + (100 - cur) * 0.35)) : Math.max(30, Math.round(cur - 14));
        return { ...p, confidence: { ...p.confidence, [a.concept]: nextVal }, quizCorrect: p.quizCorrect + (a.correct ? 1 : 0), quizTotal: p.quizTotal + 1 };
      });
    case 'exercise': {
      if (s.progress[a.courseId]?.exercisesPassed.includes(a.lessonId)) return s;
      const c = getCourse(a.courseId);
      const l = c ? locate(c, a.lessonId).lesson : null;
      const next = withProgress(s, a.courseId, (p) => {
        const conf = { ...p.confidence };
        l?.concepts.forEach((k) => (conf[k] = Math.min(98, (conf[k] ?? 65) + 8)));
        return { ...p, exercisesPassed: [...p.exercisesPassed, a.lessonId], confidence: conf };
      });
      return log(next, act(a.courseId, 'exercise', `Passed exercise: ${l?.title ?? ''}`));
    }
    case 'milestone':
      return withProgress(s, a.courseId, (p) => ({ ...p, milestones: p.milestones.includes(a.id) ? p.milestones.filter((x) => x !== a.id) : [...p.milestones, a.id] }));
    case 'projectUrl':
      return withProgress(s, a.courseId, (p) => ({ ...p, projectUrl: a.url }));
    case 'finishCourse': {
      const c = getCourse(a.courseId);
      if (!c) return s;
      const ids = allLessons(c).map((l) => l.id);
      const next = withProgress(s, a.courseId, (p) => ({
        ...p,
        completed: ids,
        milestones: c.finalProject.milestones.map((m) => m.id),
        completedAt: p.completedAt ?? Date.now(),
        projectUrl: p.projectUrl || (a.courseId === FLAGSHIP_ID ? 'docsdesk.onrender.com' : p.projectUrl),
        quizTotal: Math.max(p.quizTotal, 36),
        quizCorrect: Math.max(p.quizCorrect, 33),
        focusedSeconds: Math.max(p.focusedSeconds, Math.round(c.minutes * 60 * 1.02)),
        confidence: Object.fromEntries(Object.keys(c.glossary).map((k) => [k, Math.max(p.confidence[k] ?? 0, 82 + (k.length % 14))])),
      }));
      return s.progress[a.courseId]?.completedAt ? next : log(next, act(a.courseId, 'course', `Completed ${c.title}`));
    }
    case 'focusTick':
      return withProgress(s, a.courseId, (p) => ({ ...p, focusedSeconds: p.focusedSeconds + a.seconds }));
    case 'note':
      return { ...s, notes: [...s.notes, a.note] };
    case 'deleteNote':
      return { ...s, notes: s.notes.filter((n) => n.id !== a.id) };
    case 'save':
      return { ...s, saved: s.saved.includes(a.courseId) ? s.saved.filter((x) => x !== a.courseId) : [...s.saved, a.courseId] };
    case 'focus':
      return { ...s, focusMode: a.on ?? !s.focusMode };
    case 'generated':
      return s.generated.includes(a.key) ? s : { ...s, generated: [...s.generated, a.key] };
    case 'reset':
      return seedState();
  }
}

function load(): LearnerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as LearnerState;
      // Rebuild generated courses so their lesson ids resolve again.
      for (const key of s.generated ?? []) {
        const [id, topic] = key.split('|');
        ensureGenerated(id, topic);
      }
      return s;
    }
  } catch {
    /* storage unavailable: fall through to seed */
  }
  return seedState();
}

const Ctx = createContext<{ state: LearnerState; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}

/** Derived progress numbers for a course. */
export function useCourseStats(course: Course | undefined) {
  const { state } = useStore();
  return useMemo(() => courseStats(course, state.progress[course?.id ?? '']), [course, state.progress]);
}

export function courseStats(course: Course | undefined, p: CourseProgress | undefined) {
  if (!course) return { pct: 0, done: 0, total: 0, remainingMin: 0, started: false, finished: false, current: undefined as undefined | ReturnType<typeof locate> };
  const lessons = allLessons(course);
  const done = lessons.filter((l) => p?.completed.includes(l.id)).length;
  const remainingMin = lessons.filter((l) => !p?.completed.includes(l.id)).reduce((a, l) => a + l.duration / 60, 0);
  return {
    pct: Math.round((done / lessons.length) * 100),
    done,
    total: lessons.length,
    remainingMin,
    started: !!p,
    finished: !!p?.completedAt || done === lessons.length,
    current: p ? locate(course, p.currentLessonId) : undefined,
  };
}

/** Skill → 0–100, from completed lessons' concepts and quiz confidence. */
export function skillLevels(course: Course, p: CourseProgress | undefined) {
  return course.skills.map((skill) => {
    const concepts = Object.entries(course.glossary).filter(([, g]) => g.skill === skill).map(([k]) => k);
    const lessons = allLessons(course).filter((l) => l.concepts.some((c) => concepts.includes(c)));
    const covered = lessons.filter((l) => p?.completed.includes(l.id)).length / Math.max(lessons.length, 1);
    const confs = concepts.map((c) => p?.confidence[c]).filter((x): x is number => typeof x === 'number');
    const conf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length / 100 : 0.7;
    return { skill, value: Math.round(covered * (0.6 + 0.4 * conf) * 100) };
  });
}
