import { createDailyMissionBlueprints, META_STORAGE_KEY, skinCatalog } from '../config/metaConfig.js';
import { loadJSON, saveJSON } from '../platform/storage.js';

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function createFreshMeta() {
  const today = getTodayKey();
  const missions = createDailyMissionBlueprints().map((mission) => ({
    ...mission,
    progress: 0,
    completed: false,
    claimed: false,
  }));

  return {
    coins: 0,
    totalRuns: 0,
    selectedMode: 'classic',
    selectedSkin: 'default',
    ownedSkins: ['default'],
    lastMissionDate: today,
    missions,
  };
}

export async function loadMetaState() {
  const loaded = await loadJSON(META_STORAGE_KEY, null);
  const fresh = createFreshMeta();

  if (!loaded) return fresh;

  if (loaded.lastMissionDate !== fresh.lastMissionDate) {
    return {
      ...loaded,
      lastMissionDate: fresh.lastMissionDate,
      missions: fresh.missions,
    };
  }

  return {
    ...fresh,
    ...loaded,
  };
}

export async function saveMetaState(meta) {
  await saveJSON(META_STORAGE_KEY, meta);
}

export function getCompletedMissionCount(meta) {
  return meta.missions.filter((mission) => mission.completed).length;
}

export function getClaimableMissionCount(meta) {
  return meta.missions.filter((mission) => mission.completed && !mission.claimed).length;
}

export function applyRunToMeta(meta, result) {
  const next = {
    ...meta,
    totalRuns: (meta.totalRuns || 0) + 1,
    coins: meta.coins + result.coinsEarned,
    missions: meta.missions.map((mission) => ({ ...mission })),
  };

  for (const mission of next.missions) {
    if (mission.type === 'score') {
      mission.progress = Math.max(mission.progress, result.score);
    }
    if (mission.type === 'bonus') {
      mission.progress = Math.min(mission.target, mission.progress + result.bonusHits);
    }
    if (mission.type === 'plays') {
      mission.progress = Math.min(mission.target, mission.progress + 1);
    }

    mission.completed = mission.progress >= mission.target;
  }

  return next;
}

export function claimMissionReward(meta, missionId) {
  const next = {
    ...meta,
    missions: meta.missions.map((mission) => ({ ...mission })),
  };
  const mission = next.missions.find((item) => item.id === missionId);
  if (!mission || !mission.completed || mission.claimed) return next;
  mission.claimed = true;
  next.coins += mission.reward;
  return next;
}

export function purchaseSkin(meta, skinId) {
  const skin = skinCatalog[skinId];
  if (!skin || meta.ownedSkins.includes(skinId) || meta.coins < skin.price) {
    return meta;
  }

  return {
    ...meta,
    coins: meta.coins - skin.price,
    ownedSkins: [...meta.ownedSkins, skinId],
    selectedSkin: skinId,
  };
}

export function selectSkin(meta, skinId) {
  if (!meta.ownedSkins.includes(skinId)) return meta;
  return {
    ...meta,
    selectedSkin: skinId,
  };
}
