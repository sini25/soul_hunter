const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the actual game controller with a small DOM and a controllable frame clock.
function game({ mult = 0, tier = 'lose', payouts = [], bets, symbolWeights = [['ruby', 1]] } = {}) {
  class Element {
    constructor(tag = 'div') {
      this.tag = tag;
      this.dataset = {};
      this.children = [];
      this.listeners = {};
      this.classes = new Set();
      this.style = { setProperty() {} };
      this.classList = {
        contains: name => this.classes.has(name),
        add: name => this.classes.add(name),
        remove: name => this.classes.delete(name),
        toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name),
      };
    }
    set innerHTML(value) { this.html = value; this.children = []; }
    get innerHTML() { return this.html; }
    appendChild(child) { this.children.push(child); child.parent = this; }
    querySelector(selector) {
      this.queries ??= new Map();
      if (!this.queries.has(selector)) this.queries.set(selector, new Element());
      return this.queries.get(selector);
    }
    querySelectorAll() { return []; }
    setAttribute(name, value) { this[name] = value; }
    matches(selector) { return selector.split(',').includes(this.tag); }
    closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
    focus() { document.activeElement = this; }
    addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
    emit(type, options = {}) {
      const event = {
        target: this, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, ...options,
      };
      for (const listener of this.listeners[type] || []) listener(event);
      return event;
    }
  }
  const elements = new Map();
  const document = new Element();
  document.getElementById = id => {
    if (!elements.has(id)) elements.set(id, new Element(id.endsWith('Btn') || id === 'rulesClose' ? 'button' : 'div'));
    return elements.get(id);
  };
  document.createElement = tag => new Element(tag);
  document.body = new Element('body');
  document.documentElement = new Element('html');
  document.activeElement = document.body;
  const window = new Element();
  let now = 0;
  let frames = [];
  let nextTimer = 0;
  const timers = new Map();
  const stats = { starts: 0, finishes: 0 };
  const context = vm.createContext({
    window, document, HTMLElement: Element,
    performance: { now: () => now },
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: (callback, delay) => {
      timers.set(++nextTimer, { callback, at: now + delay });
      return nextTimer;
    },
    clearTimeout: id => timers.delete(id),
  });
  function run(name) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', name), 'utf8'), context, { filename: name });
  }
  function runShared(name) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'shared', 'js', name), 'utf8'), context, { filename: name });
  }
  run('config.js');
  if (bets) window.ReapersFortune.config.bets = bets;
  window.ReapersFortune.config.symbolWeights = symbolWeights;
  run('i18n.js');
  run('auto-history.js');
  let outcomeIndex = 0;
  window.ReapersFortune.evaluateGrid = () => ({ mult: payouts[outcomeIndex++] ?? mult, tier, wins: [], winners: [] });
  window.ReapersFortune.createAudio = () => ({ soundOn: false, stopResultMusic() {}, playOutcomeSound() {}, bindEvents() {} });
  window.ReapersFortune.createEffects = () => ({
    fitGameToViewport() {}, buildBackdropFire() {}, landReel() {}, markWinners() {},
    drawPaylines() {}, clearWinFX() {}, runCharacterFX() {}, observeViewport() {},
    startSpinFX() { stats.starts++; }, finishSpinFX() { stats.finishes++; },
  });
  runShared('slot-engine.js');
  run('game.js');
  const el = id => document.getElementById(id);
  const press = (options = {}) => document.emit('keydown', { code: 'Space', target: document.body, ...options });
  const release = (options = {}) => document.emit('keyup', { code: 'Space', target: document.body, ...options });
  async function advance(duration) {
    for (let end = now + duration; now < end;) {
      now = Math.min(now + 5, end);
      const callbacks = frames;
      frames = [];
      callbacks.forEach(callback => callback(now));
      for (const [id, timer] of timers) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
      await Promise.resolve();
    }
  }
  async function finishSpin() {
    const started = now;
    const finished = stats.finishes + 1;
    while (stats.finishes < finished && now - started < 3000) await advance(5);
    assert.equal(stats.finishes, finished, 'spin must finish');
    return now - started;
  }
  return { el, press, release, advance, finishSpin, stats, document, window, Element,
    turbo: () => el('game').classList.contains('turbo') };
}

