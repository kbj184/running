import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

function CrewDetailModal({ isOpen, onClose, crew, user }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [userRole, setUserRole] = useState(null); // 'captain', 'member', or null (not joined)

    useEffect(() => {
        if (isOpen && crew && user) {
            fetchMembers();
        }
    }, [isOpen, crew, user]);

    const fetchMembers = async () => {
        if (!crew) return;
        setLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/members`, {
                method: 'GET',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMembers(data);

                // Determine user's role
                const myMemberInfo = data.find(m => m.userId === user.id);
                setUserRole(myMemberInfo ? myMemberInfo.role : null);
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setActionLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                // Refresh members
                fetchMembers();
            } else {
                const error = await response.text();
                alert('가입 실패: ' + error);
            }
        } catch (error) {
            console.error('Join error:', error);
            alert('가입 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('정말 크루를 탈퇴하시겠습니까?')) return;

        setActionLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/leave`, {
                method: 'DELETE',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                // Refresh members or close modal?
                // Probably better to refresh to show user is gone, or close if they want.
                // Let's refresh first.
                fetchMembers();
                setUserRole(null);
            } else {
                const error = await response.text();
                alert('탈퇴 실패: ' + error);
            }
        } catch (error) {
            console.error('Leave error:', error);
            alert('탈퇴 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen || !crew) return null;

    // determine bg and emoji from crew.image (which might be parsed or raw)
    let crewImage = crew.image;
    // If it's not an object with emoji/bg, try to parse it or use default
    if (!crewImage || (!crewImage.emoji && !crewImage.url)) {
        try {
            crewImage = JSON.parse(crew.imageUrl);
        } catch {
            // Fallback if parsing fails or it's a raw URL string
            crewImage = { url: crew.imageUrl || '', bg: '#ddd', emoji: '🏃' };
        }
    }


    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }}>
            <style>
                {`
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .member-item:hover {
                        background-color: #f8f9fa;
                        transform: translateX(5px);
                    }
                `}
            </style>
            <div className="modal-content" style={{
                width: '90%',
                maxWidth: '550px',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: '0',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s ease-out',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '85vh'
            }}>
                {/* Header Section with Gradient */}
                <div style={{
                    background: crewImage.bg || '#333',
                    padding: '30px 24px',
                    color: 'white',
                    position: 'relative'
                }}>
                    <button onClick={onClose} style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(0,0,0,0.2)',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                    }}>✕</button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            fontSize: '48px',
                            background: 'rgba(255,255,255,0.2)',
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                        }}>
                            {crewImage.url ? (
                                <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                crewImage.emoji || '🏃'
                            )}
                        </div>
                        <div>
                            <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                opacity: 0.9,
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>Crew</div>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>{crew.name}</h2>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px', maxWidth: '300px' }}>
                                {crew.description || '설명이 없습니다.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>멤버</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>{members.length}명</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>개설일</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                                {new Date(crew.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div>
                        {userRole ? (
                            <button
                                onClick={handleLeave}
                                disabled={actionLoading || userRole === 'captain'}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #fee2e2',
                                    backgroundColor: '#fff',
                                    color: userRole === 'captain' ? '#ccc' : '#ef4444',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: userRole === 'captain' ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {actionLoading ? '처리 중...' : (userRole === 'captain' ? '크루장' : '탈퇴하기')}
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#1a1a1a',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {actionLoading ? '가입 중...' : '가입하기'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Members List */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                        멤버 목록 <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>({members.length})</span>
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>로딩 중...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {members.map((member) => (
                                <div key={member.userId} className="member-item" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #f0f0f0',
                                    transition: 'all 0.2s',
                                    cursor: 'default'
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
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                Runner {/* 등급 정보는 현재 DB에 없으므로 일단 고정 */}
                                            </div>
                                        </div>
                                    </div>
                                    {member.role === 'captain' && (
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#fa8231', background: '#fff0e6', padding: '4px 8px', borderRadius: '8px' }}>
                                            LEADER
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CrewDetailModal;
