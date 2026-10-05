/**
 * Course generation for topics outside the curated library.
 *
 * The real system would run the full pipeline. The prototype maps intent to
 * a curriculum blueprint for the topic's category, then runs it through the
 * same `buildCourse` step (validation, candidates, sequencing) as every
 * library course, so the result behaves identically in the product.
 */
import type { CategoryId, Course } from '../types';
import { buildCourse, type CourseSpec, type LessonSpec } from './buildCourse';
import { TOPICS, getCourse, registerCourse, routeIntent } from '../data';

const POOLS: Record<CategoryId, string[]> = {
  technical: ['bsl', 'sl', 'pec', 'tpb', 'mira', 'sn'],
  design: ['gridline', 'hfd', 'ines', 'ux'],
  business: ['fhq', 'nadia', 'ssp', 'pricelab'],
  creative: ['cutroom', 'lumen', 'kai', 'soundbed', 'aperture'],
  career: ['nadia', 'fhq', 'tpb', 'ines'],
  practical: ['ledger', 'amara', 'lumen', 'tpb'],
};

const CAT_WORDS: [RegExp, CategoryId][] = [
  [/(code|program|javascript|rust|go\b|java|data|cloud|linux|devops|git|security|excel)/i, 'technical'],
  [/(design|typograph|illustrat|brand|logo|layout)/i, 'design'],
  [/(sell|sales|marketing|manage|product|startup|seo|ads)/i, 'business'],
  [/(music|draw|paint|writ|story|film|guitar|piano|sing|animation|3d)/i, 'creative'],
  [/(speak|negotiat|interview|lead|career|communicat|present|manager)/i, 'career'],
];

export function cleanTopic(q: string): string {
  const s = q
    .trim()
    .replace(/^(i\s+(want|would like|wanna)\s+to\s+)?(learn|get good at|get better at|understand|master|study)\s+(how\s+to\s+)?/i, '')
    .replace(/^(how\s+to\s+)/i, '')
    .replace(/[.?!]+$/, '')
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Something new';
}

function guessCategory(topic: string): CategoryId {
  const hit = TOPICS.find((t) => t.label.toLowerCase() === topic.toLowerCase());
  if (hit) return hit.category;
  for (const [re, c] of CAT_WORDS) if (re.test(topic)) return c;
  return 'practical';
}

