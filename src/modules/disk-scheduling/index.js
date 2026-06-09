import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'disk';

export function renderDisk(container) {
  const saved = loadState(KEY);
  if (saved) {
    setTimeout(() => {
      if (saved.queue) document.getElementById('disk-queue').value = saved.queue;
      if (saved.head !== undefined) document.getElementById('disk-head').value = saved.head;
    }, 50);
  }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(34,197,94,.15)">💿</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#4ade80">Disk Scheduling</h1>
        <p class="module-subtitle">Enter a request queue and watch the disk arm sweep across cylinders. Compare total seek times across five algorithms.</p>
      </div>
      <button class="btn btn-secondary" id="disk-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Configuration</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Request Queue (space-separated cylinder numbers)</label>
              <input class="form-input" id="disk-queue" value="98 183 37 122 14 124 65 67" placeholder="e.g. 98 183 37 122">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Initial Head Position</label>
                <input class="form-input" id="disk-head" type="number" min="0" max="199" value="53">
              </div>
              <div class="form-group">
                <label class="form-label">Total Cylinders</label>
                <input class="form-input" id="disk-cylinders" type="number" min="50" max="500" value="200">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Algorithm</label>
              <select class="form-select" id="disk-algo">
                <option value="fcfs">FCFS — First Come First Served</option>
                <option value="sstf" selected>SSTF — Shortest Seek Time First</option>
                <option value="scan">SCAN (Elevator)</option>
                <option value="cscan">C-SCAN (Circular SCAN)</option>
                <option value="look">LOOK</option>
              </select>
            </div>
            <div class="form-group" id="disk-dir-group">
              <label class="form-label">Initial Direction</label>
              <select class="form-select" id="disk-dir">
                <option value="right" selected>→ Toward higher cylinders</option>
                <option value="left">← Toward lower cylinders</option>
              </select>
            </div>
            <button class="btn btn-disk" id="disk-run-btn" style="width:100%">▶ Run Simulation</button>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Algorithm Comparison</span></div>
          <div id="disk-compare" style="padding:16px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">Run a simulation to compare</p>
          </div>
        </div>

        <div class="concept-box disk">
          <h4>📚 Disk Scheduling</h4>
          <p id="disk-concept">SSTF (Shortest Seek Time First) always services the request closest to the current head position. It reduces total seek time vs FCFS but can cause starvation of far requests. SCAN (elevator algorithm) is the real-world standard.</p>
        </div>
      </div>

      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#4ade80" id="disk-stat-seek">—</div><div class="stat-label">Total Seek</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#38bdf8" id="disk-stat-avg">—</div><div class="stat-label">Avg Seek</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#a78bfa" id="disk-stat-n">—</div><div class="stat-label">Requests</div></div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Head Movement</span></div>
          <div style="padding:20px">
            <canvas id="disk-canvas" height="280" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">Service Order</span></div>
          <div id="disk-order" style="padding:16px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">Results will appear here</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  bindDisk();
}

function bindDisk() {
  const CONCEPTS = {
    fcfs: 'FCFS processes requests in arrival order. Simple but can cause wild head movement. Useful baseline for comparison.',
    sstf: 'SSTF always picks the closest request. Reduces average seek time vs FCFS but can cause starvation of far-away requests.',
    scan: 'SCAN (elevator algorithm) moves in one direction servicing requests, then reverses at the end. Fairer than SSTF and used in most real disk controllers.',
    cscan: 'C-SCAN goes to the end, jumps back to the start without servicing, and sweeps again. Provides more uniform wait times than regular SCAN.',
    look: 'LOOK is like SCAN but reverses at the last request (not disk end). Avoids unnecessary travel to cylinder boundaries.'
  };

  const algoSel = document.getElementById('disk-algo');
  const dirGroup = document.getElementById('disk-dir-group');
  algoSel.addEventListener('change', () => {
    const needsDir = ['scan','cscan','look'].includes(algoSel.value);
    dirGroup.style.display = needsDir ? 'block' : 'none';
    document.getElementById('disk-concept').textContent = CONCEPTS[algoSel.value];
    saveState(KEY, { queue: document.getElementById('disk-queue').value, head: parseInt(document.getElementById('disk-head').value) });
  });
  algoSel.dispatchEvent(new Event('change'));

  document.getElementById('disk-run-btn').addEventListener('click', runDisk);
  document.getElementById('disk-guide-btn').addEventListener('click', () => openGuide('disk'));
}

function runDisk() {
  const queueRaw = document.getElementById('disk-queue').value.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
  const head = parseInt(document.getElementById('disk-head').value) || 53;
  const cylinders = parseInt(document.getElementById('disk-cylinders').value) || 200;
  const algo = document.getElementById('disk-algo').value;
  const dir = document.getElementById('disk-dir').value;

  if (!queueRaw.length) { showToast('Enter a request queue', 'error'); return; }
  const invalid = queueRaw.filter(v => v < 0 || v >= cylinders);
  if (invalid.length) { showToast(`Cylinders must be 0–${cylinders-1}`, 'error'); return; }

  const order = computeOrder(algo, [...queueRaw], head, cylinders, dir);
  const total = computeSeek(order);
  const avg = total / queueRaw.length;

  document.getElementById('disk-stat-seek').textContent = total;
  document.getElementById('disk-stat-avg').textContent = avg.toFixed(1);
  document.getElementById('disk-stat-n').textContent = queueRaw.length;

  drawDiskCanvas(order, cylinders);
  renderServiceOrder(order);
  renderCompare(queueRaw, head, cylinders, dir);
  showToast(`Done: total seek = ${total} cylinders`, 'success');
}

