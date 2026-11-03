# Vendored Stockfish.js (lite, single-threaded)

Source: npm package `stockfish@19.0.1` (https://github.com/nmrugg/stockfish.js), fetched from
`https://unpkg.com/stockfish@19.0.1/`. Only the lite single-threaded build is vendored; the full
package is 205 MB, so it is not an npm dependency.

| File | Origin in the package |
| --- | --- |
| `stockfish-19-lite-single.js` | `bin/stockfish-19-lite-single.js` |
| `stockfish-19-lite-single.wasm` | `bin/stockfish-19-lite-single.wasm` |
| `LICENSE` | `Copying.txt` (GPL-3.0) |

Loaded from Node by `src/game/engine.ts` (`require(file)()` then UCI via `processCommand`).
The WASM must stay next to the `.js` file. `next.config.ts` bundles this folder with `/api/**` routes.
Stockfish is GPL-3.0; the license applies to these files.
