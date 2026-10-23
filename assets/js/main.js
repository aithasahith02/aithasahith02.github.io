// sahithaitha.com · progressive enhancement only. The page is fully readable without this file.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- small helpers ---------- */
function onFrame(fn) {
  let queued = false;
  return (...args) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(...args); });
  };
}

/* ---------- theme ---------- */
function initTheme() {
  const btn = $('#themeBtn');
  const root = document.documentElement;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label = () => btn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  label();
  btn.addEventListener('click', () => {
    const swap = () => {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* storage blocked: theme lasts for this visit */ }
      label();
    };
    // With the fx add-on, the new theme spreads out from the button as a circle.
    const fxOn = getComputedStyle(root).getPropertyValue('--fx').trim() === '1' && !root.classList.contains('no-fx');
    if (fxOn && document.startViewTransition && !reduceMotion.matches) {
      const r = btn.getBoundingClientRect();
      root.style.setProperty('--vt-x', `${r.left + r.width / 2}px`);
      root.style.setProperty('--vt-y', `${r.top + r.height / 2}px`);
      document.startViewTransition(swap);
    } else {
      swap();
    }
  });
}

/* ---------- top bar, progress bar, current section ---------- */
function initScrollState() {
  const bar = $('#topbar');
  const progress = $('#progress');
  const timeline = $('.timeline');
  let lastY = scrollY;

  const update = onFrame(() => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    bar.classList.toggle('is-scrolled', y > 24);
    // Hide the bar while reading downward, bring it back on any upward scroll.
    const menuOpen = $('#menu').open;
    bar.classList.toggle('is-hidden', !menuOpen && y > innerHeight * 0.8 && y > lastY + 4);
    if (y < lastY - 4 || y < innerHeight * 0.8) bar.classList.remove('is-hidden');
    lastY = y;

    if (timeline && !reduceMotion.matches) {
      const r = timeline.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
      timeline.style.setProperty('--tl', t.toFixed(3));
    }
  });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  // Current section → top bar label + aria-current in the menu.
  const num = $('#whereNum'), name = $('#whereName');
  const sections = $$('main section[id]');
  const links = $$('.menu-nav a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const i = sections.indexOf(e.target);
      num.textContent = String(i + 1).padStart(2, '0');
      name.textContent = e.target.dataset.name;
      links.forEach((a, j) => a.setAttribute('aria-current', String(j === i)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => io.observe(s));
}

/* ---------- full-screen menu ---------- */
function initMenu() {
  const menu = $('#menu');
  const openBtn = $('#menuBtn');
  $$('.menu-nav li').forEach((li, i) => li.style.setProperty('--i', i));

  const open = () => {
    menu.classList.remove('is-closing');
    menu.showModal();
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = (then) => {
    if (!menu.open) return;
    const done = () => {
      menu.classList.remove('is-closing');
      menu.close();
      document.body.style.overflow = '';
      openBtn.setAttribute('aria-expanded', 'false');
      then?.();
    };
    if (reduceMotion.matches) return done();
    menu.classList.add('is-closing');
    menu.addEventListener('animationend', done, { once: true });
  };

  openBtn.setAttribute('aria-expanded', 'false');
  openBtn.addEventListener('click', open);
  $('#menuClose').addEventListener('click', () => close(() => openBtn.focus()));
  menu.addEventListener('cancel', e => { e.preventDefault(); close(() => openBtn.focus()); });
  $$('.menu-nav a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const target = $(a.getAttribute('href'));
    close(() => {
      target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', a.getAttribute('href'));
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }));
}

/* ---------- hero: rotating phrase, wires to tool chips, pointer spotlight ---------- */
function initHero() {
  const track = $('#rot');
  if (track) {
    const rotator = track.parentElement;
    const words = [...track.children];
    const fit = (i) => { rotator.style.width = `${words[i].getBoundingClientRect().width}px`; };
    // Size the window to the visible word so the sentence reads without a gap.
    words.forEach(w => { w.style.width = 'max-content'; });
    fit(0);
    document.fonts?.ready.then(() => fit(0));
    if (!reduceMotion.matches) {
      const n = words.length - 1; // last item duplicates the first for a seamless loop
      let i = 0;
      setInterval(() => {
        if (document.hidden) return;
        i += 1;
        track.style.transition = '';
        track.style.transform = `translateY(-${i * 1.45}em)`;
        fit(i);
        if (i === n) {
          setTimeout(() => { track.style.transition = 'none'; track.style.transform = 'translateY(0)'; i = 0; }, 650);
        }
      }, 2600);
    }
  }

  const hero = $('.hero');
  if (hero && finePointer.matches && !reduceMotion.matches) {
    hero.addEventListener('pointermove', onFrame(e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
      hero.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }
}

/* ---------- reveal on scroll ---------- */
function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  // Stagger siblings that share a parent, so grids cascade in.
  items.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--rd', `${Math.min(sibs.indexOf(el), 5) * 70}ms`);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(el => io.observe(el));
  // Anything already above the fold (or jumped past via an anchor) shows at once.
  addEventListener('load', () => items.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); }), { once: true });
}

