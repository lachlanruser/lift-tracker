// Wiring: week navigation, label reveal, and tap/click-to-log.
// Mouse: hover shows the name, click toggles today's log.
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

  document.getElementById("figure-front").appendChild(Figure.build("front"));
  document.getElementById("figure-back").appendChild(Figure.build("back"));
  var groups = Array.prototype.slice.call(stage.querySelectorAll(".muscle"));

  var viewedMonday = currentMonday();
  var activeId = null;    // muscle whose label is showing
  var selectedId = null;  // touch selection (awaiting a second tap)
  var lastPointer = "mouse";

  function currentMonday() {
    return Dates.mondayOf(Dates.todayKey());
  }

  // Only the week containing today can be edited, and only today's log.
  function editable() {
    return viewedMonday === currentMonday();
  }

  function render() {
    var today = Dates.todayKey();
    var isCurrent = editable();
    var status = Store.weekStatus(viewedMonday, isCurrent ? today : null);

    groups.forEach(function (g) {
      var id = g.getAttribute("data-muscle");
      var state = status[id];
      if (!isCurrent && state === "week") state = "trained";
      g.setAttribute("data-state", state);
      g.setAttribute("aria-pressed", state === "today" ? "true" : "false");
      g.classList.toggle("is-active", id === activeId);
    });

    weekLabel.textContent = Dates.formatWeek(viewedMonday);
    weekSub.textContent = isCurrent
      ? "This week · logging for today, " + Dates.formatDay(today)
      : "Past week · view only";
    nextBtn.disabled = viewedMonday >= currentMonday();
    app.classList.toggle("view-only", !isCurrent);
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
    Store.toggle(Dates.todayKey(), id);
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
    clearLabel();
    viewedMonday = Dates.addWeeks(viewedMonday, -1);
    render();
  });

  nextBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (viewedMonday >= currentMonday()) return;
    clearLabel();
    viewedMonday = Dates.addWeeks(viewedMonday, 1);
    render();
  });

  // Pick up a new day/week if the app was left open.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) render();
  });
  window.addEventListener("focus", render);

  render();
})();