test('a quick Spacebar tap finishes one turbo spin, then click returns to normal speed', async () => {
  const g = game();
  assert.equal(g.el('balance').textContent, '₩100,000');
  assert.equal(g.press().defaultPrevented, true);
  assert.equal(g.release().defaultPrevented, true);
  assert.equal(g.turbo(), true);
  assert.equal(g.el('balance').textContent, '₩99,000');
  const turboTime = await g.finishSpin();
  assert.equal(g.turbo(), false);
  await g.advance(1500);
  assert.equal(g.stats.starts, 1);
  g.el('spinBtn').emit('click');
  assert.equal(g.turbo(), false);
  const normalTime = await g.finishSpin();
  assert.ok(turboTime < normalTime / 3, `${turboTime}ms turbo vs ${normalTime}ms normal`);
});

test('Spacebar speeds up a running spin without charging another bet', async () => {
  const g = game();
  g.el('spinBtn').emit('click');
  await g.advance(100);
  g.press();
  g.release();
  assert.equal(g.turbo(), true);
  assert.equal(g.stats.starts, 1);
  assert.equal(g.el('balance').textContent, '₩99,000');
  assert.ok(await g.finishSpin() < 500);
});

test('Fast Spin starts and accelerates a turbo spin', async () => {
  const g = game();
  g.el('fastSpinBtn').emit('click');
  assert.equal(g.turbo(), true);
  assert.equal(g.stats.starts, 1);
  assert.ok(await g.finishSpin() < 500);
  assert.equal(g.turbo(), false);
});

test('holding Spacebar does not start extra manual spins; a fresh press does', async () => {
  const g = game();
  g.press();
  g.press({ repeat: true });
  await g.finishSpin();
  g.press({ repeat: true });
  await g.advance(1000);
  assert.equal(g.stats.starts, 1);
  assert.equal(g.turbo(), false);
  g.release();
  g.press();
  assert.equal(g.stats.starts, 2);
  assert.equal(g.el('balance').textContent, '₩98,000');
});

test('Spacebar respects other controls, editable fields, shortcuts, and the guide', () => {
  const g = game();
  for (const tag of ['button', 'a', 'input', 'textarea', 'select']) {
    const target = new g.Element(tag);
    assert.equal(g.press({ target }).defaultPrevented, false);
    assert.equal(g.release({ target }).defaultPrevented, false);
  }
  const editable = new g.Element();
  editable.isContentEditable = true;
  g.press({ target: editable });
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'defaultPrevented']) g.press({ [modifier]: true });
  g.el('helpBtn').emit('click');
  assert.equal(g.press().defaultPrevented, false);
  assert.equal(g.release().defaultPrevented, false);
  assert.equal(g.stats.starts, 0);
  g.el('rulesClose').emit('click');
  assert.equal(g.press({ target: g.el('spinBtn') }).defaultPrevented, true);
  assert.equal(g.stats.starts, 1);
});

for (const interruption of ['release', 'blur', 'hidden', 'guide']) {
  test(`${interruption} clears held turbo for the next Auto spin without slowing the current spin`, async () => {
    const g = game();
    g.el('autoBtn').emit('click');
    g.press();
    if (interruption === 'release') g.release();
    if (interruption === 'blur') g.window.emit('blur');
    if (interruption === 'hidden') { g.document.hidden = true; g.document.emit('visibilitychange'); }
    if (interruption === 'guide') g.el('helpBtn').emit('click');
    assert.equal(g.turbo(), true);
    await g.finishSpin();
    await g.advance(650);
    assert.equal(g.stats.starts, 2);
    assert.equal(g.turbo(), false);
  });
}