/* ---------- contact form (Web3Forms) ---------- */
function initContact() {
  const form = $('#contactForm');
  if (!form) return;
  const status = $('#formStatus');
  const btn = $('.btn-send', form);
  const msg = $('#f-message');
  const count = $('#count');
  const EMAIL = 'aithasahith0214@gmail.com';

  msg.addEventListener('input', () => { count.textContent = `${msg.value.length} / 1000`; });

  const rules = {
    name: v => v.trim().length >= 2 || 'Please enter your name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    phone: v => !v.trim() || /^[0-9+()\-.\s]{7,30}$/.test(v.trim()) || 'Use digits, spaces and + ( ) - only.',
    message: v => v.trim().length >= 10 || 'Please write at least 10 characters.'
  };
  const check = (field) => {
    const res = rules[field.name](field.value);
    const err = $(`#e-${field.name}`);
    const ok = res === true;
    field.setAttribute('aria-invalid', String(!ok));
    field.setAttribute('aria-describedby', `e-${field.name}`);
    err.textContent = ok ? '' : res;
    return ok;
  };
  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    field.addEventListener('blur', () => { if (field.value) check(field); });
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') check(field); });
  });

  const setStatus = (text, kind) => { status.className = `form-status ${kind || ''}`; status.innerHTML = text; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = Object.keys(rules).map(n => form.elements[n]);
    const valid = fields.map(check).every(Boolean);
    if (!valid) { fields.find(f => f.getAttribute('aria-invalid') === 'true')?.focus(); return; }
    if (form.elements.botcheck.checked) return; // bot filled the honeypot

    const key = form.dataset.accessKey;
    if (!key || key.startsWith('YOUR_')) {
      setStatus(`The form isn't connected yet. Please email me at <a href="mailto:${EMAIL}">${EMAIL}</a>.`, 'bad');
      return;
    }

    btn.disabled = true;
    btn.classList.add('is-sending');
    $('.send-label', btn).textContent = 'Sending…';
    setStatus('');
    try {
      const data = Object.fromEntries(new FormData(form));
      delete data.botcheck;
      data.access_key = key;
      data.replyto = data.email;
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
      form.reset();
      count.textContent = '0 / 1000';
      setStatus('Thanks! Your message is on its way, and I\'ll reply by email.', 'ok');
    } catch (err) {
      setStatus(`Your message couldn't be sent. Please try again, or email me at <a href="mailto:${EMAIL}">${EMAIL}</a>.`, 'bad');
    } finally {
      btn.disabled = false;
      btn.classList.remove('is-sending');
      $('.send-label', btn).textContent = 'Send message';
    }
  });
}

/* ---------- boot ---------- */
$('#year').textContent = new Date().getFullYear();
initTheme();
initScrollState();
initMenu();
initHero();
initReveal();
initContact();
