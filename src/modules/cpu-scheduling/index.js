import { runFCFS, runSJF, runRR, runPriority, calcStats } from './scheduler.js';
import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const COLORS = ['#7c3aed','#0ea5e9','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'];
const KEY = 'cpu';

let processes = [];
let pidCounter = 1;

function persist() { saveState(KEY, { processes: processes.map(p=>({...p})), pidCounter }); }

export function renderCPU(container) {
  const saved = loadState(KEY);
  if (saved) { processes = saved.processes || []; pidCounter = saved.pidCounter || 1; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(124,58,237,.15)">🖥️</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#a78bfa">CPU Scheduling</h1>
        <p class="module-subtitle">Add processes and watch the scheduler animate a Gantt chart in real time. Compare algorithms side-by-side.</p>
      </div>
      <button class="btn btn-secondary" id="cpu-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <!-- Left: Controls -->
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header">
            <span class="panel-title">Add Process</span>
          </div>
          <div class="panel-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Arrival Time</label>
                <input class="form-input" id="cpu-arrival" type="number" min="0" value="0" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Burst Time</label>
                <input class="form-input" id="cpu-burst" type="number" min="1" value="4" placeholder="4">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Priority (lower=high)</label>
                <input class="form-input" id="cpu-priority" type="number" min="1" value="1" placeholder="1">
              </div>
              <div class="form-group" style="align-self:flex-end">
                <button class="btn btn-cpu" id="cpu-add-btn" style="width:100%">＋ Add Process</button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Process Queue</span>
            <button class="btn btn-secondary btn-sm" id="cpu-clear-btn">Clear All</button>
          </div>
          <div id="cpu-process-table">
            <div class="empty-state"><span class="icon">📋</span><p>No processes added yet</p></div>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Algorithm</span></div>
          <div class="panel-body">
            <div class="form-group">
              <select class="form-select" id="cpu-algo">
                <option value="fcfs">FCFS — First Come First Served</option>
                <option value="sjf">SJF — Shortest Job First (Preemptive)</option>
                <option value="rr" selected>Round Robin</option>
                <option value="priority">Priority (Preemptive)</option>
              </select>
            </div>
            <div class="form-group" id="cpu-quantum-group">
              <label class="form-label">Time Quantum: <span id="cpu-quantum-val">3</span></label>
              <input class="form-range" id="cpu-quantum" type="range" min="1" max="10" value="3">
            </div>
            <button class="btn btn-cpu" id="cpu-run-btn" style="width:100%;margin-top:4px">▶ Run Simulation</button>
          </div>
        </div>

        <div class="concept-box cpu">
          <h4>📚 Quick Concept</h4>
          <p id="cpu-concept-text">Round Robin gives each process an equal time slice (quantum). It prevents starvation and is ideal for time-sharing systems. Smaller quantum = more context switches but better response time.</p>
        </div>
      </div>

      <!-- Right: Visualization -->
      <div>
        <div class="stats-row" id="cpu-stats">
          <div class="stat-card"><div class="stat-value" style="color:#a78bfa" id="stat-wait">—</div><div class="stat-label">Avg Wait Time</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#38bdf8" id="stat-turn">—</div><div class="stat-label">Avg Turnaround</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#34d399" id="stat-thru">—</div><div class="stat-label">Throughput</div></div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Gantt Chart</span></div>
          <div style="padding:20px;overflow-x:auto">
            <div id="cpu-gantt" style="min-height:80px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:14px">
              Run a simulation to see the Gantt chart
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">Results Table</span></div>
          <div id="cpu-results-table">
            <div class="empty-state"><span class="icon">📊</span><p>Results will appear here</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  processes = [];
  pidCounter = 1;
  bindCPU();
}

function bindCPU() {
  const algoSel = document.getElementById('cpu-algo');
  const quantumGrp = document.getElementById('cpu-quantum-group');
  const quantumSlider = document.getElementById('cpu-quantum');
  const quantumVal = document.getElementById('cpu-quantum-val');

  const CONCEPTS = {
    fcfs: 'FCFS processes jobs in arrival order. Simple but can cause the "convoy effect" where short jobs wait behind a long one, increasing average wait time.',
    sjf: 'Preemptive SJF (SRTF) always runs the process with the shortest remaining time. It minimizes average wait time but requires knowing burst times in advance.',
    rr: 'Round Robin gives each process an equal time slice (quantum). It prevents starvation and is ideal for time-sharing. Smaller quantum = better response but more context switches.',
    priority: 'Priority scheduling runs the highest-priority process first (lower number = higher priority here). Preemptive version can cause starvation of low-priority processes.'
  };

  algoSel.addEventListener('change', () => {
    quantumGrp.style.display = algoSel.value === 'rr' ? 'block' : 'none';
    document.getElementById('cpu-concept-text').textContent = CONCEPTS[algoSel.value];
  });
  algoSel.dispatchEvent(new Event('change'));

  quantumSlider.addEventListener('input', () => { quantumVal.textContent = quantumSlider.value; });

  document.getElementById('cpu-add-btn').addEventListener('click', addProcess);
  document.getElementById('cpu-clear-btn').addEventListener('click', () => { processes = []; pidCounter = 1; renderProcessTable(); });
  document.getElementById('cpu-run-btn').addEventListener('click', runSimulation);
  document.getElementById('cpu-guide-btn').addEventListener('click', () => openGuide('cpu'));

  // Prefill with sample processes
  const samples = [[0,5,2],[1,3,1],[2,8,3],[3,2,1]];
  samples.forEach(([a,b,p]) => {
    processes.push({ id: `P${pidCounter++}`, arrival: a, burst: b, priority: p, color: COLORS[(pidCounter-2) % COLORS.length] });
  });
  renderProcessTable();
}

function addProcess() {
  const arrival = parseInt(document.getElementById('cpu-arrival').value) || 0;
  const burst = parseInt(document.getElementById('cpu-burst').value) || 1;
  const priority = parseInt(document.getElementById('cpu-priority').value) || 1;
  if (burst < 1) { showToast('Burst time must be ≥ 1', 'error'); return; }
  processes.push({ id: `P${pidCounter++}`, arrival, burst, priority, color: COLORS[(pidCounter-2) % COLORS.length] });
  renderProcessTable();
  showToast(`Added P${pidCounter-1} (burst=${burst})`, 'success');
}

function renderProcessTable() {
  const el = document.getElementById('cpu-process-table');
  if (!processes.length) {
    el.innerHTML = '<div class="empty-state"><span class="icon">📋</span><p>No processes added yet</p></div>';
    return;
  }
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>PID</th><th>Arrival</th><th>Burst</th><th>Priority</th><th></th></tr></thead>
    <tbody>${processes.map((p, i) => `
      <tr>
        <td><span class="proc-dot" style="background:${p.color}"></span>${p.id}</td>
        <td>${p.arrival}</td>
        <td>${p.burst}</td>
        <td>${p.priority}</td>
        <td><button class="btn btn-danger btn-sm" onclick="window._cpuDel(${i})">✕</button></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
  window._cpuDel = (i) => { processes.splice(i, 1); renderProcessTable(); };
}

function runSimulation() {
  if (!processes.length) { showToast('Add at least one process first', 'warning'); return; }
  const algo = document.getElementById('cpu-algo').value;
  const quantum = parseInt(document.getElementById('cpu-quantum').value);

  let result;
  if (algo === 'fcfs') result = runFCFS(processes);
  else if (algo === 'sjf') result = runSJF(processes);
  else if (algo === 'rr') result = runRR(processes, quantum);
  else result = runPriority(processes);

  renderGantt(result.timeline);
  renderResults(result.processes);
  const stats = calcStats(result.processes);
  document.getElementById('stat-wait').textContent = stats.avgWait.toFixed(2);
  document.getElementById('stat-turn').textContent = stats.avgTurnaround.toFixed(2);
  document.getElementById('stat-thru').textContent = stats.throughput.toFixed(3);
  showToast('Simulation complete!', 'success');
}

function renderGantt(timeline) {
  if (!timeline.length) return;
  const gantt = document.getElementById('cpu-gantt');
  const maxTime = timeline[timeline.length - 1].end;
  gantt.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:100%;';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:stretch;border-radius:8px;overflow:hidden;min-height:50px;';

  timeline.forEach((block, i) => {
    const w = ((block.end - block.start) / maxTime * 100).toFixed(2);
    const div = document.createElement('div');
    div.style.cssText = `width:${w}%;background:${block.color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;min-width:2px;transition:opacity 0.2s;animation:ganttFill 0.5s ease ${i*0.05}s both;`;
    div.style.animationFillMode = 'both';
    div.title = `${block.id}: t=${block.start}→${block.end}`;
    if (parseFloat(w) > 4) div.textContent = block.id;
    row.appendChild(div);
  });

  // Time axis
  const axis = document.createElement('div');
  axis.style.cssText = 'display:flex;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);';

  const ticks = new Set([0, ...timeline.map(b => b.end)]);
  let lastPct = 0;
  [...ticks].sort((a,b)=>a-b).forEach(t => {
    const pct = t / maxTime * 100;
    const gap = document.createElement('div');
    gap.style.cssText = `width:${(pct - lastPct)}%;text-align:right;padding-right:2px;`;
    gap.textContent = t;
    axis.appendChild(gap);
    lastPct = pct;
  });

  wrap.appendChild(row);
  wrap.appendChild(axis);
  gantt.appendChild(wrap);
}

function renderResults(procs) {
  const el = document.getElementById('cpu-results-table');
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>PID</th><th>Arrival</th><th>Burst</th><th>Finish</th><th>Wait</th><th>Turnaround</th></tr></thead>
    <tbody>${procs.map(p => `
      <tr>
        <td><span class="proc-dot" style="background:${p.color}"></span>${p.id}</td>
        <td>${p.arrival}</td>
        <td>${p.burst}</td>
        <td>${p.finish ?? '—'}</td>
        <td style="color:#f59e0b">${p.wait ?? '—'}</td>
        <td style="color:#22c55e">${p.turnaround ?? '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}
