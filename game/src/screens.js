// The screens around the run: the title with its hero scene, omens and feature strip, the branching
// route, the relic draft, and the two big cards that end a run — a real WIN and a real burial.

import { PALETTE, ARENA, RELICS, font } from './config.js';
import { panel, fitText, wrapText } from './hud.js';

const SANS = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';

function spaced(ctx, text, centreX, y, gap, size, weight) {
  ctx.font = font(size, weight);
  const widths = [...text].map((letter) => ctx.measureText(letter).width + gap);
  const total = widths.reduce((a, b) => a + b, 0) - gap;
  let cursor = centreX - total / 2;
  [...text].forEach((letter, index) => {
    ctx.fillText(letter, cursor, y);
    cursor += widths[index];
  });
}

export function drawTitle(ctx, state) {
  // The hero scene is drawn by the game behind this: only a soft scrim goes here, so the yacht on
  // the lit crest and the glass below it stay visible.
  const scrim = ctx.createLinearGradient(0, 0, 0, ARENA.h);
  scrim.addColorStop(0, 'rgba(14,8,22,0.86)');
  scrim.addColorStop(0.46, 'rgba(18,10,24,0.7)');
  scrim.addColorStop(1, 'rgba(24,12,20,0.32)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);

  ctx.textAlign = 'center';
  spaced(ctx, 'THE LAST DESERT · SEVEN STORM DAYS', ARENA.w / 2, 70, 4, 13, 800);
  ctx.fillStyle = '#ffcf8a';

  // Logo: bigger, bolder, gold into glass.
  const logo = ctx.createLinearGradient(ARENA.w / 2 - 340, 110, ARENA.w / 2 + 340, 210);
  logo.addColorStop(0, '#ffe9a8');
  logo.addColorStop(0.5, '#ffb066');
  logo.addColorStop(1, '#8ff0ff');
  ctx.save();
  ctx.fillStyle = logo;
  ctx.strokeStyle = 'rgba(26,12,20,0.7)';
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(255,180,110,0.55)';
  ctx.shadowBlur = 48;
  spaced(ctx, 'SUNGLASS', ARENA.w / 2, 178, 16, 90, 900);
  ctx.restore();

  ctx.font = font(19, 700);
  ctx.fillStyle = 'rgba(255,244,222,0.94)';
  ctx.fillText('sail the last desert and draw sunlight into glass', ARENA.w / 2, 212);
  ctx.font = font(14, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.62)';
  ctx.fillText('the storm is already on the horizon', ARENA.w / 2, 234);

  // HOW TO PLAY: wrapped, inside its box.
  const cardW = 780;
  const cardX = ARENA.w / 2 - cardW / 2;
  panel(ctx, cardX, 252, cardW, 100, 0.9);
  ctx.textAlign = 'left';
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('HOW TO PLAY', cardX + 22, 276);
  ctx.font = font(16, 600);
  const lines = wrapText(ctx, 'WASD sails the dune-runner · the mouse aims the crystal lens · hold the button to sinter glass, and drag to draw a path from the sun-lens to every beacon of the day.', cardW - 44, 3);
  ctx.fillStyle = '#fff9ec';
  lines.forEach((line, index) => ctx.fillText(line, cardX + 22, 298 + index * 19));
  ctx.font = font(15, 800);
  ctx.fillStyle = '#b6ffc4';
  ctx.fillText('WIN  light every beacon', cardX + 22, 354);
  ctx.fillStyle = '#ff9a9a';
  ctx.fillText('LOSE  the storm wall reaches you', cardX + 240, 354);

  // The feature strip: big digits, one small icon per column.
  const features = [
    ['7', 'STORM DAYS', '#ffe9a8'],
    ['2', 'ROUTES', '#6effd6'],
    ['3', 'SPIRITS', '#a97bff'],
    ['6', 'RELICS', '#ffd166'],
    ['1', 'STORM KING', '#c98aff'],
    ['∞', 'SAME SEED', '#9dffb0'],
  ];
  panel(ctx, cardX, 362, cardW, 74, 0.86);
  features.forEach(([value, label, colour], index) => {
    const x = cardX + 30 + index * (cardW - 60) / features.length;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x + 6, 382, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = font(34, 900);
    ctx.fillStyle = '#fff4de';
    ctx.fillText(value, x, 404);
    ctx.font = font(11, 800);
    ctx.fillStyle = 'rgba(255,244,222,0.62)';
    ctx.fillText(label, x, 422);
  });

  // Omens and the route, side by side.
  const sideY = 448;
  const sideW = 382;
  panel(ctx, cardX, sideY, sideW, 124, 0.88);
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('OMENS — PRESS 1 2 3', cardX + 22, sideY + 24);
  state.omens.forEach((omen, index) => {
    const y = sideY + 52 + index * 26;
    ctx.font = font(15, 800);
    ctx.fillStyle = omen.on ? PALETTE.beacon : 'rgba(255,244,222,0.42)';
    ctx.fillText(`${omen.on ? '◆' : '◇'}  ${index + 1}   ${omen.name}`, cardX + 22, y);
    fitText(ctx, omen.note, 166, 13, 600);
    ctx.fillStyle = 'rgba(255,244,222,0.66)';
    ctx.fillText(omen.note, cardX + 200, y);
  });

  panel(ctx, cardX + sideW + 16, sideY, cardW - sideW - 16, 124, 0.88);
  const routeX = cardX + sideW + 38;
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('THE ROUTE', routeX, sideY + 24);
  const stops = ['FIRST LIGHT', 'GLASS-EATERS', 'SPLIT DUNES', 'STORM KING'];
  stops.forEach((stop, index) => {
    const x = routeX + 20 + index * 92;
    ctx.fillStyle = index === stops.length - 1 ? PALETTE.glassRed : PALETTE.beacon;
    ctx.beginPath();
    ctx.arc(x, sideY + 54, 9, 0, Math.PI * 2);
    ctx.fill();
    if (index < stops.length - 1) {
      ctx.strokeStyle = 'rgba(255,244,222,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 11, sideY + 54);
      ctx.lineTo(x + 81, sideY + 54);
      ctx.stroke();
    }
    ctx.font = font(10, 800);
    ctx.fillStyle = 'rgba(255,244,222,0.62)';
    ctx.textAlign = 'center';
    ctx.fillText(stop, x, sideY + 78);
    ctx.textAlign = 'left';
  });
  ctx.font = font(12, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.55)';
  ctx.fillText('each clear drafts a relic and picks a route', routeX, sideY + 104);

  // One call to action.
  const pulse = 0.6 + 0.4 * Math.sin(state.time * 2.4);
  const pillW = 360;
  ctx.fillStyle = `rgba(255,214,140,${0.2 + pulse * 0.14})`;
  ctx.beginPath();
  ctx.roundRect(ARENA.w / 2 - pillW / 2, 600, pillW, 54, 27);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,226,170,${0.55 + pulse * 0.4})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = font(20, 900);
  ctx.fillStyle = PALETTE.beacon;
  ctx.fillText('PRESS SPACE TO SAIL', ARENA.w / 2, 636);
  ctx.font = font(12, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.55)';
  ctx.fillText('R restart  ·  M sound  ·  seeds replay identically', ARENA.w / 2, 672);
  ctx.textAlign = 'left';
}

