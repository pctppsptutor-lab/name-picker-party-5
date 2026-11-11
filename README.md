# Name Picker Party 5

The last six classroom name-picker mini-games (25–30), on the same engine and look as Name Picker Party 1–4.

## How to run

From this folder run `python -m http.server 8769` and open http://localhost:8769/ in Chrome or Edge.

| Game | How it works | Twist |
|---|---|---|
| 25 Weather Machine Cold | Students stand under little clouds while the machine runs sun, rain and snow; a rainbow marks the pick. | The first rainbow sneezes into a scarf; a sunbeam bounces off a mirror onto the real winner. |
| 26 Time Machine Mix-Up | Ten time portals show their era symbols, then swap; the right portal brings the winner back to class. | The first portal sends someone back with a cooking pot on their head; the dino robot spins the time ring. |
| 27 Puppy Pool Float Race | Puppies paddle past hurdles and floats to the golden bone. | The leader chases its own tail on a ring; a float gate swings open for another puppy. |
| 28 Broken Invisibility Cloak | Everyone vanishes; footprints, shadows and moving things are the clues. | The footprints lead to a plant wearing shoes; a hiccup makes the real cloak's shadow point to the winner. |
| 29 Stubborn Vending Machine | A coin turns the coil, the capsule rolls over a chute, seesaw and lever into one of ten trays. | The capsule sticks on the seesaw; a can with legs kicks the spare lever. |
| 30 Golden Carrot Bunny Dash | Bunnies race through the vegetable rows to bring the golden carrot to the basket. | The first golden carrot is a balloon and floats away; a mole pushes the real one to another bunny. |

Rounds last 7 or 10 seconds. Plot Twist is off by default and can be enabled in Settings. The winner is chosen when you press Pick.


## Sound effects

Game-specific MP3 effects load only for the selected game and use the existing Sound toggle and SFX volume. Credits and edit details are in `assets/sfx/credits.html` and `assets/sfx/sources.json`.

Run the dependency-free audio lifecycle checks with `node tests/sfx.test.cjs`.

Each game streams its own Kevin MacLeod BGM from `assets/bgm/` after a user gesture. Music credits and CC BY 4.0 sources are in `assets/bgm/credits.html`. Short action/result jingles retain VCSL samples; foreground effects briefly lower the music.

Regression checks: `node tests/core.test.cjs` and `node tests/sw.test.cjs`. A BGM becomes available offline after that game’s track has loaded once.

## Build and loading

Run `npm ci` then `npm run build` after editing HTML, game source, the service worker or assets. Commit the generated `games/dist/` files and `sw.js` together. `npm run check:build` checks that generated files and cache hashes match the source.

The page loads one minified shared runtime; each game module loads when selected and can retry after a network error. Visited games remain available offline after their resources have been cached. A game not visited online yet needs a connection for its first load.

Media cache versions depend on asset contents, so code-only updates retain images, music and fonts. An asset change creates a fresh media cache. The supplied logo uses lossless WebP; fonts are the same Google Fonts files hosted locally, with their OFL licenses in `assets/fonts/`.
