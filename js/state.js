/**
 * state.js — shared mutable state and app-wide constants.
 *
 * All modules import from here so there is a single source of truth.
 * Never import state.js into itself.
 */

/** Mutable application state */
export const state = {
  /** @type {Array<{id:string, name:string, deadline:number, difficulty:number, importance:number, notes:string, priority:number, done:boolean}>} */
  tasks:    [],
  filter:   'active',   // active | high | med | low | done | all
  searchQ:  '',
  editId:   null,       // non-null while editing an existing task
  trash:    null,       // { task, idx } — held for undo window
  trashTmr: null,       // setTimeout handle for clearing trash
};

/**
 * Pomodoro timer state — kept here so render.js can read it
 * without creating a circular import with timer.js.
 */
export const tmr = {
  taskId: null,
  mode:   'work',   // 'work' | 'short' | 'long'
  rem:    25 * 60,
  total:  25 * 60,
  paused: true,
  pomos:  0,
  iv:     null,     // setInterval handle
};

// ── Constants ──────────────────────────────────────────────────────────────

/** Maximum possible priority score: importance=10, difficulty=10, deadline=1 */
export const MAX_SCORE = (10 * 3) + (10 * 2) + (10 - 1); // 59

/** Timer phase durations in seconds */
export const DUR = {
  work:  25 * 60,
  short:  5 * 60,
  long:  15 * 60,
};

/** Human-readable phase label */
export const MLBL = {
  work:  'Focus',
  short: 'Short Break',
  long:  'Long Break',
};

/** SVG stroke colour per phase */
export const MCLR = {
  work:  'var(--acc2)',
  short: 'var(--low)',
  long:  'var(--blue)',
};

/** Short label shown inside SVG circle */
export const MSLBL = {
  work:  'FOCUS',
  short: 'BREAK',
  long:  'BREAK',
};

/** SVG circle circumference for r=32: 2π×32 ≈ 201.06 */
export const T_CIRC = 2 * Math.PI * 32;
