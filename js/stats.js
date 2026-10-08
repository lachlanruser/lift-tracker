// Pure functions over a logs object ({ "YYYY-MM-DD": [muscleId, ...] }).
// No storage access, so tests can pass in fixture data.

var Stats = (function () {
  function zeroed(value) {
    var out = {};
    MUSCLES.forEach(function (m) { out[m.id] = value; });
    return out;
  }

  // { id: "day" | "week" | "none" } for the week starting monday.
  // "day" = logged on selectedDay, "week" = logged on another day that week.
  function weekStatus(logs, monday, selectedDay) {
    var status = zeroed("none");
    Dates.weekDays(monday).forEach(function (day) {
      (logs[day] || []).forEach(function (id) {
        if (!(id in status)) return;
        if (day === selectedDay) status[id] = "day";
        else if (status[id] === "none") status[id] = "week";
      });
    });
    return status;
  }

  // { id: n } — number of distinct days each muscle was logged, start..end inclusive.
  function countDays(logs, start, end) {
    var counts = zeroed(0);
    Object.keys(logs).forEach(function (day) {
      if (day < start || day > end) return;
      var seen = {};
      (logs[day] || []).forEach(function (id) {
        if (!(id in counts) || seen[id]) return;
        seen[id] = true;
        counts[id]++;
      });
    });
    return counts;
  }

  // Fixed bands: 0 | 1 | 2–3 | 4–5 | 6–8 | 9+
  function bandFor(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    if (n <= 3) return 2;
    if (n <= 5) return 3;
    if (n <= 8) return 4;
    return 5;
  }

  // Add or remove id from day's log in place. Returns true if now logged.
  function toggleIn(logs, day, id) {
    var list = logs[day] || [];
    var i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);

    if (list.length) logs[day] = list;
    else delete logs[day];
    return i === -1;
  }

  return { weekStatus: weekStatus, countDays: countDays, bandFor: bandFor, toggleIn: toggleIn };
})();
