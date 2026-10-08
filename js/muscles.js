// The 17 v1 muscle groups. region = which diagram view it's tapped on.

var MUSCLES = [
  { id: "chest",         label: "Chest",          region: "front", parentRegion: "chest" },
  { id: "anterior-delts", label: "Anterior delts", region: "front", parentRegion: "shoulders" },
  { id: "lateral-delts", label: "Lateral delts",  region: "front", parentRegion: "shoulders" },
  { id: "biceps",        label: "Biceps",         region: "front", parentRegion: "arms" },
  { id: "forearms",      label: "Forearms",       region: "front", parentRegion: "arms" },
  { id: "core",          label: "Core (abs)",     region: "front", parentRegion: "core" },
  { id: "obliques",      label: "Obliques",       region: "front", parentRegion: "core" },
  { id: "quads",         label: "Quads",          region: "front", parentRegion: "legs" },
  { id: "hip-flexors",   label: "Hip flexors",    region: "front", parentRegion: "legs" },

  { id: "traps",         label: "Traps",          region: "back",  parentRegion: "back" },
  { id: "rear-delts",    label: "Rear delts",     region: "back",  parentRegion: "shoulders" },
  { id: "lats",          label: "Lats",           region: "back",  parentRegion: "back" },
  { id: "lower-back",    label: "Lower back",     region: "back",  parentRegion: "back" },
  { id: "triceps",       label: "Triceps",        region: "back",  parentRegion: "arms" },
  { id: "glutes",        label: "Glutes",         region: "back",  parentRegion: "legs" },
  { id: "hamstrings",    label: "Hamstrings",     region: "back",  parentRegion: "legs" },
  { id: "calves",        label: "Calves",         region: "back",  parentRegion: "legs" }
];

var MUSCLE_BY_ID = {};
MUSCLES.forEach(function (m) { MUSCLE_BY_ID[m.id] = m; });
