// Local-date helpers. Dates are "YYYY-MM-DD" strings in local time.
// ?date=YYYY-MM-DD overrides "today" for testing.

var Dates = (function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function keyOf(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function parseKey(key) {
    var p = key.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function override() {
    var m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    return m ? m[1] : null;
  }

  function todayKey() {
    return override() || keyOf(new Date());
  }

  function addDays(key, n) {
    var d = parseKey(key);
    d.setDate(d.getDate() + n);
    return keyOf(d);
  }

  function addWeeks(key, n) {
    return addDays(key, n * 7);
  }

  // Monday of the calendar week (Mon–Sun) containing key.
  function mondayOf(key) {
    var dow = parseKey(key).getDay(); // 0 = Sun
    return addDays(key, dow === 0 ? -6 : 1 - dow);
  }

  function weekDays(monday) {
    var days = [];
    for (var i = 0; i < 7; i++) days.push(addDays(monday, i));
    return days;
  }

  // "28 Sep – 4 Oct 2026", or "29 Dec 2025 – 4 Jan 2026" across a year.
  function formatWeek(monday) {
    var a = parseKey(monday);
    var b = parseKey(addDays(monday, 6));
    var left = a.getDate() + " " + MONTHS[a.getMonth()];
    if (a.getFullYear() !== b.getFullYear()) left += " " + a.getFullYear();
    return left + " – " + b.getDate() + " " + MONTHS[b.getMonth()] + " " + b.getFullYear();
  }

  // "Sun 4 Oct"
  function formatDay(key) {
    var d = parseKey(key);
    return WEEKDAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
  }

  return {
    todayKey: todayKey,
    addDays: addDays,
    addWeeks: addWeeks,
    mondayOf: mondayOf,
    weekDays: weekDays,
    formatWeek: formatWeek,
    formatDay: formatDay
  };
})();
