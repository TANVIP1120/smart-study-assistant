/**
 * utils.js — small, stateless DOM/string helpers.
 */

/**
 * Escape a string for safe insertion into innerHTML.
 * @param {string} s
 * @returns {string}
 */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Briefly shake an input element to signal a validation error.
 * @param {string} id — element id
 */
export function shake(id) {
  const el = document.getElementById(id);
  el.style.animation = 'none';
  el.offsetHeight; // force reflow to restart animation
  el.style.animation = 'shake .35s ease';
}