export function drawRoute(ctx, state) {
  ctx.fillStyle = 'rgba(16,8,22,0.74)';
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);
  ctx.textAlign = 'center';
  ctx.font = font(40, 900);
  ctx.fillStyle = '#fff4de';
  ctx.fillText(`DAY ${state.day.number} CLEARED`, ARENA.w / 2, 214);
  ctx.font = font(15, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.66)';
  ctx.fillText('choose the next stretch of desert — each one changes what the storm sends', ARENA.w / 2, 244);

  state.routeChoices.forEach((choice, index) => {
    const w = 420;
    const h = 168;
    const x = ARENA.w / 2 - w - 24 + index * (w + 48);
    const y = 300;
    panel(ctx, x, y, w, h, 0.9);
    ctx.textAlign = 'left';
    ctx.font = font(22, 900);
    ctx.fillStyle = PALETTE.beacon;
    ctx.fillText(`${index + 1}. ${choice.name}`, x + 24, y + 44);
    ctx.font = font(15, 600);
    ctx.fillStyle = '#fff4de';
    fitText(ctx, choice.note, w - 48, 15, 600);
    ctx.fillText(choice.note, x + 24, y + 76);
    ctx.font = font(13, 600);
    ctx.fillStyle = 'rgba(255,244,222,0.58)';
    ctx.fillText(choice.kind === 'calm' ? 'the wall keeps its distance longer' : 'richer glass, but the wall runs', x + 24, y + 100);
    ctx.font = font(13, 800);
    ctx.fillStyle = PALETTE.accent;
    ctx.fillText(`PRESS ${index + 1} OR CLICK`, x + 24, y + 140);
  });
  ctx.textAlign = 'left';
}

