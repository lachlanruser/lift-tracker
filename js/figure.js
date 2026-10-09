// Hand-built front/back figures. viewBox 0 0 200 460, centre line x = 100.
// Paired muscles are drawn on the left half and mirrored; both halves share
// one <g data-muscle> so they highlight and toggle together. Each muscle also
// gets a hidden "plan-dots" copy of its paths for the Plan overlay.

var Figure = (function () {
  var NS = "http://www.w3.org/2000/svg";
  var MIRROR = "translate(200 0) scale(-1 1)";

  // Neutral body: torso, arm and leg are mirrored; head and neck aren't.
  var BASE_SINGLE = [
    "M100,10 a16,20 0 1,1 0,40 a16,20 0 1,1 0,-40 Z",
    "M92,44 L108,44 L110,64 L90,64 Z",
    "M62,66 Q100,56 138,66 L142,110 L136,160 L138,200 L142,228 L58,228 L62,200 L64,160 L58,110 Z"
  ];
  var BASE_PAIRED = [
    "M62,66 Q44,68 42,92 L38,150 L32,226 L50,228 L58,158 L64,104 Z",   // arm
    "M40,226 Q50,228 50,240 Q48,254 40,254 Q32,252 31,240 Q31,228 40,226 Z", // hand
    "M58,222 L100,226 L99,330 L95,430 L71,430 L66,340 L59,262 Z",       // leg
    "M70,428 L96,428 Q98,446 88,448 L70,448 Q62,446 70,428 Z"           // foot
  ];

  // [id, path, paired]
  var FRONT = [
    ["lateral-delts",  "M62,68 Q58,80 57,95 Q50,96 45,92 Q45,72 62,68 Z", true],
    ["anterior-delts", "M63,68 Q74,65 82,70 Q70,78 67,99 Q61,99 58,95 Q58,80 63,68 Z", true],
    ["chest",          "M100,72 L100,110 Q86,116 72,108 Q66,96 70,82 Q78,70 100,72 Z", true],
    ["biceps",         "M48,97 Q56,99 63,102 Q64,126 58,148 Q50,151 43,146 Q42,120 48,97 Z", true],
    ["forearms",       "M44,154 Q52,152 58,155 Q57,182 50,222 Q42,224 35,220 Q36,184 44,154 Z", true],
    ["obliques",       "M71,113 Q78,117 84,119 L84,194 Q76,192 69,184 Q67,160 69,138 Q66,124 71,113 Z", true],
    ["core",           "M87,117 L113,117 L113,195 Q100,203 87,195 Z", false],
    ["hip-flexors",    "M85,204 Q95,208 100,214 L100,232 Q92,234 84,229 Q77,216 85,204 Z", true],
    ["quads",          "M62,224 Q72,214 82,232 L98,238 Q100,282 94,322 Q82,332 72,326 Q60,290 62,224 Z", true]
  ];

  var BACK = [
    ["traps",          "M100,52 L112,62 Q128,65 137,69 L115,78 L100,120 L85,78 L63,69 Q72,65 88,62 Z", false],
    ["rear-delts",     "M63,70 L83,78 Q72,90 59,97 Q51,96 45,92 Q45,74 63,70 Z", true],
    ["triceps",        "M48,98 Q56,100 63,103 Q64,126 58,148 Q50,151 43,146 Q42,120 48,98 Z", true],
    ["lats",           "M85,81 L98,124 L96,168 Q84,174 74,176 Q66,150 66,112 Q71,95 85,81 Z", true],
    ["lower-back",     "M84,170 Q100,163 116,170 L117,199 Q100,206 83,199 Z", false],
    ["glutes",         "M64,204 Q82,198 100,207 L100,240 Q86,252 70,244 Q60,226 64,204 Z", true],
    ["hamstrings",     "M65,251 Q82,257 98,251 Q100,290 94,322 Q82,332 72,326 Q62,290 65,251 Z", true],
    ["calves",         "M70,348 Q84,340 96,348 Q98,380 90,410 Q80,414 74,410 Q66,380 70,348 Z", true]
  ];

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function addPath(parent, d, paired, cls) {
    parent.appendChild(el("path", { d: d, "class": cls || "" }));
    if (paired) parent.appendChild(el("path", { d: d, "class": cls || "", transform: MIRROR }));
  }

  function build(view) {
    var svg = el("svg", {
      viewBox: "0 0 200 460",
      "class": "figure-svg",
      role: "group",
      "aria-label": view === "front" ? "Front view muscles" : "Back view muscles"
    });

    var base = el("g", { "class": "body", "aria-hidden": "true" });
    BASE_SINGLE.forEach(function (d) { addPath(base, d, false); });
    BASE_PAIRED.forEach(function (d) { addPath(base, d, true); });
    svg.appendChild(base);

    (view === "front" ? FRONT : BACK).forEach(function (row) {
      var m = MUSCLE_BY_ID[row[0]];
      var g = el("g", {
        "class": "muscle",
        "data-muscle": m.id,
        "data-state": "none",
        tabindex: "0",
        role: "button",
        "aria-label": m.label,
        "aria-pressed": "false"
      });
      addPath(g, row[1], row[2]);
      // Red-dot plan overlay above the colour fill; shown via data-planned.
      addPath(g, row[1], row[2], "plan-dots");
      svg.appendChild(g);
    });

    return svg;
  }

  return { build: build };
})();
