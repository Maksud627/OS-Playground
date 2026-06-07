import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'sync';
const THINKING = 0, HUNGRY = 1, EATING = 2;
const STATE_LABEL = ['Thinking 💭', 'Hungry 😋', 'Eating 🍝'];
const STATE_COLOR = ['#475569', '#f59e0b', '#22c55e'];

let n = 5, states = [], semaphore = true, timers = [], logs = [], running = false;
function persistSync() { saveState(KEY, { n, semaphore }); }

export function renderSync(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(245,158,11,.15)">🍝</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#fbbf24">Process Synchronization</h1>
        <p class="module-subtitle">The Dining Philosophers problem. Watch philosophers compete for chopsticks. Trigger a deadlock, then enable the semaphore solution.</p>
      </div>
      <button class="btn btn-secondary" id="sync-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Configuration</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Philosophers: <strong id="sync-n-val">5</strong></label>
              <input class="form-range" id="sync-n" type="range" min="3" max="7" value="5">
            </div>
            <div style="margin-bottom:16px">
              <div class="toggle-wrap" id="sync-sem-toggle">
                <div class="toggle on" id="sync-sem-tog"></div>
                <span style="font-size:14px;color:var(--text-secondary)">Semaphore Solution</span>
              </div>
              <p style="font-size:12px;color:var(--text-muted);margin-top:6px">When OFF: all philosophers pick up left chopstick simultaneously → deadlock!</p>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-sync" id="sync-start-btn" style="flex:1">▶ Start</button>
              <button class="btn btn-secondary" id="sync-stop-btn">■ Stop</button>
              <button class="btn btn-secondary btn-sm" id="sync-deadlock-btn" title="Force deadlock scenario">💀 Deadlock</button>
            </div>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Philosopher States</span></div>
          <div id="sync-state-table" style="padding:12px"></div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Event Log</span>
            <button class="btn btn-secondary btn-sm" id="sync-clear-log">Clear</button>
          </div>
          <div class="log-area" id="sync-log"></div>
        </div>
      </div>

      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Table Visualization</span></div>
          <div style="padding:24px;display:flex;justify-content:center;align-items:center">
            <canvas id="sync-canvas" width="400" height="400" style="max-width:100%"></canvas>
          </div>
        </div>

        <div class="concept-box sync">
          <h4>📚 Semaphore Solution</h4>
          <p>With semaphores: use a mutex (room semaphore) that only allows N-1 philosophers in at once. This breaks the "circular wait" condition — one philosopher is always blocked from entering, so a cycle can never form. Alternatively: odd philosophers pick left first, even pick right.</p>
        </div>
      </div>
    </div>
  </div>`;

  n = 5; states = []; logs = []; timers = []; running = false;
  semaphore = true;
  initSync();
}

function initSync() {
  states = new Array(n).fill(THINKING);

  document.getElementById('sync-n').addEventListener('input', (e) => {
    stopAll();
    n = parseInt(e.target.value);
    document.getElementById('sync-n-val').textContent = n;
    states = new Array(n).fill(THINKING);
    renderStateTable();
    drawCanvas();
  });

  const semTog = document.getElementById('sync-sem-tog');
  document.getElementById('sync-sem-toggle').addEventListener('click', () => {
    semaphore = !semaphore;
    semTog.className = `toggle ${semaphore ? 'on' : ''}`;
    showToast(semaphore ? 'Semaphore ON — Safe mode' : 'Semaphore OFF — Deadlock possible!', semaphore ? 'success' : 'warning');
  });

  document.getElementById('sync-start-btn').addEventListener('click', startSimulation);
  document.getElementById('sync-stop-btn').addEventListener('click', () => { stopAll(); showToast('Simulation stopped', 'info'); });
  document.getElementById('sync-deadlock-btn').addEventListener('click', forceDeadlock);
  document.getElementById('sync-clear-log').addEventListener('click', () => { logs = []; renderLog(); });
  document.getElementById('sync-guide-btn').addEventListener('click', () => openGuide('sync'));

  renderStateTable();
  drawCanvas();
}

function stopAll() {
  running = false;
  timers.forEach(clearTimeout);
  timers = [];
  states = new Array(n).fill(THINKING);
  renderStateTable();
  drawCanvas();
}

function addLog(msg, type = 'info') {
  const time = new Date().toLocaleTimeString('en',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
  logs.unshift({ time, msg, type });
  if (logs.length > 40) logs.pop();
  renderLog();
}

function renderLog() {
  const el = document.getElementById('sync-log');
  if (!el) return;
  el.innerHTML = logs.map(l => `<div class="log-entry ${l.type}"><span class="log-time">${l.time}</span><span class="log-msg">${l.msg}</span></div>`).join('');
}

function renderStateTable() {
  const el = document.getElementById('sync-state-table');
  if (!el) return;
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>Philosopher</th><th>State</th><th>Chopsticks</th></tr></thead>
    <tbody>${states.map((s, i) => {
      const left = i, right = (i + 1) % n;
      const hasLeft = s === EATING, hasRight = s === EATING;
      return `<tr>
        <td><span style="color:#fbbf24;font-weight:700">P${i}</span></td>
        <td><span style="color:${STATE_COLOR[s]};font-weight:600">${STATE_LABEL[s]}</span></td>
        <td style="font-family:var(--font-mono);font-size:12px">${s===EATING?`C${left}, C${right}`:'—'}</td>
      </tr>`;
    }).join('')}
    </tbody></table>`;
}

