import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'virtualmem';
let tlb = [], pageTable = {}, frames = new Array(8).fill(null), tlbSize = 4, pageSize = 4;
let tlbHits = 0, tlbMisses = 0, pageFaults = 0;

function persist() { saveState(KEY, { tlb: [...tlb], tlbSize, tlbHits, tlbMisses, pageFaults }); }

export function renderVirtualMem(container) {
  const saved = loadState(KEY);
  if (saved) { tlb = saved.tlb || []; tlbSize = saved.tlbSize || 4; tlbHits = saved.tlbHits || 0; tlbMisses = saved.tlbMisses || 0; pageFaults = saved.pageFaults || 0; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(99,102,241,.15)">💾</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#818cf8">Virtual Memory</h1>
        <p class="module-subtitle">Walk through the full address translation pipeline: TLB lookup, page table walk, page faults, and demand paging.</p>
      </div>
      <button class="btn btn-secondary" id="vm-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Address Translation</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Logical Address (decimal)</label>
              <input class="form-input" id="vm-addr" type="number" min="0" value="42" placeholder="42">
            </div>
            <div class="form-group">
              <label class="form-label">TLB Size</label>
              <input class="form-range" id="vm-tlb-size" type="range" min="2" max="8" value="4">
              <span style="font-size:11px;color:var(--text-muted)" id="vm-tlb-size-val">4 entries</span>
            </div>
            <button class="btn btn-primary" id="vm-translate-btn" style="width:100%">🔍 Translate Address</button>
            <button class="btn btn-secondary" id="vm-fault-btn" style="width:100%;margin-top:6px">💥 Trigger Page Fault</button>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Translation Steps</span></div>
          <div id="vm-steps" style="padding:14px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">Enter a logical address and click Translate</p>
          </div>
        </div>

        <div class="concept-box" style="border-left-color:#6366f1">
          <h4>📚 The Translation Pipeline</h4>
          <p><strong>1. TLB Lookup</strong> — Fast cache. Hit → physical address immediately.<br>
          <strong>2. Page Table Walk</strong> — TLB miss → check PT in memory. Slow.<br>
          <strong>3. Page Fault</strong> — Page not in frame → load from disk (swap). <em>Very</em> slow.<br>
          <strong>4. Update TLB</strong> — Cache the translation for next time.</p>
        </div>
      </div>
      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="vm-stat-hit">0</div><div class="stat-label">TLB Hits</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#f59e0b" id="vm-stat-miss">0</div><div class="stat-label">TLB Misses</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#ef4444" id="vm-stat-faults">0</div><div class="stat-label">Page Faults</div></div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">TLB (Translation Lookaside Buffer)</span></div>
          <div id="vm-tlb-table" style="padding:8px 14px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">TLB is empty. Run translations to populate.</p>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Page Table</span></div>
          <div id="vm-pt-table" style="padding:8px 14px"></div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">Physical Frames</span></div>
          <div id="vm-frames-viz" style="padding:14px;display:flex;flex-wrap:wrap;gap:4px"></div>
        </div>
      </div>
    </div>
  </div>`;

  tlb = []; pageTable = {}; frames = new Array(8).fill(null);
  tlbSize = 4;
  resetPageTable();
  bindVM();
}

function resetPageTable() {
  pageTable = {};
  for (let i = 0; i < 16; i++) {
    pageTable[i] = { frame: null, valid: false, onDisk: i < 8 };
  }
  for (let i = 0; i < 4; i++) {
    pageTable[i].frame = i;
    pageTable[i].valid = true;
    pageTable[i].onDisk = false;
    frames[i] = i;
    // Also put in TLB
    if (tlb.length < tlbSize) tlb.push({ page: i, frame: i, valid: true });
  }
  for (let i = 4; i < 8; i++) frames[i] = null;
}

function bindVM() {
  document.getElementById('vm-guide-btn').addEventListener('click', () => openGuide('virtualmem'));
  document.getElementById('vm-tlb-size').addEventListener('input', (e) => {
    tlbSize = parseInt(e.target.value);
    document.getElementById('vm-tlb-size-val').textContent = tlbSize + ' entries';
    // Trim TLB if needed
    while (tlb.length > tlbSize) tlb.pop();
    redrawVM();
  });
  document.getElementById('vm-translate-btn').addEventListener('click', translateAddress);
  document.getElementById('vm-fault-btn').addEventListener('click', triggerFault);
  redrawVM();
}

function translateAddress() {
  const addr = parseInt(document.getElementById('vm-addr').value) || 0;
  const page = Math.floor(addr / (pageSize * 1024));
  const offset = addr % (pageSize * 1024);

  const stepsEl = document.getElementById('vm-steps');
  let steps = [];
  steps.push({ icon: '📥', text: `Logical Address: ${addr} → <strong>Page ${page}, Offset ${offset}</strong>`, color: '#fff' });

  // Step 1: TLB lookup
  const tlbEntry = tlb.find(e => e.page === page && e.valid);
  if (tlbEntry) {
    tlbHits++;
    const phys = tlbEntry.frame * pageSize * 1024 + offset;
    steps.push({ icon: '✅', text: `<strong style="color:#22c55e">TLB HIT!</strong> Page ${page} → Frame ${tlbEntry.frame}. Physical Address = <strong>${phys}</strong>`, color: '#22c55e' });
    steps.push({ icon: '⏱️', text: `Time: ~1-2 CPU cycles (TLB is on-chip cache)`, color: '#94a3b8' });
  } else {
    tlbMisses++;
    steps.push({ icon: '❌', text: `<strong style="color:#f59e0b">TLB MISS</strong> — not found in TLB. Walking page table…`, color: '#f59e0b' });

    // Step 2: Page table walk
    const pte = pageTable[page];
    if (pte && pte.valid) {
      const phys = pte.frame * pageSize * 1024 + offset;
      steps.push({ icon: '📖', text: `Page Table entry: Page ${page} → <strong>Frame ${pte.frame}</strong>. Physical Address = <strong>${phys}</strong>`, color: '#0ea5e9' });
      steps.push({ icon: '⏱️', text: 'Time: ~100 CPU cycles (main memory access for PT walk + translation)', color: '#94a3b8' });

      // Update TLB
      if (tlb.length >= tlbSize) tlb.shift();
      tlb.push({ page, frame: pte.frame, valid: true });
      steps.push({ icon: '🔄', text: `Cached page ${page}→frame ${pte.frame} in TLB for future lookups`, color: '#a78bfa' });
    } else {
      // Page fault
      pageFaults++;
      steps.push({ icon: '💥', text: `<strong style="color:#ef4444">PAGE FAULT!</strong> Page ${page} is not in memory. Must load from disk.`, color: '#ef4444' });
      handlePageFault(page);
      steps.push({ icon: '💾', text: `Loaded page ${page} from disk into frame. Retrying translation…`, color: '#f59e0b' });
      steps.push({ icon: '⏱️', text: 'Time: ~10,000,000 CPU cycles (~10ms disk I/O vs ~1ns CPU cycle)', color: '#94a3b8' });
    }
  }

  stepsEl.innerHTML = steps.map(s => `
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px">
      <span style="font-size:16px">${s.icon}</span>
      <span style="font-size:13px;color:${s.color};line-height:1.5">${s.text}</span>
    </div>`).join('');

  redrawVM();
}

function handlePageFault(page) {
  const freeFrame = frames.findIndex(f => f === null);
  if (freeFrame !== -1) {
    frames[freeFrame] = page;
    pageTable[page].frame = freeFrame;
    pageTable[page].valid = true;
    pageTable[page].onDisk = false;
  }
}

function triggerFault() {
  if (!pageTable[10] || pageTable[10].valid) {
    pageTable[10] = { frame: null, valid: false, onDisk: true };
  }
  document.getElementById('vm-addr').value = 10 * pageSize * 1024 + 100;
  translateAddress();
}

function redrawVM() {
  updateStats();
  renderTLB();
  renderPageTable();
  renderFrames();
}

function updateStats() {
  document.getElementById('vm-stat-hit').textContent = tlbHits;
  document.getElementById('vm-stat-miss').textContent = tlbMisses;
  document.getElementById('vm-stat-faults').textContent = pageFaults;
}

function renderTLB() {
  const el = document.getElementById('vm-tlb-table');
  if (!el) return;
  if (!tlb.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center">TLB is empty</p>';
    return;
  }
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>Entry</th><th>Page #</th><th>Frame #</th><th>Valid</th></tr></thead>
    <tbody>${tlb.map((e, i) => `
      <tr>
        <td style="color:var(--text-muted)">#${i}</td>
        <td style="font-weight:700">${e.page}</td>
        <td style="color:#a78bfa;font-weight:700">${e.frame}</td>
        <td><span style="color:#22c55e">✓</span></td>
      </tr>`).join('')}
    </tbody></table>`;
}

function renderPageTable() {
  const el = document.getElementById('vm-pt-table');
  if (!el) return;
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const pte = pageTable[i];
    if (!pte) continue;
    rows.push(`
      <tr>
        <td style="font-weight:700">${i}</td>
        <td style="color:${pte.valid ? '#a78bfa' : '#475569'};font-weight:700">${pte.valid ? pte.frame : '—'}</td>
        <td>${pte.valid ? '<span style="color:#22c55e">Present</span>' : '<span style="color:#ef4444">On Disk</span>'}</td>
      </tr>`);
  }
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>Page</th><th>Frame</th><th>Status</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table>`;
}

function renderFrames() {
  const el = document.getElementById('vm-frames-viz');
  if (!el) return;
  el.innerHTML = frames.map((f, i) => {
    const used = f !== null;
    return `<div style="width:70px;aspect-ratio:2;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:var(--font-mono);transition:all 0.3s;border:1px solid ${used ? '#22c55e' : 'var(--border)'};background:${used ? 'rgba(34,197,94,.15)' : 'var(--bg-surface)'};color:${used ? '#22c55e' : 'var(--text-dim)'}">${used ? `P${f}` : 'free'}</div>`;
  }).join('');
}
