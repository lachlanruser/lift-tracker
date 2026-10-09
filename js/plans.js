// Weekly plans — pure functions over a plans object, so tests can use fixtures.
//
// plans = { "<Monday YYYY-MM-DD>": { "<0-6>": [muscleId, ...] } }
// 0 = Mon … 6 = Sun. This is the brief's PlanEntry (weekStartDate, dayOfWeek,
// muscleGroupIds), stored per week. A week key with no muscles is still a
// record meaning "plan cleared — don't refill it".

var Plans = (function () {
  // 0 = Mon … 6 = Sun
  function dayIndex(dayKey) {
    var p = dayKey.split("-");
    return (new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7;
  }

  function dayList(plans, monday, idx) {
    var week = plans[monday];
    return (week && week[idx]) || [];
  }

  function isEmpty(week) {
    if (!week) return true;
    return Object.keys(week).every(function (k) { return !week[k] || !week[k].length; });
  }

  // Toggle id on a day's plan in place. The week record is kept even when it
  // becomes empty, so carry-forward won't refill a deliberately cleared week.
  // Returns true if now planned.
  function toggleIn(plans, monday, idx, id) {
    var week = plans[monday] || (plans[monday] = {});
    var list = week[idx] || [];
    var i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);

    if (list.length) week[idx] = list;
    else delete week[idx];
    return i === -1;
  }

  function copyWeek(week) {
    var out = {};
    Object.keys(week).forEach(function (k) {
      if (week[k] && week[k].length) out[k] = week[k].slice();
    });
    return out;
  }

  // Copy the latest plan forward into every week up to and including
  // currentMonday that has no record yet (fills skipped weeks too). Only
  // copies if that latest plan isn't empty. Never overwrites a record and never
  // writes past currentMonday. Returns the Mondays it created.
  function carryForward(plans, currentMonday) {
    var latest = null;
    Object.keys(plans).forEach(function (monday) {
      if (monday <= currentMonday && (latest === null || monday > latest)) latest = monday;
    });
    if (latest === null || latest === currentMonday || isEmpty(plans[latest])) return [];

    var created = [];
    for (var w = Dates.addWeeks(latest, 1); w <= currentMonday; w = Dates.addWeeks(w, 1)) {
      plans[w] = copyWeek(plans[latest]);
      created.push(w);
    }
    return created;
  }

  return {
    dayIndex: dayIndex,
    dayList: dayList,
    isEmpty: isEmpty,
    toggleIn: toggleIn,
    carryForward: carryForward
  };
})();
