import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import './styles/base.css';
import './styles/game.css';
import { appConfig } from './config/appConfig.js';
import { STORAGE_KEY } from './config/gameConfig.js';
import { gameModes, skinCatalog } from './config/metaConfig.js';
import { createGameEngine } from './core/gameEngine.js';
import {
  applyRunToMeta,
  claimMissionReward,
  getClaimableMissionCount,
  getCompletedMissionCount,
  loadMetaState,
  purchaseSkin,
  saveMetaState,
  selectSkin,
} from './meta/metaState.js';
import { maybeShowInterstitial, safeInitAds, syncAdVisibility } from './platform/ads.js';
import { pulseHit } from './platform/haptics.js';
import { shareScore } from './platform/share.js';
import { loadNumber, saveNumber } from './platform/storage.js';
import { getUI } from './ui/dom.js';

const ui = getUI();
let metaState = null;
let bestScore = 0;
const ADS_UNLOCK_RUNS = 3;

function areAdsUnlocked() {
  return (metaState.totalRuns || 0) >= ADS_UNLOCK_RUNS;
}

function renderMeta() {
  document.body.dataset.skin = metaState.selectedSkin;
  ui.coinValue.textContent = String(metaState.coins);
  const done = getCompletedMissionCount(metaState);
  const claimable = getClaimableMissionCount(metaState);
  ui.missionProgressText.textContent = `${done} / ${metaState.missions.length}`;
  ui.missionSummary.textContent = claimable > 0
    ? `${done} / ${metaState.missions.length} 완료 · ${claimable}개 수령 가능`
    : `${done} / ${metaState.missions.length} 완료`;

  ui.missionList.innerHTML = metaState.missions.map((mission) => {
    const ratio = Math.min(100, Math.round((mission.progress / mission.target) * 100));
    const buttonLabel = mission.claimed ? '수령 완료' : mission.completed ? `+${mission.reward} 코인 받기` : '진행 중';
    return `
      <div class="mission-item ${mission.completed ? 'done' : ''}">
        <div class="mission-row">
          <span>${mission.label}</span>
          <strong>${Math.min(mission.progress, mission.target)} / ${mission.target}</strong>
        </div>
        <div class="mission-progress">
          <div class="mission-progress-bar" style="width:${ratio}%"></div>
        </div>
        <button
          class="mission-claim-btn"
          type="button"
          data-claim-mission="${mission.id}"
          ${mission.completed && !mission.claimed ? '' : 'disabled'}
        >${buttonLabel}</button>
      </div>
    `;
  }).join('');

  ui.skinList.innerHTML = Object.values(skinCatalog).map((skin) => {
    const owned = metaState.ownedSkins.includes(skin.id);
    const equipped = metaState.selectedSkin === skin.id;
    const label = equipped ? '장착 중' : owned ? '장착하기' : `${skin.price} 코인`;
    const action = owned ? 'equip' : 'buy';
    return `
      <div class="skin-item ${equipped ? 'equipped' : ''}">
        <div class="skin-preview" style="--skin-accent:${skin.accent}"></div>
        <div class="skin-copy">
          <div class="mission-row">
            <span>${skin.name}</span>
            <strong>${skin.copy}</strong>
          </div>
        </div>
        <button
          class="skin-action-btn"
          type="button"
          data-skin-action="${action}"
          data-skin-id="${skin.id}"
          ${equipped ? 'disabled' : (!owned && metaState.coins < skin.price ? 'disabled' : '')}
        >${label}</button>
      </div>
    `;
  }).join('');
}

function renderModeSelection() {
  const mode = gameModes[metaState.selectedMode];
  ui.homeModeDesc.textContent = mode.description;
  for (const button of ui.modeList.querySelectorAll('[data-mode]')) {
    button.classList.toggle('active', button.dataset.mode === metaState.selectedMode);
  }
}

async function persistMeta() {
  await saveMetaState(metaState);
  renderMeta();
  renderModeSelection();
  syncAdVisibility(areAdsUnlocked());
}

async function handleRoundEnd(result) {
  metaState = applyRunToMeta(metaState, result);
  await persistMeta();
}

function bindHomeControls() {
  ui.modeList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    metaState.selectedMode = button.dataset.mode;
    await persistMeta();
  });

  ui.missionList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-claim-mission]');
    if (!button) return;
    metaState = claimMissionReward(metaState, button.dataset.claimMission);
    await persistMeta();
  });

  ui.skinList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-skin-id]');
    if (!button) return;
    const { skinId, skinAction } = button.dataset;
    metaState = skinAction === 'buy'
      ? purchaseSkin(metaState, skinId)
      : selectSkin(metaState, skinId);
    await persistMeta();
  });
}

async function bootstrap() {
  metaState = await loadMetaState();
  bestScore = await loadNumber(STORAGE_KEY, 0);
  renderMeta();
  renderModeSelection();
  syncAdVisibility(areAdsUnlocked());
  bindHomeControls();

  const game = createGameEngine({
    ui,
    bestScore,
    mode: gameModes[metaState.selectedMode],
    skin: skinCatalog[metaState.selectedSkin],
    onSaveBestScore: async (value) => {
      bestScore = value;
      await saveNumber(STORAGE_KEY, value);
    },
    onShare: shareScore,
    adsController: {
      init: () => safeInitAds(appConfig, areAdsUnlocked()),
      onResult: async () => {
        const unlocked = areAdsUnlocked();
        await safeInitAds(appConfig, unlocked);
        const shouldShowInterstitial = unlocked && metaState.totalRuns % 2 === 1;
        await maybeShowInterstitial(appConfig, shouldShowInterstitial);
      },
    },
    hitFeedback: pulseHit,
    onRoundEnd: handleRoundEnd,
  });

  ui.startBtn.addEventListener('click', () => {
    game.setSkin(skinCatalog[metaState.selectedSkin]);
    game.prepareRound(gameModes[metaState.selectedMode], bestScore);
    game.startGame();
  });

  game.init();
  game.prepareRound(gameModes[metaState.selectedMode], bestScore);

  if (Capacitor.isNativePlatform()) {
    await App.addListener('pause', () => {
      game.pauseGame('앱이 백그라운드로 전환돼서 자동으로 멈췄어. 돌아오면 이어서 할 수 있다.');
    });
  }
}

bootstrap();
