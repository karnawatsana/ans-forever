/* ==========================================================================
   Anvu's New Adventure — countdown + daily unlock logic
   ========================================================================== */

// The big day: when Anvu moves to SF
const DEPARTURE = new Date(2026, 5, 25, 0, 0, 0); // June 25, 2026 (months are 0-indexed)

// Each year's page unlocks the day before/of: 2017 -> June 17, 2018 -> June 18 ... 2026 -> June 26
function unlockDateFor(year) {
  const offset = year - 2017; // 0..9
  return new Date(2026, 5, 17 + offset, 0, 0, 0);
}

// Add ?preview=true to the URL to unlock every year early (handy while building this!)
function previewMode() {
  return new URLSearchParams(window.location.search).get('preview') === 'true';
}

function isUnlocked(year) {
  if (previewMode()) return true;
  return new Date() >= unlockDateFor(year);
}

function formatUnlockDate(year) {
  return unlockDateFor(year).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/* --------------------------------------------------------------------
   Countdown (used on index.html)
   -------------------------------------------------------------------- */
function startCountdown() {
  const dayEl = document.getElementById('cd-days');
  const hourEl = document.getElementById('cd-hours');
  const minEl = document.getElementById('cd-mins');
  const secEl = document.getElementById('cd-secs');
  const statusEl = document.getElementById('cd-status');

  if (!dayEl) return;

  function tick() {
    const now = new Date();
    const diff = DEPARTURE - now;

    if (diff <= 0) {
      dayEl.textContent = '00';
      hourEl.textContent = '00';
      minEl.textContent = '00';
      secEl.textContent = '00';
      if (statusEl) statusEl.textContent = 'Wheels up — go get \'em, SF \uD83C\uDF09';
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    dayEl.textContent = String(days).padStart(2, '0');
    hourEl.textContent = String(hours).padStart(2, '0');
    minEl.textContent = String(mins).padStart(2, '0');
    secEl.textContent = String(secs).padStart(2, '0');

    requestAnimationFrame(() => setTimeout(tick, 1000));
  }

  tick();
}

/* --------------------------------------------------------------------
   Timeline passes (used on index.html)
   -------------------------------------------------------------------- */
function setupTimeline() {
  const passes = document.querySelectorAll('.pass[data-year]');
  const today = new Date();

  passes.forEach((pass) => {
    const year = parseInt(pass.dataset.year, 10);
    const unlocked = isUnlocked(year);
    const unlockDate = unlockDateFor(year);
    const metaEl = pass.querySelector('.pass__meta');

    if (unlocked) {
      pass.classList.add('is-unlocked');
      const suffix = previewMode() ? '?preview=true' : '';
      pass.setAttribute('href', `years/${year}.html${suffix}`);
      if (metaEl) metaEl.innerHTML = 'Open it &rarr;';

      // Highlight if it unlocked today
      const isSameDay = today.toDateString() === unlockDate.toDateString();
      if (isSameDay) pass.classList.add('is-today');
    } else {
      pass.classList.add('is-locked');
      pass.removeAttribute('href');
      pass.setAttribute('role', 'group');
      pass.setAttribute('aria-disabled', 'true');
      if (metaEl) {
        metaEl.innerHTML = `
          <span class="pass__lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Opens ${formatUnlockDate(year)}
          </span>`;
      }
    }
  });
}

/* --------------------------------------------------------------------
   Year page guard (used on years/*.html)
   -------------------------------------------------------------------- */
function guardYearPage() {
  const body = document.body;
  const year = parseInt(body.dataset.year, 10);
  if (!year) return;

  if (!isUnlocked(year)) {
    const main = document.querySelector('main');
    const suffix = previewMode() ? '?preview=true' : '';
    if (main) {
      main.innerHTML = `
        <div class="hero" style="min-height: 70svh;">
          <p class="hero__eyebrow">Not yet!</p>
          <h1 class="hero__title" style="font-size: clamp(2rem, 8vw, 3.4rem);">${year} is still under wraps</h1>
          <p class="hero__sub">This page unlocks on <strong>${formatUnlockDate(year)}</strong>. Come back then \u2014 or head back to the timeline for now.</p>
          <a class="scroll-cue" href="../index.html${suffix}" style="margin-top: 32px;">
            <span class="scroll-cue__arrow" style="transform: rotate(90deg); animation: none;">&larr;</span>
            Back home
          </a>
        </div>`;
    }
  }
}

/* --------------------------------------------------------------------
   Carry the preview flag across internal links
   -------------------------------------------------------------------- */
function propagatePreview() {
  if (!previewMode()) return;
  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.includes('preview=')) {
      link.setAttribute('href', `${href}?preview=true`);
    }
  });
}

/* --------------------------------------------------------------------
   Scroll reveal for timeline tickets
   -------------------------------------------------------------------- */
function revealTickets() {
  const passes = document.querySelectorAll('.pass');
  if (!passes.length) return;

  if (!('IntersectionObserver' in window)) {
    passes.forEach((p) => p.classList.add('in'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${(i % 4) * 60}ms`;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  passes.forEach((p) => obs.observe(p));
}

document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  setupTimeline();
  guardYearPage();
  propagatePreview();
  revealTickets();
});
