/**
 * priority.js — pure priority-scoring functions.
 *
 * Rule-based formula (classic expert system):
 *   score = (importance × 3) + (difficulty × 2) + (10 − deadline)
 *
 * Weights reflect that importance matters most, difficulty signals
 * how much early effort the task needs, and urgency rises as the
 * deadline approaches.  Higher score = tackle sooner.
 *
 * Why this qualifies as AI (rule-based reasoning):
 *   Instead of manually ranking tasks, the program encodes expert
 *   knowledge as a weighted formula and makes decisions automatically.
 *   This mirrors 1960s–80s expert systems — the earliest branch of AI.
 *
 * Future improvement paths:
 *   • Learn personal weights from past completion behaviour (ML)
 *   • Predict actual task duration from historical difficulty data
 *   • Accept plain-English descriptions and infer scores via NLP
 */

/**
 * Calculate the priority score for a task.
 * @param {{ importance: number, difficulty: number, deadline: number }} task
 * @returns {number}
 */
export function calc(task) {
  return (task.importance * 3) + (task.difficulty * 2) + (10 - task.deadline);
}

/**
 * Classify a priority score into a visual tier.
 * @param {number} score
 * @returns {'high' | 'med' | 'low'}
 */
export function tier(score) {
  if (score >= 35) return 'high';
  if (score >= 20) return 'med';
  return 'low';
}
