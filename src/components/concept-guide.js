const GUIDES = {
  cpu: {
    icon: '🖥️',
    title: 'CPU Scheduling',
    color: '#a78bfa',
    accent: 'var(--accent-cpu)',
    accentSoft: 'var(--accent-cpu-soft)',
    sections: [
      {
        heading: 'What Problem Does This Solve?',
        body: 'A CPU can only run <strong>one process at a time per core</strong>. When multiple processes are ready to execute, the OS must decide <em>which one to run next</em>. The <strong>CPU scheduler</strong> (short-term scheduler) picks the next process from the ready queue and dispatches it to the CPU. A good scheduler balances fairness, throughput, and response time.'
      },
      {
        heading: 'Key Terms',
        items: [
          '<strong>Arrival Time</strong> — When a process enters the ready queue.',
          '<strong>Burst Time</strong> — How long the process needs the CPU to complete.',
          '<strong>Completion / Finish Time</strong> — When the process finishes execution.',
          '<strong>Turnaround Time</strong> = Finish Time − Arrival Time. Total time from submission to completion.',
          '<strong>Waiting Time</strong> = Turnaround Time − Burst Time. Time spent waiting in the ready queue.',
          '<strong>Response Time</strong> — Time from submission to <em>first</em> CPU allocation.',
          '<strong>Throughput</strong> — Number of processes completed per unit time.',
          '<strong>Preemptive</strong> — The OS can interrupt a running process (SJF-P, RR, Priority-P).',
          '<strong>Non-Preemptive</strong> — A process runs until it finishes or blocks (FCFS).',
          '<strong>Context Switch</strong> — The overhead of saving/restoring process state when switching. RR with small quantum = more switches.'
        ]
      },
      {
        heading: 'Algorithm Overviews',
        items: [
          '<strong style="color:#7c3aed">FCFS</strong> — First Come First Served. Simplest. Processes run in arrival order. Can cause the <em>convoy effect</em> where short jobs wait behind long ones.',
          '<strong style="color:#0ea5e9">SJF (Preemptive)</strong> — Shortest Job First. Always runs the process with the smallest remaining burst. <em>Provably optimal</em> for minimizing average wait time, but requires knowing burst times in advance.',
          '<strong style="color:#22c55e">Round Robin</strong> — Each process gets a fixed <em>time quantum</em>. After using its quantum, it goes to the back of the queue. Prevents starvation, great for time-sharing. Smaller quantum = better response, more context switches.',
          '<strong style="color:#f59e0b">Priority (Preemptive)</strong> — Higher-priority processes run first. Can cause <em>starvation</em> — low-priority processes may wait forever. Solution: <em>aging</em> (gradually increase priority of waiting processes).'
        ]
      },
      {
        heading: 'Suggested Experiments',
        items: [
          'Try <strong style="color:#a78bfa">FCFS with one long burst</strong>: notice the convoy effect — short P2 and P4 wait behind a long P1.',
          'Run <strong style="color:#38bdf8">Round Robin with quantum=1</strong> vs quantum=10: see how smaller quantum improves response but increases context switches.',
          'Compare <strong style="color:#34d399">SJF vs FCFS</strong> on the same processes: SJF almost always has lower average wait time.',
          'In Priority scheduling, <strong>add a low-priority process</strong> and watch it starve while higher-priority ones keep arriving.'
        ]
      }
    ]
  },

  memory: {
    icon: '🧩',
    title: 'Memory Paging',
    color: '#38bdf8',
    accent: 'var(--accent-memory)',
    accentSoft: 'var(--accent-memory-soft)',
    sections: [
      {
        heading: 'What Problem Does This Solve?',
        body: 'Programs need memory to run. But if we load entire processes into <strong>contiguous</strong> physical memory blocks, we get <strong>external fragmentation</strong> — enough total free memory, but no single block large enough. <strong>Paging</strong> solves this by dividing memory into fixed-size chunks: <em>pages</em> (logical) and <em>frames</em> (physical). A page can go into any frame — no contiguity requirement.'
      },
      {
        heading: 'Key Terms',
        items: [
          '<strong>Page</strong> — A fixed-size chunk of logical (virtual) memory. The process\'s view.',
          '<strong>Frame</strong> — A fixed-size chunk of physical memory. Same size as a page.',
          '<strong>Page Table</strong> — Per-process table that maps page numbers → frame numbers. Stored in main memory.',
          '<strong>Page Fault</strong> — When a required page is not in a frame (not covered here — see Page Replacement module).',
          '<strong>Internal Fragmentation</strong> — Wasted space inside the last page (e.g., a 10 KB process with 4 KB pages needs 3 pages = 12 KB, wasting 2 KB).',
          '<strong>External Fragmentation</strong> — Gaps between allocated blocks. Paging <em>eliminates</em> this entirely.',
          '<strong>Logical Address</strong> — The address the process sees: (page number, offset).',
          '<strong>Physical Address</strong> — The actual RAM address: (frame number, offset).',
          '<strong>MMU</strong> — Memory Management Unit. Hardware that translates logical → physical addresses using the page table.'
        ]
      },
      {
        heading: 'How Address Translation Works',
        body: 'Given a logical address <strong>L</strong> and page size <strong>S</strong>:<br><br><strong>Page Number</strong> = L ÷ S<br><strong>Offset</strong> = L mod S<br><br>The MMU looks up the page number in the page table, gets the frame number, then:<br><strong>Physical Address</strong> = Frame Number × S + Offset'
      },
      {
        heading: 'Suggested Experiments',
        items: [
          'Change the <strong>page size</strong>: with smaller pages (1 KB), a 10 KB process uses 10 frames — more overhead but less internal fragmentation.',
          'Fill up all frames: add processes until no free frames remain. This is where <strong>page replacement</strong> (next module) becomes necessary.',
          'Notice <strong>internal fragmentation</strong> in the stats: a 10 KB process with 4 KB pages wastes 2 KB (12 KB allocated − 10 KB used).',
          'Observe how each process gets its own <strong>page table</strong> — unrelated processes never share frames.'
        ]
      }
    ]
  },

  replacement: {
    icon: '📄',
    title: 'Page Replacement',
    color: '#22d3ee',
    accent: 'var(--accent-replace)',
    accentSoft: 'var(--accent-replace-soft)',
    sections: [
      {
        heading: 'What Problem Does This Solve?',
        body: 'Physical memory is limited. When a <strong>page fault</strong> occurs (the requested page isn\'t in any frame) and all frames are full, the OS must <strong>evict</strong> one page to make room. Which page should it choose? A bad choice means evicting a page that will be needed soon — causing another fault. This is the <strong>page replacement problem</strong>.'
      },
      {
        heading: 'Key Terms',
        items: [
          '<strong>Page Fault</strong> — The requested page is not in memory. The OS must load it from disk.',
          '<strong>Page Hit</strong> — The requested page IS already in a frame. No I/O needed.',
          '<strong>Hit Ratio</strong> = Hits / (Hits + Faults). Higher is better.',
          '<strong>Reference String</strong> — The sequence of page numbers requested by a process over time.',
          '<strong>Victim Frame</strong> — The frame chosen for eviction.',
          '<strong>Bélády\'s Anomaly</strong> — For FIFO, adding MORE frames can sometimes cause MORE page faults! (Counterintuitive but real.)',
          '<strong>Dirty Bit</strong> — If the evicted page was modified, it must be written back to disk (slower eviction).'
        ]
      },
      {
        heading: 'Algorithm Overviews',
        items: [
          '<strong style="color:#7c3aed">FIFO</strong> — Evicts the oldest page (first one loaded). Simple. Suffers from Bélády\'s Anomaly.',
          '<strong style="color:#0ea5e9">LRU</strong> — Evicts the page least recently used. Excellent but expensive — requires tracking access order. Approximates optimal.',
          '<strong style="color:#22c55e">Optimal (Bélády\'s)</strong> — Evicts the page that won\'t be used for the longest time. <em>Theoretical ideal</em> — requires knowing the future. Used as a benchmark.',
          '<strong style="color:#f59e0b">Clock (Second Chance)</strong> — A practical LRU approximation used in real OSes. Each frame has a reference bit. On fault, scan: if bit=1, clear it; if bit=0, evict it.'
        ]
      },
      {
        heading: 'Suggested Experiments',
        items: [
          'Run <strong style="color:#7c3aed">FIFO with 3 then 4 frames</strong> on "1 2 3 4 1 2 5 1 2 3 4 5": you\'ll see Bélády\'s Anomaly — 4 frames gives MORE faults than 3!',
          'Compare <strong style="color:#22c55e">Optimal vs LRU</strong>: LRU\'s fault count should be close to Optimal — that\'s why it\'s a good approximation.',
          'Use the <strong>Step button</strong> to walk through frame-by-frame and watch exactly when evictions happen.',
          'Try a <strong>cyclic reference string</strong> like "1 2 3 4 1 2 3 4" with 3 frames — every access faults after the first rotation.'
        ]
      }
    ]
  },

  deadlock: {
    icon: '🔴',
    title: 'Deadlock',
    color: '#f87171',
    accent: 'var(--accent-deadlock)',
    accentSoft: 'var(--accent-deadlock-soft)',
    sections: [
      {
        heading: 'What Problem Does This Solve?',
        body: 'Processes need resources (files, printers, memory, locks). When processes hold resources while waiting for others, they can enter a <strong>circular wait</strong> — a deadlock where no process can proceed and none will release their resources. This is like two cars at a 4-way stop, each waiting for the other to move first. The OS must <strong>detect, prevent, or avoid</strong> deadlocks.'
      },
      {
        heading: 'The Four Necessary Conditions',
        body: 'All four must be true <em>simultaneously</em> for a deadlock to occur. Break any one and deadlock is impossible:',
        items: [
          '<strong>1. Mutual Exclusion</strong> — Only one process can use a resource at a time (e.g., a printer).',
          '<strong>2. Hold & Wait</strong> — A process holds some resources while waiting for others.',
          '<strong>3. No Preemption</strong> — Resources cannot be forcibly taken away; processes must release them voluntarily.',
          '<strong>4. Circular Wait</strong> — P1 waits for P2, P2 waits for P3, ..., Pn waits for P1 — a closed loop.'
        ]
      },
      {
        heading: 'Key Terms',
        items: [
          '<strong>RAG (Resource Allocation Graph)</strong> — A directed graph: processes (circles) and resources (squares). Request edges = process → resource. Assignment edges = resource → process.',
          '<strong>Cycle Detection</strong> — If the RAG has a cycle and each resource has only one instance, deadlock exists.',
          '<strong>Safe State</strong> — A state where there exists at least one execution order that finishes all processes.',
          '<strong>Banker\'s Algorithm</strong> — Prevents deadlock by only granting a request if the resulting state would be <em>safe</em>. Uses Need = Max − Allocation to check feasibility.',
          '<strong>Safe Sequence</strong> — An order of processes where each can finish with available + released resources from previous processes.'
        ]
      },
      {
        heading: 'Suggested Experiments',
        items: [
          'In <strong style="color:#f87171">RAG tab</strong>: create a cycle (P1→R2, P2→R1) and run cycle detection — see the deadlock.',
          'Load the <strong>5-process Banker\'s example</strong>: P0–P4 with 3 resource types. See the safe sequence unfold step by step.',
          'Modify the <strong>available resources</strong> to be too small: the system becomes unsafe and Banker\'s Algorithm refuses the state.',
          'In RAG: start with a safe graph, then <strong>add one request edge</strong> that creates a cycle — watch the result flip from safe to deadlock.'
        ]
      }
    ]
  },

  sync: {
    icon: '🍝',
    title: 'Process Synchronization',
    color: '#fbbf24',
    accent: 'var(--accent-sync)',
    accentSoft: 'var(--accent-sync-soft)',
    sections: [
      {
        heading: 'What Problem Does This Solve?',
        body: 'When multiple processes or threads share resources, they must <strong>coordinate</strong> to avoid race conditions. The classic example: two threads both increment a counter. Without synchronization, the final value can be wrong because the read-modify-write sequence interleaves. The <strong>Dining Philosophers</strong> problem is the canonical metaphor for this challenge.'
      },
      {
        heading: 'Key Terms',
        items: [
          '<strong>Race Condition</strong> — The outcome depends on the order of execution. Non-deterministic and dangerous.',
          '<strong>Critical Section</strong> — Code that accesses shared resources. Only one process should be in its critical section at a time.',
          '<strong>Mutex (Mutual Exclusion)</strong> — A lock that ensures only one process enters the critical section.',
          '<strong>Semaphore</strong> — A counter + wait queue. <code>wait()</code> (P operation) decrements; <code>signal()</code> (V operation) increments. Used for both mutual exclusion and ordering.',
          '<strong>Deadlock</strong> — All philosophers pick up their left chopstick — each waits forever for the right one.',
          '<strong>Starvation</strong> — One philosopher never gets both chopsticks because neighbors keep using them.',
          '<strong>Circular Wait</strong> — The root cause in dining philosophers. Each philosopher holds one chopstick, waiting for the one held by their neighbor.'
        ]
      },
      {
        heading: 'The Dining Philosophers Setup',
        body: '<strong>5 philosophers</strong> sit at a round table with <strong>5 chopsticks</strong> (one between each pair). Each philosopher alternates between Thinking and Eating. To eat, a philosopher needs <strong>both</strong> the left and right chopstick. The challenge: design a protocol where all philosophers eventually eat without deadlocking.'
      },
      {
        heading: 'Solutions Explained',
        items: [
          '<strong style="color:#22c55e">Semaphore (Room Scheduler)</strong> — Limit the table to N−1 philosophers at once. This breaks circular wait: the 5th philosopher is blocked, so a cycle can never form.',
          '<strong>Asymmetric Pickup</strong> — Odd-numbered philosophers pick up left first, even pick up right first. Prevents the classic deadlock pattern.',
          '<strong>Arbitrator / Butler</strong> — A central authority grants permission to eat. Simple but becomes a bottleneck.'
        ]
      },
      {
        heading: 'Suggested Experiments',
        items: [
          '<strong style="color:#ef4444">Turn OFF semaphore</strong> and start: watch all 5 philosophers become hungry simultaneously and deadlock.',
          'Turn <strong>semaphore ON</strong>: observe how at most 4 philosophers can be hungry — the 5th is blocked from entering.',
          'Click <strong>💀 Deadlock</strong> to instantly freeze the simulation in a classic circular wait.',
          'Change the number of philosophers to <strong>3, 5, or 7</strong>: see how the probability of deadlock changes with more participants.'
        ]
      }
    ]
  },

  disk: {
    icon: '💿',
    title: 'Disk Scheduling',
    color: '#4ade80',
    accent: 'var(--accent-disk)',
    accentSoft: 'var(--accent-disk-soft)',
    sections: [
      {
        heading: 'What Problem Does This Solve?',
        body: 'Reading from a hard disk involves <strong>seek time</strong> (moving the arm to the correct cylinder), <strong>rotational latency</strong> (waiting for the sector to spin under the head), and <strong>transfer time</strong>. Seek time dominates. When multiple I/O requests arrive, the <strong>disk scheduler</strong> decides their service order to minimize total head movement and keep average wait times fair.'
      },
      {
        heading: 'Key Terms',
        items: [
          '<strong>Cylinder</strong> — A set of tracks at the same distance from the spindle center. The disk arm moves between cylinders.',
          '<strong>Seek Time</strong> — Time to move the disk arm to the target cylinder. The dominant cost in disk I/O.',
          '<strong>Head Position</strong> — The current cylinder the disk arm is on.',
          '<strong>Total Seek</strong> — Sum of all seek distances for a given service order.',
          '<strong>Request Queue</strong> — The list of pending cylinder requests waiting to be serviced.',
          '<strong>Rotational Latency</strong> — Time for the desired sector to rotate under the head (not modeled here).',
          '<strong>Transfer Time</strong> — Time to actually read/write the data (usually negligible compared to seek).'
        ]
      },
      {
        heading: 'Algorithm Overviews',
        items: [
          '<strong style="color:#7c3aed">FCFS</strong> — Service in arrival order. Simple but the head can jump wildly across the disk. Baseline for comparison.',
          '<strong style="color:#0ea5e9">SSTF</strong> — Always pick the closest request. Low average seek but can cause <em>starvation</em> of far-away requests.',
          '<strong style="color:#22c55e">SCAN (Elevator)</strong> — Sweep in one direction, service all requests on the way, reverse at the end. Fair and predictable.',
          '<strong style="color:#f59e0b">C-SCAN</strong> — Like SCAN but jumps back to the start without servicing on the return. More uniform wait times.',
          '<strong style="color:#ec4899">LOOK</strong> — Like SCAN but reverses at the <em>last request</em>, not the disk boundary. Avoids unnecessary travel.'
        ]
      },
      {
        heading: 'Suggested Experiments',
        items: [
          'Compare <strong style="color:#7c3aed">FCFS vs SSTF</strong>: SSTF\'s total seek is dramatically lower. This is why real disk schedulers exist.',
          'See the <strong style="color:#22c55e">SCAN elevator pattern</strong> in the graph: head goes up, then down, servicing on both passes.',
          'Try C-SCAN: notice the <strong>jump back</strong> from the end to the start — this is the "circular" part.',
          'Enter <strong>extreme requests</strong> like "0 0 0 0" and watch how different algorithms handle repeated requests to the same cylinder.',
          'Look at the <strong>comparison bar chart</strong>: 5 algorithms, same workload — which wins for this particular queue?'
        ]
      }
    ]
  },

  lifecycle: {
    icon: '🔄',
    title: 'Process Lifecycle',
    color: '#a78bfa',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'The OS must track every process — its current activity, its resources, and its place in the execution queue. A <strong>process</strong> is a program in execution with its own address space, registers, and OS resources. The <strong>5-state model</strong> captures the entire journey from creation to termination.' },
      { heading: 'Key Terms', items: [
        '<strong>Process</strong> — A running program with its own PCB, address space, and resources. <em>Heavyweight</em>.',
        '<strong>Thread</strong> — The smallest unit of CPU execution. Multiple threads share one process\'s address space. <em>Lightweight</em>.',
        '<strong>PCB (Process Control Block)</strong> — Kernel data structure holding: PID, state, PC, registers, memory limits, open files.',
        '<strong>5 States:</strong> New → Ready → Running → Waiting → Terminated',
        '<strong>Context Switch</strong> — Saving current process PCB and loading the next one. Expensive — flushes TLB, caches.',
        '<strong>Scheduler</strong> — The component that picks which READY process moves to RUNNING.',
        '<strong>fork()</strong> — System call that creates a child process as a copy of the parent.'
      ]},
      { heading: 'Process vs Thread', items: [
        '<strong style="color:#a78bfa">Process:</strong> Independent address space, expensive to create, IPC required for communication, crash isolation.',
        '<strong style="color:#0ea5e9">Thread:</strong> Shared address space (heap, globals), cheap to create/spawn, share memory directly, one crash kills all threads.',
        '<strong>Key rule:</strong> Each thread has its own stack and registers but shares everything else with sibling threads.'
      ]},
      { heading: 'Suggested Experiments', items: [
        'Create 3-4 processes and watch them cycle through New→Ready→Running→Waiting→Terminated.',
        'Click on a RUNNING process and force it to WAITING (I/O) — see another READY process take the CPU.',
        'Switch to the <strong>Processes vs Threads tab</strong> to compare the two models side-by-side.',
        'Click any process to inspect its <strong>PCB</strong> — program counter, stack pointer, open file descriptors.'
      ]}
    ]
  },

  stackheap: {
    icon: '📚',
    title: 'Stack vs Heap',
    color: '#8b5cf6',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Every process has a carefully laid-out <strong>address space</strong>. Understanding where variables live — stack vs heap — explains recursion limits, dangling pointers, buffer overflows, and why malloc is slower than local variables.' },
      { heading: 'Memory Layout (top to bottom)', items: [
        '<strong>Kernel Space</strong> — Reserved for the OS. Not accessible to user processes.',
        '<strong>Stack ↓</strong> — Grows downward. LIFO. Stores local variables, return addresses, saved registers. Automatic. Fast. Limited size (~8 MB default on Linux).',
        '<strong>↓↓ Free space (stack and heap grow toward each other) ↓↓</strong>',
        '<strong>Heap ↑</strong> — Grows upward. malloc/free/new/delete. For dynamic data whose lifetime isn\'t tied to a function. Slower. Can fragment.',
        '<strong>BSS</strong> — Uninitialized global/static variables. Zeroed at startup.',
        '<strong>Data</strong> — Initialized global/static variables.',
        '<strong>Text/Code</strong> — The program instructions. Read-only.'
      ]},
      { heading: 'Key Terms', items: [
        '<strong>Stack Frame</strong> — Pushed when a function is called. Contains: return address, saved base pointer, local variables. Popped on return.',
        '<strong>Stack Overflow</strong> — Infinite recursion or huge local arrays exceed stack limit → crash.',
        '<strong>malloc() / free()</strong> — C library calls that manage the heap. malloc allocates bytes, free returns them.',
        '<strong>Fragmentation</strong> — Over time, heap alloc/free cycles leave unusable small gaps between blocks.',
        '<strong>Dangling Pointer</strong> — Pointer to freed memory. Heap bug. Use-after-free.',
        '<strong>Memory Leak</strong> — Allocated heap memory never freed. Process memory grows over time.'
      ]},
      { heading: 'Suggested Experiments', items: [
        'Push several stack frames and observe how they pile up from the top downward.',
        'Pop frames to see LIFO behavior — last frame in is first frame out.',
        'malloc several heap blocks of different sizes — watch them grow upward from the bottom.',
        'Allocate then free blocks to see fragmentation gaps appear.'
      ]}
    ]
  },

  virtualmem: {
    icon: '💾',
    title: 'Virtual Memory',
    color: '#6366f1',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Without virtual memory, every process would need its entire address space in physical RAM at once. With virtual memory, the OS can run programs larger than physical memory by <strong>demand paging</strong> — loading pages only when they\'re actually accessed.' },
      { heading: 'The Translation Pipeline', body: 'Every memory access goes through: <strong>1. TLB Lookup</strong> → <strong>2. Page Table Walk</strong> (if TLB miss) → <strong>3. Page Fault</strong> (if not in RAM) → <strong>4. Load from Disk</strong>' },
      { heading: 'Key Terms', items: [
        '<strong>TLB (Translation Lookaside Buffer)</strong> — On-CPU cache for page table entries. Hit = ~1 cycle. Miss = ~100 cycles.',
        '<strong>Page Table Walk</strong> — Multi-level lookup in memory (PGD → PMD → PTE). x86-64 uses 4 levels.',
        '<strong>Page Fault</strong> — The page is not in physical memory. Three types: minor (in page cache), major (must read disk), invalid (segfault).',
        '<strong>Demand Paging</strong> — Load pages only when accessed, not at program start. Backed by the <strong>page fault handler</strong>.',
        '<strong>Swap Space</strong> — Disk area used to evict pages when RAM is full. ~10,000× slower than RAM access.',
        '<strong>MMU</strong> — Hardware that performs TLB lookup and triggers page faults on miss.'
      ]},
      { heading: 'Suggested Experiments', items: [
        'Translate a few addresses and observe when the result comes from <strong style="color:#22c55e">TLB (fast)</strong> vs <strong style="color:#f59e0b">page table walk (slow)</strong>.',
        'Click <strong>Trigger Page Fault</strong> to force a missing page to be loaded from disk — see the steps in detail.',
        'Change the TLB size and see how it affects hit/miss ratio.',
        'Watch the TLB table populate with recent translations — LRU eviction removes old entries.'
      ]}
    ]
  },

  race: {
    icon: '🏁',
    title: 'Race Conditions',
    color: '#f97316',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'When multiple threads access shared data concurrently, the outcome can depend on the <strong>exact timing</strong> of their operations. This is a <strong>race condition</strong> — the single most common class of concurrency bugs. Mutexes solve it by enforcing <strong>mutual exclusion</strong> in critical sections.' },
      { heading: 'The Read-Modify-Write Problem', body: 'Even a simple <code>counter++</code> is not atomic. It\'s three operations:<br><strong>1.</strong> Read counter from memory<br><strong>2.</strong> Increment in register<br><strong>3.</strong> Write back to memory<br>If two threads interleave these steps, one update is <strong>lost</strong>.' },
      { heading: 'Key Terms', items: [
        '<strong>Race Condition</strong> — The program output depends on the nondeterministic order of thread execution.',
        '<strong>Critical Section</strong> — A code block that accesses shared data. Only one thread should execute it at a time.',
        '<strong>Mutex (Mutual Exclusion Lock)</strong> — A synchronization primitive. <code>lock()</code> blocks until the mutex is available; <code>unlock()</code> releases it.',
        '<strong>Atomic Operation</strong> — An operation that runs to completion without interruption. Hardware support (CMPXCHG, LL/SC).',
        '<strong>Deadlock</strong> — Two threads each hold a lock the other needs. Neither can proceed.',
        '<strong>Thread Safety</strong> — Code that works correctly even when called from multiple threads simultaneously.'
      ]},
      { heading: 'Suggested Experiments', items: [
        '<strong style="color:#ef4444">Turn mutex OFF</strong> and start: watch the counter value drop below expected — lost updates from race conditions.',
        'Turn <strong style="color:#22c55e">mutex ON</strong> and run again: counter hits exactly expected value, every time.',
        'Increase the <strong>operation delay</strong> to make the race window wider — more lost updates without mutex.',
        'Increase the <strong>number of threads</strong> to 4-6: more concurrency = more races without protection.'
      ]}
    ]
  },

  memalloc: {
    icon: '🗂️',
    title: 'Memory Allocation',
    color: '#d946ef',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Before paging, OSes allocated memory in <strong>variable-sized contiguous partitions</strong>. When a process requests memory, the allocator must find a free hole large enough. The choice of which hole to use — the <strong>allocation strategy</strong> — critically affects fragmentation and utilization.' },
      { heading: 'Key Terms', items: [
        '<strong>Partition / Hole</strong> — A contiguous range of free memory between allocated blocks.',
        '<strong>External Fragmentation</strong> — Total free memory is enough, but no single hole is large enough. <em>This is the core problem.</em>',
        '<strong>Internal Fragmentation</strong> — Wasted space <em>inside</em> an allocated block (allocated more than requested).',
        '<strong>Compaction</strong> — Moving allocated blocks to consolidate holes. Expensive — requires updating all pointers.'
      ]},
      { heading: 'Algorithm Overviews', items: [
        '<strong style="color:#d946ef">First Fit</strong> — Take the first hole that fits. Fast O(n) scan, but small useless holes accumulate at the front.',
        '<strong style="color:#22c55e">Best Fit</strong> — Take the smallest hole that fits. Minimal waste per allocation, but creates tiny unusable fragments.',
        '<strong style="color:#f97316">Worst Fit</strong> — Take the largest hole. Leaves a larger remainder, which can satisfy future large requests.'
      ]},
      { heading: 'Suggested Experiments', items: [
        'Allocate 3-4 blocks with <strong>First Fit</strong>: notice how blocks cluster at the beginning of memory.',
        'Switch to <strong>Best Fit</strong> and do the same allocations — compare the hole distribution.',
        'Allocate, deallocate, then allocate again: see how <strong>fragmentation</strong> creates unusable gaps.',
        'Fill memory until no hole can satisfy a request — this is what <strong>external fragmentation</strong> looks like.'
      ]}
    ]
  },

  filesystem: {
    icon: '📁',
    title: 'File System',
    color: '#14b8a6',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Storage devices are just arrays of blocks. The <strong>file system</strong> imposes structure: files, directories, permissions, and metadata. It answers: "Where is this file\'s data on disk?" and "Who is allowed to access it?"' },
      { heading: 'Key Terms', items: [
        '<strong>Inode (Index Node)</strong> — A data structure that stores metadata about a file: size, owner, permissions, timestamps, and <strong>pointers to data blocks</strong>. Every file has exactly one inode.',
        '<strong>File Descriptor (FD)</strong> — A per-process small integer that refers to an open file. 0=stdin, 1=stdout, 2=stderr. Subsequent opens get 3, 4, 5…',
        '<strong>Directory</strong> — A special file that maps human-readable names → inode numbers. It\'s just a table of (name, inode) pairs.',
        '<strong>Permission Bits</strong> — rwx for Owner, Group, and Other. Represented as octal: 755 = rwxr-xr-x.',
        '<strong>Hard Link</strong> — Multiple directory entries pointing to the same inode. Deleting one doesn\'t delete the file until link count = 0.',
        '<strong>Data Blocks</strong> — The actual file content. Indirection: inode → direct blocks → single indirect → double indirect → triple indirect.'
      ]},
      { heading: 'Suggested Experiments', items: [
        'Create a file and click it to see its <strong>inode</strong> — inode number, size, permissions in octal, blocks.',
        'Create a directory and add files inside it to build a <strong>directory tree</strong>.',
        'Observe how the <strong>block map</strong> fills as files are created — each file consumes disk blocks.',
        'Change permissions (rwx) and note the octal equivalent.'
      ]}
    ]
  },

  syscalls: {
    icon: '🔧',
    title: 'System Calls',
    color: '#ec4899',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'User programs run in <strong>Ring 3 (unprivileged)</strong> and cannot directly access hardware, files, or other processes. To request OS services, they make <strong>system calls</strong> — controlled entry points that transition to <strong>Ring 0 (kernel mode)</strong>.' },
      { heading: 'The User → Kernel Transition', body: '1. User program calls a library wrapper (e.g., glibc\'s <code>write()</code>)<br>2. Library puts syscall number in a register (e.g., EAX=1 for write)<br>3. Executes <code>syscall</code> instruction (or <code>int 0x80</code>)<br>4. CPU switches to kernel mode, jumps to syscall handler<br>5. Kernel executes <code>sys_write()</code><br>6. Result placed in return register, <code>sysret</code> back to user mode' },
      { heading: 'Key Terms', items: [
        '<strong>fork()</strong> — Creates an exact copy of the calling process. Returns 0 in child, child PID in parent. <em>The only way to create a new process in Unix.</em>',
        '<strong>exec()</strong> — Replaces the current process image with a new program. Does not return on success.',
        '<strong>open()</strong> — Opens a file and returns a file descriptor. Takes path, flags (O_RDONLY, O_WRONLY, O_RDWR), and mode.',
        '<strong>read()</strong> — Reads bytes from an FD into a buffer. Returns number of bytes read (0 = EOF).',
        '<strong>write()</strong> — Writes bytes from a buffer to an FD. Returns bytes written.',
        '<strong>close()</strong> — Closes an FD, freeing the kernel\'s entry.',
        '<strong>mmap()</strong> — Maps a file (or anonymous memory) into the process address space.',
        '<strong>wait()</strong> — Blocks until a child process changes state. Reaps zombie processes.'
      ]},
      { heading: 'Suggested Experiments', items: [
        'Invoke <strong>fork()</strong> to see a process split into parent and child with different PIDs.',
        'Try <strong>open() → read() → write() → close()</strong> in sequence to trace a full file I/O path through the kernel.',
        'Watch the <strong>User ↔ Kernel diagram</strong> animate each step: trap → kernel execution → return.',
        'Compare different syscalls in the trace to see the kernel mode execution steps.'
      ]}
    ]
  },

  sockets: {
    icon: '🔌',
    title: 'Sockets & TCP',
    color: '#3b82f6',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Processes on different machines need to communicate reliably. TCP provides a <strong>reliable, ordered, byte-stream</strong> abstraction over the unreliable IP layer. It handles packet loss, reordering, and congestion — all transparent to the application.' },
      { heading: 'The 3-Way Handshake', body: '<strong>Step 1:</strong> Client → Server: SYN, seq=X<br><strong>Step 2:</strong> Server → Client: SYN-ACK, seq=Y, ack=X+1<br><strong>Step 3:</strong> Client → Server: ACK, seq=X+1, ack=Y+1<br><br>Both sides now agree on initial sequence numbers and the connection is ESTABLISHED.' },
      { heading: 'Key Terms', items: ['<strong>Socket</strong> — An endpoint for communication. Identified by (IP address, port number) pair.','<strong>Port</strong> — A 16-bit number (0-65535) identifying a specific service on a host. Ports < 1024 are privileged.','<strong>SYN</strong> — Synchronize. Initiates connection and carries the initial sequence number.','<strong>ACK</strong> — Acknowledgment. Confirms receipt of data. Every byte has a sequence number.','<strong>FIN</strong> — Finish. Signals the sender has no more data to send. Triggers the 4-way close.','<strong>TIME_WAIT</strong> — After closing, the active closer waits 2×MSL to ensure any delayed packets are discarded.']},
      { heading: 'Suggested Experiments', items: ['Click <strong>Connect</strong> to walk through the 3-way handshake step by step.','Click <strong>Send Data</strong> to see PSH-ACK segments carrying HTTP data.','Click <strong>Close</strong> to walk through the 4-way teardown: FIN, ACK, FIN, ACK → CLOSED.','Switch to the <strong>TCP State Machine tab</strong> to see the full state diagram.']}
    ]
  },

  processvthread: {
    icon: '🧵', title: 'Processes vs Threads', color: '#8b5cf6',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Understanding the difference between processes and threads determines how you design concurrent applications. <strong>Processes</strong> give isolation; <strong>threads</strong> give shared-memory speed. Choose the wrong one and you get either excessive overhead or dangerous race conditions.' },
      { heading: 'Key Differences', items: [
        '<strong>Address Space:</strong> Process = independent. Thread = shared (heap, globals, code). Each thread has its own stack.',
        '<strong>Creation Cost:</strong> Process = expensive (fork + exec). Thread = cheap (just a new stack + registers).',
        '<strong>Context Switch:</strong> Process = slow (TLB flush, page table switch). Thread = fast (same page table).',
        '<strong>Crash Boundary:</strong> Process crash = isolated. Thread crash = kills all threads in the process.',
        '<strong>Communication:</strong> Process = IPC (pipes, sockets, shared memory). Thread = direct shared memory access.',
        '<strong>Synchronization:</strong> Process = not needed. Thread = mandatory (mutexes, semaphores).'
      ]},
      { heading: 'When to Use Which', items: [
        '<strong style="color:#a78bfa">Use Processes:</strong> High security needs, crash isolation required, distributed systems, Chrome tabs model.',
        '<strong style="color:#0ea5e9">Use Threads:</strong> Shared data access, low-latency communication, web servers handling requests, parallel computation.'
      ]}
    ]
  },

  contextswitch: {
    icon: '⏭️', title: 'Context Switching', color: '#f59e0b',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'A single CPU core can only run one process at a time. To create the illusion of multitasking, the OS rapidly <strong>context switches</strong> between processes — saving one\'s state and restoring another\'s. This happens thousands of times per second.' },
      { heading: 'The Switch Sequence', items: [
        '<strong>1. Save:</strong> Push current process registers, PC, SP to its PCB.',
        '<strong>2. Update State:</strong> Set current process to READY (or WAITING).',
        '<strong>3. Scheduler:</strong> Pick the next READY process from the queue.',
        '<strong>4. Restore:</strong> Load next process PCB → registers, PC, SP.',
        '<strong>5. Update State:</strong> Set next process to RUNNING.',
        '<strong>6. Resume:</strong> Jump to next process\'s program counter.'
      ]},
      { heading: 'The Cost', items: [
        '<strong>Direct Cost:</strong> ~1-5µs on modern CPUs to save/restore registers.',
        '<strong>Indirect Cost:</strong> TLB flush, L1/L2 cache pollution, branch predictor reset.',
        '<strong>At Scale:</strong> 10,000 switches/sec = 10-50ms of pure overhead per second.',
        '<strong>Mitigation:</strong> Thread pools, async I/O, fiber/green threads avoid context switches.'
      ]}
    ]
  },

  mutexes: {
    icon: '🔒', title: 'Mutexes', color: '#ef4444',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'When multiple threads access shared data, you need to <strong>serialize</strong> access to prevent race conditions. A mutex enforces <strong>mutual exclusion</strong> — only one thread can hold the lock and access the critical section at a time.' },
      { heading: 'How Mutexes Work', items: [
        '<strong>lock():</strong> If mutex is free, acquire it and enter critical section. If held by another thread, <strong>block</strong> until released.',
        '<strong>unlock():</strong> Release mutex. Only the thread that locked can unlock — this is <strong>ownership</strong>.',
        '<strong>Wait Queue:</strong> Blocked threads queue up. When mutex is released, one waiting thread is woken.',
        '<strong>Critical Section:</strong> The code between lock() and unlock(). Keep it <em>as short as possible</em>.'
      ]},
      { heading: 'Mutex vs Semaphore', items: [
        '<strong style="color:#ef4444">Mutex:</strong> Binary (locked/unlocked). Has ownership. Only the locker can unlock. Used for mutual exclusion.',
        '<strong style="color:#f59e0b">Binary Semaphore:</strong> Value 0 or 1. No ownership. Any thread can signal. Used for signaling + mutual exclusion.'
      ]}
    ]
  },

  semaphores: {
    icon: '🚦', title: 'Semaphores', color: '#f59e0b',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'A semaphore is a generalized synchronization primitive that controls access to <strong>N identical resources</strong>. Unlike a mutex (binary), a counting semaphore can allow multiple threads to access a resource pool simultaneously.' },
      { heading: 'Operations', items: [
        '<strong>wait() / P (proberen):</strong> If count > 0, decrement and proceed. If count = 0, <strong>block</strong> until signal().',
        '<strong>signal() / V (verhogen):</strong> Increment count. If threads are blocked, wake one. <strong>Any thread</strong> can signal.',
        '<strong>Counting Semaphore:</strong> Value can be > 1. Example: N database connections → semaphore initialized to N.',
        '<strong>Binary Semaphore:</strong> Value = 0 or 1. Used like a mutex but without ownership semantics.'
      ]},
      { heading: 'Key Difference from Mutex', items: [
        '<strong style="color:#f59e0b">Semaphore:</strong> Signal/wait from any thread. Used for both mutual exclusion AND ordering/signaling.',
        '<strong style="color:#ef4444">Mutex:</strong> Only the locker can unlock. Strictly for mutual exclusion. Simpler, less error-prone.'
      ]}
    ]
  },

  producerconsumer: {
    icon: '🏭', title: 'Producer-Consumer', color: '#14b8a6',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'One thread produces data, another consumes it. They share a <strong>bounded buffer</strong>. The producer must block when the buffer is full; the consumer must block when empty. Two semaphores (empty/full) coordinate this perfectly.' },
      { heading: 'The Three Semaphores', items: [
        '<strong>empty (init=N):</strong> Counts empty slots. Producer wait(empty) before inserting. Consumer signal(empty) after removing.',
        '<strong>full (init=0):</strong> Counts filled slots. Consumer wait(full) before removing. Producer signal(full) after inserting.',
        '<strong>mutex (init=1):</strong> Protects buffer access. Both producer and consumer must lock/unlock around buffer operations.'
      ]},
      { heading: 'Why This Works', items: [
        'Producer blocks on empty=0 → buffer full, must wait for consumer to free a slot.',
        'Consumer blocks on full=0 → buffer empty, must wait for producer to add data.',
        'Mutex prevents simultaneous buffer modification → no race conditions on buffer structure.'
      ]}
    ]
  },

  pipes: {
    icon: '🔗', title: 'Pipes', color: '#3b82f6',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'How do two related processes (parent/child) communicate? A <strong>pipe</strong> creates a unidirectional byte stream between them — write on one end, read from the other. The kernel provides the buffer.' },
      { heading: 'How Pipes Work', items: [
        '<strong>pipe(fd[2]):</strong> Creates a pipe and returns two FDs: fd[0] for reading, fd[1] for writing.',
        '<strong>Unidirectional:</strong> Data flows one way. Need two pipes for bidirectional communication.',
        '<strong>Blocking:</strong> read() blocks if pipe is empty. write() blocks if pipe is full (PIPE_BUF = 65536 bytes).',
        '<strong>Fork Inheritance:</strong> After fork(), both parent and child have the same pipe FDs. Close unused ends.'
      ]},
      { heading: 'Shell Pipes (|)', items: [
        '<strong>ls | grep txt:</strong> Shell creates a pipe, forks two children, connects stdout of ls → stdin of grep.',
        '<strong>Implementation:</strong> dup2(fd[1], STDOUT) in child 1. dup2(fd[0], STDIN) in child 2. Close all original pipe FDs.'
      ]}
    ]
  },

  sharedmem: {
    icon: '🧠', title: 'Shared Memory', color: '#22c55e',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Pipes and message queues copy data through the kernel — slow for large data. <strong>Shared memory</strong> maps the same physical memory into two process address spaces. After setup, they read/write directly — no kernel involvement.' },
      { heading: 'The System Calls', items: [
        '<strong>shmget(key, size, flags):</strong> Create/open a shared memory segment. Returns shmid.',
        '<strong>shmat(shmid, addr, flags):</strong> Attach segment to process address space. Returns a pointer.',
        '<strong>shmdt(addr):</strong> Detach from process. Segment persists in kernel until shmctl(IPC_RMID).'
      ]},
      { heading: 'Trade-offs', items: [
        '<strong style="color:#22c55e">Pros:</strong> Fastest IPC — no kernel copying after setup. Works for any size. Direct memory access.',
        '<strong style="color:#ef4444">Cons:</strong> No built-in synchronization — must use semaphores/mutexes. Risk of data races. Must coordinate layout.'
      ]}
    ]
  },

  msgqueues: {
    icon: '📬', title: 'Message Queues', color: '#eab308',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Pipes are byte streams — you must parse message boundaries yourself. <strong>Message queues</strong> send <strong>structured, typed messages</strong> that the kernel stores and delivers as discrete units. Each message has a type for selective receiving.' },
      { heading: 'Key Properties', items: [
        '<strong>Typed Messages:</strong> Each message has a <strong>mtype</strong> (long > 0). msgrcv() can filter by type.',
        '<strong>Persistence:</strong> Messages stay in the kernel queue until read. Survives process termination.',
        '<strong>Priority:</strong> msgrcv(type > 0) = first message of that type. type = 0 = first message overall.',
        '<strong>System Calls:</strong> msgget() → msgsnd() → msgrcv() → msgctl().'
      ]},
      { heading: 'Pros and Cons', items: [
        '<strong style="color:#22c55e">Pros:</strong> Message boundaries preserved, type-based filtering, priority support, kernel persistence.',
        '<strong style="color:#ef4444">Cons:</strong> Fixed message size (MSGMAX), kernel limits (MSGMNB), slower than shared memory for large data.'
      ]}
    ]
  },

  socketsipc: {
    icon: '🔌', title: 'Unix Sockets', color: '#a855f7',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'How do unrelated processes on the same machine communicate? <strong>AF_UNIX sockets</strong> use the same socket API as TCP but communicate through a filesystem path instead of IP/port. Full bidirectional, connection-oriented, and faster than TCP.' },
      { heading: 'AF_UNIX vs AF_INET', items: [
        '<strong>Address:</strong> File path (/tmp/mysock) instead of IP:port.',
        '<strong>Speed:</strong> No TCP/IP stack overhead. No checksums, no congestion control. ~2x faster for local IPC.',
        '<strong>Reach:</strong> Same machine only. Cannot cross the network.',
        '<strong>Security:</strong> Protected by filesystem permissions on the socket file.',
        '<strong>Byte Order:</strong> Native byte order — no htonl/ntohl needed.'
      ]},
      { heading: 'Common Uses', items: ['Docker daemon (/var/run/docker.sock)', 'systemd journal', 'X11 window system', 'PostgreSQL local connections', 'Any local client-server architecture']}
    ]
  },

  filedesc: {
    icon: '📋', title: 'File Descriptors', color: '#0ea5e9',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'Every I/O operation in Unix goes through <strong>file descriptors</strong> — small integers that identify open files, pipes, sockets, or devices. The FD is the <strong>universal I/O handle</strong>. Everything is a file.' },
      { heading: 'How FDs Work', items: [
        '<strong>Per-Process FD Table:</strong> Each process has its own array of open file handles. Index = FD number.',
        '<strong>0=stdin, 1=stdout, 2=stderr:</strong> Always open. Inherited from parent process.',
        '<strong>open() returns lowest available FD:</strong> If you close fd 3, the next open() gets fd 3 again.',
        '<strong>close() frees the slot:</strong> Kernel decrements file\'s reference count. File deleted when count = 0.',
        '<strong>dup2(old, new):</strong> Duplicate FD, making new point to the same file. Used for redirection.'
      ]},
      { heading: 'The Kernel View', items: [
        'FD → File Description (offset, flags) → Inode (data on disk). Three layers.',
        'Two FDs can point to the same File Description (dup). Two File Descriptions can point to the same Inode (two open() calls).'
      ]}
    ]
  },

  hardsoftlinks: {
    icon: '🔗', title: 'Hard vs Soft Links', color: '#22c55e',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'You want a file to appear in multiple places. Should you copy it (waste space, out of sync) or link it? <strong>Hard links</strong> share the inode; <strong>soft links</strong> are path shortcuts. They behave differently when the original is deleted.' },
      { heading: 'Hard Links (ln file link)', items: [
        '<strong>Same Inode:</strong> Both names point to inode #42. <strong>Same data, same permissions, same size.</strong>',
        '<strong>Link Count:</strong> inode.links increments. File deleted only when count reaches 0 (all hard links removed).',
        '<strong>Limitations:</strong> No directories (prevents cycles). No cross-filesystem. No visual distinction from original.'
      ]},
      { heading: 'Soft Links (ln -s target link)', items: [
        '<strong>Separate Inode:</strong> Symlink has its own inode containing a path string. <strong>Different inode from target.</strong>',
        '<strong>Dangling:</strong> If target is deleted, symlink becomes a broken arrow — pointing to nothing.',
        '<strong>Advantages:</strong> Can cross filesystems. Can link to directories. Visually distinct (ls -l shows →).'
      ]}
    ]
  },

  tcpvsudp: {
    icon: '⚖️', title: 'TCP vs UDP', color: '#3b82f6',
    sections: [
      { heading: 'The Choice', body: 'Every network application must choose: <strong>TCP for reliability</strong> or <strong>UDP for speed</strong>. TCP guarantees delivery and order but has overhead. UDP is fire-and-forget — fast but you might lose packets.' },
      { heading: 'Side-by-Side', items: [
        '<strong style="color:#22c55e">TCP:</strong> Connection-oriented (handshake), reliable (retransmits), ordered (sequence #s), flow control, 20-byte header.',
        '<strong style="color:#f59e0b">UDP:</strong> Connectionless, unreliable, unordered, no flow control, 8-byte header.',
        '<strong>TCP Use:</strong> HTTP/HTTPS, SSH, FTP, email, databases. Anything where data loss is unacceptable.',
        '<strong>UDP Use:</strong> DNS, streaming video/audio, VoIP, gaming, DHCP. Speed matters more than perfect delivery.'
      ]},
      { heading: 'Why UDP Exists', items: [
        'Not everything needs TCP overhead. DNS queries are 1 packet — no point in a 3-way handshake.',
        'Real-time streaming: a lost frame is better than a 200ms delay for retransmission.',
        'Multicast/broadcast: UDP can send to many hosts; TCP is strictly point-to-point.'
      ]}
    ]
  },

  tcphandshake: {
    icon: '🤝', title: 'TCP Handshake', color: '#06b6d4',
    sections: [
      { heading: 'Why 3 Steps?', body: 'The TCP 3-way handshake synchronizes <strong>sequence numbers</strong> between client and server. Both sides pick a random ISN (Initial Sequence Number) and confirm the other side received theirs. This takes 3 messages — not 2, not 4.' },
      { heading: 'Step by Step', items: [
        '<strong>Step 1 (Client → SYN):</strong> "I want to connect. My sequence number = X." Client enters SYN_SENT.',
        '<strong>Step 2 (Server → SYN-ACK):</strong> "Got it. My seq = Y, I acknowledge your X (ack = X+1)." Server enters SYN_RCVD.',
        '<strong>Step 3 (Client → ACK):</strong> "Got your SYN. ack = Y+1." Both enter ESTABLISHED.',
        '<strong>Why not 2 steps?</strong> A delayed duplicate SYN from a previous connection could confuse the server. The 3rd ACK prevents ancient SYN attacks.'
      ]},
      { heading: 'After Handshake', items: [
        'Both sides now have synchronized seq/ack numbers. Every byte sent increments the sequence number.',
        'Data flows: seq=1001, data="GET /" (3 bytes) → ack=1004 confirms receipt of bytes 1001-1003.'
      ]}
    ]
  },

  ports: {
    icon: '🚪', title: 'Ports', color: '#f97316',
    sections: [
      { heading: 'What Is a Port?', body: 'An IP address identifies a host. A <strong>port number (0-65535)</strong> identifies a specific service on that host. Together, (IP, port) forms a unique endpoint for communication.' },
      { heading: 'Port Ranges', items: [
        '<strong style="color:#ef4444">0-1023 Well-Known:</strong> Reserved for standard services. Require root to bind. Example: 22=SSH, 80=HTTP, 443=HTTPS.',
        '<strong style="color:#f59e0b">1024-49151 Registered:</strong> Assigned by IANA for specific applications. 3306=MySQL, 5432=PostgreSQL.',
        '<strong style="color:#22c55e">49152-65535 Ephemeral:</strong> Temporary client-side ports. Assigned automatically by the OS for outbound connections.'
      ]},
      { heading: 'Key Concepts', items: [
        '<strong>bind():</strong> Server binds to a specific port. Only one process can bind to a given port (per protocol).',
        '<strong>Ephemeral Ports:</strong> When your browser connects to google.com:443, your OS picks a random ephemeral source port (e.g., 52341).',
        '<strong>netstat -tlnp:</strong> List all listening ports and their processes.'
      ]}
    ]
  },

  permissions: {
    icon: '🔐', title: 'Permissions', color: '#22c55e',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'In a multi-user OS, how do we control who can read, write, or execute a file? Unix <strong>permission bits</strong> define access for three classes: Owner, Group, and Other. Nine bits control everything.' },
      { heading: 'The 9 Bits', items: [
        '<strong>Owner (rwx):</strong> The file\'s creator. Full control by default.',
        '<strong>Group (rwx):</strong> Users in the file\'s group. Shared project access.',
        '<strong>Other (rwx):</strong> Everyone else. Most restrictive.',
        '<strong>r=4, w=2, x=1:</strong> chmod 755 = rwxr-xr-x. chmod 644 = rw-r--r--. chmod 700 = rwx------.'
      ]},
      { heading: 'Directory Permissions', items: [
        '<strong>r:</strong> Can list directory contents (ls).',
        '<strong>w:</strong> Can create/delete files in directory.',
        '<strong>x:</strong> Can enter directory (cd). Without x, can\'t access files even if you know their names.'
      ]}
    ]
  },

  signals: {
    icon: '📡', title: 'Signals', color: '#ef4444',
    sections: [
      { heading: 'What Are Signals?', body: 'Signals are <strong>software interrupts</strong> sent to a process to notify it of an event. ^C sends SIGINT. kill sends SIGTERM. Some signals can be caught/handled; others (SIGKILL, SIGSTOP) cannot.' },
      { heading: 'Common Signals', items: [
        '<strong style="color:#ef4444">SIGKILL (9):</strong> Force kill. Cannot be caught or ignored. Last resort.',
        '<strong style="color:#f59e0b">SIGTERM (15):</strong> Polite termination request. Can be caught for cleanup.',
        '<strong style="color:#60a5fa">SIGINT (2):</strong> Interrupt from keyboard (Ctrl+C).',
        '<strong style="color:#f59e0b">SIGSTOP (19):</strong> Pause process. Cannot be caught. Resume with SIGCONT.',
        '<strong style="color:#22c55e">SIGCHLD (17):</strong> Child process terminated. Parent gets this to wait()/reap.'
      ]},
      { heading: 'Signal Handling', items: [
        '<strong>Default Action:</strong> Terminate, Stop, Continue, Ignore, or Core Dump.',
        '<strong>Custom Handler:</strong> signal(SIGTERM, my_handler) replaces default behavior.',
        '<strong>signal() vs sigaction():</strong> sigaction() is the modern, portable replacement.'
      ]}
    ]
  },

  envvars: {
    icon: '🌍', title: 'Environment Vars', color: '#f59e0b',
    sections: [
      { heading: 'What Are They?', body: 'Environment variables are <strong>key=value pairs</strong> passed to every process. They configure behavior without hardcoding paths or settings. When a process forks, the child <strong>inherits</strong> the parent\'s environment.' },
      { heading: 'Essential Variables', items: [
        '<strong>PATH:</strong> Directories searched for executables. /usr/bin:/bin:/usr/local/bin.',
        '<strong>HOME:</strong> Current user\'s home directory.',
        '<strong>USER:</strong> Current username.',
        '<strong>SHELL:</strong> Path to the login shell (/bin/bash).',
        '<strong>PWD:</strong> Current working directory.'
      ]},
      { heading: 'Key Concepts', items: [
        '<strong>export VAR=val:</strong> Makes the variable available to child processes.',
        '<strong>Inheritance:</strong> fork() copies the parent\'s environment. Child can modify its own copy.',
        '<strong>getenv("VAR"):</strong> C library call to read an env var.',
        '<strong>env:</strong> Run a command with a modified environment.'
      ]}
    ]
  },

  piperedir: {
    icon: '⏩', title: 'Pipes & Redirection', color: '#3b82f6',
    sections: [
      { heading: 'What Problem Does This Solve?', body: 'The Unix philosophy: small programs that do one thing well, <strong>chained together</strong>. Pipes connect stdout→stdin. Redirection changes where input comes from and output goes to — files, devices, other programs.' },
      { heading: 'Operators', items: [
        '<strong style="color:#3b82f6">| (pipe):</strong> Connect stdout of left command to stdin of right. ls | grep txt | wc -l.',
        '<strong style="color:#22c55e">> (redirect stdout):</strong> Write stdout to file (overwrite). echo hello > file.txt.',
        '<strong style="color:#22c55e">>> (append):</strong> Append stdout to file. echo more >> file.txt.',
        '<strong style="color:#ef4444">2> (redirect stderr):</strong> Send stderr to file. make 2> errors.txt.',
        '<strong style="color:#ef4444">2>&1:</strong> Merge stderr into stdout. make 2>&1 | grep error.',
        '<strong style="color:#f59e0b">< (redirect stdin):</strong> Read stdin from file. sort < data.txt.'
      ]},
      { heading: 'How It Works', items: [
        'The shell creates pipes, forks children, and uses dup2() to connect FDs before exec().',
        'dup2(fd[1], 1) → stdout now writes to pipe. dup2(fd[0], 0) → stdin now reads from pipe.',
        'Each command in a pipeline runs <strong>concurrently</strong>. The kernel buffers data between them.'
      ]}
    ]
  }
};

