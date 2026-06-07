import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

export function renderLinks(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(34,197,94,.15)">🔗</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#4ade80">Hard vs Soft Links</h1>
        <p class="module-subtitle">Hard links share the same inode. Soft (symbolic) links are just path pointers. See the difference live.</p>
      </div>
      <button class="btn btn-secondary" id="hl-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div class="panel" style="border-left:4px solid #22c55e">
        <div class="panel-header"><span class="panel-title">🔗 Hard Link (ln file link)</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px"><strong>Same Inode</strong><br><span style="color:var(--text-secondary);font-size:13px">Both names point to inode #42. Same data blocks, same permissions, same size.</span></div>
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px"><strong>Link Count = 2</strong><br><span style="color:var(--text-secondary);font-size:13px">The inode has a reference count. File is deleted only when count reaches 0 (all hard links removed).</span></div>
          <div style="padding:10px;background:rgba(239,68,68,.06);border-radius:8px"><strong>Limitations</strong><br><span style="color:var(--text-secondary);font-size:13px">Cannot link to directories (prevents cycles). Cannot cross filesystem boundaries.</span></div>
          <div id="hl-hard-demo" style="text-align:center;font-family:var(--font-mono);font-size:13px;padding:8px;border:1px solid var(--border);border-radius:6px">
            <div style="color:#22c55e">/home/file.txt → inode #42 (links=2)</div>
            <div style="color:#22c55e;margin-top:4px">/home/link.txt → inode #42 (links=2)</div>
          </div>
        </div>
      </div>
      <div class="panel" style="border-left:4px solid #3b82f6">
        <div class="panel-header"><span class="panel-title">🔗 Soft Link (ln -s target link)</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="padding:10px;background:rgba(59,130,246,.08);border-radius:8px"><strong>Different Inode</strong><br><span style="color:var(--text-secondary);font-size:13px">Symlink has its own inode (#99) containing just a path string "/home/file.txt".</span></div>
          <div style="padding:10px;background:rgba(59,130,246,.08);border-radius:8px"><strong>Dangling Links</strong><br><span style="color:var(--text-secondary);font-size:13px">If the target is deleted, the symlink becomes a "dangling" link — pointing to nothing.</span></div>
          <div style="padding:10px;background:rgba(34,197,94,.06);border-radius:8px"><strong>Advantages</strong><br><span style="color:var(--text-secondary);font-size:13px">Can link to directories. Can cross filesystem boundaries. Works like a shortcut/alias.</span></div>
          <div id="hl-soft-demo" style="text-align:center;font-family:var(--font-mono);font-size:13px;padding:8px;border:1px solid var(--border);border-radius:6px">
            <div style="color:#22c55e">/home/file.txt → inode #42 (links=1)</div>
            <div style="color:#3b82f6;margin-top:4px">/home/shortcut.txt → inode #99 → "/home/file.txt"</div>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Comparison</span></div>
        <div style="padding:12px">
          <table class="data-table">
            <thead><tr><th>Property</th><th style="color:#22c55e">Hard Link</th><th style="color:#3b82f6">Soft Link</th></tr></thead>
            <tbody>
              <tr><td>Command</td><td style="font-family:var(--font-mono)">ln target link</td><td style="font-family:var(--font-mono)">ln -s target link</td></tr>
              <tr><td>Inode</td><td>Same as target</td><td>New inode</td></tr>
              <tr><td>Link count</td><td>Increments</td><td>Does not increment</td></tr>
              <tr><td>Delete target</td><td>Data survives (links>0)</td><td>Dangling symlink</td></tr>
              <tr><td>Cross filesystems</td><td>❌ No</td><td>✅ Yes</td></tr>
              <tr><td>Link to directory</td><td>❌ No</td><td>✅ Yes</td></tr>
              <tr><td>Disk space</td><td>Zero (just dir entry)</td><td>Small (inode + path)</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Interactive Demo</span></div>
        <div class="panel-body" id="hl-interactive">
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
            <button class="btn btn-primary btn-sm" id="hl-hard-btn" style="background:#22c55e">ln file hardlink</button>
            <button class="btn btn-primary btn-sm" id="hl-soft-btn" style="background:#3b82f6">ln -s file softlink</button>
            <button class="btn btn-danger btn-sm" id="hl-rm-orig-btn">rm file (original)</button>
            <button class="btn btn-secondary btn-sm" id="hl-reset-btn">Reset</button>
          </div>
          <div id="hl-state" style="font-family:var(--font-mono);font-size:13px;line-height:2">
            <div style="color:#22c55e">file.txt → inode #42 [links: 1] ✅ exists</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  let links = 1, hasSoftLink = false, origExists = true;

  function redraw() {
    const el = document.getElementById('hl-state');
    let html = `<div style="color:${origExists?'#22c55e':'#ef4444'}">file.txt → inode #42 [links: ${links}] ${origExists?'✅ exists':'❌ deleted'}</div>`;
    if (hasHardLink()) html += `<div style="color:${origExists?'#22c55e':'#22c55e'}">hardlink → inode #42 ${origExists||links>1?'✅ valid':'❌'}</div>`;
    if (hasSoftLink) html += `<div style="color:${origExists?'#3b82f6':'#ef4444'}">softlink → "${origExists?'/file.txt':'/file.txt (dangling!)'}" ${origExists?'✅ valid':'❌ dangling'}</div>`;
    el.innerHTML = html;
  }
  function hasHardLink() { return links > 1; }

  document.getElementById('hl-guide-btn').addEventListener('click', () => openGuide('hardsoftlinks'));
  document.getElementById('hl-hard-btn').addEventListener('click', () => { links++; showToast('Hard link created — same inode, link count++', 'success'); redraw(); });
  document.getElementById('hl-soft-btn').addEventListener('click', () => { hasSoftLink = true; showToast('Soft link created — separate inode pointing to path', 'success'); redraw(); });
  document.getElementById('hl-rm-orig-btn').addEventListener('click', () => {
    if (!links) { showToast('Already deleted!', 'warning'); return; }
    origExists = false;
    if (hasHardLink()) { links--; showToast('Original deleted, but data survives via hard link!', 'info'); }
    else if (hasSoftLink) { links=0; showToast('Original deleted — softlink is now dangling!', 'warning'); }
    else { links=0; showToast('File fully deleted (link count = 0)', 'info'); }
    redraw();
  });
  document.getElementById('hl-reset-btn').addEventListener('click', () => { links=1; hasSoftLink=false; origExists=true; redraw(); });
}
