// SUNGLASS — the loop. Title, the storm days, the route between them, the relic picks, and the two
// cards that end a run. One canvas, one seed, deterministic staging for the screenshots.

import { ARENA, DAYS, RELICS, ROUTE, PALETTE } from './config.js';
import { makeRng } from './random.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { Yacht } from './player.js';
import { Day } from './world.js';
import { drawSky, drawDunes, drawSandGrain, drawStorm, drawLighting, drawDim } from './desert.js';
import { drawArena } from './render.js';
import { drawHud } from './hud.js';
import { drawTitle, drawRoute, drawRelicPick, drawEnd } from './screens.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || 11) || 11;

const canvas = document.getElementById('game');
canvas.width = ARENA.w;
canvas.height = ARENA.h;
const ctx = canvas.getContext('2d', { alpha: false });
const status = document.getElementById('status');

const input = new Input(canvas);
const sound = new Sound();
const yacht = new Yacht();

const state = {
  screen: 'title',
  time: 0,
  seed: seedParam,
  score: 0,
  day: null,
  relics: [],
  feats: [],
  omens: [
    { name: 'HUNGRY SANDS', note: 'one more glass-eater each day', on: false },
    { name: 'NARROW LENS', note: 'the beam reaches 20% less far', on: false },
    { name: 'LONG NIGHT', note: 'the storm moves 20% faster', on: false },
  ],
  routeChoices: ROUTE,
  relicChoices: [],
  hoverChoice: -1,
  totalLit: 0,
  glassLength: 0,
  pathsLost: 0,
  grade: 'C',
  input,
  yacht,
};

function announce(text) {
  if (status && status.textContent !== text) status.textContent = text;
}

function newDay(number) {
  const rng = makeRng(state.seed * 7919 + number * 131);
  const day = new Day(number, state.seed, state.relics, rng);
  const omenBoost = state.omens[0].on ? 1 : 0;
  const calmCut = state.routeModifier === 'calm' ? 1 : 0;
  day.spirits.forEach(() => {});
  for (let i = 0; i < omenBoost; i += 1) {
    const spawn = day.spirits[0];
    if (spawn) {
      const extra = Object.create(Object.getPrototypeOf(spawn));
      Object.assign(extra, JSON.parse(JSON.stringify(spawn)));
      extra.x = Math.min(ARENA.w - 120, spawn.x + 80);
      day.spirits.push(extra);
    }
  }
  if (calmCut) day.spirits.splice(0, Math.min(calmCut, day.spirits.length));
  if (state.omens[2].on) day.stormSpeed *= 1.2;
  yacht.reset();
  yacht.reachBonus = state.omens[1].on ? -ARENA.w * 0 : 0;
  if (state.omens[1].on) yacht.reachBonus = -66;
  applyRelics();
  state.day = day;
  state.routeModifier = null;
  announce(`Storm day ${number}: light ${day.ports.length} beacons.`);
}

function applyRelics() {
  yacht.speedBoost = state.relics.some((relic) => relic.id === 'sail') ? 1.15 : 1;
  yacht.reachBonus = (state.relics.some((relic) => relic.id === 'wide') ? 82 : 0) + (state.omens[1].on ? -66 : 0);
  if (state.relics.some((relic) => relic.id === 'hard')) {
    // Tempered glass: every segment the player lays gets twice the health.
    state.glassTough = true;
  }
}

function startRun(seed) {
  state.seed = seed;
  state.score = 0;
  state.relics = [];
  state.feats = [];
  state.totalLit = 0;
  state.glassLength = 0;
  state.pathsLost = 0;
  state.routeModifier = null;
  sound.unlock();
  newDay(1);
  state.screen = 'play';
}

function finishDay() {
  const day = state.day;
  state.score += day.score;
  state.totalLit += day.network.litBeacons();
  state.glassLength += day.network.totalLength();
  state.pathsLost += day.brokenCount;
  if (day.network.litBeacons() === day.ports.length && day.brokenCount === 0) state.feats.push('No path lost all day');
  if (day.network.litBeacons() === day.ports.length) state.feats.push(`Day ${day.number}: every beacon lit`);
  if (day.stormX > 700) state.feats.push('Broke the storm early');
  if (day.number === 7) {
    state.feats.push('The Storm King broken');
    endRun(true);
    return;
  }
  const rng = makeRng(state.seed + day.number * 977);
  state.relicChoices = rng.shuffle(RELICS.filter((relic) => !state.relics.some((owned) => owned.id === relic.id))).slice(0, 2);
  state.routeChoices = rng.shuffle(ROUTE);
  state.screen = 'route';
}

function endRun(won) {
  const score = state.score + (state.day ? state.day.score : 0);
  state.score = score;
  state.grade = won ? (score > 22000 ? 'S' : score > 14000 ? 'A' : 'B') : score > 9000 ? 'B' : 'C';
  if (won) sound.win();
  else sound.lose();
  state.screen = won ? 'win' : 'lose';
  announce(won ? 'All seven storm days held.' : 'Buried in sand.');
}

function pickRoute(index) {
  const choice = state.routeChoices[index];
  if (!choice) return;
  state.routeModifier = choice.kind;
  if (choice.kind === 'garden') state.score += 0;
  state.screen = 'relic';
  const rng = makeRng(state.seed + state.day.number * 313);
  const pool = RELICS.filter((relic) => !state.relics.some((owned) => owned.id === relic.id));
  state.relicChoices = rng.shuffle(pool).slice(0, 2);
}

