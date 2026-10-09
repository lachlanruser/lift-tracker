// Session logs and weekly plans in one localStorage key:
// { logs: { "YYYY-MM-DD": [muscleId, ...] }, plans: { "<Monday>": { "<0-6>": [muscleId, ...] } } }
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
      if (parsed && parsed.logs && typeof parsed.logs === "object") {
        var plans = parsed.plans && typeof parsed.plans === "object" ? parsed.plans : {};
        return { logs: parsed.logs, plans: plans };
      }
    } catch (e) {
      // Corrupt or blocked storage — start empty.
    }
    return { logs: {}, plans: {} };
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

  function plans() { return state.plans; }

  function isEmpty() {
    return Object.keys(state.logs).length === 0 &&
      Object.keys(state.plans).every(function (w) { return Plans.isEmpty(state.plans[w]); });
  }

  // Toggle id on the plan for day idx (0 = Mon) of the week starting monday.
  function togglePlan(monday, idx, id) {
    var planned = Plans.toggleIn(state.plans, monday, idx, id);
    save();
    notify();
    return planned;
  }

  // Weekly carry-forward up to currentMonday. Saves only if weeks were created.
  function ensurePlans(currentMonday) {
    var created = Plans.carryForward(state.plans, currentMonday);
    if (created.length) {
      save();
      notify();
    }
    return created;
  }

  // Add or remove id from day's log. Returns true if now logged.
  function toggle(day, id) {
    var logged = Stats.toggleIn(state.logs, day, id);
    save();
    notify();
    return logged;
  }

  // Merge imported logs in (nothing existing is removed) and add plan weeks we
  // don't have (existing weeks keep their version). Returns { entries, weeks }.
  function mergeIn(incomingLogs, incomingPlans) {
    var entries = Stats.mergeInto(state.logs, incomingLogs);
    var weeks = Plans.mergeMissing(state.plans, incomingPlans || {});
    save();
    notify();
    return { entries: entries, weeks: weeks };
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
    plans: plans,
    isEmpty: isEmpty,
    togglePlan: togglePlan,
    ensurePlans: ensurePlans,
    toggle: toggle,
    mergeIn: mergeIn,
    onChange: onChange,
    lastBackupAt: lastBackupAt,
    markBackedUp: markBackedUp
  };
})();
