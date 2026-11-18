// The screens around the run: the title with its omens and feature strip, the branching route, the
// relic pick, and the two cards that end a run — a real WIN and a real LOSE.

import { PALETTE, ARENA, RELICS } from './config.js';
import { panel } from './hud.js';

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function spaced(ctx, text, centreX, y, gap, font) {
  ctx.font = font;
  const widths = [...text].map((letter) => ctx.measureText(letter).width + gap);
  const total = widths.reduce((a, b) => a + b, 0) - gap;
  let cursor = centreX - total / 2;
  [...text].forEach((letter, index) => {
    ctx.fillText(letter, cursor, y);
    cursor += widths[index];
  });
}

export function drawTitle(ctx, state) {
  // A real scrim: the desert stays visible at the edges, the type sits on darkness.
  const scrim = ctx.createRadialGradient(ARENA.w / 2, 400, 120, ARENA.w / 2, 400, 760);
  scrim.addColorStop(0, 'rgba(18,9,24,0.9)');
  scrim.addColorStop(0.55, 'rgba(23,11,26,0.75)');
  scrim.addColorStop(1, 'rgba(30,12,20,0.45)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);

  ctx.textAlign = 'center';
  ctx.font = `700 11px ${SANS}`;
  ctx.fillStyle = PALETTE.accent;
  spaced(ctx, 'THE LAST DESERT · SEVEN STORM DAYS', ARENA.w / 2, 96, 3, `700 11px ${SANS}`);

  // Wordmark: warm light inside, glass at the edges.
  ctx.save();
  ctx.font = `800 84px ${SANS}`;
  const wordmark = ctx.createLinearGradient(ARENA.w / 2 - 300, 120, ARENA.w / 2 + 300, 230);
  wordmark.addColorStop(0, '#ffe9a8');
  wordmark.addColorStop(0.45, '#ffb066');
  wordmark.addColorStop(1, '#8ff0ff');
  ctx.shadowColor = 'rgba(255,180,110,0.55)';
  ctx.shadowBlur = 44;
  ctx.fillStyle = wordmark;
  ctx.strokeStyle = 'rgba(30,14,20,0.55)';
  ctx.lineWidth = 3;
  const letters = [...'SUNGLASS'];
  const gap = 14;
  ctx.font = `800 84px ${SANS}`;
  const widths = letters.map((letter) => ctx.measureText(letter).width + gap);
  const total = widths.reduce((a, b) => a + b, 0) - gap;
  let cursor = ARENA.w / 2 - total / 2;
  letters.forEach((letter, index) => {
    ctx.strokeText(letter, cursor, 196);
    ctx.fillText(letter, cursor, 196);
    cursor += widths[index];
  });
  ctx.restore();

  ctx.font = `600 16px ${SANS}`;
  ctx.fillStyle = 'rgba(255,244,222,0.92)';
  ctx.fillText('sail the last desert and draw sunlight into glass', ARENA.w / 2, 232);
  ctx.font = `600 13px ${SANS}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('the storm is already on the horizon', ARENA.w / 2, 254);

  // How to play: one card, three readable beats.
  const cardW = 760;
  panel(ctx, ARENA.w / 2 - cardW / 2, 272, cardW, 100, 0.92);
  ctx.textAlign = 'left';
  ctx.font = `700 11px ${SANS}`;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('HOW TO PLAY', ARENA.w / 2 - cardW / 2 + 22, 296);
  ctx.font = `600 15px ${SANS}`;
  ctx.fillStyle = '#fff9ec';
  ctx.fillText('WASD sails the dune-runner · the mouse aims the crystal lens · hold the button to sinter glass.', ARENA.w / 2 - cardW / 2 + 20, 324);
  ctx.fillText('Drag across the sand to draw a path, and run it from the sun-lens to every beacon of the day.', ARENA.w / 2 - cardW / 2 + 22, 348);
  ctx.fillStyle = '#b6ffc4';
  ctx.fillText('WIN  light every beacon   ·   LOSE  the storm wall reaches you, or buries one', ARENA.w / 2 - cardW / 2 + 20, 368);

  // The feature strip.
  const features = [
    ['7', 'STORM DAYS'],
    ['2', 'ROUTES'],
    ['3', 'SPIRITS'],
    ['6', 'RELICS'],
    ['1', 'STORM KING'],
    ['∞', 'SAME SEED'],
  ];
  panel(ctx, ARENA.w / 2 - cardW / 2, 384, cardW, 62, 0.86);
  features.forEach(([value, label], index) => {
    const x = ARENA.w / 2 - cardW / 2 + 34 + index * (cardW - 68) / features.length;
    ctx.font = `800 22px ${SANS}`;
    ctx.fillStyle = PALETTE.beacon;
    ctx.fillText(value, x, 406);
    ctx.font = `700 9px ${SANS}`;
    ctx.fillStyle = PALETTE.uiDim;
    ctx.fillText(label, x, 422);
  });

  // Omens on the left, the route on the right.
  const sideW = 372;
  const sideY = 456;
  panel(ctx, ARENA.w / 2 - cardW / 2, sideY, sideW, 124, 0.86);
  ctx.font = `700 11px ${SANS}`;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('OMENS — PRESS TO SWITCH', ARENA.w / 2 - cardW / 2 + 20, sideY + 24);
  state.omens.forEach((omen, index) => {
    const y = sideY + 50 + index * 24;
    ctx.font = `700 12px ${SANS}`;
    ctx.fillStyle = omen.on ? PALETTE.beacon : 'rgba(255,244,222,0.4)';
    ctx.fillText(`${omen.on ? '◆' : '◇'}  ${index + 1}   ${omen.name}`, ARENA.w / 2 - cardW / 2 + 20, y);
    ctx.font = `600 11px ${SANS}`;
    ctx.fillStyle = PALETTE.uiDim;
    ctx.fillText(omen.note, ARENA.w / 2 - cardW / 2 + 220, y);
  });

  panel(ctx, ARENA.w / 2 - cardW / 2 + sideW + 16, sideY, cardW - sideW - 16, 124, 0.86);
  const routeX = ARENA.w / 2 - cardW / 2 + sideW + 34;
  ctx.font = `700 11px ${SANS}`;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('THE ROUTE', routeX, sideY + 24);
  const stops = ['FIRST LIGHT', 'GLASS-EATERS', 'SPLIT DUNES', 'STORM KING'];
  stops.forEach((stop, index) => {
    const x = routeX + 18 + index * 88;
    ctx.fillStyle = index === stops.length - 1 ? PALETTE.glassRed : PALETTE.beacon;
    ctx.beginPath();
    ctx.arc(x, sideY + 52, 7, 0, Math.PI * 2);
    ctx.fill();
    if (index < stops.length - 1) {
      ctx.strokeStyle = 'rgba(255,244,222,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + 9, sideY + 52);
      ctx.lineTo(x + 79, sideY + 52);
      ctx.stroke();
    }
    ctx.font = `700 9px ${SANS}`;
    ctx.fillStyle = PALETTE.uiDim;
    ctx.textAlign = 'center';
    ctx.fillText(stop, x, sideY + 74);
    ctx.textAlign = 'left';
  });
  ctx.font = `600 11px ${SANS}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('each clear picks a route and a relic', routeX, sideY + 100);

  // CTA in a lit pill.
  const pulse = 0.6 + 0.4 * Math.sin(state.time * 2.4);
  const pillW = 320;
  ctx.fillStyle = `rgba(255,214,140,${0.16 + pulse * 0.12})`;
  ctx.beginPath();
  ctx.roundRect(ARENA.w / 2 - pillW / 2, 604, pillW, 52, 26);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,226,170,${0.5 + pulse * 0.4})`;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = `800 18px ${SANS}`;
  ctx.fillStyle = PALETTE.beacon;
  ctx.fillText('PRESS SPACE TO SAIL', ARENA.w / 2, 636);
  ctx.font = `600 11px ${SANS}`;
  ctx.fillStyle = 'rgba(255,244,222,0.5)';
  ctx.fillText('R restart · M sound', ARENA.w / 2, 676);
  ctx.textAlign = 'left';
}

export function drawRoute(ctx, state) {
  ctx.fillStyle = 'rgba(16,8,22,0.72)';
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);
  ctx.textAlign = 'center';
  ctx.font = `800 30px ${SANS}`;
  ctx.fillStyle = PALETTE.ui;
  ctx.fillText(`DAY ${state.day.number} CLEARED`, ARENA.w / 2, 210);
  ctx.font = `600 13px ${SANS}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('choose the next stretch of desert — each one changes what the storm sends', ARENA.w / 2, 236);

  state.routeChoices.forEach((choice, index) => {
    const w = 300;
    const h = 130;
    const x = ARENA.w / 2 - w - 20 + index * (w + 40);
    const y = 280;
    const hovered = state.hoverChoice === index;
    panel(ctx, x, y, w, h, hovered ? 0.8 : 0.6);
    ctx.textAlign = 'left';
    ctx.font = `700 16px ${SANS}`;
    ctx.fillStyle = PALETTE.beacon;
    ctx.fillText(`${index + 1}. ${choice.name}`, x + 20, y + 34);
    ctx.font = `600 12px ${SANS}`;
    ctx.fillStyle = PALETTE.ui;
    ctx.fillText(choice.note, x + 20, y + 60);
    ctx.fillStyle = PALETTE.uiDim;
    ctx.fillText(choice.kind === 'calm' ? 'the wall keeps its distance longer' : 'richer glass, but the wall runs', x + 20, y + 82);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `700 11px ${SANS}`;
    ctx.fillText(`PRESS ${index + 1} OR CLICK`, x + 20, y + 108);
  });
  ctx.textAlign = 'left';
}

