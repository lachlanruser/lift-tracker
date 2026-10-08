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

  // Keys are zero-padded, so string comparison is date order.
  function isAfter(a, b) {
    return a > b;
  }

  // Rolling 30-day window ending on (and including) end.
  function monthWindow(end) {
    return { start: addDays(end, -29), end: end };
  }

  // When the date changes while the app is open, views that were on "today"
  // move to the new today. A deliberately chosen past day/window is kept.
  // view = { viewedMonday, selectedDay, monthEnd }
  function followToday(view, lastToday, today) {
    var out = { viewedMonday: view.viewedMonday, selectedDay: view.selectedDay, monthEnd: view.monthEnd };
    if (lastToday === today) return out;
    if (view.selectedDay === lastToday) {
      out.selectedDay = today;
      out.viewedMonday = mondayOf(today);
    }
    if (view.monthEnd === lastToday) out.monthEnd = today;
    return out;
  }

  // "21 – 27 Sep 2026", "28 Sep – 4 Oct 2026", "29 Dec 2025 – 4 Jan 2026".
  function formatRange(start, end) {
    var a = parseKey(start);
    var b = parseKey(end);
    var right = b.getDate() + " " + MONTHS[b.getMonth()] + " " + b.getFullYear();
    var left = String(a.getDate());
    if (a.getFullYear() !== b.getFullYear()) left += " " + MONTHS[a.getMonth()] + " " + a.getFullYear();
    else if (a.getMonth() !== b.getMonth()) left += " " + MONTHS[a.getMonth()];
    return left + " – " + right;
  }

  function formatWeek(monday) {
    return formatRange(monday, addDays(monday, 6));
  }

  // "Sun 4 Oct"
  function formatDay(key) {
    var d = parseKey(key);
    return WEEKDAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
  }

  // { dow: "Sun", date: 4 } for day-strip chips.
  function dayParts(key) {
    var d = parseKey(key);
    return { dow: WEEKDAYS[d.getDay()], date: d.getDate() };
  }

  return {
    todayKey: todayKey,
    addDays: addDays,
    addWeeks: addWeeks,
    mondayOf: mondayOf,
    weekDays: weekDays,
    isAfter: isAfter,
    monthWindow: monthWindow,
    followToday: followToday,
    formatRange: formatRange,
    formatWeek: formatWeek,
    formatDay: formatDay,
    dayParts: dayParts
  };
})();
