import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'stackheap';
let heapBlocks = [];
let stackFrames = [];

function persist() { saveState(KEY, { heapBlocks: heapBlocks.map(b=>({...b})), stackFrames: stackFrames.map(f=>({...f,vars:[...f.vars]})) }); }

export function renderStackHeap(container) {
  const saved = loadState(KEY);
  if (saved) { heapBlocks = saved.heapBlocks || []; stackFrames = saved.stackFrames || []; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(139,92,246,.15)">📚</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#a78bfa">Stack vs Heap</h1>
        <p class="module-subtitle">Visualize where your variables live in a process address space. Push stack frames, allocate heap blocks, and see how they grow.</p>
      </div>
      <button class="btn btn-secondary" id="stackheap-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Call Functions (Stack)</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Function Name</label>
              <input class="form-input" id="sh-fn-name" value="main" placeholder="main">
            </div>
            <div class="form-group">
              <label class="form-label">Local Variables (comma-separated)</label>
              <input class="form-input" id="sh-fn-vars" value="x=42,y=hello" placeholder="x=42,y=hello">
            </div>
            <button class="btn btn-primary" id="sh-push-btn" style="width:100%">⬇ Push Stack Frame</button>
            <button class="btn btn-danger" id="sh-pop-btn" style="width:100%;margin-top:6px">⬆ Pop Stack Frame</button>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Allocate Memory (Heap)</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Variable Name</label>
              <input class="form-input" id="sh-heap-name" placeholder="buffer">
            </div>
            <div class="form-group">
              <label class="form-label">Size</label>
              <input class="form-input" id="sh-heap-size" type="number" min="1" value="16" placeholder="16 bytes">
            </div>
            <button class="btn btn-primary" id="sh-malloc-btn" style="width:100%">＋ malloc</button>
            <button class="btn btn-danger" id="sh-free-btn" style="width:100%;margin-top:6px">✕ free last</button>
          </div>
        </div>

        <div class="concept-box" style="border-left-color:#8b5cf6">
          <h4>📚 Memory Layout</h4>
          <p><strong>Stack:</strong> LIFO, fast, automatic. Stores local vars and return addresses. Grows downward. Each function call pushes a frame.<br>
          <strong>Heap:</strong> Manual (malloc/free), slower. For dynamic data whose lifetime isn't tied to a function. Grows upward. Fragments over time.</p>
        </div>
      </div>
      <div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Memory Layout Visualization</span></div>
          <div id="sh-viz" style="padding:16px;min-height:420px;display:flex;justify-content:center;align-items:center">
            <canvas id="sh-canvas" height="420" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
          </div>
        </div>
        <div class="stats-row" style="margin-top:16px">
          <div class="stat-card"><div class="stat-value" style="color:#a78bfa" id="sh-stat-stack">0</div><div class="stat-label">Stack Frames</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="sh-stat-heap">0</div><div class="stat-label">Heap Blocks</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#f59e0b" id="sh-stat-free">0 B</div><div class="stat-label">Heap Fragmentation</div></div>
        </div>
      </div>
    </div>
  </div>`;

  heapBlocks = []; stackFrames = [];
  bindStackHeap();
}

function bindStackHeap() {
  document.getElementById('stackheap-guide-btn').addEventListener('click', () => openGuide('stackheap'));
  document.getElementById('sh-push-btn').addEventListener('click', pushFrame);
  document.getElementById('sh-pop-btn').addEventListener('click', popFrame);
  document.getElementById('sh-malloc-btn').addEventListener('click', mallocBlock);
  document.getElementById('sh-free-btn').addEventListener('click', freeBlock);
  drawMemory();
}

function pushFrame() {
  const name = document.getElementById('sh-fn-name').value || 'func';
  const varsRaw = document.getElementById('sh-fn-vars').value || '';
  const vars = varsRaw ? varsRaw.split(',').map(v => v.trim()).filter(Boolean) : [];
  stackFrames.push({ name, vars, id: Date.now() });
  drawMemory();
  showToast(`Pushed "${name}" (${vars.length} locals)`, 'success');
}

function popFrame() {
  if (!stackFrames.length) { showToast('Stack is empty!', 'warning'); return; }
  const f = stackFrames.pop();
  showToast(`Popped "${f.name}"`, 'info');
  drawMemory();
}

function mallocBlock() {
  const name = document.getElementById('sh-heap-name').value || 'block';
  const size = parseInt(document.getElementById('sh-heap-size').value) || 16;
  heapBlocks.push({ name, size, id: Date.now(), color: `hsl(${(heapBlocks.length*73)%360},65%,55%)` });
  drawMemory();
  showToast(`malloc("${name}", ${size}B)`, 'success');
}

function freeBlock() {
  if (!heapBlocks.length) { showToast('Heap is empty!', 'warning'); return; }
  const b = heapBlocks.pop();
  showToast(`free("${b.name}")`, 'info');
  drawMemory();
}

function drawMemory() {
  const canvas = document.getElementById('sh-canvas');
  if (!canvas) return;
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const pad = 20, barW = W - pad * 2, barH = H - pad * 2;

  // Background: code section at top, then stack growing down, heap growing up, data at bottom
  const codeTop = pad, codeH = 30;
  const stackStart = codeTop + codeH + 10;
  const heapEnd = H - pad - 30;
  const dataBottom = H - pad;

  // Code segment
  ctx.fillStyle = '#334155';
  ctx.fillRect(pad, codeTop, barW, codeH);
  ctx.fillStyle = '#64748b'; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'center';
  ctx.fillText('TEXT / CODE (read-only)', W/2, codeTop + 20);

  // Stack frames (grow downward from top)
  let stackY = stackStart;
  stackFrames.forEach(f => {
    const h = 10 + f.vars.length * 14 + 10;
    ctx.fillStyle = 'rgba(167,139,250,0.2)';
    ctx.fillRect(pad + 10, stackY, barW - 20, h);
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1;
    ctx.strokeRect(pad + 10, stackY, barW - 20, h);
    ctx.fillStyle = '#c4b5fd'; ctx.font = 'bold 11px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(`${f.name}()`, pad + 16, stackY + 14);
    f.vars.forEach((v, i) => {
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px JetBrains Mono';
      ctx.fillText(`  ${v}`, pad + 16, stackY + 14 + (i+1)*14);
    });
    stackY += h + 4;
  });

  // Stack label
  ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'right';
  ctx.fillText('STACK ↓', W - pad - 14, stackStart + 16);
  ctx.fillText(`(grows downward, ${stackFrames.length} frames)`, W - pad - 14, stackStart + 32);

  // Heap blocks (grow upward from bottom)
  let heapY = heapEnd;
  heapBlocks.forEach(b => {
    const h = Math.max(12, Math.min(b.size, 60));
    ctx.fillStyle = b.color + '33';
    ctx.fillRect(pad + 10, heapY - h, barW - 20, h);
    ctx.strokeStyle = b.color; ctx.lineWidth = 1;
    ctx.strokeRect(pad + 10, heapY - h, barW - 20, h);
    ctx.fillStyle = b.color; ctx.font = 'bold 10px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(`${b.name} (${b.size}B)`, pad + 16, heapY - h/2 + 4);
    heapY -= h + 4;
  });

  // Heap label
  ctx.fillStyle = '#22c55e'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'right';
  ctx.fillText('HEAP ↑', W - pad - 14, heapEnd - 8);
  ctx.fillText(`(grows upward, ${heapBlocks.length} blocks)`, W - pad - 14, heapEnd - 24);

  // Data segment
  ctx.fillStyle = '#334155';
  ctx.fillRect(pad, dataBottom - 28, barW, 28);
  ctx.fillStyle = '#64748b'; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'center';
  ctx.fillText('DATA / BSS (globals, statics)', W/2, dataBottom - 10);

  // Stats
  document.getElementById('sh-stat-stack').textContent = stackFrames.length;
  document.getElementById('sh-stat-heap').textContent = heapBlocks.length;
  const totalHeap = heapBlocks.reduce((s, b) => s + b.size, 0);
  document.getElementById('sh-stat-free').textContent = totalHeap + ' B';
}