export function drawRelicPick(ctx, state) {
  ctx.fillStyle = 'rgba(16,8,22,0.78)';
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);
  ctx.textAlign = 'center';
  ctx.font = font(34, 900);
  ctx.fillStyle = '#fff4de';
  ctx.fillText('GLASS FROM THE DUNES', ARENA.w / 2, 218);
  ctx.font = font(15, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.66)';
  ctx.fillText('take one relic into the next storm day', ARENA.w / 2, 246);

  state.relicChoices.forEach((relic, index) => {
    const w = 400;
    const h = 150;
    const x = ARENA.w / 2 - w - 20 + index * (w + 40);
    const y = 300;
    panel(ctx, x, y, w, h, 0.9);
    ctx.textAlign = 'left';
    ctx.font = font(20, 900);
    ctx.fillStyle = PALETTE.glassLit;
    ctx.fillText(relic.name, x + 24, y + 44);
    ctx.font = font(15, 600);
    ctx.fillStyle = '#fff4de';
    fitText(ctx, relic.note, w - 48, 15, 600);
    ctx.fillText(relic.note, x + 24, y + 76);
    ctx.font = font(13, 800);
    ctx.fillStyle = PALETTE.accent;
    ctx.fillText(`PRESS ${index + 1} OR CLICK`, x + 24, y + 124);
  });
  ctx.textAlign = 'left';
}

