import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'deadlock';
export function renderDeadlock(container) {
  let numProcesses = 3, numResources = 3;
  let allocation = [], maxClaim = [], available = [];

  function initMatrices() {
    allocation = Array.from({ length: numProcesses }, () => new Array(numResources).fill(0));
    maxClaim   = Array.from({ length: numProcesses }, () => new Array(numResources).fill(0));
    available  = new Array(numResources).fill(0);
  }
  initMatrices();

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(239,68,68,.15)">🔴</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#f87171">Deadlock Detector</h1>
        <p class="module-subtitle">Fill in the Allocation and Max matrices, set available resources, then detect deadlock or find the safe sequence via Banker's Algorithm.</p>
      </div>
      <button class="btn btn-secondary" id="dl-guide-btn">📖 Learn</button>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" id="dl-tab-bankers" onclick="window._dlTab('bankers')">Banker's Algorithm</button>
      <button class="tab-btn" id="dl-tab-rag" onclick="window._dlTab('rag')">Resource Allocation Graph</button>
    </div>

    <div id="dl-bankers-view">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Processes (P)</label>
          <input class="form-input" id="dl-np" type="number" min="2" max="6" value="3">
        </div>
        <div class="form-group">
          <label class="form-label">Resource Types (R)</label>
          <input class="form-input" id="dl-nr" type="number" min="1" max="5" value="3">
        </div>
      </div>
      <button class="btn btn-secondary" id="dl-build-btn" style="margin-bottom:20px">🔧 Build Matrices</button>

      <div id="dl-matrix-area" style="display:none">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
          <div class="panel">
            <div class="panel-header"><span class="panel-title">Allocation Matrix</span></div>
            <div class="panel-body" id="dl-alloc-grid"></div>
          </div>
          <div class="panel">
            <div class="panel-header"><span class="panel-title">Max Claim Matrix</span></div>
            <div class="panel-body" id="dl-max-grid"></div>
          </div>
        </div>

        <div class="panel" style="margin-bottom:20px">
          <div class="panel-header"><span class="panel-title">Available Resources</span></div>
          <div class="panel-body" id="dl-avail-grid"></div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:20px">
          <button class="btn btn-deadlock" id="dl-detect-btn">🔍 Run Banker's Algorithm</button>
          <button class="btn btn-secondary" id="dl-prefill-btn">📋 Load Example</button>
        </div>

        <div id="dl-result" class="panel" style="display:none">
          <div class="panel-header"><span class="panel-title" id="dl-result-title">Result</span></div>
          <div class="panel-body" id="dl-result-body"></div>
        </div>
      </div>
    </div>

    <div id="dl-rag-view" style="display:none">
      <div class="two-col">
        <div>
          <div class="panel" style="margin-bottom:16px">
            <div class="panel-header"><span class="panel-title">Define Graph</span></div>
            <div class="panel-body">
              <div class="form-group">
                <label class="form-label">Processes</label>
                <input class="form-input" id="rag-procs" value="P1,P2,P3" placeholder="P1,P2,P3">
              </div>
              <div class="form-group">
                <label class="form-label">Resources</label>
                <input class="form-input" id="rag-res" value="R1,R2" placeholder="R1,R2">
              </div>
              <div class="form-group">
                <label class="form-label">Assignments (P←R, e.g. P1←R1)</label>
                <input class="form-input" id="rag-assign" value="P1←R1,P2←R2" placeholder="P1←R1,P2←R2">
              </div>
              <div class="form-group">
                <label class="form-label">Requests (P→R, e.g. P1→R2)</label>
                <input class="form-input" id="rag-req" value="P1→R2,P2→R1" placeholder="P1→R2">
              </div>
              <div style="display:flex;gap:10px">
                <button class="btn btn-deadlock" id="rag-draw-btn" style="flex:1">Draw Graph</button>
                <button class="btn btn-secondary" id="rag-detect-btn">Detect Cycle</button>
              </div>
            </div>
          </div>
          <div class="concept-box deadlock">
            <h4>📚 Deadlock Conditions</h4>
            <p><strong>1. Mutual Exclusion</strong> — Only one process can use a resource.<br>
            <strong>2. Hold & Wait</strong> — A process holds resources while waiting for more.<br>
            <strong>3. No Preemption</strong> — Resources can't be forcibly taken.<br>
            <strong>4. Circular Wait</strong> — P1 waits for P2, P2 waits for P1.</p>
          </div>
        </div>
        <div>
          <div class="panel">
            <div class="panel-header"><span class="panel-title">Resource Allocation Graph</span></div>
            <div id="rag-canvas-wrap" style="padding:16px;min-height:320px;position:relative">
              <canvas id="rag-canvas" style="width:100%;border-radius:8px;"></canvas>
              <div id="rag-result" style="margin-top:12px;font-size:14px;font-weight:600;text-align:center"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  window._dlTab = (tab) => {
    document.getElementById('dl-bankers-view').style.display = tab === 'bankers' ? 'block' : 'none';
    document.getElementById('dl-rag-view').style.display = tab === 'rag' ? 'block' : 'none';
    document.getElementById('dl-tab-bankers').classList.toggle('active', tab === 'bankers');
    document.getElementById('dl-tab-rag').classList.toggle('active', tab === 'rag');
  };

  document.getElementById('dl-build-btn').addEventListener('click', () => {
    numProcesses = parseInt(document.getElementById('dl-np').value) || 3;
    numResources = parseInt(document.getElementById('dl-nr').value) || 3;
    initMatrices();
    buildMatrixUI();
    document.getElementById('dl-matrix-area').style.display = 'block';
    document.getElementById('dl-result').style.display = 'none';
  });

  document.getElementById('dl-guide-btn').addEventListener('click', () => openGuide('deadlock'));
  document.getElementById('dl-reset-btn')?.addEventListener('click', () => { initMatrices(); document.getElementById('dl-matrix-area').style.display = 'none'; document.getElementById('dl-result').style.display = 'none'; showToast('Reset', 'info'); });

  document.getElementById('dl-prefill-btn')?.addEventListener('click', prefillExample);

  function buildMatrixUI() {
    const pLabels = Array.from({ length: numProcesses }, (_, i) => `P${i}`);
    const rLabels = Array.from({ length: numResources }, (_, i) => `R${i}`);

    function buildGrid(containerId, matrix, prefix) {
      const el = document.getElementById(containerId);
      const header = `<div style="display:grid;grid-template-columns:40px ${rLabels.map(()=>'1fr').join(' ')};gap:4px;margin-bottom:6px;">
        <div></div>${rLabels.map(r=>`<div style="text-align:center;font-size:11px;color:var(--text-muted);font-weight:600">${r}</div>`).join('')}
      </div>`;
      const rows = pLabels.map((p, i) => `
        <div style="display:grid;grid-template-columns:40px ${rLabels.map(()=>'1fr').join(' ')};gap:4px;margin-bottom:4px;align-items:center">
          <div style="font-size:11px;color:var(--text-muted);font-weight:600">${p}</div>
          ${rLabels.map((r, j) => `<input class="form-input" style="text-align:center;padding:6px 4px;font-family:var(--font-mono);font-size:13px" type="number" min="0" value="${matrix[i][j]}" id="${prefix}-${i}-${j}">`).join('')}
        </div>`).join('');
      el.innerHTML = header + rows;
    }

    buildGrid('dl-alloc-grid', allocation, 'dl-alloc');
    buildGrid('dl-max-grid', maxClaim, 'dl-max');

    const availEl = document.getElementById('dl-avail-grid');
    availEl.innerHTML = `<div style="display:grid;grid-template-columns:${rLabels.map(()=>'1fr').join(' ')};gap:8px">
      ${rLabels.map((r, j) => `
        <div>
          <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-bottom:4px">${r}</div>
          <input class="form-input" style="text-align:center;font-family:var(--font-mono);font-size:14px" type="number" min="0" value="${available[j]}" id="dl-avail-${j}">
        </div>`).join('')}
    </div>`;
  }

  function readMatrices() {
    for (let i = 0; i < numProcesses; i++)
      for (let j = 0; j < numResources; j++) {
        allocation[i][j] = parseInt(document.getElementById(`dl-alloc-${i}-${j}`)?.value) || 0;
        maxClaim[i][j]   = parseInt(document.getElementById(`dl-max-${i}-${j}`)?.value) || 0;
      }
    for (let j = 0; j < numResources; j++)
      available[j] = parseInt(document.getElementById(`dl-avail-${j}`)?.value) || 0;
  }

  document.getElementById('dl-detect-btn').addEventListener('click', () => {
    readMatrices();
    const result = bankersAlgorithm(numProcesses, numResources, allocation, maxClaim, available);
    displayBankersResult(result);
  });

  function prefillExample() {
    numProcesses = 5; numResources = 3;
    initMatrices();
    document.getElementById('dl-np').value = 5;
    document.getElementById('dl-nr').value = 3;
    buildMatrixUI();
    document.getElementById('dl-matrix-area').style.display = 'block';

    const alloc = [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]];
    const max   = [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]];
    const avail = [3,3,2];

    alloc.forEach((row,i) => row.forEach((v,j) => { const el = document.getElementById(`dl-alloc-${i}-${j}`); if(el) el.value=v; }));
    max.forEach((row,i) => row.forEach((v,j) => { const el = document.getElementById(`dl-max-${i}-${j}`); if(el) el.value=v; }));
    avail.forEach((v,j) => { const el = document.getElementById(`dl-avail-${j}`); if(el) el.value=v; });
    showToast('Classic 5-process Banker\'s example loaded!', 'info');
  }

  function bankersAlgorithm(n, m, alloc, maxC, avail) {
    const need = Array.from({length:n}, (_,i) => Array.from({length:m}, (_,j) => maxC[i][j]-alloc[i][j]));
    const work = [...avail], finish = new Array(n).fill(false);
    const safeSeq = [], steps = [];

    let found = true;
    while (safeSeq.length < n && found) {
      found = false;
      for (let i = 0; i < n; i++) {
        if (finish[i]) continue;
        if (need[i].every((v, j) => v <= work[j])) {
          steps.push({ process: i, work: [...work], need: [...need[i]], alloc: [...alloc[i]] });
          for (let j = 0; j < m; j++) work[j] += alloc[i][j];
          finish[i] = true; safeSeq.push(i); found = true;
        }
      }
    }

    const safe = safeSeq.length === n;
    return { safe, safeSeq, steps, need, work };
  }

  function displayBankersResult(result) {
    const el = document.getElementById('dl-result');
    const title = document.getElementById('dl-result-title');
    const body = document.getElementById('dl-result-body');
    el.style.display = 'block';

    if (result.safe) {
      title.textContent = '✅ Safe State — No Deadlock';
      title.style.color = '#22c55e';
      body.innerHTML = `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">Safe Sequence:</div>
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px">
            ${result.safeSeq.map((p,i) => `
              <span style="background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#4ade80;padding:6px 14px;border-radius:8px;font-family:var(--font-mono);font-weight:700;animation:blockPop 0.3s ${i*0.1}s ease both">P${p}</span>
              ${i < result.safeSeq.length-1 ? '<span style="color:var(--text-muted)">→</span>' : ''}
            `).join('')}
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">Execution Steps (Need ≤ Work):</div>
        ${result.steps.map((s,i) => `
          <div style="background:var(--bg-surface);border-radius:8px;padding:10px 14px;margin-bottom:6px;border:1px solid var(--border);font-size:12px;font-family:var(--font-mono)">
            <strong style="color:#4ade80">Step ${i+1}: P${s.process}</strong>
            <span style="color:var(--text-muted);margin:0 8px">Need=[${s.need.join(',')}]</span>
            <span style="color:var(--text-muted)">Work=[${s.work.join(',')}]</span>
          </div>`).join('')}`;
    } else {
      title.textContent = '🔴 Unsafe State — Deadlock Detected!';
      title.style.color = '#ef4444';
      body.innerHTML = `<p style="color:var(--text-secondary);line-height:1.7">The system is in an <strong style="color:#f87171">unsafe state</strong>. Not all processes can be satisfied with the current resource allocation and available resources. A deadlock may occur.</p>
      <div style="margin-top:12px;padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:13px;color:#f87171">
        Only ${result.safeSeq.length} of ${numProcesses} processes could be completed: ${result.safeSeq.map(p=>`P${p}`).join(', ') || 'none'}
      </div>`;
    }
    showToast(result.safe ? 'Safe state! Deadlock-free.' : 'Unsafe state — deadlock possible!', result.safe ? 'success' : 'error');
  }

  // RAG
  document.getElementById('rag-draw-btn').addEventListener('click', drawRAG);
  document.getElementById('rag-detect-btn').addEventListener('click', () => { drawRAG(true); });

  function drawRAG(detectCycle = false) {
    const procs = document.getElementById('rag-procs').value.split(',').map(s=>s.trim()).filter(Boolean);
    const res   = document.getElementById('rag-res').value.split(',').map(s=>s.trim()).filter(Boolean);
    const assigns = document.getElementById('rag-assign').value.split(',').map(s=>s.trim()).filter(Boolean);
    const reqs    = document.getElementById('rag-req').value.split(',').map(s=>s.trim()).filter(Boolean);

    const canvas = document.getElementById('rag-canvas');
    const wrap = document.getElementById('rag-canvas-wrap');
    canvas.width = wrap.clientWidth - 32;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nodes = {};
    const W = canvas.width, H = canvas.height;

    // Layout: processes on left, resources on right
    procs.forEach((p, i) => { nodes[p] = { x: W*0.25, y: 50 + i*(H-80)/(procs.length||1), type:'proc', label:p }; });
    res.forEach((r, i) => { nodes[r] = { x: W*0.75, y: 50 + i*(H-80)/(res.length||1), type:'res', label:r }; });

    // Draw edges
    function drawArrow(ax, ay, bx, by, color, dashed=false) {
      ctx.save();
      if (dashed) ctx.setLineDash([5,4]);
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(by-ay, bx-ax);
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx-12*Math.cos(angle-0.4), by-12*Math.sin(angle-0.4));
      ctx.lineTo(bx-12*Math.cos(angle+0.4), by-12*Math.sin(angle+0.4));
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    assigns.forEach(a => {
      const [proc, resource] = a.split('←').map(s=>s.trim());
      if (nodes[proc] && nodes[resource]) drawArrow(nodes[resource].x, nodes[resource].y, nodes[proc].x, nodes[proc].y, '#22c55e');
    });
    reqs.forEach(r => {
      const [proc, resource] = r.split('→').map(s=>s.trim());
      if (nodes[proc] && nodes[resource]) drawArrow(nodes[proc].x, nodes[proc].y, nodes[resource].x, nodes[resource].y, '#ef4444', true);
    });

    // Draw nodes
    Object.values(nodes).forEach(n => {
      ctx.save();
      if (n.type === 'proc') {
        ctx.beginPath(); ctx.arc(n.x, n.y, 22, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(124,58,237,0.2)'; ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.rect(n.x-20, n.y-16, 40, 32);
        ctx.fillStyle = 'rgba(239,68,68,0.2)'; ctx.fill();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.fillStyle = '#f1f5f9'; ctx.font = '12px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.label, n.x, n.y);
      ctx.restore();
    });

    // Simple cycle detection using adjacency (proc→res→proc)
    const resultEl = document.getElementById('rag-result');
    if (detectCycle) {
      const graph = {};
      procs.forEach(p => graph[p] = []);
      reqs.forEach(r => { const [p,res] = r.split('→').map(s=>s.trim()); if(graph[p]) graph[p].push(res); });
      assigns.forEach(a => { const [p,r] = a.split('←').map(s=>s.trim()); if(!graph[r]) graph[r]=[]; graph[r].push(p); });

      const visited = new Set(), recStack = new Set();
      function dfs(node) {
        visited.add(node); recStack.add(node);
        for (const nb of (graph[node]||[])) {
          if (!visited.has(nb) && dfs(nb)) return true;
          if (recStack.has(nb)) return true;
        }
        recStack.delete(node); return false;
      }

      const hasCycle = [...procs,...res].some(n => !visited.has(n) && dfs(n));
      resultEl.innerHTML = hasCycle
        ? '<span style="color:#ef4444">🔴 Cycle Detected — Deadlock Possible!</span>'
        : '<span style="color:#22c55e">✅ No Cycle — System is Safe</span>';
      showToast(hasCycle ? 'Deadlock cycle found!' : 'No cycle — safe!', hasCycle ? 'error' : 'success');
    } else { resultEl.innerHTML = ''; }
  }
}
