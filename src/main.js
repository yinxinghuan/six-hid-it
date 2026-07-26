import './style.css';

const SHOP_URL = 'https://little6.co/products/lamose-titanium-espresso-cup-4oz-petite?utm_source=game&utm_medium=interactive&utm_campaign=six_hid_it';
const ROUND_CONFIG = [
  { swaps: 3, duration: 520 },
  { swaps: 5, duration: 420 },
  { swaps: 7, duration: 340 },
];
const CHOICE_TIME = 9000;

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
    chooseHint: 'TAP A CUP TO TEST IT',
    nudgeOne: 'THIS ONE?',
    nudgeOneHint: 'TAP IT AGAIN TO CONFIRM · OR SWITCH',
    confirmLabel: 'TAP AGAIN',
    reveal: 'WATCH THE PAW',
    revealHint: 'SIX IS OPENING IT',
    correct: 'YOU FOUND IT',
    correctHint: 'ICE FLOWER FOUND',
    correctResult: 'FOUND IT!',
    correctResultDetail: 'ROUND +1 ICE FLOWER',
    wrong: 'SIX FOOLED YOU',
    wrongHint: 'THE FLOWER WAS HERE',
    wrongResult: 'NOT THIS ONE',
    wrongResultDetail: 'THE FLOWER WAS UNDER THIS CUP',
    timeout: 'TIME',
    timeoutHint: 'THE FLOWER WAS HERE',
    timeoutResult: 'TIME IS UP',
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
    chooseHint: '点一只杯子试探',
    nudgeOne: '就选这只？',
    nudgeOneHint: '再点同一只确认 · 点别的更换',
    confirmLabel: '再点确认',
    reveal: '看小六的爪子',
    revealHint: '她要拨开杯子了',
    correct: '你找到了',
    correctHint: '获得一枚冰花',
    correctResult: '找到了！',
    correctResultDetail: '本轮 +1 枚冰花',
    wrong: '被小六骗到了',
    wrongHint: '冰花在这里',
    wrongResult: '猜错了',
    wrongResultDetail: '冰花在这只杯子下',
    timeout: '时间到',
    timeoutHint: '冰花在这里',
    timeoutResult: '时间到',
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
const roundResult = document.querySelector('#roundResult');
const roundResultTitle = document.querySelector('#roundResultTitle');
const roundResultDetail = document.querySelector('#roundResultDetail');
const gameFlower = document.querySelector('#gameFlower');
const gamePaw = document.querySelector('#gamePaw');
const impactMark = document.querySelector('#impactMark');
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
let audioOutput;
let metalNoiseBuffer;
let probeCupId = -1;
let probeCount = 0;
let nudgeLocked = false;

function setPhase(nextPhase) {
  const shouldEmerge = nextPhase === 'choose' && phase !== 'choose';
  phase = nextPhase;
  phone.dataset.phase = nextPhase;
  phone.classList.remove('is-cat-emerging');
  if (shouldEmerge) {
    void phone.offsetWidth;
    phone.classList.add('is-cat-emerging');
    window.setTimeout(() => {
      if (phase === 'choose') phone.classList.remove('is-cat-emerging');
    }, reducedMotion ? 80 : 540);
  }
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
    if (AudioContext) {
      audioContext = new AudioContext();
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 8;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 0.72;
      masterGain.connect(compressor).connect(audioContext.destination);
      audioOutput = masterGain;

      metalNoiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.12), audioContext.sampleRate);
      const noise = metalNoiseBuffer.getChannelData(0);
      for (let sample = 0; sample < noise.length; sample += 1) {
        const envelope = 1 - sample / noise.length;
        noise[sample] = (Math.random() * 2 - 1) * envelope;
      }
    }
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
  oscillator.connect(gain).connect(audioOutput ?? audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function metalMode(frequency, decay, volume, delay = 0) {
  if (!audioContext) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency * 1.008, start);
  oscillator.frequency.exponentialRampToValueAtTime(frequency, start + Math.min(0.028, decay * 0.3));
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
  oscillator.connect(gain).connect(audioOutput ?? audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + decay + 0.025);
}