// The end cards: an opaque report, the grade, a two-column table, feats, and two ways out.
export function drawEnd(ctx, state) {
  const won = state.screen === 'win';
  ctx.fillStyle = won ? 'rgba(64,28,10,0.18)' : 'rgba(10,5,16,0.44)';
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);

  ctx.textAlign = 'center';

  // The drift that ate the yacht, at the bottom of the frame under the title: a rising bank of sand
  // with the bow and a snapped mast still out of it, sail torn.
  if (!won) {
    ctx.save();
    ctx.translate(ARENA.w / 2, 700);
    const drift = ctx.createLinearGradient(0, -80, 0, 90);
    drift.addColorStop(0, '#d79a5c');
    drift.addColorStop(0.55, '#b0763f');
    drift.addColorStop(1, '#6d4526');
    ctx.fillStyle = drift;
    ctx.beginPath();
    ctx.moveTo(-260, 90);
    ctx.quadraticCurveTo(-150, -46, -40, -22);
    ctx.quadraticCurveTo(60, -4, 150, -34);
    ctx.quadraticCurveTo(230, -56, 268, 90);
    ctx.closePath();
    ctx.fill();
    // Wind-carved ripples on the drift.
    ctx.strokeStyle = 'rgba(255,226,180,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-210 + i * 8, 40 + i * 10);
      ctx.quadraticCurveTo(-120, 6 + i * 12, -20 + i * 10, 26 + i * 9);
      ctx.stroke();
    }
    // The bow, canted over, half swallowed.
    ctx.translate(-10, -14);
    ctx.rotate(-0.34);
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath();
    ctx.moveTo(52, 0);
    ctx.quadraticCurveTo(14, -16, -40, -10);
    ctx.quadraticCurveTo(-52, 0, -40, 10);
    ctx.quadraticCurveTo(14, 16, 52, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f4c98a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Snapped mast and a torn sail.
    ctx.strokeStyle = '#3a2318';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, -96);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,238,196,0.92)';
    ctx.beginPath();
    ctx.moveTo(6, -96);
    ctx.lineTo(70, -60);
    ctx.lineTo(14, -46);
    ctx.lineTo(30, -34);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.font = font(won ? 54 : 60, 900);
  ctx.strokeStyle = 'rgba(24,10,16,0.85)';
  ctx.lineWidth = 6;
  const headline = won ? 'THE DESERT IS GLASS' : 'BURIED IN SAND';
  const colour = won ? '#ffe9a8' : '#e8b071';
  ctx.strokeText(headline, ARENA.w / 2, won ? 210 : 250);
  ctx.fillStyle = colour;
  ctx.fillText(headline, ARENA.w / 2, won ? 210 : 250);

  ctx.font = font(16, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.9)';
  ctx.fillText(
    won
      ? `all ${state.day.ports.length} beacons lit · the storm broke on your glass`
      : `the storm wall took the yacht on day ${state.day.number} · ${state.totalLit} beacon${state.totalLit === 1 ? '' : 's'} lit`,
    ARENA.w / 2,
    won ? 242 : 288,
  );

  // The report card: opaque, centred, roomy.
  const cardW = 660;
  const cardH = 300;
  const cardX = ARENA.w / 2 - cardW / 2;
  const cardY = won ? 264 : 312;
  panel(ctx, cardX, cardY, cardW, cardH, 1);
  ctx.textAlign = 'left';
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('RUN REPORT', cardX + 26, cardY + 30);

  ctx.font = font(112, 900);
  ctx.fillStyle = won ? '#ffe9a8' : '#ff9a9a';
  ctx.fillText(state.grade, cardX + 26, cardY + 148);
  ctx.font = font(11, 800);
  ctx.fillStyle = 'rgba(255,244,222,0.5)';
  ctx.fillText('RANK', cardX + 40, cardY + 168);

  const left = [
    ['SCORE', String(Math.round(state.score))],
    ['DAYS SURVIVED', `${won ? 7 : state.day.number - 1} of 7`],
    ['GLASS LAID', `${Math.round(state.glassLength)} m`],
  ];
  const right = [
    ['PATHS LOST', String(state.pathsLost)],
    ['RELICS', state.relics.length ? `${state.relics.length} of 6` : 'none'],
    ['SEED', String(state.seed)],
  ];
  const column = (rows, x) => {
    rows.forEach(([label, value], index) => {
      const y = cardY + 66 + index * 30;
      ctx.font = font(11, 800);
      ctx.fillStyle = 'rgba(255,244,222,0.5)';
      ctx.fillText(label, x, y);
      ctx.font = font(16, 800);
      ctx.fillStyle = '#fff4de';
      ctx.fillText(value, x, y + 16);
    });
  };
  column(left, cardX + 150);
  column(right, cardX + 420);

  // Feats: icon rows, two columns.
  ctx.font = font(11, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('FEATS', cardX + 26, cardY + 186);
  state.feats.slice(0, 4).forEach((feat, index) => {
    const y = cardY + 210 + Math.floor(index / 2) * 26;
    const x = cardX + 40 + (index % 2) * 320;
    ctx.fillStyle = '#9dffb0';
    ctx.beginPath();
    ctx.arc(x - 8, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = font(12, 600);
    ctx.fillStyle = 'rgba(255,244,222,0.88)';
    fitText(ctx, feat, 300, 12, 600);
    ctx.fillText(feat, x, y);
  });

  // Two buttons, the only two ways out.
  const buttons = won
    ? [['R', 'PLAY AGAIN'], ['S', `SAME SEED · ${state.seed}`]]
    : [['R', 'PLAY AGAIN'], ['S', `SAME SEED · ${state.seed}`]];
  buttons.forEach(([key, label], index) => {
    const w = 260;
    const x = ARENA.w / 2 - w - 14 + index * (w + 28);
    const y = cardY + cardH + 26;
    ctx.fillStyle = index === 0 ? 'rgba(255,214,140,0.24)' : 'rgba(20,12,30,0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 48, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,226,170,0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = font(14, 900);
    ctx.fillStyle = '#fff4de';
    ctx.fillText(`${key}   ${label}`, x + w / 2, y + 30);
  });
  ctx.textAlign = 'left';
  void RELICS;
  void SANS;
}