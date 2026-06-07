import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'permissions';
let owner = 'rwx', group = 'r-x', other = 'r--';

export function renderPermissions(container) {
  const saved = loadState(KEY);
  if (saved) { owner = saved.owner || 'rwx'; group = saved.group || 'r-x'; other = saved.other || 'r--'; }

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(34,197,94,.15)">🔐</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#4ade80">Permissions</h1>
        <p class="module-subtitle">Toggle read/write/execute bits for owner, group, and other. See the octal chmod value in real time.</p>
      </div>
      <button class="btn btn-secondary" id="perm-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Permission Matrix</span></div>
          <div style="padding:16px">
            <table style="width:100%;text-align:center;font-size:14px;border-collapse:collapse" id="perm-matrix">
              <thead>
                <tr style="color:var(--text-muted);font-size:11px">
                  <th style="padding:8px"></th><th style="padding:8px">Read (r)</th><th style="padding:8px">Write (w)</th><th style="padding:8px">Execute (x)</th>
                </tr>
              </thead>
              <tbody>
                <tr id="perm-row-owner"><td style="text-align:left;padding:8px;font-weight:700;color:#a78bfa">Owner</td></tr>
                <tr id="perm-row-group"><td style="text-align:left;padding:8px;font-weight:700;color:#0ea5e9">Group</td></tr>
                <tr id="perm-row-other"><td style="text-align:left;padding:8px;font-weight:700;color:#f59e0b">Other</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <button class="btn btn-secondary" id="perm-reset-btn" style="width:100%">↺ Reset to 755</button>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Permission String</span></div>
          <div style="padding:20px;text-align:center">
            <div style="font-size:48px;font-weight:900;font-family:var(--font-mono);letter-spacing:4px;color:var(--text-primary)" id="perm-string">${owner+group+other}</div>
            <div style="font-size:14px;color:var(--text-muted);margin-top:8px">chmod <strong style="color:#22c55e;font-size:20px" id="perm-octal">755</strong></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Meaning</span></div>
          <div class="panel-body" style="font-size:13px;line-height:1.8;color:var(--text-secondary)">
            <strong>r (4):</strong> Read file contents or list directory<br>
            <strong>w (2):</strong> Modify file or create/delete files in directory<br>
            <strong>x (1):</strong> Execute file or enter directory (cd)<br>
            <strong style="color:#4ade80">Common:</strong> 755 (rwxr-xr-x), 644 (rw-r--r--), 700 (rwx------)
          </div>
        </div>
      </div>
    </div>
  </div>`;

  function persist() { saveState(KEY, { owner, group, other }); }

  function toggle(who, bit) {
    let cur = who === 'owner' ? owner : who === 'group' ? group : other;
    let arr = cur.split('');
    const idx = bit === 'r' ? 0 : bit === 'w' ? 1 : 2;
    arr[idx] = arr[idx] === bit ? '-' : bit;
    cur = arr.join('');
    if (who === 'owner') owner = cur; else if (who === 'group') group = cur; else other = cur;
    persist(); redraw();
  }

  function redraw() {
    document.getElementById('perm-string').textContent = owner + group + other;
    const octal = (owner.includes('r')?4:0)+(owner.includes('w')?2:0)+(owner.includes('x')?1:0) + '' +
      ((group.includes('r')?4:0)+(group.includes('w')?2:0)+(group.includes('x')?1:0)) + '' +
      ((other.includes('r')?4:0)+(other.includes('w')?2:0)+(other.includes('x')?1:0));
    document.getElementById('perm-octal').textContent = parseInt(octal).toString().padStart(3,'0');
    ['owner','group','other'].forEach(who => {
      const cur = who === 'owner' ? owner : who === 'group' ? group : other;
      const row = document.getElementById(`perm-row-${who}`);
      row.cells[1] ? row.cells[1].innerHTML = buildToggle(who,'r',cur.includes('r')) : null;
      row.cells[2] ? row.cells[2].innerHTML = buildToggle(who,'w',cur.includes('w')) : null;
      row.cells[3] ? row.cells[3].innerHTML = buildToggle(who,'x',cur.includes('x')) : null;
    });
  }

  function buildToggle(who, bit, on) {
    return `<div style="cursor:pointer;width:36px;height:36px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-family:var(--font-mono);border:2px solid ${on?'#22c55e':'var(--border)'};background:${on?'rgba(34,197,94,.15)':'transparent'};color:${on?'#22c55e':'var(--text-dim)'};transition:all 0.2s" onclick="window._permToggle('${who}','${bit}')">${on?bit:'-'}</div>`;
  }

  window._permToggle = toggle;

  document.getElementById('perm-guide-btn').addEventListener('click', () => openGuide('permissions'));
  document.getElementById('perm-reset-btn').addEventListener('click', () => { owner='rwx'; group='r-x'; other='r--'; persist(); redraw(); });
  redraw();
}
