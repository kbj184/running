import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

function CrewDetailPage({ crew, user, onBack, onUpdateUser, onEdit }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(null); // 'APPROVED', 'PENDING', null
    const [userRole, setUserRole] = useState(null); // 'captain', 'member', null
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (crew) {
            fetchMembers();
            checkMyStatus();
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

    const checkMyStatus = async () => {
        // members state update will trigger useEffect below
    };

    // members가 변경될 때 내 상태 확인
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

    const handleApprove = async (memberId) => {
        try {
            setActionLoading(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/members/${memberId}/approve`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                fetchMembers();
            }
        } catch (error) {
            console.error('Approve error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (memberId) => {
        if (!confirm('가입 요청을 거절하시겠습니까?')) return;
        try {
            setActionLoading(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/members/${memberId}/reject`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                fetchMembers();
            }
        } catch (error) {
            console.error('Reject error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Image Parsing Logic
    if (!crew) return null;

    let crewImage = crew.image;
    if (!crewImage || (!crewImage.emoji && !crewImage.url)) {
        try {
            crewImage = JSON.parse(crew.imageUrl);
        } catch {
            crewImage = { url: crew.imageUrl || '', bg: '#ddd', emoji: '🏃' };
        }
    }

    // Fallback if crewImage is still invalid
    if (!crewImage) crewImage = { bg: '#ddd', emoji: '🏃' };

    return (
        <div className="crew-detail-page" style={{
            minHeight: '100%',
            backgroundColor: '#fff',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10
        }}>
            {/* Header / Banner Area */}
            <div style={{
                background: crewImage.bg || '#333',
                padding: '24px',
                paddingTop: 'calc(var(--header-height) + 24px)', // 헤더 높이만큼 패딩 추가
                color: 'white',
                position: 'relative',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
            }}>
                {/* Back Button - Text Type */}
                <div
                    onClick={onBack}
                    style={{
                        position: 'absolute',
                        top: '80px',
                        left: '20px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)' // 가독성 확보
                    }}
                >
                    <span>&lt;</span> 목록으로
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        flexShrink: 0
                    }}>
                        {crewImage.url ? (
                            <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            crewImage.emoji || '🏃'
                        )}
                    </div>
                    <div style={{ marginBottom: '8px', flex: 1 }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            opacity: 0.9,
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>Crew</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', lineHeight: 1.2 }}>{crew.name}</h1>
                            {(userRole === 'captain' || (crew.captainId && user && crew.captainId === user.id)) && (
                                <button
                                    onClick={onEdit}
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'white',
                                        fontSize: '18px',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    ⚙️
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>소개</h3>
                    <p style={{ color: '#4b5563', lineHeight: 1.6, fontSize: '15px' }}>
                        {crew.description || '크루 소개글이 없습니다.'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>멤버</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>{members.length}명</div>
                    </div>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>누적 거리</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                            {crew.totalDistance ? crew.totalDistance.toFixed(0) : 0}km
                        </div>
                    </div>
                </div>

                {/* Join/Leave Action Area */}
                <div style={{ marginBottom: '32px' }}>
                    {userRole ? (
                        <div style={{
                            padding: '16px',
                            backgroundColor: userStatus === 'PENDING' ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${userStatus === 'PENDING' ? '#fcd34d' : '#86efac'}`,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ fontWeight: '600', color: userStatus === 'PENDING' ? '#92400e' : '#166534' }}>
                                    {userStatus === 'PENDING' ? '가입 승인 대기중' : '멤버입니다'}
                                </div>
                                <div style={{ fontSize: '12px', color: userStatus === 'PENDING' ? '#b45309' : '#15803d', marginTop: '2px' }}>
                                    {userRole === 'captain' ? '당신은 크루장입니다' : `가입일: ${new Date().toLocaleDateString()}`}
                                </div>
                            </div>

                            {userStatus === 'APPROVED' && (
                                <button
                                    onClick={handleLeave}
                                    disabled={actionLoading}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'white',
                                        border: '1px solid #dc2626',
                                        borderRadius: '8px',
                                        color: '#dc2626',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        opacity: actionLoading ? 0.6 : 1
                                    }}
                                >
                                    {actionLoading ? '처리 중...' : '탈퇴'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={actionLoading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: actionLoading ? '#9ca3af' : '#1a1a1a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: actionLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {actionLoading ? '처리 중...' : '크루 가입하기'}
                        </button>
                    )}
                </div>

                {/* Board Access Button - 승인된 멤버만 */}
                {userStatus === 'APPROVED' && onViewBoard && (
                    <div style={{ marginBottom: '32px' }}>
                        <button
                            onClick={onViewBoard}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: '#fff',
                                border: '2px solid #1a1a1a',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                color: '#1a1a1a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            📝 크루 게시판 보기
                        </button>
                    </div>
                )}

                {/* Members List */}
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>멤버 목록</span>
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>로딩 중...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {members.map((member) => (
                                <div key={member.userId} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f3f4f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {member.nicknameImage ? (
                                                <img src={member.nicknameImage} alt={member.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '20px' }}>🏃</span>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '15px' }}>
                                                {member.nickname}
                                                {member.userId === user.id && <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }}>(나)</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                                {member.role === 'captain' && (
                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#fa8231', background: '#fff0e6', padding: '2px 6px', borderRadius: '4px' }}>
                                                        LEADER
                                                    </span>
                                                )}
                                                {member.status === 'PENDING' && (
                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#92400e', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                                                        승인 대기
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 승인/거절 버튼 (크루장만) */}
                                    {userRole === 'captain' && member.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleApprove(member.id)}
                                                disabled={actionLoading}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                승인
                                            </button>
                                            <button
                                                onClick={() => handleReject(member.id)}
                                                disabled={actionLoading}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                거절
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div >
            {/* 하단 여백 */}
            < div style={{ height: '80px' }
            }></div >
        </div >
    );
}

export default CrewDetailPage;
