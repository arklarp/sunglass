// Seeded randomness: one seed lays out the same dunes, beacons and spirit camps every run, so a
// screenshot, a replay and a submitted artifact all show the same desert.

export function makeRng(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  const next = () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5; state >>>= 0;
    return state / 0x100000000;
  };
  next.range = (low, high) => low + (high - low) * next();
  next.int = (low, high) => Math.floor(next.range(low, high + 1));
  next.pick = (list) => list[Math.min(list.length - 1, Math.floor(next() * list.length))];
  next.chance = (p) => next() < p;
  next.shuffle = (list) => {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return next;
}

// A slow dune height function: three sines at different angles, cheap and continuous.
export function duneHeight(x, y, seedPhase) {
  return (
    Math.sin(x * 0.0031 + seedPhase) * 46 +
    Math.sin(y * 0.0047 - seedPhase * 1.7) * 28 +
    Math.sin((x + y) * 0.0019 + seedPhase * 0.6) * 62
  );
}