/* ─────────────────────────────────────────────
   StopWatch — Modern JS
   Features:
   • Centisecond (10ms) precision via requestAnimationFrame
   • Start / Pause / Reset
   • Lap recording with split & total times
   • Best / worst lap highlighting
   • Animated SVG ring (60-second cycle)
   • Keyboard shortcuts: Space, L, R
   • sessionStorage persistence (resume after reload)
───────────────────────────────────────────── */

// ── DOM refs ──────────────────────────────────
const timeMainEl   = document.getElementById('time-main');
const timeMsEl     = document.getElementById('time-ms');
const ringFill     = document.getElementById('ring-fill');
const statusBadge  = document.getElementById('status-badge');
const btnStart     = document.getElementById('btn-start');
const btnLap       = document.getElementById('btn-lap');
const btnReset     = document.getElementById('btn-reset');
const btnStartLabel= document.getElementById('btn-start-label');
const iconPlay     = btnStart.querySelector('.icon-play');
const iconPause    = btnStart.querySelector('.icon-pause');
const lapsSection  = document.getElementById('laps-section');
const lapsList     = document.getElementById('laps-list');
const btnClearLaps = document.getElementById('btn-clear-laps');
const appEl        = document.querySelector('.app');

// ── State ─────────────────────────────────────
const RING_CIRCUMFERENCE = 2 * Math.PI * 100; // r=100
let running     = false;
let startTime   = null;   // performance.now() snapshot when started
let elapsed     = 0;      // total ms accumulated before last start
let rafId       = null;
let laps        = [];     // [{total: ms, split: ms}]
let lastLapTotal = 0;

// ── Restore session ───────────────────────────
restoreSession();

// ── Animation loop ────────────────────────────
function tick() {
  const now     = performance.now();
  const total   = elapsed + (now - startTime);
  render(total);
  rafId = requestAnimationFrame(tick);
}

function render(ms) {
  const totalCs  = Math.floor(ms / 10);      // centiseconds
  const cs       = totalCs % 100;
  const totalSec = Math.floor(ms / 1000);
  const secs     = totalSec % 60;
  const mins     = Math.floor(totalSec / 60) % 60;
  const hrs      = Math.floor(totalSec / 3600);

  // Main display — show hours only when needed
  if (hrs > 0) {
    timeMainEl.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  } else {
    timeMainEl.textContent = `${pad(mins)}:${pad(secs)}`;
  }

  timeMsEl.textContent = pad(cs);

  // Ring — full revolution every 60 seconds
  const progress     = (totalSec % 60) / 60;
  const dashOffset   = RING_CIRCUMFERENCE * (1 - progress);
  ringFill.style.strokeDashoffset = dashOffset;
}

// ── Controls ──────────────────────────────────
function startWatch() {
  if (running) return;
  running   = true;
  startTime = performance.now();
  rafId     = requestAnimationFrame(tick);

  setRunningState(true);
  saveSession();
}

function pauseWatch() {
  if (!running) return;
  running  = false;
  elapsed += performance.now() - startTime;
  cancelAnimationFrame(rafId);
  rafId    = null;

  setRunningState(false);
  saveSession();
}

function resetWatch() {
  pauseWatch();
  elapsed      = 0;
  lastLapTotal = 0;
  laps         = [];
  running      = false;
  startTime    = null;

  // Render zero state
  timeMainEl.textContent = '00:00';
  timeMsEl.textContent   = '00';
  ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE;

  setIdleState();
  clearLapUI();
  clearSession();
}

function recordLap() {
  if (!running) return;

  const now    = performance.now();
  const total  = elapsed + (now - startTime);
  const split  = total - lastLapTotal;
  lastLapTotal = total;

  laps.push({ total, split });
  renderLaps();
  saveSession();
}

// ── State helpers ─────────────────────────────
function setRunningState(isRunning) {
  appEl.classList.toggle('is-running', isRunning);

  if (isRunning) {
    btnStartLabel.textContent = 'Pause';
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    statusBadge.textContent = 'Running';
    statusBadge.className   = 'status-badge running';
    btnLap.disabled         = false;
    ringFill.classList.remove('stopped');
  } else {
    btnStartLabel.textContent = elapsed > 0 ? 'Resume' : 'Start';
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    statusBadge.textContent = elapsed > 0 ? 'Paused' : 'Idle';
    statusBadge.className   = elapsed > 0 ? 'status-badge paused' : 'status-badge';
    btnLap.disabled         = true;
    ringFill.classList.add('stopped');
  }
}

