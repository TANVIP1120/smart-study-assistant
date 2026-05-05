/**
 * chart.js — SVG donut chart for priority distribution.
 * Pure function: receives data, writes into #donut SVG element.
 */

const SEGMENTS = [
  { key: 'high', colour: '#ef4444' },
  { key: 'med',  colour: '#f59e0b' },
  { key: 'low',  colour: '#10b981' },
];

const CX   = 60;
const CY   = 60;
const R    = 40;
const CIRC = 2 * Math.PI * R;

/**
 * Redraw the donut chart.
 * @param {{ high: number, med: number, low: number }} counts
 * @param {number} total — sum of active (non-done) tasks
 */
export function drawDonut(counts, total) {
  const svg = document.getElementById('donut');

  if (!total) {
    svg.innerHTML = `
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
              stroke="rgba(255,255,255,.05)" stroke-width="20"/>
      <text x="${CX}" y="${CY + 5}" text-anchor="middle"
            fill="#a7a9be" font-size="11">No tasks</text>`;
    return;
  }

  let html = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
    stroke="rgba(255,255,255,.05)" stroke-width="20"/>`;

  let cumulative = 0;

  SEGMENTS.forEach(({ key, colour }) => {
    const n = counts[key];
    if (!n) return;

    const len = (n / total) * CIRC;

    // Each circle uses stroke-dasharray to show only its arc segment,
    // offset by the sum of previous segments.
    html += `
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
              stroke="${colour}" stroke-width="20" opacity=".88"
              stroke-dasharray="${len} ${CIRC}"
              stroke-dashoffset="${-cumulative}"
              transform="rotate(-90 ${CX} ${CY})"/>`;

    cumulative += len;
  });

  // Inner cutout with totals
  html += `<circle cx="${CX}" cy="${CY}" r="26" fill="var(--sur2)"/>`;
  html += `<text x="${CX}" y="${CY - 4}"  text-anchor="middle"
                 fill="white" font-size="15" font-weight="800">${total}</text>`;
  html += `<text x="${CX}" y="${CY + 9}"  text-anchor="middle"
                 fill="#a7a9be" font-size="8.5">ACTIVE</text>`;

  svg.innerHTML = html;
}
