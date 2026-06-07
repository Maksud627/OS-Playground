import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'producerconsumer';
let buffer = [], capacity = 5, log = [];
let empty, full, mutex = false;

export function renderProducerConsumer(container) {
  const saved = loadState(KEY);
  if (saved) { buffer = saved.buffer || []; capacity = saved.capacity || 5; log = saved.log || []; }

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(20,184,166,.15)">🏭</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#2dd4bf">Producer-Consumer</h1>
        <p class="module-subtitle">Fill and drain a bounded buffer with semaphore coordination. See how empty/full semaphores synchronize producer and consumer threads.</p>
      </div>
      <button class="btn btn-secondary" id="pc-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Controls</span></div>
          <div class="panel-body">
            <div style="display:flex;gap:10px;margin-bottom:12px">
              <button class="btn btn-primary" id="pc-produce-btn" style="flex:1;background:#14b8a6">🏭 Produce Item</button>
              <button class="btn btn-primary" id="pc-consume-btn" style="flex:1;background:#f97316">🛒 Consume Item</button>
            </div>
            <div class="form-group">
              <label class="form-label">Buffer Capacity: <strong id="pc-cap-val">${capacity}</strong></label>
              <input class="form-range" id="pc-cap" type="range" min="1" max="10" value="${capacity}">
            </div>
            <button class="btn btn-secondary" id="pc-reset-btn" style="width:100%">↺ Reset</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Semaphore State</span></div>
          <div class="panel-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center">
              <div><div style="font-size:11px;color:var(--text-muted)">empty slots</div><div style="font-size:28px;font-weight:900;font-family:var(--font-mono);color:#22c55e" id="pc-empty">${capacity-buffer.length}</div></div>
              <div><div style="font-size:11px;color:var(--text-muted)">full slots</div><div style="font-size:28px;font-weight:900;font-family:var(--font-mono);color:#f59e0b" id="pc-full">${buffer.length}</div></div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Bounded Buffer (${buffer.length}/${capacity})</span></div>
          <div style="padding:16px">
            <div style="display:flex;gap:4px;flex-wrap:wrap;min-height:60px;align-items:center" id="pc-buffer">
              ${!buffer.length ? '<p style="color:var(--text-muted);font-size:13px;width:100%;text-align:center">Buffer is empty</p>' : ''}
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Event Log</span></div>
          <div class="log-area" id="pc-log" style="max-height:160px"></div>
        </div>
      </div>
    </div>
  </div>`;

  function persist() { saveState(KEY, { buffer: buffer.map(b=>({...b})), capacity, log }); }
  function addLog(msg, type) {
    log.unshift({ msg, type, time: new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
    if (log.length > 30) log.pop();
    document.getElementById('pc-log').innerHTML = log.map(l => `<div class="log-entry ${l.type}"><span class="log-time">${l.time}</span><span class="log-msg">${l.msg}</span></div>`).join('');
  }
  function redraw() {
    document.getElementById('pc-empty').textContent = capacity - buffer.length;
    document.getElementById('pc-full').textContent = buffer.length;
    const buf = document.getElementById('pc-buffer');
    buf.innerHTML = buffer.length ? buffer.map(b => `<div style="width:48px;height:48px;border-radius:8px;background:${b.color}22;border:2px solid ${b.color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:${b.color};animation:blockPop 0.3s ease both">${b.id}</div>`).join('') : '<p style="color:var(--text-muted);font-size:13px;width:100%;text-align:center">Buffer is empty</p>';
    persist();
  }
  function produce() {
    if (buffer.length >= capacity) { addLog('Producer BLOCKED — buffer full!', 'danger'); showToast('Buffer full! Consumer must consume first.', 'error'); return; }
    const item = { id: buffer.length + 1, color: `hsl(${(buffer.length*60+170)%360},60%,55%)` };
    buffer.push(item);
    addLog(`Producer → item ${item.id} (buffer: ${buffer.length}/${capacity})`, 'success');
    redraw();
  }
  function consume() {
    if (!buffer.length) { addLog('Consumer BLOCKED — buffer empty!', 'danger'); showToast('Buffer empty! Producer must produce first.', 'error'); return; }
    const item = buffer.shift();
    addLog(`Consumer ← item ${item.id} (buffer: ${buffer.length}/${capacity})`, 'info');
    redraw();
  }

  document.getElementById('pc-guide-btn').addEventListener('click', () => openGuide('producerconsumer'));
  document.getElementById('pc-cap').addEventListener('input', (e) => { capacity = parseInt(e.target.value); document.getElementById('pc-cap-val').textContent = capacity; if (buffer.length > capacity) buffer = buffer.slice(0, capacity); redraw(); });
  document.getElementById('pc-produce-btn').addEventListener('click', produce);
  document.getElementById('pc-consume-btn').addEventListener('click', consume);
  document.getElementById('pc-reset-btn').addEventListener('click', () => { buffer = []; log = []; persist(); redraw(); });

  if (log.length) addLog('Restored from localStorage', 'info');
  redraw();
}
