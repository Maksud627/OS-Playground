const PREFIX = 'osvault_';

export function saveState(key, state) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(state));
  } catch (e) { /* localStorage full or unavailable */ }
}

export function loadState(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

export function clearState(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (e) { /* ignore */ }
}

export function subscribeToSave(moduleKey, getState, intervalMs = 1000) {
  let timer = null;
  let lastJson = '';

  timer = setInterval(() => {
    try {
      const state = getState();
      const json = JSON.stringify(state);
      if (json !== lastJson) {
        lastJson = json;
        saveState(moduleKey, state);
      }
    } catch (e) { /* ignore errors in getState */ }
  }, intervalMs);

  return () => clearInterval(timer);
}
