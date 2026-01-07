# 📋 프로젝트 인수인계 문서 (Handover Guide)

> **작성일**: 2026-01-08  
> **프로젝트명**: Running Tracker Application (SecondWind)  
> **작성자**: Antigravity AI Assistant

이 문서는 프로젝트를 다음 개발자에게 인계하기 위해 현재 시스템의 상태, 환경 설정, 데이터베이스 구조, 그리고 최근 작업 내역을 정리한 것입니다.

---

## 1. 🏗️ 프로젝트 개요 및 환경

이 프로젝트는 **GPS 기반 러닝 트래킹 및 러닝 크루 커뮤니티** 웹 애플리케이션입니다.
프론트엔드와 백엔드가 분리된 구조를 가지고 있으며, 위치 기반 서비스(Google Maps)와 소셜 로그인, 실시간 데이터 저장이 핵심입니다.

### 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 | 버전/비고 |
|------|------|-----------|
| **Backend** | Spring Boot | 3.4.0 (Java 17, Gradle) |
| **Frontend** | React + Vite | React 18, Vite 5 |
| **Database** | MariaDB | JPA/Hibernate 사용 |
| **Infra** | AWS EC2 (Backend), Amplify (Frontend) | Nginx (Reverse Proxy) |
| **Auth** | OAuth2 (Naver, Google, Kakao) + JWT | Spring Security |
| **External APIs** | Google Maps (Map, Geocoding) | Cloudinary (Image Hosting), Firebase (FCM) |

---

## 2. ⚙️ 환경 설정 (Environment Setup)

### 2.1. 필수 설치 요소
- **Java JDK 17** 이상
- **Node.js** (LTS 버전 권장)
- **MariaDB** Server

### 2.2. 백엔드 설정 (`backend/`)
- **설정 파일**: `backend/src/main/resources/application.properties`
- **환경 변수**: 로컬 개발 시 `.env` 파일 또는 시스템 환경 변수로 관리해야 할 주요 키:
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (데이터베이스 연결)
  - `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` (네이버 로그인)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (구글 로그인)
  - `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` (카카오 로그인)
  - `JWT_SECRET` (토큰 서명 키)

**실행 방법**:
```bash
cd backend
./gradlew bootRun
# 접속: https://localhost:8443 (SSL 적용됨)
```

### 2.3. 프론트엔드 설정 (`root`)
- **설정 파일**: `vite.config.js`, `.env.development`
- **주요 환경 변수**:
  - `VITE_API_URL`: 백엔드 API 주소 (예: `https://localhost:8443`)
  - `VITE_GOOGLE_MAPS_API_KEY`: 구글 맵 API 키
  - `VITE_CLOUDINARY_CLOUD_NAME`: Cloudinary 클라우드명
  - `VITE_CLOUDINARY_UPLOAD_PRESET`: 이미지 업로드 프리셋

**실행 방법**:
```bash
npm install
npm run dev
# 접속: https://localhost:3000
```

---

## 3. 📂 프로젝트 구조 (Project Structure)

### 3.1. 백엔드 (`backend/src/main/java/com/secondwind/`)
- **`controller/`**: API 엔드포인트 (`RunningController`, `CrewController` 등)
- **`service/`**: 비즈니스 로직 (`RunnerGradeService` 등)
- **`entity/`**: DB 테이블 매핑 클래스
- **`repository/`**: JPA 데이터 접근 계층
- **`config/`**: 보안(`SecurityConfig`) 및 설정
- **`jwt/`**: JWT 토큰생성 및 검증 유틸리티

### 3.2. 프론트엔드 (`src/`)
- **`components/`**:
  - `map/`: 지도 관련 (`MapView`, `RunnerMarkers`, `ControlPanel`)
  - `auth/`: 로그인 및 회원가입 (`LoginScreen`, `NicknameRegistration`)
  - `common/`: 공통 UI 요소
