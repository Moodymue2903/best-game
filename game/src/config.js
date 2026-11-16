// SKEWERFEST rules in one place: win by serving the night's orders before
// closing (under 5 walkaways); golden window 50-90%, perfect 60-80% = 1.5x;
// wind Night 2 and rain Night 3 decay the heat; one upgrade between nights.
// Every tuning number, colour, recipe and layout rect is here. The playfield
// is a fixed 1280x720 logical area; the renderer scales it to the window, so
// no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Doneness: 0-100. Servable in the golden window; above BURNT it is ruined. */
export const DONENESS = { goldenLow: 50, goldenHigh: 90, burnt: 95 };
/** Base doneness per second at heat 100 (multiplied by heat/100, clamped). */
export const COOK_RATE = 14;
/** Heat 0-100. Cooking rate multiplier is heat/100, clamped to [0.15, 1.2]. */
export const HEAT = { start: 70, fanBoost: 25, fanCooldown: 1.5, minRate: 0.15, maxRate: 1.2 };

export const MAX_WALKAWAYS = 5;
export const MAX_COMBO = 5;
export const MAX_CUSTOMERS = 4;
export const BASE_GRILL_SLOTS = 5;
export const MAX_GRILL_SLOTS = 7;
export const MAX_HAND = 3;

/** Ingredients. Each has a colour, a short label and a key. `mark` is the short
 * text drawn inside the ingredient's circle: Prawn and Pepper share the initial
 * P, so they carry distinct two-letter marks (Pr / Pe) instead of first letters. */
export const INGREDIENTS = [
  { id: 'chicken', label: 'Chicken', key: '1', color: '#f4a259', mark: 'C' },
  { id: 'prawn', label: 'Prawn', key: '2', color: '#ff7f7f', mark: 'Pr' },
  { id: 'mushroom', label: 'Mushroom', key: '3', color: '#d9c7a7', mark: 'M' },
  { id: 'pepper', label: 'Pepper', key: '4', color: '#2ec4a6', mark: 'Pe' },
  { id: 'tofu', label: 'Tofu', key: '5', color: '#fff3d6', mark: 'T' },
];

/** Recipes: an exact ingredient set (order does not matter), a coin value and a cook factor. */
export const RECIPES = [
  { id: 'chicken', name: 'Chicken Skewer', needs: ['chicken', 'chicken'], coins: 10, cook: 1.0, fromNight: 1 },
  { id: 'prawn', name: 'Prawn Skewer', needs: ['prawn', 'prawn'], coins: 14, cook: 1.1, fromNight: 1 },
  { id: 'garden', name: 'Garden Skewer', needs: ['mushroom', 'pepper'], coins: 12, cook: 0.9, fromNight: 1 },
  { id: 'surfturf', name: 'Surf & Turf', needs: ['chicken', 'prawn'], coins: 18, cook: 1.0, fromNight: 1 },
  { id: 'tofu', name: 'Tofu Skewer', needs: ['tofu', 'tofu'], coins: 12, cook: 0.85, fromNight: 2 },
  { id: 'mixed', name: 'Festival Mixed', needs: ['chicken', 'mushroom', 'pepper'], coins: 22, cook: 1.0, fromNight: 3 },
];

/** Customer types: patience in seconds, tip factor, and how often they appear. */
export const CUSTOMER_TYPES = {
  runner: { label: 'Runner', patience: 18, tip: 0.3, color: '#ffd166', weight: 3, fromNight: 1 },
  regular: { label: 'Regular', patience: 28, tip: 0.5, color: '#2ec4a6', weight: 3, fromNight: 1 },
  family: { label: 'Family', patience: 36, tip: 0.8, color: '#e63b2e', weight: 1, fromNight: 1, orders: 2 },
  critic: { label: 'Critic', patience: 14, tip: 1.5, color: '#b388ff', weight: 1, fromNight: 3 },
};

/** One night: target orders, time limit, spawn interval, heat decay, weather. */
export const NIGHTS = [
  { target: 8, time: 90, spawn: 7.0, heatDecay: 2.0, weather: 'calm' },
  { target: 12, time: 105, spawn: 5.5, heatDecay: 3.0, weather: 'wind' },
  { target: 16, time: 120, spawn: 4.5, heatDecay: 4.0, weather: 'rain' },
];
/** Rush hour: the middle of each night — spawns twice as fast, patience drains faster. */
export const RUSH = { window: 30, spawnFactor: 0.5, patienceFactor: 1.25 };

/** Upgrades offered between nights: pick one of three. */
export const UPGRADES = [
  { id: 'grill', name: 'Bigger Grill', desc: '+2 grill slots', apply: (u) => { u.grillSlots = Math.min(MAX_GRILL_SLOTS, u.grillSlots + 2); } },
  { id: 'fan', name: 'Brass Fan', desc: 'Coals cool 40% slower', apply: (u) => { u.heatDecayMul *= 0.6; } },
  { id: 'charm', name: 'Patience Charm', desc: 'Customers wait 20% longer', apply: (u) => { u.patienceMul *= 1.2; } },
  { id: 'spice', name: 'Spice Kit', desc: '+50% tips', apply: (u) => { u.tipMul *= 1.5; } },
  { id: 'coals', name: 'Quick Coals', desc: 'Cooks 15% faster', apply: (u) => { u.cookMul *= 1.15; } },
];

/** Layout rects (logical 1280x720). Render and input both read these. */
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 56 },
  customers: { x: 40, y: 64, w: 1200, h: 112, cardW: 288, gap: 16 },
  grill: { x: 40, y: 192, w: 1200, h: 228 },
  heat: { x: 40, y: 428, w: 1200, h: 40 },
  bins: { x: 40, y: 492, w: 700, h: 148, binW: 128, gap: 12 },
  hand: { x: 780, y: 492, w: 240, h: 148 },
  fan: { x: 1060, y: 492, w: 180, h: 148 },
  hint: { x: 40, y: 656, w: 1200, h: 40 },
};

/** The rects of the grill's slots for a given slot count (shared by render and input). */
export function grillSlotRects(count) {
  const g = LAYOUT.grill;
  const pad = 24;
  const gap = 16;
  const w = (g.w - pad * 2 - gap * (count - 1)) / count;
  const rects = [];
  for (let i = 0; i < count; i += 1) {
    rects.push({ x: g.x + pad + i * (w + gap), y: g.y + 32, w, h: 138 });
  }
  return rects;
}

export const PALETTE = {
  backdrop: '#1e1a17',
  stall: '#2a211c',
  awning: '#e63b2e',
  awningStripe: '#fff3d6',
  jade: '#2ec4a6',
  cream: '#fff3d6',
  gold: '#ffc53d',
  ember: '#ff6b2c',
  coal: '#3a2e28',
  coalHot: '#ff8c42',
  text: '#fff3d6',
  muted: '#b8a894',
  panel: '#2a211c',
  panelEdge: '#4a3a30',
  danger: '#e63b2e',
  good: '#2ec4a6',
  golden: '#ffc53d',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'skewerfest.best';
