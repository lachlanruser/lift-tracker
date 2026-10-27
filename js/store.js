// Session logs, weekly plans, cardio days and weights in one localStorage key:
// { logs:    { "YYYY-MM-DD": [muscleId, ...] },
//   plans:   { "<Monday>": { "<0-6>": [muscleId, ...] } },
//   cardio:  { "YYYY-MM-DD": true },
//   weights: { "YYYY-MM-DD": { muscleId: kg } } }
// Backup bookkeeping (last backup time) lives in a separate key.
// Falls back to in-memory state if storage is unavailable.

var Store = (function () {
  var KEY = "liftTracker.v1";
  var META_KEY = "liftTracker.meta";
  var state = load();
  var meta = loadMeta();
  var listeners = [];

  // Upgrade older saved data (e.g. old "forearms" -> "inner-forearm").
  if (Migrate.apply(state)) save();

  function obj(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.logs && typeof parsed.logs === "object") {
        return {
          logs: parsed.logs,
          plans: obj(parsed.plans),
          cardio: obj(parsed.cardio),
          weights: obj(parsed.weights)
        };
      }
    } catch (e) {
      // Corrupt or blocked storage — start empty.
    }
    return { logs: {}, plans: {}, cardio: {}, weights: {} };
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

  function commit() {
    save();
    notify();
  }

  function logs() { return state.logs; }
  function plans() { return state.plans; }
  function cardio() { return state.cardio; }
  function weights() { return state.weights; }

  function isEmpty() {
    return Object.keys(state.logs).length === 0 &&
      Object.keys(state.cardio).length === 0 &&
      Object.keys(state.plans).every(function (w) { return Plans.isEmpty(state.plans[w]); });
  }

  // Toggle id on the plan for day idx (0 = Mon) of the week starting monday.
  function togglePlan(monday, idx, id) {
    var planned = Plans.toggleIn(state.plans, monday, idx, id);
    commit();
    return planned;
  }

  // Weekly carry-forward up to currentMonday. Saves only if weeks were created.
  function ensurePlans(currentMonday) {
    var created = Plans.carryForward(state.plans, currentMonday);
    if (created.length) commit();
    return created;
  }

  // Add or remove id from day's log (logging saves the carry-forward weight,
  // un-logging removes that day's weight). Returns true if now logged.
  function toggle(day, id) {
    var logged = Weights.toggleLogIn(state.logs, state.weights, day, id);
    commit();
    return logged;
  }

  function weightFor(day, id) {
    var w = state.weights[day];
    return w && w[id] != null ? w[id] : null;
  }

  // Set (or clear with null) the weight for a muscle logged on day.
  function setWeight(day, id, kg) {
    if ((state.logs[day] || []).indexOf(id) === -1) return;
    Weights.setIn(state.weights, day, id, kg);
    commit();
  }

  function hasCardio(day) { return !!state.cardio[day]; }

  function toggleCardio(day) {
    var on = Weights.toggleCardioIn(state.cardio, day);
    commit();
    return on;
  }

  // Merge imported workout data (nothing existing is removed or overwritten):
  // logs and cardio are combined; weights fill in only where missing. Plans
  // are never imported. Returns { entries, cardio, weights } added.
  function mergeIn(incomingLogs, incomingCardio, incomingWeights) {
    var added = {
      entries: Stats.mergeInto(state.logs, incomingLogs),
      cardio: Weights.mergeCardioInto(state.cardio, incomingCardio || {}),
      weights: 0
    };
    added.weights = Weights.mergeInto(state.weights, incomingWeights || {}, state.logs);
    commit();
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
    plans: plans,
    cardio: cardio,
    weights: weights,
    isEmpty: isEmpty,
    togglePlan: togglePlan,
    ensurePlans: ensurePlans,
    toggle: toggle,
    weightFor: weightFor,
    setWeight: setWeight,
    hasCardio: hasCardio,
    toggleCardio: toggleCardio,
    mergeIn: mergeIn,
    onChange: onChange,
    lastBackupAt: lastBackupAt,
    markBackedUp: markBackedUp
  };
})();
