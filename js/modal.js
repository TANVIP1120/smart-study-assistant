/**
 * modal.js — Add / Edit task modal lifecycle.
 */

import { state }       from './state.js';
import { calc, tier }  from './priority.js';
import { shake }       from './utils.js';
import { toast }       from './toast.js';
import { render }      from './render.js';

// ── Open ───────────────────────────────────────────────────────────────────

/** Open the modal in "add new task" mode. */
export function openModal() {
  state.editId = null;
  document.getElementById('modal-title').textContent = 'New Task';
  document.getElementById('sub-txt').textContent     = 'Add Task';

  resetForm();
  showOverlay();
}

/**
 * Open the modal pre-filled for editing an existing task.
 * @param {string} id
 */
export function openEdit(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  state.editId = id;
  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('sub-txt').textContent     = 'Save Changes';

  document.getElementById('inp-name').value  = task.name;
  document.getElementById('inp-dl').value    = task.deadline;
  document.getElementById('inp-dif').value   = task.difficulty;
  document.getElementById('inp-imp').value   = task.importance;
  document.getElementById('inp-notes').value = task.notes || '';

  syncSlider('dif');
  syncSlider('imp');
  updateScorePreview();
  showOverlay();
}

// ── Close ──────────────────────────────────────────────────────────────────

export function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  state.editId = null;
}

// ── Submit ─────────────────────────────────────────────────────────────────

/** Validate the form and either create a new task or update an existing one. */
export function submitTask() {
  const name     = document.getElementById('inp-name').value.trim();
  const deadline = parseInt(document.getElementById('inp-dl').value, 10);
  const diff     = parseInt(document.getElementById('inp-dif').value, 10);
  const imp      = parseInt(document.getElementById('inp-imp').value, 10);
  const notes    = document.getElementById('inp-notes').value.trim();

  if (!name) {
    shake('inp-name');
    toast('Please enter a task name.', 'w');
    return;
  }

  if (isNaN(deadline) || deadline < 1 || deadline > 30) {
    shake('inp-dl');
    toast('Deadline must be 1–30 days.', 'w');
    return;
  }

  if (state.editId) {
    const task = state.tasks.find(t => t.id === state.editId);
    if (task) {
      task.name       = name;
      task.deadline   = deadline;
      task.difficulty = diff;
      task.importance = imp;
      task.notes      = notes;
      task.priority   = calc(task);
    }
    toast(`"${name}" updated ✓`, 's');
  } else {
    const task = {
      id:         crypto.randomUUID(),
      name,
      deadline,
      difficulty: diff,
      importance: imp,
      notes,
      priority:   0,
      done:       false,
    };
    task.priority = calc(task);
    state.tasks.push(task);
    toast(`"${name}" added — score ${task.priority}`, 's');
  }

  closeModal();
  render();
}

// ── Live score preview ─────────────────────────────────────────────────────

/**
 * Sync the displayed slider value label.
 * Called on every slider `input` event.
 * @param {'dif'|'imp'} field
 */
export function syncSlider(field) {
  document.getElementById(`v-${field}`).textContent =
    document.getElementById(`inp-${field}`).value;
}

/** Recalculate and display the live priority score preview. */
export function updateScorePreview() {
  const d   = parseInt(document.getElementById('inp-dl').value,  10) || 7;
  const dif = parseInt(document.getElementById('inp-dif').value, 10) || 5;
  const imp = parseInt(document.getElementById('inp-imp').value, 10) || 5;

  const score = (imp * 3) + (dif * 2) + (10 - d);
  const el    = document.getElementById('sp-val');

  el.textContent = score;
  el.style.color = tier(score) === 'high'
    ? 'var(--high)'
    : tier(score) === 'med'
      ? 'var(--med)'
      : 'var(--low)';
}

// ── Private helpers ────────────────────────────────────────────────────────

function showOverlay() {
  document.getElementById('overlay').classList.add('open');
  // Slight delay so the animation plays before focus is set
  setTimeout(() => document.getElementById('inp-name').focus(), 60);
}

function resetForm() {
  document.getElementById('inp-name').value  = '';
  document.getElementById('inp-dl').value    = '7';
  document.getElementById('inp-dif').value   = '5';
  document.getElementById('inp-imp').value   = '5';
  document.getElementById('inp-notes').value = '';
  syncSlider('dif');
  syncSlider('imp');
  updateScorePreview();
}
