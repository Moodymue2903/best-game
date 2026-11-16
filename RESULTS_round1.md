# best-game-01 — SKEWERFEST, round 1 (built, tested, NOT submitted)

## Bounty facts (verified 2026-11-16 18:42Z)
- best-game-01, "Make the best game", $1,000 pot (1st $400, 2nd $200, 3rd $120, 4th–10th $40).
- Deadline **2026-11-18T18:00:00Z**. Published 2026-11-15T18:00:00Z. 7,704 submissions, 4,864 ranked.
- Deliverables: public GitHub repo (created after the opening, OSI license), main.ts (Node 22)
  at root, vendor/makefun-game.ts unchanged, game/ (static files, index.html plays offline in
  desktop Chrome), 3–4 screenshots under screenshots/ (real renders), AI agent transcripts.
- Caps: screenshots 3–4, each ≤256 KiB, long side ≤1280, short side ≥480; game/ ≤993 files,
  ≤48 MiB; dossier text ≤163,840 bytes; at most 5 submissions/day, 10 in all.

## How it is graded (the judge — the whole game)
- An AI judge (superbot, high effort) compares two entries by (a) ONE JPEG contact sheet of
  the screenshots (cover large on top, rest small beneath) and (b) a short source outline
  (1,536 tokens/entry). The judge sees the game MOSTLY through its screenshots.
- Criteria, most important first: (1) complete game (goal, rules, controls, win/lose/score,
  start, restart, HUD — all shown in screenshots); (2) fun/depth; (3) feel/polish;
  (4) look/originality; (5) structure (one clear job per file, named for what it does).
  "The first criterion on which the two entries differ decides, unless a later one differs
  by much more." >4 in 5 judge reasons named a start, title, end or restart screen.
  Text addressed to the judge (in a screenshot or source) is allowed.
- Dev: 12 games vs fixed house games (24 calls), +8 if interval high reaches the money line;
  top 100 also play up to 8 games vs each other. Final: screen at place 40, Swiss + racing +
  playoff (top 12). Score = Bradley-Terry win rate.
- The kit starter ("Block Dodger") handed in unchanged = the 2nd of the 4 fixed house games
  (a known weak benchmark).

## Top-10 bar (leaderboard 2026-11-16 18:45Z, 20 matches each)
- #1 LANTERNWAKE 20-0-0 (100%), #2 SUNWRIGHT 19-1-0 (97.5%), #3 CINDERLINE 17-3-0 (92.5%),
  #4 MARGINALIA 15-3-2 (82.5%), #5 TIDEGLASS 14-3-3 (77.5%), #10 CYTOGUARD 14-4-2 (80%),
  #20 Fair Glyph 10-4-6 (60%). Top-10 bar ≈ 75–80% win rate; top-20 ≈ 60%.
- Pattern: 4 of top 5 involve LIGHT (lantern, sunbeam, illumination, moonlight). Tower defence
  in #2, #5, #13, #16, #24. Every top entry writes WIN/LOSE on screen, has a dense complete
  HUD, a title screen stating the goal in one sentence + controls, and a high-contrast
  coherent palette. Original one-word names. Top-5 covers inspected as images (saved in
  /tmp/top-shots/): warm gold vs dark blue/purple, dense HUDs, win/lose written on screen.

## Multi-model input (method note — read this)
- External models (Gemini/DeepSeek/GLM) could NOT be consulted during planning: this subagent
  has no live-browser access, and those models are reached via browser tasks by the parent.
  Instead, two independent subagent evaluators were run in parallel with the full context.
- Agent 1 (evaluator) picked GALEKITE (kite game), predicted 55–70%.
- Agent 2 (red-team) rated GALEKITE WEAK (near-fatal — wind/tension do not photograph in a
  still screenshot), POSTHASTE WEAK, SIMMER STRONG; picked SKEWERFEST (improved cooking),
  predicted 65–78%.
- ADOPTED: SKEWERFEST. Deciding reason: the judge reads still screenshots. A cooking stall's
  density (orders, grill, customers, patience, coins, combo) is inherently visible in one
  frame; a kite's depth is dynamic and does not photograph. The parent's 3-model audit (before
  submission) is the external-model check that planning could not do from this subagent.

## The game: SKEWERFEST
- Goal: "Grill the right skewers over live coals and serve the festival crowd before closing
  time." WIN: Serve the night's orders before closing — keep walkaways under 5. LOSE: 5 hungry
  customers storm off, or closing comes first.
- Core loop (mouse + Space): read a ticket (icon-only) → click ingredient bins to build a
  skewer (2–3 ingredients) → click a grill slot to place it → watch doneness rise, serve in
  the golden window (50–90%, perfect 60–80% = 1.5x) → click the matching customer to serve →
  coins + tip + combo. Fan (Space/button) to stoke the coals; heat decays (wind Night 2, rain
  Night 3). Undercooked = returned, overcooked (>95%) = burnt, discard. Patience empties =
  walkaway (combo breaks).
- Depth: heat skill; 6 recipes across 3 nights; 4 customer types (Runner, Regular, Family
  2 orders, Critic Night 3 perfect-only); economy — coins buy ONE upgrade between nights
  (Bigger Grill +2 slots, Brass Fan, Patience Charm, Spice Kit, Quick Coals); escalation —
  Night 1 target 8 in 90s, Night 2 target 12 in 105s + wind, Night 3 target 16 in 120s + rain
  + Critic; rush hour mid-night doubles spawn rate.
