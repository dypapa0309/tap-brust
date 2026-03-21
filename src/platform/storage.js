import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export async function loadNumber(key, fallback = 0) {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return Number(value ?? fallback);
    }

    return Number(window.localStorage.getItem(key) || fallback);
  } catch (err) {
    console.warn(`Storage read skipped for ${key}:`, err);
    return fallback;
  }
}

export async function saveNumber(key, value) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value: String(value) });
      return;
    }

    window.localStorage.setItem(key, String(value));
  } catch (err) {
    console.warn(`Storage write skipped for ${key}:`, err);
  }
}

export async function loadJSON(key, fallback) {
  try {
    const raw = await (Capacitor.isNativePlatform()
      ? Preferences.get({ key }).then((res) => res.value)
      : Promise.resolve(window.localStorage.getItem(key)));

    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Storage JSON read skipped for ${key}:`, err);
    return fallback;
  }
}

export async function saveJSON(key, value) {
  const raw = JSON.stringify(value);

  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value: raw });
      return;
    }

    window.localStorage.setItem(key, raw);
  } catch (err) {
    console.warn(`Storage JSON write skipped for ${key}:`, err);
  }
}
