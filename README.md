# OS Playground

**An interactive operating systems learning platform.** Don't just read about OS concepts — operate them. 31 interactive modules across 7 categories, with live simulations, visualizations, and built-in concept guides.

---

## What Is This?

OS Playground turns abstract OS theory into hands-on, visual simulations. Add processes to a CPU scheduler and watch a Gantt chart animate. Trigger a deadlock and see the circular wait. Cause page faults and watch the OS load pages from disk. Every concept has a **📖 Learn** button that explains the key terms before you dive in.

---

## Categories & Modules

| Category | Modules |
|---|---|
| **💻 CPU & Processes** | CPU Scheduler, Process Lifecycle, Processes vs Threads, Context Switching, System Calls |
| **🧠 Memory** | Stack vs Heap, Virtual Memory, Memory Paging, Page Replacement, Memory Allocation |
| **🔀 Concurrency** | Race Conditions, Mutexes, Semaphores, Producer-Consumer, Deadlock |
| **🔗 IPC** | Pipes, Shared Memory, Message Queues, Unix Sockets |
| **💾 I/O & Storage** | File Descriptors, File System, Hard vs Soft Links, Disk Scheduler |
| **🌐 Networking** | TCP vs UDP, TCP Handshake, Ports, Sockets & TCP |
| **🐧 Linux Essentials** | Permissions, Signals, Environment Variables, Pipes & Redirection |

---

## Features

- **31 interactive modules** — every concept has a live simulation
- **📖 Concept guides** — point-form breakdowns of key terms, algorithms, and suggested experiments
- **Vertical sidebar** with collapsible categories and collapse toggle
- **localStorage persistence** — refresh the page and your simulation state is restored
- **Reset/Clear buttons** on every module — run, reset, and repeat
- **Dark theme** with per-category accent colors
- **Performance-optimized** — 100% client-side, no backend, builds to ~295 KB gzipped

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open `http://localhost:5173` after running `npm run dev`.

---

## Tech Stack

- **Vite** — build tool
- **Vanilla JavaScript** — no frameworks, zero runtime overhead
- **CSS** custom properties for theming
- **localStorage** for state persistence
- **Canvas API** for algorithm visualizations

---

## Architecture

```
src/
├── main.js              # Router, hash-based SPA navigation
├── components/          # Shared UI (navbar, toast, concept-guide)
├── views/               # Dashboard landing page
├── modules/             # 31 simulation modules (one per directory)
│   ├── cpu-scheduling/
│   ├── memory-paging/
│   ├── page-replacement/
│   ├── deadlock/
│   ├── synchronization/
│   ├── disk-scheduling/
│   └── ...              # 25 more
├── style/               # CSS design system (tokens, components, animations)
└── utils/               # localStorage persistence helpers
```

---

## Why I Built This

Operating systems courses are heavy on theory. You memorize scheduling algorithms, deadlock conditions, and paging formulas, but rarely see them in action. OS Playground bridges that gap — every algorithm runs live, every concept has a visual, and every term has an explanation one click away.

---

## License

MIT
