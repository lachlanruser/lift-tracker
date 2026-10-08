// Wiring: Week/Month modes, period navigation, day strip, label reveal, tap-to-log.
//
// Week mode: taps log to the day selected in the day strip (today by default).
//   Mouse: hover shows the name, click toggles the selected day's log.
//   Touch/pen: first tap selects + shows the name, tapping it again toggles.
//   Keyboard: focus shows the name, Enter/Space toggles, Escape clears.
// Month mode: read-only heatmap of days trained in a rolling 30-day window.
//   Hover/tap/focus shows "Name · N days"; nothing toggles.

(function () {
  var app = document.getElementById("app");
  var stage = document.getElementById("stage");
  var labelEl = document.getElementById("muscle-label");
  var weekLabel = document.getElementById("week-label");
  var weekSub = document.getElementById("week-sub");
  var prevBtn = document.getElementById("prev-week");
  var nextBtn = document.getElementById("next-week");
  var dayStrip = document.getElementById("day-strip");
  var legendDay = document.getElementById("legend-day");
  var legendWeek = document.getElementById("legend-week");
  var legendMonth = document.getElementById("legend-month");
  var modeWeekBtn = document.getElementById("mode-week");
  var modeMonthBtn = document.getElementById("mode-month");

  document.getElementById("figure-front").appendChild(Figure.build("front"));
  document.getElementById("figure-back").appendChild(Figure.build("back"));
  var groups = Array.prototype.slice.call(stage.querySelectorAll(".muscle"));

  var chips = [];
  for (var i = 0; i < 7; i++) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "day-chip";
    chip.innerHTML = '<span class="dow"></span><span class="date"></span>';
    chip.addEventListener("click", onChipClick);
    dayStrip.appendChild(chip);
    chips.push(chip);
  }

  var mode = "week";                  // "week" | "month"
  var viewedMonday = currentMonday();
  var selectedDay = Dates.todayKey();
  var monthEnd = Dates.todayKey();    // last day of the 30-day window
  var monthCounts = {};
  var lastToday = Dates.todayKey();
  var activeId = null;    // muscle whose label is showing
  var selectedId = null;  // touch selection (awaiting a second tap)
  var lastPointer = "mouse";

  function currentMonday() {
    return Dates.mondayOf(Dates.todayKey());
  }

  // Week mode only: any day up to and including today can be edited.
  function editable() {
    return mode === "week" && !Dates.isAfter(selectedDay, Dates.todayKey());
  }

  // Today for the current week, Sunday for past weeks.
  function defaultDayFor(monday) {
    return monday === currentMonday() ? Dates.todayKey() : Dates.addDays(monday, 6);
  }

  function dayText(day, today) {
    return day === today ? "today, " + Dates.formatDay(day) : Dates.formatDay(day);
  }

  function countText(n) {
    return n + (n === 1 ? " day" : " days");
  }

  function labelText(id) {
    var name = MUSCLE_BY_ID[id].label;
    return mode === "month" ? name + " · " + countText(monthCounts[id] || 0) : name;
  }

  // Midnight rollover: if the app stayed open into a new day, move views that
  // were on today onto the new today, so taps don't land on yesterday.
  function syncToday() {
    var today = Dates.todayKey();
    if (today === lastToday) return;
    var v = Dates.followToday(
      { viewedMonday: viewedMonday, selectedDay: selectedDay, monthEnd: monthEnd }, lastToday, today);
    viewedMonday = v.viewedMonday;
    selectedDay = v.selectedDay;
    monthEnd = v.monthEnd;
    lastToday = today;
  }

  function render() {
    syncToday();
    var today = Dates.todayKey();
    var isMonth = mode === "month";

    app.classList.toggle("view-only", isMonth);
    dayStrip.hidden = isMonth;
    legendWeek.hidden = isMonth;
    legendMonth.hidden = !isMonth;
    modeWeekBtn.setAttribute("aria-pressed", isMonth ? "false" : "true");
    modeMonthBtn.setAttribute("aria-pressed", isMonth ? "true" : "false");
    prevBtn.setAttribute("aria-label", isMonth ? "Previous 30 days" : "Previous week");
    nextBtn.setAttribute("aria-label", isMonth ? "Next 30 days" : "Next week");

    if (isMonth) renderMonth(today);
    else renderWeek(today);

    groups.forEach(function (g) {
      g.classList.toggle("is-active", g.getAttribute("data-muscle") === activeId);
    });
    if (activeId) labelEl.textContent = labelText(activeId);
  }

  function renderWeek(today) {
    var status = Stats.weekStatus(Store.logs(), viewedMonday, selectedDay);

    groups.forEach(function (g) {
      var id = g.getAttribute("data-muscle");
      g.removeAttribute("data-band");
      g.setAttribute("data-state", status[id]);
      g.setAttribute("aria-pressed", status[id] === "day" ? "true" : "false");
      g.setAttribute("aria-label", MUSCLE_BY_ID[id].label);
    });

    Dates.weekDays(viewedMonday).forEach(function (day, i) {
      var parts = Dates.dayParts(day);
      var chip = chips[i];
      chip.setAttribute("data-day", day);
      chip.setAttribute("aria-label", Dates.formatDay(day) + (day === today ? " (today)" : ""));
      chip.setAttribute("aria-pressed", day === selectedDay ? "true" : "false");
      chip.disabled = Dates.isAfter(day, today);
      chip.classList.toggle("is-today", day === today);
      chip.firstChild.textContent = parts.dow;
      chip.lastChild.textContent = parts.date;
    });

    weekLabel.textContent = Dates.formatWeek(viewedMonday);
    weekSub.textContent = "Logging for " + dayText(selectedDay, today);
    legendDay.textContent = selectedDay === today ? "Logged today" : "Logged " + Dates.formatDay(selectedDay);
    nextBtn.disabled = viewedMonday >= currentMonday();
  }

  function renderMonth(today) {
    if (Dates.isAfter(monthEnd, today)) monthEnd = today;
    var w = Dates.monthWindow(monthEnd);
    monthCounts = Stats.countDays(Store.logs(), w.start, w.end);

    groups.forEach(function (g) {
      var id = g.getAttribute("data-muscle");
      g.removeAttribute("data-state");
      g.removeAttribute("aria-pressed");
      g.setAttribute("data-band", Stats.bandFor(monthCounts[id]));
      g.setAttribute("aria-label", MUSCLE_BY_ID[id].label + ": " + countText(monthCounts[id]));
    });

    weekLabel.textContent = Dates.formatRange(w.start, w.end);
    weekSub.textContent = (monthEnd === today ? "Last 30 days" : "30 days") + " · view only";
    nextBtn.disabled = monthEnd >= today;
  }

  function setMode(next) {
    if (next === mode) return;
    clearLabel();
    mode = next;
    if (mode === "month") monthEnd = Dates.todayKey();
    render();
  }

  function onChipClick(e) {
    e.stopPropagation();
    var day = e.currentTarget.getAttribute("data-day");
    if (Dates.isAfter(day, Dates.todayKey())) return;
    clearLabel();
    selectedDay = day;
    render();
  }

  function goToWeek(monday) {
    clearLabel();
    viewedMonday = monday;
    selectedDay = defaultDayFor(monday);
    render();
  }

  function stepMonth(days) {
    clearLabel();
    var end = Dates.addDays(monthEnd, days);
    var today = Dates.todayKey();
    monthEnd = Dates.isAfter(end, today) ? today : end;
    render();
  }

  function showLabel(id, target) {
    activeId = id;
    labelEl.textContent = labelText(id);
    labelEl.hidden = false;

    var box = target.getBoundingClientRect();
    var frame = stage.getBoundingClientRect();
    var half = labelEl.offsetWidth / 2;
    var x = box.left + box.width / 2 - frame.left;
    x = Math.max(half, Math.min(frame.width - half, x));
    labelEl.style.left = x + "px";
    labelEl.style.top = Math.max(labelEl.offsetHeight, box.top - frame.top - 6) + "px";

    groups.forEach(function (g) {
      g.classList.toggle("is-active", g.getAttribute("data-muscle") === id);
    });
  }

  function clearLabel() {
    activeId = null;
    selectedId = null;
    labelEl.hidden = true;
    groups.forEach(function (g) { g.classList.remove("is-active"); });
  }

  function toggle(id) {
    syncToday();
    if (!editable()) {
      render();
      return;
    }
    Store.toggle(selectedDay, id);
    render();
  }

  groups.forEach(function (g) {
    var id = g.getAttribute("data-muscle");

    g.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType || "mouse"; });
    // Keep mouse/touch from focusing the group; focus is for keyboard users.
    g.addEventListener("mousedown", function (e) { e.preventDefault(); });

    g.addEventListener("pointerover", function (e) {
      if (e.pointerType === "mouse") showLabel(id, e.target);
    });
    g.addEventListener("pointerout", function (e) {
      if (e.pointerType !== "mouse" || g.contains(e.relatedTarget)) return;
      if (activeId === id && selectedId === null) clearLabel();
    });

    g.addEventListener("click", function (e) {
      e.stopPropagation();
      if (lastPointer === "mouse") {
        showLabel(id, e.target);
        toggle(id);
      } else if (selectedId === id) {
        toggle(id);
      } else {
        showLabel(id, e.target);
        selectedId = id;
      }
    });

    g.addEventListener("focus", function () { showLabel(id, g); });
    g.addEventListener("blur", function () { if (activeId === id) clearLabel(); });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(id);
      } else if (e.key === "Escape") {
        g.blur();
        clearLabel();
      }
    });
  });

  document.addEventListener("click", clearLabel);
  window.addEventListener("resize", clearLabel);

  modeWeekBtn.addEventListener("click", function (e) { e.stopPropagation(); setMode("week"); });
  modeMonthBtn.addEventListener("click", function (e) { e.stopPropagation(); setMode("month"); });

  prevBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (mode === "month") stepMonth(-30);
    else goToWeek(Dates.addWeeks(viewedMonday, -1));
  });

  nextBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (mode === "month") {
      if (monthEnd < Dates.todayKey()) stepMonth(30);
    } else if (viewedMonday < currentMonday()) {
      goToWeek(Dates.addWeeks(viewedMonday, 1));
    }
  });

  // Pick up a new day/week if the app was left open.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) render();
  });
  window.addEventListener("focus", render);
  // Also catch midnight while the tab stays visible and idle.
  setInterval(function () {
    if (Dates.todayKey() !== lastToday) render();
  }, 60000);

  render();
})();
