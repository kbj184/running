import React from 'react';

function CrewDetailModal({ isOpen, onClose, crew }) {
    if (!isOpen || !crew) return null;

    // 모의 멤버 데이터 (실제로는 DB나 상태에서 관리해야 함)
    const members = [
        { id: 'me', name: '나 (User)', role: crew.role, grade: 'pro', joinDate: crew.createdAt },
        // 시각적 예시를 위한 가상 멤버들
        { id: 'm1', name: 'Running Mate 1', role: 'member', grade: 'advanced', joinDate: new Date().toISOString() },
        { id: 'm2', name: 'Pace Maker', role: 'member', grade: 'elite', joinDate: new Date().toISOString() },
    ];

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
                    background: crew.image.bg,
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
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            {crew.image.emoji}
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
                    gap: '40px'
                }}>
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
                    <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>내 역할</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#1a1a1a',
                            background: '#f0f0f0',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            display: 'inline-block',
                            marginTop: '2px'
                        }}>
                            {crew.role === 'captain' ? '👑 크루장' : '멤버'}
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                        멤버 목록 <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>({members.length})</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {members.map((member) => (
                            <div key={member.id} className="member-item" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid #f0f0f0',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: member.grade === 'elite' ? '#ff6b81' : member.grade === 'pro' ? '#70a1ff' : '#2ed573',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        color: 'white',
                                        border: '2px solid white',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}>
                                        {member.role === 'captain' ? '👑' : '🏃'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '15px' }}>{member.name}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            {member.grade === 'elite' ? 'ELITE' : member.grade === 'pro' ? 'PRO' : 'ADVANCED'} Runner
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
                </div>
            </div>
        </div>
    );
}

export default CrewDetailModal;
