import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

export function renderTCPvsUDP(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(59,130,246,.15)">⚖️</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#60a5fa">TCP vs UDP</h1>
        <p class="module-subtitle">Compare the two transport layer protocols: reliable TCP vs lightweight UDP. See the trade-offs in headers, overhead, and guarantees.</p>
      </div>
      <button class="btn btn-secondary" id="tuv-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div class="panel" style="border-left:4px solid #22c55e">
        <div class="panel-header"><span class="panel-title">🟢 TCP (Transmission Control Protocol)</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px"><strong>Reliable</strong><br><span style="font-size:13px;color:var(--text-secondary)">Guarantees delivery. Lost packets are retransmitted. Data arrives in order.</span></div>
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px"><strong>Connection-Oriented</strong><br><span style="font-size:13px;color:var(--text-secondary)">3-way handshake (SYN, SYN-ACK, ACK) before data. 4-way teardown (FIN, ACK, FIN, ACK).</span></div>
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px"><strong>20-byte Header</strong><br><span style="font-size:12px;font-family:var(--font-mono);color:var(--text-secondary)">src port | dst port | seq | ack | flags | window | checksum | urgent</span></div>
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px"><strong>Flow + Congestion Control</strong><br><span style="font-size:13px;color:var(--text-secondary)">Sliding window, slow start, congestion avoidance. Adapts to network conditions.</span></div>
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px"><strong>Use Cases</strong><br><span style="font-size:13px;color:var(--text-secondary)">HTTP/HTTPS, SSH, FTP, email (SMTP/IMAP), databases. Anything needing reliability.</span></div>
        </div>
      </div>
      <div class="panel" style="border-left:4px solid #f59e0b">
        <div class="panel-header"><span class="panel-title">🟡 UDP (User Datagram Protocol)</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="padding:10px;background:rgba(245,158,11,.08);border-radius:8px"><strong>Unreliable</strong><br><span style="font-size:13px;color:var(--text-secondary)">No guarantee of delivery, ordering, or duplicate protection. Fire-and-forget.</span></div>
          <div style="padding:10px;background:rgba(245,158,11,.08);border-radius:8px"><strong>Connectionless</strong><br><span style="font-size:13px;color:var(--text-secondary)">No handshake. Just send. No connection state maintained on either side.</span></div>
          <div style="padding:10px;background:rgba(245,158,11,.08);border-radius:8px"><strong>8-byte Header</strong><br><span style="font-size:12px;font-family:var(--font-mono);color:var(--text-secondary)">src port | dst port | length | checksum</span></div>
          <div style="padding:10px;background:rgba(245,158,11,.08);border-radius:8px"><strong>No Flow Control</strong><br><span style="font-size:13px;color:var(--text-secondary)">Sends at whatever rate the application produces. Can overwhelm the receiver.</span></div>
          <div style="padding:10px;background:rgba(245,158,11,.08);border-radius:8px"><strong>Use Cases</strong><br><span style="font-size:13px;color:var(--text-secondary)">DNS, streaming video/audio, VoIP, online gaming, DHCP, NTP. Speed > reliability.</span></div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Header Comparison</span></div>
        <div style="padding:16px">
          <canvas id="tuv-canvas" height="160" style="width:100%;min-width:500px;border-radius:8px;background:var(--bg-surface)"></canvas>
        </div>
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    const canvas = document.getElementById('tuv-canvas');
    if (!canvas) return;
    const W = canvas.width = canvas.offsetWidth || 600, H = canvas.height;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, W, H);

    const cellW = W / 8, cellH = 28;
    const tcpFields = ['src port\n(16)', 'dst port\n(16)', 'seq num\n(32)', 'ack num\n(32)', 'flags\n(16)', 'window\n(16)', 'chksum\n(16)', 'urgent\n(16)'];
    const udpFields = ['src port\n(16)', 'dst port\n(16)', 'length\n(16)', 'chksum\n(16)', '', '', '', ''];

    ctx.fillStyle = '#22c55e'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left';
    ctx.fillText('TCP Header (20 bytes)', 10, 16);
    tcpFields.forEach((f, i) => {
      if (!f) return;
      const x = i * cellW, y = 24;
      ctx.fillStyle = 'rgba(34,197,94,.15)'; ctx.fillRect(x, y, cellW * (i<5?1:i<7?2:2), cellH);
      ctx.strokeStyle = 'rgba(34,197,94,.4)'; ctx.strokeRect(x, y, cellW * (i<5?1:i<7?2:2), cellH);
      ctx.fillStyle = '#fff'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(f, x + cellW * (i<5?0.5:i<7?1:1), y + 12);
    });

    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left';
    ctx.fillText('UDP Header (8 bytes)', 10, 78);
    udpFields.forEach((f, i) => {
      if (!f) return;
      const x = i * cellW, y = 86;
      ctx.fillStyle = 'rgba(245,158,11,.15)'; ctx.fillRect(x, y, cellW * 2, cellH);
      ctx.strokeStyle = 'rgba(245,158,11,.4)'; ctx.strokeRect(x, y, cellW * 2, cellH);
      ctx.fillStyle = '#fff'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(f, x + cellW, y + 12);
    });

    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter'; ctx.textAlign = 'right';
    ctx.fillText('TCP: 20-60 bytes of overhead per segment', W - 10, 140);
    ctx.fillText('UDP: 8 bytes of overhead per datagram', W - 10, 155);
  }, 50);

  document.getElementById('tuv-guide-btn').addEventListener('click', () => openGuide('tcpvsudp'));
}
