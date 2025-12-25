# Running App - 러닝 트래킹 애플리케이션

실시간 GPS 트래킹, 크루 관리, 소셜 로그인을 지원하는 러닝 애플리케이션입니다.

## 프로젝트 구조

```
running/
├── src/                    # React 프론트엔드
│   ├── components/        # React 컴포넌트
│   ├── utils/            # 유틸리티 함수
│   └── App.jsx           # 메인 앱
├── backend/               # Spring Boot 백엔드 (별도 저장소)
│   └── src/              # Java 소스 코드
├── public/               # 정적 파일
└── package.json          # 프론트엔드 의존성
```

## 기술 스택

### 프론트엔드
- **React** - UI 프레임워크
- **Vite** - 빌드 도구
- **Google Maps API** - 지도 및 GPS 트래킹
- **IndexedDB** - 로컬 데이터 저장

### 백엔드
- **Spring Boot 3.4.12** - 백엔드 프레임워크
- **Spring Security** - 인증/인가
- **OAuth2** - 소셜 로그인 (Naver, Google)
- **JWT** - 토큰 기반 인증
- **JPA/Hibernate** - ORM
- **MariaDB** - 데이터베이스
- **Gradle** - 빌드 도구

## 시작하기

### 프론트엔드 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 `https://localhost:3000`에서 실행됩니다.

### 백엔드 실행

```bash
# backend 디렉토리로 이동
cd backend

# Spring Boot 실행
./gradlew.bat bootRun
```

백엔드는 `https://localhost:8443`에서 실행됩니다.

## 주요 기능

### 🏃 러닝 트래킹
- 실시간 GPS 위치 추적
- 거리, 속도, 페이스 측정
- 수분 보충 구간 자동 감지
- 러닝 기록 저장 및 조회

### 👥 크루 관리
- 크루 생성 및 관리
- 크루원 초대 및 관리
- 크루 활동 기록

### 🔐 인증/인가
- 이메일 기반 로컬 로그인
- 소셜 로그인 (Naver, Google)
- JWT 기반 토큰 인증
- 자동 토큰 갱신

### 📊 러너 등급 시스템
- Beginner (초보)
- Intermediate (중급)
- Advanced (상급)
- Pro (프로)
- Elite (엘리트)

## 환경 변수 설정

### 프론트엔드 (.env)
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 백엔드 (application.properties)
백엔드 저장소의 설정 파일을 참조하세요.

## 개발 가이드

### 컴포넌트 구조
자세한 컴포넌트 구조는 [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md)를 참조하세요.

### 데이터베이스 로깅
데이터베이스 쿼리 로깅 설정은 [DB_LOG_GUIDE.md](./DB_LOG_GUIDE.md)를 참조하세요.

### 테스트 모드
테스트 모드 사용법은 [TEST_MODE_GUIDE.md](./TEST_MODE_GUIDE.md)를 참조하세요.

## 버전 히스토리

### v0.2 (2025-12-24)
- 로그인 화면 추가
- 백엔드 설정 파일 추가
- Spring Boot 프로젝트 통합

### v0.1
- 초기 프로젝트 설정
- 기본 러닝 트래킹 기능
- GPS 및 지도 통합

## 라이선스

MIT License

## 기여하기

이슈와 PR은 언제나 환영합니다!

## 연락처

GitHub: [@kbj184](https://github.com/kbj184)
