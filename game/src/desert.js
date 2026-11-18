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
  const sunX = 520;
  const sunY = 146;
  const bloom = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 230);
  bloom.addColorStop(0, 'rgba(255,236,190,0.62)');
  bloom.addColorStop(0.25, 'rgba(255,170,110,0.22)');
  bloom.addColorStop(1, 'rgba(255,140,90,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(sunX - 230, sunY - 230, 460, 460);
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffdf2';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Rays: a dozen hard spokes, rotating slowly, brightest near the disc.
  ctx.save();
  ctx.translate(sunX, sunY);
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2 + time * 0.06;
    const len = 120 + (i % 3) * 60;
    ctx.strokeStyle = `rgba(255,228,170,${0.1 + (i % 2) * 0.06})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 46, Math.sin(a) * 46);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();

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
    { base: 470, amp: 2.1, colour: '#7d5136', shade: 0.42, speed: 0.05, ripple: 0.10 },
    { base: 590, amp: 2.6, colour: '#9c6440', shade: 0.5, speed: 0.1, ripple: 0.14 },
    { base: 720, amp: 3.1, colour: '#c1854c', shade: 0.4, speed: 0.18, ripple: 0.18 },
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

  // A churning dust body: overlapping soft blobs, not vertical stripes.
  const body = ctx.createLinearGradient(wallX, 0, ARENA.w, 0);
  body.addColorStop(0, 'rgba(122,74,58,0.92)');
  body.addColorStop(0.35, 'rgba(88,52,66,0.9)');
  body.addColorStop(1, 'rgba(38,22,40,0.95)');
  ctx.fillStyle = body;
  ctx.fillRect(wallX, 0, ARENA.w - wallX, ARENA.h);

  for (let i = 0; i < 34; i += 1) {
    const seed = i * 97.13;
    const cx = wallX + 30 + ((seed * 3.7) % Math.max(40, ARENA.w - wallX - 40)) + Math.sin(time * 0.7 + i) * 26;
    const cy = ((seed * 5.1) % ARENA.h) + Math.cos(time * 0.9 + i * 1.3) * 30;
    const radius = 90 + (i % 5) * 42;
    const puff = ctx.createRadialGradient(cx, cy, 8, cx, cy, radius);
    const warm = i % 3 === 0;
    puff.addColorStop(0, warm ? 'rgba(196,138,92,0.20)' : 'rgba(120,80,120,0.16)');
    puff.addColorStop(1, 'rgba(60,34,60,0)');
    ctx.fillStyle = puff;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Long horizontal dust streaks, thin and quick, so it reads as wind not wallpaper.
  ctx.strokeStyle = 'rgba(226,178,130,0.16)';
  for (let i = 0; i < 22; i += 1) {
    const y = ((i * 71.3 + time * 26) % ARENA.h);
    const len = 60 + (i % 6) * 40;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(wallX + ((i * 53) % Math.max(20, ARENA.w - wallX)), y);
    ctx.lineTo(wallX + ((i * 53) % Math.max(20, ARENA.w - wallX)) + len, y - 6);
    ctx.stroke();
  }

  // The grinding edge, plus lightning in its belly.
  ctx.beginPath();
  for (let y = 0; y <= ARENA.h; y += 12) {
    const x = wallX + Math.sin(y * 0.03 + time * 2.4) * 9;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = `rgba(255,186,120,${0.45 + intensity * 0.4})`;
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(255,150,90,0.85)';
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const bucket = Math.floor(time * 0.9);
  if (Math.sin(time * 2.6) > 0.86) {
    ctx.strokeStyle = 'rgba(232,236,255,0.92)';
    ctx.lineWidth = 2.4;
    for (let branch = 0; branch < 2; branch += 1) {
      let x = wallX + 40 + ((bucket * 37 + branch * 61) % 130);
      let y = 50 + ((bucket * 53 + branch * 29) % 130);
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
// The dim wash over the dunes: everything the player is not looking at gives up brightness.
export function drawDim(ctx, strength) {
  ctx.fillStyle = `rgba(12,7,22,${strength ?? 0.2})`;
  ctx.fillRect(0, 0, ARENA.w, ARENA.h);
}

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