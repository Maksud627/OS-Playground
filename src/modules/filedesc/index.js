import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'filedesc';
let fdTable = [0,1,2]; let nextFd = 3; let log = [];

export function renderFileDesc(container) {
  const saved = loadState(KEY);
  if (saved) { fdTable = saved.fdTable || [0,1,2]; nextFd = saved.nextFd || 3; log = saved.log || []; }

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(14,165,233,.15)">📋</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#38bdf8">File Descriptors</h1>
        <p class="module-subtitle">Every process has a file descriptor table. See how open() allocates FDs, close() frees them, and fd 0/1/2 are reserved.</p>
      </div>
      <button class="btn btn-secondary" id="fd-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Operations</span></div>
          <div class="panel-body">
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
              <button class="btn btn-primary" id="fd-open-btn" style="background:#0ea5e9">open("file.txt")</button>
              <button class="btn btn-danger" id="fd-close-btn">close(fd)</button>
            </div>
            <div class="form-group"><label class="form-label">Close FD #</label><input class="form-input" id="fd-close-num" type="number" min="3" value="3"></div>
            <button class="btn btn-secondary" id="fd-reset-btn" style="width:100%">↺ Reset</button>
          </div>
        </div>
        <div class="concept-box" style="border-left-color:#0ea5e9">
          <h4>📚 How FDs Work</h4>
          <p><strong>0 (stdin):</strong> Standard input — keyboard by default<br>
          <strong>1 (stdout):</strong> Standard output — terminal by default<br>
          <strong>2 (stderr):</strong> Standard error — terminal by default<br>
          <strong>open()</strong> returns the <em>lowest available</em> FD number. <strong>close()</strong> frees the slot for reuse.</p>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Process FD Table</span></div>
          <div id="fd-table" style="padding:12px"></div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Event Log</span></div>
          <div class="log-area" id="fd-log" style="max-height:140px"></div>
        </div>
      </div>
    </div>
  </div>`;

  function persist() { saveState(KEY, { fdTable: [...fdTable], nextFd, log }); }
  function addLog(msg, type) {
    log.unshift({ msg, type, time: new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
    if (log.length > 20) log.pop();
    document.getElementById('fd-log').innerHTML = log.map(l => `<div class="log-entry ${l.type}"><span class="log-time">${l.time}</span><span class="log-msg">${l.msg}</span></div>`).join('');
    persist();
  }
  function redraw() {
    const rows = [];
    for (let i = 0; i <= Math.max(...fdTable, 5); i++) {
      const inUse = fdTable.includes(i);
      rows.push(`<tr style="background:${inUse ? (i<3 ? 'rgba(14,165,233,.05)' : 'rgba(34,197,94,.05)') : 'transparent'}">
        <td style="font-weight:700">${i}</td>
        <td>${i===0?'stdin':i===1?'stdout':i===2?'stderr':inUse?'file.txt':'<span style="color:var(--text-dim)">free</span>'}</td>
        <td style="color:${inUse?'#22c55e':'var(--text-dim)'}">${inUse?'OPEN':'—'}</td>
      </tr>`);
    }
    document.getElementById('fd-table').innerHTML = `<table class="data-table">
      <thead><tr><th>FD #</th><th>File</th><th>Status</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
  }

  document.getElementById('fd-guide-btn').addEventListener('click', () => openGuide('filedesc'));
  document.getElementById('fd-open-btn').addEventListener('click', () => {
    while (fdTable.includes(nextFd)) nextFd++;
    fdTable.push(nextFd);
    addLog(`open("file.txt") → returned FD ${nextFd}`, 'success');
    showToast(`Opened file.txt → fd ${nextFd}`, 'success');
    nextFd = Math.max(nextFd + 1, 3);
    redraw();
  });
  document.getElementById('fd-close-btn').addEventListener('click', () => {
    const fd = parseInt(document.getElementById('fd-close-num').value);
    if (fd < 3) { showToast('Cannot close stdin/stdout/stderr!', 'error'); return; }
    const idx = fdTable.indexOf(fd);
    if (idx === -1) { showToast(`FD ${fd} is not open!`, 'warning'); return; }
    fdTable.splice(idx, 1);
    nextFd = Math.min(nextFd, fd);
    addLog(`close(${fd}) → freed`, 'info');
    showToast(`Closed fd ${fd}`, 'info');
    redraw();
  });
  document.getElementById('fd-reset-btn').addEventListener('click', () => { fdTable = [0,1,2]; nextFd = 3; log = []; persist(); redraw(); });
  if (log.length) addLog('Restored from localStorage', 'info');
  redraw();
}