function metalNoise(centerFrequency, duration, volume, delay = 0) {
  if (!audioContext || !metalNoiseBuffer) return;
  const start = audioContext.currentTime + delay;
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = metalNoiseBuffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(centerFrequency, start);
  filter.Q.value = 1.15;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(audioOutput ?? audioContext.destination);
  source.start(start);
  source.stop(start + duration + 0.01);
}

function metalStrike(modes, noiseFrequency, noiseDuration, noiseVolume, delay = 0) {
  modes.forEach(([frequency, decay, volume]) => metalMode(frequency, decay, volume, delay));
  metalNoise(noiseFrequency, noiseDuration, noiseVolume, delay);
}

const sound = {
  start() {
    tone(190, 0.08, 0.035, 'triangle');
  },
  paw() {
    tone(110, 0.08, 0.025, 'triangle');
  },
  swap(step) {
    const shift = step * 24;
    metalStrike([
      [1120 + shift, 0.11, 0.019],
      [2860 + shift * 1.7, 0.072, 0.009],
      [4380 + shift * 2.1, 0.046, 0.005],
    ], 3900, 0.018, 0.012);
  },
  select() {
    tone(180, 0.07, 0.03, 'triangle');
  },
  nudge(level) {
    const strength = level === 1 ? 1 : 1.28;
    const contactDelay = reducedMotion ? 0 : 0.21;
    metalStrike([
      [980, 0.15 * strength, 0.026 * strength],
      [2570, 0.105 * strength, 0.013 * strength],
      [4280, 0.072 * strength, 0.007 * strength],
      [6260, 0.048 * strength, 0.0035 * strength],
    ], 4300, 0.022, 0.016 * strength, contactDelay);
  },
  contact() {
    metalStrike([
      [760, 0.26, 0.048],
      [1860, 0.19, 0.026],
      [3380, 0.13, 0.014],
      [5740, 0.08, 0.006],
    ], 3200, 0.022, 0.026);
  },
  land() {
    metalStrike([
      [620, 0.48, 0.058],
      [1680, 0.36, 0.035],
      [3150, 0.24, 0.018],
      [5420, 0.16, 0.008],
    ], 2400, 0.028, 0.035);
    metalStrike([
      [1760, 0.16, 0.014],
      [3290, 0.12, 0.008],
      [5580, 0.08, 0.0035],
    ], 3600, 0.014, 0.01, 0.07);
    metalStrike([
      [1610, 0.12, 0.008],
      [3010, 0.09, 0.0045],
    ], 3100, 0.012, 0.006, 0.145);
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
    cup.classList.remove(
      'is-picked',
      'is-answer',
      'is-wrong',
      'is-preview',
      'is-nudging',
      'is-braced',
      'is-contact',
      'is-tumbling',
      'is-bumped',
      'is-candidate',
    );
    cup.removeAttribute('data-nudge');
    cup.removeAttribute('data-confirm-label');
    cup.style.removeProperty('--shuffle-duration');
    ['--probe-x', '--probe-rot', '--wobble-x', '--wobble-rot', '--wobble-back-x', '--wobble-back-rot', '--wobble-settle-x', '--wobble-settle-rot', '--kick-x', '--kick-y', '--kick-rot', '--land-x', '--land-rot', '--bounce-rot', '--bump-x', '--bump-back-x', '--bump-settle-x', '--bump-rot', '--bump-back-rot']
      .forEach((property) => cup.style.removeProperty(property));
  });
  gameFlower.classList.remove('is-visible', 'is-revealing');
  gamePaw.classList.remove('is-placing', 'is-pointing', 'from-right', 'is-nudging', 'is-anticipating', 'is-swinging', 'is-following');
  gamePaw.style.removeProperty('--paw-x');
  gamePaw.style.removeProperty('--paw-y');
  gamePaw.style.removeProperty('--paw-pre-x');
  gamePaw.style.removeProperty('--paw-pre-y');
  impactMark.classList.remove('is-visible');
  roundResult.classList.remove('is-visible', 'is-correct', 'is-wrong');
  roundResult.setAttribute('aria-hidden', 'true');
  roundResultTitle.textContent = '';
  roundResultDetail.textContent = '';
  phone.classList.remove('is-probing', 'is-anticipating', 'is-contact', 'is-impact', 'is-correct', 'is-failed', 'gaze-left', 'gaze-center', 'gaze-right');
  probeCupId = -1;
  probeCount = 0;
  nudgeLocked = false;
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
  configurePawForCup(cups[flowerCupId]);
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

