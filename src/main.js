import './style.css';

const SHOP_URL = 'https://little6.co/products/lamose-titanium-espresso-cup-4oz-petite?utm_source=game&utm_medium=interactive&utm_campaign=six_hid_it';
const ROUND_CONFIG = [
  { swaps: 3, duration: 520 },
  { swaps: 5, duration: 420 },
  { swaps: 7, duration: 340 },
];
const CHOICE_TIME = 5000;

const copy = {
  en: {
    round: (n) => `ROUND ${n} / 3`,
    score: (n) => `${n} of 3 ice flowers`,
    idleStatus: 'FIND THE FLOWER',
    idleHint: 'WATCH · TRACK · CHOOSE',
    place: 'WATCH THE FLOWER',
    cover: 'SIX HID IT',
    shuffle: 'WATCH SIX',
    choose: 'WHICH ONE?',
    chooseHint: 'TAP A CUP · OR PRESS 1 2 3',
    correct: 'YOU FOUND IT',
    correctHint: 'ICE FLOWER FOUND',
    wrong: 'SIX FOOLED YOU',
    wrongHint: 'THE FLOWER WAS HERE',
    timeout: 'TIME',
    timeoutHint: 'THE FLOWER WAS HERE',
    startKicker: 'LITTLE 6 PRESENTS',
    startTitle: 'Find the ice flower.',
    startBody: 'Watch which titanium cup covers it, then follow every move.',
    startAction: 'START GAME',
    winKicker: 'ICE FLOWER · COMPLETE',
    winTitle: 'You found what Six hid.',
    winBody: 'Three quiet tricks. Three perfect finds.',
    loseKicker: 'LITTLE 6 WINS THIS ONE',
    loseTitle: 'She moved faster.',
    loseBody: (n) => `You found ${n} of 3 ice flowers. Follow her paws and try again.`,
    replay: 'PLAY AGAIN',
    retry: 'TRY AGAIN',
    shop: 'MEET THE 4OZ CUP',
    flowers: (n) => `${n} / 3 FLOWERS`,
    cup: (n) => `Choose cup ${n}`,
  },
  zh: {
    round: (n) => `第 ${n} / 3 轮`,
    score: (n) => `已找到 ${n} / 3 枚冰花`,
    idleStatus: '找到冰花',
    idleHint: '观察 · 追踪 · 选择',
    place: '看清冰花',
    cover: '小六藏好了',
    shuffle: '盯紧小六',
    choose: '在哪一只？',
    chooseHint: '点击杯子 · 或按 1 2 3',
    correct: '你找到了',
    correctHint: '获得一枚冰花',
    wrong: '被小六骗到了',
    wrongHint: '冰花在这里',
    timeout: '时间到',
    timeoutHint: '冰花在这里',
    startKicker: 'LITTLE 6 PRESENTS',
    startTitle: '找到冰花。',
    startBody: '看清哪只钛杯盖住它，然后跟住每一次换位。',
    startAction: '开始游戏',
    winKicker: 'ICE FLOWER · COMPLETE',
    winTitle: '你找到了小六藏的东西。',
    winBody: '三次小把戏，三次全部找对。',
    loseKicker: '这一局小六赢了',
    loseTitle: '她动得更快。',
    loseBody: (n) => `你找到了 ${n} / 3 枚冰花。盯紧她的爪子，再试一次。`,
    replay: '再玩一次',
    retry: '再试一次',
    shop: '查看 4OZ 钛杯',
    flowers: (n) => `${n} / 3 枚冰花`,
    cup: (n) => `选择第 ${n} 只杯子`,
  },
};

