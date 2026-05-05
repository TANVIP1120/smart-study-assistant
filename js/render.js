/**
 * render.js — all DOM rendering logic.
 *
 * The single render() function is the only way the UI updates.
 * It reads from state and re-draws everything from scratch.
 * Task card buttons use data-action / data-id attributes;
 * event delegation in app.js wires them up.
 */

import { state, tmr, MAX_SCORE }  from './state.js';
import { calc, tier }              from './priority.js';
import { esc }                     from './utils.js';
import { drawDonut }               from './chart.js';
import { save, getStreak }         from './storage.js';

// ── Sort helpers ───────────────────────────────────────────────────────────

const SORT_FNS = {
  priority:   (a, b) => b.priority   - a.priority,
  deadline:   (a, b) => a.deadline   - b.deadline,
  importance: (a, b) => b.importance - a.importance,
  difficulty: (a, b) => b.difficulty - a.difficulty,
  name:       (a, b) => a.name.localeCompare(b.name),
};

function getSortFn() {
  const key = document.getElementById('sort-sel')?.value || 'priority';
  return SORT_FNS[key] ?? SORT_FNS.priority;
}

// ── Main render ────────────────────────────────────────────────────────────

/** Re-compute and repaint the entire UI from current state. */
export function render() {
  // Recalculate all priority scores
  state.tasks.forEach(t => { t.priority = calc(t); });

  const active = state.tasks.filter(t => !t.done);
  const counts = {
    high: active.filter(t => tier(t.priority) === 'high').length,
    med:  active.filter(t => tier(t.priority) === 'med').length,
    low:  active.filter(t => tier(t.priority) === 'low').length,
  };
  const doneN = state.tasks.filter(t => t.done).length;
  const pct   = state.tasks.length
    ? Math.round(doneN / state.tasks.length * 100)
    : 0;

  // Stats bar
  document.getElementById('s-total').textContent  = active.length;
  document.getElementById('s-high').textContent   = counts.high;
  document.getElementById('s-med').textContent    = counts.med;
  document.getElementById('s-done').textContent   = doneN;
  document.getElementById('s-streak').textContent = getStreak().n;

  // Progress bar
  document.getElementById('prog-fill').style.width = `${pct}%`;
  document.getElementById('prog-txt').textContent  =
    `${doneN} / ${state.tasks.length} task${state.tasks.length !== 1 ? 's' : ''} complete (${pct}%)`;

  // Donut chart
  drawDonut(counts, active.length);

  // Urgent tasks banner
  const urgent  = active.filter(t => t.deadline <= 2);
  const uBanner = document.getElementById('urgent');
  if (urgent.length) {
    uBanner.hidden = false;
    document.getElementById('uchips').innerHTML = urgent
      .map(t => `<span class="uchip">📅 ${esc(t.name)} — ${t.deadline}d</span>`)
      .join('');
  } else {
    uBanner.hidden = true;
  }

  // Apply filter
  let vis = [...state.tasks];
  if      (state.filter === 'active') vis = vis.filter(t => !t.done);
  else if (state.filter === 'done')   vis = vis.filter(t =>  t.done);
  else if (state.filter === 'high')   vis = vis.filter(t => !t.done && tier(t.priority) === 'high');
  else if (state.filter === 'med')    vis = vis.filter(t => !t.done && tier(t.priority) === 'med');
  else if (state.filter === 'low')    vis = vis.filter(t => !t.done && tier(t.priority) === 'low');

  // Apply search
  if (state.searchQ) {
    const q = state.searchQ.toLowerCase();
    vis = vis.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q))
    );
  }

  const list = document.getElementById('task-list');
  list.innerHTML = '';

  if (!vis.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${state.searchQ ? '🔍' : '📋'}</div>
        <p>${state.searchQ
          ? `No tasks match "<strong>${esc(state.searchQ)}</strong>"`
          : state.filter === 'done'
            ? 'No completed tasks yet.'
            : 'No tasks here — hit <strong>Add Task</strong> to begin!'
        }</p>
      </div>`;
    save();
    return;
  }

  // Separate and sort
  const activeSorted = [...vis.filter(t => !t.done)].sort(getSortFn());
  const doneSorted   =   vis.filter(t =>  t.done);

  const TIER_META = {
    high: '🔴 High Priority',
    med:  '🟡 Medium Priority',
    low:  '🟢 Low Priority',
  };

  let rank = 1;
  ['high', 'med', 'low'].forEach(t => {
    const group = activeSorted.filter(x => tier(x.priority) === t);
    if (!group.length) return;
    appendSection(list, TIER_META[t]);
    group.forEach(task => list.appendChild(makeCard(task, rank++)));
  });

  if (doneSorted.length) {
    appendSection(list, '✅ Completed');
    doneSorted.forEach(task => list.appendChild(makeCard(task, '✓')));
  }

  save();
}

// ── Card builder ───────────────────────────────────────────────────────────

/**
 * Build a task card DOM element.
 * Buttons use data-action / data-id; app.js handles clicks via delegation.
 */
export function makeCard(t, rank) {
  const cl      = t.done ? 'low done' : tier(t.priority);
  const barPct  = Math.min(100, Math.max(0, Math.round((t.priority / MAX_SCORE) * 100)));
  const focused = tmr.taskId === t.id && tmr.iv;

  const card = document.createElement('div');
  card.className = `task-card ${cl}`;
  card.dataset.id = t.id;

  const notesHTML = t.notes
    ? `<div class="task-notes">📝 ${esc(t.notes.slice(0, 90))}${t.notes.length > 90 ? '…' : ''}</div>`
    : '';

  const focusBadge = focused ? `<div class="focus-badge">● IN FOCUS</div>` : '';

  card.innerHTML = `
    ${focusBadge}
    <div class="strip"></div>
    <div class="rank">${rank}</div>
    <div class="task-body">
      <div class="task-name">${esc(t.name)}</div>
      <div class="task-meta">
        <span>📅 ${t.deadline}d</span>
        <span>⚡ ${t.difficulty}/10</span>
        <span>⭐ ${t.importance}/10</span>
      </div>
      ${notesHTML}
      <div class="pbar-track">
        <div class="pbar-fill" style="width:${barPct}%"></div>
      </div>
    </div>
    <div class="score-badge">
      <span class="score-num">${t.priority}</span>
      <span class="score-lbl">score</span>
    </div>
    <div class="task-actions">
      ${!t.done ? `
        <button class="ibtn focus-btn ${focused ? 'focus-on' : ''}"
                data-action="focus" data-id="${t.id}" title="Pomodoro focus">⏱</button>` : ''}
      <button class="ibtn"
              data-action="edit" data-id="${t.id}" title="Edit task">✏</button>
      <button class="ibtn done-btn ${t.done ? 'ticked' : ''}"
              data-action="done" data-id="${t.id}"
              title="${t.done ? 'Unmark' : 'Mark done'}">
        ${t.done ? '↩' : '✓'}
      </button>
      <button class="ibtn del-btn"
              data-action="del" data-id="${t.id}" title="Delete">✕</button>
    </div>`;

  return card;
}

// ── Section divider ────────────────────────────────────────────────────────

export function appendSection(list, label) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<div class="sec-lbl">${label}</div>`;
  list.appendChild(wrapper);
}