export function openGuide(moduleKey) {
  const guide = GUIDES[moduleKey];
  if (!guide) return;

  let existing = document.getElementById('concept-guide-overlay');
  if (existing) existing.remove();

  const sections = guide.sections.map(s => {
    let body = '';
    if (s.body) body += `<p>${s.body}</p>`;
    if (s.items) {
      body += `<ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    }
    return `<div class="cg-section">
      <div class="cg-section-heading">${s.heading}</div>
      <div class="cg-section-body">${body}</div>
    </div>`;
  }).join('<div class="cg-divider"></div>');

  const overlay = document.createElement('div');
  overlay.id = 'concept-guide-overlay';
  overlay.className = 'cg-overlay';
  overlay.innerHTML = `
    <div class="cg-backdrop"></div>
    <div class="cg-panel">
      <div class="cg-header">
        <div class="cg-header-left">
          <div class="cg-icon">${guide.icon}</div>
          <div>
            <div class="cg-title">${guide.title}</div>
            <div class="cg-subtitle">Concept Guide — Read before simulating</div>
          </div>
        </div>
        <button class="cg-close" id="cg-close-btn">✕</button>
      </div>
      <div class="cg-body">
        ${sections}
      </div>
      <div class="cg-footer">
        <button class="btn btn-primary cg-got-it" id="cg-got-it">Got It — Let Me Try</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.add('cg-closing');
    setTimeout(() => overlay.remove(), 250);
  };

  overlay.querySelector('.cg-backdrop').addEventListener('click', close);
  overlay.querySelector('#cg-close-btn').addEventListener('click', close);
  overlay.querySelector('#cg-got-it').addEventListener('click', close);
}