test('holding Spacebar keeps Auto spins fast and Auto still stops at ten spins', async () => {
  const g = game();
  g.el('autoBtn').emit('click');
  g.press();
  await g.finishSpin();
  await g.advance(650);
  assert.equal(g.turbo(), true);
  await g.advance(15000);
  assert.equal(g.stats.starts, 10);
  assert.equal(g.stats.finishes, 10);
  assert.equal(g.el('balance').textContent, '₩90,000');
  assert.equal(g.el('autoBtn').classList.contains('active'), false);
});

test('the in-game guide and spin hint describe tap-to-turbo in both languages', () => {
  const g = game();
  assert.match(g.el('rulesBody').innerHTML, /키를 놓아도 해당 스핀이 끝날 때까지 터보가 유지됩니다/);
  assert.match(g.el('rulesBody').innerHTML, /한 페이라인에 와일드 5개가 연결되면 선택한 베팅 금액의 50배/);
  assert.match(g.el('rulesBody').innerHTML, /public\/assets\/gems\/wild\.png/);
  assert.match(g.el('rulesBody').innerHTML, /일반 스핀 결과는 화면 오른쪽 아래에 표시됩니다/);
  assert.match(g.el('rulesBody').innerHTML, /무료 스핀 획득 카드는 화면 왼쪽에서 나타난 뒤 반쯤 접혀 유지됩니다/);
  assert.match(g.el('spinBtn').title, /3\.25배/);
  g.el('langBtn').emit('click');
  assert.match(g.el('rulesBody').innerHTML, /Spacebar: one turbo spin at 3\.25× speed/);
  assert.match(g.el('rulesBody').innerHTML, /Releasing the key keeps that spin in turbo until it finishes/);
  assert.match(g.el('rulesBody').innerHTML, /Five connected Wilds on one payline pay 50×/);
  assert.match(g.el('rulesBody').innerHTML, /Normal spin results appear in the bottom-right corner/);
  assert.match(g.el('rulesBody').innerHTML, /free-spin award card slides in from the left/);
  assert.equal(g.el('spinBtn').title, 'Spacebar: turbo spin at 3.25× speed');
});

for (const turbo of [false, true]) {
  test(`Stop Auto works during a ${turbo ? 'turbo' : 'normal'} spin and preserves its payout`, async () => {
    const g = game({ mult: 4, tier: 'small' });
    const auto = g.el('autoBtn');
    auto.emit('click');
    if (turbo) g.press();
    await g.advance(100);
    assert.equal(auto.disabled, false, 'Stop Auto remains available while spinning');
    auto.emit('click');
    assert.equal(auto.classList.contains('active'), false);
    assert.equal(auto.disabled, true, 'wait for the current spin before starting another sequence');
    assert.equal(g.stats.finishes, 0);
    auto.emit('click');
    await g.finishSpin();
    assert.equal(g.el('lastWin').textContent, '4,000.00');
    assert.equal(g.el('balance').textContent, '₩103,000');
    assert.equal(auto.disabled, false);
    await g.advance(5000);
    assert.equal(g.stats.starts, 1);
    assert.equal(g.stats.finishes, 1);
  });
}

test('Stop Auto between spins cancels the pending spin without another bet', async () => {
  const g = game();
  g.el('autoBtn').emit('click');
  await g.finishSpin();
  await g.advance(645);
  g.el('autoBtn').emit('click');
  await g.advance(5000);
  assert.equal(g.stats.starts, 1);
  assert.equal(g.el('balance').textContent, '₩99,000');
  assert.equal(g.el('autoBtn').classList.contains('active'), false);
  assert.equal(g.el('autoBtn').disabled, false);
});

