// Drawing only: the run's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred, the margin filled
// with the backdrop colour. Flat shapes and canvas text for the HUD and the panels.
import { DONENESS, FIELD, FONT, INGREDIENTS, LAYOUT, MAX_WALKAWAYS, NIGHTS, PALETTE, grillSlotRects } from './config.js';
import { ingredientById, recipeById } from './orders.js';
import { isBurnt, isGolden } from './grill.js';
import { handRecipe } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_SHOP = 'shop';
export const SCREEN_OVER = 'over';

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, baseline) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = baseline || 'alphabetic';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function panel(x, y, w, h, fill) {
    context.fillStyle = fill || PALETTE.panel;
    roundRect(x, y, w, h, 10);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    context.stroke();
  }

  function ingredientIcon(id, x, y, r) {
    const ing = ingredientById(id);
    if (!ing) return;
    context.fillStyle = ing.color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(0,0,0,0.35)';
    context.lineWidth = 2;
    context.stroke();
    // The mark is a distinct short label, not the first letter: Prawn (Pr, coral)
    // and Pepper (Pe, teal) would otherwise both read as P.
    const mark = ing.mark || ing.label[0];
    const size = mark.length > 1 ? Math.round(r * 0.72) : Math.round(r * 1.1);
    text(mark, x, y + r * 0.38, size, '#1e1a17', 'center', 'middle');
  }

  function face(x, y, r, color, seed) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(0,0,0,0.3)';
    context.lineWidth = 2;
    context.stroke();
    // Eyes and a mouth; the seed nudges the mouth so faces differ slightly.
    const eyeY = y - r * 0.25;
    context.fillStyle = '#1e1a17';
    context.beginPath();
    context.arc(x - r * 0.35, eyeY, r * 0.11, 0, Math.PI * 2);
    context.arc(x + r * 0.35, eyeY, r * 0.11, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#1e1a17';
    context.lineWidth = Math.max(2, r * 0.08);
    context.beginPath();
    const smile = seed > 0.5 ? 1 : -0.4;
    context.arc(x, y + r * 0.15, r * 0.4, Math.PI * 0.15, Math.PI * 0.85, smile < 0);
    context.stroke();
  }

  function drawBackdrop(state, hero) {
    // Warm dark night-market backdrop with a soft glow and string lights.
    const g = context.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, '#241b16');
    g.addColorStop(1, '#1e1a17');
    context.fillStyle = g;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // Warm lantern/grill light: a soft radial bloom over the dark charcoal so the
    // stall reads as lit by its own coals. It sits behind every panel and the HUD,
    // so it warms the frame without ever covering text.
    const bloom = context.createRadialGradient(FIELD.width / 2, 330, 60, FIELD.width / 2, 330, 720);
    bloom.addColorStop(0, 'rgba(255,107,44,0.14)');
    bloom.addColorStop(0.55, 'rgba(255,140,66,0.06)');
    bloom.addColorStop(1, 'rgba(255,107,44,0)');
    context.fillStyle = bloom;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    if (hero) {
      // Hero cover: the grill is the warm focal point and the top of the frame
      // glows with lantern light, so the festival mood (not the HUD) carries
      // the cover. Both sit behind every panel, as the bloom does.
      const grillGlow = context.createRadialGradient(FIELD.width / 2, 306, 40, FIELD.width / 2, 306, 620);
      grillGlow.addColorStop(0, 'rgba(255,107,44,0.20)');
      grillGlow.addColorStop(0.6, 'rgba(255,140,66,0.08)');
      grillGlow.addColorStop(1, 'rgba(255,107,44,0)');
      context.fillStyle = grillGlow;
      context.fillRect(0, 0, FIELD.width, FIELD.height);
      const topGlow = context.createRadialGradient(FIELD.width / 2, 100, 20, FIELD.width / 2, 100, 520);
      topGlow.addColorStop(0, 'rgba(255,197,61,0.14)');
      topGlow.addColorStop(1, 'rgba(255,197,61,0)');
      context.fillStyle = topGlow;
      context.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (hero) {
      // Hero frieze, in the strip the compressed HUD frees (y 36-64): the
      // festival crowd behind the stall counter — dark heads peeking over the
      // customer row, at staggered heights so the row reads as a crowd rather
      // than a dotted border — with paper lanterns hanging above them.
      // Deterministic (index-based), so the staged cover is the same every
      // capture. The string lights are skipped here; the lanterns are the lights.
      context.fillStyle = '#151009';
      for (let i = 0; i < 24; i += 1) {
        const x = 30 + i * 52;
        const r = 13 + (i % 3) * 2;
        const y = 54 + (i % 2) * 4;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
      }
      const lanternX = [90, 320, 640, 960, 1190];
      for (let i = 0; i < lanternX.length; i += 1) {
        const x = lanternX[i];
        const glow = context.createRadialGradient(x, 52, 4, x, 52, 44);
        glow.addColorStop(0, 'rgba(255,197,61,0.55)');
        glow.addColorStop(1, 'rgba(255,197,61,0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, 52, 38, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = 'rgba(255,243,214,0.6)';
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(x, 36);
        context.lineTo(x, 40);
        context.stroke();
        context.fillStyle = i % 2 === 0 ? PALETTE.gold : PALETTE.ember;
        context.beginPath();
        context.ellipse(x, 52, 13, 17, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#8a5a20';
        context.fillRect(x - 5, 33, 10, 4);
        context.fillRect(x - 5, 67, 10, 4);
      }
    } else {
      // String lights across the top, below the HUD.
      for (let i = 0; i < 14; i += 1) {
        const x = 60 + i * 86;
        const y = 62 + Math.sin(i * 1.3) * 4;
        context.fillStyle = i % 3 === 0 ? PALETTE.gold : i % 3 === 1 ? PALETTE.ember : PALETTE.jade;
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
      }
    }
    // Weather: wind streaks on night 2, rain on night 3.
    if (state.night === 2) {
      context.strokeStyle = 'rgba(255,243,214,0.18)';
      context.lineWidth = 2;
      for (let i = 0; i < 8; i += 1) {
        const y = 120 + i * 70;
        const off = (state.nightElapsed * 60 + i * 170) % 1400;
        context.beginPath();
        context.moveTo(off - 140, y);
        context.quadraticCurveTo(off - 70, y - 12, off, y);
        context.stroke();
      }
    } else if (state.night === 3) {
      // Rain on night 3: thick, bright, slanted streaks — clearly visible in the
      // dark gaps between panels, not faint hairlines.
      context.strokeStyle = 'rgba(190,210,255,0.55)';
      context.lineWidth = 3;
      for (let i = 0; i < 44; i += 1) {
        const x = (i * 97 + 40) % 1280;
        const y = (state.nightElapsed * 420 + i * 53) % 720;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - 8, y + 26);
        context.stroke();
      }
    }
  }

  function drawHud(state, hero) {
    const h = LAYOUT.hud;
    if (hero) {
      // Hero cover: a slim bar (36px, not 56). The win/lose stakes are the
      // centrepiece, in big numbers a 2-second glance can parse — WIN 16 •
      // LOSE 5 — instead of a dense small line in the grill header. The
      // walkaway count moves to the grill header, so nothing is lost.
      context.fillStyle = '#161210';
      context.fillRect(h.x, h.y, h.w, 36);
      text(`COINS ${state.coins}`, 24, 18, 20, PALETTE.gold, 'left', 'middle');
      text(`NIGHT ${state.night}/3`, 200, 18, 20, PALETTE.text, 'left', 'middle');
      text('WIN', 548, 18, 20, PALETTE.gold, 'center', 'middle');
      text(String(state.ordersTarget), 596, 18, 30, PALETTE.gold, 'center', 'middle');
      text('•', 640, 18, 20, PALETTE.muted, 'center', 'middle');
      text('LOSE', 688, 18, 20, PALETTE.danger, 'center', 'middle');
      text(String(MAX_WALKAWAYS), 740, 18, 30, PALETTE.danger, 'center', 'middle');
      text(`ORDERS ${state.ordersServed}/${state.ordersTarget}`, 850, 18, 20, PALETTE.text, 'left', 'middle');
      text(`CLOSING ${fmtTime(state.nightTime)}`, 1010, 18, 20, state.nightTime <= 15 ? PALETTE.danger : PALETTE.text, 'left', 'middle');
      if (state.combo >= 2) {
        text(`COMBO x${state.combo}`, 1256, 18, 20, PALETTE.gold, 'right', 'middle');
      }
      return;
    }
    context.fillStyle = '#161210';
    context.fillRect(h.x, h.y, h.w, h.h);
    text(`COINS ${state.coins}`, 24, 36, 26, PALETTE.gold, 'left', 'middle');
    text(`NIGHT ${state.night}/3`, 230, 36, 26, PALETTE.text, 'left', 'middle');
    text(`ORDERS ${state.ordersServed}/${state.ordersTarget}`, 410, 36, 26, PALETTE.text, 'left', 'middle');
    const walkColor = state.walkaways >= 4 ? PALETTE.danger : PALETTE.text;
    text(`WALKAWAYS ${state.walkaways}/${5}`, 660, 36, 26, walkColor, 'left', 'middle');
    text(`CLOSING ${fmtTime(state.nightTime)}`, 900, 36, 26, state.nightTime <= 15 ? PALETTE.danger : PALETTE.text, 'left', 'middle');
    if (state.combo >= 2) {
      text(`COMBO x${state.combo}`, 1256, 36, 26, PALETTE.gold, 'right', 'middle');
    }
  }

  function drawCustomers(state, hero) {
    const c = LAYOUT.customers;
    for (let i = 0; i < state.customers.list.length; i += 1) {
      const cust = state.customers.list[i];
      const x = c.x + i * (c.cardW + c.gap);
      const y = c.y;
      // Hero cover: the cards are slightly see-through, so the lantern glow and
      // rain behind them show through, and the faces are bigger — the people,
      // not the panels, are the subject.
      panel(x, y, c.cardW, c.h, hero ? 'rgba(42,33,28,0.88)' : PALETTE.panel);
      if (hero) face(x + 40, y + 46, 32, cust.color, cust.faceSeed);
      else face(x + 40, y + 42, 26, cust.color, cust.faceSeed);
      text(cust.label, x + 76, y + 30, 22, PALETTE.text, 'left', 'middle');
      // Patience bar: wide, colour-coded, drains as they wait.
      const frac = Math.max(0, cust.patience / cust.patienceMax);
      const barX = x + 76;
      const barY = y + 48;
      const barW = c.cardW - 100;
      context.fillStyle = '#161210';
      roundRect(barX, barY, barW, 14, 7);
      context.fill();
      context.fillStyle = frac > 0.5 ? PALETTE.good : frac > 0.25 ? PALETTE.golden : PALETTE.danger;
      if (frac > 0) {
        roundRect(barX, barY, Math.max(8, barW * frac), 14, 7);
        context.fill();
      }
      text(`${Math.ceil(cust.patience)}s`, barX + barW + 6, barY + 7, 16, PALETTE.muted, 'left', 'middle');
      // Ticket: the recipe icons they want, one icon per ingredient, checked off
      // as served. A Family orders TWO skewers: a gold "x2" chip up front and a
      // wider gap between the two orders' icons, so four circles never read as
      // one impossible 4-ingredient skewer. Icons shrink for a multi-order
      // ticket so even two 3-ingredient orders fit the card.
      let tx = x + 76;
      const ty = y + 86;
      const multi = cust.orders.length > 1;
      const iconR = multi ? 11 : 13;
      const iconStep = multi ? 24 : 30;
      if (multi) {
        context.fillStyle = PALETTE.gold;
        roundRect(tx, ty - 11, 30, 22, 6);
        context.fill();
        text('x2', tx + 15, ty + 1, 15, '#1e1a17', 'center', 'middle');
        tx += 38;
      }
      for (let o = 0; o < cust.orders.length; o += 1) {
        const recipe = recipeById(cust.orders[o]);
        if (!recipe) continue;
        for (const ing of recipe.needs) {
          ingredientIcon(ing, tx, ty, iconR);
          tx += iconStep;
        }
        if (cust.served[o]) {
          context.strokeStyle = PALETTE.good;
          context.lineWidth = 4;
          context.beginPath();
          context.moveTo(tx - iconStep + 4, ty);
          context.lineTo(tx - iconStep + 12, ty + 9);
          context.lineTo(tx - 2, ty - 11);
          context.stroke();
        }
        tx += multi ? 16 : 8;
      }
      if (cust.orders.length === 1) {
        const recipe = recipeById(cust.orders[0]);
        if (recipe) text(recipe.name, tx + 4, ty, 16, PALETTE.muted, 'left', 'middle');
      }
    }
    // Empty seats show a faint outline so the row reads as four places.
    for (let i = state.customers.list.length; i < 4; i += 1) {
      const x = c.x + i * (c.cardW + c.gap);
      context.strokeStyle = 'rgba(255,243,214,0.12)';
      context.lineWidth = 2;
      roundRect(x, c.y, c.cardW, c.h, 10);
      context.stroke();
      text('Next customer…', x + c.cardW / 2, c.y + c.h / 2, 18, 'rgba(255,243,214,0.35)', 'center', 'middle');
    }
  }

  function drawGrill(state, hero) {
    const g = LAYOUT.grill;
    panel(g.x, g.y, g.w, g.h, '#241a14');
    text('GRILL', g.x + 24, g.y + 20, 20, PALETTE.muted, 'left', 'middle');
    if (hero) {
      // The WIN/LOSE stakes live in the slim hero HUD now; the grill header
      // carries the walkaway count instead, so nothing is lost.
      text(state.serving ? 'Serving — click a customer!' : `WALKAWAYS ${state.walkaways}/${MAX_WALKAWAYS}`, g.x + g.w - 24, g.y + 20, 18, state.serving ? PALETTE.gold : PALETTE.muted, 'right', 'middle');
    } else {
      text(state.serving ? 'Serving — click a customer!' : `WIN: ${state.ordersTarget} orders  •  LOSE: 5 walkaways`, g.x + g.w - 24, g.y + 20, 18, state.serving ? PALETTE.gold : PALETTE.muted, 'right', 'middle');
    }
    const rects = grillSlotRects(state.grill.slots.length);
    for (let i = 0; i < state.grill.slots.length; i += 1) {
      const slot = state.grill.slots[i];
      const r = rects[i];
      context.fillStyle = '#161210';
      roundRect(r.x, r.y, r.w, r.h, 8);
      context.fill();
      context.strokeStyle = PALETTE.panelEdge;
      context.lineWidth = 2;
      context.stroke();
      if (!slot.active) {
        text('empty', r.x + r.w / 2, r.y + r.h / 2, 16, 'rgba(255,243,214,0.3)', 'center', 'middle');
        continue;
      }
      // The coals under a cooking skewer burn brighter: a warm radial under-glow
      // behind the skewer, strongest at the slot's foot.
      const underGlow = context.createRadialGradient(r.x + r.w / 2, r.y + r.h - 10, 4, r.x + r.w / 2, r.y + r.h - 10, r.w * 0.62);
      underGlow.addColorStop(0, 'rgba(255,107,44,0.34)');
      underGlow.addColorStop(0.6, 'rgba(255,140,66,0.14)');
      underGlow.addColorStop(1, 'rgba(255,140,66,0)');
      context.fillStyle = underGlow;
      context.fillRect(r.x, r.y, r.w, r.h);
      const recipe = recipeById(slot.recipeId);
      // The skewer: a stick with the ingredient blobs on it.
      const cy = r.y + 52;
      context.strokeStyle = '#d9c7a7';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(r.x + 16, cy);
      context.lineTo(r.x + r.w - 16, cy);
      context.stroke();
      if (recipe) {
        const step = (r.w - 48) / Math.max(1, recipe.needs.length);
        recipe.needs.forEach((ing, k) => {
          ingredientIcon(ing, r.x + 34 + k * step, cy, 15);
        });
      }
      // Doneness bar with the golden window marked.
      const barX = r.x + 14;
      const barY = r.y + 92;
      const barW = r.w - 28;
      context.fillStyle = '#161210';
      roundRect(barX, barY, barW, 12, 6);
      context.fill();
      context.fillStyle = 'rgba(255,197,61,0.25)';
      context.fillRect(barX + barW * (DONENESS.goldenLow / 100), barY, barW * ((DONENESS.goldenHigh - DONENESS.goldenLow) / 100), 12);
      const frac = Math.min(1, slot.doneness / 100);
      context.fillStyle = isBurnt(slot) ? '#3a2e28' : isGolden(slot) ? PALETTE.golden : PALETTE.ember;
      if (frac > 0) {
        roundRect(barX, barY, Math.max(6, barW * frac), 12, 6);
        context.fill();
      }
      // Smoke and sparks rising off the cooking skewer. Positions ride on
      // nightElapsed and the slot index, so a staged screenshot is deterministic.
      // Drawn before the labels, so READY / BURNT text paints over the wisps.
      const t = state.nightElapsed;
      for (let k = 0; k < 3; k += 1) {
        const rise = (t * 14 + i * 37 + k * 29) % 46;
        const px = (r.x + r.w / 2) + Math.sin(t * 1.3 + i * 2 + k * 2.4) * 10 + (k - 1) * 12;
        const py = cy - 18 - rise;
        context.globalAlpha = 0.10 + 0.05 * Math.sin(t + k);
        context.fillStyle = '#cfc4b4';
        context.beginPath();
        context.arc(px, py, 5 + k * 1.6, 0, Math.PI * 2);
        context.fill();
      }
      for (let k = 0; k < 3; k += 1) {
        const rise = (t * 26 + i * 53 + k * 31) % 40;
        const px = (r.x + r.w / 2) + Math.sin(t * 2.1 + i * 3 + k * 1.7) * 14;
        const py = cy - 10 - rise;
        context.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3 + k * 2);
        context.fillStyle = PALETTE.gold;
        context.beginPath();
        context.arc(px, py, 2, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      text(recipe ? recipe.name : '', r.x + r.w / 2, r.y + 124, 15, PALETTE.muted, 'center', 'middle');
      if (isBurnt(slot)) {
        text('BURNT — click to toss', r.x + r.w / 2, r.y + 22, 15, PALETTE.danger, 'center', 'middle');
      } else if (isGolden(slot)) {
        text('READY', r.x + r.w / 2, r.y + 22, 16, PALETTE.golden, 'center', 'middle');
      }
    }
    // The coal bed: a glowing strip under the slots.
    const coalY = g.y + g.h - 52;
    context.fillStyle = PALETTE.coal;
    roundRect(g.x + 24, coalY, g.w - 48, 32, 8);
    context.fill();
    const heatFrac = state.grill.heat / 100;
    for (let i = 0; i < 12; i += 1) {
      const cx = g.x + 48 + i * ((g.w - 96) / 11);
      const glow = heatFrac * (0.6 + 0.4 * Math.sin(i * 2.1 + state.nightElapsed * 3));
      context.fillStyle = glow > 0.5 ? PALETTE.coalHot : '#5a4034';
      context.beginPath();
      context.arc(cx, coalY + 16, 7 + glow * 4, 0, Math.PI * 2);
      context.fill();
    }
    // The coals directly under a cooking skewer flare: a warm halo on the bed
    // beneath each active slot, so the eye reads which slots are live.
    for (let i = 0; i < state.grill.slots.length; i += 1) {
      if (!state.grill.slots[i].active) continue;
      const r = rects[i];
      const flare = context.createRadialGradient(r.x + r.w / 2, coalY + 16, 4, r.x + r.w / 2, coalY + 16, 56);
      flare.addColorStop(0, 'rgba(255,140,66,0.5)');
      flare.addColorStop(0.6, 'rgba(255,107,44,0.18)');
      flare.addColorStop(1, 'rgba(255,107,44,0)');
      context.fillStyle = flare;
      context.beginPath();
      context.arc(r.x + r.w / 2, coalY + 16, 56, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawHeat(state) {
    const h = LAYOUT.heat;
    text('HEAT', h.x, h.y + h.h / 2, 22, PALETTE.text, 'left', 'middle');
    const barX = h.x + 80;
    const barW = h.w - 240;
    const barY = h.y + 10;
    context.fillStyle = '#161210';
    roundRect(barX, barY, barW, 20, 10);
    context.fill();
    const frac = state.grill.heat / 100;
    const grad = context.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, '#5a4034');
    grad.addColorStop(0.5, PALETTE.ember);
    grad.addColorStop(1, PALETTE.gold);
    context.fillStyle = grad;
    if (frac > 0) {
      roundRect(barX, barY, Math.max(10, barW * frac), 20, 10);
      context.fill();
    }
    text(`${Math.round(state.grill.heat)}%`, barX + barW + 16, h.y + h.h / 2, 22, PALETTE.text, 'left', 'middle');
    if (state.grill.heat < 30) text('Coals are cold — FAN!', barX + barW + 90, h.y + h.h / 2, 20, PALETTE.danger, 'left', 'middle');
    else if (state.grill.heat > 85) text('Hot! Watch for burning', barX + barW + 90, h.y + h.h / 2, 20, PALETTE.golden, 'left', 'middle');
  }

  function drawBins(state) {
    const b = LAYOUT.bins;
    text('INGREDIENTS — click to build a skewer', b.x, b.y - 8, 18, PALETTE.muted, 'left', 'middle');
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const ing = INGREDIENTS[i];
      const x = b.x + i * (b.binW + b.gap);
      const y = b.y + 16;
      panel(x, y, b.binW, 118, PALETTE.panel);
      ingredientIcon(ing.id, x + b.binW / 2, y + 40, 24);
      text(ing.label, x + b.binW / 2, y + 84, 18, PALETTE.text, 'center', 'middle');
      text(`[${ing.key}]`, x + b.binW / 2, y + 106, 15, PALETTE.muted, 'center', 'middle');
    }
  }

  function drawHand(state) {
    const h = LAYOUT.hand;
    panel(h.x, h.y, h.w, h.h, PALETTE.panel);
    text('SKEWER IN HAND', h.x + 16, h.y + 28, 18, PALETTE.muted, 'left', 'middle');
    for (let i = 0; i < 3; i += 1) {
      const cx = h.x + 44 + i * 56;
      const cy = h.y + 72;
      if (state.hand[i]) ingredientIcon(state.hand[i], cx, cy, 20);
      else {
        context.strokeStyle = 'rgba(255,243,214,0.25)';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(cx, cy, 20, 0, Math.PI * 2);
        context.stroke();
      }
    }
    const recipe = handRecipe(state);
    if (recipe) text(recipe.name, h.x + 16, h.y + 118, 20, PALETTE.good, 'left', 'middle');
    else if (state.hand.length > 0) text('Not a recipe yet', h.x + 16, h.y + 118, 18, PALETTE.danger, 'left', 'middle');
    else text('Pick up to 3 ingredients', h.x + 16, h.y + 118, 16, PALETTE.muted, 'left', 'middle');
  }

  function drawFan(state) {
    const f = LAYOUT.fan;
    const cooling = state.grill.fanCooldown > 0;
    context.fillStyle = cooling ? '#3a2e28' : PALETTE.ember;
    roundRect(f.x, f.y, f.w, f.h, 12);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    context.stroke();
    text('FAN', f.x + f.w / 2, f.y + 58, 34, PALETTE.cream, 'center', 'middle');
    text(cooling ? `…${state.grill.fanCooldown.toFixed(1)}s` : '[ SPACE ]', f.x + f.w / 2, f.y + 98, 22, PALETTE.cream, 'center', 'middle');
    text('Stoke the coals', f.x + f.w / 2, f.y + 126, 16, PALETTE.cream, 'center', 'middle');
  }

  function drawHint() {
    const h = LAYOUT.hint;
    text('Click ingredients to build • Click a grill slot to place • Click a golden skewer, then a customer, to serve • SPACE fan • P pause • R restart • M mute',
      h.x, h.y + 18, 17, PALETTE.muted, 'left', 'middle');
  }

  function drawToasts(state) {
    let y = 470;
    for (const toast of state.toasts) {
      context.globalAlpha = Math.min(1, toast.ttl);
      text(toast.text, FIELD.width / 2, y, 26, toast.color, 'center', 'middle');
      context.globalAlpha = 1;
      y -= 32;
    }
  }

  function drawPanelScreen(title, lines, prompt, accent) {
    const w = 680;
    const lineH = 34;
    const h = 150 + lines.length * lineH + 70;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    context.fillStyle = 'rgba(0,0,0,0.45)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(x, y, w, h, PALETTE.panel);
    text(title, FIELD.width / 2, y + 72, 46, accent || PALETTE.text, 'center', 'middle');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 130 + i * lineH, 21, PALETTE.muted, 'center', 'middle');
    }
    text(prompt, FIELD.width / 2, y + h - 36, 23, PALETTE.gold, 'center', 'middle');
  }

  function drawTitle(state, best) {
    drawBackdrop(state);
    text('SKEWERFEST', FIELD.width / 2, 128, 84, PALETTE.gold, 'center', 'middle');
    text('Grill the right skewers over live coals and serve the festival crowd before closing time.',
      FIELD.width / 2, 182, 22, PALETTE.text, 'center', 'middle');
    const w = 880;
    const x = (FIELD.width - w) / 2;
    const y = 220;
    const h = 300;
    panel(x, y, w, h, PALETTE.panel);
    text('WIN: Serve the night\'s orders before closing — keep walkaways under 5',
      FIELD.width / 2, y + 52, 21, PALETTE.good, 'center', 'middle');
    text('LOSE: 5 hungry customers storm off, or closing comes first',
      FIELD.width / 2, y + 88, 21, PALETTE.danger, 'center', 'middle');
    text('Click ingredients to build a skewer  •  Click a grill slot to place it',
      FIELD.width / 2, y + 148, 21, PALETTE.text, 'center', 'middle');
    text('Serve it golden (50–90%)  •  SPACE fans the coals  •  P pauses  •  R restarts',
      FIELD.width / 2, y + 184, 21, PALETTE.text, 'center', 'middle');
    text(best > 0 ? `Best score  ${best}` : 'Your first festival — make it sizzle',
      FIELD.width / 2, y + 244, 21, PALETTE.muted, 'center', 'middle');
    text('CLICK TO BEGIN', FIELD.width / 2, 590, 36, PALETTE.gold, 'center', 'middle');
  }

  function drawShop(state) {
    drawBackdrop(state);
    text(`NIGHT ${state.night} DONE — pick one upgrade`, FIELD.width / 2, 120, 40, PALETTE.gold, 'center', 'middle');
    text(`Orders served ${state.totalServed}  •  Coins ${state.coins}  •  Walkaways ${state.walkaways}/5`,
      FIELD.width / 2, 164, 22, PALETTE.text, 'center', 'middle');
    const cardW = 300;
    const gap = 30;
    const totalW = cardW * 3 + gap * 2;
    const startX = (FIELD.width - totalW) / 2;
    for (let i = 0; i < state.offeredUpgrades.length; i += 1) {
      const up = state.offeredUpgrades[i];
      const x = startX + i * (cardW + gap);
      const y = 220;
      panel(x, y, cardW, 220, PALETTE.panel);
      text(`[${i + 1}]`, x + cardW / 2, y + 52, 28, PALETTE.gold, 'center', 'middle');
      text(up.name, x + cardW / 2, y + 104, 26, PALETTE.text, 'center', 'middle');
      text(up.desc, x + cardW / 2, y + 150, 20, PALETTE.muted, 'center', 'middle');
      text('Click to take it', x + cardW / 2, y + 196, 18, PALETTE.jade, 'center', 'middle');
    }
    text(`Next: NIGHT ${state.night + 1} — target ${NIGHTS[state.night] ? NIGHTS[state.night].target : ''} orders`,
      FIELD.width / 2, 500, 22, PALETTE.text, 'center', 'middle');
  }

  function drawOver(state, best) {
    drawBackdrop(state);
    const won = state.won;
    // The verdict is written out in words, as the top entries do: YOU WIN! /
    // YOU LOSE! is the title, the festival line keeps the flavour.
    const title = won ? 'YOU WIN!' : 'YOU LOSE!';
    const lines = won
      ? [
          'FESTIVAL COMPLETE!',
          `You served the whole festival — ${state.totalServed} orders, ${state.coins} coins`,
          `Best combo x${state.bestCombo}  •  Perfect serves ${state.stats.perfect}  •  Burnt ${state.stats.burnt}`,
          `Walkaways ${state.walkaways}/5`,
          '',
          `SCORE ${state.coins}   •   BEST ${Math.max(best, state.coins)}`,
        ]
      : [
          'THE STALL GOES DARK',
          state.loseReason,
          `Orders served ${state.totalServed}  •  Coins ${state.coins}  •  Best combo x${state.bestCombo}`,
          `You reached Night ${state.night}/3`,
          '',
          `SCORE ${state.coins}   •   BEST ${Math.max(best, state.coins)}`,
        ];
    drawPanelScreen(title, lines, 'PRESS R OR CLICK TO PLAY AGAIN', won ? PALETTE.gold : PALETTE.danger);
  }

  /** Paint one frame: the stall, then the HUD or a panel for the screen the game is on. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    if (screen === SCREEN_SHOP) {
      drawShop(state);
      return;
    }
    if (screen === SCREEN_OVER) {
      drawOver(state, best);
      return;
    }
    // The rush cover is staged with the hero composition (state.heroShot, set by
    // shots.js): festival mood first, HUD compressed, WIN/LOSE prominent. The
    // live game and the other shots never set it, so they render as before.
    const hero = state.heroShot === true;
    drawBackdrop(state, hero);
    drawHud(state, hero);
    drawCustomers(state, hero);
    drawGrill(state, hero);
    drawHeat(state);
    drawBins(state);
    drawHand(state);
    drawFan(state);
    drawHint();
    drawToasts(state);
    if (screen === SCREEN_PAUSED) {
      drawPanelScreen('Paused', ['The coals will wait for you.'], 'Press P to resume', PALETTE.text);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
