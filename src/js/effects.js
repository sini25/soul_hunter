// Viewport fitting, reel animations, and win effects with private animation timers.
'use strict';

window.ReapersFortune.createEffects = function({ root, reelsEl, weightedSymbol, audio }) {
  const slotMachine = root.querySelector('.slotMachine');
  const charWrap = document.getElementById('characterWrap');
  const hero = document.getElementById('hero');
  const slash = document.getElementById('slash');
  const reelFrame = document.getElementById('reelFrame');
  const fx = document.getElementById('fx');
  const bigOverlay = document.getElementById('bigOverlay');
  const backdropFx = document.getElementById('backdropFx');
  const paylineFx = document.getElementById('paylineFx');
  const paylinePaths = document.getElementById('paylinePaths');
  let fitFrame = 0;
  let spinTicker = 0;
  let stopKickTimer = 0;
  let winFxTimer = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { playSpinSound, playReelStopSound } = audio;

  function fitGameToViewport(){
    cancelAnimationFrame(fitFrame);
    fitFrame=requestAnimationFrame(()=>{
      // Use the cabinet box itself: the intentionally oversized foreground is
      // decorative overflow and must not feed back into the viewport fit scale.
      const naturalWidth=slotMachine.offsetWidth;
      const naturalHeight=slotMachine.offsetHeight;
      const viewportWidth=window.visualViewport?.width||window.innerWidth;
      const viewportHeight=window.visualViewport?.height||window.innerHeight;
      const scale=Math.min((viewportWidth-4)/naturalWidth,(viewportHeight-4)/naturalHeight,1);
      // Flowing phone/tablet layouts keep their touch targets at their CSS size.
      const fluidLayout=getComputedStyle(slotMachine).getPropertyValue('--fluid-layout').trim()==='1';
      const appliedScale=fluidLayout?1:Math.max(.05,scale);
      slotMachine.style.setProperty('--fit-scale',appliedScale.toFixed(4));
    });
  }

  function previewSymbol(cell,sym){
    cell.dataset.id=sym.id;
    const img=cell.querySelector('.symImg');
    const label=cell.querySelector('.label');
    if(img){img.src=sym.image;img.alt=sym.label}
    if(label) label.textContent=sym.label;
  }

  function startSpinFX(){
    if(spinTicker) clearInterval(spinTicker);
    if(stopKickTimer) clearTimeout(stopKickTimer);
    playSpinSound();
    clearScatterReveals();
    clearWildReveals();
    reelsEl.classList.add('is-spinning');
    reelFrame.classList.remove('stopKick');
    reelFrame.classList.add('spinning');
    [...reelsEl.children].forEach((reel,index)=>{
      reel.style.setProperty('--reel-index',index);
      reel.style.setProperty('--spin-delay',(-index*.027)+'s');
      reel.classList.remove('stopHit');
      reel.classList.add('spinning');
      reel.querySelectorAll('.cell').forEach(cell=>cell.classList.add('spin'));
    });

    if(!reduceMotion){
      spinTicker=setInterval(()=>{
        reelsEl.querySelectorAll('.reel.spinning').forEach(reel=>{
          reel.querySelectorAll('.cell').forEach(cell=>previewSymbol(cell,weightedSymbol()));
        });
      },72);
    }
  }

  function landReel(reel){
    playReelStopSound([...reelsEl.children].indexOf(reel));
    reel.classList.remove('spinning');
    reel.querySelectorAll('.spin').forEach(cell=>cell.classList.remove('spin'));
    reel.classList.remove('stopHit');
    void reel.offsetWidth;
    reel.classList.add('stopHit');
    setTimeout(()=>reel.classList.remove('stopHit'),360);

    reelFrame.classList.remove('stopKick');
    void reelFrame.offsetWidth;
    reelFrame.classList.add('stopKick');
    if(stopKickTimer) clearTimeout(stopKickTimer);
    stopKickTimer=setTimeout(()=>reelFrame.classList.remove('stopKick'),220);
  }

  function finishSpinFX(){
    if(spinTicker){clearInterval(spinTicker);spinTicker=0}
    reelsEl.classList.remove('is-spinning');
    reelFrame.classList.remove('spinning','stopKick');
    reelsEl.querySelectorAll('.reel.spinning').forEach(reel=>reel.classList.remove('spinning'));
    reelsEl.querySelectorAll('.cell.spin').forEach(cell=>cell.classList.remove('spin'));
  }

  let scatterRevealGeneration=0;
  function clearScatterReveals(){
    scatterRevealGeneration++;
    reelsEl.querySelectorAll('.scatterAura').forEach(effect=>effect.remove());
    reelsEl.querySelectorAll('.scatterReveal').forEach(reveal=>reveal.remove());
    reelsEl.querySelectorAll('.scatterRevealed').forEach(cell=>cell.classList.remove('scatterRevealed'));
  }

  function wait(duration){
    return new Promise(resolve=>setTimeout(resolve,duration));
  }

  // Presentation-only: reads the already-landed cells and never changes them.
  async function playScatterReveals(symbolId, image){
    clearScatterReveals();
    const generation=scatterRevealGeneration;
    const cells=[...reelsEl.querySelectorAll(`.cell[data-id="${symbolId}"]`)];
    for(const [index,cell] of cells.entries()){
      if(generation!==scatterRevealGeneration)return;
      const reveal=document.createElement('img');
      reveal.className='scatterReveal';
      reveal.src=image;
      reveal.alt='';
      reveal.setAttribute('aria-hidden','true');
      cell.classList.add('scatterRevealed');
      cell.appendChild(reveal);
      if(!reduceMotion){
        const aura=document.createElement('span');
        aura.className='scatterAura';
        aura.setAttribute('aria-hidden','true');
        const shimmer=document.createElement('span');
        shimmer.className='scatterShimmer';
        shimmer.style.setProperty('--scatter-art',`url("${new URL(image, window.location.href).href}")`);
        aura.appendChild(shimmer);
        for(let spark=0;spark<10;spark++){
          const ember=document.createElement('i');
          ember.className='scatterEmber';
          ember.style.setProperty('--ember-left',`${15+spark*7.5}%`);
          ember.style.setProperty('--ember-drift',`${(spark%2?1:-1)*(12+spark*3)}px`);
          ember.style.setProperty('--ember-delay',`${spark*45}ms`);
          aura.appendChild(ember);
        }
        cell.appendChild(aura);
      }
      if(!reduceMotion&&index<cells.length-1) await wait(150);
    }
    // Callers that have a feature trigger can await this without changing the
    // reel-stop sequence; the game currently starts it as a fire-and-forget FX.
    if(cells.length&&!reduceMotion) await wait(1200);
  }

  let wildRevealGeneration=0;
  function clearWildReveals(){
    wildRevealGeneration++;
    reelsEl.querySelectorAll('.wildReveal').forEach(reveal=>reveal.remove());
    reelsEl.querySelectorAll('.wildRevealed').forEach(cell=>cell.classList.remove('wildRevealed'));
  }

  async function playWildReveals(symbolId,image){
    clearWildReveals();
    const generation=wildRevealGeneration;
    const cells=[...reelsEl.querySelectorAll(`.cell[data-id="${symbolId}"]`)];
    for(const [index,cell] of cells.entries()){
      if(generation!==wildRevealGeneration)return;
      const reveal=document.createElement('img');
      reveal.className='wildReveal'; reveal.src=image; reveal.alt=''; reveal.setAttribute('aria-hidden','true');
      cell.appendChild(reveal); cell.classList.add('wildRevealed');
      if(!reduceMotion&&index<cells.length-1)await wait(120);
    }
  }

  function particles(power=22){
    for(let i=0;i<power;i++){
      const p=document.createElement('i'); p.className='particle';
      p.style.left=(35+Math.random()*35)+'%';
      p.style.top=(35+Math.random()*30)+'%';
      p.style.setProperty('--x',((Math.random()-.5)*420)+'px');
      p.style.setProperty('--y',((Math.random()-.65)*360)+'px');
      fx.appendChild(p);
      setTimeout(()=>p.remove(),1250);
    }
  }

  function markWinners(winners){
    winners.forEach(([r,row])=>{
      const el=reelsEl.querySelector(`.cell[data-reel="${r}"][data-row="${row}"]`);
      if(el) el.classList.add('winner');
    });
  }

  function drawPaylines(wins,tier){
    paylinePaths.replaceChildren();
    if(!wins.length) return;
    const frameRect=reelFrame.getBoundingClientRect();
    paylineFx.setAttribute('viewBox',`0 0 ${frameRect.width} ${frameRect.height}`);
    wins.forEach(win=>{
      const points=win.winners.map(([r,row])=>{
        const cell=reelsEl.querySelector(`.cell[data-reel="${r}"][data-row="${row}"]`);
        if(!cell) return null;
        const rect=cell.getBoundingClientRect();
        return `${rect.left-frameRect.left+rect.width/2},${rect.top-frameRect.top+rect.height/2}`;
      }).filter(Boolean).join(' ');
      if(!points) return;
      ['paylineGlow','paylinePath'].forEach(className=>{
        const path=document.createElementNS('http://www.w3.org/2000/svg','polyline');
        path.setAttribute('class',className);
        path.setAttribute('pathLength','1');
        path.setAttribute('points',points);
        path.dataset.line=win.lineIndex+1;
        paylinePaths.appendChild(path);
      });
    });
    paylineFx.classList.remove('show','gold');
    if(tier==='big'||tier==='jackpot') paylineFx.classList.add('gold');
    void paylineFx.getBoundingClientRect();
    paylineFx.classList.add('show');
  }

  function clearWinFX(){
    if(winFxTimer){clearTimeout(winFxTimer);winFxTimer=0}
    reelsEl.querySelectorAll('.winner').forEach(e=>e.classList.remove('winner'));
    paylineFx.classList.remove('show','gold');
    paylinePaths.replaceChildren();
    bigOverlay.classList.remove('show');
    slash.classList.remove('go');
    reelFrame.classList.remove('winPulse');
    if(charWrap) charWrap.classList.remove('win','big');
    if(hero) hero.classList.remove('active');
  }

  function runCharacterFX(tier){
    slash.classList.remove('go');
    reelFrame.classList.remove('winPulse');
    if(charWrap) charWrap.classList.remove('win','big');
    if(hero) hero.classList.remove('active');
    if(charWrap) void charWrap.offsetWidth;
    if(hero) hero.classList.add('active');
    reelFrame.classList.add('winPulse');
    slash.classList.add('go');
    if(charWrap) charWrap.classList.add(tier==='big'||tier==='jackpot'?'big':'win');
    particles(tier==='jackpot'?48:tier==='big'?34:20);
    if(tier==='jackpot'){
      bigOverlay.classList.remove('show'); void bigOverlay.offsetWidth; bigOverlay.classList.add('show');
    }
    winFxTimer=setTimeout(clearWinFX,1500);
  }

  function observeViewport() {
    fitGameToViewport();
    window.addEventListener('load',fitGameToViewport,{once:true});
    window.addEventListener('resize',fitGameToViewport,{passive:true});
    window.visualViewport?.addEventListener('resize',fitGameToViewport,{passive:true});
    if('ResizeObserver' in window) new ResizeObserver(fitGameToViewport).observe(slotMachine);
  }

  return {
    fitGameToViewport, observeViewport, startSpinFX, landReel,
    finishSpinFX, playScatterReveals, playWildReveals, markWinners, drawPaylines, clearWinFX, runCharacterFX
  };
};
