export function renderDashboard(container) {
  container.innerHTML = `
  <div class="dashboard-page">
    <div class="dashboard-hero">
      <div class="hero-eyebrow">⚙️ Interactive Learning Platform</div>
      <h1 class="hero-title">Master <span>Operating Systems</span><br>by Building & Simulating</h1>
      <p class="hero-subtitle">Don't just read about OS concepts — operate them. Add processes, trigger deadlocks, cause page faults, and watch the OS make real-time decisions.</p>
      <div class="hero-stats">
        <div class="hero-stat"><span class="hero-stat-num" style="color:#a78bfa">31</span><span class="hero-stat-label">Modules</span></div>
        <div class="hero-stat"><span class="hero-stat-num" style="color:#38bdf8">50+</span><span class="hero-stat-label">Concepts</span></div>
        <div class="hero-stat"><span class="hero-stat-num" style="color:#34d399">100%</span><span class="hero-stat-label">Interactive</span></div>
      </div>
    </div>
    ${buildSection('💻 CPU & Processes', [
      { hash:'cpu', icon:'🖥️', title:'CPU Scheduling', desc:'Visualize how the OS decides which process runs next with live Gantt chart animations.', tags:['FCFS','SJF','Round Robin','Priority'], color:'#7c3aed' },
      { hash:'lifecycle', icon:'🔄', title:'Process Lifecycle', desc:'Watch processes move through the 5-state model: New→Ready→Running→Waiting→Terminated.', tags:['PCB','5-State','Scheduler'], color:'#a78bfa' },
      { hash:'processvthread', icon:'🧵', title:'Processes vs Threads', desc:'Compare process isolation vs thread sharing side-by-side with an interactive diagram.', tags:['Address Space','Stack','TLS'], color:'#8b5cf6' },
      { hash:'contextswitch', icon:'⏭️', title:'Context Switching', desc:'See what happens when the CPU switches processes — PCB save, register dump, TLB flush.', tags:['PCB Save','Dispatch','Overhead'], color:'#f59e0b' },
      { hash:'syscalls', icon:'🔧', title:'System Calls', desc:'Trace fork(), open(), read(), write() across the user→kernel boundary.', tags:['fork/exec','User→Kernel','Trap'], color:'#ec4899' },
    ])}
    ${buildSection('🧠 Memory', [
      { hash:'stackheap', icon:'📚', title:'Stack vs Heap', desc:'Visualize where variables live. Push stack frames, malloc heap blocks, see them grow.', tags:['Stack Frames','malloc/free','Layout'], color:'#8b5cf6' },
      { hash:'virtualmem', icon:'💾', title:'Virtual Memory', desc:'Walk through TLB lookups, page table walks, page faults, and address translation.', tags:['TLB','Page Walk','Demand Paging'], color:'#6366f1' },
      { hash:'memory', icon:'🧩', title:'Memory Paging', desc:'Allocate pages to frames, watch page tables populate, and see internal fragmentation.', tags:['Paging','Page Tables','Frames'], color:'#0ea5e9' },
      { hash:'replacement', icon:'📄', title:'Page Replacement', desc:'Enter a reference string and compare FIFO, LRU, Optimal, and Clock side-by-side.', tags:['FIFO','LRU','Optimal','Clock'], color:'#06b6d4' },
      { hash:'memalloc', icon:'🗂️', title:'Memory Allocation', desc:'Allocate blocks with First Fit, Best Fit, and Worst Fit on a visible partition map.', tags:['First Fit','Best Fit','Worst Fit'], color:'#d946ef' },
    ])}
    ${buildSection('🔀 Concurrency', [
      { hash:'race', icon:'🏁', title:'Race Conditions', desc:'Two threads, one shared counter, no lock. Watch updates get lost — then enable the mutex.', tags:['Race','Critical Section','Lost Updates'], color:'#f97316' },
      { hash:'mutexes', icon:'🔒', title:'Mutexes', desc:'See how mutex lock/unlock enforces mutual exclusion on a shared resource.', tags:['lock()','unlock()','Ownership'], color:'#ef4444' },
      { hash:'semaphores', icon:'🚦', title:'Semaphores', desc:'Control access with counting semaphores. See wait/signal in action with a visual counter.', tags:['wait/signal','P/V','Binary Semaphore'], color:'#f59e0b' },
      { hash:'producerconsumer', icon:'🏭', title:'Producer-Consumer', desc:'Fill and drain a bounded buffer. See full/empty semaphore coordination between threads.', tags:['Bounded Buffer','Full/Empty','Synchronization'], color:'#14b8a6' },
      { hash:'deadlock', icon:'🔴', title:'Deadlock', desc:'Build a RAG, detect cycles, and run Bankers Algorithm to find the safe sequence.', tags:['RAG','Banker\'s','Cycle Detection'], color:'#dc2626' },
    ])}
    ${buildSection('🔗 IPC', [
      { hash:'pipes', icon:'🔗', title:'Pipes', desc:'Connect two processes with a pipe — write on one end, read from the other.', tags:['pipe()','fd[2]','Half-Duplex'], color:'#3b82f6' },
      { hash:'sharedmem', icon:'🧠', title:'Shared Memory', desc:'Map the same physical memory into two processes address spaces.', tags:['shmget()','shmat()','mmap()'], color:'#22c55e' },
      { hash:'msgqueues', icon:'📬', title:'Message Queues', desc:'Send structured messages between processes via kernel-maintained queues.', tags:['msgsnd()','msgrcv()','Priority'], color:'#eab308' },
      { hash:'socketsipc', icon:'🔌', title:'Unix Sockets', desc:'Local socket communication between processes on the same machine.', tags:['AF_UNIX','socketpair()','Bidirectional'], color:'#a855f7' },
    ])}
    ${buildSection('💾 I/O & Storage', [
      { hash:'filedesc', icon:'📋', title:'File Descriptors', desc:'Understand the FD table: 0=stdin, 1=stdout, 2=stderr. See how open() allocates FDs.', tags:['FD Table','stdin/stdout','open/close'], color:'#0ea5e9' },
      { hash:'filesystem', icon:'📁', title:'File System', desc:'Explore inodes, directory entries, permissions, and block maps in a Unix-like FS.', tags:['Inodes','Permissions','Blocks'], color:'#14b8a6' },
      { hash:'hardsoftlinks', icon:'🔗', title:'Hard vs Soft Links', desc:'Create hard links (same inode) and soft links (path pointers). See the difference live.', tags:['ln','ln -s','Inode Count'], color:'#22c55e' },
      { hash:'disk', icon:'💿', title:'Disk Scheduler', desc:'Animate the disk arm sweeping cylinders across FCFS, SSTF, SCAN, C-SCAN, and LOOK.', tags:['FCFS','SSTF','SCAN','C-SCAN'], color:'#10b981' },
    ])}
    ${buildSection('🌐 Networking', [
      { hash:'tcpvsudp', icon:'⚖️', title:'TCP vs UDP', desc:'Compare reliability vs speed. See the overhead of TCP vs the bare-bones nature of UDP.', tags:['Reliable','Connectionless','Headers'], color:'#3b82f6' },
      { hash:'tcphandshake', icon:'🤝', title:'TCP Handshake', desc:'Walk through SYN→SYN-ACK→ACK with sequence numbers. See why 3 steps not 2.', tags:['SYN','SYN-ACK','SEQ Numbers'], color:'#06b6d4' },
      { hash:'ports', icon:'🚪', title:'Ports', desc:'Map services to port numbers. Understand ephemeral ports, well-known ports, and binding.', tags:['0-65535','Well-Known','bind()'], color:'#f97316' },
      { hash:'sockets', icon:'🔌', title:'Sockets & TCP', desc:'Full connection lifecycle: handshake, data, close. TCP state machine visualization.', tags:['connect()','send/recv','TIME_WAIT'], color:'#1d4ed8' },
    ])}
    ${buildSection('🐧 Linux Essentials', [
      { hash:'permissions', icon:'🔐', title:'Permissions', desc:'rwx for owner/group/other. See chmod octal values and test access in an interactive model.', tags:['rwx','chmod','umask'], color:'#22c55e' },
      { hash:'signals', icon:'📡', title:'Signals', desc:'Send SIGKILL, SIGTERM, SIGSTOP to processes. See signal handlers and default behaviors.', tags:['SIGKILL','SIGTERM','SIGINT'], color:'#ef4444' },
      { hash:'envvars', icon:'🌍', title:'Environment Vars', desc:'Explore PATH, HOME, USER. See how env vars propagate from parent to child processes.', tags:['PATH','export','getenv()'], color:'#f59e0b' },
      { hash:'piperedir', icon:'⏩', title:'Pipes & Redirect', desc:'Build shell pipelines: ls | grep | wc. Redirect stdout, stderr, and stdin with >, <, 2>.', tags:['|','>','<','2>&1'], color:'#3b82f6' },
    ])}
  </div>`;
}

function buildSection(heading, cards) {
  const cardsHTML = cards.map(c => `
    <a class="module-card" href="#/${c.hash}">
      <div class="card-icon-row">
        <div class="card-icon" style="background:${c.color}15">${c.icon}</div>
        <div class="card-arrow">→</div>
      </div>
      <div class="card-title">${c.title}</div>
      <div class="card-desc">${c.desc}</div>
      <div class="card-tags">${c.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}</div>
    </a>`).join('\n');

  return `
    <h2 class="db-section-hd">${heading}</h2>
    <div class="modules-grid">${cardsHTML}</div>`;
}
