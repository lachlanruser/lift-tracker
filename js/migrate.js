// Data migrations for renamed muscle groups — pure, idempotent, in place.
// V5: "forearms" was split into "brachioradialis" and "inner-forearm"; old
// forearm data (ticks, plans, weights) moves to "inner-forearm".

var Migrate = (function () {
  var RENAMES = { forearms: "inner-forearm" };

  function renameIds(list) {
    var out = [];
    list.forEach(function (id) {
      var to = RENAMES[id] || id;
      if (out.indexOf(to) === -1) out.push(to);
    });
    return out;
  }

  function needsRename(list) {
    return Array.isArray(list) && list.some(function (id) { return id in RENAMES; });
  }

  // state = { logs, plans, weights } (any may be missing). Returns true if
  // anything changed. Running it again changes nothing.
  function apply(state) {
    var changed = false;

    var logs = state.logs || {};
    Object.keys(logs).forEach(function (day) {
      if (needsRename(logs[day])) {
        logs[day] = renameIds(logs[day]);
        changed = true;
      }
    });

    var plans = state.plans || {};
    Object.keys(plans).forEach(function (monday) {
      var week = plans[monday];
      if (!week || typeof week !== "object") return;
      Object.keys(week).forEach(function (idx) {
        if (needsRename(week[idx])) {
          week[idx] = renameIds(week[idx]);
          changed = true;
        }
      });
    });

    // Weights: move the value across unless the new id already has one.
    var weights = state.weights || {};
    Object.keys(weights).forEach(function (day) {
      var w = weights[day];
      if (!w || typeof w !== "object") return;
      Object.keys(RENAMES).forEach(function (from) {
        if (!(from in w)) return;
        var to = RENAMES[from];
        if (!(to in w)) w[to] = w[from];
        delete w[from];
        changed = true;
      });
    });

    return changed;
  }

  return { apply: apply };
})();
