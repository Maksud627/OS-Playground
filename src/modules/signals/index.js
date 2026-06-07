import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

const signals = [
  { num:1, name:'SIGHUP', desc:'Hangup detected', action:'Terminate', default:'Terminate' },
  { num:2, name:'SIGINT', desc:'Interrupt from keyboard (Ctrl+C)', action:'Terminate', default:'Terminate' },
  { num:3, name:'SIGQUIT', desc:'Quit from keyboard (Ctrl+\\)', action:'Core dump', default:'Core dump' },
  { num:9, name:'SIGKILL', desc:'Kill signal (cannot be caught)', action:'Terminate', default:'Terminate' },
  { num:15, name:'SIGTERM', desc:'Termination signal', action:'Terminate', default:'Terminate' },
  { num:17, name:'SIGCHLD', desc:'Child stopped or terminated', action:'Ignore', default:'Ignore' },
  { num:18, name:'SIGCONT', desc:'Continue if stopped', action:'Continue', default:'Continue' },
  { num:19, name:'SIGSTOP', desc:'Stop process (cannot be caught)', action:'Stop', default:'Stop' },
  { num:20, name:'SIGTSTP', desc:'Stop from keyboard (Ctrl+Z)', action:'Stop', default:'Stop' },
];

export function renderSignals(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(239,68,68,.15)">📡</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#f87171">Signals</h1>
        <p class="module-subtitle">Signals are software interrupts sent to processes. Send SIGKILL, SIGTERM, and see how processes react.</p>
      </div>
      <button class="btn btn-secondary" id="sig-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Target Process</span></div>
          <div class="panel-body">
            <div style="text-align:center;font-size:14px;font-weight:700;margin-bottom:8px" id="sig-target-state">PID 1337 — <span style="color:#22c55e">RUNNING</span></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${signals.map(s => `<button class="btn btn-sm" style="background:${s.num===9?'rgba(239,68,68,.2)':''};border-color:${s.num===9?'rgba(239,68,68,.3)':''};color:${s.num===9?'#f87171':''}" id="sig-btn-${s.num}">${s.name}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Signal Behavior</span></div>
          <div class="panel-body" style="font-size:13px;line-height:1.8;color:var(--text-secondary)">
            <strong>Default Actions:</strong>
            <div>• <span style="color:#ef4444">Terminate</span> — Kill the process</div>
            <div>• <span style="color:#f59e0b">Stop</span> — Pause (can resume with SIGCONT)</div>
            <div>• <span style="color:#22c55e">Continue</span> — Resume a stopped process</div>
            <div>• <span style="color:#7c3aed">Core dump</span> — Terminate + save memory to core file</div>
            <div>• <span style="color:var(--text-dim)">Ignore</span> — Do nothing</div>
            <div style="margin-top:8px"><strong style="color:#ef4444">SIGKILL (9)</strong> and <strong style="color:#f59e0b">SIGSTOP (19)</strong> cannot be caught, blocked, or ignored.</div>
          </div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Signal Table</span></div>
          <div style="padding:12px">
            <table class="data-table">
              <thead><tr><th>#</th><th>Signal</th><th>Description</th><th>Default</th></tr></thead>
              <tbody>${signals.map(s => `
                <tr>
                  <td style="font-weight:700">${s.num}</td>
                  <td style="color:${s.num===9?'#ef4444':s.num===15?'#f59e0b':'#60a5fa'}">${s.name}</td>
                  <td>${s.desc}</td>
                  <td style="color:${s.action==='Terminate'?'#ef4444':s.action==='Stop'?'#f59e0b':'#22c55e'}">${s.default}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Event Log</span></div>
          <div class="log-area" id="sig-log" style="max-height:140px"><p style="color:var(--text-muted)">Send a signal to see its effect</p></div>
        </div>
      </div>
    </div>
  </div>`;

  const log = [];
  function addLog(msg, type) {
    log.unshift(`<div class="log-entry ${type}"><span class="log-time">${new Date().toLocaleTimeString('en',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span><span class="log-msg">${msg}</span></div>`);
    if (log.length > 20) log.pop();
    document.getElementById('sig-log').innerHTML = log.join('');
  }

  let state = 'RUNNING';

  document.getElementById('sig-guide-btn').addEventListener('click', () => openGuide('signals'));
  signals.forEach(s => {
    document.getElementById(`sig-btn-${s.num}`).addEventListener('click', () => {
      if (state === 'TERMINATED' && s.num !== 18) { showToast('Process is already terminated!', 'error'); return; }
      if (s.num === 9 || s.num === 15) {
        state = s.num === 9 ? 'TERMINATED' : 'TERMINATED';
        document.getElementById('sig-target-state').innerHTML = 'PID 1337 — <span style="color:#ef4444">TERMINATED</span>';
        addLog(`${s.name} sent → Process terminated`, 'danger');
        showToast(`${s.name}: Process killed`, 'error');
      } else if (s.num === 19 || s.num === 20) {
        state = 'STOPPED';
        document.getElementById('sig-target-state').innerHTML = 'PID 1337 — <span style="color:#f59e0b">STOPPED</span>';
        addLog(`${s.name} sent → Process stopped`, 'warning');
        showToast(`${s.name}: Process stopped`, 'warning');
      } else if (s.num === 18) {
        state = 'RUNNING';
        document.getElementById('sig-target-state').innerHTML = 'PID 1337 — <span style="color:#22c55e">RUNNING</span>';
        addLog(`${s.name} sent → Process resumed`, 'success');
        showToast('SIGCONT: Process resumed', 'success');
      } else if (s.num === 2) {
        state = 'TERMINATED';
        document.getElementById('sig-target-state').innerHTML = 'PID 1337 — <span style="color:#ef4444">TERMINATED (Ctrl+C)</span>';
        addLog(`${s.name} sent → Process interrupted`, 'danger');
        showToast(`${s.name}: Interrupted`, 'error');
      } else {
        addLog(`${s.name} sent`, 'info');
        showToast(`${s.name}: ${s.desc}`, 'info');
      }
    });
  });
}