test('restarting Auto after stopping cancels the old timer and starts a fresh ten spins', async () => {
  const g = game();
  const auto = g.el('autoBtn');
  auto.emit('click');
  g.press();
  await g.finishSpin();
  await g.advance(100);
  auto.emit('click');
  g.el('ledgerDone').emit('click');
  auto.emit('click');
  g.press(); // Opening the summary releases the previous held shortcut.
  assert.equal(g.stats.starts, 2);
  await g.finishSpin();
  await g.advance(200); // Past the old timer, before the new sequence's next spin.
  assert.equal(g.stats.starts, 2);
  await g.advance(15000);
  assert.equal(g.stats.starts, 11);
  assert.equal(g.stats.finishes, 11);
  assert.equal(g.el('balance').textContent, '₩89,000');
  assert.equal(auto.classList.contains('active'), false);
});

test('a manual turbo spin during the Auto pause replaces the pending spin', async () => {
  const g = game();
  g.el('autoBtn').emit('click');
  await g.finishSpin();
  await g.advance(100);
  g.press();
  g.release();
  await g.finishSpin();
  await g.advance(200);
  assert.equal(g.stats.starts, 2);
  g.el('autoBtn').emit('click');
  await g.advance(3000);
  assert.equal(g.stats.starts, 2);
});

test('the Auto button and guide explain Stop Auto in Korean and English', async () => {
  const g = game();
  const auto = g.el('autoBtn');
  assert.equal(auto['aria-label'], '자동 스핀 10회 시작');
  assert.match(g.el('rulesBody').innerHTML, /자동 중지 버튼으로 바뀝니다/);
  auto.emit('click');
  assert.match(auto.innerHTML, /자동 중지/);
  assert.equal(auto['aria-label'], '자동 중지');
  g.el('langBtn').emit('click');
  assert.match(auto.innerHTML, /STOP AUTO/);
  assert.doesNotMatch(auto.innerHTML, /autoValue/);
  assert.equal(auto['aria-label'], 'STOP AUTO');
  assert.match(g.el('rulesBody').innerHTML, /Press it anytime, including while the reels spin/);
  await g.finishSpin();
  assert.doesNotMatch(auto.innerHTML, /autoValue/);
  auto.emit('click');
  assert.match(auto.innerHTML, /class="autoLabel">AUTO</);
  assert.equal(auto['aria-label'], 'Start 10 auto spins');
});

test('completed Auto summary reconciles ten losing spins without calling them a profit', async () => {
  const g = game();
  g.el('langBtn').emit('click');
  g.el('autoBtn').emit('click');
  g.press();
  await g.advance(15000);
  assert.equal(g.el('autoHistoryModal').classList.contains('open'), true);
  assert.equal(g.el('ledgerStatus').textContent, 'Harvest complete');
  assert.equal(g.el('ledgerTotalWon').textContent, '0.00');
  assert.equal(g.el('ledgerTotalBet').textContent, '10,000.00');
  assert.equal(g.el('ledgerNet').textContent, 'Net result: −10,000.00');
  assert.equal(g.el('ledgerCard').dataset.tone, 'loss');
  assert.equal(g.el('ledgerSpins').textContent, '10 / 10');
  assert.equal(g.el('ledgerBalance').textContent, '₩100,000 → ₩90,000');
  assert.equal((g.el('ledgerRows').innerHTML.match(/<tr>/g) || []).length, 10);
});

