import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'envvars';
let vars = [
  { name:'HOME', value:'/home/user' },
  { name:'USER', value:'user' },
  { name:'PATH', value:'/usr/local/bin:/usr/bin:/bin' },
  { name:'SHELL', value:'/bin/bash' },
  { name:'PWD', value:'/home/user/projects' },
];

export function renderEnvVars(container) {
  const saved = loadState(KEY);
  if (saved && saved.vars) vars = saved.vars;

  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(245,158,11,.15)">🌍</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#fbbf24">Environment Variables</h1>
        <p class="module-subtitle">Explore how environment variables propagate from parent to child processes. Set, export, and see inheritance in action.</p>
      </div>
      <button class="btn btn-secondary" id="ev-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Set Variable</span></div>
          <div class="panel-body">
            <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="ev-name" placeholder="MY_VAR"></div>
            <div class="form-group"><label class="form-label">Value</label><input class="form-input" id="ev-value" placeholder="hello world"></div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-primary" id="ev-set-btn" style="flex:1;background:#f59e0b;color:#000">export VAR=VALUE</button>
              <button class="btn btn-danger btn-sm" id="ev-del-btn">✕</button>
            </div>
            <button class="btn btn-secondary" id="ev-reset-btn" style="width:100%;margin-top:6px">↺ Reset Defaults</button>
          </div>
        </div>
        <div class="concept-box" style="border-left-color:#f59e0b">
          <h4>📚 How Env Vars Work</h4>
          <p>When a process calls <strong>fork()</strong>, the child inherits the parent's <strong>entire environment</strong>. The child can modify its own env without affecting the parent. The <strong>export</strong> command marks a variable to be passed to child processes.</p>
        </div>
      </div>
      <div>
        <div class="panel">
          <div class="panel-header"><span class="panel-title">Process Environment</span></div>
          <div id="ev-table" style="padding:12px"></div>
        </div>
      </div>
    </div>
  </div>`;

  function persist() { saveState(KEY, { vars: vars.map(v=>({...v})) }); }
  function redraw() {
    document.getElementById('ev-table').innerHTML = `<table class="data-table">
      <thead><tr><th>Variable</th><th>Value</th><th></th></tr></thead>
      <tbody>${vars.map((v,i) => `
        <tr>
          <td style="color:#fbbf24;font-weight:600">$${v.name}</td>
          <td style="color:var(--text-secondary);font-family:var(--font-mono);font-size:12px">${v.value}</td>
          <td><button class="btn btn-danger btn-sm" onclick="window._evDel(${i})">✕</button></td>
        </tr>`).join('')}
      </tbody></table>`;
    persist();
  }

  window._evDel = (i) => { vars.splice(i, 1); redraw(); };

  document.getElementById('ev-guide-btn').addEventListener('click', () => openGuide('envvars'));
  document.getElementById('ev-set-btn').addEventListener('click', () => {
    const name = document.getElementById('ev-name').value.trim();
    const value = document.getElementById('ev-value').value;
    if (!name) { showToast('Enter a variable name', 'error'); return; }
    const existing = vars.find(v => v.name === name);
    if (existing) existing.value = value;
    else vars.push({ name, value });
    document.getElementById('ev-name').value = '';
    document.getElementById('ev-value').value = '';
    showToast(`export ${name}=${value}`, 'success');
    redraw();
  });
  document.getElementById('ev-del-btn').addEventListener('click', () => {
    const name = document.getElementById('ev-name').value.trim();
    if (!name) { showToast('Enter a variable name to delete', 'error'); return; }
    const idx = vars.findIndex(v => v.name === name);
    if (idx === -1) { showToast(`${name} not found`, 'error'); return; }
    vars.splice(idx, 1);
    document.getElementById('ev-name').value = '';
    showToast(`unset ${name}`, 'info');
    redraw();
  });
  document.getElementById('ev-reset-btn').addEventListener('click', () => {
    vars = [
      { name:'HOME', value:'/home/user' }, { name:'USER', value:'user' },
      { name:'PATH', value:'/usr/local/bin:/usr/bin:/bin' }, { name:'SHELL', value:'/bin/bash' },
      { name:'PWD', value:'/home/user/projects' },
    ];
    redraw();
  });

  redraw();
}
