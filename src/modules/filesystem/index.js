import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';
import { saveState, loadState } from '../../utils/storage.js';

const KEY = 'filesystem';

export function renderFilesystem(container) {
  const saved = loadState(KEY);
  if (saved && saved.files) { files = saved.files; inoCounter = saved.inoCounter; usedBlocks = new Set(saved.usedBlocks); } else initFS();
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(20,184,166,.15)">📁</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#2dd4bf">File System</h1>
        <p class="module-subtitle">Explore the structure of a Unix-like file system: inodes, directory entries, file descriptors, and permission bits.</p>
      </div>
      <button class="btn btn-secondary" id="fs-guide-btn">📖 Learn</button>
    </div>

    <div class="two-col">
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">File Explorer</span></div>
          <div id="fs-tree" style="padding:12px"></div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Create File</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Parent Directory</label>
              <input class="form-input" id="fs-parent" value="/" placeholder="/">
            </div>
            <div class="form-group">
              <label class="form-label">File Name</label>
              <input class="form-input" id="fs-name" placeholder="notes.txt">
            </div>
            <div class="form-group">
              <label class="form-label">Permissions (rwx)</label>
              <div style="display:flex;gap:8px">
                <div style="flex:1"><label style="font-size:10px;color:var(--text-muted)">Owner</label>
                  <input class="form-input" id="fs-perm-owner" value="rw-" style="text-align:center;font-family:var(--font-mono)" maxlength="3">
                </div>
                <div style="flex:1"><label style="font-size:10px;color:var(--text-muted)">Group</label>
                  <input class="form-input" id="fs-perm-group" value="r--" style="text-align:center;font-family:var(--font-mono)" maxlength="3">
                </div>
                <div style="flex:1"><label style="font-size:10px;color:var(--text-muted)">Other</label>
                  <input class="form-input" id="fs-perm-other" value="r--" style="text-align:center;font-family:var(--font-mono)" maxlength="3">
                </div>
              </div>
            </div>
            <button class="btn btn-primary" id="fs-create-btn" style="width:100%;background:#14b8a6">＋ Create File</button>
            <button class="btn btn-secondary" id="fs-mkdir-btn" style="width:100%;margin-top:6px">📁 Create Directory</button>
          </div>
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Inode Table</span></div>
          <div id="fs-inodes" style="padding:8px 14px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">Click a file to view its inode</p>
          </div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><span class="panel-title">Open File Descriptors</span></div>
          <div id="fs-fd-table" style="padding:8px 14px">
            <p style="color:var(--text-muted);font-size:13px;text-align:center">Process has 0 open file descriptors</p>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Block Map</span>
            <span style="font-size:11px;color:var(--text-muted)">(simplified)</span>
          </div>
          <div style="padding:14px;display:flex;flex-wrap:wrap;gap:4px" id="fs-blocks"></div>
        </div>
      </div>
    </div>
  </div>`;

  initFS();
}

let files = [];
let inoCounter = 1;
const BLOCK_COUNT = 16;
let usedBlocks = new Set();

function initFS() {
  files = [{ ino: 0, name: '/', type: 'dir', perms: { owner: 'rwx', group: 'r-x', other: 'r-x' }, parent: null, children: [], size: 0, blocks: [] }];
  inoCounter = 1; usedBlocks = new Set();
  bindFS();
  redrawFS();
}
function persistFS() { saveState(KEY, { files, inoCounter, usedBlocks: [...usedBlocks] }); }

function bindFS() {
  document.getElementById('fs-guide-btn').addEventListener('click', () => openGuide('filesystem'));
  document.getElementById('fs-create-btn').addEventListener('click', () => createFSNode('file'));
  document.getElementById('fs-mkdir-btn').addEventListener('click', () => createFSNode('dir'));
  window._fsSelect = selectFSNode;
}

function findDir(path) {
  if (path === '/' || path === '') return files[0];
  const parts = path.replace(/^\//, '').split('/');
  let current = files[0];
  for (const part of parts) {
    const child = files.find(f => f.parent === current.ino && f.name === part);
    if (!child || child.type !== 'dir') return null;
    current = child;
  }
  return current;
}

function createFSNode(type) {
  const parentPath = document.getElementById('fs-parent').value || '/';
  const parent = findDir(parentPath);
  if (!parent) { showToast(`Directory "${parentPath}" not found`, 'error'); return; }

  const name = (document.getElementById('fs-name').value || (type === 'dir' ? 'newdir' : 'newfile')).replace(/\//g, '');
  if (files.find(f => f.parent === parent.ino && f.name === name)) {
    showToast(`"${name}" already exists in ${parentPath}`, 'error');
    return;
  }

  const owner = document.getElementById('fs-perm-owner').value.slice(0,3) || 'rw-';
  const group = document.getElementById('fs-perm-group').value.slice(0,3) || 'r--';
  const other = document.getElementById('fs-perm-other').value.slice(0,3) || 'r--';

  const size = type === 'file' ? Math.floor(Math.random() * 4096) + 128 : 0;
  const blockCount = type === 'file' ? Math.max(1, Math.ceil(size / 512)) : 0;
  const blocks = [];
  for (let i = 0; i < blockCount; i++) {
    let b = 0;
    while (usedBlocks.has(b) && b < BLOCK_COUNT) b++;
    if (b < BLOCK_COUNT) { usedBlocks.add(b); blocks.push(b); }
  }

  const node = {
    ino: inoCounter++,
    name,
    type,
    perms: { owner, group, other },
    parent: parent.ino,
    children: [],
    size,
    blocks,
    links: 1
  };

  files.push(node);
  parent.children.push(node.ino);

  redrawFS();
  showToast(`Created ${type === 'dir' ? 'directory' : 'file'} "${name}"`, 'success');
}

function selectFSNode(ino) {
  const node = files.find(f => f.ino === ino);
  if (!node) return;

  const el = document.getElementById('fs-inodes');
  el.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#2dd4bf;margin-bottom:12px">Inode #${node.ino} — ${node.name}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">
      <div style="color:var(--text-muted)">Type</div><div style="font-family:var(--font-mono)">${node.type === 'dir' ? 'directory' : 'regular file'}</div>
      <div style="color:var(--text-muted)">Links</div><div style="font-family:var(--font-mono)">${node.links}</div>
      <div style="color:var(--text-muted)">Size</div><div style="font-family:var(--font-mono)">${node.size} bytes</div>
      <div style="color:var(--text-muted)">Blocks</div><div style="font-family:var(--font-mono)">${node.blocks.join(', ') || 'none'}</div>
      <div style="color:var(--text-muted)">Permissions</div><div style="font-family:var(--font-mono)">${node.perms.owner}${node.perms.group}${node.perms.other}</div>
      <div style="color:var(--text-muted)">Numeric</div><div style="font-family:var(--font-mono)">${permsToOctal(node.perms)}</div>
    </div>`;

  // Show FDs if it's a regular file
  const fdEl = document.getElementById('fs-fd-table');
  if (node.type === 'file') {
    fdEl.innerHTML = `<table class="data-table">
      <thead><tr><th>FD</th><th>Path</th><th>Mode</th><th>Offset</th></tr></thead>
      <tbody>
        <tr><td>3</td><td>${getPath(node)}</td><td>${node.perms.owner[0]==='r'?'r':'-'}${node.perms.owner[1]==='w'?'w':'-'}</td><td style="font-family:var(--font-mono)">0</td></tr>
      </tbody></table>`;
  } else {
    fdEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center">No open file descriptors</p>';
  }

  drawBlockMap();
}