test('early-stop summary waits for settlement and totals the actual bet on each spin', async () => {
  const g = game({ payouts: [0.5, 4] });
  g.el('langBtn').emit('click');
  g.el('autoBtn').emit('click');
  await g.finishSpin();
  g.el('betSelector').children[1].emit('click'); // ₩3,000 on the next spin.
  g.press();
  g.el('autoBtn').emit('click');
  assert.equal(g.el('autoHistoryModal').classList.contains('open'), false);
  assert.equal(g.el('ledgerTotalBet').textContent, '1,000.00');
  await g.finishSpin();
  assert.equal(g.el('ledgerStatus').textContent, 'Auto stopped by you');
  assert.equal(g.el('ledgerTotalWon').textContent, '12,500.00');
  assert.equal(g.el('ledgerTotalBet').textContent, '4,000.00');
  assert.equal(g.el('ledgerNet').textContent, 'Net result: +8,500.00');
  assert.equal(g.el('ledgerBest').textContent, '12,000.00');
  assert.equal(g.el('ledgerBalance').textContent, '₩100,000 → ₩108,500');
  assert.equal(g.el('balance').textContent, '₩108,500');
  assert.equal(g.el('ledgerSpins').textContent, '2 / 10');
  await g.advance(5000);
  assert.equal(g.stats.starts, 2);
});

test('control-deck menu opens the ledger and can stop Auto while a spin is running', async () => {
  const g = game({ mult: 4 });
  g.el('autoBtn').emit('click');
  g.el('glassHistoryBtn').emit('click');
  assert.equal(g.el('autoHistoryModal').classList.contains('open'), true);
  assert.equal(g.el('ledgerStop').hidden, false);
  assert.equal(g.el('ledgerStop').disabled, false);
  assert.equal(g.el('game').querySelector('.slotMachine').inert, true);
  await g.finishSpin();
  await g.advance(750);
  assert.equal(g.stats.starts, 2);
  g.el('ledgerStop').emit('click');
  assert.equal(g.el('ledgerStop').disabled, true);
  await g.finishSpin();
  assert.equal(g.el('ledgerSpins').textContent, '2 / 10');
  assert.equal(g.el('ledgerTotalWon').textContent, '8,000.00');
  assert.equal(g.el('ledgerStop').hidden, true);
  await g.advance(4000);
  assert.equal(g.stats.starts, 2);
  g.el('ledgerDone').emit('click');
  assert.equal(g.el('game').querySelector('.slotMachine').inert, false);
});

test('manual spins outside Auto never alter its saved history', async () => {
  const g = game({ mult: 4 });
  g.el('spinBtn').emit('click');
  await g.finishSpin();
  g.el('autoBtn').emit('click');
  g.el('autoBtn').emit('click');
  await g.finishSpin();
  assert.equal(g.el('ledgerBalance').textContent, '₩103,000 → ₩106,000');
  g.el('ledgerDone').emit('click');
  g.el('spinBtn').emit('click');
  await g.finishSpin();
  g.el('glassHistoryBtn').emit('click');
  assert.equal(g.el('ledgerTotalBet').textContent, '1,000.00');
  assert.equal(g.el('ledgerTotalWon').textContent, '4,000.00');
  assert.equal(g.el('ledgerSpins').textContent, '1 / 10');
  assert.equal(g.el('ledgerBalance').textContent, '₩103,000 → ₩106,000');
});

test('three Scatters award free spins that use the triggering bet without a charge', async () => {
  const g = game({ mult: 4, symbolWeights: [['scatter', 1]] });
  g.el('spinBtn').emit('click');
  assert.equal(g.el('balance').textContent, '₩99,000');
  await g.finishSpin();
  assert.equal(g.el('balance').textContent, '₩103,000');
  assert.equal(g.el('freeSpins').textContent, 10);
  assert.equal(g.el('freeSpinsReadout').hidden, false);
  assert.equal(g.el('resultPopup').className, 'resultPopup freeSpins');
  assert.equal(g.el('resultAmount').textContent, '+10');

  g.el('spinBtn').emit('click');
  assert.equal(g.el('balance').textContent, '₩103,000');
  await g.finishSpin();
  assert.equal(g.el('balance').textContent, '₩107,000');
  assert.equal(g.el('freeSpins').textContent, 19);
});

