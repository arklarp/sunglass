// Everything drawn on top of the desert: the glass the player laid, the beacons it feeds, the
// yacht and its lens, the beam falling out of the sun, the spirits and the storm.

import { PALETTE, ARENA } from './config.js';

export function drawNetwork(ctx, network, time) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

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
    ctx.globalAlpha = segment.lit ? 1 : 0.32;
    ctx.strokeStyle = segment.lit ? colour : 'rgba(150,170,200,0.5)';
    ctx.lineWidth = 5 + health * 7;
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
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

  ctx.strokeStyle = `rgba(255,255,255,0.85)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sun.x, sun.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

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
  ctx.scale(1.4, 1.4);
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
  ctx.save();
  ctx.translate(boss.x, boss.y);
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);

  // The wall behind him: a dark crown of cloud, the storm made personal.
  const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, boss.size * 2.4);
  aura.addColorStop(0, 'rgba(74,40,120,0.85)');
  aura.addColorStop(0.55, 'rgba(40,22,70,0.5)');
  aura.addColorStop(1, 'rgba(20,12,36,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, boss.size * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Crown spikes.
  ctx.fillStyle = '#241540';
  ctx.strokeStyle = '#8f6bff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const angle = -Math.PI * 0.85 + (i / 6) * Math.PI * 0.7;
    const length = boss.size * (1.1 + (i % 2) * 0.35) + Math.sin(time * 3 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle - 0.12) * boss.size * 0.5, Math.sin(angle - 0.12) * boss.size * 0.5);
    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    ctx.lineTo(Math.cos(angle + 0.12) * boss.size * 0.5, Math.sin(angle + 0.12) * boss.size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Body: a grinding mass of storm with a hot core showing through.
  const body = ctx.createRadialGradient(0, -6, 6, 0, 0, boss.size);
  body.addColorStop(0, boss.hitFlash > 0 ? '#fff0c0' : '#c98aff');
  body.addColorStop(0.5, '#5b2f9c');
  body.addColorStop(1, '#1b1030');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, boss.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(200,170,255,${0.5 + pulse * 0.4})`;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Eyes.
  ctx.fillStyle = '#fff4de';
  ctx.beginPath();
  ctx.ellipse(-boss.size * 0.28, -boss.size * 0.1, 8, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(boss.size * 0.28, -boss.size * 0.1, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lightning crawling over the body, one bolt per phase.
  ctx.strokeStyle = 'rgba(220,230,255,0.85)';
  ctx.lineWidth = 2;
  for (let bolt = 0; bolt < boss.phase; bolt += 1) {
    ctx.beginPath();
    let x = -boss.size * 0.6 + bolt * 24;
    let y = -boss.size * 0.8;
    ctx.moveTo(x, y);
    for (let step = 0; step < 4; step += 1) {
      x += Math.sin(time * 6 + step + bolt) * 12;
      y += boss.size * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.font = '800 12px system-ui, sans-serif';
  ctx.fillStyle = '#e8dcff';
  ctx.textAlign = 'center';
  ctx.fillText('THE STORM KING', 0, -boss.size - 40);
  ctx.fillStyle = 'rgba(20,10,32,0.75)';
  ctx.fillRect(-boss.size, -boss.size - 30, boss.size * 2, 12);
  ctx.fillStyle = '#c98aff';
  ctx.fillRect(-boss.size, -boss.size - 30, boss.size * 2 * Math.max(0, boss.hp / boss.maxHp), 12);
  ctx.strokeStyle = 'rgba(230,220,255,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-boss.size, -boss.size - 30, boss.size * 2, 12);
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillStyle = '#fff4de';
  ctx.fillText(`PHASE ${boss.phase}/3`, 0, -boss.size - 48);
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

  for (const spirit of day.spirits) {
    if (spirit.frozen > 0) {
      ctx.fillStyle = 'rgba(168,216,255,0.95)';
      ctx.fillText('FROZEN', spirit.x, spirit.y - spirit.size - 12);
    } else if (spirit.burn > 0.3) {
      ctx.fillStyle = 'rgba(255,150,120,0.95)';
      ctx.fillText('BURNING', spirit.x, spirit.y - spirit.size - 12);
    }
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