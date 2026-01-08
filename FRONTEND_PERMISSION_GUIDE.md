# 부크루장 권한 프론트엔드 사용 가이드

## 📦 설치 완료

✅ **백엔드**: CrewPermissionService 추가
✅ **프론트엔드**: useCrewPermission Hook 추가

---

## 🎯 사용 방법

### 1. Hook 사용하기

```javascript
import { useCrewPermission, getRoleName, getRoleBadgeStyle } from '../../../hooks/useCrewPermission';

function CrewDetailPage({ crew, user }) {
    // 권한 정보 가져오기
    const permission = useCrewPermission(crew.id, user);
    
    // permission 객체:
    // {
    //     role: 'captain' | 'vice_captain' | 'member' | 'none',
    //     isCaptain: boolean,
    //     isViceCaptain: boolean,
    //     isManager: boolean,  // 크루장 또는 부크루장
    //     isMember: boolean,
    //     loading: boolean
    // }
    
    return (
        <div>
            {permission.loading ? (
                <div>로딩 중...</div>
            ) : (
                <div>
                    {/* 권한에 따른 UI 표시 */}
                    {permission.isManager && (
                        <button>멤버 승인</button>
                    )}
                </div>
            )}
        </div>
    );
}
```

### 2. 권한별 UI 표시

```javascript
// 크루장만 볼 수 있는 버튼
{permission.isCaptain && (
    <button onClick={handleKickMember}>멤버 강퇴</button>
)}

// 크루장 또는 부크루장만 볼 수 있는 버튼
{permission.isManager && (
    <>
        <button onClick={handleApproveMember}>멤버 승인</button>
        <button onClick={handleRejectMember}>멤버 거절</button>
        <button onClick={handleDeletePost}>게시글 삭제</button>
    </>
)}

// 승인된 멤버만 볼 수 있는 버튼
{permission.isMember && (
    <button onClick={handleCreatePost}>게시글 작성</button>
)}
```

### 3. 역할 배지 표시

```javascript
import { getRoleName, getRoleBadgeStyle } from '../../../hooks/useCrewPermission';

function MemberList({ members }) {
    return (
        <div>
            {members.map(member => (
                <div key={member.id}>
                    <span>{member.nickname}</span>
                    {member.role && (
                        <span style={getRoleBadgeStyle(member.role)}>
                            {getRoleName(member.role)}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
```

---

## 📝 수정이 필요한 컴포넌트

### 1. CrewDetailPage.jsx

**현재 코드:**
```javascript
const isCaptain = (userRole === 'captain' || (crew.captainId && user && crew.captainId === user.id));
```

**수정 후:**
```javascript
import { useCrewPermission } from '../../../hooks/useCrewPermission';

function CrewDetailPage({ crew, user, onBack, onUpdateUser, onEdit }) {
    const permission = useCrewPermission(crew.id, user);
    
    // 기존 isCaptain 대신 permission.isCaptain 사용
    // 기존 userRole 대신 permission.role 사용
    
    // 멤버 승인/거절 버튼 표시 조건
    {permission.isManager && member.status === 'PENDING' && (
        <>
            <button onClick={() => handleApproveMember(member.userId)}>승인</button>
            <button onClick={() => handleRejectMember(member.userId)}>거절</button>
        </>
    )}
    
    // 멤버 강퇴 버튼 (크루장만)
    {permission.isCaptain && member.role !== 'captain' && (
        <button onClick={() => handleKickMember(member.id, member.nickname)}>강퇴</button>
    )}
    
    // 역할 변경 버튼 (크루장만)
    {permission.isCaptain && member.role !== 'captain' && (
        <select onChange={(e) => handleUpdateRole(member.id, e.target.value)}>
            <option value="member">일반 멤버</option>
            <option value="vice_captain">부크루장</option>
        </select>
    )}
}
```

### 2. PostDetailPage.jsx

**추가할 코드:**
```javascript
import { useCrewPermission } from '../../../hooks/useCrewPermission';

function PostDetailPage({ postId, crew, user, userRole, onBack, onEdit }) {
    const permission = useCrewPermission(crew.id, user);
    const [post, setPost] = useState(null);
    
    // 게시글 삭제 권한 체크
    const canDelete = post && (
        post.authorId === user?.id ||  // 작성자
        permission.isManager           // 크루장 또는 부크루장
    );
    
    return (
        <div>
            {canDelete && (
                <button onClick={handleDelete}>삭제</button>
            )}
        </div>
    );
}
```

### 3. CrewBoardTab.jsx

