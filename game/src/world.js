// One storm day: the sun-lens, the beacons that must be lit, the spirits working against the
// network, the wall closing from the east, and the checks that end the day in a win or a burial.

import { DAYS, STORM, ARENA, PALETTE } from './config.js';
import { Network } from './network.js';
import { makeSpirits } from './spirits.js';

export class Day {
  constructor(number, seed, relics, rng) {
    this.number = number;
    this.spec = DAYS[Math.min(DAYS.length - 1, number - 1)];
    this.rng = rng;
    this.relics = relics || [];
    this.source = { x: 214, y: 420 };
    this.ports = [];
    this.stormX = ARENA.w + STORM.startDistance;
    this.time = 0;
    this.won = false;
    this.lost = false;
    this.score = 0;
    this.combo = 1;
    this.brokenCount = 0;
    this.litHistory = 0;
    this.flash = 0;
    this.stormSpeed = this.spec.boss ? STORM.speedBoss : STORM.speedDay + number * 12;

    // Beacons spread across the dunes, never on top of the lens.
    for (let i = 0; i < this.spec.beacons; i += 1) {
      const angle = -0.9 + (i / Math.max(1, this.spec.beacons - 1)) * 1.8;
      const radius = 430 + i * 40;
      this.ports.push({
        id: i,
        x: Math.max(420, Math.min(ARENA.w - 150, this.source.x + 240 + Math.cos(angle) * radius + this.rng.range(-40, 40))),
        y: Math.max(360, Math.min(ARENA.h - 90, this.source.y + Math.sin(angle) * radius * 0.7 + this.rng.range(-40, 40))),
        lit: false,
        step: i,
        pulse: this.rng.range(0, Math.PI * 2),
      });
    }

    this.network = new Network(this.source, this.ports);
    this.spirits = makeSpirits(this.rng, this.spec);
    this.seed = seed;
    this.popups = [];
    this.pulseCooldown = 0;
    this.comboTimer = 0;

    // The Storm King: the boss of day 7, with its own phases, health and appetite for glass.
    this.boss = this.spec.boss
      ? {
        name: 'THE STORM KING',
        hp: 900,
        maxHp: 900,
        phase: 1,
        phases: 3,
        x: ARENA.w - 380,
        y: 500,
        size: 120,
        hitFlash: 0,
        alive: true,
      }
      : null;
  }

  popup(x, y, text, colour) {
    this.popups.push({ x, y, text, colour: colour || '#ffe9a8', life: 1.1, age: 0 });
  }

  // The right mouse button: a pulse of light that welds every nearby path shut and stuns spirits.
  pulse(yacht) {
    if (this.pulseCooldown > 0) return false;
    this.pulseCooldown = 4.2;
    let repaired = 0;
    for (const segment of this.network.segments) {
      const midX = (segment.x1 + segment.x2) / 2;
      const midY = (segment.y1 + segment.y2) / 2;
      if (Math.hypot(midX - yacht.x, midY - yacht.y) < 210) {
        segment.hp = segment.maxHp;
        repaired += 1;
      }
    }
    for (const spirit of this.spirits) {
      if (Math.hypot(spirit.x - yacht.x, spirit.y - yacht.y) < 230) spirit.frozen = 1.8;
    }
    if (this.boss && Math.hypot(this.boss.x - yacht.x, this.boss.y - yacht.y) < 260) {
      this.boss.hp = Math.max(1, this.boss.hp - 40);
      this.boss.hitFlash = 0.4;
    }
    this.popup(yacht.x, yacht.y - 60, `PULSE · ${repaired} PATHS WELDED`, '#ddfff6');
    return true;
  }

