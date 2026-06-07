import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'semaphores';
let count = 3, maxCount = 3, log = [];

export function renderSemaphores(container) {
  const saved = loadState(KEY);
  if (saved) { count = saved.count; maxCount = saved.maxCount; log = saved.log || []; }

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(245,158,11,.15)">🚦</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#fbbf24">Semaphores</h1>
        <p class="module-subtitle">Control resource access with a counting semaphore. wait() decrements, signal() increments — a powerful synchronization primitive.</p>
      </div>
      <button class="btn btn-secondary" id="sem-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Operations</span></div>
          <div class="panel-body">
            <div style="text-align:center;margin-bottom:16px">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Semaphore Value</div>
              <div style="font-size:64px;font-weight:900;font-family:var(--font-mono);color:${count>0?'#22c55e':'#ef4444'}" id="sem-value">${count}</div>
              <div style="font-size:12px;color:var(--text-muted)">max: ${maxCount} | available: ${count}</div>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-primary" id="sem-wait-btn" style="flex:1">🔻 wait() / P</button>
              <button class="btn btn-primary" id="sem-signal-btn" style="flex:1;background:#22c55e">🔺 signal() / V</button>
            </div>
            <div style="margin-top:10px">
              <div class="form-group">
                <label class="form-label">Max Count</label>
                <input class="form-range" id="sem-max" type="range" min="1" max="10" value="${maxCount}">
                <span style="font-size:11px;color:var(--text-muted)" id="sem-max-val">${maxCount}</span>
              </div>
            </div>
            <button class="btn btn-secondary" id="sem-reset-btn" style="width:100%;margin-top:6px">↺ Reset</button>
          </div>
        </div>
        <div class="concept-box" style="border-left-color:#f59e0b">
          <h4>📚 Semaphore Types</h4>
          <p><strong>Counting Semaphore:</strong> Value ≥ 0. Controls access to N identical resources (e.g., 3 DB connections).<br>
          <strong>Binary Semaphore:</strong> Value = 0 or 1. Acts like a mutex but without ownership tracking.<br>
          <strong>Mutex vs Binary Semaphore:</strong> Mutex has ownership (only locker can unlock). Binary semaphore has no ownership concept.</p>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Behavior Diagram</span></div>
          <div style="padding:16px;text-align:center">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap" id="sem-dots"></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Event Log</span></div>
          <div class="log-area" id="sem-log" style="max-height:200px"></div>
        </div>
      </div>
    </div>
  </div>`;

  let maxSlider = document.getElementById('sem-max');
  maxSlider.addEventListener('input', () => {
    maxCount = parseInt(maxSlider.value);
    document.getElementById('sem-max-val').textContent = maxCount;
    if (count > maxCount) count = maxCount;
    persist();
    redraw();
  });

  function persist() { saveState(KEY, { count, maxCount, log }); }
  function addLog(msg, type) {
    log.unshift({ msg, type, time: new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
    if (log.length > 30) log.pop();
    document.getElementById('sem-log').innerHTML = log.map(l => `<div class="log-entry ${l.type}"><span class="log-time">${l.time}</span><span class="log-msg">${l.msg}</span></div>`).join('');
  }
  function redraw() {
    document.getElementById('sem-value').textContent = count;
    document.getElementById('sem-value').style.color = count > 0 ? '#22c55e' : '#ef4444';
    const dots = document.getElementById('sem-dots');
    dots.innerHTML = Array.from({ length: maxCount }, (_, i) => `<div style="width:32px;height:32px;border-radius:50%;background:${i<count?'#22c55e':'#334155'};border:2px solid ${i<count?'#4ade80':'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.3s">${i<count?'✓':' '}</div>`).join('');
  }

  document.getElementById('sem-guide-btn').addEventListener('click', () => openGuide('semaphores'));
  document.getElementById('sem-wait-btn').addEventListener('click', () => {
    if (count > 0) { count--; addLog(`wait() → sem = ${count}`, 'success'); showToast(`Acquired! Available: ${count}`, 'success'); }
    else { addLog('wait() BLOCKED — sem = 0, no resources available', 'danger'); showToast('Blocked! No resources available', 'error'); }
    persist(); redraw();
  });
  document.getElementById('sem-signal-btn').addEventListener('click', () => {
    count = Math.min(count + 1, maxCount);
    addLog(`signal() → sem = ${count}`, 'info'); persist(); redraw();
  });
  document.getElementById('sem-reset-btn').addEventListener('click', () => { count = maxCount; log = []; persist(); redraw(); });

  if (log.length) addLog('Restored from localStorage', 'info');
  redraw();
}
