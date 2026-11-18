// SUNGLASS — numbers, palette and the day table, all in one place.
// The arena is one screen: 1280x800 in world units, so a single still shows the whole verb.

export const ARENA = { w: 1280, h: 800 };

export const YACHT = {
  thrust: 900,        // px/s^2 while a direction key is held
  drag: 2.4,          // velocity lost per second, the dune gives nothing for free
  maxSpeed: 300,
  turn: 5.5,          // how fast the hull swings to face its heading
  beamReach: 330,     // how far the lens can sinter from the hull
  sinterWidth: 9,     // px of glass laid per step
  maxStep: 64,        // largest gap the beam will bridge in one frame
};

export const GLASS = {
  hp: 100,            // a fresh segment
  eatRate: 46,        // hp per second a glass-eater takes out
  repairRate: 62,     // hp per second the beam restores on an eaten segment
  joinDistance: 16,   // endpoints closer than this are joined in the light network
  colourCost: { amber: 0, red: 6, blue: 6 },  // path length a coloured lens spends per step
};

export const STORM = {
  startDistance: 1150,   // px from the arena's right edge to the wall on day 1
  speedDay: 26,          // wall closing speed, +12 per day
  speedBoss: 96,
  lightningEvery: 1.7,
};

export const SPIRITS = {
  eater: { speed: 58, size: 15, hp: 3, colour: '#a97bff' },
  reflector: { speed: 44, size: 13, hp: 2, colour: '#7dffb0' },
  splitter: { speed: 36, size: 13, hp: 2, colour: '#ffd166' },
};

export const DAYS = [
  { day: 1, beacons: 2, eaters: 1, reflectors: 0, splitters: 0, name: 'FIRST LIGHT' },
  { day: 2, beacons: 2, eaters: 2, reflectors: 1, splitters: 0, name: 'GLASS-EATERS' },
  { day: 3, beacons: 3, eaters: 2, reflectors: 1, splitters: 1, name: 'SPLIT DUNES' },
  { day: 4, beacons: 3, eaters: 3, reflectors: 1, splitters: 1, name: 'THE LONG WALL' },
  { day: 5, beacons: 3, eaters: 3, reflectors: 2, splitters: 1, name: 'REFLECTOR FIELD' },
  { day: 6, beacons: 4, eaters: 4, reflectors: 2, splitters: 2, name: 'NIGHT OF GLASS' },
  { day: 7, beacons: 3, eaters: 3, reflectors: 1, splitters: 1, name: 'THE STORM KING', boss: true },
];

export const ROUTE = [
  { name: 'CALM DUNES', note: 'fewer eaters, +1 beacon', kind: 'calm' },
  { name: 'GLASS GARDEN', note: 'one more relic, faster storm', kind: 'garden' },
];

export const RELICS = [
  { id: 'sail', name: 'WIND-CUT SAIL', note: 'the yacht flies 15% faster' },
  { id: 'wide', name: 'WIDE LENS', note: 'the beam sinters 25% further' },
  { id: 'hard', name: 'TEMPERED GLASS', note: 'your paths hold twice as long' },
  { id: 'ember', name: 'EMBER LENS', note: 'red paths burn spirits twice as fast' },
  { id: 'frost', name: 'FROST LENS', note: 'blue paths freeze for twice as long' },
  { id: 'echo', name: 'ECHO SPIRE', note: 'every beacon lit doubles your score' },
];

export const FONT = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';

export const font = (size, weight = 700) => `${weight} ${size}px ${FONT}`;

export const PALETTE = {
  skyTop: '#170f2e',
  skyMid: '#3f1f4e',
  skyLow: '#8d3d3c',
  sun: '#ffcf90',
  sunCore: '#fff4d6',
  sand: '#b67338',
  sandDark: '#6d4426',
  sandLight: '#e0a463',
  duneShade: '#462a1a',
  glass: '#6effd6',
  glassLit: '#ddfff6',
  glassRed: '#ff6a7a',
  glassBlue: '#79c4ff',
  beacon: '#ffe9a8',
  dark: '#140d20',
  storm: '#150f28',
  ui: '#fff4de',
  uiDim: '#c9a37a',
  accent: '#ff9a3c',
};