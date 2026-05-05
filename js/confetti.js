/**
 * confetti.js — canvas-based particle celebration animation.
 * Triggered when the user marks a task as complete.
 */

const COLOURS = [
  '#7c3aed', '#a855f7', '#ef4444', '#f59e0b',
  '#10b981', '#3b82f6', '#ec4899', '#facc15',
];

const PARTICLE_COUNT = 150;
const FRAME_COUNT    = 160; // ~2.6 s at 60 fps

/** Launch a confetti burst from the top of the viewport. */
export function confetti() {
  const canvas  = document.getElementById('cfx');
  canvas.width  = innerWidth;
  canvas.height = innerHeight;
  const ctx = canvas.getContext('2d');

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x:  Math.random() * canvas.width,
    y:  -10 - Math.random() * 60,
    vx: (Math.random() - .5) * 7,
    vy: Math.random() * 3 + 2,
    w:  Math.random() * 11 + 5,
    h:  Math.random() * 6 + 3,
    r:  Math.random() * 360,
    rv: (Math.random() - .5) * 9,
    c:  COLOURS[Math.floor(Math.random() * COLOURS.length)],
  }));

  let frame = 0;

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const alpha = Math.max(0, 1 - frame / FRAME_COUNT);

    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.1;  // gravity
      p.r  += p.rv;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r * Math.PI / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    frame++;

    if (frame < FRAME_COUNT) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  })();
}