function pickRelic(index) {
  const relic = state.relicChoices[index];
  if (relic) state.relics.push(relic);
  newDay(state.day.number + 1);
  state.screen = 'play';
}

function update(dt) {
  state.time += dt;
  state.hoverChoice = -1;

  if (input.hit('mute')) sound.toggleMute();

  if (state.screen === 'title') {
    if (input.hit('lens1')) state.omens[0].on = !state.omens[0].on;
    if (input.hit('lens2')) state.omens[1].on = !state.omens[1].on;
    if (input.hit('lens3')) state.omens[2].on = !state.omens[2].on;
    if (input.hit('go') || input.clicked) startRun(state.seed);
    return;
  }

  if (state.screen === 'route') {
    if (input.hit('lens1')) pickRoute(0);
    if (input.hit('lens2')) pickRoute(1);
    if (input.clicked) pickRoute(input.mouse.x < ARENA.w / 2 - 20 ? 0 : 1);
    return;
  }

  if (state.screen === 'relic') {
    if (input.hit('lens1')) pickRelic(0);
    if (input.hit('lens2')) pickRelic(1);
    if (input.clicked) pickRelic(input.mouse.x < ARENA.w / 2 - 18 ? 0 : 1);
    return;
  }

  if (state.screen === 'play') {
    if (input.hit('restart')) {
      startRun(state.seed);
      return;
    }
    if (input.hit('lens2')) input.colour = 'red';
    else if (input.hit('lens3')) input.colour = 'blue';
    else if (input.hit('lens1')) input.colour = 'amber';
    if (!input.colour) input.colour = 'amber';

    yacht.update(dt, input, state.day.network);
    if (input.pulsePressed) state.day.pulse(yacht);
    state.day.update(dt, yacht, input, sound);
    sound.setSintering(yacht.sintering, input.colour);
    state.score = state.score;

    if (state.day.lost) {
      endRun(false);
      return;
    }
    if (state.day.won) {
      finishDay();
      return;
    }
    return;
  }

  // Win and lose cards: R restarts with a new seed, S replays the same one.
  if (input.hit('restart')) startRun((state.seed * 1103515 + 12345) % 99991);
  if (input.down('down') && input.hit('go')) startRun(state.seed);
  if (input.hit('go')) startRun(state.seed);
}

function draw() {
  const time = state.time;
  const phase = state.seed * 0.37;
  drawSky(ctx, time, phase);
  drawDunes(ctx, phase, time);
  drawSandGrain(ctx, time, state.day ? state.day.stormX * 0.1 : 0);

  drawDim(ctx, state.screen === 'win' ? 0.08 : state.screen === 'lose' ? 0.16 : 0.18);

  if (state.day && state.screen !== 'title') {
    drawStorm(ctx, state.day.stormX, time, state.day.stormCloseness(yacht));
    drawArena(ctx, {
      day: state.day,
      yacht,
      input,
      time,
      sun: { x: 258, y: 168 },
      hideLabels: state.hideLabels || state.screen === 'win' || state.screen === 'lose',
    });
  } else if (state.day) {
    // On the title card the desert shows behind the menu, with the lens and a beacon for scale.
    drawArena(ctx, { day: state.day, yacht, input, time, sun: { x: 258, y: 168 }, hideSpirits: true, hideLabels: true });
    drawStorm(ctx, state.day.stormX, time, 0.2);
  }

  drawLighting(ctx, time);

  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'play') drawHud(ctx, state);
  else if (state.screen === 'route') drawRoute(ctx, state);
  else if (state.screen === 'relic') drawRelicPick(ctx, state);
  else drawEnd(ctx, state);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.034, Math.max(0.001, (now - last) / 1000));
  last = now;
  update(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

// A title-card desert: the yacht on a lit crest, a glass network already glowing below it.
newDay(1);
state.screen = 'title';
yacht.x = 300;
yacht.y = 700;
const hero = state.day;
const heroSource = hero.source;
const heroB1 = hero.ports[0];
for (let i = 1; i <= 14; i += 1) {
  const t = i / 14;
  hero.network.add(
    heroSource.x + (heroB1.x - heroSource.x) * (t - 1 / 14),
    heroSource.y + (heroB1.y - heroSource.y) * (t - 1 / 14) + Math.sin(t * 3) * 12,
    heroSource.x + (heroB1.x - heroSource.x) * t,
    heroSource.y + (heroB1.y - heroSource.y) * t + Math.sin(t * 3) * 12,
    'amber',
  );
}
for (let i = 1; i <= 8; i += 1) {
  const t = i / 8;
  hero.network.add(
    heroSource.x + 40 + t * 180,
    heroSource.y + 90 + t * 60,
    heroSource.x + 40 + (t - 1 / 8) * 180,
    heroSource.y + 90 + (t - 1 / 8) * 60,
    'blue',
  );
}
hero.network.rebuild();

window.addEventListener('resize', () => {
  canvas.style.width = '100%';
  canvas.style.height = '100%';
});

window.__sunglass = { state, yacht, input, draw, update, startRun, newDay, finishDay, endRun };

if (shotName) {
  stageShot(shotName, { state, yacht, input, draw, update, newDay, startRun, finishDay });
} else {
  requestAnimationFrame(frame);
}

void DAYS;
void PALETTE;