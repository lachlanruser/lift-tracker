// Session logs in one localStorage key: { logs: { "YYYY-MM-DD": [muscleId, ...] } }.
// Backup bookkeeping (last backup time) lives in a separate key.
// Falls back to in-memory state if storage is unavailable.

var Store = (function () {
  var KEY = "liftTracker.v1";
  var META_KEY = "liftTracker.meta";
  var state = load();
  var meta = loadMeta();
  var listeners = [];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.logs && typeof parsed.logs === "object") return { logs: parsed.logs };
    } catch (e) {
      // Corrupt or blocked storage — start empty.
    }
    return { logs: {} };
  }

  function loadMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // Storage unavailable — keep working in memory.
    }
  }

  function notify() {
    listeners.forEach(function (fn) { fn(); });
  }

  function logs() { return state.logs; }

  function isEmpty() { return Object.keys(state.logs).length === 0; }

  // Add or remove id from day's log. Returns true if now logged.
  function toggle(day, id) {
    var logged = Stats.toggleIn(state.logs, day, id);
    save();
    notify();
    return logged;
  }

  // Merge imported logs in (nothing existing is removed). Returns entries added.
  function mergeIn(incoming) {
    var added = Stats.mergeInto(state.logs, incoming);
    save();
    notify();
    return added;
  }

  function onChange(fn) { listeners.push(fn); }

  function lastBackupAt() { return meta.lastBackupAt || null; }

  function markBackedUp(when) {
    meta.lastBackupAt = (when || new Date()).toISOString();
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e) {
      // Ignore — only affects the reminder.
    }
  }

  return {
    logs: logs,
    isEmpty: isEmpty,
    toggle: toggle,
    mergeIn: mergeIn,
    onChange: onChange,
    lastBackupAt: lastBackupAt,
    markBackedUp: markBackedUp
  };
})();
