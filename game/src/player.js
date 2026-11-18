// The sand-yacht and its crystal lens. WASD drives it with real momentum over the dunes; the
// mouse aims the lens, and the beam sinters a glass path wherever it lands.

import { YACHT, GLASS, ARENA } from './config.js';

export class Yacht {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 300;
    this.y = 560;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.hull = 100;
    this.trail = [];
    this.lens = { x: 420, y: 520 };
    this.firing = false;
    this.sintering = false;
    this.lastPoint = null;
    this.alive = true;
    this.speedBoost = 1;
    this.reachBonus = 0;
  }

  update(dt, input, network) {
    const axis = input.axis();
    const thrust = YACHT.thrust * this.speedBoost;
    this.vx += axis.x * thrust * dt;
    this.vy += axis.y * thrust * dt;

    // Dune drag: proportional to speed, so the yacht glides and settles instead of snapping.
    const drag = Math.exp(-YACHT.drag * dt);
    this.vx *= drag;
    this.vy *= drag;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > YACHT.maxSpeed * this.speedBoost) {
      const scale = (YACHT.maxSpeed * this.speedBoost) / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(60, Math.min(ARENA.w - 60, this.x));
    this.y = Math.max(330, Math.min(ARENA.h - 50, this.y));

    if (speed > 18) {
      const target = Math.atan2(this.vy, this.vx);
      let delta = target - this.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      this.angle += delta * Math.min(1, YACHT.turn * dt);
    }

    this.trail.push({ x: this.x, y: this.y, life: 1 });
    if (this.trail.length > 30) this.trail.shift();
    for (const point of this.trail) point.life -= dt * 1.6;

    // Trail dust, the cheap kind: two puffs per frame behind the hull.
    this.dust = this.dust || [];
    if (speed > 60 && Math.random() < 0.7) {
      this.dust.push({ x: this.x - Math.cos(this.angle) * 16, y: this.y - Math.sin(this.angle) * 16, life: 1, r: 4 + Math.random() * 5 });
    }
    for (let i = this.dust.length - 1; i >= 0; i -= 1) {
      const puff = this.dust[i];
      puff.life -= dt * 1.5;
      puff.r += dt * 22;
      if (puff.life <= 0) this.dust.splice(i, 1);
    }

    this.aim(input, network);
    return speed;
  }

  // The lens: the target is clamped to the yacht's reach, so the player must sail to the work.
  aim(input, network) {
    const reach = YACHT.beamReach + this.reachBonus;
    let tx = input.mouse.x;
    let ty = input.mouse.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance > reach) {
      tx = this.x + (dx / distance) * reach;
      ty = this.y + (dy / distance) * reach;
    }
    this.lens.x = tx;
    this.lens.y = ty;
    this.firing = input.firing;
    this.sintering = false;
    if (!input.firing || !network) {
      this.lastPoint = null;
      return;
    }

    const colour = input.colour || 'amber';
    const previous = this.lastPoint;
    if (previous) {
      const step = Math.hypot(tx - previous.x, ty - previous.y);
      if (step <= YACHT.maxStep) {
        const segment = network.add(previous.x, previous.y, tx, ty, colour);
        if (segment) this.sintering = true;
      }
      // Repairing over a chewed path: the beam heals what it crosses.
      const under = network.under(tx, ty, YACHT.sinterWidth + 6);
      if (under && under.hp < under.maxHp) {
        network.repair(under, GLASS.repairRate * 0.016);
        this.sintering = true;
      }
    }
    this.lastPoint = { x: tx, y: ty };
  }
}