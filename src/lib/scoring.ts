/**
 * The CoursePack validation model.
 *
 * Three ecosystem signals are derived from raw metrics, combined with
 * configurable weights into a Validation score, then blended with
 * Curriculum Fit (does this video belong *here* in the sequence?) to
 * produce the CoursePack Score used for selection.
 *
 * Nothing in the UI hard-codes a score — every number is computed here.
 */
import type { Creator, Signals, Video } from '../types';

export interface Weights {
  learner: number;
  virality: number;
  authority: number;
}

export const DEFAULT_WEIGHTS: Weights = { learner: 0.4, virality: 0.35, authority: 0.25 };

/** Share of the final score given to curriculum fit vs. validation. */
export const FIT_BLEND = 0.2;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Learner signal: do comments show people actually learned something?
 * Rewards the *share* of learning-positive comments, penalises confusion.
 * Raw comment volume deliberately has no effect.
 */
export function learnerSignal(v: Video): number {
  const { analyzed, learningPositive, confusion } = v.analysis;
  if (!analyzed) return 50;
  const pos = learningPositive / analyzed;
  const neg = confusion / analyzed;
  return Math.round(clamp(38 + 170 * pos - 110 * neg, 20, 99));
}

/**
 * Virality signal: did the video outperform its expected reach?
 * Views relative to the channel's subscriber base, engagement rate,
 * and velocity (views per day, log-damped) — not absolute views.
 */
export function viralitySignal(v: Video, c: Creator): number {
  const { views, likes, comments, ageDays } = v.metrics;
  const reach = Math.log10(Math.max(views, 1) / Math.max(c.subscribers, 1));
  const engagement = (likes + comments) / Math.max(views, 1);
  const velocity = Math.log10(Math.max(views / Math.max(ageDays, 30), 1));
  return Math.round(clamp(58 + 21 * reach + 380 * (engagement - 0.03) + 3 * (velocity - 3), 25, 99));
}

/**
 * Authority signal: an established, consistent, on-topic channel.
 * Subscribers are log-scaled so a 10M channel is not 100× a 100K channel.
 */
export function authoritySignal(c: Creator): number {
  return Math.round(clamp(9 * Math.log10(Math.max(c.subscribers, 10)) + 24 * c.topicFocus + 16 * c.consistency - 4, 20, 99));
}

export function signalsFor(v: Video, c: Creator): Signals {
  return {
    learner: learnerSignal(v),
    virality: viralitySignal(v, c),
    authority: authoritySignal(c),
    fit: v.curriculumFit,
  };
}

export function validationScore(s: Signals, w: Weights = DEFAULT_WEIGHTS): number {
  const total = w.learner + w.virality + w.authority || 1;
  return (s.learner * w.learner + s.virality * w.virality + s.authority * w.authority) / total;
}

export function coursePackScore(s: Signals, w: Weights = DEFAULT_WEIGHTS): number {
  return Math.round(validationScore(s, w) * (1 - FIT_BLEND) + s.fit * FIT_BLEND);
}

/** Five-step qualitative band, used instead of stars. */
export function band(n: number): { steps: number; label: string } {
  if (n >= 90) return { steps: 5, label: 'Exceptional' };
  if (n >= 80) return { steps: 4, label: 'Strong' };
  if (n >= 68) return { steps: 3, label: 'Solid' };
  if (n >= 55) return { steps: 2, label: 'Mixed' };
  return { steps: 1, label: 'Weak' };
}

export const SIGNAL_META: Record<keyof Signals, { label: string; short: string; explain: string }> = {
  learner: {
    label: 'Learner feedback',
    short: 'Learner',
    explain: 'Share of comments where viewers say the explanation helped, clicked, or that they applied it.',
  },
  virality: {
    label: 'Engagement',
    short: 'Engagement',
    explain: 'Performance relative to the channel’s reach: views per subscriber, engagement rate, and velocity.',
  },
  authority: {
    label: 'Creator authority',
    short: 'Authority',
    explain: 'An established, consistent channel that teaches this subject regularly. Log-scaled so size alone can’t win.',
  },
  fit: {
    label: 'Curriculum fit',
    short: 'Fit',
    explain: 'How well this video bridges from the previous concept to the next one at this point in the path.',
  },
};
