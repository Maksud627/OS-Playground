import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'race';
let counter = 0, mutexOn = false, running = false, threads = [], interval = null;

function persist() { saveState(KEY, { counter, mutexOn }); }

export function renderRace(container) {
  const saved = loadState(KEY);
  if (saved) { counter = saved.counter || 0; mutexOn = saved.mutexOn !== undefined ? saved.mutexOn : true; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(249,115,22,.15)">🏁</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#f97316">Race Conditions</h1>
        <p class="module-subtitle">See what happens when threads share data without synchronization — then flip the mutex and watch it become deterministic.</p>
      </div>
      <button class="btn btn-secondary" id="race-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Configuration</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Number of Threads: <strong id="race-n-val">2</strong></label>
              <input class="form-range" id="race-n" type="range" min="2" max="6" value="2">
            </div>
            <div class="form-group">
              <label class="form-label">Increments per Thread: <strong id="race-count-val">1000</strong></label>
              <input class="form-range" id="race-count" type="range" min="100" max="10000" step="100" value="1000">
            </div>
            <div class="form-group">
              <label class="form-label">Operation Delay (ms): <strong id="race-delay-val">1</strong></label>
              <input class="form-range" id="race-delay" type="range" min="0" max="50" value="1">
              <span style="font-size:11px;color:var(--text-muted)">Higher delay = more interleaving = more visible corruption</span>
            </div>
            <div style="margin-bottom:16px">
              <div class="toggle-wrap" id="race-mutex-toggle">
                <div class="toggle on" id="race-mutex-tog"></div>
                <span style="font-size:14px;color:var(--text-secondary)">Mutex Protection</span>
              </div>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-primary" id="race-start-btn" style="flex:1;background:#f97316;box-shadow:0 0 20px rgba(249,115,22,.3)">▶ Start Race</button>
              <button class="btn btn-secondary" id="race-reset-btn">↺ Reset</button>
            </div>
          </div>
        </div>

        <div class="concept-box" style="border-left-color:#f97316">
          <h4>📚 What's Happening</h4>
          <p><strong>Without Mutex:</strong> Each thread reads counter → increments → writes back. Threads interleave the read-modify-write, causing lost updates.<br>
          <strong>With Mutex:</strong> Only one thread enters the critical section at a time. The read-modify-write is atomic — no lost updates.</p>
        </div>
      </div>
      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#f97316" id="race-stat-counter">0</div><div class="stat-label">Counter Value</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="race-stat-expected">0</div><div class="stat-label">Expected Value</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#ef4444" id="race-stat-lost">0</div><div class="stat-label">Lost Updates</div></div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Counter Visualization</span></div>
          <div style="padding:24px;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:12px">
            <div style="width:100%;background:var(--bg-surface);border-radius:99px;height:24px;overflow:hidden;border:1px solid var(--border)">
              <div id="race-progress" style="height:100%;width:0%;background:linear-gradient(90deg,#f97316,#ef4444);border-radius:99px;transition:width 0.3s ease"></div>
            </div>
            <div id="race-status" style="font-size:14px;color:var(--text-muted);font-weight:600">Ready</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">Thread Activity</span></div>
          <div id="race-threads" style="padding:12px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">Start a race to see thread activity</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  counter = 0; mutexOn = true; running = false; threads = [];
  document.getElementById('race-mutex-tog').className = 'toggle on';
  bindRace();
}

function bindRace() {
  document.getElementById('race-guide-btn').addEventListener('click', () => openGuide('race'));
  document.getElementById('race-n').addEventListener('input', (e) => { document.getElementById('race-n-val').textContent = e.target.value; });
  document.getElementById('race-count').addEventListener('input', (e) => { document.getElementById('race-count-val').textContent = e.target.value; });
  document.getElementById('race-delay').addEventListener('input', (e) => { document.getElementById('race-delay-val').textContent = e.target.value; });

  document.getElementById('race-mutex-toggle').addEventListener('click', () => {
    mutexOn = !mutexOn;
    document.getElementById('race-mutex-tog').className = `toggle ${mutexOn ? 'on' : ''}`;
  });

  document.getElementById('race-start-btn').addEventListener('click', startRace);
  document.getElementById('race-reset-btn').addEventListener('click', resetRace);
  resetRace();
}

function resetRace() {
  running = false;
  if (interval) clearInterval(interval);
  counter = 0;
  threads = [];
  updateUI();
}

function startRace() {
  resetRace();
  const n = parseInt(document.getElementById('race-n').value) || 2;
  const count = parseInt(document.getElementById('race-count').value) || 1000;
  const delay = parseInt(document.getElementById('race-delay').value) || 1;
  const expected = n * count;
  document.getElementById('race-stat-expected').textContent = expected;

  running = true;
  document.getElementById('race-status').innerHTML = '🏁 <strong>RACING!</strong>';
  document.getElementById('race-status').style.color = f=>mutexOn?'#22c55e':'#ef4444';

  threads = Array.from({ length: n }, (_, i) => ({
    id: `T${i+1}`,
    remaining: count,
    color: `hsl(${i*360/n},70%,55%)`,
    ran: 0
  }));

  renderThreads();

  let critical = false; // mutex lock state

  interval = setInterval(() => {
    if (!running || threads.every(t => t.remaining === 0)) {
      clearInterval(interval);
      running = false;
      const lost = (n * count) - counter;
      document.getElementById('race-stat-lost').textContent = Math.max(0, lost);
      document.getElementById('race-status').innerHTML = lost > 0
        ? `<span style="color:#ef4444">⚠️ Finished — ${lost} lost updates!</span>`
        : '<span style="color:#22c55e">✅ Perfect — no lost updates</span>';
      updateUI();
      if (lost > 0 && !mutexOn) showToast(`Race condition! ${lost} lost updates due to lack of mutex.`, 'error', 5000);
      if (lost === 0 && mutexOn) showToast('Mutex worked! All increments accounted for.', 'success');
      return;
    }

    // Pick random threads to simulate concurrent execution
    const activeIndices = [];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      const idx = Math.floor(Math.random() * threads.length);
      if (!activeIndices.includes(idx) && threads[idx].remaining > 0) activeIndices.push(idx);
    }

    activeIndices.forEach(i => {
      const t = threads[i];
      if (t.remaining <= 0) return;

      if (mutexOn) {
        if (critical) return; // blocked — only 1 in critical section
        critical = true;
        counter++;
        t.remaining--;
        t.ran++;
        critical = false;
      } else {
        // No mutex — simulate read-modify-write with race window
        const readVal = counter;
        setTimeout(() => {
          counter = readVal + 1;
        }, delay * (Math.random() * 2));
        t.remaining--;
        t.ran++;
      }
    });

    updateUI();
    renderThreads();
  }, delay + 5);
}