**추가할 코드:**
```javascript
import { useCrewPermission } from '../../../hooks/useCrewPermission';

function CrewBoardTab({ crew, user, onPostClick, onCreatePost }) {
    const permission = useCrewPermission(crew.id, user);
    
    // 공지사항 작성 버튼 (크루장 또는 부크루장만)
    {permission.isManager && (
        <button onClick={() => onCreatePost({ isNotice: true })}>
            공지사항 작성
        </button>
    )}
    
    // 일반 게시글 작성 버튼 (승인된 멤버)
    {permission.isMember && (
        <button onClick={() => onCreatePost({ isNotice: false })}>
            게시글 작성
        </button>
    )}
}
```

### 4. CrewCourseTab.jsx

**추가할 코드:**
```javascript
import { useCrewPermission } from '../../../hooks/useCrewPermission';

function CrewCourseTab({ crew, user, onCourseClick, onCourseCreate }) {
    const permission = useCrewPermission(crew.id, user);
    
    // 코스 삭제 권한 체크
    const canDeleteCourse = (course) => {
        return course.userId === user?.id ||  // 작성자
               permission.isManager;           // 크루장 또는 부크루장
    };
    
    return (
        <div>
            {courses.map(course => (
                <div key={course.id}>
                    <span>{course.title}</span>
                    {canDeleteCourse(course) && (
                        <button onClick={() => handleDeleteCourse(course.id)}>삭제</button>
                    )}
                </div>
            ))}
        </div>
    );
}
```

---

## 🎨 역할 배지 스타일 예시

### 기본 사용
```javascript
import { getRoleName, getRoleBadgeStyle } from '../../../hooks/useCrewPermission';

<span style={getRoleBadgeStyle('captain')}>
    {getRoleName('captain')}
</span>
// 결과: 🟠 크루장 (오렌지 배경)

<span style={getRoleBadgeStyle('vice_captain')}>
    {getRoleName('vice_captain')}
</span>
// 결과: 🟢 부크루장 (초록 배경)

<span style={getRoleBadgeStyle('member')}>
    {getRoleName('member')}
</span>
// 결과: ⚪ 멤버 (회색 배경)
```

### 커스텀 스타일
```javascript
const customStyle = {
    ...getRoleBadgeStyle(member.role),
    marginLeft: '8px',
    fontSize: '11px'
};

<span style={customStyle}>
    {getRoleName(member.role)}
</span>
```

---

## ✅ 체크리스트

### 백엔드
- [x] CrewPermissionService.java 생성
- [x] CrewMemberController에 권한 서비스 추가
- [x] BoardController에 권한 서비스 추가
- [x] GET /crew/{crewId}/my-role API 추가

### 프론트엔드
- [x] useCrewPermission Hook 생성
- [ ] CrewDetailPage.jsx 수정
- [ ] PostDetailPage.jsx 수정
- [ ] CrewBoardTab.jsx 수정
- [ ] CrewCourseTab.jsx 수정
- [ ] PostEditorPage.jsx 수정 (공지사항 작성 권한)

---

## 🔍 디버깅

### 권한 정보 확인
```javascript
const permission = useCrewPermission(crew.id, user);

useEffect(() => {
    console.log('User Permission:', permission);
}, [permission]);

// 출력 예시:
// {
//     role: "vice_captain",
//     isCaptain: false,
//     isViceCaptain: true,
//     isManager: true,
//     isMember: true,
//     loading: false
// }
```

### API 응답 확인
```javascript
// 브라우저 개발자 도구 > Network 탭에서 확인
// GET /crew/{crewId}/my-role
// Response:
{
    "role": "vice_captain",
    "isCaptain": false,
    "isViceCaptain": true,
    "isManager": true,
    "isMember": true
}
```

---

## 📚 참고

### 권한 매트릭스

| 기능 | 크루장 | 부크루장 | 일반 멤버 |
|------|--------|---------|----------|
| 멤버 승인/거절 | ✅ | ✅ | ❌ |
| 멤버 강퇴 | ✅ | ❌ | ❌ |
| 역할 변경 | ✅ | ❌ | ❌ |
| 게시글 삭제 (모든 글) | ✅ | ✅ | ❌ |
| 게시글 삭제 (본인 글) | ✅ | ✅ | ✅ |
| 댓글 삭제 (모든 댓글) | ✅ | ✅ | ❌ |
| 댓글 삭제 (본인 댓글) | ✅ | ✅ | ✅ |
| 공지사항 작성 | ✅ | ✅ | ❌ |
| 게시글 고정 | ✅ | ✅ | ❌ |
| 코스 삭제 (모든 코스) | ✅ | ✅ | ❌ |
| 코스 삭제 (본인 코스) | ✅ | ✅ | ✅ |

---

**다음 단계**: 위 체크리스트의 프론트엔드 컴포넌트들을 수정하세요!
