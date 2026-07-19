/* ── THEME TOGGLE ────────────────────────────────────────────────────────── */
const html = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const savedTheme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
html.setAttribute('data-theme', savedTheme);

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

/* ── SCROLL PROGRESS + SCROLL HINT FADE ──────────────────────────────────── */
const progressBar = document.getElementById('scroll-progress');
const scrollHint  = document.getElementById('scroll-hint');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  if (progressBar) progressBar.style.width = pct + '%';
  if (scrollHint) scrollHint.style.opacity = Math.max(0, 1 - window.scrollY / 200);
}, { passive: true });

/* ── NAV — scroll shadow + active link ──────────────────────────────────── */
const header   = document.getElementById('site-header');
const navLinks = document.querySelectorAll('.nav__link');
const sections = document.querySelectorAll('main section[id]');

function updateNav() {
  if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 90) current = s.id; });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ── MOBILE NAV ──────────────────────────────────────────────────────────── */
const navToggle = document.getElementById('nav-toggle');
const navList   = document.getElementById('nav-links');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navList.classList.toggle('open', !open);
  });

  navList.addEventListener('click', e => {
    if (e.target.classList.contains('nav__link')) {
      navToggle.setAttribute('aria-expanded', 'false');
      navList.classList.remove('open');
    }
  });

  document.addEventListener('click', e => {
    if (header && !header.contains(e.target)) {
      navToggle.setAttribute('aria-expanded', 'false');
      navList.classList.remove('open');
    }
  });
}

/* ── SCROLL ANIMATIONS ───────────────────────────────────────────────────── */
const fadeEls = document.querySelectorAll('.fade-up:not(.hero .fade-up)');
fadeEls.forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
});
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
fadeEls.forEach(el => fadeObserver.observe(el));

/* ── COUNTER ANIMATION ───────────────────────────────────────────────────── */
function animateCounter(el, target, duration = 1400) {
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count, 10));
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero__stats');
if (statsEl) statsObserver.observe(statsEl);

/* ── SKILL BAR ANIMATION ─────────────────────────────────────────────────── */
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.skills-list__item[data-skill]').forEach(item => {
        const fill = item.querySelector('.skills-list__fill');
        if (fill) fill.style.width = item.dataset.skill + '%';
      });
      skillObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });

const skillsList = document.querySelector('.skills-list');
if (skillsList) skillObserver.observe(skillsList);

/* ── CARD GLOW (mouse tracking) ──────────────────────────────────────────── */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    if (!prefersReducedMotion.matches) {
      const rotateY = ((x / rect.width) - 0.5) * 4;
      const rotateX = (0.5 - (y / rect.height)) * 4;
      card.style.setProperty('--card-tilt-x', `${rotateX.toFixed(2)}deg`);
      card.style.setProperty('--card-tilt-y', `${rotateY.toFixed(2)}deg`);
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.setProperty('--card-tilt-x', '0deg');
    card.style.setProperty('--card-tilt-y', '0deg');
  });
});

/* ── CONTACT FORM ────────────────────────────────────────────────────────── */
const form      = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const successEl = document.getElementById('form-success');

const validators = {
  name:    v => v.trim().length >= 2  ? '' : 'Please enter your full name.',
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
  message: v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.',
};

function validateField(name, value) {
  const input = document.getElementById(name);
  const error = document.getElementById(name + '-error');
  const msg   = validators[name](value);
  input.classList.toggle('has-error', !!msg);
  error.textContent = msg;
  return !msg;
}

['name', 'email', 'message'].forEach(f => {
  const input = document.getElementById(f);
  if (!input) return;
  input.addEventListener('blur',  () => validateField(f, input.value));
  input.addEventListener('input', () => { if (input.classList.contains('has-error')) validateField(f, input.value); });
});

if (form && submitBtn && successEl) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const ok = ['name', 'email', 'message']
      .map(f => {
        const el = document.getElementById(f);
        return el ? validateField(f, el.value) : true;
      })
      .every(Boolean);
    if (!ok) return;
    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;
    await new Promise(r => setTimeout(r, 1200)); // replace with real endpoint
    submitBtn.classList.remove('btn--loading');
    submitBtn.disabled = false;
    successEl.classList.add('visible');
    form.reset();
    setTimeout(() => successEl.classList.remove('visible'), 6000);
  });
}

/* ── FOOTER YEAR ─────────────────────────────────────────────────────────── */
const footerYear = document.getElementById('footer-year');
if (footerYear) footerYear.textContent = new Date().getFullYear();
