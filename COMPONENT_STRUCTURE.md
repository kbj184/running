# 러닝 맵 애플리케이션

React 기반의 실시간 러닝 트래킹 및 맵 시각화 애플리케이션입니다.

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── common/              # 공통 컴포넌트
│   │   ├── Header.jsx       # 앱 헤더 (통계 표시)
│   │   └── StartButton.jsx  # 러닝 시작 버튼
│   │
│   ├── map/                 # 맵 관련 컴포넌트
│   │   ├── MapView.jsx      # 메인 맵 컨테이너
│   │   ├── MapController.jsx # 맵 제어 (줌, 이동)
│   │   ├── RunnerMarkers.jsx # 러너 마커 및 경로 표시
│   │   ├── LegendPanel.jsx  # 범례 패널
│   │   └── ControlPanel.jsx # 컨트롤 패널 (새로고침 등)
│   │
│   ├── runner/              # 러너 관련 컴포넌트
│   │   └── RunnerDetailPanel.jsx # 러너 상세 정보 패널
│   │
│   ├── RunningScreen.jsx    # 러닝 진행 화면
│   └── ResultScreen.jsx     # 러닝 결과 화면
│
├── constants/
│   └── runnerGrades.js      # 러너 등급 상수 정의
│
├── utils/
│   ├── db.js                # IndexedDB 관련 유틸리티
│   ├── gps.js               # GPS 관련 유틸리티
│   └── runnerUtils.js       # 러너 생성 및 경로 생성 유틸리티
│
├── App.jsx                  # 메인 앱 컴포넌트
├── main.jsx                 # 앱 진입점
├── running-styles.css       # 스타일시트
└── index.css                # 글로벌 스타일
```

## 🎯 주요 기능

### 1. 맵 페이지 (Map Page)
- **Header**: 전체 러너, 프로 러너, 엘리트 통계 표시
- **MapView**: 
  - 실시간 러너 위치 표시
  - 러너 클릭 시 상세 정보 및 경로 표시
  - 등급별 색상 구분
- **LegendPanel**: 러너 등급별 범례 및 카운트
- **ControlPanel**: 데이터 새로고침 기능
- **StartButton**: 러닝 시작 버튼

### 2. 러닝 화면 (Running Screen)
- GPS 기반 실시간 위치 추적
- 거리, 속도, 시간 측정
- 2초마다 IndexedDB에 데이터 저장

### 3. 결과 화면 (Result Screen)
- 러닝 완료 후 통계 표시
- 경로 시각화
- 데이터 저장 및 공유 기능

## 🏗️ 컴포넌트 분리 원칙

### 영역별 분리
- **common/**: 여러 페이지에서 재사용되는 공통 컴포넌트
- **map/**: 맵 기능과 관련된 모든 컴포넌트
- **runner/**: 러너 정보 표시 관련 컴포넌트

### 책임 분리
- **Presentational Components**: UI 렌더링만 담당 (Header, StartButton, LegendPanel 등)
- **Container Components**: 상태 관리 및 비즈니스 로직 (App.jsx, MapView.jsx)
- **Utility Functions**: 재사용 가능한 로직 (runnerUtils.js, gps.js, db.js)
- **Constants**: 상수 정의 (runnerGrades.js)

## 🚀 실행 방법

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 📦 주요 의존성

- React
- React Leaflet (맵 라이브러리)
- Vite (빌드 도구)

## 🎨 러너 등급

| 등급 | 거리 | 색상 |
|------|------|------|
| 초급 | 0-5km | 초록색 |
| 중급 | 5-10km | 파란색 |
| 고급 | 10-20km | 보라색 |
| 엘리트 | 20-30km | 주황색 |
| 프로 | 30km+ | 빨간색 |
