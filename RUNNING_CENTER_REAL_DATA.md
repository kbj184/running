# 런닝센터 실제 유저 데이터 표시 구현

## 개요
런닝센터의 가상 유저 데이터를 제거하고, 데이터베이스에 저장된 실제 유저들의 마지막 런닝 기록을 표시하도록 변경했습니다.

## 변경 사항

### 백엔드 (Backend)

#### 1. RunningSessionRepository.java
- **새로운 쿼리 메서드 추가**: `findLatestCompletedSessionsPerUser()`
  - 각 유저의 최신 완료된 러닝 세션을 조회하는 쿼리
  - 런닝센터에서 실제 유저 데이터를 표시하기 위해 사용

```java
@Query("SELECT r FROM RunningSession r WHERE r.isComplete = true " +
        "AND r.id IN (SELECT MAX(r2.id) FROM RunningSession r2 " +
        "WHERE r2.isComplete = true GROUP BY r2.userId) " +
        "ORDER BY r.createdAt DESC")
List<RunningSession> findLatestCompletedSessionsPerUser();
```

#### 2. RunningController.java
- **새로운 엔드포인트 추가**: `GET /api/running/running-center/latest`
  - 모든 유저의 최신 러닝 기록을 조회
  - 세션 정보와 유저 정보(닉네임, 등급, 프로필 이미지)를 결합하여 반환
  - 응답 형식:
    ```json
    [
      {
        "id": 1,
        "sessionId": "session_123",
        "distance": 5.2,
        "duration": 1800,
        "speed": 10.4,
        "pace": 5.77,
        "route": "[{lat: 37.5665, lng: 126.9780}, ...]",
        "createdAt": "2026-01-12T00:00:00",
        "userId": 1,
        "nickname": "러너1",
        "grade": "INTERMEDIATE",
        "profileImageUrl": "https://..."
      },
      ...
    ]
    ```

### 프론트엔드 (Frontend)

#### 1. App.jsx
- **가상 유저 생성 로직 제거**
  - `generateRunners()` 함수 import 제거
  - 가상 유저 생성 및 위치 업데이트 로직 제거
  
- **실제 유저 데이터 페칭 로직 추가**
  - `fetchRunningCenterData()` 함수 추가
  - 백엔드 API에서 실제 유저 데이터를 가져옴
  - 30초마다 자동으로 데이터 갱신
  - 런닝 탭이 활성화될 때만 데이터 페칭
  
- **데이터 변환 로직**
  - 백엔드에서 받은 데이터를 프론트엔드 runner 형식으로 변환
  - route 데이터 파싱 (JSON string → array)
  - 현재 위치를 route의 마지막 포인트로 설정
  - duration을 초에서 분으로 변환

#### 2. RunnerDetailPanel.jsx
- **선택적 필드 렌더링**
  - `calories`와 `heartRate` 필드가 없을 경우 상세 정보 섹션 숨김
  - route 데이터가 없을 경우 경로 정보 섹션 숨김
  - 실제 유저 데이터에는 이러한 필드가 없을 수 있으므로 안전하게 처리

### 제거된 파일
- `src/utils/runnerUtils.js` - 더 이상 사용되지 않음 (가상 유저 생성 로직)

## 주요 기능

### 1. 실시간 데이터 표시
- 데이터베이스에 저장된 실제 유저들의 최신 런닝 기록을 표시
- 각 유저당 가장 최근에 완료된 세션 1개만 표시

### 2. 자동 갱신
- 30초마다 자동으로 데이터 갱신
- 새로운 런닝 기록이 추가되면 자동으로 반영

### 3. 수동 갱신
- 새로고침 버튼을 통해 수동으로 데이터 갱신 가능

### 4. 유저 정보 표시
- 닉네임
- 러너 등급 (BEGINNER, INTERMEDIATE, ADVANCED, ELITE, PRO)
- 프로필 이미지
- 거리, 속도, 페이스, 소요 시간 등의 런닝 통계

## 빌드 및 배포

### 백엔드
```bash
cd backend
./gradlew build -x test
```

### 프론트엔드
```bash
npm run build
```

## 테스트 방법

1. 런닝센터 탭으로 이동
2. 실제 유저들의 최신 런닝 기록이 지도에 표시되는지 확인
3. 러너 마커를 클릭하여 상세 정보 패널이 올바르게 표시되는지 확인
4. 새로고침 버튼을 클릭하여 데이터가 갱신되는지 확인
5. 30초 후 자동으로 데이터가 갱신되는지 확인

## 주의사항

- 데이터베이스에 완료된 런닝 세션이 없는 경우 빈 목록이 표시됩니다
- route 데이터가 없는 세션의 경우 기본 위치(서울 중심)가 사용됩니다
- 런닝 탭이 활성화되어 있을 때만 데이터를 페칭하여 불필요한 API 호출을 방지합니다
