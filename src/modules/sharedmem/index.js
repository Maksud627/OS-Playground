import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

let shmData = '', shmSize = 32;

export function renderSharedMem(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(34,197,94,.15)">🧠</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#4ade80">Shared Memory</h1>
        <p class="module-subtitle">Map a shared memory segment visible to two processes. See how shmget() + shmat() bypasses the kernel for data transfer.</p>
      </div>
      <button class="btn btn-secondary" id="sm-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Process A (Writer)</span></div>
          <div class="panel-body">
            <div class="form-group"><label class="form-label">Write to shared memory</label><input class="form-input" id="sm-write" placeholder="Message for Process B..."></div>
            <button class="btn btn-primary" id="sm-write-btn" style="width:100%;background:#22c55e">📤 shmat + write</button>
          </div>
        </div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Process B (Reader)</span></div>
          <div class="panel-body">
            <button class="btn btn-primary" id="sm-read-btn" style="width:100%;background:#7c3aed">📥 shmat + read</button>
            <div id="sm-read-result" style="margin-top:12px;text-align:center;font-family:var(--font-mono);color:var(--text-muted)">No data read yet</div>
          </div>
        </div>
        <button class="btn btn-secondary" id="sm-detach-btn" style="width:100%">✕ shmdt (Detach)</button>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Shared Memory Segment (shmid=42)</span></div>
          <div style="padding:16px;min-height:100px">
            <div style="border:2px dashed #22c55e;border-radius:10px;padding:16px;background:rgba(34,197,94,.05);text-align:center;font-family:var(--font-mono);font-size:14px;color:#4ade80;min-height:60px;display:flex;align-items:center;justify-content:center;word-break:break-all" id="sm-segment">${shmData || '(empty)'}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Physical Memory Mappings</span></div>
          <div style="padding:12px">
            <canvas id="sm-canvas" height="200" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">System Calls</span></div>
        <div class="panel-body" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:13px">
          <div><strong style="color:#22c55e">shmget()</strong><br><span style="color:var(--text-muted)">Create/open shared memory segment. Returns shmid.</span></div>
          <div><strong style="color:#22c55e">shmat()</strong><br><span style="color:var(--text-muted)">Attach segment to process address space. Returns pointer.</span></div>
          <div><strong style="color:#22c55e">shmdt()</strong><br><span style="color:var(--text-muted)">Detach segment from process. Segments persist in kernel.</span></div>
        </div>
      </div>
    </div>
  </div>`;

  function redraw() {
    document.getElementById('sm-segment').textContent = shmData || '(empty)';
    document.getElementById('sm-segment').style.color = shmData ? '#4ade80' : 'var(--text-dim)';
    const canvas = document.getElementById('sm-canvas');
    if (!canvas) return;
    const W = canvas.width = canvas.offsetWidth || 500, H = canvas.height;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Process A', W*0.2, 20);
    ctx.fillStyle = '#22c55e'; ctx.fillText('Process B', W*0.8, 20);

    ctx.beginPath(); ctx.rect(W*0.2-24, 32, 48, 60); ctx.fillStyle = 'rgba(124,58,237,.1)'; ctx.fill(); ctx.strokeStyle = '#7c3aed'; ctx.stroke();
    ctx.beginPath(); ctx.rect(W*0.8-24, 32, 48, 60); ctx.fillStyle = 'rgba(34,197,94,.1)'; ctx.fill(); ctx.strokeStyle = '#22c55e'; ctx.stroke();

    ctx.fillStyle = '#fff'; ctx.font = '20px Inter'; ctx.fillText('👤', W*0.2, 70); ctx.fillText('👤', W*0.8, 70);

    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W*0.2, 92); ctx.lineTo(W*0.2, 110); ctx.stroke();
    ctx.strokeStyle = '#22c55e';
    ctx.beginPath(); ctx.moveTo(W*0.8, 92); ctx.lineTo(W*0.8, 110); ctx.stroke();

    const shmX = W*0.25, shmW = W*0.5, shmY = 110, shmH = 50;
    ctx.fillStyle = 'rgba(34,197,94,.1)'; ctx.fillRect(shmX, shmY, shmW, shmH);
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.strokeRect(shmX, shmY, shmW, shmH);
    ctx.fillStyle = '#4ade80'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Shared Memory Segment (shmid=42)', W/2, shmY + 20);
    ctx.fillText(shmData ? `"${shmData.slice(0,25)}${shmData.length>25?'...':''}"` : '(empty)', W/2, shmY + 40);
  }

  document.getElementById('sm-guide-btn').addEventListener('click', () => openGuide('sharedmem'));
  document.getElementById('sm-write-btn').addEventListener('click', () => {
    shmData = document.getElementById('sm-write').value || ('msg_' + Date.now());
    document.getElementById('sm-write').value = '';
    showToast(`Process A wrote to shared memory`, 'success');
    redraw();
  });
  document.getElementById('sm-read-btn').addEventListener('click', () => {
    document.getElementById('sm-read-result').textContent = shmData ? `read() → "${shmData}"` : '(empty)';
    document.getElementById('sm-read-result').style.color = shmData ? '#22c55e' : 'var(--text-muted)';
    showToast(shmData ? `Process B read: "${shmData}"` : 'Nothing to read', shmData ? 'info' : 'warning');
  });
  document.getElementById('sm-detach-btn').addEventListener('click', () => {
    shmData = '';
    document.getElementById('sm-read-result').textContent = 'No data read yet';
    document.getElementById('sm-read-result').style.color = 'var(--text-muted)';
    showToast('Detached from shared memory', 'info');
    redraw();
  });

  redraw();
}
