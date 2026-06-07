import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const COLORS = ['#7c3aed','#0ea5e9','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'];
const KEY = 'memory';
let pageSize = 4, memoryFrames = 8, processes = [], pidCounter = 1;

function persist() { saveState(KEY, { pageSize, memoryFrames, processes: processes.map(p=>({...p,frames:[...p.frames]})), pidCounter }); }

export function renderMemory(container) {
  const saved = loadState(KEY);
  if (saved) { pageSize = saved.pageSize || 4; memoryFrames = saved.memoryFrames || 8; processes = saved.processes || []; pidCounter = saved.pidCounter || 1; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(14,165,233,.15)">🧩</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#38bdf8">Memory Paging</h1>
        <p class="module-subtitle">See how the OS divides process memory into fixed-size pages and maps them to physical frames. Watch the page table populate live.</p>
      </div>
      <button class="btn btn-secondary" id="mem-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Memory Configuration</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Page / Frame Size: <strong id="mem-ps-val">4</strong> KB</label>
              <input class="form-range" id="mem-page-size" type="range" min="1" max="8" value="4">
            </div>
            <div class="form-group">
              <label class="form-label">Physical Frames: <strong id="mem-frames-val">8</strong></label>
              <input class="form-range" id="mem-frames" type="range" min="4" max="16" value="8">
            </div>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Allocate Process</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Process Size (KB)</label>
              <input class="form-input" id="mem-proc-size" type="number" min="1" max="64" value="10" placeholder="10">
            </div>
            <button class="btn btn-memory" id="mem-alloc-btn" style="width:100%">＋ Allocate Process</button>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header">
            <span class="panel-title">Processes</span>
            <button class="btn btn-secondary btn-sm" id="mem-clear-btn">Clear</button>
          </div>
          <div id="mem-proc-list"><div class="empty-state"><span class="icon">📋</span><p>No processes allocated</p></div></div>
        </div>

        <div class="concept-box memory">
          <h4>📚 Paging Concept</h4>
          <p>Paging divides logical memory into fixed-size <strong>pages</strong> and physical memory into <strong>frames</strong> of the same size. The OS maintains a <strong>page table</strong> per process that maps page numbers → frame numbers. This eliminates external fragmentation but may cause <strong>internal fragmentation</strong> (wasted space in the last page).</p>
        </div>
      </div>

      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#38bdf8" id="mem-stat-used">0</div><div class="stat-label">Frames Used</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#a78bfa" id="mem-stat-free">8</div><div class="stat-label">Frames Free</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#f59e0b" id="mem-stat-frag">0 KB</div><div class="stat-label">Internal Frag.</div></div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Physical Memory Grid</span></div>
          <div style="padding:16px">
            <div id="mem-grid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;"></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">Page Table</span></div>
          <div id="mem-page-table">
            <div class="empty-state"><span class="icon">📋</span><p>Allocate a process to see its page table</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  processes = []; pidCounter = 1; pageSize = 4; memoryFrames = 8;
  bindMemory(container);
}

function bindMemory() {
  const psSlider = document.getElementById('mem-page-size');
  const framesSlider = document.getElementById('mem-frames');

  psSlider.addEventListener('input', () => {
    pageSize = parseInt(psSlider.value);
    document.getElementById('mem-ps-val').textContent = pageSize;
    resetAndRedraw();
  });
  framesSlider.addEventListener('input', () => {
    memoryFrames = parseInt(framesSlider.value);
    document.getElementById('mem-frames-val').textContent = memoryFrames;
    resetAndRedraw();
  });

  document.getElementById('mem-alloc-btn').addEventListener('click', allocateProcess);
  document.getElementById('mem-clear-btn').addEventListener('click', () => {
    processes = []; pidCounter = 1;
    redraw();
  });
  document.getElementById('mem-guide-btn').addEventListener('click', () => openGuide('memory'));
  redraw();
}

function resetAndRedraw() { processes = []; pidCounter = 1; redraw(); }

function allocateProcess() {
  const size = parseInt(document.getElementById('mem-proc-size').value) || 1;
  const pages = Math.ceil(size / pageSize);
  const frames = getFreeFrames();
  if (frames.length < pages) {
    showToast(`Not enough memory! Need ${pages} frames, only ${frames.length} free.`, 'error');
    return;
  }
  const assigned = frames.slice(0, pages);
  const internalFrag = (pages * pageSize) - size;
  const color = COLORS[(pidCounter - 1) % COLORS.length];
  processes.push({ id: `P${pidCounter++}`, size, pages, frames: assigned, color, frag: internalFrag });
  redraw();
  showToast(`Allocated ${pages} frames for process (${internalFrag} KB wasted)`, 'success');
}

function getUsedFrames() {
  const used = new Set();
  processes.forEach(p => p.frames.forEach(f => used.add(f)));
  return used;
}

function getFreeFrames() {
  const used = getUsedFrames();
  const free = [];
  for (let i = 0; i < memoryFrames; i++) if (!used.has(i)) free.push(i);
  return free;
}

function redraw() {
  const used = getUsedFrames();
  const totalFrag = processes.reduce((s, p) => s + p.frag, 0);

  document.getElementById('mem-stat-used').textContent = used.size;
  document.getElementById('mem-stat-free').textContent = memoryFrames - used.size;
  document.getElementById('mem-stat-frag').textContent = `${totalFrag} KB`;

  // Grid
  const grid = document.getElementById('mem-grid');
  grid.style.gridTemplateColumns = `repeat(${Math.min(memoryFrames, 8)}, 1fr)`;
  grid.innerHTML = '';
  for (let i = 0; i < memoryFrames; i++) {
    const proc = processes.find(p => p.frames.includes(i));
    const cell = document.createElement('div');
    cell.style.cssText = `aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:var(--font-mono);transition:all 0.3s;border:1px solid var(--border);`;
    if (proc) {
      cell.style.background = proc.color + '30';
      cell.style.borderColor = proc.color;
      cell.style.color = proc.color;
      cell.textContent = proc.id;
      cell.title = `Frame ${i} → ${proc.id}`;
    } else {
      cell.style.background = 'var(--bg-surface)';
      cell.style.color = 'var(--text-dim)';
      cell.textContent = i;
    }
    cell.style.animation = 'blockPop 0.3s ease both';
    grid.appendChild(cell);
  }

  // Process list
  const list = document.getElementById('mem-proc-list');
  if (!processes.length) {
    list.innerHTML = '<div class="empty-state"><span class="icon">📋</span><p>No processes allocated</p></div>';
  } else {
    list.innerHTML = `<table class="data-table">
      <thead><tr><th>Process</th><th>Size</th><th>Pages</th><th>Frag</th><th></th></tr></thead>
      <tbody>${processes.map((p,i) => `
        <tr>
          <td><span class="proc-dot" style="background:${p.color}"></span>${p.id}</td>
          <td>${p.size} KB</td>
          <td>${p.pages}</td>
          <td style="color:${p.frag>0?'#f59e0b':'#22c55e'}">${p.frag} KB</td>
          <td><button class="btn btn-danger btn-sm" onclick="window._memDel(${i})">✕</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
    window._memDel = (i) => { processes.splice(i, 1); redraw(); };
  }

  // Page table for selected (last) process
  const ptEl = document.getElementById('mem-page-table');
  if (!processes.length) {
    ptEl.innerHTML = '<div class="empty-state"><span class="icon">📋</span><p>Allocate a process to see its page table</p></div>';
  } else {
    const p = processes[processes.length - 1];
    ptEl.innerHTML = `
      <div style="padding:10px 16px;font-size:12px;color:var(--text-muted);border-bottom:1px solid var(--border)">Showing: <strong style="color:${p.color}">${p.id}</strong></div>
      <table class="data-table">
        <thead><tr><th>Page #</th><th>Frame #</th><th>Valid</th><th>Logical Addr Range</th><th>Physical Addr</th></tr></thead>
        <tbody>${p.frames.map((f, pg) => `
          <tr>
            <td style="color:var(--accent-memory)">${pg}</td>
            <td style="color:#a78bfa">${f}</td>
            <td><span style="color:#22c55e">✓</span></td>
            <td style="font-size:11px">${pg*pageSize*1024}–${(pg+1)*pageSize*1024-1}</td>
            <td style="font-size:11px">${f*pageSize*1024}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }
}
