// Backup file format (pure — no DOM or storage access, so it's testable).
// { "app": "lift-tracker", "version": 1, "exportedAt": ISO, "logs": { "YYYY-MM-DD": [muscleId, ...] } }

var Backup = (function () {
  var DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

  function serialize(logs, now) {
    var sorted = {};
    Object.keys(logs).sort().forEach(function (day) { sorted[day] = logs[day].slice(); });
    return JSON.stringify({
      app: "lift-tracker",
      version: 1,
      exportedAt: (now || new Date()).toISOString(),
      logs: sorted
    }, null, 2);
  }

  // Real calendar date in YYYY-MM-DD form (rejects e.g. 2026-02-30).
  function isDay(key) {
    return DAY_RE.test(key) && Dates.addDays(key, 0) === key;
  }

  // Returns { logs, days, entries, skipped }. Throws Error with a readable
  // message if the text isn't a usable backup.
  function parse(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("That file isn't a valid backup (not JSON).");
    }
    var raw = data && typeof data === "object" ? data.logs : null;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("That file isn't a Lift Tracker backup.");
    }

    var logs = {}, entries = 0, skipped = 0;
    Object.keys(raw).forEach(function (day) {
      if (!isDay(day) || !Array.isArray(raw[day])) { skipped++; return; }
      var ids = [];
      raw[day].forEach(function (id) {
        if (!MUSCLE_BY_ID[id]) { skipped++; return; }
        if (ids.indexOf(id) === -1) ids.push(id);
      });
      if (ids.length) {
        logs[day] = ids;
        entries += ids.length;
      }
    });
    return { logs: logs, days: Object.keys(logs).length, entries: entries, skipped: skipped };
  }

  return { serialize: serialize, parse: parse };
})();
