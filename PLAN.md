# best-game-01 — JOINT PLAN (adopted 2026-11-16 ~19:05Z)

## Bounty (verified)
- best-game-01, "Make the best game", $1,000 (1st $400, 2nd $200, 3rd $120, 4th–10th $40).
- Deadline 2026-11-18T18:00:00Z. 7,704 submissions, 4,864 ranked. Published 2026-11-15T18:00Z.
- Judge: AI (superbot, high effort) compares two entries by (a) a JPEG contact sheet of the
  screenshots (cover large on top, rest small beneath) and (b) a short source outline (1,536
  tokens/entry). The judge sees the game MOSTLY through its screenshots.
- Criteria, most important first: (1) complete game (goal, rules, controls, win/lose/score,
  start, restart, HUD — all shown in screenshots); (2) fun/depth; (3) feel/polish;
  (4) look/originality; (5) structure (one clear job per file, named for what it does).
  "The first criterion on which the two entries differ decides, unless a later one differs
  by much more." >4 in 5 judge reasons named a start, title, end or restart screen.
  Text addressed to the judge (in a screenshot or source) is allowed.
- Dev: 12 games vs fixed house games (24 calls), +8 if interval high reaches the money line;
  top 100 also play up to 8 games vs each other. Final: screen at place 40, Swiss + racing +
  playoff (top 12). Score = Bradley-Terry win rate.
- Caps: 3–4 screenshots, each ≤256 KiB, long side ≤1280, short side ≥480; game/ ≤993 files,
  ≤48 MiB; dossier text ≤163,840 bytes. Starter handed in unchanged = 2nd house game (weak).

## Top-10 bar (leaderboard 2026-11-16 18:45Z, 20 matches each)
- #1 LANTERNWAKE 20-0-0 (100%), #2 SUNWRIGHT 19-1-0 (97.5%), #3 CINDERLINE 17-3-0 (92.5%),
  #4 MARGINALIA 15-3-2 (82.5%), #5 TIDEGLASS 14-3-3 (77.5%), #10 CYTOGUARD 14-4-2 (80%),
  #20 Fair Glyph 10-4-6 (60%). Top-10 bar ≈ 75–80% win rate; top-20 ≈ 60%.
- Pattern: 4 of top 5 involve LIGHT (lantern, sunbeam, illumination, moonlight). Tower defence
  in #2, #5, #13, #16, #24. Every top entry writes WIN/LOSE on screen, has a dense complete
  HUD, a title screen stating the goal in one sentence + controls, and a high-contrast
  coherent palette. Original one-word names.

## Multi-model input (note on method)
- External models (Gemini/DeepSeek/GLM) could NOT be consulted during planning: this subagent
  has no live-browser access, and those models are reached via browser tasks by the parent.
  Instead, two independent subagent evaluators were run in parallel with the full context.
- Agent 1 (evaluator) picked GALEKITE (kite game), predicted 55–70%.
- Agent 2 (red-team) rated GALEKITE WEAK (near-fatal), POSTHASTE WEAK, SIMMER STRONG; picked
  SKEWERFEST (improved cooking), predicted 65–78%.
- ADOPTED: SKEWERFEST. Deciding reason: the judge reads still screenshots. A cooking stall's
  density (orders, grill, customers, patience, coins, combo) is inherently visible in one frame;
  a kite's depth (wind, tension) is dynamic and does not photograph. SKEWERFEST's predicted
  range (65–78%) is also higher and closer to the 75–80% top-10 bar.

## The game: SKEWERFEST
- One-sentence goal: "Grill the right skewers over live coals and serve the festival crowd
  before closing time."
- WIN: Serve the night's target before closing — keep walkaways under 5.
  LOSE: 5 hungry customers storm off, or a night's target is missed at closing.
- Core loop (mouse + Space): read a ticket (icon-only, no text wall) → click ingredient bins
  to build a skewer (2–3 ingredients) → click a grill slot to place it → watch doneness rise,
  serve in the golden window (50–90%) → click the matching customer to serve → coins + tip +
  combo. Fan (Space / button) to stoke the coals; heat decays (wind Night 2, rain Night 3).
  Undercooked = returned, overcooked (>90%) = burnt, discard. Patience empties = walkaway.