function setIdleState() {
  btnStartLabel.textContent = 'Start';
  iconPlay.classList.remove('hidden');
  iconPause.classList.add('hidden');
  statusBadge.textContent = 'Idle';
  statusBadge.className   = 'status-badge';
  btnLap.disabled         = true;
  ringFill.classList.remove('stopped');
}

// ── Lap rendering ─────────────────────────────
function renderLaps() {
  if (laps.length === 0) {
    clearLapUI();
    return;
  }

  lapsSection.hidden = false;
  lapsList.innerHTML = '';

  // Find best and worst split times
  const splits = laps.map(l => l.split);
  const best   = Math.min(...splits);
  const worst  = Math.max(...splits);

  // Render newest-first (reversed attribute on <ol>)
  laps.forEach((lap, i) => {
    const li = document.createElement('li');
    li.className = 'lap-item';
    if (laps.length > 1) {
      if (lap.split === best)  li.classList.add('best');
      if (lap.split === worst) li.classList.add('worst');
    }

    li.innerHTML = `
      <span class="lap-number">#${i + 1}</span>
      <span class="lap-split">+${formatMs(lap.split)}</span>
      <span class="lap-total">${formatMs(lap.total)}</span>
    `;
    lapsList.prepend(li);

    // trigger animation
    requestAnimationFrame(() => li.style.opacity = '');
  });
}

function clearLapUI() {
  lapsList.innerHTML = '';
  lapsSection.hidden = true;
}

// ── Keyboard shortcuts ────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      running ? pauseWatch() : startWatch();
      break;
    case 'KeyL':
      if (!btnLap.disabled) recordLap();
      break;
    case 'KeyR':
      resetWatch();
      break;
  }
});

// ── Button events ─────────────────────────────
btnStart.addEventListener('click', () => {
  running ? pauseWatch() : startWatch();
});

btnLap.addEventListener('click', recordLap);

btnReset.addEventListener('click', resetWatch);

btnClearLaps.addEventListener('click', () => {
  laps = [];
  lastLapTotal = 0;
  clearLapUI();
  saveSession();
});

// ── Helpers ───────────────────────────────────
function pad(n) {
  return String(n).padStart(2, '0');
}

function formatMs(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs      = totalCs % 100;
  const totalSec = Math.floor(ms / 1000);
  const secs    = totalSec % 60;
  const mins    = Math.floor(totalSec / 60) % 60;
  const hrs     = Math.floor(totalSec / 3600);

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(cs)}`;
  }
  return `${pad(mins)}:${pad(secs)}.${pad(cs)}`;
}

// ── Session persistence (sessionStorage) ──────
function saveSession() {
  const state = {
    elapsed,
    running,
    laps,
    lastLapTotal,
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem('sw_state', JSON.stringify(state));
  } catch (_) {}
}

function clearSession() {
  try { sessionStorage.removeItem('sw_state'); } catch (_) {}
}

function restoreSession() {
  try {
    const raw = sessionStorage.getItem('sw_state');
    if (!raw) return;

    const state = JSON.parse(raw);
    elapsed      = state.elapsed      || 0;
    laps         = state.laps         || [];
    lastLapTotal = state.lastLapTotal || 0;

    // Render restored time (paused state)
    render(elapsed);
    ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE;

    if (laps.length > 0) renderLaps();

    // If it was running, resume paused (don't auto-start)
    if (state.running && elapsed > 0) {
      setRunningState(false); // mark as paused
      btnStartLabel.textContent   = 'Resume';
      statusBadge.textContent = 'Paused';
      statusBadge.className   = 'status-badge paused';
    }
  } catch (_) {
    clearSession();
  }
}

// ── Init ring ─────────────────────────────────
ringFill.style.strokeDasharray  = RING_CIRCUMFERENCE;
ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE;