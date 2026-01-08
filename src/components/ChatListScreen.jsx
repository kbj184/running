import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function ChatListScreen() {
    const navigate = useNavigate();
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChatRooms();
    }, []);

    const fetchChatRooms = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('running_user'));
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/chat/rooms`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setChatRooms(data);
            }
        } catch (error) {
            console.error('Failed to fetch chat rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoomClick = (roomId) => {
        navigate(`/chat/${roomId}`);
    };

    const handleBack = () => {
        navigate('/'); // Go to home instead of -1
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;

        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 9999,
            overflow: 'auto'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #FF9A56 0%, #FF6B45 100%)',
                padding: '16px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <button
                        onClick={handleBack}
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
                            color: '#fff',
                            padding: 0
                        }}
                    >
                        ←
                    </button>
                    <h1 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        메시지
                    </h1>
                </div>
            </div>

            {/* Chat List */}
            <div style={{ padding: '0' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        로딩 중...
                    </div>
                ) : chatRooms.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '80px 20px',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                            아직 대화가 없습니다
                        </div>
                        <div style={{ fontSize: '14px', color: '#bbb' }}>
                            프로필에서 메시지를 보내보세요
                        </div>
                    </div>
                ) : (
                    chatRooms.map(room => (
                        <div
                            key={room.roomId}
                            onClick={() => handleRoomClick(room.roomId)}
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {/* Profile Image */}
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                flexShrink: 0,
                                overflow: 'hidden'
                            }}>
                                {room.otherUserImage ? (
                                    <img
                                        src={room.otherUserImage}
                                        alt={room.otherUserNickname}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    '👤'
                                )}
                            </div>

                            {/* Chat Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '4px'
                                }}>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1a1a1a'
                                    }}>
                                        {room.otherUserNickname}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#999'
                                    }}>
                                        {formatTime(room.lastMessageDate)}
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#666',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                    }}>
                                        {room.lastMessage || '대화를 시작해보세요'}
                                    </div>
                                    {room.unreadCount > 0 && (
                                        <div style={{
                                            backgroundColor: '#FF9A56',
                                            color: '#fff',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            marginLeft: '8px',
                                            minWidth: '20px',
                                            textAlign: 'center'
                                        }}>
                                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ChatListScreen;
