/**
 * app.js — application entry point.
 *
 * Responsibilities:
 *  • Boot sequence (load data, seed demo tasks, first render)
 *  • Wire up every event listener via delegation or direct binding
 *  • Keyboard shortcuts
 *  • Search, filter, sort handlers
 *  • JSON export
 *
 * This file intentionally contains NO business logic — it delegates
 * everything to the appropriate module.
 */

import { state, tmr }                          from './state.js';
import { load }                                from './storage.js';
import { calc }                                from './priority.js';
import { render }                              from './render.js';
import { openModal, openEdit, closeModal,
         submitTask, syncSlider,
         updateScorePreview }                  from './modal.js';
import { toggleDone, del }                     from './tasks.js';
import { startFocus, timerPause,
         timerSkip, timerStop }                from './timer.js';
import { toast }                               from './toast.js';

// ── Boot ───────────────────────────────────────────────────────────────────

load();

// Seed demo tasks if the user has no saved data
if (!state.tasks.length) {
  const demos = [
    { name: 'Revise Maths Chapter 4',   deadline:  3, difficulty: 7, importance: 9, notes: 'Focus on integration by parts' },
    { name: 'Write History Essay',       deadline:  7, difficulty: 6, importance: 8, notes: 'WWI causes — 1500 words min' },
    { name: 'Physics Past Papers',       deadline:  2, difficulty: 8, importance: 9, notes: 'Last 3 years exam papers' },
    { name: 'Practice Coding (Loops)',   deadline:  2, difficulty: 5, importance: 7, notes: 'LeetCode problems 1–10' },
    { name: 'Read Biology Notes',        deadline: 14, difficulty: 4, importance: 6, notes: '' },
    { name: 'Review French Vocabulary',  deadline: 20, difficulty: 3, importance: 5, notes: 'Unit 4 & 5 vocab lists' },
  ];

  demos.forEach(d => {
    const task = {
      id:         crypto.randomUUID(),
      name:       d.name,
      deadline:   d.deadline,
      difficulty: d.difficulty,
      importance: d.importance,
      notes:      d.notes,
      priority:   0,
      done:       false,
    };
    task.priority = calc(task);
    state.tasks.push(task);
  });
}

render();

// ── Header buttons ─────────────────────────────────────────────────────────

document.getElementById('btn-add').addEventListener('click', openModal);

document.getElementById('btn-export').addEventListener('click', () => {
  const json = JSON.stringify(state.tasks, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');

  a.href     = url;
  a.download = `study_tasks_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast('Exported as JSON ✓', 's');
});

// ── Search ─────────────────────────────────────────────────────────────────

document.getElementById('search-input').addEventListener('input', e => {
  state.searchQ = e.target.value;
  document.getElementById('search-clear').classList.toggle('show', !!state.searchQ);
  render();
});

document.getElementById('search-clear').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  state.searchQ = '';
  document.getElementById('search-clear').classList.remove('show');
  render();
  document.getElementById('search-input').focus();
});

// ── Filter tabs ────────────────────────────────────────────────────────────

document.querySelector('.tabs').addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;

  state.filter = btn.dataset.filter;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  render();
});

// ── Sort ───────────────────────────────────────────────────────────────────

document.getElementById('sort-sel').addEventListener('change', render);

// ── Task list — event delegation ───────────────────────────────────────────

document.getElementById('task-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === 'focus') startFocus(id);
  if (action === 'edit')  openEdit(id);
  if (action === 'done')  toggleDone(id);
  if (action === 'del')   del(id);
});

// ── Modal ──────────────────────────────────────────────────────────────────

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('sub-btn').addEventListener('click', submitTask);

// Close modal when clicking the semi-transparent backdrop
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});

// Live score preview — slider and deadline input
document.getElementById('inp-dif').addEventListener('input', () => {
  syncSlider('dif');
  updateScorePreview();
});
document.getElementById('inp-imp').addEventListener('input', () => {
  syncSlider('imp');
  updateScorePreview();
});
document.getElementById('inp-dl').addEventListener('input', updateScorePreview);

// ── Timer controls ─────────────────────────────────────────────────────────

document.getElementById('t-pause-btn').addEventListener('click', timerPause);
document.getElementById('t-skip-btn').addEventListener('click', timerSkip);
document.getElementById('t-stop-btn').addEventListener('click', timerStop);

// ── Keyboard shortcuts ─────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  const active = document.activeElement;
  const typing = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);

  if (e.key === 'Escape') {
    closeModal();
    return;
  }

  if (!typing) {
    if (e.key === 'n' || e.key === 'N') { openModal(); return; }
    if (e.key === 'f' || e.key === 'F') { document.getElementById('search-input').focus(); return; }
    if (e.key === ' ' && tmr.iv)        { e.preventDefault(); timerPause(); return; }
  }

  // Submit modal with Enter when a form field is focused
  if (e.key === 'Enter'
      && document.getElementById('overlay').classList.contains('open')
      && active?.tagName !== 'TEXTAREA') {
    e.preventDefault();
    submitTask();
  }
});
