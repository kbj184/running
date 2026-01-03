# 크루 가입 승인 시스템

## 📋 개요

크루 생성 시 **자동 가입**과 **승인 후 가입** 두 가지 방식을 선택할 수 있는 기능이 추가되었습니다.

---

## 🎯 주요 기능

### 1. **크루 생성 시 가입 방식 선택**
- **자동 가입 (AUTO)**: 누구나 바로 크루에 가입할 수 있습니다
- **승인 후 가입 (APPROVAL)**: 크루장이 승인한 후에만 가입됩니다

### 2. **가입 상태 관리**
- **PENDING**: 승인 대기 중
- **APPROVED**: 승인 완료 (크루 멤버)
- **REJECTED**: 거부됨 (삭제)

### 3. **크루장 권한**
- 대기 중인 가입 신청 확인
- 가입 신청 승인/거부

---

## 🗄️ 데이터베이스 변경사항

### 1. `crews` 테이블
```sql
ALTER TABLE crews 
ADD COLUMN join_type VARCHAR(20) NOT NULL DEFAULT 'AUTO' 
COMMENT 'Join type: AUTO or APPROVAL';
```

### 2. `crew_members` 테이블
```sql
ALTER TABLE crew_members 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED' 
COMMENT 'Member status: PENDING, APPROVED, REJECTED';
```

### 마이그레이션 실행
```bash
# 데이터베이스에 접속하여 실행
mysql -u your_username -p secondwind < backend/sql/add_crew_join_approval.sql
```

---

## 🔧 백엔드 변경사항

### 1. **엔티티 수정**

#### `Crew.java`
```java
@Column(name = "join_type", nullable = false)
private String joinType = "AUTO"; // "AUTO" or "APPROVAL"
```

#### `CrewMember.java`
```java
@Column(name = "status", nullable = false)
private String status = "APPROVED"; // "PENDING", "APPROVED", "REJECTED"
```

### 2. **DTO 수정**

#### `CrewDTO.java`
```java
private String joinType; // "AUTO" or "APPROVAL"
```

#### `CrewMemberDTO.java`
```java
private String status; // "PENDING", "APPROVED", "REJECTED"
```

### 3. **API 엔드포인트**

#### 크루 생성
```
POST /crew
Body: {
  "name": "크루 이름",
  "description": "크루 설명",
  "imageUrl": "이미지 URL",
  "joinType": "AUTO" | "APPROVAL",
  "activityAreas": [...]
}
```

#### 크루 가입
```
POST /crew/{crewId}/join
Response: {
  "id": 1,
  "userId": 123,
  "role": "member",
  "status": "PENDING" | "APPROVED",
  "joinedAt": "2026-01-03T10:00:00"
}
```

#### 가입 승인 (크루장만 가능)
```
POST /crew/{crewId}/members/{memberId}/approve
```

#### 가입 거부 (크루장만 가능)
```
POST /crew/{crewId}/members/{memberId}/reject
```

#### 멤버 목록 조회
```
GET /crew/{crewId}/members
Response: [
  {
    "id": 1,
    "userId": 123,
    "nickname": "러너",
    "role": "captain" | "member",
    "status": "PENDING" | "APPROVED",
    "joinedAt": "2026-01-03T10:00:00"
  }
]
```

---

## 🎨 프론트엔드 변경사항

### 1. **크루 생성 화면** (`CrewCreateTab.jsx`)

#### 가입 방식 선택 UI
```jsx
<div style={{ display: 'flex', gap: '12px' }}>
  <label>
    <input type="radio" value="AUTO" checked={joinType === 'AUTO'} />
    <span>자동 가입</span>
    <p>누구나 바로 크루에 가입할 수 있습니다</p>
  </label>

  <label>
    <input type="radio" value="APPROVAL" checked={joinType === 'APPROVAL'} />
    <span>승인 후 가입</span>
    <p>크루장이 승인한 후에 가입됩니다</p>
  </label>
</div>
```

### 2. **크루 상세 모달** (`CrewDetailModal.jsx`)

#### 가입 버튼 (가입 방식 표시)
```jsx
<button onClick={handleJoin}>
  가입하기 {crew.joinType === 'APPROVAL' ? '(승인 필요)' : ''}
</button>
```

#### 가입 상태 표시
- **승인 대기 중**: 노란색 배지 "승인 대기중"
- **승인 완료**: "탈퇴하기" 버튼 표시

