/**
 * timer.js — Pomodoro focus timer logic and UI updates.
 *
 * Phases cycle as: work → short break → work → … (long break every 4 pomos)
 * Timer state lives in state.js so render.js can read it without
 * creating a circular import.
 */

import { tmr, state, DUR, MLBL, MCLR, MSLBL, T_CIRC } from './state.js';
import { toast }  from './toast.js';
import { render } from './render.js';

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Start (or stop, if already running for this task) a Pomodoro session.
 * @param {string} taskId
 */
export function startFocus(taskId) {
  // Toggle off if the same task is already focused
  if (tmr.taskId === taskId && tmr.iv) {
    timerStop();
    return;
  }

  if (tmr.iv) clearInterval(tmr.iv);

  Object.assign(tmr, {
    taskId,
    mode:   'work',
    rem:    DUR.work,
    total:  DUR.work,
    paused: false,
    pomos:  0,
    iv:     null,
  });

  document.getElementById('timer-bar').classList.add('up');
  updateTimerUI();
  tmr.iv = setInterval(tick, 1000);
  render(); // show "IN FOCUS" badge on the card
}

/** Toggle pause / resume. */
export function timerPause() {
  tmr.paused = !tmr.paused;

  // If resumed and the interval was cleared (phase ended), restart it
  if (!tmr.paused && !tmr.iv) {
    tmr.iv = setInterval(tick, 1000);
  }

  updateTimerUI();
}

/** Skip to the next timer phase immediately. */
export function timerSkip() {
  if (tmr.iv) clearInterval(tmr.iv);
  tmr.iv = null;
  advancePhase();
  tmr.paused = true;
  updateTimerUI();
}

/** Stop the timer entirely and hide the timer bar. */
export function timerStop() {
  if (tmr.iv) clearInterval(tmr.iv);
  tmr.iv     = null;
  tmr.taskId = null;
  document.getElementById('timer-bar').classList.remove('up');
  render(); // remove "IN FOCUS" badge
}

// ── Private helpers ────────────────────────────────────────────────────────

function tick() {
  if (tmr.paused) return;

  tmr.rem--;
  updateTimerUI();

  if (tmr.rem > 0) return;

  // Phase ended
  clearInterval(tmr.iv);
  tmr.iv = null;

  const wasWork = tmr.mode === 'work';
  advancePhase();

  toast(
    wasWork
      ? tmr.mode === 'long'
        ? `🍅×${tmr.pomos} Great work! Long break earned.`
        : `🍅 Focus session done! Take a short break.`
      : 'Break over — time to focus! ⚡',
    'i'
  );

  tmr.paused = true;
  updateTimerUI();
}

/** Move to the next phase, updating rem/total/pomos. */
function advancePhase() {
  if (tmr.mode === 'work') {
    tmr.pomos++;
    tmr.mode = tmr.pomos % 4 === 0 ? 'long' : 'short';
  } else {
    tmr.mode = 'work';
  }
  tmr.total = DUR[tmr.mode];
  tmr.rem   = tmr.total;
}

/** Repaint only the timer bar elements. */
function updateTimerUI() {
  const min = String(Math.floor(tmr.rem / 60)).padStart(2, '0');
  const sec = String(tmr.rem % 60).padStart(2, '0');

  document.getElementById('t-time').textContent = `${min}:${sec}`;
  document.getElementById('t-lbl').textContent  = MSLBL[tmr.mode];

  // SVG arc
  const circle = document.getElementById('t-circle');
  circle.style.strokeDashoffset = T_CIRC * (1 - tmr.rem / tmr.total);
  circle.style.stroke           = MCLR[tmr.mode];

  // Mode badge
  const badge = document.getElementById('t-mode-badge');
  badge.textContent = MLBL[tmr.mode];
  badge.className   = `tmode-badge ${tmr.mode}`;

  // Task name
  const task = state.tasks.find(t => t.id === tmr.taskId);
  document.getElementById('t-task-name').textContent = task ? task.name : '—';

  // Pomodoro tomato dots (cap at 8 to avoid overflow)
  document.getElementById('t-pomos').textContent = '🍅'.repeat(Math.min(tmr.pomos, 8));

  // Pause/play icon
  document.getElementById('t-pause-btn').textContent = tmr.paused ? '▶' : '⏸';
}
