// Session logs in one localStorage key: { logs: { "YYYY-MM-DD": [muscleId, ...] } }.
// Falls back to in-memory state if storage is unavailable.

var Store = (function () {
  var KEY = "liftTracker.v1";
  var state = load();

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

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // Storage unavailable — keep working in memory.
    }
  }

  function logs() { return state.logs; }

  // Add or remove id from day's log. Returns true if now logged.
  function toggle(day, id) {
    var logged = Stats.toggleIn(state.logs, day, id);
    save();
    return logged;
  }

  return { logs: logs, toggle: toggle };
})();
