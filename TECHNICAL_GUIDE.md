# Reaper's Fortune technical guide

## Run and verify

Use Node.js 18 or newer. The local server and tests use Node's built-in modules,
so npm dependencies and a frontend build step are unnecessary.

```sh
npm start
npm test
npm run check:rtp
```

The server listens at <http://127.0.0.1:3000>. `npm run dev` is an alias for
`npm start`. Set `PORT` to choose another port or `HOST` to change the bind address.
For example, in PowerShell:

```powershell
$env:PORT = '5501'
npm start
```

`server.js` serves `index.html`, `public/`, and `src/`. The old
`/reapers_fortune_3_gems.html` URL also serves the game when using this server.
Game state and outcomes still run in the browser; the server only delivers files.
Opening `index.html` directly or using VS Code Live Server also works.

## Source responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Page markup, assets, and stylesheet/script loading |
| `src/css/reapers-fortune.css` | Base styles, desktop layout, and animations |
| `src/css/responsive.css` | Phone/tablet layouts, landscape controls, and safe-area spacing |
| `src/css/auto-history.css` | Harvest Ledger sidebar and responsive summary dialog |
| `src/js/config.js` | Symbols, weights, match payouts, paylines, and bet options |
| `../shared/js/paylines.js` | Shared evaluation of landed symbols, Wilds, and combined line payouts |
| `../shared/js/slot-engine.js` | Shared weighted grid generation, settlement, and Scatter awards |
| `src/js/i18n.js` | Korean/English translations and currency formatting |
| `../shared/js/audio.js` | Shared music, sound effects, audio unlocking, and sound controls |
| `src/js/effects.js` | Viewport fitting, reel animations, particles, and win effects |
| `src/js/auto-history.js` | Auto session history, totals, live ledger, and summary dialog |
| `src/js/game.js` | Game state, spin settlement, grid rendering, UI, and controls |
| `public/assets/` | Images and audio files |
| `scripts/tests/` | Node regression tests |
| `scripts/check-rtp.cjs` | Exhaustive theoretical RTP calculation and 90% acceptance check |
| `scripts/build_reapers_fortune_guide.py` | Optional Word guide generator |
| `scripts/local/` | Preserved temporary previews and Edge preview profile; ignored by Git |

The HTML loads classic scripts with `defer`, in the order shown above. Keep
`config.js` first and `game.js` last. This preserves direct filesystem loading.
The scripts share one `window.ReapersFortune` namespace. Audio, effects, and
translation files expose factories; state stays private to each instance.
`game.js` creates those instances and connects them to the page.

## Asset paths

HTML and JavaScript image/audio paths resolve from `index.html`, so they begin
with `public/assets/`. CSS paths resolve from `src/css/`, so they begin with
`../../public/assets/`. Keep these relative paths to support both direct opening
and HTTP serving. Source scripts and styles load from `src/js/` and `src/css/`.

## RTP

The current theoretical return to player is **90.00%**, with a 10% expected
difference between total wagers and payouts over the long run. An individual
player or session can return more or less than 90%.

`src/js/config.js` sets the Wild weight to `6.782112456049289`; the other weights
are Ruby 20, Phantom 18, Amethyst 18, Soul Orb 17, Seven 12, Green 7, Blue 6, and
Crown 4. Each cell independently draws from these relative weights, so the
Wild probability is about 6.2345843%. Payouts remain 0.5x, 4x, and 10x for the
longest three-, four-, and five-symbol match, or 50x for five Wilds. Each of the
ten lines pays against the full spin bet. The offered bets of 10, 20, 30, and
50 won therefore produce whole-won payouts without rounding.

The calibration was obtained by solving for the Wild weight while holding
the regular-symbol weights, payouts, and paylines fixed. For a line, let `w`
be the Wild probability and `q_s` the probability of either regular symbol `s`
or Wild. The expected payout multiplier is:

```text
E[line] = sum over regular symbols s of:
            0.5 * (q_s^3 - w^3) * (1 - q_s)
          + 4   * (q_s^4 - w^4) * (1 - q_s)
          + 10  * (q_s^5 - w^5)
          + 50 * w^5 once for the all-Wild outcome
RTP = 10 * E[line] = 0.90
```

`npm run check:rtp` independently enumerates all 59,049 five-symbol combinations,
weights them by their probabilities, and calls the real payout evaluator. Since
every payline samples one independent cell from each reel, all lines have the
same marginal distribution. The calculation repeats each sampled symbol across
its reel's rows to obtain the sum of the ten line expectations. This computes
expected total payout; it does not simulate full-grid hit rates or variance.
Overlapping lines affect variance, but linearity of expectation still applies.

The command and regression test reject deviations greater than `1e-10` in the
RTP ratio (0.00000001 percentage points), allowing floating-point arithmetic
error. Changing a target label does not calibrate the game: any changes to
weights, paylines, payouts, sampling, or settlement require recalculation.
The current sampler is browser-side `Math.random()` with fixed probabilities;
it does not adjust odds in response to balances, prior results, or user count.

## Optional Word guide

The guide generator contains historical descriptions of the earlier outcome-table
demo, including an obsolete RTP calculation. Use this technical guide and
`npm run check:rtp` for the current payout model.

The guide generator requires Python and the `python-docx` package. Run it from
the project root with:

```sh
python scripts/build_reapers_fortune_guide.py
```

It reads gem images from `public/assets/gems/` and writes
`Reapers_Fortune_Game_Guide.docx` in the project root. These paths are resolved
from the script location, independent of the shell's working directory.
