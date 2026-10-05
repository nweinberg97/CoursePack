/**
 * CoursePack domain model.
 *
 * The shape mirrors the future pipeline:
 *   YouTube → candidate videos → transcript analysis → validation signals
 *   → concept mapping → curriculum sequencing → CoursePack course
 *
 * Raw YouTube-style metrics live on `VideoMetrics`. Signals are *derived*
 * from them in `lib/scoring.ts`, so the ranking logic is visible and swappable.
 */

export type CategoryId = 'technical' | 'design' | 'business' | 'creative' | 'career' | 'practical';
export type Level = 'Beginner' | 'Beginner → Intermediate' | 'Intermediate' | 'Advanced';

export interface Creator {
  id: string;
  name: string;
  handle: string;
  subscribers: number;
  /** 0–1. Share of the channel's catalogue that is on this subject. */
  topicFocus: number;
  /** 0–1. Upload regularity and quality consistency across the catalogue. */
  consistency: number;
  focus: string;
  /** Two-letter monogram + hue for the avatar. */
  monogram: string;
  hue: number;
}

/** Raw metrics a future ingestion job would pull from the YouTube Data API. */
export interface VideoMetrics {
  views: number;
  likes: number;
  comments: number;
  /** Days since publish. */
  ageDays: number;
}

/** Output of comment analysis (sentiment + intent classification). */
export interface CommentAnalysis {
  /** Comments sampled for classification. */
  analyzed: number;
  /** Comments that describe understanding, applying, or recommending the lesson. */
  learningPositive: number;
  /** Comments that describe confusion, errors, or outdated steps. */
  confusion: number;
  /** Representative learner comments surfaced to the user. */
  quotes: string[];
}

export interface Signals {
  learner: number;
  virality: number;
  authority: number;
  fit: number;
}

export interface Video {
  id: string;
  title: string;
  creatorId: string;
  /** Seconds. */
  duration: number;
  metrics: VideoMetrics;
  analysis: CommentAnalysis;
  /** 0–100. How well this video bridges from the previous concept to the next one. */
  curriculumFit: number;
  /** Why the fit is what it is, in a sentence. */
  fitNote: string;
  /** Visual treatment for the generated thumbnail. */
  thumb: ThumbStyle;
}

export interface ThumbStyle {
  kicker: string;
  headline: string;
  variant: 'code' | 'diagram' | 'type' | 'grid' | 'wave';
  hue: number;
}

/** A video that was considered for a lesson and not selected. */
export interface Candidate extends Video {
  rejectedBecause: string;
}

export interface Chapter {
  /** Seconds from start. */
  t: number;
  title: string;
  text: string;
}

export interface Exercise {
  kind: 'code' | 'sql' | 'text';
  prompt: string;
  starter?: string;
  language?: string;
  hint: string;
  /** Regex sources that a passing answer must match (case-insensitive). */
  checks: { pattern: string; label: string }[];
  solution: string;
  /** For SQL: rows shown when the query passes. */
  resultPreview?: { columns: string[]; rows: (string | number)[][] };
}

export interface QuizQuestion {
  id: string;
  concept: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** Seconds — the source video's duration. */
  duration: number;
  video: Video;
  candidates: Candidate[];
  /** Total videos scanned for this concept before shortlisting. */
  scanned: number;
  objective: string;
  outcomes: string[];
  concepts: string[];
  chapters: Chapter[];
  exercise?: Exercise;
  check: QuizQuestion[];
  kind: 'lesson' | 'project';
}

export interface Module {
  id: string;
  index: number;
  title: string;
  description: string;
  prerequisiteConcepts: string[];
  lessons: Lesson[];
  project?: string;
}

export interface Project {
  title: string;
  summary: string;
  deliverable: string;
  milestones: { id: string; title: string; lessonId?: string }[];
}

export interface GlossaryEntry {
  term: string;
  def: string;
  example?: string;
  /** Concepts this one depends on, for the concept map. */
  requires?: string[];
  skill: string;
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  topic: string;
  level: Level;
  /** Minutes, total. */
  minutes: number;
  creators: string[];
  modules: Module[];
  skills: string[];
  tools: string[];
  outcomes: string[];
  finalProject: Project;
  glossary: Record<string, GlossaryEntry>;
  quiz: QuizQuestion[];
  /** Cover art hue + motif. */
  cover: { hue: number; motif: ThumbStyle['variant'] };
  /** Rough count of videos the pipeline scanned for the whole course. */
  scanned: number;
  flagship?: boolean;
}

export interface Topic {
  id: string;
  label: string;
  category: CategoryId;
  /** Course built from this topic, if one exists in the library. */
  courseId?: string;
}

/* ----------------------------- learner state ----------------------------- */

export interface Note {
  id: string;
  lessonId: string;
  t: number;
  text: string;
  quote?: string;
  createdAt: number;
}

export interface ActivityItem {
  id: string;
  at: number;
  courseId: string;
  kind: 'lesson' | 'quiz' | 'exercise' | 'project' | 'module' | 'course' | 'start';
  label: string;
}

export interface CourseProgress {
  courseId: string;
  completed: string[];
  currentLessonId: string;
  /** concept → confidence 0–100 */
  confidence: Record<string, number>;
  exercisesPassed: string[];
  milestones: string[];
  projectUrl?: string;
  quizCorrect: number;
  quizTotal: number;
  startedAt: number;
  completedAt?: number;
  focusedSeconds: number;
}

export interface LearnerState {
  name: string;
  progress: Record<string, CourseProgress>;
  saved: string[];
  notes: Note[];
  activity: ActivityItem[];
  focusMode: boolean;
  /** Courses produced by the generator for topics outside the library. */
  generated: string[];
}
