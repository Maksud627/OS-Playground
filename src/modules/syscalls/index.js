import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'syscalls';
let trace = [];
let syscallDefs = null;

export function renderSyscalls(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(236,72,153,.15)">🔧</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#f472b6">System Calls</h1>
        <p class="module-subtitle">See how user-space programs request OS services through system calls. Trace fork(), open(), read(), write(), and more.</p>
      </div>
      <button class="btn btn-secondary" id="sc-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Make a System Call</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">System Call</label>
              <select class="form-select" id="sc-call">
                <option value="fork">fork() — Create child process</option>
                <option value="exec">exec() — Replace process image</option>
                <option value="open">open() — Open a file</option>
                <option value="read">read() — Read from file descriptor</option>
                <option value="write">write() — Write to file descriptor</option>
                <option value="close">close() — Close file descriptor</option>
                <option value="mmap">mmap() — Map file into memory</option>
                <option value="wait">wait() — Wait for child process</option>
              </select>
            </div>
            <div class="form-group" id="sc-args-group">
              <label class="form-label">Arguments</label>
              <input class="form-input" id="sc-args" value="" placeholder="e.g. STDOUT, Hello World, 11">
            </div>
            <button class="btn btn-primary" id="sc-invoke-btn" style="width:100%;background:#ec4899;box-shadow:0 0 20px rgba(236,72,153,.3)">⚡ Invoke System Call</button>
            <button class="btn btn-danger" id="sc-clear-btn" style="width:100%;margin-top:6px">Clear Trace</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">System Call Catalog</span></div>
          <div id="sc-catalog" style="padding:12px"></div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">User ↔ Kernel Diagram</span></div>
          <div style="padding:16px">
            <canvas id="sc-canvas" height="240" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">System Call Trace</span></div>
          <div id="sc-trace" style="padding:12px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">No system calls invoked yet</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  trace = [];

  const scCall = document.getElementById('sc-call');
  scCall.addEventListener('change', () => {
    const c = scCall.value;
    if (c === 'fork' || c === 'wait') document.getElementById('sc-args-group').style.display = 'none';
    else document.getElementById('sc-args-group').style.display = 'block';
    if (c === 'open') document.getElementById('sc-args').value = 'notes.txt, O_RDWR, 0644';
    else if (c === 'read') document.getElementById('sc-args').value = '3, buf, 128';
    else if (c === 'write') document.getElementById('sc-args').value = '1, Hello World, 11';
    else if (c === 'close') document.getElementById('sc-args').value = '3';
    else if (c === 'exec') document.getElementById('sc-args').value = '/bin/ls, argv[], envp[]';
    else if (c === 'mmap') document.getElementById('sc-args').value = 'NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE, fd, 0';
  });
  scCall.dispatchEvent(new Event('change'));

  document.getElementById('sc-guide-btn').addEventListener('click', () => openGuide('syscalls'));
  document.getElementById('sc-invoke-btn').addEventListener('click', invokeSyscall);
  document.getElementById('sc-clear-btn').addEventListener('click', () => { trace = []; saveState(KEY, { trace }); redrawSC(); });

  redrawSC();
}

function invokeSyscall() {
  const call = document.getElementById('sc-call').value;
  const args = document.getElementById('sc-args').value;
  const time = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = { call, args, time, ret: null, mode: 'user' };

  const modes = [];
  modes.push({ ...entry, step: 'User-space call' });
  modes.push({ ...entry, step: 'Trap to kernel (int 0x80 / syscall)', mode: 'transition' });
  modes.push({ ...entry, step: `Kernel: sys_${call}() executing`, mode: 'kernel' });

  if (call === 'fork') {
    entry.ret = '42 (child PID)';
    modes.push({ ...entry, step: 'Kernel: copy PCB, allocate new PID', mode: 'kernel' });
  } else if (call === 'open') {
    entry.ret = '3 (fd)';
    modes.push({ ...entry, step: 'Kernel: lookup inode, check permissions, allocate FD', mode: 'kernel' });
  } else if (call === 'read') {
    entry.ret = '128 (bytes read)';
    modes.push({ ...entry, step: 'Kernel: read blocks from disk into buffer', mode: 'kernel' });
  } else if (call === 'write') {
    entry.ret = '11 (bytes written)';
    modes.push({ ...entry, step: 'Kernel: write buffer to file/device', mode: 'kernel' });
  } else if (call === 'close') {
    entry.ret = '0 (success)';
    modes.push({ ...entry, step: 'Kernel: free FD, decrement inode refcount', mode: 'kernel' });
  } else if (call === 'mmap') {
    entry.ret = '0x7f000000 (mapped addr)';
    modes.push({ ...entry, step: 'Kernel: set up page table entries, mark lazy', mode: 'kernel' });
  } else if (call === 'exec') {
    entry.ret = '(does not return on success)';
    modes.push({ ...entry, step: 'Kernel: load ELF, set up new address space', mode: 'kernel' });
  } else if (call === 'wait') {
    entry.ret = '42 (child PID)';
    modes.push({ ...entry, step: 'Kernel: block calling process until child exits', mode: 'kernel' });
  }

  modes.push({ ...entry, step: `Return to user space: ${entry.ret}`, mode: 'transition' });
  trace.push({ entry, modes });
  redrawSC();
  showToast(`${call}() → returned ${entry.ret}`, 'success');
}

