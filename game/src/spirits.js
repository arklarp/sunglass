// Sand spirits, and the one thing each of them does to your glass network: the eater chews a path
// open, the reflector throws your beam somewhere else, the splitter cuts one path into two.

import { SPIRITS, GLASS, ARENA } from './config.js';

export class Spirit {
  constructor(type, x, y, rng) {
    const spec = SPIRITS[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = spec.hp;
    this.size = spec.size;
    this.colour = spec.colour;
    this.speed = spec.speed;
    this.frozen = 0;
    this.burn = 0;
    this.phase = rng.range(0, Math.PI * 2);
    this.target = null;
    this.eating = false;
    this.dead = false;
  }

  update(dt, world, time) {
    if (this.frozen > 0) {
      this.frozen -= dt;
      return;
    }
    const frozenScale = this.frozen > 0 ? 0.2 : 1;

    if (this.type === 'eater') {
      const segment = world.network.nearestLitSegment(this.x, this.y, 900);
      if (segment) {
        const midX = (segment.x1 + segment.x2) / 2;
        const midY = (segment.y1 + segment.y2) / 2;
        this.moveToward(midX, midY, dt, frozenScale);
        if (Math.hypot(midX - this.x, midY - this.y) < this.size + 14) {
          this.eating = true;
          const broke = world.network.chew(segment, GLASS.eatRate * dt * (this.burn > 0 ? 1.8 : 1));
          if (broke) {
            world.onPathBroken(segment);
            this.burn = 0;
          }
        } else {
          this.eating = false;
        }
      } else {
        this.wander(dt, time, frozenScale);
      }
    } else if (this.type === 'reflector') {
      this.wander(dt, time, frozenScale);
    } else {
      this.wander(dt, time, frozenScale);
    }

    this.burn = Math.max(0, this.burn - dt);
    this.x = Math.max(30, Math.min(ARENA.w - 30, this.x));
    this.y = Math.max(300, Math.min(ARENA.h - 30, this.y));
  }

  moveToward(tx, ty, dt, scale) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const length = Math.hypot(dx, dy) || 1;
    this.vx += (dx / length) * this.speed * 8 * dt * scale;
    this.vy += (dy / length) * this.speed * 8 * dt * scale;
    const speed = Math.hypot(this.vx, this.vy);
    const cap = this.speed * scale;
    if (speed > cap) {
      this.vx = (this.vx / speed) * cap;
      this.vy = (this.vy / speed) * cap;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.exp(-2.2 * dt);
    this.vy *= Math.exp(-2.2 * dt);
  }

  wander(dt, time, scale) {
    const wobble = Math.sin(time * 0.9 + this.phase) * 1.6;
    this.moveToward(
      this.homeX + Math.cos(time * 0.5 + this.phase) * 90 + wobble * 20,
      this.homeY + Math.sin(time * 0.42 + this.phase) * 60,
      dt,
      scale,
    );
  }
}

export function makeSpirits(rng, spec) {
  const list = [];
  const spawn = (type) => {
    const x = rng.range(560, ARENA.w - 90);
    const y = rng.range(360, ARENA.h - 70);
    list.push(new Spirit(type, x, y, rng));
  };
  for (let i = 0; i < spec.eaters; i += 1) spawn('eater');
  for (let i = 0; i < spec.reflectors; i += 1) spawn('reflector');
  for (let i = 0; i < spec.splitters; i += 1) spawn('splitter');
  return list;
}