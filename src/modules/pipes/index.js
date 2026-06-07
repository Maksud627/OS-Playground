import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'pipes';
let pipeData = '', log = [];

export function renderPipes(container) {
  const saved = loadState(KEY);
  if (saved) { pipeData = saved.pipeData || ''; log = saved.log || []; }

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(59,130,246,.15)">🔗</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#60a5fa">Pipes</h1>
        <p class="module-subtitle">Connect two processes with a unidirectional byte stream. Write on fd[1], read from fd[0].</p>
      </div>
      <button class="btn btn-secondary" id="pipe-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Write to Pipe (fd[1])</span></div>
          <div class="panel-body">
            <div class="form-group">
              <input class="form-input" id="pipe-input" placeholder="Type a message to pipe...">
            </div>
            <button class="btn btn-primary" id="pipe-write-btn" style="width:100%">📤 write(fd[1], msg)</button>
          </div>
        </div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Read from Pipe (fd[0])</span></div>
          <div class="panel-body">
            <button class="btn btn-primary" id="pipe-read-btn" style="width:100%">📥 read(fd[0])</button>
            <div id="pipe-read-result" style="margin-top:12px;text-align:center;font-family:var(--font-mono);font-size:14px;color:var(--text-muted)">No data read yet</div>
          </div>
        </div>
        <button class="btn btn-secondary" id="pipe-reset-btn" style="width:100%">↺ Close & Reopen Pipe</button>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Pipe Visualization</span></div>
          <div style="padding:20px">
            <canvas id="pipe-canvas" height="180" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#60a5fa" id="pipe-bytes">${pipeData.length}</div><div class="stat-label">Bytes in Pipe</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="pipe-writes">0</div><div class="stat-label">Writes</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#f59e0b" id="pipe-reads">0</div><div class="stat-label">Reads</div></div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Pipe Properties</span></div>
        <div class="panel-body" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
          <div><strong>Type:</strong> Half-duplex (unidirectional)</div><div><strong>Buffer Size:</strong> 65536 bytes (PIPE_BUF)</div>
          <div><strong>fd[0]:</strong> Read end</div><div><strong>fd[1]:</strong> Write end</div>
          <div><strong>Blocks on:</strong> empty read / full write</div><div><strong>Close:</strong> close(fd[0]); close(fd[1])</div>
        </div>
      </div>
    </div>
  </div>`;

  let writes = 0, reads = 0;

  function persist() { saveState(KEY, { pipeData, log }); }
  function addLog(msg, type) {
    log.unshift({ msg, type, time: new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
    if (log.length > 20) log.pop();
    persist();
  }
  function redraw() {
    document.getElementById('pipe-bytes').textContent = pipeData.length;
    document.getElementById('pipe-writes').textContent = writes;
    document.getElementById('pipe-reads').textContent = reads;
    drawCanvas();
  }
  function drawCanvas() {
    const canvas = document.getElementById('pipe-canvas');
    if (!canvas) return;
    const W = canvas.width = canvas.offsetWidth || 500, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Process A (left)
    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Process A', W * 0.18, 30);
    ctx.fillText('(Writer)', W * 0.18, 48);
    ctx.beginPath(); ctx.arc(W * 0.18, H / 2, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124,58,237,.2)'; ctx.fill();
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter'; ctx.fillText('👤', W * 0.18, H / 2 + 6);

    // Process B (right)
    ctx.fillStyle = '#22c55e'; ctx.font = 'bold 13px Inter';
    ctx.fillText('Process B', W * 0.82, 30);
    ctx.fillText('(Reader)', W * 0.82, 48);
    ctx.beginPath(); ctx.arc(W * 0.82, H / 2, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34,197,94,.2)'; ctx.fill();
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter'; ctx.fillText('👤', W * 0.82, H / 2 + 6);

    // Pipe
    const pipeY = H / 2;
    const pipeLeft = W * 0.18 + 30, pipeRight = W * 0.82 - 30;
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pipeLeft, pipeY); ctx.lineTo(pipeRight, pipeY); ctx.stroke();

    // Data inside pipe
    const fillPct = Math.min(pipeData.length / 100, 1);
    if (fillPct > 0) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(pipeLeft, pipeY); ctx.lineTo(pipeLeft + (pipeRight - pipeLeft) * fillPct, pipeY); ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#ef4444'; ctx.font = '10px JetBrains Mono';
    ctx.fillText('fd[1]', pipeLeft - 10, pipeY - 10);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('fd[0]', pipeRight + 10, pipeY - 10);
    ctx.fillStyle = '#60a5fa'; ctx.font = '10px Inter';
    ctx.fillText('Kernel Pipe Buffer', (pipeLeft + pipeRight) / 2, pipeY - 12);

    // Data preview
    if (pipeData) {
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(`"${pipeData.slice(0, 30)}${pipeData.length > 30 ? '...' : ''}"`, W / 2, pipeY + 24);
    }
  }

  document.getElementById('pipe-guide-btn').addEventListener('click', () => openGuide('pipes'));
  document.getElementById('pipe-write-btn').addEventListener('click', () => {
    const msg = document.getElementById('pipe-input').value || ('data_' + Date.now());
    pipeData += msg;
    writes++;
    addLog(`write(fd[1], "${msg}") → ${pipeData.length} bytes`, 'success');
    showToast(`Wrote "${msg}"`, 'success');
    document.getElementById('pipe-input').value = '';
    redraw();
  });
  document.getElementById('pipe-read-btn').addEventListener('click', () => {
    if (!pipeData) { showToast('Pipe is empty!', 'warning'); return; }
    const read = pipeData.slice(0, 8);
    pipeData = pipeData.slice(8);
    reads++;
    document.getElementById('pipe-read-result').textContent = `read(fd[0]) → "${read}"`;
    document.getElementById('pipe-read-result').style.color = '#22c55e';
    addLog(`read(fd[0]) → "${read}"`, 'info');
    redraw();
  });
  document.getElementById('pipe-reset-btn').addEventListener('click', () => { pipeData = ''; writes = 0; reads = 0; log = []; persist(); redraw(); document.getElementById('pipe-read-result').textContent = 'No data read yet'; document.getElementById('pipe-read-result').style.color = 'var(--text-muted)'; });
  redraw();
}
