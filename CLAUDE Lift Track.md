# Muscle Schedule Tracker — Project Brief

## Core idea
A visual strength-training tracker built around a clickable front/back muscle diagram. No pre-set plan for v1 — I log after the fact by tapping muscle groups I've trained each day, and at the end of the week I can see the diagram colour-coded by what was/wasn't trained, so I can judge for myself if I've neglected anything. I can also step back through previous weeks to see past splits.

## Muscle groups (v1, finalised)
**Front view:** Chest, Anterior delts, Lateral delts, Biceps, Forearms, Core (abs), Obliques, Quads, Hip flexors

**Back view:** Traps, Rear delts, Lats, Lower back, Triceps, Glutes, Hamstrings, Calves

Notes:
- Shoulders are split three ways: anterior and lateral delts tap on the front view, rear delt taps on the back view — they're logged as distinct groups, not merged into one "shoulders" tap.
- Calves are a single group (not split front/back) — shown on the back view.
- Core and obliques are separate tap targets, not combined.

## Diagram
- Front and back views (needed for posterior groups like hamstrings, glutes, back).
- Simple, clean illustration with clear colour states — minimal extra styling, not a detailed anatomical render.
- Muscle group names are NOT shown by default — the diagram stays clean/unlabelled at rest.
- On hover (or tap, for touch devices), the muscle group under the cursor highlights and its name label appears; move away/tap elsewhere and it reverts to unlabelled.
- A done/not-done colour layer shows which groups have been trained in the week currently being viewed — this colour state is always visible; only the text label is hover/tap-triggered.
- No "missed" judgement is built in — the diagram just shows trained vs. not trained for the week; I'll judge for myself whether that's a gap.

## Week navigation
- A dropdown or arrow control to step back one week at a time (and forward again toward the current week).
- Whichever week is selected, the diagram's colour layer updates to show that week's trained/not-trained state — same diagram, just re-coloured per week, not a separate list view.
- Defaults to the current week on open.

## Logging a session (v1)
- No pre-set plan — this is log-after-the-fact only.
- Just tap the muscle groups trained that day. No sets/reps/weight, no intensity rating — keep it to a tap.
- Tapping an already-logged group again toggles it back off (undo for mis-taps) — tap to log, tap again to un-log.
- Logging always applies to today's date (or the actual day the session happened, if logging retroactively — confirm this when building).

## Out of scope for v1
- Cardio tracking.
- Daily step tracking.
- Sets/reps/weight logging.
- Monthly or custom-range stats (start with the current week's done/not-done view only; longer-range stats can come later).
- Colour coding by recency or frequency — v1 is simple done/not-done for the week, not a gradient.

## Data model (v1, rough)
- `MuscleGroup`: id, label, region ("front" | "back"), parentRegion (e.g. "legs" for quads/hamstrings/glutes/calves)
- `SessionLog`: date, muscleGroupIds (tapped as trained)
- The weekly colour view is derived entirely from `SessionLog`, filtered to whichever week is currently selected via week navigation — no separate "plan" entity needed for v1.

## Build approach
- Platform: web app, local browser storage (consistent with the other project apps).
- Model workflow: `/model opusplan` — plan on Opus, build on Sonnet.
- Plan mode before writing code.
- One working slice first: diagram (front/back, tap-to-log, hover-to-reveal labels) + week navigation + colour-coded trained/not-trained view — before anything else.
- Commit to git at each working stage.
- After the first working version: ask Claude to review its own work for gaps before adding more features.

## Streak / consistency
No streak mechanic for v1 — the weekly done/not-done view is the only consistency signal for now.

## Open decisions to confirm while building
- How week boundaries work (calendar week vs. a rolling 7 days) for the done/not-done view.
- SVG/diagram source: hand-drawn, generated, or licensed asset.
- Exact tap/hover behaviour on touch devices (e.g. does a tap both reveal the label AND log the group, or does logging need a separate confirm step so you don't mis-tap).

## Decisions made (v1 + V2)
- **Week boundary:** calendar week, Mon–Sun, local time.
- **Diagram:** hand-built simple SVG, one shape per muscle group; left/right sides share one tap target.
- **Touch:** first tap selects + shows the name; tapping the selected muscle again toggles it. Mouse: hover shows the name, click toggles. Keyboard: focus shows the name, Enter/Space toggles, Escape clears.
- **Day strip (V2):** Mon–Sun chips under the week nav. Taps log to the selected day. Any past or present day in any week is editable; future days are disabled. Defaults: today in the current week, Sunday when stepping to a past week.
- **Week colours:** strong green = logged on the selected day; light green = trained on another day that week; grey = not trained that week.
- **Month view (V2):** Week/Month toggle. Read-only. Rolling 30-day window (today + 29 days before); ‹ › step 30 days, › stops at today.
- **Month bands (V2):** fixed day counts — 0 (hatched grey), 1, 2–3, 4–5, 6–8, 9+. Multi-hue coral → gold → green → blue → violet (warm = under-trained), palette validated for colour-blind separation in light and dark. Hover/tap shows "Name · N days".
- **Tests:** open `tests/index.html` (via the local server) — covers week boundaries, the 30-day window and days with no data.