- Palette (distinct from top 5 navy/purple/desert): charcoal #1E1A17, vermilion #E63B2E,
  jade #2EC4A6, cream #FFF3D6, gold #FFC53D, ember orange #FF6B2C. Bold flat vector.
- Sound: WebAudio synth (sizzle, chime, perfect arpeggio, walkaway sting, fan noise). No assets.
- Source: game/src/ — config, random, orders, grill, customers, state, render, input, audio,
  shots, main (one clear job each, named for what they do). main.ts + serve.ts written fresh.
  vendor/makefun-game.ts is the kit's copy, unchanged.

## Screenshots (4, 1280x720, JPEG q85, all ≤256 KiB)
- 01-play.jpg (cover, 115,205 B): Night 2 rush — 4 skewers cooking (one READY), 3 customers
  with patience bars + tickets, COMBO x5, heat 64%, WIN/LOSE in the grill header.
- 02-title.jpg (77,031 B): big gold SKEWERFEST, one-sentence goal, WIN/LOSE lines, controls,
  CLICK TO BEGIN.
- 03-rush.jpg (115,784 B): Night 3 rain + Critic (14s), 3 skewers (incl. Festival Mixed),
  PERFECT! +41 toast, 13/16 orders.
- 04-results.jpg (41,213 B): WIN — "FESTIVAL COMPLETE!", 36 orders, 1956 coins, best combo x5,
  perfect serves 36, burnt 0, walkaways 0/5.
- All staged deterministically via ?shot= + seed=1 (autopilot plays the real rules) and
  captured in headless Chromium (playwright-core, installed for this task).

## Local test results (commands run + raw output)
- Syntax: `node --check` on all 11 game/src/*.js — all OK. main.js OK.
- Screenshots: `node shot.mjs <game> <screenshots> 809x` — 4 shots, all ≤256 KiB, no errors.
  (shot-tool: ~/workspace/makefun/shot-tool/shot.mjs, playwright-core + headless Chromium.)
- Live play-test: `node playtest.mjs <game> 8097` — title "Skewerfest", click to start →
  status "Playing. Night 1.", built a skewer, placed it, cooked to golden, picked it up
  (header showed "Serving — click a customer!"), fan raised heat 70%→79%, wrong-recipe serve
  correctly refused (customer wanted Prawn, I built Chicken). Zero console/page errors.
  Live screenshot saved to /tmp/playtest-live.jpg.
- Autopilot full game (via ?shot=end&seed=1): WON — 36 orders, 1956 coins, best combo x5,
  perfect serves 36/36, burnt 0, walkaways 0/5. The game is winnable and the loop is sound.
  (An earlier autopilot version won with 4/5 walkaways; the perfect-window + busy-grill
  fixes made it 0/5.)
- main.ts: `MAKEFUN_OUTPUT_DIR=out node main.ts` — exit 0, dossier.json 534,195 B
  (text 65,793 B, well under the 163,840 cap; 12 source files, 65,028 B).
- `makefun check --kit best-game-01-kit --repo best-game --worktree` (2026-11-16T19:07Z):
  4 PASSED (competition_open, snapshot 23 files/484,761 B, license_osi MIT, entrypoint
  main.ts/node22), 1 FAILED (transcripts_present — expected, no bundle yet; the parent
  builds it at submit time), 14 skipped, 5 checked at submission (repo_public, repo_owner,
  repo_created_after_open, commit_in_repo, duplicate_snapshot — need the GitHub push + submit).

## Repo (local only — NOT pushed, NOT submitted)
- ~/workspace/makefun/best-game/, git repo, branch master, commit 3ddbcb9
  "Skewerfest: best-game-01 round 1 — grill skewers over live coals, serve the festival crowd"
- 22 files: LICENSE (MIT), PLAN.md, main.ts, serve.ts, shots.json, vendor/makefun-game.ts,
  game/index.html, game/src/*.js (11 files), screenshots/*.jpg (4). out/ is git-ignored.
- The parent still needs to: create the GitHub repo (after 2026-11-15T18:00Z — it will be),
  push, add .makefun/owner.json if needed, bundle the sessions, run the 3-model audit,
  then submit before 2026-11-18T18:00:00Z. Quota at last check: 3 left today, 0 entries made.

## Honest predicted score
- Dev win-rate 65–78% (red-team's range). Beats the weak starter/house games on completeness,
  readable HUD and escalating depth; capped below the 75–80% top-10 bar by generic-cooking
  originality and the strong tower-defence depth in the peer pool, unless the heat + festival
  execution is excellent.
- Honest top-10 chance: low-to-moderate (~10–20%). Top-20 is the realistic aim.
- Biggest risk: the judge dismisses it as "another diner game" on originality (criterion 4),
  and a cluttered stall becomes unreadable when shrunk. Mitigations already in: the heat
  mechanic is the visual signature (glowing coal bed + fan), the 3-night festival, named
  regulars, the distinct vermilion/jade/cream palette, and the shrink test (the cover reads
  clearly at 1280x720 and the contact sheet shrinks it further — the largest text and the
  HUD numerals survive).

## What is NOT done (for the parent)
- No GitHub repo created, no push, no bundle, no submit (per the task's scope).
- No 3-model audit (Gemini/DeepSeek/GLM) — the parent runs it; this subagent could not reach
  those models (no live-browser access). The audit is the external-model check.
- No external-model consultation during planning (see the method note above).
