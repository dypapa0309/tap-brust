export const META_STORAGE_KEY = 'tap-burst-meta-v1';

export const gameModes = {
  classic: {
    id: 'classic',
    name: '클래식',
    description: '30초 동안 가장 표준적인 규칙으로 몰아치는 기본 모드.',
    time: 30,
    spawnStart: 720,
    spawnMid: 520,
    spawnEnd: 340,
    bonusBias: 0,
    trapPenaltyTime: 0,
    coinMultiplier: 1,
  },
  survival: {
    id: 'survival',
    name: '서바이벌',
    description: '35초로 시작하지만 폭탄을 누를 때마다 시간이 깎이는 압박 모드.',
    time: 35,
    spawnStart: 700,
    spawnMid: 470,
    spawnEnd: 300,
    bonusBias: -0.02,
    trapPenaltyTime: 2,
    coinMultiplier: 1.3,
  },
  fever: {
    id: 'fever',
    name: '피버',
    description: '보너스가 더 자주 나오고 점수와 코인 수급이 빠른 고위험 고보상 모드.',
    time: 28,
    spawnStart: 620,
    spawnMid: 430,
    spawnEnd: 250,
    bonusBias: 0.12,
    trapPenaltyTime: 0,
    coinMultiplier: 1.6,
  },
};

export const skinCatalog = {
  default: {
    id: 'default',
    name: '네온 버스트',
    price: 0,
    accent: '#67d0ff',
    copy: '기본 네온 아레나',
    faceClass: 'skin-default',
    particleShape: 'orb',
    aura: 'rgba(103,208,255,.24)',
  },
  sunset: {
    id: 'sunset',
    name: '선셋 펀치',
    price: 120,
    accent: '#ff9b6a',
    copy: '주황-로즈 톤 하이텐션',
    faceClass: 'skin-sunset',
    particleShape: 'diamond',
    aura: 'rgba(255,155,106,.26)',
  },
  mint: {
    id: 'mint',
    name: '민트 글로우',
    price: 180,
    accent: '#63f5c8',
    copy: '시원한 민트 아케이드',
    faceClass: 'skin-mint',
    particleShape: 'spark',
    aura: 'rgba(99,245,200,.24)',
  },
  mono: {
    id: 'mono',
    name: '모노 스톰',
    price: 260,
    accent: '#d8dde6',
    copy: '차갑고 묵직한 실버 룩',
    faceClass: 'skin-mono',
    particleShape: 'shard',
    aura: 'rgba(216,221,230,.24)',
  },
};

export function createDailyMissionBlueprints() {
  return [
    {
      id: 'score_60',
      label: '한 판에서 60점 달성',
      type: 'score',
      target: 60,
      reward: 40,
    },
    {
      id: 'bonus_12',
      label: '보너스 타겟 12개 터뜨리기',
      type: 'bonus',
      target: 12,
      reward: 35,
    },
    {
      id: 'play_3',
      label: '3판 플레이하기',
      type: 'plays',
      target: 3,
      reward: 25,
    },
  ];
}
