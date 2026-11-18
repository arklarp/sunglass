// The glass network: the paths the player draws, the light that runs along them, and the beacons
// they feed. One flood fill from the sun-lens marks every segment and beacon that is lit.

import { GLASS } from './config.js';

const CELL = 20;

function cellKey(x, y) {
  return `${Math.round(x / CELL)},${Math.round(y / CELL)}`;
}

export class Network {
  constructor(source, ports) {
    this.source = source;            // {x, y} where the sun-lens stands
    this.ports = ports;              // beacons: {x, y, id, lit, step}
    this.segments = [];
    this.litCount = 0;
    this.facets = [];   // closed panes the cover fills: [[x,y],...] polygons
  }

  add(x1, y1, x2, y2, colour) {
    if (Math.hypot(x2 - x1, y2 - y1) < 3) return null;
    const segment = {
      x1, y1, x2, y2,
      colour: colour || 'amber',
      hp: GLASS.hp,
      maxHp: GLASS.hp,
      lit: false,
      born: 0,
    };
    this.segments.push(segment);
    return segment;
  }

  // Nearest segment within `radius` of a point, for repairs and for spirit targeting.
  near(x, y, radius) {
    let best = null;
    let bestDistance = radius;
    for (const segment of this.segments) {
      if (segment.hp <= 0) continue;
      const distance = pointSegmentDistance(x, y, segment);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = segment;
      }
    }
    return best;
  }

  under(x, y, radius) {
    return this.near(x, y, radius);
  }

  // Nearest segment that is currently carrying light — what the spirits come to eat.
  nearestLitSegment(x, y, radius) {
    let best = null;
    let bestDistance = radius;
    for (const segment of this.segments) {
      if (segment.hp <= 0 || !segment.lit) continue;
      const distance = pointSegmentDistance(x, y, segment);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = segment;
      }
    }
    return best;
  }

  chew(segment, amount) {
    segment.hp = Math.max(0, segment.hp - amount);
    return segment.hp <= 0;
  }

  repair(segment, amount) {
    segment.hp = Math.min(segment.maxHp, segment.hp + amount);
  }

  // Everything cut off by the storm's edge loses its light and its glass.
  consume(rightOf) {
    const kept = [];
    for (const segment of this.segments) {
      const midX = (segment.x1 + segment.x2) / 2;
      if (midX > rightOf) continue;
      kept.push(segment);
    }
    this.segments = kept;
  }

  totalLength() {
    return this.segments.reduce((sum, s) => sum + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);
  }

  // Flood fill from the lens along shared endpoints; marks segments and beacons lit.
  rebuild() {
    const graph = new Map();
    const touch = (key, index) => {
      if (!graph.has(key)) graph.set(key, []);
      graph.get(key).push(index);
    };
    this.segments.forEach((segment, index) => {
      if (segment.hp <= 0) return;
      touch(cellKey(segment.x1, segment.y1), index);
      touch(cellKey(segment.x2, segment.y2), index);
    });

    const lit = new Set();
    const queue = [];
    const seedNear = (x, y) => {
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const list = graph.get(cellKey(x + dx * CELL * 0.6, y + dy * CELL * 0.6));
          if (!list) continue;
          for (const index of list) queue.push(index);
        }
      }
    };
    seedNear(this.source.x, this.source.y);
    for (const port of this.ports) seedNear(port.x, port.y);

    // The lens itself is the root: a port alone does not light anything, so seed the lens first
    // and let the fill travel outward from it.
    const root = new Set();
    const rootQueue = [];
    const lensList = graph.get(cellKey(this.source.x, this.source.y)) || [];
    for (const index of lensList) rootQueue.push(index);
    while (rootQueue.length) {
      const index = rootQueue.pop();
      if (root.has(index)) continue;
      root.add(index);
      const segment = this.segments[index];
      for (const end of [[segment.x1, segment.y1], [segment.x2, segment.y2]]) {
        const list = graph.get(cellKey(end[0], end[1])) || [];
        for (const next of list) if (!root.has(next)) rootQueue.push(next);
      }
    }

    // Now a beacon lights when a root-lit path reaches it: an endpoint on the port, or a lit
    // segment running within a glass-width of it.
    for (const port of this.ports) {
      let onPath = false;
      const candidates = graph.get(cellKey(port.x, port.y)) || [];
      for (const index of candidates) {
        if (!root.has(index)) continue;
        const segment = this.segments[index];
        const dc1 = Math.hypot(segment.x1 - port.x, segment.y1 - port.y);
        const dc2 = Math.hypot(segment.x2 - port.x, segment.y2 - port.y);
        if (Math.min(dc1, dc2) < GLASS.joinDistance + 10) onPath = true;
      }
      if (!onPath) {
        for (const index of root) {
          const segment = this.segments[index];
          if (segment.hp <= 0) continue;
          if (pointSegmentDistance(port.x, port.y, segment) < 24) {
            onPath = true;
            break;
          }
        }
      }
      port.lit = onPath;
    }

    for (const index of root) lit.add(index);
    this.litCount = lit.size;
    this.segments.forEach((segment, index) => { segment.lit = lit.has(index); });
    void queue;
    return this.litCount;
  }

  litBeacons() {
    return this.ports.filter((port) => port.lit).length;
  }
}

export function pointSegmentDistance(px, py, segment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSq = dx * dx + dy * dy || 1;
  let t = ((px - segment.x1) * dx + (py - segment.y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (segment.x1 + t * dx), py - (segment.y1 + t * dy));
}