/**
 * tasks.js — task CRUD operations and undo-delete logic.
 */

import { state, tmr }  from './state.js';
import { save, bumpStreak } from './storage.js';
import { toast }       from './toast.js';
import { confetti }    from './confetti.js';
import { render }      from './render.js';
import { timerStop }   from './timer.js';

// ── Toggle done ────────────────────────────────────────────────────────────

/**
 * Mark a task complete (or un-complete it).
 * Triggers confetti + streak bump on first completion.
 * @param {string} id
 */
export function toggleDone(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.done = !task.done;

  if (task.done) {
    confetti();
    bumpStreak();
    toast(`"${task.name}" complete! 🎉`, 's');
    if (tmr.taskId === id) timerStop();
  } else {
    toast(`"${task.name}" moved back to active`, 'i');
  }

  render();
}

// ── Delete ─────────────────────────────────────────────────────────────────

/**
 * Remove a task from the list and keep it in a short-lived trash slot
 * so the user can undo within 5.5 seconds.
 * @param {string} id
 */
export function del(id) {
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx === -1) return;

  const task = state.tasks.splice(idx, 1)[0];

  // Cancel any existing undo window
  if (state.trashTmr) clearTimeout(state.trashTmr);

  state.trash    = { task, idx };
  state.trashTmr = setTimeout(() => { state.trash = null; }, 5500);

  toast(`"${task.name}" deleted`, 'w', undoDel);

  if (tmr.taskId === id) timerStop();

  render();
}

// ── Undo delete ────────────────────────────────────────────────────────────

/** Restore the most recently deleted task if the undo window is still open. */
export function undoDel() {
  if (!state.trash) return;

  const { task, idx } = state.trash;
  state.tasks.splice(idx, 0, task);

  clearTimeout(state.trashTmr);
  state.trash    = null;
  state.trashTmr = null;

  toast(`"${task.name}" restored ↩`, 's');
  render();
}
