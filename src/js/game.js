// Game state, reel rendering, UI, and player controls.
(() => {
  'use strict';
  const root = document.getElementById('game');
  if (root.dataset.ready) return;
  root.dataset.ready = '1';

  const { symbols, matchPayouts, wildJackpotMultiplier, scatter, wildReveal, bets } = window.ReapersFortune.config;
  const slotEngine=window.SlotGameEngine.create(window.ReapersFortune.config);
  const i18n = window.ReapersFortune.createI18n('ko');
  const { t, money, won } = i18n;

  let bet = bets[0];
  let balance = 100000;
  let lastWin = 0;
  let spinning = false;
  let turboMode = false;
  let spaceHeld = false;
  let autoRemaining = 0;
  let autoSpinTimer = 0;
  let autoSession = null;
  let freeSpins = 0;
  let freeSpinBet = 0;
  let rulesReturnFocus = null;
  let grid = [];
  let resultPopupTimer = 0;
  let currentMessage = {mainKey:'waitingMain',subKey:'waitingSub',type:''};
  let lastResultPopup = null;
  // Development-only preview: ?test=free-spins makes the next spin award free spins.
  let forceFreeSpinsNext = /(?:[?&]test=free-spins(?:&|$))/.test(window.location?.search || '');

  const reelsEl = document.getElementById('reels');
  const betSelector = document.getElementById('betSelector');
  const balanceEl = document.getElementById('balance');
  const lastWinEl = document.getElementById('lastWin');
  const glassBetBtn = document.getElementById('glassBetBtn');
  const glassBetAmount = document.getElementById('glassBetAmount');
  const glassWinAmount = document.getElementById('glassWinAmount');
  const freeSpinsEl = document.getElementById('freeSpins');
  const freeSpinsReadout = document.getElementById('freeSpinsReadout');
  const spinBtn = document.getElementById('spinBtn');
  const autoBtn = document.getElementById('autoBtn');
  const helpBtn = document.getElementById('helpBtn');
  const soundBtn = document.getElementById('soundBtn');
  const audioPrompt = document.getElementById('audioPrompt');
  const backgroundMusic = document.getElementById('backgroundMusic');
  const winMusic = document.getElementById('winMusic');
  const lossMusic = document.getElementById('lossMusic');
  const rulesModal = document.getElementById('rulesModal');
  const rulesClose = document.getElementById('rulesClose');
  const rulesKicker = document.getElementById('rulesKicker');
  const rulesTitle = document.getElementById('rulesTitle');
  const rulesIntro = document.getElementById('rulesIntro');
  const rulesBody = document.getElementById('rulesBody');
  const rulesNotice = document.getElementById('rulesNotice');
  const langBtn = document.getElementById('langBtn');
  const betBtn = document.getElementById('betBtn');
  const currentBet = document.getElementById('currentBet');
  const fastSpinBtn = document.getElementById('fastSpinBtn');
  const glassMenuBtn = document.getElementById('controlMenuBtn');
  const glassUtilityMenu = document.getElementById('glassUtilityMenu');
  const betLimitsModal = document.getElementById('betLimitsModal');
  const betLimitsClose = document.getElementById('betLimitsClose');
  const minBetBtn = document.getElementById('minBetBtn');
  const maxBetOptionBtn = document.getElementById('maxBetOptionBtn');
  const message = document.getElementById('message');
  const hero = document.getElementById('hero');
  const resultPopup = document.getElementById('resultPopup');
  const resultSigil = document.getElementById('resultSigil');
  const resultEyebrow = document.getElementById('resultEyebrow');
  const resultAmount = document.getElementById('resultAmount');
  const resultDetail = document.getElementById('resultDetail');

  const audio = window.ReapersFortune.createAudio({
    soundBtn, audioPrompt, backgroundMusic, winMusic, lossMusic, t
  });
  const { stopResultMusic, playOutcomeSound } = audio;
  const effects = window.ReapersFortune.createEffects({ root, reelsEl, weightedSymbol, audio });
  const {
    fitGameToViewport, startSpinFX, landReel, finishSpinFX,
    markWinners, drawPaylines, clearWinFX, runCharacterFX, playScatterReveals, playWildReveals
  } = effects;

  const autoHistory = window.ReapersFortune.createAutoHistory({
    root, t, money, won, historyButtonId:'glassHistoryBtn', onStop: () => stopAuto(),
    beforeOpen: () => {
      releaseSpace();
      hideResultPopup();
      if(rulesModal.classList.contains('open'))setRulesOpen(false);
    },
  });

  function renderRulesText(){
    rulesKicker.textContent=t('gameTitle');
    rulesTitle.textContent=t('rulesTitle');
    rulesIntro.textContent=t('rulesIntro');
    rulesClose.setAttribute('aria-label',t('closeRules'));
    helpBtn.setAttribute('aria-label',t('rulesTitle'));
    helpBtn.title=t('rulesTitle');
    const payoutColumns=[3,4,5];
    const paytableRows=symbols.map(symbol=>{
      const payouts=payoutColumns.map(count=>{
        if(symbol.id===scatter.symbolId)return '<td>—</td>';
        const multiplier=symbol.id==='wild'&&count===5 ? wildJackpotMultiplier : matchPayouts[count];
        return `<td>×${multiplier}</td>`;
      }).join('');
      return `<tr><td class="rulesSymbolCell"><img src="${symbol.image}" alt="${t(`symbol_${symbol.id}`)}"><span>${t(`symbol_${symbol.id}`)}</span></td>${payouts}</tr>`;
    }).join('');
    rulesBody.innerHTML=`
      <section class="rulesSection">
        <h3>${t('rulesHow')}</h3>
        <ol><li>${t('rulesStep1')}</li><li>${t('rulesStep2')}</li><li>${t('rulesStep3')}</li><li>${t('rulesStep4')}</li></ol>
      </section>
      <section class="rulesSection">
        <h3>${t('rulesRewards')}</h3>
        <div class="rulesPaytableWrap"><table class="rulesPaytable"><thead><tr><th>${t('rulesSymbol')}</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>${paytableRows}</tbody></table></div>
        <p class="rulesPayoutNote">${t('rulesPayouts')}</p>
        <p class="rulesPayoutNote">${t('rulesPayoutExample')}</p>
      </section>
      <section class="rulesSection rulesPaylineGuide">
        <h3>${t('rulesPaylines')}</h3>
        <div class="rulesPaylineDiagram" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <p class="rulesPayoutNote">${t('rulesPaylineDetails')}</p>
      </section>
      <section class="rulesSection">
        <h3>${t('rulesWildTitle')}</h3>
        <div class="rulesScatterFeature"><img src="${wildReveal.image}" alt="${t('symbol_wild')}"><div><b>WILD</b><p>${t('rulesWildFeature')}</p><small>${t('rulesFeatureStatus')}: ${t('rulesConfigured')}</small></div></div>
      </section>
      <section class="rulesSection">
        <h3>${t('rulesFreeSpins')}</h3>
        <div class="rulesScatterFeature"><img src="${scatter.revealImage}" alt="${t('rulesScatter')}"><div><b>SCATTER</b><p>${t('rulesFreeSpinsRule')}</p><small>${t('rulesFeatureStatus')}: ${t('rulesConfigured')}</small></div></div>
      </section>
      <section class="rulesSection">
        <h3>${t('rulesSymbols')}</h3>
        <ul><li>${t('rulesWild')}</li><li>${t('rulesScatterRule')}</li><li>${t('rulesSpecial')}</li><li>${t('rulesModel')}</li><li>${t('rulesNoBonus')}</li></ul>
      </section>
      <section class="rulesSection">
        <h3>${t('rulesDisplays')}</h3>
        <ul><li>${t('rulesReadouts')}</li><li>${t('rulesResultDisplay')}</li><li>${t('rulesFreeSpinDisplay')}</li></ul>
      </section>
      <section class="rulesSection">
        <h3>${t('rulesControls')}</h3>
        <ul><li>${t('rulesSpinControl')}</li><li>${t('rulesTurboControl')}</li><li>${t('rulesAutoControl')}</li><li>${t('rulesMenuControl')}</li><li>${t('rulesHistoryControl')}</li><li>${t('rulesSoundControl')}</li></ul>
      </section>`;
  }

  function applyLanguage(nextLanguage){
    i18n.setLanguage(nextLanguage);
    document.documentElement.lang=i18n.language;
    document.title=t('pageTitle');

    const textMap=[
      ['.jackpotHeading','jackpot'],['.jackpotCard.grand span','grand'],['.jackpotCard.major span','major'],['.jackpotCard.minor span','minor'],['.jackpotCard.mini span','mini'],
      ['.gameTitle','gameTitle'],['.titleArea .subtitle','subtitle'],['.balancePlaque span','balance'],['.bigOverlay .text','soulJackpot'],
      ['.linesPlaque span','lines'],['.betPlaque>span','bet'],['.winReadout span','win'],['.slotBetLabel','betAmount'],['.slotWinLabel','winAmount'],['.slotBalanceLabel','balance'],['.slotFreeSpinsLabel','freeSpins'],['.footerNote','footer']
    ];
    textMap.forEach(([selector,key])=>{const el=root.querySelector(selector);if(el)el.textContent=t(key)});
    fastSpinBtn.setAttribute('aria-label',t('fastSpin'));
    fastSpinBtn.title=t('fastSpin');
    document.getElementById('betLimitsKicker').textContent=t('gameTitle');
    document.getElementById('betLimitsTitle').textContent=t('bet');
    document.getElementById('betLimitsPrompt').textContent=t('betLimitsPrompt');
    minBetBtn.textContent=t('minBet');
    maxBetOptionBtn.textContent=t('maxBet');

    root.querySelector('.headerActions').setAttribute('aria-label',t('gameUtilities'));
    const titleArea=root.querySelector('.titleArea');
    const character=root.querySelector('.character');
    if(titleArea)titleArea.setAttribute('aria-label',t('gameTitle'));
    if(hero)hero.setAttribute('aria-label',t('heroLabel'));
    if(character)character.alt=t('heroAlt');
    reelsEl.setAttribute('aria-label',t('reels'));
    glassMenuBtn.setAttribute('aria-label',t('menu'));
    betSelector.setAttribute('aria-label',t('betAmount'));
    glassBetBtn.setAttribute('aria-label',t('betAmount'));
    glassBetBtn.title=t('betLimitsPrompt');
    renderRulesText();
    autoHistory.render();

    symbols.forEach(symbol=>{symbol.label=t(`symbol_${symbol.id}`)});
    reelsEl.querySelectorAll('.cell').forEach(cell=>{
      const symbol=symbols.find(item=>item.id===cell.dataset.id);
      if(!symbol)return;
      const img=cell.querySelector('.symImg');
      const label=cell.querySelector('.label');
      if(img)img.alt=symbol.label;
      if(label)label.textContent=symbol.label;
    });

    langBtn.textContent=i18n.language==='ko'?'EN':'한';
    langBtn.setAttribute('aria-label',t('switchLanguage'));
    const soundLabel=audio.soundOn?t('soundOn'):t('soundOff');
    soundBtn.setAttribute('aria-label',soundLabel);
    soundBtn.title=soundLabel;
    audioPrompt.textContent=t('startMusic');
    renderMessage();
    if(lastResultPopup) renderResultPopupText();
    else {resultEyebrow.textContent=t('popupWin');resultDetail.textContent=t('win')}
    updateUI();
    fitGameToViewport();
  }

  function weightedSymbol(){
    return slotEngine.drawSymbol();
  }

  function renderCell(sym, reelIndex, rowIndex){
    const cell = document.createElement('div');
    cell.className='cell';
    cell.dataset.reel=reelIndex;
    cell.dataset.row=rowIndex;
    cell.dataset.id=sym.id;
    const image=sym.baseImage||sym.image;
    cell.innerHTML = image
      ? `<img class="symImg" src="${image}" alt="${sym.label}"><span class="label">${sym.label}</span>`
      : `<span class="sym">${sym.icon}</span><span class="label">${sym.label}</span>`;
    return cell;
  }

  function buildRandomGrid(){
    return slotEngine.buildGrid();
  }

  function renderGrid(g){
    reelsEl.innerHTML='';
    g.forEach((col,ri)=>{
      const reel=document.createElement('div'); reel.className='reel';
      reel.style.setProperty('--reel-index',ri);
      reel.style.setProperty('--spin-delay',(-ri*.027)+'s');
      col.forEach((sym,row)=>reel.appendChild(renderCell(sym,ri,row)));
      reelsEl.appendChild(reel);
    });
  }

  function renderMessage(){
    if(!message)return;
    message.className='message'+(currentMessage.type?' '+currentMessage.type:'');
    const multiplier=currentMessage.multiplier?` ×${currentMessage.multiplier}`:'';
    const amount=currentMessage.amount?` ${money(currentMessage.amount)}`:'';
    message.innerHTML=`<div><div class="main">${t(currentMessage.mainKey)}${multiplier}</div><div class="sub">${t(currentMessage.subKey)}${amount}</div></div>`;
  }

  function setMessage(mainKey,subKey,type='',details={}){
    currentMessage={mainKey,subKey,type,...details};
    renderMessage();
  }

  function hideResultPopup(){
    if(resultPopupTimer){clearTimeout(resultPopupTimer);resultPopupTimer=0}
    resultPopup.classList.remove('show','docked','exiting');
    resultPopup.removeAttribute?.('role');
    resultPopup.removeAttribute?.('tabindex');
  }

  function dockFreeSpinPopup(){
    if(resultPopupTimer){clearTimeout(resultPopupTimer);resultPopupTimer=0}
    if(freeSpins<=0){hideResultPopup();return}
    resultPopup.classList.remove('show');
    resultPopup.classList.add('docked');
    renderResultPopupText();
    resultPopup.setAttribute('role','button');
    resultPopup.setAttribute('tabindex','0');
    resultPopup.setAttribute('aria-label',`${t('freeSpins')}: ${lastResultPopup?.freeSpins ?? 0}`);
  }

  function fadeFreeSpinPopup(){
    if(resultPopupTimer){clearTimeout(resultPopupTimer);resultPopupTimer=0}
    resultPopup.classList.remove('show','docked');
    resultPopup.classList.add('exiting');
    resultPopup.removeAttribute?.('role');
    resultPopup.removeAttribute?.('tabindex');
    resultPopupTimer=setTimeout(hideResultPopup,600);
  }

  function renderResultPopupText(){
    if(!lastResultPopup)return;
    const {kind,amount,multiplier}=lastResultPopup;
    const isWin=kind==='win';
    const isFreeSpins=kind==='freeSpins';
    if(isFreeSpins){
      const docked=resultPopup.classList.contains('docked');
      resultSigil.textContent='✦';
      resultEyebrow.textContent=docked?t('freeSpins'):t('freeSpinsAwarded');
      resultAmount.textContent=docked?lastResultPopup.freeSpins:`+${amount}`;
      resultDetail.textContent=`${t('freeSpins')}: ${lastResultPopup.freeSpins}`;
      return;
    }
    resultSigil.textContent=isWin?'✦':'☠';
    resultEyebrow.textContent=isWin?t('popupWin'):t('popupLoss');
    resultAmount.textContent=(isWin?'+':'−')+money(amount);
    resultDetail.textContent=isWin?`${t('win')} ×${multiplier}`:t('lossRetry');
  }

  function showResultPopup(kind,amount,multiplier=0){
    hideResultPopup();
    lastResultPopup={kind,amount,multiplier,freeSpins};
    renderResultPopupText();
    resultPopup.className=`resultPopup ${kind}`;
    void resultPopup.offsetWidth;
    resultPopup.classList.add('show');
    resultPopupTimer=setTimeout(kind==='freeSpins'?dockFreeSpinPopup:hideResultPopup,kind==='freeSpins'?2600:1250);
  }

  function setTurbo(active){
    const next=Boolean(active);
    if(turboMode===next)return;
    turboMode=next;
    root.classList.toggle('turbo',turboMode);
    updateUI();
  }

  function releaseSpace(){
    spaceHeld=false;
    // A tap keeps the current spin fast; only future spins return to normal.
    if(!spinning)setTurbo(false);
  }

  function speedDelay(duration){
    return new Promise(resolve=>{
      let remaining=duration;
      let previous=performance.now();
      function advance(now){
        remaining-=(now-previous)*(turboMode?3.25:1);
        previous=now;
        if(remaining<=0){resolve();return}
        requestAnimationFrame(advance);
      }
      requestAnimationFrame(advance);
    });
  }

  function updateUI(){
    balanceEl.textContent=won(balance);
    lastWinEl.textContent=money(lastWin);
    currentBet.textContent=won(bet);
    glassBetAmount.textContent=won(bet);
    glassWinAmount.textContent=money(lastWin);
    glassBetBtn.disabled=spinning;
    const hasFreeSpins=freeSpins>0;
    spinBtn.classList.toggle('freeSpinActive',hasFreeSpins);
    spinBtn.innerHTML=hasFreeSpins
      ? `<span class="freeSpinOrbit" aria-hidden="true">↻</span><span class="freeSpinCount">${freeSpins}</span>`
      : `<img class="glassControlIcon spinControlIcon" src="public/assets/ui/spin-icon.png" alt=""><span class="glassSpinLabelSr">${t('spin')}</span>`;
    spinBtn.setAttribute('aria-label',hasFreeSpins?`${t('freeSpins')}: ${freeSpins} · ${t('spin')}`:t('spin'));
    spinBtn.title=t('spinHint');
    freeSpinsEl.textContent=freeSpins;
    freeSpinsReadout.hidden=false;
    if(lastResultPopup?.kind==='freeSpins'){
      lastResultPopup.freeSpins=freeSpins;
      if(freeSpins===0&&(resultPopup.classList.contains('docked')||resultPopup.classList.contains('show')))fadeFreeSpinPopup();
      else renderResultPopupText();
    }
    spinBtn.disabled=spinning || (freeSpins===0&&balance<bet);
    fastSpinBtn.disabled=autoHistory.isOpen||(!spinning&&freeSpins===0&&balance<bet);
    fastSpinBtn.classList.toggle('active',turboMode);
    const autoActive=autoRemaining>0;
    autoBtn.classList.toggle('active',autoActive);
    autoBtn.disabled=!autoActive&&(spinning||(freeSpins===0&&balance<bet));
    autoBtn.setAttribute('aria-label',t(autoActive?'stopAuto':'startAuto'));
    autoBtn.title=t(autoActive?'stopAuto':'startAuto');
    autoBtn.innerHTML=`<img class="glassControlIcon autoControlIcon" src="public/assets/ui/auto-icon.png" alt=""><span class="autoLabel">${t(autoActive?'stopAuto':'auto')}</span>`;
  }

  function clearAutoSpinTimer(){
    if(autoSpinTimer){clearTimeout(autoSpinTimer);autoSpinTimer=0}
  }

  function finishAutoSession(reason){
    const session=autoSession;
    autoSession=null;
    autoHistory.finish(session,reason);
  }

  function stopAuto(reason='stopped'){
    autoRemaining=0;
    clearAutoSpinTimer();
    if(autoSession){
      if(spinning){
        autoSession.stopReason=reason;
        autoHistory.stopping(autoSession);
      }else finishAutoSession(reason);
    }
    updateUI();
  }

  function buildBets(){
    betSelector.innerHTML='';
    bets.forEach(v=>{
      const b=document.createElement('button');
      b.type='button'; b.className='pillBtn'+(v===bet?' active':''); b.dataset.bet=v; b.textContent=won(v);
      b.addEventListener('click',()=>{
        if(spinning)return;
        bet=v;
        [...betSelector.children].forEach(x=>x.classList.toggle('active',Number(x.dataset.bet)===bet));
        updateUI();
        setBetLimitsOpen(false);
      });
      betSelector.appendChild(b);
    });
  }

  async function spin(){
    if(spinning)return;
    const isFreeSpin=freeSpins>0;
    if(!isFreeSpin&&balance<bet){if(autoRemaining>0)stopAuto('funds');return}
    // A manual spin during the Auto pause also consumes the pending turn.
    clearAutoSpinTimer();
    const spinBet=isFreeSpin ? freeSpinBet : bet;
    const spinSession=autoSession;
    stopResultMusic(true);
    spinning=true; lastWin=0;
    if(isFreeSpin)freeSpins--;
    else balance-=spinBet;
    setTurbo(spaceHeld||turboMode);
    updateUI(); clearWinFX();
    if(freeSpins>0&&lastResultPopup?.kind==='freeSpins')dockFreeSpinPopup();
    else if(resultPopup.classList.contains('exiting')){}
    else hideResultPopup();
    setMessage('harvestingMain','harvestingSub');
    startSpinFX();

    const finalGrid=buildRandomGrid();
    if(forceFreeSpinsNext){
      const scatterSymbol=symbols.find(symbol=>symbol.id===scatter.symbolId);
      finalGrid[0][0]=scatterSymbol;
      finalGrid[2][1]=scatterSymbol;
      finalGrid[4][2]=scatterSymbol;
      forceFreeSpinsNext=false;
    }

    await speedDelay(420);
    for(let i=0;i<5;i++){
      await speedDelay(110+i*20);
      grid[i]=finalGrid[i];
      const reel=reelsEl.children[i];
      reel.innerHTML='';
      grid[i].forEach((sym,row)=>reel.appendChild(renderCell(sym,i,row)));
      landReel(reel);
    }

    await speedDelay(220);
    finishSpinFX();
    // Do not await this visual sequence: the settled grid remains the authority
    // for payout and any future feature eligibility.
    if(playScatterReveals) void playScatterReveals(scatter.symbolId,scatter.revealImage);
    if(playWildReveals) void playWildReveals(wildReveal.symbolId,wildReveal.image);

    const settlement=slotEngine.settle(grid,spinBet);
    const outcome=settlement.outcome;
    lastWin=settlement.win;
    balance+=lastWin;
    const awardedFreeSpins=settlement.freeSpinsAwarded;
    if(awardedFreeSpins){
      if(freeSpins===0)freeSpinBet=spinBet;
      freeSpins+=awardedFreeSpins;
    }
    spinning=false;
    setTurbo(false);
    updateUI();

    if(awardedFreeSpins){
      setMessage('freeSpinsAwarded','freeSpinsAwardedSub','big');
      showResultPopup('freeSpins',awardedFreeSpins);
      runCharacterFX('big');
    } else if(outcome.mult<=0){
      setMessage('loseMain','loseSub');
      if(!isFreeSpin)showResultPopup('loss',spinBet);
      playOutcomeSound(outcome);
    } else {
      markWinners(outcome.winners);
      drawPaylines(outcome.wins,outcome.tier);
      if(outcome.tier==='jackpot'){
        setMessage('jackpotMain','prize','big',{multiplier:outcome.mult,amount:lastWin});
      } else if(outcome.tier==='big'){
        setMessage('bigMain','prize','big',{multiplier:outcome.mult,amount:lastWin});
      } else {
        setMessage('harvestMain','prize','win',{multiplier:outcome.mult,amount:lastWin});
      }
      if(!isFreeSpin)showResultPopup('win',lastWin,outcome.mult);
      playOutcomeSound(outcome);
      runCharacterFX(outcome.tier);
    }

    autoHistory.record(spinSession,{bet:isFreeSpin?0:spinBet,payout:lastWin,multiplier:outcome.mult,balance});
    if(autoRemaining>0){
      autoRemaining--;
      updateUI();
      if(autoRemaining>0 && (freeSpins>0 || balance>=bet)){
        autoSpinTimer=setTimeout(()=>{
          autoSpinTimer=0;
          if(autoRemaining>0)spin();
        },650);
      }else stopAuto(autoRemaining===0?'completed':'funds');
    }else if(spinSession)finishAutoSession(spinSession.stopReason||'stopped');
  }

  function setRulesOpen(open){
    if(open){
      rulesReturnFocus=document.activeElement;
      releaseSpace();
      rulesModal.classList.add('open');
      rulesModal.setAttribute('aria-hidden','false');
      document.body.classList.add('rulesOpen');
      rulesClose.focus();
    }else{
      rulesModal.classList.remove('open');
      rulesModal.setAttribute('aria-hidden','true');
      document.body.classList.remove('rulesOpen');
      if(rulesReturnFocus instanceof HTMLElement)rulesReturnFocus.focus();
      rulesReturnFocus=null;
    }
  }

  rulesClose.addEventListener('click',()=>setRulesOpen(false));
  rulesModal.addEventListener('click',event=>{if(event.target===rulesModal)setRulesOpen(false)});
  rulesModal.addEventListener('keydown',event=>{
    if(event.key==='Tab'){
      event.preventDefault();
      rulesClose.focus();
    }
  });

  spinBtn.addEventListener('click',()=>{if(!autoHistory.isOpen)spin()});
  function reopenFreeSpinPopup(){
    if(!resultPopup.classList.contains('docked'))return;
    resultPopup.classList.remove('docked');
    resultPopup.removeAttribute?.('role');
    resultPopup.removeAttribute?.('tabindex');
    renderResultPopupText();
    void resultPopup.offsetWidth;
    resultPopup.classList.add('show');
    resultPopupTimer=setTimeout(dockFreeSpinPopup,2600);
  }
  resultPopup.addEventListener('click',reopenFreeSpinPopup);
  resultPopup.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();reopenFreeSpinPopup()}
  });
  function setBetLimit(index){
    if(spinning)return;
    bet=bets[index];
    [...betSelector.children].forEach(x=>x.classList.toggle('active',Number(x.textContent)===bet));
    updateUI();
    setBetLimitsOpen(false);
  }
  function setBetLimitsOpen(open){
    betLimitsModal.classList.toggle('open',open);
    betLimitsModal.setAttribute('aria-hidden',String(!open));
    if(open) minBetBtn.focus();
    else glassBetBtn.focus();
  }
  function setGlassUtilityMenuOpen(open,returnFocus=false){
    glassUtilityMenu.classList.toggle('open',open);
    glassUtilityMenu.setAttribute('aria-hidden',String(!open));
    glassMenuBtn.setAttribute('aria-expanded',String(open));
    glassMenuBtn.classList.toggle('active',open);
    if(open)helpBtn.focus();
    else if(returnFocus)glassMenuBtn.focus();
  }
  glassBetBtn.addEventListener('click',()=>{
    if(spinning)return;
    setBetLimitsOpen(true);
  });
  betBtn.addEventListener('click',()=>{
    if(spinning)return;
    setBetLimitsOpen(true);
  });
  minBetBtn.addEventListener('click',()=>setBetLimit(0));
  maxBetOptionBtn.addEventListener('click',()=>setBetLimit(bets.length-1));
  betLimitsClose.addEventListener('click',()=>setBetLimitsOpen(false));
  betLimitsModal.addEventListener('click',event=>{if(event.target===betLimitsModal)setBetLimitsOpen(false)});
  betLimitsModal.addEventListener('keydown',event=>{if(event.key==='Escape')setBetLimitsOpen(false)});
  fastSpinBtn.addEventListener('click',()=>{
    if(autoHistory.isOpen||(!spinning&&balance<bet))return;
    setTurbo(true);
    if(!spinning)spin();
  });
  autoBtn.addEventListener('click',()=>{
    if(autoHistory.isOpen)return;
    if(autoRemaining>0){stopAuto();return}
    if(spinning||balance<bet)return;
    autoSession=autoHistory.start(balance);
    autoRemaining=10;updateUI();spin();
  });

  glassMenuBtn.addEventListener('click',()=>setGlassUtilityMenuOpen(!glassUtilityMenu.classList.contains('open')));
  helpBtn.addEventListener('click',()=>{
    setGlassUtilityMenuOpen(false,true);
    setRulesOpen(true);
  });
  document.addEventListener('pointerdown',event=>{
    if(!glassUtilityMenu.classList.contains('open'))return;
    if(event.target===glassMenuBtn||event.target?.closest?.('#controlMenuBtn,#glassUtilityMenu'))return;
    setGlassUtilityMenuOpen(false);
  });

  audio.bindEvents();
  langBtn.addEventListener('click',()=>applyLanguage(i18n.language==='ko'?'en':'ko'));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&glassUtilityMenu.classList.contains('open')){
      setGlassUtilityMenuOpen(false,true);
      return;
    }
    if(event.key==='Escape'&&rulesModal.classList.contains('open')){
      setRulesOpen(false);
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.code!=='Space'||event.altKey||event.ctrlKey||event.metaKey||event.defaultPrevented)return;
    if(rulesModal.classList.contains('open')||autoHistory.isOpen)return;
    const target=event.target;
    if(target instanceof HTMLElement){
      if(target.isContentEditable||target.matches('input,textarea,select'))return;
      const interactive=target.closest('button,a');
      if(interactive&&interactive!==spinBtn)return;
    }
    event.preventDefault();
    if(event.repeat)return;
    spaceHeld=true;
    if(spinning)setTurbo(true);
    else spin();
  });
  document.addEventListener('keyup',event=>{
    if(event.code!=='Space'||!spaceHeld)return;
    event.preventDefault();
    releaseSpace();
  });
  window.addEventListener('blur',releaseSpace);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)releaseSpace();
  });

  buildBets();
  grid=buildRandomGrid();
  renderGrid(grid);
  applyLanguage('ko');
  effects.observeViewport();

})();