function setCatGaze(slot, effort = 0) {
  phone.classList.remove('gaze-left', 'gaze-center', 'gaze-right');
  phone.classList.add(slot === 0 ? 'gaze-left' : slot === 2 ? 'gaze-right' : 'gaze-center');
  phone.dataset.effort = String(effort);
}

function configurePawForCup(cup) {
  const slot = slotsByCup[Number(cup.dataset.cup)];
  const fromRight = slot === 2;
  gamePaw.classList.remove('is-nudging', 'is-anticipating', 'is-swinging', 'is-following');
  gamePaw.classList.toggle('from-right', fromRight);
  gamePaw.classList.add('is-measuring');

  const cupRect = cup.getBoundingClientRect();
  const pawRect = gamePaw.getBoundingClientRect();
  const desiredX = fromRight
    ? cupRect.right - cupRect.width * 0.72
    : cupRect.left + cupRect.width * 0.72;
  const currentX = fromRight ? pawRect.left : pawRect.right;
  const desiredY = cupRect.top + cupRect.height * 0.55;
  const currentY = pawRect.top + pawRect.height * 0.5;
  const x = desiredX - currentX;
  const y = desiredY - currentY;

  gamePaw.style.setProperty('--paw-x', `${x}px`);
  gamePaw.style.setProperty('--paw-y', `${y}px`);
  gamePaw.style.setProperty('--paw-pre-x', `${x * 0.72}px`);
  gamePaw.style.setProperty('--paw-pre-y', `${y * 0.72 - 10}px`);
  void gamePaw.offsetWidth;
  gamePaw.classList.remove('is-measuring');
}

function setCupProbe(cup, level) {
  const slot = slotsByCup[Number(cup.dataset.cup)];
  const direction = slot === 2 ? -1 : 1;
  const forwardX = level === 1 ? 7 : 9;
  const forwardRotation = level === 1 ? 3 : 4;
  const reboundX = level === 1 ? -3 : -3.5;
  const reboundRotation = level === 1 ? -1.2 : -1.6;
  const settleX = level === 1 ? 0.7 : 1.2;
  const settleRotation = level === 1 ? 0.35 : 0.6;
  cup.dataset.nudge = String(level);
  cup.style.setProperty('--probe-x', '0px');
  cup.style.setProperty('--probe-rot', '0deg');
  cup.style.setProperty('--wobble-x', `${direction * forwardX}px`);
  cup.style.setProperty('--wobble-rot', `${direction * forwardRotation}deg`);
  cup.style.setProperty('--wobble-back-x', `${direction * reboundX}px`);
  cup.style.setProperty('--wobble-back-rot', `${direction * reboundRotation}deg`);
  cup.style.setProperty('--wobble-settle-x', `${direction * settleX}px`);
  cup.style.setProperty('--wobble-settle-rot', `${direction * settleRotation}deg`);
}

