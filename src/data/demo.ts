import type { Creator, Video } from '../types';

/**
 * The landing-page validation demo: four real-looking candidates for one
 * concept ("Python functions"), scored live with adjustable weights.
 */
export const DEMO_CREATORS: Record<string, Creator> = {
  a: { id: 'a', name: 'Byte Sized Lab', handle: '@bytesizedlab', subscribers: 850_000, topicFocus: 0.9, consistency: 0.88, focus: 'Python, one idea at a time', monogram: 'BS', hue: 210 },
  b: { id: 'b', name: 'TechWorld Daily', handle: '@techworlddaily', subscribers: 9_200_000, topicFocus: 0.32, consistency: 0.9, focus: 'General technology', monogram: 'TD', hue: 20 },
  c: { id: 'c', name: 'Learn It Fast', handle: '@learnitfast', subscribers: 1_100_000, topicFocus: 0.5, consistency: 0.7, focus: 'Speed tutorials', monogram: 'LF', hue: 300 },
  d: { id: 'd', name: 'MegaTutorials', handle: '@megatutorials', subscribers: 6_400_000, topicFocus: 0.45, consistency: 0.84, focus: 'Long-form courses', monogram: 'MT', hue: 120 },
};

const base = { thumb: { kicker: '', headline: 'Functions', variant: 'code' as const, hue: 210 }, fitNote: '' };

export const DEMO_VIDEOS: Video[] = [
  { ...base, id: 'a', title: 'Python Functions Explained Clearly', creatorId: 'a', duration: 16 * 60 + 24, metrics: { views: 2_400_000, likes: 118_000, comments: 18_000, ageDays: 540 }, analysis: { analyzed: 1200, learningPositive: 402, confusion: 14, quotes: ['I’ve watched three tutorials and this is the first one that actually clicked.', 'The explanation finally made recursion make sense.', 'Came here knowing nothing about functions and built my first script after this.'] }, curriculumFit: 97 },
  { ...base, id: 'b', title: 'Everything You Need to Know About Functions', creatorId: 'b', duration: 41 * 60 + 8, metrics: { views: 8_100_000, likes: 190_000, comments: 22_000, ageDays: 1650 }, analysis: { analyzed: 1500, learningPositive: 285, confusion: 96, quotes: ['Great video but way too fast for beginners.', 'Is this still accurate in 2026? Half the syntax looks different.'] }, curriculumFit: 84 },
  { ...base, id: 'c', title: 'Functions in 100 Seconds', creatorId: 'c', duration: 2 * 60 + 4, metrics: { views: 3_300_000, likes: 141_000, comments: 6_200, ageDays: 720 }, analysis: { analyzed: 900, learningPositive: 189, confusion: 41, quotes: ['Fun, but I need the slow version.'] }, curriculumFit: 71 },
  { ...base, id: 'd', title: 'Python Full Course for Beginners (12 Hours)', creatorId: 'd', duration: 12 * 3600, metrics: { views: 14_600_000, likes: 310_000, comments: 41_000, ageDays: 2100 }, analysis: { analyzed: 2000, learningPositive: 410, confusion: 70, quotes: ['Functions start at 3:14:20 if you’re looking.'] }, curriculumFit: 62 },
];
