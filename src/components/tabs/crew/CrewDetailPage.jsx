import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../../utils/api';
import CrewBoardTab from './CrewBoardTab';
import PostDetailPage from './PostDetailPage';
import PostEditorPage from './PostEditorPage';
import CrewCourseTab from './CrewCourseTab';
import CourseViewPage from './CourseViewPage';
import CourseSelectionPage from './CourseSelectionPage';
import CourseCreatePage from './CourseDetailPage';

function CrewDetailPage({ crew, user, onBack, onUpdateUser, onEdit }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('intro');
    const [isTabFixed, setIsTabFixed] = useState(false);
    const tabRef = useRef(null);
    const tabOffsetRef = useRef(0);

    // 게시판 상태
    const [boardView, setBoardView] = useState('list'); // 'list', 'detail', 'editor'
    const [selectedPost, setSelectedPost] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseViewMode, setCourseViewMode] = useState('list'); // 'list', 'detail', 'create_select', 'create_form'

    // URL에서 탭 상태 동기화
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        // URL 구조: /crew/detail/:id/:tab/:subAction/:subId

        if (pathParts[4]) {
            setActiveTab(pathParts[4]);

            if (pathParts[4] === 'board') {
                if (pathParts[5] === 'view' && pathParts[6]) {
                    setBoardView('detail');
                    setSelectedPost({ id: pathParts[6] });
                } else if (pathParts[5] === 'write') {
                    setBoardView('editor');
                    setEditingPost(null);
                } else {
                    setBoardView('list');
                    setSelectedPost(null);
                    setEditingPost(null);
                }
            } else if (pathParts[4] === 'course') {
                if (pathParts[5]) {
                    if (pathParts[5] === 'create') {
                        setCourseViewMode('create_select');
                        setSelectedCourse(null);
                    } else if (pathParts[5] === 'write') {
                        setCourseViewMode('create_form');
                        setSelectedCourse(null);
                    } else {
                        setCourseViewMode('detail');
                        const courseId = parseInt(pathParts[5]);
                        if (!isNaN(courseId)) {
                            if (location.state?.course) {
                                setSelectedCourse(location.state.course);
                            } else {
                                // URL로 직접 접근 시 데이터 fetch
                                const crewId = pathParts[3];
                                const token = user?.accessToken || '';
                                const headers = token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {};

                                api.request(`${import.meta.env.VITE_API_URL}/crew/${crewId}/courses`, { headers })
                                    .then(res => {
                                        if (res.ok) return res.json();
                                        throw new Error('Failed to fetch');
                                    })
                                    .then(data => {
                                        const found = data.find(c => c.id === courseId);
                                        if (found) setSelectedCourse(found);
                                    })
                                    .catch(console.error);
                            }
                        }
                    }
                } else {
                    setCourseViewMode('list');
                    setSelectedCourse(null);
                }
            }
        } else {
            setActiveTab('intro');
        }
    }, [location.pathname, user]);

    const handleTabChange = (tab) => {
        // 기본 탭(intro)일 경우 URL 깔끔하게 유지
        if (tab === 'intro') {
            navigate(`/crew/detail/${crew.id}`);
        } else {
            navigate(`/crew/detail/${crew.id}/${tab}`);
        }
    };

    useEffect(() => {
        if (crew) {
            console.log('Crew data (full):', JSON.stringify(crew, null, 2));
            fetchMembers();
        }
    }, [crew]);

    useEffect(() => {
        const handleScroll = () => {
            if (tabRef.current) {
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                if (scrollTop >= tabOffsetRef.current) {
                    setIsTabFixed(true);
                } else {
                    setIsTabFixed(false);
                }
            }
        };

        if (tabRef.current) {
            tabOffsetRef.current = tabRef.current.offsetTop;
        }

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getAuthHeaders = () => {
        if (!user || !user.accessToken) return {};
        return {
            'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
        };
    };

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/members`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (members.length > 0 && user) {
            const myInfo = members.find(m => m.userId === user.id);
            if (myInfo) {
                setUserStatus(myInfo.status);
                setUserRole(myInfo.role);
            } else {
                setUserStatus(null);
                setUserRole(null);
            }
        }
    }, [members, user]);

    const handleJoin = async () => {
        if (!confirm(`${crew.name} 크루에 가입하시겠습니까?`)) return;
        try {
            setActionLoading(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/join`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                alert('가입 신청이 완료되었습니다.');
                fetchMembers();
                if (onUpdateUser) onUpdateUser();
            } else {
                const error = await response.text();
                alert(error);
            }
        } catch (error) {
            console.error('Join error:', error);
            alert('가입 신청 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm('정말로 크루를 탈퇴하시겠습니까?')) return;
        try {
            setActionLoading(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/leave`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                alert('탈퇴되었습니다.');
                fetchMembers();
                if (onUpdateUser) onUpdateUser();
            } else {
                const error = await response.text();
                alert(error);
            }
        } catch (error) {
            console.error('Leave error:', error);
            alert('탈퇴 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveMember = async (userId) => {
        setActionLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/members/${userId}/approve`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert('멤버를 승인했습니다.');
                fetchMembers();
            } else {
                alert('승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to approve member:', error);
            alert('승인 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectMember = async (userId) => {
        if (!window.confirm('정말 가입 요청을 거절하시겠습니까?')) return;

        setActionLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/members/${userId}/reject`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert('가입 요청을 거절했습니다.');
                fetchMembers();
            } else {
                alert('거절에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to reject member:', error);
            alert('거절 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    // 게시판 핸들러
    const handlePostClick = (post) => {
        navigate(`/crew/detail/${crew.id}/board/view/${post.id}`);
    };

    const handleCreatePost = () => {
        navigate(`/crew/detail/${crew.id}/board/write`);
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setBoardView('editor');
    };

    const handleBackToBoard = () => {
        navigate(`/crew/detail/${crew.id}/board`);
    };

    const handlePostComplete = () => {
        navigate(`/crew/detail/${crew.id}/board`);
    };

    const handleCourseClick = (course) => {
        navigate(`/crew/detail/${crew.id}/course/${course.id}`, { state: { course } });
    };

    const handleCloseCourseView = () => {
        navigate(-1);
    };

    // 크루 이미지 파싱
    let crewImage = { emoji: '🏃', bg: 'linear-gradient(135deg, #FF6B6B 0%, #C44569 100%)' };
    try {
        const parsed = JSON.parse(crew.imageUrl);
        if (parsed.url || parsed.emoji) {
            crewImage = parsed;
        }
    } catch {
        if (crew.imageUrl && crew.imageUrl.startsWith('http')) {
            crewImage = { url: crew.imageUrl };
        }
    }

    const isCaptain = (userRole === 'captain' || (crew.captainId && user && crew.captainId === user.id));

    // 게시판 상세/에디터 뷰
    if (activeTab === 'board' && boardView === 'detail' && selectedPost) {
        return (
            <PostDetailPage
                postId={selectedPost.id}
                crew={crew}
                user={user}
                onBack={handleBackToBoard}
                onEdit={handleEditPost}
            />
        );
    }

    if (activeTab === 'board' && boardView === 'editor') {
        return (
            <PostEditorPage
                crew={crew}
                user={user}
                post={editingPost}
                onCancel={handleBackToBoard}
                onComplete={handlePostComplete}
            />
        );
    }

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '80px' }}>
            {/* 상단 네비게이션 */}
            <div style={{
                backgroundColor: '#fff',
                padding: '12px 16px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div
                    onClick={onBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1a1a1a'
                    }}
                >
                    &lt; 목록으로
                </div>
            </div>

            {/* 오렌지 그라데이션 헤더 */}
            <div style={{
                background: 'linear-gradient(135deg, #FF9A56 0%, #FF6B45 100%)',
                padding: '20px 16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        background: crewImage.bg || '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.3)',
                        flexShrink: 0
                    }}>
                        {crewImage.url ? (
                            <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            crewImage.emoji || '🏃'
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: '800',
                            color: '#fff',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {crew.name}
                        </h1>
                    </div>
                    {isCaptain && (
                        <button
                            onClick={onEdit}
                            style={{
                                background: 'rgba(255,255,255,0.25)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0
                            }}
                        >
                            ⚙️
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>
                        멤버 {members.length}
                    </span>
                    <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>
                        누적거리 {crew.totalDistance ? `${crew.totalDistance.toFixed(0)}km` : '0km'}
                    </span>
                </div>
            </div>

            {/* 탭 메뉴 */}
            <div
                ref={tabRef}
                style={{
                    position: isTabFixed ? 'fixed' : 'relative',
                    top: isTabFixed ? 0 : 'auto',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    zIndex: isTabFixed ? 100 : 1
                }}
            >
                <button
                    onClick={() => handleTabChange('intro')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'intro' ? '3px solid #FF9A56' : '3px solid transparent',
                        fontSize: '15px',
                        fontWeight: activeTab === 'intro' ? '700' : '600',
                        color: activeTab === 'intro' ? '#FF9A56' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    소개
                </button>
                <button
                    onClick={() => handleTabChange('course')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'course' ? '3px solid #FF9A56' : '3px solid transparent',
                        fontSize: '15px',
                        fontWeight: activeTab === 'course' ? '700' : '600',
                        color: activeTab === 'course' ? '#FF9A56' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    코스
                </button>
                <button
                    onClick={() => handleTabChange('members')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'members' ? '3px solid #FF9A56' : '3px solid transparent',
                        fontSize: '15px',
                        fontWeight: activeTab === 'members' ? '700' : '600',
                        color: activeTab === 'members' ? '#FF9A56' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    멤버
                </button>
                <button
                    onClick={() => handleTabChange('notice')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'notice' ? '3px solid #FF9A56' : '3px solid transparent',
                        fontSize: '15px',
                        fontWeight: activeTab === 'notice' ? '700' : '600',
                        color: activeTab === 'notice' ? '#FF9A56' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    공지사항
                </button>
                <button
                    onClick={() => {
                        handleTabChange('board');
                        setBoardView('list');
                    }}
                    style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'board' ? '3px solid #FF9A56' : '3px solid transparent',
                        fontSize: '15px',
                        fontWeight: activeTab === 'board' ? '700' : '600',
                        color: activeTab === 'board' ? '#FF9A56' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    게시판
                </button>
            </div>

            {isTabFixed && <div style={{ height: '50px' }} />}

            {/* 탭 내용 */}
            <div style={{ backgroundColor: '#fff', minHeight: '400px' }}>
                {activeTab === 'intro' && (
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>크루 소개</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {crew.description || '크루 소개가 없습니다.'}
                        </p>

                        {/* 크루 활동 지역 */}
                        {(() => {
                            // 백엔드 버전에 따라 다른 필드 사용
                            const lat = crew.activityAreaLatitude || (crew.activityAreas && crew.activityAreas[0]?.latitude);
                            const lng = crew.activityAreaLongitude || (crew.activityAreas && crew.activityAreas[0]?.longitude);
                            const address = crew.activityAreaAddress || (crew.activityAreas && crew.activityAreas[0]?.adminLevelFull);

                            if (!lat || !lng) return null;

                            return (
                                <div style={{ marginTop: '24px' }}>
                                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>크루 활동 지역</h3>

                                    {/* 지도 이미지 */}
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        marginBottom: '12px',
                                        border: '1px solid #e0e0e0'
                                    }}>
                                        <img
                                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=600x400&markers=color:red%7C${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                                            alt="크루 활동 지역"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>

                                    {/* 주소 */}
                                    <div style={{
                                        padding: '12px 16px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{ fontSize: '16px' }}>📍</span>
                                        <span style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '500' }}>
                                            {address || `${lat}, ${lng}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div style={{ marginTop: '24px' }}>
                            {userRole ? (
                                userStatus === 'APPROVED' ? (
                                    <button
                                        onClick={handleLeave}
                                        disabled={actionLoading}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            backgroundColor: '#fff',
                                            border: '1px solid #dc2626',
                                            borderRadius: '12px',
                                            color: '#dc2626',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            opacity: actionLoading ? 0.6 : 1
                                        }}
                                    >
                                        {actionLoading ? '처리 중...' : '탈퇴하기'}
                                    </button>
                                ) : (
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#fffbeb',
                                        border: '1px solid #fcd34d',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        color: '#92400e',
                                        fontWeight: '600'
                                    }}>
                                        가입 승인 대기중
                                    </div>
                                )
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    disabled={actionLoading}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: actionLoading ? '#9ca3af' : '#FF9A56',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(255, 154, 86, 0.3)'
                                    }}
                                >
                                    {actionLoading ? '처리 중...' : '크루 가입하기'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'course' && (
                    <>
                        <CrewCourseTab
                            crew={crew}
                            user={user}
                            userRole={userRole}
                            onCourseClick={handleCourseClick}
                            onCourseCreate={() => navigate(`/crew/detail/${crew.id}/course/create`)}
                        />
                        {courseViewMode === 'detail' && selectedCourse && (
                            <CourseViewPage
                                course={selectedCourse}
                                onClose={handleCloseCourseView}
                            />
                        )}
                        {(courseViewMode === 'create_select' || courseViewMode === 'create_form') && (
                            <CourseSelectionPage
                                user={user}
                                crewId={crew.id}
                                onBack={() => navigate(-1)}
                                onSelectRecord={(record) => navigate(`/crew/detail/${crew.id}/course/write`, { state: { record } })}
                            />
                        )}
                        {courseViewMode === 'create_form' && (
                            <CourseCreatePage
                                user={user}
                                crewId={crew.id}
                                selectedRecord={location.state?.record}
                                onClose={() => navigate(-1)}
                                onSuccess={() => navigate(`/crew/detail/${crew.id}/course`)}
                            />
                        )}
                    </>
                )}

                {activeTab === 'members' && (
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>
                            크루 멤버 ({members.length})
                        </h3>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                로딩 중...
                            </div>
                        ) : members.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                아직 멤버가 없습니다.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {members.map(member => {
                                    // 프로필 이미지 파싱
                                    let profileImage = null;
                                    try {
                                        if (member.nicknameImage) {
                                            const parsed = JSON.parse(member.nicknameImage);
                                            profileImage = parsed.url || null;
                                        }
                                    } catch {
                                        if (member.nicknameImage && member.nicknameImage.startsWith('http')) {
                                            profileImage = member.nicknameImage;
                                        }
                                    }

                                    return (
                                        <div
                                            key={member.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '12px'
                                            }}
                                        >
                                            {/* 프로필 이미지 */}
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                backgroundColor: '#e0e0e0',
                                                flexShrink: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {profileImage ? (
                                                    <img src={profileImage} alt={member.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '24px' }}>👤</span>
                                                )}
                                            </div>

                                            {/* 멤버 정보 */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                                                        {member.nickname}
                                                    </span>
                                                    {member.role === 'captain' && (
                                                        <span style={{
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            color: '#FF9A56',
                                                            backgroundColor: 'rgba(255, 154, 86, 0.15)',
                                                            padding: '2px 8px',
                                                            borderRadius: '10px'
                                                        }}>
                                                            크루장
                                                        </span>
                                                    )}
                                                </div>
                                                {member.status === 'PENDING' && (
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '8px',
                                                        alignItems: 'center'
                                                    }}>
                                                        {userRole?.toUpperCase() === 'CAPTAIN' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApproveMember(member.userId)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#10b981',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    승인
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectMember(member.userId)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#ef4444',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    거절
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: '#f59e0b',
                                                                fontWeight: '600'
                                                            }}>
                                                                승인 대기중
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notice' && (
                    <div style={{ padding: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>공지사항이 없습니다</div>
                            <div style={{ fontSize: '14px' }}>크루장이 공지사항을 등록하면 여기에 표시됩니다.</div>
                        </div>
                    </div>
                )}

                {activeTab === 'board' && boardView === 'list' && (
                    <div>
                        <CrewBoardTab
                            crew={crew}
                            user={user}
                            onPostClick={handlePostClick}
                            onCreatePost={handleCreatePost}
                            onBack={() => setActiveTab('intro')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default CrewDetailPage;
