import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

export function renderContextSwitch(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(245,158,11,.15)">⏭️</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#fbbf24">Context Switching</h1>
        <p class="module-subtitle">Watch what happens when the CPU switches from one process to another — step by step.</p>
      </div>
      <button class="btn btn-secondary" id="cs-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Context Switch Steps</span></div>
          <div class="panel-body" style="line-height:2;font-size:13px">
            <div id="cs-steps">
              <p style="color:var(--text-muted)">Press "Trigger Switch" to step through</p>
            </div>
            <button class="btn btn-primary" id="cs-trigger-btn" style="width:100%;margin-top:12px;background:#f59e0b;color:#000">⚡ Trigger Context Switch</button>
            <button class="btn btn-secondary" id="cs-auto-btn" style="width:100%;margin-top:6px">🔄 Auto-Switch (loop)</button>
          </div>
        </div>
        <div class="concept-box" style="border-left-color:#f59e0b">
          <h4>📚 The Cost</h4>
          <p>Context switches are <strong>expensive</strong>: ~1-5µs on modern CPUs. At 1000 switches/sec, that's 0.1-0.5% CPU time wasted — and real systems do thousands/sec. This is why thread pools and async I/O exist — to <strong>reduce</strong> context switches.</p>
        </div>
      </div>
      <div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#fbbf24" id="cs-count">0</div><div class="stat-label">Switches</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="cs-pid">P1</div><div class="stat-label">Current Process</div></div>
        </div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">CPU Registers</span></div>
          <div id="cs-registers" style="padding:12px;font-family:var(--font-mono);font-size:12px"></div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Process Queue</span></div>
          <div id="cs-queue" style="padding:12px"></div>
        </div>
      </div>
    </div>
  </div>`;

  let current = 0, switches = 0;
  const procs = [
    { id:'P1', color:'#7c3aed', pc:'0x00401200', sp:'0x7FFF_E000', regs:['eax=42','ebx=0','ecx=128','edx=1','esi=0x1000','edi=0x2000'] },
    { id:'P2', color:'#22c55e', pc:'0x00802340', sp:'0x7FFF_D800', regs:['eax=0','ebx=99','ecx=0','edx=3','esi=0x3000','edi=0x4000'] },
    { id:'P3', color:'#f59e0b', pc:'0x00C04500', sp:'0x7FFF_D000', regs:['eax=7','ebx=1','ecx=255','edx=0','esi=0x5000','edi=0x6000'] },
  ];

  function updateDisplay() {
    const p = procs[current];
    document.getElementById('cs-count').textContent = switches;
    document.getElementById('cs-pid').textContent = p.id;
    document.getElementById('cs-pid').style.color = p.color;
    document.getElementById('cs-registers').innerHTML = `
      <div style="color:var(--text-muted);margin-bottom:4px">PCB for <strong style="color:${p.color}">${p.id}</strong></div>
      <div>PC = ${p.pc}</div><div>SP = ${p.sp}</div>
      ${p.regs.map(r => `<div>${r}</div>`).join('')}`;
    document.getElementById('cs-queue').innerHTML = procs.map((x,i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:${i===current?'rgba(255,255,255,.08)':'transparent'};border:1px solid ${i===current?x.color:'transparent'}">
        <span class="proc-dot" style="background:${x.color}"></span>
        <span style="font-size:12px;font-weight:700">${x.id}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto">${i===current?'▶ RUNNING':'⏸ Ready'}</span>
      </div>`).join('');
  }

  function doSwitch() {
    const steps = document.getElementById('cs-steps');
    const prev = procs[current];
    const old = current;
    current = (current + 1) % procs.length;
    const next = procs[current];
    switches++;

    steps.innerHTML = `
      <div style="color:#fbbf24;font-weight:700;margin-bottom:8px">Switch #${switches}: ${prev.id} → ${next.id}</div>
      <div>1. <strong style="color:#ef4444">Save</strong> ${prev.id} registers → PCB[${prev.id}]</div>
      <div>2. Save ${prev.id} program counter (${prev.pc})</div>
      <div>3. Save ${prev.id} stack pointer (${prev.sp})</div>
      <div>4. Set ${prev.id} state = <strong style="color:#f59e0b">READY</strong></div>
      <div style="height:4px"></div>
      <div>5. Pick ${next.id} from ready queue (scheduler decision)</div>
      <div>6. <strong style="color:#22c55e">Restore</strong> ${next.id} registers ← PCB[${next.id}]</div>
      <div>7. Restore ${next.id} PC = ${next.pc}</div>
      <div>8. Restore ${next.id} SP = ${next.sp}</div>
      <div>9. Set ${next.id} state = <strong style="color:#22c55e">RUNNING</strong></div>
      <div style="height:4px"></div>
      <div style="color:var(--text-dim);font-size:11px">⏱️ Overhead: TLB flush + cache locality loss + ~3µs</div>`;
    updateDisplay();
    showToast(`Switched: ${prev.id} → ${next.id}`, 'info');
  }

  document.getElementById('cs-guide-btn').addEventListener('click', () => openGuide('contextswitch'));
  document.getElementById('cs-trigger-btn').addEventListener('click', doSwitch);

  let autoTimer = null;
  document.getElementById('cs-auto-btn').addEventListener('click', function() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; this.textContent = '🔄 Auto-Switch (loop)'; return; }
    this.textContent = '⏹ Stop Auto';
    autoTimer = setInterval(doSwitch, 2000);
  });

  updateDisplay();
}
