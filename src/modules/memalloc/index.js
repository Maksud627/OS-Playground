import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const TOTAL = 64;
const KEY = 'memalloc';
let blocks = [];
let allocations = [];
let algo = 'first';
let allocCounter = 1;

function persist() { saveState(KEY, { allocations: allocations.map(a=>({...a})), algo, allocCounter }); }

export function renderMemAlloc(container) {
  const saved = loadState(KEY);
  if (saved) { allocations = saved.allocations || []; algo = saved.algo || 'first'; allocCounter = saved.allocCounter || 1; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(217,70,239,.15)">🗂️</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#d946ef">Memory Allocation</h1>
        <p class="module-subtitle">Allocate variable-sized blocks into a partitioned memory. Compare First Fit, Best Fit, and Worst Fit side-by-side.</p>
      </div>
      <button class="btn btn-secondary" id="ma-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Allocate Block</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Block Size: <strong id="ma-size-val">8</strong> units</label>
              <input class="form-range" id="ma-size" type="range" min="1" max="32" value="8">
            </div>
            <div class="form-group">
              <label class="form-label">Strategy</label>
              <select class="form-select" id="ma-algo">
                <option value="first">First Fit</option>
                <option value="best">Best Fit</option>
                <option value="worst">Worst Fit</option>
              </select>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-primary" id="ma-alloc-btn" style="flex:1;background:#d946ef">＋ Allocate</button>
              <button class="btn btn-secondary" id="ma-dealloc-btn" style="flex:1">✕ Deallocate</button>
            </div>
            <button class="btn btn-danger" id="ma-reset-btn" style="width:100%;margin-top:6px">Reset Memory</button>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Allocated Blocks</span></div>
          <div id="ma-block-list"><div class="empty-state"><span class="icon">📋</span><p>No blocks allocated</p></div></div>
        </div>

        <div class="concept-box" style="border-left-color:#d946ef">
          <h4>📚 Allocation Strategies</h4>
          <p><strong>First Fit:</strong> Take the first hole big enough. Fast, but may leave small unusable holes at the front.<br>
          <strong>Best Fit:</strong> Take the smallest hole that fits. Minimizes wasted space but creates tiny unusable fragments.<br>
          <strong>Worst Fit:</strong> Take the largest hole. Leaves a larger remainder — better for future large allocations.</p>
        </div>
      </div>
      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#d946ef" id="ma-stat-used">0</div><div class="stat-label">Units Used</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="ma-stat-free">64</div><div class="stat-label">Units Free</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#f59e0b" id="ma-stat-extfrag">0</div><div class="stat-label">Ext. Fragment</div></div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">Memory Partition Map</span></div>
          <div style="padding:16px">
            <div id="ma-grid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px"></div>
            <div id="ma-legend" style="margin-top:8px;font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between">
              <span>0</span><span>${TOTAL}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  blocks = []; allocations = []; allocCounter = 1;
  algo = 'first';
  bindMemAlloc();
}

function bindMemAlloc() {
  document.getElementById('ma-guide-btn').addEventListener('click', () => openGuide('memalloc'));
  document.getElementById('ma-size').addEventListener('input', (e) => {
    document.getElementById('ma-size-val').textContent = e.target.value;
  });
  document.getElementById('ma-algo').addEventListener('change', (e) => { algo = e.target.value; });
  document.getElementById('ma-alloc-btn').addEventListener('click', allocate);
  document.getElementById('ma-dealloc-btn').addEventListener('click', deallocate);
  document.getElementById('ma-reset-btn').addEventListener('click', () => { blocks = []; allocations = []; allocCounter = 1; redrawMA(); });
  redrawMA();
}

function allocate() {
  const size = parseInt(document.getElementById('ma-size').value) || 8;
  const holes = getHoles();

  if (!holes.length) { showToast('No free space!', 'error'); return; }

  let chosen;
  if (algo === 'first') {
    chosen = holes[0];
  } else if (algo === 'best') {
    chosen = holes.reduce((a, b) => (b.end - b.start) < (a.end - a.start) ? b : a);
  } else {
    chosen = holes.reduce((a, b) => (b.end - b.start) > (a.end - a.start) ? b : a);
  }

  if (chosen.end - chosen.start < size) {
    showToast(`No hole fits ${size} units! (largest: ${chosen.end-chosen.start})`, 'error');
    return;
  }

  const alloc = {
    id: `B${allocCounter++}`,
    start: chosen.start,
    size,
    color: `hsl(${(allocCounter*53)%360},65%,55%)`
  };
  allocations.push(alloc);
  allocations.sort((a, b) => a.start - b.start);
  blocks = buildBlockList();
  redrawMA();
  showToast(`Allocated ${alloc.id} (${size}u) via ${algo.replace('f','F').replace('b','B').replace('w','W')} Fit`, 'success');
}

function deallocate() {
  if (!allocations.length) { showToast('Nothing to deallocate', 'warning'); return; }
  const removed = allocations.pop();
  blocks = buildBlockList();
  redrawMA();
  showToast(`Freed ${removed.id}`, 'info');
}

function getHoles() {
  if (!allocations.length) return [{ start: 0, end: TOTAL }];
  const sorted = [...allocations].sort((a, b) => a.start - b.start);
  const holes = [];
  let cursor = 0;
  for (const a of sorted) {
    if (a.start > cursor) holes.push({ start: cursor, end: a.start });
    cursor = a.start + a.size;
  }
  if (cursor < TOTAL) holes.push({ start: cursor, end: TOTAL });
  return holes;
}

function buildBlockList() {
  return [...allocations].sort((a, b) => a.start - b.start);
}

function redrawMA() {
  const grid = document.getElementById('ma-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const used = allocations.reduce((s, a) => s + a.size, 0);
  document.getElementById('ma-stat-used').textContent = used;
  document.getElementById('ma-stat-free').textContent = TOTAL - used;

  // Build visual blocks
  const visual = new Array(TOTAL).fill(null);
  allocations.forEach(a => {
    for (let i = a.start; i < a.start + a.size; i++) visual[i] = a;
  });

  // External fragmentation: number of holes > 1
  const holes = getHoles();
  document.getElementById('ma-stat-extfrag').textContent = holes.length > 0 ? holes.length - 1 : 0;

  visual.forEach((cell, i) => {
    const div = document.createElement('div');
    div.style.cssText = `aspect-ratio:1;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:8px;font-family:var(--font-mono);transition:background 0.3s`;
    if (cell) {
      div.style.background = cell.color + '88';
      div.style.border = '1px solid ' + cell.color;
      div.style.color = '#fff';
      div.textContent = i === cell.start ? cell.id : '';
      div.title = `${cell.id}: [${cell.start}–${cell.start+cell.size-1}]`;
    } else {
      div.style.background = 'rgba(34,197,94,0.08)';
      div.style.border = '1px solid rgba(34,197,94,0.15)';
    }
    if (i === 0 || i === TOTAL - 1 || (i > 0 && ((visual[i-1]||0)!==(visual[i]||0)))) {
      div.style.borderRadius = '3px';
    }
    grid.appendChild(div);
  });

  // Block list
  const list = document.getElementById('ma-block-list');
  if (!allocations.length) {
    list.innerHTML = '<div class="empty-state"><span class="icon">📋</span><p>No blocks allocated</p></div>';
  } else {
    list.innerHTML = `<table class="data-table">
      <thead><tr><th>Block</th><th>Start</th><th>Size</th><th>End</th></tr></thead>
      <tbody>${allocations.map(a => `
        <tr>
          <td><span class="proc-dot" style="background:${a.color}"></span>${a.id}</td>
          <td>${a.start}</td>
          <td style="color:#d946ef;font-weight:700">${a.size}</td>
          <td>${a.start + a.size - 1}</td>
        </tr>`).join('')}
      </tbody></table>`;
  }
}