function detectLocale() {
  const override = localStorage.getItem('game_locale');
  if (override === 'en' || override === 'zh') return override;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const locale = detectLocale();
const t = (key, value) => {
  const entry = copy[locale][key] ?? copy.en[key];
  return typeof entry === 'function' ? entry(value) : entry;
};

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const cups = [...document.querySelectorAll('.shell-cup')];
const cupRow = document.querySelector('.cup-row');
const gameStatus = document.querySelector('#gameStatus');
const gameFlower = document.querySelector('#gameFlower');
const gamePaw = document.querySelector('#gamePaw');
const tapHint = document.querySelector('#tapHint');
const resetButton = document.querySelector('#resetDemo');
const phone = document.querySelector('.phone');
const roundLabel = document.querySelector('#roundLabel');
const flowerScore = document.querySelector('.flower-score');
const scoreMarks = [...flowerScore.querySelectorAll('i')];
const choiceTimer = document.querySelector('#choiceTimer');
const gameOverlay = document.querySelector('#gameOverlay');
const overlayKicker = document.querySelector('#overlayKicker');
const overlayTitle = document.querySelector('#overlayTitle');
const overlayBody = document.querySelector('#overlayBody');
const overlayProduct = document.querySelector('#overlayProduct');
const resultScore = document.querySelector('#resultScore');
const primaryAction = document.querySelector('#primaryGameAction');
const gameShopLink = document.querySelector('#gameShopLink');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let phase = 'idle';
let roundIndex = 0;
let flowersFound = 0;
let flowerCupId = 0;
let slotsByCup = [0, 1, 2];
let runToken = 0;
let choiceTimeout = 0;
let audioContext;

function setPhase(nextPhase) {
  phase = nextPhase;
  phone.dataset.phase = nextPhase;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitFor(ms, token) {
  await wait(ms);
  return token === runToken;
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioContext = new AudioContext();
  }
  if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
}

function tone(frequency, duration, volume, type = 'sine', delay = 0) {
  if (!audioContext) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

const sound = {
  start() {
    tone(190, 0.08, 0.035, 'triangle');
  },
  paw() {
    tone(110, 0.08, 0.025, 'triangle');
  },
  swap(step) {
    tone(1650 + step * 90, 0.05, 0.018, 'sine');
  },
  select() {
    tone(180, 0.07, 0.03, 'triangle');
  },
  correct() {
    tone(880, 0.2, 0.045, 'sine');
    tone(1320, 0.2, 0.04, 'sine', 0.08);
  },
  wrong() {
    tone(150, 0.16, 0.04, 'triangle');
  },
  complete() {
    [523, 659, 784].forEach((frequency, index) => tone(frequency, 0.3, 0.04, 'sine', index * 0.11));
    tone(70, 0.55, 0.018, 'triangle', 0.16);
  },
};

function slotLeft(slot) {
  const cupWidth = cups[0].offsetWidth;
  return slot * ((cupRow.clientWidth - cupWidth) / 2);
}

function layoutCups({ instant = false } = {}) {
  cups.forEach((cup, cupId) => {
    cup.style.setProperty('--cup-left', `${slotLeft(slotsByCup[cupId])}px`);
    cup.dataset.slot = String(slotsByCup[cupId]);
    cup.classList.toggle('is-instant', instant);
  });
  if (instant) requestAnimationFrame(() => cups.forEach((cup) => cup.classList.remove('is-instant')));
}

function positionFlower() {
  const slot = slotsByCup[flowerCupId];
  const center = cupRow.offsetLeft + slotLeft(slot) + cups[0].offsetWidth / 2;
  gameFlower.style.left = `${center - gameFlower.offsetWidth / 2}px`;
}

function updateHud() {
  roundLabel.textContent = t('round', roundIndex + 1);
  flowerScore.setAttribute('aria-label', t('score', flowersFound));
  scoreMarks.forEach((mark, index) => mark.classList.toggle('is-earned', index < flowersFound));
  cups.forEach((cup) => {
    const slot = slotsByCup[Number(cup.dataset.cup)];
    cup.setAttribute('aria-label', t('cup', slot + 1));
  });
}

function setCupsEnabled(enabled) {
  cups.forEach((cup) => {
    cup.disabled = !enabled;
    cup.setAttribute('aria-disabled', String(!enabled));
  });
}

function clearChoiceTimer() {
  window.clearTimeout(choiceTimeout);
  choiceTimeout = 0;
  choiceTimer.classList.remove('is-running');
}

function startChoiceTimer(token) {
  clearChoiceTimer();
  void choiceTimer.offsetWidth;
  choiceTimer.classList.add('is-running');
  choiceTimeout = window.setTimeout(() => {
    if (token === runToken && phase === 'choose') revealChoice(null, true);
  }, CHOICE_TIME);
}

function resetCupPresentation() {
  cups.forEach((cup) => {
    cup.classList.remove('is-picked', 'is-answer', 'is-wrong', 'is-preview');
    cup.style.removeProperty('--shuffle-duration');
  });
  gameFlower.classList.remove('is-visible');
  gamePaw.classList.remove('is-placing', 'is-pointing');
  clearChoiceTimer();
}

function setOverlay(mode) {
  const isVisible = mode !== 'hidden';
  gameOverlay.classList.toggle('is-hidden', !isVisible);
  gameOverlay.classList.toggle('is-result', mode === 'win' || mode === 'lose');
  overlayProduct.hidden = !(mode === 'win' || mode === 'lose');
  gameShopLink.hidden = !(mode === 'win' || mode === 'lose');
  primaryAction.disabled = false;

  if (mode === 'start') {
    overlayKicker.textContent = t('startKicker');
    overlayTitle.textContent = t('startTitle');
    overlayBody.textContent = t('startBody');
    primaryAction.textContent = t('startAction');
  } else if (mode === 'win') {
    overlayKicker.textContent = t('winKicker');
    overlayTitle.textContent = t('winTitle');
    overlayBody.textContent = t('winBody');
    primaryAction.textContent = t('replay');
  } else if (mode === 'lose') {
    overlayKicker.textContent = t('loseKicker');
    overlayTitle.textContent = t('loseTitle');
    overlayBody.textContent = t('loseBody', flowersFound);
    primaryAction.textContent = t('retry');
  }

  if (isVisible) {
    resultScore.textContent = t('flowers', flowersFound);
    gameShopLink.innerHTML = `${t('shop')} <span>↗</span>`;
  }
}

function showIdle() {
  runToken += 1;
  setPhase('idle');
  roundIndex = 0;
  flowersFound = 0;
  slotsByCup = [0, 1, 2];
  flowerCupId = 0;
  resetCupPresentation();
  layoutCups({ instant: true });
  updateHud();
  setCupsEnabled(false);
  gameStatus.textContent = t('idleStatus');
  tapHint.textContent = t('idleHint');
  setOverlay('start');
}

async function swapAdjacent(pairIndex, duration, step, token) {
  const firstCup = slotsByCup.indexOf(pairIndex);
  const secondCup = slotsByCup.indexOf(pairIndex + 1);
  [slotsByCup[firstCup], slotsByCup[secondCup]] = [slotsByCup[secondCup], slotsByCup[firstCup]];
  cups.forEach((cup) => cup.style.setProperty('--shuffle-duration', `${reducedMotion ? 80 : duration}ms`));
  layoutCups();
  sound.swap(step);
  updateHud();
  return waitFor((reducedMotion ? 80 : duration) + 90, token);
}

async function beginRound(token) {
  if (token !== runToken) return;
  resetCupPresentation();
  setCupsEnabled(false);
  slotsByCup = [0, 1, 2];
  layoutCups({ instant: true });
  flowerCupId = Math.floor(Math.random() * 3);
  updateHud();
  positionFlower();
  setOverlay('hidden');
  setPhase('place');
  gameStatus.textContent = t('place');
  tapHint.textContent = t('idleHint');
  gamePaw.classList.add('is-placing');

  if (!(await waitFor(roundIndex === 0 ? 800 : 450, token))) return;
  cups[flowerCupId].classList.add('is-preview');
  gameFlower.classList.add('is-visible');
  sound.paw();

  if (!(await waitFor(1200, token))) return;
  setPhase('cover');
  gameStatus.textContent = t('cover');
  cups[flowerCupId].classList.remove('is-preview');
  gameFlower.classList.remove('is-visible');
  gamePaw.classList.remove('is-placing');

  if (!(await waitFor(420, token))) return;
  setPhase('shuffle');
  gameStatus.textContent = t('shuffle');
  const config = ROUND_CONFIG[roundIndex];
  let lastPair = -1;
  for (let step = 0; step < config.swaps; step += 1) {
    let pair = Math.random() < 0.5 ? 0 : 1;
    if (pair === lastPair && Math.random() < 0.65) pair = 1 - pair;
    lastPair = pair;
    if (!(await swapAdjacent(pair, config.duration, step, token))) return;
  }

  if (token !== runToken) return;
  cups.forEach((cup) => cup.style.removeProperty('--shuffle-duration'));
  setPhase('choose');
  setCupsEnabled(true);
  gameStatus.textContent = t('choose');
  tapHint.textContent = t('chooseHint');
  startChoiceTimer(token);
}

function startGame() {
  ensureAudio();
  sound.start();
  runToken += 1;
  const token = runToken;
  roundIndex = 0;
  flowersFound = 0;
  updateHud();
  primaryAction.disabled = true;
  beginRound(token);
}

async function revealChoice(selectedCup, timedOut = false) {
  if (phase !== 'choose') return;
  const token = runToken;
  setPhase('reveal');
  setCupsEnabled(false);
  clearChoiceTimer();
  sound.select();

  if (selectedCup) selectedCup.classList.add('is-picked');
  const answerCup = cups[flowerCupId];
  const isCorrect = selectedCup === answerCup;
  if (selectedCup && !isCorrect) selectedCup.classList.add('is-wrong');
  answerCup.classList.add('is-answer');
  positionFlower();
  gameFlower.classList.add('is-visible');
  gamePaw.classList.add('is-pointing');

  if (isCorrect) {
    flowersFound += 1;
    updateHud();
    gameStatus.textContent = t('correct');
    tapHint.textContent = t('correctHint');
    phone.classList.add('is-correct');
    sound.correct();
    navigator.vibrate?.(18);
  } else {
    gameStatus.textContent = timedOut ? t('timeout') : t('wrong');
    tapHint.textContent = timedOut ? t('timeoutHint') : t('wrongHint');
    phone.classList.add('is-failed');
    sound.wrong();
  }

  if (!(await waitFor(isCorrect ? 1100 : 1400, token))) return;
  phone.classList.remove('is-correct', 'is-failed');
  if (isCorrect && roundIndex < 2) {
    roundIndex += 1;
    updateHud();
    beginRound(token);
  } else {
    finishGame(isCorrect && roundIndex === 2);
  }
}

function finishGame(won) {
  setPhase(won ? 'complete' : 'failed');
  setCupsEnabled(false);
  if (won) sound.complete();
  setOverlay(won ? 'win' : 'lose');
}

function chooseBySlot(slot) {
  if (phase !== 'choose') return;
  const cupId = slotsByCup.indexOf(slot);
  if (cupId >= 0) revealChoice(cups[cupId]);
}

cups.forEach((cup) => {
  cup.addEventListener('pointerdown', (event) => {
    if (phase !== 'choose') return;
    event.preventDefault();
    revealChoice(cup);
  });
  cup.addEventListener('click', (event) => {
    if (event.detail === 0 && phase === 'choose') revealChoice(cup);
  });
});

primaryAction.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  startGame();
});
primaryAction.addEventListener('click', (event) => {
  if (event.detail === 0) startGame();
});

resetButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  showIdle();
});
resetButton.addEventListener('click', (event) => {
  if (event.detail === 0) showIdle();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    startGame();
    return;
  }
  if (['1', '2', '3'].includes(event.key)) {
    event.preventDefault();
    chooseBySlot(Number(event.key) - 1);
  }
});

window.addEventListener('resize', () => {
  layoutCups({ instant: true });
  positionFlower();
});

gameShopLink.href = SHOP_URL;
window.__sixGame = {
  getPhase: () => phase,
  getAnswerSlot: () => slotsByCup[flowerCupId],
  getScore: () => flowersFound,
  start: startGame,
  reset: showIdle,
};

showIdle();
