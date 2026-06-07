import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'piperedir';
let stdin = 'apple\nbanana\ncherry\ndate\n', stdout = '', stderr = '';

export function renderPipeRedir(container) {
  const saved = loadState(KEY);
  if (saved) { stdin = saved.stdin || stdin; stdout = saved.stdout || ''; stderr = saved.stderr || ''; }

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(59,130,246,.15)">⏩</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#60a5fa">Pipes & Redirection</h1>
        <p class="module-subtitle">Build shell pipelines and redirect stdin/stdout/stderr. See how |, >, <, and 2>&1 work.</p>
      </div>
      <button class="btn btn-secondary" id="pr-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Command Builder</span></div>
          <div class="panel-body">
            <div class="form-group"><label class="form-label">Stdin (input data)</label><textarea class="form-input" id="pr-stdin" rows="3" style="resize:vertical;font-family:var(--font-mono);font-size:12px">${stdin}</textarea></div>
            <div class="form-group"><label class="form-label">Command</label>
              <select class="form-select" id="pr-cmd">
                <option value="cat">cat</option><option value="grep" selected>grep</option><option value="sort">sort</option><option value="wc">wc -l</option><option value="head">head -2</option><option value="tail">tail -1</option><option value="uniq">uniq</option>
              </select>
            </div>
            <div class="form-group" id="pr-arg-group">
              <label class="form-label">Argument (e.g., pattern for grep)</label>
              <input class="form-input" id="pr-arg" value="a" placeholder="pattern">
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
              <button class="btn btn-primary btn-sm" id="pr-stdout-btn" style="background:#22c55e">> stdout</button>
              <button class="btn btn-primary btn-sm" id="pr-stderr-btn" style="background:#ef4444">2> stderr</button>
              <button class="btn btn-primary btn-sm" id="pr-pipe-btn" style="background:#3b82f6">| pipe</button>
              <button class="btn btn-secondary btn-sm" id="pr-reset-btn">↺ Reset</button>
            </div>
          </div>
        </div>
        <div class="concept-box" style="border-left-color:#3b82f6">
          <h4>📚 Shell Operators</h4>
          <p><code style="color:#22c55e">></code> Redirect stdout to file (overwrite)<br>
          <code style="color:#22c55e">>></code> Redirect stdout to file (append)<br>
          <code style="color:#ef4444">2></code> Redirect stderr to file<br>
          <code style="color:#ef4444">2>&1</code> Merge stderr into stdout<br>
          <code style="color:#3b82f6">|</code> Pipe stdout of left → stdin of right<br>
          <code style="color:#3b82f6"><</code> Redirect file to stdin</p>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">File Descriptor Flow</span></div>
          <div style="padding:12px">
            <canvas id="pr-canvas" height="200" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Output</span></div>
          <div style="padding:12px">
            <div style="margin-bottom:8px"><strong style="color:#22c55e">stdout (fd 1):</strong></div>
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;padding:10px;font-family:var(--font-mono);font-size:12px;min-height:40px;white-space:pre-wrap;color:#22c55e" id="pr-stdout">${stdout||'(empty)'}</div>
            <div style="margin:8px 0 4px"><strong style="color:#ef4444">stderr (fd 2):</strong></div>
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;padding:10px;font-family:var(--font-mono);font-size:12px;min-height:30px;white-space:pre-wrap;color:#ef4444" id="pr-stderr">${stderr||'(empty)'}</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  function persist() { saveState(KEY, { stdin, stdout, stderr }); }
  function runCommand(cmd, arg) {
    let input = document.getElementById('pr-stdin').value || stdin;
    let result = '';
    if (cmd === 'grep') result = input.split('\n').filter(l => l.includes(arg || '')).join('\n');
    else if (cmd === 'sort') result = input.split('\n').sort().join('\n');
    else if (cmd === 'wc') result = `${input.split('\n').filter(Boolean).length}`;
    else if (cmd === 'head') result = input.split('\n').slice(0, parseInt(arg)||2).join('\n');
    else if (cmd === 'tail') result = input.split('\n').slice(-1).join('\n');
    else if (cmd === 'uniq') result = [...new Set(input.split('\n'))].join('\n');
    else result = input;
    stdin = input;
    return result;
  }

  document.getElementById('pr-guide-btn').addEventListener('click', () => openGuide('piperedir'));
  document.getElementById('pr-stdout-btn').addEventListener('click', () => {
    const cmd = document.getElementById('pr-cmd').value;
    const arg = document.getElementById('pr-arg').value;
    stdout = runCommand(cmd, arg);
    document.getElementById('pr-stdout').textContent = stdout || '(empty)';
    persist();
    showToast(`${cmd} > stdout`, 'success');
    drawCanvas();
  });
  document.getElementById('pr-stderr-btn').addEventListener('click', () => {
    const input = document.getElementById('pr-stdin').value || stdin;
    if (!input.trim()) { stderr = 'error: empty input'; }
    else stderr = '';
    document.getElementById('pr-stderr').textContent = stderr || '(empty)';
    persist();
    showToast(stderr ? 'Error written to stderr' : 'No errors', stderr ? 'warning' : 'info');
    drawCanvas();
  });
  document.getElementById('pr-pipe-btn').addEventListener('click', () => {
    const cmd1 = document.getElementById('pr-cmd').value;
    const arg = document.getElementById('pr-arg').value;
    stdout = runCommand(cmd1, arg);
    stdin = stdout;
    document.getElementById('pr-stdin').value = stdin;
    document.getElementById('pr-stdout').textContent = stdout || '(empty)';
    persist();
    showToast(`${cmd1} | next → piped!`, 'success');
    drawCanvas();
  });
  document.getElementById('pr-reset-btn').addEventListener('click', () => {
    stdin = 'apple\nbanana\ncherry\ndate\n'; stdout = ''; stderr = '';
    document.getElementById('pr-stdin').value = stdin;
    document.getElementById('pr-stdout').textContent = '(empty)';
    document.getElementById('pr-stderr').textContent = '(empty)';
    persist();
    drawCanvas();
  });

  function drawCanvas() {
    const canvas = document.getElementById('pr-canvas');
    const W = canvas.width = canvas.offsetWidth || 500, H = canvas.height;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, W, H);

    const fdPositions = [
      { x:W*0.2, y:30, label:'stdin', fd:0, color:'#f59e0b' },
      { x:W*0.5, y:90, label:'stdout', fd:1, color:'#22c55e' },
      { x:W*0.8, y:30, label:'stderr', fd:2, color:'#ef4444' },
    ];

    ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Process', W/2, H-10);

    fdPositions.forEach(fd => {
      ctx.fillStyle = fd.color + '22'; ctx.beginPath(); ctx.arc(fd.x, fd.y, 22, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = fd.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fd.x, fd.y, 22, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center'; ctx.fillText(fd.fd, fd.x, fd.y + 4);
      ctx.fillStyle = fd.color; ctx.font = '10px Inter'; ctx.fillText(fd.label, fd.x, fd.y + 18);
      ctx.strokeStyle = fd.color; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(fd.x, fd.y + 22); ctx.lineTo(W/2, H-28); ctx.stroke();
    });
  }

  drawCanvas();
}
