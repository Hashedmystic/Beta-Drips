export function startCartRefresh({ appState, refresh, isSignedIn, timers = globalThis }) {
  let interval = null;
  function change(next) {
    if (interval !== null) { timers.clearInterval(interval); interval = null; }
    if (next === 'active') {
      refresh(false);
      interval = timers.setInterval(() => { if (appState.currentState === 'active' && isSignedIn()) refresh(false); }, 15000);
    }
  }
  const subscription = appState.addEventListener('change', change);
  // Identity initialization handles the initial load; only install the timer here.
  if (appState.currentState === 'active') interval = timers.setInterval(() => { if (appState.currentState === 'active' && isSignedIn()) refresh(false); }, 15000);
  return () => { subscription.remove(); if (interval !== null) timers.clearInterval(interval); };
}
