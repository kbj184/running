import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

function CrewDetailPage({ crew, user, onBack, onUpdateUser, onEdit, onViewBoard }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (crew) {
            fetchMembers();
        }
    }, [crew]);

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

            {/* 오렌지 그라데이션 헤더 */}
            <div style={{
                background: 'linear-gradient(135deg, #FF9A56 0%, #FF6B45 100%)',
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '16px'
            }}>
                {/* 크루 이미지 */}
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
                    border: '3px solid rgba(255,255,255,0.3)'
                }}>
                    {crewImage.url ? (
                        <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        crewImage.emoji || '🏃'
                    )}
                </div>

                {/* 크루 이름 */}
                <h1 style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: '800',
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {crew.name}
                </h1>

                {/* 통계 배지 */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>멤버</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{members.length}</span>
                    </div>
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>누적거리</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                            {crew.totalDistance ? `${crew.totalDistance.toFixed(0)}km` : '0km'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 소개 섹션 */}
            <div style={{ backgroundColor: '#fff', padding: '20px', margin: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>소개</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {crew.description || '크루 소개가 없습니다.'}
                </p>
            </div>

            {/* 게시판 버튼 - 승인된 멤버만 */}
            {userStatus === 'APPROVED' && onViewBoard && (
                <div style={{ padding: '0 20px', marginBottom: '16px' }}>
                    <button
                        onClick={onViewBoard}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#fff',
                            border: '2px solid #FF9A56',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            color: '#FF9A56',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                    >
                        📝 크루 게시판
                    </button>
                </div>
            )}

            {/* 가입/탈퇴 버튼 */}
            <div style={{ padding: '0 20px' }}>
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
    );
}

export default CrewDetailPage;
