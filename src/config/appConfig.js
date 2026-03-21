const env = import.meta.env;

function isTrue(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

export const appConfig = {
  appName: env.VITE_APP_NAME || 'Tap Burst',
  appId: env.VITE_APP_ID || 'com.tapburst.game',
  adsEnabled: isTrue(env.VITE_NATIVE_ADS_ENABLED, false),
  admob: {
    appId: env.VITE_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
    bannerId: env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
    interstitialId: env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',
    testing: isTrue(env.VITE_ADMOB_TESTING, true),
  },
};
