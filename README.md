# Tap Burst

`Vite + Capacitor` 기준으로 앱 배포를 준비한 구조다. 웹에서 먼저 개발하고 `dist`를 네이티브 셸로 감싸는 방식이다.

## 구조
- `index.html`: Vite 엔트리 HTML
- `src/main.js`: 앱 부트스트랩
- `src/core/`: 게임 상태, 점수, 스폰 흐름
- `src/ui/`: DOM 참조, HUD, 오버레이, 이펙트
- `src/platform/`: 저장소, 공유, 광고 초기화 같은 플랫폼 의존 코드
- `src/styles/`: 기본 스타일과 게임 스타일
- `resources/`: 앱 아이콘/스플래시 원본 SVG
- `capacitor.config.json`: 앱 셸 설정
- `.env.example`: 앱 이름, 패키지명, AdMob 예시 값

## 실행
1. `npm install`
2. `npm run dev`
3. 앱 빌드 시 `npm run build`

## Capacitor 연결
1. `npx cap add android`
2. macOS에서 iOS도 쓸 경우 `npx cap add ios`
3. 웹 번들 반영은 `npm run build`
4. 네이티브 프로젝트 동기화는 `npm run cap:sync`
5. Android Studio는 `npm run cap:android`
6. Xcode는 `npm run cap:ios`

## 앱 설정 바꾸는 곳
1. `.env.example`를 복사해 `.env` 생성
2. 앱 이름/패키지명/광고 ID는 `.env` 기준으로 관리
3. Android AdMob App ID는 `android/app/src/main/res/values/strings.xml`
4. Android 메타데이터는 `android/app/src/main/AndroidManifest.xml`
5. 아이콘과 스플래시는 `resources/`

## 아이콘/스플래시 생성
1. `npm install`
2. `cp .env.example .env`
3. `npm run assets:android`
4. iOS는 CocoaPods 설치 후 `npm run assets:ios`

## 릴리스 가이드
- Android 배포 순서는 `RELEASE.md` 참고

## 앱 전환 시 주의점
- 웹은 AdSense 슬롯, 네이티브는 AdMob 플러그인을 쓰도록 분리했다.
- 앱 저장은 Capacitor Preferences를 사용하고, 웹은 localStorage로 폴백한다.
- 앱 공유는 Capacitor Share를 사용하고, 웹은 Web Share/클립보드로 폴백한다.
- 앱에선 Haptics로 눌림 피드백이 들어간다.
- 실제 배포 전에는 `.env`와 Android `strings.xml`의 테스트 광고 ID를 실광고 ID로 바꿔야 한다.
- iOS는 CocoaPods가 설치돼야 `npx cap add ios`가 동작한다.

## 현재 특징
- 모바일 터치 / PC 클릭 지원
- 최고기록 저장
- 보너스 / 함정 / 콤보 배수
- 팡팡 파티클과 콤보 이펙트
- 화면 전환 시 자동 일시정지 후 이어하기
