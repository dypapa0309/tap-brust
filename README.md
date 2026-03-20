# 30초 광클 챌린지 - HTML/CSS/JS 배포형

## 파일 구성
- `index.html`
- `style.css`
- `app.js`

## 실행 방법
### 1) 로컬에서 바로 보기
파일 압축 해제 후 `index.html` 더블클릭

### 2) GitHub Pages / Netlify / Vercel 정적 배포
압축 해제 후 파일 3개를 그대로 업로드하면 됨.

## 광고 넣는 위치
현재 광고 자리 UI가 들어간 곳:
- 상단 광고: `.ad-slot-top`
- 결과창 광고: `.ad-slot-result`
- 하단 광고: `.ad-slot-bottom`

여기에 애드센스 코드로 교체하면 됨.

## 애드센스 예시
`index.html`의 광고 슬롯 내부를 이런 식으로 바꾸면 됨.

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-xxxxxxxxxx"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

그리고 `</head>` 위에 애드센스 스크립트 추가:

```html
<script async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxx"
  crossorigin="anonymous"></script>
```

## 특징
- 모바일 터치 / PC 클릭 지원
- 최고기록 localStorage 저장
- 보너스 / 함정 / 콤보 배수
- 팡팡 파티클 이펙트
- 바로 배포 가능한 정적 구조
