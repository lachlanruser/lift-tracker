# Muscle Schedule Tracker — Project Brief

## Core idea
A visual strength-training tracker built around a clickable front/back muscle diagram. No pre-set plan for v1 — I log after the fact by tapping muscle groups I've trained each day, and at the end of the week I can see the diagram colour-coded by what was/wasn't trained, so I can judge for myself if I've neglected anything. I can also step back through previous weeks to see past splits.

## Muscle groups (current — 19 groups)
**Front view:** Chest, Anterior delts, Lateral delts, Biceps, Brachialis, Brachioradialis, Inner forearm, Core (abs), Obliques, Quads, Hip flexors

**Back view:** Traps, Rear delts, Lats, Lower back, Triceps, Glutes, Hamstrings, Calves

Notes:
- Shoulders are split three ways: anterior and lateral delts tap on the front view, rear delt taps on the back view — they're logged as distinct groups, not merged into one "shoulders" tap.
- Calves are a single group (not split front/back) — shown on the back view.
- Core and obliques are separate tap targets, not combined.
- Upper arm (front): Biceps, plus Brachialis as a narrow outer strip from mid upper arm to the elbow (V5).
- Forearm (front): the old single "Forearms" group was split in V5 into Brachioradialis (outer, thumb-side strip from the elbow down the upper forearm) and Inner forearm (the rest). Old "Forearms" data was moved to Inner forearm.

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

## Plan tab (V3)
A third tab, Plan, sits next to Week and Month. It holds the split I've planned for the week.

- Default is no plan. Until I configure it, every day is empty and the Week view looks exactly as it does now.
- Configuring: the Plan tab uses the same front/back diagram and Mon–Sun day strip. I select a day and tap muscles to toggle them as planned for that day (tap again to remove), the same interaction as logging.
- Planned look: planned muscles show a red dotted graphic (a dotted pattern, not just a colour). Hover/tap still reveals the muscle name, and the diagram stays unlabelled at rest.
- Week view link: when a day is selected in the Week view's day strip, that day's planned muscles show the red dotted graphic, even before anything is logged. The dots stay on all day. Once a muscle is logged, the trained colour fills in underneath the dots, so I can see the plan was met. Logging works exactly as before.
- Weekly carry-forward: when a new week starts, if the previous week had a plan, it is copied automatically as the new week's default. The copy is stored as that week's own plan, not a reference to last week's, so editing it never changes history. If the previous week had no plan, the new week starts empty.
- Editing rules: only the current week's plan is editable, including days already passed in that week. A new week's copied plan becomes editable when that week starts. Past weeks' plans are locked as history and viewable read-only by stepping back with week navigation.
- Month view: unchanged. The plan does not affect the 30-day counts.
- Out of scope for V3: no "missed" scoring or alerts, no plan templates or named splits, no editing future weeks in advance.

## Cardio tick and weights (V4)
This update adds exactly two features. Nothing else.

**1. Cardio tick**
- Every day has a tick to mark that cardio was completed. It toggles on and off (undo for mis-taps).
- Works on any editable day in the Week view, and is saved with the rest of the data.
- Placement: a "Cardio" toggle button for the selected day in the Week view, plus a small marker on day-strip chips for days with cardio.

**2. Weight per muscle group (optional)**
- When logging a muscle group, I can optionally enter a weight, in kg (decimals allowed). No reps, no rep range, no exercise list.
- Placement: a weight box beside the muscle's name label in the Week view, shown for muscles logged on the selected day.
- Carry-forward: once a weight has been entered for a muscle group, it pre-fills that muscle group's weight in the following weeks until I change it. A new value then becomes the default going forward, and this repeats.
- The default is the most recently dated weight entered for that muscle group. Editing an older day doesn't override a newer entry.
- When I log a muscle, its pre-filled weight is saved with that day's log (so history shows what was lifted that day).
- Weight memory (changed in V5): un-ticking a muscle keeps that day's weight. Re-ticking the same day brings the weight back; a later day pre-fills from the most recently dated weight, including weights on days I un-ticked. I can still change the pre-filled value.
- A pre-filled or remembered weight never marks a muscle as trained. Only tapping a muscle logs it.

## Arm splits, weight memory and weights overview (V5)
**1. Brachialis** — new front-view tap target (outer strip, mid upper arm to elbow), with its own label, logging, week colouring, Month count, plan dots and weight.

**2. Forearm split** — "Forearms" becomes Brachioradialis + Inner forearm (front view). Existing forearm ticks, plans and weights move to Inner forearm automatically on load and when importing older backups.

**3. Weight memory fix** — previously un-ticking deleted that day's weight, so re-ticking lost it. Now the app always remembers the last weight entered for each muscle and offers it as a pre-filled suggestion (see V4 weight rules above).