- **`hooks/`**: 커스텀 훅
- **`utils/`**: 헬퍼 함수 (`gps.js`, `db.js` - IndexedDB 관리)

---

## 4. 🗄️ 데이터베이스 구조 (Database Schema)

주요 엔티티(Entity)와 역할은 다음과 같습니다:

1.  **UserAuth (`user_auth`)**: 사용자 기본 정보 (이메일, 닉네임, 프로필 이미지, **Runner Grade**).
2.  **RunningSession (`running_session`)**: 개별 러닝 기록 (거리, 시간, 경로 데이터 등).
3.  **Crew (`crew`)**: 러닝 크루 정보 (크루명, 소개, 지역).
4.  **CrewMember (`crew_member`)**: 크루 멤버십 관리 (가입 상태, 권한).
5.  **RunningRecord (`running_record`)**: (구조 확인 필요 - `RunningSession`과 유사하거나 통계용).
6.  **UserActivityArea (`user_activity_area`)**: 사용자의 주 활동 지역 (Geocoding 데이터).
7.  **CrewActivityArea (`crew_activity_area`)**: 크루의 활동 거점.
8.  **Post / Comment**: 커뮤니티 게시글 및 댓글.
9.  **RunnerGrade (`enum`)**: 러닝 등급 시스템 (Beginner ~ Legend).

---

## 5. 📅 최근 작업 내역 & 상태 (Recent Updates)

### 5.1. 러너 등급 시스템 (Runner Grade System)
- **기능**: 누적 거리 및 기록에 따라 자동으로 등급(Beginner ~ Elite)이 승급됩니다.
- **백엔드**: `RunnerGradeService`에서 세션 종료 시마다 자동 체크.
- **상태**: 구현 완료 (자동 승급 로직 적용됨).

### 5.2. 지도 및 위치 기능 (Maps & Location)
- **Google Maps 연동**:
  - `MapView.jsx`: 인터랙티브 지도 표시.
  - `ResultScreen.jsx`: 러닝 결과 경로 표시 (속도 구간별 색상 적용).
  - **정적 맵(Static Map)**: 러닝 목록 썸네일 생성 기능.
- **위치 기반 크루 추천**:
  - 사용자의 위치 반경(3km 등) 내의 크루를 찾는 `Nearby Crews` 기능 구현.

### 5.3. 소셜 로그인 및 회원가입
- **카카오 로그인** 추가 (최근 `application.properties`에 설정 추가됨).
- **회원가입 플로우**: 닉네임 설정 -> 활동 지역 설정(지도 UI) -> 완료.

### 5.4. 기타 수정 사항
- **UI 개선**: 헤더 탭별 캐치프레이즈 변경, 러닝 화면 UI 조정.
- **버그 수정**: 맵 초기화 오류 해결, JWT 쿠키 생성 로직 수정.

---

## 6. 🚀 향후 과제 (To-Do & Next Steps)

다음 개발자가 이어서 진행하면 좋을 항목들입니다:

1.  **등급 시스템 UI 강화**:
    - 프론트엔드에서 등급 승급 시 축하 애니메이션이나 배지 UI 추가.
    - `RUNNER_GRADE_SYSTEM.md`의 "향후 계획" 참고.
2.  **안정화**:
    - 러닝 중 네트워크 끊김 시 오프라인 데이터 동기화 테스트.
    - 대량의 위치 데이터 저장 시 DB 최적화 검토 (현재 JSON 형태로 경로 저장 추정).
3.  **크루 기능 확장**:
    - 크루 내 경쟁/랭킹 시스템 도입.
    - 크루 채팅 기능 (Firebase 또는 WebSocket 고려).

---

> **참고 문서**:
> - `PROJECT_OVERVIEW.md`: 프로젝트 전체 상세 명세
> - `BACKEND_GUIDE.md`: 백엔드 상세 가이드
> - `RUNNER_GRADE_SYSTEM.md`: 등급 시스템 로직 상세
