// The HUD a still has to carry: the day and the boss up top, the win/lose banner with live numbers,
// the incoming queue with each spirit's weakness, the route, relics and lens on the right, and the
// keycap bar along the bottom. Every panel draws inside its own box: text is measured and shrunk or
// wrapped, never allowed to spill.

import { PALETTE, ARENA, FONT, font } from './config.js';

const SANS = FONT;

export function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = `rgba(20,12,30,${alpha ?? 0.82})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,170,0.24)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Fit a string into a box: shrink to the largest size that fits, down to a floor.
export function fitText(ctx, text, maxWidth, size, weight = 700, floor = 9) {
  let current = size;
  ctx.font = font(current, weight);
  while (ctx.measureText(text).width > maxWidth && current > floor) {
    current -= 1;
    ctx.font = font(current, weight);
  }
  return current;
}

// Wrap into at most `maxLines` lines that each fit the width.
export function wrapText(ctx, text, maxWidth, maxLines = 3) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function keycap(ctx, x, y, label) {
  ctx.font = font(11, 800);
  const w = Math.max(26, ctx.measureText(label).width + 14);
  ctx.fillStyle = 'rgba(255,240,214,0.18)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 22, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,214,0.5)';
  ctx.stroke();
  ctx.fillStyle = '#fff4de';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 15);
  ctx.textAlign = 'left';
  return w;
}

function spiritIcon(ctx, type, x, y, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = colour;
  ctx.strokeStyle = 'rgba(255,244,222,0.65)';
  ctx.lineWidth = 1.4;
  if (type === 'reflector') {
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'splitter') {
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(8, 7);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function relicIcon(ctx, x, y, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = colour;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-4, -4, 8, 8);
  ctx.restore();
}

export function drawHud(ctx, state) {
  const { day, yacht, score, relics, input } = state;
  const lit = day.network.litBeacons();
  const total = day.ports.length;
  const boss = day.boss;

  // ---- Top-left: the day, the seed and the boss's health — the only place the boss bar lives.
  const leftH = boss ? 118 : 86;
  panel(ctx, 16, 14, 336, leftH);
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText(`STORM DAY ${day.number} / 7`, 32, 40);
  fitText(ctx, day.spec.name, 300, 36, 900);
  ctx.fillStyle = '#fff4de';
  ctx.fillText(day.spec.name, 32, 74);
  ctx.font = font(12, 700);
  ctx.fillStyle = 'rgba(255,244,222,0.62)';
  ctx.fillText(`SEED ${state.seed} · GLASS LAID ${Math.round(day.network.totalLength())} m`, 32, 92);

  if (boss) {
    ctx.font = font(12, 800);
    ctx.fillStyle = '#e8dcff';
    ctx.fillText('THE STORM KING', 32, 110);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff4de';
    ctx.fillText(`PHASE ${boss.phase}/3`, 320, 110);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,244,222,0.18)';
    ctx.fillRect(32, 116, 288, 8);
    ctx.fillStyle = '#c98aff';
    ctx.fillRect(32, 116, 288 * Math.max(0, boss.hp / boss.maxHp), 8);
  }

  // ---- Top banner: the win and the loss, each with a live value on the right.
  const bannerW = 600;
  const bx = ARENA.w / 2 - bannerW / 2;
  panel(ctx, bx, 14, bannerW, 76);
  const winLine = `WIN   light all ${total} beacons${boss ? ' and break the King' : ' before the wall'}`;
  fitText(ctx, winLine, bannerW - 220, 16, 800);
  ctx.fillStyle = '#9dffb0';
  ctx.fillText(winLine, bx + 18, 46);
  ctx.textAlign = 'right';
  ctx.fillText(`BEACONS ${lit}/${total}`, bx + bannerW - 18, 46);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff9a9a';
  fitText(ctx, 'LOSE  the wall buries the yacht, or cuts a beacon off', bannerW - 220, 16, 800);
  ctx.fillText('LOSE  the wall buries the yacht, or cuts a beacon off', bx + 18, 74);
  ctx.textAlign = 'right';
  ctx.fillText(`WALL ${Math.max(0, Math.round(day.stormX - yacht.x))} m`, bx + bannerW - 18, 74);
  ctx.textAlign = 'left';

  // ---- Top-right: score and combo.
  panel(ctx, ARENA.w - 240, 14, 224, 94);
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('SCORE', ARENA.w - 222, 40);
  ctx.font = font(36, 900);
  ctx.fillStyle = '#fff4de';
  ctx.fillText(String(Math.round(score)), ARENA.w - 222, 76);
  ctx.font = font(13, 800);
  ctx.fillStyle = day.combo > 1 ? '#ffd166' : 'rgba(255,244,222,0.55)';
  ctx.fillText(`COMBO x${day.combo}`, ARENA.w - 222, 98);

  // ---- Left: INCOMING, an icon, a name, a count and the answer to it.
  const incoming = [];
  const countOf = (type) => day.spirits.filter((spirit) => spirit.type === type).length;
  if (countOf('eater')) incoming.push(['eater', 'GLASS-EATER', countOf('eater'), 'gnaws your path — fuse over it', '#a97bff']);
  if (countOf('reflector')) incoming.push(['reflector', 'REFLECTOR', countOf('reflector'), 'bounces the beam — aim wide', '#7dffb0']);
  if (countOf('splitter')) incoming.push(['splitter', 'SPLITTER', countOf('splitter'), 'splits a path — bridge it', '#ffd166']);
  if (boss) incoming.push(['eater', 'STORM KING', 1, 'eats everything — burn it red', '#c98aff']);
  const incH = 46 + incoming.length * 40;
  panel(ctx, 16, leftH + 26, 336, incH);
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('INCOMING', 32, leftH + 50);
  incoming.forEach(([type, name, count, hint, colour], index) => {
    const y = leftH + 74 + index * 40;
    spiritIcon(ctx, type, 44, y - 2, colour);
    ctx.font = font(15, 800);
    ctx.fillStyle = '#fff4de';
    ctx.fillText(`${name} ×${count}`, 64, y);
    fitText(ctx, hint, 264, 12, 600);
    ctx.fillStyle = 'rgba(255,244,222,0.62)';
    ctx.fillText(hint, 64, y + 16);
  });

  // ---- Right: route, relics and lens in one panel.
  const rx = ARENA.w - 286;
  const ry = 120;
  const relicLines = relics.length ? Math.min(3, relics.length) : 1;
  const rightH = 96 + relicLines * 22 + 40;
  panel(ctx, rx, ry, 270, rightH);
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('ROUTE', rx + 18, ry + 26);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,244,222,0.6)';
  ctx.fillText(`RELICS ${relics.length} of 6`, rx + 252, ry + 26);
  ctx.textAlign = 'left';

  for (let i = 0; i < 7; i += 1) {
    const x = rx + 34 + i * 33;
    const y = ry + 54;
    const here = i + 1 === day.number;
    ctx.fillStyle = i + 1 > day.number ? 'rgba(255,244,222,0.22)' : i + 1 === 7 ? '#ff8f9a' : PALETTE.beacon;
    ctx.beginPath();
    ctx.arc(x, y, here ? 11 : 7, 0, Math.PI * 2);
    ctx.fill();
    if (here) {
      ctx.strokeStyle = '#fff4de';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = font(11, 800);
      ctx.fillStyle = '#fff4de';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', x, y + 30);
      ctx.textAlign = 'left';
    }
    if (i < 6) {
      ctx.strokeStyle = 'rgba(255,244,222,0.32)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + 9, y);
      ctx.lineTo(x + 24, y);
      ctx.stroke();
    }
  }

  const relicY = ry + 112;
  if (!relics.length) {
    ctx.font = font(12, 600);
    ctx.fillStyle = 'rgba(255,244,222,0.55)';
    ctx.fillText('no relics yet — clear a day to draft one', rx + 18, relicY);
  } else {
    relics.slice(0, 3).forEach((relic, index) => {
      relicIcon(ctx, rx + 26, relicY - 4 + index * 22, ['#6effd6', '#ffd166', '#ff9aa4'][index % 3]);
      fitText(ctx, relic.name, 206, 13, 700);
      ctx.fillStyle = '#fff4de';
      ctx.fillText(relic.name, rx + 42, relicY + index * 22);
    });
  }

  const lensY = ry + 132 + relicLines * 22;
  const colour = input.colour || 'amber';
  const lensColour = colour === 'red' ? PALETTE.glassRed : colour === 'blue' ? PALETTE.glassBlue : PALETTE.glass;
  ctx.fillStyle = lensColour;
  ctx.beginPath();
  ctx.arc(rx + 26, lensY - 5, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = font(13, 800);
  ctx.fillStyle = '#fff4de';
  ctx.fillText(`LENS ${colour.toUpperCase()}`, rx + 42, lensY);
  ctx.font = font(11, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.55)';
  ctx.fillText(colour === 'red' ? 'burns what touches it' : colour === 'blue' ? 'freezes what touches it' : 'plain glass, no effect', rx + 18, lensY + 18);

  // ---- Bottom-left: hull, pulse, beacons.
  panel(ctx, 16, ARENA.h - 118, 300, 104);
  ctx.font = font(13, 800);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('HULL', 32, ARENA.h - 94);
  ctx.fillStyle = 'rgba(255,244,222,0.18)';
  ctx.fillRect(88, ARENA.h - 103, 208, 10);
  ctx.fillStyle = '#9dffb0';
  ctx.fillRect(88, ARENA.h - 103, 208 * Math.max(0, yacht.hull / 100), 10);
  const ready = day.pulseCooldown <= 0;
  ctx.font = font(12, 700);
  ctx.fillStyle = ready ? '#ddfff6' : 'rgba(255,244,222,0.4)';
  ctx.fillText(ready ? 'PULSE READY (RMB)' : `PULSE ${day.pulseCooldown.toFixed(1)}s`, 32, ARENA.h - 72);
  ctx.fillStyle = 'rgba(255,244,222,0.55)';
  ctx.fillText('welds nearby glass · stuns spirits', 32, ARENA.h - 52);
  ctx.fillText(`${lit}/${total} BEACONS LIT`, 32, ARENA.h - 30);

  // ---- Bottom-right: the storm meter, which is the clock.
  const closeness = day.stormCloseness(yacht);
  panel(ctx, ARENA.w - 286, ARENA.h - 118, 270, 104);
  ctx.font = font(13, 800);
  ctx.fillStyle = closeness > 0.66 ? '#ff8f8f' : PALETTE.accent;
  ctx.fillText('STORM WALL', ARENA.w - 268, ARENA.h - 94);
  ctx.fillStyle = 'rgba(255,244,222,0.18)';
  ctx.fillRect(ARENA.w - 268, ARENA.h - 86, 236, 12);
  const wallColour = ctx.createLinearGradient(ARENA.w - 268, 0, ARENA.w - 32, 0);
  wallColour.addColorStop(0, '#ff9a6a');
  wallColour.addColorStop(1, '#8f6bff');
  ctx.fillStyle = wallColour;
  ctx.fillRect(ARENA.w - 268, ARENA.h - 86, 236 * closeness, 12);
  ctx.font = font(22, 900);
  ctx.fillStyle = '#fff4de';
  ctx.fillText(`${Math.max(0, Math.round(day.stormX - yacht.x))} m`, ARENA.w - 268, ARENA.h - 56);
  ctx.font = font(11, 600);
  ctx.fillStyle = 'rgba(255,244,222,0.55)';
  ctx.fillText(boss ? 'the King walks with the wall' : 'the wall never stops', ARENA.w - 268, ARENA.h - 34);

  // ---- Bottom-centre: the keycap bar.
  const keys = [
    ['WASD', 'SAIL'],
    ['MOUSE', 'AIM'],
    ['LMB', 'FUSE'],
    ['RMB', 'PULSE'],
    ['1 2 3', 'LENS'],
    ['P', 'PAUSE'],
    ['M', 'SOUND'],
  ];
  let cursor = ARENA.w / 2 - 300;
  panel(ctx, ARENA.w / 2 - 312, ARENA.h - 62, 624, 48, 0.7);
  keys.forEach(([key, label]) => {
    cursor += keycap(ctx, cursor, ARENA.h - 51, key) + 6;
    ctx.font = font(10, 700);
    ctx.fillStyle = 'rgba(255,244,222,0.72)';
    ctx.fillText(label, cursor, ARENA.h - 36);
    cursor += ctx.measureText(label).width + 14;
  });

  // ---- The combo word: big, warm, outlined, parked above the keycap bar.
  if (day.combo > 1) {
    const words = ['', '', 'GLASS CHAIN', 'SPLIT CHAIN', 'PRISM CHAIN', 'PRISM CHAIN', 'STORM CHAIN'];
    const label = `${words[Math.min(6, day.combo)]} x${day.combo}!`;
    ctx.save();
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(state.time * 9);
    fitText(ctx, label, 900, 68, 900);
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(24,10,26,0.85)';
    ctx.lineWidth = 6;
    ctx.strokeText(label, ARENA.w / 2, ARENA.h - 96);
    const shine = ctx.createLinearGradient(ARENA.w / 2 - 300, 0, ARENA.w / 2 + 300, 0);
    shine.addColorStop(0, '#ffe9a8');
    shine.addColorStop(0.55, '#ffb066');
    shine.addColorStop(1, '#6effd6');
    ctx.fillStyle = shine;
    ctx.fillText(label, ARENA.w / 2, ARENA.h - 96);
    ctx.restore();
    ctx.textAlign = 'left';
  }
  void SANS;
}