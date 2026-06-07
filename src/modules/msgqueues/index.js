import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

let queue = [];

export function renderMsgQueues(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(234,179,8,.15)">📬</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#eab308">Message Queues</h1>
        <p class="module-subtitle">Send typed, prioritized messages between processes. Kernel maintains the queue — no shared memory needed.</p>
      </div>
      <button class="btn btn-secondary" id="mq-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Send Message (msgsnd)</span></div>
          <div class="panel-body">
            <div class="form-group"><label class="form-label">Message Type (mtype)</label><input class="form-input" id="mq-type" type="number" min="1" value="1"></div>
            <div class="form-group"><label class="form-label">Message Body</label><input class="form-input" id="mq-body" placeholder="Hello from Process A..."></div>
            <button class="btn btn-primary" id="mq-send-btn" style="width:100%;background:#eab308;color:#000">📤 msgsnd(msgqid, &msg)</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Receive Message (msgrcv)</span></div>
          <div class="panel-body">
            <div class="form-group"><label class="form-label">Receive type (0=first, >0=specific type)</label><input class="form-input" id="mq-recv-type" type="number" value="0"></div>
            <button class="btn btn-primary" id="mq-recv-btn" style="width:100%;background:#22c55e">📥 msgrcv(msgqid, &msg)</button>
            <div id="mq-recv-result" style="margin-top:12px;text-align:center;font-family:var(--font-mono);color:var(--text-muted)">No message received</div>
          </div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Kernel Message Queue</span></div>
          <div id="mq-queue" style="padding:12px;min-height:120px"><p style="color:var(--text-muted);font-size:13px;text-align:center">Queue is empty</p></div>
        </div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="color:#eab308" id="mq-count">0</div><div class="stat-label">Pending</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#22c55e" id="mq-sent">0</div><div class="stat-label">Sent</div></div>
          <div class="stat-card"><div class="stat-value" style="color:#7c3aed" id="mq-recv">0</div><div class="stat-label">Received</div></div>
        </div>
      </div>
    </div>
  </div>`;

  let sent = 0, recv = 0;

  function redraw() {
    document.getElementById('mq-count').textContent = queue.length;
    document.getElementById('mq-sent').textContent = sent;
    document.getElementById('mq-recv').textContent = recv;
    const el = document.getElementById('mq-queue');
    if (!queue.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center">Queue is empty</p>'; return; }
    el.innerHTML = queue.map((m, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--border);border-radius:6px;margin-bottom:4px;background:rgba(234,179,8,.05)">
        <span style="background:rgba(234,179,8,.2);color:#eab308;padding:2px 8px;border-radius:4px;font-family:var(--font-mono);font-size:11px;font-weight:700">type=${m.type}</span>
        <span style="font-size:12px;flex:1;color:var(--text-secondary)">${m.body}</span>
        <span style="color:var(--text-dim);font-size:10px">#${i}</span>
      </div>`).join('');
  }

  document.getElementById('mq-guide-btn').addEventListener('click', () => openGuide('msgqueues'));
  document.getElementById('mq-send-btn').addEventListener('click', () => {
    const type = parseInt(document.getElementById('mq-type').value) || 1;
    const body = document.getElementById('mq-body').value || ('msg_' + (sent + 1));
    queue.push({ type, body });
    sent++;
    document.getElementById('mq-body').value = '';
    showToast(`Sent: type=${type}, "${body}"`, 'success');
    redraw();
  });
  document.getElementById('mq-recv-btn').addEventListener('click', () => {
    const rtype = parseInt(document.getElementById('mq-recv-type').value) || 0;
    if (!queue.length) { showToast('Queue is empty!', 'warning'); return; }
    let idx = -1;
    if (rtype === 0) idx = 0;
    else idx = queue.findIndex(m => m.type === rtype);
    if (idx === -1) { showToast(`No message with type=${rtype}`, 'warning'); return; }
    const m = queue.splice(idx, 1)[0];
    recv++;
    document.getElementById('mq-recv-result').textContent = `Received: type=${m.type}, "${m.body}"`;
    document.getElementById('mq-recv-result').style.color = '#22c55e';
    showToast(`Received: "${m.body}"`, 'success');
    redraw();
  });

  redraw();
}
