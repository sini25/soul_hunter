const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateRtp, TARGET_RTP, TOLERANCE } = require('../check-rtp.cjs');

test('the configured game returns 90% RTP with whole-won payouts at every offered bet', () => {
  const result = calculateRtp();
  assert.equal(TARGET_RTP, 0.9, 'company RTP requirement');
  assert.equal(result.combinations, 9 ** 5);
  assert.equal(result.paylineCount, 10);
  assert.ok(Math.abs(result.probabilityMass - 1) <= TOLERANCE, 'all outcome probabilities sum to one');
  assert.ok(Math.abs(result.rtp - TARGET_RTP) <= TOLERANCE,
    `expected 90% RTP, calculated ${result.rtp * 100}%`);
  assert.equal(result.wholeWonPayouts, true, 'payouts must not require rounding fractional won');
});
