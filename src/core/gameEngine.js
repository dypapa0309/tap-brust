import { TARGET_SIZE, targetTypes } from '../config/gameConfig.js';
import { updateHUD } from '../ui/hud.js';
import { hideOverlay, showOverlay } from '../ui/overlays.js';
import {
  clearVisuals,
  maybeShowComboEffect,
  spawnBurstRing,
  spawnComboBreak,
  spawnParticles,
  spawnPopup,
  triggerBoardImpact,
} from '../ui/effects.js';

export function createGameEngine({ ui, bestScore, onSaveBestScore, onShare, adsController, hitFeedback, mode, skin, onRoundEnd }) {
  const state = {
    phase: 'ready',
    secondsLeft: mode.time,
    score: 0,
    combo: 0,
    bestScore,
    mode,
    skin,
    clockTimer: null,
    spawnTimer: null,
    targets: new Map(),
    pauseReason: '',
    comboFxTimer: null,
    boardFxTimer: null,
    stats: {
      bonusHits: 0,
      normalHits: 0,
      trapHits: 0,
      maxCombo: 0,
    },
  };

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

  function getMultiplier(combo) {
    if (combo >= 18) return 3;
    if (combo >= 10) return 2;
    return 1;
  }

  function pickTargetType(secondsLeft) {
    const elapsed = state.mode.time - secondsLeft;
    const roll = Math.random();
    const bonusBias = state.mode.bonusBias || 0;

    if (elapsed < 10) {
      if (roll < 0.78) return 'normal';
      if (roll < 0.94 + bonusBias) return 'bonus';
      return 'trap';
    }

    if (elapsed < 20) {
      if (roll < 0.68) return 'normal';
      if (roll < 0.88 + bonusBias) return 'bonus';
      return 'trap';
    }

    if (roll < 0.58) return 'normal';
    if (roll < 0.82 + bonusBias) return 'bonus';
    return 'trap';
  }

  function getSpawnInterval(secondsLeft) {
    const elapsed = state.mode.time - secondsLeft;
    if (elapsed < 10) return state.mode.spawnStart;
    if (elapsed < 20) return state.mode.spawnMid;
    return state.mode.spawnEnd;
  }

  function getLifetime(secondsLeft) {
    const elapsed = state.mode.time - secondsLeft;
    if (elapsed < 10) return 900;
    if (elapsed < 20) return 700;
    return 480;
  }

  function refreshHUD() {
    updateHUD(ui, state, getMultiplier);
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

  function resetForPlay() {
    clearTimers();
    clearVisuals(ui, state);
    state.phase = 'playing';
    state.secondsLeft = state.mode.time;
    state.score = 0;
    state.combo = 0;
    state.pauseReason = '';
    state.stats = { bonusHits: 0, normalHits: 0, trapHits: 0, maxCombo: 0 };
    hideOverlay(ui.readyOverlay);
    hideOverlay(ui.pauseOverlay);
    hideOverlay(ui.resultOverlay);
    refreshHUD();
  }

  function startClock() {
    state.clockTimer = window.setInterval(() => {
      state.secondsLeft -= 1;

      if (state.secondsLeft <= 0) {
        state.secondsLeft = 0;
        refreshHUD();
        endGame();
        return;
      }

      refreshHUD();
    }, 1000);
  }

  function removeTarget(id) {
    const target = state.targets.get(id);
    if (!target) return;

    clearTimeout(target.expireTimer);
    target.el.classList.remove('show');
    window.setTimeout(() => {
      if (target.el.parentNode) {
        target.el.remove();
      }
    }, 120);
    state.targets.delete(id);
  }

  function hitTarget(id, x, y) {
    if (state.phase !== 'playing') return;
    const target = state.targets.get(id);
    if (!target) return;

    const meta = targetTypes[target.type];
    removeTarget(id);
    hitFeedback(target.type);

    let gain = meta.points;

    if (target.type === 'trap') {
      state.stats.trapHits += 1;
      triggerBoardImpact(ui, state, 'trap');
      if (state.combo >= 5) {
        spawnComboBreak(ui, x, y);
      }
      if (state.mode.trapPenaltyTime) {
        state.secondsLeft = Math.max(0, state.secondsLeft - state.mode.trapPenaltyTime);
      }
      state.combo = 0;
      state.score = Math.max(0, state.score + meta.points);
    } else {
      if (target.type === 'bonus') {
        state.stats.bonusHits += 1;
      } else {
        state.stats.normalHits += 1;
      }
      state.combo += 1;
      state.stats.maxCombo = Math.max(state.stats.maxCombo, state.combo);
      gain = meta.points * getMultiplier(state.combo);
      state.score += gain;
      triggerBoardImpact(ui, state, target.type);
    }

    spawnPopup(ui, x, y, meta.emoji, gain);
    spawnParticles(ui, x, y, meta.color, target.type === 'trap' ? 16 : 24, state.skin);
    spawnBurstRing(ui, x, y, meta.color, target.type === 'trap', state.skin);

    if (target.type !== 'trap') {
      maybeShowComboEffect(ui, state, x, y);
    }

    refreshHUD();
  }

  function handleTargetInteraction(event) {
    const targetEl = event.target.closest('.target');
    if (!targetEl || !ui.targetsLayer.contains(targetEl)) return;

    const id = targetEl.dataset.targetId;
    if (!id) return;

    const target = state.targets.get(id);
    if (!target) return;

    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();

    const rect = target.el.getBoundingClientRect();
    const x = rect.left - ui.board.getBoundingClientRect().left + rect.width / 2;
    const y = rect.top - ui.board.getBoundingClientRect().top + rect.height / 2;
    hitTarget(id, x, y);
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
    target.className = `target ${type} ${state.skin?.faceClass || ''}`;
    target.dataset.targetId = id;
    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
    target.innerHTML = `
      <span class="face">
        <span class="face-shine"></span>
        <span class="emoji">${meta.emoji}</span>
        <span class="tlabel">${meta.label}</span>
      </span>
    `;

    ui.targetsLayer.appendChild(target);
    window.requestAnimationFrame(() => target.classList.add('show'));

    const expireTimer = window.setTimeout(() => {
      if (!state.targets.has(id) || state.phase !== 'playing') return;
      removeTarget(id);
      state.combo = 0;
      refreshHUD();
    }, life);

    state.targets.set(id, { id, type, el: target, expireTimer });
  }

  function scheduleSpawn(delay) {
    clearTimeout(state.spawnTimer);
    state.spawnTimer = window.setTimeout(() => {
      if (state.phase !== 'playing') return;
      spawnTarget();
      scheduleSpawn(getSpawnInterval(state.secondsLeft));
    }, delay);
  }

  function startGame() {
    resetForPlay();
    startClock();
    scheduleSpawn(120);
  }

  function prepareRound(nextMode, nextBestScore = state.bestScore) {
    state.mode = nextMode;
    state.bestScore = nextBestScore;
    state.secondsLeft = nextMode.time;
    state.phase = 'ready';
    clearVisuals(ui, state);
    refreshHUD();
  }

  function pauseGame(reason) {
    if (state.phase !== 'playing') return;
    clearTimers();
    state.phase = 'paused';
    state.pauseReason = reason;
    ui.pauseTitle.textContent = '잠깐 멈췄어';
    ui.pauseDesc.textContent = reason;
    showOverlay(ui.pauseOverlay);
    refreshHUD();
  }

  function resumeGame() {
    if (state.phase !== 'paused') return;
    state.phase = 'playing';
    hideOverlay(ui.pauseOverlay);
    refreshHUD();
    startClock();
    scheduleSpawn(180);
  }

  function endGame() {
    clearTimers();
    state.phase = 'result';
    clearVisuals(ui, state);

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      onSaveBestScore(state.bestScore);
    }

    const coinsEarned = Math.max(5, Math.round((state.score / 5) * state.mode.coinMultiplier));
    const roundResult = {
      score: state.score,
      modeId: state.mode.id,
      bestScore: state.bestScore,
      coinsEarned,
      bonusHits: state.stats.bonusHits,
      normalHits: state.stats.normalHits,
      trapHits: state.stats.trapHits,
      maxCombo: state.stats.maxCombo,
    };

    ui.resultScore.textContent = `${state.score}점`;
    ui.resultRank.textContent = `등급: ${getRank(state.score)}`;
    ui.resultComment.textContent = makeComment(state.score);
    ui.resultBest.textContent = `${state.bestScore}점`;
    ui.rewardLine.textContent = `이번 라운드 보상: +${coinsEarned} 코인 · 최고 콤보 ${state.stats.maxCombo}`;

    showOverlay(ui.resultOverlay);
    onRoundEnd(roundResult);
    adsController.onResult(roundResult);
    refreshHUD();
  }

  function bind() {
    ui.resumeBtn.addEventListener('click', resumeGame);
    ui.restartBtn.addEventListener('click', startGame);
    ui.shareBtn.addEventListener('click', () => onShare(state.score, makeComment(state.score)));
    ui.targetsLayer.addEventListener('pointerdown', handleTargetInteraction, { passive: false });
    ui.targetsLayer.addEventListener('touchstart', handleTargetInteraction, { passive: false });
    ui.targetsLayer.addEventListener('mousedown', handleTargetInteraction, { passive: false });
    ui.targetsLayer.addEventListener('click', handleTargetInteraction, { passive: false });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.phase === 'playing') {
        pauseGame('다른 화면으로 전환돼서 자동으로 멈췄어. 돌아오면 이어서 할 수 있다.');
      }
    });
  }

  function init() {
    bind();
    refreshHUD();
    adsController.init();
  }

  return {
    init,
    prepareRound,
    setSkin(nextSkin) {
      state.skin = nextSkin;
    },
    startGame,
    pauseGame,
  };
}
