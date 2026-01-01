# 🏃 러닝 앱 프로젝트 전체 개요

> **최종 업데이트**: 2026-01-01  
> **프로젝트명**: Running Tracker Application  
> **도메인**: https://llrun.shop

---

## 📋 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택](#-기술-스택)
3. [배포 아키텍처](#-배포-아키텍처)
4. [주요 기능](#-주요-기능)
5. [프로젝트 구조](#-프로젝트-구조)
6. [환경 설정](#-환경-설정)
7. [배포 프로세스](#-배포-프로세스)
8. [개발 가이드](#-개발-가이드)
9. [문제 해결](#-문제-해결)

---

## 🎯 프로젝트 개요

**러닝 트래킹 애플리케이션** - GPS 기반 실시간 러닝 추적, 크루 관리, 소셜 로그인을 지원하는 풀스택 웹 애플리케이션

### 핵심 정보
- **프론트엔드 저장소**: `github.com/kbj184/running`
- **백엔드 저장소**: `github.com/kbj184/secondwind`
- **프론트엔드 URL**: https://llrun.shop
- **백엔드 API URL**: https://api.llrun.shop
- **임시 도메인**: https://main.d2f7uw4hiwwlz7.amplifyapp.com

---

## 🛠️ 기술 스택

### 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18.2.0 | UI 프레임워크 |
| **Vite** | 5.0.8 | 빌드 도구 |
| **Google Maps API** | 2.20.7 | 지도 및 GPS 트래킹 |
| **IndexedDB** | - | 로컬 데이터 저장 |
| **Cloudinary** | - | 이미지 업로드 |

**실행 환경**:
- 로컬: `https://localhost:3000`
- 프로덕션: `https://llrun.shop` (AWS Amplify)

### 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| **Spring Boot** | 3.4.12 | 백엔드 프레임워크 |
| **Spring Security** | - | 인증/인가 |
| **OAuth2** | - | 소셜 로그인 (Naver, Google) |
| **JWT** | - | 토큰 기반 인증 |
| **JPA/Hibernate** | - | ORM |
| **MariaDB** | - | 데이터베이스 |
| **Gradle** | - | 빌드 도구 |
| **Nginx** | - | 리버스 프록시 + SSL |

**실행 환경**:
- 로컬: `https://localhost:8443`
- 프로덕션: `https://api.llrun.shop` (AWS EC2)

---

## 🏗️ 배포 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 접속                           │
│                  https://llrun.shop                      │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  프론트엔드       │              │   백엔드 API      │
│  AWS Amplify     │─────────────▶│   AWS EC2        │
│                  │              │                  │
│  React + Vite    │              │  Spring Boot     │
│  llrun.shop      │              │  api.llrun.shop  │
└──────────────────┘              └──────────────────┘
        │                                   │
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  GitHub          │              │  GitHub          │
│  kbj184/running  │              │  kbj184/         │
│  (main 브랜치)   │              │  secondwind      │
│                  │              │  (master 브랜치) │
└──────────────────┘              └──────────────────┘
        │                                   │
        │ (자동 배포)                       │ (GitHub Actions)
        ▼                                   ▼
   AWS Amplify                         AWS EC2
   자동 빌드 & 배포                    자동 빌드 & 배포
```

### 배포 플랫폼

#### 프론트엔드 (AWS Amplify)
- **자동 배포**: `main` 브랜치 푸시 시 자동 빌드 & 배포
- **빌드 명령**: `npm install` → `npm run build`
- **배포 시간**: 1~2분
- **CDN**: AWS CloudFront

#### 백엔드 (AWS EC2 + GitHub Actions)
- **자동 배포**: `master` 브랜치 푸시 시 GitHub Actions 실행
- **빌드 명령**: `./gradlew clean bootJar`
- **배포 방식**: SCP로 JAR 전송 → systemd 재시작
- **배포 시간**: 2~3분
- **서비스명**: `running.service`

---

## 🎯 주요 기능

### 1. 🏃 러닝 트래킹
- ✅ 실시간 GPS 위치 추적
- ✅ 거리, 속도, 페이스, 고도 측정
- ✅ 수분 보충 구간 자동 감지
- ✅ 2초마다 IndexedDB 자동 저장
- ✅ Google Static Maps API로 경로 이미지 생성
- ✅ 테스트 모드 (마우스 클릭으로 위치 이동)

### 2. 👥 크루 관리
- ✅ 크루 생성/가입/탈퇴
- ✅ 크루원 관리
- ✅ 크루 활동 기록
- ✅ 크루 이미지 업로드 (Cloudinary)

### 3. 🔐 인증/인가
- ✅ 이메일 로컬 로그인
- ✅ 소셜 로그인 (Naver, Google)
- ✅ JWT 자동 토큰 갱신
- ✅ 프로필 이미지 업로드 (Cloudinary)
- ✅ 닉네임 등록

### 4. 🏆 러너 등급 시스템 (자동 승급)

| 등급 | 영문명 | 조건 | 아이콘 |
|------|--------|------|--------|
| 초보자 | Beginner | 5km 미만 | 🥉 |
| 5K 러너 | 5K Runner | 10km 미만 및 1시간 이내 | 🏃 |
| 10K 러너 | 10K Runner | 21km 미만 및 1시간 30분 이내 | 🏃‍♂️ |
| 하프 마라토너 | Half Marathoner | 42km 미만 및 2시간 30분 이내 | 🎽 |
| 풀 마라토너 | Full Marathoner | 42km 이상 및 5시간 30분 이내 | 🏅 |
| Sub-3 마라토너 | Sub-3 Marathoner | 42km 이상 및 3시간 이내 | ⚡ |
| 엘리트 마라토너 | Elite Marathoner | 42km 이상 및 2시간 30분 이내 | 👑 |
| 전설의 러너 | Legend Marathoner | 관리자 수동 승급 | 🌟 |

**작동 방식**:
- 러닝 세션 완료 시 자동 등급 체크
- 조건 충족 시 즉시 승급 (강등 없음)
- 승급 시 프론트엔드 알림 표시

### 5. 📍 사용자 활동 지역 등록
- ✅ Google Maps Geocoding API로 위치 정보 수집
- ✅ 국가, 행정구역, 좌표 저장
- ✅ 주요 러닝 활동 지역 표시

### 6. 🛠️ 점검 모드
- ✅ 프론트엔드: AWS Amplify Rewrites로 `maintenance.html` 표시
- ✅ 백엔드: Nginx `return 503`으로 API 차단
- ✅ 점검 페이지 자동 표시

---

## 📂 프로젝트 구조

### 프론트엔드 (`c:\react\running`)

```
running/
├── src/
│   ├── components/
│   │   ├── common/              # 공통 컴포넌트
│   │   │   ├── Header.jsx       # 앱 헤더 (통계 표시)
│   │   │   ├── StartButton.jsx  # 러닝 시작 버튼
│   │   │   └── CrewDetailModal.jsx
│   │   ├── map/                 # 맵 관련 컴포넌트
│   │   │   ├── MapView.jsx
│   │   │   ├── MapController.jsx
│   │   │   ├── RunnerMarkers.jsx
│   │   │   ├── LegendPanel.jsx
│   │   │   └── ControlPanel.jsx
│   │   ├── runner/              # 러너 관련
│   │   │   └── RunnerDetailPanel.jsx
│   │   ├── auth/                # 인증 관련
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── NicknameRegistration.jsx
│   │   │   └── LocationSelection.jsx
│   │   ├── RunningScreen.jsx    # 러닝 진행 화면
│   │   └── ResultScreen.jsx     # 러닝 결과 화면
│   ├── utils/
│   │   ├── db.js                # IndexedDB 유틸리티
│   │   ├── gps.js               # GPS 유틸리티
│   │   └── runnerUtils.js       # 러너 생성 유틸리티
│   ├── constants/
│   │   ├── runnerGrades.js      # 러너 등급 상수
│   │   └── runnerGradeInfo.js   # 등급 상세 정보
│   ├── App.jsx                  # 메인 앱
│   └── main.jsx                 # 진입점
├── public/
│   └── maintenance.html         # 점검 페이지
├── backend/                     # 백엔드 (서브모듈)
├── .env.development             # 로컬 환경 변수
├── .env.production              # 프로덕션 환경 변수
├── package.json
├── vite.config.js
└── [가이드 문서들].md
```

### 백엔드 (`c:\react\running\backend`)

```
backend/
├── .github/
│   └── workflows/
│       └── deploy.yml           # 🚀 GitHub Actions 배포 설정
├── src/
│   └── main/
│       └── java/
│           └── com/secondwind/
│               ├── controller/  # REST API 컨트롤러
│               │   ├── RunningController.java
│               │   ├── UserActivityAreaController.java
│               │   ├── MyController.java
│               │   └── CrewController.java
│               ├── service/     # 비즈니스 로직
│               │   ├── RunnerGradeService.java
│               │   └── CustomOAuth2UserService.java
│               ├── entity/      # JPA 엔티티
│               │   ├── UserAuth.java
│               │   ├── UserActivityArea.java
│               │   ├── RunningSession.java
│               │   └── Crew.java
│               ├── repository/  # JPA 레포지토리
│               ├── jwt/         # JWT 관련
│               │   └── JWTUtil.java
│               ├── dto/         # 데이터 전송 객체
│               └── config/      # 설정
│                   └── SecurityConfig.java
├── nginx/
│   └── maintenance.conf         # Nginx 점검 모드 설정
├── sql/                         # SQL 스크립트
├── Dockerfile                   # Docker 이미지 빌드
├── build.gradle                 # Gradle 빌드 설정
├── gradlew.bat                  # Gradle 래퍼 (Windows)
└── RUNNER_GRADE_SYSTEM.md       # 등급 시스템 문서
```

---

## ⚙️ 환경 설정

### 프론트엔드 환경 변수

#### 로컬 개발 (`.env.development`)
```env
VITE_API_URL=https://localhost:8443
VITE_GOOGLE_MAPS_API_KEY=AIzaSyA7hTBvMfinNsvCtYjTMF8qlHLpysnpmxE
VITE_GOOGLE_MAPS_MAP_ID=5ed8c3cf6ed02874030a4862
VITE_CLOUDINARY_CLOUD_NAME=dpqcyw2wh
VITE_CLOUDINARY_UPLOAD_PRESET=llrun_profile_upload
```

#### 프로덕션 (`.env.production`)
```env
VITE_API_URL=https://api.llrun.shop
VITE_GOOGLE_MAPS_API_KEY=AIzaSyA7hTBvMfinNsvCtYjTMF8qlHLpysnpmxE
VITE_GOOGLE_MAPS_MAP_ID=5ed8c3cf6ed02874030a4862
VITE_CLOUDINARY_CLOUD_NAME=dpqcyw2wh
VITE_CLOUDINARY_UPLOAD_PRESET=llrun_profile_upload
```

### 백엔드 환경 변수 (GitHub Secrets)

**필수 Secrets**:
```
EC2_HOST              # EC2 IP 주소
EC2_USERNAME          # ec2-user
EC2_SSH_KEY           # SSH 프라이빗 키

DB_URL                # jdbc:mariadb://...
DB_USERNAME           # DB 사용자명
DB_PASSWORD           # DB 비밀번호

JWT_SECRET            # JWT 시크릿 키

NAVER_CLIENT_ID       # 네이버 OAuth
NAVER_CLIENT_SECRET
GOOGLE_CLIENT_ID      # 구글 OAuth
GOOGLE_CLIENT_SECRET

ALLOWED_ORIGINS       # https://llrun.shop,https://www.llrun.shop,...
```

### 데이터베이스 설정

```sql
-- 데이터베이스 생성
CREATE DATABASE secondwind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON secondwind.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

**주요 테이블**:
- `user_auth` - 사용자 인증 정보 (닉네임, 프로필 이미지, 등급)
- `user_activity_area` - 사용자 활동 지역
- `running_session` - 러닝 기록
- `crew` - 크루 정보

---

## 🚀 배포 프로세스

### 프론트엔드 배포 (AWS Amplify)

```bash
# 1. 로컬에서 작업
git add .
git commit -m "feat: 새 기능 추가"
git push origin main

# 2. AWS Amplify가 자동으로:
#    - 코드 감지
#    - npm install
#    - npm run build
#    - dist/ 폴더를 CDN에 배포
#    - 1~2분 내 배포 완료
```

**배포 확인**:
- AWS Amplify Console → 빌드 로그 확인
- https://llrun.shop 접속하여 확인

### 백엔드 배포 (GitHub Actions → EC2)

```bash
# 1. 로컬에서 작업
cd backend
git add .
git commit -m "feat: 새 API 추가"
git push origin master

# 2. GitHub Actions가 자동으로:
#    - JDK 17 설정
#    - ./gradlew clean bootJar
#    - SCP로 JAR 파일을 EC2로 전송
#    - SSH로 EC2 접속
#    - 환경 변수 파일 생성
#    - systemctl restart running
#    - 2~3분 내 배포 완료
```

**배포 확인**:
- GitHub → Actions 탭에서 워크플로우 상태 확인
- EC2 SSH 접속: `journalctl -u running -f` (로그 확인)
- https://api.llrun.shop/api/... 접속하여 확인

### GitHub Actions 워크플로우 (`.github/workflows/deploy.yml`)

```yaml
name: Java CI/CD with Gradle and EC2

on:
  push:
    branches: [ "master" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - 체크아웃
      - JDK 17 설정
      - Gradle 빌드
      - EC2로 JAR 전송 (SCP)
      - EC2에서 서비스 재시작 (SSH)
```

---

## 💻 개발 가이드

### 로컬 개발 환경 실행

#### 프론트엔드
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 접속: https://localhost:3000
```

#### 백엔드
```bash
# backend 디렉토리로 이동
cd backend

# Spring Boot 실행
./gradlew.bat bootRun

# 접속: https://localhost:8443
```

### 주요 API 엔드포인트

#### 인증
- `POST /login` - 로컬 로그인
- `GET /oauth2/authorization/naver` - 네이버 소셜 로그인
- `GET /oauth2/authorization/google` - 구글 소셜 로그인
- `POST /refresh/token` - 토큰 갱신

#### 사용자
- `GET /` - 메인 페이지 (인증 필요)
- `GET /my` - 내 정보 조회
- `PUT /user/profile` - 프로필 업데이트
- `GET /emailcheck` - 이메일 중복 확인

#### 러닝
- `POST /api/running/start` - 러닝 시작
- `POST /api/running/save` - 러닝 데이터 저장
- `GET /api/running/sessions` - 러닝 기록 조회

#### 크루
- `POST /api/crew` - 크루 생성
- `GET /api/crew/{id}` - 크루 조회
- `POST /api/crew/{id}/join` - 크루 가입
- `DELETE /api/crew/{id}/leave` - 크루 탈퇴

### 테스트 모드 사용법

1. **러닝 시작** 버튼 클릭
2. 기본적으로 **테스트 모드**로 시작 (서울 중심 좌표)
3. **맵 클릭**으로 위치 이동
4. **F12** → Console 탭에서 실시간 로그 확인
5. **2초마다 IndexedDB 자동 저장**
6. **모드 전환 버튼**으로 GPS 모드 전환 가능

자세한 내용: [TEST_MODE_GUIDE.md](./TEST_MODE_GUIDE.md)

### 점검 모드 설정

#### 프론트엔드 (AWS Amplify)
1. AWS Amplify Console 접속
2. Rewrites and redirects 메뉴
3. 규칙 추가:
   - `[1순위]` `/maintenance.html` → `/maintenance.html` (200 Rewrite)
   - `[2순위]` `/<*>` → `/maintenance.html` (200 Rewrite)

#### 백엔드 (Nginx)
```nginx
location /api {
    return 503;  # 이 줄 추가
    
    proxy_pass http://localhost:8080;
    ...
}

# 503 에러 페이지 설정
error_page 503 @maintenance;
location @maintenance {
    root /usr/share/nginx/html;
    rewrite ^(.*)$ /maintenance.html break;
}
```

자세한 내용: [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)

---

## 🔍 문제 해결

### 프론트엔드

#### 빌드 실패
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 환경 변수 적용 안 됨
```bash
# 개발 서버 재시작
# Ctrl + C로 중지 후
npm run dev
```

#### CORS 에러
- 백엔드 `ALLOWED_ORIGINS`에 프론트엔드 도메인 추가 확인
- 로컬: `https://localhost:3000`
- 프로덕션: `https://llrun.shop`

### 백엔드

#### 포트 충돌 (8443)
```bash
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8443

# 프로세스 종료
taskkill /PID <PID> /F
```

#### 데이터베이스 연결 오류
- MariaDB 서비스 실행 확인
- `application.properties`의 DB 접속 정보 확인
- 방화벽 설정 확인

#### GitHub Actions 배포 실패
1. GitHub → Actions 탭에서 로그 확인
2. Secrets 설정 확인 (EC2_HOST, EC2_SSH_KEY 등)
3. EC2 SSH 접속 가능 여부 확인

#### EC2 서비스 재시작
```bash
# SSH 접속
ssh -i key.pem ec2-user@<EC2_IP>

# 서비스 상태 확인
sudo systemctl status running

# 서비스 재시작
sudo systemctl restart running

# 로그 확인
journalctl -u running -f
```

---

## 📚 관련 문서

- [README.md](./README.md) - 프로젝트 소개
- [BACKEND_GUIDE.md](./BACKEND_GUIDE.md) - 백엔드 실행 가이드
- [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md) - 컴포넌트 구조
- [DB_LOG_GUIDE.md](./DB_LOG_GUIDE.md) - 데이터베이스 로깅
- [TEST_MODE_GUIDE.md](./TEST_MODE_GUIDE.md) - 테스트 모드 사용법
- [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) - 점검 모드 가이드
- [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) - Cloudinary 설정
- [backend/RUNNER_GRADE_SYSTEM.md](./backend/RUNNER_GRADE_SYSTEM.md) - 러너 등급 시스템

---

## 🎯 빠른 참조

### 로컬 개발
```bash
# 프론트엔드
npm run dev                    # https://localhost:3000

# 백엔드
cd backend
./gradlew.bat bootRun         # https://localhost:8443
```

### 배포
```bash
# 프론트엔드 (main 브랜치)
git push origin main          # AWS Amplify 자동 배포

# 백엔드 (master 브랜치)
cd backend
git push origin master        # GitHub Actions → EC2 자동 배포
```

### 주요 URL
- **프론트엔드**: https://llrun.shop
- **백엔드 API**: https://api.llrun.shop
- **AWS Amplify Console**: AWS Console → Amplify
- **GitHub Actions**: https://github.com/kbj184/secondwind/actions

### 로그 확인
```bash
# 프론트엔드
브라우저 F12 → Console 탭

# 백엔드 (EC2)
ssh -i key.pem ec2-user@<EC2_IP>
journalctl -u running -f
```

---

## 📞 연락처

- **GitHub**: [@kbj184](https://github.com/kbj184)
- **프론트엔드 저장소**: https://github.com/kbj184/running
- **백엔드 저장소**: https://github.com/kbj184/secondwind

---

**마지막 업데이트**: 2026-01-01  
**작성자**: Antigravity AI Assistant