function showRoundResult(isCorrect, timedOut) {
  const titleKey = isCorrect ? 'correctResult' : timedOut ? 'timeoutResult' : 'wrongResult';
  const detailKey = isCorrect ? 'correctResultDetail' : 'wrongResultDetail';
  roundResultTitle.textContent = t(titleKey);
  roundResultDetail.textContent = t(detailKey);
  roundResult.classList.remove('is-correct', 'is-wrong');
  roundResult.classList.add('is-visible', isCorrect ? 'is-correct' : 'is-wrong');
  roundResult.setAttribute('aria-hidden', 'false');

  if (isCorrect) {
    flowersFound += 1;
    updateHud();
    gameStatus.textContent = t('correct');
    tapHint.textContent = t('correctHint');
    phone.classList.add('is-correct');
    sound.correct();
  } else {
    gameStatus.textContent = timedOut ? t('timeout') : t('wrong');
    tapHint.textContent = timedOut ? t('timeoutHint') : t('wrongHint');
    phone.classList.add('is-failed');
    sound.wrong();
  }
}

async function nudgeCup(cup) {
  if (phase !== 'choose' || nudgeLocked) return;
  nudgeLocked = true;
  ensureAudio();

  const cupId = Number(cup.dataset.cup);
  if (probeCupId !== cupId) {
    cups.forEach((candidate) => {
      if (candidate !== cup) {
        candidate.removeAttribute('data-nudge');
        candidate.removeAttribute('data-confirm-label');
        candidate.classList.remove('is-candidate');
        candidate.classList.remove('is-nudging');
        candidate.style.removeProperty('--probe-x');
        candidate.style.removeProperty('--probe-rot');
        candidate.style.removeProperty('--wobble-x');
        candidate.style.removeProperty('--wobble-rot');
        candidate.style.removeProperty('--wobble-back-x');
        candidate.style.removeProperty('--wobble-back-rot');
        candidate.style.removeProperty('--wobble-settle-x');
        candidate.style.removeProperty('--wobble-settle-rot');
      }
    });
    probeCupId = cupId;
    probeCount = 0;
  }

  probeCount += 1;
  if (probeCount >= 2) {
    cup.removeAttribute('data-confirm-label');
    cup.classList.remove('is-candidate');
    await revealChoice(cup);
    return;
  }

  const visibleLevel = 1;
  const slot = slotsByCup[cupId];
  setCatGaze(slot, visibleLevel);
  configurePawForCup(cup);
  setCupProbe(cup, visibleLevel);
  cup.classList.add('is-nudging');
  phone.classList.add('is-probing');
  gamePaw.classList.add('is-nudging');
  sound.nudge(visibleLevel);
  window.setTimeout(() => {
    if (phase === 'choose' && cup.classList.contains('is-nudging')) {
      navigator.vibrate?.(visibleLevel === 1 ? 7 : 11);
    }
  }, reducedMotion ? 0 : 210);

  gameStatus.textContent = t('nudgeOne');
  tapHint.textContent = t('nudgeOneHint');

  if (!(await waitFor(reducedMotion ? 90 : 420, runToken))) return;
  cup.classList.remove('is-nudging');
  gamePaw.classList.remove('is-nudging');
  phone.classList.remove('is-probing');
  cup.classList.add('is-candidate');
  cup.dataset.confirmLabel = t('confirmLabel');
  nudgeLocked = false;
}