**4. Weights overview** — a "Weights" button (above the Backup panel) opens a read-only panel with a table:
- One row per muscle (diagram order): muscle · latest weight (kg) · last bump.
- Latest weight = the weight on the most recent day that muscle was ticked. Only ticked days count; remembered weights on un-ticked days are ignored here.
- Last bump = the last day the weight beat that muscle's previous best (shown "↑ 22 Oct"). A deload, or climbing back to an old best, doesn't reset it — only a new best does. A muscle with only one weight counts from that first weight (shown "since 20 Oct").
- Colour bands by days since the bump: green 0–14, amber 15–27, red 28+, with a legend. The date and day count ("· 5 d") are always shown, so colour isn't the only signal.
- Muscles with no weight show "–".
- Closes with the ✕, Escape or tapping outside. Uses the app's existing colours (plus an amber token) and styles.

## Data model (v1, rough)
- `MuscleGroup`: id, label, region ("front" | "back"), parentRegion (e.g. "legs" for quads/hamstrings/glutes/calves)
- `SessionLog`: date, muscleGroupIds (tapped as trained)
- The weekly colour view is derived entirely from `SessionLog`, filtered to whichever week is currently selected via week navigation — no separate "plan" entity needed for v1.
- V3 adds `PlanEntry`: weekStartDate, dayOfWeek, muscleGroupIds — stored per week. `SessionLog` is unchanged.
- V4 adds `CardioDay`: date (cardio completed) and `WeightEntry`: date, muscleGroupId, weightKg.
- V5: a `WeightEntry` is kept when the muscle is un-ticked that day (remembered for pre-fill); only entries on ticked days count as training history (weights overview). The overview's latest weight and last bump are derived from `SessionLog` + `WeightEntry` — nothing extra is stored.
- Stored as one localStorage object: `{ logs, plans, cardio, weights }`.

## Build approach
- Platform: web app, local browser storage (consistent with the other project apps).
- Model workflow: `/model opusplan` — plan on Opus, build on Sonnet.
- Plan mode before writing code.
- One working slice first: diagram (front/back, tap-to-log, hover-to-reveal labels) + week navigation + colour-coded trained/not-trained view — before anything else.
- Commit to git at each working stage.
- After the first working version: ask Claude to review its own work for gaps before adding more features.
- Build slices:
  (1) v1 core loop — front/back diagram, tap-to-log, hover labels, week navigation, trained/not-trained colours.
  (2) V2 day strip — edit any past or present day.
  (3) V2 Month view — read-only 30-day frequency view.
  (4) V3 Plan tab, with the Week view link and weekly carry-forward.
  (5) V4 cardio tick and optional weight per muscle group, with weight carry-forward.
  (6) V5 Brachialis, forearm split (Brachioradialis + Inner forearm), weight memory fix, weights overview panel.

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
- **Month bands (V2):** fixed day counts — 0 (hatched grey), 1, 2–3, 4–5, 6–8, 9+. Shades of a single green (light → dark = more days; flipped in dark mode) — easier to read at a glance than the earlier multi-hue version. Hover/tap shows "Name · N days" for exact counts.
- **Midnight rollover:** if the app stays open past midnight, a selection that was on "today" moves to the new today (and the new week on Sunday→Monday). Deliberately chosen past days are kept.
- **Backup:** Export (downloads a dated `.json`) and Import (merges — nothing existing is removed; unknown muscles/bad dates are skipped). In Chrome/Edge, auto-backup rewrites a file you pick after every change (put it in OneDrive for a cloud copy); after a browser restart it shows "paused" until you click Resume. Safari/Firefox can't auto-save to a file, so the panel shows "Last backup N days ago" and nudges after 7 days. The app also requests persistent storage. Each browser keeps its own logs — use the backup file to move between them.
- **Tests:** open `tests/index.html` (via the local server, or directly from disk) — covers week boundaries, the 30-day window, days with no data, midnight rollover, plan carry-forward, weight carry-forward and memory, cardio, backups, the forearm migration, and the weights overview (day counts, bands, bump/deload rules).
- **Plan tab (V3):** tabs are Week · Month · Plan. Week and Plan share the viewed week and selected day (a future day picked in Plan falls back to today in Week). Same mouse/touch/keyboard interaction as logging. Only the current week's plan is editable (all 7 days); past weeks are view-only.
- **Plan storage (V3):** `plans` = { weekMonday: { dayIndex 0–6 (Mon–Sun): [muscleIds] } }, saved alongside `logs`. A week record with no muscles means "cleared — don't refill".
- **Carry-forward (V3):** on open and at a new week, the latest stored plan (if not empty) is copied into every week up to and including the current one that has no record — so skipped weeks are filled too. Each copy is independent. Copies are taken when the new week starts, so mid-week edits carry forward. Existing records (including cleared ones) are never overwritten.
- **Plan look (V3):** small red dots over the muscle's normal colour, so grey / light green / strong green still read underneath. In Week view, the "Planned" legend item only appears once that week has a plan. The Plan tab shows only the plan (no logged colours), and its day strip marks days that have a plan with a red dot.
- **Backups (current):** Export (format version 3) includes logs, plans, cardio and weights. Import brings in logged-workout data only — logs and cardio are combined, weights fill in only where missing (never overwrite) — and ignores plans, which are set up manually on each device. Older backups (v1/v2, and files with the old "forearms" group) still import.
- **Weights overview (V5):** "Weights" button above Backup opens a read-only panel; bump = new best for that muscle; one weight = "since" its first log; bands green 0–14 / amber 15–27 / red 28+ days, with date and day count always shown.
