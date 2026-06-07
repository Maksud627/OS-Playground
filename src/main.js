import '/src/style/main.css';
import { initNavbar } from './components/navbar.js';
import { showToast } from './components/toast.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCPU } from './modules/cpu-scheduling/index.js';
import { renderMemory } from './modules/memory-paging/index.js';
import { renderReplacement } from './modules/page-replacement/index.js';
import { renderDeadlock } from './modules/deadlock/index.js';
import { renderDisk } from './modules/disk-scheduling/index.js';
import { renderLifecycle } from './modules/lifecycle/index.js';
import { renderStackHeap } from './modules/stackheap/index.js';
import { renderVirtualMem } from './modules/virtualmem/index.js';
import { renderRace } from './modules/race/index.js';
import { renderMemAlloc } from './modules/memalloc/index.js';
import { renderFilesystem } from './modules/filesystem/index.js';
import { renderSyscalls } from './modules/syscalls/index.js';
import { renderSockets } from './modules/sockets/index.js';
import { renderProcessVThread } from './modules/processvthread/index.js';
import { renderContextSwitch } from './modules/contextswitch/index.js';
import { renderMutexes } from './modules/mutexes/index.js';
import { renderSemaphores } from './modules/semaphores/index.js';
import { renderProducerConsumer } from './modules/producerconsumer/index.js';
import { renderPipes } from './modules/pipes/index.js';
import { renderSharedMem } from './modules/sharedmem/index.js';
import { renderMsgQueues } from './modules/msgqueues/index.js';
import { renderSocketsIPC } from './modules/socketsipc/index.js';
import { renderFileDesc } from './modules/filedesc/index.js';
import { renderLinks } from './modules/hardsoftlinks/index.js';
import { renderTCPvsUDP } from './modules/tcpvsudp/index.js';
import { renderTCPHandshake } from './modules/tcphandshake/index.js';
import { renderPorts } from './modules/ports/index.js';
import { renderPermissions } from './modules/permissions/index.js';
import { renderSignals } from './modules/signals/index.js';
import { renderEnvVars } from './modules/envvars/index.js';
import { renderPipeRedir } from './modules/piperedir/index.js';

export { showToast };

const routes = {
  '':                 renderDashboard,
  'cpu':              renderCPU,
  'memory':           renderMemory,
  'replacement':      renderReplacement,
  'deadlock':         renderDeadlock,
  'disk':             renderDisk,
  'lifecycle':        renderLifecycle,
  'stackheap':        renderStackHeap,
  'virtualmem':       renderVirtualMem,
  'race':             renderRace,
  'memalloc':         renderMemAlloc,
  'filesystem':       renderFilesystem,
  'syscalls':         renderSyscalls,
  'sockets':          renderSockets,
  'processvthread':   renderProcessVThread,
  'contextswitch':    renderContextSwitch,
  'mutexes':          renderMutexes,
  'semaphores':       renderSemaphores,
  'producerconsumer': renderProducerConsumer,
  'pipes':            renderPipes,
  'sharedmem':        renderSharedMem,
  'msgqueues':        renderMsgQueues,
  'socketsipc':       renderSocketsIPC,
  'filedesc':         renderFileDesc,
  'hardsoftlinks':    renderLinks,
  'tcpvsudp':         renderTCPvsUDP,
  'tcphandshake':     renderTCPHandshake,
  'ports':            renderPorts,
  'permissions':      renderPermissions,
  'signals':          renderSignals,
  'envvars':          renderEnvVars,
  'piperedir':        renderPipeRedir,
};

let currentCleanup = null;

function getHash() {
  return window.location.hash.replace('#/', '').replace('#', '').split('?')[0];
}

function navigate(hash) {
  window.location.hash = hash ? `#/${hash}` : '#/';
}

function render() {
  const hash = getHash();
  const view = routes[hash] || renderDashboard;
  const container = document.getElementById('view-container');

  if (currentCleanup) { currentCleanup(); currentCleanup = null; }

  container.innerHTML = '';
  const result = view(container);
  if (result && typeof result.cleanup === 'function') {
    currentCleanup = result.cleanup;
  }

  initNavbar(hash);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
window.navigate = navigate;
render();
