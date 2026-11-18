// The HUD a still has to carry: the day and the boss up top, the win/lose banner with live numbers,
// the incoming queue with each spirit's weakness, the route and relics on the right, and the keycap
// bar along the bottom. Everything the game asks of a player is legible without moving.

import { PALETTE, ARENA } from './config.js';

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const TINY = `700 10px ${SANS}`;
const SMALL = `600 12px ${SANS}`;

export function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = `rgba(16,9,24,${alpha ?? 0.72})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,226,180,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function keycap(ctx, x, y, label) {
  ctx.font = `700 10px ${SANS}`;
  const w = Math.max(24, ctx.measureText(label).width + 12);
  ctx.fillStyle = 'rgba(255,240,214,0.16)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 20, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,214,0.45)';
  ctx.stroke();
  ctx.fillStyle = '#fff4de';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 14);
  ctx.textAlign = 'left';
  return w;
}

function spiritIcon(ctx, type, x, y, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = colour;
  ctx.strokeStyle = 'rgba(255,244,222,0.6)';
  ctx.lineWidth = 1.2;
  if (type === 'reflector') {
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'splitter') {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 6);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawHud(ctx, state) {
  const { day, yacht, score, relics, input } = state;
  const lit = day.network.litBeacons();
  const total = day.ports.length;

  // ---- Top-left: the day, and the boss when there is one.
  const boss = day.boss;
  const leftH = boss ? 104 : 74;
  panel(ctx, 16, 14, 306, leftH);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText(`STORM DAY ${day.number} / 7`, 30, 34);
  ctx.font = `800 20px ${SANS}`;
  ctx.fillStyle = '#fff4de';
  ctx.fillText(day.spec.name, 30, 56);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(`SEED ${state.seed} · GLASS LAID ${Math.round(day.network.totalLength())} m`, 30, 72);

  if (boss) {
    ctx.fillStyle = '#e8dcff';
    ctx.font = `700 11px ${SANS}`;
    ctx.fillText(boss.name, 30, 90);
    ctx.fillStyle = 'rgba(255,244,222,0.18)';
    ctx.fillRect(30, 96, 200, 7);
    ctx.fillStyle = '#c98aff';
    ctx.fillRect(30, 96, 200 * Math.max(0, boss.hp / boss.maxHp), 7);
    ctx.fillStyle = '#fff4de';
    ctx.font = TINY;
    ctx.fillText(`PHASE ${boss.phase}/3`, 238, 103);
  }

  // ---- Top banner: the win and the loss, with a live value on the right of each row.
  const bannerW = 548;
  const bx = ARENA.w / 2 - bannerW / 2;
  panel(ctx, bx, 14, bannerW, 66);
  ctx.font = `700 12px ${SANS}`;
  ctx.fillStyle = '#9dffb0';
  ctx.fillText(`WIN   light all ${total} beacons${boss ? ' and break THE STORM KING' : ' before the wall arrives'}`, bx + 16, 36);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9dffb0';
  ctx.fillText(`BEACONS ${lit}/${total}`, bx + bannerW - 16, 36);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff9a9a';
  ctx.fillText('LOSE   the storm wall buries your yacht, or cuts a beacon off', bx + 16, 60);
  ctx.textAlign = 'right';
  ctx.fillText(`WALL ${Math.max(0, Math.round(day.stormX - yacht.x))} m`, bx + bannerW - 16, 60);
  ctx.textAlign = 'left';

  // ---- Top-right: score and combo.
  panel(ctx, ARENA.w - 226, 14, 210, 72);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('SCORE', ARENA.w - 210, 34);
  ctx.font = `800 24px ${SANS}`;
  ctx.fillStyle = '#fff4de';
  ctx.fillText(String(Math.round(score)), ARENA.w - 210, 58);
  ctx.font = TINY;
  ctx.fillStyle = day.combo > 1 ? '#ffd166' : PALETTE.uiDim;
  ctx.fillText(`COMBO x${day.combo}`, ARENA.w - 210, 76);

  // ---- Left: INCOMING, one row per spirit type.
  const incoming = [];
  const countOf = (type) => day.spirits.filter((spirit) => spirit.type === type).length;
  if (countOf('eater')) incoming.push(['eater', 'GLASS-EATER', countOf('eater'), 'gnaws your path — fuse over it', '#a97bff']);
  if (countOf('reflector')) incoming.push(['reflector', 'REFLECTOR', countOf('reflector'), 'bounces the beam — aim around it', '#7dffb0']);
  if (countOf('splitter')) incoming.push(['splitter', 'SPLITTER', countOf('splitter'), 'splits a path — bridge it', '#ffd166']);
  if (boss) incoming.push(['eater', 'STORM KING', 1, 'eats everything — burn it red', '#c98aff']);
  const incH = 30 + incoming.length * 34;
  panel(ctx, 16, leftH + 24, 254, incH);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('INCOMING', 30, leftH + 44);
  incoming.forEach(([type, name, count, hint, colour], index) => {
    const y = leftH + 66 + index * 34;
    spiritIcon(ctx, type, 38, y - 4, colour);
    ctx.font = `700 11px ${SANS}`;
    ctx.fillStyle = '#fff4de';
    ctx.fillText(`${name} ×${count}`, 54, y);
    ctx.font = `600 10px ${SANS}`;
    ctx.fillStyle = PALETTE.uiDim;
    ctx.fillText(hint, 54, y + 12);
  });

  // ---- Right: the route strip, the relics and the lens.
  const rx = ARENA.w - 266;
  let ry = 100;
  panel(ctx, rx, ry, 250, 74);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('ROUTE', rx + 14, ry + 20);
  for (let i = 0; i < 7; i += 1) {
    const x = rx + 24 + i * 32;
    const y = ry + 42;
    const here = i + 1 === day.number;
    ctx.fillStyle = i + 1 > day.number ? 'rgba(255,244,222,0.22)' : i + 1 === 7 ? '#ff8f9a' : PALETTE.beacon;
    ctx.beginPath();
    ctx.arc(x, y, here ? 7 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    if (here) {
      ctx.strokeStyle = '#fff4de';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = TINY;
      ctx.fillStyle = '#fff4de';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', x, y - 16);
      ctx.textAlign = 'left';
    }
    if (i < 6) {
      ctx.strokeStyle = 'rgba(255,244,222,0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 7, y);
      ctx.lineTo(x + 25, y);
      ctx.stroke();
    }
  }
  ry += 84;

  const relicH = 30 + Math.max(1, relics.length) * 16;
  panel(ctx, rx, ry, 250, relicH);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText(`RELICS ${relics.length}/6`, rx + 14, ry + 20);
  if (!relics.length) {
    ctx.fillStyle = PALETTE.uiDim;
    ctx.font = SMALL;
    ctx.fillText('none yet — clear a day', rx + 14, ry + 38);
  } else {
    relics.slice(0, 4).forEach((relic, index) => {
      ctx.font = `600 11px ${SANS}`;
      ctx.fillStyle = '#fff4de';
      ctx.fillText(`· ${relic.name}`, rx + 14, ry + 38 + index * 16);
    });
  }
  ry += relicH + 10;

  panel(ctx, rx, ry, 250, 56);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('LENS', rx + 14, ry + 20);
  const colour = input.colour || 'amber';
  const lensColour = colour === 'red' ? PALETTE.glassRed : colour === 'blue' ? PALETTE.glassBlue : PALETTE.glass;
  ctx.fillStyle = lensColour;
  ctx.beginPath();
  ctx.arc(rx + 26, ry + 38, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `700 12px ${SANS}`;
  ctx.fillStyle = '#fff4de';
  ctx.fillText(colour.toUpperCase(), rx + 44, ry + 42);
  ctx.font = `600 10px ${SANS}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(colour === 'red' ? 'burns spirits that touch it' : colour === 'blue' ? 'freezes spirits that touch it' : 'plain glass: no effect', rx + 14, ry + 52);

  // ---- Bottom-left: hull and the pulse cooldown.
  panel(ctx, 16, ARENA.h - 104, 240, 88);
  ctx.font = TINY;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('HULL', 30, ARENA.h - 84);
  ctx.fillStyle = 'rgba(255,244,222,0.16)';
  ctx.fillRect(30, ARENA.h - 78, 190, 9);
  ctx.fillStyle = '#9dffb0';
  ctx.fillRect(30, ARENA.h - 78, 190 * Math.max(0, yacht.hull / 100), 9);
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('PULSE', 30, ARENA.h - 52);
  const ready = day.pulseCooldown <= 0;
  ctx.fillStyle = ready ? '#ddfff6' : 'rgba(255,244,222,0.35)';
  ctx.fillText(ready ? 'READY  (RMB)' : `RECHARGING ${day.pulseCooldown.toFixed(1)}s`, 74, ARENA.h - 52);
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText('welds nearby glass · stuns spirits', 30, ARENA.h - 36);
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(`${lit}/${total} BEACONS LIT`, 30, ARENA.h - 22);

  // ---- Bottom-right: the storm meter, which is the clock.
  const closeness = day.stormCloseness(yacht);
  panel(ctx, ARENA.w - 266, ARENA.h - 104, 250, 88);
  ctx.font = TINY;
  ctx.fillStyle = closeness > 0.66 ? '#ff8f8f' : PALETTE.uiDim;
  ctx.fillText('STORM WALL', ARENA.w - 252, ARENA.h - 84);
  ctx.fillStyle = 'rgba(255,244,222,0.16)';
  ctx.fillRect(ARENA.w - 252, ARENA.h - 76, 222, 10);
  const wallColour = ctx.createLinearGradient(ARENA.w - 252, 0, ARENA.w - 30, 0);
  wallColour.addColorStop(0, '#ff9a6a');
  wallColour.addColorStop(1, '#8f6bff');
  ctx.fillStyle = wallColour;
  ctx.fillRect(ARENA.w - 252, ARENA.h - 76, 222 * closeness, 10);
  ctx.font = `700 12px ${SANS}`;
  ctx.fillStyle = '#fff4de';
  ctx.fillText(`DISTANCE ${Math.max(0, Math.round(day.stormX - yacht.x))} m`, ARENA.w - 252, ARENA.h - 54);
  ctx.font = `600 10px ${SANS}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(boss ? 'the King walks with the wall' : 'the wall never stops', ARENA.w - 252, ARENA.h - 38);

  // ---- Bottom-centre: the keycap bar.
  const keys = [
    ['WASD', 'SAIL'],
    ['MOUSE', 'AIM LENS'],
    ['LMB', 'FUSE GLASS'],
    ['RMB', 'PULSE'],
    ['1 2 3', 'LENS'],
    ['P', 'PAUSE'],
  ];
  let cursor = ARENA.w / 2 - 268;
  panel(ctx, ARENA.w / 2 - 280, ARENA.h - 56, 560, 44, 0.6);
  keys.forEach(([key, label]) => {
    cursor += keycap(ctx, cursor, ARENA.h - 46, key) + 5;
    ctx.font = `700 9px ${SANS}`;
    ctx.fillStyle = PALETTE.uiDim;
    ctx.fillText(label, cursor, ARENA.h - 33);
    cursor += ctx.measureText(label).width + 12;
  });

  // ---- The combo word: one huge shout when the chain is running.
  if (day.combo > 1) {
    const label = `${['', '', 'GLASS CHAIN', 'SPLIT CHAIN', 'PRISM CHAIN', 'PRISM CHAIN', 'STORM CHAIN'][Math.min(6, day.combo)]} x${day.combo}!`;
    const pulse = 0.75 + 0.25 * Math.sin(state.time * 9);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font = `800 42px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(24,10,26,0.8)';
    ctx.lineWidth = 6;
    ctx.strokeText(label, ARENA.w / 2, 596);
    const shine = ctx.createLinearGradient(ARENA.w / 2 - 160, 0, ARENA.w / 2 + 160, 0);
    shine.addColorStop(0, '#ffe9a8');
    shine.addColorStop(1, '#6effd6');
    ctx.fillStyle = shine;
    ctx.fillText(label, ARENA.w / 2, 596);
    ctx.restore();
  }
}