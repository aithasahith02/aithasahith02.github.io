// fx add-on: optional motion details layered on top of main.js.
// Remove this file and assets/css/fx.css to switch everything off.

const root = document.documentElement;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const active = () => !root.classList.contains('no-fx');
const clamp = (v, m) => Math.max(-m, Math.min(m, v));
const esc = (t) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Section headings: wrap each word so it can rise into view. */
$$('.sec-head h2').forEach(h => {
  const text = h.textContent.trim();
  h.setAttribute('aria-label', text);
  h.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${esc(w)}</span></span>`).join(' ');
});

/* Highlight numbers count up the first time they appear. */
if (!reduce && 'IntersectionObserver' in window) {
  const nums = $$('.facts strong').filter(el => /^\d+$/.test(el.textContent.trim()));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    if (!active()) return;
    const el = e.target, end = +el.textContent, t0 = performance.now(), dur = 1100;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  nums.forEach(n => io.observe(n));
}

if (!reduce) {
  /* Water ripple from the press point. */
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.btn, .menu-btn, .icon-btn');
    if (!el || !active()) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const dot = document.createElement('span');
    dot.className = 'fx-ripple';
    Object.assign(dot.style, { width: `${size}px`, height: `${size}px`, left: `${e.clientX - r.left - size / 2}px`, top: `${e.clientY - r.top - size / 2}px` });
    el.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  });
}

if (!reduce && fine) {
  /* Magnetic buttons: they lean a few pixels toward the cursor. */
  $$('.btn, .menu-btn, .icon-btn').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (!active()) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.translate = `${clamp(dx * 0.2, 6)}px ${clamp(dy * 0.3, 5)}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });

  /* Cards tilt slightly toward the pointer and catch a glare. */
  $$('.project, a.cert').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (!active()) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${((x - 0.5) * 6).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - y) * 5).toFixed(2)}deg`);
      card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });

  /* The blob drifts gently with the pointer, like liquid catching up. */
  const hero = document.querySelector('.hero'), blob = document.querySelector('.blob');
  if (hero && blob) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      blob.style.setProperty('--bx', `${((e.clientX - r.left) / r.width - 0.5) * 24}px`);
      blob.style.setProperty('--by', `${((e.clientY - r.top) / r.height - 0.5) * 18}px`);
    });
  }
}
