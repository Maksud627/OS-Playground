import { showToast } from '../../components/toast.js';
import { openGuide } from '../../components/concept-guide.js';

export function renderProcessVThread(container) {
  container.innerHTML = `
  <div class="module-page">
    <div class="module-header">
      <div class="module-icon-wrap" style="background:rgba(139,92,246,.15)">🧵</div>
      <div class="module-title-group">
        <h1 class="module-title" style="color:#a78bfa">Processes vs Threads</h1>
        <p class="module-subtitle">Compare how processes and threads differ in resource ownership, memory sharing, creation cost, and crash isolation.</p>
      </div>
      <button class="btn btn-secondary" id="pt-guide-btn">📖 Learn</button>
    </div>
    <div class="two-col">
      <div class="panel" style="border-left:4px solid #a78bfa">
        <div class="panel-header"><span class="panel-title">🖥️ Process</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="padding:10px;background:rgba(167,139,250,.1);border-radius:8px;font-size:13px"><strong>Address Space</strong><br><span style="color:var(--text-secondary)">Each process has its own independent virtual address space. One process cannot access another's memory.</span></div>
          <div style="padding:10px;background:rgba(167,139,250,.1);border-radius:8px;font-size:13px"><strong>Creation Cost (fork)</strong><br><span style="color:var(--text-secondary)">Expensive — must duplicate page tables, file descriptor table, and signal handlers.</span></div>
          <div style="padding:10px;background:rgba(167,139,250,.1);border-radius:8px;font-size:13px"><strong>Context Switch Cost</strong><br><span style="color:var(--text-secondary)">High — flushes TLB, switches page tables, saves/restores full register set.</span></div>
          <div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px;font-size:13px"><strong>Crash Isolation</strong><br><span style="color:#22c55e">✅ One process crashing does NOT affect others.</span></div>
          <div style="padding:10px;background:rgba(167,139,250,.1);border-radius:8px;font-size:13px"><strong>Communication</strong><br><span style="color:var(--text-secondary)">IPC required — pipes, sockets, shared memory, message queues.</span></div>
        </div>
      </div>
      <div class="panel" style="border-left:4px solid #0ea5e9">
        <div class="panel-header"><span class="panel-title">🧵 Thread</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="padding:10px;background:rgba(14,165,233,.1);border-radius:8px;font-size:13px"><strong>Address Space</strong><br><span style="color:var(--text-secondary)">All threads share the same process address space — same heap, globals, code. Each thread has its own stack.</span></div>
          <div style="padding:10px;background:rgba(14,165,233,.1);border-radius:8px;font-size:13px"><strong>Creation Cost</strong><br><span style="color:var(--text-secondary)">Cheap — just allocate a new stack and register set. No page table duplication.</span></div>
          <div style="padding:10px;background:rgba(14,165,233,.1);border-radius:8px;font-size:13px"><strong>Context Switch Cost</strong><br><span style="color:var(--text-secondary)">Low — same page table, no TLB flush. Only registers and stack pointer change.</span></div>
          <div style="padding:10px;background:rgba(239,68,68,.08);border-radius:8px;font-size:13px"><strong>Crash Isolation</strong><br><span style="color:#ef4444">❌ One thread crash can corrupt shared data and kill all threads.</span></div>
          <div style="padding:10px;background:rgba(14,165,233,.1);border-radius:8px;font-size:13px"><strong>Communication</strong><br><span style="color:var(--text-secondary)">Direct — shared memory. No IPC needed. But requires synchronization.</span></div>
        </div>
      </div>
    </div>
    <div style="margin-top:20px">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">📊 Comparison Matrix</span></div>
        <div style="padding:12px">
          <table class="data-table">
            <thead><tr><th>Property</th><th style="color:#a78bfa">Process</th><th style="color:#0ea5e9">Thread</th></tr></thead>
            <tbody>
              <tr><td>Address Space</td><td>Independent</td><td>Shared</td></tr>
              <tr><td>Creation Overhead</td><td>High (fork + exec)</td><td>Low (clone flags)</td></tr>
              <tr><td>Context Switch</td><td>Slow (TLB flush)</td><td>Fast (same PT)</td></tr>
              <tr><td>File Descriptors</td><td>Independent FD table</td><td>Shared FD table</td></tr>
              <tr><td>Signals</td><td>Independent handlers</td><td>Shared handlers</td></tr>
              <tr><td>Crash Boundary</td><td>Isolated</td><td>Shared fate</td></tr>
              <tr><td>Synchronization</td><td>Not needed</td><td>Required (mutexes)</td></tr>
              <tr><td>Linux syscall</td><td style="font-family:var(--font-mono)">fork() + exec()</td><td style="font-family:var(--font-mono)">clone() or pthread_create()</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
  document.getElementById('pt-guide-btn').addEventListener('click', () => openGuide('processvthread'));
}
