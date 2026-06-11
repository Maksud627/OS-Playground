import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'sockets';
let state = 'CLOSED';
let segments = [];

function persist() { saveState(KEY, { state, segments }); }

export function renderSockets(container) {
  const saved = loadState(KEY);
  if (saved) { state = saved.state || 'CLOSED'; segments = saved.segments || []; }
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(59,130,246,.15)">🔌</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#60a5fa">Sockets & TCP</h1>
        <p class="module-subtitle">Walk through the TCP 3-way handshake, data transfer, and connection teardown. Visualize the state machine and segment flow.</p>
      </div>
      <button class="btn btn-secondary" id="sock-guide-btn">📖 Learn</button>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" id="sock-tab-connect" onclick="window._sockTab('connect')">Connection Lifecycle</button>
      <button class="tab-btn" id="sock-tab-states" onclick="window._sockTab('states')">TCP State Machine</button>
    </div>

    <div id="sock-connect-view">
      <div class="two-col">
        <div>
          <div class="panel" style="margin-bottom:16px">
            <div class="panel-header"><span class="panel-title">Connection Control</span></div>
            <div class="panel-body">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
                <div>
                  <div style="font-size:12px;color:var(--text-muted)">Client</div>
                  <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#60a5fa">192.168.1.5:52341</div>
                </div>
                <div style="font-size:24px;color:var(--text-dim)">⇄</div>
                <div>
                  <div style="font-size:12px;color:var(--text-muted)">Server</div>
                  <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#34d399">10.0.0.1:443</div>
                </div>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-primary" id="sock-connect-btn" style="background:#3b82f6">🔗 Connect (3-Way)</button>
                <button class="btn btn-primary" id="sock-send-btn" style="background:#f59e0b;color:#000">📤 Send Data</button>
                <button class="btn btn-danger" id="sock-close-btn">✕ Close</button>
                <button class="btn btn-secondary" id="sock-reset-btn">↺ Reset</button>
              </div>
            </div>
          </div>

          <div class="panel" style="margin-bottom:16px">
            <div class="panel-header"><span class="panel-title">Current State</span></div>
            <div id="sock-state-display" style="padding:20px;text-align:center;font-size:28px;font-weight:800;font-family:var(--font-mono);color:#60a5fa">CLOSED</div>
          </div>

          <div class="concept-box" style="border-left-color:#3b82f6">
            <h4>📚 TCP 3-Way Handshake</h4>
            <p><strong>1. SYN:</strong> Client → Server "I want to connect. My seq = X"<br>
            <strong>2. SYN-ACK:</strong> Server → Client "Got it. My seq = Y, ack = X+1"<br>
            <strong>3. ACK:</strong> Client → Server "Got it. ack = Y+1"<br>
            Both sides now have established synchronized sequence numbers.</p>
          </div>
        </div>
        <div>
          <div class="panel" style="margin-bottom:16px">
            <div class="panel-header"><span class="panel-title">Packet Timeline</span></div>
            <div id="sock-packets" style="padding:14px">
              <p style="color:var(--text-muted);font-size:13px;text-align:center">Press Connect to begin the handshake</p>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header"><span class="panel-title">Segment Visualization</span></div>
            <div style="padding:16px">
              <canvas id="sock-canvas" height="240" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="sock-states-view" style="display:none">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">TCP State Machine (Client + Server)</span></div>
        <div style="padding:16px;overflow-x:auto">
          <canvas id="sock-fsm-canvas" height="400" style="width:100%;min-width:700px;border-radius:8px;background:var(--bg-surface)"></canvas>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Client States</span></div>
          <div class="panel-body" style="font-size:13px;color:var(--text-secondary);line-height:1.8">
            <strong>CLOSED</strong> → <strong>SYN_SENT</strong> (client sends SYN)<br>
            <strong>SYN_SENT</strong> → <strong>ESTABLISHED</strong> (receives SYN-ACK, sends ACK)<br>
            <strong>ESTABLISHED</strong> → <strong>FIN_WAIT_1</strong> (client sends FIN)<br>
            <strong>FIN_WAIT_1</strong> → <strong>FIN_WAIT_2</strong> (receives ACK)<br>
            <strong>FIN_WAIT_2</strong> → <strong>TIME_WAIT</strong> (receives FIN, sends ACK)<br>
            <strong>TIME_WAIT</strong> → <strong>CLOSED</strong> (after 2*MSL timeout)
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Server States</span></div>
          <div class="panel-body" style="font-size:13px;color:var(--text-secondary);line-height:1.8">
            <strong>LISTEN</strong> → <strong>SYN_RCVD</strong> (receives SYN, sends SYN-ACK)<br>
            <strong>SYN_RCVD</strong> → <strong>ESTABLISHED</strong> (receives ACK)<br>
            <strong>ESTABLISHED</strong> → <strong>CLOSE_WAIT</strong> (receives FIN, sends ACK)<br>
            <strong>CLOSE_WAIT</strong> → <strong>LAST_ACK</strong> (server sends FIN)<br>
            <strong>LAST_ACK</strong> → <strong>CLOSED</strong> (receives ACK)
          </div>
        </div>
      </div>
    </div>
  </div>`;

  state = 'CLOSED'; segments = [];
  bindSockets();
}

function bindSockets() {
  window._sockTab = (tab) => {
    document.getElementById('sock-connect-view').style.display = tab === 'connect' ? 'block' : 'none';
    document.getElementById('sock-states-view').style.display = tab === 'states' ? 'block' : 'none';
    document.getElementById('sock-tab-connect').classList.toggle('active', tab === 'connect');
    document.getElementById('sock-tab-states').classList.toggle('active', tab === 'states');
    if (tab === 'states') drawFSM();
  };

  document.getElementById('sock-guide-btn').addEventListener('click', () => openGuide('sockets'));
  document.getElementById('sock-connect-btn').addEventListener('click', doHandshake);
  document.getElementById('sock-send-btn').addEventListener('click', sendData);
  document.getElementById('sock-close-btn').addEventListener('click', doClose);
  document.getElementById('sock-reset-btn').addEventListener('click', resetSocket);
  updateDisplay();
}

function updateDisplay() {
  const el = document.getElementById('sock-state-display');
  if (!el) return;
  const colors = {
    CLOSED: '#475569', SYN_SENT: '#f59e0b', ESTABLISHED: '#22c55e',
    FIN_WAIT_1: '#f97316', FIN_WAIT_2: '#f97316', TIME_WAIT: '#f97316',
    LISTEN: '#60a5fa', SYN_RCVD: '#f59e0b', CLOSE_WAIT: '#ef4444', LAST_ACK: '#ef4444'
  };
  el.style.color = colors[state] || '#fff';
  el.textContent = state;
}

function doHandshake() {
  if (state !== 'CLOSED') { showToast('Already connected or in progress', 'warning'); return; }
  state = 'SYN_SENT';
  segments = [];
  addSegment('→', 'SYN', 'seq=1000, win=65535', '#f59e0b', 'Client → Server');
  updateDisplay();
  renderPackets();
  drawTimeline();

  setTimeout(() => {
    state = 'SYN_RCVD';
    addSegment('←', 'SYN-ACK', 'seq=5000, ack=1001, win=65535', '#f59e0b', 'Server → Client');
    updateDisplay();
    renderPackets();
    drawTimeline();

    setTimeout(() => {
      state = 'ESTABLISHED';
      addSegment('→', 'ACK', 'seq=1001, ack=5001', '#22c55e', 'Client → Server');
      updateDisplay();
      renderPackets();
      drawTimeline();
      showToast('Connection ESTABLISHED!', 'success');
    }, 800);
  }, 800);
}

function sendData() {
  if (state !== 'ESTABLISHED') { showToast('Must be ESTABLISHED first!', 'warning'); return; }
  addSegment('→', 'PSH ACK', 'seq=1001, data="GET / HTTP/1.1"', '#60a5fa', 'Client → Server');
  setTimeout(() => {
    addSegment('←', 'ACK', 'seq=5001, ack=1037', '#22c55e', 'Server ACK');
    addSegment('←', 'PSH ACK', 'seq=5001, data="HTTP/1.1 200 OK"', '#60a5fa', 'Server → Client');
    setTimeout(() => {
      addSegment('→', 'ACK', 'seq=1037, ack=5213', '#22c55e', 'Client ACK');
      renderPackets();
      drawTimeline();
    }, 600);
    renderPackets();
    drawTimeline();
  }, 600);
  renderPackets();
  drawTimeline();
  showToast('Data sent!', 'success');
}

function doClose() {
  if (state !== 'ESTABLISHED') { showToast('Must be ESTABLISHED to close', 'warning'); return; }
  state = 'FIN_WAIT_1';
  addSegment('→', 'FIN', 'seq=1100, ack=5213', '#ef4444', 'Client → Server');
  updateDisplay();
  renderPackets();
  drawTimeline();

  setTimeout(() => {
    addSegment('←', 'ACK', 'seq=5213, ack=1101', '#22c55e', 'Server ACK');
    state = 'FIN_WAIT_2';
    updateDisplay();
    renderPackets();
    drawTimeline();

    setTimeout(() => {
      addSegment('←', 'FIN', 'seq=5213, ack=1101', '#ef4444', 'Server → Client');
      state = 'TIME_WAIT';
      updateDisplay();
      renderPackets();
      drawTimeline();

      setTimeout(() => {
        addSegment('→', 'ACK', 'seq=1101, ack=5214', '#22c55e', 'Client ACK');
        setTimeout(() => {
          state = 'CLOSED';
          updateDisplay();
          renderPackets();
          drawTimeline();
          showToast('Connection CLOSED (2*MSL elapsed)', 'info');
        }, 1000);
      }, 600);
    }, 600);
  }, 600);
}

function resetSocket() {
  state = 'CLOSED'; segments = [];
  updateDisplay();
  renderPackets();
  drawTimeline();
  showToast('Reset', 'info');
}

function addSegment(dir, flags, detail, color, label) {
  segments.push({ dir, flags, detail, color, label, time: segments.length });
}

function renderPackets() {
  const el = document.getElementById('sock-packets');
  if (!segments.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center">Press Connect to begin the handshake</p>';
    return;
  }
  el.innerHTML = segments.map(s => `
    <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-family:var(--font-mono);font-size:12px">
      <span style="color:${s.color};font-weight:700;min-width:24px">${s.dir}</span>
      <span style="color:${s.color};font-weight:700;min-width:70px">[${s.flags}]</span>
      <span style="color:var(--text-secondary);flex:1">${s.detail}</span>
      <span style="color:var(--text-dim);font-size:10px">${s.label}</span>
    </div>`).join('');
}

function drawTimeline() {
  const canvas = document.getElementById('sock-canvas');
  if (!canvas) return;
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const clientX = W * 0.25;
  const serverX = W * 0.75;
  const topPad = 40, bottomPad = 30;

  // Labels
  ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
  ctx.fillText('Client', clientX, 20);
  ctx.fillStyle = '#34d399';
  ctx.fillText('Server', serverX, 20);

  // Vertical lines
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(clientX, topPad); ctx.lineTo(clientX, H - bottomPad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(serverX, topPad); ctx.lineTo(serverX, H - bottomPad); ctx.stroke();

  if (!segments.length) return;

  const stepH = (H - topPad - bottomPad) / Math.max(segments.length, 1);

  segments.forEach((s, i) => {
    const y = topPad + stepH * i + stepH / 2;
    const isLeft = s.dir === '→';
    const x1 = isLeft ? clientX : serverX;
    const x2 = isLeft ? serverX : clientX;

    // Arrow
    ctx.strokeStyle = s.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();

    const ang = isLeft ? 0 : Math.PI;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y - 8 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y - 8 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();

    // Label
    ctx.fillStyle = s.color; ctx.font = 'bold 10px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(s.flags, (x1 + x2) / 2, y - 5);

    // Detail
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px JetBrains Mono';
    ctx.fillText(s.detail, (x1 + x2) / 2, y + 12);
  });
}

function drawFSM() {
  const canvas = document.getElementById('sock-fsm-canvas');
  if (!canvas) return;
  const W = canvas.width = canvas.offsetWidth || 700;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const states = [
    { label: 'CLOSED', x: W*0.08, y: H*0.5 },
    { label: 'SYN_SENT', x: W*0.22, y: H*0.25 },
    { label: 'ESTABLISHED', x: W*0.45, y: H*0.25 },
    { label: 'FIN_WAIT1', x: W*0.65, y: H*0.15 },
    { label: 'FIN_WAIT2', x: W*0.85, y: H*0.15 },
    { label: 'TIME_WAIT', x: W*0.85, y: H*0.45 },
    { label: 'LISTEN', x: W*0.08, y: H*0.7 },
    { label: 'SYN_RCVD', x: W*0.22, y: H*0.7 },
    { label: 'CLOSE_WAIT', x: W*0.65, y: H*0.6 },
    { label: 'LAST_ACK', x: W*0.85, y: H*0.7 },
  ];

  const edges = [
    ['CLOSED','SYN_SENT'], ['SYN_SENT','ESTABLISHED'], ['ESTABLISHED','FIN_WAIT1'],
    ['FIN_WAIT1','FIN_WAIT2'], ['FIN_WAIT2','TIME_WAIT'], ['TIME_WAIT','CLOSED'],
    ['CLOSED','LISTEN'], ['LISTEN','SYN_RCVD'], ['SYN_RCVD','ESTABLISHED'],
    ['ESTABLISHED','CLOSE_WAIT'], ['CLOSE_WAIT','LAST_ACK'], ['LAST_ACK','CLOSED'],
  ];

  // Edges
  edges.forEach(([a, b]) => {
    const sa = states.find(s => s.label === a);
    const sb = states.find(s => s.label === b);
    if (!sa || !sb) return;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sa.x, sa.y); ctx.lineTo(sb.x, sb.y); ctx.stroke();
  });

  // Nodes
  states.forEach(s => {
    const isActive = state === s.label;
    ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? 'rgba(96,165,250,.25)' : 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#60a5fa' : '#334155';
    ctx.lineWidth = isActive ? 3 : 1;
    ctx.stroke();
    ctx.fillStyle = isActive ? '#60a5fa' : '#94a3b8';
    ctx.font = isActive ? 'bold 9px JetBrains Mono' : '9px JetBrains Mono';
    ctx.textAlign = 'center';
    s.label.split('_').forEach((part, i) => {
      ctx.fillText(part, s.x, s.y - 2 + i * 10);
    });
  });
}