function drawCanvas() {
  const canvas = document.getElementById('sync-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, R = Math.min(W,H)*0.38;
  ctx.clearRect(0, 0, W, H);

  // Table
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R*0.35, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(245,158,11,0.08)'; ctx.fill();
  ctx.strokeStyle = 'rgba(245,158,11,0.3)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  // Chopsticks
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI/2 + Math.PI/n;
    const x1 = cx + (R*0.45)*Math.cos(angle), y1 = cy + (R*0.45)*Math.sin(angle);
    const x2 = cx + (R*0.62)*Math.cos(angle), y2 = cy + (R*0.62)*Math.sin(angle);
    const eating = states[i]===EATING || states[(i+n-1)%n]===EATING;
    ctx.save();
    ctx.strokeStyle = eating ? '#f59e0b' : '#334155';
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  // Philosophers
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI/2;
    const px = cx + R*Math.cos(angle), py = cy + R*Math.sin(angle);
    const s = states[i];
    const color = STATE_COLOR[s];

    ctx.save();
    ctx.beginPath(); ctx.arc(px, py, 26, 0, Math.PI*2);
    ctx.fillStyle = color + '22'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.font = s === EATING ? 'bold 18px Inter' : '16px Inter';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(s === EATING ? '🍝' : s === HUNGRY ? '😋' : '💭', px, py);

    ctx.font = 'bold 11px Inter';
    ctx.fillStyle = color;
    ctx.fillText(`P${i}`, px, py + 36);
    ctx.restore();
  }
}

function tryEat(i) {
  if (!running) return;
  const left = i, right = (i + 1) % n;

  if (semaphore) {
    // Check both chopsticks available (neighbors not eating)
    const leftFree = states[(i + n - 1) % n] !== EATING;
    const rightFree = states[(i + 1) % n] !== EATING;
    if (leftFree && rightFree && states[i] === HUNGRY) {
      states[i] = EATING;
      addLog(`P${i} picks up chopsticks C${left} & C${right} → EATING 🍝`, 'success');
      renderStateTable(); drawCanvas();
      timers.push(setTimeout(() => putDown(i), 2000 + Math.random() * 2000));
    } else {
      timers.push(setTimeout(() => tryEat(i), 500 + Math.random() * 500));
    }
  } else {
    // No semaphore: just eat if neighbors aren't eating
    if (states[(i+n-1)%n] !== EATING && states[(i+1)%n] !== EATING && states[i] === HUNGRY) {
      states[i] = EATING;
      renderStateTable(); drawCanvas();
      timers.push(setTimeout(() => putDown(i), 1500 + Math.random() * 1500));
    }
  }
}

function putDown(i) {
  if (!running) return;
  states[i] = THINKING;
  addLog(`P${i} finishes eating, now THINKING 💭`, 'info');
  renderStateTable(); drawCanvas();
  timers.push(setTimeout(() => becomeHungry(i), 1000 + Math.random() * 2000));
}

function becomeHungry(i) {
  if (!running) return;
  states[i] = HUNGRY;
  addLog(`P${i} is HUNGRY 😋, wants chopsticks`, 'warning');
  renderStateTable(); drawCanvas();
  tryEat(i);
}

function startSimulation() {
  stopAll();
  running = true;
  logs = [];
  states = new Array(n).fill(THINKING);
  addLog('Simulation started!', 'info');
  for (let i = 0; i < n; i++) {
    const delay = Math.random() * 1500;
    timers.push(setTimeout(() => becomeHungry(i), delay));
  }
}

function forceDeadlock() {
  stopAll();
  running = true;
  semaphore = false;
  document.getElementById('sync-sem-tog').className = 'toggle';
  states = new Array(n).fill(HUNGRY);
  renderStateTable(); drawCanvas();
  addLog('⚠️ DEADLOCK FORCED: All philosophers hungry, each waiting for left chopstick!', 'danger');
  addLog('Circular wait: P0→C1→P1→C2→P2→...→C0→P0', 'danger');
  showToast('💀 Deadlock! All philosophers waiting indefinitely.', 'error', 5000);
}
