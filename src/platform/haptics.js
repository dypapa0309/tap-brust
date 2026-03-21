import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function pulseHit(type) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (type === 'trap') {
      await Haptics.notification({ type: NotificationType.Warning });
      return;
    }

    await Haptics.impact({
      style: type === 'bonus' ? ImpactStyle.Heavy : ImpactStyle.Light,
    });
  } catch (err) {
    console.warn('Haptics skipped:', err);
  }
}