  update(dt, yacht, input, sound) {
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.pulseCooldown = Math.max(0, this.pulseCooldown - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.combo = 1;

    // The wall closes; whatever it has passed is swallowed, glass and all.
    this.stormX -= this.stormSpeed * dt;
    this.network.consume(this.stormX - 20);
    this.network.rebuild();

    for (const spirit of this.spirits) {
      spirit.update(dt, this, this.time);
      // A red path burns anything that crosses it; a blue path freezes it in place.
      const under = this.network.near(spirit.x, spirit.y, spirit.size + 6);
      if (under && under.hp > 0) {
        if (under.colour === 'red') spirit.burn = 1.1;
        else if (under.colour === 'blue') spirit.frozen = Math.max(spirit.frozen, 0.9);
        else if (under.lit) spirit.burn = 0.5;
      }
      // The lens beam itself pushes spirits back and, on a red lens, burns them.
      if (yacht.sintering) {
        const distanceToBeam = Math.hypot(spirit.x - yacht.lens.x, spirit.y - yacht.lens.y);
        if (distanceToBeam < 46) {
          spirit.burn = Math.max(spirit.burn, 0.8);
          spirit.hp -= dt * (input.colour === 'red' ? 2.2 : 0.8);
          if (spirit.hp <= 0) {
            spirit.dead = true;
            this.combo = Math.min(9, this.combo + 1);
            this.comboTimer = 2.6;
            this.score += 120 * this.combo;
            this.popup(spirit.x, spirit.y - 20, `+${120 * this.combo}`, '#ffe9a8');
            this.flash = 0.35;
          }
        }
      }
      if (spirit.type === 'reflector' && yacht.sintering) {
        const bounce = Math.hypot(spirit.x - yacht.lens.x, spirit.y - yacht.lens.y);
        if (bounce < 40) this.flash = Math.max(this.flash, 0.3);
      }
    }
    this.spirits = this.spirits.filter((spirit) => !spirit.dead);

    // Floating score numbers, short-lived, so a still can catch them mid-flight.
    for (let i = this.popups.length - 1; i >= 0; i -= 1) {
      const popup = this.popups[i];
      popup.age += dt;
      popup.y -= 34 * dt;
      if (popup.age >= popup.life) this.popups.splice(i, 1);
    }

    // The Storm King: a slow wall of a spirit that eats glass faster than anything else.
    if (this.boss && this.boss.alive) {
      const king = this.boss;
      king.hitFlash = Math.max(0, king.hitFlash - dt);
      const prey = this.network.nearestLitSegment(king.x, king.y, 1200);
      if (prey) {
        const midX = (prey.x1 + prey.x2) / 2;
        const midY = (prey.y1 + prey.y2) / 2;
        const dx = midX - king.x;
        const dy = midY - king.y;
        const distance = Math.hypot(dx, dy) || 1;
        king.x += (dx / distance) * 34 * dt;
        king.y += (dy / distance) * 34 * dt;
        if (distance < king.size + 30) {
          const broke = this.network.chew(prey, 120 * dt);
          if (broke) {
            this.onPathBroken(prey);
            this.popup(prey.x2, prey.y2 - 30, 'PATH CUT', '#ff8f9a');
          }
        }
      }
      if (yacht.sintering && Math.hypot(king.x - yacht.lens.x, king.y - yacht.lens.y) < king.size + 40) {
        king.hp -= dt * (input.colour === 'red' ? 60 : 16);
        king.hitFlash = 0.2;
        this.popup(king.x + this.rng.range(-30, 30), king.y - 40, `+${Math.round(60)}`, '#ffd166');
      }
      king.phase = king.hp > king.maxHp * 0.66 ? 1 : king.hp > king.maxHp * 0.33 ? 2 : 3;
      if (king.hp <= 0) {
        king.hp = 0;
        king.alive = false;
        this.score += 4000;
        this.popup(king.x, king.y - 60, 'THE STORM KING BROKEN', '#ffe9a8');
        this.flash = 0.8;
      }
    }

    const litNow = this.network.litBeacons();
    if (litNow > this.litHistory) {
      this.litHistory = litNow;
      this.combo = 1 + litNow * 0.5;
      this.score += 500 * this.combo;
      this.flash = 0.6;
      if (sound) sound.beacon(litNow - 1);
    }

    // Loss: the wall reaches the yacht, or it crosses a beacon and the day is gone.
    if (this.stormX <= yacht.x + 10 || this.ports.some((port) => port.x > this.stormX)) {
      this.lost = true;
      yacht.alive = false;
    }
    if (this.stormX <= 0) this.lost = true;

    if (litNow === this.ports.length) {
      const kingDown = !this.boss || !this.boss.alive;
      if (kingDown) {
        this.won = true;
        this.score += 2000 + Math.round(this.stormX * 2);
      }
    }

    if (sound) sound.setStorm(1 - Math.max(0, Math.min(1, (this.stormX - yacht.x) / 900)));
    return { litNow, total: this.ports.length };
  }

  onPathBroken(segment) {
    this.brokenCount += 1;
    this.flash = 0.25;
    this.score = Math.max(0, this.score - 40);
  }

  stormCloseness(yacht) {
    return 1 - Math.max(0, Math.min(1, (this.stormX - yacht.x) / 900));
  }
}

export const STORM_COLOUR = PALETTE.storm;