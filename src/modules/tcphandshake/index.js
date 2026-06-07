import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

let step = 0;

export function renderTCPHandshake(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(6,182,212,.15)">🤝</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#22d3ee">TCP Handshake</h1>
        <p class="module-subtitle">Step through the classic 3-way handshake with sequence numbers. Understand why it takes 3 steps, not 2.</p>
      </div>
      <button class="btn btn-secondary" id="th-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Walk Through</span></div>
          <div class="panel-body">
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-primary" id="th-step1-btn" style="background:#f59e0b;color:#000">Step 1: SYN</button>
              <button class="btn btn-primary" id="th-step2-btn" style="background:#f59e0b;color:#000">Step 2: SYN-ACK</button>
              <button class="btn btn-primary" id="th-step3-btn" style="background:#22c55e">Step 3: ACK</button>
              <button class="btn btn-secondary" id="th-reset-btn">↺ Reset</button>
            </div>
            <div id="th-state" style="text-align:center;margin-top:16px;font-size:18px;font-weight:800;font-family:var(--font-mono);color:#475569">CLOSED</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Why 3 Steps?</span></div>
          <div class="panel-body" style="font-size:13px;color:var(--text-secondary);line-height:1.7">
            <p><strong style="color:#f59e0b">Step 1 (SYN):</strong> Client picks ISN=1000. Tells server "I want to connect."</p>
            <p style="margin-top:8px"><strong style="color:#f59e0b">Step 2 (SYN-ACK):</strong> Server picks ISN=5000, acks client's SYN (ack=1001). Proves server is alive and the client's SYN was received.</p>
            <p style="margin-top:8px"><strong style="color:#22c55e">Step 3 (ACK):</strong> Client acks server's SYN (ack=5001). Proves the client received the SYN-ACK. Both sides now have synchronized sequence numbers.</p>
            <p style="margin-top:8px"><strong style="color:#ef4444">Why not 2 steps?</strong> A delayed duplicate SYN from a previous connection could confuse the server. The 3rd ACK prevents this.</p>
          </div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Handshake Timeline</span></div>
          <div style="padding:16px">
            <canvas id="th-canvas" height="280" style="width:100%;border-radius:8px;background:var(--bg-surface)"></canvas>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Sequence Number Exchange</span></div>
          <div id="th-seq" style="padding:12px;font-family:var(--font-mono);font-size:13px"><p style="color:var(--text-muted)">Walk through steps to see sequence numbers</p></div>
        </div>
      </div>
    </div>
  </div>`;

  step = 0;
  const states = ['CLOSED','SYN_SENT','SYN_RCVD','ESTABLISHED'];
  const colors = ['#475569','#f59e0b','#f59e0b','#22c55e'];
  const seq = [];

  function redraw() {
    document.getElementById('th-state').textContent = 'Client: ' + (states[step]||'CLOSED');
    document.getElementById('th-state').style.color = colors[step]||'#475569';

    const canvas = document.getElementById('th-canvas');
    if (!canvas) return;
    const W = canvas.width = canvas.offsetWidth || 500, H = canvas.height;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, W, H);

    const clX = W*0.25, svX = W*0.75;
    ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Client', clX, 20);
    ctx.fillStyle = '#34d399'; ctx.fillText('Server', svX, 20);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(clX, 40); ctx.lineTo(clX, H-20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(svX, 40); ctx.lineTo(svX, H-20); ctx.stroke();

    const desc = [
      step >= 1 ? { dir:'→', y:65, color:'#f59e0b', text:'SYN seq=1000', detail:'Client → Server' } : null,
      step >= 2 ? { dir:'←', y:120, color:'#f59e0b', text:'SYN-ACK seq=5000 ack=1001', detail:'Server → Client' } : null,
      step >= 3 ? { dir:'→', y:175, color:'#22c55e', text:'ACK seq=1001 ack=5001', detail:'Client → Server' } : null,
    ];

    desc.filter(Boolean).forEach(d => {
      const isRight = d.dir === '→';
      const x1 = isRight ? clX : svX, x2 = isRight ? svX : clX;
      ctx.strokeStyle = d.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, d.y); ctx.lineTo(x2, d.y); ctx.stroke();
      const ang = isRight ? 0 : Math.PI;
      ctx.fillStyle = d.color;
      ctx.beginPath(); ctx.moveTo(x2, d.y);
      ctx.lineTo(x2 - 8*Math.cos(ang-0.4), d.y - 8*Math.sin(ang-0.4));
      ctx.lineTo(x2 - 8*Math.cos(ang+0.4), d.y - 8*Math.sin(ang+0.4));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = d.color; ctx.font = 'bold 10px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(d.text, (x1+x2)/2, d.y - 5);
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px Inter';
      ctx.fillText(d.detail, (x1+x2)/2, d.y + 14);
    });
  }

  function updateSeq() {
    const el = document.getElementById('th-seq');
    if (step === 0) el.innerHTML = '<p style="color:var(--text-muted)">Walk through steps</p>';
    else if (step === 1) el.innerHTML = '<div>Client ISN = <span style="color:#f59e0b">1000</span></div><div style="color:var(--text-dim)">Server has not yet responded</div>';
    else if (step === 2) el.innerHTML = '<div>Client: seq=<span style="color:#f59e0b">1000</span></div><div>Server: seq=<span style="color:#f59e0b">5000</span>, ack=<span style="color:#22c55e">1001</span></div>';
    else el.innerHTML = '<div>Client: seq=<span style="color:#f59e0b">1001</span>, ack=<span style="color:#22c55e">5001</span></div><div>Server: seq=<span style="color:#f59e0b">5000</span>, ack=<span style="color:#22c55e">1001</span></div><div style="color:#22c55e;margin-top:4px">✅ Both sides synchronized</div>';
  }

  document.getElementById('th-guide-btn').addEventListener('click', () => openGuide('tcphandshake'));
  document.getElementById('th-step1-btn').addEventListener('click', () => { step = 1; showToast('Client → Server: SYN seq=1000','info'); redraw(); updateSeq(); });
  document.getElementById('th-step2-btn').addEventListener('click', () => { if(step<1)return showToast('Do Step 1 first!','warning'); step = 2; showToast('Server → Client: SYN-ACK','info'); redraw(); updateSeq(); });
  document.getElementById('th-step3-btn').addEventListener('click', () => { if(step<2)return showToast('Do Steps 1-2 first!','warning'); step = 3; showToast('Connection ESTABLISHED!','success'); redraw(); updateSeq(); });
  document.getElementById('th-reset-btn').addEventListener('click', () => { step = 0; redraw(); updateSeq(); });

  redraw(); updateSeq();
}
