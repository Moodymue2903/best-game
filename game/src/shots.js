// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the real rules
// forward from a fresh run for a fixed stretch, steered by a greedy autopilot (serve the
// most urgent golden skewer, build the most urgent missing recipe, fan when the coals
// run cold, toss what burns), so the frame is what a real game looks like and the same
// seed always gives the same frame.
import { STEP } from './config.js';
import { recipeById } from './orders.js';
import { isBurnt, isGolden } from './grill.js';
import {
  addIngredient, chooseUpgrade, discardSkewer, fan, pickSkewer, placeHandSkewer,
  serveCustomer, startGame, step,
} from './state.js';

const PLAY_NIGHT2_SECONDS = 52;
const RUSH_WAIT_SECONDS = 75;
const GAME_LIMIT_SECONDS = 600;

/** How many of each recipe are already cooking (on the grill or in hand to serve). */
function cookingCounts(state) {
  const counts = new Map();
  for (const slot of state.grill.slots) {
    if (slot.active) counts.set(slot.recipeId, (counts.get(slot.recipeId) || 0) + 1);
  }
  if (state.serving) counts.set(state.serving.recipeId, (counts.get(state.serving.recipeId) || 0) + 1);
  return counts;
}

/**
 * The most urgent unserved recipe whose demand exceeds what is already cooking.
 * When several customers want the same skewer, build one for each of them — that is
 * what keeps every grill slot busy instead of cooking one skewer at a time.
 */
function nextBuildTarget(state) {
  const cooking = cookingCounts(state);
  const customers = [...state.customers.list].sort(
    (a, b) => (a.patience / a.patienceMax) - (b.patience / b.patienceMax),
  );
  for (const c of customers) {
    for (let i = 0; i < c.orders.length; i += 1) {
      if (c.served[i]) continue;
      const id = c.orders[i];
      let demand = 0;
      for (const cc of state.customers.list) {
        for (let j = 0; j < cc.orders.length; j += 1) {
          if (!cc.served[j] && cc.orders[j] === id) demand += 1;
        }
      }
      if (demand > (cooking.get(id) || 0)) return id;
    }
  }
  return null;
}

/** A skewer is ready to serve: in the perfect window, or about to leave the golden one. */
function readyToServe(slot) {
  return slot.doneness >= 60 && slot.doneness <= 88;
}

/** One autopilot decision: serve, build, place, fan, or toss — in that order. */
function autopilotStep(state) {
  if (state.screen === 'shop') {
    // Take the grill first (more slots beats everything), else the fan, else the first.
    const want = state.offeredUpgrades.find((u) => u.id === 'grill')
      || state.offeredUpgrades.find((u) => u.id === 'fan')
      || state.offeredUpgrades[0];
    if (want) chooseUpgrade(state, want.id);
    return;
  }
  if (state.screen !== 'play') return;

  // 1. Toss anything burnt (it blocks the slot and breaks the combo if left).
  for (let i = 0; i < state.grill.slots.length; i += 1) {
    if (isBurnt(state.grill.slots[i])) {
      discardSkewer(state, i);
      return;
    }
  }
  // 2. Serve a ready skewer to the most urgent customer who wants it.
  for (let i = 0; i < state.grill.slots.length; i += 1) {
    const slot = state.grill.slots[i];
    if (!isGolden(slot) || !readyToServe(slot) || state.serving) continue;
    const recipe = recipeById(slot.recipeId);
    if (!recipe) continue;
    // Find the most urgent customer who still needs this recipe.
    let bestIdx = -1;
    let bestFrac = Infinity;
    state.customers.list.forEach((c, idx) => {
      if (c.served.some((s, o) => !s && c.orders[o] === recipe.id)) {
        const frac = c.patience / c.patienceMax;
        if (frac < bestFrac) {
          bestFrac = frac;
          bestIdx = idx;
        }
      }
    });
    if (bestIdx >= 0) {
      pickSkewer(state, i);
      serveCustomer(state, bestIdx);
      return;
    }
  }
  // 3. Build the most urgent missing recipe and put it on a free slot.
  const target = nextBuildTarget(state);
  if (target) {
    const recipe = recipeById(target);
    if (recipe && state.hand.length === 0) {
      for (const ing of recipe.needs) addIngredient(state, ing);
      placeHandSkewer(state);
      return;
    }
  }
  // 4. Keep the coals hot.
  if (state.grill.heat < 55) fan(state);
}

/**
 * Play forward for up to `seconds` of game time (fixed steps), steering with the
 * autopilot. Stops early when `stop` returns true or the game leaves play/shop.
 * Returns true when it stopped early.
 */
function runFor(state, seconds, stop) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (state.screen === 'over') return true;
    autopilotStep(state);
    step(state, STEP);
    if (stop && stop(state)) return true;
    if (state.screen === 'over') return true;
  }
  return false;
}

/** Play the current night to its end (win the night or lose the game). */
function playNight(state) {
  return runFor(state, GAME_LIMIT_SECONDS, (s) => s.screen !== 'play');
}

/**
 * Set `state` to the named scene (start, play, rush or end) and return the screen to
 * draw over it and the best score to show.
 */
export function stageShot(name, state) {
  startGame(state);
  // The rush cover is staged with the hero composition (see render.js): the
  // festival mood leads and the HUD is compressed. A presentation flag only —
  // it changes no rule, and the live game never sets it.
  state.heroShot = name === 'rush';
  if (name !== 'play' && name !== 'rush' && name !== 'end') {
    return { screen: 'title', best: 0 };
  }
  // Night 1, then the shop, then Night 2 to the middle of its rush.
  playNight(state);
  if (name === 'play') {
    if (state.screen === 'shop') {
      // The autopilot already picked an upgrade; Night 2 is now playing.
    }
    runFor(state, PLAY_NIGHT2_SECONDS, (s) => s.nightElapsed >= 45 && s.customers.list.length >= 4);
    return { screen: state.screen === 'play' ? 'play' : state.screen, best: state.coins };
  }
  // Night 2, then the shop, then Night 3 until a Critic is on screen mid-night.
  // Stop early (before the night is won) so the frame is a tense mid-play moment,
  // not the results screen: the autopilot is fast enough to win Night 3 outright.
  playNight(state);
  runFor(state, RUSH_WAIT_SECONDS, (s) => s.nightElapsed >= 25 && s.customers.list.some((c) => c.type === 'critic') && s.customers.list.length >= 3);
  if (name === 'rush') {
    return { screen: state.screen === 'play' ? 'play' : state.screen, best: state.coins };
  }
  // The rest of the game, to the win (or the loss) screen.
  runFor(state, GAME_LIMIT_SECONDS, (s) => s.screen === 'over');
  return { screen: 'over', best: Math.max(state.best, state.coins) };
}
