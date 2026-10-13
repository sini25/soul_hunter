# Reaper's Fortune

Open `index.html` in a browser to play the demo, or use Node.js 18+ to run:

```sh
npm start
```

Then visit <http://127.0.0.1:3000>. No dependency installation or build step is
required. `npm run dev` starts the same local server.

## Controls

- Click **Spin** for a normal spin.
- Press **Spacebar** for one turbo spin at **3.25× speed**, or to speed up the
  current spin. Releasing Spacebar keeps that spin in turbo until it finishes.
  Release and press again for another spin.
- Click **Auto** for up to 10 spins; hold Spacebar to make Auto spins use turbo.
  While active, the button becomes **Stop Auto**. Click it anytime to cancel the
  remaining auto spins. The current spin finishes and pays any winnings.
- Open **?** for the game guide in Korean or English.
- Open the **Harvest Ledger** (book icon) to review Auto results. The desktop
  sidebar shows the latest payouts live. Each finished or stopped Auto run opens
  a summary with total winnings, total bets, net result, best payout, and every
  spin's result. Stopping mid-spin waits for that spin's payout before summarizing.
  The last 10 Auto sessions are kept until the page reloads; manual spins outside
  Auto are excluded. Auto continues while you view the ledger, with Stop Auto
  available inside it.

Turbo changes animation speed only; bets, winning chances, and payouts stay the same.

## Project structure

```text
soul hunter/
├── public/
│   └── assets/                 Images and audio
├── scripts/
│   ├── tests/                  Regression tests
│   ├── local/                  Existing preview files and browser profile (ignored)
│   └── build_reapers_fortune_guide.py
├── src/
│   ├── css/                    Styles and responsive layouts
│   └── js/                     Game logic and UI
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── server.js
└── TECHNICAL_GUIDE.md
```

The existing `.vscode/` editor settings are also retained. See
[TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) for source responsibilities, asset paths,
and maintenance commands.

## Win detection

The game generates a weighted random grid and evaluates it after every reel stops.
Each of the ten paylines pays for its longest consecutive match from the left:
3 symbols pay ×0.5, 4 pay ×4, 5 pay ×10, and 5 Wilds pay ×50. Wilds substitute
for regular symbols, and payouts from all winning lines are added. Multipliers
apply to the full selected bet on each line.

The symbol weights are calibrated for **90.00% theoretical RTP**. This is the
long-run expected payout divided by the total amount wagered; it does not promise
a 90% return in an individual session. All offered bets settle in whole won.
See [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md#rtp) for the calculation and settings.

Run `npm run check:rtp` to enumerate every five-symbol line combination using
the actual payout evaluator and verify the 90% target. The same check runs as
part of the regression suite.

Run the regression tests with `npm test` (Node.js 18+).
