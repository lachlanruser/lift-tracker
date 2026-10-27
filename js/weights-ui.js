// Weights overview: a read-only panel listing every muscle's latest weight
// and when it last went up (a new best), colour-banded by how long ago:
// green 0–14 days, amber 15–27, red 28+. The date and day count are always
// shown too, so colour is never the only signal.

(function () {
  var dialog = document.getElementById("weights-dialog");
  var rows = document.getElementById("weights-rows");
  var openBtn = document.getElementById("weights-open");
  var closeBtn = document.getElementById("weights-close");

  var BAND_TEXT = {
    green: "green band, 14 days or less",
    amber: "amber band, 15 to 27 days",
    red: "red band, 28 days or more"
  };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function ageText(days) {
    if (days === 0) return "today";
    return days + " d";
  }

  function build() {
    var today = Dates.todayKey();
    rows.textContent = "";
    MUSCLES.forEach(function (m) {
      var s = Weights.summary(Store.logs(), Store.weights(), m.id, today);
      var tr = el("tr");
      tr.appendChild(el("th", null, m.label)).setAttribute("scope", "row");

      if (!s) {
        tr.appendChild(el("td", "num wd-empty", "–"));
        var none = tr.appendChild(el("td", "wd-empty", "–"));
        none.appendChild(el("span", "sr-only", " no weight logged yet"));
        rows.appendChild(tr);
        return;
      }

      tr.appendChild(el("td", "num", s.latest + " kg"));
      var cell = el("td", "wd-bump");
      cell.appendChild(el("span", "band-dot band-" + s.band)).setAttribute("aria-hidden", "true");
      var date = Dates.formatShort(s.bumpDay, today);
      cell.appendChild(el("span", null, (s.kind === "up" ? "↑ " : "since ") + date));
      cell.appendChild(el("span", "wd-age", " · " + ageText(s.days)));
      cell.appendChild(el("span", "sr-only",
        " (" + (s.kind === "up" ? "last increased" : "first logged") + ", " + BAND_TEXT[s.band] + ")"));
      tr.appendChild(cell);
      rows.appendChild(tr);
    });
  }

  function open(e) {
    if (e) e.stopPropagation();
    build();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function close() {
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      openBtn.focus();
    }
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  // Fires for the ✕, Escape and backdrop alike: return focus to the button.
  dialog.addEventListener("close", function () { openBtn.focus(); });
  // Clicking the backdrop (outside the panel's box) closes it.
  dialog.addEventListener("click", function (e) {
    e.stopPropagation();
    if (e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) close();
  });
})();