- Depth: heat skill (coals cool; fan to stoke; wind/rain cool one side; burn risk at high heat);
  6 recipes across 3 nights (2–3 ingredients each); 4 customer types (Runner short patience,
  Regular known favourite big tip, Family 2 orders, Critic Night 3 perfect-only huge score);
  economy: coins buy ONE upgrade between nights (Bigger Grill +2 slots, Brass Fan heat holds
  longer, Patience Charm +20% patience, Spice Kit +50% tip, Second Rack +1 grill slot);
  escalation: Night 1 target 8 in 90s, Night 2 target 12 in 105s + wind, Night 3 target 16
  in 120s + rain + Critic; rush hour mid-night doubles spawn rate.
- Nights: 1/2/3, each with a target and a closing timer. Win the game by completing all 3.
  Lose: 5 walkaways cumulative, or a night target missed at closing.
- Controls: mouse (bins, grill, customers, fan, upgrades); Space = fan; P = pause; R = restart;
  M = mute; 1–5 = ingredient bins.
- Sound: WebAudio synth (sizzle, ding, chime, angry sting, pop). No assets. Mute toggle.
- Palette (distinct from top 5 navy/purple/desert): charcoal #1E1A17, vermilion #E63B2E
  (awning), jade #2EC4A6, cream #FFF3D6, gold #FFC53D (coins/combo), ember orange #FF6B2C
  (coals). Bold flat vector, thick outlines.

## Screenshots (4, 1280x720, JPEG q85, each ≤256 KiB)
- 01-play.jpg (cover, large): Night 2 rush mid-play — grill with 5 skewers at different
  doneness, 4 customers with large patience bars, 3 order tickets, coins/combo/timer/heat
  gauge all legible.
- 02-title.jpg: big SKEWERFEST title, one-sentence goal + WIN/LOSE lines, control reference,
  best score, CLICK TO BEGIN.
- 03-rush.jpg: Night 3 rain + Critic, heat low, one burnt skewer, combo 6x banner — tension
  and the lose condition approaching.
- 04-results.jpg: WIN results screen — orders served, coins, best combo, accuracy, PLAY AGAIN.
- All staged deterministically via ?shot= + seed (autopilot in shots.js), real renders in
  headless Chromium (playwright-core, already installed and validated on the starter).

## HUD (every element)
- Top bar: coins, Night 1/2/3, orders served/target (e.g. 14/24), walkaways 2/5, time to
  closing, score. Centre: grill heat gauge (large, colour-coded), combo banner. Each customer:
  face, patience bar, ticket icons. Bottom: ingredient bins, fan button + Space key, upgrade hint.

## Source structure (game/src/, one clear job each)
- main.js — boot, game loop, state machine (title/play/paused/night-shop/over)
- config.js — tuning + palette (single place)
- random.js — seeded RNG (reuse starter pattern)
- state.js — run state: nights, economy, win/lose, score, best
- grill.js — heat, doneness, grill slots
- orders.js — recipes, tickets
- customers.js — spawning, patience, customer types
- render.js — draw stall, customers, HUD, screens
- input.js — mouse + keyboard
- audio.js — WebAudio synth, no assets
- shots.js — autopilot staging start/play/rush/end scenes deterministically
- index.html + style.css — canvas mount, full-screen
- main.ts (root, written fresh) — copy game/ + screenshots/ to /output, build dossier.json
- serve.ts (root, written fresh) — dev static server for game/
- shots.json — 4 shots mapping name -> ?shot= query

## Risks + mitigations
- "Another diner game" on originality (criterion 4): lead with the heat mechanic (glowing coal
  bed + fan is the visual signature), the 3-night festival, named regulars, and the distinct
  vermilion/jade/cream palette — not a generic counter.
- Cluttered stall unreadable when shrunk: limit to 4 customers + 3 tickets, huge patience bars,
  icon-only tickets; test the actual contact-sheet shrink before submitting — if the play shot
  is not readable at half size, cut clutter, do not add more.
- Scope: 3 nights + upgrade shop + autopilot is ambitious for ~24h. Keep the shop to 3 cards
  (pick 1), keep recipes to 6, and keep the autopilot greedy/simple. A finished, tested entry
  beats an unfinished ambitious one.

## Predicted dev win-rate
- 65–78% (red-team). Beats the weak starter/house games on completeness, readable HUD and
  escalating depth; capped below the 75–80% top-10 bar by generic-cooking originality and the
  strong TD depth in the peer pool, unless the heat + festival execution is excellent.
- Honest top-10 chance: low-to-moderate (~10–20%). Top-20 is the realistic aim.
