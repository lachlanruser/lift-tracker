// Wiring: week navigation, day strip, label reveal, and tap/click-to-log.
// Taps log to the day selected in the day strip (today by default).
// Mouse: hover shows the name, click toggles the selected day's log.
// Touch/pen: first tap selects + shows the name, tapping it again toggles.
// Keyboard: focus shows the name, Enter/Space toggles, Escape clears.

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

  var viewedMonday = currentMonday();
  var selectedDay = Dates.todayKey();
  var activeId = null;    // muscle whose label is showing
  var selectedId = null;  // touch selection (awaiting a second tap)
  var lastPointer = "mouse";

  function currentMonday() {
    return Dates.mondayOf(Dates.todayKey());
  }

  // Any day up to and including today can be edited.
  function editable() {
    return !Dates.isAfter(selectedDay, Dates.todayKey());
  }

  // Today for the current week, Sunday for past weeks.
  function defaultDayFor(monday) {
    return monday === currentMonday() ? Dates.todayKey() : Dates.addDays(monday, 6);
  }

  function dayText(day, today) {
    return day === today ? "today, " + Dates.formatDay(day) : Dates.formatDay(day);
  }

  function render() {
    var today = Dates.todayKey();
    var status = Stats.weekStatus(Store.logs(), viewedMonday, selectedDay);

    groups.forEach(function (g) {
      var id = g.getAttribute("data-muscle");
      g.setAttribute("data-state", status[id]);
      g.setAttribute("aria-pressed", status[id] === "day" ? "true" : "false");
      g.classList.toggle("is-active", id === activeId);
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

  function showLabel(id, target) {
    activeId = id;
    labelEl.textContent = MUSCLE_BY_ID[id].label;
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

  prevBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    goToWeek(Dates.addWeeks(viewedMonday, -1));
  });

  nextBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (viewedMonday >= currentMonday()) return;
    goToWeek(Dates.addWeeks(viewedMonday, 1));
  });

  // Pick up a new day/week if the app was left open.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) render();
  });
  window.addEventListener("focus", render);

  render();
})();
