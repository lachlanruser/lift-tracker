// Backup file format (pure — no DOM or storage access, so it's testable).
// v2: { "app": "lift-tracker", "version": 2, "exportedAt": ISO,
//       "logs":  { "YYYY-MM-DD": [muscleId, ...] },
//       "plans": { "<Monday YYYY-MM-DD>": { "<0-6>": [muscleId, ...] } } }
// v1 files (no "plans") still import.

var Backup = (function () {
  var DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

  function sortedCopy(obj, copyValue) {
    var out = {};
    Object.keys(obj).sort().forEach(function (k) { out[k] = copyValue(obj[k]); });
    return out;
  }

  function serialize(logs, plans, now) {
    return JSON.stringify({
      app: "lift-tracker",
      version: 2,
      exportedAt: (now || new Date()).toISOString(),
      logs: sortedCopy(logs, function (ids) { return ids.slice(); }),
      plans: sortedCopy(plans || {}, function (week) {
        return sortedCopy(week, function (ids) { return ids.slice(); });
      })
    }, null, 2);
  }

  // Real calendar date in YYYY-MM-DD form (rejects e.g. 2026-02-30).
  function isDay(key) {
    return DAY_RE.test(key) && Dates.addDays(key, 0) === key;
  }

  // Known, de-duplicated ids; counts unknown ones via skip().
  function cleanIds(list, skip) {
    var ids = [];
    list.forEach(function (id) {
      if (!MUSCLE_BY_ID[id]) { skip(); return; }
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  // Returns { logs, plans, days, entries, weeks, skipped }. Throws Error with
  // a readable message if the text isn't a usable backup.
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

    var skipped = 0;
    function skip() { skipped++; }

    var logs = {}, entries = 0;
    Object.keys(raw).forEach(function (day) {
      if (!isDay(day) || !Array.isArray(raw[day])) { skip(); return; }
      var ids = cleanIds(raw[day], skip);
      if (ids.length) {
        logs[day] = ids;
        entries += ids.length;
      }
    });

    // Plans: week keys must be real Mondays, day keys 0–6. A valid week with
    // no muscles is kept (it records a deliberately cleared plan).
    var plans = {};
    var rawPlans = data.plans;
    if (rawPlans && typeof rawPlans === "object" && !Array.isArray(rawPlans)) {
      Object.keys(rawPlans).forEach(function (monday) {
        var week = rawPlans[monday];
        if (!isDay(monday) || Dates.mondayOf(monday) !== monday ||
            !week || typeof week !== "object" || Array.isArray(week)) { skip(); return; }
        var clean = {};
        Object.keys(week).forEach(function (idx) {
          if (!/^[0-6]$/.test(idx) || !Array.isArray(week[idx])) { skip(); return; }
          var ids = cleanIds(week[idx], skip);
          if (ids.length) clean[idx] = ids;
        });
        plans[monday] = clean;
      });
    }

    return {
      logs: logs,
      plans: plans,
      days: Object.keys(logs).length,
      entries: entries,
      weeks: Object.keys(plans).length,
      skipped: skipped
    };
  }

  return { serialize: serialize, parse: parse };
})();
