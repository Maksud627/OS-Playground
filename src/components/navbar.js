const NAV_GROUPS = [
  {
    label: 'CPU & Processes',
    items: [
      { hash: 'cpu', label: 'CPU Scheduler', dot: '#7c3aed' },
      { hash: 'lifecycle', label: 'Process Lifecycle', dot: '#a78bfa' },
      { hash: 'processvthread', label: 'Processes vs Threads', dot: '#8b5cf6' },
      { hash: 'contextswitch', label: 'Context Switching', dot: '#f59e0b' },
      { hash: 'syscalls', label: 'System Calls', dot: '#ec4899' },
    ]
  },
  {
    label: 'Memory',
    items: [
      { hash: 'stackheap', label: 'Stack vs Heap', dot: '#8b5cf6' },
      { hash: 'virtualmem', label: 'Virtual Memory', dot: '#6366f1' },
      { hash: 'memory', label: 'Memory Paging', dot: '#0ea5e9' },
      { hash: 'replacement', label: 'Page Replacement', dot: '#06b6d4' },
      { hash: 'memalloc', label: 'Memory Allocation', dot: '#d946ef' },
    ]
  },
  {
    label: 'Concurrency',
    items: [
      { hash: 'race', label: 'Race Conditions', dot: '#f97316' },
      { hash: 'mutexes', label: 'Mutexes', dot: '#ef4444' },
      { hash: 'semaphores', label: 'Semaphores', dot: '#f59e0b' },
      { hash: 'producerconsumer', label: 'Producer-Consumer', dot: '#14b8a6' },
      { hash: 'deadlock', label: 'Deadlock', dot: '#dc2626' },
    ]
  },
  {
    label: 'IPC',
    items: [
      { hash: 'pipes', label: 'Pipes', dot: '#3b82f6' },
      { hash: 'sharedmem', label: 'Shared Memory', dot: '#22c55e' },
      { hash: 'msgqueues', label: 'Message Queues', dot: '#eab308' },
      { hash: 'socketsipc', label: 'Unix Sockets', dot: '#a855f7' },
    ]
  },
  {
    label: 'I/O & Storage',
    items: [
      { hash: 'filedesc', label: 'File Descriptors', dot: '#0ea5e9' },
      { hash: 'filesystem', label: 'File System', dot: '#14b8a6' },
      { hash: 'hardsoftlinks', label: 'Hard vs Soft Links', dot: '#22c55e' },
      { hash: 'disk', label: 'Disk Scheduler', dot: '#10b981' },
    ]
  },
  {
    label: 'Networking',
    items: [
      { hash: 'tcpvsudp', label: 'TCP vs UDP', dot: '#3b82f6' },
      { hash: 'tcphandshake', label: 'TCP Handshake', dot: '#06b6d4' },
      { hash: 'ports', label: 'Ports', dot: '#f97316' },
      { hash: 'sockets', label: 'Sockets & TCP', dot: '#1d4ed8' },
    ]
  },
  {
    label: 'Linux Essentials',
    items: [
      { hash: 'permissions', label: 'Permissions', dot: '#22c55e' },
      { hash: 'signals', label: 'Signals', dot: '#ef4444' },
      { hash: 'envvars', label: 'Environment Vars', dot: '#f59e0b' },
      { hash: 'piperedir', label: 'Pipes & Redirect', dot: '#3b82f6' },
    ]
  },
];

let sbScrollTop = 0;
let collapsedGroups = new Set();

export function initNavbar(activeHash) {
  const nav = document.getElementById('navbar');
  const groupsEl = nav.querySelector('.sb-groups');
  if (groupsEl) {
    sbScrollTop = groupsEl.scrollTop;
    collapsedGroups = new Set();
    groupsEl.querySelectorAll('.sb-group.collapsed').forEach((g) => {
      collapsedGroups.add(g.dataset.group);
    });
  }
  nav.innerHTML = `
    <div class="sb-logo" onclick="window.navigate('')">
      <div class="sb-logo-icon">⚙</div>
      <span class="sb-logo-text">OS Playground</span>
    </div>

    <div class="sb-groups">
      ${NAV_GROUPS.map(group => `
        <div class="sb-group" data-group="${group.label}">
          <div class="sb-group-hd" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="sb-group-label">${group.label}</span>
            <span class="sb-group-arrow">▾</span>
          </div>
          <div class="sb-group-items">
            ${group.items.map(item => `
              <button class="sb-link ${activeHash === item.hash ? 'active' : ''}"
                      onclick="window.navigate('${item.hash}')"
                      id="nav-${item.hash || 'home'}"
                      title="${item.label}">
                <span class="sb-dot" style="background:${item.dot}"></span>
                <span class="sb-link-label">${item.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <button class="sb-toggle" onclick="document.body.classList.toggle('sidebar-collapsed')" title="Toggle sidebar">◀</button>
  `;
  const newGroupsEl = nav.querySelector('.sb-groups');
  if (newGroupsEl) {
    newGroupsEl.scrollTop = sbScrollTop;
    newGroupsEl.querySelectorAll('.sb-group').forEach((g) => {
      if (collapsedGroups.has(g.dataset.group)) g.classList.add('collapsed');
    });
  }
}
