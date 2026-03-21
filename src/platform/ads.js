import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

let webAdsInitialized = false;
let nativeBannerShown = false;

export function syncAdVisibility(enabled) {
  document.querySelectorAll('.ad-wrap').forEach((el) => {
    el.classList.toggle('ad-hidden', !enabled);
  });
}

export async function safeInitAds(config, enabled) {
  syncAdVisibility(enabled);

  if (!enabled) return;

  if (Capacitor.isNativePlatform()) {
    if (!config.adsEnabled) return;
    if (nativeBannerShown) return;

    try {
      await AdMob.initialize({
        initializeForTesting: config.admob.testing,
      });

      await AdMob.showBanner({
        adId: config.admob.bannerId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: config.admob.testing,
      });
      nativeBannerShown = true;
    } catch (err) {
      console.warn('Native AdMob init skipped:', err);
    }

    return;
  }

  const slots = document.querySelectorAll('.adsbygoogle');
  if (!slots.length || webAdsInitialized) return;

  try {
    slots.forEach(() => {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
    webAdsInitialized = true;
  } catch (err) {
    console.warn('Web ads init skipped:', err);
  }
}

export async function maybeShowInterstitial(config, shouldShow) {
  if (!shouldShow || !Capacitor.isNativePlatform() || !config.adsEnabled) return;

  try {
    await AdMob.prepareInterstitial({
      adId: config.admob.interstitialId,
      isTesting: config.admob.testing,
    });
    await AdMob.showInterstitial();
  } catch (err) {
    console.warn('Interstitial skipped:', err);
  }
}
