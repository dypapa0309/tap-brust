import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export async function shareScore(score, comment) {
  const text = `나 방금 30초 광클 챌린지에서 ${score}점 찍음. ${comment} 너도 해봐.`;

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: '30초 광클 챌린지',
        text,
        url: window.location.href,
        dialogTitle: '기록 공유하기',
      });
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: '30초 광클 챌린지',
        text,
        url: window.location.href,
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      window.alert('공유 문구가 복사됐어.');
      return;
    }

    window.prompt('이 문구를 복사해줘.', `${text} ${window.location.href}`);
  } catch (err) {
    console.warn('Share skipped:', err);
  }
}
