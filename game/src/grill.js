// The grill: slots, live coals (heat) and doneness. No drawing, no browser in it.
// A skewer cooks while it sits on a slot; its doneness rises with the coals' heat.
// Golden window: servable. Past burnt: ruined, must be discarded.
import { COOK_RATE, DONENESS, HEAT } from './config.js';
import { recipeById } from './orders.js';

export function createGrill(slotCount) {
  const slots = [];
  for (let i = 0; i < slotCount; i += 1) {
    slots.push({ active: false, recipeId: null, doneness: 0 });
  }
  return { slots, heat: HEAT.start, fanCooldown: 0 };
}

/** Grow the grill when an upgrade adds slots. */
export function growGrill(grill, slotCount) {
  while (grill.slots.length < slotCount) {
    grill.slots.push({ active: false, recipeId: null, doneness: 0 });
  }
}

function clampRate(heat) {
  return Math.min(HEAT.maxRate, Math.max(HEAT.minRate, heat / 100));
}

/** One fixed step: coals cool, the fan recharges, every skewer on the grill cooks. */
export function stepGrill(grill, dt, cookMul, heatDecay) {
  grill.heat = Math.max(0, grill.heat - heatDecay * dt);
  if (grill.fanCooldown > 0) grill.fanCooldown = Math.max(0, grill.fanCooldown - dt);
  const rate = clampRate(grill.heat);
  for (const slot of grill.slots) {
    if (!slot.active) continue;
    const recipe = recipeById(slot.recipeId);
    slot.doneness = Math.min(100, slot.doneness + COOK_RATE * (recipe ? recipe.cook : 1) * cookMul * rate * dt);
  }
}

/** Put a skewer on the first free slot. Returns the slot index, or -1 when full. */
export function placeSkewer(grill, recipeId) {
  for (let i = 0; i < grill.slots.length; i += 1) {
    if (!grill.slots[i].active) {
      grill.slots[i].active = true;
      grill.slots[i].recipeId = recipeId;
      grill.slots[i].doneness = 0;
      return i;
    }
  }
  return -1;
}

/** Take a skewer off a slot (to serve it, or to throw a burnt one away). */
export function takeSkewer(grill, index) {
  const slot = grill.slots[index];
  if (!slot || !slot.active) return null;
  const taken = { recipeId: slot.recipeId, doneness: slot.doneness };
  slot.active = false;
  slot.recipeId = null;
  slot.doneness = 0;
  return taken;
}

/** Is a slot's skewer in the golden (servable) window? */
export function isGolden(slot) {
  return slot.active && slot.doneness >= DONENESS.goldenLow && slot.doneness <= DONENESS.goldenHigh;
}

/** Is a slot's skewer burnt past saving? */
export function isBurnt(slot) {
  return slot.active && slot.doneness >= DONENESS.burnt;
}

/** Stoke the coals. Returns true when the fan fired, false while it recharges. */
export function fanCoals(grill) {
  if (grill.fanCooldown > 0) return false;
  grill.heat = Math.min(100, grill.heat + HEAT.fanBoost);
  grill.fanCooldown = HEAT.fanCooldown;
  return true;
}
