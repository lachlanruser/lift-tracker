// Backup file format (pure — no DOM or storage access, so it's testable).
// v3: { "app": "lift-tracker", "version": 3, "exportedAt": ISO,
//       "logs":    { "YYYY-MM-DD": [muscleId, ...] },
//       "plans":   { "<Monday YYYY-MM-DD>": { "<0-6>": [muscleId, ...] } },
//       "cardio":  { "YYYY-MM-DD": true },
//       "weights": { "YYYY-MM-DD": { muscleId: kg } } }
// Import reads the logged-workout data (logs, cardio, weights). Plans are set
// up per device, so any "plans" in the file are ignored. v1/v2 files (without
// cardio/weights) import the same way.

var Backup = (function () {
  var DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

  function sortedCopy(obj, copyValue) {
    var out = {};
    Object.keys(obj).sort().forEach(function (k) { out[k] = copyValue(obj[k]); });
    return out;
  }

  function serialize(logs, plans, cardio, weights, now) {
    return JSON.stringify({
      app: "lift-tracker",
      version: 3,
      exportedAt: (now || new Date()).toISOString(),
      logs: sortedCopy(logs, function (ids) { return ids.slice(); }),
      plans: sortedCopy(plans || {}, function (week) {
        return sortedCopy(week, function (ids) { return ids.slice(); });
      }),
      cardio: sortedCopy(cardio || {}, function () { return true; }),
      weights: sortedCopy(weights || {}, function (day) {
        return sortedCopy(day, function (kg) { return kg; });
      })
    }, null, 2);
  }

  function isObj(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
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

  // Returns { logs, cardio, weights, days, entries, skipped }. Throws Error
  // with a readable message if the text isn't a usable backup.
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

    var cardio = {};
    if (isObj(data.cardio)) {
      Object.keys(data.cardio).forEach(function (day) {
        if (!isDay(day) || data.cardio[day] !== true) { skip(); return; }
        cardio[day] = true;
      });
    }

    // Weights: real dates, known muscles, numbers 0–1000. (Whether the muscle
    // is actually logged that day is checked when merging.)
    var weights = {};
    if (isObj(data.weights)) {
      Object.keys(data.weights).forEach(function (day) {
        var w = data.weights[day];
        if (!isDay(day) || !isObj(w)) { skip(); return; }
        Object.keys(w).forEach(function (id) {
          if (!MUSCLE_BY_ID[id] || !Weights.isValidKg(w[id])) { skip(); return; }
          Weights.setIn(weights, day, id, w[id]);
        });
      });
    }

    return {
      logs: logs,
      cardio: cardio,
      weights: weights,
      days: Object.keys(logs).length,
      entries: entries,
      skipped: skipped
    };
  }

  return { serialize: serialize, parse: parse };
})();
