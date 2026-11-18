// The desert: layered dunes, a low sun, heat shimmer, and the storm wall eating the sky from the
// east. Drawn in one pass per frame from the seeded dune function, so it is the same sand every run.

import { PALETTE, ARENA } from './config.js';
import { duneHeight } from './random.js';

export function drawSky(ctx, time, phase) {
  const sky = ctx.createLinearGradient(0, 0, 0, ARENA.h);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.38, PALETTE.skyMid);
  sky.addColorStop(0.62, PALETTE.skyLow);
  sky.addColorStop(0.75, '#f2b06a');
  sky.addColorStop(1, PALETTE.sandDark);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);

  // Sun: low on the horizon, bloomed, with a thin corona that breathes.
  const sunX = 258;
  const sunY = 168;
  const bloom = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 300);
  bloom.addColorStop(0, 'rgba(255,226,170,0.5)');
  bloom.addColorStop(0.25, 'rgba(255,170,110,0.22)');
  bloom.addColorStop(1, 'rgba(255,140,90,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(sunX - 300, sunY - 300, 600, 600);
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY - 4, 46, 0, Math.PI * 2);
  ctx.fill();

  // Long raking light across the sky: fine lines that make the air feel thick.
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#ffe6b8';
  for (let i = 0; i < 9; i += 1) {
    const y = 150 + i * 46 + Math.sin(time * 0.4 + i + phase) * 6;
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA.w, y + 26);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Dune bands, far to near: each is a filled silhouette from the seeded height function.
export function drawDunes(ctx, phase, time) {
  const bands = [
    { base: 452, amp: 0.5, colour: '#8a5a3a', shade: 0.34, speed: 0.05, ripple: 0.10 },
    { base: 528, amp: 0.7, colour: '#a86c42', shade: 0.40, speed: 0.1, ripple: 0.13 },
    { base: 606, amp: 0.95, colour: '#c1854c', shade: 0.46, speed: 0.18, ripple: 0.17 },
    { base: 700, amp: 1.2, colour: '#dba05c', shade: 0.34, speed: 0.26, ripple: 0.2 },
    { base: 782, amp: 1.3, colour: '#efbf7a', shade: 0.22, speed: 0.34, ripple: 0.14 },
  ];
  bands.forEach((band, index) => {
    ctx.beginPath();
    ctx.moveTo(0, ARENA.h);
    for (let x = 0; x <= ARENA.w; x += 16) {
      const y = band.base + duneHeight(x + index * 240 + time * band.speed * 40, index * 90, phase) * band.amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(ARENA.w, ARENA.h);
    ctx.closePath();
    ctx.fillStyle = band.colour;
    ctx.fill();

    // The lit crest, then a shadow under it: that pair is what makes a dune read as a dune.
    ctx.beginPath();
    for (let x = 0; x <= ARENA.w; x += 16) {
      const y = band.base + duneHeight(x + index * 240 + time * band.speed * 40, index * 90, phase) * band.amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,236,196,0.5)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.globalAlpha = band.shade;
    ctx.strokeStyle = PALETTE.duneShade;
    ctx.lineWidth = 10;
    ctx.save();
    ctx.translate(0, 7);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  });
}

// Wind-scoured sand grain: short strokes that drift, dense enough to feel texture, cheap to draw.
export function drawSandGrain(ctx, time, cameraX) {
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#fff0cf';
  for (let i = 0; i < 120; i += 1) {
    const x = ((i * 173.3 + time * (18 + (i % 5) * 6) - cameraX * 0.2) % (ARENA.w + 80)) - 40;
    const y = 300 + ((i * 97.7) % (ARENA.h - 300));
    const len = 6 + (i % 4) * 5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y - 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// The storm wall: a dark cliff of cloud with a bright grinding edge and lightning in its belly.
export function drawStorm(ctx, wallX, time, intensity) {
  if (wallX > ARENA.w + 40) return;
  ctx.save();
  const wall = ctx.createLinearGradient(wallX, 0, ARENA.w, 0);
  wall.addColorStop(0, 'rgba(120,74,60,0.97)');
  wall.addColorStop(0.18, 'rgba(92,54,72,0.96)');
  wall.addColorStop(0.55, 'rgba(58,34,64,0.97)');
  wall.addColorStop(1, 'rgba(24,14,34,0.99)');
  ctx.fillStyle = wall;
  ctx.fillRect(wallX, 0, ARENA.w - wallX, ARENA.h);

  // The face of the wall: vertical sand columns churning, brighter near the edge.
  for (let i = 0; i < 26; i += 1) {
    const x = wallX + 8 + (i * 37) % Math.max(30, ARENA.w - wallX - 20);
    const width = 10 + (i % 5) * 9;
    const drift = Math.sin(time * 1.6 + i) * 10;
    const columnGrad = ctx.createLinearGradient(x, 0, x, ARENA.h);
    columnGrad.addColorStop(0, 'rgba(196,132,90,0.16)');
    columnGrad.addColorStop(0.5, 'rgba(150,96,110,0.10)');
    columnGrad.addColorStop(1, 'rgba(80,44,70,0.05)');
    ctx.fillStyle = columnGrad;
    ctx.fillRect(x + drift, 0, width, ARENA.h);
  }

  // Billows along the edge, so the wall is weather and not a rectangle.
  for (let i = 0; i < 16; i += 1) {
    const y = (i / 16) * ARENA.h + Math.sin(time * 1.3 + i) * 12;
    const radius = 46 + Math.sin(time * 2 + i * 1.7) * 18;
    const puff = ctx.createRadialGradient(wallX - 10, y, 4, wallX - 10, y, radius);
    puff.addColorStop(0, 'rgba(58,40,96,0.85)');
    puff.addColorStop(1, 'rgba(30,20,52,0)');
    ctx.fillStyle = puff;
    ctx.beginPath();
    ctx.arc(wallX - 10, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // The grinding edge: a bright line of sand being swallowed.
  ctx.beginPath();
  for (let y = 0; y <= ARENA.h; y += 12) {
    const x = wallX + Math.sin(y * 0.03 + time * 2.4) * 7;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = `rgba(255,180,110,${0.5 + intensity * 0.4})`;
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(255,150,90,0.8)';
  ctx.shadowBlur = 22;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Lightning: two branches per flash, driven by a hash of the time bucket.
  const bucket = Math.floor(time * 0.9);
  const flash = Math.sin(time * 2.6) > 0.86;
  if (flash) {
    ctx.strokeStyle = 'rgba(226,230,255,0.9)';
    ctx.lineWidth = 2.4;
    for (let branch = 0; branch < 2; branch += 1) {
      let x = wallX + 30 + ((bucket * 37 + branch * 61) % 120);
      let y = 40 + ((bucket * 53 + branch * 29) % 120);
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let step = 0; step < 7; step += 1) {
        x += Math.sin(bucket + step + branch) * 26;
        y += 60 + (step % 3) * 14;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Vignette plus a warm bloom at the sun: the two cheap moves that make a flat scene read as art.
export function drawLighting(ctx, time) {
  const bloom = ctx.createRadialGradient(900, 250, 60, 900, 250, 780);
  bloom.addColorStop(0, 'rgba(255,214,150,0.18)');
  bloom.addColorStop(0.45, 'rgba(255,170,110,0.06)');
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);

  const vignette = ctx.createRadialGradient(ARENA.w / 2, ARENA.h * 0.5, ARENA.h * 0.45, ARENA.w / 2, ARENA.h * 0.5, ARENA.h * 1.05);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(40,14,10,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);
}