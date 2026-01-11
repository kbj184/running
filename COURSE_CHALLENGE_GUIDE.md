# 🏃 Running App - Course Challenge & Record Comparison Feature

## 📋 프로젝트 개요

이 문서는 러닝 앱의 코스 재도전 및 기록 비교 기능 구현 과정을 정리한 문서입니다.

---

## 🎯 구현 완료 기능

### 1. courseType 기반 코스 타입 시스템
- `isRetry` boolean → `courseType` string enum으로 변경
- 확장 가능한 구조로 설계

#### 지원 타입
| courseType | 마크 | 색상 | 설명 |
|-----------|------|------|------|
| `CREW` | 🏆 CREW | #7c3aed (보라색) | 크루 공식 코스 |
| `RETRY` | 🔄 RETRY | #3b82f6 (파란색) | 내 기록 재도전 |
| `FRIEND` | 👥 FRIEND | #10b981 (초록색) | 친구 따라하기 (향후) |

### 2. 코스 재도전 기능
- 내 기록에서 코스 기록 클릭 → 재도전 버튼
- FollowCourseRunningScreen 연동
- 완료 후 새 기록에 `courseType: 'RETRY'` 저장

### 3. RecordDetailModal
- 기록 상세 보기 모달
- 지도 표시 (정적 → 인터랙티브 전환)
- 통계 표시 (거리, 시간, 페이스, 칼로리, 상승, 하강)
- 속도 구간 범례
- 코스 기록일 때 재도전 버튼 표시

---

## 🗄️ 데이터베이스 마이그레이션

### 필요한 SQL
```sql
-- 1. course_type 컬럼 추가
ALTER TABLE running_sessions 
ADD COLUMN course_type VARCHAR(20);

-- 2. 기존 데이터 마이그레이션 (is_retry가 있었다면)
UPDATE running_sessions 
SET course_type = CASE 
    WHEN is_retry = TRUE THEN 'RETRY'
    WHEN course_id IS NOT NULL THEN 'CREW'
    ELSE NULL
END;

-- 3. (선택) is_retry 컬럼 삭제
ALTER TABLE running_sessions 
DROP COLUMN is_retry;
```

---

## 📝 수정된 파일

### 백엔드 (3개)
1. `backend/src/main/java/com/secondwind/entity/RunningSession.java`
   - `courseType` 필드 추가
2. `backend/src/main/java/com/secondwind/dto/RunningSessionDTO.java`
   - `courseType` 필드 추가
3. `backend/src/main/java/com/secondwind/controller/RunningController.java`
   - `courseType` 처리 로직 추가

### 프론트엔드 (4개)
1. `src/App.jsx`
   - RecordDetailModal 통합
   - 코스 재도전 핸들러 추가
   - `courseType: 'RETRY'` 전달
2. `src/components/FollowCourseRunningScreen.jsx`
   - `courseType` 백엔드 전송
3. `src/components/common/RecentRecords.jsx`
   - courseType별 마크 표시 (switch문)
4. `src/components/RecordDetailModal.jsx`
   - 기록 상세 보기 모달 (단순 버전)
   - 코스 재도전 버튼

---

## 🎨 UI/UX

### 마크 시스템
```
🏆 CREW    - 크루 공식 코스 (보라색)
🔄 RETRY   - 내 기록 재도전 (파란색)
👥 FRIEND  - 친구 따라하기 (초록색, 향후)
```

### RecordDetailModal 레이아웃
```
[← 기록 상세]
[지도 - 클릭 시 인터랙티브]
2026년1월11일 21:08

거리: 3.8 km    시간: 0:39
페이스: 0:05/km 칼로리: 225 kcal
상승: 506 m     하강: 249 m

속도 구간
━ 느림 (< 6 km/h)
━ 보통 (6-9 km/h)
━ 빠름 (9-12 km/h)
━ 매우 빠름 (> 12 km/h)

[🏃 코스 재도전하기] (코스 기록만)
[닫기]
```

---

## 🚀 사용 시나리오

### 크루 코스 따라하기
```
1. 크루 탭 → 코스 선택
2. "코스 따라하기" 클릭
3. 러닝 완료 후 저장
4. 내 기록 탭에서 확인 → 🏆 CREW 마크
```

### 코스 재도전
```
1. 내 기록 탭 → 🏆 CREW 마크 기록 클릭
2. "코스 재도전하기" 버튼 클릭
3. 러닝 완료 후 저장
4. 내 기록 탭에서 확인 → 🔄 RETRY 마크
```

---

## 🔧 기술 스택

### 백엔드
- Java Spring Boot
- MariaDB
- JPA/Hibernate

### 프론트엔드
- React
- Google Maps API
- React Router
- i18next (다국어)

---

## 📊 커밋 히스토리

### 주요 커밋
1. `f5d726a` - 백엔드: courseType 시스템 구현
2. `9f2512a` - 프론트엔드: courseType 기반 마크 표시
3. `1217a91` - RecordDetailModal: 고도/속도 그래프 추가
4. `8637fe0` - RecordDetailModal: 기존 디자인으로 단순화

---

## ✅ 완료 체크리스트

- [x] courseType 필드 추가 (백엔드)
- [x] courseType 처리 로직 (백엔드)
- [x] DB 마이그레이션
- [x] courseType별 마크 표시 (프론트엔드)
- [x] RecordDetailModal 구현
- [x] 코스 재도전 기능
- [x] 기존 디자인 복원

---

## 🔮 향후 개선 사항

### 1. 기록 비교 기능
- 같은 코스의 여러 기록 비교
- 지도에 다른 색상으로 표시
- 통계 비교 테이블

### 2. 친구 따라하기
- `courseType: 'FRIEND'`
- 친구 기록을 따라 달리기

### 3. 챌린지 코스
- `courseType: 'CHALLENGE'`
- 이벤트/챌린지 코스

### 4. 커스텀 코스
- `courseType: 'CUSTOM'`
- 사용자가 직접 경로 그리기

---

## 📞 문의

문제 발생 시:
1. 백엔드 로그 확인: `sudo journalctl -u secondwind -f`
2. 프론트엔드 콘솔 확인 (F12)
3. DB 데이터 확인

---

**작성일**: 2026-01-11  
**작성자**: Antigravity AI Assistant