#### 크루장 전용 승인 관리
```jsx
{userRole === 'captain' && member.status === 'PENDING' && (
  <div>
    <button onClick={() => handleApprove(member.id)}>승인</button>
    <button onClick={() => handleReject(member.id)}>거부</button>
  </div>
)}
```

---

## 📱 사용자 시나리오

### 시나리오 1: 자동 가입 크루
1. 크루장이 "자동 가입" 방식으로 크루 생성
2. 사용자가 "가입하기" 버튼 클릭
3. **즉시 크루 멤버로 등록** (status: APPROVED)
4. 알림: "크루에 가입되었습니다!"

### 시나리오 2: 승인 후 가입 크루
1. 크루장이 "승인 후 가입" 방식으로 크루 생성
2. 사용자가 "가입하기 (승인 필요)" 버튼 클릭
3. **대기 상태로 등록** (status: PENDING)
4. 알림: "가입 신청이 완료되었습니다. 크루장의 승인을 기다려주세요."
5. 크루장이 멤버 목록에서 "승인" 또는 "거부" 선택
6. 승인 시 → status: APPROVED로 변경
7. 거부 시 → 멤버 목록에서 삭제

---

## 🎯 UI/UX 특징

### 1. **시각적 상태 표시**
- **대기 중**: 🟡 노란색 배지 (#fef3c7 배경, #92400e 텍스트)
- **크루장**: 🟠 주황색 배지 "LEADER"
- **승인 버튼**: 🟢 초록색 (#10b981)
- **거부 버튼**: 🔴 빨간색 (#ef4444)

### 2. **사용자 피드백**
- 가입 신청 시 적절한 알림 메시지
- 승인/거부 시 확인 메시지
- 로딩 상태 표시

### 3. **권한 관리**
- 크루장만 승인/거부 버튼 표시
- 크루장은 자신의 크루를 탈퇴할 수 없음

---

## 🧪 테스트 시나리오

### 1. 크루 생성 테스트
```
✅ 자동 가입 크루 생성
✅ 승인 후 가입 크루 생성
✅ joinType이 DB에 올바르게 저장되는지 확인
```

### 2. 가입 테스트
```
✅ 자동 가입 크루에 가입 → 즉시 APPROVED
✅ 승인 후 가입 크루에 가입 → PENDING 상태
✅ 가입 후 상태가 UI에 올바르게 표시되는지 확인
```

### 3. 승인/거부 테스트
```
✅ 크루장이 대기 중인 멤버를 승인 → APPROVED로 변경
✅ 크루장이 대기 중인 멤버를 거부 → 멤버 삭제
✅ 일반 멤버는 승인/거부 버튼이 보이지 않음
```

### 4. 권한 테스트
```
✅ 크루장이 아닌 사용자가 승인 API 호출 시 오류
✅ 크루장은 탈퇴 버튼 비활성화
```

---

## 🚀 배포 가이드

### 1. 데이터베이스 마이그레이션
```bash
# 로컬 환경
mysql -u root -p secondwind < backend/sql/add_crew_join_approval.sql

# 프로덕션 환경 (EC2)
ssh -i key.pem ec2-user@<EC2_IP>
mysql -u your_username -p secondwind < /path/to/add_crew_join_approval.sql
```

### 2. 백엔드 배포
```bash
cd backend
git add .
git commit -m "feat: 크루 가입 승인 시스템 추가"
git push origin master
# GitHub Actions가 자동으로 배포
```

### 3. 프론트엔드 배포
```bash
git add .
git commit -m "feat: 크루 가입 승인 UI 추가"
git push origin main
# AWS Amplify가 자동으로 배포
```

---

## 📝 주의사항

1. **기존 크루 데이터**: 마이그레이션 시 기존 크루는 자동으로 `joinType = 'AUTO'`로 설정됩니다
2. **기존 멤버 데이터**: 기존 멤버는 자동으로 `status = 'APPROVED'`로 설정됩니다
3. **NULL 안전성 경고**: 백엔드에 일부 null safety 경고가 있지만 기능에는 영향 없습니다

---

## 🔄 향후 개선 사항

- [ ] 가입 신청 알림 기능 (크루장에게 푸시 알림)
- [ ] 대기 중인 신청 개수 배지 표시
- [ ] 거부된 사용자 재신청 제한 기능
- [ ] 크루 설정에서 가입 방식 변경 기능

---

**작성일**: 2026-01-03  
**작성자**: Antigravity AI Assistant
