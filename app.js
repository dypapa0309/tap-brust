(() => {
  'use strict';

  const GAME_TIME = 30;
  const TARGET_SIZE = 84;
  const STORAGE_KEY = 'tap-burst-best-fixed';

  const targetTypes = {
    normal: { emoji: '🫧', label: '+1', points: 1, color: '#73d8ff' },
    bonus: { emoji: '⭐', label: '+2', points: 2, color: '#ffd25b' },
    trap: { emoji: '💣', label: '-3', points: -3, color: '#ff7592' },
  };

  const $ = (id) => document.getElementById(id);

  const ui = {
    board: $('board'),
    targetsLayer: $('targetsLayer'),
    effectsLayer: $('effectsLayer'),
    readyOverlay: $('readyOverlay'),
    resultOverlay: $('resultOverlay'),
    startBtn: $('startBtn'),
    restartBtn: $('restartBtn'),
    shareBtn: $('shareBtn'),
    bestScore: $('bestScore'),
    timeValue: $('timeValue'),
    scoreValue: $('scoreValue'),
    comboValue: $('comboValue'),
    comboSub: $('comboSub'),
    warningBar: $('warningBar'),
    warningSec: $('warningSec'),
    resultScore: $('resultScore'),
    resultRank: $('resultRank'),
    resultComment: $('resultComment'),
    resultBest: $('resultBest'),
  };

  const state = {
    phase: 'ready',
    secondsLeft: GAME_TIME,
    score: 0,
    combo: 0,
    bestScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
    clockTimer: null,
    spawnTimer: null,
    targets: new Map(),
    adsInitialized: false,
  };

  function safeInitAds() {
    if (state.adsInitialized) return;
    const ins = document.querySelectorAll('.adsbygoogle');
    if (!ins.length) return;
    try {
      ins.forEach(() => {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      });
      state.adsInitialized = true;
    } catch (err) {
      console.warn('Ads init skipped:', err);
    }
  }

  function makeComment(score) {
    if (score <= 10) return '이건… 연습이 조금 필요해 보여 😅';
    if (score <= 40) return '손은 있는데 아직 폭주 단계는 아니야.';
    if (score <= 70) return '오, 이 정도면 꽤 빠르다. 상위권 냄새 난다.';
    return '이건 거의 인간이 아니다. 손가락에 엔진 달았네.';
  }

  function getRank(score) {
    if (score <= 10) return '입문자';
    if (score <= 25) return '예열 완료';
    if (score <= 45) return '고속 손가락';
    if (score <= 70) return '상위권';
    return '괴물';
  }

  function pickTargetType(secondsLeft) {
    const elapsed = GAME_TIME - secondsLeft;
    const roll = Math.random();

    if (elapsed < 10) {
      if (roll < 0.78) return 'normal';
      if (roll < 0.94) return 'bonus';
      return 'trap';
    }
    if (elapsed < 20) {
      if (roll < 0.68) return 'normal';
      if (roll < 0.88) return 'bonus';
      return 'trap';
    }
    if (roll < 0.58) return 'normal';
    if (roll < 0.82) return 'bonus';
    return 'trap';
  }

  function getSpawnInterval(secondsLeft) {
    const elapsed = GAME_TIME - secondsLeft;
    if (elapsed < 10) return 720;
    if (elapsed < 20) return 520;
    return 340;
  }

  function getLifetime(secondsLeft) {
    const elapsed = GAME_TIME - secondsLeft;
    if (elapsed < 10) return 900;
    if (elapsed < 20) return 700;
    return 480;
  }

  function getMultiplier(combo) {
    if (combo >= 18) return 3;
    if (combo >= 10) return 2;
    return 1;
  }

  function updateHUD() {
    const multiplier = getMultiplier(state.combo);
    ui.bestScore.textContent = `${state.bestScore}점`;
    ui.timeValue.textContent = `${state.secondsLeft}s`;
    ui.scoreValue.textContent = String(state.score);
    ui.comboValue.textContent = `x${multiplier}`;
    ui.comboSub.textContent = `연속 ${state.combo}회`;

    if (state.phase === 'playing' && state.secondsLeft <= 5) {
      ui.warningBar.classList.remove('hidden');
      ui.warningSec.textContent = String(state.secondsLeft);
      ui.board.classList.add('danger');
    } else {
      ui.warningBar.classList.add('hidden');
      ui.board.classList.remove('danger');
    }
  }

  function clearTimers() {
    if (state.clockTimer) {
      clearInterval(state.clockTimer);
      state.clockTimer = null;
    }
    if (state.spawnTimer) {
      clearTimeout(state.spawnTimer);
      state.spawnTimer = null;
    }
  }

  function clearVisuals() {
    state.targets.forEach((target) => {
      clearTimeout(target.expireTimer);
      target.el.remove();
    });
    state.targets.clear();
    ui.targetsLayer.innerHTML = '';
    ui.effectsLayer.innerHTML = '';
  }

  function resetForPlay() {
    clearTimers();
    clearVisuals();
    state.phase = 'playing';
    state.secondsLeft = GAME_TIME;
    state.score = 0;
    state.combo = 0;
    ui.readyOverlay.classList.remove('show');
    ui.readyOverlay.classList.add('hidden');
    ui.resultOverlay.classList.remove('show');
    ui.resultOverlay.classList.add('hidden');
    updateHUD();
  }

  function startGame() {
    resetForPlay();

    state.clockTimer = setInterval(() => {
      state.secondsLeft -= 1;
      if (state.secondsLeft <= 0) {
        state.secondsLeft = 0;
        updateHUD();
        endGame();
        return;
      }
      updateHUD();
    }, 1000);

    scheduleSpawn(120);
  }

  function endGame() {
    clearTimers();
    state.phase = 'result';
    clearVisuals();

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.bestScore));
    }

    ui.resultScore.textContent = `${state.score}점`;
    ui.resultRank.textContent = `등급: ${getRank(state.score)}`;
    ui.resultComment.textContent = makeComment(state.score);
    ui.resultBest.textContent = `${state.bestScore}점`;

    ui.resultOverlay.classList.remove('hidden');
    ui.resultOverlay.classList.add('show');
    updateHUD();
  }

  function scheduleSpawn(delay) {
    clearTimeout(state.spawnTimer);
    state.spawnTimer = setTimeout(() => {
      if (state.phase !== 'playing') return;
      spawnTarget();
      scheduleSpawn(getSpawnInterval(state.secondsLeft));
    }, delay);
  }

  function spawnTarget() {
    const rect = ui.board.getBoundingClientRect();
    const size = rect.width <= 430 ? 78 : TARGET_SIZE;
    const maxX = Math.max(10, rect.width - size - 10);
    const maxY = Math.max(10, rect.height - size - 10);
    const left = Math.random() * maxX + 5;
    const top = Math.random() * maxY + 5;
    const type = pickTargetType(state.secondsLeft);
    const meta = targetTypes[type];
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const life = getLifetime(state.secondsLeft);

    const target = document.createElement('button');
    target.type = 'button';
    target.className = `target ${type}`;
    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
    target.innerHTML = `
      <span class="face">
        <span class="emoji">${meta.emoji}</span>
        <span class="tlabel">${meta.label}</span>
      </span>
    `;

    const activate = (event) => {
      event.preventDefault();
      event.stopPropagation();
      hitTarget(id, left + size / 2, top + size / 2);
    };

    target.addEventListener('pointerdown', activate, { passive: false });
    target.addEventListener('click', activate, { passive: false });

    ui.targetsLayer.appendChild(target);
    requestAnimationFrame(() => target.classList.add('show'));

    const expireTimer = setTimeout(() => {
      if (!state.targets.has(id) || state.phase !== 'playing') return;
      removeTarget(id);
      state.combo = 0;
      updateHUD();
    }, life);

    state.targets.set(id, { id, type, el: target, expireTimer });
  }

  function removeTarget(id) {
    const target = state.targets.get(id);
    if (!target) return;
    clearTimeout(target.expireTimer);
    target.el.classList.remove('show');
    setTimeout(() => {
      if (target.el && target.el.parentNode) target.el.remove();
    }, 120);
    state.targets.delete(id);
  }

  function hitTarget(id, x, y) {
    if (state.phase !== 'playing') return;
    const target = state.targets.get(id);
    if (!target) return;

    const meta = targetTypes[target.type];
    removeTarget(id);

    let gain = meta.points;
    if (target.type === 'trap') {
      state.combo = 0;
      state.score = Math.max(0, state.score + meta.points);
    } else {
      state.combo += 1;
      gain = meta.points * getMultiplier(state.combo);
      state.score += gain;
    }

    spawnPopup(x, y, meta.emoji, gain);
    spawnParticles(x, y, meta.color, target.type === 'trap' ? 12 : 18);
    updateHUD();
  }

  function spawnPopup(x, y, emoji, value) {
    const el = document.createElement('div');
    el.className = `popup ${value >= 0 ? 'good' : 'bad'}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = `
      <div class="pemoji">${emoji}</div>
      <div class="pvalue">${value >= 0 ? `+${value}` : value}</div>
    `;
    ui.effectsLayer.appendChild(el);
    setTimeout(() => el.remove(), 720);
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const distance = 22 + Math.random() * 66;
      const size = 8 + Math.random() * 10;

      p.className = 'particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = color;
      p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);

      ui.effectsLayer.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  }

  async function shareResult() {
    const text = `나 방금 30초 광클 챌린지에서 ${state.score}점 찍음. ${makeComment(state.score)} 너도 해봐.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: '30초 광클 챌린지',
          text,
          url: window.location.href,
        });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        alert('공유 문구가 복사됐어.');
        return;
      }
      window.prompt('이 문구를 복사해줘.', `${text} ${window.location.href}`);
    } catch (err) {
      console.warn(err);
    }
  }

  function bind() {
    ui.startBtn.addEventListener('click', startGame);
    ui.restartBtn.addEventListener('click', startGame);
    ui.shareBtn.addEventListener('click', shareResult);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.phase === 'playing') {
        clearTimers();
      }
    });
  }

  bind();
  updateHUD();
  safeInitAds();
})();