export function resolveIntent(q: string): { courseId: string; topic: string; matched: boolean } {
  const routed = routeIntent(q);
  const topic = cleanTopic(q);
  if (routed) return { courseId: routed, topic, matched: true };
  return { courseId: `gen-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, topic, matched: false };
}

export function ensureGenerated(courseId: string, topic: string): Course {
  const existing = getCourse(courseId);
  if (existing) return existing;
  const category = guessCategory(topic);
  const pool = POOLS[category];
  const T = topic;
  const lower = T.toLowerCase();
  let n = 0;
  const L = (title: string, video: string, objective: string, concepts: string[], extra: Partial<LessonSpec> = {}): LessonSpec => ({
    title, video, by: pool[n++ % pool.length], min: 8 + ((n * 37) % 15) + (n % 3) * 0.4, objective, concepts, outcomes: [objective.replace(/\.$/, '')], ...extra,
  });
  const spec: CourseSpec = {
    id: courseId,
    title: `${T} From the Ground Up`,
    tagline: `A sequenced path into ${lower}, built from the most validated teaching on YouTube.`,
    description: `Learn ${lower} step by step: fundamentals first, then deliberate practice, real-world application, and a project that proves you can do it.`,
    category,
    topic: T,
    level: 'Beginner',
    skills: ['Fundamentals', 'Technique', 'Practice', 'Application'],
    tools: ['A notebook for practice logs', 'About 3 hours a week'],
    outcomes: [`Explain the fundamentals of ${lower}`, 'Practise with a deliberate routine', 'Avoid the most common beginner mistakes', `Complete a real ${lower} project`],
    cover: { hue: (T.length * 53) % 360, motif: 'diagram' },
    finalProject: {
      title: `Your ${T} Project`,
      summary: `Plan and complete one real piece of ${lower} work, and document what you learned.`,
      deliverable: 'A short write-up with photos, a link, or a recording of your result.',
      milestones: [
        { id: 'g-1', title: 'Practice routine set up', lessonId: `${courseId}-m2-l2` },
        { id: 'g-2', title: 'First full attempt', lessonId: `${courseId}-m3-l3` },
        { id: 'g-3', title: 'Project complete and shared', lessonId: `${courseId}-m6-l1` },
      ],
    },
    glossary: {
      fundamentals: { term: 'Fundamentals', def: `The small set of ideas every other part of ${lower} builds on.`, skill: 'Fundamentals' },
      technique: { term: 'Core technique', def: `The basic movement, method or process at the heart of ${lower}, done correctly before it is done fast.`, requires: ['fundamentals'], skill: 'Technique' },
      deliberate: { term: 'Deliberate practice', def: 'Focused practice on a specific weakness, with immediate feedback, just beyond your current ability.', requires: ['technique'], skill: 'Practice' },
      feedback: { term: 'Feedback loop', def: 'A way to see quickly whether what you did worked, so you can adjust.', requires: ['deliberate'], skill: 'Practice' },
      application: { term: 'Real-world application', def: 'Using a skill in a real situation with real constraints, where mistakes teach the most.', requires: ['feedback'], skill: 'Application' },
    },
    modules: [
      { title: `Foundations of ${T}`, description: 'The vocabulary and mental model everything else builds on.', lessons: [
        L(`What ${lower} really involves`, `${T} Explained for Complete Beginners`, `Understand what ${lower} involves and what good looks like.`, ['fundamentals']),
        L('Setting up: tools and space', `Everything You Need to Start ${T} (and What You Don’t)`, 'Set up with the minimum you need.', ['fundamentals']),
        L('The core vocabulary', `${T} Terms Every Beginner Should Know`, 'Learn the words experts use.', ['fundamentals']),
      ] },
      { title: 'The Core Technique', description: 'Learn the fundamental technique properly, slowly.', requires: ['fundamentals'], lessons: [
        L('The fundamental technique', `The One ${T} Technique to Master First`, 'Learn the core technique step by step.', ['technique']),
        L('Practising deliberately', `How to Practise ${T} Efficiently`, 'Set up a practice routine that works.', ['deliberate']),
        L('Common beginner mistakes', `${T} Mistakes Beginners Make (and Fixes)`, 'Recognise and fix early mistakes.', ['technique', 'feedback']),
      ] },
      { title: 'Building Skill', description: 'Expand your range with feedback.', requires: ['technique'], lessons: [
        L('Intermediate techniques', `Level Up Your ${T}: Intermediate Skills`, 'Add intermediate techniques.', ['technique', 'deliberate']),
        L('Learning from experts', `How an Expert Approaches ${T}`, 'Study how experts think.', ['feedback']),
        L('Your first full attempt', `My First Full ${T} Attempt, Reviewed`, 'Complete a full attempt and review it.', ['application']),
      ] },
      { title: 'Applying It', description: 'Real situations, real constraints.', requires: ['deliberate'], lessons: [
        L('Real-world scenarios', `${T} in Real Life: Practical Examples`, 'Apply the skill in realistic situations.', ['application']),
        L('Troubleshooting', `When ${T} Goes Wrong: Troubleshooting Guide`, 'Diagnose and fix problems.', ['feedback', 'application']),
      ] },
      { title: 'Going Further', description: 'Make it yours.', requires: ['application'], lessons: [
        L('Developing your own approach', `Finding Your Own Style in ${T}`, 'Develop your own approach.', ['application']),
        L('Planning what’s next', `What to Learn After the ${T} Basics`, 'Plan your next stage.', ['deliberate']),
      ] },
      { title: 'Final Project', description: 'Prove you can do it.', requires: ['application'], project: `Complete a real ${lower} project.`, lessons: [
        L(`Project: Your ${lower} project`, `${T} Project Walkthrough, Start to Finish`, 'Complete and share your project.', ['application', 'technique'], { project: true }),
      ] },
    ],
  };
  const course = buildCourse(spec);
  registerCourse(course);
  return course;
}
