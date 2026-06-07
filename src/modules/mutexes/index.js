import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'mutexes';
let locked = false, owner = null, waitQueue = [];
let criticalData = 0, operations = [];

export function renderMutexes(container) {
  const saved = loadState(KEY);
  if (saved) { locked = saved.locked; owner = saved.owner; waitQueue = saved.waitQueue; criticalData = saved.criticalData; operations = saved.operations; }

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(239,68,68,.15)">🔒</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#f87171">Mutexes</h1>
        <p class="module-subtitle">See how mutex lock/unlock enforces mutual exclusion. Only one thread holds the lock at any time.</p>
      </div>
      <button class="btn btn-secondary" id="mut-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Thread Controls</span></div>
          <div class="panel-body">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
              <button class="btn btn-primary btn-sm" id="mut-t1-lock">T1: lock()</button>
              <button class="btn btn-primary btn-sm" id="mut-t1-unlock">T1: unlock()</button>
              <button class="btn btn-danger btn-sm" id="mut-t1-inc">T1: data++</button>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
              <button class="btn btn-primary btn-sm" id="mut-t2-lock">T2: lock()</button>
              <button class="btn btn-primary btn-sm" id="mut-t2-unlock">T2: unlock()</button>
              <button class="btn btn-danger btn-sm" id="mut-t2-inc">T2: data++</button>
            </div>
            <button class="btn btn-secondary" id="mut-reset-btn" style="width:100%">↺ Reset</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Wait Queue</span></div>
          <div id="mut-queue" style="padding:12px;min-height:60px"><p style="color:var(--text-muted);font-size:13px">No threads waiting</p></div>
        </div>
      </div>
      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:${locked?'#ef4444':'#22c55e'}" id="mut-lock-state">${locked?'LOCKED':'FREE'}</div><div class="stat-label">Mutex State</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#f59e0b" id="mut-owner">${owner||'—'}</div><div class="stat-label">Owner</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#a78bfa" id="mut-data">${criticalData}</div><div class="stat-label">Shared Data</div></div>
        </div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Critical Section</span></div>
          <div style="padding:20px;text-align:center">
            <div style="border:2px dashed ${locked?'#ef4444':'#22c55e'};border-radius:12px;padding:24px;background:${locked?'rgba(239,68,68,.05)':'rgba(34,197,94,.05)'}">
              <div style="font-size:14px;color:${locked?'#f87171':'#4ade80'};font-weight:700;margin-bottom:8px">${locked?`🔒 LOCKED by ${owner}`:'🟢 UNLOCKED'}</div>
              <div style="font-size:28px;font-family:var(--font-mono);font-weight:800">data = ${criticalData}</div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Event Log</span></div>
          <div class="log-area" id="mut-log" style="max-height:140px"></div>
        </div>
      </div>
    </div>
  </div>`;

  function persist() { saveState(KEY, { locked, owner, waitQueue, criticalData, operations }); }

  function addLog(msg, type='info') {
    operations.unshift({msg, type, time: new Date().toLocaleTimeString('en',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})});
    if (operations.length > 20) operations.pop();
    document.getElementById('mut-log').innerHTML = operations.map(o =>
      `<div class="log-entry ${o.type}"><span class="log-time">${o.time}</span><span class="log-msg">${o.msg}</span></div>`).join('');
  }

  function redraw() {
    document.getElementById('mut-lock-state').textContent = locked ? 'LOCKED' : 'FREE';
    document.getElementById('mut-lock-state').style.color = locked ? '#ef4444' : '#22c55e';
    document.getElementById('mut-owner').textContent = owner || '—';
    document.getElementById('mut-data').textContent = criticalData;
    const csEl = document.querySelector('#mut-guide-btn').closest('.module-page').querySelector('.stats-row + .panel .panel-body > div > div');
    if (!waitQueue.length) {
      document.getElementById('mut-queue').innerHTML = '<p style="color:var(--text-muted);font-size:13px">No threads waiting</p>';
    } else {
      document.getElementById('mut-queue').innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px">${waitQueue.map(t =>
        `<span style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;color:#f87171">⏳ ${t} waiting</span>`).join('')}</div>`;
    }
    persist();
  }

  function lockReq(thread) {
    if (!locked) {
      locked = true; owner = thread;
      addLog(`${thread} acquired mutex 🔒`, 'success');
      showToast(`${thread} locked`, 'success');
    } else if (owner === thread) {
      addLog(`${thread} already holds mutex`, 'warning');
      showToast(`${thread} already owns the lock!`, 'warning');
    } else {
      if (!waitQueue.includes(thread)) waitQueue.push(thread);
      addLog(`${thread} blocked — waiting for ${owner}`, 'danger');
      showToast(`${thread} blocked! Waiting for ${owner}`, 'error', 2500);
    }
    redraw();
  }

  function unlockReq(thread) {
    if (!locked) { addLog(`${thread}: mutex already unlocked`, 'warning'); redraw(); return; }
    if (owner !== thread) { addLog(`${thread} doesn't own the mutex!`, 'error'); showToast(`${thread} can't unlock — owned by ${owner}`, 'error'); redraw(); return; }
    owner = null; locked = false;
    addLog(`${thread} released mutex 🔓`, 'info');
    if (waitQueue.length) {
      const next = waitQueue.shift();
      locked = true; owner = next;
      addLog(`Mutex granted to ${next} (from wait queue)`, 'success');
    }
    redraw();
  }

  document.getElementById('mut-guide-btn').addEventListener('click', () => openGuide('mutexes'));
  document.getElementById('mut-t1-lock').addEventListener('click', () => lockReq('T1'));
  document.getElementById('mut-t1-unlock').addEventListener('click', () => unlockReq('T1'));
  document.getElementById('mut-t2-lock').addEventListener('click', () => lockReq('T2'));
  document.getElementById('mut-t2-unlock').addEventListener('click', () => unlockReq('T2'));
  document.getElementById('mut-t1-inc').addEventListener('click', () => {
    if (!locked || owner !== 'T1') { addLog('T1: Must hold mutex to access critical section!', 'danger'); showToast('Must lock first!', 'error'); return; }
    criticalData++; addLog(`T1: data++ → ${criticalData}`, 'info'); redraw();
  });
  document.getElementById('mut-t2-inc').addEventListener('click', () => {
    if (!locked || owner !== 'T2') { addLog('T2: Must hold mutex to access critical section!', 'danger'); showToast('Must lock first!', 'error'); return; }
    criticalData++; addLog(`T2: data++ → ${criticalData}`, 'info'); redraw();
  });
  document.getElementById('mut-reset-btn').addEventListener('click', () => { locked=false;owner=null;waitQueue=[];criticalData=0;operations=[]; redraw(); });
  redraw();
  if (operations.length) addLog('State restored from localStorage', 'info');
}
