// The run: nights, orders, coins, combo, walkaways, the hand and the serving skewer.
// Input (mouse/keyboard) and the screenshot autopilot both drive the game through these
// actions, so a staged screenshot is the same game a player plays. step() advances one
// fixed step and returns what happened as bit flags, so the caller can react (sound,
// announcements) without the state knowing about screens or audio.
import {
  BASE_GRILL_SLOTS, DONENESS, MAX_COMBO, MAX_WALKAWAYS, NIGHTS, RUSH, UPGRADES,
} from './config.js';
import { createRandom } from './random.js';
import { createGrill, growGrill, fanCoals, isBurnt, isGolden, placeSkewer, stepGrill, takeSkewer } from './grill.js';
import { createCustomers, mostUrgent, serveTo, stepCustomers } from './customers.js';
import { recipeById, recipeFor } from './orders.js';

export const EVENT_SERVE = 1;
export const EVENT_PERFECT = 2;
export const EVENT_WALKAWAY = 4;
export const EVENT_BURNT = 8;
export const EVENT_FAN = 16;
export const EVENT_NIGHT = 32;
export const EVENT_WIN = 64;
export const EVENT_LOSE = 128;
export const EVENT_UPGRADE = 256;

/** Doneness inside this window is a perfect serve (extra coins). */
const PERFECT_LOW = 60;
const PERFECT_HIGH = 80;

export function createState(random) {
  const state = {
    screen: 'title',
    night: 1,
    nightTime: 0,
    nightElapsed: 0,
    ordersServed: 0,
    ordersTarget: 0,
    totalServed: 0,
    walkaways: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    grill: createGrill(BASE_GRILL_SLOTS),
    customers: createCustomers(random),
    hand: [],
    serving: null,
    toasts: [],
    upgrades: { grillSlots: BASE_GRILL_SLOTS, heatDecayMul: 1, patienceMul: 1, tipMul: 1, cookMul: 1 },
    offeredUpgrades: [],
    won: false,
    loseReason: '',
    stats: { served: 0, burnt: 0, walked: 0, perfect: 0 },
    best: 0,
    random,
  };
  return state;
}

function addToast(state, text, color) {
  state.toasts.push({ text, color, ttl: 1.6 });
  if (state.toasts.length > 5) state.toasts.shift();
}

/** The recipe the hand currently builds, or null when it matches none (yet). */
export function handRecipe(state) {
  return state.hand.length === 0 ? null : recipeFor(state.hand);
}

/** Add an ingredient to the hand (max 3). Returns the recipe it now matches, or null. */
export function addIngredient(state, id) {
  if (state.screen !== 'play' || state.hand.length >= 3) return null;
  state.hand.push(id);
  return handRecipe(state);
}

export function clearHand(state) {
  state.hand = [];
}

/** Place the hand's skewer on the first free grill slot. Returns the slot index or -1. */
export function placeHandSkewer(state) {
  if (state.screen !== 'play') return -1;
  const recipe = handRecipe(state);
  if (!recipe) return -1;
  const slot = placeSkewer(state.grill, recipe.id);
  if (slot >= 0) state.hand = [];
  return slot;
}

/** Pick a golden skewer off the grill to serve it. Returns the skewer or null. */
export function pickSkewer(state, index) {
  if (state.screen !== 'play' || state.serving) return null;
  const slot = state.grill.slots[index];
  if (!slot || !isGolden(slot)) return null;
  const taken = takeSkewer(state.grill, index);
  state.serving = taken;
  return taken;
}

/** Throw a burnt skewer away. Returns true when one was discarded (combo breaks). */
export function discardSkewer(state, index) {
  if (state.screen !== 'play') return false;
  const slot = state.grill.slots[index];
  if (!slot || !isBurnt(slot)) return false;
  takeSkewer(state.grill, index);
  state.combo = 0;
  state.stats.burnt += 1;
  addToast(state, 'Burnt! Combo lost', '#e63b2e');
  return true;
}

/** Put the serving skewer back on a free grill slot (changed your mind). */
export function returnServing(state) {
  if (!state.serving) return -1;
  const slot = placeSkewer(state.grill, state.serving.recipeId);
  if (slot >= 0) {
    state.grill.slots[slot].doneness = state.serving.doneness;
    state.serving = null;
  }
  return slot;
}

/** Serve the picked-up skewer to a customer. Returns coins earned, or -1 when refused. */
export function serveCustomer(state, customerIndex) {
  if (state.screen !== 'play' || !state.serving) return -1;
  const recipe = recipeById(state.serving.recipeId);
  const customer = state.customers.list[customerIndex];
  if (!customer || !recipe) return -1;
  const served = serveTo(state.customers, customerIndex, recipe.id);
  if (served < 0) return -1;
  const perfect = state.serving.doneness >= PERFECT_LOW && state.serving.doneness <= PERFECT_HIGH;
  const patienceFrac = Math.max(0, customer.patience / customer.patienceMax);
  const tip = recipe.coins * 0.5 * patienceFrac * state.upgrades.tipMul;
  state.combo = Math.min(MAX_COMBO, state.combo + 1);
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const mult = (1 + 0.25 * (state.combo - 1)) * (perfect ? 1.5 : 1);
  const earned = Math.max(1, Math.round((recipe.coins + tip) * mult));
  state.coins += earned;
  state.ordersServed += 1;
  state.totalServed += 1;
  state.stats.served += 1;
  if (perfect) state.stats.perfect += 1;
  addToast(state, perfect ? `PERFECT! +${earned}` : `+${earned} coins`, perfect ? '#ffc53d' : '#fff3d6');
  state.serving = null;
  return earned;
}

