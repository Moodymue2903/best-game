// Keyboard and pointer input. One-shot presses (start, restart, pause, mute) are queued
// as bit flags and taken once by the loop, so a press between two frames is never lost
// and never counted twice. Pointer clicks on the stall act at once: bins build, grill
// slots place / pick up / toss, customers take a serving, the fan stokes the coals.
import { FIELD, INGREDIENTS, LAYOUT, grillSlotRects } from './config.js';
import {
  addIngredient, chooseUpgrade, clearHand, discardSkewer, fan, pickSkewer,
  placeHandSkewer, returnServing, serveCustomer, startGame,
} from './state.js';
import { isBurnt, isGolden } from './grill.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const FAN_KEYS = new Set(['Space']);
const CONFIRM_KEYS = new Set(['Enter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const RESTART_KEYS = new Set(['KeyR']);
const MUTE_KEYS = new Set(['KeyM']);

function inRect(px, py, r) {
  return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
}

export function createInput(canvas, state, onMute) {
  let actions = 0;

  /** Convert a pointer event to logical (1280x720) coordinates. */
  function toLogical(event) {
    const ratio = window.devicePixelRatio || 1;
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * ratio;
    const y = (event.clientY - rect.top) * ratio;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function clickBin(px, py) {
    const b = LAYOUT.bins;
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const r = { x: b.x + i * (b.binW + b.gap), y: b.y + 16, w: b.binW, h: 118 };
      if (inRect(px, py, r)) {
        addIngredient(state, INGREDIENTS[i].id);
        return true;
      }
    }
    return false;
  }

  function clickGrill(px, py) {
    const rects = grillSlotRects(state.grill.slots.length);
    for (let i = 0; i < rects.length; i += 1) {
      if (!inRect(px, py, rects[i])) continue;
      const slot = state.grill.slots[i];
      if (!slot.active) {
        // Empty slot: place the hand's skewer if it makes a recipe.
        if (state.hand.length > 0) placeHandSkewer(state);
        return true;
      }
      if (isBurnt(slot)) {
        discardSkewer(state, i);
        return true;
      }
      if (state.serving) {
        // Already carrying a skewer: put it back here only if this slot is free (it is not).
        return true;
      }
      if (isGolden(slot)) {
        pickSkewer(state, i);
        return true;
      }
      // Not golden yet: leave it cooking.
      return true;
    }
    return false;
  }

  function clickCustomer(px, py) {
    const c = LAYOUT.customers;
    for (let i = 0; i < state.customers.list.length; i += 1) {
      const r = { x: c.x + i * (c.cardW + c.gap), y: c.y, w: c.cardW, h: c.h };
      if (inRect(px, py, r)) {
        if (state.serving) serveCustomer(state, i);
        return true;
      }
    }
    return false;
  }

  function clickShop(px, py) {
    const cardW = 300;
    const gap = 30;
    const totalW = cardW * 3 + gap * 2;
    const startX = (FIELD.width - totalW) / 2;
    for (let i = 0; i < state.offeredUpgrades.length; i += 1) {
      const r = { x: startX + i * (cardW + gap), y: 220, w: cardW, h: 220 };
      if (inRect(px, py, r)) {
        chooseUpgrade(state, state.offeredUpgrades[i].id);
        return true;
      }
    }
    return false;
  }

  function handlePointer(event) {
    const { x, y } = toLogical(event);
    if (state.screen === 'title' || state.screen === 'over') {
      actions |= ACTION_CONFIRM;
      return;
    }
    if (state.screen === 'paused') {
      actions |= ACTION_PAUSE;
      return;
    }
    if (state.screen === 'shop') {
      clickShop(x, y);
      return;
    }
    if (state.screen !== 'play') return;
    if (inRect(x, y, LAYOUT.fan)) {
      fan(state);
      return;
    }
    if (inRect(x, y, LAYOUT.hand)) {
      // Click the hand to clear it; click a grill slot (below) to place it.
      if (state.serving) returnServing(state);
      else clearHand(state);
      return;
    }
    if (clickBin(x, y)) return;
    if (clickGrill(x, y)) return;
    if (clickCustomer(x, y)) return;
  }

  canvas.addEventListener('pointerdown', handlePointer);

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (FAN_KEYS.has(event.code)) {
      if (state.screen === 'play') fan(state);
      else actions |= ACTION_CONFIRM;
      event.preventDefault();
      return;
    }
    if (CONFIRM_KEYS.has(event.code)) {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
      return;
    }
    if (PAUSE_KEYS.has(event.code)) {
      actions |= ACTION_PAUSE;
      event.preventDefault();
      return;
    }
    if (RESTART_KEYS.has(event.code)) {
      actions |= ACTION_RESTART;
      event.preventDefault();
      return;
    }
    if (MUTE_KEYS.has(event.code)) {
      actions |= ACTION_MUTE;
      event.preventDefault();
      return;
    }
    if (state.screen === 'play') {
      const idx = INGREDIENTS.findIndex((ing) => `Digit${ing.key}` === event.code);
      if (idx >= 0) {
        addIngredient(state, INGREDIENTS[idx].id);
        event.preventDefault();
      }
    }
  });

  // A key released while the tab is hidden never sends keyup; nothing here is held.
  window.addEventListener('blur', () => {});

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
