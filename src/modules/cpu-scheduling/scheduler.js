// CPU Scheduling Algorithms

export function runFCFS(processes) {
  const procs = [...processes].sort((a, b) => a.arrival - b.arrival);
  const timeline = [];
  let time = 0;
  for (const p of procs) {
    if (time < p.arrival) time = p.arrival;
    const start = time;
    time += p.burst;
    timeline.push({ id: p.id, color: p.color, start, end: time });
    p.finish = time;
    p.wait = start - p.arrival;
    p.turnaround = time - p.arrival;
  }
  return { timeline, processes: procs };
}

export function runSJF(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const timeline = [];
  let time = 0, done = 0;
  const n = procs.length;
  let current = null, start = 0;

  while (done < n) {
    const available = procs.filter(p => p.arrival <= time && p.remaining > 0);
    if (!available.length) { time++; continue; }
    const next = available.reduce((a, b) => a.remaining < b.remaining ? a : b);
    if (!current || current.id !== next.id) {
      if (current && time > start) timeline.push({ id: current.id, color: current.color, start, end: time });
      current = next; start = time;
    }
    current.remaining--;
    time++;
    if (current.remaining === 0) {
      timeline.push({ id: current.id, color: current.color, start, end: time });
      current.finish = time;
      current.wait = time - current.arrival - current.burst;
      current.turnaround = time - current.arrival;
      done++; current = null;
    }
  }
  return { timeline, processes: procs };
}

export function runRR(processes, quantum) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const queue = [], timeline = [];
  let time = 0, idx = 0;
  const n = procs.length;
  const arrived = new Set();

  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival);
  function enqueueArrived() {
    while (idx < n && sorted[idx].arrival <= time) {
      queue.push(sorted[idx]); arrived.add(sorted[idx].id); idx++;
    }
  }

  enqueueArrived();
  while (queue.length || idx < n) {
    if (!queue.length) { time = sorted[idx].arrival; enqueueArrived(); }
    const p = queue.shift();
    const slice = Math.min(quantum, p.remaining);
    const start = time;
    time += slice;
    p.remaining -= slice;
    timeline.push({ id: p.id, color: p.color, start, end: time });
    enqueueArrived();
    if (p.remaining > 0) queue.push(p);
    else {
      p.finish = time;
      p.turnaround = time - p.arrival;
      p.wait = p.turnaround - p.burst;
    }
  }
  return { timeline, processes: procs };
}

export function runPriority(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const timeline = [];
  let time = 0, done = 0;
  const n = procs.length;
  let current = null, start = 0;

  while (done < n) {
    const available = procs.filter(p => p.arrival <= time && p.remaining > 0);
    if (!available.length) { time++; continue; }
    // lower number = higher priority
    const next = available.reduce((a, b) => a.priority < b.priority ? a : b);
    if (!current || current.id !== next.id) {
      if (current && time > start) timeline.push({ id: current.id, color: current.color, start, end: time });
      current = next; start = time;
    }
    current.remaining--;
    time++;
    if (current.remaining === 0) {
      timeline.push({ id: current.id, color: current.color, start, end: time });
      current.finish = time;
      current.wait = time - current.arrival - current.burst;
      current.turnaround = time - current.arrival;
      done++; current = null;
    }
  }
  return { timeline, processes: procs };
}

export function calcStats(processes) {
  const n = processes.length;
  if (!n) return { avgWait: 0, avgTurnaround: 0, throughput: 0 };
  const avgWait = processes.reduce((s, p) => s + (p.wait || 0), 0) / n;
  const avgTurnaround = processes.reduce((s, p) => s + (p.turnaround || 0), 0) / n;
  const maxFinish = Math.max(...processes.map(p => p.finish || 0));
  const throughput = n / maxFinish;
  return { avgWait, avgTurnaround, throughput };
}
