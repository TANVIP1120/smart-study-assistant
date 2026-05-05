/**
 * toast.js — non-blocking notification system.
 */

/**
 * Show a temporary toast notification at the bottom-right of the screen.
 *
 * @param {string}        msg     - Message text
 * @param {'s'|'i'|'w'}   type    - 's' success · 'i' info · 'w' warning
 * @param {Function|null} undoCb  - If provided, an Undo button is added
 */
export function toast(msg, type = 'i', undoCb = null) {
  const container = document.getElementById('toasts');

  const el = document.createElement('div');
  el.className = `toast ${type}`;

  const text = document.createElement('span');
  text.textContent = msg;
  el.appendChild(text);

  if (undoCb) {
    const btn = document.createElement('button');
    btn.className   = 'undo-btn';
    btn.textContent = 'Undo';
    btn.addEventListener('click', () => { undoCb(); el.remove(); });
    el.appendChild(btn);
  }

  container.appendChild(el);

  // Fade out then remove
  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transition = 'opacity .3s';
  }, 2600);
  setTimeout(() => el.remove(), 3000);
}
