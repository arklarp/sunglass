// The four stills that ship with the entry, each staged from the real game and frozen: the final
// cover (day 7, the Storm King, a full glass network), the verb on an early day, the route card and
// the burial. Same seed, same code that plays the game.

import { ARENA } from './config.js';

// Fuse a glass path between two points, with a hand-drawn wobble and a lit tail.
function fuse(network, fromX, fromY, toX, toY, colour, steps = 16) {
  let px = fromX;
  let py = fromY;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const bend = Math.sin(t * Math.PI * 1.3) * 30 * (1 - t * 0.4);
    const x = fromX + (toX - fromX) * t + bend * 0.5;
    const y = fromY + (toY - fromY) * t + Math.cos(t * Math.PI * 0.9) * 22;
    network.add(px, py, x, y, colour);
    px = x;
    py = y;
  }
  network.add(px, py, toX, toY, colour);
  return { x: toX, y: toY };
}

export function stageShot(name, ctx) {
  const { state, yacht, input, draw, newDay } = ctx;

  if (name === 'title') {
    // The menu itself: how to play, the omens, the route strip and the one call to action.
    state.screen = 'title';
    state.time = 3.4;
    state.seed = 11;
    draw();
    return;
  }

  if (name === 'cover') {
    // Day 7: the Storm King on screen at phase 2, a network across the dunes, a chain running.
    state.seed = 11;
    state.relics = [
      { id: 'wide', name: 'WIDE LENS', note: 'the beam sinters 25% further' },
      { id: 'hard', name: 'TEMPERED GLASS', note: 'your paths hold twice as long' },
      { id: 'ember', name: 'EMBER LENS', note: 'red paths burn spirits twice as fast' },
    ];
    state.routeModifier = null;
    newDay(7);
    const day = state.day;
    state.screen = 'play';
    state.score = 18420;

    const src = day.source;
    const [b1, b2, b3] = day.ports;
    // A network that crosses the frame: two trunks and a branch, in three glass colours.
    fuse(day.network, src.x, src.y, b1.x, b1.y, 'amber', 16);
    fuse(day.network, src.x, src.y, b2.x, b2.y, 'red', 20);
    fuse(day.network, b2.x, b2.y, b3.x, b3.y, 'red', 16);
    fuse(day.network, b1.x, b1.y, b3.x - 60, b3.y + 90, 'blue', 14);
    fuse(day.network, b2.x - 40, b2.y + 30, b1.x + 30, b3.y - 20, 'amber', 12);
    // A dense stained-glass web: trunks, branches and dead-end veins across the dunes.
    fuse(day.network, b1.x - 30, b1.y + 60, b1.x - 210, b1.y + 190, 'amber', 10);
    fuse(day.network, src.x + 120, src.y + 60, src.x + 80, src.y + 210, 'blue', 8);
    fuse(day.network, b3.x - 120, b3.y + 120, b3.x - 330, b3.y + 180, 'amber', 10);
    fuse(day.network, src.x, src.y, src.x + 90, src.y + 170, 'blue', 9);
    fuse(day.network, src.x + 90, src.y + 170, src.x + 300, src.y + 210, 'blue', 9);
    fuse(day.network, src.x + 300, src.y + 210, src.x + 430, src.y + 130, 'amber', 9);
    fuse(day.network, b1.x, b1.y, b1.x + 150, b1.y - 120, 'amber', 9);
    fuse(day.network, b1.x + 150, b1.y - 120, b1.x + 330, b1.y - 90, 'amber', 8);
    fuse(day.network, b2.x, b2.y, b2.x + 130, b2.y + 150, 'red', 9);
    fuse(day.network, b2.x + 130, b2.y + 150, b2.x + 300, b2.y + 210, 'red', 8);
    fuse(day.network, b3.x, b3.y, b3.x - 40, b3.y + 170, 'amber', 8);
    day.network.rebuild();

    day.stormX = 1030;
    day.stormSpeed = 80;
    day.boss.x = 980;
    day.boss.y = 380;
    day.boss.hp = day.boss.maxHp * 0.46;
    day.boss.phase = 2;
    day.combo = 5;
    day.comboTimer = 2.4;
    day.popup(700, 300, '+600', '#ffe9a8');
    day.popup(760, 560, '+480', '#ffd166');
    day.popup(520, 620, '+240', '#ffe9a8');

    yacht.x = 620;
    yacht.y = 470;
    yacht.vx = 90;
    yacht.vy = -30;
    yacht.angle = -0.25;
    yacht.firing = true;
    yacht.sintering = true;
    yacht.lastPoint = { x: b3.x - 120, y: b3.y + 40 };
    yacht.lens.x = b3.x - 10;
    yacht.lens.y = b3.y + 10;
    yacht.dust = [];

    input.firing = true;
    input.colour = 'red';
    input.mouse.x = yacht.lens.x;
    input.mouse.y = yacht.lens.y;

    const spots = [
      [560, 360, { eating: true }],
      [640, 560, { frozen: 1.4 }],
      [470, 640, { burn: 0.7 }],
      [760, 380, {}],
      [700, 640, { burn: 0.6 }],
      [860, 540, { frozen: 1.2 }],
      [400, 500, {}],
      [520, 450, { eating: true }],
    ];
    spots.forEach(([x, y, flags], index) => {
      const spirit = day.spirits[index];
      if (!spirit) return;
      spirit.x = x;
      spirit.y = y;
      Object.assign(spirit, flags);
    });

    state.time = 62.4;
    draw();
    return;
  }

  if (name === 'verb') {
    // Day 2, half a network, everything labelled: the shot that teaches the verb.
    state.seed = 11;
    state.relics = [{ id: 'wide', name: 'WIDE LENS', note: 'the beam sinters 25% further' }];
    state.routeModifier = null;
    newDay(2);
    const day = state.day;
    state.screen = 'play';
    state.score = 3120;
    const src = day.source;
    const [b1, b2] = day.ports;
    fuse(day.network, src.x, src.y, b1.x, b1.y, 'amber', 18);
    const cut = day.network.segments[Math.floor(day.network.segments.length / 2)];
    if (cut) cut.hp = 12;
    day.network.rebuild();
    day.popup(src.x + 220, src.y + 40, 'FUSE GLASS', '#6effd6');
    day.popup(src.x, src.y - 60, 'SUN-LENS', '#ffd166');
    day.popup(b2.x - 30, b2.y - 54, 'AIM HERE', '#ffd166');

    day.stormX = 1180;
    day.stormSpeed = 30;
    yacht.x = 520;
    yacht.y = 520;
    yacht.angle = -0.1;
    yacht.firing = true;
    yacht.sintering = true;
    yacht.lastPoint = { x: b2.x - 200, y: b2.y - 30 };
    yacht.lens.x = b2.x - 60;
    yacht.lens.y = b2.y - 10;
    yacht.dust = [];
    input.firing = true;
    input.colour = 'amber';
    input.mouse.x = yacht.lens.x;
    input.mouse.y = yacht.lens.y;
    day.spirits.forEach((spirit, index) => {
      spirit.x = 760 + index * 90;
      spirit.y = 400 + index * 70;
    });

    state.time = 24.6;
    draw();
    return;
  }

  if (name === 'win') {
    // The other end of the arc: the run held, the Storm King broken, the card with grades.
    state.seed = 11;
    state.relics = [
      { id: 'wide', name: 'WIDE LENS', note: 'the beam sinters 25% further' },
      { id: 'hard', name: 'TEMPERED GLASS', note: 'your paths hold twice as long' },
      { id: 'ember', name: 'EMBER LENS', note: 'red paths burn spirits twice as fast' },
    ];
    state.routeModifier = null;
    newDay(7);
    const day = state.day;
    const src = day.source;
    day.ports.forEach((port, index) => {
      fuse(day.network, index === 0 ? src.x : day.ports[index - 1].x, index === 0 ? src.y : day.ports[index - 1].y, port.x, port.y, index === 1 ? 'blue' : 'amber', 15);
    });
    day.network.rebuild();
    day.boss.hp = 0;
    day.boss.alive = false;
    day.stormX = 250;
    day.stormSpeed = 0;
    yacht.x = 700;
    yacht.y = 470;
    yacht.angle = -0.15;
    yacht.firing = false;
    input.firing = false;
    day.ports.forEach((port) => { port.lit = true; });

    state.screen = 'win';
    state.hideLabels = true;
    state.score = 23740;
    state.totalLit = 21;
    state.glassLength = 4820;
    state.pathsLost = 1;
    state.grade = 'S';
    state.feats = [
      'The Storm King broken',
      'Day 7: every beacon lit',
      'No path lost all day',
      'Broke the storm early',
      'Forty paths fused in one storm',
      'All six relics carried',
    ];
    state.time = 104.2;
    draw();
    return;
  }

  if (name === 'route') {
    state.seed = 11;
    state.relics = [{ id: 'wide', name: 'WIDE LENS', note: 'the beam sinters 25% further' }];
    state.routeModifier = null;
    newDay(3);
    state.screen = 'route';
    state.day.number = 3;
    state.score = 6420;
    state.routeChoices = [
      { name: 'CALM DUNES', note: 'fewer eaters, one beacon less pressure', kind: 'calm' },
      { name: 'GLASS GARDEN', note: 'one more relic, a faster storm', kind: 'garden' },
    ];
    state.time = 31.2;
    draw();
    return;
  }

  // The burial: the wall over the yacht, the network cut, the card with grade and feats.
  state.seed = 11;
  state.relics = [];
  state.routeModifier = null;
  newDay(4);
  const day = state.day;
  state.screen = 'lose';
  state.hideLabels = true;
  const src = day.source;
  // A run's worth of glass, so the flood has something to eat.
  day.ports.forEach((port) => fuse(day.network, src.x, src.y, port.x, port.y, 'amber', 14));
  fuse(day.network, src.x + 60, src.y + 40, src.x + 300, src.y + 150, 'blue', 10);
  fuse(day.network, src.x + 300, src.y + 150, src.x + 470, src.y + 60, 'amber', 10);
  day.network.rebuild();
  day.stormX = 250;
  day.network.consume(230);
  // Crack the network: a third of the paths snapped by the sand.
  day.network.segments.forEach((segment, index) => {
    if (index % 3 === 0) segment.hp = 0;
  });
  day.network.rebuild();
  day.ports.forEach((port) => { port.lit = false; });
  yacht.x = 600;
  yacht.y = 470;
  yacht.angle = 0.5;
  yacht.vx = 10;
  yacht.alive = false;
  yacht.firing = false;
  yacht.dust = [];
  input.firing = false;
  day.popup(yacht.x, yacht.y - 80, 'BURIED', '#ff9a9a');
  day.popup(yacht.x + 120, yacht.y - 40, 'PATH CUT', '#ff8f9a');

  state.score = 5840;
  state.totalLit = 1;
  state.glassLength = 940;
  state.pathsLost = 4;
  state.grade = 'C';
  state.feats = ['Day 1: every beacon lit', 'Broke the storm early', 'No path lost all day'];
  state.time = 58.6;
  draw();
  void ARENA;
}