function updateUI() {
  const n = parseInt(document.getElementById('race-n').value) || 2;
  const count = parseInt(document.getElementById('race-count').value) || 1000;
  const expected = n * count;

  document.getElementById('race-stat-counter').textContent = counter;
  if (!running) document.getElementById('race-stat-expected').textContent = expected;
  const lost = expected - counter;
  document.getElementById('race-stat-lost').textContent = lost > 0 ? lost : 0;

  const pct = expected > 0 ? (counter / expected * 100).toFixed(1) : 0;
  document.getElementById('race-progress').style.width = pct + '%';
}

function renderThreads() {
  const el = document.getElementById('race-threads');
  if (!el) return;
  const n = parseInt(document.getElementById('race-n').value) || 2;
  const count = parseInt(document.getElementById('race-count').value) || 1000;

  el.innerHTML = threads.map(t => {
    const pct = count > 0 ? (t.ran / count * 100).toFixed(1) : 0;
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="color:${t.color};font-weight:600">${t.id}</span>
        <span style="font-family:var(--font-mono);color:var(--text-muted)">${t.ran} / ${count} increments</span>
      </div>
      <div style="background:var(--bg-surface);border-radius:99px;height:6px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${t.color};border-radius:99px;transition:width 0.3s ease"></div>
      </div>
    </div>`;
  }).join('');
}
