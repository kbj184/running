import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../utils/api';

function CrewDetailPage({ crew, user, onBack, onUpdateUser, onEdit, onViewBoard }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('intro'); // 'intro', 'notice', 'board'
    const [isTabFixed, setIsTabFixed] = useState(false);
    const tabRef = useRef(null);
    const tabOffsetRef = useRef(0);

    useEffect(() => {
        if (crew) {
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

        // 탭 위치 계산
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

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>
            {/* 상단 네비게이션 */}
            <div style={{
                backgroundColor: '#fff',
                padding: '16px 20px',
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
                {isCaptain && (
                    <button
                        onClick={onEdit}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        ⚙️
                    </button>
                )}
            </div>

            {/* 오렌지 그라데이션 헤더 - 여백 없이 */}
            <div style={{
                background: 'linear-gradient(135deg, #FF9A56 0%, #FF6B45 100%)',
                padding: '32px 20px 24px 20px'
            }}>
                {/* 크루 이미지와 이름 - 가로 배치 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        background: crewImage.bg || '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        border: '3px solid rgba(255,255,255,0.3)',
                        flexShrink: 0
                    }}>
                        {crewImage.url ? (
                            <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            crewImage.emoji || '🏃'
                        )}
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        flex: 1
                    }}>
                        {crew.name}
                    </h1>
                </div>

                {/* 멤버 및 누적거리 - 검정 텍스트, 테두리 없이 */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '600' }}>
                        멤버 {members.length}
                    </span>
                    <span style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '600' }}>
                        누적거리 {crew.totalDistance ? `${crew.totalDistance.toFixed(0)}km` : '0km'}
                    </span>
                </div>
            </div>

            {/* 탭 메뉴 - 스크롤 시 상단 고정 */}
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
                    onClick={() => setActiveTab('intro')}
                    style={{
                        flex: 1,
                        padding: '16px',
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
                    onClick={() => setActiveTab('notice')}
                    style={{
                        flex: 1,
                        padding: '16px',
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
                        setActiveTab('board');
                        if (onViewBoard) onViewBoard();
                    }}
                    style={{
                        flex: 1,
                        padding: '16px',
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

            {/* 탭이 고정될 때 공간 확보 */}
            {isTabFixed && <div style={{ height: '53px' }} />}

            {/* 탭 내용 */}
            <div style={{ backgroundColor: '#fff', minHeight: '400px' }}>
                {activeTab === 'intro' && (
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>크루 소개</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {crew.description || '크루 소개가 없습니다.'}
                        </p>

                        {/* 가입/탈퇴 버튼 */}
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

                {activeTab === 'notice' && (
                    <div style={{ padding: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>공지사항이 없습니다</div>
                            <div style={{ fontSize: '14px' }}>크루장이 공지사항을 등록하면 여기에 표시됩니다.</div>
                        </div>
                    </div>
                )}

                {activeTab === 'board' && (
                    <div style={{ padding: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>게시판으로 이동합니다</div>
                            <div style={{ fontSize: '14px' }}>잠시만 기다려주세요...</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CrewDetailPage;
