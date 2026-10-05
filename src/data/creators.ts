import type { Creator } from '../types';

/**
 * Fictional channels. Numbers are illustrative and chosen to exercise the
 * validation model: small, focused channels with outsized reach next to
 * very large generalist channels.
 */
const list: Omit<Creator, 'monogram' | 'hue'>[] = [
  // AI & engineering
  { id: 'pec', name: 'Plain English Code', handle: '@plainenglishcode', subscribers: 420_000, topicFocus: 0.9, consistency: 0.88, focus: 'AI concepts without the jargon' },
  { id: 'mira', name: 'Mira Okafor', handle: '@miraokafor', subscribers: 1_300_000, topicFocus: 0.82, consistency: 0.84, focus: 'ML engineer, model internals' },
  { id: 'sn', name: 'Signal & Noise', handle: '@signalnoise.dev', subscribers: 180_000, topicFocus: 0.92, consistency: 0.8, focus: 'LLM application patterns' },
  { id: 'bsl', name: 'Byte Sized Lab', handle: '@bytesizedlab', subscribers: 2_100_000, topicFocus: 0.7, consistency: 0.9, focus: 'Python and data, one idea at a time' },
  { id: 'sl', name: 'Stack Loom', handle: '@stackloom', subscribers: 640_000, topicFocus: 0.78, consistency: 0.82, focus: 'Full-stack web and deployment' },
  { id: 'devi', name: 'Devi Rao', handle: '@devibuilds', subscribers: 95_000, topicFocus: 0.95, consistency: 0.76, focus: 'Retrieval and search systems' },
  { id: 'tpb', name: 'The Pragmatic Builder', handle: '@pragmaticbuilder', subscribers: 880_000, topicFocus: 0.74, consistency: 0.86, focus: 'Shipping real products' },
  // SQL & data
  { id: 'qk', name: 'Query Kitchen', handle: '@querykitchen', subscribers: 310_000, topicFocus: 0.94, consistency: 0.85, focus: 'SQL recipes for real work' },
  { id: 'dana', name: 'Data with Dana', handle: '@datawithdana', subscribers: 760_000, topicFocus: 0.86, consistency: 0.9, focus: 'Analytics careers and SQL' },
  { id: 'tomas', name: 'Tomás Ferreira', handle: '@tomasferreira', subscribers: 120_000, topicFocus: 0.9, consistency: 0.72, focus: 'Database internals' },
  { id: 'schema', name: 'Schema School', handle: '@schemaschool', subscribers: 450_000, topicFocus: 0.88, consistency: 0.8, focus: 'Data modeling' },
  { id: 'ac', name: 'Analytics Corner', handle: '@analyticscorner', subscribers: 210_000, topicFocus: 0.8, consistency: 0.78, focus: 'Business analytics' },
  { id: 'joan', name: 'Joan Park', handle: '@joanparkdata', subscribers: 88_000, topicFocus: 0.93, consistency: 0.7, focus: 'Window functions and advanced SQL' },
  { id: 'ink', name: 'Index & Ink', handle: '@indexandink', subscribers: 140_000, topicFocus: 0.85, consistency: 0.74, focus: 'Readable queries, CTEs' },
  { id: 'wpd', name: 'Window Pane Data', handle: '@windowpanedata', subscribers: 65_000, topicFocus: 0.96, consistency: 0.7, focus: 'Real datasets, end-to-end' },
  // Design
  { id: 'hfd', name: 'Hands-on Figma Daily', handle: '@handsonfigma', subscribers: 520_000, topicFocus: 0.9, consistency: 0.86, focus: 'Figma craft' },
  { id: 'ines', name: 'Inês Moura', handle: '@inesmoura', subscribers: 230_000, topicFocus: 0.88, consistency: 0.8, focus: 'Product design process' },
  { id: 'gridline', name: 'Gridline', handle: '@gridline', subscribers: 310_000, topicFocus: 0.84, consistency: 0.82, focus: 'Visual and interaction design' },
  { id: 'ux', name: 'UX in Practice', handle: '@uxinpractice', subscribers: 160_000, topicFocus: 0.92, consistency: 0.76, focus: 'Research and testing' },
  // Business
  { id: 'fhq', name: 'Founder HQ', handle: '@founderhq', subscribers: 1_100_000, topicFocus: 0.72, consistency: 0.88, focus: 'Startup fundamentals' },
  { id: 'nadia', name: 'Nadia Brooks', handle: '@nadiabrooks', subscribers: 340_000, topicFocus: 0.86, consistency: 0.8, focus: 'Customer discovery' },
  { id: 'ssp', name: 'Small Shop Playbook', handle: '@smallshopplaybook', subscribers: 72_000, topicFocus: 0.94, consistency: 0.74, focus: 'Bootstrapped businesses' },
  { id: 'pricelab', name: 'Price Lab', handle: '@pricelab', subscribers: 58_000, topicFocus: 0.97, consistency: 0.7, focus: 'Pricing strategy' },
  // Creative
  { id: 'cutroom', name: 'The Cut Room', handle: '@thecutroom', subscribers: 890_000, topicFocus: 0.9, consistency: 0.86, focus: 'Editing craft' },
  { id: 'kai', name: 'Kai Lindqvist', handle: '@kailindqvist', subscribers: 270_000, topicFocus: 0.88, consistency: 0.78, focus: 'Color and finishing' },
  { id: 'soundbed', name: 'Soundbed', handle: '@soundbed', subscribers: 130_000, topicFocus: 0.95, consistency: 0.74, focus: 'Audio for video' },
  { id: 'aperture', name: 'Aperture Notes', handle: '@aperturenotes', subscribers: 610_000, topicFocus: 0.9, consistency: 0.84, focus: 'Photography fundamentals' },
  { id: 'lumen', name: 'Lumen & Lens', handle: '@lumenlens', subscribers: 190_000, topicFocus: 0.88, consistency: 0.78, focus: 'Light and composition' },
  // Practical
  { id: 'ledger', name: 'Ledger Lane', handle: '@ledgerlane', subscribers: 480_000, topicFocus: 0.9, consistency: 0.86, focus: 'Personal finance, no hype' },
  { id: 'amara', name: 'Amara Osei', handle: '@amaraosei', subscribers: 150_000, topicFocus: 0.88, consistency: 0.8, focus: 'Investing basics' },
  // Large generalist channels (frequently considered, less often selected)
  { id: 'twd', name: 'TechWorld Daily', handle: '@techworlddaily', subscribers: 9_200_000, topicFocus: 0.32, consistency: 0.9, focus: 'General technology' },
  { id: 'mega', name: 'MegaTutorials', handle: '@megatutorials', subscribers: 6_400_000, topicFocus: 0.45, consistency: 0.84, focus: 'Long-form courses' },
  { id: 'fte', name: 'Future Tech Explained', handle: '@futuretechexplained', subscribers: 3_800_000, topicFocus: 0.38, consistency: 0.76, focus: 'Tech news and explainers' },
  { id: 'lf100', name: 'Learn It Fast', handle: '@learnitfast', subscribers: 1_100_000, topicFocus: 0.5, consistency: 0.7, focus: 'Speed tutorials' },
  { id: 'z2p', name: 'Zero To Pro', handle: '@zerotopro', subscribers: 2_700_000, topicFocus: 0.55, consistency: 0.8, focus: 'Bootcamp-style courses' },
  { id: 'hype', name: 'Next Big Thing', handle: '@nextbigthing', subscribers: 540_000, topicFocus: 0.4, consistency: 0.6, focus: 'Trends and opinion' },
  { id: 'howto', name: 'HowTo Everything', handle: '@howtoeverything', subscribers: 7_800_000, topicFocus: 0.2, consistency: 0.82, focus: 'Everything, briefly' },
];

export const creators: Record<string, Creator> = Object.fromEntries(
  list.map((c, i) => [
    c.id,
    {
      ...c,
      monogram: c.name
        .replace(/[^A-Za-zÀ-ÿ ]/g, ' ')
        .split(/\s+/)
        .filter((w) => w && !['The', 'with', 'and', 'in'].includes(w))
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase(),
      hue: (i * 47 + 12) % 360,
    },
  ]),
);

/** Large channels that show up as considered-but-not-selected candidates. */
export const GENERALISTS = ['twd', 'mega', 'fte', 'lf100', 'z2p', 'hype', 'howto'];

export const creator = (id: string): Creator => creators[id] ?? creators.pec;
