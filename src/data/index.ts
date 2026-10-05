import type { CategoryId, Course, Topic } from '../types';
import { buildCourse, type CourseSpec } from '../lib/buildCourse';
import { aiApp } from './courses/ai-app';
import { sql } from './courses/sql';
import { business, finance, photography, productDesign, python, videoEditing, website } from './courses/library';

const specs: CourseSpec[] = [aiApp, sql, python, productDesign, business, videoEditing, website, photography, finance];

const registry = new Map<string, Course>(specs.map((s) => [s.id, buildCourse(s)]));

export const getCourse = (id: string): Course | undefined => registry.get(id);
export const libraryCourses = () => specs.map((s) => registry.get(s.id)!);
export const registerCourse = (c: Course) => registry.set(c.id, c);
export const FLAGSHIP_ID = 'ai-app';

export const CATEGORIES: { id: CategoryId; label: string; blurb: string }[] = [
  { id: 'technical', label: 'Technical', blurb: 'Code, data and AI' },
  { id: 'design', label: 'Design', blurb: 'Product, UX and visual' },
  { id: 'business', label: 'Business', blurb: 'Build and grow a company' },
  { id: 'creative', label: 'Creative', blurb: 'Make things people watch' },
  { id: 'career', label: 'Career', blurb: 'Skills that compound at work' },
  { id: 'practical', label: 'Practical', blurb: 'Life skills, taught well' },
];

const t = (label: string, category: CategoryId, courseId?: string): Topic => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  label,
  category,
  courseId,
});

export const TOPICS: Topic[] = [
  t('AI applications', 'technical', 'ai-app'), t('Python', 'technical', 'python'), t('SQL', 'technical', 'sql'), t('Web development', 'technical', 'website'),
  t('JavaScript', 'technical'), t('APIs', 'technical', 'ai-app'), t('Machine learning', 'technical'), t('Git & GitHub', 'technical'), t('Data analysis', 'technical', 'sql'),
  t('Product design', 'design', 'product-design'), t('UX research', 'design', 'product-design'), t('Figma', 'design', 'product-design'), t('Design systems', 'design'),
  t('Typography', 'design'), t('Interaction design', 'design', 'product-design'), t('Prototyping', 'design', 'product-design'),
  t('Starting a business', 'business', 'business'), t('Customer discovery', 'business', 'business'), t('Pricing', 'business', 'business'), t('Product management', 'business'),
  t('Sales', 'business'), t('Market research', 'business'), t('Building an MVP', 'business', 'business'),
  t('Video editing', 'creative', 'video-editing'), t('Photography', 'creative', 'photography'), t('Storytelling', 'creative'), t('Writing', 'creative'),
  t('Music production', 'creative'), t('Graphic design', 'creative'), t('YouTube production', 'creative', 'video-editing'),
  t('Public speaking', 'career'), t('Negotiation', 'career'), t('Interviewing', 'career'), t('Presentation design', 'career'), t('Leadership', 'career'), t('Communication', 'career'),
  t('Personal finance', 'practical', 'finance'), t('Cooking', 'practical'), t('Strength training', 'practical'), t('Surfing', 'practical'), t('Home improvement', 'practical'), t('Language learning', 'practical'),
];

/** Keyword routing from free-text intent to an existing pipeline result. */
const ROUTES: [RegExp, string][] = [
  [/\b(sql|database|queries|query|postgres|mysql|analytics|data analys)/i, 'sql'],
  [/\b(ai|llm|gpt|chatbot|rag|machine learning|agents?|openai|claude|api)\b/i, 'ai-app'],
  [/\b(python)\b/i, 'python'],
  [/\b(website|web ?site|html|css|web dev|landing page|portfolio site)/i, 'website'],
  [/\b(video|edit|editing|premiere|resolve|youtube channel)/i, 'video-editing'],
  [/\b(business|startup|founder|company|entrepreneur|mvp|side hustle)/i, 'business'],
  [/\b(design|ux|ui|figma|prototyp)/i, 'product-design'],
  [/\b(photo|camera|photography)/i, 'photography'],
  [/\b(financ|money|budget|invest|saving|debt)/i, 'finance'],
];

export function routeIntent(q: string): string | null {
  for (const [re, id] of ROUTES) if (re.test(q)) return id;
  return null;
}

export const SUGGESTED_INTENTS = ['I want to learn SQL', 'Build my first website', 'Start a business from scratch', 'Get good at video editing', 'Learn to negotiate'];
