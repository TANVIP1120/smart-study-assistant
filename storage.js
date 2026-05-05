/**
 * storage.js — localStorage persistence and streak tracking.
 */

import { state } from './state.js';

const TASKS_KEY  = 'ssa3';
const STREAK_KEY = 'ssa_streak';

// ── Tasks ──────────────────────────────────────────────────────────────────

/** Persist the current task list to localStorage. */
export function save() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks));
}

/**
 * Load tasks from localStorage into state.tasks.
 * Falls back to legacy keys so old data is not lost on upgrade.
 */
export function load() {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
             || localStorage.getItem('ssa_tasks_v2')
             || localStorage.getItem('ssa_tasks');

    state.tasks = raw ? JSON.parse(raw) : [];

    // Back-fill the `notes` field added in a later version
    state.tasks.forEach(t => {
      if (!('notes' in t)) t.notes = '';
    });
  } catch {
    state.tasks = [];
  }
}

// ── Study streak ───────────────────────────────────────────────────────────

/**
 * Read the current streak record.
 * @returns {{ date: string, n: number }}
 */
export function getStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"date":"","n":0}');
  } catch {
    return { date: '', n: 0 };
  }
}

/**
 * Increment the streak counter when the user completes a task today.
 * - Same day  → no change (already counted)
 * - Yesterday → extend streak
 * - Older     → reset to 1
 * @returns {number} updated streak count
 */
export function bumpStreak() {
  const today = new Date().toDateString();
  const s = getStreak();

  if (s.date === today) return s.n;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  s.n    = s.date === yesterday.toDateString() ? s.n + 1 : 1;
  s.date = today;

  localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  return s.n;
}
