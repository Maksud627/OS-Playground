import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'lifecycle';
const NEW = 'new', READY = 'ready', RUNNING = 'running', WAITING = 'waiting', TERMINATED = 'terminated';
const STATE_COLOR = {
  new: '#6366f1', ready: '#f59e0b', running: '#22c55e', waiting: '#ef4444', terminated: '#475569'
};
const STATE_EMOJI = { new: '🆕', ready: '⏳', running: '▶️', waiting: '⏸️', terminated: '✅' };

let processes = [];
let pidCounter = 1;

function persist() { saveState(KEY, { processes: processes.map(p=>({...p})), pidCounter }); }

export function renderLifecycle(container) {
  const saved = loadState(KEY);
  if (saved) { processes = saved.processes || []; pidCounter = saved.pidCounter || 1; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(167,139,250,.15)">🔄</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#a78bfa">Process Lifecycle</h1>
        <p class="module-subtitle">Create processes and watch them move through the 5-state model. Also compare processes vs threads side-by-side.</p>
      </div>
      <button class="btn btn-secondary" id="lifecycle-guide-btn">📖 Learn</button>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" id="lc-tab-states" onclick="window._lcTab('states')">5-State Model</button>
      <button class="tab-btn" id="lc-tab-vs" onclick="window._lcTab('vs')">Processes vs Threads</button>
    </div>

    <div id="lc-states-view">
      <div class="two-col">
        <div>
          <div class="panel" style="margin-bottom:16px">
            <div class="panel-header"><span class="panel-title">Create Process</span></div>
            <div class="panel-body">
              <div class="form-group">
                <label class="form-label">Process Name</label>
                <input class="form-input" id="lc-name" value="Worker" placeholder="Worker">
              </div>
              <div class="form-group">
                <label class="form-label">Burst Time (ms per cycle)</label>
                <input class="form-input" id="lc-burst" type="number" min="500" max="5000" value="2000">
              </div>
              <button class="btn btn-primary" id="lc-create-btn" style="width:100%">＋ Create Process</button>
            </div>
          </div>
          <div class="panel" style="margin-bottom:16px">
            <div class="panel-header"><span class="panel-title">Process Table</span><button class="btn btn-secondary btn-sm" id="lc-clear-btn">Clear</button></div>
            <div id="lc-proc-list"><div class="empty-state"><span class="icon">📋</span><p>No processes yet</p></div></div>
          </div>
          <div class="panel">
            <div class="panel-header"><span class="panel-title">PCB Details</span></div>
            <div id="lc-pcb"><div class="empty-state"><span class="icon">📋</span><p>Click a process to view its PCB</p></div></div>
          </div>
        </div>
        <div>
          <div class="panel" style="margin-bottom:16px">
            <div class="panel-header"><span class="panel-title">State Diagram</span></div>
            <div style="padding:20px">
              <canvas id="lc-canvas" height="320" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
            </div>
          </div>
          <div class="stats-row">
            <div class="stat-card"><div class="stat-value" style="color:#6366f1" id="lc-stat-new">0</div><div class="stat-label">New</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#f59e0b" id="lc-stat-ready">0</div><div class="stat-label">Ready</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="lc-stat-running">0</div><div class="stat-label">Running</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#ef4444" id="lc-stat-waiting">0</div><div class="stat-label">Waiting</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#475569" id="lc-stat-terminated">0</div><div class="stat-label">Terminated</div></div>
          </div>
        </div>
      </div>
    </div>

    <div id="lc-vs-view" style="display:none">
      <div class="two-col">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Processes</span></div>
          <div class="panel-body">
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="padding:12px;background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:8px">
                <strong>🔹 Independent</strong>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">Each process has its own address space, file descriptors, and PCB. Communication requires IPC (pipes, sockets, shared memory).</p>
              </div>
              <div style="padding:12px;background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:8px">
                <strong>🔹 Heavyweight</strong>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">Creating a process is expensive — the OS must allocate a new address space and copy the parent's context (fork). Context switching between processes is slow (TLB flush).</p>
              </div>
              <div style="padding:12px;background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:8px">
                <strong>🔹 Isolated</strong>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">A crash in one process doesn't affect others. Security boundary: processes cannot access each other's memory without explicit sharing.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Threads</span></div>
          <div class="panel-body">
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="padding:12px;background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.3);border-radius:8px">
                <strong>🔸 Shared Address Space</strong>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">All threads within a process share the same heap, globals, and file descriptors. Each thread has its own stack and registers.</p>
              </div>
              <div style="padding:12px;background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.3);border-radius:8px">
                <strong>🔸 Lightweight</strong>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">Creating a thread is cheap — no new address space needed. Context switching between threads is fast (same page table, no TLB flush).</p>
              </div>
              <div style="padding:12px;background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.3);border-radius:8px">
                <strong>🔸 Shared Fate</strong>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">A crash in one thread can corrupt shared data and crash the entire process. Need synchronization (mutexes, semaphores) for shared data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  processes = []; pidCounter = 1;
  bindLifecycle();
}

function bindLifecycle() {
  window._lcTab = (tab) => {
    document.getElementById('lc-states-view').style.display = tab === 'states' ? 'block' : 'none';
    document.getElementById('lc-vs-view').style.display = tab === 'vs' ? 'block' : 'none';
    document.getElementById('lc-tab-states').classList.toggle('active', tab === 'states');
    document.getElementById('lc-tab-vs').classList.toggle('active', tab === 'vs');
  };

  document.getElementById('lifecycle-guide-btn').addEventListener('click', () => openGuide('lifecycle'));
  document.getElementById('lc-create-btn').addEventListener('click', createProcess);
  document.getElementById('lc-clear-btn').addEventListener('click', () => { processes.forEach(p => clearTimeout(p.timer)); processes = []; pidCounter = 1; redrawLC(); });
}

function createProcess() {
  const name = document.getElementById('lc-name').value || 'Worker';
  const burst = parseInt(document.getElementById('lc-burst').value) || 2000;
  const p = { id: `P${pidCounter++}`, name, state: NEW, burst, timer: null, color: `hsl(${(pidCounter*47)%360},70%,60%)` };
  processes.push(p);
  tickProcess(p);
  redrawLC();
  showToast(`Created ${p.id} — ${name}`, 'success');
}

function tickProcess(p) {
  p.state = NEW;
  redrawLC();
  p.timer = setTimeout(() => transition(p, READY), 600);
}

function transition(p, nextState) {
  if (!processes.includes(p)) return;
  p.state = nextState;
  redrawLC();

  if (nextState === READY) {
    const alreadyRunning = processes.some(x => x.state === RUNNING);
    if (!alreadyRunning) {
      p.timer = setTimeout(() => transition(p, RUNNING), 800);
    } else {
      p.timer = setTimeout(() => transition(p, READY), 500); // keep checking
    }
  } else if (nextState === RUNNING) {
    // Maybe go to waiting (I/O) sometimes
    const willWait = Math.random() < 0.4;
    if (willWait) {
      p.timer = setTimeout(() => transition(p, WAITING), 1000);
    } else {
      p.timer = setTimeout(() => transition(p, TERMINATED), p.burst * (0.5 + Math.random()));
    }
  } else if (nextState === WAITING) {
    p.timer = setTimeout(() => {
      const running = processes.some(x => x.state === RUNNING);
      if (running) transition(p, READY);
      else transition(p, RUNNING);
    }, 1500 + Math.random() * 1500);
  } else if (nextState === TERMINATED) {
    showToast(`${p.id} terminated`, 'info');
    // Wake up next ready process
    const next = processes.find(x => x.state === READY);
    if (next) transition(next, RUNNING);
  }
}

function redrawLC() {
  renderProcessTable();
  drawStateDiagram();
  updateStats();
}

function renderProcessTable() {
  const el = document.getElementById('lc-proc-list');
  if (!el) return;
  if (!processes.length) {
    el.innerHTML = '<div class="empty-state"><span class="icon">📋</span><p>No processes yet</p></div>';
    return;
  }
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>PID</th><th>Name</th><th>State</th><th>Action</th></tr></thead>
    <tbody>${processes.map(p => {
      const canRun = p.state === READY && !processes.some(x => x.state === RUNNING);
      const canWait = p.state === RUNNING;
      const canTerm = p.state === RUNNING;
      return `<tr style="cursor:pointer" onclick="window._lcShowPCB('${p.id}')">
        <td><span class="proc-dot" style="background:${p.color}"></span>${p.id}</td>
        <td>${p.name}</td>
        <td><span style="color:${STATE_COLOR[p.state]};font-weight:600">${STATE_EMOJI[p.state]} ${p.state}</span></td>
        <td>
          ${canRun ? '<button class="btn btn-success btn-sm" onclick="event.stopPropagation();window._lcForce(\''+p.id+'\',\'running\')">▶ Run</button>' : ''}
          ${canWait ? '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();window._lcForce(\''+p.id+'\',\'waiting\')">⏸ I/O</button>' : ''}
          ${canTerm ? '<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();window._lcForce(\''+p.id+'\',\'terminated\')">⏹ End</button>' : ''}
        </td>
      </tr>`;
    }).join('')}
    </tbody></table>`;

  window._lcShowPCB = (id) => {
    const p = processes.find(x => x.id === id);
    if (!p) return;
    document.getElementById('lc-pcb').innerHTML = `
      <div style="padding:16px">
        <div style="font-size:16px;font-weight:700;color:${p.color};margin-bottom:12px">${p.id} — ${p.name}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
          <div style="color:var(--text-muted)">State</div><div style="color:${STATE_COLOR[p.state]};font-weight:600">${p.state}</div>
          <div style="color:var(--text-muted)">Program Counter</div><div style="font-family:var(--font-mono)">0x${Math.floor(Math.random()*0xFFFF).toString(16).padStart(4,'0')}</div>
          <div style="color:var(--text-muted)">Stack Pointer</div><div style="font-family:var(--font-mono)">0x7FFF</div>
          <div style="color:var(--text-muted)">Priority</div><div>${Math.floor(Math.random()*10+1)}</div>
          <div style="color:var(--text-muted)">Open FDs</div><div>${Math.floor(Math.random()*5)}</div>
          <div style="color:var(--text-muted)">CPU Registers</div><div style="font-family:var(--font-mono);font-size:11px">eax, ebx, ecx, edx...</div>
        </div>
      </div>`;
  };

  window._lcForce = (id, state) => {
    const p = processes.find(x => x.id === id);
    if (!p) return;
    clearTimeout(p.timer);
    if (state === 'terminated') transition(p, 'terminated');
    else if (state === 'waiting') transition(p, 'waiting');
    else if (state === 'running') transition(p, 'running');
  };
}

function updateStats() {
  const counts = { new:0, ready:0, running:0, waiting:0, terminated:0 };
  processes.forEach(p => counts[p.state]++);
  Object.keys(counts).forEach(s => {
    const el = document.getElementById(`lc-stat-${s}`);
    if (el) el.textContent = counts[s];
  });
}

function drawStateDiagram() {
  const canvas = document.getElementById('lc-canvas');
  if (!canvas) return;
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const positions = {
    new:       { x: W*0.15, y: H*0.15 },
    ready:     { x: W*0.40, y: H*0.25 },
    running:   { x: W*0.65, y: H*0.25 },
    waiting:   { x: W*0.50, y: H*0.70 },
    terminated:{ x: W*0.85, y: H*0.25 }
  };

  const edges = [
    ['new','ready'], ['ready','running'], ['running','waiting'], ['waiting','ready'],
    ['running','terminated'], ['running','ready']
  ];

  // Edges
  edges.forEach(([from, to]) => {
    const a = positions[from], b = positions[to];
    ctx.save();
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

    const ang = Math.atan2(b.y-a.y, b.x-a.x);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x-10*Math.cos(ang-0.4), b.y-10*Math.sin(ang-0.4));
    ctx.lineTo(b.x-10*Math.cos(ang+0.4), b.y-10*Math.sin(ang+0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  });

  // Nodes
  Object.entries(positions).forEach(([state, pos]) => {
    const count = processes.filter(p => p.state === state).length;
    const isActive = count > 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 38, 0, Math.PI*2);
    ctx.fillStyle = STATE_COLOR[state] + (isActive ? '33' : '11');
    ctx.fill();
    ctx.strokeStyle = isActive ? STATE_COLOR[state] : '#334155';
    ctx.lineWidth = isActive ? 3 : 1.5;
    ctx.stroke();

    if (isActive) {
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 38, 0, Math.PI*2);
      ctx.strokeStyle = STATE_COLOR[state]; ctx.lineWidth = 3;
      ctx.setLineDash([4,3]);
      ctx.stroke(); ctx.setLineDash([]);
    }

    ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
    ctx.fillText(state.toUpperCase(), pos.x, pos.y - 4);
    ctx.font = 'bold 14px Inter';
    ctx.fillText(count, pos.x, pos.y + 16);
    ctx.restore();
  });
}
