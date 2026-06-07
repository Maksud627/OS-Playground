export function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(el);
  el.addEventListener('click', () => dismiss());
  const timer = setTimeout(dismiss, duration);
  function dismiss() {
    clearTimeout(timer);
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }
}