async function revealChoice(selectedCup, timedOut = false) {
  if (phase !== 'choose') return;
  const token = runToken;
  setPhase('reveal');
  setCupsEnabled(false);
  clearChoiceTimer();
  nudgeLocked = true;
  gameStatus.textContent = t('reveal');
  tapHint.textContent = t('revealHint');

  if (selectedCup) selectedCup.classList.add('is-picked');
  cups.forEach((cup) => {
    cup.removeAttribute('data-confirm-label');
    cup.classList.remove('is-candidate');
  });
  const answerCup = cups[flowerCupId];
  const isCorrect = selectedCup === answerCup;
  if (selectedCup && !isCorrect) selectedCup.classList.add('is-wrong');

  const answerSlot = slotsByCup[flowerCupId];
  const direction = answerSlot === 2 ? -1 : 1;
  const adjacentSlot = answerSlot + direction;
  const adjacentCupId = slotsByCup.indexOf(adjacentSlot);
  const adjacentCup = adjacentCupId >= 0 ? cups[adjacentCupId] : null;
  setCatGaze(answerSlot, 3);
  configurePawForCup(answerCup);
  answerCup.style.setProperty('--probe-x', '0px');
  answerCup.style.setProperty('--probe-rot', '0deg');
  answerCup.style.setProperty('--kick-x', `${direction * 42}px`);
  answerCup.style.setProperty('--kick-y', '-44px');
  answerCup.style.setProperty('--kick-rot', `${direction * 46}deg`);
  answerCup.style.setProperty('--land-x', `${direction * 61}px`);
  answerCup.style.setProperty('--land-rot', `${direction * 82}deg`);
  answerCup.style.setProperty('--bounce-rot', `${direction * 69}deg`);
  if (adjacentCup) {
    adjacentCup.style.setProperty('--bump-x', `${direction * 8}px`);
    adjacentCup.style.setProperty('--bump-back-x', `${direction * -4}px`);
    adjacentCup.style.setProperty('--bump-settle-x', `${direction * 2}px`);
    adjacentCup.style.setProperty('--bump-rot', `${direction * 3}deg`);
    adjacentCup.style.setProperty('--bump-back-rot', `${direction * -1.2}deg`);
  }

  const phoneRect = phone.getBoundingClientRect();
  const answerRect = answerCup.getBoundingClientRect();
  impactMark.style.left = `${answerRect.left - phoneRect.left + answerRect.width / 2 + direction * 54}px`;
  impactMark.style.top = `${answerRect.top - phoneRect.top + answerRect.height * 0.78}px`;
  positionFlower();

  phone.classList.add('is-anticipating');
  gamePaw.classList.add('is-anticipating');
  answerCup.classList.add('is-braced');
  sound.select();
  if (!(await waitFor(reducedMotion ? 80 : 180, token))) return;

  phone.classList.remove('is-anticipating');
  gamePaw.classList.remove('is-anticipating');
  gamePaw.classList.add('is-swinging');
  if (!(await waitFor(reducedMotion ? 80 : 300, token))) return;

  answerCup.classList.add('is-contact');
  phone.classList.add('is-contact');
  sound.contact();
  navigator.vibrate?.(10);
  if (!(await waitFor(reducedMotion ? 35 : 45, token))) return;

  answerCup.classList.remove('is-braced', 'is-contact');
  answerCup.classList.add('is-answer', 'is-tumbling');
  gameFlower.classList.add('is-visible', 'is-revealing');
  gamePaw.classList.remove('is-swinging');
  gamePaw.classList.add('is-following');
  phone.classList.remove('is-contact');
  if (!(await waitFor(reducedMotion ? 100 : 440, token))) return;

  impactMark.classList.add('is-visible');
  phone.classList.add('is-impact');
  adjacentCup?.classList.add('is-bumped');
  sound.land();
  navigator.vibrate?.([18, 35, 8]);
  showRoundResult(isCorrect, timedOut);
  if (!(await waitFor(reducedMotion ? 100 : 210, token))) return;
  impactMark.classList.remove('is-visible');
  phone.classList.remove('is-impact');
  gamePaw.classList.remove('is-following');
  gamePaw.classList.add('is-retracting');
  if (!(await waitFor(reducedMotion ? 60 : 220, token))) return;
  gamePaw.classList.remove('is-retracting');

  if (!(await waitFor(isCorrect ? 900 : 1100, token))) return;
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
  if (cupId >= 0) nudgeCup(cups[cupId]);
}

cups.forEach((cup) => {
  cup.addEventListener('pointerdown', (event) => {
    if (phase !== 'choose') return;
    event.preventDefault();
    nudgeCup(cup);
  });
  cup.addEventListener('click', (event) => {
    if (event.detail === 0 && phase === 'choose') nudgeCup(cup);
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