function getPath(node) {
  const parts = [];
  let current = node;
  while (current) {
    parts.unshift(current.name);
    current = files.find(f => f.ino === current.parent);
  }
  return parts.join('/').replace('//', '/');
}

function redrawFS() {
  renderTree();
  renderInodes();
  drawBlockMap();
}

function renderTree() {
  const el = document.getElementById('fs-tree');
  function renderNode(ino, depth) {
    const node = files.find(f => f.ino === ino);
    if (!node) return '';
    const indent = '&nbsp;&nbsp;'.repeat(depth);
    const icon = node.type === 'dir' ? '📁' : '📄';
    const perms = node.perms.owner + node.perms.group + node.perms.other;
    return `<div style="font-family:var(--font-mono);font-size:12px;padding:3px 0;cursor:pointer" onclick="window._fsSelect(${node.ino})">
      ${indent}${icon} <span style="color:#2dd4bf">${node.name}</span>
      ${node.type === 'file' ? '<span style="color:var(--text-dim);font-size:10px"> ' + node.size + 'B</span>' : ''}
      <span style="color:var(--text-dim);font-size:10px;margin-left:4px">[${perms}]</span>
      <span style="color:var(--text-muted);font-size:10px;margin-left:4px">ino=${node.ino}</span>
    </div>${node.children.map(c => renderNode(c, depth+1)).join('')}`;
  }
  el.innerHTML = renderNode(0, 0);
}

function renderInodes() {
  const el = document.getElementById('fs-inodes');
  el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center">Click a file from the tree to view its inode</p>';
}

function drawBlockMap() {
  const el = document.getElementById('fs-blocks');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < BLOCK_COUNT; i++) {
    const owner = files.find(f => f.blocks && f.blocks.includes(i));
    const div = document.createElement('div');
    div.style.cssText = `width:44px;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-family:var(--font-mono);transition:all 0.3s;border:1px solid`;
    if (owner) {
      div.style.background = 'rgba(20,184,166,0.2)';
      div.style.borderColor = '#14b8a6';
      div.style.color = '#2dd4bf';
      div.textContent = i;
      div.title = `${owner.name} (block ${i})`;
    } else {
      div.style.background = 'transparent';
      div.style.borderColor = 'rgba(255,255,255,0.05)';
      div.style.color = 'var(--text-dim)';
      div.textContent = i;
    }
    el.appendChild(div);
  }
}

function permsToOctal(p) {
  const bits = 'rwx';
  const toNum = (s) => (s.includes('r')?4:0) + (s.includes('w')?2:0) + (s.includes('x')?1:0);
  return toNum(p.owner) * 100 + toNum(p.group) * 10 + toNum(p.other);
}
