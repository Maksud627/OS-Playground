import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

export function renderReplacement(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(6,182,212,.15)">📄</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#22d3ee">Page Replacement</h1>
        <p class="module-subtitle">Enter a reference string and watch page faults flash in real time. Compare fault counts across four algorithms.</p>
      </div>
      <button class="btn btn-secondary" id="pr-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Configuration</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Reference String (space-separated)</label>
              <input class="form-input" id="pr-string" value="1 2 3 4 1 2 5 1 2 3 4 5" placeholder="e.g. 1 2 3 4 1 2 5">
            </div>
            <div class="form-group">
              <label class="form-label">Number of Frames: <strong id="pr-frames-val">3</strong></label>
              <input class="form-range" id="pr-frames" type="range" min="1" max="7" value="3">
            </div>
            <div class="form-group">
              <label class="form-label">Algorithm</label>
              <select class="form-select" id="pr-algo">
                <option value="fifo">FIFO — First In First Out</option>
                <option value="lru" selected>LRU — Least Recently Used</option>
                <option value="optimal">Optimal (Bélády's)</option>
                <option value="clock">Clock (Second Chance)</option>
              </select>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-replace" id="pr-run-btn" style="flex:1">▶ Simulate</button>
              <button class="btn btn-secondary" id="pr-step-btn">⏭ Step</button>
            </div>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Algorithm Comparison</span></div>
          <div id="pr-compare" style="padding:16px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">Run simulation to compare</p>
          </div>
        </div>

        <div class="concept-box replace">
          <h4>📚 Concept</h4>
          <p id="pr-concept">LRU evicts the page that was least recently used. It approximates optimal but requires tracking usage history. A page fault occurs whenever the requested page is not in any frame.</p>
        </div>
      </div>

      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#ef4444" id="pr-stat-faults">—</div><div class="stat-label">Page Faults</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="pr-stat-hits">—</div><div class="stat-label">Page Hits</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#38bdf8" id="pr-stat-ratio">—</div><div class="stat-label">Hit Ratio</div></div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Frame Visualization</span>
            <span id="pr-step-label" style="font-size:12px;color:var(--text-muted)"></span>
          </div>
          <div style="padding:16px;overflow-x:auto">
            <div id="pr-viz" style="min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:14px">
              Run a simulation to see frame states
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  bindReplacement();
}

function bindReplacement() {
  const framesSlider = document.getElementById('pr-frames');
  framesSlider.addEventListener('input', () => {
    document.getElementById('pr-frames-val').textContent = framesSlider.value;
  });

  const CONCEPTS = {
    fifo: 'FIFO evicts the oldest page in memory (first to arrive = first to leave). Simple but suffers from Bélády\'s Anomaly — more frames can cause MORE faults.',
    lru: 'LRU evicts the page that was least recently used. It approximates optimal but requires tracking usage history. A page fault occurs whenever the requested page is not in any frame.',
    optimal: 'Optimal (Bélády\'s) evicts the page that won\'t be used for the longest time in the future. It has the lowest possible fault rate but is theoretical — requires knowing the future.',
    clock: 'Clock (Second Chance) gives each page a reference bit. On fault, it scans pages: if bit=1, clear it and move on; if bit=0, evict it. A good LRU approximation used in real OSes.'
  };

  document.getElementById('pr-algo').addEventListener('change', (e) => {
    document.getElementById('pr-concept').textContent = CONCEPTS[e.target.value];
  });

  document.getElementById('pr-guide-btn').addEventListener('click', () => openGuide('replacement'));

  let stepState = null;
  let stepIndex = 0;

  document.getElementById('pr-run-btn').addEventListener('click', () => {
    const refStr = document.getElementById('pr-string').value.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    const frames = parseInt(framesSlider.value);
    const algo = document.getElementById('pr-algo').value;
    if (!refStr.length) { showToast('Enter a valid reference string', 'error'); return; }

    const result = simulate(algo, refStr, frames);
    stepState = { result, refStr, frames };
    stepIndex = refStr.length - 1;
    renderFull(result, refStr, frames);
    renderCompare(refStr, frames);
    showToast(`Simulation done: ${result.faults} page faults`, result.faults > refStr.length/2 ? 'warning' : 'success');
  });

  document.getElementById('pr-step-btn').addEventListener('click', () => {
    const refStr = document.getElementById('pr-string').value.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    const frames = parseInt(framesSlider.value);
    const algo = document.getElementById('pr-algo').value;
    if (!refStr.length) { showToast('Enter a reference string first', 'error'); return; }

    stepIndex = (stepIndex === undefined || stepIndex >= refStr.length - 1) ? 0 : stepIndex + 1;
    const partialRef = refStr.slice(0, stepIndex + 1);
    const result = simulate(algo, partialRef, frames);
    stepState = { result, refStr: partialRef, frames };
    renderFull(result, partialRef, frames);
    document.getElementById('pr-step-label').textContent = `Step ${stepIndex + 1} / ${refStr.length}`;
  });
}

function simulate(algo, refStr, numFrames) {
  if (algo === 'fifo') return fifo(refStr, numFrames);
  if (algo === 'lru') return lru(refStr, numFrames);
  if (algo === 'optimal') return optimal(refStr, numFrames);
  return clock(refStr, numFrames);
}

function fifo(ref, n) {
  let frames = [], pointer = 0, faults = 0, hits = 0;
  const steps = ref.map(page => {
    const hit = frames.includes(page);
    let evicted = null;
    if (hit) { hits++; }
    else {
      faults++;
      if (frames.length < n) frames.push(page);
      else { evicted = frames[pointer]; frames[pointer] = page; pointer = (pointer + 1) % n; }
    }
    return { page, frames: [...frames], fault: !hit, evicted };
  });
  return { steps, faults, hits };
}

function lru(ref, n) {
  let frames = [], faults = 0, hits = 0;
  const steps = ref.map((page, i) => {
    const hit = frames.includes(page);
    let evicted = null;
    if (hit) { hits++; frames = [frames.filter(f => f !== page), page].flat(); }
    else {
      faults++;
      if (frames.length < n) frames.push(page);
      else { evicted = frames[0]; frames.shift(); frames.push(page); }
    }
    return { page, frames: [...frames], fault: !hit, evicted };
  });
  return { steps, faults, hits };
}

function optimal(ref, n) {
  let frames = [], faults = 0, hits = 0;
  const steps = ref.map((page, i) => {
    const hit = frames.includes(page);
    let evicted = null;
    if (hit) { hits++; }
    else {
      faults++;
      if (frames.length < n) frames.push(page);
      else {
        // find page used furthest in future
        let victim = frames[0], maxDist = -1;
        frames.forEach(f => {
          const next = ref.indexOf(f, i + 1);
          const dist = next === -1 ? Infinity : next;
          if (dist > maxDist) { maxDist = dist; victim = f; }
        });
        evicted = victim;
        frames[frames.indexOf(victim)] = page;
      }
    }
    return { page, frames: [...frames], fault: !hit, evicted };
  });
  return { steps, faults, hits };
}

function clock(ref, n) {
  let frames = new Array(n).fill(null);
  let bits = new Array(n).fill(0);
  let pointer = 0, faults = 0, hits = 0;
  const steps = ref.map(page => {
    const idx = frames.indexOf(page);
    let evicted = null;
    if (idx !== -1) { hits++; bits[idx] = 1; }
    else {
      faults++;
      while (bits[pointer] === 1) { bits[pointer] = 0; pointer = (pointer + 1) % n; }
      evicted = frames[pointer];
      frames[pointer] = page;
      bits[pointer] = 1;
      pointer = (pointer + 1) % n;
    }
    return { page, frames: [...frames], fault: idx === -1, evicted };
  });
  return { steps, faults, hits };
}

function renderFull(result, refStr, frames) {
  const { steps, faults, hits } = result;
  const total = faults + hits;
  document.getElementById('pr-stat-faults').textContent = faults;
  document.getElementById('pr-stat-hits').textContent = hits;
  document.getElementById('pr-stat-ratio').textContent = total ? (hits/total*100).toFixed(1)+'%' : '—';

  const viz = document.getElementById('pr-viz');
  viz.innerHTML = '';

  // Build column-based visualization
  const tableWrap = document.createElement('div');
  tableWrap.style.cssText = 'display:flex;gap:4px;align-items:flex-start;';

  // Label column
  const labelCol = document.createElement('div');
  labelCol.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-right:4px;';
  labelCol.innerHTML = `<div style="height:28px"></div>${Array.from({length:frames},(_,i)=>`<div style="height:32px;display:flex;align-items:center;font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">F${i}</div>`).join('')}<div style="height:20px;margin-top:4px;font-size:11px;color:var(--text-muted)">Fault?</div>`;
  tableWrap.appendChild(labelCol);

  steps.forEach((step, i) => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

    // Reference page header
    const hdr = document.createElement('div');
    hdr.style.cssText = `height:28px;width:32px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-primary);`;
    hdr.textContent = step.page;
    col.appendChild(hdr);

    // Frame cells
    for (let f = 0; f < frames; f++) {
      const cell = document.createElement('div');
      const val = step.frames[f];
      const isNew = step.fault && val === step.page && step.frames.indexOf(val) === f;
      cell.style.cssText = `width:32px;height:32px;border-radius:6px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;transition:all 0.2s;`;
      if (val != null) {
        cell.textContent = val;
        cell.style.background = isNew ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)';
        cell.style.borderColor = isNew ? '#ef4444' : 'var(--border)';
        cell.style.color = isNew ? '#f87171' : 'var(--text-primary)';
        if (isNew) cell.style.animation = 'blockPop 0.3s ease both';
      } else {
        cell.style.background = 'transparent';
      }
      col.appendChild(cell);
    }

    // Fault indicator
    const fault = document.createElement('div');
    fault.style.cssText = `height:20px;margin-top:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;`;
    fault.textContent = step.fault ? '✕' : '✓';
    fault.style.color = step.fault ? '#ef4444' : '#22c55e';
    col.appendChild(fault);

    tableWrap.appendChild(col);
  });
  viz.appendChild(tableWrap);
}

function renderCompare(refStr, frames) {
  const algos = ['fifo','lru','optimal','clock'];
  const names = { fifo:'FIFO', lru:'LRU', optimal:'Optimal', clock:'Clock' };
  const colors = { fifo:'#7c3aed', lru:'#0ea5e9', optimal:'#22c55e', clock:'#f59e0b' };
  const results = algos.map(a => ({ name: names[a], color: colors[a], ...simulate(a, refStr, frames) }));
  const maxFaults = Math.max(...results.map(r => r.faults)) || 1;

  document.getElementById('pr-compare').innerHTML = results.map(r => `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
        <span style="color:${r.color};font-weight:600">${r.name}</span>
        <span style="font-family:var(--font-mono);font-weight:700">${r.faults} faults</span>
      </div>
      <div style="background:var(--bg-surface);border-radius:99px;height:8px;overflow:hidden">
        <div style="height:100%;width:${(r.faults/maxFaults*100).toFixed(1)}%;background:${r.color};border-radius:99px;transition:width 0.6s ease"></div>
      </div>
    </div>`).join('');
}
