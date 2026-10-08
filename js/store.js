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

  function loggedOn(day, id) {
    var list = state.logs[day];
    return !!list && list.indexOf(id) !== -1;
  }

  // Add or remove id from day's log. Returns true if now logged.
  function toggle(day, id) {
    var list = state.logs[day] || [];
    var i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);

    if (list.length) state.logs[day] = list;
    else delete state.logs[day];
    save();
    return i === -1;
  }

  // { id: "today" | "week" | "none" } for the week starting monday.
  // today is null for weeks that don't contain today.
  function weekStatus(monday, today) {
    var status = {};
    MUSCLES.forEach(function (m) { status[m.id] = "none"; });
    Dates.weekDays(monday).forEach(function (day) {
      (state.logs[day] || []).forEach(function (id) {
        if (!(id in status)) return;
        if (day === today) status[id] = "today";
        else if (status[id] === "none") status[id] = "week";
      });
    });
    return status;
  }

  return { loggedOn: loggedOn, toggle: toggle, weekStatus: weekStatus };
})();
