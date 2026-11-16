// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between five screens: title, play, paused, shop and over.
//
// ?seed=N fixes the run. ?shot=start|play|rush|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_BURNT, EVENT_FAN, EVENT_LOSE, EVENT_NIGHT, EVENT_PERFECT, EVENT_SERVE,
  EVENT_UPGRADE, EVENT_WALKAWAY, EVENT_WIN, createState, startGame, step,
} from './state.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const state = createState(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas, state, () => audio.setMuted(!audio.isMuted()));

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, state);
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let best = readBest();
  state.best = best;
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function handleSound(events) {
    if (events & EVENT_SERVE) audio.serve();
    if (events & EVENT_PERFECT) audio.perfect();
    if (events & EVENT_WALKAWAY) audio.walkaway();
    if (events & EVENT_BURNT) audio.burnt();
    if (events & EVENT_FAN) audio.fan();
    if (events & EVENT_NIGHT) audio.night();
    if (events & EVENT_UPGRADE) audio.night();
    if (events & EVENT_WIN) audio.win();
    if (events & EVENT_LOSE) audio.lose();
    const cooking = state.grill.slots.some((s) => s.active);
    if (cooking && state.screen === 'play') audio.startSizzle();
    else audio.stopSizzle();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART) {
      startGame(state);
      state.best = best;
      announce('New game. Night 1.');
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (state.screen === 'title' || state.screen === 'over') {
        startGame(state);
        state.best = best;
        announce('Playing. Night 1.');
      }
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (state.screen === 'play') {
        state.screen = 'paused';
        announce('Paused.');
      } else if (state.screen === 'paused') {
        state.screen = 'play';
        announce('Playing.');
      }
    }
  }

  function finishGame() {
    if (state.coins > best) {
      best = state.coins;
      state.best = best;
      saveBest(best);
    }
    announce(state.won
      ? `You win! Score ${state.coins}. Best ${best}.`
      : `Game over. Score ${state.coins}. Best ${best}.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (state.screen === 'play' || state.screen === 'shop') {
      while (accumulator >= STEP && state.screen === 'play') {
        const events = step(state, STEP);
        handleSound(events);
        if (events & (EVENT_WIN | EVENT_LOSE)) finishGame();
        accumulator -= STEP;
      }
      if (state.screen !== 'play') accumulator = 0;
    } else {
      accumulator = 0;
    }
    renderer.draw(state, state.screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders pile up unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === 'play') {
      state.screen = 'paused';
      announce('Paused.');
    }
  });

  announce('Skewerfest. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
