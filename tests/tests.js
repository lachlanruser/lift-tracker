// Tiny browser test harness. Uses only pure modules (Dates, Stats) and
// in-memory fixtures — never touches the app's localStorage.

(function () {
  var results = [];
  var group = "";

  function describe(name, fn) { group = name; fn(); }

  function test(name, fn) {
    try {
      fn();
      results.push({ group: group, name: name, ok: true });
    } catch (e) {
      results.push({ group: group, name: name, ok: false, msg: e.message });
    }
  }

  // Stable JSON: object keys sorted, so key order doesn't matter.
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") {
      return "{" + Object.keys(v).sort().map(function (k) {
        return JSON.stringify(k) + ":" + stable(v[k]);
      }).join(",") + "}";
    }
    return JSON.stringify(v);
  }

  function eq(actual, expected, label) {
    var a = stable(actual), b = stable(expected);
    if (a !== b) throw new Error((label ? label + ": " : "") + "expected " + b + ", got " + a);
  }

  function onlyNonZero(obj) {
    var out = {};
    Object.keys(obj).forEach(function (k) { if (obj[k] && obj[k] !== "none") out[k] = obj[k]; });
    return out;
  }

  // ---------------------------------------------------------------- weeks

  describe("Week boundaries (Mon–Sun)", function () {
    test("Sunday belongs to the week starting the previous Monday", function () {
      eq(Dates.mondayOf("2026-10-04"), "2026-09-28");
    });
    test("Monday is its own week start", function () {
      eq(Dates.mondayOf("2026-10-05"), "2026-10-05");
    });
    test("Mid-week day maps to its Monday", function () {
      eq(Dates.mondayOf("2026-10-08"), "2026-10-05");
    });
    test("Week crossing a year boundary", function () {
      eq(Dates.mondayOf("2026-01-01"), "2025-12-29");
      eq(Dates.mondayOf("2026-01-04"), "2025-12-29");
    });
    test("AU daylight-saving start (Sun 4 Oct 2026) doesn't skew day maths", function () {
      eq(Dates.addDays("2026-10-03", 1), "2026-10-04");
      eq(Dates.addDays("2026-10-04", 1), "2026-10-05");
      eq(Dates.addWeeks("2026-09-28", 1), "2026-10-05");
    });
    test("weekDays returns 7 consecutive keys Mon..Sun", function () {
      eq(Dates.weekDays("2026-09-28"),
        ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    });
    test("weekStatus: Sunday log counts in its week, Monday log in the next", function () {
      var logs = { "2026-10-04": ["calves"], "2026-10-05": ["biceps"] };
      eq(onlyNonZero(Stats.weekStatus(logs, "2026-09-28", "2026-09-30")), { calves: "week" });
      eq(onlyNonZero(Stats.weekStatus(logs, "2026-10-05", "2026-10-05")), { biceps: "day" });
    });
    test("weekStatus: selected day is 'day', other days are 'week'", function () {
      var logs = { "2026-09-28": ["lats", "chest"], "2026-09-30": ["chest", "quads"] };
      eq(onlyNonZero(Stats.weekStatus(logs, "2026-09-28", "2026-09-30")),
        { chest: "day", quads: "day", lats: "week" });
      eq(onlyNonZero(Stats.weekStatus(logs, "2026-09-28", "2026-09-28")),
        { chest: "day", lats: "day", quads: "week" });
    });
    test("Week label formatting", function () {
      eq(Dates.formatWeek("2026-09-21"), "21 – 27 Sep 2026");
      eq(Dates.formatWeek("2026-09-28"), "28 Sep – 4 Oct 2026");
      eq(Dates.formatWeek("2025-12-29"), "29 Dec 2025 – 4 Jan 2026");
    });
    test("isAfter compares by date", function () {
      eq(Dates.isAfter("2026-10-09", "2026-10-08"), true);
      eq(Dates.isAfter("2026-10-08", "2026-10-08"), false);
      eq(Dates.isAfter("2025-12-31", "2026-01-01"), false);
    });
  });

  // ---------------------------------------------------------------- 30 days

  describe("30-day window", function () {
    test("Window is inclusive and exactly 30 days", function () {
      var w = Dates.monthWindow("2026-10-08");
      eq(w, { start: "2026-09-09", end: "2026-10-08" });
      var n = 0;
      for (var d = w.start; d <= w.end; d = Dates.addDays(d, 1)) n++;
      eq(n, 30);
    });
    test("Window crossing a year boundary", function () {
      eq(Dates.monthWindow("2026-01-10"), { start: "2025-12-12", end: "2026-01-10" });
    });
    test("Window across a leap day (and the non-leap contrast)", function () {
      eq(Dates.monthWindow("2028-03-01"), { start: "2028-02-01", end: "2028-03-01" });
      eq(Dates.monthWindow("2027-03-01"), { start: "2027-01-31", end: "2027-03-01" });
      var logs = { "2028-02-29": ["glutes"] };
      eq(Stats.countDays(logs, "2028-02-01", "2028-03-01").glutes, 1);
    });
    test("countDays includes day -29 and today, excludes day -30 and tomorrow", function () {
      var logs = {
        "2026-09-08": ["chest"],  // day -30
        "2026-09-09": ["lats"],   // day -29 (first day)
        "2026-10-08": ["quads"],  // today
        "2026-10-09": ["calves"]  // tomorrow
      };
      eq(onlyNonZero(Stats.countDays(logs, "2026-09-09", "2026-10-08")), { lats: 1, quads: 1 });
    });
    test("countDays counts distinct days per muscle", function () {
      var logs = {
        "2026-10-01": ["chest", "triceps"],
        "2026-10-03": ["chest"],
        "2026-10-05": ["chest", "chest"]  // duplicate on one day counts once
      };
      eq(onlyNonZero(Stats.countDays(logs, "2026-09-09", "2026-10-08")), { chest: 3, triceps: 1 });
    });
    test("Stepping back 30 days gives an adjacent, non-overlapping window", function () {
      var now = Dates.monthWindow("2026-10-08");
      var prev = Dates.monthWindow(Dates.addDays(now.end, -30));
      eq(Dates.addDays(prev.end, 1), now.start);
    });
  });

  // ---------------------------------------------------------------- empty data

  describe("Days with no data", function () {
    test("Empty logs: every muscle is 'none' for the week", function () {
      var s = Stats.weekStatus({}, "2026-10-05", "2026-10-08");
      eq(Object.keys(s).length, MUSCLES.length);
      eq(onlyNonZero(s), {});
    });
    test("Empty logs: every muscle has 0 days in the window", function () {
      var c = Stats.countDays({}, "2026-09-09", "2026-10-08");
      eq(Object.keys(c).length, MUSCLES.length);
      eq(onlyNonZero(c), {});
    });
    test("Empty or missing day arrays are ignored", function () {
      var logs = { "2026-10-06": [], "2026-10-07": null };
      eq(onlyNonZero(Stats.weekStatus(logs, "2026-10-05", "2026-10-06")), {});
      eq(onlyNonZero(Stats.countDays(logs, "2026-09-09", "2026-10-08")), {});
    });
    test("Unknown muscle ids are ignored", function () {
      var logs = { "2026-10-06": ["neck", "chest"] };
      eq(onlyNonZero(Stats.weekStatus(logs, "2026-10-05", "2026-10-06")), { chest: "day" });
      eq(onlyNonZero(Stats.countDays(logs, "2026-09-09", "2026-10-08")), { chest: 1 });
    });
    test("bandFor thresholds: 0 | 1 | 2–3 | 4–5 | 6–8 | 9+", function () {
      eq([0, 1, 2, 3, 4, 5, 6, 8, 9, 30].map(Stats.bandFor), [0, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    });
  });

  // ---------------------------------------------------------------- logging

  describe("Logging (in-memory)", function () {
    test("toggleIn on a past day adds, then removes and deletes the empty day", function () {
      var logs = { "2026-10-08": ["quads"] };
      eq(Stats.toggleIn(logs, "2026-10-06", "lats"), true);
      eq(logs, { "2026-10-08": ["quads"], "2026-10-06": ["lats"] });
      eq(Stats.toggleIn(logs, "2026-10-06", "lats"), false);
      eq(logs, { "2026-10-08": ["quads"] });
    });
    test("Editing one day leaves other days untouched", function () {
      var logs = { "2026-10-05": ["chest"], "2026-10-06": ["chest"] };
      Stats.toggleIn(logs, "2026-10-06", "chest");
      eq(logs, { "2026-10-05": ["chest"] });
    });
  });

  // ---------------------------------------------------------------- midnight

  describe("Midnight rollover", function () {
    var view = { viewedMonday: "2026-10-05", selectedDay: "2026-10-08", monthEnd: "2026-10-08" };
    test("Same day: nothing changes", function () {
      eq(Dates.followToday(view, "2026-10-08", "2026-10-08"), view);
    });
    test("Selected today -> follows to the new today", function () {
      eq(Dates.followToday(view, "2026-10-08", "2026-10-09"),
        { viewedMonday: "2026-10-05", selectedDay: "2026-10-09", monthEnd: "2026-10-09" });
    });
    test("Sunday -> Monday rollover moves to the new week", function () {
      var sun = { viewedMonday: "2026-10-05", selectedDay: "2026-10-11", monthEnd: "2026-10-11" };
      eq(Dates.followToday(sun, "2026-10-11", "2026-10-12"),
        { viewedMonday: "2026-10-12", selectedDay: "2026-10-12", monthEnd: "2026-10-12" });
    });
    test("A deliberately chosen past day or window is kept", function () {
      var past = { viewedMonday: "2026-09-28", selectedDay: "2026-10-01", monthEnd: "2026-09-08" };
      eq(Dates.followToday(past, "2026-10-08", "2026-10-09"), past);
    });
  });

  // ---------------------------------------------------------------- report

  var passed = results.filter(function (r) { return r.ok; }).length;
  var failed = results.length - passed;
  var summary = document.getElementById("summary");
  summary.textContent = passed + " passed, " + failed + " failed";
  summary.className = failed ? "fail" : "pass";

  var html = "", current = null;
  results.forEach(function (r) {
    if (r.group !== current) {
      if (current !== null) html += "</ul>";
      current = r.group;
      html += "<h2>" + r.group + "</h2><ul>";
    }
    html += '<li class="' + (r.ok ? "pass" : "fail") + '">' + (r.ok ? "✓ " : "✗ ") + r.name +
      (r.ok ? "" : "<pre>" + r.msg.replace(/</g, "&lt;") + "</pre>") + "</li>";
  });
  document.getElementById("results").innerHTML = html + "</ul>";
  window.TEST_RESULTS = { passed: passed, failed: failed, failures: results.filter(function (r) { return !r.ok; }) };
})();
