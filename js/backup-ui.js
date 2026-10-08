// Backup panel: Export (download), Import (merge from file), and — in
// browsers with the File System Access API (Chrome/Edge) — auto-backup that
// rewrites a file you picked after every change. Elsewhere (Safari/Firefox)
// it shows how long since the last backup and nudges after a week.

(function () {
  var NUDGE_DAYS = 7;
  var FILE_NAME = "lift-tracker-backup.json";

  var statusEl = document.getElementById("backup-status");
  var autoBtn = document.getElementById("backup-auto");
  var exportBtn = document.getElementById("backup-export");
  var importBtn = document.getElementById("backup-import");
  var fileInput = document.getElementById("backup-file");
  var panel = document.getElementById("backup");

  var autoSupported = typeof window.showSaveFilePicker === "function" && !!window.indexedDB;
  var handle = null;      // FileSystemFileHandle for auto-backup
  var autoState = "off";  // "off" | "on" | "paused"
  var message = "";       // one-off result text (import/export)
  var writeTimer = null;

  // Ask the browser not to evict our storage under pressure (and Safari's
  // 7-day cleanup). Silent; harmless if refused or unsupported.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function () {});
  }

  // ---------------------------------------------------------- IndexedDB (handle only)

  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      var open = indexedDB.open("liftTracker", 1);
      open.onupgradeneeded = function () { open.result.createObjectStore("kv"); };
      open.onerror = function () { reject(open.error); };
      open.onsuccess = function () {
        var db = open.result;
        try {
          var tx = db.transaction("kv", mode);
          var req = fn(tx.objectStore("kv"));
          tx.oncomplete = function () { db.close(); resolve(req && req.result); };
          tx.onerror = function () { db.close(); reject(tx.error); };
        } catch (e) {
          db.close();
          reject(e);  // e.g. a value that can't be stored
        }
      };
    });
  }

  function saveHandle(h) { return idb("readwrite", function (s) { return s.put(h, "backupHandle"); }); }
  function loadHandle() { return idb("readonly", function (s) { return s.get("backupHandle"); }); }

  // ---------------------------------------------------------- status

  function ago(iso) {
    if (!iso) return null;
    var mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + " min ago";
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
    var days = Math.floor(hours / 24);
    return days + (days === 1 ? " day ago" : " days ago");
  }

  function daysSince(iso) {
    return iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : Infinity;
  }

  function renderStatus() {
    var last = Store.lastBackupAt();
    var text, nudge = false;

    if (autoState === "on") {
      text = "Auto-backup on · " + handle.name + (last ? " · saved " + ago(last) : "");
    } else if (autoState === "paused") {
      text = "Auto-backup paused — the browser needs permission again. Click Resume.";
      nudge = true;
    } else if (!last) {
      text = Store.isEmpty() ? "No backups yet." : "Not backed up yet.";
      nudge = !Store.isEmpty();
    } else {
      text = "Last backup " + ago(last) + ".";
      nudge = !Store.isEmpty() && daysSince(last) >= NUDGE_DAYS;
    }
    if (nudge && autoState !== "paused") text += " Export a backup to keep your logs safe.";
    if (message) text += " " + message;

    statusEl.textContent = text;
    panel.classList.toggle("needs-backup", nudge);

    autoBtn.hidden = !autoSupported;
    autoBtn.textContent = autoState === "on" ? "Change backup file"
      : autoState === "paused" ? "Resume auto-backup"
      : "Set up auto-backup";
  }

  // ---------------------------------------------------------- auto-backup

  function writeNow() {
    if (!handle) return Promise.resolve();
    return handle.queryPermission({ mode: "readwrite" }).then(function (perm) {
      if (perm !== "granted") {
        autoState = "paused";
        renderStatus();
        return;
      }
      return handle.createWritable().then(function (w) {
        return w.write(Backup.serialize(Store.logs())).then(function () { return w.close(); });
      }).then(function () {
        autoState = "on";
        Store.markBackedUp();
        renderStatus();
      });
    }).catch(function () {
      autoState = "paused";
      renderStatus();
    });
  }

  function scheduleWrite() {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(writeNow, 600);
  }

  function setUpAuto() {
    window.showSaveFilePicker({
      suggestedName: FILE_NAME,
      types: [{ description: "Lift Tracker backup", accept: { "application/json": [".json"] } }]
    }).then(function (h) {
      handle = h;
      message = "";
      return saveHandle(h).catch(function () {}).then(writeNow);
    }).catch(function () {
      // Picker cancelled — nothing to do.
    });
  }

  function resumeAuto() {
    handle.requestPermission({ mode: "readwrite" }).then(function (perm) {
      if (perm === "granted") writeNow();
    });
  }

  autoBtn.addEventListener("click", function () {
    if (autoState === "paused") resumeAuto();
    else setUpAuto();
  });

  // ---------------------------------------------------------- export / import

  exportBtn.addEventListener("click", function () {
    var blob = new Blob([Backup.serialize(Store.logs())], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "lift-tracker-backup-" + Dates.todayKey() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    Store.markBackedUp();
    message = "";
    renderStatus();
  });

  importBtn.addEventListener("click", function () {
    fileInput.value = "";
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var result = Backup.parse(text);
      var added = Store.mergeIn(result.logs);
      document.dispatchEvent(new Event("logs-imported"));
      message = "Imported " + result.days + (result.days === 1 ? " day" : " days") + " — " +
        (added ? added + " new " + (added === 1 ? "entry" : "entries") + " added." : "nothing new, already up to date.") +
        (result.skipped ? " (" + result.skipped + " unrecognised item(s) skipped.)" : "");
      renderStatus();
    }).catch(function (e) {
      message = "Import failed: " + e.message;
      renderStatus();
    });
  });

  // ---------------------------------------------------------- wiring

  Store.onChange(function () {
    message = "";
    if (handle && autoState !== "off") scheduleWrite();
    else renderStatus();
  });

  setInterval(renderStatus, 60000);

  renderStatus();
  if (autoSupported) {
    loadHandle().then(function (h) {
      if (!h) return;
      handle = h;
      autoState = "paused";
      return writeNow();
    }).catch(function () {});
  }
})();
