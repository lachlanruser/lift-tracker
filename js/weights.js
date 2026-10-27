// Weights (kg per logged muscle per day) and cardio days — pure functions over
// plain objects, so tests can use fixtures.
//
// weights = { "YYYY-MM-DD": { muscleId: kg } }
//   A weight is remembered even if the muscle is later un-ticked that day, so
//   re-ticking (same day or later) offers it again. Only ticked days count as
//   training (see history/summary); un-ticked weights only feed the pre-fill.
// cardio  = { "YYYY-MM-DD": true }

var Weights = (function () {
  var MAX_KG = 1000;
  var NUMBER_RE = /^(\d+(\.\d{0,2})?|\.\d{1,2})$/;

  // Carry-forward default for logging id on day: the most recently dated
  // weight strictly before day, or null. Newer entries never affect an older
  // day, and editing an older day never overrides a newer entry.
  function defaultFor(weights, id, day) {
    var best = null;
    Object.keys(weights).forEach(function (d) {
      if (d >= day || weights[d][id] == null) return;
      if (best === null || d > best) best = d;
    });
    return best === null ? null : weights[best][id];
  }

  // "60", "22.5", "22,5" → number; "" → null (no weight); anything else → NaN.
  function parse(text) {
    var s = String(text).trim().replace(",", ".");
    if (s === "") return null;
    if (!NUMBER_RE.test(s)) return NaN;
    var n = Math.round(parseFloat(s) * 100) / 100;
    return n <= MAX_KG ? n : NaN;
  }

  function isValidKg(n) {
    return typeof n === "number" && isFinite(n) && n >= 0 && n <= MAX_KG;
  }

  // Set or (kg === null) clear one weight in place; empty days are removed.
  function setIn(weights, day, id, kg) {
    if (kg === null) {
      if (weights[day]) {
        delete weights[day][id];
        if (!Object.keys(weights[day]).length) delete weights[day];
      }
      return;
    }
    (weights[day] || (weights[day] = {}))[id] = kg;
  }

  // Toggle a muscle's log for day (in place). Ticking keeps a weight already
  // remembered for that day; otherwise it saves the carry-forward default (if
  // any). Un-ticking keeps the weight, so it comes back on re-tick. A weight
  // never logs a muscle by itself. Returns true if now logged.
  function toggleLogIn(logs, weights, day, id) {
    var logged = Stats.toggleIn(logs, day, id);
    if (logged && !(weights[day] && weights[day][id] != null)) {
      var kg = defaultFor(weights, id, day);
      if (kg !== null) setIn(weights, day, id, kg);
    }
    return logged;
  }

  // Import: add incoming weights where target has none for that day+muscle
  // (remembered weights count too, ticked or not). Never overwrites.
  function mergeInto(target, incoming) {
    var added = 0;
    Object.keys(incoming).forEach(function (day) {
      Object.keys(incoming[day]).forEach(function (id) {
        if (target[day] && target[day][id] != null) return;
        setIn(target, day, id, incoming[day][id]);
        added++;
      });
    });
    return added;
  }

  // Import: union of cardio days. Returns how many days were added.
  function mergeCardioInto(target, incoming) {
    var added = 0;
    Object.keys(incoming).forEach(function (day) {
      if (incoming[day] && !target[day]) {
        target[day] = true;
        added++;
      }
    });
    return added;
  }

  // Toggle cardio for day in place. Returns true if now ticked.
  function toggleCardioIn(cardio, day) {
    if (cardio[day]) {
      delete cardio[day];
      return false;
    }
    cardio[day] = true;
    return true;
  }

  return {
    MAX_KG: MAX_KG,
    defaultFor: defaultFor,
    parse: parse,
    isValidKg: isValidKg,
    setIn: setIn,
    toggleLogIn: toggleLogIn,
    mergeInto: mergeInto,
    mergeCardioInto: mergeCardioInto,
    toggleCardioIn: toggleCardioIn
  };
})();
