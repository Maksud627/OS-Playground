import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

export function renderSocketsIPC(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(168,85,247,.15)">🔌</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#c084fc">Unix Sockets (IPC)</h1>
        <p class="module-subtitle">Local inter-process communication using AF_UNIX sockets. Same API as network sockets but for same-host processes.</p>
      </div>
      <button class="btn btn-secondary" id="sipc-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Server Process</span></div>
          <div class="panel-body">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">
              socket(AF_UNIX, SOCK_STREAM, 0)<br>
              bind("/tmp/mysock")<br>
              listen() + accept()
            </div>
            <button class="btn btn-primary" id="sipc-server-start" style="width:100%;background:#a855f7">Start Server</button>
          </div>
        </div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Client Process</span></div>
          <div class="panel-body">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">
              socket(AF_UNIX, SOCK_STREAM, 0)<br>
              connect("/tmp/mysock")
            </div>
            <div class="form-group"><input class="form-input" id="sipc-msg" placeholder="Message to server..."></div>
            <button class="btn btn-primary" id="sipc-client-send" style="width:100%;background:#22c55e">📤 send()</button>
          </div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Connection State</span></div>
          <div style="padding:20px;text-align:center">
            <div style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">AF_UNIX Socket</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:#c084fc">Path: /tmp/mysock</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Messages</span></div>
          <div class="log-area" id="sipc-log" style="max-height:200px;font-family:var(--font-mono);font-size:12px">
            <p style="color:var(--text-muted)">Start the server and send messages from the client.</p>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">AF_UNIX vs AF_INET</span></div>
        <div style="padding:12px">
          <table class="data-table">
            <thead><tr><th>Property</th><th style="color:#c084fc">AF_UNIX</th><th style="color:#3b82f6">AF_INET (TCP)</th></tr></thead>
            <tbody>
              <tr><td>Address</td><td>File path (/tmp/sock)</td><td>IP:Port (127.0.0.1:8080)</td></tr>
              <tr><td>Speed</td><td>Fast (no TCP stack)</td><td>Slower (full TCP stack)</td></tr>
              <tr><td>Reach</td><td>Same host only</td><td>Any host on network</td></tr>
              <tr><td>Security</td><td>FS permissions</td><td>Firewall + TLS</td></tr>
              <tr><td>Byte Order</td><td>Native (no htonl)</td><td>Network byte order</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;

  let log = [], serverOn = false;

  function addLog(msg, type) {
    log.unshift(msg);
    if (log.length > 20) log.pop();
    document.getElementById('sipc-log').innerHTML = log.map(l => `<div style="padding:2px 0;color:${l.startsWith('CLIENT')?'#22c55e':'#c084fc'}">${l}</div>`).join('');
  }

  document.getElementById('sipc-guide-btn').addEventListener('click', () => openGuide('socketsipc'));
  document.getElementById('sipc-server-start').addEventListener('click', function() {
    if (serverOn) { addLog('SERVER: accept() → received new connection', 'info'); showToast('Server accepting connections', 'info'); }
    else { serverOn = true; addLog('SERVER: socket() → bind(/tmp/mysock) → listen()', 'info'); this.textContent = 'Accept New Connection'; this.style.background = '#22c55e'; showToast('Server started on /tmp/mysock', 'success'); }
  });
  document.getElementById('sipc-client-send').addEventListener('click', () => {
    if (!serverOn) { showToast('Start the server first!', 'warning'); return; }
    const msg = document.getElementById('sipc-msg').value || 'Hello';
    addLog(`CLIENT: connect(/tmp/mysock) → send("${msg}")`, 'info');
    addLog(`SERVER: recv("${msg}") → send("ACK")`, 'info');
    addLog(`CLIENT: recv("ACK")`, 'info');
    document.getElementById('sipc-msg').value = '';
    showToast(`Sent: "${msg}" → received ACK`, 'success');
  });
}
