// Shared game data; asset paths resolve relative to the HTML page.
(() => {
  'use strict';

  const symbols = [
    {id:'ruby', image:'public/assets/gems/blood-heart.png', label:'피의 심장'},
    {id:'phantom', image:'public/assets/gems/book.png', label:'속박된 영혼석'},
    {id:'amethyst', image:'public/assets/gems/amethyst-skull.png', label:'자수정 해골'},
    {id:'soulOrb', image:'public/assets/gems/skull.png', label:'영혼 구슬'},
    {id:'seven', image:'public/assets/gems/seven.png', label:'세븐'},
    {id:'wild', image:'public/assets/gems/crown.png', label:'와일드'},
    {id:'blue', image:'public/assets/gems/blue.png', label:'별빛 물약'},
    {id:'scatter', image:'public/assets/gems/red.png', label:'스캐터'},
    {id:'green', image:'public/assets/gems/green.png', label:'영혼 불꽃'}
  ];

  // Wild weight calibrated for 90.00% theoretical RTP with the payouts and ten
  // paylines below. Recheck any math changes with npm run check:rtp.
  const symbolWeights = [
    ['ruby',20],['phantom',18],['amethyst',18],['soulOrb',17],['seven',12],['wild',5.4018209361961675],['green',7],['blue',6],['scatter',4]
  ];

  // Multipliers apply to the selected bet, once per winning payline.
  // Symbol weights determine the grid; the landed grid determines the payout.
  const matchPayouts = {3:0.5, 4:4, 5:10};
  const wildJackpotMultiplier = 50; //change when needed
  // The red gem is a presentation-only Scatter. It does not substitute or pay.
  const scatter = {
    symbolId:'scatter',
    revealImage:'public/assets/gems/scatter-reveal.png',
    freeSpins: { triggerCount:3, award:10 }
  };
  const wildReveal = { symbolId:'wild', image:'public/assets/gems/wild.png' };

  const paylines = [
    [0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],
    [0,1,2,1,0],[2,1,0,1,2],
    [0,0,1,2,2],[2,2,1,0,0],
    [1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]
  ];

  const bets = [1000,3000,5000,10000];

  window.ReapersFortune = window.ReapersFortune || {};
  window.ReapersFortune.config = { symbols, symbolWeights, matchPayouts, wildJackpotMultiplier, scatter, wildReveal, paylines, bets };
})();