function redrawSC() {
  renderTrace();
  renderCatalog();
  drawDiagram();
}

const CATALOG = [
  { name: 'fork()', desc: 'Create child process. Returns 0 in child, child PID in parent.' },
  { name: 'exec()', desc: 'Replace process image with new program. Does not return on success.' },
  { name: 'open()', desc: 'Open file, return file descriptor. Requires path and flags (O_RDONLY, O_WRONLY, O_RDWR).' },
  { name: 'read()', desc: 'Read bytes from file descriptor into buffer. Returns bytes read.' },
  { name: 'write()', desc: 'Write bytes from buffer to file descriptor. Returns bytes written.' },
  { name: 'close()', desc: 'Close file descriptor. Frees kernel FD table entry.' },
  { name: 'mmap()', desc: 'Map file or anonymous memory into address space. Foundation of demand paging.' },
  { name: 'wait()', desc: 'Wait for child process to change state. Returns child PID on exit.' },
];

function renderCatalog() {
  document.getElementById('sc-catalog').innerHTML = CATALOG.map(c => `
    <div style="padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#f472b6">${c.name}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${c.desc}</div>
    </div>`).join('');
}

function renderTrace() {
  const el = document.getElementById('sc-trace');
  if (!trace.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center">No system calls invoked yet</p>';
    return;
  }
  el.innerHTML = trace.map(t => `
    <div style="margin-bottom:12px;border:1px solid var(--border);border-radius:8px;overflow:hidden">
      <div style="background:rgba(236,72,153,.1);padding:8px 12px;font-family:var(--font-mono);font-size:12px;color:#f472b6;font-weight:700">
        sys_${t.entry.call}(${t.entry.args || ''}) → ${t.entry.ret}
      </div>
      <div style="padding:6px 12px">
        ${t.modes.map(m => {
          const colors = { user: '#475569', transition: '#f59e0b', kernel: '#ef4444' };
          const icons = { user: '👤', transition: '🔄', kernel: '⚙️' };
          return `<div style="display:flex;gap:8px;font-size:11px;font-family:var(--font-mono);padding:2px 0;color:${colors[m.mode] || '#fff'}">
            <span>${icons[m.mode] || ''}</span>
            <span>${m.step}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

function drawDiagram() {
  const canvas = document.getElementById('sc-canvas');
  if (!canvas) return;
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // User space (top half)
  const midY = H / 2;

  ctx.fillStyle = 'rgba(236,72,153,0.05)';
  ctx.fillRect(0, 0, W, midY);
  ctx.fillStyle = 'rgba(239,68,68,0.05)';
  ctx.fillRect(0, midY, W, H - midY);

  // Labels
  ctx.fillStyle = '#f472b6'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center';
  ctx.fillText('USER SPACE (Ring 3)', W/2, midY/2);
  ctx.fillStyle = '#f87171'; ctx.textAlign = 'center';
  ctx.fillText('KERNEL SPACE (Ring 0)', W/2, midY + midY/2);

  // Dividing line
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
  ctx.setLineDash([]);

  // Draw transition arrows
  const lastTrace = trace.length > 0 ? trace[trace.length - 1] : null;
  if (lastTrace) {
    const numSteps = lastTrace.modes.length;
    lastTrace.modes.forEach((m, i) => {
      const x = W * 0.1 + (W * 0.8 / (numSteps - 1)) * i;
      const y = m.mode === 'user' ? midY * 0.6 : m.mode === 'transition' ? midY : midY * 1.4;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = m.mode === 'user' ? '#475569' : m.mode === 'transition' ? '#f59e0b' : '#ef4444';
      ctx.fill();

      if (i > 0) {
        const prevMode = lastTrace.modes[i - 1];
        const px = W * 0.1 + (W * 0.8 / (numSteps - 1)) * (i - 1);
        const py = prevMode.mode === 'user' ? midY * 0.6 : prevMode.mode === 'transition' ? midY : midY * 1.4;
        ctx.strokeStyle = m.mode === 'kernel' ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();

        const ang = Math.atan2(y - py, x - px);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8 * Math.cos(ang - 0.4), y - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(x - 8 * Math.cos(ang + 0.4), y - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      }
    });
  } else {
    // Show static system call path
    ctx.fillStyle = '#475569'; ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Application calls open()', 20, midY * 0.4);
    ctx.fillText('Enter kernel via trap', 20, midY + 24);
    ctx.fillText('Kernel executes sys_open()', 20, midY * 1.6);
  }
}
