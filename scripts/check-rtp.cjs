const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const TARGET_RTP = 0.9;
const TOLERANCE = 1e-10;

function calculateRtp() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'config.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'shared', 'js', 'paylines.js'), 'utf8'), context);
  vm.runInContext('Math.random = () => { throw new Error("Settlement must not draw another outcome"); };', context);
  const { config, evaluateGrid } = context.window.ReapersFortune;
  const { symbolWeights, paylines, bets, scatter } = config;
  if (!paylines.length || paylines.some(line => line.length !== 5 || line.some(row => !Number.isInteger(row) || row < 0 || row > 2))) {
    throw new Error('RTP calculation requires five-reel paylines on a three-row grid');
  }
  if (symbolWeights.some(([, weight]) => !Number.isFinite(weight) || weight <= 0)) {
    throw new Error('Symbol weights must be finite and positive');
  }

  const totalWeight = symbolWeights.reduce((sum, [, weight]) => sum + weight, 0);
  const grid = [];
  let combinations = 0;
  let probabilityMass = 0;
  let rtp = 0;
  let wholeWonPayouts = true;

  function enumerate(reel, probability) {
    if (reel === 5) {
      const { mult, wins } = evaluateGrid(grid);
      rtp += probability * mult;
      probabilityMass += probability;
      combinations++;
      wholeWonPayouts &&= bets.every(bet => Number.isInteger(bet * mult) &&
        wins.every(win => Number.isInteger(bet * win.mult)));
      return;
    }
    for (const [id, weight] of symbolWeights) {
      // Every payline has the same five independent symbol draws. Repeating the
      // symbol across rows lets the real evaluator sum every line's expectation.
      // Line overlap changes variance, but not this expected total payout.
      grid[reel] = Array.from({ length: 3 }, () => ({ id }));
      enumerate(reel + 1, probability * weight / totalWeight);
    }
  }
  enumerate(0, 1);

  // Scatter positions are independent across the 5×3 grid. Each trigger adds
  // another set of spins with the same expected return, so solve the resulting
  // geometric series to include retriggers in the total RTP.
  const scatterWeight = symbolWeights.find(([id]) => id === scatter.symbolId)?.[1];
  if (!scatterWeight || !scatter.freeSpins) throw new Error('RTP calculation requires configured Scatter free spins');
  const scatterProbability = scatterWeight / totalWeight;
  let freeSpinTriggerChance = 0;
  for (let count = scatter.freeSpins.triggerCount; count <= 15; count++) {
    let combinationsForCount = 1;
    for (let position = 1; position <= count; position++) combinationsForCount *= (16 - position) / position;
    freeSpinTriggerChance += combinationsForCount * scatterProbability ** count * (1 - scatterProbability) ** (15 - count);
  }
  const expectedAwardedSpins = freeSpinTriggerChance * scatter.freeSpins.award;
  if (expectedAwardedSpins >= 1) throw new Error('Free-spin awards do not settle: expected awards per spin must be below one');
  const baseRtp = rtp;
  rtp = baseRtp / (1 - expectedAwardedSpins);
  return { rtp, baseRtp, freeSpinTriggerChance, expectedAwardedSpins, combinations, probabilityMass, paylineCount: paylines.length, wholeWonPayouts };
}

module.exports = { calculateRtp, TARGET_RTP, TOLERANCE };

if (require.main === module) {
  const result = calculateRtp();
  console.log(JSON.stringify({
    targetRtpPercent: TARGET_RTP * 100,
    theoreticalRtpPercent: result.rtp * 100,
    tolerancePercentagePoints: TOLERANCE * 100,
    ...result,
  }, null, 2));
  if (Math.abs(result.rtp - TARGET_RTP) > TOLERANCE ||
      Math.abs(result.probabilityMass - 1) > TOLERANCE || !result.wholeWonPayouts) {
    console.error('RTP verification failed. Check the symbol weights, paylines, and payout rules.');
    process.exitCode = 1;
  }
}
