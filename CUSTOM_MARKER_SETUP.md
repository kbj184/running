# 🗺️ 커스텀 마커 이미지 설정 가이드

## 📋 개요

정적 맵과 실제 인터랙티브 맵의 마커 디자인을 일관되게 유지하기 위해 커스텀 마커 이미지를 사용합니다.

---

## 📤 1단계: Cloudinary에 마커 이미지 업로드

### 필요한 이미지 파일

생성된 4개의 마커 이미지를 Cloudinary에 업로드해야 합니다:

1. **start_marker.png** - 초록색 원형 마커 (S)
2. **goal_marker.png** - 빨간색 원형 마커 (G)
3. **water_marker.png** - 파란색 원형 마커 (W)
4. **km_marker.png** - 흰색 배경 보라색 테두리 (1km)

### 업로드 방법

1. **Cloudinary 대시보드 접속**
   - URL: https://cloudinary.com/console
   - 계정: `dpqcyw2wh`

2. **Media Library 이동**
   - 왼쪽 메뉴에서 "Media Library" 클릭

3. **폴더 생성**
   - "Create folder" 클릭
   - 폴더명: `markers`

4. **이미지 업로드**
   - `markers` 폴더 선택
   - "Upload" 버튼 클릭
   - 4개 이미지 파일 선택하여 업로드

5. **Public ID 확인**
   - 각 이미지 클릭 후 Public ID 확인
   - 예상 Public ID:
     - `markers/start_marker`
     - `markers/goal_marker`
     - `markers/water_marker`
     - `markers/km_marker`

---

## 🔗 2단계: URL 확인

업로드 후 각 이미지의 URL은 다음과 같아야 합니다:

```
https://res.cloudinary.com/dpqcyw2wh/image/upload/markers/start_marker.png
https://res.cloudinary.com/dpqcyw2wh/image/upload/markers/goal_marker.png
https://res.cloudinary.com/dpqcyw2wh/image/upload/markers/water_marker.png
https://res.cloudinary.com/dpqcyw2wh/image/upload/markers/km_marker.png
```

### URL 테스트

브라우저에서 각 URL을 열어 이미지가 제대로 표시되는지 확인하세요.

---

## ⚙️ 3단계: 코드 확인

`src/utils/mapThumbnail.js` 파일에 이미 설정되어 있습니다:

```javascript
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dpqcyw2wh/image/upload';
const MARKER_ICONS = {
    start: `${CLOUDINARY_BASE}/markers/start_marker.png`,
    goal: `${CLOUDINARY_BASE}/markers/goal_marker.png`,
    water: `${CLOUDINARY_BASE}/markers/water_marker.png`,
    km: `${CLOUDINARY_BASE}/markers/km_marker.png`
};
```

---

## 🎨 마커 사양

### Start 마커 (S)
- **크기**: 64x64px
- **색상**: #22c55e (초록)
- **테두리**: 6px 흰색
- **라벨**: S (흰색, 굵게)
- **Static Map scale**: 0.5 (32px로 축소)

### Goal 마커 (G)
- **크기**: 64x64px
- **색상**: #ef4444 (빨강)
- **테두리**: 6px 흰색
- **라벨**: G (흰색, 굵게)
- **Static Map scale**: 0.5 (32px로 축소)

### Water 마커 (W)
- **크기**: 56x56px
- **색상**: #3b82f6 (파랑)
- **테두리**: 6px 흰색
- **라벨**: W (흰색, 굵게)
- **Static Map scale**: 0.44 (약 25px로 축소)

### Km 마커
- **크기**: 64x36px
- **배경**: 흰색
- **테두리**: 3px #4318FF (보라)
- **라벨**: 1km (보라색, 굵게)
- **참고**: 현재는 기본 마커 사용 (숫자가 동적이므로)

---

## 🔍 문제 해결

### 이미지가 표시되지 않는 경우

1. **URL 확인**
   - 브라우저에서 직접 URL 접속
   - 404 에러 시 Public ID 확인

2. **CORS 설정**
   - Cloudinary는 기본적으로 CORS 허용
   - 문제 시 Cloudinary 설정에서 확인

3. **캐시 문제**
   - 브라우저 캐시 삭제
   - 시크릿 모드에서 테스트

### 마커 크기 조정

`mapThumbnail.js`에서 `scale` 값 수정:

```javascript
// 더 크게
params.append('markers', `icon:${...}|scale:0.7|${...}`);

// 더 작게
params.append('markers', `icon:${...}|scale:0.3|${...}`);
```

---

## ✅ 완료 확인

1. Cloudinary에 4개 이미지 업로드 완료
2. 각 URL 브라우저에서 접속 가능
3. 앱 실행 후 런닝 상세 화면에서 정적 맵 확인
4. 커스텀 마커가 표시되는지 확인

---

## 📝 참고

- **정적 맵**: Google Static Maps API 사용 (커스텀 이미지)
- **실제 맵**: AdvancedMarker 사용 (HTML/CSS)
- **km 마커**: 동적 텍스트로 인해 기본 마커 사용 (tiny 크기)

---

**작성일**: 2026-01-01  
**작성자**: Antigravity AI Assistant
