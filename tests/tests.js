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

  // ---------------------------------------------------------------- backup

  describe("Backup export / import", function () {
    function throws(fn, pattern) {
      try { fn(); } catch (e) {
        if (pattern.test(e.message)) return;
        throw new Error("wrong error: " + e.message);
      }
      throw new Error("expected an error");
    }

    test("Export then import round-trips exactly", function () {
      var logs = { "2026-10-08": ["chest", "triceps"], "2026-09-30": ["quads"] };
      var text = Backup.serialize(logs, {}, new Date("2026-10-08T10:00:00Z"));
      var data = JSON.parse(text);
      eq([data.app, data.version, data.exportedAt], ["lift-tracker", 2, "2026-10-08T10:00:00.000Z"]);
      var back = Backup.parse(text);
      eq(back.logs, logs);
      eq([back.days, back.entries, back.skipped], [2, 3, 0]);
    });
    test("Export of empty logs imports as empty", function () {
      eq(Backup.parse(Backup.serialize({})).logs, {});
    });
    test("Unknown muscles, bad dates and duplicates are dropped", function () {
      var r = Backup.parse(JSON.stringify({ logs: {
        "2026-10-08": ["chest", "neck", "chest"],
        "2026-02-30": ["quads"],
        "not-a-date": ["lats"],
        "2026-10-07": "lats",
        "2026-10-06": ["neck"]
      } }));
      eq(r.logs, { "2026-10-08": ["chest"] });
      eq(r.skipped, 5);
    });
    test("Non-JSON and non-backup files are rejected", function () {
      throws(function () { Backup.parse("hello"); }, /not JSON/);
      throws(function () { Backup.parse("[1,2]"); }, /isn't a Lift Tracker backup/);
      throws(function () { Backup.parse('{"foo":1}'); }, /isn't a Lift Tracker backup/);
    });
    test("Merge keeps everything from both and counts what was added", function () {
      var current = { "2026-10-08": ["chest"], "2026-10-07": ["lats"] };
      var incoming = { "2026-10-08": ["chest", "triceps"], "2026-10-01": ["quads"] };
      eq(Stats.mergeInto(current, incoming), 2);
      eq(current, { "2026-10-08": ["chest", "triceps"], "2026-10-07": ["lats"], "2026-10-01": ["quads"] });
    });
    test("Merging the same backup twice adds nothing", function () {
      var current = { "2026-10-08": ["chest"] };
      Stats.mergeInto(current, { "2026-10-08": ["chest"] });
      eq(Stats.mergeInto(current, { "2026-10-08": ["chest"] }), 0);
      eq(current, { "2026-10-08": ["chest"] });
    });
  });

  // ---------------------------------------------------------------- plans

  describe("Plan: day index and editing", function () {
    test("dayIndex is Monday-based: Mon 0 … Sun 6", function () {
      eq(["2026-10-05", "2026-10-07", "2026-10-11"].map(Plans.dayIndex), [0, 2, 6]);
      eq(Plans.dayIndex("2026-01-04"), 6); // Sunday across a year start
    });
    test("toggleIn adds and removes; an emptied week keeps its record", function () {
      var plans = {};
      eq(Plans.toggleIn(plans, "2026-10-05", 2, "chest"), true);
      eq(Plans.dayList(plans, "2026-10-05", 2), ["chest"]);
      eq(Plans.toggleIn(plans, "2026-10-05", 2, "chest"), false);
      eq(plans, { "2026-10-05": {} });
      eq(Plans.isEmpty(plans["2026-10-05"]), true);
    });
    test("dayList is empty for unplanned weeks and days", function () {
      eq(Plans.dayList({}, "2026-10-05", 0), []);
      eq(Plans.dayList({ "2026-10-05": { 1: ["lats"] } }, "2026-10-05", 0), []);
    });
  });

  describe("Plan carry-forward: week rollover", function () {
    function split() { return { "2026-10-05": { 0: ["chest", "triceps"], 2: ["lats"], 4: ["quads"] } }; }
    test("Sun -> Mon copies last week's plan into the new week", function () {
      var plans = split();
      eq(Plans.carryForward(plans, "2026-10-12"), ["2026-10-12"]);
      eq(plans["2026-10-12"], plans["2026-10-05"]);
    });
    test("Opening again in the same week creates nothing", function () {
      var plans = split();
      Plans.carryForward(plans, "2026-10-12");
      eq(Plans.carryForward(plans, "2026-10-12"), []);
    });
    test("The current week with its own plan is never overwritten", function () {
      var plans = split();
      eq(Plans.carryForward(plans, "2026-10-05"), []);
      eq(plans, split());
    });
    test("Copies are independent: editing the new week leaves history alone", function () {
      var plans = split();
      Plans.carryForward(plans, "2026-10-12");
      Plans.toggleIn(plans, "2026-10-12", 0, "biceps");
      Plans.toggleIn(plans, "2026-10-12", 2, "lats");
      eq(plans["2026-10-05"], split()["2026-10-05"]);
      eq(plans["2026-10-12"], { 0: ["chest", "triceps", "biceps"], 4: ["quads"] });
    });
    test("Mid-week edits carry into next week (copy is taken when the week starts)", function () {
      var plans = split();
      Plans.toggleIn(plans, "2026-10-05", 6, "calves"); // edited on, say, Thursday
      Plans.carryForward(plans, "2026-10-12");
      eq(plans["2026-10-12"][6], ["calves"]);
    });
    test("Rollover across the year boundary", function () {
      var plans = { "2025-12-29": { 3: ["glutes"] } };
      eq(Plans.carryForward(plans, "2026-01-05"), ["2026-01-05"]);
      eq(plans["2026-01-05"], { 3: ["glutes"] });
    });
  });

  describe("Plan carry-forward: previous week had no plan", function () {
    test("No plans at all -> new week starts empty, nothing stored", function () {
      var plans = {};
      eq(Plans.carryForward(plans, "2026-10-12"), []);
      eq(plans, {});
    });
    test("Previous week's plan was cleared -> new week starts empty", function () {
      var plans = { "2026-09-28": { 0: ["chest"] }, "2026-10-05": {} };
      eq(Plans.carryForward(plans, "2026-10-12"), []);
      eq("2026-10-12" in plans, false);
    });
    test("A cleared current week is never refilled", function () {
      var plans = { "2026-10-05": { 0: ["chest"] }, "2026-10-12": {} };
      eq(Plans.carryForward(plans, "2026-10-12"), []);
      eq(plans["2026-10-12"], {});
    });
  });

  describe("Plan carry-forward: skipped weeks", function () {
    test("Plan in week 1, reopened in week 4 -> weeks 2, 3 and 4 each get a copy", function () {
      var plans = { "2026-09-21": { 1: ["hamstrings"] } };
      eq(Plans.carryForward(plans, "2026-10-12"), ["2026-09-28", "2026-10-05", "2026-10-12"]);
      eq(plans["2026-09-28"], { 1: ["hamstrings"] });
      eq(plans["2026-10-12"], { 1: ["hamstrings"] });
    });
    test("Gap copies are independent of each other", function () {
      var plans = { "2026-09-21": { 1: ["hamstrings"] } };
      Plans.carryForward(plans, "2026-10-12");
      Plans.toggleIn(plans, "2026-10-12", 1, "hamstrings");
      eq(plans["2026-09-28"], { 1: ["hamstrings"] });
      eq(plans["2026-10-05"], { 1: ["hamstrings"] });
    });
    test("Fills from the latest plan before the gap", function () {
      var plans = { "2026-09-14": { 0: ["chest"] }, "2026-09-28": { 0: ["lats"] } };
      Plans.carryForward(plans, "2026-10-12");
      eq("2026-09-21" in plans, false); // before the latest plan: untouched
      eq(plans["2026-10-12"], { 0: ["lats"] });
    });
    test("Latest record before the gap is empty -> the gap is not filled", function () {
      var plans = { "2026-09-14": { 0: ["chest"] }, "2026-09-21": {} };
      eq(Plans.carryForward(plans, "2026-10-12"), []);
    });
    test("Never creates weeks after the current week", function () {
      var plans = { "2026-10-05": { 0: ["chest"] } };
      Plans.carryForward(plans, "2026-10-19");
      eq(Object.keys(plans).sort(), ["2026-10-05", "2026-10-12", "2026-10-19"]);
    });
    test("A stray future record (clock moved back) is ignored", function () {
      var plans = { "2026-10-05": { 0: ["chest"] }, "2026-11-02": { 0: ["calves"] } };
      eq(Plans.carryForward(plans, "2026-10-12"), ["2026-10-12"]);
      eq(plans["2026-10-12"], { 0: ["chest"] });
    });
  });

  describe("Plan backups (export only — import brings logs only)", function () {
    test("Export includes plans, including a cleared week", function () {
      var plans = { "2026-10-05": { 0: ["chest"], 6: ["calves"] }, "2026-10-12": {} };
      var data = JSON.parse(Backup.serialize({ "2026-10-08": ["chest"] }, plans));
      eq([data.version, data.plans], [2, plans]);
    });
    test("Import ignores plans in the file and returns only logs", function () {
      var text = Backup.serialize({ "2026-10-08": ["chest"] }, { "2026-10-05": { 0: ["lats"] } });
      var r = Backup.parse(text);
      eq(r.logs, { "2026-10-08": ["chest"] });
      eq("plans" in r, false);
      eq(r.skipped, 0);
    });
    test("v1 backup (no plans) still imports", function () {
      var r = Backup.parse(JSON.stringify({ app: "lift-tracker", version: 1, logs: { "2026-10-08": ["chest"] } }));
      eq(r.logs, { "2026-10-08": ["chest"] });
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
