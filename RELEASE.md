# Android Release

## 1. 환경값 정리
- `.env.example`를 복사해 `.env` 생성
- `VITE_NATIVE_ADS_ENABLED=true`로 변경
- `VITE_ADMOB_*` 값을 실제 AdMob 값으로 교체
- `android/app/src/main/res/values/strings.xml`의 `admob_app_id`도 실제 App ID로 교체

## 2. 버전 올리기
- `android/app/build.gradle`은 `APP_VERSION_CODE`, `APP_VERSION_NAME` Gradle property를 읽는다
- 예시:

```bash
cd android
./gradlew bundleRelease -PAPP_VERSION_CODE=2 -PAPP_VERSION_NAME=1.0.1
```

## 3. 서명 키 준비
- `android/keystore.properties.example`를 `android/keystore.properties`로 복사
- 실제 keystore 파일을 `android/` 아래에 둔다
- `storeFile`, `storePassword`, `keyAlias`, `keyPassword`를 실제 값으로 채운다

## 4. 앱 번들 생성
- 루트에서 웹 번들 반영:

```bash
npm run build
npm run cap:sync
```

- 루트에서 Android AAB 생성:

```bash
npm run android:bundle
```

- APK가 필요하면:

```bash
npm run android:apk
```

## 5. 업로드 전 체크
- 패키지명: `com.tapburst.game`
- 앱 이름: `Tap Burst`
- 아이콘/스플래시 생성 여부 확인
- 테스트 광고 ID 제거 여부 확인
- 실제 기기에서 배너/전면 광고 노출 확인
- 공유 기능 확인
- 백그라운드 복귀 시 일시정지 동작 확인
- 최고기록 저장 확인

## 6. 출력 위치
- AAB: `android/app/build/outputs/bundle/release/`
- APK: `android/app/build/outputs/apk/release/`
