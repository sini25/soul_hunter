// Korean/English translations and formatting, with language state per instance.
'use strict';

window.ReapersFortune.createI18n = function(initialLanguage = 'ko') {
  let language = initialLanguage === 'en' ? 'en' : 'ko';

  const translations = {
    ko:{
      pageTitle:'사신의 행운 — 데모',gameUtilities:'게임 메뉴',jackpotInfo:'잭팟 정보',showJackpot:'잭팟 정보 보기',hideJackpot:'잭팟 정보 숨기기',
      jackpot:'잭팟',grand:'그랜드',major:'메이저',minor:'마이너',mini:'미니',achievements:'업적',help:'도움말',soundOn:'음악 켜짐',soundOff:'음악 꺼짐',startMusic:'♫ 음악 시작',
      gameTitle:'사신의 행운',subtitle:'행운을 거두어라',balance:'잔액',heroLabel:'사신 여왕',heroAlt:'보석 낫을 들고 슬롯머신 옆에 선 사신 여왕',
      reels:'슬롯 릴',paylineHint:'✦ 왼쪽부터 페이라인에 같은 심볼 3개 이상을 맞추세요 ✦',waitingMain:'영혼들이 기다리고 있습니다',waitingSub:'베팅 금액을 선택하고 스핀하세요.',
      popupWin:'영혼 수확 성공',popupLoss:'영혼들이 달아났습니다',win:'당첨',lossRetry:'패배 · 다시 스핀하세요',soulJackpot:'영혼 잭팟',recentWinnersLabel:'최근 데모 당첨자',recentWinners:'최근 당첨자',
      menu:'메뉴',lines:'라인',bet:'베팅',betAmount:'베팅 금액',winAmount:'당첨 금액',betLimits:'베팅 한도',betLimitsPrompt:'베팅 금액을 빠르게 선택하세요.',minBet:'최소 베팅',maxBet:'최대 베팅',fastSpin:'빠른 스핀',auto:'자동',spin:'스핀',turbo:'터보',freeSpins:'무료 스핀',spinHint:'스페이스바: 3.25배 속도로 터보 스핀',footer:'데모 전용 · 가상 크레딧 · 실제 운영 인증을 받은 도박 시스템이 아닙니다',
      startAuto:'자동 스핀 10회 시작',stopAuto:'자동 중지',
      ledgerTitle:'수확 기록',ledgerClose:'수확 기록 닫기',ledgerView:'전체 기록 보기',ledgerReady:'다음 수확을 기다립니다',
      ledgerEmpty:'자동 스핀을 시작하면 이곳에 수확 결과가 기록됩니다.',ledgerSession:'자동 기록',ledgerOlder:'이전 자동 기록',ledgerNewer:'다음 자동 기록',
      ledgerRunning:'영혼 수확 진행 중',ledgerStopping:'현재 스핀을 마무리하는 중',ledgerCompleted:'수확 완료',ledgerStopped:'플레이어가 자동 스핀을 중지했습니다',ledgerFunds:'다음 베팅을 위한 잔액이 부족합니다',
      ledgerTotalWon:'총 당첨금',ledgerTotalBet:'총 베팅 금액',ledgerNet:'순손익',ledgerSpins:'완료한 스핀',ledgerBest:'최고 당첨금',ledgerBalance:'시작 잔액 → 정산 잔액',
      ledgerBreakdown:'스핀별 수확 내역',ledgerSpin:'스핀',ledgerPaid:'당첨금',ledgerPending:'완료된 스핀만 합산됩니다. 자동 스핀은 계속 진행됩니다.',ledgerDone:'게임으로 돌아가기',
      ledgerNote:'순손익 = 총 당첨금 − 총 베팅 금액. 최근 자동 기록 10개는 페이지를 새로고침할 때까지 보관됩니다.',
      rulesHistoryControl:'수확 기록 버튼: 자동 스핀별 베팅, 당첨금, 순손익과 최근 자동 기록 10개를 확인합니다. 자동 종료 또는 중지 시 마지막 스핀을 정산한 뒤 총 당첨금과 순손익을 표시합니다. 기록은 새로고침하면 초기화됩니다.',
      switchLanguage:'영어로 전환',harvestingMain:'영혼 수확 중',harvestingSub:'사신 여왕이 당신의 운명을 정하고 있습니다…',loseMain:'영혼 수확 실패',loseSub:'여왕은 다음 스핀을 기다립니다.',
      jackpotMain:'영혼 잭팟',bigMain:'대량 수확',harvestMain:'영혼 수확',prize:'당첨금',
      symbol_ruby:'피의 심장',symbol_phantom:'속박된 영혼석',symbol_amethyst:'자수정 해골',symbol_soulOrb:'영혼 구슬',symbol_seven:'세븐',symbol_wild:'와일드',symbol_blue:'별빛 물약',symbol_scatter:'스캐터',symbol_green:'영혼 불꽃',
      rulesTitle:'게임 규칙',rulesIntro:'왼쪽 첫 번째 릴부터 활성 페이라인을 따라 같은 심볼을 3개 이상 맞추면 영혼을 수확합니다.',closeRules:'규칙 닫기',
      rulesHow:'플레이 방법',rulesStep1:'베팅 금액 패널을 눌러 ₩1,000, ₩3,000, ₩5,000 또는 ₩10,000 중 하나를 선택합니다.',rulesStep2:'가운데 스핀 버튼은 한 번 회전합니다. 터보 버튼이나 스페이스바로 빠르게 회전할 수 있으며, 무료 스핀 중에는 남은 횟수가 스핀 버튼 중앙에 표시됩니다.',rulesStep3:'당첨 조합은 활성 페이라인을 따라 맨 왼쪽 릴부터 연속으로 이어져야 합니다.',rulesStep4:'자동 버튼은 최대 10회 연속 스핀을 실행합니다. 자동 중지 버튼으로 언제든 남은 회전을 중지할 수 있습니다.',
      rulesRewards:'당첨 배수',rulesMatch3:'같은 심볼 3개',rulesMatch4:'같은 심볼 4개',rulesMatch5:'같은 심볼 5개',rulesWild5:'와일드 5개',rulesPayouts:'배수는 선택한 베팅 금액에 적용됩니다. 각 페이라인에서 가장 길게 이어진 조합 하나만 지급하며, 모든 당첨 페이라인의 당첨금을 합산합니다.',rulesPayoutExample:'예: ₩1,000 베팅에서 일반 심볼 3개는 ₩500, 4개는 ₩4,000, 5개는 ₩10,000을 지급합니다. 와일드 5개는 ₩50,000 잭팟을 지급합니다.',
      rulesPaylines:'페이라인 안내',rulesPaylineDetails:'5개 릴과 3개 행에 걸쳐 10개의 고정 페이라인이 항상 활성화됩니다. 릴이 멈춘 뒤 당첨 조합과 페이라인이 빛나며, 같은 릴의 당첨은 함께 합산됩니다.',
      rulesWildTitle:'와일드',rulesWildFeature:'와일드는 스캐터를 제외한 모든 일반 심볼을 대신합니다. 릴이 멈추면 착지한 와일드 위에 전용 이미지와 빛 효과가 나타납니다. 한 페이라인에 와일드 5개가 연결되면 선택한 베팅 금액의 50배를 지급합니다.',
      rulesSymbols:'심볼 규칙',rulesWild:'와일드는 당첨 페이라인에서 스캐터를 제외한 일반 심볼을 대신할 수 있습니다.',rulesSpecial:'모든 일반 심볼은 활성 페이라인에서 왼쪽부터 3개 이상 연속으로 맞으면 당첨됩니다.',rulesModel:'10개의 활성 페이라인이 있으며, 각 라인에서는 가장 긴 조합 하나만 지급됩니다.',rulesFreeSpins:'무료 스핀',rulesFreeSpinsRule:'빨간 SCATTER 3개 이상이 화면 어디에나 나타나면 무료 스핀 10회를 획득합니다. 무료 스핀 중 SCATTER가 다시 나오면 10회가 추가됩니다.',rulesScatterRule:'SCATTER 연출은 빨간 스캐터 심볼 위에 표시됩니다. 스캐터는 와일드로 대체되지 않으며 당첨금을 지급하지 않습니다.',freeSpinsAwarded:'무료 스핀 획득!',freeSpinsAwardedSub:'무료 스핀 10회가 추가되었습니다.',rulesNoBonus:'별도의 보너스 심볼이나 보너스 라운드는 현재 설정되어 있지 않습니다.',rulesSymbol:'심볼',rulesScatter:'스캐터',rulesFeatureStatus:'기능 상태',rulesConfigured:'설정됨',
      rulesDisplays:'화면 안내',rulesReadouts:'하단 유리 패널에는 현재 베팅 금액, 최근 당첨 금액, 지갑 잔액이 표시됩니다.',rulesResultDisplay:'일반 스핀 결과는 화면 오른쪽 아래에 표시됩니다. WIN 창은 당첨금과 배수를, LOSS 창은 사용한 베팅 금액을 보여 줍니다.',rulesFreeSpinDisplay:'무료 스핀 획득 카드는 화면 왼쪽에서 나타난 뒤 반쯤 접혀 유지됩니다. 접힌 카드를 누르면 다시 펼쳐지며, 마지막 무료 스핀이 끝나면 사라집니다.',
      rulesControls:'조작 방법',rulesSpinControl:'스핀 버튼: 일반 속도로 한 번 스핀. 무료 스핀 중에는 중앙 숫자로 남은 횟수를 확인합니다.',rulesTurboControl:'스페이스바: 3.25배 속도로 한 번 터보 스핀. 키를 놓아도 해당 스핀이 끝날 때까지 터보가 유지됩니다. 회전 중에 누르면 현재 스핀도 빨라집니다. 다시 스핀하려면 키를 놓은 뒤 다시 누르세요. 베팅 금액, 당첨 확률, 당첨금은 동일합니다.',rulesAutoControl:'자동 버튼: 최대 10회 연속 스핀. 실행 중에는 자동 중지 버튼으로 바뀝니다. 릴이 회전 중이어도 언제든 눌러 남은 자동 스핀을 취소할 수 있습니다. 진행 중인 스핀은 끝까지 완료되어 당첨금이 지급됩니다. 스페이스바를 누르고 있으면 자동 스핀에 터보 속도가 적용됩니다.',rulesMenuControl:'⋮ 메뉴 버튼: 도움말, 음악, 언어 설정을 엽니다.',rulesSoundControl:'♫ 버튼: 음악과 효과음 켜기/끄기'
    },
    en:{
      pageTitle:"Reaper's Fortune — Demo",gameUtilities:'Game utilities',jackpotInfo:'Jackpot information',showJackpot:'Show jackpot information',hideJackpot:'Hide jackpot information',
      jackpot:'Jackpot',grand:'Grand',major:'Major',minor:'Minor',mini:'Mini',achievements:'Achievements',help:'Help',soundOn:'Music on',soundOff:'Music off',startMusic:'♫ Start Music',
      gameTitle:"REAPER'S FORTUNE",subtitle:'Reap your fortune',balance:'Balance',heroLabel:'Reaper Queen',heroAlt:'Reaper Queen standing beside the slot machine with a jeweled scythe',
      reels:'Slot reels',paylineHint:'✦ Match 3 or more identical symbols on a payline from the left ✦',waitingMain:'THE SOULS ARE WAITING',waitingSub:'Choose a bet and spin.',
      popupWin:'Souls harvested',popupLoss:'The souls escaped',win:'Win',lossRetry:'Loss · Try another spin',soulJackpot:'SOUL JACKPOT',recentWinnersLabel:'Recent demo winners',recentWinners:'Recent Winners',
      menu:'Menu',lines:'Lines',bet:'Bet',betAmount:'Bet amount',winAmount:'Win Amount',betLimits:'BET LIMITS',betLimitsPrompt:'Quickly choose your wager limit.',minBet:'MIN BET',maxBet:'MAX BET',fastSpin:'TURBO',auto:'AUTO',spin:'SPIN',turbo:'TURBO',freeSpins:'FREE SPINS',spinHint:'Spacebar: turbo spin at 3.25× speed',footer:'Demo only · Virtual credits · Not a production-certified gambling implementation',
      startAuto:'Start 10 auto spins',stopAuto:'STOP AUTO',
      ledgerTitle:'Harvest Ledger',ledgerClose:'Close Harvest Ledger',ledgerView:'View full ledger',ledgerReady:'Your next harvest awaits',
      ledgerEmpty:'Start Auto to record your harvest here, one spin at a time.',ledgerSession:'Auto session',ledgerOlder:'Older auto session',ledgerNewer:'Newer auto session',
      ledgerRunning:'Harvest in progress',ledgerStopping:'Finishing the current spin',ledgerCompleted:'Harvest complete',ledgerStopped:'Auto stopped by you',ledgerFunds:'Not enough credits for the next bet',
      ledgerTotalWon:'Total won',ledgerTotalBet:'Total bet',ledgerNet:'Net result',ledgerSpins:'Spins completed',ledgerBest:'Best payout',ledgerBalance:'Opening → settled balance',
      ledgerBreakdown:'Spin-by-spin harvest',ledgerSpin:'Spin',ledgerPaid:'Payout',ledgerPending:'Totals include completed spins only. Auto continues while you view.',ledgerDone:'Return to game',
      ledgerNote:'Net result = total won − total bet. Your last 10 Auto sessions are kept until you reload the page.',
      rulesHistoryControl:'Harvest Ledger button: review each Auto spin’s bet, payout, and net result across your last 10 Auto sessions. When Auto finishes or is stopped, a summary shows total winnings and net profit or loss after the final spin settles. History resets when you reload.',
      switchLanguage:'Switch to Korean',harvestingMain:'HARVESTING SOULS',harvestingSub:'The Reaper Queen is choosing your fate…',loseMain:'NO SOULS CLAIMED',loseSub:'The Queen waits for another spin.',
      jackpotMain:'SOUL JACKPOT',bigMain:'MASSIVE HARVEST',harvestMain:'SOUL HARVEST',prize:'You won',
      symbol_ruby:'Blood Heart',symbol_phantom:'Chained Soulstone',symbol_amethyst:'Amethyst Skull',symbol_soulOrb:'Soul Orb',symbol_seven:'Seven',symbol_wild:'Crown Wild',symbol_blue:'Starlight Potion',symbol_scatter:'Scatter',symbol_green:'Soul Flame',
      rulesTitle:'Game Rules',rulesIntro:'Harvest souls by matching 3 or more identical symbols along an active payline, beginning from the leftmost reel.',closeRules:'Close game rules',
      rulesHow:'How to Play',rulesStep1:'Press the Bet Amount panel and choose ₩1,000, ₩3,000, ₩5,000, or ₩10,000.',rulesStep2:'The center Spin button plays one round. Use Turbo or Spacebar for a faster spin. During free spins, the remaining count appears in the center of the Spin button.',rulesStep3:'Wins must connect consecutively from the leftmost reel along an active payline.',rulesStep4:'Auto runs up to 10 consecutive spins. Stop Auto cancels the remaining spins at any time.',
      rulesRewards:'Prize Multipliers',rulesMatch3:'3 matching symbols',rulesMatch4:'4 matching symbols',rulesMatch5:'5 matching symbols',rulesWild5:'5 Wilds',rulesPayouts:'Multipliers apply to your selected bet. Only the longest match on each payline pays. Payouts from all winning paylines are added.',rulesPayoutExample:'Example at a ₩1,000 bet: 3 regular symbols pay ₩500, 4 pay ₩4,000, and 5 pay ₩10,000. Five Wilds pay the ₩50,000 jackpot.',
      rulesPaylines:'Payline Guide',rulesPaylineDetails:'All 10 fixed paylines are active across the 5 reels and 3 rows. When the reels stop, every winning combination and its payline lights up, and wins on separate paylines are added together.',
      rulesWildTitle:'Wild',rulesWildFeature:'Wild substitutes for every regular symbol except Scatter. When the reels stop, each landed Wild displays its dedicated artwork and glow effect. Five connected Wilds on one payline pay 50× the selected bet.',
      rulesSymbols:'Symbol Rules',rulesWild:'Wild substitutes for any regular symbol except Scatter on a winning payline.',rulesSpecial:'Every regular symbol wins with 3 or more consecutive matches from the left on an active payline.',rulesModel:'There are 10 active paylines; only the longest match on each line pays.',rulesFreeSpins:'Free Spins',rulesFreeSpinsRule:'Land 3 or more red SCATTER symbols anywhere on the reels to award 10 free spins. Retriggers award another 10 free spins.',rulesScatterRule:'The SCATTER reveal appears over the red Scatter symbol. Scatter does not substitute as a Wild and does not pay.',freeSpinsAwarded:'FREE SPINS AWARDED!',freeSpinsAwardedSub:'10 free spins added.',rulesNoBonus:'No separate Bonus symbol or bonus round is currently configured.',rulesSymbol:'Symbol',rulesScatter:'Scatter',rulesFeatureStatus:'Feature status',rulesConfigured:'Configured',
      rulesDisplays:'On-screen Information',rulesReadouts:'The bottom glass panels show your current bet, latest win amount, and wallet balance.',rulesResultDisplay:'Normal spin results appear in the bottom-right corner. WIN shows the payout and multiplier; LOSS shows the bet amount spent.',rulesFreeSpinDisplay:'The free-spin award card slides in from the left, then stays partially docked. Press the docked card to reopen it. It disappears after the final free spin.',
      rulesControls:'Controls',rulesSpinControl:'Spin button: one spin at normal speed. During free spins, its center number shows how many remain.',rulesTurboControl:'Spacebar: one turbo spin at 3.25× speed. Releasing the key keeps that spin in turbo until it finishes. Press during a spin to speed it up. Release and press again for another spin. Bets, winning chances, and payouts stay the same.',rulesAutoControl:'Auto button: up to 10 consecutive spins. It changes to Stop Auto while active. Press it anytime, including while the reels spin, to cancel the remaining auto spins. The current spin finishes and pays any winnings. Hold Spacebar to use turbo speed during Auto spins.',rulesMenuControl:'⋮ Menu button: opens Help, Music, and Language settings.',rulesSoundControl:'♫ button: toggle music and effects'
    }
  };

  function t(key){return translations[language][key]}

  function money(n){return Number(n).toLocaleString(language==='ko'?'ko-KR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}

  function won(n){return Number(n).toLocaleString('ko-KR',{style:'currency',currency:'KRW',minimumFractionDigits:0,maximumFractionDigits:0})}

  function setLanguage(nextLanguage) {
    language = nextLanguage === 'en' ? 'en' : 'ko';
  }

  return { t, money, won, setLanguage, get language() { return language; } };
};
