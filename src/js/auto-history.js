// The Harvest Ledger keeps the last ten Auto runs for the current page session.
'use strict';

window.ReapersFortune.createAutoHistory = function({ root, t, money, won, beforeOpen, onStop, historyButtonId = 'controlMenuBtn' }) {
  const el = id => document.getElementById(id);
  const modal = el('autoHistoryModal');
  const historyBtn = el(historyButtonId);
  const closeBtn = el('ledgerClose');
  const doneBtn = el('ledgerDone');
  const stopBtn = el('ledgerStop');
  const olderBtn = el('ledgerOlder');
  const newerBtn = el('ledgerNewer');
  const cabinet = root.querySelector('.slotMachine');
  const sessions = [];
  let sequence = 0;
  let selected = null;
  let returnFocus = null;
  let open = false;

  const signed = value => (value > 0 ? '+' : value < 0 ? '−' : '') + money(Math.abs(value));
  const tone = value => value > 0 ? 'profit' : value < 0 ? 'loss' : 'even';
  const statusKey = session => ({
    running: 'ledgerRunning', stopping: 'ledgerStopping', completed: 'ledgerCompleted',
    stopped: 'ledgerStopped', funds: 'ledgerFunds',
  })[session.status];
  function totals(session) {
    const stake = session.spins.reduce((sum, spin) => sum + spin.bet, 0);
    const paid = session.spins.reduce((sum, spin) => sum + spin.payout, 0);
    return { stake, paid, net: paid - stake };
  }

  function render() {
    const labels = {
      ledgerTitle: 'ledgerTitle', ledgerKicker: 'gameTitle', ledgerWonLabel: 'ledgerTotalWon',
      ledgerBetLabel: 'ledgerTotalBet', ledgerSpinsLabel: 'ledgerSpins', ledgerBestLabel: 'ledgerBest',
      ledgerBalanceLabel: 'ledgerBalance', ledgerTableTitle: 'ledgerBreakdown',
      ledgerSpinHeading: 'ledgerSpin', ledgerBetHeading: 'bet', ledgerPaidHeading: 'ledgerPaid',
      ledgerNetHeading: 'ledgerNet', ledgerNote: 'ledgerNote', ledgerDone: 'ledgerDone',
    };
    Object.entries(labels).forEach(([id, key]) => { el(id).textContent = t(key); });
    historyBtn.setAttribute('aria-label', t('ledgerTitle'));
    historyBtn.title = t('ledgerTitle');
    closeBtn.setAttribute('aria-label', t('ledgerClose'));
    olderBtn.setAttribute('aria-label', t('ledgerOlder'));
    newerBtn.setAttribute('aria-label', t('ledgerNewer'));
    el('ledgerEmpty').hidden = Boolean(selected);
    el('ledgerBody').hidden = !selected;
    el('ledgerNavigation').hidden = !selected;
    el('ledgerStatus').textContent = selected ? t(statusKey(selected)) : t('ledgerReady');
    el('ledgerCard').dataset.tone = selected ? tone(totals(selected).net) : 'even';
    stopBtn.hidden = !selected || selected.ended;
    stopBtn.disabled = !selected || selected.status !== 'running';
    stopBtn.textContent = t(selected?.status === 'stopping' ? 'ledgerStopping' : 'stopAuto');

    if (selected) {
      const index = sessions.indexOf(selected);
      const { stake, paid, net } = totals(selected);
      olderBtn.disabled = index >= sessions.length - 1;
      newerBtn.disabled = index <= 0;
      el('ledgerSession').textContent = `${t('ledgerSession')} ${String(selected.id).padStart(2, '0')}`;
      el('ledgerTotalWon').textContent = money(paid);
      el('ledgerNet').textContent = `${t('ledgerNet')}: ${signed(net)}`;
      el('ledgerNet').dataset.tone = tone(net);
      el('ledgerTotalBet').textContent = money(stake);
      el('ledgerSpins').textContent = `${selected.spins.length} / 10`;
      el('ledgerBest').textContent = money(Math.max(0, ...selected.spins.map(spin => spin.payout)));
      el('ledgerBalance').textContent = `${won(selected.startBalance)} → ${won(selected.endBalance)}`;
      el('ledgerRows').innerHTML = selected.spins.map((spin, index) => `
        <tr><th scope="row">${String(index + 1).padStart(2, '0')}</th>
        <td>${money(spin.bet)}</td><td>${money(spin.payout)}<small>×${spin.multiplier}</small></td>
        <td data-tone="${tone(spin.payout - spin.bet)}">${signed(spin.payout - spin.bet)}</td></tr>`).join('');
      el('ledgerPending').hidden = selected.ended;
      el('ledgerPending').textContent = t(selected.status === 'stopping' ? 'ledgerStopping' : 'ledgerPending');
    }

  }

  function show(session = sessions[0] || null) {
    if (!open) returnFocus = document.activeElement;
    beforeOpen();
    selected = session;
    open = true;
    render();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ledgerOpen');
    cabinet.inert = true;
    closeBtn.focus();
  }

  function close() {
    open = false;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ledgerOpen');
    cabinet.inert = false;
    const target = returnFocus instanceof HTMLElement && !returnFocus.disabled ? returnFocus : historyBtn;
    target.focus();
    returnFocus = null;
  }

  historyBtn.addEventListener('click', () => show());
  closeBtn.addEventListener('click', close);
  doneBtn.addEventListener('click', close);
  stopBtn.addEventListener('click', () => { if (!stopBtn.disabled) onStop(); });
  olderBtn.addEventListener('click', () => {
    if (!olderBtn.disabled) { selected = sessions[sessions.indexOf(selected) + 1]; render(); }
  });
  newerBtn.addEventListener('click', () => {
    if (!newerBtn.disabled) { selected = sessions[sessions.indexOf(selected) - 1]; render(); }
  });
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  modal.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const controls = [closeBtn, olderBtn, newerBtn, el('ledgerTableRegion'), stopBtn, doneBtn].filter(control =>
        !control.hidden && !control.disabled &&
        (!(control === olderBtn || control === newerBtn) || !el('ledgerNavigation').hidden) &&
        (control !== el('ledgerTableRegion') || !el('ledgerBody').hidden));
      const first = controls[0], last = controls[controls.length - 1];
      if (!controls.includes(document.activeElement) || event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });

  return {
    render, get isOpen() { return open; },
    start(balance) {
      const session = { id: ++sequence, startBalance: balance, endBalance: balance, spins: [], status: 'running', ended: false };
      sessions.unshift(session);
      sessions.length = Math.min(sessions.length, 10);
      selected = session;
      render();
      return session;
    },
    record(session, spin) {
      if (!session || session.ended) return;
      session.spins.push({ ...spin });
      session.endBalance = spin.balance;
      render();
    },
    stopping(session) {
      if (!session || session.ended) return;
      session.status = 'stopping';
      render();
    },
    finish(session, reason) {
      if (!session || session.ended) return;
      session.status = reason;
      session.ended = true;
      show(session);
    },
  };
};