/** Stoke the coals. Returns true when the fan fired. */
export function fan(state) {
  if (state.screen !== 'play') return false;
  return fanCoals(state.grill);
}

/** Start a fresh game (night 1, everything reset except the best score). */
export function startGame(state) {
  const best = state.best;
  const fresh = createState(state.random);
  Object.keys(state).forEach((k) => { delete state[k]; });
  Object.assign(state, fresh);
  state.best = best;
  startNight(state, 1);
}

/** Set up a night: target, timer, a fresh grill and customers, hand cleared. */
export function startNight(state, night) {
  const def = NIGHTS[night - 1];
  state.night = night;
  state.ordersTarget = def.target;
  state.nightTime = def.time;
  state.nightElapsed = 0;
  state.ordersServed = 0;
  state.hand = [];
  state.serving = null;
  state.grill = createGrill(state.upgrades.grillSlots);
  state.customers = createCustomers(state.random);
  state.screen = 'play';
}

/** After a night is won (and it is not the last), offer three upgrades and open the shop. */
export function openShop(state) {
  const pool = [...UPGRADES];
  const offered = [];
  for (let i = 0; i < 3 && pool.length > 0; i += 1) {
    const pick = Math.floor(state.random() * pool.length);
    offered.push(pool.splice(pick, 1)[0]);
  }
  state.offeredUpgrades = offered;
  state.screen = 'shop';
}

/** Take an upgrade from the shop, then start the next night (or win the game). */
export function chooseUpgrade(state, upgradeId) {
  if (state.screen !== 'shop') return false;
  const up = state.offeredUpgrades.find((u) => u.id === upgradeId);
  if (!up) return false;
  up.apply(state.upgrades);
  if (state.upgrades.grillSlots > state.grill.slots.length) growGrill(state.grill, state.upgrades.grillSlots);
  state.offeredUpgrades = [];
  if (state.night >= NIGHTS.length) {
    state.won = true;
    state.screen = 'over';
    return true;
  }
  startNight(state, state.night + 1);
  return true;
}

function isRush(state) {
  const def = NIGHTS[state.night - 1];
  const mid = def.time / 2;
  return state.nightElapsed >= mid - RUSH.window / 2 && state.nightElapsed <= mid + RUSH.window / 2;
}

function endGame(state, won, reason) {
  state.won = won;
  state.loseReason = won ? '' : reason;
  state.screen = 'over';
}

/** One fixed step. Only advances while the game is being played. Returns EVENT_* flags. */
export function step(state, dt) {
  let events = 0;
  if (state.screen !== 'play') return events;
  const def = NIGHTS[state.night - 1];
  state.nightElapsed += dt;
  state.nightTime = Math.max(0, def.time - state.nightElapsed);
  const rush = isRush(state);

  const spawnInterval = def.spawn * (rush ? RUSH.spawnFactor : 1);
  const walked = stepCustomers(state.customers, dt, state.night, spawnInterval, state.upgrades.patienceMul, rush);
  for (const c of walked) {
    state.walkaways += 1;
    state.combo = 0;
    state.stats.walked += 1;
    addToast(state, `${c.label} stormed off!`, '#e63b2e');
    events |= EVENT_WALKAWAY;
  }

  stepGrill(state.grill, dt, state.upgrades.cookMul, def.heatDecay * state.upgrades.heatDecayMul);

  for (const toast of state.toasts) toast.ttl -= dt;
  state.toasts = state.toasts.filter((t) => t.ttl > 0);

  // A skewer that sat too long past burnt stays burnt until discarded (no auto event).
  if (state.walkaways >= MAX_WALKAWAYS) {
    endGame(state, false, 'Too many customers stormed off');
    events |= EVENT_LOSE;
    return events;
  }
  if (state.ordersServed >= state.ordersTarget) {
    if (state.night >= NIGHTS.length) {
      endGame(state, true, '');
      events |= EVENT_WIN;
    } else {
      openShop(state);
      events |= EVENT_NIGHT;
    }
    return events;
  }
  if (state.nightTime <= 0) {
    endGame(state, false, 'Closing time — the target was missed');
    events |= EVENT_LOSE;
    return events;
  }
  return events;
}

/** The most urgent waiting customer and the recipe they still need (for the autopilot). */
export function urgentNeed(state) {
  const c = mostUrgent(state.customers);
  if (!c) return null;
  for (let i = 0; i < c.orders.length; i += 1) {
    if (!c.served[i]) return { customer: c, recipeId: c.orders[i] };
  }
  return null;
}
