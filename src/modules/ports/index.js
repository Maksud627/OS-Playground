import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

export function renderPorts(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(249,115,22,.15)">🚪</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#f97316">Ports</h1>
        <p class="module-subtitle">Ports identify services on a host. Understand the 0-65535 range, well-known ports, and how bind() assigns them.</p>
      </div>
      <button class="btn btn-secondary" id="ports-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Interactive Port Scanner</span></div>
          <div class="panel-body">
            <div class="form-group"><label class="form-label">Service Lookup</label><input class="form-input" id="port-lookup" type="number" min="0" max="65535" value="443" placeholder="443"></div>
            <button class="btn btn-primary" id="port-check-btn" style="width:100%;background:#f97316">🔍 Look Up Port</button>
            <div id="port-result" style="margin-top:12px;text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--text-muted)">Enter a port number</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Port Ranges</span></div>
          <div class="panel-body" style="font-size:13px;line-height:2">
            <div style="color:#ef4444"><strong>0-1023:</strong> Well-Known / Privileged (root only)</div>
            <div style="color:#f59e0b"><strong>1024-49151:</strong> Registered (IANA assigned)</div>
            <div style="color:#22c55e"><strong>49152-65535:</strong> Ephemeral / Dynamic (temporary)</div>
          </div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Common Well-Known Ports</span></div>
          <div style="padding:12px">
            <table class="data-table">
              <thead><tr><th>Port</th><th>Service</th><th>Protocol</th></tr></thead>
              <tbody>
                <tr><td style="font-weight:700">20</td><td>FTP (Data)</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">21</td><td>FTP (Control)</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">22</td><td>SSH</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">25</td><td>SMTP (Email)</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">53</td><td>DNS</td><td>UDP/TCP</td></tr>
                <tr><td style="font-weight:700">80</td><td>HTTP</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">110</td><td>POP3 (Email)</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">143</td><td>IMAP (Email)</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">443</td><td>HTTPS</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">3306</td><td>MySQL</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">5432</td><td>PostgreSQL</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">6379</td><td>Redis</td><td>TCP</td></tr>
                <tr><td style="font-weight:700">27017</td><td>MongoDB</td><td>TCP</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const services = {
    20:'FTP (Data Transfer)',21:'FTP (Control)',22:'SSH (Secure Shell)',25:'SMTP (Email Sending)',
    53:'DNS (Domain Name System)',80:'HTTP (Web)',110:'POP3 (Email Retrieval)',
    143:'IMAP (Email)',443:'HTTPS (Secure Web)',587:'SMTP with STARTTLS',
    3306:'MySQL',5432:'PostgreSQL',6379:'Redis',8080:'HTTP Alternative',
    27017:'MongoDB',3389:'RDP (Remote Desktop)',
  };

  document.getElementById('ports-guide-btn').addEventListener('click', () => openGuide('ports'));
  document.getElementById('port-check-btn').addEventListener('click', () => {
    const port = parseInt(document.getElementById('port-lookup').value);
    if (isNaN(port) || port < 0 || port > 65535) { showToast('Port must be 0-65535', 'error'); return; }
    const service = services[port];
    const range = port < 1024 ? 'Well-Known (privileged)' : port < 49152 ? 'Registered' : 'Ephemeral';
    document.getElementById('port-result').innerHTML = service
      ? `<div style="color:#22c55e">Port ${port} → <strong>${service}</strong></div><div style="color:var(--text-dim);font-size:11px;margin-top:4px">${range}</div>`
      : `<div style="color:#f97316">Port ${port} → Unassigned</div><div style="color:var(--text-dim);font-size:11px;margin-top:4px">${range}</div>`;
    document.getElementById('port-result').style.color = service ? '#22c55e' : '#f97316';
  });
}
