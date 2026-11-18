// Everything drawn on top of the desert: the glass the player laid, the beacons it feeds, the
// yacht and its lens, the beam falling out of the sun, the spirits and the storm.

import { PALETTE, ARENA } from './config.js';

export function drawNetwork(ctx, network, time) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Closed panes: the stained-glass facet itself, drawn under the glass lines.
  for (const facet of network.facets || []) {
    if (facet.length < 3) continue;
    const colour = facet.colour === 'red' ? '255,106,122' : facet.colour === 'blue' ? '121,196,255' : '110,255,214';
    ctx.beginPath();
    facet.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = `rgb(${colour})`;
    ctx.fill();
    // A lighter inner wash, so the pane has depth rather than one flat tint.
    const cx = facet.reduce((sum, p) => sum + p[0], 0) / facet.length;
    const cy = facet.reduce((sum, p) => sum + p[1], 0) / facet.length;
    const wash = ctx.createRadialGradient(cx, cy, 2, cx, cy, 90);
    wash.addColorStop(0, 'rgba(255,255,255,0.30)');
    wash.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = wash;
    ctx.fill();
    // Lead came on every edge.
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = '#1a1020';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Pass 1: the halo, so a lit network glows across the sand.
  for (const segment of network.segments) {
    if (segment.hp <= 0) continue;
    const colour = segment.colour === 'red' ? PALETTE.glassRed : segment.colour === 'blue' ? PALETTE.glassBlue : PALETTE.glass;
    ctx.strokeStyle = segment.lit ? colour : 'rgba(120,140,170,0.35)';
    ctx.globalAlpha = segment.lit ? 0.26 : 0.1;
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
  }

  // Pass 2: the glass itself, its brightness scaled by how intact it is.
  for (const segment of network.segments) {
    if (segment.hp <= 0) continue;
    const health = segment.hp / segment.maxHp;
    const colour = segment.colour === 'red' ? PALETTE.glassRed : segment.colour === 'blue' ? PALETTE.glassBlue : PALETTE.glass;
    const conduit = segment.colour === 'amber' && segment.lit;
    ctx.globalAlpha = segment.lit ? (conduit ? 1 : 0.72) : 0.26;
    ctx.strokeStyle = segment.lit ? colour : 'rgba(150,170,200,0.5)';
    ctx.lineWidth = conduit ? 8 : 3 + health * 3;
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
  }

  // Pass 1b: light pools on the sand under lit glass.
  for (const segment of network.segments) {
    if (segment.hp <= 0 || !segment.lit) continue;
    const mx = (segment.x1 + segment.x2) / 2;
    const my = (segment.y1 + segment.y2) / 2;
    const colour = segment.colour === 'red' ? '255,106,122' : segment.colour === 'blue' ? '121,196,255' : '110,255,214';
    const pool = ctx.createRadialGradient(mx, my, 4, mx, my, 54);
    pool.addColorStop(0, `rgba(${colour},0.20)`);
    pool.addColorStop(1, `rgba(${colour},0)`);
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(mx, my, 54, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pass 1c: closed facets. Where two paths leave the same node, the space between them is filled
  // with a translucent pane, which is what makes the web read as stained glass and not as tubing.
  const nodes = new Map();
  for (const segment of network.segments) {
    if (segment.hp <= 0 || !segment.lit) continue;
    for (const [x, y, ox, oy] of [[segment.x1, segment.y1, segment.x2, segment.y2], [segment.x2, segment.y2, segment.x1, segment.y1]]) {
      const key = `${Math.round(x / 18)},${Math.round(y / 18)}`;
      if (!nodes.has(key)) nodes.set(key, []);
      nodes.get(key).push({ x: ox, y: oy, colour: segment.colour });
    }
  }
  for (const list of nodes.values()) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length - 1; i += 1) {
      const a = list[i];
      const b = list[i + 1];
      const span = Math.hypot(a.x - b.x, a.y - b.y);
      if (span > 420) continue;
      const colour = a.colour === 'red' ? '255,106,122' : a.colour === 'blue' ? '121,196,255' : '110,255,214';
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = `rgb(${colour})`;
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2 * 0.18 + a.x * 0.41 + b.x * 0.41, (a.y + b.y) / 2 * 0.18 + a.y * 0.41 + b.y * 0.41);
      ctx.lineTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#1a1020';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Pass 2b: the came — dark lead lines on both edges of every lit path, and a translucent pane
  // between them. That is what makes the network read as stained glass instead of neon tubing.
  for (const segment of network.segments) {
    if (segment.hp <= 0 || !segment.lit) continue;
    const colour = segment.colour === 'red' ? PALETTE.glassRed : segment.colour === 'blue' ? PALETTE.glassBlue : PALETTE.glass;
    const dx = segment.x2 - segment.x1;
    const dy = segment.y2 - segment.y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 9;
    const ny = (dx / len) * 9;
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(segment.x1 + nx, segment.y1 + ny);
    ctx.lineTo(segment.x2 + nx, segment.y2 + ny);
    ctx.lineTo(segment.x2 - nx, segment.y2 - ny);
    ctx.lineTo(segment.x1 - nx, segment.y1 - ny);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = 'rgba(16,10,26,0.85)';
    ctx.lineWidth = 2;
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(segment.x1 + nx * sign * 1.6, segment.y1 + ny * sign * 1.6);
      ctx.lineTo(segment.x2 + nx * sign * 1.6, segment.y2 + ny * sign * 1.6);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Pass 2c: specular glints, short and hard, the way light sits on glass edges.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.8;
  for (const segment of network.segments) {
    if (segment.hp <= 0 || !segment.lit) continue;
    const dx = segment.x2 - segment.x1;
    const dy = segment.y2 - segment.y1;
    const len = Math.hypot(dx, dy) || 1;
    const t0 = ((segment.x1 * 13 + segment.y1 * 7) % 40) / 40;
    for (let t = t0; t < 1; t += 0.34) {
      const x = segment.x1 + dx * t;
      const y = segment.y1 + dy * t;
      const nx = (-dy / len) * 5;
      const ny = (dx / len) * 5;
      ctx.beginPath();
      ctx.moveTo(x - dx / len * 6 + nx, y - dy / len * 6 + ny);
      ctx.lineTo(x + dx / len * 6 + nx, y + dy / len * 6 + ny);
      ctx.stroke();
    }
  }

  // Pass 3: the light running along the lit paths, a dash that travels toward the beacons.
  ctx.globalAlpha = 1;
  ctx.setLineDash([14, 34]);
  ctx.lineDashOffset = -time * 90;
  ctx.strokeStyle = PALETTE.glassLit;
  ctx.lineWidth = 2;
  for (const segment of network.segments) {
    if (!segment.lit || segment.hp <= 0) continue;
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawBeacons(ctx, ports, time) {
  for (const port of ports) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + port.pulse);
    // Plinth
    ctx.fillStyle = 'rgba(60,36,26,0.85)';
    ctx.beginPath();
    ctx.ellipse(port.x, port.y + 10, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2318';
    ctx.fillRect(port.x - 6, port.y - 34, 12, 44);
    ctx.strokeStyle = port.lit ? PALETTE.beacon : 'rgba(200,180,150,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(port.x - 6, port.y - 34, 12, 44);

    // Crystal
    const glow = port.lit ? 1 : 0.28;
    ctx.save();
    ctx.translate(port.x, port.y - 44);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = PALETTE.beacon;
    ctx.shadowBlur = 40 * glow;
    ctx.fillStyle = port.lit ? PALETTE.beacon : 'rgba(140,150,170,0.6)';
    ctx.fillRect(-9, -9, 18, 18);
    ctx.restore();
    ctx.shadowBlur = 0;

    if (port.lit) {
      // A beacon throws a shaft of light straight up once it is fed.
      const beam = ctx.createLinearGradient(port.x, port.y - 44, port.x, port.y - 260);
      beam.addColorStop(0, 'rgba(255,233,168,0.45)');
      beam.addColorStop(1, 'rgba(255,233,168,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(port.x - 8, port.y - 44);
      ctx.lineTo(port.x - 34, port.y - 260);
      ctx.lineTo(port.x + 34, port.y - 260);
      ctx.lineTo(port.x + 8, port.y - 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(255,240,200,${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(port.x, port.y - 44, 18 + pulse * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

  }
}

export function drawSource(ctx, source, time) {
  ctx.save();
  ctx.translate(source.x, source.y);
  // The sun-lens pylon: a glass disc on a tripod, throwing a warm light over the dunes.
  const halo = ctx.createRadialGradient(0, -18, 4, 0, -18, 130);
  halo.addColorStop(0, 'rgba(255,226,170,0.35)');
  halo.addColorStop(1, 'rgba(255,200,140,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, -18, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#3a2318';
  ctx.lineWidth = 5;
  for (const dx of [-16, 0, 16]) {
    ctx.beginPath();
    ctx.moveTo(dx, 12);
    ctx.lineTo(dx * 0.3, -16);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,245,255,0.85)';
  ctx.strokeStyle = PALETTE.glassLit;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -22, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  void time;
}

export function drawBeam(ctx, yacht, input, sun) {
  if (!yacht.firing) return;
  const target = yacht.lens;
  const colour = input.colour === 'red' ? '255,120,130' : input.colour === 'blue' ? '140,200,255' : '255,240,190';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // The shaft: sun to lens, wide at the top and tight at the ground.
  const shaft = ctx.createLinearGradient(sun.x, sun.y, target.x, target.y);
  shaft.addColorStop(0, `rgba(${colour},0.05)`);
  shaft.addColorStop(0.55, `rgba(${colour},0.3)`);
  shaft.addColorStop(1, `rgba(${colour},0.75)`);
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.moveTo(sun.x - 60, sun.y);
  ctx.lineTo(sun.x + 60, sun.y);
  ctx.lineTo(target.x + 12, target.y);
  ctx.lineTo(target.x - 12, target.y);
  ctx.closePath();
  ctx.fill();

  // The working beam: a hot wide bar of light from the lens to the sand, additive.
  ctx.lineCap = 'round';
  const originX = yacht.x + Math.cos(yacht.angle) * 20;
  const originY = yacht.y + Math.sin(yacht.angle) * 20;
  const beamGrad = ctx.createLinearGradient(originX, originY, target.x, target.y);
  beamGrad.addColorStop(0, `rgba(${colour},0.95)`);
  beamGrad.addColorStop(1, 'rgba(255,255,255,0.95)');
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.98)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  // Sparks thrown off the beam and a molten tip where the sand turns to glass.
  for (let i = 0; i < 9; i += 1) {
    const t = ((Date.now() / 260 + i * 0.37) % 1);
    const x = originX + (target.x - originX) * t;
    const y = originY + (target.y - originY) * t + Math.sin(t * 20 + i) * 7;
    ctx.fillStyle = 'rgba(255,236,180,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const tip = ctx.createRadialGradient(target.x, target.y, 2, target.x, target.y, 34);
  tip.addColorStop(0, 'rgba(255,252,232,1)');
  tip.addColorStop(0.35, 'rgba(255,180,90,0.75)');
  tip.addColorStop(1, 'rgba(255,140,70,0)');
  ctx.fillStyle = tip;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Impact: a hot ring and a splash of light where the sand turns to glass.
  ctx.shadowColor = `rgba(${colour},0.9)`;
  ctx.shadowBlur = 40;
  ctx.fillStyle = `rgba(255,255,240,0.95)`;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(${colour},0.75)`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawYacht(ctx, yacht, time) {
  ctx.save();
  ctx.translate(yacht.x, yacht.y);

  // Dust and a short wake first, behind the hull.
  for (const puff of yacht.dust || []) {
    ctx.globalAlpha = Math.max(0, puff.life) * 0.4;
    ctx.fillStyle = '#f6d9a8';
    ctx.beginPath();
    ctx.arc(puff.x - yacht.x, puff.y - yacht.y, puff.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.rotate(yacht.angle);
  ctx.scale(3.2, 3.2);
  // Hull: a long dune-runner with a runner ski on each side.
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.quadraticCurveTo(6, -13, -22, -9);
  ctx.quadraticCurveTo(-30, 0, -22, 9);
  ctx.quadraticCurveTo(6, 13, 26, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f4c98a';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#c98a4e';
  ctx.fillRect(-18, -18, 22, 4);
  ctx.fillRect(-18, 14, 22, 4);

  // Sail and mast: the silhouette that says "sand-yacht" at a glance.
  ctx.strokeStyle = '#3a2318';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -30);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,238,196,0.9)';
  ctx.beginPath();
  ctx.moveTo(1, -30);
  ctx.lineTo(22, -14);
  ctx.lineTo(1, -6);
  ctx.closePath();
  ctx.fill();

  // The crystal lens on the bow, always facing the aim: the brightest thing the player owns.
  ctx.restore();
}

export function drawLens(ctx, yacht, input, time) {
  const colour = input.colour === 'red' ? '#ff9aa4' : input.colour === 'blue' ? '#a8d8ff' : '#fff0c0';
  ctx.save();
  ctx.translate(yacht.x, yacht.y);
  ctx.shadowColor = colour;
  ctx.shadowBlur = 30;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(20, -2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // A short guide line toward the aim point, so the mouse feels connected to the lens.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(20, -2);
  ctx.lineTo(yacht.lens.x - yacht.x, yacht.lens.y - yacht.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
  void time;
}

export function drawSpirits(ctx, spirits, time) {
  for (const spirit of spirits) {
    const wobble = Math.sin(time * 6 + spirit.phase) * 2;
    ctx.save();
    ctx.translate(spirit.x, spirit.y + wobble);
    const frozen = spirit.frozen > 0;
    const colour = frozen ? '#a8d8ff' : spirit.burn > 0 ? '#ff8a6a' : spirit.colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = 22;

    if (spirit.type === 'eater') {
      // A round body with two pincers: it is here to bite glass.
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(0, 0, spirit.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1026';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-spirit.size * 0.9, -4, 6, 0.2, 2.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(spirit.size * 0.9, -4, 6, 0.8, 3.0);
      ctx.stroke();
    } else if (spirit.type === 'reflector') {
      // A tilted mirror disc with a bright rim.
      ctx.rotate(time * 0.6 + spirit.phase);
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.ellipse(0, 0, spirit.size, spirit.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4fff8';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // A prism: a triangle that splits whatever light touches it.
      ctx.rotate(time * 0.4 + spirit.phase);
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.moveTo(0, -spirit.size);
      ctx.lineTo(spirit.size, spirit.size * 0.8);
      ctx.lineTo(-spirit.size, spirit.size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff6dc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    if (spirit.eating) {
      ctx.strokeStyle = 'rgba(169,123,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(spirit.x, spirit.y, spirit.size + 10 + Math.sin(time * 14) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (frozen) {
      ctx.strokeStyle = 'rgba(168,216,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(spirit.x, spirit.y, spirit.size + 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function drawBoss(ctx, boss, time) {
  if (!boss || !boss.alive) return;
  const size = boss.size;
  ctx.save();
  ctx.translate(boss.x, boss.y);

  // Base: he fades into the storm he came from.
  const base = ctx.createLinearGradient(0, size * 0.3, 0, size * 1.9);
  base.addColorStop(0, 'rgba(96,56,60,0.55)');
  base.addColorStop(1, 'rgba(60,32,52,0)');
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(0, size * 1.1, size * 1.05, size * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // The body: bands of swirling sand, dark at the edges, each with its own noise.
  for (let band = 0; band < 22; band += 1) {
    const t = band / 21;
    const y = -size * 0.95 + t * size * 1.95;
    const halfWidth = size * (0.16 + t * 0.62) * (1 - Math.pow(Math.max(0, t - 0.72), 2) * 2.2);
    const phase = time * 1.1 + band * 0.7;
    const wobble = Math.sin(phase) * size * 0.05;
    const dark = 0.55 - t * 0.25;
    ctx.strokeStyle = `rgba(${Math.round(48 + t * 46)},${Math.round(30 + t * 26)},${Math.round(38 + t * 30)},${0.75 + dark * 0.25})`;
    ctx.lineWidth = size * 0.11;
    ctx.beginPath();
    ctx.moveTo(-halfWidth + wobble, y);
    ctx.bezierCurveTo(-halfWidth * 0.4, y - size * 0.07, halfWidth * 0.4, y + size * 0.07, halfWidth + wobble, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,158,112,0.16)';
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.moveTo(-halfWidth * 0.9 + wobble, y - size * 0.035);
    ctx.bezierCurveTo(-halfWidth * 0.3, y - size * 0.1, halfWidth * 0.4, y + size * 0.02, halfWidth * 0.92 + wobble, y - size * 0.03);
    ctx.stroke();
  }

  // Shoulders and two arms, reaching for the yacht.
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const reach = Math.sin(time * 1.3 + side) * 0.4;
    const grad = ctx.createLinearGradient(side * size * 0.3, -size * 0.5, side * size * 1.5, size * 0.4);
    grad.addColorStop(0, '#8d5c4e');
    grad.addColorStop(1, 'rgba(120,74,86,0.25)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = size * 0.3;
    ctx.beginPath();
    ctx.moveTo(side * size * 0.3, -size * 0.46);
    ctx.quadraticCurveTo(side * size * 1.15, -size * 0.2 + reach * 30, side * size * 1.42, size * 0.42 + reach * 40);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232,178,124,0.2)';
    ctx.lineWidth = size * 0.08;
    ctx.beginPath();
    ctx.moveTo(side * size * 0.32, -size * 0.52);
    ctx.quadraticCurveTo(side * size * 1.1, -size * 0.3 + reach * 30, side * size * 1.36, size * 0.3 + reach * 40);
    ctx.stroke();
  }

  // Head: darker sand, brow ridge, two burning eyes.
  ctx.fillStyle = '#3d2430';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.86, size * 0.26, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,178,124,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowColor = 'rgba(255,170,70,0.95)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffd28a';
  for (const eye of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(eye * size * 0.1, -size * 0.87, size * 0.055, size * 0.032, eye * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Crown: jagged gold-white lightning, glowing.
  ctx.strokeStyle = '#fff3c8';
  ctx.shadowColor = 'rgba(255,220,140,0.95)';
  ctx.shadowBlur = 22;
  for (let i = 0; i < 7; i += 1) {
    const x = -size * 0.24 + i * size * 0.08;
    const h = size * (0.26 + (i % 3) * 0.12);
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(x, -size * 1.0);
    ctx.lineTo(x + size * 0.03, -size * 1.0 - h * 0.55);
    ctx.lineTo(x + size * 0.07, -size * 1.0 - h * 0.35);
    ctx.lineTo(x + size * 0.055, -size * 1.0 - h);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Cracked core, hot red where the beam lands.
  const core = ctx.createRadialGradient(0, -size * 0.12, 3, 0, -size * 0.12, size * 0.3);
  core.addColorStop(0, '#fff2d6');
  core.addColorStop(0.35, 'rgba(255,120,90,0.85)');
  core.addColorStop(1, 'rgba(255,90,70,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, -size * 0.12, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,196,140,0.9)';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 + time * 0.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * size * 0.08, -size * 0.12 + Math.sin(a) * size * 0.08);
    ctx.lineTo(Math.cos(a) * size * 0.34, -size * 0.12 + Math.sin(a) * size * 0.34);
    ctx.stroke();
  }

  // Sand pouring off him.
  ctx.fillStyle = 'rgba(220,166,112,0.5)';
  for (let i = 0; i < 22; i += 1) {
    const t = (time * 0.55 + i * 0.09) % 1;
    ctx.fillRect(Math.sin(i * 2.3) * size * 0.55, size * 0.4 + t * size * 1.2, 3, 7);
  }

  // His label sits right under him.
  ctx.font = '800 15px "DejaVu Sans", "Liberation Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(18,9,20,0.9)';
  ctx.lineWidth = 4;
  const label = `THE STORM KING · PHASE ${boss.phase}/3`;
  ctx.strokeText(label, 0, size * 1.62);
  ctx.fillStyle = '#ffe9d0';
  ctx.fillText(label, 0, size * 1.62);
  ctx.textAlign = 'left';
  ctx.restore();
}

export function drawPopups(ctx, popups) {
  for (const popup of popups) {
    const fade = 1 - popup.age / popup.life;
    ctx.globalAlpha = Math.max(0, fade);
    ctx.font = '800 16px system-ui, sans-serif';
    ctx.fillStyle = popup.colour;
    ctx.strokeStyle = 'rgba(20,10,26,0.65)';
    ctx.lineWidth = 3;
    ctx.strokeText(popup.text, popup.x, popup.y);
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.globalAlpha = 1;
}

// Small labels pinned to things in the world, so a still explains itself without a legend.
export function drawWorldLabels(ctx, state) {
  const { day, yacht, time } = state;
  ctx.font = '700 10px system-ui, sans-serif';

  ctx.fillStyle = '#fff4de';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', yacht.x, yacht.y - 46);
  ctx.beginPath();
  ctx.moveTo(yacht.x, yacht.y - 42);
  ctx.lineTo(yacht.x - 4, yacht.y - 34);
  ctx.lineTo(yacht.x + 4, yacht.y - 34);
  ctx.closePath();
  ctx.fill();

  for (const port of day.ports) {
    if (!port.lit) continue;
    ctx.fillStyle = 'rgba(255,233,168,0.9)';
    ctx.fillText('BEACON LIT', port.x, port.y - 74);
  }

  ctx.font = '800 13px "DejaVu Sans", "Liberation Sans", Arial, sans-serif';
  for (const spirit of day.spirits) {
    const label = spirit.frozen > 0 ? 'FROZEN' : spirit.burn > 0.3 ? 'BURNING' : null;
    if (!label) continue;
    ctx.strokeStyle = 'rgba(18,9,20,0.9)';
    ctx.lineWidth = 4;
    ctx.strokeText(label, spirit.x, spirit.y - spirit.size - 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, spirit.x, spirit.y - spirit.size - 14);
  }
  ctx.textAlign = 'left';
  void time;
}

export function drawArena(ctx, state) {
  const { day, yacht, input, time, sun } = state;
  drawNetwork(ctx, day.network, time);
  drawBeacons(ctx, day.ports, time);
  drawSource(ctx, day.source, time);
  if (day.boss) drawBoss(ctx, day.boss, time);
  if (!state.hideSpirits) drawSpirits(ctx, day.spirits, time);
  drawYacht(ctx, yacht, time);
  drawBeam(ctx, yacht, input, sun);
  drawLens(ctx, yacht, input, time);
  if (!state.hideLabels) drawWorldLabels(ctx, state);
  drawPopups(ctx, day.popups || []);
  void ARENA;
}