test('history keeps ten separate Auto sessions and lets players browse both directions', async () => {
  const g = game();
  g.el('langBtn').emit('click');
  for (let i = 0; i < 11; i++) {
    g.el('autoBtn').emit('click');
    g.press();
    g.el('autoBtn').emit('click');
    await g.finishSpin();
    g.el('ledgerDone').emit('click');
  }
  g.el('glassHistoryBtn').emit('click');
  assert.equal(g.el('ledgerSession').textContent, 'Auto session 11');
  assert.equal(g.el('ledgerNewer').disabled, true);
  for (let i = 0; i < 9; i++) g.el('ledgerOlder').emit('click');
  assert.equal(g.el('ledgerSession').textContent, 'Auto session 02');
  assert.equal(g.el('ledgerOlder').disabled, true);
  assert.equal(g.el('ledgerSpins').textContent, '1 / 10');
  assert.equal(g.el('ledgerBalance').textContent, '₩99,000 → ₩98,000');
  g.el('ledgerNewer').emit('click');
  assert.equal(g.el('ledgerSession').textContent, 'Auto session 03');
});

test('insufficient balance ends Auto with a reconciled summary and no extra debit', async () => {
  const g = game({ bets: [1000, 100000] });
  g.el('langBtn').emit('click');
  g.el('betBtn').emit('click');
  assert.equal(g.el('betLimitsModal').classList.contains('open'), true);
  g.el('maxBetOptionBtn').emit('click');
  g.el('autoBtn').emit('click');
  await g.finishSpin();
  assert.equal(g.el('ledgerStatus').textContent, 'Not enough credits for the next bet');
  assert.equal(g.el('ledgerSpins').textContent, '1 / 10');
  assert.equal(g.el('ledgerTotalBet').textContent, '100,000.00');
  assert.equal(g.el('ledgerBalance').textContent, '₩100,000 → ₩0');
  await g.advance(4000);
  assert.equal(g.stats.starts, 1);
});

test('history has an empty state, traps focus, and blocks Spacebar from placing bets', () => {
  const g = game();
  g.el('glassHistoryBtn').emit('click');
  assert.equal(g.el('ledgerEmpty').hidden, false);
  assert.equal(g.el('ledgerBody').hidden, true);
  assert.equal(g.document.activeElement, g.el('ledgerClose'));
  g.press();
  g.el('autoBtn').emit('click');
  g.el('spinBtn').emit('click');
  assert.equal(g.stats.starts, 0);
  g.el('autoHistoryModal').emit('keydown', { key: 'Tab', shiftKey: true });
  assert.equal(g.document.activeElement, g.el('ledgerDone'));
  g.el('autoHistoryModal').emit('keydown', { key: 'Tab' });
  assert.equal(g.document.activeElement, g.el('ledgerClose'));
  g.el('autoHistoryModal').emit('keydown', { key: 'Escape' });
  assert.equal(g.el('autoHistoryModal').classList.contains('open'), false);
});

test('completion replaces the game guide with one summary and translates saved history', async () => {
  const g = game({ mult: 1 });
  g.el('autoBtn').emit('click');
  g.el('helpBtn').emit('click');
  await g.advance(24000);
  assert.equal(g.el('rulesModal').classList.contains('open'), false);
  assert.equal(g.el('autoHistoryModal').classList.contains('open'), true);
  assert.equal(g.el('ledgerStatus').textContent, '수확 완료');
  assert.equal(g.el('ledgerCard').dataset.tone, 'even');
  assert.equal(g.el('ledgerTotalWon').textContent, '10,000.00');
  g.el('ledgerDone').emit('click');
  g.el('langBtn').emit('click');
  g.el('glassHistoryBtn').emit('click');
  assert.equal(g.el('ledgerStatus').textContent, 'Harvest complete');
  assert.equal(g.el('ledgerNet').textContent, 'Net result: 0.00');
  assert.equal(g.el('ledgerTitle').textContent, 'Harvest Ledger');
  assert.doesNotMatch(g.el('rulesBody').innerHTML, /undefined/);
});
