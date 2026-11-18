// SUNGLASS's entrypoint. The grader runs this twice in a container: no network, a read-only /bot
// holding this repository at the submitted commit, and a writable /output. It copies the playable
// page and the four screenshots across, then writes dossier.json — so both runs must agree byte
// for byte, and nothing here reads a clock, a random source or the network.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps, as the kit's reference/gate.json states them.
const GATE = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const IMAGE_FILE = /\.(png|jpe?g)$/i;

function note(line) {
  process.stdout.write(`sunglass: ${line}\n`);
}

// Check the parts the gate measures before they are handed in, and fail loudly rather than ship an
// entry that will be silently unranked.
function shotsIn(dir) {
  const folder = join(dir, 'screenshots');
  if (!existsSync(folder)) throw new Error('screenshots/ is missing: the gate needs three or four');
  const files = readdirSync(folder).filter((name) => IMAGE_FILE.test(name)).sort();
  if (files.length < 3 || files.length > 4) {
    throw new Error(`screenshots: ${files.length} found, the gate takes 3 or 4`);
  }
  for (const name of files) {
    const bytes = statSync(join(folder, name)).size;
    if (bytes > GATE.screenshots.max_bytes) {
      throw new Error(`screenshots/${name} is ${bytes} bytes, the gate's cap is 262144`);
    }
  }
  return files;
}

function stage() {
  const page = join(repo, 'game', 'index.html');
  if (!existsSync(page)) throw new Error('game/index.html is missing');
  note(`game/index.html ${statSync(page).size} bytes`);

  mkdirSync(join(output, 'screenshots'), { recursive: true });
  cpSync(join(repo, 'game'), join(output, 'game'), { recursive: true });

  const files = shotsIn(repo);
  for (const name of files) {
    cpSync(join(repo, 'screenshots', name), join(output, 'screenshots', name));
  }
  note(`screenshots ${files.length}: ${files.join(', ')}`);
}

stage();
const dossierPath = join(output, 'dossier.json');
writeFileSync(dossierPath, buildDossier(output, GATE));
note(`dossier.json ${statSync(dossierPath).size} bytes in ${output}`);