function computeOrder(algo, queue, head, cylinders, dir) {
  if (algo === 'fcfs') return [head, ...queue];
  if (algo === 'sstf') return sstf([...queue], head);
  if (algo === 'scan') return scan([...queue], head, cylinders, dir);
  if (algo === 'cscan') return cscan([...queue], head, cylinders, dir);
  return look([...queue], head, dir);
}

function sstf(queue, head) {
  const order = [head];
  let cur = head;
  while (queue.length) {
    const nearest = queue.reduce((a, b) => Math.abs(a-cur) <= Math.abs(b-cur) ? a : b);
    order.push(nearest);
    queue.splice(queue.indexOf(nearest), 1);
    cur = nearest;
  }
  return order;
}

function scan(queue, head, cylinders, dir) {
  const sorted = [...queue].sort((a,b)=>a-b);
  const left = sorted.filter(x => x < head).reverse();
  const right = sorted.filter(x => x >= head);
  const order = [head];
  if (dir === 'right') { right.forEach(x=>order.push(x)); if(left.length) order.push(cylinders-1); left.forEach(x=>order.push(x)); }
  else { left.forEach(x=>order.push(x)); if(right.length) order.push(0); right.forEach(x=>order.push(x)); }
  return order;
}

function cscan(queue, head, cylinders, dir) {
  const sorted = [...queue].sort((a,b)=>a-b);
  const right = sorted.filter(x => x >= head);
  const left = sorted.filter(x => x < head);
  return [head, ...right, cylinders-1, 0, ...left];
}

function look(queue, head, dir) {
  const sorted = [...queue].sort((a,b)=>a-b);
  const left = sorted.filter(x => x < head).reverse();
  const right = sorted.filter(x => x >= head);
  return dir === 'right' ? [head,...right,...left] : [head,...left,...right];
}

function computeSeek(order) {
  return order.reduce((sum, v, i) => i === 0 ? 0 : sum + Math.abs(v - order[i-1]), 0);
}

function drawDiskCanvas(order, cylinders) {
  const canvas = document.getElementById('disk-canvas');
  const W = canvas.offsetWidth || 500;
  canvas.width = W;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const PAD = { top: 20, bottom: 30, left: 40, right: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const steps = order.length;

  function xPos(step) { return PAD.left + (step / (steps-1)) * chartW; }
  function yPos(cyl)  { return PAD.top + (cyl / (cylinders-1)) * chartH; }

  // Grid
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + i/4 * chartH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W-PAD.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px JetBrains Mono,monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(i/4*cylinders), PAD.left-4, y);
  }
  ctx.restore();

  // Path
  ctx.save();
  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  order.forEach((cyl, i) => {
    const x = xPos(i), y = yPos(cyl);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  // Points
  order.forEach((cyl, i) => {
    const x = xPos(i), y = yPos(cyl);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, i===0?6:4, 0, Math.PI*2);
    ctx.fillStyle = i===0 ? '#f59e0b' : '#22c55e';
    ctx.fill();
    ctx.restore();
    if (i === 0 || i === order.length-1 || steps < 15) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '10px JetBrains Mono,monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cyl, x, y - 9);
    }
  });

  // Axis label
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Inter,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('← Request Sequence →', PAD.left + chartW/2, H - 4);
}

function renderServiceOrder(order) {
  const el = document.getElementById('disk-order');
  const moves = order.map((v,i) => i===0 ? null : Math.abs(v-order[i-1])).slice(1);
  el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
    ${order.map((v,i) => {
      const isStart = i===0;
      return `<span style="display:inline-flex;flex-direction:column;align-items:center;gap:2px">
        <span style="background:${isStart?'rgba(245,158,11,.2)':'rgba(34,197,94,.15)'};border:1px solid ${isStart?'#f59e0b':'rgba(34,197,94,.4)'};color:${isStart?'#fbbf24':'#4ade80'};padding:4px 10px;border-radius:6px;font-family:var(--font-mono);font-size:13px;font-weight:700">${v}</span>
        ${i>0?`<span style="font-size:10px;color:var(--text-muted)">+${moves[i-1]}</span>`:'<span style="font-size:10px;color:#f59e0b">HEAD</span>'}
      </span>
      ${i<order.length-1?'<span style="color:var(--text-dim)">→</span>':''}`;
    }).join('')}
  </div>`;
}

function renderCompare(queue, head, cylinders, dir) {
  const algos = ['fcfs','sstf','scan','cscan','look'];
  const names = { fcfs:'FCFS', sstf:'SSTF', scan:'SCAN', cscan:'C-SCAN', look:'LOOK' };
  const colors = { fcfs:'#7c3aed', sstf:'#0ea5e9', scan:'#22c55e', cscan:'#f59e0b', look:'#ec4899' };
  const results = algos.map(a => {
    const order = computeOrder(a, [...queue], head, cylinders, dir);
    return { name: names[a], color: colors[a], seek: computeSeek(order) };
  });
  const max = Math.max(...results.map(r=>r.seek)) || 1;
  document.getElementById('disk-compare').innerHTML = results.map(r=>`
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
        <span style="color:${r.color};font-weight:600">${r.name}</span>
        <span style="font-family:var(--font-mono);font-weight:700">${r.seek}</span>
      </div>
      <div style="background:var(--bg-surface);border-radius:99px;height:8px;overflow:hidden">
        <div style="height:100%;width:${(r.seek/max*100).toFixed(1)}%;background:${r.color};border-radius:99px;transition:width 0.6s ease"></div>
      </div>
    </div>`).join('');
}