export function drawRelicPick(ctx, state) {
  ctx.fillStyle = 'rgba(16,8,22,0.74)';
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);
  ctx.textAlign = 'center';
  ctx.font = `800 26px ${SANS}`;
  ctx.fillStyle = PALETTE.ui;
  ctx.fillText('GLASS FROM THE DUNES', ARENA.w / 2, 214);
  ctx.font = `600 12px ${SANS}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('take one relic into the next storm day', ARENA.w / 2, 238);

  state.relicChoices.forEach((relic, index) => {
    const w = 290;
    const h = 120;
    const x = ARENA.w / 2 - w - 18 + index * (w + 36);
    const y = 280;
    const hovered = state.hoverChoice === index;
    panel(ctx, x, y, w, h, hovered ? 0.82 : 0.6);
    ctx.textAlign = 'left';
    ctx.font = `700 15px ${SANS}`;
    ctx.fillStyle = PALETTE.glassLit;
    ctx.fillText(relic.name, x + 18, y + 34);
    ctx.font = `600 12px ${SANS}`;
    ctx.fillStyle = PALETTE.ui;
    ctx.fillText(relic.note, x + 18, y + 58);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `700 11px ${SANS}`;
    ctx.fillText(`PRESS ${index + 1} OR CLICK`, x + 18, y + 96);
  });
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, state) {
  const won = state.screen === 'win';
  ctx.fillStyle = won ? 'rgba(24,12,10,0.55)' : 'rgba(12,6,16,0.72)';
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);

  ctx.textAlign = 'center';
  ctx.shadowColor = won ? 'rgba(255,226,160,0.7)' : 'rgba(255,90,110,0.55)';
  ctx.shadowBlur = 34;
  ctx.fillStyle = won ? PALETTE.beacon : '#ff8f9a';
  spaced(ctx, won ? 'THE DESERT IS GLASS' : 'BURIED IN SAND', ARENA.w / 2, 250, 8, `800 40px ${SANS}`);
  ctx.shadowBlur = 0;

  ctx.font = `600 14px ${SANS}`;
  ctx.fillStyle = PALETTE.ui;
  ctx.fillText(
    won
      ? `all ${state.day.ports.length} beacons lit · the storm broke on your glass`
      : `the storm wall took the yacht on day ${state.day.number} · ${state.totalLit} beacon${state.totalLit === 1 ? '' : 's'} lit`,
    ARENA.w / 2,
    282,
  );

  // The results card: grade, score, days, feats, seed.
  const cardW = 560;
  const cardH = 200;
  panel(ctx, ARENA.w / 2 - cardW / 2, 306, cardW, cardH, 0.88);
  ctx.textAlign = 'left';
  ctx.font = `700 11px ${SANS}`;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('RUN REPORT', ARENA.w / 2 - cardW / 2 + 22, 330);

  ctx.font = `800 64px ${SANS}`;
  ctx.fillStyle = won ? PALETTE.beacon : '#ff9a9a';
  ctx.fillText(state.grade, ARENA.w / 2 - cardW / 2 + 22, 396);

  const rows = [
    ['SCORE', String(Math.round(state.score))],
    ['DAYS SURVIVED', `${won ? 7 : state.day.number - 1} of 7`],
    ['GLASS LAID', `${Math.round(state.glassLength)} m`],
    ['PATHS LOST', String(state.pathsLost)],
    ['RELICS', state.relics.length ? state.relics.map((relic) => relic.name).join(', ') : 'none'],
    ['SEED', String(state.seed)],
  ];
  rows.forEach(([label, value], index) => {
    const y = 340 + index * 24;
    ctx.font = `700 10px ${SANS}`;
    ctx.fillStyle = PALETTE.uiDim;
    ctx.fillText(label, ARENA.w / 2 - 140, y);
    ctx.font = `600 11px ${SANS}`;
    ctx.fillStyle = PALETTE.ui;
    ctx.fillText(value, ARENA.w / 2 - 30, y);
  });

  ctx.font = `700 11px ${SANS}`;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('FEATS', ARENA.w / 2 - cardW / 2 + 22, 434);
  ctx.font = `600 11px ${SANS}`;
  state.feats.slice(0, 5).forEach((feat, index) => {
    ctx.fillStyle = 'rgba(255,244,222,0.92)';
    ctx.fillText(`· ${feat}`, ARENA.w / 2 - cardW / 2 + 22 + (index % 2) * 250, 452 + Math.floor(index / 2) * 15);
  });

  const pulse = 0.5 + 0.5 * Math.sin(state.time * 2.4);
  const pillW = 460;
  ctx.fillStyle = `rgba(255,214,140,${0.14 + pulse * 0.1})`;
  ctx.beginPath();
  ctx.roundRect(ARENA.w / 2 - pillW / 2, 540, pillW, 46, 23);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,226,170,${0.45 + pulse * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = `800 16px ${SANS}`;
  ctx.fillStyle = PALETTE.ui;
  ctx.fillText('PRESS R TO PLAY AGAIN  ·  PRESS S FOR THE SAME SEED', ARENA.w / 2, 568);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  void RELICS;
}