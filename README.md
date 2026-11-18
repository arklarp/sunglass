# sunglass

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/arklarp/sunglass/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/arklarp/sunglass/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Sail a sand-yacht across the last desert and draw sunlight into glass. A crystal lens on the bow
sinters the dunes into glowing paths that carry light to the beacons of the day; spirits come to
gnaw, bounce and split them, and the storm wall never stops closing.

Seven storm days, a branching route, six relics, three spirit types with three answers, omens for
difficulty, feats, a same-seed replay, a real win and a real burial. Canvas 2D only: no libraries,
no image files, no fonts, no network — the sound is synthesised in WebAudio.

## Run it

```sh
python3 -m http.server 8080     # then open http://localhost:8080/game/
```

`?shot=cover|verb|route|lose&seed=11` freezes a staged frame, which is how `screenshots/` was taken.
`node main.ts` stages `game/` and `screenshots/` into `$MAKEFUN_OUTPUT_DIR` (default `/output`) and
writes the entry's `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>